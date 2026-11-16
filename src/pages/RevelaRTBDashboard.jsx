import React, { useCallback, useEffect, useState } from "react";
import { readAccessToken, readTokenType } from "@/auth/tokenStorage.mjs";
import { useAuth } from "@/context/AuthContext.jsx";
import { Activity, BrainCircuit, RefreshCw, ShieldCheck, Wrench, FlaskConical, Send, AlertTriangle, CheckCircle2 } from "lucide-react";

const API_BASE = String(import.meta.env.VITE_REVELAAI_API_URL || import.meta.env.VITE_REVELAAI_API_BASE || "https://revelaai.onrender.com").trim().replace(/\/+$/, "");

function headers(json = false) {
  const result = json ? { "Content-Type": "application/json" } : {};
  const token = readAccessToken();
  if (token) result.Authorization = readTokenType() + " " + token;
  return result;
}

function Metric({ label, value, detail }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">{label}</p><p className="mt-2 text-xl font-black text-slate-950 dark:text-white">{value}</p>{detail && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>}</div>;
}

export default function RevelaRTBDashboard() {
  const auth = useAuth();
  const authenticatedFetch = auth?.authFetch;
  const [dashboard, setDashboard] = useState(null);
  const [events, setEvents] = useState([]);
  const [cycle, setCycle] = useState(null);
  const [services, setServices] = useState(null);
  const [scanningServices, setScanningServices] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proposal, setProposal] = useState(null);
  const [notice, setNotice] = useState("");

  const request = useCallback(async (path, options = {}) => {
    const fetcher = typeof authenticatedFetch === "function" ? authenticatedFetch : fetch;
    const response = await fetcher(API_BASE + path, {
      ...options,
      cache: "no-store",
      headers: { ...headers(Boolean(options.body)), ...(options.headers || {}) },
    });
    let payload = {};
    try { payload = await response.json(); } catch { /* retain status fallback */ }
    if (!response.ok) throw new Error(payload?.error?.message || payload?.message || payload?.code || ("RTB request failed (" + response.status + ")"));
    return payload;
  }, [authenticatedFetch]);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const snapshot = await request("/api/rtb/dashboard");
      setDashboard(snapshot);
      try {
        const audit = await request("/api/rtb/events?limit=20");
        setEvents(Array.isArray(audit.events) ? audit.events : []);
      } catch {
        setEvents([]);
      }
    } catch (err) {
      setError(err?.message || "Could not load the Real-Time Brain control plane.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const scanServices = async () => {
    setScanningServices(true); setError("");
    try { const result = await request("/api/rtb/services"); setServices(result.services || null); }
    catch (err) { setError(err?.message || "Connected-core scan failed."); }
    finally { setScanningServices(false); }
  };

  const runCycle = async () => {
    setBusy(true); setError(""); setNotice(""); setCycle(null);
    try {
      const result = await request("/api/rtb/diagnostics/run", { method: "POST" });
      setCycle(result.cycle);
      setNotice("Read-only diagnostic cycle completed and its audit event was recorded.");
      await refresh();
    } catch (err) { setError(err?.message || "Diagnostics could not run."); }
    finally { setBusy(false); }
  };

  const submitProposal = async (event) => {
    event.preventDefault(); setBusy(true); setError(""); setNotice(""); setProposal(null);
    try {
      const result = await request("/api/rtb/evolution/proposals", {
        method: "POST",
        body: JSON.stringify({ title, description }),
      });
      setProposal(result.proposal);
      setTitle(""); setDescription("");
      setNotice("Upgrade proposal saved for human review. No code was changed or deployed.");
      await refresh();
    } catch (err) { setError(err?.message || "Proposal could not be saved."); }
    finally { setBusy(false); }
  };

  const policy = dashboard?.policy || {};
  const capabilities = dashboard?.capabilities?.capabilities || {};
  const cycleChecks = cycle?.checks || [];

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-5 text-white sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-cyan-200"><BrainCircuit className="h-4 w-4"/> Revela Real-Time Brain</div>
            <span className={"rounded-full border px-3 py-1 text-[10px] font-bold uppercase " + (dashboard?.enabled ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200" : "border-amber-300/30 bg-amber-400/10 text-amber-200")}>{loading ? "Connecting" : dashboard?.enabled ? "Enabled" : "Disabled"}</span>
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">Revela Eye: observe the connected brain.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">A unified operational view for the gateway and connected ZERO, Genesis/ONE and Infinite Mind/TWO cores. Network health scans are operator-triggered; all changes remain approval-gated.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={runCycle} disabled={busy || loading || !dashboard?.enabled} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-extrabold text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"><Activity className="h-4 w-4"/>{busy ? "Working…" : "Run diagnostics"}</button>
            <button onClick={refresh} disabled={busy || scanningServices} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-50"><RefreshCw className="h-4 w-4"/>Refresh</button>
            <button onClick={scanServices} disabled={busy || scanningServices || loading || !dashboard?.enabled} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-cyan-200/40 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-300/20 disabled:opacity-50"><Activity className="h-4 w-4"/>{scanningServices ? "Scanning cores…" : "Scan connected cores"}</button>
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
          <Metric label="Autonomy level" value={policy.current_level ?? "—"} detail="Observe and recommend by default"/>
          <Metric label="Automatic execution" value="Disabled" detail="No unattended production actions"/>
          <Metric label="Upgrade deployment" value="Human-gated" detail="No automatic merge or release"/>
        </div>
      </section>

      {error && <div role="alert" className="flex items-start gap-2 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/><span>{error}</span></div>}
      {notice && <div role="status" className="flex items-start gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0"/><span>{notice}</span></div>}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600"/><h3 className="font-black text-slate-900 dark:text-white">Autonomy Governor</h3></div>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Sensitive operations remain approval-gated even if a higher autonomy level is configured.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{(policy.human_approval_required_for || []).map(item => <div key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-slate-950 dark:text-slate-300">{String(item).replaceAll("_"," ")}</div>)}</div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center gap-2"><Wrench className="h-5 w-5 text-indigo-600"/><h3 className="font-black text-slate-900 dark:text-white">Capability inventory</h3></div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Source availability is not remote runtime health. Remote core probes remain in Core Mesh.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(capabilities).map(([key, item]) => <div key={key} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800"><div className="flex items-center justify-between gap-2"><span className="text-sm font-bold capitalize text-slate-900 dark:text-white">{key.replaceAll("_"," ")}</span><span className={"rounded-full px-2 py-1 text-[9px] font-black uppercase " + (item.source_available ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200")}>{item.source_available ? "Source found" : "Missing"}</span></div><p className="mt-1 text-[10px] text-slate-500">{item.runtime_health}</p></div>)}</div>
      </section>

      {services && <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-black text-slate-900 dark:text-white">Revela Eye · Connected core health</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Operator-triggered checks through the existing Core Mesh adapter · {services.checked_at}</p></div><span className={"rounded-full px-3 py-1 text-[10px] font-black uppercase " + (services.status === "online" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : services.status === "degraded" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200")}>{services.summary?.online ?? 0}/{services.summary?.total ?? 3} online</span></div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">{(services.services || []).map(service => <div key={service.id} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800"><div className="flex items-center justify-between gap-2"><span className="text-sm font-bold text-slate-900 dark:text-white">{service.name}</span><span className={"rounded-full px-2 py-1 text-[9px] font-black uppercase " + (service.reachable ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200")}>{service.status}</span></div><p className="mt-1 text-[10px] font-semibold text-slate-500">{service.role}</p><p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{service.message}</p>{!service.configured && <p className="mt-2 text-[10px] font-bold text-amber-700 dark:text-amber-300">Endpoint not configured</p>}</div>)}</div>
        <p className="mt-3 text-[10px] text-slate-500">Health scan only. No core commands, source changes, repairs or deployments were executed.</p>
      </section>}
      {cycle && <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-black text-slate-900 dark:text-white">Latest diagnostic cycle</h3><span className="text-[10px] font-bold uppercase text-slate-500">{cycle.status}</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{cycleChecks.map(check => <div key={check.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-slate-800 dark:text-slate-200">{check.id.replaceAll("_"," ")}</span><span className="text-[10px] font-black uppercase text-slate-500">{check.status}</span></div><p className="mt-1 text-[10px] text-slate-500">{check.detail}</p></div>)}</div><p className="mt-3 text-[10px] text-slate-500">Cycle {cycle.cycle_id} · read-only · no source mutations or outbound network calls.</p></section>}

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <form onSubmit={submitProposal} className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center gap-2"><FlaskConical className="h-5 w-5 text-violet-600"/><h3 className="font-black text-slate-900 dark:text-white">Evolution proposal</h3></div>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Describe an improvement for isolated engineering and review. This endpoint stores a proposal only; it does not write code.</p>
          <label className="mt-4 block text-xs font-bold text-slate-700 dark:text-slate-300">Proposal title</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} maxLength={120} required className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="e.g. Improve gateway recovery observability"/>
          <label className="mt-3 block text-xs font-bold text-slate-700 dark:text-slate-300">Technical description</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} maxLength={2000} required rows={4} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="Problem, expected outcome, constraints and verification criteria…"/>
          <button disabled={busy || !title.trim() || !description.trim()} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50"><Send className="h-4 w-4"/>Submit for review</button>
          {proposal && <p className="mt-3 break-all text-xs text-emerald-700 dark:text-emerald-300">Created {proposal.proposal_id} · {proposal.status}</p>}
        </form>
        <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5"><h3 className="font-black text-slate-900 dark:text-white">Recent RTB audit events</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Operator-only, privacy-minimized event history.</p><div className="mt-4 space-y-2">{events.length ? events.map((event,index)=><div key={event.cycle_id || index} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-slate-800 dark:text-slate-200">{event.cycle_id || "Upgrade proposal"}</span><span className="text-[9px] font-black uppercase text-slate-500">{event.status || "recorded"}</span></div><p className="mt-1 text-[10px] text-slate-500">{event.finding_count ?? "—"} findings · {event.created_at}</p></div>) : <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500 dark:bg-slate-950">No RTB events recorded yet.</p>}</div></section>
      </section>
    </div>
  );
}
