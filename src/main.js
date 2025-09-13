import "./css/style.css";
import { initDarkMode } from "./components/darkLight.js";
import { initializeHeader } from "./components/header.js";
import { initializeFooter } from "./components/footer.js";
import { initializeInactivityTracking } from "./services/inactivityService.js";
import { initializeTheme } from "./services/themeService.js";
import { addFavicons } from "./services/faviconService.js";

// Page-specific imports
import { CarouselComponent } from "./components/carousel.js";
import { LoginController } from "./pages/login.js";
import { RegistrationController } from "./pages/register.js";
import { FAQController } from "./pages/faq.js";
import { initializeContactPage } from "./pages/contact.js";
import { ProfileController } from "./pages/profile.js";
import { ListingsPageController } from "./pages/listings.js";
import { ItemPageController } from "./pages/item.js";
import { SellerProfileController } from "./pages/sellerProfile.js";

// Initialize core functionality
initDarkMode();
initializeTheme();
initializeInactivityTracking();

// Page configuration mapping
const pageConfig = {
  "index.html": { handler: initializeHomepage },
  "": { handler: initializeHomepage },
  "login.html": { controller: LoginController },
  "register.html": { controller: RegistrationController },
  "listings.html": { controller: ListingsPageController },
  "item.html": { controller: ItemPageController },
  "profile.html": { controller: ProfileController },
  "sellerProfile.html": { controller: SellerProfileController },
  "contact.html": { handler: initializeContactPage },
  "faq.html": { controller: FAQController, enhancer: enhanceFAQPage },
};

// ...existing code...

// Get current page name from URL
const getCurrentPage = () => {
  const path = window.location.pathname;
  const filename = path.substring(path.lastIndexOf("/") + 1);

  // Handle root path and empty filename
  if (!filename || filename === "/" || path === "/") {
    return "index.html";
  }

  // Handle paths without extension
  if (!filename.includes(".")) {
    return "index.html";
  }

  return filename;
};

// FAQ page enhancements
function enhanceFAQPage() {
  if (typeof FAQEnhancements !== "undefined") {
    FAQEnhancements.addKeyboardNavigation();
    FAQEnhancements.addScrollToTop();
    FAQEnhancements.addShareFunctionality();
  }

  const searchInput = document.getElementById("faq-search");
  searchInput?.setAttribute("placeholder", "Search FAQs... (Press / to focus)");

  // Staggered animation for FAQ items
  document.querySelectorAll(".faq-item").forEach((item, index) => {
    Object.assign(item.style, { opacity: "0", transform: "translateY(20px)" });
    setTimeout(() => {
      Object.assign(item.style, {
        opacity: "1",
        transform: "translateY(0)",
        transition: "all 0.4s ease",
      });
    }, index * 100);
  });
}

// Homepage initialization
async function initializeHomepage() {
  const elements = {
    homeAuthButtons: document.getElementById("home-auth-buttons"),
    homeLoading: document.getElementById("home-loading"),
    homeError: document.getElementById("home-error"),
    listingsCarousel: document.getElementById("listings-carousel"),
    noListings: document.getElementById("no-listings"),
    mainContent: document.getElementById("main-content"),
  };

  if (!elements.mainContent) return;

  // Import dynamically to avoid circular dependencies
  try {
    const { PageInitializer } = await import("./pages/index.js");
    PageInitializer.init();
  } catch (error) {
    console.error("Failed to initialize homepage:", error);
    if (elements.homeError) {
      elements.homeError.classList.remove("hidden");
    }
    if (elements.homeLoading) {
      elements.homeLoading.classList.add("hidden");
    }
  }
}

// Page initialization
function initializePageSpecific() {
  const currentPage = getCurrentPage();
  const config = pageConfig[currentPage];

  if (!config) {
    // ...existing code...
    return;
  }

  try {
    if (config.controller) {
      const controller = new config.controller();
      controller.init();
    } else if (config.handler) {
      config.handler();
    }

    // Run any page enhancers
    config.enhancer?.();
  } catch (error) {
    console.error(`Failed to initialize ${currentPage}:`, error);
  }
}

// Main initialization
function initializePage() {
  addFavicons();
  initializeHeader();
  initializeFooter();
  initializePageSpecific();
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializePage);
