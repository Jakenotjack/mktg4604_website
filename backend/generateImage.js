/**
 * Image Generation Module
 * Uses DALL-E 3 to generate images from scene descriptions
 */

import { openai } from "./openaiClient.js";

/**
 * List of words/phrases that may trigger DALL-E content filters
 * These will be replaced with safer alternatives
 */
const CONTENT_FILTER_REPLACEMENTS = [
  // Violence-related
  { pattern: /\b(blood|bloody|bleeding)\b/gi, replacement: "red marks" },
  { pattern: /\b(gore|gory|guts)\b/gi, replacement: "intense" },
  { pattern: /\b(wound|wounded|wounds)\b/gi, replacement: "injured" },
  { pattern: /\b(mutilat|sever|dismember)/gi, replacement: "hurt" },
  { pattern: /\b(kill|killing|killed|murder|murdered)\b/gi, replacement: "defeated" },
  { pattern: /\b(dead body|corpse|carcass)\b/gi, replacement: "fallen figure" },
  { pattern: /\b(stab|stabbing|stabbed)\b/gi, replacement: "struck" },
  { pattern: /\b(shoot|shooting|shot|gun|rifle|pistol)\b/gi, replacement: "attacked" },
  { pattern: /\b(decapitat|behead)\w*/gi, replacement: "defeated" },
  { pattern: /\b(torture|torturing|tortured)\b/gi, replacement: "struggling" },
  
  // Horror-related (that might be too graphic)
  { pattern: /\b(horror|horrific|terrifying)\b/gi, replacement: "dramatic" },
  { pattern: /\b(gruesome|macabre)\b/gi, replacement: "dark" },
  { pattern: /\b(nightmare|nightmarish)\b/gi, replacement: "dreamlike" },
  
  // Suggestive content
  { pattern: /\b(naked|nude|undress|unclothed)\b/gi, replacement: "dressed simply" },
  { pattern: /\b(sexy|seductive|sensual)\b/gi, replacement: "elegant" },
  { pattern: /\b(lingerie|underwear)\b/gi, replacement: "clothing" },
  
  // Self-harm related
  { pattern: /\b(suicide|suicidal)\b/gi, replacement: "in distress" },
  { pattern: /\b(self-harm|cutting)\b/gi, replacement: "struggling" },
  
  // Drug-related
  { pattern: /\b(drug|drugs|cocaine|heroin|meth)\b/gi, replacement: "substance" },
  { pattern: /\b(inject|injecting|syringe)\b/gi, replacement: "using" },
  
  // Hate/extremism
  { pattern: /\b(nazi|swastika|kkk)\b/gi, replacement: "" },
  { pattern: /\b(terrorist|terrorism)\b/gi, replacement: "conflict" },
];

/**
 * Sanitizes a prompt to remove/replace content that may trigger DALL-E filters
 * @param {string} prompt - The original prompt
 * @returns {string} Sanitized prompt
 */
function sanitizePrompt(prompt) {
  let sanitized = prompt;
  let replacementsMade = [];
  
  for (const { pattern, replacement } of CONTENT_FILTER_REPLACEMENTS) {
    const matches = sanitized.match(pattern);
    if (matches) {
      replacementsMade.push(`"${matches[0]}" → "${replacement}"`);
      sanitized = sanitized.replace(pattern, replacement);
    }
  }
  
  if (replacementsMade.length > 0) {
    console.log(`   ⚠️  Content filter applied: ${replacementsMade.join(', ')}`);
  }
  
  return sanitized;
}

/**
 * Generates an image for a scene using DALL-E 3
 * @param {Object} scene - Scene object with dalle_prompt and aspect_ratio
 * @param {string} globalStyle - Global style to apply to the image
 * @param {Array} mainCharacters - Array of main character descriptions for consistency
 * @returns {Promise<string>} URL of the generated image
 */
export async function generateSceneImage(scene, globalStyle, mainCharacters = []) {
  // Build character summary for consistency across all images
  const characterSummary = mainCharacters
    .map(c => `${c.name}: ${c.description}`)
    .join('\n');

  // Build the full prompt with character bible and style guide
  let fullPrompt = `
A single picture from a consistent story.

Characters (keep them looking the same in every picture of this story):
${characterSummary}

Overall picture style for the whole story:
${globalStyle}

Visual description for this picture:
${scene.dalle_prompt}
`.trim();

  // Sanitize the prompt to avoid content filter issues
  fullPrompt = sanitizePrompt(fullPrompt);
  
  // Map aspect ratio to DALL-E 3 size
  const size =
    scene.aspect_ratio === "landscape"
      ? "1792x1024"
      : scene.aspect_ratio === "portrait"
      ? "1024x1792"
      : "1024x1024";
  
  console.log(`🎨 Generating image for Scene ${scene.id}: ${scene.title}`);
  console.log(`   Size: ${size}`);
  
  // Log the full prompt for debugging
  console.log(`   📝 FULL PROMPT FOR SCENE ${scene.id}:`);
  console.log("   " + "-".repeat(50));
  console.log(fullPrompt.split('\n').map(line => `   ${line}`).join('\n'));
  console.log("   " + "-".repeat(50));
  
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: fullPrompt,
      n: 1, // DALL-E 3 only allows 1 image per request
      size: size,
      quality: "standard", // "standard" or "hd"
      style: "vivid", // "vivid" or "natural"
    });
    
    const imageUrl = response.data[0].url;
    console.log(`✅ Image generated successfully`);
    
    return imageUrl;
  } catch (error) {
    console.error(`❌ Error generating image for scene ${scene.id}:`, error.message);
    console.error(`   💡 Prompt that failed:`);
    console.error(fullPrompt.split('\n').map(line => `      ${line}`).join('\n'));
    throw new Error(`Image generation failed for scene ${scene.id}: ${error.message}`);
  }
}

/**
 * Generates images for all scenes in parallel (with error handling per scene)
 * @param {Array} scenes - Array of scene objects
 * @param {string} globalStyle - Global style to apply
 * @param {Array} mainCharacters - Array of main character descriptions for consistency
 * @returns {Promise<Array>} Array of scenes with image_url added
 */
export async function generateAllImages(scenes, globalStyle, mainCharacters = []) {
  console.log(`\n🖼️  Generating ${scenes.length} images in parallel...`);
  
  const imagePromises = scenes.map(async (scene) => {
    try {
      const imageUrl = await generateSceneImage(scene, globalStyle, mainCharacters);
      return {
        ...scene,
        image_url: imageUrl,
        error: null
      };
    } catch (error) {
      console.error(`Scene ${scene.id} failed, continuing with others...`);
      return {
        ...scene,
        image_url: null,
        error: error.message
      };
    }
  });
  
  const results = await Promise.all(imagePromises);
  
  const successCount = results.filter(r => r.image_url).length;
  const failCount = results.filter(r => !r.image_url).length;
  
  console.log(`\n✅ Image generation complete: ${successCount} succeeded, ${failCount} failed`);
  
  return results;
}

