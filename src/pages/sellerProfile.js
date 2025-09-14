//sellerProfile.js
import { isAuthenticated } from "../library/auth.js";
import { createListingCard } from "./listings.js";
import { config } from "../services/config.js";
import { API_BASE_URL } from "../services/baseApi.js";
import {
  createViewMoreButton,
  createViewLessButton,
} from "../components/buttons.js";
import { generateProfileHeader } from "../utils/profileUtils.js";

const ITEMS_PER_PAGE = 4;

// Base Listings Manager
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
    this.buttonsContainerId = buttonsContainerId;
    this.currentIndex = ITEMS_PER_PAGE;
  }

  renderItems(items) {
    items.forEach((item) => {
      fetchListingWithBids(item.id).then((itemWithBids) => {
        this.container.appendChild(
          createListingCard(
            normalizeListing(itemWithBids || item, this.profile),
          ),
        );
      });
    });
  }

  renderInitial() {
    this.container.innerHTML = "";
    const initialItems = this.listings.slice(0, ITEMS_PER_PAGE);
    this.renderItems(initialItems);
    this.setupButtons();
  }

  setupButtons() {
    if (this.listings.length <= ITEMS_PER_PAGE) return;

    const buttonsContainer = document.getElementById(this.buttonsContainerId);
    if (!buttonsContainer) return;

    buttonsContainer.innerHTML = ""; // Clear existing buttons

    const viewMoreBtn = createViewMoreButton(
      "View More",
      () => this.handleViewMore(),
      `viewMore${this.getPrefix()}Btn`,
    );
    const viewLessBtn = createViewLessButton(
      "View Less",
      () => this.handleViewLess(),
      `viewLess${this.getPrefix()}Btn`,
      "hidden",
    );

    buttonsContainer.appendChild(viewMoreBtn);
    buttonsContainer.appendChild(viewLessBtn);
  }

  handleViewMore() {
    const nextItems = this.listings.slice(
      this.currentIndex,
      this.currentIndex + ITEMS_PER_PAGE,
    );
    this.renderItems(nextItems);
    this.currentIndex += ITEMS_PER_PAGE;

    this.toggleButtons(false);
  }

  handleViewLess() {
    this.renderInitial();
    this.currentIndex = ITEMS_PER_PAGE;
    this.toggleButtons(true);
  }

  toggleButtons(showMore) {
    const buttonsContainer = document.getElementById(this.buttonsContainerId);
    if (!buttonsContainer) return;

    const viewMoreBtn = buttonsContainer.querySelector(
      `#viewMore${this.getPrefix()}Btn`,
    );
    const viewLessBtn = buttonsContainer.querySelector(
      `#viewLess${this.getPrefix()}Btn`,
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

  getPrefix() {
    return "Listings";
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

  getPrefix() {
    return "Wins";
  }
}

class DOMElements {
  constructor() {
    this.profileContainer = document.getElementById("profiles-container");
  }
  getProfileContainer() {
    return this.profileContainer;
  }
}

class URLManager {
  static getQueryParam(param) {
    return new URLSearchParams(window.location.search).get(param);
  }
  static getSellerName() {
    return this.getQueryParam("name");
  }
}

class StateManager {
  constructor() {
    this.profile = null;
    this.currentListingsIndex = ITEMS_PER_PAGE;
    this.currentWinsIndex = ITEMS_PER_PAGE;
  }
  setProfile(profile) {
    this.profile = profile;
  }
  getProfile() {
    return this.profile;
  }
  resetListingsIndex() {
    this.currentListingsIndex = ITEMS_PER_PAGE;
  }
  resetWinsIndex() {
    this.currentWinsIndex = ITEMS_PER_PAGE;
  }
  incrementListingsIndex() {
    this.currentListingsIndex += ITEMS_PER_PAGE;
  }
  incrementWinsIndex() {
    this.currentWinsIndex += ITEMS_PER_PAGE;
  }
  getNextListings() {
    const activeListings =
      this.profile?.listings?.filter(
        (listing) => new Date(listing.endsAt) > new Date(),
      ) || [];
    return activeListings.slice(
      this.currentListingsIndex,
      this.currentListingsIndex + ITEMS_PER_PAGE,
    );
  }
  getNextWins() {
    return (
      this.profile?.wins?.slice(
        this.currentWinsIndex,
        this.currentWinsIndex + ITEMS_PER_PAGE,
      ) || []
    );
  }
  getInitialListings() {
    const activeListings =
      this.profile?.listings?.filter(
        (listing) => new Date(listing.endsAt) > new Date(),
      ) || [];
    return activeListings.slice(0, ITEMS_PER_PAGE);
  }
  getInitialWins() {
    return this.profile?.wins?.slice(0, ITEMS_PER_PAGE) || [];
  }
  hasMoreListings() {
    const activeListings =
      this.profile?.listings?.filter(
        (listing) => new Date(listing.endsAt) > new Date(),
      ) || [];
    return this.currentListingsIndex < activeListings.length;
  }
  hasMoreWins() {
    return this.currentWinsIndex < (this.profile?.wins?.length || 0);
  }
}

class UIManager {
  constructor(elements, state) {
    this.elements = elements;
    this.state = state;
  }
  showLoading() {
    const container = this.elements.getProfileContainer();
    if (container) {
      container.innerHTML = `
        <div class="loading text-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p>Loading seller profile...</p>
        </div>
      `;
    }
  }
  showError(message, type = "error") {
    const container = this.elements.getProfileContainer();
    if (container) {
      const bgColor =
        type === "warning"
          ? "bg-yellow-100 text-yellow-800"
          : "bg-red-100 text-red-800";
      container.innerHTML = `
        <div class="error-message ${bgColor} p-4 rounded-lg text-center max-w-md mx-auto mt-8">
          <p>${message}</p>
          ${type === "warning" ? this.getBackToHomeButton() : ""}
        </div>
      `;
    }
  }
  showNoSellerError() {
    const container = this.elements.getProfileContainer();
    if (container) {
      container.innerHTML = `
        <div class="error-message bg-yellow-100 text-yellow-800 p-4 rounded-lg text-center max-w-md mx-auto mt-8">
          <h3 class="font-semibold mb-2">No Seller Specified</h3>
          <p>Please select a seller to view their profile.</p>
          ${this.getBackToHomeButton()}
        </div>
      `;
    }
  }
  getBackToHomeButton() {
    return `
      <a href="/" class="mt-2 inline-block bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded transition-colors">
        Back to Home
      </a>
    `;
  }
  showAuthRequired() {
    this.showError("You must be logged in to view profiles.", "warning");
  }
  renderProfile(profile) {
    const container = this.elements.getProfileContainer();
    if (!container || !profile) {
      this.showError("Profile data not available.");
      return;
    }
    document.title = `${profile.name} - Seller Profile | Pink Gavel Auctions`;
    container.innerHTML = this.generateProfileHTML(profile);
    this.setupActiveListingsToggle(profile);
    this.setupWinsToggle(profile);
    this.setupEndedListingsToggle(profile);
  }
  generateProfileHTML(profile) {
    return [
      this.generateProfileHeader(profile),
      this.generateUserBio(profile),
      this.generateStatsSection(profile),
      this.generateListingsSection(profile),
      this.generateEndedListingsSection(profile),
      this.generateWinsSection(profile),
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
          <h4 class="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-2">Seller Credits</h4>
          <p class="text-4xl font-bold text-purple-900 dark:text-purple-100">${profile.credits || 0}</p>
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
              <span class="text-green-500">🎯</span>
              Seller Active Listings
            </h3>
            <button
              id="toggleSellerActiveListingsBtn"
              class="bg-gradient-to-r from-green-200 to-green-300 hover:from-green-300 hover:to-green-400 dark:from-green-700 dark:to-green-800 dark:hover:from-green-600 dark:hover:to-green-700 text-green-800 dark:text-green-100 px-4 py-2 rounded-lg transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
            >
              ${activeListings.length > 0 ? `Show Active (${activeListings.length})` : "No Active Listings"}
            </button>
          </div>
          <div id="seller-active-listings-section" class="hidden">
            <div id="seller-listings-container" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>
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
        (listing) => new Date(listing.endsAt) <= new Date(),
      ) || [];

    return `
      <div class="mb-8 px-4 md:px-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold flex items-center gap-2">
              <span class="text-red-500">🔚</span>
              Seller Ended Listings
            </h3>
            <button
              id="toggleSellerEndedListingsBtn"
              class="bg-gradient-to-r from-red-200 to-red-300 hover:from-red-300 hover:to-red-400 dark:from-red-700 dark:to-red-800 dark:hover:from-red-600 dark:hover:to-red-700 text-red-800 dark:text-red-100 px-4 py-2 rounded-lg transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
            >
              ${endedListings.length > 0 ? `Show Ended (${endedListings.length})` : "No Ended Listings"}
            </button>
          </div>
          <div id="seller-ended-listings-section" class="hidden">
            <div id="seller-ended-listings-container" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>
            <div id="seller-ended-listings-buttons-container" class="flex justify-center space-x-4 mt-4">
              <!-- Buttons will be created dynamically -->
            </div>
          </div>
        </div>
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
              <span class="text-yellow-500">🏆</span>
              Seller Wins
            </h3>
            <button
              id="toggleSellerWinsBtn"
              class="bg-gradient-to-r from-yellow-200 to-yellow-300 hover:from-yellow-300 hover:to-yellow-400 dark:from-yellow-700 dark:to-yellow-800 dark:hover:from-yellow-600 dark:hover:to-yellow-700 text-yellow-800 dark:text-yellow-100 px-4 py-2 rounded-lg transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
            >
              ${wins.length > 0 ? `Show Wins (${wins.length})` : "No Wins Yet"}
            </button>
          </div>
          <div id="seller-wins-section" class="hidden">
            <div id="seller-wins-container" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>
            <div id="wins-buttons-container" class="flex justify-center space-x-4 mt-4">
              <!-- Buttons will be created dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;
  }
  // ...existing code...

  // Removed duplicate setupEndedListingsToggle

  renderEndedListings(profile) {
    const endedListings =
      profile.listings?.filter(
        (listing) => new Date(listing.endsAt) <= new Date(),
      ) || [];

    if (!endedListings.length) return;

    const container = document.getElementById(
      "seller-ended-listings-container",
    );
    if (!container) return;

    const endedListingsManager = new ListingsManager(
      container,
      endedListings,
      profile,
      "seller-ended-listings-buttons-container",
    );
    endedListingsManager.renderInitial();
  }

  setupActiveListingsToggle(profile) {
    const toggleBtn = document.getElementById("toggleSellerActiveListingsBtn");
    const activeSection = document.getElementById(
      "seller-active-listings-section",
    );

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
        this.renderSellerListings(profile);
        isExpanded = true;
      }
    });
  }

  setupWinsToggle(profile) {
    const toggleBtn = document.getElementById("toggleSellerWinsBtn");
    const winsSection = document.getElementById("seller-wins-section");

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
        this.renderSellerWins(profile);
        isExpanded = true;
      }
    });
  }
  renderSellerListings(profile) {
    const container = document.getElementById("seller-listings-container");
    if (!container) return;

    const activeListings =
      profile.listings?.filter(
        (listing) => new Date(listing.endsAt) > new Date(),
      ) || [];

    const listingsManager = new ListingsManager(
      container,
      activeListings,
      profile,
      "listings-buttons-container",
    );
    listingsManager.renderInitial();
  }

  renderSellerWins(profile) {
    const container = document.getElementById("seller-wins-container");
    if (!container) return;

    const wins = profile.wins || [];

    const winsManager = new WinsManager(
      container,
      wins,
      profile,
      "wins-buttons-container",
    );
    winsManager.renderInitial();
  }

  setupEndedListingsToggle(profile) {
    const toggleBtn = document.getElementById("toggleSellerEndedListingsBtn");
    const endedSection = document.getElementById(
      "seller-ended-listings-section",
    );

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

    toggleBtn.addEventListener("click", () => {
      if (isExpanded) {
        endedSection.classList.add("hidden");
        toggleBtn.textContent = `Show Ended (${endedListings.length})`;
        isExpanded = false;
      } else {
        endedSection.classList.remove("hidden");
        toggleBtn.textContent = `Hide Ended (${endedListings.length})`;
        this.renderEndedListings(profile);
        isExpanded = true;
      }
    });
  }
}

class APIService {
  static getHeaders() {
    const token = localStorage.getItem("token");
    if (!isAuthenticated() || !token)
      throw new Error("Authentication required");
    return {
      "Content-Type": "application/json",
      "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
      Authorization: `Bearer ${token}`,
    };
  }
  static async fetchSellerProfile(name) {
    const headers = this.getHeaders();
    const response = await fetch(
      `${API_BASE_URL}/auction/profiles/${name}?_listings=true&_wins=true&_bids=true`,
      { headers },
    );
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        throw new Error("Authentication expired. Please log in again.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.errors?.[0]?.message ||
          `Failed to fetch profile: ${response.statusText}`,
      );
    }
    const data = await response.json();
    return data.data;
  }
}

class SellerProfileController {
  constructor() {
    this.elements = new DOMElements();
    this.state = new StateManager();
    this.ui = new UIManager(this.elements, this.state);
  }
  async init() {
    const container = this.elements.getProfileContainer();
    if (!container) return;
    const sellerName = URLManager.getSellerName();
    if (!sellerName) {
      this.ui.showNoSellerError();
      return;
    }
    if (!isAuthenticated()) {
      this.ui.showAuthRequired();
      return;
    }
    this.ui.showLoading();
    try {
      const profile = await APIService.fetchSellerProfile(sellerName);
      if (profile) {
        this.state.setProfile(profile);
        this.ui.renderProfile(profile);
      } else {
        this.ui.showError(
          "Failed to load seller profile. Please try again later.",
        );
      }
    } catch (error) {
      this.ui.showError(error.message || "An unexpected error occurred.");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new SellerProfileController().init();
});

export { SellerProfileController, APIService, URLManager };

function normalizeListing(listing, profile) {
  if (!listing.seller || !listing.seller.name) {
    listing.seller = { name: profile.name, avatar: profile.avatar };
  }
  if (!listing._count) listing._count = {};
  listing._count.bids = Array.isArray(listing.bids) ? listing.bids.length : 0;
  return listing;
}

function fetchListingWithBids(listingId) {
  return fetch(`${API_BASE_URL}/auction/listings/${listingId}?_bids=true`, {
    headers: {
      "Content-Type": "application/json",
      "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
    },
  })
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => (data ? data.data : null));
}
