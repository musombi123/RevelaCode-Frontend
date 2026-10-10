// src/Dashboard/ElimuPublicSchoolPage.jsx

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useParams } from "react-router-dom";

import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Download,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  School,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { useElimuApi } from "@/services/elimuApi.jsx";

function unwrap(payload) {
  let current = payload;

  for (let i = 0; i < 5; i += 1) {
    if (
      !current ||
      typeof current !== "object" ||
      Array.isArray(current)
    ) {
      return current;
    }

    if (current.success === false || current.ok === false) {
      throw new Error(
        current.message ||
          current.error ||
          "The request was unsuccessful."
      );
    }

    if (
      current.data &&
      typeof current.data === "object"
    ) {
      current = current.data;
      continue;
    }

    return current;
  }

  return current;
}

function text(record, keys, fallback = "") {
  for (const key of keys) {
    const value = record?.[key];

    if (
      typeof value === "string" ||
      typeof value === "number"
    ) {
      const result = String(value).trim();

      if (result) return result;
    }
  }

  return fallback;
}

function records(payload, keys) {
  const result = unwrap(payload);

  if (Array.isArray(result)) return result;

  if (!result || typeof result !== "object") return [];

  for (const key of keys) {
    if (Array.isArray(result[key])) {
      return result[key];
    }
  }

  return [];
}

function getSchool(payload, slug) {
  const result = unwrap(payload);

  if (!result || typeof result !== "object") {
    return null;
  }

  const candidates = [
    result.school,
    result.public_school,
    result.profile,
    result.item,
    ...(Array.isArray(result.schools) ? result.schools : []),
  ];

  const wanted = String(slug || "").toLowerCase();

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;

    const candidateSlug = text(candidate, [
      "slug",
      "school_slug",
      "public_slug",
    ]).toLowerCase();

    if (
      candidateSlug === wanted ||
      (
        !candidateSlug &&
        !Array.isArray(result.schools) &&
        candidates.length === 1 &&
        (
          candidate.name ||
          candidate.school_name ||
          candidate.school_id
        )
      )
    ) {
      return candidate;
    }
  }

  return null;
}

function isPublic(record) {
  const status = text(
    record,
    ["status", "publication_status"]
  ).toLowerCase();

  const visibility = text(
    record,
    ["visibility", "access_level"]
  ).toLowerCase();

  return (
    record?.is_public !== false &&
    record?.published !== false &&
    visibility !== "private" &&
    ![
      "draft",
      "private",
      "pending",
      "rejected",
      "archived",
      "unpublished",
    ].includes(status)
  );
}

function recordId(record) {
  return text(record, [
    "id",
    "_id",
    "document_id",
    "event_id",
    "project_id",
    "uuid",
  ]);
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function filenameFor(document) {
  const original = text(document, [
    "filename",
    "file_name",
    "original_filename",
    "original_name",
  ]);

  if (original) return original.split(/[\\/]/).pop();

  const title = text(
    document,
    ["title", "name", "document_name"],
    "school-document"
  );

  return title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-") + ".pdf";
}

function SectionHeader({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
        <Icon size={15} />
        {eyebrow}
      </div>

      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
        {title}
      </h2>

      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <Icon size={23} />
      </div>

      <h3 className="mt-4 font-bold text-slate-900">{title}</h3>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function ResourceCard({
  item,
  kind,
  onDownload,
  downloadingId,
}) {
  const id = recordId(item);

  const title = text(
    item,
    ["title", "name", "document_name", "event_name", "project_name"],
    kind === "document" ? "School document" : "School update"
  );

  const description = text(
    item,
    ["description", "summary", "details"],
    "Official school information."
  );

  const date = text(item, [
    "published_at",
    "event_date",
    "start_date",
    "updated_at",
    "created_at",
    "date",
  ]);

  const category = text(item, [
    "category",
    "document_type",
    "type",
  ]);

  const downloading = id && downloadingId === id;

  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {kind === "event" ? (
            <CalendarDays size={21} />
          ) : kind === "project" ? (
            <BookOpen size={21} />
          ) : (
            <FileText size={21} />
          )}
        </div>

        <h3 className="min-w-0 break-words pt-1 text-sm font-extrabold leading-6 text-slate-900">
          {title}
        </h3>
      </div>

      <p className="mt-4 flex-1 whitespace-pre-line break-words text-sm leading-6 text-slate-600">
        {description}
      </p>

      {(date || category) && (
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
          {date && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={13} />
              {formatDate(date) || date}
            </span>
          )}

          {category && <span>{category}</span>}
        </div>
      )}

      {kind === "document" && (
        <button
          type="button"
          disabled={!id || Boolean(downloadingId)}
          onClick={() => onDownload(item)}
          className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloading ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}

          {downloading ? "Preparing download…" : "Download document"}
        </button>
      )}
    </article>
  );
}

