import React, { lazy, Suspense } from "react";

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
  Sparkles,
  ArrowRight,
  Construction,
} from "lucide-react";

/* ======================================================
   HARDENED SAFE LAZY
====================================================== */

function safeLazy(importFn, name) {
  const LazyComp = lazy(() =>
    importFn().catch((err) => {
      console.error(`🚨 LAZY LOAD FAIL → ${name}:`, err);

      return {
        default: function Fallback() {
          return (
            <div className="p-6 text-sm text-red-500">
              {name} failed to load. Try another tab.
            </div>
          );
        },
      };
    })
  );

  return function SafeComponent(props) {
    return (
      <Suspense
        fallback={
          <div className="p-6 text-sm text-gray-500">
            Loading {name}…
          </div>
        }
      >
        <LazyComp {...props} />
      </Suspense>
    );
  };
}

/* ======================================================
   EXISTING DASHBOARDS
====================================================== */

const BibleDashboard = safeLazy(
  () => import("./BibleDashboard.jsx"),
  "Bible"
);

const ProphecyDashboard = safeLazy(
  () => import("./ProphecyDashboard.jsx"),
  "Prophecy"
);

const ProphecyEventsDashboard = safeLazy(
  () => import("./ProphecyEventsDashboard.jsx"),
  "Events"
);

const ReferentialDashboard = safeLazy(
  () => import("./ReferentialDashboard.jsx"),
  "Referential"
);

const PreferencesDashboard = safeLazy(
  () => import("./PreferencesDashboard.jsx"),
  "Preferences"
);

const UserAccountDashboard = safeLazy(
  () => import("./UserAccountDashboard.jsx"),
  "Account"
);

const AIAssistantDashboard = safeLazy(
  () => import("./AIAssistantDashboard.jsx"),
  "RevelaAI"
);

const FaithDashboard = safeLazy(
  () => import("./FaithDashboard.jsx"),
  "Faith"
);

/* ======================================================
   COMING SOON DASHBOARD
====================================================== */

