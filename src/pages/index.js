/**
 * Homepage Controller
 * Manages the main landing page with authentication buttons and featured listings carousel
 * Handles responsive design and dynamic content loading
 */

import { isAuthenticated } from "../library/auth.js";
import { createListingCard } from "./listings.js";
import { config } from "../services/config.js";
import { API_BASE_URL } from "../services/baseApi.js";
import logoImage from "/assets/images/logo.png";

// Configuration constants
const DEFAULT_LISTINGS_LIMIT = 20;
const CAROUSEL_UPDATE_DELAY = 100;
const DEFAULT_IMAGE = logoImage;
const MAX_THUMBNAIL_HEIGHT = "200px";

/**
 * DOM element references for homepage components
 * Cached at module level for performance
 */
const elements = {
  homeAuthButtons: document.getElementById("home-auth-buttons"),
  homeLoading: document.getElementById("home-loading"),
  homeError: document.getElementById("home-error"),
  listingsCarousel: document.getElementById("listings-carousel"),
  noListings: document.getElementById("no-listings"),
  mainContent: document.getElementById("main-content"),
};

/**
 * DOM manipulation utilities
 * Provides consistent show/hide functionality across components
 */
const DOMUtils = {
  show(element) {
    if (element) element.classList.remove("hidden");
  },

  hide(element) {
    if (element) element.classList.add("hidden");
  },

  createElement(tag, className, innerHTML = "") {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
  },
};

/**
 * Responsive design utilities
 * Calculates optimal number of cards to display based on screen size
 * Enhanced for mobile compatibility, particularly Samsung Internet
 */
const ResponsiveUtils = {
  getCardsPerView() {
    // Use CSS media query check for more reliable device detection
    const width = window.innerWidth;
    const isSmallMobile = width <= 360; // Extra check for small mobile devices like older Samsung

    // Force single card for narrow screens
    if (isSmallMobile || width < 640) return 1;
    if (width < 768) return 1;
    if (width < 1024) return 2;
    if (width < 1280) return 3;
    return 4;
  },

  // Check if the browser is Samsung Internet
  // Samsung Internet has known issues with overflow handling
  isSamsungBrowser() {
    const userAgent = navigator.userAgent;
    return /SamsungBrowser/i.test(userAgent);
  },

  // Apply Samsung-specific fixes if needed
  applyBrowserSpecificFixes() {
    if (this.isSamsungBrowser()) {
      // Add a small stylesheet for Samsung-specific fixes
      const style = document.createElement("style");
      style.textContent = `
        .carousel-container * {
          max-width: 100% !important;
          overflow-wrap: break-word !important;
        }
        .carousel-container img {
          max-width: 100% !important;
          height: auto !important;
        }
      `;
      document.head.appendChild(style);
    }
  },
};

/**
 * API service for fetching homepage data
 * Handles communication with backend for featured listings
 */
