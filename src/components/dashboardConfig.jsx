import React, { lazy } from "react";
import {
  Home,
  BookOpen,
  Globe,
  Layers,
  Settings,
  Bot,
  Book,
  History,
  HelpCircle,
} from "lucide-react";

/* ======================================================
   Safe lazy wrapper
====================================================== */

function safeLazy(importFn, name) {
  const LazyComp = lazy(importFn);

  return function SafeComponent() {
    return (
      <React.Suspense fallback={<div className="p-6">Loading {name}...</div>}>
        <LazyComp />
      </React.Suspense>
    );
  };
}

/* ======================================================
   Lazy dashboards
====================================================== */

const BibleDashboard =
  safeLazy(() => import("./BibleDashboard.jsx"), "Bible");

const ProphecyDashboard =
  safeLazy(() => import("./ProphecyDashboard.jsx"), "Prophecy");

const ProphecyEventsDashboard =
  safeLazy(() => import("./ProphecyEventsDashboard.jsx"), "Events");

const ReferentialDashboard =
  safeLazy(() => import("./ReferentialDashboard.jsx"), "Referential");

const PreferencesDashboard =
  safeLazy(() => import("./PreferencesDashboard.jsx"), "Preferences");

const SupportDashboard =
  safeLazy(() => import("./SupportCenter.jsx"), "Support");

const UserAccountDashboard =
  safeLazy(() => import("./UserAccountDashboard.jsx"), "Settings");

const AIAssistantDashboard =
  safeLazy(() => import("./AIAssistantDashboard.jsx"), "RevelaAI");

/* ======================================================
   Static Home (never lazy)
====================================================== */

