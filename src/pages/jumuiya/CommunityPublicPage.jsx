import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Compass,
  ExternalLink,
  Globe,
  Heart,
  Home,
  Loader2,
  MapPin,
  MessageCircle,
  Play,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import { getCommunityMediaItems } from "@/Dashboard/Community/CommunityMediaCards.jsx";

const COMMUNITY_ORIGIN = "https://community.revelacode.co.ke";
const PLATFORM_ORIGIN = "https://revelacode.co.ke";

function unbox(value) {
  let result = value;
  for (let index = 0; index < 3; index += 1) {
    if (result && typeof result === "object" && result.data && typeof result.data === "object") {
      result = result.data;
      continue;
    }
    if (result && typeof result === "object" && result.result && typeof result.result === "object") {
      result = result.result;
      continue;
    }
    break;
  }
  return result;
}

function postId(post) {
  const value = post?.id ?? post?._id ?? post?.post_id ?? post?.postId;
  return value == null ? "" : String(value);
}

function authorId(post) {
  const value = post?.author?.id ?? post?.author?.user_id ?? post?.author_user_id ?? post?.author_id;
  return value == null ? "" : String(value);
}

function mediaId(media) {
  const value = media?.id ?? media?.media_id ?? media?._id;
  return value == null ? "" : String(value);
}

function profileUrl(id) {
  return id ? `${COMMUNITY_ORIGIN}/profile/${encodeURIComponent(id)}` : COMMUNITY_ORIGIN;
}

function postUrl(post) {
  const id = postId(post);
  return id ? `${COMMUNITY_ORIGIN}/post/${encodeURIComponent(id)}` : COMMUNITY_ORIGIN;
}

function mediaUrl(media) {
  const id = mediaId(media);
  return id ? `${COMMUNITY_ORIGIN}/media/${encodeURIComponent(id)}` : COMMUNITY_ORIGIN;
}

function authorName(post) {
  return String(
    post?.author?.name ||
      post?.author?.full_name ||
      post?.author_name ||
      post?.username ||
      "Community member",
  );
}

function timeAgo(value) {
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
  return date.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
}

function Avatar({ person, size = "h-11 w-11" }) {
  const name = String(person?.name || "Community member");
  const image = person?.avatar_url || person?.avatar || person?.avatarUrl || "";
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "C";
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-xs font-black text-white`}>
      {image ? <img src={image} alt={name} loading="lazy" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : initials}
    </span>
  );
}

function MediaGrid({ post }) {
  const media = getCommunityMediaItems(post);
  if (!media.length) return null;
  return (
    <div className={`mt-4 grid gap-2 ${media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {media.map((item) => (
        <div key={item.id || item.url} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-950">
          {item.kind === "video" ? (
            <video src={item.url} controls playsInline preload="metadata" className="max-h-[480px] w-full bg-black" aria-label={item.fileName || "Community video"} />
          ) : (
            <a href={mediaUrl(item)} className="block" aria-label="Open public media page">
              <img src={item.url} alt={item.fileName || "Community post media"} loading="lazy" decoding="async" className="max-h-[480px] w-full object-cover" />
            </a>
          )}
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <span className="truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400">{item.kind === "video" ? "Video" : "Photo"}</span>
            <a href={mediaUrl(item)} className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-cyan-700 hover:underline dark:text-cyan-300">Media page <ExternalLink size={11} /></a>
          </div>
        </div>
      ))}
    </div>
  );
}

