import { loginUser } from "../library/auth.js";
import { createGradientButton } from "../components/buttons.js";

// Constants
const REDIRECT_DELAY = 1500;
const REDIRECT_URL = "/index.html";

// DOM Elements Manager
class DOMElements {
  constructor() {
    this.form = document.getElementById("login-form");
    this.alertContainer = document.getElementById("login-error");
    this.emailField = document.getElementById("email");
    this.passwordField = document.getElementById("password");
    this.submitButton = this.form?.querySelector('button[type="submit"]');
    this.registerContainer = document.getElementById(
      "register-button-container",
    );
  }

  getFormData() {
    return {
      email: this.emailField?.value.trim() || "",
      password: this.passwordField?.value || "",
    };
  }

  isFormValid() {
    const { email, password } = this.getFormData();
    return email && password;
  }

  focusEmailField() {
    if (this.emailField && this.emailField.value === "") {
      this.emailField.focus();
    }
  }
}

// UI Manager
class UIManager {
  constructor(elements) {
    this.elements = elements;
  }

  showAlert(type, message) {
    if (!this.elements.alertContainer) return;

    this.elements.alertContainer.innerHTML = "";
    this.elements.alertContainer.className = this.getAlertClasses(type);
    this.elements.alertContainer.textContent = message;
  }

  getAlertClasses(type) {
    const baseClasses = "mt-4 border p-3 rounded-md";

    if (type === "success") {
      return `${baseClasses} bg-green-50 border-green-200 text-green-700`;
    }

    return `${baseClasses} bg-red-50 border-red-200 text-red-700`;
  }

  toggleLoadingState(isLoading) {
    if (!this.elements.submitButton) return;

    if (isLoading) {
      this.elements.submitButton.disabled = true;
      this.elements.submitButton.innerHTML = this.getLoadingHTML();
    } else {
      this.elements.submitButton.disabled = false;
      this.elements.submitButton.textContent = "Login";
    }
  }

  getLoadingHTML() {
    return `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Logging in...
    `;
  }

  clearAlert() {
    if (this.elements.alertContainer) {
      this.elements.alertContainer.innerHTML = "";
    }
  }

  initializeFormStyling() {
    this.addRegisterButton();
  }

  addRegisterButton() {
    if (!this.elements.registerContainer) return;

    const registerButton = createGradientButton("Register", "register.html");
    this.elements.registerContainer.appendChild(registerButton);
  }
}

// Error Handler
class ErrorHandler {
  static getErrorMessage(error) {
    if (!navigator.onLine) {
      return "Network error. Please check your internet connection.";
    }

    if (
      error.message.includes("401") ||
      error.message.includes("credentials")
    ) {
      return "Invalid email or password. Please try again.";
    }

    return error.message || "Failed to log in. Please try again later.";
  }
}

// Validation Manager
class ValidationManager {
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateForm(formData) {
    const errors = [];

    if (!formData.email) {
      errors.push("Email is required");
    } else if (!this.validateEmail(formData.email)) {
      errors.push("Please enter a valid email address");
    }

    if (!formData.password) {
      errors.push("Password is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Authentication Service
class AuthService {
  static async login(userData) {
    try {
      await loginUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: ErrorHandler.getErrorMessage(error),
      };
    }
  }
}

// Main Login Controller
class LoginController {
  constructor() {
    this.elements = new DOMElements();
    this.ui = new UIManager(this.elements);
  }

  init() {
    if (!this.elements.form) {
      return;
    }

    this.ui.initializeFormStyling();
    this.setupEventListeners();
    this.elements.focusEmailField();
  }

  setupEventListeners() {
    this.elements.form.addEventListener("submit", (event) => {
      this.handleLogin(event);
    });

    // Optional: Add real-time validation
    this.setupRealTimeValidation();
  }

  setupRealTimeValidation() {
    if (this.elements.emailField) {
      this.elements.emailField.addEventListener("blur", () => {
        this.validateEmailField();
      });
    }
  }

  validateEmailField() {
    const email = this.elements.emailField.value.trim();

    if (email && !ValidationManager.validateEmail(email)) {
      this.ui.showAlert("error", "Please enter a valid email address");
    } else {
      this.ui.clearAlert();
    }
  }

  async handleLogin(event) {
    event.preventDefault();
    this.ui.clearAlert();

    const formData = this.elements.getFormData();
    const validation = ValidationManager.validateForm(formData);

    if (!validation.isValid) {
      this.ui.showAlert("error", validation.errors[0]);
      return;
    }

    await this.performLogin(formData);
  }

  async performLogin(userData) {
    this.ui.toggleLoadingState(true);

    try {
      const result = await AuthService.login(userData);

      if (result.success) {
        this.handleLoginSuccess();
      } else {
        this.ui.showAlert("error", result.error);
      }
    } catch (error) {
      this.ui.showAlert(
        "error",
        "An unexpected error occurred. Please try again.",
      );
    } finally {
      this.ui.toggleLoadingState(false);
    }
  }

  handleLoginSuccess() {
    this.ui.showAlert("success", "Login successful! Redirecting...");
    this.redirectAfterDelay();
  }

  redirectAfterDelay() {
    setTimeout(() => {
      window.location.href = REDIRECT_URL;
    }, REDIRECT_DELAY);
  }
}

// Move this from main.js to login.js
const loginForm = document.getElementById("login-form");
const alertContainer = document.getElementById("login-error");

function showAlert(type, message) {
  if (!alertContainer) return;

  const baseClasses = "mt-4 border p-3 rounded-md";
  const typeClasses =
    type === "success"
      ? "bg-green-50 border-green-200 text-green-700"
      : "bg-red-50 border-red-200 text-red-700";

  alertContainer.className = `${baseClasses} ${typeClasses}`;
  alertContainer.textContent = message;
}

function toggleLoadingState(button, isLoading) {
  if (!button) return;

  if (isLoading) {
    button.disabled = true;
    button.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Logging in...
    `;
  } else {
    button.disabled = false;
    button.textContent = "Login";
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const emailField = document.getElementById("email");
  const passwordField = document.getElementById("password");
  const submitButton = event.target.querySelector('button[type="submit"]');

  if (!emailField || !passwordField) return;

  const email = emailField.value.trim();
  const password = passwordField.value.trim();

  if (!email || !password) {
    showAlert("error", "Please fill in all fields.");
    return;
  }

  toggleLoadingState(submitButton, true);

  try {
    await loginUser({ email, password });
    showAlert("success", "Login successful! Redirecting...");
    setTimeout(() => {
      window.location.href = "/index.html";
    }, 1500);
  } catch (error) {
    showAlert("error", error.message || "Login failed. Please try again.");
  } finally {
    toggleLoadingState(submitButton, false);
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  const loginController = new LoginController();
  loginController.init();

  // Login form handling
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
    const emailField = document.getElementById("email");
    if (emailField && emailField.value === "") {
      emailField.focus();
    }
  }
});

// Export for testing purposes
export { LoginController, ValidationManager, ErrorHandler };
