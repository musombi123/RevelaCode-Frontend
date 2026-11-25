import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { resolveAdminBackendUrl } from "@/services/adminApi.jsx";

const PROVIDER_LABELS = {
  google: "Google",
  microsoft: "Microsoft",
  github: "GitHub",
};

export default function OAuthCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState("working");
  const [provider, setProvider] = useState("google");
  const [message, setMessage] = useState("Completing secure sign-in…");
  const [challengeToken, setChallengeToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [busy, setBusy] = useState(false);

  const finishLogin = (payload) => {
    login(payload);
    const role = String(payload.user?.role || "").toLowerCase();
    setStatus("success");
    setMessage("Your RevelaCode session is ready. Redirecting…");
    window.setTimeout(() => {
      if (role === "admin" || role === "platform_admin" || role === "super_admin" || role === "revelacode_admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (["support", "support_agent", "support_admin"].includes(role)) {
        navigate("/support/dashboard", { replace: true });
      } else {
        navigate("/app", { replace: true });
      }
    }, 250);
  };

  useEffect(() => {
    let active = true;
    async function complete() {
      const params = new URLSearchParams(location.search);
      const result = params.get("oauth");
      const ticket = params.get("ticket");
      const reason = params.get("reason");
      const selectedProvider = String(params.get("provider") || "google").toLowerCase();
      if (active) setProvider(PROVIDER_LABELS[selectedProvider] ? selectedProvider : "google");
      if (result !== "success" || !ticket) {
        if (active) {
          setStatus("error");
          setMessage(reason || ((PROVIDER_LABELS[selectedProvider] || "External provider") + " sign-in could not be completed. Use your existing sign-in method and try again."));
        }
        return;
      }
      try {
        const response = await fetch(resolveAdminBackendUrl() + "/api/oauth/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          credentials: "include",
          body: JSON.stringify({ ticket }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.success !== true) {
          throw new Error(payload.message || "This sign-in ticket expired. Start again.");
        }
        if (!active) return;
        if (payload.mfa_required) {
          if (!payload.challenge_token) throw new Error("The backend did not provide the required verification challenge.");
          setChallengeToken(payload.challenge_token);
          setStatus("mfa");
          setMessage("Your account uses two-step verification. Enter your authenticator or recovery code to finish signing in.");
          return;
        }
        finishLogin(payload);
      } catch (error) {
        if (active) {
          setStatus("error");
          setMessage(error?.message || "External sign-in failed.");
        }
      }
    }
    complete();
    return () => { active = false; };
  }, [location.search, login, navigate]);

  const verifyMfa = async (event) => {
    event.preventDefault();
    const code = String(mfaCode || "").trim();
    if (!challengeToken || !code) {
      setMessage("Enter your authenticator or recovery code.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(resolveAdminBackendUrl() + "/api/auth/mfa/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ challenge_token: challengeToken, code }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== true || !payload.access_token) {
        throw new Error(payload.message || "Two-step verification failed.");
      }
      setChallengeToken("");
      setMfaCode("");
      finishLogin(payload);
    } catch (error) {
      setMessage(error?.message || "Two-step verification failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {status === "working" && <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />}
        {status === "success" && <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />}
        {status === "error" && <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />}
        {status === "mfa" && <ShieldCheck className="mx-auto h-8 w-8 text-emerald-600" />}
        <h1 className="mt-4 text-center text-xl font-black text-slate-950 dark:text-white">
          {status === "mfa" ? "Two-step verification" : (PROVIDER_LABELS[provider] || "External provider") + " sign-in"}
        </h1>
        <p className="mt-2 text-center text-sm leading-6 text-slate-600 dark:text-slate-300" role={status === "error" ? "alert" : "status"}>
          {message}
        </p>
        {status === "mfa" && (
          <form onSubmit={verifyMfa} className="mt-5 space-y-3">
            <label className="block text-left">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Authenticator or recovery code</span>
              <input
                value={mfaCode}
                onChange={(event) => setMfaCode(event.target.value)}
                autoComplete="one-time-code"
                autoFocus
                maxLength={32}
                inputMode="text"
                placeholder="Enter your code"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono tracking-wider outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <button type="submit" disabled={busy || !mfaCode.trim()} className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? "Verifying…" : "Verify and sign in"}
            </button>
          </form>
        )}
        {status === "error" && (
          <div className="mt-5 text-center">
            <Link to="/login" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white">
              Return to sign in
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
