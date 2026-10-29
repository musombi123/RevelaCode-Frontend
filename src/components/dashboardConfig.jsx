import React, {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Home,
  BookOpen,
  Globe,
  Layers,
  Settings,
  Bot,
  Book,
  History,
  GraduationCap,
  Leaf,
  ShoppingCart,
  Users,
  WalletCards,
  UserCircle,
  Bell,
  MessageSquare,
  ClipboardList,
  Package,
  DollarSign,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Construction,
} from "lucide-react";

import { API_ROOT } from "@/services/jumuiyaApi.jsx";
import {
  offlineScopeForUser,
  readCachedApiResponse,
} from "@/services/offlineHubSync.js";

import {
  useNotifications,
} from "./hooks/useNotifications.jsx";
import usePreferences from "./hooks/usePreferences.jsx";
import { useHistory } from "@/context/HistoryContext.jsx";

/* ======================================================
   HARDENED SAFE LAZY LOADING
====================================================== */

function safeLazy(
  importFn,
  name,
) {
  const LazyComp = lazy(() =>
    importFn().catch((error) => {
      console.error(
        `🚨 LAZY LOAD FAIL → ${name}:`,
        error,
      );

      return {
        default: function LazyLoadFallback() {
          return (
            <div
              className="
                flex
                min-h-[240px]
                items-center
                justify-center
                p-6
              "
            >
              <div
                className="
                  w-full
                  max-w-md
                  rounded-2xl
                  border
                  border-red-200
                  bg-red-50
                  p-5
                  text-center
                  dark:border-red-900/50
                  dark:bg-red-950/20
                "
              >
                <p
                  className="
                    text-sm
                    font-semibold
                    text-red-700
                    dark:text-red-400
                  "
                >
                  {name} failed to load.
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
                  The workspace could not be loaded.
                  Try another section or refresh the
                  application.
                </p>
              </div>
            </div>
          );
        },
      };
    }),
  );

  return function SafeLazyComponent(
    props,
  ) {
    return (
      <Suspense
        fallback={
          <div
            className="
              flex
              min-h-[240px]
              items-center
              justify-center
              p-6
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
                rounded-2xl
                border
                border-gray-200
                bg-white
                px-4
                py-3
                text-sm
                text-gray-500
                shadow-sm
                dark:border-gray-800
                dark:bg-gray-900
                dark:text-gray-400
              "
            >
              <span
                className="
                  h-2.5
                  w-2.5
                  animate-pulse
                  rounded-full
                  bg-indigo-500
                "
              />

              <span>
                Loading {name}…
              </span>
            </div>
          </div>
        }
      >
        <LazyComp {...props} />
      </Suspense>
    );
  };
}

/* ======================================================
   HOME DATA HELPERS
====================================================== */

function formatNumber(
  value,
) {
  const numeric =
    Number(value);

  if (
    !Number.isFinite(
      numeric,
    )
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-KE",
    {
      maximumFractionDigits: 0,
    },
  ).format(numeric);
}

function formatMoney(
  value,
  currency = "KES",
) {
  const numeric =
    Number(value);

  if (
    !Number.isFinite(
      numeric,
    )
  ) {
    return "—";
  }

  const safeCurrency =
    String(
      currency || "KES",
    ).toUpperCase();

  try {
    return new Intl.NumberFormat(
      "en-KE",
      {
        style: "currency",
        currency: safeCurrency,
        maximumFractionDigits: 0,
      },
    ).format(numeric);
  } catch {
    return `${safeCurrency} ${formatNumber(
      numeric,
    )}`;
  }
}

