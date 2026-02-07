import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext.jsx";

/* ===============================
   Context
================================ */
const HistoryContext = createContext(undefined);

/* ===============================
   Provider
================================ */
export function HistoryProvider({ children }) {
  const { user } = useAuth();

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const backendURL =
    import.meta.env.VITE_REVELACODE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_URL;

  const isGuest = user?.role === "guest";

  /* ===============================
     Load from localStorage (fast boot)
  ================================ */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("userHistory");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch (err) {
      console.error("❌ Failed to load history from localStorage:", err);
    }
  }, []);

  /* ===============================
     Persist to localStorage
  ================================ */
  useEffect(() => {
    try {
      localStorage.setItem("userHistory", JSON.stringify(history));
    } catch (err) {
      console.error("❌ Failed to save history to localStorage:", err);
    }
  }, [history]);

  /* ===============================
     Fetch history from backend (on login)
  ================================ */
  const fetchHistoryFromBackend = useCallback(async () => {
    if (!backendURL || !user || isGuest) return;

    setLoadingHistory(true);
    setHistoryError(null);

    try {
      const res = await fetch(`${backendURL}/history`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": user.contact,
        },
      });

      if (!res.ok) throw new Error(`Backend returned ${res.status}`);

      const data = await res.json();

      const list = data?.history || data?.data || data;

      if (Array.isArray(list)) setHistory(list);
      else console.warn("⚠️ Backend history response not an array:", data);
    } catch (err) {
      console.error("❌ Failed to fetch history from backend:", err);
      setHistoryError("Failed to fetch history.");
    } finally {
      setLoadingHistory(false);
    }
  }, [backendURL, user, isGuest]);

  useEffect(() => {
    fetchHistoryFromBackend();
  }, [fetchHistoryFromBackend]);

  /* ===============================
     Add to history (local + backend)
  ================================ */
  const addToHistory = useCallback(
    async (entry) => {
      if (!entry) return;

      const newEntry = {
        id: entry.id ?? Date.now(),
        timestamp: entry.timestamp ?? new Date().toISOString(),
        type: entry.type ?? "generic",
        input: entry.input ?? "",
        output: entry.output ?? "",
        fileName: entry.fileName ?? null,
        extra: entry.extra ?? null,
      };

      // Update UI immediately
      setHistory((prev) => [newEntry, ...prev]);

      // Guests stay local only
      if (!backendURL || !user || isGuest) return;

      try {
        await fetch(`${backendURL}/history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": user.contact,
          },
          body: JSON.stringify(newEntry),
        });
      } catch (err) {
        console.error("❌ Failed to POST history to backend:", err);
      }
    },
    [backendURL, user, isGuest]
  );

  /* ===============================
     Clear history (local + backend)
  ================================ */
  const clearHistory = useCallback(async () => {
    setHistory([]);
    try {
      localStorage.removeItem("userHistory");
    } catch {}

    if (!backendURL || !user || isGuest) return;

    try {
      await fetch(`${backendURL}/history`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": user.contact,
        },
      });
    } catch (err) {
      console.error("❌ Failed to DELETE history on backend:", err);
    }
  }, [backendURL, user, isGuest]);

  const value = useMemo(
    () => ({
      history,
      loadingHistory,
      historyError,
      addToHistory,
      clearHistory,
      refetchHistory: fetchHistoryFromBackend,
    }),
    [history, loadingHistory, historyError, addToHistory, clearHistory, fetchHistoryFromBackend]
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

/* ===============================
   Hook
================================ */
export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
}
