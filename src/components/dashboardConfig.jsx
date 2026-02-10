import React, { lazy, Suspense } from "react";
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
   HARDENED SAFE LAZY (won’t brick production)
====================================================== */

function safeLazy(importFn, name) {
  const LazyComp = lazy(() =>
    importFn().catch((err) => {
      console.error(`🚨 LAZY LOAD FAIL → ${name}:`, err);
      return {
        default: function Fallback() {
          return (
            <div className="p-6 text-sm text-red-500">
              {name} failed to load. Try another tab.
            </div>
          );
        },
      };
    })
  );

  return function SafeComponent() {
    return (
      <Suspense fallback={<div className="p-6">Loading {name}…</div>}>
        <LazyComp />
      </Suspense>
    );
  };
}

/* ======================================================
   LAZY DASHBOARDS (clean, predictable, resilient)
====================================================== */

const BibleDashboard = safeLazy(() => import("./BibleDashboard.jsx"), "Bible");
const ProphecyDashboard = safeLazy(
  () => import("./ProphecyDashboard.jsx"),
  "Prophecy"
);
const ProphecyEventsDashboard = safeLazy(
  () => import("./ProphecyEventsDashboard.jsx"),
  "Events"
);
const ReferentialDashboard = safeLazy(
  () => import("./ReferentialDashboard.jsx"),
  "Referential"
);
const PreferencesDashboard = safeLazy(
  () => import("./PreferencesDashboard.jsx"),
  "Preferences"
);
const UserAccountDashboard = safeLazy(
  () => import("./UserAccountDashboard.jsx"),
  "Account"
);
const AIAssistantDashboard = safeLazy(
  () => import("./AIAssistantDashboard.jsx"),
  "RevelaAI"
);

/* ======================================================
   STATIC HOME (never lazy, never risky)
====================================================== */

function HomeDashboard() {
  const historyCount = Number(
    localStorage.getItem("revelacode_history_count") || 0
  );

  const lastDashboardKey =
    localStorage.getItem("revelacode_last_dashboard") || "home";
  const lastDashboardLabel =
    localStorage.getItem("revelacode_last_dashboard_label") || "Home";

  const lastActivityText =
    localStorage.getItem("revelacode_last_activity") ||
    "No activity yet. Start decoding something legendary ✨";

  const lastActivityTime =
    localStorage.getItem("revelacode_last_activity_time") || "";

  const prettyTime = lastActivityTime
    ? new Date(lastActivityTime).toLocaleString()
    : "";

  const quickActions = [
    {
      title: "Open Bible",
      desc: "Search scripture instantly",
      icon: Book,
      badge: "FAST",
      key: "bible",
    },
    {
      title: "Decode Prophecy",
      desc: "Symbols • timelines • patterns",
      icon: BookOpen,
      badge: "HOT",
      key: "prophecy",
    },
    {
      title: "Prophecy Events",
      desc: "Explore events & meaning",
      icon: Globe,
      badge: "NEW",
      key: "events",
    },
    {
      title: "Referential Tools",
      desc: "Cross-reference smarter",
      icon: Layers,
      badge: "PRO",
      key: "referential",
    },
  ];

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
        <h2 className="text-3xl font-bold">Welcome, Seeker ✨</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Prophetic intelligence • Biblical research • AI-assisted insight
        </p>
      </div>

      {/* MINI STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="History Items"
          value={historyCount}
          icon={<History className="w-4 h-4 text-indigo-600" />}
          subtitle="Your saved decode trail"
        />

        <StatCard
          title="Last Dashboard"
          value={lastDashboardLabel}
          icon={<Layers className="w-4 h-4 text-green-600" />}
          subtitle={`Key: ${lastDashboardKey}`}
        />

        <StatCard
          title="System Status"
          value="Online ✅"
          icon={<Bot className="w-4 h-4 text-purple-600" />}
          subtitle="AI + dashboards ready"
        />
      </div>

      {/* QUICK ACTIONS */}
      <div className="rounded-2xl border p-5">
        <h3 className="text-lg font-bold mb-3">Quick Actions ⚡</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <button
              key={a.key}
              className="text-left rounded-2xl border p-4 hover:shadow-md transition"
            >
              <div className="flex items-center gap-2">
                <a.icon className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold">{a.title}</span>
              </div>
              <p className="text-sm mt-2">{a.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* CONTINUE WHERE YOU LEFT OFF */}
      <div className="rounded-2xl border p-5">
        <h3 className="text-lg font-bold">Continue where you left off 🔁</h3>
        <p className="mt-2">{lastActivityText}</p>
        {prettyTime && (
          <p className="text-xs text-gray-500 mt-1">{prettyTime}</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, subtitle }) {
  return (
    <div className="rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

/* ======================================================
   SINGLE SOURCE OF TRUTH — DASHBOARD REGISTRY
====================================================== */

export const DASHBOARDS = [
  {
    key: "home",
    title: "Home",
    label: "Home",
    icon: Home,
    default: true,
    element: <HomeDashboard />,
    restricted: false,
  },

  {
    key: "bible",
    title: "Bible",
    label: "Bible",
    icon: Book,
    element: <BibleDashboard />,
    restricted: false, // always available
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
    restricted: true, // guest blocked
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
