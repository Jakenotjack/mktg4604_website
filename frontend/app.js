/**
 * Storyboard Generator Frontend
 * Mobile-first, responsive design with progress tracking
 */

// Configuration
// Use relative URL - works both locally and when deployed
const API_BASE = "";
const API_URL = `${API_BASE}/api/storyboard`;

// DOM Elements
const storyTextarea = document.getElementById("story");
const numScenesSelect = document.getElementById("numScenes");
const styleSelect = document.getElementById("style");
const generateBtn = document.getElementById("generateBtn");
const loadingSection = document.getElementById("loadingSection");
const loadingText = document.getElementById("loadingText");
const loadingDetail = document.getElementById("loadingDetail");
const loadingStep = document.getElementById("loadingStep");
const progressFill = document.getElementById("progressFill");
const errorSection = document.getElementById("errorSection");
const errorMessage = document.getElementById("errorMessage");
const retryBtn = document.getElementById("retryBtn");
const resultsSection = document.getElementById("resultsSection");
const globalStyleEl = document.getElementById("globalStyle");
const metadataEl = document.getElementById("metadata");
const scenesGrid = document.getElementById("scenesGrid");

// Sample story for quick testing
const sampleStory = `Once upon a time, there was a young girl named Luna who lived in a small village at the edge of an enchanted forest. One sunny morning, she discovered a mysterious golden key hidden in her grandmother's dusty attic.

When Luna touched the key, it began to glow with a warm, magical light. Curious and brave, she followed a trail of sparkles that led her deep into the forest.

The key guided her to an ancient stone door covered in ivy. When she inserted the key, the door creaked open to reveal a secret garden filled with flowers that sang and butterflies made of starlight.

In the center of the garden stood a wise old owl perched on a crystal fountain. "Welcome, Luna," the owl said. "You have been chosen to be the guardian of this magical realm."

Luna accepted her destiny with courage. She returned to her village as the new protector, visiting the secret garden whenever the forest needed her help.`;

// State
let isGenerating = false;
let currentStoryboardData = null; // Store the last generated storyboard for publishing

// ============================================
// INITIALIZATION
// ============================================
window.addEventListener("DOMContentLoaded", () => {
    console.log("🎬 Storyboard Generator initialized");
    
    // Pre-fill with sample story
    if (!storyTextarea.value.trim()) {
        storyTextarea.value = sampleStory;
    }
    
    updateButtonState();
});

// ============================================
// EVENT LISTENERS
// ============================================
generateBtn.addEventListener("click", handleGenerate);
retryBtn.addEventListener("click", handleRetry);

storyTextarea.addEventListener("input", updateButtonState);

// Keyboard shortcut: Ctrl/Cmd + Enter to generate
document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!generateBtn.disabled && !isGenerating) {
            handleGenerate();
        }
    }
});

// ============================================
// BUTTON STATE
// ============================================
function updateButtonState() {
    const hasStory = storyTextarea.value.trim().length >= 10;
    generateBtn.disabled = !hasStory || isGenerating;
}

// ============================================
// GENERATE HANDLER
// ============================================
async function handleGenerate() {
    if (isGenerating) return;
    
    const story = storyTextarea.value.trim();
    const numScenes = parseInt(numScenesSelect.value) || 6;
    const style = styleSelect.value;

    // Validate
    if (story.length < 10) {
        showError("Please enter a story with at least 10 characters.");
        return;
    }

    // Start generation
    isGenerating = true;
    hideAllSections();
    showLoading(numScenes);
    updateButtonState();

    try {
        console.log("📤 Sending request to API...");
        const startTime = Date.now();

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                story,
                numScenes,
                style,
            }),
        });

        const data = await response.json();
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        if (!response.ok) {
            throw new Error(data.message || `Server error: ${response.status}`);
        }

        console.log("✅ Storyboard received:", data);
        
        // Store the data for publishing
        currentStoryboardData = data;
        
        // Reset publish form for new storyboard
        resetPublishForm();
        
        displayResults(data, duration);

    } catch (error) {
        console.error("❌ Error:", error);
        
        let errorMsg = error.message;
        
        // User-friendly error messages
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            errorMsg = "Cannot connect to the server. Please make sure the server is running.";
        } else if (error.message.includes("API key")) {
            errorMsg = "OpenAI API key is not configured. Please add your API key to backend/.env file.";
        } else if (error.message.includes("rate limit")) {
            errorMsg = "OpenAI rate limit reached. Please wait a moment and try again.";
        } else if (error.message.includes("content filters")) {
            errorMsg = "Some content was blocked by safety filters. Try simplifying your story or avoiding potentially sensitive themes.";
        }
        
        showError(errorMsg);
    } finally {
        isGenerating = false;
        updateButtonState();
    }
}

