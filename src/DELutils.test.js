import { describe, it, expect } from "vitest";

// Simple utility function to test
export function greet(name) {
  return `Hello, ${name}!`;
}

export function calculateBid(currentBid, increment) {
  return currentBid + increment;
}

// Tests
describe("Auction Utilities", () => {
  it("should greet users correctly", () => {
    expect(greet("Bidder")).toBe("Hello, Bidder!");
  });

  it("should calculate new bid amount", () => {
    expect(calculateBid(100, 10)).toBe(110);
    expect(calculateBid(500, 25)).toBe(525);
  });

  it("should handle zero increment", () => {
    expect(calculateBid(100, 0)).toBe(100);
  });
});
