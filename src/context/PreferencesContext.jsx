import React, { createContext, useContext, useEffect, useState } from "react";

export const PreferencesContext = createContext({
  preferences: {},
  setPreference: () => {},
  resetPreferences: () => {},
});

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("preferences");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setPreferences(parsed);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("preferences", JSON.stringify(preferences));
    } catch {}
  }, [preferences]);

  const setPreference = (key, value) => {
    if (!key) return;
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetPreferences = () => {
    setPreferences({});
    try {
      localStorage.removeItem("preferences");
    } catch {}
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        setPreference,
        resetPreferences,
      }}
    >
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
