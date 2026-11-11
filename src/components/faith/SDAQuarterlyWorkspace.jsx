import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, ExternalLink, RefreshCw, Sparkles, WifiOff } from "lucide-react";
import SdaLessonAIChat from "./SdaLessonAIChat.jsx";
import FaithWorkspaceLayout from "./workspace/FaithWorkspaceLayout.jsx";
import { readCachedApiResponse, writeCachedApiResponse } from "@/services/offlineHubSync.js";

const API = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_REVELACODE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://revelacode-backend.onrender.com"
).replace(/\/+$/, "");

const QUARTER_NAMES = ["January–March", "April–June", "July–September", "October–December"];

function kenyaQuarterNow() {
  const parts = new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return { year, quarter: Math.ceil(month / 3) };
}

function lessonMetadata(material) {
  return material?.metadata && typeof material.metadata === "object" ? material.metadata : {};
}

function lessonId(material) {
  const meta = lessonMetadata(material);
  const id = material?.id ?? material?._id ?? material?.material_id ?? material?.materialId ?? meta.lesson_key;
  return id == null ? "" : String(id);
}

function formatLessonDate(value) {
  if (!value) return "";
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  });
}

export default function SDAQuarterlyWorkspace({ onOpen, onAskAI, onOpenAI, onBack, onNavigate }) {
  const [initial] = useState(kenyaQuarterNow);
  const [year, setYear] = useState(initial.year);
  const [quarter, setQuarter] = useState(initial.quarter);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [aiLesson, setAiLesson] = useState(null);

  const sourceUrl = `https://www.sabbath.school/LessonBook?quarter=${quarter}&year=${year}`;
  const cacheKey = `revelacode_sda_quarter:${year}:${quarter}`;
  const [offlineMode, setOfflineMode] = useState(typeof navigator !== "undefined" && !navigator.onLine);
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const [selectedWeekday, setSelectedWeekday] = useState(() => weekdayNames[new Date().getDay()]);
  const noteKey = "revelacode_sda_class_notes_v1:" + year + ":" + quarter;
  const [classNotes, setClassNotes] = useState("");
  const [classQuestions, setClassQuestions] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(noteKey) || "{}");
      setClassNotes(String(saved.notes || ""));
      setClassQuestions(String(saved.questions || ""));
    } catch {
      setClassNotes("");
      setClassQuestions("");
    }
    setNoteSaved(false);
  }, [noteKey]);

  const loadQuarter = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    setOfflineMode(typeof navigator !== "undefined" && !navigator.onLine);

    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) throw new Error("offline");
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12000);
      let response;
      try {
        response = await fetch(requestUrl, { method: "GET", headers: { Accept: "application/json" }, credentials: "include", cache: "no-store", signal: controller.signal });
      } finally {
        window.clearTimeout(timeout);
      }
      const freshMaterials = Array.isArray(payload?.materials) ? payload.materials : [];
      setMaterials(freshMaterials);
      window.dispatchEvent(new CustomEvent("revelacode:connection-restored"));
      const cachePayload = { materials: freshMaterials, savedAt: new Date().toISOString(), version: payload?.version || payload?.updated_at || "" };
      await writeCachedApiResponse("public:sda-quarterly", `${API}/api/study/sda/quarter/${year}/${quarter}`, cachePayload);
      try { localStorage.setItem(cacheKey, JSON.stringify(cachePayload)); } catch { /* IndexedDB remains the durable offline cache. */ }
    } catch (loadError) {
      let cached = null;
      try {
        const cachedResult = await readCachedApiResponse("public:sda-quarterly", `${API}/api/study/sda/quarter/${year}/${quarter}`);
        cached = cachedResult.hit ? cachedResult.payload : null;
      } catch { cached = null; }
      if (!cached) {
        try { cached = JSON.parse(localStorage.getItem(cacheKey) || "null"); } catch { cached = null; }
      }
      window.dispatchEvent(new CustomEvent("revelacode:connection-poor"));
      if (Array.isArray(cached?.materials) && cached.materials.length) {
        setMaterials(cached.materials);
        setOfflineMode(true);
        setError("Poor connection. Showing your downloaded SDA Quarterly lessons.");
      } else {
        setError(typeof navigator !== "undefined" && !navigator.onLine ? "No internet connection. Connect to download this quarter." : "Poor connection. SDA Quarterly could not refresh right now.");
        setMaterials([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    loadQuarter();
    // Revalidate the current quarter periodically while Faith remains open.
    const refreshTimer = window.setInterval(() => loadQuarter({ silent: true }), 6 * 60 * 60 * 1000);
    return () => window.clearInterval(refreshTimer);
    // Quarter selection intentionally controls this request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, quarter]);

  useEffect(() => {
    const updateConnection = () => setOfflineMode(!navigator.onLine);
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => { window.removeEventListener("online", updateConnection); window.removeEventListener("offline", updateConnection); };
  }, []);

  const sortedMaterials = useMemo(() => {
    return [...materials].sort((left, right) => {
      const leftMeta = lessonMetadata(left);
      const rightMeta = lessonMetadata(right);
      return String(leftMeta.lesson_date || "").localeCompare(String(rightMeta.lesson_date || ""));
    });
  }, [materials]);

  const openLesson = (material) => {
    const id = lessonId(material);
    if (!id || typeof onOpen !== "function") return;
    onOpen({
      ...material,
      id,
      title: material?.title || lessonMetadata(material).lesson_title || "SDA Quarterly lesson",
    });
  };

  const openLessonAI = (material) => {
    const meta = lessonMetadata(material);
    const context = {
      id: lessonId(material),
      title: material?.title || meta.lesson_title || "SDA Quarterly lesson",
      text: String(material?.content || material?.description || ""),
      day: meta.day,
      date: meta.lesson_date,
      memoryText: meta.memory_text,
    };
    setAiLesson(context);
    onAskAI?.(context);
  };

  const todayLesson = sortedMaterials.find((material) => String(lessonMetadata(material).day || "").toLowerCase() === selectedWeekday.toLowerCase()) || sortedMaterials[0] || null;
  const todayMeta = lessonMetadata(todayLesson);
  const saveClassNotes = (field, value) => {
    const next = { notes: field === "notes" ? value : classNotes, questions: field === "questions" ? value : classQuestions };
    if (field === "notes") setClassNotes(value); else setClassQuestions(value);
    setNoteSaved(false);
    try { localStorage.setItem(noteKey, JSON.stringify(next)); setNoteSaved(true); } catch { setNoteSaved(false); }
  };
  const listenToLesson = () => {
    if (!todayLesson || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const text = String(todayLesson.content || todayLesson.description || todayMeta.memory_text || todayLesson.title || "");
    if (!text.trim()) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };

  return (
    <FaithWorkspaceLayout page="quarterly" contextData={{ year, quarter, day: selectedWeekday, lesson: todayLesson?.title || todayMeta.lesson_title || "" }} onOpenAI={onOpenAI} onBack={onBack || (() => window.history.back())} onNavigate={onNavigate} onPrimaryAction={() => todayLesson ? openLesson(todayLesson) : loadQuarter()}>
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-sm dark:border-amber-900/50 dark:from-amber-950/30 dark:via-gray-900 dark:to-orange-950/20">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
              <CalendarDays size={22} />
            </div>
            <div className="min-w-0">
              <div className="text-[0.625rem] font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Sabbath School · Faith</div>
              <h2 className="mt-1 text-xl font-black tracking-tight text-gray-900 dark:text-white">SDA Quarterly</h2>
              <p className="mt-1 text-sm leading-5 text-gray-600 dark:text-gray-300">Daily readings, memory text, and quarter archive—using the existing RevelaCode Study API.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-300">
              <span className="mb-1 block">Year</span>
              <select value={year} onChange={(event) => setYear(Number(event.target.value))} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                {Array.from({ length: 6 }, (_, index) => initial.year + 1 - index).map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-300">
              <span className="mb-1 block">Quarter</span>
              <select value={quarter} onChange={(event) => setQuarter(Number(event.target.value))} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                {[1, 2, 3, 4].map((value) => (
                  <option key={value} value={value}>Q{value} · {QUARTER_NAMES[value - 1]}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-200/70 bg-white/70 px-4 py-3 dark:border-amber-900/40 dark:bg-gray-950/30 sm:px-5">
          <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{sortedMaterials.length} daily lesson{sortedMaterials.length === 1 ? "" : "s"} · Q{quarter} {year}</p>{offlineMode && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[0.625rem] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"><WifiOff size={11}/> Offline copy</span>}</div>
          <button type="button" onClick={() => loadQuarter({ silent: true })} disabled={refreshing || loading} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-indigo-700 dark:text-indigo-300">Weekly reading plan</p><h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">Your seven-day study</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Choose a day to focus the reading and class preparation.</p></div><span className="rounded-full bg-indigo-50 px-3 py-1 text-[0.625rem] font-bold text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200">{selectedWeekday} selected</span></div>
        <div className="mt-4 flex min-w-0 snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {weekdayNames.map((day) => <button key={day} type="button" onClick={() => setSelectedWeekday(day)} aria-pressed={selectedWeekday === day} className={"min-h-11 min-w-[4.25rem] shrink-0 snap-start rounded-xl border px-2 py-2 text-xs font-semibold transition-colors duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 " + (selectedWeekday === day ? "border-indigo-500 bg-indigo-600 text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300")}>{day.slice(0, 3)}</button>)}
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-950"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[0.625rem] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{selectedWeekday} reading</p><h4 className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{todayLesson?.title || todayMeta.lesson_title || "Reading will appear when lessons are available"}</h4></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => openLesson(todayLesson)} disabled={!todayLesson} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-indigo-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><BookOpen size={14}/> Start</button><button type="button" onClick={listenToLesson} disabled={!todayLesson || !(typeof window !== "undefined" && "speechSynthesis" in window)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><Sparkles size={14}/> Listen</button></div></div>{todayMeta.memory_text && <blockquote className="mt-3 border-l-2 border-amber-400 pl-3 text-xs leading-5 text-slate-700 dark:text-slate-200"><span className="mb-1 block text-[0.625rem] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Memory verse</span>{todayMeta.memory_text}</blockquote>}</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="block min-w-0"><span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Class notes</span><textarea value={classNotes} onChange={(event) => saveClassNotes("notes", event.target.value)} rows={4} placeholder="Capture observations and lesson points…" className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"/></label><label className="block min-w-0"><span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Questions for class</span><textarea value={classQuestions} onChange={(event) => saveClassNotes("questions", event.target.value)} rows={4} placeholder="Write questions to discuss with your class…" className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"/></label></div><p className="mt-2 text-[0.625rem] text-slate-500 dark:text-slate-400">{noteSaved ? "Notes saved on this device." : "Notes and class questions save automatically on this device."}</p>
      </section>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {aiLesson && (
        <section className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm dark:border-indigo-900/50 dark:bg-gray-950">
          <div className="flex items-center justify-between gap-3 border-b border-indigo-100 px-4 py-3 dark:border-indigo-900/50">
            <div className="min-w-0"><p className="text-[0.625rem] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-300">Lesson companion</p><h3 className="truncate text-sm font-bold text-gray-900 dark:text-white">{aiLesson.title}</h3></div>
            <button type="button" onClick={() => setAiLesson(null)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 dark:border-gray-700 dark:text-gray-300">Close AI</button>
          </div>
          <div className="h-[min(68dvh,680px)] min-h-[360px]"><Suspense fallback={<div className="p-6 text-sm text-gray-500">Opening lesson AI…</div>}><LessonAIWorkspace activeHub="faith" compactMode lessonContext={aiLesson} /></Suspense></div>
        </section>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-12 text-sm font-semibold text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <RefreshCw size={18} className="animate-spin" /> Loading SDA Quarterly…
        </div>
      ) : sortedMaterials.length ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {sortedMaterials.map((material, index) => {
            const meta = lessonMetadata(material);
            const dateLabel = formatLessonDate(meta.lesson_date);
            const lessonLabel = meta.lesson_number ? `Lesson ${meta.lesson_number}` : "Daily lesson";
            const dayLabel = meta.day || "";
            const summary = String(material?.description || material?.content || "").replace(/\s+/g, " ").trim();
            const title = material?.title || meta.lesson_title || `Lesson ${index + 1}`;
            return (
              <div key={lessonId(material) || `${year}-${quarter}-${index}`} className="group flex min-h-[150px] min-w-0 flex-col rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-amber-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-amber-800 sm:p-4">
                <button type="button" onClick={() => openLesson(material)} className="flex flex-1 flex-col text-left">
                <div className="flex w-full items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-1 text-[0.625rem] font-black uppercase tracking-wide text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    <BookOpen size={12} /> {lessonLabel}
                  </span>
                  <span className="shrink-0 text-[0.625rem] font-semibold text-gray-500 dark:text-gray-400">{dateLabel}</span>
                </div>
                <h3 className="mt-2 line-clamp-2 text-sm font-black leading-5 text-gray-900 dark:text-white">{material?.title || meta.lesson_title || `Lesson ${index + 1}`}</h3>
                {dayLabel && <p className="mt-1 text-xs font-bold text-amber-700 dark:text-amber-300">{dayLabel}</p>}
                {meta.memory_text && <p className="mt-1 line-clamp-2 text-xs leading-4 text-gray-500 dark:text-gray-400">Memory text: {meta.memory_text}</p>}
                 {offlineMode && <span className="mt-1 inline-flex min-h-6 w-fit items-center rounded-full bg-emerald-50 px-2 py-1 text-[0.5625rem] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Offline ready</span>}
                {!meta.memory_text && summary && <p className="mt-1 line-clamp-2 text-xs leading-4 text-gray-500 dark:text-gray-400">{summary}</p>}
                <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-bold text-amber-700 dark:text-amber-300">Open lesson <ExternalLink size={12} className="transition-transform group-hover:translate-x-0.5" /></span>
                </button>
                <button type="button" onClick={() => setAiLesson((current) => lessonId(current) === lessonId(material) ? null : material)} className="mt-3 inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-900 hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200">
                  <Sparkles size={14}/> {lessonId(aiLesson) === lessonId(material) ? "Close AI Chat" : "AI Chat"}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <section className="rounded-2xl border border-dashed border-amber-300 bg-white p-5 text-center dark:border-amber-900/50 dark:bg-gray-900 sm:p-8">
          <CalendarDays size={30} className="mx-auto text-amber-500" />
          <h3 className="mt-3 text-base font-black text-gray-900 dark:text-white">No lessons imported for Q{quarter} {year} yet</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-300">
            The Quarterly workspace is connected to the existing Study API. This quarter has no stored daily lessons yet, so use the official Sabbath School source below until its lessons are imported.
          </p>
          <a href={sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-amber-600">
            Open official quarterly <ExternalLink size={15} />
          </a>
        </section>
      )}

      {aiLesson && <SdaLessonAIChat key={lessonId(aiLesson)} material={aiLesson} onClose={() => setAiLesson(null)} />}

      {sortedMaterials.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">Original lesson source and teacher materials remain with each imported lesson when available.</p>
          <a href={sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 underline dark:text-amber-300">Official quarterly <ExternalLink size={13} /></a>
        </div>
      )}
    </div>
    </FaithWorkspaceLayout>
  );
}
