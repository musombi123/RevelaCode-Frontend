"use client";

import React, { useState } from "react";

import AdminHeader from "./AdminHeader.jsx";
import AdminSidebar from "./AdminSidebar.jsx";
import AdminTeamManagement from "./AdminTeamManagement.jsx";
import AdminStudyManagement from "./AdminStudyManagement.jsx";

export default function AdminDashboard() {

  const [activeTab, setActiveTab] =
  useState("team");

  return (

    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">

      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex-1 flex flex-col">

        <AdminHeader />

        <main className="p-6">

          {activeTab==="team" &&
            <AdminTeamManagement />
          }

          {activeTab==="study" &&
            <AdminStudyManagement />
          }

          {activeTab==="settings" &&
            <div>
              Settings coming soon...
            </div>
          }

        </main>

      </div>

    </div>

  )

}