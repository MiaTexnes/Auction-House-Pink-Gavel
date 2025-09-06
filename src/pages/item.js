/**
 * ITEM PAGE CONTROLLER
 * ===================
 *
 * This file manages the individual auction item detail page functionality.
 * It handles displaying auction details, bidding interface, seller information,
 * countdown timers, and owner actions (edit/delete).
 *
 * Key Features:
 * - Real-time auction countdown and status updates
 * - Interactive bidding system with validation
 * - Image gallery with thumbnail navigation
 * - Owner-only edit and delete functionality
 * - Responsive bidding history with winner highlighting
 * - Dynamic user action handling based on authentication status
 */

import {
  isAuthenticated,
  getCurrentUser,
  getAuthHeader,
} from "../library/auth.js";
import { updateUserCredits } from "../components/header.js";
import {
  placeBid,
  canUserBid,
  getMinimumBid,
} from "../services/biddingService.js";
import { TimeUtils } from "../utils/timeUtils.js";
import { searchAndSortComponent } from "../components/searchAndSort.js";
import { config } from "../services/config.js";
import { API_BASE_URL } from "../services/baseApi.js";

/**
 * APPLICATION CONSTANTS
 * Configuration values used throughout the item page
 */
const DEFAULT_AVATAR = "https://placehold.co/48x48?text=S"; // Fallback seller avatar
const DEFAULT_BIDDER_AVATAR = "https://placehold.co/40x40?text=B"; // Fallback bidder avatar
const DEFAULT_IMAGE = "https://placehold.co/600x400?text=No+Image"; // Fallback item image
const MAX_TAGS = 10; // Maximum allowed tags per listing
const COUNTDOWN_INTERVAL = 1000; // Timer update frequency (1 second)

/**
 * DOM ELEMENTS MANAGER
 * ==================
 *
 * Centralized manager for all DOM element references used in the item page.
 * Groups related elements logically and provides easy access throughout the application.
 * This pattern prevents repeated DOM queries and organizes element access.
 */
class DOMElements {
  constructor() {
    // Page state elements - control overall page display
    this.loading = document.getElementById("loading-spinner");
    this.error = {
      container: document.getElementById("error-container"),
      text: document.getElementById("error-text"),
    };
    this.content = document.getElementById("item-content");

    // Item display elements - show auction item details
    this.item = {
      mainImage: document.getElementById("main-image"), // Primary item image
      gallery: document.getElementById("image-gallery"), // Thumbnail gallery
      status: document.getElementById("auction-status"), // Active/Ended status badge
      title: document.getElementById("item-title"), // Item title
      description: document.getElementById("item-description"), // Item description
      tags: document.getElementById("item-tags"), // Tag display area
      seller: {
        avatar: document.getElementById("seller-avatar"), // Seller profile image
        name: document.getElementById("seller-name"), // Seller name/link
      },
      bid: {
        current: document.getElementById("current-bid"), // Current highest bid display
        count: document.getElementById("bid-count"), // Total number of bids
      },
      time: {
        remaining: document.getElementById("time-remaining"), // Countdown timer
        endDate: document.getElementById("end-date"), // Auction end date/time
      },
    };

    // Bidding interface elements - handle bid placement
    this.bidding = {
      section: document.getElementById("bidding-section"), // Entire bidding area
      form: document.getElementById("bid-form"), // Bid submission form
      input: document.getElementById("bid-amount"), // Bid amount input field
      minText: document.getElementById("min-bid-text"), // Minimum bid display
      history: document.getElementById("bidding-history"), // Bid history container
      noBids: document.getElementById("no-bids"), // No bids message
    };

    // User action elements - show appropriate actions based on user type
    this.actions = {
      owner: document.getElementById("owner-actions"), // Edit/delete buttons for owners
      authRequired: document.getElementById("auth-required"), // Login prompt for guests
    };

    // Modal dialog elements - handle edit and delete confirmations
    this.modals = {
      delete: {
        modal: document.getElementById("delete-modal"), // Delete confirmation modal
        cancel: document.getElementById("cancel-delete-btn"), // Cancel deletion button
        confirm: document.getElementById("confirm-delete-btn"), // Confirm deletion button
      },
      edit: {
        modal: document.getElementById("edit-modal"), // Edit listing modal
        form: document.getElementById("edit-listing-form"), // Edit form
        cancel: document.getElementById("cancel-edit-btn"), // Cancel edit button
        title: document.getElementById("edit-title"), // Title input field
        description: document.getElementById("edit-description"), // Description textarea
        media: document.getElementById("edit-media"), // Media URLs textarea
        tags: document.getElementById("edit-tags"), // Tags input field
      },
    };
  }
}

