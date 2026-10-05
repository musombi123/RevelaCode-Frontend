"use client";

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Bookmark,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/Card";

const API = (
  import.meta.env.VITE_REVELACODE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  "https://revelacode-backend.onrender.com"
).replace(/\/+$/, "");

function resolveId(item) {
  return String(
    item?.id ??
      item?._id ??
      item?.material_id ??
      ""
  );
}

export default function BookmarksPanel({
  userId,
  onOpen,
}) {
  const [
    bookmarks,
    setBookmarks,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const loadBookmarks =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        if (
          !userId
        ) {
          setBookmarks([]);
          setLoading(false);
          return;
        }

        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

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
                credentials:
                  "include",
                cache: "no-store",
              }
            );

          const data =
            await response
              .json()
              .catch(
                () => ({})
              );

          if (!response.ok) {
            throw new Error(
              data?.message ||
                data?.error ||
                `Failed to load bookmarks (${response.status}).`
            );
          }

          const materials =
            Array.isArray(
              data?.bookmarks
            )
              ? data.bookmarks
              : [];

          setBookmarks(
            materials
              .map(
                (item) => ({
                  ...item,
                  id:
                    resolveId(
                      item
                    ),
                })
              )
              .filter(
                (item) =>
                  item.id
              )
          );
        } catch (err) {
          console.error(
            "Bookmarks Error:",
            err
          );

          setBookmarks([]);

          setError(
            err?.message ||
              "Unable to load saved study materials."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [userId]
    );

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  if (loading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            className="
              mx-auto
              h-7
              w-7
              animate-spin
              text-indigo-500
            "
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading saved study materials...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
            <Bookmark className="h-3 w-3" />
            Saved
          </span>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Saved Study
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Materials you have bookmarked for later study.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadBookmarks({
              silent: true,
            })
          }
          disabled={refreshing}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw
            className={
              refreshing
                ? "h-4 w-4 animate-spin"
                : "h-4 w-4"
            }
          />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />

            <div>
              <p className="font-bold">
                Saved Study unavailable
              </p>

              <p className="mt-1 text-xs leading-5">
                {error}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {!error &&
      bookmarks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <Bookmark className="mx-auto h-8 w-8 text-slate-400" />

          <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
            No saved materials
          </h3>

          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">
            Bookmark a study material and it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {bookmarks.map(
            (material) => (
              <Card
                key={material.id}
                className="cursor-pointer rounded-2xl border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                onClick={() =>
                  onOpen?.(
                    material
                  )
                }
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                      <Bookmark
                        className="h-5 w-5"
                        fill="currentColor"
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">
                        {material.title ||
                          "Untitled material"}
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        {material.category ||
                          "Study"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {material.description ||
                      material.content ||
                      "No preview available."}
                  </p>

                  <div className="mt-4 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Open material →
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