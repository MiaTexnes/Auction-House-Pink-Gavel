/**
 * Search and Sort Component
 * Handles search functionality and sorting for listings
 */
import { config } from "../services/config.js";
import { API_BASE_URL } from "../services/baseApi.js";
import {
  safeFetch,
  createDebouncedSearch,
  createCachedFetch,
} from "../utils/requestManager.js";

export class SearchAndSortComponent {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.searchTimeout = null;
    this.isSearching = false;
    this.currentSort = "relevance";
    this.dropdownVisible = false;
    this.cachedFetch = createCachedFetch(300000);

    this.debouncedSearch = createDebouncedSearch((query) => {
      this.performSearch(query);
    }, 500);
  }

  init() {
    this.setupSearchListeners();
    this.setupSortListeners();
    this.createDropdownContainers();
    this.setupDocumentClickListener();
  }

  createDropdownContainers() {
    const headerSearch = document.getElementById("header-search");
    if (headerSearch)
      this.createDropdown(headerSearch, "header-search-dropdown");
    const mobileSearch = document.getElementById("mobile-search");
    if (mobileSearch)
      this.createDropdown(mobileSearch, "mobile-search-dropdown");
  }

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

  setSortType(sortType) {
    const sortMapping = {
      newest: "newest",
      oldest: "oldest",
      "won-auctions": "won-auctions",
    };
    this.currentSort = sortMapping[sortType] || sortType;
  }

  filterActiveAuctions(listings) {
    const now = new Date();
    return listings.filter((listing) => new Date(listing.endsAt) > now);
  }

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

  setupSearchInput(searchInput, clearButton) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.trim();
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
    if (searchInput.id === "header-search") {
      searchInput.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!searchInput.matches(":focus")) searchInput.focus();
      });
    }
  }

  async performDropdownSearch(query, searchInput) {
    try {
      const results = await this.searchAPI(query);
      const sortedResults = this.sortListings(results, this.currentSort);
      const limitedResults = sortedResults.slice(0, 3);
      this.showDropdown(searchInput, query, limitedResults, results.length);
    } catch (error) {}
  }

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
              onclick="window.searchAndSortComponent.clearSearch();"
              class="w-full text-left px-2 py-2 text-sm text-pink-600 dark:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-center font-medium"
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
              onclick="window.location.href='/listings.html?search=${encodeURIComponent(query)}'"
              class="w-full text-left px-2 py-2 text-sm text-pink-600 dark:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-center font-medium"
            >
              View all ${totalCount} results →
            </button>
          </div>
        </div>
      `;
    }
    dropdown.classList.remove("hidden");
    this.dropdownVisible = true;
  }

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
        onclick="window.location.href='/item.html?id=${listing.id}'"
        class="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
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

  hideDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) dropdown.classList.add("hidden");
    this.dropdownVisible = false;
  }

  hideAllDropdowns() {
    this.hideDropdown("header-search-dropdown");
    this.hideDropdown("mobile-search-dropdown");
  }

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

  async searchAPI(query) {
    const cacheKey = `search_${query.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    try {
      const headers = {
        "Content-Type": "application/json",
        "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
      };
      if (window.isAuthenticated && window.isAuthenticated()) {
        const authHeader = window.getAuthHeader ? window.getAuthHeader() : {};
        if (authHeader.Authorization)
          headers["Authorization"] = authHeader.Authorization;
      }
      const response = await safeFetch(
        `${API_BASE_URL}/auction/listings?_seller=true&_bids=true&limit=100&sort=created&sortOrder=desc`,
        { headers },
      );
      if (!response.ok)
        throw new Error(`API request failed: ${response.status}`);
      const responseData = await response.json();
      const allListings = responseData.data || [];
      const results = this.filterListings(allListings, query);
      this.cache.set(cacheKey, { data: results, timestamp: Date.now() });
      return results;
    } catch (error) {
      throw error;
    }
  }

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

  sortListings(listings, sortBy) {
    let sorted = [...listings];
    const now = new Date();
    switch (sortBy) {
      case "newest": {
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

  applySorting() {
    const headerSearch = document.getElementById("header-search");
    const currentQuery = headerSearch ? headerSearch.value.trim() : "";
    this.performSearch(currentQuery);
  }

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

  clearCache() {
    this.cache.clear();
  }
}

export const searchAndSortComponent = new SearchAndSortComponent();
window.searchAndSortComponent = searchAndSortComponent;
