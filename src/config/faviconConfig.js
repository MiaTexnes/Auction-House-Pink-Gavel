// Centralized favicon and web app manifest configuration
export const faviconConfig = {
  // Basic favicon info
  basePath: "/favicon",

  // Favicon files configuration
  favicons: [
    {
      rel: "icon",
      type: "image/x-icon",
      href: "/favicon/favicon.ico",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      href: "/favicon/favicon-16x16.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      href: "/favicon/favicon-32x32.png",
    },
    {
      rel: "apple-touch-icon",
      href: "/favicon/apple-touch-icon.png",
    },
  ],

  // Web app manifest configuration
  manifest: {
    href: "/favicon/site.webmanifest",
  },

  // Theme color for browsers
  themeColor: "#ec4899",

  // Background color for favicons and app icons
  backgroundColor: "#ffffff",

  // Manifest data (for generating the manifest file if needed)
  manifestData: {
    name: "Pink Gavel Auctions",
    short_name: "Pink Gavel",
    description:
      "Discover amazing deals and rare finds! Bid on treasures or sell your items to collectors worldwide.",
    icons: [
      {
        src: "/favicon/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    theme_color: "#ec4899",
    background_color: "#ffffff",
    display: "standalone",
    start_url: "/",
    scope: "/",
  },
};
