import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
} from "@/components/ui/Card";

import {
  Loader2,
  RefreshCw,
  MapPin,
  Tags,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock3,
  Database,
  Sparkles,
  Globe2,
  AlertCircle,
} from "lucide-react";

/* =========================================================
   Configuration
========================================================= */

const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_REVELACODE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "";

const ITEMS_PER_PAGE = 8;

const CACHE_KEY =
  "revelacode_prophecy_events";

const CACHE_VERSION = 2;

/*
 * Cached events remain available for a long time.
 * A fresh API request is still attempted whenever the
 * dashboard is opened/refreshed.
 */
const CACHE_MAX_AGE =
  1000 * 60 * 60 * 24;

/* =========================================================
   Category labels
========================================================= */

const CATEGORY_LABELS = {
  wars_conflicts:
    "Wars & Conflicts",

  natural_disasters:
    "Natural Disasters",

  economic:
    "Economic Signs",

  crime:
    "Crime & Lawlessness",

  politics:
    "Political Upheaval",

  health:
    "Health Crises",

  social_morality:
    "Moral Decay",

  false_peace:
    "False Peace",

  surveillance:
    "Surveillance",

  general:
    "General",

  technology_and_image_of_the_beast:
    "Technology & Image of the Beast",
};

/* =========================================================
   Utility functions
========================================================= */

function cleanText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(value) {
  const url = cleanText(value);

  if (!url) {
    return "";
  }

  try {
    const parsed =
      new URL(url);

    if (
      parsed.protocol !== "http:" &&
      parsed.protocol !== "https:"
    ) {
      return "";
    }

    return parsed.href;
  } catch {
    /*
     * Some feeds occasionally return a URL without
     * a protocol.
     */
    try {
      const parsed =
        new URL(`https://${url}`);

      return parsed.href;
    } catch {
      return "";
    }
  }
}

function getEventKey(event, index = 0) {
  return (
    event?.id ||
    event?._id ||
    event?.url ||
    `${event?.headline || "event"}-${event?.publishedAt || index}`
  );
}

function normalizeEvent(event) {
  if (!event || typeof event !== "object") {
    return null;
  }

  const normalized = {
    ...event,

    headline:
      cleanText(
        event.headline ||
          event.title ||
          event.name
      ) ||
      "Untitled Event",

    description:
      cleanText(
        event.description ||
          event.content ||
          event.summary ||
          event.excerpt
      ),

    url:
      normalizeUrl(
        event.url ||
          event.link ||
          event.sourceUrl
      ),

    source:
      cleanText(
        event.source ||
          event.source_name ||
          event.publisher
      ),

    publishedAt:
      event.publishedAt ||
      event.published_at ||
      event.date ||
      null,

    urlToImage:
      normalizeUrl(
        event.urlToImage ||
          event.image ||
          event.imageUrl ||
          event.url_to_image
      ),

    media_type:
      event.media_type ||
      event.mediaType ||
      "article",

    matched_symbols:
      Array.isArray(
        event.matched_symbols
      )
        ? event.matched_symbols
        : [],

    matched_verses:
      Array.isArray(
        event.matched_verses
      )
        ? event.matched_verses
        : [],

    location:
      event.location &&
      typeof event.location ===
        "object"
        ? event.location
        : {},
  };

  return normalized;
}

function normalizeEvents(data) {
  const raw =
    Array.isArray(data?.events)
      ? data.events
      : Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
      ? data.data
      : [];

  const seen = new Set();

  return raw
    .map(normalizeEvent)
    .filter(Boolean)
    .filter((event, index) => {
      const key = getEventKey(
        event,
        index
      );

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    })
    .sort(
      (a, b) =>
        new Date(
          b?.publishedAt || 0
        ) -
        new Date(
          a?.publishedAt || 0
        )
    );
}

/* =========================================================
   Cache helpers
========================================================= */

function readCachedEvents() {
  try {
    const raw =
      localStorage.getItem(
        CACHE_KEY
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !==
        "object"
    ) {
      return null;
    }

    if (
      parsed.version !==
      CACHE_VERSION
    ) {
      return null;
    }

    if (
      !Array.isArray(
        parsed.events
      )
    ) {
      return null;
    }

    const age =
      Date.now() -
      Number(
        parsed.savedAt || 0
      );

    return {
      events:
        normalizeEvents(
          parsed.events
        ),
      savedAt:
        Number(
          parsed.savedAt || 0
        ),
      expired:
        age > CACHE_MAX_AGE,
    };
  } catch (error) {
    console.warn(
      "Unable to read cached prophecy events:",
      error
    );

    return null;
  }
}

