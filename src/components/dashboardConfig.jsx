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
  Construction,
} from "lucide-react";

import {
  useJumuiyaApi,
} from "@/services/jumuiyaApi.jsx";

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
  user,
}) {
  const { language, t } = usePreferences();
  const { history: userHistory = [] } = useHistory();

  const {
    getWalletLedger,
    getBiasharaDashboard,
    getShambaDashboard,
    getElimuDashboard,
    getCommunityFeed,
  } = useJumuiyaApi();

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

  /* ====================================================
     LOAD CONNECTED ECOSYSTEM SERVICES
  ==================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadEcosystem() {
      if (
        !user ||
        isGuest
      ) {
        setEcosystemData({
          wallet: null,
          biashara: null,
          shamba: null,
          education: null,
          community: [],
        });

        return;
      }

      setEcosystemLoading(
        true,
      );

      const results =
        await Promise.allSettled([
          getWalletLedger(),

          getBiasharaDashboard(),

          getShambaDashboard(),

          getElimuDashboard(),

          getCommunityFeed({
            limit: 30,
          }),
        ]);

      if (!mounted) {
        return;
      }

      const [
        walletResult,
        biasharaResult,
        shambaResult,
        educationResult,
        communityResult,
      ] = results;

      setEcosystemData({
        wallet:
          walletResult.status ===
          "fulfilled"
            ? walletResult.value ||
              null
            : null,

        biashara:
          biasharaResult.status ===
          "fulfilled"
            ? biasharaResult.value ||
              null
            : null,

        shamba:
          shambaResult.status ===
          "fulfilled"
            ? shambaResult.value ||
              null
            : null,

        education:
          educationResult.status ===
          "fulfilled"
            ? educationResult.value ||
              null
            : null,

        community:
          communityResult.status ===
          "fulfilled"
            ? normalizeCommunityFeed(
                communityResult.value,
              )
            : [],
      });

      setEcosystemLoading(
        false,
      );
    }

    loadEcosystem();

    return () => {
      mounted = false;
    };
  }, [
    user,
    isGuest,
    getWalletLedger,
    getBiasharaDashboard,
    getShambaDashboard,
    getElimuDashboard,
    getCommunityFeed,
  ]);

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

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[1500px]
        space-y-4
        sm:space-y-5
      "
    >
      {/* ==================================================
          WELCOME
      ================================================== */}

      <section className="relative isolate overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:rounded-[1.75rem] sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-400/10" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-400/10" />
        <div className="relative grid gap-3 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.72fr)] lg:items-center">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" /> RevelaCode ecosystem</div>
            <h1 className="mt-3 text-xl font-black tracking-[-0.04em] text-slate-950 dark:text-white sm:mt-4 sm:text-3xl lg:text-4xl">{t("Welcome back,")} <span className="text-blue-700 dark:text-blue-300">{displayName}</span></h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-600 dark:text-slate-300 sm:mt-3 sm:text-base sm:leading-7">{t("One connected place to learn, build, grow and connect. Pick up where you left off or jump straight into your world.")}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 sm:mt-5 sm:gap-2 sm:text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800"><Layers size={14} /> {t("Five connected hubs")}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800"><Sparkles size={14} /> {t("Intelligence built in")}</span>
            </div>
          </div>
          <button type="button" onClick={() => onOpenAI?.()} className="group relative w-full overflow-hidden rounded-xl border border-blue-200/70 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-3 text-left text-white shadow-lg shadow-blue-950/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-950/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-blue-400/20 dark:from-slate-800 dark:via-blue-950 dark:to-indigo-950 dark:shadow-black/20 dark:focus-visible:ring-offset-slate-900 sm:p-5" aria-label="Open RevelaAI assistant">
            <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl transition group-hover:bg-white/15" />
            <div className="relative flex items-start justify-between gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/15 shadow-inner backdrop-blur"><Sparkles size={22} /></div><span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> AI assistant</span></div>
            <h2 className="relative mt-4 text-lg font-extrabold tracking-tight sm:text-xl">{t("Think with RevelaAI")}</h2>
            <p className="relative mt-1.5 hidden max-w-sm text-sm leading-5 text-blue-50/90 dark:text-slate-200 sm:block">{language === "sw" ? "Pata msaada katika vituo vyako vya RevelaCode." : language === "fr" ? "Obtenez de l’aide dans vos espaces RevelaCode connectés." : "Get help across your connected RevelaCode workspaces."}</p>
            <div className="relative mt-3 flex items-center justify-between rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-xs font-bold backdrop-blur-sm sm:mt-4 sm:px-3.5 sm:py-3 sm:text-sm">{t("Start a conversation")} <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></div>
          </button>
        </div>
      </section>

      <section aria-label="Quick access to recent hubs" className="space-y-2">
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-base">{t(hasHubHistory ? "Your quick access" : "Quick access")}</h2>
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">{hasHubHistory ? "Recently used spaces" : "Start with a connected hub"}</p>
          </div>
          <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">{t("Personalized")}</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {frequentHubs.map((hub) => {
            const Icon = hub.icon;
            const uses = Number(hubUsage[hub.key]?.count) || 0;
            return (
              <button
                key={hub.key}
                type="button"
                onClick={() => handleHubOpen(hub.key)}
                className={"group flex min-h-11 shrink-0 items-center gap-2 rounded-xl border " + hub.borderTone + " " + hub.surface + " px-2.5 py-2 text-left transition hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"}
                aria-label={"Open " + hub.title}
              >
                <span className={"flex h-7 w-7 shrink-0 items-center justify-center rounded-lg " + hub.iconBg + " " + hub.iconTone}><Icon size={15} strokeWidth={2} /></span>
                <span className="max-w-[8rem] truncate text-[11px] font-extrabold text-slate-900 dark:text-white sm:text-xs">{t(hub.shortTitle)}</span>
                {uses > 0 ? <span className="rounded-full bg-white/75 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-900/70 dark:text-slate-300">{formatNumber(uses)}</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      {/* ==================================================
          YOUR HUBS — COMPACT CATEGORIZED NAVIGATION
      ================================================== */}
      <section aria-label="Hubs grouped by purpose" className="space-y-3">
        <div className="px-1">
          <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white sm:text-lg">{t("Your Hubs")}</h2>
          <p className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400 sm:text-sm">{t("Choose a category, then open the workspace you need.")}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {HOME_HUB_GROUPS.map((group) => {
            const hubs = sortedHubs.filter((hub) => group.hubKeys.includes(hub.key));
            if (!hubs.length) return null;

            return (
              <section key={group.key} aria-labelledby={"hub-group-" + group.key} className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
                <div className="mb-2.5">
                  <h3 id={"hub-group-" + group.key} className="text-xs font-black text-slate-900 dark:text-white sm:text-sm">{t(group.title)}</h3>
                  <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400 sm:text-xs">{t(group.description)}</p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  {hubs.map((hub) => {
                    const Icon = hub.icon;
                    const uses = Number(hubUsage[hub.key]?.count) || 0;
                    const isMostUsed = hasHubHistory && hub.key === sortedHubs[0]?.key && uses > 0;

                    return (
                      <button
                        key={hub.key}
                        type="button"
                        onClick={() => handleHubOpen(hub.key)}
                        className={"group flex min-h-[64px] min-w-0 items-center gap-2.5 rounded-xl border " + hub.borderTone + " bg-white p-2.5 text-left transition hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-slate-950 dark:focus-visible:ring-offset-slate-950 sm:min-h-[76px] sm:gap-3 sm:p-3"}
                        aria-label={"Open " + hub.title}
                      >
                        <span className={"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " + hub.iconBg + " " + hub.iconTone}>
                          <Icon size={18} strokeWidth={2} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate text-xs font-extrabold text-slate-900 dark:text-white sm:text-sm">{t(hub.shortTitle)}</span>
                            {isMostUsed ? <span className="shrink-0 rounded-full bg-blue-50 px-1.5 py-0.5 text-[8px] font-extrabold uppercase text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">{t("Top")}</span> : null}
                          </span>
                          <span className="mt-0.5 block truncate text-[10px] leading-4 text-slate-500 dark:text-slate-400 sm:whitespace-normal sm:text-xs">{t(hub.description)}</span>
                        </span>
                        <ArrowRight size={14} className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-300" />
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      {/* ==================================================
          LIVE ECOSYSTEM OVERVIEW
      ================================================== */}

      <section
        className="
          rounded-2xl
          border
          border-gray-200/70
          bg-white
          p-4
          shadow-sm
          dark:border-gray-800
          dark:bg-gray-900
          sm:p-5
        "
      >
        <div
          className="
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div>
            <h2
              className="
                text-lg
                font-black
                text-gray-900
                dark:text-white
              "
            >
              {t("Ecosystem Overview")}
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-gray-500
                dark:text-gray-400
              "
            >
              {t("Live information returned by your connected RevelaCode services.")}
            </p>
          </div>

          <span
            className="
              inline-flex
              w-fit
              items-center
              gap-1.5
              rounded-full
              border
              border-emerald-200
              bg-emerald-50
              px-3
              py-1.5
              text-[11px]
              font-bold
              text-emerald-700
              dark:border-emerald-900/50
              dark:bg-emerald-950/20
              dark:text-emerald-400
            "
          >
            <span
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-emerald-500
              "
            />

            {isGuest
              ? "Explore mode"
              : ecosystemLoading || notificationsLoading
                ? "Syncing data"
                : "Connected services"}
          </span>
        </div>

        <div
          className="
            mt-5
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-3
            lg:grid-cols-4
          "
        >
          {overview.map(
            (item) => {
              const Icon =
                item.icon;

              const content = (
                <>
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >
                    <Icon
                      size={21}
                    />

                    {item.clickable ? (
                      <ArrowRight
                        size={15}
                        className="
                          opacity-50
                          transition
                          group-hover:translate-x-0.5
                          group-hover:opacity-100
                        "
                      />
                    ) : null}
                  </div>

                  <p
                    className="
                      mt-3
                      text-xs
                      font-semibold
                    "
                  >
                    {item.title}
                  </p>

                  <p
                    className="
                      mt-1
                      text-lg
                      font-black
                      tracking-tight
                    "
                  >
                    {item.value}
                  </p>

                  <p
                    className="
                      mt-1
                      line-clamp-2
                      text-[11px]
                      leading-5
                      opacity-75
                    "
                  >
                    {item.helper}
                  </p>
                </>
              );

              if (
                item.clickable &&
                item.route
              ) {
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      onNavigate?.(
                        item.route,
                      )
                    }
                    className={`
                      group
                      rounded-2xl
                      p-4
                      text-left
                      transition
                      hover:-translate-y-0.5
                      hover:shadow-sm
                      ${item.className}
                    `}
                  >
                    {content}
                  </button>
                );
              }

              return (
                <div
                  key={item.key}
                  className={`
                    rounded-2xl
                    p-4
                    ${item.className}
                  `}
                >
                  {content}
                </div>
              );
            },
          )}
        </div>

        {!isGuest ? (
          <div
            className="
              mt-4
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              px-4
              py-3
              dark:border-white/5
              dark:bg-slate-800/40
            "
          >
            <p
              className="
                text-[11px]
                leading-5
                text-slate-500
                dark:text-slate-400
              "
            >
              No placeholder figures are
              used here. When a service does
              not return usable data, the
              corresponding value remains
              unavailable instead of being
              fabricated.
            </p>
          </div>
        ) : null}
      </section>

      {/* ==================================================
          RECENT ACTIVITY
      ================================================== */}

      <section
        className="
          rounded-2xl
          border
          border-gray-200/70
          bg-white
          p-4
          shadow-sm
          dark:border-gray-800
          dark:bg-gray-900
          sm:p-5
        "
      >
        <div>
          <h2
            className="
              text-lg
              font-black
              text-gray-900
              dark:text-white
            "
          >
            Recent Activity
          </h2>

          <p
            className="
              mt-1
              text-sm
              text-gray-500
              dark:text-gray-400
            "
          >
            Your actions across RevelaCode — not notifications.
          </p>
        </div>

        <div
          className="
            mt-4
            divide-y
            divide-gray-100
            dark:divide-gray-800
          "
        >
          {activities.length ? (
            activities.map(
              (
                activity,
                index,
              ) => {
                const Icon =
                  activity.icon;

                const interactive =
                  Boolean(
                    activity.route,
                  );

                const content = (
                  <>
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-gray-100
                        text-gray-600
                        dark:bg-gray-800
                        dark:text-gray-300
                      "
                    >
                      <Icon
                        size={18}
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
                          truncate
                          text-sm
                          font-semibold
                          text-gray-900
                          dark:text-white
                        "
                      >
                        {
                          activity.title
                        }
                      </p>

                      <p
                        className="
                          mt-1
                          truncate
                          text-xs
                          text-gray-500
                          dark:text-gray-400
                        "
                      >
                        {
                          activity.time
                        }
                      </p>
                    </div>

                    {activity.value ? (
                      <span
                        className={`
                          shrink-0
                          text-xs
                          font-bold
                          ${
                            activity.positive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-gray-600 dark:text-gray-300"
                          }
                        `}
                      >
                        {
                          activity.value
                        }
                      </span>
                    ) : null}
                  </>
                );

                if (
                  interactive
                ) {
                  return (
                    <button
                      key={
                        activity.id ||
                        `${activity.title}-${index}`
                      }
                      type="button"
                      onClick={() =>
                        onNavigate?.(
                          activity.route,
                        )
                      }
                      className="
                        flex
                        w-full
                        items-center
                        gap-3
                        py-4
                        text-left
                        transition
                        hover:bg-gray-50
                        dark:hover:bg-gray-800/40
                      "
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <div
                    key={
                      activity.id ||
                      `${activity.title}-${index}`
                    }
                    className="
                      flex
                      items-center
                      gap-3
                      py-4
                    "
                  >
                    {content}
                  </div>
                );
              },
            )
          ) : (
            <div
              className="
                flex
                min-h-[190px]
                flex-col
                items-center
                justify-center
                rounded-2xl
                border
                border-dashed
                border-gray-200
                px-6
                text-center
                dark:border-gray-800
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
                  bg-gray-100
                  text-gray-500
                  dark:bg-gray-800
                  dark:text-gray-400
                "
              >
                <History
                  size={20}
                />
              </div>

              <p
                className="
                  mt-3
                  text-sm
                  font-semibold
                  text-gray-800
                  dark:text-gray-200
                "
              >
                No recent activity
              </p>

              <p
                className="
                  mt-1
                  max-w-sm
                  text-xs
                  leading-5
                  text-gray-500
                  dark:text-gray-400
                "
              >
                Real activity will appear
                here as you use the
                RevelaCode ecosystem.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ==================================================
          CONTINUE
      ================================================== */}

      <section
        className="
          rounded-2xl
          border
          border-gray-200/70
          bg-white
          p-4
          shadow-sm
          dark:border-gray-800
          dark:bg-gray-900
        "
      >
        <div className="flex items-start gap-3">
          <div
            className="
              flex
              h-10
              w-10
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
            <History
              size={18}
            />
          </div>

          <div className="min-w-0">
            <h3
              className="
                font-bold
                text-gray-900
                dark:text-white
              "
            >
              Continue where you left off
            </h3>

            <p
              className="
                mt-1
                text-sm
                text-gray-600
                dark:text-gray-400
              "
            >
              {lastActivityText ||
                "No saved activity yet. Start exploring the ecosystem."}
            </p>

            {prettyTime ? (
              <p
                className="
                  mt-1
                  text-xs
                  text-gray-400
                "
              >
                {prettyTime}
              </p>
            ) : null}

            {historyCount > 0 ? (
              <p
                className="
                  mt-2
                  text-[11px]
                  font-medium
                  text-indigo-500
                "
              >
                {historyCount} saved activit
                {historyCount === 1
                  ? "y"
                  : "ies"}
              </p>
            ) : null}
          </div>
        </div>
      </section>
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