"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext.jsx";
import Loading from "@/components/common/Loading.jsx";

import SupportSidebar from "./SupportSidebar.jsx";
import SupportHeader from "./SupportHeader.jsx";

import SupportStats from "./SupportStats.jsx";
import SupportTickets from "./SupportTickets.jsx";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function SupportDashboard() {
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || user.role !== "support") {
      window.location.href = "/support/login";
      return;
    }

    loadDashboard();
  }, [user]);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/api/support/dashboard`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load dashboard");
      }

      setStats(data.stats || {});
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function renderView() {
    switch (activeView) {
      case "dashboard":
        return <SupportStats stats={stats} />;

      case "tickets":
        return <SupportTickets />;

      case "settings":
        return (
          <div className="p-6 text-gray-500">
            Settings panel coming soon...
          </div>
        );

      default:
        return <SupportStats stats={stats} />;
    }
  }

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">

      {/* Sidebar */}
      {sidebarOpen && (
        <SupportSidebar
          activeView={activeView}
          setActiveView={setActiveView}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col">

        <SupportHeader
          user={user}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          logout={logout}
        />

        <main className="p-6">

          <Suspense fallback={<Loading />}>
            {renderView()}
          </Suspense>

        </main>

      </div>

    </div>
  );
}