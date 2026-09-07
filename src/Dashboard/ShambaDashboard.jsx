import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  CloudSun,
  Leaf,
  MapPin,
  Package,
  ShoppingCart,
  Tractor,
  TrendingUp,
  Users,
  WalletCards,
  Wheat,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";


// =========================================================
// HELPERS
// =========================================================

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
    farmer?.full_name ||
    farmer?.fullName ||
    farmer?.name ||
    getDisplayName(user)
  );
}

function getActivityTitle(activity) {
  return (
    activity?.activity_type ||
    activity?.type ||
    activity?.name ||
    "Farm activity"
  );
}

function getActivityDescription(activity) {
  return (
    activity?.description ||
    activity?.notes ||
    activity?.details ||
    ""
  );
}

function getActivityDate(activity) {
  return (
    activity?.created_at ||
    activity?.updated_at ||
    activity?.date ||
    null
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
// FARM METRIC
// =========================================================

function FarmMetric({
  label,
  value,
  icon: Icon,
  onClick,
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
        py-3.5
        text-center
        shadow-[0_3px_14px_rgba(15,23,42,0.035)]
        transition
        hover:border-emerald-100
        hover:shadow-md
        active:scale-[0.98]
      "
    >
      <div
        className="
          mx-auto
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

      <div className="mt-2 text-lg font-black text-slate-900">
        {value}
      </div>

      <div className="mt-0.5 truncate text-[9px] font-semibold text-slate-400">
        {label}
      </div>
    </button>
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
    getMarketplaceListings,
    getFarmActivities,
  } = useJumuiyaApi();

  const [dashboard, setDashboard] =
    useState(null);

  const [farms, setFarms] =
    useState([]);

  const [marketListings, setMarketListings] =
    useState([]);

  const [activities, setActivities] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [marketLoading, setMarketLoading] =
    useState(true);

  const [activityLoading, setActivityLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =======================================================
  // LOAD CORE SHAMBA DATA
  // =======================================================

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
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

        if (!mounted) return;

        setDashboard(
          dashboardResult || null,
        );

        setFarms(
          Array.isArray(farmsResult)
            ? farmsResult
            : farmsResult?.farms || [],
        );
      } catch (err) {
        if (!mounted) return;

        setError(
          err?.message ||
            "Unable to load Shamba data.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [
    getShambaDashboard,
    getFarms,
  ]);


  // =======================================================
  // LOAD MARKETPLACE DATA
  // =======================================================

  useEffect(() => {
    let mounted = true;

    async function loadMarket() {
      try {
        setMarketLoading(true);

        const result =
          await getMarketplaceListings({
            hub: "shamba",
          });

        if (!mounted) return;

        const listings =
          Array.isArray(result)
            ? result
            : result?.listings || [];

        setMarketListings(
          listings.filter(
            (item) =>
              item?.status !== "deleted",
          ),
        );
      } catch {
        if (mounted) {
          setMarketListings([]);
        }
      } finally {
        if (mounted) {
          setMarketLoading(false);
        }
      }
    }

    loadMarket();

    return () => {
      mounted = false;
    };
  }, [
    getMarketplaceListings,
  ]);


  // =======================================================
  // LOAD RECENT ACTIVITIES
  // =======================================================

  useEffect(() => {
    let mounted = true;

    async function loadActivities() {
      try {
        setActivityLoading(true);

        const activeFarms =
          farms.filter(
            (farm) =>
              farm?.status !== "deleted",
          );

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
                const farmId =
                  farm?.id ||
                  farm?._id;

                if (!farmId) {
                  return [];
                }

                try {
                  const result =
                    await getFarmActivities(
                      farmId,
                    );

                  return Array.isArray(result)
                    ? result
                    : result?.activities || [];
                } catch {
                  return [];
                }
              }),
          );

        if (!mounted) return;

        const merged =
          results.flat();

        merged.sort((a, b) => {
          const first =
            new Date(
              getActivityDate(a) || 0,
            ).getTime();

          const second =
            new Date(
              getActivityDate(b) || 0,
            ).getTime();

          return second - first;
        });

        setActivities(
          merged.slice(0, 5),
        );
      } catch {
        if (mounted) {
          setActivities([]);
        }
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
    farms,
    loading,
    getFarmActivities,
  ]);


  // =======================================================
  // DERIVED DATA
  // =======================================================

  const metrics =
    dashboard?.metrics || {};

  const farmer =
    dashboard?.farmer || null;

  const activeFarms =
    farms.filter(
      (farm) =>
        farm?.status !== "deleted",
    );

  const firstFarm =
    activeFarms[0] || null;

  const locationLabel =
    [
      firstFarm?.town,
      firstFarm?.county,
    ]
      .filter(Boolean)
      .join(", ") ||
    farmer?.town ||
    farmer?.county ||
    "Mombasa County";


  const featuredListings =
    useMemo(
      () =>
        marketListings.slice(0, 3),
      [marketListings],
    );


  const firstListing =
    featuredListings[0] ||
    null;


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
          max-w-[1100px]
          pb-24
        "
      >

        {/* ==================================================
            HEADER
        ================================================== */}

        <section
          className="
            mb-4
            rounded-3xl
            border
            border-emerald-100
            bg-gradient-to-br
            from-emerald-50
            via-white
            to-lime-50
            p-4
            sm:p-5
          "
        >
          <div className="flex items-center justify-between gap-3">

            <div className="flex min-w-0 items-center gap-3">

              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-emerald-600
                  text-white
                  shadow-lg
                  shadow-emerald-900/10
                "
              >
                <Leaf size={21} />
              </div>

              <div className="min-w-0">

                <h1
                  className="
                    truncate
                    text-base
                    font-black
                    tracking-tight
                    text-slate-900
                  "
                >
                  SHAMBA
                </h1>

                <p
                  className="
                    truncate
                    text-[10px]
                    font-medium
                    text-slate-500
                  "
                >
                  Grow better. Sell smarter. Feed Africa.
                </p>

              </div>
            </div>


            <div
              className="
                flex
                max-w-[145px]
                shrink-0
                items-center
                gap-1.5
                rounded-full
                border
                border-emerald-100
                bg-white
                px-2.5
                py-1.5
                text-[9px]
                font-bold
                text-emerald-700
                shadow-sm
              "
            >
              <MapPin size={11} />

              <span className="truncate">
                {locationLabel}
              </span>
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
              rounded-2xl
              border
              border-red-100
              bg-red-50
              px-4
              py-3
              text-[11px]
              font-medium
              text-red-700
            "
          >
            {error}
          </div>
        )}


        {/* ==================================================
            MARKET TODAY
        ================================================== */}

        <section
          className="
            mb-5
            overflow-hidden
            rounded-3xl
            bg-gradient-to-br
            from-orange-400
            via-orange-500
            to-amber-500
            p-4
            text-white
            shadow-lg
            sm:p-5
          "
        >
          <div
            className="
              flex
              items-start
              justify-between
              gap-4
            "
          >
            <div className="min-w-0">

              <div
                className="
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-white/70
                "
              >
                Market Today
              </div>

              <h2
                className="
                  mt-1
                  text-lg
                  font-black
                  tracking-tight
                "
              >
                What&apos;s moving in the market?
              </h2>

              <p
                className="
                  mt-1
                  max-w-xl
                  text-[10px]
                  leading-5
                  text-white/80
                "
              >
                Explore produce listings,
                opportunities and prices from
                the Shamba marketplace.
              </p>

            </div>

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
              <TrendingUp size={20} />
            </div>
          </div>


          {/* MARKET ITEMS */}

          <div className="mt-4 space-y-2">

            {marketLoading ? (
              [1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="
                    h-12
                    animate-pulse
                    rounded-2xl
                    bg-white/15
                  "
                />
              ))
            ) : featuredListings.length > 0 ? (
              featuredListings.map(
                (listing, index) => (
                  <button
                    type="button"
                    key={
                      listing?.id ||
                      listing?._id ||
                      index
                    }
                    onClick={() =>
                      onNavigate?.(
                        "shamba/market",
                      )
                    }
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-2xl
                      bg-white/10
                      px-3
                      py-2.5
                      text-left
                      backdrop-blur-sm
                      transition
                      hover:bg-white/15
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
                        bg-white/15
                      "
                    >
                      <Leaf size={15} />
                    </div>

                    <div className="min-w-0 flex-1">

                      <div
                        className="
                          truncate
                          text-[10px]
                          font-bold
                          text-white/70
                        "
                      >
                        {listing?.category ||
                          "Produce"}
                      </div>

                      <div
                        className="
                          truncate
                          text-xs
                          font-black
                        "
                      >
                        {listing?.title ||
                          "Produce listing"}
                      </div>

                    </div>

                    <div className="shrink-0 text-right">

                      <div className="text-[10px] font-black">
                        {listing?.price !==
                        undefined
                          ? money(
                              listing.price,
                            )
                          : "View"}
                      </div>

                      {listing?.unit && (
                        <div className="text-[8px] text-white/65">
                          /{listing.unit}
                        </div>
                      )}

                    </div>
                  </button>
                ),
              )
            ) : (
              <div
                className="
                  rounded-2xl
                  bg-white/10
                  px-4
                  py-4
                  text-[10px]
                  leading-5
                  text-white/80
                "
              >
                No market listings yet.
                Your Shamba market will appear here
                as produce becomes available.
              </div>
            )}

          </div>


          <button
            type="button"
            onClick={() =>
              onNavigate?.("shamba/market")
            }
            className="
              mt-4
              inline-flex
              items-center
              gap-1.5
              rounded-xl
              bg-white
              px-3
              py-2
              text-[10px]
              font-black
              text-orange-600
              shadow-sm
              transition
              hover:bg-orange-50
              active:scale-[0.98]
            "
          >
            View Market
            <ArrowRight size={13} />
          </button>
        </section>


        {/* ==================================================
            QUICK ACCESS
        ================================================== */}

        <section className="mb-5">

          <div className="mb-3">

            <h2
              className="
                text-sm
                font-black
                tracking-tight
                text-slate-900
              "
            >
              Quick Access
            </h2>

            <p
              className="
                mt-0.5
                text-[9px]
                text-slate-400
              "
            >
              Everything you need for your farm.
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
            {QUICK_ACCESS.map(
              (item) => (
                <QuickAccessTile
                  key={item.key}
                  item={item}
                  onNavigate={
                    onNavigate
                  }
                />
              ),
            )}
          </div>

        </section>


        {/* ==================================================
            MY FARM
        ================================================== */}

        <section className="mb-5">

          <div className="mb-3 flex items-end justify-between">

            <div>
              <h2
                className="
                  text-sm
                  font-black
                  tracking-tight
                  text-slate-900
                "
              >
                My Farm
              </h2>

              <p
                className="
                  mt-0.5
                  text-[9px]
                  text-slate-400
                "
              >
                Your farming activity at a glance.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate?.(
                  "shamba/farms",
                )
              }
              className="
                inline-flex
                items-center
                gap-1
                text-[9px]
                font-black
                text-emerald-600
                hover:text-emerald-700
              "
            >
              View farms
              <ArrowRight size={11} />
            </button>

          </div>


          {loading ? (
            <div
              className="
                grid
                grid-cols-2
                gap-2
                sm:grid-cols-4
              "
            >
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="
                      h-28
                      animate-pulse
                      rounded-2xl
                      bg-slate-100
                    "
                  />
                ),
              )}
            </div>
          ) : (
            <div
              className="
                grid
                grid-cols-2
                gap-2
                sm:grid-cols-4
              "
            >

              <FarmMetric
                label="Farms"
                value={
                  activeFarms.length
                }
                icon={Tractor}
                onClick={() =>
                  onNavigate?.(
                    "shamba/farms",
                  )
                }
              />

              <FarmMetric
                label="Crops"
                value={
                  metrics?.active_crops ||
                  0
                }
                icon={Leaf}
                onClick={() =>
                  onNavigate?.(
                    "shamba/crops",
                  )
                }
              />

              <FarmMetric
                label="Harvests"
                value={
                  metrics?.harvests ||
                  0
                }
                icon={Wheat}
                onClick={() =>
                  onNavigate?.(
                    "shamba/harvests",
                  )
                }
              />

              <FarmMetric
                label="Activity"
                value={
                  metrics?.farm_activities ||
                  0
                }
                icon={Activity}
                onClick={() =>
                  onNavigate?.(
                    "shamba/activities",
                  )
                }
              />

            </div>
          )}

        </section>


        {/* ==================================================
            FARM SNAPSHOT
        ================================================== */}

        <section className="mb-5">

          <div
            className="
              overflow-hidden
              rounded-3xl
              border
              border-slate-100
              bg-white
              shadow-[0_4px_18px_rgba(15,23,42,0.035)]
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
                p-4
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
                <Tractor size={20} />
              </div>


              <div className="min-w-0 flex-1">

                <div
                  className="
                    text-[8px]
                    font-black
                    uppercase
                    tracking-[0.16em]
                    text-slate-400
                  "
                >
                  Farmer
                </div>

                <div
                  className="
                    mt-1
                    truncate
                    text-sm
                    font-black
                    text-slate-900
                  "
                >
                  {getFarmerName(
                    farmer,
                    user,
                  )}
                </div>

                <div
                  className="
                    mt-1
                    flex
                    items-center
                    gap-1
                    text-[9px]
                    text-slate-400
                  "
                >
                  <MapPin size={10} />

                  <span className="truncate">
                    {locationLabel}
                  </span>
                </div>

              </div>


              <div
                className="
                  hidden
                  rounded-xl
                  bg-emerald-50
                  px-3
                  py-2
                  text-[9px]
                  font-black
                  text-emerald-700
                  sm:block
                "
              >
                {firstFarm?.name ||
                  "No farm yet"}
              </div>

            </div>

          </div>

        </section>


        {/* ==================================================
            RECENT ACTIVITY
        ================================================== */}

        <section className="mb-5">

          <div className="mb-3">

            <h2
              className="
                text-sm
                font-black
                tracking-tight
                text-slate-900
              "
            >
              Recent Activity
            </h2>

            <p
              className="
                mt-0.5
                text-[9px]
                text-slate-400
              "
            >
              Keep track of what&apos;s happening on your farm.
            </p>

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
                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
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
                          h-8
                          w-8
                          animate-pulse
                          rounded-xl
                          bg-slate-100
                        "
                      />

                      <div className="min-w-0 flex-1">
                        <div className="h-2.5 w-28 animate-pulse rounded bg-slate-100" />
                        <div className="mt-2 h-2 w-40 animate-pulse rounded bg-slate-50" />
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : activities.length > 0 ? (
              <div className="divide-y divide-slate-50">

                {activities.map(
                  (activity, index) => (
                    <div
                      key={
                        activity?.id ||
                        activity?._id ||
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

                        <div
                          className="
                            truncate
                            text-[10px]
                            font-black
                            text-slate-800
                          "
                        >
                          {getActivityTitle(
                            activity,
                          )}
                        </div>

                        {getActivityDescription(
                          activity,
                        ) && (
                          <div
                            className="
                              mt-0.5
                              truncate
                              text-[9px]
                              text-slate-400
                            "
                          >
                            {getActivityDescription(
                              activity,
                            )}
                          </div>
                        )}

                      </div>

                      {activity?.cost !==
                        undefined && (
                        <div
                          className="
                            shrink-0
                            text-[9px]
                            font-bold
                            text-slate-500
                          "
                        >
                          {money(
                            activity.cost,
                          )}
                        </div>
                      )}

                    </div>
                  ),
                )}

              </div>
            ) : (
              <div
                className="
                  px-4
                  py-8
                  text-center
                "
              >

                <div
                  className="
                    mx-auto
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-slate-50
                    text-slate-400
                  "
                >
                  <Activity size={18} />
                </div>

                <div
                  className="
                    mt-2
                    text-[10px]
                    font-black
                    text-slate-700
                  "
                >
                  No recent activity
                </div>

                <p
                  className="
                    mx-auto
                    mt-1
                    max-w-xs
                    text-[9px]
                    leading-5
                    text-slate-400
                  "
                >
                  Farm activities will appear here
                  as you start working on your farm.
                </p>

              </div>
            )}

          </div>

        </section>


        {/* ==================================================
            ASSISTANT
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
