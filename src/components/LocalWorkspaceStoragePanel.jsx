import React, { useCallback, useEffect, useState } from "react";
import { Database, FolderOpen, HardDrive, Download, Trash2, RefreshCw, ShieldCheck } from "lucide-react";
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
