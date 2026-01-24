import React, { useState, useEffect, Suspense } from "react";
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

export default function MainDashboardV2() {
  /* ---------------- Core State ---------------- */
  const defaultDashboard = DASHBOARDS.find((d) => d.default)?.key || "home";
  const [activeView, setActiveView] = useState(defaultDashboard);
  const [sidebarOpen, setSidebarOpen] = useState(false); // start hidden
  const [aiDockOpen, setAIDockOpen] = useState(false);
  const [showStartModal, setShowStartModal] = useState(true);
  const [guestTrials, setGuestTrials] = useState(0);

  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const activeDashboard = DASHBOARDS.find((d) => d.key === activeView) || DASHBOARDS[0];
  const ActiveComponent = activeDashboard.component;

  /* ---------------- Start Modal ---------------- */
  useEffect(() => {
    const completed = localStorage.getItem("start_modal_completed");
    if (completed) setShowStartModal(false);
  }, []);

  const handleStartComplete = () => {
    localStorage.setItem("start_modal_completed", "true");
    setShowStartModal(false);
  };

  /* ---------------- Guest Trial Check ---------------- */
  useEffect(() => {
    if (user?.role === "guest" && guestTrials >= 5) {
      alert("⚠ Your trial has ended. Please create an account to continue accessing features.");
      setShowStartModal(true); // force login/register modal
    }
  }, [guestTrials, user]);

  const handleGuestFeatureUse = () => {
    if (user?.role === "guest") setGuestTrials((t) => t + 1);
  };

  /* ---------------- AI Dock Shortcut ---------------- */
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAIDockOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ================================================= */
  return (
    <div className="relative flex min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors">

      {/* ===== Start Modal (Blocking) ===== */}
      <AnimatePresence>
        {showStartModal && (
          <StartModal
            onComplete={handleStartComplete}
          />
        )}
      </AnimatePresence>

      {/* ===== Sidebar ===== */}
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
                    onClick={() => { setActiveView(key); handleGuestFeatureUse(); }}
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

      {/* ===== Main Area ===== */}
      <main className="flex-1 relative overflow-hidden">

        {/* ===== Header ===== */}
        <header className="flex justify-between items-center p-4 border-b border-gray-300/40 dark:border-gray-700/40">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)}>
                <Menu />
              </button>
            )}
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              {activeView === "home"
                ? `Welcome back, ${user?.username || user?.fullName || "User"} 👋`
                : activeDashboard.title}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Notifications />
            <AvatarMenu user={user} />
          </div>
        </header>

        {/* ===== Content ===== */}
        <section className="p-6 h-[calc(100vh-64px)] overflow-y-auto">
          <Suspense fallback={<Loading />}>
            <ErrorBoundary>
              {ActiveComponent && <ActiveComponent onGuestUse={handleGuestFeatureUse} />}
            </ErrorBoundary>
          </Suspense>
        </section>

        {/* ===== AI Dock ===== */}
        <AnimatePresence>
          {aiDockOpen && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="absolute bottom-4 right-4 bg-gray-900 text-white rounded-2xl shadow-2xl p-4 w-96 h-96 z-50"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">RevelaAI (Beta)</h3>
                <button onClick={() => setAIDockOpen(false)}>✕</button>
              </div>

              <Suspense fallback={<Loading />}>
                {DASHBOARDS.find((d) => d.key === "ai")?.component &&
                  React.createElement(DASHBOARDS.find((d) => d.key === "ai").component)}
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== Floating AI Button ===== */}
        <button
          onClick={() => setAIDockOpen((v) => !v)}
          className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg z-40"
          title="RevelaAI (Ctrl + K)"
        >
          <Bot />
        </button>
      </main>
    </div>
  );
}
