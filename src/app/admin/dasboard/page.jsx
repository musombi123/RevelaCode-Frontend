import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      navigate("/");
    }
  }, [loading, user, navigate]);

  if (loading) return <div>Loading...</div>;

  if (!user || user.role !== "admin") return null;

  return <AdminDashboard />;
}