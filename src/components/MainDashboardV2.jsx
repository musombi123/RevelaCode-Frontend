import React, { useState, useEffect, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Moon, Sun, LogOut, Menu, X } from "lucide-react";

import { DASHBOARDS } from "./dashboardConfig.jsx";
import Loading from "./common/Loading.jsx";
import AvatarMenu from "./accounts/AvatarMenu.jsx";
import Notifications from "./accounts/Notifications.jsx";
import { ErrorBoundary } from "./common/ErrorBoundary.jsx";
import StartModal from "./StartModal.jsx";

import { useTheme } from "@/components/hooks/useTheme.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

/* =========================================================
   Guest Disturb Modal (Full-screen blocker every 30 minutes)
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
   Fullscreen AI Assistant Dashboard (Overlay)
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
          {/* Top Bar */}
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

          {/* Content */}
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
                        Make sure you have a dashboard with key{" "}
                        <code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800">
                          ai
                        </code>{" "}
                        inside{" "}
                        <code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800">
                          DASHBOARDS
                        </code>
                        .
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
  /* ---------------- Core State ---------------- */
  const defaultDashboard = "home"; // always start on home
  const [activeView, setActiveView] = useState(defaultDashboard);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // AI: fullscreen instead of small dock
  const [aiFullscreenOpen, setAIFullscreenOpen] = useState(false);

  const [showStartModal, setShowStartModal] = useState(false);
  const [guestTrials, setGuestTrials] = useState(0);
  const [dailyGreeting, setDailyGreeting] = useState("");

  // Guest disturb every 30 minutes
  const [guestDisturbOpen, setGuestDisturbOpen] = useState(false);

  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const isGuest = user?.role === "guest";

  /* ---------------- Start Modal ---------------- */
  useEffect(() => {
    if (!user) setShowStartModal(true);
  }, [user]);

  const handleStartComplete = () => setShowStartModal(false);

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

  /* ---------------- Daily Greetings (Randomized weekly) ---------------- */
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

  /* =========================================================
     Guest Disturb Logic (every 30 minutes)
     - Only runs if user is guest
     - Pops a blocking fullscreen modal
  ========================================================= */
  useEffect(() => {
    if (!isGuest) {
      setGuestDisturbOpen(false);
      return;
    }

    // Fire after 30 mins, repeat every 30 mins
    const intervalMs = 30 * 60 * 1000;

    // Optional: show first reminder after 30 mins (not instantly)
    const interval = setInterval(() => {
      setGuestDisturbOpen(true);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isGuest]);

  const handleGuestDisturbClose = () => setGuestDisturbOpen(false);

  const handleCreateAccount = useCallback(() => {
    // You can route to your signup page here if you have one
    // For now we just close and encourage.
    setGuestDisturbOpen(false);
    alert("🚀 Redirect to Create Account page (hook your router here).");
  }, []);

  /* ---------------- AI Shortcut (Ctrl + K) ---------------- */
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

  /* ---------------- Home Page Preview Components ---------------- */
  const HomePreview = () => {
    const displayName = user?.fullName?.trim();
    const welcomeName = displayName ? displayName : "GUEST";

    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">
          WELCOME, {welcomeName} ✨
        </h2>

        <p className="text-gray-600 dark:text-gray-300">{dailyGreeting}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {DASHBOARDS.filter((d) => !d.hidden && d.key !== "home").map((d) => (
            <div
              key={d.key}
              className="p-4 rounded-xl shadow hover:shadow-lg bg-white dark:bg-gray-800 cursor-pointer transition"
              onClick={() => setActiveView(d.key)}
            >
              <div className="flex items-center gap-2 mb-2">
                <d.icon size={20} />
                <h3 className="font-semibold">{d.title}</h3>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Explore the {d.label} dashboard
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg shadow-inner">
          <h4 className="font-semibold">Upcoming Features:</h4>
          <ul className="list-disc ml-5 mt-2 text-gray-700 dark:text-gray-200 space-y-1">
            <li>Enhanced AI decoding for prophecies</li>
            <li>Weekly Bible study challenges</li>
            <li>Customizable dashboard widgets</li>
            <li>Linked account integrations (TikTok, WhatsApp, etc.)</li>
          </ul>
        </div>
      </div>
    );
  };

  const activeComponent =
    activeView === "home"
      ? <HomePreview />
      : DASHBOARDS.find((d) => d.key === activeView)?.element || <HomePreview />;

  const aiDashboardElement = DASHBOARDS.find((d) => d.key === "ai")?.element;

  /* ================================================= */
  return (
    <div className="relative flex min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors">

      <AnimatePresence>
        {showStartModal && <StartModal onComplete={handleStartComplete} />}
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
              {DASHBOARDS.filter((d) => !d.hidden).map(
                ({ key, label, icon: Icon, color }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveView(key);
                      handleGuestFeatureUse();
                    }}
                    className={`flex items-center gap-3 p-3 w-full rounded-lg text-sm transition
                      ${activeView === key ? `bg-gradient-to-r ${color}` : "hover:bg-gray-800"}`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                )
              )}
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
                  : DASHBOARDS.find((d) => d.key === activeView)?.title}
              </h2>
              {activeView === "home" && (
                <p className="text-gray-600 dark:text-gray-400">{dailyGreeting}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Notifications />
            <AvatarMenu user={user} />
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
          title="AI Assistant Dashboard (Ctrl + K)"
        >
          <Bot />
        </button>
      </main>
    </div>
  );
}
