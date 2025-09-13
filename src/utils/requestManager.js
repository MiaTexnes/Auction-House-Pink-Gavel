/**
 * REQUEST MANAGER UTILITY
 * =======================
 *
 * Centralized utility for managing API requests with rate limiting,
 * debouncing, and retry logic to prevent 429 (Too Many Requests) errors.
 */

class RequestManager {
  constructor() {
    this.requestQueue = [];
    this.activeRequests = new Set();
    this.requestTimestamps = [];
    this.maxRequestsPerMinute = 60; // Conservative limit
    this.minRequestInterval = 100; // Minimum 100ms between requests
    this.lastRequestTime = 0;
    this.retryDelays = [1000, 2000, 4000, 8000]; // Exponential backoff delays
  }

  /**
   * Checks if we can make a request based on rate limiting
   * @returns {boolean} Whether a request can be made
   */
  canMakeRequest() {
    const now = Date.now();

    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < 60000,
    );

    // Check if we're under the rate limit
    if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
      return false;
    }

    // Check minimum interval between requests
    if (now - this.lastRequestTime < this.minRequestInterval) {
      return false;
    }

    return true;
  }

  /**
   * Records a request timestamp for rate limiting
   */
  recordRequest() {
    const now = Date.now();
    this.requestTimestamps.push(now);
    this.lastRequestTime = now;
  }

  /**
   * Waits until we can make a request
   * @returns {Promise<void>}
   */
  async waitForAvailability() {
    return new Promise((resolve) => {
      if (this.canMakeRequest()) {
        resolve();
        return;
      }
      const maxWaitTime = 30000; // 30 seconds max wait
      const startTime = Date.now();
      const interval = setInterval(() => {
        if (this.canMakeRequest() || Date.now() - startTime > maxWaitTime) {
          clearInterval(interval);
          resolve();
        }
      }, this.minRequestInterval);
    });
  }

  /**
   * Makes a rate-limited fetch request with retry logic
   * @param {string} url - The URL to request
   * @param {Object} options - Fetch options
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<Response>}
   */
  async fetch(url, options = {}, retryCount = 0) {
    // Wait for rate limit availability
    await this.waitForAvailability();

    // Record the request
    this.recordRequest();

    const maxRetryCount429 = 4; // 1 initial + 4 retries = 5 calls
    const maxRetryCountNetwork = 2; // 1 initial + 2 retries = 3 calls
    try {
      const response = await fetch(url, options);

      // Handle 429 (Too Many Requests) with retry
      if (response.status === 429) {
        if (retryCount < maxRetryCount429) {
          const delay =
            this.retryDelays[Math.min(retryCount, this.retryDelays.length - 1)];
          console.warn(`Rate limited (429). Retrying in ${delay}ms...`);

          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.fetch(url, options, retryCount + 1);
        } else {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
      }

      return response;
    } catch (error) {
      // Handle network errors with retry for first few attempts
      if (
        retryCount < maxRetryCountNetwork &&
        error.message.includes("Failed to fetch")
      ) {
        const delay =
          this.retryDelays[Math.min(retryCount, this.retryDelays.length - 1)];
        console.warn(`Network error. Retrying in ${delay}ms...`);

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetch(url, options, retryCount + 1);
      }

      // Propagate original error for non-network errors
      throw error;
    }
  }

  /**
   * Debounced function utility
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Creates a request cache with TTL
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Object} Cache object with get/set methods
   */
  createCache(ttl = 300000) {
    // Default 5 minutes
    const cache = new Map();
    // Allow overriding Date.now for tests
    let nowFn = Date.now;
    return {
      get(key) {
        const item = cache.get(key);
        if (!item) return null;
        if (nowFn() > item.expiry) {
          cache.delete(key);
          return null;
        }
        return item.data;
      },
      set(key, data) {
        cache.set(key, {
          data,
          expiry: nowFn() + ttl,
        });
      },
      clear() {
        cache.clear();
      },
      _setNow(fn) {
        nowFn = fn;
      },
    };
  }
}

// Export singleton instance
export const requestManager = new RequestManager();

/**
 * Utility function for making rate-limited API requests
 * @param {string} url - The URL to request
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const safeFetch = (url, options) => requestManager.fetch(url, options);

/**
 * Debounced search function factory
 * @param {Function} searchFunction - The search function to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} Debounced search function
 */
export const createDebouncedSearch = (searchFunction, delay = 300) => {
  return requestManager.debounce(searchFunction, delay);
};

/**
 * Creates a cached fetch function
 * @param {number} cacheTTL - Cache time-to-live in milliseconds
 * @returns {Function} Cached fetch function
 */
export const createCachedFetch = (cacheTTL = 300000) => {
  const cache = requestManager.createCache(cacheTTL);

  const cachedFetch = async (url, options = {}) => {
    const cacheKey = `${url}${JSON.stringify(options)}`;

    // Try to get from cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      // Return the cached Response instance directly
      return cached;
    }

    // Make request if not cached
    const response = await safeFetch(url, options);

    if (response.ok) {
      // Clone the response and cache the clone
      const cloned = response.clone();
      cache.set(cacheKey, cloned);
    }

    return response;
  };

  // Expose cache for testing TTL
  cachedFetch._cache = cache;
  return cachedFetch;
};
