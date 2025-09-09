/**
 * FAQ Page Controller
 * Manages FAQ search functionality and interactive question/answer display
 * Handles filtering, animations, and user interactions
 */
class FAQController {
  constructor() {
    this.categoryButtons = document.querySelectorAll(".category-btn");
    this.faqItems = document.querySelectorAll(".faq-item");
    this.faqContainer = document.getElementById("faq-container");
    this.noResults = document.getElementById("no-results");

    this.currentCategory = "all";

    this.init();
  }

  /**
   * Initializes FAQ search functionality
   * Sets up event listener for real-time search filtering
   */
  init() {
    this.setupEventListeners();
    this.setupFAQToggles();
  }

  setupEventListeners() {
    // Category filtering
    this.categoryButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        this.currentCategory = e.target.dataset.category;
        this.updateActiveCategory(e.target);
        this.filterFAQs();
      });
    });
  }

  setupFAQToggles() {
    this.faqItems.forEach((item) => {
      const question = item.querySelector(".faq-question");
      const answer = item.querySelector(".faq-answer");
      const icon = item.querySelector(".faq-icon");

      question.addEventListener("click", () => {
        const isOpen = !answer.classList.contains("hidden");

        if (isOpen) {
          // Close
          answer.classList.add("hidden");
          icon.style.transform = "rotate(0deg)";
          item.classList.remove("ring-2", "ring-pink-500");
        } else {
          // Open
          answer.classList.remove("hidden");
          icon.style.transform = "rotate(180deg)";
          item.classList.add("ring-2", "ring-pink-500");
        }
      });
    });
  }

  updateActiveCategory(activeButton) {
    this.categoryButtons.forEach((button) => {
      button.classList.remove("active", "bg-pink-500", "text-white");
      button.classList.add(
        "bg-gray-200",
        "dark:bg-gray-700",
        "text-gray-700",
        "dark:text-gray-300",
      );
    });

    activeButton.classList.add("active", "bg-pink-500", "text-black");
    activeButton.classList.remove(
      "bg-gray-200",
      "dark:bg-gray-700",
      "text-gray-700",
      "dark:text-gray-300",
    );
  }

  filterFAQs() {
    let visibleCount = 0;

    this.faqItems.forEach((item) => {
      const category = item.dataset.category;

      const matchesCategory =
        this.currentCategory === "all" || category === this.currentCategory;

      if (matchesCategory) {
        item.style.display = "block";
        visibleCount++;

        // Add subtle animation
        item.style.opacity = "0";
        item.style.transform = "translateY(10px)";

        setTimeout(() => {
          item.style.opacity = "1";
          item.style.transform = "translateY(0)";
          item.style.transition = "all 0.3s ease";
        }, visibleCount * 50);
      } else {
        item.style.display = "none";
      }
    });

    // Show/hide no results message and FAQ container
    if (visibleItems === 0 && searchTerm !== "") {
      this.noResults.classList.remove("hidden");
      this.faqContainer.classList.add("hidden");
    } else {
      this.noResults.classList.add("hidden");
      this.faqContainer.classList.remove("hidden");
    }
  }
}

/**
 * Animation Utilities
 * Provides smooth animations for FAQ interactions
 */
class AnimationUtils {
  /**
   * Smooth fade-in animation for elements
   * @param {HTMLElement} element - Element to animate
   * @param {number} duration - Animation duration in milliseconds
   */
  static fadeIn(element, duration = 300) {
    element.style.opacity = "0";
    element.style.display = "block";

    let start = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);

      element.style.opacity = progress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }

  /**
   * Smooth slide-down animation with easing
   * @param {HTMLElement} element - Element to animate
   * @param {number} duration - Animation duration in milliseconds
   */
  static slideDown(element, duration = 300) {
    const startHeight = 0;
    const endHeight = element.scrollHeight;

    element.style.height = startHeight + "px";
    element.style.overflow = "hidden";
    element.style.display = "block";

    let start = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);

      const easeInOut =
        progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;

      element.style.height =
        startHeight + (endHeight - startHeight) * easeInOut + "px";

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.height = "auto";
        element.style.overflow = "visible";
      }
    }

    requestAnimationFrame(animate);
  }
}

/**
 * Enhanced FAQ Interactions
 * Adds keyboard navigation, scroll-to-top, and sharing functionality
 */
class FAQEnhancements {
  /**
   * Adds keyboard shortcuts for better accessibility
   * "/" key focuses search, "Escape" clears search
   */
  static addKeyboardNavigation() {
    document.addEventListener("keydown", (e) => {
      // Focus search with "/" key
      if (e.key === "/") {
        e.preventDefault();
        document.getElementById("faq-search").focus();
      }

      // Clear search with "Escape" key
      if (e.key === "Escape") {
        document.getElementById("faq-search").blur();
        document.getElementById("faq-search").value = "";
        document.dispatchEvent(
          new Event("input", { target: document.getElementById("faq-search") }),
        );
      }
    });
  }

  /**
   * Adds scroll-to-top button that appears on scroll
   * Provides smooth scrolling back to top of page
   */
  static addScrollToTop() {
    const scrollButton = document.createElement("button");
    scrollButton.innerHTML = `
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
      </svg>
    `;
    scrollButton.className =
      "fixed bottom-8 right-8 bg-pink-500 hover:bg-pink-600 text-black p-3 rounded-full shadow-lg transition-all duration-300 opacity-0 invisible";
    scrollButton.setAttribute("aria-label", "Scroll to top");

    document.body.appendChild(scrollButton);

    // Show/hide button based on scroll position
    window.addEventListener("scroll", () => {
      if (window.scrollY > 500) {
        scrollButton.classList.remove("opacity-0", "invisible");
      } else {
        scrollButton.classList.add("opacity-0", "invisible");
      }
    });

    // Smooth scroll to top on click
    scrollButton.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /**
   * Adds sharing functionality for FAQ items
   * Allows users to share specific FAQ links via right-click
   */
  static addShareFunctionality() {
    document.querySelectorAll(".faq-question").forEach((question) => {
      question.addEventListener("contextmenu", (e) => {
        e.preventDefault();

        const faqItem = question.closest(".faq-item");
        const questionText = question.querySelector("span").textContent;
        const url = `${window.location.href}#${encodeURIComponent(questionText)}`;

        // Use native sharing API if available
        if (navigator.share) {
          navigator.share({
            title: questionText,
            url: url,
          });
        } else if (navigator.clipboard) {
          // Fallback to clipboard copy
          navigator.clipboard.writeText(url).then(() => {
            // Show temporary success tooltip
            const tooltip = document.createElement("div");
            tooltip.textContent = "Link copied!";
            tooltip.className =
              "absolute bg-gray-800 text-white px-2 py-1 rounded text-sm z-50";
            tooltip.style.top = e.pageY + "px";
            tooltip.style.left = e.pageX + "px";

            document.body.appendChild(tooltip);

            setTimeout(() => {
              tooltip.remove();
            }, 2000);
          });
        }
      });
    });
  }
}

// Initialize FAQ functionality when page loads
document.addEventListener("DOMContentLoaded", () => {
  // Initialize main FAQ controller
  const faqController = new FAQController();

  // Add enhanced features
  FAQEnhancements.addKeyboardNavigation();
  FAQEnhancements.addScrollToTop();
  FAQEnhancements.addShareFunctionality();

  // Add helpful keyboard shortcut hint
  const searchInput = document.getElementById("faq-search");
  searchInput.setAttribute("placeholder", "Search FAQs... (Press / to focus)");

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
});

export { FAQController, AnimationUtils, FAQEnhancements };
