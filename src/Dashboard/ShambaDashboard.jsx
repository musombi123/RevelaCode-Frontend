import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  ArrowUpRight,
  Bot,
  CloudSun,
  FileText,
  Leaf,
  MapPin,
  Package,
  ShoppingCart,
  Sprout,
  Tractor,
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
      value !== "",
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


function formatDate(value) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}


function getActivityIcon(type) {
  const value = String(type || "").toLowerCase();

  if (
    value.includes("harvest") ||
    value.includes("crop")
  ) {
    return Leaf;
  }

  if (
    value.includes("order") ||
    value.includes("market")
  ) {
    return ShoppingCart;
  }

  return Activity;
}


// =========================================================
// MARKET LISTING ROW
// =========================================================

function MarketListingRow({
  listing,
}) {
  const title =
    firstValue(
      listing?.title,
      listing?.name,
      listing?.product,
      "Produce",
    );

  const price =
    firstValue(
      listing?.price,
      0,
    );

  const unit =
    firstValue(
      listing?.unit,
      listing?.package,
      "unit",
    );

  const location =
    firstValue(
      listing?.location,
      "",
    );

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
        <div
          className="
            truncate
            text-[12px]
            font-medium
            text-white
          "
        >
          {title}
        </div>

        <div
          className="
            mt-0.5
            truncate
            text-[9px]
            text-white/65
          "
        >
          {location || unit}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div
          className="
            text-[12px]
            font-bold
            text-white
          "
        >
          {formatMoney(price)}
        </div>

        <div
          className="
            text-[9px]
            text-white/65
          "
        >
          / {unit}
        </div>
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
        <Icon
          size={19}
          strokeWidth={1.8}
        />
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
  onClick,
}) {
  const toneClasses = {
    green: {
      icon:
        "bg-emerald-50 text-emerald-600",
      value:
        "text-emerald-700",
    },

    amber: {
      icon:
        "bg-amber-50 text-amber-600",
      value:
        "text-amber-700",
    },

    orange: {
      icon:
        "bg-orange-50 text-orange-600",
      value:
        "text-orange-700",
    },

    blue: {
      icon:
        "bg-sky-50 text-sky-600",
      value:
        "text-sky-700",
    },
  };

  const current =
    toneClasses[tone] ||
    toneClasses.green;

  return (
    <button
      type="button"
      onClick={onClick}
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
        text-left
        shadow-[0_2px_10px_rgba(15,23,42,0.03)]
        transition
        hover:-translate-y-0.5
        hover:shadow-[0_6px_18px_rgba(15,23,42,0.06)]
        active:scale-[0.99]
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
    </button>
  );
}


// =========================================================
// ACTIVITY ITEM
// =========================================================

function RecentActivityItem({
  activity,
}) {
  const Icon =
    getActivityIcon(
      activity?.type ||
      activity?.category ||
      activity?.title,
    );

  const title =
    firstValue(
      activity?.title,
      activity?.name,
      activity?.description,
      activity?.message,
      activity?.activity_type,
      "Farm activity",
    );

  const time =
    firstValue(
      activity?.created_at,
      activity?.date,
      activity?.activity_date,
      activity?.time,
    );

  const cost =
    firstValue(
      activity?.cost,
      activity?.amount,
    );

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
          bg-emerald-50
          text-emerald-600
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
          {formatDate(time)}
        </div>
      </div>

      {cost !== undefined &&
        cost !== null &&
        cost !== "" && (
          <div
            className="
              shrink-0
              text-[10px]
              font-bold
              text-red-500
            "
          >
            -{formatMoney(cost)}
          </div>
        )}
    </div>
  );
}


// =========================================================
// FARM SNAPSHOT ITEM
// =========================================================

