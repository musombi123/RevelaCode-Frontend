/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        revela: {
          dark: "#0f2027",
          primary: "#203a43",
          secondary: "#2c5364",
          accent: "#22c55e",
          surface: "#16262d",
          card: "#1b2e36",
        },
      },

      animation: {
        "fade-in": "fadeIn 0.4s ease-in-out",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
    },
  },
}