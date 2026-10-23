import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, GitBranch, Search, Sparkles } from "lucide-react";
import { ATLAS_NODES } from "../faith/FaithAtlas.jsx";
import { getCachedCrossReferenceDataset, warmCrossReferenceDataset } from "./studyMaterialCache.js";

function openableReference(reference) {
  const value = String(reference || "").trim().replace(/[–—]/g, "-");
  // This desk can route a single chapter or a chapter:verse range. Multi-
  // chapter ranges are not silently reduced to the first chapter.
  if (/^[1-3]?\s?[A-Za-z]+(?:\s+[1-3])?\s+\d+-\d+$/.test(value)) return "";
  if (/^[1-3]?\s?[A-Za-z]+(?:\s+[A-Za-z]+)?\s+\d+$/.test(value)) return value + ":1";
  return value;
}


function normalizeReferenceForLookup(value) {
  return String(value || "")
    .trim()
    .replace(/[–—]/g, "-")
    .replace(/\s*:\s*/g, ":")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/-\d+$/, "");
}

function referenceMatchesDataset(candidate, query) {
  const target = normalizeReferenceForLookup(candidate);
  const needle = normalizeReferenceForLookup(query);
  if (!target || !needle) return false;
  if (target === needle) return true;
  // A chapter search (for example, "John 3") includes references within
  // that chapter, but never matches "John 30".
  return !needle.includes(":") && target.startsWith(needle + ":");
}

