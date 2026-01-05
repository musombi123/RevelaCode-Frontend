import React, { createContext, useState, useContext, useEffect } from 'react';

const HistoryContext = createContext();

export function useHistory() {
  return useContext(HistoryContext);
}

export function HistoryProvider({ children }) {
  const [history, setHistory] = useState([]);

  // 🧠 Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('decodeHistory');
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (err) {
        console.warn('Failed to parse decode history:', err);
      }
    }
  }, []);

  // 💾 Save to localStorage whenever history changes
  useEffect(() => {
    localStorage.setItem('decodeHistory', JSON.stringify(history));
  }, [history]);

  // ➕ Add entry to history
  const addToHistory = (entry) => {
    setHistory((prev) => [entry, ...prev.slice(0, 9)]); // keep only latest 10
  };

  // 🧹 Clear all history (optional, for future use)
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('decodeHistory');
  };

  return (
    <HistoryContext.Provider value={{ history, addToHistory, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
}
