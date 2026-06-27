"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext.jsx";
import { Button } from "@/components/ui/Button.jsx";
import { Card, CardContent } from "@/components/ui/Card";

const API = import.meta.env.VITE_API_URL;

export default function AdminTeamManagement() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    contact: "",
    role: "support",
  });

  useEffect(() => {
    if (user?.apiKey) {
      loadUsers();
    }
  }, [user]);

  async function loadUsers() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/api/admin/list-users`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": user?.apiKey || "",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load users.");
      }

      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createUser() {
    if (!form.full_name.trim() || !form.contact.trim()) {
      setMessage("Please complete all required fields.");
      return;
    }

    setCreating(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/api/admin/manage-users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": user?.apiKey || "",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create user.");
      }

      setMessage(data.message);

      setForm({
        full_name: "",
        contact: "",
        role: "support",
      });

      await loadUsers();
    } catch (err) {
      console.error(err);
      setMessage(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <h2 className="text-2xl font-bold">
          User Management
        </h2>

        <Button onClick={loadUsers}>
          Refresh
        </Button>

      </div>

      {message && (
        <div className="rounded-lg border bg-gray-100 p-3">
          {message}
        </div>
      )}

      <Card>

        <CardContent className="p-6 space-y-4">

          <h3 className="text-lg font-bold">
            Create User
          </h3>

          <input
            className="w-full border rounded-lg p-3"
            placeholder="Full Name"
            value={form.full_name}
            onChange={(e) =>
              setForm({
                ...form,
                full_name: e.target.value,
              })
            }
          />

          <input
            className="w-full border rounded-lg p-3"
            placeholder="Contact"
            value={form.contact}
            onChange={(e) =>
              setForm({
                ...form,
                contact: e.target.value,
              })
            }
          />

          <select
            className="w-full border rounded-lg p-3"
            value={form.role}
            onChange={(e) =>
              setForm({
                ...form,
                role: e.target.value,
              })
            }
          >
            <option value="support">Support</option>
            <option value="user">User</option>
          </select>

          <Button
            className="w-full"
            onClick={createUser}
            disabled={creating}
          >
            {creating ? "Creating User..." : "Create User"}
          </Button>

        </CardContent>

      </Card>

      <Card>

        <CardContent className="p-6">

          <h3 className="text-lg font-bold mb-5">
            Registered Users
          </h3>

          {loading ? (

            <p>Loading users...</p>

          ) : users.length === 0 ? (

            <div className="text-center py-10 text-gray-500">
              No users found.
            </div>

          ) : (

            <div className="space-y-3">

              {users.map((u) => (

                <div
                  key={u.contact}
                  className="border rounded-xl p-4 flex justify-between items-center hover:shadow-sm transition"
                >

                  <div>

                    <h4 className="font-semibold">
                      {u.full_name}
                    </h4>

                    <p className="text-sm text-gray-500">
                      {u.contact}
                    </p>

                    <p className="text-xs text-gray-400">
                      Created: {u.created_at || "-"}
                    </p>

                  </div>

                  <div className="text-right">

                    <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm">
                      {u.role}
                    </span>

                    <div
                      className={`mt-2 text-xs font-medium ${
                        u.verified
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {u.verified
                        ? "Verified"
                        : "Not Verified"}
                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </CardContent>

      </Card>

    </div>
  );
}