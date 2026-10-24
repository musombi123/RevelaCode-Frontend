"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck, UserRoundPlus } from "lucide-react";
import { useAdminApi } from "@/services/adminApi.jsx";

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
        const response = await adminApi.get("/api/admin/invitations/preview", { token, email });
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
      const response = await adminApi.post("/api/admin/invitations/accept", {
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
          <div className="flex items-center gap-3"><span className="rounded-xl border border-white/10 bg-white/10 p-3"><ShieldCheck size={23} className="text-emerald-300" /></span><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">RevelaCode</p><h1 className="mt-1 text-2xl font-black">Join the support team</h1></div></div>
          <p className="mt-4 text-sm leading-6 text-white/70">Accept your invitation and set a password for your own account. Access is limited to the role assigned by the RevelaCode Administrator.</p>
        </header>

        <div className="space-y-5 p-5 sm:p-8">
          {loading ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300"><Loader2 size={18} className="animate-spin" /> Verifying your invitation…</div>
          ) : null}

          {invitation ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">Invitation verified</p>
              <p className="mt-2 text-lg font-black text-slate-950 dark:text-white">{invitation.full_name || "Welcome to RevelaCode"}</p>
              <p className="mt-1 break-all text-sm text-slate-600 dark:text-slate-300">{invitation.contact || email}</p>
              <p className="mt-3 inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-bold capitalize text-emerald-800 dark:bg-slate-900 dark:text-emerald-200">{String(invitation.role || "support").replaceAll("_", " ")}</p>
              {invitation.expires_at ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Expires {new Date(invitation.expires_at).toLocaleString()}</p> : null}
            </div>
          ) : null}

          {message ? (
            <div role={messageType === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-xl border p-3 text-sm leading-5 ${messageType === "error" ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200" : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200"}`}>
              {messageType === "error" ? <AlertCircle size={17} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}{message}
            </div>
          ) : null}

          {invitation ? (
            <form onSubmit={acceptInvitation} className="space-y-4">
              <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Create password</span><input required minLength={12} maxLength={256} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
              <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Confirm password</span><input required minLength={12} maxLength={256} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your password" className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Use a unique password. RevelaCode stores a password hash; neither the inviting administrator nor the support team will see this password.</p>
              <button type="submit" disabled={accepting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"><UserRoundPlus size={17} />{accepting ? "Activating account…" : "Accept invitation and activate account"}</button>
            </form>
          ) : null}

          {messageType === "success" && !invitation ? (
            <button type="button" onClick={() => navigate("/pages")} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950">Continue to sign in</button>
          ) : null}

          <div className="border-t border-slate-100 pt-4 text-center text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">An invitation does not grant ecosystem-owner permissions. Contact the RevelaCode Administrator for changes to your assigned duties.</div>
          {!invitation && messageType === "error" && !loading ? <p className="text-center text-sm"><Link to="/pages" className="font-bold text-emerald-700 underline dark:text-emerald-300">Return to sign in</Link></p> : null}
        </div>
      </section>
    </main>
  );
}
