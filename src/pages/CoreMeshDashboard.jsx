import React, { useCallback, useEffect, useMemo, useState } from "react";
import { readAccessToken, readTokenType } from "@/auth/tokenStorage.mjs";
import { useAuth } from "@/context/AuthContext.jsx";
import EvolverControlSurface from "@/pages/EvolverControlSurface.jsx";
import LivingSystemsLab from "@/pages/LivingSystemsLab.jsx";
import {
  Activity,
  AlertTriangle,
  Brain,
  Cpu,
  Layers,
  RefreshCw,
  ShieldCheck,
  Sprout,
  Sparkles,
  Zap,
} from "lucide-react";

const API_BASE = String(
  import.meta.env.VITE_REVELAAI_API_URL || import.meta.env.VITE_REVELAAI_API_BASE || "https://revelaai.onrender.com",
).trim().replace(/\/+$/, "");

function readAuthHeaders(jsonBody = false) {
  const headers = jsonBody ? { "Content-Type": "application/json" } : {};
  const token = readAccessToken();
  if (token) headers.Authorization = readTokenType() + " " + token;
  return headers;
}

function coreMeshErrorMessage(payload, status) {
  const candidates = [
    payload?.error?.message,
    payload?.detail?.message,
    payload?.message?.message,
    payload?.message,
    typeof payload?.error === "string" ? payload.error : payload?.error?.code,
    typeof payload?.detail === "string" ? payload.detail : null,
    payload?.code,
  ];
  const code = String(payload?.error?.code || payload?.code || "").trim().toLowerCase();
  if (code === "session_revoked") {
    return "Your RevelaCode session token was invalidated by an account or security update. Sign out, sign in again to obtain a fresh token, then refresh Core Mesh. The core services have not yet been checked, so this is not evidence that ZERO, Genesis, or Infinite Mind is offline.";
  }
  if (code === "token_expired" || code === "invalid_token") {
    return "The current RevelaCode access token is no longer valid. Sign out, sign in again, then refresh Core Mesh. Core reachability has not yet been checked.";
  }
  const message = candidates.find((value) => typeof value === "string" && value.trim());
  if (message) return message.trim();
  const structured = payload?.error ?? payload?.detail;
  if (structured && typeof structured === "object") {
    try {
      return JSON.stringify(structured);
    } catch {
      // Fall through to the status-specific message.
    }
  }
  return "Core Mesh request failed (HTTP " + status + ").";
}

