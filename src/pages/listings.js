/**
 * AUCTION LISTINGS PAGE CONTROLLER
 * ================================
 *
 * This file manages the main listings page functionality for the auction house application.
 * It handles displaying auction listings in a responsive grid, pagination, search/filter integration,
 * modal-based listing creation, and user authentication states.
 *
 * Key Features:
 * - Dynamic listing cards with responsive design and hover effects
 * - Pagination system with "Load More" and "View Less" functionality
 * - Integration with search and sort component for filtering listings
 * - Modal interface for authenticated users to create new listings
 * - Real-time updates based on authentication status changes
 * - Optimized image handling with fallbacks for missing images
 * - State management for listings, pagination, and search results
 *
 * Architecture:
 * - Modular class-based design with separation of concerns
 * - DOM element caching for performance optimization
 * - Event-driven communication with search/sort components
 * - Reactive UI updates based on application state changes
 */

import { isAuthenticated, getAuthHeader } from "../library/auth.js";
import { NewListingModalManager } from "../components/modalManager.js";
import { createListing } from "../library/newListing.js";
import { searchAndSortComponent } from "../components/searchAndSort.js";
import { config } from "../services/config.js";
import { API_BASE_URL } from "../services/baseApi.js";
import { createPaginationButtons } from "../components/buttons.js";
import { processTags } from "../utils/tagUtils.js";
import { TimeUtils } from "../utils/timeUtils.js";
import { safeFetch, createCachedFetch } from "../utils/requestManager.js";

/**
 * APPLICATION CONSTANTS
 * Configuration values and styling dimensions used throughout the listings page
 */
const CONSTANTS = {
  DEFAULT_SELLER_AVATAR: "https://placehold.co/40x40?text=S", // Fallback avatar for sellers
  DIMENSIONS: {
    CARD_HEIGHT: "420px", // Fixed height for listing cards
    IMAGE_HEIGHT: "192px", // Height for listing images
    CONTENT_HEIGHT: "228px", // Height for card content area
  },
  MAX_TAGS: 10, // Maximum allowed tags per listing
  LISTINGS_PER_PAGE: 12, // Number of listings to show per page
};

/**
 * UTILITY FUNCTIONS
 * Helper functions for common operations used across the listings page
 */
const Utils = {
  /**
   * Clears search results from all search inputs and URL parameters
   * Resets the page to show all listings without search filters
   */
  clearSearchResults() {
    const headerSearch = document.getElementById("header-search");
    const mobileSearch = document.getElementById("mobile-search");

    if (headerSearch) headerSearch.value = "";
    if (mobileSearch) mobileSearch.value = "";

    // Remove search parameter from URL without page reload
    const url = new URL(window.location);
    url.searchParams.delete("search");
    window.history.replaceState({}, "", url);
  },

  /**
   * Sets the minimum datetime for datetime-local inputs to current time
   * Prevents users from creating listings that end in the past
   * @param {HTMLInputElement} element - The datetime input element
   */
  setMinimumDateTime(element) {
    if (!element) {
      console.warn("setMinimumDateTime: Element not found");
      return;
    }

    try {
      const now = new Date();
      // Convert to local datetime string format required by datetime-local input
      const localDateTime = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16);

      element.min = localDateTime;
    } catch (error) {
      console.error("Error setting minimum datetime:", error);
    }
  },
};

/**
 * DOM ELEMENT MANAGER
 * ==================
 *
 * Centralized manager for all DOM element references used in the listings page.
 * Implements caching strategy to prevent repeated DOM queries and provides
 * organized access to different element groups (core, search, modal, form).
 */
class DOMElementManager {
  constructor() {
    this.cache = new Map(); // Cache for DOM element references
    this.initializeElements();
  }

  /**
   * Initializes all DOM element references and stores them in cache
   * Groups elements by functionality for better organization
   */
  initializeElements() {
    // Core page elements for content display and loading states
    this.setElements({
      listingsContainer: "listings-container", // Main container for listing cards
      messageContainer: "message-container", // Container for status messages
      messageText: "message-text", // Text element for messages
      loadingSpinner: "loading-spinner", // Loading indicator
    });

    // Search interface elements
    this.setElements({
      headerSearch: "header-search", // Search input in header
      mobileSearch: "mobile-search", // Search input in mobile menu
    });

    // Modal and form elements for listing creation
    this.setModalElements();
    this.setFormElements();
  }

  /**
   * Stores multiple DOM elements in the cache
   * @param {Object} elements - Object mapping cache keys to element IDs
   */
  setElements(elements) {
    Object.entries(elements).forEach(([key, id]) => {
      this.cache.set(key, document.getElementById(id));
    });
  }

  /**
   * Sets up modal-related DOM element references
   * Handles the "Add New Listing" modal interface
   */
  setModalElements() {
    const modalElements = {
      addListingModal: "addListingModal", // Modal container
      addListingForm: "addListingForm", // Form inside modal
      closeAddListingModal: "closeAddListingModal", // Close button
      cancelAddListingBtn: "cancelAddListingBtn", // Cancel button
      addListingBtn: "addListingBtn", // Button to open modal
    };

    this.setElements(modalElements);
  }

  /**
   * Sets up form field references for new listing creation
   * Maps form input elements for easy access during form processing
   */
  setFormElements() {
    const formElements = {
      listingTitle: "listingTitle", // Title input field
      listingDesc: "listingDesc", // Description textarea
      listingEndDate: "listingEndDate", // End date/time picker
      listingTags: "listingTags", // Tags input field
    };

    this.setElements(formElements);
  }

  /**
   * Retrieves a cached DOM element by key
   * @param {string} elementKey - The cache key for the element
   * @returns {HTMLElement|null} The cached DOM element or null if not found
   */
  get(elementKey) {
    return this.cache.get(elementKey);
  }

