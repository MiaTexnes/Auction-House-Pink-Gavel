/**
 * USER REGISTRATION PAGE CONTROLLER
 * =================================
 *
 * This file manages the user registration page functionality including form validation,
 * submission handling, UI feedback, and integration with the authentication system.
 *
 * Key Features:
 * - Real-time form validation with field-specific feedback
 * - Secure user registration with avatar URL support
 * - Dynamic UI state management (loading, success, error states)
 * - Responsive form styling with visual feedback
 * - Integration with authentication system and automatic login
 * - Cross-page navigation with login button integration
 *
 * Architecture:
 * - Modular class-based design with clear separation of concerns
 * - DOM element caching for performance optimization
 * - Event-driven form handling with comprehensive validation
 * - UI state management with loading indicators and messaging
 */

import { registerUser } from "../library/auth.js";
import { createGradientButton } from "../components/buttons.js";
import { loginUser } from "../library/auth.js";

// Constants
const REDIRECT_DELAY = 1500;
const REDIRECT_URL = "login.html";

// DOM Elements Manager
class DOMElements {
  constructor() {
    // Core form elements
    this.form = document.getElementById("register-form");
    this.errorDiv = document.getElementById("register-error");
    this.successDiv = document.getElementById("register-success");
    this.submitButton = this.form?.querySelector('button[type="submit"]');
    this.loginContainer = document.getElementById("login-button-container");

    // Input field references for validation and data collection
    this.nameField = document.getElementById("name");
    this.emailField = document.getElementById("email");
    this.passwordField = document.getElementById("password");
    this.avatarField = document.getElementById("avatar");
  }

  /**
   * Collects and normalizes form data from all input fields
   * Trims whitespace and provides fallbacks for optional fields
   * @returns {Object} Form data object with user registration information
   */
  getFormData() {
    return {
      name: this.nameField?.value.trim() || "",
      email: this.emailField?.value.trim() || "",
      password: this.passwordField?.value || "",
      avatar: this.avatarField?.value.trim() || "",
    };
  }

  /**
   * Validates that all required form fields contain data
   * Checks for presence of name, email, and password
   * @returns {boolean} True if all required fields are filled
   */
  isFormValid() {
    const { name, email, password } = this.getFormData();
    return name && email && password;
  }

  /**
   * Sets focus to the name field if it's empty
   * Used for improving user experience after form submission
   */
  focusNameField() {
    if (this.nameField && this.nameField.value === "") {
      this.nameField.focus();
    }
  }

  /**
   * Resets all form fields to their default state
   * Clears user input and prepares form for new registration
   */
  resetForm() {
    if (this.form) {
      this.form.reset();
    }
  }
}

/**
 * UI MANAGER
 * ==========
 *
 * Handles all user interface operations for the registration page including
 * message display, loading states, form styling, and visual feedback.
 * Manages the complete UI lifecycle from initial load to post-registration.
 */
class UIManager {
  constructor(elements) {
    this.elements = elements; // Reference to DOM elements manager
  }

  /**
   * Displays error messages to the user with appropriate styling
   * Hides success messages and shows error container with red styling
   * @param {string} message - Error message to display to user
   */
  showError(message) {
    if (!this.elements.errorDiv) return;

    this.elements.errorDiv.innerHTML = "";
    this.elements.errorDiv.className = this.getErrorClasses();
    this.elements.errorDiv.textContent = message;
    this.elements.errorDiv.classList.remove("hidden");

    // Hide success message if visible
    if (this.elements.successDiv) {
      this.elements.successDiv.classList.add("hidden");
    }
  }

  /**
   * Displays success messages to the user with appropriate styling
   * Hides error messages and shows success container with green styling
   * @param {string} message - Success message to display to user
   */
  showSuccess(message) {
    if (!this.elements.successDiv) return;

    this.elements.successDiv.innerHTML = "";
    this.elements.successDiv.className = this.getSuccessClasses();
    this.elements.successDiv.textContent = message;
    this.elements.successDiv.classList.remove("hidden");

    // Hide error message if visible
    if (this.elements.errorDiv) {
      this.elements.errorDiv.classList.add("hidden");
    }
  }

  /**
   * Returns CSS classes for error message styling
   * Provides consistent red-themed error appearance
   * @returns {string} CSS classes for error styling
   */
  getErrorClasses() {
    return "mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-md";
  }

  /**
   * Returns CSS classes for success message styling
   * Provides consistent green-themed success appearance
   * @returns {string} CSS classes for success styling
   */
  getSuccessClasses() {
    return "mt-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded-md";
  }

  /**
   * Toggles the submit button loading state
   * Shows loading spinner during registration process
   * @param {boolean} isLoading - Whether to show loading state
   */
  toggleLoadingState(isLoading) {
    if (!this.elements.submitButton) return;

    if (isLoading) {
      this.elements.submitButton.disabled = true;
      this.elements.submitButton.innerHTML = this.getLoadingHTML();
    } else {
      this.elements.submitButton.disabled = false;
      this.elements.submitButton.innerHTML = "Register";
    }
  }

  /**
   * Returns HTML for loading spinner and text
   * Creates animated loading indicator for button
   * @returns {string} HTML for loading state
   */
  getLoadingHTML() {
    return `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Registering...
    `;
  }

  /**
   * Clears all displayed messages (both error and success)
   * Hides message containers and resets UI to clean state
   */
  clearMessages() {
    if (this.elements.errorDiv) {
      this.elements.errorDiv.classList.add("hidden");
    }
    if (this.elements.successDiv) {
      this.elements.successDiv.classList.add("hidden");
    }
  }

  /**
   * Initializes form styling and additional UI components
   * Sets up login button and other visual enhancements
   */
  initializeFormStyling() {
    this.addLoginButton();
  }

