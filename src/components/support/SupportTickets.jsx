"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/Button.jsx";
import { Input } from "@/components/ui/Input.jsx";

import SupportTicketDetails from "./SupportTicketDetails.jsx";
import SupportResolveModal from "./SupportResolveModal.jsx";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedTicket, setSelectedTicket] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);

  async function loadTickets(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const res = await fetch(`${API}/api/support/tickets`);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load tickets.");
      }

      setTickets(data.tickets || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    let results = [...tickets];

    if (statusFilter !== "all") {
      results = results.filter(
        (ticket) =>
          (ticket.status || "").toLowerCase() ===
          statusFilter.toLowerCase()
      );
    }

    if (search.trim()) {
      const keyword = search.toLowerCase();

      results = results.filter((ticket) => {
        return (
          (ticket.subject || "")
            .toLowerCase()
            .includes(keyword) ||
          (ticket.user || "")
            .toLowerCase()
            .includes(keyword)
        );
      });
    }

    setFilteredTickets(results);
  }, [tickets, search, statusFilter]);

  const counts = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      pending: tickets.filter((t) => t.status === "pending").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
    };
  }, [tickets]);

  function openDetails(ticket) {
    setSelectedTicket(ticket);
    setDetailsOpen(true);
  }

  function openResolve(ticket) {
    setSelectedTicket(ticket);
    setResolveOpen(true);
  }

  function handleResolved(updatedTicket) {
    setResolveOpen(false);
    setDetailsOpen(false);

    loadTickets(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        Loading support tickets...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-5 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          <div className="rounded-xl border p-4">
            <p className="text-sm text-gray-500">Total</p>
            <h2 className="text-2xl font-bold mt-2">
              {counts.total}
            </h2>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-gray-500">Open</p>
            <h2 className="text-2xl font-bold text-red-500 mt-2">
              {counts.open}
            </h2>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <h2 className="text-2xl font-bold text-yellow-500 mt-2">
              {counts.pending}
            </h2>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-gray-500">Resolved</p>
            <h2 className="text-2xl font-bold text-green-500 mt-2">
              {counts.resolved}
            </h2>
          </div>

        </div>

        <div className="rounded-xl border bg-white dark:bg-gray-900">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 border-b">

            <div className="relative w-full lg:max-w-md">

              <Search
                size={18}
                className="absolute left-3 top-3 text-gray-400"
              />

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by subject or user..."
                className="pl-10"
              />

            </div>

            <div className="flex gap-3">

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="rounded-lg border px-3 py-2"
              >
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>

              <Button
                onClick={() => loadTickets(true)}
                disabled={refreshing}
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />

                Refresh
              </Button>

            </div>

          </div>
                    <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="bg-gray-50 dark:bg-gray-800">

                <tr>

                  <th className="px-5 py-3 text-left text-sm font-semibold">
                    Subject
                  </th>

                  <th className="px-5 py-3 text-left text-sm font-semibold">
                    User
                  </th>

                  <th className="px-5 py-3 text-left text-sm font-semibold">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left text-sm font-semibold">
                    Created
                  </th>

                  <th className="px-5 py-3 text-right text-sm font-semibold">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredTickets.length === 0 ? (

                  <tr>

                    <td
                      colSpan={5}
                      className="py-12 text-center text-gray-500"
                    >
                      No support tickets found.
                    </td>

                  </tr>

                ) : (

                  filteredTickets.map((ticket) => (

                    <tr
                      key={ticket.id}
                      className="border-t hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >

                      <td className="px-5 py-4">

                        <div className="font-medium">
                          {ticket.subject}
                        </div>

                      </td>

                      <td className="px-5 py-4">

                        {ticket.user}

                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold
                          ${
                            ticket.status === "resolved"
                              ? "bg-green-100 text-green-700"
                              : ticket.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {ticket.status}
                        </span>

                      </td>

                      <td className="px-5 py-4 text-sm text-gray-500">

                        {ticket.created_at}

                      </td>

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-2">

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetails(ticket)}
                          >
                            <Eye size={16} />

                            View
                          </Button>

                          {ticket.status !== "resolved" && (

                            <Button
                              size="sm"
                              onClick={() => openResolve(ticket)}
                            >
                              <CheckCircle2 size={16} />

                              Resolve
                            </Button>

                          )}

                        </div>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      <SupportTicketDetails
        open={detailsOpen}
        ticketId={selectedTicket?.id}
        onClose={() => setDetailsOpen(false)}
        onResolve={(ticket) => {
          setDetailsOpen(false);
          openResolve(ticket);
        }}
      />

      <SupportResolveModal
        open={resolveOpen}
        ticket={selectedTicket}
        onClose={() => setResolveOpen(false)}
        onResolved={handleResolved}
      />

    </>
  );
}