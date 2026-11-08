import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE = String(import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com").replace(/\/$/, "");

function saveText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.replace(/\.pdf$/i, "") + "-humanized.txt";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function mapAcceptedRangeToOriginal(page, pageNumber, start, end, replacement, acceptedEdits) {
  const pageEdits = acceptedEdits.filter((edit) => edit.page === pageNumber).sort((a, b) => a.start - b.start);
  let delta = 0;
  for (const edit of pageEdits) {
    const currentStart = edit.start + delta;
    const currentEnd = currentStart + edit.replacement.length;
    if (start < currentEnd && end > currentStart) {
      throw new Error("This passage overlaps an earlier approved change. Export the text revision or undo that change before editing this passage.");
    }
    if (currentEnd <= start) {
      delta += edit.replacement.length - (edit.end - edit.start);
    } else if (currentStart >= end) {
      break;
    }
  }
  const originalStart = start - delta;
  const originalEnd = end - delta;
  const original = page.originalText.slice(originalStart, originalEnd);
  if (!original || original !== page.text.slice(start, end)) {
    throw new Error("The selected passage cannot be mapped safely to the original PDF. Re-open the source PDF before applying more changes.");
  }
  return { page: pageNumber, start: originalStart, end: originalEnd, original, replacement };
}

export default function HumanizerWorkspace({ embedded = false, initialText = "", onExportToChat = null }) {
  const auth = useAuth();
  const authFetch = auth?.authFetch;
  const editorRef = useRef(null);
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [pages, setPages] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [selection, setSelection] = useState({ start: 0, end: 0, text: "" });
  const [suggestions, setSuggestions] = useState([]);
  const [accepted, setAccepted] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [geminiDraft, setGeminiDraft] = useState(null);
  const [acceptedEdits, setAcceptedEdits] = useState([]);
  const [manualTextEdited, setManualTextEdited] = useState(false);

  useEffect(() => {
    const source = String(initialText || "").trim();
    if (!source) return;
    setPastedText(source);
    setFile(null);
    setDocumentName("AI chat content");
    setPages([{ page: 1, text: source, originalText: source, extractionMethod: "chat", layoutSupported: false, layoutReason: "Chat-generated text can be revised and exported as text. Upload the source PDF to preserve its original layout." }]);
    setPageIndex(0);
    setSelection({ start: 0, end: 0, text: "" });
    setSuggestions([]);
    setAccepted({});
    setGeminiDraft(null);
    setAcceptedEdits([]);
    setManualTextEdited(false);
    setError("");
    setNotice("Content from your AI chat is ready. Select only the wording you want to refine.");
  }, [initialText]);

  const currentPage = pages[pageIndex] || null;
  const acceptedCount = Object.values(accepted).filter(Boolean).length;
  const pdfExportUnsupported = acceptedEdits.some((edit) => !pages.find((page) => page.page === edit.page)?.layoutSupported);
  const canExportPdf = Boolean(file && acceptedEdits.length && !manualTextEdited && !pdfExportUnsupported);

  function requireAuthenticatedFetch() {
    if (typeof authFetch !== "function") {
      throw new Error("RevelaCode's authenticated request service is unavailable. Reload the workspace session and retry.");
    }
    return authFetch;
  }

  function captureSelection() {
    const element = editorRef.current;
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const text = element.value.slice(start, end);
    setSelection({ start, end, text });
    setSuggestions([]);
    setAccepted({});
    setGeminiDraft(null);
    setNotice(text.trim() ? "Selection ready. Only this passage will be processed." : "Highlight a word or phrase in the page text.");
  }

  function loadPastedText() {
    const source = String(pastedText || "").trim();
    if (!source) {
      setError("Paste or type the text you want to humanize first.");
      return;
    }
    setFile(null);
    setDocumentName("Pasted text");
    setPages([{
      page: 1,
      text: source,
      originalText: source,
      extractionMethod: "pasted",
      layoutSupported: false,
      layoutReason: "Pasted text can be revised and exported as text. PDF layout reconstruction requires an original PDF.",
    }]);
    setPageIndex(0);
    setSelection({ start: 0, end: 0, text: "" });
    setSuggestions([]);
    setAccepted({});
    setGeminiDraft(null);
    setAcceptedEdits([]);
    setManualTextEdited(false);
    setError("");
    setNotice("Text loaded. Select a word or phrase to receive focused suggestions.");
  }

  async function uploadPdf() {
    if (!file) return;
    setLoading(true); setError(""); setNotice("");
    try {
      const request = requireAuthenticatedFetch();
      const body = new FormData();
      body.append("file", file);
      const response = await request(API_BASE + "/api/humanizer/pdf/extract", { method: "POST", body });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.error?.message || "Could not extract this PDF.");
      const extracted = (payload.data.pages || []).map((page) => ({
        page: page.page, text: page.text || "", originalText: page.text || "",
        extractionMethod: page.extraction_method || "native",
        layoutSupported: Boolean(page.layout_supported),
        layoutReason: page.layout_reason || "",
      }));
      if (!extracted.length) throw new Error("No readable pages were found in this PDF.");
      setPages(extracted); setPageIndex(0); setDocumentName(payload.data.filename || file.name);
      setSuggestions([]); setAccepted({}); setGeminiDraft(null); setSelection({ start: 0, end: 0, text: "" });
      setAcceptedEdits([]); setManualTextEdited(false);
      setNotice("Extracted " + extracted.length + " page(s). Select only the words or phrases you want to improve.");
    } catch (e) { setError(e.message || "PDF extraction failed."); }
    finally { setLoading(false); }
  }

  async function getSuggestions() {
    if (!selection.text.trim()) { setError("Highlight a word or phrase in the page text first."); return; }
    setLoading(true); setError(""); setNotice("");
    try {
      const request = requireAuthenticatedFetch();
      const response = await request(API_BASE + "/api/humanizer/suggest", {
        method: "POST",
        body: JSON.stringify({ selected_text: selection.text, style: "natural" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.error?.message || "Could not generate suggestions.");
      const list = (payload.data.suggestions || []).map((item, index) => ({
        ...item, id: pageIndex + "-" + selection.start + "-" + index,
        start: selection.start + Number(item.start), end: selection.start + Number(item.end),
      }));
      setSuggestions(list); setAccepted({}); setGeminiDraft(null);
      setNotice(list.length ? "Found " + list.length + " local suggestion(s). Nothing has changed yet." : "No safe local alternative was found. Your text remains unchanged.");
    } catch (e) { setError(e.message || "Suggestion request failed."); }
    finally { setLoading(false); }
  }


  async function generateWithGemini() {
    if (!selection.text.trim()) { setError("Highlight the exact passage you want Gemini to produce first."); return; }
    setLoading(true); setError(""); setNotice("");
    try {
      const request = requireAuthenticatedFetch();
      const response = await request(API_BASE + "/api/humanizer/generate", {
        method: "POST",
        body: JSON.stringify({ selected_text: selection.text, style: "natural" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.error?.message || "Gemini could not produce this passage.");
      const data = payload.data || {};
      setGeminiDraft({
        start: selection.start, end: selection.end, original: selection.text,
        text: data.humanized_text || "", model: data.model || "Gemini",
        fallbackUsed: Boolean(data.fallback_used),
      });
      setSuggestions([]); setAccepted({});
      setNotice("Gemini produced a draft for the selected passage only. Review it before applying; your page is still unchanged.");
    } catch (e) { setError(e.message || "Gemini generation failed."); }
    finally { setLoading(false); }
  }

  function applyGeminiDraft() {
    if (!geminiDraft || !currentPage) return;
    if (currentPage.text.slice(geminiDraft.start, geminiDraft.end) !== geminiDraft.original) {
      setError("The source passage changed after Gemini generated the draft. Select it again and regenerate.");
      return;
    }
    let sourceEdit = null;
    if (!manualTextEdited) {
      try {
        sourceEdit = mapAcceptedRangeToOriginal(currentPage, currentPage.page, geminiDraft.start, geminiDraft.end, geminiDraft.text, acceptedEdits);
      } catch (mappingError) {
        setError(mappingError.message);
        return;
      }
    }
    const revised = currentPage.text.slice(0, geminiDraft.start) + geminiDraft.text + currentPage.text.slice(geminiDraft.end);
    setPages((previous) => previous.map((page, index) => index === pageIndex ? { ...page, text: revised } : page));
    if (sourceEdit) setAcceptedEdits((previous) => [...previous, sourceEdit]);
    setGeminiDraft(null); setSuggestions([]); setAccepted({});
    setSelection({ start: 0, end: 0, text: "" });
    setNotice("Applied the reviewed Gemini draft to the selected passage only. All other page text remains unchanged.");
  }

  function applyAccepted() {
    const chosen = suggestions.filter((item) => accepted[item.id]);
    if (!chosen.length || !currentPage) return;
    const ordered = [...chosen].sort((a, b) => b.start - a.start);
    const sourceEdits = [];
    if (!manualTextEdited) {
      try {
        for (const item of chosen) {
          sourceEdits.push(mapAcceptedRangeToOriginal(currentPage, currentPage.page, item.start, item.end, item.replacement, acceptedEdits));
        }
      } catch (mappingError) {
        setError(mappingError.message);
        return;
      }
    }
    let revised = currentPage.text;
    for (const item of ordered) {
      if (revised.slice(item.start, item.end) !== item.original) {
        setError("The selected text changed. Refresh suggestions before applying."); return;
      }
      revised = revised.slice(0, item.start) + item.replacement + revised.slice(item.end);
    }
    setPages((previous) => previous.map((page, index) => index === pageIndex ? { ...page, text: revised } : page));
    if (sourceEdits.length) setAcceptedEdits((previous) => [...previous, ...sourceEdits]);
    setSuggestions([]); setAccepted({}); setSelection({ start: 0, end: 0, text: "" });
    setNotice("Applied " + chosen.length + " approved change(s) to page " + currentPage.page + ". Unselected text was left unchanged.");
  }

  function exportText() {
    if (!pages.length) return;
    const output = pages.map((page) => "--- Page " + page.page + " ---\n" + page.text).join("\n\n");
    saveText(documentName || "document.pdf", output);
  }

  async function exportPdf() {
    if (!canExportPdf || !file) return;
    setLoading(true); setError(""); setNotice("");
    try {
      const request = requireAuthenticatedFetch();
      const body = new FormData();
      body.append("file", file);
      body.append("accepted_replacements", JSON.stringify(acceptedEdits));
      const response = await request(API_BASE + "/api/humanizer/pdf/reconstruct", { method: "POST", body });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message || "The PDF could not be reconstructed safely.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = (documentName || "document.pdf").replace(/\.pdf$/i, "") + "-humanized.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Revised PDF created with " + acceptedEdits.length + " approved replacement(s). The original PDF remains unchanged.");
    } catch (exportError) {
      setError(exportError.message || "PDF reconstruction failed.");
    } finally {
      setLoading(false);
    }
  }

  const changedPages = useMemo(() => pages.filter((page) => page.text !== page.originalText).length, [pages]);

  return (
    <main className={embedded ? "min-h-full bg-app px-3 py-3 text-fg sm:px-5" : "min-h-[calc(100vh-5rem)] bg-app px-3 py-4 text-fg sm:px-6 lg:px-8"}>
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-accent">RevelaAI · Writing Studio</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-fg sm:text-3xl">Humanizer Studio</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-fg-secondary">A focused document studio for precise, user-approved edits. Paste text or open a PDF, review every suggestion, then export your revision.</p>
          </div>
          {pages.length > 0 && (
            <button onClick={exportText} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-fg-secondary hover:bg-surface-2">
              Export revised text
            </button>
          )}
          {canExportPdf && (
            <button onClick={exportPdf} disabled={loading} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-success px-3 py-2 text-xs font-semibold text-inverse hover:opacity-90 disabled:opacity-40">
              {loading ? "Building PDF…" : "Download revised PDF"}
            </button>
          )}
        </header>

        <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5" aria-labelledby="humanizer-upload-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="humanizer-upload-title" className="text-sm font-bold text-fg">Open a PDF</h2>
              <p className="mt-1 text-xs text-muted">Up to 20 MB · extracted in memory · original file remains untouched</p>
            </div>
            {documentName && <span className="max-w-full truncate rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-fg-secondary">{documentName}</span>}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input type="file" accept="application/pdf,.pdf" onChange={(event) => { setFile(event.target.files?.[0] || null); setPages([]); setPageIndex(0); setAcceptedEdits([]); setManualTextEdited(false); setSuggestions([]); setAccepted({}); setGeminiDraft(null); setSelection({ start: 0, end: 0, text: "" }); setDocumentName(""); }}
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-input p-2 text-sm text-fg file:mr-3 file:rounded-lg file:border-0 file:bg-surface-3 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-fg-secondary" />
            <button onClick={uploadPdf} disabled={!file || loading}
              className="min-h-11 shrink-0 rounded-xl bg-chart-3 px-5 py-2.5 text-sm font-bold text-inverse transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
              {loading ? "Extracting…" : "Extract PDF text"}
            </button>
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-fg">Or paste your text</h3>
                <p className="mt-1 text-xs text-muted">Paste an essay, paragraph or selected passage directly into the studio.</p>
              </div>
              <span className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[10px] font-semibold text-muted">Text mode</span>
            </div>
            <textarea value={pastedText} onChange={(event) => setPastedText(event.target.value)} rows={5}
              placeholder="Paste or type the text you want to refine…"
              className="mt-3 min-h-32 w-full resize-y rounded-xl border border-line bg-input p-3 text-sm leading-6 text-fg outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10" />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-muted">{pastedText.trim() ? pastedText.trim().split(/\\s+/).filter(Boolean).length.toLocaleString() + " words" : "Your original text is not changed until you approve edits."}</span>
              <button type="button" onClick={loadPastedText} disabled={!pastedText.trim() || loading}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-inverse transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">
                Load text into studio
              </button>
            </div>
          </div>
          <p className="mt-3 border-t border-line pt-3 text-[11px] leading-5 text-muted">
            Privacy: PDFs are processed in memory. Local suggestions do not call Gemini; Gemini receives only the passage you select. No change is applied until you approve it. Pasted text can be exported as revised TXT; original PDF layout export is available only when you upload a supported PDF.
          </p>
        </section>

        {error && <div role="alert" className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}
        {notice && <div role="status" className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-accent">{notice}</div>}

        {pages.length > 0 && (
          <section className="grid items-start gap-4 xl:grid-cols-[220px_minmax(0,1fr)_minmax(19rem,0.82fr)]">
            <aside className="space-y-3 xl:sticky xl:top-4">
              <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-[.14em] text-muted">Document</h2>
                  <span className="rounded-full bg-accent/10 px-2 py-1 text-[10px] font-bold text-accent">{pages.length} page{pages.length === 1 ? "" : "s"}</span>
                </div>
                <p className="mt-3 break-words text-sm font-bold text-fg">{documentName || "Untitled document"}</p>
                <p className="mt-1 text-[11px] leading-5 text-muted">{pages.reduce((total, page) => total + page.text.split(/\\s+/).filter(Boolean).length, 0).toLocaleString()} words · {changedPages} revised page{changedPages === 1 ? "" : "s"}</p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-3"><div className="h-full rounded-full bg-accent transition-all" style={{ width: (pages.length ? Math.min(100, changedPages / pages.length * 100) : 0) + "%" }} /></div>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-3 shadow-sm">
                <h3 className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[.14em] text-muted">Pages</h3>
                <div className="flex gap-2 overflow-x-auto xl:flex-col xl:overflow-visible">
                  {pages.map((page, index) => (
                    <button key={page.page} type="button" onClick={() => { setPageIndex(index); setSuggestions([]); setGeminiDraft(null); setAccepted({}); setSelection({ start: 0, end: 0, text: "" }); }}
                      aria-current={pageIndex === index ? "page" : undefined}
                      className={"flex min-w-[132px] items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition xl:min-w-0 " + (pageIndex === index ? "border-accent/40 bg-accent/10 text-accent" : "border-transparent text-fg-secondary hover:border-line hover:bg-surface-2")}>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-[11px] font-bold tabular-nums">{String(page.page).padStart(2, "0")}</span>
                      <span className="min-w-0 flex-1"><span className="block text-xs font-bold">Page {page.page}</span><span className="mt-0.5 block text-[10px] text-muted">{page.text.split(/\\s+/).filter(Boolean).length} words</span></span>
                      {page.text !== page.originalText ? <span className="h-2 w-2 shrink-0 rounded-full bg-success" title="Revised"/> : null}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-line bg-surface-2 p-3">
                <p className="text-[11px] font-bold text-fg-secondary">Integrity controls</p>
                <p className="mt-1 text-[11px] leading-5 text-muted">Only approved selections are changed. Unselected content stays untouched.</p>
                <div className="mt-3 flex items-center justify-between text-[10px]"><span className="text-muted">Approved edits</span><strong className="tabular-nums text-accent">{acceptedEdits.length}</strong></div>
              </div>
            </aside>
            <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
                <div>
                  <h2 className="font-semibold">02 · Select text to improve</h2>
                  <p className="mt-1 text-xs text-muted">Highlight text inside the page editor.</p>
                  <p className="mt-1 text-[11px] text-muted">{currentPage.layoutSupported ? "Native text geometry detected on this page." : (currentPage.layoutReason || "This page can be edited as text, but safe PDF reconstruction is unavailable.")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button disabled={pageIndex === 0} onClick={() => { setPageIndex((v) => v - 1); setSuggestions([]); setGeminiDraft(null); setSelection({start:0,end:0,text:""}); }} className="rounded-lg border border-line px-3 py-2 text-xs text-fg-secondary hover:bg-surface-2 disabled:opacity-40">Previous</button>
                  <span className="text-xs tabular-nums text-muted">{pageIndex + 1} / {pages.length}</span>
                  <button disabled={pageIndex >= pages.length - 1} onClick={() => { setPageIndex((v) => v + 1); setSuggestions([]); setGeminiDraft(null); setSelection({start:0,end:0,text:""}); }} className="rounded-lg border border-line px-3 py-2 text-xs text-fg-secondary hover:bg-surface-2 disabled:opacity-40">Next</button>
                </div>
              </div>
              <div className="p-4">
                <textarea ref={editorRef} value={currentPage.text} onChange={(event) => { setManualTextEdited(true); setPages((previous) => previous.map((page,index) => index === pageIndex ? { ...page, text: event.target.value } : page)); }} onMouseUp={captureSelection} onKeyUp={captureSelection} onSelect={captureSelection} spellCheck className="min-h-[28rem] w-full resize-y rounded-xl border border-line bg-surface-2 p-4 font-serif text-sm leading-7 text-fg outline-none focus:border-accent focus:ring-2 focus:ring-accent/10" placeholder="Extracted page text appears here…" />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-muted">{currentPage.text.length.toLocaleString()} characters · {currentPage.text.split(/\s+/).filter(Boolean).length} words</span><span className="text-xs text-muted">Selection: {selection.text.length} characters</span></div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button onClick={getSuggestions} disabled={loading || !selection.text.trim()} className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-inverse hover:bg-accent-hover disabled:opacity-40">{loading ? "Processing…" : "Local suggestions"}</button>
                  <button onClick={generateWithGemini} disabled={loading || !selection.text.trim()} className="rounded-xl border border-chart-3/30 bg-chart-3/5 px-5 py-3 text-sm font-semibold text-chart-3 hover:bg-chart-3/10 disabled:opacity-40"> {loading ? "Generating…" : "Produce with Gemini"}</button>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-muted">The Gemini action sends only this selected passage to the configured Gemini text model. It may use your Gemini API quota or incur provider charges. If Gemini is unavailable, no other model is substituted.</p>
              </div>
            </div>

            <aside className="space-y-4">

              {geminiDraft && (
                <div className="rounded-2xl border border-chart-3/20 bg-chart-3/5 p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold">Gemini draft · review required</h2>
                    <span className="rounded-lg bg-chart-3/10 px-2 py-1 text-[11px] font-semibold text-chart-3">{geminiDraft.model}</span>
                  </div>
                  <div className="mt-3 space-y-3">
                    <div><p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Selected original</p><p className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-surface-2 p-3 text-sm text-fg-secondary">{geminiDraft.original}</p></div>
                    <div><p className="text-[11px] font-semibold uppercase tracking-wide text-chart-3">Gemini version</p><p className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-surface p-3 text-sm ">{geminiDraft.text}</p></div>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button onClick={applyGeminiDraft} disabled={!geminiDraft.text.trim()} className="rounded-xl bg-success px-4 py-3 text-sm font-semibold text-inverse hover:bg-success/85 disabled:opacity-40">Apply this passage</button>
                    <button onClick={() => setGeminiDraft(null)} className="rounded-xl border border-line px-4 py-3 text-sm font-semibold text-fg-secondary hover:bg-surface-2">Discard draft</button>
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-muted">Review the wording and verify that every fact, reference, and intended meaning is still correct before applying.</p>
                </div>
              )}
              <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm  ">
                <div className="flex items-center justify-between"><h2 className="font-semibold">03 · Review suggestions</h2><span className="text-xs text-muted">{suggestions.length} found</span></div>
                {suggestions.length === 0 ? <p className="mt-4 rounded-xl bg-surface-2 p-4 text-sm text-muted ">Your suggestions appear here. Nothing changes until you accept it.</p> : (
                  <div className="mt-4 max-h-[32rem] space-y-3 overflow-y-auto pr-1">
                    {suggestions.map((item) => (
                      <label key={item.id} className="block cursor-pointer rounded-xl border border-line p-3 hover:border-chart-3/30  hover:border-chart-3/45">
                        <div className="flex items-start gap-3"><input type="checkbox" checked={Boolean(accepted[item.id])} onChange={(event) => setAccepted((old) => { const next = { ...old }; suggestions.filter((candidate) => candidate.start === item.start && candidate.end === item.end).forEach((candidate) => { delete next[candidate.id]; }); if (event.target.checked) next[item.id] = true; return next; })} className="mt-1 h-4 w-4 accent-[var(--tw-accent)]" /><div className="min-w-0 flex-1"><p className="break-words text-xs text-muted">Replace “{item.original}” with</p><p className="mt-1 break-words text-sm font-semibold text-chart-3">{item.replacement}</p><p className="mt-2 text-xs text-muted">{item.reason}</p></div></div>
                      </label>
                    ))}
                  </div>
                )}
                {suggestions.length > 0 && <button onClick={applyAccepted} disabled={!acceptedCount} className="mt-4 w-full rounded-xl bg-success px-4 py-3 text-sm font-semibold text-inverse hover:bg-success/85 disabled:opacity-40">Apply {acceptedCount} approved change(s)</button>}
              </div>
              <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm  ">
                <h2 className="font-semibold">04 · Export your revision</h2>
                <p className="mt-2 text-sm text-muted">{changedPages} page(s) changed. The source PDF remains untouched.</p>
                <button onClick={exportText} className="mt-4 w-full rounded-xl border border-line px-4 py-3 text-sm font-semibold text-fg-secondary hover:bg-surface-2">Download revised text (.txt)</button>
                {typeof onExportToChat === "function" && <button type="button" onClick={() => onExportToChat(pages.map((page) => page.text).join("\n\n"))} disabled={!pages.length || !changedPages} className="mt-2 w-full rounded-xl border border-accent/25 bg-accent/5 px-4 py-3 text-sm font-semibold text-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40">Send revised text to AI chat</button>}
                <button onClick={exportPdf} disabled={!canExportPdf || loading} className="mt-2 w-full rounded-xl bg-success px-4 py-3 text-sm font-semibold text-inverse hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Download revised PDF ({acceptedEdits.length} approved change(s))</button>
                <p className="mt-3 text-[11px] leading-5 text-muted">
                  PDF export supports tracked, approved changes on native-text pages. It currently rejects OCR-only pages, partial-word or cross-line selections, unsupported fonts and replacements wider than the original selection.
                  {manualTextEdited ? " Manual textarea edits are not mapped to PDF coordinates; use TXT export or re-open the source PDF to create a PDF revision." : ""}
                  {pdfExportUnsupported ? " At least one approved edit is on a page without supported native text geometry." : ""}
                </p>
              </div>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
