// carousel.js - Photo carousel for showing auction items that you can scroll through
import { config } from "../services/config.js";
import { API_BASE_URL } from "../services/baseApi.js";
import { safeFetch } from "../utils/requestManager.js";
import { createListingCard } from "../pages/listings.js";

const DEFAULT_LISTINGS_LIMIT = 15;
const CAROUSEL_UPDATE_DELAY = 100;
const DEFAULT_IMAGE = "https://placehold.co/600x400?text=No+Image";
const DEFAULT_SELLER_AVATAR = "https://placehold.co/40x40?text=S";
const MAX_THUMBNAIL_HEIGHT = "200px";

/**
 * Basic helper functions for showing and hiding things on the page
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
 * Figures out how many cards can fit on the screen at once
 * Mobile phones get 1 card, tablets get 2-3, desktops get up to 4
 */
const ResponsiveUtils = {
  getCardsPerView() {
    const width = window.innerWidth;
    const cardWidth = 320; // Each card is 320px wide
    const gapWidth = 8; // 8px space between cards
    const sideMargin = 160; // Space for navigation buttons

    const availableWidth = width - sideMargin;
    const maxCards = Math.floor(availableWidth / (cardWidth + gapWidth));

    if (width < 480) return 1; // Phone screens
    if (width < 768) return 1; // Small tablets
    if (maxCards < 1) return 1;
    if (maxCards > 4) return 4; // Don't show more than 4 even on huge screens

    return Math.max(1, maxCards);
  },
};

/**
 * Handles all the image stuff - making sure pictures look good and load properly
 */
