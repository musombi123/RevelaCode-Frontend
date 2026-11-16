import React, { useState } from "react";
import { Download, ExternalLink, FileText, Image as ImageIcon, Link2, PencilLine, Share2, Sparkles, Loader2 } from "lucide-react";
import { downloadRemoteArtifact, resolveRevelaAIArtifactUrl } from "@/components/utils/saveGeneratedFile";

const SAFE_FORMATS = new Set(["PDF", "PNG", "JPG", "JPEG", "SVG", "PPTX", "DOCX", "XLSX", "CSV", "GIF", "MP4"]);

function safeUrl(value) {
  const text = String(value || "").trim();
  return /^https?:\/\//i.test(text) ? text : "";
}

export default function ArtifactResultCard({ artifact, onAction }) {
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  if (!artifact?.id || !artifact?.download_url) return null;

  const title = String(artifact.title || "RevelaAI artifact");
  const type = String(artifact.type || "other");
  const formats = Array.isArray(artifact.formats)
    ? artifact.formats.map((value) => String(value).toUpperCase()).filter((value) => SAFE_FORMATS.has(value))
    : [];
  const exports = artifact.format_downloads && typeof artifact.format_downloads === "object"
    ? artifact.format_downloads
    : {};
  const previewUrl = safeUrl(artifact.preview_url);
  const canvaUrl = safeUrl(artifact.canva_edit_url);

  const runAction = async (name, extra = {}) => {
    if (busy) return;
    setBusy(name);
    setError("");
    setNotice("");
    try {
      const result = await onAction?.(name, artifact, extra);
      if (result?.message) setNotice(result.message);
      if (result?.artifact) {
        // The caller owns chat state; this component never mutates the artifact record itself.
      }
      if (name === "share") {
        const shareText = [title, artifact.download_url].filter(Boolean).join("\n");
        if (navigator.share) await navigator.share({ title, text: shareText, url: artifact.download_url });
        else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(artifact.download_url);
          setNotice("Artifact link copied.");
        }
      }
    } catch (actionError) {
      setError(String(actionError?.message || "That artifact action could not be completed."));
    } finally {
      setBusy("");
    }
  };

  const download = async (format, url) => {
    const resolved = safeUrl(url);
    if (!resolved) return;
    setBusy("download:" + format);
    setError("");
    setNotice("");
    try {
      const fileName = title.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-|-$/g, "") + "." + format.toLowerCase();
      const result = await downloadRemoteArtifact(resolveRevelaAIArtifactUrl(resolved), { fileName });
      setNotice(result.method === "native" ? "Saved to Downloads/RevelaCode." : "Download started.");
    } catch (downloadError) {
      try {
        window.open(resolveRevelaAIArtifactUrl(resolved), "_blank", "noopener,noreferrer");
        setNotice("Opened the signed download link in a new tab.");
      } catch {
        setError(String(downloadError?.message || "Download failed."));
      }
    } finally {
      setBusy("");
    }
  };

  const previewIsImage = /\.(?:png|jpe?g|gif|svg)(?:[?#]|$)/i.test(previewUrl) || type === "image" || type === "banner" || type === "logo";
  const canvaStatus = String(artifact.canva_status || (canvaUrl ? "success" : "not_connected"));

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
        </div>
        <span className="shrink-0 rounded-full border border-line px-2 py-1 text-[10px] font-semibold text-muted">Saved</span>
      </header>

      {previewUrl && (
        <div className="border-b border-line bg-surface-2 p-2">
          {previewIsImage ? (
            <img src={resolveRevelaAIArtifactUrl(previewUrl)} alt={title + " preview"} loading="lazy" className="mx-auto max-h-64 w-full rounded-lg object-contain"/>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-fg-secondary">
              <FileText size={15} className="text-accent"/>
              <span>Preview available as {formats.includes("PDF") ? "PDF" : formats[0] || "file"}</span>
              <a href={resolveRevelaAIArtifactUrl(previewUrl)} target="_blank" rel="noopener noreferrer" className="ml-auto text-accent underline">Open preview</a>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
        <button type="button" onClick={() => download(formats[0] || "file", artifact.download_url)} disabled={Boolean(busy)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-3 text-xs font-bold text-white hover:bg-accent-hover disabled:opacity-50">
          {busy === "download:" + (formats[0] || "file") ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
          Download
        </button>

        {canvaUrl ? (
          <a href={canvaUrl} target="_blank" rel="noopener noreferrer" onClick={() => { void runAction("open_canva"); }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-xs font-semibold text-fg-secondary hover:bg-surface-2">
            <ExternalLink size={14}/> Open in Canva
          </a>
        ) : (
          <button type="button" onClick={() => void runAction(canvaStatus === "in_progress" ? "poll_canva" : "connect_canva")}
            disabled={Boolean(busy)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-xs font-semibold text-fg-secondary hover:bg-surface-2 disabled:opacity-50">
            {busy === "connect_canva" || busy === "poll_canva" ? <Loader2 size={14} className="animate-spin"/> : <Link2 size={14}/>}
            {canvaStatus === "in_progress" ? "Check Canva import" : "Connect Canva"}
          </button>
        )}

        <button type="button" onClick={() => void runAction("edit_with_ai")} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-accent/30 px-3 text-xs font-semibold text-accent hover:bg-accent/10">
          <Sparkles size={14}/> Edit with AI
        </button>
        <button type="button" onClick={() => void runAction("share")} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-xs font-semibold text-fg-secondary hover:bg-surface-2">
          <Share2 size={14}/> Share
        </button>
      </div>

      {formats.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-2 sm:px-4">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-muted">Export</span>
          {formats.map((format) => {
            const url = safeUrl(exports[format] || (format === formats[0] ? artifact.download_url : ""));
            if (!url) return null;
            return <button key={format} type="button" disabled={Boolean(busy)} onClick={() => download(format, url)}
              className="min-h-9 rounded-lg border border-line px-2.5 text-[10px] font-bold text-fg-secondary hover:bg-surface-2 disabled:opacity-50">
              {format}
            </button>;
          })}
        </div>
      )}

      {(notice || error) && (
        <p role={error ? "alert" : "status"} className={"border-t border-line px-3 py-2 text-[11px] " + (error ? "text-danger" : "text-muted")}>
          {error || notice}
        </p>
      )}
    </section>
  );
}
