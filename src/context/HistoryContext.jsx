import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";

const HistoryContext = createContext(null);

export function HistoryProvider({ children }) {
  const { user, isGuest } = useAuth();
  const [history, setHistory] = useState([]);

  const API = import.meta.env.VITE_API_URL;

  // -------------------------
  // Load history (auth only)
  // -------------------------
  useEffect(() => {
    if (!user || isGuest) {
      setHistory([]);
      return;
    }

    fetch(`${API}/api/history/${user.id}`)
      .then((res) => res.json())
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [user, isGuest]);

  // -------------------------
  // Add history event
  // -------------------------
  const logEvent = async (event, meta = {}) => {
    if (!user || isGuest) return; // 🔒 guest blocked

    await fetch(`${API}/api/history/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        event,
        meta
      })
    });
  };

  return (
    <HistoryContext.Provider value={{ history, logEvent }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  return useContext(HistoryContext);
}
