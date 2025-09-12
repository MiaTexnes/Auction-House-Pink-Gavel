// carousel.js - Carousel component for displaying listings
import { config } from "../services/config.js"; // Import the config object
import { API_BASE_URL } from "../services/baseApi.js"; // Add this import

export function createCarouselCard(listing) {
  const endDate = new Date(listing.endsAt);
  const now = new Date();
  const timeLeftMs = endDate.getTime() - now.getTime();

  // Create timeInfo object for displaying time
  const timeInfo = { text: "Ended" };

  if (timeLeftMs < 0) {
    timeInfo.text = "Ended";
  } else {
    const days = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
    timeInfo.text = `Ends: ${days}d ${hours}h ${minutes}m`;
  }

  const imageUrl =
    listing.media && listing.media.length > 0 && listing.media[0].url
      ? listing.media[0].url
      : null;
  const sellerAvatar =
    listing.seller && listing.seller.avatar && listing.seller.avatar.url
      ? listing.seller.avatar.url
      : "https://placehold.co/40x40?text=S";
  const sellerName =
    listing.seller && listing.seller.name ? listing.seller.name : "Unknown";

  const card = document.createElement("a");
  card.href = `/item.html?id=${listing.id}`;
  card.className =
    "flex-none w-[85vw] xs:w-[75vw] sm:w-64 md:w-72 lg:w-80 min-w-[220px] xs:min-w-[240px] sm:min-w-[280px] md:min-w-[300px] bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-[350px] xs:h-[380px] sm:h-[400px] flex flex-col cursor-pointer border border-gray-100 dark:border-gray-700 hover:z-0 snap-center snap-always";
  // Mobile-first approach with xs breakpoint for small phones and snap scrolling

  card.innerHTML = `
    ${
      imageUrl
        ? `<div class="w-full h-36 xs:h-40 flex-shrink-0 bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <img src="${imageUrl}" alt="${listing.title}" loading="lazy" class="w-full h-full object-cover carousel-image transition-transform duration-300 hover:scale-110">
           </div>`
        : `<div class="w-full h-36 xs:h-40 flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-500 text-white text-center font-semibold text-lg italic flex-shrink-0 transition-all duration-300 hover:from-pink-500 hover:to-purple-600">
            No image on this listing
           </div>`
    }
    <div class="p-4 flex-1 flex flex-col min-h-0 relative">
      <div class="absolute inset-0 bg-gradient-to-t from-transparent to-transparent opacity-0 hover:opacity-5 transition-opacity duration-300 pointer-events-none bg-pink-500 rounded-b-lg"></div>
      <h3 class="font-bold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors duration-200">${
        listing.title
      }</h3>
      <p class="text-gray-600 dark:text-gray-300 text-sm mb-3 flex-1 line-clamp-3">${
        listing.description || "No description provided."
      }</p>
      <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
        <span class="font-medium text-green-600 dark:text-green-400">${
          timeInfo.text
        }</span>
        <span class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs font-medium">
          Bids: ${listing._count?.bids || 0}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <img src="${sellerAvatar}" alt="${sellerName}" loading="lazy" class="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 transition-all duration-200 hover:border-pink-400 dark:hover:border-pink-500 hover:shadow-md flex-shrink-0">
        <span class="text-gray-800 dark:text-gray-200 font-medium truncate transition-colors duration-200 hover:text-pink-600 dark:hover:text-pink-400">${sellerName}</span>
      </div>
    </div>
  `;

  // Handle image error
  if (imageUrl) {
    const img = card.querySelector(".carousel-image");
    if (img) {
      img.addEventListener("error", function () {
        this.parentElement.outerHTML =
          '<div class="w-full h-40 flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-500 text-white text-center font-semibold text-lg italic flex-shrink-0 transition-all duration-300 hover:from-pink-500 hover:to-purple-600">No image on this listing</div>';
      });
    }
  }

  return card;
}

// Render the carousel with scroll functionality
export function renderCarousel(listings, carouselContainer) {
  if (!carouselContainer) return;

  carouselContainer.innerHTML = "";

  // Update carousel container classes for proper scrolling
  carouselContainer.className =
    "flex gap-3 sm:gap-4 md:gap-5 lg:gap-6 overflow-x-auto pb-4 scroll-smooth scrollbar-hide max-w-full px-2 sm:px-3 snap-x snap-mandatory";

  listings.forEach((listing) => {
    const card = createCarouselCard(listing);
    carouselContainer.appendChild(card);
  });
}

// Setup scroll buttons for the carousel
export function setupCarouselScrollButtons(
  scrollLeftId = "scroll-left",
  scrollRightId = "scroll-right",
  carouselSelector = "#listings-carousel .flex",
) {
  const scrollLeftBtn = document.getElementById(scrollLeftId);
  const scrollRightBtn = document.getElementById(scrollRightId);

  if (scrollLeftBtn && scrollRightBtn) {
    // Enhanced buttons for better mobile experience
    scrollLeftBtn.className =
      "bg-pink-500 hover:bg-pink-600 text-white px-3 py-2 xs:px-4 xs:py-2 sm:px-5 sm:py-3 rounded-full shadow-lg hover:shadow-xl transition-all touch-manipulation";
    scrollRightBtn.className =
      "bg-pink-500 hover:bg-pink-600 text-white px-3 py-2 xs:px-4 xs:py-2 sm:px-5 sm:py-3 rounded-full shadow-lg hover:shadow-xl transition-all touch-manipulation";

    // Set text labels for accessibility and clarity (visible and aria)
    scrollLeftBtn.textContent = "←";
    scrollLeftBtn.setAttribute("aria-label", "Scroll carousel left");
    scrollRightBtn.textContent = "→";
    scrollRightBtn.setAttribute("aria-label", "Scroll carousel right");

    const getScrollDistance = () => {
      // Responsive scroll distance based on viewport width with improved small screen support
      const width = window.innerWidth;

      if (width < 480) return 230; // Extra small devices
      if (width < 640) return 250; // Small mobile devices
      if (width < 768) return 300; // Larger mobile devices
      if (width < 1024) return 350; // Tablets
      return 400; // Desktops
    };

    scrollLeftBtn.addEventListener("click", () => {
      const carousel = document.querySelector(carouselSelector);
      if (carousel) {
        carousel.scrollBy({ left: -getScrollDistance(), behavior: "smooth" });
      }
    });

    scrollRightBtn.addEventListener("click", () => {
      const carousel = document.querySelector(carouselSelector);
      if (carousel) {
        carousel.scrollBy({ left: getScrollDistance(), behavior: "smooth" });
      }
    });
  }
}

// Fetch listings for carousel
export async function fetchCarouselListings(limit = 20) {
  const headers = {
    "Content-Type": "application/json",
    "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
  };

  const response = await fetch(
    `${API_BASE_URL}/auction/listings?_seller=true&_bids=true&limit=${limit}&sort=created&sortOrder=desc`, // Use API_BASE_URL instead of API_BASE
    { headers },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch listings");
  }

  const responseData = await response.json();
  const listings = responseData.data || [];

  // Sort by newest first
  return listings.sort((a, b) => new Date(b.created) - new Date(a.created));
}
