"use client";

import React from "react";

import {
  LayoutDashboard,
  Users,
  BookOpen,
  ScrollText,
  BookMarked,
  Settings,
  Shield
} from "lucide-react";

export default function AdminSidebar({

  activeTab,
  setActiveTab

}) {

  const tabs = [

    {
      key: "overview",
      label: "Dashboard",
      icon: LayoutDashboard
    },

    {
      key: "team",
      label: "User Management",
      icon: Users
    },

    {
      key: "study",
      label: "Study Hub",
      icon: BookOpen
    },

    {
      key: "policy",
      label: "Policies",
      icon: ScrollText
    },

    {
      key: "scripture",
      label: "Scriptures",
      icon: BookMarked
    },

    {
      key: "settings",
      label: "Settings",
      icon: Settings
    }

  ];

  return (

    <aside className="w-72 bg-gray-900 text-gray-100 flex flex-col shadow-xl">

      <div className="p-6 border-b border-gray-800">

        <div className="flex items-center gap-3">

          <Shield className="w-7 h-7 text-indigo-400" />

          <div>

            <h1 className="font-bold text-xl">

              Admin Console

            </h1>

            <p className="text-xs text-gray-400">

              RevelaCode Control Center

            </p>

          </div>

        </div>

      </div>

      <nav className="flex-1 p-4 space-y-2">

        {

          tabs.map(tab => {

            const Icon = tab.icon;

            return (

              <button

                key={tab.key}

                onClick={() => setActiveTab(tab.key)}

                className={`

                  w-full

                  flex

                  items-center

                  gap-3

                  px-4

                  py-3

                  rounded-xl

                  transition

                  duration-200

                  ${

                    activeTab === tab.key

                    ? "bg-indigo-600 text-white shadow"

                    : "hover:bg-gray-800 text-gray-300"

                  }

                `}

              >

                <Icon size={20} />

                <span>

                  {tab.label}

                </span>

              </button>

            );

          })

        }

      </nav>

      <div className="border-t border-gray-800 p-4 text-xs text-gray-500">

        RevelaCode Admin Panel

        <br />

        Version 1.0

      </div>

    </aside>

  );

}