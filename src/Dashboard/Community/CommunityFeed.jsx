import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  Bell,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Filter,
  GraduationCap,
  Heart,
  Leaf,
  MessageCircle,
  RefreshCw,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";

// ============================================================
// CONFIG
// ============================================================

const HUB_FILTERS = [
  {
    value: "all",
    label: "All Community",
    icon: Users,
  },
  {
    value: "community",
    label: "Community",
    icon: Users,
  },
  {
    value: "biashara",
    label: "Biashara",
    icon: Briefcase,
  },
  {
    value: "shamba",
    label: "Shamba",
    icon: Leaf,
  },
  {
    value: "elimu",
    label: "Elimu",
    icon: GraduationCap,
  },
];

const CATEGORY_FILTERS = [
  { value: "all", label: "Everything" },
  { value: "general", label: "General" },
  { value: "discussion", label: "Discussion" },
  { value: "question", label: "Questions" },
  { value: "announcement", label: "Announcements" },
  { value: "opportunity", label: "Opportunities" },
  { value: "help", label: "Help" },
];

// ============================================================
// HELPERS
// ============================================================

function getDisplayName(user) {
  if (!user) return "Member";

  return (
    user.name ||
    user.full_name ||
    user.fullName ||
    user.username ||
    user.email?.split("@")[0] ||
    "Member"
  );
}

