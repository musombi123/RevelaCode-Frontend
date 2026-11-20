import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ChevronDown, Download, FileDown, FileText, History,
  Image as ImageIcon, Plus, Redo2, Save, Sparkles, Undo2,
} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import {
  exportRevelaAIArtifact,
  getRevelaAIArtifact,
  saveRevelaAIArtifactSource,
} from "@/ai/revelaAIClient.js";
import {
  downloadRemoteArtifact,
  resolveRevelaAIArtifactUrl,
} from "@/components/utils/saveGeneratedFile";

const clone = (value) => JSON.parse(JSON.stringify(value ?? {}));

function codeExtension(language) {
  const value = String(language || "").toLowerCase();
  if (["js", "jsx", "ts", "tsx", "javascript", "typescript"].includes(value)) {
    return javascript({ jsx: value.includes("x"), typescript: value.startsWith("ts") || value === "typescript" });
  }
  if (value === "py" || value === "python") return python();
  if (value === "html") return html();
  if (value === "css") return css();
  return [];
}

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function DocumentEditor({ payload, onChange }) {
  const sections = Array.isArray(payload.sections) ? payload.sections : [];

  const updateSection = (index, patch) => onChange({
    ...payload,
    sections: sections.map((section, itemIndex) => itemIndex === index ? { ...section, ...patch } : section),
  });

  const updateParagraph = (sectionIndex, paragraphIndex, value) => {
    const section = sections[sectionIndex] || {};
    if (Array.isArray(section.blocks)) {
      const targetBlockIndex = section.blocks
        .map((block, index) => ({ block, index }))
        .filter(({ block }) => block?.type === "paragraph")[paragraphIndex]?.index;
      if (targetBlockIndex == null) return;
      updateOrderedBlock(sectionIndex, targetBlockIndex, { text: value });
      return;
    }
    const paragraphs = [...(section.paragraphs || [])];
    paragraphs[paragraphIndex] = value;
    updateSection(sectionIndex, { paragraphs });
  };

  const updateOrderedBlock = (sectionIndex, blockIndex, patch) => {
    const section = sections[sectionIndex] || {};
    const blocks = [...(section.blocks || [])];
    blocks[blockIndex] = { ...blocks[blockIndex], ...patch };
    updateSection(sectionIndex, { blocks });
  };

  const updateTable = (sectionIndex, tableIndex, updater) => {
    const section = sections[sectionIndex] || {};
    const tables = (section.tables || []).map((table, index) => index === tableIndex ? updater(table) : table);
    updateSection(sectionIndex, { tables });
  };

  const updateTableBlock = (sectionIndex, blockIndex, updater) => {
    const section = sections[sectionIndex] || {};
    const blocks = (section.blocks || []).map((block, index) =>
      index === blockIndex ? updater(block) : block
    );
    updateSection(sectionIndex, { blocks });
  };

  const updateTableHeader = (sectionIndex, tableIndex, columnIndex, value) => updateTable(
    sectionIndex, tableIndex, (table) => {
      const headers = [...(table.headers || [])];
      headers[columnIndex] = value;
      return { ...table, headers };
    }
  );

  const updateTableCell = (sectionIndex, tableIndex, rowIndex, columnIndex, value) => updateTable(
    sectionIndex, tableIndex, (table) => {
      const rows = (table.rows || []).map((row) => [...row]);
      if (!rows[rowIndex]) rows[rowIndex] = [];
      rows[rowIndex][columnIndex] = value;
      return { ...table, rows };
    }
  );

  const updateTableBlockHeader = (sectionIndex, blockIndex, columnIndex, value) => updateTableBlock(
    sectionIndex, blockIndex, (table) => {
      const headers = [...(table.headers || [])];
      headers[columnIndex] = value;
      return { ...table, headers };
    }
  );

  const updateTableBlockCell = (sectionIndex, blockIndex, rowIndex, columnIndex, value) => updateTableBlock(
    sectionIndex, blockIndex, (table) => {
      const rows = (table.rows || []).map((row) => [...row]);
      if (!rows[rowIndex]) rows[rowIndex] = [];
      rows[rowIndex][columnIndex] = value;
      return { ...table, rows };
    }
  );

  const addParagraph = (sectionIndex) => {
    const section = sections[sectionIndex] || {};
    if (Array.isArray(section.blocks)) {
      updateSection(sectionIndex, {
        blocks: [...section.blocks, { type: "paragraph", text: "" }],
      });
    } else {
      updateSection(sectionIndex, { paragraphs: [...(section.paragraphs || []), ""] });
    }
  };

  const addTableRow = (sectionIndex, tableIndex) => updateTable(
    sectionIndex, tableIndex, (table) => ({
      ...table,
      rows: [...(table.rows || []), (table.headers || []).map(() => "")],
    })
  );

  const addTableBlockRow = (sectionIndex, blockIndex) => updateTableBlock(
    sectionIndex, blockIndex, (table) => ({
      ...table,
      rows: [...(table.rows || []), (table.headers || []).map(() => "")],
    })
  );

  const addTable = (sectionIndex) => {
    const section = sections[sectionIndex] || {};
    const table = { headers: ["Column 1", "Column 2"], rows: [["", ""]] };
    if (Array.isArray(section.blocks)) {
      updateSection(sectionIndex, { blocks: [...section.blocks, { type: "table", ...table }] });
    } else {
      updateSection(sectionIndex, { tables: [...(section.tables || []), table] });
    }
  };

  const addSection = () => onChange({
    ...payload,
    sections: [...sections, {
      heading: "New section",
      level: 1,
      paragraphs: [],
      tables: [],
      blocks: [{ type: "paragraph", text: "" }],
    }],
  });

  const renderTable = (table, sectionIndex, tableIndex, ordered = false) => {
    const updateHeader = ordered ? updateTableBlockHeader : updateTableHeader;
    const updateCell = ordered ? updateTableBlockCell : updateTableCell;
    const addRow = ordered ? addTableBlockRow : addTableRow;
    return (
      <div key={(ordered ? "block-" : "table-") + tableIndex} className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr>{(table.headers || []).map((header, columnIndex) => (
              <th key={columnIndex} className="border-b border-r border-slate-200 bg-slate-50 p-1">
                <input value={header ?? ""} onChange={(event) => updateHeader(sectionIndex, tableIndex, columnIndex, event.target.value)}
                  aria-label={"Section " + (sectionIndex + 1) + " table " + (tableIndex + 1) + " column " + (columnIndex + 1) + " heading"}
                  className="w-full min-w-28 bg-transparent px-2 py-2 text-left font-bold text-slate-800 outline-none"/>
              </th>
            ))}</tr>
          </thead>
          <tbody>
            {(table.rows || []).map((row, rowIndex) => (
              <tr key={rowIndex}>{(table.headers || []).map((_, columnIndex) => (
                <td key={columnIndex} className="border-b border-r border-slate-200 p-0">
                  <input value={row?.[columnIndex] == null ? "" : String(row[columnIndex])}
                    onChange={(event) => updateCell(sectionIndex, tableIndex, rowIndex, columnIndex, event.target.value)}
                    aria-label={"Section " + (sectionIndex + 1) + " table " + (tableIndex + 1) + " row " + (rowIndex + 1) + " column " + (columnIndex + 1)}
                    className="w-full min-w-28 bg-transparent px-2 py-2 text-slate-700 outline-none focus:bg-blue-50/50"/>
                </td>
              ))}</tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">
          <button type="button" onClick={() => addRow(sectionIndex, tableIndex)} className="text-xs font-semibold text-blue-700 hover:underline">+ Add table row</button>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[850px] space-y-4">
      <article className="min-h-[700px] rounded-lg border border-slate-200 bg-white p-6 text-slate-900 shadow-sm sm:p-10">
        <input value={payload.title || ""} onChange={(event) => onChange({ ...payload, title: event.target.value })}
          aria-label="Document title" className="mb-7 w-full border-0 border-b border-slate-200 bg-transparent pb-3 text-2xl font-bold outline-none focus:border-blue-500 sm:text-3xl"/>
        {sections.map((section, index) => (
          <section key={index} className="mb-6 space-y-3">
            <input value={section.heading || ""} onChange={(event) => updateSection(index, { heading: event.target.value })}
              aria-label={"Section " + (index + 1) + " heading"} placeholder="Section heading"
              className="w-full border-0 border-b border-slate-100 bg-transparent py-1 text-lg font-semibold outline-none focus:border-blue-500"/>

            {Array.isArray(section.blocks) ? (
              section.blocks.map((block, blockIndex) => block?.type === "table" ? (
                renderTable(block, index, blockIndex, true)
              ) : (
                <textarea key={"paragraph-" + blockIndex} value={block?.text || ""}
                  onChange={(event) => updateParagraph(index,
                    section.blocks.slice(0, blockIndex + 1).filter((item) => item?.type === "paragraph").length - 1,
                    event.target.value)}
                  aria-label={"Section " + (index + 1) + " paragraph block " + (blockIndex + 1)}
                  rows={Math.max(2, Math.min(8, String(block?.text || "").split("\n").length + 1))}
                  placeholder="Write your paragraph…"
                  className="w-full resize-y border-0 bg-transparent text-[15px] leading-7 text-slate-700 outline-none focus:bg-blue-50/40"/>
              ))
            ) : (
              <>
                {(section.paragraphs || []).map((paragraph, paragraphIndex) => (
                  <textarea key={paragraphIndex} value={paragraph || ""}
                    onChange={(event) => updateParagraph(index, paragraphIndex, event.target.value)}
                    aria-label={"Section " + (index + 1) + " paragraph " + (paragraphIndex + 1)}
                    rows={Math.max(2, Math.min(8, String(paragraph || "").split("\n").length + 1))}
                    placeholder="Write your paragraph…"
                    className="w-full resize-y border-0 bg-transparent text-[15px] leading-7 text-slate-700 outline-none focus:bg-blue-50/40"/>
                ))}
                {(section.tables || []).map((table, tableIndex) => renderTable(table, index, tableIndex))}
              </>
            )}

            <button type="button" onClick={() => addParagraph(index)} className="text-xs font-semibold text-blue-700 hover:underline">+ Add paragraph</button>
            <button type="button" onClick={() => addTable(index)} className="text-xs font-semibold text-blue-700 hover:underline">+ Add table</button>
          </section>
        ))}
        <button type="button" onClick={addSection} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-700">
          <Plus size={14}/> Add section
        </button>
      </article>
    </div>
  );
}

function ImageEditor({ payload, onChange, previewUrl }) {
  const transform = payload.transform || {
    rotation: 0, brightness: 100, contrast: 100, saturation: 100,
    grayscale: 0, flip_x: false, flip_y: false,
  };
  const update = (patch) => onChange({ ...payload, transform: { ...transform, ...patch } });
  const filter = [
    "brightness(" + Number(transform.brightness ?? 100) + "%)",
    "contrast(" + Number(transform.contrast ?? 100) + "%)",
    "saturate(" + Number(transform.saturation ?? 100) + "%)",
    "grayscale(" + Number(transform.grayscale ?? 0) + "%)",
  ].join(" ");
  const imageTransform = "rotate(" + Number(transform.rotation ?? 0) + "deg) scaleX(" + (transform.flip_x ? -1 : 1) + ") scaleY(" + (transform.flip_y ? -1 : 1) + ")";
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-line bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%),linear-gradient(45deg,#e5e7eb_25%,#fff_25%,#fff_75%,#e5e7eb_75%)] bg-[length:24px_24px] bg-[position:0_0,12px_12px] p-5">
        {previewUrl ? <img src={previewUrl} alt="Image editing preview" className="max-h-[58vh] max-w-full object-contain shadow-xl"
          style={{ filter, transform: imageTransform, transformOrigin: "center" }}/> :
          <p className="text-sm text-muted">Image preview is unavailable.</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => update({ rotation: (Number(transform.rotation || 0) + 270) % 360 })} className="min-h-10 rounded-lg border border-line px-3 text-xs font-semibold text-fg-secondary">Rotate left 90°</button>
        <button type="button" onClick={() => update({ rotation: (Number(transform.rotation || 0) + 90) % 360 })} className="min-h-10 rounded-lg border border-line px-3 text-xs font-semibold text-fg-secondary">Rotate right 90°</button>
        <button type="button" onClick={() => update({ flip_x: !transform.flip_x })} aria-pressed={Boolean(transform.flip_x)} className="min-h-10 rounded-lg border border-line px-3 text-xs font-semibold text-fg-secondary">Flip horizontal</button>
        <button type="button" onClick={() => update({ flip_y: !transform.flip_y })} aria-pressed={Boolean(transform.flip_y)} className="min-h-10 rounded-lg border border-line px-3 text-xs font-semibold text-fg-secondary">Flip vertical</button>
        <button type="button" onClick={() => update({ rotation: 0, brightness: 100, contrast: 100, saturation: 100, grayscale: 0, flip_x: false, flip_y: false })} className="min-h-10 rounded-lg border border-line px-3 text-xs font-semibold text-fg-secondary">Reset adjustments</button>
      </div>
      <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-2">
        {[
          ["brightness", "Brightness", 0, 200],
          ["contrast", "Contrast", 0, 200],
          ["saturation", "Saturation", 0, 200],
          ["grayscale", "Grayscale", 0, 100],
        ].map(([key, label, min, max]) => (
          <label key={key} className="block space-y-2">
            <span className="flex items-center justify-between text-xs font-semibold text-fg-secondary"><span>{label}</span><span className="tabular-nums">{Number(transform[key] ?? 100)}%</span></span>
            <input type="range" min={min} max={max} step="1" value={Number(transform[key] ?? 100)} onChange={(event) => update({ [key]: Number(event.target.value) })} className="w-full accent-current"/>
          </label>
        ))}
      </div>
      <p className="text-[11px] leading-5 text-muted">Adjustments are applied to the preserved original image when you save. The original upload remains available in version history.</p>
    </div>
  );
}

function SpreadsheetEditor({ payload, onChange }) {
  const sheets = Array.isArray(payload.sheets) ? payload.sheets : [];
  const [activeSheet, setActiveSheet] = useState(0);
  const sheet = sheets[activeSheet] || { name: "Sheet1", headers: [], rows: [] };
  const updateSheet = (updated) => onChange({
    ...payload,
    sheets: sheets.map((item, index) => index === activeSheet ? updated : item),
  });
  const updateHeader = (index, value) => {
    const headers = [...(sheet.headers || [])];
    headers[index] = value;
    updateSheet({ ...sheet, headers });
  };
  const updateCell = (rowIndex, columnIndex, value) => {
    const rows = (sheet.rows || []).map((row, index) => index === rowIndex ? [...row] : [...row]);
    rows[rowIndex][columnIndex] = value;
    updateSheet({ ...sheet, rows });
  };
  const addColumn = () => updateSheet({ ...sheet, headers: [...(sheet.headers || []), "New column"], rows: (sheet.rows || []).map((row) => [...row, ""]) });
  const addRow = () => updateSheet({ ...sheet, rows: [...(sheet.rows || []), (sheet.headers || []).map(() => "")] });
  const addSheet = () => {
    onChange({ ...payload, sheets: [...sheets, { name: "Sheet " + (sheets.length + 1), headers: ["Column 1"], rows: [] }] });
    setActiveSheet(sheets.length);
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {sheets.map((item, index) => <button key={index} type="button" onClick={() => setActiveSheet(index)}
          className={"min-h-9 rounded-lg px-3 text-xs font-semibold " + (activeSheet === index ? "bg-blue-600 text-white" : "border border-line text-fg-secondary hover:bg-surface-2")}>{item.name || "Sheet " + (index + 1)}</button>)}
        <button type="button" onClick={addSheet} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-dashed border-line px-3 text-xs text-fg-secondary"><Plus size={13}/> Sheet</button>
      </div>
      <div className="overflow-auto rounded-xl border border-line bg-surface">
        <table className="min-w-full border-collapse text-sm">
          <thead><tr>{(sheet.headers || []).map((header, columnIndex) => <th key={columnIndex} className="min-w-36 border-b border-r border-line bg-surface-2 p-1">
            <input value={header ?? ""} onChange={(event) => updateHeader(columnIndex, event.target.value)} aria-label={"Column " + (columnIndex + 1) + " heading"} className="w-full bg-transparent px-2 py-2 text-xs font-bold outline-none"/>
          </th>)}</tr></thead>
          <tbody>{(sheet.rows || []).map((row, rowIndex) => <tr key={rowIndex}>{(sheet.headers || []).map((_, columnIndex) => <td key={columnIndex} className="border-b border-r border-line p-0">
            <input value={row?.[columnIndex] == null ? "" : String(row[columnIndex])}
              onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value)}
              aria-label={"Row " + (rowIndex + 1) + " column " + (columnIndex + 1)}
              className="w-full min-w-36 bg-transparent px-3 py-2 text-xs text-fg outline-none focus:bg-accent/5"/>
          </td>)}</tr>)}</tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={addRow} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-xs font-semibold"><Plus size={14}/> Add row</button>
        <button type="button" onClick={addColumn} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-xs font-semibold"><Plus size={14}/> Add column</button>
      </div>
    </div>
  );
}

function PresentationEditor({ payload, onChange }) {
  const slides = Array.isArray(payload.slides) ? payload.slides : [];
  const updateSlide = (index, patch) => onChange({
    ...payload,
    slides: slides.map((slide, itemIndex) => itemIndex === index ? { ...slide, ...patch } : slide),
  });
  const addSlide = () => onChange({ ...payload, slides: [...slides, { title: "New slide", subtitle: "", bullets: [], notes: "" }] });
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {slides.map((slide, index) => (
        <article key={index} className="aspect-video rounded-xl border border-line bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-sm sm:p-8">
          <div className="mb-5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[.18em] text-cyan-300"><span>Slide {index + 1}</span><span>RevelaAI Studio</span></div>
          <input value={slide.title || ""} onChange={(event) => updateSlide(index, { title: event.target.value })}
            aria-label={"Slide " + (index + 1) + " title"} className="mb-4 w-full bg-transparent text-2xl font-black outline-none placeholder:text-slate-500 sm:text-4xl"/>
          <input value={slide.subtitle || ""} onChange={(event) => updateSlide(index, { subtitle: event.target.value })}
            aria-label={"Slide " + (index + 1) + " subtitle"} placeholder="Subtitle"
            className="mb-4 w-full bg-transparent text-sm text-slate-300 outline-none placeholder:text-slate-500"/>
          <textarea value={(slide.bullets || []).join("\n")} onChange={(event) => updateSlide(index, { bullets: event.target.value.split("\n").slice(0, 24) })}
            aria-label={"Slide " + (index + 1) + " bullet points"} rows={4}
            placeholder="One bullet per line"
            className="min-h-28 w-full resize-y bg-transparent text-sm leading-7 text-slate-100 outline-none placeholder:text-slate-500"/>
        </article>
      ))}
      <button type="button" onClick={addSlide} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-dashed border-line px-3 text-xs font-semibold text-fg-secondary"><Plus size={14}/> Add slide</button>
    </div>
  );
}

