// Contact page functionality

// Contact form handling
function initializeContactForm() {
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Show success message
      const successMessage = document.getElementById("success-message");
      if (successMessage) {
        successMessage.classList.remove("hidden");
        successMessage.classList.add("flex", "items-center", "justify-center");
      }

      // Reset form
      this.reset();
    });
  }
}

// Close success message functionality
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

// Form validation
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

// Enhanced form submission with validation
function initializeEnhancedContactForm() {
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Validate form before submitting
      if (validateContactForm()) {
        // Show success message
        const successMessage = document.getElementById("success-message");
        if (successMessage) {
          successMessage.classList.remove("hidden");
          successMessage.classList.add(
            "flex",
            "items-center",
            "justify-center",
          );
        }

        // Reset form
        this.reset();
      }
    });
  }
}

// Initialize all contact page functionality
function initializeContactPage() {
  // Initialize form with validation
  initializeEnhancedContactForm();

  // Initialize success modal
  initializeSuccessModal();

  // Add form field enhancements
  addFormFieldEnhancements();
}

// Add enhanced form field interactions
function addFormFieldEnhancements() {
  const formFields = document.querySelectorAll(
    "#contact-form input, #contact-form textarea, #contact-form select",
  );

  formFields.forEach((field) => {
    // Add focus and blur effects
    field.addEventListener("focus", function () {
      this.parentElement.classList.add("focused");
    });

    field.addEventListener("blur", function () {
      this.parentElement.classList.remove("focused");

      // Add validation feedback
      if (this.hasAttribute("required") && !this.value.trim()) {
        this.classList.add("border-red-500");
        this.classList.remove("border-gray-300", "dark:border-gray-600");
      } else {
        this.classList.remove("border-red-500");
        this.classList.add("border-gray-300", "dark:border-gray-600");
      }
    });
  });
}

// Auto-initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initializeContactPage();
});

// Export functions for potential use by other modules
export {
  initializeContactPage,
  initializeContactForm,
  initializeSuccessModal,
  validateContactForm,
};
