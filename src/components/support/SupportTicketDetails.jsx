"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Loader2,
  User,
  Mail,
  Calendar,
  Tag,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import { Button } from "@/components/ui/Button.jsx";

const API = import.meta.env.VITE_API_URL;

export default function SupportTicketDetails({
  ticketId,
  open,
  onClose,
  onResolve,
}) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !ticketId) return;

    loadTicket();
  }, [open, ticketId]);

  async function loadTicket() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API}/api/support/ticket/${ticketId}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load ticket.");
      }

      setTicket(data.ticket);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex justify-end">

      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 h-full overflow-y-auto shadow-2xl">

        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-5 flex justify-between items-center">

          <div>

            <h2 className="text-2xl font-bold">
              Ticket Details
            </h2>

            <p className="text-sm text-gray-500">
              View support request
            </p>

          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500"
          >
            <X />
          </button>

        </div>

        {loading && (

          <div className="flex justify-center py-20">

            <Loader2
              className="animate-spin"
              size={36}
            />

          </div>

        )}

        {error && (

          <div className="p-6 text-red-500">
            {error}
          </div>

        )}

        {!loading && ticket && (

          <div className="p-6 space-y-8">

            <section>

              <h3 className="text-2xl font-bold">
                {ticket.subject}
              </h3>

              <p className="mt-3 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {ticket.description}
              </p>

            </section>

            <section className="grid md:grid-cols-2 gap-5">

              <Info
                icon={User}
                label="User"
                value={ticket.user}
              />

              <Info
                icon={Mail}
                label="Email"
                value={ticket.email}
              />

              <Info
                icon={Tag}
                label="Status"
                value={ticket.status}
              />

              <Info
                icon={Clock3}
                label="Priority"
                value={ticket.priority}
              />

              <Info
                icon={Calendar}
                label="Created"
                value={ticket.created_at}
              />

              <Info
                icon={CheckCircle2}
                label="Resolved"
                value={
                  ticket.resolved_at || "Not resolved"
                }
              />

            </section>

            {ticket.resolution && (

              <section>

                <h4 className="font-semibold mb-2">
                  Resolution
                </h4>

                <div className="rounded-xl border border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-800 p-4">

                  {ticket.resolution}

                </div>

              </section>

            )}

            {ticket.status !== "resolved" && (

              <div className="flex justify-end">

                <Button
                  onClick={() => onResolve(ticket)}
                >
                  Resolve Ticket
                </Button>

              </div>

            )}

          </div>

        )}

      </div>

    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">

      <div className="flex items-center gap-2 text-sm text-gray-500">

        <Icon size={16} />

        {label}

      </div>

      <div className="mt-2 font-semibold break-words">

        {value || "-"}

      </div>

    </div>
  );
}