//listings.js
import { isAuthenticated, getAuthHeader } from "../library/auth.js";
import { createListing } from "../library/newListing.js";
import { searchAndSortComponent } from "../components/searchAndSort.js";
import { config } from "../services/config.js";
import { API_BASE_URL } from "../services/baseApi.js"; // Add this import

// Constants
const CONSTANTS = {
  DEFAULT_SELLER_AVATAR: "https://placehold.co/40x40?text=S",
  DIMENSIONS: {
    CARD_HEIGHT: "420px",
    IMAGE_HEIGHT: "192px",
    CONTENT_HEIGHT: "228px",
  },
  MAX_TAGS: 10,
  DEFAULT_MEDIA_INPUTS: 2,
};

// Utility Functions
const Utils = {
  processTags(tagsString) {
    if (!tagsString || typeof tagsString !== "string") {
      return [];
    }

    return tagsString
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .slice(0, CONSTANTS.MAX_TAGS);
  },

  clearSearchResults() {
    const headerSearch = document.getElementById("header-search");
    const mobileSearch = document.getElementById("mobile-search");

    if (headerSearch) headerSearch.value = "";
    if (mobileSearch) mobileSearch.value = "";

    const url = new URL(window.location);
    url.searchParams.delete("search");
    window.history.replaceState({}, "", url);
  },

  formatTimeRemaining(endsAt) {
    const endDate = new Date(endsAt);
    const now = new Date();
    const timeLeftMs = endDate.getTime() - now.getTime();

    if (timeLeftMs < 0) {
      return {
        text: "Ended",
        class: "underline text-red-700 dark:text-red-400 font-semibold",
      };
    }

    const days = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      text: `Ends: ${days}d ${hours}h `,
      class: "text-green-800 dark:text-green-400 font-semibold",
    };
  },

  setMinimumDateTime(element) {
    if (!element) return;

    const now = new Date();
    const localDateTime = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 16);

    element.min = localDateTime;
  },
};

// DOM Elements Manager - Simplified and more focused
class DOMElementManager {
  constructor() {
    this.cache = new Map();
    this.initializeElements();
  }

  initializeElements() {
    // Core elements
    this.setElements({
      listingsContainer: "listings-container",
      messageContainer: "message-container",
      messageText: "message-text",
      loadingSpinner: "loading-spinner",
    });

    // Search elements
    this.setElements({
      headerSearch: "header-search",
      mobileSearch: "mobile-search",
    });

    // Modal elements
    this.setModalElements();
    this.setFormElements();
  }

  setElements(elements) {
    Object.entries(elements).forEach(([key, id]) => {
      this.cache.set(key, document.getElementById(id));
    });
  }

  setModalElements() {
    const modalElements = {
      addListingModal: "addListingModal",
      addListingForm: "addListingForm",
      closeAddListingModal: "closeAddListingModal",
      cancelAddListingBtn: "cancelAddListingBtn",
      addListingBtn: "addListingBtn",
      addMediaModal: "addMediaModal",
      addMediaForm: "addMediaForm",
      mediaUrlInputs: "mediaUrlInputs",
      openMediaModalBtn: "openMediaModalBtn",
      addMoreUrlBtn: "addMoreUrlBtn",
      backToListingBtn: "backToListingBtn",
      mediaCount: "mediaCount",
    };

    this.setElements(modalElements);
  }

  setFormElements() {
    const formElements = {
      listingTitle: "listingTitle",
      listingDesc: "listingDesc",
      listingEndDate: "listingEndDate",
      listingTags: "listingTags",
    };

    this.setElements(formElements);
  }

  get(elementKey) {
    return this.cache.get(elementKey);
  }

  getAll(elementKeys) {
    return elementKeys.reduce((acc, key) => {
      acc[key] = this.get(key);
      return acc;
    }, {});
  }
}

// State Manager - Enhanced with better encapsulation
class StateManager {
  constructor() {
    this.state = {
      listings: [],
      filteredListings: [],
      selectedMediaUrls: [],
      isLoading: false,
      currentSearch: null,
    };
  }

  // Listings
  setListings(listings) {
    this.state.listings = [...listings];
    return this;
  }

  getListings() {
    return [...this.state.listings];
  }

