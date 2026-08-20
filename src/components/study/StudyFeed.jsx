"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BookOpen,
  Bookmark,
  BookmarkCheck,
  FolderOpen,
  RefreshCw,
  Search,
  AlertCircle,
  GraduationCap,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/Card";

const API =
  (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    "https://revelacode-backend.onrender.com"
  ).replace(/\/$/, "");

/* =========================================================
   MATERIAL ID
========================================================= */

const getMaterialId = (material) => {
  if (!material) return null;

  const id =
    material.id ??
    material._id ??
    material.material_id ??
    material.materialId ??
    null;

  return id == null ? null : String(id);
};

/* =========================================================
   STUDY FEED
========================================================= */

export default function StudyFeed({
  userId = "guest",
  onOpen,
}) {
  const [materials, setMaterials] =
    useState([]);

  const [bookmarks, setBookmarks] =
    useState(new Set());

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [bookmarkingId, setBookmarkingId] =
    useState(null);

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD MATERIALS
  ======================================================= */

  const loadMaterials = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        /*
         * IMPORTANT:
         * Use the API namespace used by the rest of
         * the RevelaCode backend.
         */
        const response = await fetch(
          `${API}/api/study/materials`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            credentials: "include",
            cache: "no-store",
          }
        );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              `Failed to load materials (${response.status})`
          );
        }

        /*
         * Support:
         * { materials: [] }
         * { data: [] }
         * []
         */
        const rawMaterials =
          Array.isArray(data?.materials)
            ? data.materials
            : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
            ? data
            : [];

        const normalizedMaterials =
          rawMaterials
            .map((material) => ({
              ...material,
              id: getMaterialId(
                material
              ),
            }))
            .filter(
              (material) =>
                material.id
            );

        setMaterials(
          normalizedMaterials
        );
      } catch (err) {
        console.error(
          "Study feed error:",
          err
        );

        setMaterials([]);

        setError(
          err?.message ||
            "Unable to load study materials."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /* =======================================================
     LOAD BOOKMARKS
  ======================================================= */

  const loadBookmarks =
    useCallback(async () => {
      if (
        !userId ||
        userId === "guest"
      ) {
        setBookmarks(new Set());
        return;
      }

      try {
        const response =
          await fetch(
            `${API}/api/study/bookmarks/${encodeURIComponent(
              userId
            )}`,
            {
              method: "GET",
              headers: {
                Accept:
                  "application/json",
              },
              credentials: "include",
              cache: "no-store",
            }
          );

        if (!response.ok) {
          console.warn(
            "Bookmark endpoint returned:",
            response.status
          );

          return;
        }

        const data =
          await response
            .json()
            .catch(() => ({}));

        const rawBookmarks =
          Array.isArray(
            data?.bookmarks
          )
            ? data.bookmarks
            : Array.isArray(
                data?.data
              )
            ? data.data
            : [];

        const ids =
          rawBookmarks
            .map(getMaterialId)
            .filter(Boolean);

        setBookmarks(
          new Set(ids)
        );
      } catch (err) {
        console.error(
          "Bookmark loading error:",
          err
        );
      }
    }, [userId]);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  /* =======================================================
     BOOKMARK
  ======================================================= */

  const toggleBookmark =
    useCallback(
      async (
        event,
        material
      ) => {
        event.stopPropagation();

        const materialId =
          getMaterialId(material);

        if (
          !materialId ||
          bookmarkingId
        ) {
          return;
        }

        const alreadyBookmarked =
          bookmarks.has(
            materialId
          );

        /*
         * Your current backend exposes add_bookmark
         * but apparently not delete_bookmark.
         *
         * So we keep the current one-way behavior.
         */
        if (alreadyBookmarked) {
          return;
        }

        try {
          setBookmarkingId(
            materialId
          );

          const response =
            await fetch(
              `${API}/api/study/bookmark`,
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                  Accept:
                    "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                  user_id:
                    userId,
                  material_id:
                    materialId,
                }),
              }
            );

          const data =
            await response
              .json()
              .catch(() => ({}));

          if (!response.ok) {
            throw new Error(
              data?.message ||
                data?.error ||
                "Bookmark request failed."
            );
          }

          setBookmarks(
            (previous) => {
              const next =
                new Set(previous);

              next.add(
                materialId
              );

              return next;
            }
          );
        } catch (err) {
          console.error(
            "Bookmark error:",
            err
          );
        } finally {
          setBookmarkingId(
            null
          );
        }
      },
      [
        bookmarks,
        bookmarkingId,
        userId,
      ]
    );

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredMaterials =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return materials;
      }

      return materials.filter(
        (material) => {
          const haystack = [
            material?.title,
            material?.category,
            material?.subcategory,
            material?.description,
            material?.content,
            ...(Array.isArray(
              material?.tags
            )
              ? material.tags
              : []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(
            query
          );
        }
      );
    }, [
      materials,
      search,
    ]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-emerald-500" />

          <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading study materials...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/40 dark:bg-red-950/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />

          <div>
            <h2 className="font-bold text-red-700 dark:text-red-300">
              Study Library unavailable
            </h2>

            <p className="mt-1 text-sm leading-6 text-red-600 dark:text-red-400">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                loadMaterials()
              }
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     EMPTY
  ======================================================= */

  if (materials.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <GraduationCap className="h-7 w-7 text-slate-400" />
        </div>

        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          No study materials yet
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
          Materials published through the administration
          system will appear here.
        </p>

        <button
          type="button"
          onClick={() =>
            loadMaterials()
          }
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh library
        </button>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-400">
            <BookOpen className="h-3 w-3" />
            Learning
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Study Library
          </h1>

          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Explore lessons, reference materials, and AI-assisted
            study content.
          </p>
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search materials..."
              className="
                h-11
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                pl-10
                pr-3
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
              "
            />
          </div>

          <button
            type="button"
            onClick={() =>
              loadMaterials({
                silent: true,
              })
            }
            disabled={refreshing}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Refresh study library"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* =================================================
          RESULTS
      ================================================= */}

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400">
          {filteredMaterials.length}{" "}
          {filteredMaterials.length === 1
            ? "material"
            : "materials"}
        </p>

        <p className="text-xs text-slate-400">
          {bookmarks.size} bookmarked
        </p>
      </div>

      {/* =================================================
          SEARCH EMPTY
      ================================================= */}

      {filteredMaterials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <Search className="mx-auto h-8 w-8 text-slate-400" />

          <p className="mt-3 font-semibold text-slate-700 dark:text-slate-300">
            No matching materials
          </p>

          <button
            type="button"
            onClick={() =>
              setSearch("")
            }
            className="mt-2 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            Clear search
          </button>
        </div>
      ) : (
        /* =================================================
           CARDS
        ================================================= */

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredMaterials.map(
            (material) => {
              const materialId =
                getMaterialId(
                  material
                );

              const bookmarked =
                bookmarks.has(
                  materialId
                );

              const description =
                material.description ||
                material.content ||
                "";

              return (
                <Card
                  key={materialId}
                  className="
                    group
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
                >
                  <CardContent className="p-0">
                    {/* Open */}
                    <button
                      type="button"
                      onClick={() =>
                        onOpen?.({
                          ...material,
                          id: materialId,
                        })
                      }
                      className="block w-full text-left"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                          <BookOpen className="h-5 w-5" />
                        </div>

                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          Open →
                        </span>
                      </div>

                      <div className="p-5">
                        <h2 className="line-clamp-2 text-base font-black leading-6 text-slate-900 dark:text-white">
                          {material.title ||
                            "Untitled Material"}
                        </h2>

                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                          {description ||
                            "No preview available."}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-400">
                            {material.category ||
                              "General"}
                          </span>

                          {material.year && (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {material.year}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Bookmark */}
                    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <FolderOpen className="h-3.5 w-3.5" />

                        <span className="truncate">
                          {material.subcategory ||
                            "Study Resource"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(event) =>
                          toggleBookmark(
                            event,
                            material
                          )
                        }
                        disabled={
                          bookmarkingId ===
                          materialId
                        }
                        aria-label={
                          bookmarked
                            ? "Bookmarked"
                            : "Bookmark material"
                        }
                        title={
                          bookmarked
                            ? "Bookmarked"
                            : "Bookmark"
                        }
                        className={`
                          flex
                          h-9
                          w-9
                          flex-shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          transition
                          ${
                            bookmarked
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                              : "text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                          }
                        `}
                      >
                        {bookmarked ? (
                          <BookmarkCheck className="h-4.5 w-4.5" />
                        ) : (
                          <Bookmark className="h-4.5 w-4.5" />
                        )}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
