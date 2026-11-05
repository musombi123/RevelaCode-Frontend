import { useCallback, useEffect, useRef, useState } from "react";

const API = String(import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com").replace(/\/+$/, "");
const VERSION = 1;
const CACHE_KEY = "revelaai.preferences.ui.v1";

function authHeaders() {
  try {
    const token = localStorage.getItem("revelacode_access_token") || localStorage.getItem("access_token") || localStorage.getItem("token");
    return token ? { Authorization: `${localStorage.getItem("revelacode_token_type") || "Bearer"} ${token}` } : {};
  } catch {
    return {};
  }
}

function readSafeCache() {
  try {
    const value = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function writeSafeCache(settings) {
  // Only non-sensitive presentation preferences are cached on-device.
  const safe = {
    appearance: settings?.appearance || {},
    accessibility: settings?.accessibility || {},
    language_region: {
      interface_language: settings?.language_region?.interface_language || "en",
    },
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(safe));
  } catch {
    // Private browsing or storage pressure must not block the current session.
  }
}

function mergeSettings(current, patch) {
  const next = { ...current };
  for (const [section, values] of Object.entries(patch || {})) {
    if (values && typeof values === "object" && !Array.isArray(values)) {
      next[section] = { ...(current?.[section] || {}), ...values };
    } else {
      next[section] = values;
    }
  }
  return next;
}

export function useRevelaAISettings() {
  const [settings, setSettings] = useState(readSafeCache);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef(null);
  const mounted = useRef(true);

  const persist = useCallback(async (value) => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ version: VERSION, settings: value }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.detail || payload?.message || "Could not sync settings.");
      return payload;
    } catch (reason) {
      if (mounted.current) setError(reason?.message || "Settings remain on this device until sync is available.");
      return null;
    } finally {
      if (mounted.current) setSaving(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    fetch(`${API}/api/settings`, { headers: authHeaders(), signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) throw new Error("Sign in to sync settings between devices.");
        if (!response.ok) throw new Error("Settings could not be loaded from the server.");
        return response.json();
      })
      .then((payload) => {
        if (!mounted.current) return;
        const remote = payload?.version === VERSION && payload?.settings && typeof payload.settings === "object" ? payload.settings : {};
        setSettings((current) => {
          const merged = mergeSettings(current, remote);
          writeSafeCache(merged);
          return merged;
        });
      })
      .catch((reason) => {
        if (reason?.name !== "AbortError" && mounted.current) setError(reason?.message || "Using saved settings on this device.");
      })
      .finally(() => mounted.current && setLoading(false));
    return () => {
      mounted.current = false;
      controller.abort();
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const updateSection = useCallback((section, patch) => {
    setSettings((current) => {
      const next = mergeSettings(current, { [section]: patch });
      writeSafeCache(next);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => persist(next), 650);
      return next;
    });
  }, [persist]);

  const resetSection = useCallback((section) => {
    setSettings((current) => {
      const next = { ...current };
      delete next[section];
      writeSafeCache(next);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => persist(next), 250);
      return next;
    });
  }, [persist]);

  return { settings, loading, saving, error, updateSection, resetSection, refresh: () => persist(settings) };
}