  // Filtered listings
  setFilteredListings(listings) {
    this.state.filteredListings = [...listings];
    return this;
  }

  getFilteredListings() {
    return [...this.state.filteredListings];
  }

  // Media URLs
  addMediaUrl(url) {
    if (url && !this.state.selectedMediaUrls.includes(url)) {
      this.state.selectedMediaUrls.push(url);
    }
    return this;
  }

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

  // Loading state
  setLoading(isLoading) {
    this.state.isLoading = isLoading;
    return this;
  }

  isLoading() {
    return this.state.isLoading;
  }

  // Search state
  setCurrentSearch(searchQuery) {
    this.state.currentSearch = searchQuery;
    return this;
  }

  getCurrentSearch() {
    return this.state.currentSearch;
  }
}

// Card Builder - Separated concern for building listing cards
class ListingCardBuilder {
  constructor() {
    this.cardClasses =
      "border border-gray-300 block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl hover:shadow-black transition-shadow duration-200 overflow-hidden w-full flex flex-col cursor-pointer transform hover:scale-[1.02] hover:-translate-y-1";
  }

  build(listing) {
    const timeInfo = Utils.formatTimeRemaining(listing.endsAt);
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

  createCardElement(listing) {
    const card = document.createElement("a");
    card.href = `/item.html?id=${listing.id}`;
    card.className = this.cardClasses;
    card.style.cssText = `height: 480px; min-height: 480px; max-height: 450px;`;
    return card;
  }

  extractImageUrl(media) {
    return media && media.length > 0 && media[0].url ? media[0].url : null;
  }

  extractSellerInfo(seller) {
    return {
      name: seller?.name || "Unknown",
      avatar: seller?.avatar?.url || CONSTANTS.DEFAULT_SELLER_AVATAR,
    };
  }

  generateCardHTML({
    imageUrl,
    title,
    description,
    createdDate,
    sellerInfo,
    timeInfo,
    bidCount,
  }) {
    return `
      ${this.generateImageHTML(imageUrl, title)}
      <div class="p-4 flex-1 flex flex-col min-h-0" style="height: ${CONSTANTS.DIMENSIONS.CONTENT_HEIGHT}; min-height: ${CONSTANTS.DIMENSIONS.CONTENT_HEIGHT}; max-height: ${CONSTANTS.DIMENSIONS.CONTENT_HEIGHT};">
        ${this.generateTitleHTML(title)}
        ${this.generateDescriptionHTML(description)}
        ${this.generateSellerInfoHTML(createdDate, sellerInfo)}
        ${this.generateTimeAndBidsHTML(timeInfo, bidCount)}
      </div>
    `;
  }

  generateImageHTML(imageUrl, title) {
    if (imageUrl) {
      return `<div class="w-full flex-shrink-0 bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center" style="height: ${CONSTANTS.DIMENSIONS.IMAGE_HEIGHT}; min-height: ${CONSTANTS.DIMENSIONS.IMAGE_HEIGHT}; max-height: ${CONSTANTS.DIMENSIONS.IMAGE_HEIGHT};">
        <img src="${imageUrl}" alt="${title}" class="w-full h-full object-contain listing-image transition-transform duration-300 hover:scale-105" style="max-width: 100%; max-height: 100%;">
      </div>`;
    }

    return `<div class="w-full flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-500 text-white text-center font-semibold text-lg italic flex-shrink-0 transition-all duration-300 hover:from-pink-500 hover:to-purple-600" style="height: ${CONSTANTS.DIMENSIONS.IMAGE_HEIGHT}; min-height: ${CONSTANTS.DIMENSIONS.IMAGE_HEIGHT}; max-height: ${CONSTANTS.DIMENSIONS.IMAGE_HEIGHT};">
      No image on this listing
    </div>`;
  }

  generateTitleHTML(title) {
    return `<h2 class="text-lg font-semibold mb-2 line-clamp-2 text-gray-900 dark:text-white transition-colors duration-200 hover:text-pink-600 dark:hover:text-pink-400" style="height: 48px; min-height: 48px; max-height: 48px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${title}</h2>`;
  }

  generateDescriptionHTML(description) {
    return `<p class="text-gray-700 dark:text-gray-300 text-sm mb-3 flex-1 overflow-hidden transition-colors duration-200" style="height: 64px; min-height: 64px; max-height: 64px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">${description || "No description provided."}</p>`;
  }

  generateSellerInfoHTML(createdDate, sellerInfo) {
    return `<div class="flex flex-col items-start gap-1 text-gray-500 dark:text-gray-400 mb-2 flex-shrink-0">
      <span class="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">Created: ${createdDate.toLocaleDateString()}</span>
      <div class="flex items-center gap-2 mb-3">
        <span class="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 transition-all duration-200 hover:border-pink-400 dark:hover:border-pink-500 hover:shadow-md flex-shrink-0" style="width: 32px; height: 32px; min-width: 32px; min-height: 32px;">
          <img src="${sellerInfo.avatar}" alt="${sellerInfo.name}" class="w-full h-full object-cover rounded-full" style="display: block; width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
        </span>
        <span class="text-sm text-gray-600 dark:text-gray-400">${sellerInfo.name}</span>
      </div>
    </div>`;
  }

  generateTimeAndBidsHTML(timeInfo, bidCount) {
    return `<div class="flex items-center justify-between text-md text-gray-600 font-semibold dark:text-gray-400 mb-3 flex-shrink-0" style="height: 24px; min-height: 24px; max-height: 24px;">
      <span class="font-medium ${timeInfo.class} transition-colors duration-200 truncate" style="max-width: 60%;">${timeInfo.text}</span>
      <span class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-md font-medium  flex-shrink-0">Bids: ${bidCount}</span>
    </div>`;
  }

  handleImageError(card, imageUrl) {
    if (!imageUrl) return;

    const img = card.querySelector(".listing-image");
    if (img) {
      img.addEventListener("error", function () {
        this.parentElement.outerHTML = `<div class="w-full flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-500 text-white text-center font-semibold text-lg italic flex-shrink-0 transition-all duration-300 hover:from-pink-500 hover:to-purple-600" style="height: ${CONSTANTS.DIMENSIONS.IMAGE_HEIGHT}; min-height: ${CONSTANTS.DIMENSIONS.IMAGE_HEIGHT}; max-height: ${CONSTANTS.DIMENSIONS.IMAGE_HEIGHT};">No image on this listing</div>`;
      });
    }
  }
}

// UI Manager - Refactored for better separation of concerns
class UIManager {
  constructor(elementManager, cardBuilder) {
    this.elements = elementManager;
    this.cardBuilder = cardBuilder;
  }

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

