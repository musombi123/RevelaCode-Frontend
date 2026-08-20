import React, { useEffect, useState } from "react";
import {
  Bell,
  X,
  Check,
  Clock3,
  ShieldCheck,
  Sparkles,
  Settings2,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
} from "framer-motion";

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);

  const [notifications, setNotifications] =
    useState([
      {
        id: 1,
        title: "System update complete",
        message:
          "RevelaCode has completed its latest system update.",
        time: "2m ago",
        icon: Settings2,
        unread: true,
      },
      {
        id: 2,
        title: "New prophecy insight ready",
        message:
          "A new insight is available in your prophecy workspace.",
        time: "1h ago",
        icon: Sparkles,
        unread: true,
      },
      {
        id: 3,
        title: "Security scan passed",
        message:
          "Your account security check completed successfully.",
        time: "Today",
        icon: ShieldCheck,
        unread: true,
      },
    ]);

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  /* =========================================================
     LOCK BODY SCROLL ON MOBILE SHEET
  ========================================================= */

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    const isMobile =
      window.innerWidth < 768;

    if (isMobile) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );

      document.body.style.overflow = "";
    };
  }, [open]);

  /* =========================================================
     MARK ALL AS READ
  ========================================================= */

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  };

  /* =========================================================
     OPEN NOTIFICATION
  ========================================================= */

  const handleNotificationClick = (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              unread: false,
            }
          : notification
      )
    );

    // Connect navigation/action here later.
    console.log(
      "Notification opened:",
      id
    );
  };

  return (
    <>
      {/* =====================================================
          BELL BUTTON
      ===================================================== */}

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open notifications"
        aria-expanded={open}
        className="
          relative
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          text-slate-500
          transition
          hover:bg-slate-100
          hover:text-slate-900
          dark:text-slate-400
          dark:hover:bg-slate-800
          dark:hover:text-white
        "
      >
        <Bell
          className="h-5 w-5"
          strokeWidth={1.8}
        />

        {unreadCount > 0 && (
          <span
            className="
              absolute
              -right-0.5
              -top-0.5
              flex
              h-5
              min-w-5
              items-center
              justify-center
              rounded-full
              bg-red-500
              px-1
              text-[10px]
              font-bold
              text-white
              shadow-sm
            "
          >
            {unreadCount > 9
              ? "9+"
              : unreadCount}
          </span>
        )}
      </button>

      {/* =====================================================
          RESPONSIVE PANEL
      ===================================================== */}

      <AnimatePresence>
        {open && (
          <>
            {/* ===============================================
                MOBILE BACKDROP
            =============================================== */}

            <motion.button
              type="button"
              aria-label="Close notifications"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.18,
              }}
              onClick={() => setOpen(false)}
              className="
                fixed
                inset-0
                z-[9998]
                bg-slate-950/50
                backdrop-blur-[2px]
                md:hidden
              "
            />

            {/* ===============================================
                DESKTOP + MOBILE PANEL
            =============================================== */}

            <motion.div
              initial={{
                opacity: 0,
                y: -12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -12,
              }}
              transition={{
                duration: 0.18,
                ease: "easeOut",
              }}
              className="
                fixed
                inset-0
                z-[9999]
                flex
                flex-col
                bg-white
                dark:bg-slate-950

                md:absolute
                md:inset-auto
                md:right-0
                md:top-full
                md:mt-3
                md:h-auto
                md:w-[390px]
                md:max-w-[calc(100vw-2rem)]
                md:rounded-2xl
                md:border
                md:border-slate-200
                md:bg-white
                md:shadow-2xl
                md:dark:border-slate-800
                md:dark:bg-slate-900
              "
            >
              {/* =============================================
                  HEADER
              ============================================= */}

              <div
                className="
                  flex
                  flex-shrink-0
                  items-center
                  justify-between
                  border-b
                  border-slate-200
                  bg-white
                  px-4
                  py-4
                  dark:border-slate-800
                  dark:bg-slate-900

                  md:rounded-t-2xl
                "
              >
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      bg-slate-100
                      dark:bg-slate-800
                    "
                  >
                    <Bell
                      className="h-5 w-5 text-slate-500 dark:text-slate-300"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Notifications
                    </h2>

                    <p className="text-xs text-slate-400">
                      {unreadCount > 0
                        ? `${unreadCount} unread ${
                            unreadCount === 1
                              ? "notification"
                              : "notifications"
                          }`
                        : "You're all caught up"}
                    </p>
                  </div>
                </div>

                {/* Close */}
                <button
                  type="button"
                  onClick={() =>
                    setOpen(false)
                  }
                  aria-label="Close notifications"
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-xl
                    text-slate-400
                    transition
                    hover:bg-slate-100
                    hover:text-slate-900
                    dark:hover:bg-slate-800
                    dark:hover:text-white
                  "
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* =============================================
                  ACTION BAR
              ============================================= */}

              {notifications.length > 0 && (
                <div
                  className="
                    flex
                    flex-shrink-0
                    items-center
                    justify-between
                    border-b
                    border-slate-200
                    bg-slate-50/80
                    px-4
                    py-2.5
                    dark:border-slate-800
                    dark:bg-slate-950/40
                  "
                >
                  <span className="text-[11px] text-slate-400">
                    Live account updates
                  </span>

                  <button
                    type="button"
                    onClick={markAllAsRead}
                    disabled={
                      unreadCount === 0
                    }
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      text-[11px]
                      font-semibold
                      text-slate-500
                      transition
                      hover:text-slate-900
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                      dark:text-slate-400
                      dark:hover:text-white
                    "
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark all as read
                  </button>
                </div>
              )}

              {/* =============================================
                  CONTENT
              ============================================= */}

              <div
                className="
                  min-h-0
                  flex-1
                  overflow-y-auto
                  overscroll-contain
                "
              >
                {notifications.length === 0 ? (
                  <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center md:min-h-[280px]">
                    <div
                      className="
                        mb-4
                        flex
                        h-14
                        w-14
                        items-center
                        justify-center
                        rounded-2xl
                        bg-slate-100
                        dark:bg-slate-800
                      "
                    >
                      <Bell className="h-6 w-6 text-slate-400" />
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      You're all caught up
                    </h3>

                    <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
                      New platform updates and account
                      notifications will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.map(
                      (notification) => {
                        const Icon =
                          notification.icon;

                        return (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() =>
                              handleNotificationClick(
                                notification.id
                              )
                            }
                            className="
                              flex
                              w-full
                              items-start
                              gap-3
                              px-4
                              py-4
                              text-left
                              transition
                              hover:bg-slate-50
                              dark:hover:bg-slate-800/60
                            "
                          >
                            {/* Icon */}
                            <div
                              className={`
                                flex
                                h-10
                                w-10
                                flex-shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                ${
                                  notification.unread
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                                    : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                                }
                              `}
                            >
                              <Icon className="h-4 w-4" />
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-2">
                                <p
                                  className={`
                                    text-sm
                                    leading-5
                                    ${
                                      notification.unread
                                        ? "font-bold text-slate-900 dark:text-white"
                                        : "font-medium text-slate-700 dark:text-slate-300"
                                    }
                                  `}
                                >
                                  {notification.title}
                                </p>

                                {notification.unread && (
                                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                                )}
                              </div>

                              <p className="mt-1 text-xs leading-5 text-slate-400">
                                {notification.message}
                              </p>

                              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
                                <Clock3 className="h-3 w-3" />
                                {notification.time}
                              </div>
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                )}
              </div>

              {/* =============================================
                  MOBILE FOOTER
              ============================================= */}

              <div
                className="
                  flex
                  flex-shrink-0
                  items-center
                  justify-center
                  border-t
                  border-slate-200
                  bg-white
                  px-4
                  py-4
                  dark:border-slate-800
                  dark:bg-slate-900
                  md:rounded-b-2xl
                "
              >
                <p className="text-[10px] text-slate-400">
                  RevelaCode Notifications
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
