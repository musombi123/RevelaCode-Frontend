import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Cpu,
  FileCheck2,
  FlaskConical,
  GitBranch,
  Layers3,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";

const API_BASE = String(
  import.meta.env.VITE_REVELAAI_API_URL ||
  import.meta.env.VITE_REVELAAI_API_BASE ||
  "https://revelaai.onrender.com",
).trim().replace(/\/+$/, "");

function errorMessage(payload, status) {
  return (
    payload?.detail?.message ||
    payload?.error?.message ||
    payload?.message ||
    payload?.detail ||
    payload?.error?.code ||
    "Evolver request failed (HTTP " + status + ")."
  );
}

async function requestEvolver(path, options = {}, authenticatedFetch) {
  const url = API_BASE + path;
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  const response = typeof authenticatedFetch === "function"
    ? await authenticatedFetch(url, { ...options, headers, cache: "no-store" })
    : await fetch(url, { ...options, headers, cache: "no-store" });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(errorMessage(payload, response.status));
  }
  return payload?.data ?? payload;
}

function StatusTag({ value }) {
  const status = String(value || "unknown").toLowerCase();
  const good = ["available", "passed", "ready", "learning_store_ready", "candidate_for_human_review"].includes(status);
  const blocked = ["blocked", "missing", "unavailable", "regression", "rejected"].includes(status);
  const styles = good
    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : blocked
      ? "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300"
      : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return (
    <span className={"inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide " + styles}>
      <span className="truncate">{String(value || "unknown").replaceAll("_", " ")}</span>
    </span>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block min-w-0">
      <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[10px] leading-4 text-slate-500 dark:text-slate-400">{hint}</span> : null}
    </label>
  );
}

const inputClass = "mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-extrabold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800";

