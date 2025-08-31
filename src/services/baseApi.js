import { config } from "./config.js";

// API Configuration
export const API_BASE_URL = config.API_BASE_URL;

// API Endpoints
export const AUCTION_ENDPOINTS = {
  placeBid: (itemId) => `${API_BASE_URL}/auction/listings/${itemId}/bids`,
  getListing: (itemId) => `${API_BASE_URL}/auction/listings/${itemId}`,
  getListings: () => `${API_BASE_URL}/auction/listings`,
};

export const AUTH_ENDPOINTS = {
  login: `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  logout: `${API_BASE_URL}/auth/logout`,
};
