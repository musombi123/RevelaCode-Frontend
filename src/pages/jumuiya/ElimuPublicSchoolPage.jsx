import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  Mail,
  MapPin,
  Menu,
  Phone,
  RefreshCw,
  School,
  ShieldCheck,
  Video,
  X,
  XCircle,
  Users,
} from "lucide-react";
import { useElimuApi } from "@/services/elimuApi.jsx";

const NAV_ITEMS = [
  { path: "", label: "Home", icon: School },
  { path: "about", label: "About", icon: GraduationCap },
  { path: "events", label: "Events", icon: CalendarDays },
  { path: "academics", label: "Academics", icon: BookOpen },
  { path: "activities", label: "Co-curricular", icon: CalendarDays },
  { path: "teachers", label: "Teachers & services", icon: Users },
  { path: "media", label: "Photos & videos", icon: ImageIcon },
  { path: "documents", label: "Documents", icon: FileText },
  { path: "contact", label: "Contact", icon: Mail },
];

const ROUTE_ALIASES = {
  home: "",
  index: "",
  news: "events",
  calendar: "events",
  learning: "academics",
  clubs: "activities",
  sports: "activities",
  faculty: "teachers",
  staff: "teachers",
  services: "teachers",
  gallery: "media",
  photos: "media",
  videos: "media",
  resources: "documents",
};

function unwrap(payload) {
  let current = payload;
  for (let i = 0; i < 6; i += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return current;
    }
    if (current.success === false || current.ok === false) {
      throw new Error(
        current.message || current.error?.message || current.error || "The request was unsuccessful."
      );
    }
    if (current.data && typeof current.data === "object") {
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
    if (typeof value === "string" || typeof value === "number") {
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
    if (Array.isArray(result[key])) return result[key];
  }
  if (result.data && typeof result.data === "object") {
    for (const key of keys) {
      if (Array.isArray(result.data[key])) return result.data[key];
    }
  }
  return [];
}

function schoolSlugOf(school) {
  return text(school, ["public_slug", "slug", "school_slug", "code", "school_code"])
    .toLowerCase();
}

function getSchool(payload, expectedSlug, allowSingleProfile = false) {
  const result = unwrap(payload);
  if (!result || typeof result !== "object") return null;
  const isList = Array.isArray(result.schools);
  const candidates = [
    result.school,
    result.public_school,
    result.profile,
    result.item,
    ...(isList ? result.schools : []),
  ].filter((item) => item && typeof item === "object");
  const wanted = String(expectedSlug || "").toLowerCase();

  for (const candidate of candidates) {
    if (schoolSlugOf(candidate) === wanted) return candidate;
  }

  // A school-specific endpoint can return its canonical profile without echoing
  // the slug. Never use this fallback with the directory/list response.
  if (allowSingleProfile && !isList && candidates.length === 1) {
    return candidates[0];
  }
  return null;
}

function isPublic(record) {
  const status = text(record, ["status", "publication_status"]).toLowerCase();
  const visibility = text(record, ["visibility", "access_level"]).toLowerCase();
  return (
    record?.is_public !== false &&
    record?.published !== false &&
    visibility !== "private" &&
    !["draft", "private", "pending", "rejected", "archived", "unpublished"].includes(status)
  );
}

function recordId(record) {
  return text(record, ["id", "_id", "document_id", "event_id", "project_id", "uuid"]);
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
  const original = text(document, ["filename", "file_name", "original_filename", "original_name"]);
  if (original) return original.split(/[\\/]/).pop();
  const title = text(document, ["title", "name", "document_name"], "school-document");
  return `${title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")}.pdf`;
}

function absoluteSchoolUrl(slug, page = "") {
  const base = `/${encodeURIComponent(String(slug || "").trim())}`;
  return page ? `${base}/${page}` : base;
}

function PageHeading({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">
        <Icon size={15} />
        {eyebrow}
      </div>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
      {description && <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon size={23} /></div>
      <h2 className="mt-4 font-extrabold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function ResourceCard({ item, kind = "event", onDownload, downloadingId }) {
  const id = recordId(item);
  const title = text(item, ["title", "name", "document_name", "event_name", "project_name"], kind === "document" ? "School document" : "School update");
  const description = text(item, ["description", "summary", "details"], "Official school information.");
  const date = text(item, ["published_at", "event_date", "start_date", "updated_at", "created_at", "date"]);
  const category = text(item, ["category", "document_type", "type"]);
  const downloading = Boolean(id && downloadingId === id);
  const Icon = kind === "event" ? CalendarDays : kind === "project" ? BookOpen : FileText;

  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Icon size={21} /></div>
        <h2 className="min-w-0 break-words pt-1 text-sm font-extrabold leading-6 text-slate-900">{title}</h2>
      </div>
      <p className="mt-4 flex-1 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{description}</p>
      {(date || category) && (
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
          {date && <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} />{formatDate(date) || date}</span>}
          {category && <span className="capitalize">{category.replace(/[_-]+/g, " ")}</span>}
        </div>
      )}
      {kind === "document" && (
        <button
          type="button"
          disabled={!id || Boolean(downloadingId)}
          onClick={() => onDownload(item)}
          className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
          {downloading ? "Preparing download…" : "Download document"}
        </button>
      )}
    </article>
  );
}

function MediaCard({ item }) {
  const url = text(item, ["url", "secure_url", "media_url", "file_url"]);
  const title = text(item, ["title", "caption", "alt_text", "name"], "School photo or video");
  const format = text(item, ["format", "resource_type", "kind", "media_type"]).toLowerCase();
  const isVideo = format.includes("video") || ["mp4", "mov", "m4v", "webm"].includes(format) || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
  if (!url) return null;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="aspect-[4/3] bg-slate-100">
        {isVideo ? (
          <video className="h-full w-full object-cover" src={url} controls preload="metadata" aria-label={title} />
        ) : (
          <a href={url} target="_blank" rel="noreferrer" className="block h-full w-full" aria-label={`Open ${title}`}>
            <img src={url} alt={text(item, ["alt_text", "caption", "title"], title)} loading="lazy" className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]" />
          </a>
        )}
      </div>
      <div className="p-4">
        <h2 className="break-words text-sm font-extrabold text-slate-900">{title}</h2>
        {text(item, ["caption", "description"]) && <p className="mt-1 text-sm leading-6 text-slate-600">{text(item, ["caption", "description"])}</p>}
      </div>
    </article>
  );
}

