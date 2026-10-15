"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button.jsx";
import { useAuth } from "@/context/AuthContext.jsx";
import { readSupportResponse, supportApiUrl, supportAuthHeaders } from "./supportApi.js";

export default function SupportResolveModal({ open, ticket, onClose, onResolved }) {
  const { getAccessToken, getTokenType } = useAuth();
  const [resolution, setResolution] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open || !ticket) return null;

  async function handleResolve(event) {
    event?.preventDefault?.();
    if (loading) return;
    if (!resolution.trim()) {
      setError("Enter a resolution before closing this ticket.");
      return;
    }
    if (!ticket.id && !ticket._id) {
      setError("This ticket has no valid identifier. Refresh the ticket queue and try again.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const headers = await supportAuthHeaders(getAccessToken, getTokenType, { "Content-Type": "application/json" });
      const response = await fetch(supportApiUrl("/api/support/resolve"), {
        method: "POST",
        headers,
        body: JSON.stringify({ ticket_id: ticket.id || ticket._id, resolution: resolution.trim() }),
      });
      const data = await readSupportResponse(response, "Failed to resolve the ticket.");
      setResolution("");
      onResolved?.(data.ticket);
      onClose?.();
    } catch (err) {
      console.error("Ticket resolution failed:", err);
      setError(err?.message || "Unable to resolve ticket.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    setResolution("");
    setError("");
    onClose?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) handleClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="resolve-ticket-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div><h2 id="resolve-ticket-title" className="text-xl font-bold text-slate-900">Resolve ticket</h2><p className="mt-1 break-words text-sm text-slate-500">{ticket.subject || "Untitled request"}</p></div>
          <button type="button" onClick={handleClose} disabled={loading} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-50" aria-label="Close resolve dialog"><X size={19} /></button>
        </div>
        <form onSubmit={handleResolve} className="space-y-4 p-5 sm:p-6">
          <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-800">Resolution notes <span className="text-red-600">*</span></span><textarea autoFocus rows={6} required maxLength={10000} value={resolution} onChange={(event) => setResolution(event.target.value)} placeholder="Explain the action taken and how the issue was resolved…" className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 disabled:bg-slate-50" disabled={loading} /></label>
          {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={18} className="mt-0.5 shrink-0" />{error}</div>}
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button><Button type="submit" disabled={loading || !resolution.trim()} className="inline-flex items-center justify-center gap-2">{loading ? <><Loader2 size={17} className="animate-spin" /> Saving resolution…</> : <><CheckCircle2 size={17} /> Save resolution</>}</Button></div>
        </form>
      </section>
    </div>
  );
}
