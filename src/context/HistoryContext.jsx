import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext.jsx";

/* =========================================================
   History Context
========================================================= */

const HistoryContext = createContext(undefined);

const LOCAL_STORAGE_KEY = "userHistory";
const HISTORY_ENDPOINT = "/api/user/history";

/* =========================================================
   Helpers
========================================================= */

function normalizeHistoryEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  return {
    id:
      entry.id ??
      entry._id ??
      `history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,

    timestamp:
      entry.timestamp ??
      entry.createdAt ??
      entry.created_at ??
      new Date().toISOString(),

    type: entry.type ?? "generic",

    input:
      entry.input ??
      entry.prompt ??
      entry.question ??
      "",

    output:
      entry.output ??
      entry.response ??
      entry.answer ??
      "",

    fileName: entry.fileName ?? entry.file_name ?? null,

    extra: entry.extra ?? null,

    /* Preserve additional backend fields without breaking old data */
    ...entry,
  };
}

function normalizeHistoryList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeHistoryEntry)
    .filter(Boolean);
}

function extractHistoryList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.history)) {
    return data.history;
  }

  if (Array.isArray(data?.data?.history)) {
    return data.data.history;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

function mergeHistoryEntries(current, incoming) {
  const combined = [
    ...incoming,
    ...current,
  ];

  const seen = new Set();

  return combined
    .filter((entry) => {
      const normalized = normalizeHistoryEntry(entry);

      if (!normalized) {
        return false;
      }

      /*
       * Prefer a stable backend id.
       * For entries without an id, fall back to timestamp/type/input.
       */
      const key =
        normalized.id ??
        `${normalized.timestamp}|${normalized.type}|${normalized.input}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .map(normalizeHistoryEntry)
    .sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();

      return (
        (Number.isFinite(bTime) ? bTime : 0) -
        (Number.isFinite(aTime) ? aTime : 0)
      );
    });
}

/* =========================================================
   Provider
========================================================= */

