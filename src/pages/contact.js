/**
 * CONTACT PAGE CONTROLLER
 * ======================
 *
 * This file manages the contact form functionality with comprehensive
 * validation, error handling, and user feedback. It provides a modern
 * class-based architecture with proper resource management.
 *
 * Key Features:
 * - Real-time form validation with visual feedback
 * - Input sanitization to prevent XSS attacks
 * - Comprehensive error handling and user feedback
 * - Memory leak prevention with proper cleanup
 * - Modern ES6+ syntax and patterns
 */

/**
 * APPLICATION CONSTANTS
 * Configuration values used throughout the contact page
 */
const CONSTANTS = {
  MESSAGE_DISPLAY_DURATION: 5000,
  MAX_NAME_LENGTH: 50,
  MIN_NAME_LENGTH: 2,
  MAX_MESSAGE_LENGTH: 1000,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  FORM_FIELD_SELECTOR:
    "#contact-form input, #contact-form textarea, #contact-form select",
};

/**
 * ERROR HANDLING UTILITIES
 * Centralized error handling and logging for the contact page
 */
class ErrorHandler {
  /**
   * Handles form validation errors with user-friendly messages
   * @param {Error} error - The error object
   * @param {string} context - Context where the error occurred
   * @returns {string} User-friendly error message
   */
  static handleFormError(error, context = "form validation") {
    const errorMessages = {
      "Invalid input": "Please check your input and try again.",
      "Network error": "Unable to submit form. Please check your connection.",
      "Validation failed": "Please fill in all required fields correctly.",
      "Email invalid": "Please enter a valid email address.",
    };

    const message =
      errorMessages[error.message] ||
      error.message ||
      `An error occurred during ${context}. Please try again.`;

    return message;
  }

  /**
   * Logs errors for debugging while keeping user experience smooth
   * @param {Error} error - The error object
   * @param {string} context - Context where the error occurred
   */
  static logError(error, context) {
    // In production, this would be sent to a logging service
    // Error logged in development mode
    if (import.meta.env.DEV) {
      // Development error logging
    }
  }

