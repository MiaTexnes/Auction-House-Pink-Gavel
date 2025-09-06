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
              <a href="faq.html" class="text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-all duration-300 text-sm hover:translate-x-1">
                FAQ
              </a>
              <a href="/contact.html" class="text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-all duration-300 text-sm hover:translate-x-1">
                Contact Us
              </a>

            </div>
          </div>
        </div>
                <!-- Social Media -->
        <div class="border-t border-pink-200 dark:border-gray-700 pt-8 mb-8">
          <div class="flex flex-col md:flex-row items-center  justify-center gap-6">
            <!-- Social Media -->
            <div class="flex items-center space-x-4">
              <span class="text-gray-700 dark:text-gray-300 font-medium text-sm">Follow us:</span>
              <div class="flex space-x-3">
                <a href="#" class="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform duration-300 shadow-lg" aria-label="Follow us on Twitter">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" class="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform duration-300 shadow-lg" aria-label="Follow us on Facebook">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" class="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform duration-300 shadow-lg" aria-label="Follow us on Pinterest">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
              </div>
            </div>


            </div>
          </div>
        </div>


        <!-- Bottom Copyright -->
        <div class="border-t p-3 border-pink-200 dark:border-gray-700 pt-6">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              &copy; 2025 Pink Gavel Auctions. All rights reserved.
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
