/**
 * Test script for scene planning
 */

import { planScenes } from "./planScenes.js";

const testStory = `Once upon a time, there was a young girl named Luna who lived in a small village. 
One day, she discovered a magical key hidden in her grandmother's attic. 
When she touched the key, it began to glow with a golden light. 
The key led her to a secret garden behind the old oak tree. 
In the garden, she met a wise old owl who told her she was chosen to protect the village. 
Luna accepted her destiny and returned home as the new guardian.`;

async function runTest() {
  console.log("=== Testing Scene Planning ===\n");
  
  try {
    const plan = await planScenes({
      story: testStory,
      numScenes: 6,
      style: "children's storybook watercolor, whimsical"
    });
    
    console.log("\n=== Generated Plan ===");
    console.log(`Global Style: ${plan.global_style}\n`);
    
    if (plan.main_characters) {
      console.log("Main Characters:");
      plan.main_characters.forEach(char => {
        console.log(`  - ${char.name}: ${char.description}`);
      });
      console.log();
    }
    
    console.log("Scenes:");
    plan.scenes.forEach(scene => {
      console.log(`\nScene ${scene.id}: ${scene.title}`);
      console.log(`  Caption: ${scene.short_caption}`);
      console.log(`  Aspect Ratio: ${scene.aspect_ratio}`);
      console.log(`  DALL-E Prompt: ${scene.dalle_prompt.substring(0, 100)}...`);
    });
    
    console.log("\n✅ Scene planning test passed!");
    return true;
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    return false;
  }
}

runTest().then(success => {
  process.exit(success ? 0 : 1);
});

