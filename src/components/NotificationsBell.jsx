// src/components/NotificationsBell.jsx

import React, {
  useMemo,
  useState,
} from "react";

import {
  Bell,
  Check,
  Clock3,
  ShieldCheck,
  Sparkles,
  Settings2,
  AlertTriangle,
  Newspaper,
  Activity,
  X,
  RefreshCw,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

import { useNotifications } from "@/components/hooks/useNotifications.jsx";

// ============================================================
// HELPERS
// ============================================================

function getNotificationTitle(notification) {
  if (notification.title) {
    return notification.title;
  }

  if (
    notification.type === "prophecy_event"
  ) {
    return "Prophecy Alert";
  }

  if (
    notification.type ===
    "daily_prophecy_summary"
  ) {
    return "Daily Prophecy Update";
  }

  if (notification.type === "security") {
    return "Security Notification";
  }

  return "RevelaCode Notification";
}

// ============================================================
// ICON
// ============================================================

function getNotificationIcon(notification) {
  const type = String(
    notification.type ??
      notification.category ??
      ""
  ).toLowerCase();

  if (
    type.includes("prophecy") ||
    type.includes("prophecy_event")
  ) {
    return Sparkles;
  }

  if (
    type.includes("daily_prophecy")
  ) {
    return Activity;
  }

  if (
    type.includes("security")
  ) {
    return ShieldCheck;
  }

  if (
    type.includes("alert") ||
    type.includes("warning")
  ) {
    return AlertTriangle;
  }

  if (
    type.includes("news") ||
    type.includes("article")
  ) {
    return Newspaper;
  }

  if (
    type.includes("system") ||
    type.includes("setting")
  ) {
    return Settings2;
  }

  return Bell;
}

// ============================================================
// RELATIVE TIME
// ============================================================

function formatRelativeTime(timestamp) {
  if (!timestamp) {
    return "Just now";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  const now = Date.now();
  const difference = Math.max(
    0,
    now - date.getTime()
  );

  const seconds = Math.floor(
    difference / 1000
  );

  const minutes = Math.floor(
    seconds / 60
  );

  const hours = Math.floor(
    minutes / 60
  );

  const days = Math.floor(
    hours / 24
  );

  if (seconds < 60) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year:
        date.getFullYear() !==
        new Date().getFullYear()
          ? "numeric"
          : undefined,
    }
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    refreshing,
    error,
    fetchNotifications,
    markAsRead,
    markAllRead,
  } = useNotifications();

  // ==========================================================
  // DISPLAY DATA
  // ==========================================================

  const displayNotifications = useMemo(() => {
    return [...notifications].sort(
      (a, b) => {
        const aTime = new Date(
          a.timestamp || 0
        ).getTime();

        const bTime = new Date(
          b.timestamp || 0
        ).getTime();

        return bTime - aTime;
      }
    );
  }, [notifications]);

  // ==========================================================
  // HANDLE CLICK
  // ==========================================================

  const handleNotificationClick = async (
    notification
  ) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Future:
    // if (notification.url) {
    //   window.open(notification.url, "_blank");
    // }
  };

  // ==========================================================
  // CLOSE
  // ==========================================================

  const close = () => {
    setOpen(false);
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="relative">
      {/* =====================================================
          BELL BUTTON
      ===================================================== */}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
        aria-expanded={open}
        className="
          relative
          inline-flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          border
          border-slate-200
          bg-white
          text-slate-600
          shadow-sm
          transition
          hover:bg-slate-50
          hover:text-slate-900
          dark:border-slate-700
          dark:bg-slate-900
          dark:text-slate-300
          dark:hover:bg-slate-800
        "
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span
            className="
              absolute
              -right-1
              -top-1
              flex
              min-h-[19px]
              min-w-[19px]
              items-center
              justify-center
              rounded-full
              bg-red-500
              px-1
              text-[10px]
              font-bold
              text-white
              ring-2
              ring-white
              dark:ring-slate-950
            "
          >
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {/* =====================================================
          PANEL
      ===================================================== */}

      <AnimatePresence>
        {open && (
          <>
            {/* MOBILE BACKDROP */}

            <motion.button
              type="button"
              aria-label="Close notifications"
              onClick={close}
              className="
                fixed
                inset-0
                z-40
                bg-black/30
                backdrop-blur-[1px]
                md:hidden
              "
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
            />

            {/* NOTIFICATION PANEL */}

            <motion.div
              initial={{
                opacity: 0,
                y: -8,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -8,
                scale: 0.98,
              }}
              transition={{
                duration: 0.18,
              }}
              className="
                fixed
                inset-x-3
                top-16
                z-50
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-white
                shadow-2xl
                dark:border-slate-700
                dark:bg-slate-950

                md:absolute
                md:right-0
                md:left-auto
                md:top-12
                md:w-[390px]
              "
            >
              {/* =================================================
                  HEADER
              ================================================= */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-b
                  border-slate-200
                  px-4
                  py-3
                  dark:border-slate-800
                "
              >
                <div>
                  <h3
                    className="
                      text-sm
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    Notifications
                  </h3>

                  <p
                    className="
                      mt-0.5
                      text-xs
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    {unreadCount > 0
                      ? `${unreadCount} unread`
                      : "You're all caught up"}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {/* REFRESH */}

                  <button
                    type="button"
                    onClick={() =>
                      fetchNotifications({
                        silent: true,
                      })
                    }
                    disabled={refreshing}
                    aria-label="Refresh notifications"
                    className="
                      inline-flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-lg
                      text-slate-500
                      transition
                      hover:bg-slate-100
                      hover:text-slate-900
                      disabled:opacity-50
                      dark:hover:bg-slate-800
                      dark:hover:text-white
                    "
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        refreshing
                          ? "animate-spin"
                          : ""
                      }`}
                    />
                  </button>

                  {/* CLOSE */}

                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="
                      inline-flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-lg
                      text-slate-500
                      transition
                      hover:bg-slate-100
                      hover:text-slate-900
                      dark:hover:bg-slate-800
                      dark:hover:text-white
                    "
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* =================================================
                  BODY
              ================================================= */}

              <div className="max-h-[70vh] overflow-y-auto">
                {/* LOADING */}

                {loading && (
                  <div
                    className="
                      flex
                      flex-col
                      items-center
                      justify-center
                      px-6
                      py-12
                      text-center
                    "
                  >
                    <div
                      className="
                        mb-3
                        h-7
                        w-7
                        animate-spin
                        rounded-full
                        border-2
                        border-slate-200
                        border-t-slate-700
                        dark:border-slate-700
                        dark:border-t-white
                      "
                    />

                    <p
                      className="
                        text-sm
                        font-medium
                        text-slate-700
                        dark:text-slate-300
                      "
                    >
                      Loading notifications...
                    </p>
                  </div>
                )}

                {/* ERROR */}

                {!loading && error && (
                  <div
                    className="
                      px-5
                      py-10
                      text-center
                    "
                  >
                    <div
                      className="
                        mx-auto
                        mb-3
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-full
                        bg-red-50
                        text-red-600
                        dark:bg-red-950/30
                        dark:text-red-400
                      "
                    >
                      <AlertTriangle className="h-5 w-5" />
                    </div>

                    <p
                      className="
                        text-sm
                        font-semibold
                        text-slate-900
                        dark:text-white
                      "
                    >
                      Unable to load notifications
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      {error}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        fetchNotifications()
                      }
                      className="
                        mt-4
                        rounded-lg
                        bg-slate-900
                        px-4
                        py-2
                        text-xs
                        font-semibold
                        text-white
                        transition
                        hover:bg-slate-700
                        dark:bg-white
                        dark:text-slate-900
                        dark:hover:bg-slate-200
                      "
                    >
                      Try again
                    </button>
                  </div>
                )}

                {/* EMPTY */}

                {!loading &&
                  !error &&
                  displayNotifications.length ===
                    0 && (
                    <div
                      className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        px-6
                        py-14
                        text-center
                      "
                    >
                      <div
                        className="
                          mb-4
                          flex
                          h-14
                          w-14
                          items-center
                          justify-center
                          rounded-full
                          bg-slate-100
                          text-slate-500
                          dark:bg-slate-800
                          dark:text-slate-400
                        "
                      >
                        <Bell className="h-6 w-6" />
                      </div>

                      <p
                        className="
                          text-sm
                          font-semibold
                          text-slate-900
                          dark:text-white
                        "
                      >
                        No notifications yet
                      </p>

                      <p
                        className="
                          mt-1
                          max-w-[250px]
                          text-xs
                          leading-5
                          text-slate-500
                          dark:text-slate-400
                        "
                      >
                        New RevelaCode events,
                        prophecy alerts and
                        system updates will
                        appear here.
                      </p>
                    </div>
                  )}

                {/* NOTIFICATIONS */}

                {!loading &&
                  !error &&
                  displayNotifications.length >
                    0 && (
                    <div>
                      {displayNotifications.map(
                        (notification) => {
                          const Icon =
                            getNotificationIcon(
                              notification
                            );

                          const title =
                            getNotificationTitle(
                              notification
                            );

                          const message =
                            notification.text ||
                            notification.message ||
                            "New notification";

                          return (
                            <button
                              type="button"
                              key={
                                notification.id
                              }
                              onClick={() =>
                                handleNotificationClick(
                                  notification
                                )
                              }
                              className={`
                                group
                                flex
                                w-full
                                gap-3
                                border-b
                                border-slate-100
                                px-4
                                py-4
                                text-left
                                transition
                                hover:bg-slate-50
                                dark:border-slate-800
                                dark:hover:bg-slate-900

                                ${
                                  !notification.read
                                    ? "bg-blue-50/50 dark:bg-blue-950/10"
                                    : ""
                                }
                              `}
                            >
                              {/* ICON */}

                              <div
                                className={`
                                  flex
                                  h-10
                                  w-10
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-xl

                                  ${
                                    !notification.read
                                      ? "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                  }
                                `}
                              >
                                <Icon className="h-5 w-5" />
                              </div>

                              {/* CONTENT */}

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p
                                    className={`
                                      text-sm
                                      leading-5

                                      ${
                                        !notification.read
                                          ? "font-bold text-slate-900 dark:text-white"
                                          : "font-semibold text-slate-700 dark:text-slate-300"
                                      }
                                    `}
                                  >
                                    {title}
                                  </p>

                                  {!notification.read && (
                                    <span
                                      className="
                                        mt-1
                                        h-2
                                        w-2
                                        shrink-0
                                        rounded-full
                                        bg-blue-600
                                      "
                                    />
                                  )}
                                </div>

                                <p
                                  className="
                                    mt-1
                                    line-clamp-3
                                    text-xs
                                    leading-5
                                    text-slate-600
                                    dark:text-slate-400
                                  "
                                >
                                  {message}
                                </p>

                                <div
                                  className="
                                    mt-2
                                    flex
                                    items-center
                                    gap-1
                                    text-[11px]
                                    text-slate-400
                                  "
                                >
                                  <Clock3 className="h-3 w-3" />

                                  <span>
                                    {formatRelativeTime(
                                      notification.timestamp
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* READ INDICATOR */}

                              {notification.read && (
                                <Check
                                  className="
                                    mt-1
                                    h-4
                                    w-4
                                    shrink-0
                                    text-emerald-500
                                  "
                                />
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}
              </div>

              {/* =================================================
                  FOOTER
              ================================================= */}

              {!loading &&
                !error &&
                displayNotifications.length >
                  0 && (
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      border-t
                      border-slate-200
                      px-4
                      py-3
                      dark:border-slate-800
                    "
                  >
                    <span
                      className="
                        text-[11px]
                        text-slate-400
                      "
                    >
                      Updates automatically
                    </span>

                    <button
                      type="button"
                      disabled={
                        unreadCount === 0
                      }
                      onClick={async () => {
                        await markAllRead();
                      }}
                      className="
                        text-xs
                        font-semibold
                        text-blue-600
                        transition
                        hover:text-blue-700
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                        dark:text-blue-400
                      "
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
