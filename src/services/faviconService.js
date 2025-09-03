import { faviconConfig } from "../config/faviconConfig.js";

/**
 * Dynamically adds favicon links and web app manifest to the document head
 */
function addFavicons() {
  const head = document.head;

  // Add each favicon link
  faviconConfig.favicons.forEach((favicon) => {
    const link = document.createElement("link");
    link.rel = favicon.rel;

    if (favicon.type) {
      link.type = favicon.type;
    }

    if (favicon.sizes) {
      link.sizes = favicon.sizes;
    }

    link.href = favicon.href;
    head.appendChild(link);
  });

  // Add web app manifest
  const manifestLink = document.createElement("link");
  manifestLink.rel = "manifest";
  manifestLink.href = faviconConfig.manifest.href;
  head.appendChild(manifestLink);

  // Add theme color meta tag
  const themeColorMeta = document.createElement("meta");
  themeColorMeta.name = "theme-color";
  themeColorMeta.content = faviconConfig.themeColor;
  head.appendChild(themeColorMeta);
}

/**
 * Generates a web app manifest file content (for reference or dynamic generation)
 * @returns {string} JSON string of the manifest
 */
function generateManifestContent() {
  return JSON.stringify(faviconConfig.manifestData, null, 2);
}

export { addFavicons, generateManifestContent };
