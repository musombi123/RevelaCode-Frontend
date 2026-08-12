import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
     Local storage key
  ================================ */

  const historyStorageKey = user?.contact
    ? `userHistory_${user.contact}`
    : "userHistory_guest";

  /* ===============================
     Load from localStorage
  ================================ */

  useEffect(() => {
    try {
      const saved = localStorage.getItem(historyStorageKey);

      if (!saved) {
        setHistory([]);
        return;
      }

      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setHistory(parsed);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error(
        "❌ Failed to load history from localStorage:",
        err
      );

      setHistory([]);
    }
  }, [historyStorageKey]);

  /* ===============================
     Persist to localStorage
  ================================ */

  useEffect(() => {
    try {
      localStorage.setItem(
        historyStorageKey,
        JSON.stringify(history)
      );
    } catch (err) {
      console.error(
        "❌ Failed to save history to localStorage:",
        err
      );
    }
  }, [history, historyStorageKey]);

  /* ===============================
     Fetch history from backend
  ================================ */

  const fetchHistoryFromBackend = useCallback(async () => {
    if (!backendURL || !user || isGuest) {
      return;
    }

    setLoadingHistory(true);
    setHistoryError(null);

    try {
      const res = await fetch(
        `${backendURL}/api/user/history`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: user.contact,
          },
        }
      );

      if (!res.ok) {
        throw new Error(
          `History request failed: ${res.status}`
        );
      }

      const data = await res.json();

      const list = Array.isArray(data?.history)
        ? data.history
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setHistory(list);
    } catch (err) {
      console.error(
        "❌ Failed to fetch history from backend:",
        err
      );

      setHistoryError("Failed to fetch history.");
    } finally {
      setLoadingHistory(false);
    }
  }, [backendURL, user, isGuest]);

  useEffect(() => {
    fetchHistoryFromBackend();
  }, [fetchHistoryFromBackend]);

  /* ===============================
     Add generic history
  ================================ */

  const addToHistory = useCallback(
    async (entry) => {
      if (!entry) {
        return;
      }

      const newEntry = {
        id: entry.id ?? Date.now(),
        timestamp:
          entry.timestamp ?? new Date().toISOString(),

        type: entry.type ?? "generic",

        input: entry.input ?? "",
        output: entry.output ?? "",

        fileName: entry.fileName ?? null,
        extra: entry.extra ?? null,
      };

      /* =============================
         Prevent exact duplicate entries
      ============================= */

      setHistory((prev) => {
        const isDuplicate = prev.some(
          (item) =>
            item.type === newEntry.type &&
            item.input === newEntry.input &&
            item.extra?.book === newEntry.extra?.book &&
            item.extra?.chapter === newEntry.extra?.chapter &&
            item.extra?.verse === newEntry.extra?.verse
        );

        if (isDuplicate) {
          return [
            {
              ...prev.find(
                (item) =>
                  item.type === newEntry.type &&
                  item.input === newEntry.input &&
                  item.extra?.book ===
                    newEntry.extra?.book &&
                  item.extra?.chapter ===
                    newEntry.extra?.chapter &&
                  item.extra?.verse ===
                    newEntry.extra?.verse
              ),
              ...newEntry,
              timestamp: newEntry.timestamp,
            },
            ...prev.filter(
              (item) =>
                !(
                  item.type === newEntry.type &&
                  item.input === newEntry.input &&
                  item.extra?.book ===
                    newEntry.extra?.book &&
                  item.extra?.chapter ===
                    newEntry.extra?.chapter &&
                  item.extra?.verse ===
                    newEntry.extra?.verse
                )
            ),
          ];
        }

        return [newEntry, ...prev];
      });

      /* =============================
         Guests stay local
      ============================= */

      if (!backendURL || !user || isGuest) {
        return;
      }

      try {
        const res = await fetch(
          `${backendURL}/history`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: user.contact,
            },
            body: JSON.stringify(newEntry),
          }
        );

        if (!res.ok) {
          throw new Error(
            `History POST failed: ${res.status}`
          );
        }

        const data = await res.json();

        if (Array.isArray(data?.history)) {
          setHistory(data.history);
        }
      } catch (err) {
        console.error(
          "❌ Failed to POST history to backend:",
          err
        );
      }
    },
    [backendURL, user, isGuest]
  );

  /* ===============================
     Bible history
  ================================ */

  const addBibleHistory = useCallback(
    async ({
      book,
      chapter = null,
      verse = null,
      reference = null,
    }) => {
      if (!book) {
        return;
      }

      const resolvedReference =
        reference ||
        `${book}${chapter ? ` ${chapter}` : ""}${
          verse ? `:${verse}` : ""
        }`;

      await addToHistory({
        id: Date.now(),
        timestamp: new Date().toISOString(),

        type: "bible",

        input: resolvedReference,

        output: "",

        extra: {
          source: "bible",
          book,
          chapter,
          verse,
          reference: resolvedReference,
        },
      });
    },
    [addToHistory]
  );

  /* ===============================
     Prophecy history
  ================================ */

  const addProphecyHistory = useCallback(
    async ({
      query,
      results = [],
      timestamp = null,
    }) => {
      if (!query) {
        return;
      }

      const decodedResults = Array.isArray(results)
        ? results
        : [];

      const firstResult =
        decodedResults.length > 0
          ? decodedResults[0]
          : null;

      const firstNestedKey =
        firstResult &&
        typeof firstResult === "object"
          ? Object.keys(firstResult).find(
              (key) =>
                firstResult[key] &&
                typeof firstResult[key] ===
                  "object" &&
                !Array.isArray(firstResult[key])
            )
          : null;

      const prophecyData =
        firstNestedKey
          ? firstResult[firstNestedKey]
          : firstResult;

      const symbol =
        prophecyData?.symbol ||
        firstNestedKey ||
        null;

      const title =
        prophecyData?.title ||
        null;

      const primaryReference =
        prophecyData?.primary_reference ||
        prophecyData?.reference ||
        null;

      await addToHistory({
        id: Date.now(),

        timestamp:
          timestamp ||
          new Date().toISOString(),

        type: "prophecy",

        input: query,

        output: JSON.stringify(
          decodedResults,
          null,
          2
        ),

        extra: {
          source: "prophecy",
          query,

          symbol,
          title,
          primaryReference,

          resultCount:
            decodedResults.length,

          status:
            prophecyData?.status || null,

          category:
            prophecyData?.category || null,

          curiosity:
            Array.isArray(
              prophecyData?.curiosity
            )
              ? prophecyData.curiosity
              : [],

          relatedSymbols:
            Array.isArray(
              prophecyData?.related_symbols
            )
              ? prophecyData.related_symbols
              : [],

          sources:
            Array.isArray(
              prophecyData?.sources
            )
              ? prophecyData.sources
              : [],
        },
      });
    },
    [addToHistory]
  );

  /* ===============================
     Clear history
  ================================ */

  const clearHistory = useCallback(async () => {
    setHistory([]);

    try {
      localStorage.removeItem(
        historyStorageKey
      );
    } catch (err) {
      console.error(
        "❌ Failed to clear local history:",
        err
      );
    }

    if (!backendURL || !user || isGuest) {
      return;
    }

    try {
      const res = await fetch(
        `${backendURL}/history`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: user.contact,
          },
        }
      );

      if (!res.ok) {
        throw new Error(
          `History DELETE failed: ${res.status}`
        );
      }
    } catch (err) {
      console.error(
        "❌ Failed to DELETE history on backend:",
        err
      );
    }
  }, [
    backendURL,
    user,
    isGuest,
    historyStorageKey,
  ]);

  /* ===============================
     Context value
  ================================ */

  const value = useMemo(
    () => ({
      history,
      loadingHistory,
      historyError,

      addToHistory,

      addBibleHistory,
      addProphecyHistory,

      clearHistory,

      refetchHistory:
        fetchHistoryFromBackend,
    }),
    [
      history,
      loadingHistory,
      historyError,
      addToHistory,
      addBibleHistory,
      addProphecyHistory,
      clearHistory,
      fetchHistoryFromBackend,
    ]
  );

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
}

/* ===============================
   Hook
================================ */

export function useHistory() {
  const context = useContext(HistoryContext);

  if (context === undefined) {
    throw new Error(
      "useHistory must be used within a HistoryProvider"
    );
  }

  return context;
}
