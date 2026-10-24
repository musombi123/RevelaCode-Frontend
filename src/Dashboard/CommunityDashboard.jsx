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
  CalendarDays,
  Compass,
  ChevronDown,
  GraduationCap,
  Home,
  Leaf,
  Megaphone,
  MapPin,
  Menu,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Target,
  Users,
  User,
  UserPlus,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useTheme } from "@/components/hooks/useTheme.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import CommunityMattersWorkspace from "@/Dashboard/Community/CommunityMattersWorkspace.jsx";

import CommunityFeed from "@/Dashboard/Community/CommunityFeed.jsx";
import CommunityComposer from "@/Dashboard/Community/CommunityComposer.jsx";
import CommunityNotifications from "@/Dashboard/Community/CommunityNotifications.jsx";
import CommunityPostCard from "@/Dashboard/Community/components/CommunityPostCard.jsx";
import CommunityMediaCards, { getCommunityMediaItems } from "@/Dashboard/Community/CommunityMediaCards.jsx";
import CommunityGroups from "@/Dashboard/Community/CommunityGroups.jsx";
import CommunityMarketplace from "@/Dashboard/Community/CommunityMarketplace.jsx";
import CommunityContactSettings from "@/Dashboard/Community/CommunityContactSettings.jsx";
import CommunityPeopleDirectory from "@/Dashboard/Community/CommunityPeopleDirectory.jsx";
import CommunityInviteMembers from "@/Dashboard/Community/CommunityInviteMembers.jsx";
import CommunityAdSenseUnit from "@/components/CommunityAdSenseUnit.jsx";

// ============================================================
// TEMPORARY HUB REDIRECTS
// All hubs continue to share the existing Render frontend until
// the custom subdomains are configured. Route through the central app.
// ============================================================
function redirectToHub(hub) {
  if (typeof window === "undefined") return;

  const routes = {
    biashara: "/jumuiya/biashara",
    shamba: "/jumuiya/shamba",
    elimu: "/jumuiya/elimu",
    education: "/jumuiya/elimu",
  };
  const path = routes[String(hub || "").trim().toLowerCase()];
  if (!path) return;

  const hostname = String(window.location.hostname || "").toLowerCase();
  const isRevelaCodeSubdomain = hostname.endsWith(".revelacode.co.ke");
  const origin = isRevelaCodeSubdomain ? "https://revelacode.co.ke" : window.location.origin;
  window.location.assign(`${origin}${path}`);
}

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
    key: "marketplace",
    label: "Marketplace",
    subtitle: "Trade value",
    description: "Discover useful goods, skills and local services.",
    icon: ShoppingBag,
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

const INTENT_TILES = [
  { value: "buy", label: "Buy", detail: "Find useful goods", icon: ShoppingBag, hub: "biashara", accent: "bg-blue-500" },
  { value: "sell", label: "Sell", detail: "Offer goods or skills", icon: Target, hub: "biashara", accent: "bg-blue-500" },
  { value: "learn", label: "Learn", detail: "Find knowledge and skills", icon: GraduationCap, hub: "elimu", accent: "bg-violet-500" },
  { value: "help", label: "Help", detail: "Ask for or offer help", icon: MessageCircle, hub: "community", accent: "bg-cyan-500" },
  { value: "hire", label: "Hire", detail: "Find people and work", icon: UserPlus, hub: "biashara", accent: "bg-blue-500" },
  { value: "attend", label: "Events", detail: "Find events to attend", icon: CalendarDays, hub: "community", accent: "bg-amber-500" },
];

const INTENT_GROUPS = [
  { key: "trade", label: "Trade & Work", detail: "Buy, sell and hire", values: ["buy", "sell", "hire"], layout: "grid-cols-3" },
  { key: "learning", label: "Learning & Skills", detail: "Knowledge and education", values: ["learn"], layout: "grid-cols-1" },
  { key: "community", label: "Community Life", detail: "Help and events", values: ["help", "attend"], layout: "grid-cols-2" },
];

const AROUND_YOU_TYPES = new Set([
  "opportunity",
  "offer",
  "request",
  "event",
  "help",
  "help_request",
  "job",
  "market",
  "service_offer",
  "service_needed",
  "advertisement",
  "alert",
  "question",
  "knowledge",
  "resource",
]);

function getAroundYouKind(post) {
  const type = getPostType(post);
  if (["request", "help", "help_request", "service_needed", "question", "alert"].includes(type)) return "Need";
  if (["offer", "service_offer", "job", "opportunity", "market", "event", "advertisement"].includes(type) || isCommunityPromotion(post)) return "Offer";
  return "Community";
}

function getAroundYouAction(post) {
  const type = getPostType(post);
  if (type === "event") return "View event";
  if (["request", "help", "help_request", "service_needed", "question"].includes(type)) return "Respond";
  if (["job", "opportunity"].includes(type)) return "Explore opportunity";
  if (["offer", "service_offer", "market", "advertisement"].includes(type) || isCommunityPromotion(post)) return "View offer";
  return "View details";
}


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