async function requestCoreMesh(path, options = {}, authenticatedFetch) {
  const url = API_BASE + path;
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  const requestOptions = { ...options, headers, cache: "no-store" };
  const response = typeof authenticatedFetch === "function"
    ? await authenticatedFetch(url, requestOptions)
    : await fetch(url, {
        ...requestOptions,
        headers: { ...readAuthHeaders(Boolean(options.body)), ...headers },
      });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    // Preserve a useful fallback for non-JSON gateway responses.
  }

  if (!response.ok) {
    throw new Error(coreMeshErrorMessage(payload, response.status));
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

function knownCountLabel(value, registryAvailable, legacyRegistryReady) {
  if (
    registryAvailable === false ||
    (registryAvailable === undefined && legacyRegistryReady === false)
  ) {
    return "Unknown";
  }
  return Number.isInteger(value) && value >= 0 ? String(value) : "Unknown";
}

function registryStatusLabel(status, ready) {
  switch (String(status || "").toLowerCase()) {
    case "ready":
      return "Available";
    case "unavailable":
      return "Unavailable";
    case "signing_key_missing":
      return "Signing key missing";
    case "signing_key_unknown":
      return "Signing key unknown";
    default:
      return ready === true ? "Available" : ready === false ? "Not ready" : "Unknown";
  }
}

function genesisDispatchStatusLabel(configuration) {
  if (configuration.genesis_signed_tools_ready_to_dispatch === true) return "Ready";
  if (configuration.genesis_registry_status === "unavailable") return "Registry unavailable";
  if (configuration.genesis_registry_status === "signing_key_missing") return "Signing key missing";
  if (configuration.genesis_orchestrator_tools_enabled !== true) return "Orchestration disabled";
  if (configuration.active_signed_tools_count === 0) return "No active signed tools";
  return "Not ready";
}

function zeroDispatcherStatusLabel(configuration) {
  if (configuration.zero_tool_dispatcher_ready === true) return "Ready";
  if (configuration.zero_gateway_dispatcher_enabled === true) return "Enabled · waiting for core";
  return configuration.core_service_token_configured === true ? "Dispatcher disabled" : "Shared gateway credential missing";
}

function StatusPill({ reachable, unknown = false, configured }) {
  const notConfigured = configured === false;
  const classes = reachable
    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : unknown
      ? "border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
      : notConfigured
        ? "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  const dot = reachable ? "bg-emerald-500" : unknown || notConfigured ? "bg-slate-400" : "bg-amber-500";
  const label = reachable ? "Reachable" : unknown ? "Checking" : notConfigured ? "Not configured" : "Unavailable";
  return (
    <span className={"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] " + classes}>
      <span className={"h-1.5 w-1.5 rounded-full " + dot} />
      {label}
    </span>
  );
}

export default function CoreMeshDashboard() {
  const auth = useAuth();
  const authenticatedFetch = auth?.authFetch;
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [signedTools, setSignedTools] = useState([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [toolsError, setToolsError] = useState("");

  const refresh = useCallback(async (force = false) => {
    setRefreshing(true);
    setError("");
    try {
      const data = await requestCoreMesh("/api/core-mesh/dashboard" + (force ? "?refresh=1" : ""), {}, authenticatedFetch);
      setSnapshot(data);
    } catch (requestError) {
      setError(requestError?.message || "Could not read the Core Mesh status.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authenticatedFetch]);

  const refreshSignedTools = useCallback(async () => {
    setToolsLoading(true);
    setToolsError("");
    try {
      const data = await requestCoreMesh("/api/core-mesh/tools", {}, authenticatedFetch);
      setSignedTools(Array.isArray(data?.active_tools) ? data.active_tools : []);
    } catch (requestError) {
      setSignedTools([]);
      setToolsError(requestError?.message || "Signed Genesis registry could not be loaded.");
    } finally {
      setToolsLoading(false);
    }
  }, [authenticatedFetch]);

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
  const hasSnapshot = Boolean(snapshot);
  const onlineCount = useMemo(
    () => Object.values(cores).filter((core) => core?.reachable).length,
    [cores],
  );
  const configuration = snapshot?.configuration || {};
  const gatewayRuntime = snapshot?.runtime || snapshot?.gateway || {};

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
            <span className={"inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold " + (hasSnapshot && onlineCount === 3 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300")}>
              <span className={"h-1.5 w-1.5 rounded-full " + (hasSnapshot && onlineCount === 3 ? "bg-emerald-500" : "bg-amber-500")} />
              {loading ? "Checking cores…" : hasSnapshot ? (onlineCount + "/3 cores reachable") : error ? "Status unavailable" : "Status not yet received"}
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
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Core routing is deployment-managed. Configuration presence is not proof of a live connection; this page never asks for per-tool URLs or core secrets.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <DataPoint label="Invocation path" value="Main RevelaAI gateway" />
              <DataPoint label="Tool addressing" value="Capability name" />
              <DataPoint label="Per-tool URLs" value="Not required" />
              <DataPoint label="Core routing" value="Internal dispatcher" />
              <DataPoint label="ZERO dispatcher" value={zeroDispatcherStatusLabel(configuration)} />
              <DataPoint label="ZERO enabled" value={configuration.zero_enabled ? "Enabled" : "Disabled"} />
              <DataPoint label="Shared core credential" value={configuration.core_service_token_configured ? "Configured on gateway" : "Missing on gateway"} />
              <DataPoint label="ZERO built-in capabilities" value={configuration.zero_catalogue_tool_count ?? "—"} />
              <DataPoint label="ZERO access scopes" value={configuration.zero_catalogue_tool_count == null ? "Unknown" : `${configuration.zero_read_only_tool_count ?? 0} read-only / ${configuration.zero_action_tool_count ?? 0} scoped actions`} />
              <DataPoint label="Genesis orchestration" value={configuration.genesis_orchestrator_tools_enabled ? "Enabled" : "Disabled"} />
              <DataPoint label="Genesis signed registry" value={registryStatusLabel(configuration.genesis_registry_status, configuration.genesis_registry_ready)} />
              <DataPoint label="Genesis signing key" value={configuration.genesis_signing_key_configured === true ? "Configured" : configuration.genesis_signing_key_configured === false ? "Missing" : "Unknown"} />
              <DataPoint label="Active signed tools" value={knownCountLabel(configuration.active_signed_tools_count, configuration.genesis_registry_available, configuration.genesis_registry_ready)} />
              <DataPoint label="Genesis tool dispatch" value={genesisDispatchStatusLabel(configuration)} />
              <DataPoint label="Operator allowlist" value={configuration.core_mesh_operator_allowlist_configured ? "Configured" : "Missing"} />
              {configuration.genesis_registry_failure_reason && <DataPoint label="Genesis registry diagnostic" value={configuration.genesis_registry_failure_reason} />}
            </div>
            <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/20">
              <div className="flex items-start gap-3">
                <Layers className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" />
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">Gateway-native execution model</h4>
                  <p className="mt-1 text-[11px] leading-5 text-slate-600 dark:text-slate-400">The frontend does not configure or call individual core and tool URLs. It sends authenticated requests to RevelaAI; the gateway owns capability lookup, core dispatch, signed-tool execution and audit handling. Runtime health below is reported by the gateway and is not inferred from configuration presence.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="m-5 flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-bold">Core Mesh status unavailable</p>
              <p className="mt-1 break-words text-xs leading-5">{error}</p>
              <p className="mt-1 text-xs opacity-80">No core reachability result has been received. Resolve the status request first, then refresh to obtain the live ZERO, Genesis and Infinite Mind probes.</p>
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
                  ? "Model-free"
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
                    <StatusPill reachable={Boolean(core.reachable)} unknown={!hasSnapshot} />
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
                    {key === "one" && <DataPoint label="Signed registry" value={registryStatusLabel(core.signed_tool_registry_status, core.signed_tool_registry_ready)} />}
                    {key === "one" && <DataPoint label="Active signed tools" value={knownCountLabel(core.active_signed_tools_count, core.signed_tool_registry_available, core.signed_tool_registry_ready)} />}
                    {key === "one" && core.signed_tool_registry_failure_reason && <DataPoint label="Registry diagnostic" value={core.signed_tool_registry_failure_reason} />}
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

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Genesis signed registry</h3>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">
              Read-only view of active signed capabilities. The gateway resolves permitted capabilities through its internal signed-tool registry; tools have no individual URLs or manual invocation controls here.
            </p>
          </div>
          <button type="button" onClick={refreshSignedTools} disabled={toolsLoading}
            className="inline-flex w-fit flex-shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">
            <RefreshCw className={"h-3.5 w-3.5 " + (toolsLoading ? "animate-spin" : "")} /> Refresh registry
          </button>
        </div>
        <div className="px-5 py-4 sm:px-6">
          {toolsError && <div role="status" className="rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">{toolsError}</div>}
          {toolsLoading && signedTools.length === 0 ? (
            <div className="flex items-center gap-2 py-8 text-sm text-slate-500 dark:text-slate-400"><RefreshCw className="h-4 w-4 animate-spin" /> Reading gateway tool registry…</div>
          ) : signedTools.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {signedTools.map((tool, index) => (
                <article key={String(tool?.name || "tool") + "-" + String(tool?.version || index) + "-" + index} className="min-w-0 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="break-all text-sm font-black text-slate-900 dark:text-white">{tool?.name || "Unnamed capability"}</h4>
                    <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Signed · active</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Version {tool?.version || tool?.manifest?.version || "unknown"} · Risk tier {tool?.risk_tier ?? tool?.manifest?.risk_tier ?? "—"}</p>
                  <p className="mt-2 break-all font-mono text-[10px] leading-4 text-slate-500 dark:text-slate-400">Artifact SHA-256: {tool?.artifact_hash || "not supplied"}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{toolsError ? "Gateway tool registry unavailable" : "No active signed capabilities"}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{toolsError ? "The registry could not be read. This does not establish that the registry is empty." : "The gateway has not reported any active signed capabilities."}</p>
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
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">When the gateway reports Core-Two runtime data, its staged proposals appear here. This is not a deployment queue.</p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-indigo-200 bg-indigo-50/70 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/20">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" />
          <div className="min-w-0">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Gateway-owned runtime and security</h3>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
              ZERO, Genesis and Infinite Mind are presented as internal capabilities of the RevelaAI gateway. The browser never receives core service URLs or privileged credentials, and individual tools are addressed by capability name—not by endpoint.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <DataPoint label="Gateway runtime" value={gatewayRuntime.status || gatewayRuntime.state || "Reported by gateway"} />
              <DataPoint label="Invocation" value="Authenticated gateway dispatch" />
              <DataPoint label="Approval policy" value="Human-gated · no auto-merge" />
            </div>
            <p className="mt-3 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
              A core marked unavailable indicates that its internal runtime or health probe did not respond. It does not mean that an administrator must configure a separate URL. Credentials remain server-side.
            </p>
          </div>
        </div>
      </section>
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" /> Evolver Factory
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Governed invention · measured improvement · durable learning</span>
        </div>
        <EvolverControlSurface authenticatedFetch={authenticatedFetch} />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            <Sprout className="h-3.5 w-3.5" /> Living Systems Lab
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Birth · measured defensive learning · reviewed inheritance · retirement</span>
        </div>
        <LivingSystemsLab authenticatedFetch={authenticatedFetch} />
      </section>
    </div>
  );
}
