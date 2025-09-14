/**
 * Homepage Controller
 * Manages the main landing page with authentication buttons and featured listings carousel
 */

import { isAuthenticated } from "../library/auth.js";
// ...existing code...
import { CarouselController } from "../components/carousel.js";

// DOM element references for homepage components
const elements = {
  homeAuthButtons: document.getElementById("home-auth-buttons"),
  homeLoading: document.getElementById("home-loading"),
  homeError: document.getElementById("home-error"),
  listingsCarousel: document.getElementById("listings-carousel"),
  noListings: document.getElementById("no-listings"),
  mainContent: document.getElementById("main-content"),
};

/**
 * Authentication button renderer
 * Shows appropriate buttons based on user login status
 */
const AuthButtonRenderer = {
  render() {
    if (!elements.homeAuthButtons) return;

    if (isAuthenticated()) {
      this.renderAuthenticatedButtons();
    } else {
      this.renderUnauthenticatedButtons();
    }
  },

  /**
   * Renders buttons for logged-in users
   * Shows browse auctions with user-specific styling
   */
  renderAuthenticatedButtons() {
    elements.homeAuthButtons.innerHTML = `
      <div class="text-center">
        <a href="/listings.html" class="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
          Browse Auctions
        </a>
      </div>
    `;
  },

  /**
   * Renders buttons for non-authenticated users
   * Shows general browse option
   */
  renderUnauthenticatedButtons() {
    elements.homeAuthButtons.innerHTML = `
      <div class="text-center">
        <a href="/listings.html" class="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
          Browse Auctions
        </a>
      </div>
    `;
  },
};

/**
 * Main page initializer
 * Coordinates all homepage functionality
 */
const PageInitializer = {
  init() {
    if (!elements.mainContent) return;

    AuthButtonRenderer.render();
    CarouselController.load(elements);
    this.setupEventListeners();
  },

  /**
   * Sets up global event listeners
   * Handles authentication state changes
   */
  setupEventListeners() {
    // Listen for authentication changes in other tabs
    window.addEventListener("storage", (e) => {
      if (e.key === "token" || e.key === "user") {
        AuthButtonRenderer.render();
      }
    });
  },
};

// Initialize homepage when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  PageInitializer.init();
});

export { PageInitializer };
