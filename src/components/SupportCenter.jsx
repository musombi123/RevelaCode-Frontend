"use client"; // if using Next.js app router
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mail, Bug, BookOpen, Clipboard } from "lucide-react";

const SupportCenter = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("support@revelacode.com");
  };

  // Fetch support tickets from backend
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch("https://revelacode-backend.onrender.com/support/tickets", {
          headers: {
            "X-API-KEY": "RevelaCodeSupport#2026!" // support key
          }
        });
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

  return (
    <Card className="max-w-lg mx-auto my-8 rounded-2xl shadow-sm">
      <CardContent className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">RevelaCode Support Center</h2>
        <p className="text-gray-500 text-sm">
          Need help? Contact us or explore our resources below.
        </p>

        <div className="flex items-center justify-between p-2 rounded-md border">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm">support@revelacode.com</span>
          </div>
          <Button size="icon" variant="ghost" onClick={handleCopyEmail} title="Copy email">
            <Clipboard className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a href="/bug-report" className="flex items-center gap-2 text-blue-600 hover:underline">
            <Bug className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm">Report a bug</span>
          </a>
          <a href="/docs" className="flex items-center gap-2 text-blue-600 hover:underline">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm">Docs & FAQ</span>
          </a>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Recent Tickets</h3>
          {loading ? (
            <p className="text-gray-400 text-xs">Loading tickets...</p>
          ) : tickets.length === 0 ? (
            <p className="text-gray-400 text-xs">No tickets yet.</p>
          ) : (
            <ul className="text-xs space-y-1">
              {tickets.map((ticket) => (
                <li key={ticket._id} className="border p-1 rounded">
                  <strong>{ticket.title || "Untitled Ticket"}</strong> - {ticket.status}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="text-xs text-gray-400 mt-2">
          RevelaCode v1.0.0 &bull; Updated July 2025
        </div>
      </CardContent>
    </Card>
  );
};

export default SupportCenter;
