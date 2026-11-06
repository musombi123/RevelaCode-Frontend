import React, { useEffect, useMemo, useState } from "react";
import LocalWorkspaceStoragePanel from "@/components/LocalWorkspaceStoragePanel";
import { saveLocalFile } from "@/ai/localWorkspaceStorage";
import { BookOpen, FileSpreadsheet, FileText, Globe2, Lock, Presentation, Search, Sparkles, X, Download, ArrowUpRight } from "lucide-react";

const API_BASE = String(import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com").replace(/\/$/, "");

const PHASE_ONE_TOOLS = [
  { id: "research_global", title: "Deep Search", description: "Global news, official sources and scholarly research.", icon: Globe2, phase: 1 },
  { id: "spreadsheet", title: "Spreadsheets", description: "Editable XLSX workbooks, formulas and CSV exports.", icon: FileSpreadsheet, phase: 1 },
  { id: "word", title: "Word Documents", description: "Editable DOCX reports, proposals and letters.", icon: FileText, phase: 1 },
  { id: "powerpoint", title: "PowerPoint", description: "Editable PPTX presentations and PDF previews.", icon: Presentation, phase: 1 },
  { id: "analytics", title: "Data Analytics", description: "Profile, clean and analyze your uploaded datasets.", icon: Search, phase: 2 },
  { id: "accounting", title: "Accounting", description: "Double-entry ledger and financial statements.", icon: FileSpreadsheet, phase: 2 },
  { id: "publications", title: "Publications", description: "Literature reviews and verified research citations.", icon: BookOpen, phase: 2 },
  { id: "quantum", title: "Quantum Science", description: "Quantum operators, circuits and simulations.", icon: Sparkles, phase: 3 },
  { id: "robotics", title: "Robotics", description: "Kinematics, controls, URDF and engineering outputs.", icon: Presentation, phase: 3 },
];

function authHeaders() {
  try {
    const token = localStorage.getItem("revelacode_access_token") || localStorage.getItem("access_token") || localStorage.getItem("token");
    if (!token) return {};
    const type = localStorage.getItem("revelacode_token_type") || "Bearer";
    return { Authorization: type + " " + token };
  } catch { return {}; }
}

async function api(path, options = {}) {
  const response = await fetch(API_BASE + path, {
    ...options,
    headers: { Accept: "application/json", "X-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", ...authHeaders(), ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload?.detail;
    const message = typeof detail === "string" ? detail : detail?.message || payload?.message || "The tool request could not be completed.";
    throw new Error(message);
  }
  return payload;
}

function buildWordPayload(title, text) {
  const paragraphs = String(text || "").split(/\n\s*\n/).map(value => value.trim()).filter(Boolean);
  return { title, sections: [{ heading: "Overview", level: 1, paragraphs: paragraphs.length ? paragraphs : [String(text || title)] }] };
}

function buildSlidesPayload(title, text) {
  const groups = String(text || "").split(/\n---+\n/g).map(x => x.trim()).filter(Boolean);
  const slides = groups.map((group, index) => {
    const lines = group.split("\n").map(x => x.trim()).filter(Boolean);
    const heading = lines[0]?.replace(/^#+\s*/, "") || (index === 0 ? title : "Slide " + (index + 1));
    return { title: heading, bullets: lines.slice(1).map(x => x.replace(/^[-*•]\s*/, "")).filter(Boolean) };
  });
  if (!slides.length) slides.push({ title, bullets: [String(text || title)] });
  return { title, slides };
}

function buildSheetPayload(title, text) {
  const rows = String(text || "").split("\n").map(line => line.split("\t").length > 1 ? line.split("\t") : line.split(",")).filter(row => row.some(cell => String(cell).trim()));
  const headers = rows.shift() || ["Column A"];
  return { title, sheets: [{ name: "Data", headers, rows }] };
}

export default function ProductivityToolsPanel({ onSend }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("research_global");
  const [catalog, setCatalog] = useState(null);
  const [regions, setRegions] = useState([]);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [region, setRegion] = useState("");
  const [sourceCountry, setSourceCountry] = useState("");
  const [conflicts, setConflicts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [savingFile, setSavingFile] = useState("");

  useEffect(() => {
    if (!open || catalog) return;
    api("/api/productivity/catalog")
      .then(data => { setCatalog(data); setRegions(data.regions || []); })
      .catch(err => setError(err.message));
  }, [open, catalog]);

  const selectedTool = PHASE_ONE_TOOLS.find(tool => tool.id === selected) || PHASE_ONE_TOOLS[0];
  const selectedMeta = catalog?.tools?.find(tool => tool.id === selected);
  const isLocked = selectedTool.phase > 1;
  const downloadFiles = useMemo(() => {
    const artifact = result?.artifact;
    if (!artifact) return [];
    return artifact.files || [artifact.primary].filter(Boolean);
  }, [result]);

  const runResearch = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await api("/api/productivity/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query, region, source_country: sourceCountry,
          conflicting_views: conflicts, locale: navigator.language || "en",
          language: navigator.language || "en", limit: 10,
        }),
      });
      setResult({ kind: "research", data });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const generateFile = async kind => {
    setLoading(true); setError(""); setResult(null);
    try {
      let payload;
      if (kind === "word") payload = buildWordPayload(title || "RevelaAI Report", body);
      else if (kind === "powerpoint") payload = buildSlidesPayload(title || "RevelaAI Presentation", body);
      else payload = buildSheetPayload(title || "RevelaAI Spreadsheet", body);
      const data = await api("/api/productivity/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, payload }),
      });
      setResult({ kind, artifact: data.artifact });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const absoluteLink = path => /^https?:\/\//i.test(path) ? path : API_BASE + path;
  
  const saveArtifactLocally = async file => {
    const key = file.file_id || file.filename;
    setSavingFile(key);
    setError("");
    try {
      const response = await fetch(absoluteLink(file.download_url), { headers: authHeaders() });
      if (!response.ok) throw new Error("The generated file could not be retrieved for local saving.");
      const blob = await response.blob();
      await saveLocalFile(blob, { name: file.filename || "RevelaAI-output", type: blob.type, category: "generated_artifact" });
      setResult(previous => ({ ...previous, localSaved: [...(previous?.localSaved || []), key] }));
    } catch (err) { setError(err.message || "Could not save this file locally."); }
    finally { setSavingFile(""); }
  };

  return (
    <div className="relative w-full">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => { setOpen(value => !value); setError(""); }}
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <Sparkles size={15} /> Tools & Workspace
        </button>
        {catalog && (
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            AI tools tier: <strong className="uppercase">{catalog.tier}</strong>
          </span>
        )}
      </div>

      {open && (
        <section className="mb-3 max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-slate-950 sm:p-4" aria-label="RevelaAI productivity tools">
          <LocalWorkspaceStoragePanel />
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Productivity Tools</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Use the free daily allowance, or unlock higher limits with Smart AI Plus / Pro.</p>
            </div>
            <button type="button" aria-label="Close tools" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={17}/></button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PHASE_ONE_TOOLS.map(tool => {
              const Icon = tool.icon;
              const active = selected === tool.id;
              return (
                <button key={tool.id} type="button" onClick={() => { setSelected(tool.id); setError(""); setResult(null); }}
                  className={"relative rounded-xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 " + (active ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40" : "border-slate-200 bg-slate-50 hover:border-slate-400 dark:border-white/10 dark:bg-slate-900")}>
                  <div className="mb-2 flex items-center justify-between">
                    <Icon size={17} className={active ? "text-blue-600 dark:text-blue-300" : "text-slate-500"}/>
                    {tool.phase > 1 ? <Lock size={13} className="text-slate-400"/> : null}
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">{tool.title}</div>
                  <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{tool.description}</p>
                  {tool.phase > 1 && <span className="mt-2 inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Phase {tool.phase}</span>}
                </button>
              );
            })}
          </div>

          {selectedTool.phase > 1 ? (
            <div className="mt-3 rounded-xl border border-slate-200 p-3 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">
              <strong>{selectedTool.title}</strong> is scheduled for Phase {selectedTool.phase}. It is not activated yet, so this workspace will not pretend the tool is available. Smart AI Plus / Pro plan entitlements are being prepared through the existing billing system.
            </div>
          ) : selected === "research_global" ? (
            <div className="mt-3 space-y-2 rounded-xl border border-slate-200 p-3 dark:border-white/10">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">Research question</label>
              <textarea value={query} onChange={event => setQuery(event.target.value)} rows={2} maxLength={500} placeholder="Compare recent research on quantum error correction across regions..." className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"/>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">Regional pack
                  <select value={region} onChange={event => setRegion(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-white/10 dark:bg-slate-900">
                    <option value="">Auto by locale</option>
                    {regions.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
                <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">Sources by country
                  <select value={sourceCountry} onChange={event => setSourceCountry(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-white/10 dark:bg-slate-900">
                    <option value="">All countries / global</option>
                    {["KE","US","CA","GB","DE","FR","ES","IN","CN","JP"].map(code => <option key={code} value={code}>{code}</option>)}
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={conflicts} onChange={event => setConflicts(event.target.checked)}/> Show regional viewpoints side by side
              </label>
              <button disabled={loading || !query.trim()} onClick={runResearch} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50">{loading ? "Searching..." : "Search worldwide"}</button>
            </div>
          ) : (
            <div className="mt-3 space-y-2 rounded-xl border border-slate-200 p-3 dark:border-white/10">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">File title
                <input value={title} onChange={event => setTitle(event.target.value)} maxLength={160} placeholder={selected === "word" ? "Research Report" : selected === "powerpoint" ? "Project Presentation" : "Sales Report"} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"/>
              </label>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                {selected === "word" ? "Document text (separate paragraphs with a blank line)" : selected === "powerpoint" ? "Slide outline (separate slides with ---; use the first line as each slide title and following lines as bullets)" : "Tabular data (first line is headers; separate columns with tabs)"}
                <textarea value={body} onChange={event => setBody(event.target.value)} rows={5} placeholder={selected === "spreadsheet" ? "Month\tSales\tCosts\nJanuary\t12000\t7000\nFebruary\t15000\t8000" : "Introduction\n\nKey findings\n\nRecommendations"} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"/>
              </label>
              <button disabled={loading || !body.trim()} onClick={() => generateFile(selected)} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50">{loading ? "Generating..." : "Create " + selectedTool.title}</button>
            </div>
          )}

          {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}

          {result?.kind === "research" && (
            <div className="mt-3 rounded-xl border border-slate-200 p-3 dark:border-white/10">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <strong className="text-slate-900 dark:text-white">{result.data.source_count} source results</strong>
                <span className="text-slate-500">Query language: {result.data.query_language} · response language: {result.data.response_language}</span>
              </div>
              {result.data.sources.map((source,index) => (
                <article key={source.url || index} className="border-t border-slate-100 py-2 first:border-0 dark:border-white/10">
                  <a href={source.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-700 hover:underline dark:text-blue-300">{source.title || source.source} <ArrowUpRight size={11} className="inline"/></a>
                  <p className="mt-1 text-[11px] leading-4 text-slate-600 dark:text-slate-400">{source.snippet}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{source.source} · {source.country} · {source.published_at || "date not provided"}</p>
                </article>
              ))}
              {result.data.conflict_note && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-[10px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">{result.data.conflict_note}</p>}
              <button onClick={() => onSend?.("Summarize these retrieved research sources in my language. Compare the regional evidence, identify genuine disagreements only where the underlying claims are incompatible, and cite the source URLs: " + JSON.stringify(result.data.sources.slice(0,12)))} className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-[11px] font-bold text-slate-700 dark:border-white/10 dark:text-slate-200">Ask AI to synthesize findings</button>
            </div>
          )}

          {result?.artifact && (
            <div className="mt-3 rounded-xl border border-slate-200 p-3 dark:border-white/10">
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">Workspace output is ready</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {downloadFiles.map((file,index) => { const key = file.file_id || file.filename; return <div key={key || index} className="flex flex-wrap gap-2"><a href={absoluteLink(file.download_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-bold text-white"><Download size={13}/> {file.filename}</a><button type="button" disabled={!!savingFile || (result.localSaved || []).includes(key)} onClick={() => saveArtifactLocally(file)} className="rounded-lg border border-slate-300 px-3 py-2 text-[11px] font-bold text-slate-700 disabled:opacity-50 dark:border-white/10 dark:text-slate-200">{savingFile === key ? "Saving…" : (result.localSaved || []).includes(key) ? "Saved locally" : "Save to local workspace"}</button></div>; })}
              </div>
              {result.artifact.preview?.sheets?.map(sheet => (
                <div key={sheet.sheet} className="mt-3 overflow-x-auto">
                  <p className="mb-1 text-[10px] font-bold text-slate-500">{sheet.sheet} preview (first 30 rows)</p>
                  <table className="min-w-full border-collapse text-left text-[10px]">
                    <tbody>{sheet.rows.map((row,index) => <tr key={index} className="border-b border-slate-200 dark:border-white/10">{row.map((cell,c) => <td key={c} className={"px-2 py-1 " + (index===0 ? "font-bold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300")}>{cell == null ? "" : String(cell)}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              ))}
              <button onClick={() => onSend?.("Review and improve the " + selectedTool.title + " I just generated. Suggest changes before creating a revised version.")} className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-[11px] font-bold text-slate-700 dark:border-white/10 dark:text-slate-200">Ask AI to change this</button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
