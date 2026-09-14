import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Briefcase,
  ChevronDown,
  GraduationCap,
  Heart,
  Leaf,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Share2,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";


// =========================================================
// COMMUNITY CONFIGURATION
// =========================================================

const HUBS = [
  {
    key: "",
    label: "All",
    description: "Everything happening across Jumuiya.",
    icon: Users,
  },
  {
    key: "community",
    label: "Community",
    description: "People, conversations and local updates.",
    icon: Users,
  },
  {
    key: "biashara",
    label: "Biashara",
    description: "Business, jobs and opportunities.",
    icon: Briefcase,
  },
  {
    key: "shamba",
    label: "Shamba",
    description: "Farming, produce and agriculture.",
    icon: Leaf,
  },
  {
    key: "elimu",
    label: "Elimu",
    description: "Education, schools and learning.",
    icon: GraduationCap,
  },
];

const CATEGORIES = [
  {
    value: "",
    label: "All categories",
  },
  {
    value: "general",
    label: "General",
  },
  {
    value: "announcement",
    label: "Announcements",
  },
  {
    value: "jobs",
    label: "Jobs",
  },
  {
    value: "lost_found",
    label: "Lost & Found",
  },
  {
    value: "opportunity",
    label: "Opportunities",
  },
];

const POST_CATEGORIES = [
  {
    value: "general",
    label: "General",
  },
  {
    value: "announcement",
    label: "Announcement",
  },
  {
    value: "jobs",
    label: "Jobs",
  },
  {
    value: "lost_found",
    label: "Lost & Found",
  },
  {
    value: "opportunity",
    label: "Opportunity",
  },
];


// =========================================================
// HELPERS
// =========================================================

function getPostId(post) {
  return post?.id || post?._id;
}

function formatCategory(value = "general") {
  return value
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const difference =
    Math.max(0, now.getTime() - date.getTime());

  const minutes = Math.floor(
    difference / 60000
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(
    hours / 24
  );

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year:
        date.getFullYear() !==
        now.getFullYear()
          ? "numeric"
          : undefined,
    }
  );
}


// =========================================================
// COMMUNITY DASHBOARD
// =========================================================

