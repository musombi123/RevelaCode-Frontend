"use client";
import React from "react";
import {
  LayoutDashboard,
  Ticket,
  History,
  BarChart3,
  Settings,
} from "lucide-react";

export default function SupportSidebar({ activeView, setActiveView }) {
  const views = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "tickets", label: "Tickets", icon: Ticket },
    { key: "history", label: "History", icon: History },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
    { key: "settings", label: "Settings", icon: Settings }
  ];

  return (
    <aside className="w-[220px] bg-gray-900 text-gray-100 flex flex-col">
      <div className="p-4 font-bold text-lg">Support Team</div>
      <nav className="px-2 space-y-1 flex-1">
        {views.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveView(key)}
            className={`flex items-center gap-3 p-3 w-full rounded-lg text-sm transition
              ${activeView === key ? "bg-gray-700" : "hover:bg-gray-800"}`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