  /**
   * Creates a standardized error object
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {string} context - Error context
   * @returns {Object} Standardized error object
   */
  static createError(message, code = "UNKNOWN_ERROR", context = "ContactPage") {
    return {
      message,
      code,
      context,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * VALIDATION UTILITIES
 * Input validation and sanitization functions
 */
class ValidationUtils {
  /**
   * Sanitizes string input to prevent XSS
   * @param {string} input - Input string to sanitize
   * @returns {string} Sanitized string
   */
  static sanitizeString(input) {
    if (typeof input !== "string") return "";

    return input
      .replace(/[<>]/g, "") // Remove potential HTML tags
      .trim()
      .substring(0, 1000); // Limit length
  }

  /**
   * Validates email format
   * @param {string} email - Email to validate
   * @returns {Object} Validation result with isValid and message
   */
  static validateEmail(email) {
    if (!email || typeof email !== "string") {
      return { isValid: false, message: "Email is required" };
    }

    const sanitized = this.sanitizeString(email);
    if (!CONSTANTS.EMAIL_REGEX.test(sanitized)) {
      return { isValid: false, message: "Please enter a valid email address" };
    }

    return { isValid: true, message: "" };
  }

  /**
   * Validates name field
   * @param {string} name - Name to validate
   * @param {string} fieldName - Name of the field for error messages
   * @returns {Object} Validation result with isValid and message
   */
  static validateName(name, fieldName = "Name") {
    if (!name || typeof name !== "string") {
      return { isValid: false, message: `${fieldName} is required` };
    }

    const sanitized = this.sanitizeString(name);
    if (sanitized.length < CONSTANTS.MIN_NAME_LENGTH) {
      return {
        isValid: false,
        message: `${fieldName} must be at least ${CONSTANTS.MIN_NAME_LENGTH} characters long`,
      };
    }

    if (sanitized.length > CONSTANTS.MAX_NAME_LENGTH) {
      return {
        isValid: false,
        message: `${fieldName} must be no more than ${CONSTANTS.MAX_NAME_LENGTH} characters long`,
      };
    }

    return { isValid: true, message: "" };
  }

  /**
   * Validates message field
   * @param {string} message - Message to validate
   * @returns {Object} Validation result with isValid and message
   */
  static validateMessage(message) {
    if (!message || typeof message !== "string") {
      return { isValid: false, message: "Message is required" };
    }

    const sanitized = this.sanitizeString(message);
    if (sanitized.length < 10) {
      return {
        isValid: false,
        message: "Message must be at least 10 characters long",
      };
    }

    if (sanitized.length > CONSTANTS.MAX_MESSAGE_LENGTH) {
      return {
        isValid: false,
        message: `Message must be no more than ${CONSTANTS.MAX_MESSAGE_LENGTH} characters long`,
      };
    }

    return { isValid: true, message: "" };
  }

  /**
   * Validates subject field
   * @param {string} subject - Subject to validate
   * @returns {Object} Validation result with isValid and message
   */
  static validateSubject(subject) {
    if (!subject || typeof subject !== "string") {
      return { isValid: false, message: "Subject is required" };
    }

    const sanitized = this.sanitizeString(subject);
    if (sanitized.length < 3) {
      return {
        isValid: false,
        message: "Subject must be at least 3 characters long",
      };
    }

    return { isValid: true, message: "" };
  }
}

/**
 * DOM ELEMENTS MANAGER
 * Centralized management of DOM element references for the contact page
 */
class DOMElements {
  constructor() {
    this.cache = new Map();
    this.initializeElements();
  }

  /**
   * Initializes all DOM element references
   */
  initializeElements() {
    try {
      this.cache.set("contactForm", document.getElementById("contact-form"));
      this.cache.set(
        "successMessage",
        document.getElementById("success-message"),
      );
      this.cache.set(
        "closeSuccessBtn",
        document.getElementById("close-success"),
      );
      this.cache.set("firstName", document.getElementById("firstName"));
      this.cache.set("lastName", document.getElementById("lastName"));
      this.cache.set("email", document.getElementById("email"));
      this.cache.set("subject", document.getElementById("subject"));
      this.cache.set("message", document.getElementById("message"));

      // Validate critical elements
      if (!this.cache.get("contactForm")) {
        ErrorHandler.logError(
          new Error("Contact form element not found"),
          "DOMElements.initializeElements",
        );
      }
    } catch (error) {
      ErrorHandler.logError(error, "DOMElements.initializeElements");
    }
  }

  /**
   * Gets a cached DOM element
   * @param {string} key - The cache key for the element
   * @returns {HTMLElement|null} The cached DOM element or null if not found
   */
  get(key) {
    return this.cache.get(key) || null;
  }

  /**
   * Gets all form fields
   * @returns {NodeList} All form field elements
   */
  getFormFields() {
    return document.querySelectorAll(CONSTANTS.FORM_FIELD_SELECTOR);
  }

  /**
   * Clears the element cache
   */
  cleanup() {
    this.cache.clear();
  }
}

/**
 * UI MANAGER
 * Handles all UI updates and user interactions for the contact page
 */
class UIManager {
  constructor(elements) {
    this.elements = elements;
    this.messageTimeouts = new Map(); // Track message timeouts for cleanup
  }

  /**
   * Shows a message to the user with proper error handling
   * @param {string} type - Message type: "success", "error", "warning", "info"
   * @param {string} message - The message text to display
   */
  showMessage(type, message) {
    try {
      // Validate inputs
      if (!message || typeof message !== "string") {
        ErrorHandler.logError(
          new Error("Invalid message provided to showMessage"),
          "UIManager.showMessage",
        );
        return;
      }

      // Sanitize message to prevent XSS
      const sanitizedMessage = ValidationUtils.sanitizeString(message);

      // Create message element
      const messageElement = document.createElement("div");
      messageElement.className = `my-4 p-3 rounded-sm text-center transition-opacity duration-300`;

      // Add appropriate styling based on type
      const typeClasses = {
        success: "bg-green-100 text-green-800",
        error: "bg-red-100 text-red-800",
        warning: "bg-yellow-100 text-yellow-800",
        info: "bg-blue-100 text-blue-800",
      };

      messageElement.className += ` ${typeClasses[type] || typeClasses.info}`;
      messageElement.textContent = sanitizedMessage;

      // Insert message at the top of the form
      const form = this.elements.get("contactForm");
      if (form) {
        form.insertBefore(messageElement, form.firstChild);

        // Set up auto-removal with cleanup
        const timeoutId = setTimeout(() => {
          try {
            messageElement.remove();
          } catch (error) {
            ErrorHandler.logError(error, "UIManager.showMessage.timeout");
          }
        }, CONSTANTS.MESSAGE_DISPLAY_DURATION);

        // Store timeout for potential cleanup
        this.messageTimeouts.set(messageElement, timeoutId);
      }
    } catch (error) {
      ErrorHandler.logError(error, "UIManager.showMessage");
    }
  }

  /**
   * Shows the success modal
   */
  showSuccessModal() {
    try {
      const successMessage = this.elements.get("successMessage");
      if (successMessage) {
        successMessage.classList.remove("hidden");
        successMessage.classList.add("flex", "items-center", "justify-center");
      }
    } catch (error) {
      ErrorHandler.logError(error, "UIManager.showSuccessModal");
    }
  }

  /**
   * Hides the success modal
   */
  hideSuccessModal() {
    try {
      const successMessage = this.elements.get("successMessage");
      if (successMessage) {
        successMessage.classList.add("hidden");
        successMessage.classList.remove(
          "flex",
          "items-center",
          "justify-center",
        );
      }
    } catch (error) {
      ErrorHandler.logError(error, "UIManager.hideSuccessModal");
    }
  }

  /**
   * Shows field validation error
   * @param {HTMLElement} field - The form field element
   * @param {string} message - Error message to display
   */
  showFieldError(field, message) {
    try {
      if (!field) return;

      // Add error styling
      field.classList.add("border-red-500");
      field.classList.remove("border-gray-300", "dark:border-gray-600");

      // Create or update error message
      let errorElement = field.parentElement.querySelector(".field-error");
      if (!errorElement) {
        errorElement = document.createElement("div");
        errorElement.className = "field-error text-red-500 text-sm mt-1";
        field.parentElement.appendChild(errorElement);
      }

      errorElement.textContent = ValidationUtils.sanitizeString(message);
    } catch (error) {
      ErrorHandler.logError(error, "UIManager.showFieldError");
    }
  }

  /**
   * Clears field validation error
   * @param {HTMLElement} field - The form field element
   */
  clearFieldError(field) {
    try {
      if (!field) return;

      // Remove error styling
      field.classList.remove("border-red-500");
      field.classList.add("border-gray-300", "dark:border-gray-600");

      // Remove error message
      const errorElement = field.parentElement.querySelector(".field-error");
      if (errorElement) {
        errorElement.remove();
      }
    } catch (error) {
      ErrorHandler.logError(error, "UIManager.clearFieldError");
    }
  }

  /**
   * Clears all messages and timeouts
   */
  clearAllMessages() {
    try {
      // Clear all timeouts
      this.messageTimeouts.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      this.messageTimeouts.clear();

      // Remove all message elements
      const form = this.elements.get("contactForm");
      if (form) {
        const messages = form.querySelectorAll(".my-4");
        messages.forEach((message) => {
          if (message.parentNode) {
            message.parentNode.removeChild(message);
          }
        });
      }
    } catch (error) {
      ErrorHandler.logError(error, "UIManager.clearAllMessages");
    }
  }

  /**
   * Cleans up resources
   */
  cleanup() {
    this.clearAllMessages();
  }
}

/**
 * FORM VALIDATOR
 * Handles form validation logic
 */
class FormValidator {
  constructor(elements, ui) {
    this.elements = elements;
    this.ui = ui;
  }

  /**
   * Validates the entire contact form
   * @returns {boolean} True if form is valid, false otherwise
   */
  validateForm() {
    try {
      let isValid = true;

      // Validate first name
      const firstName = this.elements.get("firstName");
      const firstNameValue = firstName?.value?.trim() || "";
      const firstNameValidation = ValidationUtils.validateName(
        firstNameValue,
        "First name",
      );
      if (!firstNameValidation.isValid) {
        this.ui.showFieldError(firstName, firstNameValidation.message);
        isValid = false;
      } else {
        this.ui.clearFieldError(firstName);
      }

      // Validate last name
      const lastName = this.elements.get("lastName");
      const lastNameValue = lastName?.value?.trim() || "";
      const lastNameValidation = ValidationUtils.validateName(
        lastNameValue,
        "Last name",
      );
      if (!lastNameValidation.isValid) {
        this.ui.showFieldError(lastName, lastNameValidation.message);
        isValid = false;
      } else {
        this.ui.clearFieldError(lastName);
      }

      // Validate email
      const email = this.elements.get("email");
      const emailValue = email?.value?.trim() || "";
      const emailValidation = ValidationUtils.validateEmail(emailValue);
      if (!emailValidation.isValid) {
        this.ui.showFieldError(email, emailValidation.message);
        isValid = false;
      } else {
        this.ui.clearFieldError(email);
      }

      // Validate subject
      const subject = this.elements.get("subject");
      const subjectValue = subject?.value?.trim() || "";
      const subjectValidation = ValidationUtils.validateSubject(subjectValue);
      if (!subjectValidation.isValid) {
        this.ui.showFieldError(subject, subjectValidation.message);
        isValid = false;
      } else {
        this.ui.clearFieldError(subject);
      }

      // Validate message
      const message = this.elements.get("message");
      const messageValue = message?.value?.trim() || "";
      const messageValidation = ValidationUtils.validateMessage(messageValue);
      if (!messageValidation.isValid) {
        this.ui.showFieldError(message, messageValidation.message);
        isValid = false;
      } else {
        this.ui.clearFieldError(message);
      }

      return isValid;
    } catch (error) {
      ErrorHandler.logError(error, "FormValidator.validateForm");
      return false;
    }
  }

  /**
   * Validates a single field in real-time
   * @param {HTMLElement} field - The field to validate
   */
  validateField(field) {
    try {
      if (!field) return;

      const fieldName = field.name || field.id;
      const fieldValue = field.value?.trim() || "";

      let validation;

      switch (fieldName) {
        case "firstName":
        case "lastName":
          validation = ValidationUtils.validateName(
            fieldValue,
            fieldName === "firstName" ? "First name" : "Last name",
          );
          break;
        case "email":
          validation = ValidationUtils.validateEmail(fieldValue);
          break;
        case "subject":
          validation = ValidationUtils.validateSubject(fieldValue);
          break;
        case "message":
          validation = ValidationUtils.validateMessage(fieldValue);
          break;
        default:
          return;
      }

      if (!validation.isValid) {
        this.ui.showFieldError(field, validation.message);
      } else {
        this.ui.clearFieldError(field);
      }
    } catch (error) {
      ErrorHandler.logError(error, "FormValidator.validateField");
    }
  }
}

/**
 * CONTACT FORM CONTROLLER
 * Main controller class that orchestrates all contact form functionality
 */
class ContactFormController {
  constructor() {
    this.elements = new DOMElements();
    this.ui = new UIManager(this.elements);
    this.validator = new FormValidator(this.elements, this.ui);
    this.isInitialized = false;
    this.eventListeners = new Map(); // Track event listeners for cleanup
  }

  /**
   * Initializes the contact form functionality
   */
  async init() {
    try {
      // Prevent duplicate initialization
      if (this.isInitialized) {
        return;
      }

      const contactForm = this.elements.get("contactForm");
      if (!contactForm) {
        ErrorHandler.logError(
          new Error("Contact form not found"),
          "ContactFormController.init",
        );
        return;
      }

      this.setupFormSubmission();
      this.setupSuccessModal();
      this.setupFormFieldEnhancements();
      this.setupCleanupEvents();

      this.isInitialized = true;

      // Log successful initialization
      // Controller initialized successfully
      if (import.meta.env.DEV) {
        // Development initialization logging
      }
    } catch (error) {
      ErrorHandler.logError(error, "ContactFormController.init");
    }
  }

  /**
   * Sets up form submission handling
   */
  setupFormSubmission() {
    try {
      const contactForm = this.elements.get("contactForm");
      if (!contactForm) return;

      const submitHandler = (e) => {
        e.preventDefault();
        this.handleFormSubmission();
      };

      contactForm.addEventListener("submit", submitHandler);
      this.eventListeners.set("formSubmit", {
        element: contactForm,
        handler: submitHandler,
        event: "submit",
      });
    } catch (error) {
      ErrorHandler.logError(error, "ContactFormController.setupFormSubmission");
    }
  }

  /**
   * Sets up success modal functionality
   */
  setupSuccessModal() {
    try {
      const closeSuccessBtn = this.elements.get("closeSuccessBtn");
      const successMessage = this.elements.get("successMessage");

      if (closeSuccessBtn && successMessage) {
        // Close button handler
        const closeHandler = () => {
          this.ui.hideSuccessModal();
        };

        // Backdrop click handler
        const backdropHandler = (e) => {
          if (e.target === successMessage) {
            this.ui.hideSuccessModal();
          }
        };

        closeSuccessBtn.addEventListener("click", closeHandler);
        successMessage.addEventListener("click", backdropHandler);

        this.eventListeners.set("closeSuccess", {
          element: closeSuccessBtn,
          handler: closeHandler,
          event: "click",
        });
        this.eventListeners.set("backdropClick", {
          element: successMessage,
          handler: backdropHandler,
          event: "click",
        });
      }
    } catch (error) {
      ErrorHandler.logError(error, "ContactFormController.setupSuccessModal");
    }
  }

  /**
   * Sets up form field enhancements and real-time validation
   */
  setupFormFieldEnhancements() {
    try {
      const formFields = this.elements.getFormFields();

      formFields.forEach((field) => {
        // Focus handler
        const focusHandler = () => {
          field.parentElement.classList.add("focused");
        };

        // Blur handler with validation
        const blurHandler = () => {
          field.parentElement.classList.remove("focused");
          this.validator.validateField(field);
        };

        // Input handler for real-time validation
        const inputHandler = () => {
          // Clear errors on input
          this.ui.clearFieldError(field);
        };

        field.addEventListener("focus", focusHandler);
        field.addEventListener("blur", blurHandler);
        field.addEventListener("input", inputHandler);

        this.eventListeners.set(`focus-${field.id}`, {
          element: field,
          handler: focusHandler,
          event: "focus",
        });
        this.eventListeners.set(`blur-${field.id}`, {
          element: field,
          handler: blurHandler,
          event: "blur",
        });
        this.eventListeners.set(`input-${field.id}`, {
          element: field,
          handler: inputHandler,
          event: "input",
        });
      });
    } catch (error) {
      ErrorHandler.logError(
        error,
        "ContactFormController.setupFormFieldEnhancements",
      );
    }
  }

  /**
   * Sets up cleanup event listeners
   */
  setupCleanupEvents() {
    try {
      // Cleanup on page unload
      const beforeUnloadHandler = () => {
        this.cleanup();
      };

      window.addEventListener("beforeunload", beforeUnloadHandler);
      this.eventListeners.set("beforeUnload", {
        element: window,
        handler: beforeUnloadHandler,
        event: "beforeunload",
      });
    } catch (error) {
      ErrorHandler.logError(error, "ContactFormController.setupCleanupEvents");
    }
  }

  /**
   * Handles form submission with validation and processing
   */
  async handleFormSubmission() {
    try {
      // Clear any existing messages
      this.ui.clearAllMessages();

      // Validate form
      if (!this.validator.validateForm()) {
        this.ui.showMessage(
          "error",
          "Please correct the errors above and try again.",
        );
        return;
      }

      // Show loading state
      this.ui.showMessage("info", "Submitting your message...");

      // Simulate form submission (replace with actual API call)
      await this.simulateFormSubmission();

      // Show success
      this.ui.showMessage(
        "success",
        "Thank you! Your message has been sent successfully.",
      );
      this.ui.showSuccessModal();

      // Reset form
      this.resetForm();
    } catch (error) {
      ErrorHandler.logError(
        error,
        "ContactFormController.handleFormSubmission",
      );
      this.ui.showMessage(
        "error",
        ErrorHandler.handleFormError(error, "submitting form"),
      );
    }
  }

  /**
   * Simulates form submission (replace with actual API call)
   * @returns {Promise<void>}
   */
  async simulateFormSubmission() {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }

  /**
   * Resets the form and clears all validation states
   */
  resetForm() {
    try {
      const contactForm = this.elements.get("contactForm");
      if (contactForm) {
        contactForm.reset();
      }

      // Clear all field errors
      const formFields = this.elements.getFormFields();
      formFields.forEach((field) => {
        this.ui.clearFieldError(field);
      });

      // Clear all messages
      this.ui.clearAllMessages();
    } catch (error) {
      ErrorHandler.logError(error, "ContactFormController.resetForm");
    }
  }

  /**
   * Cleans up resources and event listeners
   */
  cleanup() {
    try {
      // Remove all event listeners
      this.eventListeners.forEach(({ element, handler, event }) => {
        if (element && typeof element.removeEventListener === "function") {
          element.removeEventListener(event, handler);
        }
      });
      this.eventListeners.clear();

      // Clear UI messages
      this.ui.cleanup();

      // Clear DOM element cache
      this.elements.cleanup();

      // Reset initialization state
      this.isInitialized = false;

      // Log cleanup for debugging
      // Cleanup completed
      if (import.meta.env.DEV) {
        // Development cleanup logging
      }
    } catch (error) {
      ErrorHandler.logError(error, "ContactFormController.cleanup");
    }
  }
}

// Create global controller instance
let contactController = null;

/**
 * Initializes the contact page
 * Public function for external use
 */
function initializeContactPage() {
  try {
    if (!contactController) {
      contactController = new ContactFormController();
    }
    return contactController.init();
  } catch (error) {
    ErrorHandler.logError(error, "initializeContactPage");
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use initializeContactPage() instead
 */
function initializeContactForm() {
  return initializeContactPage();
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use initializeContactPage() instead
 */
function initializeSuccessModal() {
  return initializeContactPage();
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use ContactFormController.validator.validateForm() instead
 */
function validateContactForm() {
  if (contactController) {
    return contactController.validator.validateForm();
  }
  return false;
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initializeContactPage();
});

// Export functions for external use
export {
  initializeContactPage,
  initializeContactForm,
  initializeSuccessModal,
  validateContactForm,
  ContactFormController,
  ErrorHandler,
  ValidationUtils,
};
