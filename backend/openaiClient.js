/**
 * OpenAI Client Module
 * Initializes and exports the OpenAI client instance
 */

import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Validate API key exists
if (!process.env.OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY is not set in environment variables");
  console.error("Please create a .env file with your OpenAI API key");
  process.exit(1);
}

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Export for testing/verification
export function testConnection() {
  console.log("✅ OpenAI client initialized successfully");
  console.log("API Key:", process.env.OPENAI_API_KEY.substring(0, 8) + "...");
}

