import { createListing } from "../library/newListing.js";
import { setMinimumDateTime } from "../utils/dateUtils.js";

/**
 * Manages the creation and display of auction listing modals.
 * Provides a reusable component for new listing creation with media uploads.
 * Handles modal display, form validation, media URL management, and callbacks.
 * @class NewListingModalManager
 */
export class NewListingModalManager {
  /**
   * @constructor
   * @param {Object} [options={}] - Optional configuration object
   * @param {Function} [options.onSuccess] - Callback for successful listing creation
   * @param {Function} [options.onError] - Callback for error during listing creation
   */
  constructor(options = {}) {
    // Store media URLs for the listing
    this.mediaUrls = [];

    /**
     * @type {?Function}
     */
    this.onSuccess = options.onSuccess || null;
    /**
     * @type {?Function}
     */
    this.onError = options.onError || null;

    // Initialize modal HTML and event listeners
    this.ensureModalsExist();
    this.setupEventListeners();
  }

  /**
   * Injects modal HTML into DOM if not already present.
   * Prevents duplicate modals when multiple instances are created.
   */
  ensureModalsExist() {
    if (!document.getElementById("addListingModal")) {
      const modalContainer = document.createElement("div");
      modalContainer.innerHTML = NewListingModalManager.generateModalHTML();
      document.body.appendChild(modalContainer);
    }
  }