function FarmSnapshotItem({
  farm,
}) {
  const name =
    firstValue(
      farm?.name,
      farm?.farm_name,
      "Unnamed farm",
    );

  const location =
    firstValue(
      farm?.location,
      farm?.town,
      farm?.county,
    );

  const size =
    firstValue(
      farm?.size,
      farm?.farm_size,
    );

  const sizeUnit =
    firstValue(
      farm?.size_unit,
      farm?.farm_size_unit,
      "acres",
    );

  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-100
        bg-slate-50/70
        p-3
      "
    >
      <div className="flex items-start gap-3">
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
          <Tractor size={17} />
        </div>

        <div className="min-w-0 flex-1">
          <div
            className="
              truncate
              text-[11px]
              font-bold
              text-slate-800
            "
          >
            {name}
          </div>

          {location && (
            <div
              className="
                mt-1
                flex
                items-center
                gap-1
                truncate
                text-[9px]
                text-slate-400
              "
            >
              <MapPin size={10} />
              {location}
            </div>
          )}

          {size !== undefined &&
            size !== null &&
            size !== "" && (
              <div
                className="
                  mt-1
                  text-[9px]
                  font-medium
                  text-slate-400
                "
              >
                {size} {sizeUnit}
              </div>
            )}
        </div>
      </div>
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
    getShambaDashboard,
    getFarms,
    getMarketplaceListings,
    getFarmActivities,
  } = useJumuiyaApi();

  const [dashboard, setDashboard] =
    useState(null);

  const [farms, setFarms] =
    useState([]);

  const [marketListings, setMarketListings] =
    useState([]);

  const [recentActivities, setRecentActivities] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [activitiesLoading, setActivitiesLoading] =
    useState(false);


  // =======================================================
  // LOAD CORE DASHBOARD
  // =======================================================

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [
          dashboardResult,
          farmsResult,
          marketplaceResult,
        ] = await Promise.all([
          getShambaDashboard(),
          getFarms(),
          getMarketplaceListings({
            hub: "shamba",
          }),
        ]);

        if (!active) {
          return;
        }

        setDashboard(
          dashboardResult || null,
        );

        setFarms(
          Array.isArray(farmsResult)
            ? farmsResult
            : farmsResult?.farms || [],
        );

        setMarketListings(
          Array.isArray(marketplaceResult)
            ? marketplaceResult
            : marketplaceResult?.listings || [],
        );
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err?.message ||
            "Unable to load Shamba dashboard.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [
    getShambaDashboard,
    getFarms,
    getMarketplaceListings,
  ]);


  // =======================================================
  // LOAD RECENT ACTIVITY
  // =======================================================

  useEffect(() => {
    let active = true;

    async function loadActivities() {
      if (!farms.length) {
        setRecentActivities([]);
        return;
      }

      setActivitiesLoading(true);

      try {
        const results =
          await Promise.all(
            farms
              .slice(0, 5)
              .map((farm) =>
                getFarmActivities(
                  farm.id || farm._id,
                ).catch(() => []),
              ),
          );

        if (!active) {
          return;
        }

        const merged =
          results
            .flatMap((items) =>
              Array.isArray(items)
                ? items
                : items?.activities || [],
            )
            .map((item) => ({
              ...item,
            }))
            .sort((a, b) => {
              const aTime =
                new Date(
                  a?.created_at ||
                  a?.date ||
                  a?.activity_date ||
                  0,
                ).getTime();

              const bTime =
                new Date(
                  b?.created_at ||
                  b?.date ||
                  b?.activity_date ||
                  0,
                ).getTime();

              return bTime - aTime;
            })
            .slice(0, 5);

        setRecentActivities(
          merged,
        );
      } finally {
        if (active) {
          setActivitiesLoading(false);
        }
      }
    }

    loadActivities();

    return () => {
      active = false;
    };
  }, [
    farms,
    getFarmActivities,
  ]);


  // =======================================================
  // DATA
  // =======================================================

  const metrics =
    dashboard?.metrics ||
    dashboard?.summary ||
    {};

  const farmer =
    dashboard?.farmer ||
    {};

  const totalFarms =
    firstValue(
      metrics.farms,
      farms.length,
      0,
    );

  const activeCrops =
    firstValue(
      metrics.active_crops,
      0,
    );

  const harvests =
    firstValue(
      metrics.harvests,
      0,
    );

  const farmActivities =
    firstValue(
      metrics.farm_activities,
      0,
    );

  const activityCost =
    firstValue(
      metrics.total_activity_cost,
      0,
    );

  const farmerName =
    firstValue(
      farmer?.farmer_name,
      farmer?.full_name,
      farmer?.name,
      user?.full_name,
      user?.name,
      "Farmer",
    );


  const displayListings =
    useMemo(
      () =>
        marketListings
          .filter(
            (item) =>
              item?.status === "active" ||
              !item?.status,
          )
          .slice(0, 4),
      [marketListings],
    );


  const displayFarms =
    useMemo(
      () =>
        farms.slice(0, 3),
      [farms],
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
          max-w-7xl
          px-1
          pb-20
        "
      >

        {/* =================================================
            HEADER
        ================================================= */}

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

          {farmer?.county && (
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
              {farmer.county}
            </div>
          )}
        </section>


        {/* =================================================
            ERROR
        ================================================= */}

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


        {/* =================================================
            MARKET
        ================================================= */}

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

            {[35, 57, 83, 104, 128, 150].map(
              (cx, index) => {
                const cy = [
                  58,
                  72,
                  38,
                  49,
                  25,
                  7,
                ][index];

                return (
                  <circle
                    key={cx}
                    cx={cx}
                    cy={cy}
                    r="2.8"
                    fill="white"
                  />
                );
              },
            )}
          </svg>

          <div
            className="
              relative
              z-10
              max-w-[68%]
              sm:max-w-[58%]
            "
          >
            <h2
              className="
                text-sm
                font-bold
                text-white
              "
            >
              Shamba Market
              <span className="ml-1 text-white/70">
                (Live)
              </span>
            </h2>

            <div className="mt-3">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(
                    (item) => (
                      <div
                        key={item}
                        className="
                          h-7
                          animate-pulse
                          rounded-lg
                          bg-white/10
                        "
                      />
                    ),
                  )}
                </div>
              ) : displayListings.length > 0 ? (
                <div>
                  {displayListings.map(
                    (listing, index) => (
                      <MarketListingRow
                        key={
                          listing?.id ||
                          listing?._id ||
                          index
                        }
                        listing={listing}
                      />
                    ),
                  )}
                </div>
              ) : (
                <div
                  className="
                    py-3
                    text-[10px]
                    text-white/75
                  "
                >
                  No active Shamba listings yet.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate?.(
                  "shamba/market",
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


        {/* =================================================
            QUICK ACCESS
        ================================================= */}

        <section className="mb-6">
          <div className="mb-3">
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
                  "shamba/farms",
                )
              }
            />

            <QuickAccessItem
              icon={Leaf}
              label="Crops"
              onClick={() =>
                onNavigate?.(
                  "shamba/crops",
                )
              }
            />

            <QuickAccessItem
              icon={ShoppingCart}
              label="Market"
              onClick={() =>
                onNavigate?.(
                  "shamba/market",
                )
              }
            />

            <QuickAccessItem
              icon={Wallet}
              label="Sell Produce"
              onClick={() =>
                onNavigate?.(
                  "marketplace",
                )
              }
            />

            <QuickAccessItem
              icon={Package}
              label="Inputs"
              onClick={() =>
                onNavigate?.(
                  "shamba/inputs",
                )
              }
            />

            <QuickAccessItem
              icon={Users}
              label="Buyers"
              onClick={() =>
                onNavigate?.(
                  "shamba/buyers",
                )
              }
            />

            <QuickAccessItem
              icon={FileText}
              label="Orders"
              onClick={() =>
                onNavigate?.(
                  "shamba/orders",
                )
              }
            />

            <QuickAccessItem
              icon={CloudSun}
              label="Weather"
              onClick={() =>
                onNavigate?.(
                  "shamba/weather",
                )
              }
            />
          </div>
        </section>


        {/* =================================================
            FARM OVERVIEW
        ================================================= */}

        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="
                text-sm
                font-extrabold
                text-slate-900
              "
            >
              My Farm Overview
            </h2>
          </div>

          <div
            className="
              grid
              grid-cols-2
              gap-2
              sm:grid-cols-4
            "
          >
            <OverviewCard
              icon={Tractor}
              label="My Farms"
              value={totalFarms}
              tone="green"
              onClick={() =>
                onNavigate?.(
                  "shamba/farms",
                )
              }
            />

            <OverviewCard
              icon={Leaf}
              label="Active Crops"
              value={activeCrops}
              tone="green"
              onClick={() =>
                onNavigate?.(
                  "shamba/crops",
                )
              }
            />

            <OverviewCard
              icon={Sprout}
              label="Harvests"
              value={harvests}
              tone="orange"
              onClick={() =>
                onNavigate?.(
                  "shamba/harvests",
                )
              }
            />

            <OverviewCard
              icon={Wallet}
              label="Farm Activity Cost"
              value={formatMoney(
                activityCost,
              )}
              tone="amber"
              onClick={() =>
                onNavigate?.(
                  "shamba/activities",
                )
              }
            />
          </div>
        </section>


        {/* =================================================
            FARM SNAPSHOT
        ================================================= */}

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
              My Farms
            </h2>

            {farms.length > 3 && (
              <button
                type="button"
                onClick={() =>
                  onNavigate?.(
                    "shamba/farms",
                  )
                }
                className="
                  text-[10px]
                  font-bold
                  text-emerald-600
                "
              >
                View all
              </button>
            )}
          </div>

          {loading ? (
            <div
              className="
                grid
                grid-cols-1
                gap-2
                sm:grid-cols-3
              "
            >
              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="
                      h-24
                      animate-pulse
                      rounded-2xl
                      bg-slate-100
                    "
                  />
                ),
              )}
            </div>
          ) : displayFarms.length > 0 ? (
            <div
              className="
                grid
                grid-cols-1
                gap-2
                sm:grid-cols-3
              "
            >
              {displayFarms.map(
                (farm, index) => (
                  <button
                    type="button"
                    key={
                      farm?.id ||
                      farm?._id ||
                      index
                    }
                    onClick={() =>
                      onNavigate?.(
                        `shamba/farms/${farm?.id || farm?._id}`,
                      )
                    }
                    className="text-left"
                  >
                    <FarmSnapshotItem
                      farm={farm}
                    />
                  </button>
                ),
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                onNavigate?.(
                  "shamba/farms",
                )
              }
              className="
                w-full
                rounded-2xl
                border
                border-dashed
                border-emerald-200
                bg-emerald-50/40
                px-4
                py-6
                text-center
              "
            >
              <Tractor
                size={22}
                className="mx-auto text-emerald-600"
              />

              <div
                className="
                  mt-2
                  text-xs
                  font-bold
                  text-slate-700
                "
              >
                Add your first farm
              </div>

              <div
                className="
                  mt-1
                  text-[10px]
                  text-slate-400
                "
              >
                Start managing your land and crops.
              </div>
            </button>
          )}
        </section>


        {/* =================================================
            RECENT ACTIVITY
        ================================================= */}

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
                  "shamba/activities",
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

          {loading || activitiesLoading ? (
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
                ),
              )}
            </div>
          ) : recentActivities.length > 0 ? (
            <div className="mt-1">
              {recentActivities.map(
                (activity, index) => (
                  <RecentActivityItem
                    key={
                      activity?.id ||
                      activity?._id ||
                      index
                    }
                    activity={activity}
                  />
                ),
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
                Record your first farm activity
                or harvest to see your farm timeline here.
              </p>
            </div>
          )}
        </section>


        {/* =================================================
            FARMER INFO
        ================================================= */}

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
              {Number(totalFarms)}{" "}
              {Number(totalFarms) === 1
                ? "farm"
                : "farms"}
            </span>

            {farmer?.county && (
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {farmer.county}
              </span>
            )}

            <span>
              {farmActivities} activities
            </span>
          </div>
        </section>
      </div>


      {/* =================================================
          SHAMBA ASSISTANT
      ================================================= */}

      <button
        type="button"
        aria-label="Open Shamba assistant"
        onClick={() =>
          onNavigate?.(
            "assistant",
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
