import React, { useEffect, useMemo, useRef, useState } from "react";
import { downloadFile } from "@/components/utils/downloadFile.js";
import { Code2, Database, Eye, History, Download, Share2, RotateCcw, MessageSquare, X, GripVertical, Maximize2 } from "lucide-react";
import {
  downloadRemoteArtifact,
  resolveRevelaAIArtifactUrl,
} from "@/components/utils/saveGeneratedFile";

const MIME_BY_EXTENSION = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  csv: "text/csv",
  txt: "text/plain",
  md: "text/markdown",
  html: "text/html",
  css: "text/css",
  js: "text/javascript",
  ts: "text/typescript",
  json: "application/json",
  sql: "application/sql",
  py: "text/x-python",
  sh: "text/x-shellscript",
  go: "text/x-go",
  rs: "text/x-rust",
  java: "text/x-java",
  cpp: "text/x-c++src",
  cs: "text/x-csharp",
  php: "application/x-httpd-php",
  rb: "text/x-ruby",
  swift: "text/x-swift",
  kt: "text/x-kotlin",
  xml: "application/xml",
  yaml: "application/yaml",
  yml: "application/yaml",
  toml: "application/toml",
  ini: "text/plain",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

const TABS = [["preview", "Preview", Eye], ["data", "Data", Database], ["code", "Code", Code2], ["versions", "Versions", History]];

