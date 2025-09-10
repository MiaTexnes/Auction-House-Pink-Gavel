/**
 * Sets minimum datetime for a datetime-local input to prevent past dates
 * @param {HTMLInputElement} element - The datetime input element
 */
export function setMinimumDateTime(element) {
  if (element) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    element.min = now.toISOString().slice(0, 16);
  }
}
