import React, { useMemo, useState } from "react";

import {
  Activity,
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Heart,
  MessageCircle,
  MoreHorizontal,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";

import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";

// ============================================================
// FILTERS
// ============================================================

const NOTIFICATION_FILTERS = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "unread",
    label: "Unread",
  },
  {
    value: "mentions",
    label: "Mentions",
  },
  {
    value: "social",
    label: "Social",
  },
  {
    value: "groups",
    label: "Groups",
  },
];

// ============================================================
// DEMO / FALLBACK NOTIFICATIONS
// ============================================================
// This is intentionally frontend-ready.
// Later we can replace this with the real Community
// notifications API without redesigning the component.
// ============================================================

const INITIAL_NOTIFICATIONS = [
  {
    id: "notification-001",
    type: "reaction",
    title: "Someone reacted to your post",
    message:
      "Your Community post received a new reaction.",
    actor: "Community member",
    time: "Just now",
    read: false,
    category: "social",
    link: "community-feed",
  },

  {
    id: "notification-002",
    type: "comment",
    title: "New comment on your post",
    message:
      "Someone joined the conversation on your post.",
    actor: "Community member",
    time: "18 min ago",
    read: false,
    category: "social",
    link: "community-feed",
  },

  {
    id: "notification-003",
    type: "mention",
    title: "You were mentioned",
    message:
      "A member mentioned you in a Community conversation.",
    actor: "Community member",
    time: "1 hour ago",
    read: false,
    category: "mentions",
    link: "community-feed",
  },

  {
    id: "notification-004",
    type: "group",
    title: "New activity in your group",
    message:
      "There is new activity in one of your joined communities.",
    actor: "Community group",
    time: "3 hours ago",
    read: true,
    category: "groups",
    link: "community-groups",
  },

  {
    id: "notification-005",
    type: "follow",
    title: "New connection",
    message:
      "A Community member started following your activity.",
    actor: "Community member",
    time: "Yesterday",
    read: true,
    category: "social",
    link: "community-discover",
  },

  {
    id: "notification-006",
    type: "activity",
    title: "Community is growing",
    message:
      "New people are joining conversations across Jumuiya.",
    actor: "Jumuiya Community",
    time: "Yesterday",
    read: true,
    category: "social",
    link: "community",
  },
];

// ============================================================
// HELPERS
// ============================================================

function getDisplayName(user) {
  if (!user) return "Member";

  return (
    user.name ||
    user.full_name ||
    user.fullName ||
    user.username ||
    user.email?.split("@")[0] ||
    "Member"
  );
}

