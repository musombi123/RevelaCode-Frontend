"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Eye, RefreshCw, Search, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/Button.jsx";
import { Input } from "@/components/ui/Input.jsx";
import { useAuth } from "@/context/AuthContext.jsx";
import SupportTicketDetails from "./SupportTicketDetails.jsx";
import SupportResolveModal from "./SupportResolveModal.jsx";
import { readSupportResponse, supportApiUrl, supportAuthHeaders } from "./supportApi.js";

const PAGE_SIZE = 20;

function statusClass(status) {
  if (status === "resolved") return "bg-emerald-50 text-emerald-700";
  if (status === "pending") return "bg-amber-50 text-amber-800";
  if (status === "cancelled") return "bg-slate-100 text-slate-600";
  return "bg-blue-50 text-blue-700";
}

export default function SupportTickets() {
  const { getAccessToken, getTokenType } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [assigningId, setAssigningId] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);

  const loadTickets = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true); else setLoading(true);
      setError("");
      const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (statusFilter !== "all") query.set("status", statusFilter);
      if (appliedSearch) query.set("search", appliedSearch);
      const headers = await supportAuthHeaders(getAccessToken, getTokenType, { "Content-Type": "application/json" });
      const response = await fetch(`${supportApiUrl("/api/support/tickets")}?${query.toString()}`, { method: "GET", headers });
      const data = await readSupportResponse(response, "Failed to load support tickets.");
      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
      setPagination(data.pagination || { page, pages: 1, total: 0, limit: PAGE_SIZE });
    } catch (err) {
      console.error("Support tickets load failed:", err);
      setError(err?.message || "Failed to load support tickets.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAccessToken, getTokenType, page, statusFilter, appliedSearch]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  async function assignToTeam(ticket) {
    if (!ticket?.id || assigningId) return;
    try {
      setAssigningId(ticket.id);
      setActionMessage("");
      const headers = await supportAuthHeaders(getAccessToken, getTokenType, { "Content-Type": "application/json" });
      const response = await fetch(supportApiUrl("/api/support/assign"), {
        method: "POST",
        headers,
        body: JSON.stringify({ ticket_id: ticket.id }),
      });
      const data = await readSupportResponse(response, "Unable to assign this ticket to the support team.");
      setActionMessage(data.message || "Ticket assigned to the support team.");
      await loadTickets(true);
    } catch (err) {
      console.error("Support ticket assignment failed:", err);
      setActionMessage(err?.message || "Unable to assign ticket.");
    } finally {
      setAssigningId("");
    }
  }

  function submitSearch(event) {
    event.preventDefault();
    setPage(1);
    const nextSearch = search.trim();
    if (nextSearch === appliedSearch && page === 1) loadTickets(true);
    else setAppliedSearch(nextSearch);
  }

  function openDetails(ticket) {
    setSelectedTicket(ticket);
    setDetailsOpen(true);
  }

  function openResolve(ticket) {
    setSelectedTicket(ticket);
    setResolveOpen(true);
  }

  async function handleResolved() {
    setResolveOpen(false);
    setDetailsOpen(false);
    setActionMessage("Ticket resolution saved. The queue has been refreshed.");
    await loadTickets(true);
  }

  const hasPrevious = page > 1;
  const hasNext = page < Math.max(pagination.pages || 1, 1);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <form onSubmit={submitSearch} className="flex w-full flex-col gap-2 sm:flex-row xl:max-w-xl">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search tickets</span>
              <Search size={18} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search subject or user…" className="min-h-11 pl-10" />
            </label>
            <Button type="submit" className="min-h-11">Search tickets</Button>
          </form>

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => { setPage(1); setStatusFilter(event.target.value); }} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20">
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
            </label>
            <Button variant="outline" onClick={() => loadTickets(true)} disabled={loading || refreshing} className="min-h-11"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh</Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-600"><span className="font-bold text-slate-900">{pagination.total ?? 0}</span> tickets match the current filters</p>
          <p className="text-xs text-slate-500">Page {pagination.page || page} of {Math.max(pagination.pages || 1, 1)}</p>
        </div>
      </section>

      {actionMessage && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{actionMessage}</div>}
      {error && <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-start gap-2"><AlertCircle size={18} className="mt-0.5 shrink-0" />{error}</span><Button variant="outline" onClick={() => loadTickets(true)} disabled={refreshing}>Retry</Button></div>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="font-bold text-slate-900">Ticket queue</h2><p className="mt-1 text-sm text-slate-500">Open a ticket for full details. Assignment is currently to the shared support team.</p></div>
        {loading ? (
          <div className="space-y-3 p-5 sm:p-6">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : !error && tickets.length === 0 ? (
          <div className="px-6 py-16 text-center"><TicketEmptyIcon /><h3 className="mt-3 font-semibold text-slate-900">No matching tickets</h3><p className="mt-1 text-sm text-slate-500">Try another search or status. New user requests will appear when ticket intake is connected.</p></div>
        ) : !error && (
          <div className="overflow-x-auto">
            <table className="min-w-[780px] w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold sm:px-6">Subject</th><th className="px-5 py-3 font-semibold">User</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Assignment</th><th className="px-5 py-3 font-semibold">Created</th><th className="px-5 py-3 text-right font-semibold sm:px-6">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => {
                  const isAssigned = Boolean(ticket.assigned_to);
                  return (
                    <tr key={ticket.id} className="align-middle hover:bg-slate-50/70">
                      <td className="max-w-64 px-5 py-4 sm:px-6"><p className="truncate text-sm font-semibold text-slate-900">{ticket.subject || "Untitled request"}</p><p className="mt-1 truncate text-xs text-slate-500">ID: {ticket.id}</p></td>
                      <td className="px-5 py-4 text-sm text-slate-700">{ticket.user || "Unknown user"}</td>
                      <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClass(String(ticket.status || "open").toLowerCase())}`}>{ticket.status || "open"}</span></td>
                      <td className="px-5 py-4 text-sm text-slate-600">{isAssigned ? <span className="font-medium text-emerald-700">Support team</span> : <span className="text-slate-400">Unassigned</span>}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{ticket.created_at && ticket.created_at !== "None" ? ticket.created_at : "—"}</td>
                      <td className="px-5 py-4 sm:px-6"><div className="flex justify-end gap-2">
                        {!isAssigned && ticket.status !== "resolved" && <Button size="sm" variant="outline" onClick={() => assignToTeam(ticket)} disabled={Boolean(assigningId)} title="Assign this ticket to the shared support team"><UserRoundPlus size={15} />{assigningId === ticket.id ? "Assigning…" : "Assign"}</Button>}
                        <Button size="sm" variant="outline" onClick={() => openDetails(ticket)}><Eye size={15} /> View</Button>
                        {ticket.status !== "resolved" && <Button size="sm" onClick={() => openResolve(ticket)}><CheckCircle2 size={15} /> Resolve</Button>}
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-slate-500">Showing {tickets.length ? ((page - 1) * PAGE_SIZE + 1) : 0}–{Math.min(page * PAGE_SIZE, pagination.total || 0)} of {pagination.total || 0}</p>
          <div className="flex gap-2"><Button variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={loading || !hasPrevious}><ChevronLeft size={16} /> Previous</Button><Button variant="outline" onClick={() => setPage((current) => current + 1)} disabled={loading || !hasNext}>Next <ChevronRight size={16} /></Button></div>
        </div>
      </section>

      <SupportTicketDetails open={detailsOpen} ticketId={selectedTicket?.id} onClose={() => setDetailsOpen(false)} onResolve={(ticket) => { setDetailsOpen(false); openResolve(ticket); }} />
      <SupportResolveModal open={resolveOpen} ticket={selectedTicket} onClose={() => setResolveOpen(false)} onResolved={handleResolved} />
    </div>
  );
}

function TicketEmptyIcon() {
  return <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><AlertCircle size={24} /></div>;
}
