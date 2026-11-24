import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy, Filter, Sparkles, X } from "lucide-react";
import { App } from "@capacitor/app";
import SdaLessonAIChat from "./SdaLessonAIChat.jsx";
import FaithWorkspaceLayout from "./workspace/FaithWorkspaceLayout.jsx";
import { readCachedApiResponse, writeCachedApiResponse } from "@/services/offlineHubSync.js";
import {
  AskBar, ConnectivityPill, EmptyQuarter, LessonReader, QuarterPicker, WeekCard
} from "./quarterly-mobile/SDAQuarterlyMobileComponents.jsx";

const API = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_REVELACODE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://revelacode-backend.onrender.com"
).replace(/\/+$/, "");
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function kenyaQuarterNow() {
  const parts = new Intl.DateTimeFormat("en-KE", { timeZone: "Africa/Nairobi", year: "numeric", month: "numeric" }).formatToParts(new Date());
  const year = Number(parts.find(part => part.type === "year")?.value);
  const month = Number(parts.find(part => part.type === "month")?.value);
  return { year, quarter: Math.ceil(month / 3) };
}

function currentKenyaWeekday() {
  const value = new Intl.DateTimeFormat("en-KE", { timeZone: "Africa/Nairobi", weekday: "long" }).format(new Date());
  return WEEKDAYS.includes(value) ? value : "Sunday";
}

function readConnectionState() {
  if (typeof navigator === "undefined" || navigator.onLine === false) return "offline";
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const type = String(connection?.effectiveType || "").toLowerCase();
  if (["slow-2g", "2g"].includes(type) || Number(connection?.rtt || 0) > 700 || (Number(connection?.downlink || 0) > 0 && Number(connection.downlink) < 0.5)) return "poor";
  return "online";
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
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Nairobi" });
}

function formatUpdated(value) {
  if (!value) return "Not downloaded on this device yet";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" });
}

function materialDay(material) {
  const meta = lessonMetadata(material);
  return String(meta.day || meta.weekday || meta.day_name || "").trim().toLowerCase();
}

