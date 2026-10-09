// src/Dashboard/CommunityDashboard.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowRight,
  Compass,
  GraduationCap,
  Leaf,
  MapPin,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

import CommunityFeed from "@/Dashboard/Community/CommunityFeed.jsx";
import CommunityComposer from "@/Dashboard/Community/CommunityComposer.jsx";
import CommunityNotifications from "@/Dashboard/Community/CommunityNotifications.jsx";
import CommunityPostCard from "@/Dashboard/Community/components/CommunityPostCard.jsx";
import CommunityGroups from "@/Dashboard/Community/CommunityGroups.jsx";

// ============================================================
// COMMUNITY PILLARS
// ============================================================

const PILLARS = [
  {
    key: "pulse",
    label: "Pulse",
    subtitle: "Useful now",
    description: "What is useful to me right now?",
    icon: Sparkles,
  },
  {
    key: "discovery",
    label: "Discovery",
    subtitle: "Connect",
    description: "Who, what and where can I connect with?",
    icon: Compass,
  },
  {
    key: "groups",
    label: "Groups",
    subtitle: "Belong",
    description: "Persistent communities around real interests.",
    icon: Users,
  },
  {
    key: "threads",
    label: "Threads",
    subtitle: "Focus",
    description: "Focused conversations around one matter.",
    icon: MessageCircle,
  },
  {
    key: "actions",
    label: "Actions",
    subtitle: "Do something",
    description: "Move from conversation to a useful next step.",
    icon: Target,
  },
  {
    key: "trust",
    label: "Trust",
    subtitle: "Confidence",
    description: "Identity, ownership and responsible participation.",
    icon: ShieldCheck,
  },
];

const PULSE_MODES = [
  { value: "relevant", label: "For you" },
  { value: "recent", label: "Recent" },
  { value: "nearby", label: "Nearby" },
  { value: "actionable", label: "Actionable" },
  { value: "trusted", label: "Trusted" },
];

const INTENTS = [
  { value: "", label: "I'm exploring" },
  { value: "learn", label: "Learn something" },
  { value: "find", label: "Find something" },
  { value: "connect", label: "Connect with people" },
  { value: "buy", label: "Buy" },
  { value: "sell", label: "Sell" },
  { value: "hire", label: "Hire" },
  { value: "work", label: "Find work" },
  { value: "help", label: "Get or offer help" },
  { value: "join", label: "Join something" },
  { value: "attend", label: "Attend an event" },
  { value: "collaborate", label: "Collaborate" },
];

const HUBS = [
  {
    key: "biashara",
    label: "Biashara",
    icon: "business",
  },
  {
    key: "shamba",
    label: "Shamba",
    icon: "farm",
  },
  {
    key: "elimu",
    label: "Elimu",
    icon: "education",
  },
];

// ============================================================
// RESPONSE HELPERS
// ============================================================

function normalizeArray(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.posts)) {
    return response.posts;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  return [];
}

function getPostId(post) {
  return (
    post?.id ||
    post?._id ||
    post?.post_id ||
    post?.postId ||
    null
  );
}

function getPostType(post) {
  return String(
    post?.type || post?.post_type || "",
  ).toLowerCase();
}

function getPostHub(post) {
  return String(
    post?.hub ||
      post?.source_hub ||
      post?.target_hub ||
      "community",
  ).toLowerCase();
}

function getPostTitle(post) {
  return (
    post?.title ||
    post?.subject ||
    "Community conversation"
  );
}

function getPostBody(post) {
  return (
    post?.body ||
    post?.content ||
    post?.text ||
    post?.description ||
    ""
  );
}

function getAuthor(post) {
  return (
    post?.author?.name ||
    post?.author?.full_name ||
    post?.author_name ||
    post?.username ||
    "Community member"
  );
}

function getDiscoveryReason(post) {
  return (
    post?.discovery?.reason ||
    post?._discovery_reason ||
    ""
  );
}

function formatTime(value) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const elapsed = Math.max(
    0,
    Date.now() - date.getTime(),
  );

  const minutes = Math.floor(elapsed / 60000);
  const hours = Math.floor(elapsed / 3600000);
  const days = Math.floor(elapsed / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
  });
}

// ============================================================
// SMALL UI COMPONENTS
// ============================================================