const APIService = {
  async fetchLatestListings(limit = DEFAULT_LISTINGS_LIMIT) {
    const response = await fetch(
      `${API_BASE_URL}/auction/listings?_seller=true&_bids=true&sort=created&sortOrder=desc&limit=${limit}`, // Use API_BASE_URL instead of API_BASE
      {
        headers: {
          "Content-Type": "application/json",
          "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch listings");
    }

    const responseData = await response.json();
    return responseData.data || [];
  },
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
 * Image handling utilities for listing cards
 * Manages image URLs, fallbacks, and optimization
 */
const ImageHandler = {
  /**
   * Extracts primary image URL from listing media
   * @param {Object} listing - Listing object with media array
   * @returns {string} Image URL or default image
   */
  getImageUrl(listing) {
    if (
      !listing.media ||
      !Array.isArray(listing.media) ||
      listing.media.length === 0
    ) {
      return DEFAULT_IMAGE;
    }

    const media = listing.media[0];

    // Handle string URLs
    if (typeof media === "string" && media.trim() !== "") {
      return media;
    }

    // Handle object with URL property
    if (typeof media === "object" && media.url && media.url.trim() !== "") {
      return media.url;
    }

    return DEFAULT_IMAGE;
  },

  /**
   * Optimizes card images for carousel display
   * Adjusts image sizing and aspect ratios
   * Enhanced for mobile compatibility, especially Samsung Internet
   * @param {HTMLElement} card - Card element containing images
   */
  optimizeCardImages(card) {
    const images = card.querySelectorAll("img");
    images.forEach((img) => {
      // Switch from cover to contain for better fit
      img.classList.remove("object-cover");
      img.classList.add("object-contain");

      // Mobile-friendly image constraints
      img.style.height = "auto";
      img.style.maxHeight = MAX_THUMBNAIL_HEIGHT;
      img.style.maxWidth = "100%"; // Ensure image doesn't overflow container
      img.style.objectFit = "contain"; // Fallback for browsers that don't support object-contain class

      // Fix for Samsung Internet browser
      img.setAttribute("width", "auto");
      img.setAttribute("height", "auto");
    });

    this.removeAspectRatioConstraints(card);

    // Additional fix for mobile view containers
    const containers = card.querySelectorAll(
      ".card-content, .card-body, .card-image",
    );
    containers.forEach((container) => {
      if (container) {
        container.style.maxWidth = "100%";
        container.style.boxSizing = "border-box";
        container.style.overflowWrap = "break-word"; // Ensure text wraps instead of overflowing
      }
    });
  },

  /**
   * Removes fixed aspect ratio constraints for flexible sizing
   * @param {HTMLElement} card - Card element to modify
   */
  removeAspectRatioConstraints(card) {
    const imageContainers = card.querySelectorAll(
      '.aspect-square, .aspect-video, [class*="aspect-"]',
    );
    imageContainers.forEach((container) => {
      container.classList.remove("aspect-square", "aspect-video");

      Array.from(container.classList).forEach((cls) => {
        if (cls.startsWith("aspect-")) {
          container.classList.remove(cls);
        }
      });

      if (!container.style.height) {
        container.style.height = "auto";
      }
    });
  },
};

/**
 * Carousel Component for Featured Listings
 * Manages responsive carousel with navigation and thumbnails
 */
class CarouselComponent {
  constructor(listings) {
    this.listings = listings;
    this.currentIndex = 0;
    this.cardsPerView = ResponsiveUtils.getCardsPerView();
    this.total = listings.length;
    this.resizeTimeout = null;

    // DOM element references
    this.elements = {
      container: null,
      leftBtn: null,
      rightBtn: null,
      cardArea: null,
      scrollBar: null,
    };
  }

  /**
   * Renders the complete carousel structure
   * Creates DOM elements and sets up event listeners
   */
  render() {
    const container = document.querySelector(".carousel-container");
    if (!container) return;

    container.innerHTML = "";
    this.createCarouselStructure(container);
    this.setupEventListeners();
    this.updateCarousel();
  }

  /**
   * Creates the main carousel HTML structure
   * @param {HTMLElement} container - Parent container element
   */
  createCarouselStructure(container) {
    // Main carousel wrapper - enhanced overflow control
    const carouselWrapper = DOMUtils.createElement(
      "div",
      "flex flex-col items-center w-full max-w-full overflow-hidden",
    );

    // Carousel container with responsive padding - adjusted for mobile
    const carouselContainer = DOMUtils.createElement(
      "div",
      "w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6", // Reduced padding for mobile
    );

    // Main area with navigation and cards - improved spacing for mobile
    const mainArea = DOMUtils.createElement(
      "div",
      "flex items-center justify-between gap-2 sm:gap-4 w-full", // Reduced gap for mobile
    );

    // Create navigation buttons and card area
    this.elements.leftBtn = this.createNavigationButton("left");
    this.elements.rightBtn = this.createNavigationButton("right");
    this.elements.cardArea = DOMUtils.createElement(
      "div",
      "grid gap-2 sm:gap-4 flex-1 min-w-0 overflow-hidden px-1 sm:px-2", // Reduced gaps and padding for mobile
    );

    mainArea.append(
      this.elements.leftBtn,
      this.elements.cardArea,
      this.elements.rightBtn,
    );
    carouselContainer.appendChild(mainArea);

    // Thumbnail scroll bar
    const scrollBarContainer = DOMUtils.createElement(
      "div",
      "w-full max-w-4xl mx-auto mt-6 px-4",
    );
    this.elements.scrollBar = DOMUtils.createElement(
      "div",
      "flex justify-center gap-2 pb-2 scrollbar-hide",
    );
    scrollBarContainer.appendChild(this.elements.scrollBar);

    carouselWrapper.append(carouselContainer, scrollBarContainer);
    container.appendChild(carouselWrapper);
  }

  /**
   * Creates navigation button (left or right)
   * @param {string} direction - "left" or "right"
   * @returns {HTMLElement} Button element
   */
  createNavigationButton(direction) {
    const isLeft = direction === "left";
    const icon = isLeft
      ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>`
      : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>`;

    // Accessible name for button
    const accessibleLabel = isLeft
      ? "Scroll carousel left"
      : "Scroll carousel right";
    const visibleText = isLeft ? "Scroll Left" : "Scroll Right";

    const button = DOMUtils.createElement(
      "button",
      "p-3 bg-pink-500 hover:bg-pink-600 text-black rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex-shrink-0 transform hover:scale-105 z-10",
      `<span class="sr-only">${accessibleLabel}</span><span aria-hidden="true"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icon}</svg></span>`,
    );
    button.setAttribute("aria-label", accessibleLabel);
    button.title = visibleText;

    button.addEventListener("click", () => {
      if (isLeft) {
        this.currentIndex = Math.max(0, this.currentIndex - 1);
      } else {
        this.currentIndex = Math.min(
          this.total - this.cardsPerView,
          this.currentIndex + 1,
        );
      }
      this.updateCarousel();
    });

    return button;
  }

  /**
   * Sets up event listeners for carousel functionality
   * Handles window resize and authentication changes
   */
  setupEventListeners() {
    // Handle responsive resize
    window.addEventListener("resize", () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(
        () => this.updateCarousel(),
        CAROUSEL_UPDATE_DELAY,
      );
    });
  }

  updateCarousel() {
    this.cardsPerView = ResponsiveUtils.getCardsPerView();
    this.updateCardArea();
    this.updateNavigationButtons();
    this.updateThumbnails();
  }

  /**
   * Updates the main card display area
   * Shows current batch of listing cards
   */
  updateCardArea() {
    this.elements.cardArea.style.gridTemplateColumns = `repeat(${this.cardsPerView}, 1fr)`;
    this.elements.cardArea.innerHTML = "";

    // Add mobile-specific CSS to prevent overflow
    this.elements.cardArea.style.maxWidth = "100%";
    this.elements.cardArea.style.overflowX = "hidden";

    for (
      let i = 0;
      i < Math.min(this.cardsPerView, this.total - this.currentIndex);
      i++
    ) {
      const idx = this.currentIndex + i;
      const card = createListingCard(this.listings[idx]);

      // Mobile-friendly card sizing
      card.style.width = "100%";
      card.style.minWidth = "0"; // Allow shrinking if needed
      card.style.maxWidth = "100%"; // Prevent overflow
      card.style.boxSizing = "border-box"; // Include padding in width calculation

      // Create wrapper to contain hover effects with overflow protection
      const cardWrapper = document.createElement("div");
      cardWrapper.className = "relative overflow-hidden";
      cardWrapper.style.cssText =
        "transform-style: preserve-3d; contain: layout style paint; max-width: 100%; width: 100%;";

      // Remove original hover animations for carousel context
      card.className = card.className
        .replace("transform hover:scale-[1.02] hover:-translate-y-1", "")
        .replace("hover:scale-[1.02]", "")
        .replace("hover:-translate-y-1", "")
        .replace("transform", "");

      cardWrapper.appendChild(card);
      ImageHandler.optimizeCardImages(card);
      this.elements.cardArea.appendChild(cardWrapper);
    }
  }

  /**
   * Updates navigation button states
   * Disables buttons when at start/end of carousel
   */
  updateNavigationButtons() {
    this.updateButtonState(this.elements.leftBtn, this.currentIndex === 0);
    this.updateButtonState(
      this.elements.rightBtn,
      this.currentIndex >= this.total - this.cardsPerView,
    );
  }

  /**
   * Updates individual button appearance and state
   * @param {HTMLElement} button - Button to update
   * @param {boolean} isDisabled - Whether button should be disabled
   */
  updateButtonState(button, isDisabled) {
    button.disabled = isDisabled;

    if (isDisabled) {
      // Disabled state styling
      button.className = button.className
        .replace(
          "bg-pink-500 hover:bg-pink-600",
          "bg-gray-400 cursor-not-allowed",
        )
        .replace("hover:scale-105", "");
    } else {
      // Active state styling
      button.className = button.className.replace(
        "bg-gray-400 cursor-not-allowed",
        "bg-pink-500 hover:bg-pink-600",
      );

      if (!button.className.includes("hover:scale-105")) {
        button.className += " hover:scale-105";
      }
    }
  }

  /**
   * Updates thumbnail scroll bar
   * Shows indicators for current position in carousel
   */
  updateThumbnails() {
    this.elements.scrollBar.innerHTML = "";

    for (let i = 0; i < this.total; i++) {
      const thumbnail = this.createThumbnail(i);
      this.elements.scrollBar.appendChild(thumbnail);
    }
  }

  /**
   * Creates individual thumbnail indicator
   * @param {number} index - Page index for thumbnail
   * @returns {HTMLElement} Thumbnail element
   */
  createThumbnail(index) {
    const listing = this.listings[index];
    const thumb = DOMUtils.createElement("img");

    thumb.src = ImageHandler.getImageUrl(listing);
    thumb.alt = `Thumbnail for ${listing.title || "listing"}`;
    thumb.loading = "lazy";

    const middleIndex = Math.floor(this.cardsPerView / 2);
    const centerCardIndex = this.currentIndex + middleIndex;
    const isActive = index === centerCardIndex;

    thumb.className = `
        w-8 h-8 rounded-full object-cover border-2 cursor-pointer
        transition-all duration-200 flex-shrink-0
        ${
          isActive
            ? "border-pink-500 ring-2 ring-pink-400 opacity-100 scale-110"
            : "border-gray-300 dark:border-gray-600 opacity-60 hover:opacity-100 hover:scale-105"
        }
      `
      .replace(/\s+/g, " ")
      .trim();

    thumb.addEventListener("error", () => {
      thumb.src = DEFAULT_IMAGE;
    });

    thumb.addEventListener("click", () => {
      const middleIndex = Math.floor(this.cardsPerView / 2);
      let targetIndex = index - middleIndex;
      targetIndex = Math.max(
        0,
        Math.min(targetIndex, this.total - this.cardsPerView),
      );
      this.currentIndex = targetIndex;
      this.updateCarousel();
    });

    return thumb;
  }
}

/**
 * Main carousel controller
 * Manages loading and displaying featured listings
 */
const CarouselController = {
  /**
   * Loads and displays featured listings carousel
   * Handles loading states and error conditions
   */
  async load() {
    if (!elements.listingsCarousel) return;

    try {
      this.showLoading();
      const listings = await APIService.fetchLatestListings();
      this.hideLoading();

      if (listings.length === 0) {
        DOMUtils.show(elements.noListings);
        return;
      }

      // Create and render carousel
      const carousel = new CarouselComponent(listings);
      carousel.render();
      DOMUtils.show(elements.listingsCarousel);
    } catch (error) {
      this.showError();
    }
  },

  showLoading() {
    DOMUtils.show(elements.homeLoading);
    DOMUtils.hide(elements.homeError);
    DOMUtils.hide(elements.listingsCarousel);
    DOMUtils.hide(elements.noListings);
  },

  hideLoading() {
    DOMUtils.hide(elements.homeLoading);
  },

  showError() {
    DOMUtils.hide(elements.homeLoading);
    DOMUtils.show(elements.homeError);
  },
};

/**
 * Main page initializer
 * Coordinates all homepage functionality
 */
const PageInitializer = {
  init() {
    if (!elements.mainContent) return;

    // Apply browser-specific fixes (e.g., Samsung Internet)
    ResponsiveUtils.applyBrowserSpecificFixes();

    AuthButtonRenderer.render();
    CarouselController.load();
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

export { CarouselComponent };
