/**
 * Gallery Page JavaScript
 * Handles loading and displaying community storyboards
 */

// Configuration
// Use relative URL - works both locally and when deployed
const API_URL = "";

// DOM Elements
const loadingSection = document.getElementById("loadingSection");
const emptySection = document.getElementById("emptySection");
const errorSection = document.getElementById("errorSection");
const errorMessage = document.getElementById("errorMessage");
const retryBtn = document.getElementById("retryBtn");
const galleryGrid = document.getElementById("galleryGrid");
const loadMoreContainer = document.getElementById("loadMoreContainer");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const detailModal = document.getElementById("detailModal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.querySelector(".modal-close");
const modalBackdrop = document.querySelector(".modal-backdrop");

// State
let currentOffset = 0;
const LIMIT = 12;
let isLoading = false;
let hasMore = true;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    console.log("🎨 Gallery initialized");
    loadGallery();
});

// ============================================
// EVENT LISTENERS
// ============================================
retryBtn.addEventListener("click", () => {
    currentOffset = 0;
    loadGallery();
});

loadMoreBtn.addEventListener("click", loadMore);

modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);

// Close modal on Escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !detailModal.classList.contains("hidden")) {
        closeModal();
    }
});

// ============================================
// LOAD GALLERY
// ============================================
async function loadGallery() {
    if (isLoading) return;
    
    isLoading = true;
    showLoading();
    hideError();
    
    try {
        const response = await fetch(`${API_URL}/api/gallery?limit=${LIMIT}&offset=${currentOffset}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || "Failed to load gallery");
        }
        
        hideLoading();
        
        if (data.works.length === 0 && currentOffset === 0) {
            showEmpty();
            return;
        }
        
        renderWorks(data.works, currentOffset === 0);
        hasMore = data.hasMore;
        
        if (hasMore) {
            loadMoreContainer.classList.remove("hidden");
        } else {
            loadMoreContainer.classList.add("hidden");
        }
        
        galleryGrid.classList.remove("hidden");
        
    } catch (error) {
        console.error("Error loading gallery:", error);
        hideLoading();
        showError(error.message);
    } finally {
        isLoading = false;
    }
}

async function loadMore() {
    currentOffset += LIMIT;
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = "Loading...";
    
    await loadGallery();
    
    loadMoreBtn.disabled = false;
    loadMoreBtn.textContent = "Load More";
}

// ============================================
// RENDER WORKS
// ============================================
function renderWorks(works, clear = false) {
    if (clear) {
        galleryGrid.innerHTML = "";
    }
    
    works.forEach(work => {
        const card = createWorkCard(work);
        galleryGrid.appendChild(card);
    });
}

function createWorkCard(work) {
    const card = document.createElement("article");
    card.className = "work-card";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `View ${work.title} by ${work.user.name}`);
    
    // Format date
    const date = new Date(work.createdAt);
    const dateStr = date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric" 
    });
    
    // Get preview images (up to 4)
    const previewImages = work.scenes
        .filter(s => s.imageUrl)
        .slice(0, 4);
    
    card.innerHTML = `
        <div class="work-header">
            <div class="user-avatar">
                ${work.user.avatar 
                    ? `<img src="${work.user.avatar}" alt="${work.user.name}">`
                    : work.user.initials
                }
            </div>
            <div class="user-info">
                <div class="user-name">${escapeHtml(work.user.name)}</div>
                <div class="work-date">${dateStr}</div>
            </div>
        </div>
        <div class="work-body">
            <h3 class="work-title">${escapeHtml(work.title)}</h3>
            ${work.description ? `<p class="work-description">${escapeHtml(work.description)}</p>` : ""}
        </div>
        <div class="work-preview">
            ${previewImages.map(scene => `
                <img 
                    class="preview-image" 
                    src="${API_URL}${scene.imageUrl}" 
                    alt="${escapeHtml(scene.title)}"
                    loading="lazy"
                    onerror="this.style.display='none'"
                >
            `).join("")}
        </div>
        <div class="work-footer">
            <span class="work-scenes">🖼️ ${work.scenes.length} scenes</span>
            ${work.globalStyle ? `<span class="work-style">${truncate(work.globalStyle, 20)}</span>` : ""}
        </div>
    `;
    
    // Click handler
    card.addEventListener("click", () => openDetail(work));
    card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDetail(work);
        }
    });
    
    return card;
}

// ============================================
// DETAIL MODAL
// ============================================
function openDetail(work) {
    const date = new Date(work.createdAt);
    const dateStr = date.toLocaleDateString("en-US", { 
        month: "long", 
        day: "numeric",
        year: "numeric"
    });
    
    modalBody.innerHTML = `
        <div class="detail-header">
            <div class="detail-avatar">
                ${work.user.avatar 
                    ? `<img src="${work.user.avatar}" alt="${work.user.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
                    : work.user.initials
                }
            </div>
            <div class="detail-info">
                <h2>${escapeHtml(work.title)}</h2>
                <p class="detail-meta">by ${escapeHtml(work.user.name)} • ${dateStr}</p>
            </div>
        </div>
        
        ${work.globalStyle ? `<p class="detail-style">Art style: ${escapeHtml(work.globalStyle)}</p>` : ""}
        
        <div class="detail-scenes">
            ${work.scenes.map(scene => `
                <div class="detail-scene">
                    <span class="scene-badge">Scene ${scene.id}</span>
                    <h3>${escapeHtml(scene.title)}</h3>
                    ${scene.imageUrl 
                        ? `<img 
                            class="detail-scene-image" 
                            src="${API_URL}${scene.imageUrl}" 
                            alt="${escapeHtml(scene.title)}"
                            loading="lazy"
                           >`
                        : `<div class="scene-error">Image not available</div>`
                    }
                    ${scene.caption ? `<p class="detail-scene-caption">${escapeHtml(scene.caption)}</p>` : ""}
                </div>
            `).join("")}
        </div>
    `;
    
    detailModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    
    // Focus the close button for accessibility
    modalClose.focus();
}

function closeModal() {
    detailModal.classList.add("hidden");
    document.body.style.overflow = "";
}

// ============================================
// UI STATE HELPERS
// ============================================
function showLoading() {
    loadingSection.classList.remove("hidden");
    emptySection.classList.add("hidden");
    errorSection.classList.add("hidden");
}

function hideLoading() {
    loadingSection.classList.add("hidden");
}

function showEmpty() {
    emptySection.classList.remove("hidden");
    galleryGrid.classList.add("hidden");
    loadMoreContainer.classList.add("hidden");
}

function showError(message) {
    errorMessage.textContent = message;
    errorSection.classList.remove("hidden");
    galleryGrid.classList.add("hidden");
    loadMoreContainer.classList.add("hidden");
}

function hideError() {
    errorSection.classList.add("hidden");
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function truncate(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
}

console.log("✅ Gallery ready");

