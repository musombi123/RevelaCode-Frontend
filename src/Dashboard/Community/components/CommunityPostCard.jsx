import React, { useMemo, useState } from "react";
import WhatsAppButton from "@/Dashboard/Community/WhatsAppButton.jsx";

import {
  Bookmark,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Heart,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share2,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";

// ============================================================
// HELPERS
// ============================================================

const SAVED_POSTS_STORAGE_KEY = "revelacode.community.savedPostIds.v1";

function readSavedPostIds() {
  if (typeof window === "undefined") return [];

  try {
    const value = JSON.parse(
      window.localStorage.getItem(SAVED_POSTS_STORAGE_KEY) || "[]",
    );
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

function persistSavedPostId(postId, shouldSave) {
  const id = postId === undefined || postId === null ? "" : String(postId);
  if (!id || typeof window === "undefined") return;

  const savedIds = new Set(readSavedPostIds());
  if (shouldSave) savedIds.add(id);
  else savedIds.delete(id);

  window.localStorage.setItem(
    SAVED_POSTS_STORAGE_KEY,
    JSON.stringify([...savedIds]),
  );
}

function safeDisplayText(value, fallback = "") {
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function getAuthorName(post) {
  return safeDisplayText(
    post?.author?.name ||
      post?.author?.full_name ||
      post?.author?.fullName ||
      post?.user?.name ||
      post?.user?.full_name ||
      post?.username ||
      post?.author_name,
    "Community Member",
  );
}

function getAuthorInitials(name) {
  const safeName = safeDisplayText(name, "Community Member");
  const parts = safeName.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getAuthorAvatar(post) {
  const candidate =
    post?.author?.avatar ||
    post?.author?.avatar_url ||
    post?.author?.profile_image ||
    post?.author?.profileImage ||
    post?.user?.avatar ||
    post?.user?.avatar_url ||
    post?.avatar ||
    null;
  return typeof candidate === "string" && candidate.trim()
    ? candidate.trim()
    : null;
}

function getPostTitle(post) {
  return safeDisplayText(post?.title || post?.headline, "Community Update");
}

function getPostBody(post) {
  return safeDisplayText(post?.body || post?.content || post?.description);
}

function getPostCategory(post) {
  return safeDisplayText(post?.category || post?.type, "general");
}

function getPostHub(post) {
  return safeDisplayText(post?.hub || post?.hub_name, "community");
}

function getPostLocation(post) {
  return safeDisplayText(post?.location || post?.location_name);
}

function getPostTime(post) {
  return (
    post?.created_at ||
    post?.createdAt ||
    post?.timestamp ||
    post?.time ||
    ""
  );
}

function formatRelativeTime(value) {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const now = Date.now();
  const diff = Math.max(
    0,
    now - date.getTime()
  );

  const seconds = Math.floor(
    diff / 1000
  );

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(
    seconds / 60
  );

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(
    hours / 24
  );

  if (days < 7) {
    return `${days}d`;
  }

  const weeks = Math.floor(
    days / 7
  );

  if (weeks < 5) {
    return `${weeks}w`;
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year:
        date.getFullYear() !==
        new Date().getFullYear()
          ? "numeric"
          : undefined,
    }
  );
}

function formatNumber(value) {
  const number =
    Number(value) || 0;

  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(
      1
    )}M`;
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed(
      1
    )}K`;
  }

  return String(number);
}

function normalizeHubName(hub) {
  if (!hub) return "Community";

  const value = String(hub);

  return value
    .charAt(0)
    .toUpperCase() +
    value.slice(1);
}

// ============================================================
// COMMUNITY MEDIA NORMALIZATION
// ============================================================

function normalizeCommunityAttachments(post = {}) {
  const candidates = [
    post?.attachments,
    post?.media_attachments,
    post?.mediaAttachments,
    post?.media_files,
    post?.mediaFiles,
    post?.media,
    post?.images,
    post?.videos,
  ];

  const rawItems = [];

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (Array.isArray(candidate)) {
      rawItems.push(...candidate);
      continue;
    }

    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (!trimmed) continue;

      // Support APIs that store an attachment list as JSON text.
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) rawItems.push(...parsed);
          else if (parsed && typeof parsed === "object") {
            const nested = parsed.attachments || parsed.items || parsed.files || parsed.media;
            if (Array.isArray(nested)) rawItems.push(...nested);
            else rawItems.push(parsed);
          }
          continue;
        } catch {
          // Treat it as a plain URL below.
        }
      }

      rawItems.push(trimmed);
      continue;
    }

    if (typeof candidate === "object") {
      const nested = candidate.attachments || candidate.items || candidate.files;
      if (Array.isArray(nested)) rawItems.push(...nested);
      else rawItems.push(candidate);
    }
  }

  // Older post records may store one attachment in a top-level field.
  rawItems.push(
    post?.image_url,
    post?.imageUrl,
    post?.image,
    post?.media_url,
    post?.mediaUrl,
    post?.video_url,
    post?.videoUrl,
    post?.attachment,
  );

  const normalized = [];
  const seen = new Set();

  for (const rawItem of rawItems) {
    if (!rawItem) continue;

    let item = rawItem;
    if (typeof item === "object" && !Array.isArray(item)) {
      item = item.attachment || item.file || item.media || item;
    }

    let url = "";
    if (typeof item === "string") {
      url = item.trim();
    } else if (item && typeof item === "object") {
      url = String(
        item.url ||
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
          "",
      ).trim();
    }

    if (url.startsWith("//")) url = `https:${url}`;
    if (!/^https?:\/\//i.test(url) || seen.has(url)) continue;

    const details = item && typeof item === "object" ? item : {};
    const typeHint = String(
      details.kind ||
        details.resource_type ||
        details.resourceType ||
        details.mime_type ||
        details.mimeType ||
        details.type ||
        "",
    ).toLowerCase();
    const cleanUrl = url.split(/[?#]/, 1)[0].toLowerCase();
    const videoByExtension = /\.(mp4|mov|m4v|webm|ogv|ogg)$/.test(cleanUrl);
    const video = typeHint.includes("video") || videoByExtension;

    normalized.push({
      id: details.id || details.media_id || details._id || `community-media-${normalized.length}`,
      url,
      kind: video ? "video" : "image",
      file_name: details.file_name || details.filename || details.name || (video ? "Community video" : "Community image"),
      mime_type: details.mime_type || details.mimeType || "",
      resource_type: details.resource_type || details.resourceType || (video ? "video" : "image"),
    });
    seen.add(url);
  }

  return normalized.slice(0, 4);
}

// ============================================================
// COMPONENT
// ============================================================

export default function CommunityPostCard({
  post = {},
  currentUser = null,
  onOpen,
  onLike,
  onComment,
  onShare,
  onSave,
  onFollow,
  onReport,
  compact = false,
}) {
  // ==========================================================
  // LOCAL STATE
  // ==========================================================

  const [liked, setLiked] =
    useState(
      Boolean(
        post?.liked ||
          post?.is_liked ||
          post?.user_liked
      )
    );

  const [saved, setSaved] =
    useState(() => {
      const initialPostId =
        post?.id ??
        post?._id ??
        post?.post_id ??
        null;

      return Boolean(
        post?.saved ||
        post?.is_saved ||
        post?.bookmarked ||
        (initialPostId !== null &&
          readSavedPostIds().includes(String(initialPostId)))
      );
    });

  const [following, setFollowing] =
    useState(
      Boolean(
        post?.following ||
          post?.is_following
      )
    );

  const [showMenu, setShowMenu] =
    useState(false);

  const [expanded, setExpanded] =
    useState(false);

  const [shareFeedback, setShareFeedback] =
    useState("");

  const [localLikes, setLocalLikes] =
    useState(
      Number(
        post?.likes_count ??
          post?.like_count ??
          post?.likes ??
          0
      )
    );

  const [localComments, setLocalComments] =
    useState(
      Number(
        post?.comments_count ??
          post?.comment_count ??
          post?.comments ??
          0
      )
    );

  // ==========================================================
  // DERIVED DATA
  // ==========================================================

  const authorName = useMemo(
    () => getAuthorName(post),
    [post]
  );

  const authorInitials =
    useMemo(
      () =>
        getAuthorInitials(
          authorName
        ),
      [authorName]
    );

  const avatar = useMemo(
    () => getAuthorAvatar(post),
    [post]
  );

  const title = useMemo(
    () => getPostTitle(post),
    [post]
  );

  const body = useMemo(
    () => getPostBody(post),
    [post]
  );

  const category = useMemo(
    () =>
      getPostCategory(post),
    [post]
  );

  const hub = useMemo(
    () => getPostHub(post),
    [post]
  );

  const location = useMemo(
    () =>
      getPostLocation(post),
    [post]
  );

  const time = useMemo(
    () =>
      formatRelativeTime(
        getPostTime(post)
      ),
    [post]
  );

  const postId =
    post?.id ||
    post?._id ||
    post?.post_id;

  const authorId =
    post?.author_user_id ??
    post?.author_id ??
    post?.user_id ??
    post?.author?.id ??
    post?.author?._id ??
    post?.user?.id ??
    post?.user?._id ??
    null;

  const currentUserId =
    currentUser?.id ??
    currentUser?._id ??
    currentUser?.user_id ??
    currentUser?.userId ??
    currentUser?.sub ??
    null;

  const attachments = useMemo(
    () => normalizeCommunityAttachments(post),
    [post],
  );

  const actionUrl = useMemo(() => {
    const target = String(post?.action?.target || "").trim();
    if (!target) return "";
    if (
      String(post?.action?.type || "").toLowerCase() === "external_link" &&
      !/^https?:\/\//i.test(target)
    ) {
      return "";
    }

    try {
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://revelacode.local";
      const parsed = new URL(target, origin);
      if (!["http:", "https:"].includes(parsed.protocol)) return "";
      return parsed.toString();
    } catch {
      return "";
    }
  }, [post?.action]);

  const isOwnPost = Boolean(
    authorId !== null &&
    currentUserId !== null &&
    String(authorId) === String(currentUserId)
  );

  const shouldTruncate =
    body.length > 360;

  const visibleBody =
    shouldTruncate &&
    !expanded
      ? `${body.slice(
          0,
          360
        )}...`
      : body;

  // ==========================================================
  // ACTIONS
  // ==========================================================

  const handleLike = async () => {
    const nextLiked = !liked;

    setLiked(nextLiked);

    setLocalLikes(
      (current) =>
        Math.max(
          0,
          current +
            (nextLiked ? 1 : -1)
        )
    );

    if (typeof onLike === "function") {
      try {
        await onLike(
          post,
          nextLiked
        );
      } catch (error) {
        // Roll back optimistic update.
        setLiked(!nextLiked);

        setLocalLikes(
          (current) =>
            Math.max(
              0,
              current +
                (nextLiked
                  ? -1
                  : 1)
            )
        );

        console.error(
          "Community post like failed:",
          error
        );
      }
    }
  };

  const handleSave = async () => {
    const nextSaved = !saved;
    setSaved(nextSaved);

    if (typeof onSave === "function") {
      try {
        await onSave(post, nextSaved);
      } catch (error) {
        setSaved(!nextSaved);
        console.error("Community post save failed:", error);
      }
      return;
    }

    try {
      persistSavedPostId(postId, nextSaved);
    } catch (error) {
      setSaved(!nextSaved);
      setShareFeedback("This post could not be saved on this device.");
      console.error("Community post bookmark could not be stored:", error);
    }
  };

  const handleFollow = async () => {
    const nextFollowing =
      !following;

    setFollowing(
      nextFollowing
    );

    if (typeof onFollow === "function") {
      try {
        await onFollow(
          post,
          nextFollowing
        );
      } catch (error) {
        setFollowing(
          !nextFollowing
        );

        console.error(
          "Community follow failed:",
          error
        );
      }
    }
  };

  const handleComment = () => {
    if (
      typeof onComment ===
      "function"
    ) {
      onComment(post);
      return;
    }

    if (
      typeof onOpen ===
      "function"
    ) {
      onOpen(post);
    }
  };

  const handleShare = async () => {
    setShareFeedback("");

    const shareUrl =
      typeof window !== "undefined"
        ? window.location.href
        : "";

    try {
      if (typeof onShare === "function") {
        await onShare(post);
        setShareFeedback("Post shared.");
        return;
      }

      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({
          title,
          text: body.slice(0, 600),
          url: shareUrl,
        });
        setShareFeedback("Share sheet opened.");
        return;
      }

      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function" &&
        shareUrl
      ) {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback("Community link copied. Share it with someone who may find this useful.");
        return;
      }

      setShareFeedback("Sharing is not available in this browser. Copy the page address to share this post.");
    } catch (error) {
      if (error?.name !== "AbortError") {
        setShareFeedback("Unable to share right now. Please try again.");
        console.warn("Community post share failed:", error);
      }
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <article
      className={`
        relative
        overflow-hidden
        rounded-[24px]
        border
        border-slate-200
        bg-white
        shadow-sm
        transition
        hover:shadow-md
        dark:border-white/10
        dark:bg-slate-900
        ${
          compact
            ? "p-4"
            : "p-5 sm:p-6"
        }
      `}
    >
      {/* ======================================================
          TOP AREA
      ====================================================== */}

      <div
        className="
          flex
          items-start
          justify-between
          gap-3
        "
      >
        <div
          className="
            flex
            min-w-0
            items-center
            gap-3
          "
        >
          {/* AVATAR */}

          <button
            type="button"
            onClick={() =>
              typeof onOpen === "function" && onOpen({
                ...post,
                action: "author",
              })
            }
            className="
              relative
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              overflow-hidden
              rounded-full
              bg-gradient-to-br
              from-emerald-500
              to-teal-700
              text-xs
              font-black
              text-white
              ring-2
              ring-white
              dark:ring-slate-900
            "
            aria-label={`Open ${authorName}'s profile`}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={authorName}
                className="
                  h-full
                  w-full
                  object-cover
                "
                onError={(
                  event
                ) => {
                  event.currentTarget.style.display =
                    "none";
                }}
              />
            ) : (
              authorInitials
            )}
          </button>

          {/* AUTHOR INFO */}

          <div className="min-w-0">
            <div
              className="
                flex
                flex-wrap
                items-center
                gap-1.5
              "
            >
              <button
                type="button"
                onClick={() =>
                  typeof onOpen === "function" && onOpen({
                    ...post,
                    action:
                      "author",
                  })
                }
                className="
                  max-w-[190px]
                  truncate
                  text-left
                  text-xs
                  font-black
                  text-slate-900
                  hover:text-emerald-600
                  dark:text-white
                  dark:hover:text-emerald-400
                "
              >
                {authorName}
              </button>

              {post?.author?.verified ||
              post?.verified ? (
                <span
                  className="
                    flex
                    h-4
                    w-4
                    items-center
                    justify-center
                    rounded-full
                    bg-emerald-500
                    text-white
                  "
                  title="Verified member"
                >
                  <Check
                    size={10}
                    strokeWidth={3}
                  />
                </span>
              ) : null}
            </div>

            <div
              className="
                mt-0.5
                flex
                flex-wrap
                items-center
                gap-1.5
                text-[10px]
                font-medium
                text-slate-400
              "
            >
              <span>{time}</span>

              <span>•</span>

              <span>
                {normalizeHubName(
                  hub
                )}
              </span>

              {location && (
                <>
                  <span>•</span>

                  <span className="inline-flex items-center gap-1">
                    <MapPin
                      size={10}
                    />
                    {location}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* MENU */}

        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setShowMenu(
                (current) =>
                  !current
              )
            }
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-xl
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
              dark:hover:bg-white/5
              dark:hover:text-white
            "
            aria-label="Post options"
          >
            <MoreHorizontal
              size={17}
            />
          </button>

          {showMenu && (
            <>
              <button
                type="button"
                aria-label="Close menu"
                className="
                  fixed
                  inset-0
                  z-10
                  cursor-default
                "
                onClick={() =>
                  setShowMenu(
                    false
                  )
                }
              />

              <div
                className="
                  absolute
                  right-0
                  top-10
                  z-20
                  w-48
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-1.5
                  shadow-xl
                  dark:border-white/10
                  dark:bg-slate-900
                "
              >
                {!isOwnPost && typeof onFollow === "function" && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(
                        false
                      );
                      handleFollow();
                    }}
                    className="
                      flex
                      w-full
                      items-center
                      gap-2
                      rounded-xl
                      px-3
                      py-2.5
                      text-left
                      text-xs
                      font-bold
                      text-slate-600
                      hover:bg-slate-50
                      dark:text-slate-300
                      dark:hover:bg-white/5
                    "
                  >
                    <UserPlus
                      size={14}
                    />
                    {following
                      ? "Unfollow member"
                      : "Follow member"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(
                      false
                    );
                    handleSave();
                  }}
                  className="
                    flex
                    w-full
                    items-center
                    gap-2
                    rounded-xl
                    px-3
                    py-2.5
                    text-left
                    text-xs
                    font-bold
                    text-slate-600
                    hover:bg-slate-50
                    dark:text-slate-300
                    dark:hover:bg-white/5
                  "
                >
                  <Bookmark
                    size={14}
                    fill={
                      saved
                        ? "currentColor"
                        : "none"
                    }
                  />
                  {saved
                    ? "Remove bookmark"
                    : "Save post"}
                </button>

                {typeof onReport === "function" && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(
                        false
                      );
                      onReport(post);
                    }}
                    className="
                      flex
                      w-full
                      items-center
                      gap-2
                      rounded-xl
                      px-3
                      py-2.5
                      text-left
                      text-xs
                      font-bold
                      text-rose-500
                      hover:bg-rose-50
                      dark:hover:bg-rose-950/20
                    "
                  >
                    Report post
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {!isOwnPost && authorId ? (
        <WhatsAppButton
          memberId={authorId}
          postId={postId}
          compact
        />
      ) : null}

      {/* ======================================================
          CATEGORY / HUB
      ====================================================== */}

      <div
        className="
          mt-4
          flex
          flex-wrap
          items-center
          gap-2
        "
      >
        <span
          className="
            rounded-full
            bg-emerald-50
            px-2.5
            py-1
            text-[9px]
            font-black
            uppercase
            tracking-wide
            text-emerald-700
            dark:bg-emerald-950/30
            dark:text-emerald-400
          "
        >
          {category}
        </span>

        <span
          className="
            rounded-full
            bg-slate-100
            px-2.5
            py-1
            text-[9px]
            font-bold
            text-slate-500
            dark:bg-slate-800
            dark:text-slate-300
          "
        >
          {normalizeHubName(
            hub
          )}
        </span>

        {post?.group_name && (
          <span
            className="
              inline-flex
              items-center
              gap-1
              rounded-full
              bg-violet-50
              px-2.5
              py-1
              text-[9px]
              font-bold
              text-violet-600
              dark:bg-violet-950/30
              dark:text-violet-400
            "
          >
            <Users size={10} />
            {post.group_name}
          </span>
        )}
      </div>

      {/* ======================================================
          POST CONTENT
      ====================================================== */}

      <button
        type="button"
        onClick={() =>
          typeof onOpen === "function" && onOpen(post)
        }
        className="
          mt-4
          block
          w-full
          text-left
        "
      >
        <h2
          className="
            text-base
            font-black
            leading-6
            text-slate-900
            dark:text-white
            sm:text-lg
          "
        >
          {title}
        </h2>

        {body && (
          <div
            className="
              mt-2
              text-xs
              leading-6
              text-slate-600
              dark:text-slate-300
              sm:text-sm
            "
          >
            {visibleBody}
          </div>
        )}
      </button>

      {actionUrl ? (
        <a
          href={actionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-extrabold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
        >
          {post?.action?.label || "Open resource"}
          <ExternalLink size={13} />
        </a>
      ) : null}

      {/* COMMUNITY MEDIA ATTACHMENTS */}
      {attachments.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {attachments.slice(0, 4).map((attachment, index) => {
            const url = String(attachment.url || attachment.secure_url || "");
            if (!url.startsWith("https://") && !url.startsWith("http://")) return null;

            const key = attachment.id || attachment.media_id || `${postId || "post"}-media-${index}`;
            const isVideo = String(attachment.kind || attachment.resource_type || "").toLowerCase() === "video";

            return isVideo ? (
              <video
                key={key}
                src={url}
                controls
                preload="metadata"
                className="max-h-[440px] w-full rounded-2xl border border-slate-200 bg-black object-contain dark:border-white/10"
                aria-label={attachment.file_name || "Community video attachment"}
              />
            ) : (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10"
                aria-label={`Open ${attachment.file_name || "community image"}`}
              >
                <img
                  src={url}
                  alt={attachment.file_name || "Community post attachment"}
                  loading="lazy"
                  className="max-h-[440px] w-full bg-slate-50 object-contain dark:bg-slate-950"
                />
              </a>
            );
          })}
        </div>
      )}

      {/* ======================================================
          EXPAND / COLLAPSE
      ====================================================== */}

      {shouldTruncate && (
        <button
          type="button"
          onClick={() =>
            setExpanded(
              (current) =>
                !current
            )
          }
          className="
            mt-1
            inline-flex
            items-center
            gap-1
            text-[10px]
            font-black
            text-emerald-600
            hover:text-emerald-700
            dark:text-emerald-400
          "
        >
          {expanded ? (
            <>
              Show less
              <ChevronUp
                size={13}
              />
            </>
          ) : (
            <>
              Read more
              <ChevronDown
                size={13}
              />
            </>
          )}
        </button>
      )}

      {/* ======================================================
          MEDIA
      ====================================================== */}

      {post?.image_url ||
      post?.image ||
      post?.media_url ? (
        <button
          type="button"
          onClick={() =>
            typeof onOpen === "function" && onOpen(post)
          }
          className="
            mt-4
            block
            w-full
            overflow-hidden
            rounded-2xl
            bg-slate-100
            dark:bg-slate-800
          "
        >
          <img
            src={
              post.image_url ||
              post.image ||
              post.media_url
            }
            alt={title}
            className="
              max-h-[520px]
              w-full
              object-cover
              transition
              duration-300
              hover:scale-[1.01]
            "
            loading="lazy"
          />
        </button>
      ) : null}

      {/* ======================================================
          STATS
      ====================================================== */}

      <div
        className="
          mt-5
          flex
          items-center
          justify-between
          border-b
          border-slate-100
          pb-3
          text-[10px]
          font-medium
          text-slate-400
          dark:border-white/5
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          {localLikes > 0 && (
            <span className="inline-flex items-center gap-1">
              <span
                className="
                  flex
                  h-5
                  w-5
                  items-center
                  justify-center
                  rounded-full
                  bg-rose-50
                  text-rose-500
                  dark:bg-rose-950/30
                "
              >
                <Heart
                  size={10}
                  fill="currentColor"
                />
              </span>

              {formatNumber(
                localLikes
              )}
            </span>
          )}

          {localComments > 0 && (
            <span>
              {formatNumber(
                localComments
              )}{" "}
              comments
            </span>
          )}
        </div>

        {post?.shares_count >
          0 && (
          <span>
            {formatNumber(
              post.shares_count
            )}{" "}
            shares
          </span>
        )}
      </div>

      {/* ======================================================
          ACTION BAR
      ====================================================== */}

      <div
        className="
          grid
          grid-cols-4
          gap-1
          pt-2
        "
      >
        {/* LIKE */}

        <button
          type="button"
          onClick={
            handleLike
          }
          className={`
            flex
            min-w-0
            items-center
            justify-center
            gap-1.5
            rounded-xl
            px-2
            py-2.5
            text-[10px]
            font-bold
            transition
            ${
              liked
                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                : "text-slate-400 hover:bg-slate-50 hover:text-rose-500 dark:hover:bg-white/5"
            }
          `}
        >
          <Heart
            size={15}
            fill={
              liked
                ? "currentColor"
                : "none"
            }
          />

          <span className="hidden xs:inline">
            {liked
              ? "Liked"
              : "Like"}
          </span>
        </button>

        {/* COMMENT */}

        <button
          type="button"
          onClick={
            handleComment
          }
          className="
            flex
            min-w-0
            items-center
            justify-center
            gap-1.5
            rounded-xl
            px-2
            py-2.5
            text-[10px]
            font-bold
            text-slate-400
            transition
            hover:bg-slate-50
            hover:text-blue-500
            dark:hover:bg-white/5
          "
        >
          <MessageCircle
            size={15}
          />

          <span className="hidden xs:inline">
            Comment
          </span>
        </button>

        {/* SHARE */}

        <button
          type="button"
          onClick={
            handleShare
          }
          className="
            flex
            min-w-0
            items-center
            justify-center
            gap-1.5
            rounded-xl
            px-2
            py-2.5
            text-[10px]
            font-bold
            text-slate-400
            transition
            hover:bg-slate-50
            hover:text-emerald-500
            dark:hover:bg-white/5
          "
        >
          <Share2
            size={15}
          />

          <span className="hidden xs:inline">
            Share
          </span>
        </button>

        {/* SAVE */}

        <button
          type="button"
          onClick={
            handleSave
          }
          className={`
            flex
            min-w-0
            items-center
            justify-center
            gap-1.5
            rounded-xl
            px-2
            py-2.5
            text-[10px]
            font-bold
            transition
            ${
              saved
                ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                : "text-slate-400 hover:bg-slate-50 hover:text-amber-500 dark:hover:bg-white/5"
            }
          `}
        >
          <Bookmark
            size={15}
            fill={
              saved
                ? "currentColor"
                : "none"
            }
          />

          <span className="hidden xs:inline">
            {saved
              ? "Saved"
              : "Save"}
          </span>
        </button>
      </div>

      {shareFeedback ? (
        <p
          role="status"
          className="mt-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400"
        >
          {shareFeedback}
        </p>
      ) : null}

      {/* ======================================================
          FOLLOWING INDICATOR
      ====================================================== */}

      {following && !isOwnPost && (
        <div
          className="
            mt-3
            flex
            items-center
            justify-center
            gap-1.5
            rounded-xl
            bg-slate-50
            py-2
            text-[9px]
            font-bold
            text-slate-400
            dark:bg-slate-800/60
          "
        >
          <Check size={11} />
          You are following this member
        </div>
      )}

      {/* ======================================================
          AI / SMART CONTENT INDICATOR
      ====================================================== */}

      {post?.ai_generated ||
      post?.ai_assisted ||
      post?.ai_summary ? (
        <div
          className="
            mt-3
            flex
            items-center
            gap-2
            rounded-xl
            border
            border-violet-100
            bg-violet-50/70
            px-3
            py-2
            text-[9px]
            font-semibold
            text-violet-600
            dark:border-violet-900/40
            dark:bg-violet-950/20
            dark:text-violet-400
          "
        >
          <Sparkles
            size={12}
          />

          <span>
            AI-assisted community content
          </span>
        </div>
      ) : null}
    </article>
  );
}
