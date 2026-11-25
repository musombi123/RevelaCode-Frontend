import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle, CheckCircle2, HelpCircle, Cpu, Database, HardDrive,
  RefreshCw, Server, ShieldCheck, Smartphone, Workflow, XCircle,
} from "lucide-react";

const API_BASE = String(import.meta.env.VITE_NEXORA_API_URL || "https://nexora-foundry-api.onrender.com").replace(/\/$/, "");
const CORE_TOOLS = [
  ["blender", "Blender"], ["godot", "Godot 4"], ["ffmpeg", "FFmpeg"],
  ["ffprobe", "FFprobe"],
];
const ANDROID_TOOLS = [
  ["java", "Java 17"], ["adb", "ADB"], ["android_sdk", "Android SDK"], ["android_apk_inspector", "APK inspector"],
];
const WORKLOADS = [
  ["workspace_editing", "Workspace editing"],
  ["procedural_3d", "Procedural 3D"],
  ["movie_processing", "Movie processing"],
  ["android_export", "Android export"],
  ["heavy_3d_render", "High-resolution 3D render"],
  ["image_to_3d", "Image-to-3D (CUDA)"],
];

function StatusTile({ icon: Icon, label, value, detail, tone = "neutral" }) {
  const toneClass = tone === "success"
    ? "border-emerald-900/70 bg-emerald-950/20"
    : tone === "warning"
      ? "border-amber-900/70 bg-amber-950/20"
      : "border-slate-800 bg-slate-950/50";
  return (
    <div className={"min-w-0 rounded-xl border p-3 " + toneClass}>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        <Icon size={14} />{label}
      </div>
      <div className="mt-2 truncate text-sm font-black text-slate-100">{value}</div>
      <p className="mt-1 text-[10px] leading-4 text-slate-500">{detail}</p>
    </div>
  );
}

