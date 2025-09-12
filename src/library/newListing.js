import { config } from "../services/config.js";
import { API_BASE_URL } from "../services/baseApi.js";
import { processTags } from "../utils/tagUtils.js";

// Helper function to validate URL format
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Creates a new auction listing
 *
 * @param {Object} options - Listing creation options
 * @param {string} options.title - The listing title
 * @param {string} options.description - The listing description
 * @param {string} options.endsAt - ISO string of end date/time
 * @param {Array} options.media - Array of media objects with url and alt
 * @param {string|Array} options.tags - Tags as string or array
 * @returns {Promise<Object>} - The created listing
 */
export async function createListing({
  title,
  description,
  endsAt,
  media = [],
  tags = [],
}) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("You must be logged in to create a listing.");

  // Client-side validation
  if (!title || title.trim().length === 0) {
    throw new Error("Title is required");
  }

  if (!description || description.trim().length === 0) {
    throw new Error("Description is required");
  }

  if (!endsAt) {
    throw new Error("End date is required");
  }

  // Check if end date is in the future
  const endDate = new Date(endsAt);
  const now = new Date();
  if (endDate <= now) {
    throw new Error("End date must be in the future");
  }

  // Validate media URLs if provided and format them correctly
  let formattedMedia = [];
  if (media && media.length > 0) {
    formattedMedia = media
      .filter((item) => item && item.url && item.url.trim().length > 0)
      .map((item) => {
        // Validate URL format
        if (!isValidUrl(item.url)) {
          throw new Error(`Invalid media URL: ${item.url}`);
        }
        return {
          url: item.url,
          alt: item.alt || "",
        };
      });
  }

  // Process tags if provided
  const processedTags = processTags(tags);

  try {
    const response = await fetch(`${API_BASE_URL}/auction/listings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
      },
      body: JSON.stringify({
        title,
        description,
        tags: processedTags,
        media: formattedMedia,
        endsAt,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.message || "Failed to create listing");
    }

    return data.data;
  } catch (error) {
    if (error.message) {
      throw error;
    }
    throw new Error(
      "Network error. Please check your connection and try again.",
    );
  }
}
