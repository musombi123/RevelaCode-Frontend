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
  Crown,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

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

function GuestDisturbModal({
  open,
  onClose,
  onCreateAccount,
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
            items-center
            justify-center
            bg-gray-100
            p-4
            dark:bg-gray-950
          "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{
              scale: 0.94,
              y: 18,
              opacity: 0,
            }}
            animate={{
              scale: 1,
              y: 0,
              opacity: 1,
            }}
            exit={{
              scale: 0.96,
              y: 10,
              opacity: 0,
            }}
            transition={{
              type: "spring",
              stiffness: 240,
              damping: 22,
            }}
            className="
              w-full
              max-w-lg
              overflow-hidden
              rounded-2xl
              border
              border-gray-200
              bg-white
              shadow-2xl
              dark:border-gray-800
              dark:bg-gray-900
            "
          >
            <div
              className="
                flex
                items-start
                justify-between
                gap-3
                border-b
                border-gray-200
                p-5
                dark:border-gray-800
              "
            >
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Guest Mode Checkpoint ⚠️
                </h3>

                <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  You have been running in guest mode for a while.
                  Some activity may not be saved permanently.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="
                  shrink-0
                  rounded-xl
                  p-2
                  text-gray-500
                  transition
                  hover:bg-gray-100
                  dark:text-gray-400
                  dark:hover:bg-gray-800
                "
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div
                className="
                  rounded-xl
                  border
                  border-yellow-200
                  bg-yellow-50
                  p-4
                  dark:border-yellow-900/50
                  dark:bg-yellow-950/40
                "
              >
                <p className="text-sm leading-6 text-gray-800 dark:text-gray-200">
                  ⚡{" "}
                  <span className="font-semibold">
                    Quick heads up:
                  </span>{" "}
                  Guest sessions are useful for exploring,
                  but accounts unlock saved history,
                  linked services, and personalization.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={onCreateAccount}
                  className="
                    w-full
                    rounded-xl
                    bg-green-600
                    py-3
                    font-semibold
                    text-white
                    shadow
                    transition
                    hover:bg-green-700
                    active:scale-[0.99]
                  "
                >
                  Create Account 🚀
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="
                    w-full
                    rounded-xl
                    bg-gray-100
                    py-3
                    font-semibold
                    text-gray-900
                    transition
                    hover:bg-gray-200
                    dark:bg-gray-800
                    dark:text-gray-100
                    dark:hover:bg-gray-700
                  "
                >
                  Continue as Guest
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                This reminder appears every{" "}
                <span className="font-semibold">30 minutes</span>{" "}
                while in guest mode.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =========================================================
   Official Announcement Modal
========================================================= */

