/**
 * Search and Sort Component
 * Handles search functionality and sorting for listings
 */
import { config } from "../services/config.js"; // Import the config object
import { API_BASE_URL } from "../services/baseApi.js"; // Add this import

export class SearchAndSortComponent {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.searchTimeout = null;
    this.isSearching = false;
    this.currentSort = "newest"; // Default sort
    this.dropdownVisible = false;
  }

  /**
   * Initialize search and sort functionality
   */
  init() {
    this.setupSearchListeners();
    this.setupSortListeners();
    this.createDropdownContainers();
    this.setupDocumentClickListener();
  }

  /**
   * Create dropdown containers for search results
   */
  createDropdownContainers() {
    // Create dropdown for header search
    const headerSearch = document.getElementById("header-search");
    if (headerSearch) {
      this.createDropdown(headerSearch, "header-search-dropdown");
    }

    // Create dropdown for mobile search
    const mobileSearch = document.getElementById("mobile-search");
    if (mobileSearch) {
      this.createDropdown(mobileSearch, "mobile-search-dropdown");
    }
  }

  /**
   * Create a dropdown container for a search input
   */
  createDropdown(searchInput, dropdownId) {
    // Check if dropdown already exists
    if (document.getElementById(dropdownId)) {
      return;
    }

    const dropdown = document.createElement("div");
    dropdown.id = dropdownId;

    // Common dropdown styling
    dropdown.className =
      "absolute bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-[60] hidden max-h-80 overflow-y-auto w-full";

    // Position the dropdown directly under the search input
    const searchContainer = searchInput.parentElement;
    searchContainer.style.position = "relative";
    dropdown.style.top = `${searchInput.offsetHeight + 4}px`; // Add 4px spacing below the input
    searchContainer.appendChild(dropdown);
  }

  /**
   * Setup document click listener to close dropdowns
   */
  setupDocumentClickListener() {
    document.addEventListener("click", (e) => {
      // Check if click is outside search containers
      const headerContainer =
        document.getElementById("header-search")?.parentElement;
      const mobileContainer =
        document.getElementById("mobile-search")?.parentElement;

      if (headerContainer && !headerContainer.contains(e.target)) {
        this.hideDropdown("header-search-dropdown");
      }
      if (mobileContainer && !mobileContainer.contains(e.target)) {
        this.hideDropdown("mobile-search-dropdown");
      }
    });
  }

  /**
   * Setup search event listeners
   */
  setupSearchListeners() {
    const headerSearch = document.getElementById("header-search");
    const mobileSearch = document.getElementById("mobile-search");
    const clearSearch = document.getElementById("clear-search");

    // Setup desktop search
    if (headerSearch) {
      this.setupSearchInput(headerSearch, clearSearch);
    }

    // Setup mobile search
    if (mobileSearch) {
      this.setupSearchInput(mobileSearch, null);
    }

    // Clear search functionality
    if (clearSearch) {
      clearSearch.addEventListener("click", (e) => {
        e.preventDefault();
        this.clearSearch();
      });
    }
  }

  /**
   * Setup sort event listeners for buttons
   */
  setupSortListeners() {
    // Handle sort buttons
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

    // Also handle dropdown if it exists
    const sortSelect = document.getElementById("sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        this.currentSort = e.target.value;
        this.applySorting();
      });
    }
  }

  /**
   * Set the current sort type
   */
  setSortType(sortType) {
    const sortMapping = {
      newest: "newest",
      oldest: "oldest",
      "most-bids": "most-bids",
      "active-auctions": "active-auctions", // Changed from "shortest-time": "ending-soon"
    };

    this.currentSort = sortMapping[sortType] || sortType;
  }

  /**
   * Filter active auctions (auctions that haven't ended)
   */
  filterActiveAuctions(listings) {
    const now = new Date();
    return listings.filter((listing) => {
      const endDate = new Date(listing.endsAt);
      return endDate > now; // Only include auctions that haven't ended
    });
  }

  /**
   * Update sort button styles to show active state
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
    activeButton.classList.add("bg-pink-500", "text-white");
  }

  /**
   * Setup individual search input
   */
  setupSearchInput(searchInput, clearButton) {
    // Real-time search with debouncing
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.trim();

      // Show/hide clear button for header search
      if (clearButton && searchInput.id === "header-search") {
        if (query.length > 0) {
          clearButton.classList.remove("hidden");
        } else {
          clearButton.classList.add("hidden");
        }
      }

      // Sync search inputs
      this.syncSearchInputs(query, searchInput);

      // Show dropdown and perform search for dropdown
      if (query.length > 0) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          this.performDropdownSearch(query, searchInput);
        }, 300);
      } else {
        this.hideAllDropdowns();
        // Still perform main search for empty query (shows all results)
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          this.performSearch(query);
        }, 300);
      }
    });

    // Search on Enter key
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const query = e.target.value.trim();

        if (query.length > 0) {
          // Navigate to listings page with search
          window.location.href = `/listings.html?search=${encodeURIComponent(query)}`;
        } else {
          clearTimeout(this.searchTimeout);
          this.performSearch(query);
        }
      }
    });

    // Simple focus handling - no expansion behavior for header search
    if (searchInput.id === "header-search") {
      searchInput.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!searchInput.matches(":focus")) {
          searchInput.focus();
        }
      });
    }
  }

  /**
   * Perform search for dropdown results
   */
  async performDropdownSearch(query, searchInput) {
    try {
      const results = await this.searchAPI(query);
      const sortedResults = this.sortListings(results, "newest");
      const limitedResults = sortedResults.slice(0, 3); // Show only 5 results

      this.showDropdown(searchInput, query, limitedResults, results.length);
    } catch (error) {
      // Handle error silently or show user-friendly message
    }
  }

  /**
   * Show dropdown with search results
   */
  showDropdown(searchInput, query, results, totalCount) {
    const dropdownId =
      searchInput.id === "header-search"
        ? "header-search-dropdown"
        : "mobile-search-dropdown";
    const dropdown = document.getElementById(dropdownId);

    if (!dropdown) return;

    // Update position for fixed positioned dropdowns
    if (dropdown._updatePosition) {
      dropdown._updatePosition();
    }

    if (results.length === 0) {
      dropdown.innerHTML = `
        <div class="p-4 text-center text-gray-500 dark:text-gray-400">
          No results found for "${query}"
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

  /**
   * Create a dropdown item for a listing
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

  /**
   * Hide dropdown
   */
  hideDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
      dropdown.classList.add("hidden");
    }
    this.dropdownVisible = false;
  }

  /**
   * Hide all dropdowns
   */
  hideAllDropdowns() {
    this.hideDropdown("header-search-dropdown");
    this.hideDropdown("mobile-search-dropdown");
  }

  /**
   * Sync search inputs between desktop and mobile
   */
  syncSearchInputs(query, excludeInput) {
    const headerSearch = document.getElementById("header-search");
    const mobileSearch = document.getElementById("mobile-search");

    if (
      headerSearch &&
      headerSearch !== excludeInput &&
      headerSearch.value !== query
    ) {
      headerSearch.value = query;
    }
    if (
      mobileSearch &&
      mobileSearch !== excludeInput &&
      mobileSearch.value !== query
    ) {
      mobileSearch.value = query;
    }
  }

  /**
   * Perform search operation (for main search functionality)
   */
  async performSearch(query) {
    if (this.isSearching) {
      return;
    }

    this.isSearching = true;

    try {
      let results = [];
      if (query.trim() === "") {
        results = await this.searchAPI("");
      } else {
        results = await this.searchAPI(query);
      }

      // Apply sorting (this will also filter active auctions if needed)
      results = this.sortListings(results, this.currentSort);

      // Add special messaging for active auctions
      if (this.currentSort === "active-auctions" && results.length === 0) {
        // Handle no active auctions case
      }

      this.dispatchSearchEvent(query, results);
    } catch (error) {
      this.dispatchSearchEvent(query, [], error.message);
    } finally {
      this.isSearching = false;
    }
  }

  /**
   * Search via API
   */
  async searchAPI(query) {
    const cacheKey = `search_${query.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);

    // Return cached results if available and not expired
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const headers = {
        "Content-Type": "application/json",
        "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
      };

      // Add auth header if available
      if (window.isAuthenticated && window.isAuthenticated()) {
        const authHeader = window.getAuthHeader ? window.getAuthHeader() : {};
        if (authHeader.Authorization) {
          headers["Authorization"] = authHeader.Authorization;
        }
      }

      const response = await fetch(
        `${API_BASE_URL}/auction/listings?_seller=true&_bids=true&limit=100&sort=created&sortOrder=desc`, // Use API_BASE_URL instead of API_BASE
        { headers },
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const responseData = await response.json();
      const allListings = responseData.data || [];

      // Filter locally for more comprehensive search
      const results = this.filterListings(allListings, query);

      // Cache the results
      this.cache.set(cacheKey, {
        data: results,
        timestamp: Date.now(),
      });

      return results;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Filter listings locally by query
   */
  filterListings(listings, query) {
    if (!query || query.trim().length === 0) {
      return listings;
    }

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
   * Sort listings based on criteria
   */
  sortListings(listings, sortBy) {
    let sorted = [...listings]; // Create a copy to avoid mutating original

    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => new Date(b.created) - new Date(a.created));

      case "oldest":
        return sorted.sort((a, b) => new Date(a.created) - new Date(b.created));

      case "active-auctions":
        // First filter to only active auctions, then sort by ending soon
        const activeAuctions = this.filterActiveAuctions(sorted);
        return activeAuctions.sort(
          (a, b) => new Date(a.endsAt) - new Date(b.endsAt),
        );

      case "most-bids":
        return sorted.sort(
          (a, b) => (b._count?.bids || 0) - (a._count?.bids || 0),
        );

      case "title-az":
        return sorted.sort((a, b) =>
          (a.title || "").localeCompare(b.title || ""),
        );

      case "title-za":
        return sorted.sort((a, b) =>
          (b.title || "").localeCompare(a.title || ""),
        );

      default:
        return sorted.sort((a, b) => new Date(b.created) - new Date(a.created));
    }
  }

  /**
   * Apply sorting to current results
   */
  applySorting() {
    // Get current search query
    const headerSearch = document.getElementById("header-search");
    const currentQuery = headerSearch ? headerSearch.value.trim() : "";

    // Re-perform search with new sorting
    this.performSearch(currentQuery);
  }

  /**
   * Dispatch search event for pages to handle
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
   * Clear search
   */
  clearSearch() {
    const headerSearch = document.getElementById("header-search");
    const mobileSearch = document.getElementById("mobile-search");
    const clearButton = document.getElementById("clear-search");

    if (headerSearch) {
      headerSearch.value = "";
    }
    if (mobileSearch) {
      mobileSearch.value = "";
    }
    if (clearButton) {
      clearButton.classList.add("hidden");
    }

    this.hideAllDropdowns();
    this.performSearch("");
  }

  /**
   * Clear search cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Create and export singleton instance
export const searchAndSortComponent = new SearchAndSortComponent();
