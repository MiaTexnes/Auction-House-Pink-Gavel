import { createListing } from "../library/newListing.js";
import { setMinimumDateTime } from "../utils/dateUtils.js";

/**
 * NEW LISTING MODAL MANAGER
 * =========================
 *
 * Shared modal component for creating new auction listings.
 * Handles modal display, form validation, media management,
 * and listing creation across different pages.
 */
export class NewListingModalManager {
  constructor(options = {}) {
    this.mediaUrls = [];
    this.onSuccess = options.onSuccess || null; // Callback for successful listing creation
    this.onError = options.onError || null; // Callback for errors
    this.profile = options.profile || null; // For profile page context

    // Add modals to DOM if they don't exist yet
    this.ensureModalsExist();

    // Setup all event listeners
    this.setupEventListeners();
  }

  /**
   * Ensures the modal HTML exists in the DOM
   */
  ensureModalsExist() {
    // Check if modals already exist
    if (!document.getElementById("addListingModal")) {
      // Create and append the modal HTML
      const modalContainer = document.createElement("div");
      modalContainer.innerHTML = NewListingModalManager.generateModalHTML();
      document.body.appendChild(modalContainer);
    }
  }

  /**
   * Opens the new listing modal
   */
  openModal() {
    const modal = document.getElementById("addListingModal");
    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      this.setupFormDefaults();
      this.hideError(); // Clear any previous error messages
    }
  }

  /**
   * Closes the modal and resets form state
   */
  closeModal() {
    const modal = document.getElementById("addListingModal");
    const form = document.getElementById("addListingForm");
    const mediaModal = document.getElementById("addMediaModal");

    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
    if (mediaModal) {
      mediaModal.classList.add("hidden");
      mediaModal.classList.remove("flex");
    }
    if (form) {
      form.reset();
      this.clearMediaUrls();
      this.updateMediaCountDisplay(0);
      this.resetMediaForm();
      this.hideError(); // Clear any error messages when closing
    }
  }

  /**
   * Sets up all event listeners for the modal
   */
  setupEventListeners() {
    this.setupOpenModalListener();
    this.setupCloseModalListeners();
    this.setupFormSubmissionListener();
    this.setupMediaModalEvents();
  }

  /**
   * Sets up the open modal button listeners
   */
  setupOpenModalListener() {
    // Handle both "New Listing" button (profile) and "Add Listing" button (listings)
    const newListingBtn = document.getElementById("newListingBtn");
    const addListingBtn = document.getElementById("addListingBtn");

    if (newListingBtn) {
      newListingBtn.addEventListener("click", () => this.openModal());
    }
    if (addListingBtn) {
      addListingBtn.addEventListener("click", () => this.openModal());
    }
  }

  /**
   * Sets up the close modal button listeners
   */
  setupCloseModalListeners() {
    const closeModalBtn = document.getElementById("closeAddListingModal");
    const cancelBtn = document.getElementById("cancelAddListingBtn");
    const modal = document.getElementById("addListingModal");

    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", () => this.closeModal());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.closeModal());
    }

    // Close modal when clicking outside of it
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }
  }

  /**
   * Sets up the form submission listener
   */
  setupFormSubmissionListener() {
    const form = document.getElementById("addListingForm");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleFormSubmission();
      });
    }
  }

  /**
   * Sets up media modal events
   */
  setupMediaModalEvents() {
    // Open media modal button
    const openMediaModalBtn = document.getElementById("openMediaModalBtn");
    if (openMediaModalBtn) {
      openMediaModalBtn.addEventListener("click", () => {
        this.openMediaModal();
      });
    }

    // Back button in media modal
    const backToListingBtn = document.getElementById("backToListingBtn");
    if (backToListingBtn) {
      backToListingBtn.addEventListener("click", () => {
        this.closeMediaModal();
      });
    }

    // Add more media URLs button
    const addMoreUrlBtn = document.getElementById("addMoreUrlBtn");
    if (addMoreUrlBtn) {
      addMoreUrlBtn.addEventListener("click", () => {
        this.addMoreMediaUrlInput();
      });
    }

    // Media form submission
    const addMediaForm = document.getElementById("addMediaForm");
    if (addMediaForm) {
      addMediaForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleMediaFormSubmission();
      });
    }

    // Close media modal when clicking on backdrop
    const mediaModal = document.getElementById("addMediaModal");
    if (mediaModal) {
      mediaModal.addEventListener("click", (event) => {
        if (event.target === mediaModal) {
          this.closeMediaModal();
        }
      });
    }
  }

  /**
   * Sets up form defaults and constraints
   */
  setupFormDefaults() {
    setMinimumDateTime(document.getElementById("listingEndDate"));
    this.clearMediaUrls();
    this.updateMediaCountDisplay(0);
    this.resetMediaForm();
  }

  /**
   * Opens the media upload modal
   */
  openMediaModal() {
    const mediaModal = document.getElementById("addMediaModal");
    if (mediaModal) {
      mediaModal.classList.remove("hidden");
      mediaModal.classList.add("flex");
    }
  }

  /**
   * Closes the media upload modal
   */
  closeMediaModal() {
    const mediaModal = document.getElementById("addMediaModal");
    if (mediaModal) {
      mediaModal.classList.add("hidden");
      mediaModal.classList.remove("flex");
    }
  }

  /**
   * Adds another media URL input field
   */
  addMoreMediaUrlInput() {
    const mediaUrlInputs = document.getElementById("mediaUrlInputs");
    if (mediaUrlInputs) {
      const input = document.createElement("input");
      input.type = "url";
      input.name = "mediaUrl";
      input.placeholder = "Media URL";
      input.className =
        "w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white";
      mediaUrlInputs.appendChild(input);
    }
  }

  /**
   * Handles media form submission
   */
  handleMediaFormSubmission() {
    const mediaInputs = document.querySelectorAll('input[name="mediaUrl"]');
    const urls = [];

    mediaInputs.forEach((input) => {
      const url = input.value.trim();
      if (url) {
        urls.push({ url, alt: "" });
      }
    });

    // Store the media URLs
    this.mediaUrls = urls;

    // Update the media count display
    this.updateMediaCountDisplay(urls.length);

    // Close the media modal
    this.closeMediaModal();
  }

  /**
   * Updates the media count display
   */
  updateMediaCountDisplay(count) {
    const mediaCount = document.getElementById("mediaCount");
    if (mediaCount) {
      if (count === 0) {
        mediaCount.textContent = "No media selected";
      } else if (count === 1) {
        mediaCount.textContent = "1 media item selected";
      } else {
        mediaCount.textContent = `${count} media items selected`;
      }
    }
  }

  /**
   * Resets the media form to initial state
   */
  resetMediaForm() {
    const mediaForm = document.getElementById("addMediaForm");
    if (mediaForm) {
      mediaForm.reset();
    }

    // Reset media URL inputs to initial state (2 inputs)
    const mediaUrlInputs = document.getElementById("mediaUrlInputs");
    if (mediaUrlInputs) {
      const inputs = mediaUrlInputs.querySelectorAll('input[name="mediaUrl"]');
      // Remove any additional inputs beyond the first 2
      for (let i = 2; i < inputs.length; i++) {
        inputs[i].parentNode.removeChild(inputs[i]);
      }
      // Clear values of the first 2 inputs
      if (inputs[0]) inputs[0].value = "";
      if (inputs[1]) inputs[1].value = "";
    }
  }

  /**
   * Clears stored media URLs
   */
  clearMediaUrls() {
    this.mediaUrls = [];
  }

  /**
   * Shows an error message within the modal
   */
  showError(message) {
    const errorContainer = document.getElementById("listingErrorContainer");
    const errorText = document.getElementById("listingErrorText");

    if (errorContainer && errorText) {
      errorText.textContent = message;
      errorContainer.classList.remove("hidden");
    }
  }

  /**
   * Hides the error message in the modal
   */
  hideError() {
    const errorContainer = document.getElementById("listingErrorContainer");
    if (errorContainer) {
      errorContainer.classList.add("hidden");
    }
  }

  /**
   * Handles form submission for creating new listing
   */
  async handleFormSubmission() {
    // Hide any existing error messages
    this.hideError();

    const formData = this.getFormData();

    try {
      const result = await createListing({
        title: formData.title,
        description: formData.description,
        endsAt: formData.endsAt,
        media: this.mediaUrls,
        tags: formData.tags,
      });

      this.closeModal();

      // Call success callback if provided
      if (this.onSuccess) {
        this.onSuccess(result);
      } else {
        // Default success behavior
        alert("Listing created successfully!");
        window.location.reload();
      }
    } catch (err) {
      // Show error within the modal
      this.showError(err.message || "Failed to create listing.");

      // Also call error callback if provided
      if (this.onError) {
        this.onError(err.message || "Failed to create listing.");
      }
    }
  }

  /**
   * Collects form data
   */
  getFormData() {
    const title = document.getElementById("listingTitle")?.value.trim();
    const description = document
      .getElementById("listingDescription")
      ?.value.trim();
    const endsAt = document.getElementById("listingEndDate")?.value;
    const tagsInput = document.getElementById("listingTags")?.value.trim();

    const tags = tagsInput
      ? tagsInput
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : [];

    return {
      title,
      description,
      endsAt: new Date(endsAt).toISOString(),
      tags,
    };
  }

  /**
   * Static method to generate modal HTML
   */
  static generateModalHTML() {
    return `
      <!-- Create New Listing Modal -->
      <div
        id="addListingModal"
        class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-40 p-4"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          <button
            id="closeAddListingModal"
            class="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white"
          >
            &times;
          </button>
          <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Create New Listing
          </h2>
          <!-- Error message container -->
          <div id="listingErrorContainer" class="hidden mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg dark:bg-red-900/20 dark:border-red-700 dark:text-red-400">
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
              </svg>
              <span id="listingErrorText"></span>
            </div>
          </div>
          <form id="addListingForm" class="space-y-4">
            <div>
              <input
                type="text"
                id="listingTitle"
                name="title"
                placeholder="Title"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <textarea
                id="listingDescription"
                name="description"
                placeholder="Description"
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                required
              ></textarea>
            </div>
            <div>
              <input
                type="datetime-local"
                id="listingEndDate"
                name="endsAt"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-500 dark:border-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <input
                type="text"
                id="listingTags"
                name="tags"
                placeholder="Tags (comma separated)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div class="flex items-center justify-between">
              <button
                type="button"
                id="openMediaModalBtn"
                class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Add Media
              </button>
              <span id="mediaCount" class="text-sm text-gray-600 dark:text-gray-200">
                No media selected
              </span>
            </div>
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                id="cancelAddListingBtn"
                class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Create Listing
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Media Upload Modal -->
      <div
        id="addMediaModal"
        class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 p-4"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Add Media
          </h2>
          <form id="addMediaForm" class="space-y-4">
            <div id="mediaUrlInputs">
              <input
                type="url"
                name="mediaUrl"
                placeholder="Media URL"
                class="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
              <input
                type="url"
                name="mediaUrl"
                placeholder="Media URL"
                class="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>
            <button
              type="button"
              id="addMoreUrlBtn"
              class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Add Another URL
            </button>
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                id="backToListingBtn"
                class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                class="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Add Media
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }
}
