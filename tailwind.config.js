module.exports = {
  content: ["./**/*.{html,js,ts}", "!./node_modules/**/*"],
  theme: {
    extend: {
      screens: {
        xs: "480px", // Add extra small breakpoint for better mobile support
      },
    },
  },
  plugins: [],
  darkMode: "class", // This is crucial for dark mode to work!
};
