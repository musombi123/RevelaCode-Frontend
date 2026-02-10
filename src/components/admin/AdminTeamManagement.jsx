"use client";
import React, { useEffect, useState } from "react";

export default function AdminTeamManagement() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch support team from backend
  useEffect(() => {
    async function fetchTeam() {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/support-team`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch team");
        setTeam(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTeam();
  }, []);

  if (loading) return <p>Loading support team… ⏳</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Support Team Members</h2>

      {team.length === 0 && <p>No support members found.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((member) => (
          <div
            key={member.id}
            className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <p className="font-semibold text-gray-900 dark:text-gray-100">{member.fullName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Username: {member.username}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Role: {member.role}</p>
            <button
              className="mt-2 w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
              onClick={() => alert(`Assigning task to ${member.fullName}`)}
            >
              Assign Task
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
