import React, { useMemo, useState } from "react";
import { ArrowLeft, Check, Copy, Link2, MessageCircle, Share2, Users } from "lucide-react";

export default function CommunityInviteMembers({ onBack }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const url = new URL("/", window.location.origin);
    url.searchParams.set("join", "community");
    url.searchParams.set("source", "member-invite");
    return url.toString();
  }, []);
  const message = useMemo(() => `You're invited to Jumuiya Community — a place to connect with people, knowledge, groups and opportunities. Join here: ${inviteUrl}`, [inviteUrl]);
  const copy = async () => {
    setError("");
    try {
      if (typeof navigator === "undefined" || typeof navigator.clipboard?.writeText !== "function") {
        throw new Error("Clipboard access is unavailable in this browser. Select and copy the invitation text below.");
      }
      await navigator.clipboard.writeText(message);
      setCopied(true);
      if (typeof window !== "undefined") window.setTimeout(() => setCopied(false), 2400);
    } catch (copyError) {
      setError(copyError?.message || "Copy was blocked by your browser. Select and copy the invitation text below.");
    }
  };
  const share = async () => {
    setError("");
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: "Join Jumuiya Community", text: message, url: inviteUrl });
      } else {
        await copy();
      }
    } catch (e) {
      if (e?.name !== "AbortError") setError("Sharing is unavailable in this browser. Copy the invitation instead.");
    }
  };
  const whatsapp = () => {
    setError("");
    try {
      const url = new URL("https://wa.me/");
      url.searchParams.set("text", message);
      if (typeof window === "undefined" || typeof window.open !== "function") {
        throw new Error("WhatsApp sharing is unavailable in this browser.");
      }
      window.open(url.toString(), "_blank", "noopener,noreferrer");
    } catch (shareError) {
      setError(shareError?.message || "Unable to open WhatsApp sharing. Copy the invitation instead.");
    }
  };
  return <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
    <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#081b2e] via-[#123b46] to-[#08745d] p-6 text-white shadow-xl sm:p-9"><div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-cyan-300/15 blur-3xl"/><button type="button" onClick={() => { if (typeof onBack === "function") onBack(); }} className="relative inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white/85 hover:bg-white/15"><ArrowLeft size={14}/> Community home</button><div className="relative mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10"><Users size={26}/></div><p className="relative mt-5 text-[11px] font-black uppercase tracking-[.2em] text-emerald-200">Grow the circle</p><h1 className="relative mt-2 text-3xl font-black tracking-tight sm:text-4xl">Good communities grow by invitation.</h1><p className="relative mt-3 max-w-2xl text-sm leading-6 text-white/70">Invite friends, neighbours, classmates and business owners to join conversations and opportunities that matter.</p></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-7"><h2 className="text-lg font-black text-slate-900 dark:text-white">Your invitation</h2><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Share this invitation with someone who is not yet a member.</p><div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200">{message}</div><p className="mt-3 break-all text-xs text-slate-500">{inviteUrl}</p>{error ? <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{error}</p>:null}<div className="mt-5 grid gap-3 sm:grid-cols-3"><button type="button" onClick={copy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-xs font-black text-white hover:bg-emerald-800">{copied?<Check size={16}/>:<Copy size={16} />}{copied?"Copied invitation":"Copy invitation"}</button><button type="button" onClick={whatsapp} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-800 hover:bg-emerald-100"><MessageCircle size={16}/> Share on WhatsApp</button><button type="button" onClick={share} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-800"><Share2 size={16}/> More share options</button></div><div className="mt-5 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-900"><Link2 size={16} className="mt-0.5 shrink-0"/><p>This is a shareable community entry link. Tracked invitations, invite codes and delivery receipts require a dedicated invitation API, which is not currently exposed by the frontend's Community contract.</p></div></section>
  </div>;
}
