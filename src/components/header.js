import {
  isAuthenticated,
  getCurrentUser,
  logoutUser,
  getUserProfile,
} from "../library/auth.js";
import { searchAndSortComponent } from "./searchAndSort.js";
import { updateBackgroundColor } from "../services/themeService.js";
import logoImage from "/assets/images/logo.png";

/**
 * Stores the current user's credits to avoid repeated API calls.
 * @type {number|null}
 */
export let userCredits = null;

/**
 * Updates the credits display in both desktop and mobile navigation.
 * Fetches current user profile and updates all credit display elements.
 * Hides credits if unauthenticated or on error.
 * @returns {Promise<void>}
 */
async function updateCreditsDisplay() {
  const creditsElements = document.querySelectorAll("#user-credits");
  if (!creditsElements.length) return;

  if (isAuthenticated()) {
    const currentUser = getCurrentUser();
    if (currentUser) {
      try {
        const profile = await getUserProfile(currentUser.name);
        if (profile && typeof profile.credits === "number") {
          userCredits = profile.credits;
          creditsElements.forEach((element) => {
            element.textContent = `${profile.credits} credits`;
            element.classList.remove("hidden");
          });
        }
        // eslint-disable-next-line no-unused-vars
      } catch (_error) {
        // Silently handle credit fetch errors to avoid disrupting user experience
        creditsElements.forEach((element) => {
          element.classList.add("hidden");
        });
      }
    }
  } else {
    creditsElements.forEach((element) => {
      element.classList.add("hidden");
    });
  }
}

/**
 * Updates user credits display from external components.
 * @returns {Promise<void>}
 */
export async function updateUserCredits() {
  await updateCreditsDisplay();
}

/**
 * Renders the complete header navigation HTML.
 * Responsive design: separate mobile and desktop layouts.
 * Shows different content based on authentication status.
 * @returns {string} Header HTML markup
 */
