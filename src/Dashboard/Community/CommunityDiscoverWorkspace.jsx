import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Compass,
  GraduationCap,
  HeartHandshake,
  MapPin,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  Users,
  X,
} from "lucide-react";

import { getCommunityMediaItems } from "@/Dashboard/Community/CommunityMediaCards.jsx";

function textValue(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function getResultType(post) {
  return textValue(post?.type || post?.post_type || post?.category, "community")
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function getResultHub(post) {
  return textValue(post?.hub || post?.source_hub || post?.target_hub, "community")
    .toLowerCase();
}

function getResultTitle(post) {
  return textValue(post?.title || post?.subject || post?.name, "Community discovery");
}

function getResultBody(post) {
  return textValue(post?.body || post?.content || post?.text || post?.description);
}

function getResultAuthor(post) {
  return textValue(
    post?.author?.name ||
      post?.author?.full_name ||
      post?.author_name ||
      post?.business_name ||
      post?.owner_name ||
      post?.username,
    "Community member",
  );
}

function getResultLocation(post) {
  return textValue(
    post?.location ||
      post?.place ||
      post?.area ||
      post?.city ||
      post?.county ||
      post?.region,
  );
}

function getResultDate(value) {
  if (!value) return "Recently shared";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently shared";
  const elapsed = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(elapsed / 60000);
  const hours = Math.floor(elapsed / 3600000);
  const days = Math.floor(elapsed / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

function initials(name) {
  return textValue(name, "Member")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getResultIcon(type) {
  if (/job|work|opportun|hire/.test(type)) return Briefcase;
  if (/event|attend/.test(type)) return CalendarDays;
  if (/learn|school|education|course/.test(type)) return GraduationCap;
  if (/business|market|offer|service|sell/.test(type)) return Store;
  if (/help|request|question/.test(type)) return HeartHandshake;
  if (/group|network|people|member/.test(type)) return Users;
  return Compass;
}

function ResultCard({ post, onOpen }) {
  const title = getResultTitle(post);
  const description = getResultBody(post);
  const author = getResultAuthor(post);
  const location = getResultLocation(post);
  const type = getResultType(post);
  const hub = getResultHub(post);
  const Icon = getResultIcon(type);
  const avatar =
    post?.author?.avatar_url ||
    post?.author?.avatar ||
    post?.avatar_url ||
    post?.business_logo ||
    "";
  const media = getCommunityMediaItems(post);
  const image =
    media?.[0]?.url ||
    media?.[0]?.src ||
    post?.image_url ||
    post?.cover_image_url ||
    post?.photo_url ||
    "";
  const reason =
    post?.discovery?.reason ||
    post?._discovery_reason ||
    post?.match_reason ||
    "";
  const date = getResultDate(post?.created_at || post?.createdAt || post?.published_at);

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0d1729] shadow-[0_8px_24px_rgba(0,0,0,.14)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:shadow-[0_16px_32px_rgba(0,0,0,.22)]">
      {image ? (
        <button type="button" onClick={onOpen} className="relative block aspect-[16/8] w-full overflow-hidden bg-[#102a4b] text-left">
          <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" />
          <span className="absolute inset-0 bg-gradient-to-t from-[#061226]/70 via-transparent to-transparent" />
          <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-[#07172e]/85 px-2.5 py-1 text-[9px] font-black capitalize text-white backdrop-blur">{type}</span>
        </button>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {avatar ? (
              <img src={avatar} alt="" loading="lazy" className="h-9 w-9 shrink-0 rounded-xl border border-white/10 object-cover" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/10 text-[10px] font-black text-cyan-100">{initials(author)}</span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-[11px] font-black text-white">{author}</span>
              <span className="mt-0.5 flex items-center gap-1.5 text-[9px] text-slate-500">
                <Clock3 size={10} /> {date}
              </span>
            </span>
          </div>
          <span className="shrink-0 rounded-full border border-cyan-300/15 bg-cyan-300/[0.08] px-2.5 py-1 text-[9px] font-extrabold capitalize text-cyan-200">{hub}</span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
          <Icon size={12} className="text-cyan-300" /> {type}
        </div>
        <h3 className="mt-1.5 line-clamp-2 break-words text-[15px] font-black leading-5 text-white">{title}</h3>
        {description ? <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-xs leading-[1.6] text-slate-300">{description}</p> : null}

        {reason ? (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.05] px-3 py-2.5 text-[10px] leading-4 text-cyan-100/80">
            <Sparkles size={12} className="mt-0.5 shrink-0 text-cyan-300" />
            <span>{reason}</span>
          </div>
        ) : null}

        {location ? (
          <p className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
            <MapPin size={12} className="text-cyan-300" /> {location}
          </p>
        ) : null}

        <button type="button" onClick={onOpen} className="mt-4 inline-flex min-h-10 w-full items-center justify-between gap-2 rounded-xl bg-cyan-300 px-3.5 py-2.5 text-left text-[11px] font-black text-[#08213c] transition hover:bg-cyan-200">
          View details <ArrowRight size={14} />
        </button>
      </div>
    </article>
  );
}

export default function CommunityDiscoverWorkspace({
  posts = [],
  loading = false,
  error = "",
  refreshing = false,
  query = "",
  intent = "",
  submittedQuery = "",
  submittedIntent = "",
  intents = [],
  intentTiles = [],
  onQueryChange,
  onIntentChange,
  onSubmit,
  onSelectIntent,
  onRefresh,
  onOpenPost,
  onNavigate,
  displayName = "Community member",
}) {
  const [showAllIntents, setShowAllIntents] = useState(false);

  const activeIntent = submittedIntent || intent;
  const currentIntent = intents.find((item) => item.value === activeIntent);
  const resultCount = posts.length;
  const hubs = useMemo(
    () => new Set(posts.map(getResultHub).filter(Boolean)),
    [posts],
  );
  const hasSearch = Boolean(submittedQuery || submittedIntent);
  const visibleIntents = showAllIntents ? intents : intents.slice(0, 7);

  return (
    <div className="min-w-0 space-y-4 pb-10">
      <section className="relative isolate overflow-hidden rounded-[24px] border border-white/[0.08] bg-gradient-to-br from-[#071a3d] via-[#103b70] to-[#07566c] p-5 text-white shadow-[0_14px_35px_rgba(3,12,31,.28)] sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[32px] border-cyan-100/[0.07]" />
        <div className="pointer-events-none absolute -bottom-24 right-[20%] h-60 w-60 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-14 bottom-[-90px] h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
          <div className="max-w-[650px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-100/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-100 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(52,211,153,.12)]" />
              Jumuiya · Discovery
            </span>
            <h1 className="mt-4 text-[30px] font-black leading-[1.05] tracking-tight sm:text-[38px]">
              Find the people, ideas and opportunities that move you forward.
            </h1>
            <p className="mt-3 max-w-[560px] text-xs leading-5 text-blue-50/85 sm:text-[13px]">
              Explore real community connections across Kenya. Search with a purpose, discover useful matches and take the next step.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[9px] font-bold text-white/85">People & networks</span>
              <span className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[9px] font-bold text-white/85">Local businesses</span>
              <span className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[9px] font-bold text-white/85">Skills & opportunities</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/15 bg-[#07172e]/35 p-3.5 backdrop-blur">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-cyan-100/65">Results surfaced</p>
              <p className="mt-1 text-[28px] font-black leading-none text-white">{loading ? "…" : resultCount}</p>
              <p className="mt-1 text-[9px] text-blue-100/70">From your live discovery search</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-[#07172e]/35 p-3.5 backdrop-blur">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-cyan-100/65">Community hubs</p>
              <p className="mt-1 text-[28px] font-black leading-none text-white">{loading ? "…" : hubs.size}</p>
              <p className="mt-1 text-[9px] text-blue-100/70">Represented in these results</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[20px] border border-white/[0.08] bg-[#0d1729] p-3.5 shadow-[0_8px_24px_rgba(0,0,0,.12)] sm:p-4">
        <form onSubmit={onSubmit} className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_200px_auto]">
          <label className="relative min-w-0">
            <span className="sr-only">Search community discovery</span>
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-300" />
            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange?.(event.target.value)}
              maxLength={100}
              placeholder="Search people, businesses, skills, groups or places..."
              className="min-h-12 w-full rounded-xl border border-white/[0.08] bg-[#07111e] pl-10 pr-10 text-xs text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
            />
            {query ? (
              <button type="button" onClick={() => onQueryChange?.("")} aria-label="Clear search" className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"><X size={13} /></button>
            ) : null}
          </label>
          <label className="flex min-h-12 min-w-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-[#07111e] px-3">
            <Compass size={15} className="shrink-0 text-cyan-300" />
            <select
              value={intent}
              onChange={(event) => onIntentChange?.(event.target.value)}
              aria-label="Choose discovery intent"
              className="min-w-0 flex-1 bg-transparent text-xs font-bold text-slate-200 outline-none"
            >
              {intents.map((item) => <option key={item.value || "all"} value={item.value} className="bg-[#0d1729]">{item.label}</option>)}
            </select>
          </label>
          <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-xs font-black text-[#08213c] shadow-lg shadow-cyan-950/25 transition hover:bg-cyan-200">
            <Search size={14} /> Discover
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-3">
          <span className="mr-1 text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">Popular intents</span>
          {visibleIntents.map((item) => (
            <button
              key={item.value || "all"}
              type="button"
              onClick={() => item.value ? onSelectIntent?.(item.value) : onSelectIntent?.("")}
              aria-pressed={activeIntent === item.value}
              className={"rounded-full border px-3 py-2 text-[9px] font-bold transition " + (activeIntent === item.value ? "border-cyan-300/30 bg-cyan-300 text-[#08213c]" : "border-white/[0.08] bg-white/[0.035] text-slate-400 hover:border-cyan-300/25 hover:text-white")}
            >
              {item.label}
            </button>
          ))}
          {intents.length > 7 ? (
            <button type="button" onClick={() => setShowAllIntents((value) => !value)} className="ml-auto text-[9px] font-bold text-cyan-300 hover:text-cyan-100">
              {showAllIntents ? "Show less" : "More intents"}
            </button>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300">Discover what's possible</p>
            <h2 className="mt-1 text-lg font-black tracking-tight text-white">
              {hasSearch ? "Your discovery results" : "Explore the Jumuiya ecosystem"}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {loading ? "Searching the community…" : `${resultCount} ${resultCount === 1 ? "result" : "results"}`}
              {currentIntent ? ` · ${currentIntent.label}` : ""}
              {submittedQuery ? ` · “${submittedQuery}”` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || refreshing}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-[10px] font-bold text-slate-300 transition hover:border-cyan-400/40 hover:bg-white/[0.04] disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> Refresh results
          </button>
        </div>

        {error ? (
          <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-500/[0.07] px-4 py-3 text-xs text-rose-200">
            <span>{error}</span>
            <button type="button" onClick={onRefresh} className="shrink-0 font-black text-rose-100 underline">Retry</button>
          </div>
        ) : null}

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="animate-pulse overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0d1729] p-4">
                <div className="h-10 w-36 rounded-xl bg-[#172a43]" />
                <div className="mt-4 h-4 w-3/4 rounded bg-[#172a43]" />
                <div className="mt-3 h-3 w-full rounded bg-[#172a43]" />
                <div className="mt-2 h-3 w-4/5 rounded bg-[#172a43]" />
                <div className="mt-5 h-9 rounded-xl bg-[#172a43]" />
              </div>
            ))}
          </div>
        ) : posts.length ? (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 2xl:grid-cols-3">
            {posts.map((post, index) => (
              <ResultCard
                key={post?.id || post?._id || post?.post_id || `discovery-${index}`}
                post={post}
                onOpen={() => onOpenPost?.(post)}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[22px] border border-dashed border-white/[0.12] bg-[#0d1729] px-5 py-10 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-100"><Compass size={27} /></span>
            <h3 className="mt-4 text-base font-black text-white">{hasSearch ? "No matches found yet" : "Your next connection starts here"}</h3>
            <p className="mt-2 max-w-md text-xs leading-5 text-slate-400">
              {hasSearch ? "Try a broader keyword or another intention. Discovery only shows results returned by the live Community service." : "Search for a person, business, skill or opportunity, or choose an intention above to explore."}
            </p>
            <button type="button" onClick={() => { onQueryChange?.(""); onIntentChange?.(""); onSelectIntent?.(""); }} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-black text-[#08213c] transition hover:bg-cyan-200">
              Reset discovery <X size={13} />
            </button>
          </div>
        )}
      </section>

      <section className="rounded-[20px] border border-cyan-500/15 bg-gradient-to-br from-[#0b2346] to-[#0b354b] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-cyan-100"><ShieldCheck size={18} /></span>
            <span>
              <span className="block text-xs font-black text-white">Discover with confidence</span>
              <span className="mt-1 block max-w-[600px] text-[10px] leading-4 text-blue-100/75">Explore verified information where available. Review profiles and details carefully before sharing personal information or making arrangements.</span>
            </span>
          </div>
          <button type="button" onClick={() => onNavigate?.("community-people")} className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-[10px] font-black text-cyan-100 transition hover:bg-white/[0.06]">
            Member directory <ChevronRight size={13} />
          </button>
        </div>
      </section>

      {intentTiles.length ? (
        <section className="space-y-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300">Choose a direction</p>
            <h2 className="mt-1 text-base font-black text-white">Explore by intention</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {intentTiles.map((tile) => {
              const TileIcon = tile.icon;
              return (
                <button key={tile.value} type="button" onClick={() => onSelectIntent?.(tile.value)} className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#0d1729] p-3 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-[#11233a]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200"><TileIcon size={16} /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-[10px] font-black text-white">{tile.label}</span>
                    <span className="mt-0.5 block truncate text-[9px] text-slate-500">{tile.detail}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
