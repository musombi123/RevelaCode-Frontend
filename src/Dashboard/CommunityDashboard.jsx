// src/Dashboard/CommunityDashboard.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  Bell,
  Briefcase,
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
  WalletCards,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";

import CommunityPostCard from "@/Dashboard/Community/components/CommunityPostCard.jsx";

// ============================================================
// COMMUNITY SURFACES
// ============================================================

const SURFACES = [
  {
    key: "pulse",
    label: "Pulse",
    eyebrow: "Useful now",
    description:
      "What is useful to you right now?",
    icon: Sparkles,
  },
  {
    key: "discovery",
    label: "Discovery",
    eyebrow: "Connect",
    description:
      "Who, what and where can you connect with?",
    icon: Compass,
  },
  {
    key: "groups",
    label: "Groups",
    eyebrow: "Belong",
    description:
      "Persistent communities around real interests.",
    icon: Users,
  },
  {
    key: "threads",
    label: "Threads",
    eyebrow: "Focus",
    description:
      "Structured conversations around one matter.",
    icon: MessageCircle,
  },
  {
    key: "actions",
    label: "Actions",
    eyebrow: "Do",
    description:
      "Apply, respond, enquire, join, buy, help or attend.",
    icon: Target,
  },
  {
    key: "trust",
    label: "Trust",
    eyebrow: "Confidence",
    description:
      "Identity, ownership, moderation and reputation.",
    icon: ShieldCheck,
  },
];

const PULSE_MODES = [
  {
    key: "relevant",
    label: "For you",
  },
  {
    key: "recent",
    label: "Recent",
  },
  {
    key: "nearby",
    label: "Nearby",
  },
  {
    key: "actionable",
    label: "Actionable",
  },
  {
    key: "trusted",
    label: "Trusted",
  },
];

const DISCOVERY_INTENTS = [
  {
    key: "",
    label: "Explore anything",
  },
  {
    key: "learn",
    label: "Learn",
  },
  {
    key: "find",
    label: "Find something",
  },
  {
    key: "connect",
    label: "Connect",
  },
  {
    key: "buy",
    label: "Buy",
  },
  {
    key: "sell",
    label: "Sell",
  },
  {
    key: "hire",
    label: "Hire",
  },
  {
    key: "work",
    label: "Find work",
  },
  {
    key: "help",
    label: "Get help",
  },
  {
    key: "join",
    label: "Join",
  },
  {
    key: "attend",
    label: "Attend",
  },
  {
    key: "collaborate",
    label: "Collaborate",
  },
];

// ============================================================
// HUB META
// ============================================================

const HUB_META = {
  community: {
    label: "Community",
    icon: Users,
  },
  biashara: {
    label: "Biashara",
    icon: Briefcase,
  },
  shamba: {
    label: "Shamba",
    icon: Leaf,
  },
  elimu: {
    label: "Elimu",
    icon: GraduationCap,
  },
  marketplace: {
    label: "Marketplace",
    icon: WalletCards,
  },
};

// ============================================================
// HELPERS
// ============================================================

