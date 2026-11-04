import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2, Mail, RefreshCw, ShieldCheck, Users } from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

function invitationDetailsFromUrl() {
  if (typeof window === "undefined") return { token: "", email: "" };
  const params = new URLSearchParams(window.location.search);
  return {
    token: params.get("token") || "",
    email: (params.get("email") || "").trim().toLowerCase(),
  };
}

function unwrap(value) {
  let current = value;
  for (let index = 0; index < 6; index += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return current;
    if (Object.prototype.hasOwnProperty.call(current, "data")) current = current.data;
    else if (Object.prototype.hasOwnProperty.call(current, "result")) current = current.result;
    else return current;
  }
  return current;
}

export default function BiasharaInvitationPage() {
  const auth = useAuth();
  const api = useJumuiyaApi();
  const [details] = useState(invitationDetailsFromUrl);
  const attempted = useRef("");
  const [status, setStatus] = useState("checking");
  const [error, setError] = useState("");
  const [membership, setMembership] = useState(null);
  const [retryVersion, setRetryVersion] = useState(0);

  const accountEmail = String(auth?.user?.email || auth?.user?.contact || "").trim().toLowerCase();
  const emailMatches = !details.email || accountEmail === details.email;

  useEffect(() => {
    if (!details.token) {
      setStatus("invalid");
      setError("The invitation link does not contain a valid one-time token. Ask the business owner to create a new invitation.");
      return;
    }
    if (!auth?.isAuthenticated) {
      setStatus("signin");
      return;
    }
    if (details.email && !emailMatches) {
      setStatus("wrong_account");
      setError("This invitation was issued to " + details.email + ". Sign out and use the RevelaCode account registered with that exact email address.");
      return;
    }

    const requestKey = details.token + ":" + retryVersion;
    if (attempted.current === requestKey) return;
    attempted.current = requestKey;
    setStatus("accepting");
    setError("");
    let cancelled = false;

    api.acceptBiasharaTeamInvitation({ token: details.token })
      .then((response) => {
        if (cancelled) return;
        setMembership(unwrap(response) || null);
        setStatus("accepted");
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("token");
        cleanUrl.searchParams.delete("email");
        window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(requestError?.message || "The business invitation could not be accepted.");
        setStatus("error");
      });

    return () => { cancelled = true; };
  }, [details.token, details.email, emailMatches, auth?.isAuthenticated, api.acceptBiasharaTeamInvitation, retryVersion]);

  const retry = () => {
    attempted.current = "";
    setError("");
    setStatus("checking");
    setRetryVersion((value) => value + 1);
  };

  const businessName = membership?.business?.name || "the business";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 py-10 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/20">
      <section className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-950">
        <div className="bg-gradient-to-br from-slate-950 via-emerald-900 to-teal-800 p-6 text-white sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><Users size={25} /></span>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">RevelaCode Biashara</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Business team invitation</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">Join a verified company workspace using the RevelaCode account associated with the invited email address.</p>
        </div>

        <div className="space-y-5 p-6 sm:p-8">
          {(status === "checking" || status === "accepting") && (
            <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
              <RefreshCw size={19} className="mt-0.5 shrink-0 animate-spin" />
              <div><p className="font-semibold">Validating invitation…</p><p className="mt-1 leading-5">We are checking the one-time token, invited email, and company access status.</p></div>
            </div>
          )}

          {status === "signin" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <div className="flex items-start gap-3"><Mail size={19} className="mt-0.5 shrink-0" /><div>
                <p className="font-semibold">Sign in or register to continue</p>
                <p className="mt-1 leading-5">Use the exact email address the business invited. After signing in, reopen this same invitation link to accept it.</p>
                {details.email && <p className="mt-2 break-all font-semibold">Invited email: {details.email}</p>}
              </div></div>
              <Link to="/login" className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-amber-300 bg-white px-3 py-2 font-semibold text-amber-950 hover:bg-amber-100 dark:border-amber-800 dark:bg-slate-950 dark:text-amber-200">Open sign in</Link>
            </div>
          )}

          {status === "wrong_account" && (
            <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <div className="flex items-start gap-3"><AlertCircle size={19} className="mt-0.5 shrink-0" /><div>
                <p className="font-bold">Different account signed in</p>
                <p className="mt-1 leading-5">{error}</p>
                <p className="mt-2 leading-5">No business membership has been created. Switch accounts, then reopen the invitation link.</p>
              </div></div>
              {typeof auth?.logout === "function" && <button type="button" onClick={() => void auth.logout()} className="mt-4 rounded-lg border border-amber-300 bg-white px-3 py-2 font-semibold text-amber-950 hover:bg-amber-100 dark:border-amber-800 dark:bg-slate-950 dark:text-amber-200">Sign out and switch account</button>}
            </div>
          )}

          {status === "accepted" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
              <div className="flex items-start gap-3"><CheckCircle2 size={20} className="mt-0.5 shrink-0" /><div>
                <p className="font-bold">Business invitation accepted</p>
                <p className="mt-1 leading-5">Your account now has the invited company role in {businessName}. Biashara will enforce that role's server-side permissions.</p>
              </div></div>
              <Link to="/app?hub=biashara" className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800">Open Biashara workspace <ArrowRight size={16} /></Link>
            </div>
          )}

          {(status === "error" || status === "invalid") && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-950 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
              <div className="flex items-start gap-3"><AlertCircle size={19} className="mt-0.5 shrink-0" /><div><p className="font-bold">Invitation could not be accepted</p><p className="mt-1 leading-5">{error}</p></div></div>
              {status === "error" && <button type="button" onClick={retry} className="mt-4 rounded-lg border border-red-300 px-3 py-2 font-semibold hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-950/50">Try again</button>}
            </div>
          )}

          {auth?.isAuthenticated && accountEmail && status !== "accepted" && <p className="text-xs text-slate-500 dark:text-slate-400">Signed-in email: <strong className="break-all text-slate-700 dark:text-slate-200">{accountEmail}</strong></p>}
          <div className="flex items-start gap-2 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400"><ShieldCheck size={15} className="mt-0.5 shrink-0" /><p>Invitations are single-use and expire after 30 days. Acceptance does not create a second RevelaCode account. The invited account must match the recipient email.</p></div>
        </div>
      </section>
    </main>
  );
}
