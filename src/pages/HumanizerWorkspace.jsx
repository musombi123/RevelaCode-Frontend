import React, { useMemo, useRef, useState } from "react";
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

export default function HumanizerWorkspace({ embedded = false }) {
  const auth = useAuth();
  const editorRef = useRef(null);
  const [file, setFile] = useState(null);
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

  const currentPage = pages[pageIndex] || null;
  const acceptedCount = Object.values(accepted).filter(Boolean).length;

  async function authHeaders() {
    const token = typeof auth?.getAccessToken === "function"
      ? await auth.getAccessToken()
      : localStorage.getItem("revelacode_access_token") || localStorage.getItem("access_token") || localStorage.getItem("token") || "";
    const tokenType = typeof auth?.getTokenType === "function" ? await auth.getTokenType() : "Bearer";
    // The API is the authentication authority. Send the current session when
    // available, but never redirect or block locally; the backend returns the
    // authoritative 401/403 response if this session is not accepted.
    if (!token) return {};
    return { Authorization: (tokenType || "Bearer") + " " + String(token).replace(/^Bearer\s+/i, "") };
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

  async function uploadPdf() {
    if (!file) return;
    setLoading(true); setError(""); setNotice("");
    try {
      const headers = await authHeaders();
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(API_BASE + "/api/humanizer/pdf/extract", { method: "POST", headers, body });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.error?.message || "Could not extract this PDF.");
      const extracted = (payload.data.pages || []).map((page) => ({
        page: page.page, text: page.text || "", originalText: page.text || "",
        extractionMethod: page.extraction_method || "native",
      }));
      if (!extracted.length) throw new Error("No readable pages were found in this PDF.");
      setPages(extracted); setPageIndex(0); setDocumentName(payload.data.filename || file.name);
      setSuggestions([]); setAccepted({}); setGeminiDraft(null); setSelection({ start: 0, end: 0, text: "" });
      setNotice("Extracted " + extracted.length + " page(s). Select only the words or phrases you want to improve.");
    } catch (e) { setError(e.message || "PDF extraction failed."); }
    finally { setLoading(false); }
  }

  async function getSuggestions() {
    if (!selection.text.trim()) { setError("Highlight a word or phrase in the page text first."); return; }
    setLoading(true); setError(""); setNotice("");
    try {
      const headers = await authHeaders();
      const response = await fetch(API_BASE + "/api/humanizer/suggest", {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" },
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
      const headers = await authHeaders();
      const response = await fetch(API_BASE + "/api/humanizer/generate", {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" },
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
    const revised = currentPage.text.slice(0, geminiDraft.start) + geminiDraft.text + currentPage.text.slice(geminiDraft.end);
    setPages((previous) => previous.map((page, index) => index === pageIndex ? { ...page, text: revised } : page));
    setGeminiDraft(null); setSuggestions([]); setAccepted({});
    setSelection({ start: 0, end: 0, text: "" });
    setNotice("Applied the reviewed Gemini draft to the selected passage only. All other page text remains unchanged.");
  }

  function applyAccepted() {
    const chosen = suggestions.filter((item) => accepted[item.id]);
    if (!chosen.length || !currentPage) return;
    const ordered = [...chosen].sort((a, b) => b.start - a.start);
    let revised = currentPage.text;
    for (const item of ordered) {
      if (revised.slice(item.start, item.end) !== item.original) {
        setError("The selected text changed. Refresh suggestions before applying."); return;
      }
      revised = revised.slice(0, item.start) + item.replacement + revised.slice(item.end);
    }
    setPages((previous) => previous.map((page, index) => index === pageIndex ? { ...page, text: revised } : page));
    setSuggestions([]); setAccepted({}); setSelection({ start: 0, end: 0, text: "" });
    setNotice("Applied " + chosen.length + " approved change(s) to page " + currentPage.page + ". Unselected text was left unchanged.");
  }

  function exportText() {
    if (!pages.length) return;
    const output = pages.map((page) => "--- Page " + page.page + " ---\n" + page.text).join("\n\n");
    saveText(documentName || "document.pdf", output);
  }

  const changedPages = useMemo(() => pages.filter((page) => page.text !== page.originalText).length, [pages]);

  return (
    <main className={embedded ? "min-h-full bg-app px-3 py-3 text-fg sm:px-5" : "min-h-[calc(100vh-5rem)] bg-app px-3 py-4 text-fg sm:px-6 lg:px-8"}>
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-accent">RevelaAI · Writing tool</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-fg sm:text-3xl">Selective Humanizer</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-fg-secondary">Improve only the passage you select. Local alternatives are instant; Gemini drafts only when you request them.</p>
          </div>
          {pages.length > 0 && (
            <button onClick={exportText} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-fg-secondary hover:bg-surface-2">
              Export revised text
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
            <input type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-input p-2 text-sm text-fg file:mr-3 file:rounded-lg file:border-0 file:bg-surface-3 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-fg-secondary" />
            <button onClick={uploadPdf} disabled={!file || loading}
              className="min-h-11 shrink-0 rounded-xl bg-chart-3 px-5 py-2.5 text-sm font-bold text-inverse transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
              {loading ? "Extracting…" : "Extract PDF text"}
            </button>
          </div>
          <p className="mt-3 border-t border-line pt-3 text-[11px] leading-5 text-muted">
            Privacy: the PDF is processed in memory. Local suggestions do not call Gemini; Gemini receives only the passage you select. No change is applied until you approve it.
          </p>
        </section>

        {error && <div role="alert" className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}
        {notice && <div role="status" className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-accent">{notice}</div>}

        {pages.length > 0 && (
          <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
            <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
                <div><h2 className="font-semibold">02 · Select text to improve</h2><p className="mt-1 text-xs text-muted">Highlight text inside the page editor.</p></div>
                <div className="flex items-center gap-2">
                  <button disabled={pageIndex === 0} onClick={() => { setPageIndex((v) => v - 1); setSuggestions([]); setGeminiDraft(null); setSelection({start:0,end:0,text:""}); }} className="rounded-lg border border-line px-3 py-2 text-xs text-fg-secondary hover:bg-surface-2 disabled:opacity-40">Previous</button>
                  <span className="text-xs tabular-nums text-muted">{pageIndex + 1} / {pages.length}</span>
                  <button disabled={pageIndex >= pages.length - 1} onClick={() => { setPageIndex((v) => v + 1); setSuggestions([]); setGeminiDraft(null); setSelection({start:0,end:0,text:""}); }} className="rounded-lg border border-line px-3 py-2 text-xs text-fg-secondary hover:bg-surface-2 disabled:opacity-40">Next</button>
                </div>
              </div>
              <div className="p-4">
                <textarea ref={editorRef} value={currentPage.text} onChange={(event) => setPages((previous) => previous.map((page,index) => index === pageIndex ? { ...page, text: event.target.value } : page))} onMouseUp={captureSelection} onKeyUp={captureSelection} onSelect={captureSelection} spellCheck className="min-h-[28rem] w-full resize-y rounded-xl border border-line bg-surface-2 p-4 font-serif text-sm leading-7 text-fg outline-none focus:border-accent focus:ring-2 focus:ring-accent/10" placeholder="Extracted page text appears here…" />
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
                <p className="mt-2 text-sm text-muted">{changedPages} page(s) changed. Export the revised extracted text. The source PDF remains untouched.</p>
                <button onClick={exportText} className="mt-4 w-full rounded-xl border border-line px-4 py-3 text-sm font-semibold text-fg-secondary hover:bg-surface-2">Download revised text (.txt)</button>
                <p className="mt-3 text-[11px] leading-5 text-muted">This first release does not yet reconstruct PDF layout. Scanned PDFs require local Tesseract OCR on the server.</p>
              </div>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
