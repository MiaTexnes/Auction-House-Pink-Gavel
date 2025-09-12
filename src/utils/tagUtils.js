// Shared utility for processing tags
export function processTags(tagsString, maxTags = 10) {
  if (!tagsString || typeof tagsString !== "string") {
    return [];
  }

  return tagsString
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, maxTags);
}
