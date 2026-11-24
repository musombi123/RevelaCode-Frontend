import React, { useEffect, useState } from "react";
import { WifiOff, Sparkles, Send, Bookmark, ChevronRight, X, Share2, Highlighter, StickyNote } from "lucide-react";

const base = "border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100";
const touch = "min-h-11 min-w-11 touch-manipulation rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

export function OfflinePill({ online, onDetails }) {
  return !online ? <button type="button" onClick={onDetails} className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-amber-300/70 bg-amber-50 px-3 text-xs font-semibold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"><WifiOff size={14}/>Offline · KJV saved</button> : null;
}

export function AskBar({ online, onAsk, storageKey = "revelacode_bible_saved_questions_v1" }) {
  const [question, setQuestion] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [toast, setToast] = useState(false);
  const [savedConfirmation, setSavedConfirmation] = useState(false);
  const [saveError, setSaveError] = useState("");
  useEffect(() => {
    if (!online) return;
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch {}
    if (Array.isArray(saved) && saved.length) setToast(true);
  }, [online, storageKey]);
  const save = () => {
    const value = question.trim();
    if (!value) return;
    try {
      const list = JSON.parse(localStorage.getItem(storageKey) || "[]");
      localStorage.setItem(storageKey, JSON.stringify([...list, { question: value, savedAt: new Date().toISOString() }]));
      setQuestion("");
      setExpanded(false);
      setToast(false);
      setSavedConfirmation(true);
      window.dispatchEvent(new CustomEvent("revelacode:bible-question-saved"));
    } catch { setToast(false); setSavedConfirmation(false); setSaveError("Could not save on this device. Check available storage."); }
  };
  return <div className="space-y-2">
    {!online ? <div className={"flex items-center gap-2 rounded-2xl px-3 py-2 " + base}><Sparkles size={16} className="text-indigo-500"/><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask AI (needs internet)" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500" aria-label="Ask AI question"/><button type="button" onClick={save} disabled={!question.trim()} className={touch+" shrink-0 bg-amber-500 px-3 text-xs font-bold text-amber-950 disabled:opacity-40"}>Save for later</button></div> :
    <div className={"rounded-2xl p-2 " + base}>
      {expanded ? <textarea autoFocus value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();if(question.trim())onAsk(question.trim());setQuestion("");setExpanded(false);}}} rows={2} placeholder="Ask about Scripture…" className="max-h-28 min-h-16 w-full resize-y bg-transparent px-2 text-sm leading-5 outline-none placeholder:text-slate-500"/> : <input value={question} onFocus={()=>setExpanded(true)} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&question.trim()){onAsk(question.trim());setQuestion("");setExpanded(false);}}} placeholder="Ask RevelaAI about Scripture…" className="min-h-9 w-full bg-transparent px-2 text-sm outline-none placeholder:text-slate-500"/>}
      {expanded && <div className="flex justify-end gap-2 pt-1"><button type="button" onClick={()=>{setExpanded(false);setQuestion("");}} className={touch+" px-3 text-xs text-slate-500"}>Cancel</button><button type="button" disabled={!question.trim()} onClick={()=>{onAsk(question.trim());setQuestion("");setExpanded(false);}} className={touch+" inline-flex items-center gap-1 bg-indigo-600 px-3 text-xs font-bold text-white disabled:opacity-40"}><Send size={14}/> Ask</button></div>}
    </div>}
    {saveError && !online && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">{saveError}</div>}\n    {savedConfirmation && !online && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">Will send when you are back online <button type="button" onClick={()=>setSavedConfirmation(false)} className="ml-2 font-bold underline">Dismiss</button></div>}
    {toast && online && <div role="status" className="flex items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200"><span>Send your saved question?</span><button type="button" onClick={()=>{try{const pending=JSON.parse(localStorage.getItem(storageKey)||"[]");const last=pending.pop();localStorage.setItem(storageKey,JSON.stringify(pending));if(last?.question)onAsk(last.question);}catch{}setToast(false);}} className="font-bold underline underline-offset-2">Send</button><button type="button" aria-label="Dismiss" onClick={()=>setToast(false)} className="p-1"><X size={14}/></button></div>}
  </div>;
}