/**
 * UTILITY FUNCTIONS
 * ================
 *
 * Helper functions for common operations used throughout the item page.
 * Includes URL parameter parsing and tag processing utilities.
 */
const Utils = {
  /**
   * Extracts the listing ID from the current page URL
   * Used to determine which auction item to display
   * @returns {string|null} The listing ID or null if not found
   */
  getListingId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("id");
  },

  /**
   * Processes a comma-separated string of tags into a clean array
   * Handles validation, trimming, and limits the number of tags
   * @param {string} tagsString - Raw comma-separated tag string
   * @returns {string[]} Array of cleaned, validated tags
   */
  processTags(tagsString) {
    if (!tagsString || typeof tagsString !== "string") {
      return [];
    }

    return tagsString
      .split(",") // Split on commas
      .map((tag) => tag.trim()) // Remove whitespace
      .filter((tag) => tag.length > 0) // Remove empty tags
      .slice(0, MAX_TAGS); // Limit to maximum allowed
  },
};

/**
 * STATE MANAGER
 * =============
 *
 * Manages the application state for the item page.
 * Handles the current listing data and countdown timer state.
 * Provides a centralized way to access and update page state.
 */
class StateManager {
  constructor() {
    this.currentListing = null; // Currently displayed auction listing
    this.countdownInterval = null; // Timer interval for countdown updates
  }

  /**
   * Sets the current listing data
   * @param {Object} listing - The auction listing object
   */
  setListing(listing) {
    this.currentListing = listing;
  }

  /**
   * Gets the current listing data
   * @returns {Object|null} The current listing or null if none set
   */
  getListing() {
    return this.currentListing;
  }

  /**
   * Starts the countdown timer with a given update callback
   * Clears any existing timer before starting a new one
   * @param {Function} updateCallback - Function to call on each timer tick
   */
  startCountdown(updateCallback) {
    this.stopCountdown();
    this.countdownInterval = setInterval(updateCallback, COUNTDOWN_INTERVAL);
  }

  /**
   * Stops the countdown timer
   * Cleans up the interval to prevent memory leaks
   */
  stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
}

/**
 * UI MANAGER
 * ==========
 *
 * Handles all user interface rendering and updates for the item page.
 * Manages page states (loading, error, content), renders auction data,
 * and handles dynamic UI updates based on user interactions and auction status.
 */
class UIManager {
  constructor(elements) {
    this.elements = elements; // Reference to DOM elements manager
  }

  /**
   * Shows the loading spinner and hides other content
   * Used when fetching auction data from the API
   */
  showLoading() {
    this.elements.loading?.classList.remove("hidden");
    this.elements.error.container?.classList.add("hidden");
    this.elements.content?.classList.add("hidden");
  }

  /**
   * Displays an error message and hides other content
   * Used when API calls fail or other errors occur
   * @param {string} message - Error message to display to user
   */
  showError(message) {
    this.elements.loading?.classList.add("hidden");
    this.elements.error.container?.classList.remove("hidden");
    this.elements.content?.classList.add("hidden");
    if (this.elements.error.text) {
      this.elements.error.text.textContent = message;
    }
  }

  /**
   * Shows the main content and hides loading/error states
   * Used when auction data has been successfully loaded and rendered
   */
  showContent() {
    this.elements.loading?.classList.add("hidden");
    this.elements.error.container?.classList.add("hidden");
    this.elements.content?.classList.remove("hidden");
  }

