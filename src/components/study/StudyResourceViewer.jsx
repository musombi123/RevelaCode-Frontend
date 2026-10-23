import React, { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Globe, RefreshCw, ShieldCheck } from "lucide-react";

const HISTORY_KEY = "revelacode_study_source_history_v1";

function readHistory() {
  try {
    const value = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(value) ? value.filter((entry) => entry && /^https?:\/\//i.test(entry.url || "")).slice(0, 8) : [];
  } catch {
    return [];
  }
}

export default function StudyResourceViewer({ source }) {
  const [history, setHistory] = useState(readHistory);
  const [copied, setCopied] = useState(false);
  const [frameFailed, setFrameFailed] = useState(false);
  const url = String(source?.url || "");
  let hostname = "";
  try { hostname = new URL(url).hostname; } catch { hostname = ""; }

  useEffect(() => {
    setFrameFailed(false);
    setCopied(false);
    if (!/^https?:\/\//i.test(url)) return;
    const entry = { title: String(source?.title || hostname || "Study source").slice(0, 180), url, openedAt: new Date().toISOString() };
    const next = [entry, ...readHistory().filter((item) => item.url !== url)].slice(0, 8);
    try { window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
    setHistory(next);
  }, [url, source?.title, hostname]);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const openSaved = (entry) => {
    // Same-app handoff is managed by the parent capture handler.
    window.dispatchEvent(new CustomEvent("revelacode:open-study-source", { detail: entry }));
  };

  if (!url || !/^https?:\/\//i.test(url)) {
    return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">The selected source URL is not valid.</div>;
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"><Globe size={19} /></span>
            <div className="min-w-0">
              <h3 className="break-words text-sm font-black text-slate-900 dark:text-white">{source?.title || hostname}</h3>
              <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">{hostname}</p>
            </div>
          </div>
          <button type="button" onClick={copyUrl} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied link" : "Copy source link"}
          </button>
        </div>

        {frameFailed && <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">This publisher may block embedded viewing. RevelaCode keeps the source information here, but the publisher controls whether its page can appear inside this reader.</div>}
        <iframe key={url} src={url} title={source?.title || "Study reference source"} loading="eager" referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" onError={() => setFrameFailed(true)} className="h-[72vh] min-h-[420px] w-full bg-white" />
        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400"><ShieldCheck size={13} className="mr-1 inline" /> Source page is displayed in RevelaCode where the publisher permits embedding. External pages are not guaranteed to be available offline.</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 underline dark:text-indigo-300">Publisher page <ExternalLink size={13} /></a>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-black text-slate-900 dark:text-white">Recently opened references</h3><span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Saved on this device</span></div>
        {history.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{history.map((entry) => <button key={entry.url} type="button" onClick={() => openSaved(entry)} className="flex min-w-0 items-start gap-2 rounded-xl border border-slate-200 p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:bg-indigo-950/20"><Globe size={14} className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-300" /><span className="min-w-0"><span className="block truncate text-xs font-bold text-slate-900 dark:text-white">{entry.title || entry.url}</span><span className="mt-1 block truncate text-[10px] text-slate-500 dark:text-slate-400">{entry.url}</span></span></button>)}</div> : <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Opened study references will appear here.</p>}
      </section>
    </div>
  );
}
