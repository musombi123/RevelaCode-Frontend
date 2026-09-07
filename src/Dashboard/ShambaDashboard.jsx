import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  CloudSun,
  Droplets,
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
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getUserName(user) {
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
    getUserName(user)
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
    description: "Manage farms",
  },
  {
    key: "shamba/crops",
    label: "Crops",
    icon: Leaf,
    description: "Track crops",
  },
  {
    key: "shamba/market",
    label: "Market",
    icon: TrendingUp,
    description: "View markets",
  },
  {
    key: "marketplace",
    label: "Sell Produce",
    icon: ShoppingCart,
    description: "List produce",
  },
  {
    key: "shamba/inputs",
    label: "Inputs",
    icon: Package,
    description: "Farm inputs",
  },
  {
    key: "shamba/buyers",
    label: "Buyers",
    icon: Users,
    description: "Find buyers",
  },
  {
    key: "shamba/orders",
    label: "Orders",
    icon: WalletCards,
    description: "Track sales",
  },
  {
    key: "shamba/weather",
    label: "Weather",
    icon: CloudSun,
    description: "Farm weather",
  },
];


// =========================================================
// QUICK TILE
// =========================================================

function QuickTile({
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
        min-h-[94px]
        flex-col
        justify-between
        rounded-2xl
        border
        border-slate-100
        bg-white
        p-3
        text-left
        shadow-[0_4px_18px_rgba(15,23,42,0.035)]
        transition
        hover:-translate-y-0.5
        hover:border-emerald-100
        hover:shadow-md
        active:scale-[0.98]
      "
    >
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
        <Icon size={18} />
      </div>

      <div className="mt-2">
        <div className="text-[11px] font-extrabold text-slate-800">
          {item.label}
        </div>

        <div className="mt-0.5 text-[9px] text-slate-400">
          {item.description}
        </div>
      </div>
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
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        rounded-2xl
        border
        border-slate-100
        bg-white
        p-3.5
        text-left
        shadow-[0_4px_18px_rgba(15,23,42,0.035)]
        transition
        hover:border-emerald-100
        active:scale-[0.99]
      "
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </div>

          <div className="mt-1 text-xl font-black text-slate-900">
            {value}
          </div>
        </div>

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
          <Icon size={17} />
        </div>
      </div>
    </button>
  );
}


