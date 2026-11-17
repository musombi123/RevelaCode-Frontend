import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, CheckCircle2, GitBranch, Loader2, RefreshCw,
  ShieldCheck, Sprout
} from "lucide-react";

const API_BASE = String(
  import.meta.env.VITE_REVELAAI_API_URL ||
  import.meta.env.VITE_REVELAAI_API_BASE ||
  "https://revelaai.onrender.com",
).trim().replace(/\/+$/, "");

const ATTACK_CLASSES = [
  "auth_bruteforce", "sql_injection", "cross_site_scripting", "path_traversal",
  "request_rate_abuse", "unsafe_deserialization", "dependency_vulnerability",
  "malformed_input", "other",
];
const CONTROL_OPTIONS = [
  ["auth_rate_limit", "Authentication rate limit"],
  ["parameterized_queries", "Parameterized queries"],
  ["output_encoding", "Output encoding"],
  ["path_allowlist", "Path allowlist"],
  ["request_body_limit", "Request-body limit"],
  ["dependency_patch", "Dependency patch"],
  ["mfa_requirement", "MFA requirement"],
  ["manual_triage", "Manual triage"],
];
const CONTROL_LABELS = Object.fromEntries(CONTROL_OPTIONS);
const inputClass = "mt-1.5 min-h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800";

function errorMessage(payload, status) {
  const detail = payload?.detail?.message || payload?.error?.message ||
    payload?.message || payload?.detail || payload?.error?.code;
  if (typeof detail === "string" && detail.trim()) return detail.trim();
  if (Array.isArray(detail)) return detail.map((item) => item?.msg || String(item)).join("; ");
  return "Living Systems request failed (HTTP " + status + ").";
}

async function requestLifecycle(path, options = {}, authenticatedFetch) {
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  const url = API_BASE + path;
  const transport = typeof authenticatedFetch === "function" ? authenticatedFetch : fetch;
  const response = await transport(url, { ...options, headers, cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(errorMessage(payload, response.status));
  return payload?.data ?? payload;
}

function Field({ label, hint, children }) {
  return (
    <label className="block min-w-0">
      <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-200">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[10px] leading-4 text-slate-500 dark:text-slate-400">{hint}</span> : null}
    </label>
  );
}

function Metric({ label, value, detail }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">{value ?? "—"}</p>
      <p className="mt-1 text-[10px] leading-4 text-slate-500">{detail}</p>
    </div>
  );
}

function StateTag({ value }) {
  const state = String(value || "unknown").toLowerCase();
  const style = state === "alive"
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : state === "retired" || state === "expired"
      ? "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
      : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return <span className={"rounded-full border px-2 py-1 text-[9px] font-black uppercase " + style}>{state}</span>;
}

