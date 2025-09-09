// Shared utility for generating profile headers
const DEFAULT_AVATAR = "https://placehold.co/150x150?text=Avatar";

export function generateProfileHeader(profile) {
  return `
    <div class="bg-gradient-to-br from-purple-300 to-pink-300 md:from-purple-400 md:to-pink-400 text-center p-4 md:p-8 mb-6 w-full rounded-lg">
      <img src="${profile.avatar?.url || DEFAULT_AVATAR}" alt="Avatar" class="w-32 h-32 md:w-40 md:h-40 rounded-full mb-4 object-cover border-4 border-white shadow-lg mx-auto">
      <h1 class="text-2xl md:text-3xl font-bold mb-2 text-black">${profile.name}</h1>
      <h2 class="text-black text-sm md:text-base opacity-90">${profile.email}</h2>
    </div>
  `;
}