  hideLoading() {
    const loadingSpinner = this.elements.get("loadingSpinner");
    if (loadingSpinner) {
      loadingSpinner.classList.add("hidden");
    }
  }

  showError(message) {
    this.showMessage(message, "error");
  }

  displayListings(listings) {
    const listingsContainer = this.elements.get("listingsContainer");
    if (!listingsContainer) return;

    this.hideLoading();
    const messageContainer = this.elements.get("messageContainer");
    if (messageContainer) {
      messageContainer.classList.add("hidden");
    }

    if (listings.length === 0) {
      this.showMessage("No listings found.", "info");
      return;
    }

    listingsContainer.innerHTML = "";
    const fragment = document.createDocumentFragment();

    listings.forEach((listing) => {
      fragment.appendChild(this.cardBuilder.build(normalizeListing(listing)));
    });

    listingsContainer.appendChild(fragment);
  }

  updateAuthUI() {
    const addListingBtn = this.elements.get("addListingBtn");
    if (!addListingBtn) return;

    if (isAuthenticated()) {
      addListingBtn.classList.remove("hidden");
    } else {
      addListingBtn.classList.add("hidden");
    }
  }

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

  removeSearchIndicator() {
    const indicator = document.getElementById("search-indicator");
    if (indicator) {
      indicator.remove();
    }
  }

  updateMediaPreview(mediaCount) {
    const mediaCountElement = this.elements.get("mediaCount");
    if (!mediaCountElement) return;

    if (mediaCount === 0) {
      mediaCountElement.textContent = "No media selected";
      mediaCountElement.className = "text-gray-600 dark:text-gray-400";
    } else {
      mediaCountElement.textContent = `${mediaCount} media item${mediaCount > 1 ? "s" : ""} selected`;
      mediaCountElement.className = "text-green-600 dark:text-green-400";
    }
  }
}

// API Service - Enhanced error handling
class APIService {
  constructor() {
    // this.baseURL = CONSTANTS.API_BASE; // Remove this line
    this.baseURL = API_BASE_URL; // Use API_BASE_URL instead
  }