function renderHeader() {
  const authenticated = isAuthenticated();
  const currentUser = authenticated ? getCurrentUser() : null;
  const currentPath = window.location.pathname;

  // HTML markup for header navigation
  return `
    <nav class="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-300 dark:border-gray-700">
      <div class="mx-2 px-4">
        <div class="flex justify-between items-center py-4">
          <!-- Logo and Brand Section -->
          <div class="flex items-center space-x-6">
            <div class="flex items-center space-x-3">
              <a href="/index.html" class="flex items-center space-x-2 hover:scale-105 transition-transform duration-300 ease-in-out group ${
                currentPath === "/index.html"
                  ? "font-bold text-pink-600 dark:text-gray-100"
                  : ""
              }">
                <img src="${logoImage}" alt="Pink Gavel Auctions Logo" class="h-14 w-14 group-hover:rotate-3 transition-transform duration-300">
                <span class="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:to-pink-500 transition-all duration-300">Pink Gavel Auctions</span>
              </a>
            </div>

            <!-- Desktop Navigation Links -->
            <div class="hidden lg:flex items-center space-x-6">
              <a href="/listings.html" class="text-lg text-gray-700 dark:text-gray-100 hover:text-pink-600 dark:hover:text-pink-400 hover:scale-105 transition-all duration-300 ${
                currentPath === "/listings.html"
                  ? "font-bold underline underline-2 text-pink-600 dark:text-gray-100 dark:decoration-gray-100 decoration-pink-600"
                  : ""
              }">Auctions</a>
            </div>
          </div>

          <!-- Desktop Right Side: Search, User Info, Dark Mode Toggle -->
          <div class="hidden lg:flex items-center space-x-4">
            <!-- Search Input -->
            <div class="ml-5 relative">
              <label for="header-search" class="sr-only">Search Site</label>
              <input
                type="text"
                id="header-search"
                name="search"
                placeholder="Search..."
                class="px-4 py-2 pr-10 w-40 md:w-64 border border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-pink-500"
                aria-label="Search Site"
                autocomplete="off"
              >
            </div>

            ${
              authenticated
                ? `
              <!-- Authenticated User Section -->
              <div class="flex items-center space-x-4">
                <span class="text-gray-700 dark:text-gray-200 text-md">
                  Hello, <a href="/profile.html" class="text-pink-800 dark:text-pink-300 font-bold hover:underline hover:scale-105 transition-all duration-300 ${
                    currentPath === "/profile.html" ? "underline" : ""
                  }">${currentUser.name}</a>
                </span>
                <!-- User Credits Display -->
                <div id="user-credits" class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Loading...
                </div>
                <button id="logout-btn" class="text-center py-1 px-4 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold shadow-md hover:from-purple-700 hover:to-pink-700 hover:scale-105 transition-all duration-200">
                  Logout
                </button>
              </div>
            `
                : `
              <!-- Unauthenticated User Section -->
              <a href="/login.html" class="text-gray-700 dark:text-gray-100 hover:text-pink-600 dark:hover:text-pink-400 hover:scale-105 transition-all duration-300 ${
                currentPath === "/login.html" ? "font-bold text-pink-600" : ""
              }">Login</a>
              <a href="/register.html" class="text-center py-1 px-4 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold shadow-md hover:from-purple-700 hover:to-pink-700 hover:scale-105 transition-all duration-200 ${
                currentPath === "/register.html" ? "ring-2 ring-pink-300" : ""
              }">Register</a>
            `
            }

            <!-- Dark Mode Toggle Button -->
            <button
              id="desktop-dark-mode-toggle"
              class="p-2 rounded-full bg-gray-300 dark:bg-gray-700 text-black dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path class="hidden dark:block" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                <path class="dark:hidden" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
          </div>

          <!-- Mobile Menu Button -->
          <div class="flex items-center space-x-4 lg:hidden">
            <button
              id="mobile-menu-btn"
              class="p-2 rounded-lg text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Open mobile navigation menu"
              aria-expanded="false"
              aria-controls="mobile-menu"
            >
              <svg id="hamburger-icon" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
              <svg id="close-icon" class="w-6 h-6 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Menu Content (Hidden by default) -->
        <div id="mobile-menu" class="hidden lg:hidden py-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex flex-col space-y-3">
            <!-- Mobile Search -->
            <div class="relative mb-3">
              <label for="mobile-search" class="sr-only">Search Site</label>
              <input
                type="text"
                id="mobile-search"
                placeholder="Search...."
                class="px-4 py-2 pr-10 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-pink-500"
                aria-label="Search Site"
              >
            </div>

            <!-- Mobile User Info and Controls -->
            <div class="flex justify-center items-center space-x-4">
              ${
                authenticated
                  ? `
                <span class="text-gray-800 dark:text-gray-200 text-lg font-semibold">
                  Hello, <a href="/profile.html" class="text-pink-500 hover:underline hover:scale-105 transition-all duration-300 ${
                    currentPath === "/profile.html" ? "underline" : ""
                  }">${currentUser.name}</a>
                </span>
                <div id="user-credits" class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-white px-3 py-1 rounded-full text-md font-semibold">
                  Loading...
                </div>
                `
                  : ""
              }

              <!-- Mobile Dark Mode Toggle -->
              <button
                id="mobile-dark-mode-toggle"
                class="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle dark mode"
              >
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path class="hidden dark:block" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  <path class="dark:hidden" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>
            </div>

            <!-- Mobile Navigation Links -->
            <a href="/listings.html" class="text-gray-700 dark:text-gray-100 hover:text-pink-600 dark:hover:text-pink-400 hover:scale-105 transition-all duration-300 ${
              currentPath === "/listings.html"
                ? "font-bold underline text-pink-600"
                : ""
            }">Auctions</a>

            ${
              authenticated
                ? `
              <!-- Authenticated Mobile Links -->
              <a href="/profile.html" class="text-lg text-gray-700 dark:text-gray-100 hover:text-pink-600 dark:hover:text-pink-400 hover:scale-105 transition-all duration-300 ${
                currentPath === "/profile.html"
                  ? "font-bold underline underline-2 text-pink-600 dark:text-gray-100 dark:decoration-gray-100 decoration-pink-600"
                  : ""
              }">Profile</a>
              <button id="mobile-logout-btn" class="text-center py-1 px-4 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold shadow-md hover:from-purple-700 hover:to-pink-700 hover:scale-105 transition-all duration-200">
                Logout
              </button>
            `
                : `
              <!-- Unauthenticated Mobile Links -->
              <div class="flex flex-col space-y-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <a href="/login.html" class="text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 hover:scale-105 transition-all duration-300 py-2 ${
                  currentPath === "/login.html" ? "font-bold text-pink-600" : ""
                }">Login</a>
                <a href="/register.html" class="bg-pink-500 hover:bg-pink-600 hover:scale-105 text-white px-4 py-2 rounded-lg transition-all duration-300 text-center ${
                  currentPath === "/register.html" ? "ring-2 ring-pink-300" : ""
                }">Register</a>
              </div>
            `
            }
          </div>
        </div>
      </div>
    </nav>
  `;
}

/**
 * Sets up all event listeners for header functionality
 * Includes mobile menu toggle, search functionality, logout, and external component initialization
 */
