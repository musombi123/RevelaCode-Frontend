// src/Dashboard/ShambaWeatherDashboard.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudSun,
  Droplets,
  MapPin,
  RefreshCw,
  Sun,
  ThermometerSun,
  Tractor,
  Umbrella,
  Wind,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";


// =========================================================
// HELPERS
// =========================================================

function getFarmId(farm) {
  return farm?.id || farm?._id || "";
}

function getFarmLocation(farm) {
  return (
    farm?.location ||
    [farm?.town, farm?.county]
      .filter(Boolean)
      .join(", ") ||
    farm?.county ||
    "Location not set"
  );
}

function getFarmName(farm) {
  return (
    farm?.name ||
    "Unnamed Farm"
  );
}


// =========================================================
// WEATHER ICON
// =========================================================

function WeatherIcon({
  size = 28,
}) {
  return (
    <CloudSun
      size={size}
    />
  );
}


// =========================================================
// INFO CARD
// =========================================================

function WeatherMetric({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div
      className="
        rounded-2xl
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
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-sky-50
            text-sky-600
          "
        >
          <Icon size={18} />
        </div>

        <div className="min-w-0">

          <div
            className="
              text-[8px]
              font-black
              uppercase
              tracking-wide
              text-slate-400
            "
          >
            {label}
          </div>

          <div
            className="
              mt-1
              text-sm
              font-black
              text-slate-800
            "
          >
            {value}
          </div>

          {description && (
            <div
              className="
                mt-0.5
                text-[9px]
                text-slate-400
              "
            >
              {description}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}


// =========================================================
// MAIN
// =========================================================

export default function ShambaWeatherDashboard({
  onNavigate,
}) {
  const { user } = useAuth();

  const {
    getFarms,
  } = useJumuiyaApi();

  const [farms, setFarms] =
    useState([]);

  const [selectedFarmId, setSelectedFarmId] =
    useState("");

  const [selectedFarm, setSelectedFarm] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =======================================================
  // LOAD FARMS
  // =======================================================

  const loadFarms =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const result =
            await getFarms();

          const list =
            Array.isArray(result)
              ? result
              : result?.farms || [];

          const active =
            list.filter(
              (farm) =>
                farm?.status !==
                "deleted",
            );

          setFarms(active);

          if (
            !selectedFarmId &&
            active.length
          ) {
            const first =
              active[0];

            setSelectedFarmId(
              getFarmId(first),
            );

            setSelectedFarm(
              first,
            );
          }
        } catch (err) {
          setError(
            err?.message ||
              "Unable to load your farm locations.",
          );
        } finally {
          setLoading(false);
        }
      },
      [
        getFarms,
        selectedFarmId,
      ],
    );


  useEffect(() => {
    loadFarms();
  }, [loadFarms]);


  // =======================================================
  // SELECT FARM
  // =======================================================

  useEffect(() => {
    if (!selectedFarmId) {
      setSelectedFarm(null);
      return;
    }

    const farm =
      farms.find(
        (item) =>
          String(
            getFarmId(item),
          ) ===
          String(
            selectedFarmId,
          ),
      ) || null;

    setSelectedFarm(farm);
  }, [
    farms,
    selectedFarmId,
  ]);


  // =======================================================
  // LOCATION
  // =======================================================

  const location =
    useMemo(
      () =>
        selectedFarm
          ? getFarmLocation(
              selectedFarm,
            )
          : "No farm selected",
      [selectedFarm],
    );


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <JumuiyaDashboardShell
      title="Weather"
      subtitle="Plan your farm around the weather."
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

        <div
          className="
            mb-4
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >

          <button
            type="button"
            onClick={() =>
              onNavigate?.(
                "shamba",
              )
            }
            className="
              inline-flex
              w-fit
              items-center
              gap-1.5
              text-[10px]
              font-black
              text-slate-500
              transition
              hover:text-emerald-600
            "
          >
            <ArrowLeft size={14} />
            Back to Shamba
          </button>


          <button
            type="button"
            onClick={loadFarms}
            disabled={loading}
            className="
              inline-flex
              items-center
              justify-center
              gap-1.5
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-2.5
              text-[10px]
              font-black
              text-slate-600
              shadow-sm
              transition
              hover:border-emerald-100
              hover:text-emerald-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <RefreshCw
              size={14}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>

        </div>


        {/* ==================================================
            INTRO
        ================================================== */}

        <section
          className="
            mb-5
            overflow-hidden
            rounded-3xl
            bg-gradient-to-br
            from-sky-500
            via-cyan-500
            to-blue-600
            p-5
            text-white
            shadow-lg
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
                  text-[8px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-white/70
                "
              >
                Shamba Weather
              </div>

              <h1
                className="
                  mt-1
                  text-xl
                  font-black
                  tracking-tight
                "
              >
                Plan before you plant.
              </h1>

              <p
                className="
                  mt-1
                  max-w-xl
                  text-[10px]
                  leading-5
                  text-white/80
                "
              >
                Weather planning will help you
                choose better planting, irrigation
                and harvesting times.
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
              <WeatherIcon size={22} />
            </div>

          </div>


          {/* LOCATION */}

          <div
            className="
              mt-4
              flex
              items-center
              gap-2
              rounded-2xl
              bg-white/10
              px-3
              py-3
              backdrop-blur-sm
            "
          >

            <MapPin size={14} />

            <div className="min-w-0">

              <div
                className="
                  text-[8px]
                  font-bold
                  uppercase
                  tracking-wide
                  text-white/60
                "
              >
                Farm location
              </div>

              <div
                className="
                  mt-0.5
                  truncate
                  text-[10px]
                  font-black
                "
              >
                {location}
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
              rounded-2xl
              border
              border-red-100
              bg-red-50
              px-4
              py-3
              text-[10px]
              leading-5
              text-red-700
            "
          >
            {error}
          </div>
        )}


        {/* ==================================================
            FARM SELECTOR
        ================================================== */}

        <section
          className="
            mb-5
            rounded-2xl
            border
            border-slate-100
            bg-white
            p-4
            shadow-[0_4px_18px_rgba(15,23,42,0.035)]
          "
        >

          <div
            className="
              flex
              items-start
              gap-3
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
                bg-emerald-50
                text-emerald-600
              "
            >
              <Tractor size={17} />
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
                Weather location
              </div>

              {loading ? (
                <div
                  className="
                    mt-2
                    h-10
                    w-full
                    animate-pulse
                    rounded-xl
                    bg-slate-100
                  "
                />
              ) : farms.length > 0 ? (
                <>
                  <select
                    value={
                      selectedFarmId
                    }
                    onChange={(event) =>
                      setSelectedFarmId(
                        event.target.value,
                      )
                    }
                    className="
                      mt-1
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-3
                      py-2.5
                      text-sm
                      font-bold
                      text-slate-800
                      outline-none
                      focus:border-emerald-500
                      focus:ring-2
                      focus:ring-emerald-100
                    "
                  >
                    {farms.map(
                      (farm) => (
                        <option
                          key={
                            getFarmId(
                              farm,
                            )
                          }
                          value={
                            getFarmId(
                              farm,
                            )
                          }
                        >
                          {getFarmName(
                            farm,
                          )}
                        </option>
                      ),
                    )}
                  </select>

                  <div
                    className="
                      mt-2
                      flex
                      items-center
                      gap-1
                      text-[9px]
                      text-slate-400
                    "
                  >
                    <MapPin size={10} />

                    <span className="truncate">
                      {location}
                    </span>
                  </div>
                </>
              ) : (
                <div className="mt-1">

                  <div
                    className="
                      text-xs
                      font-bold
                      text-slate-700
                    "
                  >
                    No farm available
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onNavigate?.(
                        "shamba/farms",
                      )
                    }
                    className="
                      mt-2
                      text-[9px]
                      font-black
                      text-emerald-600
                    "
                  >
                    Add a farm first →
                  </button>

                </div>
              )}

            </div>

          </div>

        </section>


        {/* ==================================================
            CURRENT WEATHER PLACEHOLDER
        ================================================== */}

        <section
          className="
            mb-5
            overflow-hidden
            rounded-3xl
            border
            border-slate-100
            bg-white
            shadow-[0_4px_18px_rgba(15,23,42,0.04)]
          "
        >

          <div
            className="
              bg-gradient-to-br
              from-slate-50
              via-white
              to-sky-50
              p-5
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                gap-4
              "
            >

              <div>

                <div
                  className="
                    text-[8px]
                    font-black
                    uppercase
                    tracking-[0.16em]
                    text-slate-400
                  "
                >
                  Current Conditions
                </div>

                <div
                  className="
                    mt-2
                    flex
                    items-center
                    gap-3
                  "
                >

                  <div
                    className="
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-2xl
                      bg-sky-100
                      text-sky-600
                    "
                  >
                    <CloudSun size={30} />
                  </div>

                  <div>

                    <div
                      className="
                        text-2xl
                        font-black
                        text-slate-900
                      "
                    >
                      —
                    </div>

                    <div
                      className="
                        text-[10px]
                        font-bold
                        text-slate-500
                      "
                    >
                      Live weather unavailable
                    </div>

                  </div>

                </div>

              </div>


              <div
                className="
                  hidden
                  rounded-xl
                  bg-slate-100
                  px-3
                  py-2
                  text-right
                  sm:block
                "
              >
                <div
                  className="
                    text-[8px]
                    font-black
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  Location
                </div>

                <div
                  className="
                    mt-1
                    max-w-[150px]
                    truncate
                    text-[9px]
                    font-bold
                    text-slate-600
                  "
                >
                  {location}
                </div>
              </div>

            </div>


            <div
              className="
                mt-5
                rounded-2xl
                border
                border-amber-100
                bg-amber-50/70
                p-4
              "
            >

              <div
                className="
                  text-[9px]
                  font-black
                  text-amber-800
                "
              >
                Live weather integration
              </div>

              <p
                className="
                  mt-1
                  text-[9px]
                  leading-5
                  text-amber-700/80
                "
              >
                This dashboard is ready for live
                weather data. A weather provider/API
                still needs to be connected before
                temperature, rainfall, wind and
                forecasts can be shown here.
              </p>

            </div>

          </div>

        </section>


        {/* ==================================================
            WEATHER PLANNING METRICS
        ================================================== */}

        <section className="mb-5">

          <div className="mb-3">

            <h2
              className="
                text-sm
                font-black
                text-slate-900
              "
            >
              Farm Conditions
            </h2>

            <p
              className="
                mt-0.5
                text-[9px]
                text-slate-400
              "
            >
              Live environmental readings will
              appear here when connected.
            </p>

          </div>


          <div
            className="
              grid
              grid-cols-2
              gap-2
              sm:grid-cols-4
            "
          >

            <WeatherMetric
              icon={ThermometerSun}
              label="Temperature"
              value="—"
              description="Not connected"
            />

            <WeatherMetric
              icon={Droplets}
              label="Humidity"
              value="—"
              description="Not connected"
            />

            <WeatherMetric
              icon={Umbrella}
              label="Rainfall"
              value="—"
              description="Not connected"
            />

            <WeatherMetric
              icon={Wind}
              label="Wind"
              value="—"
              description="Not connected"
            />

          </div>

        </section>


        {/* ==================================================
            FARM PLANNING
        ================================================== */}

        <section className="mb-5">

          <div className="mb-3">

            <h2
              className="
                text-sm
                font-black
                text-slate-900
              "
            >
              Weather Planning
            </h2>

            <p
              className="
                mt-0.5
                text-[9px]
                text-slate-400
              "
            >
              Weather intelligence will eventually
              support these farming decisions.
            </p>

          </div>


          <div
            className="
              grid
              grid-cols-1
              gap-3
              sm:grid-cols-3
            "
          >

            <div
              className="
                rounded-2xl
                border
                border-slate-100
                bg-white
                p-4
                shadow-[0_4px_18px_rgba(15,23,42,0.035)]
              "
            >
              <Sun
                size={19}
                className="text-amber-500"
              />

              <h3
                className="
                  mt-3
                  text-[11px]
                  font-black
                  text-slate-800
                "
              >
                Planting
              </h3>

              <p
                className="
                  mt-1
                  text-[9px]
                  leading-5
                  text-slate-400
                "
              >
                Planting recommendations will use
                upcoming rainfall and temperature.
              </p>
            </div>


            <div
              className="
                rounded-2xl
                border
                border-slate-100
                bg-white
                p-4
                shadow-[0_4px_18px_rgba(15,23,42,0.035)]
              "
            >
              <CloudRain
                size={19}
                className="text-sky-500"
              />

              <h3
                className="
                  mt-3
                  text-[11px]
                  font-black
                  text-slate-800
                "
              >
                Irrigation
              </h3>

              <p
                className="
                  mt-1
                  text-[9px]
                  leading-5
                  text-slate-400
                "
              >
                Rain forecasts can help reduce
                unnecessary irrigation.
              </p>
            </div>


            <div
              className="
                rounded-2xl
                border
                border-slate-100
                bg-white
                p-4
                shadow-[0_4px_18px_rgba(15,23,42,0.035)]
              "
            >
              <CloudDrizzle
                size={19}
                className="text-indigo-500"
              />

              <h3
                className="
                  mt-3
                  text-[11px]
                  font-black
                  text-slate-800
                "
              >
                Harvest
              </h3>

              <p
                className="
                  mt-1
                  text-[9px]
                  leading-5
                  text-slate-400
                "
              >
                Forecast conditions can help plan
                harvesting and drying.
              </p>
            </div>

          </div>

        </section>


        {/* ==================================================
            STATUS
        ================================================== */}

        <div
          className="
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-slate-100
            bg-slate-50
            px-4
            py-3
          "
        >

          <Cloud
            size={15}
            className="
              mt-0.5
              shrink-0
              text-slate-400
            "
          />

          <p
            className="
              text-[9px]
              leading-5
              text-slate-500
            "
          >
            Select a farm above to prepare its
            location for weather intelligence.
          </p>

        </div>

      </div>
    </JumuiyaDashboardShell>
  );
}
