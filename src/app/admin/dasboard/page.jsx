"use client";
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext.jsx";
import AdminDashboard from "@/components/admin/AdminDashboard.jsx";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/admin/login"); // protect the dashboard
    }
  }, [user, router]);

  if (!user || user.role !== "admin") return null; // or a spinner

  return <AdminDashboard />;
}
