import { toggleDarkMode as originalToggleDarkMode } from "../components/darkLight.js";
import { updateFaviconBackground } from "./faviconService.js";

function updateBackgroundColor() {
  const isDarkMode = document.documentElement.classList.contains("dark");
  const body = document.body;

  if (isDarkMode) {
    body.style.backgroundColor = "#1f2937"; // Dark gray background
    body.classList.add("dark:bg-gray-800");
    body.classList.remove("bg-white");
  } else {
    body.style.backgroundColor = "#ffffff"; // White background
    body.classList.add("bg-white");
    body.classList.remove("dark:bg-gray-800");
  }

  // Ensure favicon background remains white regardless of theme
  updateFaviconBackground();
}

function enhancedToggleDarkMode() {
  originalToggleDarkMode();
  updateBackgroundColor();
}

function initializeTheme() {
  updateBackgroundColor();
  // Global assignment required for HTML onclick handlers in header component
  window.toggleDarkMode = enhancedToggleDarkMode;
}

export { initializeTheme, updateBackgroundColor };
