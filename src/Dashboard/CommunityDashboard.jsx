// frontend/Dashboard/Community/CommunityDashboard.jsx

import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  Bell,
  Briefcase,
  ChevronRight,
  HelpCircle,
  Compass,
  GraduationCap,
  Heart,
  Leaf,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";

// ============================================================
// HUB CONFIGURATION
// ============================================================

const HUBS = [
  {
    key: "community",
    label: "Community",
    description: "Connect, discuss and discover.",
    icon: Users,
  },
  {
    key: "biashara",
    label: "Biashara",
    description: "Businesses and opportunities.",
    icon: Briefcase,
  },
  {
    key: "shamba",
    label: "Shamba",
    description: "Farming and agriculture.",
    icon: Leaf,
  },
  {
    key: "elimu",
    label: "Elimu",
    description: "Education and learning.",
    icon: GraduationCap,
  },
];

const QUICK_ACTIONS = [
  {
    key: "feed",
    label: "Community Feed",
    description: "See what people are sharing.",
    icon: MessageCircle,
  },
  {
    key: "discover",
    label: "Discover",
    description: "Find people, groups and hubs.",
    icon: Compass,
  },
  {
    key: "groups",
    label: "Groups",
    description: "Join communities that matter.",
    icon: Users,
  },
  {
    key: "activity",
    label: "My Activity",
    description: "Manage your community activity.",
    icon: TrendingUp,
  },
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

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[
    parts.length - 1
  ].charAt(0)}`.toUpperCase();
}

function formatTime(value) {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const now = new Date();
  const difference = now.getTime() - date.getTime();

  const minutes = Math.floor(difference / 60000);
  const hours = Math.floor(difference / 3600000);
  const days = Math.floor(difference / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

function getPostId(post) {
  return (
    post?.id ||
    post?._id ||
    post?.post_id ||
    post?.postId
  );
}

function getPostTitle(post) {
  return (
    post?.title ||
    post?.subject ||
    "Community update"
  );
}

function getPostBody(post) {
  return (
    post?.body ||
    post?.content ||
    post?.text ||
    ""
  );
}

function getPostAuthor(post) {
  return (
    post?.author?.name ||
    post?.author_name ||
    post?.user?.name ||
    post?.user_name ||
    post?.username ||
    "Community member"
  );
}

function getPostHub(post) {
  const hub =
    post?.hub ||
    post?.source_hub ||
    post?.target_hub ||
    "community";

  return String(hub)
    .charAt(0)
    .toUpperCase() + String(hub).slice(1);
}

// ============================================================
// COMPONENT
// ============================================================

export default function CommunityDashboard({
  onNavigate,
}) {
  const { user } = useAuth();

  const {
    getCommunityFeed,
  } = useJumuiyaApi();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const displayName = useMemo(
    () => getDisplayName(user),
    [user]
  );

  const initials = useMemo(
    () => getInitials(displayName),
    [displayName]
  );

  // ============================================================
  // LOAD COMMUNITY OVERVIEW DATA
  // ============================================================

  const loadCommunity = useCallback(
    async (silent = false) => {
      try {
        setError("");

        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await getCommunityFeed({
          hub: "community",
          limit: 20,
        });

        const incomingPosts = Array.isArray(response)
          ? response
          : Array.isArray(response?.posts)
            ? response.posts
            : Array.isArray(response?.data)
              ? response.data
              : [];

        setPosts(incomingPosts);
      } catch (err) {
        console.error(
          "Community dashboard load failed:",
          err
        );

        setError(
          err?.message ||
            "Unable to load the community right now."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getCommunityFeed]
  );

  useEffect(() => {
    loadCommunity();
  }, [loadCommunity]);

  // ============================================================
  // NAVIGATION
  // ============================================================

  const navigate = useCallback(
    (destination) => {
      if (typeof onNavigate === "function") {
        onNavigate(destination);
        return;
      }

      console.warn(
        "Community navigation requested:",
        destination
      );
    },
    [onNavigate]
  );

  // ============================================================
  // DERIVED DATA
  // ============================================================

  const recentPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => {
        const first = new Date(
          a?.created_at ||
            a?.createdAt ||
            a?.timestamp ||
            0
        ).getTime();

        const second = new Date(
          b?.created_at ||
            b?.createdAt ||
            b?.timestamp ||
            0
        ).getTime();

        return second - first;
      })
      .slice(0, 5);
  }, [posts]);

  const hubCounts = useMemo(() => {
    const counts = {
      community: 0,
      biashara: 0,
      shamba: 0,
      elimu: 0,
    };

    posts.forEach((post) => {
      const hub = String(
        post?.hub ||
          post?.source_hub ||
          post?.target_hub ||
          "community"
      ).toLowerCase();

      if (Object.prototype.hasOwnProperty.call(counts, hub)) {
        counts[hub] += 1;
      }
    });

    return counts;
  }, [posts]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <JumuiyaDashboardShell
      title="Community"
      subtitle="Connect with people across the Jumuiya ecosystem."
      activeHub="community"
      user={user}
      onNavigate={onNavigate}
    >
      <div className="space-y-6 pb-10">

        {/* ======================================================
            HERO
        ====================================================== */}

        <section
          className="
            overflow-hidden
            rounded-[28px]
            border
            border-emerald-200/70
            bg-gradient-to-br
            from-emerald-600
            via-emerald-600
            to-teal-700
            text-white
            shadow-xl
            shadow-emerald-900/10
            dark:border-emerald-500/20
          "
        >
          <div
            className="
              relative
              px-5
              py-6
              sm:px-7
              sm:py-8
            "
          >
            <div
              className="
                absolute
                -right-16
                -top-16
                h-40
                w-40
                rounded-full
                bg-white/10
                blur-2xl
              "
            />

            <div
              className="
                absolute
                -bottom-20
                left-1/3
                h-48
                w-48
                rounded-full
                bg-teal-300/10
                blur-3xl
              "
            />

            <div className="relative z-10">
              <div
                className="
                  flex
                  flex-col
                  gap-6
                  lg:flex-row
                  lg:items-center
                  lg:justify-between
                "
              >
                <div className="max-w-2xl">
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className="
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-2xl
                        bg-white/15
                        backdrop-blur
                      "
                    >
                      <Sparkles size={20} />
                    </div>

                    <span
                      className="
                        text-xs
                        font-semibold
                        uppercase
                        tracking-[0.16em]
                        text-emerald-50/90
                      "
                    >
                      Jumuiya Community
                    </span>
                  </div>

                  <h1
                    className="
                      text-2xl
                      font-black
                      tracking-tight
                      sm:text-3xl
                    "
                  >
                    Welcome back, {displayName}.
                  </h1>

                  <p
                    className="
                      mt-2
                      max-w-xl
                      text-sm
                      leading-6
                      text-emerald-50/90
                      sm:text-base
                    "
                  >
                    Discover conversations, people,
                    opportunities and activity from
                    across the Jumuiya ecosystem.
                  </p>

                  <div
                    className="
                      mt-5
                      flex
                      flex-col
                      gap-3
                      sm:flex-row
                    "
                  >
                    <button
                      type="button"
                      onClick={() =>
                        navigate("community-composer")
                      }
                      className="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-white
                        px-5
                        py-3
                        text-sm
                        font-bold
                        text-emerald-700
                        shadow-sm
                        transition
                        hover:bg-emerald-50
                        active:scale-[0.98]
                      "
                    >
                      <Plus size={17} />
                      Create post
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate("community-feed")
                      }
                      className="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        border
                        border-white/20
                        bg-white/10
                        px-5
                        py-3
                        text-sm
                        font-semibold
                        text-white
                        backdrop-blur
                        transition
                        hover:bg-white/15
                        active:scale-[0.98]
                      "
                    >
                      <MessageCircle size={17} />
                      Open feed
                    </button>
                  </div>
                </div>

                <div
                  className="
                    hidden
                    shrink-0
                    sm:flex
                    lg:mr-3
                  "
                >
                  <div
                    className="
                      flex
                      h-24
                      w-24
                      items-center
                      justify-center
                      rounded-[30px]
                      border
                      border-white/20
                      bg-white/10
                      text-3xl
                      font-black
                      backdrop-blur
                    "
                  >
                    {initials}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            STATS
        ====================================================== */}

        <section>
          <div
            className="
              grid
              grid-cols-2
              gap-3
              lg:grid-cols-4
            "
          >
            {HUBS.map((hub) => {
              const Icon = hub.icon;

              return (
                <button
                  key={hub.key}
                  type="button"
                  onClick={() =>
                    navigate(
                      `community-hub-${hub.key}`
                    )
                  }
                  className="
                    group
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-4
                    text-left
                    shadow-sm
                    transition
                    hover:-translate-y-0.5
                    hover:shadow-md
                    dark:border-white/10
                    dark:bg-slate-900
                  "
                >
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        bg-emerald-50
                        text-emerald-600
                        dark:bg-emerald-950/30
                        dark:text-emerald-400
                      "
                    >
                      <Icon size={18} />
                    </div>

                    <ChevronRight
                      size={16}
                      className="
                        text-slate-300
                        transition
                        group-hover:translate-x-0.5
                        dark:text-slate-600
                      "
                    />
                  </div>

                  <div
                    className="
                      mt-4
                      text-2xl
                      font-black
                      tracking-tight
                      text-slate-900
                      dark:text-white
                    "
                  >
                    {hubCounts[hub.key] || 0}
                  </div>

                  <div
                    className="
                      mt-1
                      text-xs
                      font-semibold
                      text-slate-600
                      dark:text-slate-300
                    "
                  >
                    {hub.label} activity
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ======================================================
            MAIN GRID
        ====================================================== */}

        <section
          className="
            grid
            gap-6
            xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]
          "
        >

          {/* ====================================================
              RECENT COMMUNITY ACTIVITY
          ==================================================== */}

          <div
            className="
              rounded-[24px]
              border
              border-slate-200
              bg-white
              shadow-sm
              dark:border-white/10
              dark:bg-slate-900
            "
          >
            <div
              className="
                flex
                flex-col
                gap-4
                border-b
                border-slate-100
                px-5
                py-5
                sm:flex-row
                sm:items-center
                sm:justify-between
                dark:border-white/5
              "
            >
              <div>
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-sm
                    font-black
                    text-slate-900
                    dark:text-white
                  "
                >
                  <TrendingUp
                    size={17}
                    className="text-emerald-600"
                  />
                  Latest community activity
                </div>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-400
                  "
                >
                  Recent conversations across
                  the ecosystem.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("community-feed")
                }
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-1.5
                  text-xs
                  font-bold
                  text-emerald-600
                  transition
                  hover:text-emerald-700
                  dark:text-emerald-400
                "
              >
                View feed
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="p-5">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="
                        animate-pulse
                        rounded-2xl
                        border
                        border-slate-100
                        p-4
                        dark:border-white/5
                      "
                    >
                      <div
                        className="
                          h-4
                          w-1/3
                          rounded
                          bg-slate-100
                          dark:bg-slate-800
                        "
                      />

                      <div
                        className="
                          mt-3
                          h-3
                          w-4/5
                          rounded
                          bg-slate-100
                          dark:bg-slate-800
                        "
                      />

                      <div
                        className="
                          mt-2
                          h-3
                          w-2/3
                          rounded
                          bg-slate-100
                          dark:bg-slate-800
                        "
                      />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div
                  className="
                    rounded-2xl
                    border
                    border-red-100
                    bg-red-50
                    p-5
                    dark:border-red-500/10
                    dark:bg-red-950/20
                  "
                >
                  <div
                    className="
                      flex
                      items-start
                      gap-3
                    "
                  >
                    <HelpCircle
                      size={18}
                      className="
                        mt-0.5
                        shrink-0
                        text-red-500
                      "
                    />

                    <div className="min-w-0">
                      <p
                        className="
                          text-sm
                          font-bold
                          text-red-700
                          dark:text-red-400
                        "
                      >
                        Community feed unavailable
                      </p>

                      <p
                        className="
                          mt-1
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
                          loadCommunity()
                        }
                        className="
                          mt-3
                          inline-flex
                          items-center
                          gap-2
                          rounded-lg
                          border
                          border-red-200
                          bg-white
                          px-3
                          py-2
                          text-xs
                          font-bold
                          text-red-600
                          dark:border-red-500/20
                          dark:bg-red-950/20
                          dark:text-red-400
                        "
                      >
                        <RefreshCw size={14} />
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              ) : recentPosts.length === 0 ? (
                <div
                  className="
                    flex
                    min-h-[260px]
                    flex-col
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-dashed
                    border-slate-200
                    px-6
                    text-center
                    dark:border-white/10
                  "
                >
                  <div
                    className="
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
                    <MessageCircle size={23} />
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
                    Your community is waiting
                  </h3>

                  <p
                    className="
                      mt-1
                      max-w-sm
                      text-xs
                      leading-5
                      text-slate-400
                    "
                  >
                    Start a conversation and give
                    other Jumuiya members something
                    useful to engage with.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("community-composer")
                    }
                    className="
                      mt-4
                      inline-flex
                      items-center
                      gap-2
                      rounded-xl
                      bg-emerald-600
                      px-4
                      py-2.5
                      text-xs
                      font-bold
                      text-white
                      transition
                      hover:bg-emerald-700
                    "
                  >
                    <Plus size={15} />
                    Create first post
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPosts.map((post) => {
                    const postId = getPostId(post);
                    const title = getPostTitle(post);
                    const body = getPostBody(post);
                    const author =
                      getPostAuthor(post);
                    const hub = getPostHub(post);

                    return (
                      <article
                        key={
                          postId ||
                          `${title}-${author}`
                        }
                        className="
                          rounded-2xl
                          border
                          border-slate-100
                          bg-slate-50/60
                          p-4
                          transition
                          hover:border-emerald-100
                          hover:bg-white
                          dark:border-white/5
                          dark:bg-white/[0.025]
                          dark:hover:bg-white/[0.04]
                        "
                      >
                        <div className="flex gap-3">
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
                            {getInitials(author)}
                          </div>

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
                                  text-xs
                                  font-bold
                                  text-slate-800
                                  dark:text-slate-100
                                "
                              >
                                {author}
                              </span>

                              <span
                                className="
                                  text-[10px]
                                  text-slate-400
                                "
                              >
                                ·
                              </span>

                              <span
                                className="
                                  text-[10px]
                                  font-semibold
                                  text-emerald-600
                                  dark:text-emerald-400
                                "
                              >
                                {hub}
                              </span>

                              <span
                                className="
                                  text-[10px]
                                  text-slate-400
                                "
                              >
                                ·
                              </span>

                              <span
                                className="
                                  text-[10px]
                                  text-slate-400
                                "
                              >
                                {formatTime(
                                  post?.created_at ||
                                    post?.createdAt ||
                                    post?.timestamp
                                )}
                              </span>
                            </div>

                            <h3
                              className="
                                mt-2
                                line-clamp-2
                                text-sm
                                font-black
                                text-slate-900
                                dark:text-white
                              "
                            >
                              {title}
                            </h3>

                            {body && (
                              <p
                                className="
                                  mt-1.5
                                  line-clamp-2
                                  text-xs
                                  leading-5
                                  text-slate-500
                                  dark:text-slate-400
                                "
                              >
                                {body}
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `community-post-${postId}`
                                )
                              }
                              className="
                                mt-3
                                inline-flex
                                items-center
                                gap-1
                                text-[11px]
                                font-bold
                                text-emerald-600
                                hover:text-emerald-700
                                dark:text-emerald-400
                              "
                            >
                              Open discussion
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ====================================================
              RIGHT COLUMN
          ==================================================== */}

          <div className="space-y-6">

            {/* QUICK ACCESS */}

            <div
              className="
                rounded-[24px]
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
                dark:border-white/10
                dark:bg-slate-900
              "
            >
              <div>
                <div
                  className="
                    text-sm
                    font-black
                    text-slate-900
                    dark:text-white
                  "
                >
                  Quick access
                </div>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-400
                  "
                >
                  Jump directly into Community.
                </p>
              </div>

              <div className="mt-4 space-y-2">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.key}
                      type="button"
                      onClick={() =>
                        navigate(
                          `community-${action.key}`
                        )
                      }
                      className="
                        group
                        flex
                        w-full
                        items-center
                        gap-3
                        rounded-xl
                        border
                        border-slate-100
                        p-3
                        text-left
                        transition
                        hover:border-emerald-100
                        hover:bg-emerald-50/50
                        dark:border-white/5
                        dark:hover:bg-emerald-950/10
                      "
                    >
                      <div
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-slate-100
                          text-slate-600
                          transition
                          group-hover:bg-emerald-100
                          group-hover:text-emerald-700
                          dark:bg-slate-800
                          dark:text-slate-300
                          dark:group-hover:bg-emerald-950/40
                          dark:group-hover:text-emerald-400
                        "
                      >
                        <Icon size={17} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div
                          className="
                            text-xs
                            font-bold
                            text-slate-800
                            dark:text-slate-100
                          "
                        >
                          {action.label}
                        </div>

                        <div
                          className="
                            mt-0.5
                            text-[10px]
                            text-slate-400
                          "
                        >
                          {action.description}
                        </div>
                      </div>

                      <ChevronRight
                        size={15}
                        className="
                          shrink-0
                          text-slate-300
                          transition
                          group-hover:translate-x-0.5
                          group-hover:text-emerald-500
                        "
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COMMUNITY IDENTITY */}

            <div
              className="
                rounded-[24px]
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
                dark:border-white/10
                dark:bg-slate-900
              "
            >
              <div
                className="
                  flex
                  items-start
                  gap-3
                "
              >
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
                    text-sm
                    font-black
                    text-emerald-700
                    dark:bg-emerald-950/40
                    dark:text-emerald-400
                  "
                >
                  {initials}
                </div>

                <div className="min-w-0">
                  <div
                    className="
                      text-sm
                      font-black
                      text-slate-900
                      dark:text-white
                    "
                  >
                    {displayName}
                  </div>

                  <div
                    className="
                      mt-0.5
                      text-xs
                      text-slate-400
                    "
                  >
                    Jumuiya Community Member
                  </div>
                </div>
              </div>

              <div
                className="
                  mt-5
                  grid
                  grid-cols-2
                  gap-2
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    navigate("community-activity")
                  }
                  className="
                    rounded-xl
                    border
                    border-slate-100
                    px-3
                    py-3
                    text-left
                    transition
                    hover:border-emerald-100
                    hover:bg-emerald-50/50
                    dark:border-white/5
                    dark:hover:bg-emerald-950/10
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <Heart
                      size={14}
                      className="text-rose-500"
                    />

                    <span
                      className="
                        text-[11px]
                        font-bold
                        text-slate-700
                        dark:text-slate-200
                      "
                    >
                      Activity
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "community-notifications"
                    )
                  }
                  className="
                    rounded-xl
                    border
                    border-slate-100
                    px-3
                    py-3
                    text-left
                    transition
                    hover:border-emerald-100
                    hover:bg-emerald-50/50
                    dark:border-white/5
                    dark:hover:bg-emerald-950/10
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <Bell
                      size={14}
                      className="text-amber-500"
                    />

                    <span
                      className="
                        text-[11px]
                        font-bold
                        text-slate-700
                        dark:text-slate-200
                      "
                    >
                      Notifications
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            ECOSYSTEM CONNECTION
        ====================================================== */}

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
          "
        >
          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  font-black
                  text-slate-900
                  dark:text-white
                "
              >
                <Search
                  size={17}
                  className="text-emerald-600"
                />
                Explore the Jumuiya ecosystem
              </div>

              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-slate-400
                "
              >
                Community connects conversations
                across Biashara, Shamba and Elimu.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("community-discover")
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-slate-200
                px-4
                py-2.5
                text-xs
                font-bold
                text-slate-700
                transition
                hover:bg-slate-50
                dark:border-white/10
                dark:text-slate-200
                dark:hover:bg-white/5
              "
            >
              Discover
              <ChevronRight size={15} />
            </button>
          </div>

          <div
            className="
              mt-5
              grid
              gap-3
              sm:grid-cols-3
            "
          >
            {HUBS.slice(1).map((hub) => {
              const Icon = hub.icon;

              return (
                <button
                  key={hub.key}
                  type="button"
                  onClick={() =>
                    navigate(
                      `community-hub-${hub.key}`
                    )
                  }
                  className="
                    group
                    rounded-2xl
                    border
                    border-slate-100
                    bg-slate-50/70
                    p-4
                    text-left
                    transition
                    hover:border-emerald-100
                    hover:bg-white
                    dark:border-white/5
                    dark:bg-white/[0.025]
                    dark:hover:bg-white/[0.04]
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        bg-white
                        text-emerald-600
                        shadow-sm
                        dark:bg-slate-900
                        dark:text-emerald-400
                      "
                    >
                      <Icon size={18} />
                    </div>

                    <ChevronRight
                      size={15}
                      className="
                        text-slate-300
                        transition
                        group-hover:translate-x-0.5
                        dark:text-slate-600
                      "
                    />
                  </div>

                  <div
                    className="
                      mt-4
                      text-sm
                      font-black
                      text-slate-900
                      dark:text-white
                    "
                  >
                    {hub.label}
                  </div>

                  <p
                    className="
                      mt-1
                      text-[11px]
                      leading-5
                      text-slate-400
                    "
                  >
                    {hub.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* ======================================================
            REFRESH
        ====================================================== */}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() =>
              loadCommunity(true)
            }
            disabled={refreshing}
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              px-4
              py-2
              text-xs
              font-semibold
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-600
              disabled:cursor-not-allowed
              disabled:opacity-50
              dark:hover:bg-white/5
              dark:hover:text-slate-200
            "
          >
            <RefreshCw
              size={14}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
            {refreshing
              ? "Refreshing community..."
              : "Refresh community"}
          </button>
        </div>
      </div>
    </JumuiyaDashboardShell>
  );
}
