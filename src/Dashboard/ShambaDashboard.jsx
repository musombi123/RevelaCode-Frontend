import React, { useEffect, useState } from "react";

import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  CloudSun,
  Leaf,
  MapPin,
  Package,
  Sprout,
  Tractor,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";


// =========================================================
// METRIC CARD
// =========================================================

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        dark:border-white/10
        dark:bg-slate-900
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            bg-emerald-50
            text-emerald-700
            dark:bg-emerald-950/30
            dark:text-emerald-400
          "
        >
          <Icon size={20} />
        </div>

        <ArrowUpRight
          size={17}
          className="text-slate-300"
        />
      </div>

      <div className="mt-5">
        <div className="text-2xl font-bold tracking-tight">
          {value}
        </div>

        <div className="mt-1 text-sm font-medium">
          {label}
        </div>

        {helper && (
          <div className="mt-1 text-xs text-slate-400">
            {helper}
          </div>
        )}
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
    getFarmer,
    getFarms,
    getShambaDashboard,
  } = useJumuiyaApi();

  const [dashboard, setDashboard] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [farms, setFarms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  // NORMALIZE POSSIBLE BACKEND SHAPES
  // =======================================================

  const metrics =
    dashboard?.metrics ||
    dashboard?.summary ||
    {};

  const farmerData =
    dashboard?.farmer ||
    farmer ||
    null;

  const dashboardFarms =
    dashboard?.farms ||
    farms ||
    [];

  const totalFarms =
    metrics.farms ??
    dashboardFarms.length ??
    0;

  const totalCrops =
    metrics.crops ??
    0;

  const activeCrops =
    metrics.active_crops ??
    0;

  const activities =
    metrics.activities ??
    metrics.recent_activities ??
    0;

  const harvests =
    metrics.harvests ??
    metrics.completed_harvests ??
    0;

  return (
    <JumuiyaDashboardShell
      title="Shamba"
      subtitle="Manage your farm from one place."
      activeHub="shamba"
      user={user}
      onNavigate={onNavigate}
    >
      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        className="
          overflow-hidden
          rounded-3xl
          bg-slate-950
          px-5
          py-7
          text-white
          shadow-xl
          sm:px-7
          sm:py-8
        "
      >
        <div
          className="
            flex
            flex-col
            gap-6
            lg:flex-row
            lg:items-end
            lg:justify-between
          "
        >
          <div className="max-w-2xl">
            <div
              className="
                mb-3
                inline-flex
                items-center
                gap-2
                rounded-full
                bg-white/10
                px-3
                py-1.5
                text-xs
                font-medium
                text-emerald-200
              "
            >
              <Sprout size={14} />
              Agriculture overview
            </div>

            <h2
              className="
                text-2xl
                font-bold
                tracking-tight
                sm:text-3xl
              "
            >
              {farmerData?.full_name ||
                farmerData?.name ||
                "Your farm dashboard"}
            </h2>

            <p
              className="
                mt-2
                max-w-xl
                text-sm
                leading-6
                text-slate-300
              "
            >
              Keep your farms, crops,
              activities and harvests
              organized in one digital
              workspace.
            </p>

            {farmerData?.county && (
              <div
                className="
                  mt-4
                  inline-flex
                  items-center
                  gap-2
                  text-xs
                  text-slate-400
                "
              >
                <MapPin size={14} />

                {farmerData.county}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              onNavigate?.(
                "shamba/farms"
              )
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-emerald-600
              px-4
              py-3
              text-sm
              font-semibold
              text-white
              hover:bg-emerald-500
            "
          >
            Manage farms

            <ChevronRight size={17} />
          </button>
        </div>
      </section>


      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && (
        <div
          className="
            mt-6
            grid
            gap-4
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="
                h-36
                animate-pulse
                rounded-2xl
                bg-slate-200
                dark:bg-slate-800
              "
            />
          ))}
        </div>
      )}


      {/* =====================================================
          ERROR
      ===================================================== */}

      {!loading && error && (
        <div
          className="
            mt-6
            rounded-2xl
            border
            border-red-200
            bg-red-50
            p-4
            text-sm
            text-red-700
            dark:border-red-900/40
            dark:bg-red-950/20
            dark:text-red-300
          "
        >
          <div className="font-semibold">
            Shamba could not be loaded
          </div>

          <div className="mt-1">
            {error}
          </div>
        </div>
      )}


      {/* =====================================================
          CONTENT
      ===================================================== */}

      {!loading && !error && (
        <>
          {/* Metrics */}

          <section
            className="
              mt-6
              grid
              gap-4
              sm:grid-cols-2
              xl:grid-cols-4
            "
          >
            <MetricCard
              icon={Tractor}
              label="Farms"
              value={totalFarms}
              helper="Registered farms"
            />

            <MetricCard
              icon={Leaf}
              label="Crops"
              value={totalCrops}
              helper="Tracked crops"
            />

            <MetricCard
              icon={Activity}
              label="Activities"
              value={activities}
              helper="Recorded farm activities"
            />

            <MetricCard
              icon={Package}
              label="Harvests"
              value={harvests}
              helper="Recorded harvests"
            />
          </section>


          {/* =================================================
              FARM SNAPSHOT
          ================================================= */}

          <section
            className="
              mt-6
              grid
              gap-4
              lg:grid-cols-[1.4fr_0.6fr]
            "
          >
            <div
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
                dark:border-white/10
                dark:bg-slate-900
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <div>
                  <h3 className="font-semibold">
                    Your farms
                  </h3>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-slate-400
                    "
                  >
                    Farm records connected to
                    your Jumuiya account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onNavigate?.(
                      "shamba/farms"
                    )
                  }
                  className="
                    text-sm
                    font-medium
                    text-emerald-700
                    hover:underline
                    dark:text-emerald-400
                  "
                >
                  View all
                </button>
              </div>

              {dashboardFarms.length === 0 ? (
                <div
                  className="
                    mt-6
                    rounded-2xl
                    border
                    border-dashed
                    border-slate-200
                    p-6
                    text-center
                    dark:border-white/10
                  "
                >
                  <Sprout
                    size={28}
                    className="
                      mx-auto
                      text-emerald-500
                    "
                  />

                  <div
                    className="
                      mt-3
                      font-semibold
                    "
                  >
                    No farms yet
                  </div>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-slate-400
                    "
                  >
                    Add your first farm to
                    start tracking production.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      onNavigate?.(
                        "shamba/farms/new"
                      )
                    }
                    className="
                      mt-4
                      rounded-xl
                      bg-emerald-600
                      px-4
                      py-2.5
                      text-sm
                      font-semibold
                      text-white
                    "
                  >
                    Add farm
                  </button>
                </div>
              ) : (
                <div
                  className="
                    mt-5
                    space-y-2
                  "
                >
                  {dashboardFarms
                    .slice(0, 4)
                    .map((farm) => (
                      <button
                        key={
                          farm.id ||
                          farm._id
                        }
                        type="button"
                        onClick={() =>
                          onNavigate?.(
                            `shamba/farms/${
                              farm.id ||
                              farm._id
                            }`
                          )
                        }
                        className="
                          flex
                          w-full
                          items-center
                          justify-between
                          rounded-xl
                          border
                          border-slate-100
                          px-4
                          py-3
                          text-left
                          transition
                          hover:bg-slate-50
                          dark:border-white/5
                          dark:hover:bg-white/5
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
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              bg-emerald-50
                              text-emerald-700
                              dark:bg-emerald-950/30
                              dark:text-emerald-400
                            "
                          >
                            <Sprout
                              size={17}
                            />
                          </div>

                          <div className="min-w-0">
                            <div
                              className="
                                truncate
                                text-sm
                                font-medium
                              "
                            >
                              {farm.name ||
                                "Unnamed farm"}
                            </div>

                            <div
                              className="
                                mt-0.5
                                text-xs
                                text-slate-400
                              "
                            >
                              {farm.location ||
                                farm.county ||
                                "Location not set"}
                            </div>
                          </div>
                        </div>

                        <ChevronRight
                          size={16}
                          className="shrink-0 text-slate-400"
                        />
                      </button>
                    ))}
                </div>
              )}
            </div>


            {/* Farm status */}

            <div
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
                dark:border-white/10
                dark:bg-slate-900
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  font-semibold
                "
              >
                <BarChart3
                  size={19}
                  className="text-emerald-600"
                />

                Farm status
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      text-sm
                    "
                  >
                    <span>
                      Active crops
                    </span>

                    <span className="font-semibold">
                      {activeCrops}
                    </span>
                  </div>

                  <div
                    className="
                      mt-2
                      h-2
                      overflow-hidden
                      rounded-full
                      bg-slate-100
                      dark:bg-white/10
                    "
                  >
                    <div
                      className="
                        h-full
                        rounded-full
                        bg-emerald-600
                      "
                      style={{
                        width:
                          totalCrops > 0
                            ? `${Math.min(
                                100,
                                (activeCrops /
                                  totalCrops) *
                                  100
                              )}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      text-sm
                    "
                  >
                    <span>
                      Farm activity
                    </span>

                    <Activity
                      size={16}
                      className="text-emerald-600"
                    />
                  </div>

                  <p
                    className="
                      mt-2
                      text-xs
                      leading-5
                      text-slate-400
                    "
                  >
                    Keep planting, irrigation,
                    fertilization and other
                    activities recorded for
                    better farm visibility.
                  </p>
                </div>

                <div>
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      text-sm
                    "
                  >
                    <span>
                      Harvest records
                    </span>

                    <CalendarDays
                      size={16}
                      className="text-emerald-600"
                    />
                  </div>

                  <p
                    className="
                      mt-2
                      text-xs
                      leading-5
                      text-slate-400
                    "
                  >
                    Record harvests so they can
                    later connect to marketplace
                    opportunities.
                  </p>
                </div>
              </div>
            </div>
          </section>


          {/* =================================================
              FARM TOOLS
          ================================================= */}

          <section
            className="
              mt-6
              grid
              gap-4
              sm:grid-cols-2
              xl:grid-cols-4
            "
          >
            {[
              {
                title: "Farms",
                description:
                  "Manage your farm records.",
                icon: Tractor,
                action:
                  "shamba/farms",
              },
              {
                title: "Crops",
                description:
                  "Track crops and seasons.",
                icon: Leaf,
                action:
                  "shamba/crops",
              },
              {
                title: "Activities",
                description:
                  "Record farm operations.",
                icon: Activity,
                action:
                  "shamba/activities",
              },
              {
                title: "Harvests",
                description:
                  "Track production and harvests.",
                icon: Package,
                action:
                  "shamba/harvests",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() =>
                    onNavigate?.(
                      item.action
                    )
                  }
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-5
                    text-left
                    transition
                    hover:-translate-y-0.5
                    hover:shadow-lg
                    dark:border-white/10
                    dark:bg-slate-900
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        bg-emerald-50
                        text-emerald-700
                        dark:bg-emerald-950/30
                        dark:text-emerald-400
                      "
                    >
                      <Icon size={18} />
                    </div>

                    <div>
                      <div className="font-semibold">
                        {item.title}
                      </div>

                      <div
                        className="
                          mt-1
                          text-xs
                          text-slate-400
                        "
                      >
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    size={17}
                    className="text-slate-400"
                  />
                </button>
              );
            })}
          </section>


          {/* =================================================
              ECOSYSTEM CONNECTION
          ================================================= */}

          <section
            className="
              mt-6
              rounded-2xl
              border
              border-emerald-100
              bg-emerald-50
              p-5
              dark:border-emerald-900/40
              dark:bg-emerald-950/20
            "
          >
            <div
              className="
                flex
                flex-col
                gap-4
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div>
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    font-semibold
                    text-emerald-900
                    dark:text-emerald-300
                  "
                >
                  <CloudSun size={18} />

                  Your farm can connect to Jumuiya
                </div>

                <p
                  className="
                    mt-1.5
                    max-w-2xl
                    text-xs
                    leading-5
                    text-slate-600
                    dark:text-slate-400
                  "
                >
                  Future marketplace tools can
                  help connect farm produce with
                  buyers, businesses and schools.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onNavigate?.(
                    "marketplace"
                  )
                }
                className="
                  inline-flex
                  shrink-0
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-emerald-600
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-emerald-700
                "
              >
                Open marketplace

                <ChevronRight size={16} />
              </button>
            </div>
          </section>
        </>
      )}
    </JumuiyaDashboardShell>
  );
}