function getInitials(name) {
  if (!name) return "M";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[
    parts.length - 1
  ].charAt(0)}`.toUpperCase();
}

// ============================================================
// ICON
// ============================================================

function NotificationIcon({
  type,
}) {
  const iconMap = {
    reaction: Heart,
    comment: MessageCircle,
    mention: Bell,
    group: Users,
    follow: UserPlus,
    activity: Activity,
  };

  const Icon =
    iconMap[type] || Bell;

  const styleMap = {
    reaction:
      "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",

    comment:
      "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",

    mention:
      "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",

    group:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",

    follow:
      "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",

    activity:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  };

  return (
    <div
      className={`
        flex
        h-11
        w-11
        shrink-0
        items-center
        justify-center
        rounded-2xl
        ${styleMap[type] || styleMap.activity}
      `}
    >
      <Icon size={18} />
    </div>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function CommunityNotifications({
  onNavigate,
}) {
  const { user } = useAuth();

  const [notifications, setNotifications] =
    useState(
      INITIAL_NOTIFICATIONS
    );

  const [activeFilter, setActiveFilter] =
    useState("all");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  const displayName = useMemo(
    () => getDisplayName(user),
    [user]
  );

  const initials = useMemo(
    () => getInitials(displayName),
    [displayName]
  );

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigate = (destination) => {
    if (typeof onNavigate === "function") {
      onNavigate(destination);
      return;
    }

    console.warn(
      "Community navigation requested:",
      destination
    );
  };

  // ==========================================================
  // COUNTS
  // ==========================================================

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          !notification.read
      ).length,
    [notifications]
  );

  const mentionCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          notification.category ===
          "mentions"
      ).length,
    [notifications]
  );

  const groupCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          notification.category ===
          "groups"
      ).length,
    [notifications]
  );

  // ==========================================================
  // MARK ONE READ
  // ==========================================================

  const markAsRead = (id) => {
    setNotifications((current) =>
      current.map(
        (notification) =>
          notification.id === id
            ? {
                ...notification,
                read: true,
              }
            : notification
      )
    );
  };

  // ==========================================================
  // MARK ALL READ
  // ==========================================================

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map(
        (notification) => ({
          ...notification,
          read: true,
        })
      )
    );
  };

  // ==========================================================
  // REMOVE NOTIFICATION
  // ==========================================================

  const removeNotification = (
    id
  ) => {
    setNotifications((current) =>
      current.filter(
        (notification) =>
          notification.id !== id
      )
    );
  };

  // ==========================================================
  // REFRESH
  // ==========================================================

  const refreshNotifications =
    async () => {
      try {
        setRefreshing(true);

        // Reserved for the real notifications
        // endpoint.

        await new Promise(
          (resolve) =>
            setTimeout(resolve, 500)
        );
      } finally {
        setRefreshing(false);
      }
    };

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredNotifications =
    useMemo(() => {
      const query =
        searchTerm
          .trim()
          .toLowerCase();

      return notifications.filter(
        (notification) => {
          let filterMatches = true;

          if (
            activeFilter ===
            "unread"
          ) {
            filterMatches =
              !notification.read;
          }

          if (
            activeFilter ===
            "mentions"
          ) {
            filterMatches =
              notification.category ===
              "mentions";
          }

          if (
            activeFilter ===
            "social"
          ) {
            filterMatches =
              notification.category ===
              "social";
          }

          if (
            activeFilter ===
            "groups"
          ) {
            filterMatches =
              notification.category ===
              "groups";
          }

          if (!filterMatches) {
            return false;
          }

          if (!query) {
            return true;
          }

          return (
            notification.title
              .toLowerCase()
              .includes(query) ||
            notification.message
              .toLowerCase()
              .includes(query) ||
            notification.actor
              .toLowerCase()
              .includes(query)
          );
        }
      );
    }, [
      notifications,
      activeFilter,
      searchTerm,
    ]);

  // ==========================================================
  // OPEN NOTIFICATION
  // ==========================================================

  const openNotification = (
    notification
  ) => {
    markAsRead(
      notification.id
    );

    if (notification.link) {
      navigate(
        notification.link
      );
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <JumuiyaDashboardShell
      title="Notifications"
      subtitle="Stay updated with what is happening around your Community."
      activeHub="community"
      user={user}
      onNavigate={onNavigate}
    >
      <div className="space-y-6 pb-10">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <section
          className="
            overflow-hidden
            rounded-[28px]
            border
            border-slate-200
            bg-white
            shadow-sm
            dark:border-white/10
            dark:bg-slate-900
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5
              p-5
              sm:p-7
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div
              className="
                flex
                items-center
                gap-4
              "
            >
              <div
                className="
                  relative
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-emerald-100
                  text-emerald-700
                  dark:bg-emerald-950/40
                  dark:text-emerald-400
                "
              >
                <Bell size={22} />

                {unreadCount > 0 && (
                  <span
                    className="
                      absolute
                      -right-1
                      -top-1
                      flex
                      h-5
                      min-w-5
                      items-center
                      justify-center
                      rounded-full
                      border-2
                      border-white
                      bg-rose-500
                      px-1
                      text-[9px]
                      font-black
                      text-white
                      dark:border-slate-900
                    "
                  >
                    {unreadCount >
                    9
                      ? "9+"
                      : unreadCount}
                  </span>
                )}
              </div>

              <div>
                <div
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-[0.14em]
                    text-emerald-600
                    dark:text-emerald-400
                  "
                >
                  Community Center
                </div>

                <h1
                  className="
                    mt-1
                    text-xl
                    font-black
                    tracking-tight
                    text-slate-900
                    dark:text-white
                    sm:text-2xl
                  "
                >
                  Your notifications
                </h1>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-slate-400
                  "
                >
                  {unreadCount > 0
                    ? `You have ${unreadCount} unread ${
                        unreadCount ===
                        1
                          ? "notification"
                          : "notifications"
                      }.`
                    : "You're all caught up."}
                </p>
              </div>
            </div>

            <div
              className="
                flex
                gap-2
              "
            >
              <button
                type="button"
                onClick={
                  refreshNotifications
                }
                disabled={
                  refreshing
                }
                className="
                  inline-flex
                  flex-1
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-2.5
                  text-xs
                  font-bold
                  text-slate-600
                  transition
                  hover:bg-slate-50
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  dark:border-white/10
                  dark:text-slate-300
                  dark:hover:bg-white/5
                  sm:flex-none
                "
              >
                <RefreshCw
                  size={14}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={
                  markAllAsRead
                }
                disabled={
                  unreadCount === 0
                }
                className="
                  inline-flex
                  flex-1
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-emerald-600
                  px-4
                  py-2.5
                  text-xs
                  font-bold
                  text-white
                  transition
                  hover:bg-emerald-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  sm:flex-none
                "
              >
                <CheckCheck
                  size={14}
                />
                Mark all read
              </button>
            </div>
          </div>
        </section>

        {/* ====================================================
            SUMMARY CARDS
        ==================================================== */}

        <section
          className="
            grid
            grid-cols-2
            gap-3
            lg:grid-cols-4
          "
        >
          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
              shadow-sm
              dark:border-white/10
              dark:bg-slate-900
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
              "
            >
              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  bg-rose-50
                  text-rose-600
                  dark:bg-rose-950/30
                  dark:text-rose-400
                "
              >
                <Bell size={16} />
              </div>

              <span
                className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                New
              </span>
            </div>

            <div
              className="
                mt-3
                text-xl
                font-black
                text-slate-900
                dark:text-white
              "
            >
              {unreadCount}
            </div>

            <div
              className="
                mt-0.5
                text-[10px]
                font-semibold
                text-slate-400
              "
            >
              Unread
            </div>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
              shadow-sm
              dark:border-white/10
              dark:bg-slate-900
            "
          >
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-amber-50
                text-amber-600
                dark:bg-amber-950/30
                dark:text-amber-400
              "
            >
              <Bell size={16} />
            </div>

            <div
              className="
                mt-3
                text-xl
                font-black
                text-slate-900
                dark:text-white
              "
            >
              {mentionCount}
            </div>

            <div
              className="
                mt-0.5
                text-[10px]
                font-semibold
                text-slate-400
              "
            >
              Mentions
            </div>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
              shadow-sm
              dark:border-white/10
              dark:bg-slate-900
            "
          >
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-emerald-50
                text-emerald-600
                dark:bg-emerald-950/30
                dark:text-emerald-400
              "
            >
              <Users size={16} />
            </div>

            <div
              className="
                mt-3
                text-xl
                font-black
                text-slate-900
                dark:text-white
              "
            >
              {groupCount}
            </div>

            <div
              className="
                mt-0.5
                text-[10px]
                font-semibold
                text-slate-400
              "
            >
              Group updates
            </div>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
              shadow-sm
              dark:border-white/10
              dark:bg-slate-900
            "
          >
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-violet-50
                text-violet-600
                dark:bg-violet-950/30
                dark:text-violet-400
              "
            >
              <Sparkles size={16} />
            </div>

            <div
              className="
                mt-3
                text-xl
                font-black
                text-slate-900
                dark:text-white
              "
            >
              {notifications.length}
            </div>

            <div
              className="
                mt-0.5
                text-[10px]
                font-semibold
                text-slate-400
              "
            >
              Total updates
            </div>
          </div>
        </section>

        {/* ====================================================
            SEARCH + FILTERS
        ==================================================== */}

        <section
          className="
            rounded-[24px]
            border
            border-slate-200
            bg-white
            p-4
            shadow-sm
            dark:border-white/10
            dark:bg-slate-900
          "
        >
          <div
            className="
              flex
              flex-col
              gap-4
              lg:flex-row
              lg:items-center
            "
          >
            <div
              className="
                relative
                flex-1
              "
            >
              <Search
                size={16}
                className="
                  pointer-events-none
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search notifications..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  py-3.5
                  pl-11
                  pr-10
                  text-sm
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-emerald-500
                  focus:bg-white
                  focus:ring-4
                  focus:ring-emerald-500/10
                  dark:border-white/10
                  dark:bg-slate-950
                  dark:text-white
                  dark:focus:bg-slate-950
                "
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchTerm("")
                  }
                  className="
                    absolute
                    right-3
                    top-1/2
                    flex
                    h-7
                    w-7
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-lg
                    text-slate-400
                    hover:bg-slate-200
                    hover:text-slate-700
                    dark:hover:bg-white/10
                    dark:hover:text-white
                  "
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div
              className="
                flex
                gap-1.5
                overflow-x-auto
                pb-1
              "
            >
              {NOTIFICATION_FILTERS.map(
                (filter) => {
                  const active =
                    activeFilter ===
                    filter.value;

                  return (
                    <button
                      key={
                        filter.value
                      }
                      type="button"
                      onClick={() =>
                        setActiveFilter(
                          filter.value
                        )
                      }
                      className={`
                        shrink-0
                        rounded-xl
                        px-3
                        py-2.5
                        text-[10px]
                        font-bold
                        transition
                        ${
                          active
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        }
                      `}
                    >
                      {filter.label}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* ====================================================
            NOTIFICATION LIST
        ==================================================== */}

        <section
          className="
            overflow-hidden
            rounded-[26px]
            border
            border-slate-200
            bg-white
            shadow-sm
            dark:border-white/10
            dark:bg-slate-900
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-slate-100
              px-5
              py-4
              dark:border-white/5
            "
          >
            <div>
              <h2
                className="
                  text-sm
                  font-black
                  text-slate-900
                  dark:text-white
                "
              >
                Recent notifications
              </h2>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-slate-400
                "
              >
                Stay informed without leaving
                Community.
              </p>
            </div>

            <span
              className="
                text-[10px]
                font-bold
                text-slate-400
              "
            >
              {filteredNotifications.length}{" "}
              shown
            </span>
          </div>

          {filteredNotifications.length ===
          0 ? (
            <div
              className="
                flex
                min-h-[320px]
                flex-col
                items-center
                justify-center
                px-6
                text-center
              "
            >
              <div
                className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-slate-100
                  text-slate-400
                  dark:bg-slate-800
                "
              >
                <Bell size={21} />
              </div>

              <h3
                className="
                  mt-4
                  text-sm
                  font-black
                  text-slate-900
                  dark:text-white
                "
              >
                No notifications found
              </h3>

              <p
                className="
                  mt-1
                  max-w-sm
                  text-xs
                  leading-5
                  text-slate-400
                "
              >
                Try another filter or search
                term. New Community activity
                will appear here.
              </p>

              {(searchTerm ||
                activeFilter !==
                  "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setActiveFilter(
                      "all"
                    );
                  }}
                  className="
                    mt-4
                    rounded-xl
                    bg-emerald-600
                    px-4
                    py-2.5
                    text-xs
                    font-bold
                    text-white
                    transition
                    hover:bg-emerald-700
                  "
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredNotifications.map(
                (notification) => (
                  <article
                    key={
                      notification.id
                    }
                    className={`
                      group
                      relative
                      flex
                      gap-3
                      px-5
                      py-5
                      transition
                      hover:bg-slate-50
                      dark:hover:bg-white/[0.025]
                      ${
                        !notification.read
                          ? "bg-emerald-50/30 dark:bg-emerald-950/[0.08]"
                          : ""
                      }
                    `}
                  >
                    {/* UNREAD INDICATOR */}

                    {!notification.read && (
                      <span
                        className="
                          absolute
                          left-1
                          top-7
                          h-2
                          w-2
                          rounded-full
                          bg-emerald-500
                        "
                      />
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        openNotification(
                          notification
                        )
                      }
                      className="
                        flex
                        min-w-0
                        flex-1
                        items-start
                        gap-3
                        text-left
                      "
                    >
                      <NotificationIcon
                        type={
                          notification.type
                        }
                      />

                      <div className="min-w-0 flex-1">
                        <div
                          className="
                            flex
                            flex-wrap
                            items-start
                            justify-between
                            gap-2
                          "
                        >
                          <h3
                            className={`
                              text-xs
                              leading-5
                              ${
                                notification.read
                                  ? "font-semibold text-slate-700 dark:text-slate-200"
                                  : "font-black text-slate-900 dark:text-white"
                              }
                            `}
                          >
                            {
                              notification.title
                            }
                          </h3>

                          <span
                            className="
                              shrink-0
                              text-[10px]
                              font-medium
                              text-slate-400
                            "
                          >
                            {
                              notification.time
                            }
                          </span>
                        </div>

                        <p
                          className="
                            mt-1
                            text-xs
                            leading-5
                            text-slate-500
                            dark:text-slate-400
                          "
                        >
                          {
                            notification.message
                          }
                        </p>

                        <div
                          className="
                            mt-2
                            flex
                            flex-wrap
                            items-center
                            gap-2
                          "
                        >
                          <span
                            className="
                              rounded-full
                              bg-slate-100
                              px-2
                              py-1
                              text-[9px]
                              font-bold
                              text-slate-400
                              dark:bg-slate-800
                            "
                          >
                            {
                              notification.actor
                            }
                          </span>

                          <span
                            className="
                              rounded-full
                              bg-emerald-50
                              px-2
                              py-1
                              text-[9px]
                              font-bold
                              capitalize
                              text-emerald-600
                              dark:bg-emerald-950/30
                              dark:text-emerald-400
                            "
                          >
                            {
                              notification.category
                            }
                          </span>
                        </div>
                      </div>

                      <ChevronRight
                        size={16}
                        className="
                          mt-1
                          shrink-0
                          text-slate-300
                          transition
                          group-hover:translate-x-0.5
                          group-hover:text-emerald-500
                        "
                      />
                    </button>

                    {/* ACTIONS */}

                    <div
                      className="
                        flex
                        shrink-0
                        items-start
                      "
                    >
                      <button
                        type="button"
                        aria-label="Notification actions"
                        className="
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          rounded-lg
                          text-slate-300
                          transition
                          hover:bg-slate-100
                          hover:text-slate-600
                          dark:hover:bg-white/5
                          dark:hover:text-slate-200
                        "
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >
                        <MoreHorizontal
                          size={16}
                        />
                      </button>
                    </div>

                    {/* ACTION BAR */}

                    <div
                      className="
                        absolute
                        bottom-3
                        right-5
                        hidden
                        items-center
                        gap-2
                        group-hover:flex
                      "
                    >
                      {!notification.read && (
                        <button
                          type="button"
                          onClick={() =>
                            markAsRead(
                              notification.id
                            )
                          }
                          className="
                            inline-flex
                            items-center
                            gap-1
                            rounded-lg
                            bg-white
                            px-2.5
                            py-1.5
                            text-[9px]
                            font-bold
                            text-emerald-600
                            shadow-sm
                            ring-1
                            ring-slate-200
                            dark:bg-slate-900
                            dark:ring-white/10
                          "
                        >
                          <Check
                            size={11}
                          />
                          Mark read
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          removeNotification(
                            notification.id
                          )
                        }
                        className="
                          inline-flex
                          items-center
                          gap-1
                          rounded-lg
                          bg-white
                          px-2.5
                          py-1.5
                          text-[9px]
                          font-bold
                          text-slate-400
                          shadow-sm
                          ring-1
                          ring-slate-200
                          dark:bg-slate-900
                          dark:ring-white/10
                        "
                      >
                        <X size={11} />
                        Remove
                      </button>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>

        {/* ====================================================
            NOTIFICATION PREFERENCES
        ==================================================== */}

        <section
          className="
            rounded-[26px]
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
            dark:border-white/10
            dark:bg-slate-900
            sm:p-6
          "
        >
          <div
            className="
              flex
              flex-col
              gap-4
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div
              className="
                flex
                items-start
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-100
                  text-slate-500
                  dark:bg-slate-800
                  dark:text-slate-300
                "
              >
                <Settings size={17} />
              </div>

              <div>
                <h3
                  className="
                    text-sm
                    font-black
                    text-slate-900
                    dark:text-white
                  "
                >
                  Notification preferences
                </h3>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-slate-400
                  "
                >
                  Control how Community keeps
                  you informed.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "community-notification-settings"
                )
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-slate-200
                px-4
                py-2.5
                text-xs
                font-bold
                text-slate-600
                transition
                hover:bg-slate-50
                dark:border-white/10
                dark:text-slate-300
                dark:hover:bg-white/5
              "
            >
              Manage settings
              <ChevronRight
                size={14}
              />
            </button>
          </div>
        </section>

        {/* ====================================================
            COMMUNITY NAVIGATION
        ==================================================== */}

        <div
          className="
            flex
            flex-col
            items-center
            gap-3
            sm:flex-row
            sm:justify-center
          "
        >
          <button
            type="button"
            onClick={() =>
              navigate("community")
            }
            className="
              inline-flex
              items-center
              gap-2
              text-xs
              font-bold
              text-slate-400
              hover:text-emerald-600
              dark:hover:text-emerald-400
            "
          >
            <ArrowLeft size={14} />
            Community Home
          </button>

          <span className="hidden text-slate-300 sm:block">
            ·
          </span>

          <button
            type="button"
            onClick={() =>
              navigate(
                "community-activity"
              )
            }
            className="
              inline-flex
              items-center
              gap-2
              text-xs
              font-bold
              text-slate-400
              hover:text-emerald-600
              dark:hover:text-emerald-400
            "
          >
            <Activity size={14} />
            My Activity
          </button>

          <span className="hidden text-slate-300 sm:block">
            ·
          </span>

          <button
            type="button"
            onClick={() =>
              navigate(
                "community-groups"
              )
            }
            className="
              inline-flex
              items-center
              gap-2
              text-xs
              font-bold
              text-slate-400
              hover:text-emerald-600
              dark:hover:text-emerald-400
            "
          >
            <Users size={14} />
            Groups
          </button>
        </div>
      </div>
    </JumuiyaDashboardShell>
  );
}
