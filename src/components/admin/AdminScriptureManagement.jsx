"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

const API = import.meta.env.VITE_API_URL;

export default function AdminScriptureManagement() {
  const { user } = useAuth();

  const [scriptureId, setScriptureId] = useState("");
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function updateScripture() {
    if (!scriptureId.trim()) {
      setMessage("Please enter a Scripture ID.");
      return;
    }

    if (!content.trim()) {
      setMessage("Please enter scripture content.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/api/admin/update-scripture`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",

            // Uses the stored API key after admin login
            "X-API-KEY": user?.apiKey || "",
          },
          body: JSON.stringify({
            id: scriptureId,
            content,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update scripture.");
      }

      setMessage(data.message || "Scripture updated successfully.");

      // Optional: clear form after successful save
      setScriptureId("");
      setContent("");
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6 space-y-5">

        <div>
          <h2 className="text-2xl font-bold">
            Scripture Management
          </h2>

          <p className="text-gray-500 text-sm">
            Update any scripture stored in the RevelaCode database.
          </p>
        </div>

        {message && (
          <div className="rounded-lg border bg-gray-50 p-3 text-sm">
            {message}
          </div>
        )}

        <div className="space-y-2">
          <label className="font-medium">
            Scripture ID
          </label>

          <input
            className="w-full rounded-lg border p-3"
            placeholder="e.g. JOHN_3_16"
            value={scriptureId}
            onChange={(e) => setScriptureId(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="font-medium">
            Scripture Content
          </label>

          <textarea
            rows={12}
            className="w-full rounded-lg border p-3"
            placeholder="Enter the updated scripture..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <Button
          onClick={updateScripture}
          disabled={loading}
          className="w-full"
        >
          {loading
            ? "Updating Scripture..."
            : "Update Scripture"}
        </Button>

      </CardContent>
    </Card>
  );
}