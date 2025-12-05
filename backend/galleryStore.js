/**
 * Gallery Store Module
 * Handles storage and retrieval of published storyboards
 * Uses JSON file storage for simplicity (can be upgraded to database later)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage paths
const DATA_DIR = path.join(__dirname, "data");
const GALLERY_FILE = path.join(DATA_DIR, "gallery.json");
const IMAGES_DIR = path.join(DATA_DIR, "images");

// Ensure directories exist
function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log("📁 Created data directory");
  }
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    console.log("📁 Created images directory");
  }
}

// Initialize storage
ensureDirectories();

/**
 * Load gallery data from JSON file
 * @returns {Object} Gallery data with works array
 */
function loadGallery() {
  try {
    if (fs.existsSync(GALLERY_FILE)) {
      const data = fs.readFileSync(GALLERY_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading gallery:", error.message);
  }
  return { works: [] };
}

/**
 * Save gallery data to JSON file
 * @param {Object} gallery - Gallery data to save
 */
function saveGallery(gallery) {
  try {
    fs.writeFileSync(GALLERY_FILE, JSON.stringify(gallery, null, 2));
  } catch (error) {
    console.error("Error saving gallery:", error.message);
    throw new Error("Failed to save gallery data");
  }
}

/**
 * Generate a unique ID for a work
 * @returns {string} Unique ID
 */
function generateId() {
  return crypto.randomBytes(8).toString("hex");
}

/**
 * Generate initials from a name
 * @param {string} name - User name
 * @returns {string} Initials (1-2 characters)
 */
function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Download an image from URL and save locally
 * @param {string} url - Image URL to download
 * @param {string} workId - Work ID for filename
 * @param {number} sceneIndex - Scene index for filename
 * @returns {Promise<string>} Local path to saved image
 */
export async function downloadImage(url, workId, sceneIndex) {
  return new Promise((resolve, reject) => {
    const filename = `${workId}_scene_${sceneIndex}.png`;
    const filepath = path.join(IMAGES_DIR, filename);
    
    // Choose http or https based on URL
    const client = url.startsWith("https") ? https : http;
    
    const file = fs.createWriteStream(filepath);
    
    client.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(filepath);
        downloadImage(response.headers.location, workId, sceneIndex)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download image: HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on("finish", () => {
        file.close();
        console.log(`   💾 Saved: ${filename}`);
        resolve(`/images/${filename}`);
      });
      
      file.on("error", (err) => {
        file.close();
        fs.unlinkSync(filepath);
        reject(err);
      });
    }).on("error", (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

/**
 * Download all images for a storyboard
 * @param {Array} scenes - Array of scene objects with image_url
 * @param {string} workId - Work ID for filenames
 * @returns {Promise<Array>} Scenes with local_image_url added
 */
export async function downloadAllImages(scenes, workId) {
  console.log(`\n📥 Downloading ${scenes.length} images for permanent storage...`);
  
  const results = await Promise.all(
    scenes.map(async (scene, index) => {
      if (!scene.image_url) {
        return { ...scene, local_image_url: null };
      }
      
      try {
        const localPath = await downloadImage(scene.image_url, workId, index + 1);
        return { ...scene, local_image_url: localPath };
      } catch (error) {
        console.error(`   ❌ Failed to download scene ${index + 1}:`, error.message);
        return { ...scene, local_image_url: null };
      }
    })
  );
  
  const successCount = results.filter(r => r.local_image_url).length;
  console.log(`✅ Downloaded ${successCount}/${scenes.length} images`);
  
  return results;
}

/**
 * Publish a storyboard to the gallery
 * @param {Object} params - Publish parameters
 * @param {string} params.userName - User's display name
 * @param {string} params.userAvatar - Optional avatar URL
 * @param {string} params.title - Story title
 * @param {string} params.description - Short description
 * @param {string} params.globalStyle - Art style used
 * @param {Array} params.mainCharacters - Character descriptions
 * @param {Array} params.scenes - Scene data with images
 * @returns {Promise<Object>} Published work object
 */
export async function publishToGallery({
  userName,
  userAvatar = null,
  title,
  description = "",
  globalStyle,
  mainCharacters = [],
  scenes
}) {
  const workId = generateId();
  
  console.log(`\n📤 Publishing storyboard to gallery...`);
  console.log(`   Work ID: ${workId}`);
  console.log(`   User: ${userName}`);
  console.log(`   Title: ${title}`);
  
  // Download images to permanent storage
  const scenesWithLocalImages = await downloadAllImages(scenes, workId);
  
  // Create work object
  const work = {
    id: workId,
    user: {
      name: userName,
      initials: getInitials(userName),
      avatar: userAvatar
    },
    title: title || "Untitled Story",
    description: description || "",
    globalStyle,
    mainCharacters,
    scenes: scenesWithLocalImages.map(scene => ({
      id: scene.id,
      title: scene.title,
      caption: scene.short_caption,
      imageUrl: scene.local_image_url, // Use local URL
      originalUrl: scene.image_url,     // Keep original for reference
      aspectRatio: scene.aspect_ratio
    })),
    createdAt: new Date().toISOString(),
    visible: true, // For moderation - can be set to false to hide
    featured: false
  };
  
  // Load existing gallery and add new work
  const gallery = loadGallery();
  gallery.works.unshift(work); // Add to beginning (newest first)
  saveGallery(gallery);
  
  console.log(`✅ Published to gallery: ${work.id}`);
  
  return work;
}

/**
 * Get all visible works from the gallery
 * @param {Object} options - Query options
 * @param {number} options.limit - Max number of works to return
 * @param {number} options.offset - Offset for pagination
 * @param {boolean} options.includeHidden - Include hidden works (for admin)
 * @returns {Object} Gallery data with works array and total count
 */
export function getGalleryWorks({ limit = 20, offset = 0, includeHidden = false } = {}) {
  const gallery = loadGallery();
  
  let works = gallery.works;
  
  // Filter hidden works unless admin
  if (!includeHidden) {
    works = works.filter(w => w.visible !== false);
  }
  
  const total = works.length;
  const paginatedWorks = works.slice(offset, offset + limit);
  
  return {
    works: paginatedWorks,
    total,
    limit,
    offset,
    hasMore: offset + limit < total
  };
}

/**
 * Get a single work by ID
 * @param {string} id - Work ID
 * @param {boolean} includeHidden - Include hidden works
 * @returns {Object|null} Work object or null if not found
 */
export function getWorkById(id, includeHidden = false) {
  const gallery = loadGallery();
  const work = gallery.works.find(w => w.id === id);
  
  if (!work) return null;
  if (!includeHidden && work.visible === false) return null;
  
  return work;
}

/**
 * Update work visibility (for moderation)
 * @param {string} id - Work ID
 * @param {boolean} visible - New visibility state
 * @returns {boolean} Success
 */
export function setWorkVisibility(id, visible) {
  const gallery = loadGallery();
  const work = gallery.works.find(w => w.id === id);
  
  if (!work) return false;
  
  work.visible = visible;
  saveGallery(gallery);
  
  console.log(`${visible ? "👁️" : "🙈"} Work ${id} visibility set to ${visible}`);
  return true;
}

/**
 * Delete a work from the gallery
 * @param {string} id - Work ID
 * @returns {boolean} Success
 */
export function deleteWork(id) {
  const gallery = loadGallery();
  const index = gallery.works.findIndex(w => w.id === id);
  
  if (index === -1) return false;
  
  const work = gallery.works[index];
  
  // Delete associated images
  work.scenes.forEach(scene => {
    if (scene.imageUrl) {
      const imagePath = path.join(__dirname, "data", scene.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
  });
  
  // Remove from gallery
  gallery.works.splice(index, 1);
  saveGallery(gallery);
  
  console.log(`🗑️ Deleted work ${id}`);
  return true;
}

/**
 * Get the absolute path to the images directory
 * @returns {string} Images directory path
 */
export function getImagesDir() {
  return IMAGES_DIR;
}

