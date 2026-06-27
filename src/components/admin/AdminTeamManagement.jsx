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

  const [form, setForm] = useState({
    full_name: "",
    contact: "",
    role: "support",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {

    setLoading(true);

    try {

      const res = await fetch(
        `${API}/api/admin/list-users`,
        {
          headers: {
            "X-API-KEY": user.apiKey,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      setUsers(data.users || []);

    } catch (err) {

      alert(err.message);

    }

    setLoading(false);

  }

  async function createUser() {

    if (!form.full_name || !form.contact) {
      return alert("Fill in all fields.");
    }

    setCreating(true);

    try {

      const res = await fetch(
        `${API}/api/admin/manage-users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": user.apiKey,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      alert(data.message);

      setForm({
        full_name: "",
        contact: "",
        role: "support",
      });

      loadUsers();

    } catch (err) {

      alert(err.message);

    }

    setCreating(false);

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

      <Card>

        <CardContent className="p-6 space-y-4">

          <h3 className="font-bold">

            Create User

          </h3>

          <input
            className="w-full border rounded-lg p-3"
            placeholder="Full Name"
            value={form.full_name}
            onChange={(e)=>
              setForm({
                ...form,
                full_name:e.target.value
              })
            }
          />

          <input
            className="w-full border rounded-lg p-3"
            placeholder="Contact"
            value={form.contact}
            onChange={(e)=>
              setForm({
                ...form,
                contact:e.target.value
              })
            }
          />

          <select
            className="w-full border rounded-lg p-3"
            value={form.role}
            onChange={(e)=>
              setForm({
                ...form,
                role:e.target.value
              })
            }
          >
            <option value="support">
              Support
            </option>

            <option value="user">
              User
            </option>

          </select>

          <Button
            onClick={createUser}
            disabled={creating}
          >

            {
              creating
                ? "Creating..."
                : "Create User"
            }

          </Button>

        </CardContent>

      </Card>

      <Card>

        <CardContent className="p-6">

          <h3 className="font-bold mb-5">

            Registered Users

          </h3>

          {

            loading ? (

              <p>

                Loading users...

              </p>

            ) : users.length === 0 ? (

              <p>

                No users found.

              </p>

            ) : (

              <div className="space-y-3">

                {

                  users.map(u=>(

                    <div
                      key={u.contact}
                      className="border rounded-lg p-4 flex justify-between items-center"
                    >

                      <div>

                        <h4 className="font-semibold">

                          {u.full_name}

                        </h4>

                        <p className="text-sm text-gray-500">

                          {u.contact}

                        </p>

                        <p className="text-xs text-gray-400">

                          Created: {u.created_at}

                        </p>

                      </div>

                      <div className="text-right">

                        <span className="px-3 py-1 rounded bg-indigo-100">

                          {u.role}

                        </span>

                        <br />

                        <span
                          className={`text-xs ${
                            u.verified
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >

                          {

                            u.verified
                              ? "Verified"
                              : "Not Verified"

                          }

                        </span>

                      </div>

                    </div>

                  ))

                }

              </div>

            )

          }

        </CardContent>

      </Card>

    </div>

  );

}