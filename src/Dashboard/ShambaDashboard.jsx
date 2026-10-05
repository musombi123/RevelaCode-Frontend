import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  CloudRain,
  CloudSun,
  Droplets,
  Leaf,
  MapPin,
  Package,
  RefreshCw,
  ShoppingCart,
  Sprout,
  Tractor,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
  Wheat,
  Wind,
  XCircle,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";


// =========================================================
// HELPERS
// =========================================================

function number(value, fallback = 0) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}


function money(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "KSh —";
  }

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}


function getDisplayName(user) {
  return (
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    "Farmer"
  );
}


function getFarmerName(farmer, user) {
  return (
    farmer?.farmer_name ||
    farmer?.full_name ||
    farmer?.fullName ||
    farmer?.name ||
    getDisplayName(user)
  );
}


function getId(item) {
  return item?.id || item?._id || null;
}


function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}


function scoreTone(score) {
  const value = number(score);

  if (value >= 80) {
    return {
      label: "Excellent",
      className: "text-emerald-700 bg-emerald-50",
      bar: "bg-emerald-500",
    };
  }

  if (value >= 60) {
    return {
      label: "Good",
      className: "text-lime-700 bg-lime-50",
      bar: "bg-lime-500",
    };
  }

  if (value >= 40) {
    return {
      label: "Needs attention",
      className: "text-amber-700 bg-amber-50",
      bar: "bg-amber-500",
    };
  }

  return {
    label: "Critical",
    className: "text-red-700 bg-red-50",
    bar: "bg-red-500",
  };
}


function riskTone(level, score) {
  const normalized = String(level || "").toLowerCase();

  if (
    normalized.includes("critical") ||
    normalized.includes("high") ||
    number(score) >= 70
  ) {
    return {
      label: level || "High",
      className: "text-red-700 bg-red-50",
      icon: AlertTriangle,
    };
  }

  if (
    normalized.includes("medium") ||
    normalized.includes("moderate") ||
    number(score) >= 40
  ) {
    return {
      label: level || "Moderate",
      className: "text-amber-700 bg-amber-50",
      icon: AlertTriangle,
    };
  }

  return {
    label: level || "Low",
    className: "text-emerald-700 bg-emerald-50",
    icon: CheckCircle2,
  };
}


function firstValue(...values) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== "",
  );
}


// =========================================================
// QUICK ACCESS
// =========================================================

const QUICK_ACCESS = [
  {
    key: "shamba/farms",
    label: "My Farm",
    icon: Tractor,
  },
  {
    key: "shamba/crops",
    label: "Crops",
    icon: Leaf,
  },
  {
    key: "shamba/market",
    label: "Market",
    icon: TrendingUp,
  },
  {
    key: "shamba/sell",
    label: "Sell",
    icon: ShoppingCart,
  },
  {
    key: "shamba/inputs",
    label: "Inputs",
    icon: Package,
  },
  {
    key: "shamba/buyers",
    label: "Buyers",
    icon: Users,
  },
  {
    key: "shamba/orders",
    label: "Orders",
    icon: WalletCards,
  },
  {
    key: "shamba/weather",
    label: "Weather",
    icon: CloudSun,
  },
];


// =========================================================
// QUICK ACCESS TILE
// =========================================================

function QuickAccessTile({
  item,
  onNavigate,
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onNavigate?.(item.key)}
      className="
        group
        flex
        min-w-0
        flex-col
        items-center
        justify-center
        rounded-2xl
        border
        border-slate-100
        bg-white
        px-2
        py-3
        text-center
        shadow-[0_3px_14px_rgba(15,23,42,0.035)]
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-emerald-100
        hover:shadow-md
        active:scale-[0.97]
      "
    >
      <span
        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          bg-emerald-50
          text-emerald-600
          transition
          group-hover:bg-emerald-100
        "
      >
        <Icon size={18} />
      </span>

      <span
        className="
          mt-2
          truncate
          text-[10px]
          font-extrabold
          text-slate-800
        "
      >
        {item.label}
      </span>
    </button>
  );
}


// =========================================================
// METRIC CARD
// =========================================================

function MetricCard({
  label,
  value,
  icon: Icon,
  onClick,
  suffix,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        min-w-0
        rounded-2xl
        border
        border-slate-100
        bg-white
        px-3
        py-3
        text-left
        shadow-[0_3px_14px_rgba(15,23,42,0.035)]
        transition
        hover:border-emerald-100
        hover:shadow-md
        active:scale-[0.98]
      "
    >
      <div className="flex items-center justify-between gap-2">
        <div
          className="
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-xl
            bg-emerald-50
            text-emerald-600
          "
        >
          <Icon size={15} />
        </div>

        <ArrowRight
          size={12}
          className="text-slate-300"
        />
      </div>

      <div className="mt-2 text-lg font-black text-slate-900">
        {value}
        {suffix && (
          <span className="ml-1 text-[9px] font-bold text-slate-400">
            {suffix}
          </span>
        )}
      </div>

      <div className="mt-0.5 truncate text-[9px] font-semibold text-slate-400">
        {label}
      </div>
    </button>
  );
}


// =========================================================
// SCORE CARD
// =========================================================