function getDisplayName(user) {
  if (!user) {
    return "Member";
  }

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
  if (!name) {
    return "M";
  }

  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "M";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0].charAt(
    0,
  )}${parts[
    parts.length - 1
  ].charAt(0)}`.toUpperCase();
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
    post?.type ||
      post?.post_type ||
      "",
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

function getPostCategory(post) {
  return String(
    post?.category ||
      "",
  ).toLowerCase();
}

function getCreatedAt(post) {
  return (
    post?.created_at ||
    post?.createdAt ||
    post?.timestamp ||
    post?.published_at ||
    null
  );
}

function formatRelativeTime(value) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Recently";
  }

  const diff = Math.max(
    0,
    Date.now() - date.getTime(),
  );

  const minutes = Math.floor(
    diff / 60000,
  );

  const hours = Math.floor(
    diff / 3600000,
  );

  const days = Math.floor(
    diff / 86400000,
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString(
    "en-KE",
    {
      day: "numeric",
      month: "short",
    },
  );
}

function formatNumber(value) {
  const number =
    Number(value) || 0;

  if (number >= 1000000) {
    return `${(
      number / 1000000
    ).toFixed(1)}M`;
  }

  if (number >= 1000) {
    return `${(
      number / 1000
    ).toFixed(1)}K`;
  }

  return String(number);
}

function normalizeResponse(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    Array.isArray(
      response?.posts,
    )
  ) {
    return response.posts;
  }

  if (
    Array.isArray(
      response?.results,
    )
  ) {
    return response.results;
  }

  if (
    Array.isArray(
      response?.items,
    )
  ) {
    return response.items;
  }

  if (
    Array.isArray(
      response?.data,
    )
  ) {
    return response.data;
  }

  return [];
}

function getDiscoveryMeta(post) {
  return (
    post?.discovery ||
    null
  );
}

function getDiscoveryReason(post) {
  const discovery =
    getDiscoveryMeta(post);

  return (
    discovery?.reason ||
    post?._discovery_reason ||
    ""
  );
}

function getDiscoveryScore(post) {
  const discovery =
    getDiscoveryMeta(post);

  const score =
    discovery?.score ??
    post?._discovery_score;

  const parsed =
    Number(score);

  if (
    Number.isNaN(parsed)
  ) {
    return null;
  }

  return parsed;
}

function getAction(post) {
  if (
    post?.action &&
    typeof post.action ===
      "object"
  ) {
    return post.action;
  }

  return null;
}

// ============================================================
// SMALL PRESENTATION HELPERS
// ============================================================

function HubBadge({
  hub,
}) {
  const normalized =
    String(hub || "community")
      .toLowerCase();

  const meta =
    HUB_META[normalized] ||
    HUB_META.community;

  const Icon =
    meta.icon;

  return (
    <span
      className="
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        border-slate-200
        bg-white/80
        px-2.5
        py-1
        text-[10px]
        font-bold
        text-slate-600
        shadow-sm
        dark:border-white/10
        dark:bg-slate-900/80
        dark:text-slate-300
      "
    >
      <Icon
        size={11}
      />

      {meta.label}
    </span>
  );
}

function SignalBadge({
  children,
  icon: Icon = Sparkles,
}) {
  return (
    <span
      className="
        inline-flex
        items-center
        gap-1.5
        rounded-full
        bg-emerald-50
        px-2.5
        py-1
        text-[10px]
        font-bold
        text-emerald-700
        dark:bg-emerald-950/30
        dark:text-emerald-400
      "
    >
      <Icon
        size={11}
      />

      {children}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div
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
      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        <div
          className="
            h-11
            w-11
            rounded-full
            bg-slate-200
            dark:bg-slate-800
          "
        />

        <div className="flex-1 space-y-2">
          <div
            className="
              h-3
              w-36
              rounded
              bg-slate-200
              dark:bg-slate-800
            "
          />

          <div
            className="
              h-2.5
              w-24
              rounded
              bg-slate-100
              dark:bg-slate-800/70
            "
          />
        </div>
      </div>

      <div
        className="
          mt-5
          h-4
          w-3/4
          rounded
          bg-slate-200
          dark:bg-slate-800
        "
      />

      <div className="mt-3 space-y-2">
        <div
          className="
            h-3
            w-full
            rounded
            bg-slate-100
            dark:bg-slate-800/70
          "
        />

        <div
          className="
            h-3
            w-5/6
            rounded
            bg-slate-100
            dark:bg-slate-800/70
          "
        />
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  action,
}) {
  return (
    <div
      className="
        flex
        min-h-[300px]
        flex-col
        items-center
        justify-center
        rounded-[26px]
        border
        border-dashed
        border-slate-300
        bg-white
        px-6
        py-10
        text-center
        dark:border-white/10
        dark:bg-slate-900
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
        <Icon
          size={24}
        />
      </div>

      <h3
        className="
          mt-4
          text-base
          font-black
          text-slate-900
          dark:text-white
        "
      >
        {title}
      </h3>

      <p
        className="
          mt-2
          max-w-md
          text-sm
          leading-6
          text-slate-500
          dark:text-slate-400
        "
      >
        {description}
      </p>

      {action ? (
        <button
          type="button"
          onClick={
            action.onClick
          }
          className="
            mt-5
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-slate-900
            px-4
            py-2.5
            text-xs
            font-bold
            text-white
            transition
            hover:bg-slate-800
            dark:bg-white
            dark:text-slate-950
            dark:hover:bg-slate-100
          "
        >
          {action.label}
          <ArrowRight
            size={14}
          />
        </button>
      ) : null}
    </div>
  );
}

// ============================================================
// THREAD VIEW
// ============================================================

function ThreadsView({
  posts,
  onOpen,
}) {
  const threads =
    useMemo(
      () =>
        posts
          .filter((post) =>
            [
              "discussion",
              "question",
              "help_request",
              "insight",
              "project",
            ].includes(
              getPostType(post),
            ),
          )
          .slice(0, 12),
      [posts],
    );

  if (!threads.length) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="No focused threads yet"
        description="
          Threads turn broad Community conversations into focused matters:
          questions, help requests, decisions, ideas and projects.
        "
        action={
          onOpen
            ? {
                label: "Explore Pulse",
                onClick: onOpen,
              }
            : undefined
        }
      />
    );
  }

  return (
    <div
      className="
        space-y-3
      "
    >
      {threads.map(
        (
          post,
          index,
        ) => {
          const author =
            post?.author?.name ||
            post?.author_name ||
            post?.username ||
            "Community member";

          const type =
            getPostType(post);

          const title =
            post?.title ||
            post?.subject ||
            post?.body ||
            "Community thread";

          const comments =
            Number(
              post?.comments_count ??
                post?.comment_count ??
                0,
            );

          return (
            <button
              key={
                getPostId(post) ||
                `thread-${index}`
              }
              type="button"
              onClick={() =>
                onOpen?.(post)
              }
              className="
                group
                flex
                w-full
                items-start
                gap-4
                rounded-[22px]
                border
                border-slate-200
                bg-white
                p-4
                text-left
                transition
                hover:-translate-y-0.5
                hover:border-emerald-200
                hover:shadow-md
                dark:border-white/10
                dark:bg-slate-900
                dark:hover:border-emerald-500/20
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
                  rounded-2xl
                  bg-slate-100
                  text-slate-600
                  dark:bg-slate-800
                  dark:text-slate-300
                "
              >
                <MessageCircle
                  size={18}
                />
              </div>

              <div
                className="
                  min-w-0
                  flex-1
                "
              >
                <div
                  className="
                    flex
                    flex-wrap
                    items-center
                    gap-2
                  "
                >
                  <span
                    className="
                      rounded-full
                      bg-violet-50
                      px-2.5
                      py-1
                      text-[9px]
                      font-black
                      uppercase
                      tracking-wide
                      text-violet-700
                      dark:bg-violet-950/30
                      dark:text-violet-400
                    "
                  >
                    {type
                      .replace(
                        /_/g,
                        " ",
                      )}
                  </span>

                  <span
                    className="
                      text-[10px]
                      font-semibold
                      text-slate-400
                    "
                  >
                    {formatRelativeTime(
                      getCreatedAt(post),
                    )}
                  </span>
                </div>

                <h3
                  className="
                    mt-2
                    line-clamp-2
                    text-sm
                    font-black
                    leading-5
                    text-slate-900
                    dark:text-white
                  "
                >
                  {title}
                </h3>

                <div
                  className="
                    mt-2
                    flex
                    flex-wrap
                    items-center
                    gap-x-3
                    gap-y-1
                    text-[10px]
                    font-semibold
                    text-slate-400
                  "
                >
                  <span>
                    {author}
                  </span>

                  <span>
                    {comments} responses
                  </span>

                  <HubBadge
                    hub={getPostHub(
                      post,
                    )}
                  />
                </div>
              </div>

              <ArrowRight
                size={16}
                className="
                  mt-1
                  shrink-0
                  text-slate-300
                  transition
                  group-hover:translate-x-0.5
                  group-hover:text-emerald-500
                "
              />
            </button>
          );
        },
      )}
    </div>
  );
}

// ============================================================
// ACTION VIEW
// ============================================================

function ActionView({
  posts,
  onOpen,
}) {
  const actionable =
    useMemo(
      () =>
        posts
          .filter(
            (post) =>
              Boolean(
                getAction(
                  post,
                ),
              ) ||
              [
                "opportunity",
                "offer",
                "request",
                "event",
                "help_request",
                "project",
              ].includes(
                getPostType(post),
              ),
          )
          .slice(0, 12),
      [posts],
    );

  if (!actionable.length) {
    return (
      <EmptyState
        icon={Target}
        title="Nothing needs your action yet"
        description="
          When Community finds something you can meaningfully respond to,
          it appears here instead of being buried inside a normal feed.
        "
      />
    );
  }

  return (
    <div
      className="
        grid
        gap-3
        sm:grid-cols-2
      "
    >
      {actionable.map(
        (
          post,
          index,
        ) => {
          const action =
            getAction(post);

          const type =
            getPostType(post);

          const title =
            post?.title ||
            post?.subject ||
            "Community opportunity";

          const body =
            post?.body ||
            post?.content ||
            "";

          const actionType =
            action?.type ||
            (
              type ===
                "opportunity"
                ? "apply"
                : type ===
                  "event"
                ? "attend"
                : type ===
                  "help_request"
                ? "help"
                : "respond"
            );

          const actionLabel =
            action?.label ||
            actionType
              .replace(
                /_/g,
                " ",
              );

          return (
            <button
              key={
                getPostId(post) ||
                `action-${index}`
              }
              type="button"
              onClick={() =>
                onOpen?.(post)
              }
              className="
                group
                rounded-[24px]
                border
                border-slate-200
                bg-white
                p-5
                text-left
                shadow-sm
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
                  items-center
                  justify-between
                  gap-3
                "
              >
                <SignalBadge
                  icon={Target}
                >
                  {actionLabel}
                </SignalBadge>

                <HubBadge
                  hub={getPostHub(
                    post,
                  )}
                />
              </div>

              <h3
                className="
                  mt-4
                  line-clamp-2
                  text-base
                  font-black
                  leading-6
                  text-slate-900
                  dark:text-white
                "
              >
                {title}
              </h3>

              <p
                className="
                  mt-2
                  line-clamp-3
                  text-xs
                  leading-5
                  text-slate-500
                  dark:text-slate-400
                "
              >
                {body}
              </p>

              <div
                className="
                  mt-5
                  inline-flex
                  items-center
                  gap-1.5
                  text-xs
                  font-black
                  text-emerald-600
                  dark:text-emerald-400
                "
              >
                {actionLabel}
                <ArrowRight
                  size={14}
                  className="
                    transition
                    group-hover:translate-x-0.5
                  "
                />
              </div>
            </button>
          );
        },
      )}
    </div>
  );
}

// ============================================================
// TRUST VIEW
// ============================================================

function TrustView({
  posts,
  onOpen,
}) {
  const trusted =
    useMemo(
      () =>
        posts
          .filter(
            (post) =>
              Boolean(
                getDiscoveryScore(
                  post,
                ),
              ) ||
              Boolean(
                post?.author?.verified ||
                  post?.verified,
              ),
          )
          .slice(0, 10),
      [posts],
    );

  return (
    <div className="space-y-4">
      <div
        className="
          rounded-[24px]
          border
          border-emerald-200/70
          bg-emerald-50
          p-5
          dark:border-emerald-500/20
          dark:bg-emerald-950/20
        "
      >
        <div
          className="
            flex
            items-start
            gap-4
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
              rounded-2xl
              bg-white
              text-emerald-600
              shadow-sm
              dark:bg-slate-900
              dark:text-emerald-400
            "
          >
            <ShieldCheck
              size={21}
            />
          </div>

          <div>
            <h3
              className="
                text-sm
                font-black
                text-emerald-950
                dark:text-emerald-100
              "
            >
              Trust is a first-class
              Community signal.
            </h3>

            <p
              className="
                mt-1.5
                text-xs
                leading-5
                text-emerald-900/70
                dark:text-emerald-100/70
              "
            >
              Identity, ownership,
              verification, helpful
              behavior and moderation
              should influence confidence
              without turning Community
              into a popularity contest.
            </p>
          </div>
        </div>
      </div>

      {trusted.length ? (
        <div
          className="
            grid
            gap-3
          "
        >
          {trusted.map(
            (
              post,
              index,
            ) => {
              const reason =
                getDiscoveryReason(
                  post,
                ) ||
                "Selected using Community trust and relevance signals.";

              return (
                <button
                  key={
                    getPostId(post) ||
                    `trust-${index}`
                  }
                  type="button"
                  onClick={() =>
                    onOpen?.(post)
                  }
                  className="
                    group
                    flex
                    w-full
                    items-center
                    gap-4
                    rounded-[22px]
                    border
                    border-slate-200
                    bg-white
                    p-4
                    text-left
                    transition
                    hover:shadow-md
                    dark:border-white/10
                    dark:bg-slate-900
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
                      rounded-2xl
                      bg-emerald-50
                      text-emerald-600
                      dark:bg-emerald-950/30
                      dark:text-emerald-400
                    "
                  >
                    <ShieldCheck
                      size={18}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div
                      className="
                        flex
                        flex-wrap
                        items-center
                        gap-2
                      "
                    >
                      <span
                        className="
                          text-xs
                          font-black
                          text-slate-900
                          dark:text-white
                        "
                      >
                        {post?.author?.name ||
                          post?.author_name ||
                          "Community member"}
                      </span>

                      {post?.author
                        ?.verified ||
                      post?.verified ? (
                        <span
                          className="
                            rounded-full
                            bg-emerald-100
                            px-2
                            py-0.5
                            text-[9px]
                            font-black
                            text-emerald-700
                            dark:bg-emerald-950/50
                            dark:text-emerald-400
                          "
                        >
                          Verified
                        </span>
                      ) : null}
                    </div>

                    <p
                      className="
                        mt-1
                        line-clamp-2
                        text-xs
                        leading-5
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      {reason}
                    </p>
                  </div>

                  <ArrowRight
                    size={16}
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
            },
          )}
        </div>
      ) : (
        <EmptyState
          icon={ShieldCheck}
          title="Trust signals are building"
          description="
            As Community activity and verification data become available,
            trusted discovery will become more useful.
          "
        />
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function CommunityDashboard({
  onNavigate,
}) {
  const { user } =
    useAuth();

  const {
    get,
    reactToCommunityPost,
  } = useJumuiyaApi();

  const displayName =
    useMemo(
      () =>
        getDisplayName(user),
      [user],
    );

  const initials =
    useMemo(
      () =>
        getInitials(
          displayName,
        ),
      [displayName],
    );

  const [
    activeSurface,
    setActiveSurface,
  ] = useState("pulse");

  const [
    pulseMode,
    setPulseMode,
  ] = useState("relevant");

  const [
    discoveryQuery,
    setDiscoveryQuery,
  ] = useState("");

  const [
    discoveryIntent,
    setDiscoveryIntent,
  ] = useState("");

  const [
    posts,
    setPosts,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigate =
    useCallback(
      (destination) => {
        if (
          typeof onNavigate ===
          "function"
        ) {
          onNavigate(
            destination,
          );
          return true;
        }

        return false;
      },
      [onNavigate],
    );

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const loadSurface =
    useCallback(
      async (
        options = {},
      ) => {
        const {
          silent = false,
          surface = activeSurface,
        } = options;

        try {
          setError("");

          if (silent) {
            setRefreshing(
              true,
            );
          } else {
            setLoading(true);
          }

          let endpoint =
            "/community/pulse";

          const params =
            new URLSearchParams();

          params.set(
            "limit",
            "30",
          );

          // -----------------------------------------------
          // PULSE
          // -----------------------------------------------

          if (
            surface ===
            "pulse"
          ) {
            endpoint =
              "/community/pulse";

            if (
              pulseMode
            ) {
              params.set(
                "mode",
                pulseMode,
              );
            }
          }

          // -----------------------------------------------
          // DISCOVERY
          // -----------------------------------------------

          if (
            surface ===
            "discovery"
          ) {
            endpoint =
              "/community/discovery";

            if (
              discoveryQuery.trim()
            ) {
              params.set(
                "q",
                discoveryQuery.trim(),
              );
            }

            if (
              discoveryIntent
            ) {
              params.set(
                "intent",
                discoveryIntent,
              );
            }
          }

          // -----------------------------------------------
          // NEARBY
          // -----------------------------------------------

          if (
            surface ===
            "nearby"
          ) {
            endpoint =
              "/community/nearby";
          }

          // -----------------------------------------------
          // ACTIONS
          // -----------------------------------------------

          if (
            surface ===
            "actions"
          ) {
            endpoint =
              "/community/opportunities";
          }

          // -----------------------------------------------
          // TRUST
          // -----------------------------------------------

          if (
            surface ===
            "trust"
          ) {
            endpoint =
              "/community/trusted";
          }

          // -----------------------------------------------
          // EXPLORATION
          // -----------------------------------------------

          if (
            surface ===
            "exploration"
          ) {
            endpoint =
              "/community/exploration";
          }

          const suffix =
            params.toString();

          const response =
            await get(
              `${endpoint}${
                suffix
                  ? `?${suffix}`
                  : ""
              }`,
            );

          setPosts(
            normalizeResponse(
              response,
            ),
          );
        } catch (
          requestError
        ) {
          console.error(
            "Community surface load failed:",
            requestError,
          );

          setPosts([]);

          setError(
            requestError?.message ||
              "Unable to load Community right now.",
          );
        } finally {
          setLoading(
            false,
          );
          setRefreshing(
            false,
          );
        }
      },
      [
        activeSurface,
        discoveryIntent,
        discoveryQuery,
        get,
        pulseMode,
      ],
    );

  // ==========================================================
  // INITIAL / SURFACE RELOAD
  // ==========================================================

  useEffect(
    () => {
      if (
        activeSurface ===
        "groups"
      ) {
        setLoading(
          false,
        );
        setPosts([]);
        return;
      }

      let surface =
        activeSurface;

      if (
        activeSurface ===
        "threads"
      ) {
        surface =
          "pulse";
      }

      loadSurface({
        surface,
      });
    },
    [
      activeSurface,
      loadSurface,
    ],
  );

  // ==========================================================
  // REFRESH
  // ==========================================================

  const refresh =
    useCallback(
      () => {
        if (
          activeSurface ===
          "groups"
        ) {
          return;
        }

        const surface =
          activeSurface ===
          "threads"
            ? "pulse"
            : activeSurface;

        return loadSurface({
          silent: true,
          surface,
        });
      },
      [
        activeSurface,
        loadSurface,
      ],
    );

  // ==========================================================
  // OPEN POST
  // ==========================================================

  const openPost =
    useCallback(
      (post) => {
        // Keep navigation compatible with the existing Community
        // Feed rather than introducing a new route prematurely.
        if (
          navigate(
            "community-feed",
          )
        ) {
          return;
        }

        console.info(
          "Community post:",
          post,
        );
      },
      [navigate],
    );

  // ==========================================================
  // LIKE
  // ==========================================================

  const handleLike =
    useCallback(
      async (
        post,
      ) => {
        const id =
          getPostId(post);

        if (!id) {
          throw new Error(
            "Community post id is missing.",
          );
        }

        await reactToCommunityPost(
          id,
        );
      },
      [reactToCommunityPost],
    );

  // ==========================================================
  // CREATE
  // ==========================================================

  const openComposer =
    useCallback(
      () => {
        navigate(
          "community-composer",
        );
      },
      [navigate],
    );

  // ==========================================================
  // SURFACE SELECTION
  // ==========================================================

  const handleSurface =
    useCallback(
      (key) => {
        setError("");

        if (
          key ===
          "groups"
        ) {
          setActiveSurface(
            key,
          );
          return;
        }

        setActiveSurface(
          key,
        );
      },
      [],
    );

  // ==========================================================
  // DISCOVERY SEARCH
  // ==========================================================

  const handleDiscoverySearch =
    useCallback(
      (event) => {
        event.preventDefault();

        if (
          activeSurface !==
          "discovery"
        ) {
          setActiveSurface(
            "discovery",
          );

          return;
        }

        loadSurface({
          surface:
            "discovery",
        });
      },
      [
        activeSurface,
        loadSurface,
      ],
    );

  // ==========================================================
  // DERIVED
  // ==========================================================

  const activeMeta =
    useMemo(
      () =>
        SURFACES.find(
          (item) =>
            item.key ===
            activeSurface,
        ) ||
        SURFACES[0],
      [activeSurface],
    );

  const ActiveIcon =
    activeMeta.icon;

  const pulsePosts =
    useMemo(
      () =>
        posts.slice(0, 12),
      [posts],
    );

  const nearbyCount =
    useMemo(
      () =>
        posts.filter(
          (post) =>
            Boolean(
              post?.location,
            ),
        ).length,
      [posts],
    );

  const actionableCount =
    useMemo(
      () =>
        posts.filter(
          (post) =>
            Boolean(
              getAction(post),
            ) ||
            [
              "opportunity",
              "offer",
              "request",
              "event",
              "help_request",
              "project",
            ].includes(
              getPostType(post),
            ),
        ).length,
      [posts],
    );

  const threadCount =
    useMemo(
      () =>
        posts.filter(
          (post) =>
            [
              "discussion",
              "question",
              "help_request",
              "insight",
              "project",
            ].includes(
              getPostType(post),
            ),
        ).length,
      [posts],
    );

  const trustCount =
    useMemo(
      () =>
        posts.filter(
          (post) =>
            getDiscoveryScore(
              post,
            ) !== null ||
            Boolean(
              post?.author
                ?.verified ||
                post?.verified,
            ),
        ).length,
      [posts],
    );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <JumuiyaDashboardShell
      title="Community"
      subtitle="
        A living layer connecting people, knowledge,
        opportunities and action across Jumuiya.
      "
      activeHub="community"
      user={user}
      onNavigate={onNavigate}
    >
      <div
        className="
          space-y-5
          pb-12
        "
      >

        {/* ======================================================
            HERO
        ====================================================== */}

        <section
          className="
            relative
            overflow-hidden
            rounded-[30px]
            border
            border-slate-200
            bg-slate-950
            text-white
            shadow-xl
            dark:border-white/10
          "
        >
          <div
            className="
              absolute
              -right-16
              -top-16
              h-56
              w-56
              rounded-full
              bg-emerald-500/20
              blur-3xl
            "
          />

          <div
            className="
              absolute
              -bottom-24
              left-1/3
              h-72
              w-72
              rounded-full
              bg-cyan-400/10
              blur-3xl
            "
          />

          <div
            className="
              relative
              z-10
              px-5
              py-6
              sm:px-7
              sm:py-8
            "
          >
            <div
              className="
                flex
                flex-col
                gap-6
                xl:flex-row
                xl:items-end
                xl:justify-between
              "
            >
              <div
                className="
                  max-w-3xl
                "
              >
                <div
                  className="
                    flex
                    flex-wrap
                    items-center
                    gap-2
                  "
                >
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-2
                      rounded-full
                      border
                      border-white/10
                      bg-white/5
                      px-3
                      py-1.5
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.16em]
                      text-emerald-300
                    "
                  >
                    <Sparkles
                      size={12}
                    />

                    Jumuiya Community
                  </span>

                  <span
                    className="
                      rounded-full
                      border
                      border-white/10
                      px-3
                      py-1.5
                      text-[10px]
                      font-bold
                      text-white/60
                    "
                  >
                    {activeMeta.eyebrow}
                  </span>
                </div>

                <h1
                  className="
                    mt-4
                    max-w-2xl
                    text-2xl
                    font-black
                    leading-tight
                    tracking-tight
                    sm:text-3xl
                    lg:text-4xl
                  "
                >
                  Community is about
                  usefulness, not noise.
                </h1>

                <p
                  className="
                    mt-3
                    max-w-2xl
                    text-sm
                    leading-6
                    text-white/65
                    sm:text-base
                  "
                >
                  {activeMeta.description}
                  {" "}
                  Your Community surface
                  changes according to what
                  you are trying to discover,
                  understand or do.
                </p>

                <div
                  className="
                    mt-5
                    flex
                    flex-wrap
                    gap-2
                  "
                >
                  <SignalBadge
                    icon={Sparkles}
                  >
                    Relevance first
                  </SignalBadge>

                  <SignalBadge
                    icon={MapPin}
                  >
                    Local context
                  </SignalBadge>

                  <SignalBadge
                    icon={ShieldCheck}
                  >
                    Trust aware
                  </SignalBadge>

                  <SignalBadge
                    icon={Target}
                  >
                    Actionable
                  </SignalBadge>
                </div>
              </div>

              <div
                className="
                  flex
                  shrink-0
                  items-center
                  gap-3
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
                    border
                    border-white/10
                    bg-white/5
                    text-lg
                    font-black
                    backdrop-blur
                  "
                  title={
                    displayName
                  }
                >
                  {initials}
                </div>

                <button
                  type="button"
                  onClick={
                    openComposer
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-white
                    px-4
                    py-3
                    text-xs
                    font-black
                    text-slate-950
                    transition
                    hover:bg-emerald-50
                    active:scale-[0.98]
                  "
                >
                  <Plus
                    size={15}
                  />

                  Start something
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            SIX COMMUNITY PILLARS
        ====================================================== */}

        <section>
          <div
            className="
              overflow-x-auto
              pb-1
              [scrollbar-width:none]
            "
          >
            <div
              className="
                flex
                min-w-max
                gap-2
              "
            >
              {SURFACES.map(
                (
                  surface,
                ) => {
                  const Icon =
                    surface.icon;

                  const active =
                    activeSurface ===
                    surface.key;

                  return (
                    <button
                      key={
                        surface.key
                      }
                      type="button"
                      onClick={() =>
                        handleSurface(
                          surface.key,
                        )
                      }
                      className={`
                        group
                        flex
                        min-w-[132px]
                        items-center
                        gap-3
                        rounded-2xl
                        border
                        px-3.5
                        py-3
                        text-left
                        transition
                        ${
                          active
                            ? `
                              border-emerald-500
                              bg-emerald-600
                              text-white
                              shadow-lg
                              shadow-emerald-900/10
                            `
                            : `
                              border-slate-200
                              bg-white
                              text-slate-700
                              hover:border-emerald-200
                              hover:bg-emerald-50
                              dark:border-white/10
                              dark:bg-slate-900
                              dark:text-slate-300
                              dark:hover:border-emerald-500/20
                              dark:hover:bg-emerald-950/20
                            `
                        }
                      `}
                    >
                      <span
                        className={`
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          ${
                            active
                              ? "bg-white/15"
                              : "bg-slate-100 dark:bg-slate-800"
                          }
                        `}
                      >
                        <Icon
                          size={16}
                        />
                      </span>

                      <span
                        className="
                          min-w-0
                        "
                      >
                        <span
                          className="
                            block
                            text-xs
                            font-black
                          "
                        >
                          {
                            surface.label
                          }
                        </span>

                        <span
                          className={`
                            mt-0.5
                            block
                            text-[9px]
                            font-semibold
                            ${
                              active
                                ? "text-white/65"
                                : "text-slate-400"
                            }
                          `}
                        >
                          {
                            surface.eyebrow
                          }
                        </span>
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </div>
        </section>

        {/* ======================================================
            PULSE CONTROLS
        ====================================================== */}

        {activeSurface ===
        "pulse" ? (
          <section
            className="
              rounded-[24px]
              border
              border-slate-200
              bg-white
              p-4
              shadow-sm
              dark:border-white/10
              dark:bg-slate-900
              sm:p-5
            "
          >
            <div
              className="
                flex
                flex-col
                gap-4
                lg:flex-row
                lg:items-center
                lg:justify-between
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
                    size={17}
                    className="
                      text-emerald-600
                      dark:text-emerald-400
                    "
                  />

                  <h2
                    className="
                      text-sm
                      font-black
                      text-slate-900
                      dark:text-white
                    "
                  >
                    Your Pulse
                  </h2>
                </div>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-400
                  "
                >
                  Ranked around usefulness
                  rather than raw popularity.
                </p>
              </div>

              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
              >
                {PULSE_MODES.map(
                  (mode) => (
                    <button
                      key={
                        mode.key
                      }
                      type="button"
                      onClick={() =>
                        setPulseMode(
                          mode.key,
                        )
                      }
                      className={`
                        rounded-full
                        px-3
                        py-1.5
                        text-[10px]
                        font-black
                        transition
                        ${
                          pulseMode ===
                          mode.key
                            ? `
                              bg-slate-900
                              text-white
                              dark:bg-white
                              dark:text-slate-950
                            `
                            : `
                              bg-slate-100
                              text-slate-500
                              hover:bg-slate-200
                              dark:bg-slate-800
                              dark:text-slate-400
                              dark:hover:bg-slate-700
                            `
                        }
                      `}
                    >
                      {
                        mode.label
                      }
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={
                    refresh
                  }
                  disabled={
                    refreshing
                  }
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-slate-200
                    text-slate-500
                    transition
                    hover:bg-slate-50
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    dark:border-white/10
                    dark:text-slate-400
                    dark:hover:bg-white/5
                  "
                  title="Refresh"
                >
                  <RefreshCw
                    size={14}
                    className={
                      refreshing
                        ? "animate-spin"
                        : ""
                    }
                  />
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {/* ======================================================
            DISCOVERY CONTROLS
        ====================================================== */}

        {activeSurface ===
        "discovery" ? (
          <section
            className="
              rounded-[24px]
              border
              border-slate-200
              bg-white
              p-4
              shadow-sm
              dark:border-white/10
              dark:bg-slate-900
              sm:p-5
            "
          >
            <form
              onSubmit={
                handleDiscoverySearch
              }
              className="
                flex
                flex-col
                gap-3
                lg:flex-row
                lg:items-center
              "
            >
              <div
                className="
                  relative
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
                  value={
                    discoveryQuery
                  }
                  onChange={(event) =>
                    setDiscoveryQuery(
                      event.target
                        .value,
                    )
                  }
                  placeholder="
                    Search people, opportunities,
                    knowledge, places...
                  "
                  className="
                    h-12
                    w-full
                    rounded-2xl
                    border
                    border-slate-200
                    bg-slate-50
                    pl-11
                    pr-4
                    text-sm
                    font-medium
                    text-slate-900
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-emerald-400
                    focus:bg-white
                    dark:border-white/10
                    dark:bg-slate-800
                    dark:text-white
                    dark:focus:bg-slate-800
                  "
                />

                {discoveryQuery ? (
                  <button
                    type="button"
                    onClick={() =>
                      setDiscoveryQuery(
                        "",
                      )
                    }
                    className="
                      absolute
                      right-3
                      top-1/2
                      flex
                      h-8
                      w-8
                      -translate-y-1/2
                      items-center
                      justify-center
                      rounded-full
                      text-slate-400
                      hover:bg-slate-200
                      hover:text-slate-700
                      dark:hover:bg-slate-700
                      dark:hover:text-white
                    "
                    aria-label="Clear search"
                  >
                    <X
                      size={14}
                    />
                  </button>
                ) : null}
              </div>

              <select
                value={
                  discoveryIntent
                }
                onChange={(event) =>
                  setDiscoveryIntent(
                    event.target.value,
                  )
                }
                className="
                  h-12
                  rounded-2xl
                  border
                  border-slate-200
                  bg-slate-50
                  px-4
                  text-xs
                  font-bold
                  text-slate-700
                  outline-none
                  focus:border-emerald-400
                  dark:border-white/10
                  dark:bg-slate-800
                  dark:text-slate-300
                "
              >
                {DISCOVERY_INTENTS.map(
                  (intent) => (
                    <option
                      key={
                        intent.key ||
                        "all"
                      }
                      value={
                        intent.key
                      }
                    >
                      {
                        intent.label
                      }
                    </option>
                  ),
                )}
              </select>

              <button
                type="submit"
                className="
                  inline-flex
                  h-12
                  shrink-0
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  bg-slate-900
                  px-5
                  text-xs
                  font-black
                  text-white
                  transition
                  hover:bg-slate-800
                  active:scale-[0.98]
                  dark:bg-white
                  dark:text-slate-950
                  dark:hover:bg-slate-100
                "
              >
                <Compass
                  size={15}
                />

                Discover
              </button>
            </form>

            <div
              className="
                mt-3
                flex
                flex-wrap
                gap-2
              "
            >
              {[
                "business",
                "opportunities",
                "technology",
                "education",
                "agriculture",
                "services",
              ].map(
                (suggestion) => (
                  <button
                    key={
                      suggestion
                    }
                    type="button"
                    onClick={() => {
                      setDiscoveryQuery(
                        suggestion,
                      );
                      setTimeout(
                        () =>
                          loadSurface({
                            surface:
                              "discovery",
                          }),
                        0,
                      );
                    }}
                    className="
                      rounded-full
                      border
                      border-slate-200
                      bg-white
                      px-3
                      py-1.5
                      text-[10px]
                      font-bold
                      text-slate-500
                      transition
                      hover:border-emerald-200
                      hover:bg-emerald-50
                      hover:text-emerald-700
                      dark:border-white/10
                      dark:bg-slate-900
                      dark:text-slate-400
                      dark:hover:border-emerald-500/20
                      dark:hover:bg-emerald-950/20
                      dark:hover:text-emerald-400
                    "
                  >
                    {suggestion}
                  </button>
                ),
              )}
            </div>
          </section>
        ) : null}

        {/* ======================================================
            CONTEXT STRIP
        ====================================================== */}

        <section
          className="
            grid
            grid-cols-2
            gap-3
            lg:grid-cols-4
          "
        >
          <div
            className="
              rounded-[20px]
              border
              border-slate-200
              bg-white
              p-4
              dark:border-white/10
              dark:bg-slate-900
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-2
              "
            >
              <span
                className="
                  text-[10px]
                  font-black
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Current view
              </span>

              <ActiveIcon
                size={15}
                className="
                  text-emerald-500
                "
              />
            </div>

            <p
              className="
                mt-2
                text-sm
                font-black
                text-slate-900
                dark:text-white
              "
            >
              {activeMeta.label}
            </p>

            <p
              className="
                mt-1
                text-[10px]
                font-semibold
                text-slate-400
              "
            >
              {activeMeta.eyebrow}
            </p>
          </div>

          <div
            className="
              rounded-[20px]
              border
              border-slate-200
              bg-white
              p-4
              dark:border-white/10
              dark:bg-slate-900
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-2
              "
            >
              <span
                className="
                  text-[10px]
                  font-black
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Threads
              </span>

              <MessageCircle
                size={15}
                className="
                  text-violet-500
                "
              />
            </div>

            <p
              className="
                mt-2
                text-sm
                font-black
                text-slate-900
                dark:text-white
              "
            >
              {formatNumber(
                threadCount,
              )}
            </p>

            <p
              className="
                mt-1
                text-[10px]
                font-semibold
                text-slate-400
              "
            >
              Focused matters
            </p>
          </div>

          <div
            className="
              rounded-[20px]
              border
              border-slate-200
              bg-white
              p-4
              dark:border-white/10
              dark:bg-slate-900
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-2
              "
            >
                <span
                  className="
                    text-[10px]
                    font-black
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  Action
                </span>

              <Target
                size={15}
                className="
                  text-amber-500
                "
              />
            </div>

            <p
              className="
                mt-2
                text-sm
                font-black
                text-slate-900
                dark:text-white
              "
            >
              {formatNumber(
                actionableCount,
              )}
            </p>

            <p
              className="
                mt-1
                text-[10px]
                font-semibold
                text-slate-400
              "
            >
              Things you can do
            </p>
          </div>

          <div
            className="
              rounded-[20px]
              border
              border-slate-200
              bg-white
              p-4
              dark:border-white/10
              dark:bg-slate-900
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-2
              "
            >
                <span
                  className="
                    text-[10px]
                    font-black
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  Trust
                </span>

                <ShieldCheck
                  size={15}
                  className="
                    text-emerald-500
                  "
                />
              </div>

              <p
                className="
                  mt-2
                  text-sm
                  font-black
                  text-slate-900
                  dark:text-white
                "
              >
                {formatNumber(
                  trustCount,
                )}
              </p>

              <p
                className="
                  mt-1
                  text-[10px]
                  font-semibold
                  text-slate-400
                "
              >
                Trust-aware results
              </p>
            </div>
        </section>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error ? (
          <div
            className="
              rounded-[22px]
              border
              border-rose-200
              bg-rose-50
              px-4
              py-3
              text-xs
              font-semibold
              text-rose-700
              dark:border-rose-500/20
              dark:bg-rose-950/20
              dark:text-rose-300
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
                  min-w-0
                  flex-1
                "
              >
                {error}
              </div>

              <button
                type="button"
                onClick={() =>
                  setError(
                    "",
                  )
                }
                className="
                  shrink-0
                  rounded-lg
                  p-1
                  text-rose-400
                  hover:bg-rose-100
                  hover:text-rose-700
                  dark:hover:bg-rose-900/30
                "
                aria-label="Dismiss error"
              >
                <X
                  size={14}
                />
              </button>
            </div>
          </div>
        ) : null}

        {/* ======================================================
            SURFACE CONTENT
        ====================================================== */}

        <section
          className="
            grid
            gap-5
            xl:grid-cols-[minmax(0,1fr)_310px]
          "
        >
          {/* ====================================================
              MAIN
          ==================================================== */}

          <div
            className="
              min-w-0
            "
          >
            {activeSurface ===
            "groups" ? (
              <EmptyState
                icon={Users}
                title="Groups are communities with memory"
                description="
                  Groups will become persistent spaces around real interests,
                  professions, institutions, places and projects. The existing
                  Groups workspace remains available while the group backend
                  grows into this model.
                "
                action={{
                  label:
                    "Open Groups",
                  onClick: () =>
                    navigate(
                      "community-groups",
                    ),
                }}
              />
            ) : activeSurface ===
              "threads" ? (
              loading ? (
                <div
                  className="
                    space-y-3
                  "
                >
                  {[
                    1,
                    2,
                    3,
                    4,
                  ].map(
                    (item) => (
                      <SkeletonCard
                        key={
                          item
                        }
                      />
                    ),
                  )}
                </div>
              ) : (
                <ThreadsView
                  posts={posts}
                  onOpen={
                    openPost
                  }
                />
              )
            ) : activeSurface ===
              "actions" ? (
              loading ? (
                <div
                  className="
                    grid
                    gap-3
                    sm:grid-cols-2
                  "
                >
                  {[
                    1,
                    2,
                    3,
                    4,
                  ].map(
                    (item) => (
                      <SkeletonCard
                        key={
                          item
                        }
                      />
                    ),
                  )}
                </div>
              ) : (
                <ActionView
                  posts={posts}
                  onOpen={
                    openPost
                  }
                />
              )
            ) : activeSurface ===
              "trust" ? (
              loading ? (
                <div
                  className="
                    space-y-3
                  "
                >
                  {[
                    1,
                    2,
                    3,
                  ].map(
                    (item) => (
                      <SkeletonCard
                        key={
                          item
                        }
                      />
                    ),
                  )}
                </div>
              ) : (
                <TrustView
                  posts={posts}
                  onOpen={
                    openPost
                  }
                />
              )
            ) : loading ? (
              <div
                className="
                  space-y-5
                "
              >
                {[
                  1,
                  2,
                  3,
                ].map(
                  (item) => (
                    <SkeletonCard
                      key={
                        item
                      }
                    />
                  ),
                )}
              </div>
            ) : posts.length ? (
              <div
                className="
                  space-y-5
                "
              >
                {pulsePosts.map(
                  (
                    post,
                  ) => {
                    const reason =
                      getDiscoveryReason(
                        post,
                      );

                    const score =
                      getDiscoveryScore(
                        post,
                      );

                    return (
                      <div
                        key={
                          getPostId(
                            post,
                          ) ||
                          `${getPostType(
                            post,
                          )}-${getCreatedAt(
                            post,
                          )}`
                        }
                        className="
                          space-y-2
                        "
                      >
                        {(reason ||
                          score !==
                            null) ? (
                          <div
                            className="
                              flex
                              flex-wrap
                              items-center
                              gap-2
                              px-1
                            "
                          >
                            <SignalBadge
                              icon={
                                Sparkles
                              }
                            >
                              {reason ||
                                "Selected for Community relevance"}
                            </SignalBadge>

                            {score !==
                            null ? (
                              <span
                                className="
                                  text-[9px]
                                  font-bold
                                  text-slate-400
                                "
                              >
                                Relevance{" "}
                                {score.toFixed(
                                  0,
                                )}
                              </span>
                            ) : null}
                          </div>
                        ) : null}

                        <CommunityPostCard
                          post={
                            post
                          }
                          currentUser={
                            user
                          }
                          onOpen={
                            openPost
                          }
                          onLike={
                            handleLike
                          }
                        />
                      </div>
                    );
                  },
                )}
              </div>
            ) : (
              <EmptyState
                icon={
                  activeSurface ===
                  "discovery"
                    ? Compass
                    : Sparkles
                }
                title={
                  activeSurface ===
                  "discovery"
                    ? "Nothing matched yet"
                    : "Your Pulse is quiet"
                }
                description={
                  activeSurface ===
                  "discovery"
                    ? "Try a broader search or a different intent. Discovery will grow as Jumuiya connects more people and resources."
                    : "There is not enough current Community activity to build a useful surface yet."
                }
                action={{
                  label:
                    "Start a conversation",
                  onClick:
                    openComposer,
                }}
              />
            )}
          </div>

          {/* ====================================================
              RIGHT RAIL
          ==================================================== */}

          <aside
            className="
              hidden
              space-y-4
              xl:block
            "
          >
            {/* -----------------------------------------------
                NOW
            ----------------------------------------------- */}

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
                  items-center
                  gap-2
                "
              >
                <Sparkles
                  size={16}
                  className="
                    text-emerald-500
                  "
                />

                <h3
                  className="
                    text-sm
                    font-black
                    text-slate-900
                    dark:text-white
                  "
                >
                  Right now
                </h3>
              </div>

              <p
                className="
                  mt-2
                  text-xs
                  leading-5
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Community should
                answer one simple
                question:
                <span
                  className="
                    font-bold
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  {" "}
                  what can make your
                  next step better?
                </span>
              </p>

              <div
                className="
                  mt-4
                  space-y-2
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    setActiveSurface(
                      "discovery",
                    )
                  }
                  className="
                    flex
                    w-full
                    items-center
                    justify-between
                    rounded-xl
                    bg-slate-50
                    px-3
                    py-2.5
                    text-left
                    transition
                    hover:bg-emerald-50
                    dark:bg-slate-800
                    dark:hover:bg-emerald-950/20
                  "
                >
                  <span
                    className="
                      text-[10px]
                      font-bold
                      text-slate-600
                      dark:text-slate-300
                    "
                  >
                    Find something
                  </span>

                  <ArrowRight
                    size={13}
                    className="
                      text-slate-400
                    "
                  />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveSurface(
                      "actions",
                    )
                  }
                  className="
                    flex
                    w-full
                    items-center
                    justify-between
                    rounded-xl
                    bg-slate-50
                    px-3
                    py-2.5
                    text-left
                    transition
                    hover:bg-emerald-50
                    dark:bg-slate-800
                    dark:hover:bg-emerald-950/20
                  "
                >
                  <span
                    className="
                      text-[10px]
                      font-bold
                      text-slate-600
                      dark:text-slate-300
                    "
                  >
                    See opportunities
                  </span>

                  <ArrowRight
                    size={13}
                    className="
                      text-slate-400
                    "
                  />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveSurface(
                      "nearby",
                    )
                  }
                  className="
                    flex
                    w-full
                    items-center
                    justify-between
                    rounded-xl
                    bg-slate-50
                    px-3
                    py-2.5
                    text-left
                    transition
                    hover:bg-emerald-50
                    dark:bg-slate-800
                    dark:hover:bg-emerald-950/20
                  "
                >
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-2
                      text-[10px]
                      font-bold
                      text-slate-600
                      dark:text-slate-300
                    "
                  >
                    <MapPin
                      size={12}
                    />

                    Nearby
                  </span>

                  <span
                    className="
                      rounded-full
                      bg-white
                      px-2
                      py-0.5
                      text-[9px]
                      font-black
                      text-slate-500
                      dark:bg-slate-900
                    "
                  >
                    {nearbyCount}
                  </span>
                </button>
              </div>
            </div>

            {/* -----------------------------------------------
                COMMUNITY PRINCIPLES
            ----------------------------------------------- */}

            <div
              className="
                rounded-[24px]
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
                  flex
                  items-center
                  gap-2
                "
              >
                <ShieldCheck
                  size={16}
                  className="
                    text-emerald-500
                  "
                />

                <h3
                  className="
                    text-sm
                    font-black
                    text-slate-900
                    dark:text-white
                  "
                >
                  Community principles
                </h3>
              </div>

              <div
                className="
                  mt-4
                  space-y-3
                "
              >
                {[
                  [
                    "Useful beats loud",
                    "Popularity is not the same as value.",
                  ],
                  [
                    "Context matters",
                    "Location, intent and relevance shape discovery.",
                  ],
                  [
                    "Action creates value",
                    "A conversation should be able to become a real next step.",
                  ],
                  [
                    "Trust matters",
                    "Identity and responsible participation increase confidence.",
                  ],
                ].map(
                  (
                    item,
                  ) => (
                    <div
                      key={
                        item[0]
                      }
                    >
                      <p
                        className="
                          text-[10px]
                          font-black
                          text-slate-700
                          dark:text-slate-200
                        "
                      >
                        {item[0]}
                      </p>

                      <p
                        className="
                          mt-0.5
                          text-[10px]
                          leading-4
                          text-slate-400
                        "
                      >
                        {item[1]}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* -----------------------------------------------
                CONNECTED HUBS
            ----------------------------------------------- */}

            <div
              className="
                rounded-[24px]
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
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <div>
                  <h3
                    className="
                      text-sm
                      font-black
                      text-slate-900
                      dark:text-white
                    "
                  >
                    Across Jumuiya
                  </h3>

                  <p
                    className="
                      mt-1
                      text-[10px]
                      text-slate-400
                    "
                  >
                    One identity.
                    Connected context.
                  </p>
                </div>

                <Compass
                  size={16}
                  className="
                    text-slate-400
                  "
                />
              </div>

              <div
                className="
                  mt-4
                  grid
                  grid-cols-2
                  gap-2
                "
              >
                {Object.entries(
                  HUB_META,
                )
                  .filter(
                    ([key]) =>
                      key !==
                      "marketplace",
                  )
                  .map(
                    ([
                      key,
                      meta,
                    ]) => {
                      const Icon =
                        meta.icon;

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            navigate(
                              `community-hub-${key}`,
                            )
                          }
                          className="
                            flex
                            items-center
                            gap-2
                            rounded-xl
                            border
                            border-slate-100
                            bg-slate-50
                            px-3
                            py-2.5
                            text-left
                            transition
                            hover:border-emerald-200
                            hover:bg-emerald-50
                            dark:border-white/5
                            dark:bg-slate-800
                            dark:hover:border-emerald-500/20
                            dark:hover:bg-emerald-950/20
                          "
                        >
                          <Icon
                            size={13}
                            className="
                              text-slate-500
                              dark:text-slate-400
                            "
                          />

                          <span
                            className="
                              text-[10px]
                              font-bold
                              text-slate-600
                              dark:text-slate-300
                            "
                          >
                            {
                              meta.label
                            }
                          </span>
                        </button>
                      );
                    },
                  )}
              </div>
            </div>

            {/* -----------------------------------------------
                REFRESH / ACTIVITY
            ----------------------------------------------- */}

            <div
              className="
                rounded-[24px]
                border
                border-slate-200
                bg-slate-50
                p-4
                dark:border-white/10
                dark:bg-slate-800/40
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
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-white
                    text-slate-500
                    shadow-sm
                    dark:bg-slate-900
                    dark:text-slate-400
                  "
                >
                  <Bell
                    size={15}
                  />
                </div>

                <div
                  className="
                    min-w-0
                    flex-1
                  "
                >
                  <p
                    className="
                      text-[10px]
                      font-black
                      text-slate-700
                      dark:text-slate-200
                    "
                  >
                    Community intelligence
                  </p>

                  <p
                    className="
                      mt-1
                      text-[10px]
                      leading-4
                      text-slate-400
                    "
                  >
                    The feed is now a
                    ranked surface, not
                    just a chronological
                    list.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </JumuiyaDashboardShell>
  );
}