"use client";

import React, {
  useState,
} from "react";

import {
  Menu,
  LayoutDashboard,
  Users,
  BookOpen,
  ShieldCheck,
  BookMarked,
  Settings,
} from "lucide-react";

import AdminHeader from "./AdminHeader.jsx";
import AdminSidebar from "./AdminSidebar.jsx";

import AdminOverview from "./AdminOverview.jsx";
import AdminTeamManagement from "./AdminTeamManagement.jsx";
import AdminStudyManagement from "./AdminStudyManagement.jsx";
import AdminPolicyManagement from "./AdminPolicyManagement.jsx";
import AdminScriptureManagement from "./AdminScriptureManagement.jsx";

/* =========================================================
   ADMIN PAGES
========================================================= */

const adminPages = {
  overview: {
    title: "Dashboard Overview",
    description:
      "Monitor platform activity, resources, and system health.",
    icon: LayoutDashboard,
    component: AdminOverview,
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

  settings: {
    title: "System Settings",
    description:
      "Manage global platform configuration.",
    icon: Settings,
    component: AdminSettings,
  },
};

/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function AdminDashboard() {
  const [activeTab, setActiveTab] =
    useState("overview");

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const activePage =
    adminPages[activeTab] ||
    adminPages.overview;

  const ActiveIcon =
    activePage.icon;

  const ActiveComponent =
    activePage.component;

  return (
    <div
      className="
        flex
        min-h-screen
        w-full
        overflow-hidden
        bg-slate-50
        text-slate-900
        dark:bg-slate-950
        dark:text-white
      "
    >
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* =====================================================
          MAIN APPLICATION
      ===================================================== */}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader />

        {/* ===================================================
            SCROLLABLE CONTENT
        =================================================== */}

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">

            {/* =================================================
                MOBILE MENU BUTTON
            ================================================= */}

            <div className="mb-5 lg:hidden">
              <button
                type="button"
                onClick={() =>
                  setMobileOpen(true)
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-3.5
                  py-2.5
                  text-sm
                  font-semibold
                  text-slate-600
                  shadow-sm
                  transition
                  hover:bg-slate-50
                  hover:text-slate-900
                  dark:border-slate-800
                  dark:bg-slate-900
                  dark:text-slate-300
                  dark:hover:bg-slate-800
                  dark:hover:text-white
                "
              >
                <Menu className="h-4 w-4" />

                Admin Menu
              </button>
            </div>

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900">
                  <ActiveIcon
                    className="h-5 w-5"
                    strokeWidth={1.8}
                  />
                </div>

                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Administration
                    </span>

                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  </div>

                  <h1 className="truncate text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                    {activePage.title}
                  </h1>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {activePage.description}
                  </p>
                </div>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Admin Console
              </div>
            </div>

            {/* =================================================
                ACTIVE CONTENT
            ================================================= */}

            <section className="min-w-0">
              <ActiveComponent />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function AdminSettings() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <Settings className="h-5 w-5 text-slate-500 dark:text-slate-300" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Global System Settings
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              Configure platform-wide settings and services.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center dark:border-slate-800 dark:bg-slate-950/40">
          <Settings className="mx-auto mb-3 h-7 w-7 text-slate-300 dark:text-slate-700" />

          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Settings workspace
          </p>

          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
            Global configuration controls can be added here as
            the administration platform grows.
          </p>
        </div>
      </div>
    </div>
  );
}
