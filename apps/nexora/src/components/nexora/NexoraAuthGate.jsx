import React, { useState } from "react";
import { ArrowRight, Eye, EyeOff, Gamepad2, LockKeyhole, Mail, User, Zap } from "lucide-react";

export default function NexoraAuthGate({ apiBase, onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!apiBase) {
      setError("NEXORA service URL is not configured.");
      return;
    }
    if (mode === "register" && password.length < 10) {
      setError("Use a password with at least 10 characters.");
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(apiBase + (mode === "register" ? "/api/v1/auth/register" : "/api/v1/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(mode === "register"
          ? { display_name: displayName.trim(), email: email.trim(), password }
          : { email: email.trim(), password }),
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = payload?.detail;
        throw new Error(typeof detail === "string" ? detail : detail?.message || "NEXORA could not authenticate this account.");
      }
      if (!payload?.access_token || !payload?.user?.id) {
        throw new Error("NEXORA returned an incomplete account session. Please try again.");
      }
      onAuthenticated(payload);
    } catch (requestError) {
      setError(requestError?.message || "NEXORA authentication failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center overflow-y-auto bg-[#05090f] px-4 py-10 text-slate-100">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-cyan-900/60 bg-[#0a111a] shadow-2xl shadow-black/50 lg:grid-cols-[1fr_440px]">
        <section className="relative hidden min-h-[600px] flex-col justify-between overflow-hidden border-r border-cyan-900/40 bg-[radial-gradient(circle_at_50%_35%,rgba(8,145,178,.22),transparent_45%),linear-gradient(145deg,#09121d,#070b12)] p-10 lg:flex">
          <div className="absolute -left-24 top-32 h-72 w-72 rounded-full border border-cyan-400/10" />
          <div className="absolute -left-12 top-44 h-48 w-48 rounded-full border border-cyan-400/10" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/50 bg-cyan-400/10 text-cyan-200"><Gamepad2 size={25}/></div>
            <div><div className="text-xl font-black tracking-[.2em]">NEXORA</div><div className="text-[9px] font-bold tracking-[.38em] text-amber-200">STUDIO PRO</div></div>
          </div>
          <div className="relative max-w-md">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-black tracking-[.25em] text-cyan-300"><Zap size={14}/> INDEPENDENT GAME PRODUCTION</div>
            <h1 className="text-4xl font-black leading-tight text-white">Your worlds.<br/>Your pipeline.<br/><span className="text-cyan-300">Your account.</span></h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">Design, build, test and export games from one production workspace. Your NEXORA identity and subscription are separate from RevelaCode.</p>
          </div>
          <div className="relative flex flex-wrap gap-2 text-[9px] font-bold tracking-wider text-slate-500"><span className="border border-slate-700 px-3 py-2">3D ASSET FACTORY</span><span className="border border-slate-700 px-3 py-2">GODOT PIPELINE</span><span className="border border-slate-700 px-3 py-2">PC + MOBILE EXPORTS</span></div>
        </section>

        <section className="flex min-h-[600px] flex-col justify-center p-6 sm:p-10">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/50 bg-cyan-400/10 text-cyan-200"><Gamepad2 size={22}/></div>
            <div><div className="text-lg font-black tracking-[.18em]">NEXORA</div><div className="text-[9px] font-bold tracking-[.3em] text-amber-200">STUDIO PRO</div></div>
          </div>
          <div className="mb-2 text-[10px] font-black tracking-[.24em] text-cyan-300">{mode === "login" ? "WELCOME BACK" : "CREATE YOUR ACCOUNT"}</div>
          <h2 className="text-3xl font-black text-white">{mode === "login" ? "Sign in to NEXORA" : "Start building in NEXORA"}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">This is an independent NEXORA account. Your RevelaCode credentials are not used here.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === "register" && <label className="block text-xs font-bold text-slate-300">DISPLAY NAME<div className="mt-2 flex items-center gap-2 border border-slate-700 bg-[#070c12] px-3"><User size={16} className="text-slate-500"/><input required minLength={2} maxLength={80} autoComplete="name" value={displayName} onChange={(event)=>setDisplayName(event.target.value)} placeholder="Your name" className="min-h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"/></div></label>}
            <label className="block text-xs font-bold text-slate-300">EMAIL ADDRESS<div className="mt-2 flex items-center gap-2 border border-slate-700 bg-[#070c12] px-3"><Mail size={16} className="text-slate-500"/><input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event)=>setEmail(event.target.value)} placeholder="you@example.com" className="min-h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"/></div></label>
            <label className="block text-xs font-bold text-slate-300">PASSWORD<div className="mt-2 flex items-center gap-2 border border-slate-700 bg-[#070c12] px-3"><LockKeyhole size={16} className="text-slate-500"/><input required minLength={mode === "register" ? 10 : 1} maxLength={128} autoComplete={mode === "register" ? "new-password" : "current-password"} type={showPassword ? "text" : "password"} value={password} onChange={(event)=>setPassword(event.target.value)} placeholder={mode === "register" ? "At least 10 characters" : "Your password"} className="min-h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"/><button type="button" onClick={()=>setShowPassword((value)=>!value)} aria-label={showPassword ? "Hide password" : "Show password"} className="p-2 text-slate-500 hover:text-cyan-200">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>
            {mode === "register" && <label className="block text-xs font-bold text-slate-300">CONFIRM PASSWORD<div className="mt-2 flex items-center gap-2 border border-slate-700 bg-[#070c12] px-3"><LockKeyhole size={16} className="text-slate-500"/><input required type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event)=>setConfirmPassword(event.target.value)} placeholder="Re-enter your password" className="min-h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"/></div></label>}
            {error && <div role="alert" className="border border-rose-800/70 bg-rose-950/30 px-3 py-2 text-xs leading-5 text-rose-200">{error}</div>}
            <button disabled={busy} type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 bg-cyan-300 px-4 text-xs font-black tracking-[.13em] text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60">{busy ? "CONNECTING..." : mode === "login" ? "SIGN IN" : "CREATE NEXORA ACCOUNT"} {!busy && <ArrowRight size={16}/>}</button>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-5 text-center text-xs text-slate-500">{mode === "login" ? "New to NEXORA?" : "Already have a NEXORA account?"} <button type="button" disabled={busy} onClick={()=>{setMode((value)=>value==="login"?"register":"login");setError("");}} className="ml-1 font-black text-cyan-300 hover:text-cyan-100">{mode === "login" ? "Create account" : "Sign in"}</button></div>
          <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-slate-600"><LockKeyhole size={12}/> Independent NEXORA account · secure session</div>
        </section>
      </div>
    </main>
  );
}
