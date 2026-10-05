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
  notifications = [],
  walletTransactions = [],
  biashara = {},
  communityPosts = [],
}) {
  const activities = [];

  /* ====================================================
     NOTIFICATIONS
  ==================================================== */

  notifications
    .slice(0, 8)
    .forEach(
      (
        notification,
        index,
      ) => {
        const timestamp =
          notification.timestamp ||
          notification.created_at ||
          notification.createdAt ||
          null;

        activities.push({
          id:
            notification.id ||
            notification._id ||
            `notification-${index}`,

          title:
            notification.text ||
            notification.message ||
            notification.body ||
            "Notification",

          time:
            formatDateTime(
              timestamp,
            ),

          value: "",

          positive: false,

          icon: Bell,

          timestamp:
            timestampOf(
              notification,
            ),
        });
      },
    );

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
   HOME DASHBOARD
   REAL SYSTEM DATA ONLY
====================================================== */

function HomeDashboard({
  onNavigate,
  user,
}) {
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
              : `${formatNumber(
                  walletTransactions.length,
                )} recorded transaction${
                  walletTransactions.length ===
                  1
                    ? ""
                    : "s"
                }`,
          icon: WalletCards,
          className:
            "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
          clickable: true,
          route: "payments",
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
          notifications,
          walletTransactions,
          biashara,
          communityPosts,
        }),
      [
        notifications,
        walletTransactions,
        biashara,
        communityPosts,
      ],
    );

  /* ====================================================
     HUBS
  ==================================================== */

  const hubs = [
    {
      key: "faith",
      title:
        "Faith & Scripture",
      description:
        "Bible, Prophecy, SDA Lessons & more",
      icon: BookOpen,
      gradient:
        "from-indigo-600 via-purple-600 to-violet-700",
    },

    {
      key: "education",
      title: "Education",
      description:
        "Schools, Classes, Fees, Projects & more",
      icon: GraduationCap,
      gradient:
        "from-emerald-600 to-green-700",
    },

    {
      key: "shamba",
      title: "Shamba",
      description:
        "Farming, crop planning, seasons, markets & agricultural insights",
      icon: Leaf,
      gradient:
        "from-orange-500 via-amber-500 to-yellow-500",
    },

    {
      key: "biashara",
      title: "Biashara",
      description:
        "Products, Sales, Customers, Expenses & more",
      icon: ShoppingCart,
      gradient:
        "from-blue-600 to-cyan-600",
    },
  ];

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[1500px]
        space-y-5
      "
    >
      {/* ==================================================
          WELCOME
      ================================================== */}

      <section
        className="
          rounded-2xl
          border
          border-gray-200/70
          bg-white
          p-5
          shadow-sm
          dark:border-gray-800
          dark:bg-gray-900
          sm:p-6
        "
      >
        <div>
          <p
            className="
              text-xs
              font-bold
              uppercase
              tracking-[0.16em]
              text-indigo-600
              dark:text-indigo-400
            "
          >
            RevelaCode Ecosystem
          </p>

          <h1
            className="
              mt-2
              text-2xl
              font-black
              tracking-tight
              text-gray-900
              dark:text-white
              sm:text-3xl
            "
          >
            Welcome, {displayName} 👋
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-gray-600
              dark:text-gray-400
            "
          >
            Explore your ecosystem of
            tools, services,
            intelligence and
            opportunities.
          </p>
        </div>
      </section>

      {/* ==================================================
          YOUR HUBS
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
            Your Hubs
          </h2>

          <p
            className="
              mt-1
              text-sm
              text-gray-500
              dark:text-gray-400
            "
          >
            Access the platforms that
            power your world.
          </p>
        </div>

        <div
          className="
            mt-5
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >
          {hubs.map(
            (hub) => {
              const Icon =
                hub.icon;

              return (
                <button
                  key={hub.key}
                  type="button"
                  onClick={() =>
                    onNavigate?.(
                      hub.key,
                    )
                  }
                  className={`
                    group
                    relative
                    min-h-[210px]
                    overflow-hidden
                    rounded-2xl
                    bg-gradient-to-br
                    ${hub.gradient}
                    p-5
                    text-left
                    text-white
                    shadow-lg
                    transition-all
                    duration-200
                    hover:-translate-y-1
                    hover:shadow-xl
                    active:scale-[0.99]
                  `}
                >
                  <div
                    className="
                      pointer-events-none
                      absolute
                      -right-10
                      -top-10
                      h-32
                      w-32
                      rounded-full
                      bg-white/10
                      blur-2xl
                    "
                  />

                  <div
                    className="
                      relative
                      z-10
                      flex
                      h-full
                      flex-col
                      justify-between
                    "
                  >
                    <div>
                      <Icon
                        size={42}
                        strokeWidth={
                          1.8
                        }
                      />

                      <h3
                        className="
                          mt-5
                          text-xl
                          font-black
                        "
                      >
                        {hub.title}
                      </h3>

                      <p
                        className="
                          mt-2
                          max-w-sm
                          text-sm
                          leading-6
                          text-white/85
                        "
                      >
                        {
                          hub.description
                        }
                      </p>
                    </div>

                    <div
                      className="
                        mt-5
                        flex
                        items-center
                        justify-between
                        rounded-xl
                        bg-white/15
                        px-4
                        py-3
                        backdrop-blur-sm
                      "
                    >
                      <span
                        className="
                          text-sm
                          font-bold
                        "
                      >
                        Open Hub
                      </span>

                      <ArrowRight
                        size={18}
                        className="
                          transition-transform
                          group-hover:translate-x-1
                        "
                      />
                    </div>
                  </div>
                </button>
              );
            },
          )}
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
              Ecosystem Overview
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-gray-500
                dark:text-gray-400
              "
            >
              Live information returned by
              your connected RevelaCode
              services.
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

            Live data
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
            Recent events collected from
            connected ecosystem services.
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