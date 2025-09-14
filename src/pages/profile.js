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

const LISTING_DISPLAY_LIMIT = 4;
const MESSAGE_DISPLAY_DURATION = 4000;

function normalizeListing(listing, profile) {
  if (!listing.seller?.name) {
    listing.seller = { name: profile.name, avatar: profile.avatar };
  }
  listing._count = listing._count || {};
  listing._count.bids =
    Number.isInteger(listing._count.bids) && listing._count.bids >= 0
      ? listing._count.bids
      : 0;
  return listing;
}

// DOM Elements Manager
class DOMElements {
  constructor() {
    this.profileContainer = document.getElementById("profile-content");
  }
  getProfileContainer() {
    return this.profileContainer;
  }
}

// UI Manager
class UIManager {
  constructor(elements) {
    this.elements = elements;
  }

  showMessage(type, message) {
    const container = this.elements.getProfileContainer();
    if (!container) return;
    const messageElement = document.createElement("div");
    messageElement.className = `my-4 p-3 rounded-sm text-center ${type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`;
    messageElement.textContent = message;
    container.prepend(messageElement);
    setTimeout(() => messageElement.remove(), MESSAGE_DISPLAY_DURATION);
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
              <span class="text-yellow-500">🏆</span>
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
        (listing) => new Date(listing.endsAt) <= new Date(),
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
      profile.listings?.filter(
        (listing) => new Date(listing.endsAt) <= new Date(),
      ) || [];

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
    this.currentIndex = LISTING_DISPLAY_LIMIT;
    this.buttonsContainer = null;
    this.buttonsContainerId = buttonsContainerId;
  }

  render() {
    this.renderInitialListings();
    this.createButtons();
  }

  renderInitialListings() {
    const initialListings = this.listings.slice(0, LISTING_DISPLAY_LIMIT);
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
      this.container.appendChild(createListingCard(normalizedListing));
    }
  }

  createButtons() {
    if (this.listings.length <= LISTING_DISPLAY_LIMIT) return;

    this.buttonsContainer = document.getElementById(this.buttonsContainerId);
    if (!this.buttonsContainer) return;

    const viewMoreBtn = createViewMoreButton(
      "View More",
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
    this.currentIndex = LISTING_DISPLAY_LIMIT;
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
    if (this.listings.length <= LISTING_DISPLAY_LIMIT) return;

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
      this.currentIndex + LISTING_DISPLAY_LIMIT,
    );
    this.renderListings(nextWins);
    this.currentIndex += LISTING_DISPLAY_LIMIT;

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
    this.currentIndex = LISTING_DISPLAY_LIMIT;

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
        <button id="closeEditProfileModal" class="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white">&times;</button>
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
class APIService {
  static getHeaders() {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");
    return {
      "Content-Type": "application/json",
      "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
      Authorization: `Bearer ${token}`,
    };
  }

  static async fetchProfile(name) {
    const response = await fetch(
      `${API_BASE_URL}/auction/profiles/${name}?_listings=true&_wins=true&_tags=true&_seller=true&_bids=true&_count=true`,
      { headers: this.getHeaders() },
    );
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login.html";
        return;
      }
      const errorData = await response.json();
      throw new Error(
        errorData.errors?.[0]?.message || "Failed to load profile",
      );
    }
    const responseData = await response.json();
    return responseData.data;
  }

  static async updateProfile({ avatar, bio, name }) {
    const body = {};
    if (avatar) body.avatar = { url: avatar, alt: "User avatar" };
    if (bio) body.bio = bio;
    const response = await fetch(`${API_BASE_URL}/auction/profiles/${name}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.errors?.[0]?.message || "Failed to update profile",
      );
    }
    const responseData = await response.json();
    return responseData.data;
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
class ProfileController {
  constructor() {
    this.elements = new DOMElements();
    this.ui = new UIManager(this.elements);
  }

  async init() {
    const container = this.elements.getProfileContainer();
    if (!container) return;
    if (!isAuthenticated()) {
      container.innerHTML =
        '<div class="text-center text-red-600">You must be logged in to view your profile. <a href="/login.html" class="underline text-blue-500 hover:text-blue-700">Login here</a>.</div>';
      return;
    }
    const user = getCurrentUser();
    if (!user || !user.name) {
      container.innerHTML =
        '<div class="text-center  text-red-600">User data incomplete. Please log in again. <a href="/login.html" class="underline text-blue-500 hover:text-blue-700">Login here</a>.</div>';
      logoutUser();
      return;
    }
    try {
      const profile = await APIService.fetchProfile(user.name);
      this.ui.renderProfileView(profile);
    } catch (error) {
      this.ui.showMessage("error", error.message || "Could not load profile.");
      if (error.message.includes("Failed to load profile")) {
        setTimeout(() => logoutUser(), 2000);
      }
    }
  }
}

// Export the main controller class
export { ProfileController };
