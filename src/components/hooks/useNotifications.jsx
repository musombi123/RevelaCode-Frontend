// src/hooks/useNotifications.jsx

import { useState, useEffect, useMemo, useCallback } from "react";

export function useNotifications(refreshInterval = 12000) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const baseUrl =
    import.meta.env.VITE_REVELACODE_URL ??
    import.meta.env.VITE_BACKEND_URL ??
    import.meta.env.VITE_API_URL ??
    "";

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${baseUrl}/api/notifications`);

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      if (import.meta.env.DEV) {
        console.log("Notifications:", data);
      }

      setNotifications(
        Array.isArray(data.notifications)
          ? data.notifications
          : []
      );
    } catch (err) {
      console.error("Notification fetch failed:", err);
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(
      fetchNotifications,
      refreshInterval
    );

    return () => clearInterval(interval);
  }, [fetchNotifications, refreshInterval]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAllRead = async () => {
    try {
      // Future backend sync
      // await fetch(`${baseUrl}/api/notifications/read-all`, {
      //   method: "POST",
      // });

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
        }))
      );
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAllRead,
  };
}