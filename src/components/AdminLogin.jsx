"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export default function AdminLogin() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState(""); // secret admin key
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password || !adminKey) {
      return setError("⚠ All fields are required.");
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, admin_key: adminKey }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Login failed");

      login({ username: data.username, role: "admin" });
      window.location.href = "/admin/dashboard"; // redirect to admin dashboard
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 p-4 z-50">
      <Card className="w-full max-w-md p-6 space-y-4">
        <CardHeader>
          <h2 className="text-xl font-bold">👑 Admin Login</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <Input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin Key"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "⏳ Logging in..." : "Login"}
            </Button>
          </form>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
