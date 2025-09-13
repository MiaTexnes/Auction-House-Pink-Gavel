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
};