  /**
   * Updates the auction status badge and countdown timer
   * Determines if auction is active or ended and styles accordingly
   * @param {Object} listing - The auction listing object
   * @returns {boolean} True if auction has ended, false if still active
   */
  updateAuctionStatus(listing) {
    const timeInfo = TimeUtils.formatTimeRemainingForItem(listing.endsAt);

    // Update countdown display
    if (this.elements.item.time.remaining) {
      this.elements.item.time.remaining.textContent = timeInfo.text;
    }

    // Update status badge styling based on auction state
    const statusEl = this.elements.item.status;
    if (statusEl) {
      if (timeInfo.isEnded) {
        statusEl.textContent = "Ended";
        statusEl.className =
          "absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold bg-red-500 text-white";
      } else {
        statusEl.textContent = "Active";
        statusEl.className =
          "absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold bg-green-500 text-white";
      }
    }

    return timeInfo.isEnded;
  }

  /**
   * Renders the basic auction information (title, description, tags, end date)
   * Populates the main content areas with listing data
   * @param {Object} listing - The auction listing object
   */
  renderBasicInfo(listing) {
    // Set item title
    if (this.elements.item.title) {
      this.elements.item.title.textContent = listing.title;
    }

    // Set item description with fallback
    if (this.elements.item.description) {
      this.elements.item.description.textContent =
        listing.description || "No description provided.";
    }

    // Render tags and end date
    this.renderTags(listing.tags || []);
    this.renderEndDate(listing.endsAt);
  }

  /**
   * Renders the auction item tags as styled badges
   * Creates individual tag elements with consistent styling
   * @param {string[]} tags - Array of tag strings
   */
  renderTags(tags) {
    const tagsEl = this.elements.item.tags;
    if (!tagsEl) return;

    tagsEl.innerHTML = "";

    // Show message if no tags
    if (tags.length === 0) {
      tagsEl.innerHTML =
        '<span class="text-gray-500 dark:text-gray-400 text-sm italic">No tags</span>';
      return;
    }

    // Create styled tag elements
    tags.forEach((tag) => {
      const tagElement = document.createElement("span");
      tagElement.className =
        "inline-block bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 px-4 py-2 rounded-full text-lg mr-3 mb-2 shadow-md";
      tagElement.textContent = `#${tag}`;
      tagsEl.appendChild(tagElement);
    });
  }

  /**
   * Renders the auction end date and time
   * Formats the end date for display in user's locale
   * @param {string} endsAt - ISO date string of auction end time
   */
  renderEndDate(endsAt) {
    if (!this.elements.item.time.endDate) return;

    const endDateTime = new Date(endsAt);
    this.elements.item.time.endDate.textContent = `Ends: ${endDateTime.toLocaleDateString()} ${endDateTime.toLocaleTimeString()}`;
  }

  /**
   * Renders the main item image and image gallery
   * Sets up the primary image and creates thumbnail gallery if multiple images
   * @param {Object[]} media - Array of media objects with URLs
   * @param {string} title - Item title for alt text
   */
  renderImages(media, title) {
    const mainImg = this.elements.item.mainImage;
    if (mainImg) {
      if (media && media.length > 0 && media[0].url) {
        mainImg.src = media[0].url;
        mainImg.alt = title;

        // Create thumbnail gallery if multiple images
        if (media.length > 1) {
          this.renderImageGallery(media);
        }
      } else {
        // Use fallback image
        mainImg.src = DEFAULT_IMAGE;
        mainImg.alt = "No image available";
      }
    }
  }

  /**
   * Creates an interactive image gallery with clickable thumbnails
   * Allows users to switch between different item images
   * @param {Object[]} media - Array of media objects with URLs
   */
  renderImageGallery(media) {
    const gallery = this.elements.item.gallery;
    if (!gallery) return;

    gallery.innerHTML = "";

    media.forEach((item, index) => {
      const thumbnail = document.createElement("img");
      thumbnail.src = item.url;
      thumbnail.alt = item.alt || `Image ${index + 1}`;
      thumbnail.loading = "lazy";
      thumbnail.className =
        "w-full h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity";

      // Highlight first thumbnail as selected
      if (index === 0) {
        thumbnail.classList.add("border-2", "border-pink-500");
      }

      // Add click handler to switch main image
      thumbnail.addEventListener("click", () => {
        if (this.elements.item.mainImage) {
          this.elements.item.mainImage.src = item.url;
        }

        // Update thumbnail selection styling
        gallery.querySelectorAll("img").forEach((img) => {
          img.classList.remove("border-2", "border-pink-500");
        });
        thumbnail.classList.add("border-2", "border-pink-500");
      });

      gallery.appendChild(thumbnail);
    });

    gallery.classList.remove("hidden");
  }

