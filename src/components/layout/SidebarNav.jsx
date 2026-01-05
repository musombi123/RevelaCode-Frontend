// src/components/layout/SidebarNav.jsx
import React from "react";

export default function SidebarNav({ menuItems, activeView, onNavigate }) {
  return (
    <nav className="p-4 space-y-1">
      {menuItems.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onNavigate(key)}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition ${
            activeView === key
              ? "bg-indigo-600 text-white"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </nav>
  );
}
