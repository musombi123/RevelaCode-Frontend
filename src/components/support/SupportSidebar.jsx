"use client";

import React from "react";
import {
  LayoutDashboard,
  Ticket,
  History,
  BarChart3,
  X,
  Headphones,
  Users,
  BookOpen,
  ShieldCheck,
  BookOpenCheck,
} from "lucide-react";

const views = [
  { key: "dashboard", label: "Overview", icon: LayoutDashboard },
  { key: "tickets", label: "Support tickets", icon: Ticket },
  { key: "history", label: "Team history", icon: History },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
];

export default function SupportSidebar({
  activeView,
  setActiveView,
  sidebarOpen = false,
  setSidebarOpen,
  role = "support",
}) {
  const supportAdmin = String(role || "").toLowerCase() === "support_admin";
  const navigation = supportAdmin ? [
    ...views,
    { key: "team", label: "Team operations", icon: Users },
    { key: "study", label: "Study Hub management", icon: BookOpen },
    { key: "policies", label: "Policies and terms", icon: ShieldCheck },
    { key: "handbook", label: "System handbook", icon: BookOpenCheck },
  ] : views;

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close support navigation"
          onClick={() => setSidebarOpen?.(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 md:hidden"
        />
      )}

      <aside
        aria-label="Support workspace navigation"
        className={`${sidebarOpen ? "flex" : "hidden md:flex"} fixed inset-y-0 left-0 z-40 w-64 shrink-0 flex-col border-r border-slate-200 bg-white text-slate-800 shadow-xl md:sticky md:top-0 md:h-screen md:shadow-none`}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Headphones size={22} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">RevelaCode</p>
            <h1 className="truncate text-base font-bold text-slate-900">{supportAdmin ? "Support Admin workspace" : "Support workspace"}</h1>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen?.(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 md:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Workspace</p>
          {navigation.map(({ key, label, icon: Icon }) => {
            const active = activeView === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveView(key);
                  setSidebarOpen?.(false);
                }}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-600 ${active ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <Icon size={19} aria-hidden="true" />
                <span>{label}</span>
                {active && <span className="ml-auto h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <p className="text-xs leading-5 text-slate-500">{supportAdmin ? "Supervise ticket operations and support staff. Study/policy tools are delegated; user sanctions and financial operations remain with RevelaCode Admin." : "Use the ticket queue to review, assign, and resolve requests from RevelaCode users."}</p>
        </div>
      </aside>
    </>
  );
}
