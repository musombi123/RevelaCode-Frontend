// src/components/study/StudyReader.jsx

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Download,
  RefreshCw,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/Card";

import AIStudyPanel from "./AIStudyPanel";

const API =
  import.meta.env.VITE_API_URL?.replace(
    /\/$/,
    ""
  ) ||
  "https://revelacode-backend.onrender.com";

const resolveMaterialId = (
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

export default function StudyReader({
  materialId,
  userId = "guest",
  initialMaterial = null,
  onBack,
}) {
  const [
    material,
    setMaterial,
  ] = useState(
    initialMaterial || null
  );

  const [loading, setLoading] =
    useState(!initialMaterial);

  const [error, setError] =
    useState("");

  const [bookmarked, setBookmarked] =
    useState(false);

  const [
    bookmarking,
    setBookmarking,
  ] = useState(false);

  /* =======================================================
     LOAD MATERIAL
  ======================================================= */

  const loadMaterial =
    useCallback(async () => {
      if (!materialId) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API}/study/material/${encodeURIComponent(
              materialId
            )}`
          );

        if (!response.ok) {
          throw new Error(
            `Failed to load material (${response.status})`
          );
        }

        const data =
          await response.json();

        if (!data?.material) {
          throw new Error(
            "Material was not returned by the server."
          );
        }

        setMaterial(
          data.material
        );
      } catch (err) {
        console.error(
          "Study Reader Error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load this study material."
        );
      } finally {
        setLoading(false);
      }
    }, [materialId]);

  useEffect(() => {
    if (
      initialMaterial &&
      resolveMaterialId(
        initialMaterial
      ) === materialId
    ) {
      setMaterial(
        initialMaterial
      );
      setLoading(false);
    } else {
      loadMaterial();
    }
  }, [
    initialMaterial,
    materialId,
    loadMaterial,
  ]);

  /* =======================================================
     CHECK BOOKMARK
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadBookmarkState =
      async () => {
        if (!userId || !materialId) {
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

          const materials =
            Array.isArray(
              data?.bookmarks
            )
              ? data.bookmarks
              : [];

          const exists =
            materials.some(
              (item) =>
                resolveMaterialId(
                  item
                ) ===
                String(
                  materialId
                )
            );

          if (!cancelled) {
            setBookmarked(
              exists
            );
          }
        } catch (err) {
          console.error(
            "Bookmark state error:",
            err
          );
        }
      };

    loadBookmarkState();

    return () => {
      cancelled = true;
    };
  }, [
    userId,
    materialId,
  ]);

  /* =======================================================
     BOOKMARK
  ======================================================= */

  const handleBookmark =
    useCallback(async () => {
      if (
        bookmarking ||
        bookmarked ||
        !materialId
      ) {
        return;
      }

      try {
        setBookmarking(true);

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
                  String(
                    materialId
                  ),
              }),
            }
          );

        if (!response.ok) {
          throw new Error(
            "Bookmark request failed."
          );
        }

        setBookmarked(true);
      } catch (err) {
        console.error(
          "Bookmark Error:",
          err
        );
      } finally {
        setBookmarking(false);
      }
    }, [
      bookmarking,
      bookmarked,
      materialId,
      userId,
    ]);

  /* =======================================================
     DOWNLOAD
  ======================================================= */

  const handleDownload = () => {
    if (!material) {
      return;
    }

    const content =
      [
        material.title,
        "",
        material.content,
      ]
        .filter(Boolean)
        .join("\n");

    const blob =
      new Blob(
        [content],
        {
          type: "text/plain;charset=utf-8",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href = url;

    anchor.download =
      `${material.title || "study-material"}.txt`;

    document.body.appendChild(
      anchor
    );

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(url);
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
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
            Opening study material...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !material) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
        <button
          type="button"
          onClick={onBack}
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            px-3
            py-2
            text-sm
            font-semibold
            text-gray-600
            transition
            hover:bg-gray-100
            dark:text-gray-300
            dark:hover:bg-gray-800
          "
        >
          <ArrowLeft size={17} />
          Back to Library
        </button>

        <div
          className="
            mt-6
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
            Unable to open material
          </h2>

          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error ||
              "Material not found."}
          </p>

          <button
            type="button"
            onClick={
              loadMaterial
            }
            className="
              mt-4
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-indigo-600
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
      </div>
    );
  }

  /* =======================================================
     READER
  ======================================================= */

  return (
    <div
      className="
        h-full
        min-h-0
        overflow-y-auto
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-7xl
          px-3
          py-4
          sm:px-5
          sm:py-6
          lg:px-8
          lg:py-8
        "
      >
        {/* Back */}

        <button
          type="button"
          onClick={onBack}
          className="
            mb-5
            inline-flex
            items-center
            gap-2
            rounded-xl
            px-3
            py-2
            text-sm
            font-semibold
            text-gray-600
            transition
            hover:bg-gray-100
            dark:text-gray-300
            dark:hover:bg-gray-800
          "
        >
          <ArrowLeft size={17} />
          Back to Library
        </button>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Material */}

          <Card
            className="
              overflow-hidden
              border-gray-200
              dark:border-gray-800
            "
          >
            <CardContent className="p-5 sm:p-7 lg:p-8">
              <div
                className="
                  flex
                  flex-col
                  gap-4
                  sm:flex-row
                  sm:items-start
                  sm:justify-between
                "
              >
                <div className="min-w-0">
                  <h1
                    className="
                      text-2xl
                      font-black
                      tracking-tight
                      text-gray-900
                      dark:text-white
                      sm:text-3xl
                    "
                  >
                    {material.title ||
                      "Study Material"}
                  </h1>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                      {material.category ||
                        "General"}
                    </span>

                    {material.subcategory && (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {
                          material.subcategory
                        }
                      </span>
                    )}

                    {material.year && (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {material.year}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={
                      handleBookmark
                    }
                    disabled={
                      bookmarking ||
                      bookmarked
                    }
                    className={`
                      flex
                      h-10
                      items-center
                      gap-2
                      rounded-xl
                      border
                      px-3
                      text-sm
                      font-semibold
                      transition
                      ${
                        bookmarked
                          ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      }
                    `}
                  >
                    {bookmarked ? (
                      <BookmarkCheck
                        size={17}
                      />
                    ) : (
                      <Bookmark
                        size={17}
                      />
                    )}

                    {bookmarked
                      ? "Bookmarked"
                      : bookmarking
                        ? "Saving..."
                        : "Bookmark"}
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleDownload
                    }
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-gray-200
                      text-gray-600
                      transition
                      hover:bg-gray-50
                      dark:border-gray-700
                      dark:text-gray-300
                      dark:hover:bg-gray-800
                    "
                    title="Download"
                  >
                    <Download
                      size={17}
                    />
                  </button>
                </div>
              </div>

              <div
                className="
                  mt-8
                  whitespace-pre-wrap
                  text-sm
                  leading-8
                  text-gray-700
                  dark:text-gray-300
                  sm:text-base
                "
              >
                {material.content ||
                  "No content available."}
              </div>
            </CardContent>
          </Card>

          {/* AI */}

          <div className="lg:sticky lg:top-6 lg:self-start">
            <AIStudyPanel
              material={{
                ...material,
                id:
                  resolveMaterialId(
                    material
                  ),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
