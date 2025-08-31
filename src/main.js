import "./css/style.css";
import { initDarkMode, toggleDarkMode } from "./components/darkLight.js";
import { initializeHeader } from "./components/header.js";
import { isAuthenticated, logoutUser } from "./library/auth.js";
import { createGradientButton } from "./components/buttons.js";
import { loginUser } from "./library/auth.js";
import { initializeFooter } from "./components/footer.js";

// Initialize dark mode for the whole page
initDarkMode();

// Make toggleDarkMode globally available for event listeners
window.toggleDarkMode = toggleDarkMode;

// --- Inactivity auto-logout logic ---
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

["mousemove", "keydown", "scroll", "click", "touchstart"].forEach((event) => {
  window.addEventListener(event, resetInactivityTimer, true);
});

resetInactivityTimer();
// --- End inactivity auto-logout logic ---

// --- Login page logic (moved from login.js) ---
const loginForm = document.getElementById("login-form");
const alertContainer = document.getElementById("login-error");

function showAlert(type, message) {
  if (!alertContainer) return;
  alertContainer.innerHTML = "";
  alertContainer.className =
    type === "success"
      ? "mt-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded-sm"
      : "mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-sm";
  alertContainer.textContent = message;
}

function toggleLoadingState(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Logging in...`;
  } else {
    button.disabled = false;
    button.textContent = "Login";
  }
}

async function handleLogin(event) {
  event.preventDefault();
  if (!alertContainer) return;
  alertContainer.innerHTML = "";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const submitButton = loginForm.querySelector('button[type="submit"]');

  if (!email || !password) {
    showAlert("error", "Please fill in all fields");
    return;
  }

  try {
    toggleLoadingState(submitButton, true);
    const userData = { email, password };
    await loginUser(userData);

    showAlert("success", "Login successful! Redirecting...");
    setTimeout(() => {
      window.location.href = "/index.html";
    }, 1500);
  } catch (error) {
    console.error("Login error:", error);
    if (!navigator.onLine) {
      showAlert(
        "error",
        "Network error. Please check your internet connection.",
      );
    } else if (
      error.message.includes("401") ||
      error.message.includes("credentials")
    ) {
      showAlert("error", "Invalid email or password. Please try again.");
    } else {
      showAlert(
        "error",
        error.message || "Failed to log in. Please try again later.",
      );
    }
  } finally {
    toggleLoadingState(submitButton, false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
    const emailField = document.getElementById("email");
    if (emailField && emailField.value === "") {
      emailField.focus();
    }
  }

  // Custom Register button for login page
  const homeAuthButtons = document.getElementById("home-auth-buttons");
  if (homeAuthButtons) {
    const registerBtn = createGradientButton("Register", "register.html");
    // Make this button transparent with a border
    registerBtn.className =
      "w-full text-center py-2 px-4 rounded-full border-2 border-black text-primary font-semibold bg-transparent hover:bg-primary hover:text-white transition-all duration-200 shadow-md";
    homeAuthButtons.replaceWith(registerBtn);
  }
});
// --- End login page logic ---

// Function to initialize the page
function initializePage() {
  // Initialize header using the named export function
  initializeHeader();

  initializeFooter();

  const homeAuthButtons = document.getElementById("home-auth-buttons");
  if (homeAuthButtons) {
    const registerBtn = createGradientButton("Register", "register.html");
    // Optionally add aria-label for accessibility
    registerBtn.setAttribute("aria-label", "Go to registration page");
    homeAuthButtons.appendChild(registerBtn);
  }
}

// Run initialization when DOM is loaded
document.addEventListener("DOMContentLoaded", initializePage);

// Add this temporarily to debug
console.log("=== DEBUG INFO ===");
console.log("Mode:", import.meta.env.MODE);
console.log("API Key exists:", !!import.meta.env.VITE_X_NOROFF_API_KEY);
console.log("API Key length:", import.meta.env.VITE_X_NOROFF_API_KEY?.length);
console.log(
  "All VITE_ vars:",
  Object.keys(import.meta.env).filter((key) => key.startsWith("VITE_")),
);
console.log("==================");