  /**
   * Renders seller information including avatar and name
   * Creates clickable profile link for authenticated users
   * @param {Object} seller - Seller object with name and avatar
   */
  renderSellerInfo(seller) {
    // Set seller avatar with fallback
    if (this.elements.item.seller.avatar) {
      const avatarUrl = seller?.avatar?.url || DEFAULT_AVATAR;
      this.elements.item.seller.avatar.src = avatarUrl;
      this.elements.item.seller.avatar.alt = `${seller?.name || "Unknown"} avatar`;
    }

    // Set seller name with optional profile link
    if (this.elements.item.seller.name) {
      const sellerName = seller?.name || "Unknown Seller";

      if (isAuthenticated()) {
        // Create clickable profile link for authenticated users
        const profileUrl = `/sellerProfile.html?name=${encodeURIComponent(sellerName)}`;
        this.elements.item.seller.name.innerHTML = `<a href="${profileUrl}" class="text-pink-500 hover:underline">${sellerName}</a>`;
      } else {
        // Plain text for non-authenticated users
        this.elements.item.seller.name.textContent = sellerName;
      }
    }
  }

  /**
   * Renders current bid information and sets up bidding interface
   * Displays highest bid, bid count, and minimum bid requirements
   * @param {Object[]} bids - Array of bid objects
   */
  renderBidInfo(bids) {
    // Calculate and display highest bid
    const highestBid =
      bids.length > 0 ? Math.max(...bids.map((bid) => bid.amount)) : 0;

    if (this.elements.item.bid.current) {
      this.elements.item.bid.current.textContent =
        highestBid > 0 ? `${highestBid} credits` : "No bids yet";
    }

    // Display bid count with proper pluralization
    if (this.elements.item.bid.count) {
      this.elements.item.bid.count.textContent = `${bids.length} bid${
        bids.length !== 1 ? "s" : ""
      }`;
    }

    // Set minimum bid requirements for bidding form
    const minBid = getMinimumBid(bids);
    if (this.elements.bidding.input) {
      this.elements.bidding.input.min = minBid;
      this.elements.bidding.input.placeholder = `Minimum bid: ${minBid}`;
    }

    if (this.elements.bidding.minText) {
      this.elements.bidding.minText.textContent = `Minimum bid: ${minBid} credits`;
    }
  }

  /**
   * Shows appropriate user actions based on authentication and ownership
   * Displays different interfaces for owners, authenticated users, and guests
   * @param {Object} listing - The auction listing object
   * @param {boolean} isEnded - Whether the auction has ended
   */
  handleUserActions(listing, isEnded) {
    const authenticated = isAuthenticated();
    const currentUser = getCurrentUser();
    const isOwner =
      authenticated && currentUser && currentUser.name === listing.seller?.name;

    if (isOwner) {
      // Show owner controls (edit/delete)
      this.elements.bidding.section?.classList.add("hidden");
      this.elements.actions.authRequired?.classList.add("hidden");
      this.elements.actions.owner?.classList.remove("hidden");
    } else if (isEnded) {
      // Hide all actions for ended auctions
      this.elements.bidding.section?.classList.add("hidden");
      this.elements.actions.owner?.classList.add("hidden");
      this.elements.actions.authRequired?.classList.add("hidden");
    } else if (authenticated) {
      // Show bidding interface for authenticated non-owners
      this.elements.actions.authRequired?.classList.add("hidden");
      this.elements.actions.owner?.classList.add("hidden");
      this.elements.bidding.section?.classList.remove("hidden");
    } else {
      // Show login prompt for non-authenticated users
      this.elements.bidding.section?.classList.add("hidden");
      this.elements.actions.owner?.classList.add("hidden");
      this.elements.actions.authRequired?.classList.remove("hidden");
    }
  }

