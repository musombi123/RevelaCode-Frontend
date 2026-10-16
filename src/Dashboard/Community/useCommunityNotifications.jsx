// src/components/hooks/useCommunityNotifications.jsx
// Authenticated, user-scoped Jumuiya notifications for dashboards and Community.

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

function normalizeNotification(notification, index = 0) {
  if (!notification || typeof notification !== "object") return null;

  const id =
    notification.id ??
    notification._id ??
    notification.notification_id ??
    `notification-${index}`;

  const message =
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
    id: String(id),
    text: String(message),
    message: String(message),
    read: Boolean(notification.read ?? notification.is_read ?? false),
    timestamp,
  };
}

function extractNotifications(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.notifications)) return value.notifications;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.data?.notifications)) return value.data.notifications;
  if (Array.isArray(value?.data?.items)) return value.data.items;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

export function useCommunityNotifications(refreshInterval = 12000) {
  const {
    getJumuiyaNotifications,
    markJumuiyaNotificationRead,
  } = useJumuiyaApi();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) setRefreshing(true);
      else setLoading(true);

      setError(null);

      try {
        const response = await getJumuiyaNotifications({ limit: 100 });
        const normalized = extractNotifications(response)
          .map(normalizeNotification)
          .filter(Boolean);

        setNotifications(normalized);
        return normalized;
      } catch (requestError) {
        console.error("[Notifications] Fetch failed:", requestError);
        setError(requestError?.message || "Failed to load notifications.");
        return [];
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getJumuiyaNotifications],
  );

  useEffect(() => {
    fetchNotifications();

    if (!refreshInterval || refreshInterval <= 0) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "hidden") {
        fetchNotifications({ silent: true });
      }
    }, refreshInterval);

    return () => window.clearInterval(interval);
  }, [fetchNotifications, refreshInterval]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const markAsRead = useCallback(
    async (notificationId) => {
      if (notificationId === undefined || notificationId === null || !String(notificationId).trim()) {
        return false;
      }

      try {
        await markJumuiyaNotificationRead(notificationId);
        setNotifications((current) => current.map((item) => (
          String(item.id) === String(notificationId)
            ? { ...item, read: true, is_read: true }
            : item
        )));
        setError(null);
        return true;
      } catch (requestError) {
        console.error("[Notifications] Mark as read failed:", requestError);
        setError(requestError?.message || "Failed to mark notification as read.");
        return false;
      }
    },
    [markJumuiyaNotificationRead],
  );

  const markAllRead = useCallback(
    async () => {
      const unread = notifications.filter((item) => !item.read);
      if (unread.length === 0) return true;

      const results = await Promise.allSettled(
        unread.map((item) => markJumuiyaNotificationRead(item.id)),
      );

      const succeededIds = unread
        .filter((item, index) => results[index].status === "fulfilled")
        .map((item) => String(item.id));

      setNotifications((current) => current.map((item) => (
        succeededIds.includes(String(item.id))
          ? { ...item, read: true, is_read: true }
          : item
      )));

      const allSucceeded = results.every((result) => result.status === "fulfilled");
      setError(allSucceeded ? null : "Some notifications could not be marked as read. Please retry.");
      return allSucceeded;
    },
    [notifications, markJumuiyaNotificationRead],
  );

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

export default useCommunityNotifications;
