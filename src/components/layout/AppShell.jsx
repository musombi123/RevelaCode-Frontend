// src/components/layout/AppShell.jsx
import React from "react";

export default function AppShell({ topbar, sidebar, rightbar, children }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Topbar */}
      <header className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-white dark:bg-gray-800 shadow-sm z-20">
        {topbar}
      </header>

      {/* Body */}
      <div className="flex flex-1">
        {/* Sidebar */}
        {sidebar && (
          <aside className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto hidden md:block">
            {sidebar}
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>

        {/* Rightbar (optional) */}
        {rightbar && (
          <aside className="w-80 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 hidden lg:block">
            {rightbar}
          </aside>
        )}
      </div>
    </div>
  );
}