  /**
   * Opens the new listing modal and prepares form for user input.
   */
  openModal() {
    const modal = document.getElementById("addListingModal");
    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      this.setupFormDefaults();
      this.hideError();
    }
  }

  /**
   * Closes the modal and resets all form data and state.
   */
  closeModal() {
    const modal = document.getElementById("addListingModal");
    const form = document.getElementById("addListingForm");
    const mediaModal = document.getElementById("addMediaModal");

    // Hide both modals
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
    if (mediaModal) {
      mediaModal.classList.add("hidden");
      mediaModal.classList.remove("flex");
    }

    // Reset all form data and state
    if (form) {
      form.reset();
      this.clearMediaUrls();
      this.updateMediaCountDisplay(0);
      this.resetMediaForm();
      this.hideError();
    }
  }

  /**
   * Sets up all event listeners for modal functionality.
   */
  setupEventListeners() {
    this.setupOpenModalListener();
    this.setupCloseModalListeners();
    this.setupFormSubmissionListener();
    this.setupMediaModalEvents();
  }

  /**
   * Attaches click handlers to buttons that open the modal.
   */
  setupOpenModalListener() {
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
   * Attaches close handlers for various modal close triggers.
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

    // Close modal when clicking outside the content area
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }
  }

  /**
   * Sets up form submission handling for listing creation.
   */
  setupFormSubmissionListener() {
    const form = document.getElementById("addListingForm");
    if (form) {
      // Mark form as managed to prevent duplicate listeners
      form.dataset.managed = "newListingModalManager";
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleFormSubmission();
      });
    }
  }

  /**
   * Sets up all media modal related event handlers for media modal navigation and submission.
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

    // Add more media URL input fields
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

    // Close media modal on backdrop click
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
   * Prepares the form with default values and constraints.
   * Sets minimum date/time and resets media state.
   */
  setupFormDefaults() {
    setMinimumDateTime(document.getElementById("listingEndDate"));
    this.clearMediaUrls();
    this.updateMediaCountDisplay(0);
    this.resetMediaForm();
  }

  /**
   * Opens the media upload modal.
   */
  openMediaModal() {
    const mediaModal = document.getElementById("addMediaModal");
    if (mediaModal) {
      mediaModal.classList.remove("hidden");
      mediaModal.classList.add("flex");
    }
  }

  /**
   * Closes the media upload modal.
   */
  closeMediaModal() {
    const mediaModal = document.getElementById("addMediaModal");
    if (mediaModal) {
      mediaModal.classList.add("hidden");
      mediaModal.classList.remove("flex");
    }
  }

  /**
   * Dynamically adds another URL input field to the media form.
   * Allows users to add multiple media items to their listing.
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
   * Processes media form submission and stores URL data.
   * Collects all valid URLs and updates the media count display.
   */
  handleMediaFormSubmission() {
    const mediaInputs = document.querySelectorAll('input[name="mediaUrl"]');
    const urls = [];

    // Collect all valid URLs from input fields
    mediaInputs.forEach((input) => {
      const url = input.value.trim();
      if (url) {
        urls.push({ url, alt: "" });
      }
    });

    // Store URLs and update UI
    this.mediaUrls = urls;
    this.updateMediaCountDisplay(urls.length);
    this.closeMediaModal();
  }

  /**
   * Updates the media count display text based on number of items.
   * Provides user feedback on how many media items are selected.
   * @param {number} count - Number of media items selected
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
   * Resets the media form to its initial state.
   * Removes extra input fields and clears existing values.
   */
  resetMediaForm() {
    const mediaForm = document.getElementById("addMediaForm");
    if (mediaForm) {
      mediaForm.reset();
    }

    // Reset to initial 2 input fields and clear their values
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
   * Clears the stored media URLs array.
   */
  clearMediaUrls() {
    this.mediaUrls = [];
  }

  /**
   * Displays an error message within the modal.
   * @param {string} message - Error message to display
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
   * Hides any displayed error messages.
   */
  hideError() {
    const errorContainer = document.getElementById("listingErrorContainer");
    if (errorContainer) {
      errorContainer.classList.add("hidden");
    }
  }

  /**
   * Handles the main form submission for creating a new listing.
   * Validates data, calls API, and handles success/error responses.
   * @returns {Promise<void>}
   */
  async handleFormSubmission() {
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

      // Success callback or default behavior
      if (this.onSuccess) {
        this.onSuccess(result);
      } else {
        alert("Listing created successfully!");
        window.location.reload();
      }
    } catch (err) {
      this.showError(err.message || "Failed to create listing.");
      if (this.onError) {
        this.onError(err.message || "Failed to create listing.");
      }
    }
  }

  /**
   * Extracts and formats form data for API submission.
   * Handles data validation and transformation.
   * @returns {Object} Form data object
   */
  getFormData() {
    const title = document.getElementById("listingTitle")?.value.trim();
    const description = document
      .getElementById("listingDescription")
      ?.value.trim();
    const endsAt = document.getElementById("listingEndDate")?.value;
    const tagsRaw = document.getElementById("listingTags")?.value.trim() || "";

    return {
      title,
      description,
      endsAt: new Date(endsAt).toISOString(),
      tags: tagsRaw,
    };
  }

  /**
   * Generates the complete HTML structure for both modals.
   * @returns {string} Static HTML string for injection into DOM
   */
  static generateModalHTML() {
    return `
      <!-- Main New Listing Modal -->
      <div
        id="addListingModal"
        class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-40 p-4"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative"
        >
          <!-- Close Button -->
          <button
            id="closeAddListingModal"
            class="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white text-2xl leading-none"
          >
            &times;
          </button>

          <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Create New Listing
          </h2>

          <!-- Error Message Container -->
          <div id="listingErrorContainer" class="hidden mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg dark:bg-red-900/20 dark:border-red-700 dark:text-red-400">
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
              </svg>
              <span id="listingErrorText"></span>
            </div>
          </div>

          <!-- Listing Creation Form -->
          <form id="addListingForm" class="space-y-4">
  <!-- Title Input -->
  <div>
    <label for="listingTitle" class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Title</label>
    <input
      type="text"
      id="listingTitle"
      name="title"
      placeholder="Title"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
      required
    />
  </div>

  <!-- Description Textarea -->
  <div>
    <label for="listingDescription" class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Description</label>
    <textarea
      id="listingDescription"
      name="description"
      placeholder="Description"
      rows="4"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
      required
    ></textarea>
  </div>

            <!-- End Date Input -->
           <div>
  <label for="listingEndDate" class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">End Date</label>
  <input
    type="datetime-local"
    id="listingEndDate"
    name="endsAt"
    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-500 dark:border-gray-700 dark:text-white"
    required
  />
</div>

            <!-- Tags Input -->
            <div>
  <label for="listingTags" class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Tags</label>
  <input
    type="text"
    id="listingTags"
    name="tags"
    placeholder="Tags (comma separated)"
    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
  />
</div>

            <!-- Media Section -->
            <div class="flex items-center justify-between">
  <label for="openMediaModalBtn" class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
    Media
  </label>
  <button
    type="button"
    id="openMediaModalBtn"
    class="bg-blue-500 hover:bg-blue-600 text-black font-semibold py-2 px-4 rounded-lg transition-colors"
    aria-labelledby="openMediaModalBtn"
  >
    Add Media
  </button>
  <span id="mediaCount" class="text-sm text-gray-600 dark:text-gray-200">
    No media selected
  </span>
</div>

            <!-- Form Action Buttons -->
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
                class="bg-pink-500 hover:bg-pink-600 text-black font-semibold py-2 px-4 rounded-lg transition-colors"
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

          <!-- Media URL Form -->
          <form id="addMediaForm" class="space-y-4">
            <!-- Initial Media URL Inputs -->
            <div id="mediaUrlInputs">
              <div id="mediaUrlInputs">
  <label for="mediaUrl1" class="sr-only">Media URL 1</label>
  <input
    type="url"
    id="mediaUrl1"
    name="mediaUrl"
    placeholder="Media URL"
    class="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
  />
  <label for="mediaUrl2" class="sr-only">Media URL 2</label>
  <input
    type="url"
    id="mediaUrl2"
    name="mediaUrl"
    placeholder="Media URL"
    class="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
  />
</div>

            <!-- Add More URLs Button -->
            <button
              type="button"
              id="addMoreUrlBtn"
              class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
            >
              Add Another URL
            </button>

            <!-- Media Modal Action Buttons -->
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