  async fetchListings() {
    try {
      const headers = this.buildHeaders();

      const response = await fetch(
        `${this.baseURL}/auction/listings?_seller=true&_bids=true&limit=100&sort=created&sortOrder=desc`,
        { headers },
      );

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const responseData = await response.json();

      return responseData.data || [];
    } catch (error) {
      throw error;
    }
  }

  buildHeaders() {
    const headers = {
      "Content-Type": "application/json",
      "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
    };

    if (isAuthenticated()) {
      headers["Authorization"] = getAuthHeader().Authorization;
    }

    return headers;
  }

  async handleErrorResponse(response) {
    const errorData = await response.json();
    throw new Error(
      errorData.errors?.[0]?.message || "Failed to fetch listings.",
    );
  }
}

// Modal Manager - Simplified and more focused
class ModalManager {
  constructor(elementManager, state, ui) {
    this.elements = elementManager;
    this.state = state;
    this.ui = ui;
  }

  openAddListingModal() {
    const modal = this.elements.get("addListingModal");
    if (!modal) return;

    modal.classList.remove("hidden");
    this.setupFormDefaults();
  }

  closeAddListingModal() {
    const modal = this.elements.get("addListingModal");
    const form = this.elements.get("addListingForm");

    if (!modal) return;

    modal.classList.add("hidden");
    if (form) {
      form.reset();
      this.state.clearMediaUrls();
      this.ui.updateMediaPreview(0);
    }
  }

  setupFormDefaults() {
    Utils.setMinimumDateTime(this.elements.get("listingEndDate"));
    this.setupMediaModalButton();
    this.state.clearMediaUrls();
    this.ui.updateMediaPreview(0);
  }

  openMediaModal() {
    const mediaModal = this.elements.get("addMediaModal");
    const listingModal = this.elements.get("addListingModal");

    if (!mediaModal || !listingModal) return;

    listingModal.classList.add("hidden");
    mediaModal.classList.remove("hidden");
    this.setupMediaInputs();
    this.populateExistingMedia();
  }

  closeMediaModal() {
    const mediaModal = this.elements.get("addMediaModal");
    const listingModal = this.elements.get("addListingModal");

    if (!mediaModal || !listingModal) return;

    mediaModal.classList.add("hidden");
    listingModal.classList.remove("hidden");
    this.resetMediaInputs();
  }

  setupMediaModalButton() {
    const openButton = this.elements.get("openMediaModalBtn");
    if (!openButton) return;

    const newBtn = openButton.cloneNode(true);
    openButton.parentNode.replaceChild(newBtn, openButton);
    newBtn.addEventListener("click", () => this.openMediaModal());
  }

  setupMediaInputs() {
    const addMoreBtn = this.elements.get("addMoreUrlBtn");
    const backBtn = this.elements.get("backToListingBtn");
    const mediaForm = this.elements.get("addMediaForm");

    if (addMoreBtn) {
      addMoreBtn.onclick = (e) => {
        e.preventDefault();
        this.addMediaInput();
      };
    }

    if (backBtn) {
      backBtn.onclick = (e) => {
        e.preventDefault();
        this.closeMediaModal();
      };
    }

    if (mediaForm) {
      mediaForm.onsubmit = (e) => {
        e.preventDefault();
        this.collectAndSaveMediaUrls();
        this.closeMediaModal();
      };
    }
  }

  addMediaInput() {
    const mediaContainer = this.elements.get("mediaUrlInputs");
    if (!mediaContainer) return;

    const currentInputs = mediaContainer.querySelectorAll("input").length;
    const newInput = this.createMediaInput("", currentInputs + 1);
    mediaContainer.appendChild(newInput);
  }

  createMediaInput(value, index) {
    const input = document.createElement("input");
    input.type = "url";
    input.name = "mediaUrl";
    input.placeholder = `Image URL ${index}`;
    input.value = value;
    input.className =
      "w-full px-3 py-2 border rounded-sm focus:outline-hidden focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white";
    return input;
  }

