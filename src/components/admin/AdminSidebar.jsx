"use client";
import React from "react";

export default function AdminSidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { key: "team", label: "Support Team" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <aside className="w-60 bg-gray-900 dark:bg-gray-950 text-gray-100 flex flex-col">
      <div className="p-6 font-bold text-xl border-b border-gray-700">Admin Panel</div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`w-full text-left px-4 py-2 rounded-lg font-semibold transition
              ${activeTab === tab.key ? "bg-indigo-600 text-white" : "hover:bg-gray-800"}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
