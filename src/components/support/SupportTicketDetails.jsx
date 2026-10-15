"use client";

import React, { useCallback, useEffect, useState } from "react";
import { X, Loader2, User, Mail, CalendarDays, Tag, CheckCircle2, Clock3, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button.jsx";
import { useAuth } from "@/context/AuthContext.jsx";
import { readSupportResponse, supportApiUrl, supportAuthHeaders } from "./supportApi.js";

export default function SupportTicketDetails({ ticketId, open, onClose, onResolve }) {
  const { getAccessToken, getTokenType } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadTicket = useCallback(async () => {
    if (!open || !ticketId) return;
    try {
      setLoading(true);
      setError("");
      const headers = await supportAuthHeaders(getAccessToken, getTokenType, { "Content-Type": "application/json" });
      const response = await fetch(supportApiUrl(`/api/support/ticket/${encodeURIComponent(ticketId)}`), { method: "GET", headers });
      const data = await readSupportResponse(response, "Failed to load ticket details.");
      setTicket(data.ticket || null);
    } catch (err) {
      console.error("Support ticket detail load failed:", err);
      setError(err?.message || "Unable to load ticket details.");
    } finally {
      setLoading(false);
    }
  }, [open, ticketId, getAccessToken, getTokenType]);

  useEffect(() => { loadTicket(); }, [loadTicket]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event) { if (event.key === "Escape") onClose?.(); }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/40 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <aside role="dialog" aria-modal="true" aria-labelledby="ticket-detail-title" className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 p-5 backdrop-blur sm:p-6"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Support request</p><h2 id="ticket-detail-title" className="mt-1 text-xl font-bold text-slate-900">Ticket details</h2></div><button type="button" onClick={onClose} aria-label="Close ticket details" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"><X size={20} /></button></div>
        {loading ? <div className="flex justify-center py-24"><Loader2 className="animate-spin text-emerald-700" size={32} /></div> : error ? <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:m-6"><div className="flex items-start gap-2"><AlertCircle size={18} className="mt-0.5 shrink-0" />{error}</div><Button variant="outline" onClick={loadTicket} className="mt-4"><RefreshCw size={16} /> Retry</Button></div> : ticket && (
          <div className="space-y-6 p-5 sm:p-6">
            <section><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${ticket.status === "resolved" ? "bg-emerald-50 text-emerald-700" : ticket.status === "pending" ? "bg-amber-50 text-amber-800" : "bg-blue-50 text-blue-700"}`}>{ticket.status || "open"}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">Priority: {ticket.priority || "normal"}</span></div><h3 className="mt-4 break-words text-2xl font-bold tracking-tight text-slate-950">{ticket.subject || "Untitled request"}</h3><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{ticket.description || "No description was supplied."}</p></section>
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Info icon={User} label="Submitted by" value={ticket.user} /><Info icon={Mail} label="Follow-up email" value={ticket.email} /><Info icon={Tag} label="Assignment" value={ticket.assigned_to || "Unassigned"} /><Info icon={CalendarDays} label="Created" value={ticket.created_at} /><Info icon={Clock3} label="Last updated" value={ticket.updated_at} /><Info icon={CheckCircle2} label="Resolved at" value={ticket.resolved_at || "Not resolved"} /></section>
            {ticket.resolution && <section><h4 className="mb-2 text-sm font-bold text-slate-900">Recorded resolution</h4><div className="whitespace-pre-wrap rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">{ticket.resolution}</div></section>}
            {ticket.status !== "resolved" && <div className="flex justify-end border-t border-slate-100 pt-4"><Button onClick={() => onResolve?.(ticket)} className="inline-flex items-center gap-2"><CheckCircle2 size={17} /> Resolve ticket</Button></div>}
          </div>
        )}
      </aside>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return <div className="min-w-0 rounded-xl border border-slate-200 p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Icon size={15} aria-hidden="true" />{label}</div><p className="mt-2 break-words text-sm font-semibold text-slate-800">{value && value !== "None" ? value : "—"}</p></div>;
}
