/**
 * Contact Page Controller
 * Handles contact form submission, validation, and user interactions
 * Provides enhanced form field feedback and success notifications
 */

/**
 * Initializes basic contact form with simple submission handling
 * Shows success message and resets form on submission
 */
function initializeContactForm() {
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Display success notification to user
      const successMessage = document.getElementById("success-message");
      if (successMessage) {
        successMessage.classList.remove("hidden");
        successMessage.classList.add("flex", "items-center", "justify-center");
      }

      // Clear form fields for next use
      this.reset();
    });
  }
}

/**
 * Sets up success modal close functionality
 * Allows users to dismiss success notifications
 */
function initializeSuccessModal() {
  const closeSuccessBtn = document.getElementById("close-success");
  const successMessage = document.getElementById("success-message");

  if (closeSuccessBtn && successMessage) {
    // Close success message when clicking the close button
    closeSuccessBtn.addEventListener("click", function () {
      successMessage.classList.add("hidden");
      successMessage.classList.remove("flex", "items-center", "justify-center");
    });

    // Close success message when clicking outside the modal
    successMessage.addEventListener("click", function (e) {
      if (e.target === this) {
        this.classList.add("hidden");
        this.classList.remove("flex", "items-center", "justify-center");
      }
    });
  }
}

/**
 * Validates all required form fields before submission
 * @returns {boolean} True if form is valid, false otherwise
 */
function validateContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return false;

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();
  const subject = document.getElementById("subject").value;
  const message = document.getElementById("message").value.trim();

  // Basic validation
  if (!firstName || !lastName || !email || !subject || !message) {
    alert("Please fill in all required fields.");
    return false;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Please enter a valid email address.");
    return false;
  }

  return true;
}

/**
 * Enhanced form submission with comprehensive validation
 * Includes field validation before showing success state
 */
function initializeEnhancedContactForm() {
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Only proceed if all fields are valid
      if (validateContactForm()) {
        const successMessage = document.getElementById("success-message");
        if (successMessage) {
          successMessage.classList.remove("hidden");
          successMessage.classList.add(
            "flex",
            "items-center",
            "justify-center",
          );
        }
        this.reset();
      }
    });
  }
}

/**
 * Adds interactive enhancements to form fields
 * Provides visual feedback on focus/blur and validation states
 */
function addFormFieldEnhancements() {
  const formFields = document.querySelectorAll(
    "#contact-form input, #contact-form textarea, #contact-form select",
  );

  formFields.forEach((field) => {
    // Visual feedback when user focuses on field
    field.addEventListener("focus", function () {
      this.parentElement.classList.add("focused");
    });

    // Validation feedback when user leaves field
    field.addEventListener("blur", function () {
      this.parentElement.classList.remove("focused");

      // Show error state for empty required fields
      if (this.hasAttribute("required") && !this.value.trim()) {
        this.classList.add("border-red-500");
        this.classList.remove("border-gray-300", "dark:border-gray-600");
      } else {
        // Reset to normal state for valid fields
        this.classList.remove("border-red-500");
        this.classList.add("border-gray-300", "dark:border-gray-600");
      }
    });
  });
}

/**
 * Main initialization function for contact page
 * Coordinates all contact page functionality
 */
function initializeContactPage() {
  initializeEnhancedContactForm();
  initializeSuccessModal();
  addFormFieldEnhancements();
}

// Auto-initialize when page loads
document.addEventListener("DOMContentLoaded", function () {
  initializeContactPage();
});

export {
  initializeContactPage,
  initializeContactForm,
  initializeSuccessModal,
  validateContactForm,
};
