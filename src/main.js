import "./css/style.css";
import { initDarkMode } from "./components/darkLight.js";
import { initializeHeader } from "./components/header.js";
import { initializeFooter } from "./components/footer.js";
import { createGradientButton } from "./components/buttons.js";
import { initializeInactivityTracking } from "./services/inactivityService.js";
import { initializeTheme } from "./services/themeService.js";
import { addFavicons } from "./services/faviconService.js";

// Page-specific imports
import { CarouselComponent } from "./pages/index.js";
import { LoginController } from "./pages/login.js";
import { RegistrationController } from "./pages/register.js";
import { FAQController } from "./pages/faq.js";
import { initializeContactPage } from "./pages/contact.js";
import { ProfileController } from "./pages/profile.js";
import { ListingsPageController } from "./pages/listings.js";
import { ItemPageController } from "./pages/item.js";
import { SellerProfileController } from "./pages/sellerProfile.js";
import { ProfilesController } from "./pages/deleteLaterprofiles.js";

// Initialize core functionality
initDarkMode();
initializeTheme();
initializeInactivityTracking();

// Get current page name from URL
function getCurrentPage() {
  const path = window.location.pathname;
  const page = path.substring(path.lastIndexOf("/") + 1);
  return page || "index.html";
}

// Page-specific initialization
function initializePageSpecific() {
  const currentPage = getCurrentPage();

  switch (currentPage) {
    case "index.html":
    case "":
      // Initialize homepage
      initializeHomepage();
      break;

    case "login.html":
      // Initialize login page
      const loginController = new LoginController();
      loginController.init();
      break;

    case "register.html":
      // Initialize registration page
      const registrationController = new RegistrationController();
      registrationController.init();
      break;

    case "listings.html":
      // Initialize listings page
      const listingsController = new ListingsPageController();
      listingsController.init();
      break;

    case "item.html":
      // Initialize item page
      const itemController = new ItemPageController();
      itemController.init();
      break;

    case "profile.html":
      // Initialize profile page
      const profileController = new ProfileController();
      profileController.init();
      break;

    case "sellerProfile.html":
      // Initialize seller profile page
      const sellerProfileController = new SellerProfileController();
      sellerProfileController.init();
      break;

    case "faq.html":
      // Initialize FAQ page
      const faqController = new FAQController();
      faqController.init();

      // Add enhanced features
      FAQEnhancements.addKeyboardNavigation();
      FAQEnhancements.addScrollToTop();
      FAQEnhancements.addShareFunctionality();

      // Add helpful keyboard shortcut hint
      const searchInput = document.getElementById("faq-search");
      if (searchInput) {
        searchInput.setAttribute(
          "placeholder",
          "Search FAQs... (Press / to focus)",
        );
      }

      // Staggered animation for FAQ items on page load
      const faqItems = document.querySelectorAll(".faq-item");
      faqItems.forEach((item, index) => {
        item.style.opacity = "0";
        item.style.transform = "translateY(20px)";

        setTimeout(() => {
          item.style.opacity = "1";
          item.style.transform = "translateY(0)";
          item.style.transition = "all 0.4s ease";
        }, index * 100);
      });
      break;

    case "contact.html":
      // Initialize contact page
      initializeContactPage();
      break;

    case "profiles.html":
      // Initialize profiles page
      const profilesController = new ProfilesController();
      profilesController.init();
      break;

    default:
      // For pages that don't need specific initialization
      console.log(`No specific initialization for ${currentPage}`);
      break;
  }
}

// Homepage initialization function
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

  // Initialize homepage-specific functionality
  // This would include your AuthButtonRenderer and CarouselController logic
  // You'll need to extract these from your current index.js
}

// Main initialization function
function initializePage() {
  // Add favicons to the head
  addFavicons();

  // Initialize header and footer
  initializeHeader();
  initializeFooter();

  // Initialize page-specific functionality
  initializePageSpecific();
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializePage);
