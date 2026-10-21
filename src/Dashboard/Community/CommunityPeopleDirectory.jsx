import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin, Search, ShieldCheck, Users, User, RefreshCw, X } from "lucide-react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

function arrayFrom(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.posts)) return value.posts;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.items)) return value.items;
  return [];
}
function authorFor(post) {
  const author = post?.author || post?.user || {};
  const id = author.user_id || author.member_id || author.id || author._id || post?.author_user_id || post?.user_id;
  if (!id) return null;
  return {
    id: String(id),
    name: author.name || author.full_name || author.fullName || post?.author_name || "Community member",
    avatar: author.avatar_url || author.avatar || author.profile_image || null,
    bio: author.bio || "",
    county: author.county || "",
    town: author.town || "",
    postCount: 1,
    latestPost: post,
    contactEnabled: author.can_whatsapp_contact === true || author.whatsapp_contact_enabled === true,
  };
}
export default function CommunityPeopleDirectory({ onBack, onInvite }) {
  const { get } = useJumuiyaApi();
  const [posts, setPosts] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const response = await get("/community/feed?limit=50");
      setPosts(arrayFrom(response));
    } catch (e) {
      setError(e?.message || "The community member activity could not be loaded.");
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [get]);

  useEffect(() => { load(); }, [load]);

  const members = useMemo(() => {
    const byId = new Map();
    for (const post of posts) {
      const person = authorFor(post);
      if (!person) continue;
      const current = byId.get(person.id);
      if (current) {
        current.postCount += 1;
        if (new Date(post?.created_at || post?.createdAt || 0) > new Date(current.latestPost?.created_at || current.latestPost?.createdAt || 0)) current.latestPost = post;
        current.contactEnabled = current.contactEnabled || person.contactEnabled;
      } else byId.set(person.id, person);
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [posts]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((member) => [member.name, member.bio, member.county, member.town].some((v) => String(v || "").toLowerCase().includes(needle)));
  }, [members, query]);

  return <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
    <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#081b2e] via-[#0f3440] to-[#075e54] p-6 text-white shadow-xl sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
      <button type="button" onClick={onBack} className="relative inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white/85 hover:bg-white/15"><ArrowLeft size={14}/> Community home</button>
      <div className="relative mt-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div><p className="text-[11px] font-black uppercase tracking-[.2em] text-emerald-200">Jumuiya · People</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">The people behind the pulse.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Discover members who are contributing to Community. Profiles shown here are based on real public community activity.</p></div>
        <button type="button" onClick={onInvite} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-900 hover:bg-emerald-50"><Users size={15}/> Invite a member</button>
      </div>
      <div className="relative mt-6 grid grid-cols-2 gap-3 sm:max-w-sm"><div className="rounded-2xl border border-white/10 bg-white/10 p-4"><p className="text-2xl font-black">{members.length}</p><p className="mt-1 text-[11px] font-semibold text-white/65">Active contributors found</p></div><div className="rounded-2xl border border-white/10 bg-white/10 p-4"><p className="text-2xl font-black">Open</p><p className="mt-1 text-[11px] font-semibold text-white/65">Profiles from public activity</p></div></div>
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row"><div className="relative min-w-0 flex-1"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} type="search" placeholder="Search names, bios, towns or counties…" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-slate-800 dark:text-white"/></div><button type="button" onClick={()=>load(true)} disabled={refreshing} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300"><RefreshCw size={14} className={refreshing?"animate-spin":""}/> Refresh directory</button></div>
    </section>
    {error ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div> : null}
    {loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1,2,3].map(n=><div key={n} className="h-48 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"/>)}</div> : filtered.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(member=><article key={member.id} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-start gap-3"><div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 text-lg font-black text-emerald-800 dark:from-emerald-950 dark:to-cyan-950 dark:text-emerald-200">{member.avatar ? <img src={member.avatar} alt="" className="h-full w-full object-cover"/> : member.name.split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase()}</div><div className="min-w-0 flex-1"><h2 className="truncate text-base font-black text-slate-900 dark:text-white">{member.name}</h2><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{member.bio || "Community contributor sharing ideas, updates and opportunities."}</p></div></div>
      {(member.town || member.county) ? <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400"><MapPin size={13}/>{[member.town,member.county].filter(Boolean).join(", ")}</p> : null}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/5"><span className="text-[11px] font-semibold text-slate-500">{member.postCount} public contribution{member.postCount===1?"":"s"}</span><button type="button" onClick={()=>setSelected(member)} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300">View profile</button></div>
    </article>)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-white/15 dark:bg-slate-900"><Users size={26} className="mx-auto text-slate-400"/><h2 className="mt-3 text-base font-black text-slate-900 dark:text-white">{query ? "No matching members" : "No public contributors yet"}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">The directory only lists people returned by the Community feed. It will grow as members publish public contributions.</p><button type="button" onClick={onInvite} className="mt-4 rounded-xl bg-emerald-700 px-4 py-3 text-xs font-black text-white">Invite the first member</button></div>}
    {selected ? <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><section role="dialog" aria-modal="true" aria-labelledby="community-member-title" className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:rounded-3xl"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-lg font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{selected.name.split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase()}</div><div><h2 id="community-member-title" className="text-lg font-black text-slate-900 dark:text-white">{selected.name}</h2><p className="mt-1 text-xs text-slate-500">Community member profile</p></div></div><button type="button" onClick={()=>setSelected(null)} aria-label="Close profile" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={17}/></button></div><p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">{selected.bio || "This member has not added a public bio."}</p>{selected.town||selected.county ? <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><MapPin size={14}/>{[selected.town,selected.county].filter(Boolean).join(", ")}</p>:null}<div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500 dark:bg-slate-800"><ShieldCheck size={14} className="mr-1 inline text-emerald-600"/>Only public profile details are shown. Private contact information is not exposed by the directory.</div><button type="button" onClick={()=>setSelected(null)} className="mt-5 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white">Done</button></section></div>:null}
  </div>;
}