function PublicPostCard({ post }) {
  const profile = authorId(post);
  const title = String(post?.title || post?.subject || "Community post");
  const body = String(post?.body || post?.content || post?.text || post?.description || "");
  const hub = String(post?.hub || "community");
  const kind = String(post?.category || post?.type || "community").replace(/[_-]/g, " ");
  return (
    <article className="overflow-hidden rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
      <div className="flex min-w-0 items-start gap-3">
        <a href={profileUrl(profile)} className="rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500" aria-label={`Open ${authorName(post)}'s public profile`}>
          <Avatar person={post?.author} />
        </a>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <a href={profileUrl(profile)} className="truncate text-xs font-black text-slate-950 hover:text-cyan-700 dark:text-white dark:hover:text-cyan-300">{authorName(post)}</a>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"><ShieldCheck size={10} /> Public post</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{timeAgo(post?.created_at || post?.createdAt)} · {hub}</p>
        </div>
      </div>
      <a href={postUrl(post)} className="mt-4 block group">
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{kind}</span>
        <h2 className="mt-2 break-words text-lg font-black leading-6 text-slate-950 group-hover:text-cyan-700 dark:text-white dark:group-hover:text-cyan-300">{title}</h2>
      </a>
      {body ? <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600 dark:text-slate-300">{body}</p> : null}
      <MediaGrid post={post} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-white/10">
        <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1"><Heart size={13} /> {Number(post?.likes_count ?? post?.reactions_count ?? 0) || 0}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle size={13} /> {Number(post?.comments_count ?? 0) || 0}</span>
          {post?.location ? <span className="inline-flex items-center gap-1"><MapPin size={12} /> {post.location}</span> : null}
        </div>
        <a href={postUrl(post)} className="inline-flex items-center gap-1.5 text-[11px] font-black text-cyan-700 hover:underline dark:text-cyan-300">Open post <ArrowRight size={13} /></a>
      </div>
    </article>
  );
}

function PublicContentShell({ children, eyebrow = "Public Community" }) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-slate-950/85">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a href={COMMUNITY_ORIGIN} className="flex min-w-0 items-center gap-2.5" aria-label="Community home">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-white shadow-md"><Users size={19} /></span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black tracking-tight">RevelaCode Community</span>
              <span className="mt-0.5 block truncate text-[10px] text-slate-500 dark:text-slate-400">{eyebrow}</span>
            </span>
          </a>
          <div className="flex shrink-0 items-center gap-2">
            <a href={PLATFORM_ORIGIN} className="hidden rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 sm:inline-flex">All hubs</a>
            <a href={`${COMMUNITY_ORIGIN}/app`} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2 text-[10px] font-black text-white transition hover:bg-slate-800 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300">Join Community <ArrowRight size={13} /></a>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pt-9">
        {children}
      </div>
      <footer className="border-t border-slate-200 px-4 py-6 text-center text-[10px] text-slate-500 dark:border-white/10 dark:text-slate-400">
        <a href={PLATFORM_ORIGIN} className="font-bold hover:underline">RevelaCode</a> · Code. Innovate. Transform. · <a href={COMMUNITY_ORIGIN} className="font-bold hover:underline">Community home</a>
      </footer>
    </main>
  );
}

