import React, { useCallback, useEffect, useMemo, useState } from "react";
import { readAccessToken, readTokenType } from "@/auth/tokenStorage.mjs";
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Cpu,
  Layers,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";

const API_BASE = String(
  import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com",
).trim().replace(/\/+$/, "");

function readAuthHeaders(jsonBody = false) {
  const headers = jsonBody ? { "Content-Type": "application/json" } : {};
  const token = readAccessToken();
  if (token) headers.Authorization = readTokenType() + " " + token;
  return headers;
}

async function requestCoreMesh(path, options = {}) {
  const response = await fetch(API_BASE + path, {
    ...options,
    headers: {
      ...readAuthHeaders(Boolean(options.body)),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    // Preserve a useful fallback for non-JSON gateway responses.
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      (typeof payload?.error === "string" ? payload.error : "") ||
      "Core Mesh request failed (HTTP " + response.status + ").";
    throw new Error(String(message));
  }

  return payload?.data ?? payload;
}

const CORE_CARDS = {
  zero: {
    title: "USECT-ZERO",
    subtitle: "THE BODY",
    description: "Diagnostics, integrity evidence and human-gated recovery.",
    icon: Cpu,
    color: "sky",
  },
  one: {
    title: "Genesis · Core-One",
    subtitle: "THE WOMB",
    description: "Builds guarded invention proposals; it does not deploy them.",
    icon: Layers,
    color: "amber",
  },
  two: {
    title: "Infinite Mind · Core-Two",
    subtitle: "THE MIND",
    description: "Mirrors the cores, evaluates candidates and ranks improvements.",
    icon: Brain,
    color: "violet",
  },
};

const colorClasses = {
  sky: {
    icon: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
    line: "from-sky-500 to-cyan-400",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    line: "from-amber-500 to-yellow-300",
  },
  violet: {
    icon: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    line: "from-violet-500 to-fuchsia-400",
  },
};

function DataPoint({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="min-w-0 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/50">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-800 dark:text-slate-100">{String(value)}</p>
    </div>
  );
}

function StatusPill({ reachable }) {
  const classes = reachable
    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return (
    <span className={"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] " + classes}>
      <span className={"h-1.5 w-1.5 rounded-full " + (reachable ? "bg-emerald-500" : "bg-amber-500")} />
      {reachable ? "Reachable" : "Unavailable"}
    </span>
  );
}

export default function CoreMeshDashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionBusy, setActionBusy] = useState("");
  const [demand, setDemand] = useState("");
  const [objective, setObjective] = useState("Improve offline_vault graph traversal efficiency");
  const [toolName, setToolName] = useState("offline_vault_fixture");
  const [actionResult, setActionResult] = useState(null);
  const [signedTools, setSignedTools] = useState([]);
  const [canExecuteTools, setCanExecuteTools] = useState(false);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [toolsError, setToolsError] = useState("");
  const [toolArguments, setToolArguments] = useState(
    '{"action":"Describe the result and its evidence","inputs":{},"consent":false}',
  );
  const [executingTool, setExecutingTool] = useState("");
  const [toolExecutionResult, setToolExecutionResult] = useState(null);

  const refresh = useCallback(async (force = false) => {
    setRefreshing(true);
    setError("");
    try {
      const data = await requestCoreMesh("/api/core-mesh/dashboard" + (force ? "?refresh=1" : ""));
      setSnapshot(data);
    } catch (requestError) {
      setError(requestError?.message || "Could not read the Core Mesh status.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refreshSignedTools = useCallback(async () => {
    setToolsLoading(true);
    setToolsError("");
    try {
      const data = await requestCoreMesh("/api/core-mesh/tools");
      setSignedTools(Array.isArray(data?.active_tools) ? data.active_tools : []);
      setCanExecuteTools(data?.can_execute === true);
    } catch (requestError) {
      setSignedTools([]);
      setCanExecuteTools(false);
      setToolsError(requestError?.message || "Signed Genesis tools could not be loaded.");
    } finally {
      setToolsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh(true);
    refreshSignedTools();
    const timer = window.setInterval(() => {
      refresh(false);
      refreshSignedTools();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [refresh, refreshSignedTools]);

  const cores = snapshot?.cores || {};
  const onlineCount = useMemo(
    () => Object.values(cores).filter((core) => core?.reachable).length,
    [cores],
  );
  const configuration = snapshot?.configuration || {};

  const submitProposal = useCallback(async (kind) => {
    const genesis = kind === "genesis";
    const endpoint = genesis
      ? "/api/core-mesh/genesis/invent"
      : "/api/core-mesh/mind/evolve";
    const label = genesis ? "Genesis invention proposal" : "Infinite Mind evolution proposal";
    const body = genesis
      ? { demand: demand.trim() }
      : { objective: objective.trim(), tool_name: toolName.trim() };

    if (genesis && body.demand.length < 3) {
      setNotice("Describe the tool or capability Genesis should propose.");
      return;
    }
    if (!genesis && body.objective.length < 3) {
      setNotice("Describe the improvement objective.");
      return;
    }
    if (!genesis && !body.tool_name) {
      setNotice("Enter a tool/evolution identifier.");
      return;
    }

    setActionBusy(kind);
    setNotice("");
    setActionResult(null);
    try {
      const result = await requestCoreMesh(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setActionResult({ label, data: result });
      setNotice(label + " submitted. The result is a proposal; a human must review it.");
      if (genesis) setDemand("");
      await refresh(true);
    } catch (requestError) {
      setNotice(requestError?.message || (label + " could not be submitted."));
    } finally {
      setActionBusy("");
    }
  }, [demand, objective, toolName, refresh]);

  const executeSignedTool = useCallback(async (tool) => {
    const name = String(tool?.name || "");
    const version = String(tool?.version || "");
    const artifactHash = String(tool?.artifact_hash || "");
    const riskTier = Number(tool?.risk_tier ?? tool?.manifest?.risk_tier ?? 0);
    if (!name || !version || !/^[0-9a-f]{64}$/.test(artifactHash)) {
      setToolsError("The active tool record is missing a valid signed artifact identity.");
      return;
    }

    let argumentsObject;
    try {
      argumentsObject = JSON.parse(toolArguments);
    } catch {
      setToolsError("Tool arguments must be valid JSON before execution.");
      return;
    }
    if (!argumentsObject || typeof argumentsObject !== "object" || Array.isArray(argumentsObject)) {
      setToolsError("Tool arguments must be a JSON object.");
      return;
    }
    if (typeof argumentsObject.action !== "string" || !argumentsObject.action.trim()) {
      setToolsError('Tool arguments require a non-empty "action" string.');
      return;
    }
    if (!window.confirm(
      "Run the active signed tool '" + name + "' (risk tier " + riskTier + ")? Genesis will verify the request again.",
    )) return;

    setExecutingTool(name);
    setToolsError("");
    setToolExecutionResult(null);
    try {
      let confirmationToken;
      if (riskTier === 2) {
        const confirmPath = "/api/core-mesh/tools/"
          + encodeURIComponent(name) + "/" + encodeURIComponent(version) + "/"
          + encodeURIComponent(artifactHash) + "/confirm";
        const confirmation = await requestCoreMesh(confirmPath, {
          method: "POST",
          body: JSON.stringify({ arguments: argumentsObject }),
        });
        confirmationToken = confirmation?.confirmation_token;
        if (!confirmationToken) {
          throw new Error("Genesis did not issue an action-bound confirmation token.");
        }
      }

      const result = await requestCoreMesh("/api/core-mesh/tools/execute", {
        method: "POST",
        body: JSON.stringify({
          name,
          version,
          artifact_hash: artifactHash,
          arguments: argumentsObject,
          ...(confirmationToken ? { confirmation_token: confirmationToken } : {}),
        }),
      });
      setToolExecutionResult({ name, riskTier, result });
      await refresh(true);
      await refreshSignedTools();
    } catch (requestError) {
      setToolsError(requestError?.message || "Genesis refused or could not complete the signed tool invocation.");
    } finally {
      setExecutingTool("");
    }
  }, [toolArguments, refresh, refreshSignedTools]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative border-b border-slate-200 px-5 py-6 dark:border-slate-800 sm:px-7">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                <Activity className="h-3.5 w-3.5" /> Live systems view
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">USECT Core Mesh</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                One coordinated stack: ZERO observes and guards recovery, Genesis proposes inventions, and Infinite Mind evaluates improvements.
              </p>
            </div>
            <button
              type="button"
              onClick={() => refresh(true)}
              disabled={refreshing}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw className={"h-4 w-4 " + (refreshing ? "animate-spin" : "")} />
              Refresh status
            </button>
          </div>
          <div className="relative mt-5 flex flex-wrap items-center gap-2">
            <span className={"inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold " + (onlineCount === 3 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300")}>
              <span className={"h-1.5 w-1.5 rounded-full " + (onlineCount === 3 ? "bg-emerald-500" : "bg-amber-500")} />
              {loading ? "Checking cores…" : (onlineCount + "/3 cores reachable")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Human approval required
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <Zap className="h-3.5 w-3.5" /> No automatic merge
            </span>
          </div>
        </div>

        {snapshot && (
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
            <div className="mb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Integration readiness</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Configuration checks are not proof of successful live execution.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <DataPoint label="ZERO dispatcher" value={configuration.zero_tools_ready ? "Configured" : "Missing configuration"} />
              <DataPoint label="ZERO enabled" value={configuration.zero_enabled ? "Enabled" : "Disabled"} />
              <DataPoint label="Genesis registry" value={configuration.genesis_registry_ready ? "Reachable" : "Unavailable"} />
              <DataPoint label="Genesis signing key" value={configuration.genesis_signing_key_configured === true ? "Configured" : configuration.genesis_signing_key_configured === false ? "Missing" : "Unknown"} />
              <DataPoint label="Genesis tool catalog" value={configuration.genesis_orchestrator_tools_enabled ? "Enabled" : "Disabled"} />
              <DataPoint label="Active signed tools" value={configuration.active_signed_tools_count ?? 0} />
              <DataPoint label="Mind mutation credential" value={configuration.write_credentials_configured ? "Configured" : "Missing"} />
              <DataPoint label="Operator allowlist" value={configuration.core_mesh_operator_allowlist_configured ? "Configured" : "Missing"} />
            </div>
          </div>
        )}

        {error && (
          <div className="m-5 flex items-start gap-3 rounded-2xl border border-rose-300/60 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-bold">Status request failed</p>
              <p className="mt-1 break-words text-xs leading-5">{error}</p>
              <p className="mt-1 text-xs opacity-80">Confirm the RevelaAI API URL and your signed-in session, then refresh.</p>
            </div>
          </div>
        )}

        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
          {Object.entries(CORE_CARDS).map(([key, item]) => {
            const core = cores[key] || {};
            const Icon = item.icon;
            const colors = colorClasses[item.color];
            const mode = key === "one"
              ? core.model_assisted === true
                ? "Model-assisted"
                : core.model_assisted === false
                  ? "Standalone"
                  : "Unknown"
              : core.model_free === false
                ? "Model-assisted"
                : core.model_free === true
                  ? "Model-free"
                  : "Unknown";
            return (
              <article key={key} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/40">
                <div className={"h-1 w-full bg-gradient-to-r " + colors.line} />
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className={"flex h-10 w-10 items-center justify-center rounded-xl " + colors.icon}><Icon className="h-5 w-5" /></span>
                    <StatusPill reachable={Boolean(core.reachable)} />
                  </div>
                  <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{item.subtitle}</p>
                  <p className="mt-3 min-h-[52px] text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>
                  {core.failure_reason && <p className="mt-2 break-words rounded-lg border border-amber-300/50 bg-amber-50 px-2.5 py-2 text-[10px] leading-4 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">Diagnostic: {core.failure_reason}</p>}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <DataPoint label="Version" value={core.version || "—"} />
                    <DataPoint label="Execution mode" value={mode} />
                    {key === "one" && <DataPoint label="Inventions" value={core.invention_count ?? "—"} />}
                    {key === "one" && <DataPoint label="Guardian" value={core.guardian_ready === true ? "Ready" : core.guardian_ready === false ? "Needs attention" : "Unknown"} />}
                    {key === "one" && <DataPoint label="Signed registry" value={core.signed_tool_registry_ready ? "Reachable" : "Unavailable"} />}
                    {key === "one" && <DataPoint label="Active signed tools" value={core.active_signed_tools_count ?? 0} />}
                    {key === "two" && <DataPoint label="Learning records" value={core.learning_feedback_count ?? "—"} />}
                    {key === "two" && <DataPoint label="Metrics" value={core.metrics_available ? "Available" : "Unavailable"} />}
                    {key === "zero" && <DataPoint label="Audit log" value={core.audit_log_observed === true ? "Observed" : core.audit_log_observed === false ? "Not observed" : "Unknown"} />}
                    {key === "zero" && <DataPoint label="Recovery policy" value={core.execution_policy || "Human-gated"} />}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="border-t border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40 sm:px-7">
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            Last refreshed: {snapshot?.refreshed_at ? new Date(snapshot.refreshed_at).toLocaleString() : "not yet available"}.
            {" "}Reachability confirms that a status endpoint responded; it does not certify production readiness or end-to-end correctness.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-start gap-3">
            <div className={"flex h-10 w-10 items-center justify-center rounded-xl " + colorClasses.amber.icon}><Layers className="h-5 w-5" /></div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Ask Genesis to propose a tool</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Sends an explicit invention demand to Core-One. Guardian rules remain authoritative.</p>
            </div>
          </div>
          <label className="mt-5 block text-xs font-bold text-slate-700 dark:text-slate-300" htmlFor="core-mesh-demand">Invention demand</label>
          <textarea id="core-mesh-demand" value={demand} onChange={(event) => setDemand(event.target.value)} maxLength={500} rows={3}
            placeholder="Describe the capability and real problem it should solve…"
            className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[10px] text-slate-400">{demand.length}/500 characters</span>
            <button type="button" onClick={() => submitProposal("genesis")} disabled={Boolean(actionBusy) || demand.trim().length < 3}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50">
              {actionBusy === "genesis" && <Loader2 className="h-4 w-4 animate-spin" />} Submit proposal
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-start gap-3">
            <div className={"flex h-10 w-10 items-center justify-center rounded-xl " + colorClasses.violet.icon}><Brain className="h-5 w-5" /></div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Ask Infinite Mind to evaluate an improvement</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Runs the guarded Core-Two evaluation path. Its output is staged for review, not deployed automatically.</p>
            </div>
          </div>
          <label className="mt-5 block text-xs font-bold text-slate-700 dark:text-slate-300" htmlFor="core-mesh-objective">Improvement objective</label>
          <textarea id="core-mesh-objective" value={objective} onChange={(event) => setObjective(event.target.value)} maxLength={500} rows={2}
            className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          <label className="mt-3 block text-xs font-bold text-slate-700 dark:text-slate-300" htmlFor="core-mesh-tool-name">Tool/evolution identifier</label>
          <input id="core-mesh-tool-name" value={toolName} onChange={(event) => setToolName(event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))} maxLength={64}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={() => submitProposal("mind")} disabled={Boolean(actionBusy) || objective.trim().length < 3 || !toolName.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
              {actionBusy === "mind" && <Loader2 className="h-4 w-4 animate-spin" />} Evaluate proposal
            </button>
          </div>
        </div>
      </section>

      {(notice || actionResult) && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-2">
            {actionResult ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" /> : <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />}
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-bold text-slate-800 dark:text-slate-100">{notice}</p>
              {actionResult && <pre className="mt-3 max-h-56 overflow-auto rounded-xl bg-slate-950 p-3 text-[10px] leading-5 text-slate-200">{JSON.stringify(actionResult.data, null, 2)}</pre>}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Active signed Genesis tools</h3>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">
                Invocation is delegated to Genesis. The gateway does not execute generated source; Genesis revalidates the signed artifact, sandbox evidence, risk policy and any required approval.
              </p>
            </div>
            <button
              type="button"
              onClick={refreshSignedTools}
              disabled={toolsLoading}
              className="inline-flex w-fit flex-shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw className={"h-3.5 w-3.5 " + (toolsLoading ? "animate-spin" : "")} />
              Refresh tools
            </button>
          </div>
        </div>

        <div className="px-5 py-4 sm:px-6">
          <label htmlFor="core-mesh-tool-arguments" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Tool arguments (JSON)
          </label>
          <textarea
            id="core-mesh-tool-arguments"
            value={toolArguments}
            onChange={(event) => setToolArguments(event.target.value)}
            rows={4}
            spellCheck={false}
            maxLength={12000}
            className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-mono text-xs leading-5 text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
            Arguments are sent only after you select a tool and confirm the invocation. Tool-specific schema validation remains on the Genesis service.
          </p>

          {toolsError && (
            <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-300/60 bg-rose-50 p-3 text-xs leading-5 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{toolsError}</span>
            </div>
          )}

          {!canExecuteTools && (
            <p className="mt-3 rounded-xl border border-amber-300/50 bg-amber-50/70 px-3 py-2 text-xs leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
              Invocation is restricted to approved Core Mesh operators. You can inspect the active tool list, but the server will reject invocation unless your account is allowlisted.
            </p>
          )}

          {toolsLoading && signedTools.length === 0 ? (
            <div className="flex items-center gap-2 py-8 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading signed tool registry…
            </div>
          ) : signedTools.length ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {signedTools.map((tool, index) => {
                const name = String(tool?.name || "Unnamed tool");
                const version = String(tool?.version || tool?.manifest?.version || "unknown");
                const hash = String(tool?.artifact_hash || "");
                const tier = Number(tool?.risk_tier ?? tool?.manifest?.risk_tier ?? 0);
                return (
                  <article key={name + "-" + version + "-" + hash + "-" + index} className="min-w-0 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="break-words text-sm font-black text-slate-900 dark:text-white">{name}</h4>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Version {version} · Risk tier {tier}</p>
                      </div>
                      <span className="flex-shrink-0 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Signed · active</span>
                    </div>
                    <p className="mt-3 break-all font-mono text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                      Artifact SHA-256: {hash || "missing"}
                    </p>
                    <div className="mt-4 flex justify-end">
                      {canExecuteTools && (
                        <button
                          type="button"
                          onClick={() => executeSignedTool(tool)}
                          disabled={Boolean(executingTool) || !hash}
                          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-extrabold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {executingTool === name && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          Invoke signed tool
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {toolsError ? "Tool list unavailable" : "No active signed tools"}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                {toolsError ? "The registry request failed. Refresh after the Genesis service and credentials are healthy." : "Only published, activated tools with valid signed-artifact and sandbox-evidence records are listed here."}
              </p>
            </div>
          )}

          {toolExecutionResult && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Last invocation result · {toolExecutionResult.name} · tier {toolExecutionResult.riskTier}
              </div>
              <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-slate-950 p-3 text-[10px] leading-5 text-slate-200">{JSON.stringify(toolExecutionResult.result, null, 2)}</pre>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Recent Mind proposals</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Staged evolutions awaiting human review.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">{snapshot?.recent_evolutions?.length || 0} shown</span>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {snapshot?.recent_evolutions?.length ? snapshot.recent_evolutions.map((item, index) => (
            <div key={(item.version || item.tool_name || "proposal") + "-" + index} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{item.tool_name || "Evolution proposal"}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.version || "Version pending"}{item.selected_mutation ? " · " + item.selected_mutation : ""}</p>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Awaiting review</span>
            </div>
          )) : (
            <div className="px-5 py-8 text-center sm:px-6">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No evolution proposals observed yet</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">When Core-Two is reachable, its staged proposals will appear here. This is not a deployment queue.</p>
            </div>
          )}
        </div>
      </section>

      {snapshot && (!configuration.write_credentials_configured || !configuration.genesis_proxy_credential_configured) && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="text-xs leading-5">
            <p className="font-bold">Operator actions need server-side configuration</p>
            <p className="mt-1">Set MIND_ADMIN_TOKEN and GENESIS_ADMIN_TOKEN on the RevelaAI service, and configure CORE_MESH_ADMIN_USER_IDS with approved operator user IDs. Never place these secrets in Vite variables or browser storage.</p>
          </div>
        </div>
      )}
    </div>
  );
}
