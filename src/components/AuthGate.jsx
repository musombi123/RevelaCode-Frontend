import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext.jsx";

const API_BASE = String(import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");

export default function AuthGate({ children, requiredRoles = [] }) {
  const { authFetch, getAccessToken, user } = useAuth();
  const location = useLocation();
  const [state, setState] = useState("checking");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const token = getAccessToken();

    if (!token) {
      setState("unauthenticated");
      return () => { active = false; };
    }

    setState("checking");
    setError("");
    const endpoint = API_BASE ? `${API_BASE}/api/auth/me` : "/api/auth/me";

    authFetch(endpoint, { method: "GET", headers: { Accept: "application/json" } })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!active) return;
        if (response.status === 401) {
          setState("unauthenticated");
          return;
        }
        if (!response.ok || payload?.success === false) {
          setError(payload?.detail?.message || payload?.detail || payload?.message || `Session verification failed (HTTP ${response.status}).`);
          setState("error");
          return;
        }
        const returnedUser = payload?.user || payload?.data?.user || {};
        // /api/auth/me is authoritative for current role assignments. Only use
        // cached context roles when the server does not provide role data at all.
        const serverRoleDataAvailable =
          Array.isArray(payload?.roles) ||
          Array.isArray(returnedUser?.roles) ||
          Boolean(payload?.role || returnedUser?.role);
        const currentRoles = serverRoleDataAvailable
          ? [
              ...(Array.isArray(payload?.roles) ? payload.roles : []),
              ...(Array.isArray(returnedUser?.roles) ? returnedUser.roles : []),
              payload?.role,
              returnedUser?.role,
            ].filter(Boolean).map((role) => String(role).trim().toLowerCase())
          : [
              ...(Array.isArray(user?.roles) ? user.roles : []),
              user?.role,
            ].filter(Boolean).map((role) => String(role).trim().toLowerCase());
        const required = requiredRoles.map((role) => String(role).trim().toLowerCase());
        if (required.length && !required.some((role) => currentRoles.includes(role))) {
          setError("This account does not have the role required to open this page.");
          setState("forbidden");
          return;
        }
        setState("authenticated");
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError?.message || "Unable to verify the signed-in session.");
        setState("error");
      });

    return () => { active = false; };
  }, [authFetch, getAccessToken, location.pathname, attempt, requiredRoles.join("|")]);

  if (state === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (state === "checking") {
    return (
      <div className="flex min-h-[45vh] items-center justify-center p-6 text-slate-600 dark:text-slate-300" role="status">
        <Loader2 className="mr-3 h-5 w-5 animate-spin" /> Verifying your RevelaCode session…
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <div className="mx-auto my-12 max-w-xl rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
        <AlertCircle className="mb-2 h-6 w-6" />
        <h2 className="font-semibold">Access restricted</h2>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mx-auto my-12 max-w-xl rounded-2xl border border-rose-200 bg-white p-6 text-slate-900 shadow-sm dark:border-rose-900 dark:bg-slate-950 dark:text-white">
        <AlertCircle className="mb-2 h-6 w-6 text-rose-600" />
        <h2 className="font-semibold">Could not verify the session</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{error}</p>
        <p className="mt-2 text-xs text-slate-500">The protected page stays closed until the authentication API responds successfully.</p>
        <Button className="mt-4" onClick={() => setAttempt((value) => value + 1)}>
          <RefreshCw className="mr-2 h-4 w-4" /> Retry verification
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
