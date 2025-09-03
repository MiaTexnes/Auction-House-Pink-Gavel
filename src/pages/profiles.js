import { isAuthenticated, getAuthHeader } from "../library/auth.js";
import { config } from "../services/config.js";
import { API_BASE_URL } from "../services/baseApi.js"; // Add this import
import {
  createViewMoreButton,
  createViewLessButton,
  createButtonContainer,
} from "../components/buttons.js";

// Constants
const DEFAULT_AVATAR = "https://placehold.co/100x100?text=Avatar";
const PROFILES_PER_PAGE = 12;
const SORT_CRITERIA = {
  MOST_CREDITS: "mostCredits",
  LEAST_CREDITS: "leastCredits",
  MOST_LISTINGS: "mostListings",
  LEAST_LISTINGS: "leastListings",
};

// DOM Elements Manager
class DOMElements {
  constructor() {
    this.profileContainer = document.getElementById("profiles-container");
  }

  getProfileContainer() {
    return this.profileContainer;
  }

  getOrCreateControlsContainer() {
    let controlsContainer = document.querySelector("#controls-container");
    if (!controlsContainer) {
      controlsContainer = document.createElement("div");
      controlsContainer.id = "controls-container";
      controlsContainer.className = "flex justify-center space-x-4 mt-4";
      this.profileContainer.parentElement.appendChild(controlsContainer);
    }
    return controlsContainer;
  }

  getOrCreateSortingContainer() {
    let sortingContainer = document.querySelector("#sorting-container");
    if (!sortingContainer) {
      sortingContainer = document.createElement("div");
      sortingContainer.id = "sorting-container";
      sortingContainer.className = "flex justify-center space-x-4 mb-4";
      this.profileContainer.parentElement.insertBefore(
        sortingContainer,
        this.profileContainer,
      );
    }
    return sortingContainer;
  }
}

// State Manager
class StateManager {
  constructor() {
    this.profiles = [];
    this.sortedProfiles = [];
    this.currentIndex = 0;
    this.sortStates = {
      credits: true, // true = most credits, false = least credits
      listings: true, // true = most listings, false = least listings
    };
  }

  setProfiles(profiles) {
    this.profiles = profiles;
    this.sortedProfiles = [...profiles];
  }

  getProfiles() {
    return this.profiles;
  }

  getSortedProfiles() {
    return this.sortedProfiles;
  }

  getCurrentBatch() {
    // Fix: Show profiles from 0 to currentIndex + PROFILES_PER_PAGE for cumulative display
    // This will show 12, then 24, then 36, etc.
    return this.sortedProfiles.slice(0, this.currentIndex + PROFILES_PER_PAGE);
  }

  canShowMore() {
    // Fix: Check if there are more profiles beyond the current display
    return this.currentIndex + PROFILES_PER_PAGE < this.sortedProfiles.length;
  }

  canShowLess() {
    // Fix: Can show less if we're displaying more than the initial batch
    return this.currentIndex > 0;
  }

  showMore() {
    // Fix: Increase the index by PROFILES_PER_PAGE to show next batch
    if (this.canShowMore()) {
      this.currentIndex += PROFILES_PER_PAGE;
    }
  }

  showLess() {
    // Fix: Decrease the index by PROFILES_PER_PAGE to show previous batch
    this.currentIndex = Math.max(0, this.currentIndex - PROFILES_PER_PAGE);
  }

  resetIndex() {
    this.currentIndex = 0;
  }

  toggleCreditsSortState() {
    this.sortStates.credits = !this.sortStates.credits;
  }

  toggleListingsSortState() {
    this.sortStates.listings = !this.sortStates.listings;
  }

  getCreditsSortState() {
    return this.sortStates.credits;
  }

  getListingsSortState() {
    return this.sortStates.listings;
  }

  sortProfiles(criteria) {
    switch (criteria) {
      case SORT_CRITERIA.MOST_CREDITS:
        this.sortedProfiles.sort((a, b) => (b.credits || 0) - (a.credits || 0));
        break;
      case SORT_CRITERIA.LEAST_CREDITS:
        this.sortedProfiles.sort((a, b) => (a.credits || 0) - (b.credits || 0));
        break;
      case SORT_CRITERIA.MOST_LISTINGS:
        this.sortedProfiles.sort(
          (a, b) => (b._count?.listings || 0) - (a._count?.listings || 0),
        );
        break;
      case SORT_CRITERIA.LEAST_LISTINGS:
        this.sortedProfiles.sort(
          (a, b) => (a._count?.listings || 0) - (b._count?.listings || 0),
        );
        break;
    }
    this.resetIndex();
  }
}

