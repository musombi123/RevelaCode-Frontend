"use client";

import React, { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/Dialog.jsx";
import { Button } from "./ui/Button.jsx";
import { Mail, Clipboard, Send, CircleCheck, AlertCircle } from "lucide-react";
import { readSupportResponse, supportApiUrl } from "@/components/support/supportApi.js";

export default function HelpModal() {
  const [newTicket, setNewTicket] = useState({ title: "", description: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText("support@revelacode.com");
      setMessageType("success");
      setMessage("Support email copied.");
    } catch {
      setMessageType("error");
      setMessage("Copying is unavailable in this browser. Email support@revelacode.com.");
    }
  }

  async function submitTicket(event) {
    event?.preventDefault?.();
    if (submitting) return;
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      setMessageType("error");
      setMessage("Please enter a subject and describe the issue.");
      return;
    }
    if (newTicket.title.trim().length > 200 || newTicket.description.trim().length > 10000) {
      setMessageType("error");
      setMessage("Keep the subject under 200 characters and description under 10,000 characters.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(supportApiUrl("/api/support/public/tickets"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          title: newTicket.title.trim(),
          subject: newTicket.title.trim(),
          description: newTicket.description.trim(),
          user: "Public User",
          email: newTicket.email.trim(),
        }),
      });
      const data = await readSupportResponse(response, "Failed to submit your support request.");
      setMessageType("success");
      setMessage(data.message || "Your support request has been submitted.");
      setNewTicket({ title: "", description: "", email: "" });
    } catch (error) {
      console.error("Support ticket submission failed:", error);
      setMessageType("error");
      setMessage(error?.message || "Unable to submit your support request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 rounded-xl"><Mail className="h-4 w-4" aria-hidden="true" /> Contact Support</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Help &amp; Support</DialogTitle>
          <DialogDescription>Tell the RevelaCode support team what went wrong. Your request will be added to the support queue.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
            <div className="flex min-w-0 items-center gap-2 text-sm text-slate-700"><Mail className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" /><span className="truncate">support@revelacode.com</span></div>
            <Button type="button" size="icon" variant="ghost" onClick={handleCopyEmail} title="Copy support email" aria-label="Copy support email"><Clipboard className="h-4 w-4" /></Button>
          </div>

          <form onSubmit={submitTicket} className="space-y-4">
            <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-800">Subject <span className="text-red-600">*</span></span><input required maxLength={200} value={newTicket.title} onChange={(event) => setNewTicket((current) => ({ ...current, title: event.target.value }))} placeholder="Briefly describe the problem" className="min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15" /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-800">Description <span className="text-red-600">*</span></span><textarea required maxLength={10000} rows={5} value={newTicket.description} onChange={(event) => setNewTicket((current) => ({ ...current, description: event.target.value }))} placeholder="Include what you were doing and what happened" className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15" /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-800">Email for follow-up <span className="font-normal text-slate-500">(optional)</span></span><input type="email" maxLength={254} value={newTicket.email} onChange={(event) => setNewTicket((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" className="min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15" /></label>
            <Button type="submit" disabled={submitting} className="flex min-h-11 w-full items-center justify-center gap-2"><Send className="h-4 w-4" aria-hidden="true" />{submitting ? "Submitting request…" : "Submit support request"}</Button>
          </form>

          {message && <div role={messageType === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${messageType === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{messageType === "error" ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CircleCheck size={18} className="mt-0.5 shrink-0" />}<span>{message}</span></div>}
          <p className="text-xs leading-5 text-slate-500">Do not include passwords, API keys, or other sensitive credentials in a support request.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
