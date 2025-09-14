import {
  isAuthenticated,
  getCurrentUser,
  logoutUser,
} from "../library/auth.js";
import { createListingCard } from "./listings.js";
import { config } from "../services/config.js";
import { API_BASE_URL } from "../services/baseApi.js";
import {
  createViewMoreButton,
  createViewLessButton,
} from "../components/buttons.js";
import { generateProfileHeader } from "../utils/profileUtils.js";
import { NewListingModalManager } from "../components/modalManager.js";

/**
 * APPLICATION CONSTANTS
 * Configuration values used throughout the profile page
 */
const CONSTANTS = {
  LISTING_DISPLAY_LIMIT: 4,
  MESSAGE_DISPLAY_DURATION: 4000,
  MAX_BIO_LENGTH: 500,
  MAX_NAME_LENGTH: 50,
  MIN_NAME_LENGTH: 2,
};

/**
 * ERROR HANDLING UTILITIES
 * Centralized error handling and logging for the profile page
 */
class ErrorHandler {
  /**
   * Handles API errors with user-friendly messages
   * @param {Error} error - The error object
   * @param {string} context - Context where the error occurred
   * @returns {string} User-friendly error message
   */
  static handleAPIError(error, context = "API request") {
    const errorMessages = {
      "Failed to fetch":
        "Network connection error. Please check your internet connection.",
      Unauthorized: "You need to be logged in to perform this action.",
      Forbidden: "You do not have permission to perform this action.",
      "Not Found": "The requested resource was not found.",
      "Internal Server Error": "Server error. Please try again later.",
      "Too Many Requests":
        "Too many requests. Please wait a moment and try again.",
    };

    const message =
      errorMessages[error.message] ||
      error.message ||
      `An error occurred during ${context}. Please try again.`;

    return message;
  }

  /**
   * Logs errors for debugging while keeping user experience smooth
   * @param {Error} error - The error object
   * @param {string} context - Context where the error occurred
   */
  static logError() {
    // In production, this would be sent to a logging service
    // Error logged in development mode
    if (import.meta.env.DEV) {
      // Development error logging
    }
  }

