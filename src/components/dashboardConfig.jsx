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
  ShieldCheck,
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
import DemoLauncher from "@/demo/DemoLauncher.jsx";
import { ErrorBoundary } from "./common/ErrorBoundary.jsx";

/* ======================================================
   HARDENED SAFE LAZY LOADING
====================================================== */

function safeLazy(importFn, name) {
  const LazyComp = lazy(async () => {
    const retryKey = `revelacode-chunk-reload:${name}`;
    try {
      const module = await importFn();
      try { sessionStorage.removeItem(retryKey); } catch {}
      return module;
    } catch (firstError) {
      console.error(`Lazy chunk failed for ${name}; retrying once.`, firstError);
      try {
        await new Promise((resolve) => window.setTimeout(resolve, 350));
        const module = await importFn();
        try { sessionStorage.removeItem(retryKey); } catch {}
        return module;
      } catch (retryError) {
        let didReload = false;
        try {
          didReload = sessionStorage.getItem(retryKey) === "1";
          if (!didReload) sessionStorage.setItem(retryKey, "1");
        } catch { didReload = true; }
        if (!didReload && typeof window !== "undefined") window.location.reload();
        console.error(`Lazy chunk retry failed for ${name}.`, retryError);
        throw retryError;
      }
    }
  });
  return function SafeLazyComponent(props) {
    return <ErrorBoundary>
      <Suspense fallback={<div role="status" className="flex min-h-[240px] items-center justify-center gap-3 p-6 text-sm text-slate-400"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />Loading {name}…</div>}>
        <LazyComp {...props} />
      </Suspense>
    </ErrorBoundary>;
  };
}

