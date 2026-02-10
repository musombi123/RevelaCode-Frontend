import { useState, useEffect, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export function useNotifications(pollMs = 15000) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${BASE_URL}/api/notifications`, {
        headers: { "Accept": "application/json" },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      // Normalization = resilience
      const normalized =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.notifications)
          ? data.notifications
          : [];

      setNotifications(normalized);
    } catch (err) {
      console.error("❌ Notifications fetch failed:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllRead = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/notifications/read-all`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Bad response");

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
    } catch (err) {
      console.error("❌ Mark read failed:", err);
      setError("Failed to mark as read");
    }
  };

  // Auto-refresh like a boss
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, pollMs);
    return () => clearInterval(interval);
  }, [fetchNotifications, pollMs]);

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAllRead,
    unreadCount: notifications.filter((n) => !n.read).length,
  };
}
