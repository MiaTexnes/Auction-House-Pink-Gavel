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
    return (
      this.profile?.listings?.slice(
        this.currentListingsIndex,
        this.currentListingsIndex + ITEMS_PER_PAGE,
      ) || []
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
    return this.profile?.listings?.slice(0, ITEMS_PER_PAGE) || [];
  }
  getInitialWins() {
    return this.profile?.wins?.slice(0, ITEMS_PER_PAGE) || [];
  }
  hasMoreListings() {
    return this.currentListingsIndex < (this.profile?.listings?.length || 0);
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
    this.renderInitialItems();
    this.setupListingsButtons();
    this.setupWinsButtons();
  }
  generateProfileHTML(profile) {
    return `
      <div class="seller-profile max-w-6xl mx-auto p-6">
        ${this.generateProfileHeader(profile)}
        ${this.generateBioSection(profile)}
        ${this.generateStatsSection(profile)}
        ${this.generateListingsSection(profile)}
        ${this.generateWinsSection(profile)}
      </div>
    `;
  }
  generateProfileHeader(profile) {
    return generateProfileHeader(profile);
  }
  generateBioSection(profile) {
    return `
      <div class="mb-6 text-center">
        <h3 class="text-xl font-semibold mb-2">Bio</h3>
        <p class="text-gray-700 dark:text-gray-300">${profile.bio || "No bio provided."}</p>
      </div>
    `;
  }
  generateStatsSection(profile) {
    return `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-blue-100 dark:bg-blue-800 border border-gray-300 p-4 rounded-lg text-center">
          <h4 class="text-lg font-semibold">Total Listings</h4>
          <p class="text-2xl font-bold text-blue-600">${profile.listings?.length || 0}</p>
        </div>
        <div class="bg-purple-100 dark:bg-purple-800 border border-gray-300 p-4 rounded-lg text-center">
          <h4 class="text-lg font-semibold">Wins</h4>
          <p class="text-2xl font-bold text-purple-600">${profile.wins?.length || 0}</p>
        </div>
        <div class="bg-green-100 dark:bg-green-800 border border-gray-300 p-4 rounded-lg text-center">
          <h4 class="text-lg font-semibold">Credits</h4>
          <p class="text-2xl font-bold text-green-600">${profile.credits || 0}</p>
        </div>
      </div>
    `;
  }
  generateListingsSection(profile) {
    return `
      <div class="mb-6">
        <h3 class="text-xl font-semibold mb-4">Listings</h3>
        <div id="seller-listings-container" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"></div>
        <div id="listings-buttons-container" class="flex justify-center space-x-4 mt-4">
          <!-- Buttons will be created dynamically -->
        </div>
      </div>
    `;
  }
  generateWinsSection(profile) {
    return `
      <div class="mb-6">
        <h3 class="text-xl font-semibold mb-4">Wins</h3>
        <div id="seller-wins-container" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"></div>
        <div id="wins-buttons-container" class="flex justify-center space-x-4 mt-4">
          <!-- Buttons will be created dynamically -->
        </div>
      </div>
    `;
  }
  setupListingsButtons() {
    if ((this.state.profile?.listings?.length || 0) <= ITEMS_PER_PAGE) return;

    const buttonsContainer = document.getElementById(
      "listings-buttons-container",
    );
    if (!buttonsContainer) return;

    const viewMoreBtn = createViewMoreButton(
      "View More",
      () => this.handleViewMoreListings(),
      "viewMoreListingsBtn",
    );
    const viewLessBtn = createViewLessButton(
      "View Less",
      () => this.handleViewLessListings(),
      "viewLessListingsBtn",
      "hidden",
    );

    buttonsContainer.appendChild(viewMoreBtn);
    buttonsContainer.appendChild(viewLessBtn);
  }

  setupWinsButtons() {
    if ((this.state.profile?.wins?.length || 0) <= ITEMS_PER_PAGE) return;

    const buttonsContainer = document.getElementById("wins-buttons-container");
    if (!buttonsContainer) return;

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

    buttonsContainer.appendChild(viewMoreBtn);
    buttonsContainer.appendChild(viewLessBtn);
  }
  renderInitialItems() {
    this.renderInitialListings();
    this.renderInitialWins();
  }
  renderInitialListings() {
    const container = document.getElementById("seller-listings-container");
    if (!container) return;
    this.state.getInitialListings().forEach((listing) => {
      fetchListingWithBids(listing.id).then((listingWithBids) => {
        container.appendChild(
          createListingCard(
            normalizeListing(listingWithBids || listing, this.state.profile),
          ),
        );
      });
    });
  }
  renderInitialWins() {
    const container = document.getElementById("seller-wins-container");
    if (!container) return;
    this.state.getInitialWins().forEach((win) => {
      fetchListingWithBids(win.id).then((winWithBids) => {
        container.appendChild(
          createListingCard(
            normalizeListing(winWithBids || win, this.state.profile),
          ),
        );
      });
    });
  }
  handleViewMoreListings() {
    const container = document.getElementById("seller-listings-container");
    if (!container) return;

    this.state.getNextListings().forEach((listing) => {
      container.appendChild(
        createListingCard(normalizeListing(listing, this.state.profile)),
      );
    });
    this.state.incrementListingsIndex();

    this.toggleListingsButtons(false);
  }

  handleViewLessListings() {
    const container = document.getElementById("seller-listings-container");
    if (!container) return;

    container.innerHTML = "";
    this.renderInitialListings();
    this.state.resetListingsIndex();

    this.toggleListingsButtons(true);
  }

  handleViewMoreWins() {
    const container = document.getElementById("seller-wins-container");
    if (!container) return;

    this.state.getNextWins().forEach((win) => {
      container.appendChild(
        createListingCard(normalizeListing(win, this.state.profile)),
      );
    });
    this.state.incrementWinsIndex();

    this.toggleWinsButtons(false);
  }

  handleViewLessWins() {
    const container = document.getElementById("seller-wins-container");
    if (!container) return;

    container.innerHTML = "";
    this.renderInitialWins();
    this.state.resetWinsIndex();

    this.toggleWinsButtons(true);
  }

  toggleListingsButtons(showMore) {
    const buttonsContainer = document.getElementById(
      "listings-buttons-container",
    );
    if (!buttonsContainer) return;

    const viewMoreBtn = buttonsContainer.querySelector("#viewMoreListingsBtn");
    const viewLessBtn = buttonsContainer.querySelector("#viewLessListingsBtn");

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

  toggleWinsButtons(showMore) {
    const buttonsContainer = document.getElementById("wins-buttons-container");
    if (!buttonsContainer) return;

    const viewMoreBtn = buttonsContainer.querySelector("#viewMoreWinsBtn");
    const viewLessBtn = buttonsContainer.querySelector("#viewLessWinsBtn");

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
