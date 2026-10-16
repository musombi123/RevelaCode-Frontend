import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const ThemeContext = createContext(null);
const VALID_THEMES = ["light", "dark", "system"];

function readTheme() {
  try {
    const saved = localStorage.getItem("theme");
    return VALID_THEMES.includes(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readTheme);

  const setTheme = useCallback((nextTheme) => {
    if (!VALID_THEMES.includes(nextTheme)) return;
    setThemeState(nextTheme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let mediaQuery;

    const applyTheme = () => {
      const useDark =
        theme === "dark" ||
        (theme === "system" && Boolean(mediaQuery?.matches));

      root.classList.toggle("dark", useDark);
      root.classList.toggle("light", !useDark);
      root.dataset.theme = theme;
      root.style.colorScheme = useDark ? "dark" : "light";
    };

    try {
      localStorage.setItem("theme", theme);
    } catch {
      // The current session still receives the selected theme.
    }

    if (typeof window.matchMedia === "function") {
      mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    }

    applyTheme();

    if (theme === "system" && mediaQuery) {
      if (typeof mediaQuery.addEventListener === "function") {
        mediaQuery.addEventListener("change", applyTheme);
        return () => mediaQuery.removeEventListener("change", applyTheme);
      }

      // Compatibility for older Android WebViews.
      mediaQuery.addListener?.(applyTheme);
      return () => mediaQuery.removeListener?.(applyTheme);
    }

    return undefined;
  }, [theme]);

  useEffect(() => {
    const syncThemeFromStorage = (event) => {
      if (event.key !== "theme") return;
      const nextTheme = VALID_THEMES.includes(event.newValue)
        ? event.newValue
        : "system";
      setThemeState(nextTheme);
    };

    window.addEventListener("storage", syncThemeFromStorage);
    return () => window.removeEventListener("storage", syncThemeFromStorage);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
