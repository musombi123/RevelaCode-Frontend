"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, BarChart3, CheckCircle2, Clock3, RefreshCw, Ticket, UserCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { Button } from "@/components/ui/Button.jsx";
import { readSupportResponse, supportApiUrl, supportAuthHeaders } from "./supportApi.js";

const metrics = [
  { key: "total_tickets", label: "Total tickets", icon: Ticket },
  { key: "open_tickets", label: "Open", icon: AlertCircle },
  { key: "pending_tickets", label: "Pending", icon: Clock3 },
  { key: "resolved_tickets", label: "Resolved", icon: CheckCircle2 },
  { key: "assigned_to_me", label: "Assigned to team", icon: UserCheck },
  { key: "unassigned_tickets", label: "Unassigned", icon: Ticket },
];

export default function SupportAnalytics() {
  const { getAccessToken, getTokenType } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true); else setLoading(true);
      setError("");
      const headers = await supportAuthHeaders(getAccessToken, getTokenType, { "Content-Type": "application/json" });
      const response = await fetch(supportApiUrl("/api/support/analytics"), { headers });
      const data = await readSupportResponse(response, "Unable to load support analytics.");
      setAnalytics(data.analytics || {});
      setActivity(Array.isArray(data.recent_activity) ? data.recent_activity : []);
    } catch (err) {
      console.error("Support analytics load failed:", err);
      setError(err?.message || "Unable to load support analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAccessToken, getTokenType]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  return (
    <div className="space-y-6">
      {error && <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-start gap-2"><AlertCircle size={18} className="mt-0.5 shrink-0" />{error}</span><Button variant="outline" onClick={() => loadAnalytics(true)} disabled={refreshing}>Retry</Button></div>}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(({ key, label, icon: Icon }) => <article key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-slate-600">{label}</p><span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><Icon size={19} /></span></div><p className="mt-4 text-3xl font-bold tabular-nums text-slate-950">{loading ? "—" : (analytics?.[key] ?? 0)}</p></article>)}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-900">Resolution rate</h2><p className="mt-1 text-sm text-slate-500">Resolved tickets as a share of all tickets reported by the backend.</p></div><Button variant="outline" onClick={() => loadAnalytics(true)} disabled={loading || refreshing}><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh analytics</Button></div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${Math.max(0, Math.min(Number(analytics?.resolution_rate || 0), 100))}%` }} /></div>
        <p className="mt-2 text-sm font-semibold text-emerald-800">{loading ? "Loading…" : `${Number(analytics?.resolution_rate || 0).toFixed(1)}% resolved`}</p>
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5"><BarChart3 size={20} className="text-emerald-700" /><div><h2 className="font-bold text-slate-900">Recent ticket activity</h2><p className="mt-1 text-sm text-slate-500">Latest ticket updates returned by the analytics endpoint.</p></div></div>
        {loading ? <div className="space-y-3 p-5"><div className="h-12 animate-pulse rounded-lg bg-slate-100" /><div className="h-12 animate-pulse rounded-lg bg-slate-100" /></div> : activity.length ? <div className="divide-y divide-slate-100">{activity.map((item) => <div key={item.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{item.subject || "Untitled ticket"}</p><p className="mt-1 text-xs text-slate-500">{item.assigned_to ? `Assigned to ${item.assigned_to}` : "Unassigned"}</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.status === "resolved" ? "bg-emerald-50 text-emerald-700" : item.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{item.status || "unknown"}</span><time className="text-xs text-slate-500">{item.updated_at && item.updated_at !== "None" ? item.updated_at : "Update time unavailable"}</time></div></div>)}</div> : <p className="px-5 py-12 text-center text-sm text-slate-500">No recent activity returned by the service.</p>}
      </section>
    </div>
  );
}
