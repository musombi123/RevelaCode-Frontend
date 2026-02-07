// src/components/accounts/Notifications.jsx
import React, { useEffect, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/Popover";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/notifications"); // <-- use relative path for Vite proxy
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("❌ Failed to load notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", { method: "PUT" });
      if (!res.ok) throw new Error("Failed to mark all as read");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("❌ Failed to mark all as read:", err);
      setError("Failed to mark all as read");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative">
          <Bell className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5">
              {unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-72 max-h-72 overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold">🔔 Notifications</h4>
          {notifications.length > 0 && unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-blue-600 hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">⏳ Loading...</p>
        ) : error ? (
          <div className="text-sm text-red-500">
            {error} <button onClick={fetchNotifications} className="underline ml-1">Retry</button>
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-gray-500">No notifications</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`text-sm p-2 rounded ${
                  n.read
                    ? "text-gray-500 dark:text-gray-400"
                    : "bg-gray-100 dark:bg-gray-800 font-medium text-black dark:text-white"
                }`}
              >
                {n.text}
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
