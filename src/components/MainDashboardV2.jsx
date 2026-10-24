// src/components/MainDashboardV2.jsx

import React, {
  useState,
  useEffect,
  useRef,
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
import OfflineSyncStatus from "@/components/OfflineSyncStatus.jsx";
import {
  offlineScopeForUser,
  readOfflineSession,
  recordOfflineActivity,
  saveOfflineSession,
} from "@/services/offlineHubSync.js";

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
            z-[10050]
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

export default function MainDashboardV2({ initialDashboardKey = null } = {}) {
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
  const initialDashboard = DASHBOARDS.some(
    (dashboard) => dashboard.key === initialDashboardKey,
  )
    ? initialDashboardKey
    : defaultDashboard;

  const [activeView, setActiveView] =
    useState(initialDashboard);
  const [sessionRestoreAttempted, setSessionRestoreAttempted] = useState(false);
  const sessionLoadedScopeRef = useRef("");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(null);

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

  const { user, logout, isAuthenticated } =
    useAuth();
  const offlineScope = isAuthenticated ? offlineScopeForUser(user) : "";
  const currentSearch = searchParams.toString();

  const isGuest =
    user?.role === "guest";

  // Restore the last active hub only when a direct hub link did not request
  // a different workspace. IndexedDB survives tab closure and app restarts.
  useEffect(() => {
    let cancelled = false;
    sessionLoadedScopeRef.current = "";
    setSessionRestoreAttempted(false);

    if (!offlineScope) {
      setSessionRestoreAttempted(true);
      return () => { cancelled = true; };
    }

    readOfflineSession(offlineScope).then((savedSession) => {
      if (cancelled) return;
      const explicitHub = Boolean(initialDashboardKey || new URLSearchParams(currentSearch).get("hub"));
      if (!explicitHub && savedSession?.activeHub && DASHBOARDS.some((dashboard) => dashboard.key === savedSession.activeHub)) {
        setActiveView(savedSession.activeHub);
      }
      if (
        savedSession &&
        savedSession.pathname === window.location.pathname &&
        savedSession.search === window.location.search &&
        Number.isFinite(Number(savedSession.scrollY)) &&
        Number(savedSession.scrollY) > 0
      ) {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            if (!cancelled) window.scrollTo({ top: Number(savedSession.scrollY), behavior: "auto" });
          });
        });
      }
      sessionLoadedScopeRef.current = offlineScope;
      setSessionRestoreAttempted(true);
    }).catch(() => {
      if (!cancelled) {
        sessionLoadedScopeRef.current = offlineScope;
        setSessionRestoreAttempted(true);
      }
    });

    return () => { cancelled = true; };
  }, [offlineScope, initialDashboardKey, currentSearch]);

  // Save the location and active hub during use, on scroll, and when the
  // browser closes. Do not overwrite the saved session before it is restored.
  useEffect(() => {
    if (!offlineScope || !sessionRestoreAttempted || sessionLoadedScopeRef.current !== offlineScope) return undefined;

    let timer = null;
    const persist = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        saveOfflineSession(offlineScope, {
          activeHub: activeView,
          pathname: window.location.pathname,
          search: window.location.search,
          scrollY: window.scrollY,
        });
      }, 300);
    };
    const persistNow = () => {
      if (timer) window.clearTimeout(timer);
      saveOfflineSession(offlineScope, {
        activeHub: activeView,
        pathname: window.location.pathname,
        search: window.location.search,
        scrollY: window.scrollY,
      });
    };

    persistNow();
    window.addEventListener("scroll", persist, { passive: true });
    window.addEventListener("pagehide", persistNow);
    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("scroll", persist);
      window.removeEventListener("pagehide", persistNow);
    };
  }, [offlineScope, activeView, currentSearch, sessionRestoreAttempted]);

  // Keep a small local activity trail so the reopened dashboard can explain
  // which workspace was last being used, even before the network is back.
  useEffect(() => {
    if (!offlineScope || !sessionRestoreAttempted || sessionLoadedScopeRef.current !== offlineScope) return;
    const dashboard = DASHBOARDS.find((item) => item.key === activeView);
    recordOfflineActivity(offlineScope, {
      kind: "hub_opened",
      title: (dashboard?.title || activeView) + " opened",
      detail: "Workspace position and recent local changes are saved on this device.",
    });
  }, [offlineScope, activeView, sessionRestoreAttempted]);

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
    setMobileCategoryOpen(null);
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

  const navigationGroupSpecs = [
    { key: "start", label: "Start", keys: ["home"] },
    { key: "learn", label: "Learn & Faith", keys: ["faith", "education"] },
    { key: "grow", label: "Work & Grow", keys: ["biashara", "shamba"] },
    { key: "community", label: "Community & Services", keys: ["community", "payments"] },
    { key: "account", label: "Account & Settings", keys: ["profile", "settings", "accounts"] },
  ];

  const navigationGroups = navigationGroupSpecs
    .map((group) => ({
      ...group,
      dashboards: group.keys
        .map((key) => visibleDashboards.find((dashboard) => dashboard.key === key))
        .filter(Boolean),
    }))
    .filter((group) => group.dashboards.length > 0);

  const groupedDashboardKeys = new Set(navigationGroupSpecs.flatMap((group) => group.keys));
  const additionalDashboards = visibleDashboards.filter((dashboard) => !groupedDashboardKeys.has(dashboard.key));

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

                  <div className="space-y-3">
                    {navigationGroups.map((group) => (
                      <section key={group.key} className="space-y-1.5">
                        <p className="px-2 text-[9px] font-extrabold uppercase tracking-[0.15em] text-gray-400">
                          {group.label}
                        </p>
                        <div className="space-y-0.5">
                          {group.dashboards.map(({ key, label, icon: Icon, color }) => {
                            const active = activeView === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => handleNavigate(key)}
                                aria-current={active ? "page" : undefined}
                                className={`group relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-semibold transition-colors sm:gap-3 sm:px-3 sm:py-2.5 sm:text-sm ${
                                  active
                                    ? "bg-gray-100 text-gray-950 shadow-sm dark:bg-gray-900 dark:text-white"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-900/70 dark:hover:text-white"
                                }`}
                              >
                                {active ? (
                                  <span className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b ${color || "from-indigo-500 to-purple-500"}`} />
                                ) : null}
                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition sm:h-9 sm:w-9 ${
                                  active
                                    ? `bg-gradient-to-br ${color || "from-indigo-500 to-purple-500"} text-white shadow-sm`
                                    : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:group-hover:bg-gray-800"
                                }`}>
                                  {Icon ? <Icon size={16} /> : <span className="text-xs">•</span>}
                                </span>
                                <span className="min-w-0 flex-1 truncate">{label}</span>
                                {active ? <span className="text-[10px] text-gray-400" aria-hidden="true">●</span> : null}
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                    {additionalDashboards.length ? (
                      <section className="space-y-1.5">
                        <p className="px-2 text-[9px] font-extrabold uppercase tracking-[0.15em] text-gray-400">More</p>
                        <div className="space-y-0.5">
                          {additionalDashboards.map(({ key, label, icon: Icon }) => (
                            <button key={key} type="button" onClick={() => handleNavigate(key)} className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-semibold text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900/70">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-400">{Icon ? <Icon size={16} /> : null}</span>
                              <span className="truncate">{label}</span>
                            </button>
                          ))}
                        </div>
                      </section>
                    ) : null}
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
            id="revelacode-dashboard-content"
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

          {/* Compact Android navigation: related hubs are grouped behind Learn and Grow. */}
          {!sidebarOpen && activeView !== "community" && (
            <>
              {mobileCategoryOpen ? (
                <section
                  aria-label={mobileCategoryOpen === "learn" ? "Learning and faith hubs" : "Business and agriculture hubs"}
                  className="fixed left-2 right-2 z-[85] mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"
                  style={{ bottom: "calc(4.25rem + env(safe-area-inset-bottom))" }}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xs font-black text-slate-900 dark:text-white">
                        {mobileCategoryOpen === "learn" ? "Learn & Faith" : "Work & Grow"}
                      </h2>
                      <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                        {mobileCategoryOpen === "learn" ? "Choose your learning space" : "Choose a livelihood space"}
                      </p>
                    </div>
                    <button type="button" onClick={() => setMobileCategoryOpen(null)} aria-label="Close hub categories" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(mobileCategoryOpen === "learn"
                      ? [
                          { key: "faith", label: "Faith & Scripture", Icon: BookOpen, detail: "Bible study and faith" },
                          { key: "education", label: "Elimu", Icon: GraduationCap, detail: "Schools and learning" },
                        ]
                      : [
                          { key: "biashara", label: "Biashara", Icon: ShoppingCart, detail: "Sales and business" },
                          { key: "shamba", label: "Shamba", Icon: Leaf, detail: "Farms and crops" },
                        ]
                    ).map(({ key, label, Icon, detail }) => {
                      const active = activeView === key;
                      return (
                        <button key={key} type="button" onClick={() => handleNavigate(key)} aria-current={active ? "page" : undefined} className={`flex min-w-0 items-center gap-2.5 rounded-xl border p-2.5 text-left transition ${
                          active
                            ? "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        }`}>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><Icon size={18} /></span>
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-extrabold">{label}</span>
                            <span className="mt-0.5 block truncate text-[10px] text-slate-500 dark:text-slate-400">{detail}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              <nav
                aria-label="Main workspace navigation"
                className="fixed inset-x-0 bottom-0 z-[80] border-t border-slate-200/90 bg-white/95 px-2 pt-1.5 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 lg:hidden"
              >
                <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
                  <button type="button" onClick={() => handleNavigate("home")} aria-current={activeView === "home" ? "page" : undefined} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold transition active:scale-95 ${
                    activeView === "home" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                  }`}>
                    <Home size={18} /><span>Home</span>
                  </button>
                  <button type="button" onClick={() => setMobileCategoryOpen((current) => current === "learn" ? null : "learn")} aria-expanded={mobileCategoryOpen === "learn"} aria-label="Open Learn and Faith hubs" className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold transition active:scale-95 ${
                    ["faith", "education"].includes(activeView) || mobileCategoryOpen === "learn" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                  }`}>
                    <BookOpen size={18} /><span>Learn</span>
                  </button>
                  <button type="button" onClick={() => setMobileCategoryOpen((current) => current === "grow" ? null : "grow")} aria-expanded={mobileCategoryOpen === "grow"} aria-label="Open Work and Grow hubs" className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold transition active:scale-95 ${
                    ["biashara", "shamba"].includes(activeView) || mobileCategoryOpen === "grow" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                  }`}>
                    <Leaf size={18} /><span>Work & Grow</span>
                  </button>
                  <button type="button" onClick={() => handleNavigate("community")} aria-current={activeView === "community" ? "page" : undefined} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold transition active:scale-95 ${
                    activeView === "community" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                  }`}>
                    <Users size={18} /><span>Community</span>
                  </button>
                  <button type="button" onClick={() => { setMobileCategoryOpen(null); setSidebarOpen(true); }} aria-label="Open all navigation options" className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold text-slate-500 transition active:scale-95 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900">
                    <Menu size={18} /><span>More</span>
                  </button>
                </div>
              </nav>
            </>
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
      <OfflineSyncStatus />
    </>
  );
}

