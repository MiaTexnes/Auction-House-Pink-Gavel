function addFavicons() {
  const head = document.head;

  const faviconSizes = [16, 32, 48, 64, 128, 256];
  faviconSizes.forEach((size) => {
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    link.sizes = `${size}x${size}`;
    link.href = `/favicon/favicon-${size}x${size}.png`;
    head.appendChild(link);
  });

  const appleTouchIcon = document.createElement("link");
  appleTouchIcon.rel = "apple-touch-icon";
  appleTouchIcon.sizes = "180x180";
  appleTouchIcon.href = "/favicon/apple-touch-icon.png";
  head.appendChild(appleTouchIcon);

  const manifestLink = document.createElement("link");
  manifestLink.rel = "manifest";
  manifestLink.href = "/favicon/site.webmanifest";
  head.appendChild(manifestLink);
}

export { addFavicons };
