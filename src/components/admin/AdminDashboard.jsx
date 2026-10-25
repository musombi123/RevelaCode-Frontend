"use client";

import React, { useState } from "react";

import {
  Menu,
  LayoutDashboard,
  Users,
  BookOpen,
  ShieldCheck,
  BookMarked,
  Settings,
  ClipboardCheck,
  CircleDollarSign,
  Database,
  Brain,
  Cpu,
} from "lucide-react";

import AdminHeader from "./AdminHeader.jsx";
import AdminSidebar from "./AdminSidebar.jsx";

import AdminOverview from "./AdminOverview.jsx";
import AdminTeamManagement from "./AdminTeamManagement.jsx";
import AdminStudyManagement from "./AdminStudyManagement.jsx";
import AdminPolicyManagement from "./AdminPolicyManagement.jsx";
import AdminScriptureManagement from "./AdminScriptureManagement.jsx";
import AdminSchoolVerification from "./AdminSchoolVerification.jsx";
import AdminBiasharaVerification from "./AdminBiasharaVerification.jsx";
import AdminShambaVerification from "./AdminShambaVerification.jsx";
import AdminRevenueManagement from "./AdminRevenueManagement.jsx";
import AdminJumuiyaDirectory from "./AdminJumuiyaDirectory.jsx";
import AdminOperationsHandbook from "./AdminOperationsHandbook.jsx";
import MetaEngineerLab from "@/pages/MetaEngineerLab.jsx";
import SciCoreDashboard from "@/pages/SciCoreDashboard.jsx";
import UsectZeroConsole from "@/pages/UsectZeroConsole.jsx";
import CoreMeshDashboard from "@/pages/CoreMeshDashboard.jsx";

// =========================================================
// ADMIN PAGES
// =========================================================

const adminPages = {
  coreMesh: {
    title: "USECT Core Mesh",
    description: "Monitor and operate the integrated ZERO, Genesis (Core-One), and Infinite Mind (Core-Two) stack.",
    icon: Cpu,
    component: CoreMeshDashboard,
  },

  usectZero: {
    title: "USECT-ZERO Core",
    description: "Monitor core health, review scoped developer-key requests, and inspect recent engineering-tool outcomes.",
    icon: Cpu,
    component: UsectZeroConsole,
  },

  metaEngineer: {
    title: "Meta-Engineer Lab",
    description: "Inspect RevelaAI self-engineering proposals, sandbox evidence, changelogs, and human approvals.",
    icon: Brain,
    component: MetaEngineerLab,
  },

  sciCore: {
    title: "Sci-Core Defensive Core",
    description: "Oversee live civilian research, defensive security scans, disaster simulations, and safe prototype generation.",
    icon: ShieldCheck,
    component: SciCoreDashboard,
  },

  overview: {
    title: "Dashboard Overview",
    description:
      "Monitor platform activity, resources, and system health.",
    icon: LayoutDashboard,
    component: AdminOverview,
  },

  directories: {
    title: "Jumuiya Directory",
    description:
      "Browse Shamba farmer profiles, Biashara businesses, and Elimu schools.",
    icon: Database,
    component: AdminJumuiyaDirectory,
  },

  verification: {
    title: "School Verification",
    description:
      "Review school registrations, inspect evidence, and manage verification decisions.",
    icon: ClipboardCheck,
    component: AdminSchoolVerification,
  },

  biasharaVerification: {
    title: "Business Verification",
    description:
      "Review business applications and unlock workspace access after approval.",
    icon: ClipboardCheck,
    component: AdminBiasharaVerification,
  },

  shambaVerification: {
    title: "Shamba Verification",
    description: "Review farmer profiles, confirm required details, and approve or return applications for correction.",
    icon: ClipboardCheck,
    component: AdminShambaVerification,
  },

  revenue: {
    title: "Revenue Management",
    description: "Manage pricing proposals and review revenue transaction intents across Jumuiya.",
    icon: CircleDollarSign,
    component: AdminRevenueManagement,
  },
  team: {
    title: "User Management",
    description:
      "Manage users and administration access.",
    icon: Users,
    component: AdminTeamManagement,
  },

  study: {
    title: "Study Hub",
    description:
      "Manage learning materials and study resources.",
    icon: BookOpen,
    component: AdminStudyManagement,
  },

  policy: {
    title: "Policies",
    description:
      "Manage platform policies and legal documents.",
    icon: ShieldCheck,
    component: AdminPolicyManagement,
  },

  scripture: {
    title: "Scripture Management",
    description:
      "Manage scripture resources and datasets.",
    icon: BookMarked,
    component: AdminScriptureManagement,
  },

  operations: {
    title: "Operations Handbook",
    description: "Learn the whole ecosystem, role boundaries, incident procedures and safe operating controls.",
    icon: BookOpen,
    component: AdminOperationsHandbook,
  },

  settings: {
    title: "System Settings",
    description:
      "Manage global platform configuration.",
    icon: Settings,
    component: AdminSettings,
  },
};

