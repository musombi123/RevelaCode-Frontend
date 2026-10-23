import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, ExternalLink, RefreshCw } from "lucide-react";

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

export default function SDAQuarterlyWorkspace({ onOpen }) {
  const [initial] = useState(kenyaQuarterNow);
  const [year, setYear] = useState(initial.year);
  const [quarter, setQuarter] = useState(initial.quarter);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const sourceUrl = `https://www.sabbath.school/LessonBook?quarter=${quarter}&year=${year}`;

  const loadQuarter = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/api/study/sda/quarter/${year}/${quarter}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
          cache: "no-store",
        }
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || `Quarter request failed (${response.status}).`);
      }
      setMaterials(Array.isArray(payload?.materials) ? payload.materials : []);
    } catch (loadError) {
      console.error("SDA Quarterly loading error:", loadError);
      setError(loadError?.message || "Unable to load SDA Quarterly lessons.");
      setMaterials([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQuarter();
    // Quarter selection intentionally controls this request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, quarter]);

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

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-sm dark:border-amber-900/50 dark:from-amber-950/30 dark:via-gray-900 dark:to-orange-950/20">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
              <CalendarDays size={22} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Sabbath School · Faith</div>
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
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{sortedMaterials.length} imported daily lesson{sortedMaterials.length === 1 ? "" : "s"} · Q{quarter} {year}</p>
          <button type="button" onClick={() => loadQuarter({ silent: true })} disabled={refreshing || loading} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </section>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
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
            return (
              <button key={lessonId(material) || `${year}-${quarter}-${index}`} type="button" onClick={() => openLesson(material)} className="group flex min-h-[128px] min-w-0 flex-col rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-amber-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-amber-800 sm:p-4">
                <div className="flex w-full items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    <BookOpen size={12} /> {lessonLabel}
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold text-gray-500 dark:text-gray-400">{dateLabel}</span>
                </div>
                <h3 className="mt-2 line-clamp-2 text-sm font-black leading-5 text-gray-900 dark:text-white">{material?.title || meta.lesson_title || `Lesson ${index + 1}`}</h3>
                {dayLabel && <p className="mt-1 text-xs font-bold text-amber-700 dark:text-amber-300">{dayLabel}</p>}
                {meta.memory_text && <p className="mt-1 line-clamp-2 text-xs leading-4 text-gray-500 dark:text-gray-400">Memory text: {meta.memory_text}</p>}
                {!meta.memory_text && summary && <p className="mt-1 line-clamp-2 text-xs leading-4 text-gray-500 dark:text-gray-400">{summary}</p>}
                <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-bold text-amber-700 dark:text-amber-300">Open lesson <ExternalLink size={12} className="transition-transform group-hover:translate-x-0.5" /></span>
              </button>
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

      {sortedMaterials.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">Original lesson source and teacher materials remain with each imported lesson when available.</p>
          <a href={sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 underline dark:text-amber-300">Official quarterly <ExternalLink size={13} /></a>
        </div>
      )}
    </div>
  );
}
