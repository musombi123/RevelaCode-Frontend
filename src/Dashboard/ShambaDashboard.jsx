import React, { useEffect, useMemo, useState } from "react";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CalendarDays,
  ChevronRight,
  CloudSun,
  FileText,
  Flame,
  Leaf,
  MapPin,
  Package,
  ShoppingCart,
  Sprout,
  Store,
  Tractor,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";


// =========================================================
// HELPERS
// =========================================================

function firstValue(...values) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== ""
  );
}

function formatMoney(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return `KSh ${number.toLocaleString("en-KE")}`;
}

function getActivityIcon(type) {
  const value = String(type || "").toLowerCase();

  if (
    value.includes("order") ||
    value.includes("market")
  ) {
    return FileText;
  }

  if (
    value.includes("price") ||
    value.includes("market")
  ) {
    return Store;
  }

  if (
    value.includes("harvest") ||
    value.includes("crop")
  ) {
    return Leaf;
  }

  return Activity;
}


// =========================================================
// MARKET PRICE ROW
// =========================================================

function MarketPriceRow({
  name,
  unit,
  price,
  trend,
}) {
  const positive =
    trend === "up" ||
    trend === "increase" ||
    Number(trend) > 0;

  const negative =
    trend === "down" ||
    trend === "decrease" ||
    Number(trend) < 0;

  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-3
        py-1.5
      "
    >
      <div className="min-w-0">
        <div className="truncate text-[12px] font-medium text-white">
          {name}
          {unit && (
            <span className="ml-1 text-white/70">
              ({unit})
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="text-[12px] font-semibold text-white">
          {formatMoney(price)}
        </span>

        {positive && (
          <ArrowUpRight
            size={12}
            className="text-lime-200"
          />
        )}

        {negative && (
          <ArrowDownRight
            size={12}
            className="text-red-200"
          />
        )}

        {!positive && !negative && (
          <span className="text-[10px] text-white/50">
            •
          </span>
        )}
      </div>
    </div>
  );
}


// =========================================================
// QUICK ACCESS
// =========================================================

function QuickAccessItem({
  icon: Icon,
  label,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group
        flex
        min-w-0
        flex-col
        items-center
        justify-center
        gap-2
        rounded-2xl
        px-2
        py-3
        transition
        hover:bg-amber-50
        active:scale-[0.97]
      "
    >
      <span
        className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl
          bg-amber-50
          text-amber-700
          transition
          group-hover:bg-amber-100
        "
      >
        <Icon size={19} strokeWidth={1.8} />
      </span>

      <span
        className="
          max-w-[72px]
          truncate
          text-center
          text-[10px]
          font-semibold
          text-slate-700
        "
      >
        {label}
      </span>
    </button>
  );
}


// =========================================================
// OVERVIEW CARD
// =========================================================

function OverviewCard({
  icon: Icon,
  label,
  value,
  tone = "green",
}) {
  const toneClasses = {
    green: {
      icon:
        "bg-emerald-50 text-emerald-600",
      value: "text-emerald-700",
    },

    amber: {
      icon:
        "bg-amber-50 text-amber-600",
      value: "text-amber-700",
    },

    orange: {
      icon:
        "bg-orange-50 text-orange-600",
      value: "text-orange-700",
    },

    blue: {
      icon:
        "bg-sky-50 text-sky-600",
      value: "text-sky-700",
    },
  };

  const current =
    toneClasses[tone] ||
    toneClasses.green;

  return (
    <div
      className="
        flex
        min-w-0
        items-center
        gap-3
        rounded-2xl
        border
        border-slate-100
        bg-white
        px-3
        py-3.5
        shadow-[0_2px_10px_rgba(15,23,42,0.03)]
      "
    >
      <div
        className={`
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-xl
          ${current.icon}
        `}
      >
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <div
          className="
            truncate
            text-[10px]
            font-medium
            text-slate-500
          "
        >
          {label}
        </div>

        <div
          className={`
            mt-0.5
            truncate
            text-sm
            font-bold
            ${current.value}
          `}
        >
          {value}
        </div>
      </div>
    </div>
  );
}


// =========================================================
// ACTIVITY ITEM
// =========================================================

function RecentActivityItem({
  activity,
}) {
  const Icon = getActivityIcon(
    activity?.type ||
      activity?.category ||
      activity?.title
  );

  const title =
    firstValue(
      activity?.title,
      activity?.description,
      activity?.message
    ) ||
    "Farm activity recorded";

  const time =
    firstValue(
      activity?.time,
      activity?.created_at,
      activity?.date
    ) ||
    "Recently";

  const amount =
    firstValue(
      activity?.amount,
      activity?.value
    );

  const isPositive =
    activity?.direction === "in" ||
    activity?.type === "income" ||
    Number(amount) > 0;

  return (
    <div
      className="
        flex
        items-center
        gap-3
        border-b
        border-slate-100
        py-3.5
        last:border-b-0
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
          bg-slate-50
          text-slate-500
        "
      >
        <Icon size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <div
          className="
            truncate
            text-[11px]
            font-semibold
            text-slate-700
          "
        >
          {title}
        </div>

        <div
          className="
            mt-0.5
            text-[9px]
            text-slate-400
          "
        >
          {time}
        </div>
      </div>

      {amount !== undefined &&
        amount !== null &&
        amount !== "" && (
          <div
            className={`
              shrink-0
              text-[10px]
              font-bold
              ${
                isPositive
                  ? "text-emerald-600"
                  : "text-red-500"
              }
            `}
          >
            {isPositive ? "+" : "-"}{" "}
            {formatMoney(
              Math.abs(Number(amount))
            )}
          </div>
        )}
    </div>
  );
}


// =========================================================
// DASHBOARD
// =========================================================

export default function ShambaDashboard({
  onNavigate,
}) {
  const { user } = useAuth();

  const {
    getFarmer,
    getFarms,
    getShambaDashboard,
  } = useJumuiyaApi();

  const [dashboard, setDashboard] =
    useState(null);

  const [farmer, setFarmer] =
    useState(null);

  const [farms, setFarms] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =======================================================
  // LOAD DATA
  // =======================================================

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          dashboardResult,
          farmerResult,
          farmsResult,
        ] = await Promise.all([
          getShambaDashboard(),
          getFarmer().catch(() => null),
          getFarms().catch(() => []),
        ]);

        if (!active) return;

        setDashboard(
          dashboardResult || null
        );

        setFarmer(
          farmerResult || null
        );

        setFarms(
          Array.isArray(farmsResult)
            ? farmsResult
            : farmsResult?.farms || []
        );
      } catch (err) {
        if (!active) return;

        setError(
          err?.message ||
            "Unable to load Shamba dashboard."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [
    getShambaDashboard,
    getFarmer,
    getFarms,
  ]);

  // =======================================================
  // NORMALIZED DATA
  // =======================================================

  const metrics =
    dashboard?.metrics ||
    dashboard?.summary ||
    {};

  const farmerData =
    dashboard?.farmer ||
    farmer ||
    {};

  const dashboardFarms =
    dashboard?.farms ||
    farms ||
    [];

  const marketPrices = useMemo(() => {
    const source =
      dashboard?.market_prices ||
      dashboard?.marketPrices ||
      dashboard?.prices ||
      [];

    if (Array.isArray(source)) {
      return source.slice(0, 4);
    }

    if (
      source &&
      typeof source === "object"
    ) {
      return Object.entries(source)
        .slice(0, 4)
        .map(([name, data]) => ({
          name,
          ...(typeof data === "object"
            ? data
            : { price: data }),
        }));
    }

    return [];
  }, [dashboard]);

  const recentActivities = useMemo(() => {
    const source =
      dashboard?.recent_activity ||
      dashboard?.recent_activities ||
      dashboard?.activities ||
      [];

    return Array.isArray(source)
      ? source.slice(0, 5)
      : [];
  }, [dashboard]);

  // =======================================================
  // METRICS
  // =======================================================

  const totalFarms =
    firstValue(
      metrics.farms,
      metrics.total_farms,
      dashboardFarms.length,
      0
    );

  const activeCrops =
    firstValue(
      metrics.active_crops,
      metrics.crops_active,
      metrics.crops,
      0
    );

  const activeOrders =
    firstValue(
      metrics.active_orders,
      metrics.orders,
      metrics.total_orders,
      0
    );

  const pendingDeliveries =
    firstValue(
      metrics.pending_deliveries,
      metrics.deliveries_pending,
      0
    );

  const totalEarnings =
    firstValue(
      metrics.total_earnings,
      metrics.earnings,
      metrics.revenue,
      0
    );

  const pendingPayments =
    firstValue(
      metrics.pending_payments,
      metrics.payments_pending,
      0
    );

  // =======================================================
  // FALLBACK MARKET PRICES
  // =======================================================

  const displayMarketPrices =
    marketPrices.length > 0
      ? marketPrices
      : [
          {
            name: "Maize",
            unit: "90kg",
            price: 2200,
            trend: "up",
          },
          {
            name: "Beans",
            unit: "90kg",
            price: 4600,
            trend: "up",
          },
          {
            name: "Tomatoes",
            unit: "20kg",
            price: 1800,
            trend: "up",
          },
          {
            name: "Potatoes",
            unit: "50kg",
            price: 2300,
            trend: "up",
          },
        ];

  // =======================================================
  // USER NAME
  // =======================================================

  const farmerName =
    firstValue(
      farmerData?.full_name,
      farmerData?.name,
      user?.full_name,
      user?.name,
      "Farmer"
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
      {/* ===================================================
          PAGE
      =================================================== */}

      <div
        className="
          mx-auto
          w-full
          max-w-7xl
          px-1
          pb-20
        "
      >
        {/* ===============================================
            SHAMBA HEADER
        =============================================== */}

        <section
          className="
            mb-5
            flex
            items-start
            justify-between
            gap-4
          "
        >
          <div
            className="
              flex
              min-w-0
              items-center
              gap-3
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
              "
            >
              <Leaf
                size={23}
                strokeWidth={2}
              />
            </div>

            <div className="min-w-0">
              <h1
                className="
                  text-xl
                  font-extrabold
                  tracking-tight
                  text-slate-900
                "
              >
                Shamba Hub
              </h1>

              <p
                className="
                  mt-0.5
                  truncate
                  text-[10px]
                  font-medium
                  text-slate-400
                "
              >
                Grow better. Sell smarter. Feed Africa.
              </p>
            </div>
          </div>

          {farmerData?.county && (
            <div
              className="
                hidden
                items-center
                gap-1
                rounded-full
                bg-slate-50
                px-2.5
                py-1.5
                text-[10px]
                font-medium
                text-slate-500
                sm:flex
              "
            >
              <MapPin size={12} />

              {farmerData.county}
            </div>
          )}
        </section>


        {/* ===============================================
            ERROR
        =============================================== */}

        {!loading && error && (
          <div
            className="
              mb-5
              rounded-2xl
              border
              border-red-100
              bg-red-50
              px-4
              py-3
              text-xs
              text-red-700
            "
          >
            <div className="font-bold">
              Shamba could not load completely
            </div>

            <div className="mt-1">
              {error}
            </div>
          </div>
        )}


        {/* ===============================================
            MARKET PRICES
        =============================================== */}

        <section
          className="
            relative
            mb-6
            overflow-hidden
            rounded-2xl
            bg-gradient-to-br
            from-orange-500
            via-orange-500
            to-amber-500
            px-5
            py-5
            shadow-[0_10px_30px_rgba(249,115,22,0.20)]
          "
        >
          {/* decorative chart line */}

          <svg
            viewBox="0 0 180 100"
            className="
              pointer-events-none
              absolute
              right-2
              top-5
              h-32
              w-40
              opacity-70
            "
            fill="none"
          >
            <path
              d="
                M8 82
                L35 58
                L57 72
                L83 38
                L104 49
                L128 25
                L150 7
              "
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <circle
              cx="35"
              cy="58"
              r="2.8"
              fill="white"
            />

            <circle
              cx="57"
              cy="72"
              r="2.8"
              fill="white"
            />

            <circle
              cx="83"
              cy="38"
              r="2.8"
              fill="white"
            />

            <circle
              cx="104"
              cy="49"
              r="2.8"
              fill="white"
            />

            <circle
              cx="128"
              cy="25"
              r="2.8"
              fill="white"
            />

            <circle
              cx="150"
              cy="7"
              r="2.8"
              fill="white"
            />
          </svg>

          <div className="relative z-10 max-w-[65%] sm:max-w-[58%]">
            <h2
              className="
                text-sm
                font-bold
                text-white
              "
            >
              Market Prices
              <span className="ml-1 text-white/70">
                (Today)
              </span>
            </h2>

            <div className="mt-3 space-y-0.5">
              {displayMarketPrices.map(
                (item, index) => (
                  <MarketPriceRow
                    key={
                      item.id ||
                      item._id ||
                      `${item.name}-${index}`
                    }
                    name={
                      item.name ||
                      item.crop ||
                      item.product ||
                      "Crop"
                    }
                    unit={
                      item.unit ||
                      item.package ||
                      item.quantity
                    }
                    price={
                      firstValue(
                        item.price,
                        item.market_price,
                        item.amount,
                        0
                      )
                    }
                    trend={
                      item.trend ||
                      item.direction
                    }
                  />
                )
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate?.(
                  "shamba/market"
                )
              }
              className="
                mt-4
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-white/15
                px-4
                py-2.5
                text-[11px]
                font-bold
                text-white
                backdrop-blur-sm
                transition
                hover:bg-white/25
              "
            >
              View Market

              <ArrowUpRight size={14} />
            </button>
          </div>
        </section>


        {/* ===============================================
            QUICK ACCESS
        =============================================== */}

        <section className="mb-6">
          <div
            className="
              mb-3
              flex
              items-center
              justify-between
            "
          >
            <h2
              className="
                text-sm
                font-extrabold
                text-slate-900
              "
            >
              Quick Access
            </h2>
          </div>

          <div
            className="
              grid
              grid-cols-4
              gap-1
              rounded-2xl
              border
              border-slate-100
              bg-white
              p-2
              shadow-[0_4px_20px_rgba(15,23,42,0.04)]
              sm:grid-cols-8
            "
          >
            <QuickAccessItem
              icon={Tractor}
              label="My Farm"
              onClick={() =>
                onNavigate?.(
                  "shamba/farms"
                )
              }
            />

            <QuickAccessItem
              icon={Leaf}
              label="Crops"
              onClick={() =>
                onNavigate?.(
                  "shamba/crops"
                )
              }
            />

            <QuickAccessItem
              icon={ShoppingCart}
              label="Market"
              onClick={() =>
                onNavigate?.(
                  "shamba/market"
                )
              }
            />

            <QuickAccessItem
              icon={Wallet}
              label="Sell Produce"
              onClick={() =>
                onNavigate?.(
                  "marketplace"
                )
              }
            />

            <QuickAccessItem
              icon={Package}
              label="Inputs"
              onClick={() =>
                onNavigate?.(
                  "shamba/inputs"
                )
              }
            />

            <QuickAccessItem
              icon={Users}
              label="Buyers"
              onClick={() =>
                onNavigate?.(
                  "shamba/buyers"
                )
              }
            />

            <QuickAccessItem
              icon={FileText}
              label="Orders"
              onClick={() =>
                onNavigate?.(
                  "shamba/orders"
                )
              }
            />

            <QuickAccessItem
              icon={CloudSun}
              label="Weather"
              onClick={() =>
                onNavigate?.(
                  "shamba/weather"
                )
              }
            />
          </div>
        </section>


        {/* ===============================================
            FARM OVERVIEW
        =============================================== */}

        <section className="mb-6">
          <h2
            className="
              mb-3
              text-sm
              font-extrabold
              text-slate-900
            "
          >
            My Farm Overview
          </h2>

          <div
            className="
              grid
              grid-cols-2
              gap-2
              sm:grid-cols-4
            "
          >
            <OverviewCard
              icon={Leaf}
              label="Active Crops"
              value={activeCrops}
              tone="green"
            />

            <OverviewCard
              icon={Package}
              label="Active Orders"
              value={activeOrders}
              tone="green"
            />

            <OverviewCard
              icon={Wallet}
              label="Total Earnings"
              value={formatMoney(
                totalEarnings
              )}
              tone="green"
            />

            <OverviewCard
              icon={Wallet}
              label="Pending Payments"
              value={pendingPayments}
              tone="amber"
            />
          </div>
        </section>


        {/* ===============================================
            RECENT ACTIVITY
        =============================================== */}

        <section
          className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-100
            bg-white
            px-4
            shadow-[0_4px_20px_rgba(15,23,42,0.04)]
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              pt-4
            "
          >
            <h2
              className="
                text-sm
                font-extrabold
                text-slate-900
              "
            >
              Recent Activity
            </h2>

            <button
              type="button"
              onClick={() =>
                onNavigate?.(
                  "shamba/activities"
                )
              }
              className="
                text-[10px]
                font-bold
                text-emerald-600
                hover:underline
              "
            >
              View all
            </button>
          </div>

          {loading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="
                      h-12
                      animate-pulse
                      rounded-xl
                      bg-slate-50
                    "
                  />
                )
              )}
            </div>
          ) : recentActivities.length > 0 ? (
            <div className="mt-1">
              {recentActivities.map(
                (activity, index) => (
                  <RecentActivityItem
                    key={
                      activity.id ||
                      activity._id ||
                      index
                    }
                    activity={activity}
                  />
                )
              )}
            </div>
          ) : (
            <div
              className="
                flex
                flex-col
                items-center
                justify-center
                py-10
                text-center
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
                  bg-emerald-50
                  text-emerald-600
                "
              >
                <Activity size={20} />
              </div>

              <div
                className="
                  mt-3
                  text-xs
                  font-bold
                  text-slate-700
                "
              >
                No recent activity
              </div>

              <p
                className="
                  mt-1
                  max-w-xs
                  text-[10px]
                  leading-5
                  text-slate-400
                "
              >
                Farm activities, orders and
                market updates will appear here.
              </p>
            </div>
          )}
        </section>


        {/* ===============================================
            SMALL FARM INFO
        =============================================== */}

        <section
          className="
            mt-4
            flex
            flex-col
            gap-3
            rounded-2xl
            border
            border-slate-100
            bg-white
            p-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-emerald-50
                text-emerald-600
              "
            >
              <Sprout size={17} />
            </div>

            <div>
              <div
                className="
                  text-[10px]
                  font-medium
                  text-slate-400
                "
              >
                Farmer
              </div>

              <div
                className="
                  text-xs
                  font-bold
                  text-slate-700
                "
              >
                {farmerName}
              </div>
            </div>
          </div>

          <div
            className="
              flex
              items-center
              gap-4
              text-[10px]
              text-slate-400
            "
          >
            <span>
              {totalFarms}{" "}
              {Number(totalFarms) === 1
                ? "farm"
                : "farms"}
            </span>

            {farmerData?.county && (
              <span className="flex items-center gap-1">
                <MapPin size={11} />

                {farmerData.county}
              </span>
            )}
          </div>
        </section>
      </div>


      {/* =================================================
          FLOATING SHAMBA ASSISTANT
      ================================================= */}

      <button
        type="button"
        aria-label="Open Shamba assistant"
        onClick={() =>
          onNavigate?.(
            "assistant"
          )
        }
        className="
          fixed
          bottom-5
          right-5
          z-50
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-2xl
          bg-emerald-600
          text-white
          shadow-[0_12px_30px_rgba(16,185,129,0.35)]
          transition
          hover:scale-105
          hover:bg-emerald-700
          active:scale-95
          sm:bottom-7
          sm:right-7
        "
      >
        <Bot
          size={24}
          strokeWidth={1.8}
        />

        <span
          className="
            absolute
            right-0
            top-0
            h-2.5
            w-2.5
            rounded-full
            border-2
            border-white
            bg-emerald-300
          "
        />
      </button>
    </JumuiyaDashboardShell>
  );
}
