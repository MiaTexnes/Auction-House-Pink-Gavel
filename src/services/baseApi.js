import { config } from "./config.js";

// API Configuration
export const API_BASE_URL = config.API_BASE_URL;

// Helper function to build API URLs
const buildApiUrl = (endpoint) => {
  if (config.useProxy) {
    // In production, use the Netlify function proxy
    return `${API_BASE_URL}?path=${encodeURIComponent(endpoint)}`;
  } else {
    // In development, use direct API calls
    return `https://v2.api.noroff.dev${endpoint}`;
  }
};

// API Endpoints
export const AUCTION_ENDPOINTS = {
  placeBid: (itemId) => buildApiUrl(`/auction/listings/${itemId}/bids`),
  getListing: (itemId) => buildApiUrl(`/auction/listings/${itemId}`),
  getListings: () => buildApiUrl(`/auction/listings`),
};

export const AUTH_ENDPOINTS = {
  login: buildApiUrl(`/auth/login`),
  register: buildApiUrl(`/auth/register`),
  logout: buildApiUrl(`/auth/logout`),
};

// Helper function for making API requests
export const apiRequest = async (url, options = {}) => {
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  // Add API key only for development mode
  if (config.isDev && config.X_NOROFF_API_KEY) {
    defaultHeaders["X-Noroff-API-Key"] = config.X_NOROFF_API_KEY;
  }

  const requestOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response;
};
