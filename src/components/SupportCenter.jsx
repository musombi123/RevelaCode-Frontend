"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mail, Bug, AlertTriangle, CheckCircle, Clock, Clipboard } from "lucide-react";

const SupportDashboard = ({ user }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // BLOCK NON-SUPPORT USERS
  if (!user || user.role !== "support") {
    return (
      <div className="p-6 text-red-600 font-medium">
        🚫 Access Denied — Support members only.
      </div>
    );
  }

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("support@revelacode.com");
  };

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch(
          "https://revelacode-backend.onrender.com/support/tickets",
          {
            headers: {
              "X-API-KEY": "RevelaCodeSupport#2026!"
            }
          }
        );
        const data = await res.json();
        setTickets(data.tickets || []);
      } catch (err) {
        console.error("Failed to fetch tickets", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  // Split tickets into lanes (Kanban style)
  const openTickets = tickets.filter(t => t.status === "open");
  const inProgress = tickets.filter(t => t.status === "in_progress");
  const resolved = tickets.filter(t => t.status === "resolved");

  return (
    <div className="max-w-6xl mx-auto my-8 space-y-6">
      {/* HEADER */}
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">🔧 RevelaCode Support Command Center</h1>
          <p className="text-sm text-gray-500">
            Logged in as: <strong>{user.full_name}</strong> • Role: <strong>SUPPORT</strong>
          </p>
        </CardHeader>
      </Card>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-semibold">Open Tickets</p>
              <p className="text-xl font-bold">{openTickets.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm font-semibold">In Progress</p>
              <p className="text-xl font-bold">{inProgress.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-semibold">Resolved</p>
              <p className="text-xl font-bold">{resolved.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-semibold">Support Email</p>
              <Button variant="ghost" onClick={handleCopyEmail}>
                Copy Email <Clipboard className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KANBAN TICKET BOARD */}
      <div className="grid grid-cols-3 gap-4">
        <TicketColumn title="🟥 Open" tickets={openTickets} loading={loading} />
        <TicketColumn title="🟨 In Progress" tickets={inProgress} loading={loading} />
        <TicketColumn title="🟩 Resolved" tickets={resolved} loading={loading} />
      </div>
    </div>
  );
};

const TicketColumn = ({ title, tickets, loading }) => {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">{title}</h3>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <p className="text-xs text-gray-400">Loading...</p>
        ) : tickets.length === 0 ? (
          <p className="text-xs text-gray-400">No tickets here.</p>
        ) : (
          tickets.map(ticket => (
            <div key={ticket._id} className="border p-2 rounded-md text-xs">
              <p className="font-semibold">{ticket.title || "Untitled"}</p>
              <p className="text-gray-500">Priority: {ticket.priority || "normal"}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default SupportDashboard;