function saveCachedEvents(events) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        version:
          CACHE_VERSION,
        savedAt:
          Date.now(),
        events,
      })
    );
  } catch (error) {
    /*
     * localStorage can fail because of quota,
     * privacy mode, or browser restrictions.
     *
     * The application should continue working
     * even if caching fails.
     */
    console.warn(
      "Unable to cache prophecy events:",
      error
    );
  }
}

/* =========================================================
   Date formatting
========================================================= */

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

function formatCacheTime(value) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleTimeString(
    undefined,
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

/* =========================================================
   Explanatory summary
========================================================= */

function buildExplanatorySummary(
  event
) {
  /*
   * If the backend already provides an AI/generated
   * explanation, use it.
   */
  const backendSummary =
    cleanText(
      event?.explanation ||
        event?.ai_summary ||
        event?.aiSummary ||
        event?.summary
    );

  if (backendSummary) {
    return backendSummary;
  }

  const headline =
    cleanText(
      event?.headline
    );

  const description =
    cleanText(
      event?.description
    );

  const country =
    cleanText(
      event?.location?.country
    );

  const categories =
    Array.isArray(
      event?.matched_symbols
    )
      ? event.matched_symbols
          .map(
            (item) =>
              CATEGORY_LABELS[
                item
              ] || item
          )
          .filter(Boolean)
      : [];

  const categoryText =
    categories.length > 0
      ? categories
          .slice(0, 2)
          .join(" and ")
      : "a current world event";

  /*
   * We deliberately describe the event rather than
   * claiming that the news item "proves" prophecy.
   */
  if (
    description &&
    description.length >= 80
  ) {
    const shortened =
      description.length > 360
        ? `${description.slice(
            0,
            357
          )}...`
        : description;

    return `${shortened} ${
      country
        ? `The report concerns ${country}. `
        : ""
    }In the Prophecy Explorer, this event is being grouped under ${categoryText}. This is an explanatory mapping for study and context, not proof that the event itself fulfills a prophecy.`;
  }

  if (headline) {
    return `This report concerns ${headline}${
      country
        ? ` in ${country}`
        : ""
    }. RevelaCode has associated it with ${categoryText} to help you understand the possible prophetic context. The association should be studied alongside the biblical text and historical evidence rather than treated as automatic proof of fulfillment.`;
  }

  return `This event has been classified under ${categoryText}. Open the original source to read the complete report and compare the event with the relevant biblical passages and historical context.`;
}

/* =========================================================
   Main component
========================================================= */

export default function ProphecyEventsDashboard() {
  const navigate =
    useNavigate();

  const [
    events,
    setEvents,
  ] = useState([]);

  const [
    location,
    setLocation,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    expanded,
    setExpanded,
  ] = useState({});

  const [
    cachedAt,
    setCachedAt,
  ] = useState(null);

  const [
    usingCachedData,
    setUsingCachedData,
  ] = useState(false);

  /* =======================================================
     Toggle explanation
  ======================================================= */

  const toggleExpand =
    useCallback(
      (key) => {
        setExpanded(
          (previous) => ({
            ...previous,
            [key]:
              !previous[key],
          })
        );
      },
      []
    );

  /* =======================================================
     Open external source
  ======================================================= */

  const openSource =
    useCallback((url) => {
      const safeUrl =
        normalizeUrl(url);

      if (!safeUrl) {
        return;
      }

      /*
       * Explicitly open every source in a new tab.
       *
       * This is intentionally done from a user click,
       * which is the safest browser-compatible behavior.
       */
      const newWindow =
        window.open(
          safeUrl,
          "_blank",
          "noopener,noreferrer"
        );

      /*
       * Some browsers may block window.open.
       * Fallback to normal navigation.
       */
      if (!newWindow) {
        window.location.href =
          safeUrl;
      }
    }, []);

  /* =======================================================
     Open Bible verse
  ======================================================= */

  const openVerse =
    useCallback(
      (verse) => {
        if (!verse) {
          return;
        }

        navigate(
          `/bible?verse=${encodeURIComponent(
            verse
          )}`
        );
      },
      [navigate]
    );

  /* =======================================================
     Load events
  ======================================================= */

  const loadEvents =
    useCallback(
      async ({
        background = false,
      } = {}) => {
        setError("");

        if (!background) {
          setLoading(true);
        }

        /*
         * If API URL isn't configured, use cache instead.
         */
        if (!API_URL) {
          const cached =
            readCachedEvents();

          if (
            cached?.events?.length
          ) {
            setEvents(
              cached.events
            );

            setCachedAt(
              cached.savedAt
            );

            setUsingCachedData(
              true
            );

            setError(
              "Live events are unavailable because the API URL is not configured. Showing saved events."
            );
          } else {
            setError(
              "Events API is not configured and no saved events are available."
            );
          }

          setLoading(false);

          return;
        }

        try {
          const response =
            await fetch(
              `${API_URL}/api/events`,
              {
                method: "GET",
                headers: {
                  Accept:
                    "application/json",
                },
                cache: "no-store",
              }
            );

          if (!response.ok) {
            throw new Error(
              `HTTP ${response.status}`
            );
          }

          const data =
            await response.json();

          const normalized =
            normalizeEvents(
              data
            );

          /*
           * Save immediately after successful fetch.
           */
          saveCachedEvents(
            normalized
          );

          setEvents(
            normalized
          );

          setCachedAt(
            Date.now()
          );

          setUsingCachedData(
            false
          );

          /*
           * Refresh should always take the user back to
           * the first page because the dataset may have changed.
           */
          setPage(1);

          /*
           * Remove stale expansion states.
           */
          setExpanded({});
        } catch (err) {
          console.error(
            "Failed to load prophecy events:",
            err
          );

          /*
           * Critical fallback:
           * API failed, but previously fetched data exists.
           */
          const cached =
            readCachedEvents();

          if (
            cached?.events?.length
          ) {
            setEvents(
              cached.events
            );

            setCachedAt(
              cached.savedAt
            );

            setUsingCachedData(
              true
            );

            setError(
              "Live events could not be refreshed. Showing the latest saved events."
            );
          } else {
            setError(
              "Failed to fetch prophecy events. Please try again."
            );
          }
        } finally {
          setLoading(false);
        }
      },
      []
    );

  /* =======================================================
     Initial boot
  ======================================================= */

  useEffect(() => {
    /*
     * First render cached data immediately.
     */
    const cached =
      readCachedEvents();

    if (
      cached?.events?.length
    ) {
      setEvents(
        cached.events
      );

      setCachedAt(
        cached.savedAt
      );

      setUsingCachedData(
        true
      );
    }

    /*
     * Then ask the API for the latest version.
     */
    loadEvents({
      background:
        Boolean(
          cached?.events?.length
        ),
    });
  }, [loadEvents]);

  /* =======================================================
     Location options
  ======================================================= */

  const locations =
    useMemo(() => {
      const countries =
        new Set();

      events.forEach(
        (event) => {
          const country =
            cleanText(
              event.location
                ?.country
            );

          if (country) {
            countries.add(
              country
            );
          }
        }
      );

      return [
        "Global",
        ...Array.from(
          countries
        ).sort(),
      ];
    }, [events]);

  /* =======================================================
     Filter events
  ======================================================= */

  const filtered =
    useMemo(() => {
      return events.filter(
        (event) => {
          const locationMatch =
            !location ||
            location ===
              "Global" ||
            event.location
              ?.country ===
              location;

          const categoryMatch =
            !category ||
            (
              Array.isArray(
                event.matched_symbols
              ) &&
              event.matched_symbols.includes(
                category
              )
            );

          return (
            locationMatch &&
            categoryMatch
          );
        }
      );
    }, [
      events,
      location,
      category,
    ]);

  /* =======================================================
     Pagination
  ======================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filtered.length /
          ITEMS_PER_PAGE
      )
    );

  /*
   * Protect page if filtering makes the current page invalid.
   */
  useEffect(() => {
    if (
      page > totalPages
    ) {
      setPage(
        totalPages
      );
    }
  }, [
    page,
    totalPages,
  ]);

  const paged =
    useMemo(() => {
      const start =
        (page - 1) *
        ITEMS_PER_PAGE;

      return filtered.slice(
        start,
        start +
          ITEMS_PER_PAGE
      );
    }, [
      filtered,
      page,
    ]);

  /* =======================================================
     Filter change helpers
  ======================================================= */

  const changeLocation =
    (value) => {
      setLocation(value);
      setPage(1);
      setExpanded({});
    };

  const changeCategory =
    (value) => {
      setCategory(value);
      setPage(1);
      setExpanded({});
    };

  /* =======================================================
     Pagination controls
  ======================================================= */

  const goToPage =
    (nextPage) => {
      const safePage =
        Math.min(
          Math.max(
            nextPage,
            1
          ),
          totalPages
        );

      setPage(
        safePage
      );

      setExpanded({});

      /*
       * Keep the user at the top of the event list on mobile.
       */
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div
      className="
        w-full
        max-w-7xl
        mx-auto
        px-3
        sm:px-4
        md:px-6
        lg:px-8
        xl:px-10
        pb-10
        space-y-6
      "
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300">
            <Globe2 className="h-3 w-3" />
            Global Event Monitor
          </div>

          <h3 className="text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-300 sm:text-3xl">
            🌍 Global Prophetic Events
          </h3>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-400">
            Real-world events mapped to prophetic
            symbols and categories, with source
            context and concise explanations for
            easier study.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadEvents()
          }
          disabled={loading}
          className="
            inline-flex
            min-h-[44px]
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-indigo-600
            px-4
            py-2.5
            text-sm
            font-bold
            text-white
            shadow-sm
            transition
            hover:bg-indigo-700
            disabled:cursor-not-allowed
            disabled:opacity-60
            sm:w-auto
          "
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading
                ? "animate-spin"
                : ""
            }`}
          />

          {loading
            ? "Refreshing..."
            : "Refresh Events"}
        </button>
      </div>

      {/* ===================================================
          DATA STATUS
      =================================================== */}

      {(cachedAt ||
        usingCachedData) && (
        <div
          className={`
            flex
            flex-col
            gap-2
            rounded-xl
            border
            px-4
            py-3
            text-xs
            sm:flex-row
            sm:items-center
            sm:justify-between
            ${
              usingCachedData
                ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300"
            }
          `}
        >
          <div className="flex items-center gap-2">
            {usingCachedData ? (
              <Database className="h-4 w-4 flex-shrink-0" />
            ) : (
              <Sparkles className="h-4 w-4 flex-shrink-0" />
            )}

            <span>
              {usingCachedData
                ? "Showing saved event data while live data is unavailable."
                : "Live event data is loaded and saved locally for faster access."}
            </span>
          </div>

          {cachedAt && (
            <span className="whitespace-nowrap font-medium opacity-80">
              Saved{" "}
              {formatCacheTime(
                cachedAt
              )}
            </span>
          )}
        </div>
      )}

      {/* ===================================================
          FILTER BAR
      =================================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Location */}

          <div className="min-w-0 flex-1">
            <label
              htmlFor="event-location"
              className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400"
            >
              Location
            </label>

            <select
              id="event-location"
              value={location}
              onChange={(event) =>
                changeLocation(
                  event.target.value
                )
              }
              className="
                min-h-[44px]
                w-full
                rounded-xl
                border
                border-gray-300
                bg-white
                px-3
                py-2
                text-sm
                font-medium
                text-gray-900
                outline-none
                transition
                focus:border-indigo-500
                focus:ring-4
                focus:ring-indigo-500/10
                dark:border-gray-700
                dark:bg-gray-950
                dark:text-gray-100
              "
            >
              <option value="">
                All Locations
              </option>

              {locations.map(
                (loc) => (
                  <option
                    key={loc}
                    value={loc}
                  >
                    {loc}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Category */}

          <div className="min-w-0 flex-1">
            <label
              htmlFor="event-category"
              className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400"
            >
              Category
            </label>

            <select
              id="event-category"
              value={category}
              onChange={(event) =>
                changeCategory(
                  event.target.value
                )
              }
              className="
                min-h-[44px]
                w-full
                rounded-xl
                border
                border-gray-300
                bg-white
                px-3
                py-2
                text-sm
                font-medium
                text-gray-900
                outline-none
                transition
                focus:border-indigo-500
                focus:ring-4
                focus:ring-indigo-500/10
                dark:border-gray-700
                dark:bg-gray-950
                dark:text-gray-100
              "
            >
              <option value="">
                All Categories
              </option>

              {Object.entries(
                CATEGORY_LABELS
              ).map(
                ([
                  key,
                  label,
                ]) => (
                  <option
                    key={key}
                    value={key}
                  >
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Count */}

          <div className="rounded-xl bg-gray-50 px-4 py-3 text-center dark:bg-gray-950 lg:min-w-[150px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Results
            </p>

            <p className="mt-0.5 text-sm font-bold text-gray-800 dark:text-gray-200">
              {filtered.length} event
              {filtered.length === 1
                ? ""
                : "s"}
            </p>
          </div>
        </div>

        {/* Active filters */}

        {(location ||
          category) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
            <span className="text-[11px] font-medium text-gray-400">
              Active filters:
            </span>

            {location && (
              <button
                type="button"
                onClick={() =>
                  changeLocation("")
                }
                className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300"
              >
                {location} ×
              </button>
            )}

            {category && (
              <button
                type="button"
                onClick={() =>
                  changeCategory("")
                }
                className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300"
              >
                {CATEGORY_LABELS[
                  category
                ] ||
                  category}{" "}
                ×
              </button>
            )}
          </div>
        )}
      </div>

      {/* ===================================================
          LOADING
      =================================================== */}

      {loading &&
        events.length === 0 && (
          <div className="flex min-h-[180px] items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />

            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Loading global events...
            </p>
          </div>
        )}

      {/* ===================================================
          ERROR
      =================================================== */}

      {!loading &&
        error &&
        events.length === 0 && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />

              <div>
                <p className="font-bold">
                  Unable to load events
                </p>

                <p className="mt-1 text-sm">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    loadEvents()
                  }
                  className="mt-4 inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

      {/* ===================================================
          EVENTS
      =================================================== */}

      {!loading ||
        events.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {paged.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <Globe2 className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-700" />

              <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                No events found
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Try changing the selected
                location or category.
              </p>

              <button
                type="button"
                onClick={() => {
                  setLocation("");
                  setCategory("");
                  setPage(1);
                }}
                className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            paged.map(
              (event, index) => {
                const eventKey =
                  getEventKey(
                    event,
                    index
                  );

                const isExpanded =
                  Boolean(
                    expanded[
                      eventKey
                    ]
                  );

                const summary =
                  buildExplanatorySummary(
                    event
                  );

                const sourceUrl =
                  normalizeUrl(
                    event.url
                  );

                return (
                  <Card
                    key={eventKey}
                    className="
                      overflow-hidden
                      rounded-2xl
                      border
                      border-gray-200/80
                      bg-white
                      shadow-sm
                      transition
                      hover:shadow-lg
                      dark:border-gray-800
                      dark:bg-gray-900
                    "
                  >
                    <CardContent className="space-y-4 p-4 sm:p-5">
                      {/* Event heading */}

                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              {event.source && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                  📰{" "}
                                  {
                                    event.source
                                  }
                                </span>
                              )}

                              {event.publishedAt && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400">
                                  <Clock3 className="h-3 w-3" />
                                  {formatDate(
                                    event.publishedAt
                                  )}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                openSource(
                                  sourceUrl
                                )
                              }
                              disabled={
                                !sourceUrl
                              }
                              className="
                                text-left
                                text-base
                                font-black
                                leading-6
                                text-blue-600
                                transition
                                hover:text-blue-700
                                hover:underline
                                disabled:cursor-default
                                disabled:no-underline
                                disabled:opacity-70
                                dark:text-blue-400
                                dark:hover:text-blue-300
                                sm:text-lg
                              "
                            >
                              {event.headline}
                            </button>
                          </div>
                        </div>

                        {/* =================================================
                            EXPLANATION
                        ================================================= */}

                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-indigo-950/60">
                              <Sparkles className="h-4 w-4 text-indigo-500" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center justify-between gap-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">
                                  What this means
                                </p>
                              </div>

                              <p
                                className={`text-sm leading-6 text-indigo-950 dark:text-indigo-100 ${
                                  isExpanded
                                    ? ""
                                    : "line-clamp-4"
                                }`}
                              >
                                {
                                  summary
                                }
                              </p>

                              {summary.length >
                                260 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleExpand(
                                      eventKey
                                    )
                                  }
                                  className="mt-2 text-xs font-bold text-indigo-600 underline hover:text-indigo-800 dark:text-indigo-300"
                                >
                                  {isExpanded
                                    ? "Show less"
                                    : "Read full explanation"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* =================================================
                          IMAGE
                      ================================================= */}

                      {event.urlToImage && (
                        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-100 dark:border-gray-800 dark:bg-gray-950">
                          <img
                            src={
                              event.urlToImage
                            }
                            alt={
                              event.headline
                            }
                            loading="lazy"
                            className="aspect-video w-full object-cover"
                            onError={(
                              imageEvent
                            ) => {
                              imageEvent.currentTarget.style.display =
                                "none";
                            }}
                          />
                        </div>
                      )}

                      {/* =================================================
                          DESCRIPTION
                      ================================================= */}

                      {event.description && (
                        <div>
                          <p
                            className={`text-sm leading-6 text-gray-700 dark:text-gray-300 ${
                              isExpanded
                                ? ""
                                : "line-clamp-4"
                            }`}
                          >
                            {
                              event.description
                            }
                          </p>

                          {event.description
                            .length >
                            280 && (
                            <button
                              type="button"
                              onClick={() =>
                                toggleExpand(
                                  eventKey
                                )
                              }
                              className="mt-2 text-xs font-bold text-indigo-600 underline hover:text-indigo-700 dark:text-indigo-300"
                            >
                              {isExpanded
                                ? "Show less"
                                : "Read more"}
                            </button>
                          )}
                        </div>
                      )}

                      {/* =================================================
                          VIDEO
                      ================================================= */}

                      {event.media_type ===
                        "video" &&
                        sourceUrl && (
                          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 dark:border-purple-900/40 dark:bg-purple-950/20">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-bold text-purple-900 dark:text-purple-200">
                                  🎥 Video source
                                </p>

                                <p className="mt-1 text-xs text-purple-700 dark:text-purple-300">
                                  Open the original source to
                                  watch the complete report.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  openSource(
                                    sourceUrl
                                  )
                                }
                                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-purple-700"
                              >
                                Watch Video
                                <ExternalLink className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                      {/* =================================================
                          BIBLE VERSES
                      ================================================= */}

                      {Array.isArray(
                        event.matched_verses
                      ) &&
                        event.matched_verses
                          .length >
                          0 && (
                          <div>
                            <div className="mb-2 flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-green-600" />

                              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                                Related Scriptures
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {event.matched_verses.map(
                                (
                                  verse,
                                  verseIndex
                                ) => (
                                  <button
                                    key={`${eventKey}-verse-${verseIndex}`}
                                    type="button"
                                    onClick={() =>
                                      openVerse(
                                        verse
                                      )
                                    }
                                    className="
                                      rounded-full
                                      border
                                      border-green-200
                                      bg-green-50
                                      px-3
                                      py-1.5
                                      text-xs
                                      font-semibold
                                      text-green-700
                                      transition
                                      hover:bg-green-100
                                      dark:border-green-800
                                      dark:bg-green-900/30
                                      dark:text-green-300
                                    "
                                  >
                                    📖{" "}
                                    {
                                      verse
                                    }
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* =================================================
                          META
                      ================================================= */}

                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(
                          event.matched_symbols
                        ) &&
                          event.matched_symbols.map(
                            (
                              symbol
                            ) => (
                              <span
                                key={`${eventKey}-${symbol}`}
                                className="
                                  inline-flex
                                  items-center
                                  gap-1
                                  rounded-full
                                  border
                                  border-indigo-200/70
                                  bg-indigo-50
                                  px-2.5
                                  py-1.5
                                  text-[10px]
                                  font-bold
                                  text-indigo-700
                                  dark:border-indigo-900/40
                                  dark:bg-indigo-950/40
                                  dark:text-indigo-300
                                "
                              >
                                <Tags className="h-3 w-3" />

                                {CATEGORY_LABELS[
                                  symbol
                                ] ||
                                  symbol}
                              </span>
                            )
                          )}

                        {event.location
                          ?.country && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1.5 text-[10px] font-bold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            <MapPin className="h-3 w-3" />

                            {
                              event
                                .location
                                .country
                            }
                          </span>
                        )}
                      </div>

                      {/* =================================================
                          SOURCE ACTION
                      ================================================= */}

                      <div className="border-t border-gray-100 pt-3 dark:border-gray-800">
                        <button
                          type="button"
                          onClick={() =>
                            openSource(
                              sourceUrl
                            )
                          }
                          disabled={
                            !sourceUrl
                          }
                          className="
                            flex
                            min-h-[46px]
                            w-full
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-blue-600
                            px-4
                            py-2.5
                            text-sm
                            font-bold
                            text-white
                            shadow-sm
                            transition
                            hover:bg-blue-700
                            disabled:cursor-not-allowed
                            disabled:bg-gray-300
                            dark:disabled:bg-gray-700
                          "
                        >
                          <ExternalLink className="h-4 w-4" />

                          {sourceUrl
                            ? "Open Full Source"
                            : "Source Unavailable"}
                        </button>

                        {sourceUrl && (
                          <p className="mt-2 text-center text-[10px] text-gray-400">
                            Opens the original report in a new
                            browser tab.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              }
            )
          )}
        </div>
      ) : null}

      {/* ===================================================
          MOBILE-FIRST PAGINATION
      =================================================== */}

      {!loading &&
        !error &&
        filtered.length >
          ITEMS_PER_PAGE && (
          <div className="sticky bottom-3 z-20 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                <span>
                  Page{" "}
                  <strong className="text-gray-900 dark:text-white">
                    {page}
                  </strong>{" "}
                  of{" "}
                  <strong className="text-gray-900 dark:text-white">
                    {totalPages}
                  </strong>
                </span>

                <span className="text-gray-300 dark:text-gray-700">
                  •
                </span>

                <span>
                  {filtered.length} events
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-center">
                <button
                  type="button"
                  disabled={
                    page <= 1
                  }
                  onClick={() =>
                    goToPage(
                      page - 1
                    )
                  }
                  className="
                    inline-flex
                    min-h-[48px]
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    border-gray-300
                    bg-white
                    px-4
                    py-2.5
                    text-sm
                    font-bold
                    text-gray-700
                    transition
                    hover:bg-gray-100
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                    dark:border-gray-700
                    dark:bg-gray-900
                    dark:text-gray-200
                    dark:hover:bg-gray-800
                  "
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    page >=
                    totalPages
                  }
                  onClick={() =>
                    goToPage(
                      page + 1
                    )
                  }
                  className="
                    inline-flex
                    min-h-[48px]
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-indigo-600
                    px-4
                    py-2.5
                    text-sm
                    font-bold
                    text-white
                    shadow-sm
                    transition
                    hover:bg-indigo-700
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Page number buttons for larger screens */}

              {totalPages <=
                7 && (
                <div className="hidden items-center justify-center gap-1 sm:flex">
                  {Array.from(
                    {
                      length:
                        totalPages,
                    },
                    (
                      _,
                      index
                    ) => {
                      const pageNumber =
                        index + 1;

                      return (
                        <button
                          key={
                            pageNumber
                          }
                          type="button"
                          onClick={() =>
                            goToPage(
                              pageNumber
                            )
                          }
                          className={`
                            flex
                            h-9
                            min-w-9
                            items-center
                            justify-center
                            rounded-lg
                            px-2
                            text-xs
                            font-bold
                            transition
                            ${
                              page ===
                              pageNumber
                                ? "bg-indigo-600 text-white"
                                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                            }
                          `}
                        >
                          {
                            pageNumber
                          }
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      {/* ===================================================
          BOTTOM INFORMATION
      =================================================== */}

      {!loading &&
        events.length >
          0 && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/40">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />

              <p className="text-[11px] leading-5 text-gray-500 dark:text-gray-400">
                Prophetic event classifications are
                provided for study and contextual
                exploration. A news event being matched to a
                biblical symbol does not, by itself, establish
                prophetic fulfillment. Always examine the
                original source, historical evidence, and the
                relevant biblical passages.
              </p>
            </div>
          </div>
        )}
    </div>
  );
}