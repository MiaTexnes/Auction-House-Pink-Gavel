import {
  isAuthenticated,
  getCurrentUser,
  logoutUser,
  getUserProfile,
} from "../library/auth.js";
import { searchAndSortComponent } from "./searchAndSort.js";
import logoImage from "/assets/images/logo.png";

// Global variable to store current credits
let userCredits = null;

// Function to update credits display
async function updateCreditsDisplay() {
  const creditsElements = document.querySelectorAll("#user-credits"); // Select all instances of #user-credits
  if (!creditsElements.length) return;

  if (isAuthenticated()) {
    const currentUser = getCurrentUser();
    if (currentUser) {
      try {
        const profile = await getUserProfile(currentUser.name);
        if (profile && typeof profile.credits === "number") {
          userCredits = profile.credits;

          // Update all #user-credits elements
          creditsElements.forEach((element) => {
            element.textContent = `${profile.credits} credits`; // Display as plain text
            element.classList.remove("hidden");
          });
        }
      } catch (error) {
        // Hide all #user-credits elements on error
        creditsElements.forEach((element) => {
          element.classList.add("hidden");
        });
      }
    }
  } else {
    // Hide all #user-credits elements if not authenticated
    creditsElements.forEach((element) => {
      element.classList.add("hidden");
    });
  }
}

// Export this function so other modules can call it
export async function updateUserCredits() {
  await updateCreditsDisplay();
}

