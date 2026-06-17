import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Newspaper
} from "lucide-react";

import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";

export default function Notifications() {
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    loading,
    markAllRead,
  } = useNotifications();

  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () =>
      document.removeEventListener(
        "mousedown",
        handler
      );
  }, []);

  const handleNotificationClick = (n) => {
    setOpen(false);

    if (n.type === "prophecy_event") {
      navigate("/events");
      return;
    }

    if (n.url) {
      window.open(n.url, "_blank");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell */}
      <button
        onClick={() => setOpen(!open)}
        className="
          relative
          p-2
          rounded-full
          hover:bg-gray-100
          dark:hover:bg-gray-800
          transition
        "
      >
        <Bell size={22} />

        {unreadCount > 0 && (
          <span
            className="
              absolute
              -top-1
              -right-1
              min-w-[18px]
              h-[18px]
              px-1
              rounded-full
              bg-red-600
              text-white
              text-[10px]
              font-bold
              flex
              items-center
              justify-center
            "
          >
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute
            right-0
            mt-3
            w-[380px]
            max-w-[95vw]
            bg-white
            dark:bg-gray-900
            border
            border-gray-200
            dark:border-gray-800
            rounded-2xl
            shadow-2xl
            z-50
            overflow-hidden
          "
        >
          {/* Header */}
          <div
            className="
              flex
              items-center
              justify-between
              p-4
              border-b
              border-gray-200
              dark:border-gray-800
            "
          >
            <h3 className="font-bold">
              Notifications
            </h3>

            {notifications.length > 0 && (
              <button
                onClick={markAllRead}
                className="
                  flex
                  items-center
                  gap-1
                  text-indigo-600
                  text-sm
                  hover:underline
                "
              >
                <CheckCheck size={16} />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications */}
          <div className="max-h-[450px] overflow-y-auto">
            {loading && (
              <div className="p-6 text-center text-sm">
                Loading...
              </div>
            )}

            {!loading &&
              notifications.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No notifications
                </div>
              )}

            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() =>
                  handleNotificationClick(n)
                }
                className={`
                  w-full
                  text-left
                  p-4
                  border-b
                  border-gray-100
                  dark:border-gray-800
                  hover:bg-gray-50
                  dark:hover:bg-gray-800
                  transition
                  ${
                    !n.read
                      ? "bg-indigo-50 dark:bg-indigo-950/30"
                      : ""
                  }
                `}
              >
                <div className="flex gap-3">
                  <div className="mt-1">
                    {n.type ===
                    "prophecy_event" ? (
                      <AlertTriangle
                        className="text-red-500"
                        size={18}
                      />
                    ) : (
                      <Newspaper
                        className="text-blue-500"
                        size={18}
                      />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {n.text}
                    </p>

                    {n.headline && (
                      <p className="text-xs text-gray-500 mt-1">
                        {n.headline}
                      </p>
                    )}

                    <p className="text-[11px] text-gray-400 mt-2">
                      {new Date(
                        n.timestamp
                      ).toLocaleString()}
                    </p>
                  </div>

                  {!n.read && (
                    <div
                      className="
                        w-2
                        h-2
                        rounded-full
                        bg-indigo-600
                        mt-2
                      "
                    />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}