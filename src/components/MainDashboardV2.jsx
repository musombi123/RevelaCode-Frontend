import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Menu, ArrowLeft } from "lucide-react";

import { DASHBOARDS } from "./dashboardConfig.jsx";
import Loading from "./common/Loading.jsx";
import { ErrorBoundary } from "./common/ErrorBoundary.jsx";
import StartModal from "./StartModal.jsx";

import { useTheme } from "@/components/hooks/useTheme.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

export default function MainDashboardV2() {
  const { user, isGuest, loading, login, guestMode } = useAuth();
  const { theme, setTheme } = useTheme();

  const defaultKey =
    DASHBOARDS.find((d) => d.default)?.key || "home";

  const [activeKey, setActiveKey] = useState(defaultKey);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const activeDashboard =
    DASHBOARDS.find((d) => d.key === activeKey) || DASHBOARDS[0];

  /* ================= AUTH GATE ================= */

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

  /* ================= DASHBOARD ================= */

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 relative overflow-hidden">

      {/* ================= HEADER ================= */}
      <header className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900">
        <button onClick={() => setSidebarOpen(true)}>
          <Menu />
        </button>

        <h1 className="font-semibold">Dashboard</h1>

        <div className="text-sm font-medium bg-indigo-600 text-white px-3 py-1 rounded-full">
          {user?.username || "Guest"}
        </div>
      </header>

      {/* ================= SIDEBAR DRAWER ================= */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            className="fixed inset-y-0 left-0 w-64 bg-revelacode-gradient text-white z-50 shadow-2xl"
          >
            <div className="p-4 font-bold text-lg border-b border-white/10">
              RevelaCode
            </div>

            <nav className="p-2 space-y-1">
              {DASHBOARDS.filter(d => !d.hidden).map(
                ({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveKey(key);
                      setSidebarOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full p-3 rounded-lg
                      ${
                        activeKey === key
                          ? "bg-white/20"
                          : "hover:bg-white/10"
                      }`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                )
              )}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ================= MAIN CONTENT ================= */}
      <main className="p-6">
        <Suspense fallback={<Loading />}>
          <ErrorBoundary>
            {activeDashboard.element}
          </ErrorBoundary>
        </Suspense>
      </main>

      {/* ================= FULLSCREEN AI ================= */}
      <AnimatePresence>
        {aiOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-revelacode-gradient z-50 text-white"
          >
            <button
              onClick={() => setAiOpen(false)}
              className="absolute top-4 left-4 flex items-center gap-2"
            >
              <ArrowLeft /> Back
            </button>

            <div className="h-full pt-16">
              <Suspense fallback={<Loading />}>
                {DASHBOARDS.find(d => d.key === "ai")?.element}
              </Suspense>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= AI FLOAT BUTTON ================= */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-green-600 to-lime-500
                   text-white p-4 rounded-full shadow-xl"
        title="RevelaAI"
      >
        <Bot />
      </button>
    </div>
  );
}
