// src/hooks/useNotifications.jsx

import { useState, useEffect } from "react";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const baseUrl =
    import.meta.env.VITE_REVELACODE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);

      const res = await fetch(
        `${baseUrl}/api/notifications`
      );

      const data = await res.json();

      console.log(data); // debug

      setNotifications(
        data.notifications || []
      );

    } catch (err) {
      console.error(
        "Notification fetch failed:",
        err
      );
    } finally {
      setLoading(false);
    }
  }

  const unreadCount =
    notifications.filter(
      n => !n.read
    ).length;

  const markAllRead = () => {
    setNotifications(prev =>
      prev.map(n => ({
        ...n,
        read: true
      }))
    );
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAllRead
  };
}