export default function RevelaAIWorkspacePanel({ artifact, onAskAI, onClose, onOpenStudio }) {
  const [tab, setTab] = useState("preview");
  const [filter, setFilter] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const [visible, setVisible] = useState(true);
  const [panelWidth, setPanelWidth] = useState(440);
  const [downloadError, setDownloadError] = useState("");
  const [downloadStatus, setDownloadStatus] = useState("");
  const [downloading, setDownloading] = useState("");
  const resizeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    setVisible(true);
    setTab("preview");
    setFilter("");
  }, [artifact]);

  useEffect(() => {
    if (!visible) return undefined;
    document.body.dataset.revelaaiWorkspaceOpen = "true";
    window.dispatchEvent(new CustomEvent("revelaai:workspace-opened"));
    const close = () => { setVisible(false); onCloseRef.current?.(); };
    window.addEventListener("revelaai:workspace-request-close", close);
    return () => {
      delete document.body.dataset.revelaaiWorkspaceOpen;
      window.removeEventListener("revelaai:workspace-request-close", close);
      window.dispatchEvent(new CustomEvent("revelaai:workspace-closed"));
    };
  }, [visible]);

  useEffect(() => {
    const move = (event) => {
      if (!resizeRef.current) return;
      const width = Math.max(360, Math.min(640, resizeRef.current.width + resizeRef.current.startX - event.clientX));
      setPanelWidth(width);
    };
    const up = () => { resizeRef.current = null; };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  const data = artifact?.data || artifact?.rows || [];
  const columns = useMemo(() => Array.isArray(data) && data.length && typeof data[0] === "object" ? Object.keys(data[0]) : [], [data]);
  const filteredData = useMemo(() => !filter ? data : data.filter((row) => JSON.stringify(row).toLowerCase().includes(filter.toLowerCase())), [data, filter]);
  const rowHeight = 38;
  const startIndex = Math.min(Math.floor(scrollTop / rowHeight), Math.max(0, filteredData.length - 1));
  const endIndex = Math.min(filteredData.length, startIndex + 24);
  const visibleRows = filteredData.slice(startIndex, endIndex);

  const downloadArtifact = async (url, fileName, mimeType) => {
    if (!url || downloading) return;
    setDownloading(fileName);
    setDownloadError("");
    setDownloadStatus("");
    try {
      const result = await downloadRemoteArtifact(url, { fileName, mimeType });
      setDownloadStatus(
        result.method === "native"
          ? `Download queued in Android Downloads/RevelaCode · ${result.fileName}`
          : `Download opened in browser · ${result.fileName}`
      );
    } catch (error) {
      setDownloadError(String(error?.message || "The generated file could not be downloaded."));
    } finally {
      setDownloading("");
    }
  };

  if (!visible || !artifact) return null;
  const download = artifact.download_url || artifact.url;
  const safeTitle = String(artifact.title || "revelaai-output").replace(/[^a-z0-9_-]+/gi, "-");
  const mainFileName = artifact.filename || `${safeTitle}.${({
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/csv": "csv",
  })[artifact.mime_type] || "pdf"}`;
  let resolvedPreviewUrl = "";
  if (artifact.preview_url) {
    try {
      const previewUrl = new URL(resolveRevelaAIArtifactUrl(artifact.preview_url));
      previewUrl.searchParams.set("inline", "true");
      resolvedPreviewUrl = previewUrl.toString();
    } catch {
      resolvedPreviewUrl = "";
    }
  }

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-[90] flex max-h-[82dvh] flex-col overflow-hidden rounded-t-3xl border border-line bg-popover text-fg shadow-2xl sm:inset-y-16 sm:bottom-4 sm:left-auto sm:right-4 sm:max-h-none sm:rounded-2xl"
      style={{ width: "100%", maxWidth: "min(" + panelWidth + "px, calc(100vw - 2rem))" }}
      data-theme-surface="popover"
      data-demo="revelaai-workspace-panel"
      aria-label="Generated workspace"
      role="complementary"
    >
      <button type="button" aria-label="Resize workspace panel" title="Drag to resize"
        onTouchStart={(event) => { resizeRef.current = { touchY: event.touches[0].clientY, mobile: true }; }}
        onTouchEnd={(event) => {
          if (resizeRef.current?.mobile) {
            const delta = event.changedTouches[0].clientY - resizeRef.current.touchY;
            resizeRef.current = null;
            if (delta > 80) { setVisible(false); onClose?.(); }
          }
        }}
        onPointerDown={(event) => {
          if (window.matchMedia("(max-width: 639px)").matches) return;
          resizeRef.current = { startX: event.clientX, width: panelWidth };
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") setPanelWidth((value) => Math.min(640, value + 20));
          if (event.key === "ArrowRight") setPanelWidth((value) => Math.max(360, value - 20));
        }}
        className="absolute bottom-0 left-0 top-0 z-10 hidden w-5 cursor-col-resize items-center justify-center text-muted hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:flex">
        <GripVertical size={14}/>
      </button>

      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:pl-6">
        <div className="min-w-0">
          <b className="block truncate text-sm">{artifact.title || artifact.filename || "Generated workspace"}</b>
          <span className="text-[11px] text-muted">Output workspace · private by default</span>
        </div>
        <button type="button" onClick={() => { setVisible(false); onClose?.(); }} className="flex h-12 w-12 min-h-12 min-w-12 shrink-0 items-center justify-center rounded-xl text-fg-secondary hover:bg-surface-2"
          aria-label="Close workspace"><X size={17}/></button>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2" aria-label="Workspace tabs">
        {TABS.map(([id, label, Icon]) => (
          <button key={id} type="button" onClick={() => setTab(id)} data-demo={"workspace-tab-" + id}
            aria-pressed={tab === id}
            className={"flex min-h-12 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-semibold " +
              (tab === id ? "bg-accent/12 text-accent" : "text-muted hover:bg-surface-2 hover:text-fg")}>
            <Icon size={14}/>{label}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {tab === "preview" && <div className="space-y-3">
          <p className="text-sm text-fg-secondary">{artifact.description || "Generated by the unified RevelaAI workspace."}</p>
          {artifact.summary && <p className="rounded-xl border border-line bg-surface-2 p-3 text-sm leading-6 text-fg-secondary">{artifact.summary}</p>}
          {artifact.image_url && <figure className="overflow-hidden rounded-xl border border-line bg-surface-2">
            <img src={artifact.image_url} alt={artifact.title || "Generated RevelaAI image"} className="max-h-[55dvh] w-full object-contain"/>
            <figcaption className="p-2 text-xs text-muted">{artifact.image_caption || "Generated visual asset"}</figcaption>
          </figure>}
          {artifact.campaign && <div className="space-y-3 rounded-xl border border-line bg-surface-2 p-3">
            <div><span className="text-[10px] font-bold uppercase tracking-wide text-muted">Campaign headline</span><h3 className="mt-1 text-lg font-black text-fg">{artifact.campaign.headline}</h3></div>
            {artifact.campaign.supporting_message && <p className="text-sm leading-6 text-fg-secondary">{artifact.campaign.supporting_message}</p>}
            {artifact.campaign.social_caption && <div><b className="text-xs text-fg">Social caption</b><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-fg-secondary">{artifact.campaign.social_caption}</p></div>}
            {artifact.campaign.whatsapp_message && <div><b className="text-xs text-fg">WhatsApp message</b><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-fg-secondary">{artifact.campaign.whatsapp_message}</p></div>}
            {artifact.campaign.call_to_action && <div><b className="text-xs text-fg">Call to action</b><p className="mt-1 text-xs text-accent">{artifact.campaign.call_to_action}</p></div>}
            {Array.isArray(artifact.campaign.hashtags) && artifact.campaign.hashtags.length > 0 && <p className="text-xs text-muted">{artifact.campaign.hashtags.join(" ")}</p>}
          </div>}
          {artifact.chart_url && <figure className="overflow-hidden rounded-xl border border-line bg-surface-2 p-2"><img src={artifact.chart_url} alt="Dataset analysis chart" className="w-full object-contain"/><figcaption className="p-2 text-xs text-muted">Deterministic chart from the supplied dataset</figcaption></figure>}
          {artifact.downloads && Object.entries(artifact.downloads).filter(([,url])=>typeof url==="string").length>0 && <div className="flex flex-wrap gap-2">
            {Object.entries(artifact.downloads).filter(([,url])=>typeof url==="string").map(([format,url]) => {
              const extension = String(format).toLowerCase().replace(/^\./, "");
              const fileName = `${safeTitle}.${extension}`;
              return <button key={format} type="button" disabled={Boolean(downloading)}
                onClick={() => downloadArtifact(url, fileName, MIME_BY_EXTENSION[extension] || "application/octet-stream")}
                className="inline-flex min-h-10 items-center rounded-lg border border-line px-3 text-xs font-semibold text-fg-secondary hover:bg-surface-2 disabled:opacity-50">
                {downloading === fileName ? "Preparing…" : `Download ${format.toUpperCase()}`}
              </button>;
            })}
          </div>}
          {artifact.analysis?.columns && <div className="grid grid-cols-2 gap-2">
            {[["Rows",artifact.analysis.row_count],["Columns",artifact.analysis.column_count],["Missing cells",artifact.analysis.missing_cells],["Duplicate rows",artifact.analysis.duplicate_rows],["Completeness",artifact.analysis.completeness_pct == null ? "—" : artifact.analysis.completeness_pct + "%"]].map(([label,value])=><div key={label} className="rounded-xl border border-line bg-surface-2 p-3"><span className="block text-[10px] text-muted">{label}</span><b className="mt-1 block text-base tabular-nums text-fg">{value ?? "—"}</b></div>)}
          </div>}
          {download && <button type="button" disabled={Boolean(downloading)}
            onClick={() => downloadArtifact(download, mainFileName, artifact.mime_type || "application/octet-stream")}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50">
            <Download size={15}/> {downloading === mainFileName ? "Preparing download…" : "Download original"}
          </button>}
          {downloadStatus && <p role="status" className="text-xs text-muted">{downloadStatus}</p>}
          {downloadError && <p role="alert" className="text-xs text-danger">{downloadError}</p>}
          {artifact.preview?.type === "document" && <article className="space-y-3 rounded-xl border border-line bg-white p-4 text-slate-900 sm:p-6">
            <h2 className="text-xl font-bold">{artifact.preview.title || artifact.title}</h2>
            {(artifact.preview.sections || []).map((section, index) => (
              <section key={index} className="space-y-2">
                <h3 className="text-base font-semibold">{section.heading}</h3>
                {(section.paragraphs || []).map((paragraph, paragraphIndex) => <p key={paragraphIndex} className="whitespace-pre-wrap text-sm leading-6">{paragraph}</p>)}
                {(section.tables || []).map((table, tableIndex) => <div key={tableIndex} className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-xs">
                    <thead><tr>{(table.headers || []).map((heading, headingIndex) => <th key={headingIndex} className="border p-2 text-left">{heading}</th>)}</tr></thead>
                    <tbody>{(table.rows || []).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border p-2">{String(cell ?? "")}</td>)}</tr>)}</tbody>
                  </table>
                </div>)}
              </section>
            ))}
          </article>}
          {artifact.preview?.type === "slides" && <div className="space-y-3">
            {(artifact.preview.slides || []).map((slide, index) => <article key={index}
              className="aspect-video rounded-xl border border-line bg-surface-2 p-5 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest text-accent">Slide {index + 1}</span>
              <h3 className="mt-4 text-lg font-bold text-fg sm:text-2xl">{slide.title}</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-fg-secondary">{(slide.bullets || []).map((bullet, itemIndex) => <li key={itemIndex}>{bullet}</li>)}</ul>
              {slide.notes && <details className="mt-3 text-xs text-muted"><summary>Speaker notes</summary><p className="mt-1">{slide.notes}</p></details>}
            </article>)}
          </div>}
          {artifact.preview_url && resolvedPreviewUrl && <>
            <button type="button" disabled={Boolean(downloading)}
              onClick={() => downloadArtifact(artifact.preview_url, artifact.preview_filename || `${safeTitle}-preview.pdf`, artifact.preview_mime_type || "application/pdf")}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm text-fg-secondary disabled:opacity-50">
              Download PDF preview
            </button>
            <iframe title="Generated document preview" src={resolvedPreviewUrl} className="mt-3 h-[45dvh] w-full rounded-xl border border-line bg-white" loading="lazy"/>
          </>}
          {artifact.preview_text && <pre className="whitespace-pre-wrap rounded-xl bg-code p-3 text-xs text-fg-secondary">{artifact.preview_text}</pre>}
        </div>}

        {tab === "data" && <div>
          <input value={filter} onChange={(event) => { setFilter(event.target.value); setScrollTop(0); }}
            placeholder="Filter rows…" aria-label="Filter table rows"
            className="mb-3 min-h-11 w-full rounded-xl border border-line bg-input px-3 text-sm text-fg placeholder:text-muted"/>
          {Array.isArray(data) && data.length > 0 ? <div className="max-h-[42dvh] overflow-auto" onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 bg-surface-2"><tr>{columns.map((key) => <th key={key} className="border-b border-line p-2">{key}</th>)}</tr></thead>
              <tbody>
                <tr aria-hidden="true" style={{ height: startIndex * rowHeight }}><td colSpan={Math.max(columns.length, 1)}/></tr>
                {visibleRows.map((row, index) => <tr key={startIndex + index} className="h-[38px]">
                  {columns.map((key) => <td key={key} className="max-w-[20rem] truncate border-b border-line p-2">{String(row[key] ?? "")}</td>)}
                </tr>)}
                <tr aria-hidden="true" style={{ height: Math.max(0, filteredData.length - endIndex) * rowHeight }}><td colSpan={Math.max(columns.length, 1)}/></tr>
              </tbody>
            </table>
          </div> : <p className="text-sm text-muted">No structured data was returned for this output.</p>}
        </div>}

        {tab === "code" && <pre className="max-h-[42dvh] overflow-auto whitespace-pre-wrap rounded-xl bg-code p-3 text-xs text-fg-secondary">{artifact.code || "No source code was attached to this output."}</pre>}
        {tab === "versions" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div><h3 className="text-sm font-bold text-fg">Version history</h3><p className="mt-1 text-xs text-muted">Each saved edit is kept as an immutable version.</p></div>
              <span className="rounded-full border border-line px-2 py-1 text-[10px] font-semibold text-muted">Current v{Number(artifact.version || 1)}</span>
            </div>
            {(artifact.version_history || []).length ? (artifact.version_history || []).map((version) => (
              <div key={version.version} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 p-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-fg">Version {version.version} {version.active ? "· Current" : ""}</p>
                  <p className="mt-1 text-[11px] text-muted">{version.created_at ? new Date(version.created_at).toLocaleString() : "Date unavailable"}</p>
                  <p className="mt-1 truncate text-[10px] text-muted">{(version.formats || []).join(" · ")}</p>
                </div>
                {version.active && <span className="rounded-full bg-accent/10 px-2 py-1 text-[10px] font-bold text-accent">Active</span>}
              </div>
            )) : <p className="text-sm text-muted">The first saved version is ready. Future saves will appear here.</p>}
            {onOpenStudio && <button type="button" onClick={onOpenStudio} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-xs font-semibold text-fg-secondary hover:bg-surface-2"><Maximize2 size={14}/> Manage versions in Studio</button>}
          </div>
        )}
      </div>

      <footer className="flex flex-wrap gap-2 border-t border-line p-3">
        {onOpenStudio && <button type="button" onClick={onOpenStudio} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-3 text-xs font-semibold text-white hover:bg-accent-hover">
          <Maximize2 size={14}/> Open in Studio
        </button>}
        <button type="button" onClick={onAskAI} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-accent/30 px-3 text-xs font-semibold text-accent hover:bg-accent/10">
          <MessageSquare size={14}/> Ask AI to change this
        </button>
        {download && <button type="button" onClick={() => navigator.clipboard?.writeText(download)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-xs text-fg-secondary hover:bg-surface-2">
          <Share2 size={14}/> Copy link
        </button>}
        <button type="button" onClick={() => setTab("versions")}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-xs text-fg-secondary hover:bg-surface-2">
          <RotateCcw size={14}/> History
        </button>
      </footer>
    </aside>
  );
}
