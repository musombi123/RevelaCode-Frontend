// src/hooks/useNotifications.jsx

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";

// ============================================================
// API BASE URL
// ============================================================

const getBaseUrl = () => {
  return (
    import.meta.env.VITE_REVELACODE_URL ??
    import.meta.env.VITE_BACKEND_URL ??
    import.meta.env.VITE_API_URL ??
    ""
  ).replace(/\/+$/, "");
};

// ============================================================
// NORMALIZE BACKEND RESPONSE
// ============================================================

function normalizeNotification(notification, index = 0) {
  if (!notification || typeof notification !== "object") {
    return null;
  }

  const id =
    notification.id ??
    notification._id ??
    notification.notification_id ??
    `notification-${index}`;

  const text =
    notification.text ??
    notification.message ??
    notification.body ??
    notification.description ??
    "";

  const timestamp =
    notification.timestamp ??
    notification.created_at ??
    notification.createdAt ??
    notification.publishedAt ??
    null;

  return {
    ...notification,

    id,

    // Backend uses `text`
    text,

    // Keep a UI-friendly message
    message: text,

    // Backend uses `read`
    read: Boolean(
      notification.read ??
      notification.is_read ??
      false
    ),

    // Keep timestamp normalized
    timestamp,
  };
}

// ============================================================
// EXTRACT NOTIFICATIONS FROM RESPONSE
// ============================================================

function extractNotifications(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.notifications)) {
    return data.notifications;
  }

  if (Array.isArray(data?.data?.notifications)) {
    return data.data.notifications;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

// ============================================================
// HOOK
// ============================================================

export function useNotifications(refreshInterval = 12000) {
  const baseUrl = getBaseUrl();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================================
  // FETCH NOTIFICATIONS
  // ==========================================================

  const fetchNotifications = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const response = await fetch(
          `${baseUrl}/api/notifications`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },

            // Safe for deployments using cookie authentication.
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Notifications request failed (${response.status})`
          );
        }

        const data = await response.json();

        const rawNotifications =
          extractNotifications(data);

        const normalized =
          rawNotifications
            .map(normalizeNotification)
            .filter(Boolean);

        setNotifications(normalized);

        if (import.meta.env.DEV) {
          console.log(
            "[Notifications] Backend response:",
            data
          );

          console.log(
            "[Notifications] Normalized:",
            normalized
          );
        }

        return normalized;
      } catch (err) {
        console.error(
          "[Notifications] Fetch failed:",
          err
        );

        setError(
          err?.message ||
            "Failed to load notifications."
        );

        return [];
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [baseUrl]
  );

  // ==========================================================
  // INITIAL LOAD + AUTO REFRESH
  // ==========================================================

  useEffect(() => {
    fetchNotifications();

    if (!refreshInterval || refreshInterval <= 0) {
      return undefined;
    }

    const interval = setInterval(() => {
      fetchNotifications({
        silent: true,
      });
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [
    fetchNotifications,
    refreshInterval,
  ]);

  // ==========================================================
  // UNREAD COUNT
  // ==========================================================

  const unreadCount = useMemo(() => {
    return notifications.filter(
      (notification) => !notification.read
    ).length;
  }, [notifications]);

  // ==========================================================
  // MARK ONE AS READ
  // ==========================================================

  const markAsRead = useCallback(
    async (notificationId) => {
      if (
        notificationId === undefined ||
        notificationId === null
      ) {
        return false;
      }

      try {
        const response = await fetch(
          `${baseUrl}/api/notifications/${notificationId}`,
          {
            method: "PUT",
            headers: {
              Accept: "application/json",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to mark notification as read (${response.status})`
          );
        }

        // Update UI immediately.
        setNotifications((current) =>
          current.map((notification) =>
            String(notification.id) ===
            String(notificationId)
              ? {
                  ...notification,
                  read: true,
                }
              : notification
          )
        );

        return true;
      } catch (err) {
        console.error(
          "[Notifications] Mark as read failed:",
          err
        );

        return false;
      }
    },
    [baseUrl]
  );

  // ==========================================================
  // MARK ALL AS READ
  // ==========================================================

  const markAllRead = useCallback(async () => {
    try {
      const response = await fetch(
        `${baseUrl}/api/notifications/read-all`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to mark all notifications as read (${response.status})`
        );
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        }))
      );

      return true;
    } catch (err) {
      console.error(
        "[Notifications] Mark all as read failed:",
        err
      );

      return false;
    }
  }, [baseUrl]);

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    notifications,
    unreadCount,

    loading,
    refreshing,
    error,

    fetchNotifications,

    markAsRead,
    markAllRead,
  };
}