function HomeDashboard() {
  // Mini stats + continue section data (local, safe, non-breaking)
  const historyCount = Number(localStorage.getItem("revelacode_history_count") || 0);

  const lastDashboardKey = localStorage.getItem("revelacode_last_dashboard") || "home";
  const lastDashboardLabel = localStorage.getItem("revelacode_last_dashboard_label") || "Home";

  const lastActivityText =
    localStorage.getItem("revelacode_last_activity") ||
    "No activity yet. Start decoding something legendary ✨";

  const lastActivityTime =
    localStorage.getItem("revelacode_last_activity_time") || "";

  const prettyTime = lastActivityTime
    ? new Date(lastActivityTime).toLocaleString()
    : "";

  // Quick actions are UI-only here (safe blueprint)
  const quickActions = [
    {
      title: "Open Bible",
      desc: "Search scripture instantly",
      icon: Book,
      badge: "FAST",
    },
    {
      title: "Decode Prophecy",
      desc: "Symbols • timelines • patterns",
      icon: BookOpen,
      badge: "HOT",
    },
    {
      title: "Prophecy Events",
      desc: "Explore events & meaning",
      icon: Globe,
      badge: "NEW",
    },
    {
      title: "Referential Tools",
      desc: "Cross-reference smarter",
      icon: Layers,
      badge: "PRO",
    },
  ];

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-28 -left-28 w-80 h-80 rounded-full bg-green-500/10 blur-3xl" />

        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40">
            ✨ RevelaCode • Smart Bible + Prophecy Toolkit
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            Welcome, Seeker ✨
          </h2>

          <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
            Prophetic intelligence • Biblical research • AI-assisted insight
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
            <div className="rounded-xl p-4 bg-gray-50 dark:bg-gray-950/40 border border-gray-200/60 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Focus Mode
              </p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Decode faster ⚡
              </p>
            </div>

            <div className="rounded-xl p-4 bg-gray-50 dark:bg-gray-950/40 border border-gray-200/60 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Research
              </p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Cross-reference smart 🧠
              </p>
            </div>

            <div className="rounded-xl p-4 bg-gray-50 dark:bg-gray-950/40 border border-gray-200/60 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                AI Assist
              </p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Insights on demand 🤖
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MINI STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              History Items
            </p>
            <History className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            {historyCount}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Your saved decode trail (if enabled)
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last Dashboard
            </p>
            <Layers className="w-4 h-4 text-green-600 dark:text-green-300" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            {lastDashboardLabel}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Key: <span className="font-semibold">{lastDashboardKey}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              System Status
            </p>
            <Bot className="w-4 h-4 text-purple-600 dark:text-purple-300" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            Online ✅
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            AI + dashboards ready
          </p>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Quick Actions ⚡
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Jump straight into the work — no scrolling, no stress.
            </p>
          </div>

          <div className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200/60 dark:border-gray-700/60">
            Productivity Mode
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {quickActions.map((a) => (
            <button
              key={a.title}
              className="group text-left rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/40 hover:bg-white dark:hover:bg-gray-900 transition shadow-sm hover:shadow-md p-4"
              title={a.title}
              onClick={() => {
                // blueprint-safe: no navigation changes here
                // you can wire this later by passing a handler if needed
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <a.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {a.title}
                  </p>
                </div>

                <span className="text-[10px] px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40">
                  {a.badge}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                {a.desc}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition">
                Click to open →
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* CONTINUE WHERE YOU LEFT OFF */}
      <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Continue where you left off 🔁
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Pick up the last thing you touched and keep momentum.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200/60 dark:border-green-900/40">
            <History className="w-4 h-4" />
            Resume
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/40 p-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Last Activity
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {lastActivityText}
          </p>

          {prettyTime && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {prettyTime}
            </p>
          )}

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow transition"
              onClick={() => {
                // blueprint-safe: navigation wiring later
              }}
            >
              Resume Dashboard →
            </button>

            <button
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold transition"
              onClick={() => {
                localStorage.removeItem("revelacode_last_activity");
                localStorage.removeItem("revelacode_last_activity_time");
                localStorage.removeItem("revelacode_last_dashboard");
                localStorage.removeItem("revelacode_last_dashboard_label");
                window.location.reload();
              }}
            >
              Reset Resume Data
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER NOTE */}
      <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          🚀 <span className="font-semibold">Forward move:</span> You’re building
          something powerful here. Keep it clean, keep it accurate, and keep it
          useful.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          RevelaCode is designed for speed, clarity, and meaning — not noise.
        </p>
      </div>
    </div>
  );
}

/* ======================================================
   DASHBOARD REGISTRY (COMPLETE)
====================================================== */

export const DASHBOARDS = [
  {
    key: "home",
    title: "Home",
    label: "Home",
    icon: Home,
    default: true,
    element: <HomeDashboard />,
  },

  {
    key: "bible",
    title: "Bible",
    label: "Bible",
    icon: Book,
    element: <BibleDashboard />,
    restricted: false, // ✅ ALWAYS AVAILABLE
  },

  {
    key: "prophecy",
    title: "Prophecy",
    label: "Prophecy",
    icon: BookOpen,
    element: <ProphecyDashboard />,
  },

  {
    key: "events",
    title: "Events",
    label: "Events",
    icon: Globe,
    element: <ProphecyEventsDashboard />,
  },

  {
    key: "referential",
    title: "Referential",
    label: "Referential",
    icon: Layers,
    element: <ReferentialDashboard />,
  },

  {
    key: "preferences",
    title: "Preferences",
    label: "Preferences",
    icon: Settings,
    element: <PreferencesDashboard />,
    restricted: true, // 🔒 guest blocked
  },

  {
    key: "support",
    title: "Support",
    label: "Support",
    icon: HelpCircle,
    element: <SupportDashboard />,
  },

  {
    key: "settings",
    title: "Account",
    label: "Account",
    icon: Settings,
    element: <UserAccountDashboard />,
    restricted: true,
  },

  {
    key: "ai",
    title: "RevelaAI",
    label: "AI",
    icon: Bot,
    hidden: true,
    element: <AIAssistantDashboard />,
  },
];
