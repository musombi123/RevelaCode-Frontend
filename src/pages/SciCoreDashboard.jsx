import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, BookOpen, CheckCircle2, Cpu, FlaskConical,
  RefreshCw, Search, ShieldCheck, Siren, TerminalSquare, Wifi, XCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";

const API_BASE = String(import.meta.env.VITE_REVELAAI_API_BASE || "").replace(/\/+$/, "");
const cn = (...parts) => parts.filter(Boolean).join(" ");
const pretty = (value) => typeof value === "string" ? value : JSON.stringify(value ?? {}, null, 2);

function Metric({ label, value, detail, icon: Icon, tone = "cyan" }) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-400/5 text-cyan-200",
    green: "border-emerald-400/20 bg-emerald-400/5 text-emerald-200",
    amber: "border-amber-400/20 bg-amber-400/5 text-amber-200",
    violet: "border-violet-400/20 bg-violet-400/5 text-violet-200",
  };
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-white">{value ?? "—"}</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">{detail}</p>
        </div>
        <div className={cn("rounded-xl border p-2.5", tones[tone] || tones.cyan)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, icon: Icon, children, action }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1220]">
      <div className="flex flex-col gap-3 border-b border-slate-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-cyan-300">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function ResultBlock({ value, empty = "No result yet. Run this tool to see verified API output." }) {
  return (
    <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-[#060a12] p-3 text-[11px] leading-5 text-slate-300">
      {value ? pretty(value) : empty}
    </pre>
  );
}

export default function SciCoreDashboard() {
  const auth = useAuth();
  const user = auth?.user;
  const [status, setStatus] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [researchQuery, setResearchQuery] = useState("");
  const [researchTopic, setResearchTopic] = useState("general");
  const [prototypeDomain, setPrototypeDomain] = useState("software");
  const [prototypeSpec, setPrototypeSpec] = useState("");
  const [disasterType, setDisasterType] = useState("db_down");
  const [researchResult, setResearchResult] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [prototypeResult, setPrototypeResult] = useState(null);
  const [disasterResult, setDisasterResult] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const getToken = useCallback(async () => {
    if (typeof auth?.getAccessToken === "function") return await auth.getAccessToken();
    return user?.accessToken || user?.access_token || "";
  }, [auth, user]);

  const request = useCallback(async (path, options = {}) => {
    if (!API_BASE) throw new Error("VITE_REVELAAI_API_BASE is not configured for the frontend deployment.");
    const accessToken = await getToken();
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${String(accessToken).replace(/^Bearer\\s+/i, "")}` } : {}),
        ...(options.headers || {}),
      },
    });
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { detail: raw }; }
    if (!response.ok) {
      const message = data?.error || data?.detail || data?.message || `Request failed (${response.status})`;
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }
    return data;
  }, [getToken]);

  const refresh = useCallback(async () => {
    setError("");
    const results = await Promise.allSettled([
      request("/api/sci/shield/status"),
      request("/api/sci/shield/dashboard"),
    ]);
    if (results[0].status === "fulfilled") setStatus(results[0].value);
    if (results[1].status === "fulfilled") setDashboard(results[1].value);
    const failures = results.filter((x) => x.status === "rejected");
    setLastUpdated(new Date());
    if (failures.length) setError(failures.map((x) => x.reason?.message || "Sci-Core endpoint unavailable").join(" · "));
    if (results.every((x) => x.status === "fulfilled")) setNotice("Live status refreshed from RevelaAI Sci-Core.");
  }, [request]);

  useEffect(() => { refresh(); }, [refresh]);

  const runAction = async (key, path, body, setter, successText) => {
    setBusy(key); setError(""); setNotice("");
    try {
      const result = await request(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setter(result);
      setNotice(successText);
      await refresh();
    } catch (e) {
      setError(`${key}: ${e.message}`);
    } finally {
      setBusy("");
    }
  };

  const counts = status?.counts || {};
  const threats = dashboard?.threats_last_24h ?? counts.threats ?? "—";
  const researchCount = dashboard?.research_count ?? counts.research ?? "—";
  const disasterCount = dashboard?.disasters_handled ?? counts.disasters ?? "—";
  const shieldState = status?.status || dashboard?.status || "awaiting connection";
  const scanFindings = useMemo(() => {
    if (!scanResult) return 0;
    return (scanResult.vulnerabilities?.length || 0) + (scanResult.threats?.length || 0) + (scanResult.cves?.length || 0);
  }, [scanResult]);

  return (
    <div className="min-w-0 space-y-5 text-slate-100">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#10233b] via-[#0b1424] to-[#070b13] p-5 shadow-2xl sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Sci-Core · Defensive Operations
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-4xl">Research. Protect. Recover.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              A central console for civilian science research, defensive security scans, disaster simulations and safe prototype generation. Data below is taken from API responses; unavailable services are reported, not simulated.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold", /active/i.test(shieldState) ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-amber-400/20 bg-amber-400/10 text-amber-200")}>
              <ShieldCheck className="h-4 w-4" /> {shieldState.replaceAll("_", " ")}
            </span>
            <button onClick={refresh} disabled={!!busy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:border-cyan-300/40 hover:bg-slate-800 disabled:opacity-50">
              <RefreshCw className="h-4 w-4" /> Refresh status
            </button>
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5"><Wifi className="h-3.5 w-3.5" /> API: {API_BASE || "not configured"}</span>
          <span>Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "not yet"}</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Defensive-only controls</span>
        </div>
      </div>

      {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div className="min-w-0"><p className="font-bold">Action needs attention</p><p className="mt-1 break-words text-xs leading-5">{error}</p></div><button onClick={() => setError("")} className="ml-auto text-rose-200" aria-label="Dismiss error"><XCircle className="h-4 w-4" /></button></div>}
      {notice && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs leading-5 text-emerald-200"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{notice}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        <Metric label="Threats · last 24 hours" value={threats} detail="Persisted threat records reported by the API" icon={Activity} tone="amber" />
        <Metric label="Research records" value={researchCount} detail="Saved research runs in Sci-Core storage" icon={BookOpen} tone="cyan" />
        <Metric label="Disaster records" value={disasterCount} detail="Recorded simulation and recovery diagnostics" icon={Siren} tone="violet" />
        <Metric label="Shield state" value={/active/i.test(shieldState) ? "Active" : "Check API"} detail="Security scans do not automatically change firewall rules" icon={ShieldCheck} tone="green" />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 2xl:grid-cols-2">
        <Panel title="Live Research Engine" subtitle="Query open research sources and save a traceable result." icon={Search}>
          <form onSubmit={(e) => { e.preventDefault(); if (researchQuery.trim()) runAction("research", "/api/sci/research", { query: researchQuery.trim(), topic: researchTopic }, setResearchResult, "Research request completed; inspect returned sources and storage status."); }} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">Research question
              <textarea value={researchQuery} onChange={(e) => setResearchQuery(e.target.value)} maxLength={500} rows={3} placeholder="e.g. Low-cost soil moisture sensing for small farms in Kenya" className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/60" />
            </label>
            <label className="block text-xs font-semibold text-slate-300">Topic
              <select value={researchTopic} onChange={(e) => setResearchTopic(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white">
                <option value="general">General science</option><option value="agriculture">Agriculture</option><option value="electronics">Electronics</option><option value="software">Software engineering</option><option value="hardware">Hardware research</option><option value="energy">Energy and sustainability</option>
              </select>
            </label>
            <button disabled={!!busy || researchQuery.trim().length < 1} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"><Search className="h-4 w-4" />{busy === "research" ? "Researching…" : "Run live research"}</button>
          </form>
          <div className="mt-4"><ResultBlock value={researchResult} /></div>
          {researchResult?.sources?.length > 0 && <div className="mt-3 space-y-2">{researchResult.sources.map((source, i) => <a key={source.url || i} href={source.url} target="_blank" rel="noreferrer" className="block break-words rounded-lg border border-slate-800 p-3 text-xs text-cyan-200 hover:bg-slate-900">{source.title || source.provider} <span className="text-slate-500">· {source.provider}</span></a>)}</div>}
        </Panel>

        <Panel title="Defensive Security Shield" subtitle="Scan code patterns, available auth logs and dependency advisories." icon={ShieldCheck} action={<button onClick={() => runAction("scan", "/api/sci/shield/scan", {}, setScanResult, "Security scan response received. Review each finding before applying changes.")} disabled={!!busy} className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-400/30 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-400/10 disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5" />{busy === "scan" ? "Scanning…" : "Run scan"}</button>}>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3"><p className="text-[10px] text-slate-500">Code findings</p><p className="mt-1 text-xl font-black text-white">{scanResult?.vulnerabilities?.length ?? "—"}</p></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3"><p className="text-[10px] text-slate-500">Auth threats</p><p className="mt-1 text-xl font-black text-white">{scanResult?.threats?.length ?? "—"}</p></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3"><p className="text-[10px] text-slate-500">Dependency alerts</p><p className="mt-1 text-xl font-black text-white">{scanResult?.cves?.length ?? "—"}</p></div>
          </div>
          {scanResult && <p className="mt-3 text-xs text-slate-400">{scanFindings} finding(s) returned · status: {scanResult.status || "scan returned"} · defensive_only: {String(scanResult.defensive_only)}</p>}
          <div className="mt-3"><ResultBlock value={scanResult} /></div>
          <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-[11px] leading-5 text-amber-100">Firewall and Nginx output is advisory text only. This dashboard does not auto-block IPs or apply system configuration.</p>
        </Panel>

        <Panel title="Disaster & Recovery Simulator" subtitle="Run controlled diagnostic scenarios and record the returned outcome." icon={Siren}>
          <form onSubmit={(e) => { e.preventDefault(); runAction("disaster", "/api/sci/disaster/simulate", { type: disasterType }, setDisasterResult, "Simulation response received and displayed."); }} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">Scenario
              <select value={disasterType} onChange={(e) => setDisasterType(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white">
                <option value="db_down">Database unavailable</option><option value="api_overload">API overload / throttle simulation</option><option value="memory_leak">High memory diagnostics</option>
              </select>
            </label>
            <button disabled={!!busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-100 hover:bg-amber-400/15 disabled:opacity-50"><Siren className="h-4 w-4" />{busy === "disaster" ? "Simulating…" : "Run diagnostic simulation"}</button>
          </form>
          <div className="mt-4"><ResultBlock value={disasterResult} /></div>
          <p className="mt-3 text-[11px] leading-5 text-slate-500">Simulations can create persistent audit records. They do not kill processes or force restarts; overload behavior depends on the backend throttle hook.</p>
        </Panel>

        <Panel title="Prototype Lab" subtitle="Generate a reviewable software or electronics concept; artifacts are not executed." icon={Cpu}>
          <form onSubmit={(e) => { e.preventDefault(); if (prototypeSpec.trim()) runAction("prototype", "/api/sci/lab/prototype", { domain: prototypeDomain, spec: prototypeSpec.trim() }, setPrototypeResult, "Prototype artifacts returned. Review them before any local testing or deployment."); }} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">Prototype domain
              <select value={prototypeDomain} onChange={(e) => setPrototypeDomain(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"><option value="software">Software</option><option value="hardware">Hardware</option><option value="electronics">Electronics</option></select>
            </label>
            <label className="block text-xs font-semibold text-slate-300">Specification
              <textarea value={prototypeSpec} onChange={(e) => setPrototypeSpec(e.target.value)} maxLength={800} rows={3} placeholder="Describe a civilian tool, sensor, or software prototype…" className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/60" />
            </label>
            <button disabled={!!busy || !prototypeSpec.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-violet-200 disabled:opacity-50"><FlaskConical className="h-4 w-4" />{busy === "prototype" ? "Generating…" : "Generate prototype"}</button>
          </form>
          <div className="mt-4"><ResultBlock value={prototypeResult} /></div>
          {prototypeResult?.artifacts && <div className="mt-3 space-y-2">{Object.entries(prototypeResult.artifacts).map(([name, content]) => <details key={name} className="rounded-xl border border-slate-800 bg-slate-950"><summary className="cursor-pointer px-3 py-3 text-xs font-bold text-cyan-200">{name}</summary><pre className="overflow-auto whitespace-pre-wrap break-words border-t border-slate-800 p-3 text-[11px] leading-5 text-slate-300">{content}</pre></details>)}</div>}
          <p className="mt-3 text-[11px] leading-5 text-slate-500">Generation status is review-required. Generated firmware/code is never run by this dashboard.</p>
        </Panel>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#0b1220] p-4 sm:p-5">
        <div className="flex items-start gap-3"><TerminalSquare className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" /><div><h3 className="text-sm font-bold text-white">Operations boundary</h3><p className="mt-1 text-xs leading-5 text-slate-500">All controls require the backend's administrator authorization. If requests return 401/403, check the signed-in account, server-side <code>META_ENGINEER_ADMIN_USER_IDS</code> allowlist, CORS, and <code>VITE_REVELAAI_API_BASE</code>. Sci-Core is designed for defensive monitoring and civilian research; no automatic firewall changes, code execution, or deployment are performed here.</p></div></div>
      </div>
    </div>
  );
}
