"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";

const API_BASE = (
  import.meta.env.VITE_REVELACODE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  ""
).replace(/\/+$/, "");

function getMessage(payload, fallback) {
  const candidates = [
    payload?.message,
    payload?.error?.message,
    typeof payload?.error === "string"
      ? payload.error
      : null,
    payload?.detail,
  ];

  return (
    candidates.find(
      (value) =>
        typeof value === "string" &&
        value.trim().length > 0,
    ) || fallback
  );
}

function getRole(payload) {
  return String(
    payload?.role ||
      payload?.user?.role ||
      payload?.data?.role ||
      payload?.data?.user?.role ||
      "",
  )
    .trim()
    .toLowerCase();
}

function getToken(payload) {
  return (
    payload?.access_token ||
    payload?.accessToken ||
    payload?.token ||
    payload?.user?.access_token ||
    payload?.user?.accessToken ||
    payload?.data?.access_token ||
    payload?.data?.accessToken ||
    payload?.data?.token ||
    payload?.data?.user?.access_token ||
    ""
  );
}

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    if (!API_BASE) {
      setError(
        "The backend URL is not configured. Please check the frontend environment variables.",
      );
      return;
    }

    if (!contact.trim() || !password) {
      setError("Enter your account contact and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          contact: contact.trim(),
          password,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload?.success === false) {
        throw new Error(
          getMessage(
            payload,
            `Sign-in failed with HTTP ${response.status}.`,
          ),
        );
      }

      // Permissions must come from the backend response.
      // Never assign the administrator role in the browser.
      const role = getRole(payload);

      if (role !== "admin" && role !== "support") {
        throw new Error(
          "This account does not have platform administrator or support access. Contact the platform administrator if you need access.",
        );
      }

      const accessToken = getToken(payload);

      if (!accessToken) {
        throw new Error(
          "The backend did not return an access token. Please try again.",
        );
      }

      const tokenType =
        payload?.token_type ||
        payload?.tokenType ||
        payload?.data?.token_type ||
        payload?.data?.tokenType ||
        "Bearer";

      // Preserve the backend response and normalize its token fields
      // for the existing AuthContext implementation.
      const authPayload = {
        ...payload,
        role,
        access_token: accessToken,
        token_type: tokenType,
      };

      // AuthContext validates the token and persists the real session.
      login(authPayload);

      // Do not accept arbitrary redirects supplied by the response.
      navigate(
        role === "admin"
          ? "/admin/dashboard"
          : "/support/dashboard",
        { replace: true },
      );
    } catch (err) {
      setError(
        typeof err?.message === "string" && err.message.trim()
          ? err.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="bg-slate-950 px-6 py-8 text-white sm:px-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <ShieldCheck
              size={26}
              aria-hidden="true"
            />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
            RevelaCode Platform
          </p>

          <h1 className="mt-2 text-2xl font-black tracking-tight">
            Administrative access
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            Sign in with your existing platform account.
            Access is determined by the backend-assigned role.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6 sm:p-8"
        >
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
            >
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <span>{error}</span>
            </div>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Email or account contact
            </span>

            <input
              type="text"
              name="contact"
              autoComplete="username"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="Enter your registered contact"
              required
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Password
            </span>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-12 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:text-slate-700 disabled:opacity-50 dark:hover:text-white"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
                Verifying account…
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                Sign in securely
              </>
            )}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => navigate("/", { replace: true })}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={17} />
            Return to RevelaCode
          </button>

          <p className="text-center text-xs leading-5 text-slate-400">
            Only authorized platform administrators and support
            accounts can access this area.
          </p>
        </form>
      </div>
    </div>
  );
}