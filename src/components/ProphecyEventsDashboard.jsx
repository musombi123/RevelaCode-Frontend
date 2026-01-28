import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Loader2, RefreshCw, MapPin } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ITEMS_PER_PAGE = 8;

export default function ProphecyEventsDashboard() {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch events
  const loadEvents = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/events`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const normalized = Array.isArray(data) ? data : Array.isArray(data?.events) ? data.events : [];
      const sorted = normalized.sort((a, b) => new Date(b?.publishedAt || 0) - new Date(a?.publishedAt || 0));
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

  // Pagination
  const totalPages = Math.max(1, Math.ceil(events.length / ITEMS_PER_PAGE));
  const paged = events.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
            🌍 Global Prophetic Events
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Real-world headlines mapped to prophetic symbols.
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

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading global events...</p>
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
          {paged.map((e, idx) => (
            <Card key={e.url || idx} className="hover:shadow-md transition border border-gray-200/70 dark:border-gray-800/70 rounded-xl">
              <CardContent className="space-y-3 p-5">
                {/* Title */}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3 items-start">
                  <a href={e.url} target="_blank" rel="noopener noreferrer" className="font-bold text-base sm:text-lg text-blue-600 dark:text-blue-400 hover:underline">
                    {e.headline || "Untitled Event"}
                  </a>
                  {e.publishedAt && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(e.publishedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Image */}
                {e.urlToImage && (
                  <img src={e.urlToImage} alt={e.headline} className="w-full rounded-lg object-cover max-h-64" />
                )}

                {/* Description */}
                {e.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{e.description}</p>
                )}

                {/* Matched Verses */}
                {e.matched_verses?.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-xs text-green-700 dark:text-green-300 mt-2">
                    {e.matched_verses.map((v, i) => (
                      <span key={i} className="px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-800">
                        📖 {v}
                      </span>
                    ))}
                  </div>
                )}

                {/* Meta */}
                <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {e.source && (
                    <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      📰 {e.source}
                    </span>
                  )}
                  {e.location?.country && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <MapPin className="w-3 h-3" /> {e.location.country}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && events.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className={`px-4 py-2 rounded-lg border transition font-semibold ${
              page === 1 ? "opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-800" : "border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
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
              page >= totalPages ? "opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-800" : "border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
