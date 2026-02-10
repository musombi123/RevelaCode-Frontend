"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext.jsx";
import Loading from "@/components/common/Loading.jsx";
import SupportSidebar from "./SupportSidebar.jsx";
import SupportHeader from "./SupportHeader.jsx";
import SupportTickets from "./SupportTickets.jsx";

const dummyTickets = [
  { id: 1, title: "User cannot login", status: "Open", user: "John Doe" },
  { id: 2, title: "Bug in prophecy decoder", status: "In Progress", user: "Mary J" },
  { id: 3, title: "Feature request: Dark mode", status: "Resolved", user: "Alice K" },
];

export default function SupportDashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("tickets");
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    if (!user || user.role !== "support") window.location.href = "/support/login";
    setTickets(dummyTickets);
  }, [user]);

  const activeComponent = () => {
    if (activeView === "tickets") return <SupportTickets tickets={tickets} />;
    if (activeView === "settings") return <div className="p-4">Settings panel coming soon!</div>;
    return <div>Select a view from sidebar</div>;
  };

  return (
    <div className="relative flex min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors">
      {sidebarOpen && <SupportSidebar activeView={activeView} setActiveView={setActiveView} />}
      <main className="flex-1 flex flex-col">
        <SupportHeader user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} logout={logout} />
        <section className="p-6 h-[calc(100vh-64px)] overflow-y-auto">
          <Suspense fallback={<Loading />}>{activeComponent()}</Suspense>
        </section>
      </main>
    </div>
  );
}
