// src/components/accounts/Notifications.jsx
import React, { useEffect, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/Popover";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const baseUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${baseUrl}/api/notifications`);
        const data = await res.json();
        if (res.ok) setNotifications(data);
      } catch (err) {
        console.error("❌ Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [baseUrl]);

  const markAllRead = async () => {
    try {
      await fetch(`${baseUrl}/api/notifications/read-all`, { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("❌ Failed to mark as read:", err);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative">
          <Bell className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          {notifications.filter((n) => !n.read).length > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5">
              {notifications.filter((n) => !n.read).length}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 max-h-72 overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold">🔔 Notifications</h4>
          {notifications.length > 0 && (
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
        ) : notifications.length === 0 ? (
          <p className="text-sm text-gray-500">No new notifications</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`text-sm p-2 rounded ${
                  n.read
                    ? "text-gray-500"
                    : "bg-gray-100 dark:bg-gray-800 font-medium"
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