function renderHeader() {
  const authenticated = isAuthenticated();
  const currentUser = authenticated ? getCurrentUser() : null;

  // Get the current page URL
  const currentPath = window.location.pathname;

  return `
    <nav class="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-500 dark:border-gray-700">
      <div class="mx-2 px-4">
        <div class="flex justify-between items-center py-4">
          <!-- Left Side: Logo and Navigation -->
          <div class="flex items-center space-x-6">
            <!-- Logo -->
            <div class="flex items-center space-x-3">
              <a href="/index.html" class="flex items-center space-x-2 hover:scale-105 transition-transform duration-300 ease-in-out group">
                <img src="${logoImage}" alt="Pink Gavel Auctions" class="h-14 w-14 group-hover:rotate-3 transition-transform duration-300">
                <span class="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:to-pink-500 transition-all duration-300">Pink Gavel Auctions</span>
              </a>
            </div>

            <!-- Navigation Links -->
            <div class="hidden md:flex items-center space-x-6">
              <a href="/listings.html" class="text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 hover:scale-105 transition-all duration-300 ${
                currentPath === "/listings.html"
                  ? "font-bold text-pink-600"
                  : ""
              }">Auctions</a>
              ${
                authenticated
                  ? `
                
              `
                  : ""
              }
            </div>
          </div>

          <!-- Right Side Actions (Desktop View) -->
          <div class="hidden md:flex items-center space-x-4">
            <!-- Search Field -->
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
              <div class="flex items-center space-x-4">
                <span class="text-gray-700 dark:text-gray-300 text-md">
                  Hello, <a href="/profile.html" class="text-pink-500 font-bold hover:underline hover:scale-105 transition-all duration-300">${currentUser.name}</a>
                </span>
                <div id="user-credits" class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-semibold">
                  Loading...
                </div>
                <button id="logout-btn" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors">
                  Logout
                </button>
              </div>
            `
                : `
              <a href="/login.html" class="text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 hover:scale-105 transition-all duration-300 ${
                currentPath === "/login.html" ? "font-bold text-pink-600" : ""
              }">Login</a>
                <a href="/register.html" class="text-center py-1 px-4 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold shadow-md hover:from-purple-700 hover:to-pink-700 hover:scale-105 transition-all duration-200 ${
                  currentPath === "/register.html" ? "ring-2 ring-pink-300" : ""
                }">Register</a>
            `
            }
            <!-- Dark mode toggle always visible -->
            <button
              onclick="window.toggleDarkMode()"
              class="p-2 rounded-full bg-gray-300 dark:bg-gray-700 text-black dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path class="hidden dark:block" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                <path class="dark:hidden" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
          </div>

          <!-- Mobile Menu Button -->
          <div class="flex items-center space-x-4 md:hidden">
            <button
              id="mobile-menu-btn"
              class="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Open mobile navigation menu"
              aria-expanded="false"
              aria-controls="mobile-menu"
            >
              <!-- Hamburger icon (shown when menu is closed) -->
              <svg id="hamburger-icon" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
              <!-- X icon (shown when menu is open) -->
              <svg id="close-icon" class="w-6 h-6 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div id="mobile-menu" class="hidden md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
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

            <!-- Mobile Top Section: Hello, Credits, and Dark Mode -->
            <div class="flex justify-center items-center space-x-4">
              ${
                authenticated
                  ? `
                <span class="text-gray-800 dark:text-gray-300 text-lg font-semibold">
                  Hello, <a href="/profile.html" class="text-pink-500 hover:underline hover:scale-105 transition-all duration-300">${currentUser.name}</a>
                </span>
                <div id="user-credits" class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-md font-semibold">
                  Loading...
                </div>
                `
                  : ""
              }
              <!-- Dark mode toggle always visible in mobile menu -->
              <button
                onclick="window.toggleDarkMode()"
                class="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle dark mode"
              >
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path class="hidden dark:block" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  <path class="dark:hidden" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>
            </div>

            <a href="/index.html" class="text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 hover:scale-105 transition-all duration-300 py-2 ${
              currentPath === "/index.html" ? "font-bold text-pink-600" : ""
            }">Home</a>
            <a href="/listings.html" class="text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 hover:scale-105 transition-all duration-300 py-2 ${
              currentPath === "/listings.html" ? "font-bold text-pink-600" : ""
            }">Auctions</a>
            ${
              authenticated
                ? `

              <a href="/profile.html" class="text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 hover:scale-105 transition-all duration-300 py-2 ${
                currentPath === "/profile.html" ? "font-bold text-pink-600" : ""
              }">Profile</a>
              <button id="mobile-logout-btn" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors">
                Logout
              </button>
            `
                : `
              <div class="flex flex-col space-y-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <a href="/login.html" class="text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 hover:scale-105 transition-all duration-300 py-2 ${
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

      // Update aria-expanded attribute
      mobileMenuBtn.setAttribute("aria-expanded", isHidden ? "true" : "false");

      // Toggle between hamburger and X icons
      const hamburgerIcon = document.getElementById("hamburger-icon");
      const closeIcon = document.getElementById("close-icon");

      if (hamburgerIcon && closeIcon) {
        if (isHidden) {
          // Menu is being opened - show X icon
          hamburgerIcon.classList.add("hidden");
          closeIcon.classList.remove("hidden");
          mobileMenuBtn.setAttribute(
            "aria-label",
            "Close mobile navigation menu",
          );
        } else {
          // Menu is being closed - show hamburger icon
          hamburgerIcon.classList.remove("hidden");
          closeIcon.classList.add("hidden");
          mobileMenuBtn.setAttribute(
            "aria-label",
            "Open mobile navigation menu",
          );
        }
      }

      // Update credits display when the mobile menu is opened
      if (!mobileMenu.classList.contains("hidden")) {
        await updateCreditsDisplay();
      }
    });
  }

  // Header search button functionality
  const headerSearchBtn = document.getElementById("header-search-btn");
  if (headerSearchBtn) {
    headerSearchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const headerSearch = document.getElementById("header-search");
      if (headerSearch) {
        const query = headerSearch.value.trim();
        if (query.length > 0) {
          window.location.href = `/listings.html?search=${encodeURIComponent(query)}`;
        }
      }
    });
  }

  // Add Enter key functionality for header search
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

  // Add Enter key functionality for mobile search (no button needed)
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

  // Logout functionality
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logoutUser();
    });
  }

  // Mobile logout functionality
  const mobileLogoutBtn = document.getElementById("mobile-logout-btn");
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logoutUser();
    });
  }

  // Initialize search and sort component
  try {
    searchAndSortComponent.init();
  } catch (error) {
    // Component initialization failed, but don't log to console
  }
}

// Initialize header
export function initializeHeader() {
  const headerElement = document.querySelector("header");
  if (headerElement) {
    headerElement.innerHTML = renderHeader();

    // Setup event listeners immediately after rendering
    setupEventListeners();

    // Update credits display if user is logged in
    if (isAuthenticated()) {
      updateCreditsDisplay();
    }
  }
}

// Auto-initialize when the script loads
document.addEventListener("DOMContentLoaded", () => {
  initializeHeader();
});

// Listen for storage changes to update header when login state changes
window.addEventListener("storage", (e) => {
  if (e.key === "accessToken" || e.key === "user") {
    initializeHeader();
  }
});