function getInitials(name) {
  if (!name) return "M";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[
    parts.length - 1
  ].charAt(0)}`.toUpperCase();
}

function getPostId(post) {
  return (
    post?.id ||
    post?._id ||
    post?.post_id ||
    post?.postId
  );
}

function getTitle(post) {
  return (
    post?.title ||
    post?.subject ||
    "Community update"
  );
}

function getBody(post) {
  return (
    post?.body ||
    post?.content ||
    post?.text ||
    ""
  );
}

function getAuthor(post) {
  return (
    post?.author?.name ||
    post?.author_name ||
    post?.authorName ||
    post?.user?.name ||
    post?.user_name ||
    post?.username ||
    "Community member"
  );
}

function getAvatar(post) {
  return (
    post?.author?.avatar ||
    post?.author?.profile_image ||
    post?.avatar ||
    post?.profile_image ||
    null
  );
}

function getHub(post) {
  return String(
    post?.hub ||
      post?.source_hub ||
      post?.target_hub ||
      "community"
  ).toLowerCase();
}

function getCategory(post) {
  return String(
    post?.category ||
      post?.type ||
      "general"
  ).toLowerCase();
}

function getCreatedAt(post) {
  return (
    post?.created_at ||
    post?.createdAt ||
    post?.timestamp ||
    post?.date ||
    null
  );
}

function formatTime(value) {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const difference =
    Date.now() - date.getTime();

  const minutes = Math.floor(
    difference / 60000
  );

  const hours = Math.floor(
    difference / 3600000
  );

  const days = Math.floor(
    difference / 86400000
  );

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

function formatLabel(value) {
  if (!value) return "";

  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getReactionCount(post) {
  return (
    post?.reactions_count ??
    post?.reaction_count ??
    post?.likes_count ??
    post?.likes ??
    0
  );
}

function getCommentCount(post) {
  return (
    post?.comments_count ??
    post?.comment_count ??
    post?.comments?.length ??
    0
  );
}

function getShareCount(post) {
  return (
    post?.shares_count ??
    post?.share_count ??
    post?.shares ??
    0
  );
}

function isReacted(post) {
  return Boolean(
    post?.user_reacted ??
      post?.is_reacted ??
      post?.liked_by_user ??
      post?.liked
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function CommunityFeed({
  onNavigate,
}) {
  const { user } = useAuth();

  const {
    getCommunityFeed,
    reactToCommunityPost,
  } = useJumuiyaApi();

  const [posts, setPosts] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedHub, setSelectedHub] =
    useState("all");

  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [showFilters, setShowFilters] =
    useState(false);

  const [reactingPost, setReactingPost] =
    useState(null);

  const displayName = useMemo(
    () => getDisplayName(user),
    [user]
  );

  const initials = useMemo(
    () => getInitials(displayName),
    [displayName]
  );

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigate = useCallback(
    (destination) => {
      if (typeof onNavigate === "function") {
        onNavigate(destination);
      } else {
        console.warn(
          "Community navigation:",
          destination
        );
      }
    },
    [onNavigate]
  );

  // ==========================================================
  // LOAD FEED
  // ==========================================================

  const loadFeed = useCallback(
    async (silent = false) => {
      try {
        setError("");

        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response =
          await getCommunityFeed({
            hub:
              selectedHub === "all"
                ? undefined
                : selectedHub,

            category:
              selectedCategory === "all"
                ? undefined
                : selectedCategory,

            limit: 50,
          });

        const incomingPosts =
          Array.isArray(response)
            ? response
            : Array.isArray(response?.posts)
              ? response.posts
              : Array.isArray(response?.data)
                ? response.data
                : [];

        setPosts(incomingPosts);
      } catch (err) {
        console.error(
          "Community feed load failed:",
          err
        );

        setError(
          err?.message ||
            "Unable to load community posts."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      getCommunityFeed,
      selectedHub,
      selectedCategory,
    ]
  );

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // ==========================================================
  // LOCAL SEARCH
  // ==========================================================

  const filteredPosts = useMemo(() => {
    const query =
      searchTerm.trim().toLowerCase();

    if (!query) {
      return posts;
    }

    return posts.filter((post) => {
      const title =
        getTitle(post).toLowerCase();

      const body =
        getBody(post).toLowerCase();

      const author =
        getAuthor(post).toLowerCase();

      const hub =
        getHub(post).toLowerCase();

      return (
        title.includes(query) ||
        body.includes(query) ||
        author.includes(query) ||
        hub.includes(query)
      );
    });
  }, [posts, searchTerm]);

  // ==========================================================
  // REACT TO POST
  // ==========================================================

  const handleReaction = async (post) => {
    const postId = getPostId(post);

    if (!postId || reactingPost === postId) {
      return;
    }

    try {
      setReactingPost(postId);

      await reactToCommunityPost(postId);

      setPosts((current) =>
        current.map((item) => {
          if (
            getPostId(item) !== postId
          ) {
            return item;
          }

          const reacted =
            isReacted(item);

          const currentCount =
            getReactionCount(item);

          return {
            ...item,
            user_reacted: !reacted,
            is_reacted: !reacted,
            liked_by_user: !reacted,
            liked: !reacted,
            reactions_count:
              reacted
                ? Math.max(
                    0,
                    currentCount - 1
                  )
                : currentCount + 1,
          };
        })
      );
    } catch (err) {
      console.error(
        "Community reaction failed:",
        err
      );
    } finally {
      setReactingPost(null);
    }
  };

  // ==========================================================
  // ACTIVE FILTER COUNT
  // ==========================================================

  const activeFilterCount = [
    selectedHub !== "all",
    selectedCategory !== "all",
    Boolean(searchTerm.trim()),
  ].filter(Boolean).length;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <JumuiyaDashboardShell
      title="Community Feed"
      subtitle="Discover conversations and activity across Jumuiya."
      activeHub="community"
      user={user}
      onNavigate={onNavigate}
    >
      <div className="space-y-5 pb-10">

        {/* ====================================================
            PAGE HEADER
        ==================================================== */}

        <section
          className="
            rounded-[24px]
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
            dark:border-white/10
            dark:bg-slate-900
            sm:p-6
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div className="flex items-start gap-3">
              <div
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-emerald-100
                  text-emerald-700
                  dark:bg-emerald-950/40
                  dark:text-emerald-400
                "
              >
                <MessageCircle size={21} />
              </div>

              <div>
                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <h1
                    className="
                      text-xl
                      font-black
                      tracking-tight
                      text-slate-900
                      dark:text-white
                    "
                  >
                    Community Feed
                  </h1>

                  <Sparkles
                    size={15}
                    className="
                      text-emerald-500
                    "
                  />
                </div>

                <p
                  className="
                    mt-1
                    max-w-xl
                    text-xs
                    leading-5
                    text-slate-400
                  "
                >
                  Follow discussions, opportunities,
                  announcements and useful conversations
                  from across the Jumuiya ecosystem.
                </p>
              </div>
            </div>

            <div
              className="
                flex
                flex-col
                gap-2
                sm:flex-row
              "
            >
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "community-composer"
                  )
                }
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-emerald-600
                  px-4
                  py-3
                  text-sm
                  font-bold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-emerald-700
                  active:scale-[0.98]
                "
              >
                <Sparkles size={16} />
                Create post
              </button>
            </div>
          </div>
        </section>

        {/* ====================================================
            SEARCH
        ==================================================== */}

        <section
          className="
            rounded-[22px]
            border
            border-slate-200
            bg-white
            p-4
            shadow-sm
            dark:border-white/10
            dark:bg-slate-900
          "
        >
          <div
            className="
              flex
              flex-col
              gap-3
              lg:flex-row
            "
          >
            <div
              className="
                relative
                min-w-0
                flex-1
              "
            >
              <Search
                size={17}
                className="
                  pointer-events-none
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search posts, people, discussions or topics..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  py-3
                  pl-11
                  pr-10
                  text-sm
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-emerald-500
                  focus:bg-white
                  focus:ring-4
                  focus:ring-emerald-500/10
                  dark:border-white/10
                  dark:bg-slate-950
                  dark:text-white
                  dark:focus:bg-slate-950
                "
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchTerm("")
                  }
                  className="
                    absolute
                    right-3
                    top-1/2
                    flex
                    h-7
                    w-7
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-lg
                    text-slate-400
                    hover:bg-slate-200
                    hover:text-slate-700
                    dark:hover:bg-white/10
                    dark:hover:text-white
                  "
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setShowFilters(
                  (value) => !value
                )
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-3
                text-sm
                font-semibold
                text-slate-700
                transition
                hover:bg-slate-50
                dark:border-white/10
                dark:bg-slate-950
                dark:text-slate-200
                dark:hover:bg-white/5
                lg:w-auto
              "
            >
              <SlidersHorizontal
                size={16}
              />
              Filters

              {activeFilterCount > 0 && (
                <span
                  className="
                    flex
                    h-5
                    min-w-5
                    items-center
                    justify-center
                    rounded-full
                    bg-emerald-600
                    px-1.5
                    text-[10px]
                    font-black
                    text-white
                  "
                >
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                loadFeed(true)
              }
              disabled={refreshing}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-slate-200
                px-4
                py-3
                text-sm
                font-semibold
                text-slate-600
                transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-50
                dark:border-white/10
                dark:text-slate-300
                dark:hover:bg-white/5
              "
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>
          </div>

          {/* FILTER PANEL */}

          {showFilters && (
            <div
              className="
                mt-4
                border-t
                border-slate-100
                pt-4
                dark:border-white/5
              "
            >
              <div
                className="
                  grid
                  gap-4
                  lg:grid-cols-2
                "
              >

                {/* HUB */}

                <div>
                  <div
                    className="
                      mb-2
                      flex
                      items-center
                      gap-2
                      text-xs
                      font-bold
                      text-slate-700
                      dark:text-slate-200
                    "
                  >
                    <Filter size={14} />
                    Hub
                  </div>

                  <div
                    className="
                      flex
                      flex-wrap
                      gap-2
                    "
                  >
                    {HUB_FILTERS.map(
                      (filter) => {
                        const Icon =
                          filter.icon;

                        const active =
                          selectedHub ===
                          filter.value;

                        return (
                          <button
                            key={
                              filter.value
                            }
                            type="button"
                            onClick={() =>
                              setSelectedHub(
                                filter.value
                              )
                            }
                            className={`
                              inline-flex
                              items-center
                              gap-2
                              rounded-xl
                              border
                              px-3
                              py-2
                              text-xs
                              font-semibold
                              transition
                              ${
                                active
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-white/5"
                              }
                            `}
                          >
                            <Icon size={14} />
                            {filter.label}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* CATEGORY */}

                <div>
                  <div
                    className="
                      mb-2
                      flex
                      items-center
                      gap-2
                      text-xs
                      font-bold
                      text-slate-700
                      dark:text-slate-200
                    "
                  >
                    <Filter size={14} />
                    Post type
                  </div>

                  <div
                    className="
                      relative
                    "
                  >
                    <select
                      value={
                        selectedCategory
                      }
                      onChange={(event) =>
                        setSelectedCategory(
                          event.target.value
                        )
                      }
                      className="
                        w-full
                        appearance-none
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-3
                        py-3
                        pr-9
                        text-xs
                        font-semibold
                        text-slate-700
                        outline-none
                        focus:border-emerald-500
                        focus:ring-4
                        focus:ring-emerald-500/10
                        dark:border-white/10
                        dark:bg-slate-950
                        dark:text-slate-200
                      "
                    >
                      {CATEGORY_FILTERS.map(
                        (category) => (
                          <option
                            key={
                              category.value
                            }
                            value={
                              category.value
                            }
                          >
                            {category.label}
                          </option>
                        )
                      )}
                    </select>

                    <ChevronDown
                      size={15}
                      className="
                        pointer-events-none
                        absolute
                        right-3
                        top-1/2
                        -translate-y-1/2
                        text-slate-400
                      "
                    />
                  </div>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedHub("all");
                    setSelectedCategory(
                      "all"
                    );
                  }}
                  className="
                    mt-4
                    inline-flex
                    items-center
                    gap-2
                    text-xs
                    font-bold
                    text-slate-400
                    transition
                    hover:text-emerald-600
                    dark:hover:text-emerald-400
                  "
                >
                  <X size={14} />
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </section>

        {/* ====================================================
            ACTIVE FILTER SUMMARY
        ==================================================== */}

        <div
          className="
            flex
            flex-wrap
            items-center
            justify-between
            gap-3
          "
        >
          <div
            className="
              text-xs
              text-slate-400
            "
          >
            Showing{" "}
            <span
              className="
                font-bold
                text-slate-700
                dark:text-slate-200
              "
            >
              {filteredPosts.length}
            </span>{" "}
            {filteredPosts.length === 1
              ? "post"
              : "posts"}
          </div>

          {selectedHub !== "all" && (
            <div
              className="
                rounded-full
                bg-emerald-50
                px-3
                py-1.5
                text-[10px]
                font-bold
                text-emerald-700
                dark:bg-emerald-950/30
                dark:text-emerald-400
              "
            >
              {formatLabel(selectedHub)}
            </div>
          )}
        </div>

        {/* ====================================================
            FEED
        ==================================================== */}

        <section className="space-y-4">

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="
                      animate-pulse
                      rounded-[24px]
                      border
                      border-slate-200
                      bg-white
                      p-5
                      dark:border-white/10
                      dark:bg-slate-900
                    "
                  >
                    <div className="flex gap-3">
                      <div
                        className="
                          h-11
                          w-11
                          rounded-full
                          bg-slate-100
                          dark:bg-slate-800
                        "
                      />

                      <div className="flex-1">
                        <div
                          className="
                            h-3
                            w-32
                            rounded
                            bg-slate-100
                            dark:bg-slate-800
                          "
                        />

                        <div
                          className="
                            mt-3
                            h-4
                            w-3/5
                            rounded
                            bg-slate-100
                            dark:bg-slate-800
                          "
                        />

                        <div
                          className="
                            mt-3
                            h-3
                            w-full
                            rounded
                            bg-slate-100
                            dark:bg-slate-800
                          "
                        />

                        <div
                          className="
                            mt-2
                            h-3
                            w-4/5
                            rounded
                            bg-slate-100
                            dark:bg-slate-800
                          "
                        />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : error ? (
            <div
              className="
                rounded-[24px]
                border
                border-red-100
                bg-red-50
                p-6
                dark:border-red-500/10
                dark:bg-red-950/20
              "
            >
              <div
                className="
                  flex
                  flex-col
                  items-center
                  text-center
                "
              >
                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-2xl
                    bg-red-100
                    text-red-600
                    dark:bg-red-950/40
                    dark:text-red-400
                  "
                >
                  <MessageCircle
                    size={21}
                  />
                </div>

                <h3
                  className="
                    mt-4
                    text-sm
                    font-black
                    text-red-700
                    dark:text-red-400
                  "
                >
                  We couldn't load the feed
                </h3>

                <p
                  className="
                    mt-1
                    max-w-md
                    text-xs
                    leading-5
                    text-red-600/80
                    dark:text-red-400/80
                  "
                >
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    loadFeed()
                  }
                  className="
                    mt-4
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-red-600
                    px-4
                    py-2.5
                    text-xs
                    font-bold
                    text-white
                  "
                >
                  <RefreshCw size={14} />
                  Try again
                </button>
              </div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div
              className="
                rounded-[24px]
                border
                border-dashed
                border-slate-200
                bg-white
                px-6
                py-14
                text-center
                dark:border-white/10
                dark:bg-slate-900
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-emerald-50
                  text-emerald-600
                  dark:bg-emerald-950/30
                  dark:text-emerald-400
                "
              >
                <Search size={22} />
              </div>

              <h3
                className="
                  mt-4
                  text-sm
                  font-black
                  text-slate-900
                  dark:text-white
                "
              >
                No posts found
              </h3>

              <p
                className="
                  mx-auto
                  mt-1
                  max-w-md
                  text-xs
                  leading-5
                  text-slate-400
                "
              >
                Try another search term or
                change your community filters.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedHub("all");
                  setSelectedCategory(
                    "all"
                  );
                }}
                className="
                  mt-4
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-2.5
                  text-xs
                  font-bold
                  text-slate-600
                  dark:border-white/10
                  dark:text-slate-300
                "
              >
                <X size={14} />
                Reset filters
              </button>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const postId =
                getPostId(post);

              const author =
                getAuthor(post);

              const avatar =
                getAvatar(post);

              const hub =
                getHub(post);

              const category =
                getCategory(post);

              const reacted =
                isReacted(post);

              const reactionCount =
                getReactionCount(post);

              const commentCount =
                getCommentCount(post);

              const shareCount =
                getShareCount(post);

              return (
                <article
                  key={
                    postId ||
                    `${author}-${getTitle(
                      post
                    )}`
                  }
                  className="
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
                  "
                >
                  {/* POST HEADER */}

                  <div className="p-5">
                    <div
                      className="
                        flex
                        items-start
                        gap-3
                      "
                    >
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={author}
                          className="
                            h-11
                            w-11
                            shrink-0
                            rounded-full
                            object-cover
                          "
                        />
                      ) : (
                        <div
                          className="
                            flex
                            h-11
                            w-11
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-emerald-100
                            text-xs
                            font-black
                            text-emerald-700
                            dark:bg-emerald-950/40
                            dark:text-emerald-400
                          "
                        >
                          {getInitials(
                            author
                          )}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div
                          className="
                            flex
                            flex-wrap
                            items-center
                            gap-x-2
                            gap-y-1
                          "
                        >
                          <span
                            className="
                              text-sm
                              font-bold
                              text-slate-900
                              dark:text-white
                            "
                          >
                            {author}
                          </span>

                          <span className="text-xs text-slate-300">
                            ·
                          </span>

                          <span
                            className="
                              text-[10px]
                              font-bold
                              text-emerald-600
                              dark:text-emerald-400
                            "
                          >
                            {formatLabel(hub)}
                          </span>

                          <span className="text-xs text-slate-300">
                            ·
                          </span>

                          <span
                            className="
                              text-[10px]
                              text-slate-400
                            "
                          >
                            {formatTime(
                              getCreatedAt(
                                post
                              )
                            )}
                          </span>
                        </div>

                        <div
                          className="
                            mt-2
                            flex
                            flex-wrap
                            gap-2
                          "
                        >
                          <span
                            className="
                              rounded-full
                              bg-slate-100
                              px-2.5
                              py-1
                              text-[9px]
                              font-bold
                              uppercase
                              tracking-wide
                              text-slate-500
                              dark:bg-slate-800
                              dark:text-slate-400
                            "
                          >
                            {formatLabel(
                              category
                            )}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          text-slate-400
                          transition
                          hover:bg-slate-100
                          hover:text-slate-700
                          dark:hover:bg-white/5
                          dark:hover:text-white
                        "
                        aria-label="Post options"
                      >
                        <ChevronDown
                          size={16}
                        />
                      </button>
                    </div>

                    {/* POST CONTENT */}

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `community-post-${postId}`
                        )
                      }
                      className="
                        mt-5
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
                        "
                      >
                        {getTitle(post)}
                      </h2>

                      {getBody(post) && (
                        <p
                          className="
                            mt-2
                            whitespace-pre-line
                            text-sm
                            leading-6
                            text-slate-600
                            dark:text-slate-300
                          "
                        >
                          {getBody(post)}
                        </p>
                      )}
                    </button>
                  </div>

                  {/* POST STATS */}

                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      border-t
                      border-slate-100
                      px-5
                      py-3
                      text-[11px]
                      text-slate-400
                      dark:border-white/5
                    "
                  >
                    <div className="flex items-center gap-4">
                      <span>
                        {reactionCount}{" "}
                        {reactionCount === 1
                          ? "reaction"
                          : "reactions"}
                      </span>

                      <span>
                        {commentCount}{" "}
                        {commentCount === 1
                          ? "comment"
                          : "comments"}
                      </span>
                    </div>

                    {shareCount > 0 && (
                      <span>
                        {shareCount} shares
                      </span>
                    )}
                  </div>

                  {/* POST ACTIONS */}

                  <div
                    className="
                      grid
                      grid-cols-3
                      border-t
                      border-slate-100
                      dark:border-white/5
                    "
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleReaction(post)
                      }
                      disabled={
                        reactingPost ===
                        postId
                      }
                      className={`
                        flex
                        items-center
                        justify-center
                        gap-2
                        px-3
                        py-3.5
                        text-xs
                        font-bold
                        transition
                        ${
                          reacted
                            ? "text-rose-500"
                            : "text-slate-500 hover:bg-slate-50 hover:text-rose-500 dark:text-slate-400 dark:hover:bg-white/[0.025]"
                        }
                      `}
                    >
                      <Heart
                        size={16}
                        fill={
                          reacted
                            ? "currentColor"
                            : "none"
                        }
                        className={
                          reactingPost ===
                          postId
                            ? "animate-pulse"
                            : ""
                        }
                      />

                      <span className="hidden sm:inline">
                        {reacted
                          ? "Liked"
                          : "Like"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `community-post-${postId}-comments`
                        )
                      }
                      className="
                        flex
                        items-center
                        justify-center
                        gap-2
                        border-x
                        border-slate-100
                        px-3
                        py-3.5
                        text-xs
                        font-bold
                        text-slate-500
                        transition
                        hover:bg-slate-50
                        hover:text-emerald-600
                        dark:border-white/5
                        dark:text-slate-400
                        dark:hover:bg-white/[0.025]
                        dark:hover:text-emerald-400
                      "
                    >
                      <MessageCircle
                        size={16}
                      />

                      <span className="hidden sm:inline">
                        Comment
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `community-share-${postId}`
                        )
                      }
                      className="
                        flex
                        items-center
                        justify-center
                        gap-2
                        px-3
                        py-3.5
                        text-xs
                        font-bold
                        text-slate-500
                        transition
                        hover:bg-slate-50
                        hover:text-emerald-600
                        dark:text-slate-400
                        dark:hover:bg-white/[0.025]
                        dark:hover:text-emerald-400
                      "
                    >
                      <Share2 size={16} />

                      <span className="hidden sm:inline">
                        Share
                      </span>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {/* ====================================================
            END OF FEED
        ==================================================== */}

        {!loading &&
          !error &&
          filteredPosts.length > 0 && (
            <div
              className="
                flex
                flex-col
                items-center
                justify-center
                gap-2
                py-6
                text-center
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  bg-slate-100
                  text-slate-400
                  dark:bg-slate-800
                "
              >
                <Users size={17} />
              </div>

              <p
                className="
                  text-xs
                  font-semibold
                  text-slate-400
                "
              >
                You're all caught up.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "community-discover"
                  )
                }
                className="
                  inline-flex
                  items-center
                  gap-1
                  text-xs
                  font-bold
                  text-emerald-600
                  dark:text-emerald-400
                "
              >
                Discover more
                <ChevronRight size={14} />
              </button>
            </div>
          )}

        {/* ====================================================
            MOBILE COMMUNITY IDENTITY
        ==================================================== */}

        <div
          className="
            flex
            items-center
            gap-3
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-4
            dark:border-white/10
            dark:bg-slate-900
            lg:hidden
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-emerald-100
              text-xs
              font-black
              text-emerald-700
              dark:bg-emerald-950/40
              dark:text-emerald-400
            "
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div
              className="
                truncate
                text-xs
                font-bold
                text-slate-800
                dark:text-slate-100
              "
            >
              {displayName}
            </div>

            <div
              className="
                text-[10px]
                text-slate-400
              "
            >
              Jumuiya Community Member
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                "community-notifications"
              )
            }
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-slate-100
              text-slate-500
              dark:bg-slate-800
              dark:text-slate-300
            "
          >
            <Bell size={16} />
          </button>
        </div>
      </div>
    </JumuiyaDashboardShell>
  );
}