  /**
   * Retrieves multiple cached DOM elements
   * @param {string[]} elementKeys - Array of cache keys
   * @returns {Object} Object mapping keys to their corresponding DOM elements
   */
  getAll(elementKeys) {
    return elementKeys.reduce((acc, key) => {
      acc[key] = this.get(key);
      return acc;
    }, {});
  }
}

/**
 * STATE MANAGER
 * =============
 *
 * Manages the application state for the listings page including listings data,
 * search results, pagination state, and loading states. Provides a centralized
 * way to access and update page state with method chaining for convenience.
 */
class StateManager {
  constructor() {
    this.state = {
      listings: [], // All available listings from API
      filteredListings: [], // Filtered listings from search/sort
      selectedMediaUrls: [], // Media URLs for new listing creation
      isLoading: false, // Current loading state
      currentSearch: null, // Current search query
      displayedListingsCount: 0, // Number of listings currently displayed
      showingAll: false, // Whether all available listings are shown
    };
  }

  // Listings management methods
  setListings(listings) {
    this.state.listings = [...listings];
    return this;
  }

  getListings() {
    return [...this.state.listings];
  }

  // Filtered listings management (for search results)
  setFilteredListings(listings) {
    this.state.filteredListings = [...listings];
    return this;
  }

  getFilteredListings() {
    return [...this.state.filteredListings];
  }

  // Media URLs management for listing creation
  setMediaUrls(urls) {
    this.state.selectedMediaUrls = [...urls];
    return this;
  }

  getMediaUrls() {
    return [...this.state.selectedMediaUrls];
  }

  clearMediaUrls() {
    this.state.selectedMediaUrls = [];
    return this;
  }

  // Loading state management
  setLoading(isLoading) {
    this.state.isLoading = isLoading;
    return this;
  }

  isLoading() {
    return this.state.isLoading;
  }

  // Search state management
  setCurrentSearch(searchQuery) {
    this.state.currentSearch = searchQuery;
    return this;
  }

  getCurrentSearch() {
    return this.state.currentSearch;
  }

  // Pagination state management
  setDisplayedListingsCount(count) {
    this.state.displayedListingsCount = count;
    return this;
  }

  getDisplayedListingsCount() {
    return this.state.displayedListingsCount;
  }

  setShowingAll(showingAll) {
    this.state.showingAll = showingAll;
    return this;
  }

  isShowingAll() {
    return this.state.showingAll;
  }

  incrementDisplayedCount(increment) {
    this.state.displayedListingsCount += increment;
    return this;
  }

  resetDisplayedCount() {
    this.state.displayedListingsCount = 0;
    return this;
  }
}

/**
 * LISTING CARD BUILDER
 * ====================
 *
 * Responsible for creating individual listing card elements with consistent
 * styling and layout. Handles image processing, seller information display,
 * time formatting, and responsive design for different screen sizes.
 */
class ListingCardBuilder {
  constructor() {
    // Base CSS classes for all listing cards
    this.cardClasses =
      "border border-gray-300 block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl hover:shadow-black transition-shadow duration-200 overflow-hidden w-full flex flex-col cursor-pointer transform hover:scale-[1.02] hover:-translate-y-1";
  }

  /**
   * Builds a complete listing card element from listing data
   * @param {Object} listing - The listing object containing all listing data
   * @returns {HTMLElement} Complete listing card element ready for DOM insertion
   */
  build(listing) {
    const timeInfo = TimeUtils.formatTimeRemainingForListings(listing.endsAt);
    const createdDate = new Date(listing.created);
    const imageUrl = this.extractImageUrl(listing.media);
    const sellerInfo = this.extractSellerInfo(listing.seller);

    const card = this.createCardElement(listing);
    card.innerHTML = this.generateCardHTML({
      imageUrl,
      title: listing.title,
      description: listing.description,
      createdDate,
      sellerInfo,
      timeInfo,
      bidCount: listing._count?.bids || 0,
    });

    this.handleImageError(card, imageUrl);
    return card;
  }

  /**
   * Creates the base card element with proper linking and styling
   * @param {Object} listing - Listing object containing ID for link generation
   * @returns {HTMLAnchorElement} Base card element configured as clickable link
   */
  createCardElement(listing) {
    const card = document.createElement("a");
    card.href = `/item.html?id=${listing.id}`;
    card.className = this.cardClasses;
    card.style.cssText = `height: 480px; min-height: 480px; max-height: 490px;`;
    return card;
  }

  /**
   * Extracts the primary image URL from listing media array
   * @param {Array} media - Array of media objects from listing
   * @returns {string|null} Primary image URL or null if no valid image
   */
  extractImageUrl(media) {
    return media && media.length > 0 && media[0].url ? media[0].url : null;
  }

  /**
   * Extracts and normalizes seller information with fallbacks
   * @param {Object} seller - Seller object from listing
   * @returns {Object} Normalized seller info with name and avatar
   */
  extractSellerInfo(seller) {
    return {
      name: seller?.name || "Unknown",
      avatar: seller?.avatar?.url || CONSTANTS.DEFAULT_SELLER_AVATAR,
    };
  }

  /**
   * Generates the complete HTML structure for a listing card
   * @param {Object} params - Object containing all card data
   * @returns {string} Complete HTML string for card content
   */
  generateCardHTML({
    imageUrl,
    title,
    description,
    createdDate,
    sellerInfo,
    timeInfo,
    bidCount,
  }) {
    // Show 'Sold' badge if auction is ended and has bids, 'Not Sold' if ended and no bids
    let wonBadge = "";
    if (timeInfo.isEnded) {
      if (bidCount > 0) {
        wonBadge = `<div class="absolute top-2 left-2 z-10 bg-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg" style="pointer-events:none;">Sold</div>`;
      } else {
        wonBadge = `<div class="absolute top-2 left-2 z-10 bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg" style="pointer-events:none;">Not Sold</div>`;
      }
    }

    return `
      <div class="relative">
        ${wonBadge}
        ${this.generateImageHTML(imageUrl, title)}
      </div>
      <div class="p-4 flex-1 flex flex-col min-h-0" style="height: ${CONSTANTS.DIMENSIONS.CONTENT_HEIGHT}; min-height: ${CONSTANTS.DIMENSIONS.CONTENT_HEIGHT}; max-height: ${CONSTANTS.DIMENSIONS.CONTENT_HEIGHT};">
        ${this.generateTitleHTML(title)}
        ${this.generateDescriptionHTML(description)}
        ${this.generateSellerInfoHTML(createdDate, sellerInfo)}
        ${this.generateTimeAndBidsHTML(timeInfo, bidCount)}
      </div>
    `;
  }

