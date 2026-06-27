"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button.jsx";

const API = import.meta.env.VITE_API_URL;

// Built-in Admin API Key
const ADMIN_API_KEY = "bbit070j2003@RC#2026!";

export default function AdminPolicyManagement() {

  const [policyId, setPolicyId] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function savePolicy() {

    if (!policyId.trim() || !content.trim()) {
      setMessage("Please fill in all fields.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {

      const res = await fetch(
        `${API}/api/admin/update-policy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": ADMIN_API_KEY,
          },
          body: JSON.stringify({
            policy_id: policyId,
            content,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save policy.");
      }

      setMessage(data.message);

    } catch (err) {

      setMessage(err.message);

    } finally {

      setSaving(false);

    }

  }

  return (

    <Card>

      <CardContent className="p-6 space-y-5">

        <h2 className="text-2xl font-bold">
          Policy Management
        </h2>

        {message && (
          <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 text-sm">
            {message}
          </div>
        )}

        <input
          className="w-full rounded-lg border p-3"
          placeholder="Policy ID"
          value={policyId}
          onChange={(e) => setPolicyId(e.target.value)}
        />

        <textarea
          rows={12}
          className="w-full rounded-lg border p-3"
          placeholder="Enter policy content..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <Button
          onClick={savePolicy}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Policy"}
        </Button>

      </CardContent>

    </Card>

  );

}