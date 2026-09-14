import React, { useMemo, useState } from "react";

import {
  Bookmark,
  Check,
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

function getAuthorName(post) {
  return (
    post?.author?.name ||
    post?.author?.full_name ||
    post?.author?.fullName ||
    post?.user?.name ||
    post?.user?.full_name ||
    post?.username ||
    post?.author_name ||
    "Community Member"
  );
}

function getAuthorInitials(name) {
  if (!name) return "CM";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getAuthorAvatar(post) {
  return (
    post?.author?.avatar ||
    post?.author?.avatar_url ||
    post?.author?.profile_image ||
    post?.author?.profileImage ||
    post?.user?.avatar ||
    post?.user?.avatar_url ||
    post?.avatar ||
    null
  );
}

function getPostTitle(post) {
  return (
    post?.title ||
    post?.headline ||
    "Community Update"
  );
}

function getPostBody(post) {
  return (
    post?.body ||
    post?.content ||
    post?.description ||
    ""
  );
}

function getPostCategory(post) {
  return (
    post?.category ||
    post?.type ||
    "general"
  );
}

function getPostHub(post) {
  return (
    post?.hub ||
    post?.hub_name ||
    "community"
  );
}

function getPostLocation(post) {
  return (
    post?.location ||
    post?.location_name ||
    ""
  );
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
    useState(
      Boolean(
        post?.saved ||
          post?.is_saved ||
          post?.bookmarked
      )
    );

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

  const isOwnPost =
    Boolean(
      currentUser &&
        (
          post?.author?.id ===
            currentUser?.id ||
          post?.author_id ===
            currentUser?.id ||
          post?.user_id ===
            currentUser?.id
        )
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
        await onSave(
          post,
          nextSaved
        );
      } catch (error) {
        setSaved(!nextSaved);

        console.error(
          "Community post save failed:",
          error
        );
      }
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
    if (
      typeof onShare ===
      "function"
    ) {
      await onShare(post);
      return;
    }

    try {
      if (
        navigator?.clipboard &&
        postId
      ) {
        await navigator.clipboard.writeText(
          `${window.location.origin}/community/post/${postId}`
        );
      }
    } catch (error) {
      console.warn(
        "Unable to copy post link:",
        error
      );
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
              onOpen?.({
                ...post,
                action:
                  "author",
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
                  onOpen?.({
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
                {!isOwnPost && (
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

                {onReport && (
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
          onOpen?.(post)
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
            onOpen?.(post)
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
