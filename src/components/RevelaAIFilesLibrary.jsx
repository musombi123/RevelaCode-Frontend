import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle, Download, FileCode2, FileImage, FileSpreadsheet, FileText,
  FolderOpen, Loader2, Pencil, Plus, RefreshCw, Search, Trash2,
  UploadCloud, X, RotateCcw, Eye, Maximize2,
} from "lucide-react";
import {
  getRevelaAIArtifact,
  listRevelaAIArtifacts,
  trashRevelaAIArtifact,
  updateRevelaAIArtifactMetadata,
  uploadRevelaAIArtifact,
} from "@/ai/revelaAIClient.js";
import {
  downloadRemoteArtifact,
  resolveRevelaAIArtifactUrl,
} from "@/components/utils/saveGeneratedFile";


const TYPES = [
  { value: "", label: "All files" },
  { value: "document", label: "Documents" },
  { value: "spreadsheet", label: "Spreadsheets" },
  { value: "slide_deck", label: "Presentations" },
  { value: "image", label: "Images" },
  { value: "code", label: "Code" },
];

function FileIcon({ type }) {
  if (type === "spreadsheet") return <FileSpreadsheet size={19}/>;
  if (type === "slide_deck") return <FileText size={19}/>;
  if (type === "image" || type === "banner" || type === "logo") return <FileImage size={19}/>;
  if (type === "code") return <FileCode2 size={19}/>;
  return <FileText size={19}/>;
}

function fileSize(bytes) {
  const size = Number(bytes) || 0;
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  return (size / (1024 * 1024)).toFixed(1) + " MB";
}