function ToolChip({ label, installed, known }) {
  const tone = !known
    ? "border-slate-700 bg-slate-900/70 text-slate-500"
    : installed
      ? "border-emerald-800/80 bg-emerald-950/30 text-emerald-200"
      : "border-slate-700 bg-slate-900/70 text-slate-400";
  return (
    <span className={"inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold " + tone}>
      {known && installed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
      {label}
    </span>
  );
}

export default function NexoraManagedComputeStatus({ accountAccessToken = "", localProfile = null }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workload, setWorkload] = useState("procedural_3d");
  const [shareLocalMetrics, setShareLocalMetrics] = useState(false);
  const [plan, setPlan] = useState(null);
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState("");

  const refresh = useCallback(async () => {
    if (!accountAccessToken) {
      setStatus(null);
      setError("Sign in to check managed compute readiness.");
      return null;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API_BASE + "/api/compute/capabilities", {
        headers: { Authorization: "Bearer " + accountAccessToken, Accept: "application/json" },
        credentials: "omit",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = payload?.detail;
        throw new Error(typeof detail === "string" ? detail : detail?.message || "Managed compute status could not be checked.");
      }
      setStatus(payload);
      if (payload.available === false) setError(payload.message || "The managed worker is not reachable.");
      return payload;
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : "Managed compute status could not be checked.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [accountAccessToken]);

  useEffect(() => { void refresh(); }, [refresh]);

  const checkPlacement = useCallback(async () => {
    if (!accountAccessToken) {
      setPlanError("Sign in before checking workload placement.");
      return;
    }
    const metricsShared = shareLocalMetrics && Boolean(localProfile);
    setPlanning(true);
    setPlanError("");
    setPlan(null);
    try {
      const response = await fetch(API_BASE + "/api/compute/plan", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accountAccessToken,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "omit",
        cache: "no-store",
        body: JSON.stringify({
          workload,
          local_profile: metricsShared ? localProfile : {},
          consent_to_share_hardware_metrics: metricsShared,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = payload?.detail;
        throw new Error(typeof detail === "string" ? detail : detail?.message || "Workload placement check failed.");
      }
      setPlan(payload);
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Workload placement check failed.");
    } finally {
      setPlanning(false);
    }
  }, [accountAccessToken, localProfile, shareLocalMetrics, workload]);

  const toolchain = status?.toolchain || {};
  const hasStatus = Boolean(status);
  const reachable = hasStatus && status.available !== false;
  const coreReady = Boolean(status?.core_toolchain_ready ?? status?.toolchain_ready);
  const storageReady = Boolean(status?.workspace_storage?.ready);
  const remoteJobsEnabled = status?.job_submission_enabled === true;
  const workloadCapabilities = status?.workload_capabilities || {
    workspace_editing: true,
    procedural_3d: Boolean(toolchain.blender && toolchain.godot),
    movie_processing: Boolean(toolchain.ffmpeg && toolchain.ffprobe),
    android_export: Boolean(toolchain.godot && toolchain.java && toolchain.android_sdk),
  };
  const capabilityRows = [
    ["workspace_editing", "Workspace editing", "Browser-based editing"],
    ["procedural_3d", "Procedural 3D", "Blender + Godot"],
    ["movie_processing", "Movie processing", "FFmpeg + FFprobe"],
    ["android_export", "Android export", "Godot + Java + Android SDK"],
  ];
  const placementLabel = !plan ? "" : plan.execution_location === "managed_server"
    ? "Managed server candidate"
    : plan.execution_location === "creator_device"
      ? "This computer"
      : "No safe placement";

  return (
    <section className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1421] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-800/70 bg-cyan-950/40 text-cyan-200">
            <Server size={19} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-white">Managed compute</h3>
              <span className="rounded-full border border-cyan-900/70 bg-cyan-950/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-cyan-200">
                Server readiness
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-5 text-slate-400">
              NEXORA checks the private worker independently of this computer. These checks do not upload project files.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading || !accountAccessToken}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[10px] font-bold text-slate-200 transition hover:border-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          {loading ? "Checking…" : "Recheck server"}
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <StatusTile
          icon={Server}
          label="Worker"
          value={loading && !hasStatus ? "Checking…" : reachable ? "Reachable" : hasStatus ? "Unavailable" : "Not checked"}
          detail={error || "Private compute service connection"}
          tone={reachable ? "success" : hasStatus ? "warning" : "neutral"}
        />
        <StatusTile
          icon={Database}
          label="Persistent workspace"
          value={storageReady ? "Verified" : "Not verified"}
          detail={status?.workspace_storage?.note || "A writable persistent disk is required"}
          tone={storageReady ? "success" : "warning"}
        />
        <StatusTile
          icon={Workflow}
          label="Remote job execution"
          value={remoteJobsEnabled ? "Enabled" : "Not enabled"}
          detail={remoteJobsEnabled ? "Managed worker accepts submitted jobs" : "Readiness and placement checks only"}
          tone={remoteJobsEnabled ? "success" : "warning"}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,.9fr)]">
        <div className="rounded-xl border border-slate-800 bg-[#08111d] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-200">Production toolchain</h4>
            <span className={"rounded-full px-2 py-1 text-[9px] font-bold " + (coreReady ? "bg-emerald-950/40 text-emerald-200" : "bg-amber-950/40 text-amber-200")}>
              {coreReady ? "Core tools ready" : "Core tools need attention"}
            </span>
          </div>
          <p className="mt-1 text-[10px] leading-4 text-slate-500">Core production tools are separate from optional Android packaging tools.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CORE_TOOLS.map(([key, label]) => <ToolChip key={key} label={label} installed={Boolean(toolchain[key])} known={hasStatus} />)}
          </div>
          <div className="mt-4 border-t border-slate-800 pt-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              <Smartphone size={13} />Optional Android packaging
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {ANDROID_TOOLS.map(([key, label]) => <ToolChip key={key} label={label} installed={Boolean(toolchain[key])} known={hasStatus} />)}
            </div>
          </div>
          <div className="mt-4 border-t border-slate-800 pt-3">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Workload tool support</h4>
            <div className="mt-2 space-y-2">
              {capabilityRows.map(([key, label, requirements]) => {
                const supported = Boolean(workloadCapabilities[key]);
                return (
                  <div key={key} className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-200">{label}</span>
                      <span className="ml-2 text-[10px] text-slate-500">{requirements}</span>
                    </div>
                    <span className={"inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold " + (!hasStatus ? "bg-slate-900 text-slate-500" : supported ? "bg-emerald-950/40 text-emerald-200" : "bg-slate-900 text-slate-400")}>
                      {hasStatus && supported ? <CheckCircle2 size={10} /> : <HelpCircle size={10} />}
                      {!hasStatus ? "Not checked" : supported ? "Tool support available" : "Requirements missing"}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[9px] leading-4 text-slate-500">
              Tool support does not guarantee available capacity, persistent storage or executable remote jobs.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#08111d] p-3">
          <div className="flex items-center gap-2">
            <Cpu size={15} className="text-cyan-300" />
            <h4 className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-200">Workload preflight</h4>
          </div>
          <p className="mt-1 text-[10px] leading-4 text-slate-500">Check where work may fit. This check does not transfer a project or start a build.</p>
          <label className="mt-3 block text-[10px] font-bold text-slate-400">
            Workload
            <select
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-100"
              value={workload}
              onChange={(event) => { setWorkload(event.target.value); setPlan(null); }}
            >
              {WORKLOADS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="mt-3 flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-[10px] leading-5 text-slate-400">
            <input
              type="checkbox"
              className="mt-1 shrink-0"
              checked={shareLocalMetrics}
              onChange={(event) => setShareLocalMetrics(event.target.checked)}
              disabled={!localProfile}
            />
            <span>
              Include this computer's CPU, RAM, storage and tool-availability summary. This requires the companion to be connected and your consent. Project files, paths and device identifiers are never sent in this check.
              {!localProfile && <span className="mt-1 block text-amber-300">Connect the desktop companion to share local capacity. Server-only checks remain available.</span>}
            </span>
          </label>
          <button
            type="button"
            onClick={() => void checkPlacement()}
            disabled={planning || !accountAccessToken}
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-[11px] font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Workflow size={13} />
            {planning ? "Checking placement…" : "Check workload placement"}
          </button>
          {planError && <p className="mt-2 text-[10px] leading-4 text-amber-300">{planError}</p>}
          {plan && (
            <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950/80 p-3" role="status">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Planning result</span>
                <span className="rounded-full bg-cyan-950/50 px-2 py-1 text-[9px] font-bold text-cyan-200">{placementLabel}</span>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-200">{plan.reason}</p>
              <p className="mt-2 text-[10px] leading-4 text-slate-500">
                Local metrics: {plan.local_metrics_shared ? "shared with your consent" : "not shared; local capacity treated as unknown"}.
              </p>
              {plan.execution_location === "managed_server" && (
                <p className="mt-2 text-[10px] leading-5 text-amber-300">
                  The worker is a candidate for this workload, but secure project transfer and remote job submission are not enabled. Nothing has been uploaded or started.
                </p>
              )}
              {plan.execution_location === "creator_device" && (
                <p className="mt-2 text-[10px] leading-5 text-emerald-300">The measured local computer meets this workload's current preflight requirements.</p>
              )}
              {plan.execution_location === "unavailable" && (
                <p className="mt-2 text-[10px] leading-5 text-amber-300">Neither environment meets the selected workload requirements. Choose a lighter workload or provision more capacity.</p>
              )}
              <p className="mt-2 flex items-start gap-1.5 text-[9px] leading-4 text-slate-500">
                <ShieldCheck size={11} className="mt-0.5 shrink-0" />
                Placement is advisory only. No project content is transferred and no remote job is started.
              </p>
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 flex items-start gap-2 text-[9px] leading-4 text-slate-500">
        <HardDrive size={12} className="mt-0.5 shrink-0" />
        Managed production can be enabled after persistent workspace storage, secure project transfer, durable queueing and artifact handling are deployed and verified.
      </p>
    </section>
  );
}
