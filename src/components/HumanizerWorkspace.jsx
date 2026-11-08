import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, FileText, Loader2, ShieldAlert, Sparkles, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const API_BASE = String(import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com").replace(/\/$/, "");

function authHeaders() {
  try {
    const token = localStorage.getItem("revelacode_access_token") || localStorage.getItem("access_token") || localStorage.getItem("token");
    const type = localStorage.getItem("revelacode_token_type") || "Bearer";
    return token ? { Authorization: `${type} ${token}` } : {};
  } catch {
    return {};
  }
}

async function readResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || payload?.detail || "The Humanizer request failed.");
  return payload?.data || {};
}

export default function HumanizerWorkspace() {
  const navigate = useNavigate();
  const { user, isGuest, authFetch } = useAuth();
  const fileInput = useRef(null);
  const pageEditor = useRef(null);
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(0);
  const [selection, setSelection] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [accepted, setAccepted] = useState({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [complianceStatus, setComplianceStatus] = useState("loading");
  const [humanizerNotice, setHumanizerNotice] = useState(null);
  const [complianceError, setComplianceError] = useState("");

  const currentPage = pages[activePage] || null;
  const acceptedCount = useMemo(() => Object.values(accepted).filter(Boolean).length, [accepted]);

  useEffect(() => {
    let active = true;
    const loadCompliance = async () => {
      if (!user || isGuest) {
        setComplianceStatus("required");
        return;
      }
      setComplianceStatus("loading");
      setComplianceError("");
      try {
        const [noticeResponse, acknowledgementResponse] = await Promise.all([
          authFetch(`${COMPLIANCE_API_BASE}/api/compliance/notices?feature=humanizer`, { method: "GET" }),
          authFetch(`${COMPLIANCE_API_BASE}/api/compliance/acknowledgements`, { method: "GET" }),
        ]);
        const noticePayload = await noticeResponse.json().catch(() => ({}));
        const acknowledgementPayload = await acknowledgementResponse.json().catch(() => ({}));
        if (!noticeResponse.ok || !acknowledgementResponse.ok || noticePayload.success === false || acknowledgementPayload.success === false) {
          throw new Error(noticePayload.message || acknowledgementPayload.message || "Could not load the Humanizer use notice.");
        }
        const notice = noticePayload.notice;
        if (!notice?.version || !notice?.body) throw new Error("The Humanizer use notice is unavailable.");
        if (!active) return;
        setHumanizerNotice(notice);
        const acknowledgement = acknowledgementPayload.acknowledgements?.humanizer;
        setComplianceStatus(acknowledgement?.version === notice.version ? "accepted" : "required");
      } catch (err) {
        if (!active) return;
        setComplianceStatus("error");
        setComplianceError(err.message || "Could not verify the Humanizer notice.");
      }
    };
    loadCompliance();
    return () => { active = false; };
  }, [user?.id, isGuest, authFetch]);

  const acceptHumanizerNotice = async () => {
    if (!humanizerNotice?.version) return;
    setComplianceError("");
    try {
      const response = await authFetch(`${COMPLIANCE_API_BASE}/api/compliance/acknowledgements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: "humanizer", version: humanizerNotice.version, accepted: true }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success === false) throw new Error(payload.message || "Could not save your acknowledgement.");
      setComplianceStatus("accepted");
    } catch (err) {
      setComplianceError(err.message || "Could not save your acknowledgement.");
    }
  };

  const uploadPdf = async (nextFile) => {
    if (!nextFile) return;
    setError(""); setNotice(""); setSuggestions([]); setAccepted({}); setSelection(null);
    if (!nextFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Choose a PDF document.");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", nextFile);
      const response = await fetch(`${API_BASE}/api/humanizer/pdf/extract`, {
        method: "POST",
        headers: authHeaders(),
        body: form,
      });
      const data = await readResponse(response);
      setFile(nextFile);
      setPages((data.pages || []).map((page) => ({ ...page, originalText: page.text })));
      setActivePage(0);
      setNotice(`${data.page_count || 0} pages extracted. Your original PDF has not been changed or uploaded to permanent storage.`);
    } catch (err) {
      setError(err.message || "Could not read this PDF.");
    } finally {
      setBusy(false);
    }
  };

  const captureSelection = () => {
    const node = pageEditor.current;
    if (!node || node.selectionStart === node.selectionEnd || !currentPage) return;
    const start = node.selectionStart;
    const end = node.selectionEnd;
    const text = currentPage.text.slice(start, end);
    if (!text.trim()) return;
    setSelection({
      start,
      end,
      text,
      before: currentPage.text.slice(Math.max(0, start - 500), start),
      after: currentPage.text.slice(end, Math.min(currentPage.text.length, end + 500)),
    });
    setSuggestions([]);
    setAccepted({});
    setError("");
  };

  const requestSuggestions = async () => {
    if (!selection) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`${API_BASE}/api/humanizer/suggest`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_text: selection.text,
          context_before: selection.before,
          context_after: selection.after,
          style: "natural",
        }),
      });
      const data = await readResponse(response);
      setSuggestions(data.suggestions || []);
      setAccepted({});
      if (!(data.suggestions || []).length) setNotice("No safe local alternatives were found for this selection. Try a different word or phrase.");
    } catch (err) {
      setError(err.message || "Could not generate suggestions.");
    } finally {
      setBusy(false);
    }
  };

  const applyAccepted = async () => {
    if (!selection || !acceptedCount || !currentPage) return;
    const chosen = suggestions.filter((item, index) => accepted[index]);
    setBusy(true); setError("");
    try {
      const response = await fetch(`${API_BASE}/api/humanizer/apply`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ source_text: selection.text, accepted_replacements: chosen }),
      });
      const data = await readResponse(response);
      const revised = String(data.text || selection.text);
      setPages((previous) => previous.map((page, index) => index === activePage
        ? { ...page, text: page.text.slice(0, selection.start) + revised + page.text.slice(selection.end) }
        : page));
      setSelection(null); setSuggestions([]); setAccepted({});
      setNotice(`${chosen.length} accepted change(s) applied to page ${activePage + 1}. Unselected text remains unchanged.`);
    } catch (err) {
      setError(err.message || "The selected changes could not be applied.");
    } finally {
      setBusy(false);
    }
  };

  const downloadText = () => {
    const output = pages.map((page, index) => `PAGE ${index + 1}\n\n${page.text}`).join("\n\n----------------------------------------\n\n");
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(file?.name || "document").replace(/\.pdf$/i, "")}-humanized.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!user && isGuest) {
    return <div className="mx-auto max-w-3xl p-8"><h1 className="text-2xl font-bold">Sign in to use Humanizer</h1><p className="mt-2 text-sm text-slate-500">Humanizer uses your authenticated RevelaCode account.</p><button className="mt-5 rounded-xl bg-emerald-600 px-4 py-2 text-white" onClick={() => navigate("/")}>Sign in</button></div>;
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-3 py-5 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="rounded-xl border border-slate-200 p-2 dark:border-slate-800" aria-label="Go back"><ArrowLeft size={18}/></button>
            <div><div className="flex items-center gap-2"><Sparkles className="text-emerald-500" size={18}/><h1 className="text-xl font-black sm:text-2xl">RevelaAI Humanizer</h1></div><p className="mt-1 text-xs text-slate-500">Selective editing · Local language tools · No paid model calls</p></div>
          </div>
          {pages.length > 0 && <button onClick={downloadText} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700">Export revised text</button>}
        </header>

        {complianceStatus !== "accepted" && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20 sm:p-5" aria-live="polite">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" size={19}/>
              <div className="min-w-0">
                <h2 className="font-bold text-amber-950 dark:text-amber-100">Before using Humanizer</h2>
                {complianceStatus === "loading" && <p className="mt-2 text-sm text-amber-900 dark:text-amber-200">Checking the current use notice…</p>}
                {humanizerNotice && <><p className="mt-2 text-sm font-semibold text-amber-950 dark:text-amber-100">{humanizerNotice.title}</p><p className="mt-1 text-sm leading-6 text-amber-900 dark:text-amber-200">{humanizerNotice.body}</p></>}
                {complianceError && <p role="alert" className="mt-2 text-sm text-rose-700 dark:text-rose-300">{complianceError}</p>}
                <button type="button" onClick={acceptHumanizerNotice} disabled={!humanizerNotice || complianceStatus === "loading"} className="mt-4 rounded-xl bg-amber-900 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-200 dark:text-amber-950">I have read and understand</button>
                <p className="mt-2 text-[11px] text-amber-800 dark:text-amber-300">Your acknowledgement is saved to your RevelaCode account and is renewed if this notice materially changes.</p>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div><h2 className="font-bold">Open a PDF document</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">Upload a PDF, open a page, and highlight only the words or phrases you want to improve. The original file is never overwritten.</p></div>
            <input ref={fileInput} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => uploadPdf(event.target.files?.[0])}/>
            <button onClick={() => fileInput.current?.click()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"><Upload size={17}/> Choose PDF</button>
          </div>
          {file && <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><FileText size={15}/>{file.name}</p>}
        </section>

        {error && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}
        {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">{notice}</div>}

        {busy && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={16}/> Working locally…</div>}

        {pages.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div><h2 className="font-bold">Document text</h2><p className="text-xs text-slate-500">Select text inside the page to get suggestions.</p></div>
                <div className="flex items-center gap-2"><button disabled={activePage===0} onClick={() => {setActivePage((v)=>v-1);setSelection(null);setSuggestions([]);}} className="rounded-lg border p-2 disabled:opacity-30 dark:border-slate-700" aria-label="Previous page"><ChevronLeft size={17}/></button><span className="min-w-[76px] text-center text-xs font-semibold">Page {activePage+1} / {pages.length}</span><button disabled={activePage===pages.length-1} onClick={() => {setActivePage((v)=>v+1);setSelection(null);setSuggestions([]);}} className="rounded-lg border p-2 disabled:opacity-30 dark:border-slate-700" aria-label="Next page"><ChevronRight size={17}/></button></div>
              </div>
              <textarea ref={pageEditor} value={currentPage?.text || ""} readOnly onMouseUp={captureSelection} onKeyUp={captureSelection} onTouchEnd={captureSelection} className="min-h-[58vh] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 font-serif text-[15px] leading-7 text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" aria-label={`Extracted text from page ${activePage+1}`}/>
              <p className="mt-2 text-[11px] text-slate-400">Text extraction view. Original PDF layout, images and typography are not edited in this first release.</p>
            </section>

            <aside className="space-y-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="font-bold">Your selection</h2>
                {selection ? <><p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 dark:bg-slate-950">{selection.text}</p><button onClick={requestSuggestions} disabled={busy} className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white dark:bg-emerald-600"><Sparkles size={15} className="mr-2 inline"/>Suggest alternatives</button></> : <p className="mt-2 text-sm text-slate-500">Highlight a word or phrase in the document text to begin. Whole-document rewriting is not performed.</p>}
              </section>
              {suggestions.length > 0 && <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between"><h2 className="font-bold">Review suggestions</h2><span className="text-xs text-slate-500">{acceptedCount} selected</span></div>
                <div className="mt-3 space-y-2">
                  {suggestions.map((item,index)=><label key={`${item.start}-${item.end}-${index}`} className="block cursor-pointer rounded-xl border border-slate-200 p-3 transition hover:border-emerald-400 dark:border-slate-700"><span className="flex items-start gap-2"><input type="checkbox" checked={Boolean(accepted[index])} onChange={(event)=>setAccepted((old)=>({...old,[index]:event.target.checked}))} className="mt-1 accent-emerald-600"/><span className="min-w-0 text-sm"><span className="block text-xs text-slate-400 line-through">{item.original}</span><span className="mt-1 block font-semibold text-emerald-700 dark:text-emerald-300">{item.replacement}</span><span className="mt-1 block text-xs text-slate-500">{item.reason}</span></span></span></label>)}
                </div>
                <button onClick={applyAccepted} disabled={!acceptedCount || busy} className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"><Check size={15} className="mr-2 inline"/>Apply {acceptedCount} accepted change(s)</button>
              </section>}
            </aside>
          </div>
        )}

        <p className="text-center text-xs text-slate-400">Humanizer suggestions are local and deterministic. Review every change for meaning and accuracy. This tool is for clearer writing, not AI-detector evasion.</p>
      </div>
    </main>
  );
}
