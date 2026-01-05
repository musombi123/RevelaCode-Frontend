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
        const res = await fetch(`${baseUrl}/api/events`, {
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

        setEvents(normalized);
      } catch (err) {
        console.error("❌ Failed to load prophecy events:", err);
        setError("Failed to load prophecy events");
        setEvents([]);
      }
    };

    if (baseUrl) loadEvents();
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
      const categoryMatch =
        !category || e?.matched_symbols?.includes(category);

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
      <h3 className="text-xl font-semibold text-indigo-600">
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
          className="border rounded-lg px-3 py-2 text-sm"
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
          className="border rounded-lg px-3 py-2 text-sm"
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
            }}
            className="text-xs text-red-600 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Events */}
      <div className="grid gap-4">
        {paged.length === 0 ? (
          <p className="text-sm text-gray-500">No events found.</p>
        ) : (
          paged.map((e, idx) => (
            <Card key={idx} className="hover:shadow-md transition">
              <CardContent className="space-y-2 p-4">
                <a
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-600 hover:underline"
                >
                  {e.headline || "Untitled Event"}
                </a>

                {e.description && (
                  <p className="text-sm text-gray-600">
                    {e.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  {e.publishedAt && (
                    <span>
                      🗓 {new Date(e.publishedAt).toLocaleDateString()}
                    </span>
                  )}
                  {e.source && <span>— {e.source}</span>}

                  {e.location?.country && (
                    <span className="px-2 py-0.5 rounded bg-gray-200">
                      📍 {e.location.country}
                    </span>
                  )}

                  {e.matched_symbols?.map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700"
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
