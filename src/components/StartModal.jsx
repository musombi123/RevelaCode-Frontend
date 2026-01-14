// src/components/StartModal.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { LogIn, Eye, UserPlus } from "lucide-react";

export default function StartModal({ onLoginSuccess, onGuest }) {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [mode, setMode] = useState("login"); // login | register
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (mode === "register") {
      if (!fullName || !contact || !password || !confirmPassword) {
        setError("All fields are required.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    } else {
      if (!contact || !password) {
        setError("Contact and password are required.");
        return;
      }
    }

    setError("");
    setLoading(true);

    try {
      const payload =
        mode === "login"
          ? { contact, password }
          : { full_name: fullName, contact, password, confirm_password: confirmPassword };

      const res = await fetch(`${baseUrl}/api/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onLoginSuccess?.(data);
      } else {
        setError(data.message || "Authentication failed.");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80">
      <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-xl p-6 shadow-xl space-y-4">
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white">
          🔮 Welcome to RevelaCode
        </h1>

        <p className="text-sm text-center text-gray-600 dark:text-gray-300">
          Prophecy decoding • Bible study • AI insight
        </p>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <div className="space-y-2">
          {mode === "register" && (
            <input
              className="w-full p-2 rounded border dark:bg-gray-900 dark:border-gray-700"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
            />
          )}

          <input
            className="w-full p-2 rounded border dark:bg-gray-900 dark:border-gray-700"
            placeholder="Email or phone"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            disabled={loading}
          />

          <input
            type="password"
            className="w-full p-2 rounded border dark:bg-gray-900 dark:border-gray-700"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          {mode === "register" && (
            <input
              type="password"
              className="w-full p-2 rounded border dark:bg-gray-900 dark:border-gray-700"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          )}
        </div>

        <Button onClick={submit} disabled={loading} className="w-full flex items-center justify-center gap-2">
          {mode === "login" ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
        </Button>

        <div className="flex justify-between text-xs text-gray-500">
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="hover:underline"
            disabled={loading}
          >
            {mode === "login" ? "Create an account" : "Already have an account?"}
          </button>

          <button onClick={onGuest} className="flex items-center gap-1 hover:underline" disabled={loading}>
            <Eye className="w-4 h-4" /> Continue as guest
          </button>
        </div>

        <p className="text-xs text-center text-gray-400">Guest mode: Bible & events only</p>
      </div>
    </div>
  );
}
