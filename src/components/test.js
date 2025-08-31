// Returns the gradient welcome box as an HTML element for use in index.html
export function createWelcomeBox() {
  const box = document.createElement("div");
  box.className =
    "bg-gradient-to-r from-pink-400 to-purple-300 text-center p-6 md:p-12 mb-8 rounded-xl shadow-lg";
  box.innerHTML = `
    <h2 class="text-2xl md:text-3xl font-bold mb-4 text-black">
      Welcome to Pink Gavel Auctions
    </h2>
    <p class="mb-6 text-black">
      By registering, you can bid on unique items and discover new treasures!
    </p>
    <div id="home-auth-buttons" class="flex flex-col items-center gap-4"></div>
  `;
  return box;
}
