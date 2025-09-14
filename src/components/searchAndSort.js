/**
 * SearchAndSortComponent
 * Handles search and sorting for auction listings, including dropdown UI, debounced search, and sorting logic.
 * @module SearchAndSortComponent
 */
import { config } from "../services/config.js";
import { API_BASE_URL } from "../services/baseApi.js";
import {
  createDebouncedSearch,
  createCachedFetch,
} from "../utils/requestManager.js";

export class SearchAndSortComponent {
  /**
   * Initializes the SearchAndSortComponent instance.
   */
  constructor() {
    /**
     * Cache for search results
     * @type {Map<string, {data: Array, timestamp: number}>}
     */
    this.cache = new Map();
    /**
     * Cache timeout in ms
     * @type {number}
     */
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    /**
     * Timeout for dropdown search
     * @type {?number}
     */
    this.searchTimeout = null;
    /**
     * Indicates if a search is in progress
     * @type {boolean}
     */
    this.isSearching = false;
    /**
     * Current sort type
     * @type {string}
     */
    this.currentSort = "relevance";
    /**
     * Dropdown visibility state
     * @type {boolean}
     */
    this.dropdownVisible = false;
    /**
     * Cached fetch utility
     */
    this.cachedFetch = createCachedFetch(300000);

    /**
     * Debounced search function
     */
    this.debouncedSearch = createDebouncedSearch((query) => {
      this.performSearch(query);
    }, 500);
  }

  /**
   * Initializes event listeners and dropdown containers.
   */
  init() {
    this.setupSearchListeners();
    this.setupSortListeners();
    this.createDropdownContainers();
    this.setupDocumentClickListener();
  }

  /**
   * Creates dropdown containers for header and mobile search inputs.
   */
  createDropdownContainers() {
    const headerSearch = document.getElementById("header-search");
    if (headerSearch)
      this.createDropdown(headerSearch, "header-search-dropdown");
    const mobileSearch = document.getElementById("mobile-search");
    if (mobileSearch)
      this.createDropdown(mobileSearch, "mobile-search-dropdown");
  }

  /**
   * Creates a dropdown element for a given search input.
   * @param {HTMLElement} searchInput - The input element
   * @param {string} dropdownId - The id for the dropdown
   */
  createDropdown(searchInput, dropdownId) {
    if (document.getElementById(dropdownId)) return;
    const dropdown = document.createElement("div");
    dropdown.id = dropdownId;
    dropdown.className =
      "absolute bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-[60] hidden max-h-80 overflow-y-auto w-full";
    const searchContainer = searchInput.parentElement;
    searchContainer.style.position = "relative";
    dropdown.style.top = `${searchInput.offsetHeight + 4}px`;
    searchContainer.appendChild(dropdown);
  }

  /**
   * Sets up click listener to hide dropdowns when clicking outside.
   */
  setupDocumentClickListener() {
    document.addEventListener("click", (e) => {
      const headerContainer =
        document.getElementById("header-search")?.parentElement;
      const mobileContainer =
        document.getElementById("mobile-search")?.parentElement;
      if (headerContainer && !headerContainer.contains(e.target))
        this.hideDropdown("header-search-dropdown");
      if (mobileContainer && !mobileContainer.contains(e.target))
        this.hideDropdown("mobile-search-dropdown");
    });
  }

  /**
   * Sets up listeners for search inputs and clear button.
   */
  setupSearchListeners() {
    const headerSearch = document.getElementById("header-search");
    const mobileSearch = document.getElementById("mobile-search");
    const clearSearch = document.getElementById("clear-search");
    if (headerSearch) this.setupSearchInput(headerSearch, clearSearch);
    if (mobileSearch) this.setupSearchInput(mobileSearch, null);
    if (clearSearch) {
      clearSearch.addEventListener("click", (e) => {
        e.preventDefault();
        this.clearSearch();
      });
    }
  }

