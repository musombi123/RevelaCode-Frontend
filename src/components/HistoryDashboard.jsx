import React, { createContext, useContext, useEffect, useState } from "react";

/* ===============================
   Context
================================ */
const HistoryContext = createContext({
  history: [],
  addToHistory: () => {},
  clearHistory: () => {},
});

/* ===============================
   Provider
================================ */
export function HistoryProvider({ children }) {
  const [history, setHistory] = useState([]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("userHistory");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch (err) {
      console.error("❌ Failed to load history:", err);
    }
  }, []);

  // Persist history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("userHistory", JSON.stringify(history));
    } catch (err) {
      console.error("❌ Failed to save history:", err);
    }
  }, [history]);

  /**
   * Add a new entry
   * type: "ai" | "decode" | "prophecy"
   * data: object with custom fields
   */
  const addToHistory = (entry) => {
    if (!entry) return;

    const newEntry = {
      id: entry.id ?? Date.now(),
      timestamp: entry.timestamp ?? new Date().toISOString(),
      type: entry.type ?? "generic", // ai / decode / prophecy
      input: entry.input ?? "",
      output: entry.output ?? "",
      fileName: entry.fileName ?? null,
      extra: entry.extra ?? null, // optional extra info
    };

    setHistory((prev) => [newEntry, ...prev]);
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("userHistory");
    } catch {}
  };

  return (
    <HistoryContext.Provider value={{ history, addToHistory, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
}

/* ===============================
   Hook
================================ */
export function useHistory() {
  const context = useContext(HistoryContext);
  if (!context) throw new Error("useHistory must be used within a HistoryProvider");
  return context;
}