function isCommunityPromotion(post) {
  const category = String(post?.category || post?.type || post?.post_type || "").toLowerCase();
  return post?.is_sponsored === true || post?.sponsored === true || post?.ad_status === "active" || ["advertisement", "promotion", "sponsored"].includes(category);
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
            mt-0.5 block text-xs font-semibold
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

function MarketplaceListingCard({ listing }) {
  const title = listing?.title || "Marketplace listing";
  const description = listing?.description || "Contact the seller for more information.";
  const currency = String(listing?.currency || "KES").toUpperCase();
  const priceValue = Number(listing?.price);
  const price = Number.isFinite(priceValue)
    ? `${currency} ${new Intl.NumberFormat("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(priceValue)}${listing?.unit ? ` / ${listing.unit}` : ""}`
    : "Price available from seller";
  const quantity = Number(listing?.quantity_available);
  const location = listing?.location || "";

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-slate-900 sm:rounded-[24px] sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <ShoppingBag size={19} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Marketplace</span>
            <span className="text-xs text-slate-400">Community</span>
          </div>
          <h3 className="break-words text-sm font-black text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600 dark:text-slate-300">{description}</p>
          <p className="mt-3 text-base font-black text-slate-950 dark:text-white">{price}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
            {Number.isFinite(quantity) ? <span>{quantity} available</span> : null}
            {location ? <span>{location}</span> : null}
          </div>
        </div>
      </div>
    </article>
  );
}
// ============================================================
// MAIN DASHBOARD
// ============================================================

