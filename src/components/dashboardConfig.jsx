import React, { lazy } from "react";
import {
  Home,
  BookOpen,
  Globe,
  Layers,
  Settings,
  Bot,
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
   Lazy dashboards (SAFE)
====================================================== */

const ProphecyDashboard =
  safeLazy(() => import("./ProphecyDashboard.jsx"), "Prophecy");

const ProphecyEventsDashboard =
  safeLazy(() => import("./ProphecyEventsDashboard.jsx"), "Events");

const ReferentialDashboard =
  safeLazy(() => import("./ReferentialDashboard.jsx"), "Referential");

const UserAccountDashboard =
  safeLazy(() => import("./UserAccountDashboard.jsx"), "Settings");

const AIAssistantDashboard =
  safeLazy(() => import("./AIAssistantDashboard.jsx"), "RevelaAI");

/* ======================================================
   Static Home (never lazy)
====================================================== */

function HomeDashboard() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">
        Welcome, Seeker ✨
      </h2>

      <p className="text-gray-600 dark:text-gray-300">
        Prophetic intelligence • Biblical research • AI-assisted insight
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="p-4 rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
          📖 Bible Exploration
        </div>
        <div className="p-4 rounded-xl bg-purple-100 dark:bg-purple-900/40">
          🔮 Prophecy Decoder
        </div>
        <div className="p-4 rounded-xl bg-green-100 dark:bg-green-900/40">
          🤖 RevelaAI Assistance
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   DASHBOARD REGISTRY (FINAL)
====================================================== */

export const DASHBOARDS = [
  {
    key: "home",
    title: "Dashboard",
    label: "Home",
    icon: Home,
    color: "from-indigo-600 to-indigo-500",
    default: true,
    element: <HomeDashboard />,
  },

  {
    key: "prophecy",
    title: "Prophecy Decoder",
    label: "Prophecy",
    icon: BookOpen,
    color: "from-purple-600 to-fuchsia-500",
    element: <ProphecyDashboard />,
  },

  {
    key: "events",
    title: "Global Events",
    label: "Events",
    icon: Globe,
    color: "from-amber-600 to-orange-500",
    element: <ProphecyEventsDashboard />,
  },

  {
    key: "referential",
    title: "Referential Tools",
    label: "Referential",
    icon: Layers,
    color: "from-cyan-600 to-sky-500",
    element: <ReferentialDashboard />,
  },

  {
    key: "settings",
    title: "Settings",
    label: "Settings",
    icon: Settings,
    color: "from-gray-600 to-gray-500",
    element: <UserAccountDashboard />,
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
