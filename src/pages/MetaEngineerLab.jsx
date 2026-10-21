import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, Brain, CheckCircle, ChevronRight, Circle,
  Clock, Code2, Cpu, FileCode, FileText, FlaskConical, GitBranch,
  Loader, Play, RefreshCw, ShieldCheck, Terminal, XCircle, Zap
} from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";

const API_BASE = String(import.meta.env.VITE_REVELAAI_API_BASE || "https://revelaai.onrender.com").replace(/\/+$/, "");
const TARGETS = [
  { value: "backend", label: "Backend Flask Blueprint" },
  { value: "frontend", label: "Frontend Component" },
  { value: "database", label: "MongoDB Model" },
  { value: "fullstack", label: "Full Stack" },
];
const TABS = [
  { id: "code", label: "Generated Code", icon: FileCode },
  { id: "tests", label: "Test Logs", icon: FlaskConical },
  { id: "changelog", label: "Changelog", icon: FileText },
  { id: "architecture", label: "Architecture Map", icon: GitBranch },
  { id: "audit", label: "Audit Log", icon: Activity },
];
const cn = (...values) => values.filter(Boolean).join(" ");
const pretty = (value) => typeof value === "string" ? value : JSON.stringify(value ?? {}, null, 2);
const first = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

function statusTone(status = "") {
  const s = String(status).toLowerCase();
  if (["approved", "passed", "success", "complete", "completed", "active"].some((x) => s.includes(x))) return "text-emerald-300 border-emerald-500/30 bg-emerald-500/10";
  if (["failed", "error", "blocked", "rejected"].some((x) => s.includes(x))) return "text-rose-300 border-rose-500/30 bg-rose-500/10";
  if (["pending", "await", "running", "processing", "testing", "proposed"].some((x) => s.includes(x))) return "text-amber-200 border-amber-500/30 bg-amber-500/10";
  return "text-slate-300 border-white/10 bg-white/5";
}
function statusLabel(value) {
  return String(value || "unknown").replace(/[_-]/g, " ");
}
function describeApiFailure(error, operation) {
  const message = String(error?.message || "request failed");
  if (message === "admin_required" || error?.status === 403) {
    return operation + ": RevelaCode denied administrator access. The signed-in account must have the current admin role in the backend user record; browser role flags cannot grant access.";
  }
  if (error?.status === 503) {
    return operation + ": the server-side administrator verification service is unavailable. Check the RevelaCode backend deployment and its connection to the user store.";
  }
  if (error?.status === 401) {
    return operation + ": authentication was rejected. Sign in again and retry.";
  }
  return operation + ": " + message + ". Confirm that the RevelaAI API is reachable at " + API_BASE + ".";
}

