// src/components/MainDashboardV2.jsx

import React, {
  useState,
  useEffect,
  Suspense,
  useCallback,
} from "react";

import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  Bot,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  Minus,
  Maximize2,
  Sparkles,
  Home,
  BookOpen,
  GraduationCap,
  Leaf,
  ShoppingCart,
  Users,
} from "lucide-react";

import { DASHBOARDS } from "./dashboardConfig.jsx";
import Loading from "./common/Loading.jsx";
import AvatarMenu from "./accounts/AvatarMenu.jsx";
import Notifications from "./accounts/Notifications.jsx";
import { ErrorBoundary } from "./common/ErrorBoundary.jsx";
import StartModal from "./StartModal.jsx";

import { useTheme } from "@/components/hooks/useTheme.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

function RevelaAIIcon({ size = 32, className = "" }) {
  return (
    <>
      <img
        src="/revelaai-icon.svg"
        alt=""
        width={size}
        height={size}
        className={`dark:hidden ${className}`}
      />
      <img
        src="/revelaai-icon-dark.svg"
        alt=""
        width={size}
        height={size}
        className={`hidden dark:block ${className}`}
      />
    </>
  );
}

/* =========================================================
   Fullscreen AI Assistant
========================================================= */

function FullscreenAIAssistant({
  open,
  onClose,
  aiElement,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="
            fixed
            inset-0
            z-[9998]
            flex
            flex-col
            bg-gray-100
            dark:bg-gray-950
          "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* =================================================
              AI HEADER
          ================================================= */}

          <div
            className="
              flex
              h-14
              shrink-0
              items-center
              justify-between
              border-b
              border-gray-200
              bg-white
              px-3
              dark:border-gray-800
              dark:bg-gray-950
              sm:px-4
            "
          >
            <div
              className="
                flex
                min-w-0
                items-center
                gap-2
                sm:gap-3
              "
            >
              <div className="flex items-center gap-2">
                <RevelaAIIcon size={24} />
                <h3 className="font-bold text-gray-900 dark:text-gray-100">RevelaAI</h3>
              </div>
              <span
                className="
                  hidden
                  rounded-full
                  border
                  border-green-200
                  bg-green-100
                  px-2
                  py-1
                  text-[10px]
                  font-semibold
                  text-green-700
                  dark:border-green-800/50
                  dark:bg-green-900/30
                  dark:text-green-300
                  sm:inline-flex
                "
              >
                FULLSCREEN MODE
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="
                rounded-xl
                p-2
                text-gray-500
                transition
                hover:bg-gray-200
                dark:text-gray-400
                dark:hover:bg-gray-800
              "
              title="Close AI"
              aria-label="Close AI"
            >
              <X size={20} />
            </button>
          </div>

          {/* =================================================
              AI CONTENT
          ================================================= */}

          <div className="min-h-0 flex-1 overflow-hidden">
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                {aiElement ? (
                  React.cloneElement(aiElement)
                ) : (
                  <div
                    className="
                      m-4
                      rounded-2xl
                      border
                      border-gray-200
                      bg-white
                      p-6
                      shadow
                      dark:border-gray-800
                      dark:bg-gray-900
                    "
                  >
                    <h4
                      className="
                        font-semibold
                        text-gray-900
                        dark:text-gray-100
                      "
                    >
                      AI Dashboard Not Found
                    </h4>

                    <p
                      className="
                        mt-2
                        text-sm
                        leading-6
                        text-gray-600
                        dark:text-gray-300
                      "
                    >
                      Make sure you have a dashboard
                      with key{" "}
                      <code
                        className="
                          rounded
                          bg-gray-200
                          px-1
                          py-0.5
                          dark:bg-gray-800
                        "
                      >
                        ai
                      </code>{" "}
                      inside{" "}
                      <code
                        className="
                          rounded
                          bg-gray-200
                          px-1
                          py-0.5
                          dark:bg-gray-800
                        "
                      >
                        DASHBOARDS
                      </code>
                      .
                    </p>
                  </div>
                )}
              </ErrorBoundary>
            </Suspense>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =========================================================
   Main Dashboard Shell
========================================================= */

export default function MainDashboardV2() {
  /*
   * IMPORTANT:
   *
   * MainDashboardV2 is the APPLICATION SHELL.
   *
   * It should NOT be registered as a dashboard inside
   * dashboardConfig.jsx.
   *
   * dashboardConfig.jsx contains the actual dashboards:
   *
   *   home
   *   bible
   *   study
   *   biashara
   *   shamba
   *   elimu
   *   community
   *   ai
   *   etc.
   */

  const defaultDashboard = "home";

  const [activeView, setActiveView] =
    useState(defaultDashboard);

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [aiFullscreenOpen, setAIFullscreenOpen] =
    useState(false);

  const [aiWidgetOpen, setAIWidgetOpen] = useState(false);
  const [aiWidgetMinimized, setAIWidgetMinimized] = useState(false);

  const [showStartModal, setShowStartModal] =
    useState(false);

  const [searchParams] =
    useSearchParams();

  const { theme, setTheme } =
    useTheme();

  const { user, logout } =
    useAuth();

  const isGuest =
    user?.role === "guest";

  /* =========================================================
     Sidebar Scroll Lock
  ========================================================= */

  useEffect(() => {
    if (!sidebarOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  /* =========================================================
     Navigation
  ========================================================= */

  const handleNavigate = useCallback((view) => {
    if (!view) {
      return;
    }

    setActiveView(view);
    setSidebarOpen(false);
  }, []);

  /* =========================================================
     Start / Authentication Modal
  ========================================================= */

  useEffect(() => {
    if (!user) {
      setShowStartModal(true);
      return;
    }

    setShowStartModal(false);
  }, [user]);

  const handleStartComplete = useCallback(() => {
    setShowStartModal(false);
  }, []);

  /* =========================================================
     Direct Hub Links
  ========================================================= */

  useEffect(() => {
    const requestedHub = String(searchParams.get("hub") || "")
      .trim()
      .toLowerCase();

    if (!requestedHub) return;

    const isKnownHub = DASHBOARDS.some(
      (dashboard) => dashboard.key === requestedHub
    );

    if (!isKnownHub) return;

    setActiveView(requestedHub);
    setSidebarOpen(false);
  }, [searchParams]);

  /* =========================================================
     Verse URL Handling
  ========================================================= */

  useEffect(() => {
    const verse =
      searchParams.get("verse");

    if (!verse) {
      return;
    }

    setActiveView("bible");
    setSidebarOpen(false);
  }, [searchParams]);

  /* =========================================================
     Keyboard Shortcuts
  ========================================================= */

  useEffect(() => {
    const handler = (event) => {
      /*
       * Ctrl + K
       * Open / close RevelaAI fullscreen.
       */

      if (
        event.ctrlKey &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();

        setAIFullscreenOpen(
          (current) => !current
        );

        return;
      }

      /*
       * Escape
       * Close overlays.
       */

      if (event.key === "Escape") {
        setAIFullscreenOpen(false);
        setSidebarOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handler
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handler
      );
    };
  }, []);

  /* =========================================================
     Active Dashboard
  ========================================================= */

  const activeDashboard =
    DASHBOARDS.find(
      (dashboard) =>
        dashboard.key === activeView
    ) ||
    DASHBOARDS.find(
      (dashboard) =>
        dashboard.key === defaultDashboard
    );

  const activeComponent =
    activeDashboard?.element;

  /* =========================================================
     AI Dashboard
  ========================================================= */

  const aiDashboardElement =
    DASHBOARDS.find(
      (dashboard) =>
        dashboard.key === "ai"
    )?.element;

  const activeHubKey = activeView;
  const activeHubTitle = activeDashboard?.title || "RevelaCode";

  // Hub dashboards own their workspace headers. Keep the shell header
  // for Home and utility/section screens to avoid stacked header bars.
  const hubViewsWithOwnHeader = new Set([
    "faith",
    "education",
    "shamba",
    "biashara",
    "community",
    "payments",
  ]);
  const showShellHeader = !hubViewsWithOwnHeader.has(activeView);

  const openAIWidget = useCallback(() => {
    setAIWidgetOpen(true);
    setAIWidgetMinimized(false);
  }, []);

  const closeAIWidget = useCallback(() => {
    setAIWidgetOpen(false);
    setAIWidgetMinimized(false);
  }, []);

  const maximizeAIWidget = useCallback(() => {
    setAIWidgetOpen(false);
    setAIWidgetMinimized(false);
    setAIFullscreenOpen(true);
  }, []);

  /* =========================================================
     Navigation Entries
  ========================================================= */

  const visibleDashboards =
    DASHBOARDS
      .filter(
        (dashboard) =>
          !dashboard.hidden
      )
      .filter((dashboard) => {
        /*
         * Guests should not see the accounts
         * dashboard in the main navigation.
         */

        if (
          isGuest &&
          dashboard.key === "accounts"
        ) {
          return false;
        }

        return true;
      });

/* =========================================================
BIASHARA INTERNAL SECTIONS
========================================================= */

const BIASHARA_SECTIONS = {
  OVERVIEW: "overview",
  PRODUCTS: "products",
  ORDERS: "orders",
  CUSTOMERS: "customers",
  SALES: "sales",
  ANALYTICS: "biashara-analytics",
  INTELLIGENCE: "biashara-intelligence",
  BUSINESS_PROFILE: "business-profile",
  NOTIFICATIONS: "notifications",
};

const BIASHARA_SECTION_KEYS = new Set(
  Object.values(BIASHARA_SECTIONS)
);

  /* =========================================================
     Render
  ========================================================= */

  return (
    <>
      {/* =====================================================
          START / AUTH MODAL
      ===================================================== */}

      <AnimatePresence>
        {showStartModal && (
          <StartModal
            onComplete={
              handleStartComplete
            }
          />
        )}
      </AnimatePresence>

      {/* =====================================================
          FULLSCREEN AI
      ===================================================== */}

      <FullscreenAIAssistant
        open={aiFullscreenOpen}
        onClose={() => setAIFullscreenOpen(false)}
        aiElement={
          aiDashboardElement
            ? React.cloneElement(aiDashboardElement, { activeHub: activeHubKey })
            : null
        }
      />

      {/* =====================================================
          APP SHELL
      ===================================================== */}

      <div
        className="
          relative
          flex
          h-[100dvh]
          min-h-0
          min-w-0
          overflow-hidden
          bg-gray-100
          transition-colors
          dark:bg-gray-950
        "
      >
        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* =================================================
                  MOBILE OVERLAY
              ================================================= */}

              <motion.button
                type="button"
                aria-label="Close navigation"
                className="
                  fixed
                  inset-0
                  z-[60]
                  cursor-default
                  bg-black/40
                  lg:hidden
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
                transition={{
                  duration: 0.2,
                }}
                onClick={() =>
                  setSidebarOpen(false)
                }
              />

              {/* =================================================
                  DRAWER
              ================================================= */}

              <motion.aside
                initial={{
                  x: "-100%",
                }}
                animate={{
                  x: 0,
                }}
                exit={{
                  x: "-100%",
                }}
                transition={{
                  type: "spring",
                  stiffness: 320,
                  damping: 30,
                  mass: 0.8,
                }}
                className="
                  fixed
                  inset-y-0
                  left-0
                  z-[70]
                  flex
                  w-[min(18rem,88vw)]
                  flex-col
                  overflow-hidden
                  border-r
                  border-gray-200
                  bg-white
                  text-gray-900
                  shadow-2xl
                  dark:border-gray-800
                  dark:bg-gray-950
                  dark:text-white
                  lg:relative
                  lg:z-30
                "
              >
                {/* =================================================
                    DRAWER HEADER
                ================================================= */}

                <div
                  className="
                    flex
                    h-16
                    shrink-0
                    items-center
                    justify-between
                    border-b
                    border-gray-200
                    px-4
                    dark:border-gray-800
                  "
                >
                  <div
                    className="
                      flex
                      min-w-0
                      items-center
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
                        bg-gradient-to-br
                        from-indigo-600
                        via-purple-600
                        to-pink-600
                        text-sm
                        font-black
                        text-white
                        shadow-lg
                      "
                    >
                      R
                    </div>

                    <div className="min-w-0">
                      <p
                        className="
                          truncate
                          text-sm
                          font-bold
                        "
                      >
                        RevelaCode
                      </p>

                      <p
                        className="
                          truncate
                          text-[11px]
                          text-gray-500
                          dark:text-gray-400
                        "
                      >
                        AI-Powered Technology Ecosystem
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSidebarOpen(false)
                    }
                    className="
                      rounded-xl
                      p-2
                      text-gray-500
                      transition
                      hover:bg-gray-100
                      hover:text-gray-900
                      dark:text-gray-400
                      dark:hover:bg-gray-800
                      dark:hover:text-white
                      lg:hidden
                    "
                    aria-label="Close sidebar"
                  >
                    <X size={19} />
                  </button>
                </div>

                {/* =================================================
                    NAVIGATION
                ================================================= */}

                <nav
                  className="
                    flex-1
                    overflow-y-auto
                    overscroll-contain
                    px-3
                    py-4
                  "
                >
                  <div className="mb-3 px-2">
                    <p
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.16em]
                        text-gray-400
                      "
                    >
                      Workspace
                    </p>
                  </div>

                  <div className="space-y-1">
                    {visibleDashboards.map(
                      ({
                        key,
                        label,
                        icon: Icon,
                        color,
                      }) => {
                        const active =
                          activeView === key;

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() =>
                              handleNavigate(key)
                            }
                            className={`
                              group
                              relative
                              flex
                              w-full
                              items-center
                              gap-3
                              rounded-xl
                              px-3
                              py-3
                              text-left
                              text-sm
                              font-medium
                              transition-all
                              duration-200
                              ${
                                active
                                  ? "bg-gray-100 text-gray-950 shadow-sm dark:bg-gray-900 dark:text-white"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-900/70 dark:hover:text-white"
                              }
                            `}
                          >
                            {/* Active Indicator */}

                            {active && (
                              <span
                                className={`
                                  absolute
                                  left-0
                                  top-1/2
                                  h-7
                                  w-1
                                  -translate-y-1/2
                                  rounded-r-full
                                  bg-gradient-to-b
                                  ${
                                    color ||
                                    "from-indigo-500 to-purple-500"
                                  }
                                `}
                              />
                            )}

                            {/* Icon */}

                            <span
                              className={`
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                transition
                                ${
                                  active
                                    ? `bg-gradient-to-br ${
                                        color ||
                                        "from-indigo-500 to-purple-500"
                                      } text-white shadow-md`
                                    : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:group-hover:bg-gray-800"
                                }
                              `}
                            >
                              {Icon ? (
                                <Icon size={17} />
                              ) : (
                                <span className="text-xs">
                                  •
                                </span>
                              )}
                            </span>

                            {/* Label */}

                            <span
                              className="
                                min-w-0
                                flex-1
                                truncate
                              "
                            >
                              {label}
                            </span>

                            {/* Active Dot */}

                            {active && (
                              <span
                                className="
                                  text-xs
                                  text-gray-400
                                "
                              >
                                ●
                              </span>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </nav>

                {/* =================================================
                    SIDEBAR FOOTER
                ================================================= */}

                <div
                  className="
                    shrink-0
                    border-t
                    border-gray-200
                    p-3
                    dark:border-gray-800
                  "
                >
                  {/* User */}

                  <div
                    className="
                      mb-3
                      rounded-xl
                      bg-gray-50
                      p-3
                      dark:bg-gray-900
                    "
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-gradient-to-br
                          from-gray-700
                          to-gray-900
                          text-xs
                          font-bold
                          text-white
                          dark:from-gray-200
                          dark:to-white
                          dark:text-gray-900
                        "
                      >
                        {(
                          user?.fullName ||
                          user?.full_name ||
                          user?.name ||
                          user?.display_name ||
                          user?.contact ||
                          "G"
                         )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p
                          className="
                            truncate
                            text-sm
                            font-semibold
                          "
                        >
                          {user?.fullName ||
                            user?.full_name ||
                            user?.name ||
                            user?.display_name ||
                            user?.contact ||
                          "Guest"}
                        </p>

                        <p
                          className="
                            truncate
                            text-[11px]
                            text-gray-500
                            dark:text-gray-400
                          "
                        >
                          {isGuest
                            ? "Guest Session"
                            : user?.role ||
                              "Account"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}

                  <div className="grid grid-cols-2 gap-2">
                    {/* Theme */}

                    <button
                      type="button"
                      onClick={() =>
                        setTheme(
                          theme === "dark"
                            ? "light"
                            : "dark"
                        )
                      }
                      className="
                        flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        border
                        border-gray-200
                        px-3
                        py-2.5
                        text-xs
                        font-semibold
                        text-gray-700
                        transition
                        hover:bg-gray-100
                        dark:border-gray-800
                        dark:text-gray-300
                        dark:hover:bg-gray-900
                      "
                      aria-label="Toggle theme"
                    >
                      {theme === "dark" ? (
                        <>
                          <Sun size={15} />
                          Light
                        </>
                      ) : (
                        <>
                          <Moon size={15} />
                          Dark
                        </>
                      )}
                    </button>

                    {/* Logout */}

                    <button
                      type="button"
                      onClick={logout}
                      className="
                        flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        border
                        border-red-200
                        px-3
                        py-2.5
                        text-xs
                        font-semibold
                        text-red-600
                        transition
                        hover:bg-red-50
                        dark:border-red-900/50
                        dark:text-red-400
                        dark:hover:bg-red-950/30
                      "
                    >
                      <LogOut size={15} />
                      Logout
                    </button>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ===================================================
            MAIN AREA
        =================================================== */}

        <main
          className="
            relative
            flex
            min-w-0
            flex-1
            flex-col
            overflow-hidden
          "
        >
          {/* =================================================
              HEADER
          ================================================= */}

          {showShellHeader && (
          <header
            className="
              sticky
              top-0
              z-40
              shrink-0
              border-b
              border-gray-200
              bg-white
              dark:border-gray-800
              dark:bg-gray-950
            "
          >
            <div
              className="
                flex
                min-h-16
                items-center
                justify-between
                gap-3
                px-3
                sm:px-4
                lg:px-6
              "
            >
              {/* LEFT */}

              <div
                className="
                  flex
                  min-w-0
                  items-center
                  gap-2
                "
              >
                {/* Sidebar Button */}

                <button
                  type="button"
                  onClick={() =>
                    setSidebarOpen(
                      (open) => !open
                    )
                  }
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    text-gray-700
                    shadow-sm
                    transition-all
                    duration-200
                    hover:bg-gray-100
                    hover:shadow-md
                    active:scale-95
                    dark:border-gray-800
                    dark:bg-gray-900
                    dark:text-gray-200
                    dark:hover:bg-gray-800
                  "
                  aria-label={
                    sidebarOpen
                      ? "Close navigation"
                      : "Open navigation"
                  }
                  title={
                    sidebarOpen
                      ? "Close sidebar"
                      : "Open sidebar"
                  }
                >
                  {sidebarOpen ? (
                    <X size={20} />
                  ) : (
                    <Menu size={20} />
                  )}
                </button>

                {/* Dashboard Title */}

                <div className="min-w-0">
                  <h2
                    className="
                      truncate
                      text-sm
                      font-bold
                      text-gray-900
                      dark:text-white
                      sm:text-base
                      lg:text-lg
                    "
                  >
                    {activeDashboard?.title ||
                      "RevelaCode"}
                  </h2>
                </div>
              </div>

              {/* RIGHT */}

              <div
                className="
                  flex
                  shrink-0
                  items-center
                  gap-1.5
                  sm:gap-2
                "
              >
                {/* Notifications */}

                <Notifications />

                {/* Avatar */}

                <div
                  className="
                    flex
                    h-10
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-1
                    shadow-sm
                    dark:border-gray-800
                    dark:bg-gray-900
                  "
                >
                  <AvatarMenu user={user} />
                </div>

                {/* Guest Login */}

                {isGuest && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowStartModal(true)
                    }
                    className="
                      hidden
                      rounded-xl
                      bg-indigo-600
                      px-3
                      py-2
                      text-xs
                      font-bold
                      text-white
                      transition
                      hover:bg-indigo-700
                      sm:inline-flex
                    "
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          </header>
          )}

          {!showShellHeader && !sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open workspace navigation"
              title="Open workspace navigation"
              className="fixed bottom-6 left-4 z-[90] hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-slate-700 shadow-lg backdrop-blur transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200 dark:hover:bg-slate-800 lg:inline-flex"
            >
              <Menu size={19} />
            </button>
          )}

          {/* =================================================
              DASHBOARD CONTENT
          ================================================= */}

          <section
            className="
              min-w-0
              flex-1
              overflow-y-auto
              overscroll-contain
              bg-gray-100
              px-3
              pt-3
              pb-24
              dark:bg-gray-950
              sm:px-4
              sm:py-4
              lg:px-6
              lg:py-6
              lg:pb-6
            "
          >
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                {activeComponent ? (
                  React.cloneElement(
                    activeComponent,
                    {
                      user,
                      isGuest,
                      onNavigate:
                        handleNavigate,
                      onOpenAI: () =>
                        setAIFullscreenOpen(
                          true
                        ),
                    }
                  )
                ) : (
                  <div
                    className="
                      rounded-2xl
                      border
                      border-gray-200
                      bg-white
                      p-6
                      shadow-sm
                      dark:border-gray-800
                      dark:bg-gray-900
                    "
                  >
                    <h3
                      className="
                        font-bold
                        text-gray-900
                        dark:text-white
                      "
                    >
                      Dashboard unavailable
                    </h3>

                    <p
                      className="
                        mt-2
                        text-sm
                        text-gray-600
                        dark:text-gray-300
                      "
                    >
                      The selected dashboard
                      could not be loaded.
                    </p>
                  </div>
                )}
              </ErrorBoundary>
            </Suspense>
          </section>

          {/* Mobile-first shell footer navigation */}
          {!sidebarOpen && (
            <nav
              aria-label="Main workspace navigation"
              className="fixed inset-x-0 bottom-0 z-[80] border-t border-slate-200/90 bg-white/95 px-1 pt-1.5 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 lg:hidden"
            >
              <div className="mx-auto grid max-w-xl grid-cols-7 gap-0.5">
                {[
                  { key: "home", label: "Home", Icon: Home },
                  { key: "faith", label: "Faith", Icon: BookOpen },
                  { key: "education", label: "Elimu", Icon: GraduationCap },
                  { key: "shamba", label: "Shamba", Icon: Leaf },
                  { key: "biashara", label: "Biashara", Icon: ShoppingCart },
                  { key: "community", label: "Community", Icon: Users },
                ].map(({ key, label, Icon }) => {
                  const active = activeView === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleNavigate(key)}
                      aria-current={active ? "page" : undefined}
                      aria-label={`Open ${label}`}
                      className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-2 text-[9px] font-bold transition active:scale-95 sm:text-[10px] ${active ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"}`}
                    >
                      <Icon size={19} strokeWidth={active ? 2.5 : 2} />
                      <span className="max-w-full truncate">{label}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open all navigation options"
                  className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-2 text-[9px] font-bold text-slate-500 transition active:scale-95 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900 sm:text-[10px]"
                >
                  <Menu size={19} />
                  <span className="truncate">More</span>
                </button>
              </div>
            </nav>
          )}

          {/* Context-aware floating RevelaAI widget */}
          <AnimatePresence>
            {aiWidgetOpen && (
              <motion.section
                key="revela-ai-floating-widget"
                initial={{ opacity: 0, y: 18, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                aria-label="RevelaAI floating assistant"
                className={[
                  "fixed right-3 z-[9997] flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-gray-700 dark:bg-gray-950 dark:shadow-black/40 sm:right-6",
                  aiWidgetMinimized
                    ? "bottom-[5.25rem] w-[min(20rem,calc(100vw-1.5rem))]"
                    : "bottom-[5.25rem] h-[min(42rem,calc(100dvh-7rem))] w-[min(27rem,calc(100vw-1.5rem))] sm:bottom-24 sm:h-[min(42rem,calc(100dvh-8rem))]",
                ].join(" ")}
              >
                <header className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-900 sm:px-4">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      <RevelaAIIcon size={25} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-extrabold text-gray-950 dark:text-white">RevelaAI</h2>
                      <p className="flex min-w-0 items-center gap-1.5 truncate text-[10px] text-gray-500 dark:text-gray-400">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        <span className="truncate">Workspace: {activeHubTitle}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => setAIWidgetMinimized((value) => !value)} className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white" title={aiWidgetMinimized ? "Restore assistant" : "Minimize assistant"} aria-label={aiWidgetMinimized ? "Restore assistant" : "Minimize assistant"}>
                      {aiWidgetMinimized ? <Maximize2 size={16} /> : <Minus size={16} />}
                    </button>
                    {!aiWidgetMinimized && (
                      <button type="button" onClick={maximizeAIWidget} className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white" title="Maximize assistant" aria-label="Maximize assistant">
                        <Maximize2 size={16} />
                      </button>
                    )}
                    <button type="button" onClick={closeAIWidget} className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-gray-400 dark:hover:bg-red-950/50 dark:hover:text-red-300" title="Close assistant" aria-label="Close assistant">
                      <X size={17} />
                    </button>
                  </div>
                </header>
                {!aiWidgetMinimized && (
                  <div className="min-h-0 flex-1 overflow-hidden bg-white dark:bg-gray-950">
                    <Suspense fallback={<Loading />}>
                      <ErrorBoundary>
                        {aiDashboardElement
                          ? React.cloneElement(aiDashboardElement, { activeHub: activeHubKey, compactMode: true })
                          : <div className="p-5 text-sm text-gray-600 dark:text-gray-300">RevelaAI is unavailable right now.</div>}
                      </ErrorBoundary>
                    </Suspense>
                  </div>
                )}
              </motion.section>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={openAIWidget}
            className="fixed bottom-20 right-3 z-[9996] flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-xl shadow-slate-950/15 transition hover:-translate-y-1 hover:shadow-2xl active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-gray-900 dark:focus-visible:ring-offset-gray-950 sm:bottom-20 sm:right-6 lg:bottom-6"
            title={"RevelaAI Assistant — " + activeHubTitle + " (Ctrl + K)"}
            aria-label={"Open RevelaAI Assistant for " + activeHubTitle}
          >
            <RevelaAIIcon size={34} />
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-gray-900" />
          </button>
        </main>
      </div>
    </>
  );
}

