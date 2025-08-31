import {
  isAuthenticated,
  getCurrentUser,
  getAuthHeader,
} from "../library/auth.js";
import { updateUserCredits } from "../components/header.js";
import { config } from "../services/config.js"; // Import the config object
import { API_BASE_URL } from "./baseApi.js"; // Add this import

/**
 * Bidding Service - Handles all bidding operations
 */
export class BiddingService {
  constructor() {
    this.currentUserCredits = null;
  }

  /**
   * Get current user's credits
   * @returns {Promise<number|null>} User's current credits or null if not available
   */
  async getCurrentUserCredits() {
    if (!isAuthenticated()) {
      throw new Error("User must be logged in to check credits");
    }

    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error("No user data found");
      }

      const authHeader = getAuthHeader();
      const response = await fetch(
        `${API_BASE_URL}/auction/profiles/${currentUser.name}`, // Use API_BASE_URL instead of API_BASE
        {
          headers: {
            "Content-Type": "application/json",
            "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
            Authorization: authHeader.Authorization,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const data = await response.json();
      this.currentUserCredits = data.data.credits;
      return this.currentUserCredits;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate if user has sufficient credits for a bid
   * @param {number} bidAmount - The amount user wants to bid
   * @returns {Promise<{valid: boolean, message?: string, userCredits?: number}>}
   */
  async validateBid(bidAmount) {
    try {
      const userCredits = await this.getCurrentUserCredits();

      if (userCredits < bidAmount) {
        return {
          valid: false,
          message: `Insufficient funds. You have ${userCredits} credits but need ${bidAmount} credits.`,
          userCredits: userCredits,
        };
      }

      return {
        valid: true,
        userCredits: userCredits,
      };
    } catch (error) {
      return {
        valid: false,
        message: "Failed to validate bid. Please try again.",
        error: error.message,
      };
    }
  }

  /**
   * Place a bid on a listing
   * @param {string} listingId - The ID of the listing to bid on
   * @param {number} bidAmount - The amount to bid
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async placeBid(listingId, bidAmount) {
    if (!isAuthenticated()) {
      return {
        success: false,
        error: "You must be logged in to place a bid",
      };
    }

    try {
      // Validate bid amount
      if (!bidAmount || bidAmount <= 0) {
        return {
          success: false,
          error: "Bid amount must be greater than 0",
        };
      }

      // Check if user has sufficient credits
      const validation = await this.validateBid(bidAmount);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.message,
          userCredits: validation.userCredits,
        };
      }

      // Place the bid
      const authHeader = getAuthHeader();
      const response = await fetch(
        `${API_BASE_URL}/auction/listings/${listingId}/bids`, // Use API_BASE_URL instead of API_BASE
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
            Authorization: authHeader.Authorization,
          },
          body: JSON.stringify({ amount: parseInt(bidAmount) }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = "Failed to place bid";

        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0].message;
        }

        // Handle specific error cases
        if (response.status === 400) {
          if (errorMessage.toLowerCase().includes("insufficient")) {
            errorMessage = `Insufficient funds. Please check your account balance.`;
          } else if (errorMessage.toLowerCase().includes("higher")) {
            errorMessage =
              "Your bid must be higher than the current highest bid.";
          }
        } else if (response.status === 403) {
          errorMessage = "You cannot bid on your own listing.";
        } else if (response.status === 404) {
          errorMessage = "Listing not found or auction has ended.";
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      const responseData = await response.json();

      // Update credits in header
      await updateUserCredits();

      return {
        success: true,
        data: responseData.data,
        message: "Bid placed successfully!",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.message || "An unexpected error occurred while placing the bid",
      };
    }
  }

  /**
   * Get the minimum bid amount for a listing
   * @param {Array} bids - Array of existing bids
   * @returns {number} Minimum bid amount
   */
  getMinimumBid(bids) {
    if (!bids || bids.length === 0) {
      return 1; // Minimum bid of 1 credit if no bids
    }

    const highestBid = Math.max(...bids.map((bid) => bid.amount));
    return highestBid + 1;
  }

  /**
   * Check if user can bid on a listing
   * @param {Object} listing - The listing object
   * @returns {Promise<{canBid: boolean, reason?: string}>}
   */
  async canUserBid(listing) {
    if (!isAuthenticated()) {
      return {
        canBid: false,
        reason: "You must be logged in to bid",
      };
    }

    const currentUser = getCurrentUser();

    // Check if user owns the listing
    if (
      currentUser &&
      listing.seller &&
      currentUser.name === listing.seller.name
    ) {
      return {
        canBid: false,
        reason: "You cannot bid on your own listing",
      };
    }

    // Check if auction has ended
    const now = new Date();
    const endDate = new Date(listing.endsAt);
    if (now >= endDate) {
      return {
        canBid: false,
        reason: "This auction has ended",
      };
    }

    // Check if user has any credits
    try {
      const userCredits = await this.getCurrentUserCredits();
      if (userCredits <= 0) {
        return {
          canBid: false,
          reason: "You don't have any credits to bid",
        };
      }

      const minBid = this.getMinimumBid(listing.bids);
      if (userCredits < minBid) {
        return {
          canBid: false,
          reason: `You need at least ${minBid} credits to bid on this item`,
        };
      }
    } catch (error) {
      return {
        canBid: false,
        reason: "Unable to verify your account balance",
      };
    }

    return {
      canBid: true,
    };
  }

  /**
   * Add credits to the seller when an auction is won
   * @param {string} sellerName - The name of the seller
   * @param {number} amount - The amount to add to the seller's credits
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async addCreditsToSeller(sellerName, amount) {
    if (!isAuthenticated()) {
      return {
        success: false,
        error: "You must be logged in to perform this action",
      };
    }

    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        `${API_BASE_URL}/auction/profiles/${sellerName}/credits`, // Use API_BASE_URL instead of API_BASE
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
            Authorization: authHeader.Authorization,
          },
          body: JSON.stringify({ credits: amount }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || "Failed to update seller's credits",
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "An unexpected error occurred",
      };
    }
  }

  /**
   * Refund credits to a user if they don't win the auction
   * @param {string} userName - The name of the user to refund
   * @param {number} amount - The amount to refund
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async refundCreditsToUser(userName, amount) {
    if (!isAuthenticated()) {
      return {
        success: false,
        error: "You must be logged in to perform this action",
      };
    }

    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        `${API_BASE_URL}/auction/profiles/${userName}/credits`, // Use API_BASE_URL instead of API_BASE
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Noroff-API-Key": config.X_NOROFF_API_KEY,
            Authorization: authHeader.Authorization,
          },
          body: JSON.stringify({ credits: amount }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || "Failed to refund user's credits",
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "An unexpected error occurred",
      };
    }
  }
}

// Export a singleton instance
export const biddingService = new BiddingService();

// Export individual functions for convenience
export const placeBid = (listingId, bidAmount) =>
  biddingService.placeBid(listingId, bidAmount);
export const validateBid = (bidAmount) => biddingService.validateBid(bidAmount);
export const canUserBid = (listing) => biddingService.canUserBid(listing);
export const getMinimumBid = (bids) => biddingService.getMinimumBid(bids);
export const getCurrentUserCredits = () =>
  biddingService.getCurrentUserCredits();

// Example auction end logic
async function handleAuctionEnd(listingId, bids, sellerName) {
  try {
    // Find the highest bid
    const highestBid = bids.reduce(
      (max, bid) => (bid.amount > max.amount ? bid : max),
      { amount: 0 },
    );

    // Update seller's credits with the highest bid amount
    if (highestBid && highestBid.amount > 0) {
      await biddingService.addCreditsToSeller(sellerName, highestBid.amount);
    }

    // Refund all other bidders
    for (const bid of bids) {
      if (bid.userName !== highestBid.userName) {
        await biddingService.refundCreditsToUser(bid.userName, bid.amount);
      }
    }
  } catch (error) {
    // Error handling without console.log
  }
}
