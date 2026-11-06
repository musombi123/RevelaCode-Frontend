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
    <main className={embedded ? "min-h-full bg-slate-50 px-3 py-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-5" : "min-h-[calc(100vh-5rem)] bg-slate-50 px-3 py-5 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8"}>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300">REVELAAI · SELECTIVE HUMANIZATION</div>
            <h1 className="text-3xl font-bold tracking-tight">Selective Humanizer</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">Improve only the words and phrases you choose. Local alternatives are available instantly; Gemini generates a draft only when you explicitly request it.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-lg bg-emerald-50 px-3 py-2 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Local suggestions available</span>
            <span className="rounded-lg bg-slate-200 px-3 py-2 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">Gemini runs on request</span>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div><h2 className="font-semibold">01 · Open a PDF</h2><p className="mt-1 text-xs text-slate-500">PDF up to 20 MB · processed in memory</p></div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} className="min-w-0 flex-1 rounded-xl border border-slate-300 p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold dark:border-slate-700 dark:bg-slate-950 dark:file:bg-slate-800" />
              <button onClick={uploadPdf} disabled={!file || loading} className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50">{loading ? "Working…" : "Extract PDF text"}</button>
            </div>
            {documentName && <p className="mt-3 truncate text-xs text-slate-500">Document: {documentName}</p>}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h2 className="font-semibold">Private by design</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>• The uploaded PDF is not stored by this endpoint.</li>
              <li>• Local suggestions do not call a language model.</li>
              <li>• Gemini receives only the passage you selected when you press its generation button.</li>
              <li>• Gemini drafts and local replacements require your approval before they change the page.</li>
            </ul>
          </div>
        </section>

        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}
        {notice && <div role="status" className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200">{notice}</div>}

        {pages.length > 0 && (
          <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
                <div><h2 className="font-semibold">02 · Select text to improve</h2><p className="mt-1 text-xs text-slate-500">Highlight text inside the page editor.</p></div>
                <div className="flex items-center gap-2">
                  <button disabled={pageIndex === 0} onClick={() => { setPageIndex((v) => v - 1); setSuggestions([]); setGeminiDraft(null); setSelection({start:0,end:0,text:""}); }} className="rounded-lg border px-3 py-2 text-xs disabled:opacity-40 dark:border-slate-700">Previous</button>
                  <span className="text-xs tabular-nums text-slate-500">{pageIndex + 1} / {pages.length}</span>
                  <button disabled={pageIndex >= pages.length - 1} onClick={() => { setPageIndex((v) => v + 1); setSuggestions([]); setGeminiDraft(null); setSelection({start:0,end:0,text:""}); }} className="rounded-lg border px-3 py-2 text-xs disabled:opacity-40 dark:border-slate-700">Next</button>
                </div>
              </div>
              <div className="p-4">
                <textarea ref={editorRef} value={currentPage.text} onChange={(event) => setPages((previous) => previous.map((page,index) => index === pageIndex ? { ...page, text: event.target.value } : page))} onMouseUp={captureSelection} onKeyUp={captureSelection} onSelect={captureSelection} spellCheck className="min-h-[28rem] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 font-serif text-sm leading-7 text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-violet-950" placeholder="Extracted page text appears here…" />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-500">{currentPage.text.length.toLocaleString()} characters · {currentPage.text.split(/\s+/).filter(Boolean).length} words</span><span className="text-xs text-slate-500">Selection: {selection.text.length} characters</span></div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button onClick={getSuggestions} disabled={loading || !selection.text.trim()} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-40 dark:bg-violet-600 dark:hover:bg-violet-500">{loading ? "Processing…" : "Local suggestions"}</button>
                  <button onClick={generateWithGemini} disabled={loading || !selection.text.trim()} className="rounded-xl border border-violet-300 bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-800 hover:bg-violet-100 disabled:opacity-40 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-200 dark:hover:bg-violet-950"> {loading ? "Generating…" : "Produce with Gemini"}</button>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-slate-500">The Gemini action sends only this selected passage to the configured Gemini text model. It may use your Gemini API quota or incur provider charges. If Gemini is unavailable, no other model is substituted.</p>
              </div>
            </div>

            <aside className="space-y-4">

              {geminiDraft && (
                <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 shadow-sm dark:border-violet-900 dark:bg-violet-950/30">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold">Gemini draft · review required</h2>
                    <span className="rounded-lg bg-violet-100 px-2 py-1 text-[11px] font-semibold text-violet-800 dark:bg-violet-900 dark:text-violet-200">{geminiDraft.model}</span>
                  </div>
                  <div className="mt-3 space-y-3">
                    <div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Selected original</p><p className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-white/80 p-3 text-sm dark:bg-slate-950/60">{geminiDraft.original}</p></div>
                    <div><p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">Gemini version</p><p className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-white p-3 text-sm dark:bg-slate-950">{geminiDraft.text}</p></div>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button onClick={applyGeminiDraft} disabled={!geminiDraft.text.trim()} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40">Apply this passage</button>
                    <button onClick={() => setGeminiDraft(null)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-white dark:border-slate-700 dark:hover:bg-slate-900">Discard draft</button>
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-slate-500">Review the wording and verify that every fact, reference, and intended meaning is still correct before applying.</p>
                </div>
              )}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between"><h2 className="font-semibold">03 · Review suggestions</h2><span className="text-xs text-slate-500">{suggestions.length} found</span></div>
                {suggestions.length === 0 ? <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950">Your suggestions appear here. Nothing changes until you accept it.</p> : (
                  <div className="mt-4 max-h-[32rem] space-y-3 overflow-y-auto pr-1">
                    {suggestions.map((item) => (
                      <label key={item.id} className="block cursor-pointer rounded-xl border border-slate-200 p-3 hover:border-violet-300 dark:border-slate-700 dark:hover:border-violet-700">
                        <div className="flex items-start gap-3"><input type="checkbox" checked={Boolean(accepted[item.id])} onChange={(event) => setAccepted((old) => { const next = { ...old }; suggestions.filter((candidate) => candidate.start === item.start && candidate.end === item.end).forEach((candidate) => { delete next[candidate.id]; }); if (event.target.checked) next[item.id] = true; return next; })} className="mt-1 h-4 w-4 accent-violet-600" /><div className="min-w-0 flex-1"><p className="break-words text-xs text-slate-500">Replace “{item.original}” with</p><p className="mt-1 break-words text-sm font-semibold text-violet-700 dark:text-violet-300">{item.replacement}</p><p className="mt-2 text-xs text-slate-500">{item.reason}</p></div></div>
                      </label>
                    ))}
                  </div>
                )}
                {suggestions.length > 0 && <button onClick={applyAccepted} disabled={!acceptedCount} className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40">Apply {acceptedCount} approved change(s)</button>}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="font-semibold">04 · Export your revision</h2>
                <p className="mt-2 text-sm text-slate-500">{changedPages} page(s) changed. Export the revised extracted text. The source PDF remains untouched.</p>
                <button onClick={exportText} className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Download revised text (.txt)</button>
                <p className="mt-3 text-[11px] leading-5 text-slate-500">This first release does not yet reconstruct PDF layout. Scanned PDFs require local Tesseract OCR on the server.</p>
              </div>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