  /**
   * Generates HTML for the listing image or fallback placeholder
   * @param {string|null} imageUrl - URL of the listing image
   * @param {string} title - Listing title for alt text
   * @returns {string} HTML for image section
   */
  generateImageHTML(imageUrl, title) {
    // Create descriptive alt text using the title
    const altText = title
      ? `Auction listing image for: ${title}`
      : "Auction listing image";

    if (imageUrl) {
      return `<div class="w-full flex-shrink-0 bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center" style="height: ${CONSTANTS.DIMENSIONS.IMAGE_HEIGHT}; min-height: ${CONSTANTS.DIMENSIONS.IMAGE_HEIGHT}; max-height: ${CONSTANTS.DIMENSIONS.IMAGE_HEIGHT};">
        <img src="${imageUrl}" alt="${altText}" loading="lazy" class="w-full h-full object-contain listing-image transition-transform duration-300 hover:scale-105" style="max-width: 100%; max-height: 100%;">
      </div>`;
    }

    // Fallback gradient placeholder for listings without images
    return `<div class="w-full flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-500 text-black text-center font-semibold text-lg italic flex-shrink-0 transition-all duration-300 hover:from-pink-500 hover:to-purple-600" style="height: ${CONSTANTS.DIMENSIONS.IMAGE_HEIGHT}; min-height: ${CONSTANTS.DIMENSIONS.IMAGE_HEIGHT}; max-height: ${CONSTANTS.DIMENSIONS.IMAGE_HEIGHT};" role="img" aria-label="No image available for this auction listing: ${title || "Untitled item"}">
      No image on this listing
    </div>`;
  }

  /**
   * Generates HTML for the listing title with proper line clamping
   * @param {string} title - The listing title
   * @returns {string} HTML for title section
   */
  generateTitleHTML(title) {
    return `<h2 class="text-lg font-semibold mb-2 line-clamp-2 text-gray-900 dark:text-white transition-colors duration-200 hover:text-pink-800 dark:hover:text-pink-400" style="height: 48px; min-height: 48px; max-height: 48px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${title}</h2>`;
  }

  /**
   * Generates HTML for the listing description with line clamping
   * @param {string} description - The listing description
   * @returns {string} HTML for description section
   */
  generateDescriptionHTML(description) {
    return `<p class="text-gray-700 dark:text-gray-300 text-sm mb-3 flex-1 overflow-hidden transition-colors duration-200" style="height: 64px; min-height: 64px; max-height: 64px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">${description || "No description provided."}</p>`;
  }

  /**
   * Generates HTML for seller information and creation date
   * @param {Date} createdDate - When the listing was created
   * @param {Object} sellerInfo - Seller name and avatar information
   * @returns {string} HTML for seller info section
   */
  generateSellerInfoHTML(createdDate, sellerInfo) {
    // Create descriptive alt text for seller avatar
    const avatarAltText = `Profile picture of ${sellerInfo.name}, the seller of this auction item`;

    return `<div class="flex flex-col items-start gap-1 text-gray-500 dark:text-gray-400 mb-2 flex-shrink-0">
      <span class="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">Created: ${createdDate.toLocaleDateString()}</span>
      <div class="flex items-center gap-2 mb-3">
        <span class="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 transition-all duration-200 hover:border-pink-400 dark:hover:border-pink-500 hover:shadow-md flex-shrink-0" style="width: 32px; height: 32px; min-width: 32px; min-height: 32px;">
          <img src="${sellerInfo.avatar}" alt="${avatarAltText}" loading="lazy" class="w-full h-full object-cover rounded-full" style="display: block; width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
        </span>
        <span class="text-sm text-gray-600 dark:text-gray-400">${sellerInfo.name}</span>
      </div>
    </div>`;
  }

  /**
   * Generates HTML for time remaining and bid count information
   * @param {Object} timeInfo - Formatted time information with styling classes
   * @param {number} bidCount - Number of bids on the listing
   * @returns {string} HTML for time and bids section
   */
  generateTimeAndBidsHTML(timeInfo, bidCount) {
    return `<div class="flex items-center justify-between text-md text-gray-600 font-semibold dark:text-white mb-3 flex-shrink-0" style="height: 24px; min-height: 24px; max-height: 24px;">
      <span class="font-medium ${timeInfo.class} transition-colors duration-200 truncate" style="max-width: 60%;">${timeInfo.text}</span>
      <span class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-md font-medium  flex-shrink-0">Bids: ${bidCount}</span>
    </div>`;
  }

  /**
   * Sets up error handling for listing images
   * Replaces broken images with fallback placeholder
   * @param {HTMLElement} card - The card element containing the image
   * @param {string|null} imageUrl - The original image URL
   */
  handleImageError(card, imageUrl) {
    if (!imageUrl) return;

    const img = card.querySelector(".listing-image");
    if (img) {
      img.addEventListener("error", function () {
        // Replace broken image with fallback placeholder
        this.parentElement.outerHTML = `<div class="w-full flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-500 text-white text-center font-semibold text-lg italic flex-shrink-0 transition-all duration-300 hover:from-pink-500 hover:to-purple-600" style="height: ${CONSTANTS.DIMENSIONS.IMAGE_HEIGHT}; min-height: ${CONSTANTS.DIMENSIONS.IMAGE_HEIGHT}; max-height: ${CONSTANTS.DIMENSIONS.IMAGE_HEIGHT};">No image on this listing</div>`;
      });
    }
  }
}