  /**
   * Adds a login button to the login container
   * Provides navigation to login page for existing users
   */
  addLoginButton() {
    if (!this.elements.loginContainer) return;

    const loginButton = createGradientButton("Login", "login.html");
    this.elements.loginContainer.appendChild(loginButton);
  }
}

// Validation Manager
class ValidationManager {
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password) {
    return password && password.length >= 8;
  }

  static validateName(name) {
    return name && name.length >= 2;
  }

  static validateAvatar(avatar) {
    if (!avatar) return true; // Avatar is optional

    try {
      new URL(avatar);
      return true;
    } catch {
      return false;
    }
  }

  static validateForm(formData) {
    const errors = [];

    if (!formData.name) {
      errors.push("Name is required");
    } else if (!this.validateName(formData.name)) {
      errors.push("Name must be at least 2 characters long");
    }

    if (!formData.email) {
      errors.push("Email is required");
    } else if (!this.validateEmail(formData.email)) {
      errors.push("Please enter a valid email address");
    }

    if (!formData.password) {
      errors.push("Password is required");
    } else if (!this.validatePassword(formData.password)) {
      errors.push("Password must be at least 8 characters long");
    }

    if (formData.avatar && !this.validateAvatar(formData.avatar)) {
      errors.push("Please enter a valid avatar URL");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Error Handler
class ErrorHandler {
  static getErrorMessage(error) {
    if (!navigator.onLine) {
      return "Network error. Please check your internet connection.";
    }

    if (
      error.message.includes("409") ||
      error.message.includes("already exists")
    ) {
      return "An account with this email already exists. Please use a different email or try logging in.";
    }

    if (error.message.includes("400")) {
      return "Invalid registration data. Please check your information and try again.";
    }

    return error.message || "Registration failed. Please try again.";
  }
}

// Authentication Service
class AuthService {
  static async register(userData) {
    try {
      await registerUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: ErrorHandler.getErrorMessage(error),
      };
    }
  }
}

/**
 * MAIN REGISTRATION PAGE CONTROLLER
 * =================================
 *
 * The primary controller class that orchestrates all registration page functionality.
 * Manages initialization, coordinates between managers, and sets up event handling
 * for the complete registration user experience.
 */
class RegistrationController {
  constructor() {
    // Initialize all manager classes with proper dependencies
    this.elements = new DOMElements();
    this.ui = new UIManager(this.elements);
  }

  /**
   * Initializes the registration page application
   * Sets up form styling, event listeners, and initial UI state
   */
  init() {
    if (!this.elements.form) {
      return;
    }

    this.ui.initializeFormStyling();

    // Set up form submission handling
    this.setupEventListeners();
    this.elements.focusNameField();
  }

  /**
   * Sets up all event listeners for the registration page
   * Handles form submission and any additional user interactions
   */
  setupEventListeners() {
    this.elements.form.addEventListener("submit", (event) => {
      this.handleRegistration(event);
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

    if (this.elements.passwordField) {
      this.elements.passwordField.addEventListener("blur", () => {
        this.validatePasswordField();
      });
    }

    if (this.elements.avatarField) {
      this.elements.avatarField.addEventListener("blur", () => {
        this.validateAvatarField();
      });
    }
  }

  validateEmailField() {
    const email = this.elements.emailField.value.trim();

    if (email && !ValidationManager.validateEmail(email)) {
      this.ui.showError("Please enter a valid email address");
    } else {
      this.ui.clearMessages();
    }
  }

  validatePasswordField() {
    const password = this.elements.passwordField.value;

    if (password && !ValidationManager.validatePassword(password)) {
      this.ui.showError("Password must be at least 8 characters long");
    } else {
      this.ui.clearMessages();
    }
  }

  validateAvatarField() {
    const avatar = this.elements.avatarField.value.trim();

    if (avatar && !ValidationManager.validateAvatar(avatar)) {
      this.ui.showError("Please enter a valid avatar URL");
    } else {
      this.ui.clearMessages();
    }
  }

  async handleRegistration(event) {
    event.preventDefault();
    this.ui.clearMessages();

    const formData = this.elements.getFormData();
    const validation = ValidationManager.validateForm(formData);

    if (!validation.isValid) {
      this.ui.showError(validation.errors[0]);
      return;
    }

    await this.performRegistration(formData);
  }

  async performRegistration(userData) {
    this.ui.toggleLoadingState(true);
    try {
      // Remove empty avatar field
      if (!userData.avatar) {
        delete userData.avatar;
      }
      const result = await AuthService.register(userData);
      if (result.success) {
        // Automatically log in after registration
        try {
          await loginUser({
            email: userData.email,
            password: userData.password,
          });
          this.ui.showSuccess(
            "Registration and login successful! Redirecting to your profile...",
          );
          setTimeout(() => {
            window.location.href = "/profile.html";
          }, REDIRECT_DELAY);
        } catch (loginError) {
          this.ui.showSuccess(
            "Registration successful, but automatic login failed. Please log in manually.",
          );
          setTimeout(() => {
            window.location.href = REDIRECT_URL;
          }, REDIRECT_DELAY);
        }
      } else {
        this.ui.showError(result.error);
      }
    } catch (error) {
      this.ui.showError("An unexpected error occurred. Please try again.");
    } finally {
      this.ui.toggleLoadingState(false);
    }
  }

  handleRegistrationSuccess() {
    this.ui.showSuccess("Registration successful! Redirecting to login...");
    this.redirectAfterDelay();
  }

  redirectAfterDelay() {
    setTimeout(() => {
      window.location.href = REDIRECT_URL;
    }, REDIRECT_DELAY);
  }
}

// Export the main controller classes
export { RegistrationController, ValidationManager, ErrorHandler };
