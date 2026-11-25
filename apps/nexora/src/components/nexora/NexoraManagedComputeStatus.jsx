import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, Server, ShieldCheck, XCircle, AlertTriangle } from "lucide-react";

const API_BASE = String(import.meta.env.VITE_NEXORA_API_URL || "https://nexora-foundry-api.onrender.com").replace(/\/$/, "");
const TOOLS = [
  ["blender", "Blender"],
  ["godot", "Godot 4"],
  ["ffmpeg", "FFmpeg"],
  ["ffprobe", "FFprobe"],
  ["java", "Java 17"],
  ["adb", "ADB"],
  ["android_sdk", "Android SDK"],
  ["android_apk_inspector", "APK Inspector"],
];

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
  const ready = Boolean(status?.available && status?.toolchain_ready);

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
    <div className="mt-3 flex flex-wrap gap-2">
      {TOOLS.map(([key, label]) => {
        const installed = Boolean(toolchain[key]);
        return <span key={key} className={"inline-flex items-center gap-1 border px-2 py-1 text-[9px] font-bold " + (installed ? "border-emerald-800 bg-emerald-950/40 text-emerald-200" : "border-slate-700 bg-slate-900 text-slate-500")}>
          {installed ? <CheckCircle2 size={10}/> : <XCircle size={10}/>} {label}
        </span>;
      })}
    </div>
    {error && <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-5 text-amber-300"><AlertTriangle size={12} className="mt-1 shrink-0"/>{error}</p>}
    {!error && status && <p className={"mt-2 flex items-start gap-1.5 text-[10px] leading-5 " + (ready ? "text-emerald-300" : "text-amber-300")}>
      {ready ? <CheckCircle2 size={12} className="mt-1 shrink-0"/> : <AlertTriangle size={12} className="mt-1 shrink-0"/>}
      {ready ? "Managed server toolchain is installed and responding." : "Managed worker is reachable, but one or more toolchain items are not ready."}
    </p>}
    {status && <p className={"mt-1 text-[10px] leading-5 " + (status.workspace_storage?.ready ? "text-emerald-300" : "text-amber-300")}>
      {status.workspace_storage?.ready ? "Persistent workspace volume is mounted and writable." : status.workspace_storage?.note || "Persistent workspace volume has not been verified."}
    </p>}
    <p className="mt-2 text-[9px] leading-5 text-slate-500"><ShieldCheck size={11} className="mr-1 inline"/>The server toolchain is independent of your PC's installed software. This phase checks tools and resource capacity; secure project transfer and remote job execution are still disabled. Physical-phone USB/Wi-Fi testing uses the optional paired device bridge.</p>
  </section>;
}
