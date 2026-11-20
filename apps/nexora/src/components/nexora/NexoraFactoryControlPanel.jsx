import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Archive, CheckCircle2, CircleAlert, Cloud, Code2, Download, ExternalLink, FileArchive, Folder, FolderOpen, HardDrive, History, Laptop, LockKeyhole, PackageCheck, Play, RefreshCw, Save, ShieldCheck, Smartphone, Upload, Wrench, X } from "lucide-react";

const AGENT = "http://127.0.0.1:8765";
const TOKEN_KEY = "nexora.local-agent.token";
const panel = "rounded-2xl border border-[#20334B] bg-[#0D1929]";
const btn = "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[#29415F] bg-[#101C2D] px-3 py-2 text-[10px] font-extrabold text-slate-200 hover:border-cyan-500/50 disabled:opacity-40";
const primary = "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-[10px] font-black text-[#04111A] hover:bg-cyan-300 disabled:opacity-40";
const field = "min-h-10 w-full rounded-lg border border-[#29415F] bg-[#081321] px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/70";
const tabs = [["workspace","Workspace",FolderOpen],["toolchains","Toolchains",Wrench],["workflow","Create · Test · Build",Code2],["backups","Backup & Versions",History],["publishing","Publishing",PackageCheck]];

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!bytes) return "0 B";
  const units = ["B","KB","MB","GB","TB"];
  const index = Math.min(4, Math.floor(Math.log(bytes) / Math.log(1024)));
  return (bytes / Math.pow(1024,index)).toFixed(index ? 1 : 0) + " " + units[index];
}
function Status({ok, children}) {
  return <span className={"inline-flex items-center gap-1 rounded-md px-2 py-1 text-[9px] font-black " + (ok ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-200")}>{ok ? <CheckCircle2 size={11}/> : <CircleAlert size={11}/>} {children}</span>;
}

export default function NexoraFactoryControlPanel({projectId="", onWorkspaceUpdated=()=>{}, onNavigate=()=>{}, onSelectProject=()=>{}, onQueueProduction=()=>{}, setNotice=()=>{}}) {
  const [tab,setTab] = useState("workspace");
  const [workspace,setWorkspace] = useState(null);
  const [tools,setTools] = useState(null);
  const [publisherStatus,setPublisherStatus] = useState(null);
  const [jobs,setJobs] = useState([]);
  const [snapshots,setSnapshots] = useState([]);
  const [releases,setReleases] = useState([]);
  const [selectedId,setSelectedId] = useState(projectId);
  const [rootDraft,setRootDraft] = useState("");
  const [snapshotNote,setSnapshotNote] = useState("Manual checkpoint before major changes");
  const [buildTarget,setBuildTarget] = useState("web");
  const [provider,setProvider] = useState("google_play");
  const [artifactPath,setArtifactPath] = useState("");
  const [packageId,setPackageId] = useState("com.studio.mygame");
  const [versionName,setVersionName] = useState("1.0.0");
  const [versionCode,setVersionCode] = useState("1");
  const [releaseNotes,setReleaseNotes] = useState("");
  const [busy,setBusy] = useState("");
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");
  const importRef = useRef(null);

  const token = () => { try { return sessionStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; } };
  const request = useCallback(async (path,options={}) => {
    const activeToken = token();
    if (!activeToken) throw new Error("Pair this browser with the NEXORA Local Agent in Device Lab first.");
    const headers = new Headers(options.headers || {});
    headers.set("Authorization","Bearer " + activeToken);
    headers.set("Accept",headers.get("Accept") || "application/json");
    const response = await fetch(AGENT + path,{...options,headers,mode:"cors",credentials:"omit",cache:"no-store"});
    const type = response.headers.get("content-type") || "";
    const payload = type.includes("application/json") ? await response.json().catch(()=>({})) : null;
    if (!response.ok) {
      const detail = payload && payload.detail;
      throw new Error(typeof detail === "string" ? detail : detail && detail.message || payload && payload.message || ("Local factory request failed (HTTP " + response.status + ")."));
    }
    return payload === null ? response : payload;
  },[]);
  const download = useCallback(async (path,filename) => {
    const activeToken = token();
    if (!activeToken) throw new Error("Local Agent is not paired.");
    const response = await fetch(AGENT + path,{headers:{Authorization:"Bearer " + activeToken,Accept:"application/zip"},mode:"cors",credentials:"omit",cache:"no-store"});
    if (!response.ok) throw new Error("Download failed (HTTP " + response.status + ").");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),30000);
  },[]);

  const refresh = useCallback(async (requestedId=selectedId) => {
    setBusy("refresh"); setError("");
    try {
      const results = await Promise.all([request("/workspace"),request("/toolchains"),request("/publishing/status")]);
      const ws = results[0];
      setWorkspace(ws); setTools(results[1]); setPublisherStatus(results[2]); setRootDraft(ws.workspace_root || "");
      const nextId = requestedId && (ws.projects || []).some((item)=>item.id===requestedId) ? requestedId : ((ws.projects || [])[0] || {}).id || "";
      setSelectedId(nextId);
      if (nextId) {
        const detail = await Promise.all([
          request("/workspace/projects/" + nextId + "/snapshots"),
          request("/engine/api/v1/workspace/projects/" + nextId + "/jobs"),
          request("/publishing/projects/" + nextId + "/releases"),
        ]);
        setSnapshots(detail[0].snapshots || []); setJobs(detail[1].jobs || []); setReleases(detail[2].releases || []);
      } else { setSnapshots([]); setJobs([]); setReleases([]); }
    } catch (e) { setError(e.message || "Could not read local factory state."); }
    finally { setBusy(""); }
  },[request,selectedId]);

  useEffect(()=>{ refresh(projectId); },[projectId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{
    if (!selectedId) return undefined;
    let live = true;
    Promise.all([
      request("/workspace/projects/" + selectedId + "/snapshots"),
      request("/engine/api/v1/workspace/projects/" + selectedId + "/jobs"),
      request("/publishing/projects/" + selectedId + "/releases"),
    ]).then((rows)=>{
      if (!live) return;
      setSnapshots(rows[0].snapshots || []); setJobs(rows[1].jobs || []); setReleases(rows[2].releases || []);
    }).catch((e)=>{if(live)setError(e.message);});
    return ()=>{live=false;};
  },[selectedId,request]);

  const selectedProject = useMemo(()=>((workspace && workspace.projects) || []).find((item)=>item.id===selectedId) || null,[workspace,selectedId]);
  const artifactRows = useMemo(()=>jobs.filter((job)=>job.state==="completed").flatMap((job)=>(job.artifacts || []).map((item)=>({...item,jobId:job.id}))).filter((item)=>item.path),[jobs]);
  const extension = {google_play:".aab",apple_app_store:".ipa",microsoft_store:".msix"}[provider];
  const providerArtifacts = artifactRows.filter((item)=>String(item.path).toLowerCase().endsWith(extension));
  const selectedArtifact = providerArtifacts.find((item)=>item.path===artifactPath);

  const run = async (key,callback) => {
    setBusy(key); setError(""); setMessage("");
    try {
      const result = await callback();
      setMessage((result && result.message) || "Operation completed.");
      if (result && result.message) setNotice(result.message);
      return result;
    } catch(e) { setError(e.message || "The local factory operation failed."); return null; }
    finally { setBusy(""); }
  };
  const saveRoot = ()=>run("root",async()=>{
    const result=await request("/workspace/root",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:rootDraft.trim()})});
    await refresh(selectedId); await onWorkspaceUpdated(); return result;
  });
  const importProject = (file)=>run("import",async()=>{
    const form=new FormData(); form.append("file",file);
    const result=await request("/workspace/import",{method:"POST",body:form});
    await refresh(result.project_id); await onWorkspaceUpdated(); return result;
  });
  const openGodot = (id=selectedId)=>run("godot",()=>request("/workspace/projects/"+id+"/open-editor",{method:"POST"}));
  const exportProject = (id=selectedId,name="project")=>run("export",()=>download("/workspace/projects/"+id+"/archive",name+".zip"));
  const createSnapshot = ()=>run("snapshot",async()=>{
    const form=new FormData(); form.append("note",snapshotNote);
    const result=await request("/workspace/projects/"+selectedId+"/snapshots",{method:"POST",body:form});
    await refresh(selectedId);
    return {message:"Snapshot " + result.snapshot.id + " created · " + formatBytes(result.snapshot.archive_bytes) + " archive."};
  });
  const restoreSnapshot = (snapshot)=>{
    if(!window.confirm("Restore " + snapshot.id + "? NEXORA first creates a safety snapshot of the current project.")) return;
    run("restore",async()=>{
      const result=await request("/workspace/projects/"+selectedId+"/snapshots/"+snapshot.id+"/restore",{method:"POST"});
      await refresh(selectedId); return result;
    });
  };
  const lockTools = ()=>run("lock",()=>request("/workspace/projects/"+selectedId+"/toolchain-lock",{method:"POST"}));
  const prepareRelease = ()=>run("release",async()=>{
    if(!selectedArtifact) throw new Error("Build a " + extension + " package on this computer before preparing the handoff.");
    const result=await request("/publishing/prepare",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({project_id:selectedId,provider,artifact_path:artifactPath,package_id:packageId,version_name:versionName,version_code:Number(versionCode),notes:releaseNotes,confirm_prepare:true}),
    });
    await refresh(selectedId);
    await download(result.release.download_url,"nexora-"+provider+"-"+result.release.release_id+".zip");
    return result;
  });

  return <div className="mx-auto w-full max-w-6xl space-y-4">
    <section className={panel+" overflow-hidden"}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#20334B] px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300"><Laptop size={22}/></div><div><div className="text-[10px] font-black tracking-[.2em] text-cyan-300">NEXORA DESKTOP FACTORY</div><h2 className="mt-1 text-lg font-black text-white">Your machine is the production studio</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">Project source, asset generation, Godot, builds and tests stay on your computer. The hosted control plane does not run game-generation workloads.</p></div></div>
        <button type="button" className={btn} onClick={()=>refresh(selectedId)} disabled={busy==="refresh"}><RefreshCw size={13} className={busy==="refresh"?"animate-spin":""}/> Refresh local status</button>
      </div>
      <div className="grid gap-2 p-3 sm:grid-cols-3 sm:p-4">
        <div className="rounded-xl border border-[#20334B] bg-[#081321] p-3"><div className="text-[9px] font-bold tracking-wider text-slate-500">WORKSPACE ROOT</div><div className="mt-1 break-all text-xs font-bold text-slate-200">{workspace?.workspace_root || "Local Agent not connected"}</div></div>
        <div className="rounded-xl border border-[#20334B] bg-[#081321] p-3"><div className="text-[9px] font-bold tracking-wider text-slate-500">LOCAL PROJECTS</div><div className="mt-1 text-xl font-black text-white">{workspace?.project_count ?? "—"}</div></div>
        <div className="rounded-xl border border-[#20334B] bg-[#081321] p-3"><div className="text-[9px] font-bold tracking-wider text-slate-500">FREE WORKSPACE DISK</div><div className="mt-1 text-xl font-black text-white">{workspace ? workspace.disk_free_gib + " GiB" : "—"}</div></div>
      </div>
    </section>

    <nav className="flex flex-wrap gap-1 rounded-xl border border-[#20334B] bg-[#0A1422] p-1">{tabs.map(([id,label,Icon])=><button key={id} type="button" onClick={()=>setTab(id)} className={"flex min-h-9 items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-extrabold "+(tab===id?"bg-cyan-400 text-[#04111A]":"text-slate-400 hover:bg-white/5 hover:text-white")}><Icon size={13}/>{label}</button>)}</nav>
    {(error || message) && <div role="status" className={"flex items-start justify-between gap-3 rounded-xl border px-3 py-2 text-xs "+(error?"border-rose-800/60 bg-rose-950/20 text-rose-200":"border-emerald-800/50 bg-emerald-950/20 text-emerald-200")}><span>{error || message}</span><button type="button" onClick={()=>{setError("");setMessage("");}} aria-label="Dismiss"><X size={14}/></button></div>}

    {tab==="workspace" && <section className={panel+" space-y-4 p-4 sm:p-5"}>
      <header><h3 className="text-sm font-black text-white">1. Project workspace & ownership</h3><p className="mt-1 text-xs text-slate-400">Choose where NEXORA writes projects. Existing Foundry folders move only after collision checks; conflicting folders are never overwritten.</p></header>
      <div className="rounded-xl border border-[#29415F] bg-[#081321] p-3"><label className="text-[10px] font-bold text-slate-400">LOCAL PROJECT DIRECTORY</label><div className="mt-2 flex flex-col gap-2 sm:flex-row"><input className={field} value={rootDraft} onChange={(e)=>setRootDraft(e.target.value)} placeholder={"C:\\Users\\You\\Documents\\NEXORA\\Projects"}/><button type="button" className={primary} onClick={saveRoot} disabled={!!busy || !rootDraft.trim()}><Folder size={13}/> Save folder</button></div><p className="mt-2 text-[9px] leading-4 text-slate-500">Enter an absolute path on this computer. New project folders and imported sources stay on this local filesystem.</p></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs font-bold text-white">Import an existing Godot project</div><p className="mt-1 text-[10px] text-slate-500">Choose a ZIP containing exactly one project.godot. Its original source files stay locally owned.</p></div><div><input ref={importRef} type="file" accept=".zip,application/zip" className="hidden" onChange={(e)=>{const file=e.target.files?.[0];if(file)importProject(file);e.target.value="";}}/><button type="button" className={primary} onClick={()=>importRef.current?.click()} disabled={!!busy}><Upload size={13}/> Import Godot ZIP</button></div></div>
      <div className="border-t border-[#20334B] pt-3"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h4 className="text-xs font-extrabold text-white">Projects on this computer</h4><Status ok={Boolean(workspace?.workspace_root)}>Local filesystem</Status></div><div className="space-y-2">{(workspace?.projects || []).map((project)=><div key={project.id} className={"flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 "+(selectedId===project.id?"border-cyan-500/50 bg-cyan-500/5":"border-[#20334B] bg-[#081321]")}><button type="button" className="min-w-0 flex-1 text-left" onClick={()=>{setSelectedId(project.id);onSelectProject(project.id);}}><div className="truncate text-xs font-extrabold text-white">{project.name}</div><div className="mt-1 truncate text-[9px] text-slate-500">ID {project.id} · UUID {project.project_uuid}</div><div className="mt-1 text-[9px] text-slate-500">{project.engine_project_path?"Godot source: "+project.engine_project_path:"Foundry project · Godot generated on build"}</div></button><div className="flex flex-wrap gap-1"><button type="button" className={btn} onClick={()=>{setSelectedId(project.id);onSelectProject(project.id);setTab("workflow");}}>Select</button><button type="button" className={btn} onClick={()=>{setSelectedId(project.id);onSelectProject(project.id);openGodot(project.id);}}><Play size={12}/> Godot</button><button type="button" className={btn} onClick={()=>{setSelectedId(project.id);onSelectProject(project.id);exportProject(project.id,project.name);}}><Download size={12}/> ZIP</button></div></div>)}{!workspace?.projects?.length && <p className="rounded-xl border border-dashed border-[#29415F] p-5 text-center text-xs text-slate-500">No local projects yet. Create one from the Studio header or import a Godot ZIP.</p>}</div></div>
    </section>}

    {tab==="toolchains" && <section className={panel+" space-y-4 p-4 sm:p-5"}>
      <header><h3 className="text-sm font-black text-white">2. Local toolchain manager</h3><p className="mt-1 text-xs text-slate-400">Detect versions and record per-project locks. Installers and licence acceptance remain under your control; no SDK, driver or model is silently downloaded.</p></header>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{(tools?.tools || []).map((tool)=><div key={tool.id} className="rounded-xl border border-[#20334B] bg-[#081321] p-3"><div className="flex items-start justify-between gap-2"><div><div className="text-xs font-extrabold text-white">{tool.label}</div><div className="mt-1 text-[9px] text-slate-500">{tool.purpose}</div></div><Status ok={tool.available}>{tool.available?"Detected":"Missing"}</Status></div><div className="mt-2 break-all text-[9px] text-slate-400">{tool.version || tool.path || "Not detected"}</div>{tool.download_url && <a className="mt-3 inline-flex items-center gap-1 text-[9px] font-bold text-cyan-300" href={tool.download_url} target="_blank" rel="noreferrer">Official setup guide <ExternalLink size={10}/></a>}</div>)}</div>
      <div className="border-t border-[#20334B] pt-3"><div className="mb-2 text-xs font-extrabold text-white">Workload preflight</div><div className="grid gap-2 sm:grid-cols-2">{Object.entries(tools?.workload_profiles || {}).map(([id,profile])=><div key={id} className="rounded-xl border border-[#20334B] bg-[#081321] p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-slate-200">{profile.label}</span><Status ok={profile.ready}>{profile.ready?"Ready":"Blocked"}</Status></div><div className="mt-2 space-y-1">{(profile.checks || []).filter((row)=>row.status!=="pass").map((row)=><div key={row.name} className="text-[9px] leading-4 text-amber-200">{row.name}: {row.detail}</div>)}</div></div>)}</div></div>
      {selectedId && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-900/50 bg-cyan-950/15 p-3"><div><div className="text-xs font-bold text-white">Lock detected tools for this project</div><p className="mt-1 text-[9px] text-slate-400">Writes detected versions, executable locations and SHA-256 fingerprints into .nexora/toolchain.lock.json.</p></div><button type="button" className={primary} onClick={lockTools} disabled={!!busy}><LockKeyhole size={12}/> Record toolchain lock</button></div>}
      <p className="text-[9px] leading-4 text-slate-500">A binary hash records file integrity; it does not prove publisher identity or licence rights.</p>
    </section>}

    {tab==="workflow" && <section className={panel+" space-y-4 p-4 sm:p-5"}>
      <header><h3 className="text-sm font-black text-white">3–5. Creation, testing and build pipeline</h3><p className="mt-1 text-xs text-slate-400">NEXORA orchestrates production; Godot remains the native engine/editor. Jobs execute on the paired desktop.</p></header>
      <div className="grid gap-2 sm:grid-cols-3"><button type="button" className={panel+" p-4 text-left hover:border-cyan-500/50"} onClick={()=>onNavigate("game-editor")}><Code2 className="text-cyan-300" size={20}/><div className="mt-2 text-xs font-extrabold text-white">Creation workspace</div><p className="mt-1 text-[9px] leading-4 text-slate-500">Scene editor, Creator Flow, World Builder and Asset Library.</p><span className="mt-3 inline-block text-[9px] font-bold text-cyan-300">Open workspace →</span></button><button type="button" className={panel+" p-4 text-left hover:border-cyan-500/50"} onClick={()=>onNavigate("build")}><ShieldCheck className="text-emerald-300" size={20}/><div className="mt-2 text-xs font-extrabold text-white">Test & validation</div><p className="mt-1 text-[9px] leading-4 text-slate-500">Godot headless checks, local playtests and build logs.</p><span className="mt-3 inline-block text-[9px] font-bold text-cyan-300">Open Build & Test →</span></button><button type="button" className={panel+" p-4 text-left hover:border-cyan-500/50"} onClick={()=>onNavigate("device-lab")}><Smartphone className="text-violet-300" size={20}/><div className="mt-2 text-xs font-extrabold text-white">Device lab</div><p className="mt-1 text-[9px] leading-4 text-slate-500">Optional Android ADB install, launch and logcat.</p><span className="mt-3 inline-block text-[9px] font-bold text-cyan-300">Open Device Lab →</span></button></div>
      <div className="rounded-xl border border-[#20334B] bg-[#081321] p-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="min-w-[220px] flex-1 text-[10px] font-bold text-slate-400">LOCAL EXPORT TARGET
            <select className={field+" mt-1"} value={buildTarget} onChange={(event)=>setBuildTarget(event.target.value)}>
              <option value="web">Web (HTML / WASM bundle)</option>
              <option value="windows">Windows desktop (.exe)</option>
              <option value="linux">Linux desktop (.x86_64)</option>
              <option value="android">Android (APK / AAB settings in Build & Test)</option>
            </select>
          </label>
          <button type="button" className={primary} onClick={()=>onQueueProduction("build.export",buildTarget)} disabled={!selectedId || !!busy}>
            <PackageCheck size={12}/> Queue {buildTarget} export
          </button>
          <button type="button" className={btn} onClick={()=>onQueueProduction("playtest","desktop")} disabled={!selectedId || !!busy}>
            <Play size={12}/> Run local playtest
          </button>
        </div>
        <p className="mt-2 text-[9px] leading-4 text-slate-500">Builds run on the paired desktop. Android release signing requires a protected local keystore; an AAB is release-only. This does not submit to any app store.</p>
      </div>
      <div className="rounded-xl border border-[#20334B] bg-[#081321] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><div className="text-xs font-bold text-white">Selected local project</div><div className="mt-1 text-[10px] text-slate-500">{selectedProject?.name || "Choose a project in Workspace first"}</div></div><Status ok={Boolean(selectedId)}>{selectedId?"Selected":"No project"}</Status></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" className={btn} onClick={openGodot} disabled={!selectedId || !!busy}><Play size={12}/> Launch Godot Editor</button><button type="button" className={btn} onClick={()=>onNavigate("build")} disabled={!selectedId}><PackageCheck size={12}/> Export targets</button></div></div>
      <div className="border-t border-[#20334B] pt-3"><div className="mb-2 text-xs font-extrabold text-white">Recent local production jobs</div><div className="space-y-2">{jobs.slice(0,8).map((job)=><div key={job.id} className="rounded-lg border border-[#20334B] bg-[#081321] p-3"><div className="flex flex-wrap justify-between gap-2"><span className="text-[10px] font-bold text-slate-200">{job.kind || "Production job"}</span><Status ok={job.state==="completed"}>{job.state}</Status></div><p className="mt-1 text-[9px] leading-4 text-slate-500">{job.message || "No job details"}</p>{(job.artifacts || []).map((item)=><div key={item.id} className="mt-1 break-all text-[9px] text-cyan-300">{item.filename} · {item.path}</div>)}</div>)}{!jobs.length && <p className="text-[10px] text-slate-500">No jobs recorded for this project yet.</p>}</div></div>
    </section>}

    {tab==="backups" && <section className={panel+" space-y-4 p-4 sm:p-5"}>
      <header><h3 className="text-sm font-black text-white">6. Backup, versions & recovery</h3><p className="mt-1 text-xs text-slate-400">Full-project snapshots are stored locally with SHA-256 checksums. Restore always creates a safety snapshot first.</p></header>
      {!selectedId ? <p className="rounded-xl border border-dashed border-[#29415F] p-5 text-xs text-slate-500">Select a local project to manage snapshots.</p> : <>
        <div className="flex flex-col gap-2 sm:flex-row"><input className={field} value={snapshotNote} onChange={(e)=>setSnapshotNote(e.target.value)} maxLength={300} placeholder="Snapshot note"/><button type="button" className={primary} onClick={createSnapshot} disabled={!!busy}><Save size={12}/> Create snapshot</button><button type="button" className={btn} onClick={()=>exportProject(selectedId,selectedProject?.name || "nexora-project")} disabled={!!busy}><FileArchive size={12}/> Export project ZIP</button></div>
        <div className="space-y-2">{snapshots.map((snapshot)=><div key={snapshot.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#20334B] bg-[#081321] p-3"><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-white">{snapshot.note}</div><div className="mt-1 text-[9px] text-slate-500">{new Date(snapshot.created_at).toLocaleString()} · {snapshot.file_count} files · {formatBytes(snapshot.archive_bytes)}</div><div className="mt-1 break-all text-[8px] text-slate-600">SHA-256 {snapshot.sha256}</div></div><div className="flex gap-1"><button type="button" className={btn} onClick={()=>run("snapshot-download",()=>download("/workspace/projects/"+selectedId+"/snapshots/"+snapshot.id+"/download",snapshot.id+".zip"))}><Download size={12}/> ZIP</button><button type="button" className={btn} onClick={()=>restoreSnapshot(snapshot)} disabled={!!busy}><History size={12}/> Restore</button></div></div>)}{!snapshots.length && <p className="text-[10px] text-slate-500">No full-project snapshots have been created.</p>}</div>
      </>}
      <div className="rounded-xl border border-[#29415F] bg-[#081321] p-3"><div className="flex items-center gap-2 text-xs font-bold text-white"><Cloud size={15} className="text-cyan-300"/> Optional Google Drive backup</div><div className="mt-1 text-[10px] text-amber-200">Not connected — Google OAuth client and the narrow drive.file consent flow still need configuration.</div><p className="mt-1 text-[9px] leading-4 text-slate-500">Local snapshots and ZIP export work without cloud backup. NEXORA will not request broad access to your Drive.</p></div>
    </section>}

    {tab==="publishing" && <section className={panel+" space-y-4 p-4 sm:p-5"}>
      <header><h3 className="text-sm font-black text-white">7. Store release preparation</h3><p className="mt-1 text-xs text-slate-400">NEXORA prepares a verified handoff package. Store upload and final publishing remain under your developer account and explicit approval.</p></header>
      <div className="grid gap-2 md:grid-cols-3">{(publisherStatus?.providers || []).map((item)=><div key={item.id} className="rounded-xl border border-[#20334B] bg-[#081321] p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-extrabold text-white">{item.label}</span><Status ok={item.platform_ready && item.credentials_configured}>{item.platform_ready && item.credentials_configured ? "Configured" : "Setup needed"}</Status></div><div className="mt-2 text-[9px] text-slate-400">Required artifact: {item.artifact}</div><div className="mt-1 text-[9px] text-slate-500">{item.status}</div><div className="mt-2 text-[8px] text-slate-600">Account belongs to: {item.account_owner}</div></div>)}</div>
      <div className="grid gap-3 border-t border-[#20334B] pt-3 sm:grid-cols-2">
        <label className="text-[10px] font-bold text-slate-400">PUBLISHER<select className={field+" mt-1"} value={provider} onChange={(e)=>{setProvider(e.target.value);setArtifactPath("");}}><option value="google_play">Google Play</option><option value="apple_app_store">Apple App Store</option><option value="microsoft_store">Microsoft Store</option></select></label>
        <label className="text-[10px] font-bold text-slate-400">BUILT RELEASE ARTIFACT<select className={field+" mt-1"} value={artifactPath} onChange={(e)=>setArtifactPath(e.target.value)}><option value="">Choose {extension} artifact…</option>{providerArtifacts.map((item)=><option key={item.jobId+":"+item.id} value={item.path}>{item.filename} · {item.path}</option>)}</select></label>
        <label className="text-[10px] font-bold text-slate-400">PACKAGE / APP ID<input className={field+" mt-1"} value={packageId} onChange={(e)=>setPackageId(e.target.value)} placeholder="com.studio.mygame"/></label>
        <label className="text-[10px] font-bold text-slate-400">VERSION<input className={field+" mt-1"} value={versionName} onChange={(e)=>setVersionName(e.target.value)}/></label>
        {provider==="google_play" && <label className="text-[10px] font-bold text-slate-400">VERSION CODE<input className={field+" mt-1"} type="number" min="1" value={versionCode} onChange={(e)=>setVersionCode(e.target.value)}/></label>}
        <label className="text-[10px] font-bold text-slate-400 sm:col-span-2">RELEASE NOTES<textarea className={field+" mt-1"} rows="3" value={releaseNotes} onChange={(e)=>setReleaseNotes(e.target.value)} maxLength={4000}/></label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-800/40 bg-amber-950/10 p-3"><div className="flex items-start gap-2"><LockKeyhole size={15} className="mt-0.5 text-amber-300"/><p className="max-w-2xl text-[9px] leading-4 text-amber-100">This creates a local ZIP with your selected artifact and checksum manifest. It does not upload to a store, submit for review or guarantee approval.</p></div><button type="button" className={primary} onClick={prepareRelease} disabled={!!busy || !selectedId || !artifactPath || !selectedArtifact}><PackageCheck size={12}/> Prepare handoff ZIP</button></div>
      <div className="space-y-2">{releases.map((release)=><div key={release.release_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#20334B] bg-[#081321] p-3"><div><div className="text-xs font-bold text-white">{release.provider} · {release.version_name}</div><div className="mt-1 text-[9px] text-slate-500">{release.artifact_name} · {release.publication_status}</div></div><button type="button" className={btn} onClick={()=>run("release-download",()=>download(release.download_url,release.release_id+".zip"))}><Download size={12}/> Download handoff</button></div>)}</div>
    </section>}

    <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[9px] text-slate-600"><span>Local authority · Desktop only · Godot first · No NEXORA AdMob / rewarded ads</span><span>Google Drive + direct store uploads remain credential-gated.</span></div>
  </div>;
}
