"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw, History, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { Button } from "@/components/ui/Button.jsx";
import { readSupportResponse, supportApiUrl, supportAuthHeaders } from "./supportApi.js";

export default function SupportHistory() {
  const { getAccessToken, getTokenType } = useAuth();
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async (refresh = false) => {
    try {
      setError("");
      if (refresh) setRefreshing(true); else setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      const headers = await supportAuthHeaders(getAccessToken, getTokenType, { "Content-Type": "application/json" });
      const response = await fetch(`${supportApiUrl("/api/support/history")}?${params}`, { headers });
      const data = await readSupportResponse(response, "Unable to load support history.");
      setHistory(Array.isArray(data.history) ? data.history : []);
      setPagination(data.pagination || { page, pages: 1, total: 0, limit: 20 });
    } catch (err) {
      console.error("Support history load failed:", err);
      setError(err?.message || "Unable to load support history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAccessToken, getTokenType, page]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3"><div className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><History size={20} /></div><div><h2 className="font-bold text-slate-900">Ticket activity history</h2><p className="mt-1 text-sm text-slate-500">Assignment and resolution events from the backend audit history.</p></div></div>
        <Button variant="outline" onClick={() => loadHistory(true)} disabled={loading || refreshing} className="inline-flex min-h-10 items-center gap-2"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh</Button>
      </div>
      {error && <div role="alert" className="m-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={18} className="mt-0.5 shrink-0" />{error}<button type="button" onClick={() => loadHistory(true)} className="ml-auto font-semibold underline">Retry</button></div>}
      {loading ? <div className="space-y-3 p-6"><div className="h-12 animate-pulse rounded-xl bg-slate-100" /><div className="h-12 animate-pulse rounded-xl bg-slate-100" /><div className="h-12 animate-pulse rounded-xl bg-slate-100" /></div> : !error && (history.length ? (
        <div className="divide-y divide-slate-100">
          {history.map((item) => <article key={item.id} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between sm:px-6"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.action === "resolve_ticket" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{String(item.action || "activity").replaceAll("_", " ")}</span><span className="text-xs text-slate-500">Ticket {item.resource || "—"}</span></div><p className="mt-2 text-sm text-slate-700">{item.action === "resolve_ticket" ? "Ticket marked resolved" : item.action === "assign_ticket" ? "Ticket assigned to the support team" : "Support activity recorded"}</p>{item.metadata && Object.keys(item.metadata).length > 0 && <p className="mt-1 break-words text-xs text-slate-500">{Object.entries(item.metadata).map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`).join(" · ")}</p>}</div><time className="shrink-0 text-xs text-slate-500">{item.timestamp && item.timestamp !== "None" ? item.timestamp : "Time unavailable"}</time></article>)}
        </div>
      ) : <div className="px-6 py-14 text-center"><History className="mx-auto text-slate-300" size={32} /><h3 className="mt-3 font-semibold text-slate-800">No support activity yet</h3><p className="mt-1 text-sm text-slate-500">Assignment and resolution events will appear here when they are recorded.</p></div>)}
      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="text-sm text-slate-500">{pagination.total || 0} recorded events · Page {pagination.page || page} of {Math.max(pagination.pages || 1, 1)}</p><div className="flex gap-2"><Button variant="outline" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={loading || page <= 1}><ChevronLeft size={16} /> Previous</Button><Button variant="outline" onClick={() => setPage((current) => Math.min(current + 1, pagination.pages || 1))} disabled={loading || page >= (pagination.pages || 1)}>Next <ChevronRight size={16} /></Button></div></div>
    </section>
  );
}
