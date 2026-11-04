"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { useAdminApi, resolveAdminBackendUrl } from "@/services/adminApi.jsx";

export default function SupportInvitationPage() {
  const adminApi = useAdminApi();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const token = params.get("token") || "";
  const email = (params.get("email") || "").trim().toLowerCase();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [googleAccepting, setGoogleAccepting] = useState(false);
  const [responding, setResponding] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  useEffect(() => {
    let cancelled = false;
    async function preview() {
      if (!token || token.length < 32 || !email) {
        setMessageType("error");
        setMessage("This invitation link is missing its token or email address. Ask the RevelaCode Administrator to issue a new invitation.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await adminApi.get("/api/support-center/invitations/preview", { token, email });
        if (cancelled) return;
        setInvitation(response?.invitation || null);
        if (!response?.invitation) {
          setMessageType("error");
          setMessage("The invitation could not be verified.");
        }
      } catch (error) {
        if (cancelled) return;
        setMessageType("error");
        setMessage(error?.message || "This invitation is invalid, expired, revoked or already used.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    preview();
    return () => { cancelled = true; };
  }, [adminApi, token, email]);

  async function acceptWithGoogle() {
    if (googleAccepting) return;
    if (window.Capacitor?.isNativePlatform?.()) {
      setMessageType("error");
      setMessage("Google invitation acceptance on Android requires the system-browser plugin and deep-link handler in the APK. Use the password option here until that APK update is installed.");
      return;
    }
    setGoogleAccepting(true);
    setMessage("");
    try {
      const response = await fetch(`${resolveAdminBackendUrl()}/api/oauth/google/invite/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ invite_token: token, email, client: "web" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !payload.authorization_url) {
        throw new Error(payload.message || "Google invitation sign-in could not be started.");
      }
      window.location.assign(payload.authorization_url);
    } catch (error) {
      setMessageType("error");
      setMessage(error?.message || "Google invitation sign-in failed.");
      setGoogleAccepting(false);
    }
  }

  async function respondToRoleChange(decision) {
    if (responding || !invitation || invitation.invitation_type !== "role_change") return;
    setResponding(true);
    setMessage("");
    try {
      const response = await adminApi.post("/api/support-center/invitations/respond", {
        token,
        email,
        decision,
      });
      setInvitation(null);
      setMessageType("success");
      setMessage(response?.message || (decision === "accept"
        ? "You accepted the role change. Sign in again to refresh your permissions."
        : "You declined the role change. Your existing account has not changed."));
    } catch (error) {
      setMessageType("error");
      setMessage(error?.message || "Your response could not be recorded.");
    } finally {
      setResponding(false);
    }
  }

  async function acceptInvitation(event) {
    event.preventDefault();
    if (accepting) return;
    if (password.length < 12) {
      setMessageType("error");
      setMessage("Choose a password with at least 12 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("The passwords do not match.");
      return;
    }

    setAccepting(true);
    setMessage("");
    try {
      const response = await adminApi.post("/api/support-center/invitations/accept", {
        token,
        email,
        password,
        confirm_password: confirmPassword,
      });
      setPassword("");
      setConfirmPassword("");
      setInvitation(null);
      setMessageType("success");
      setMessage(response?.message || "Your support account is active. Sign in to continue.");
    } catch (error) {
      setMessageType("error");
      setMessage(error?.message || "The invitation could not be accepted.");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <section className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <header className="bg-slate-950 p-6 text-white sm:p-8">
          <div className="flex items-center gap-3"><span className="rounded-xl border border-white/10 bg-white/10 p-3"><ShieldCheck size={23} className="text-emerald-300" /></span><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">RevelaCode</p><h1 className="mt-1 text-2xl font-black">{invitation?.invitation_type === "role_change" ? "Review role-change request" : "Join the support team"}</h1></div></div>
          <p className="mt-4 text-sm leading-6 text-white/70">{invitation?.invitation_type === "role_change"
            ? "An administrator has requested a change to the role on your existing RevelaCode account. Nothing changes unless you explicitly accept. You may decline."
            : "Accept your invitation and set a password for your own account. Access is limited to the role assigned by the RevelaCode Administrator."}</p>
        </header>

        <div className="space-y-5 p-5 sm:p-8">
          {loading ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300"><Loader2 size={18} className="animate-spin" /> Verifying your invitation…</div>
          ) : null}

          {invitation ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">{invitation.invitation_type === "role_change" ? "Role-change request verified" : "Invitation verified"}</p>
              <p className="mt-2 text-lg font-black text-slate-950 dark:text-white">{invitation.full_name || "Welcome to RevelaCode"}</p>
              <p className="mt-1 break-all text-sm text-slate-600 dark:text-slate-300">{invitation.contact || email}</p>
              {invitation.invitation_type === "role_change" ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-white px-3 py-1.5 font-semibold capitalize text-slate-700 dark:bg-slate-900 dark:text-slate-200">{String(invitation.current_role || "user").replaceAll("_", " ")}</span>
                  <span aria-hidden="true" className="text-slate-400">→</span>
                  <span className="rounded-full bg-white px-3 py-1.5 font-bold capitalize text-emerald-800 dark:bg-slate-900 dark:text-emerald-200">{String(invitation.role || "support").replaceAll("_", " ")}</span>
                </div>
              ) : (
                <p className="mt-3 inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-bold capitalize text-emerald-800 dark:bg-slate-900 dark:text-emerald-200">{String(invitation.role || "support").replaceAll("_", " ")}</p>
              )}
              {invitation.invitation_type === "role_change" ? <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Accepting adds the requested support role to your existing account. Declining leaves your current role and access untouched. You will not be asked to create another account.</p> : null}
              {invitation.expires_at ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Expires {new Date(invitation.expires_at).toLocaleString()}</p> : null}
            </div>
          ) : null}

          {message ? (
            <div role={messageType === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-xl border p-3 text-sm leading-5 ${messageType === "error" ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200" : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200"}`}>
              {messageType === "error" ? <AlertCircle size={17} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}{message}
            </div>
          ) : null}

          {invitation?.invitation_type === "role_change" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => respondToRoleChange("accept")} disabled={responding} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">{responding ? "Saving response…" : "Accept role change"}</button>
              <button type="button" onClick={() => respondToRoleChange("decline")} disabled={responding} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-rose-200 px-4 py-3 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-950/30">Decline request</button>
            </div>
          ) : null}

          {invitation && invitation.invitation_type !== "role_change" ? (
            <form onSubmit={acceptInvitation} className="space-y-4">
              <button type="button" onClick={acceptWithGoogle} disabled={googleAccepting} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"><span className="text-base font-black text-blue-600">G</span>{googleAccepting ? "Opening Google…" : "Accept with Google"}</button>
              <div className="flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-white/10" /><span>or create a password</span><span className="h-px flex-1 bg-slate-200 dark:bg-white/10" /></div>
              <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Create password</span><input required minLength={12} maxLength={256} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
              <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Confirm password</span><input required minLength={12} maxLength={256} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your password" className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Use a unique password. RevelaCode stores a password hash; neither the inviting administrator nor the support team will see this password.</p>
              <button type="submit" disabled={accepting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"><UserPlus size={17} />{accepting ? "Activating account…" : "Accept invitation and activate account"}</button>
            </form>
          ) : null}

          {messageType === "success" && !invitation ? (
            <button type="button" onClick={() => navigate("/pages")} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950">Continue to sign in</button>
          ) : null}

          <div className="border-t border-slate-100 pt-4 text-center text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">A role request never changes your access automatically. Your decision is recorded against this single-use invitation. An invitation does not grant ecosystem-owner permissions.</div>
          {!invitation && messageType === "error" && !loading ? <p className="text-center text-sm"><Link to="/pages" className="font-bold text-emerald-700 underline dark:text-emerald-300">Return to sign in</Link></p> : null}
        </div>
      </section>
    </main>
  );
}
