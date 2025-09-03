import "./css/style.css";
import { initDarkMode } from "./components/darkLight.js";
import { initializeHeader } from "./components/header.js";
import { initializeFooter } from "./components/footer.js";
import { createGradientButton } from "./components/buttons.js";
import { initializeInactivityTracking } from "./services/inactivityService.js";
import { initializeTheme } from "./services/themeService.js";
import { addFavicons } from "./services/faviconService.js";

// Initialize core functionality
initDarkMode();
initializeTheme();
initializeInactivityTracking();

// Function to initialize the page
function initializePage() {
  // Add favicons to the head
  addFavicons();

  // Initialize header and footer
  initializeHeader();
  initializeFooter();
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializePage);
