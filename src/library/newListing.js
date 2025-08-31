import { config } from "../services/config.js"; // Import config for API key
import { API_BASE_URL } from "../services/baseApi.js"; // Add this import

// Helper function to validate URL format
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}

// Helper function to process tags from comma-separated string
function processTags(tagsString) {
  if (!tagsString || typeof tagsString !== "string") {
    return [];
  }

  return tagsString
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 10); // Limit to 10 tags to prevent abuse
}

// Function to create a new listing via the API
export async function createListing({
  title,
  description,
  endsAt,
  media,
  tags,
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
      .filter((url) => url && url.trim()) // Filter out empty or null URLs
      .map((url) => {
        const trimmedUrl = url.trim();
        if (!isValidUrl(trimmedUrl)) {
          throw new Error("Invalid media URL format");
        }
        return {
          url: trimmedUrl,
          alt: "",
        };
      });
  }

  // Process tags
  const processedTags = processTags(tags);

  // Ensure endsAt is in ISO 8601 format
  const formattedEndsAt = new Date(endsAt).toISOString();

  const requestBody = {
    title: title.trim(),
    description: description.trim(),
    endsAt: formattedEndsAt,
    media: formattedMedia,
    tags: processedTags,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/auction/listings`, {
      // Use API_BASE_URL instead of hardcoded URL
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Noroff-API-Key": config.X_NOROFF_API_KEY, // Use API key from config
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(
        errorData.errors?.[0]?.message ||
          errorData.message ||
          "Failed to create listing.",
      );
    }

    return res.json();
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw error;
  }
}
