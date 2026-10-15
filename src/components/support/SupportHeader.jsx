"use client";

import React from "react";
import { Menu, LogOut, ShieldCheck } from "lucide-react";

export default function SupportHeader({ user, sidebarOpen, setSidebarOpen, logout }) {
  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setSidebarOpen?.(!sidebarOpen)}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 md:hidden"
          aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
        >
          <Menu size={19} />
        </button>
        <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 sm:flex">
          <ShieldCheck size={20} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">Support operations</p>
          <p className="hidden text-xs text-slate-500 sm:block">RevelaCode platform assistance</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="max-w-48 truncate text-sm font-semibold text-slate-800">{user?.fullName || user?.full_name || "Support agent"}</p>
          <p className="text-xs capitalize text-slate-500">{user?.role || "support"} account</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          <LogOut size={17} aria-hidden="true" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
