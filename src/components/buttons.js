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
