import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2, GraduationCap, Mail, RefreshCw, ShieldCheck } from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useElimuApi } from "@/services/elimuApi.jsx";

function invitationTokenFromUrl() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("token") || "";
}

export default function ElimuInvitationPage() {
  const auth = useAuth();
  const api = useElimuApi();
  // Keep the original token in component state even after removing it from the URL.
  const [token] = useState(invitationTokenFromUrl);
  const attemptedToken = useRef("");
  const [retryVersion, setRetryVersion] = useState(0);
  const [status, setStatus] = useState("checking");
  const [error, setError] = useState("");
  const [membership, setMembership] = useState(null);

  const invitedAccountEmail = auth?.user?.email || auth?.user?.contact || "";

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setError("The invitation link does not contain a valid token. Ask the school owner to send a new invitation.");
      return;
    }

    if (!auth?.isAuthenticated) {
      setStatus("signin");
      return;
    }

    const requestKey = `${token}:${retryVersion}`;
    if (attemptedToken.current === requestKey) return;
    attemptedToken.current = requestKey;
    setStatus("accepting");
    setError("");

    let cancelled = false;
    api.acceptStaffInvitation({ token })
      .then((response) => {
        if (cancelled) return;
        let data = response;
        for (let index = 0; index < 5; index += 1) {
          if (!data || typeof data !== "object" || Array.isArray(data)) break;
          if (Object.prototype.hasOwnProperty.call(data, "data")) data = data.data;
          else if (Object.prototype.hasOwnProperty.call(data, "result")) data = data.result;
          else break;
        }
        setMembership(data || null);
        setStatus("accepted");
        if (typeof window !== "undefined") {
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete("token");
          window.history.replaceState({}, "", `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
        }
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(requestError?.message || "The invitation could not be accepted.");
        setStatus("error");
      });

    return () => { cancelled = true; };
  }, [token, auth?.isAuthenticated, api.acceptStaffInvitation, retryVersion]);

  const retry = () => {
    attemptedToken.current = "";
    setError("");
    setStatus("checking");
    setRetryVersion((value) => value + 1);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <section className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950">
        <div className="bg-slate-950 p-6 text-white sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-200"><GraduationCap size={25} /></span>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-blue-200">RevelaCode Elimu</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">School staff invitation</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">Join your school workspace using the RevelaCode account tied to the invited email address.</p>
        </div>

        <div className="space-y-5 p-6 sm:p-8">
          {status === "accepting" || status === "checking" ? (
            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200"><RefreshCw size={19} className="mt-0.5 shrink-0 animate-spin" /><div><p className="font-semibold">Accepting invitation…</p><p className="mt-1 leading-5">We are validating the invitation and connecting the account to the school. Please keep this page open.</p></div></div>
          ) : null}

          {status === "signin" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"><div className="flex items-start gap-3"><Mail size={19} className="mt-0.5 shrink-0" /><div><p className="font-semibold">Sign in or register to continue</p><p className="mt-1 leading-5">Use your verified RevelaCode account for the invited email address. If you are in a guest session or the wrong account, switch accounts below. The invitation link will be preserved while you sign in.</p></div></div>{typeof auth?.logout === "function" && <button type="button" onClick={() => void auth.logout()} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-amber-300 bg-white px-3 py-2 font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-slate-950 dark:text-amber-200 dark:hover:bg-amber-950/50">Switch account / open sign-in</button>}</div>
          )}

          {status === "accepted" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"><div className="flex items-start gap-3"><CheckCircle2 size={20} className="mt-0.5 shrink-0" /><div><p className="font-bold">Invitation accepted successfully</p><p className="mt-1 leading-5">Your RevelaCode account is now linked to the school. Elimu will enforce the permissions assigned to your role.</p></div></div><Link to="/jumuiya/elimu" className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800">Open Elimu workspace <ArrowRight size={16} /></Link></div>
          )}

          {(status === "error" || status === "invalid") && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-950 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"><div className="flex items-start gap-3"><AlertCircle size={19} className="mt-0.5 shrink-0" /><div><p className="font-bold">Invitation could not be accepted</p><p className="mt-1 leading-5">{error}</p>{/email/i.test(error) && <p className="mt-2 leading-5">Sign in with the exact email address the school invited, then open the original invitation link again.</p>}</div></div><div className="mt-4 flex flex-wrap gap-2">{status === "error" && <button type="button" onClick={retry} className="rounded-lg border border-red-300 px-3 py-2 font-semibold hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-950/50">Try again</button>}{/email/i.test(error) && typeof auth?.logout === "function" && <button type="button" onClick={() => void auth.logout()} className="rounded-lg border border-red-300 bg-white px-3 py-2 font-semibold hover:bg-red-100 dark:border-red-800 dark:bg-slate-950 dark:hover:bg-red-950/50">Switch account / open sign-in</button>}</div></div>
          )}

          {auth?.isAuthenticated && invitedAccountEmail && status !== "accepted" && <p className="text-xs text-slate-500 dark:text-slate-400">Signed-in email: <strong className="break-all text-slate-700 dark:text-slate-200">{invitedAccountEmail}</strong></p>}
          <div className="flex items-start gap-2 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400"><ShieldCheck size={15} className="mt-0.5 shrink-0" /><p>Invitations are single-use and expire. A school owner can revoke a pending invitation. Accepting adds school membership; it does not create a second RevelaCode account.</p></div>
        </div>
      </section>
    </main>
  );
}
