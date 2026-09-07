// src/Dashboard/ShambaHub.jsx

import React, {
  lazy,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  CalendarDays,
  CloudSun,
  Leaf,
  Package,
  ShoppingCart,
  Sprout,
  Tractor,
  TrendingUp,
  Users,
  WalletCards,
  Wheat,
} from "lucide-react";

import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";
import Loading from "@/components/common/Loading.jsx";
import { useAuth } from "@/context/AuthContext.jsx";


// =========================================================
// SAFE LAZY
// =========================================================

function safeLazy(
  importFn,
  name,
) {
  const LazyComponent = lazy(() =>
    importFn().catch((error) => {
      console.error(
        `🚨 SHAMBA LAZY LOAD FAILED → ${name}`,
        error,
      );

      return {
        default: function ShambaLoadError() {
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
                  border-red-100
                  bg-red-50
                  p-5
                  text-center
                "
              >
                <div
                  className="
                    text-sm
                    font-black
                    text-red-700
                  "
                >
                  {name} could not be loaded
                </div>

                <p
                  className="
                    mt-2
                    text-[10px]
                    leading-5
                    text-red-600
                  "
                >
                  Please try opening this section again.
                </p>
              </div>
            </div>
          );
        },
      };
    }),
  );

  return LazyComponent;
}


// =========================================================
// SHAMBA SCREENS
// =========================================================

const ShambaDashboard = safeLazy(
  () =>
    import(
      "@/Dashboard/ShambaDashboard.jsx"
    ),
  "Shamba Dashboard",
);

const ShambaFarmsDashboard = safeLazy(
  () =>
    import(
      "@/Dashboard/ShambaFarmsDashboard.jsx"
    ),
  "My Farms",
);

const ShambaCropsDashboard = safeLazy(
  () =>
    import(
      "@/Dashboard/ShambaCropsDashboard.jsx"
    ),
  "Crops",
);

const ShambaMarketDashboard = safeLazy(
  () =>
    import(
      "@/Dashboard/ShambaMarketDashboard.jsx"
    ),
  "Market",
);

const ShambaInputsDashboard = safeLazy(
  () =>
    import(
      "@/Dashboard/ShambaInputsDashboard.jsx"
    ),
  "Inputs",
);

const ShambaBuyersDashboard = safeLazy(
  () =>
    import(
      "@/Dashboard/ShambaBuyersDashboard.jsx"
    ),
  "Buyers",
);

const ShambaOrdersDashboard = safeLazy(
  () =>
    import(
      "@/Dashboard/ShambaOrdersDashboard.jsx"
    ),
  "Orders",
);

const ShambaWeatherDashboard = safeLazy(
  () =>
    import(
      "@/Dashboard/ShambaWeatherDashboard.jsx"
    ),
  "Weather",
);

const ShambaHarvestsDashboard = safeLazy(
  () =>
    import(
      "@/Dashboard/ShambaHarvestsDashboard.jsx"
    ),
  "Harvests",
);

const ShambaActivitiesDashboard = safeLazy(
  () =>
    import(
      "@/Dashboard/ShambaActivitiesDashboard.jsx"
    ),
  "Activities",
);


// =========================================================
// INTERNAL NAVIGATION
// =========================================================

const SHAMBA_SECTIONS = {
  home: {
    label: "Home",
    icon: Leaf,
    component: ShambaDashboard,
  },

  farms: {
    label: "My Farm",
    icon: Tractor,
    component: ShambaFarmsDashboard,
  },

  crops: {
    label: "Crops",
    icon: Sprout,
    component: ShambaCropsDashboard,
  },

  market: {
    label: "Market",
    icon: TrendingUp,
    component: ShambaMarketDashboard,
  },

  inputs: {
    label: "Inputs",
    icon: Package,
    component: ShambaInputsDashboard,
  },

  buyers: {
    label: "Buyers",
    icon: Users,
    component: ShambaBuyersDashboard,
  },

  orders: {
    label: "Orders",
    icon: WalletCards,
    component: ShambaOrdersDashboard,
  },

  weather: {
    label: "Weather",
    icon: CloudSun,
    component: ShambaWeatherDashboard,
  },

  harvests: {
    label: "Harvests",
    icon: Wheat,
    component: ShambaHarvestsDashboard,
  },

  activities: {
    label: "Activities",
    icon: Activity,
    component: ShambaActivitiesDashboard,
  },
};


// =========================================================
// NORMALIZE NAVIGATION TARGET
// =========================================================

function normalizeSection(
  target,
) {
  if (!target) {
    return "home";
  }

  const value =
    String(target)
      .trim()
      .toLowerCase();

  const aliases = {
    "/": "home",
    home: "home",

    shamba: "home",
    "shamba/home": "home",

    "shamba/farms": "farms",
    farm: "farms",
    farms: "farms",

    "shamba/crops": "crops",
    crop: "crops",
    crops: "crops",

    "shamba/market": "market",
    market: "market",

    "shamba/inputs": "inputs",
    input: "inputs",
    inputs: "inputs",

    "shamba/buyers": "buyers",
    buyer: "buyers",
    buyers: "buyers",

    "shamba/orders": "orders",
    order: "orders",
    orders: "orders",

    "shamba/weather": "weather",
    weather: "weather",

    "shamba/harvests": "harvests",
    harvest: "harvests",
    harvests: "harvests",

    "shamba/activities": "activities",
    activity: "activities",
    activities: "activities",
  };

  return (
    aliases[value] ||
    "home"
  );
}


