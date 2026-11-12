import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  Users,
  RefreshCw,
  X,
  CalendarDays,
} from "lucide-react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

function arrayFrom(value) {
  if (Array.isArray(value?.data?.items)) return value.data.items;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.posts)) return value.posts;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

function safeText(value, fallback = "") {
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  const normalized = String(value).trim();
  return normalized || fallback;
}

function initials(name) {
  return String(name || "Member")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "RC";
}

function formatJoinedDate(value) {
  if (!value) return "Member";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Member";
  return "Joined " + new Intl.DateTimeFormat("en-KE", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function CommunityPeopleDirectory({ onBack, onInvite }) {
  const { get } = useJumuiyaApi();
  const [members, setMembers] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_previous: false,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const requestVersion = useRef(0);

  const load = useCallback(async (quiet = false) => {
    const version = ++requestVersion.current;
    quiet ? setRefreshing(true) : setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
      });
      if (query.trim()) params.set("search", query.trim());

      const response = await get("/community/members?" + params.toString());
      if (version !== requestVersion.current) return;

      const payload = response?.data || response;
      const meta = response?.meta || payload?.meta || {};
      setMembers(arrayFrom(response));
      setPagination({
        page: Number(meta.page) || page,
        limit: Number(meta.limit || meta.per_page) || 50,
        total: Number(meta.total) || 0,
        total_pages: Number(meta.total_pages || meta.pages) || 0,
        has_next: Boolean(meta.has_next),
        has_previous: Boolean(meta.has_previous),
      });
    } catch (requestError) {
      if (version !== requestVersion.current) return;
      setError(requestError?.message || "The RevelaCode membership directory could not be loaded.");
      setMembers([]);
      setPagination((current) => ({ ...current, total: 0, total_pages: 0, has_next: false, has_previous: false }));
    } finally {
      if (version === requestVersion.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [get, page, query]);

  useEffect(() => {
    const delay = query.trim() ? 250 : 0;
    const timer = window.setTimeout(() => load(), delay);
    return () => window.clearTimeout(timer);
  }, [load]);

  const changePage = (nextPage) => {
    if (nextPage < 1 || (pagination.total_pages && nextPage > pagination.total_pages)) return;
    setPage(nextPage);
    setSelected(null);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#071827] via-[#0d2d43] to-[#07566a] p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
        <button
          type="button"
          onClick={() => { if (typeof onBack === "function") onBack(); }}
          className="relative inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white/85 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <ArrowLeft size={14} /> Community home
        </button>
        <div className="relative mt-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[.2em] text-cyan-200">Jumuiya · Membership</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">The RevelaCode community.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
              Discover registered members across the RevelaCode ecosystem, including people who have not published a Community post yet.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { if (typeof onInvite === "function") onInvite(); }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-900 transition hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <Users size={15} /> Invite a member
          </button>
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:max-w-sm">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <p className="text-2xl font-black tabular-nums">{loading && !pagination.total ? "…" : pagination.total.toLocaleString("en-KE")}</p>
            <p className="mt-1 text-[11px] font-semibold text-white/70">Registered active members</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <p className="text-2xl font-black">All hubs</p>
            <p className="mt-1 text-[11px] font-semibold text-white/70">One RevelaCode membership</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/[0.08] dark:bg-[#0d1729] sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              type="search"
              aria-label="Search registered members"
              placeholder="Search registered member names…"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-white/[0.08] dark:bg-[#07111e] dark:text-white"
            />
          </div>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing || loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/5"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh directory
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-500 dark:text-slate-400">
          <span>Showing {members.length.toLocaleString("en-KE")} of {pagination.total.toLocaleString("en-KE")} registered members</span>
          <span>Only public profile details are displayed.</span>
        </div>
      </section>

      {error ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
          <button type="button" onClick={() => load()} className="ml-3 font-bold underline underline-offset-2">Try again</button>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl bg-slate-100 dark:bg-[#07111e]" />)}
        </div>
      ) : members.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => (
              <article key={member.id} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-lg dark:border-white/[0.08] dark:bg-[#0d1729]">
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 text-lg font-black text-cyan-800 dark:from-cyan-950 dark:to-blue-950 dark:text-cyan-200">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : initials(member.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-black text-slate-900 dark:text-white">{safeText(member.name, "RevelaCode member")}</h2>

                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-white/5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <CalendarDays size={13} /> {formatJoinedDate(member.joined_at)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelected(member)}
                    className="rounded-lg bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-800 transition hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:bg-cyan-950/40 dark:text-cyan-300"
                  >
                    View profile
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/[0.08] dark:bg-[#0d1729] sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Page {pagination.page || page} of {Math.max(1, pagination.total_pages)}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changePage(page - 1)}
                disabled={!pagination.has_previous || loading}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                <ChevronLeft size={15} /> Previous
              </button>
              <button
                type="button"
                onClick={() => changePage(page + 1)}
                disabled={!pagination.has_next || loading}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-white/15 dark:bg-[#0d1729]">
          <Users size={26} className="mx-auto text-slate-400" />
          <h2 className="mt-3 text-base font-black text-slate-900 dark:text-white">{query ? "No matching members" : "No registered members found"}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            {query ? "Try a different member name." : "Verified, active RevelaCode accounts will appear here, including members who have not posted in Community."}
          </p>
          {!query ? (
            <button
              type="button"
              onClick={() => { if (typeof onInvite === "function") onInvite(); }}
              className="mt-4 rounded-xl bg-cyan-700 px-4 py-3 text-xs font-black text-white transition hover:bg-cyan-800"
            >
              Invite a member
            </button>
          ) : null}
        </div>
      )}

      {selected ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="community-member-title" className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-[#0d1729] sm:rounded-3xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-cyan-100 text-lg font-black text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200">
                  {selected.avatar_url ? <img src={selected.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(selected.name)}
                </div>
                <div className="min-w-0">
                  <h2 id="community-member-title" className="truncate text-lg font-black text-slate-900 dark:text-white">{safeText(selected.name, "RevelaCode member")}</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatJoinedDate(selected.joined_at)}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close profile" className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:hover:bg-slate-800">
                <X size={17} />
              </button>
            </div>
            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500 dark:bg-[#07111e] dark:text-slate-400">
              <ShieldCheck size={14} className="mr-1 inline text-cyan-600" /> Only public profile details are shown. Private contact information is not exposed by the directory.
            </div>
            <button type="button" onClick={() => setSelected(null)} className="mt-5 w-full rounded-xl bg-cyan-700 px-4 py-3 text-sm font-black text-white transition hover:bg-cyan-800">
              Done
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}