export default function LivingSystemsLab({ authenticatedFetch }) {
  const [dashboard, setDashboard] = useState(null);
  const [instances, setInstances] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [report, setReport] = useState(null);
  const [artifactHash, setArtifactHash] = useState("");
  const [leaseDays, setLeaseDays] = useState("30");
  const [parentId, setParentId] = useState("");
  const [benchmarkId, setBenchmarkId] = useState("controlled-run-001");
  const [attackClass, setAttackClass] = useState("auth_bruteforce");
  const [outcome, setOutcome] = useState("blocked");
  const [source, setSource] = useState("controlled_lab");
  const [evidenceHash, setEvidenceHash] = useState("");
  const [controlId, setControlId] = useState("auth_rate_limit");
  const [reviewControls, setReviewControls] = useState([]);
  const [reviewRationale, setReviewRationale] = useState("");
  const [retirementReason, setRetirementReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selected = useMemo(
    () => instances.find((item) => item.instance_id === selectedId) || null,
    [instances, selectedId],
  );
  const eligibleParents = useMemo(
    () => instances.filter((item) =>
      ["retired", "expired"].includes(item.status) &&
      item.memory_review?.decision === "approved" &&
      Array.isArray(item.memory_review?.control_ids) &&
      item.memory_review.control_ids.length > 0
    ),
    [instances],
  );
  const needsControl = outcome === "blocked" || outcome === "detected";

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    const results = await Promise.allSettled([
      requestLifecycle("/api/usect/lifecycle/dashboard", {}, authenticatedFetch),
      requestLifecycle("/api/usect/lifecycle/instances?limit=50", {}, authenticatedFetch),
    ]);
    if (results[0].status === "fulfilled") setDashboard(results[0].value);
    else setDashboard(null);
    if (results[1].status === "fulfilled") {
      const next = Array.isArray(results[1].value?.instances) ? results[1].value.instances : [];
      setInstances(next);
      setSelectedId((current) => next.some((item) => item.instance_id === current)
        ? current
        : next[0]?.instance_id || "");
    } else {
      setInstances([]);
    }
    const failures = results.filter((item) => item.status === "rejected");
    if (failures.length) setError(failures.map((item) => item.reason?.message || "Lifecycle data unavailable").join(" · "));
    setLoading(false);
  }, [authenticatedFetch]);

  useEffect(() => {
    refresh(false);
  }, [refresh]);

  useEffect(() => {
    if (!selected) {
      setReport(null);
      setReviewControls([]);
      return;
    }
    setReviewControls(selected.candidate_control_ids || []);
    let cancelled = false;
    requestLifecycle(
      "/api/usect/lifecycle/instances/" + encodeURIComponent(selected.instance_id) + "/report",
      {},
      authenticatedFetch,
    ).then((value) => {
      if (!cancelled) setReport(value);
    }).catch((reason) => {
      if (!cancelled) {
        setReport(null);
        setError(reason?.message || "Instance report unavailable.");
      }
    });
    return () => { cancelled = true; };
  }, [selected, authenticatedFetch]);

  const run = async (key, path, body, successText) => {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      const result = await requestLifecycle(path, {
        method: "POST",
        body: JSON.stringify(body),
      }, authenticatedFetch);
      setNotice(successText);
      await refresh(true);
      return result;
    } catch (reason) {
      setError(reason?.message || "The lifecycle operation could not be completed.");
      return null;
    } finally {
      setBusy("");
    }
  };

  const createBirth = async (event) => {
    event.preventDefault();
    if (!/^[0-9a-f]{64}$/.test(artifactHash.trim())) {
      setError("Enter the SHA-256 digest of the exact build artifact. Do not use a placeholder hash.");
      return;
    }
    if (parentId && !window.confirm("Create a child from this retired parent using its approved defensive memory? The owner-consent flag will be recorded.")) return;
    const result = await run(
      "birth",
      "/api/usect/lifecycle/instances",
      {
        system_id: "revelaai-defensive-runtime",
        artifact_sha256: artifactHash.trim(),
        lease_days: Number(leaseDays),
        parent_instance_id: parentId || null,
        consent_to_inherit: Boolean(parentId),
      },
      "Lifecycle birth recorded. The 30-day value is a server-side research lease, not proof of offline survival.",
    );
    if (result?.instance?.instance_id) setSelectedId(result.instance.instance_id);
    if (result) {
      setArtifactHash("");
      setParentId("");
    }
  };

  const addObservation = async (event) => {
    event.preventDefault();
    if (!selected) return;
    if (!/^[0-9a-f]{64}$/.test(evidenceHash.trim())) {
      setError("Enter the SHA-256 digest of the benchmark evidence artifact.");
      return;
    }
    const body = {
      benchmark_id: benchmarkId.trim(),
      attack_class: attackClass,
      outcome,
      source,
      evidence_sha256: evidenceHash.trim(),
      ...(needsControl ? { control_id: controlId } : {}),
    };
    const result = await run(
      "observation",
      "/api/usect/lifecycle/instances/" + encodeURIComponent(selected.instance_id) + "/observations",
      body,
      "Defensive observation recorded. The API stores labels and evidence hashes, not attack payloads or IP addresses.",
    );
    if (result) setEvidenceHash("");
  };

  const reviewMemory = async (decision) => {
    if (!selected) return;
    if (reviewRationale.trim().length < 3) {
      setError("Add a clear reason for the human memory-review decision.");
      return;
    }
    const approved = decision === "approve";
    const chosen = approved ? reviewControls.filter((item) => (selected.candidate_control_ids || []).includes(item)) : [];
    if (approved && !chosen.length) {
      setError("Select at least one evidence-backed control to approve.");
      return;
    }
    const result = await run(
      "review",
      "/api/usect/lifecycle/instances/" + encodeURIComponent(selected.instance_id) + "/memory-review",
      { decision, control_ids: chosen, rationale: reviewRationale.trim() },
      approved ? "Human review approved the selected defensive memory." : "Defensive memory was rejected; it cannot be inherited.",
    );
    if (result) setReviewRationale("");
  };

  const retire = async () => {
    if (!selected || retirementReason.trim().length < 8) {
      setError("Provide a retirement reason of at least eight characters.");
      return;
    }
    if (!window.confirm("Retire this instance? Its research record will be preserved. User files and keys will not be deleted or wiped.")) return;
    const result = await run(
      "retire",
      "/api/usect/lifecycle/instances/" + encodeURIComponent(selected.instance_id) + "/retire",
      { reason: retirementReason.trim() },
      "Instance retired. Evidence and user data are preserved; no keys were wiped.",
    );
    if (result) setRetirementReason("");
  };

  const observations = report?.observations || {};
  const selectedCandidates = selected?.candidate_control_ids || [];

  return (
    <section className="min-w-0 border-b border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/30 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
            <Sprout className="h-4 w-4" /> Artificial Life · Defensive Evolution
          </div>
          <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">Living Systems Lab</h3>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600 dark:text-slate-400">
            Record parent/child lineage, defensive test evidence, reviewed memory inheritance and retirement. This is a controlled research ledger—not an autonomous self-modifying runtime.
          </p>
        </div>
        <button type="button" onClick={() => refresh(true)} disabled={loading || !!busy} className={secondaryClass}>
          <RefreshCw className={"h-3.5 w-3.5 " + (loading ? "animate-spin" : "")} /> Refresh lifecycle
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <Metric label="Instances" value={dashboard?.total_instances} detail="Recorded lineages" />
        <Metric label="Alive" value={dashboard?.alive} detail="Within active lease" />
        <Metric label="Retired" value={dashboard?.retired} detail="Explicitly retired" />
        <Metric label="Expired" value={dashboard?.expired} detail="Lease elapsed" />
        <Metric label="Inherited" value={dashboard?.instances_with_inheritance} detail="Child generations" />
        <Metric label="Persistence" value={dashboard?.durable ? "MongoDB" : "—"} detail={dashboard?.lease_enforcement || "Not verified"} />
      </div>

      {(error || notice) && (
        <div role={error ? "alert" : "status"} className={"mt-3 rounded-xl border p-3 text-xs leading-5 " + (error
          ? "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200"
          : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200")}>
          {error || notice}
        </div>
      )}

      <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-2">
        <form onSubmit={createBirth} className="min-w-0 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Sprout className="h-4 w-4 text-emerald-600" />
            <h4 className="text-xs font-black text-slate-900 dark:text-white">Birth a research instance</h4>
          </div>
          <Field label="Build artifact SHA-256" hint="Hash the exact deployed/test build. A guessed or placeholder digest invalidates the evidence chain.">
            <input value={artifactHash} onChange={(event) => setArtifactHash(event.target.value.toLowerCase())} maxLength={64} minLength={64} placeholder="64-character lowercase SHA-256" className={inputClass} required />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Research lease">
              <select value={leaseDays} onChange={(event) => setLeaseDays(event.target.value)} className={inputClass}>
                <option value="1">1 day</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
            </Field>
            <Field label="Parent (optional)" hint="Only retired/expired parents with approved memory are eligible.">
              <select value={parentId} onChange={(event) => setParentId(event.target.value)} className={inputClass}>
                <option value="">Root generation (no parent)</option>
                {eligibleParents.map((item) => (
                  <option key={item.instance_id} value={item.instance_id}>
                    G{item.generation} · {item.instance_id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {parentId ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-[10px] leading-4 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
              Creating this child records explicit consent by the same owner. Only human-approved defensive control IDs and evidence hashes are inherited.
            </p>
          ) : null}
          <button type="submit" disabled={!!busy || artifactHash.trim().length !== 64} className={buttonClass}>
            {busy === "birth" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />} Create birth record
          </button>
        </form>

        <form onSubmit={addObservation} className="min-w-0 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-600" />
            <h4 className="text-xs font-black text-slate-900 dark:text-white">Record a defensive observation</h4>
          </div>
          <Field label="Active instance">
            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className={inputClass} required>
              {instances.filter((item) => item.status === "alive").map((item) => (
                <option key={item.instance_id} value={item.instance_id}>
                  G{item.generation} · {item.instance_id.slice(0, 8)}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Benchmark / run ID">
              <input value={benchmarkId} onChange={(event) => setBenchmarkId(event.target.value)} maxLength={80} minLength={3} className={inputClass} required />
            </Field>
            <Field label="Test source">
              <select value={source} onChange={(event) => setSource(event.target.value)} className={inputClass}>
                <option value="synthetic_fixture">Synthetic fixture</option>
                <option value="controlled_lab">Controlled lab</option>
                <option value="production_telemetry">Production telemetry</option>
              </select>
            </Field>
            <Field label="Defensive test class">
              <select value={attackClass} onChange={(event) => setAttackClass(event.target.value)} className={inputClass}>
                {ATTACK_CLASSES.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
              </select>
            </Field>
            <Field label="Observed outcome">
              <select value={outcome} onChange={(event) => setOutcome(event.target.value)} className={inputClass}>
                <option value="blocked">Blocked</option>
                <option value="detected">Detected, not blocked</option>
                <option value="missed">Missed</option>
                <option value="false_positive">False positive</option>
              </select>
            </Field>
          </div>
          {needsControl ? (
            <Field label="Existing defensive control credited">
              <select value={controlId} onChange={(event) => setControlId(event.target.value)} className={inputClass}>
                {CONTROL_OPTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            </Field>
          ) : null}
          <Field label="Evidence artifact SHA-256" hint="Hash the report/log/test artifact. Never paste credentials, raw payloads, IP addresses or user data here.">
            <input value={evidenceHash} onChange={(event) => setEvidenceHash(event.target.value.toLowerCase())} maxLength={64} minLength={64} placeholder="64-character lowercase SHA-256" className={inputClass} required />
          </Field>
          <button type="submit" disabled={!!busy || !selected || evidenceHash.trim().length !== 64} className={secondaryClass}>
            {busy === "observation" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Save measured observation
          </button>
        </form>
      </div>

      <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="text-xs font-black text-slate-900 dark:text-white">Lineage registry</h4>
            <span className="text-[10px] text-slate-500">{instances.length} records</span>
          </div>
          {loading && !instances.length ? (
            <p className="flex items-center gap-2 py-5 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading records…</p>
          ) : instances.length ? (
            <div className="max-h-80 space-y-2 overflow-auto pr-1">
              {instances.map((item) => (
                <button key={item.instance_id} type="button" onClick={() => setSelectedId(item.instance_id)}
                  className={"w-full rounded-xl border p-3 text-left transition " + (selectedId === item.instance_id
                    ? "border-indigo-400 bg-indigo-50/70 dark:border-indigo-800 dark:bg-indigo-950/30"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700")}>
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className="truncate text-[11px] font-black text-slate-800 dark:text-slate-100">Generation {item.generation} · {item.instance_id.slice(0, 10)}</span>
                    <StateTag value={item.status} />
                  </div>
                  <p className="mt-1 truncate text-[10px] text-slate-500">Parent: {item.parent_instance_id ? item.parent_instance_id.slice(0, 10) : "Root"} · Expires: {item.expires_at ? new Date(item.expires_at).toLocaleDateString() : "—"}</p>
                  {item.inherited_control_ids?.length ? <p className="mt-1 text-[10px] text-emerald-700 dark:text-emerald-300">Inherited: {item.inherited_control_ids.join(", ")}</p> : null}
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500 dark:border-slate-700">No lifecycle instances recorded. Birth the first research instance using a real artifact hash.</p>
          )}
        </div>

        <div className="min-w-0 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">Generation evidence & review</h4>
              <p className="mt-1 text-[10px] text-slate-500">{selected ? "Selected generation " + selected.generation + " · " + selected.instance_id.slice(0, 12) : "Select an instance to inspect its measurements."}</p>
            </div>
            {selected ? <StateTag value={selected.status} /> : null}
          </div>
          {selected ? (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Metric label="Cases faced" value={observations.cases_faced} detail="Blocked + detected + missed" />
                <Metric label="Blocked" value={observations.blocked} detail="Recorded as blocked" />
                <Metric label="Detected" value={observations.detected_not_blocked} detail="Detection only" />
                <Metric label="False positives" value={observations.false_positives} detail="Reported separately" />
              </div>
              <p className="text-[10px] leading-4 text-slate-500">
                Detection rate: {observations.detection_rate == null ? "not measured" : (observations.detection_rate * 100).toFixed(1) + "%"} ·
                Block rate: {observations.block_rate == null ? "not measured" : (observations.block_rate * 100).toFixed(1) + "%"}.
                Evidence is {observations.evidence_quality || "not verified"}.
              </p>
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <h5 className="text-[11px] font-black text-slate-800 dark:text-slate-100">Human memory review</h5>
                {selectedCandidates.length ? (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {selectedCandidates.map((id) => (
                      <label key={id} className="flex min-w-0 items-center gap-2 text-[10px] text-slate-700 dark:text-slate-300">
                        <input type="checkbox" checked={reviewControls.includes(id)} onChange={(event) => setReviewControls((current) =>
                          event.target.checked ? [...current, id] : current.filter((value) => value !== id)
                        )} />
                        <span>{CONTROL_LABELS[id] || id}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-[10px] text-slate-500">No positive defensive-control observations are available for review.</p>
                )}
                <Field label="Reviewer rationale">
                  <textarea value={reviewRationale} onChange={(event) => setReviewRationale(event.target.value)} rows={2} maxLength={1000} placeholder="Explain why this evidence supports—or rejects—the selected defensive memory." className={inputClass} />
                </Field>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => reviewMemory("approve")} disabled={!!busy || !selectedCandidates.length || !reviewControls.length || reviewRationale.trim().length < 3} className={buttonClass}>
                    {busy === "review" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Approve selected memory
                  </button>
                  <button type="button" onClick={() => reviewMemory("reject")} disabled={!!busy || reviewRationale.trim().length < 3} className={secondaryClass}>Reject memory</button>
                </div>
                {selected.memory_review ? <p className="mt-2 text-[10px] text-slate-500">Current decision: <strong>{selected.memory_review.decision}</strong> · {selected.memory_review.control_ids?.join(", ") || "No controls approved"}</p> : null}
              </div>
              {selected.status === "alive" ? (
                <div className="rounded-xl border border-rose-200 p-3 dark:border-rose-900/50">
                  <Field label="Retirement reason">
                    <input value={retirementReason} onChange={(event) => setRetirementReason(event.target.value)} maxLength={500} minLength={8} placeholder="End of controlled generation window…" className={inputClass} />
                  </Field>
                  <button type="button" onClick={retire} disabled={!!busy || retirementReason.trim().length < 8} className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-xl border border-rose-300 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/20">
                    {busy === "retire" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />} Retire instance
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500 dark:border-slate-700">Instance report unavailable until a generation is selected.</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Evidence submitted here is operator-recorded, not independently attested. A 30-day lease is only a server-side record; offline survival, device transfer, automatic defence deployment and any 8×/50× improvement remain unverified. Retirement preserves records and does not wipe keys or user data.
        </p>
      </div>
    </section>
  );
}
