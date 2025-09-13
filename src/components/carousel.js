// carousel.js - Carousel component for displaying listings
import { config } from "../services/config.js";
import { API_BASE_URL } from "../services/baseApi.js";
import { safeFetch } from "../utils/requestManager.js";
import logoImage from "/assets/images/logo.png";

// Configuration constants
const DEFAULT_LISTINGS_LIMIT = 15;
const CAROUSEL_UPDATE_DELAY = 100;
const DEFAULT_IMAGE = logoImage;
const MAX_THUMBNAIL_HEIGHT = "200px";

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
 * Calculates optimal number of cards to display based on available width with fixed card sizes
 */
const ResponsiveUtils = {
  getCardsPerView() {
    const width = window.innerWidth;
    const cardWidth = 320; // Fixed card width
    const gapWidth = 8; // Gap between cards (gap-2 = 0.5rem = 8px)
    const sideMargin = 160; // Space for navigation buttons and padding

    const availableWidth = width - sideMargin;
    const maxCards = Math.floor(availableWidth / (cardWidth + gapWidth));

    // Ensure we always show at least 1 card and don't exceed reasonable limits
    if (width < 480) return 1; // Very small screens
    if (width < 768) return 1; // Mobile devices
    if (maxCards < 1) return 1;
    if (maxCards > 4) return 4; // Max 4 cards for large screens

    return Math.max(1, maxCards);
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
   * @param {HTMLElement} card - Card element containing images
   */
  optimizeCardImages(card) {
    const images = card.querySelectorAll("img");
    const isMobile = window.innerWidth < 480;

    images.forEach((img) => {
      // Use different image handling based on device size
      if (isMobile) {
        // On small screens, prioritize visibility of full image
        img.classList.remove("object-cover");
        img.classList.add("object-contain");

        // Smaller height on mobile
        img.style.maxHeight = "150px";
      } else {
        // Switch from cover to contain for better fit on larger screens
        img.classList.remove("object-cover");
        img.classList.add("object-contain");

        // Set maximum height if not already constrained
        if (!img.style.height && !img.classList.contains("w-full")) {
          img.style.height = "auto";
          img.style.maxHeight = MAX_THUMBNAIL_HEIGHT;
        }
      }
    });

    ImageHandler.removeAspectRatioConstraints(card);

    // Add touch optimization for mobile
    if (isMobile) {
      card.style.touchAction = "pan-x";
    }
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

export function createCarouselCard(listing) {
  const endDate = new Date(listing.endsAt);
  const now = new Date();
  const timeLeftMs = endDate.getTime() - now.getTime();

  // Create timeInfo object for displaying time
  const timeInfo = { text: "Ended" };

  if (timeLeftMs < 0) {
    timeInfo.text = "Ended";
  } else {
    const days = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
    timeInfo.text = `Ends: ${days}d ${hours}h ${minutes}m`;
  }

  const imageUrl =
    listing.media && listing.media.length > 0 && listing.media[0].url
      ? listing.media[0].url
      : null;
  const sellerAvatar =
    listing.seller && listing.seller.avatar && listing.seller.avatar.url
      ? listing.seller.avatar.url
      : "https://placehold.co/40x40?text=S";
  const sellerName =
    listing.seller && listing.seller.name ? listing.seller.name : "Unknown";

  const card = document.createElement("a");
  card.href = `/item.html?id=${listing.id}`;
  card.className =
    "flex-none w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-[400px] flex flex-col cursor-pointer border border-gray-100 dark:border-gray-700 hover:z-0";
  // Fixed width (w-80 = 320px) and height (h-[400px]) for consistent sizing

  card.innerHTML = `
    ${
      imageUrl
        ? `<div class="w-full h-40 flex-shrink-0 bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <img src="${imageUrl}" alt="${listing.title}" loading="lazy" class="w-full h-full object-cover carousel-image transition-transform duration-300 hover:scale-110">
           </div>`
        : `<div class="w-full h-40 flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-500 text-white text-center font-semibold text-lg italic flex-shrink-0 transition-all duration-300 hover:from-pink-500 hover:to-purple-600">
            No image on this listing
           </div>`
    }
    <div class="p-4 flex-1 flex flex-col min-h-0 relative">
      <div class="absolute inset-0 bg-gradient-to-t from-transparent to-transparent opacity-0 hover:opacity-5 transition-opacity duration-300 pointer-events-none bg-pink-500 rounded-b-lg"></div>
      <h3 class="font-bold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors duration-200">${
        listing.title
      }</h3>
      <p class="text-gray-600 dark:text-gray-300 text-sm mb-3 flex-1 line-clamp-3">${
        listing.description || "No description provided."
      }</p>
      <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
        <span class="font-medium text-green-600 dark:text-green-400">${
          timeInfo.text
        }</span>
        <span class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs font-medium">
          Bids: ${listing._count?.bids || 0}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <img src="${sellerAvatar}" alt="${sellerName}" loading="lazy" class="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 transition-all duration-200 hover:border-pink-400 dark:hover:border-pink-500 hover:shadow-md flex-shrink-0" style="width: 32px; height: 32px; min-width: 32px; min-height: 32px;"">
        <span class="text-gray-800 dark:text-gray-200 font-medium truncate transition-colors duration-200 hover:text-pink-600 dark:hover:text-pink-400">${sellerName}</span>
      </div>
    </div>
  `;

  // Handle image error
  if (imageUrl) {
    const img = card.querySelector(".carousel-image");
    if (img) {
      img.addEventListener("error", function () {
        this.parentElement.outerHTML =
          '<div class="w-full h-40 flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-500 text-white text-center font-semibold text-lg italic flex-shrink-0 transition-all duration-300 hover:from-pink-500 hover:to-purple-600">No image on this listing</div>';
      });
    }
  }

  return card;
}

// Render the carousel with scroll functionality
export function renderCarousel(listings, carouselContainer) {
  if (!carouselContainer) return;

  carouselContainer.innerHTML = "";

  // Update carousel container classes for smoother scrolling with enhanced snap
  carouselContainer.className =
    "flex gap-4 sm:gap-5 md:gap-6 overflow-x-auto pb-4 scroll-smooth-enhanced max-w-full px-2";

  listings.forEach((listing) => {
    const card = createCarouselCard(listing);
    carouselContainer.appendChild(card);
  });
}

// Setup scroll buttons for the carousel
export function setupCarouselScrollButtons(
  scrollLeftId = "scroll-left",
  scrollRightId = "scroll-right",
  carouselSelector = "#listings-carousel .flex",
) {
  const scrollLeftBtn = document.getElementById(scrollLeftId);
  const scrollRightBtn = document.getElementById(scrollRightId);

  if (scrollLeftBtn && scrollRightBtn) {
    // Set text labels for accessibility and clarity (visible and aria)
    // WCAG-compliant visible text labels
    scrollLeftBtn.textContent = "Scroll Left";
    scrollLeftBtn.setAttribute("aria-label", "Scroll carousel left");
    scrollRightBtn.textContent = "Scroll Right";
    scrollRightBtn.setAttribute("aria-label", "Scroll carousel right");

    const getScrollDistance = () => {
      // Responsive scroll distance based on viewport width for smooth scrolling
      return window.innerWidth < 640
        ? 320 // One card width for mobile
        : window.innerWidth < 768
          ? 340 // Slightly larger for tablets
          : 360; // Larger for desktop
    };

    // Add smooth scrolling with easing
    const smoothScrollTo = (carousel, targetPosition) => {
      carousel.scrollTo({
        left: targetPosition,
        behavior: "smooth",
      });
    };

    scrollLeftBtn.addEventListener("click", () => {
      const carousel = document.querySelector(carouselSelector);
      if (carousel) {
        const currentScroll = carousel.scrollLeft;
        const targetScroll = Math.max(0, currentScroll - getScrollDistance());
        smoothScrollTo(carousel, targetScroll);
      }
    });

    scrollRightBtn.addEventListener("click", () => {
      const carousel = document.querySelector(carouselSelector);
      if (carousel) {
        const currentScroll = carousel.scrollLeft;
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        const targetScroll = Math.min(
          maxScroll,
          currentScroll + getScrollDistance(),
        );
        smoothScrollTo(carousel, targetScroll);
      }
    });
  }
}

/**
 * Advanced Carousel Component class
 * Creates an interactive carousel with navigation buttons and progress bar
 */
export class CarouselComponent {
  constructor(listings) {
    this.listings = listings;
    this.currentIndex = 0;
    this.cardsPerView = ResponsiveUtils.getCardsPerView();
    this.total = listings.length;
    this.resizeTimeout = null;
    this.isTransitioning = false;

    // DOM element references
    this.elements = {
      container: null,
      leftBtn: null,
      rightBtn: null,
      cardArea: null,
      scrollBar: null,
      progressFill: null,
      carouselTrack: null,
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
   * Creates the main carousel HTML structure with fixed dimensions
   * @param {HTMLElement} container - Parent container element
   */
  createCarouselStructure(container) {
    // Main carousel wrapper with improved mobile handling and fixed height
    const carouselWrapper = DOMUtils.createElement(
      "div",
      "flex flex-col items-center w-full max-w-full overflow-hidden carousel-container",
    );

    // Carousel container with responsive padding and fixed dimensions
    const carouselContainer = DOMUtils.createElement(
      "div",
      "w-full max-w-7xl mx-auto px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 carousel-card-area",
    );

    // Main area with navigation and cards - fixed height and overflow handling
    const mainArea = DOMUtils.createElement(
      "div",
      "flex items-center justify-between gap-2 xs:gap-3 sm:gap-4 w-full h-full",
    );

    // Create navigation buttons
    this.elements.leftBtn = this.createNavigationButton("left");
    this.elements.rightBtn = this.createNavigationButton("right");

    // Create card area container with overflow hidden
    this.elements.cardArea = DOMUtils.createElement(
      "div",
      "flex-1 min-w-0 overflow-hidden px-2 carousel-card-area",
    );

    // Create the carousel track that will slide smoothly
    this.elements.carouselTrack = DOMUtils.createElement(
      "div",
      "carousel-track flex gap-2",
    );

    // Add track to card area
    this.elements.cardArea.appendChild(this.elements.carouselTrack);

    mainArea.append(
      this.elements.leftBtn,
      this.elements.cardArea,
      this.elements.rightBtn,
    );
    carouselContainer.appendChild(mainArea);

    // Progress scroll bar
    const scrollBarContainer = DOMUtils.createElement(
      "div",
      "w-full max-w-4xl mx-auto mt-6 px-4",
    );
    this.elements.scrollBar = DOMUtils.createElement(
      "div",
      "relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden cursor-pointer",
    );

    // Create progress bar fill
    this.elements.progressFill = DOMUtils.createElement(
      "div",
      "h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500 ease-out",
    );
    this.elements.scrollBar.appendChild(this.elements.progressFill);

    // Add click functionality to progress bar
    this.elements.scrollBar.addEventListener("click", (e) => {
      if (this.isTransitioning) return; // Prevent clicks during transition

      const rect = this.elements.scrollBar.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      const maxIndex = Math.max(0, this.total - this.cardsPerView);
      const targetIndex = Math.round(clickPosition * maxIndex);

      this.smoothTransitionTo(targetIndex);
    });

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
      "carousel-nav-button p-3 bg-pink-500 hover:bg-pink-600 text-black rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex-shrink-0 transform hover:scale-105 z-10",
      `<span class="sr-only">${accessibleLabel}</span><span aria-hidden="true"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icon}</svg></span>`,
    );
    button.setAttribute("aria-label", accessibleLabel);
    button.title = visibleText;

    button.addEventListener("click", () => {
      // Prevent navigation during transitions
      if (this.isTransitioning) return;

      // Don't navigate if we have fewer items than cards per view
      if (this.total <= this.cardsPerView) return;

      let targetIndex;
      if (isLeft) {
        // Loop to end when going left from beginning
        if (this.currentIndex <= 0) {
          targetIndex = Math.max(0, this.total - this.cardsPerView);
        } else {
          targetIndex = this.currentIndex - 1;
        }
      } else {
        // Loop to beginning when going right from end
        const maxIndex = Math.max(0, this.total - this.cardsPerView);
        if (this.currentIndex >= maxIndex) {
          targetIndex = 0;
        } else {
          targetIndex = this.currentIndex + 1;
        }
      }

      this.smoothTransitionTo(targetIndex);
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
      this.resizeTimeout = setTimeout(() => {
        // Temporarily disable transitions during resize
        this.elements.carouselTrack.classList.add("no-transition");
        this.updateCarousel();

        // Re-enable transitions after layout update
        setTimeout(() => {
          this.elements.carouselTrack.classList.remove("no-transition");
        }, 50);
      }, CAROUSEL_UPDATE_DELAY);
    });
  }

  updateCarousel() {
    this.cardsPerView = ResponsiveUtils.getCardsPerView();
    this.populateAllCards(); // Create all cards first
    this.updateCardAreaPosition(); // Then position the track
    this.updateNavigationButtons();
    this.updateProgressBar();
  }

  /**
   * Smoothly transitions to a target index
   * @param {number} targetIndex - Index to transition to
   */
  smoothTransitionTo(targetIndex) {
    if (this.isTransitioning || targetIndex === this.currentIndex) return;

    this.isTransitioning = true;
    this.currentIndex = targetIndex;

    // Add transition class and update position
    this.elements.carouselTrack.classList.add("transitioning");
    this.updateCardAreaPosition();
    this.updateProgressBar();

    // Reset transition flag after animation completes
    // Use different timing for mobile vs desktop
    const transitionDuration = window.innerWidth < 768 ? 300 : 400;
    setTimeout(() => {
      this.isTransitioning = false;
    }, transitionDuration);
  }

  /**
   * Populates the carousel track with all listing cards
   * Creates all cards once for smooth sliding
   */
  populateAllCards() {
    // Clear existing cards
    this.elements.carouselTrack.innerHTML = "";

    // Create all cards and add them to the track
    this.listings.forEach((listing, index) => {
      const card =
        typeof createListingCard !== "undefined"
          ? createListingCard(listing)
          : createCarouselCard(listing);

      // Create wrapper for consistent sizing
      const cardWrapper = document.createElement("div");
      cardWrapper.className = "carousel-card-wrapper fade-in";

      // Apply carousel card styling
      card.className += " carousel-card";

      // Remove original hover animations for carousel context
      card.className = card.className
        .replace("transform hover:scale-[1.02] hover:-translate-y-1", "")
        .replace("hover:scale-[1.02]", "")
        .replace("hover:-translate-y-1", "")
        .replace("transform", "");

      cardWrapper.appendChild(card);
      ImageHandler.optimizeCardImages(card);
      this.elements.carouselTrack.appendChild(cardWrapper);
    });
  }

  /**
   * Updates the carousel track position using CSS transforms
   * Creates smooth sliding animation between cards
   */
  updateCardAreaPosition() {
    if (!this.elements.carouselTrack) return;

    const cardWidth = 320; // Fixed card width including wrapper
    const gapWidth = 8; // Gap between cards (gap-2 = 0.5rem = 8px)
    const cardPlusGap = cardWidth + gapWidth;

    // Calculate transform offset
    const translateX = -(this.currentIndex * cardPlusGap);

    // Apply smooth transform
    this.elements.carouselTrack.style.transform = `translateX(${translateX}px)`;

    // Update container width to fit visible cards
    const isMobileView = window.innerWidth < 768;
    const finalCardsToShow = isMobileView ? 1 : this.cardsPerView;
    const containerWidth =
      cardWidth * finalCardsToShow +
      gapWidth * Math.max(0, finalCardsToShow - 1);

    this.elements.cardArea.style.width = `${containerWidth}px`;
  }

  /**
   * Updates navigation button states
   * Keeps buttons always enabled for endless looping (unless fewer items than cards per view)
   */
  updateNavigationButtons() {
    // Only disable buttons if we have fewer items than cards per view
    const shouldDisable = this.total <= this.cardsPerView;
    this.updateButtonState(this.elements.leftBtn, shouldDisable);
    this.updateButtonState(this.elements.rightBtn, shouldDisable);
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
   * Updates progress scroll bar
   * Shows current position progress in the carousel with smooth transitions
   */
  updateProgressBar() {
    if (!this.elements.progressFill) return;

    // Calculate progress percentage
    const maxIndex = Math.max(0, this.total - this.cardsPerView);
    const progress = maxIndex > 0 ? (this.currentIndex / maxIndex) * 100 : 0;

    // Update progress bar width with smooth transition
    this.elements.progressFill.style.width = `${progress}%`;

    // Add some visual feedback for the current position
    const progressText = `${this.currentIndex + 1}-${Math.min(this.currentIndex + this.cardsPerView, this.total)} of ${this.total}`;
    this.elements.scrollBar.setAttribute(
      "title",
      `Showing items ${progressText}`,
    );
  }
}

/**
 * API service for fetching carousel data
 * Handles communication with backend for featured listings
 */
export const CarouselAPIService = {
  async fetchLatestListings(limit = DEFAULT_LISTINGS_LIMIT) {
    const response = await safeFetch(
      `${API_BASE_URL}/auction/listings?_seller=true&_bids=true&sort=created&sortOrder=desc&limit=${limit}`,
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
    const now = Date.now();

    // Only keep active (not ended) listings
    const activeListings = (responseData.data || []).filter((listing) => {
      if (!listing.endsAt) return true; // treat missing endsAt as active
      const endTime = Date.parse(listing.endsAt);
      return !isNaN(endTime) && endTime > now;
    });

    return activeListings;
  },
};

/**
 * Controller for managing carousel functionality
 * Provides methods for loading data and updating UI
 */
export const CarouselController = {
  /**
   * Loads and displays featured listings carousel
   * @param {Object} elements - DOM elements for the carousel
   */
  async load(elements) {
    if (!elements.listingsCarousel) return;

    try {
      this.showLoading(elements);
      const listings = await CarouselAPIService.fetchLatestListings();
      this.hideLoading(elements);

      if (listings.length === 0) {
        DOMUtils.show(elements.noListings);
        return;
      }

      // Create and render carousel
      const carousel = new CarouselComponent(listings);
      carousel.render();
      DOMUtils.show(elements.listingsCarousel);
    } catch (error) {
      this.showError(elements);
    }
  },

  showLoading(elements) {
    DOMUtils.show(elements.homeLoading);
    DOMUtils.hide(elements.homeError);
    DOMUtils.hide(elements.listingsCarousel);
    DOMUtils.hide(elements.noListings);
  },

  hideLoading(elements) {
    DOMUtils.hide(elements.homeLoading);
  },

  showError(elements) {
    DOMUtils.hide(elements.homeLoading);
    DOMUtils.show(elements.homeError);
  },
};
