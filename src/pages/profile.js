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
    this.renderUserListings(profile);
    this.renderUserWins(profile);
  }

  generateProfileHTML(profile) {
    return [
      this.generateProfileHeader(profile),
      this.generateUserBio(profile),
      this.generateStatsSection(profile),
      this.generateActionButtons(),
      this.generateWinsSection(profile),
      this.generateListingsSection(profile),
      this.generateNewListingModal(),
    ].join("");
  }

  generateProfileHeader(profile) {
    return generateProfileHeader(profile);
  }

  generateUserBio(profile) {
    return `
      <div class="mb-6 text-center">
        <h3 class="text-xl font-semibold mb-2">User Bio</h3>
        <p class="text-gray-700 dark:text-gray-300">${profile.bio || "No bio provided."}</p>
      </div>
    `;
  }

  generateStatsSection(profile) {
    return `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class=" dark:bg-gray-600 border border-gray-500 p-4 rounded-lg text-center">
          <h4 class="text-lg font-semibold">Total Listings</h4>
          <p class="text-2xl font-bold text-black dark:text-white">${profile.listings?.length || 0}</p>
        </div>
        <div class=" dark:bg-gray-600 border border-gray-500 p-4 rounded-lg text-center">
          <h4 class="text-lg font-semibold">Wins</h4>
          <p class="text-2xl font-bold text-black dark:text-white">${profile.wins?.length || 0}</p>
        </div>
        <div class=" dark:bg-gray-600 border border-gray-500 p-4 rounded-lg text-center">
          <h4 class="text-lg font-semibold">Credits</h4>
          <p class="text-2xl font-bold text-black dark:text-white">${profile.credits || 0}</p>
        </div>
      </div>
    `;
  }

  generateActionButtons() {
    return `
      <div class="flex justify-center space-x-4 mb-6">
        <button id="newListingBtn" class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors">New Listing</button>
        <button id="editProfileBtn" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors">Edit Profile</button>
      </div>
    `;
  }

  generateWinsSection(profile) {
    if (!profile.wins?.length) {
      return `
        <div class="mb-6">
          <h3 class="text-xl font-semibold mb-4">Wins</h3>
          <div class="text-center text-gray-500 dark:text-gray-400">No wins yet.</div>
        </div>
      `;
    }
    return `
      <div class="mb-6">
        <h3 class="text-xl font-semibold mb-4">Wins</h3>
        <div id="user-wins-container" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"></div>
        <div id="wins-buttons-container" class="flex justify-center space-x-4 mt-4">
          <!-- Buttons will be created dynamically -->
        </div>
      </div>
    `;
  }

  generateListingsSection(profile) {
    if (!profile.listings?.length) {
      return `
        <div class="mb-6 text-center text-gray-500 dark:text-gray-400">No listings created yet.</div>
      `;
    }
    return `
      <div class="mb-6">
        <h3 class="text-xl font-semibold mb-4">Your Listings</h3>
        <div id="user-listings-container" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"></div>
        <div id="listings-buttons-container" class="flex justify-center space-x-4 mt-4">
          <!-- Buttons will be created dynamically -->
        </div>
      </div>
    `;
  }

  generateNewListingModal() {
    return `
      <div id="newListingModal" class="fixed inset-0 z-50 items-center justify-center bg-black bg-opacity-50 hidden">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6 relative">
          <button id="closeNewListingModal" class="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white">&times;</button>
          <h2 class="text-2xl font-bold mb-4">Create New Listing</h2>
          <form id="newListingForm" class="space-y-4">
            <div>
              <label for="listingTitle" class="block mb-1 font-semibold">Title</label>
              <input type="text" id="listingTitle" name="title" class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-hidden focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white" required>
            </div>
            <div>
              <label for="listingDesc" class="block mb-1 font-semibold">Description</label>
              <textarea id="listingDesc" name="description" class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-hidden focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white" rows="3" required></textarea>
            </div>
            <div>
              <label for="listingEndDate" class="block mb-1 font-semibold">End Date</label>
              <input type="datetime-local" id="listingEndDate" name="endsAt" class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-hidden focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white" required>
            </div>
            <div>
              <label for="listingImage" class="block mb-1 font-semibold">Image URL</label>
              <input type="url" id="listingImage" name="media" class="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-hidden focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
            </div>
            <div class="flex justify-end space-x-2">
              <button type="button" id="cancelNewListingBtn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors">Cancel</button>
              <button type="submit" class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">Create</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  renderUserListings(profile) {
    if (!profile.listings?.length) return;
    const container = document.getElementById("user-listings-container");
    if (!container) return;
    const listingsManager = new ListingsManager(
      container,
      profile.listings,
      profile,
    );
    listingsManager.render();
    listingsManager.setupEventListeners();
  }

  renderUserWins(profile) {
    if (!profile.wins?.length) return;
    const container = document.getElementById("user-wins-container");
    if (!container) return;
    const winsManager = new WinsManager(container, profile.wins, profile);
    winsManager.render();
    winsManager.setupEventListeners();
  }

  setupProfileEventListeners(profile) {
    this.setupEditProfileListener(profile);
    this.setupNewListingModalListeners(profile);
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
    new NewListingModalManager(this, profile).setupEventListeners();
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
  constructor(container, listings, profile) {
    this.container = container;
    this.listings = listings;
    this.profile = profile;
    this.currentIndex = LISTING_DISPLAY_LIMIT;
    this.buttonsContainer = null;
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
    for (const listing of listings) {
      let listingWithBids = listing;
      try {
        const response = await fetch(
          `${API_BASE_URL}/auction/listings/${listing.id}?_bids=true`,
          {
            headers: {
              "Content-Type": "application/json",
              "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
            },
          },
        );
        if (response.ok) {
          const data = await response.json();
          listingWithBids = { ...listing, ...data.data };
        }
      } catch (e) {}
      const normalizedListing = normalizeListing(listingWithBids, this.profile);
      this.container.appendChild(createListingCard(normalizedListing));
    }
  }

  createButtons() {
    if (this.listings.length <= LISTING_DISPLAY_LIMIT) return;

    this.buttonsContainer = document.getElementById(
      "listings-buttons-container",
    );
    if (!this.buttonsContainer) return;

    const viewMoreBtn = createViewMoreButton(
      "View More",
      () => this.handleViewMore(),
      "viewMoreBtn",
    );
    const viewLessBtn = createViewLessButton(
      "View Less",
      () => this.handleViewLess(),
      "viewLessBtn",
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

    const viewMoreBtn = this.buttonsContainer.querySelector("#viewMoreBtn");
    const viewLessBtn = this.buttonsContainer.querySelector("#viewLessBtn");

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
  constructor(container, wins, profile) {
    super(container, wins, profile);
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
class NewListingModalManager {
  constructor(uiManager, profile) {
    this.uiManager = uiManager;
    this.profile = profile;
  }

  setupEventListeners() {
    this.setupOpenModalListener();
    this.setupCloseModalListeners();
    this.setupFormSubmissionListener();
    this.uiManager.setMinimumDateTime();
  }

  setupOpenModalListener() {
    const newListingBtn = document.getElementById("newListingBtn");
    if (newListingBtn) {
      newListingBtn.addEventListener("click", () => this.openModal());
    }
  }

  setupCloseModalListeners() {
    const closeModalBtn = document.getElementById("closeNewListingModal");
    const cancelBtn = document.getElementById("cancelNewListingBtn");
    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", () => this.closeModal());
    }
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.closeModal());
    }
  }

  setupFormSubmissionListener() {
    const form = document.getElementById("newListingForm");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleFormSubmission();
      });
    }
  }

  openModal() {
    const modal = document.getElementById("newListingModal");
    if (modal) {
      modal.classList.remove("hidden");
    }
  }

  closeModal() {
    const modal = document.getElementById("newListingModal");
    const form = document.getElementById("newListingForm");
    if (modal) {
      modal.classList.add("hidden");
    }
    if (form) {
      form.reset();
    }
  }

  async handleFormSubmission() {
    const formData = this.getFormData();
    try {
      await APIService.createListing(formData);
      this.uiManager.showMessage("success", "Listing created successfully!");
      this.closeModal();
      const refreshedProfile = await APIService.fetchProfile(this.profile.name);
      this.uiManager.renderProfileView(refreshedProfile);
    } catch (err) {
      this.uiManager.showMessage(
        "error",
        err.message || "Failed to create listing.",
      );
    }
  }

  getFormData() {
    const title = document.getElementById("listingTitle").value.trim();
    const description = document.getElementById("listingDesc").value.trim();
    const endsAt = document.getElementById("listingEndDate").value;
    const mediaUrl = document.getElementById("listingImage").value.trim();
    return {
      title,
      description,
      endsAt: new Date(endsAt).toISOString(),
      media: mediaUrl ? [{ url: mediaUrl, alt: title }] : [],
    };
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
            <button type="submit" class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">Save Changes</button>
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
      `${API_BASE_URL}/auction/profiles/${name}?_listings=true&_wins=true&_seller=true&_bids=true&_count=true`,
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
        '<div class="text-center text-red-600">User data incomplete. Please log in again. <a href="/login.html" class="underline text-blue-500 hover:text-blue-700">Login here</a>.</div>';
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

document.addEventListener("DOMContentLoaded", () => {
  new ProfileController().init();
});
