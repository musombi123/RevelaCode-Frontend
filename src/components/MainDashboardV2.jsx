import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Moon, Sun, LogOut } from "lucide-react";

import { DASHBOARDS } from "./dashboardConfig.jsx";
import Loading from "./common/Loading.jsx";
import AvatarMenu from "./accounts/AvatarMenu.jsx";
import Notifications from "./accounts/Notifications.jsx";
import { ErrorBoundary } from "./common/ErrorBoundary.jsx";
import StartModal from "./StartModal.jsx";

import { useTheme } from "@/components/hooks/useTheme.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

export default function MainDashboardV2() {
  const { theme, setTheme } = useTheme();
  const { user, isGuest, loading, login, guestMode, logout } = useAuth();

  const defaultKey =
    DASHBOARDS.find((d) => d.default)?.key || "home";

  const [activeKey, setActiveKey] = useState(defaultKey);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);

  const activeDashboard =
    DASHBOARDS.find((d) => d.key === activeKey) || DASHBOARDS[0];

  /* AI shortcut */
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAiOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* =============================
     AUTH GATE — START MODAL FIRST
  ============================== */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (!user && !isGuest) {
    return (
      <StartModal
        onLoginSuccess={login}
        onGuest={guestMode}
      />
    );
  }

  /* =============================
     DASHBOARD RENDER
  ============================== */

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">

      {/* ========== SIDEBAR ========== */}
      <motion.aside
        animate={{ width: sidebarOpen ? 220 : 72 }}
        className="bg-revelacode-gradient text-gray-100 flex flex-col shadow-2xl"
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {sidebarOpen && (
            <h1 className="font-bold tracking-wide">
              RevelaCode
            </h1>
          )}
          <button onClick={() => setSidebarOpen(v => !v)}>
            {sidebarOpen ? "«" : "»"}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1">
          {DASHBOARDS.filter(d => !d.hidden).map(
            ({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => setActiveKey(key)}
                title={label}
                className={`flex items-center gap-3 w-full p-3 rounded-lg text-sm transition-all
                  ${
                    activeKey === key
                      ? "bg-white/15 border-l-4 border-purple-400 text-white shadow"
                      : "hover:bg-white/10 text-gray-200"
                  }`}
              >
                <Icon size={18} />
                {sidebarOpen && <span>{label}</span>}
              </button>
            )
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-between">
          <button onClick={() =>
            setTheme(theme === "dark" ? "light" : "dark")
          }>
            {theme === "dark" ? <Sun /> : <Moon />}
          </button>

          {sidebarOpen && (
            <button onClick={logout} className="text-red-300">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </motion.aside>

      {/* ========== MAIN ========== */}
      <main className="flex-1 relative overflow-hidden">

        {/* Header */}
        <header className="flex justify-between p-4 border-b border-gray-300 dark:border-gray-800">
          <h2 className="font-semibold">
            {activeDashboard.title}
          </h2>
          <div className="flex gap-3">
            <Notifications iconOnly />
            <AvatarMenu />
          </div>
        </header>

        {/* Body */}
        <section className="p-6 h-[calc(100vh-64px)] overflow-y-auto">
          <Suspense fallback={<Loading />}>
            <ErrorBoundary>
              {activeDashboard.element}
            </ErrorBoundary>
          </Suspense>
        </section>

        {/* ========== FULLSCREEN AI ========== */}
        <AnimatePresence>
          {aiOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ width: sidebarOpen ? 220 : 72 }}
              exit={{ opacity: 0 }}
              className="bg-revelacode-gradient text-gray-100 flex flex-col shadow-2xl"
            >
              <button
                onClick={() => setAiOpen(false)}
                className="absolute top-4 right-4 text-white text-xl"
              >
                ✕
              </button>

              <Suspense fallback={<Loading />}>
                {DASHBOARDS.find(d => d.key === "ai")?.element}
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Button */}
        <button
          onClick={() => setAiOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-green-600 to-lime-500
                     text-white p-4 rounded-full shadow-xl"
          title="RevelaAI (Ctrl + K)"
        >
          <Bot />
        </button>

      </main>
    </div>
  );
}
