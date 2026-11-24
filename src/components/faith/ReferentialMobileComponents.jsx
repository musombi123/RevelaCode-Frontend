import React from "react";
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BookOpen, Check,
  ChevronRight, Download, GripVertical, Library, Plus, RefreshCw,
  Save, Sparkles, X
} from "lucide-react";
import { ConnectivityPill, AskBar } from "./SharedMobileComponents.jsx";

export { ConnectivityPill, AskBar };

const card = "rounded-2xl border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100";
const touch = "inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 motion-reduce:transition-none";
const inputClass = "min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

export function StartChainCard({ value, onChange, onStart, quickThemes = ["Sanctuary", "Sabbath", "Second coming", "Covenant"] }) {
  return <section className={card + " space-y-3 p-4 shadow-sm"}>
    <div className="flex items-center gap-2"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"><Plus size={18}/></span><div className="min-w-0"><h2 className="text-sm font-black">Start a chain</h2><p className="text-xs text-slate-500 dark:text-slate-400">Begin with a verse or a Bible theme.</p></div></div>
    <form onSubmit={event => { event.preventDefault(); onStart?.(); }} className="flex min-w-0 flex-col gap-2 sm:flex-row">
      <input value={value} onChange={event => onChange?.(event.target.value)} placeholder="Daniel 8:14 or Sanctuary" aria-label="Starting Bible passage or theme" className={inputClass + " flex-1"}/>
      <button type="submit" disabled={!String(value || "").trim()} className={touch + " shrink-0 bg-indigo-600 px-4 text-sm font-black text-white disabled:opacity-40"}>Start chain <ArrowRight size={15} className="ml-1"/></button>
    </form>
    <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Quick themes">
      {quickThemes.map(theme => <button key={theme} type="button" onClick={() => onChange?.(theme)} className="min-h-10 shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600 active:bg-indigo-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:active:bg-indigo-950/40">{theme}</button>)}
    </div>
  </section>;
}

export function ChainList({ chains = [], filter = "all", onFilterChange, onOpen, onStart }) {
  const visible = chains.filter(chain => filter !== "offline" || chain.savedOffline);
  return <section className="space-y-3">
    <div className="flex min-w-0 items-center justify-between gap-2 px-1">
      <div><h2 className="text-sm font-black">My chains</h2><p className="text-xs text-slate-500 dark:text-slate-400">{visible.length} saved chain{visible.length === 1 ? "" : "s"}</p></div>
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[0.65rem] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{filter === "offline" ? "Offline only" : "All chains"}</span>
    </div>
    {visible.length ? <div className="space-y-2">{visible.map(chain => <button key={chain.id} type="button" onClick={() => onOpen?.(chain)} className={card + " flex min-h-[76px] w-full min-w-0 items-center gap-3 p-3 text-left active:bg-slate-50 dark:active:bg-slate-800"}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><Library size={18}/></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black">{chain.title || "Untitled chain"}</span><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{Array.isArray(chain.passages) ? chain.passages.length : 0} passage{chain.passages?.length === 1 ? "" : "s"} · Updated {chain.updatedAt ? new Date(chain.updatedAt).toLocaleDateString() : "just now"}</span></span>
      {chain.savedOffline && <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[0.6rem] font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Offline</span>}
      <ChevronRight size={17} className="shrink-0 text-slate-400"/>
    </button>)}</div> : <div className={card + " border-dashed p-5 text-center"}>
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800"><BookOpen size={20}/></span>
      <p className="mt-3 text-sm font-bold">Your saved chains will appear here</p>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Create a verse trail, compare its links, then save it for offline study.</p>
      <button type="button" onClick={onStart} className={touch + " mt-3 bg-indigo-600 px-4 text-xs font-black text-white"}>Start a chain</button>
    </div>}
  </section>;
}

const RELATIONS = ["Same theme", "Symbol", "Fulfilment", "Contrast", "Quote"];

export function PassageRow({ passage, index, total, onOpen, onMove, onDragStart, onDragOver, onDrop }) {
  return <article draggable onDragStart={event => onDragStart?.(event, index)} onDragOver={event => onDragOver?.(event, index)} onDrop={event => onDrop?.(event, index)} className={card + " flex min-w-0 items-center gap-2 p-2.5"}>
    <button type="button" draggable onDragStart={event => onDragStart?.(event, index)} aria-label={"Drag to reorder " + passage.reference} className="inline-flex min-h-11 min-w-8 shrink-0 items-center justify-center rounded-lg text-slate-400"><GripVertical size={18}/></button>
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">{index + 1}</span>
    <button type="button" onClick={() => onOpen?.(passage)} className="min-w-0 flex-1 py-1 text-left">
      <span className="block truncate text-sm font-black">{passage.reference || "Untitled passage"}</span>
      <span className="mt-0.5 block text-[0.65rem] font-bold text-indigo-700 dark:text-indigo-300">{RELATIONS.includes(passage.relation) ? passage.relation : "Same theme"}</span>
      <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{passage.subtitle || "Add a note about how this passage connects."}</span>
    </button>
    <div className="flex shrink-0 flex-col gap-0.5">
      <button type="button" onClick={() => onMove?.(index, -1)} disabled={index === 0} aria-label="Move passage up" className="inline-flex h-8 w-9 items-center justify-center rounded-lg text-slate-500 disabled:opacity-25"><ArrowUp size={15}/></button>
      <button type="button" onClick={() => onMove?.(index, 1)} disabled={index >= total - 1} aria-label="Move passage down" className="inline-flex h-8 w-9 items-center justify-center rounded-lg text-slate-500 disabled:opacity-25"><ArrowDown size={15}/></button>
    </div>
  </article>;
}

