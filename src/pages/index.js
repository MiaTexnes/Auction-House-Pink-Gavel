import { isAuthenticated } from "../library/auth.js";
import { createListingCard } from "./listings.js";
import { config } from "../services/config.js";
import { API_BASE_URL } from "../services/baseApi.js"; // Add this import
import logoImage from "/assets/images/logo.png";

// Constants
const DEFAULT_LISTINGS_LIMIT = 20;
const CAROUSEL_UPDATE_DELAY = 100;
const DEFAULT_IMAGE = logoImage;
const MAX_THUMBNAIL_HEIGHT = "200px";

// DOM Elements
const elements = {
  homeAuthButtons: document.getElementById("home-auth-buttons"),
  homeLoading: document.getElementById("home-loading"),
  homeError: document.getElementById("home-error"),
  listingsCarousel: document.getElementById("listings-carousel"),
  noListings: document.getElementById("no-listings"),
  mainContent: document.getElementById("main-content"),
};

// Utility Functions
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

// Responsive Utilities
const ResponsiveUtils = {
  getCardsPerView() {
    const width = window.innerWidth;
    if (width < 640) return 1;
    if (width < 768) return 1;
    if (width < 1024) return 2;
    if (width < 1280) return 3;
    return 4;
  },
};

// API Services
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

// Auth Button Renderer
const AuthButtonRenderer = {
  render() {
    if (!elements.homeAuthButtons) return;

    if (isAuthenticated()) {
      this.renderAuthenticatedButtons();
    } else {
      this.renderUnauthenticatedButtons();
    }
  },

  renderAuthenticatedButtons() {
    elements.homeAuthButtons.innerHTML = `
      <div class="text-center">
        <a href="/listings.html" class="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
          Browse Auctions
        </a>
      </div>
    `;
  },

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

// Image Handler
const ImageHandler = {
  getImageUrl(listing) {
    if (
      !listing.media ||
      !Array.isArray(listing.media) ||
      listing.media.length === 0
    ) {
      return DEFAULT_IMAGE;
    }

    const media = listing.media[0];
    if (typeof media === "string" && media.trim() !== "") {
      return media;
    }

    if (typeof media === "object" && media.url && media.url.trim() !== "") {
      return media.url;
    }

    return DEFAULT_IMAGE;
  },

  optimizeCardImages(card) {
    const images = card.querySelectorAll("img");
    images.forEach((img) => {
      img.classList.remove("object-cover");
      img.classList.add("object-contain");

      if (!img.style.height && !img.classList.contains("w-full")) {
        img.style.height = "auto";
        img.style.maxHeight = MAX_THUMBNAIL_HEIGHT;
      }
    });

    this.removeAspectRatioConstraints(card);
  },

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

// Carousel Component
class CarouselComponent {
  constructor(listings) {
    this.listings = listings;
    this.currentIndex = 0;
    this.cardsPerView = ResponsiveUtils.getCardsPerView();
    this.total = listings.length;
    this.resizeTimeout = null;

    this.elements = {
      container: null,
      leftBtn: null,
      rightBtn: null,
      cardArea: null,
      scrollBar: null,
    };
  }

  render() {
    const container = document.querySelector(".carousel-container");
    if (!container) return;

    container.innerHTML = "";
    this.createCarouselStructure(container);
    this.setupEventListeners();
    this.updateCarousel();
  }

  createCarouselStructure(container) {
    const carouselWrapper = DOMUtils.createElement(
      "div",
      "flex flex-col items-center w-full max-w-full overflow-hidden",
    );
    const carouselContainer = DOMUtils.createElement(
      "div",
      "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
    );
    const mainArea = DOMUtils.createElement(
      "div",
      "flex  items-center justify-between gap-4 w-full",
    );

    this.elements.leftBtn = this.createNavigationButton("left");
    this.elements.rightBtn = this.createNavigationButton("right");
    this.elements.cardArea = DOMUtils.createElement(
      "div",
      "grid gap-4 flex-1 min-w-0 overflow-hidden px-2",
    );

    mainArea.append(
      this.elements.leftBtn,
      this.elements.cardArea,
      this.elements.rightBtn,
    );
    carouselContainer.appendChild(mainArea);

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
      "p-3 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex-shrink-0 transform hover:scale-105 z-10",
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

  setupEventListeners() {
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

  updateCardArea() {
    this.elements.cardArea.style.gridTemplateColumns = `repeat(${this.cardsPerView}, 1fr)`;
    this.elements.cardArea.innerHTML = "";

    for (
      let i = 0;
      i < Math.min(this.cardsPerView, this.total - this.currentIndex);
      i++
    ) {
      const idx = this.currentIndex + i;
      const card = createListingCard(this.listings[idx]);

      card.style.width = "auto";
      card.style.minWidth = "auto";
      card.style.maxWidth = "none";

      // Create a wrapper div to contain hover effects
      const cardWrapper = document.createElement("div");
      cardWrapper.className = "relative overflow-hidden";
      cardWrapper.style.cssText =
        "transform-style: preserve-3d; contain: layout style paint;";

      // Remove hover scale and translate from the original card
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

  updateNavigationButtons() {
    this.updateButtonState(this.elements.leftBtn, this.currentIndex === 0);
    this.updateButtonState(
      this.elements.rightBtn,
      this.currentIndex >= this.total - this.cardsPerView,
    );
  }

  updateButtonState(button, isDisabled) {
    button.disabled = isDisabled;

    if (isDisabled) {
      button.className = button.className
        .replace(
          "bg-pink-500 hover:bg-pink-600",
          "bg-gray-400 cursor-not-allowed",
        )
        .replace("hover:scale-105", "");
    } else {
      button.className = button.className.replace(
        "bg-gray-400 cursor-not-allowed",
        "bg-pink-500 hover:bg-pink-600",
      );

      if (!button.className.includes("hover:scale-105")) {
        button.className += " hover:scale-105";
      }
    }
  }

  updateThumbnails() {
    this.elements.scrollBar.innerHTML = "";

    for (let i = 0; i < this.total; i++) {
      const thumbnail = this.createThumbnail(i);
      this.elements.scrollBar.appendChild(thumbnail);
    }
  }

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

// Main Carousel Controller
const CarouselController = {
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

// Page Initializer
const PageInitializer = {
  init() {
    if (!elements.mainContent) return;

    AuthButtonRenderer.render();
    CarouselController.load();
    this.setupEventListeners();
  },

  setupEventListeners() {
    window.addEventListener("storage", (e) => {
      if (e.key === "token" || e.key === "user") {
        AuthButtonRenderer.render();
      }
    });
  },
};

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  PageInitializer.init();
});

// Export for other modules
export { CarouselComponent };
