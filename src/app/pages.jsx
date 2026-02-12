"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext.jsx";
import AdminLogin from "@/components/admin/AdminLogin.jsx";
import SupportLogin from "@/components/support/SupportLogin.jsx";
import AdminDashboard from "@/components/admin/AdminDashboard.jsx";
import SupportDashboard from "@/components/support/SupportDashboard.jsx";

export default function PagesLoader() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6">Booting secure session…</div>;

  // NO USER → ASK WHO YOU ARE
  if (!user) {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-bold">Choose Login</h2>
        <AdminLogin />
        <SupportLogin />
      </div>
    );
  }

  // ADMIN FLOW
  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  // SUPPORT FLOW (ONLY IF ADMIN APPROVED)
  if (user.role === "support") {
    return <SupportDashboard />;
  }

  return (
    <div className="p-6 text-red-500">
      Access denied. Await admin approval.
    </div>
  );
}