  /**
   * Renders the complete bidding history with special winner highlighting
   * Creates different displays for winners vs regular bids, sorted by amount
   * @param {Object[]} bids - Array of bid objects with bidder info
   */
  renderBiddingHistory(bids) {
    if (!this.elements.bidding.history) return;
    this.elements.bidding.history.innerHTML = "";

    // Show no bids message if empty
    if (bids.length === 0) {
      this.elements.bidding.noBids?.classList.remove("hidden");
      return;
    }
    this.elements.bidding.noBids?.classList.add("hidden");

    // Sort bids by amount (highest first)
    const sortedBids = [...bids].sort((a, b) => b.amount - a.amount);

    // Check if auction has ended to show winner
    const listing = window.itemPageController?.state?.getListing?.();
    const isEnded = listing
      ? TimeUtils.formatTimeRemainingForItem(listing.endsAt).isEnded
      : false;

    sortedBids.forEach((bid, index) => {
      const isHighestBid = index === 0;
      const avatarUrl = bid.bidder?.avatar?.url || DEFAULT_BIDDER_AVATAR;
      const bidderName = bid.bidder?.name || "Unknown Bidder";

      /**
       * Creates HTML for bidder name with optional profile link
       * @param {string} name - Bidder's name
       * @returns {string} HTML string for bidder name
       */
      const createBidderNameHTML = (name) => {
        if (isAuthenticated() && name && name !== "Unknown Bidder") {
          const profileUrl = `/sellerProfile.html?name=${encodeURIComponent(name)}`;
          return `<a href="${profileUrl}" class="text-pink-500 hover:underline">${name}</a>`;
        }
        return name;
      };

      let statusText = "";
      let bidElement;

      if (isHighestBid && isEnded) {
        // Special winner display - larger, centered, green styling
        bidElement = document.createElement("div");
        bidElement.className =
          "flex flex-col items-center justify-center p-6 bg-green-50 dark:bg-green-900 rounded-lg mb-4";
        statusText =
          '<span class="block text-2xl text-green-700 font-bold text-center mb-2">Winner</span>';
        bidElement.innerHTML = `
          ${statusText}
          <img src="${avatarUrl}"
               alt="${bidderName}"
               class="w-16 h-16 rounded-full object-cover border-4 border-green-600 mx-auto mb-2">
          <p class="font-semibold text-green-800 text-xl text-center mb-1">${createBidderNameHTML(bidderName)}</p>
          <p class="text-lg font-bold text-green-700 text-center mb-2">${bid.amount} credits</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 text-center">${new Date(bid.created).toLocaleString()}</p>
        `;
      } else {
        // Regular bid display - horizontal layout
        bidElement = document.createElement("div");
        bidElement.className =
          "flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg";
        if (isHighestBid) {
          statusText =
            '<span class="text-xs text-pink-500 font-semibold">Highest Bid</span>';
        }
        bidElement.innerHTML = `
          <div class="flex items-center space-x-3">
            <img src="${avatarUrl}"
                 alt="${bidderName}"
                 class="w-10 h-10 rounded-full object-cover border-2 ${isHighestBid ? "border-pink-500" : "border-gray-300 dark:border-gray-600"}">
            <div>
              <p class="font-semibold ${isHighestBid ? "text-pink-600" : ""}">${createBidderNameHTML(bidderName)}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">${new Date(bid.created).toLocaleString()}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-bold text-lg ${isHighestBid ? "text-pink-600" : ""}">${bid.amount} credits</p>
            ${statusText}
          </div>
        `;
      }
      this.elements.bidding.history.appendChild(bidElement);
    });
  }

