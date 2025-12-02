/**
 * Scene Planning Module
 * Uses GPT to convert a story into structured scene descriptions for DALL-E
 */

import { openai } from "./openaiClient.js";

/**
 * Plans scenes from a story using GPT
 * @param {Object} request - Storyboard request
 * @param {string} request.story - The story text
 * @param {number} request.numScenes - Number of scenes to generate (default: 8)
 * @param {string} request.style - Optional style hint (e.g., "storybook watercolor")
 * @returns {Promise<Object>} Storyboard plan with global_style and scenes array
 */
export async function planScenes({ story, numScenes = 8, style = "" }) {
  const userPrompt = `You are a storyboard artist for image generation.
You turn stories into visual scenes for DALL·E 3.

Rules:
- Output VALID JSON only, no extra text.
- Create exactly ${numScenes} scenes.
- Each scene must be a clearly different story beat in both time AND visuals.
- Do NOT create two scenes that depict almost the same moment with only small changes.
- If two candidate scenes feel like variations of the same event, merge them into a single, stronger scene.

CHARACTER CONSISTENCY RULES:
- Keep characters' appearance and age consistent across scenes unless the story clearly describes a time jump.
- For each main character, the description must include:
  - approximate age at the start of the story,
  - body type,
  - EXACT skin tone (e.g., "light beige skin", "warm brown skin", "pale ivory skin", "deep ebony skin", "olive tan skin") - be specific!
  - face shape and notable facial features,
  - hair style and color,
  - usual clothing and color palette,
  - any distinctive props (glasses, necklace, staff, robot arm, etc.).
  This description forms the "canonical look" of the character.

- SKIN COLOR CONSISTENCY IS CRITICAL: The exact same skin tone phrase must appear in every dalle_prompt where that character appears. Do not vary the wording - use the identical phrase each time.

TIME JUMP RULES:
- If the story explicitly includes time jumps (e.g. "ten years later", "when she grows up"):
  - Treat it as the SAME character at a later age.
  - In the scenes after the time jump, describe the character as older, but keep recognizable features: same skin tone, same hair color, same face shape, same key prop, etc.
  - Do NOT oscillate ages: once the character is older, keep them older in all later scenes unless the story explicitly jumps back in time.
  - Do NOT invent age changes that aren't in the story.

STYLE RULES:
- Include a single global_style string describing overall art style.
- All scenes must share one coherent picture style:
  - same artistic medium (e.g. watercolor, digital painting, comic style),
  - same rendering quality (e.g. detailed, sketchy),
  - same general color palette and lighting sensibility.
- Unless the story strongly suggests otherwise, choose ONE aspect_ratio that works best overall and reuse it for every scene (typically "square"). Only vary it when it clearly helps the storytelling.

SCENE CONSTRUCTION RULES:
- Create exactly ${numScenes} scenes with consecutive integer IDs starting from 1.
- Each scene focuses on ONE clear visual moment in time.
- "title": 3–8 words describing the moment (clear, not cute).
- "short_caption": 1 concise sentence describing what is happening.
- "aspect_ratio": "landscape" for wide/cinematic, "portrait" for close-ups, "square" when neither is dominant.

DALLE_PROMPT RULES (critical for DALL·E):
- Each dalle_prompt must be self-contained, explicit, and visually distinct from the others.
- Never assume the model has read the story; it only sees this prompt.
- Each dalle_prompt must:
  - mention the relevant main characters by name and FULLY describe their appearance including their EXACT skin tone (copy verbatim from main_characters),
  - describe the setting (indoor/outdoor, environment, time of day),
  - describe the mood and lighting (e.g. warm sunset light, cold moonlight),
  - describe the composition / camera angle (e.g. wide shot, close-up, overhead view),
  - reinforce the global_style.

- When you mention a main character in a dalle_prompt:
  - Reuse the same age and core physical traits described in main_characters, unless this scene is clearly after a time jump.
  - If this scene is after a time jump, explicitly say it is the older version of the same character, keeping the same skin tone, facial features, and hair color.
  - Do NOT invent new ages for the same character (e.g. "10-year-old" in one scene and "17-year-old" in another) unless the story explicitly demands it.

- Do NOT mention the words "panel", "image", "illustration" or "scene" inside any dalle_prompt text.
- Do NOT include technical parameters (no mentions of "resolution", "aspect ratio 16:9", etc.).

CONTENT SAFETY RULES (CRITICAL - DALL·E will reject prompts that violate these):
- NEVER use graphic violence language: no "blood", "gore", "guts", "wounds", "mutilated", "severed", "decapitated", "stabbed", "shot".
  Instead use: "injured", "hurt", "fallen", "defeated", "struck", "in danger".
- NEVER use sexual or suggestive language: no "naked", "nude", "sexy", "seductive", "lingerie".
  Instead use: "dressed simply", "elegant", "graceful".
- NEVER use self-harm or suicide language. Instead use: "in distress", "struggling", "troubled".
- NEVER use drug paraphernalia language. Instead use: "substance", "potion", "elixir" (for fantasy).
- NEVER use hate symbols or extremist references.
- For children/minors: Keep ALL descriptions age-appropriate.
- For horror/dark stories: Use atmospheric language ("eerie", "mysterious", "shadowy") not graphic language.

Story:
"""
${story}
"""

Number of scenes: ${numScenes}

Preferred style${style ? `: "${style}"` : ' (optional): ""'}

Use the preferred style if it is non-empty by incorporating it into global_style.
If it is empty, choose a style that best fits the story and keep it consistent across all scenes.

Return JSON with this exact shape:
{
  "global_style": "string",
  "main_characters": [
    {
      "name": "string",
      "description": "age, body type, exact skin tone, face shape, hair style/color, clothing, props"
    }
  ],
  "scenes": [
    {
      "id": 1,
      "title": "3-8 word title",
      "short_caption": "one-sentence caption",
      "dalle_prompt": "2-4 sentences of detailed visual description",
      "aspect_ratio": "square" | "portrait" | "landscape"
    }
  ]
}

Chronological & visual progression rules:
- Scene 1 should establish the character(s) and setting.
- Each following scene must move the story forward in time or situation.
- Never have two consecutive scenes that describe the same location, time, and action with only minor differences.

Constraints:
- Output VALID JSON only.
- Do NOT wrap the JSON in backticks or code fences.
- Do NOT add any extra keys, comments, or explanations.`;

  console.log(`\n📝 Planning ${numScenes} scenes for story (${story.length} chars)...`);
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using gpt-4o-mini as it's more available than gpt-4.1-mini
      response_format: { type: "json_object" }, // JSON mode for structured output
      messages: [
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    const jsonContent = completion.choices[0].message.content;
    const plan = JSON.parse(jsonContent);
    
    // Validate structure
    if (!plan.global_style || !plan.scenes || !Array.isArray(plan.scenes)) {
      throw new Error("Invalid JSON structure from GPT");
    }
    
    console.log(`✅ Generated ${plan.scenes.length} scenes`);
    console.log(`🎨 Style: ${plan.global_style}`);
    
    return plan;
  } catch (error) {
    console.error("❌ Error planning scenes:", error.message);
    throw new Error(`Scene planning failed: ${error.message}`);
  }
}

