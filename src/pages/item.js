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
import { searchAndSortComponent } from "../components/searchAndSort.js";
import { config } from "../services/config.js";
import { API_BASE_URL } from "../services/baseApi.js"; // Add this import

// Constants
const DEFAULT_AVATAR = "https://placehold.co/48x48?text=S";
const DEFAULT_BIDDER_AVATAR = "https://placehold.co/40x40?text=B";
const DEFAULT_IMAGE = "https://placehold.co/600x400?text=No+Image";
const MAX_TAGS = 10;
const COUNTDOWN_INTERVAL = 1000;

// DOM Elements Manager
class DOMElements {
  constructor() {
    this.loading = document.getElementById("loading-spinner");
    this.error = {
      container: document.getElementById("error-container"),
      text: document.getElementById("error-text"),
    };
    this.content = document.getElementById("item-content");

    this.item = {
      mainImage: document.getElementById("main-image"),
      gallery: document.getElementById("image-gallery"),
      status: document.getElementById("auction-status"),
      title: document.getElementById("item-title"),
      description: document.getElementById("item-description"),
      tags: document.getElementById("item-tags"),
      seller: {
        avatar: document.getElementById("seller-avatar"),
        name: document.getElementById("seller-name"),
      },
      bid: {
        current: document.getElementById("current-bid"),
        count: document.getElementById("bid-count"),
      },
      time: {
        remaining: document.getElementById("time-remaining"),
        endDate: document.getElementById("end-date"),
      },
    };

    this.bidding = {
      section: document.getElementById("bidding-section"),
      form: document.getElementById("bid-form"),
      input: document.getElementById("bid-amount"),
      minText: document.getElementById("min-bid-text"),
      history: document.getElementById("bidding-history"),
      noBids: document.getElementById("no-bids"),
    };

    this.actions = {
      owner: document.getElementById("owner-actions"),
      authRequired: document.getElementById("auth-required"),
    };

    this.modals = {
      delete: {
        modal: document.getElementById("delete-modal"),
        cancel: document.getElementById("cancel-delete-btn"),
        confirm: document.getElementById("confirm-delete-btn"),
      },
      edit: {
        modal: document.getElementById("edit-modal"),
        form: document.getElementById("edit-listing-form"),
        cancel: document.getElementById("cancel-edit-btn"),
        title: document.getElementById("edit-title"),
        description: document.getElementById("edit-description"),
        media: document.getElementById("edit-media"),
        tags: document.getElementById("edit-tags"),
      },
    };
  }
}

// Utility Functions
const Utils = {
  getListingId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("id");
  },

  processTags(tagsString) {
    if (!tagsString || typeof tagsString !== "string") {
      return [];
    }

    return tagsString
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .slice(0, MAX_TAGS);
  },

  formatTimeRemaining(endDate) {
    const now = new Date();
    const end = new Date(endDate);
    const timeLeft = end.getTime() - now.getTime();

    if (timeLeft <= 0) {
      return { text: "Auction Ended", isEnded: true };
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    if (days > 0) {
      return { text: `${days}d ${hours}h ${minutes}m`, isEnded: false };
    } else if (hours > 0) {
      return { text: `${hours}h ${minutes}m ${seconds}s`, isEnded: false };
    } else {
      return { text: `${minutes}m ${seconds}s`, isEnded: false };
    }
  },
};

// State Manager
class StateManager {
  constructor() {
    this.currentListing = null;
    this.countdownInterval = null;
  }

  setListing(listing) {
    this.currentListing = listing;
  }

  getListing() {
    return this.currentListing;
  }

  startCountdown(updateCallback) {
    this.stopCountdown();
    this.countdownInterval = setInterval(updateCallback, COUNTDOWN_INTERVAL);
  }

  stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
}

// UI Manager
class UIManager {
  constructor(elements) {
    this.elements = elements;
  }

  showLoading() {
    this.elements.loading?.classList.remove("hidden");
    this.elements.error.container?.classList.add("hidden");
    this.elements.content?.classList.add("hidden");
  }

  showError(message) {
    this.elements.loading?.classList.add("hidden");
    this.elements.error.container?.classList.remove("hidden");
    this.elements.content?.classList.add("hidden");
    if (this.elements.error.text) {
      this.elements.error.text.textContent = message;
    }
  }

