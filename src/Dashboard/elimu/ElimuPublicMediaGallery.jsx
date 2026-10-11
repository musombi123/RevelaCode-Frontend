
import React, { useEffect, useState } from "react";
import { Film, Image as ImageIcon, RefreshCw } from "lucide-react";

import { useElimuApi } from "@/services/elimuApi.jsx";

function unwrap(response) {
  let value = response;

  for (let i = 0; i < 5; i += 1) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return value;
    }

    if (value.success === false || value.ok === false) {
      throw new Error(value.message || "Unable to load school media.");
    }

    if (value.data && typeof value.data === "object") {
      value = value.data;
      continue;
    }

    return value;
  }

  return value;
}

export default function ElimuPublicMediaGallery({ schoolSlug }) {
  const api = useElimuApi();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setFailed(false);

      try {
        const response = await api.getPublicSchoolMedia(
          schoolSlug,
          undefined,
          { signal: controller.signal },
        );

        const data = unwrap(response);
        setItems(Array.isArray(data?.items) ? data.items : []);
      } catch (error) {
        if (error?.name !== "AbortError") {
          setFailed(true);
          setItems([]);
          console.error("Unable to load public school media:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (schoolSlug) void load();
    else setLoading(false);

    return () => controller.abort();
  }, [api, schoolSlug]);

  return (
    <section
      id="gallery"
      className="mt-14 scroll-mt-24"
      aria-labelledby="school-gallery-title"
    >
      <div className="mb-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
          <ImageIcon size={15} />
          Life at our school
        </div>

        <h2
          id="school-gallery-title"
          className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl"
        >
          Photos & videos
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Explore school facilities, learning activities, achievements and
          special moments.
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-32 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <RefreshCw size={21} className="animate-spin text-emerald-700" />
        </div>
      ) : items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const id = item.id || item._id;
            const isVideo = item.kind === "video";

            return (
              <article
                key={id || item.url}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-[16/11] overflow-hidden bg-slate-100">
                  {isVideo ? (
                    <video
                      src={item.url}
                      controls
                      preload="metadata"
                      aria-label={item.title || "School video"}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`View ${item.title || "school photo"} in full size`}
                    >
                      <img
                        src={item.url}
                        alt={item.alt_text || item.title || "School photo"}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    </a>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start gap-2">
                    {isVideo ? (
                      <Film size={17} className="mt-0.5 shrink-0 text-emerald-700" />
                    ) : (
                      <ImageIcon size={17} className="mt-0.5 shrink-0 text-emerald-700" />
                    )}

                    <div className="min-w-0">
                      <h3 className="break-words text-sm font-bold text-slate-900">
                        {item.title || (isVideo ? "School video" : "School photo")}
                      </h3>

                      {item.caption && (
                        <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-600">
                          {item.caption}
                        </p>
                      )}

                      {item.category && (
                        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          {item.category.replaceAll("_", " ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <ImageIcon size={28} className="mx-auto text-slate-400" />

          <h3 className="mt-4 font-bold text-slate-900">
            {failed ? "Gallery temporarily unavailable" : "Our gallery is coming soon"}
          </h3>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            {failed
              ? "School photos and videos could not be loaded right now."
              : "Published school photos and videos will appear here as the school shares them."}
          </p>
        </div>
      )}
    </section>
  );
}