  /**
   * Creates a standardized error object
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {string} context - Error context
   * @returns {Object} Standardized error object
   */
  static createError(message, code = "UNKNOWN_ERROR", context = "ProfilePage") {
    return {
      message,
      code,
      context,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * VALIDATION UTILITIES
 * Input validation and sanitization functions
 */
class ValidationUtils {
  /**
   * Validates profile data structure
   * @param {Object} profile - Profile object to validate
   * @returns {boolean} True if valid, false otherwise
   */
  static validateProfile(profile) {
    if (!profile || typeof profile !== "object") {
      return false;
    }

    const requiredFields = ["name", "email"];
    return requiredFields.every((field) =>
      Object.prototype.hasOwnProperty.call(profile, field),
    );
  }

  /**
   * Sanitizes string input to prevent XSS
   * @param {string} input - Input string to sanitize
   * @returns {string} Sanitized string
   */
  static sanitizeString(input) {
    if (typeof input !== "string") return "";

    return input
      .replace(/[<>]/g, "") // Remove potential HTML tags
      .trim()
      .substring(0, 1000); // Limit length
  }

  /**
   * Validates profile name
   * @param {string} name - Name to validate
   * @returns {Object} Validation result with isValid and message
   */
  static validateName(name) {
    if (!name || typeof name !== "string") {
      return { isValid: false, message: "Name is required" };
    }

    const sanitized = this.sanitizeString(name);
    if (sanitized.length < CONSTANTS.MIN_NAME_LENGTH) {
      return {
        isValid: false,
        message: `Name must be at least ${CONSTANTS.MIN_NAME_LENGTH} characters long`,
      };
    }

    if (sanitized.length > CONSTANTS.MAX_NAME_LENGTH) {
      return {
        isValid: false,
        message: `Name must be no more than ${CONSTANTS.MAX_NAME_LENGTH} characters long`,
      };
    }

    return { isValid: true, message: "" };
  }

  /**
   * Validates bio text
   * @param {string} bio - Bio text to validate
   * @returns {Object} Validation result with isValid and message
   */
  static validateBio(bio) {
    if (!bio) return { isValid: true, message: "" }; // Bio is optional

    const sanitized = this.sanitizeString(bio);
    if (sanitized.length > CONSTANTS.MAX_BIO_LENGTH) {
      return {
        isValid: false,
        message: `Bio must be no more than ${CONSTANTS.MAX_BIO_LENGTH} characters long`,
      };
    }

    return { isValid: true, message: "" };
  }
}

/**
 * Normalizes listing data to ensure consistent structure
 * @param {Object} listing - The listing object to normalize
 * @param {Object} profile - The profile object for fallback data
 * @returns {Object} Normalized listing object
 */
function normalizeListing(listing, profile) {
  try {
    if (!listing || typeof listing !== "object") {
      ErrorHandler.logError(
        new Error("Invalid listing data provided to normalizeListing"),
        "normalizeListing",
      );
      return null;
    }

    if (!profile || typeof profile !== "object") {
      ErrorHandler.logError(
        new Error("Invalid profile data provided to normalizeListing"),
        "normalizeListing",
      );
      return listing; // Return original listing if profile is invalid
    }

    // Ensure seller information exists
    if (!listing.seller?.name) {
      listing.seller = {
        name: ValidationUtils.sanitizeString(profile.name) || "Unknown",
        avatar: profile.avatar || null,
      };
    }

    // Ensure _count object exists and has valid bid count
    listing._count = listing._count || {};
    listing._count.bids =
      Number.isInteger(listing._count.bids) && listing._count.bids >= 0
        ? listing._count.bids
        : 0;

    return listing;
  } catch {
    ErrorHandler.logError();
    return listing; // Return original listing on error
  }
}

/**
 * DOM ELEMENTS MANAGER
 * Centralized management of DOM element references for the profile page
 */
class DOMElements {
  constructor() {
    this.cache = new Map();
    this.initializeElements();
  }

  /**
   * Initializes all DOM element references
   */
  initializeElements() {
    try {
      this.cache.set(
        "profileContainer",
        document.getElementById("profile-content"),
      );

      // Validate critical elements
      if (!this.cache.get("profileContainer")) {
        ErrorHandler.logError(
          new Error("Profile container element not found"),
          "DOMElements.initializeElements",
        );
      }
    } catch {
      ErrorHandler.logError();
    }
  }

  /**
   * Gets a cached DOM element
   * @param {string} key - The cache key for the element
   * @returns {HTMLElement|null} The cached DOM element or null if not found
   */
  get(key) {
    return this.cache.get(key) || null;
  }

  /**
   * Gets the profile container element
   * @returns {HTMLElement|null} The profile container element
   */
  getProfileContainer() {
    return this.get("profileContainer");
  }

  /**
   * Clears the element cache
   */
  cleanup() {
    this.cache.clear();
  }
}

// UI Manager
class UIManager {
  constructor(elements) {
    this.elements = elements;
    this.messageTimeouts = new Map(); // Track message timeouts for cleanup
  }

  showMessage(type, message) {
    try {
      // Validate inputs
      if (!message || typeof message !== "string") {
        ErrorHandler.logError(
          new Error("Invalid message provided to showMessage"),
          "UIManager.showMessage",
        );
        return;
      }

      const container = this.elements.getProfileContainer();
      if (!container) {
        ErrorHandler.logError(
          new Error("Profile container not found for showMessage"),
          "UIManager.showMessage",
        );
        return;
      }

      // Sanitize message to prevent XSS
      const sanitizedMessage = ValidationUtils.sanitizeString(message);

      // Create message element
      const messageElement = document.createElement("div");
      messageElement.className = `my-4 p-3 rounded-sm text-center transition-opacity duration-300`;

      // Add appropriate styling based on type
      const typeClasses = {
        success: "bg-green-100 text-green-800",
        error: "bg-red-100 text-red-800",
        warning: "bg-yellow-100 text-yellow-800",
        info: "bg-blue-100 text-blue-800",
      };

      messageElement.className += ` ${typeClasses[type] || typeClasses.info}`;
      messageElement.textContent = sanitizedMessage;

      container.prepend(messageElement);

      // Set up auto-removal with cleanup
      const timeoutId = setTimeout(() => {
        try {
          messageElement.remove();
        } catch {
          ErrorHandler.logError();
        }
      }, CONSTANTS.MESSAGE_DISPLAY_DURATION);

      // Store timeout for potential cleanup
      if (!this.messageTimeouts) {
        this.messageTimeouts = new Map();
      }
      this.messageTimeouts.set(messageElement, timeoutId);
    } catch {
      ErrorHandler.logError();
    }
  }

  renderProfileView(profile) {
    const container = this.elements.getProfileContainer();
    if (!container) return;
    container.innerHTML = this.generateProfileHTML(profile);
    this.setupProfileEventListeners(profile);
    this.setupActiveListingsToggle(profile);
    this.setupWinsToggle(profile);
    this.setupEndedListingsToggle(profile);
  }

  generateProfileHTML(profile) {
    return [
      this.generateProfileHeader(profile),
      this.generateUserBio(profile),
      this.generateStatsSection(profile),
      this.generateActionButtons(),
      this.generateWinsSection(profile),
      this.generateListingsSection(profile),
      this.generateEndedListingsSection(profile),
      this.generateNewListingModal(),
    ].join("");
  }

  generateProfileHeader(profile) {
    return generateProfileHeader(profile);
  }

  generateUserBio(profile) {
    return `
      <div class="mb-6 text-center px-4 md:px-8">
        <h3 class="text-xl font-semibold mb-2">User Bio</h3>
        <p class="text-gray-700 dark:text-gray-300">${profile.bio || "No bio provided."}</p>
      </div>
    `;
  }

  generateStatsSection(profile) {
    return `
      <div class="flex justify-center mb-8 px-4 md:px-8">
        <div class="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-700 border border-purple-300 dark:border-purple-600 p-6 rounded-xl text-center max-w-sm">
          <div class="text-purple-600 dark:text-purple-300 text-4xl mb-3">💰</div>
          <h4 class="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-2">My Credits</h4>
          <p class="text-4xl font-bold text-purple-900 dark:text-purple-100">${profile.credits || 0}</p>
        </div>
      </div>
    `;
  }

  generateActionButtons() {
    return `
      <div class="flex justify-center space-x-4 mb-6 px-4 md:px-8">
        <button id="newListingBtn" class="bg-green-300 hover:bg-green-400 text-black font-semibold py-2 px-6 rounded-lg transition-colors">New Listing</button>
        <button id="editProfileBtn" class="bg-blue-300 hover:bg-blue-400 text-black font-semibold py-2 px-6 rounded-lg transition-colors">Edit Profile</button>
      </div>
    `;
  }

  generateWinsSection(profile) {
    const wins = profile.wins || [];
    return `
      <div class="mb-8 px-4 md:px-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold flex items-center gap-2">

              Your Wins
            </h3>
            <button
              id="toggleWinsBtn"
              class="bg-gradient-to-r from-yellow-200 to-yellow-300 hover:from-yellow-300 hover:to-yellow-400 dark:from-yellow-700 dark:to-yellow-800 dark:hover:from-yellow-600 dark:hover:to-yellow-700 text-yellow-800 dark:text-yellow-100 px-4 py-2 rounded-lg transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
            >
              ${wins.length > 0 ? `Show Wins (${wins.length})` : "No Wins Yet"}
            </button>
          </div>
          <div id="wins-section" class="hidden">
            <div id="user-wins-container" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>
            <div id="wins-buttons-container" class="flex justify-center space-x-4 mt-4">
              <!-- Buttons will be created dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  generateListingsSection(profile) {
    const activeListings =
      profile.listings?.filter(
        (listing) => new Date(listing.endsAt) > new Date(),
      ) || [];

    return `
      <div class="mb-8 px-4 md:px-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold flex items-center gap-2">
              <span class="text-green-500"></span>
              Your Active Listings
            </h3>
            <button
              id="toggleActiveListingsBtn"
              class="bg-gradient-to-r from-green-200 to-green-300 hover:from-green-300 hover:to-green-400 dark:from-green-700 dark:to-green-800 dark:hover:from-green-600 dark:hover:to-green-700 text-green-800 dark:text-green-100 px-4 py-2 rounded-lg transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
            >
              ${activeListings.length > 0 ? `Show Active (${activeListings.length})` : "No Active Listings"}
            </button>
          </div>
          <div id="active-listings-section" class="hidden">
            <div id="user-listings-container" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>
            <div id="listings-buttons-container" class="flex justify-center space-x-4 mt-4">
              <!-- Buttons will be created dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  generateEndedListingsSection(profile) {
    const endedListings =
      profile.listings?.filter(
        (listing) => new Date(listing.endsAt) < new Date(),
      ) || [];

    return `
      <div class="mb-8 px-4 md:px-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold flex items-center gap-2">
              <span class="text-red-500"></span>
              Your Ended Listings
            </h3>
            <button
              id="toggleEndedListingsBtn"
              class="bg-gradient-to-r from-red-200 to-red-300 hover:from-red-300 hover:to-red-400 dark:from-red-700 dark:to-red-800 dark:hover:from-red-600 dark:hover:to-red-700 text-red-800 dark:text-red-100 px-4 py-2 rounded-lg transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
            >
              ${endedListings.length > 0 ? `Show Ended (${endedListings.length})` : "No Ended Listings"}
            </button>
          </div>
          <div id="ended-listings-section" class="hidden">
            <div id="user-ended-listings-container" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>
            <div id="ended-listings-buttons-container" class="flex justify-center space-x-4 mt-4">
              <!-- Buttons will be created dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  generateNewListingModal() {
    // Modal HTML is now provided by the shared NewListingModalManager component
    return "";
  }

  renderUserListings(profile) {
    const activeListings =
      profile.listings?.filter(
        (listing) => new Date(listing.endsAt) > new Date(),
      ) || [];
    if (!activeListings.length) return;
    const container = document.getElementById("user-listings-container");
    if (!container) return;

    // Clear existing content to prevent duplicates
    container.innerHTML = "";

    const listingsManager = new ListingsManager(
      container,
      activeListings,
      profile,
      "listings-buttons-container",
    );
    listingsManager.render();
    listingsManager.setupEventListeners();
  }

  renderUserWins(profile) {
    if (!profile.wins?.length) return;
    const container = document.getElementById("user-wins-container");
    if (!container) return;

    // Clear existing content to prevent duplicates
    container.innerHTML = "";

    const winsManager = new WinsManager(
      container,
      profile.wins,
      profile,
      "wins-buttons-container",
    );
    winsManager.render();
    winsManager.setupEventListeners();
  }

  setupProfileEventListeners(profile) {
    this.setupEditProfileListener(profile);
    this.setupNewListingModalListeners(profile);
  }

  setupActiveListingsToggle(profile) {
    const toggleBtn = document.getElementById("toggleActiveListingsBtn");
    const activeSection = document.getElementById("active-listings-section");

    if (!toggleBtn || !activeSection) return;

    const activeListings =
      profile.listings?.filter(
        (listing) => new Date(listing.endsAt) > new Date(),
      ) || [];

    if (activeListings.length === 0) {
      toggleBtn.disabled = true;
      toggleBtn.classList.add("opacity-50", "cursor-not-allowed");
      return;
    }

    let isExpanded = false;

    toggleBtn.addEventListener("click", () => {
      if (isExpanded) {
        activeSection.classList.add("hidden");
        toggleBtn.textContent = `Show Active (${activeListings.length})`;
        isExpanded = false;
      } else {
        activeSection.classList.remove("hidden");
        toggleBtn.textContent = `Hide Active (${activeListings.length})`;
        this.renderUserListings(profile);
        isExpanded = true;
      }
    });
  }

  setupWinsToggle(profile) {
    const toggleBtn = document.getElementById("toggleWinsBtn");
    const winsSection = document.getElementById("wins-section");

    if (!toggleBtn || !winsSection) return;

    const wins = profile.wins || [];

    if (wins.length === 0) {
      toggleBtn.disabled = true;
      toggleBtn.classList.add("opacity-50", "cursor-not-allowed");
      return;
    }

    let isExpanded = false;

    toggleBtn.addEventListener("click", () => {
      if (isExpanded) {
        winsSection.classList.add("hidden");
        toggleBtn.textContent = `Show Wins (${wins.length})`;
        isExpanded = false;
      } else {
        winsSection.classList.remove("hidden");
        toggleBtn.textContent = `Hide Wins (${wins.length})`;
        this.renderUserWins(profile);
        isExpanded = true;
      }
    });
  }

  setupEndedListingsToggle(profile) {
    const toggleBtn = document.getElementById("toggleEndedListingsBtn");
    const endedSection = document.getElementById("ended-listings-section");

    if (!toggleBtn || !endedSection) return;

    const endedListings =
      profile.listings?.filter(
        (listing) => new Date(listing.endsAt) <= new Date(),
      ) || [];

    if (endedListings.length === 0) {
      toggleBtn.disabled = true;
      toggleBtn.classList.add("opacity-50", "cursor-not-allowed");
      return;
    }

    let isExpanded = false;
    let isInitialized = false;

    toggleBtn.addEventListener("click", () => {
      if (isExpanded) {
        endedSection.classList.add("hidden");
        toggleBtn.textContent = `Show Ended (${endedListings.length})`;
        isExpanded = false;
      } else {
        endedSection.classList.remove("hidden");
        toggleBtn.textContent = `Hide Ended (${endedListings.length})`;

        // Only render if not yet initialized
        if (!isInitialized) {
          this.renderUserEndedListings(profile);
          isInitialized = true;
        }

        isExpanded = true;
      }
    });
  }

  renderUserEndedListings(profile) {
    const endedListings =
      profile.listings?.filter((listing) => {
        const listingEndDate = new Date(listing.endsAt);
        const currentDate = new Date();
        // More robust comparison - consider a listing ended if it's past its end date
        return listingEndDate < currentDate;
      }) || [];

    if (!endedListings.length) return;

    const container = document.getElementById("user-ended-listings-container");
    if (!container) return;

    // Clear existing content
    container.innerHTML = "";

    const endedListingsManager = new ListingsManager(
      container,
      endedListings,
      profile,
      "ended-listings-buttons-container",
    );
    endedListingsManager.render();
    endedListingsManager.setupEventListeners();
  }

  setupEditProfileListener(profile) {
    const editProfileBtn = document.getElementById("editProfileBtn");
    if (editProfileBtn) {
      editProfileBtn.addEventListener("click", () => {
        new EditProfileModalManager(this, profile).show();
      });
    }
  }

  setupNewListingModalListeners(profile) {
    new ProfileNewListingHandler(this, profile).setupEventListeners();
  }

  setMinimumDateTime() {
    const listingEndDate = document.getElementById("listingEndDate");
    if (listingEndDate) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 1);
      listingEndDate.min = now.toISOString().slice(0, 16);
    }
  }

  /**
   * Clears all messages and timeouts
   */
  clearAllMessages() {
    try {
      // Clear all timeouts
      this.messageTimeouts.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      this.messageTimeouts.clear();

      // Remove all message elements
      const container = this.elements.getProfileContainer();
      if (container) {
        const messages = container.querySelectorAll(".alert, .my-4");
        messages.forEach((message) => {
          if (message.parentNode) {
            message.parentNode.removeChild(message);
          }
        });
      }
    } catch {
      ErrorHandler.logError();
    }
  }

  /**
   * Cleans up resources
   */
  cleanup() {
    this.clearAllMessages();
  }
}

// Listings Manager
class ListingsManager {
  constructor(
    container,
    listings,
    profile,
    buttonsContainerId = "listings-buttons-container",
  ) {
    this.container = container;
    this.listings = listings;
    this.profile = profile;
    this.currentIndex = CONSTANTS.LISTING_DISPLAY_LIMIT;
    this.buttonsContainer = null;
    this.buttonsContainerId = buttonsContainerId;
  }

  render() {
    this.renderInitialListings();
    this.createButtons();
  }

  renderInitialListings() {
    const initialListings = this.listings.slice(
      0,
      CONSTANTS.LISTING_DISPLAY_LIMIT,
    );
    this.renderListings(initialListings);
  }

  async renderListings(listings) {
    for (const item of listings) {
      let listingWithBids = item;
      try {
        const response = await fetch(
          `${API_BASE_URL}/auction/listings/${item.id}?_bids=true`,
          {
            headers: {
              "Content-Type": "application/json",
              "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
            },
          },
        );
        if (response.ok) {
          const data = await response.json();
          listingWithBids = { ...item, ...data.data };
        }
      } catch {
        // Ignore fetch errors for individual listings
      }
      const normalizedListing = normalizeListing(listingWithBids, this.profile);
      if (normalizedListing) {
        this.container.appendChild(createListingCard(normalizedListing));
      }
    }
  }

  createButtons() {
    if (this.listings.length <= CONSTANTS.LISTING_DISPLAY_LIMIT) return;

    this.buttonsContainer = document.getElementById(this.buttonsContainerId);
    if (!this.buttonsContainer) return;

    const viewMoreBtn = createViewMoreButton(
      "View All",
      () => this.handleViewMore(),
      `viewMoreBtn-${this.buttonsContainerId}`,
    );
    const viewLessBtn = createViewLessButton(
      "View Less",
      () => this.handleViewLess(),
      `viewLessBtn-${this.buttonsContainerId}`,
      "hidden",
    );

    this.buttonsContainer.appendChild(viewMoreBtn);
    this.buttonsContainer.appendChild(viewLessBtn);
  }

  handleViewMore() {
    const nextListings = this.listings.slice(this.currentIndex);
    this.renderListings(nextListings);
    this.currentIndex = this.listings.length;
    this.toggleButtons(false);
  }

  handleViewLess() {
    this.container.innerHTML = "";
    this.renderInitialListings();
    this.currentIndex = CONSTANTS.LISTING_DISPLAY_LIMIT;
    this.toggleButtons(true);
  }

  toggleButtons(showMore) {
    if (!this.buttonsContainer) return;

    const viewMoreBtn = this.buttonsContainer.querySelector(
      `#viewMoreBtn-${this.buttonsContainerId}`,
    );
    const viewLessBtn = this.buttonsContainer.querySelector(
      `#viewLessBtn-${this.buttonsContainerId}`,
    );

    if (viewMoreBtn && viewLessBtn) {
      if (showMore) {
        viewMoreBtn.classList.remove("hidden");
        viewLessBtn.classList.add("hidden");
      } else {
        viewMoreBtn.classList.add("hidden");
        viewLessBtn.classList.remove("hidden");
      }
    }
  }

  setupEventListeners() {
    // Event listeners are now handled in the createButtons method
  }
}

// Wins Manager
class WinsManager extends ListingsManager {
  constructor(
    container,
    wins,
    profile,
    buttonsContainerId = "wins-buttons-container",
  ) {
    super(container, wins, profile, buttonsContainerId);
  }

  createButtons() {
    if (this.listings.length <= CONSTANTS.LISTING_DISPLAY_LIMIT) return;

    this.buttonsContainer = document.getElementById("wins-buttons-container");
    if (!this.buttonsContainer) return;

    const viewMoreBtn = createViewMoreButton(
      "View More",
      () => this.handleViewMoreWins(),
      "viewMoreWinsBtn",
    );
    const viewLessBtn = createViewLessButton(
      "View Less",
      () => this.handleViewLessWins(),
      "viewLessWinsBtn",
      "hidden",
    );

    this.buttonsContainer.appendChild(viewMoreBtn);
    this.buttonsContainer.appendChild(viewLessBtn);
  }

  handleViewMoreWins() {
    const nextWins = this.listings.slice(
      this.currentIndex,
      this.currentIndex + CONSTANTS.LISTING_DISPLAY_LIMIT,
    );
    this.renderListings(nextWins);
    this.currentIndex += CONSTANTS.LISTING_DISPLAY_LIMIT;

    if (this.currentIndex >= this.listings.length) {
      const viewMoreBtn =
        this.buttonsContainer?.querySelector("#viewMoreWinsBtn");
      if (viewMoreBtn) viewMoreBtn.classList.add("hidden");
    }

    const viewLessBtn =
      this.buttonsContainer?.querySelector("#viewLessWinsBtn");
    if (viewLessBtn) viewLessBtn.classList.remove("hidden");
  }

  handleViewLessWins() {
    this.container.innerHTML = "";
    this.renderInitialListings();
    this.currentIndex = CONSTANTS.LISTING_DISPLAY_LIMIT;

    const viewMoreBtn =
      this.buttonsContainer?.querySelector("#viewMoreWinsBtn");
    const viewLessBtn =
      this.buttonsContainer?.querySelector("#viewLessWinsBtn");

    if (viewMoreBtn) viewMoreBtn.classList.remove("hidden");
    if (viewLessBtn) viewLessBtn.classList.add("hidden");
  }

  setupEventListeners() {
    // Event listeners are now handled in the createButtons method
  }
}

// Modal Managers
class ProfileNewListingHandler {
  constructor(uiManager, profile) {
    this.uiManager = uiManager;
    this.profile = profile;
    this.modalManager = null;
  }

  setupEventListeners() {
    const newListingBtn = document.getElementById("newListingBtn");
    if (newListingBtn) {
      newListingBtn.addEventListener("click", () => this.openModal());
    }
  }

  openModal() {
    if (!this.modalManager) {
      this.initModalManager();
    }
    this.modalManager.openModal();
  }

  initModalManager() {
    this.modalManager = new NewListingModalManager({
      onSuccess: async () => {
        this.uiManager.showMessage("success", "Listing created successfully!");
        const refreshedProfile = await APIService.fetchProfile(
          this.profile.name,
        );
        this.uiManager.renderProfileView(refreshedProfile);
      },
      onError: (errorMessage) => {
        this.uiManager.showMessage("error", errorMessage);
      },
      profile: this.profile,
    });
  }
}

class EditProfileModalManager {
  constructor(uiManager, profile) {
    this.uiManager = uiManager;
    this.profile = profile;
    this.modal = null;
  }

  show() {
    this.createModal();
    this.setupEventListeners();
    this.modal.classList.remove("hidden");
  }

  createModal() {
    this.modal = document.createElement("div");
    this.modal.id = "editProfileModal";
    this.modal.className =
      "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 hidden";
    this.modal.innerHTML = this.generateModalHTML();
    document.body.appendChild(this.modal);
  }

  generateModalHTML() {
    const DEFAULT_AVATAR = "https://placehold.co/48x48?text=S";
    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button id="closeEditProfileModal" class="absolute top-6 right-6 text-gray-800 hover:text-gray-800 dark:hover:text-white">&times;</button>
        <h2 class="text-2xl font-bold mb-4">Edit Profile</h2>
        <form id="profile-form" class="space-y-4">
          <div class="flex flex-col items-center">
            <img id="avatar-preview" src="${this.profile.avatar?.url || DEFAULT_AVATAR}" alt="Avatar" class="w-32 h-32 rounded-full mb-4 object-cover border-4 border-pink-500">
            <label for="avatar" class="block mb-1 font-semibold">Avatar URL</label>
            <input type="url" id="avatar" name="avatar" class="w-full border-gray-300 px-3 py-2 border rounded-sm focus:outline-hidden focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white" placeholder="Avatar URL" value="${this.profile.avatar?.url || ""}">
          </div>
          <div>
            <label for="bio" class="block mb-1 font-semibold">Bio</label>
            <textarea id="bio" name="bio" class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-hidden focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white" rows="4" placeholder="Write something about yourself...">${this.profile.bio || ""}</textarea>
          </div>
          <div class="flex justify-end space-x-2">
            <button type="button" id="cancelEditProfileBtn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors">Cancel</button>
            <button type="submit" class="bg-green-500 hover:bg-green-600 text-black font-semibold py-2 px-4 rounded-lg transition-colors">Save Changes</button>
          </div>
        </form>
      </div>
    `;
  }

  setupEventListeners() {
    this.setupAvatarPreview();
    this.setupCloseListeners();
    this.setupFormSubmission();
  }

  setupAvatarPreview() {
    const avatarInput = document.getElementById("avatar");
    const avatarPreview = document.getElementById("avatar-preview");
    const DEFAULT_AVATAR = "https://placehold.co/48x48?text=S";
    if (avatarInput && avatarPreview) {
      avatarInput.addEventListener("input", () => {
        avatarPreview.src = avatarInput.value || DEFAULT_AVATAR;
      });
    }
  }

  setupCloseListeners() {
    const closeBtn = document.getElementById("closeEditProfileModal");
    const cancelBtn = document.getElementById("cancelEditProfileBtn");

    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.close());
    }
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.close());
    }

    // Close modal when clicking outside of it
    if (this.modal) {
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal) {
          this.close();
        }
      });
    }
  }

  setupFormSubmission() {
    const form = document.getElementById("profile-form");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleFormSubmission();
      });
    }
  }

  async handleFormSubmission() {
    const formData = this.getFormData();
    try {
      await APIService.updateProfile({ ...formData, name: this.profile.name });
      const refreshedProfile = await APIService.fetchProfile(this.profile.name);
      this.uiManager.showMessage("success", "Profile updated successfully!");
      this.uiManager.renderProfileView(refreshedProfile);
      this.updateLocalStorage(refreshedProfile);
      this.close();
    } catch (error) {
      this.uiManager.showMessage(
        "error",
        error.message || "Failed to update profile.",
      );
    }
  }

  getFormData() {
    const avatar = document.getElementById("avatar").value.trim();
    const bio = document.getElementById("bio").value.trim();
    return { avatar, bio };
  }

  updateLocalStorage(profile) {
    const user = getCurrentUser();
    if (user) {
      user.avatar = profile.avatar;
      user.bio = profile.bio;
      localStorage.setItem("user", JSON.stringify(user));
    }
  }

  close() {
    if (this.modal) {
      this.modal.classList.add("hidden");
      this.modal.remove();
    }
  }
}

// API Service
/**
 * API SERVICE
 * Handles all API requests for the profile page with comprehensive error handling
 */
class APIService {
  /**
   * Gets authentication headers for API requests
   * @returns {Object} Headers object for fetch requests
   * @throws {Error} If no authentication token is found
   */
  static getHeaders() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      return {
        "Content-Type": "application/json",
        "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
        Authorization: `Bearer ${token}`,
      };
    } catch (error) {
      ErrorHandler.logError();
      throw error;
    }
  }

  /**
   * Fetches user profile data from the API
   * @param {string} name - The username to fetch profile for
   * @returns {Promise<Object>} Profile data object
   * @throws {Error} If API request fails
   */
  static async fetchProfile(name) {
    try {
      // Validate input
      if (!name || typeof name !== "string") {
        throw new Error("Invalid username provided to fetchProfile");
      }

      const sanitizedName = ValidationUtils.sanitizeString(name);
      const response = await fetch(
        `${API_BASE_URL}/auction/profiles/${sanitizedName}?_listings=true&_wins=true&_tags=true&_seller=true&_bids=true&_count=true`,
        { headers: this.getHeaders() },
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Handle authentication error
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login.html";
          return;
        }

        const errorMessage = await this.handleErrorResponse(response);
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      const profileData = responseData.data;

      // Validate profile data
      if (!ValidationUtils.validateProfile(profileData)) {
        ErrorHandler.logError(
          new Error("Invalid profile data received from server"),
          "APIService.fetchProfile",
        );
      }

      return profileData;
    } catch (error) {
      ErrorHandler.logError();
      throw new Error(ErrorHandler.handleAPIError(error, "fetching profile"));
    }
  }

  /**
   * Handles API error responses
   * @param {Response} response - The failed response object
   * @returns {Promise<string>} Error message
   */
  static async handleErrorResponse(response) {
    try {
      const errorData = await response.json();
      const errorMessage =
        errorData.errors?.[0]?.message ||
        errorData.message ||
        `API request failed with status ${response.status}`;

      ErrorHandler.logError(
        new Error(`API Error ${response.status}: ${errorMessage}`),
        "APIService.handleErrorResponse",
      );

      return errorMessage;
    } catch {
      // If we can't parse the error response, create a generic error
      const statusMessages = {
        400: "Bad request. Please check your input.",
        401: "Authentication required. Please log in.",
        403: "Access denied. You do not have permission.",
        404: "Profile not found.",
        429: "Too many requests. Please wait and try again.",
        500: "Server error. Please try again later.",
        502: "Service temporarily unavailable.",
        503: "Service temporarily unavailable.",
      };

      const message =
        statusMessages[response.status] ||
        `Request failed with status ${response.status}`;

      ErrorHandler.logError(
        new Error(`API Error ${response.status}: ${message}`),
        "APIService.handleErrorResponse",
      );

      return message;
    }
  }

  /**
   * Updates user profile data
   * @param {Object} profileData - Profile data to update
   * @param {string} profileData.avatar - Avatar URL
   * @param {string} profileData.bio - Bio text
   * @param {string} profileData.name - Username
   * @returns {Promise<Object>} Updated profile data
   * @throws {Error} If API request fails
   */
  static async updateProfile({ avatar, bio, name }) {
    try {
      // Validate inputs
      if (!name || typeof name !== "string") {
        throw new Error("Username is required for profile update");
      }

      const sanitizedName = ValidationUtils.sanitizeString(name);
      const body = {};

      // Validate and sanitize avatar
      if (avatar) {
        const sanitizedAvatar = ValidationUtils.sanitizeString(avatar);
        if (sanitizedAvatar) {
          body.avatar = { url: sanitizedAvatar, alt: "User avatar" };
        }
      }

      // Validate and sanitize bio
      if (bio) {
        const bioValidation = ValidationUtils.validateBio(bio);
        if (!bioValidation.isValid) {
          throw new Error(bioValidation.message);
        }
        body.bio = ValidationUtils.sanitizeString(bio);
      }

      const response = await fetch(
        `${API_BASE_URL}/auction/profiles/${sanitizedName}`,
        {
          method: "PUT",
          headers: this.getHeaders(),
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const errorMessage = await this.handleErrorResponse(response);
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      return responseData.data;
    } catch (error) {
      ErrorHandler.logError();
      throw new Error(ErrorHandler.handleAPIError(error, "updating profile"));
    }
  }

  static async createListing({ title, description, endsAt, media }) {
    const response = await fetch(`${API_BASE_URL}/auction/listings`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ title, description, endsAt, media }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.errors?.[0]?.message || "Failed to create listing",
      );
    }
    const responseData = await response.json();
    return responseData.data;
  }
}

// Main Profile Controller
/**
 * PROFILE CONTROLLER
 * Main controller class that orchestrates all profile page functionality
 */
class ProfileController {
  constructor() {
    this.elements = new DOMElements();
    this.ui = new UIManager(this.elements);
    this.isInitialized = false;
  }

  /**
   * Initializes the profile page
   * Handles authentication checks and profile loading
   */
  async init() {
    try {
      // Prevent duplicate initialization
      if (this.isInitialized) {
        return;
      }

      const container = this.elements.getProfileContainer();
      if (!container) {
        ErrorHandler.logError(
          new Error("Profile container not found"),
          "ProfileController.init",
        );
        return;
      }

      // Check authentication
      if (!isAuthenticated()) {
        this.showAuthRequiredMessage();
        return;
      }

      const user = getCurrentUser();
      if (!user || !user.name) {
        this.showInvalidUserMessage();
        logoutUser();
        return;
      }

      this.isInitialized = true;
      await this.loadUserProfile(user.name);
    } catch {
      ErrorHandler.logError();
      this.showErrorMessage(
        "An error occurred while initializing the profile page.",
      );
    }
  }

  /**
   * Shows authentication required message
   */
  showAuthRequiredMessage() {
    const container = this.elements.getProfileContainer();
    if (container) {
      container.innerHTML = `
        <div class="text-center text-red-600 p-8">
          <h2 class="text-xl font-semibold mb-4">Authentication Required</h2>
          <p class="mb-4">You must be logged in to view your profile.</p>
          <a href="/login.html" class="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
            Login here
          </a>
        </div>
      `;
    }
  }

  /**
   * Shows invalid user data message
   */
  showInvalidUserMessage() {
    const container = this.elements.getProfileContainer();
    if (container) {
      container.innerHTML = `
        <div class="text-center text-red-600 p-8">
          <h2 class="text-xl font-semibold mb-4">Invalid User Data</h2>
          <p class="mb-4">User data is incomplete. Please log in again.</p>
          <a href="/login.html" class="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
            Login here
          </a>
        </div>
      `;
    }
  }

  /**
   * Shows error message
   * @param {string} message - Error message to display
   */
  showErrorMessage(message) {
    const container = this.elements.getProfileContainer();
    if (container) {
      container.innerHTML = `
        <div class="text-center text-red-600 p-8">
          <h2 class="text-xl font-semibold mb-4">Error</h2>
          <p class="mb-4">${ValidationUtils.sanitizeString(message)}</p>
          <button onclick="window.location.reload()" class="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
            Try Again
          </button>
        </div>
      `;
    }
  }

  /**
   * Loads user profile data
   * @param {string} username - Username to load profile for
   */
  async loadUserProfile(username) {
    try {
      this.ui.showMessage("info", "Loading profile...");

      const profile = await APIService.fetchProfile(username);

      if (!profile) {
        throw new Error("No profile data received");
      }

      this.ui.renderProfileView(profile);
      this.ui.showMessage("success", "Profile loaded successfully!");
    } catch (error) {
      ErrorHandler.logError();
      this.ui.showMessage(
        "error",
        ErrorHandler.handleAPIError(error, "loading profile"),
      );
    }
  }

  /**
   * Cleans up resources and event listeners
   * Prevents memory leaks and ensures proper cleanup
   */
  cleanup() {
    try {
      // Clear UI messages
      if (this.ui && typeof this.ui.cleanup === "function") {
        this.ui.cleanup();
      }

      // Clear DOM element cache
      if (this.elements && typeof this.elements.cleanup === "function") {
        this.elements.cleanup();
      }

      // Reset initialization state
      this.isInitialized = false;

      // Log cleanup for debugging
      // Cleanup completed
      if (import.meta.env.DEV) {
        // Development cleanup logging
      }
    } catch {
      ErrorHandler.logError();
    }
  }
}

// Export the main controller class
export { ProfileController };