  showContent() {
    this.elements.loading?.classList.add("hidden");
    this.elements.error.container?.classList.add("hidden");
    this.elements.content?.classList.remove("hidden");
  }

  updateAuctionStatus(listing) {
    const timeInfo = Utils.formatTimeRemaining(listing.endsAt);

    if (this.elements.item.time.remaining) {
      this.elements.item.time.remaining.textContent = timeInfo.text;
    }

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

  renderBasicInfo(listing) {
    if (this.elements.item.title) {
      this.elements.item.title.textContent = listing.title;
    }

    if (this.elements.item.description) {
      this.elements.item.description.textContent =
        listing.description || "No description provided.";
    }

    this.renderTags(listing.tags || []);
    this.renderEndDate(listing.endsAt);
  }

  renderTags(tags) {
    const tagsEl = this.elements.item.tags;
    if (!tagsEl) return;

    tagsEl.innerHTML = "";

    if (tags.length === 0) {
      tagsEl.innerHTML =
        '<span class="text-gray-500 dark:text-gray-400 text-sm italic">No tags</span>';
      return;
    }

    tags.forEach((tag) => {
      const tagElement = document.createElement("span");
      tagElement.className =
        "inline-block bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 px-4 py-2 rounded-full text-lg mr-3 mb-2 shadow-md";
      tagElement.textContent = `#${tag}`;
      tagsEl.appendChild(tagElement);
    });
  }

  renderEndDate(endsAt) {
    if (!this.elements.item.time.endDate) return;

    const endDateTime = new Date(endsAt);
    this.elements.item.time.endDate.textContent = `Ends: ${endDateTime.toLocaleDateString()} ${endDateTime.toLocaleTimeString()}`;
  }

  renderImages(media, title) {
    const mainImg = this.elements.item.mainImage;
    if (mainImg) {
      if (media && media.length > 0 && media[0].url) {
        mainImg.src = media[0].url;
        mainImg.alt = title;

        if (media.length > 1) {
          this.renderImageGallery(media);
        }
      } else {
        mainImg.src = DEFAULT_IMAGE;
        mainImg.alt = "No image available";
      }
    }
  }

  renderImageGallery(media) {
    const gallery = this.elements.item.gallery;
    if (!gallery) return;

    gallery.innerHTML = "";

    media.forEach((item, index) => {
      const thumbnail = document.createElement("img");
      thumbnail.src = item.url;
      thumbnail.alt = item.alt || `Image ${index + 1}`;
      thumbnail.className =
        "w-full h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity";

      if (index === 0) {
        thumbnail.classList.add("border-2", "border-pink-500");
      }

      thumbnail.addEventListener("click", () => {
        if (this.elements.item.mainImage) {
          this.elements.item.mainImage.src = item.url;
        }

        gallery.querySelectorAll("img").forEach((img) => {
          img.classList.remove("border-2", "border-pink-500");
        });
        thumbnail.classList.add("border-2", "border-pink-500");
      });

      gallery.appendChild(thumbnail);
    });

    gallery.classList.remove("hidden");
  }

  renderSellerInfo(seller) {
    if (this.elements.item.seller.avatar) {
      const avatarUrl = seller?.avatar?.url || DEFAULT_AVATAR;
      this.elements.item.seller.avatar.src = avatarUrl;
      this.elements.item.seller.avatar.alt = `${seller?.name || "Unknown"} avatar`;
    }

    if (this.elements.item.seller.name) {
      const sellerName = seller?.name || "Unknown Seller";

      if (isAuthenticated()) {
        const profileUrl = `/sellerProfile.html?name=${encodeURIComponent(sellerName)}`;
        this.elements.item.seller.name.innerHTML = `<a href="${profileUrl}" class="text-pink-500 hover:underline">${sellerName}</a>`;
      } else {
        this.elements.item.seller.name.textContent = sellerName;
      }
    }
  }

  renderBidInfo(bids) {
    const highestBid =
      bids.length > 0 ? Math.max(...bids.map((bid) => bid.amount)) : 0;

    if (this.elements.item.bid.current) {
      this.elements.item.bid.current.textContent =
        highestBid > 0 ? `${highestBid} credits` : "No bids yet";
    }

    if (this.elements.item.bid.count) {
      this.elements.item.bid.count.textContent = `${bids.length} bid${
        bids.length !== 1 ? "s" : ""
      }`;
    }

    const minBid = getMinimumBid(bids);
    if (this.elements.bidding.input) {
      this.elements.bidding.input.min = minBid;
      this.elements.bidding.input.placeholder = `Minimum bid: ${minBid}`;
    }

    if (this.elements.bidding.minText) {
      this.elements.bidding.minText.textContent = `Minimum bid: ${minBid} credits`;
    }
  }

  handleUserActions(listing, isEnded) {
    const authenticated = isAuthenticated();
    const currentUser = getCurrentUser();
    const isOwner =
      authenticated && currentUser && currentUser.name === listing.seller?.name;

    if (isOwner) {
      this.elements.bidding.section?.classList.add("hidden");
      this.elements.actions.authRequired?.classList.add("hidden");
      this.elements.actions.owner?.classList.remove("hidden");
    } else if (isEnded) {
      this.elements.bidding.section?.classList.add("hidden");
      this.elements.actions.owner?.classList.add("hidden");
      this.elements.actions.authRequired?.classList.add("hidden");
    } else if (authenticated) {
      this.elements.actions.authRequired?.classList.add("hidden");
      this.elements.actions.owner?.classList.add("hidden");
      this.elements.bidding.section?.classList.remove("hidden");
    } else {
      this.elements.bidding.section?.classList.add("hidden");
      this.elements.actions.owner?.classList.add("hidden");
      this.elements.actions.authRequired?.classList.remove("hidden");
    }
  }

  renderBiddingHistory(bids) {
    if (!this.elements.bidding.history) return;
    this.elements.bidding.history.innerHTML = "";
    if (bids.length === 0) {
      this.elements.bidding.noBids?.classList.remove("hidden");
      return;
    }
    this.elements.bidding.noBids?.classList.add("hidden");
    const sortedBids = [...bids].sort((a, b) => b.amount - a.amount);
    // Determine if auction is ended
    const listing = window.itemPageController?.state?.getListing?.();
    const isEnded = listing
      ? Utils.formatTimeRemaining(listing.endsAt).isEnded
      : false;
    sortedBids.forEach((bid, index) => {
      const isHighestBid = index === 0;
      const avatarUrl = bid.bidder?.avatar?.url || DEFAULT_BIDDER_AVATAR;
      const bidderName = bid.bidder?.name || "Unknown Bidder";

      // Create clickable username link if authenticated and bidder name exists
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
        // Winner block: bigger and centered
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

  populateEditForm(listing) {
    if (this.elements.modals.edit.title) {
      this.elements.modals.edit.title.value = listing.title || "";
    }

    if (this.elements.modals.edit.description) {
      this.elements.modals.edit.description.value = listing.description || "";
    }

    if (this.elements.modals.edit.media) {
      const mediaUrls = listing.media?.map((item) => item.url).join("\n") || "";
      this.elements.modals.edit.media.value = mediaUrls;
    }

    if (this.elements.modals.edit.tags) {
      const tagsString = listing.tags ? listing.tags.join(", ") : "";
      this.elements.modals.edit.tags.value = tagsString;
    }
  }
}

// API Service
class APIService {
  static async fetchListing(id) {
    const headers = {
      "Content-Type": "application/json",
      "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
    };

    if (isAuthenticated()) {
      const authHeader = getAuthHeader();
      headers.Authorization = authHeader.Authorization;
    }

    const response = await fetch(
      `${API_BASE_URL}/auction/listings/${id}?_seller=true&_bids=true`, // Use API_BASE_URL instead of API_BASE
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

  static async deleteListing(id) {
    if (!isAuthenticated()) {
      throw new Error("You must be logged in to delete a listing");
    }

    const authHeader = getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/auction/listings/${id}`, {
      // Use API_BASE_URL instead of API_BASE
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

  static async updateListing(id, updatedData) {
    if (!isAuthenticated()) {
      throw new Error("You must be logged in to edit a listing");
    }

    const authHeader = getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/auction/listings/${id}`, {
      // Use API_BASE_URL instead of API_BASE
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

// Main Application Controller
class ItemPageController {
  constructor() {
    this.elements = new DOMElements();
    this.ui = new UIManager(this.elements);
    this.state = new StateManager();
  }

  async init() {
    searchAndSortComponent.init();

    const listingId = Utils.getListingId();
    if (!listingId) {
      this.ui.showError("No listing ID provided");
      return;
    }

    await this.loadListing(listingId);
    this.setupEventListeners();
  }

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

  renderListing(listing) {
    this.ui.renderBasicInfo(listing);
    this.ui.renderImages(listing.media, listing.title);
    this.ui.renderSellerInfo(listing.seller);

    const bids = listing.bids || [];
    this.ui.renderBidInfo(bids);
    this.ui.renderBiddingHistory(bids);

    this.startCountdown();

    const isEnded = this.ui.updateAuctionStatus(listing);
    this.ui.handleUserActions(listing, isEnded);
  }

  startCountdown() {
    const listing = this.state.getListing();
    if (!listing) return;

    const updateCountdown = () => {
      const isEnded = this.ui.updateAuctionStatus(listing);
      if (isEnded) {
        this.state.stopCountdown();
        this.ui.handleUserActions(listing, true);
      }
    };

    updateCountdown();
    this.state.startCountdown(updateCountdown);
  }

  setupEventListeners() {
    this.setupBiddingEvents();
    this.setupOwnerActions();
    this.setupModalEvents();
    this.setupSearchEvents();
    this.setupCleanupEvents();
  }

  setupBiddingEvents() {
    if (this.elements.bidding.form) {
      this.elements.bidding.form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleBidSubmission();
      });
    }
  }

  async handleBidSubmission() {
    const amount = parseInt(this.elements.bidding.input.value);
    const listing = this.state.getListing();

    if (!amount || amount < this.elements.bidding.input.min) {
      alert(`Minimum bid is ${this.elements.bidding.input.min} credits`);
      return;
    }

    const bidCheck = await canUserBid(listing);
    if (!bidCheck.canBid) {
      alert(bidCheck.reason);
      return;
    }

    const result = await APIService.placeBidOnListing(amount, listing);

    if (result.success) {
      await this.loadListing(listing.id);
      alert(result.message);
    } else {
      alert(result.error);
    }
  }

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

  setupModalEvents() {
    // Edit modal events
    if (this.elements.modals.edit.form) {
      this.elements.modals.edit.form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleEditSubmission();
      });
    }

    if (this.elements.modals.edit.cancel) {
      this.elements.modals.edit.cancel.addEventListener("click", () => {
        this.elements.modals.edit.modal?.classList.add("hidden");
      });
    }

    // Delete modal events
    if (this.elements.modals.delete.cancel) {
      this.elements.modals.delete.cancel.addEventListener("click", () => {
        this.elements.modals.delete.modal?.classList.add("hidden");
      });
    }

    if (this.elements.modals.delete.confirm) {
      this.elements.modals.delete.confirm.addEventListener(
        "click",
        async () => {
          this.elements.modals.delete.modal?.classList.add("hidden");
          await this.handleDelete();
        },
      );
    }

    // Close modals when clicking outside
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

  async handleEditSubmission() {
    const title = this.elements.modals.edit.title.value.trim();
    const description = this.elements.modals.edit.description.value.trim();
    const mediaText = this.elements.modals.edit.media.value.trim();
    const tagsText = this.elements.modals.edit.tags?.value.trim() || "";

    if (!title) {
      alert("Title is required");
      return;
    }

    if (!description) {
      alert("Description is required");
      return;
    }

    const mediaUrls = mediaText
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0)
      .map((url) => ({ url, alt: title }));

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
      await this.loadListing(listing.id);
      alert("Listing updated successfully!");
      this.elements.modals.edit.modal?.classList.add("hidden");
    } catch (error) {
      alert(error.message);
    }
  }

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

  setupSearchEvents() {
    window.addEventListener("searchPerformed", (event) => {
      const { query, results, error } = event.detail;

      if (error) {
        return;
      }

      if (query.trim() === "") {
        return;
      }

      if (results.length > 0) {
        window.location.href = `/listings.html?search=${encodeURIComponent(query)}`;
      }
    });
  }

  setupCleanupEvents() {
    window.addEventListener("beforeunload", () => {
      this.state.stopCountdown();
    });
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  window.itemPageController = new ItemPageController();
  window.itemPageController.init();
});
