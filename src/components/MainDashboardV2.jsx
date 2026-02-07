import React, { useState, useEffect, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Moon, Sun, LogOut, Menu, X, Crown, ShieldCheck, Sparkles } from "lucide-react";

import { DASHBOARDS } from "./dashboardConfig.jsx";
import Loading from "./common/Loading.jsx";
import AvatarMenu from "./accounts/AvatarMenu.jsx";
import Notifications from "./accounts/Notifications.jsx";
import { ErrorBoundary } from "./common/ErrorBoundary.jsx";
import StartModal from "./StartModal.jsx";

import { useTheme } from "@/components/hooks/useTheme.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

/* =========================================================
   Guest Disturb Modal
========================================================= */
function GuestDisturbModal({ open, onClose, onCreateAccount }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden"
          >
            <div className="p-5 border-b border-gray-200/60 dark:border-gray-800 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Guest Mode Checkpoint ⚠️
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  You’ve been running in guest mode for a while. Some things might not save properly.
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200/60 dark:border-yellow-900/40 p-4">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  ⚡ <span className="font-semibold">Quick heads up:</span> Guest sessions are great for testing,
                  but you’ll miss out on saved history, linked accounts, and personalized settings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={onCreateAccount}
                  className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow transition"
                >
                  Create Account 🚀
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold transition"
                >
                  Continue as Guest
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                This reminder pops up every <span className="font-semibold">30 minutes</span> in guest mode.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =========================================================
   Fullscreen AI Assistant Dashboard
========================================================= */
function FullscreenAIAssistant({ open, onClose, aiElement }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9998] bg-gray-100 dark:bg-gray-950"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="h-14 flex items-center justify-between px-4 border-b border-gray-300/40 dark:border-gray-700/40">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-green-600" />
                <h3 className="font-bold text-gray-900 dark:text-gray-100">
                  RevelaAI
                </h3>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200/60 dark:border-green-800/50">
                FULLSCREEN MODE
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition"
              title="Close AI"
            >
              <X />
            </button>
          </div>

          <div className="h-[calc(100vh-56px)] overflow-hidden">
            <div className="h-full p-4 overflow-y-auto">
              <Suspense fallback={<Loading />}>
                <ErrorBoundary>
                  {aiElement ? (
                    React.cloneElement(aiElement)
                  ) : (
                    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 shadow">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        AI Dashboard Not Found
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        Make sure you have a dashboard with key <code>ai</code> inside <code>DASHBOARDS</code>.
                      </p>
                    </div>
                  )}
                </ErrorBoundary>
              </Suspense>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function MainDashboardV2() {
  const defaultDashboard = "home";
  const [activeView, setActiveView] = useState(defaultDashboard);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiFullscreenOpen, setAIFullscreenOpen] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [guestTrials, setGuestTrials] = useState(0);
  const [dailyGreeting, setDailyGreeting] = useState("");
  const [guestDisturbOpen, setGuestDisturbOpen] = useState(false);

  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const isGuest = user?.role === "guest";

  /* ---------------- Start Modal ---------------- */
  useEffect(() => {
    if (!user) setShowStartModal(true);
  }, [user]);

  /* ---------------- Guest Trial ---------------- */
  useEffect(() => {
    if (isGuest && guestTrials >= 5) {
      alert(
        "⚠ Your trial has ended. All features remain accessible, but consider creating an account."
      );
    }
  }, [guestTrials, isGuest]);

  const handleGuestFeatureUse = () => {
    if (isGuest) setGuestTrials((t) => t + 1);
  };

  /* ---------------- Greetings ---------------- */
  const greetings = [
    "Rise and shine! 🌞",
    "Keep pushing forward 💪",
    "Today is a great day to code! 💻",
    "Stay focused, stay awesome! ✨",
    "New challenges, new wins! 🏆",
    "Believe in yourself! 🌟",
    "Make today count! 🔥"
  ];

  useEffect(() => {
    const lastIndex = parseInt(localStorage.getItem("greetingIndex") || "0", 10);
    const todayIndex = (lastIndex + 1) % greetings.length;
    localStorage.setItem("greetingIndex", todayIndex.toString());
    setDailyGreeting(greetings[todayIndex]);
  }, []);

  /* ---------------- Guest Disturb ---------------- */
  useEffect(() => {
    if (!isGuest) {
      setGuestDisturbOpen(false);
      return;
    }

    const interval = setInterval(() => {
      setGuestDisturbOpen(true);
      setShowStartModal(true);
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isGuest]);

  const handleGuestDisturbClose = () => setGuestDisturbOpen(false);
  const handleCreateAccount = useCallback(() => {
    setGuestDisturbOpen(false);
    setShowStartModal(true);
  }, []);

  /* ---------------- AI Shortcut ---------------- */
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAIFullscreenOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setAIFullscreenOpen(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ---------------- Home Preview ---------------- */
  const HomePreview = () => {
    const displayName = user?.fullName?.trim();
    const welcomeName = displayName ? displayName : "GUEST";

    const userBadge = isGuest ? (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border border-yellow-200/60 dark:border-yellow-800/50">
        <Crown size={14} />
        Guest Session
      </span>
    ) : (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200/60 dark:border-green-800/50">
        <ShieldCheck size={14} />
        Verified Account
      </span>
    );

    return (
      <div className="space-y-6">
        {/* HERO */}
        <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg relative overflow-hidden">
          <div className="flex flex-col gap-3 relative z-10">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Welcome, {welcomeName} ✨
              </h2>
              {userBadge}
            </div>

            <div className="flex flex-wrap gap-3 mt-2">
              <button
                onClick={() => setAIFullscreenOpen(true)}
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold transition"
              >
                Open RevelaAI 🤖
              </button>

              {isGuest ? (
                <button
                  onClick={() => setShowStartModal(true)}
                  className="px-4 py-2 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-gray-100 transition shadow"
                >
                  Login / Register 🔐
                </button>
              ) : (
                <button
                  onClick={() => setActiveView("settings")}
                  className="px-4 py-2 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-gray-100 transition shadow"
                >
                  Personalize Settings ⚙️
                </button>
              )}
            </div>
          </div>
        </div>

        {/* GREETING */}
        <div className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 shadow-sm flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-600 dark:text-indigo-300" size={18} />
            <p className="text-gray-700 dark:text-gray-200 font-medium">
              {dailyGreeting}
            </p>
          </div>
        </div>

        {/* QUICK LAUNCH (ALIGNED WITH DASHBOARDS) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 shadow-sm p-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Quick Launch 🚀
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
              {DASHBOARDS
                .filter(d => !d.hidden && d.key !== "home")
                .filter(d => !(isGuest && d.restricted))
                .map((d) => (
                  <button
                    key={d.key}
                    className="group text-left p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 hover:shadow-md hover:-translate-y-0.5 transition"
                    onClick={() => setActiveView(d.key)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <d.icon size={18} className="text-indigo-600 dark:text-indigo-300" />
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {d.title || d.label}
                      </h4>
                    </div>
                    <div className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-300 opacity-80 group-hover:opacity-100">
                      Launch →
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // CLEAN, SAFE RESOLUTION
  const activeComponent =
    activeView === "home"
      ? <HomePreview />
      : DASHBOARDS.find((d) => d.key === activeView)?.element || <HomePreview />;

  const aiDashboardElement =
    DASHBOARDS.find((d) => d.key === "ai" && !(isGuest && d.restricted))?.element;

  return (
    <div className="relative flex min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors">
      <AnimatePresence>
        {showStartModal && <StartModal />}
      </AnimatePresence>

      <GuestDisturbModal
        open={guestDisturbOpen}
        onClose={handleGuestDisturbClose}
        onCreateAccount={handleCreateAccount}
      />

      <FullscreenAIAssistant
        open={aiFullscreenOpen}
        onClose={() => setAIFullscreenOpen(false)}
        aiElement={aiDashboardElement}
      />

      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -220 }}
            animate={{ x: 0 }}
            exit={{ x: -220 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="w-[220px] bg-gray-900 text-gray-100 flex flex-col z-30"
          >
            <div className="p-4 flex justify-between items-center">
              <h1 className="font-bold text-lg">RevelaCode</h1>
              <button onClick={() => setSidebarOpen(false)}><X /></button>
            </div>

            <nav className="px-2 space-y-1">
              {DASHBOARDS
                .filter(d => !d.hidden)
                .filter(d => !(isGuest && d.restricted))
                .map(({ key, label, icon: Icon, color }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveView(key);
                      handleGuestFeatureUse();
                    }}
                    className={`flex items-center gap-3 p-3 w-full rounded-lg text-sm transition
                      ${activeView === key
                        ? `bg-gradient-to-r ${color || "from-indigo-600 to-purple-600"}`
                        : "hover:bg-gray-800"}`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
            </nav>

            <div className="mt-auto p-4 flex justify-between items-center">
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun /> : <Moon />}
              </button>

              <button onClick={logout} className="text-red-400 hover:text-red-500">
                <LogOut size={18} />
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 relative overflow-hidden">
        <header className="flex justify-between items-center p-4 border-b border-gray-300/40 dark:border-gray-700/40">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)}>
                <Menu />
              </button>
            )}
            <div className="flex flex-col">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                {activeView === "home"
                  ? `WELCOME, ${user?.fullName?.trim() ? user.fullName : "GUEST"} 👋`
                  : DASHBOARDS.find((d) => d.key === activeView)?.title || "Dashboard"}
              </h2>
              {activeView === "home" && (
                <p className="text-gray-600 dark:text-gray-400">{dailyGreeting}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Notifications />

            {isGuest ? (
              <button
                onClick={() => setShowStartModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
              >
                Login 🔐
              </button>
            ) : (
              <AvatarMenu user={user} />
            )}
          </div>
        </header>

        <section className="p-6 h-[calc(100vh-64px)] overflow-y-auto">
          <Suspense fallback={<Loading />}>
            <ErrorBoundary>
              {activeComponent &&
                React.cloneElement(activeComponent, {
                  onGuestUse: handleGuestFeatureUse
                })}
            </ErrorBoundary>
          </Suspense>
        </section>

        <button
          onClick={() => setAIFullscreenOpen(true)}
          className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg z-40"
        >
          <Bot />
        </button>
      </main>
    </div>
  );
}
