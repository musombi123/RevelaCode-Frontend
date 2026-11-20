import React, { useEffect, useState } from "react";
import {
  Check, Download, ExternalLink, Eye, FileText, Image as ImageIcon,
  Link2, Loader2, Maximize2, MessageCircle, Redo2, Share2, Sparkles,
  Undo2, X,
} from "lucide-react";
import {
  downloadRemoteArtifact,
  resolveRevelaAIArtifactUrl,
} from "@/components/utils/saveGeneratedFile";

const SAFE_FORMATS = new Set([
  "PDF", "PNG", "JPG", "JPEG", "SVG", "PPTX", "DOCX", "XLSX", "CSV", "GIF", "MP4",
  "TXT", "MD", "JS", "JSX", "TS", "TSX", "PY", "HTML", "CSS", "JSON", "SQL",
  "SH", "GO", "RS", "JAVA", "C", "CPP", "CS", "PHP", "RB", "SWIFT", "KT",
]);

function artifactUrl(value) {
  try {
    return resolveRevelaAIArtifactUrl(value);
  } catch {
    return "";
  }
}

function canvaUrl(value) {
  const valueText = String(value || "").trim();
  return /^https:\/\/www\.canva\.com\//i.test(valueText) ? valueText : "";
}

export default function ArtifactResultCard({ artifact, onAction }) {
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [mode, setMode] = useState(artifact?.edit_mode === "guide_me" ? "guide_me" : "do_it_for_me");
  const [localProposal, setLocalProposal] = useState(null);

  useEffect(() => {
    setLocalProposal(artifact?.pending_edit || null);
    if (artifact?.edit_mode) setMode(artifact.edit_mode);
  }, [artifact?.pending_edit, artifact?.edit_mode]);

  if (!artifact?.id || !artifact?.download_url) return null;

  const title = String(artifact.title || "RevelaAI artifact");
  const type = String(artifact.type || "other");
  const formats = Array.isArray(artifact.formats)
    ? artifact.formats.map((value) => String(value).toUpperCase()).filter((value) => SAFE_FORMATS.has(value))
    : [];
  const primaryFormatFromFilename = String(artifact.filename || "").match(/\\.([a-z0-9]+)$/i)?.[1]?.toUpperCase() || "";
  const defaultDownloadFormat = formats.includes(primaryFormatFromFilename)
    ? primaryFormatFromFilename
    : formats[0] || "file";
  const exports = artifact.format_downloads && typeof artifact.format_downloads === "object"
    ? artifact.format_downloads
    : {};
  const preview = artifact.preview && typeof artifact.preview === "object" ? artifact.preview : {};
  const formatMetadata = preview.format_metadata && typeof preview.format_metadata === "object" ? preview.format_metadata : {};
  const sizeLabel = String(preview.size_label || formatMetadata.size_label || "");
  const canvaEditUrl = canvaUrl(artifact.canva_edit_url);
  const previewUrl = artifactUrl(artifact.preview_url);
  const editState = String(artifact.edit_state || "idle");
  const canvaStatus = String(artifact.canva_status || (canvaEditUrl ? "success" : "not_connected"));
  const pending = localProposal || artifact.pending_edit || null;

  const runAction = async (name, extra = {}) => {
    if (busy) return null;
    setBusy(name);
    setError("");
    setNotice("");
    try {
      const result = await onAction?.(name, artifact, extra);
      if (result?.artifact) {
        setLocalProposal(result.artifact.pending_edit || null);
      }
      if (result?.proposal) setLocalProposal(result.proposal);
      if (result?.message) setNotice(result.message);
      if (name === "share") {
        const shareUrl = artifactUrl(artifact.download_url);
        if (!shareUrl) throw new Error("The artifact link is not valid.");
        const shareText = [title, shareUrl].filter(Boolean).join("\n");
        if (navigator.share) await navigator.share({ title, text: shareText, url: shareUrl });
        else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareUrl);
          setNotice("Artifact link copied.");
        }
      }
      return result || null;
    } catch (actionError) {
      setError(String(actionError?.message || "That artifact action could not be completed."));
      return null;
    } finally {
      setBusy("");
    }
  };

  const download = async (format, url) => {
    const candidate = url || artifact.download_url;
    if (!artifactUrl(candidate)) return;
    setBusy("download:" + format);
    setError("");
    setNotice("");
    try {
      // Renew the signed URL before each download so cards remain useful after 24 hours.
      const refreshed = await onAction?.("refresh_export", artifact, { format });
      const downloadUrl = artifactUrl(refreshed?.download_url || candidate);
      if (!downloadUrl) throw new Error("RevelaAI did not return a valid signed download link.");
      const extension = String(format || "file").toLowerCase();
      const fileName = title.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-|-$/g, "") + "." + extension;
      const result = await downloadRemoteArtifact(downloadUrl, { fileName });
      setNotice(result.method === "native" ? "Saved to Downloads/RevelaCode." : "Download started.");
    } catch (downloadError) {
      setError(String(downloadError?.message || "Download failed."));
    } finally {
      setBusy("");
    }
  };

  const runEditProposal = async () => {
    const requestText = String(instruction || "").trim();
    if (!requestText) {
      setError("Describe the one change you want RevelaAI to propose.");
      return;
    }
    const result = await runAction("propose_edit", { instruction: requestText, mode });
    if (result?.proposal) setLocalProposal(result.proposal);
    if (result?.artifact?.pending_edit) setLocalProposal(result.artifact.pending_edit);
  };

  const confirmProposal = async () => {
    if (!pending?.proposal_id) return;
    const result = await runAction("confirm_edit", {
      proposalId: pending.proposal_id,
      expectedVersion: Number(pending.base_version || artifact.version || 1),
    });
    if (result?.artifact) setLocalProposal(null);
    setInstruction("");
  };

  const previewIsImage = /\.(?:png|jpe?g|gif|svg)(?:[?#]|$)/i.test(previewUrl)
    || type === "image" || type === "banner" || type === "logo";
  const editingByUser = editState === "user_editing";

  return (
    <section className="my-4 w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface shadow-sm" data-demo="revelaai-artifact-card" aria-label="Generated artifact">
      <header className="flex items-start gap-3 border-b border-line bg-surface-2 px-3 py-3 sm:px-4">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          {type === "image" || type === "banner" || type === "logo" ? <ImageIcon size={17}/> : <FileText size={17}/>}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-fg">{title}</h3>
          <p className="mt-0.5 text-[11px] text-muted">
            {type.replaceAll("_", " ")} · Version {Number(artifact.version || 1)} · {formats.join(" · ")}
          </p>
          {sizeLabel && <p className="mt-1 break-words text-[10px] leading-4 text-muted">Output size: {sizeLabel}</p>}
        </div>
        <span className="shrink-0 rounded-full border border-line px-2 py-1 text-[10px] font-semibold text-muted">
          {editingByUser ? "In editor" : editState === "ai_editing" ? "AI proposal" : "Saved"}
        </span>
      </header>

      {previewUrl && (
        <div className="border-b border-line bg-surface-2 p-2">
          {previewIsImage ? (
            <img src={previewUrl} alt={title + " preview"} loading="lazy" className="mx-auto max-h-64 w-full rounded-lg object-contain"/>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-fg-secondary">
              <FileText size={15} className="text-accent"/>
              <span>Preview available as {formats.includes("PDF") ? "PDF" : formats[0] || "file"}</span>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-accent underline">Open preview</a>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
        <button type="button" onClick={() => download(defaultDownloadFormat, artifact.download_url)} disabled={Boolean(busy)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-3 text-xs font-bold text-white hover:bg-accent-hover disabled:opacity-50">
          {busy === "download:" + defaultDownloadFormat ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
          Download
        </button>

        <button type="button" onClick={() => void runAction("preview")} disabled={Boolean(busy)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-xs font-semibold text-fg-secondary hover:bg-surface-2 disabled:opacity-50">
          <Eye size={14}/> Preview
        </button>

        <button type="button" onClick={() => void runAction("open_studio")} disabled={Boolean(busy)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-accent/30 px-3 text-xs font-semibold text-accent hover:bg-accent/10 disabled:opacity-50">
          <Maximize2 size={14}/> Open in Studio
        </button>

        <button type="button"
          onClick={() => void runAction(canvaEditUrl ? "open_canva" : canvaStatus === "in_progress" ? "poll_canva" : "connect_canva")}
          disabled={Boolean(busy)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-xs font-semibold text-fg-secondary hover:bg-surface-2 disabled:opacity-50">
          {busy === "open_canva" || busy === "connect_canva" || busy === "poll_canva" ? <Loader2 size={14} className="animate-spin"/> : canvaEditUrl ? <ExternalLink size={14}/> : <Link2 size={14}/>}
          {canvaEditUrl ? "Open in Canva" : canvaStatus === "in_progress" ? "Check Canva import" : canvaStatus === "success" ? "Refresh Canva link" : "Connect Canva"}
        </button>

        {!editingByUser && (
          <button type="button" onClick={() => setEditOpen((value) => !value)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-accent/30 px-3 text-xs font-semibold text-accent hover:bg-accent/10">
            <Sparkles size={14}/> Edit with AI
          </button>
        )}

        <button type="button" onClick={() => void runAction("share")} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-xs font-semibold text-fg-secondary hover:bg-surface-2">
          <Share2 size={14}/> Share
        </button>
      </div>

      {editingByUser && (
        <div className="border-t border-line px-3 py-3 sm:px-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted">You’re editing this artifact. AI changes are paused.</span>
            <button type="button" onClick={() => void runAction("editor_help")} className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[11px] font-semibold text-fg-secondary">
              <MessageCircle size={13}/> Need help?
            </button>
          </div>
          <button type="button" disabled={Boolean(busy)} onClick={() => void runAction("return_from_editor")}
            className="mt-3 min-h-9 rounded-lg bg-surface-2 px-3 text-xs font-semibold text-fg-secondary hover:bg-surface-3 disabled:opacity-50">
            I’m back in chat
          </button>
        </div>
      )}

      {artifact.review_due && !editingByUser && (
        <div className="border-t border-line px-3 py-3 sm:px-4">
          <button type="button" onClick={() => void runAction("review_changes")}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-accent/30 px-3 text-xs font-semibold text-accent hover:bg-accent/10">
            <MessageCircle size={14}/> Want me to review what you changed?
          </button>
        </div>
      )}

      {editOpen && !editingByUser && (
        <div className="border-t border-line px-3 py-3 sm:px-4">
          {pending ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-xs font-bold text-fg">One proposed change</h4>
                <span className="text-[10px] text-muted">Version {pending.base_version}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-surface-2 p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted">Before</p>
                  <p className="whitespace-pre-wrap break-words text-xs text-fg-secondary">{String(pending.before ?? "")}</p>
                </div>
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-accent">After</p>
                  <p className="whitespace-pre-wrap break-words text-xs text-fg">{String(pending.after ?? "")}</p>
                </div>
              </div>
              {pending.rationale && <p className="text-xs text-muted">{pending.rationale}</p>}
              {mode === "guide_me" && pending.guide && (
                <p className="rounded-xl border border-line bg-surface-2 p-3 text-xs leading-5 text-fg-secondary">{pending.guide}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={Boolean(busy)} onClick={() => void confirmProposal()}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent px-3 text-xs font-bold text-white disabled:opacity-50">
                  {busy === "confirm_edit" ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>}
                  Apply this change
                </button>
                <button type="button" disabled={Boolean(busy)} onClick={() => void runAction("cancel_edit")}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line px-3 text-xs font-semibold text-fg-secondary disabled:opacity-50">
                  <X size={14}/> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-xs font-bold text-fg">What should change?</h4>
                <div className="flex rounded-lg border border-line p-0.5">
                  <button type="button" onClick={() => setMode("guide_me")} aria-pressed={mode === "guide_me"}
                    className={"rounded-md px-2.5 py-1.5 text-[10px] font-semibold " + (mode === "guide_me" ? "bg-accent/10 text-accent" : "text-muted")}>
                    Guide me
                  </button>
                  <button type="button" onClick={() => setMode("do_it_for_me")} aria-pressed={mode === "do_it_for_me"}
                    className={"rounded-md px-2.5 py-1.5 text-[10px] font-semibold " + (mode === "do_it_for_me" ? "bg-accent/10 text-accent" : "text-muted")}>
                    Do it for me
                  </button>
                </div>
              </div>
              <textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} rows={2} maxLength={2400}
                placeholder="Describe one change, for example: make the title clearer."
                className="w-full resize-y rounded-xl border border-line bg-surface px-3 py-2 text-xs text-fg placeholder:text-muted focus:border-accent focus:outline-none"/>
              <button type="button" disabled={Boolean(busy) || !instruction.trim()} onClick={() => void runEditProposal()}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent px-3 text-xs font-bold text-white disabled:opacity-50">
                {busy === "propose_edit" ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                Propose one change
              </button>
              <p className="text-[10px] leading-4 text-muted">RevelaAI shows the before and after first. Your file changes only after you confirm.</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-2 sm:px-4">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-muted">Versions</span>
        <button type="button" disabled={!artifact.can_undo || Boolean(busy)} onClick={() => void runAction("undo_version")}
          className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-line px-2.5 text-[10px] font-semibold text-fg-secondary disabled:opacity-40">
          <Undo2 size={12}/> Undo
        </button>
        <button type="button" disabled={!artifact.can_redo || Boolean(busy)} onClick={() => void runAction("redo_version")}
          className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-line px-2.5 text-[10px] font-semibold text-fg-secondary disabled:opacity-40">
          <Redo2 size={12}/> Redo
        </button>
        <div className="ml-auto flex min-w-0 flex-wrap items-center gap-1.5">
          {sizeLabel && <span className="mr-1 max-w-full text-[10px] text-muted">Size: {sizeLabel}</span>}
          {formats.length > 0 && <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-muted">Export</span>}
          {formats.map((format) => {
            const url = exports[format] || (format === formats[0] ? artifact.download_url : "");
            if (!artifactUrl(url)) return null;
            return (
              <button key={format} type="button" disabled={Boolean(busy)} onClick={() => download(format, url)}
                className="min-h-8 rounded-lg border border-line px-2.5 text-[10px] font-bold text-fg-secondary hover:bg-surface-2 disabled:opacity-50">
                {format}
              </button>
            );
          })}
        </div>
      </div>

      {(notice || error) && (
        <p role={error ? "alert" : "status"} className={"border-t border-line px-3 py-2 text-[11px] " + (error ? "text-danger" : "text-muted")}>
          {error || notice}
        </p>
      )}
    </section>
  );
}
