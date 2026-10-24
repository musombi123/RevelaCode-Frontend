"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  RefreshCw,
  Users,
  UserCheck,
  Clock3,
  Ticket,
} from "lucide-react";
import { useAdminApi } from "@/services/adminApi.jsx";

function metricLabel(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

function dateLabel(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function SupportAdminOperations() {
  const adminApi = useAdminApi();
  const [overview, setOverview] = useState(null);
  const [team, setTeam] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [assignments, setAssignments] = useState({});
  const [busyTicket, setBusyTicket] = useState("");

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [overviewResult, teamResult, activityResult] = await Promise.all([
        adminApi.platform.getSupportAdminOverview(),
        adminApi.platform.getSupportAdminTeam(),
        adminApi.platform.getSupportAdminActivity({ limit: 30 }),
      ]);
      setOverview(overviewResult || {});
      setTeam(Array.isArray(teamResult?.team) ? teamResult.team : []);
      setActivity(Array.isArray(activityResult?.activity) ? activityResult.activity : []);
    } catch (err) {
      setError(err?.message || "Unable to load support operations. Confirm the current support-admin role and backend deployment.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [adminApi]);

  useEffect(() => { loadData(); }, [loadData]);

  async function assign(ticket) {
    const ticketId = String(ticket?.id || "");
    const selected = String(assignments[ticketId] || "");
    if (!ticketId || !selected) {
      setError("Choose an active Support Agent before assigning this ticket.");
      return;
    }
    setBusyTicket(ticketId);
    setError("");
    setNotice("");
    try {
      const response = await adminApi.platform.assignSupportTicket(ticketId, selected);
      setNotice(response?.message || "Ticket assignment saved.");
      await loadData(true);
    } catch (err) {
      setError(err?.message || "Ticket assignment could not be saved.");
    } finally {
      setBusyTicket("");
    }
  }

  const stats = overview?.stats || {};
  const recent = Array.isArray(overview?.recent) ? overview.recent : [];
  const supportAgents = team.filter((item) => String(item.role).toLowerCase() === "support");

  const metrics = [
    { label: "All tickets", value: stats.total, icon: Ticket },
    { label: "Open", value: stats.open, icon: ClipboardCheck },
    { label: "Pending", value: stats.pending, icon: Clock3 },
    { label: "Unassigned", value: stats.unassigned, icon: AlertCircle },
    { label: "Resolved", value: stats.resolved, icon: CheckCircle2 },
    { label: "Support staff", value: stats.support_staff, icon: Users },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300">Support Admin · Operations</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">Team and service monitoring</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">Monitor the entire ticket queue, keep work assigned to active Support Agents, review recorded support activity, and identify unresolved operational issues.</p>
          </div>
          <button type="button" onClick={() => loadData(true)} disabled={loading || refreshing} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-slate-700"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />Refresh data</button>
        </div>
      </section>

      {error ? <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</div> : null}
      {notice ? <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200"><CheckCircle2 size={17} className="mt-0.5 shrink-0" />{notice}</div> : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {metrics.map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-4">
            <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-500">{label}</span><Icon size={16} className="shrink-0 text-slate-400" /></div>
            <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{loading ? "—" : metricLabel(value)}</p>
          </article>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5"><Users size={19} className="text-slate-500" /><div><h3 className="font-black text-slate-950 dark:text-white">Active support team</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Support Agents receive ticket assignments. The Support Administrator supervises but is not treated as a queue agent.</p></div></div>
        {loading ? <div className="p-5 text-sm text-slate-500">Loading support team…</div> : team.length === 0 ? <div className="p-6 text-sm text-slate-500">No active support team records were returned.</div> : (
          <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3 sm:p-4">
            {team.map((member) => (
              <article key={member.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800 sm:p-4">
                <div className="flex items-start gap-3"><span className="rounded-lg bg-slate-100 p-2 text-slate-700 dark:bg-slate-900 dark:text-slate-200">{String(member.role).toLowerCase() === "support_admin" ? <UserCheck size={17} /> : <Users size={17} />}</span><div className="min-w-0 flex-1"><p className="break-words text-sm font-bold text-slate-900 dark:text-white">{member.full_name || "Unnamed support member"}</p><p className="mt-1 break-all text-xs text-slate-500">{member.contact || "Contact not available"}</p><p className="mt-2 text-xs font-semibold capitalize text-slate-600 dark:text-slate-300">{String(member.role || "support").replaceAll("_", " ")}</p></div></div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800"><span className="text-slate-500">Open assigned tickets</span><strong className="text-slate-900 dark:text-white">{metricLabel(member.open_assigned_tickets)}</strong></div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5"><h3 className="font-black text-slate-950 dark:text-white">Recent tickets and assignment</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Assign unassigned work or move open tickets to an active Support Agent.</p></div>
        {loading ? <div className="p-5 text-sm text-slate-500">Loading recent tickets…</div> : recent.length === 0 ? <div className="p-6 text-sm text-slate-500">No tickets were returned by the support service.</div> : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recent.map((ticket) => (
              <article key={ticket.id} className="flex flex-col gap-3 p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0"><p className="break-words text-sm font-bold text-slate-900 dark:text-white">{ticket.subject || "Support request"}</p><p className="mt-1 text-xs text-slate-500">From {ticket.user || "User not recorded"} · Updated {dateLabel(ticket.updated_at || ticket.created_at)}</p><p className="mt-1 text-xs text-slate-500">Assigned to: {ticket.assigned_to_name || ticket.assigned_to || "Unassigned"}</p></div>
                  <span className="self-start rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">{ticket.status || "open"}</span>
                </div>
                {String(ticket.status || "").toLowerCase() !== "resolved" ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select value={assignments[ticket.id] || ""} onChange={(event) => setAssignments((current) => ({ ...current, [ticket.id]: event.target.value }))} className="min-h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                      <option value="">Choose a Support Agent</option>
                      {supportAgents.map((member) => <option key={member.id} value={member.id}>{member.full_name || member.contact}</option>)}
                    </select>
                    <button type="button" disabled={!assignments[ticket.id] || busyTicket === ticket.id} onClick={() => assign(ticket)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{busyTicket === ticket.id ? <RefreshCw size={13} className="animate-spin" /> : <UserCheck size={13} />}{busyTicket === ticket.id ? "Assigning…" : "Assign ticket"}</button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5"><ClipboardCheck size={19} className="text-slate-500" /><div><h3 className="font-black text-slate-950 dark:text-white">Recorded support activity</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Audit entries returned by the support operation logs.</p></div></div>
        {activity.length === 0 ? <div className="p-5 text-sm text-slate-500">No matching activity entries were returned.</div> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{activity.map((item) => <div key={item.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="break-words text-sm font-semibold text-slate-900 dark:text-white">{String(item.action || "Operation").replaceAll("_", " ")}</p><p className="mt-1 break-words text-xs text-slate-500">Actor {item.actor || "Unknown"} · Resource {item.resource || "—"}</p></div><time className="shrink-0 text-xs text-slate-400">{dateLabel(item.timestamp)}</time></div>)}</div>}
      </section>
    </div>
  );
}
