"use client";

// Keep legacy imports working, but use the supported role-aware login flow.
// AdminLogin authenticates against /api/login, stores the backend-issued JWT,
// and directs support accounts to /support/dashboard.
import React from "react";
import AdminLogin from "@/components/admin/AdminLogin.jsx";

export default function SupportLogin() {
  return <AdminLogin />;
}
