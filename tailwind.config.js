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
        app: "rgb(var(--app-bg) / <alpha-value>)",
        sidebar: "rgb(var(--sidebar-bg) / <alpha-value>)",
        header: "rgb(var(--header-bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        "surface-3": "rgb(var(--surface-3) / <alpha-value>)",
        input: "rgb(var(--input-bg) / <alpha-value>)",
        code: "rgb(var(--code-bg) / <alpha-value>)",
        popover: "rgb(var(--popover-bg) / <alpha-value>)",
        overlay: "rgb(var(--overlay-bg) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        "fg-secondary": "rgb(var(--fg-secondary) / <alpha-value>)",
        muted: "rgb(var(--fg-muted) / <alpha-value>)",
        inverse: "rgb(var(--fg-inverse) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        "line-strong": "rgb(var(--line-strong) / <alpha-value>)",
        accent: "rgb(var(--accent-rgb) / <alpha-value>)",
        "accent-hover": "rgb(var(--accent-hover-rgb) / <alpha-value>)",
        "accent-pressed": "rgb(var(--accent-pressed-rgb) / <alpha-value>)",
        "accent-soft": "rgb(var(--accent-soft-rgb) / <alpha-value>)",
        success: "rgb(var(--success-rgb) / <alpha-value>)",
        warning: "rgb(var(--warning-rgb) / <alpha-value>)",
        danger: "rgb(var(--danger-rgb) / <alpha-value>)",
        premium: "rgb(var(--premium-rgb) / <alpha-value>)",
        focus: "rgb(var(--focus-rgb) / <alpha-value>)",
        chart: {
          1: "rgb(var(--chart-1) / <alpha-value>)",
          2: "rgb(var(--chart-2) / <alpha-value>)",
          3: "rgb(var(--chart-3) / <alpha-value>)",
          4: "rgb(var(--chart-4) / <alpha-value>)",
          5: "rgb(var(--chart-5) / <alpha-value>)",
        },
        // Backward-compatible legacy palette for modules outside the
        // RevelaAI workspace. Workspace components use semantic aliases above.
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