import React, { useMemo, useState } from "react";
import { ArrowRight, BookOpen, GitBranch, Search, Sparkles } from "lucide-react";
import { ATLAS_NODES } from "../faith/FaithAtlas.jsx";

function openableReference(reference) {
  const value = String(reference || "").trim().replace(/[–—]/g, "-");
  // This desk's primary passages are single chapters or chapter:verse ranges.
  // Deliberately reject multi-chapter ranges rather than silently misrouting.
  if (/^[1-3]?\s?[A-Za-z]+(?:\s+[1-3])?\s+\d+-\d+$/.test(value)) return "";
  return value;
}

export default function StudyReferenceTools({
  onOpenReference,
  onOpenAtlas,
  onOpenWordRoots,
}) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const nodes = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ATLAS_NODES.filter((node) => {
      if (!needle) return true;
      return [
        node.title,
        node.reference,
        node.category,
        node.summary,
        ...(node.questions || []),
        ...(node.textFocus || []),
      ].join(" ").toLowerCase().includes(needle);
    });
  }, [query]);

  const submitReference = (event) => {
    event?.preventDefault?.();
    const value = query.trim();
    if (!value) {
      setError("Enter a reference such as John 3:16 or Daniel 7:1-8.");
      return;
    }
    setError("");
    if (typeof onOpenReference !== "function") {
      setError("Bible reading is not available from this view.");
      return;
    }
    onOpenReference(value);
  };

  return (
    <section className="space-y-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-3 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/25 dark:via-gray-900 dark:to-sky-950/20 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <GitBranch size={19} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Reference Desk</div>
            <h3 className="mt-1 text-base font-black text-slate-900 dark:text-white">Find a passage. Follow the evidence.</h3>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 dark:text-slate-300">Search a Bible reference or a topic, then open the passage in RevelaCode’s Bible reader. Connected passages are study leads—not automatic proof that two interpretations are identical.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          <button type="button" onClick={onOpenAtlas} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-gray-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40">
            <GitBranch size={14} /> Passage map
          </button>
          <button type="button" onClick={onOpenWordRoots} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-800 hover:bg-violet-50 dark:border-violet-900/50 dark:bg-gray-900 dark:text-violet-300 dark:hover:bg-violet-950/40">
            <Sparkles size={14} /> Word roots
          </button>
        </div>
      </div>

      <form onSubmit={submitReference} className="flex flex-col gap-2 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Bible reference or topic</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setError(""); }} placeholder="Try John 3:16, Romans 8:28, or sanctuary" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-emerald-900/40" />
        </label>
        <button type="submit" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800">
          Open in Bible <ArrowRight size={15} />
        </button>
      </form>
      {error && <p role="alert" className="text-xs font-semibold text-rose-700 dark:text-rose-300">{error}</p>}

      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">Connected study paths</h4>
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{nodes.length} topics</span>
      </div>
      {nodes.length ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {nodes.slice(0, query.trim() ? 9 : 6).map((node) => {
            const passage = openableReference(node.reference);
            return (
              <article key={node.id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{node.category}</div>
                <h5 className="mt-1 text-sm font-black leading-5 text-slate-900 dark:text-white">{node.title}</h5>
                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{node.reference}</p>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600 dark:text-slate-300">{node.summary}</p>
                <button type="button" disabled={!passage || !onOpenReference} onClick={() => onOpenReference(passage)} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60">
                  <BookOpen size={13} /> Open passage
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">No connected study path matches this search. Press “Open in Bible” to look up a direct reference.</p>
      )}
      <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">The passage map is a curated starter index, not an exhaustive concordance. Read the surrounding chapter and verify each proposed connection in its own context.</p>
    </section>
  );
}