function formatNumber(
  value,
) {
  if (value === null || value === undefined || value === "") return "—";
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
  if (value === null || value === undefined || value === "") return "—";
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

const HumanizerDashboard = safeLazy(
  () => import("@/pages/HumanizerWorkspace.jsx"),
  "Humanizer Studio",
);

const SecurityAcademyDashboard = safeLazy(
  () => import("./SecurityAcademyDashboard.jsx"),
  "Security Academy",
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

export const HOME_HUBS = Object.freeze([
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
  const isAndroidAppBuild = import.meta.env.VITE_ANDROID_APP === "true";

  const {
    notifications,
    unreadCount,
    loading:
      notificationsLoading,
    markAsRead,
  } = useNotifications(
    30000,
  );
  const [systemUpdateRows, setSystemUpdateRows] = useState([]);

  useEffect(() => {
    const androidBuild = import.meta.env.VITE_ANDROID_APP === "true";
    const windowsBuild = import.meta.env.VITE_TAURI_APP === "true";
    if (!androidBuild && !windowsBuild) return undefined;
    let active = true;
    const checkRelease = async () => {
      try {
        const platform = androidBuild ? "android" : "windows";
        const repo = androidBuild ? "RevelaCode-Android" : "RevelaCode-Windows";
        const currentVersion = String(import.meta.env.VITE_APP_VERSION || (androidBuild ? "2.2.1" : "0.1.3")).replace(/^v/, "");
        const response = await fetch(`https://api.github.com/repos/musombi123/${repo}/releases/latest`, {
          headers: { Accept: "application/vnd.github+json" },
          cache: "no-store",
        });
        if (!response.ok) return;
        const release = await response.json();
        const latestVersion = String(release.tag_name || release.name || "").replace(/^v/i, "").match(/[0-9]+(?:\.[0-9]+)*/)?.[0] || "";
        const compare = (left, right) => {
          const a = left.split(".").map(Number);
          const b = right.split(".").map(Number);
          for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
            const delta = (a[i] || 0) - (b[i] || 0);
            if (delta) return delta;
          }
          return 0;
        };
        if (!latestVersion || compare(latestVersion, currentVersion) <= 0) {
          if (active) setSystemUpdateRows([]);
          return;
        }
        const wanted = androidBuild ? /\.apk$/i : /RevelaCode-Windows-Setup\.exe$/i;
        const asset = (release.assets || []).find((item) => wanted.test(String(item.name || "")));
        const actionUrl = asset?.browser_download_url || release.html_url;
        if (!actionUrl || !active) return;
        let alreadySeen = false;
        try {
          const seenKey = `revelacode_seen_update:${platform}:${latestVersion}`;
          alreadySeen = localStorage.getItem(seenKey) === "true";
          if (!alreadySeen) localStorage.setItem(seenKey, "true");
        } catch { /* Update remains visible in the feed. */ }
        const row = {
          id: `system-update-${platform}-${latestVersion}`,
          title: androidBuild ? `RevelaCode Android ${latestVersion} is available` : `RevelaCode Windows ${latestVersion} is available`,
          text: androidBuild ? "Download the latest APK to update your RevelaCode app." : "Download and run the latest Windows installer to update RevelaCode.",
          type: "system_update",
          timestamp: release.published_at || release.created_at || new Date().toISOString(),
          action_url: actionUrl,
          hub: "settings",
          read: alreadySeen,
        };
        setSystemUpdateRows([row]);
      } catch {
        // Release lookup is optional; never expose GitHub/API errors in the UI.
      }
    };
    checkRelease();
    return () => { active = false; };
  }, []);

  const [notificationToast, setNotificationToast] = useState(null);
  const seenNotificationIds = React.useRef(new Set());
  const notificationFeedInitialized = React.useRef(false);

  useEffect(() => {
    const all = [...(notifications || []), ...systemUpdateRows]
      .filter((item) => item && item.id != null)
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    if (!notificationFeedInitialized.current) {
      if (notificationsLoading) return;
      all.forEach((item) => seenNotificationIds.current.add(String(item.id)));
      notificationFeedInitialized.current = true;
      return;
    }
    const unseen = all.filter((item) => !seenNotificationIds.current.has(String(item.id)));
    if (!unseen.length) return;
    unseen.forEach((item) => seenNotificationIds.current.add(String(item.id)));
    const newest = unseen[0];
    if (newest.read) return;
    setNotificationToast(newest);
    const id = String(newest.id);
    const timer = window.setTimeout(() => setNotificationToast((current) => String(current?.id) === id ? null : current), 10000);
    return () => window.clearTimeout(timer);
  }, [notifications, systemUpdateRows, notificationsLoading]);

  const openHomeNotification = async (notification) => {
    if (!notification) return;
    if (!String(notification.id).startsWith("system-update-") && !notification.read && typeof markAsRead === "function") await markAsRead(notification.id);
    const destination = String(
      notification.target_hub || notification.hub || notification.route || notification.workspace || ""
    ).trim().toLowerCase();
    const hubAliases = {
      scripture: "faith", bible: "faith", study: "faith", sda: "faith", quarterly: "faith",
      elimu: "education", school: "education", business: "biashara", farming: "shamba",
    };
    const hub = hubAliases[destination] || destination;
    if (String(notification.id).startsWith("system-update-") && (notification.action_url || notification.url)) {
      const target = String(notification.action_url || notification.url);
      try {
        const parsed = new URL(target, window.location.origin);
        if (parsed.protocol === "https:") window.location.assign(parsed.href);
      } catch { /* Ignore malformed release links. */ }
    } else if (["home", "faith", "education", "shamba", "biashara", "community", "ai", "humanizer", "settings", "profile"].includes(hub)) {
      onNavigate?.(hub);
    } else if (notification.action_url || notification.url) {
      const target = String(notification.action_url || notification.url);
      try {
        const parsed = new URL(target, window.location.origin);
        if (parsed.origin === window.location.origin || parsed.protocol === "https:") window.location.assign(parsed.href);
      } catch { /* Ignore malformed notification links. */ }
    }
    setNotificationToast(null);
  };

  const notificationRows = [...(notifications || []), ...systemUpdateRows]
    .filter(Boolean)
    .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
    .slice(0, 6);

  const renderHomeNotifications = () => (
    <section aria-label={t("System notifications")} className="min-w-0 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0"><h2 className="text-sm font-black text-slate-950 dark:text-white">{t("Notifications")}</h2><p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{t("Updates and activity from your RevelaCode hubs.")}</p></div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{formatNumber((unreadCount || 0) + systemUpdateRows.filter((item) => !item.read).length)} {t("unread")}</span>
      </div>
      {notificationRows.length ? (
        <div className="mt-2 divide-y divide-slate-100 dark:divide-white/10">
          {notificationRows.map((item) => (
            <button key={item.id} type="button" onClick={() => openHomeNotification(item)} className="flex min-h-14 w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-white/5">
              <span className={"h-2.5 w-2.5 shrink-0 rounded-full " + (item.read ? "bg-slate-300 dark:bg-slate-700" : "bg-blue-500")}/>
              <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-slate-900 dark:text-white">{item.title || item.text || item.message || t("RevelaCode notification")}</span><span className="mt-0.5 block truncate text-[11px] text-slate-500 dark:text-slate-400">{item.text || item.message || item.description || ""}</span></span>
              <span className="shrink-0 text-[10px] font-semibold text-slate-400">{formatDateTime(item.timestamp)}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">{notificationsLoading ? t("Checking for notifications…") : t("You are all caught up.")}</p>
      )}
    </section>
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

  const displayHubs = ["education", "community", "faith", "biashara", "shamba"]
    .map((key) => HOME_HUBS.find((hub) => hub.key === key))
    .filter(Boolean);
  const mostUsedKey = hasHubHistory ? sortedHubs[0]?.key : null;
  const resumeActivity = activities.find((activity) => activity.route);
  const unreadTotal = (Number(unreadCount) || 0) + systemUpdateRows.filter((item) => !item.read).length;
  const statTone = {
    wallet: "rc-home-stat-wallet",
    "biashara-orders": "rc-home-stat-biashara",
    "shamba-farms": "rc-home-stat-shamba",
    "community-activity": "rc-home-stat-community",
  };

  return (
    <main className="rc-home-one-screen" aria-label={t("RevelaCode home")}>
      <section className="rc-home-hero rc-home-glass" data-demo="home-welcome">
        <div className="rc-home-hero-copy">
          <span className="rc-home-eyebrow"><span className="rc-home-live-dot" />{t("Your connected ecosystem")}</span>
          <h1>{t(greetingKey)} <span>{displayName}</span></h1>
          <p>{t("Learn, build, grow and connect across one intelligent ecosystem.")}</p>
          <div className="rc-home-hero-actions">
            <DemoLauncher startAt="home" />
            {isGuest ? (
              <button type="button" className="rc-home-meta-chip" onClick={() => onRequestSignIn?.()}>
                <UserCircle size={14} /><span>{t("Sign in")}</span>
              </button>
            ) : null}
            {resumeActivity ? (
              <button type="button" className="rc-home-meta-chip" onClick={() => onNavigate?.(resumeActivity.route)} aria-label={t("Continue") + ": " + resumeActivity.title}>
                <History size={14} /><span>{t("Continue")}</span>
              </button>
            ) : null}
            <details className="rc-home-notification-menu">
              <summary className="rc-home-meta-chip" aria-label={t("Notifications") + ": " + formatNumber(unreadTotal) + " " + t("unread")}>
                <Bell size={14} /><span>{notificationsLoading ? "…" : formatNumber(unreadTotal)} {t("unread")}</span>
                {unreadTotal > 0 ? <i /> : null}
              </summary>
              <div className="rc-home-notification-popover">{renderHomeNotifications()}</div>
            </details>
          </div>
        </div>
        <div className="rc-home-hero-mark" aria-hidden="true">
          <span className="rc-home-orbit rc-home-orbit-one" />
          <span className="rc-home-orbit rc-home-orbit-two" />
          <span className="rc-home-hero-core"><Layers size={34} /></span>
        </div>
      </section>

      <section className="rc-home-ai-card" aria-label={t("RevelaAI assistant")} data-demo="home-revelaai">
        <div className="rc-home-ai-top">
          <span className="rc-home-ai-icon"><Sparkles size={20} /></span>
          <span className="rc-home-ai-pill"><span />{t("RevelaAI assistant")}</span>
        </div>
        <div className="rc-home-ai-copy">
          <p>{t("Your thinking partner")}</p>
          <h2>{t("Think with RevelaAI")}</h2>
          <span>{t("Explore ideas, solve problems and create with intelligence.")}</span>
        </div>
        <button type="button" className="rc-home-ask-bar" onClick={() => onOpenAI?.()} aria-label={t("Ask RevelaAI anything")}>
          <span>{t("Ask anything…")}</span><span className="rc-home-ask-submit"><ArrowRight size={17} /></span>
        </button>
      </section>

      <section className="rc-home-hubs" aria-label={t("Your connected hubs")} data-demo="home-hubs">
        {displayHubs.map((hub) => {
          const Icon = hub.icon;
          const uses = Number(hubUsage[hub.key]?.count) || 0;
          const group = HOME_HUB_GROUPS.find((item) => item.hubKeys.includes(hub.key));
          const isMostUsed = mostUsedKey === hub.key && uses > 0;
          return (
            <button
              key={hub.key}
              type="button"
              onClick={() => handleHubOpen(hub.key)}
              data-demo={"home-hub-" + hub.key}
              aria-label={t("Open") + " " + t(hub.title)}
              className={"rc-home-hub rc-home-hub-" + hub.key}
            >
              <span className="rc-home-hub-head">
                <span className="rc-home-hub-icon"><Icon size={21} strokeWidth={2} /></span>
                {isMostUsed ? <span className="rc-home-top-badge">{t("Top")}</span> : <ArrowRight size={16} className="rc-home-hub-arrow" />}
              </span>
              <span className="rc-home-hub-group">{t(group?.title || "Your hubs")}</span>
              <span className="rc-home-hub-title">{t(hub.title)}</span>
              <span className="rc-home-hub-description">{t(hub.description)}</span>
              <span className="rc-home-hub-footer"><span className="rc-home-hub-status" />{uses > 0 ? formatNumber(uses) + " " + t("opens") : t("Ready when you are")}</span>
            </button>
          );
        })}
      </section>

      <section className="rc-home-overview rc-home-glass" aria-label={t("Ecosystem overview")}>
        <div className="rc-home-section-heading">
          <div><span>{t("Your ecosystem")}</span><h2>{t("Overview")}</h2></div>
          <span className={"rc-home-connected " + (ecosystemLoading || notificationsLoading ? "is-syncing" : "")}><i />{isGuest ? t("Explore mode") : ecosystemLoading || notificationsLoading ? t("Syncing") : t("Connected")}</span>
        </div>
        <div className="rc-home-stats">
          {primaryOverview.map((item) => {
            const Icon = item.icon;
            const loading = !isGuest && ecosystemLoading && item.key !== "wallet";
            return (
              <button
                key={item.key}
                type="button"
                disabled={!item.route}
                onClick={() => item.route && onNavigate?.(item.route)}
                className={"rc-home-stat " + (statTone[item.key] || "")}
                aria-label={t(item.title) + ": " + item.value}
              >
                <span className="rc-home-stat-icon"><Icon size={17} /></span>
                <span className="rc-home-stat-label">{t(item.title)}</span>
                <strong>{loading ? "…" : item.value || "—"}</strong>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rc-home-humanizer" aria-label={t("Humanizer Studio")}>
        <span className="rc-home-humanizer-icon"><Sparkles size={21} /></span>
        <div className="rc-home-humanizer-copy">
          <span>{t("RevelaAI · Writing Studio")}</span>
          <h2>{t("Humanizer Studio")}</h2>
          <p>{t("Refine writing, improve clarity and prepare polished documents.")}</p>
        </div>
        <button type="button" onClick={() => onNavigate?.("humanizer")} aria-label={t("Open Humanizer Studio")}>
          {t("Open")} <ArrowRight size={15} />
        </button>
      </section>

      {notificationToast ? (
        <button type="button" onClick={() => openHomeNotification(notificationToast)} className="rc-home-toast" aria-live="polite">
          <Bell size={17} /><span><strong>{notificationToast.title || t("RevelaCode notification")}</strong><small>{notificationToast.text || notificationToast.message}</small></span><ArrowRight size={15} />
        </button>
      ) : null}
    </main>
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

  {
    key: "security-academy",
    title: "Security Academy",
    label: "Security Academy",
    icon: ShieldCheck,
    element: <SecurityAcademyDashboard />,
  },

  /* ====================================================
     REVELAAI
  ==================================================== */

  {
    key: "ai",
    title: "RevelaAI",
    label: "AI",
    icon: Bot,
    element: (
      <AIAssistantDashboard />
    ),
  },

  {
    key: "humanizer",
    title: "Humanizer Studio",
    label: "Humanizer",
    icon: Sparkles,
    hidden: true,
    element: <HumanizerDashboard />,
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
          (dashboard.restricted ||
            ["accounts", "profile", "settings", "payments"].includes(dashboard.key))
        ) {
          return false;
        }

        return true;
      },
    );
}