function ComingSoonDashboard({
  title = "Coming Soon",
  subtitle = "This workspace is currently under development.",
  icon: Icon = Construction,
  gradient = "from-indigo-600 via-purple-600 to-pink-600",
}) {
  return (
    <div className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
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
                  <p className="font-semibold text-gray-900 dark:text-white">
                    We're building this hub.
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                    The goal is to make this part of the
                    RevelaCode ecosystem useful, fast, secure,
                    and ready for real-world use.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-7 text-xs font-medium text-gray-400">
              RevelaCode Ecosystem • More coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const BiasharaDashboard = () => (
  <ComingSoonDashboard
    title="Biashara is Coming Soon"
    subtitle="A complete business workspace for products, sales, customers, expenses, payments, and business intelligence."
    icon={ShoppingCart}
    gradient="from-blue-600 to-cyan-600"
  />
);

const ShambaDashboard = () => (
  <ComingSoonDashboard
    title="Shamba is Coming Soon"
    subtitle="A smart agricultural workspace for crops, market prices, farm inputs, records, and opportunities."
    icon={Leaf}
    gradient="from-orange-500 to-amber-600"
  />
);

const EducationDashboard = () => (
  <ComingSoonDashboard
    title="Education is Coming Soon"
    subtitle="A connected education workspace for schools, classes, fees, projects, learning materials, and more."
    icon={GraduationCap}
    gradient="from-emerald-600 to-green-700"
  />
);

const CommunityDashboard = () => (
  <ComingSoonDashboard
    title="Community is Coming Soon"
    subtitle="A cross-hub community layer connecting people, conversations, announcements, opportunities, and services."
    icon={Users}
    gradient="from-purple-600 to-fuchsia-600"
  />
);

const PaymentsDashboard = () => (
  <ComingSoonDashboard
    title="Payments is Coming Soon"
    subtitle="A unified payment and transaction workspace connecting activity across the RevelaCode ecosystem."
    icon={WalletCards}
    gradient="from-amber-500 to-orange-600"
  />
);

/* ======================================================
   HOME DASHBOARD
====================================================== */

function HomeDashboard({ onNavigate, user }) {
  const historyCount = Number(
    localStorage.getItem("revelacode_history_count") || 0
  );

  const lastActivityText =
    localStorage.getItem("revelacode_last_activity") ||
    "No activity yet. Start exploring your ecosystem.";

  const lastActivityTime =
    localStorage.getItem("revelacode_last_activity_time") || "";

  const prettyTime = lastActivityTime
    ? new Date(lastActivityTime).toLocaleString()
    : "";

  const displayName =
    user?.fullName?.trim() || "Guest User";

  /* ======================================================
     ECOSYSTEM HUBS
  ====================================================== */

  const hubs = [
    {
      key: "faith",
      title: "Faith & Scripture",
      description: "Bible, Prophecy, SDA Lessons & more",
      icon: BookOpen,
      gradient: "from-indigo-600 via-purple-600 to-violet-700",
    },
    {
      key: "education",
      title: "Education",
      description: "Schools, Classes, Fees, Projects & more",
      icon: GraduationCap,
      gradient: "from-emerald-600 to-green-700",
    },
    {
      key: "shamba",
      title: "Shamba",
      description: "Crops, Market Prices, Inputs & more",
      icon: Leaf,
      gradient: "from-orange-500 to-amber-600",
    },
    {
      key: "biashara",
      title: "Biashara",
      description: "Products, Sales, Customers, Expenses & more",
      icon: ShoppingCart,
      gradient: "from-blue-600 to-cyan-600",
    },
  ];

  /* ======================================================
     ECOSYSTEM OVERVIEW
  ====================================================== */

  const overview = [
    {
      title: "Notifications",
      value: "3 new",
      icon: Bell,
      className:
        "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
    },
    {
      title: "Messages",
      value: "5 unread",
      icon: MessageSquare,
      className:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
    },
    {
      title: "Transactions",
      value: "KSh 12,450",
      icon: WalletCards,
      className:
        "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    },
    {
      title: "Tasks",
      value: "8 pending",
      icon: ClipboardList,
      className:
        "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    },
  ];

  /* ======================================================
     RECENT ACTIVITY
  ====================================================== */

  const activities = [
    {
      title: "School fee payment received",
      time: "2 mins ago",
      value: "+ KSh 5,000",
      positive: true,
      icon: WalletCards,
    },
    {
      title: "New order from Jane W.",
      time: "15 mins ago",
      value: "+ KSh 2,450",
      positive: true,
      icon: ShoppingCart,
    },
    {
      title: "Maize price updated",
      time: "1 hour ago",
      value: "KSh 2,300/90kg",
      icon: Leaf,
    },
    {
      title: "New announcement in your school",
      time: "2 hours ago",
      value: "",
      icon: Bell,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
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
        <h1
          className="
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

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Explore your ecosystem of tools and opportunities.
        </p>
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
          <h2 className="text-lg font-black text-gray-900 dark:text-white">
            Your Hubs
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Access the platforms that power your world.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {hubs.map((hub) => {
            const Icon = hub.icon;

            return (
              <button
                key={hub.key}
                type="button"
                onClick={() => onNavigate?.(hub.key)}
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

                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div>
                    <Icon
                      size={42}
                      strokeWidth={1.8}
                    />

                    <h3 className="mt-5 text-xl font-black">
                      {hub.title}
                    </h3>

                    <p className="mt-2 max-w-sm text-sm leading-6 text-white/85">
                      {hub.description}
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
                    <span className="text-sm font-bold">
                      Open Hub
                    </span>

                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ==================================================
          ECOSYSTEM OVERVIEW
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
        <h2 className="text-lg font-black text-gray-900 dark:text-white">
          Ecosystem Overview
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          A quick look at what&apos;s happening.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {overview.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className={`
                  rounded-2xl
                  p-4
                  ${item.className}
                `}
              >
                <Icon size={21} />

                <p className="mt-3 text-xs font-semibold">
                  {item.title}
                </p>

                <p className="mt-1 text-sm font-black">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>
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
        <h2 className="text-lg font-black text-gray-900 dark:text-white">
          Recent Activity
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Stay updated across all hubs.
        </p>

        <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
          {activities.map((activity) => {
            const Icon = activity.icon;

            return (
              <div
                key={activity.title}
                className="
                  flex
                  items-center
                  gap-3
                  py-4
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
                    bg-gray-100
                    text-gray-600
                    dark:bg-gray-800
                    dark:text-gray-300
                  "
                >
                  <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {activity.title}
                  </p>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {activity.time}
                  </p>
                </div>

                {activity.value && (
                  <span
                    className={`shrink-0 text-xs font-bold ${
                      activity.positive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {activity.value}
                  </span>
                )}
              </div>
            );
          })}
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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
            <History size={18} />
          </div>

          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">
              Continue where you left off
            </h3>

            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {lastActivityText}
            </p>

            {prettyTime && (
              <p className="mt-1 text-xs text-gray-400">
                {prettyTime}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ======================================================
   SIDEBAR NAVIGATION
====================================================== */

export const DASHBOARDS = [
  {
    key: "home",
    title: "Home",
    label: "Home",
    icon: Home,
    default: true,
    element: <HomeDashboard />,
  },

  /* ================= ECOSYSTEM ================= */

  {
    key: "faith",
    title: "Faith",
    label: "Faith",
    icon: BookOpen,
    element: <FaithDashboard />,
  },

  {
    key: "education",
    title: "Education",
    label: "Education",
    icon: GraduationCap,
    element: <EducationDashboard />,
  },

  {
    key: "shamba",
    title: "Shamba",
    label: "Shamba",
    icon: Leaf,
    element: <ShambaDashboard />,
  },

  {
    key: "biashara",
    title: "Biashara",
    label: "Biashara",
    icon: ShoppingCart,
    element: <BiasharaDashboard />,
  },

  {
    key: "community",
    title: "Community",
    label: "Community",
    icon: Users,
    element: <CommunityDashboard />,
  },

  {
    key: "payments",
    title: "Payments",
    label: "Payments",
    icon: WalletCards,
    element: <PaymentsDashboard />,
  },

  {
    key: "profile",
    title: "Profile",
    label: "Profile",
    icon: UserCircle,
    element: <UserAccountDashboard />,
  },

  {
    key: "settings",
    title: "Settings",
    label: "Settings",
    icon: Settings,
    element: <PreferencesDashboard />,
    restricted: true,
  },

  /* ================= EXISTING REVELACODE ================= */

  {
    key: "bible",
    title: "Bible",
    label: "Bible",
    icon: Book,
    element: <BibleDashboard />,
  },

  {
    key: "prophecy",
    title: "Prophecy",
    label: "Prophecy",
    icon: BookOpen,
    element: <ProphecyDashboard />,
  },

  {
    key: "events",
    title: "Events",
    label: "Events",
    icon: Globe,
    element: <ProphecyEventsDashboard />,
  },

  {
    key: "referential",
    title: "Referential",
    label: "Referential",
    icon: Layers,
    element: <ReferentialDashboard />,
  },

  {
    key: "preferences",
    title: "Preferences",
    label: "Preferences",
    icon: Settings,
    element: <PreferencesDashboard />,
    restricted: true,
  },

  {
    key: "accounts",
    title: "Account",
    label: "Account",
    icon: UserCircle,
    element: <UserAccountDashboard />,
    restricted: true,
  },

  {
    key: "ai",
    title: "RevelaAI",
    label: "AI",
    icon: Bot,
    hidden: true,
    element: <AIAssistantDashboard />,
  },
];
