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
import ShambaDashboardFrame from "@/Dashboard/ShambaDashboardFrame.jsx";


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
        border-[#DCE5E1]
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
              text-[13px]
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
                text-[13px]
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
  embedded = false,
}) {
  const { user } = useAuth();

  const {
    getFarms,
    getFarmWeather,
    updateFarmLocation,
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

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");


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


  const loadWeather = useCallback(async (forceRefresh = false, farmId = selectedFarmId) => {
    if (!farmId) {
      setWeather(null);
      setWeatherError("");
      return;
    }

    try {
      setWeatherLoading(true);
      setWeatherError("");
      const result = await getFarmWeather(farmId, { refresh: forceRefresh });
      setWeather(result?.weather || result || null);
    } catch (err) {
      setWeather(null);
      setWeatherError(
        err?.message || "Live weather is temporarily unavailable. Please try again.",
      );
    } finally {
      setWeatherLoading(false);
    }
  }, [getFarmWeather, selectedFarmId]);

  useEffect(() => {
    if (selectedFarmId) loadWeather(false, selectedFarmId);
    else setWeather(null);
  }, [selectedFarmId, loadWeather]);

  const shareDeviceLocation = useCallback(() => {
    if (!selectedFarmId) {
      setLocationMessage("Select a farm before saving its location.");
      return;
    }
    if (!navigator.geolocation) {
      setLocationMessage("This device does not support location sharing. You can still use the farm's saved town or county.");
      return;
    }

    setLocationSaving(true);
    setLocationMessage("");
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        await updateFarmLocation(selectedFarmId, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: "browser_gps",
          county: selectedFarm?.county || "",
          town: selectedFarm?.town || "",
          location: selectedFarm?.location || "",
        });
        setLocationMessage("Farm GPS location saved. Refreshing local weather…");
        await loadFarms();
        await loadWeather(true, selectedFarmId);
      } catch (err) {
        setLocationMessage(err?.message || "Could not save this farm's location.");
      } finally {
        setLocationSaving(false);
      }
    }, (geoError) => {
      setLocationSaving(false);
      const message = geoError?.code === 1
        ? "Location permission was denied. You can continue using the saved town or county."
        : "Device location could not be read. You can continue using the saved town or county.";
      setLocationMessage(message);
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }, [loadFarms, loadWeather, selectedFarm, selectedFarmId, updateFarmLocation]);

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
    <ShambaDashboardFrame
      embedded={embedded}
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
          max-w-none
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
              text-[13px]
              font-black
              text-slate-500
              transition
              hover:text-[#087F5B]
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
              border-[#DCE5E1]
              bg-white
              px-4
              py-2.5
              text-[13px]
              font-black
              text-slate-600
              shadow-sm
              transition
              hover:border-emerald-100
              hover:text-[#075E46]
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
            rounded-2xl
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
                  text-[13px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-white/70
                "
              >
                Shamba Weather
              </div>

              <h1
                className="mt-1 font-black tracking-tight text-[clamp(26px,2.3vw,30px)] leading-tight tracking-tight text-[#172B25]"
              >
                Plan before you plant.
              </h1>

              <p
                className="
                  mt-1
                  max-w-xl
                  text-[13px]
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
                  text-[13px]
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
                  text-[13px]
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
              text-[13px]
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
            border-[#DCE5E1]
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
                text-[#087F5B]
              "
            >
              <Tractor size={17} />
            </div>

            <div className="min-w-0 flex-1">

              <div
                className="
                  text-[13px]
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
                      border-[#DCE5E1]
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
                      text-[13px]
                      text-slate-400
                    "
                  >
                    <MapPin size={10} />

                    <span className="truncate">
                      {location}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={shareDeviceLocation} disabled={locationSaving} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 disabled:opacity-50">
                      {locationSaving ? "Saving location…" : "Use device location"}
                    </button>
                    <button type="button" onClick={() => loadWeather(true)} disabled={weatherLoading || !selectedFarmId} className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-black text-sky-800 disabled:opacity-50">
                      {weatherLoading ? "Refreshing…" : "Refresh weather"}
                    </button>
                  </div>
                  {locationMessage && <p className="mt-2 text-xs leading-5 text-slate-500">{locationMessage}</p>}
                </>
              ) : (
                <div className="mt-1">

                  <div
                    className="
                      text-[13px]
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
                      text-[13px]
                      font-black
                      text-[#087F5B]
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
            rounded-2xl
            border
            border-[#DCE5E1]
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
                    text-[13px]
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

                    <div className="text-2xl font-black text-slate-900">
                      {weatherLoading ? "Loading…" : weather?.current?.temperature_c != null ? `${Math.round(weather.current.temperature_c)}°C` : "—"}
                    </div>

                    <div className="text-[13px] font-bold text-slate-600">
                      {weatherLoading ? "Fetching live conditions…" : weather?.current?.condition || "Live weather unavailable"}
                    </div>
                    {weather?.current?.time && (
                      <div className="mt-1 text-xs text-slate-400">
                        Updated {new Date(weather.current.time).toLocaleString()}
                      </div>
                    )}

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
                    text-[13px]
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
                    text-[13px]
                    font-bold
                    text-slate-600
                  "
                >
                  {location}
                </div>
              </div>

            </div>


            {weatherError && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <div className="font-black">Weather update unavailable</div>
                <p className="mt-1">{weatherError}</p>
                <button type="button" onClick={() => loadWeather(true)} className="mt-3 rounded-lg bg-amber-100 px-3 py-2 font-bold hover:bg-amber-200">
                  Try again
                </button>
              </div>
            )}
            {weather && (
              <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-sm text-sky-900">
                <div className="font-black">Live weather connected · {weather.provider || "Weather provider"}</div>
                <p className="mt-1">Current conditions and a seven-day forecast are available for {weather.location?.label || location}. Forecasts are guidance, not a guarantee of rainfall at the farm.</p>
                <p className="mt-1 text-xs text-sky-700">Source: <a className="underline" href={weather.provider_url || "https://open-meteo.com/"} target="_blank" rel="noreferrer">Open-Meteo</a>{weather.cached ? " · Cached for up to 10 minutes" : ""}</p>
              </div>
            )}

          </div>

        </section>


        {/* ==================================================
            WEATHER PLANNING METRICS
        ================================================== */}

        <section className="mb-5">

          <div className="mb-3">

            <h2
              className="font-black text-slate-900 text-xl leading-snug tracking-tight text-[#172B25]"
            >
              Farm Conditions
            </h2>

            <p
              className="
                mt-0.5
                text-[13px]
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
              value={weather?.current?.temperature_c != null ? `${weather.current.temperature_c} °C` : "—"}
              description={weather?.current?.feels_like_c != null ? `Feels like ${weather.current.feels_like_c} °C` : weatherLoading ? "Loading live data" : "Live reading"}
            />

            <WeatherMetric
              icon={Droplets}
              label="Humidity"
              value={weather?.current?.humidity_percent != null ? `${weather.current.humidity_percent}%` : "—"}
              description="Relative humidity"
            />

            <WeatherMetric
              icon={Umbrella}
              label="Rainfall"
              value={weather?.current?.precipitation_mm != null ? `${weather.current.precipitation_mm} mm` : "—"}
              description={weather?.current?.rain_mm != null ? `Rain ${weather.current.rain_mm} mm` : "Current precipitation"}
            />

            <WeatherMetric
              icon={Wind}
              label="Wind"
              value={weather?.current?.wind_speed_kmh != null ? `${weather.current.wind_speed_kmh} km/h` : "—"}
              description={weather?.current?.wind_direction_degrees != null ? `Direction ${weather.current.wind_direction_degrees}°` : "Wind speed"}
            />

          </div>

        </section>


        {/* ==================================================
            FARM PLANNING
        ================================================== */}

        <section className="mb-5">

          <div className="mb-3">

            <h2
              className="font-black text-slate-900 text-xl leading-snug tracking-tight text-[#172B25]"
            >
              Weather Planning
            </h2>

            <p className="mt-0.5 text-[13px] text-slate-400">
              {weather?.daily?.length ? "Use the local forecast to plan field work. Check conditions again before spraying, irrigating or harvesting." : "A seven-day outlook will appear here when weather is available for the selected farm."}
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
                border-[#DCE5E1]
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
                className="mt-3 font-black text-slate-800 text-base leading-snug text-[#172B25]"
              >
                Planting
              </h3>

              <p
                className="
                  mt-1
                  text-[13px]
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
                border-[#DCE5E1]
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
                className="mt-3 font-black text-slate-800 text-base leading-snug text-[#172B25]"
              >
                Irrigation
              </h3>

              <p
                className="
                  mt-1
                  text-[13px]
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
                border-[#DCE5E1]
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
                className="mt-3 font-black text-slate-800 text-base leading-snug text-[#172B25]"
              >
                Harvest
              </h3>

              <p
                className="
                  mt-1
                  text-[13px]
                  leading-5
                  text-slate-400
                "
              >
                Forecast conditions can help plan
                harvesting and drying.
              </p>
            </div>

          </div>

          {weather?.daily?.length > 0 && (
            <div className="mt-4 rounded-2xl border border-[#DCE5E1] bg-white p-4">
              <h3 className="font-black text-slate-800">7-day forecast</h3>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {weather.daily.slice(0, 7).map((day) => (
                  <div key={day.date} className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs font-black text-slate-500">{new Date(day.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
                    <div className="mt-1 text-sm font-black text-slate-800">{day.condition}</div>
                    <div className="mt-1 text-sm text-slate-700">{day.temperature_min_c != null ? Math.round(day.temperature_min_c) : "—"}° / {day.temperature_max_c != null ? Math.round(day.temperature_max_c) : "—"}°C</div>
                    <div className="mt-1 text-xs text-sky-700">Rain: {day.rain_probability_percent != null ? day.rain_probability_percent + "%" : "—"} · {day.rainfall_mm != null ? day.rainfall_mm + " mm" : "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            border-[#DCE5E1]
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
              text-[13px]
              leading-5
              text-slate-500
            "
          >
            Select a farm above to prepare its
            location for weather intelligence.
          </p>

        </div>

      </div>
    </ShambaDashboardFrame>
  );
}
