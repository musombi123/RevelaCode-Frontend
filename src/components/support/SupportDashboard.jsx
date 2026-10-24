"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, AlertCircle, ArrowRight, Ticket } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import SupportSidebar from "./SupportSidebar.jsx";
import SupportHeader from "./SupportHeader.jsx";
import SupportStats from "./SupportStats.jsx";
import SupportTickets from "./SupportTickets.jsx";
import SupportHistory from "./SupportHistory.jsx";
import SupportAnalytics from "./SupportAnalytics.jsx";
import SupportAdminOperations from "./SupportAdminOperations.jsx";
import AdminStudyManagement from "@/components/admin/AdminStudyManagement.jsx";
import AdminPolicyManagement from "@/components/admin/AdminPolicyManagement.jsx";
import AdminOperationsHandbook from "@/components/admin/AdminOperationsHandbook.jsx";
import { useAdminApi } from "@/services/adminApi.jsx";
import { readSupportResponse, supportApiUrl, supportAuthHeaders } from "./supportApi.js";

const PAGE_META = {
  dashboard: { title: "Support overview", description: "Monitor incoming requests and the work waiting for your support team." },
  tickets: { title: "Support tickets", description: "Review requests, inspect details, and move tickets through resolution." },
  history: { title: "Team history", description: "Review recent ticket assignments and resolutions recorded by the platform." },
  analytics: { title: "Support analytics", description: "Track ticket volumes, resolution rate, and the latest support activity." },
  team: { title: "Support team operations", description: "Monitor team workload, assign tickets to active support agents and review recorded operational activity." },
  study: { title: "Study Hub management", description: "Manage existing study materials and reviewed Faith starter lessons under your delegated support-administrator role." },
  policies: { title: "Policies and terms", description: "Maintain approved policy and public legal-document revisions. Publish only reviewed text." },
  handbook: { title: "System handbook", description: "Learn the ecosystem, role boundaries, operational procedures and escalation paths from the ground up." },
};

export default function SupportDashboard() {
  const auth = useAuth();
  const { user, logout, getAccessToken, getTokenType } = auth;
  const adminApi = useAdminApi();
  const supportAdmin = String(user?.role || "").toLowerCase() === "support_admin";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (showRefresh = false) => {
    if (!["support", "support_admin"].includes(String(user?.role || "").toLowerCase())) {
      setError("A signed-in support account is required to open this workspace.");
      setLoading(false);
      return;
    }

    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      if (supportAdmin) {
        const data = await adminApi.platform.getSupportAdminOverview();
        setStats(data.stats || {});
      } else {
        const headers = await supportAuthHeaders(getAccessToken, getTokenType, {
          "Content-Type": "application/json",
        });
        const response = await fetch(supportApiUrl("/api/support/dashboard"), {
          method: "GET",
          headers,
        });
        const data = await readSupportResponse(response, "Unable to load support overview.");
        setStats(data.stats || {});
      }
    } catch (err) {
      console.error("Support dashboard load failed:", err);
      setError(err?.message || "Unable to load support overview.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.role, supportAdmin, getAccessToken, getTokenType, adminApi]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const meta = useMemo(() => PAGE_META[activeView] || PAGE_META.dashboard, [activeView]);

  function renderView() {
    if (activeView === "tickets") return <SupportTickets />;
    if (activeView === "history") return <SupportHistory />;
    if (activeView === "analytics") return <SupportAnalytics />;
    if (activeView === "team" && supportAdmin) return <SupportAdminOperations />;
    if (activeView === "study" && supportAdmin) return <AdminStudyManagement />;
    if (activeView === "policies" && supportAdmin) return <AdminPolicyManagement />;
    if (activeView === "handbook" && supportAdmin) return <AdminOperationsHandbook supervisorView />;

    return (
      <div className="space-y-6">
        {error && (
          <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2"><AlertCircle size={19} className="mt-0.5 shrink-0" /><span>{error}</span></div>
            <button type="button" onClick={() => loadDashboard(true)} disabled={refreshing} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 font-semibold hover:bg-red-100 disabled:opacity-60">
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"><div className="h-3 w-28 rounded bg-slate-100" /><div className="mt-5 h-7 w-16 rounded bg-slate-100" /></div>)}
          </div>
        ) : !error && <SupportStats stats={stats || {}} />}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Ticket size={22} /></div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Work the ticket queue</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Open a ticket to review the issue. Assign unassigned requests to the support team, record the resolution, and refresh the queue to verify the saved status.</p>
              </div>
            </div>
            <button type="button" onClick={() => setActiveView("tickets")} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2">
              Open tickets <ArrowRight size={17} />
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <SupportSidebar role={user?.role} activeView={activeView} setActiveView={setActiveView} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <SupportHeader user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} logout={logout} />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">{supportAdmin ? "Support administration" : "Support team"}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{meta.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{meta.description}</p>
            </div>
            {activeView === "dashboard" && (
              <button type="button" onClick={() => loadDashboard(true)} disabled={loading || refreshing} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-600">
                <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} /> Refresh overview
              </button>
            )}
          </div>
          {renderView()}
        </main>
      </div>
    </div>
  );
}
