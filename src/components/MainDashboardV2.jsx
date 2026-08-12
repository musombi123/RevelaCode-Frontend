import React, {
  useState,
  useEffect,
  Suspense,
  useCallback
} from "react";

import { useSearchParams } from "react-router-dom";
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
   Guest Disturb Modal (Full-screen blocker every 30 minutes)
========================================================= */
function GuestDisturbModal({ open, onClose, onCreateAccount }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="
            fixed inset-0
            z-[9998]
            bg-gray-100
            dark:bg-gray-950
            flex flex-col
          "
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
   REVELACODE OFFICIAL ANNOUNCEMENT MODAL
========================================================= */

function OfficialAnnouncementModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-2xl"
          >

            {/* HEADER */}
            <div className="sticky top-0 z-20 bg-white/90 dark:bg-gray-950/90 backdrop-blur border-b border-gray-200 dark:border-gray-800 p-6 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    R
                  </div>

                  <div>
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                      REVELACODE OFFICIAL STATEMENT
                    </h2>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Important platform development announcement
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* CONTENT */}
            <div className="p-6 space-y-6 text-gray-700 dark:text-gray-300">

              {/* ALERT */}
              <div className="rounded-2xl border border-yellow-300/40 dark:border-yellow-800/40 bg-yellow-50 dark:bg-yellow-950/20 p-5">
                <h3 className="font-bold text-lg text-yellow-800 dark:text-yellow-300 mb-2">
                  ⚠ Temporary Delay Notice
                </h3>

                <p className="leading-relaxed">
                  Sorry for the inconvenience. We are working effortlessly
                  behind the scenes to ensure everything coming soon will be
                  stable, intelligent, secure, and super perfect for every user.
                </p>
              </div>

              {/* BODY */}
              <div className="space-y-5 leading-relaxed">

                <p>
                  To everyone who has been waiting, supporting, and believing
                  in the vision of RevelaCode — thank you.
                </p>

                <p>
                  The RevelaCode project was originally scheduled for release
                  this May. However, due to unavoidable circumstances involving
                  system development, infrastructure improvements, integration
                  challenges, and long-term platform planning, we have made
                  the difficult decision to postpone the official launch.
                </p>

                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  This decision was not made lightly.
                </p>

                <p>
                  As development continued, it became clear that releasing
                  the platform before it fully met our standards would
                  compromise the quality, stability, and long-term vision
                  of the ecosystem we are building.
                </p>

                <div className="rounded-2xl p-5 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg">
                  <h3 className="text-xl font-bold mb-3">
                    RevelaCode Has Evolved
                  </h3>

                  <p className="text-white/90">
                    RevelaCode is no longer just a simple project.
                    It has evolved into a much larger AI-powered ecosystem
                    integrating theology, education, programming,
                    agriculture, intelligent technologies, and advanced
                    knowledge systems through the MVI-AI Engine and
                    RevelaAI infrastructure.
                  </p>
                </div>

                {/* CURRENT FOCUS */}
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-4">
                    Our Team Is Currently Focused On:
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {[
                      "Strengthening the AI systems",
                      "Improving frontend and backend integration",
                      "Refining documentation and infrastructure",
                      "Enhancing security and scalability",
                      "Preparing a more stable user experience",
                      "Optimizing RevelaAI performance",
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <p className="font-medium">{item}</p>
                        </div>
                      </div>
                    ))}

                  </div>
                </div>

                {/* FINAL MESSAGE */}
                <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-950/20 p-5">
                  <p className="leading-relaxed">
                    We understand the anticipation surrounding this launch,
                    and we sincerely appreciate the patience, encouragement,
                    and continued support from everyone following the journey.
                  </p>

                  <p className="mt-4 font-semibold text-indigo-700 dark:text-indigo-300">
                    This delay is not a step backward.
                  </p>

                  <p className="mt-2">
                    It is a strategic step toward building something stronger,
                    smarter, and more impactful for the future.
                  </p>
                </div>

                {/* CONTACTS */}
                <div className="rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-4">
                    CONTACT INFORMATION
                  </h3>

                  <div className="space-y-3 text-sm">

                    <div>
                      <span className="font-semibold">Official Email:</span>{" "}
                      revelacodepro@gmail.com
                    </div>

                    <div>
                      <span className="font-semibold">Personal Contact:</span>{" "}
                      musombiwilliam769@mail.com
                    </div>

                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      — REVELACODE OFFICIALS
                    </p>

                    <div className="mt-4 space-y-2">
                      <div>
                        <p className="font-semibold">
                          Musombi William
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Lead Architect
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold">
                          Makenji Mellan
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Documentation Leader & Support Team Admin
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* BUTTON */}
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 text-white font-bold shadow-xl transition"
                >
                  Continue to RevelaCode 🚀
                </button>
              </div>

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
          <div className="h-14 px-2 sm:px-4 flex items-center justify-between px-4 border-b border-gray-300/40 dark:border-gray-700/40">
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
          <div className="flex-1 overflow-hidden h-[calc(100vh-56px)]">
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
  const [searchParams] = useSearchParams();

  // AI: fullscreen instead of small dock
  const [aiFullscreenOpen, setAIFullscreenOpen] = useState(false);

  const [showStartModal, setShowStartModal] = useState(false);
  const [guestTrials, setGuestTrials] = useState(0);
  const [dailyGreeting, setDailyGreeting] = useState("");

  // Guest disturb every 30 minutes
  const [guestDisturbOpen, setGuestDisturbOpen] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const isGuest = user?.role === "guest";

  /* ---------------- Start Modal ---------------- */
  useEffect(() => {
    if (!user) setShowStartModal(true);
  }, [user]);

  useEffect(() => {
  const alreadySeen = localStorage.getItem("revelacodeAnnouncementSeen");

  if (!alreadySeen)  {
    setTimeout(() => {
      setShowAnnouncement(true);
    }, 1500);
  }
  }, []);

  const handleCloseAnnouncement = () => {
    localStorage.setItem("revelacodeAnnouncementSeen", "true");
    setShowAnnouncement(false);
  };

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
     - ALSO triggers StartModal to force login
  ========================================================= */
  useEffect(() => {
    if (!isGuest) {
      setGuestDisturbOpen(false);
      return;
    }

    const intervalMs = 30 * 60 * 1000;

    const interval = setInterval(() => {
      setGuestDisturbOpen(true);
      setShowStartModal(true);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isGuest]);

  const handleGuestDisturbClose = () => setGuestDisturbOpen(false);

  const handleCreateAccount = useCallback(() => {
    setGuestDisturbOpen(false);
    setShowStartModal(true);
  }, []);
   
 useEffect(() => {
    const verse = searchParams.get("verse");

    if (!verse) return;

   // Automatically open Bible dashboard
   setActiveView("bible");
 }, [searchParams]);


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
        <div className="rounded-2xl p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-black/10 blur-2xl" />

          <div className="flex flex-col gap-3 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight">
                Welcome, {welcomeName} ✨
              </h2>
              {userBadge}
            </div>

            <p className="text-white/90 text-sm sm:text-base max-w-2xl">
              RevelaCode is your AI-powered Bible decoding workspace — prophecy insights, scripture referencing,
              and smart tools built for speed and clarity.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
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

          <div className="text-xs text-gray-500 dark:text-gray-400">
            {isGuest
              ? "Guest mode: your session may not save permanently."
              : `Logged in as: ${user?.contact || "N/A"}`}
          </div>
        </div>

        {/* USER DETAILS CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 shadow-sm p-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Quick Launch 🚀
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Jump into your tools instantly.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 h-full gap-4 mt-4">
              {DASHBOARDS
                .filter((d) => !d.hidden && d.key !== "home")
                .filter((d) => {
                  // Guest cannot access accounts dashboard
                  if (isGuest && d.key === "accounts") return false;
                  return true;
                })
                .map((d) => (
                  <button
                    key={d.key}
                    className="group h-full text-left p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 hover:shadow-md hover:-translate-y-0.5 transition"
                    onClick={() => setActiveView(d.key)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <d.icon size={18} className="text-indigo-600 dark:text-indigo-300" />
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {d.title || d.label}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Open {d.label} tools and explore features.
                    </p>
                    <div className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-300 opacity-80 group-hover:opacity-100">
                      Launch →
                    </div>
                  </button>
                ))}
            </div>
          </div>

          <div className="rounded-2xl lg:sticky lg:top-24 bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 shadow-sm p-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Your Session 👤
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Account info and access level.
            </p>

            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60">
                <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {user?.fullName || "Guest"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60">
                <p className="text-xs text-gray-500 dark:text-gray-400">Contact</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {user?.contact || "N/A"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60">
                <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {user?.role || "normal"}
                </p>
              </div>

              {isGuest && (
                <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200/60 dark:border-yellow-900/40">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    ⚠ Guest accounts can use almost everything, but{" "}
                    <span className="font-semibold">Accounts Dashboard</span> is locked.
                  </p>
                  <button
                    onClick={() => setShowStartModal(true)}
                    className="mt-3 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
                  >
                    Login to Unlock Accounts 🔓
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* UPCOMING FEATURES */}
        <div className="mt-2 p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 shadow-sm">
          <h4 className="font-bold text-gray-900 dark:text-gray-100">
            Upcoming Features 🔥
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm text-gray-700 dark:text-gray-200">
            <li className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60">
              Enhanced AI decoding for prophecies
            </li>
            <li className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60">
              Weekly Bible study challenges
            </li>
            <li className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60">
              Customizable dashboard widgets
            </li>
            <li className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60">
              Linked account integrations (TikTok, WhatsApp, etc.)
            </li>
          </ul>
        </div>
      </div>
    );
  };

  const activeDashboard =
    DASHBOARDS.find((d) => d.key === activeView) ||
    DASHBOARDS.find((d) => d.key === "home");

  const activeComponent = activeDashboard?.element;

  const aiDashboardElement = DASHBOARDS.find((d) => d.key === "ai")?.element;

