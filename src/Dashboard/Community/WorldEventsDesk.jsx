import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight, Bookmark, Check, ChevronDown, Clock3, ExternalLink,
  Globe2, HeartHandshake, MapPin, Newspaper, Play, RefreshCw,
  ShieldCheck, Sparkles, X, Youtube,
} from "lucide-react";
import { jumuiyaRequest } from "@/services/jumuiyaApi.jsx";

const TOPICS = [
  ["politics", "Governance"], ["economy", "Economy & jobs"],
  ["education", "Education"], ["agriculture", "Agriculture"],
  ["health", "Health"], ["technology", "Technology"],
  ["science", "Science"], ["climate", "Climate"],
  ["environment", "Environment"], ["humanitarian", "Humanitarian"],
  ["security", "Security"], ["faith_society", "Faith & society"],
  ["sports", "Sports"], ["culture", "Culture"],
  ["public_safety", "Public safety"],
];
const REGIONS = [
  ["kenya", "Kenya"], ["africa", "Africa"], ["world", "World"],
];

function storageKeys(user) {
  const identity = String(user?.id || user?._id || user?.user_id || user?.userId || user?.username || "guest")
    .trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 80) || "guest";
  const prefix = "revelacode_world_events_v1_" + identity;
  return { preferences: prefix + "_preferences", saved: prefix + "_saved", hidden: prefix + "_hidden", affinity: prefix + "_affinity" };
}

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const value = JSON.parse(raw);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* device storage may be unavailable */ }
}

function relativeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 2) return "Just now";
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h ago";
  return date.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

function normalizeResponse(response) {
  const envelope = response?.data ?? response;
  const payload = Array.isArray(envelope?.data) ? envelope : (envelope?.data ?? envelope);
  return {
    events: Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.events) ? payload.events : [],
    sources: Array.isArray(payload?.sources) ? payload.sources : [],
    publisher: payload?.publisher || { name: "RevelaCode", label: "Official World Desk" },
    updatedAt: payload?.updated_at || null,
    storage: payload?.storage || "ephemeral_memory_only",
    retentionHours: Number(payload?.retention_hours || 48),
  };
}

