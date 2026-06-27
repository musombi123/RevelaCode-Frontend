"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card.jsx";
import { Input } from "@/components/ui/Input.jsx";
import { Button } from "@/components/ui/Button.jsx";
import { useAuth } from "@/context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const SUPPORT_API_KEY = "RevelaCodeSupport";

export default function SupportLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const API = import.meta.env.VITE_API_URL;

  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!contact.trim() || !password.trim()) {
      setError("Contact and password are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": SUPPORT_API_KEY,
        },
        body: JSON.stringify({
          contact,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed.");
      }

      if (data.role !== "support") {
        throw new Error("This account is not a support account.");
      }

      // Store support session exactly like AdminLogin
      login({
        fullName: data.full_name,
        contact: data.contact,
        role: "support",
        apiKey: SUPPORT_API_KEY,
      });

      navigate("/pages", { replace: true });

    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <Card className="w-full max-w-md">

        <CardHeader>
          <h2 className="text-2xl font-bold">
            🔧 Support Login
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Login using your support account.
          </p>
        </CardHeader>

        <CardContent>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            <Input
              placeholder="Contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />

            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <div className="rounded-md bg-red-100 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

          </form>

        </CardContent>

      </Card>
    </div>
  );
}