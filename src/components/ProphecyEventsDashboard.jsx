import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/Card";
import { Loader2, RefreshCw, MapPin, Tags } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
const ITEMS_PER_PAGE = 8;

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
  general: "General",
  technology_and_image_of_the_beast: "Technology & Image of the Beast",
};

export default function ProphecyEventsDashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState(""); // NEW: Category state
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (idx) => {
    setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const VideoPlayer = ({ url }) => {
    if (!url) return null;

    return (
      <iframe
        src={url.replace("watch?v=", "embed/")}
        className="w-full h-[300px] rounded-lg"
        allow="autoplay; encrypted-media"
        allowFullScreen
      />
    );
  };

  const openVerse = (verse) => {
    if (!verse) return;

    navigate(
      `/bible?verse=${encodeURIComponent(verse)}`
    );
  };

  const loadEvents = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/events`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const normalized = Array.isArray(data?.events)
        ? data.events
        : Array.isArray(data)
        ? data
        : [];
      const sorted = normalized.sort(
        (a, b) =>
          new Date(b?.publishedAt || 0) - new Date(a?.publishedAt || 0)
      );
      setEvents(sorted);
    } catch (err) {
      console.error("Failed to load events:", err);
      setError("Failed to fetch prophecy events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Build location options dynamically
  const locations = useMemo(() => {
    const set = new Set();
    events.forEach((e) => {
      if (e.location?.country) set.add(e.location.country);
    });
    return ["Global", ...Array.from(set)];
  }, [events]);

  // Filter events by location + category
  const filtered = useMemo(() => {
    return events.filter((e) => {
      const locationMatch =
        !location || location === "Global" || e.location?.country === location;
      const categoryMatch =
        !category ||
        (Array.isArray(e.matched_symbols) && e.matched_symbols.includes(category));
      return locationMatch && categoryMatch;
    });
  }, [events, location, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="
      w-full
      max-w-7xl
      mx-auto
      px-3
      sm:px-4
      md:px-6
      lg:px-8
      xl:px-10
      space-y-6
    ">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
            🌍 Global Prophetic Events
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Real-world headlines mapped to prophetic symbols and categories.
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

      {/* Filter Bar: Location + Category */}
      <div className="flex flex-wrap gap-3 items-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
        {/* Location */}
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
        {location && (
          <button
            onClick={() => {
              setLocation("");
              setPage(1);
            }}
            className="text-xs font-semibold text-red-600 hover:text-red-700 underline"
          >
            Clear location
          </button>
        )}

        {/* Category */}
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
        >
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        {category && (
          <button
            onClick={() => {
              setCategory("");
              setPage(1);
            }}
            className="text-xs font-semibold text-red-600 hover:text-red-700 underline"
          >
            Clear category
          </button>
        )}

        {/* Result count */}
        <div className="w-full md:w-auto md:ml-auto text-center md:text-right">
          Showing{" "}
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {filtered.length}
          </span>{" "}
          result(s)
        </div>
      </div>

      {/* Loading / Error / Event Cards */}
      {loading && (
        <div className="flex items-center justify-center gap-2 p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading global events...
          </p>
        </div>
      )}

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

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {paged.length === 0 ? (
            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No events found for the selected filters.
              </p>
            </div>
          ) : (
            paged.map((e, idx) => {
              const isExpanded = expanded[idx];
              return (
                <Card
                  key={e.url || idx}
                  className="hover:shadow-md transition border border-gray-200/70 dark:border-gray-800/70 rounded-xl h-auto"
                >
                  <CardContent className="space-y-3 p-5">
                    {/* Title */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 items-start">
                      <a
                        href={e.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-base sm:text-lg text-blue-600 dark:text-blue-400 hover:underline break-words overflow-hidden text-ellipsis whitespace-normal"
                      >
                        {e.headline || "Untitled Event"}
                      </a>
                      {e.publishedAt && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {new Date(e.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {/* Video */}
                    {e.media_type === "video" && (
                      <div className="
                        w-full
                        aspect-video
                        rounded-lg
                        ">
                        <p className="text-sm mb-2">
                          🎥 Video available from source
                          </p>

                        <a
                          href={e.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          Watch Video
                        </a>
                      </div>
                    )}
                    {/* Image */}
                    {e.urlToImage &&
                      e.urlToImage !== "null" &&
                      e.urlToImage.trim() !== "" && (
                        <div className="w-full overflow-hidden rounded-xl">
                          <img
                            src={e.urlToImage}
                            alt={e.headline}
                            className="
                              w-full
                              aspect-video
                              object-cover
                              rounded-xl
                            "
                           />
                        </div>
                      )}
                    {/* Description */}
                    {e.description && (
                      <div>
                        <p
                          className={`text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words ${
                            isExpanded ? "whitespace-pre-line" :"line-clamp-3 sm:line-clamp-4"
                          }`}
                        >
                          {e.description}
                        </p>
                        <button
                          onClick={() => toggleExpand(idx)}
                          className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
                        >
                          {isExpanded ? "Show less" : "Read more"}
                        </button>
                      </div>
                    )}

                    {/* Matched Verses */}
                    {e.matched_verses?.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-xs text-green-700 dark:text-green-300 mt-2">
                        {e.matched_verses.map((v, i) => (
                          <button
                            onClick={() => openVerse(v)}
                              className="
                                px-2 py-1
                                rounded-full
                                bg-green-50
                                dark:bg-green-900/40
                                border
                                border-green-200
                                dark:border-green-800
                                hover:bg-green-100
                              "
                          >
                            📖 {v}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Categories & Meta */}
                    <div className="
                      flex
                      flex-col
                      md:flex-row
                      gap-3
                      items-stretch
                      md:items-center
                    ">
                      {e.source && (
                        <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 break-words">
                          📰 {e.source}
                        </span>
                      )}
                      {Array.isArray(e.matched_symbols) &&
                        e.matched_symbols.map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-900/40 break-words"
                          >
                            <Tags className="w-3 h-3" />
                            {CATEGORY_LABELS[cat] || cat}
                          </span>
                        ))}
                      {e.location?.country && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 break-words">
                          <MapPin className="w-3 h-3" />
                          {e.location.country}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && filtered.length > ITEMS_PER_PAGE && (
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
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
