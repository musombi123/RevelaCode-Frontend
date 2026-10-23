"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  BookOpen,
  RefreshCw,
  AlertCircle,
  GraduationCap,
  Clock3,
  BadgeCheck,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/Card";

import {
  getCachedLibrary,
  saveCachedLibrary,
} from "./studyMaterialCache.js";

const API = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_REVELACODE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://revelacode-backend.onrender.com"
).replace(/\/+$/, "");
// Versioned cache prevents an old mixed-hub/demo library from resurfacing.
const CACHE_SCOPE = `${API}/faith-library-v2`;

/* =========================================================
   NORMALIZE MATERIAL ID
========================================================= */

function resolveMaterialId(material) {
  if (!material) return null;

  const raw =
    material.id ??
    material._id ??
    material.material_id ??
    material.materialId ??
    null;

  return raw == null ? null : String(raw);
}

/* =========================================================
   PRESENTATION HELPERS
========================================================= */

function materialSummary(material) {
  const meta = material?.metadata && typeof material.metadata === "object" ? material.metadata : {};
  const supplied = material?.description || material?.summary || meta.editorial_summary;
  if (typeof supplied === "string" && supplied.trim()) return supplied.trim();

  const raw = typeof material?.content === "string" ? material.content : "";
  const clean = raw
    .replace(/^\s*#+\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "A published Faith study resource.";
  const firstParagraph = clean.split(/(?<=[.!?])\s+/)[0] || clean;
  return firstParagraph.length > 190 ? firstParagraph.slice(0, 187).trim() + "…" : firstParagraph;
}

function materialSources(material) {
  const meta = material?.metadata && typeof material.metadata === "object" ? material.metadata : {};
  const sources = material?.sources || meta.sources;
  return Array.isArray(sources) ? sources.filter((source) => source && typeof source.url === "string") : [];
}

const TOPIC_FILTERS = [
  { id: "all", label: "All Faith" },
  { id: "biblical-literacy", label: "Bible study" },
  { id: "christian-foundations", label: "Christianity" },
  { id: "prophecy", label: "Prophecy" },
  { id: "sda", label: "SDA" },
  { id: "catholic", label: "Catholic" },
  { id: "interfaith", label: "Interfaith" },
  { id: "daily-life", label: "Daily life" },
];

/* =========================================================
   STUDY LIBRARY
========================================================= */

export default function StudyLibrary({
  onOpen,
  userId,
  initialTopicFilter = "all",
}) {
  const [materials, setMaterials] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [topicFilter, setTopicFilter] = useState(initialTopicFilter || "all");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [cacheStatus, setCacheStatus] =
    useState("checking");

  const [lastUpdated, setLastUpdated] =
    useState("");

  /* =======================================================
     LOAD MATERIALS â€” CACHE FIRST
  ======================================================= */

  const loadMaterials = useCallback(
    async ({ silent = false, force = false } = {}) => {
      let savedCopy = null;

      try {
        savedCopy = await getCachedLibrary(CACHE_SCOPE);
      } catch {
        savedCopy = null;
      }

      // Normal navigation is cache-first: no repeated download when a saved
      // library exists. The user can explicitly refresh to check the backend.
      if (!force && savedCopy && Array.isArray(savedCopy.materials)) {
        setMaterials(savedCopy.materials);
        setCacheStatus("saved");
        setLastUpdated(savedCopy.savedAt || "");
        setError("");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!API) {
        setError(
          savedCopy
            ? "The backend URL is not configured. Your saved lesson library remains available."
            : "Study API is not configured."
        );
        setCacheStatus(savedCopy ? "saved" : "unavailable");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const url = `${API}/api/study/materials?category=faith&limit=100`;
        const headers = { Accept: "application/json" };
        if (userId) headers["X-User-ID"] = String(userId);

        const res = await fetch(url, {
          method: "GET",
          headers,
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            data?.message || data?.error ||
            `Failed to load study materials (${res.status}).`
          );
        }

        const rawMaterials = Array.isArray(data?.materials)
          ? data.materials
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];

        const normalized = rawMaterials
          .map((material) => {
            const id = material?.id ?? material?._id ?? material?.material_id ?? material?.materialId ?? null;
            return { ...material, id: id == null ? null : String(id) };
          })
          // Faith's public catalogue shows only content explicitly published by
          // an administrator or the versioned editorial catalogue. This keeps
          // legacy demo/test uploads out of the learner-facing experience.
          .filter((material) => material.id && (material.published === true || Boolean(material?.metadata?.catalog_slug)));

        setMaterials(normalized);
        const savedAt = await saveCachedLibrary(CACHE_SCOPE, normalized);
        setCacheStatus(savedAt ? "saved" : "online");
        setLastUpdated(savedAt || new Date().toISOString());
      } catch (err) {
        console.error("Study Library Error:", err);
        setCacheStatus(savedCopy ? "saved" : "unavailable");
        setError(
          savedCopy
            ? `Could not refresh from the backend. Your saved copy is still available. ${err?.message || "Please try again."}`
            : err?.message || "Unable to load study materials."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    setTopicFilter(initialTopicFilter || "all");
  }, [initialTopicFilter]);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  /* =======================================================
     SEARCH
  ======================================================= */

  const filtered = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return materials;
    }

    return materials.filter(
      (material) => {
        if (topicFilter !== "all" && String(material.subcategory || "").toLowerCase() !== topicFilter) return false;

        const title =
          String(
            material.title || ""
          ).toLowerCase();

        const description =
          String(
            material.description ||
              material.content ||
              ""
          ).toLowerCase();

        const category =
          String(
            material.category || ""
          ).toLowerCase();

        return (
          title.includes(query) ||
          description.includes(query) ||
          category.includes(query)
        );
      }
    );
  }, [materials, search, topicFilter]);

  /* =======================================================
     OPEN MATERIAL
  ======================================================= */

  const handleOpen = (material) => {
    const materialId =
      resolveMaterialId(material);

    if (!materialId) {
      console.error(
        "Cannot open study material without ID:",
        material
      );

      return;
    }

    onOpen?.({
      ...material,
      id: materialId,
    });
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Study Library
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Loading your study materials...
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(
            (item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              />
            )
          )}
        </div>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="space-y-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-400">
            <BookOpen className="h-3 w-3" />
            Learning
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Study Library
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Curated, source-linked study guides for Scripture, prophecy, Christian traditions, interfaith understanding, and daily life.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
              {cacheStatus === "saved" ? "Saved for offline reading" : cacheStatus === "online" ? "Loaded from backend" : "Backend-processed lessons"}
            </span>
            {lastUpdated && <span>{cacheStatus === "saved" ? "Saved " : "Fetched "}{new Date(lastUpdated).toLocaleString()}</span>}
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            loadMaterials({
              silent: true,
              force: true,
            })
          }
          disabled={refreshing}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing
                ? "animate-spin"
                : ""
            }`}
          />

          Refresh
        </button>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/20">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />

          <div className="min-w-0">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              Study Library Error
            </p>

            <p className="mt-1 break-words text-xs leading-5 text-red-600/80 dark:text-red-400/80">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                loadMaterials({ silent: true, force: true })
              }
              className="mt-2 text-xs font-semibold text-red-700 underline dark:text-red-300"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* TOPIC FILTERS */}
      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter Faith studies">
        {TOPIC_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setTopicFilter(filter.id)}
            className={`shrink-0 rounded-full border px-3 py-2 text-xs font-bold transition ${
              topicFilter === filter.id
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          type="text"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search materials, topics, or categories..."
          className="
            w-full
            rounded-2xl
            border
            border-slate-200
            bg-white
            px-4
            py-3.5
            pl-11
            text-sm
            text-slate-900
            outline-none
            transition
            placeholder:text-slate-400
            focus:border-blue-400
            focus:ring-4
            focus:ring-blue-500/10
            dark:border-slate-800
            dark:bg-slate-900
            dark:text-white
            dark:focus:border-blue-500
          "
        />
      </div>

      {/* =================================================
          RESULTS COUNT
      ================================================= */}

      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400">
          {filtered.length}{" "}
          {filtered.length === 1 ? "study" : "studies"} shown
        </p>

        {(search || topicFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setTopicFilter("all");
            }}
            className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            Clear search
          </button>
        )}
      </div>

      {/* =================================================
          EMPTY
      ================================================= */}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <GraduationCap className="h-6 w-6 text-slate-400" />
          </div>

          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {search || topicFilter !== "all"
              ? "No matching studies"
              : "The curated Faith library is not published yet"}
          </h3>

          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
            {search || topicFilter !== "all"
              ? "Try another topic or clear the filters."
              : "An administrator can publish the source-linked starter catalogue from Study Hub Management. Your Bible-reading tools remain available."}
          </p>
        </div>
      ) : (
        /* =================================================
           MATERIAL GRID
        ================================================= */

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(
            (material) => (
              <Card
                key={material.id}
                className="
                  group
                  cursor-pointer
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  shadow-sm
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:border-slate-300
                  hover:shadow-lg
                  dark:border-slate-800
                  dark:bg-slate-900
                  dark:hover:border-slate-700
                "
                onClick={() =>
                  handleOpen(
                    material
                  )
                }
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                      </div>

                      <h3 className="line-clamp-2 text-sm font-bold leading-5 text-slate-900 dark:text-white">
                        {material.title ||
                          "Untitled material"}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mt-4 line-clamp-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {materialSummary(material)}
                  </p>

                  {/* Metadata */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-400">
                      {material.category ||
                        "General"}
                    </span>

                    {material.tradition && (
                      <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-300">
                        {material.tradition}
                      </span>
                    )}

                    {(material.estimated_minutes || material.metadata?.estimated_minutes) && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Clock3 className="h-3 w-3" />
                        {material.estimated_minutes || material.metadata?.estimated_minutes} min
                      </span>
                    )}

                    {materialSources(material).length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                        <BadgeCheck className="h-3 w-3" />
                        Sources linked
                      </span>
                    )}

                    {material.year && (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {material.year}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      Open material →
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