// =========================================================
// MAIN DASHBOARD
// =========================================================

export default function AdminDashboard({ initialTab = "overview" }) {
  const [activeTab, setActiveTab] = useState(() => adminPages[initialTab] ? initialTab : "overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSwitcherOpen, setMobileSwitcherOpen] = React.useState(false);

  const mainScrollRef = React.useRef(null);

  const activePage =
    adminPages[activeTab] || adminPages.overview;

  const ActiveIcon = activePage.icon;
  const ActiveComponent = activePage.component;

  // Grouping is presentation-only; existing page keys and their config stay unchanged.
  const pageGroups = [
    { label: "Core systems", keys: ["coreMesh", "usectZero", "metaEngineer", "sciCore"] },
    { label: "Platform", keys: ["overview", "directories", "revenue"] },
    { label: "Verification", keys: ["verification", "biasharaVerification", "shambaVerification"] },
    { label: "Content", keys: ["study", "policy", "scripture"] },
    { label: "Administration", keys: ["team", "operations", "settings"] },
  ];

  const activeGroup =
    pageGroups.find((group) => group.keys.includes(activeTab))?.label || "Platform";

  React.useEffect(() => {
    if (!mainScrollRef.current) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    mainScrollRef.current.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [activeTab]);

  React.useEffect(() => {
    if (!mobileSwitcherOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileSwitcherOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileSwitcherOpen]);

  const selectMobilePage = (pageKey) => {
    setActiveTab(pageKey);
    setMobileSwitcherOpen(false);
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <style>{`
        @keyframes admin-page-enter {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .admin-page-motion { animation: none !important; }
        }
      `}</style>

      {/* SIDEBAR — AdminSidebar remains a separate, unchanged component. */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* MAIN APPLICATION */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminHeader />

        <main
          ref={mainScrollRef}
          className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
        >
          {/* Mobile mission-control bar. AdminHeader remains unchanged above it. */}
          <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 pt-[env(safe-area-inset-top)] shadow-[0_8px_28px_-26px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 lg:hidden">
            <div className="flex min-h-16 items-center gap-2.5 px-3 py-2 sm:px-4">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open admin menu"
                className="flex h-11 w-11 flex-shrink-0 touch-manipulation items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition duration-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.97] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-200 motion-reduce:transition-none"
              >
                <Menu className="h-5 w-5" strokeWidth={1.9} />
              </button>

              <button
                type="button"
                onClick={() => setMobileSwitcherOpen(true)}
                aria-label="Choose admin page"
                aria-haspopup="dialog"
                aria-expanded={mobileSwitcherOpen}
                className="flex min-h-12 min-w-0 flex-1 touch-manipulation items-center gap-2.5 rounded-2xl px-1.5 py-1 text-left transition duration-200 hover:bg-slate-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.995] dark:hover:bg-slate-800/80 motion-reduce:transition-none"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-950/15 ring-1 ring-white/30">
                  <ActiveIcon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-semibold leading-4 text-indigo-700 dark:text-indigo-300">
                    {activeGroup}
                  </span>
                  <span className="mt-0.5 block truncate text-sm font-bold leading-5 text-slate-900 dark:text-white">
                    {activePage.title}
                  </span>
                </span>
                <span className="flex flex-shrink-0 items-center gap-1.5 pr-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50 motion-reduce:animate-none" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950" />
                  </span>
                </span>
              </button>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1600px] min-w-0 px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10 lg:pt-8">
            {/* PAGE HERO */}
            <header className="relative isolate mb-5 overflow-hidden rounded-[26px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_22px_64px_-48px_rgba(15,23,42,0.48)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/85 sm:mb-7 sm:rounded-[30px] sm:p-7 lg:p-8">
              <div className="pointer-events-none absolute -right-12 -top-20 -z-10 h-64 w-64 rounded-full bg-indigo-300/15 blur-3xl dark:bg-indigo-500/10" />
              <div className="pointer-events-none absolute -bottom-24 left-1/4 -z-10 h-48 w-64 rounded-full bg-violet-300/10 blur-3xl dark:bg-violet-500/5" />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 opacity-[0.15] dark:opacity-[0.1]"
                style={{
                  backgroundImage: "radial-gradient(circle at 1px 1px, rgba(100,116,139,0.5) 1px, transparent 0)",
                  backgroundSize: "18px 18px",
                }}
              />

              <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white shadow-[0_12px_30px_-12px_rgba(79,70,229,0.8)] ring-1 ring-white/30 sm:h-14 sm:w-14 sm:rounded-[20px]">
                    <ActiveIcon className="h-6 w-6" strokeWidth={1.8} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                      <span>Administration</span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">/</span>
                      <span className="text-indigo-700 dark:text-indigo-300">{activeGroup}</span>
                    </div>

                    <h1 className="break-words text-[clamp(1.5rem,4.8vw,2.15rem)] font-bold leading-tight tracking-tight text-slate-950 dark:text-white">
                      {activePage.title}
                    </h1>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300 line-clamp-2 sm:line-clamp-none">
                      {activePage.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center sm:justify-end">
                  <div className="inline-flex min-h-10 items-center gap-2.5 rounded-full border border-emerald-200/90 bg-emerald-50/90 px-3.5 py-2 text-[11px] font-bold tracking-wide text-emerald-800 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50 motion-reduce:animate-none" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950" />
                    </span>
                    Admin Console
                    <span className="sr-only">status active</span>
                  </div>
                </div>
              </div>
            </header>

            {/* ACTIVE PAGE — keep wide child tables inside their own horizontal scroll context. */}
            <section
              key={activeTab}
              aria-label={activePage.title}
              className="admin-page-motion min-w-0 overflow-x-auto rounded-[24px] border border-slate-200/80 bg-white/70 p-3 shadow-[0_18px_55px_-46px_rgba(15,23,42,0.35)] [animation:admin-page-enter_220ms_ease-out_both] dark:border-slate-800 dark:bg-slate-900/45 sm:rounded-[28px] sm:p-5 lg:p-6 motion-reduce:animate-none"
            >
              <ActiveComponent />
            </section>
          </div>
        </main>
      </div>

      {/* MOBILE PAGE SWITCHER */}
      {mobileSwitcherOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:p-4 sm:items-center"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setMobileSwitcherOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-page-switcher-title"
            className="max-h-[90dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-[28px] border border-slate-200 bg-white pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_28px_90px_-30px_rgba(15,23,42,0.65)] dark:border-slate-700 dark:bg-slate-900 sm:rounded-[28px]"
          >
            <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 px-5 pb-4 pt-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
              <div className="mb-3 flex justify-center sm:hidden">
                <span className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">Administration</p>
                  <h2 id="admin-page-switcher-title" className="mt-1 text-lg font-bold tracking-tight text-slate-950 dark:text-white">
                    Choose a control area
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    All administration pages, organized by system.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSwitcherOpen(false)}
                  aria-label="Close page switcher"
                  className="flex h-11 w-11 flex-shrink-0 touch-manipulation items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition duration-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.97] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 motion-reduce:transition-none"
                >
                  <span aria-hidden="true" className="text-2xl font-light leading-none">×</span>
                </button>
              </div>
            </div>

            <nav aria-label="Admin pages" className="space-y-5 px-4 py-4 sm:px-5">
              {pageGroups.map((group) => (
                <div key={group.label}>
                  <h3 className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                    {group.label}
                  </h3>
                  <div className="space-y-1.5">
                    {group.keys.map((pageKey) => {
                      const page = adminPages[pageKey];
                      if (!page) return null;

                      const PageIcon = page.icon;
                      const selected = activeTab === pageKey;

                      return (
                        <button
                          key={pageKey}
                          type="button"
                          onClick={() => selectMobilePage(pageKey)}
                          aria-current={selected ? "page" : undefined}
                          className={selected
                            ? "flex min-h-14 w-full touch-manipulation items-center gap-3 rounded-2xl bg-indigo-50 px-3 py-2.5 text-left text-indigo-950 ring-1 ring-inset ring-indigo-100 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.995] dark:bg-indigo-950/45 dark:text-indigo-100 dark:ring-indigo-900/70 motion-reduce:transition-none"
                            : "flex min-h-14 w-full touch-manipulation items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-slate-700 transition duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.995] dark:text-slate-200 dark:hover:bg-slate-800/80 motion-reduce:transition-none"}
                        >
                          <span className={selected
                            ? "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm"
                            : "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}>
                            <PageIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block break-words text-sm font-semibold leading-5">{page.title}</span>
                            <span className="mt-0.5 block break-words text-[11px] leading-4 text-slate-500 dark:text-slate-400">{page.description}</span>
                          </span>
                          {selected && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-indigo-600 dark:bg-indigo-300" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </section>
        </div>
      )}
    </div>
  );
}

// =========================================================
// SETTINGS
// =========================================================

function AdminSettings() {
  const settingGroups = [
    {
      title: "General",
      description: "Platform identity, regional defaults, and workspace preferences.",
      icon: Settings,
    },
    {
      title: "Security",
      description: "Access policies, session controls, and security defaults.",
      icon: ShieldCheck,
    },
    {
      title: "Integrations",
      description: "Connected services, API settings, and platform integrations.",
      icon: Database,
    },
    {
      title: "Notifications",
      description: "Operational alerts, delivery rules, and notification preferences.",
      icon: ClipboardCheck,
    },
  ];

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_20px_60px_-44px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900 sm:rounded-[28px]">
      <header className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 px-5 py-5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 sm:px-7 sm:py-6">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-950/15">
            <Settings className="h-5 w-5" strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">
              Administration
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              Global System Settings
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              A single place for platform-wide defaults and operational preferences.
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-7">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          {settingGroups.map(({ title, description, icon: SettingIcon }) => (
            <div
              key={title}
              aria-disabled="true"
              className="flex min-h-[112px] min-w-0 items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/75 p-4 dark:border-slate-800 dark:bg-slate-950/40 sm:p-5"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <SettingIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {title}
                  </h3>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    Coming soon
                  </span>
                </div>
                <p className="mt-1.5 break-words text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center dark:border-slate-700 dark:bg-slate-950/30 sm:py-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900/60">
            <Settings className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
            Your settings workspace is being prepared
          </h3>
          <p className="mx-auto mt-1.5 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-400">
            These areas are placeholders for future controls. No settings are changed from this screen today.
          </p>
        </div>
      </div>
    </section>
  );
}
