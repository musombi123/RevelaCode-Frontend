"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/Dialog.jsx";
import { Button } from "./ui/Button.jsx";
import { Mail, Bug, Clipboard, Check } from "lucide-react";

const HelpModal = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTicket, setNewTicket] = useState({ title: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const API_KEY = "RevelaCodeSupport#2026!";
  const BACKEND = "https://revelacode-backend.onrender.com";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("support@revelacode.com");
    setMessage("Copied email to clipboard!");
    setTimeout(() => setMessage(""), 2000);
  };

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND}/support/tickets`, {
        headers: { "X-API-KEY": API_KEY },
      });
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      setMessage("Error loading tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Submit new ticket
  const submitTicket = async () => {
    if (!newTicket.title || !newTicket.description) {
      setMessage("Please fill all fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND}/support/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": API_KEY,
        },
        body: JSON.stringify(newTicket),
      });
      if (res.ok) {
        setMessage("Ticket submitted successfully!");
        setNewTicket({ title: "", description: "" });
        fetchTickets();
      } else {
        setMessage("Failed to submit ticket.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error submitting ticket.");
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // Resolve a ticket
  const resolveTicket = async (id) => {
    try {
      const res = await fetch(`${BACKEND}/support/resolve-ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": API_KEY,
        },
        body: JSON.stringify({ ticket_id: id, resolution: "Resolved via modal" }),
      });
      if (res.ok) {
        setMessage("Ticket resolved!");
        fetchTickets();
      } else {
        setMessage("Failed to resolve ticket.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error resolving ticket.");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 rounded-2xl shadow-sm hover:shadow-md">
          <Mail className="w-4 h-4" aria-hidden="true" />
          Contact Support
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Help & Support</DialogTitle>
          <DialogDescription>
            We’re here to help. View tickets, submit a bug, or resolve issues.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Copy Email */}
          <div className="flex items-center justify-between p-2 rounded-md border">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">support@revelacode.com</span>
            </div>
            <Button size="icon" variant="ghost" onClick={handleCopyEmail} title="Copy email">
              <Clipboard className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Submit new ticket */}
          <div className="border p-3 rounded-md space-y-2">
            <h3 className="text-sm font-medium">Submit a Bug / Issue</h3>
            <input
              type="text"
              placeholder="Title"
              value={newTicket.title}
              onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <textarea
              placeholder="Description"
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <Button onClick={submitTicket} disabled={submitting} className="w-full">
              {submitting ? "Submitting..." : "Submit Ticket"}
            </Button>
          </div>

          {/* Recent Tickets */}
          <div>
            <h3 className="text-sm font-medium">Recent Tickets</h3>
            {loading ? (
              <p className="text-xs text-gray-400">Loading tickets...</p>
            ) : tickets.length === 0 ? (
              <p className="text-xs text-gray-400">No tickets found.</p>
            ) : (
              <ul className="text-xs space-y-1">
                {tickets.map((ticket) => (
                  <li key={ticket._id} className="border p-1 rounded flex justify-between items-center">
                    <div>
                      <strong>{ticket.title || "Untitled"}</strong> - {ticket.status}
                    </div>
                    {ticket.status !== "resolved" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => resolveTicket(ticket._id)}
                        title="Resolve ticket"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {message && <p className="text-xs text-green-500">{message}</p>}

          <div className="text-xs text-gray-500 mt-2">RevelaCode v1.0.0</div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpModal;
