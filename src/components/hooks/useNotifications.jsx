// User-scoped Jumuiya notifications. All requests go through the shared API
// client so auth headers, cookies, base URLs, and standard response handling
// stay consistent with the rest of the ecosystem.

import { useState, useEffect, useMemo, useCallback } from "react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

function normalizeNotification(notification, index = 0) {
  if (!notification || typeof notification !== "object") return null;
  const id = notification.id ?? notification._id ?? notification.notification_id ?? `notification-${index}`;
  const message = notification.message ?? notification.text ?? notification.body ?? notification.description ?? "";
  const timestamp = notification.timestamp ?? notification.created_at ?? notification.createdAt ?? notification.publishedAt ?? null;
  return {
    ...notification,
    id: String(id),
    title: String(notification.title || "Jumuiya notification"),
    text: String(message || ""),
    message: String(message || ""),
    read: Boolean(notification.read ?? notification.is_read ?? false),
    timestamp,
  };
}

function extractNotifications(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.notifications)) return data.notifications;
  if (Array.isArray(data?.data?.notifications)) return data.data.notifications;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export function useNotifications(refreshInterval = 12000) {
  const api = useJumuiyaApi();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      if (typeof api.getJumuiyaNotifications !== "function") {
        throw new Error("The Jumuiya notifications API helper is unavailable.");
      }
      const data = await api.getJumuiyaNotifications({ limit: 50 });
      const normalized = extractNotifications(data)
        .map(normalizeNotification)
        .filter(Boolean);
      setNotifications(normalized);
      return normalized;
    } catch (err) {
      setError(err?.message || "Failed to load Jumuiya notifications.");
      return [];
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => {
    fetchNotifications();
    if (!refreshInterval || refreshInterval <= 0) return undefined;
    const timer = window.setInterval(() => {
      fetchNotifications({ silent: true });
    }, refreshInterval);
    return () => window.clearInterval(timer);
  }, [fetchNotifications, refreshInterval]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const markAsRead = useCallback(async (notificationId) => {
    if (notificationId === undefined || notificationId === null || !String(notificationId).trim()) return false;
    try {
      if (typeof api.markJumuiyaNotificationRead !== "function") {
        throw new Error("The mark-as-read API helper is unavailable.");
      }
      await api.markJumuiyaNotificationRead(notificationId);
      setNotifications((current) => current.map((notification) =>
        String(notification.id) === String(notificationId)
          ? { ...notification, read: true }
          : notification
      ));
      return true;
    } catch (err) {
      setError(err?.message || "Failed to mark notification as read.");
      return false;
    }
  }, [api]);

  const markAllRead = useCallback(async () => {
    try {
      if (typeof api.markAllJumuiyaNotificationsRead !== "function") {
        throw new Error("The mark-all-read API helper is unavailable.");
      }
      await api.markAllJumuiyaNotificationsRead();
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
      return true;
    } catch (err) {
      setError(err?.message || "Failed to mark notifications as read.");
      return false;
    }
  }, [api]);

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