export function SearchRow({ value, onChange, onSearch, version, onVersionChange, disabled }) {
  return <div className={"flex min-h-12 items-center gap-1.5 rounded-2xl px-2 " + base}>
    <input value={value} onChange={onChange} onKeyDown={e=>e.key==="Enter"&&onSearch()} placeholder="John 3:16" aria-label="Search Bible reference" className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-slate-500"/>
    <button type="button" onClick={onVersionChange} className="min-h-9 shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{version==="web"?"WEB":"KJV"}</button>
    <button type="button" onClick={onSearch} disabled={!value.trim()||disabled} aria-label="Search reference" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white disabled:opacity-40"><ChevronRight size={18}/></button>
  </div>;
}

export function ContinueCard({ book, chapter, verse, onResume }) {
  return <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-white p-3.5 dark:border-slate-800 dark:from-indigo-950/40 dark:to-slate-900"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-[0.7rem] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Continue reading</p><h2 className="mt-1 truncate text-base font-bold">{book ? book+" "+(Number(chapter)+1)+(verse?":"+verse:"") : "Start with John"}</h2><p className="mt-0.5 text-xs text-slate-500">{book?"Your last saved place":"A great place to begin"}</p></div><button type="button" onClick={onResume} className={touch+" inline-flex shrink-0 items-center gap-1 bg-indigo-600 px-3 text-xs font-bold text-white"}>{book?"Resume":"John"}<ChevronRight size={15}/></button></div></section>;
}

const OT_GROUPS = [
  ["Law",["Genesis","Exodus","Leviticus","Numbers","Deuteronomy"]],
  ["History",["Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther"]],
  ["Poetry",["Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon"]],
  ["Prophets",["Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi"]],
];
const NT_GROUPS = [["Gospels",["Matthew","Mark","Luke","John"]],["History",["Acts"]],["Epistles",["Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude"]],["Prophets",["Revelation"]]];
export function BookGrid({ testament, books, onTestamentChange, onBookSelect }) {
  const groups = testament==="old" ? OT_GROUPS : NT_GROUPS;
  return <div className="space-y-3">
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800"><button type="button" onClick={()=>onTestamentChange("new")} className={"min-h-11 rounded-lg text-xs font-bold "+(testament==="new"?"bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-white":"text-slate-500")}>New Testament</button><button type="button" onClick={()=>onTestamentChange("old")} className={"min-h-11 rounded-lg text-xs font-bold "+(testament==="old"?"bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-white":"text-slate-500")}>Old Testament</button></div>
    {groups.map(([label, list])=>{const visible=list.map(name=>books.find(b=>b.name===name)).filter(Boolean);if(!visible.length)return null;return <section key={label}><h3 className="sticky top-0 z-10 mb-2 bg-slate-50/95 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 backdrop-blur dark:bg-slate-950/90">{label}</h3><div className="grid grid-cols-3 gap-2">{visible.map((book,i)=><button key={book.key} type="button" onClick={()=>onBookSelect(book.key)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-xs font-semibold text-slate-800 active:bg-indigo-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:active:bg-indigo-950">{book.name}</button>)}</div></section>})}
  </div>;
}

export function VerseToolbar({ verse, onAction, onClose }) {
  const actions=[["Highlight",Highlighter],["Note",StickyNote],["Share",Share2],["Bookmark",Bookmark]];
  return <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900"><p className="w-full text-xs font-semibold text-slate-500">Verse {verse}</p>{actions.map(([name,Icon])=><button key={name} type="button" onClick={()=>onAction(name)} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold dark:bg-slate-800"><Icon size={14}/>{name}</button>)}<button type="button" onClick={onClose} aria-label="Close verse actions" className="ml-auto min-h-11 min-w-11 rounded-xl text-slate-500"><X size={16}/></button></div>;
}

export function StudyPanel({ tab, onTabChange, note, onNoteChange, online }) {
  const tabs=["Cross-refs","Word roots","EGW","Notes"];
  return <section className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><div className="grid grid-cols-4 gap-1">{tabs.map(t=><button type="button" key={t} onClick={()=>onTabChange(t)} className={"min-h-11 rounded-lg px-1 text-[0.65rem] font-bold "+(tab===t?"bg-indigo-600 text-white":"bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}>{t}</button>)}</div>{tab==="Notes"?<textarea value={note} onChange={onNoteChange} rows={4} placeholder="Notes for this chapter…" className="mt-3 min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-5 dark:border-slate-800 dark:bg-slate-950"/>:<div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-5 text-slate-600 dark:bg-slate-950 dark:text-slate-300">{online?"Select a verse to explore study resources.":"Needs internet"}<span className="ml-1 text-xs font-semibold text-slate-500">{tab!=="Notes"?"· "+tab:""}</span></div>}</section>;
}
