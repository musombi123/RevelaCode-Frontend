"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input.jsx";
import { Button } from "@/components/ui/Button.jsx";
import { useAuth } from "@/context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!apiKey) return setError("⚠ Enter Admin API Key.");

    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,   // 🔥 THIS IS THE IMPORTANT PART
          },
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Login failed");

      // Save admin session
      login({
        fullName: data.full_name,
        contact: data.contact,
        role: data.role,
      });

      navigate(data.redirect);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <CardHeader>
          <h2 className="text-xl font-bold">👑 Admin Access</h2>
        </CardHeader>

        <CardContent className="space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter Admin API Key"
            />

            <Button type="submit" disabled={loading}>
              {loading ? "⏳ Verifying..." : "Enter Dashboard"}
            </Button>
          </form>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
