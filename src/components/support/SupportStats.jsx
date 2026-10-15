"use client";

import React from "react";
import { Ticket, Clock3, CheckCircle2, UserCheck, AlertCircle, FolderOpen } from "lucide-react";

const cards = [
  { key: "total", label: "Total tickets", icon: FolderOpen, tone: "bg-slate-100 text-slate-700" },
  { key: "open", label: "Open tickets", icon: AlertCircle, tone: "bg-red-50 text-red-700" },
  { key: "pending", label: "Pending", icon: Clock3, tone: "bg-amber-50 text-amber-800" },
  { key: "resolved", label: "Resolved", icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
  { key: "assigned_to_me", label: "Assigned to team", icon: UserCheck, tone: "bg-blue-50 text-blue-700" },
  { key: "unassigned", label: "Unassigned", icon: Ticket, tone: "bg-violet-50 text-violet-700" },
];

export default function SupportStats({ stats = {} }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(({ key, label, icon: Icon, tone }) => (
        <article key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0"><p className="text-sm font-medium text-slate-600">{label}</p><p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-slate-950">{stats[key] ?? 0}</p></div>
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={21} aria-hidden="true" /></span>
          </div>
        </article>
      ))}
    </div>
  );
}
