import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/Popover.jsx";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/Badge.jsx";
import { useNotifications } from "../hooks/useNotifications.jsx";

export default function Notifications() {
  const {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAllRead,
    unreadCount,
  } = useNotifications(12000); // refresh every 12s

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          <Bell className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center bg-red-600 text-white text-[10px] rounded-full">
              {unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[90vw] sm:w-80 max-w-sm max-h-[70vh] overflow-y-auto p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h4 className="font-semibold">🔔 Notifications</h4>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-blue-600 hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">⏳ Syncing...</p>
        ) : error ? (
          <div className="text-sm text-red-500">
            {error}
            <button onClick={fetchNotifications} className="underline ml-1">
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-gray-500">No notifications</p>
        ) : (
          <ul className="space-y-3">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`text-sm p-3 rounded-lg break-words ${
                  n.read
                    ? "text-gray-500 dark:text-gray-400"
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