export default function CommunityPublicPage({ mode = "feed" }) {
  const params = useParams();
  const {
    getPublicCommunityFeed,
    getPublicCommunityPost,
    getPublicCommunityProfile,
    getPublicCommunityMedia,
  } = useJumuiyaApi();

  const resourceId = mode === "profile"
    ? params.profileId
    : mode === "post"
      ? params.postId
      : mode === "media"
        ? params.mediaId
        : "";
  const [searchText, setSearchText] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [content, setContent] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setContent(null);

    let request;
    try {
      if (mode === "post") request = getPublicCommunityPost(resourceId);
      else if (mode === "profile") request = getPublicCommunityProfile(resourceId, { limit: 50 });
      else if (mode === "media") request = getPublicCommunityMedia(resourceId);
      else request = getPublicCommunityFeed({ search: submittedSearch, limit: 50 });
    } catch (requestError) {
      request = Promise.reject(requestError);
    }

    Promise.resolve(request)
      .then((result) => {
        if (active) setContent(unbox(result));
      })
      .catch((requestError) => {
        if (active) setError(requestError?.message || "This public Community page could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [
    mode,
    resourceId,
    submittedSearch,
    reloadKey,
    getPublicCommunityFeed,
    getPublicCommunityPost,
    getPublicCommunityProfile,
    getPublicCommunityMedia,
  ]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const contentPost = content?.post || (mode === "post" ? content?.post : null);
    const title = mode === "profile"
      ? `${content?.profile?.name || "Community profile"} · RevelaCode Community`
      : mode === "post"
        ? `${contentPost?.title || "Community post"} · RevelaCode Community`
        : mode === "media"
          ? "Community media · RevelaCode"
          : "RevelaCode Community · Public posts";
    document.title = title;
  }, [content, mode]);

  const retry = () => setReloadKey((value) => value + 1);

  let pageTitle = "Discover the community";
  let pageDescription = "Public posts, ideas and media shared by Community members.";
  if (mode === "profile") {
    pageTitle = content?.profile?.name || "Community profile";
    pageDescription = content?.profile?.bio || "Public posts shared by this Community member.";
  } else if (mode === "post") {
    pageTitle = content?.post?.title || "Community post";
    pageDescription = "A publicly shared Community post.";
  } else if (mode === "media") {
    pageTitle = content?.media?.file_name || "Community media";
    pageDescription = "Public media shared in the RevelaCode Community.";
  }

  return (
    <PublicContentShell eyebrow={mode === "feed" ? "Open to everyone" : "Public share link"}>
      {mode === "feed" ? (
        <>
          <section className="relative overflow-hidden rounded-[30px] bg-slate-950 px-5 py-7 text-white shadow-xl sm:px-8 sm:py-9">
            <div className="absolute -right-8 -top-16 h-56 w-56 rounded-full bg-cyan-500/25 blur-3xl" />
            <div className="absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="relative max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-cyan-100"><Globe size={13} /> Open community</span>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Good things grow when they’re shared.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">Explore public ideas, photos, videos, opportunities and stories. You can view public content without an account; sign in to participate.</p>
              <form onSubmit={(event) => { event.preventDefault(); setSubmittedSearch(searchText.trim()); }} className="mt-6 flex max-w-xl items-center gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur">
                <Search size={17} className="ml-1 shrink-0 text-white/65" />
                <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search public Community posts…" className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-white outline-none placeholder:text-white/45" aria-label="Search public Community posts" />
                <button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-300 px-3.5 py-2 text-[11px] font-black text-slate-950 hover:bg-cyan-200"><Search size={13} /> Search</button>
              </form>
            </div>
          </section>
          <section className="mt-7">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-xl font-black tracking-tight">{submittedSearch ? `Results for “${submittedSearch}”` : "From the community"}</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Only published posts marked public appear here.</p>
              </div>
              <button type="button" onClick={retry} className="rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-white dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">Refresh</button>
            </div>
            {loading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={retry} /> : Array.isArray(content?.posts) && content.posts.length ? (
              <div className="grid gap-4 lg:grid-cols-2">{content.posts.map((post) => <PublicPostCard key={postId(post)} post={post} />)}</div>
            ) : (
              <EmptyState title={submittedSearch ? "No public posts match yet" : "The first public story can start here"} description={submittedSearch ? "Try another phrase. Private and community-only posts are intentionally excluded from public search." : "No public Community posts were returned by the live service. No sample posts are displayed."} />
            )}
          </section>
        </>
      ) : (
        <>
          <div className="mb-5">
            <a href={COMMUNITY_ORIGIN} className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300"><ArrowLeft size={14} /> Community home</a>
          </div>
          {loading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={retry} /> : mode === "profile" ? (
            <section>
              <header className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:flex-row sm:items-center sm:p-7">
                <Avatar person={content?.profile} size="h-20 w-20 sm:h-24 sm:w-24" />
                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"><ShieldCheck size={11} /> Public profile</span>
                  <h1 className="mt-3 break-words text-2xl font-black tracking-tight sm:text-3xl">{pageTitle}</h1>
                  {content?.profile?.bio ? <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600 dark:text-slate-300">{content.profile.bio}</p> : null}
                  {content?.profile?.county || content?.profile?.town ? <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><MapPin size={13} /> {[content.profile.town, content.profile.county].filter(Boolean).join(", ")}</p> : null}
                </div>
              </header>
              <div className="mb-4 mt-7">
                <h2 className="text-lg font-black">Public posts</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Only this member’s public published posts are listed.</p>
              </div>
              {content?.posts?.length ? <div className="grid gap-4 lg:grid-cols-2">{content.posts.map((post) => <PublicPostCard key={postId(post)} post={post} />)}</div> : <EmptyState title="No public posts" description="This profile has no public posts available to display." />}
            </section>
          ) : mode === "post" ? (
            content?.post ? <div className="mx-auto max-w-3xl"><PublicPostCard post={content.post} /></div> : <EmptyState title="Post not found" description="This post may have been removed, unpublished or shared with a non-public audience." />
          ) : (
            content?.media && content?.post ? (
              <section className="mx-auto max-w-4xl">
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
                  <div className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-white/10 sm:p-5">
                    <Avatar person={content.post.author} />
                    <div className="min-w-0 flex-1">
                      <a href={profileUrl(authorId(content.post))} className="block truncate text-xs font-black hover:text-cyan-700 dark:hover:text-cyan-300">{authorName(content.post)}</a>
                      <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{timeAgo(content.post.created_at)} · Public media</p>
                    </div>
                    <a href={postUrl(content.post)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-bold dark:border-white/10">Source post <ArrowRight size={12} /></a>
                  </div>
                  <div className="bg-slate-950">
                    {content.media.kind === "video"
                      ? <video src={content.media.url} controls playsInline preload="metadata" className="max-h-[75vh] w-full" aria-label={content.media.file_name || pageTitle} />
                      : <img src={content.media.url} alt={content.media.file_name || pageTitle} className="mx-auto max-h-[75vh] w-full object-contain" />}
                  </div>
                  <div className="p-4 sm:p-6">
                    <h1 className="break-words text-xl font-black">{pageTitle}</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{content.post.title || content.post.body || "Public Community media"}</p>
                  </div>
                </div>
              </section>
            ) : <EmptyState title="Media not found" description="This file is not attached to a published public post, or its source post is no longer available." />
          )}
        </>
      )}
    </PublicContentShell>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3" aria-label="Loading public Community content">
      {[1, 2, 3].map((item) => <div key={item} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900"><div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" /><div className="mt-4 h-3 w-full rounded bg-slate-100 dark:bg-slate-800" /><div className="mt-2 h-3 w-5/6 rounded bg-slate-100 dark:bg-slate-800" /></div>)}
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <section role="alert" className="rounded-[24px] border border-rose-200 bg-rose-50 p-5 dark:border-rose-500/20 dark:bg-rose-950/20">
      <h2 className="text-sm font-black text-rose-900 dark:text-rose-200">Couldn’t load this public page</h2>
      <p className="mt-2 break-words text-xs leading-5 text-rose-800 dark:text-rose-300">{error}</p>
      <button type="button" onClick={onRetry} className="mt-4 rounded-xl bg-rose-900 px-4 py-2.5 text-xs font-bold text-white dark:bg-rose-200 dark:text-rose-950">Try again</button>
    </section>
  );
}

function EmptyState({ title, description }) {
  return (
    <section className="rounded-[25px] border border-dashed border-slate-300 bg-white px-5 py-12 text-center dark:border-white/10 dark:bg-slate-900">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-cyan-700 dark:bg-slate-800 dark:text-cyan-300"><Camera size={24} /></span>
      <h2 className="mt-4 text-base font-black">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      <a href={`${COMMUNITY_ORIGIN}/app`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white dark:bg-cyan-400 dark:text-slate-950">Join Community <ArrowRight size={14} /></a>
    </section>
  );
}
