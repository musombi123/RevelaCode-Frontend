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
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      alert("Enter the Admin API Key.");
      return;
    }

    setLoading(true);

    login({
      fullName: "Administrator",
      contact: "admin",
      role: "admin",
      apiKey,
    });

    console.log("Stored auth:", localStorage.getItem("revela_auth"));

    navigate("/pages");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h2 className="text-xl font-bold">
            👑 Admin Authentication
          </h2>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter Admin API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Opening Dashboard..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}