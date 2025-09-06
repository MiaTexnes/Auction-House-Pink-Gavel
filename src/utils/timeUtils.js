/**
 * Time utility functions for auction applications
 */

export const TimeUtils = {
  /**
   * Format time remaining until auction end
   * @param {string|Date} endDate - The auction end date
   * @param {Object} options - Formatting options
   * @param {boolean} options.includeSeconds - Whether to include seconds in short format
   * @param {boolean} options.includeClass - Whether to include CSS classes in return
   * @returns {Object} Object with text, isEnded, and optionally class properties
   */
  formatTimeRemaining(endDate, options = {}) {
    const { includeSeconds = false, includeClass = false } = options;

    const now = new Date();
    const end = new Date(endDate);
    const timeLeft = end.getTime() - now.getTime();

    if (timeLeft <= 0) {
      const result = {
        text: "Auction Ended",
        isEnded: true,
      };

      if (includeClass) {
        result.class = "underline text-red-700 dark:text-red-400 font-semibold";
      }

      return result;
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    let text;
    if (days > 0) {
      text = `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      text = includeSeconds
        ? `${hours}h ${minutes}m ${seconds}s`
        : `${hours}h ${minutes}m`;
    } else {
      text = includeSeconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
    }

    const result = {
      text,
      isEnded: false,
    };

    if (includeClass) {
      result.class = "text-green-800 dark:text-green-400 text-sm font-semibold";
    }

    return result;
  },

  /**
   * Format time remaining for listings page (with "Ends:" prefix and CSS classes)
   * @param {string|Date} endDate - The auction end date
   * @returns {Object} Object with text and class properties
   */
  formatTimeRemainingForListings(endDate) {
    const result = this.formatTimeRemaining(endDate, { includeClass: true });

    if (!result.isEnded) {
      result.text = `Ends: ${result.text}`;
    } else {
      result.text = "Ended";
    }

    return result;
  },

  /**
   * Format time remaining for item page (detailed format with seconds)
   * @param {string|Date} endDate - The auction end date
   * @returns {Object} Object with text and isEnded properties
   */
  formatTimeRemainingForItem(endDate) {
    return this.formatTimeRemaining(endDate, { includeSeconds: true });
  },
};
