"use client";
import React, { useEffect, useState } from "react";

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [team, setTeam] = useState([]);

  // Fetch tickets
  useEffect(() => {
    async function fetchTickets() {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/support-tickets`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch tickets");
        setTickets(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    async function fetchTeam() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/support-team`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch team");
        setTeam(data);
      } catch (err) {
        console.error(err.message);
      }
    }

    fetchTickets();
    fetchTeam();
  }, []);

  const handleAssign = async (ticketId, memberId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/assign-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, memberId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to assign ticket");

      // Update locally
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, assignedTo: data.assignedTo } : t))
      );
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (loading) return <p>Loading tickets… ⏳</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Support Tickets</h2>

      {tickets.length === 0 && <p>No tickets available.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <p className="font-semibold text-gray-900 dark:text-gray-100">{ticket.subject}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{ticket.description}</p>
            <p className="text-xs mt-1">
              Status: <span className="font-medium">{ticket.status}</span>
            </p>
            <p className="text-xs mt-1">
              Assigned to: <span className="font-medium">{ticket.assignedTo || "Unassigned"}</span>
            </p>

            <select
              className="mt-2 w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              value={ticket.assignedTo || ""}
              onChange={(e) => handleAssign(ticket.id, e.target.value)}
            >
              <option value="">Assign to...</option>
              {team.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
