import React, { useMemo } from "react";
import {
  ArrowUpRight,
  Camera,
  Clapperboard,
  Heart,
  MessageCircle,
  Play,
  Plus,
  Sparkles,
} from "lucide-react";

function flattenMediaCandidate(candidate, target) {
  if (!candidate) return;
  if (Array.isArray(candidate)) {
    candidate.forEach((item) => flattenMediaCandidate(item, target));
    return;
  }
  if (typeof candidate === "string") {
    const value = candidate.trim();
    if (!value) return;
    if (value.startsWith("[") || value.startsWith("{")) {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object") {
          flattenMediaCandidate(parsed, target);
          return;
        }
      } catch {
        // Plain URL strings are handled below.
      }
    }
    target.push(value);
    return;
  }
  if (typeof candidate === "object") {
    const nested = candidate.attachments || candidate.items || candidate.files;
    if (Array.isArray(nested)) {
      nested.forEach((item) => flattenMediaCandidate(item, target));
      return;
    }
    target.push(candidate);
  }
}

/** Extract only real, browser-displayable image/video URLs from a backend post. */
export function getCommunityMediaItems(post = {}) {
  const raw = [];
  [
    post?.attachments,
    post?.media_attachments,
    post?.mediaAttachments,
    post?.media_files,
    post?.mediaFiles,
    post?.media,
    post?.images,
    post?.videos,
  ].forEach((candidate) => flattenMediaCandidate(candidate, raw));

  [
    post?.image_url,
    post?.imageUrl,
    post?.image,
    post?.media_url,
    post?.mediaUrl,
    post?.video_url,
    post?.videoUrl,
    post?.attachment,
  ].forEach((candidate) => flattenMediaCandidate(candidate, raw));

  const seen = new Set();
  return raw.reduce((items, rawItem) => {
    let item = rawItem;
    if (item && typeof item === "object") {
      item = item.attachment || item.file || item.media || item;
    }

    const urlValue = typeof item === "string"
      ? item
      : item && typeof item === "object"
        ? item.url ||
          item.secure_url ||
          item.secureUrl ||
          item.media_url ||
          item.mediaUrl ||
          item.image_url ||
          item.imageUrl ||
          item.video_url ||
          item.videoUrl ||
          item.src ||
          item.path ||
          item.original_url ||
          item.originalUrl ||
          ""
        : "";

    let url = String(urlValue || "").trim();
    if (url.startsWith("//")) url = `https:${url}`;
    if (!/^https?:\/\//i.test(url) || seen.has(url)) return items;

    const details = item && typeof item === "object" ? item : {};
    const hint = String(
      details.kind ||
        details.resource_type ||
        details.resourceType ||
        details.mime_type ||
        details.mimeType ||
        details.type ||
        "",
    ).toLowerCase();
    const pathname = url.split(/[?#]/, 1)[0].toLowerCase();
    const isVideo = hint.includes("video") || /\.(mp4|mov|m4v|webm|ogv|ogg)$/.test(pathname);

    seen.add(url);
    items.push({
      id: details.id || details.media_id || details._id || `community-media-${items.length}`,
      url,
      kind: isVideo ? "video" : "image",
      fileName: details.file_name || details.filename || details.name || "",
    });
    return items;
  }, []).slice(0, 4);
}

function getAuthor(post) {
  return String(
    post?.author?.name ||
      post?.author?.full_name ||
      post?.author_name ||
      post?.user?.name ||
      post?.username ||
      "Community member",
  ).trim();
}

function getDate(post) {
  const value = post?.created_at || post?.createdAt || post?.timestamp || post?.time;
  if (!value) return "Recently shared";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently shared";
  const now = Date.now();
  const elapsed = Math.max(0, now - date.getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(elapsed / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(elapsed / 86400000);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

function getInitials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "C";
}

function getPostTitle(post) {
  return String(post?.title || post?.subject || post?.headline || "").trim() || "A moment from the community";
}

function getPostBody(post) {
  return String(post?.body || post?.content || post?.text || post?.description || "").trim();
}

function getHub(post) {
  const hub = String(post?.hub || post?.source_hub || "community").trim();
  return hub.charAt(0).toUpperCase() + hub.slice(1);
}

function getPostId(post, index) {
  return post?.id || post?._id || post?.post_id || post?.postId || `media-post-${index}`;
}

export default function CommunityMediaCards({
  posts = [],
  onOpenPost,
  onCreatePost,
}) {
  const mediaPosts = useMemo(
    () => posts
      .map((post, index) => ({
        post,
        index,
        media: getCommunityMediaItems(post),
      }))
      .filter((item) => item.media.length > 0)
      .slice(0, 12),
    [posts],
  );

  return (
    <section aria-labelledby="community-media-title" className="mt-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-md shadow-cyan-900/10">
              <Sparkles size={15} />
            </span>
            <div>
              <h2 id="community-media-title" className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
                Community in frames
              </h2>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                Photos and clips shared by real members
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => typeof onCreatePost === "function" && onCreatePost()}
          className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2 text-[10px] font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
        >
          <Plus size={14} /> Share a moment
        </button>
      </div>

      {mediaPosts.length ? (
        <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:thin]">
          {mediaPosts.map(({ post, media, index }) => {
            const leadMedia = media[0];
            const author = getAuthor(post);
            const body = getPostBody(post);
            const title = getPostTitle(post);
            const isVideo = leadMedia.kind === "video";
            const hub = getHub(post);

            return (
              <article
                key={getPostId(post, index)}
                className="group w-[min(76vw,255px)] flex-none snap-start overflow-hidden rounded-[25px] border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-900"
              >
                <button
                  type="button"
                  onClick={() => typeof onOpenPost === "function" && onOpenPost(post)}
                  aria-label={`Open media post: ${title}`}
                  className="relative block aspect-[4/4.7] w-full overflow-hidden bg-slate-200 text-left dark:bg-slate-800"
                >
                  {isVideo ? (
                    <video
                      src={leadMedia.url}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      aria-label={leadMedia.fileName || title}
                    />
                  ) : (
                    <img
                      src={leadMedia.url}
                      alt={leadMedia.fileName || title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      onError={(event) => {
                        event.currentTarget.style.opacity = "0";
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/15 to-slate-950/5" />
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-slate-950/55 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-white backdrop-blur-md">
                      {isVideo ? <Clapperboard size={11} /> : <Camera size={11} />}
                      {isVideo ? "Video" : "Photo"}{media.length > 1 ? ` +${media.length - 1}` : ""}
                    </span>
                    <span className="max-w-[110px] truncate rounded-full border border-white/20 bg-slate-950/50 px-2.5 py-1.5 text-[9px] font-bold text-white backdrop-blur-md">
                      {hub}
                    </span>
                  </div>
                  {isVideo ? (
                    <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-slate-950/45 text-white shadow-xl backdrop-blur-md">
                      <Play size={18} fill="currentColor" className="ml-0.5" />
                    </span>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <span className="mb-2 inline-flex rounded-full bg-white/15 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-white/90 backdrop-blur-md">
                      {String(post?.category || post?.type || "Community").replace(/[_-]/g, " ")}
                    </span>
                    <h3 className="line-clamp-2 break-words text-sm font-black leading-5 text-white">
                      {title}
                    </h3>
                    {body ? (
                      <p className="mt-1.5 line-clamp-2 break-words text-[10px] leading-4 text-white/75">
                        {body}
                      </p>
                    ) : null}
                  </div>
                  <span className="absolute bottom-3 right-3 flex h-8 w-8 translate-y-2 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white opacity-0 backdrop-blur-md transition group-hover:translate-y-0 group-hover:opacity-100">
                    <ArrowUpRight size={15} />
                  </span>
                </button>
                <div className="flex items-center gap-2.5 p-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 text-[10px] font-black text-white">
                    {getInitials(author)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-black text-slate-900 dark:text-white">{author}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{getDate(post)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-slate-400">
                    <span className="inline-flex items-center gap-1 text-[10px]" aria-label="Reactions">
                      <Heart size={12} /> {Number(post?.reactions_count ?? post?.likes_count ?? post?.likes ?? 0) || 0}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px]" aria-label="Comments">
                      <MessageCircle size={12} /> {Number(post?.comments_count ?? post?.comment_count ?? 0) || 0}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4 rounded-[25px] border border-dashed border-slate-300 bg-gradient-to-r from-cyan-50/70 via-white to-violet-50/60 p-5 dark:border-white/10 dark:from-cyan-950/20 dark:via-slate-900 dark:to-violet-950/20 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-sm dark:bg-slate-800 dark:text-cyan-300">
              <Camera size={22} />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white">Your community’s next great moment starts here.</h3>
              <p className="mt-1 max-w-md text-xs leading-5 text-slate-600 dark:text-slate-400">
                There are no media posts in this live result yet. Add up to four photos or clips to one post and make it worth stopping for.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => typeof onCreatePost === "function" && onCreatePost()}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black text-slate-700 transition hover:border-cyan-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          >
            <Plus size={14} /> Create media post
          </button>
        </div>
      )}
    </section>
  );
}
