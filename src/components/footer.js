export function initializeFooter() {
  const footer = document.createElement("footer");
  footer.className = "relative mt-auto";

  footer.innerHTML = `
    <!-- Wave SVG -->
    <div class="relative">
      <svg class="w-full h-20 md:h-32" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="url(#waveGradient)" fill-opacity="1" d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,128C960,128,1056,192,1152,208C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#ec4899" />
            <stop offset="50%" stop-color="#a855f7" />
            <stop offset="100%" stop-color="#ec4899" />
          </linearGradient>
          <linearGradient id="waveGradientDark" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#1f2937" />
            <stop offset="50%" stop-color="#374151" />
            <stop offset="100%" stop-color="#1f2937" />
          </linearGradient>
        </defs>
      </svg>
    </div>

    <!-- Footer Content -->
    <div class="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 -mt-1">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        <!-- Main Footer Content -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">

          <!-- Brand Section -->
          <div class="col-span-2 md:col-span-1 flex flex-col items-center md:items-start">
            <div class="flex items-center space-x-2 mb-4">

              <span class="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Pink Gavel Auctions
              </span>
            </div>
            <p class="text-gray-600 dark:text-gray-300 text-sm text-center md:text-left max-w-xs">
              Discover unique treasures at our premium online auction platform.
            </p>
          </div>

          <!-- Browse Links -->
          <div class="flex flex-col items-center md:items-start">
            <h3 class="text-gray-900 dark:text-gray-200 font-semibold text-base mb-4 relative">
              Browse
              <div class="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
            </h3>
            <div class="space-y-3 flex flex-col items-center md:items-start">
              <a href="/listings.html" class="text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-all duration-300 text-sm hover:translate-x-1">
                All Auctions
              </a>
              <a href="/categories.html" class="text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-all duration-300 text-sm hover:translate-x-1">
                Categories
              </a>
              <a href="/featured.html" class="text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-all duration-300 text-sm hover:translate-x-1">
                Featured Items
              </a>
            </div>
          </div>

          <!-- Account Links -->
          <div class="flex flex-col items-center md:items-start">
            <h3 class="text-gray-900 dark:text-gray-200 font-semibold text-base mb-4 relative">
              Account
              <div class="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
            </h3>
            <div class="space-y-3 flex flex-col items-center md:items-start">
              <a href="/auth/login.html" class="text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-all duration-300 text-sm hover:translate-x-1">
                Login
              </a>
              <a href="/auth/register.html" class="text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-all duration-300 text-sm hover:translate-x-1">
                Register
              </a>
              <a href="/profile.html" class="text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-all duration-300 text-sm hover:translate-x-1">
                My Profile
              </a>
            </div>
          </div>

          <!-- Support Links -->
          <div class="flex flex-col items-center md:items-start">
            <h3 class="text-gray-900 dark:text-gray-200 font-semibold text-base mb-4 relative">
              Support
              <div class="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
            </h3>
            <div class="space-y-3 flex flex-col items-center md:items-start">
              <a href="/help.html" class="text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-all duration-300 text-sm hover:translate-x-1">
                Help Center
              </a>
              <a href="/contact.html" class="text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-all duration-300 text-sm hover:translate-x-1">
                Contact Us
              </a>
              <a href="/faq.html" class="text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-all duration-300 text-sm hover:translate-x-1">
                FAQ
              </a>
            </div>
          </div>
        </div>



            

        <!-- Bottom Copyright -->
        <div class="border-t border-pink-200 dark:border-gray-700 pt-6">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              &copy; ${new Date().getFullYear()} Pink Gavel Auctions. All rights reserved.
            </p>
            <div class="flex items-center gap-6 text-sm">
              <a href="/privacy.html" class="text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors duration-300">
                Privacy Policy
              </a>
              <a href="/terms.html" class="text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors duration-300">
                Terms of Service
              </a>
              <a href="/cookies.html" class="text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors duration-300">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .light-wave-start { stop-color: #fce7f3; }
      .light-wave-middle { stop-color: #f3e8ff; }
      .light-wave-end { stop-color: #fce7f3; }
      .dark:dark-wave-start { stop-color: #111827; }
      .dark:dark-wave-middle { stop-color: #1f2937; }
      .dark:dark-wave-end { stop-color: #111827; }
    </style>
  `;

  document.body.appendChild(footer);

  // Add theme-aware wave switching
  const updateWave = () => {
    const isDark = document.documentElement.classList.contains("dark");
    const path = footer.querySelector("path");
    if (path) {
      path.setAttribute(
        "fill",
        isDark ? "url(#waveGradientDark)" : "url(#waveGradient)",
      );
    }
  };

  // Update on load and theme changes
  updateWave();

  // Listen for theme changes
  const observer = new MutationObserver(updateWave);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
}
