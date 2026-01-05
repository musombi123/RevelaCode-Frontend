import React, { createContext, useContext, useEffect, useState } from "react";

/* ======================================================
   Theme Context
====================================================== */

const ThemeContext = createContext(null);

/* ======================================================
   Theme Provider
====================================================== */

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "system"
  );

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } 
    else if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } 
    else {
      // system preference
      const media = window.matchMedia("(prefers-color-scheme: dark)");

      const apply = () => {
        root.classList.toggle("dark", media.matches);
        root.classList.toggle("light", !media.matches);
      };

      apply();
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ======================================================
   Hook
====================================================== */

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
