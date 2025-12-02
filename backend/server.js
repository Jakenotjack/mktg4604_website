/**
 * Storyboard Generator API Server
 * Main Express server with /api/storyboard endpoint
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { planScenes } from "./planScenes.js";
import { generateAllImages } from "./generateImage.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for frontend
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Storyboard Generator API",
    endpoints: {
      storyboard: "POST /api/storyboard"
    }
  });
});

// Main storyboard generation endpoint
app.post("/api/storyboard", async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { story, numScenes = 8, style = "" } = req.body;

    // Validate input
    if (!story || typeof story !== "string") {
      return res.status(400).json({
        error: "BAD_REQUEST",
        message: "Missing or invalid 'story' field. Must be a non-empty string."
      });
    }

    if (story.length < 10) {
      return res.status(400).json({
        error: "BAD_REQUEST",
        message: "Story is too short. Please provide at least 10 characters."
      });
    }

    if (numScenes < 1 || numScenes > 12) {
      return res.status(400).json({
        error: "BAD_REQUEST",
        message: "numScenes must be between 1 and 12"
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log("📖 New storyboard request received");
    console.log(`   Story length: ${story.length} characters`);
    console.log(`   Number of scenes: ${numScenes}`);
    console.log(`   Style: ${style || "(auto)"}`);
    console.log("=".repeat(60));

    // Step 1: Plan scenes with GPT
    console.log("\n🤖 Step 1: Planning scenes with GPT...");
    const plan = await planScenes({ story, numScenes, style });

    // Step 2: Generate images with DALL-E 3
    console.log("\n🎨 Step 2: Generating images with DALL-E 3...");
    const scenesWithImages = await generateAllImages(plan.scenes, plan.global_style, plan.main_characters || []);

    // Step 3: Prepare response
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const successCount = scenesWithImages.filter(s => s.image_url).length;
    
    console.log("\n" + "=".repeat(60));
    console.log(`✅ Storyboard complete in ${duration}s`);
    console.log(`   ${successCount}/${scenesWithImages.length} images generated successfully`);
    console.log("=".repeat(60) + "\n");

    // Return the storyboard
    res.json({
      success: true,
      global_style: plan.global_style,
      main_characters: plan.main_characters || [],
      scenes: scenesWithImages,
      metadata: {
        duration_seconds: parseFloat(duration),
        total_scenes: scenesWithImages.length,
        successful_images: successCount,
        failed_images: scenesWithImages.length - successCount
      }
    });

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.error("\n❌ Error processing storyboard request:", error.message);
    console.error("Stack:", error.stack);

    // Determine error type
    let statusCode = 500;
    let errorCode = "INTERNAL_ERROR";
    
    if (error.message.includes("API key")) {
      statusCode = 401;
      errorCode = "INVALID_API_KEY";
    } else if (error.message.includes("rate limit")) {
      statusCode = 429;
      errorCode = "RATE_LIMIT_EXCEEDED";
    }

    res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: error.message,
      metadata: {
        duration_seconds: parseFloat(duration)
      }
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 Storyboard Generator API Server");
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`🔑 API Key configured: ${process.env.OPENAI_API_KEY ? "✅ Yes" : "❌ No"}`);
  console.log("=".repeat(60) + "\n");
});

export default app;

