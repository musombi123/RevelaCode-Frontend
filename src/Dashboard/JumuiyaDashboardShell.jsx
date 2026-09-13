import React from "react";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  ChevronRight,
  Home,
  Leaf,
  Menu,
  ShoppingCart,
  Users,
  WalletCards,
} from "lucide-react";

/* =========================================================
   JUMUIYA DASHBOARD SHELL

   IMPORTANT:
   - This component is UI/layout only.
   - It must NOT call hub APIs.
   - It must NOT contain Biashara/Shamba/Elimu logic.
   - Individual dashboards own their own API requests.
========================================================= */

const HUBS = [
  {
    key: "home",
    label: "Home",
    icon: Home,
  },
  {
    key: "biashara",
    label: "Biashara",
    icon: ShoppingCart,
  },
  {
    key: "shamba",
    label: "Shamba",
    icon: Leaf,
  },
  {
    key: "education",
    label: "Education",
    icon: BookOpen,
  },
  {
    key: "community",
    label: "Community",
    icon: Users,
  },
  {
    key: "payments",
    label: "Payments",
    icon: WalletCards,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function getInitials(user) {
  const name =
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    user?.username ||
    user?.email ||
    "User";

  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getDisplayName(user) {
  return (
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    user?.username ||
    user?.email ||
    "Jumuiya User"
  );
}

function normalizeHubKey(activeHub) {
  if (!activeHub) {
    return "";
  }

  const value = String(activeHub).toLowerCase();

  if (value === "elimu") {
    return "education";
  }

  if (value === "education") {
    return "education";
  }

  return value;
}

function getHubTheme(activeHub) {
  const hub = normalizeHubKey(activeHub);

  switch (hub) {
    case "biashara":
      return {
        icon: ShoppingCart,
        iconWrapper:
          "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
        badge:
          "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
        accent: "text-blue-600 dark:text-blue-400",
      };

    case "shamba":
      return {
        icon: Leaf,
        iconWrapper:
          "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
        badge:
          "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
        accent: "text-orange-600 dark:text-orange-400",
      };

    case "education":
      return {
        icon: BookOpen,
        iconWrapper:
          "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
        badge:
          "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
        accent: "text-purple-600 dark:text-purple-400",
      };

    case "community":
      return {
        icon: Users,
        iconWrapper:
          "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
        badge:
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
        accent: "text-emerald-600 dark:text-emerald-400",
      };

    case "payments":
      return {
        icon: WalletCards,
        iconWrapper:
          "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
        badge:
          "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
        accent: "text-indigo-600 dark:text-indigo-400",
      };

    default:
      return {
        icon: BarChart3,
        iconWrapper:
          "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
        badge:
          "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300",
        accent: "text-slate-600 dark:text-slate-300",
      };
  }
}

/* =========================================================
   COMPONENT
========================================================= */

export default function JumuiyaDashboardShell({
  children,
  title = "Jumuiya",
  subtitle = "One ecosystem. Many possibilities.",
  activeHub = "",
  user = null,
  onNavigate,
  onBack,
  showBackButton = false,
  showHubNavigation = true,
  className = "",
}) {
  const normalizedActiveHub = normalizeHubKey(activeHub);
  const theme = getHubTheme(activeHub);
  const HubIcon = theme.icon;

  const navigate = (key) => {
    if (typeof onNavigate === "function") {
      onNavigate(key);
    }
  };

  const displayName = getDisplayName(user);
  const initials = getInitials(user);

  return (
    <div
      className={`
        w-full
        min-w-0
        space-y-5
        sm:space-y-6
        ${className}
      `}
    >
      {/* ===================================================
          TOP HEADER
      =================================================== */}

      <header
        className="
          rounded-[28px]
          border
          border-slate-200
          bg-white
          p-4
          shadow-sm
          dark:border-white/10
          dark:bg-slate-900
          sm:p-5
        "
      >
        <div
          className="
            flex
            min-w-0
            items-center
            justify-between
            gap-3
          "
        >
          {/* LEFT */}
          <div className="flex min-w-0 items-center gap-3">
            {showBackButton && (
              <button
                type="button"
                onClick={() => {
                  if (typeof onBack === "function") {
                    onBack();
                    return;
                  }

                  navigate("home");
                }}
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-slate-200
                  bg-slate-50
                  text-slate-600
                  transition
                  hover:bg-slate-100
                  dark:border-white/10
                  dark:bg-white/5
                  dark:text-slate-300
                  dark:hover:bg-white/10
                "
                aria-label="Go back"
              >
                <ArrowLeft size={19} />
              </button>
            )}

            <div
              className={`
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-2xl
                ${theme.iconWrapper}
              `}
            >
              <HubIcon size={21} />
            </div>

            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h1
                  className="
                    truncate
                    text-lg
                    font-black
                    tracking-tight
                    text-slate-950
                    dark:text-white
                    sm:text-xl
                  "
                >
                  {title}
                </h1>

                {normalizedActiveHub && (
                  <span
                    className={`
                      hidden
                      shrink-0
                      rounded-full
                      px-2
                      py-1
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-wide
                      sm:inline-flex
                      ${theme.badge}
                    `}
                  >
                    Hub
                  </span>
                )}
              </div>

              <p
                className="
                  mt-0.5
                  truncate
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                  sm:text-sm
                "
              >
                {subtitle}
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex shrink-0 items-center gap-2">
            <div
              className="
                hidden
                items-center
                gap-2
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                px-3
                py-2
                sm:flex
                dark:border-white/10
                dark:bg-white/5
              "
            >
              <div
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-900
                  text-[11px]
                  font-black
                  text-white
                  dark:bg-white
                  dark:text-slate-900
                "
              >
                {initials}
              </div>

              <div className="max-w-[140px]">
                <p
                  className="
                    truncate
                    text-xs
                    font-bold
                    text-slate-800
                    dark:text-slate-200
                  "
                >
                  {displayName}
                </p>

                <p
                  className="
                    text-[10px]
                    text-slate-400
                  "
                >
                  Jumuiya
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("home")}
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-2xl
                border
                border-slate-200
                bg-white
                text-slate-600
                transition
                hover:bg-slate-50
                dark:border-white/10
                dark:bg-slate-900
                dark:text-slate-300
                dark:hover:bg-white/5
                sm:hidden
              "
              aria-label="Home"
            >
              <Home size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================
          HUB NAVIGATION

          This is deliberately generic.
          No API calls are made here.
      =================================================== */}

      {showHubNavigation && (
        <div
          className="
            overflow-x-auto
            scrollbar-none
            rounded-[24px]
            border
            border-slate-200
            bg-white
            p-2
            shadow-sm
            dark:border-white/10
            dark:bg-slate-900
          "
        >
          <div
            className="
              flex
              min-w-max
              items-center
              gap-1
            "
          >
            {HUBS.map((hub) => {
              const Icon = hub.icon;
              const isActive =
                normalizedActiveHub === hub.key;

              return (
                <button
                  key={hub.key}
                  type="button"
                  onClick={() => navigate(hub.key)}
                  className={`
                    inline-flex
                    items-center
                    gap-2
                    rounded-2xl
                    px-3
                    py-2.5
                    text-xs
                    font-bold
                    transition
                    sm:px-4
                    ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                    }
                  `}
                >
                  <Icon size={15} />

                  <span>{hub.label}</span>

                  {isActive && (
                    <ChevronRight
                      size={14}
                      className="opacity-70"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================
          MOBILE USER STRIP
      =================================================== */}

      {user && (
        <div
          className="
            flex
            items-center
            gap-3
            rounded-2xl
            border
            border-slate-200
            bg-white
            px-4
            py-3
            shadow-sm
            dark:border-white/10
            dark:bg-slate-900
            sm:hidden
          "
        >
          <div
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-slate-900
              text-[11px]
              font-black
              text-white
              dark:bg-white
              dark:text-slate-900
            "
          >
            {initials}
          </div>

          <div className="min-w-0">
            <p
              className="
                truncate
                text-xs
                font-bold
                text-slate-800
                dark:text-slate-200
              "
            >
              {displayName}
            </p>

            <p className="text-[10px] text-slate-400">
              Jumuiya account
            </p>
          </div>

          <div className="ml-auto">
            <Menu
              size={18}
              className="text-slate-400"
            />
          </div>
        </div>
      )}

      {/* ===================================================
          DASHBOARD CONTENT

          Individual hubs render their own content here.
      =================================================== */}

      <main className="min-w-0">
        {children}
      </main>
    </div>
  );
}
