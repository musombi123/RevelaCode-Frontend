import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { resolveAdminBackendUrl } from "@/services/adminApi.jsx";

export default function OAuthCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState("working");
  const [message, setMessage] = useState("Completing secure Google sign-in…");

  useEffect(() => {
    let active = true;
    async function complete() {
      const params = new URLSearchParams(location.search);
      const result = params.get("oauth");
      const ticket = params.get("ticket");
      const reason = params.get("reason");
      if (result !== "success" || !ticket) {
        if (active) {
          setStatus("error");
          setMessage(reason || "Google sign-in could not be completed. Use your existing sign-in method and try again.");
        }
        return;
      }
      try {
        const response = await fetch(`${resolveAdminBackendUrl()}/api/oauth/google/exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ ticket }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.success !== true) throw new Error(payload.message || "Google sign-in ticket expired.");
        login(payload);
        const role = String(payload.user?.role || "").toLowerCase();
        if (!active) return;
        setStatus("success");
        setMessage("Your RevelaCode session is ready. Redirecting…");
        window.setTimeout(() => {
          if (role === "admin" || role === "platform_admin" || role === "super_admin" || role === "revelacode_admin") navigate("/admin/dashboard", { replace: true });
          else if (["support", "support_agent", "support_admin"].includes(role)) navigate("/support/dashboard", { replace: true });
          else navigate("/app", { replace: true });
        }, 250);
      } catch (error) {
        if (active) {
          setStatus("error");
          setMessage(error?.message || "Google sign-in failed.");
        }
      }
    }
    complete();
    return () => { active = false; };
  }, [location.search, login, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {status === "working" && <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />}
        {status === "success" && <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />}
        {status === "error" && <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />}
        <h1 className="mt-4 text-xl font-black text-slate-950 dark:text-white">Google sign-in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{message}</p>
        {status === "error" && <Link to="/login" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white">Return to sign in</Link>}
      </section>
    </main>
  );
}