  /**
   * Populates the edit form modal with current listing data
   * Pre-fills form fields when owner wants to edit their listing
   * @param {Object} listing - The auction listing object to edit
   */
  populateEditForm(listing) {
    // Fill title field
    if (this.elements.modals.edit.title) {
      this.elements.modals.edit.title.value = listing.title || "";
    }

    // Fill description field
    if (this.elements.modals.edit.description) {
      this.elements.modals.edit.description.value = listing.description || "";
    }

    // Fill media URLs (one per line)
    if (this.elements.modals.edit.media) {
      const mediaUrls = listing.media?.map((item) => item.url).join("\n") || "";
      this.elements.modals.edit.media.value = mediaUrls;
    }

    // Fill tags (comma-separated)
    if (this.elements.modals.edit.tags) {
      const tagsString = listing.tags ? listing.tags.join(", ") : "";
      this.elements.modals.edit.tags.value = tagsString;
    }
  }
}

/**
 * API SERVICE
 * ===========
 *
 * Handles all API communication for the item page.
 * Provides methods for fetching, updating, and deleting auction listings,
 * as well as placing bids. Manages authentication headers and error handling.
 */
class APIService {
  /**
   * Fetches a single auction listing by ID
   * Includes seller and bid information in the response
   * @param {string} id - The listing ID to fetch
   * @returns {Promise<Object>} The complete listing object
   * @throws {Error} If listing not found or API call fails
   */
  static async fetchListing(id) {
    const headers = {
      "Content-Type": "application/json",
      "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
    };

    // Add authentication header if user is logged in
    if (isAuthenticated()) {
      const authHeader = getAuthHeader();
      headers.Authorization = authHeader.Authorization;
    }

    const response = await fetch(
      `${API_BASE_URL}/auction/listings/${id}?_seller=true&_bids=true`,
      { headers },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.errors?.[0]?.message || "Failed to fetch listing",
      );
    }

    const responseData = await response.json();
    const listing = responseData.data;

    if (!listing) {
      throw new Error("Listing not found");
    }

    return listing;
  }

  /**
   * Deletes an auction listing (owner only)
   * Requires user authentication and ownership verification
   * @param {string} id - The listing ID to delete
   * @throws {Error} If not authenticated or deletion fails
   */
  static async deleteListing(id) {
    if (!isAuthenticated()) {
      throw new Error("You must be logged in to delete a listing");
    }

    const authHeader = getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/auction/listings/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
        Authorization: authHeader.Authorization,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.errors?.[0]?.message || "Failed to delete listing",
      );
    }
  }

  /**
   * Updates an existing auction listing (owner only)
   * Allows modification of title, description, media, and tags
   * @param {string} id - The listing ID to update
   * @param {Object} updatedData - The new listing data
   * @throws {Error} If not authenticated or update fails
   */
  static async updateListing(id, updatedData) {
    if (!isAuthenticated()) {
      throw new Error("You must be logged in to edit a listing");
    }

    const authHeader = getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/auction/listings/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
        Authorization: authHeader.Authorization,
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.errors?.[0]?.message || "Failed to update listing",
      );
    }
  }

  /**
   * Places a bid on an auction listing
   * Validates bid amount and user eligibility before submission
   * @param {number} amount - The bid amount in credits
   * @param {Object} listing - The auction listing object
   * @returns {Promise<Object>} Result object with success status and message
   */
  static async placeBidOnListing(amount, listing) {
    try {
      const result = await placeBid(listing.id, amount);

      if (result.success) {
        return {
          success: true,
          message: result.message || "Bid placed successfully!",
        };
      } else {
        return { success: false, error: result.error || "Failed to place bid" };
      }
    } catch (error) {
      return {
        success: false,
        error: "An unexpected error occurred while placing the bid",
      };
    }
  }
}

/**
 * MAIN APPLICATION CONTROLLER
 * ===========================
 *
 * The primary controller class that orchestrates all item page functionality.
 * Manages initialization, event handling, and coordinates between all other classes.
 * Handles the complete lifecycle of the item page from load to cleanup.
 */
class ItemPageController {
  constructor() {
    this.elements = new DOMElements(); // DOM element manager
    this.ui = new UIManager(this.elements); // UI rendering manager
    this.state = new StateManager(); // Application state manager
  }