export function HistoryProvider({ children }) {
  const {
    user,
    isGuest,
    isReady,
    hydrated,
    authFetch,
  } = useAuth();

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  /*
   * Prevent stale requests from overwriting newer state.
   */
  const requestIdRef = useRef(0);

  /*
   * Prevent the initial localStorage hydration from being treated
   * as a backend synchronization event.
   */
  const localHydratedRef = useRef(false);

  const backendURL =
    import.meta.env.VITE_REVELACODE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    "";

  const normalizedBackendURL = backendURL.replace(/\/+$/, "");

  const historyURL = `${normalizedBackendURL}${HISTORY_ENDPOINT}`;

  /* =========================================================
     Load local history immediately
  ========================================================= */

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);

      if (!saved) {
        localHydratedRef.current = true;
        return;
      }

      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setHistory(normalizeHistoryList(parsed));
      }
    } catch (error) {
      console.error(
        "❌ Failed to load history from localStorage:",
        error
      );
    } finally {
      localHydratedRef.current = true;
    }
  }, []);

  /* =========================================================
     Persist history locally
  ========================================================= */

  useEffect(() => {
    if (!localHydratedRef.current) {
      return;
    }

    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(history)
      );
    } catch (error) {
      console.error(
        "❌ Failed to save history to localStorage:",
        error
      );
    }
  }, [history]);

  /* =========================================================
     Fetch history from backend
  ========================================================= */

  const fetchHistoryFromBackend = useCallback(async () => {
    /*
     * Do not attempt authenticated requests while AuthContext
     * is still restoring the session.
     */
    if (hydrated === false || isReady === false) {
      return;
    }

    /*
     * Guests intentionally use local history only.
     */
    if (!user || isGuest) {
      return;
    }

    /*
     * A backend URL is required for server synchronization.
     */
    if (!normalizedBackendURL) {
      const message =
        "Backend URL is not configured. Set VITE_REVELACODE_URL or VITE_BACKEND_URL.";

      console.warn(`⚠️ ${message}`);
      setHistoryError(message);
      return;
    }

    /*
     * authFetch is critical here.
     *
     * It automatically attaches:
     *
     * Authorization: Bearer <JWT>
     */
    if (typeof authFetch !== "function") {
      const message =
        "Authenticated request handler is unavailable. AuthContext must expose authFetch().";

      console.error(`❌ ${message}`);
      setHistoryError(message);
      return;
    }

    const requestId = ++requestIdRef.current;

    setLoadingHistory(true);
    setHistoryError(null);

    try {
      const response = await authFetch(historyURL, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      /*
       * authFetch normally handles authentication failures,
       * but we still explicitly handle them here.
       */
      if (response.status === 401) {
        console.warn(
          "⚠️ History request returned 401. The authentication session may have expired."
        );

        if (requestId === requestIdRef.current) {
          setHistoryError(
            "Your session has expired. Please sign in again."
          );
        }

        return;
      }

      if (!response.ok) {
        let serverMessage = "";

        try {
          const errorData = await response.json();

          serverMessage =
            errorData?.message ||
            errorData?.error ||
            errorData?.detail ||
            "";
        } catch {
          /* Response was not JSON */
        }

        throw new Error(
          serverMessage ||
            `History request failed with HTTP ${response.status}.`
        );
      }

      const data = await response.json();

      const backendHistory = normalizeHistoryList(
        extractHistoryList(data)
      );

      /*
       * Only the latest request may update state.
       */
      if (requestId !== requestIdRef.current) {
        return;
      }

      /*
       * Backend is authoritative for authenticated users.
       *
       * We merge rather than blindly replace so locally-created
       * entries are not immediately lost if the backend has not
       * finished persisting them yet.
       */
      setHistory((current) =>
        mergeHistoryEntries(current, backendHistory)
      );
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      /*
       * Abort errors are not real failures.
       */
      if (error?.name === "AbortError") {
        return;
      }

      console.error(
        "❌ Failed to fetch history from backend:",
        error
      );

      setHistoryError(
        error?.message || "Failed to fetch history from backend."
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoadingHistory(false);
      }
    }
  }, [
    authFetch,
    historyURL,
    hydrated,
    isGuest,
    isReady,
    normalizedBackendURL,
    user,
  ]);

  /* =========================================================
     Fetch when authenticated session becomes ready
  ========================================================= */

  useEffect(() => {
    if (!hydrated || !isReady) {
      return;
    }

    if (!user || isGuest) {
      return;
    }

    fetchHistoryFromBackend();
  }, [
    hydrated,
    isReady,
    user,
    isGuest,
    fetchHistoryFromBackend,
  ]);

  /* =========================================================
     Add history
  ========================================================= */

  const addToHistory = useCallback(
    async (entry) => {
      if (!entry) {
        return null;
      }

      const newEntry = normalizeHistoryEntry({
        ...entry,

        id:
          entry.id ??
          `history-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}`,

        timestamp:
          entry.timestamp ??
          new Date().toISOString(),

        type: entry.type ?? "generic",

        input: entry.input ?? "",

        output: entry.output ?? "",

        fileName: entry.fileName ?? null,

        extra: entry.extra ?? null,
      });

      if (!newEntry) {
        return null;
      }

      /*
       * Optimistic UI:
       * history appears immediately.
       */
      setHistory((previous) =>
        mergeHistoryEntries(previous, [newEntry])
      );

      /*
       * Guests/local-only users do not send history to backend.
       */
      if (
        !normalizedBackendURL ||
        !user ||
        isGuest ||
        typeof authFetch !== "function"
      ) {
        return newEntry;
      }

      try {
        const response = await authFetch(historyURL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(newEntry),
        });

        if (response.status === 401) {
          console.warn(
            "⚠️ History POST returned 401. Session may have expired."
          );

          return newEntry;
        }

        if (!response.ok) {
          let serverMessage = "";

          try {
            const data = await response.json();

            serverMessage =
              data?.message ||
              data?.error ||
              data?.detail ||
              "";
          } catch {
            /* Ignore invalid JSON */
          }

          throw new Error(
            serverMessage ||
              `Failed to save history. HTTP ${response.status}.`
          );
        }

        /*
         * If the backend returns the persisted entry,
         * replace the optimistic entry with it.
         */
        try {
          const responseData = await response.json();

          const persisted =
            responseData?.data ||
            responseData?.history ||
            responseData?.item ||
            responseData;

          if (
            persisted &&
            typeof persisted === "object" &&
            !Array.isArray(persisted)
          ) {
            const normalizedPersisted =
              normalizeHistoryEntry(persisted);

            if (normalizedPersisted) {
              setHistory((previous) => {
                const withoutOptimistic = previous.filter(
                  (item) =>
                    String(item.id) !==
                    String(newEntry.id)
                );

                return mergeHistoryEntries(
                  withoutOptimistic,
                  [normalizedPersisted]
                );
              });
            }
          }
        } catch {
          /*
           * Some POST endpoints return 204 or an empty body.
           * That is perfectly valid.
           */
        }
      } catch (error) {
        console.error(
          "❌ Failed to POST history to backend:",
          error
        );

        /*
         * Keep the optimistic local entry.
         * This means the user does not lose history merely
         * because the network is temporarily unavailable.
         */
      }

      return newEntry;
    },
    [
      authFetch,
      historyURL,
      isGuest,
      normalizedBackendURL,
      user,
    ]
  );

  /* =========================================================
     Clear history
  ========================================================= */

  const clearHistory = useCallback(async () => {
    /*
     * Clear UI immediately.
     */
    setHistory([]);
    setHistoryError(null);

    /*
     * Clear local cache.
     */
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error(
        "❌ Failed to remove local history:",
        error
      );
    }

    /*
     * Guests only need local clearing.
     */
    if (
      !normalizedBackendURL ||
      !user ||
      isGuest ||
      typeof authFetch !== "function"
    ) {
      return;
    }

    try {
      const response = await authFetch(historyURL, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.status === 401) {
        console.warn(
          "⚠️ History DELETE returned 401. Session may have expired."
        );

        return;
      }

      if (!response.ok) {
        let serverMessage = "";

        try {
          const data = await response.json();

          serverMessage =
            data?.message ||
            data?.error ||
            data?.detail ||
            "";
        } catch {
          /* Ignore invalid JSON */
        }

        throw new Error(
          serverMessage ||
            `Failed to clear backend history. HTTP ${response.status}.`
        );
      }
    } catch (error) {
      console.error(
        "❌ Failed to DELETE history on backend:",
        error
      );

      setHistoryError(
        error?.message ||
          "History was cleared locally, but backend clearing failed."
      );
    }
  }, [
    authFetch,
    historyURL,
    isGuest,
    normalizedBackendURL,
    user,
  ]);

  /* =========================================================
     Remove a single history item
     
     This is intentionally local-safe. If the backend later
     exposes DELETE /api/user/history/:id, this can be extended.
  ========================================================= */

  const removeFromHistory = useCallback((historyId) => {
    if (historyId === undefined || historyId === null) {
      return;
    }

    setHistory((previous) =>
      previous.filter(
        (item) => String(item.id) !== String(historyId)
      )
    );
  }, []);

  /* =========================================================
     Context value
  ========================================================= */

  const value = useMemo(
    () => ({
      history,
      loadingHistory,
      historyError,

      addToHistory,
      clearHistory,
      removeFromHistory,

      refetchHistory: fetchHistoryFromBackend,

      /*
       * Useful for UI diagnostics.
       */
      historyEndpoint: historyURL,
    }),
    [
      history,
      loadingHistory,
      historyError,
      addToHistory,
      clearHistory,
      removeFromHistory,
      fetchHistoryFromBackend,
      historyURL,
    ]
  );

  /* =========================================================
     Provider
  ========================================================= */

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
}

/* =========================================================
   Hook
========================================================= */

export function useHistory() {
  const context = useContext(HistoryContext);

  if (context === undefined) {
    throw new Error(
      "useHistory must be used within a HistoryProvider"
    );
  }

  return context;
}