const ImageHandler = {
  /**
   * Gets the main photo from an auction listing, or shows a placeholder if there's no photo
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

    if (typeof media === "string" && media.trim() !== "") {
      return media;
    }

    if (typeof media === "object" && media.url && media.url.trim() !== "") {
      return media.url;
    }

    return DEFAULT_IMAGE;
  },

  /**
   * Makes images look better on different screen sizes
   * On phones: smaller images that fit better
   * On computers: larger images that show more detail
   */
  optimizeCardImages(card) {
    const images = card.querySelectorAll("img");
    const isMobile = window.innerWidth < 480;

    images.forEach((img) => {
      if (isMobile) {
        // On phones, make sure the whole image is visible
        img.classList.remove("object-cover");
        img.classList.add("object-contain");
        img.style.maxHeight = "150px";
      } else {
        // On bigger screens, show more of the image
        img.classList.remove("object-cover");
        img.classList.add("object-contain");

        if (!img.style.height && !img.classList.contains("w-full")) {
          img.style.height = "auto";
          img.style.maxHeight = MAX_THUMBNAIL_HEIGHT;
        }
      }
    });

    ImageHandler.removeAspectRatioConstraints(card);

    if (isMobile) {
      card.style.touchAction = "pan-x"; // Let people swipe on phones
    }
  },

  /**
   * Removes fixed image sizes so photos can be flexible
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
 * Creates a single card showing an auction item.
 * @param {Object} listing - The auction listing object.
 * @returns {HTMLAnchorElement} The card element for the carousel.
 */
export function createCarouselCard(listing) {
  const endDate = new Date(listing.endsAt);
  const now = new Date();
  const timeLeftMs = endDate.getTime() - now.getTime();

  // Figure out how much time is left in the auction
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

  const imageUrl = ImageHandler.getImageUrl(listing);
  const sellerAvatar = listing.seller?.avatar?.url || DEFAULT_SELLER_AVATAR;
  const sellerName = listing.seller?.name || "Unknown";

  const card = document.createElement("a");
  card.href = `/item.html?id=${listing.id}`;
  card.className =
    "flex-none w-72 sm:w-80 max-w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-[400px] flex flex-col cursor-pointer border border-gray-100 dark:border-gray-700";

  card.innerHTML = `
    <div class="w-full h-40 flex-shrink-0 bg-gray-100 dark:bg-gray-700 overflow-hidden">
      ${imageUrl ? `<img src="${imageUrl}" alt="${listing.title}" loading="lazy" class="w-full h-full object-cover carousel-image transition-transform duration-300 hover:scale-110">` : '<div class="w-full h-40 flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-500 text-white text-center font-semibold text-lg italic flex-shrink-0">No image on this listing</div>'}
    </div>
    <div class="p-3 sm:p-4 flex-1 flex flex-col min-h-0 relative">
      <h3 class="font-bold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white">${listing.title}</h3>
      <p class="text-gray-600 dark:text-gray-300 text-sm mb-3 flex-1 line-clamp-3">${listing.description || "No description provided."}</p>
      <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
        <span class="font-medium text-green-600 dark:text-green-400">${timeInfo.text}</span>
        <span class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs font-medium">
          Bids: ${listing._count?.bids || 0}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <img src="${sellerAvatar}" alt="${sellerName}" loading="lazy" class="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 flex-shrink-0" style="width: 32px; height: 32px;">
        <span class="text-gray-800 dark:text-gray-200 font-medium truncate">${sellerName}</span>
      </div>
    </div>
  `;

  // If the image doesn't load, show a nice placeholder instead
  const img = card.querySelector(".carousel-image");
  if (img) {
    img.addEventListener("error", function () {
      this.parentElement.innerHTML =
        '<div class="w-full h-40 flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-500 text-white text-center font-semibold text-lg italic flex-shrink-0">No image on this listing</div>';
    });
  }

  return card;
}

/**
 * Renders a basic scrolling carousel with cards in a row.
 * @param {Object[]} listings - Array of auction listing objects.
 * @param {HTMLElement} carouselContainer - The container element for the carousel.
 */
export function renderCarousel(listings, carouselContainer) {
  if (!carouselContainer) return;

  carouselContainer.innerHTML = "";

  carouselContainer.className =
    "flex gap-4 sm:gap-5 md:gap-6 overflow-x-auto pb-4 scroll-smooth-enhanced max-w-full px-2";

  listings.forEach((listing) => {
    const card = createCarouselCard(listing);
    carouselContainer.appendChild(card);
  });
}

/**
 * Adds left/right arrow buttons for smooth carousel scrolling with infinite loop.
 * @param {string} [scrollLeftId="scroll-left"] - ID of the left scroll button.
 * @param {string} [scrollRightId="scroll-right"] - ID of the right scroll button.
 * @param {string} [carouselSelector="#listings-carousel .flex"] - Selector for the carousel element.
 */
export function setupCarouselScrollButtons(
  scrollLeftId = "scroll-left",
  scrollRightId = "scroll-right",
  carouselSelector = "#listings-carousel .flex",
) {
  const scrollLeftBtn = document.getElementById(scrollLeftId);
  const scrollRightBtn = document.getElementById(scrollRightId);

  if (scrollLeftBtn && scrollRightBtn) {
    scrollLeftBtn.textContent = "Scroll Left";
    scrollLeftBtn.setAttribute("aria-label", "Scroll carousel left");
    scrollRightBtn.textContent = "Scroll Right";
    scrollRightBtn.setAttribute("aria-label", "Scroll carousel right");

    // How far to scroll each time you click a button
    // Smaller movements on phones, bigger on computers
    const getScrollDistance = () => {
      return window.innerWidth < 640
        ? 160
        : window.innerWidth < 768
          ? 180
          : 200;
    };

    /**
     * Makes scrolling look smooth and natural instead of jerky
     * Like when you drag something and it glides to a stop
     */
    const smoothScrollTo = (carousel, targetPosition) => {
      const startPosition = carousel.scrollLeft;
      const distance = targetPosition - startPosition;
      const duration = 400; // Takes 400 milliseconds to complete
      let startTime = null;

      // This math makes it start slow, speed up, then slow down at the end
      const easeInOutCubic = (t) => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };

      const animateScroll = (currentTime) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        const easedProgress = easeInOutCubic(progress);

        carousel.scrollLeft = startPosition + distance * easedProgress;

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };

      requestAnimationFrame(animateScroll);
    };

    scrollLeftBtn.addEventListener("click", () => {
      const carousel = document.querySelector(carouselSelector);
      if (carousel) {
        // Make the button look like it's being pressed
        scrollLeftBtn.style.transform = "scale(0.95)";
        setTimeout(() => {
          scrollLeftBtn.style.transform = "scale(1)";
        }, 150);

        const currentScroll = carousel.scrollLeft;
        const scrollDistance = getScrollDistance();
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;

        let targetScroll = currentScroll - scrollDistance;

        // If we're at the beginning, jump to the end (infinite loop)
        if (targetScroll <= 0) {
          targetScroll = maxScroll - scrollDistance / 2;
        }

        smoothScrollTo(carousel, targetScroll);
      }
    });

    scrollRightBtn.addEventListener("click", () => {
      const carousel = document.querySelector(carouselSelector);
      if (carousel) {
        // Make the button look like it's being pressed
        scrollRightBtn.style.transform = "scale(0.95)";
        setTimeout(() => {
          scrollRightBtn.style.transform = "scale(1)";
        }, 150);

        const currentScroll = carousel.scrollLeft;
        const scrollDistance = getScrollDistance();
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;

        let targetScroll = currentScroll + scrollDistance;

        // If we're at the end, jump back to the beginning (infinite loop)
        if (targetScroll >= maxScroll) {
          targetScroll = scrollDistance / 2;
        }

        smoothScrollTo(carousel, targetScroll);
      }
    });
  }
}

