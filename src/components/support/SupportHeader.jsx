"use client";
import React from "react";
import { Menu, LogOut } from "lucide-react";

export default function SupportHeader({ user, sidebarOpen, setSidebarOpen, logout }) {
  return (
    <header className="flex justify-between items-center p-4 border-b border-gray-300/40 dark:border-gray-700/40">
      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)}>
            <Menu />
          </button>
        )}
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Support Dashboard</h2>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span>Logged in as: {user?.fullName || "Support Agent"}</span>
        <button onClick={logout} className="flex items-center gap-1 text-red-400 hover:text-red-500">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </header>
  );
}
