import { isAuthenticated, logoutUser } from "../library/auth.js";

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes in ms
let inactivityTimer = null;

function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  if (isAuthenticated()) {
    inactivityTimer = setTimeout(() => {
      logoutUser();
    }, INACTIVITY_LIMIT);
  }
}

function initializeInactivityTracking() {
  ["mousemove", "keydown", "scroll", "click", "touchstart"].forEach((event) => {
    window.addEventListener(event, resetInactivityTimer, true);
  });

  resetInactivityTimer();
}

export { initializeInactivityTracking, resetInactivityTimer };