/* ================================================= */
return (
  <>
    <OfficialAnnouncementModal
      open={showAnnouncement}
      onClose={handleCloseAnnouncement}
    />

    <div className="relative flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-950 transition-colors">
    
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
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="
            fixed lg:relative
            inset-y-0 left-0
            w-72 max-w-[85vw]
            bg-gray-900
            text-gray-100
            flex flex-col
            z-50
            shadow-2xl
            "
          >
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="p-4 flex justify-between items-center">
              <h1 className="font-bold text-lg">RevelaCode</h1>
              <button onClick={() => setSidebarOpen(false)}><X /></button>
            </div>

            <nav className="px-2 space-y-1">
              {DASHBOARDS
                .filter((d) => !d.hidden)
                .filter((d) => {
                  // Guest cannot access accounts dashboard
                  if (isGuest && d.key === "accounts") return false;
                  return true;
                })
                .map(({ key, label, icon: Icon, color }) => (
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

      <main className="flex-1 flex flex-col relative overflow-hidden">

        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/60 dark:bg-gray-950/60 border-b border-white/20 dark:border-gray-800/60 shadow-sm">
          <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-3 px-3 sm:px-4 lg:px-6 py-3">

            {/* LEFT SIDE */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-xl hover:bg-gray-200/60 dark:hover:bg-gray-800/60 transition"
                >
                  <Menu />
                </button>
              )}

              <div className="flex flex-col leading-tight">
                <h2 className="font-semibold text-sm sm:text-base lg:text-lg truncate text-gray-900 dark:text-gray-100">
                  {activeView === "home"
                    ? `WELCOME, ${user?.fullName?.trim() ? user.fullName : "GUEST"} 👋`
                    : DASHBOARDS.find((d) => d.key === activeView)?.title}
                </h2>

                {activeView === "home" && (
                  <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 truncate">
                    {dailyGreeting}
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT SIDE (THIS IS THE FIX 🔥) */}
            <div className="flex items-center gap-2 flex-shrink-0">

              {/* Notifications */}
              <Notifications />

              {/* Avatar cluster */}
              <div className="flex items-center gap-2 px-2 py-1 rounded-xl bg-white/40 dark:bg-gray-800/40 backdrop-blur border border-white/20 dark:border-gray-700/40">
                <AvatarMenu user={user} />
              </div>

              {/* Guest CTA */}
              {isGuest && (
                <button
                  onClick={() => setShowStartModal(true)}
                  className="hidden sm:inline-flex px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
                >
                  Login 🔐
                </button>
              )}

            </div>

          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <Suspense fallback={<Loading />}>
            <ErrorBoundary>
              {activeComponent &&
                React.cloneElement(activeComponent, {
                  onGuestUse: handleGuestFeatureUse,
                  onNavigate: setActiveView,
                })}
            </ErrorBoundary>
          </Suspense>
        </section>

        <button
          onClick={() => setAIFullscreenOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg z-40"
          title="AI Assistant Dashboard (Ctrl + K)"
        >
          <Bot />
        </button>
      </main>
    </div>
  </>
);}
