"use client";

import React, { useState } from "react";

import AdminHeader from "./AdminHeader.jsx";
import AdminSidebar from "./AdminSidebar.jsx";

import AdminOverview from "./AdminOverview.jsx";
import AdminTeamManagement from "./AdminTeamManagement.jsx";
import AdminStudyManagement from "./AdminStudyManagement.jsx";
import AdminPolicyManagement from "./AdminPolicyManagement.jsx";
import AdminScriptureManagement from "./AdminScriptureManagement.jsx";

export default function AdminDashboard() {

  const [activeTab, setActiveTab] = useState("overview");

  return (

    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">

      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex-1 flex flex-col overflow-hidden">

        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-6">

          {activeTab === "overview" && (
            <AdminOverview />
          )}

          {activeTab === "team" && (
            <AdminTeamManagement />
          )}

          {activeTab === "study" && (
            <AdminStudyManagement />
          )}

          {activeTab === "policy" && (
            <AdminPolicyManagement />
          )}

          {activeTab === "scripture" && (
            <AdminScriptureManagement />
          )}

          {activeTab === "settings" && (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-4">
                Settings
              </h2>

              <p className="text-gray-500">
                Global system settings will appear here.
              </p>
            </div>
          )}

        </main>

      </div>

    </div>

  );

}