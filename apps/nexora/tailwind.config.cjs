const path = require("node:path");

module.exports = {
  darkMode: "class",
  content: [
    path.join(__dirname, "index.html"),
    path.join(__dirname, "src/**/*.{js,jsx,ts,tsx}"),
  ],
  theme: { extend: {} },
  plugins: [],
};
