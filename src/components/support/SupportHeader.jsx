"use client";

import React from "react";
import { Menu, LogOut, ShieldCheck, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function SupportHeader({ user, sidebarOpen, setSidebarOpen, logout }) {
  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:gap-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
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

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          to="/"
          aria-label="Return to RevelaCode public website"
          title="Return to RevelaCode public website"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs font-bold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 sm:gap-2 sm:px-3 sm:text-sm"
        >
          <Home size={16} aria-hidden="true" />
          <span>RevelaCode public</span>
        </Link>
        <div className="hidden text-right sm:block">
          <p className="max-w-48 truncate text-sm font-semibold text-slate-800">{user?.fullName || user?.full_name || "Support agent"}</p>
          <p className="text-xs capitalize text-slate-500">{user?.role || "support"} account</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 sm:px-3"
        >
          <LogOut size={17} aria-hidden="true" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
