"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext.jsx";
import { Button } from "@/components/ui/Button.jsx";

export default function AdminTeamManagement() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/list-users`,
        {
          headers: {
            "X-API-KEY": user.apiKey,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load users");
      }

      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createSupport() {
    const full_name = prompt("Full name");
    if (!full_name) return;

    const contact = prompt("Contact");
    if (!contact) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/manage-users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": user.apiKey,
          },
          body: JSON.stringify({
            full_name,
            contact,
            role: "support",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      alert(data.message);

      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return <p>Loading users...</p>;
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Team Management
        </h2>

        <Button onClick={createSupport}>
          + Create Support User
        </Button>
      </div>

      <div className="space-y-3">
        {users.map((u) => (
          <div
            key={u.contact}
            className="border rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{u.full_name}</p>
              <p className="text-sm text-gray-500">{u.contact}</p>
            </div>

            <span className="px-3 py-1 rounded bg-blue-100">
              {u.role}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}