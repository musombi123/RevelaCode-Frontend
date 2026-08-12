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
      const res = await fetch(`${backendURL}/api/user/history`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": user.contact,
        },
      });

      const data = await res.json();

      // Always make sure it's an array
      const list = Array.isArray(data?.history)
        ? data.history
        : Array.isArray(data?.data)
        ? data.data
        : [];

      if (!Array.isArray(list)) {
        console.warn("⚠️ Backend history response is not an array:", data);
      }

      setHistory(list);
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
        const res = await fetch(`${backendURL}/history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": user.contact,
          },
          body: JSON.stringify(newEntry),
        });

        const data = await res.json();

        // Ensure backend returns an array
        if (Array.isArray(data?.history)) {
          setHistory(data.history);
        } else {
          console.warn("⚠️ POST history response not an array:", data);
        }
      } catch (err) {
        console.error("❌ Failed to POST history to backend:", err);
      }
    },
    [backendURL, user, isGuest]
  );\
   
  const addBibleHistory = useCallback(
   async ({ book, chapter = null, verse = null }) => {
      if (!book) return;

      await addToHistory({
         type: "bible",
         input: `${book}${chapter ? ` ${chapter}` : ""}${verse ? `:${verse}` : ""}`,
         output: "",
         extra: {
            book,
            chapter,
            verse,
         },
      });
    },
      [addToHistory]
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
      const res = await fetch(`${backendURL}/history`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": user.contact,
        },
      });

      const data = await res.json();
      if (!Array.isArray(data?.history)) {
        console.warn("⚠️ DELETE history response not an array:", data);
      }
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
      addBibleHistory,
      refetchHistory: fetchHistoryFromBackend,
    }),
    [history, loadingHistory, historyError, addToHistory, addBibleHistory, clearHistory, fetchHistoryFromBackend]
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
