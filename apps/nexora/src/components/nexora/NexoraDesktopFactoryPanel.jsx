import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive, CheckCircle2, ChevronRight, Code2, Download, Folder,
  FolderOpen, HardDrive, Laptop, LockKeyhole, PackageCheck, RefreshCw,
  Save, ShieldCheck, Upload, Wrench
} from "lucide-react";

const panel = "rounded-2xl border border-[#20334B] bg-[#101B2C]";
const field = "w-full rounded-xl border border-[#29415F] bg-[#081321] px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-cyan-400/70";
const button = "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[#29415F] px-3 py-2 text-[10px] font-bold text-slate-200 hover:border-cyan-500/60 disabled:opacity-40";
const primary = "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-[10px] font-black text-[#04111A] hover:bg-cyan-300 disabled:opacity-40";

function Bytes({ value }) {
  const size = Number(value || 0);
  if (!size) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(size) / Math.log(1024)));
  return (size / Math.pow(1024, index)).toFixed(index ? 1 : 0) + " " + units[index];
}

function State({ ready, children }) {
  return <span className={"inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-extrabold " + (ready ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-200")}>
    <span className={"h-1.5 w-1.5 rounded-full " + (ready ? "bg-emerald-300" : "bg-amber-300")} />{children}
  </span>;
}

export default function NexoraDesktopFactoryPanel({ view = "factory", project, jobs = [], apiRequest, onNotice = () => {}, onRefresh = () => {} }) {
  const [status, setStatus] = useState(null);
  const [workspacePath, setWorkspacePath] = useState("");
  const [importPath, setImportPath] = useState("");
  const [importName, setImportName] = useState("");
  const [entries, setEntries] = useState([]);
  const [folderPath, setFolderPath] = useState("");
  const [openedFile, setOpenedFile] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [snapshots, setSnapshots] = useState([]);
  const [driveStatus, setDriveStatus] = useState(null);
  const [driveBackups, setDriveBackups] = useState([]);
  const [toolchains, setToolchains] = useState(null);
  const [selectedTools, setSelectedTools] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [releasePlatform, setReleasePlatform] = useState("android");
  const [releaseArtifact, setReleaseArtifact] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const projectId = project?.id || "";
  const completedArtifacts = useMemo(() => jobs.flatMap(job => (job.artifacts || []).map(artifact => ({
    ...artifact, jobId: job.id, target: job.target || artifact.id, state: job.state
  }))).filter(item => item.path && item.id), [jobs]);

  const request = useCallback((path, options = {}) => apiRequest(path, options), [apiRequest]);
  const run = useCallback(async (key, task, successMessage) => {
    setBusy(key);
    setError("");
    try {
      const result = await task();
      if (successMessage) onNotice(successMessage);
      else if (result?.message) onNotice(result.message);
      return result;
    } catch (cause) {
      const message = cause?.message || "The local desktop operation failed.";
      setError(message);
      onNotice(message);
      return null;
    } finally {
      setBusy("");
    }
  }, [onNotice, onRefresh]);

  const loadStatus = useCallback(async () => {
    const result = await request("/api/v1/desktop/status");
    setStatus(result);
    setWorkspacePath(result.workspace_root || "");
    return result;
  }, [request]);

  const loadProjectFiles = useCallback(async (path = "") => {
    if (!projectId) return;
    const result = await request("/api/v1/desktop/projects/" + projectId + "/files?path=" + encodeURIComponent(path));
    setEntries(result.entries || []);
    setFolderPath(path);
  }, [projectId, request]);

  const loadSnapshots = useCallback(async () => {
    if (!projectId) return;
    const result = await request("/api/v1/desktop/projects/" + projectId + "/snapshots");
    setSnapshots(result.snapshots || []);
  }, [projectId, request]);

  const loadToolchains = useCallback(async () => {
    const query = projectId ? "?project_id=" + encodeURIComponent(projectId) : "";
    const result = await request("/api/v1/desktop/toolchains" + query);
    setToolchains(result);
  }, [projectId, request]);

  const loadPublishing = useCallback(async () => {
    const result = await request("/api/v1/desktop/publish/readiness");
    setPublishers(result.providers || []);
  }, [request]);

  const loadDriveData = useCallback(async () => {
    const result = await request("/api/v1/desktop/drive/status");
    setDriveStatus(result);
    if (projectId && result.connected) {
      const remote = await request("/api/v1/desktop/drive/projects/" + projectId + "/backups");
      setDriveBackups(remote.files || []);
    } else {
      setDriveBackups([]);
    }
    return result;
  }, [projectId, request]);

  useEffect(() => {
    let live = true;
    setError("");
    const tasks = [loadStatus()];
    if (projectId) {
      tasks.push(loadProjectFiles(""));
      tasks.push(loadSnapshots());
    }
    if (view === "toolchains") tasks.push(loadToolchains());
    if (view === "release-center") tasks.push(loadPublishing());
    if (view === "backups") tasks.push(loadDriveData());
    Promise.all(tasks).catch(cause => {
      if (live) setError(cause?.message || "Could not connect to the NEXORA Local Agent.");
    });
    return () => { live = false; };
  }, [view, projectId, loadStatus, loadProjectFiles, loadSnapshots, loadToolchains, loadPublishing, loadDriveData]);

  const chooseWorkspace = () => run("workspace", async () => {
    const result = await request("/api/v1/desktop/workspace", { method: "PUT", body: JSON.stringify({ path: workspacePath }) });
    await loadStatus();
    await onRefresh();
    return result;
  }, "NEXORA's local projects directory has been updated.");

  const initializeProject = () => run("initialize", () =>
    request("/api/v1/desktop/projects/" + projectId + "/initialize", { method: "POST", body: "{}" }),
  "Local project manifest and toolchain lock are ready.");

  const importProject = () => run("import", async () => {
    const result = await request("/api/v1/desktop/projects/import", {
      method: "POST", body: JSON.stringify({ path: importPath, name: importName.trim() || undefined })
    });
    setImportPath("");
    setImportName("");
    await loadStatus();
    await onRefresh();
    return result;
  }, "Existing Godot project copied into your NEXORA workspace.");

  const openFile = async (entry) => {
    if (entry.kind === "directory") {
      await loadProjectFiles(entry.path);
      setOpenedFile(null);
      return;
    }
    if (!entry.editable) {
      onNotice("This file is binary or unsupported by the embedded editor. Use Godot or the Asset Library.");
      return;
    }
    await run("open-file", async () => {
      const result = await request("/api/v1/desktop/projects/" + projectId + "/file?path=" + encodeURIComponent(entry.path));
      setOpenedFile(result);
      setEditedContent(result.content || "");
      return result;
    });
  };

  const saveFile = () => {
    if (!openedFile) return;
    return run("save-file", async () => {
      const result = await request("/api/v1/desktop/projects/" + projectId + "/file", {
        method: "PUT",
        body: JSON.stringify({ path: openedFile.path, content: editedContent, expected_sha256: openedFile.sha256 })
      });
      setOpenedFile(current => ({ ...current, sha256: result.sha256, size_bytes: result.size_bytes, content: editedContent }));
      return result;
    }, "File saved to the creator's local project directory.");
  };

  const createSnapshot = () => run("snapshot", async () => {
    const result = await request("/api/v1/desktop/projects/" + projectId + "/snapshots", { method: "POST", body: "{}" });
    await loadSnapshots();
    return result;
  }, "A verified local project snapshot was created.");

  const connectDrive = async () => {
    const popup = window.open("about:blank", "_blank");
    if (!popup) {
      onNotice("Allow pop-ups for NEXORA so Google can complete the local OAuth callback.");
      return;
    }
    const result = await run("drive-connect", async () =>
      request("/api/v1/desktop/drive/authorize", { method: "POST", body: "{}" })
    );
    if (result?.authorization_url) {
      popup.opener = null;
      popup.location.href = result.authorization_url;
      onNotice("Complete Google consent in the opened tab, then refresh the Drive connection status.");
    } else {
      popup.close();
    }
  };

  const disconnectDrive = () => run("drive-disconnect", async () => {
    const result = await request("/api/v1/desktop/drive/disconnect", { method: "POST", body: "{}" });
    await loadDriveData();
    return result;
  }, "Google Drive has been disconnected from this computer.");

  const uploadSnapshotToDrive = (snapshot) => run("drive-upload", async () => {
    const result = await request("/api/v1/desktop/drive/projects/" + projectId + "/snapshots/" + snapshot.id + "/upload", {
      method: "POST", body: "{}"
    });
    await loadDriveData();
    return result;
  }, "Snapshot uploaded to your Google Drive.");

  const restoreDriveBackup = (file) => {
    if (!window.confirm("Restore this Google Drive backup over the current project files and workspace metadata? The owner record and local backup history will be retained.")) return;
    run("drive-restore", async () => {
      const result = await request("/api/v1/desktop/drive/projects/" + projectId + "/backups/" + file.id + "/restore", {
        method: "POST", body: "{}"
      });
      await loadProjectFiles("");
      await loadSnapshots();
      await onRefresh();
      return result;
    }, "Google Drive backup restored into the selected local project.");
  };

  const restoreSnapshot = (snapshot) => {
    if (!window.confirm("Restore " + snapshot.id + "? This restores the full project source and workspace metadata. The owner record and snapshot history will be retained.")) return;
    run("restore", async () => {
      const result = await request("/api/v1/desktop/projects/" + projectId + "/snapshots/" + snapshot.id + "/restore", { method: "POST", body: "{}" });
      await loadProjectFiles("");
      setOpenedFile(null);
      await loadSnapshots();
      await onRefresh();
      return result;
    }, "The complete project was restored from the selected snapshot.");
  };

  const installSelectedTools = () => {
    if (!selectedTools.length) return;
    if (!window.confirm("Install these selected toolchains on this computer: " + selectedTools.join(", ") + "? Continue?")) return;
    run("install-tools", async () => {
      const result = await request("/api/v1/desktop/toolchains/install", {
        method: "POST", body: JSON.stringify({ tools: selectedTools, confirm_install: true })
      });
      await loadToolchains();
      return result;
    });
  };

  const prepareRelease = () => {
    if (!projectId || !releaseArtifact) return;
    run("prepare-release", () => request("/api/v1/desktop/projects/" + projectId + "/publish/prepare", {
      method: "POST", body: JSON.stringify({ platform: releasePlatform, artifact_id: releaseArtifact })
    }), "Release manifest prepared locally. Nothing has been uploaded or submitted.");
  };

  const parentPath = folderPath ? folderPath.split("/").filter(Boolean).slice(0, -1).join("/") : "";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      {error && <div role="alert" className="rounded-xl border border-rose-800/60 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">{error}</div>}
      <section className={panel + " p-4"}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300"><Laptop size={21}/></div>
            <div><h2 className="text-sm font-black text-white">NEXORA runs on this computer</h2><p className="mt-1 text-[10px] text-slate-400">Local files, SDKs, generation, tests and exports execute through your paired desktop agent.</p></div>
          </div>
          <button type="button" className={button} disabled={Boolean(busy)} onClick={() => run("refresh", loadStatus)}><RefreshCw size={13}/> Refresh machine</button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-[#20334B] bg-[#0A1524] p-3"><div className="text-[9px] text-slate-500">OPERATING SYSTEM</div><div className="mt-1 text-xs font-bold text-white">{status?.machine?.os || "Checking…"}</div></div>
          <div className="rounded-xl border border-[#20334B] bg-[#0A1524] p-3"><div className="text-[9px] text-slate-500">CPU / MEMORY</div><div className="mt-1 text-xs font-bold text-white">{status?.machine?.logical_cpu_count || "—"} cores · {status?.machine?.ram_total_gib || "—"} GiB</div></div>
          <div className="rounded-xl border border-[#20334B] bg-[#0A1524] p-3"><div className="text-[9px] text-slate-500">FREE DISK</div><div className="mt-1 text-xs font-bold text-white">{status?.machine?.disk_free_gib ?? "—"} GiB</div></div>
          <div className="rounded-xl border border-[#20334B] bg-[#0A1524] p-3"><div className="text-[9px] text-slate-500">LOCAL PROJECTS</div><div className="mt-1 text-xs font-bold text-white">{status?.projects ?? "—"}</div></div>
        </div>
        <label className="mt-4 block text-[10px] font-bold text-slate-300">PROJECTS DIRECTORY <span className="font-normal text-slate-500">(absolute path on this computer)</span>
          <input className={field + " mt-1.5"} value={workspacePath} onChange={event => setWorkspacePath(event.target.value)} placeholder="C:\\Users\\you\\Documents\\NEXORA\\Projects"/>
        </label>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className="text-[9px] text-slate-500">This directory remains the source of truth. Switching it does not delete or move the previous workspace.</span><button type="button" className={primary} disabled={!workspacePath.trim() || Boolean(busy)} onClick={chooseWorkspace}><HardDrive size={13}/> Use this directory</button></div>
      </section>

      {view === "factory" && <>
        <section className={panel + " p-4"}>
          <div className="flex items-center gap-2"><FolderOpen size={17} className="text-cyan-300"/><h3 className="text-xs font-black text-white">PROJECT OWNERSHIP & IMPORT</h3></div>
          {project ? <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#20334B] bg-[#0A1524] p-3">
            <div className="min-w-0"><div className="truncate text-xs font-bold text-white">{project.name}</div><p className="mt-1 text-[10px] text-slate-500">Project ID: {project.id} · Local folder and manifest managed by the paired agent</p></div>
            <button type="button" className={button} disabled={Boolean(busy)} onClick={initializeProject}><ShieldCheck size={13}/> Initialize local manifest</button>
          </div> : <p className="mt-3 text-xs text-slate-500">Create or open a project before initializing its local ownership manifest.</p>}
          <div className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <input className={field} value={importPath} onChange={event => setImportPath(event.target.value)} placeholder="Absolute path to existing Godot project folder"/>
            <input className={field} value={importName} onChange={event => setImportName(event.target.value)} placeholder="Display name (optional)"/>
            <button type="button" className={primary} disabled={!importPath.trim() || Boolean(busy)} onClick={importProject}><Upload size={13}/> Import Godot project</button>
          </div>
          <p className="mt-2 text-[9px] leading-4 text-slate-500">Import copies source files into NEXORA. Git history and generated caches are excluded; the original project folder is left untouched.</p>
        </section>

        <section className={panel + " p-4"}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><h3 className="flex items-center gap-2 text-xs font-black text-white"><Code2 size={16} className="text-cyan-300"/> LOCAL PROJECT EXPLORER</h3><p className="mt-1 text-[10px] text-slate-500">{project ? "Files inside " + project.name : "Select a project."}</p></div>
            <div className="flex gap-2">{folderPath && <button type="button" className={button} onClick={() => loadProjectFiles(parentPath)}>Up one level</button>}<button type="button" className={button} disabled={!projectId || Boolean(busy)} onClick={() => loadProjectFiles(folderPath)}><RefreshCw size={12}/> Refresh</button></div>
          </div>
          {!project ? <div className="mt-4 rounded-xl border border-dashed border-[#29415F] p-6 text-center text-xs text-slate-500">No selected project.</div> : <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(260px,.75fr)_minmax(0,1.25fr)]">
            <div className="min-w-0 rounded-xl border border-[#20334B] bg-[#0A1524] p-2">
              <div className="flex items-center gap-2 border-b border-white/5 px-2 py-2 text-[10px] font-bold text-slate-400"><Folder size={13} className="text-cyan-300"/>{folderPath || "Project root"}</div>
              <div className="max-h-[460px] overflow-y-auto">{entries.map(entry => <button key={entry.path} type="button" onClick={() => openFile(entry)} className="flex w-full items-center gap-2 border-b border-white/[.035] px-2 py-2 text-left hover:bg-white/5">
                {entry.kind === "directory" ? <Folder size={14} className="shrink-0 text-amber-200"/> : <Code2 size={14} className="shrink-0 text-cyan-300"/>}
                <span className="min-w-0 flex-1 truncate text-[10px] text-slate-200">{entry.name}</span>
                {entry.kind === "file" && <span className="text-[8px] text-slate-600"><Bytes value={entry.size_bytes}/></span>}
                {entry.kind === "directory" && <ChevronRight size={12} className="text-slate-600"/>}
              </button>)}{!entries.length && <div className="p-5 text-center text-[10px] text-slate-600">This folder is empty.</div>}</div>
            </div>
            <div className="min-w-0 rounded-xl border border-[#20334B] bg-[#0A1524] p-3">
              {openedFile ? <><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div className="min-w-0"><div className="truncate text-xs font-bold text-white">{openedFile.path}</div><div className="text-[9px] text-slate-500"><Bytes value={openedFile.size_bytes}/> · SHA-256 save check</div></div><button type="button" className={primary} disabled={Boolean(busy)} onClick={saveFile}><Save size={13}/> Save file</button></div><textarea spellCheck="false" className={field + " min-h-[360px] resize-y font-mono text-[11px] leading-5"} value={editedContent} onChange={event => setEditedContent(event.target.value)}/></> :
                <div className="flex min-h-[360px] flex-col items-center justify-center text-center"><Code2 size={30} className="text-slate-700"/><p className="mt-3 text-xs font-bold text-slate-300">Select a text file to edit</p><p className="mt-1 max-w-xs text-[10px] leading-4 text-slate-600">Binary assets and cache folders are excluded from this editor.</p></div>}
            </div>
          </div>}
        </section>
      </>}

      {view === "toolchains" && <section className={panel + " p-4"}>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 text-xs font-black text-white"><Wrench size={16} className="text-cyan-300"/> TOOLCHAIN MANAGER</h3><p className="mt-1 text-[10px] text-slate-500">Detect first. Install only selected desktop tools after explicit consent.</p></div><button className={button} type="button" disabled={Boolean(busy)} onClick={() => run("toolchains", loadToolchains)}><RefreshCw size={12}/> Detect tools</button></div>
        {!toolchains ? <div className="mt-4 text-xs text-slate-500">Detecting local toolchains…</div> : <>
          <div className="mt-3 flex flex-wrap gap-2 text-[9px] text-slate-400"><span className="rounded-md border border-[#29415F] px-2 py-1">OS: {toolchains.machine?.system || "Unknown"}</span><span className="rounded-md border border-[#29415F] px-2 py-1">Installer: {toolchains.install_provider || "manual setup"}</span></div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">{toolchains.catalog?.map(item => {
            const detectedKey = item.id === "java17" ? "java" : item.id;
            const detected = toolchains.tools?.[detectedKey];
            return <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#20334B] bg-[#0A1524] p-3">
              <input type="checkbox" checked={selectedTools.includes(item.id)} onChange={event => setSelectedTools(current => event.target.checked ? [...current, item.id] : current.filter(value => value !== item.id))} className="mt-1 accent-cyan-400"/>
              <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2"><b className="text-xs text-white">{item.label}</b><State ready={Boolean(detected?.available)}>{detected?.available ? "Detected" : "Not detected"}</State></span><span className="mt-1 block text-[10px] leading-4 text-slate-500">{item.purpose}</span><span className="mt-1 block break-all text-[9px] text-slate-600">{detected?.version || item.winget_id}</span></span>
            </label>;
          })}</div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><p className="max-w-2xl text-[9px] leading-4 text-slate-500">Installs use a fixed package allowlist and no arbitrary shell commands. Android SDK components and export templates may still require official managers and licence acceptance.</p><button className={primary} type="button" disabled={!selectedTools.length || Boolean(busy) || !toolchains.install_provider} onClick={installSelectedTools}><Download size={13}/> Install selected tools</button></div>
          {toolchains.lock && <div className="mt-4 rounded-xl border border-[#20334B] bg-[#0A1524] p-3"><div className="text-[10px] font-bold text-slate-300">PROJECT TOOLCHAIN LOCK</div><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all text-[9px] text-slate-500">{JSON.stringify(toolchains.lock, null, 2)}</pre></div>}
        </>}
      </section>}

      {view === "backups" && <section className={panel + " p-4"}>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 text-xs font-black text-white"><Archive size={16} className="text-cyan-300"/> LOCAL VERSIONS & BACKUPS</h3><p className="mt-1 text-[10px] text-slate-500">Create integrity-checked snapshots. Restore recovers the full project source and workspace metadata while preserving the owner record and backup history.</p></div><button className={primary} type="button" disabled={!projectId || Boolean(busy)} onClick={createSnapshot}><Archive size={13}/> Create snapshot</button></div>
        {!project ? <div className="mt-4 text-xs text-slate-500">Select a project to manage snapshots.</div> : <div className="mt-4 space-y-2">{snapshots.map(snapshot => <article key={snapshot.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#20334B] bg-[#0A1524] p-3">
          <div className="min-w-0"><div className="truncate text-xs font-bold text-white">{snapshot.id}</div><div className="mt-1 text-[9px] text-slate-500">{snapshot.file_count} files · <Bytes value={snapshot.source_bytes}/> source · archive <Bytes value={snapshot.archive_bytes}/></div><div className="mt-1 break-all text-[8px] text-slate-600">SHA-256 {snapshot.sha256}</div></div><div className="flex flex-wrap gap-2">
            {driveStatus?.connected && !driveBackups.some(file => file.appProperties?.nexoraSnapshotId === snapshot.id) && <button type="button" className={button} disabled={Boolean(busy)} onClick={() => uploadSnapshotToDrive(snapshot)}><Upload size={12}/> Back up to Drive</button>}
            {driveStatus?.connected && driveBackups.some(file => file.appProperties?.nexoraSnapshotId === snapshot.id) && <State ready={true}>Drive copy exists</State>}
            <button type="button" className={button} disabled={Boolean(busy)} onClick={() => restoreSnapshot(snapshot)}><RefreshCw size={12}/> Restore</button>
          </div>
        </article>)}{!snapshots.length && <div className="rounded-xl border border-dashed border-[#29415F] p-6 text-center text-xs text-slate-500">No snapshots yet. Create your first local restore point.</div>}</div>}
        <div className="mt-4 rounded-xl border border-[#29415F] bg-[#0A1524] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><div className="flex items-center gap-2 text-[10px] font-bold text-slate-200"><LockKeyhole size={13}/> GOOGLE DRIVE BACKUP</div><p className="mt-1 text-[9px] text-slate-500">Your Google account · drive.file scope · refresh token in the operating-system credential vault.</p></div>
            <div className="flex flex-wrap gap-2">
              <State ready={Boolean(driveStatus?.connected)}>{driveStatus?.connected ? "Connected" : driveStatus?.configured ? "Not connected" : "OAuth not configured"}</State>
              <button type="button" className={button} disabled={Boolean(busy)} onClick={() => run("drive-status", loadDriveData)}><RefreshCw size={12}/> Refresh</button>
              {!driveStatus?.connected && <button type="button" className={primary} disabled={Boolean(busy) || !driveStatus?.configured} onClick={connectDrive}>Connect Google Drive</button>}
              {driveStatus?.connected && <button type="button" className={button} disabled={Boolean(busy)} onClick={disconnectDrive}>Disconnect</button>}
            </div>
          </div>
          {!driveStatus?.configured && <p className="mt-2 text-[9px] leading-4 text-amber-200/80">Set NEXORA_GOOGLE_OAUTH_CLIENT_ID to your Google OAuth Desktop client ID in the Local Agent environment, then restart the agent. The redirect URI must match the local agent callback.</p>}
          {driveStatus?.connected && <div className="mt-3 border-t border-white/5 pt-3">
            <div className="mb-2 text-[9px] font-bold text-slate-400">REMOTE BACKUPS FOR THIS PROJECT</div>
            {driveBackups.map(file => <div key={file.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-2">
              <div className="min-w-0"><div className="truncate text-[10px] font-bold text-slate-200">{file.name}</div><div className="text-[9px] text-slate-500"><Bytes value={file.size}/> · {file.modifiedTime || "Drive backup"}</div></div>
              <button type="button" className={button} disabled={Boolean(busy)} onClick={() => restoreDriveBackup(file)}><RefreshCw size={12}/> Restore from Drive</button>
            </div>)}
            {!driveBackups.length && <div className="text-[9px] text-slate-600">No NEXORA backups found for this project in Drive.</div>}
          </div>}
        </div>
      </section>}

      {view === "release-center" && <section className={panel + " p-4"}>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 text-xs font-black text-white"><PackageCheck size={16} className="text-cyan-300"/> RELEASE & PUBLISHING CENTER</h3><p className="mt-1 text-[10px] text-slate-500">Check publisher prerequisites and prepare signed-off release metadata. NEXORA does not create store accounts or auto-publish.</p></div><button className={button} type="button" disabled={Boolean(busy)} onClick={() => run("publish-check", loadPublishing)}><RefreshCw size={12}/> Recheck publishers</button></div>
        <div className="mt-4 grid gap-2 lg:grid-cols-3">{publishers.map(provider => <article key={provider.id} className="rounded-xl border border-[#20334B] bg-[#0A1524] p-3">
          <div className="flex items-center justify-between gap-2"><b className="text-xs text-white">{provider.name}</b><State ready={provider.ready}>{provider.ready ? "Configured" : "Needs setup"}</State></div>
          <ul className="mt-3 space-y-1.5">{(provider.missing || []).map(item => <li key={item} className="text-[9px] text-amber-200/80">• {item}</li>)}</ul>
          <div className="mt-3 border-t border-white/5 pt-2 text-[9px] text-slate-500">Your developer account, app identity and final submission approval remain yours.</div>
        </article>)}</div>
        <div className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          <select className={field} value={releasePlatform} onChange={event => setReleasePlatform(event.target.value)}><option value="android">Android</option><option value="web">Web</option><option value="windows">Windows</option><option value="linux">Linux</option></select>
          <select className={field} value={releaseArtifact} onChange={event => setReleaseArtifact(event.target.value)}><option value="">Select a build artifact</option>{completedArtifacts.map(item => <option key={item.jobId + ":" + item.id} value={item.id}>{item.filename} · {item.target} · {String(item.jobId).slice(0, 8)}</option>)}</select>
          <button type="button" className={primary} disabled={!projectId || !releaseArtifact || Boolean(busy)} onClick={prepareRelease}><ShieldCheck size={13}/> Prepare manifest</button>
        </div>
        <p className="mt-2 text-[9px] leading-4 text-slate-500">The manifest records owner, target, artifact path, size and SHA-256. Upload, store approval and public release are separate steps.</p>
      </section>}
    </div>
  );
}
