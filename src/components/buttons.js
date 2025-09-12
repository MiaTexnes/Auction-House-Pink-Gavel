// Reusable button components for Pink Gavel Auctions

export function createGradientButton(text, href = "#") {
  const btn = document.createElement("a");
  btn.href = href;
  btn.textContent = text;
  btn.className =
    "text-center py-1 px-4 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-200";
  return btn;
}

export function createGradientSubmitButton(text) {
  const btn = document.createElement("button");
  btn.type = "submit";
  btn.textContent = text;
  btn.className =
    "w-full text-center py-3 px-4 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  return btn;
}

export function createPinkGreenGradientButton(text, href = "#") {
  const btn = document.createElement("a");
  btn.href = href;
  btn.textContent = text;
  btn.className =
    "text-center py-1 px-4 rounded-full bg-gradient-to-br from-pink-500 to-green-500 text-white font-semibold shadow-md hover:from-pink-600 hover:to-green-600 transition-all duration-200";
  return btn;
}

export function createPinkGreenGradientSubmitButton(text) {
  const btn = document.createElement("button");
  btn.type = "submit";
  btn.textContent = text;
  btn.className =
    "w-full text-center py-3 px-4 rounded-full bg-gradient-to-br from-pink-500 to-green-500 text-white font-semibold shadow-md hover:from-pink-600 hover:to-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  return btn;
}

export function getPinkGreenGradientButtonClasses() {
  return "w-full text-center py-3 px-4 rounded-full bg-gradient-to-br from-pink-500 to-green-500 text-white font-semibold shadow-md hover:from-pink-600 hover:to-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
}

export function getGradientButtonClasses() {
  return "text-center py-3 px-4 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
}

// Load More Button Component
export function createLoadMoreButton(
  text = "Load More",
  onClick,
  id = null,
  additionalClasses = "",
) {
  const btn = document.createElement("button");
  if (id) btn.id = id;
  btn.textContent = text;
  btn.className = `bg-pink-400 hover:bg-pink-600 text-gray-800 font-semibold py-3 px-8 rounded-lg transition-all shadow-md transform hover:scale-105 ${additionalClasses}`;
  btn.addEventListener("click", onClick);
  return btn;
}

// View Less Button Component
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

// View More Button Component (for profile sections)
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

// Button Container Component
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

// Pagination Buttons Helper
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

// Profile View More/Less Buttons Helper
export function createProfileViewButtons(options = {}) {
  const {
    showViewMore = false,
    showViewLess = false,
    viewMoreText = "View More",
    viewLessText = "View Less",
    onViewMore = () => {},
    onViewLess = () => {},
    viewMoreId = null,
    viewLessId = null,
    containerClasses = "flex justify-center space-x-4 mt-4",
  } = options;

  const buttons = [];

  if (showViewMore) {
    buttons.push(createViewMoreButton(viewMoreText, onViewMore, viewMoreId));
  }

  if (showViewLess) {
    buttons.push(
      createViewMoreButton(viewLessText, onViewLess, viewLessId, "hidden"),
    );
  }

  return buttons.length > 0
    ? createButtonContainer(buttons, containerClasses)
    : null;
}