export default function RevelaAIFilesLibrary({
  authFetch,
  onClose,
  onOpenStudio,
  onPreview,
}) {
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [showTrash, setShowTrash] = useState(false);
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editingTitle, setEditingTitle] = useState("");
  const [editingFolder, setEditingFolder] = useState("");
  const [folder, setFolder] = useState("");
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listRevelaAIArtifacts({
        authFetch, query, type, folder: folder.trim() || undefined,
        includeTrash: showTrash, trashOnly: showTrash, limit: 100,
      });
      setFiles(result.filter((item) => showTrash ? Boolean(item.trashed_at) : !item.trashed_at));
    } catch (loadError) {
      setError(String(loadError?.message || "The Files Library could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [authFetch, query, type, folder, showTrash]);

  useEffect(() => { void load(); }, [load]);

  const importFile = async (file) => {
    if (!file || busy) return;
    setBusy("upload");
    setError("");
    setNotice("");
    try {
      const artifact = await uploadRevelaAIArtifact({ authFetch, file, title: file.name });
      setNotice("Imported " + (artifact?.title || file.name) + ". The original file is preserved.");
      await load();
    } catch (uploadError) {
      setError(String(uploadError?.message || "The file could not be imported."));
    } finally {
      setBusy("");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const downloadOriginal = async (artifact) => {
    if (!artifact?.id || busy) return;
    setBusy("download:" + artifact.id);
    setError("");
    setNotice("");
    try {
      const latest = await getRevelaAIArtifact({ authFetch, artifactId: artifact.id });
      const current = latest || artifact;
      const url = resolveRevelaAIArtifactUrl(current.original_download_url || current.download_url);
      const result = await downloadRemoteArtifact(url, {
        fileName: current.original_filename || current.filename || current.title || "revelaai-file",
        mimeType: current.original_mime_type || current.mime_type || "application/octet-stream",
      });
      setNotice(result.method === "native" ? "Original saved to Android Downloads/RevelaCode." : "Original download started.");
    } catch (downloadError) {
      setError(String(downloadError?.message || "The original file could not be downloaded."));
    } finally {
      setBusy("");
    }
  };

  const saveMetadata = async (artifact, changes) => {
    if (!artifact?.id || busy) return;
    setBusy(artifact.id);
    setError("");
    try {
      const updated = await updateRevelaAIArtifactMetadata({ authFetch, artifactId: artifact.id, changes });
      setFiles((current) => current.map((item) => item.id === updated.id ? updated : item));
      setNotice("File details updated.");
      setEditingId("");
      setEditingTitle("");
      setEditingFolder("");
      await load();
    } catch (metadataError) {
      setError(String(metadataError?.message || "File details could not be updated."));
    } finally {
      setBusy("");
    }
  };

  const moveToTrash = async (artifact) => {
    if (!window.confirm("Move " + artifact.title + " to Trash? The original file will not be permanently deleted.")) return;
    setBusy(artifact.id);
    setError("");
    try {
      await trashRevelaAIArtifact({ authFetch, artifactId: artifact.id });
      setFiles((current) => current.filter((item) => item.id !== artifact.id));
      setNotice("Moved to Trash. You can restore it later.");
    } catch (trashError) {
      setError(String(trashError?.message || "The file could not be moved to Trash."));
    } finally {
      setBusy("");
    }
  };

  const restore = (artifact) => void saveMetadata(artifact, { trashed: false });

  return (
    <div className="fixed inset-0 z-[105] flex flex-col bg-app text-fg" role="dialog" aria-modal="true" aria-label="RevelaAI Files Library" data-demo="revelaai-files-library">
      <header className="flex min-h-16 items-center justify-between gap-3 border-b border-line bg-header px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><FolderOpen size={20}/></div>
          <div className="min-w-0">
            <h1 className="text-base font-bold">My Files</h1>
            <p className="text-[11px] text-muted">RevelaAI Library · Private to your account</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input ref={inputRef} type="file" className="hidden"
            accept=".pdf,.docx,.pptx,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg,.gif,.svg,.js,.jsx,.ts,.tsx,.py,.html,.css,.json,.sql"
            onChange={(event) => void importFile(event.target.files?.[0])}/>
          <button type="button" disabled={Boolean(busy)} onClick={() => inputRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent px-3 text-xs font-bold text-white disabled:opacity-50">
            {busy === "upload" ? <Loader2 size={15} className="animate-spin"/> : <UploadCloud size={15}/>} Import file
          </button>
          <button type="button" onClick={onClose} aria-label="Close Files Library" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted hover:bg-surface-2"><X size={17}/></button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-auto p-3 sm:p-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_170px_180px]">
            <label className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3">
              <Search size={16} className="text-muted"/>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your files…" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/>
            </label>
            <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Filter file type" className="min-h-11 rounded-xl border border-line bg-surface px-3 text-sm">
              {TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <label className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3">
              <FolderOpen size={15} className="shrink-0 text-muted"/>
              <input value={folder} onChange={(event) => setFolder(event.target.value)} placeholder="Filter folder…" aria-label="Filter folder" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-xl border border-line bg-surface p-1">
              <button type="button" onClick={() => setShowTrash(false)} className={"min-h-9 rounded-lg px-3 text-xs font-semibold " + (!showTrash ? "bg-accent/10 text-accent" : "text-muted")}>All files</button>
              <button type="button" onClick={() => setShowTrash(true)} className={"min-h-9 rounded-lg px-3 text-xs font-semibold " + (showTrash ? "bg-accent/10 text-accent" : "text-muted")}>Trash</button>
            </div>
            <button type="button" onClick={() => void load()} className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-fg-secondary hover:bg-surface-2"><RefreshCw size={14}/> Refresh</button>
          </div>

          {notice && <div role="status" className="rounded-xl border border-line bg-surface p-3 text-xs text-fg-secondary">{notice}</div>}
          {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-600"><AlertCircle size={15} className="mt-0.5 shrink-0"/>{error}</div>}

          <section className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="grid grid-cols-[minmax(0,1fr)_100px] gap-3 border-b border-line bg-surface-2 px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-muted sm:grid-cols-[minmax(0,1fr)_110px_120px_150px]">
              <span>File</span><span className="hidden sm:block">Type</span><span className="hidden sm:block">Updated</span><span>Actions</span>
            </div>
            {loading ? <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted"><Loader2 size={17} className="animate-spin"/> Loading your files…</div> :
              files.length === 0 ? <div className="p-10 text-center"><FolderOpen size={30} className="mx-auto text-muted"/><p className="mt-3 text-sm font-semibold">No files found</p><p className="mt-1 text-xs text-muted">Generate an attachment in RevelaAI or import a file from your device.</p></div> :
              <div className="divide-y divide-line">
                {files.map((artifact) => (
                  <div key={artifact.id} className="grid grid-cols-[minmax(0,1fr)_100px] items-center gap-3 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_110px_120px_150px] sm:px-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-accent"><FileIcon type={artifact.type}/></div>
                      <div className="min-w-0 flex-1">
                        {editingId === artifact.id ? <div className="space-y-1.5">
                          <input autoFocus value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} aria-label="File name" className="w-full min-w-0 rounded-lg border border-line bg-input px-2 py-1 text-xs"/>
                          <div className="flex gap-1">
                            <input value={editingFolder} onChange={(event) => setEditingFolder(event.target.value)} aria-label="Folder name" placeholder="Folder (optional)" className="min-w-0 flex-1 rounded-lg border border-line bg-input px-2 py-1 text-xs"/>
                            <button type="button" disabled={Boolean(busy)} onClick={() => void saveMetadata(artifact, { title: editingTitle, folder: editingFolder })} className="rounded-lg bg-accent px-2 text-xs text-white">Save</button>
                          </div>
                        </div> : <p className="truncate text-sm font-semibold">{artifact.title || artifact.filename || "Untitled file"}</p>}
                        <p className="mt-1 truncate text-[11px] text-muted">{fileSize(artifact.size_bytes)} · {artifact.source === "uploaded" ? "Imported file" : "RevelaAI generated"} · v{artifact.version || 1}</p>
                        {artifact.folder && <p className="mt-1 truncate text-[10px] text-muted">Folder: {artifact.folder}</p>}
                      </div>
                    </div>
                    <span className="hidden text-xs text-muted sm:block">{String(artifact.type || "file").replaceAll("_", " ")}</span>
                    <span className="hidden text-xs text-muted sm:block">{artifact.updated_at ? new Date(artifact.updated_at).toLocaleDateString() : "—"}</span>
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      {!showTrash ? <>
                        <button type="button" title="Download original" aria-label="Download original file" disabled={Boolean(busy)} onClick={() => void downloadOriginal(artifact)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-40"><Download size={15}/></button>
                        <button type="button" title="Preview" aria-label="Preview file" onClick={() => onPreview?.(artifact)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"><Eye size={15}/></button>
                        <button type="button" title="Open in Studio" aria-label="Open in Studio" onClick={() => onOpenStudio?.(artifact)} className="flex h-9 w-9 items-center justify-center rounded-lg text-accent hover:bg-accent/10"><Maximize2 size={15}/></button>
                        <button type="button" title="Rename" aria-label="Rename file" onClick={() => { setEditingId(artifact.id); setEditingTitle(artifact.title || ""); setEditingFolder(artifact.folder || ""); }} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2"><Pencil size={14}/></button>
                        <button type="button" title="Move to Trash" aria-label="Move file to Trash" onClick={() => void moveToTrash(artifact)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-rose-500/10 hover:text-rose-600"><Trash2 size={14}/></button>
                      </> : <button type="button" disabled={Boolean(busy)} onClick={() => void restore(artifact)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-line px-2 text-[11px] font-semibold"><RotateCcw size={13}/> Restore</button>}
                    </div>
                  </div>
                ))}
              </div>
            }
          </section>
          <p className="text-[11px] leading-5 text-muted">Imported originals are kept separate from edited versions. Unsupported or complex formatting is shown with an import compatibility warning inside Studio. File access is checked by the RevelaAI service for the signed-in account.</p>
        </div>
      </main>
    </div>
  );
}
