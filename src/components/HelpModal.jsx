"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "./ui/Dialog.jsx";
import { Button } from "./ui/Button.jsx";
import { Mail, Clipboard } from "lucide-react";

export default function HelpModal() {
  const [newTicket, setNewTicket] = useState({ title: "", description: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const BACKEND = import.meta.env.VITE_API_URL || "https://revelacode-backend.onrender.com/api";

  // Copy support email
  const handleCopyEmail = () => {
    navigator.clipboard.writeText("support@revelacode.com");
    setMessage("Copied support email!");
    setTimeout(() => setMessage(""), 2000);
  };

  // Submit new ticket
  const submitTicket = async () => {
    if (!newTicket.title || !newTicket.description) {
      setMessage("⚠ Please fill all fields.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch(`${BACKEND}/public/support/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTicket.title,
          description: newTicket.description,
          user: "Public User",
          email: newTicket.email || "revelacodepro@gmail.com" // user email or default
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to submit ticket");

      setMessage("✅ Ticket submitted successfully!");
      setNewTicket({ title: "", description: "", email: "" });
    } catch (err) {
      console.error(err);
      setMessage("❌ Error submitting ticket.");
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 rounded-2xl shadow-sm hover:shadow-md">
          <Mail className="w-4 h-4" />
          Contact Support
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Help & Support</DialogTitle>
          <DialogDescription>
            Submit bugs or issues directly to the RevelaCode support team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Copy Email */}
          <div className="flex items-center justify-between p-2 rounded-md border">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="text-sm">support@revelacode.com</span>
            </div>
            <Button size="icon" variant="ghost" onClick={handleCopyEmail} title="Copy email">
              <Clipboard className="w-4 h-4" />
            </Button>
          </div>

          {/* Submit Ticket */}
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
            <input
              type="email"
              placeholder="Your Email (optional)"
              value={newTicket.email}
              onChange={(e) => setNewTicket({ ...newTicket, email: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <Button onClick={submitTicket} disabled={submitting} className="w-full">
              {submitting ? "Submitting..." : "Submit Ticket"}
            </Button>
          </div>

          {message && <p className="text-xs text-green-500">{message}</p>}

          <div className="text-xs text-gray-500 mt-2">RevelaCode v1.0.0</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