/**
 * Advanced carousel component with smooth sliding animations and navigation.
 * @class
 */
export class CarouselComponent {
  constructor(listings) {
    this.listings = listings;
    this.currentIndex = 0;
    this.cardsPerView = ResponsiveUtils.getCardsPerView();
    this.total = listings.length;
    this.resizeTimeout = null;
    this.isTransitioning = false; // Prevents clicking too fast

    // All the different parts of the carousel
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
   * Builds the whole carousel and gets it working
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
   * Creates all the HTML for the carousel - the container, buttons, and card area
   */
  createCarouselStructure(container) {
    const carouselWrapper = DOMUtils.createElement(
      "div",
      "flex flex-col items-center w-full max-w-full overflow-hidden carousel-container h-[480px]",
    );

    const carouselContainer = DOMUtils.createElement(
      "div",
      "w-full max-w-7xl mx-auto px-1 sm:px-4 md:px-6 lg:px-8 carousel-card-area h-[480px] overflow-y-hidden",
    );

    const mainArea = DOMUtils.createElement(
      "div",
      "flex items-center justify-between gap-2 sm:gap-4 w-full h-full",
    );

    this.elements.leftBtn = this.createNavigationButton("left");
    this.elements.rightBtn = this.createNavigationButton("right");

    this.elements.cardArea = DOMUtils.createElement(
      "div",
      "flex-1 min-w-0 overflow-x-auto overflow-y-hidden px-1 sm:px-2 carousel-card-area h-[480px]",
    );

    // This is the strip that holds all the cards and slides around
    this.elements.carouselTrack = DOMUtils.createElement(
      "div",
      "carousel-track flex gap-2 sm:gap-4 w-full",
    );

    this.elements.cardArea.appendChild(this.elements.carouselTrack);

    mainArea.append(
      this.elements.leftBtn,
      this.elements.cardArea,
      this.elements.rightBtn,
    );
    carouselContainer.appendChild(mainArea);

    carouselWrapper.appendChild(carouselContainer);
    container.appendChild(carouselWrapper);
  }

  /**
   * Creates a left or right arrow button with hover effects
   */
  createNavigationButton(direction) {
    const isLeft = direction === "left";
    const icon = isLeft
      ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>`
      : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>`;

    const accessibleLabel = isLeft
      ? "Scroll carousel left"
      : "Scroll carousel right";
    const visibleText = isLeft ? "Scroll Left" : "Scroll Right";

    const button = DOMUtils.createElement(
      "button",
      "carousel-nav-button p-3 bg-pink-500 hover:bg-pink-600 text-black rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex-shrink-0 transform hover:scale-105 z-10 hidden sm:inline-block",
      `<span class="sr-only">${accessibleLabel}</span><span aria-hidden="true"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icon}</svg></span>`,
    );
    button.setAttribute("aria-label", accessibleLabel);
    button.title = visibleText;

    button.addEventListener("click", () => {
      if (this.isTransitioning) return; // Don't allow clicking while already moving

      // Make the button shrink slightly when clicked
      button.style.transform = "scale(0.95)";
      setTimeout(() => {
        button.style.transform = "scale(1)";
      }, 150);

      this.smoothIncrementalScroll(isLeft);
    });

    return button;
  }

  /**
   * Listens for window resizing and adjusts the carousel accordingly
   * When someone rotates their phone or resizes the browser window
   */
  setupEventListeners() {
    window.addEventListener("resize", () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        // Stop animations temporarily while resizing to avoid weird jumps
        this.elements.carouselTrack.classList.add("no-transition");
        this.updateCarousel();

        // Turn animations back on after everything is repositioned
        setTimeout(() => {
          this.elements.carouselTrack.classList.remove("no-transition");
        }, 50);
      }, CAROUSEL_UPDATE_DELAY);
    });
  }

  /**
   * Refreshes everything - how many cards to show, where they're positioned, etc.
   */
  updateCarousel() {
    this.cardsPerView = ResponsiveUtils.getCardsPerView();
    this.populateAllCards();
    this.updateCardAreaPosition();
    this.updateNavigationButtons();
    this.updateProgressBar();
  }

  /**
   * Slides to a specific position with smooth animation
   */
  smoothTransitionTo(targetIndex) {
    if (this.isTransitioning || targetIndex === this.currentIndex) return;

    this.isTransitioning = true;
    this.currentIndex = targetIndex;

    this.elements.carouselTrack.classList.add("transitioning");
    this.updateCardAreaPosition();
    this.updateProgressBar();

    // Different animation speeds for mobile vs desktop
    const transitionDuration = window.innerWidth < 768 ? 300 : 400;
    setTimeout(() => {
      this.isTransitioning = false;
    }, transitionDuration);
  }

  /**
   * Moves the carousel smoothly instead of jumping whole cards at a time
   * Like scrolling through photos on your phone - small, smooth movements
   */
  smoothIncrementalScroll(isLeft) {
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    const cardWidth = 320; // How wide each card is
    const gapWidth = 8; // Space between cards
    const cardPlusGap = cardWidth + gapWidth;

    // Move by 1/3 of a card width instead of a full card (feels more natural)
    const scrollIncrement = Math.floor(cardPlusGap / 3);

    const currentScroll = this.elements.carouselTrack.style.transform
      ? parseInt(
          this.elements.carouselTrack.style.transform.match(/-?\d+/)[0],
        ) || 0
      : 0;

    let newScrollPosition = isLeft
      ? currentScroll + scrollIncrement
      : currentScroll - scrollIncrement;

    const totalWidth = this.total * cardPlusGap;
    const maxScroll = totalWidth - this.cardsPerView * cardPlusGap;

    // Make it loop around - when you reach the end, it goes back to the start
    if (isLeft) {
      if (newScrollPosition > 0) {
        newScrollPosition = -(
          totalWidth -
          this.cardsPerView * cardPlusGap -
          scrollIncrement
        );
      }
    } else {
      if (newScrollPosition < -maxScroll) {
        newScrollPosition = scrollIncrement;
      }
    }

    this.animateScrollTo(newScrollPosition);
  }

  /**
   * Creates smooth movement animation - like dragging something and watching it glide
   * Much smoother than just jumping to the new position
   */
  animateScrollTo(targetPosition) {
    const startPosition = this.elements.carouselTrack.style.transform
      ? parseInt(
          this.elements.carouselTrack.style.transform.match(/-?\d+/)[0],
        ) || 0
      : 0;

    const distance = targetPosition - startPosition;
    const duration = 300; // Animation takes 300 milliseconds
    let startTime = null;

    // Makes the animation start slow, speed up, then slow down (like real physics)
    const easeInOutCubic = (t) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animateScroll = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);

      const currentPosition = startPosition + distance * easedProgress;
      this.elements.carouselTrack.style.transform = `translateX(${currentPosition}px)`;

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        this.isTransitioning = false;
        this.updateProgressBar();
      }
    };

    requestAnimationFrame(animateScroll);
  }

  /**
   * Creates all the auction cards and puts them in the carousel
   */
  populateAllCards() {
    this.elements.carouselTrack.innerHTML = "";

    this.listings.forEach((listing, index) => {
      const card =
        typeof createListingCard !== "undefined"
          ? createListingCard(listing)
          : createCarouselCard(listing);

      const cardWrapper = document.createElement("div");
      cardWrapper.className = "carousel-card-wrapper fade-in";

      // Remove hover effects that would interfere with the sliding animation
      if (card && typeof card.className === "string") {
        card.className += " carousel-card";
        card.className = card.className
          .replace("transform hover:scale-[1.02] hover:-translate-y-1", "")
          .replace("hover:scale-[1.02]", "")
          .replace("hover:-translate-y-1", "")
          .replace("transform", "");
      }

      if (card instanceof Node) {
        cardWrapper.appendChild(card);
        ImageHandler.optimizeCardImages(card);
      } else {
        const errorDiv = document.createElement("div");
        errorDiv.textContent = "Invalid carousel card";
        cardWrapper.appendChild(errorDiv);
      }
      this.elements.carouselTrack.appendChild(cardWrapper);
    });
  }

  /**
   * Moves the strip of cards to the right position
   * Like sliding a film strip to show different frames
   */
  updateCardAreaPosition() {
    if (!this.elements.carouselTrack) return;

    const cardWidth = 320;
    const gapWidth = 8;
    const cardPlusGap = cardWidth + gapWidth;

    const translateX = -(this.currentIndex * cardPlusGap);

    this.elements.carouselTrack.style.transform = `translateX(${translateX}px)`;

    // Make the viewing window the right size for the current screen
    const isMobileView = window.innerWidth < 768;
    const finalCardsToShow = isMobileView ? 1 : this.cardsPerView;
    const containerWidth =
      cardWidth * finalCardsToShow +
      gapWidth * Math.max(0, finalCardsToShow - 1);

    this.elements.cardArea.style.width = `${containerWidth}px`;
  }

  /**
   * Keeps the left and right buttons always clickable since we have infinite scrolling
   */
  updateNavigationButtons() {
    this.updateButtonState(this.elements.leftBtn, false);
    this.updateButtonState(this.elements.rightBtn, false);
  }

  /**
   * Changes how the buttons look when they're enabled or disabled
   */
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

  /**
   * Updates the progress bar to show how far through the carousel you are
   * Like the progress bar on a video player
   */
  updateProgressBar() {
    if (!this.elements.progressFill) return;

    const currentScroll = this.elements.carouselTrack.style.transform
      ? parseInt(
          this.elements.carouselTrack.style.transform.match(/-?\d+/)[0],
        ) || 0
      : 0;

    const cardWidth = 320;
    const gapWidth = 8;
    const cardPlusGap = cardWidth + gapWidth;
    const totalWidth = this.total * cardPlusGap;
    const maxScroll = totalWidth - this.cardsPerView * cardPlusGap;

    const progress =
      maxScroll > 0 ? (Math.abs(currentScroll) / maxScroll) * 100 : 0;
    const clampedProgress = Math.min(progress, 100);

    this.elements.progressFill.style.width = `${clampedProgress}%`;

    const progressText = `Showing ${this.total} items`;
    this.elements.scrollBar.setAttribute("title", progressText);
  }
}

/**
 * API service for fetching auction data from the server.
 * @type {Object}
 */
export const CarouselAPIService = {
  /**
   * Gets the latest auction items that are still active (not ended yet).
   * Automatically removes any auctions that have already finished.
   * @param {number} [limit=DEFAULT_LISTINGS_LIMIT] - Number of listings to fetch.
   * @returns {Promise<Object[]>} Array of active auction listings.
   */
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

    // Only keep auctions that haven't ended yet
    const activeListings = (responseData.data || []).filter((listing) => {
      if (!listing.endsAt) return true; // If no end date, assume it's still active
      const endTime = Date.parse(listing.endsAt);
      return !isNaN(endTime) && endTime > now;
    });

    return activeListings;
  },
};

/**
 * Main controller for carousel: loads data, handles loading/error states, and renders carousel.
 * @type {Object}
 */
export const CarouselController = {
  /**
   * Loads auction items and displays them in the carousel.
   * Shows a loading spinner while getting data, then either shows the carousel or an error.
   * @param {Object} elements - DOM elements for carousel and loading/error states.
   * @returns {Promise<void>}
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