/**
 * UI MANAGER
 * ==========
 *
 * Handles all user interface operations for the listings page including
 * displaying listings, managing loading states, pagination controls,
 * search indicators, and authentication-based UI updates.
 */
class UIManager {
  constructor(elementManager, cardBuilder) {
    this.elements = elementManager; // Reference to DOM element manager
    this.cardBuilder = cardBuilder; // Reference to card builder for creating listing cards
  }

  /**
   * Displays a status message to the user
   * @param {string} message - The message text to display
   * @param {string} type - Message type: "info", "error", etc.
   */
  showMessage(message, type = "info") {
    const messageText = this.elements.get("messageText");
    const messageContainer = this.elements.get("messageContainer");
    const listingsContainer = this.elements.get("listingsContainer");

    if (!messageText || !messageContainer || !listingsContainer) return;

    messageText.textContent = message;
    messageContainer.className = `mt-8 text-center ${
      type === "error" ? "text-red-600" : "text-gray-600 dark:text-gray-300"
    }`;

    messageContainer.classList.remove("hidden");
    listingsContainer.innerHTML = "";
  }

  /**
   * Shows the loading spinner and hides other content
   * Used during API calls and data processing
   */
  showLoading() {
    const { loadingSpinner, messageContainer, listingsContainer } =
      this.elements.getAll([
        "loadingSpinner",
        "messageContainer",
        "listingsContainer",
      ]);

    if (!loadingSpinner) return;

    loadingSpinner.classList.remove("hidden");
    messageContainer?.classList.add("hidden");
    if (listingsContainer) listingsContainer.innerHTML = "";
  }

  /**
   * Hides the loading spinner
   * Called when loading operations complete
   */
  hideLoading() {
    const loadingSpinner = this.elements.get("loadingSpinner");
    if (loadingSpinner) {
      loadingSpinner.classList.add("hidden");
    }
  }

  /**
   * Displays an error message to the user
   * @param {string} message - The error message to display
   */
  showError(message) {
    this.showMessage(message, "error");
  }

  /**
   * Displays the initial batch of listings (first page)
   * @param {Array} allListings - Complete array of listings to display
   * @param {StateManager} state - Application state manager
   */
  displayInitialListings(allListings, state) {
    const listingsContainer = this.elements.get("listingsContainer");
    if (!listingsContainer) return;

    this.hideLoading();
    const messageContainer = this.elements.get("messageContainer");
    if (messageContainer) {
      messageContainer.classList.add("hidden");
    }

    if (allListings.length === 0) {
      this.showMessage("No listings found.", "info");
      this.hideLoadMoreButton();
      return;
    }

    // Show only the first page of listings
    const initialListings = allListings.slice(0, CONSTANTS.LISTINGS_PER_PAGE);
    state.setDisplayedListingsCount(initialListings.length);

    // Clear container and add listings using document fragment for performance
    listingsContainer.innerHTML = "";
    const fragment = document.createDocumentFragment();

    initialListings.forEach((listing) => {
      fragment.appendChild(this.cardBuilder.build(normalizeListing(listing)));
    });

    listingsContainer.appendChild(fragment);

    // Update pagination controls
    this.updateLoadMoreButton(allListings.length, state);
  }

  /**
   * Appends additional listings to the existing display (pagination)
   * @param {Array} allListings - Complete array of available listings
   * @param {StateManager} state - Application state manager
   */
  appendMoreListings(allListings, state) {
    const listingsContainer = this.elements.get("listingsContainer");
    if (!listingsContainer) return;

    const currentCount = state.getDisplayedListingsCount();
    const nextBatch = allListings.slice(
      currentCount,
      currentCount + CONSTANTS.LISTINGS_PER_PAGE,
    );

    if (nextBatch.length === 0) return;

    // Add new listings using document fragment for performance
    const fragment = document.createDocumentFragment();
    nextBatch.forEach((listing) => {
      fragment.appendChild(this.cardBuilder.build(normalizeListing(listing)));
    });

    listingsContainer.appendChild(fragment);
    state.incrementDisplayedCount(nextBatch.length);

    // Update pagination controls
    this.updateLoadMoreButton(allListings.length, state);
  }

  /**
   * Updates the pagination button visibility and functionality
   * @param {number} totalListings - Total number of available listings
   * @param {StateManager} state - Application state manager
   */
  updateLoadMoreButton(totalListings, state) {
    const loadMoreContainer = this.getOrCreateLoadMoreContainer();
    const currentCount = state.getDisplayedListingsCount();

    if (currentCount >= totalListings) {
      // All listings displayed - show "View Less" if more than one page
      if (currentCount > CONSTANTS.LISTINGS_PER_PAGE) {
        const viewLessButton = createPaginationButtons({
          showViewLess: true,
          viewLessText: "View Less",
          onViewLess: () => this.handleViewLess(state),
          viewLessId: "viewLessBtn",
        });

        loadMoreContainer.innerHTML = "";
        if (viewLessButton) {
          loadMoreContainer.appendChild(viewLessButton);
        }
      } else {
        loadMoreContainer.innerHTML = "";
      }
      state.setShowingAll(true);
    } else {
      // More listings available - show "Load More" and optional "View Less"
      const remainingCount = totalListings - currentCount;
      const nextBatchSize = Math.min(
        remainingCount,
        CONSTANTS.LISTINGS_PER_PAGE,
      );

      const showViewLess = currentCount > CONSTANTS.LISTINGS_PER_PAGE;

      const buttonContainer = createPaginationButtons({
        showLoadMore: true,
        showViewLess: showViewLess,
        viewLessText: "View Less",
        onLoadMore: () => this.handleLoadMore(state),
        onViewLess: () => this.handleViewLess(state),
        loadMoreId: "loadMoreBtn",
        viewLessId: "viewLessBtn",
      });

      loadMoreContainer.innerHTML = "";
      if (buttonContainer) {
        loadMoreContainer.appendChild(buttonContainer);
      }
      state.setShowingAll(false);
    }
  }

