"use client";

import React from "react";
import {
  Ticket,
  Clock3,
  CheckCircle2,
  UserCheck,
  AlertCircle,
  FolderOpen,
} from "lucide-react";

const cards = [
  {
    key: "total",
    label: "Total Tickets",
    icon: FolderOpen,
    color: "bg-blue-500",
  },
  {
    key: "open",
    label: "Open Tickets",
    icon: AlertCircle,
    color: "bg-red-500",
  },
  {
    key: "pending",
    label: "Pending",
    icon: Clock3,
    color: "bg-yellow-500",
  },
  {
    key: "resolved",
    label: "Resolved",
    icon: CheckCircle2,
    color: "bg-green-500",
  },
  {
    key: "assigned_to_me",
    label: "Assigned To Me",
    icon: UserCheck,
    color: "bg-indigo-500",
  },
  {
    key: "unassigned",
    label: "Unassigned",
    icon: Ticket,
    color: "bg-gray-700",
  },
];

export default function SupportStats({ stats = {} }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {cards.map(({ key, label, icon: Icon, color }) => (
        <div
          key={key}
          className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-lg transition-all duration-300"
        >
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {label}
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats[key] ?? 0}
              </h2>
            </div>

            <div
              className={`${color} h-14 w-14 rounded-xl flex items-center justify-center text-white`}
            >
              <Icon size={28} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}