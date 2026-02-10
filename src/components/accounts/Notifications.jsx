import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/Popover";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useNotifications } from "@/components/hooks/useNotifications.jsx";

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
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`text-sm p-2 rounded ${
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