// =========================================================
// NAVIGATION BUTTON
// =========================================================

function ShambaNavItem({
  item,
  active,
  onClick,
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group
        inline-flex
        shrink-0
        items-center
        gap-2
        rounded-xl
        px-3
        py-2
        text-[10px]
        font-black
        transition-all
        duration-200
        ${
          active
            ? "bg-emerald-600 text-white shadow-sm"
            : "bg-white text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
        }
      `}
    >
      <Icon size={14} />

      <span>
        {item.label}
      </span>
    </button>
  );
}


// =========================================================
// MAIN CONTROLLER
// =========================================================

export default function ShambaHub({
  onNavigate,
  onOpenAI,
}) {
  const { user } = useAuth();

  const [
    activeSection,
    setActiveSection,
  ] = useState("home");


  // =======================================================
  // HANDLE INTERNAL NAVIGATION
  // =======================================================

  const handleShambaNavigate =
    useCallback(
      (target) => {
        const nextSection =
          normalizeSection(
            target,
          );

        setActiveSection(
          nextSection,
        );
      },
      [],
    );


  // =======================================================
  // CURRENT SECTION
  // =======================================================

  const currentSection =
    useMemo(
      () =>
        SHAMBA_SECTIONS[
          activeSection
        ] ||
        SHAMBA_SECTIONS.home,
      [activeSection],
    );


  const ActiveComponent =
    currentSection.component;


  // =======================================================
  // PROPAGATE NAVIGATION
  // =======================================================

  const handleDashboardNavigate =
    useCallback(
      (target) => {
        /*
         * Shamba targets stay inside Shamba.
         *
         * Anything unknown is forwarded to the
         * global RevelaCode dashboard.
         */

        if (!target) {
          return;
        }

        const normalized =
          String(target)
            .trim()
            .toLowerCase();

        const isShambaTarget =
          normalized === "shamba" ||
          normalized.startsWith(
            "shamba/",
          ) ||
          Object.prototype.hasOwnProperty.call(
            SHAMBA_SECTIONS,
            normalized,
          );

        if (isShambaTarget) {
          handleShambaNavigate(
            normalized,
          );

          return;
        }

        /*
         * "Back" or other ecosystem-level
         * destinations can still leave Shamba.
         */

        onNavigate?.(target);
      },
      [
        handleShambaNavigate,
        onNavigate,
      ],
    );


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <JumuiyaDashboardShell
      title="Shamba"
      subtitle="Grow better. Sell smarter. Feed Africa."
      activeHub="shamba"
      user={user}
      onNavigate={onNavigate}
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1200px]
          pb-24
        "
      >

        {/* ==================================================
            SHAMBA INTERNAL NAVIGATION
        ================================================== */}

        <div
          className="
            mb-4
            overflow-x-auto
            pb-1
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          <div
            className="
              flex
              w-max
              min-w-full
              gap-1.5
              rounded-2xl
              border
              border-slate-100
              bg-slate-50
              p-1
            "
          >
            {Object.entries(
              SHAMBA_SECTIONS,
            ).map(
              ([
                key,
                item,
              ]) => (
                <ShambaNavItem
                  key={key}
                  item={item}
                  active={
                    activeSection ===
                    key
                  }
                  onClick={() =>
                    handleShambaNavigate(
                      key,
                    )
                  }
                />
              ),
            )}
          </div>
        </div>


        {/* ==================================================
            ACTIVE SCREEN
        ================================================== */}

        <Suspense
          fallback={
            <div
              className="
                rounded-3xl
                border
                border-slate-100
                bg-white
                p-8
                shadow-sm
              "
            >
              <Loading />
            </div>
          }
        >
          <ActiveComponent
            user={user}
            onNavigate={
              handleDashboardNavigate
            }
            onOpenAI={onOpenAI}
          />
        </Suspense>


        {/* ==================================================
            MOBILE SHAMBA NAV
        ================================================== */}

        <div
          className="
            fixed
            bottom-0
            left-0
            right-0
            z-30
            border-t
            border-slate-200
            bg-white/95
            px-2
            py-2
            shadow-[0_-6px_25px_rgba(15,23,42,0.08)]
            backdrop-blur-md
            lg:hidden
          "
        >
          <div
            className="
              mx-auto
              flex
              max-w-[700px]
              items-center
              justify-between
              gap-1
            "
          >
            {[
              ["home", Leaf],
              ["farms", Tractor],
              ["crops", Sprout],
              ["market", TrendingUp],
              ["activities", Activity],
            ].map(
              ([
                key,
                Icon,
              ]) => {
                const active =
                  activeSection ===
                  key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      handleShambaNavigate(
                        key,
                      )
                    }
                    className={`
                      flex
                      min-w-0
                      flex-1
                      flex-col
                      items-center
                      justify-center
                      gap-1
                      rounded-xl
                      px-2
                      py-1.5
                      ${
                        active
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }
                    `}
                  >
                    <Icon size={16} />

                    <span
                      className="
                        max-w-full
                        truncate
                        text-[8px]
                        font-black
                      "
                    >
                      {
                        SHAMBA_SECTIONS[
                          key
                        ].label
                      }
                    </span>
                  </button>
                );
              },
            )}
          </div>
        </div>

      </div>
    </JumuiyaDashboardShell>
  );
}