// ============================================
// RETRY HANDLER
// ============================================
function handleRetry() {
    hideAllSections();
    // Scroll back to input
    storyTextarea.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ============================================
// LOADING UI
// ============================================
function showLoading(numScenes) {
    loadingSection.classList.remove("hidden");
    updateLoadingState("planning", 0, numScenes);
}

function updateLoadingState(phase, current, total) {
    if (phase === "planning") {
        loadingText.textContent = "Planning your storyboard...";
        loadingDetail.textContent = "AI is analyzing your story and creating scene descriptions";
        loadingStep.textContent = "Step 1 of 2: Scene Planning";
        progressFill.style.width = "20%";
    } else if (phase === "generating") {
        loadingText.textContent = `Generating images...`;
        loadingDetail.textContent = `Creating scene ${current} of ${total}`;
        loadingStep.textContent = "Step 2 of 2: Image Generation";
        const progress = 20 + (80 * (current / total));
        progressFill.style.width = `${progress}%`;
    } else if (phase === "complete") {
        loadingText.textContent = "Almost done!";
        loadingDetail.textContent = "Preparing your storyboard";
        loadingStep.textContent = "Finishing up...";
        progressFill.style.width = "100%";
    }
}

function hideLoading() {
    loadingSection.classList.add("hidden");
}

// ============================================
// ERROR UI
// ============================================
function showError(message) {
    hideLoading();
    errorMessage.textContent = message;
    errorSection.classList.remove("hidden");
    errorSection.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ============================================
// HIDE ALL SECTIONS
// ============================================
function hideAllSections() {
    loadingSection.classList.add("hidden");
    errorSection.classList.add("hidden");
    resultsSection.classList.add("hidden");
}

// ============================================
// DISPLAY RESULTS
// ============================================
function displayResults(data, duration) {
    hideLoading();

    // Display global style
    globalStyleEl.textContent = `Art Style: ${data.global_style}`;

    // Display metadata
    const meta = data.metadata;
    const successRate = meta.total_scenes > 0 
        ? Math.round((meta.successful_images / meta.total_scenes) * 100) 
        : 0;
    
    metadataEl.innerHTML = `
        <span>⏱️ ${duration}s</span>
        <span>•</span>
        <span>🖼️ ${meta.successful_images}/${meta.total_scenes} images</span>
        ${meta.failed_images > 0 ? `<span>•</span><span>⚠️ ${meta.failed_images} failed</span>` : ""}
    `;

    // Clear previous scenes
    scenesGrid.innerHTML = "";

    // Render each scene
    data.scenes.forEach((scene, index) => {
        const sceneCard = createSceneCard(scene, index);
        scenesGrid.appendChild(sceneCard);
    });

    // Show results section
    resultsSection.classList.remove("hidden");
    
    // Scroll to results with a slight delay for smooth animation
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
}

// ============================================
// CREATE SCENE CARD
// ============================================
function createSceneCard(scene, index) {
    const card = document.createElement("article");
    card.className = "scene-card";
    card.setAttribute("aria-label", `Scene ${scene.id}: ${scene.title}`);

    // Header
    const header = document.createElement("header");
    header.className = "scene-header";

    const sceneNumber = document.createElement("span");
    sceneNumber.className = "scene-number";
    sceneNumber.textContent = `Scene ${scene.id}`;

    const title = document.createElement("h3");
    title.className = "scene-title";
    title.textContent = scene.title;

    const caption = document.createElement("p");
    caption.className = "scene-caption";
    caption.textContent = scene.short_caption;

    header.appendChild(sceneNumber);
    header.appendChild(title);
    header.appendChild(caption);
    card.appendChild(header);

    // Image or Error
    if (scene.image_url) {
        const imageContainer = document.createElement("div");
        imageContainer.className = "scene-image-container loading";

        const img = document.createElement("img");
        img.className = "scene-image";
        img.src = scene.image_url;
        img.alt = `${scene.title} - ${scene.short_caption}`;
        img.loading = "lazy"; // Native lazy loading
        img.decoding = "async"; // Async decoding for performance
        
        // Remove loading state when image loads
        img.onload = () => {
            imageContainer.classList.remove("loading");
        };
        
        img.onerror = () => {
            imageContainer.classList.remove("loading");
            imageContainer.innerHTML = `
                <div class="scene-error">
                    ⚠️ Image failed to load. It may have expired.
                </div>
            `;
        };

        imageContainer.appendChild(img);
        card.appendChild(imageContainer);
    } else {
        const errorDiv = document.createElement("div");
        errorDiv.className = "scene-error";
        errorDiv.innerHTML = `
            ⚠️ Image generation failed
            ${scene.error ? `<br><small>${truncateError(scene.error)}</small>` : ""}
        `;
        card.appendChild(errorDiv);
    }

    // DALL-E Prompt (expandable details)
    if (scene.dalle_prompt) {
        const promptDetails = document.createElement("details");
        promptDetails.className = "scene-prompt";

        const summary = document.createElement("summary");
        summary.textContent = "View AI Prompt";

        const promptText = document.createElement("p");
        promptText.textContent = scene.dalle_prompt;

        promptDetails.appendChild(summary);
        promptDetails.appendChild(promptText);
        card.appendChild(promptDetails);
    }

    return card;
}

// ============================================
// PUBLISH FUNCTIONALITY
// ============================================
const publishBtn = document.getElementById("publishBtn");
const userNameInput = document.getElementById("userName");
const storyTitleInput = document.getElementById("storyTitle");
const publishStatus = document.getElementById("publishStatus");

if (publishBtn) {
    publishBtn.addEventListener("click", handlePublish);
}

async function handlePublish() {
    if (!currentStoryboardData) {
        showPublishStatus("error", "No storyboard to publish. Generate one first!");
        return;
    }
    
    const userName = userNameInput.value.trim();
    const storyTitle = storyTitleInput.value.trim();
    
    if (!userName) {
        showPublishStatus("error", "Please enter your name.");
        userNameInput.focus();
        return;
    }
    
    if (!storyTitle) {
        showPublishStatus("error", "Please enter a title for your storyboard.");
        storyTitleInput.focus();
        return;
    }
    
    // Disable button and show loading
    publishBtn.disabled = true;
    publishBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Publishing...</span>';
    showPublishStatus("loading", "Saving your storyboard to the gallery...");
    
    try {
        const response = await fetch(`${API_BASE}/api/gallery/publish`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userName,
                title: storyTitle,
                description: "", // Could add a description field later
                globalStyle: currentStoryboardData.global_style,
                mainCharacters: currentStoryboardData.main_characters,
                scenes: currentStoryboardData.scenes
            }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || "Failed to publish");
        }
        
        showPublishStatus("success", "🎉 Published! Your storyboard is now in the gallery.");
        
        // Update button to show success
        publishBtn.innerHTML = '<span class="btn-icon">✅</span><span class="btn-text">Published!</span>';
        
        // Add link to view in gallery
        setTimeout(() => {
            publishStatus.innerHTML += ' <a href="gallery.html" style="color: inherit; text-decoration: underline;">View Gallery →</a>';
        }, 500);
        
    } catch (error) {
        console.error("Publish error:", error);
        showPublishStatus("error", `Failed to publish: ${error.message}`);
        
        // Re-enable button
        publishBtn.disabled = false;
        publishBtn.innerHTML = '<span class="btn-icon">🚀</span><span class="btn-text">Publish to Gallery</span>';
    }
}

function showPublishStatus(type, message) {
    publishStatus.textContent = message;
    publishStatus.className = `publish-status ${type}`;
    publishStatus.classList.remove("hidden");
}

function resetPublishForm() {
    if (publishBtn) {
        publishBtn.disabled = false;
        publishBtn.innerHTML = '<span class="btn-icon">🚀</span><span class="btn-text">Publish to Gallery</span>';
    }
    if (publishStatus) {
        publishStatus.classList.add("hidden");
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function truncateError(error, maxLength = 100) {
    if (error.length <= maxLength) return error;
    return error.substring(0, maxLength) + "...";
}

// ============================================
// READY
// ============================================
console.log("✅ Frontend ready. Press Ctrl+Enter to generate storyboard.");