  /**
   * Handles the "Load More" button click
   * Loads additional listings based on current display state
   * @param {StateManager} state - Application state manager
   */
  handleLoadMore(state) {
    const currentSearch = state.getCurrentSearch();

    if (currentSearch && currentSearch.trim() !== "") {
      // Load more from filtered search results
      const filteredListings = state.getFilteredListings();
      this.appendMoreListings(filteredListings, state);
    } else {
      // Load more from all available listings
      const allListings = state.getListings();
      this.appendMoreListings(allListings, state);
    }
  }

  /**
   * Handles the "View Less" button click
   * Resets display to show only the first page of listings
   * @param {StateManager} state - Application state manager
   */
  handleViewLess(state) {
    const currentSearch = state.getCurrentSearch();

    if (currentSearch && currentSearch.trim() !== "") {
      // Reset to first page of search results
      const filteredListings = state.getFilteredListings();
      state.resetDisplayedCount();
      this.displayInitialListings(filteredListings, state);
      this.updateSearchIndicator(currentSearch, filteredListings.length);
    } else {
      // Reset to first page of all listings
      const allListings = state.getListings();
      state.resetDisplayedCount();
      this.displayInitialListings(allListings, state);
    }
  }

  /**
   * Hides the pagination button container
   * Used when no pagination is needed
   */
  hideLoadMoreButton() {
    const loadMoreContainer = this.getOrCreateLoadMoreContainer();
    loadMoreContainer.innerHTML = "";
  }

  /**
   * Gets or creates the container for pagination buttons
   * @returns {HTMLElement} The pagination button container
   */
  getOrCreateLoadMoreContainer() {
    let container = document.getElementById("load-more-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "load-more-container";

      const listingsContainer = this.elements.get("listingsContainer");
      if (listingsContainer && listingsContainer.parentNode) {
        listingsContainer.parentNode.insertBefore(
          container,
          listingsContainer.nextSibling,
        );
      }
    }
    return container;
  }

  /**
   * Updates the UI based on user authentication status
   * Shows/hides the "Add Listing" button for authenticated users
   */
  updateAuthUI() {
    const addListingBtn = this.elements.get("addListingBtn");
    if (!addListingBtn) return;

    if (isAuthenticated()) {
      addListingBtn.classList.remove("hidden");
    } else {
      addListingBtn.classList.add("hidden");
    }
  }