// UI Manager
class UIManager {
  constructor(elements, state) {
    this.elements = elements;
    this.state = state;
  }

  showLoading() {
    const container = this.elements.getProfileContainer();
    if (!container) return;

    container.innerHTML = `
      <div class="loading text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
        <p>Loading profiles...</p>
      </div>
    `;
  }

  showError(message, type = "error") {
    const container = this.elements.getProfileContainer();
    if (!container) return;

    const bgColor =
      type === "warning"
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800";
    container.innerHTML = `
      <div class="error-message ${bgColor} p-4 rounded-lg text-center">
        <p>${message}</p>
      </div>
    `;
  }

  showNoProfiles() {
    const container = this.elements.getProfileContainer();
    if (!container) return;

    container.innerHTML = `
      <div class="error-message bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-300 p-4 rounded-lg text-center">
        <p>No profiles found.</p>
      </div>
    `;
  }

  showAuthRequired() {
    this.showError("You must be logged in to view profiles.", "warning");
  }

  renderProfiles() {
    const container = this.elements.getProfileContainer();
    if (!container) return;

    const profiles = this.state.getCurrentBatch();

    if (profiles.length === 0) {
      this.showNoProfiles();
      return;
    }

    container.innerHTML = "";
    profiles.forEach((profile) => {
      container.appendChild(this.createProfileCard(profile));
    });

    this.renderControlButtons();
  }

  createProfileCard(profile) {
    const profileElement = document.createElement("div");
    profileElement.className =
      "profile p-6 border border-gray-300 dark:border-gray-700 rounded-lg shadow-md bg-white dark:bg-gray-800 hover:shadow-lg hover:shadow-black transition-shadow mb-6";

    const avatarUrl = profile.avatar?.url || profile.avatar || DEFAULT_AVATAR;

    profileElement.innerHTML = `
      <div class="flex items-center space-x-4">
        <img src="${avatarUrl}"
             alt="${profile.name}'s avatar"
             class="w-16 h-16 rounded-full object-cover border-2 border-pink-500">
        <div class="flex-1 min-w-0">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white truncate">${profile.name}</h2>
          <p class="text-gray-700 dark:text-gray-400 break-all text-sm">${profile.email || "Email not available"}</p>
        </div>
      </div>
      <div class="mt-4 grid grid-cols-2 gap-4">
        <div class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-white p-4 rounded-lg text-center">
          <h4 class="text-sm font-semibold">Credits</h4>
          <p class="text-lg font-bold">${profile.credits || 0}</p>
        </div>
        <div class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-white p-4 rounded-lg text-center">
          <h4 class="text-sm font-semibold">Listings</h4>
          <p class="text-lg font-bold">${profile._count?.listings || 0}</p>
        </div>
      </div>
      <div class="mt-4 text-center">
        <a href="/sellerProfile.html?name=${profile.name}"
           class="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all">
          View Profile
        </a>
      </div>
    `;

    return profileElement;
  }

  renderControlButtons() {
    const controlsContainer = this.elements.getOrCreateControlsContainer();
    controlsContainer.innerHTML = "";

    if (this.state.canShowMore()) {
      const viewMoreButton = this.createButton("View More", () => {
        this.state.showMore();
        this.renderProfiles();
      });
      controlsContainer.appendChild(viewMoreButton);
    }

    if (this.state.canShowLess()) {
      const viewLessButton = this.createButton("View Less", () => {
        this.state.showLess();
        this.renderProfiles();
      });
      controlsContainer.appendChild(viewLessButton);
    }
  }

  renderSortingControls() {
    const sortingContainer = this.elements.getOrCreateSortingContainer();

    const creditsButtonText = this.state.getCreditsSortState()
      ? "Sort by Most Credits"
      : "Sort by Least Credits";
    const listingsButtonText = this.state.getListingsSortState()
      ? "Sort by Most Listings"
      : "Sort by Least Listings";

    sortingContainer.innerHTML = `
      <button class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-all"
              id="toggleCreditsSort">${creditsButtonText}</button>
      <button class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-all"
              id="toggleListingsSort">${listingsButtonText}</button>
    `;

    this.setupSortingEventListeners();
  }

