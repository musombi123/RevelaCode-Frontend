"use client";
import React from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AdminHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <h1 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
        Welcome, {user?.fullName || "Admin"} 🛡
      </h1>

      <button
        onClick={logout}
        className="flex items-center gap-2 text-red-500 hover:text-red-600 font-semibold"
      >
        <LogOut size={18} /> Logout
      </button>
    </header>
  );
}
