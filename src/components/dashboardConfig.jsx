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

const HistoryDashboard =
  safeLazy(() => import("./HistoryDashboard.jsx"), "History");

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
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">
        Welcome, Seeker ✨
      </h2>

      <p className="text-gray-600 dark:text-gray-300">
        Prophetic intelligence • Biblical research • AI-assisted insight
      </p>
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
    key: "history",
    title: "History",
    label: "History",
    icon: History,
    element: <HistoryDashboard />,
    restricted: true, // 🔒 guest blocked
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