function FeatureLink({ href, icon: Icon, title, description }) {
  return (
    <Link to={href} className="group flex h-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-200 hover:shadow-md">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Icon size={20} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-slate-900">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-500">{description}</span>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-700">Explore <ArrowRight size={13} className="transition group-hover:translate-x-0.5" /></span>
      </span>
    </Link>
  );
}

function OfferingCard({ title, eyebrow, description, details = [], tags = [] }) {
  const cleanDetails = details.filter(Boolean);
  const cleanTags = (Array.isArray(tags) ? tags : String(tags || "").split(/[,;]+/))
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      {eyebrow && <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-emerald-700">{eyebrow}</p>}
      <h3 className="mt-2 break-words text-lg font-extrabold text-slate-950">{title}</h3>
      {description && <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{description}</p>}
      {cleanTags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{cleanTags.map((tag, index) => <span key={`${tag}-${index}`} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">{tag}</span>)}</div>}
      {cleanDetails.length > 0 && <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4">{cleanDetails.map((detail, index) => <div key={`${detail}-${index}`} className="text-xs leading-5 text-slate-500">{detail}</div>)}</dl>}
    </article>
  );
}

function PublicOfferingGrid({ items, emptyTitle, emptyDescription, icon: Icon = BookOpen, renderItem }) {
  if (!items.length) return <EmptyState icon={Icon} title={emptyTitle} description={emptyDescription} />;
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item, index) => renderItem(item, index))}</div>;
}

export default function ElimuPublicSchoolPage() {
  const { schoolSlug = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const api = useElimuApi();

  const [school, setSchool] = useState(null);
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [resourceWarning, setResourceWarning] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloadingId, setDownloadingId] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pageSegment = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    return String(segments[1] || "").toLowerCase();
  }, [location.pathname]);
  const canonicalPage = ROUTE_ALIASES[pageSegment] ?? pageSegment;
  const validPages = useMemo(() => new Set(NAV_ITEMS.map((item) => item.path)), []);
  const schoolName = text(school, ["school_name", "name", "display_name", "title"], String(schoolSlug).split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") || "School");
  const homeUrl = absoluteSchoolUrl(schoolSlug);
  const pageUrl = useCallback((page = "") => absoluteSchoolUrl(schoolSlug, page), [schoolSlug]);

  const loadPage = useCallback(async ({ silent = false, signal } = {}) => {
    if (!schoolSlug) {
      setError("The school URL does not contain a school slug.");
      setLoading(false);
      return;
    }
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    setResourceWarning("");
    setDownloadError("");

    try {
      let foundSchool = null;
      let lastError = null;
      for (const params of [{ school_code: schoolSlug }, { code: schoolSlug }]) {
        if (signal?.aborted) return;
        try {
          const response = await api.getPublicSchool(params, { signal });
          foundSchool = getSchool(response, schoolSlug, true);
          if (foundSchool) break;
        } catch (requestError) {
          if (requestError?.name === "AbortError") return;
          lastError = requestError;
        }
      }

      if (!foundSchool && typeof api.getPublicSchools === "function") {
        try {
          const directoryResponse = await api.getPublicSchools({ limit: 100 }, { signal });
          foundSchool = getSchool(directoryResponse, schoolSlug, false);
          if (!foundSchool) {
            const directory = records(directoryResponse, ["schools", "items", "results"]);
            foundSchool = directory.find((item) => schoolSlugOf(item) === schoolSlug.toLowerCase()) || null;
          }
        } catch (requestError) {
          if (requestError?.name === "AbortError") return;
          lastError = requestError;
        }
      }

      if (signal?.aborted) return;
      if (!foundSchool) {
        throw new Error(lastError?.message || `No published school was found for "${schoolSlug}". Check its public profile slug and publication status.`);
      }
      setSchool(foundSchool);

      const id = text(foundSchool, ["id", "_id", "school_id"]);
      const query = id ? { school_id: id, limit: 50 } : { school_code: schoolSlug, limit: 50 };
      const mediaRequest = typeof api.getPublicSchoolMedia === "function"
        ? api.getPublicSchoolMedia(schoolSlug, { limit: 50 }, { signal })
        : Promise.reject(new Error("Public school media is not configured."));
      const results = await Promise.allSettled([
        api.getPublicEvents(query, { signal }),
        api.getPublicCBCProjects(query, { signal }),
        api.getPublicDocuments(query, { signal }),
        mediaRequest,
      ]);
      if (signal?.aborted) return;

      const [eventResult, projectResult, documentResult, mediaResult] = results;
      setEvents(eventResult.status === "fulfilled" ? records(eventResult.value, ["events", "items", "results", "calendar"]).filter(isPublic) : []);
      setProjects(projectResult.status === "fulfilled" ? records(projectResult.value, ["projects", "items", "results", "cbc_projects"]).filter(isPublic) : []);
      setDocuments(documentResult.status === "fulfilled" ? records(documentResult.value, ["documents", "items", "results", "files"]).filter(isPublic) : []);
      setMedia(mediaResult.status === "fulfilled" ? records(mediaResult.value, ["items", "media", "photos", "files", "results"]).filter(isPublic) : []);

      const failedResources = results.filter((result) => result.status === "rejected");
      if (failedResources.length) {
        setResourceWarning("Some sections are temporarily unavailable. The school profile is available, but one or more public resource endpoints could not be loaded.");
      }
      setError("");
    } catch (requestError) {
      if (requestError?.name === "AbortError") return;
      setSchool(null);
      setEvents([]);
      setProjects([]);
      setDocuments([]);
      setMedia([]);
      setError(requestError?.message || "Could not load the public school website.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [api, schoolSlug]);

  useEffect(() => {
    const controller = new AbortController();
    void loadPage({ signal: controller.signal });
    return () => controller.abort();
  }, [loadPage]);

  useEffect(() => {
    if (!validPages.has(canonicalPage)) {
      navigate(homeUrl, { replace: true });
      return;
    }
    setMobileMenuOpen(false);
  }, [canonicalPage, homeUrl, navigate, validPages]);

  useEffect(() => {
    window.document.title = school ? `${schoolName} | Jumuiya Elimu` : "Jumuiya Elimu | School Website";
    return () => { window.document.title = "RevelaCode"; };
  }, [school, schoolName]);

  const handleDownload = useCallback(async (document) => {
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
      if (!(blob instanceof Blob) || blob.size === 0) throw new Error("The server did not return a valid document file.");
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
      setDownloadError(requestError?.message || "The document could not be downloaded. Please try again.");
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setDownloadingId("");
    }
  }, [api]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white"><GraduationCap size={27} /></div>
          <RefreshCw size={21} className="mx-auto mt-5 animate-spin text-emerald-700" />
          <h1 className="mt-4 text-lg font-extrabold text-slate-900">Loading school website</h1>
          <p className="mt-2 text-sm text-slate-500">Retrieving the public school profile and published resources.</p>
        </div>
      </main>
    );
  }

  if (!school) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><School size={27} /></div>
          <h1 className="mt-5 text-2xl font-extrabold text-slate-950">School website unavailable</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">We couldn't find a published public profile for <strong>{schoolSlug}</strong>. Verify the school's public slug and publication settings.</p>
          {error && <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm leading-6 text-red-800"><XCircle size={18} className="mt-0.5 shrink-0" /><span>{error}</span></div>}
          <button type="button" onClick={() => void loadPage({ silent: true })} disabled={refreshing} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />Try again</button>
          <p className="mt-5 text-xs text-slate-500"><a href="/" className="font-bold text-emerald-700">Return to RevelaCode</a></p>
        </section>
      </main>
    );
  }

  const about = text(school, ["public_description", "about", "description", "about_school", "mission"], "Welcome to our school. Contact the school for more information.");
  const mission = text(school, ["mission"]);
  const vision = text(school, ["vision"]);
  const motto = text(school, ["motto", "tagline"]);
  const principal = text(school, ["principal_name", "administrator_name"]);
  const locationText = text(school, ["physical_address", "address", "location"]) || [text(school, ["town", "city"]), text(school, ["county", "region"])].filter(Boolean).join(", ") || "Contact the school for location details.";
  const courses = Array.isArray(school.courses) ? school.courses : [];
  const departments = Array.isArray(school.departments) ? school.departments : [];
  const coCurricularActivities = Array.isArray(school.co_curricular_activities) ? school.co_curricular_activities : [];
  const teacherServices = Array.isArray(school.teacher_services) ? school.teacher_services : [];
  const phone = text(school, ["contact_phone", "phone", "telephone", "phone_number"]);
  const email = text(school, ["contact_email", "email", "email_address"]);
  const website = text(school, ["website"]);
  const logo = text(school, ["logo_url", "logo", "image_url"]);
  // Website branding images are saved on the public school profile. Use the
  // saved cover URL first; an uploaded hero may be unpublished in the gallery
  // and therefore absent from the public media response.
  const cover = media.find(
    (item) =>
      text(item, ["category", "media_category"]).toLowerCase() === "hero" &&
      text(item, ["kind", "resource_type", "media_type"]).toLowerCase() !== "video"
  );
  const coverUrl =
    text(school, ["cover_image_url", "hero_image_url", "banner_url"]) ||
    text(cover, ["url", "secure_url", "media_url", "file_url"]);
  const heroStyle = coverUrl ? { backgroundImage: `linear-gradient(90deg, rgba(2,6,23,.92), rgba(2,44,34,.70)), url("${coverUrl.replace(/"/g, "%22")}")`, backgroundPosition: "center", backgroundSize: "cover" } : undefined;
  const pageTitle = NAV_ITEMS.find((item) => item.path === canonicalPage)?.label || "Home";

  let pageContent;
  switch (canonicalPage) {
    case "about":
      pageContent = (
        <>
          <PageHeading icon={School} eyebrow="Our story" title="About our school" description="Learn about our purpose, leadership and the values that guide our school community." />
          <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-lg font-extrabold text-slate-950">Who we are</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{about}</p>
              {motto && <div className="mt-6 border-t border-slate-100 pt-5"><h3 className="font-extrabold text-slate-900">Our motto</h3><p className="mt-2 text-sm leading-6 text-slate-600">{motto}</p></div>}
              {mission && <div className="mt-6 border-t border-slate-100 pt-5"><h3 className="font-extrabold text-slate-900">Our mission</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{mission}</p></div>}
              {vision && <div className="mt-6 border-t border-slate-100 pt-5"><h3 className="font-extrabold text-slate-900">Our vision</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{vision}</p></div>}
            </article>
            <aside className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><h2 className="text-lg font-extrabold text-slate-950">School at a glance</h2><dl className="mt-5 space-y-4 text-sm">{principal && <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">School leadership</dt><dd className="mt-1 font-semibold text-slate-900">{principal}</dd></div>}<div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">School type</dt><dd className="mt-1 font-semibold capitalize text-slate-900">{text(school, ["school_type", "type"], "School")}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</dt><dd className="mt-1 font-semibold text-slate-900">{locationText}</dd></div>{text(school, ["academic_year"]) && <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Academic year</dt><dd className="mt-1 font-semibold text-slate-900">{text(school, ["academic_year"])}</dd></div>}</dl></aside>
          </div>
        </>
      );
      break;
    case "events":
      pageContent = <><PageHeading icon={CalendarDays} eyebrow="School life" title="News and events" description="Updates, school activities and public events released by the school." />{events.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{events.map((item, index) => <ResourceCard key={recordId(item) || `event-${index}`} item={item} kind="event" />)}</div> : <EmptyState icon={CalendarDays} title="No public events yet" description="Published school events and announcements will appear here when the school releases them." />}</>;
      break;
    case "academics":
      pageContent = (
        <>
          <PageHeading icon={BookOpen} eyebrow="Learning and achievement" title="Courses, programs and departments" description="Explore the learning pathways and academic departments offered by this school, alongside its published CBC projects." />
          <section className="mb-10 space-y-4">
            <div><h2 className="text-xl font-extrabold text-slate-950">Courses and programs</h2><p className="mt-1 text-sm leading-6 text-slate-500">School-published courses, programs, duration and entry information.</p></div>
            <PublicOfferingGrid items={courses} icon={BookOpen} emptyTitle="Courses will be listed here" emptyDescription="The school has not published course or program details yet." renderItem={(item, index) => <OfferingCard key={recordId(item) || `course-${index}`} title={text(item, ["name", "title"], "Course / program")} eyebrow={text(item, ["level"], "Course / program")} description={text(item, ["description"])} details={[item.duration ? `Duration: ${item.duration}` : "", item.requirements ? `Entry requirements: ${item.requirements}` : ""]} />} />
          </section>
          <section className="mb-10 space-y-4">
            <div><h2 className="text-xl font-extrabold text-slate-950">Academic departments</h2><p className="mt-1 text-sm leading-6 text-slate-500">Departments and the subjects or learning areas they support.</p></div>
            <PublicOfferingGrid items={departments} icon={School} emptyTitle="Departments will be listed here" emptyDescription="The school has not published department details yet." renderItem={(item, index) => <OfferingCard key={recordId(item) || `department-${index}`} title={text(item, ["name", "title"], "Department")} eyebrow="Academic department" description={text(item, ["description"])} tags={item.subjects || []} />} />
          </section>
          <section className="space-y-4">
            <div><h2 className="text-xl font-extrabold text-slate-950">CBC projects and academic highlights</h2><p className="mt-1 text-sm leading-6 text-slate-500">Learning projects and highlights approved for public viewing.</p></div>
            {projects.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{projects.map((item, index) => <ResourceCard key={recordId(item) || `project-${index}`} item={item} kind="project" />)}</div> : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm leading-6 text-slate-500">Published academic projects and learning highlights will appear here when available.</p>}
          </section>
        </>
      );
      break;
    case "activities":
      pageContent = (
        <>
          <PageHeading icon={CalendarDays} eyebrow="Beyond the classroom" title="Co-curricular activities" description="Discover the clubs, sports, arts, leadership and enrichment activities made available to learners by the school." />
          <PublicOfferingGrid items={coCurricularActivities} icon={CalendarDays} emptyTitle="School activities will be listed here" emptyDescription="The school has not published co-curricular activity details yet." renderItem={(item, index) => <OfferingCard key={recordId(item) || `activity-${index}`} title={text(item, ["name", "title"], "School activity")} eyebrow={text(item, ["category"], "Co-curricular activity")} description={text(item, ["description"])} details={[item.schedule ? `Schedule: ${item.schedule}` : ""]} />} />
        </>
      );
      break;
    case "teachers":
      pageContent = (
        <>
          <PageHeading icon={Users} eyebrow="People and support" title="Teachers and services" description="Meet school-listed teachers and explore the extra learning, coaching and mentorship services they offer through the school." />
          <PublicOfferingGrid items={teacherServices} icon={Users} emptyTitle="Teacher services will be listed here" emptyDescription="The school has not published teacher service information yet." renderItem={(item, index) => <OfferingCard key={recordId(item) || `teacher-service-${index}`} title={text(item, ["service", "title"], "Teacher service")} eyebrow={text(item, ["teacher_name"], "School teacher")} description={text(item, ["description"])} details={[item.subject ? `Subject / department: ${item.subject}` : "", item.availability ? `Availability: ${item.availability}` : ""]} />} />
        </>
      );
      break;
    case "media":
      pageContent = <><PageHeading icon={ImageIcon} eyebrow="Our school in pictures" title="Photos and videos" description="View school facilities, activities, events and other media released for public viewing." />{media.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{media.map((item, index) => <MediaCard key={recordId(item) || `media-${index}`} item={item} />)}</div> : <EmptyState icon={ImageIcon} title="Gallery coming soon" description="The school has not published photos or videos yet. Approved media will appear here." />}</>;
      break;
    case "documents":
      pageContent = <><PageHeading icon={FileText} eyebrow="School resources" title="Public documents" description="Download school forms, notices, calendars, handbooks and other documents that have been approved for public release." />{downloadError && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">{downloadError}</div>}{documents.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{documents.map((item, index) => <ResourceCard key={recordId(item) || `document-${index}`} item={item} kind="document" onDownload={handleDownload} downloadingId={downloadingId} />)}</div> : <EmptyState icon={FileText} title="No public documents available" description="School-approved public documents will appear here after they are published." />}<div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><ShieldCheck size={19} className="mt-0.5 shrink-0" /><p>This library is for public documents only. Private student records, report cards and individual fee statements require authenticated, authorized access.</p></div></>;
      break;
    case "contact":
      pageContent = <><PageHeading icon={Mail} eyebrow="Get in touch" title="Contact the school" description="Use the official contact details below to reach the school administration." /><div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><h2 className="text-lg font-extrabold text-slate-950">Contact details</h2><div className="mt-6 space-y-5"><div className="flex items-start gap-3"><MapPin size={20} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</p><p className="mt-1 text-sm font-semibold text-slate-900">{locationText}</p><a className="mt-2 inline-flex text-xs font-bold text-emerald-700 hover:underline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`} target="_blank" rel="noreferrer">Open map <ArrowRight size={13} className="ml-1" /></a></div></div>{phone && <div className="flex items-start gap-3"><Phone size={20} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Telephone</p><a className="mt-1 block text-sm font-semibold text-slate-900 hover:text-emerald-700" href={`tel:${phone}`}>{phone}</a></div></div>}{email && <div className="flex items-start gap-3"><Mail size={20} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p><a className="mt-1 block break-all text-sm font-semibold text-slate-900 hover:text-emerald-700" href={`mailto:${email}`}>{email}</a></div></div>}{website && <div className="flex items-start gap-3"><ArrowRight size={20} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Website</p><a className="mt-1 block break-all text-sm font-semibold text-slate-900 hover:text-emerald-700" href={/^https?:\/\//i.test(website) ? website : `https://${website}`} target="_blank" rel="noreferrer">{website}</a></div></div>}</div></section><aside className="rounded-2xl bg-slate-950 p-6 text-white sm:p-8"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-emerald-200"><School size={24} /></div><h2 className="mt-5 text-xl font-extrabold">{schoolName}</h2><p className="mt-3 text-sm leading-7 text-slate-300">For admissions, official notices or school-related enquiries, please use the published contact details. The website displays information approved for public access.</p><Link to={pageUrl("documents")} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-50">View school documents <ArrowRight size={15} /></Link></aside></div></>;
      break;
    default: {
      const visibleEvents = events.slice(0, 3);
      const visibleProjects = projects.slice(0, 3);
      const visibleMedia = media.slice(0, 3);
      pageContent = <>
        <section className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-emerald-950 to-emerald-800 text-white" style={heroStyle}>
          <div className="pointer-events-none absolute -right-20 -top-28 -z-10 h-96 w-96 rounded-full border border-white/10 shadow-[0_0_0_40px_rgba(255,255,255,0.025),0_0_0_90px_rgba(255,255,255,0.02)]" />
          <div className="grid gap-10 px-6 py-12 sm:px-9 sm:py-16 lg:grid-cols-[1fr_.58fr] lg:items-center lg:px-12 lg:py-20">
            <div><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-100"><ShieldCheck size={15} />Official school website</div><h1 className="mt-6 max-w-3xl break-words text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">{schoolName}</h1><p className="mt-5 max-w-2xl whitespace-pre-line text-sm leading-8 text-emerald-50/90 sm:text-base">{about}</p>{motto && <p className="mt-4 text-sm font-bold italic text-emerald-100">“{motto}”</p>}<div className="mt-8 flex flex-wrap gap-3"><Link to={pageUrl("about")} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-950 hover:bg-emerald-50">Discover our school <ArrowRight size={16} /></Link><Link to={pageUrl("documents")} className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/15"><ArrowDownToLine size={16} />Public documents</Link></div></div>
            <aside className="rounded-3xl border border-white/15 bg-white/[0.08] p-6 backdrop-blur"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-emerald-100"><GraduationCap size={26} /></div><h2 className="mt-5 text-xl font-extrabold">Welcome to our school</h2><p className="mt-3 text-sm leading-7 text-emerald-50/85">Find school information, published announcements, academic highlights, photos and official resources in one place.</p><div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-100"><ShieldCheck size={15} />Powered by Jumuiya Elimu</div></aside>
          </div>
        </section>
        <section className="mt-10"><PageHeading icon={School} eyebrow="Explore the school" title="Everything you need to know" description="Use the school website sections to explore the school, follow its activities and access published resources."/><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><FeatureLink href={pageUrl("about")} icon={School} title="About our school" description="Our story, mission, vision and school leadership."/><FeatureLink href={pageUrl("events")} icon={CalendarDays} title="News and events" description="School activities and public announcements."/><FeatureLink href={pageUrl("academics")} icon={BookOpen} title="Academics" description="Learning highlights and published CBC projects."/><FeatureLink href={pageUrl("media")} icon={ImageIcon} title="Photos and videos" description="View approved school photos and videos."/><FeatureLink href={pageUrl("documents")} icon={FileText} title="Public documents" description="Find approved forms, notices and school resources."/><FeatureLink href={pageUrl("contact")} icon={Mail} title="Contact us" description="Official phone, email and location information."/></div></section>
        {visibleEvents.length > 0 && <section className="mt-14"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">What’s happening</p><h2 className="mt-2 text-2xl font-black text-slate-950">Latest news and events</h2></div><Link to={pageUrl("events")} className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700">All events <ArrowRight size={15}/></Link></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleEvents.map((item, index) => <ResourceCard key={recordId(item) || `home-event-${index}`} item={item} kind="event" />)}</div></section>}
        {visibleProjects.length > 0 && <section className="mt-14"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">Learning and achievement</p><h2 className="mt-2 text-2xl font-black text-slate-950">Academic highlights</h2></div><Link to={pageUrl("academics")} className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700">All highlights <ArrowRight size={15}/></Link></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleProjects.map((item, index) => <ResourceCard key={recordId(item) || `home-project-${index}`} item={item} kind="project" />)}</div></section>}
        {visibleMedia.length > 0 && <section className="mt-14"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">School gallery</p><h2 className="mt-2 text-2xl font-black text-slate-950">A glimpse of school life</h2></div><Link to={pageUrl("media")} className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700">Open gallery <ArrowRight size={15}/></Link></div><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visibleMedia.map((item, index) => <MediaCard key={recordId(item) || `home-media-${index}`} item={item} />)}</div></section>}
        <section className="mt-14 rounded-3xl border border-emerald-100 bg-emerald-50 p-6 sm:p-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-extrabold text-emerald-950">Need to reach the school?</h2><p className="mt-2 text-sm leading-6 text-emerald-900/80">Find the school's official contact details and location.</p></div><Link to={pageUrl("contact")} className="inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-900">Contact the school <ArrowRight size={16}/></Link></div></section>
      </>;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3">Skip to content</a>
      <header data-school-header="v2" className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
          <Link to={homeUrl} className="group flex min-w-0 items-center gap-3" aria-label={`${schoolName} home`}>
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-950 text-white shadow-md shadow-emerald-900/15 ring-1 ring-emerald-950/10 sm:h-12 sm:w-12">
              <School size={23} />
              {logo && <img src={logo} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
            </span>
            <span className="min-w-0">
              <span className="block max-w-[190px] truncate text-sm font-extrabold tracking-tight text-slate-950 sm:max-w-[280px] sm:text-base">{schoolName}</span>
              <span className="mt-0.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-[10px]">
                <ShieldCheck size={12} className="shrink-0 text-emerald-700" /> Official school website
              </span>
            </span>
          </Link>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <Link
              to={`/jumuiya/elimu/parent?school=${encodeURIComponent(schoolSlug)}`}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <Users size={16} /> Parent portal
            </Link>
            <Link
              to={`/jumuiya/elimu/student?school=${encodeURIComponent(schoolSlug)}`}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3.5 py-2 text-sm font-bold text-white shadow-sm shadow-emerald-900/15 transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <GraduationCap size={16} /> Student portal <ArrowRight size={14} />
            </Link>
          </div>

          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="school-mobile-navigation"
            aria-label={mobileMenuOpen ? "Close school navigation" : "Open school navigation"}
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 xl:hidden"
          >
            {mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
            <span>{mobileMenuOpen ? "Close" : "Menu"}</span>
          </button>
        </div>

        <div className="hidden border-t border-slate-100 bg-slate-50/70 xl:block">
          <nav aria-label="School website navigation" className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-8">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = canonicalPage === item.path;
              return (
                <Link
                  key={item.path || "home"}
                  to={pageUrl(item.path)}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${active ? "bg-emerald-700 text-white shadow-sm shadow-emerald-900/15" : "text-slate-600 hover:bg-white hover:text-emerald-800 hover:shadow-sm"}`}
                >
                  <Icon size={16} strokeWidth={active ? 2.3 : 1.9} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {mobileMenuOpen && (
          <div id="school-mobile-navigation" className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg shadow-slate-900/5 xl:hidden sm:px-6">
            <nav aria-label="Mobile school website navigation" className="mx-auto max-w-7xl">
              <p className="mb-3 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">Explore the school</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = canonicalPage === item.path;
                  return (
                    <Link
                      key={item.path || "home"}
                      to={pageUrl(item.path)}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 min-w-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 sm:text-sm ${active ? "border-emerald-700 bg-emerald-700 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"}`}
                    >
                      <Icon size={16} className="shrink-0" />
                      <span className="min-w-0">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2">
                <Link
                  to={`/jumuiya/elimu/parent?school=${encodeURIComponent(schoolSlug)}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  <Users size={17} /> Parent portal <ArrowRight size={14} />
                </Link>
                <Link
                  to={`/jumuiya/elimu/student?school=${encodeURIComponent(schoolSlug)}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  <GraduationCap size={17} /> Student portal <ArrowRight size={14} />
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {resourceWarning && <div role="status" className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><XCircle size={18} className="mt-0.5 shrink-0"/><p>{resourceWarning}</p><button type="button" className="ml-auto shrink-0 font-bold underline" disabled={refreshing} onClick={() => void loadPage({ silent: true })}>Retry</button></div>}
        {pageContent}
      </main>

      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-7 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div><p className="text-sm font-extrabold text-slate-900">{schoolName}</p><p className="mt-1 text-xs text-slate-500">Official public school website</p></div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-4 gap-y-2">{NAV_ITEMS.map((item) => <Link key={item.path || "home"} to={pageUrl(item.path)} className="text-xs font-semibold text-slate-600 hover:text-emerald-700">{item.label}</Link>)}</nav>
          <p className="text-xs text-slate-500">Powered by <a href="/" className="font-bold text-emerald-700 hover:underline">RevelaCode · Jumuiya Elimu</a></p>
        </div>
      </footer>
    </div>
  );
}
