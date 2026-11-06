import React, { useEffect, useMemo, useRef, useState } from "react";
import { Code2, Database, Eye, History, Download, Share2, RotateCcw, MessageSquare, X, GripVertical } from "lucide-react";

const TABS = [["preview", "Preview", Eye], ["data", "Data", Database], ["code", "Code", Code2], ["versions", "Versions", History]];

export default function RevelaAIWorkspacePanel({ artifact, onAskAI }) {
  const [tab, setTab] = useState("preview");
  const [filter, setFilter] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const [visible, setVisible] = useState(true);
  const [panelWidth, setPanelWidth] = useState(440);
  const resizeRef = useRef(null);

  useEffect(() => {
    if (!visible) return undefined;
    document.body.dataset.revelaaiWorkspaceOpen = "true";
    window.dispatchEvent(new CustomEvent("revelaai:workspace-opened"));
    const close = () => setVisible(false);
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

  if (!visible || !artifact) return null;
  const download = artifact.download_url || artifact.url;

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
            if (delta > 80) setVisible(false);
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
        <button type="button" onClick={() => setVisible(false)} className="flex h-12 w-12 min-h-12 min-w-12 shrink-0 items-center justify-center rounded-xl text-fg-secondary hover:bg-surface-2"
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
          <p className="text-sm text-fg-secondary">{artifact.description || "Preview is available through the generated file link."}</p>
          {download && <a href={download} target="_blank" rel="noreferrer"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover">
            <Download size={15}/> Download original
          </a>}
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
          {artifact.preview_url && <>
            <a href={artifact.preview_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm text-fg-secondary">Open PDF preview</a>
            <iframe title="Generated document preview" src={artifact.preview_url} className="mt-3 h-[45dvh] w-full rounded-xl border border-line bg-white" loading="lazy"/>
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
        {tab === "versions" && <p className="text-sm text-muted">Version history is not yet available for this artifact type.</p>}
      </div>

      <footer className="flex flex-wrap gap-2 border-t border-line p-3">
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