export default function WorldEventsDesk({ user = null, compact = false, initialLimit = 4 }) {
  const keys = useMemo(() => storageKeys(user), [user?.id, user?._id, user?.user_id, user?.userId, user?.username]);
  const [preferences, setPreferences] = useState(() => readJson(keys.preferences, { topics: [], regions: ["kenya", "africa", "world"] }));
  const [savedIds, setSavedIds] = useState(() => readJson(keys.saved, []));
  const [hiddenIds, setHiddenIds] = useState(() => readJson(keys.hidden, []));
  const [affinity, setAffinity] = useState(() => readJson(keys.affinity, {}));
  const [events, setEvents] = useState([]);
  const [sources, setSources] = useState([]);
  const [publisher, setPublisher] = useState({ name: "RevelaCode", label: "Official World Desk" });
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showPreferences, setShowPreferences] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeVideo, setActiveVideo] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setPreferences(readJson(keys.preferences, { topics: [], regions: ["kenya", "africa", "world"] }));
    setSavedIds(readJson(keys.saved, []));
    setHiddenIds(readJson(keys.hidden, []));
    setAffinity(readJson(keys.affinity, {}));
  }, [keys]);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await jumuiyaRequest("/community/world-events/feed?limit=40");
      const result = normalizeResponse(response);
      setEvents(result.events);
      setSources(result.sources);
      setPublisher(result.publisher);
      setUpdatedAt(result.updatedAt || new Date().toISOString());
    } catch (requestError) {
      setError(requestError?.message || "World Events could not be reached. Please retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    load();
    const timer = window.setInterval(() => { if (active) load({ silent: true }); }, 8 * 60 * 1000);
    return () => { active = false; window.clearInterval(timer); };
  }, [load]);

  const visibleEvents = useMemo(() => {
    const topicSet = new Set(preferences.topics || []);
    const regionSet = new Set(preferences.regions?.length ? preferences.regions : ["kenya", "africa", "world"]);
    return events
      .filter((event) => !hiddenIds.includes(event.id))
      .filter((event) => regionSet.has(String(event.region || "world").toLowerCase()))
      .map((event) => {
        const categories = Array.isArray(event.categories) ? event.categories : [];
        const matchCount = categories.reduce((score, topic) => score + (topicSet.has(topic) ? 20 : 0) + Math.min(12, Number(affinity[topic] || 0) * 2), 0);
        return { ...event, __interestScore: matchCount };
      })
      .sort((a, b) => {
        if (a.__interestScore !== b.__interestScore) return b.__interestScore - a.__interestScore;
        return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
      });
  }, [events, preferences, hiddenIds, affinity]);

  const updatePreferences = (next) => {
    setPreferences(next);
    writeJson(keys.preferences, next);
  };

  const toggleTopic = (topic) => {
    const topics = new Set(preferences.topics || []);
    if (topics.has(topic)) topics.delete(topic);
    else topics.add(topic);
    updatePreferences({ ...preferences, topics: Array.from(topics) });
  };

  const toggleRegion = (region) => {
    const regions = new Set(preferences.regions || []);
    if (regions.has(region)) regions.delete(region);
    else regions.add(region);
    updatePreferences({ ...preferences, regions: Array.from(regions).length ? Array.from(regions) : ["kenya", "africa", "world"] });
  };

  const learnFromEvent = (event) => {
    const next = { ...affinity };
    for (const topic of event?.categories || []) next[topic] = Math.min(6, Number(next[topic] || 0) + 1);
    setAffinity(next);
    writeJson(keys.affinity, next);
  };

  const toggleSave = (event) => {
    const eventId = event.id;
    const next = savedIds.includes(eventId) ? savedIds.filter((id) => id !== eventId) : [...savedIds, eventId].slice(-200);
    setSavedIds(next);
    writeJson(keys.saved, next);
    if (!savedIds.includes(eventId)) learnFromEvent(event);
  };

  const hideEvent = (eventId) => {
    const next = [...new Set([...hiddenIds, eventId])].slice(-300);
    setHiddenIds(next);
    writeJson(keys.hidden, next);
  };

  const healthySources = sources.filter((source) => source.status === "healthy").length;
  const shown = visibleEvents.slice(0, showAll ? Math.min(visibleEvents.length, 24) : initialLimit);
  const title = compact ? "World Events for the Community" : "World Events & Life Lessons";

  return (
    <>
    <section aria-label="RevelaCode World Events" className="mb-5 overflow-hidden rounded-[24px] border border-indigo-200/80 bg-white shadow-sm dark:border-indigo-900/50 dark:bg-slate-900">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#101b45] via-[#263b79] to-[#315f93] px-4 py-5 text-white sm:px-5">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full border-[22px] border-white/5" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-100">
              <Globe2 size={12} /> {publisher.name || "RevelaCode"} {publisher.handle || "@revelacode"} · {publisher.label || "Official World Desk"}
            </span>
            <h2 className="mt-3 text-xl font-black tracking-tight sm:text-2xl">{title}</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-blue-100/85">
              Fresh publisher feeds, useful context, practical life lessons and thoughtful reflection — from Kenya to every region of the world.
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-blue-100/70">
              <span className="inline-flex items-center gap-1"><ShieldCheck size={12} /> Publisher links preserved</span>
              <span className="inline-flex items-center gap-1"><Clock3 size={12} /> Automatically expires after 48 hours</span>
              <span className="inline-flex items-center gap-1"><Sparkles size={12} /> Personalised on this device</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => setShowPreferences((value) => !value)} aria-expanded={showPreferences} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-[10px] font-extrabold text-white hover:bg-white/15">
              <SlidersLabel /> Interests
            </button>
            <button type="button" onClick={() => load({ silent: true })} disabled={refreshing || loading} aria-label="Refresh World Events" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/15 disabled:opacity-50">
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          {REGIONS.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={(preferences.regions || []).includes(key)} onClick={() => toggleRegion(key)} className={"rounded-full border px-3 py-1.5 text-[10px] font-extrabold transition " + ((preferences.regions || []).includes(key) ? "border-white bg-white text-indigo-900" : "border-white/25 bg-white/5 text-white/80 hover:bg-white/10")}>
              {label}
            </button>
          ))}
          <span className="ml-auto text-[10px] font-semibold text-blue-100/75">{healthySources}/{sources.length || SOURCE_COUNT} sources responding</span>
        </div>
      </div>

      {showPreferences ? (
        <div className="border-b border-slate-200 bg-indigo-50/60 p-4 dark:border-white/10 dark:bg-indigo-950/20">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white">Choose what reaches your feed</h3>
              <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">Your selected interests stay on this device. Reading and saving also tune the local feed.</p>
            </div>
            <button type="button" onClick={() => setShowPreferences(false)} aria-label="Close interests" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white dark:hover:bg-white/10"><X size={15} /></button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {TOPICS.map(([key, label]) => {
              const active = (preferences.topics || []).includes(key);
              return <button key={key} type="button" aria-pressed={active} onClick={() => toggleTopic(key)} className={"rounded-full border px-3 py-2 text-[10px] font-bold " + (active ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300")}>{active ? "✓ " : ""}{label}</button>;
            })}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{(preferences.topics || []).length ? "Your feed prioritises selected interests." : "No topic selected — showing a balanced feed."}</span>
            <button type="button" onClick={() => updatePreferences({ topics: [], regions: ["kenya", "africa", "world"] })} className="text-[10px] font-bold text-indigo-700 underline dark:text-indigo-300">Reset interests</button>
          </div>
        </div>
      ) : null}

      <div className="p-3 sm:p-4">
        {error && !events.length ? (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200">
            {error} <button type="button" onClick={() => load()} className="ml-2 font-bold underline">Retry</button>
          </div>
        ) : null}
        {loading && !events.length ? (
          <div className="space-y-3 animate-pulse">{[1, 2].map((item) => <div key={item} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800" />)}</div>
        ) : shown.length ? (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {shown.map((event) => {
              const isSaved = savedIds.includes(event.id);
              const videoId = event.youtube_video_id || "";
              const playing = activeVideo === event.id;
              return (
                <article key={event.id} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-indigo-200 hover:shadow-md dark:border-white/10 dark:bg-slate-950/40 dark:hover:border-indigo-800">
                  <div className="relative aspect-[16/8] overflow-hidden bg-gradient-to-br from-[#101b45] via-[#263b79] to-[#315f93]">
                    {event.urlToImage ? (
                      <img src={event.urlToImage} alt={event.headline || "World event"} loading="lazy" className="absolute inset-0 h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
                        <Globe2 size={34} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em]">World Events · {event.region || "World"}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-slate-950/10" />
                    <span className="absolute left-3 top-3 rounded-full bg-slate-950/75 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white">{event.region || "world"}</span>
                    {videoId ? <button type="button" onClick={() => { learnFromEvent(event); setActiveVideo(playing ? "" : event.id); }} className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-2 text-[10px] font-black text-white shadow-lg"><Play size={13} fill="currentColor" /> {playing ? "Close video" : "Watch video"}</button> : null}
                  </div>
                  <div className="space-y-3 p-3.5 sm:p-4">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-400">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Newspaper size={11} /> {event.source || "Publisher"}</span>
                      <span className="inline-flex items-center gap-1"><Clock3 size={11} /> {relativeDate(event.publishedAt)}</span>
                      {(event.categories || []).slice(0, 2).map((category) => <span key={category} className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">{category.replace(/_/g, " ")}</span>)}
                    </div>
                    <h3 className="text-sm font-black leading-5 text-slate-950 dark:text-white sm:text-base">{event.headline}</h3>
                    {event.description ? <p className="line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{event.description}</p> : null}
                    <button type="button" onClick={() => { learnFromEvent(event); setSelectedEvent(event); }} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-slate-950">
                      View more <ArrowUpRight size={14} />
                    </button>
                    {playing && videoId ? (
                      <div className="overflow-hidden rounded-xl bg-black">
                        <iframe title={event.headline} src={"https://www.youtube-nocookie.com/embed/" + encodeURIComponent(videoId) + "?autoplay=1&rel=0"} className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
                      </div>
                    ) : null}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-white/5">
                      <button type="button" onClick={() => toggleSave(event)} aria-pressed={isSaved} className={"inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-bold " + (isSaved ? "border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200" : "border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-300")}><Bookmark size={13} fill={isSaved ? "currentColor" : "none"} /> {isSaved ? "Saved on this device" : "Save"}</button>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => hideEvent(event.id)} className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">Not for me</button>
                        <a href={event.url} target="_blank" rel="noopener noreferrer" onClick={() => learnFromEvent(event)} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-[10px] font-black text-white transition hover:bg-indigo-700">Original source <ExternalLink size={12} /></a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-7 text-center dark:border-white/10">
            <Globe2 size={24} className="mx-auto text-slate-400" />
            <p className="mt-2 text-sm font-black text-slate-800 dark:text-white">No matching stories in this view</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Change your region or interests to widen the feed.</p>
          </div>
        )}
        {visibleEvents.length > initialLimit ? (
          <div className="mt-3 flex justify-center">
            <button type="button" onClick={() => setShowAll((value) => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2 text-xs font-black text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/30">
              {showAll ? "Show fewer stories" : `Show more stories (${visibleEvents.length - shown.length} more)`}
              <ChevronDown size={14} className={showAll ? "rotate-180" : ""} />
            </button>
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-white/5">
          <div className="text-[10px] text-slate-400">
            <span>{updatedAt ? "Updated " + relativeDate(updatedAt) : "Waiting for first source check"}</span>
            <span className="mx-1.5">·</span>
            <span>{healthySources} live feeds responding</span>
            <span className="mx-1.5">·</span>
            <span>Ephemeral cache; no news stored in MongoDB</span>
          </div>
          <button type="button" onClick={() => setShowSources((value) => !value)} className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 hover:underline dark:text-indigo-300">Source status <ChevronDown size={12} /></button>
        </div>
        {showSources ? (
          <div className="mt-3">
            <p className="mb-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400">A healthy status means the publisher feed responded and parsed successfully. It is not a claim that RevelaCode has independently verified every reported fact; always consult the original source.</p>
            <div className="grid gap-2 sm:grid-cols-2">
            {sources.map((source) => <div key={source.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[10px] dark:border-white/10"><span className="min-w-0 truncate font-semibold text-slate-700 dark:text-slate-200">{source.name}</span><span className={"shrink-0 rounded-full px-2 py-1 font-black " + (source.status === "healthy" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : source.status === "degraded" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800")}>{source.status || "pending"}</span></div>)}
            </div>
          </div>
        ) : null}
      </div>
    </section>
      {selectedEvent ? (
        <div className="fixed inset-0 z-[140] flex items-end justify-center bg-slate-950/75 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedEvent(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="world-event-story-title" className="max-h-[94dvh] w-full max-w-4xl overflow-y-auto rounded-t-3xl border border-white/10 bg-white shadow-2xl dark:bg-slate-950 sm:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/95 sm:px-6">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">RevelaCode · Official World Desk</p>
                <p className="truncate text-xs font-bold text-slate-500 dark:text-slate-400">World Events & Life Lessons</p>
              </div>
              <button type="button" onClick={() => setSelectedEvent(null)} aria-label="Close story" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"><X size={18} /></button>
            </div>
            <div className="relative aspect-[16/7] min-h-[180px] overflow-hidden bg-gradient-to-br from-[#101b45] via-[#263b79] to-[#315f93] sm:min-h-[260px]">
              {selectedEvent.urlToImage ? <img src={selectedEvent.urlToImage} alt={selectedEvent.headline || "World event"} className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <div className="absolute inset-0 flex items-center justify-center text-white/70"><Globe2 size={54} /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-7">
                <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur">{selectedEvent.region || "World"}</span>
                <h2 id="world-event-story-title" className="mt-3 max-w-3xl text-xl font-black leading-tight text-white sm:text-3xl">{selectedEvent.headline}</h2>
              </div>
            </div>
            <article className="space-y-5 px-4 py-5 sm:px-7 sm:py-7">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-900"><Newspaper size={13} /> {selectedEvent.source || "Publisher"}</span>
                <span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> {relativeDate(selectedEvent.publishedAt)}</span>
                {(selectedEvent.categories || []).map((category) => <span key={category} className="rounded-full bg-indigo-50 px-2.5 py-1.5 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200">{category.replace(/_/g, " ")}</span>)}
              </div>
              <section className="max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">What happened</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-200">{selectedEvent.description || "The publisher has not supplied a summary. Read the original report for the full account."}</p>
              </section>
              {selectedEvent.why_it_matters ? <section className="max-w-3xl rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/25 sm:p-5"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-indigo-700 dark:text-indigo-300"><Sparkles size={15} /> Why it matters</p><p className="mt-2 text-sm leading-7 text-indigo-950 dark:text-indigo-100">{selectedEvent.why_it_matters}</p></section> : null}
              {selectedEvent.life_lesson ? <section className="max-w-3xl rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20 sm:p-5"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-800 dark:text-emerald-300"><HeartHandshake size={15} /> Life lesson</p><p className="mt-2 text-sm leading-7 text-emerald-950 dark:text-emerald-100">{selectedEvent.life_lesson}</p>{selectedEvent.reflection_question ? <p className="mt-3 border-t border-emerald-200 pt-3 text-sm font-bold leading-6 text-emerald-900 dark:border-emerald-900/50 dark:text-emerald-200">{selectedEvent.reflection_question}</p> : null}</section> : null}
              {selectedEvent.faith_reflection ? <details className="max-w-3xl rounded-2xl border border-slate-200 px-4 py-3 dark:border-white/10"><summary className="cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200">Optional faith reflection</summary><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{selectedEvent.faith_reflection}</p></details> : null}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
                <button type="button" onClick={() => toggleSave(selectedEvent)} aria-pressed={savedIds.includes(selectedEvent.id)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 dark:border-white/10 dark:text-slate-200"><Bookmark size={14} /> {savedIds.includes(selectedEvent.id) ? "Saved on this device" : "Save story"}</button>
                <a href={selectedEvent.url} target="_blank" rel="noopener noreferrer" onClick={() => learnFromEvent(selectedEvent)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-700">Read original publisher report <ExternalLink size={13} /></a>
              </div>
            </article>
          </section>
        </div>
      ) : null}
    </>
  );
}

function SlidersLabel() {
  return <span className="inline-flex items-center gap-1"><Sparkles size={13} /> Interests</span>;
}

const SOURCE_COUNT = 19;
