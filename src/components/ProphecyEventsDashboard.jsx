import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Loader2, RefreshCw, Filter, MapPin, Tags } from "lucide-react";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CATEGORY_LABELS = {
  wars_conflicts: "Wars & Conflicts",
  natural_disasters: "Natural Disasters",
  economic: "Economic Signs",
  crime: "Crime & Lawlessness",
  politics: "Political Upheaval",
  health: "Health Crises",
  social_morality: "Moral Decay",
  false_peace: "False Peace",
  surveillance: "Surveillance",
};

const ITEMS_PER_PAGE = 8;

export default function ProphecyEventsDashboard() {
  const [events, setEvents] = useState([]);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [page, setPage] = useState(1);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadEvents = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${baseUrl}/api/events`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      // 🔒 Normalize ALL known backend shapes
      const normalized =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.events)
          ? data.events
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.events)
          ? data.data.events
          : [];

      // Optional: sort newest first if timestamps exist
      const sorted = [...normalized].sort((a, b) => {
        const aTime = new Date(a?.publishedAt || a?.date || 0).getTime();
        const bTime = new Date(b?.publishedAt || b?.date || 0).getTime();
        return bTime - aTime;
      });

      setEvents(sorted);
    } catch (err) {
      console.error("❌ Failed to load prophecy events:", err);
      setError("We couldn’t load prophecy events right now. Please try again.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  /* ------------------------------
     Derived Filters (SAFE)
  ------------------------------ */

  const locations = useMemo(() => {
    const set = new Set();
    events.forEach((e) => {
      if (e?.location?.country) set.add(e.location.country);
    });
    return ["Global", ...Array.from(set)];
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const categoryMatch = !category || e?.matched_symbols?.includes(category);

      const locationMatch =
        !location ||
        location === "Global" ||
        e?.location?.country === location;

      return categoryMatch && locationMatch;
    });
  }, [events, category, location]);

  const paged = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
            🌍 Global Prophetic Events
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Real-world headlines mapped to prophetic categories — filtered, clean, and readable.
          </p>
        </div>

        <button
          onClick={loadEvents}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-gray-800 dark:text-gray-200 font-semibold">
          <Filter className="w-4 h-4" />
          Filters
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          <select
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {(category || location) && (
            <button
              onClick={() => {
                setCategory("");
                setLocation("");
                setPage(1);
              }}
              className="text-xs font-semibold text-red-600 hover:text-red-700 underline"
            >
              Clear filters
            </button>
          )}

          <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            Showing{" "}
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {filtered.length}
            </span>{" "}
            result(s)
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading global events from backend...
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="p-5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 shadow-sm">
          <p className="font-semibold">⚠ {error}</p>
          <button
            onClick={loadEvents}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      )}

      {/* Events */}
      {!loading && !error && (
        <div className="grid gap-4">
          {paged.length === 0 ? (
            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No events found for the selected filters.
              </p>
            </div>
          ) : (
            paged.map((e, idx) => (
              <Card
                key={e?.id || e?._id || e?.url || idx}
                className="hover:shadow-md transition border border-gray-200/70 dark:border-gray-800/70 rounded-xl"
              >
                <CardContent className="space-y-3 p-5">
                  {/* Title */}
                  <div className="flex items-start justify-between gap-4">
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-base sm:text-lg text-blue-600 dark:text-blue-400 hover:underline leading-snug"
                    >
                      {e.headline || "Untitled Event"}
                    </a>

                    {e.publishedAt && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(e.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {e.description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {e.description}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                    {e.source && (
                      <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        📰 {e.source}
                      </span>
                    )}

                    {e.location?.country && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <MapPin className="w-3 h-3" />
                        {e.location.country}
                      </span>
                    )}

                    {Array.isArray(e.matched_symbols) &&
                      e.matched_symbols.map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-900/40"
                        >
                          <Tags className="w-3 h-3" />
                          {CATEGORY_LABELS[cat] || cat}
                        </span>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && filtered.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className={`px-4 py-2 rounded-lg border transition font-semibold ${
              page === 1
                ? "opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-800"
                : "border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            ← Prev
          </button>

          <span className="text-gray-700 dark:text-gray-300 font-semibold">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className={`px-4 py-2 rounded-lg border transition font-semibold ${
              page >= totalPages
                ? "opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-800"
                : "border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