  setupSortingEventListeners() {
    const creditsButton = document.getElementById("toggleCreditsSort");
    const listingsButton = document.getElementById("toggleListingsSort");

    if (creditsButton) {
      creditsButton.addEventListener("click", () => {
        const criteria = this.state.getCreditsSortState()
          ? SORT_CRITERIA.MOST_CREDITS
          : SORT_CRITERIA.LEAST_CREDITS;
        this.state.sortProfiles(criteria);
        this.state.toggleCreditsSortState();
        this.renderProfiles();
        this.renderSortingControls();
      });
    }

    if (listingsButton) {
      listingsButton.addEventListener("click", () => {
        const criteria = this.state.getListingsSortState()
          ? SORT_CRITERIA.MOST_LISTINGS
          : SORT_CRITERIA.LEAST_LISTINGS;
        this.state.sortProfiles(criteria);
        this.state.toggleListingsSortState();
        this.renderProfiles();
        this.renderSortingControls();
      });
    }
  }

  createButton(text, onClick) {
    const button = document.createElement("button");
    button.textContent = text;
    button.className =
      "bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-6 rounded-lg transition-all";
    button.addEventListener("click", onClick);
    return button;
  }
}

// API Service
class APIService {
  static getHeaders() {
    if (!isAuthenticated()) {
      throw new Error("Authentication required");
    }

    const headers = {
      "Content-Type": "application/json",
      "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
    };

    if (isAuthenticated()) {
      const authHeader = getAuthHeader();
      headers.Authorization = authHeader.Authorization;
    }

    return headers;
  }

  static async fetchProfiles() {
    try {
      const headers = this.getHeaders();

      const response = await fetch(
        `${API_BASE_URL}/auction/profiles?_listings=true&limit=100`,
        { headers },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.errors?.[0]?.message ||
            `Failed to fetch profiles: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();

      // Handle both array response and data wrapper
      const profiles = Array.isArray(result) ? result : result.data || [];

      // Ensure profiles have the required structure
      return profiles.map((profile) => ({
        ...profile,
        credits: profile.credits || 0,
        _count: profile._count || { listings: 0, wins: 0 },
      }));
    } catch (error) {
      throw error;
    }
  }
}

// Main Profiles Controller
class ProfilesController {
  constructor() {
    this.elements = new DOMElements();
    this.state = new StateManager();
    this.ui = new UIManager(this.elements, this.state);
  }

  async init() {
    const container = this.elements.getProfileContainer();
    if (!container) {
      return;
    }

    if (!isAuthenticated()) {
      this.ui.showAuthRequired();
      return;
    }

    this.ui.showLoading();

    try {
      const profiles = await APIService.fetchProfiles();

      if (!profiles || profiles.length === 0) {
        this.ui.showNoProfiles();
        return;
      }

      this.state.setProfiles(profiles);
      this.ui.renderSortingControls();
      this.ui.renderProfiles();

      // Setup event listeners for HTML sorting buttons
      this.setupHTMLSortingButtons();
    } catch (error) {
      if (error.message === "Authentication required") {
        this.ui.showAuthRequired();
      } else {
        this.ui.showError(error.message || "An unexpected error occurred.");
      }
    }
  }

  setupHTMLSortingButtons() {
    const sortAlphabeticalBtn = document.getElementById("sortAlphabetical");
    const sortMostCreditsBtn = document.getElementById("sortMostCredits");
    const sortLeastCreditsBtn = document.getElementById("sortLeastCredits");

    if (sortAlphabeticalBtn) {
      sortAlphabeticalBtn.addEventListener("click", () => {
        this.state.sortedProfiles.sort((a, b) => a.name.localeCompare(b.name));
        this.state.resetIndex();
        this.ui.renderProfiles();
      });
    }

    if (sortMostCreditsBtn) {
      sortMostCreditsBtn.addEventListener("click", () => {
        this.state.sortProfiles(SORT_CRITERIA.MOST_CREDITS);
        this.ui.renderProfiles();
      });
    }

    if (sortLeastCreditsBtn) {
      sortLeastCreditsBtn.addEventListener("click", () => {
        this.state.sortProfiles(SORT_CRITERIA.LEAST_CREDITS);
        this.ui.renderProfiles();
      });
    }
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  const profilesController = new ProfilesController();
  profilesController.init();
});

// Export for testing purposes
export { ProfilesController, APIService, StateManager };
