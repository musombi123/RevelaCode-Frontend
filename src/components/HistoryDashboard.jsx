import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

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

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("decodeHistory");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (err) {
      console.error("❌ Failed to load history:", err);
      setHistory([]);
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("decodeHistory", JSON.stringify(history));
    } catch (err) {
      console.error("❌ Failed to save history:", err);
    }
  }, [history]);

  const addToHistory = (entry) => {
    if (!entry) return;

    setHistory((prev) => [
      {
        id: entry.id ?? Date.now(),
        timestamp: entry.timestamp ?? new Date().toISOString(),
        input: entry.input ?? "",
        output: entry.output ?? "",
      },
      ...prev,
    ]);
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("decodeHistory");
    } catch {}
  };

  return (
    <HistoryContext.Provider
      value={{
        history,
        addToHistory,
        clearHistory,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
}

/* ===============================
   Hook (CRASH-PROOF)
================================ */

export function useHistory() {
  const context = useContext(HistoryContext);

  if (!context) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }

  return context;
}
