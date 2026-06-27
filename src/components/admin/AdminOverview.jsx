"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";

const API = import.meta.env.VITE_API_URL;

// Built-in Admin Key
const ADMIN_API_KEY = "bbit070j2003@RC#2026!";

export default function AdminOverview() {

  const [dashboard, setDashboard] = useState({
    message: "",
  });

  const [stats, setStats] = useState({
    total_materials: 0,
    faith_materials: 0,
    education_materials: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {

    setLoading(true);

    try {

      const headers = {
        "X-API-KEY": ADMIN_API_KEY,
      };

      const [dashboardRes, statsRes] = await Promise.all([
        fetch(`${API}/api/admin/dashboard`, { headers }),
        fetch(`${API}/api/admin/study/stats`, { headers }),
      ]);

      const dashboardData = await dashboardRes.json();
      const statsData = await statsRes.json();

      if (dashboardRes.ok) {
        setDashboard(dashboardData);
      }

      if (statsRes.ok) {
        setStats(statsData);
      }

    } catch (err) {

      console.error("Dashboard error:", err);

    } finally {

      setLoading(false);

    }

  }

  if (loading) {

    return (
      <div className="p-6">
        Loading dashboard...
      </div>
    );

  }

  return (

    <div className="space-y-6">

      <h2 className="text-2xl font-bold">
        Dashboard Overview
      </h2>

      <div className="grid gap-5 md:grid-cols-4">

        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">
              Total Materials
            </p>

            <h2 className="text-4xl font-bold mt-2">
              {stats.total_materials}
            </h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">
              Faith Materials
            </p>

            <h2 className="text-4xl font-bold mt-2">
              {stats.faith_materials}
            </h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">
              Education Materials
            </p>

            <h2 className="text-4xl font-bold mt-2">
              {stats.education_materials}
            </h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">
              System Status
            </p>

            <h2 className="text-2xl font-bold text-green-600 mt-2">
              Online
            </h2>
          </CardContent>
        </Card>

      </div>

      <Card>

        <CardContent className="p-6">

          <h3 className="text-lg font-bold mb-3">
            Admin Message
          </h3>

          <p>
            {dashboard.message || "Welcome to RevelaCode Admin Panel."}
          </p>

        </CardContent>

      </Card>

    </div>

  );

}