export default function MetaEngineerLab() {
  const auth = useAuth();
  const user = auth?.user;
  const [spec, setSpec] = useState("");
  const [target, setTarget] = useState("fullstack");
  const [activeTab, setActiveTab] = useState("code");
  const [scan, setScan] = useState(null);
  const [coreHealth, setCoreHealth] = useState(null);
  const [healthLoadState, setHealthLoadState] = useState("loading");
  const [audit, setAudit] = useState([]);
  const [auditLoadState, setAuditLoadState] = useState("loading");
  const [scanLoadState, setScanLoadState] = useState("loading");
  const [selected, setSelected] = useState(null);
  const [activeArtifactPath, setActiveArtifactPath] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const token = useCallback(async () => {
    if (typeof auth?.getAccessToken === "function") return await auth.getAccessToken();
    return user?.accessToken || user?.access_token || "";
  }, [auth, user]);
  const authenticatedFetch = auth?.authFetch;

  const request = useCallback(async (path, options = {}) => {
    const accessToken = await token();
    const url = `${API_BASE}${path}`;
    const headers = {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    };
    const response = typeof authenticatedFetch === "function"
      ? await authenticatedFetch(url, { ...options, headers })
      : await fetch(url, {
          ...options,
          headers: {
            ...headers,
            ...(accessToken ? { Authorization: `Bearer ${String(accessToken).replace(/^Bearer\s+/i, "")}` } : {}),
          },
        });
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { detail: raw }; }
    if (!response.ok) {
      const candidate =
        data?.error?.message ||
        data?.detail?.message ||
        data?.message?.message ||
        data?.message ||
        (typeof data?.error === "string" ? data.error : data?.error?.code) ||
        (typeof data?.detail === "string" ? data.detail : null) ||
        data?.code ||
        `Request failed (${response.status})`;
      let message = typeof candidate === "string" ? candidate : "";
      if (!message && candidate && typeof candidate === "object") {
        try { message = JSON.stringify(candidate); } catch { /* use status fallback */ }
      }
      const error = new Error(message || `Request failed (${response.status})`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }, [authenticatedFetch, token]);

  const refreshAudit = useCallback(async () => {
    setAuditLoadState("loading");
    try {
      const result = await request("/api/meta-engineer/audit");
      const items = Array.isArray(result)
        ? result
        : [
            ...(Array.isArray(result?.ideas) ? result.ideas : []),
            ...(Array.isArray(result?.audit) ? result.audit.map((item) => ({ ...item, ideaId: first(item?.ideaId, item?.idea_id, item?.extra?.ideaId) })) : []),
          ];
      setAudit(items);
      setAuditLoadState("loaded");
      setLastUpdated(new Date());
      return items;
    } catch (error) {
      setAuditLoadState("failed");
      throw error;
    }
  }, [request]);

  const refreshHealth = useCallback(async () => {
    try {
      const result = await request("/api/meta-engineer/health");
      setCoreHealth(result);
      setHealthLoadState("loaded");
      return result;
    } catch (e) {
      setHealthLoadState("failed");
      throw e;
    }
  }, [request]);

  const rescan = useCallback(async () => {
    setScanning(true); setError(""); setNotice(""); setScanLoadState("loading");
    await refreshHealth().catch(() => {});
    try {
      const result = await request("/api/meta-engineer/scan");
      setScan(result?.architecture || result?.scan || result);
      setScanLoadState("loaded");
      setNotice("Architecture scan completed and the returned map has been refreshed.");
      await refreshAudit().catch(() => {});
    } catch (e) {
      setScanLoadState("failed");
      setError(describeApiFailure(e, "Architecture scan unavailable"));
    } finally { setScanning(false); }
  }, [request, refreshAudit, refreshHealth]);

  useEffect(() => {
    refreshHealth().catch(() => {});
    refreshAudit().catch((e) => setError(describeApiFailure(e, "Could not load the audit feed")));
    request("/api/meta-engineer/scan")
      .then((result) => {
        setScan(result?.architecture || result?.scan || result);
        setScanLoadState("loaded");
      })
      .catch((e) => {
        setScanLoadState("failed");
        setError(describeApiFailure(e, "Architecture map unavailable"));
      });
  }, [refreshAudit, refreshHealth, request]);

  const startBuild = async (event) => {
    event.preventDefault();
    if (spec.trim().length < 12) { setError("Describe the feature in at least 12 characters so the agent has a usable specification."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await request("/api/meta-engineer/propose", {
        method: "POST",
        body: JSON.stringify({ spec: spec.trim(), target, userId: user?.id || user?._id || user?.user_id || user?.userId }),
      });
      const idea = result?.idea || result?.proposal || result?.data || result;
      const files = Array.isArray(result?.generated_files) ? result.generated_files : Array.isArray(idea?.generated_files) ? idea.generated_files : [];
      setActiveArtifactPath(String(files[0]?.path || ""));
      setSelected({
        ...idea,
        generated_files: files,
        ideaId: first(idea?.ideaId, idea?.idea_id, idea?.id, idea?._id, result?.ideaId),
        status: first(result?.idea_status, idea?.status, result?.status),
        generated_code: first(idea?.generated_code, result?.generated_code),
        code_path: first(idea?.code_path, result?.code_path),
        test_logs: first(idea?.test_logs, result?.test_logs),
        changelog: first(idea?.changelog, result?.changelog),
      });
      setActiveTab("code");
      setNotice("Build pipeline returned " + String(files.length || 1) + " artifact(s). Static sandbox checks do not execute candidate code; review every file before integration.");
      await refreshAudit().catch(() => {});
    } catch (e) {
      if (e?.data?.ideaId) {
        setSelected({
          ideaId: e.data.ideaId,
          status: first(e.data.idea_status, e.data.status, "failed_test"),
          test_logs: first(e.data.test_logs, e.data.message, ""),
          code_path: e.data.code_path,
          test_result: { status: "failed", logs: first(e.data.test_logs, e.data.message, "") },
        });
        setActiveTab("tests");
      }
      setError(`Proposal failed: ${e.message}. Any returned failure evidence is shown in Test Logs; no passing result is assumed.`);
    } finally { setBusy(false); }
  };

  useEffect(() => {
    const ideaId = first(selected?.ideaId, selected?.idea_id, selected?.id, selected?._id);
    if (!ideaId) return undefined;
    let stopped = false;
    const poll = async () => {
      try {
        const result = await request(`/api/meta-engineer/audit/${encodeURIComponent(ideaId)}/status`);
        if (stopped) return;
        const current = result?.idea || result?.status || result?.data || result;
        setSelected((old) => ({ ...(old || {}), ...(typeof current === "object" ? current : { status: current }) }));
        if (["awaiting_approval", "approved", "failed_test", "rejected", "failed"].includes(String(current?.status || "").toLowerCase())) {
          refreshAudit().catch(() => {});
        }
      } catch (e) {
        if (!stopped) setSelected((old) => ({ ...(old || {}), pollingError: e.message }));
      }
    };
    poll();
    const interval = window.setInterval(poll, 2000);
    return () => { stopped = true; window.clearInterval(interval); };
  }, [selected?.ideaId, selected?.idea_id, selected?.id, selected?._id, request, refreshAudit]);

  const approve = async (idea) => {
    const id = first(idea?.ideaId, idea?.idea_id, idea?.id, idea?._id);
    if (!id) { setError("Cannot approve: the proposal has no idea ID."); return; }
    if (!window.confirm("Approve this proposal for the backend's controlled integration step? Review its code and test evidence first. This UI will not deploy code itself.")) return;
    setError(""); setNotice("");
    try {
      const result = await request(`/api/meta-engineer/approve/${encodeURIComponent(id)}`, { method: "POST", body: JSON.stringify({ userId: user?.id || user?._id || user?.user_id || user?.userId }) });
      setSelected((old) => ({ ...(old || {}), ...(result?.idea || result?.data || result), status: first(result?.status, result?.idea?.status, "approval_requested") }));
      setNotice("Approval request submitted. Verify the backend response and audit entry before treating the change as integrated.");
      await refreshAudit().catch(() => {});
    } catch (e) { setError(`Approval request failed: ${e.message}`); }
  };

  const current = selected || audit[0] || null;
  const ideaStatus = first(current?.status, current?.state, "idle");
  const steps = useMemo(() => {
    const supplied = current?.steps || current?.agent_steps || current?.progress?.steps;
    if (Array.isArray(supplied)) return supplied;
    const stage = String(ideaStatus).toLowerCase();
    const done = ["awaiting_approval", "approved", "complete", "completed"].includes(stage);
    const failed = stage.includes("failed");
    const labels = [
      ["Introspection & codebase analysis", first(current?.introspection_summary, current?.scan_summary, "Waiting for backend scan evidence")],
      ["Specification & code generation", first(current?.code_path, current?.generated_path, "Waiting for generated artifact metadata")],
      ["Automated testing & sandboxing", first(current?.test_summary, current?.test_result, "Waiting for sandbox test results")],
      ["Integration review", first(current?.changelog_path, current?.changelog, "Human approval required; no automatic deployment")],
    ];
    const stageIndex = done ? 4 : failed ? 3 : stage.includes("test") ? 3 : stage.includes("generat") ? 2 : stage.includes("introspect") ? 1 : 0;
    return labels.map(([label, detail], i) => ({ label, detail, status: failed && i === stageIndex ? "failed" : i < stageIndex ? "completed" : i === stageIndex ? "running" : "queued" }));
  }, [current, ideaStatus]);

  const generatedFiles = Array.isArray(current?.generated_files)
    ? current.generated_files
    : Array.isArray(current?.files) ? current.files : [];
  const activeGeneratedFile = generatedFiles.find((item) => item?.path === activeArtifactPath) || generatedFiles[0] || null;
  const code = first(activeGeneratedFile?.content, current?.generated_code, current?.code, current?.artifact?.content, "");
  const testLogs = first(current?.test_logs, current?.test_output, current?.logs, current?.test_result, "No sandbox test output has been returned yet.");
  const changelog = first(current?.changelog_content, current?.changelog, current?.changelog_path, "No changelog artifact has been returned yet.");
  const architecture = first(scan?.architecture, scan?.architecture_map, scan?.modules, scan?.files, scan?.tree, scan);
  const scanMetrics = scan?.metrics || scan?.summary || scan || {};
  const freeSlots = first(scanMetrics?.free_slots, scanMetrics?.freeSlots, scanMetrics?.capacity?.free_slots);
  const modules = first(scanMetrics?.module_count, scanMetrics?.modules_count, Array.isArray(scan?.modules) ? scan.modules.length : undefined);
  const lastScan = first(scanMetrics?.last_scan, scanMetrics?.scanned_at, scanMetrics?.timestamp);
  const pending = audit.filter((item) => /pending|awaiting|proposed/i.test(String(item?.status || item?.state || ""))).length;
  const pendingLabel = auditLoadState === "loaded" ? String(pending) + " pending review" : auditLoadState === "loading" ? "Loading review queue" : "Review queue unavailable";

  return (
    <div className="min-h-[calc(100vh-8rem)] overflow-hidden rounded-3xl border border-slate-800 bg-[#080d17] text-slate-100 shadow-2xl">
      <div className="relative overflow-hidden border-b border-cyan-500/15 bg-gradient-to-br from-[#111c30] via-[#0a1221] to-[#080d17] px-4 py-5 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200">
              <Brain className="h-3.5 w-3.5" /> Autonomous engineering / human-gated
            </div>
            <h1 className="text-xl font-black tracking-[0.08em] sm:text-2xl lg:text-3xl">META-ENGINEER LAB <span className="text-cyan-300">// SELF-BUILDING CORE</span></h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">RevelaAI analyzes its architecture, proposes features, runs sandbox checks, and waits for an authorized human decision.</p>
          </div>
          <div className="w-full rounded-2xl border border-emerald-400/20 bg-slate-950/70 p-4 xl:max-w-[360px]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-bold"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" /></span>Introspector</div>
              <span className={cn("rounded-full border px-2 py-1 text-[10px] font-bold uppercase", scan ? statusTone("active") : statusTone("unconfigured"))}>{scan ? "Scan data loaded" : scanLoadState === "failed" ? "Access unavailable" : "Awaiting API"}</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Metric label="Last scan" value={lastScan ? (Number.isFinite(Date.parse(lastScan)) ? new Date(lastScan).toLocaleString() : String(lastScan)) : "—"} />
              <Metric label="Modules mapped" value={modules ?? "—"} />
              <Metric label="Free slots" value={freeSlots ?? "—"} />
            </div>
            <div className="mt-3 rounded-xl border border-slate-800 bg-[#080d17] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-200">Core readiness</span>
                <span className={cn("rounded-full border px-2 py-1 text-[9px] font-bold uppercase", statusTone(healthLoadState === "loaded" ? coreHealth?.status : healthLoadState === "failed" ? "failed" : "pending"))}>
                  {healthLoadState === "loading" ? "checking" : healthLoadState === "failed" ? "unavailable" : statusLabel(coreHealth?.status || "unknown")}
                </span>
              </div>
              {coreHealth?.checks && <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {Object.entries(coreHealth.checks).map(([name, value]) => <div key={name} className="flex items-center justify-between gap-2 rounded-lg border border-slate-800/80 px-2.5 py-2">
                  <span className="text-[10px] text-slate-400">{name.replace(/_/g, " ")}</span>
                  <span className={cn("rounded-full border px-1.5 py-0.5 text-[9px] uppercase", statusTone(String(value)))}>{String(value)}</span>
                </div>)}
              </div>}
              {healthLoadState === "loaded" && coreHealth?.status !== "ok" && <p className="mt-2 text-[10px] leading-4 text-amber-200/80">At least one server prerequisite is unavailable. The checks above distinguish missing sandbox tooling from audit-storage connectivity.</p>}
              {healthLoadState === "failed" && <p className="mt-2 text-[10px] leading-4 text-rose-200/80">Could not read Meta-Engineer health. Check API reachability and deployment before retrying the build.</p>}
              {coreHealth?.candidate_execution === false && <p className="mt-2 text-[10px] leading-4 text-slate-500">Safe mode: generated code is not executed or automatically deployed.</p>}
            </div>
            <button onClick={rescan} disabled={scanning} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2.5 text-xs font-bold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-wait disabled:opacity-60">
              {scanning ? <Loader className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Rescan Architecture
            </button>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 p-3 sm:p-5 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)] xl:p-6">
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-800 bg-[#0d1422] p-4 sm:p-5">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2.5 text-emerald-300"><Zap className="h-5 w-5" /></div>
              <div><h2 className="font-bold">Propose Self-Build</h2><p className="mt-1 text-xs leading-5 text-slate-500">Write the intended behavior, constraints, and acceptance criteria.</p></div>
            </div>
            <form onSubmit={startBuild} className="space-y-4">
              <label className="block text-xs font-semibold text-slate-300">Feature specification
                <textarea value={spec} onChange={(e) => setSpec(e.target.value)} rows={6} maxLength={1000} placeholder="e.g. Add a Bible verse search API for the Mahubiri hub. Include endpoints, access rules, tests, and failure behavior…" className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-[#070c15] px-3 py-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/10" />
              </label>
              <label className="block text-xs font-semibold text-slate-300">Target surface
                <select value={target} onChange={(e) => setTarget(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-[#070c15] px-3 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400/70">
                  {TARGETS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <button disabled={busy || spec.trim().length < 12} type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-emerald-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50">
                {busy ? <Loader className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} {busy ? "Starting agent loop…" : "Start Agentic Loop"}
              </button>
            </form>
            <p className="mt-3 text-[11px] leading-5 text-slate-500">Safety gate: proposal and sandbox only. Generated changes never auto-deploy; approval must be enforced by the backend.</p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#0d1422] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-bold">Agentic loop</h2><span className="text-[10px] uppercase tracking-widest text-slate-500">Live status</span></div>
            <div className="space-y-3">
              {steps.map((step, index) => {
                const state = String(step.status || step.state || "queued").toLowerCase();
                const done = ["done", "complete", "completed", "passed"].includes(state);
                const failed = state.includes("fail") || state.includes("error");
                const active = ["running", "processing", "active", "in_progress"].includes(state);
                const Icon = failed ? XCircle : done ? CheckCircle : active ? Loader : Circle;
                return <div key={step.id || step.label || index} className="flex gap-3 rounded-xl border border-slate-800/80 bg-slate-950/50 p-3">
                  <div className={cn("mt-0.5 shrink-0", failed ? "text-rose-400" : done ? "text-emerald-400" : active ? "text-cyan-300" : "text-slate-600")}><Icon className={cn("h-4 w-4", active && "animate-spin")} /></div>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold text-slate-200">{step.label || step.name || `Step ${index + 1}`}</p><span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase", statusTone(state))}>{statusLabel(state)}</span></div><p className="mt-1 break-words text-[11px] leading-5 text-slate-500">{step.detail || step.message || step.summary || "No event details received from the API yet."}</p></div>
                </div>;
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
            <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" /><div><h3 className="text-sm font-bold text-amber-100">Human approval required</h3><p className="mt-1 text-xs leading-5 text-slate-400">Protect authentication, authorization, security middleware, crypto/JWT, core configuration, and user identity storage. Do not permit self-deletion or automatic deployment.</p></div></div>
          </section>
        </div>

        <div className="min-w-0 space-y-4">
          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1422]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2"><Code2 className="h-4 w-4 text-cyan-300" /><h2 className="text-sm font-bold">Build workspace</h2></div>
              <div className="flex items-center gap-2"><span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase", statusTone(ideaStatus))}>{statusLabel(ideaStatus)}</span>{current && /awaiting_approval|proposed/i.test(String(ideaStatus)) && <button onClick={() => approve(current)} className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-black text-emerald-950 hover:bg-emerald-300">Review & Approve</button>}</div>
            </div>
            <div className="flex gap-1 overflow-x-auto border-b border-slate-800 px-2 pt-2">
              {TABS.map((tab) => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("inline-flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-3 py-2.5 text-xs font-semibold transition", activeTab === tab.id ? "border-cyan-300 bg-cyan-300/[0.06] text-cyan-100" : "border-transparent text-slate-500 hover:text-slate-200")}><Icon className="h-3.5 w-3.5" />{tab.label}</button>; })}
            </div>
            <div className="min-h-[320px] p-4 sm:p-5">
              {activeTab === "code" && <div className="space-y-3">
                {generatedFiles.length > 1 && <label className="block max-w-2xl text-xs font-semibold text-slate-300">Generated artifacts
                  <select value={activeGeneratedFile?.path || ""} onChange={(event) => setActiveArtifactPath(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-[#070c15] px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-cyan-400/70">
                    {generatedFiles.map((file) => <option key={file.path} value={file.path}>{file.path} · {file.role || file.language || "artifact"}</option>)}
                  </select>
                </label>}
                {activeGeneratedFile?.path && <p className="text-[11px] text-slate-500">Artifact path: <code>{activeGeneratedFile.path}</code>. Generated files remain proposals until separately reviewed and integrated.</p>}
                <ArtifactPanel icon={FileCode} title={activeGeneratedFile?.path || "Generated code"} value={code} empty="No generated code received. Code will appear here when the backend returns a generated artifact." />
              </div>}
              {activeTab === "tests" && <ArtifactPanel icon={Terminal} title="Sandbox test output" value={pretty(testLogs)} empty="No sandbox test output has been returned. Do not treat an empty test log as a passing test." />}
              {activeTab === "changelog" && <ArtifactPanel icon={FileText} title="Changelog artifact" value={pretty(changelog)} empty="No changelog has been returned for this proposal yet." />}
              {activeTab === "architecture" && <ArtifactPanel icon={GitBranch} title="Architecture scan response" value={pretty(architecture)} empty="Run Rescan Architecture after configuring the API. This panel shows returned scan data, not a simulated map." />}
              {activeTab === "audit" && <div><div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-bold">Recent ideas & audit events</h3><p className="mt-1 text-xs text-slate-500">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Not synced"}</p></div><button onClick={() => refreshAudit().catch((e) => setError(e.message))} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-white/5" aria-label="Refresh audit"><RefreshCw className="h-4 w-4" /></button></div>
                {audit.length ? <div className="space-y-2">{audit.map((item, index) => <button key={first(item?.ideaId, item?.idea_id, item?.id, item?._id, index)} onClick={() => { setSelected(item); setActiveArtifactPath(""); setActiveTab("code"); }} className="flex w-full items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-left transition hover:border-cyan-500/30"><div className="rounded-lg bg-slate-800 p-2 text-cyan-300"><FileText className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="line-clamp-2 text-xs font-bold text-slate-200">{first(item?.spec, item?.title, item?.name, "Untitled proposal")}</p><span className={cn("rounded-full border px-2 py-0.5 text-[9px] uppercase", statusTone(item?.status || item?.state))}>{statusLabel(item?.status || item?.state)}</span></div><p className="mt-1 truncate text-[10px] text-slate-500">{first(item?.code_path, item?.created_at, item?.timestamp, "No path or timestamp returned")}</p></div><ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-600" /></button>)}</div> : <EmptyState title="Audit feed is empty" body="When the API is available, proposals and audit events from the backend will appear here." />}</div>}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#0d1422] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Activity className="h-4 w-4 text-cyan-300" /><h2 className="text-sm font-bold">System oversight</h2></div><span className="text-[10px] text-slate-500">{pendingLabel}</span></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SmallStat icon={Cpu} label="Architecture map" value={modules ?? (scanLoadState === "failed" ? "Unavailable" : "Not reported")} />
              <SmallStat icon={FlaskConical} label="Sandbox result" value={first(current?.test_status, current?.test_result?.status, current?.tests?.status, auditLoadState === "failed" ? "Unavailable" : "Not reported")} />
              <SmallStat icon={Clock} label="Last refresh" value={lastUpdated ? lastUpdated.toLocaleTimeString() : auditLoadState === "failed" ? "Unavailable" : "Not synced"} />
            </div>
            {(error || notice) && <div className={cn("mt-4 rounded-xl border px-3 py-3 text-xs leading-5", error ? "border-rose-500/30 bg-rose-500/10 text-rose-200" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200")}>{error || notice}</div>}
            <p className="mt-4 text-[10px] leading-5 text-slate-600">API base: {API_BASE || "(not configured — set VITE_REVELAAI_API_BASE)"}. Browser-side role checks are not a security boundary; all endpoints must enforce admin authorization server-side.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="min-w-0 rounded-lg border border-white/5 bg-white/[0.03] p-2"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 break-words text-xs font-bold text-slate-100">{value}</p></div>;
}
function SmallStat({ icon: Icon, label, value }) {
  return <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/50 p-3"><Icon className="mb-2 h-4 w-4 text-cyan-300" /><p className="text-[10px] text-slate-500">{label}</p><p className="mt-1 break-words text-xs font-bold capitalize text-slate-200">{String(value)}</p></div>;
}
function EmptyState({ title, body }) {
  return <div className="rounded-xl border border-dashed border-slate-700 px-4 py-12 text-center"><AlertTriangle className="mx-auto mb-3 h-5 w-5 text-slate-600" /><p className="text-sm font-semibold text-slate-300">{title}</p><p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">{body}</p></div>;
}
function ArtifactPanel({ icon: Icon, title, value, empty }) {
  const content = typeof value === "string" ? value : pretty(value);
  return <div><div className="mb-3 flex items-center gap-2"><Icon className="h-4 w-4 text-cyan-300" /><h3 className="text-sm font-bold">{title}</h3></div>{!content || content === "{}" || content === "[]" ? <EmptyState title="Waiting for artifact" body={empty} /> : <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-[#070b12] p-4 font-mono text-[11px] leading-6 text-emerald-100/90">{content}</pre>}</div>;
}
