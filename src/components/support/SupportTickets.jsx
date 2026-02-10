"use client";
import React, { useEffect, useState } from "react";
import { Select, Button } from "@/components/ui";
import { useAuth } from "@/context/AuthContext.jsx";

const statusOptions = ["Open", "In Progress", "Resolved"];

export default function SupportTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch tickets
  const fetchTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/support/tickets`);
      if (!res.ok) throw new Error("Failed to fetch tickets");
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Update ticket status
  const updateStatus = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/support/tickets/${ticketId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)));
    } catch (err) {
      alert(err.message);
    }
  };

  // Assign ticket to self
  const assignToSelf = async (ticketId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/support/tickets/${ticketId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_to: user.username }),
      });
      if (!res.ok) throw new Error("Failed to assign ticket");
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, assigned_to: user.username } : t)));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p>Loading tickets...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tickets.map((t) => (
        <div key={t.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col gap-2 hover:shadow-md transition">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{t.title}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">User: {t.user}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Assigned to: {t.assigned_to || "Unassigned"}</p>

          <div className="flex flex-col gap-2 mt-2">
            <Select
              value={t.status}
              onChange={(e) => updateStatus(t.id, e.target.value)}
              className="text-sm"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>

            {!t.assigned_to && (
              <Button size="sm" onClick={() => assignToSelf(t.id)}>
                Assign to Me
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