  populateExistingMedia() {
    const mediaContainer = this.elements.get("mediaUrlInputs");
    if (!mediaContainer) return;

    mediaContainer.innerHTML = "";
    const mediaUrls = this.state.getMediaUrls();

    if (mediaUrls.length > 0) {
      mediaUrls.forEach((url, index) => {
        mediaContainer.appendChild(this.createMediaInput(url, index + 1));
      });
    } else {
      for (let i = 1; i <= CONSTANTS.DEFAULT_MEDIA_INPUTS; i++) {
        mediaContainer.appendChild(this.createMediaInput("", i));
      }
    }
  }

  resetMediaInputs() {
    const mediaContainer = this.elements.get("mediaUrlInputs");
    if (!mediaContainer) return;

    mediaContainer.innerHTML = "";
    for (let i = 1; i <= CONSTANTS.DEFAULT_MEDIA_INPUTS; i++) {
      mediaContainer.appendChild(this.createMediaInput("", i));
    }
  }

  collectAndSaveMediaUrls() {
    const mediaInputs = document.querySelectorAll("input[name='mediaUrl']");
    const urls = Array.from(mediaInputs)
      .map((input) => input.value.trim())
      .filter((url) => url.length > 0);

    this.state.setMediaUrls(urls);
    this.ui.updateMediaPreview(urls.length);
  }
}

// Event Handler - Centralized event management
class EventHandler {
  constructor(elementManager, modalManager, ui, state, apiService) {
    this.elements = elementManager;
    this.modalManager = modalManager;
    this.ui = ui;
    this.state = state;
    this.apiService = apiService;
  }

  setupAllEventListeners() {
    this.setupSearchEvents();
    this.setupModalEvents();
    this.setupFormEvents();
    this.setupAuthEvents();
  }

  setupSearchEvents() {
    window.addEventListener("searchPerformed", (event) =>
      this.handleSearchResults(event),
    );

    window.clearSearchResults = () => {
      Utils.clearSearchResults();
      this.ui.removeSearchIndicator();
      this.ui.displayListings(this.state.getListings());
    };
  }

  setupModalEvents() {
    const addListingBtn = this.elements.get("addListingBtn");
    if (addListingBtn && isAuthenticated()) {
      addListingBtn.addEventListener("click", () => {
        this.modalManager.openAddListingModal();
      });
    }

    this.setupModalCloseEvents();
  }

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

    if (modal) {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) {
          this.modalManager.closeAddListingModal();
        }
      });
    }
  }

  setupFormEvents() {
    const form = this.elements.get("addListingForm");
    if (form && isAuthenticated()) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleFormSubmission();
      });
    }
  }

  setupAuthEvents() {
    window.addEventListener("storage", (e) => {
      if (e.key === "token" || e.key === "user") {
        this.ui.updateAuthUI();
      }
    });
  }

  handleSearchResults(event) {
    const { query, results, error, sortBy } = event.detail;

    if (error) {
      this.ui.showError(`Search error: ${error}`);
      return;
    }

    if (results.length === 0) {
      const message = this.getEmptyResultsMessage(query, sortBy);
      this.ui.showMessage(message, "info");
      return;
    }

    if (query.trim() === "") {
      this.ui.removeSearchIndicator();
      this.ui.displayListings(results);
    } else {
      this.state.setFilteredListings(results);
      this.ui.displayListings(results);
      this.ui.updateSearchIndicator(query, results.length);
    }
  }

  getEmptyResultsMessage(query, sortBy) {
    if (sortBy === "active-auctions") {
      return query.trim() === ""
        ? "No active auctions available at the moment."
        : `No active auctions found for "${query}".`;
    }

    return query.trim() === ""
      ? "No listings available at the moment."
      : `No results found for "${query}".`;
  }

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

  collectFormData() {
    return {
      title: this.elements.get("listingTitle")?.value.trim(),
      description: this.elements.get("listingDesc")?.value.trim(),
      endsAt: this.elements.get("listingEndDate")?.value,
      tags: this.elements.get("listingTags")?.value.trim() || "",
    };
  }

  async reloadListings() {
    this.ui.showLoading();
    try {
      const listings = await this.apiService.fetchListings();
      this.state.setListings(listings);
      this.ui.displayListings(listings);
    } catch (error) {
      this.ui.showError(`Error: ${error.message}`);
    } finally {
      this.ui.hideLoading();
    }
  }
}

