import React, { useCallback, useEffect, useState } from "react";
import { Database, FolderOpen, HardDrive, Download, Trash2, RefreshCw, ShieldCheck, Search, Wifi, Unplug } from "lucide-react";
import { clearLocalWorkspaceAgentConfig, getLocalWorkspaceAgentConfig, indexLocalWorkspace, saveLocalWorkspaceAgentConfig, selectLocalWorkspacePath, testLocalWorkspaceAgent } from "@/ai/localWorkspaceAgent";
import { deleteLocalFile, getLocalStorageEstimate, listLocalFiles, requestPersistentStorage, saveLocalFile, chooseWorkspaceFolder, writeFileToWorkspaceFolder } from "@/ai/localWorkspaceStorage";

function formatBytes(value) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return (value / Math.pow(1024, index)).toFixed(index ? 1 : 0) + " " + units[index];
}

export default function LocalWorkspaceStoragePanel() {
  const [files, setFiles] = useState([]);
  const [estimate, setEstimate] = useState(null);
  const [folderName, setFolderName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [agentConfig, setAgentConfig] = useState(() => getLocalWorkspaceAgentConfig());
  const [agentUrl, setAgentUrl] = useState(() => getLocalWorkspaceAgentConfig().baseUrl);
  const [agentToken, setAgentToken] = useState(() => getLocalWorkspaceAgentConfig().token);
  const [projectPath, setProjectPath] = useState(() => getLocalWorkspaceAgentConfig().path);
  const [agentStatus, setAgentStatus] = useState("");
  const [agentError, setAgentError] = useState("");
  const [agentFiles, setAgentFiles] = useState([]);
  const [agentBusy, setAgentBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [items, usage] = await Promise.all([listLocalFiles(), getLocalStorageEstimate()]);
      setFiles(items);
      setEstimate(usage);
    } catch (err) { setError(err.message || "Local storage is unavailable."); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function authorizeFolder() {
    setBusy(true); setError(""); setMessage("");
    try { setFolderName(await chooseWorkspaceFolder()); setMessage("Folder access granted. RevelaAI can write only inside this selected folder."); }
    catch (err) { if (err.name !== "AbortError") setError(err.message); }
    finally { setBusy(false); }
  }

  async function importFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await saveLocalFile(file, { category: "user_upload" });
      setMessage(file.name + " saved on this device.");
      await refresh();
    } catch (err) { setError(err.message || "Could not save this file locally."); }
    finally { setBusy(false); event.target.value = ""; }
  }

  async function exportFile(id) {
    try {
      const record = await (await import("@/ai/localWorkspaceStorage")).readLocalFile(id);
      if (!record) throw new Error("File not found.");
      const url = URL.createObjectURL(record.blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = record.name; anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) { setError(err.message); }
  }

  async function saveToFolder(id) {
    try {
      const record = await (await import("@/ai/localWorkspaceStorage")).readLocalFile(id);
      if (!record) throw new Error("File not found.");
      const name = await writeFileToWorkspaceFolder(record);
      setMessage(name + " copied to your authorized folder.");
    } catch (err) { setError(err.message); }
  }

  async function removeFile(id) {
    await deleteLocalFile(id);
    await refresh();
    setMessage("File removed from the RevelaAI local workspace.");
  }

  async function persist() {
    try {
      const result = await requestPersistentStorage();
      setMessage(result.supported ? (result.granted ? "Browser granted persistent storage." : "Browser did not grant persistent storage; files may be evicted under storage pressure.") : "Persistent-storage permission is not supported by this browser.");
    } catch (err) { setError(err.message); }
    await refresh();
  }

  async function connectLocalAgent() {
    setAgentBusy(true); setAgentError(""); setAgentStatus(""); setAgentFiles([]);
    try {
      const config = saveLocalWorkspaceAgentConfig({
        baseUrl: agentUrl,
        token: agentToken,
        path: projectPath,
        enabled: agentConfig.enabled,
      });
      const status = await testLocalWorkspaceAgent(config);
      setAgentConfig(config);
      setAgentUrl(config.baseUrl);
      setAgentToken(config.token);
      setProjectPath(status.selected_path || config.path);
      setAgentStatus("Connected to the local device agent at " + (status.selected_path || "the local workspace") + ".");
    } catch (err) { setAgentError(err.message || "Could not connect to the local agent."); }
    finally { setAgentBusy(false); }
  }

  async function useLocalProjectFolder() {
    setAgentBusy(true); setAgentError(""); setAgentStatus(""); setAgentFiles([]);
    try {
      const config = saveLocalWorkspaceAgentConfig({ baseUrl: agentUrl, token: agentToken, path: projectPath, enabled: agentConfig.enabled });
      const result = await selectLocalWorkspacePath(projectPath, config);
      const next = getLocalWorkspaceAgentConfig();
      setAgentConfig(next);
      setProjectPath(result.selected_path);
      setAgentStatus("Selected local project: " + result.selected_path);
    } catch (err) { setAgentError(err.message || "Could not select this local folder."); }
    finally { setAgentBusy(false); }
  }

  async function scanLocalProject() {
    setAgentBusy(true); setAgentError(""); setAgentStatus("");
    try {
      const config = saveLocalWorkspaceAgentConfig({ baseUrl: agentUrl, token: agentToken, path: projectPath, enabled: agentConfig.enabled });
      const result = await indexLocalWorkspace("", 150, config);
      setAgentFiles(result.files || []);
      setAgentStatus("Indexed " + Number(result.count || 0) + " text files on this device. Binary files and secret files were skipped.");
    } catch (err) { setAgentError(err.message || "Could not index the local project."); }
    finally { setAgentBusy(false); }
  }

  function toggleLocalContext(enabled) {
    const next = saveLocalWorkspaceAgentConfig({ enabled });
    setAgentConfig(next);
  }

  function disconnectLocalAgent() {
    clearLocalWorkspaceAgentConfig();
    const next = getLocalWorkspaceAgentConfig();
    setAgentConfig(next);
    setAgentUrl(next.baseUrl);
    setAgentToken("");
    setProjectPath("");
    setAgentFiles([]);
    setAgentStatus("Local agent disconnected. No local project files will be added to chat context.");
    setAgentError("");
  }

  return (
    <section className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900/70" aria-label="Local workspace storage">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2"><HardDrive size={18}/><div><h3 className="text-sm font-extrabold text-slate-900 dark:text-white">My Local Workspace</h3><p className="text-[10px] text-slate-500 dark:text-slate-400">Files stay in this browser unless you explicitly submit them to an AI tool.</p></div></div>
        <button type="button" onClick={refresh} className="rounded-lg p-2 text-slate-500 hover:bg-white dark:hover:bg-slate-800" aria-label="Refresh local files"><RefreshCw size={15}/></button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="cursor-pointer rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">{busy ? "Working…" : "Add file"}<input type="file" className="hidden" onChange={importFile} disabled={busy}/></label>
        <button type="button" onClick={authorizeFolder} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold dark:border-white/15"><FolderOpen size={14}/>{folderName ? "Folder: " + folderName : "Choose local folder"}</button>
        <button type="button" onClick={persist} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold dark:border-white/15"><ShieldCheck size={14}/>Request persistent storage</button>
      </div>
      {estimate && <p className="mt-2 text-[10px] text-slate-500">Browser storage: {formatBytes(estimate.usage)} used of {formatBytes(estimate.quota)} estimated quota.</p>}

      <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2"><Wifi size={15}/><div><h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Local Project Agent</h4><p className="text-[10px] text-slate-500">Connect this browser to the loopback agent running on your own computer.</p></div></div>
          <button type="button" onClick={disconnectLocalAgent} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-300 px-2 text-[10px] font-bold dark:border-white/15"><Unplug size={12}/>Disconnect</button>
        </div>
        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">Local agent endpoint
          <input value={agentUrl} onChange={(event) => setAgentUrl(event.target.value)} placeholder="http://127.0.0.1:38741/api/v1" spellCheck={false}
            className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800 dark:border-white/15 dark:bg-slate-900 dark:text-white"/>
        </label>
        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">Local bearer token
          <input type="password" value={agentToken} onChange={(event) => setAgentToken(event.target.value)} placeholder="Paste the token printed by your local agent" autoComplete="off"
            className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800 dark:border-white/15 dark:bg-slate-900 dark:text-white"/>
        </label>
        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">Project folder path
          <input value={projectPath} onChange={(event) => setProjectPath(event.target.value)} placeholder="C:/admin/project" spellCheck={false}
            className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800 dark:border-white/15 dark:bg-slate-900 dark:text-white"/>
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={connectLocalAgent} disabled={agentBusy || !agentToken} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white disabled:opacity-50">{agentBusy ? "Connecting…" : "Connect agent"}</button>
          <button type="button" onClick={useLocalProjectFolder} disabled={agentBusy || !projectPath || !agentToken} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-bold dark:border-white/15 disabled:opacity-50"><FolderOpen size={13}/>Use folder</button>
          <button type="button" onClick={scanLocalProject} disabled={agentBusy || !agentToken} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-bold dark:border-white/15 disabled:opacity-50"><Search size={13}/>Scan project</button>
        </div>
        <label className="flex items-start gap-2 rounded-lg bg-slate-50 p-2 text-[10px] text-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <input type="checkbox" checked={agentConfig.enabled} onChange={(event) => toggleLocalContext(event.target.checked)} className="mt-0.5"/>
          <span><b>Share relevant project context with RevelaAI</b><br/>When enabled, only bounded UTF-8 snippets from relevant, non-secret files are sent with your next chat request. Binary files and credential files are excluded.</span>
        </label>
        {agentStatus && <p role="status" className="text-[10px] text-emerald-700 dark:text-emerald-300">{agentStatus}</p>}
        {agentError && <p role="alert" className="text-[10px] text-rose-600">{agentError}</p>}
        {agentFiles.length > 0 && <div className="max-h-40 overflow-auto rounded-lg border border-slate-200 p-2 dark:border-white/10">
          <p className="mb-1 text-[10px] font-bold text-slate-500">{agentFiles.length} indexed files</p>
          {agentFiles.map((file) => <div key={file.path} className="flex items-center justify-between gap-2 py-1 text-[10px]">
            <span className="min-w-0 truncate font-mono text-slate-700 dark:text-slate-300">{file.path}</span>
            <span className="shrink-0 text-slate-400">{formatBytes(file.size_bytes)}</span>
          </div>)}
        </div>}
        <details className="text-[10px] text-slate-500">
          <summary className="cursor-pointer font-semibold">How to start the local agent (Windows PowerShell)</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-100 p-2 font-mono text-[10px] dark:bg-slate-900">$env:REVELAAI_AUTOMATION_WORKSPACE="$HOME\\RevelaAIWorkspace"
$env:REVELAAI_AUTOMATION_ALLOWED_ORIGINS="https://revelacode.co.ke"
python -m automation_fabric.local_agent --show-token</pre>
          <p className="mt-1">Run the command from your local RevelaAI backend checkout with its Python dependencies installed. Keep the printed token private.</p>
        </details>
      </div>

      {message && <p role="status" className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">{message}</p>}
      {error && <p role="alert" className="mt-2 text-xs text-rose-600">{error}</p>}
      <div className="mt-3 space-y-2">
        {files.length ? files.map(file => (
          <div key={file.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-950">
            <div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{file.name}</p><p className="text-[10px] text-slate-500">{formatBytes(file.size)} · {new Date(file.updatedAt).toLocaleString()}</p></div>
            <div className="flex gap-1">
              <button type="button" title="Download file" onClick={() => exportFile(file.id)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Download size={14}/></button>
              {folderName && <button type="button" title="Copy to selected folder" onClick={() => saveToFolder(file.id)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><FolderOpen size={14}/></button>}
              <button type="button" title="Delete local copy" onClick={() => removeFile(file.id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><Trash2 size={14}/></button>
            </div>
          </div>
        )) : <p className="rounded-xl border border-dashed border-slate-300 p-3 text-center text-xs text-slate-500 dark:border-white/10">No local files yet. Add a file or save an artifact here.</p>}
      </div>
      <p className="mt-3 text-[10px] text-slate-500"><Database size={11} className="mr-1 inline"/>AI learning and approved knowledge remain on RevelaAI's MongoDB backend; this workspace is not a replacement for that database.</p>
    </section>
  );
}