export default function RevelaAIStudio({ artifact: initialArtifact, authFetch, onClose, onArtifactUpdated, onAskAI }) {
  const [artifact, setArtifact] = useState(initialArtifact || null);
  const [source, setSource] = useState(null);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const [exportOpen, setExportOpen] = useState(false);
  const saveRef = useRef(null);

  useEffect(() => {
    const raw = initialArtifact?.editable_source || initialArtifact?.preview?.editable_source || null;
    setArtifact(initialArtifact || null);
    setSource(raw ? clone(raw) : null);
    setDirty(false);
    setNotice("");
    setError("");
  }, [initialArtifact?.id, initialArtifact?.version]);

  const kind = source?.kind || artifact?.editable_source?.kind || "";
  const payload = source?.payload || {};
  const compatibility = artifact?.compatibility || artifact?.preview?.compatibility || {};
  const warnings = Array.isArray(compatibility.warnings) ? compatibility.warnings : [];
  const hasMediaLossRisk = Boolean(artifact?.preview?.images_embedded) && ["document", "slide_deck"].includes(kind);
  const canEdit = Boolean(source?.payload) && !hasMediaLossRisk;
  const canSave = canEdit && dirty && !busy;
  const editorTitle = artifact?.title || "Untitled artifact";
  const extension = String(payload.extension || artifact?.filename?.split(".").pop() || "txt").replace(/^\./, "").toLowerCase();

  const updatePayload = (next) => {
    setSource((current) => current ? { ...current, payload: next } : current);
    setDirty(true);
    setNotice("Unsaved changes");
    setError("");
  };

  const save = async ({ automatic = false } = {}) => {
    if (!canEdit || !source || !artifact?.id || !dirty || busy) return false;
    setBusy("save");
    setError("");
    setNotice(automatic ? "Saving automatically…" : "Saving changes…");
    try {
      const updated = await saveRevelaAIArtifactSource({
        authFetch, artifactId: artifact.id, expectedVersion: artifact.version, source,
      });
      setArtifact(updated);
      const nextSource = updated?.editable_source || updated?.preview?.editable_source || source;
      setSource(clone(nextSource));
      setDirty(false);
      setNotice((automatic ? "Autosaved as version " : "Saved as version ") + Number(updated?.version || artifact.version + 1));
      onArtifactUpdated?.(updated);
      return true;
    } catch (saveError) {
      setError(String(saveError?.message || "The file could not be saved."));
      setNotice("");
      return false;
    } finally {
      setBusy("");
    }
  };

  saveRef.current = save;
  useEffect(() => {
    if (!dirty || !canEdit || busy || !artifact?.id) return undefined;
    const timeout = window.setTimeout(() => {
      void saveRef.current?.({ automatic: true });
    }, 2200);
    return () => window.clearTimeout(timeout);
  }, [dirty, source, artifact?.id, artifact?.version, busy, canEdit]);

  const exportFormat = async (format) => {
    if (!artifact?.id || busy) return;
    setBusy("export");
    setError("");
    setNotice("Preparing " + format + " export…");
    setExportOpen(false);
    try {
      const result = await exportRevelaAIArtifact({
        authFetch, artifactId: artifact.id, expectedVersion: artifact.version, format,
      });
      if (!result.downloadUrl) throw new Error("The export was created without a download link.");
      const updated = result.artifact || artifact;
      setArtifact(updated);
      onArtifactUpdated?.(updated);
      const url = resolveRevelaAIArtifactUrl(result.downloadUrl);
      const name = String(updated.title || "RevelaAI-file").replace(/[^a-z0-9._-]+/gi, "-") + "." + format.toLowerCase();
      const outcome = await downloadRemoteArtifact(url, { fileName: name });
      setNotice(outcome.method === "native" ? "Export saved to Android Downloads/RevelaCode." : "Export download started.");
    } catch (exportError) {
      setError(String(exportError?.message || "Export failed."));
      setNotice("");
    } finally {
      setBusy("");
    }
  };

  const downloadOriginal = async () => {
    if (!artifact?.id || busy) return;
    setBusy("download");
    setError("");
    setNotice("Preparing original file…");
    try {
      const latest = await getRevelaAIArtifact({ authFetch, artifactId: artifact.id });
      const current = latest || artifact;
      const url = resolveRevelaAIArtifactUrl(current.original_download_url || current.download_url || artifact.download_url);
      const name = current.original_filename || current.filename || (String(current.title || "RevelaAI-file").replace(/[^a-z0-9._-]+/gi, "-") + ".bin");
      const outcome = await downloadRemoteArtifact(url, {
        fileName: name,
        mimeType: current.original_mime_type || current.mime_type || "application/octet-stream",
      });
      setArtifact(current);
      onArtifactUpdated?.(current);
      setNotice(outcome.method === "native" ? "Original saved to Android Downloads/RevelaCode." : "Original download started.");
    } catch (downloadError) {
      setError(String(downloadError?.message || "The original file could not be downloaded."));
      setNotice("");
    } finally {
      setBusy("");
    }
  };

  const supportedExports = useMemo(() => {
    if (kind === "document") return ["DOCX", "PDF", "TXT", "MD"];
    if (kind === "image") return ["PNG", "JPG", "PDF"];
    if (kind === "spreadsheet") return ["XLSX", "CSV"];
    if (kind === "slide_deck") return ["PPTX"];
    if (kind === "code") return [extension.toUpperCase(), "TXT"].filter((item, index, all) => all.indexOf(item) === index);
    return [];
  }, [kind, extension]);

  const runHistoryAction = async (action) => {
    if (!artifact?.id || busy) return;
    if (dirty) {
      setError("Save or discard your unsaved changes before restoring a previous version.");
      return;
    }
    setBusy(action);
    setError("");
    try {
      const base = (import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com").replace(/\/$/, "");
      const response = await authFetch(
        base + "/api/artifacts/" + encodeURIComponent(artifact.id) + "/edit",
        { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ action, studio_session: true }) }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail?.message || data?.detail || "Version history could not be updated.");
      const updated = data?.artifact;
      if (updated) {
        setArtifact(updated);
        const nextSource = updated?.editable_source || updated?.preview?.editable_source || null;
        setSource(nextSource ? clone(nextSource) : null);
        setDirty(false);
        onArtifactUpdated?.(updated);
      }
      setNotice(action === "undo" ? "Previous version restored." : "Next version restored.");
    } catch (historyError) {
      setError(String(historyError?.message || "Version history failed."));
    } finally {
      setBusy("");
    }
  };

  const close = async () => {
    if (dirty) {
      const shouldSave = window.confirm("You have unsaved changes. Save them before closing Studio? Press Cancel to keep editing.");
      if (shouldSave) {
        const saved = await save();
        if (!saved) return;
      } else if (!window.confirm("Discard unsaved changes and close Studio?")) {
        return;
      }
    }
    if (artifact?.id) {
      try {
        const base = (import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com").replace(/\/$/, "");
        await authFetch(base + "/api/artifacts/" + encodeURIComponent(artifact.id) + "/edit", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "returned" }),
        });
      } catch { /* The file remains saved at its last confirmed version. */ }
    }
    onClose?.();
  };

  const previewUrl = artifact?.preview_url
    ? (() => { try { return resolveRevelaAIArtifactUrl(artifact.preview_url); } catch { return ""; } })()
    : "";
  const originalPreviewUrl = artifact?.original_preview_url
    ? (() => { try { return resolveRevelaAIArtifactUrl(artifact.original_preview_url); } catch { return previewUrl; } })()
    : previewUrl;

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-app text-fg" data-demo="revelaai-studio" role="dialog" aria-modal="true" aria-label="RevelaAI Studio">
      <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-header px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={close} aria-label="Close Studio" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-fg-secondary hover:bg-surface-2"><ArrowLeft size={18}/></button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><Sparkles size={19}/></div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold sm:text-base">RevelaAI Studio</h1>
            <p className="truncate text-[11px] text-muted">{editorTitle} · Version {Number(artifact?.version || 1)}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs text-muted sm:inline">{busy === "save" ? "Saving…" : dirty ? "Unsaved changes" : "Saved"}</span>
          {artifact?.can_undo && <button type="button" disabled={Boolean(busy)} onClick={() => void runHistoryAction("undo")} className="hidden h-10 items-center gap-1 rounded-lg border border-line px-3 text-xs sm:inline-flex"><Undo2 size={14}/> Undo</button>}
          {artifact?.can_redo && <button type="button" disabled={Boolean(busy)} onClick={() => void runHistoryAction("redo")} className="hidden h-10 items-center gap-1 rounded-lg border border-line px-3 text-xs sm:inline-flex"><Redo2 size={14}/> Redo</button>}
          <button type="button" disabled={!canSave} onClick={() => void save()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><Save size={14}/>{busy === "save" ? "Saving" : "Save"}</button>
          <button type="button" disabled={Boolean(busy) || !artifact?.download_url} onClick={() => void downloadOriginal()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line px-3 text-xs font-semibold text-fg-secondary disabled:opacity-40"><Download size={14}/> Original</button>
          <div className="relative">
            <button type="button" disabled={!supportedExports.length || Boolean(busy) || dirty} onClick={() => setExportOpen((value) => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line px-3 text-xs font-semibold text-fg-secondary disabled:opacity-40"><FileDown size={14}/> Export <ChevronDown size={13}/></button>
            {exportOpen && <div className="absolute right-0 top-12 z-20 w-44 rounded-xl border border-line bg-popover p-1 shadow-xl">{supportedExports.map((format) => <button key={format} type="button" onClick={() => void exportFormat(format)} className="flex min-h-10 w-full items-center rounded-lg px-3 text-left text-xs font-semibold hover:bg-surface-2">{format}</button>)}</div>}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-sidebar p-3 lg:flex">
          <p className="px-2 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-muted">Studio tools</p>
          <button type="button" onClick={() => setActiveTab("edit")} className={"flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm " + (activeTab === "edit" ? "bg-accent/10 text-accent" : "text-fg-secondary hover:bg-surface-2")}><FileText size={16}/> Editor</button>
          <button type="button" onClick={() => setActiveTab("preview")} className={"flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm " + (activeTab === "preview" ? "bg-accent/10 text-accent" : "text-fg-secondary hover:bg-surface-2")}><ImageIcon size={16}/> Original preview</button>
          <button type="button" onClick={() => setActiveTab("versions")} className={"flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm " + (activeTab === "versions" ? "bg-accent/10 text-accent" : "text-fg-secondary hover:bg-surface-2")}><History size={16}/> Versions</button>
          <div className="mt-auto rounded-xl border border-line bg-surface-2 p-3">
            <p className="text-xs font-bold">File details</p>
            <p className="mt-2 break-all text-[11px] text-muted">{artifact?.filename || artifact?.title}</p>
            <p className="mt-1 text-[11px] text-muted">{formatBytes(artifact?.size_bytes)} · {String(artifact?.source || "generated")}</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-auto bg-app p-3 sm:p-6">
          <div className="mx-auto mb-4 flex max-w-5xl items-center justify-between gap-3">
            <div className="flex gap-1 rounded-xl border border-line bg-surface p-1 lg:hidden">
              {["edit", "preview", "versions"].map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={"min-h-9 rounded-lg px-3 text-xs font-semibold capitalize " + (activeTab === tab ? "bg-accent/10 text-accent" : "text-muted")}>{tab}</button>)}
            </div>
            {onAskAI && <button type="button" onClick={() => onAskAI(artifact)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-accent/30 px-3 text-xs font-semibold text-accent"><Sparkles size={14}/> Ask RevelaAI</button>}
          </div>

          {activeTab === "edit" && (
            <section className="mx-auto max-w-5xl">
              {warnings.length > 0 && <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-5 text-amber-700 dark:text-amber-300"><b>Import compatibility</b><ul className="mt-1 list-disc pl-5">{warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></div>}
              {hasMediaLossRisk && <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-700 dark:text-rose-300">Editing is disabled to protect embedded media. You can still preview and export the original file.</div>}
              {!canEdit && !hasMediaLossRisk && <div className="mb-4 rounded-xl border border-line bg-surface p-4 text-sm text-muted">This artifact is available in preview mode. A native editable source is not available for this file type yet.</div>}
              {canEdit && kind === "document" && <DocumentEditor payload={payload} onChange={updatePayload}/>}
              {canEdit && kind === "image" && <ImageEditor payload={payload} onChange={updatePayload} previewUrl={originalPreviewUrl}/>}
              {canEdit && kind === "spreadsheet" && <SpreadsheetEditor payload={payload} onChange={updatePayload}/>}
              {canEdit && kind === "slide_deck" && <PresentationEditor payload={payload} onChange={updatePayload}/>}
              {canEdit && kind === "code" && (
                <div className="overflow-hidden rounded-2xl border border-line bg-[#0b1220]">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-slate-300"><span>{String(payload.extension || ".txt")} · Code Editor</span><span>Text-only · Not executed</span></div>
                  <CodeMirror value={String(payload.source || "")} height="68vh" theme="dark" extensions={[codeExtension(payload.language)]}
                    onChange={(value) => updatePayload({ ...payload, source: value })}
                    basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true, autocompletion: true }}/>
                </div>
              )}
            </section>
          )}

          {activeTab === "preview" && (
            <section className="mx-auto max-w-5xl">
              {artifact?.preview?.type === "document" && Array.isArray(artifact.preview.sections) ? (
                <article className="mx-auto max-w-[850px] rounded-lg border border-slate-200 bg-white p-6 text-slate-900 shadow-sm sm:p-10">
                  <h2 className="mb-7 text-2xl font-bold">{artifact.preview.title || editorTitle}</h2>
                  {artifact.preview.sections.map((section, index) => (
                    <section key={index} className="mb-6 space-y-3">
                      {section.heading && <h3 className="text-lg font-semibold">{section.heading}</h3>}
                      {(section.paragraphs || []).map((paragraph, itemIndex) => <p key={itemIndex} className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{paragraph}</p>)}
                      {(section.tables || []).map((table, tableIndex) => (
                        <div key={tableIndex} className="overflow-x-auto">
                          <table className="min-w-full border-collapse text-xs">
                            <thead><tr>{(table.headers || []).map((heading, i) => <th key={i} className="border border-slate-300 p-2 text-left">{heading}</th>)}</tr></thead>
                            <tbody>{(table.rows || []).map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="border border-slate-300 p-2">{String(cell ?? "")}</td>)}</tr>)}</tbody>
                          </table>
                        </div>
                      ))}
                    </section>
                  ))}
                </article>
              ) : artifact?.preview?.type === "slides" && Array.isArray(artifact.preview.slides) ? (
                <div className="mx-auto max-w-5xl space-y-4">
                  {artifact.preview.slides.map((slide, index) => <article key={index} className="aspect-video rounded-xl border border-line bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white sm:p-10">
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-300">Slide {index + 1}</p>
                    <h3 className="mt-6 text-2xl font-black sm:text-4xl">{slide.title}</h3>
                    {slide.subtitle && <p className="mt-3 text-sm text-slate-300">{slide.subtitle}</p>}
                    <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-100">{(slide.bullets || []).map((bullet, i) => <li key={i}>{bullet}</li>)}</ul>
                  </article>)}
                </div>
              ) : artifact?.preview?.type === "table" && Array.isArray(artifact.preview.sheets) ? (
                <div className="space-y-4">
                  {artifact.preview.sheets.map((sheet, index) => <section key={index} className="overflow-auto rounded-xl border border-line bg-surface">
                    <h3 className="border-b border-line bg-surface-2 px-3 py-2 text-sm font-semibold">{sheet.sheet || "Sheet " + (index + 1)}</h3>
                    <table className="min-w-full border-collapse text-xs"><tbody>{(sheet.rows || []).map((row, rowIndex) => <tr key={rowIndex}>{(row || []).map((cell, cellIndex) => <td key={cellIndex} className="border-b border-r border-line px-3 py-2">{String(cell ?? "")}</td>)}</tr>)}</tbody></table>
                  </section>)}
                </div>
              ) : artifact?.preview?.type === "image" && previewUrl ? (
                <img src={previewUrl} alt={editorTitle} className="mx-auto max-h-[78vh] max-w-full rounded-xl border border-line bg-surface object-contain"/>
              ) : previewUrl ? (
                <iframe title="Original file preview" src={previewUrl} className="h-[78vh] w-full rounded-xl border border-line bg-white" />
              ) : artifact?.preview?.source_preview ? (
                <pre className="overflow-auto rounded-xl bg-code p-4 text-xs text-fg-secondary">{artifact.preview.source_preview}</pre>
              ) : artifact?.preview?.extracted_text ? (
                <pre className="whitespace-pre-wrap rounded-xl border border-line bg-surface p-4 text-xs text-fg-secondary">{artifact.preview.extracted_text}</pre>
              ) : (
                <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted">No inline preview is available for this file.</div>
              )}
            </section>
          )}

          {activeTab === "versions" && (
            <section className="mx-auto max-w-3xl rounded-2xl border border-line bg-surface p-4">
              <div className="mb-3 flex items-center gap-2"><History size={17}/><h2 className="text-sm font-bold">Version history</h2></div>
              {(artifact?.version_history || []).map((version) => <div key={version.version} className="flex items-center justify-between gap-3 border-t border-line py-3 text-xs">
                <div><b>Version {version.version}</b><p className="mt-1 text-muted">{version.created_at ? new Date(version.created_at).toLocaleString() : "Date unavailable"} · {(version.formats || []).join(", ")}</p></div>
                {version.active && <span className="rounded-full bg-accent/10 px-2 py-1 font-bold text-accent">Current</span>}
              </div>)}
              {!artifact?.version_history?.length && <p className="text-sm text-muted">No additional versions have been saved yet.</p>}
            </section>
          )}
          {(notice || error) && <div role={error ? "alert" : "status"} className={"mx-auto mt-4 max-w-5xl rounded-xl border p-3 text-xs " + (error ? "border-rose-500/30 text-rose-600" : "border-line text-muted")}>{error || notice}</div>}
        </main>
      </div>
    </div>
  );
}
