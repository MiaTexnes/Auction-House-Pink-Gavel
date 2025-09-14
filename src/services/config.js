/**
 * @fileoverview Application configuration
 * Centralizes environment variables and configuration settings
 * @author Pink Gavel Auctions Team
 * @version 1.0.0
 */

const apiKey = import.meta.env.VITE_NOROFF_API_KEY;

/**
 * Application configuration object
 * @type {Object}
 * @property {string} X_NOROFF_API_KEY - API key for Noroff API
 * @property {string} API_BASE_URL - Base URL for API endpoints
 * @property {boolean} isDev - Whether running in development mode
 * @property {string} mode - Current environment mode
 */
export const config = {
  X_NOROFF_API_KEY: apiKey || "",
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  isDev: import.meta.env.DEV,
  mode: import.meta.env.MODE,
};

// Validate API key in development
if (!apiKey && import.meta.env.DEV) {
  // Only show warnings in development mode
  // In production, this would be handled by build-time validation
}