function PillarButton({
  pillar,
  active,
  onClick,
}) {
  const Icon = pillar.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`
        flex min-w-[125px] items-center gap-3
        rounded-2xl border px-3 py-3 text-left
        transition duration-200
        ${
          active
            ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-900/10"
            : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-emerald-950/20"
        }
      `}
    >
      <span
        className={`
          flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
          ${active ? "bg-white/15" : "bg-slate-100 dark:bg-slate-800"}
        `}
      >
        <Icon size={17} />
      </span>

      <span>
        <span className="block text-xs font-black">
          {pillar.label}
        </span>

        <span
          className={`
            mt-0.5 block text-[9px] font-semibold
            ${active ? "text-white/70" : "text-slate-400"}
          `}
        >
          {pillar.subtitle}
        </span>
      </span>
    </button>
  );
}

function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  onAction,
  actionLabel,
}) {
  return (
    <div className="flex min-h-[290px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center dark:border-white/10 dark:bg-slate-900">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
        <Icon size={24} />
      </div>

      <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>

      {onAction && actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"
        >
          {actionLabel}
          <ArrowRight size={14} />
        </button>
      ) : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4" aria-label="Loading Community">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-[24px] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-slate-200 dark:bg-slate-800" />

            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-2.5 w-20 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>

          <div className="mt-5 h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-3 h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
          <div className="mt-2 h-3 w-5/6 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN DASHBOARD
// ============================================================

export default function CommunityDashboard({
  onNavigate,
}) {
  const { user } = useAuth();

  const {
    get,
    reactToCommunityPost,
  } = useJumuiyaApi();

  // ----------------------------------------------------------
  // Workspace navigation
  // ----------------------------------------------------------

  const [workspacePage, setWorkspacePage] = useState("home");
  const [activeSurface, setActiveSurface] = useState("pulse");

  const navigate = useCallback(
    (destination) => {
      switch (destination) {
        case "community":
        case "community-home":
        case "community-hub-community":
          setWorkspacePage("home");
          setActiveSurface("pulse");
          return;

        case "community-feed":
        case "community-activity":
          setWorkspacePage("feed");
          return;

        case "community-composer":
          setWorkspacePage("composer");
          return;

        case "community-notifications":
          setWorkspacePage("notifications");
          return;

        case "community-groups":
          setWorkspacePage("groups");
          setActiveSurface("groups");
          return;

        case "community-discover":
        case "community-discovery":
          setWorkspacePage("home");
          setActiveSurface("discovery");
          return;

        case "community-hub-biashara":
          onNavigate?.("biashara");
          return;

        case "community-hub-shamba":
          onNavigate?.("shamba");
          return;

        case "community-hub-elimu":
          onNavigate?.("education");
          return;

        case "elimu":
          onNavigate?.("education");
          return;

        default:
          // Top-level dashboards still belong to the global shell.
          onNavigate?.(destination);
      }
    },
    [onNavigate],
  );

  // ----------------------------------------------------------
  // Pulse and Discovery state
  // ----------------------------------------------------------

  const [pulseMode, setPulseMode] = useState("relevant");

  const [discoveryQuery, setDiscoveryQuery] = useState("");
  const [discoveryIntent, setDiscoveryIntent] = useState("");

  const [submittedQuery, setSubmittedQuery] = useState("");
  const [submittedIntent, setSubmittedIntent] = useState("");

  const [reloadToken, setReloadToken] = useState(0);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const requestId = useRef(0);

  // ----------------------------------------------------------
  // Load the requested surface
  // ----------------------------------------------------------

  const loadSurface = useCallback(
    async ({
      surface,
      mode = "relevant",
      query = "",
      intent = "",
      silent = false,
    }) => {
      const thisRequest = ++requestId.current;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        let endpoint = "/community/pulse";

        const params = new URLSearchParams();
        params.set("limit", "30");

        switch (surface) {
          case "pulse":
            endpoint = "/community/pulse";
            params.set("mode", mode);
            break;

          case "discovery":
            endpoint = "/community/discovery";

            if (query) {
              params.set("q", query);
            }

            if (intent) {
              params.set("intent", intent);
            }
            break;

          case "nearby":
            endpoint = "/community/nearby";
            break;

          case "actions":
            endpoint = "/community/opportunities";
            break;

          case "trust":
            endpoint = "/community/trusted";
            break;

          case "exploration":
            endpoint = "/community/exploration";
            break;

          default:
            endpoint = "/community/pulse";
        }

        const response = await get(
          `${endpoint}?${params.toString()}`,
        );

        if (thisRequest === requestId.current) {
          setPosts(normalizeArray(response));
        }
      } catch (requestError) {
        if (thisRequest === requestId.current) {
          console.error(
            "Community surface request failed:",
            requestError,
          );

          setError(
            requestError?.message ||
              "Community could not load this view. Please try again.",
          );

          setPosts([]);
        }
      } finally {
        if (thisRequest === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [get],
  );

  // ----------------------------------------------------------
  // Surface lifecycle
  // ----------------------------------------------------------

  useEffect(() => {
    if (workspacePage !== "home") {
      requestId.current += 1;
      setLoading(false);
      setRefreshing(false);
      return undefined;
    }

    if (activeSurface === "groups") {
      requestId.current += 1;
      setPosts([]);
      setLoading(false);
      setRefreshing(false);
      setError("");
      return undefined;
    }

    const surface =
      activeSurface === "threads"
        ? "pulse"
        : activeSurface;

    const mode =
      activeSurface === "pulse"
        ? pulseMode
        : activeSurface === "threads"
          ? "relevant"
          : "relevant";

    loadSurface({
      surface,
      mode,
      query:
        activeSurface === "discovery"
          ? submittedQuery
          : "",
      intent:
        activeSurface === "discovery"
          ? submittedIntent
          : "",
    });

    return () => {
      requestId.current += 1;
    };
  }, [
    workspacePage,
    activeSurface,
    pulseMode,
    submittedQuery,
    submittedIntent,
    reloadToken,
    loadSurface,
  ]);

  // ----------------------------------------------------------
  // Refresh
  // ----------------------------------------------------------

  const refresh = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  // ----------------------------------------------------------
  // Search
  // ----------------------------------------------------------

  const submitDiscovery = useCallback(
    (event) => {
      event.preventDefault();

      setSubmittedQuery(
        discoveryQuery.trim().slice(0, 100),
      );

      setSubmittedIntent(discoveryIntent);
      setActiveSurface("discovery");
      setReloadToken((value) => value + 1);
    },
    [discoveryQuery, discoveryIntent],
  );

  const chooseSuggestion = useCallback(
    (query) => {
      setDiscoveryQuery(query);
      setSubmittedQuery(query);
      setSubmittedIntent(discoveryIntent);
      setActiveSurface("discovery");
      setReloadToken((value) => value + 1);
    },
    [discoveryIntent],
  );

  // ----------------------------------------------------------
  // Post actions
  // ----------------------------------------------------------

  const openPost = useCallback(
    () => {
      // The existing Feed handles comments and post interactions.
      navigate("community-feed");
    },
    [navigate],
  );

  const handleLike = useCallback(
    async (post) => {
      const postId = getPostId(post);

      if (!postId) {
        throw new Error("The post ID is missing.");
      }

      await reactToCommunityPost(postId);

      // Refresh server-authoritative reaction state.
      setReloadToken((value) => value + 1);
    },
    [reactToCommunityPost],
  );

  const openComposer = useCallback(() => {
    navigate("community-composer");
  }, [navigate]);

  // ----------------------------------------------------------
  // Derived data
  // ----------------------------------------------------------

  const displayName =
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Member";

  const activePillar =
    PILLARS.find(
      (pillar) => pillar.key === activeSurface,
    ) || PILLARS[0];

  const ActiveIcon = activePillar.icon;

  const threadPosts = useMemo(
    () =>
      posts.filter((post) =>
        [
          "discussion",
          "question",
          "help_request",
          "insight",
          "project",
        ].includes(getPostType(post)),
      ),
    [posts],
  );

  const actionPosts = useMemo(
    () =>
      posts.filter((post) => {
        const type = getPostType(post);

        return (
          Boolean(post?.action) ||
          [
            "opportunity",
            "offer",
            "request",
            "event",
            "help_request",
            "project",
          ].includes(type)
        );
      }),
    [posts],
  );

  // ----------------------------------------------------------
  // Existing Community workspaces
  // ----------------------------------------------------------

  if (workspacePage === "feed") {
    return <CommunityFeed onNavigate={navigate} />;
  }

  if (workspacePage === "composer") {
    return <CommunityComposer onNavigate={navigate} />;
  }

  if (workspacePage === "notifications") {
    return <CommunityNotifications onNavigate={navigate} />;
  }

  if (workspacePage === "groups") {
    return <CommunityGroups onNavigate={navigate} />;
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    
      <div className="space-y-5 pb-10">

        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="relative overflow-hidden rounded-[28px] bg-slate-950 p-5 text-white shadow-xl sm:p-7">
          <div className="pointer-events-none absolute -right-14 -top-20 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-300">
                <Sparkles size={13} />
                Jumuiya Community
              </div>

              <h1 className="mt-4 text-2xl font-black leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                Useful beats noisy.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
                A living connection layer for people, knowledge,
                opportunities, shared interests and meaningful action.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "Relevance first",
                  "Real-world context",
                  "Trust aware",
                  "Built for action",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/80"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={openComposer}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black text-slate-950 transition hover:bg-emerald-50 active:scale-[0.98]"
            >
              <Plus size={16} />
              Start something
            </button>
          </div>

          <p className="relative mt-5 border-t border-white/10 pt-4 text-xs font-semibold text-white/50">
            Welcome back, {displayName}.
          </p>
        </section>

        {/* ====================================================
            SIX PILLARS
        ==================================================== */}

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Your Community
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Six ways to turn connection into value.
              </p>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
            {PILLARS.map((pillar) => (
              <PillarButton
                key={pillar.key}
                pillar={pillar}
                active={activeSurface === pillar.key}
                onClick={() => {
                  setError("");

                  if (pillar.key === "groups") {
                    setActiveSurface("groups");
                    setWorkspacePage("groups");
                    return;
                  }

                  setWorkspacePage("home");
                  setActiveSurface(pillar.key);
                }}
              />
            ))}
          </div>
        </section>

        {/* ====================================================
            SURFACE HEADER
        ==================================================== */}

        <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                <ActiveIcon size={20} />
              </div>

              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  {activePillar.label}
                </h2>

                <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {activePillar.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeSurface === "pulse" ? (
                <div className="flex flex-wrap gap-1.5">
                  {PULSE_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      aria-pressed={pulseMode === mode.value}
                      onClick={() => setPulseMode(mode.value)}
                      className={`
                        rounded-full px-3 py-2 text-[10px] font-black transition
                        ${
                          pulseMode === mode.value
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        }
                      `}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              ) : null}

              <button
                type="button"
                onClick={refresh}
                disabled={loading || refreshing || activeSurface === "groups"}
                aria-label="Refresh Community"
                title="Refresh"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>

          {/* ================================================
              DISCOVERY SEARCH
          ================================================ */}

          {activeSurface === "discovery" ? (
            <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/5">
              <form
                onSubmit={submitDiscovery}
                className="flex flex-col gap-3 md:flex-row"
              >
                <div className="relative min-w-0 flex-1">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={discoveryQuery}
                    maxLength={100}
                    onChange={(event) =>
                      setDiscoveryQuery(event.target.value)
                    }
                    placeholder="Search topics, questions and opportunities..."
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
                  />

                  {discoveryQuery ? (
                    <button
                      type="button"
                      onClick={() => setDiscoveryQuery("")}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </div>

                <select
                  value={discoveryIntent}
                  onChange={(event) =>
                    setDiscoveryIntent(event.target.value)
                  }
                  className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600 outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
                >
                  {INTENTS.map((intent) => (
                    <option
                      key={intent.value || "any"}
                      value={intent.value}
                    >
                      {intent.label}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-black text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
                >
                  <Compass size={15} />
                  Discover
                </button>
              </form>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "business",
                  "opportunities",
                  "technology",
                  "education",
                  "agriculture",
                  "services",
                ].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => chooseSuggestion(term)}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-white/10 dark:text-slate-400 dark:hover:bg-emerald-950/20"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {/* ====================================================
            REQUEST ERROR
        ==================================================== */}

        {error ? (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-950/20 dark:text-rose-300"
          >
            <div>{error}</div>

            <button
              type="button"
              onClick={refresh}
              className="shrink-0 rounded-lg px-2 py-1 underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* ====================================================
            SURFACE CONTENT
        ==================================================== */}

        {activeSurface === "groups" ? (
          <EmptyState
            icon={Users}
            title="Groups are built around belonging"
            description="Persistent groups need group records, membership, roles and join permissions on the backend. Those endpoints are not part of the current Community routes, so this view deliberately does not display fabricated groups or member counts."
            onAction={openComposer}
            actionLabel="Start a Community conversation"
          />
        ) : loading ? (
          <LoadingState />
        ) : activeSurface === "threads" && threadPosts.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No focused threads yet"
            description="Questions, help requests, discussions and project posts will appear here. The current backend can supply those posts; dedicated thread records and resolution states are a subsequent step."
            onAction={openComposer}
            actionLabel="Start a conversation"
          />
        ) : activeSurface === "actions" && actionPosts.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No actionable opportunities found"
            description="When the current Community feed contains opportunities, offers, requests, events or help requests, they can be surfaced here."
            onAction={openComposer}
            actionLabel="Publish something useful"
          />
        ) : activeSurface === "trust" && posts.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No results in this view"
            description="There are no results returned by the current trusted-discovery endpoint. This does not mean a person is untrustworthy; full identity verification and reputation services still need their own backend implementation."
          />
        ) : posts.length > 0 ? (
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-5">
              {(activeSurface === "threads"
                ? threadPosts
                : activeSurface === "actions"
                  ? actionPosts
                  : posts
              ).map((post, index) => {
                const id =
                  getPostId(post) ||
                  `${getPostType(post)}-${index}`;

                const reason =
                  getDiscoveryReason(post);

                return (
                  <article
                    key={id}
                    className="min-w-0"
                  >
                    {reason ? (
                      <div className="mb-2 flex items-center gap-2 px-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <Sparkles size={12} />
                        <span>{reason}</span>
                      </div>
                    ) : null}

                    <CommunityPostCard
                      post={post}
                      currentUser={user}
                      onOpen={openPost}
                      onLike={handleLike}
                      onComment={openPost}
                    />
                  </article>
                );
              })}
            </div>

            <aside className="hidden space-y-4 xl:block">
              <section className="rounded-[22px] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <Sparkles
                    size={16}
                    className="text-emerald-500"
                  />

                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Why this view?
                  </h3>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Community prioritizes relevance, useful context and
                  possible next steps. Raw popularity should not decide
                  everything a member sees.
                </p>

                <div className="mt-4 space-y-3">
                  {[
                    ["Relevance", "Context matters more than noise."],
                    ["Connection", "Discover people and knowledge across Jumuiya."],
                    ["Action", "Move from discussion to a meaningful next step."],
                    ["Trust", "Confidence should be grounded in real signals."],
                  ].map(([title, detail]) => (
                    <div key={title}>
                      <p className="text-[10px] font-black text-slate-700 dark:text-slate-200">
                        {title}
                      </p>

                      <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
                        {detail}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[22px] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Connected hubs
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Explore the wider Jumuiya ecosystem.
                </p>

                <div className="mt-4 space-y-2">
                  {HUBS.map((hub) => {
                    const Icon =
                      hub.icon === "business"
                        ? Target
                        : hub.icon === "farm"
                          ? Leaf
                          : GraduationCap;

                    return (
                      <button
                        key={hub.key}
                        type="button"
                        onClick={() =>
                          navigate(`community-hub-${hub.key}`)
                        }
                        className="flex w-full items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 text-left transition hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/20"
                      >
                        <Icon
                          size={15}
                          className="text-slate-500 dark:text-slate-400"
                        />

                        <span className="flex-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                          {hub.label}
                        </span>

                        <ArrowRight
                          size={14}
                          className="text-slate-400"
                        />
                      </button>
                    );
                  })}
                </div>
              </section>
            </aside>
          </div>
        ) : (
          <EmptyState
            icon={
              activeSurface === "discovery"
                ? Compass
                : activeSurface === "trust"
                  ? ShieldCheck
                  : Sparkles
            }
            title={
              activeSurface === "discovery"
                ? "No matching results"
                : "Your Pulse is quiet"
            }
            description={
              activeSurface === "discovery"
                ? "Try another topic or intent. This version ranks Community post candidates; discovering actual businesses, farms, schools and people requires their source services to be connected."
                : "The API returned no published Community posts for this view. You can be the person who starts the next useful conversation."
            }
            onAction={openComposer}
            actionLabel="Create a post"
          />
        )}

        {/* ====================================================
            MOBILE QUICK ACTIONS
        ==================================================== */}

        <div className="grid grid-cols-2 gap-3 xl:hidden">
          <button
            type="button"
            onClick={() => {
              setActiveSurface("discovery");
              setSubmittedQuery(discoveryQuery.trim());
              setSubmittedIntent(discoveryIntent);
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
          >
            <Compass size={15} />
            Discover
          </button>

          <button
            type="button"
            onClick={openComposer}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-xs font-black text-white hover:bg-emerald-700"
          >
            <Plus size={15} />
            Create post
          </button>
        </div>
      </div>
  );
}