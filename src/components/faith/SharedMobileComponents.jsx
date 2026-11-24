import React, { useEffect, useState } from "react";
import { SignalLow, Sparkles, WifiOff, X, Send } from "lucide-react";

const savedQuestionKey = "revelacode_faith_saved_questions_v1";
const touch = "min-h-11 min-w-11 touch-manipulation rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 motion-reduce:transition-none";

export function ConnectivityPill({
  state = "online",
  offlineText = "Offline copy available",
  poorText = "Slow connection",
  onClick,
  ariaLabel,
}) {
  if (state === "online") return null;
  const offline = state === "offline";
  const Icon = offline ? WifiOff : SignalLow;
  const content = <>
    <Icon size={14} className="shrink-0"/>
    <span>{offline ? offlineText : poorText}</span>
  </>;
  const className = "inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200";
  return onClick
    ? <button type="button" onClick={onClick} aria-label={ariaLabel} className={className}>{content}</button>
    : <div role="status" aria-live="polite" className={className}>{content}</div>;
}

export function AskBar({
  online = true,
  onAsk,
  placeholder = "Ask about this lesson…",
  offlinePlaceholder,
  storageKey = savedQuestionKey,
}) {
  const [question, setQuestion] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [savedConfirmation, setSavedConfirmation] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [sendPrompt, setSendPrompt] = useState(false);

  const submit = () => {
    const prompt = question.trim();
    if (!prompt) return;
    onAsk?.(prompt);
    setQuestion("");
    setExpanded(false);
  };

  const saveForLater = () => {
    const prompt = question.trim();
    if (!prompt) return;
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (!Array.isArray(stored)) throw new Error("Invalid saved question list");
      localStorage.setItem(storageKey, JSON.stringify([...stored, { question: prompt, savedAt: new Date().toISOString() }]));
      setQuestion("");
      setExpanded(false);
      setSaveError("");
      setSavedConfirmation(true);
    } catch {
      setSaveError("Couldn't save this question on the device. Check available storage.");
    }
  };

  useEffect(() => {
    if (!online) { setSendPrompt(false); return; }
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
      setSendPrompt(Array.isArray(stored) && stored.length > 0);
    } catch {
      setSendPrompt(false);
    }
  }, [online, storageKey]);

  const sendSaved = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (!Array.isArray(stored) || !stored.length) { setSendPrompt(false); return; }
      const [first, ...remaining] = stored;
      localStorage.setItem(storageKey, JSON.stringify(remaining));
      setSendPrompt(remaining.length > 0);
      if (first?.question) onAsk?.(String(first.question));
    } catch {
      setSaveError("Couldn't read your saved question.");
    }
  };

  return <div className="min-w-0 space-y-2">
    <div className={"flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900 " + (expanded && online ? "flex-col items-stretch" : "")}>
      {online ? <>
        {expanded
          ? <textarea autoFocus rows={2} value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(); } }} placeholder={placeholder} aria-label={placeholder} className="min-h-16 w-full resize-y bg-transparent px-1 py-1 text-base leading-5 text-slate-900 outline-none placeholder:text-slate-500 dark:text-white"/>
          : <input value={question} onFocus={() => setExpanded(true)} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === "Enter") submit(); }} placeholder={placeholder} aria-label={placeholder} className="min-h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-500 dark:text-white"/>}
        {expanded && <div className="flex justify-end gap-2"><button type="button" onClick={() => { setExpanded(false); setQuestion(""); }} className={touch + " px-3 text-xs font-semibold text-slate-500"}>Cancel</button><button type="button" onClick={submit} disabled={!question.trim()} className={touch + " inline-flex items-center gap-1.5 bg-indigo-600 px-4 text-xs font-bold text-white disabled:opacity-40"}><Send size={14}/> Ask</button></div>}
      </> : <>
        <Sparkles size={16} className="shrink-0 text-indigo-500"/>
        <input value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === "Enter") saveForLater(); }} placeholder={offlinePlaceholder || placeholder} aria-label={offlinePlaceholder || placeholder} className="min-h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-500 dark:text-white"/>
        <button type="button" onClick={saveForLater} disabled={!question.trim()} className={touch + " shrink-0 bg-amber-500 px-3 text-xs font-bold text-amber-950 disabled:opacity-40"}>Save for later</button>
      </>}
    </div>
    {savedConfirmation && !online && <div role="status" className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"><span>Will send when you are back online</span><button type="button" onClick={() => setSavedConfirmation(false)} className="font-bold underline">Dismiss</button></div>}
    {saveError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">{saveError}</p>}
    {sendPrompt && online && <div role="status" className="flex items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-950 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-100"><span>Send your saved question?</span><button type="button" onClick={sendSaved} className="font-bold underline underline-offset-2">Send</button><button type="button" aria-label="Dismiss" onClick={() => setSendPrompt(false)} className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg"><X size={14}/></button></div>}
  </div>;
}
