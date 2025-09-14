/**
 * @fileoverview Dark mode management utilities
 * Handles theme switching and persistence for the application
 * @author Pink Gavel Auctions Team
 * @version 1.0.0
 */

/**
 * Enables or disables dark mode and persists the user's choice in localStorage.
 * When enabled, adds the 'dark' class to the root HTML element and saves 'dark' in localStorage.
 * When disabled, removes the 'dark' class and saves 'light' in localStorage.
 * Throws an error if DOM manipulation fails.
 *
 * @param {boolean} enabled - If true, enables dark mode; if false, disables it.
 * @throws {Error} If DOM manipulation fails
 */
export function setDarkMode(enabled) {
  const html = document.documentElement;
  try {
    if (enabled) {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  } catch {
    // Handle DOM manipulation errors gracefully
    throw new Error("DOM error");
  }
}

/**
 * Toggles between light and dark mode for the site.
 * If currently in dark mode, switches to light mode, and vice versa.
 * Persists the new mode in localStorage.
 */
export function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.classList.contains("dark");
  setDarkMode(!isDark);
}

/**
 * Initializes dark mode on page load based on user preference or system setting.
 * If a theme is saved in localStorage, uses that. Otherwise, checks system color scheme.
 * Adds or removes the 'dark' class from the root HTML element accordingly.
 */
export function initDarkMode() {
  const html = document.documentElement;
  const savedTheme = localStorage.getItem("theme");

  // If they picked dark mode before, or if it's their first time and their computer is set to dark mode
  if (
    savedTheme === "dark" ||
    (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
}