export default function CommunityDashboard({
  onNavigate,
}) {
  const { user } = useAuth();

  const {
    getCommunityFeed,
    createCommunityPost,
    getCommunityComments,
    addCommunityComment,
    reactToCommunityPost,
  } = useJumuiyaApi();

  const [posts, setPosts] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [selectedHub, setSelectedHub] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [showComposer, setShowComposer] =
    useState(false);

  const [postTitle, setPostTitle] =
    useState("");

  const [postBody, setPostBody] =
    useState("");

  const [postCategory, setPostCategory] =
    useState("general");

  const [postHub, setPostHub] =
    useState("community");

  const [postLocation, setPostLocation] =
    useState("");

  const [posting, setPosting] =
    useState(false);

  const [expandedComments, setExpandedComments] =
    useState({});

  const [comments, setComments] =
    useState({});

  const [commentInputs, setCommentInputs] =
    useState({});

  const [commentingPost, setCommentingPost] =
    useState(null);


  // =======================================================
  // LOAD FEED
  // =======================================================

  const loadFeed = async ({
    silent = false,
  } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const result =
        await getCommunityFeed({
          hub: selectedHub,
          category: selectedCategory,
          limit: 50,
        });

      const nextPosts =
        Array.isArray(result)
          ? result
          : result?.posts || [];

      setPosts(
        Array.isArray(nextPosts)
          ? nextPosts
          : []
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load community feed."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    loadFeed();
  }, [
    selectedHub,
    selectedCategory,
  ]);


  // =======================================================
  // DERIVED FEED
  // =======================================================

  const visiblePosts = useMemo(() => {
    const query =
      searchTerm.trim().toLowerCase();

    if (!query) {
      return posts;
    }

    return posts.filter((post) => {
      const searchableText = [
        post?.title,
        post?.body,
        post?.author_name,
        post?.location,
        post?.hub,
        post?.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [
    posts,
    searchTerm,
  ]);


  // =======================================================
  // CREATE POST
  // =======================================================

  const openComposer = () => {
    setError("");
    setShowComposer(true);
  };

  const closeComposer = () => {
    if (posting) {
      return;
    }

    setShowComposer(false);
  };

  const submitPost = async (e) => {
    e.preventDefault();

    if (!postTitle.trim()) {
      setError(
        "Please add a title to your post."
      );
      return;
    }

    if (!postBody.trim()) {
      setError(
        "Please write something before publishing."
      );
      return;
    }

    try {
      setPosting(true);
      setError("");

      await createCommunityPost({
        title: postTitle.trim(),
        body: postBody.trim(),
        category:
          postCategory ||
          "general",
        hub:
          postHub ||
          "community",
        location:
          postLocation.trim(),
      });

      setPostTitle("");
      setPostBody("");
      setPostCategory("general");
      setPostHub("community");
      setPostLocation("");

      setShowComposer(false);

      await loadFeed({
        silent: true,
      });
    } catch (err) {
      setError(
        err?.message ||
          "Unable to publish post."
      );
    } finally {
      setPosting(false);
    }
  };


  // =======================================================
  // COMMENTS
  // =======================================================

  const toggleComments = async (
    postId
  ) => {
    const currentlyOpen =
      expandedComments[postId];

    setExpandedComments((current) => ({
      ...current,
      [postId]: !currentlyOpen,
    }));

    if (
      !currentlyOpen &&
      !comments[postId]
    ) {
      try {
        setCommentingPost(postId);

        const result =
          await getCommunityComments(
            postId
          );

        setComments((current) => ({
          ...current,
          [postId]: Array.isArray(result)
            ? result
            : result?.comments || [],
        }));
      } catch (err) {
        setError(
          err?.message ||
            "Unable to load comments."
        );
      } finally {
        setCommentingPost(null);
      }
    }
  };


  const submitComment = async (
    postId
  ) => {
    const body =
      commentInputs[postId]
        ?.trim();

    if (!body) {
      return;
    }

    try {
      setCommentingPost(postId);
      setError("");

      await addCommunityComment(
        postId,
        body
      );

      setCommentInputs(
        (current) => ({
          ...current,
          [postId]: "",
        })
      );

      const result =
        await getCommunityComments(
          postId
        );

      const nextComments =
        Array.isArray(result)
          ? result
          : result?.comments || [];

      setComments(
        (current) => ({
          ...current,
          [postId]: nextComments,
        })
      );

      setPosts(
        (current) =>
          current.map((post) =>
            String(
              getPostId(post)
            ) === String(postId)
              ? {
                  ...post,
                  comments_count:
                    Number(
                      post.comments_count ||
                        0
                    ) + 1,
                }
              : post
          )
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to add comment."
      );
    } finally {
      setCommentingPost(null);
    }
  };


  // =======================================================
  // REACTION
  // =======================================================

  const react = async (
    postId
  ) => {
    try {
      setError("");

      const result =
        await reactToCommunityPost(
          postId
        );

      setPosts(
        (current) =>
          current.map((post) =>
            String(
              getPostId(post)
            ) === String(postId)
              ? {
                  ...post,
                  likes_count:
                    result?.likes_count ??
                    post.likes_count,
                  liked:
                    result?.liked ??
                    !post.liked,
                }
              : post
          )
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to react to post."
      );
    }
  };


  // =======================================================
  // HUB SHORTCUT
  // =======================================================

  const selectHub = (hub) => {
    setSelectedHub(hub);
    setSearchTerm("");
  };


  // =======================================================
  // USER DISPLAY
  // =======================================================

  const userName =
    user?.name ||
    user?.full_name ||
    user?.username ||
    "Jumuiya Member";

  const userInitial =
    userName
      .toString()
      .charAt(0)
      .toUpperCase();


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <JumuiyaDashboardShell
      title="Community"
      subtitle="Connect with people across the Jumuiya ecosystem."
      activeHub="community"
      user={user}
      onNavigate={onNavigate}
    >
      <div className="space-y-5">

        {/* =================================================
            COMMUNITY HERO
        ================================================= */}

        <section
          className="
            relative
            overflow-hidden
            rounded-3xl
            bg-slate-950
            px-5
            py-7
            text-white
            shadow-xl
            sm:px-7
            sm:py-8
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-24
              h-64
              w-64
              rounded-full
              bg-emerald-500/20
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-32
              left-1/3
              h-64
              w-64
              rounded-full
              bg-cyan-500/10
              blur-3xl
            "
          />

          <div
            className="
              relative
              flex
              flex-col
              gap-7
              lg:flex-row
              lg:items-end
              lg:justify-between
            "
          >
            <div className="max-w-3xl">
              <div
                className="
                  mb-4
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/10
                  bg-white/10
                  px-3
                  py-1.5
                  text-xs
                  font-semibold
                  text-emerald-200
                  backdrop-blur
                "
              >
                <Sparkles size={14} />
                Jumuiya Community
              </div>

              <h2
                className="
                  text-3xl
                  font-bold
                  tracking-tight
                  sm:text-4xl
                "
              >
                Connect.
                <span className="text-emerald-400">
                  {" "}
                  Discover.
                </span>
                <br />
                Grow together.
              </h2>

              <p
                className="
                  mt-3
                  max-w-2xl
                  text-sm
                  leading-6
                  text-slate-300
                  sm:text-base
                "
              >
                One communication space for
                people, businesses, farmers,
                schools and communities across
                the Jumuiya ecosystem.
              </p>
            </div>

            <button
              type="button"
              onClick={openComposer}
              className="
                relative
                inline-flex
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-emerald-600
                px-5
                py-3
                text-sm
                font-semibold
                text-white
                shadow-lg
                shadow-emerald-950/30
                transition
                hover:bg-emerald-500
                active:scale-[0.98]
              "
            >
              <Plus size={18} />
              Create post
            </button>
          </div>

          {/* ---------------------------------------------
              LIVE DASHBOARD METRICS
          --------------------------------------------- */}

          <div
            className="
              relative
              mt-7
              grid
              grid-cols-2
              gap-3
              border-t
              border-white/10
              pt-5
              sm:grid-cols-4
            "
          >
            <div>
              <div
                className="
                  text-lg
                  font-bold
                "
              >
                {posts.length}
              </div>

              <div
                className="
                  mt-0.5
                  text-[11px]
                  text-slate-400
                "
              >
                Loaded posts
              </div>
            </div>

            <div>
              <div
                className="
                  text-lg
                  font-bold
                "
              >
                {posts.filter(
                  (post) =>
                    post.hub ===
                    "biashara"
                ).length}
              </div>

              <div
                className="
                  mt-0.5
                  text-[11px]
                  text-slate-400
                "
              >
                Business posts
              </div>
            </div>

            <div>
              <div
                className="
                  text-lg
                  font-bold
                "
              >
                {posts.filter(
                  (post) =>
                    post.hub ===
                    "shamba"
                ).length}
              </div>

              <div
                className="
                  mt-0.5
                  text-[11px]
                  text-slate-400
                "
              >
                Farming posts
              </div>
            </div>

            <div>
              <div
                className="
                  text-lg
                  font-bold
                "
              >
                {posts.filter(
                  (post) =>
                    post.hub ===
                    "elimu"
                ).length}
              </div>

              <div
                className="
                  mt-0.5
                  text-[11px]
                  text-slate-400
                "
              >
                Education posts
              </div>
            </div>
          </div>
        </section>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            className="
              flex
              items-start
              justify-between
              gap-3
              rounded-2xl
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-sm
              text-red-700
              dark:border-red-900/40
              dark:bg-red-950/20
              dark:text-red-300
            "
          >
            <div>
              <div className="font-semibold">
                Community update
              </div>

              <div className="mt-0.5">
                {error}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="
                rounded-lg
                p-1
                hover:bg-red-100
                dark:hover:bg-red-900/20
              "
            >
              <X size={17} />
            </button>
          </div>
        )}


        {/* =================================================
            SEARCH + QUICK ACTIONS
        ================================================= */}

        <section
          className="
            rounded-2xl
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
            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="
                  pointer-events-none
                  absolute
                  left-3.5
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                placeholder="Search posts, people, opportunities..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  py-3
                  pl-10
                  pr-4
                  text-sm
                  outline-none
                  transition
                  focus:border-emerald-500
                  focus:bg-white
                  dark:border-white/10
                  dark:bg-slate-950
                  dark:focus:bg-slate-950
                "
              />
            </div>

            <button
              type="button"
              onClick={() =>
                loadFeed({
                  silent: true,
                })
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
                text-slate-700
                transition
                hover:bg-slate-50
                disabled:opacity-60
                dark:border-white/10
                dark:text-slate-200
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

          {/* ---------------------------------------------
              HUB FILTERS
          --------------------------------------------- */}

          <div
            className="
              mt-4
              flex
              gap-2
              overflow-x-auto
              pb-1
            "
          >
            {HUBS.map((hub) => {
              const Icon =
                hub.icon;

              const active =
                selectedHub ===
                hub.key;

              return (
                <button
                  key={hub.key || "all"}
                  type="button"
                  onClick={() =>
                    selectHub(
                      hub.key
                    )
                  }
                  className={`
                    inline-flex
                    shrink-0
                    items-center
                    gap-2
                    rounded-xl
                    px-3.5
                    py-2.5
                    text-xs
                    font-semibold
                    transition
                    ${
                      active
                        ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                    }
                  `}
                >
                  <Icon size={15} />

                  {hub.label}
                </button>
              );
            })}
          </div>

          {/* ---------------------------------------------
              CATEGORY FILTER
          --------------------------------------------- */}

          <div
            className="
              mt-3
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div
              className="
                text-xs
                text-slate-400
              "
            >
              {selectedHub
                ? `Showing ${selectedHub} conversations`
                : "Showing conversations across all hubs"}
            </div>

            <div className="relative sm:w-52">
              <select
                value={
                  selectedCategory
                }
                onChange={(e) =>
                  setSelectedCategory(
                    e.target.value
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
                  py-2.5
                  pr-9
                  text-xs
                  font-medium
                  outline-none
                  focus:border-emerald-500
                  dark:border-white/10
                  dark:bg-slate-950
                "
              >
                {CATEGORIES.map(
                  (category) => (
                    <option
                      key={
                        category.value ||
                        "all"
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
        </section>


        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <section>
          <div
            className="
              mb-3
              flex
              items-center
              justify-between
            "
          >
            <div>
              <h3 className="text-sm font-bold">
                Quick actions
              </h3>

              <p
                className="
                  mt-0.5
                  text-xs
                  text-slate-400
                "
              >
                Jump into the part of Jumuiya
                you need.
              </p>
            </div>
          </div>

          <div
            className="
              grid
              grid-cols-2
              gap-3
              lg:grid-cols-4
            "
          >
            <button
              type="button"
              onClick={openComposer}
              className="
                group
                rounded-2xl
                border
                border-emerald-200
                bg-emerald-50
                p-4
                text-left
                transition
                hover:-translate-y-0.5
                hover:shadow-md
                dark:border-emerald-900/40
                dark:bg-emerald-950/20
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
                  bg-emerald-600
                  text-white
                "
              >
                <Plus size={19} />
              </div>

              <div
                className="
                  mt-3
                  text-sm
                  font-bold
                "
              >
                Create post
              </div>

              <div
                className="
                  mt-1
                  text-[11px]
                  leading-4
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Start a conversation.
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                selectHub("biashara")
              }
              className="
                group
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-4
                text-left
                transition
                hover:-translate-y-0.5
                hover:shadow-md
                dark:border-white/10
                dark:bg-slate-900
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
                  bg-blue-100
                  text-blue-700
                  dark:bg-blue-950/30
                  dark:text-blue-300
                "
              >
                <Briefcase
                  size={19}
                />
              </div>

              <div
                className="
                  mt-3
                  text-sm
                  font-bold
                "
              >
                Business
              </div>

              <div
                className="
                  mt-1
                  text-[11px]
                  leading-4
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Discover business
                conversations.
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                selectHub("shamba")
              }
              className="
                group
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-4
                text-left
                transition
                hover:-translate-y-0.5
                hover:shadow-md
                dark:border-white/10
                dark:bg-slate-900
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
                  bg-green-100
                  text-green-700
                  dark:bg-green-950/30
                  dark:text-green-300
                "
              >
                <Leaf size={19} />
              </div>

              <div
                className="
                  mt-3
                  text-sm
                  font-bold
                "
              >
                Shamba
              </div>

              <div
                className="
                  mt-1
                  text-[11px]
                  leading-4
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Farming and local
                agriculture.
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                selectHub("elimu")
              }
              className="
                group
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-4
                text-left
                transition
                hover:-translate-y-0.5
                hover:shadow-md
                dark:border-white/10
                dark:bg-slate-900
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
                  bg-purple-100
                  text-purple-700
                  dark:bg-purple-950/30
                  dark:text-purple-300
                "
              >
                <GraduationCap
                  size={19}
                />
              </div>

              <div
                className="
                  mt-3
                  text-sm
                  font-bold
                "
              >
                Elimu
              </div>

              <div
                className="
                  mt-1
                  text-[11px]
                  leading-4
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Education and school
                conversations.
              </div>
            </button>
          </div>
        </section>


        {/* =================================================
            CREATE POST
        ================================================= */}

        {showComposer && (
          <section
            className="
              overflow-hidden
              rounded-2xl
              border
              border-emerald-200
              bg-white
              shadow-lg
              dark:border-emerald-900/40
              dark:bg-slate-900
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-4
                border-b
                border-slate-100
                px-5
                py-4
                dark:border-white/5
              "
            >
              <div>
                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <Sparkles
                    size={16}
                    className="text-emerald-500"
                  />

                  <h3
                    className="
                      font-bold
                    "
                  >
                    Create something useful
                  </h3>
                </div>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-400
                  "
                >
                  Share an idea, announcement,
                  opportunity or update with
                  Jumuiya.
                </p>
              </div>

              <button
                type="button"
                onClick={closeComposer}
                className="
                  rounded-xl
                  p-2
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-700
                  dark:hover:bg-white/5
                  dark:hover:text-white
                "
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={submitPost}
              className="space-y-4 p-5"
            >
              <input
                value={postTitle}
                onChange={(e) =>
                  setPostTitle(
                    e.target.value
                  )
                }
                placeholder="Give your post a clear title"
                maxLength={180}
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  px-4
                  py-3
                  text-sm
                  outline-none
                  transition
                  focus:border-emerald-500
                  focus:bg-white
                  dark:border-white/10
                  dark:bg-slate-950
                "
              />

              <textarea
                value={postBody}
                onChange={(e) =>
                  setPostBody(
                    e.target.value
                  )
                }
                placeholder="What would you like the community to know?"
                rows={5}
                maxLength={10000}
                className="
                  w-full
                  resize-none
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  px-4
                  py-3
                  text-sm
                  leading-6
                  outline-none
                  transition
                  focus:border-emerald-500
                  focus:bg-white
                  dark:border-white/10
                  dark:bg-slate-950
                "
              />

              <div
                className="
                  grid
                  gap-3
                  sm:grid-cols-3
                "
              >
                <div>
                  <label
                    className="
                      mb-1.5
                      block
                      text-[11px]
                      font-semibold
                      text-slate-500
                    "
                  >
                    Post type
                  </label>

                  <select
                    value={
                      postCategory
                    }
                    onChange={(e) =>
                      setPostCategory(
                        e.target.value
                      )
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-3
                      py-3
                      text-sm
                      dark:border-white/10
                      dark:bg-slate-950
                    "
                  >
                    {POST_CATEGORIES.map(
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
                </div>

                <div>
                  <label
                    className="
                      mb-1.5
                      block
                      text-[11px]
                      font-semibold
                      text-slate-500
                    "
                  >
                    Publish to
                  </label>

                  <select
                    value={postHub}
                    onChange={(e) =>
                      setPostHub(
                        e.target.value
                      )
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-3
                      py-3
                      text-sm
                      dark:border-white/10
                      dark:bg-slate-950
                    "
                  >
                    <option value="community">
                      Community
                    </option>
                    <option value="biashara">
                      Biashara
                    </option>
                    <option value="shamba">
                      Shamba
                    </option>
                    <option value="elimu">
                      Elimu
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    className="
                      mb-1.5
                      block
                      text-[11px]
                      font-semibold
                      text-slate-500
                    "
                  >
                    Location
                  </label>

                  <input
                    value={
                      postLocation
                    }
                    onChange={(e) =>
                      setPostLocation(
                        e.target.value
                      )
                    }
                    placeholder="e.g. Mombasa"
                    maxLength={160}
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-3
                      py-3
                      text-sm
                      outline-none
                      focus:border-emerald-500
                      dark:border-white/10
                      dark:bg-slate-950
                    "
                  />
                </div>
              </div>

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
                <div
                  className="
                    text-[11px]
                    text-slate-400
                  "
                >
                  Keep your post useful,
                  respectful and community-focused.
                </div>

                <button
                  type="submit"
                  disabled={posting}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-emerald-600
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    shadow-sm
                    transition
                    hover:bg-emerald-700
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  <Send size={16} />

                  {posting
                    ? "Publishing..."
                    : "Publish post"}
                </button>
              </div>
            </form>
          </section>
        )}


        {/* =================================================
            FEED HEADER
        ================================================= */}

        <section
          className="
            flex
            flex-col
            gap-2
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div>
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <h3
                className="
                  text-lg
                  font-bold
                "
              >
                Community feed
              </h3>

              <span
                className="
                  rounded-full
                  bg-slate-100
                  px-2
                  py-0.5
                  text-[10px]
                  font-bold
                  text-slate-500
                  dark:bg-white/5
                  dark:text-slate-400
                "
              >
                {visiblePosts.length}
              </span>
            </div>

            <p
              className="
                mt-1
                text-xs
                text-slate-400
              "
            >
              The latest conversations and
              updates from Jumuiya.
            </p>
          </div>

          {(selectedHub ||
            selectedCategory ||
            searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setSelectedHub("");
                setSelectedCategory("");
                setSearchTerm("");
              }}
              className="
                self-start
                rounded-lg
                px-2
                py-1
                text-xs
                font-semibold
                text-emerald-600
                hover:bg-emerald-50
                sm:self-auto
                dark:hover:bg-emerald-950/20
              "
            >
              Clear filters
            </button>
          )}
        </section>


        {/* =================================================
            FEED
        ================================================= */}

        <section>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="
                      overflow-hidden
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      p-5
                      dark:border-white/10
                      dark:bg-slate-900
                    "
                  >
                    <div
                      className="
                        animate-pulse
                        space-y-4
                      "
                    >
                      <div className="flex gap-3">
                        <div
                          className="
                            h-10
                            w-10
                            rounded-full
                            bg-slate-200
                            dark:bg-slate-800
                          "
                        />

                        <div className="flex-1">
                          <div
                            className="
                              h-3
                              w-32
                              rounded
                              bg-slate-200
                              dark:bg-slate-800
                            "
                          />

                          <div
                            className="
                              mt-2
                              h-2
                              w-24
                              rounded
                              bg-slate-200
                              dark:bg-slate-800
                            "
                          />
                        </div>
                      </div>

                      <div
                        className="
                          h-5
                          w-2/3
                          rounded
                          bg-slate-200
                          dark:bg-slate-800
                        "
                      />

                      <div
                        className="
                          h-20
                          rounded
                          bg-slate-200
                          dark:bg-slate-800
                        "
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : visiblePosts.length === 0 ? (
            <div
              className="
                rounded-2xl
                border
                border-dashed
                border-slate-300
                bg-white
                px-6
                py-12
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
                <Users size={25} />
              </div>

              <h3
                className="
                  mt-4
                  font-bold
                "
              >
                No conversations found
              </h3>

              <p
                className="
                  mx-auto
                  mt-1
                  max-w-md
                  text-sm
                  leading-6
                  text-slate-400
                "
              >
                {searchTerm
                  ? "Try a different search term or clear your filters."
                  : "Be one of the first people to start a useful conversation in the Jumuiya community."}
              </p>

              <button
                type="button"
                onClick={openComposer}
                className="
                  mt-5
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-emerald-600
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-emerald-700
                "
              >
                <Plus size={16} />
                Create first post
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {visiblePosts.map(
                (post) => {
                  const postId =
                    getPostId(post);

                  const postComments =
                    comments[
                      postId
                    ] || [];

                  const authorName =
                    post.author_name ||
                    "Jumuiya member";

                  const authorInitial =
                    authorName
                      .toString()
                      .charAt(0)
                      .toUpperCase();

                  const hub =
                    post.hub ||
                    "community";

                  return (
                    <article
                      key={postId}
                      className="
                        overflow-hidden
                        rounded-2xl
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
                      {/* ---------------------------------
                          POST HEADER
                      --------------------------------- */}

                      <div
                        className="
                          flex
                          items-start
                          justify-between
                          gap-4
                          px-5
                          pt-5
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
                              font-bold
                              text-emerald-700
                              ring-4
                              ring-emerald-50
                              dark:bg-emerald-950/40
                              dark:text-emerald-400
                              dark:ring-emerald-950/20
                            "
                          >
                            {authorInitial}
                          </div>

                          <div className="min-w-0">
                            <div
                              className="
                                truncate
                                text-sm
                                font-bold
                              "
                            >
                              {authorName}
                            </div>

                            <div
                              className="
                                mt-0.5
                                flex
                                flex-wrap
                                items-center
                                gap-1.5
                                text-[11px]
                                text-slate-400
                              "
                            >
                              <span
                                className="
                                  font-medium
                                  text-emerald-600
                                  dark:text-emerald-400
                                "
                              >
                                {formatCategory(
                                  hub
                                )}
                              </span>

                              {post.location && (
                                <>
                                  <span>
                                    •
                                  </span>

                                  <span>
                                    {
                                      post.location
                                    }
                                  </span>
                                </>
                              )}

                              {post.created_at && (
                                <>
                                  <span>
                                    •
                                  </span>

                                  <span>
                                    {formatTime(
                                      post.created_at
                                    )}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <span
                          className="
                            shrink-0
                            rounded-full
                            bg-slate-100
                            px-2.5
                            py-1
                            text-[10px]
                            font-bold
                            text-slate-500
                            dark:bg-white/5
                            dark:text-slate-400
                          "
                        >
                          {formatCategory(
                            post.category ||
                              "general"
                          )}
                        </span>
                      </div>


                      {/* ---------------------------------
                          POST CONTENT
                      --------------------------------- */}

                      <div className="px-5 pt-4">
                        <h3
                          className="
                            text-lg
                            font-bold
                            tracking-tight
                          "
                        >
                          {post.title}
                        </h3>

                        <p
                          className="
                            mt-2
                            whitespace-pre-wrap
                            text-sm
                            leading-6
                            text-slate-600
                            dark:text-slate-300
                          "
                        >
                          {post.body}
                        </p>
                      </div>


                      {/* ---------------------------------
                          POST ACTIONS
                      --------------------------------- */}

                      <div
                        className="
                          mt-5
                          flex
                          items-center
                          gap-1
                          border-t
                          border-slate-100
                          px-4
                          py-3
                          dark:border-white/5
                        "
                      >
                        <button
                          type="button"
                          onClick={() =>
                            react(
                              postId
                            )
                          }
                          className={`
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            px-3
                            py-2
                            text-xs
                            font-semibold
                            transition
                            ${
                              post.liked
                                ? "text-red-500"
                                : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
                            }
                          `}
                        >
                          <Heart
                            size={17}
                            className={
                              post.liked
                                ? "fill-current"
                                : ""
                            }
                          />

                          <span>
                            {Number(
                              post.likes_count ||
                                0
                            )}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleComments(
                              postId
                            )
                          }
                          className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            px-3
                            py-2
                            text-xs
                            font-semibold
                            text-slate-500
                            transition
                            hover:bg-slate-100
                            dark:text-slate-400
                            dark:hover:bg-white/5
                          "
                        >
                          <MessageCircle
                            size={17}
                          />

                          <span>
                            {Number(
                              post.comments_count ||
                                0
                            )}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setError(
                              "Sharing will be connected to the Jumuiya sharing system in the next communication upgrade."
                            )
                          }
                          className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            px-3
                            py-2
                            text-xs
                            font-semibold
                            text-slate-500
                            transition
                            hover:bg-slate-100
                            dark:text-slate-400
                            dark:hover:bg-white/5
                          "
                        >
                          <Share2
                            size={17}
                          />

                          <span className="hidden sm:inline">
                            Share
                          </span>
                        </button>
                      </div>


                      {/* ---------------------------------
                          COMMENTS
                      --------------------------------- */}

                      {expandedComments[
                        postId
                      ] && (
                        <div
                          className="
                            border-t
                            border-slate-100
                            bg-slate-50
                            p-4
                            dark:border-white/5
                            dark:bg-white/[0.025]
                          "
                        >
                          {postComments.length >
                          0 ? (
                            <div className="space-y-3">
                              {postComments.map(
                                (
                                  comment
                                ) => (
                                  <div
                                    key={
                                      comment.id ||
                                      comment._id
                                    }
                                    className="
                                      rounded-xl
                                      border
                                      border-slate-100
                                      bg-white
                                      p-3
                                      dark:border-white/5
                                      dark:bg-slate-900
                                    "
                                  >
                                    <div
                                      className="
                                        flex
                                        items-center
                                        gap-2
                                      "
                                    >
                                      <div
                                        className="
                                          flex
                                          h-7
                                          w-7
                                          items-center
                                          justify-center
                                          rounded-full
                                          bg-slate-100
                                          text-[10px]
                                          font-bold
                                          text-slate-500
                                          dark:bg-white/5
                                        "
                                      >
                                        {(
                                          comment.author_name ||
                                          "M"
                                        )
                                          .toString()
                                          .charAt(
                                            0
                                          )
                                          .toUpperCase()}
                                      </div>

                                      <div
                                        className="
                                          text-xs
                                          font-bold
                                        "
                                      >
                                        {comment.author_name ||
                                          "Member"}
                                      </div>
                                    </div>

                                    <div
                                      className="
                                        mt-2
                                        pl-9
                                        text-sm
                                        leading-5
                                        text-slate-600
                                        dark:text-slate-300
                                      "
                                    >
                                      {
                                        comment.body
                                      }
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <div
                              className="
                                rounded-xl
                                border
                                border-dashed
                                border-slate-200
                                p-4
                                text-center
                                text-xs
                                text-slate-400
                                dark:border-white/10
                              "
                            >
                              No comments yet.
                              Start the
                              conversation.
                            </div>
                          )}

                          <div
                            className="
                              mt-3
                              flex
                              gap-2
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
                                rounded-full
                                bg-emerald-100
                                text-xs
                                font-bold
                                text-emerald-700
                                dark:bg-emerald-950/40
                                dark:text-emerald-400
                              "
                            >
                              {userInitial}
                            </div>

                            <input
                              value={
                                commentInputs[
                                  postId
                                ] || ""
                              }
                              onChange={(e) =>
                                setCommentInputs(
                                  (current) => ({
                                    ...current,
                                    [postId]:
                                      e.target.value,
                                  })
                                )
                              }
                              onKeyDown={(e) => {
                                if (
                                  e.key ===
                                    "Enter" &&
                                  !e.shiftKey
                                ) {
                                  e.preventDefault();

                                  submitComment(
                                    postId
                                  );
                                }
                              }}
                              placeholder="Write a comment..."
                              className="
                                min-w-0
                                flex-1
                                rounded-xl
                                border
                                border-slate-200
                                bg-white
                                px-3
                                py-2.5
                                text-sm
                                outline-none
                                focus:border-emerald-500
                                dark:border-white/10
                                dark:bg-slate-950
                              "
                            />

                            <button
                              type="button"
                              onClick={() =>
                                submitComment(
                                  postId
                                )
                              }
                              disabled={
                                commentingPost ===
                                postId
                              }
                              className="
                                inline-flex
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                bg-emerald-600
                                px-3
                                text-white
                                transition
                                hover:bg-emerald-700
                                disabled:opacity-60
                              "
                            >
                              <Send
                                size={16}
                              />
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>


        {/* =================================================
            COMMUNITY MISSION
        ================================================= */}

        <section
          className="
            overflow-hidden
            rounded-2xl
            border
            border-emerald-100
            bg-emerald-50
            p-5
            dark:border-emerald-900/40
            dark:bg-emerald-950/20
          "
        >
          <div
            className="
              flex
              flex-col
              gap-4
              sm:flex-row
              sm:items-center
              sm:justify-between
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
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-emerald-600
                  text-white
                "
              >
                <Bell size={18} />
              </div>

              <div>
                <div
                  className="
                    font-bold
                  "
                >
                  One community across all hubs.
                </div>

                <p
                  className="
                    mt-1
                    max-w-2xl
                    text-xs
                    leading-5
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Business opportunities,
                  farming updates, education
                  announcements and local
                  conversations can meet here —
                  without leaving Jumuiya.
                </p>
              </div>
            </div>

            <div
              className="
                inline-flex
                shrink-0
                items-center
                gap-2
                text-xs
                font-semibold
                text-emerald-700
                dark:text-emerald-400
              "
            >
              <span
                className="
                  h-2
                  w-2
                  rounded-full
                  bg-emerald-500
                "
              />

              Jumuiya connected
            </div>
          </div>
        </section>
      </div>
    </JumuiyaDashboardShell>
  );
}