function setupEventListeners() {
  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isHidden = mobileMenu.classList.contains("hidden");
      mobileMenu.classList.toggle("hidden");
      mobileMenuBtn.setAttribute("aria-expanded", isHidden ? "true" : "false");
      // Toggle hamburger/close icons
      const hamburgerIcon = document.getElementById("hamburger-icon");
      const closeIcon = document.getElementById("close-icon");
      if (hamburgerIcon && closeIcon) {
        if (isHidden) {
          hamburgerIcon.classList.add("hidden");
          closeIcon.classList.remove("hidden");
          mobileMenuBtn.setAttribute(
            "aria-label",
            "Close mobile navigation menu",
          );
        } else {
          hamburgerIcon.classList.remove("hidden");
          closeIcon.classList.add("hidden");
          mobileMenuBtn.setAttribute(
            "aria-label",
            "Open mobile navigation menu",
          );
        }
      }
      // Update credits display when mobile menu opens
      if (!mobileMenu.classList.contains("hidden")) {
        await updateCreditsDisplay();
      }
    });
  }

  // Desktop search
  const headerSearch = document.getElementById("header-search");
  if (headerSearch) {
    headerSearch.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const query = headerSearch.value.trim();
        if (query.length > 0) {
          window.location.href = `/listings.html?search=${encodeURIComponent(query)}`;
        }
      }
    });
  }

  // Mobile search
  const mobileSearch = document.getElementById("mobile-search");
  if (mobileSearch) {
    mobileSearch.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const query = mobileSearch.value.trim();
        if (query.length > 0) {
          window.location.href = `/listings.html?search=${encodeURIComponent(query)}`;
        }
      }
    });
  }

  // Desktop logout
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logoutUser();
    });
  }

  // Mobile logout
  const mobileLogoutBtn = document.getElementById("mobile-logout-btn");
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logoutUser();
    });
  }

  // Dark mode toggle buttons
  const desktopDarkToggle = document.getElementById("desktop-dark-mode-toggle");
  const mobileDarkToggle = document.getElementById("mobile-dark-mode-toggle");

  if (desktopDarkToggle) {
    desktopDarkToggle.addEventListener("click", () => {
      if (window.toggleDarkMode) {
        window.toggleDarkMode();
      } else {
        // Fallback if theme service hasn't initialized yet
        import("./darkLight.js").then(({ toggleDarkMode }) => {
          toggleDarkMode();
          updateBackgroundColor();
        });
      }
    });
  }

  if (mobileDarkToggle) {
    mobileDarkToggle.addEventListener("click", () => {
      if (window.toggleDarkMode) {
        window.toggleDarkMode();
      } else {
        // Fallback if theme service hasn't initialized yet
        import("./darkLight.js").then(({ toggleDarkMode }) => {
          toggleDarkMode();
          updateBackgroundColor();
        });
      }
    });
  }

  // Initialize search and sort component if available
  try {
    searchAndSortComponent.init();
  } catch (error) {
    // Search and sort component not available - continue without it
    console.warn("Search and sort component initialization failed:", error);
  }
}

/**
 * Cleanup function to remove event listeners
 */
function cleanupEventListeners() {
  // Remove all event listeners by cloning the elements
  const headerElement = document.querySelector("header");
  if (headerElement) {
    const newHeader = headerElement.cloneNode(true);
    headerElement.parentNode.replaceChild(newHeader, headerElement);
  }
}

/**
 * Main initialization function for the header component.
 * Renders header HTML, sets up event listeners, and updates credits.
 */
export function initializeHeader() {
  const headerElement = document.querySelector("header");
  if (headerElement) {
    // Clean up existing listeners before reinitializing
    cleanupEventListeners();

    const newHeaderElement = document.querySelector("header");
    if (newHeaderElement) {
      newHeaderElement.innerHTML = renderHeader();
      setupEventListeners();
      clearSearchFields();
      // Update credits display for authenticated users
      if (isAuthenticated()) {
        updateCreditsDisplay();
      }
    }
  }
}

/**
 * Clears both desktop and mobile search input fields.
 * Prevents search terms from persisting across page loads.
 */
function clearSearchFields() {
  const headerSearch = document.getElementById("header-search");
  const mobileSearch = document.getElementById("mobile-search");
  if (headerSearch) headerSearch.value = "";
  if (mobileSearch) mobileSearch.value = "";
}

// Initialize header when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeHeader();
});

// Re-initialize header when authentication state changes in other tabs
window.addEventListener("storage", (e) => {
  if (e.key === "accessToken" || e.key === "user") {
    initializeHeader();
  }
});