  /**
   * Initializes the item page application
   * Sets up search functionality, loads auction data, and configures event listeners
   */
  async init() {
    // Initialize search and sort component
    searchAndSortComponent.init();

    // Get listing ID from URL parameters
    const listingId = Utils.getListingId();
    if (!listingId) {
      this.ui.showError("No listing ID provided");
      return;
    }

    // Load and display the auction listing
    await this.loadListing(listingId);

    // Set up all event listeners
    this.setupEventListeners();
  }

  /**
   * Loads auction listing data from API and renders it
   * Handles loading states and error conditions
   * @param {string} id - The listing ID to load
   */
  async loadListing(id) {
    this.ui.showLoading();

    try {
      const listing = await APIService.fetchListing(id);
      this.state.setListing(listing);
      this.renderListing(listing);
      this.ui.showContent();
    } catch (error) {
      this.ui.showError(error.message);
    }
  }

  /**
   * Renders the complete auction listing display
   * Coordinates all UI components to show auction data
   * @param {Object} listing - The auction listing object
   */
  renderListing(listing) {
    // Render basic auction information
    this.ui.renderBasicInfo(listing);
    this.ui.renderImages(listing.media, listing.title);
    this.ui.renderSellerInfo(listing.seller);

    // Render bidding information
    const bids = listing.bids || [];
    this.ui.renderBidInfo(bids);
    this.ui.renderBiddingHistory(bids);

    // Start countdown timer
    this.startCountdown();

    // Update status and show appropriate user actions
    const isEnded = this.ui.updateAuctionStatus(listing);
    this.ui.handleUserActions(listing, isEnded);
  }

  /**
   * Starts the auction countdown timer
   * Updates display every second and handles auction end state
   */
  startCountdown() {
    const listing = this.state.getListing();
    if (!listing) return;

    const updateCountdown = () => {
      const isEnded = this.ui.updateAuctionStatus(listing);
      if (isEnded) {
        // Stop timer and update UI when auction ends
        this.state.stopCountdown();
        this.ui.handleUserActions(listing, true);
      }
    };

    // Run immediately and then on interval
    updateCountdown();
    this.state.startCountdown(updateCountdown);
  }

  /**
   * Sets up all event listeners for user interactions
   * Coordinates bidding, owner actions, modals, and search functionality
   */
  setupEventListeners() {
    this.setupBiddingEvents(); // Bid submission handling
    this.setupOwnerActions(); // Edit/delete functionality
    this.setupModalEvents(); // Modal dialog interactions
    this.setupSearchEvents(); // Search integration
    this.setupCleanupEvents(); // Page cleanup on exit
  }

