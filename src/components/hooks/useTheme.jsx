import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
const VALID_THEMES = ["light", "dark", "system"];

function resolveScheduledTheme(appearance = {}) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Nairobi",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
    const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
    const now = hour * 60 + minute;
    const [startHour, startMinute] = String(appearance.scheduled_start || "19:00").split(":").map(Number);
    const [endHour, endMinute] = String(appearance.scheduled_end || "07:00").split(":").map(Number);
    const start = (startHour || 0) * 60 + (startMinute || 0);
    const end = (endHour || 0) * 60 + (endMinute || 0);
    const dark = start > end ? now >= start || now < end : now >= start && now < end;
    return dark ? "dark" : "light";
  } catch {
    return "system";
  }
}

function readTheme() {
  try {
    const cached = JSON.parse(window.localStorage.getItem("revelaai.preferences.ui.v1") || "{}");
    const appearance = cached?.appearance || {};
    if (appearance.theme === "scheduled") return resolveScheduledTheme(appearance);
    if (VALID_THEMES.includes(appearance.theme)) return appearance.theme;

    const saved = window.localStorage.getItem("theme");
    return VALID_THEMES.includes(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

function applyResolvedTheme(root, mode, isSystemDark) {
  const dark = mode === "dark" || (mode === "system" && isSystemDark);
  const resolved = dark ? "dark" : "light";
  root.classList.toggle("dark", dark);
  root.classList.toggle("light", !dark);
  root.dataset.theme = resolved;
  root.dataset.themeMode = mode;
  root.style.colorScheme = resolved;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", dark ? "#091015" : "#F7F9FB");
  return resolved;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (typeof document === "undefined") return "dark";
    return document.documentElement.dataset.theme || "dark";
  });

  const setTheme = useCallback((nextTheme) => {
    if (!VALID_THEMES.includes(nextTheme)) return;
    setThemeState(nextTheme);
    // Keep the shared theme source and RevelaAI appearance cache in sync.
    // readTheme checks the appearance cache first during the next app boot.
    try {
      const cached = JSON.parse(window.localStorage.getItem("revelaai.preferences.ui.v1") || "{}");
      const appearance = cached?.appearance && typeof cached.appearance === "object"
        ? cached.appearance
        : {};
      window.localStorage.setItem("revelaai.preferences.ui.v1", JSON.stringify({
        ...cached,
        appearance: { ...appearance, theme: nextTheme },
      }));
      window.localStorage.setItem("theme", nextTheme);
    } catch {
      // The in-memory setting still applies for this session.
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const media = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;
    const apply = () => {
      const next = applyResolvedTheme(root, theme, Boolean(media?.matches));
      setResolvedTheme(next);
    };

    try {
      window.localStorage.setItem("theme", theme);
    } catch {
      // Session theme remains active when storage is unavailable.
    }
    apply();

    if (theme === "system" && media) {
      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", apply);
        return () => media.removeEventListener("change", apply);
      }
      // Older Android System WebViews expose addListener instead.
      media.addListener?.(apply);
      return () => media.removeListener?.(apply);
    }
    return undefined;
  }, [theme]);

  useEffect(() => {
    const syncThemeFromStorage = (event) => {
      if (event.key !== "theme") return;
      setThemeState(VALID_THEMES.includes(event.newValue) ? event.newValue : "system");
    };
    window.addEventListener("storage", syncThemeFromStorage);
    return () => window.removeEventListener("storage", syncThemeFromStorage);
  }, []);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