export function ChainBuilder({
  chain,
  onChange,
  onBack,
  onSave,
  onAddPassage,
  onOpenPassage,
  onOpenAtlas,
  onAsk,
  savedToast,
  saving = false,
}) {
  const passages = Array.isArray(chain?.passages) ? chain.passages : [];
  const linked = passages.slice(1);
  const dragIndex = React.useRef(null);
  const movePassage = (index, direction) => {
    const from = index + 1;
    const to = from + direction;
    if (to < 1 || to >= passages.length) return;
    const next = [...passages];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange?.({ ...chain, passages: next });
  };
  const dragStart = (event, index) => {
    dragIndex.current = index + 1;
    try { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", String(index)); } catch {}
  };
  const dragOver = event => { event.preventDefault(); };
  const drop = (event, targetIndex) => {
    event.preventDefault();
    const from = dragIndex.current;
    const to = targetIndex + 1;
    if (from == null || from === to || from < 1 || to < 1 || from >= passages.length || to >= passages.length) return;
    const next = [...passages];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange?.({ ...chain, passages: next });
    dragIndex.current = null;
  };
  return <div className="min-w-0 space-y-3">
    <section className={card + " space-y-3 p-3"}>
      <label className="block text-[0.65rem] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Chain title<input value={chain?.title || ""} onChange={event => onChange?.({ ...chain, title: event.target.value })} placeholder="Name this study chain" className={inputClass + " mt-1"}/></label>
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/25">
        <p className="text-[0.65rem] font-black uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Starting passage</p>
        <button type="button" onClick={() => onOpenPassage?.(passages[0])} className="mt-1 block min-w-0 text-left"><span className="block text-base font-black text-slate-900 dark:text-white">{passages[0]?.reference || "Starting reference"}</span><span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300">{passages[0]?.subtitle || "The first passage anchors your chain."}</span></button>
        <textarea value={passages[0]?.text || ""} onChange={event => { const next=[...passages]; next[0]={...next[0],text:event.target.value}; onChange?.({...chain,passages:next}); }} rows={2} placeholder="Passage text or your excerpt (saved offline)…" className="mt-3 min-h-16 w-full resize-y rounded-xl border border-indigo-200 bg-white/80 p-3 text-base leading-5 text-slate-800 outline-none dark:border-indigo-900/50 dark:bg-slate-950 dark:text-slate-100"/>
      </div>
      <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-black">Linked passages</h3><span className="text-xs text-slate-500">{linked.length} linked</span></div>
      {linked.length ? <div className="space-y-2">{linked.map((passage,index)=><PassageRow key={passage.id || passage.reference + "-" + index} passage={passage} index={index} total={linked.length} onOpen={onOpenPassage} onMove={movePassage} onDragStart={dragStart} onDragOver={dragOver} onDrop={drop}/>)}</div> : <p className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">Add related verses to make the connection visible.</p>}
      <button type="button" onClick={onAddPassage} className={touch + " w-full gap-2 border border-dashed border-indigo-300 text-xs font-black text-indigo-700 dark:border-indigo-900/60 dark:text-indigo-300"}><Plus size={16}/> Add passage</button>
    </section>
    <div className="grid grid-cols-2 gap-2"><button type="button" onClick={onOpenAtlas} className={touch + " gap-1.5 border border-slate-200 text-xs font-bold dark:border-slate-700"}><BookOpen size={14}/> Atlas</button><button type="button" onClick={onAsk} className={touch + " gap-1.5 border border-indigo-200 bg-indigo-50 text-xs font-bold text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200"}><Sparkles size={14}/> Ask how these connect</button></div>
    <button type="button" onClick={onSave} disabled={saving || !passages.length} className={touch + " w-full gap-2 bg-emerald-600 px-4 text-sm font-black text-white disabled:opacity-50"}>{saving ? <RefreshCw size={16} className="animate-spin motion-reduce:animate-none"/> : savedToast ? <Check size={17}/> : <Save size={17}/>} {saving ? "Saving…" : savedToast ? "Saved" : "Save chain for offline"}</button>
    {savedToast && <p role="status" className="text-center text-xs font-semibold text-emerald-700 dark:text-emerald-300">Saved · this chain and its passage text are available offline.</p>}
  </div>;
}

export function AddPassageSheet({ open, query, onQueryChange, relation, onRelationChange, subtitle, onSubtitleChange, text, onTextChange, suggestions = [], onPickSuggestion, onAdd, onClose }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-2" role="dialog" aria-modal="true" aria-label="Add passage" onClick={onClose}>
    <section className="max-h-[92dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:bg-slate-950" onClick={event => event.stopPropagation()}>
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700"/>
      <div className="mb-3 flex items-center justify-between"><div><h2 className="text-base font-black">Add a passage</h2><p className="text-xs text-slate-500">Search a reference or choose a study lead.</p></div><button type="button" onClick={onClose} aria-label="Close add passage" className={touch}><X size={18}/></button></div>
      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Reference or theme<input autoFocus value={query} onChange={event => onQueryChange(event.target.value)} placeholder="John 1:1 or Sanctuary" className={inputClass + " mt-1"}/></label>
      {suggestions.length > 0 && <div className="mt-2 max-h-36 space-y-1 overflow-y-auto">{suggestions.slice(0,5).map((item,index)=><button key={item.id || item.reference || index} type="button" onClick={()=>onPickSuggestion(item)} className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 text-left text-xs dark:bg-slate-900"><span className="min-w-0"><b className="block truncate">{item.reference}</b><span className="block truncate text-slate-500">{item.title || item.summary}</span></span><ChevronRight size={14}/></button>)}</div>}
      <label className="mt-3 block text-xs font-bold text-slate-600 dark:text-slate-300">Relationship<select value={relation} onChange={event => onRelationChange(event.target.value)} className={inputClass + " mt-1"}>{RELATIONS.map(item=><option key={item}>{item}</option>)}</select></label>
      <label className="mt-3 block text-xs font-bold text-slate-600 dark:text-slate-300">Short subtitle<textarea value={subtitle} onChange={event => onSubtitleChange(event.target.value)} rows={2} placeholder="Why does this passage connect?" className={inputClass + " mt-1 py-2"}/></label>
      <label className="mt-3 block text-xs font-bold text-slate-600 dark:text-slate-300">Passage text / excerpt<textarea value={text} onChange={event => onTextChange(event.target.value)} rows={3} placeholder="Add the verse text or your excerpt. It will be saved with the chain." className={inputClass + " mt-1 py-2"}/></label>
      <button type="button" onClick={onAdd} disabled={!String(query || "").trim()} className={touch + " mt-4 w-full bg-indigo-600 text-sm font-black text-white disabled:opacity-40"}>Add passage</button>
    </section>
  </div>;
}

export function PassageDetailSheet({ passage, onOpenBible, onClose }) {
  if (!passage) return null;
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-2" role="dialog" aria-modal="true" aria-label={passage.reference || "Passage"} onClick={onClose}>
    <section className="w-full max-w-lg rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:bg-slate-950" onClick={event=>event.stopPropagation()}>
      <div className="mb-3 flex items-center justify-between"><div className="min-w-0"><p className="text-[0.65rem] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Passage</p><h2 className="truncate text-lg font-black">{passage.reference}</h2></div><button type="button" onClick={onClose} aria-label="Close passage" className={touch}><X size={18}/></button></div>
      <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{passage.relation || "Starting passage"}</p>
      {passage.subtitle && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{passage.subtitle}</p>}
      {passage.text && <div className="mt-3 max-h-44 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 font-serif text-sm leading-6 text-slate-800 dark:bg-slate-900 dark:text-slate-100">{passage.text}</div>}
      <button type="button" onClick={() => onOpenBible?.(passage.reference)} className={touch + " mt-4 w-full gap-2 bg-indigo-600 text-sm font-black text-white"}><BookOpen size={16}/> Open in Bible</button>
    </section>
  </div>;
}

export function LibraryStatusCard({ state, onRetry, retrying = false }) {
  if (state === "offline-missing") return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/25"><div className="flex items-center gap-2"><Download size={17} className="text-amber-700 dark:text-amber-300"/><h3 className="text-sm font-black text-amber-950 dark:text-amber-100">Study Library · Not downloaded yet</h3></div><p className="mt-1 text-xs leading-5 text-amber-900/80 dark:text-amber-200/80">Connect to the internet to load and save study materials for offline reading.</p><button type="button" disabled className={touch + " mt-2 w-full cursor-not-allowed bg-amber-200 px-3 text-xs font-bold text-amber-800 opacity-70 dark:bg-amber-900/40 dark:text-amber-200"}>Download when online</button><p className="mt-1 text-[0.65rem] text-amber-900/70 dark:text-amber-200/70">Downloading is unavailable while this device is offline.</p></section>;
  if (state === "failed" || state === "retrying") return <section role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-950/25"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="text-sm font-black text-amber-950 dark:text-amber-100">Couldn't load the Study Library. Try again.</h3><p className="mt-1 text-xs leading-5 text-amber-900/80 dark:text-amber-200/80">Your saved chains remain available on this device.</p></div><button type="button" disabled={retrying} onClick={onRetry} className={touch + " shrink-0 gap-1.5 border border-amber-300 bg-white px-3 text-xs font-bold text-amber-900 disabled:opacity-60 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-200"}>{retrying ? <RefreshCw size={14} className="animate-spin motion-reduce:animate-none"/> : <RefreshCw size={14}/>} Retry</button></div></section>;
  return null;
}