function formatDateTime(
  value,
) {
  if (!value) {
    return "Time unavailable";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Time unavailable";
  }

  return new Intl.DateTimeFormat(
    "en-KE",
    {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function timestampOf(
  item,
) {
  if (!item) {
    return 0;
  }

  const value =
    item.timestamp ||
    item.created_at ||
    item.createdAt ||
    item.updated_at ||
    item.updatedAt ||
    item.ordered_at ||
    item.sold_at ||
    null;

  if (!value) {
    return 0;
  }

  const time =
    new Date(value).getTime();

  return Number.isFinite(
    time,
  )
    ? time
    : 0;
}

function extractArray(
  value,
  keys = [],
) {
  if (
    Array.isArray(
      value,
    )
  ) {
    return value;
  }

  for (const key of keys) {
    if (
      Array.isArray(
        value?.[key],
      )
    ) {
      return value[key];
    }
  }

  if (
    Array.isArray(
      value?.data,
    )
  ) {
    return value.data;
  }

  return [];
}

function normalizeCommunityFeed(
  value,
) {
  if (
    Array.isArray(
      value,
    )
  ) {
    return value;
  }

  if (
    Array.isArray(
      value?.posts,
    )
  ) {
    return value.posts;
  }

  if (
    Array.isArray(
      value?.data?.posts,
    )
  ) {
    return value.data.posts;
  }

  if (
    Array.isArray(
      value?.data,
    )
  ) {
    return value.data;
  }

  return [];
}

function safeLocalStorage(
  key,
  fallback = "",
) {
  try {
    return (
      localStorage.getItem(
        key,
      ) ??
      fallback
    );
  } catch {
    return fallback;
  }
}

function buildRecentActivities({
  history = [],
  walletTransactions = [],
  biashara = {},
  communityPosts = [],
}) {
  const activities = [];

  /* ====================================================
     USER HISTORY — actions, studies and saved work only.
     Notifications are deliberately excluded from this timeline.
  ==================================================== */

  history.slice(0, 20).forEach((entry, index) => {
    const type = String(entry?.type || entry?.action || "activity").toLowerCase();
    const extra = entry?.extra && typeof entry.extra === "object" ? entry.extra : {};
    const hub = String(entry?.hub || extra.hub || extra.workspace || "").toLowerCase();
    const timestamp = entry?.timestamp || entry?.created_at || entry?.createdAt || null;
    const rawTitle = entry?.title || entry?.action_label || entry?.label || entry?.input || entry?.prompt || entry?.question || extra.title || extra.action || "";
    const title = String(rawTitle || "Saved activity").replace(/\s+/g, " ").trim();
    const route = entry?.route || extra.route || ({
      faith: "faith", scripture: "faith", bible: "bible", study: "faith",
      elimu: "education", education: "education", school: "education",
      shamba: "shamba", farm: "shamba", biashara: "biashara", business: "biashara",
      community: "community", payments: "payments", wallet: "payments",
    }[hub] || null);
    const iconSource = hub + " " + type;
    const Icon = /community|post|comment|group/.test(iconSource) ? MessageSquare
      : /shamba|farm|crop/.test(iconSource) ? Leaf
      : /elimu|education|school|student|lesson|assignment/.test(iconSource) ? GraduationCap
      : /biashara|business|product|order|sale/.test(iconSource) ? ShoppingCart
      : /wallet|payment|transaction/.test(iconSource) ? WalletCards
      : /faith|bible|scripture|study|verse/.test(iconSource) ? BookOpen
      : History;

    activities.push({
      id: entry?.id || entry?._id || ("history-" + index + "-" + (timestamp || type)),
      title: title.length > 110 ? title.slice(0, 107) + "…" : title,
      time: formatDateTime(timestamp),
      value: "",
      positive: false,
      icon: Icon,
      route,
      timestamp: timestampOf(entry),
    });
  });

  /* ====================================================
     WALLET TRANSACTIONS
  ==================================================== */

  walletTransactions
    .slice(0, 8)
    .forEach(
      (
        transaction,
        index,
      ) => {
        const direction =
          String(
            transaction.direction ||
              "",
          ).toLowerCase();

        const amount =
          Number(
            transaction.amount,
          );

        const currency =
          transaction.currency ||
          "KES";

        activities.push({
          id:
            transaction.id ||
            transaction._id ||
            `wallet-${index}`,

          title:
            transaction.type ||
            "Wallet transaction",

          time:
            formatDateTime(
              transaction.created_at ||
                transaction.createdAt,
            ),

          value:
            Number.isFinite(
              amount,
            )
              ? `${
                  direction ===
                  "credit"
                    ? "+ "
                    : "- "
                }${formatMoney(
                  amount,
                  currency,
                )}`
              : "",

          positive:
            direction ===
            "credit",

          icon:
            WalletCards,

          timestamp:
            timestampOf(
              transaction,
            ),
        });
      },
    );

  /* ====================================================
     BIASHARA ORDERS
  ==================================================== */

  const recentOrders =
    extractArray(
      biashara?.recent_orders,
    );

  recentOrders
    .slice(0, 6)
    .forEach(
      (
        order,
        index,
      ) => {
        const amount =
          order?.total ??
          order?.amount ??
          order?.grand_total ??
          order?.total_amount ??
          null;

        activities.push({
          id:
            order?.id ||
            order?._id ||
            `order-${index}`,

          title:
            order?.order_number ||
            order?.reference ||
            order?.number ||
            "Business order",

          time:
            formatDateTime(
              order?.created_at ||
                order?.updated_at ||
                order?.ordered_at,
            ),

          value:
            amount !== null &&
            Number.isFinite(
              Number(amount),
            )
              ? formatMoney(
                  amount,
                  biashara?.currency ||
                    "KES",
                )
              : "",

          positive: false,

          icon:
            ShoppingCart,

          timestamp:
            timestampOf(
              order,
            ),
        });
      },
    );

  /* ====================================================
     BIASHARA SALES
  ==================================================== */

  const recentSales =
    extractArray(
      biashara?.recent_sales,
    );

  recentSales
    .slice(0, 6)
    .forEach(
      (
        sale,
        index,
      ) => {
        const amount =
          sale?.amount ??
          sale?.total ??
          sale?.total_amount ??
          null;

        activities.push({
          id:
            sale?.id ||
            sale?._id ||
            `sale-${index}`,

          title:
            sale?.reference ||
            sale?.sale_number ||
            "Business sale",

          time:
            formatDateTime(
              sale?.created_at ||
                sale?.sold_at,
            ),

          value:
            amount !== null &&
            Number.isFinite(
              Number(amount),
            )
              ? `+ ${formatMoney(
                  amount,
                  biashara?.currency ||
                    "KES",
                )}`
              : "",

          positive: true,

          icon:
            DollarSign,

          timestamp:
            timestampOf(
              sale,
            ),
        });
      },
    );

  /* ====================================================
     COMMUNITY ACTIVITY
  ==================================================== */

  communityPosts
    .slice(0, 6)
    .forEach(
      (
        post,
        index,
      ) => {
        activities.push({
          id:
            post?.id ||
            post?._id ||
            `community-${index}`,

          title:
            post?.title ||
            post?.body ||
            post?.content ||
            "Community post",

          time:
            formatDateTime(
              post?.created_at ||
                post?.createdAt,
            ),

          value: "",

          positive: false,

          icon:
            MessageSquare,

          timestamp:
            timestampOf(
              post,
            ),
        });
      },
    );

  return activities
    .sort(
      (a, b) =>
        b.timestamp -
        a.timestamp,
    )
    .slice(0, 10);
}


/* ======================================================
   EXISTING REVELACODE / FAITH DASHBOARDS
====================================================== */

const BibleDashboard = safeLazy(
  () =>
    import(
      "./BibleDashboard.jsx"
    ),
  "Bible",
);

const ProphecyDashboard = safeLazy(
  () =>
    import(
      "./ProphecyDashboard.jsx"
    ),
  "Prophecy",
);

const ProphecyEventsDashboard =
  safeLazy(
    () =>
      import(
        "./ProphecyEventsDashboard.jsx"
      ),
    "Events",
  );

const ReferentialDashboard =
  safeLazy(
    () =>
      import(
        "./ReferentialDashboard.jsx"
      ),
    "Referential",
  );

const PreferencesDashboard =
  safeLazy(
    () =>
      import(
        "./PreferencesDashboard.jsx"
      ),
    "Preferences",
  );

const UserAccountDashboard =
  safeLazy(
    () =>
      import(
        "./UserAccountDashboard.jsx"
      ),
    "Account",
  );

const AIAssistantDashboard =
  safeLazy(
    () =>
      import(
        "./AIAssistantDashboard.jsx"
      ),
    "RevelaAI",
  );

const FaithDashboard = safeLazy(
  () =>
    import(
      "./FaithDashboard.jsx"
    ),
  "Faith",
);

/* ======================================================
   JUMUIYA HUB DASHBOARDS
====================================================== */

const BiasharaDashboard =
  safeLazy(
    () =>
      import(
        "@/Dashboard/BiasharaDashboard.jsx"
      ),
    "Biashara",
  );

const ShambaHub = safeLazy(
  () =>
    import(
      "@/Dashboard/ShambaHub.jsx"
    ),
  "Shamba",
);

const ElimuDashboard = safeLazy(
  () =>
    import(
      "@/Dashboard/ElimuDashboard.jsx"
    ),
  "Elimu",
);

const CommunityDashboard =
  safeLazy(
    () =>
      import(
        "@/Dashboard/CommunityDashboard.jsx"
      ),
    "Community",
  );

const PaymentsDashboard =
  safeLazy(
    () =>
      import(
        "@/Dashboard/PaymentsDashboard.jsx"
      ),
    "Payments",
  );

/* ======================================================
   COMING SOON DASHBOARD
====================================================== */

export function ComingSoonDashboard({
  title = "Coming Soon",
  subtitle =
    "This workspace is currently under development.",
  icon: Icon = Construction,
  gradient =
    "from-indigo-600 via-purple-600 to-pink-600",
}) {
  return (
    <div
      className="
        flex
        min-h-full
        items-center
        justify-center
        p-4
        sm:p-6
        lg:p-8
      "
    >
      <div className="w-full max-w-3xl">
        <div
          className="
            relative
            overflow-hidden
            rounded-3xl
            border
            border-gray-200
            bg-white
            p-6
            text-center
            shadow-xl
            dark:border-gray-800
            dark:bg-gray-900
            sm:p-10
            lg:p-14
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-20
              h-56
              w-56
              rounded-full
              bg-indigo-500/10
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-20
              -left-20
              h-56
              w-56
              rounded-full
              bg-purple-500/10
              blur-3xl
            "
          />

          <div className="relative z-10">
            <div
              className={`
                mx-auto
                flex
                h-20
                w-20
                items-center
                justify-center
                rounded-3xl
                bg-gradient-to-br
                ${gradient}
                text-white
                shadow-xl
              `}
            >
              <Icon size={36} />
            </div>

            <div className="mt-7">
              <span
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-indigo-200
                  bg-indigo-50
                  px-3
                  py-1.5
                  text-xs
                  font-bold
                  uppercase
                  tracking-wider
                  text-indigo-700
                  dark:border-indigo-800/50
                  dark:bg-indigo-950/30
                  dark:text-indigo-300
                "
              >
                <Sparkles size={13} />

                Workspace in Development
              </span>

              <h1
                className="
                  mt-5
                  text-3xl
                  font-black
                  tracking-tight
                  text-gray-900
                  dark:text-white
                  sm:text-4xl
                "
              >
                {title}
              </h1>

              <p
                className="
                  mx-auto
                  mt-3
                  max-w-xl
                  text-sm
                  leading-7
                  text-gray-600
                  dark:text-gray-300
                  sm:text-base
                "
              >
                {subtitle}
              </p>
            </div>

            <div
              className="
                mx-auto
                mt-8
                max-w-xl
                rounded-2xl
                border
                border-gray-200
                bg-gray-50
                p-5
                text-left
                dark:border-gray-800
                dark:bg-gray-800/50
              "
            >
              <div className="flex items-start gap-3">
                <div
                  className="
                    mt-0.5
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-indigo-100
                    text-indigo-600
                    dark:bg-indigo-900/40
                    dark:text-indigo-300
                  "
                >
                  <Construction size={17} />
                </div>

                <div>
                  <p
                    className="
                      font-semibold
                      text-gray-900
                      dark:text-white
                    "
                  >
                    We're building this
                    workspace.
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      leading-6
                      text-gray-500
                      dark:text-gray-400
                    "
                  >
                    The goal is to make this part
                    of the RevelaCode ecosystem
                    useful, fast, secure, and ready
                    for real-world use.
                  </p>
                </div>
              </div>
            </div>

            <p
              className="
                mt-7
                text-xs
                font-medium
                text-gray-400
              "
            >
              RevelaCode Ecosystem • More coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   CENTRAL HOME HUB CONFIGURATION
   Keep home hub identity, destinations, accents and copy here.
====================================================== */

const HOME_HUBS = Object.freeze([
  { key: "faith", title: "Faith & Scripture", shortTitle: "Faith", description: "Bible study, prophecy and SDA lessons", icon: BookOpen, surface: "bg-violet-50 dark:bg-violet-950/25", iconTone: "text-violet-700 dark:text-violet-300", borderTone: "border-violet-100 dark:border-violet-900/50", iconBg: "bg-violet-100 dark:bg-violet-900/50" },
  { key: "education", title: "Elimu", shortTitle: "Elimu", description: "Schools, classes and learning", icon: GraduationCap, surface: "bg-emerald-50 dark:bg-emerald-950/25", iconTone: "text-emerald-700 dark:text-emerald-300", borderTone: "border-emerald-100 dark:border-emerald-900/50", iconBg: "bg-emerald-100 dark:bg-emerald-900/50" },
  { key: "shamba", title: "Shamba", shortTitle: "Shamba", description: "Farms, crops and market insights", icon: Leaf, surface: "bg-amber-50 dark:bg-amber-950/25", iconTone: "text-amber-700 dark:text-amber-300", borderTone: "border-amber-100 dark:border-amber-900/50", iconBg: "bg-amber-100 dark:bg-amber-900/50" },
  { key: "biashara", title: "Biashara", shortTitle: "Biashara", description: "Products, sales and business growth", icon: ShoppingCart, surface: "bg-blue-50 dark:bg-blue-950/25", iconTone: "text-blue-700 dark:text-blue-300", borderTone: "border-blue-100 dark:border-blue-900/50", iconBg: "bg-blue-100 dark:bg-blue-900/50" },
  { key: "community", title: "Community", shortTitle: "Community", description: "People, groups and opportunities", icon: Users, surface: "bg-cyan-50 dark:bg-cyan-950/25", iconTone: "text-cyan-700 dark:text-cyan-300", borderTone: "border-cyan-100 dark:border-cyan-900/50", iconBg: "bg-cyan-100 dark:bg-cyan-900/50" },
]);


const HOME_HUB_GROUPS = Object.freeze([
  {
    key: "learn",
    title: "Learn & Faith",
    description: "Knowledge, scripture and education",
    hubKeys: ["faith", "education"],
  },
  {
    key: "grow",
    title: "Work & Grow",
    description: "Business, farming and livelihoods",
    hubKeys: ["biashara", "shamba"],
  },
  {
    key: "community",
    title: "People & Community",
    description: "Relationships, groups and opportunities",
    hubKeys: ["community"],
  },
]);

const HOME_HUB_USAGE_KEY = "revelacode_home_hub_usage_v1";

function readHomeHubUsage() {
  try {
    const stored = JSON.parse(localStorage.getItem(HOME_HUB_USAGE_KEY) || "{}");
    return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
}

function recordHomeHubUsage(key) {
  try {
    const current = readHomeHubUsage();
    current[key] = {
      count: Math.max(0, Number(current[key]?.count) || 0) + 1,
      lastUsedAt: new Date().toISOString(),
    };
    localStorage.setItem(HOME_HUB_USAGE_KEY, JSON.stringify(current));
    return current;
  } catch {
    return readHomeHubUsage();
  }
}

/* ======================================================
   HOME DASHBOARD
   REAL SYSTEM DATA ONLY
====================================================== */

function HomeDashboard({
  onNavigate,
  onOpenAI,
  onRequestSignIn,
  user,
}) {
  const { language, t } = usePreferences();
  const { history: userHistory = [] } = useHistory();

  const {
    notifications,
    unreadCount,
    loading:
      notificationsLoading,
  } = useNotifications(
    30000,
  );

  const [
    ecosystemData,
    setEcosystemData,
  ] = useState({
    wallet: null,
    biashara: null,
    shamba: null,
    education: null,
    community: [],
  });

  const [
    ecosystemLoading,
    setEcosystemLoading,
  ] = useState(false);

  const isGuest =
    user?.role === "guest";

  const [hubUsage, setHubUsage] = useState(() => readHomeHubUsage());

  useEffect(() => {
    const refreshUsage = () => setHubUsage(readHomeHubUsage());
    window.addEventListener("storage", refreshUsage);
    return () => window.removeEventListener("storage", refreshUsage);
  }, []);

  const handleHubOpen = (key) => {
    const nextUsage = recordHomeHubUsage(key);
    setHubUsage(nextUsage);
    onNavigate?.(key);
  };

  const sortedHubs = useMemo(() => {
    return [...HOME_HUBS].sort((a, b) => {
      const countA = Number(hubUsage[a.key]?.count) || 0;
      const countB = Number(hubUsage[b.key]?.count) || 0;
      if (countA !== countB) return countB - countA;
      return HOME_HUBS.findIndex((hub) => hub.key === a.key) -
        HOME_HUBS.findIndex((hub) => hub.key === b.key);
    });
  }, [hubUsage]);

  const hasHubHistory = HOME_HUBS.some(
    (hub) => (Number(hubUsage[hub.key]?.count) || 0) > 0,
  );

  const frequentHubs = sortedHubs.slice(0, 3);

  /* ====================================================
     LOCAL ACTIVITY
  ==================================================== */

  const historyCount = Number(
    safeLocalStorage(
      "revelacode_history_count",
      "0",
    ) || 0,
  );

  const lastActivityText =
    safeLocalStorage(
      "revelacode_last_activity",
      "",
    );

  const lastActivityTime =
    safeLocalStorage(
      "revelacode_last_activity_time",
      "",
    );

  const prettyTime =
    lastActivityTime
      ? new Date(
          lastActivityTime,
        ).toLocaleString()
      : "";

  const displayName = (
    user?.fullName ||
    user?.full_name ||
    user?.name ||
    user?.display_name ||
    user?.username ||
    ""
  )
    .toString()
    .trim() ||
    "Guest User";

  /*
   * Home is the offline-first shell, not a hub aggregator. Never fan out to
   * every hub dashboard during startup. Render only eligible, user-scoped
   * snapshots already stored by the shared API cache; each hub fetches live
   * data when the user opens that hub. Wallet/payment data is intentionally
   * excluded from this cache path by the shared offline safety rules.
   */
  const offlineScope = offlineScopeForUser(user);

  useEffect(() => {
    let cancelled = false;

    if (!offlineScope || isGuest) {
      setEcosystemData({
        wallet: null,
        biashara: null,
        shamba: null,
        education: null,
        community: [],
      });
      setEcosystemLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const readSnapshot = async (path) => {
      try {
        const cached = await readCachedApiResponse(
          offlineScope,
          `${API_ROOT}${path}`,
        );
        if (!cached.hit) return null;
        const payload = cached.payload;
        return payload && typeof payload === "object" &&
          Object.prototype.hasOwnProperty.call(payload, "data")
          ? payload.data
          : payload;
      } catch {
        return null;
      }
    };

    async function loadCachedOverview() {
      const [biashara, shamba, community] = await Promise.all([
        readSnapshot("/biashara/dashboard"),
        readSnapshot("/shamba/dashboard"),
        readSnapshot("/community/feed?limit=30"),
      ]);

      if (cancelled) return;

      setEcosystemData({
        wallet: null,
        biashara,
        shamba,
        education: null,
        community: normalizeCommunityFeed(community),
      });
      setEcosystemLoading(false);
    }

    // Cache reads are local-only and must never delay the shell on network I/O.
    loadCachedOverview();

    return () => {
      cancelled = true;
    };
  }, [offlineScope, isGuest]);

  /* ====================================================
     NORMALIZED SERVICE DATA
  ==================================================== */

  const wallet =
    ecosystemData.wallet ||
    {};

  const biashara =
    ecosystemData.biashara ||
    {};

  const shamba =
    ecosystemData.shamba ||
    {};

  const education =
    ecosystemData.education ||
    {};

  const communityPosts =
    Array.isArray(
      ecosystemData.community,
    )
      ? ecosystemData.community
      : [];

  const walletTransactions =
    extractArray(
      wallet?.transactions,
    );

  const biasharaMetrics =
    biashara?.metrics ||
    {};

  const shambaMetrics =
    shamba?.metrics ||
    {};

  const educationAssignments =
    Number(
      education?.assignments,
    );

  /* ====================================================
     LIVE ECOSYSTEM OVERVIEW
  ==================================================== */

  const overview =
    useMemo(
      () => [
        {
          key: "notifications",
          title: "Notifications",
          value:
            isGuest
              ? "—"
              : notificationsLoading
                ? "..."
                : formatNumber(
                    unreadCount,
                  ),
          helper:
            isGuest
              ? "Sign in to view"
              : unreadCount === 1
                ? "1 unread notification"
                : `${unreadCount || 0} unread notifications`,
          icon: Bell,
          className:
            "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
          clickable: false,
        },

        {
          key: "wallet",
          title: "Wallet Balance",
          value:
            isGuest
              ? "—"
              : formatMoney(
                  wallet?.balance,
                  wallet?.currency ||
                    "KES",
                ),
          helper:
            isGuest
              ? "Sign in to view"
              : "Manage payments and transactions in your User Hub",
          icon: WalletCards,
          className:
            "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
          clickable: true,
          route: "profile",
        },

        {
          key: "biashara-orders",
          title: "Biashara Orders",
          value:
            isGuest
              ? "—"
              : formatNumber(
                  biasharaMetrics?.orders,
                ),
          helper:
            isGuest
              ? "Sign in to view"
              : "Orders in your business workspace",
          icon: ShoppingCart,
          className:
            "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
          clickable: true,
          route: "biashara",
        },

        {
          key: "biashara-products",
          title: "Biashara Products",
          value:
            isGuest
              ? "—"
              : formatNumber(
                  biasharaMetrics?.products,
                ),
          helper:
            isGuest
              ? "Sign in to view"
              : "Products tracked by Biashara",
          icon: Package,
          className:
            "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400",
          clickable: true,
          route: "biashara",
        },

        {
          key: "shamba-farms",
          title: "Shamba Farms",
          value:
            isGuest
              ? "—"
              : formatNumber(
                  shambaMetrics?.farms,
                ),
          helper:
            isGuest
              ? "Sign in to view"
              : "Farms tracked in Shamba",
          icon: Leaf,
          className:
            "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
          clickable: true,
          route: "shamba",
        },

        {
          key: "shamba-crops",
          title: "Active Crops",
          value:
            isGuest
              ? "—"
              : formatNumber(
                  shambaMetrics?.active_crops,
                ),
          helper:
            isGuest
              ? "Sign in to view"
              : "Current crops tracked in Shamba",
          icon: Leaf,
          className:
            "bg-lime-50 text-lime-700 dark:bg-lime-950/30 dark:text-lime-400",
          clickable: true,
          route: "shamba",
        },

        {
          key: "education-assignments",
          title:
            "Education Assignments",
          value:
            isGuest
              ? "—"
              : Number.isFinite(
                  educationAssignments,
                )
                ? formatNumber(
                    educationAssignments,
                  )
                : "—",
          helper:
            isGuest
              ? "Sign in to view"
              : "Assignments returned by the Education service",
          icon: ClipboardList,
          className:
            "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
          clickable: true,
          route: "education",
        },

        {
          key: "community-activity",
          title:
            "Community Activity",
          value:
            isGuest
              ? "—"
              : ecosystemLoading
                ? "..."
                : formatNumber(
                    communityPosts.length,
                  ),
          helper:
            isGuest
              ? "Sign in to view"
              : "Posts returned by the recent community feed",
          icon: MessageSquare,
          className:
            "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400",
          clickable: true,
          route: "community",
        },
      ],
      [
        isGuest,
        notificationsLoading,
        unreadCount,
        wallet?.balance,
        wallet?.currency,
        walletTransactions.length,
        biasharaMetrics?.orders,
        biasharaMetrics?.products,
        shambaMetrics?.farms,
        shambaMetrics?.active_crops,
        educationAssignments,
        ecosystemLoading,
        communityPosts.length,
      ],
    );

  /* ====================================================
     REAL RECENT ACTIVITY
  ==================================================== */

  const activities =
    useMemo(
      () =>
        buildRecentActivities({
          history: userHistory,
          walletTransactions,
          biashara,
          communityPosts,
        }),
      [
        userHistory,
        walletTransactions,
        biashara,
        communityPosts,
      ],
    );

  /* ====================================================
     HUBS
     Defined centrally in HOME_HUBS above.
  ==================================================== */

  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,";
  const primaryStatKeys = ["wallet", "biashara-orders", "shamba-farms", "community-activity"];
  const primaryOverview = overview.filter((item) => primaryStatKeys.includes(item.key));
  const moreOverview = overview.filter((item) => !primaryStatKeys.includes(item.key));
  const resumeTarget = activities.find((activity) => activity.route)?.route || sortedHubs[0]?.key || "faith";

  const hubToneByKey = {
    faith: { surface: "border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-violet-100/80 dark:border-violet-900/60 dark:from-violet-950/50 dark:via-slate-900 dark:to-violet-950/25", icon: "bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200", dot: "bg-violet-500" },
    education: { surface: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/80 dark:border-emerald-900/60 dark:from-emerald-950/50 dark:via-slate-900 dark:to-emerald-950/25", icon: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200", dot: "bg-emerald-500" },
    shamba: { surface: "border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-amber-100/80 dark:border-amber-900/60 dark:from-amber-950/50 dark:via-slate-900 dark:to-amber-950/25", icon: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200", dot: "bg-amber-500" },
    biashara: { surface: "border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-blue-100/80 dark:border-blue-900/60 dark:from-blue-950/50 dark:via-slate-900 dark:to-blue-950/25", icon: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200", dot: "bg-blue-500" },
    community: { surface: "border-cyan-200/80 bg-gradient-to-br from-cyan-50 via-white to-cyan-100/80 dark:border-cyan-900/60 dark:from-cyan-950/50 dark:via-slate-900 dark:to-cyan-950/25", icon: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-200", dot: "bg-cyan-500" },
  };

  const renderOverviewStat = (item, compact = false) => {
    const Icon = item.icon;
    const itemLoading = !isGuest && (ecosystemLoading || (item.key === "notifications" && notificationsLoading));
    const content = (
      <>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <span className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " + item.className}><Icon size={19} strokeWidth={2} /></span>
          {item.clickable && item.route ? <ArrowRight size={15} className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-1" /> : null}
        </div>
        <p className="mt-4 text-[11px] font-bold leading-4 text-slate-600 dark:text-slate-300">{t(item.title)}</p>
        {itemLoading ? <span aria-label={t("Loading")} className="mt-2 block h-8 w-24 max-w-full animate-pulse rounded-lg bg-slate-200 motion-reduce:animate-none dark:bg-slate-800" /> : <p className="mt-1 break-words text-2xl font-black tracking-tight text-slate-950 dark:text-white">{item.value}</p>}
        <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{t(item.helper)}</p>
      </>
    );
    const cardClass = "group min-w-0 rounded-2xl border border-slate-200/90 bg-white p-3.5 text-left shadow-sm shadow-slate-950/[0.03] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none dark:border-white/10 dark:bg-slate-900 dark:shadow-none dark:hover:border-white/20 dark:focus-visible:ring-offset-slate-950 " + (compact ? "min-h-[132px]" : "min-h-[166px]");
    if (item.clickable && item.route) {
      return <button key={item.key} type="button" onClick={() => onNavigate?.(item.route)} aria-label={t(item.title) + ": " + item.value} className={cardClass}>{content}</button>;
    }
    return <div key={item.key} className={cardClass}>{content}</div>;
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1500px] space-y-4 overflow-x-clip px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:space-y-5 sm:px-6">
      <style>{`
        @keyframes rcHomeHubEnter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rc-home-hub-enter { animation: rcHomeHubEnter 360ms ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .rc-home-hub-enter { animation: none !important; }
        }
      `}</style>

      <section aria-label={t("Home welcome")} className="relative isolate overflow-hidden rounded-[26px] border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-950/[0.04] dark:border-white/10 dark:bg-slate-900 sm:p-6 lg:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-400/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-[22%] h-52 w-52 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-400/10" />
        <div className="relative grid min-w-0 grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.82fr)] md:items-stretch md:gap-5">
          <div className="min-w-0 py-1">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300"><span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />{t("Your connected ecosystem")}</div>
            <h1 className="mt-4 break-words text-[clamp(1.65rem,5vw,2.6rem)] font-black leading-[1.12] tracking-[-0.04em] text-slate-950 dark:text-white">{t(greetingKey)}{" "}<span className="break-words bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">{displayName}</span></h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{t("One connected place to learn, build, grow and connect. Pick up where you left off or jump straight into your world.")}</p>
            <div className="mt-5 flex min-w-0 flex-wrap items-center gap-2">
              <span className="inline-flex max-w-full min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300"><History size={15} className="shrink-0 text-blue-600 dark:text-blue-300" /><span className="shrink-0 font-bold">{t("Last activity")}</span><span className="max-w-[12rem] truncate">{prettyTime || lastActivityText || t("No activity yet")}</span></span>
              <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300"><Bell size={15} className="shrink-0 text-violet-600 dark:text-violet-300" /><span className="font-bold">{t("Unread")}</span>{notificationsLoading && !isGuest ? <span className="h-4 w-9 animate-pulse rounded bg-slate-200 motion-reduce:animate-none dark:bg-slate-800" aria-label={t("Loading")} /> : <span className="tabular-nums">{isGuest ? "0" : formatNumber(unreadCount || 0)}</span>}</span>
            </div>
          </div>
          <button type="button" onClick={() => onOpenAI?.()} aria-label={t("Open RevelaAI assistant")} className="group relative flex min-h-[220px] min-w-0 flex-col justify-between overflow-hidden rounded-[24px] border border-slate-700/80 bg-slate-950 p-4 text-left text-white shadow-lg shadow-slate-950/10 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.995] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none dark:border-white/10 dark:shadow-black/30 md:min-h-0 md:p-5" style={{ backgroundImage: "radial-gradient(circle at 85% 15%, rgba(37,99,235,.35), transparent 38%), radial-gradient(circle at 10% 100%, rgba(124,58,237,.28), transparent 42%), linear-gradient(145deg, #0b1220, #111c31 60%, #111827)" }}>
            <div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-blue-100"><Sparkles size={23} /></span><span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-200"><span className="h-2 w-2 rounded-full bg-emerald-400" />{t("RevelaAI assistant")}</span></div>
            <div className="mt-6"><h2 className="text-xl font-black tracking-tight sm:text-2xl">{t("Think with RevelaAI")}</h2><p className="mt-2 max-w-sm text-sm leading-5 text-slate-300">{t(language === "sw" ? "Pata msaada katika vituo vyako vya RevelaCode." : language === "fr" ? "Obtenez de l’aide dans vos espaces RevelaCode connectés." : "Get help across your connected RevelaCode workspaces.")}</p></div>
            <span className="mt-5 flex min-h-12 items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/10 px-3.5 py-3 text-xs font-extrabold text-white transition group-hover:bg-white/15 group-active:scale-[0.99] sm:text-sm"><span>{t("Start a conversation")}</span><ArrowRight size={18} className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" /></span>
          </button>
        </div>
      </section>

      <section aria-label={t("Quick access to recent hubs")} className="min-w-0 space-y-2" style={{ contentVisibility: "auto", containIntrinsicSize: "auto 180px" }}>
        <div className="flex min-w-0 items-center justify-between gap-3 px-1"><div className="min-w-0"><h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">{t(hasHubHistory ? "Your quick access" : "Quick access")}</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t(hasHubHistory ? "Your most-used spaces" : "Start with a connected hub")}</p></div><span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">{t("Personalized")}</span></div>
        <div className="flex min-w-0 snap-x snap-mandatory gap-2 overflow-x-auto overscroll-contain pb-2">
          {frequentHubs.map((hub) => {
            const Icon = hub.icon;
            const uses = Number(hubUsage[hub.key]?.count) || 0;
            const tone = hubToneByKey[hub.key] || hubToneByKey.community;
            return <button key={hub.key} type="button" onClick={() => handleHubOpen(hub.key)} aria-label={t("Open") + " " + t(hub.title)} className={"group flex min-h-12 shrink-0 snap-start items-center gap-2.5 rounded-2xl border " + tone.surface + " px-3 py-2 text-left transition duration-200 hover:shadow-sm active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 motion-reduce:transition-none"}><span className={"flex h-9 w-9 shrink-0 items-center justify-center rounded-full " + tone.icon}><Icon size={17} strokeWidth={2} /></span><span className="max-w-[9rem] truncate text-xs font-extrabold text-slate-900 dark:text-white">{t(hub.shortTitle)}</span>{uses > 0 ? <span className="rounded-full border border-white/70 bg-white/70 px-2 py-1 text-[11px] font-bold text-slate-600 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-300">{formatNumber(uses)}</span> : null}</button>;
          })}
        </div>
      </section>

      <section aria-label={t("Your hubs")} className="space-y-3" style={{ contentVisibility: "auto", containIntrinsicSize: "auto 640px" }}>
        <div className="flex min-w-0 flex-wrap items-end justify-between gap-2 px-1"><div className="min-w-0"><h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white sm:text-xl">{t("Your Hubs")}</h2><p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{t("Your connected workspaces, organized by what you want to do.")}</p></div><span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">{formatNumber(HOME_HUBS.length)} {t("hubs")}</span></div>
        <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-6 md:gap-4">
          {sortedHubs.map((hub, index) => {
            const Icon = hub.icon;
            const uses = Number(hubUsage[hub.key]?.count) || 0;
            const tone = hubToneByKey[hub.key] || hubToneByKey.community;
            const group = HOME_HUB_GROUPS.find((item) => item.hubKeys.includes(hub.key));
            const eyebrow = group?.key === "community" ? t("People") : t(group?.title || "Your hubs");
            const isLead = index < 2;
            const isMostUsed = hasHubHistory && hub.key === sortedHubs[0]?.key && uses > 0;
            return <button key={hub.key} type="button" onClick={() => handleHubOpen(hub.key)} aria-label={t("Open") + " " + t(hub.title)} style={{ animationDelay: String(index * 60) + "ms" }} className={"rc-home-hub-enter group relative flex min-h-[174px] min-w-0 flex-col overflow-hidden rounded-[24px] border p-3.5 text-left shadow-sm shadow-slate-950/[0.035] transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none dark:shadow-none md:p-4 " + (isLead ? "col-span-2 md:col-span-3 md:min-h-[204px]" : "col-span-1 md:col-span-2") + " " + tone.surface}>
              <div className="flex w-full min-w-0 items-start justify-between gap-3"><span className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/70 shadow-sm dark:border-white/10 " + tone.icon}><Icon size={21} strokeWidth={2} /></span><span className="flex min-w-0 flex-wrap items-center justify-end gap-2">{isMostUsed ? <span className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-slate-700 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-200">{t("Top")}</span> : null}<ArrowRight size={17} className="shrink-0 text-slate-500 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-950 motion-reduce:transition-none dark:text-slate-300 dark:group-hover:text-white" /></span></div>
              <div className="mt-4 min-w-0 flex-1"><p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">{eyebrow}</p><h3 className="mt-1 break-words text-base font-black tracking-tight text-slate-950 dark:text-white sm:text-lg">{t(hub.title)}</h3><p className="mt-1 line-clamp-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{t(hub.description)}</p></div>
              <div className="mt-4 flex min-w-0 items-center gap-2 border-t border-slate-200/70 pt-3 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300"><span className={"h-2 w-2 shrink-0 rounded-full " + tone.dot} /><span className="min-w-0 truncate">{uses > 0 ? formatNumber(uses) + " " + t("opens") : t("Ready when you are")}</span></div>
            </button>;
          })}
        </div>
      </section>

      <section aria-label={t("Ecosystem overview")} className="min-w-0 rounded-[26px] border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-950/[0.04] dark:border-white/10 dark:bg-slate-900 sm:p-5" style={{ contentVisibility: "auto", containIntrinsicSize: "auto 580px" }}>
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white sm:text-xl">{t("Ecosystem Overview")}</h2><p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{t("A live snapshot of your connected RevelaCode services.")}</p></div><span className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"><span className={"h-2 w-2 rounded-full " + (isGuest ? "bg-slate-400" : ecosystemLoading || notificationsLoading ? "animate-pulse bg-amber-500 motion-reduce:animate-none" : "bg-emerald-500")} />{isGuest ? t("Explore mode") : ecosystemLoading || notificationsLoading ? t("Syncing data") : t("Connected services")}</span></div>
        {isGuest ? (
          <div className="mt-5 flex min-w-0 flex-col items-start gap-4 rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-4 dark:border-blue-900/60 dark:from-blue-950/40 dark:via-slate-950 dark:to-violet-950/30 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200"><UserCircle size={23} /></span><div className="min-w-0"><h3 className="text-base font-black text-slate-950 dark:text-white">{t("Sign in to see your data")}</h3><p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">{t("Your activity, balances and workspace insights will appear here after you sign in.")}</p></div></div>
            <button type="button" onClick={() => onRequestSignIn?.()} className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 motion-reduce:transition-none sm:w-auto">{t("Sign in")} <ArrowRight size={15} /></button>
          </div>
        ) : (
          <>
            <div className="mt-5 grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">{primaryOverview.map((item) => renderOverviewStat(item))}</div>
            {moreOverview.length ? <details className="group mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 open:bg-white dark:border-white/10 dark:bg-slate-950/50 dark:open:bg-slate-900"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-2 text-sm font-extrabold text-slate-800 outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-100 dark:hover:bg-white/5 motion-reduce:transition-none"><span>{t("More ecosystem metrics")}</span><ChevronDown size={17} className="shrink-0 text-slate-500 transition-transform group-open:rotate-180 motion-reduce:transition-none" /></summary><div className="mt-3 grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">{moreOverview.map((item) => renderOverviewStat(item, true))}</div></details> : null}
          </>
        )}
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2" style={{ contentVisibility: "auto", containIntrinsicSize: "auto 650px" }}>
        <section aria-label={t("Recent Activity")} className="min-w-0 rounded-[26px] border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-950/[0.04] dark:border-white/10 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between gap-3"><div className="min-w-0"><h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">{t("Recent Activity")}</h2><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{t("Your actions across RevelaCode — not notifications.")}</p></div><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"><History size={19} /></span></div>
          <div className="mt-4">
            {isGuest ? (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center dark:border-white/10"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><History size={20} /></span><p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{t("Your activity will appear here")}</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">{t("Sign in to see your saved actions and recent work.")}</p><button type="button" onClick={() => onRequestSignIn?.()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-blue-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">{t("Sign in")}</button></div>
            ) : activities.length ? (
              <div className="divide-y divide-slate-100 dark:divide-white/10">
                {activities.slice(0, 5).map((activity, index) => {
                  const Icon = activity.icon;
                  const tone = activity.route === "community" ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-200" : activity.route === "shamba" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200" : activity.route === "biashara" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200" : activity.route === "education" ? "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
                  const row = <><span className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " + tone}><Icon size={18} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-900 dark:text-white">{activity.title}</span><span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">{activity.time}</span></span>{activity.value ? <span className="shrink-0 pl-2 text-right text-xs font-extrabold tabular-nums text-emerald-700 dark:text-emerald-300">{activity.value}</span> : null}</>;
                  return activity.route ? <button key={activity.id || (activity.title + "-" + index)} type="button" onClick={() => onNavigate?.(activity.route)} className="flex min-h-[60px] w-full min-w-0 items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-slate-50 active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-white/5 motion-reduce:transition-none">{row}</button> : <div key={activity.id || (activity.title + "-" + index)} className="flex min-h-[60px] min-w-0 items-center gap-3 px-2 py-2.5">{row}</div>;
                })}
              </div>
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center dark:border-white/10"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200"><History size={20} /></span><p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{t("No recent activity yet")}</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">{t("Open a hub to start building your activity history.")}</p><button type="button" onClick={() => handleHubOpen(frequentHubs[0]?.key || "faith")} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 transition hover:border-blue-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200">{t("Open a hub")} <ArrowRight size={14} /></button></div>
            )}
          </div>
        </section>

        <section aria-label={t("Continue where you left off")} className="relative min-w-0 overflow-hidden rounded-[26px] border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-950/[0.04] dark:border-white/10 dark:bg-slate-900 sm:p-5">
          <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-indigo-500/10" />
          <div className="relative flex min-w-0 flex-col gap-4"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200"><History size={20} /></span><div className="min-w-0"><h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">{t("Continue where you left off")}</h2><p className="mt-2 break-words text-sm leading-6 text-slate-600 dark:text-slate-300">{lastActivityText || t("No saved activity yet. Start exploring the ecosystem.")}</p>{prettyTime ? <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{prettyTime}</p> : null}{historyCount > 0 ? <p className="mt-2 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">{formatNumber(historyCount)} {t(historyCount === 1 ? "saved activity" : "saved activities")}</p> : null}</div></div><div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-950/60"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{t("Suggested next step")}</p><p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{activities.find((activity) => activity.route)?.title || t("Open your most-used hub")}</p><button type="button" onClick={() => isGuest ? onRequestSignIn?.() : onNavigate?.(resumeTarget)} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 motion-reduce:transition-none dark:bg-blue-600 dark:hover:bg-blue-500">{isGuest ? t("Sign in to resume") : t("Resume")} <ArrowRight size={15} /></button></div></div>
        </section>
      </div>
    </div>
  );

}

/* ======================================================
   GLOBAL DASHBOARD REGISTRY
====================================================== */

/*
 * IMPORTANT ARCHITECTURE
 *
 * DASHBOARDS contains ONLY top-level
 * RevelaCode workspaces.
 *
 * Biashara internal routes:
 *
 *   products
 *   orders
 *   customers
 *   sales
 *   biashara-analytics
 *   biashara-intelligence
 *   business-profile
 *   notifications
 *
 * remain inside BiasharaDashboard.jsx.
 */

export const DASHBOARDS = [
  /* ====================================================
     HOME
  ==================================================== */

  {
    key: "home",
    title: "Home",
    label: "Home",
    icon: Home,
    default: true,
    element: (
      <HomeDashboard />
    ),
  },

  /* ====================================================
     FAITH
  ==================================================== */

  {
    key: "faith",
    title: "Faith",
    label: "Faith",
    icon: BookOpen,
    element: (
      <FaithDashboard />
    ),
  },

  /* ====================================================
     JUMUIYA — EDUCATION
  ==================================================== */

  {
    key: "education",
    title: "Education",
    label: "Education",
    icon: GraduationCap,
    element: (
      <ElimuDashboard />
    ),
  },

  /* ====================================================
     JUMUIYA — SHAMBA
  ==================================================== */

  {
    key: "shamba",
    title: "Shamba",
    label: "Shamba",
    icon: Leaf,
    element: (
      <ShambaHub />
    ),
  },

  /* ====================================================
     JUMUIYA — BIASHARA
  ==================================================== */

  {
    key: "biashara",
    title: "Biashara",
    label: "Biashara",
    icon: ShoppingCart,
    element: (
      <BiasharaDashboard />
    ),
  },

  /* ====================================================
     JUMUIYA — COMMUNITY
  ==================================================== */

  {
    key: "community",
    title: "Community",
    label: "Community",
    icon: Users,
    element: (
      <CommunityDashboard />
    ),
  },

  /* ====================================================
     JUMUIYA — PAYMENTS
  ==================================================== */

  {
    key: "payments",
    title: "Payments",
    label: "Payments",
    icon: WalletCards,
    hidden: true,
    element: (
      <PaymentsDashboard />
    ),
  },

  /* ====================================================
     ACCOUNT — PROFILE
  ==================================================== */

  {
    key: "profile",
    title: "Profile",
    label: "Profile",
    icon: UserCircle,
    element: (
      <UserAccountDashboard />
    ),
  },

  /* ====================================================
     ACCOUNT — SETTINGS
  ==================================================== */

  {
    key: "settings",
    title: "Settings",
    label: "Settings",
    icon: Settings,
    element: (
      <PreferencesDashboard />
    ),
    restricted: true,
  },

  /* ====================================================
     FAITH INTERNAL — BIBLE
  ==================================================== */

  {
    key: "bible",
    title: "Bible",
    label: "Bible",
    icon: Book,
    hidden: true,
    element: (
      <BibleDashboard />
    ),
  },

  /* ====================================================
     FAITH INTERNAL — PROPHECY
  ==================================================== */

  {
    key: "prophecy",
    title: "Prophecy",
    label: "Prophecy",
    icon: BookOpen,
    hidden: true,
    element: (
      <ProphecyDashboard />
    ),
  },

  /* ====================================================
     FAITH INTERNAL — EVENTS
  ==================================================== */

  {
    key: "events",
    title: "Events",
    label: "Events",
    icon: Globe,
    hidden: true,
    element: (
      <ProphecyEventsDashboard />
    ),
  },

  /* ====================================================
     FAITH INTERNAL — REFERENTIAL
  ==================================================== */

  {
    key: "referential",
    title: "Referential",
    label: "Referential",
    icon: Layers,
    hidden: true,
    element: (
      <ReferentialDashboard />
    ),
  },

  /* ====================================================
     ACCOUNT INTERNAL
  ==================================================== */

  {
    key: "accounts",
    title: "Account",
    label: "Account",
    icon: UserCircle,
    hidden: true,
    element: (
      <UserAccountDashboard />
    ),
    restricted: true,
  },

  /* ====================================================
     REVELAAI
  ==================================================== */

  {
    key: "ai",
    title: "RevelaAI",
    label: "AI",
    icon: Bot,
    hidden: true,
    element: (
      <AIAssistantDashboard />
    ),
  },
];

/* ======================================================
   DEFAULT GLOBAL DASHBOARD
====================================================== */

export const DEFAULT_DASHBOARD_KEY =
  "home";

/* ======================================================
   GLOBAL DASHBOARD KEY LOOKUP
====================================================== */

export const DASHBOARD_KEYS =
  Object.freeze(
    DASHBOARDS.reduce(
      (
        result,
        dashboard,
      ) => {
        result[
          dashboard.key
        ] = dashboard.key;

        return result;
      },
      {},
    ),
  );

/* ======================================================
   FIND DASHBOARD BY KEY
====================================================== */

export function getDashboardByKey(
  key,
) {
  if (!key) {
    return null;
  }

  return (
    DASHBOARDS.find(
      (
        dashboard,
      ) =>
        dashboard.key ===
        key,
    ) || null
  );
}

/* ======================================================
   GET VISIBLE DASHBOARDS
====================================================== */

export function getVisibleDashboards({
  isGuest = false,
} = {}) {
  return DASHBOARDS
    .filter(
      (
        dashboard,
      ) =>
        !dashboard.hidden,
    )
    .filter(
      (
        dashboard,
      ) => {
        if (
          isGuest &&
          dashboard.key ===
            "accounts"
        ) {
          return false;
        }

        return true;
      },
    );
}