export default function StudyReferenceTools({
  onOpenReference,
  onOpenAtlas,
  onOpenWordRoots,
}) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [referenceLookup, setReferenceLookup] = useState("");
  const [crossReferenceDataset, setCrossReferenceDataset] = useState(null);
  const [crossReferenceSource, setCrossReferenceSource] = useState("loading");
  const [crossReferenceError, setCrossReferenceError] = useState("");

  useEffect(() => {
    let active = true;
    getCachedCrossReferenceDataset().then((saved) => {
      if (active && saved) {
        setCrossReferenceDataset(saved);
        setCrossReferenceSource("cache");
      }
    }).catch(() => {});

    warmCrossReferenceDataset().then((result) => {
      if (!active) return;
      if (result?.dataset) {
        setCrossReferenceDataset(result.dataset);
        setCrossReferenceSource(result.source || "cache");
        setCrossReferenceError("");
      } else {
        setCrossReferenceSource("unavailable");
      }
    }).catch(() => {
      if (active) setCrossReferenceSource("unavailable");
    });

    return () => { active = false; };
  }, []);

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


  const crossReferenceMatches = useMemo(() => {
    const needle = normalizeReferenceForLookup(referenceLookup);
    const references = crossReferenceDataset?.references;
    if (!needle || !Array.isArray(references)) return [];

    const found = new Map();
    const add = (reference, description, relationship) => {
      const label = String(reference || "").trim();
      const key = normalizeReferenceForLookup(label);
      if (!key || key === needle || found.has(key)) return;
      found.set(key, { reference: label, description: String(description || "").trim(), relationship });
    };

    for (const entry of references) {
      const sourceReference = entry?.source?.reference?.en || "";
      const description = entry?.description?.en || entry?.slug?.en || "Related Scripture passage";
      const sourceMatches = referenceMatchesDataset(sourceReference, needle);
      const targets = Array.isArray(entry?.targets) ? entry.targets : [];
      if (sourceMatches) {
        for (const target of targets) {
          add(target?.reference?.en, description, "Linked from this passage");
        }
      }
      const matchingTargets = targets.filter((target) =>
        referenceMatchesDataset(target?.reference?.en, needle)
      );
      if (matchingTargets.length) {
        add(sourceReference, description, "Reverse cross-reference");
      }
    }

    return Array.from(found.values()).slice(0, 16);
  }, [crossReferenceDataset, referenceLookup]);

  const findCrossReferences = () => {
    const value = query.trim();
    if (!value) {
      setCrossReferenceError("Enter a verse or chapter first, for example John 3:16 or John 3.");
      return;
    }
    setCrossReferenceError("");
    setReferenceLookup(value);
    if (!crossReferenceDataset) {
      setCrossReferenceError("Cross-reference data is not available yet. Connect to the internet once, then retry; saved references work offline after download.");
    }
  };

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

    // A typed reference goes straight to Bible; a topic opens a matching
    // curated passage rather than passing a topic word to the verse parser.
    const directReference = /^(?:(?:1|2|3)\s*)?(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1?\s?Samuel|1?\s?Kings|1?\s?Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1?\s?Corinthians|Galatians|Ephesians|Philippians|Colossians|1?\s?Thessalonians|1?\s?Timothy|Titus|Philemon|Hebrews|James|1?\s?Peter|1?\s?John|Jude|Revelation)\s+\d+(?::\s*\d+(?:\s*[–—-]\s*\d+)?)?$/i.test(value);
    if (directReference) {
      const readyReference = value.includes(":") ? value.replace(/[–—]/g, "-") : value.replace(/\s*[–—-]\s*$/, "") + ":1";
      onOpenReference(readyReference);
      return;
    }

    const topicMatch = nodes.find((node) => openableReference(node.reference));
    if (topicMatch) {
      onOpenReference(openableReference(topicMatch.reference));
      return;
    }
    setError("No single passage matched that topic. Try a full Bible reference such as John 3:16.");
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
          <input value={query} onChange={(event) => { setQuery(event.target.value); setError(""); setCrossReferenceError(""); setReferenceLookup(""); }} placeholder="Try John 3:16, Romans 8:28, or sanctuary" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-emerald-900/40" />
        </label>
        <button type="button" onClick={findCrossReferences} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-emerald-950/30">
          Find linked verses <GitBranch size={15} />
        </button>
        <button type="submit" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800">
          Open in Bible <ArrowRight size={15} />
        </button>
      </form>
      {error && <p role="alert" className="text-xs font-semibold text-rose-700 dark:text-rose-300">{error}</p>}

      {referenceLookup && (
        <section className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm dark:border-sky-900/50 dark:bg-slate-900 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">Licensed cross-reference index</div>
              <h4 className="mt-1 text-base font-black text-slate-900 dark:text-white">Passages linked to {referenceLookup}</h4>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Each item includes its source description. Cross-references suggest a textual or thematic connection; they do not determine doctrine by themselves.</p>
            </div>
            <span className="shrink-0 rounded-full bg-sky-50 px-3 py-1.5 text-[10px] font-bold text-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
              {crossReferenceSource === "cache" ? "Saved offline" : crossReferenceSource === "network" ? "Downloaded" : crossReferenceSource === "loading" ? "Loading dataset" : "Offline index unavailable"}
            </span>
          </div>

          {crossReferenceError && <p role="status" className="mt-3 text-xs leading-5 text-amber-800 dark:text-amber-200">{crossReferenceError}</p>}

          {!crossReferenceDataset && !crossReferenceError && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Retrieving the public cross-reference dataset. You can keep using the curated passage map while it loads.</p>}

          {crossReferenceDataset && crossReferenceMatches.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {crossReferenceMatches.map((item) => (
                <article key={item.reference} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">{item.relationship}</div>
                  <h5 className="mt-1 text-sm font-black text-slate-900 dark:text-white">{item.reference}</h5>
                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.description}</p>
                  <button type="button" disabled={!onOpenReference} onClick={() => onOpenReference(item.reference)} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-3 py-2 text-xs font-bold text-white hover:bg-sky-800 disabled:opacity-50"><BookOpen size={13} /> Open in Bible</button>
                </article>
              ))}
            </div>
          )}

          {crossReferenceDataset && crossReferenceMatches.length === 0 && <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-4 text-xs leading-5 text-slate-600 dark:border-slate-700 dark:text-slate-300">No match was found in this curated index. It contains 453 selected connections, so a missing match does not mean no relationship exists. Try a verse or a chapter instead of a topic.</p>}

          <p className="mt-4 text-[10px] leading-5 text-slate-500 dark:text-slate-400">Dataset: <a href="https://midvash.com/open-source/bible-cross-references" className="font-bold text-sky-700 underline dark:text-sky-300">Midvash Bible Cross-References</a>, licensed CC BY 4.0. Attribution is retained here. The index is stored in local browser storage after successful download, allowing later offline lookup.</p>
        </section>
      )}

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