  /**
   * Sets up listeners for sort buttons and select dropdown.
   */
  setupSortListeners() {
    const sortButtons = document.querySelectorAll(".sort-btn");
    sortButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const sortType = button.getAttribute("data-sort");
        this.setSortType(sortType);
        this.updateSortButtonStyles(button);
        this.applySorting();
      });
    });
    const sortSelect = document.getElementById("sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        this.currentSort = e.target.value;
        this.applySorting();
      });
    }
  }

  /**
   * Sets the current sort type.
   * @param {string} sortType
   */
  setSortType(sortType) {
    const sortMapping = {
      newest: "newest",
      oldest: "oldest",
      "won-auctions": "won-auctions",
    };
    this.currentSort = sortMapping[sortType] || sortType;
  }

  /**
   * Filters listings to only active auctions.
   * @param {Array} listings
   * @returns {Array}
   */
  filterActiveAuctions(listings) {
    const now = new Date();
    return listings.filter((listing) => new Date(listing.endsAt) > now);
  }

  /**
   * Updates the styles of sort buttons to reflect the active selection.
   * @param {HTMLElement} activeButton
   */
  updateSortButtonStyles(activeButton) {
    const sortButtons = document.querySelectorAll(".sort-btn");
    sortButtons.forEach((btn) => {
      btn.classList.remove("bg-pink-500", "text-white");
      btn.classList.add(
        "bg-gray-200",
        "dark:bg-gray-700",
        "text-gray-700",
        "dark:text-gray-300",
      );
    });
    activeButton.classList.remove(
      "bg-gray-200",
      "dark:bg-gray-700",
      "text-gray-700",
      "dark:text-gray-300",
    );
    activeButton.classList.add("bg-pink-400", "text-black");
  }

  /**
   * Sets up listeners for a search input and optional clear button.
   * @param {HTMLInputElement} searchInput
   * @param {?HTMLElement} clearButton
   */
  setupSearchInput(searchInput, clearButton) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.trim();
      // Show/hide clear button for header search
      if (clearButton && searchInput.id === "header-search") {
        if (query.length > 0) clearButton.classList.remove("hidden");
        else clearButton.classList.add("hidden");
      }
      this.syncSearchInputs(query, searchInput);
      if (query.length > 0) {
        this.debouncedSearch(query);
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          this.performDropdownSearch(query, searchInput);
        }, 500);
      } else {
        this.hideAllDropdowns();
        this.debouncedSearch(query);
      }
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const query = e.target.value.trim();
        if (query.length > 0) {
          window.location.href = `/listings.html?search=${encodeURIComponent(query)}`;
        } else {
          this.debouncedSearch(query);
        }
      }
    });
    // Focus header search on click
    if (searchInput.id === "header-search") {
      searchInput.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!searchInput.matches(":focus")) searchInput.focus();
      });
    }
  }

  /**
   * Performs a dropdown search and displays results in the dropdown.
   * @param {string} query
   * @param {HTMLInputElement} searchInput
   */
  async performDropdownSearch(query, searchInput) {
    try {
      const results = await this.searchAPI(query);
      const sortedResults = this.sortListings(results, this.currentSort);
      const limitedResults = sortedResults.slice(0, 3);
      this.showDropdown(searchInput, query, limitedResults, results.length);
    } catch {
      // Silently fail dropdown search
    }
  }

  /**
   * Renders the dropdown with search results.
   * @param {HTMLInputElement} searchInput
   * @param {string} query
   * @param {Array} results
   * @param {number} totalCount
   */
  showDropdown(searchInput, query, results, totalCount) {
    const dropdownId =
      searchInput.id === "header-search"
        ? "header-search-dropdown"
        : "mobile-search-dropdown";
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    if (dropdown._updatePosition) dropdown._updatePosition();
    if (results.length === 0) {
      dropdown.innerHTML = `
        <div class="p-2">
          <div class="p-4 text-center text-gray-500 dark:text-gray-400">
            No results found for "${query}"
          </div>
          <div class="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2">
            <button
              class="w-full text-left px-2 py-2 text-sm text-pink-600 dark:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-center font-medium clear-search-btn"
            >
              Clear search
            </button>
          </div>
        </div>
      `;
    } else {
      dropdown.innerHTML = `
        <div class="p-2">
          <div class="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 mb-2">
            Showing ${results.length} of ${totalCount} results
          </div>
          ${results.map((listing) => this.createDropdownItem(listing)).join("")}
          <div class="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2">
            <button
              class="w-full text-left px-2 py-2 text-sm text-pink-600 dark:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-center font-medium view-all-results-btn"
              data-query="${encodeURIComponent(query)}"
            >
              View all ${totalCount} results →
            </button>
          </div>
        </div>
      `;
    }
    dropdown.classList.remove("hidden");
    this.dropdownVisible = true;

    // Add event listeners for dropdown buttons
    this.setupDropdownEventListeners(dropdown);
  }

  /**
   * Sets up event listeners for dropdown buttons.
   * @param {HTMLElement} dropdown - The dropdown element
   */
  setupDropdownEventListeners(dropdown) {
    // Clear search button
    const clearBtn = dropdown.querySelector(".clear-search-btn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        this.clearSearch();
      });
    }

    // View all results button
    const viewAllBtn = dropdown.querySelector(".view-all-results-btn");
    if (viewAllBtn) {
      viewAllBtn.addEventListener("click", () => {
        const query = viewAllBtn.getAttribute("data-query");
        window.location.href = `/listings.html?search=${query}`;
      });
    }

    // Dropdown items
    const items = dropdown.querySelectorAll(".dropdown-item");
    items.forEach((item) => {
      item.addEventListener("click", () => {
        const listingId = item.getAttribute("data-listing-id");
        window.location.href = `/item.html?id=${listingId}`;
      });
    });
  }

  /**
   * Creates a dropdown item HTML for a listing.
   * @param {Object} listing
   * @returns {string}
   */
  createDropdownItem(listing) {
    const imageUrl =
      listing.media && listing.media.length > 0 && listing.media[0].url
        ? listing.media[0].url
        : null;
    const endDate = new Date(listing.endsAt);
    const now = new Date();
    const timeLeftMs = endDate.getTime() - now.getTime();
    const isEnded = timeLeftMs <= 0;
    return `
      <div
        class="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 dropdown-item"
        data-listing-id="${listing.id}"
      >
        <div class="flex-shrink-0 w-12 h-12 mr-3">
          ${
            imageUrl
              ? `<img src="${imageUrl}" alt="${listing.title}" class="w-12 h-12 object-cover rounded" onerror="this.src='https://placehold.co/48x48?text=No+Image'">`
              : `<div class="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">No Img</div>`
          }
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
            ${listing.title}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            ${listing._count?.bids || 0} bids • ${isEnded ? "Ended" : "Active"}
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Hides a dropdown by id.
   * @param {string} dropdownId
   */
  hideDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) dropdown.classList.add("hidden");
    this.dropdownVisible = false;
  }

  /**
   * Hides all dropdowns.
   */
  hideAllDropdowns() {
    this.hideDropdown("header-search-dropdown");
    this.hideDropdown("mobile-search-dropdown");
  }

  /**
   * Syncs the value of both search inputs (header and mobile).
   * @param {string} query
   * @param {HTMLInputElement} excludeInput
   */
  syncSearchInputs(query, excludeInput) {
    const headerSearch = document.getElementById("header-search");
    const mobileSearch = document.getElementById("mobile-search");
    if (
      headerSearch &&
      headerSearch !== excludeInput &&
      headerSearch.value !== query
    )
      headerSearch.value = query;
    if (
      mobileSearch &&
      mobileSearch !== excludeInput &&
      mobileSearch.value !== query
    )
      mobileSearch.value = query;
  }

  /**
   * Performs a search and dispatches a search event.
   * @param {string} query
   */
  async performSearch(query) {
    if (this.isSearching) return;
    this.isSearching = true;
    try {
      let results = [];
      if (query.trim() === "") {
        results = await this.searchAPI("");
      } else {
        results = await this.searchAPI(query);
      }
      results = this.sortListings(results, this.currentSort);
      this.dispatchSearchEvent(query, results);
    } catch (error) {
      this.dispatchSearchEvent(query, [], error.message);
    } finally {
      this.isSearching = false;
    }
  }

  /**
   * Calls the API to fetch listings and filters them by query.
   * Uses cache if available and valid.
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async searchAPI(query) {
    const cacheKey = `search_${query.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    const headers = {
      "Content-Type": "application/json",
      "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
    };
    // Add auth header if authenticated
    if (window.isAuthenticated && window.isAuthenticated()) {
      const authHeader = window.getAuthHeader ? window.getAuthHeader() : {};
      if (authHeader.Authorization)
        headers["Authorization"] = authHeader.Authorization;
    }
    const response = await this.cachedFetch(
      `${API_BASE_URL}/auction/listings?_seller=true&_bids=true&limit=100&sort=created&sortOrder=desc`,
      { headers },
    );
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    const responseData = await response.json();
    const allListings = responseData.data || [];
    const results = this.filterListings(allListings, query);
    this.cache.set(cacheKey, { data: results, timestamp: Date.now() });
    return results;
  }

  /**
   * Filters listings by search query.
   * @param {Array} listings
   * @param {string} query
   * @returns {Array}
   */
  filterListings(listings, query) {
    if (!query || query.trim().length === 0) return listings;
    const searchTerm = query.toLowerCase().trim();
    const words = searchTerm.split(" ").filter((word) => word.length > 0);
    return listings.filter((listing) => {
      const searchableText = [
        listing.title || "",
        listing.description || "",
        listing.seller?.name || "",
        ...(listing.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      return words.every((word) => searchableText.includes(word));
    });
  }

  /**
   * Sorts listings by the selected sort type.
   * @param {Array} listings
   * @param {string} sortBy
   * @returns {Array}
   */
  sortListings(listings, sortBy) {
    let sorted = [...listings];
    const now = new Date();
    switch (sortBy) {
      case "newest": {
        // Active auctions first, then ended, both sorted by created date desc
        const active = sorted.filter((l) => new Date(l.endsAt) > now);
        const ended = sorted.filter((l) => new Date(l.endsAt) <= now);
        const sortedActive = active.sort(
          (a, b) => new Date(b.created) - new Date(a.created),
        );
        const sortedEnded = ended.sort(
          (a, b) => new Date(b.created) - new Date(a.created),
        );
        return [...sortedActive, ...sortedEnded];
      }
      case "oldest":
        return sorted.sort((a, b) => new Date(a.created) - new Date(b.created));
      case "won-auctions": {
        // Only ended auctions with bids
        const won = sorted.filter(
          (l) => new Date(l.endsAt) <= now && (l._count?.bids || 0) > 0,
        );
        return won.sort((a, b) => new Date(b.endsAt) - new Date(a.endsAt));
      }
      case "relevance":
      default:
        return sorted;
    }
  }

  /**
   * Applies sorting to current search results.
   */
  applySorting() {
    const headerSearch = document.getElementById("header-search");
    const currentQuery = headerSearch ? headerSearch.value.trim() : "";
    this.performSearch(currentQuery);
  }

  /**
   * Dispatches a custom event with search results.
   * @param {string} query
   * @param {Array} results
   * @param {?string} error
   */
  dispatchSearchEvent(query, results, error = null) {
    const searchEvent = new CustomEvent("searchPerformed", {
      detail: {
        query: query.trim(),
        results: results,
        error: error,
        timestamp: Date.now(),
        sortBy: this.currentSort,
      },
    });
    window.dispatchEvent(searchEvent);
  }

  /**
   * Clears the search input and results.
   */
  clearSearch() {
    const headerSearch = document.getElementById("header-search");
    const mobileSearch = document.getElementById("mobile-search");
    const clearButton = document.getElementById("clear-search");
    if (headerSearch) headerSearch.value = "";
    if (mobileSearch) mobileSearch.value = "";
    if (clearButton) clearButton.classList.add("hidden");
    this.hideAllDropdowns();
    this.performSearch("");
  }

  /**
   * Clears the search results cache.
   */
  clearCache() {
    this.cache.clear();
  }
}

export const searchAndSortComponent = new SearchAndSortComponent();
