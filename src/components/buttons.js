// Button components for Pink Gavel Auctions
// Button components for Pink Gavel Auctions

/**
 * Creates a gradient-styled anchor button.
 * @param {string} text - Button label text.
 * @param {string} [href="#"] - Link URL for the button.
 * @returns {HTMLAnchorElement} The styled anchor button element.
 */
export function createGradientButton(text, href = "#") {
  const btn = document.createElement("a");
  btn.href = href;
  btn.textContent = text;
  btn.className =
    "text-center py-1 px-4 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-200";
  return btn;
}

/**
 * Creates a 'Load More' button with a click handler.
 * @param {string} [text="Load More"] - Button label text.
 * @param {Function} onClick - Click event handler.
 * @param {string|null} [id=null] - Optional button id.
 * @param {string} [additionalClasses=""] - Additional CSS classes.
 * @returns {HTMLButtonElement} The styled button element.
 */
export function createLoadMoreButton(
  text = "Load More",
  onClick,
  id = null,
  additionalClasses = "",
) {
  const btn = document.createElement("button");
  if (id) btn.id = id;
  btn.textContent = text;
  btn.className = ` bg-pink-400 hover:bg-pink-600 text-gray-800 font-semibold py-3 px-8 rounded-lg transition-all shadow-md transform hover:scale-105 ${additionalClasses}`;
  btn.addEventListener("click", onClick);
  return btn;
}

/**
 * Creates a 'View Less' button with a click handler.
 * @param {string} [text="View Less"] - Button label text.
 * @param {Function} onClick - Click event handler.
 * @param {string|null} [id=null] - Optional button id.
 * @param {string} [additionalClasses=""] - Additional CSS classes.
 * @returns {HTMLButtonElement} The styled button element.
 */
export function createViewLessButton(
  text = "View Less",
  onClick,
  id = null,
  additionalClasses = "",
) {
  const btn = document.createElement("button");
  if (id) btn.id = id;
  btn.textContent = text;
  btn.className = `bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-md transform hover:scale-105 ${additionalClasses}`;
  btn.addEventListener("click", onClick);
  return btn;
}

/**
 * Creates a 'View More' button, useful for profile sections.
 * @param {string} [text="View More"] - Button label text.
 * @param {Function} onClick - Click event handler.
 * @param {string|null} [id=null] - Optional button id.
 * @param {string} [additionalClasses=""] - Additional CSS classes.
 * @returns {HTMLButtonElement} The styled button element.
 */
export function createViewMoreButton(
  text = "View More",
  onClick,
  id = null,
  additionalClasses = "",
) {
  const btn = document.createElement("button");
  if (id) btn.id = id;
  btn.textContent = text;
  btn.className = `bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-6 rounded-lg transition-all shadow-md ${additionalClasses}`;
  btn.addEventListener("click", onClick);
  return btn;
}

/**
 * Wraps an array of buttons in a flex container.
 * @param {HTMLElement[]} buttons - Array of button elements to wrap.
 * @param {string} [additionalClasses] - Additional CSS classes for the container.
 * @returns {HTMLDivElement} The container div with buttons.
 */
export function createButtonContainer(
  buttons,
  additionalClasses = "flex justify-center space-x-4 mt-8 mb-4",
) {
  const container = document.createElement("div");
  container.className = additionalClasses;

  buttons.forEach((button) => {
    if (button) {
      container.appendChild(button);
    }
  });

  return container;
}

/**
 * Creates a container with pagination buttons ('Load More' and 'View Less').
 * @param {Object} options - Pagination options.
 * @param {boolean} [options.showLoadMore=false] - Show 'Load More' button.
 * @param {boolean} [options.showViewLess=false] - Show 'View Less' button.
 * @param {string} [options.loadMoreText="Load More"] - 'Load More' button text.
 * @param {string} [options.viewLessText="View Less"] - 'View Less' button text.
 * @param {Function} [options.onLoadMore] - 'Load More' click handler.
 * @param {Function} [options.onViewLess] - 'View Less' click handler.
 * @param {string|null} [options.loadMoreId=null] - 'Load More' button id.
 * @param {string|null} [options.viewLessId=null] - 'View Less' button id.
 * @param {string} [options.containerClasses] - CSS classes for the container.
 * @returns {HTMLDivElement|null} The container div with pagination buttons, or null if none.
 */
export function createPaginationButtons(options = {}) {
  const {
    showLoadMore = false,
    showViewLess = false,
    loadMoreText = "Load More",
    viewLessText = "View Less",
    onLoadMore = () => {},
    onViewLess = () => {},
    loadMoreId = null,
    viewLessId = null,
    containerClasses = "flex justify-center space-x-4 mt-8 mb-4",
  } = options;

  const buttons = [];

  if (showViewLess) {
    buttons.push(createViewLessButton(viewLessText, onViewLess, viewLessId));
  }

  if (showLoadMore) {
    buttons.push(createLoadMoreButton(loadMoreText, onLoadMore, loadMoreId));
  }

  return buttons.length > 0
    ? createButtonContainer(buttons, containerClasses)
    : null;
}
