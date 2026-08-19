// src/components/study/StudyFeed.jsx

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
  Clock3,
  FolderOpen,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/Card";

const API =
  import.meta.env.VITE_API_URL?.replace(
    /\/$/,
    ""
  ) ||
  "https://revelacode-backend.onrender.com";

const getMaterialId = (
  material
) => {
  const id =
    material?.id ??
    material?._id ??
    material?.material_id ??
    material?.materialId ??
    null;

  return id == null
    ? null
    : String(id);
};

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

  const [bookmarkingId, setBookmarkingId] =
    useState(null);

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD MATERIALS
  ======================================================= */

  const loadMaterials =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API}/study/materials`
          );

        if (!response.ok) {
          throw new Error(
            `Failed to load materials (${response.status})`
          );
        }

        const data =
          await response.json();

        setMaterials(
          Array.isArray(
            data?.materials
          )
            ? data.materials
            : []
        );
      } catch (err) {
        console.error(
          "Study feed error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load study materials."
        );

        setMaterials([]);
      } finally {
        setLoading(false);
      }
    }, []);

  /* =======================================================
     LOAD BOOKMARKS
  ======================================================= */

  const loadBookmarks =
    useCallback(async () => {
      if (!userId) {
        setBookmarks(
          new Set()
        );
        return;
      }

      try {
        const response =
          await fetch(
            `${API}/study/bookmarks/${encodeURIComponent(
              userId
            )}`
          );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        const ids = Array.isArray(
          data?.bookmarks
        )
          ? data.bookmarks
              .map(getMaterialId)
              .filter(Boolean)
          : [];

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
          getMaterialId(
            material
          );

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
         * Backend currently exposes add_bookmark,
         * not delete_bookmark, so don't pretend we
         * support true toggle deletion yet.
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
              `${API}/study/bookmark`,
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  user_id:
                    userId,
                  material_id:
                    materialId,
                }),
              }
            );

          if (!response.ok) {
            throw new Error(
              "Bookmark request failed."
            );
          }

          setBookmarks(
            (previous) => {
              const next =
                new Set(
                  previous
                );

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
      <div
        className="
          flex
          min-h-[320px]
          items-center
          justify-center
        "
      >
        <div className="text-center">
          <RefreshCw
            className="
              mx-auto
              h-8
              w-8
              animate-spin
              text-indigo-500
            "
          />

          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
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
      <div
        className="
          rounded-2xl
          border
          border-red-200
          bg-red-50
          p-6
          dark:border-red-900/50
          dark:bg-red-950/20
        "
      >
        <h2 className="font-bold text-red-700 dark:text-red-300">
          Study Library unavailable
        </h2>

        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>

        <button
          type="button"
          onClick={
            loadMaterials
          }
          className="
            mt-4
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-red-600
            px-4
            py-2.5
            text-sm
            font-semibold
            text-white
          "
        >
          <RefreshCw size={15} />
          Retry
        </button>
      </div>
    );
  }

  /* =======================================================
     EMPTY
  ======================================================= */

  if (materials.length === 0) {
    return (
      <div className="py-16 text-center">
        <BookOpen
          className="
            mx-auto
            h-12
            w-12
            text-gray-400
          "
        />

        <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
          No study materials yet
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
          Upload or publish study content
          from the administration system.
        </p>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6">
      {/* Header */}

      <div
        className="
          flex
          flex-col
          gap-4
          lg:flex-row
          lg:items-end
          lg:justify-between
        "
      >
        <div>
          <div className="flex items-center gap-2">
            <BookOpen
              size={22}
              className="text-indigo-600 dark:text-indigo-400"
            />

            <h1 className="text-2xl font-black text-gray-900 dark:text-white sm:text-3xl">
              Study Library
            </h1>
          </div>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Explore lessons, reference materials,
            and AI-assisted study content.
          </p>
        </div>

        <div
          className="
            flex
            items-center
            gap-2
            rounded-xl
            border
            border-gray-200
            bg-white
            px-3
            dark:border-gray-800
            dark:bg-gray-900
          "
        >
          <Search
            size={16}
            className="text-gray-400"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search materials..."
            className="
              h-10
              w-full
              min-w-0
              bg-transparent
              text-sm
              text-gray-900
              outline-none
              placeholder:text-gray-400
              dark:text-white
              sm:w-64
            "
          />
        </div>
      </div>

      {/* Results */}

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {filteredMaterials.length}{" "}
          {filteredMaterials.length === 1
            ? "material"
            : "materials"}
        </p>

        <p className="text-xs text-gray-400">
          {bookmarks.size} bookmarked
        </p>
      </div>

      {/* Cards */}

      {filteredMaterials.length === 0 ? (
        <div
          className="
            rounded-2xl
            border
            border-dashed
            border-gray-300
            p-12
            text-center
            dark:border-gray-700
          "
        >
          <Search
            className="mx-auto h-8 w-8 text-gray-400"
          />

          <p className="mt-3 font-semibold text-gray-700 dark:text-gray-300">
            No matching materials
          </p>
        </div>
      ) : (
        <div
          className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            xl:grid-cols-3
          "
        >
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

              return (
                <Card
                  key={
                    materialId ||
                    `${material.title}-${Math.random()}`
                  }
                  className="
                    group
                    overflow-hidden
                    border
                    border-gray-200
                    bg-white
                    shadow-sm
                    transition-all
                    duration-200
                    hover:-translate-y-1
                    hover:shadow-xl
                    dark:border-gray-800
                    dark:bg-gray-900
                  "
                >
                  <CardContent className="p-0">
                    <button
                      type="button"
                      onClick={() =>
                        onOpen?.({
                          ...material,
                          id: materialId,
                        })
                      }
                      className="
                        block
                        w-full
                        text-left
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          justify-between
                          border-b
                          border-gray-100
                          px-5
                          py-4
                          dark:border-gray-800
                        "
                      >
                        <div
                          className="
                            flex
                            h-10
                            w-10
                            items-center
                            justify-center
                            rounded-xl
                            bg-indigo-100
                            text-indigo-600
                            dark:bg-indigo-950/50
                            dark:text-indigo-400
                          "
                        >
                          <BookOpen size={19} />
                        </div>

                        <span
                          className="
                            text-xs
                            font-bold
                            text-indigo-600
                            dark:text-indigo-400
                          "
                        >
                          Open →
                        </span>
                      </div>

                      <div className="p-5">
                        <h2 className="line-clamp-2 text-base font-black text-gray-900 dark:text-white">
                          {material.title ||
                            "Untitled Material"}
                        </h2>

                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
                          {material.content
                            ? material.content.slice(
                                0,
                                180
                              ) +
                              (material.content.length >
                              180
                                ? "..."
                                : "")
                            : "No preview available."}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <span className="rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                            {material.category ||
                              "General"}
                          </span>

                          {material.year && (
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              {material.year}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Bookmark */}

                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        border-t
                        border-gray-100
                        px-5
                        py-3
                        dark:border-gray-800
                      "
                    >
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <FolderOpen size={13} />

                        <span>
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
                          items-center
                          justify-center
                          rounded-xl
                          transition
                          ${
                            bookmarked
                              ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300"
                              : "text-gray-400 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-800"
                          }
                        `}
                      >
                        {bookmarked ? (
                          <BookmarkCheck
                            size={18}
                          />
                        ) : (
                          <Bookmark
                            size={18}
                          />
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
