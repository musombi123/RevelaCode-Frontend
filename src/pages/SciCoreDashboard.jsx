import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, BookOpen, CheckCircle2, Cpu, FlaskConical,
  RefreshCw, Search, ShieldCheck, Siren, TerminalSquare, Wifi, XCircle,
  Ban, Unlock, Globe, Clock3, ShieldAlert
} from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";

const API_BASE = String(import.meta.env.VITE_REVELAAI_API_BASE || "https://revelaai.onrender.com").replace(/\/+$/, "");
const cn = (...parts) => parts.filter(Boolean).join(" ");
const pretty = (value) => typeof value === "string" ? value : JSON.stringify(value ?? {}, null, 2);

function Metric({ label, value, detail, icon: Icon, tone = "cyan" }) {
  const tones = {
    cyan: "border-accent/20 bg-cyan-400/5 text-accent",
    green: "border-success/20 bg-success/5 text-success",
    amber: "border-warning/20 bg-warning/5 text-warning",
    violet: "border-chart-3/20 bg-chart-3/5 text-chart-3",
  };
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-fg">{value ?? "—"}</p>
          <p className="mt-1 text-[11px] leading-5 text-muted">{detail}</p>
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
    <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-2 text-accent">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-fg">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-muted">{subtitle}</p>
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
    <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-code p-3 text-[11px] leading-5 text-fg-secondary">
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
  const [ipGuard, setIpGuard] = useState(null);
  const [manualIp, setManualIp] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockDuration, setBlockDuration] = useState("60");
  const [ipOperationResult, setIpOperationResult] = useState(null);

  const getToken = useCallback(async () => {
    if (typeof auth?.getAccessToken === "function") return await auth.getAccessToken();
    return user?.accessToken || user?.access_token || "";
  }, [auth, user]);

  const request = useCallback(async (path, options = {}) => {
    if (!API_BASE) throw new Error("RevelaAI API base is unavailable. Set VITE_REVELAAI_API_BASE to override the default service URL.");
    const accessToken = await getToken();
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${String(accessToken).replace(/^Bearer\s+/i, "")}` } : {}),
        ...(options.headers || {}),
      },
    });
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { detail: raw }; }
    if (!response.ok) {
      const message = data?.error || data?.detail || data?.message || data?.code || `Request failed (${response.status})`;
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
      request("/api/sci/ip-guard/status"),
    ]);
    if (results[0].status === "fulfilled") setStatus(results[0].value);
    if (results[1].status === "fulfilled") setDashboard(results[1].value);
    if (results[2].status === "fulfilled") setIpGuard(results[2].value);
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
      if (typeof setter === "function") setter(result);
      setNotice(successText);
      await refresh();
    } catch (e) {
      setError(`${key}: ${e.message}`);
    } finally {
      setBusy("");
    }
  };

  const submitIpBlock = async (event) => {
    event.preventDefault();
    const ip = manualIp.trim();
    const reason = blockReason.trim();
    if (!ip || reason.length < 8) return;
    if (!window.confirm(
      "Block " + ip + " at the RevelaAI application edge for " +
      blockDuration + " minutes? This does not change Render's host firewall."
    )) return;

    setBusy("ip-block");
    setError("");
    setNotice("");
    setIpOperationResult(null);
    try {
      const result = await request("/api/sci/ip-guard/block", {
        method: "POST",
        body: JSON.stringify({
          ip,
          reason,
          duration_minutes: Number(blockDuration),
          confirm: true,
        }),
      });
      setIpOperationResult(result);
      setNotice(result.message || (ip + " was blocked at the RevelaAI application edge."));
      setManualIp("");
      setBlockReason("");
      await refresh();
    } catch (e) {
      setError("IP block: " + e.message);
    } finally {
      setBusy("");
    }
  };

  const releaseIpBlock = async (ip) => {
    if (!window.confirm(
      "Release the active RevelaAI application-edge block for " + ip + "?"
    )) return;
    setBusy("ip-unblock:" + ip);
    setError("");
    setNotice("");
    try {
      const result = await request("/api/sci/ip-guard/unblock", {
        method: "POST",
        body: JSON.stringify({
          ip,
          reason: "Administrator reviewed the source and released the temporary block.",
        }),
      });
      setNotice(result.message || (ip + " was unblocked."));
      await refresh();
    } catch (e) {
      setError("IP unblock: " + e.message);
    } finally {
      setBusy("");
    }
  };

  const stageThreatIp = (threat) => {
    const candidate = String(threat?.ip || "").trim();
    if (!candidate) return;
    setManualIp(candidate);
    setBlockReason("Security scan reported repeated authentication failures from this source.");
    setIpOperationResult(null);
    document.getElementById("sci-ip-block-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const suspiciousIpCandidates = useMemo(() => {
    const seen = new Set();
    return (scanResult?.threats || []).filter((item) => {
      const ip = String(item?.ip || "").trim();
      if (!ip || seen.has(ip)) return false;
      seen.add(ip);
      return true;
    });
  }, [scanResult]);

  const counts = status?.counts || {};
  const threats = dashboard?.threats_last_24h ?? counts.threats ?? "—";
  const researchCount = dashboard?.research_count ?? counts.research ?? "—";
  const disasterCount = dashboard?.disasters_handled ?? counts.disasters ?? "—";
  const shieldState = status?.status || dashboard?.status || "awaiting connection";
  const ipProtectionReady = ipGuard?.persistent === true && ipGuard?.status === "active";
  const scanFindings = useMemo(() => {
    if (!scanResult) return 0;
    return (scanResult.vulnerabilities?.length || 0) + (scanResult.threats?.length || 0) + (scanResult.cves?.length || 0);
  }, [scanResult]);

  return (
    <div className="min-w-0 space-y-5 text-fg">
      <div className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-[#10233b] via-[#0b1424] to-[#070b13] p-5 shadow-2xl sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              Sci-Core · Defensive Operations
            </div>
            <h2 className="text-2xl font-black tracking-tight text-fg sm:text-4xl">Research. Protect. Recover.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-secondary">
              A central console for civilian science research, defensive security scans, disaster simulations and safe prototype generation. Data below is taken from API responses; unavailable services are reported, not simulated.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold", /active/i.test(shieldState) ? "border-success/20 bg-success/10 text-success" : "border-warning/20 bg-warning/10 text-warning")}>
              <ShieldCheck className="h-4 w-4" /> {shieldState.replaceAll("_", " ")}
            </span>
            <button onClick={refresh} disabled={!!busy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-xs font-bold text-fg transition hover:border-accent/40 hover:bg-surface-3 disabled:opacity-50">
              <RefreshCw className="h-4 w-4" /> Refresh status
            </button>
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5"><Wifi className="h-3.5 w-3.5" /> API: {API_BASE || "not configured"}</span>
          <span>Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "not yet"}</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Defensive-only controls</span>
        </div>
      </div>

      {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div className="min-w-0"><p className="font-bold">Action needs attention</p><p className="mt-1 break-words text-xs leading-5">{error}</p></div><button onClick={() => setError("")} className="ml-auto text-danger" aria-label="Dismiss error"><XCircle className="h-4 w-4" /></button></div>}
      {notice && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs leading-5 text-success"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{notice}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        <Metric label="Threats · last 24 hours" value={threats} detail="Persisted threat records reported by the API" icon={Activity} tone="amber" />
        <Metric label="Research records" value={researchCount} detail="Saved research runs in Sci-Core storage" icon={BookOpen} tone="cyan" />
        <Metric label="Disaster records" value={disasterCount} detail="Recorded simulation and recovery diagnostics" icon={Siren} tone="violet" />
        <Metric label="Shield state" value={/active/i.test(shieldState) ? "Active" : "Check API"} detail="Security scans do not automatically change firewall rules" icon={ShieldCheck} tone="green" />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 2xl:grid-cols-2">
        <Panel title="Live Research Engine" subtitle="Query open research sources and save a traceable result." icon={Search}>
          <form onSubmit={(e) => { e.preventDefault(); if (researchQuery.trim()) runAction("research", "/api/sci/research", { query: researchQuery.trim(), topic: researchTopic }, setResearchResult, "Research request completed; inspect returned sources and storage status."); }} className="space-y-3">
            <label className="block text-xs font-semibold text-fg-secondary">Research question
              <textarea value={researchQuery} onChange={(e) => setResearchQuery(e.target.value)} maxLength={500} rows={3} placeholder="e.g. Low-cost soil moisture sensing for small farms in Kenya" className="mt-2 w-full resize-y rounded-xl border border-line bg-input px-3 py-3 text-sm text-fg outline-none placeholder:text-muted focus:border-accent/60" />
            </label>
            <label className="block text-xs font-semibold text-fg-secondary">Topic
              <select value={researchTopic} onChange={(e) => setResearchTopic(e.target.value)} className="mt-2 w-full rounded-xl border border-line bg-input px-3 py-2.5 text-sm text-fg">
                <option value="general">General science</option><option value="agriculture">Agriculture</option><option value="electronics">Electronics</option><option value="software">Software engineering</option><option value="hardware">Hardware research</option><option value="energy">Energy and sustainability</option>
              </select>
            </label>
            <button disabled={!!busy || researchQuery.trim().length < 1} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-black text-inverse transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"><Search className="h-4 w-4" />{busy === "research" ? "Researching…" : "Run live research"}</button>
          </form>
          <div className="mt-4"><ResultBlock value={researchResult} /></div>
          {researchResult?.sources?.length > 0 && <div className="mt-3 space-y-2">{researchResult.sources.map((source, i) => <a key={source.url || i} href={source.url} target="_blank" rel="noreferrer" className="block break-words rounded-lg border border-line p-3 text-xs text-accent hover:bg-surface-2">{source.title || source.provider} <span className="text-muted">· {source.provider}</span></a>)}</div>}
        </Panel>

        <Panel title="Defensive Security Shield" subtitle="Scan code patterns, available auth logs and dependency advisories." icon={ShieldCheck} action={<button onClick={() => runAction("scan", "/api/sci/shield/scan", {}, setScanResult, "Security scan response received. Review each finding before applying changes.")} disabled={!!busy} className="inline-flex items-center justify-center gap-2 rounded-lg border border-accent/30 px-3 py-2 text-xs font-bold text-accent hover:bg-accent/10 disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5" />{busy === "scan" ? "Scanning…" : "Run scan"}</button>}>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-line bg-input p-3"><p className="text-[10px] text-muted">Code findings</p><p className="mt-1 text-xl font-black text-fg">{scanResult?.vulnerabilities?.length ?? "—"}</p></div>
            <div className="rounded-xl border border-line bg-input p-3"><p className="text-[10px] text-muted">Auth threats</p><p className="mt-1 text-xl font-black text-fg">{scanResult?.threats?.length ?? "—"}</p></div>
            <div className="rounded-xl border border-line bg-input p-3"><p className="text-[10px] text-muted">Dependency alerts</p><p className="mt-1 text-xl font-black text-fg">{scanResult?.cves?.length ?? "—"}</p></div>
          </div>
          {scanResult && <p className="mt-3 text-xs text-muted">{scanFindings} finding(s) returned · status: {scanResult.status || "scan returned"} · defensive_only: {String(scanResult.defensive_only)}</p>}
          <div className="mt-3"><ResultBlock value={scanResult} /></div>
          <p className="mt-3 rounded-lg border border-warning/20 bg-warning/5 p-3 text-[11px] leading-5 text-warning">Security findings remain reviewable. Confirmed IP blocks are enforced by RevelaAI's ASGI application edge only; they do not modify the Render host firewall or Nginx configuration.</p>
          {suspiciousIpCandidates.length > 0 && <div className="mt-3 rounded-xl border border-warning/20 bg-warning/5 p-3">
            <p className="mb-2 text-xs font-bold text-warning">Detected source IP candidates · review before blocking</p>
            <div className="space-y-2">
              {suspiciousIpCandidates.map((item) => <div key={item.ip} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-400/10 bg-input/50 p-2">
                <div className="min-w-0"><p className="font-mono text-xs text-fg">{item.ip}</p><p className="text-[10px] text-muted">{item.type || "Authentication anomaly"} · {item.count || 0} observed attempts · recommendation only</p></div>
                <button type="button" onClick={() => stageThreatIp(item)} disabled={!ipProtectionReady || !!busy} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-amber-400/30 px-3 text-[11px] font-bold text-warning hover:bg-warning/10 disabled:opacity-40"><Ban className="h-3.5 w-3.5"/> Review block</button>
              </div>)}
            </div>
          </div>
        </Panel>


      
        <Panel
          title="Live IP Protection"
          subtitle="Persistent exact-IP blocks, automatic brute-force response, audit history and administrator release."
          icon={Globe}
          action={<button type="button" onClick={refresh} disabled={!!busy} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 text-xs font-bold text-fg-secondary hover:bg-surface-3 disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5"/> Refresh</button>}
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface-2 p-3">
              <p className="text-[10px] text-muted">Protection status</p>
              <p className={"mt-1 text-sm font-black " + (ipProtectionReady ? "text-success" : "text-warning")}>{ipGuard?.status || "Not verified"}</p>
              <p className="mt-1 text-[10px] text-muted">{ipGuard?.enforcement || "Awaiting backend"}</p>
            </div>
            <div className="rounded-xl border border-line bg-surface-2 p-3">
              <p className="text-[10px] text-muted">Active IP blocks</p>
              <p className="mt-1 text-xl font-black text-fg">{ipGuard?.active_block_count ?? ipGuard?.active_blocks?.length ?? "—"}</p>
              <p className="mt-1 text-[10px] text-muted">Persisted in MongoDB</p>
            </div>
            <div className="rounded-xl border border-line bg-surface-2 p-3">
              <p className="text-[10px] text-muted">Automatic trigger</p>
              <p className="mt-1 text-sm font-black text-fg">{ipGuard?.automatic_blocking ? (ipGuard.auto_block_threshold + " failures / 5 min") : "Unavailable"}</p>
              <p className="mt-1 text-[10px] text-muted">{ipGuard?.auto_block_duration_minutes || 30} min temporary block</p>
            </div>
          </div>

          {!ipProtectionReady && <div role="alert" className="mt-3 rounded-xl border border-warning/25 bg-warning/5 p-3 text-xs leading-5 text-warning">
            IP enforcement is not verified as active. {ipGuard?.error || "The backend has not confirmed persistent storage."}
            Manual block controls stay disabled until the backend confirms MongoDB persistence. Configure MONGO_URI and the trusted Render client-IP header before enabling enforcement.
          </div>}

          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-2 p-3 text-[11px] text-fg-secondary">
            <span className="font-semibold">This connection's verified public IP:</span>
            <code className="font-mono text-accent">{ipGuard?.client_ip || "Not resolved"}</code>
            <span className="text-muted">· Self-block is prevented by the API.</span>
          </div>

          <form id="sci-ip-block-form" onSubmit={submitIpBlock} className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-line bg-surface-2 p-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <h3 className="text-xs font-bold text-fg">Block a suspicious public IP</h3>
              <p className="mt-1 text-[10px] leading-4 text-muted">Exact IPv4 or IPv6 only. Private addresses, CIDR ranges, allowlisted IPs and this administrator session's own IP are rejected.</p>
            </div>
            <label className="block text-xs font-semibold text-fg-secondary">IP address
              <input value={manualIp} onChange={(event) => setManualIp(event.target.value)} required maxLength={64} placeholder="203.0.113.25"
                className="mt-1.5 min-h-11 w-full rounded-xl border border-line bg-input px-3 font-mono text-sm text-fg outline-none placeholder:text-muted focus:border-accent/60"/>
            </label>
            <label className="block text-xs font-semibold text-fg-secondary">Block duration
              <select value={blockDuration} onChange={(event) => setBlockDuration(event.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-line bg-input px-3 text-sm text-fg outline-none focus:border-accent/60">
                <option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">1 hour</option><option value="360">6 hours</option><option value="1440">24 hours</option><option value="10080">7 days</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-fg-secondary sm:col-span-2">Reason for blocking
              <textarea value={blockReason} onChange={(event) => setBlockReason(event.target.value)} required minLength={8} maxLength={300} rows={2}
                placeholder="Describe the observed suspicious behaviour and supporting evidence…"
                className="mt-1.5 w-full resize-y rounded-xl border border-line bg-input px-3 py-2.5 text-sm text-fg outline-none placeholder:text-muted focus:border-accent/60"/>
              <span className="mt-1 block text-right text-[10px] text-muted">{blockReason.length}/300</span>
            </label>
            <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2">
              <span className="text-[10px] text-muted">Requires current platform-admin authorization and explicit confirmation.</span>
              <button type="submit" disabled={!ipProtectionReady || !!busy || manualIp.trim().length < 3 || blockReason.trim().length < 8}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-danger px-4 text-xs font-black text-inverse hover:bg-danger/85 disabled:cursor-not-allowed disabled:opacity-40">
                <Ban className="h-4 w-4"/>{busy === "ip-block" ? "Blocking…" : "Confirm IP block"}
              </button>
            </div>
          </form>

          {ipOperationResult && <div role="status" className="mt-3 rounded-xl border border-success/20 bg-success/5 p-3 text-xs text-success">
            <p className="font-bold">{ipOperationResult.ip} · {ipOperationResult.status}</p>
            <p className="mt-1">Enforcement: {ipOperationResult.enforcement || "application_edge"} · expires: {ipOperationResult.expires_at || "not reported"}</p>
            <p className="mt-1 text-[10px] text-success/75">Host firewall changed: {String(ipOperationResult.host_firewall_changed ?? false)}</p>
          </div>}

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-xs font-bold text-fg">Active blocks</h3><span className="text-[10px] text-muted">{ipGuard?.active_blocks?.length || 0} listed</span></div>
            {(ipGuard?.active_blocks || []).length ? <div className="space-y-2">
              {ipGuard.active_blocks.map((item) => <div key={item.ip} className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-fg">{item.ip}</p>
                  <p className="mt-1 break-words text-[11px] text-fg-secondary">{item.reason}</p>
                  <p className="mt-1 text-[10px] text-muted">{item.source} · expires {item.expires_at || "unknown"} · by {item.created_by || "unknown"}</p>
                </div>
                <button type="button" onClick={() => releaseIpBlock(item.ip)} disabled={!ipProtectionReady || !!busy}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-success/25 px-3 text-xs font-bold text-success hover:bg-success/10 disabled:opacity-40">
                  <Unlock className="h-3.5 w-3.5"/>{busy === "ip-unblock:" + item.ip ? "Releasing…" : "Unblock"}
                </button>
              </div>)}
            </div> : <p className="rounded-xl border border-dashed border-line p-4 text-center text-xs text-muted">{ipProtectionReady ? "No active IP blocks." : "Active block list unavailable until persistent protection is healthy."}</p>}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-bold text-fg"><ShieldAlert className="h-4 w-4 text-warning"/> Recent failed-auth signals</h3>
              {(ipGuard?.recent_auth_failures || []).length ? <div className="max-h-52 space-y-1 overflow-auto">
                {ipGuard.recent_auth_failures.slice(0, 20).map((item, index) => <div key={item.ip + item.created_at + index} className="flex flex-wrap justify-between gap-2 rounded-lg bg-surface-2 px-2.5 py-2 text-[10px]">
                  <span className="font-mono text-fg">{item.ip}</span><span className="text-muted">{item.path} · {item.created_at}</span>
                </div>)}
              </div> : <p className="rounded-lg bg-surface-2 p-3 text-[11px] text-muted">No persisted failed-auth events reported.</p>}
            </div>
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-bold text-fg"><Clock3 className="h-4 w-4 text-accent"/> Block audit trail</h3>
              {(ipGuard?.recent_events || []).length ? <div className="max-h-52 space-y-1 overflow-auto">
                {ipGuard.recent_events.slice(0, 20).map((item, index) => <div key={item.ip + item.created_at + index} className="rounded-lg bg-surface-2 px-2.5 py-2 text-[10px]">
                  <div className="flex flex-wrap justify-between gap-2"><span className="font-mono font-bold text-fg">{item.ip}</span><span className="uppercase text-accent">{item.action}</span></div>
                  <p className="mt-1 break-words text-muted">{item.reason} · {item.actor} · {item.created_at}</p>
                </div>)}
              </div> : <p className="rounded-lg bg-surface-2 p-3 text-[11px] text-muted">No IP block events have been recorded.</p>}
            </div>
          </div>

          <p className="mt-4 rounded-lg border border-warning/20 bg-warning/5 p-3 text-[11px] leading-5 text-warning">
            Scope: blocks are enforced by RevelaAI's ASGI application middleware after a trusted client IP is resolved. They do not modify Render's Cloudflare edge, Render host firewall, Nginx, or the separate RevelaCode Backend service. Configure <code>SCI_CORE_IP_ALLOWLIST</code> for stable administrator egress IPs and the trusted proxy header before using automated blocking.
          </p>
        </Panel>

        <Panel title="Disaster & Recovery Simulator" subtitle="Run controlled diagnostic scenarios and record the returned outcome." icon={Siren}>
          <form onSubmit={(e) => { e.preventDefault(); runAction("disaster", "/api/sci/disaster/simulate", { type: disasterType }, setDisasterResult, "Simulation response received and displayed."); }} className="space-y-3">
            <label className="block text-xs font-semibold text-fg-secondary">Scenario
              <select value={disasterType} onChange={(e) => setDisasterType(e.target.value)} className="mt-2 w-full rounded-xl border border-line bg-input px-3 py-2.5 text-sm text-fg">
                <option value="db_down">Database unavailable</option><option value="api_overload">API overload / throttle simulation</option><option value="memory_leak">High memory diagnostics</option>
              </select>
            </label>
            <button disabled={!!busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-warning/10 px-4 py-3 text-sm font-bold text-warning hover:bg-warning/15 disabled:opacity-50"><Siren className="h-4 w-4" />{busy === "disaster" ? "Simulating…" : "Run diagnostic simulation"}</button>
          </form>
          <div className="mt-4"><ResultBlock value={disasterResult} /></div>
          <p className="mt-3 text-[11px] leading-5 text-muted">Simulations can create persistent audit records. They do not kill processes or force restarts; overload behavior depends on the backend throttle hook.</p>
        </Panel>

        <Panel title="Prototype Lab" subtitle="Generate a reviewable software or electronics concept; artifacts are not executed." icon={Cpu}>
          <form onSubmit={(e) => { e.preventDefault(); if (prototypeSpec.trim()) runAction("prototype", "/api/sci/lab/prototype", { domain: prototypeDomain, spec: prototypeSpec.trim() }, setPrototypeResult, "Prototype artifacts returned. Review them before any local testing or deployment."); }} className="space-y-3">
            <label className="block text-xs font-semibold text-fg-secondary">Prototype domain
              <select value={prototypeDomain} onChange={(e) => setPrototypeDomain(e.target.value)} className="mt-2 w-full rounded-xl border border-line bg-input px-3 py-2.5 text-sm text-fg"><option value="software">Software</option><option value="hardware">Hardware</option><option value="electronics">Electronics</option></select>
            </label>
            <label className="block text-xs font-semibold text-fg-secondary">Specification
              <textarea value={prototypeSpec} onChange={(e) => setPrototypeSpec(e.target.value)} maxLength={800} rows={3} placeholder="Describe a civilian tool, sensor, or software prototype…" className="mt-2 w-full resize-y rounded-xl border border-line bg-input px-3 py-3 text-sm text-fg outline-none placeholder:text-muted focus:border-accent/60" />
            </label>
            <button disabled={!!busy || !prototypeSpec.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-chart-3 px-4 py-3 text-sm font-black text-inverse transition hover:bg-chart-3/85 disabled:opacity-50"><FlaskConical className="h-4 w-4" />{busy === "prototype" ? "Generating…" : "Generate prototype"}</button>
          </form>
          <div className="mt-4"><ResultBlock value={prototypeResult} /></div>
          {prototypeResult?.artifacts && <div className="mt-3 space-y-2">{Object.entries(prototypeResult.artifacts).map(([name, content]) => <details key={name} className="rounded-xl border border-line bg-input"><summary className="cursor-pointer px-3 py-3 text-xs font-bold text-accent">{name}</summary><pre className="overflow-auto whitespace-pre-wrap break-words border-t border-line p-3 text-[11px] leading-5 text-fg-secondary">{content}</pre></details>)}</div>}
          <p className="mt-3 text-[11px] leading-5 text-muted">Generation status is review-required. Generated firmware/code is never run by this dashboard.</p>
        </Panel>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex items-start gap-3"><TerminalSquare className="mt-0.5 h-5 w-5 shrink-0 text-muted" /><div><h3 className="text-sm font-bold text-fg">Operations boundary</h3><p className="mt-1 text-xs leading-5 text-muted">All controls require current platform-administrator authorization from RevelaCode. If requests return 401/403, refresh your signed-in session and verify CORS and <code>VITE_REVELAAI_API_BASE</code>. IP blocks apply only to incoming RevelaAI service requests after a trusted public client IP is established. Render edge and other services require their own controls.</p></div></div>
      </div>
    </div>
  );
}