function ScoreCard({
  label,
  score,
  icon: Icon,
}) {
  const tone = scoreTone(score);
  const safeScore = Math.max(
    0,
    Math.min(100, number(score)),
  );

  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-100
        bg-white
        p-3
        shadow-[0_3px_14px_rgba(15,23,42,0.035)]
      "
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-xl
              bg-emerald-50
              text-emerald-600
            "
          >
            <Icon size={15} />
          </div>

          <span className="text-[10px] font-black text-slate-700">
            {label}
          </span>
        </div>

        <span
          className={`
            rounded-full
            px-2
            py-1
            text-[8px]
            font-black
            ${tone.className}
          `}
        >
          {tone.label}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <span className="text-2xl font-black text-slate-900">
          {Math.round(safeScore)}
        </span>

        <span className="pb-1 text-[9px] font-bold text-slate-400">
          /100
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`
            h-full
            rounded-full
            transition-all
            ${tone.bar}
          `}
          style={{
            width: `${safeScore}%`,
          }}
        />
      </div>
    </div>
  );
}


// =========================================================
// MAIN DASHBOARD
// =========================================================

export default function ShambaDashboard({
  onNavigate,
  onOpenAI,
}) {
  const { user } = useAuth();

  const {
    getShambaDashboard,
    getFarms,
    getFarmActivities,

    // New Shamba intelligence methods.
    // The API hook will expose these as we wire the service layer.
    getFarmCommandCenter,
    getFarmInsights,
    getFarmAlerts,
    getFarmRecommendations,
    getFarmWeather,
    getFarmMarket,
  } = useJumuiyaApi();

  const [dashboard, setDashboard] = useState(null);
  const [farms, setFarms] = useState([]);
  const [activities, setActivities] = useState([]);

  const [commandCenter, setCommandCenter] =
    useState(null);

  const [insights, setInsights] =
    useState(null);

  const [alerts, setAlerts] =
    useState([]);

  const [recommendations, setRecommendations] =
    useState([]);

  const [weather, setWeather] =
    useState(null);

  const [market, setMarket] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [intelligenceLoading, setIntelligenceLoading] =
    useState(false);

  const [activityLoading, setActivityLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);


  // =======================================================
  // LOAD CORE DATA
  // =======================================================

  const loadCoreData = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const [
          dashboardResult,
          farmsResult,
        ] = await Promise.all([
          getShambaDashboard(),
          getFarms(),
        ]);

        setDashboard(
          dashboardResult || null,
        );

        setFarms(
          Array.isArray(farmsResult)
            ? farmsResult
            : farmsResult?.farms || [],
        );
      } catch (err) {
        setError(
          err?.message ||
            "Unable to load your Shamba dashboard.",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      getShambaDashboard,
      getFarms,
    ],
  );


  useEffect(() => {
    let mounted = true;

    loadCoreData().catch(() => {});

    return () => {
      mounted = false;
    };
  }, [loadCoreData]);


  // =======================================================
  // PRIMARY FARM
  // =======================================================

  const activeFarms = useMemo(
    () =>
      farms.filter(
        (farm) =>
          farm?.status !== "deleted",
      ),
    [farms],
  );

  const firstFarm =
    activeFarms[0] || null;

  const farmId =
    getId(firstFarm);


  // =======================================================
  // LOAD FARM INTELLIGENCE
  // =======================================================

  const loadIntelligence =
    useCallback(async () => {
      if (!farmId) {
        setCommandCenter(null);
        setInsights(null);
        setAlerts([]);
        setRecommendations([]);
        setWeather(null);
        setMarket([]);
        return;
      }

      setIntelligenceLoading(true);

      const results =
        await Promise.allSettled([
          typeof getFarmCommandCenter === "function"
            ? getFarmCommandCenter(farmId)
            : Promise.resolve(null),

          typeof getFarmInsights === "function"
            ? getFarmInsights(farmId)
            : Promise.resolve(null),

          typeof getFarmAlerts === "function"
            ? getFarmAlerts(farmId)
            : Promise.resolve(null),

          typeof getFarmRecommendations === "function"
            ? getFarmRecommendations(farmId)
            : Promise.resolve(null),

          typeof getFarmWeather === "function"
            ? getFarmWeather(farmId)
            : Promise.resolve(null),

          typeof getFarmMarket === "function"
            ? getFarmMarket(farmId)
            : Promise.resolve(null),
        ]);

      const [
        commandResult,
        insightResult,
        alertsResult,
        recommendationsResult,
        weatherResult,
        marketResult,
      ] = results;

      if (
        commandResult.status === "fulfilled"
      ) {
        setCommandCenter(
          commandResult.value || null,
        );
      }

      if (
        insightResult.status === "fulfilled"
      ) {
        setInsights(
          insightResult.value || null,
        );
      }

      if (
        alertsResult.status === "fulfilled"
      ) {
        const value =
          alertsResult.value;

        setAlerts(
          Array.isArray(value)
            ? value
            : value?.alerts || [],
        );
      }

      if (
        recommendationsResult.status ===
        "fulfilled"
      ) {
        const value =
          recommendationsResult.value;

        setRecommendations(
          Array.isArray(value)
            ? value
            : value?.recommendations || [],
        );
      }

      if (
        weatherResult.status === "fulfilled"
      ) {
        setWeather(
          weatherResult.value || null,
        );
      }

      if (
        marketResult.status === "fulfilled"
      ) {
        const value =
          marketResult.value;

        setMarket(
          Array.isArray(value)
            ? value
            : value?.market || value?.items || [],
        );
      }

      setIntelligenceLoading(false);
    }, [
      farmId,
      getFarmCommandCenter,
      getFarmInsights,
      getFarmAlerts,
      getFarmRecommendations,
      getFarmWeather,
      getFarmMarket,
    ]);


  useEffect(() => {
    loadIntelligence().catch(() => {
      setIntelligenceLoading(false);
    });
  }, [loadIntelligence]);


  // =======================================================
  // LOAD RECENT ACTIVITIES
  // =======================================================

  useEffect(() => {
    let mounted = true;

    async function loadActivities() {
      try {
        setActivityLoading(true);

        if (!activeFarms.length) {
          if (mounted) {
            setActivities([]);
          }

          return;
        }

        const results =
          await Promise.all(
            activeFarms
              .slice(0, 5)
              .map(async (farm) => {
                const id = getId(farm);

                if (!id) {
                  return [];
                }

                try {
                  const result =
                    await getFarmActivities(id);

                  return Array.isArray(result)
                    ? result
                    : result?.activities || [];
                } catch {
                  return [];
                }
              }),
          );

        if (!mounted) {
          return;
        }

        const merged =
          results.flat();

        merged.sort((a, b) => {
          const first =
            new Date(
              firstValue(
                a?.activity_date,
                a?.created_at,
                a?.updated_at,
                a?.date,
              ) || 0,
            ).getTime();

          const second =
            new Date(
              firstValue(
                b?.activity_date,
                b?.created_at,
                b?.updated_at,
                b?.date,
              ) || 0,
            ).getTime();

          return second - first;
        });

        setActivities(
          merged.slice(0, 5),
        );
      } finally {
        if (mounted) {
          setActivityLoading(false);
        }
      }
    }

    if (!loading) {
      loadActivities();
    }

    return () => {
      mounted = false;
    };
  }, [
    activeFarms,
    loading,
    getFarmActivities,
  ]);


  // =======================================================
  // REFRESH
  // =======================================================

  const handleRefresh =
    useCallback(async () => {
      setRefreshing(true);

      try {
        await loadCoreData();
        await loadIntelligence();
      } finally {
        setRefreshing(false);
      }
    }, [
      loadCoreData,
      loadIntelligence,
    ]);


  // =======================================================
  // DERIVED INTELLIGENCE
  // =======================================================

  const metrics =
    dashboard?.metrics ||
    dashboard?.summary?.metrics ||
    {};

  const farmer =
    dashboard?.farmer ||
    commandCenter?.farmer ||
    null;

  const commandFarm =
    commandCenter?.farm ||
    firstFarm ||
    null;

  const insight =
    commandCenter?.insight ||
    insights?.insight ||
    insights ||
    null;

  const summary =
    commandCenter?.summary ||
    dashboard?.summary ||
    {};

  const healthScore =
    firstValue(
      insight?.health_score,
      commandCenter?.health_score,
      commandFarm?.health_score,
      summary?.health_score,
      0,
    );

  const productivityScore =
    firstValue(
      insight?.productivity_score,
      commandCenter?.productivity_score,
      commandFarm?.productivity_score,
      summary?.productivity_score,
      0,
    );

  const riskScore =
    firstValue(
      insight?.risk_score,
      commandCenter?.risk_score,
      0,
    );

  const risk =
    riskTone(
      firstValue(
        commandFarm?.risk_level,
        insight?.risk_level,
      ),
      riskScore,
    );

  const RiskIcon =
    risk.icon;

  const locationLabel =
    [
      commandFarm?.town,
      commandFarm?.county,
    ]
      .filter(Boolean)
      .join(", ") ||
    farmer?.town ||
    farmer?.county ||
    commandFarm?.location ||
    farmer?.location ||
    "Farm location not set";

  const crops =
    commandCenter?.crops ||
    summary?.crops ||
    [];

  const activeCrops =
    Array.isArray(crops)
      ? crops.filter(
          (crop) =>
            crop?.status !== "deleted" &&
            crop?.status !== "harvested",
        )
      : [];

  const recommendationItems =
    Array.isArray(
      insight?.recommendations,
    )
      ? insight.recommendations
      : recommendations;

  const riskItems =
    Array.isArray(insight?.risks)
      ? insight.risks
      : [];

  const weatherData =
    weather?.weather ||
    weather?.snapshot ||
    weather ||
    commandCenter?.weather ||
    null;

  const marketItems =
    market.length > 0
      ? market
      : commandCenter?.market || [];

  const primaryRecommendation =
    recommendationItems[0] ||
    null;

  const firstMarket =
    marketItems[0] ||
    null;

  const unreadAlerts =
    alerts.filter(
      (alert) =>
        !alert?.read &&
        !alert?.is_read,
    );

  const waterScore =
    firstValue(
      insight?.water_score,
      commandCenter?.water_score,
      commandFarm?.water_score,
      0,
    );

  const soilScore =
    firstValue(
      insight?.soil_score,
      commandCenter?.soil_score,
      commandFarm?.soil_score,
      0,
    );


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <JumuiyaDashboardShell
      title="Shamba"
      subtitle="Your farm operating system."
      activeHub="shamba"
      user={user}
      onNavigate={onNavigate}
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1180px]
          pb-24
        "
      >

        {/* ==================================================
            COMMAND HEADER
        ================================================== */}

        <section
          className="
            mb-4
            overflow-hidden
            rounded-3xl
            border
            border-emerald-100
            bg-gradient-to-br
            from-emerald-700
            via-emerald-600
            to-lime-600
            p-4
            text-white
            shadow-lg
            sm:p-5
          "
        >
          <div className="flex items-start justify-between gap-3">

            <div className="min-w-0">

              <div className="flex items-center gap-2">

                <div
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    bg-white/15
                    backdrop-blur
                  "
                >
                  <Sprout size={20} />
                </div>

                <div className="min-w-0">

                  <div
                    className="
                      text-[8px]
                      font-black
                      uppercase
                      tracking-[0.18em]
                      text-white/65
                    "
                  >
                    Shamba Command Center
                  </div>

                  <h1
                    className="
                      mt-0.5
                      truncate
                      text-lg
                      font-black
                      tracking-tight
                    "
                  >
                    Hello, {getFarmerName(farmer, user)}
                  </h1>

                </div>

              </div>

              <div
                className="
                  mt-3
                  flex
                  items-center
                  gap-1.5
                  text-[9px]
                  font-semibold
                  text-white/75
                "
              >
                <MapPin size={11} />

                <span className="truncate">
                  {locationLabel}
                </span>
              </div>

            </div>


            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-white/10
                text-white
                backdrop-blur
                transition
                hover:bg-white/20
                disabled:opacity-50
              "
              aria-label="Refresh farm intelligence"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
            </button>

          </div>


          <div
            className="
              mt-4
              grid
              grid-cols-2
              gap-2
              sm:grid-cols-4
            "
          >

            <div
              className="
                rounded-2xl
                bg-white/10
                p-3
                backdrop-blur
              "
            >
              <div className="text-[8px] font-bold text-white/60">
                Farm health
              </div>

              <div className="mt-1 text-xl font-black">
                {Math.round(number(healthScore))}
                <span className="text-[9px] text-white/60">
                  /100
                </span>
              </div>
            </div>


            <div
              className="
                rounded-2xl
                bg-white/10
                p-3
                backdrop-blur
              "
            >
              <div className="text-[8px] font-bold text-white/60">
                Active crops
              </div>

              <div className="mt-1 text-xl font-black">
                {activeCrops.length ||
                  number(metrics?.active_crops)}
              </div>
            </div>


            <div
              className="
                rounded-2xl
                bg-white/10
                p-3
                backdrop-blur
              "
            >
              <div className="text-[8px] font-bold text-white/60">
                Productivity
              </div>

              <div className="mt-1 text-xl font-black">
                {Math.round(
                  number(
                    productivityScore,
                  ),
                )}
                <span className="text-[9px] text-white/60">
                  %
                </span>
              </div>
            </div>


            <div
              className="
                rounded-2xl
                bg-white/10
                p-3
                backdrop-blur
              "
            >
              <div className="text-[8px] font-bold text-white/60">
                Alerts
              </div>

              <div className="mt-1 text-xl font-black">
                {unreadAlerts.length}
              </div>
            </div>

          </div>
        </section>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div
            className="
              mb-4
              flex
              items-start
              gap-3
              rounded-2xl
              border
              border-red-100
              bg-red-50
              px-4
              py-3
              text-[10px]
              font-medium
              text-red-700
            "
          >
            <AlertTriangle
              size={15}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>
          </div>
        )}


        {/* ==================================================
            NO FARM STATE
        ================================================== */}

        {!loading && !firstFarm && (
          <section
            className="
              mb-5
              rounded-3xl
              border
              border-dashed
              border-emerald-200
              bg-emerald-50
              p-6
              text-center
            "
          >
            <div
              className="
                mx-auto
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-white
                text-emerald-600
                shadow-sm
              "
            >
              <Tractor size={22} />
            </div>

            <h2 className="mt-3 text-sm font-black text-slate-900">
              Set up your farm
            </h2>

            <p className="mx-auto mt-1 max-w-sm text-[10px] leading-5 text-slate-500">
              Add your farm location, crops,
              water source and production details
              to unlock Shamba intelligence.
            </p>

            <button
              type="button"
              onClick={() =>
                onNavigate?.("shamba/farms")
              }
              className="
                mt-4
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-emerald-600
                px-4
                py-2.5
                text-[10px]
                font-black
                text-white
                shadow-sm
                transition
                hover:bg-emerald-700
              "
            >
              Set up farm
              <ArrowRight size={13} />
            </button>
          </section>
        )}


        {/* ==================================================
            FARM HEALTH
        ================================================== */}

        {firstFarm && (
          <section className="mb-5">

            <div className="mb-3 flex items-end justify-between">

              <div>
                <h2 className="text-sm font-black text-slate-900">
                  Farm Health
                </h2>

                <p className="mt-0.5 text-[9px] text-slate-400">
                  The current condition of your farm.
                </p>
              </div>

              <span
                className={`
                  rounded-full
                  px-2.5
                  py-1
                  text-[8px]
                  font-black
                  ${risk.className}
                `}
              >
                {risk.label} risk
              </span>

            </div>


            <div
              className="
                grid
                grid-cols-2
                gap-2
                sm:grid-cols-4
              "
            >

              <ScoreCard
                label="Overall"
                score={healthScore}
                icon={Sprout}
              />

              <ScoreCard
                label="Soil"
                score={soilScore}
                icon={Leaf}
              />

              <ScoreCard
                label="Water"
                score={waterScore}
                icon={Droplets}
              />

              <ScoreCard
                label="Productivity"
                score={productivityScore}
                icon={TrendingUp}
              />

            </div>

          </section>
        )}


        {/* ==================================================
            WEATHER + WATER
        ================================================== */}

        {firstFarm && (
          <section className="mb-5">

            <div
              className="
                grid
                gap-3
                md:grid-cols-2
              "
            >

              <div
                className="
                  overflow-hidden
                  rounded-3xl
                  bg-gradient-to-br
                  from-sky-500
                  to-blue-600
                  p-4
                  text-white
                  shadow-lg
                "
              >

                <div className="flex items-start justify-between">

                  <div>
                    <div className="text-[8px] font-black uppercase tracking-[0.16em] text-white/65">
                      Farm weather
                    </div>

                    <div className="mt-1 text-lg font-black">
                      {firstValue(
                        weatherData?.condition,
                        weatherData?.description,
                        "Weather data unavailable",
                      )}
                    </div>
                  </div>

                  <CloudSun size={22} />
                </div>

                <div className="mt-4 flex items-end gap-2">
                  <span className="text-3xl font-black">
                    {weatherData?.temperature !== undefined
                      ? `${Math.round(
                          number(
                            weatherData.temperature,
                          ),
                        )}°`
                      : "—"}
                  </span>

                  <span className="pb-1 text-[9px] font-semibold text-white/70">
                    local farm conditions
                  </span>
                </div>

                <div
                  className="
                    mt-4
                    grid
                    grid-cols-3
                    gap-2
                  "
                >

                  <div className="rounded-xl bg-white/10 p-2">
                    <CloudRain size={13} />
                    <div className="mt-1 text-[9px] font-black">
                      {weatherData?.rainfall_probability !== undefined
                        ? `${Math.round(
                            number(
                              weatherData.rainfall_probability,
                            ),
                          )}%`
                        : "—"}
                    </div>
                    <div className="text-[7px] text-white/60">
                      Rain chance
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/10 p-2">
                    <Droplets size={13} />
                    <div className="mt-1 text-[9px] font-black">
                      {weatherData?.humidity !== undefined
                        ? `${Math.round(
                            number(
                              weatherData.humidity,
                            ),
                          )}%`
                        : "—"}
                    </div>
                    <div className="text-[7px] text-white/60">
                      Humidity
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/10 p-2">
                    <Wind size={13} />
                    <div className="mt-1 text-[9px] font-black">
                      {weatherData?.wind_speed !== undefined
                        ? `${number(
                            weatherData.wind_speed,
                          ).toFixed(1)}`
                        : "—"}
                    </div>
                    <div className="text-[7px] text-white/60">
                      Wind
                    </div>
                  </div>

                </div>

              </div>


              <div
                className="
                  rounded-3xl
                  border
                  border-slate-100
                  bg-white
                  p-4
                  shadow-[0_4px_18px_rgba(15,23,42,0.035)]
                "
              >

                <div className="flex items-start justify-between">

                  <div>
                    <div className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
                      Water readiness
                    </div>

                    <h3 className="mt-1 text-sm font-black text-slate-900">
                      {commandFarm?.water_source ||
                        "Water source not recorded"}
                    </h3>
                  </div>

                  <div
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-2xl
                      bg-blue-50
                      text-blue-600
                    "
                  >
                    <Droplets size={19} />
                  </div>

                </div>

                <div className="mt-5">

                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-black text-slate-900">
                      {Math.round(number(waterScore))}
                    </span>

                    <span className="text-[9px] font-bold text-slate-400">
                      /100
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            number(waterScore),
                          ),
                        )}%`,
                      }}
                    />
                  </div>

                </div>

                <div className="mt-4 flex items-center gap-2 text-[9px] text-slate-500">
                  {number(waterScore) >= 60 ? (
                    <CheckCircle2
                      size={13}
                      className="text-emerald-500"
                    />
                  ) : (
                    <AlertTriangle
                      size={13}
                      className="text-amber-500"
                    />
                  )}

                  <span>
                    {number(waterScore) >= 60
                      ? "Water readiness looks healthy."
                      : "Water availability needs attention."}
                  </span>
                </div>

              </div>

            </div>

          </section>
        )}


        {/* ==================================================
            QUICK ACCESS
        ================================================== */}

        <section className="mb-5">

          <div className="mb-3">
            <h2 className="text-sm font-black text-slate-900">
              Quick Access
            </h2>

            <p className="mt-0.5 text-[9px] text-slate-400">
              Manage your farm from one place.
            </p>
          </div>

          <div
            className="
              grid
              grid-cols-4
              gap-2
              sm:gap-3
            "
          >
            {QUICK_ACCESS.map((item) => (
              <QuickAccessTile
                key={item.key}
                item={item}
                onNavigate={onNavigate}
              />
            ))}
          </div>

        </section>


        {/* ==================================================
            CROP OVERVIEW
        ================================================== */}

        <section className="mb-5">

          <div className="mb-3 flex items-end justify-between">

            <div>
              <h2 className="text-sm font-black text-slate-900">
                Crops
              </h2>

              <p className="mt-0.5 text-[9px] text-slate-400">
                Current production on your farm.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate?.("shamba/crops")
              }
              className="
                inline-flex
                items-center
                gap-1
                text-[9px]
                font-black
                text-emerald-600
              "
            >
              View crops
              <ArrowRight size={11} />
            </button>

          </div>


          <div
            className="
              overflow-hidden
              rounded-2xl
              border
              border-slate-100
              bg-white
              shadow-[0_4px_18px_rgba(15,23,42,0.035)]
            "
          >

            {intelligenceLoading && !activeCrops.length ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="
                      h-12
                      animate-pulse
                      rounded-xl
                      bg-slate-100
                    "
                  />
                ))}
              </div>
            ) : activeCrops.length > 0 ? (
              <div className="divide-y divide-slate-50">

                {activeCrops
                  .slice(0, 5)
                  .map((crop, index) => {
                    const health =
                      firstValue(
                        crop?.health_status,
                        "Growing",
                      );

                    const pestRisk =
                      number(
                        crop?.pest_risk,
                      );

                    const diseaseRisk =
                      number(
                        crop?.disease_risk,
                      );

                    const cropRisk =
                      Math.max(
                        pestRisk,
                        diseaseRisk,
                      );

                    const cropRiskTone =
                      riskTone(
                        cropRisk >= 70
                          ? "High"
                          : cropRisk >= 40
                            ? "Moderate"
                            : "Low",
                        cropRisk,
                      );

                    return (
                      <button
                        type="button"
                        key={
                          getId(crop) ||
                          index
                        }
                        onClick={() =>
                          onNavigate?.(
                            "shamba/crops",
                          )
                        }
                        className="
                          flex
                          w-full
                          items-center
                          gap-3
                          px-4
                          py-3
                          text-left
                          transition
                          hover:bg-slate-50
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
                            bg-emerald-50
                            text-emerald-600
                          "
                        >
                          <Leaf size={16} />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="truncate text-[10px] font-black text-slate-800">
                            {crop?.name ||
                              "Crop"}
                          </div>

                          <div className="mt-0.5 truncate text-[8px] text-slate-400">
                            {crop?.variety ||
                              crop?.category ||
                              health}
                          </div>

                        </div>

                        <div className="shrink-0 text-right">

                          <div
                            className={`
                              rounded-full
                              px-2
                              py-1
                              text-[8px]
                              font-black
                              ${cropRiskTone.className}
                            `}
                          >
                            {cropRiskTone.label}
                          </div>

                          {crop?.area !== undefined && (
                            <div className="mt-1 text-[8px] text-slate-400">
                              {crop.area}{" "}
                              {crop.area_unit ||
                                "acres"}
                            </div>
                          )}

                        </div>

                      </button>
                    );
                  })}

              </div>
            ) : (
              <div className="p-6 text-center">
                <Leaf
                  size={20}
                  className="mx-auto text-slate-300"
                />

                <div className="mt-2 text-[10px] font-black text-slate-700">
                  No crops recorded
                </div>

                <p className="mx-auto mt-1 max-w-xs text-[9px] leading-5 text-slate-400">
                  Add your crops to start receiving
                  crop-level intelligence.
                </p>
              </div>
            )}

          </div>

        </section>


        {/* ==================================================
            INTELLIGENCE
        ================================================== */}

        <section className="mb-5">

          <div className="mb-3">
            <h2 className="text-sm font-black text-slate-900">
              Farm Intelligence
            </h2>

            <p className="mt-0.5 text-[9px] text-slate-400">
              What Shamba recommends you do next.
            </p>
          </div>


          <div className="grid gap-3 md:grid-cols-2">

            {/* RECOMMENDATION */}

            <div
              className="
                rounded-3xl
                border
                border-emerald-100
                bg-emerald-50
                p-4
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
                    rounded-2xl
                    bg-white
                    text-emerald-600
                    shadow-sm
                  "
                >
                  <Sprout size={19} />
                </div>

                <div className="min-w-0 flex-1">

                  <div className="text-[8px] font-black uppercase tracking-[0.16em] text-emerald-600">
                    Recommended next
                  </div>

                  <h3 className="mt-1 text-sm font-black text-slate-900">
                    {primaryRecommendation?.title ||
                      "Keep your farm data updated"}
                  </h3>

                  <p className="mt-1 text-[9px] leading-5 text-slate-600">
                    {primaryRecommendation?.recommendation ||
                      insight?.summary ||
                      "Update your crops, activities and farm conditions so Shamba can produce better recommendations."}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  onOpenAI
                    ? onOpenAI()
                    : onNavigate?.("assistant")
                }
                className="
                  mt-4
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-xl
                  bg-emerald-600
                  px-3
                  py-2
                  text-[9px]
                  font-black
                  text-white
                  shadow-sm
                  transition
                  hover:bg-emerald-700
                "
              >
                Ask RevelaAI
                <ArrowRight size={12} />
              </button>

            </div>


            {/* RISKS */}

            <div
              className="
                rounded-3xl
                border
                border-slate-100
                bg-white
                p-4
                shadow-[0_4px_18px_rgba(15,23,42,0.035)]
              "
            >

              <div className="flex items-start justify-between">

                <div>
                  <div className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Farm risks
                  </div>

                  <h3 className="mt-1 text-sm font-black text-slate-900">
                    {riskItems.length
                      ? `${riskItems.length} areas need attention`
                      : "No major risks detected"}
                  </h3>
                </div>

                <div
                  className={`
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-xl
                    ${risk.className}
                  `}
                >
                  <RiskIcon size={17} />
                </div>

              </div>


              <div className="mt-4 space-y-2">

                {riskItems.length > 0 ? (
                  riskItems
                    .slice(0, 3)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="
                          flex
                          items-start
                          gap-2
                          rounded-xl
                          bg-slate-50
                          px-3
                          py-2.5
                        "
                      >
                        <AlertTriangle
                          size={13}
                          className="mt-0.5 shrink-0 text-amber-500"
                        />

                        <span className="text-[9px] leading-4 text-slate-600">
                          {typeof item === "string"
                            ? item
                            : item?.message ||
                              item?.title ||
                              "Farm risk requires attention."}
                        </span>
                      </div>
                    ))
                ) : (
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-xl
                      bg-emerald-50
                      px-3
                      py-3
                    "
                  >
                    <CheckCircle2
                      size={14}
                      className="text-emerald-600"
                    />

                    <span className="text-[9px] font-semibold text-emerald-700">
                      Your current farm profile has no
                      major recorded risks.
                    </span>
                  </div>
                )}

              </div>

            </div>

          </div>

        </section>


        {/* ==================================================
            MARKET OPPORTUNITY
        ================================================== */}

        <section className="mb-5">

          <div className="mb-3 flex items-end justify-between">

            <div>
              <h2 className="text-sm font-black text-slate-900">
                Market Opportunity
              </h2>

              <p className="mt-0.5 text-[9px] text-slate-400">
                Current crop prices and demand signals.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate?.("shamba/market")
              }
              className="
                inline-flex
                items-center
                gap-1
                text-[9px]
                font-black
                text-emerald-600
              "
            >
              Open market
              <ArrowRight size={11} />
            </button>

          </div>


          <div
            className="
              overflow-hidden
              rounded-3xl
              bg-gradient-to-br
              from-orange-400
              via-orange-500
              to-amber-500
              p-4
              text-white
              shadow-lg
            "
          >

            <div className="flex items-start justify-between gap-3">

              <div className="min-w-0">

                <div className="text-[8px] font-black uppercase tracking-[0.18em] text-white/65">
                  Market today
                </div>

                <h3 className="mt-1 text-lg font-black">
                  {firstMarket?.crop_name ||
                    firstMarket?.name ||
                    "Market intelligence"}
                </h3>

                <p className="mt-1 text-[9px] leading-5 text-white/75">
                  {firstMarket?.market ||
                    firstMarket?.target_market ||
                    "Track local demand and prices for your produce."}
                </p>

              </div>

              <TrendingUp size={21} />

            </div>


            <div className="mt-4 grid grid-cols-3 gap-2">

              <div className="rounded-2xl bg-white/10 p-3">
                <div className="text-[8px] text-white/60">
                  Price
                </div>

                <div className="mt-1 text-sm font-black">
                  {firstMarket?.price !== undefined
                    ? money(firstMarket.price)
                    : "—"}
                </div>

                {firstMarket?.unit && (
                  <div className="text-[7px] text-white/60">
                    /{firstMarket.unit}
                  </div>
                )}
              </div>


              <div className="rounded-2xl bg-white/10 p-3">
                <div className="text-[8px] text-white/60">
                  Trend
                </div>

                <div className="mt-1 flex items-center gap-1 text-sm font-black">
                  {String(
                    firstMarket?.trend || "",
                  ).toLowerCase() === "down" ? (
                    <TrendingDown size={14} />
                  ) : (
                    <TrendingUp size={14} />
                  )}

                  {firstMarket?.trend ||
                    "Stable"}
                </div>
              </div>


              <div className="rounded-2xl bg-white/10 p-3">
                <div className="text-[8px] text-white/60">
                  Demand
                </div>

                <div className="mt-1 text-sm font-black">
                  {firstMarket?.demand_score !== undefined
                    ? `${Math.round(
                        number(
                          firstMarket.demand_score,
                        ),
                      )}%`
                    : "—"}
                </div>
              </div>

            </div>

          </div>

        </section>


        {/* ==================================================
            ALERTS
        ================================================== */}

        {unreadAlerts.length > 0 && (
          <section className="mb-5">

            <div className="mb-3">
              <h2 className="text-sm font-black text-slate-900">
                Farm Alerts
              </h2>

              <p className="mt-0.5 text-[9px] text-slate-400">
                Things that may require action.
              </p>
            </div>


            <div className="space-y-2">

              {unreadAlerts
                .slice(0, 4)
                .map((alert, index) => (
                  <button
                    type="button"
                    key={
                      getId(alert) ||
                      index
                    }
                    onClick={() =>
                      onNavigate?.(
                        "shamba/alerts",
                      )
                    }
                    className="
                      flex
                      w-full
                      items-start
                      gap-3
                      rounded-2xl
                      border
                      border-amber-100
                      bg-amber-50
                      p-3
                      text-left
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
                        text-amber-600
                      "
                    >
                      <AlertTriangle size={16} />
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="truncate text-[10px] font-black text-slate-800">
                        {alert?.title ||
                          "Farm alert"}
                      </div>

                      <div className="mt-0.5 text-[9px] leading-4 text-slate-500">
                        {alert?.message ||
                          "This farm alert requires your attention."}
                      </div>

                    </div>

                    <ArrowRight
                      size={13}
                      className="mt-1 shrink-0 text-slate-300"
                    />

                  </button>
                ))}

            </div>

          </section>
        )}


        {/* ==================================================
            RECENT ACTIVITY
        ================================================== */}

        <section className="mb-5">

          <div className="mb-3 flex items-end justify-between">

            <div>
              <h2 className="text-sm font-black text-slate-900">
                Recent Activity
              </h2>

              <p className="mt-0.5 text-[9px] text-slate-400">
                What is happening on your farm.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate?.(
                  "shamba/activities",
                )
              }
              className="
                inline-flex
                items-center
                gap-1
                text-[9px]
                font-black
                text-emerald-600
              "
            >
              View all
              <ArrowRight size={11} />
            </button>

          </div>


          <div
            className="
              overflow-hidden
              rounded-2xl
              border
              border-slate-100
              bg-white
              shadow-[0_4px_18px_rgba(15,23,42,0.035)]
            "
          >

            {activityLoading ? (
              <div className="divide-y divide-slate-50">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="h-8 w-8 animate-pulse rounded-xl bg-slate-100" />

                    <div className="min-w-0 flex-1">
                      <div className="h-2.5 w-28 animate-pulse rounded bg-slate-100" />
                      <div className="mt-2 h-2 w-40 animate-pulse rounded bg-slate-50" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length > 0 ? (
              <div className="divide-y divide-slate-50">

                {activities.map(
                  (activity, index) => (
                    <div
                      key={
                        getId(activity) ||
                        index
                      }
                      className="
                        flex
                        items-center
                        gap-3
                        px-4
                        py-3
                      "
                    >

                      <div
                        className="
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-emerald-50
                          text-emerald-600
                        "
                      >
                        <Activity size={15} />
                      </div>


                      <div className="min-w-0 flex-1">

                        <div className="truncate text-[10px] font-black text-slate-800">
                          {activity?.type ||
                            activity?.activity_type ||
                            "Farm activity"}
                        </div>

                        <div className="mt-0.5 truncate text-[9px] text-slate-400">
                          {activity?.description ||
                            activity?.notes ||
                            formatDate(
                              activity?.activity_date,
                            )}
                        </div>

                      </div>


                      {activity?.cost !== undefined && (
                        <div className="shrink-0 text-[9px] font-bold text-slate-500">
                          {money(activity.cost)}
                        </div>
                      )}

                    </div>
                  ),
                )}

              </div>
            ) : (
              <div className="px-4 py-8 text-center">

                <Activity
                  size={18}
                  className="mx-auto text-slate-300"
                />

                <div className="mt-2 text-[10px] font-black text-slate-700">
                  No recent activity
                </div>

                <p className="mx-auto mt-1 max-w-xs text-[9px] leading-5 text-slate-400">
                  Activities will appear here as you
                  work on your farm.
                </p>

              </div>
            )}

          </div>

        </section>


        {/* ==================================================
            REVELAAI
        ================================================== */}

        <section className="mb-4">

          <div
            className="
              overflow-hidden
              rounded-3xl
              bg-slate-950
              p-4
              text-white
              shadow-lg
            "
          >

            <div className="flex items-start gap-3">

              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-emerald-500
                  text-white
                "
              >
                <Bot size={21} />
              </div>

              <div className="min-w-0 flex-1">

                <div className="text-[8px] font-black uppercase tracking-[0.18em] text-emerald-400">
                  RevelaAI for Shamba
                </div>

                <h2 className="mt-1 text-sm font-black">
                  Your farm intelligence assistant
                </h2>

                <p className="mt-1 text-[9px] leading-5 text-white/60">
                  Ask about crops, weather, pests,
                  planting, production, markets or
                  what you should do next.
                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={() =>
                onOpenAI
                  ? onOpenAI()
                  : onNavigate?.("assistant")
              }
              className="
                mt-4
                flex
                w-full
                items-center
                justify-between
                rounded-2xl
                bg-white/10
                px-4
                py-3
                text-left
                transition
                hover:bg-white/15
              "
            >

              <span className="text-[10px] font-black">
                Ask RevelaAI about my farm
              </span>

              <ArrowRight size={15} />

            </button>

          </div>

        </section>


        {/* ==================================================
            FLOATING AI BUTTON
        ================================================== */}

        <button
          type="button"
          onClick={() =>
            onOpenAI
              ? onOpenAI()
              : onNavigate?.("assistant")
          }
          aria-label="Open Shamba assistant"
          className="
            fixed
            bottom-5
            right-5
            z-40
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-full
            bg-emerald-600
            text-white
            shadow-[0_10px_30px_rgba(5,150,105,0.28)]
            transition-all
            duration-200
            hover:scale-105
            hover:bg-emerald-700
            hover:shadow-xl
            active:scale-95
          "
        >
          <Bot size={22} />
        </button>

      </div>
    </JumuiyaDashboardShell>
  );
}