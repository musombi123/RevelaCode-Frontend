import React, { lazy } from "react";
import {
  Home,
  BookOpen,
  Globe,
  Layers,
  Settings,
  Bot,
} from "lucide-react";

/* Lazy-loaded dashboards */
const ProphecyDashboard = lazy(() => import("./ProphecyDashboard.jsx"));
const ProphecyEventsDashboard = lazy(() => import("./ProphecyEventsDashboard.jsx"));
const ReferentialDashboard = lazy(() => import("./ReferentialDashboard.jsx"));
const UserAccountDashboard = lazy(() => import("./UserAccountDashboard.jsx"));
const AIAssistantDashboard = lazy(() => import("./AIAssistantDashboard.jsx"));
const BibleDashboard = lazy(() => import("./BibleDashboard.jsx"));
const HistoryDashboard = lazy(() => import("./HistoryDashboard.jsx"));
const PreferencesDashboard = lazy(() => import("./PreferencesDashboard.jsx"));
const SupportCenter = lazy(() => import("./SupportCenter.jsx"));

/* Static Home component (NOT lazy, NOT animated) */
const HomeDashboard = () => (
  <div className="text-center py-12">
    <h2 className="text-2xl font-semibold">Welcome to RevelaCode</h2>
    <p className="text-sm text-gray-500 mt-2">
      Prophetic intelligence • Biblical research • AI insight
    </p>
  </div>
);

export const DASHBOARDS = [
  {
    key: "home",
    title: "Dashboard",
    label: "Home",
    icon: Home,
    color: "from-indigo-600 to-indigo-500",
    default: true,
    component: HomeDashboard,
  },

  {
    key: "bible",
    title: "Bible Study",
    label: "Bible",
    icon: BookOpen,
    color: "from-blue-600 to-sky-500",
    component: BibleDashboard,
  },

  {
    key: "prophecy",
    title: "Prophecy Decoder",
    label: "Prophecy",
    icon: Layers,
    color: "from-purple-600 to-fuchsia-500",
    component: ProphecyDashboard,
  },

  {
    key: "events",
    title: "Global Events",
    label: "Events",
    icon: Globe,
    color: "from-amber-600 to-orange-500",
    component: ProphecyEventsDashboard,
  },

  {
    key: "referential",
    title: "Referential Tools",
    label: "Referential",
    icon: Layers,
    color: "from-cyan-600 to-sky-500",
    component: ReferentialDashboard,
  },

  {
    key: "history",
    title: "History",
    label: "History",
    icon: BookOpen,
    color: "from-emerald-600 to-green-500",
    component: HistoryDashboard,
  },

  {
    key: "preferences",
    title: "Preferences",
    label: "Preferences",
    icon: Settings,
    color: "from-gray-600 to-gray-500",
    component: PreferencesDashboard,
  },

  {
    key: "support",
    title: "Support Center",
    label: "Support",
    icon: Settings,
    color: "from-slate-600 to-slate-500",
    component: SupportCenter,
  },

  {
    key: "ai",
    title: "RevelaAI",
    label: "AI",
    icon: Bot,
    hidden: true,
    component: AIAssistantDashboard,
  },
];
