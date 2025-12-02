/**
 * Storyboard Generator Frontend
 * Handles user interactions and API communication
 */

// Configuration
const API_URL = "http://localhost:3001/api/storyboard";

// DOM Elements
const storyTextarea = document.getElementById("story");
const numScenesInput = document.getElementById("numScenes");
const styleInput = document.getElementById("style");
const generateBtn = document.getElementById("generateBtn");
const loadingSection = document.getElementById("loadingSection");
const errorSection = document.getElementById("errorSection");
const errorMessage = document.getElementById("errorMessage");
const resultsSection = document.getElementById("resultsSection");
const globalStyleEl = document.getElementById("globalStyle");
const metadataEl = document.getElementById("metadata");
const scenesGrid = document.getElementById("scenesGrid");

// Sample stories for quick testing
const sampleStories = [
    "Once upon a time, there was a young girl named Luna who lived in a small village. One day, she discovered a magical key hidden in her grandmother's attic. When she touched the key, it began to glow with a golden light. The key led her to a secret garden behind the old oak tree. In the garden, she met a wise old owl who told her she was chosen to protect the village. Luna accepted her destiny and returned home as the new guardian.",
];

// Initialize
window.addEventListener("DOMContentLoaded", () => {
    console.log("Storyboard Generator initialized");
    
    // Add sample story if textarea is empty
    if (!storyTextarea.value) {
        storyTextarea.value = sampleStories[0];
    }
});

// Event Listeners
generateBtn.addEventListener("click", handleGenerate);

storyTextarea.addEventListener("input", () => {
    updateButtonState();
});

// Functions
function updateButtonState() {
    const hasStory = storyTextarea.value.trim().length >= 10;
    generateBtn.disabled = !hasStory;
}

async function handleGenerate() {
    const story = storyTextarea.value.trim();
    const numScenes = parseInt(numScenesInput.value) || 6;
    const style = styleInput.value.trim();

    // Validate
    if (story.length < 10) {
        showError("Please enter a story with at least 10 characters.");
        return;
    }

    // Hide previous results/errors
    hideAllSections();
    showLoading();

    try {
        console.log("Sending request to API...");
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
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        if (!response.ok) {
            throw new Error(data.message || `Server error: ${response.status}`);
        }

        console.log("Storyboard received:", data);
        displayResults(data, duration);

    } catch (error) {
        console.error("Error:", error);
        hideLoading();
        
        let errorMsg = error.message;
        
        // Provide helpful error messages
        if (error.message.includes("Failed to fetch")) {
            errorMsg = "Cannot connect to the server. Make sure the backend server is running on http://localhost:3001";
        } else if (error.message.includes("API key")) {
            errorMsg = "OpenAI API key is not configured. Please add your API key to the backend/.env file.";
        }
        
        showError(errorMsg);
    }
}

function showLoading() {
    loadingSection.classList.remove("hidden");
}

function hideLoading() {
    loadingSection.classList.add("hidden");
}

function showError(message) {
    errorMessage.textContent = message;
    errorSection.classList.remove("hidden");
}

function hideAllSections() {
    loadingSection.classList.add("hidden");
    errorSection.classList.add("hidden");
    resultsSection.classList.add("hidden");
}

function displayResults(data, duration) {
    hideLoading();

    // Display global style
    globalStyleEl.textContent = `Style: ${data.global_style}`;

    // Display metadata
    const meta = data.metadata;
    metadataEl.innerHTML = `
        ⏱️ Generated in ${duration}s | 
        🖼️ ${meta.successful_images}/${meta.total_scenes} images created
        ${meta.failed_images > 0 ? ` | ⚠️ ${meta.failed_images} failed` : ""}
    `;

    // Clear previous scenes
    scenesGrid.innerHTML = "";

    // Render each scene
    data.scenes.forEach((scene) => {
        const sceneCard = createSceneCard(scene);
        scenesGrid.appendChild(sceneCard);
    });

    // Show results section
    resultsSection.classList.remove("hidden");
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function createSceneCard(scene) {
    const card = document.createElement("div");
    card.className = "scene-card";

    const header = document.createElement("div");
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

    // Image or error
    if (scene.image_url) {
        const img = document.createElement("img");
        img.className = "scene-image";
        img.src = scene.image_url;
        img.alt = scene.title;
        img.loading = "lazy";
        card.appendChild(img);
    } else {
        const errorDiv = document.createElement("div");
        errorDiv.className = "scene-error";
        errorDiv.textContent = `⚠️ Image generation failed${scene.error ? `: ${scene.error}` : ""}`;
        card.appendChild(errorDiv);
    }

    // Show DALL-E prompt (expandable)
    if (scene.dalle_prompt) {
        const promptDetails = document.createElement("details");
        promptDetails.className = "scene-prompt";

        const summary = document.createElement("summary");
        summary.textContent = "View DALL-E Prompt";

        const promptText = document.createElement("p");
        promptText.textContent = scene.dalle_prompt;

        promptDetails.appendChild(summary);
        promptDetails.appendChild(promptText);
        card.appendChild(promptDetails);
    }

    return card;
}

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + Enter to generate
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!generateBtn.disabled) {
            handleGenerate();
        }
    }
});

console.log("✅ Frontend initialized. Press Ctrl+Enter to generate storyboard.");

