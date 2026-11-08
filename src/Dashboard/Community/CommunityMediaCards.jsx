import React, { useMemo } from "react";
import {
  Play,
  Plus,
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

function getPostTitle(post) {
  return String(post?.title || post?.subject || post?.headline || "").trim() || "A moment from the community";
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
    <section aria-labelledby="community-media-title" className="mt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="community-media-title" className="text-sm font-black tracking-tight text-slate-950 dark:text-white">
            Community moments
          </h2>
          <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
            Photos and clips members have shared
          </p>
        </div>
        <button
          type="button"
          onClick={() => typeof onCreatePost === "function" && onCreatePost()}
          className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-extrabold text-cyan-800 transition hover:bg-cyan-500/15 dark:text-cyan-200"
        >
          <Plus size={12} /> Share a moment
        </button>
      </div>

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => typeof onCreatePost === "function" && onCreatePost()}
          className="flex w-[68px] shrink-0 snap-start flex-col items-center gap-1.5 text-center"
          aria-label="Create a Community moment"
        >
          <span className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full border-2 border-dashed border-cyan-500/60 bg-cyan-500/10 text-cyan-700 transition hover:bg-cyan-500/15 dark:text-cyan-200">
            <Plus size={24} />
          </span>
          <span className="w-full truncate text-[10px] font-bold text-slate-700 dark:text-slate-200">Your moment</span>
        </button>

        {mediaPosts.map(({ post, media, index }) => {
          const leadMedia = media[0];
          const author = getAuthor(post);
          const title = getPostTitle(post);
          const isVideo = leadMedia.kind === "video";
          return (
            <button
              key={getPostId(post, index)}
              type="button"
              onClick={() => typeof onOpenPost === "function" && onOpenPost(post)}
              title={title}
              aria-label={`Open media shared by ${author}: ${title}`}
              className="flex w-[68px] shrink-0 snap-start flex-col items-center gap-1.5 text-center"
            >
              <span className="relative block h-[68px] w-[68px] overflow-hidden rounded-full bg-slate-200 p-[3px] ring-2 ring-cyan-500/70 ring-offset-2 ring-offset-white dark:bg-slate-800 dark:ring-offset-[#0b1421]">
                <span className="block h-full w-full overflow-hidden rounded-full">
                  {isVideo ? (
                    <video src={leadMedia.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  ) : (
                    <img src={leadMedia.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  )}
                </span>
                {isVideo ? <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full border border-white/50 bg-slate-950/80 text-white"><Play size={9} fill="currentColor" /></span> : null}
              </span>
              <span className="w-full truncate text-[10px] font-bold text-slate-700 dark:text-slate-200">{author}</span>
            </button>
          );
        })}
      </div>
      {!mediaPosts.length ? (
        <p className="mt-1 text-[10px] text-slate-400">New member photos and videos will appear here.</p>
      ) : null}
    </section>
  );
}
