import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export const PreferencesContext = createContext(null);

const PREFERENCES_STORAGE_KEY = "preferences";
const LANGUAGE_STORAGE_KEY = "revelacode_language";
const READING_SCALE_STORAGE_KEY = "revelacode_reading_scale";

const FONT_SCALE = {
  sm: 0.92,
  md: 1,
  lg: 1.12,
};

function readStoredPreferences() {
  try {
    const saved = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn("Unable to load RevelaCode preferences:", error);
  }
  return {};
}

function readLanguage() {
  try {
    const language = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return ["en", "sw", "fr"].includes(language) ? language : "en";
  } catch {
    return "en";
  }
}

function readFontSize(preferences) {
  try {
    const saved = preferences?.fontSize || localStorage.getItem("revelacode_font_size");
    return ["sm", "md", "lg"].includes(saved) ? saved : "md";
  } catch {
    return ["sm", "md", "lg"].includes(preferences?.fontSize)
      ? preferences.fontSize
      : "md";
  }
}

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(readStoredPreferences);
  const [fontSize, setFontSizeState] = useState(() => readFontSize(readStoredPreferences()));
  const [language, setLanguageState] = useState(readLanguage);

  useEffect(() => {
    try {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ ...preferences, fontSize })
      );
      localStorage.setItem("revelacode_font_size", fontSize);
    } catch (error) {
      console.warn("Unable to save RevelaCode preferences:", error);
    }
  }, [preferences, fontSize]);

  useEffect(() => {
    const scale = FONT_SCALE[fontSize] || FONT_SCALE.md;
    const root = document.documentElement;

    // Tailwind's rem-based sizing follows the root font size, so this
    // applies the preference to the actual interface, not just its preview.
    root.style.fontSize = `${16 * scale}px`;
    root.style.setProperty("--revelacode-reading-scale", String(scale));
    root.dataset.readingScale = String(scale);

    try {
      localStorage.setItem(READING_SCALE_STORAGE_KEY, String(scale));
    } catch {
      // The setting still applies for the current session.
    }

    window.dispatchEvent(
      new CustomEvent("revelacode:readingscalechange", {
        detail: { scale, fontSize },
      })
    );
  }, [fontSize]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // The setting still applies for the current session.
    }

    window.dispatchEvent(
      new CustomEvent("revelacode:languagechange", {
        detail: { language },
      })
    );
  }, [language]);

  const setFontSize = useCallback((nextSize) => {
    if (!Object.prototype.hasOwnProperty.call(FONT_SCALE, nextSize)) return;
    setFontSizeState(nextSize);
    setPreferences((current) => ({ ...current, fontSize: nextSize }));
  }, []);

  const setLanguage = useCallback((nextLanguage) => {
    if (!["en", "sw", "fr"].includes(nextLanguage)) return;
    setLanguageState(nextLanguage);
  }, []);

  const setPreference = useCallback((key, value) => {
    if (!key) return;
    setPreferences((current) => ({ ...current, [key]: value }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences({});
    setFontSizeState("md");
    setLanguageState("en");
    try {
      localStorage.removeItem(PREFERENCES_STORAGE_KEY);
      localStorage.removeItem("revelacode_font_size");
      localStorage.removeItem(READING_SCALE_STORAGE_KEY);
      localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    } catch {
      // State still resets for the current session.
    }
  }, []);

  const value = useMemo(
    () => ({
      preferences,
      setPreference,
      resetPreferences,
      fontSize,
      setFontSize,
      language,
      setLanguage,
    }),
    [
      preferences,
      setPreference,
      resetPreferences,
      fontSize,
      setFontSize,
      language,
      setLanguage,
    ]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferencesContext() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("PreferencesContext missing");
  }
  return context;
}
