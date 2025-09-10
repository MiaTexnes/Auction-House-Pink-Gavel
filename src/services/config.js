export const config = {
  // Use Netlify function for API calls in production
  API_BASE_URL: import.meta.env.PROD
    ? "/.netlify/functions/api-proxy"
    : import.meta.env.VITE_API_BASE_URL,
  // For development, you can still use direct API calls with a dev-only key
  X_NOROFF_API_KEY: import.meta.env.DEV
    ? import.meta.env.VITE_DEV_API_KEY || ""
    : "",
  isDev: import.meta.env.DEV,
  mode: import.meta.env.MODE,
  useProxy: import.meta.env.PROD,
};
