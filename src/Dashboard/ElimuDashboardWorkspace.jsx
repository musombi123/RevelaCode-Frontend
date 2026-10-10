import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Menu,
  RefreshCw,
} from "lucide-react";

import ElimuDashboardHeader from "@/Dashboard/elimu/components/ElimuDashboardHeader.jsx";
import ElimuDashboardSidebar from "@/Dashboard/elimu/components/ElimuDashboardSidebar.jsx";

import ElimuOwnerDashboard from "@/Dashboard/elimu/ElimuOwnerDashboard.jsx";
import ElimuPrincipalDashboard from "@/Dashboard/elimu/ElimuPrincipalDashboard.jsx";
import ElimuBursarDashboard from "@/Dashboard/elimu/ElimuBursarDashboard.jsx";
import ElimuRegistrarDashboard from "@/Dashboard/elimu/ElimuRegistrarDashboard.jsx";
import ElimuTeacherDashboard from "@/Dashboard/elimu/ElimuTeacherDashboard.jsx";

const ROLE_LABELS = {
  owner: "Owner / School Director",
  principal: "Principal",
  bursar: "Bursar",
  registrar: "Registrar",
  teacher: "Teacher",
};

const ROLE_DESCRIPTIONS = {
  owner: "Oversee school operations, staff, academic performance and finances.",
  principal: "Coordinate school operations, academic delivery and staff performance.",
  bursar: "Manage school fees, financial records and financial reporting.",
  registrar: "Manage admissions, enrolment and student records.",
  teacher: "Manage assigned classes, lessons, attendance and learner assessments.",
};

function unwrapResponse(response) {
  if (!response || typeof response !== "object") return response;

  if (response.data && typeof response.data === "object") {
    return response.data;
  }

  return response;
}

function normalizeRole(access) {
  const candidates = [
    access?.role,
    access?.membership?.role,
    access?.access?.role,
    access?.role_label,
    access?.membership?.role_label,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim().toLowerCase();

    if (!value) continue;

    if (value === "owner" || value.includes("school owner")) {
      return "owner";
    }

    if (value.includes("director")) return "owner";
    if (value.includes("principal")) return "principal";
    if (value.includes("bursar") || value.includes("finance")) {
      return "bursar";
    }
    if (value.includes("registrar") || value.includes("admission")) {
      return "registrar";
    }
    if (value.includes("teacher") || value.includes("educator")) {
      return "teacher";
    }
  }

  return "";
}

function getSchool(access, dashboard) {
  return (
    access?.school ||
    dashboard?.school ||
    dashboard?.hub?.school ||
    null
  );
}

function getSchoolName(school) {
  return (
    school?.name ||
    school?.school_name ||
    school?.institution_name ||
    "School workspace"
  );
}

function getCurrentUserName(access, dashboard) {
  const user =
    access?.user ||
    access?.membership?.user ||
    dashboard?.user ||
    dashboard?.profile ||
    {};

  return (
    user?.full_name ||
    user?.name ||
    user?.display_name ||
    user?.username ||
    ""
  );
}

function getRoleDashboard(role) {
  switch (role) {
    case "owner":
      return ElimuOwnerDashboard;
    case "principal":
      return ElimuPrincipalDashboard;
    case "bursar":
      return ElimuBursarDashboard;
    case "registrar":
      return ElimuRegistrarDashboard;
    case "teacher":
      return ElimuTeacherDashboard;
    default:
      return null;
  }
}

export default function ElimuDashboardWorkspace({
  access,
  dashboard,
  onNavigate,
  currentPath = "elimu",
  onRefresh,
  refreshing = false,
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const role = useMemo(() => normalizeRole(access), [access]);
  const school = useMemo(
    () => getSchool(access, dashboard),
    [access, dashboard]
  );

  const schoolName = getSchoolName(school);
  const userName = getCurrentUserName(access, dashboard);
  const RoleDashboard = getRoleDashboard(role);

  const handleNavigate = (path) => {
    if (typeof onNavigate === "function") {
      onNavigate(path);
    }

    setMobileSidebarOpen(false);
  };

  const handleRefresh = () => {
    if (typeof onRefresh === "function") {
      return onRefresh();
    }

    return undefined;
  };

  const headerTitle = ROLE_LABELS[role] || "School workspace";
  const headerDescription =
    ROLE_DESCRIPTIONS[role] ||
    "Manage school operations from your Elimu workspace.";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <ElimuDashboardSidebar
          access={access}
          school={school}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
            <div className="flex min-h-[72px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  aria-label="Open navigation menu"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 lg:hidden"
                >
                  <Menu size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((value) => !value)}
                  aria-label={
                    sidebarCollapsed
                      ? "Expand navigation sidebar"
                      : "Collapse navigation sidebar"
                  }
                  className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 lg:inline-flex"
                >
                  <Menu size={19} />
                </button>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
                    {schoolName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    {userName
                      ? `${userName} · ${ROLE_LABELS[role] || "School member"}`
                      : ROLE_LABELS[role] || "School workspace"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-900 dark:hover:bg-blue-950/30 dark:hover:text-blue-300 sm:px-4"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">
                  {refreshing ? "Refreshing…" : "Refresh"}
                </span>
              </button>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="mx-auto w-full max-w-[1600px] space-y-6">
              <ElimuDashboardHeader
                access={access}
                school={school}
                title={headerTitle}
                description={headerDescription}
                onNavigate={handleNavigate}
                onRefresh={handleRefresh}
                refreshing={refreshing}
              />

              {!role && (
                <section
                  role="alert"
                  className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30"
                >
                  <AlertCircle
                    size={20}
                    className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300"
                  />
                  <div>
                    <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      School role unavailable
                    </h2>
                    <p className="mt-1 text-sm leading-5 text-amber-800 dark:text-amber-300">
                      Elimu could not identify your school role from the access
                      response. Refresh the workspace or verify the active
                      school membership. A role-specific dashboard cannot be
                      selected safely until the role is known.
                    </p>
                  </div>
                </section>
              )}

              {RoleDashboard && (
                <RoleDashboard
                  access={access}
                  dashboard={unwrapResponse(dashboard)}
                  school={school}
                  onNavigate={handleNavigate}
                  currentPath={currentPath}
                  onRefresh={handleRefresh}
                  refreshing={refreshing}
                />
              )}

              {!RoleDashboard && role && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950 sm:p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    <AlertCircle size={24} />
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">
                    No dashboard is configured for this role
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                    The active school membership returned a role that does not
                    have a dedicated Elimu dashboard. Ask the school
                    administrator to verify your membership and permissions.
                  </p>
                </section>
              )}
            </div>
          </main>

          <footer className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>Elimu · School management workspace</span>
              <span>School records are governed by your account permissions.</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}