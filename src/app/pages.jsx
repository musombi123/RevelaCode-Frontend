"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext.jsx";
import AdminLogin from "@/components/admin/AdminLogin.jsx";
import SupportLogin from "@/components/support/SupportLogin.jsx";
import AdminDashboard from "@/components/admin/AdminDashboard.jsx";
import SupportDashboard from "@/components/support/SupportDashboard.jsx";

export default function PagesLoader({ initialAdminTab = "overview" }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6">Booting secure session…</div>;

  // NO USER → SHOW ONLY ADMIN LOGIN FIRST
  if (!user) {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-bold">Admin Access Required</h2>
        <AdminLogin />
      </div>
    );
  }

  // Platform owner/administrator roles use the full RevelaCode console.
  const role = String(user.role || "").trim().toLowerCase();
  if (["admin", "platform_admin", "super_admin", "revelacode_admin"].includes(role)) {
    return <AdminDashboard initialTab={initialAdminTab} />;
  }

  // Support roles are limited to the ticket workspace and any specifically
  // delegated Support Administrator sections.
  if (["support", "support_admin"].includes(role)) {
    return <SupportDashboard />;
  }

  return (
    <div className="p-6 text-red-500">
      Access denied. Await admin approval.
    </div>
  );
}
