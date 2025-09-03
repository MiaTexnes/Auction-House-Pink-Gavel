import { faviconConfig } from "../config/faviconConfig.js";

/**
 * Dynamically adds favicon links and web app manifest to the document head
 */
function addFavicons() {
  const head = document.head;

  // Remove any existing favicon links first
  const existingFavicons = document.querySelectorAll(
    'link[rel*="icon"], link[rel="manifest"]',
  );
  existingFavicons.forEach((link) => link.remove());

  // Add the specific favicon links as requested
  const faviconLinks = [
    {
      rel: "icon",
      type: "image/png",
      href: "/favicon/favicon-96x96.png",
      sizes: "96x96",
    },
    {
      rel: "icon",
      type: "image/svg+xml",
      href: "/favicon/favicon.svg",
    },
    {
      rel: "shortcut icon",
      href: "/favicon/favicon.ico",
    },
    {
      rel: "manifest",
      href: "/site.webmanifest",
    },
  ];

  // Create and append each favicon link
  faviconLinks.forEach((favicon) => {
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

  // Add theme color meta tag (white background)
  const themeColorMeta = document.createElement("meta");
  themeColorMeta.name = "theme-color";
  themeColorMeta.content = "#ffffff";
  head.appendChild(themeColorMeta);

  // Add meta tag to ensure white background for all favicons
  const msApplicationMeta = document.createElement("meta");
  msApplicationMeta.name = "msapplication-TileColor";
  msApplicationMeta.content = "#ffffff";
  head.appendChild(msApplicationMeta);

  // Add meta for Safari pinned tab
  const safariMeta = document.createElement("meta");
  safariMeta.name = "msapplication-navbutton-color";
  safariMeta.content = "#ffffff";
  head.appendChild(safariMeta);

  // Add meta for Apple status bar
  const appleStatusMeta = document.createElement("meta");
  appleStatusMeta.name = "apple-mobile-web-app-status-bar-style";
  appleStatusMeta.content = "default";
  head.appendChild(appleStatusMeta);
}

/**
 * Updates favicon background to always be white regardless of theme
 */
function updateFaviconBackground() {
  // Update theme-color meta tag to white
  let themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.content = "#ffffff";
  } else {
    themeColorMeta = document.createElement("meta");
    themeColorMeta.name = "theme-color";
    themeColorMeta.content = "#ffffff";
    document.head.appendChild(themeColorMeta);
  }

  // Update msapplication-TileColor to white
  let tileColorMeta = document.querySelector(
    'meta[name="msapplication-TileColor"]',
  );
  if (tileColorMeta) {
    tileColorMeta.content = "#ffffff";
  } else {
    tileColorMeta = document.createElement("meta");
    tileColorMeta.name = "msapplication-TileColor";
    tileColorMeta.content = "#ffffff";
    document.head.appendChild(tileColorMeta);
  }

  // Update Safari pinned tab color to white
  let safariMeta = document.querySelector(
    'meta[name="msapplication-navbutton-color"]',
  );
  if (safariMeta) {
    safariMeta.content = "#ffffff";
  } else {
    safariMeta = document.createElement("meta");
    safariMeta.name = "msapplication-navbutton-color";
    safariMeta.content = "#ffffff";
    document.head.appendChild(safariMeta);
  }
}

/**
 * Generates a web app manifest file content (for reference or dynamic generation)
 * @returns {string} JSON string of the manifest
 */
function generateManifestContent() {
  return JSON.stringify(faviconConfig.manifestData, null, 2);
}

export { addFavicons, generateManifestContent, updateFaviconBackground };