  /**
   * Sets up bidding form event listeners
   * Handles bid submission and validation
   */
  setupBiddingEvents() {
    if (this.elements.bidding.form) {
      this.elements.bidding.form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleBidSubmission();
      });
    }
  }

  /**
   * Handles bid submission with validation and API communication
   * Validates bid amount, checks user eligibility, and submits bid
   */
  async handleBidSubmission() {
    const amount = parseInt(this.elements.bidding.input.value);
    const listing = this.state.getListing();

    // Validate bid amount
    if (!amount || amount < this.elements.bidding.input.min) {
      alert(`Minimum bid is ${this.elements.bidding.input.min} credits`);
      return;
    }

    // Check if user can bid (has sufficient credits, etc.)
    const bidCheck = await canUserBid(listing);
    if (!bidCheck.canBid) {
      alert(bidCheck.reason);
      return;
    }

    // Submit bid and handle response
    const result = await APIService.placeBidOnListing(amount, listing);

    if (result.success) {
      // Refresh listing data to show new bid
      await this.loadListing(listing.id);
      alert(result.message);
    } else {
      alert(result.error);
    }
  }

  /**
   * Sets up owner action event listeners (edit/delete buttons)
   * Only available to listing owners
   */
  setupOwnerActions() {
    const editBtn = document.getElementById("edit-listing-btn");
    const deleteBtn = document.getElementById("delete-listing-btn");

    if (editBtn) {
      editBtn.addEventListener("click", () => {
        const listing = this.state.getListing();
        this.ui.populateEditForm(listing);
        this.elements.modals.edit.modal?.classList.remove("hidden");
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        this.elements.modals.delete.modal?.classList.remove("hidden");
      });
    }
  }

  /**
   * Sets up modal dialog event listeners
   * Handles edit form submission, delete confirmation, and modal closing
   */
  setupModalEvents() {
    // Edit modal form submission
    if (this.elements.modals.edit.form) {
      this.elements.modals.edit.form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleEditSubmission();
      });
    }

    // Edit modal cancel button
    if (this.elements.modals.edit.cancel) {
      this.elements.modals.edit.cancel.addEventListener("click", () => {
        this.elements.modals.edit.modal?.classList.add("hidden");
      });
    }

    // Delete modal cancel button
    if (this.elements.modals.delete.cancel) {
      this.elements.modals.delete.cancel.addEventListener("click", () => {
        this.elements.modals.delete.modal?.classList.add("hidden");
      });
    }

    // Delete modal confirm button
    if (this.elements.modals.delete.confirm) {
      this.elements.modals.delete.confirm.addEventListener(
        "click",
        async () => {
          this.elements.modals.delete.modal?.classList.add("hidden");
          await this.handleDelete();
        },
      );
    }

    // Close modals when clicking outside (backdrop click)
    [
      this.elements.modals.edit.modal,
      this.elements.modals.delete.modal,
    ].forEach((modal) => {
      if (modal) {
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            modal.classList.add("hidden");
          }
        });
      }
    });
  }

  /**
   * Handles edit form submission with validation and API update
   * Validates form data, processes tags and media, and updates listing
   */
  async handleEditSubmission() {
    // Get form values
    const title = this.elements.modals.edit.title.value.trim();
    const description = this.elements.modals.edit.description.value.trim();
    const mediaText = this.elements.modals.edit.media.value.trim();
    const tagsText = this.elements.modals.edit.tags?.value.trim() || "";

    // Validate required fields
    if (!title) {
      alert("Title is required");
      return;
    }

    if (!description) {
      alert("Description is required");
      return;
    }

    // Process media URLs (one per line)
    const mediaUrls = mediaText
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0)
      .map((url) => ({ url, alt: title }));

    // Process tags (comma-separated)
    const processedTags = Utils.processTags(tagsText);

    const updatedData = {
      title,
      description,
      media: mediaUrls,
      tags: processedTags,
    };

    try {
      const listing = this.state.getListing();
      await APIService.updateListing(listing.id, updatedData);

      // Refresh listing display and close modal
      await this.loadListing(listing.id);
      alert("Listing updated successfully!");
      this.elements.modals.edit.modal?.classList.add("hidden");
    } catch (error) {
      alert(error.message);
    }
  }

  /**
   * Handles listing deletion with API call and redirect
   * Deletes the listing and redirects to listings page
   */
  async handleDelete() {
    try {
      const listing = this.state.getListing();
      await APIService.deleteListing(listing.id);
      alert("Listing deleted successfully!");
      window.location.href = "/listings.html";
    } catch (error) {
      alert(error.message);
    }
  }

  /**
   * Sets up search event listeners for search integration
   * Redirects to listings page with search results
   */
  setupSearchEvents() {
    window.addEventListener("searchPerformed", (event) => {
      const { query, results, error } = event.detail;

      // Handle search errors
      if (error) {
        return;
      }

      // Ignore empty searches
      if (query.trim() === "") {
        return;
      }

      // Redirect to listings page with search query
      if (results.length > 0) {
        window.location.href = `/listings.html?search=${encodeURIComponent(query)}`;
      }
    });
  }

  /**
   * Sets up cleanup event listeners for page exit
   * Ensures countdown timer is stopped to prevent memory leaks
   */
  setupCleanupEvents() {
    window.addEventListener("beforeunload", () => {
      this.state.stopCountdown();
    });
  }
}

/**
 * APPLICATION INITIALIZATION
 * =========================
 *
 * Initialize the item page when the DOM is fully loaded.
 * Creates a global controller instance for debugging and external access.
 */
document.addEventListener("DOMContentLoaded", () => {
  window.itemPageController = new ItemPageController();
  window.itemPageController.init();
});
