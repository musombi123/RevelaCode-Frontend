"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext.jsx";
import { Button } from "@/components/ui/Button.jsx";

export default function RoleManager() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`);
      const data = await res.json();
      setUsers(data);
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const assignRole = async (username, role) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/admin/assign-role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, role }),
    });

    setUsers(prev =>
      prev.map(u => u.username === username ? { ...u, role } : u)
    );
  };

  if (loading) return <p>Loading users…</p>;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">👑 Role Control Center</h2>

      {users.map(u => (
        <div key={u.username} className="flex justify-between items-center border p-3 rounded">
          <span>{u.username} — <b>{u.role || "pending"}</b></span>

          <div className="flex gap-2">
            <Button onClick={() => assignRole(u.username, "support")}>
              Make Support
            </Button>
            <Button onClick={() => assignRole(u.username, "admin")}>
              Make Admin
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
