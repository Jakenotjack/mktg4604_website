/**
 * Test script for OpenAI client connection
 */

import { openai, testConnection } from "./openaiClient.js";

async function runTest() {
  console.log("=== Testing OpenAI Client ===\n");
  
  // Test 1: Client initialization
  testConnection();
  
  // Test 2: Simple API call
  console.log("\nTesting API connection with simple completion...");
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say 'Hello, OpenAI!' in one sentence." }
      ],
      max_tokens: 50
    });
    
    console.log("✅ API call successful!");
    console.log("Response:", completion.choices[0].message.content);
    console.log("\n=== All tests passed! ===");
    return true;
  } catch (error) {
    console.error("❌ API call failed:", error.message);
    if (error.status === 401) {
      console.error("Invalid API key. Please check your OPENAI_API_KEY in .env file");
    }
    return false;
  }
}

// Run tests
runTest().then(success => {
  process.exit(success ? 0 : 1);
});

