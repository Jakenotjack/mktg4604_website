/**
 * Storyboard Generator API Server
 * Main Express server with /api/storyboard and /api/gallery endpoints
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { planScenes } from "./planScenes.js";
import { generateAllImages } from "./generateImage.js";
import { 
  publishToGallery, 
  getGalleryWorks, 
  getWorkById, 
  setWorkVisibility,
  deleteWork,
  getImagesDir 
} from "./galleryStore.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for frontend
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies

// Serve static images from the gallery
app.use("/images", express.static(getImagesDir()));

// Serve frontend static files (HTML, CSS, JS)
const frontendDir = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendDir));

// Health check endpoint (API info)
app.get("/api", (req, res) => {
  res.json({
    status: "ok",
    message: "STORYBRD API",
    endpoints: {
      storyboard: "POST /api/storyboard",
      gallery: "GET /api/gallery",
      galleryWork: "GET /api/gallery/:id",
      publish: "POST /api/gallery/publish"
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

// ============================================
// GALLERY ENDPOINTS
// ============================================

/**
 * GET /api/gallery - Get all gallery works
 * Query params: limit, offset
 */
app.get("/api/gallery", (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const result = getGalleryWorks({ limit, offset });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Error fetching gallery:", error.message);
    res.status(500).json({
      success: false,
      error: "GALLERY_ERROR",
      message: error.message
    });
  }
});

/**
 * GET /api/gallery/:id - Get a single work by ID
 */
app.get("/api/gallery/:id", (req, res) => {
  try {
    const work = getWorkById(req.params.id);
    
    if (!work) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Work not found"
      });
    }
    
    res.json({
      success: true,
      work
    });
  } catch (error) {
    console.error("Error fetching work:", error.message);
    res.status(500).json({
      success: false,
      error: "GALLERY_ERROR",
      message: error.message
    });
  }
});

/**
 * POST /api/gallery/publish - Publish a storyboard to the gallery
 */
app.post("/api/gallery/publish", async (req, res) => {
  try {
    const {
      userName,
      userAvatar,
      title,
      description,
      globalStyle,
      mainCharacters,
      scenes
    } = req.body;
    
    // Validate required fields
    if (!userName || typeof userName !== "string" || userName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "BAD_REQUEST",
        message: "userName is required"
      });
    }
    
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return res.status(400).json({
        success: false,
        error: "BAD_REQUEST",
        message: "scenes array is required and must not be empty"
      });
    }
    
    // Check that at least one scene has an image
    const hasImages = scenes.some(s => s.image_url);
    if (!hasImages) {
      return res.status(400).json({
        success: false,
        error: "BAD_REQUEST",
        message: "At least one scene must have an image"
      });
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("📤 Publishing to gallery...");
    console.log(`   User: ${userName}`);
    console.log(`   Title: ${title || "Untitled"}`);
    console.log("=".repeat(60));
    
    const work = await publishToGallery({
      userName: userName.trim(),
      userAvatar,
      title: title || "Untitled Story",
      description: description || "",
      globalStyle: globalStyle || "",
      mainCharacters: mainCharacters || [],
      scenes
    });
    
    console.log("✅ Published successfully!");
    
    res.json({
      success: true,
      work: {
        id: work.id,
        title: work.title,
        createdAt: work.createdAt
      },
      message: "Storyboard published to gallery!"
    });
    
  } catch (error) {
    console.error("Error publishing to gallery:", error.message);
    res.status(500).json({
      success: false,
      error: "PUBLISH_ERROR",
      message: error.message
    });
  }
});

/**
 * PATCH /api/gallery/:id/visibility - Update work visibility (moderation)
 */
app.patch("/api/gallery/:id/visibility", (req, res) => {
  try {
    const { visible } = req.body;
    
    if (typeof visible !== "boolean") {
      return res.status(400).json({
        success: false,
        error: "BAD_REQUEST",
        message: "visible must be a boolean"
      });
    }
    
    const success = setWorkVisibility(req.params.id, visible);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Work not found"
      });
    }
    
    res.json({
      success: true,
      message: `Work visibility set to ${visible}`
    });
  } catch (error) {
    console.error("Error updating visibility:", error.message);
    res.status(500).json({
      success: false,
      error: "UPDATE_ERROR",
      message: error.message
    });
  }
});

/**
 * DELETE /api/gallery/:id - Delete a work from the gallery
 */
app.delete("/api/gallery/:id", (req, res) => {
  try {
    const success = deleteWork(req.params.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Work not found"
      });
    }
    
    res.json({
      success: true,
      message: "Work deleted"
    });
  } catch (error) {
    console.error("Error deleting work:", error.message);
    res.status(500).json({
      success: false,
      error: "DELETE_ERROR",
      message: error.message
    });
  }
});

// Catch-all: serve index.html for any non-API routes (SPA support)
app.get("*", (req, res) => {
  // If it's an API route that wasn't matched, return 404 JSON
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      error: "NOT_FOUND",
      message: `Endpoint ${req.method} ${req.path} not found`
    });
  }
  // Otherwise serve the frontend
  res.sendFile(path.join(frontendDir, "index.html"));
});

// Start server - bind to 0.0.0.0 for Railway/cloud hosting
app.listen(PORT, "0.0.0.0", () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 Storyboard Generator API Server");
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🔑 API Key configured: ${process.env.OPENAI_API_KEY ? "✅ Yes" : "❌ No"}`);
  console.log("=".repeat(60) + "\n");
});

export default app;

