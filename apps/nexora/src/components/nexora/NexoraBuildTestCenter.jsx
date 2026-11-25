import React from "react";
import {
  AlertCircle, ArrowRight, CheckCircle2, Download, FolderOpen, HardDrive,
  Monitor, Play, Server, Smartphone, Workflow,
} from "lucide-react";
import AndroidBuildConsole from "./AndroidBuildConsole.jsx";
import NexoraManagedComputeStatus from "./NexoraManagedComputeStatus.jsx";

function InfoCard({ icon: Icon, title, value, detail, tone = "neutral" }) {
  const toneClass = tone === "success"
    ? "border-emerald-900/60 bg-emerald-950/20"
    : tone === "warning"
      ? "border-amber-900/60 bg-amber-950/20"
      : "border-slate-800 bg-[#0a1421]";
  return (
    <div className={"rounded-xl border p-3 " + toneClass}>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        <Icon size={14} />{title}
      </div>
      <div className="mt-2 text-sm font-black text-white">{value}</div>
      <p className="mt-1 text-[10px] leading-4 text-slate-500">{detail}</p>
    </div>
  );
}

export default function NexoraBuildTestCenter({
  activeProject = null,
  projectReady = false,
  localAgentConnected = false,
  localAgentCapabilities = null,
  accountAccessToken = "",
  onOpenProjects = () => {},
  onOpenDevices = () => {},
  androidSettings,
  onAndroidChange = () => {},
  onBuildAndroid = () => {},
  iconAssets = [],
  buildDisabled = true,
  jobs = [],
  onExport = () => {},
  onDownloadArtifact = () => {},
}) {
  const machine = localAgentCapabilities?.machine || {};
  const localCpu = machine.cpu_available_cores != null
    ? Math.round(Number(machine.cpu_available_cores) * 10) / 10
    : null;
  const localRam = machine.ram_available_gib != null
    ? Number(machine.ram_available_gib).toFixed(1)
    : null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <header className="relative overflow-hidden rounded-2xl border border-cyan-900/50 bg-gradient-to-br from-[#112a40] via-[#0b1929] to-[#091321] p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
              <Workflow size={14} /> NEXORA production
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Build & Test</h2>
            <p className="mt-2 text-xs leading-6 text-slate-300 sm:text-sm">
              Prepare a game build, check compute readiness and install an APK on a connected Android device. NEXORA shows which environment is actually ready before you start.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenProjects}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-600 bg-slate-900/70 px-4 py-2 text-xs font-bold text-slate-100 transition hover:border-cyan-500"
          >
            <FolderOpen size={14} /> Projects <ArrowRight size={13} />
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-[#0b1421] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-800/60 bg-violet-950/30 text-violet-200">
              <FolderOpen size={18} />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-white">Current project</h3>
              <p className="mt-1 truncate text-xs text-slate-400">
                {activeProject?.name || "No project selected"}
              </p>
              <p className="mt-1 text-[10px] leading-4 text-slate-500">
                {activeProject
                  ? projectReady
                    ? "Project is available to the connected desktop workspace."
                    : "Open or reconnect this project from Projects before building."
                  : "Create or open a project before starting a build."}
              </p>
            </div>
          </div>
          <span className={"rounded-full px-2.5 py-1 text-[9px] font-bold " + (projectReady ? "bg-emerald-950/40 text-emerald-200" : "bg-slate-900 text-slate-400")}>
            {projectReady ? "Project ready" : "Project not ready"}
          </span>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(240px,.72fr)]">
        <div className="rounded-2xl border border-slate-800 bg-[#0b1421] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Monitor size={17} className="text-cyan-300" />
              <h3 className="text-sm font-black text-white">Build environment</h3>
            </div>
            <span className={"rounded-full px-2.5 py-1 text-[9px] font-bold " + (localAgentConnected ? "bg-emerald-950/40 text-emerald-200" : "bg-amber-950/40 text-amber-200")}>
              {localAgentConnected ? "Desktop connected" : "Desktop not connected"}
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-400">
            Current project builds and engine jobs run through the paired NEXORA Desktop Agent on this computer. Managed compute is available for server readiness and placement checks; remote project transfer and remote job submission are not enabled yet.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <InfoCard
              icon={Monitor}
              title="Local engine"
              value={localAgentConnected ? "Connected" : "Not connected"}
              detail={localAgentConnected ? "Desktop companion is paired to this account" : "Required for current local build execution"}
              tone={localAgentConnected ? "success" : "warning"}
            />
            <InfoCard
              icon={Workflow}
              title="CPU headroom"
              value={localCpu == null ? "Not measured" : localCpu + " cores available"}
              detail="Live local capacity, when the companion reports it"
              tone="neutral"
            />
            <InfoCard
              icon={HardDrive}
              title="Available RAM"
              value={localRam == null ? "Not measured" : localRam + " GiB"}
              detail="Live local memory headroom"
              tone="neutral"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] text-slate-500">
              {localAgentConnected
                ? "The desktop agent remains responsible for local compilation and physical phone access."
                : "You can browse and draft projects without pairing; connect before running local builds."}
            </p>
            <button
              type="button"
              onClick={onOpenDevices}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[10px] font-bold text-slate-200 hover:border-cyan-700"
            >
              <Smartphone size={13} /> {localAgentConnected ? "Manage connected devices" : "Connect desktop"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0b1421] p-4">
          <div className="flex items-center gap-2">
            <Server size={17} className="text-cyan-300" />
            <h3 className="text-sm font-black text-white">Managed compute</h3>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-400">
            Server tools and capacity are checked separately. A server recommendation does not start a remote job.
          </p>
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-900/50 bg-amber-950/20 p-3 text-[10px] leading-5 text-amber-200">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            Remote builds are not enabled. Your current build will use the connected desktop agent.
          </div>
        </div>
      </section>

      <NexoraManagedComputeStatus
        accountAccessToken={accountAccessToken}
        localProfile={localAgentConnected ? localAgentCapabilities : null}
      />

      <section className="rounded-2xl border border-slate-800 bg-[#0b1421] p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-white">Other export targets</h3>
            <p className="mt-1 text-[10px] text-slate-500">Start only after a project and local build environment are ready.</p>
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">Desktop agent execution</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ["Windows", "windows"],
            ["Linux", "linux"],
            ["Web", "web"],
          ].map(([label, target]) => (
            <button
              key={target}
              type="button"
              disabled={buildDisabled}
              onClick={() => onExport(target)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-cyan-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={14} /> Export {label}
            </button>
          ))}
        </div>
      </section>

      <AndroidBuildConsole
        settings={androidSettings}
        onChange={onAndroidChange}
        onBuild={onBuildAndroid}
        iconAssets={iconAssets}
        disabled={buildDisabled}
        deviceStatus="Android export currently runs through the paired NEXORA Desktop Agent. Install and logcat on a physical phone also use this computer. Managed compute currently provides readiness and placement checks only; remote build submission is not enabled."
      />

      <section className="rounded-2xl border border-slate-800 bg-[#0b1421] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-white">Recent build activity</h3>
            <p className="mt-1 text-[10px] text-slate-500">Results returned by the connected local production agent.</p>
          </div>
          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[9px] font-bold text-slate-400">{jobs.length} jobs</span>
        </div>
        {jobs.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-slate-700 p-5 text-center">
            <Play size={18} className="mx-auto text-slate-500" />
            <p className="mt-2 text-xs font-semibold text-slate-300">No build activity yet</p>
            <p className="mt-1 text-[10px] text-slate-500">Completed builds and their downloadable artifacts will appear here.</p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {jobs.slice(0, 6).map((job) => (
              <article key={job.id} className="rounded-xl border border-slate-800 bg-[#08111d] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="min-w-0 truncate text-xs text-slate-200">{job.kind || "Production job"}</strong>
                  <span className={"rounded-full px-2 py-1 text-[9px] font-bold " + (job.state === "completed" ? "bg-emerald-950/40 text-emerald-200" : job.state === "failed" ? "bg-rose-950/40 text-rose-200" : "bg-amber-950/40 text-amber-200")}>
                    {job.state || "unknown"}{job.progress != null ? " · " + job.progress + "%" : ""}
                  </span>
                </div>
                {job.message && <p className="mt-1 text-[10px] leading-4 text-slate-500">{job.message}</p>}
                {(job.artifacts || []).map((artifact) => (
                  <button
                    key={artifact.id}
                    type="button"
                    onClick={() => onDownloadArtifact(artifact)}
                    className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold text-cyan-300 hover:text-cyan-200"
                  >
                    <Download size={11} /> {artifact.filename || "Download artifact"}
                  </button>
                ))}
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="flex items-start gap-2 px-1 text-[9px] leading-4 text-slate-500">
        <ShieldCheck size={12} className="mt-0.5 shrink-0" />
        Server readiness, project execution and physical-device access are separate capabilities. NEXORA will only label a remote build as available after secure project transfer, persistent storage, durable queueing and artifact retrieval are implemented and verified.
      </p>
    </div>
  );
}