export default function EvolverControlSurface({ authenticatedFetch }) {
  const [health, setHealth] = useState(null);
  const [capabilityData, setCapabilityData] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [activeTools, setActiveTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  const [toolName, setToolName] = useState("factory_tool");
  const systemId = useMemo(() => "tool." + toolName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ""), [toolName]);
  const [brainCategory, setBrainCategory] = useState("engineering");
  const [learning, setLearning] = useState(null);

  const [demand, setDemand] = useState("");
  const [country, setCountry] = useState("KE");
  const [language, setLanguage] = useState("en");

  const [objective, setObjective] = useState("Improve the tool's reliability and latency without expanding its permission boundary.");
  const [metricsJson, setMetricsJson] = useState('[\n  { "name": "latency_ms", "direction": "minimize", "baseline": 100, "target": 50, "unit": "ms" },\n  { "name": "success_rate", "direction": "maximize", "baseline": 0.95, "target": 0.99, "unit": "" }\n]');
  const [evidenceRefs, setEvidenceRefs] = useState("benchmark://baseline-v1");
  const [requestedDepth, setRequestedDepth] = useState("2");

  const [publishName, setPublishName] = useState("");
  const [selectedProposalId, setSelectedProposalId] = useState("");
  const [evaluationJson, setEvaluationJson] = useState('{\n  "observations": { "latency_ms": 45, "success_rate": 0.995 },\n  "test_passed": true,\n  "security_review_passed": true,\n  "evidence_refs": ["benchmark://candidate-v1", "tests://ci/run-id"]\n}');
  const [mindObjective, setMindObjective] = useState("");
  const [decisionRationale, setDecisionRationale] = useState("");

  const refresh = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setErrors({});
    const results = await Promise.allSettled([
      requestEvolver("/api/usect/evolve/health", {}, authenticatedFetch),
      requestEvolver("/api/usect/evolve/capabilities", {}, authenticatedFetch),
      requestEvolver("/api/usect/evolve/proposals?system_id=" + encodeURIComponent(systemId) + "&limit=30", {}, authenticatedFetch),
      requestEvolver("/api/usect/evolve/learning/" + encodeURIComponent(systemId) + "?brain_category=" + encodeURIComponent(brainCategory), {}, authenticatedFetch),
      requestEvolver("/api/core-mesh/tools", {}, authenticatedFetch),
    ]);
    const nextErrors = {};
    if (results[0].status === "fulfilled") setHealth(results[0].value);
    else { setHealth(null); nextErrors.health = results[0].reason?.message || "Evolver health is unavailable."; }
    if (results[1].status === "fulfilled") setCapabilityData(results[1].value);
    else { setCapabilityData(null); nextErrors.capabilities = results[1].reason?.message || "Capability inventory is unavailable."; }
    if (results[2].status === "fulfilled") {
      setProposals(Array.isArray(results[2].value?.proposals) ? results[2].value.proposals : []);
    } else { setProposals([]); nextErrors.proposals = results[2].reason?.message || "Proposal history is unavailable."; }
    if (results[3].status === "fulfilled") setLearning(results[3].value?.learning || results[3].value || null);
    else { setLearning(null); nextErrors.learning = results[3].reason?.message || "Learning history is unavailable."; }
    if (results[4].status === "fulfilled") {
      setActiveTools(Array.isArray(results[4].value?.active_tools) ? results[4].value.active_tools : []);
    } else { setActiveTools([]); nextErrors.tools = results[4].reason?.message || "Signed tool inventory is unavailable."; }
    setErrors(nextErrors);
    setLoading(false);
    setRefreshing(false);
  }, [authenticatedFetch, systemId, brainCategory]);

  useEffect(() => {
    refresh(false);
    const timer = window.setInterval(() => refresh(true), 45000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (!selectedProposalId && proposals.length) setSelectedProposalId(proposals[0].proposal_id);
    if (selectedProposalId && !proposals.some((item) => item.proposal_id === selectedProposalId)) {
      setSelectedProposalId(proposals[0]?.proposal_id || "");
    }
  }, [proposals, selectedProposalId]);

  const selectedProposal = proposals.find((item) => item.proposal_id === selectedProposalId) || null;
  const capabilities = capabilityData?.capabilities || [];
  const capabilityCounts = useMemo(() => ({
    available: capabilities.filter((item) => item.runtime_state === "available").length,
    blocked: capabilities.filter((item) => item.runtime_state === "blocked" || item.runtime_state === "missing").length,
    unprobed: capabilities.filter((item) => item.runtime_state === "not_probed").length,
  }), [capabilities]);

  const runAction = async (key, path, body, successText, method = "POST") => {
    setBusy(key);
    setNotice("");
    setErrors((current) => ({ ...current, action: "" }));
    try {
      const result = await requestEvolver(path, {
        method,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }, authenticatedFetch);
      setNotice(successText);
      await refresh(true);
      return result;
    } catch (error) {
      setErrors((current) => ({ ...current, action: error?.message || "The action could not be completed." }));
      return null;
    } finally {
      setBusy("");
    }
  };

  const createInvention = async (event) => {
    event.preventDefault();
    if (demand.trim().length < 3) return;
    const result = await runAction(
      "invention",
      "/api/usect/evolve/tools",
      { demand: demand.trim(), country, language },
      "Genesis returned an invention proposal. It has not been published or deployed.",
    );
    if (result) setDemand("");
  };

  const createEvolution = async (event) => {
    event.preventDefault();
    let metrics;
    try {
      metrics = JSON.parse(metricsJson);
    } catch {
      setErrors((current) => ({ ...current, action: "Metrics must be valid JSON." }));
      return;
    }
    if (!Array.isArray(metrics) || !metrics.length) {
      setErrors((current) => ({ ...current, action: "Provide at least one metric target." }));
      return;
    }
    const body = {
      system_id: systemId,
      objective: objective.trim(),
      metrics,
      evidence_refs: evidenceRefs.split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
      brain_category: brainCategory,
      requested_depth: Number(requestedDepth),
    };
    const result = await runAction(
      "evolution",
      "/api/usect/evolve/proposals",
      body,
      "Evolution proposal saved to MongoDB. It is staged for evidence collection and review.",
    );
    if (result?.proposal?.proposal_id) setSelectedProposalId(result.proposal.proposal_id);
  };

  const evaluateProposal = async (event) => {
    event.preventDefault();
    if (!selectedProposal) return;
    let input;
    try { input = JSON.parse(evaluationJson); }
    catch { setErrors((current) => ({ ...current, action: "Evaluation payload must be valid JSON." })); return; }
    const body = { proposal_id: selectedProposal.proposal_id, ...input };
    await runAction(
      "evaluation",
      "/api/usect/evolve/proposals/" + encodeURIComponent(selectedProposal.proposal_id) + "/evaluate",
      body,
      "Evaluation evidence submitted. Check the returned verdict before making a human decision.",
    );
  };

  const submitMindReview = async (event) => {
    event.preventDefault();
    if (!selectedProposal || mindObjective.trim().length < 3) return;
    await runAction(
      "mind-review",
      "/api/usect/evolve/proposals/" + encodeURIComponent(selectedProposal.proposal_id) + "/mind-review",
      { tool_name: toolName.trim().toLowerCase(), objective: mindObjective.trim() },
      "Infinite Mind review submitted against the active signed Genesis baseline. No production change was made.",
    );
  };

  const submitDecision = async (decision) => {
    if (!selectedProposal || decisionRationale.trim().length < 3) return;
    const result = await runAction(
      "decision",
      "/api/usect/evolve/proposals/" + encodeURIComponent(selectedProposal.proposal_id) + "/decision",
      { decision, rationale: decisionRationale.trim() },
      decision === "approve_for_next_stage"
        ? "Human decision recorded: candidate may proceed to the next engineering review. Production deployment is still not authorized."
        : "Human rejection recorded in the MongoDB evolution ledger.",
    );
    if (result) setDecisionRationale("");
  };

  const publishSignedTool = async (event) => {
    event.preventDefault();
    if (!publishName.trim()) return;
    await runAction(
      "publish",
      "/api/usect/evolve/tools/" + encodeURIComponent(publishName.trim().toLowerCase()) + "/publish",
      {},
      "Genesis publication request completed. Verify the signed version and approval tier before activation.",
    );
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-indigo-200/80 bg-white shadow-sm dark:border-indigo-950 dark:bg-slate-900">
      <header className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-5 py-6 dark:border-slate-800 dark:from-indigo-950/40 dark:via-slate-900 dark:to-violet-950/30 sm:px-7">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
              <Sparkles className="h-4 w-4" /> Invention and improvement factory
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">RevelaAI Evolver</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Create guarded inventions, measure improvement candidates, learn from Brain OS outcomes and route review through Infinite Mind. Genesis remains the signed tool publisher.
            </p>
          </div>
          <button type="button" onClick={() => refresh(true)} disabled={refreshing || loading} className={secondaryButtonClass}>
            <RefreshCw className={"h-4 w-4 " + (refreshing ? "animate-spin" : "")}/> Refresh factory
          </button>
        </div>
        <div className="relative mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/80 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-950/60">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Learning ledger</span>
            <div className="mt-2 flex items-center justify-between gap-2">
              <strong className="text-sm text-slate-900 dark:text-white">{health?.learning_store || "checking"}</strong>
              <StatusTag value={health?.status || "unknown"} />
            </div>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-950/60">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Capability states</span>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
              <span>{capabilityCounts.available} available</span>
              <span className="text-rose-600 dark:text-rose-300">{capabilityCounts.blocked} blocked</span>
              <span className="text-amber-600 dark:text-amber-300">{capabilityCounts.unprobed} unprobed</span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-950/60">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Mongo proposals</span>
            <strong className="mt-2 block text-xl font-black text-slate-900 dark:text-white">{proposals.length}</strong>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-950/60">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Active signed tools</span>
            <strong className="mt-2 block text-xl font-black text-slate-900 dark:text-white">{activeTools.length}</strong>
          </div>
        </div>
      </header>

      {(loading || Object.keys(errors).length > 0) && (
        <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
          {loading && <p className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/> Loading factory evidence…</p>}
          {Object.entries(errors).filter(([key, value]) => key !== "action" && value).map(([key, value]) => (
            <p key={key} className="mt-1 flex items-start gap-2 text-xs leading-5 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0"/> <span><strong>{key}:</strong> {value}</span>
            </p>
          ))}
        </div>
      )}

      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-2">
        <form onSubmit={createInvention} className="min-w-0 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/15 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300"><WandSparkles className="h-5 w-5"/></span>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Invent a new capability</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">Genesis/Core-One researches and prepares an invention proposal. It is not automatically merged, published or deployed.</p>
            </div>
          </div>
          <Field label="What should RevelaAI invent?" hint={demand.length + "/500 characters"}>
            <textarea value={demand} onChange={(event) => setDemand(event.target.value)} maxLength={500} rows={3} required minLength={3} placeholder="Describe a real problem and the tool or capability needed…" className={inputClass}/>
          </Field>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Country code">
              <input value={country} onChange={(event) => setCountry(event.target.value.toUpperCase().slice(0, 2))} maxLength={2} className={inputClass}/>
            </Field>
            <Field label="Language">
              <input value={language} onChange={(event) => setLanguage(event.target.value.slice(0, 20))} maxLength={20} className={inputClass}/>
            </Field>
          </div>
          <button type="submit" disabled={busy === "invention" || demand.trim().length < 3} className={"mt-4 " + buttonClass}>
            {busy === "invention" ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
            Ask Genesis to invent
          </button>
        </form>

        <form onSubmit={createEvolution} className="min-w-0 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/15 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"><GitBranch className="h-5 w-5"/></span>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Create an improvement cycle</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">Metric-driven proposals are saved in MongoDB and reused as evidence in later generations.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Tool identifier" hint={"System scope: " + systemId}>
              <input value={toolName} onChange={(event) => setToolName(event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64))} required minLength={1} className={inputClass}/>
            </Field>
            <Field label="Brain OS learning domain">
              <select value={brainCategory} onChange={(event) => setBrainCategory(event.target.value)} className={inputClass}>
                {["engineering", "coding", "research", "security", "general", "biashara", "shamba", "elimu", "community", "scripture"].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Measurable improvement objective">
            <textarea value={objective} onChange={(event) => setObjective(event.target.value)} maxLength={2000} rows={2} required minLength={8} className={inputClass}/>
          </Field>
          <Field label="Metric targets (JSON)" hint="Include baseline, target, direction and optional unit for each metric.">
            <textarea value={metricsJson} onChange={(event) => setMetricsJson(event.target.value)} rows={5} spellCheck={false} className={inputClass + " font-mono text-[11px] leading-5"}/>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Baseline evidence references" hint="One reference per line.">
              <textarea value={evidenceRefs} onChange={(event) => setEvidenceRefs(event.target.value)} rows={2} className={inputClass}/>
            </Field>
            <Field label="Maximum generation depth">
              <select value={requestedDepth} onChange={(event) => setRequestedDepth(event.target.value)} className={inputClass}>
                <option value="1">1 generation</option>
                <option value="2">2 generations</option>
                <option value="3">3 generations</option>
              </select>
            </Field>
          </div>
          <button type="submit" disabled={busy === "evolution" || objective.trim().length < 8 || !toolName.trim()} className={"mt-4 " + buttonClass}>
            {busy === "evolution" ? <Loader2 className="h-4 w-4 animate-spin"/> : <GitBranch className="h-4 w-4"/>}
            Create Mongo-backed proposal
          </button>
        </form>
      </div>

      <div className="border-t border-slate-200 px-4 py-5 dark:border-slate-800 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Evolution timeline</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Proposal metadata, evaluations and human decisions recovered from MongoDB. Original objectives and review rationale are not displayed or stored in plaintext.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
            <span className="rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">Scope {systemId}</span>
            <span className="rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">{learning?.evaluation_count ?? 0} evaluations</span>
          </div>
        </div>

        {errors.proposals && <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">{errors.proposals}</p>}
        {proposals.length ? (
          <div className="mt-4 space-y-3">
            {proposals.map((item) => (
              <article key={item.proposal_id} className={"min-w-0 rounded-2xl border p-4 transition " + (selectedProposalId === item.proposal_id ? "border-indigo-400 bg-indigo-50/40 dark:border-indigo-700 dark:bg-indigo-950/15" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/40")}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">Generation {item.generation} · {item.system_id}</h4>
                      <StatusTag value={item.human_decision?.decision || item.latest_evaluation?.status || item.status}/>
                    </div>
                    <p className="mt-2 break-all font-mono text-[10px] text-slate-500">Proposal {item.proposal_id}</p>
                    <p className="mt-1 break-all font-mono text-[10px] text-slate-500">Objective fingerprint {item.objective_fingerprint || "unavailable"}</p>
                    <p className="mt-2 text-[11px] leading-5 text-slate-600 dark:text-slate-400">{(item.hypotheses || []).slice(0, 2).join(" ")}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedProposalId(item.proposal_id)} className={secondaryButtonClass}>
                    {selectedProposalId === item.proposal_id ? "Selected" : "Review proposal"} <ArrowRight className="h-3.5 w-3.5"/>
                  </button>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900">
                    <span className="block text-[9px] font-bold uppercase text-slate-400">Candidate evidence</span>
                    <StatusTag value={item.latest_evaluation?.evidence_complete ? "complete" : "not evaluated"}/>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900">
                    <span className="block text-[9px] font-bold uppercase text-slate-400">Test and security</span>
                    <StatusTag value={item.latest_evaluation?.test_passed && item.latest_evaluation?.security_review_passed ? "passed" : "not verified"}/>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900">
                    <span className="block text-[9px] font-bold uppercase text-slate-400">Human decision</span>
                    <StatusTag value={item.human_decision?.decision || "awaiting review"}/>
                  </div>
                </div>
                {selectedProposalId === item.proposal_id && (
                  <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 dark:border-slate-800 xl:grid-cols-2">
                    <form onSubmit={evaluateProposal} className="min-w-0">
                      <h5 className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100"><FlaskConical className="h-4 w-4 text-indigo-500"/> Submit candidate measurements</h5>
                      <p className="mt-1 text-[10px] leading-4 text-slate-500">Only submit real candidate measurements with traceable evidence. These inputs are reviewed as supplied evidence, not cryptographically attested CI proof.</p>
                      <textarea value={evaluationJson} onChange={(event) => setEvaluationJson(event.target.value)} rows={6} spellCheck={false} className={inputClass + " font-mono text-[10px] leading-5"}/>
                      <button type="submit" disabled={busy === "evaluation"} className={"mt-3 " + secondaryButtonClass}>
                        {busy === "evaluation" ? <Loader2 className="h-4 w-4 animate-spin"/> : <FileCheck2 className="h-4 w-4"/>} Record evaluation
                      </button>
                    </form>

                    <div className="min-w-0 space-y-4">
                      <form onSubmit={submitMindReview}>
                        <h5 className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100"><Brain className="h-4 w-4 text-violet-500"/> Ask Infinite Mind to review</h5>
                        <p className="mt-1 text-[10px] leading-4 text-slate-500">Re-enter the exact original objective. The server checks its fingerprint and requires an active signed Genesis baseline for this tool.</p>
                        <textarea value={mindObjective} onChange={(event) => setMindObjective(event.target.value)} rows={2} maxLength={500} placeholder="Paste the exact objective used to create this proposal…" className={inputClass}/>
                        <button type="submit" disabled={busy === "mind-review" || mindObjective.trim().length < 3} className={"mt-3 " + secondaryButtonClass}>
                          {busy === "mind-review" ? <Loader2 className="h-4 w-4 animate-spin"/> : <Brain className="h-4 w-4"/>} Request Mind review
                        </button>
                      </form>

                      <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
                        <h5 className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100"><ShieldCheck className="h-4 w-4 text-emerald-600"/> Human review decision</h5>
                        <p className="mt-1 text-[10px] leading-4 text-slate-500">Approval only authorizes the next engineering review. It does not publish, activate, merge or deploy a tool.</p>
                        <textarea value={decisionRationale} onChange={(event) => setDecisionRationale(event.target.value)} rows={2} maxLength={1000} minLength={3} placeholder="Explain the evidence behind your decision…" className={inputClass}/>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={() => submitDecision("approve_for_next_stage")} disabled={busy === "decision" || decisionRationale.trim().length < 3 || !item.latest_evaluation?.eligible_for_review || Boolean(item.human_decision)} className={buttonClass}>
                            {busy === "decision" ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle2 className="h-4 w-4"/>} Approve next stage
                          </button>
                          <button type="button" onClick={() => submitDecision("reject")} disabled={busy === "decision" || decisionRationale.trim().length < 3 || Boolean(item.human_decision)} className={secondaryButtonClass}>
                            Reject candidate
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center dark:border-slate-700">
            <GitBranch className="mx-auto h-6 w-6 text-slate-400"/>
            <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">No evolution proposals in this scope yet</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Create a measurable proposal above. It will be recorded in MongoDB and available after process restarts.</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 border-t border-slate-200 p-4 dark:border-slate-800 sm:grid-cols-2 sm:p-6">
        <form onSubmit={publishSignedTool} className="min-w-0 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/10">
          <h3 className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white"><ShieldCheck className="h-4 w-4 text-emerald-600"/> Publish a staged Genesis tool</h3>
          <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">Genesis runs Guardian and sandbox validation, then signs an immutable artifact. This does not activate or execute it.</p>
          <Field label="Exact Genesis tool name">
            <input value={publishName} onChange={(event) => setPublishName(event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64))} className={inputClass} required/>
          </Field>
          <button type="submit" disabled={busy === "publish" || !publishName.trim()} className={"mt-3 " + secondaryButtonClass}>
            {busy === "publish" ? <Loader2 className="h-4 w-4 animate-spin"/> : <ShieldCheck className="h-4 w-4"/>} Run Guardian and publish
          </button>
        </form>
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <h3 className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white"><Layers3 className="h-4 w-4 text-indigo-500"/> Capability inventory</h3>
          <p className="mt-1 text-[10px] leading-4 text-slate-500">This inventory is not a second tool registry. Genesis owns executable signed tools.</p>
          {errors.capabilities && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{errors.capabilities}</p>}
          <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-1">
            {capabilities.map((item) => (
              <div key={item.capability_id} className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-slate-800 dark:text-slate-100">{item.capability_id}</p>
                  <p className="truncate text-[10px] text-slate-500">{item.owner} · {item.execution_boundary}</p>
                </div>
                <StatusTag value={item.runtime_state || item.lifecycle}/>
              </div>
            ))}
            {!capabilities.length && !errors.capabilities && <p className="text-xs text-slate-500">Capability inventory not returned.</p>}
          </div>
        </div>
      </div>

      {(notice || errors.action) && (
        <div role={errors.action ? "alert" : "status"} className={"mx-4 mb-4 flex items-start gap-2 rounded-2xl border p-3 text-xs leading-5 sm:mx-6 " + (errors.action ? "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200" : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200")}>
          {errors.action ? <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0"/> : <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0"/>}
          <span>{errors.action || notice}</span>
        </div>
      )}

      <footer className="flex flex-wrap items-start gap-2 border-t border-slate-200 bg-slate-50 px-4 py-4 text-[10px] leading-5 text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 sm:px-6">
        <CircleHelp className="mt-0.5 h-4 w-4 flex-shrink-0"/>
        <p>MongoDB is the durable Evolver learning ledger. The browser only holds form state. Production self-modification, automatic merge, physical actuation and automatic tool activation remain disabled; risk-tier approvals stay with Genesis and the designated owner.</p>
      </footer>
    </section>
  );
}
