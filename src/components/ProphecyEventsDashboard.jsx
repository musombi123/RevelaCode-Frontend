import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/Card";

const baseUrl = import.meta.env.VITE_API_URL;

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

  useEffect(() => {
    const loadEvents = async () => {
      setError("");

      try {
        const res = await fetch(`${baseUrl}/api/events`);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        // backend returns { status, message, events: [] }
        const normalized = Array.isArray(data?.events) ? data.events : [];

        setEvents(normalized);
      } catch (err) {
        console.error("❌ Failed to load prophecy events:", err);
        setError("Failed to load prophecy events");
        setEvents([]);
      }
    };

    if (baseUrl) loadEvents();
  }, [baseUrl]);

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

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-300">
        🌍 Global Prophetic Events
      </h3>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
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
          className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
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
            className="text-xs text-red-600 underline dark:text-red-400"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Events */}
      <div className="grid gap-4">
        {paged.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No events found.
          </p>
        ) : (
          paged.map((e, idx) => (
            <Card key={idx} className="hover:shadow-md transition">
              <CardContent className="space-y-2 p-4">
                <a
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-black dark:text-white hover:underline"
                >
                  {e.headline || "Untitled Event"}
                </a>

                {e.description && (
                  <p className="text-sm text-black dark:text-white">
                    {e.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-xs">
                  {e.publishedAt && (
                    <span className="text-gray-500 dark:text-gray-400">
                      🗓 {new Date(e.publishedAt).toLocaleDateString()}
                    </span>
                  )}

                  {e.source && (
                    <span className="text-gray-500 dark:text-gray-400">
                      — {e.source}
                    </span>
                  )}

                  {e.location?.country && (
                    <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white">
                      📍 {e.location.country}
                    </span>
                  )}

                  {Array.isArray(e.matched_symbols) &&
                    e.matched_symbols.map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200"
                      >
                        {CATEGORY_LABELS[cat] || cat}
                      </span>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {filtered.length > ITEMS_PER_PAGE && (
        <div className="flex justify-center gap-4 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Prev
          </button>

          <span>Page {page}</span>

          <button
            disabled={page * ITEMS_PER_PAGE >= filtered.length}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
