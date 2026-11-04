import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "@/components/admin/AdminDashboard";

const PLATFORM_ADMIN_ROLES = new Set([
  "admin",
  "platform_admin",
  "super_admin",
  "revelacode_admin",
]);

function hasPlatformAdminAccess(user) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (typeof user?.roles === "string") roles.push(user.roles);
  roles.push(user?.role);
  return roles.some((role) => PLATFORM_ADMIN_ROLES.has(String(role || "").trim().toLowerCase()));
}

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const allowed = hasPlatformAdminAccess(user);

  useEffect(() => {
    if (!loading && !allowed) navigate("/");
  }, [loading, allowed, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!allowed) return null;

  return <AdminDashboard />;
}