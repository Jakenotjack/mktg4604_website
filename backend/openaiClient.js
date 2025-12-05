/**
 * OpenAI Client Module
 * Initializes and exports the OpenAI client instance
 */

import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables from .env file (for local development)
// On Railway/cloud, env vars are injected automatically
dotenv.config();

// Check for API key - warn but don't crash (allows server to start for health checks)
if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️  WARNING: OPENAI_API_KEY is not set in environment variables");
  console.warn("   Storyboard generation will fail until API key is configured");
  console.warn("   For local dev: create backend/.env with OPENAI_API_KEY=sk-...");
  console.warn("   For Railway: add OPENAI_API_KEY in the Variables tab");
}

// Initialize OpenAI client (will fail gracefully on API calls if no key)
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "missing-key",
});

// Export for testing/verification
export function testConnection() {
  if (process.env.OPENAI_API_KEY) {
    console.log("✅ OpenAI client initialized successfully");
    console.log("API Key:", process.env.OPENAI_API_KEY.substring(0, 8) + "...");
  } else {
    console.log("❌ OpenAI client NOT configured - missing API key");
  }
}