function OfficialAnnouncementModal({
  open,
  onClose,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="
            fixed
            inset-0
            z-[10000]
            flex
            items-center
            justify-center
            bg-black/80
            p-3
            sm:p-4
          "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{
              scale: 0.94,
              y: 24,
              opacity: 0,
            }}
            animate={{
              scale: 1,
              y: 0,
              opacity: 1,
            }}
            exit={{
              scale: 0.97,
              y: 10,
              opacity: 0,
            }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 22,
            }}
            className="
              flex
              max-h-[94vh]
              w-full
              max-w-4xl
              flex-col
              overflow-hidden
              rounded-3xl
              border
              border-gray-200
              bg-white
              shadow-2xl
              dark:border-gray-800
              dark:bg-gray-950
            "
          >
            {/* HEADER */}

            <div
              className="
                sticky
                top-0
                z-20
                shrink-0
                border-b
                border-gray-200
                bg-white
                p-4
                dark:border-gray-800
                dark:bg-gray-950
                sm:p-6
              "
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-2xl
                      bg-gradient-to-br
                      from-indigo-600
                      via-purple-600
                      to-pink-600
                      text-xl
                      font-bold
                      text-white
                      shadow-lg
                      sm:h-12
                      sm:w-12
                    "
                  >
                    R
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-extrabold text-gray-900 dark:text-gray-100 sm:text-2xl">
                      REVELACODE OFFICIAL STATEMENT
                    </h2>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                      Important platform development announcement
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="
                    shrink-0
                    rounded-xl
                    p-2
                    text-gray-500
                    transition
                    hover:bg-gray-100
                    hover:text-gray-900
                    dark:text-gray-400
                    dark:hover:bg-gray-800
                    dark:hover:text-white
                  "
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* CONTENT */}

            <div className="overflow-y-auto overscroll-contain p-4 text-gray-700 dark:text-gray-300 sm:p-6">
              <div className="space-y-6">
                <div
                  className="
                    rounded-2xl
                    border
                    border-yellow-300/40
                    bg-yellow-50
                    p-5
                    dark:border-yellow-800/40
                    dark:bg-yellow-950/20
                  "
                >
                  <h3 className="mb-2 text-lg font-bold text-yellow-800 dark:text-yellow-300">
                    ⚠ Temporary Delay Notice
                  </h3>

                  <p className="leading-relaxed">
                    Sorry for the inconvenience. We are
                    working behind the scenes to ensure
                    everything coming soon is stable,
                    intelligent, secure, and ready for
                    every user.
                  </p>
                </div>

                <div className="space-y-5 leading-relaxed">
                  <p>
                    To everyone who has been waiting,
                    supporting, and believing in the vision
                    of RevelaCode — thank you.
                  </p>

                  <p>
                    The RevelaCode project was originally
                    scheduled for release this May.
                    However, due to unavoidable circumstances
                    involving system development,
                    infrastructure improvements,
                    integration challenges, and long-term
                    platform planning, we made the
                    difficult decision to postpone the
                    official launch.
                  </p>

                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    This decision was not made lightly.
                  </p>

                  <p>
                    As development continued, it became
                    clear that releasing the platform before
                    it met our standards would compromise
                    quality, stability, and the long-term
                    vision of the ecosystem we are building.
                  </p>

                  <div
                    className="
                      rounded-2xl
                      bg-gradient-to-br
                      from-indigo-600
                      via-purple-600
                      to-pink-600
                      p-5
                      text-white
                      shadow-lg
                    "
                  >
                    <h3 className="mb-3 text-xl font-bold">
                      RevelaCode Has Evolved
                    </h3>

                    <p className="text-white/90">
                      RevelaCode is no longer just a simple
                      project. It has evolved into a broader
                      AI-powered ecosystem integrating
                      theology, education, programming,
                      agriculture, intelligent technologies,
                      and advanced knowledge systems through
                      the MVI-AI Engine and RevelaAI
                      infrastructure.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">
                      Our Team Is Currently Focused On:
                    </h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {[
                        "Strengthening the AI systems",
                        "Improving frontend and backend integration",
                        "Refining documentation and infrastructure",
                        "Enhancing security and scalability",
                        "Preparing a more stable user experience",
                        "Optimizing RevelaAI performance",
                      ].map((item) => (
                        <div
                          key={item}
                          className="
                            rounded-2xl
                            border
                            border-gray-200
                            bg-gray-50
                            p-4
                            dark:border-gray-800
                            dark:bg-gray-900
                          "
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full bg-green-500" />

                            <p className="font-medium">
                              {item}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className="
                      rounded-2xl
                      border
                      border-indigo-200
                      bg-indigo-50
                      p-5
                      dark:border-indigo-900/40
                      dark:bg-indigo-950/20
                    "
                  >
                    <p className="leading-relaxed">
                      We understand the anticipation
                      surrounding this launch and sincerely
                      appreciate the patience, encouragement,
                      and continued support from everyone
                      following the journey.
                    </p>

                    <p className="mt-4 font-semibold text-indigo-700 dark:text-indigo-300">
                      This delay is not a step backward.
                    </p>

                    <p className="mt-2">
                      It is a strategic step toward building
                      something stronger, smarter, and more
                      impactful for the future.
                    </p>
                  </div>

                  <div
                    className="
                      rounded-2xl
                      border
                      border-gray-200
                      bg-gray-50
                      p-5
                      dark:border-gray-800
                      dark:bg-gray-900
                    "
                  >
                    <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">
                      CONTACT INFORMATION
                    </h3>

                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-semibold">
                          Official Email:
                        </span>{" "}
                        revelacodepro@gmail.com
                      </div>

                      <div>
                        <span className="font-semibold">
                          Personal Contact:
                        </span>{" "}
                        musombiwilliam769@mail.com
                      </div>
                    </div>

                    <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-800">
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        — REVELACODE OFFICIALS
                      </p>

                      <div className="mt-4 space-y-3">
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

                <button
                  type="button"
                  onClick={onClose}
                  className="
                    w-full
                    rounded-2xl
                    bg-gradient-to-r
                    from-indigo-600
                    via-purple-600
                    to-pink-600
                    py-4
                    font-bold
                    text-white
                    shadow-xl
                    transition
                    hover:opacity-90
                    active:scale-[0.99]
                  "
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
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <Bot
                  size={18}
                  className="text-green-600"
                />

                <h3 className="font-bold text-gray-900 dark:text-gray-100">
                  RevelaAI
                </h3>
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
            >
              <X size={20} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                {aiElement ? (
                  React.cloneElement(aiElement)
                ) : (
                  <div className="m-4 rounded-2xl border border-gray-200 bg-white p-6 shadow dark:border-gray-800 dark:bg-gray-900">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      AI Dashboard Not Found
                    </h4>

                    <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                      Make sure you have a dashboard
                      with key{" "}
                      <code className="rounded bg-gray-200 px-1 py-0.5 dark:bg-gray-800">
                        ai
                      </code>{" "}
                      inside{" "}
                      <code className="rounded bg-gray-200 px-1 py-0.5 dark:bg-gray-800">
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
   Main Dashboard
========================================================= */

export default function MainDashboardV2() {
  const defaultDashboard = "home";

  const [activeView, setActiveView] =
    useState(defaultDashboard);

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [searchParams] =
    useSearchParams();

  const [aiFullscreenOpen, setAIFullscreenOpen] =
    useState(false);

  const [showStartModal, setShowStartModal] =
    useState(false);

  const [guestTrials, setGuestTrials] =
    useState(0);

  const [dailyGreeting, setDailyGreeting] =
    useState("");

  const [guestDisturbOpen, setGuestDisturbOpen] =
    useState(false);

  const [showAnnouncement, setShowAnnouncement] =
    useState(false);

  const { theme, setTheme } =
    useTheme();

  const { user, logout } =
    useAuth();

  const isGuest =
    user?.role === "guest";

  /* =========================================================
     Sidebar scroll lock
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
     Generic guest feature counter
  ========================================================= */

  const handleGuestFeatureUse = useCallback(() => {
    if (!isGuest) {
      return;
    }

    setGuestTrials(
      (current) => current + 1
    );
  }, [isGuest]);

  /* =========================================================
     Navigation
  ========================================================= */

  const handleNavigate = useCallback(
    (view) => {
      setActiveView(view);
      setSidebarOpen(false);
      handleGuestFeatureUse();
    },
    [handleGuestFeatureUse]
  );

  /* =========================================================
     Start modal
  ========================================================= */

  useEffect(() => {
    if (!user) {
      setShowStartModal(true);
    }
  }, [user]);

  /* =========================================================
     Announcement
  ========================================================= */

  useEffect(() => {
    const alreadySeen =
      localStorage.getItem(
        "revelacodeAnnouncementSeen"
      );

    if (alreadySeen) {
      return;
    }

    const timeout = setTimeout(() => {
      setShowAnnouncement(true);
    }, 1500);

    return () => clearTimeout(timeout);
  }, []);

  const handleCloseAnnouncement =
    useCallback(() => {
      localStorage.setItem(
        "revelacodeAnnouncementSeen",
        "true"
      );

      setShowAnnouncement(false);
    }, []);

  const handleStartComplete =
    useCallback(() => {
      setShowStartModal(false);
    }, []);

  /* =========================================================
     Guest trial warning
  ========================================================= */

  useEffect(() => {
    if (
      isGuest &&
      guestTrials === 5
    ) {
      alert(
        "⚠ Your trial has reached 5 feature uses. All features remain accessible, but consider creating an account."
      );
    }
  }, [guestTrials, isGuest]);

  /* =========================================================
     Daily greeting
  ========================================================= */

  const greetings = [
    "Rise and shine! 🌞",
    "Keep pushing forward 💪",
    "Today is a great day to code! 💻",
    "Stay focused, stay awesome! ✨",
    "New challenges, new wins! 🏆",
    "Believe in yourself! 🌟",
    "Make today count! 🔥",
  ];

  useEffect(() => {
    const lastIndex = parseInt(
      localStorage.getItem(
        "greetingIndex"
      ) || "0",
      10
    );

    const todayIndex =
      (lastIndex + 1) %
      greetings.length;

    localStorage.setItem(
      "greetingIndex",
      String(todayIndex)
    );

    setDailyGreeting(
      greetings[todayIndex]
    );
  }, []);

  /* =========================================================
     Guest disturbance
  ========================================================= */

  useEffect(() => {
    if (!isGuest) {
      setGuestDisturbOpen(false);
      return;
    }

    const intervalMs =
      30 * 60 * 1000;

    const interval =
      setInterval(() => {
        setGuestDisturbOpen(true);
        setShowStartModal(true);
      }, intervalMs);

    return () =>
      clearInterval(interval);
  }, [isGuest]);

  const handleGuestDisturbClose =
    useCallback(() => {
      setGuestDisturbOpen(false);
    }, []);

  const handleCreateAccount =
    useCallback(() => {
      setGuestDisturbOpen(false);
      setShowStartModal(true);
    }, []);

  /* =========================================================
     Verse URL handling
  ========================================================= */

  useEffect(() => {
    const verse =
      searchParams.get("verse");

    if (!verse) {
      return;
    }

    setActiveView("bible");
  }, [searchParams]);

  /* =========================================================
     Keyboard shortcuts
  ========================================================= */

  useEffect(() => {
    const handler = (event) => {
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
     Home Preview
  ========================================================= */

  const HomePreview = () => {
    const displayName =
      user?.fullName?.trim();

    const welcomeName =
      displayName || "GUEST";

    const userBadge = isGuest ? (
      <span
        className="
          inline-flex
          items-center
          gap-2
          rounded-full
          border
          border-yellow-200/60
          bg-yellow-100
          px-3
          py-1
          text-xs
          font-semibold
          text-yellow-700
          dark:border-yellow-800/50
          dark:bg-yellow-900/40
          dark:text-yellow-300
        "
      >
        <Crown size={14} />
        Guest Session
      </span>
    ) : (
      <span
        className="
          inline-flex
          items-center
          gap-2
          rounded-full
          border
          border-green-200/60
          bg-green-100
          px-3
          py-1
          text-xs
          font-semibold
          text-green-700
          dark:border-green-800/50
          dark:bg-green-900/30
          dark:text-green-300
        "
      >
        <ShieldCheck size={14} />
        Verified Account
      </span>
    );

    const quickLaunchDashboards =
      DASHBOARDS.filter(
        (d) =>
          !d.hidden &&
          d.key !== "home"
      ).filter((d) => {
        if (
          isGuest &&
          d.key === "accounts"
        ) {
          return false;
        }

        return true;
      });

    return (
      <div className="space-y-6">

        {/* =====================================================
            HERO
        ===================================================== */}

        <div
          className="
            relative
            overflow-hidden
            rounded-2xl
            bg-gradient-to-br
            from-indigo-600
            via-purple-600
            to-pink-600
            p-4
            text-white
            shadow-lg
            sm:p-6
            lg:p-8
          "
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

          <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-black/10 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-5xl">
                Welcome, {welcomeName} ✨
              </h2>

              {userBadge}
            </div>

            <p className="max-w-2xl text-sm leading-7 text-white/90 sm:text-base">
              RevelaCode is your AI-powered
              Bible decoding workspace —
              prophecy insights, scripture
              referencing, and intelligent
              tools built for speed and clarity.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  setAIFullscreenOpen(
                    true
                  )
                }
                className="
                  rounded-xl
                  border
                  border-white/20
                  bg-white/15
                  px-4
                  py-2.5
                  font-semibold
                  text-white
                  transition
                  hover:bg-white/25
                  active:scale-[0.99]
                "
              >
                Open RevelaAI 🤖
              </button>

              {isGuest ? (
                <button
                  type="button"
                  onClick={() =>
                    setShowStartModal(true)
                  }
                  className="
                    rounded-xl
                    bg-white
                    px-4
                    py-2.5
                    font-semibold
                    text-indigo-700
                    shadow
                    transition
                    hover:bg-gray-100
                    active:scale-[0.99]
                  "
                >
                  Login / Register 🔐
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    handleNavigate(
                      "settings"
                    )
                  }
                  className="
                    rounded-xl
                    bg-white
                    px-4
                    py-2.5
                    font-semibold
                    text-indigo-700
                    shadow
                    transition
                    hover:bg-gray-100
                    active:scale-[0.99]
                  "
                >
                  Personalize Settings ⚙️
                </button>
              )}
            </div>
          </div>
        </div>

        {/* =====================================================
            GREETING
        ===================================================== */}

        <div
          className="
            flex
            flex-wrap
            items-center
            justify-between
            gap-3
            rounded-2xl
            border
            border-gray-200/60
            bg-white
            p-4
            shadow-sm
            dark:border-gray-800
            dark:bg-gray-900
          "
        >
          <div className="flex items-center gap-2">
            <Sparkles
              className="text-indigo-600 dark:text-indigo-300"
              size={18}
            />

            <p className="font-medium text-gray-700 dark:text-gray-200">
              {dailyGreeting}
            </p>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            {isGuest
              ? "Guest mode: your session may not save permanently."
              : `Logged in as: ${
                  user?.contact || "N/A"
                }`}
          </div>
        </div>

        {/* =====================================================
            MAIN WORKSPACE
        ===================================================== */}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* QUICK LAUNCH */}

          <div
            className="
              rounded-2xl
              border
              border-gray-200/70
              bg-white
              p-4
              shadow-sm
              dark:border-gray-800
              dark:bg-gray-900
              sm:p-5
              lg:col-span-2
            "
          >
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Quick Launch
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Access your RevelaCode workspace instantly.
                </p>
              </div>

              <span
                className="
                  hidden
                  rounded-full
                  border
                  border-gray-200
                  bg-gray-50
                  px-3
                  py-1
                  text-[11px]
                  font-semibold
                  text-gray-500
                  dark:border-gray-700
                  dark:bg-gray-800
                  dark:text-gray-400
                  sm:inline-flex
                "
              >
                {quickLaunchDashboards.length} tools
              </span>
            </div>

            <div
              className="
                mt-5
                grid
                grid-cols-1
                gap-3
                sm:grid-cols-2
                xl:grid-cols-3
              "
            >
              {quickLaunchDashboards.map(
                (d) => {
                  const Icon = d.icon;

                  const isActive =
                    activeView ===
                    d.key;

                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() =>
                        handleNavigate(
                          d.key
                        )
                      }
                      className="
                        group
                        relative
                        flex
                        min-h-[152px]
                        flex-col
                        justify-between
                        overflow-hidden
                        rounded-2xl
                        border
                        border-gray-200
                        bg-gray-50
                        p-4
                        text-left
                        transition-all
                        duration-200
                        hover:-translate-y-1
                        hover:border-gray-300
                        hover:bg-white
                        hover:shadow-lg
                        active:scale-[0.99]
                        dark:border-gray-800
                        dark:bg-gray-800/50
                        dark:hover:border-gray-700
                        dark:hover:bg-gray-800
                      "
                    >
                      {/* Glow */}

                      <div
                        className="
                          pointer-events-none
                          absolute
                          -right-8
                          -top-8
                          h-24
                          w-24
                          rounded-full
                          bg-indigo-500/5
                          blur-2xl
                          transition
                          group-hover:bg-indigo-500/10
                        "
                      />

                      {/* TOP */}

                      <div className="relative z-10 flex items-start justify-between gap-3">
                        <div
                          className={`
                            flex
                            h-11
                            w-11
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            transition-all
                            duration-200
                            ${
                              isActive
                                ? `bg-gradient-to-br ${
                                    d.color ||
                                    "from-indigo-500 to-purple-500"
                                  } text-white shadow-lg`
                                : "bg-white text-gray-600 shadow-sm dark:bg-gray-900 dark:text-gray-300"
                            }
                          `}
                        >
                          <Icon size={20} />
                        </div>

                        <span
                          className="
                            rounded-full
                            bg-white
                            px-2
                            py-1
                            text-[10px]
                            font-bold
                            text-gray-400
                            opacity-0
                            shadow-sm
                            transition
                            group-hover:opacity-100
                            dark:bg-gray-900
                          "
                        >
                          Open
                        </span>
                      </div>

                      {/* BOTTOM */}

                      <div className="relative z-10 mt-5">
                        <h4
                          className="
                            truncate
                            text-sm
                            font-bold
                            text-gray-900
                            dark:text-gray-100
                          "
                        >
                          {d.title ||
                            d.label}
                        </h4>

                        <p
                          className="
                            mt-1
                            line-clamp-2
                            text-xs
                            leading-5
                            text-gray-500
                            dark:text-gray-400
                          "
                        >
                          Explore{" "}
                          {d.label?.toLowerCase() ||
                            "this workspace"}{" "}
                          and access its tools.
                        </p>

                        <div
                          className="
                            mt-3
                            flex
                            items-center
                            gap-1
                            text-xs
                            font-bold
                            text-indigo-600
                            transition
                            group-hover:gap-2
                            dark:text-indigo-400
                          "
                        >
                          Launch

                          <span className="transition-transform group-hover:translate-x-0.5">
                            →
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* SESSION CARD */}

          <div
            className="
              rounded-2xl
              border
              border-gray-200/60
              bg-white
              p-5
              shadow-sm
              dark:border-gray-800
              dark:bg-gray-900
              lg:sticky
              lg:top-24
            "
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Your Session 👤
            </h3>

            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Account information and access level.
            </p>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-gray-200/60 bg-gray-50 p-3 dark:border-gray-700/60 dark:bg-gray-800/60">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Name
                </p>

                <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
                  {user?.fullName ||
                    "Guest"}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200/60 bg-gray-50 p-3 dark:border-gray-700/60 dark:bg-gray-800/60">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Contact
                </p>

                <p className="mt-1 break-all font-semibold text-gray-900 dark:text-gray-100">
                  {user?.contact ||
                    "N/A"}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200/60 bg-gray-50 p-3 dark:border-gray-700/60 dark:bg-gray-800/60">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Role
                </p>

                <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
                  {user?.role ||
                    "normal"}
                </p>
              </div>

              {isGuest && (
                <div
                  className="
                    rounded-xl
                    border
                    border-yellow-200/60
                    bg-yellow-50
                    p-3
                    dark:border-yellow-900/40
                    dark:bg-yellow-950/40
                  "
                >
                  <p className="text-sm leading-6 text-gray-800 dark:text-gray-200">
                    ⚠ Guest accounts can use
                    almost everything, but{" "}
                    <span className="font-semibold">
                      Accounts Dashboard
                    </span>{" "}
                    is locked.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setShowStartModal(
                        true
                      )
                    }
                    className="
                      mt-3
                      w-full
                      rounded-xl
                      bg-indigo-600
                      py-2.5
                      font-semibold
                      text-white
                      transition
                      hover:bg-indigo-700
                      active:scale-[0.99]
                    "
                  >
                    Login to Unlock Accounts 🔓
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =====================================================
            UPCOMING FEATURES
        ===================================================== */}

        <div
          className="
            rounded-2xl
            border
            border-gray-200/60
            bg-white
            p-4
            shadow-sm
            dark:border-gray-800
            dark:bg-gray-900
            sm:p-5
          "
        >
          <h4 className="font-bold text-gray-900 dark:text-gray-100">
            Upcoming Features 🔥
          </h4>

          <ul className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-700 dark:text-gray-200 sm:grid-cols-2">
            <li className="rounded-xl border border-gray-200/60 bg-gray-50 p-3 dark:border-gray-700/60 dark:bg-gray-800/60">
              Enhanced AI decoding for prophecies
            </li>

            <li className="rounded-xl border border-gray-200/60 bg-gray-50 p-3 dark:border-gray-700/60 dark:bg-gray-800/60">
              Weekly Bible study challenges
            </li>

            <li className="rounded-xl border border-gray-200/60 bg-gray-50 p-3 dark:border-gray-700/60 dark:bg-gray-800/60">
              Customizable dashboard widgets
            </li>

            <li className="rounded-xl border border-gray-200/60 bg-gray-50 p-3 dark:border-gray-700/60 dark:bg-gray-800/60">
              Linked account integrations
            </li>
          </ul>
        </div>
      </div>
    );
  };

  /* =========================================================
     Active dashboard
  ========================================================= */

  const activeDashboard =
    DASHBOARDS.find(
      (d) =>
        d.key === activeView
    ) ||
    DASHBOARDS.find(
      (d) =>
        d.key === "home"
    );

  const activeComponent =
    activeDashboard?.element;

  const aiDashboardElement =
    DASHBOARDS.find(
      (d) =>
        d.key === "ai"
    )?.element;

  /* =========================================================
     Render
  ========================================================= */

  return (
    <>
      <OfficialAnnouncementModal
        open={showAnnouncement}
        onClose={
          handleCloseAnnouncement
        }
      />

      <AnimatePresence>
        {showStartModal && (
          <StartModal
            onComplete={
              handleStartComplete
            }
          />
        )}
      </AnimatePresence>

      <GuestDisturbModal
        open={guestDisturbOpen}
        onClose={
          handleGuestDisturbClose
        }
        onCreateAccount={
          handleCreateAccount
        }
      />

      <FullscreenAIAssistant
        open={aiFullscreenOpen}
        onClose={() =>
          setAIFullscreenOpen(
            false
          )
        }
        aiElement={
          aiDashboardElement
        }
      />

      <div
        className="
          relative
          flex
          h-screen
          min-w-0
          overflow-hidden
          bg-gray-100
          transition-colors
          dark:bg-gray-950
        "
      >
        {/* =====================================================
            MOBILE SIDEBAR + OVERLAY
        ===================================================== */}

        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Overlay — intentionally NO backdrop-blur */}

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

              {/* Drawer */}

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
                {/* Drawer header */}

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
                  <div className="flex min-w-0 items-center gap-3">
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
                      <p className="truncate text-sm font-bold">
                        RevelaCode
                      </p>

                      <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                        Intelligent Scripture Workspace
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSidebarOpen(
                        false
                      )
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

                {/* Navigation */}

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
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                      Workspace
                    </p>
                  </div>

                  <div className="space-y-1">
                    {DASHBOARDS
                      .filter(
                        (d) =>
                          !d.hidden
                      )
                      .filter((d) => {
                        if (
                          isGuest &&
                          d.key ===
                            "accounts"
                        ) {
                          return false;
                        }

                        return true;
                      })
                      .map(
                        ({
                          key,
                          label,
                          icon: Icon,
                          color,
                        }) => {
                          const active =
                            activeView ===
                            key;

                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() =>
                                handleNavigate(
                                  key
                                )
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
                                <Icon size={17} />
                              </span>

                              <span className="min-w-0 flex-1 truncate">
                                {label}
                              </span>

                              {active && (
                                <span className="text-xs text-gray-400">
                                  ●
                                </span>
                              )}
                            </button>
                          );
                        }
                      )}
                  </div>
                </nav>

                {/* Footer */}

                <div
                  className="
                    shrink-0
                    border-t
                    border-gray-200
                    p-3
                    dark:border-gray-800
                  "
                >
                  <div className="mb-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-900">
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
                          user?.contact ||
                          "G"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {user?.fullName ||
                            "Guest"}
                        </p>

                        <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                          {isGuest
                            ? "Guest Session"
                            : user?.role ||
                              "Account"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setTheme(
                          theme ===
                            "dark"
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
                    >
                      {theme ===
                      "dark" ? (
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

        {/* =====================================================
            MAIN CONTENT
        ===================================================== */}

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
          {/* Header */}

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

              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSidebarOpen((open) => !open)}
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
                    aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
                    title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                  {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-gray-900 dark:text-white sm:text-base lg:text-lg">
                    {activeView ===
                    "home"
                      ? `WELCOME, ${
                          user?.fullName?.trim()
                            ? user.fullName
                            : "GUEST"
                        } 👋`
                      : DASHBOARDS.find(
                          (d) =>
                            d.key ===
                            activeView
                        )?.title ||
                        "RevelaCode"}
                  </h2>

                  {activeView ===
                    "home" && (
                    <p className="hidden truncate text-xs text-gray-500 dark:text-gray-400 sm:block">
                      {dailyGreeting}
                    </p>
                  )}
                </div>
              </div>

              {/* RIGHT */}

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <Notifications />

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

                {isGuest && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowStartModal(
                        true
                      )
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

          {/* Dashboard content */}

          <section
            className="
              min-w-0
              flex-1
              overflow-y-auto
              overscroll-contain
              bg-gray-100
              px-3
              py-3
              dark:bg-gray-950
              sm:px-4
              sm:py-4
              lg:px-6
              lg:py-6
            "
          >
            <Suspense fallback={<Loading />}>
              <ErrorBoundary>
                {activeView === "home" ? (
                  <HomePreview />
                ) : activeComponent ? (
                  React.cloneElement(
                    activeComponent,
                    {
                      onGuestUse:
                        handleGuestFeatureUse,
                      onNavigate:
                        handleNavigate,
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
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Dashboard unavailable
                    </h3>

                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      The selected dashboard
                      could not be loaded.
                    </p>
                  </div>
                )}
              </ErrorBoundary>
            </Suspense>
          </section>

          {/* AI FAB */}

          <button
            type="button"
            onClick={() =>
              setAIFullscreenOpen(
                true
              )
            }
            className="
              fixed
              bottom-4
              right-4
              z-40
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-gradient-to-br
              from-green-600
              to-emerald-700
              text-white
              shadow-xl
              shadow-green-900/20
              transition
              hover:-translate-y-1
              hover:shadow-2xl
              active:scale-95
              sm:bottom-6
              sm:right-6
            "
            title="RevelaAI Assistant (Ctrl + K)"
          >
            <Bot size={22} />
          </button>
        </main>
      </div>
    </>
  );
}