// Main Application Controller - Simplified and more focused
class ListingsPageController {
  constructor() {
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
  }

  async init() {
    const listingsContainer = this.elementManager.get("listingsContainer");
    if (!listingsContainer) return;

    searchAndSortComponent.init();

    this.ui.updateAuthUI();
    this.setDefaultSortButton();
    await this.loadListings();
    this.eventHandler.setupAllEventListeners();
    this.handleURLSearch();
  }

  async loadListings() {
    this.ui.showLoading();
    this.state.setLoading(true);

    try {
      const listings = await this.apiService.fetchListings();
      this.state.setListings(listings);

      if (listings.length === 0) {
        this.ui.showMessage("No listings found.", "info");
        return;
      }

      this.ui.displayListings(listings);
    } catch (error) {
      this.ui.showMessage(`Error: ${error.message}`, "error");
    } finally {
      this.ui.hideLoading();
      this.state.setLoading(false);
    }
  }

  setDefaultSortButton() {
    const newestButton = document.querySelector(
      '.sort-btn[data-sort="newest"]',
    );
    if (newestButton) {
      newestButton.classList.remove(
        "bg-gray-200",
        "dark:bg-gray-700",
        "text-gray-700",
        "dark:text-gray-300",
      );
      newestButton.classList.add("bg-pink-500", "text-white");
    }
  }

  handleURLSearch() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get("search");

    if (searchQuery) {
      this.populateSearchInputs(searchQuery);
      setTimeout(() => {
        searchAndSortComponent.performSearch(searchQuery);
      }, 500);
    }
  }

  populateSearchInputs(searchQuery) {
    const headerSearch = this.elementManager.get("headerSearch");
    const mobileSearch = this.elementManager.get("mobileSearch");

    if (headerSearch) headerSearch.value = searchQuery;
    if (mobileSearch) mobileSearch.value = searchQuery;
  }

  // Public method for creating listing cards (for export)
  createListingCard(listing) {
    return this.cardBuilder.build(listing);
  }

  renderInitialListings() {
    const container = document.getElementById("seller-listings-container");
    if (!container) return;

    const listings = this.state.getInitialListings();
    listings.forEach((listing) => {
      // Ensure seller info is present
      if (!listing.seller || !listing.seller.name) {
        listing.seller = {
          name: this.profile.name,
          avatar: this.profile.avatar,
        };
      }
      // Ensure _count.bids exists for bid display
      if (!listing._count) listing._count = {};
      listing._count.bids = Array.isArray(listing.bids)
        ? listing.bids.length
        : 0;

      container.appendChild(createListingCard(listing));
    });
  }

  renderInitialWins() {
    const container = document.getElementById("seller-wins-container");
    if (!container) return;

    const wins = this.state.getInitialWins();
    wins.forEach((win) => {
      // Ensure _count.bids exists for bid display
      if (!win._count) win._count = {};
      win._count.bids = Array.isArray(win.bids) ? win.bids.length : 0;
      container.appendChild(createListingCard(win));
    });
  }
}

// Factory function for creating listing cards (maintains API compatibility)
export function createListingCard(listing) {
  const cardBuilder = new ListingCardBuilder();
  return cardBuilder.build(listing);
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  const app = new ListingsPageController();
  app.init().catch((error) => {
    console.error("Failed to initialize listings page:", error);
  });
});

function normalizeListing(listing) {
  if (!listing._count) listing._count = {};
  if (typeof listing._count.bids === "number" && listing._count.bids >= 0) {
    // Already normalized
  } else if (Array.isArray(listing.bids)) {
    listing._count.bids = listing.bids.length;
  } else if (
    listing.bids &&
    typeof listing.bids === "object" &&
    typeof listing.bids.count === "number"
  ) {
    listing._count.bids = listing.bids.count;
  } else {
    listing._count.bids = 0;
  }
  return listing;
}
