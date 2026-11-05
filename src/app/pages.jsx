"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext.jsx";
import AdminLogin from "@/components/admin/AdminLogin.jsx";
import SupportLogin from "@/components/support/SupportLogin.jsx";
import AdminDashboard from "@/components/admin/AdminDashboard.jsx";
import SupportDashboard from "@/components/support/SupportDashboard.jsx";
import { hasPlatformAdminRole, hasSupportWorkspaceRole } from "@/auth/workspaceRoles.mjs";

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

  // Resolve roles from both the canonical role and the complete role set.
  // Support Agents are the modern equivalent of the legacy "support" role.
  if (hasPlatformAdminRole(user)) {
    return <AdminDashboard initialTab={initialAdminTab} />;
  }

  if (hasSupportWorkspaceRole(user)) {
    return <SupportDashboard />;
  }

  return (
    <div className="p-6 text-red-500">
      Access denied. Await admin approval.
    </div>
  );
}
