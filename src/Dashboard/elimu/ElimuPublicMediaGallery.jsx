// src/pages/jumuiya/ElimuPublicMediaGallery.jsx

import React, { useEffect, useRef, useState } from "react";

import {
  AlertCircle,
  Film,
  Image as ImageIcon,
  RefreshCw,
  Video,
} from "lucide-react";

import { useElimuApi } from "@/services/elimuApi.jsx";

// ============================================================
// RESPONSE UTILITIES
// ============================================================

function unwrap(response) {
  let value = response;

  for (let i = 0; i < 6; i += 1) {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      return value;
    }

    if (value.success === false || value.ok === false) {
      throw new Error(
        value.message || "Unable to load school media."
      );
    }

    if (
      value.data &&
      typeof value.data === "object"
    ) {
      value = value.data;
      continue;
    }

    return value;
  }

  return value;
}

function getMediaCollection(response) {
  const data = unwrap(response);

  if (Array.isArray(data)) {
    return data;
  }

  const candidates = [
    data?.items,
    data?.media,
    data?.photos,
    data?.videos,
    data?.gallery,
    data?.records,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function getMediaUrl(item) {
  const url =
    item?.url ||
    item?.public_url ||
    item?.media_url ||
    item?.file_url ||
    item?.image_url ||
    item?.video_url ||
    item?.thumbnail_url ||
    "";

  return typeof url === "string" ? url.trim() : "";
}

function isVideoItem(item) {
  const kind = String(
    item?.kind ||
      item?.media_type ||
      item?.type ||
      item?.mime_type ||
      ""
  ).toLowerCase();

  if (
    kind === "video" ||
    kind.startsWith("video/")
  ) {
    return true;
  }

  if (
    kind === "image" ||
    kind.startsWith("image/")
  ) {
    return false;
  }

  const url = getMediaUrl(item)
    .split("?")[0]
    .split("#")[0]
    .toLowerCase();

  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(url);
}

function getMediaTitle(item, isVideo) {
  return (
    item?.title ||
    item?.name ||
    (isVideo ? "School video" : "School photo")
  );
}

// ============================================================
// LOADING PLACEHOLDERS
// ============================================================

function GallerySkeleton() {
  return (
    <div
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Loading school gallery"
      aria-busy="true"
    >
      {[1, 2, 3].map((item) => (
        <article
          key={item}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="aspect-[16/11] animate-pulse bg-slate-100" />

          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />

            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />

            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        </article>
      ))}
    </div>
  );
}

// ============================================================
// MEDIA FALLBACK
// ============================================================

function MediaFallback({ isVideo, title }) {
  const Icon = isVideo ? Film : ImageIcon;

  return (
    <div className="flex h-full min-h-44 flex-col items-center justify-center bg-slate-100 px-5 text-center text-slate-500">
      <Icon size={34} strokeWidth={1.5} />

      <p className="mt-3 text-sm font-semibold">
        Media unavailable
      </p>

      <p className="mt-1 max-w-xs break-words text-xs leading-5">
        {title || "This media file could not be displayed."}
      </p>
    </div>
  );
}

// ============================================================
// MEDIA CARD
// ============================================================

function SchoolMediaCard({ item }) {
  const [mediaError, setMediaError] = useState(false);

  const isVideo = isVideoItem(item);
  const url = getMediaUrl(item);
  const title = getMediaTitle(item, isVideo);

  const description =
    item?.alt_text ||
    item?.alt ||
    item?.caption ||
    title;

  const category =
    typeof item?.category === "string"
      ? item.category.replace(/_/g, " ")
      : "";

  const id =
    item?.id ||
    item?._id ||
    item?.media_id ||
    url;

  useEffect(() => {
    setMediaError(false);
  }, [url]);

  return (
    <article
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
    >
      {/* Media preview */}
      <div className="relative aspect-[16/11] overflow-hidden bg-slate-100">
        {mediaError || !url ? (
          <MediaFallback
            isVideo={isVideo}
            title={title}
          />
        ) : isVideo ? (
          <video
            key={url}
            src={url}
            controls
            preload="metadata"
            playsInline
            aria-label={title}
            onError={() => setMediaError(true)}
            className="h-full w-full bg-slate-950 object-contain"
          >
            Your browser does not support embedded videos.
          </video>
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${title} in full size`}
            className="block h-full w-full"
          >
            <img
              key={url}
              src={url}
              alt={description}
              loading="lazy"
              decoding="async"
              onError={() => setMediaError(true)}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          </a>
        )}

        {!mediaError && url && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/90 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm backdrop-blur-sm">
            {isVideo ? (
              <Film size={12} />
            ) : (
              <ImageIcon size={12} />
            )}

            {isVideo ? "Video" : "Photo"}
          </span>
        )}
      </div>

      {/* Media information */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            {isVideo ? (
              <Video size={17} />
            ) : (
              <ImageIcon size={17} />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="break-words text-sm font-bold leading-5 text-slate-900">
              {title}
            </h3>

            {item?.caption && (
              <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-600">
                {item.caption}
              </p>
            )}

            {category && (
              <p className="mt-3 inline-flex rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {category}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function GalleryEmptyState({
  failed,
  onRetry,
  retrying,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        {failed ? (
          <AlertCircle size={27} />
        ) : (
          <ImageIcon size={27} />
        )}
      </span>

      <h3 className="mt-5 text-base font-bold text-slate-900">
        {failed
          ? "Gallery temporarily unavailable"
          : "Our gallery is coming soon"}
      </h3>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        {failed
          ? "We could not retrieve the school's published photos and videos. Please try again."
          : "Published school photos, campus facilities, learning activities and special moments will appear here as they become available."}
      </p>

      {failed && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={retrying ? "animate-spin" : ""}
          />

          {retrying ? "Retrying..." : "Try again"}
        </button>
      )}
    </div>
  );
}

// ============================================================
// PUBLIC SCHOOL MEDIA GALLERY
// ============================================================

export default function ElimuPublicMediaGallery({
  schoolSlug,
}) {
  const api = useElimuApi();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retryVersion, setRetryVersion] = useState(0);

  /*
   * Keep the latest API method available without triggering
   * another gallery request whenever the API object identity
   * changes during a parent render.
   */
  const requestRef = useRef(api.getPublicSchoolMedia);

  useEffect(() => {
    requestRef.current = api.getPublicSchoolMedia;
  }, [api.getPublicSchoolMedia]);

  // ----------------------------------------------------------
  // Fetch publicly available school media
  // ----------------------------------------------------------

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadMedia() {
      setLoading(true);
      setFailed(false);

      if (!schoolSlug) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        const request = requestRef.current;

        if (typeof request !== "function") {
          throw new Error(
            "The public school media API method is unavailable."
          );
        }

        const response = await request(
          schoolSlug,
          undefined,
          { signal: controller.signal }
        );

        if (!active || controller.signal.aborted) {
          return;
        }

        const records = getMediaCollection(response);

        // Ignore malformed records without a usable media URL.
        const validItems = records.filter(
          (item) =>
            item &&
            typeof item === "object" &&
            Boolean(getMediaUrl(item))
        );

        setItems(validItems);
      } catch (error) {
        if (
          active &&
          !controller.signal.aborted &&
          error?.name !== "AbortError"
        ) {
          setFailed(true);
          setItems([]);

          console.error(
            "Unable to load public school media:",
            error
          );
        }
      } finally {
        if (active && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadMedia();

    return () => {
      active = false;
      controller.abort();
    };
  }, [schoolSlug, retryVersion]);

  // ----------------------------------------------------------
  // Retry
  // ----------------------------------------------------------

  const handleRetry = () => {
    setRetryVersion((version) => version + 1);
  };

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <section
      id="gallery"
      className="mt-14 scroll-mt-24"
      aria-labelledby="school-gallery-title"
    >
      {/* Heading */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
            <ImageIcon size={15} />
            Life at our school
          </div>

          <h2
            id="school-gallery-title"
            className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl"
          >
            Photos &amp; videos
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Explore our school facilities, learning activities,
            student achievements and special moments from school
            life.
          </p>
        </div>

        {!loading && items.length > 0 && (
          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
            <ImageIcon size={15} className="text-emerald-700" />

            {items.length}{" "}
            {items.length === 1 ? "item" : "published items"}
          </div>
        )}
      </div>

      {/* Gallery content */}
      {loading ? (
        <GallerySkeleton />
      ) : items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <SchoolMediaCard
              key={
                item.id ||
                item._id ||
                item.media_id ||
                getMediaUrl(item) ||
                index
              }
              item={item}
            />
          ))}
        </div>
      ) : (
        <GalleryEmptyState
          failed={failed}
          onRetry={handleRetry}
          retrying={loading}
        />
      )}
    </section>
  );
}
