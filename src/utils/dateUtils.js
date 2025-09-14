/**
 * Sets minimum datetime for a datetime-local input to prevent past dates
 * @param {HTMLInputElement} element - The datetime input element
 * @throws {Error} If element is not a valid datetime input
 */
export function setMinimumDateTime(element) {
  try {
    if (!element || element.type !== "datetime-local") {
      throw new Error("Invalid element provided to setMinimumDateTime");
    }

    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    element.min = now.toISOString().slice(0, 16);
  } catch (error) {
    // Handle error gracefully - don't break the application
    if (element && element.type === "datetime-local") {
      const now = new Date();
      element.min = now.toISOString().slice(0, 16);
    }
  }
}
