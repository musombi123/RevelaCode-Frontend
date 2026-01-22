import React, { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Menu, ArrowLeft, Bell, Sun, Moon } from "lucide-react";

import { DASHBOARDS } from "./dashboardConfig.jsx";
import Loading from "./common/Loading.jsx";
import { ErrorBoundary } from "./common/ErrorBoundary.jsx";
import StartModal from "./StartModal.jsx";

import { useTheme } from "@/components/hooks/useTheme.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

export default function MainDashboardV2() {
  const { user, isGuest, loading, login, guestMode } = useAuth();
  const { theme, toggleTheme } = useTheme(); // Theme toggle

  const defaultKey = DASHBOARDS.find((d) => d.default)?.key || "home";
  const [activeKey, setActiveKey] = useState(defaultKey);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [showStartModal, setShowStartModal] = useState(!user && !isGuest);

  const activeDashboard =
    DASHBOARDS.find((d) => d.key === activeKey) || DASHBOARDS[0];

  const isDark = theme === "dark";
  const textClass = isDark ? "text-white" : "text-black";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${
        isDark ? "bg-gray-950" : "bg-gray-100"
      } ${textClass}`}
    >
      {/* ================= HEADER ================= */}
      <header
        className={`flex items-center justify-between p-4 border-b ${
          isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <button onClick={() => setSidebarOpen(true)}>
          <Menu className={textClass} />
        </button>

        <h1 className={`font-semibold ${textClass}`}>
          {activeDashboard?.title || "Dashboard"}
        </h1>

        <div className="flex items-center gap-3">
          {/* Notification */}
          <button className="relative">
            <Bell className={textClass} size={18} />
            <span className="absolute top-0 right-0 inline-flex w-2 h-2 rounded-full bg-red-500" />
          </button>

          {/* Theme toggle */}
          <button onClick={toggleTheme}>
            {isDark ? <Sun className={textClass} size={18} /> : <Moon className={textClass} size={18} />}
          </button>

          {/* User Avatar */}
          <div
            className={`text-sm font-medium px-3 py-1 rounded-full ${
              isDark ? "bg-indigo-700 text-white" : "bg-indigo-600 text-white"
            }`}
          >
            {user?.username || "Guest"}
          </div>
        </div>
      </header>

      {/* ================= SIDEBAR ================= */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            className={`fixed inset-y-0 left-0 w-64 z-50 shadow-2xl ${
              isDark ? "bg-gray-900 text-white" : "bg-white text-black"
            }`}
          >
            <div className="p-4 font-bold text-lg border-b border-white/10">
              RevelaCode
            </div>
            <nav className="p-2 space-y-1">
              {DASHBOARDS.map(({ key, label, icon: Icon, restricted }) => {
                if (restricted && isGuest) return null;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveKey(key);
                      setSidebarOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full p-3 rounded-lg transition
                      ${
                        activeKey === key
                          ? "bg-indigo-600 text-white"
                          : isDark
                          ? "hover:bg-gray-700"
                          : "hover:bg-gray-200"
                      }`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                );
              })}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ================= MAIN CONTENT ================= */}
      <main className="p-6">
        <Suspense fallback={<Loading />}>
          <ErrorBoundary>
            {DASHBOARDS.map(({ key, element, restricted }) => {
              if (restricted && isGuest) return null;
              return key === activeKey ? <div key={key}>{element}</div> : null;
            })}

            {activeKey === "home" && (
              <div className="space-y-6">
                <h2 className={`text-2xl font-semibold ${textClass}`}>
                  👋 Welcome, {user?.username || "Guest"}!
                </h2>
                <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Explore daily prophecy, AI insights, and RevelaCode features.
                </p>

                <div className="p-4 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800">
                  <h3 className={`font-medium mb-2 ${textClass}`}>🌟 Daily Greeting</h3>
                  <p className={`text-sm ${textClass}`}>
                    {[
                      "Stay blessed today!",
                      "Seek wisdom in every moment.",
                      "Prophecies guide your steps.",
                      "Explore the divine insights.",
                    ][Math.floor(Math.random() * 4)]}
                  </p>
                </div>

                <div className="p-4 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800">
                  <h3 className={`font-medium mb-2 ${textClass}`}>🤖 AI-Assisted Insights</h3>
                  <Suspense fallback={<p className={textClass}>Loading...</p>}>
                    <iframe
                      src={`${import.meta.env.VITE_REVELAAI_URL}/daily`}
                      className="w-full h-48 border rounded"
                      title="RevelaAI Daily Insights"
                    />
                  </Suspense>
                </div>

                <div className="p-4 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800">
                  <h3 className={`font-medium mb-2 ${textClass}`}>🌍 Prophecy Events</h3>
                  <p className={`text-sm ${textClass}`}>
                    View latest events decoded and categorized by RevelaAI.
                  </p>
                  <Suspense fallback={<p className={textClass}>Loading events...</p>}>
                    {DASHBOARDS.find((d) => d.key === "events")?.element}
                  </Suspense>
                </div>
              </div>
            )}
          </ErrorBoundary>
        </Suspense>
      </main>

      {/* ================= AI FLOAT BUTTON ================= */}
      <AnimatePresence>
        {aiOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-r from-green-600 to-lime-500 z-50 text-white"
          >
            <AIAssistantOverlay onClose={() => setAiOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-green-600 to-lime-500 text-white p-4 rounded-full shadow-xl"
        title="RevelaAI"
      >
        <Bot />
      </button>

      {/* ================= START MODAL ================= */}
      {showStartModal && (
        <StartModal
          onLoginSuccess={(user) => {
            login(user);
            setShowStartModal(false);
          }}
          onGuest={() => setShowStartModal(false)}
        />
      )}
    </div>
  );
}

/* -------------------- AI OVERLAY COMPONENT -------------------- */
function AIAssistantOverlay({ onClose }) {
  const [aiKey, setAiKey] = useState(0); // force remount to clear history if needed

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-2 opacity-80 hover:opacity-100"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <h2 className="font-semibold truncate">RevelaAI</h2>
      </header>
      <Suspense fallback={<Loading />}>
        <ErrorBoundary key={aiKey}>
          {DASHBOARDS.find((d) => d.key === "ai")?.element}
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}