  /**
   * Displays a search results indicator above the listings
   * @param {string} query - The search query that was performed
   * @param {number} resultCount - Number of results found
   */
  updateSearchIndicator(query, resultCount) {
    this.removeSearchIndicator();

    const indicator = document.createElement("div");
    indicator.id = "search-indicator";
    indicator.className =
      "mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg";

    indicator.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <p class="text-blue-800 dark:text-blue-200 font-medium">
            Search results for "${query}" (${resultCount} ${resultCount === 1 ? "result" : "results"})
          </p>
        </div>
        <button onclick="clearSearchResults()" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm underline">
          Clear search
        </button>
      </div>
    `;

    const listingsContainer = this.elements.get("listingsContainer");
    if (listingsContainer?.parentNode) {
      listingsContainer.parentNode.insertBefore(indicator, listingsContainer);
    }
  }

  /**
   * Removes the search results indicator from the page
   * Called when clearing search or performing new searches
   */
  removeSearchIndicator() {
    const indicator = document.getElementById("search-indicator");
    if (indicator) {
      indicator.remove();
    }
  }
}

/**
 * API SERVICE
 * ===========
 *
 * Handles all API communication for the listings page.
 * Manages authentication headers, error handling, and data fetching
 * for auction listings with seller and bid information.
 */
class APIService {
  constructor() {
    this.baseURL = API_BASE_URL; // Base URL for API requests
    this.cachedFetch = createCachedFetch(300000); // 5 minute cache
    this.isInitialized = false; // Prevent duplicate initialization
  }

  /**
   * Fetches all auction listings with seller and bid information
   * @returns {Promise<Array>} Array of listing objects
   * @throws {Error} If API request fails
   */
  async fetchListings() {
    try {
      const headers = this.buildHeaders();
      const url = `${this.baseURL}/auction/listings?_seller=true&_bids=true&limit=100&sort=created&sortOrder=desc`;

      const response = await safeFetch(url, { headers });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const responseData = await response.json();

      return responseData.data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Builds HTTP headers for API requests including authentication
   * @returns {Object} Headers object for fetch requests
   */
  buildHeaders() {
    const headers = {
      "Content-Type": "application/json",
      "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
    };

    // Add authentication header for logged-in users
    if (isAuthenticated()) {
      headers["Authorization"] = getAuthHeader().Authorization;
    }

    return headers;
  }

  /**
   * Handles API error responses and throws appropriate errors
   * @param {Response} response - The failed fetch response
   * @throws {Error} Parsed error message from API response
   */
  async handleErrorResponse(response) {
    const errorData = await response.json();
    throw new Error(
      errorData.errors?.[0]?.message || "Failed to fetch listings.",
    );
  }
}

/**
 * MODAL MANAGER
 * =============
 *
 * Manages the "Add New Listing" modal interface including opening/closing,
 * form setup, and integration with the listing creation process.
 */
class ModalManager {
  constructor(elementManager, state, ui) {
    this.elements = elementManager;
    this.state = state;
    this.ui = ui;

    this.listingModal = null;
  }

  initNewListingModal() {
    this.listingModal = new NewListingModalManager({
      onSuccess: async (listing) => {
        // Handle successful listing creation
        await this.reloadListings();
      },
      onError: (errorMessage) => {
        this.ui.showError(errorMessage);
      },
    });
  }

  openAddListingModal() {
    if (!this.listingModal) {
      this.initNewListingModal();
    }
    this.listingModal.openModal();
  }

  closeAddListingModal() {
    if (this.listingModal) {
      this.listingModal.closeModal();
    }
  }

  async reloadListings() {
    // The reload functionality from your EventHandler
    try {
      const listings = await this.apiService.fetchListings();
      this.state.setListings(listings);
      this.state.resetDisplayedCount();
      this.ui.displayInitialListings(listings, this.state);
    } catch (error) {
      this.ui.showError(`Error: ${error.message}`);
    } finally {
      this.ui.hideLoading();
    }
  }
}

/**
 * EVENT HANDLER
 * ==============
 *
 * Centralized event management for the listings page. Handles all user
 * interactions including search events, modal interactions, form submissions,
 * authentication changes, and pagination events.
 */
class EventHandler {
  constructor(elementManager, modalManager, ui, state, apiService) {
    this.elements = elementManager; // DOM element manager
    this.modalManager = modalManager; // Modal manager
    this.ui = ui; // UI manager
    this.state = state; // State manager
    this.apiService = apiService; // API service
  }

  /**
   * Sets up all event listeners for the listings page
   * Coordinates different types of events and user interactions
   */
  setupAllEventListeners() {
    this.setupSearchEvents(); // Search and filter events
    this.setupModalEvents(); // Modal open/close events
    this.setupMediaModalEvents(); // Media modal events
    this.setupFormEvents(); // Form submission events
    this.setupAuthEvents(); // Authentication change events
    this.setupLoadMoreEvents(); // Pagination events
  }

  /**
   * Sets up search-related event listeners
   * Handles search results from the search component and clear functionality
   */
  setupSearchEvents() {
    // Listen for search results from the search component
    window.addEventListener("searchPerformed", (event) =>
      this.handleSearchResults(event),
    );

    // Global function for clearing search results
    window.clearSearchResults = () => {
      Utils.clearSearchResults();
      this.ui.removeSearchIndicator();
      this.state.setCurrentSearch(null);
      this.state.resetDisplayedCount();
      this.ui.displayInitialListings(this.state.getListings(), this.state);
    };
  }

  /**
   * Sets up modal-related event listeners
   * Handles opening the "Add New Listing" modal and closing events
   */
  setupModalEvents() {
    const addListingBtn = this.elements.get("addListingBtn");
    if (addListingBtn && isAuthenticated()) {
      addListingBtn.addEventListener("click", () => {
        this.modalManager.openAddListingModal();
      });
    }

    this.setupModalCloseEvents();
  }

  /**
   * Sets up event listeners for closing the modal
   * Handles close button, cancel button, and backdrop clicks
   */
  setupModalCloseEvents() {
    const closeBtn = this.elements.get("closeAddListingModal");
    const cancelBtn = this.elements.get("cancelAddListingBtn");
    const modal = this.elements.get("addListingModal");

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.modalManager.closeAddListingModal();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.modalManager.closeAddListingModal();
      });
    }

    // Close modal when clicking on backdrop
    if (modal) {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) {
          this.modalManager.closeAddListingModal();
        }
      });
    }
  }

  /**
   * Sets up media modal event listeners
   * Handles opening/closing media modal and form interactions
   */
  setupMediaModalEvents() {
    // Open media modal button
    const openMediaModalBtn = document.getElementById("openMediaModalBtn");
    if (openMediaModalBtn) {
      openMediaModalBtn.addEventListener("click", () => {
        this.openMediaModal();
      });
    }

    // Back button in media modal
    const backToListingBtn = document.getElementById("backToListingBtn");
    if (backToListingBtn) {
      backToListingBtn.addEventListener("click", () => {
        this.closeMediaModal();
      });
    }

    // Add more media URLs button
    const addMoreUrlBtn = document.getElementById("addMoreUrlBtn");
    if (addMoreUrlBtn) {
      addMoreUrlBtn.addEventListener("click", () => {
        this.addMoreMediaUrlInput();
      });
    }

    // Media form submission
    const addMediaForm = document.getElementById("addMediaForm");
    if (addMediaForm) {
      addMediaForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleMediaFormSubmission();
      });
    }

    // Close media modal when clicking on backdrop
    const mediaModal = document.getElementById("addMediaModal");
    if (mediaModal) {
      mediaModal.addEventListener("click", (event) => {
        if (event.target === mediaModal) {
          this.closeMediaModal();
        }
      });
    }
  }

  /**
   * Sets up form submission event listeners
   * Handles the new listing creation form submission
   */
  setupFormEvents() {
    const form = this.elements.get("addListingForm");
    if (!form) return;

    // If the shared modal manager already owns this form, skip attaching legacy listener
    if (form.dataset.managed === "newListingModalManager") {
      return;
    }

    // Legacy fallback (only if not already bound)
    if (isAuthenticated() && !form.dataset.legacyBound) {
      form.dataset.legacyBound = "true";
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleFormSubmission();
      });
    }
  }

  /**
   * Sets up authentication change event listeners
   * Updates UI when user logs in/out in other tabs
   */
  setupAuthEvents() {
    window.addEventListener("storage", (e) => {
      if (e.key === "token" || e.key === "user") {
        this.ui.updateAuthUI();
      }
    });
  }

  /**
   * Sets up pagination event listeners using event delegation
   * Handles dynamically created "Load More" and "View Less" buttons
   */
  setupLoadMoreEvents() {
    document.addEventListener("click", (e) => {
      if (e.target && e.target.id === "loadMoreBtn") {
        this.handleLoadMore();
      } else if (e.target && e.target.id === "viewLessBtn") {
        this.handleViewLess();
      }
    });
  }

  /**
   * Handles "Load More" button clicks
   * Loads additional listings based on current search state
   */
  handleLoadMore() {
    const currentSearch = this.state.getCurrentSearch();

    if (currentSearch && currentSearch.trim() !== "") {
      // Load more from filtered search results
      const filteredListings = this.state.getFilteredListings();
      this.ui.appendMoreListings(filteredListings, this.state);
    } else {
      // Load more from all available listings
      const allListings = this.state.getListings();
      this.ui.appendMoreListings(allListings, this.state);
    }
  }

  /**
   * Handles "View Less" button clicks
   * Resets to showing only the first page of listings
   */
  handleViewLess() {
    const currentSearch = this.state.getCurrentSearch();

    if (currentSearch && currentSearch.trim() !== "") {
      // Reset to first page of search results
      const filteredListings = this.state.getFilteredListings();
      this.state.resetDisplayedCount();
      this.ui.displayInitialListings(filteredListings, this.state);
      this.ui.updateSearchIndicator(currentSearch, filteredListings.length);
    } else {
      // Reset to first page of all listings
      const allListings = this.state.getListings();
      this.state.resetDisplayedCount();
      this.ui.displayInitialListings(allListings, this.state);
    }
  }

  /**
   * Handles search results from the search component
   * Updates display based on search results and manages UI states
   * @param {Event} event - Custom event containing search results
   */
  handleSearchResults(event) {
    const { query, results, error, sortBy } = event.detail;

    if (error) {
      this.ui.showError(`Search error: ${error}`);
      return;
    }

    if (results.length === 0) {
      const message = this.getEmptyResultsMessage(query, sortBy);
      this.ui.showMessage(message, "info");
      this.ui.hideLoadMoreButton();
      return;
    }

    // Update state with search results
    this.state.setCurrentSearch(query);
    this.state.setFilteredListings(results);
    this.state.resetDisplayedCount();

    if (query.trim() === "") {
      // Show all results without search indicator
      this.ui.removeSearchIndicator();
      this.ui.displayInitialListings(results, this.state);
    } else {
      // Show search results with indicator
      this.ui.displayInitialListings(results, this.state);
      this.ui.updateSearchIndicator(query, results.length);
    }
  }

  /**
   * Generates appropriate message for empty search results
   * @param {string} query - The search query that was performed
   * @param {string} sortBy - The sort criteria that was applied
   * @returns {string} Appropriate empty results message
   */
  getEmptyResultsMessage(query, sortBy) {
    if (sortBy === "won-auctions") {
      return query.trim() === ""
        ? "No won auctions yet."
        : `No won auctions found for "${query}".`;
    }

    return query.trim() === ""
      ? "No listings available at the moment."
      : `No results found for "${query}".`;
  }

  /**
   * Handles new listing form submission
   * Collects form data, creates the listing, and updates the display
   */
  async handleFormSubmission() {
    const formData = this.collectFormData();

    try {
      await createListing({
        title: formData.title,
        description: formData.description,
        endsAt: formData.endsAt,
        media: this.state.getMediaUrls(),
        tags: formData.tags,
      });

      this.modalManager.closeAddListingModal();
      await this.reloadListings();
    } catch (err) {
      alert(err.message || "Failed to create listing.");
    }
  }

  /**
   * Collects data from the new listing form
   * @returns {Object} Form data object with title, description, endsAt, and tags
   */
  collectFormData() {
    return {
      title: this.elements.get("listingTitle")?.value.trim(),
      description: this.elements.get("listingDesc")?.value.trim(),
      endsAt: this.elements.get("listingEndDate")?.value,
      tags: this.elements.get("listingTags")?.value.trim() || "",
    };
  }

  /**
   * Reloads all listings from the API and updates the display
   * Called after creating a new listing to show updated data
   */
  async reloadListings() {
    this.ui.showLoading();
    try {
      const listings = await this.apiService.fetchListings();
      this.state.setListings(listings);
      this.state.resetDisplayedCount();
      this.ui.displayInitialListings(listings, this.state);
    } catch (error) {
      this.ui.showError(`Error: ${error.message}`);
    } finally {
      this.ui.hideLoading();
    }
  }

  /**
   * Opens the media upload modal
   */
  openMediaModal() {
    const mediaModal = document.getElementById("addMediaModal");
    if (mediaModal) {
      mediaModal.classList.remove("hidden");
    }
  }

  /**
   * Closes the media upload modal
   */
  closeMediaModal() {
    const mediaModal = document.getElementById("addMediaModal");
    if (mediaModal) {
      mediaModal.classList.add("hidden");
    }
  }

  /**
   * Adds another media URL input field
   */
  addMoreMediaUrlInput() {
    const mediaUrlInputs = document.getElementById("mediaUrlInputs");
    if (!mediaUrlInputs) return;

    const currentInputs = mediaUrlInputs.querySelectorAll(
      'input[name="mediaUrl"]',
    );
    const nextIndex = currentInputs.length + 1;

    const newInput = document.createElement("input");
    newInput.type = "url";
    newInput.name = "mediaUrl";
    newInput.placeholder = `Image URL ${nextIndex}`;
    newInput.setAttribute("aria-label", `Upload Media URL ${nextIndex}`);
    newInput.className =
      "w-full px-3 py-2 border rounded-sm focus:outline-hidden focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white";

    mediaUrlInputs.appendChild(newInput);
  }

  /**
   * Handles media form submission
   */
  handleMediaFormSubmission() {
    const mediaInputs = document.querySelectorAll('input[name="mediaUrl"]');
    const urls = [];

    mediaInputs.forEach((input) => {
      const url = input.value.trim();
      if (url) {
        urls.push({ url, alt: "" });
      }
    });

    // Store the media URLs in state
    this.state.setMediaUrls(urls);

    // Update the media count display in the main modal using modal manager
    this.modalManager.updateMediaCountDisplay(urls.length);

    // Close the media modal
    this.closeMediaModal();
  }
}

/**
 * MAIN APPLICATION CONTROLLER
 * ===========================
 *
 * The primary controller class that orchestrates all listings page functionality.
 * Manages initialization, coordinates between different managers, and handles
 * the complete lifecycle of the listings page from load to user interactions.
 */
class ListingsPageController {
  constructor() {
    // Initialize all manager classes with proper dependencies
    this.elementManager = new DOMElementManager();
    this.state = new StateManager();
    this.cardBuilder = new ListingCardBuilder();
    this.ui = new UIManager(this.elementManager, this.cardBuilder);
    this.apiService = new APIService();
    this.modalManager = new ModalManager(
      this.elementManager,
      this.state,
      this.ui,
    );
    this.eventHandler = new EventHandler(
      this.elementManager,
      this.modalManager,
      this.ui,
      this.state,
      this.apiService,
    );
    this.isInitialized = false; // Prevent duplicate initialization
  }

  /**
   * Initializes the listings page application
   * Sets up all components, loads data, and configures event handlers
   */
  async init() {
    // Prevent duplicate initialization
    if (this.isInitialized) {
      console.warn("ListingsPageController already initialized");
      return;
    }

    const listingsContainer = this.elementManager.get("listingsContainer");
    if (!listingsContainer) return;

    this.isInitialized = true;

    // Initialize search and sort component
    searchAndSortComponent.init();

    // Update UI based on authentication status
    this.ui.updateAuthUI();
    this.setDefaultSortButton();

    // Show informational message for non-authenticated users
    if (!isAuthenticated()) {
      const authMessage = document.querySelector(".auth-message");
      if (authMessage) {
        authMessage.textContent =
          "Log in or create user to bid and see user profiles";
        authMessage.className =
          "w-full mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-900 rounded text-center font-semibold";
      }
    }

    // Load initial data and set up interactions
    await this.loadListings();
    this.eventHandler.setupAllEventListeners();
    this.handleURLSearch();
  }

  /**
   * Loads listings from the API and displays them
   * Handles loading states and error conditions
   */
  async loadListings() {
    this.ui.showLoading();
    this.state.setLoading(true);

    try {
      const listings = await this.apiService.fetchListings();
      this.state.setListings(listings);
      this.state.resetDisplayedCount();

      if (listings.length === 0) {
        this.ui.showMessage("No listings found.", "info");
        return;
      }

      // Don't apply any automatic sort - use natural order
      this.ui.displayInitialListings(listings, this.state);
    } catch (error) {
      this.ui.showMessage(`Error: ${error.message}`, "error");
    } finally {
      this.ui.hideLoading();
      this.state.setLoading(false);
    }
  }

  /**
   * Sets the default sort button styling (no default sort selected)
   * Provides clean initial state without forcing any sort
   */
  setDefaultSortButton() {
    // Don't activate any sort button by default
    // Let users choose their preferred sorting
    const sortButtons = document.querySelectorAll(".sort-btn");
    sortButtons.forEach((btn) => {
      btn.classList.remove(
        "bg-pink-500",
        "text-white",
        "bg-pink-400",
        "text-black",
      );
      btn.classList.add(
        "bg-gray-200",
        "dark:bg-gray-700",
        "text-gray-700",
        "dark:text-gray-300",
      );
    });
  }

  /**
   * Handles search query from URL parameters
   * Automatically performs search if query is present in URL
   */
  handleURLSearch() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get("search");

    if (searchQuery) {
      this.populateSearchInputs(searchQuery);
      // Delay search to ensure components are fully initialized
      setTimeout(() => {
        searchAndSortComponent.performSearch(searchQuery);
      }, 500);
    }
  }

  /**
   * Populates search inputs with the given query
   * Updates both header and mobile search inputs
   * @param {string} searchQuery - The search query to populate
   */
  populateSearchInputs(searchQuery) {
    const headerSearch = this.elementManager.get("headerSearch");
    const mobileSearch = this.elementManager.get("mobileSearch");

    if (headerSearch) headerSearch.value = searchQuery;
    if (mobileSearch) mobileSearch.value = searchQuery;
  }

  /**
   * Public method for creating listing cards (maintains API compatibility)
   * Allows external components to create cards using the same builder
   * @param {Object} listing - Listing object to create card for
   * @returns {HTMLElement} Complete listing card element
   */
  createListingCard(listing) {
    return this.cardBuilder.build(listing);
  }
}

/**
 * FACTORY FUNCTION FOR EXTERNAL USE
 * Creates listing cards for use by other components (maintains API compatibility)
 * @param {Object} listing - Listing object to create card for
 * @returns {HTMLElement} Complete listing card element
 */
export function createListingCard(listing) {
  const cardBuilder = new ListingCardBuilder();
  return cardBuilder.build(listing);
}

// Export the main controller class
export { ListingsPageController };

// Singleton instance to prevent multiple initializations
let controllerInstance = null;

// Initialize the controller when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  if (controllerInstance) {
    console.warn("Controller already exists, skipping initialization");
    return;
  }

  controllerInstance = new ListingsPageController();
  controllerInstance.init();
});

/**
 * LISTING NORMALIZATION UTILITY
 * Ensures all listing objects have consistent bid count data structure
 * @param {Object} listing - Raw listing object from API
 * @returns {Object} Normalized listing object with consistent structure
 */
function normalizeListing(listing) {
  if (!listing._count) listing._count = {};
  if (typeof listing._count.bids === "number" && listing._count.bids >= 0) {
    // Already normalized - no changes needed
  } else if (Array.isArray(listing.bids)) {
    // Calculate bid count from array length
    listing._count.bids = listing.bids.length;
  } else if (
    listing.bids &&
    typeof listing.bids === "object" &&
    typeof listing.bids.count === "number"
  ) {
    // Extract count from bids object
    listing._count.bids = listing.bids.count;
  } else {
    // Default to 0 bids if no valid data
    listing._count.bids = 0;
  }
  return listing;
}
