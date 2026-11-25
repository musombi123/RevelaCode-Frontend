import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, Server, ShieldCheck, XCircle, AlertTriangle, HelpCircle } from "lucide-react";

const API_BASE = String(import.meta.env.VITE_NEXORA_API_URL || "https://nexora-foundry-api.onrender.com").replace(/\/$/, "");
const TOOLS = [
  ["blender", "Blender", false],
  ["godot", "Godot 4", false],
  ["ffmpeg", "FFmpeg", false],
  ["ffprobe", "FFprobe", false],
  ["java", "Java 17", false],
  ["adb", "ADB", true],
  ["android_sdk", "Android SDK", true],
  ["android_apk_inspector", "APK Inspector", true],
];
const WORKLOADS = [
  ["procedural_3d", "Procedural 3D"],
  ["movie_processing", "Movie processing"],
  ["android_export", "Android export"],
];

function CapabilityMark({ value }) {
  if (value === true) return <CheckCircle2 size={11} className="text-emerald-300"/>;
  if (value === false) return <XCircle size={11} className="text-amber-300"/>;
  return <HelpCircle size={11} className="text-slate-500"/>;
}

export default function NexoraManagedComputeStatus({ accountAccessToken = "" }) {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!accountAccessToken) {
      setStatus(null);
      setError("Sign in to your NEXORA account to check the managed server toolchain.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(API_BASE + "/api/compute/capabilities", {
        headers: { Authorization: "Bearer " + accountAccessToken, Accept: "application/json" },
        credentials: "omit",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.detail?.message || payload?.detail || "Server capability check failed (HTTP " + response.status + ").");
      setStatus(payload);
      if (payload.available === false) setError(payload.message || "Managed compute is not yet provisioned.");
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : "Managed server capability check failed.");
    } finally {
      setBusy(false);
    }
  }, [accountAccessToken]);

  useEffect(() => { void refresh(); }, [refresh]);

  const toolchain = status?.toolchain || {};
  const workloadCapabilities = status?.workload_capabilities || {};
  const coreReady = Boolean(status?.available && (status?.core_toolchain_ready ?? status?.toolchain_ready));
  return <section className="mt-3 border border-cyan-900/60 bg-[#0a171c] p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Server size={16} className="text-cyan-300"/>
        <div>
          <h3 className="text-[11px] font-black tracking-widest text-cyan-200">NEXORA MANAGED SERVER TOOLCHAIN</h3>
          <p className="mt-0.5 text-[9px] text-slate-400">Preinstalled production tools · checked on the NEXORA private worker</p>
        </div>
      </div>
      <button type="button" onClick={refresh} disabled={busy || !accountAccessToken} className="inline-flex items-center gap-1 border border-cyan-800 px-2 py-1.5 text-[9px] font-bold text-cyan-200 disabled:opacity-40">
        <RefreshCw size={11} className={busy ? "animate-spin" : ""}/> {busy ? "CHECKING…" : "RECHECK SERVER"}
      </button>
    </div>

    <div className="mt-3">
      <p className="mb-2 text-[9px] font-black uppercase tracking-wider text-slate-400">Installed tools</p>
      <div className="flex flex-wrap gap-2">
        {TOOLS.map(([key, label, optional]) => {
          const installed = toolchain[key] === true;
          const known = typeof toolchain[key] === "boolean";
          const tone = installed
            ? "border-emerald-800 bg-emerald-950/40 text-emerald-200"
            : optional
              ? "border-amber-900/70 bg-amber-950/20 text-amber-200"
              : "border-slate-700 bg-slate-900 text-slate-400";
          return <span key={key} className={"inline-flex items-center gap-1 border px-2 py-1 text-[9px] font-bold " + tone}>
            {known ? (installed ? <CheckCircle2 size={10}/> : <XCircle size={10}/>) : <HelpCircle size={10}/>}
            {label}{optional ? " · optional" : ""}
          </span>;
        })}
      </div>
    </div>

    {status && <div className="mt-3 border-t border-slate-800 pt-3">
      <p className="mb-2 text-[9px] font-black uppercase tracking-wider text-slate-400">Workload tool readiness</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {WORKLOADS.map(([key, label]) => {
          const value = workloadCapabilities[key];
          return <div key={key} className="flex items-center gap-2 border border-slate-800 bg-slate-900/60 px-2 py-2 text-[9px] font-bold text-slate-300">
            <CapabilityMark value={value}/>
            <span>{label}</span>
            <span className="ml-auto text-slate-500">{value === true ? "TOOLS READY" : value === false ? "TOOLS MISSING" : "NOT REPORTED"}</span>
          </div>;
        })}
      </div>
      <p className="mt-2 text-[9px] leading-5 text-slate-400">
        Android export is optional. Android SDK and ADB are installed only after the organisation reviews and accepts the Android SDK licence terms; their absence does not disable 3D or movie-processing tools.
      </p>
    </div>}

    {error && <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-5 text-amber-300"><AlertTriangle size={12} className="mt-1 shrink-0"/>{error}</p>}
    {!error && status && <p className={"mt-2 flex items-start gap-1.5 text-[10px] leading-5 " + (coreReady ? "text-emerald-300" : "text-amber-300")}>
      {coreReady ? <CheckCircle2 size={12} className="mt-1 shrink-0"/> : <AlertTriangle size={12} className="mt-1 shrink-0"/>}
      {coreReady ? "Core server toolchain is installed and responding." : "The core server toolchain is not fully ready."}
    </p>}
    {status && <p className={"mt-1 text-[10px] leading-5 " + (status.workspace_storage?.ready ? "text-emerald-300" : "text-amber-300")}>
      {status.workspace_storage?.ready ? "Persistent workspace volume is mounted and writable." : status.workspace_storage?.note || "Persistent workspace volume has not been verified."}
    </p>}
    <p className="mt-2 text-[9px] leading-5 text-slate-500"><ShieldCheck size={11} className="mr-1 inline"/>Tool readiness is not job-execution readiness. Secure project transfer, durable remote job submission and artifact retrieval remain disabled until their backend safeguards are implemented. Physical-phone USB/Wi-Fi testing uses the optional paired device bridge.</p>
  </section>;
}
