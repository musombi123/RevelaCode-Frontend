"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext.jsx";
import AdminDashboard from "@/components/admin/AdminDashboard.jsx";
import SupportDashboard from "@/components/support/SupportDashboard.jsx";

export default function PagesLoader() {
  const { user, loading } = useAuth(); // make sure AuthContext exposes loading

  if (loading) return <div className="p-6">Loading...</div>;

  if (!user) return <div className="p-6">Please log in to access pages.</div>;

  switch (user.role) {
    case "admin":
      return <AdminDashboard />;
    case "support":
      return <SupportDashboard />;
    default:
      return <div className="p-6">Access denied: insufficient permissions.</div>;
  }
}