// =========================================================
// MAIN
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

  const [dashboard, setDashboard] = useState(null);
  const [farms, setFarms] = useState([]);
  const [marketListings, setMarketListings] = useState([]);
  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [marketLoading, setMarketLoading] = useState(true);
  const [error, setError] = useState("");


  // =======================================================
  // LOAD DASHBOARD
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

        setDashboard(dashboardResult || null);

        setFarms(
          Array.isArray(farmsResult)
            ? farmsResult
            : farmsResult?.farms || [],
        );
      } catch (err) {
        if (mounted) {
          setError(
            err?.message ||
              "Unable to load your Shamba dashboard.",
          );
        }
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
  }, [getShambaDashboard, getFarms]);


  // =======================================================
  // LOAD MARKETPLACE
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

        setMarketListings(
          Array.isArray(result)
            ? result
            : result?.listings || [],
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
  }, [getMarketplaceListings]);


  // =======================================================
  // LOAD RECENT FARM ACTIVITY
  // =======================================================

  useEffect(() => {
    let mounted = true;

    async function loadActivities() {
      try {
        const farmList = Array.isArray(farms)
          ? farms.filter(
              (farm) =>
                farm?.status !== "deleted",
            )
          : [];

        if (!farmList.length) {
          if (mounted) {
            setActivities([]);
          }
          return;
        }

        const responses = await Promise.all(
          farmList.slice(0, 5).map(
            async (farm) => {
              try {
                const farmId =
                  farm?.id || farm?._id;

                if (!farmId) return [];

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
            },
          ),
        );

        if (!mounted) return;

        const merged =
          responses.flat();

        merged.sort((a, b) => {
          const da = new Date(
            a?.created_at ||
              a?.updated_at ||
              a?.date ||
              0,
          );

          const db = new Date(
            b?.created_at ||
              b?.updated_at ||
              b?.date ||
              0,
          );

          return db - da;
        });

        setActivities(
          merged.slice(0, 5),
        );
      } catch {
        if (mounted) {
          setActivities([]);
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
  // DATA
  // =======================================================

  const metrics =
    dashboard?.metrics || {};

  const farmer =
    dashboard?.farmer || null;

  const activeFarmCount =
    farms.filter(
      (farm) =>
        farm?.status !== "deleted",
    ).length;

  const firstFarm =
    farms.find(
      (farm) =>
        farm?.status !== "deleted",
    ) || farms[0];


  const locationLabel = [
    firstFarm?.town,
    firstFarm?.county,
  ]
    .filter(Boolean)
    .join(", ") ||
    farmer?.county ||
    "Kenya";


  const visibleMarketListings =
    useMemo(() => {
      return marketListings
        .filter(
          (listing) =>
            listing?.status !== "deleted",
        )
        .slice(0, 3);
    }, [marketListings]);


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <JumuiyaDashboardShell
      title="Shamba Hub"
      subtitle="Grow better. Sell smarter. Feed Africa."
      activeHub="shamba"
      user={user}
      onNavigate={onNavigate}
    >
      <div className="mx-auto w-full max-w-6xl px-1 pb-24">


        {/* ================================================
            TOP HEADER
        ================================================= */}

        <div className="mb-4 flex items-center justify-between">
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
                bg-emerald-100
                text-emerald-700
              "
            >
              <Leaf size={22} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-base font-black text-slate-900">
                Shamba Hub
              </h1>

              <p className="truncate text-[10px] text-slate-400">
                Grow better. Sell smarter. Feed Africa.
              </p>
            </div>
          </div>


          <div
            className="
              flex
              shrink-0
              items-center
              gap-1
              rounded-full
              border
              border-emerald-100
              bg-emerald-50
              px-2.5
              py-1.5
              text-[9px]
              font-bold
              text-emerald-700
            "
          >
            <MapPin size={11} />

            <span className="max-w-[100px] truncate">
              {locationLabel}
            </span>
          </div>
        </div>


        {/* ================================================
            ERROR
        ================================================= */}

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
              text-red-700
            "
          >
            {error}
          </div>
        )}


        {/* ================================================
            MARKET / PRICE CARD
        ================================================= */}

        <section
          className="
            mb-5
            overflow-hidden
            rounded-3xl
            bg-gradient-to-br
            from-orange-400
            via-orange-500
            to-amber-500
            p-5
            text-white
            shadow-lg
          "
        >
          <div className="flex items-start justify-between gap-4">

            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/70">
                Shamba Market
              </div>

              <h2 className="mt-1 text-lg font-black">
                Market prices & opportunities
              </h2>

              <p className="mt-1 max-w-md text-[10px] leading-5 text-white/80">
                Discover what farmers are selling and
                what buyers are looking for.
              </p>
            </div>

            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-white/15
                backdrop-blur
              "
            >
              <TrendingUp size={21} />
            </div>
          </div>


          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">

            {marketLoading ? (
              [1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="
                    h-16
                    animate-pulse
                    rounded-2xl
                    bg-white/15
                  "
                />
              ))
            ) : visibleMarketListings.length > 0 ? (
              visibleMarketListings.map(
                (listing, index) => (
                  <div
                    key={
                      listing?.id ||
                      listing?._id ||
                      index
                    }
                    className="
                      rounded-2xl
                      bg-white/12
                      p-3
                      backdrop-blur-sm
                    "
                  >
                    <div className="truncate text-[9px] font-bold text-white/70">
                      {listing?.category ||
                        "Produce"}
                    </div>

                    <div className="mt-1 truncate text-sm font-black">
                      {listing?.title ||
                        "Produce listing"}
                    </div>

                    <div className="mt-0.5 text-[10px] text-white/75">
                      {listing?.price !==
                      undefined
                        ? money(
                            listing.price,
                          )
                        : "View listing"}
                    </div>
                  </div>
                ),
              )
            ) : (
              <div
                className="
                  col-span-full
                  rounded-2xl
                  bg-white/12
                  p-4
                  text-[10px]
                  text-white/80
                "
              >
                No market listings yet. You can be
                the first farmer to list produce.
              </div>
            )}
          </div>


          <button
            type="button"
            onClick={() =>
              onNavigate?.("marketplace")
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
              font-extrabold
              text-orange-600
              transition
              hover:bg-orange-50
            "
          >
            Open Marketplace
            <ArrowRight size={13} />
          </button>
        </section>


        {/* ================================================
            QUICK ACCESS
        ================================================= */}

        <section className="mb-5">

          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Quick Access
              </h2>

              <p className="mt-0.5 text-[9px] text-slate-400">
                Everything you need to manage your farm.
              </p>
            </div>
          </div>


          <div className="grid grid-cols-4 gap-2">
            {QUICK_ACCESS.map((item) => (
              <QuickTile
                key={item.key}
                item={item}
                onNavigate={onNavigate}
              />
            ))}
          </div>

        </section>


        {/* ================================================
            FARM OVERVIEW
        ================================================= */}

        <section className="mb-5">

          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">
                My Farm Overview
              </h2>

              <p className="mt-0.5 text-[9px] text-slate-400">
                A quick look at your current farm activity.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate?.("shamba/farms")
              }
              className="
                text-[10px]
                font-bold
                text-emerald-600
                hover:text-emerald-700
              "
            >
              View farms
            </button>
          </div>


          {loading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="
                    h-20
                    animate-pulse
                    rounded-2xl
                    bg-slate-100
                  "
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

              <MetricCard
                label="My Farms"
                value={activeFarmCount}
                icon={Tractor}
                onClick={() =>
                  onNavigate?.("shamba/farms")
                }
              />

              <MetricCard
                label="Active Crops"
                value={
                  metrics?.active_crops || 0
                }
                icon={Leaf}
                onClick={() =>
                  onNavigate?.("shamba/crops")
                }
              />

              <MetricCard
                label="Harvests"
                value={
                  metrics?.harvests || 0
                }
                icon={Wheat}
                onClick={() =>
                  onNavigate?.("shamba/harvests")
                }
              />

              <MetricCard
                label="Activities"
                value={
                  metrics?.farm_activities || 0
                }
                icon={Activity}
                onClick={() =>
                  onNavigate?.("shamba/activities")
                }
              />

            </div>
          )}

        </section>


        {/* ================================================
            FARM PROFILE
        ================================================= */}

        <section className="mb-5">

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
            <div className="flex items-center gap-3">

              <div
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-emerald-50
                  text-emerald-600
                "
              >
                <Tractor size={21} />
              </div>

              <div className="min-w-0 flex-1">

                <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                  Farmer Profile
                </div>

                <div className="mt-1 truncate text-sm font-black text-slate-900">
                  {getFarmerName(
                    farmer,
                    user,
                  )}
                </div>

                <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-400">
                  <MapPin size={10} />
                  <span className="truncate">
                    {locationLabel}
                  </span>
                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  onNavigate?.("shamba/farms")
                }
                className="
                  rounded-xl
                  bg-emerald-50
                  px-3
                  py-2
                  text-[9px]
                  font-bold
                  text-emerald-700
                "
              >
                Manage
              </button>

            </div>
          </div>

        </section>


        {/* ================================================
            RECENT ACTIVITY
        ================================================= */}

        <section className="mb-5">

          <div className="mb-3">
            <h2 className="text-sm font-black text-slate-900">
              Recent Activity
            </h2>

            <p className="mt-0.5 text-[9px] text-slate-400">
              Your latest farm activity.
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

            {activities.length > 0 ? (
              activities.map(
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
                      border-b
                      border-slate-50
                      px-4
                      py-3
                      last:border-b-0
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
                      <div className="truncate text-[10px] font-bold text-slate-800">
                        {activity?.activity_type ||
                          activity?.type ||
                          activity?.name ||
                          "Farm activity"}
                      </div>

                      <div className="mt-0.5 truncate text-[9px] text-slate-400">
                        {activity?.description ||
                          activity?.notes ||
                          "Recent farm activity"}
                      </div>
                    </div>

                    {activity?.cost !==
                      undefined && (
                      <div className="text-[9px] font-bold text-slate-500">
                        {money(
                          activity.cost,
                        )}
                      </div>
                    )}
                  </div>
                ),
              )
            ) : (
              <div className="px-4 py-7 text-center">

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

                <div className="mt-2 text-[10px] font-bold text-slate-700">
                  No recent activity
                </div>

                <p className="mt-1 text-[9px] text-slate-400">
                  Start recording your farm activities
                  to see them here.
                </p>

              </div>
            )}

          </div>
        </section>


        {/* ================================================
            FLOATING ASSISTANT
        ================================================= */}

        <button
          type="button"
          onClick={() =>
            onNavigate?.("assistant")
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
            shadow-[0_10px_30px_rgba(5,150,105,0.3)]
            transition
            hover:scale-105
            hover:bg-emerald-700
            active:scale-95
          "
        >
          <Bot size={23} />
        </button>


      </div>
    </JumuiyaDashboardShell>
  );
}
