"use client";
import React from "react";
import { LogOut, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function AdminHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="flex min-h-14 items-center justify-between gap-3 border-b border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
      <h1 className="min-w-0 truncate text-base font-bold text-gray-900 dark:text-gray-100 sm:text-lg">
        Welcome, {user?.fullName || "Admin"} 🛡
      </h1>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          to="/"
          aria-label="Return to RevelaCode public website"
          title="Return to RevelaCode public website"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-800 transition hover:border-indigo-300 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
        >
          <Home size={17} aria-hidden="true" />
          <span>RevelaCode public</span>
        </Link>
        <button
          type="button"
          onClick={logout}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 sm:px-3"
        >
          <LogOut size={18} aria-hidden="true" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
