// Shared utility for generating profile headers
const DEFAULT_AVATAR = "https://placehold.co/150x150?text=Avatar";

export function generateProfileHeader(profile) {
  return `
    <div class="flex flex-col items-center mb-6">
      <img src="${profile.avatar?.url || DEFAULT_AVATAR}" alt="Avatar" class="w-32 h-32 rounded-full mb-4 object-cover border-4 border-pink-500">
      <h2 class="text-3xl font-bold mb-2">${profile.name}</h2>
      <p class="text-gray-600 dark:text-gray-300">${profile.email}</p>
    </div>
  `;
}