export default function ElimuPublicSchoolPage() {
  const { schoolSlug = "" } = useParams();
  const api = useElimuApi();

  const [school, setSchool] = useState(null);
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloadingId, setDownloadingId] = useState("");

  const schoolName = text(
    school,
    ["school_name", "name", "display_name", "title"],
    String(schoolSlug)
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || "School"
  );

  const loadPage = useCallback(
    async ({ silent = false, signal } = {}) => {
      if (!schoolSlug) {
        setError("The school URL does not contain a school slug.");
        setLoading(false);
        return;
      }

      if (silent) setRefreshing(true);
      else setLoading(true);

      setError("");
      setDownloadError("");

      try {
        let foundSchool = null;
        let lastError = null;

        // First try fetching a specific published school.
        for (const params of [
          { slug: schoolSlug },
          { school_slug: schoolSlug },
        ]) {
          if (signal?.aborted) return;

          try {
            const response = await api.getPublicSchool(params, { signal });
            foundSchool = getSchool(response, schoolSlug);

            if (foundSchool) break;
          } catch (requestError) {
            if (requestError?.name === "AbortError") return;
            lastError = requestError;
          }
        }

        // If needed, check the registered public school directory.
        if (!foundSchool && typeof api.getPublicSchools === "function") {
          try {
            const response = await api.getPublicSchools(undefined, { signal });
            foundSchool = getSchool(response, schoolSlug);
            lastError = null;
          } catch (requestError) {
            if (requestError?.name === "AbortError") return;
            lastError = requestError;
          }
        }

        if (signal?.aborted) return;

        if (!foundSchool) {
          throw new Error(
            lastError?.message ||
              `No published school was found for "${schoolSlug}". Check that its public profile is enabled and the backend recognizes this slug.`
          );
        }

        setSchool(foundSchool);

        const schoolId = text(foundSchool, [
          "school_id",
          "id",
          "_id",
        ]);

        const query = {
          slug: schoolSlug,
          school_slug: schoolSlug,
          ...(schoolId ? { school_id: schoolId } : {}),
        };

        const [eventResult, projectResult, documentResult] =
          await Promise.allSettled([
            api.getPublicEvents(query, { signal }),
            api.getPublicCBCProjects(query, { signal }),
            api.getPublicDocuments(query, { signal }),
          ]);

        if (signal?.aborted) return;

        setEvents(
          eventResult.status === "fulfilled"
            ? records(eventResult.value, [
                "events",
                "items",
                "results",
                "calendar",
              ]).filter(isPublic)
            : []
        );

        setProjects(
          projectResult.status === "fulfilled"
            ? records(projectResult.value, [
                "projects",
                "items",
                "results",
                "cbc_projects",
              ]).filter(isPublic)
            : []
        );

        setDocuments(
          documentResult.status === "fulfilled"
            ? records(documentResult.value, [
                "documents",
                "items",
                "results",
                "files",
              ]).filter(isPublic)
            : []
        );

        setError("");
      } catch (requestError) {
        if (requestError?.name === "AbortError") return;

        setSchool(null);
        setEvents([]);
        setProjects([]);
        setDocuments([]);

        setError(
          requestError?.message ||
            "Could not load the public school page."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [api, schoolSlug]
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadPage({ signal: controller.signal });

    return () => controller.abort();
  }, [loadPage]);

  useEffect(() => {
    window.document.title = school
      ? `${schoolName} | Jumuiya Elimu`
      : "Jumuiya Elimu | School Website";

    return () => {
      window.document.title = "RevelaCode";
    };
  }, [school, schoolName]);

  const handleDownload = useCallback(
    async (document) => {
      const id = recordId(document);

      if (!id) {
        setDownloadError("This document has no valid document ID.");
        return;
      }

      setDownloadingId(id);
      setDownloadError("");

      let objectUrl = "";

      try {
        const blob = await api.downloadPublicDocument(id);

        if (!(blob instanceof Blob) || blob.size === 0) {
          throw new Error(
            "The server did not return a valid document file."
          );
        }

        objectUrl = URL.createObjectURL(blob);

        const link = window.document.createElement("a");
        link.href = objectUrl;
        link.download = filenameFor(document);
        link.style.display = "none";

        window.document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
        objectUrl = "";
      } catch (requestError) {
        setDownloadError(
          requestError?.message ||
            "The document could not be downloaded. Please try again."
        );
      } finally {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        setDownloadingId("");
      }
    },
    [api]
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white">
            <GraduationCap size={27} />
          </div>

          <RefreshCw
            size={21}
            className="mx-auto mt-5 animate-spin text-emerald-700"
          />

          <h1 className="mt-4 text-lg font-extrabold text-slate-900">
            Loading school website
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Retrieving published school information.
          </p>
        </div>
      </main>
    );
  }

  if (!school) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <School size={27} />
          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-slate-950">
            School page unavailable
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            We couldn't find a public school profile for{" "}
            <strong>{schoolSlug}</strong>. The school needs a published
            profile that is discoverable by this URL slug.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm leading-6 text-red-800"
            >
              <XCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => loadPage({ silent: true })}
            disabled={refreshing}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Try again
          </button>

          <p className="mt-5 text-xs text-slate-500">
            <a href="/" className="font-bold text-emerald-700">
              Return to RevelaCode
            </a>
          </p>
        </section>
      </main>
    );
  }

  const about = text(
    school,
    ["public_description", "about", "description", "about_school", "mission"],
    "Welcome to our school. Contact the school for more information."
  );

  const location =
    text(school, ["physical_address", "address", "location"]) ||
    [
      text(school, ["town", "city"]),
      text(school, ["county", "region"]),
    ]
      .filter(Boolean)
      .join(", ") ||
    "Contact the school for location details.";

  const phone = text(school, [
    "contact_phone",
    "phone",
    "telephone",
    "phone_number",
  ]);

  const email = text(school, [
    "contact_email",
    "email",
    "email_address",
  ]);

  const logo = text(school, ["logo_url", "logo", "image_url"]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="#home" className="flex min-w-0 items-center gap-3">
            {logo ? (
              <img
                src={logo}
                alt=""
                className="h-11 w-11 rounded-xl object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-white">
                <School size={23} />
              </span>
            )}

            <span className="min-w-0">
              <span className="block max-w-[230px] truncate text-sm font-extrabold sm:max-w-md">
                {schoolName}
              </span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Official school website
              </span>
            </span>
          </a>

          <a
            href="#documents"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-800 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 sm:px-4 sm:text-sm"
          >
            <FileText size={15} />
            Documents
          </a>
        </div>
      </header>

      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-emerald-800 text-white"
      >
        <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full border border-white/10 shadow-[0_0_0_40px_rgba(255,255,255,0.03),0_0_0_90px_rgba(255,255,255,0.02)]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_0.55fr] lg:items-center lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
              <ShieldCheck size={15} />
              School information and resources
            </div>

            <h1 className="mt-6 max-w-3xl break-words text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {schoolName}
            </h1>

            <p className="mt-5 max-w-2xl whitespace-pre-line text-sm leading-8 text-emerald-50/90 sm:text-base">
              {about}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#about"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50"
              >
                Discover our school
                <ArrowRight size={16} />
              </a>

              <a
                href="#documents"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/15"
              >
                <ArrowDownToLine size={16} />
                Public documents
              </a>
            </div>
          </div>

          <aside className="rounded-3xl border border-white/15 bg-white/[0.08] p-6 backdrop-blur">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-emerald-100">
              <GraduationCap size={26} />
            </div>

            <h2 className="mt-5 text-xl font-extrabold">
              Welcome to our school
            </h2>

            <p className="mt-3 text-sm leading-7 text-emerald-50/85">
              Find official school information, published announcements,
              academic highlights, and school resources in one place.
            </p>

            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-100">
              <ShieldCheck size={15} />
              Powered by Jumuiya Elimu
            </div>
          </aside>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section id="about" className="scroll-mt-24">
          <SectionHeader
            icon={School}
            eyebrow="Get to know us"
            title="About our school"
            description="School information and official contact details published by the school."
          />

          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-extrabold">Our school</h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                {about}
              </p>

              {text(school, ["motto", "tagline"]) && (
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <h3 className="font-extrabold">Our motto</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {text(school, ["motto", "tagline"])}
                  </p>
                </div>
              )}

              {text(school, ["vision"]) && (
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <h3 className="font-extrabold">Our vision</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {text(school, ["vision"])}
                  </p>
                </div>
              )}
            </article>

            <aside className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-extrabold">Contact the school</h3>

              <div className="mt-5 space-y-5">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 shrink-0 text-emerald-700" size={19} />
                  <div>
                    <p className="text-xs text-slate-500">Location</p>
                    <p className="mt-1 break-words text-sm font-semibold">
                      {location}
                    </p>
                  </div>
                </div>

                {phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 shrink-0 text-emerald-700" size={19} />
                    <div>
                      <p className="text-xs text-slate-500">Telephone</p>
                      <a
                        href={`tel:${phone}`}
                        className="mt-1 block break-words text-sm font-semibold hover:text-emerald-700"
                      >
                        {phone}
                      </a>
                    </div>
                  </div>
                )}

                {email && (
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 shrink-0 text-emerald-700" size={19} />
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <a
                        href={`mailto:${email}`}
                        className="mt-1 block break-words text-sm font-semibold hover:text-emerald-700"
                      >
                        {email}
                      </a>
                    </div>
                  </div>
                )}

                {!phone && !email && (
                  <p className="text-sm leading-6 text-slate-500">
                    Contact information has not been published yet.
                  </p>
                )}
              </div>
            </aside>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mt-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
          >
            <XCircle size={18} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              Some school resources could not be loaded. {error}
            </div>
          </div>
        )}

        <section id="events" className="mt-14 scroll-mt-24">
          <SectionHeader
            icon={CalendarDays}
            eyebrow="What's happening"
            title="School news and events"
            description="Public events and announcements published by the school."
          />

          {events.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {events.slice(0, 9).map((item, index) => (
                <ResourceCard
                  key={recordId(item) || `event-${index}`}
                  item={item}
                  kind="event"
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No public events yet"
              description="Published school events and announcements will appear here when available."
            />
          )}
        </section>

        <section id="learning" className="mt-14 scroll-mt-24">
          <SectionHeader
            icon={BookOpen}
            eyebrow="Learning and achievement"
            title="Academic highlights"
            description="CBC projects and learning highlights chosen for public viewing."
          />

          {projects.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projects.slice(0, 9).map((item, index) => (
                <ResourceCard
                  key={recordId(item) || `project-${index}`}
                  item={item}
                  kind="project"
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="Academic highlights coming soon"
              description="Public academic projects will appear here once the school publishes them."
            />
          )}
        </section>

        <section id="documents" className="mt-14 scroll-mt-24">
          <SectionHeader
            icon={FileText}
            eyebrow="School resources"
            title="Documents library"
            description="Download the public school documents approved for publication."
          />

          {downloadError && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
            >
              {downloadError}
            </div>
          )}

          {documents.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {documents.slice(0, 12).map((item, index) => (
                <ResourceCard
                  key={recordId(item) || `document-${index}`}
                  item={item}
                  kind="document"
                  onDownload={handleDownload}
                  downloadingId={downloadingId}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No public documents available"
              description="School-approved public documents will appear here when published."
            />
          )}

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
            <ShieldCheck size={19} className="mt-0.5 shrink-0" />

            <p>
              This library is for public documents only. Private student
              records, report cards, and individual fee statements require
              authenticated, authorized access.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-7">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-xs text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>
            <strong className="text-slate-800">{schoolName}</strong>
            {" "}· Public school website
          </p>

          <div className="flex flex-wrap gap-4">
            <a href="#about" className="hover:text-emerald-700">About</a>
            <a href="#events" className="hover:text-emerald-700">Events</a>
            <a href="#documents" className="hover:text-emerald-700">Documents</a>
            <a href="/" className="font-bold text-emerald-700">RevelaCode</a>
          </div>

          <p>Powered by Jumuiya Elimu</p>
        </div>
      </footer>
    </div>
  );
}