export default function SDAQuarterlyWorkspace({ onOpen, onAskAI, onOpenAI, onBack, onNavigate }) {
  const [initial] = useState(kenyaQuarterNow);
  const [year, setYear] = useState(initial.year);
  const [quarter, setQuarter] = useState(initial.quarter);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [connectionState, setConnectionState] = useState(readConnectionState);
  const [lastUpdated, setLastUpdated] = useState("");
  const [quarterPickerOpen, setQuarterPickerOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(currentKenyaWeekday);
  const [progress, setProgress] = useState({});
  const [readerLesson, setReaderLesson] = useState(null);
  const [readerDay, setReaderDay] = useState(currentKenyaWeekday);
  const [readerFocus, setReaderFocus] = useState("");
  const [activeReference, setActiveReference] = useState("");
  const [aiLesson, setAiLesson] = useState(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiSheetOpen, setAiSheetOpen] = useState(false);

  const sourceUrl = `https://www.sabbath.school/LessonBook?quarter=${quarter}&year=${year}`;
  const requestUrl = `${API}/api/study/sda/quarter/${year}/${quarter}`;
  const cacheKey = `revelacode_sda_quarter:${year}:${quarter}`;
  const progressKey = `revelacode_sda_quarter_progress_v1:${year}:${quarter}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(progressKey) || "{}");
      setProgress(saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {});
    } catch { setProgress({}); }
  }, [progressKey]);

  useEffect(() => {
    const update = () => setConnectionState(readConnectionState());
    const onState = event => {
      const state = event?.detail?.state;
      if (["online", "poor", "offline"].includes(state)) setConnectionState(state);
    };
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener("revelacode:connection-state", onState);
    navigator.connection?.addEventListener?.("change", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("revelacode:connection-state", onState);
      navigator.connection?.removeEventListener?.("change", update);
    };
  }, []);

  const loadQuarter = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    if (!silent) setConnectionState(readConnectionState());

    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) throw new Error("offline");
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12000);
      const startedAt = Date.now();
      let payload;
      try {
        const response = await fetch(requestUrl, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`SDA Quarterly request failed (${response.status}).`);
        payload = await response.json();
        if (payload?.success === false || !Array.isArray(payload?.materials)) throw new Error("The Study service returned an invalid quarterly response.");
      } finally {
        window.clearTimeout(timeout);
      }
      const freshMaterials = payload.materials;
      setMaterials(freshMaterials);
      const savedAt = new Date().toISOString();
      const cachePayload = { materials: freshMaterials, savedAt, version: payload?.version || payload?.updated_at || "" };
      await writeCachedApiResponse("public:sda-quarterly", requestUrl, cachePayload);
      try { localStorage.setItem(cacheKey, JSON.stringify(cachePayload)); } catch { /* IndexedDB remains the durable offline cache. */ }
      setLastUpdated(savedAt);
      const nextState = (Date.now() - startedAt > 2500) ? "poor" : readConnectionState();
      setConnectionState(nextState);
      window.dispatchEvent(new CustomEvent("revelacode:connection-restored"));
      window.dispatchEvent(new CustomEvent("revelacode:connection-state", { detail: { state: nextState } }));
    } catch (loadError) {
      let cached = null;
      try {
        const cachedResult = await readCachedApiResponse("public:sda-quarterly", requestUrl);
        cached = cachedResult.hit ? cachedResult.payload : null;
      } catch { cached = null; }
      if (!cached) {
        try { cached = JSON.parse(localStorage.getItem(cacheKey) || "null"); } catch { cached = null; }
      }
      const nextState = typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "poor";
      setConnectionState(nextState);
      window.dispatchEvent(new CustomEvent("revelacode:connection-poor"));
      window.dispatchEvent(new CustomEvent("revelacode:connection-state", { detail: { state: nextState } }));
      if (Array.isArray(cached?.materials)) {
        setMaterials(cached.materials);
        setLastUpdated(cached.savedAt || cached.updated_at || "");
        setError(cached.materials.length ? "" : "No lessons are stored for this quarter yet.");
      } else {
        setMaterials([]);
        setLastUpdated("");
        setError(loadError?.message || "Couldn't load this quarter. Check your connection and retry.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQuarter();
    const refreshTimer = window.setInterval(() => loadQuarter({ silent: true }), 6 * 60 * 60 * 1000);
    return () => window.clearInterval(refreshTimer);
    // Quarter selection intentionally controls this request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, quarter]);

  const sortedMaterials = useMemo(() => [...materials].sort((left, right) => {
    const leftMeta = lessonMetadata(left);
    const rightMeta = lessonMetadata(right);
    return String(leftMeta.lesson_date || "").localeCompare(String(rightMeta.lesson_date || ""));
  }), [materials]);

  const lessonByDay = useMemo(() => {
    const mapped = {};
    WEEKDAYS.forEach((day, index) => {
      const direct = sortedMaterials.find(material => {
        const label = materialDay(material);
        return label === day.toLowerCase() || label.startsWith(day.toLowerCase());
      });
      mapped[day] = direct || sortedMaterials[index] || sortedMaterials[0] || null;
    });
    return mapped;
  }, [sortedMaterials]);

  const selectedLesson = lessonByDay[selectedDay] || sortedMaterials[0] || null;
  const selectedMeta = lessonMetadata(selectedLesson);
  const selectedId = lessonId(selectedLesson);
  const selectedDayIndex = WEEKDAYS.indexOf(selectedDay);
  const todayDay = currentKenyaWeekday();
  const todayIndex = WEEKDAYS.indexOf(todayDay);
  const doneDays = Object.fromEntries(WEEKDAYS.map(day => {
    const id = lessonId(lessonByDay[day]);
    return [day, Boolean(progress[id || day])];
  }));
  const streak = (() => {
    let start = doneDays[todayDay] ? todayIndex : todayIndex - 1;
    let count = 0;
    while (start >= 0 && doneDays[WEEKDAYS[start]]) { count += 1; start -= 1; }
    return count;
  })();

  const persistProgress = next => {
    setProgress(next);
    try { localStorage.setItem(progressKey, JSON.stringify(next)); } catch { setError("Progress could not be saved on this device."); }
  };

  const openReader = (material, day = selectedDay, focus = "") => {
    if (!material) return;
    setReaderLesson(material);
    setReaderDay(day);
    setReaderFocus(focus);
    setActiveReference("");
  };

  const openLessonInStudy = material => {
    const id = lessonId(material);
    if (!id || typeof onOpen !== "function") return;
    const meta = lessonMetadata(material);
    onOpen({ ...material, id, title: material?.title || meta.lesson_title || "SDA Quarterly lesson" });
  };

  const askQuestion = (question, material = readerLesson || selectedLesson) => {
    const prompt = String(question || "").trim();
    if (!prompt || !material) return;
    const meta = lessonMetadata(material);
    setAiLesson(material);
    setAiQuestion(prompt);
    setAiSheetOpen(true);
  };

  const currentAiContext = useMemo(() => {
    if (!aiLesson) return null;
    const meta = lessonMetadata(aiLesson);
    return {
      id: lessonId(aiLesson),
      title: aiLesson?.title || meta.lesson_title || "SDA Quarterly lesson",
      text: String(aiLesson?.content || aiLesson?.description || ""),
      day: meta.day || readerDay,
      date: meta.lesson_date,
      memoryText: meta.memory_text,
    };
  }, [aiLesson, readerDay]);

  const saveDayDone = material => {
    const id = lessonId(material) || readerDay;
    const next = { ...progress, [id]: true };
    persistProgress(next);
  };

  const selectDay = day => {
    setSelectedDay(day);
    const material = lessonByDay[day];
    if (material) openReader(material, day);
  };

  const navigateReaderDay = direction => {
    const nextIndex = Math.max(0, Math.min(6, WEEKDAYS.indexOf(readerDay) + direction));
    const nextDay = WEEKDAYS[nextIndex];
    setReaderDay(nextDay);
    setSelectedDay(nextDay);
    setReaderLesson(lessonByDay[nextDay] || readerLesson);
    setReaderFocus("");
  };

  const markDayDone = () => {
    if (!readerLesson) return;
    saveDayDone(readerLesson);
  };

  const todayMaterial = lessonByDay[selectedDay];
  const notesKey = `revelacode_sda_lesson_notes_v1:${year}:${quarter}:${lessonId(readerLesson) || readerDay}`;
  const aiPromptIsComplex = aiQuestion.trim().split(/\s+/).length > 25 || /\b(compare|explain in depth|historical|write|analyze|research)\b/i.test(aiQuestion);

  const openInRevelaAI = () => {
    if (!currentAiContext) return;
    const payload = { ...currentAiContext, question: aiQuestion };
    if (typeof onAskAI === "function") onAskAI(payload);
    else onOpenAI?.(payload);
    setAiSheetOpen(false);
  };

  const copyQuestion = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(aiQuestion);
      else throw new Error("Clipboard unavailable");
    } catch {
      setError("Couldn't copy the question. Select and copy it manually.");
    }
  };

  const openReferenceInBible = reference => {
    try { localStorage.setItem("revelacode_pending_bible_reference", reference); } catch {}
    setActiveReference("");
    setReaderLesson(null);
    onNavigate?.("bible");
  };

  const handleBack = () => {
    if (activeReference) { setActiveReference(""); return; }
    if (aiSheetOpen) { setAiSheetOpen(false); return; }
    if (quarterPickerOpen) { setQuarterPickerOpen(false); return; }
    if (readerLesson) { setReaderLesson(null); return; }
    if (typeof onBack === "function") onBack();
    else if (typeof onNavigate === "function") onNavigate("faith");
  };

  useEffect(() => {
    const onEscape = event => { if (event.key === "Escape") handleBack(); };
    document.addEventListener("keydown", onEscape);
    let subscription;
    App.addListener("backButton", handleBack).then(result => { subscription = result; }).catch(() => {});
    return () => { document.removeEventListener("keydown", onEscape); subscription?.remove?.(); };
  }, [activeReference, aiSheetOpen, quarterPickerOpen, readerLesson, onBack, onNavigate]);

  const currentDayDone = Boolean(progress[selectedId || selectedDay]);
  const resumeToday = () => openReader(todayMaterial, selectedDay);
  const showMemoryVerse = () => openReader(todayMaterial, selectedDay, "memory");
  const showMyNotes = () => openReader(todayMaterial, selectedDay, "notes");

  return (
    <FaithWorkspaceLayout
      page="quarterly"
      title="SDA Quarterly"
      description="Daily Sabbath School study"
      contextData={{ year, quarter, day: selectedDay, lesson: selectedLesson?.title || selectedMeta.lesson_title || "" }}
      onOpenAI={onOpenAI}
      onBack={onBack || (() => onNavigate?.("faith"))}
      onNavigate={onNavigate}
      onPrimaryAction={() => todayMaterial ? openReader(todayMaterial, selectedDay) : loadQuarter()}
      panel={false}
      showOfflineBanner={false}
      showHeader={false}
      showAskBar={false}
    >
      <main className="w-full min-w-0 space-y-3 overflow-x-clip pb-24">
        <header className="flex items-center justify-between gap-2 px-1 pt-1">
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" onClick={handleBack} aria-label="Back to Faith" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"><ArrowLeft size={19}/></button>
            <div className="min-w-0"><p className="truncate text-[0.65rem] font-semibold text-slate-500">Faith / SDA Quarterly</p><h1 className="truncate text-lg font-black leading-6">SDA Quarterly</h1></div>
          </div>
          <button type="button" onClick={() => setQuarterPickerOpen(true)} aria-label="Choose year and quarter" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"><Filter size={18}/></button>
        </header>

        <ConnectivityPill state={connectionState} quarter={quarter} year={year}/>
        <AskBar online={connectionState !== "offline" && (typeof navigator === "undefined" || navigator.onLine !== false)} onAsk={question => askQuestion(question, selectedLesson)}/>

        <WeekCard
          loading={loading && !sortedMaterials.length}
          lesson={selectedLesson}
          day={selectedDay}
          dayNumber={selectedDayIndex + 1}
          todayDay={todayDay}
          completed={doneDays}
          streak={streak}
          onSelectDay={selectDay}
          onRead={resumeToday}
          onMemoryVerse={showMemoryVerse}
          onNotes={showMyNotes}
        />

        <QuarterPicker
          year={year}
          quarter={quarter}
          open={quarterPickerOpen}
          onOpenChange={setQuarterPickerOpen}
          onApply={(nextYear, nextQuarter) => { setYear(nextYear); setQuarter(nextQuarter); setSelectedDay(currentKenyaWeekday()); }}
          onRefresh={() => loadQuarter({ silent: true })}
          refreshing={refreshing || loading}
        />

        {error && <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200"><span className="min-w-0">{error}</span><button type="button" onClick={() => loadQuarter()} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg bg-rose-700 px-3 text-xs font-bold text-white">Retry</button></div>}

        {!sortedMaterials.length && !loading && !error && <EmptyQuarter year={year} quarter={quarter} loading={loading || refreshing} lastUpdated={formatUpdated(lastUpdated)} onDownload={() => loadQuarter()}/>}

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2 px-1"><div><h2 className="text-sm font-black">Quarter archive</h2><p className="text-xs text-slate-500 dark:text-slate-400">{sortedMaterials.length} lesson{sortedMaterials.length === 1 ? "" : "s"} · Q{quarter} {year}</p></div><a href={sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">Official source <ExternalLink size={13}/></a></div>
          {loading && !sortedMaterials.length ? <div className="space-y-2">{Array.from({length:4},(_,i)=><div key={i} className={ "h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900 motion-reduce:animate-none"}/>)}</div> :
            sortedMaterials.length ? <div className="space-y-2">{sortedMaterials.map((material,index)=>{
              const meta=lessonMetadata(material); const id=lessonId(material)||String(index); const done=WEEKDAYS.some(day => Boolean(progress[completionKey(material, day)])); const dayLabel=meta.day||meta.weekday||"Daily lesson"; const title=material?.title||meta.lesson_title||"Sabbath School lesson";
              return <button key={id+"-"+index} type="button" onClick={()=>openReader(material, WEEKDAYS.find(day=>String(dayLabel).toLowerCase().startsWith(day.toLowerCase())) || selectedDay)} className="flex min-h-[76px] w-full min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left dark:border-slate-800 dark:bg-slate-900">
                <span className="flex shrink-0 items-center gap-0.5" aria-label={done ? "Progress started" : "Not started"}>{WEEKDAYS.map(day=><span key={day} title={day} className={"h-2 w-2 rounded-full "+(progress[completionKey(material, day)]?"bg-emerald-500":"bg-slate-300 dark:bg-slate-700")}/>)}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[0.65rem] font-bold uppercase tracking-wide text-slate-500">{meta.lesson_number ? "Lesson "+meta.lesson_number : "Lesson "+(index+1)} · {formatLessonDate(meta.lesson_date)}</span><span className="mt-1 block line-clamp-2 text-sm font-bold">{title}</span><span className="mt-0.5 block text-xs text-slate-500">{dayLabel}</span></span>
                <ArrowRight size={16} className="shrink-0 text-slate-400"/>
              </button>;
            })}</div> : <EmptyQuarter year={year} quarter={quarter} loading={loading || refreshing} lastUpdated={formatUpdated(lastUpdated)} onDownload={() => loadQuarter()}/>}
        </section>
      </main>

      {readerLesson && <LessonReader
        material={readerLesson}
        day={readerDay}
        completed={Boolean(progress[completionKey(readerLesson, readerDay)])}
        notesKey={notesKey}
        focusSection={readerFocus}
        activeReference={activeReference}
        onClose={() => { setReaderLesson(null); setActiveReference(""); }}
        onMarkDone={markDayDone}
        onNextDay={() => navigateReaderDay(1)}
        onPreviousDay={() => navigateReaderDay(-1)}
        onAsk={() => askQuestion("Help me understand the key message and practical application of this lesson.", readerLesson)}
        onOpenReference={setActiveReference}
        onCloseReference={() => setActiveReference("")}
        onOpenInBible={openReferenceInBible}
        onExternalOpen={typeof onOpen === "function" ? () => openLessonInStudy(readerLesson) : null}
      />}

      {aiSheetOpen && aiLesson && <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-2" role="dialog" aria-modal="true" aria-label="SDA lesson AI" onClick={() => setAiSheetOpen(false)}>
        <section className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:bg-slate-950" onClick={event=>event.stopPropagation()}>
          <div className="mb-2 flex items-center justify-between gap-2"><div className="min-w-0"><p className="text-[0.65rem] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Lesson companion</p><h2 className="truncate text-base font-black">{currentAiContext?.title}</h2></div><button type="button" onClick={()=>setAiSheetOpen(false)} aria-label="Close AI sheet" className="min-h-11 min-w-11 rounded-xl text-slate-500"><X size={18}/></button></div>
          <SdaLessonAIChat key={lessonId(aiLesson)+"-"+aiQuestion} material={{...aiLesson, title:currentAiContext?.title, metadata:{...lessonMetadata(aiLesson), day:currentAiContext?.day, lesson_date:currentAiContext?.date, memory_text:currentAiContext?.memoryText}}} initialQuestion={aiQuestion} onClose={()=>setAiSheetOpen(false)}/>
          <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={openInRevelaAI} className="min-h-11 rounded-xl bg-indigo-600 px-3 text-xs font-black text-white">Open in RevelaAI</button>{aiPromptIsComplex && <button type="button" onClick={copyQuestion} className="min-h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold dark:border-slate-700"><Copy size={14}/> Copy question</button>}</div>
        </section>
      </div>}
    </FaithWorkspaceLayout>
  );
}
