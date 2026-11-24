import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, BookOpen, ChevronDown, Download, ExternalLink, RefreshCw,
  SignalLow, Sparkles, WifiOff, X
} from "lucide-react";

const card = "rounded-2xl border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100";
const touch = "min-h-11 min-w-11 touch-manipulation rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 motion-reduce:transition-none";
const control = "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

export function ConnectivityPill({ state = "online", quarter, year }) {
  if (state === "online") return null;
  const offline = state === "offline";
  const Icon = offline ? WifiOff : SignalLow;
  return <div role="status" aria-live="polite" className={"inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold " + (offline ? "border-amber-300/80 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200" : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200")}>
    <Icon size={14} className="shrink-0" />
    <span>{offline ? "Offline copy · Q" + quarter + " " + year : "Slow connection"}</span>
  </div>;
}

const SAVED_QUESTIONS_KEY = "revelacode_sda_quarterly_saved_questions_v1";
export function AskBar({ online = true, onAsk }) {
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
      const current = JSON.parse(localStorage.getItem(SAVED_QUESTIONS_KEY) || "[]");
      if (!Array.isArray(current)) throw new Error("Invalid saved question list");
      localStorage.setItem(SAVED_QUESTIONS_KEY, JSON.stringify([...current, { question: prompt, savedAt: new Date().toISOString() }]));
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
      const pending = JSON.parse(localStorage.getItem(SAVED_QUESTIONS_KEY) || "[]");
      setSendPrompt(Array.isArray(pending) && pending.length > 0);
    } catch { setSendPrompt(false); }
  }, [online]);
  const sendSaved = () => {
    try {
      const pending = JSON.parse(localStorage.getItem(SAVED_QUESTIONS_KEY) || "[]");
      if (!Array.isArray(pending) || !pending.length) { setSendPrompt(false); return; }
      const [first, ...remaining] = pending;
      localStorage.setItem(SAVED_QUESTIONS_KEY, JSON.stringify(remaining));
      setSendPrompt(remaining.length > 0);
      onAsk?.(String(first.question || ""));
    } catch { setSaveError("Couldn't read your saved question."); }
  };
  return <div className="space-y-2">
    <div className={"flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900 " + (expanded && online ? "flex-col items-stretch" : "")}>
      {online ? <>
        {expanded ? <textarea autoFocus rows={2} value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(); } }} placeholder="Ask about this lesson…" aria-label="Ask about the lesson" className="min-h-16 w-full resize-y bg-transparent px-1 py-1 text-sm leading-5 text-slate-900 outline-none placeholder:text-slate-500 dark:text-white" /> :
          <input value={question} onFocus={() => setExpanded(true)} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === "Enter") submit(); }} placeholder="Ask about this lesson…" aria-label="Ask about the lesson" className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500 dark:text-white" />}
        {expanded && <div className="flex justify-end gap-2"><button type="button" onClick={() => { setExpanded(false); setQuestion(""); }} className={touch + " px-3 text-xs font-semibold text-slate-500"}>Cancel</button><button type="button" onClick={submit} disabled={!question.trim()} className={touch + " inline-flex items-center gap-1.5 bg-indigo-600 px-4 text-xs font-bold text-white disabled:opacity-40"}><Sparkles size={14}/> Ask</button></div>}
      </> : <>
        <Sparkles size={16} className="shrink-0 text-indigo-500"/>
        <input value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === "Enter") saveForLater(); }} placeholder="Ask about the lesson" aria-label="Ask about the lesson" className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500 dark:text-white"/>
        <button type="button" onClick={saveForLater} disabled={!question.trim()} className={touch + " shrink-0 bg-amber-500 px-3 text-xs font-bold text-amber-950 disabled:opacity-40"}>Save for later</button>
      </>}
    </div>
    {savedConfirmation && !online && <div role="status" className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"><span>Will send when you are back online</span><button type="button" onClick={() => setSavedConfirmation(false)} className="font-bold underline">Dismiss</button></div>}
    {saveError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">{saveError}</p>}
    {sendPrompt && online && <div role="status" className="flex items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-950 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-100"><span>Send your saved question?</span><button type="button" onClick={sendSaved} className="font-bold underline underline-offset-2">Send</button><button type="button" aria-label="Dismiss" onClick={() => setSendPrompt(false)} className="min-h-8 min-w-8 rounded-lg"><X size={14}/></button></div>}
  </div>;
}

export function DayChips({ days, selected, currentDay, completed = {}, onSelect }) {
  return <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><div className="flex min-w-max gap-1.5 px-1">
    {days.map((day, index) => {
      const done = Boolean(completed[day]);
      const isToday = day === currentDay;
      const active = day === selected;
      const status = done ? "bg-emerald-500 border-emerald-500 text-white" : isToday ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400";
      return <button key={day} type="button" onClick={() => onSelect(day)} aria-pressed={active} aria-label={day + (done ? ", completed" : isToday ? ", today" : "")} className={"flex h-11 w-11 min-w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border text-[0.65rem] font-bold transition-colors motion-reduce:transition-none " + status + (active && !done && !isToday ? " ring-2 ring-indigo-400 ring-offset-1 dark:ring-offset-slate-900" : active ? " ring-2 ring-offset-1 ring-offset-white ring-white dark:ring-offset-slate-900" : "")}>
        <span>{day.slice(0, 3)}</span><span className="text-[0.55rem] leading-none">{done ? "✓" : index + 1}</span>
      </button>;
    })}
  </div></div>;
}

export function WeekCard({ loading, lesson, day, dayNumber, todayDay, completed, streak, onSelectDay, onRead, onMemoryVerse, onNotes }) {
  if (loading) return <section aria-label="Loading this week" className={card + " space-y-4 p-4 motion-reduce:animate-none"}>
    <div className="h-3 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700 motion-reduce:animate-none"/>
    <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700 motion-reduce:animate-none"/>
    <div className="grid grid-cols-7 gap-1.5">{Array.from({ length: 7 }, (_, i) => <div key={i} className="h-11 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800 motion-reduce:animate-none"/>)}</div>
    <div className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800 motion-reduce:animate-none"/>
  </section>;
  const meta = lesson?.metadata || {};
  const title = lesson?.title || meta.lesson_title || "Your daily lesson";
  const number = meta.lesson_number ? "Lesson " + meta.lesson_number : "Weekly lesson";
  return <section className={card + " space-y-3 p-4 shadow-sm"}>
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-300">This week · {number}</p><h2 className="mt-1 text-base font-black leading-6">{title}</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Day {dayNumber} of 7 · {day}</p></div><div className="shrink-0 rounded-xl bg-emerald-50 px-2.5 py-2 text-right dark:bg-emerald-950/30"><p className="text-[0.6rem] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Streak</p><p className="text-lg font-black text-emerald-800 dark:text-emerald-200">{streak} <span className="text-xs font-semibold">days</span></p></div></div>
    <DayChips days={["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]} selected={day} currentDay={todayDay} completed={completed} onSelect={onSelectDay}/>
    <button type="button" disabled={!lesson} onClick={onRead} className={touch + " flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"}><BookOpen size={17}/> Read today's lesson</button>
    <div className="grid grid-cols-2 gap-2"><button type="button" onClick={onMemoryVerse} disabled={!lesson} className={touch + " border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"}>Memory verse</button><button type="button" onClick={onNotes} disabled={!lesson} className={touch + " border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"}>My notes</button></div>
  </section>;
}

const MONTH_RANGES = ["Jan to Mar", "Apr to Jun", "Jul to Sep", "Oct to Dec"];
export function QuarterPicker({ year, quarter, open, onOpenChange, onApply, onRefresh, refreshing }) {
  const [draftYear, setDraftYear] = useState(year);
  const [draftQuarter, setDraftQuarter] = useState(quarter);
  useEffect(() => { if (open) { setDraftYear(year); setDraftQuarter(quarter); } }, [open, year, quarter]);
  return <>
    <div className="flex min-w-0 items-center gap-2">
      <button type="button" onClick={() => onOpenChange(true)} className={touch + " inline-flex min-w-0 flex-1 items-center justify-between gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"}><span className="truncate">Q{quarter} · {MONTH_RANGES[quarter - 1]} {year}</span><ChevronDown size={15} className="shrink-0"/></button>
      <button type="button" onClick={onRefresh} disabled={refreshing} aria-label="Refresh quarter" className={touch + " inline-flex shrink-0 items-center justify-center border border-slate-200 bg-white text-slate-700 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"}><RefreshCw size={17} className={refreshing ? "animate-spin motion-reduce:animate-none" : ""}/></button>
    </div>
    {open && <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-2" role="dialog" aria-modal="true" aria-label="Choose quarter" onClick={() => onOpenChange(false)}>
      <section className="w-full max-w-md rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:bg-slate-950" onClick={event => event.stopPropagation()}>
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700"/>
        <div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-black">Choose a quarter</h2><p className="text-xs text-slate-500">Select the study year and quarter</p></div><button type="button" onClick={() => onOpenChange(false)} aria-label="Close quarter picker" className={touch}><X size={18}/></button></div>
        <label className="mb-3 block text-xs font-bold text-slate-600 dark:text-slate-300">Year<select value={draftYear} onChange={event => setDraftYear(Number(event.target.value))} className={control + " mt-1"}>{Array.from({length:7},(_,i)=>year+2-i).map(value=><option key={value} value={value}>{value}</option>)}</select></label>
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Quarter<select value={draftQuarter} onChange={event => setDraftQuarter(Number(event.target.value))} className={control + " mt-1"}>{[1,2,3,4].map(value=><option key={value} value={value}>Q{value} · {MONTH_RANGES[value-1]}</option>)}</select></label>
        <button type="button" onClick={() => { onApply(draftYear, draftQuarter); onOpenChange(false); }} className={touch + " mt-4 w-full bg-indigo-600 text-sm font-black text-white"}>Apply quarter</button>
      </section>
    </div>}
  </>;
}

const BIBLE_BOOKS = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];
const REFERENCE_PATTERN = new RegExp("\\b(" + BIBLE_BOOKS.slice().sort((a,b)=>b.length-a.length).join("|") + ")\\s+\\d{1,3}:\\d{1,3}(?:[-–]\\d{1,3})?\\b","gi");
function renderReading(text, onReference) {
  const source = String(text || "");
  const chunks = [];
  let last = 0;
  REFERENCE_PATTERN.lastIndex = 0;
  let match;
  while ((match = REFERENCE_PATTERN.exec(source))) {
    if (match.index > last) chunks.push(source.slice(last, match.index));
    chunks.push({ reference: match[0] });
    last = match.index + match[0].length;
  }
  if (last < source.length) chunks.push(source.slice(last));
  return chunks.map((part, index) => typeof part === "string" ? <React.Fragment key={index}>{part}</React.Fragment> : <button key={index} type="button" onClick={() => onReference(part.reference)} className="mx-0.5 inline min-h-11 rounded-md px-1 font-semibold text-indigo-700 underline decoration-indigo-400 underline-offset-2 dark:text-indigo-300">{part.reference}</button>);
}

export function LessonReader({ material, day, onClose, onMarkDone, onNextDay, onPreviousDay, completed, onAsk, notesKey, activeReference, onOpenReference, onCloseReference, onOpenInBible, onExternalOpen, focusSection }) {
  const meta = material?.metadata && typeof material.metadata === "object" ? material.metadata : {};
  const [textRem, setTextRem] = useState(1.1);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const notesRef = useRef(null);
  const memoryRef = useRef(null);
  const touchStartX = useRef(null);
  const lessonTitle = material?.title || meta.lesson_title || "Sabbath School lesson";
  const memoryText = material?.memory_text || meta.memory_text || "Memory verse not provided for this lesson.";
  const body = String(material?.content || material?.description || meta.lesson_content || "");
  const rawQuestions = material?.discussion_questions || meta.discussion_questions || material?.questions || meta.questions || [];
  const questions = Array.isArray(rawQuestions) ? rawQuestions.map(item => typeof item === "string" ? item : item?.question || item?.text || "").filter(Boolean) : String(rawQuestions || "").split(/\n+/).filter(Boolean);
  useEffect(() => {
    let value = "";
    try { value = localStorage.getItem(notesKey) || ""; } catch {}
    setNotes(value);
    setNotesSaved(Boolean(value));
  }, [notesKey]);
  useEffect(() => {
    if (!focusSection) return;
    const target = focusSection === "notes" ? notesRef.current : memoryRef.current;
    if (target) { const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches; requestAnimationFrame(() => target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" })); }
  }, [focusSection]);
  const saveNotes = value => {
    setNotes(value);
    try { localStorage.setItem(notesKey, value); setNotesSaved(true); }
    catch { setNotesSaved(false); }
  };
  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-0 sm:p-3" role="dialog" aria-modal="true" aria-label={lessonTitle} onTouchStart={event => { touchStartX.current = event.touches?.[0]?.clientX ?? null; }} onTouchEnd={event => { const end = event.changedTouches?.[0]?.clientX; if (typeof end === "number" && typeof touchStartX.current === "number" && Math.abs(end-touchStartX.current)>90) { if (end < touchStartX.current) onNextDay?.(); else onPreviousDay?.(); } touchStartX.current = null; }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="max-h-[96dvh] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-t-3xl bg-white pb-[calc(1rem+env(safe-area-inset-bottom))] dark:bg-slate-950 sm:rounded-3xl" onClick={event => event.stopPropagation()}>
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 pb-3 pt-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden"/>
        <div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="text-[0.65rem] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Daily lesson · {day}</p><h2 className="truncate text-base font-black">{meta.lesson_number ? "Lesson " + meta.lesson_number + " · " : ""}{lessonTitle}</h2><p className="text-[0.65rem] text-slate-500">Day {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].indexOf(day)+1} of 7</p></div><div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => setTextRem(size => Math.max(0.9, size-0.05))} className={touch + " border border-slate-200 px-2 text-xs font-black dark:border-slate-700"}>A−</button><button type="button" onClick={() => setTextRem(size => Math.min(1.6, size+0.05))} className={touch + " border border-slate-200 px-2 text-xs font-black dark:border-slate-700"}>A+</button><button type="button" onClick={onClose} aria-label="Close lesson" className={touch + " text-slate-500"}><X size={18}/></button></div></div>
      </div>
      <div className="space-y-4 px-4 py-4">
        <section ref={memoryRef} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/25"><p className="text-[0.65rem] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">Memory verse</p><p className="mt-2 font-serif text-base leading-7 text-amber-950 dark:text-amber-100">{memoryText}</p>{(meta.memory_reference || meta.memory_ref || material?.memory_reference) && <p className="mt-2 text-xs font-bold text-amber-800 dark:text-amber-200">{meta.memory_reference || meta.memory_ref || material.memory_reference}</p>}</section>
        <section><h3 className="mb-2 text-sm font-black">Reading</h3><div className="whitespace-pre-wrap break-words font-serif leading-8 text-slate-800 dark:text-slate-100" style={{fontSize: textRem + "rem"}}>{body ? renderReading(body, onOpenReference) : "The reading text for this day has not been added yet."}</div></section>
        <section className={card + " p-3"}><h3 className="mb-2 text-sm font-black">Discussion questions</h3>{questions.length ? <ol className="list-decimal space-y-2 pl-5 text-sm leading-6">{questions.map((item,index)=><li key={index}>{item}</li>)}</ol> : <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">No discussion questions were supplied for this reading.</p>}</section>
        <section ref={notesRef} className={card + " p-3"}><div className="mb-2 flex items-center justify-between gap-2"><label htmlFor="sda-lesson-notes" className="text-sm font-black">My notes</label><span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{notesSaved ? "Saved" : "Saving on this device"}</span></div><textarea id="sda-lesson-notes" value={notes} onChange={event => saveNotes(event.target.value)} rows={5} placeholder="Write observations, questions and applications…" className="min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-base leading-6 text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"/></section>
        <button type="button" onClick={onAsk} className="mx-auto flex min-h-11 items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 text-xs font-bold text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200"><Sparkles size={15}/> Ask about this lesson</button>
        <div className="grid grid-cols-2 gap-2"><button type="button" onClick={onMarkDone} className={touch + " bg-emerald-600 px-3 text-xs font-black text-white"}>{completed ? "Completed ✓" : "Mark day done"}</button><button type="button" onClick={onNextDay} className={touch + " border border-slate-200 px-3 text-xs font-bold dark:border-slate-700"}>Next day <ArrowRight size={14} className="ml-1 inline"/></button></div>
        {onExternalOpen && <button type="button" onClick={onExternalOpen} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-semibold dark:border-slate-700">Open full Study lesson <ExternalLink size={14}/></button>}
      </div>
      {activeReference && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-2" role="dialog" aria-modal="true" aria-label={"Bible reference " + activeReference} onClick={onCloseReference}><div className="w-full max-w-md rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:bg-slate-950" onClick={event => event.stopPropagation()}><div className="mb-3 flex items-center justify-between"><div><p className="text-[0.65rem] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Bible passage</p><h3 className="text-base font-black">{activeReference}</h3></div><button type="button" onClick={onCloseReference} className={touch} aria-label="Close Bible reference"><X size={17}/></button></div><p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Open this reference in the Bible workspace to read the passage.</p><button type="button" onClick={() => onOpenInBible?.(activeReference)} className={touch + " mt-3 w-full bg-indigo-600 text-sm font-bold text-white"}>Open in Bible</button></div></div>}
    </section>
  </div>;
}

export function EmptyQuarter({ year, quarter, loading, lastUpdated, onDownload }) {
  return <section className={card + " space-y-3 border-dashed p-5 text-center"}>
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300"><Download size={22}/></div>
    <h3 className="text-base font-black">Download this quarter to read offline</h3>
    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Save Q{quarter} {year} lessons on this device when they are available from the Study service.</p>
    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-label="Quarter download progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={loading ? undefined : lastUpdated ? 100 : 0} aria-valuetext={loading ? "Downloading quarter" : lastUpdated ? "Quarter saved" : "Not downloaded"}><div className={"h-full rounded-full bg-amber-500 " + (loading ? "w-1/3 animate-pulse motion-reduce:animate-none" : lastUpdated ? "w-full" : "w-0")}/></div>
    <button type="button" onClick={onDownload} disabled={loading} className={touch + " inline-flex w-full items-center justify-center gap-2 bg-amber-500 px-4 text-sm font-black text-amber-950 disabled:opacity-50"}>{loading ? <RefreshCw size={16} className="animate-spin motion-reduce:animate-none"/> : <Download size={16}/>} {loading ? "Downloading…" : "Download quarter"}</button>
    <p className="text-xs text-slate-500 dark:text-slate-400">Last updated: {lastUpdated || "Not downloaded on this device yet"}</p>
  </section>;
}