export default function CommunityDashboard({
  onNavigate,
}) {
  const { user } = useAuth();
  const { theme } = useTheme();
  // The Community experience defaults to its navy system skin; an explicit
  // platform Light selection remains authoritative.
  const communityDark = theme !== "light";

  const communityApi = useJumuiyaApi();
  const {
    getCommunityHealth,
    getCommunityPulse,
    getCommunityDiscovery,
    getCommunityNearby,
    getCommunityOpportunities,
    getCommunityTrusted,
    getCommunityExploration,
    getCommunityFeed,
    getMarketplaceListings,
    reactToCommunityPost,
  } = communityApi;

  // ----------------------------------------------------------
  // Workspace navigation
  // ----------------------------------------------------------

  const [workspacePage, setWorkspacePage] = useState("home");
  const [activeSurface, setActiveSurface] = useState("pulse");
  const [backMenuOpen, setBackMenuOpen] = useState(false);
  const [viewsMenuOpen, setViewsMenuOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [composerCategory, setComposerCategory] = useState("general");
  const [backendHealth, setBackendHealth] = useState("checking");

  const navigate = useCallback(
    (destination) => {
      switch (destination) {
        case "community":
        case "community-home":
        case "community-hub-community":
          setWorkspacePage("home");
          setActiveSurface("pulse");
          return;

        case "community-chats":
        case "chats":
          setWorkspacePage("chats");
          return;

        case "community-circles":
        case "circles":
          setWorkspacePage("groups");
          setActiveSurface("groups");
          return;

        case "community-me":
        case "me":
          setWorkspacePage("me");
          return;

        case "community-feed":
        case "community-activity":
          setWorkspacePage("feed");
          return;

        case "community-composer":
          setEditingPost(null);
          setComposerCategory("general");
          setWorkspacePage("composer");
          return;

        case "community-advertisement":
          setEditingPost(null);
          setComposerCategory("advertisement");
          setWorkspacePage("composer");
          return;

        case "community-notifications":
          setWorkspacePage("notifications");
          return;

        case "community-marketplace":
        case "marketplace":
          setWorkspacePage("marketplace");
          return;

        case "community-contact-settings":
          setWorkspacePage("contact-settings");
          return;

        case "community-people":
        case "community-directory":
          setWorkspacePage("people");
          return;

        case "community-invite-members":
        case "community-invite":
          setWorkspacePage("invite");
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
          redirectToHub("biashara");
          return;

        case "community-hub-shamba":
          redirectToHub("shamba");
          return;

        case "community-hub-elimu":
          redirectToHub("elimu");
          return;

        case "elimu":
          if (typeof onNavigate === "function") onNavigate("education");
          return;

        default:
          // Top-level dashboards still belong to the global shell.
          if (typeof onNavigate === "function") onNavigate(destination);
          return;
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

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => getCommunityHealth())
      .then((health) => {
        if (active) setBackendHealth(String(health?.status || "").toLowerCase() === "online" ? "online" : "unavailable");
      })
      .catch(() => {
        if (active) setBackendHealth("unavailable");
      });
    return () => { active = false; };
  }, [getCommunityHealth]);

  const [posts, setPosts] = useState([]);
  const [selectedBoardPost, setSelectedBoardPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [marketplaceListings, setMarketplaceListings] = useState([]);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [marketplaceError, setMarketplaceError] = useState("");
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine,
  );

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
        const requestOptions = { limit: 30 };
        let response;

        switch (surface) {
          case "pulse":
            response = await getCommunityPulse({ ...requestOptions, mode });
            break;

          case "threads":
            response = await getCommunityFeed({ ...requestOptions, surface: "threads", mode: "recent" });
            break;

          case "discovery":
            response = await getCommunityDiscovery({ ...requestOptions, query, intent });
            break;

          case "nearby":
            response = await getCommunityNearby(requestOptions);
            break;

          case "actions":
            response = await getCommunityOpportunities(requestOptions);
            break;

          case "trust":
            response = await getCommunityTrusted(requestOptions);
            break;

          case "exploration":
            response = await getCommunityExploration(requestOptions);
            break;

          default:
            response = await getCommunityPulse({ ...requestOptions, mode: "relevant" });
        }

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
    [
      getCommunityPulse,
      getCommunityDiscovery,
      getCommunityNearby,
      getCommunityOpportunities,
      getCommunityTrusted,
      getCommunityExploration,
      getCommunityFeed,
    ],
  );

  // ----------------------------------------------------------
  // Marketplace cards are sourced separately from community posts.
  // They are loaded only on the Community Pulse and only for hub=community.
  // ----------------------------------------------------------

  useEffect(() => {
    let active = true;

    if (workspacePage !== "home" || activeSurface !== "pulse") {
      setMarketplaceListings([]);
      setMarketplaceError("");
      setMarketplaceLoading(false);
      return () => {
        active = false;
      };
    }

    setMarketplaceLoading(true);
    setMarketplaceError("");

    Promise.resolve()
      .then(() => {
        if (typeof getMarketplaceListings !== "function") {
          throw new Error("The Community Marketplace service is unavailable.");
        }
        return getMarketplaceListings({ hub: "community" });
      })
      .then((response) => {
        if (!active) return;
        const payload = response?.data ?? response;
        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.listings)
            ? payload.listings
            : Array.isArray(payload?.items)
              ? payload.items
              : Array.isArray(payload?.data)
                ? payload.data
                : [];
        setMarketplaceListings(rows.filter((item) =>
          !item?.hub || String(item.hub).toLowerCase() === "community"
        ));
      })
      .catch((requestError) => {
        if (!active) return;
        console.error("Community Marketplace listings failed:", requestError);
        setMarketplaceListings([]);
        setMarketplaceError("Marketplace listings could not be loaded. Community posts are still available.");
      })
      .finally(() => {
        if (active) setMarketplaceLoading(false);
      });

    return () => {
      active = false;
    };
  }, [workspacePage, activeSurface, reloadToken, getMarketplaceListings]);

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

    // Each Community pillar maps to its own server surface.
    // Threads must not silently fall back to Pulse.
    const surface = activeSurface;

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
  // Live updates while Community is open
  // ----------------------------------------------------------

  useEffect(() => {
    if (workspacePage !== "home") return undefined;

    const refreshVisibleCommunity = () => {
      if (
        document.visibilityState !== "hidden" &&
        (typeof navigator === "undefined" || navigator.onLine)
      ) {
        setReloadToken((value) => value + 1);
      }
    };

    const updateConnection = () => {
      const online = typeof navigator === "undefined" || navigator.onLine;
      setIsOnline(online);
      if (online) refreshVisibleCommunity();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshVisibleCommunity();
      }
    };

    const interval = window.setInterval(refreshVisibleCommunity, 45000);
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [workspacePage]);

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

  const selectIntent = useCallback((intent) => {
    setDiscoveryQuery("");
    setSubmittedQuery("");
    setDiscoveryIntent(intent);
    setSubmittedIntent(intent);
    setWorkspacePage("home");
    setActiveSurface("discovery");
    setReloadToken((value) => value + 1);
  }, []);

  const handleIntentTileClick = useCallback((intentTile) => {
    // Trading and learning go to their existing hubs; Community intents stay here.
    if (intentTile?.hub && intentTile.hub !== "community") {
      redirectToHub(intentTile.hub);
      return;
    }
    selectIntent(intentTile?.value || "");
  }, [selectIntent]);

  const selectCommunitySurface = useCallback((surface) => {
    setViewsMenuOpen(false);
    setWorkspacePage("home");
    setDiscoveryQuery("");
    setSubmittedQuery("");
    setDiscoveryIntent("");
    setSubmittedIntent("");
    setActiveSurface(surface);
    setReloadToken((value) => value + 1);
  }, []);

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

      if (typeof reactToCommunityPost !== "function") {
        throw new Error("The Community reaction service is unavailable. Refresh the page and try again.");
      }

      await reactToCommunityPost(postId);

      // Refresh server-authoritative reaction state.
      setReloadToken((value) => value + 1);
    },
    [reactToCommunityPost],
  );

  const openComposer = useCallback(() => {
    setEditingPost(null);
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
          "knowledge",
          "help",
          "request",
          "service_needed",
          "help_request",
          "insight",
          "project",
        ].includes(getPostType(post)),
      ),
    [posts],
  );

  const promotionPosts = useMemo(
    () => posts.filter(isCommunityPromotion).slice(0, 3),
    [posts],
  );

  const aroundYouItems = useMemo(() => {
    const matches = posts.filter((post) =>
      AROUND_YOU_TYPES.has(getPostType(post)) || isCommunityPromotion(post)
    );

    // Map real listings from the existing Marketplace API into the same tile
    // vocabulary without pretending they are Community post records.
    const listingTiles = activeSurface === "pulse"
      ? marketplaceListings.map((listing, index) => ({
          ...listing,
          id: listing?.id ?? listing?._id ?? listing?.listing_id ?? `market-listing-${index}`,
          title: listing?.title || "Marketplace listing",
          body: listing?.description || listing?.body || "",
          type: "offer",
          hub: String(listing?.hub || "community").toLowerCase(),
          location: listing?.location || "",
          __communitySource: "marketplace",
        }))
      : [];

    if (matches.length || listingTiles.length) {
      return [...matches, ...listingTiles].slice(0, 14);
    }

    // Discovery results are already filtered by the backend, so retain genuine
    // matches even when a specific result type is outside the tile vocabulary.
    if (activeSurface === "discovery" && (submittedIntent || submittedQuery)) {
      return posts.slice(0, 14);
    }
    return [];
  }, [posts, marketplaceListings, activeSurface, submittedIntent, submittedQuery]);

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

  const renderBackMenu = () => (
    <div className="mb-3 flex justify-end">
      <div className="relative">
        <button type="button" onClick={() => setBackMenuOpen((open) => !open)} aria-expanded={backMenuOpen} aria-haspopup="menu" className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm hover:border-cyan-400 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200">
          <Menu size={14} /> RevelaCode menu <ChevronDown size={12} />
        </button>
        {backMenuOpen ? (
          <>
            <button type="button" aria-label="Close RevelaCode menu" className="fixed inset-0 z-[95] cursor-default" onClick={() => setBackMenuOpen(false)} />
            <div role="menu" className="absolute right-0 top-11 z-[100] w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-white/10 dark:bg-slate-900">
              <p className="px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">RevelaCode workspace</p>
              <button type="button" role="menuitem" onClick={() => { setBackMenuOpen(false); if (typeof onNavigate === "function") onNavigate("home"); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-black text-slate-800 hover:bg-cyan-50 dark:text-white dark:hover:bg-white/5">
                <ArrowRight size={14} className="rotate-180" /> Back to RevelaCode
              </button>
              <div className="my-1 border-t border-slate-100 dark:border-white/10" />
              <button type="button" role="menuitem" onClick={() => { setBackMenuOpen(false); redirectToHub("biashara"); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"><Target size={14} /> Biashara</button>
              <button type="button" role="menuitem" onClick={() => { setBackMenuOpen(false); redirectToHub("shamba"); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"><Leaf size={14} /> Shamba</button>
              <button type="button" role="menuitem" onClick={() => { setBackMenuOpen(false); redirectToHub("elimu"); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"><GraduationCap size={14} /> Elimu</button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );


  if (workspacePage === "feed") {
    return (
      <div className="min-w-0">
        {renderBackMenu()}
        <CommunityFeed
          onNavigate={navigate}
          onEditPost={(post) => {
            setEditingPost(post);
            setWorkspacePage("composer");
          }}
        />
      </div>
    );
  }

  if (workspacePage === "composer") {
    return (
      <CommunityComposer
        initialPost={editingPost}
        initialCategory={composerCategory}
        onNavigate={navigate}
      />
    );
  }

  if (workspacePage === "notifications") {
    return <div className="min-w-0">{renderBackMenu()}<CommunityNotifications onNavigate={navigate} /></div>;
  }

  if (workspacePage === "marketplace") {
    return <div className="min-w-0">{renderBackMenu()}<CommunityMarketplace onNavigate={navigate} /></div>;
  }

  if (workspacePage === "contact-settings") {
    return (
      <div className="min-w-0">
        {renderBackMenu()}
        <CommunityContactSettings
          onBack={() => navigate("community")}
        />
      </div>
    );
  }

  if (workspacePage === "people") {
    return <div className="min-w-0">{renderBackMenu()}<CommunityPeopleDirectory onBack={() => navigate("community")} onInvite={() => navigate("community-invite-members")} /></div>;
  }

  if (workspacePage === "invite") {
    return <div className="min-w-0">{renderBackMenu()}<CommunityInviteMembers onBack={() => navigate("community")} /></div>;
  }

  // ==========================================================
  // INTENT-FIRST MOBILE / DESKTOP WORKSPACE
  // ==========================================================

  return (
    <div className={"min-h-[70vh] w-full " + (communityDark ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900")}>
      <div className="mx-auto grid w-full max-w-[1680px] grid-cols-1 gap-3 px-3 pb-28 pt-3 sm:px-4 lg:grid-cols-[170px_minmax(0,1fr)] lg:gap-4 xl:grid-cols-[184px_minmax(0,1fr)_272px]">
        {/* Desktop left rail */}
        <aside className="hidden min-w-0 lg:block">
          <div className="sticky top-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center bg-cyan-500 text-slate-950" style={{ clipPath: "polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0 50%)" }}>
                  <Users size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-black">Jumuiya</span>
                  <span className="block text-xs text-slate-400">Community</span>
                </span>
              </div>
            </div>
            <nav aria-label="Community navigation" className="rounded-2xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-900">
              <button type="button" onClick={() => navigate("community-home")} aria-current={workspacePage === "home" ? "page" : undefined} className={"mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black transition " + (workspacePage === "home" ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5")}>
                <Home size={16} /> Home
              </button>
              <button type="button" onClick={() => navigate("community-circles")} aria-current={workspacePage === "groups" ? "page" : undefined} className={"mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black transition " + (workspacePage === "groups" ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5")}>
                <Users size={16} /> Circles
              </button>
              <button type="button" onClick={openComposer} className="mb-1 flex w-full items-center gap-3 rounded-xl bg-slate-950 px-3 py-3 text-left text-xs font-black text-white transition hover:bg-slate-800 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300">
                <Plus size={16} /> Create
              </button>
              <button type="button" onClick={() => navigate("community-chats")} aria-current={workspacePage === "chats" ? "page" : undefined} className={"mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black transition " + (workspacePage === "chats" ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5")}>
                <MessageCircle size={16} /> Chats
              </button>
              <button type="button" onClick={() => navigate("community-me")} aria-current={workspacePage === "me" ? "page" : undefined} className={"flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black transition " + (workspacePage === "me" ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5")}>
                <User size={16} /> Me
              </button>
            </nav>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Quick access</p>
              <button type="button" onClick={() => navigate("community-marketplace")} className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"><ShoppingBag size={14} /> Marketplace</button>
              <button type="button" onClick={() => navigate("community-people")} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"><User size={14} /> Member directory</button>
              <button type="button" onClick={() => navigate("community-invite-members")} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"><UserPlus size={14} /> Invite members</button>
            </div>
          </div>
        </aside>

        {/* Main mobile-first surface */}
        <main className="min-w-0">
          {renderBackMenu()}
          {workspacePage === "chats" ? (
            <CommunityMattersWorkspace api={communityApi} currentUserId={user?.id || user?._id || user?.user_id || null} />
          ) : workspacePage === "groups" ? (
            <CommunityGroups onNavigate={navigate} />
          ) : workspacePage === "me" ? (
            <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900 sm:p-7">
              <div className="flex items-start gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center bg-cyan-500 text-lg font-black text-slate-950" style={{ clipPath: "polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0 50%)" }}>
                  {displayName.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-cyan-700 dark:text-cyan-300">Your Community space</p>
                  <h1 className="mt-1 break-words text-2xl font-black tracking-tight text-slate-950 dark:text-white">{displayName}</h1>
                  <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">{user?.email || "Email not provided by the active account."}</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-500 dark:text-slate-400">Manage the contact details you share with other members, discover people, or invite someone into Jumuiya.</p>
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <button type="button" onClick={() => navigate("community-contact-settings")} className="rounded-xl border border-slate-200 px-3 py-3 text-left text-xs font-black hover:border-cyan-400 dark:border-white/10">Contact settings <ArrowRight size={13} className="ml-1 inline" /></button>
                <button type="button" onClick={() => navigate("community-people")} className="rounded-xl border border-slate-200 px-3 py-3 text-left text-xs font-black hover:border-cyan-400 dark:border-white/10">Member directory <ArrowRight size={13} className="ml-1 inline" /></button>
                <button type="button" onClick={() => navigate("community-invite-members")} className="rounded-xl border border-slate-200 px-3 py-3 text-left text-xs font-black hover:border-cyan-400 dark:border-white/10">Invite members <ArrowRight size={13} className="ml-1 inline" /></button>
              </div>
            </section>
          ) : (
            <>
              <header className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.15em] text-cyan-700 dark:text-cyan-300">
                    <Sparkles size={13} /> Jumuiya Community
                  </div>
                  <div className="flex items-center gap-2">
                    <div role="status" aria-live="polite" className={"inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold " + (backendHealth === "online" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200" : "border-amber-300/30 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-100")}>
                      <span className={"h-1.5 w-1.5 rounded-full " + (backendHealth === "online" ? "animate-pulse bg-emerald-500" : "bg-amber-500")} />
                      {backendHealth === "checking" ? "Checking Community API" : backendHealth === "online" ? "Community API online" : "Community API unavailable"}
                    </div>
                    <button type="button" onClick={() => navigate("community-advertisement")} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-slate-950 shadow-sm transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900" aria-label="Create a Community advertisement">
                      <Megaphone size={14} /> Create an ad
                    </button>
                  </div>
                  <div className="relative">
                    <button type="button" onClick={() => setBackMenuOpen((open) => !open)} aria-expanded={backMenuOpen} aria-haspopup="menu" className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:border-cyan-400 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200">
                      <Menu size={14} /> Menu <ChevronDown size={12} />
                    </button>
                    {backMenuOpen ? (
                      <>
                        <button type="button" aria-label="Close RevelaCode menu" className="fixed inset-0 z-[95] cursor-default" onClick={() => setBackMenuOpen(false)} />
                        <div role="menu" className="absolute right-0 top-11 z-[100] w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-white/10 dark:bg-slate-900">
                          <p className="px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">RevelaCode workspace</p>
                          <button type="button" role="menuitem" onClick={() => { setBackMenuOpen(false); if (typeof onNavigate === "function") onNavigate("home"); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-black text-slate-800 hover:bg-cyan-50 dark:text-white dark:hover:bg-white/5">
                            <ArrowRight size={14} className="rotate-180" /> Back to RevelaCode
                          </button>
                          <div className="my-1 border-t border-slate-100 dark:border-white/10" />
                          <button type="button" role="menuitem" onClick={() => { setBackMenuOpen(false); redirectToHub("biashara"); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"><Target size={14} /> Biashara</button>
                          <button type="button" role="menuitem" onClick={() => { setBackMenuOpen(false); redirectToHub("shamba"); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"><Leaf size={14} /> Shamba</button>
                          <button type="button" role="menuitem" onClick={() => { setBackMenuOpen(false); redirectToHub("elimu"); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"><GraduationCap size={14} /> Elimu</button>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
                <h1 className="mt-5 text-2xl font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-3xl">What do you need today?</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Start with an intention. Find nearby needs and offers, connect through the right Jumuiya hub, and take one useful next step.</p>
              </header>

              <section aria-label="Community actions by category" className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 sm:grid-cols-3">
                {INTENT_GROUPS.map((group) => {
                  const groupTiles = group.values
                    .map((value) => INTENT_TILES.find((tile) => tile.value === value))
                    .filter(Boolean);

                  return (
                    <section key={group.key} className="min-w-0">
                      <div className="mb-1.5 px-0.5">
                        <h2 className="text-xs font-black text-slate-900 dark:text-white sm:text-xs">{group.label}</h2>
                        <p className="mt-0.5 text-xs leading-4 text-slate-500 dark:text-slate-400">{group.detail}</p>
                      </div>
                      <div className={"grid gap-1.5 " + group.layout}>
                        {groupTiles.map((intentTile) => {
                          const TileIcon = intentTile.icon;
                          const selected = intentTile.hub === "community" && activeSurface === "discovery" && submittedIntent === intentTile.value;
                          const compactLayout = group.key === "learning";

                          return (
                            <button
                              key={intentTile.value}
                              type="button"
                              onClick={() => handleIntentTileClick(intentTile)}
                              aria-pressed={selected}
                              className={"group flex min-w-0 items-center gap-2 rounded-xl border bg-white p-2 text-left transition active:scale-[0.99] dark:bg-slate-900 " + (compactLayout ? "min-h-[48px]" : "min-h-[54px] flex-col justify-center") + " " + (selected ? "border-cyan-400 ring-1 ring-cyan-400/20 dark:border-cyan-400" : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20")}
                            >
                              <span className={"flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-white " + (compactLayout ? "" : "mx-auto")}>
                                <TileIcon size={15} />
                              </span>
                              <span className={"min-w-0 text-xs font-extrabold leading-4 text-slate-900 dark:text-white " + (compactLayout ? "flex-1 truncate" : "w-full truncate text-center")}>{intentTile.label}</span>
                              {compactLayout ? <ArrowRight size={13} className="shrink-0 text-slate-400" /> : null}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </section>

              <form onSubmit={submitDiscovery} className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-900">
                <Search size={17} className="ml-2 shrink-0 text-slate-400" />
                <input type="search" value={discoveryQuery} maxLength={100} onChange={(event) => setDiscoveryQuery(event.target.value)} placeholder="Search needs, offers, skills or places…" className="h-10 min-w-0 flex-1 bg-transparent px-1 text-xs outline-none placeholder:text-slate-400 dark:text-white" />
                {discoveryQuery ? <button type="button" onClick={() => setDiscoveryQuery("")} aria-label="Clear search" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"><X size={14} /></button> : null}
                <button type="submit" className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-slate-950 px-3 text-xs font-black text-white hover:bg-slate-800 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"><Compass size={14} /> Search</button>
              </form>

              {error ? (
                <div role="alert" className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-rose-300/30 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/20 dark:text-rose-300">
                  <span>{error}</span>
                  <button type="button" onClick={refresh} className="shrink-0 underline">Retry</button>
                </div>
              ) : null}

              <CommunityMediaCards
                posts={posts}
                onOpenPost={setSelectedBoardPost}
                onCreatePost={() => navigate("community-composer")}
              />

              <div className="mb-4 flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-3 text-xs dark:border-white/10 dark:bg-slate-900/70">
                <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">✓</span>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-100">Community is free for everyone</p>
                  <p className="mt-0.5 leading-5 text-slate-500 dark:text-slate-400">Sponsored advertisements help keep Community open. You never need a paid membership or subscription to participate.</p>
                </div>
              </div>

              <section className="mt-6">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">Around you</h2>
                      <span className="rounded-full bg-slate-200/70 px-2 py-1 text-xs font-black uppercase tracking-[0.1em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">Needs & offers</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{activeSurface === "discovery" && (submittedIntent || submittedQuery) ? "Results for your selected intent or search." : activeSurface === "pulse" ? "Relevant posts, needs, offers and Marketplace listings." : `Showing ${({ discovery: "discovery", nearby: "nearby", actions: "opportunities", trust: "trusted discovery", exploration: "exploration", threads: "discussion threads" })[activeSurface] || "Community"} results.`}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button type="button" onClick={() => setViewsMenuOpen((open) => !open)} aria-expanded={viewsMenuOpen} aria-haspopup="menu" className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:border-cyan-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"><Compass size={13} /> Views <ChevronDown size={12} /></button>
                      {viewsMenuOpen ? (
                        <>
                          <button type="button" aria-label="Close Community views" className="fixed inset-0 z-[95] cursor-default" onClick={() => setViewsMenuOpen(false)} />
                          <div role="menu" className="absolute right-0 top-11 z-[100] w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-slate-900">
                            {[
                              ["pulse", "For you"],
                              ["discovery", "Discover"],
                              ["nearby", "Nearby"],
                              ["actions", "Opportunities"],
                              ["trust", "Trusted"],
                              ["exploration", "Explore"],
                              ["threads", "Threads"],
                            ].map(([surface, label]) => (
                              <button key={surface} type="button" role="menuitem" onClick={() => selectCommunitySurface(surface)} className={"flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-bold " + (activeSurface === surface ? "bg-cyan-50 text-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-200" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5")}>
                                {label}
                                {activeSurface === surface ? <span className="text-xs font-black">Selected</span> : null}
                              </button>
                            ))}
                          </div>
                        </>
                      ) : null}
                    </div>
                    <button type="button" onClick={() => navigate("community-feed")} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:border-cyan-400 dark:border-white/10 dark:text-slate-300">Community stream <ArrowRight size={12} /></button>
                    <button type="button" onClick={refresh} disabled={loading || refreshing} aria-label="Refresh Around you" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-50 dark:border-white/10 dark:hover:bg-slate-900"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /></button>
                  </div>
                </div>

                {marketplaceError && activeSurface === "pulse" ? (
                  <p role="status" className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-4 text-amber-900 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-100">{marketplaceError}</p>
                ) : null}
                {(loading || (activeSurface === "pulse" && marketplaceLoading && posts.length === 0)) ? (
                  <LoadingState />
                ) : aroundYouItems.length ? (
                  <div className="columns-2 gap-2.5 sm:gap-3">
                    {aroundYouItems.map((post, index) => {
                      const id = getPostId(post) || (getPostType(post) + "-" + index);
                      const hub = getPostHub(post);
                      const isMarketplaceListing = post?.__communitySource === "marketplace";
                      const edge = hub === "biashara" ? "bg-blue-500" : hub === "shamba" ? "bg-emerald-500" : hub === "elimu" ? "bg-violet-500" : "bg-cyan-500";
                      const rawPrice = Number(post?.price);
                      const priceText = Number.isFinite(rawPrice)
                        ? `${String(post?.currency || "KES").toUpperCase()} ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 }).format(rawPrice)}${post?.unit ? ` / ${post.unit}` : ""}`
                        : "";
                      return (
                        <article key={id} className="relative mb-3 break-inside-avoid overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-slate-900">
                          <span className={"absolute inset-x-0 top-0 h-1 " + edge} />
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black uppercase tracking-[0.1em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{getAroundYouKind(post)}</span>
                            <span className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">{hub}</span>
                          </div>
                          <h3 className="mt-3 line-clamp-2 break-words text-sm font-black leading-5 text-slate-950 dark:text-white">{getPostTitle(post)}</h3>
                          {getPostBody(post) ? <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600 dark:text-slate-300">{getPostBody(post)}</p> : null}
                          {isMarketplaceListing && priceText ? <p className="mt-3 text-sm font-black text-slate-950 dark:text-white">{priceText}</p> : null}
                          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400"><MapPin size={12} />{post?.location || post?.place || post?.area || "Location not shared"}</p>
                          <div className="mt-4 border-t border-slate-100 pt-3 dark:border-white/5">
                            <button type="button" onClick={() => { if (isMarketplaceListing) navigate("community-marketplace"); else setSelectedBoardPost(post); }} className="inline-flex min-h-9 w-full items-center justify-between gap-2 rounded-xl bg-slate-950 px-3 py-2 text-left text-xs font-black text-white transition hover:bg-slate-800 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300">
                              {isMarketplaceListing ? "View listing" : getAroundYouAction(post)} <ArrowRight size={13} />
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState icon={Compass} title="No needs or offers surfaced yet" description={activeSurface === "discovery" ? "The current discovery query returned no matching needs or offers. Try another intent or search term." : "The live Community service has not returned actionable needs or offers for this view. Nothing is fabricated; refresh later or search for a specific intent."} onAction={() => selectIntent("buy")} actionLabel="Explore things to buy" />
                )}
              </section>
              <CommunityAdSenseUnit />
            </>
          )}
        </main>

        {/* Desktop right-hand context panel */}
        <aside className="hidden min-w-0 xl:block">
          <div className="sticky top-4 space-y-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Your space</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-cyan-500 text-sm font-black text-slate-950" style={{ clipPath: "polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0 50%)" }}>{displayName.slice(0, 2).toUpperCase()}</span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-black text-slate-950 dark:text-white">{displayName}</span>
                  <span className="mt-0.5 block text-xs text-slate-400">Jumuiya member</span>
                </span>
              </div>
              <button type="button" onClick={() => navigate("community-me")} className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-left text-xs font-black text-slate-600 hover:border-cyan-400 dark:border-white/10 dark:text-slate-300">Open my space <ArrowRight size={12} className="ml-1 inline" /></button>
            </section>

            {workspacePage === "chats" ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                <h2 className="text-xs font-black text-slate-950 dark:text-white">Matter states</h2>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Open → Agreed → Done. Matter status, private messages, read state, presence and voice-note support must come from the backend.</p>
              </section>
            ) : (
              <>
                <section className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
                  <p className="px-1 text-xs font-black uppercase tracking-[0.14em] text-slate-400">Shortcuts</p>
                  <button type="button" onClick={() => navigate("community-marketplace")} className="mt-2 flex w-full items-center gap-2 rounded-xl px-2.5 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"><ShoppingBag size={14} /> Marketplace</button>
                  <button type="button" onClick={() => navigate("community-people")} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"><User size={14} /> Member directory</button>
                  <button type="button" onClick={() => navigate("community-invite-members")} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"><UserPlus size={14} /> Invite members</button>
                  <button type="button" onClick={() => navigate("community-feed")} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"><MessageCircle size={14} /> All activity</button>
                </section>
                {promotionPosts.length ? (
                  <section className="rounded-2xl border border-amber-300/40 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-950/20">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200"><Megaphone size={14} /><h2 className="text-xs font-black">Community promotions</h2></div>
                    <p className="mt-1 text-xs leading-4 text-slate-500 dark:text-slate-400">Promotions are shown only when returned by the live Community service.</p>
                    <div className="mt-3 space-y-2">
                      {promotionPosts.map((ad, index) => <button type="button" key={getPostId(ad) || ("promotion-" + index)} onClick={() => setSelectedBoardPost(ad)} className="w-full rounded-xl border border-amber-300/30 bg-white p-3 text-left dark:bg-slate-900"><span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-black uppercase text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">Sponsored / promotion</span><span className="mt-2 block line-clamp-2 text-xs font-black text-slate-900 dark:text-white">{getPostTitle(ad)}</span></button>)}
                    </div>
                  </section>
                ) : null}
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Floating phone navigation dock */}
      <nav aria-label="Jumuiya Community navigation" className="fixed bottom-3 left-1/2 z-[90] grid w-[min(94vw,420px)] -translate-x-1/2 grid-cols-5 items-end gap-1 rounded-[26px] border border-slate-200/90 bg-white/95 p-2 shadow-2xl shadow-slate-950/15 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 lg:hidden">
        <button type="button" onClick={() => navigate("community-home")} aria-current={workspacePage === "home" ? "page" : undefined} className={"flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs font-black " + (workspacePage === "home" ? "text-cyan-700 dark:text-cyan-300" : "text-slate-400")}>
          <Home size={18} /> Home
        </button>
        <button type="button" onClick={() => navigate("community-circles")} aria-current={workspacePage === "groups" ? "page" : undefined} className={"flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs font-black " + (workspacePage === "groups" ? "text-cyan-700 dark:text-cyan-300" : "text-slate-400")}>
          <Users size={18} /> Networks
        </button>
        <button type="button" onClick={openComposer} aria-label="Create a Jumuiya community matter" className="flex min-w-0 flex-col items-center justify-center gap-1 pb-1 text-xs font-black text-cyan-700 dark:text-cyan-300">
          <span className="-mt-5 flex h-14 w-14 items-center justify-center bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-600/25 transition active:scale-95" style={{ clipPath: "polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0 50%)" }}>
            <Plus size={25} strokeWidth={2.5} />
          </span>
          Create
        </button>
        <button type="button" onClick={() => navigate("community-chats")} aria-current={workspacePage === "chats" ? "page" : undefined} className={"flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs font-black " + (workspacePage === "chats" ? "text-cyan-700 dark:text-cyan-300" : "text-slate-400")}>
          <MessageCircle size={18} /> Matters
        </button>
        <button type="button" onClick={() => navigate("community-me")} aria-current={workspacePage === "me" ? "page" : undefined} className={"flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs font-black " + (workspacePage === "me" ? "text-cyan-700 dark:text-cyan-300" : "text-slate-400")}>
          <User size={18} /> My space
        </button>
      </nav>

      {selectedBoardPost ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:items-center sm:p-6" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setSelectedBoardPost(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="community-board-detail-title" className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-4 dark:border-white/10 sm:p-5">
              <div className="min-w-0">
                <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-300">{getAroundYouKind(selectedBoardPost)} · {getPostHub(selectedBoardPost)}</span>
                <h2 id="community-board-detail-title" className="mt-3 break-words text-lg font-black text-slate-950 dark:text-white">{getPostTitle(selectedBoardPost)}</h2>
              </div>
              <button type="button" onClick={() => setSelectedBoardPost(null)} aria-label="Close details" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-white/10"><X size={16} /></button>
            </div>
            <div className="p-4 sm:p-5">
              {getCommunityMediaItems(selectedBoardPost).length ? (
                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {getCommunityMediaItems(selectedBoardPost).map((media) => (
                    media.kind === "video" ? (
                      <video
                        key={media.id || media.url}
                        src={media.url}
                        controls
                        playsInline
                        preload="metadata"
                        className="max-h-[420px] w-full rounded-2xl border border-slate-200 bg-black dark:border-white/10"
                        aria-label={media.fileName || getPostTitle(selectedBoardPost)}
                      />
                    ) : (
                      <img
                        key={media.id || media.url}
                        src={media.url}
                        alt={media.fileName || getPostTitle(selectedBoardPost)}
                        loading="lazy"
                        className="max-h-[420px] w-full rounded-2xl border border-slate-200 bg-slate-100 object-contain dark:border-white/10 dark:bg-slate-950"
                      />
                    )
                  ))}
                </div>
              ) : null}
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600 dark:text-slate-300">{getPostBody(selectedBoardPost) || "No further description was shared."}</p>
              <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400"><MapPin size={14} />{selectedBoardPost?.location || selectedBoardPost?.place || selectedBoardPost?.area || "Location not shared"}</p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => { setSelectedBoardPost(null); navigate("community-feed"); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white dark:bg-cyan-400 dark:text-slate-950">Open Community activity <ArrowRight size={14} /></button>
                <button type="button" onClick={async () => { try { await handleLike(selectedBoardPost); setSelectedBoardPost(null); } catch (error) { setError(error?.message || "The reaction could not be saved."); } }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-700 dark:border-white/10 dark:text-slate-200"><Sparkles size={14} /> React to this item</button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
