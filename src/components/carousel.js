// carousel.js - Carousel component for displaying listings
import { config } from "../services/config.js"; // Import the config object
import { API_BASE_URL } from "../services/baseApi.js"; // Add this import

export function createCarouselCard(listing) {
  const endDate = new Date(listing.endsAt);
  const now = new Date();
  const timeLeftMs = endDate.getTime() - now.getTime();

  let timeLeftString;
  if (timeLeftMs < 0) {
    timeLeftString = "Ended";
  } else {
    const days = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
    timeLeftString = `Ends: ${days}d ${hours}h ${minutes}m`;
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
    "flex-none w-80 min-w-[320px] bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-[420px] flex flex-col cursor-pointer transform hover:scale-[1.02] hover:-translate-y-1 border border-gray-100 dark:border-gray-700";

  card.innerHTML = `
    ${
      imageUrl
        ? `<div class="w-full h-40 flex-shrink-0 bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <img src="${imageUrl}" alt="${listing.title}" class="w-full h-full object-cover carousel-image transition-transform duration-300 hover:scale-110">
           </div>`
        : `<div class="w-full h-40 flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-500 text-white text-center font-semibold text-lg italic flex-shrink-0 transition-all duration-300 hover:from-pink-500 hover:to-purple-600">
            No image on this listing
           </div>`
    }
    <div class="p-4 flex-1 flex flex-col min-h-0 relative">
      <div class="absolute inset-0 bg-gradient-to-t from-transparent to-transparent opacity-0 hover:opacity-5 transition-opacity duration-300 pointer-events-none bg-pink-500 rounded-b-lg"></div>
      <h2 class="text-xl font-semibold mb-2 line-clamp-2 min-h-[3.5rem] text-gray-900 dark:text-white transition-colors duration-200 hover:text-pink-600 dark:hover:text-pink-400 relative z-10">${listing.title}</h2>
      <p class="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-3 flex-1 min-h-[4.5rem] transition-colors duration-200 relative z-10">${
        listing.description || "No description provided."
      }</p>
      <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3 flex-shrink-0 relative z-10">
        <span class="font-medium ${timeLeftMs < 0 ? "text-red-500 dark:text-red-400" : timeLeftMs < 24 * 60 * 60 * 1000 ? "text-orange-500 dark:text-orange-400" : "text-green-500 dark:text-green-400"} transition-colors duration-200">${timeLeftString}</span>
        <span class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:bg-pink-100 dark:hover:bg-pink-900 hover:scale-105">Bids: ${listing._count?.bids || 0}</span>
      </div>
      <div class="flex items-center space-x-2 flex-shrink-0 transition-all duration-200 hover:translate-x-1 relative z-10">
        <img src="${sellerAvatar}" alt="${sellerName}" class="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 transition-all duration-200 hover:border-pink-400 dark:hover:border-pink-500 hover:shadow-md flex-shrink-0">
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
    "flex gap-6 overflow-x-auto pb-4 scroll-smooth scrollbar-hide";

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
    scrollLeftBtn.addEventListener("click", () => {
      const carousel = document.querySelector(carouselSelector);
      if (carousel) {
        carousel.scrollBy({ left: -400, behavior: "smooth" });
      }
    });

    scrollRightBtn.addEventListener("click", () => {
      const carousel = document.querySelector(carouselSelector);
      if (carousel) {
        carousel.scrollBy({ left: 400, behavior: "smooth" });
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
