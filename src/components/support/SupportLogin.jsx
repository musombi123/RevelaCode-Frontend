"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card.jsx";
import { Input } from "@/components/ui/Input.jsx";
import { Button } from "@/components/ui/Button.jsx";
import { useAuth } from "@/context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function SupportLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [supportKey, setSupportKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) return setError("⚠ Enter username and password.");
    if (!supportKey) return setError("⚠ Support key required.");

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/support/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, support_key: supportKey }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      // ✅ Update auth context
      login({ username: data.username, fullName: data.username, role: "support" });

      // ✅ SPA redirect
      navigate("/pages");
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
          <h2 className="text-xl font-bold">🔧 Support Login</h2>
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
              value={supportKey}
              onChange={(e) => setSupportKey(e.target.value)}
              placeholder="Support Key"
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
