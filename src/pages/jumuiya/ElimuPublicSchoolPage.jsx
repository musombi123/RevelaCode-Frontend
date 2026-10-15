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

const DEFAULT_PUBLIC_THEME = {
  primary: "#047857",
  secondary: "#064e3b",
  accent: "#d4af37",
  background: "#f8fafc",
  surface: "#ffffff",
  heading: "#0f172a",
  body: "#475569",
  header: "#ffffff",
  footer: "#ffffff",
  font_style: "modern",
  button_style: "solid",
};

const THEME_COLOUR_FIELDS = [
  "primary", "secondary", "accent", "background", "surface",
  "heading", "body", "header", "footer",
];

function normalizePublicTheme(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const theme = { ...DEFAULT_PUBLIC_THEME };
  for (const field of THEME_COLOUR_FIELDS) {
    const candidate = source[field];
    if (typeof candidate === "string" && /^#[0-9a-f]{6}$/i.test(candidate.trim())) {
      theme[field] = candidate.trim().toLowerCase();
    }
  }
  if (["modern", "classic", "humanist"].includes(source.font_style)) theme.font_style = source.font_style;
  if (["solid", "outline", "soft"].includes(source.button_style)) theme.button_style = source.button_style;
  return theme;
}

function rgbaFromHex(hex, alpha) {
  const safe = /^#[0-9a-f]{6}$/i.test(String(hex || "")) ? hex : "#047857";
  const red = parseInt(safe.slice(1, 3), 16);
  const green = parseInt(safe.slice(3, 5), 16);
  const blue = parseInt(safe.slice(5, 7), 16);
  return "rgba(" + red + ", " + green + ", " + blue + ", " + alpha + ")";
}

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
    <header className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200/80 bg-[linear-gradient(135deg,var(--school-surface),var(--school-surface-tint))] p-5 shadow-sm ring-1 ring-slate-950/[0.03] sm:mb-10 sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full border border-emerald-100/80 shadow-[0_0_0_18px_rgba(16,185,129,0.025),0_0_0_38px_rgba(16,185,129,0.02)]" />
      <div className="relative flex min-w-0 items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-700/10 sm:h-12 sm:w-12"><Icon size={21} strokeWidth={1.8} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.17em] text-emerald-700 sm:text-xs"><span className="h-px w-5 bg-emerald-500" />{eyebrow}</div>
          <h1 className="mt-2 break-words text-2xl font-black tracking-tight text-slate-950 [text-wrap:balance] sm:text-4xl lg:text-[2.65rem]">{title}</h1>
          {description && <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">{description}</p>}
        </div>
      </div>
    </header>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-slate-300/90 bg-[linear-gradient(135deg,var(--school-surface),var(--school-surface-tint))] p-8 text-center shadow-sm ring-1 ring-slate-950/[0.025] sm:p-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-700/10"><Icon size={25} strokeWidth={1.7} /></div>
      <h2 className="mt-5 text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-slate-500">{description}</p>
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
    <article className="group/resource relative flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-[linear-gradient(135deg,var(--school-surface),var(--school-surface-tint))] p-5 shadow-sm ring-1 ring-slate-950/[0.025] transition duration-300 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-xl motion-safe:hover:shadow-slate-900/10 hover:border-[var(--school-primary)] focus-within:ring-2 focus-within:ring-[var(--school-primary)] sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-700/10 bg-emerald-50 text-emerald-700 shadow-sm transition duration-300 group-hover/resource:scale-105 group-hover/resource:shadow-md"><Icon size={21} strokeWidth={1.8} /></div>
        <h2 className="min-w-0 break-words pt-1 text-sm font-extrabold leading-6 tracking-tight text-slate-900 sm:text-base">{title}</h2>
      </div>
      <p className="mt-4 flex-1 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{description}</p>
      {(date || category) && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100/90 pt-4 text-xs text-slate-500">
          {date && <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} />{formatDate(date) || date}</span>}
          {category && <span className="capitalize">{category.replace(/[_-]+/g, " ")}</span>}
        </div>
      )}
      {kind === "document" && (
        <button
          type="button"
          disabled={!id || Boolean(downloadingId)}
          onClick={() => onDownload(item)}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-xs font-extrabold text-white shadow-sm shadow-emerald-950/10 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--school-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {downloading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
          {downloading ? "Preparing download…" : "Download document"}
        </button>
      )}
    </article>
  );
}

function MediaCard({ item, onOpen }) {
  const url = text(item, ["url", "secure_url", "media_url", "file_url"]);
  const title = text(item, ["title", "caption", "alt_text", "name"], "School photo or video");
  const format = text(item, ["format", "resource_type", "kind", "media_type"]).toLowerCase();
  const isVideo = format.includes("video") || ["mp4", "mov", "m4v", "webm"].includes(format) || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
  if (!url) return null;

  return (
    <article className="public-media-card group min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-md shadow-slate-900/[0.04] ring-1 ring-slate-950/[0.025] transition duration-300 ease-out motion-safe:hover:-translate-y-1.5 motion-safe:hover:shadow-2xl motion-safe:hover:shadow-slate-900/10 hover:border-[var(--school-primary)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        {isVideo ? (
          <video className="h-full w-full object-cover" src={url} controls preload="metadata" aria-label={title} />
        ) : (
          <button
            type="button"
            onClick={() => typeof onOpen === "function" && onOpen(item)}
            className="group/photo relative block h-full w-full cursor-zoom-in text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[var(--school-primary)]"
            aria-label={`View photo: ${title}`}
          >
            <img
              src={url}
              alt={text(item, ["alt_text", "caption", "title"], title)}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition duration-700 ease-out motion-safe:group-hover/photo:scale-[1.06]"
              onError={(event) => { event.currentTarget.style.visibility = "hidden"; }}
            />
            <span className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between rounded-xl bg-slate-950/75 px-3 py-2 text-xs font-bold text-white opacity-0 backdrop-blur transition group-hover/photo:opacity-100 group-focus-visible/photo:opacity-100">
              <span>View photo</span><ImageIcon size={15} />
            </span>
          </button>
        )}
      </div>
      <div className="border-t border-slate-100/90 bg-[linear-gradient(135deg,var(--school-surface),var(--school-surface-tint))] p-4 sm:p-5">
        <h2 className="break-words text-sm font-extrabold leading-6 text-slate-900">{title}</h2>
        {text(item, ["caption", "description"]) && <p className="mt-1.5 text-sm leading-6 text-slate-600">{text(item, ["caption", "description"])}</p>}
      </div>
    </article>
  );
}

function FeatureLink({ href, icon: Icon, title, description }) {
  return (
    <Link
      to={href}
      className="public-feature-link group relative flex h-full min-w-0 items-start gap-4 overflow-hidden rounded-3xl border border-slate-200/80 bg-[linear-gradient(135deg,var(--school-surface),var(--school-surface-tint))] p-5 shadow-sm ring-1 ring-slate-950/[0.025] transition duration-300 ease-out motion-safe:hover:-translate-y-1.5 hover:border-[var(--school-primary)] hover:shadow-xl hover:shadow-slate-900/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--school-primary)] focus-visible:ring-offset-2 sm:p-6"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-700/10 bg-emerald-50 text-emerald-700 shadow-sm transition duration-300 group-hover:scale-105 group-hover:shadow-md">
        <Icon size={21} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">{title}</span>
        <span className="mt-1.5 block text-sm leading-6 text-slate-600">{description}</span>
        <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700">
          Explore section <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </span>
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
    <article className="group/offering relative flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-[linear-gradient(135deg,var(--school-surface),var(--school-surface-tint))] p-5 shadow-sm ring-1 ring-slate-950/[0.025] transition duration-300 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-xl motion-safe:hover:shadow-slate-900/[0.08] hover:border-[var(--school-primary)] sm:p-6">
      {eyebrow && <p className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-emerald-700 sm:text-xs"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{eyebrow}</p>}
      <h3 className="mt-3 break-words text-lg font-extrabold tracking-tight text-slate-950 sm:text-xl">{title}</h3>
      {description && <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{description}</p>}
      {cleanTags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{cleanTags.map((tag, index) => <span key={`${tag}-${index}`} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">{tag}</span>)}</div>}
      {cleanDetails.length > 0 && <dl className="mt-5 space-y-2.5 border-t border-slate-100/90 pt-4">{cleanDetails.map((detail, index) => <div key={`${detail}-${index}`} className="flex items-start gap-2 text-xs leading-6 text-slate-500"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70" />{detail}</div>)}</dl>}
    </article>
  );
}

function PublicOfferingGrid({ items, emptyTitle, emptyDescription, icon: Icon = BookOpen, renderItem }) {
  if (!items.length) return <EmptyState icon={Icon} title={emptyTitle} description={emptyDescription} />;
  return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map((item, index) => renderItem(item, index))}</div>;
}

export default function ElimuPublicSchoolPage({ customDomainMode = false } = {}) {
  const { schoolSlug: routeSchoolSlug = "" } = useParams();
  const schoolSlug = customDomainMode ? "" : routeSchoolSlug;
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
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [inquiryForm, setInquiryForm] = useState({ name: "", email: "", phone: "", topic: "general", message: "", website_confirmation: "" });
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryFeedback, setInquiryFeedback] = useState(null);

  const pageSegment = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    return String(segments[customDomainMode ? 0 : 1] || "").toLowerCase();
  }, [location.pathname, customDomainMode]);
  const canonicalPage = ROUTE_ALIASES[pageSegment] ?? pageSegment;
  const validPages = useMemo(() => new Set(NAV_ITEMS.map((item) => item.path)), []);
  const schoolName = text(school, ["school_name", "name", "display_name", "title"], String(schoolSlug).split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") || "School");
  const publicSchoolSlug = text(school, ["public_slug", "slug", "school_code", "code"], schoolSlug);
  const websiteTheme = useMemo(() => normalizePublicTheme(school?.website_theme), [school]);
  const websiteFontFamily = websiteTheme.font_style === "classic"
    ? "Georgia, 'Times New Roman', serif"
    : websiteTheme.font_style === "humanist"
      ? "'Trebuchet MS', Arial, sans-serif"
      : "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const websiteThemeStyle = {
    "--school-primary": websiteTheme.primary,
    "--school-secondary": websiteTheme.secondary,
    "--school-accent": websiteTheme.accent,
    "--school-background": websiteTheme.background,
    "--school-surface": websiteTheme.surface,
    "--school-heading": websiteTheme.heading,
    "--school-body": websiteTheme.body,
    "--school-header": websiteTheme.header,
    "--school-footer": websiteTheme.footer,
    "--school-surface-tint": rgbaFromHex(websiteTheme.primary, 0.045),
    backgroundColor: websiteTheme.background,
    color: websiteTheme.body,
    fontFamily: websiteFontFamily,
  };
  const homeUrl = customDomainMode ? "/" : absoluteSchoolUrl(schoolSlug);
  const pageUrl = useCallback((page = "") => customDomainMode ? (page ? "/" + page : "/") : absoluteSchoolUrl(schoolSlug, page), [customDomainMode, schoolSlug]);

  const loadPage = useCallback(async ({ silent = false, signal } = {}) => {
    if (!customDomainMode && !schoolSlug) {
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
      if (customDomainMode) {
        try {
          const response = await api.getPublicSchoolByDomain({ hostname: window.location.hostname }, { signal });
          foundSchool = getSchool(response, window.location.hostname, true);
        } catch (requestError) {
          if (requestError?.name === "AbortError") return;
          lastError = requestError;
        }
      } else {
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
      }
      if (signal?.aborted) return;
      if (!foundSchool) {
        throw new Error(lastError?.message || (customDomainMode ? "No active verified school website is configured for this hostname." : `No published school was found for "${schoolSlug}". Check its public profile slug and publication status.`));
      }
      setSchool(foundSchool);

      const id = text(foundSchool, ["id", "_id", "school_id"]);
      const resolvedSchoolSlug = text(foundSchool, ["public_slug", "slug", "school_code", "code"], schoolSlug);
      const query = id ? { school_id: id, limit: 50 } : { school_code: resolvedSchoolSlug, limit: 50 };
      const mediaRequest = typeof api.getPublicSchoolMedia === "function"
        ? api.getPublicSchoolMedia(resolvedSchoolSlug, { limit: 50 }, { signal })
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
  }, [api, schoolSlug, customDomainMode]);

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
    if (!selectedMedia) return undefined;
    const previousOverflow = window.document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelectedMedia(null);
    };
    window.document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedMedia]);

  useEffect(() => {
    const title = school
      ? text(school, ["seo_title"], text(school, ["homepage_title"], schoolName) + " | " + schoolName)
      : "Jumuiya Elimu | School Website";
    const description = text(
      school,
      ["seo_description", "public_description", "description", "about"],
      "Official school information and published resources."
    ).slice(0, 300);
    const oldTitle = window.document.title;
    window.document.title = title;
    const changedAttributes = [];

    const updateAttribute = (node, attribute, value) => {
      changedAttributes.push({ node, attribute, previous: node.getAttribute(attribute) });
      node.setAttribute(attribute, value);
    };

    const ensureMeta = (selector, key, value) => {
      let node = window.document.head.querySelector(selector);
      if (!node) {
        node = window.document.createElement("meta");
        node.setAttribute(key, selector.includes('property=') ? selector.match(/property="([^"]+)"/)?.[1] || "" : selector.match(/name="([^"]+)"/)?.[1] || "");
        window.document.head.appendChild(node);
        changedAttributes.push({ node, attribute: key, previous: null, created: true });
      } else {
        updateAttribute(node, "content", value);
        return;
      }
      node.setAttribute("content", value);
    };

    ensureMeta('meta[name="description"]', "name", description);
    ensureMeta('meta[property="og:title"]', "property", title);
    ensureMeta('meta[property="og:description"]', "property", description);
    ensureMeta('meta[property="og:site_name"]', "property", schoolName);
    ensureMeta('meta[property="og:type"]', "property", "website");
    const primaryDomain = text(school, ["primary_domain"]).trim().toLowerCase();
    const canonicalPath = canonicalPage ? "/" + canonicalPage : "/";
    const canonicalUrl = primaryDomain
      ? "https://" + primaryDomain + canonicalPath
      : customDomainMode
        ? window.location.origin + canonicalPath
        : window.location.origin + location.pathname;
    ensureMeta('meta[property="og:url"]', "property", canonicalUrl);
    const socialImage = text(school, ["social_image_url", "cover_image_url", "logo_url", "favicon_url"]);
    ensureMeta('meta[property="og:image"]', "property", socialImage);
    ensureMeta('meta[name="twitter:card"]', "name", socialImage ? "summary_large_image" : "summary");
    ensureMeta('meta[name="twitter:title"]', "name", title);
    ensureMeta('meta[name="twitter:description"]', "name", description);
    ensureMeta('meta[name="twitter:image"]', "name", socialImage);

    let canonical = window.document.head.querySelector('link[rel="canonical"]');
    let createdCanonical = false;
    if (!canonical) {
      canonical = window.document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      window.document.head.appendChild(canonical);
      createdCanonical = true;
    }
    const previousCanonical = canonical.getAttribute("href");
    canonical.setAttribute("href", canonicalUrl);

    const faviconUrl = text(school, ["favicon_url", "logo_url"]);
    const faviconNodes = Array.from(window.document.head.querySelectorAll('link[rel~="icon"]'));
    const faviconChanges = [];
    if (faviconUrl) {
      const nodes = faviconNodes.length ? faviconNodes : [window.document.createElement("link")];
      for (const node of nodes) {
        const isNew = !node.isConnected;
        if (isNew) {
          node.setAttribute("rel", "icon");
          window.document.head.appendChild(node);
        }
        faviconChanges.push({ node, previous: node.getAttribute("href"), created: isNew });
        node.setAttribute("href", faviconUrl);
      }
    }

    let structuredData = window.document.getElementById("elimu-school-structured-data");
    const createdStructuredData = !structuredData;
    if (!structuredData) {
      structuredData = window.document.createElement("script");
      structuredData.id = "elimu-school-structured-data";
      structuredData.type = "application/ld+json";
      window.document.head.appendChild(structuredData);
    }
    const previousStructuredData = structuredData.textContent;
    const structuredSchool = {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      name: schoolName,
      url: canonicalUrl,
      description,
    };
    const logo = text(school, ["logo_url"]);
    const telephone = text(school, ["phone"]);
    const emailAddress = text(school, ["email"]);
    const streetAddress = text(school, ["address", "postal_address"]);
    const locality = text(school, ["town", "location"]);
    const region = text(school, ["county"]);
    const country = text(school, ["country"]);
    if (logo) structuredSchool.logo = logo;
    if (telephone) structuredSchool.telephone = telephone;
    if (emailAddress) structuredSchool.email = emailAddress;
    if (streetAddress || locality || region || country) {
      structuredSchool.address = {
        "@type": "PostalAddress",
        ...(streetAddress ? { streetAddress } : {}),
        ...(locality ? { addressLocality: locality } : {}),
        ...(region ? { addressRegion: region } : {}),
        ...(country ? { addressCountry: country } : {}),
      };
    }
    structuredData.textContent = JSON.stringify(structuredSchool);

    return () => {
      window.document.title = oldTitle || "RevelaCode";
      for (const item of changedAttributes.reverse()) {
        if (item.created) {
          item.node.remove();
        } else if (item.previous == null) {
          item.node.removeAttribute(item.attribute);
        } else {
          item.node.setAttribute(item.attribute, item.previous);
        }
      }
      if (createdCanonical) canonical.remove();
      else if (previousCanonical == null) canonical.removeAttribute("href");
      else canonical.setAttribute("href", previousCanonical);
      for (const item of faviconChanges) {
        if (item.created) item.node.remove();
        else if (item.previous == null) item.node.removeAttribute("href");
        else item.node.setAttribute("href", item.previous);
      }
      if (createdStructuredData) structuredData.remove();
      else structuredData.textContent = previousStructuredData || "";
    };
  }, [school, schoolName, location.pathname, canonicalPage, customDomainMode]);

  useEffect(() => {
    const primaryDomain = text(school, ["primary_domain"]).trim().toLowerCase();
    const currentHost = String(window.location.hostname || "").toLowerCase();
    if (!primaryDomain || primaryDomain === currentHost || currentHost === "localhost" || currentHost === "127.0.0.1") return;
    if (!/^[a-z0-9.-]+$/.test(primaryDomain) || primaryDomain.endsWith(".onrender.com")) return;
    const canonicalPath = canonicalPage ? "/" + canonicalPage : "/";
    const target = "https://" + primaryDomain + canonicalPath + location.search + location.hash;
    window.location.replace(target);
  }, [school, canonicalPage, location.search, location.hash]);

  const submitInquiry = useCallback(async (event) => {
    event.preventDefault();
    if (inquirySubmitting) return;
    setInquirySubmitting(true);
    setInquiryFeedback(null);
    const payload = {
      name: inquiryForm.name.trim(),
      email: inquiryForm.email.trim(),
      phone: inquiryForm.phone.trim(),
      topic: inquiryForm.topic,
      message: inquiryForm.message.trim(),
      website_confirmation: inquiryForm.website_confirmation,
      ...(customDomainMode
        ? { hostname: window.location.hostname }
        : { school_slug: publicSchoolSlug }),
    };
    try {
      const response = await api.submitPublicSchoolInquiry(payload);
      setInquiryFeedback({
        type: "success",
        message: response?.message || "Your inquiry was received and saved for school administration review. It has not been emailed automatically.",
      });
      setInquiryForm({ name: "", email: "", phone: "", topic: "general", message: "", website_confirmation: "" });
    } catch (submitError) {
      setInquiryFeedback({
        type: "error",
        message: submitError?.message || "The inquiry could not be submitted. Please try again or use the school's published contact details.",
      });
    } finally {
      setInquirySubmitting(false);
    }
  }, [api, inquiryForm, inquirySubmitting, customDomainMode, publicSchoolSlug]);

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
  const savedCoverUrl = text(school, ["cover_image_url", "hero_image_url", "banner_url"]);
  const isVideoMedia = (item) => {
    const format = text(item, ["format", "resource_type", "kind", "media_type"]).toLowerCase();
    const url = text(item, ["url", "secure_url", "media_url", "file_url"]);
    return format.includes("video") || ["mp4", "mov", "m4v", "webm"].includes(format) || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
  };
  const featuredPublicMedia = media.find((item) =>
    !isVideoMedia(item) && Boolean(text(item, ["url", "secure_url", "media_url", "file_url"]))
  );
  const heroImageUrl =
    savedCoverUrl ||
    text(cover, ["url", "secure_url", "media_url", "file_url"]) ||
    text(featuredPublicMedia, ["url", "secure_url", "media_url", "file_url"]);
  const heroImageAlt = text(
    school,
    ["cover_image_alt", "homepage_image_alt"],
    text(featuredPublicMedia, ["alt_text", "caption", "title"], `Photo of ${schoolName}`)
  );
  const schoolType = text(school, ["school_type", "type"]);
  const establishedYear = text(school, ["established_year"]);
  const academicYear = text(school, ["academic_year"]);
  const actualLocation = text(school, ["physical_address", "address", "location"]) ||
    [text(school, ["town", "city"]), text(school, ["county", "region"])].filter(Boolean).join(", ");
  const pageTitle = NAV_ITEMS.find((item) => item.path === canonicalPage)?.label || "Home";

  let pageContent;
  switch (canonicalPage) {
    case "about":
      pageContent = (
        <>
          <PageHeading icon={School} eyebrow="Our story" title="About our school" description="Learn about our purpose, leadership and the values that guide our school community." />
          <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
            <article className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-[linear-gradient(135deg,var(--school-surface),var(--school-surface-tint))] p-6 shadow-sm ring-1 ring-slate-950/[0.025] transition duration-300 hover:shadow-lg sm:p-8">
              <h2 className="text-lg font-extrabold text-slate-950">Who we are</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{about}</p>
              {motto && <div className="mt-6 border-t border-slate-100 pt-5"><h3 className="font-extrabold text-slate-900">Our motto</h3><p className="mt-2 text-sm leading-6 text-slate-600">{motto}</p></div>}
              {mission && <div className="mt-6 border-t border-slate-100 pt-5"><h3 className="font-extrabold text-slate-900">Our mission</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{mission}</p></div>}
              {vision && <div className="mt-6 border-t border-slate-100 pt-5"><h3 className="font-extrabold text-slate-900">Our vision</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{vision}</p></div>}
            </article>
            <aside className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-[linear-gradient(135deg,var(--school-surface),var(--school-surface-tint))] p-6 shadow-sm ring-1 ring-slate-950/[0.025] sm:p-8"><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-700/10"><School size={20} /></div><h2 className="text-lg font-extrabold tracking-tight text-slate-950">School at a glance</h2><dl className="mt-5 space-y-4 text-sm">{principal && <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">School leadership</dt><dd className="mt-1 font-semibold text-slate-900">{principal}</dd></div>}<div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">School type</dt><dd className="mt-1 font-semibold capitalize text-slate-900">{text(school, ["school_type", "type"], "School")}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</dt><dd className="mt-1 font-semibold text-slate-900">{locationText}</dd></div>{text(school, ["academic_year"]) && <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Academic year</dt><dd className="mt-1 font-semibold text-slate-900">{text(school, ["academic_year"])}</dd></div>}</dl></aside>
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
          <section className="mb-10 space-y-4 rounded-3xl border border-slate-200/70 bg-white/40 p-4 sm:p-5">
            <div><h2 className="text-xl font-extrabold text-slate-950">Courses and programs</h2><p className="mt-1 text-sm leading-6 text-slate-500">School-published courses, programs, duration and entry information.</p></div>
            <PublicOfferingGrid items={courses} icon={BookOpen} emptyTitle="Courses will be listed here" emptyDescription="The school has not published course or program details yet." renderItem={(item, index) => <OfferingCard key={recordId(item) || `course-${index}`} title={text(item, ["name", "title"], "Course / program")} eyebrow={text(item, ["level"], "Course / program")} description={text(item, ["description"])} details={[item.duration ? `Duration: ${item.duration}` : "", item.requirements ? `Entry requirements: ${item.requirements}` : ""]} />} />
          </section>
          <section className="mb-10 space-y-4 rounded-3xl border border-slate-200/70 bg-white/40 p-4 sm:p-5">
            <div><h2 className="text-xl font-extrabold text-slate-950">Academic departments</h2><p className="mt-1 text-sm leading-6 text-slate-500">Departments and the subjects or learning areas they support.</p></div>
            <PublicOfferingGrid items={departments} icon={School} emptyTitle="Departments will be listed here" emptyDescription="The school has not published department details yet." renderItem={(item, index) => <OfferingCard key={recordId(item) || `department-${index}`} title={text(item, ["name", "title"], "Department")} eyebrow="Academic department" description={text(item, ["description"])} tags={item.subjects || []} />} />
          </section>
          <section className="space-y-4 rounded-3xl border border-slate-200/70 bg-white/40 p-4 sm:p-5">
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
      pageContent = <><PageHeading icon={ImageIcon} eyebrow="Our school in pictures" title="Photos and videos" description="View school facilities, activities, events and other media released for public viewing." />{media.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{media.map((item, index) => <MediaCard key={recordId(item) || `media-${index}`} item={item} onOpen={setSelectedMedia} />)}</div> : <EmptyState icon={ImageIcon} title="Gallery coming soon" description="The school has not published photos or videos yet. Approved media will appear here." />}</>;
      break;
    case "documents":
      pageContent = <><PageHeading icon={FileText} eyebrow="School resources" title="Public documents" description="Download school forms, notices, calendars, handbooks and other documents that have been approved for public release." />{downloadError && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">{downloadError}</div>}{documents.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{documents.map((item, index) => <ResourceCard key={recordId(item) || `document-${index}`} item={item} kind="document" onDownload={handleDownload} downloadingId={downloadingId} />)}</div> : <EmptyState icon={FileText} title="No public documents available" description="School-approved public documents will appear here after they are published." />}<div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><ShieldCheck size={19} className="mt-0.5 shrink-0" /><p>This library is for public documents only. Private student records, report cards and individual fee statements require authenticated, authorized access.</p></div></>;
      break;
    case "contact":
      pageContent = (
        <>
          <PageHeading icon={Mail} eyebrow="Get in touch" title="Contact the school" description="Use the official contact details or send an inquiry to the school administration." />
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-[linear-gradient(135deg,var(--school-surface),var(--school-surface-tint))] p-6 shadow-sm ring-1 ring-slate-950/[0.025] transition duration-300 hover:shadow-lg sm:p-8">
              <h2 className="text-lg font-extrabold text-slate-950">Official contact details</h2>
              <div className="mt-6 space-y-5">
                <div className="flex items-start gap-3"><MapPin size={20} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</p><p className="mt-1 text-sm font-semibold text-slate-900">{locationText}</p><a className="mt-2 inline-flex text-xs font-bold text-emerald-700 hover:underline" href={"https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(locationText)} target="_blank" rel="noreferrer">Open map <ArrowRight size={13} className="ml-1" /></a></div></div>
                {phone && <div className="flex items-start gap-3"><Phone size={20} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Telephone</p><a className="mt-1 block text-sm font-semibold text-slate-900 hover:text-emerald-700" href={"tel:" + phone}>{phone}</a></div></div>}
                {email && <div className="flex items-start gap-3"><Mail size={20} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p><a className="mt-1 block break-all text-sm font-semibold text-slate-900 hover:text-emerald-700" href={"mailto:" + email}>{email}</a></div></div>}
                {website && <div className="flex items-start gap-3"><ArrowRight size={20} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Website</p><a className="mt-1 block break-all text-sm font-semibold text-slate-900 hover:text-emerald-700" href={website.startsWith("http://") || website.startsWith("https://") ? website : "https://" + website} target="_blank" rel="noreferrer">{website}</a></div></div>}
              </div>
            </section>
            <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-[linear-gradient(135deg,var(--school-surface),var(--school-surface-tint))] p-6 shadow-sm ring-1 ring-slate-950/[0.025] transition duration-300 hover:shadow-lg sm:p-8">
              <h2 className="text-xl font-extrabold text-slate-950">Send a school inquiry</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">For admissions, fees, or general questions, send a message for the school administration to review.</p>
              {inquiryFeedback && <div role={inquiryFeedback.type === "error" ? "alert" : "status"} className={"mt-4 rounded-xl border p-3 text-sm leading-6 " + (inquiryFeedback.type === "error" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900")}>{inquiryFeedback.message}</div>}
              <form className="mt-5 space-y-5" onSubmit={submitInquiry}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">Your name
                    <input required minLength={2} maxLength={100} autoComplete="name" value={inquiryForm.name} onChange={(event) => setInquiryForm((current) => ({ ...current, name: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-[var(--school-primary)] focus:ring-4 focus:ring-emerald-500/10" />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">Email address
                    <input required type="email" maxLength={254} autoComplete="email" value={inquiryForm.email} onChange={(event) => setInquiryForm((current) => ({ ...current, email: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-[var(--school-primary)] focus:ring-4 focus:ring-emerald-500/10" />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">Phone (optional)
                    <input type="tel" maxLength={40} autoComplete="tel" value={inquiryForm.phone} onChange={(event) => setInquiryForm((current) => ({ ...current, phone: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-[var(--school-primary)] focus:ring-4 focus:ring-emerald-500/10" />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">Inquiry topic
                    <select value={inquiryForm.topic} onChange={(event) => setInquiryForm((current) => ({ ...current, topic: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-[var(--school-primary)] focus:ring-4 focus:ring-emerald-500/10">
                      <option value="admissions">Admissions</option><option value="fees">Fees</option><option value="general">General inquiry</option><option value="other">Other</option>
                    </select>
                  </label>
                </div>
                <label className="block text-sm font-semibold text-slate-700">Message
                  <textarea required minLength={15} maxLength={4000} rows={5} value={inquiryForm.message} onChange={(event) => setInquiryForm((current) => ({ ...current, message: event.target.value }))} placeholder="Tell the school what you would like to know..." className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white/90 px-3.5 py-3.5 text-sm leading-6 text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-[var(--school-primary)] focus:ring-4 focus:ring-emerald-500/10" />
                </label>
                <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
                  <label htmlFor="school-website-confirmation">Leave this field empty</label>
                  <input id="school-website-confirmation" type="text" tabIndex={-1} autoComplete="off" value={inquiryForm.website_confirmation} onChange={(event) => setInquiryForm((current) => ({ ...current, website_confirmation: event.target.value }))} />
                </div>
                <button type="submit" disabled={inquirySubmitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-emerald-950/15 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--school-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto">
                  {inquirySubmitting ? <><RefreshCw size={16} className="animate-spin" />Submitting...</> : <>Submit inquiry <ArrowRight size={16} /></>}
                </button>
                <p className="text-xs leading-5 text-slate-500">Your message is saved for the school administration to review. This form does not send email automatically. Please do not include student ID numbers, passwords, or sensitive documents.</p>
              </form>
            </section>
          </div>
        </>
      );
      break;
    default: {
      const visibleEvents = events.slice(0, 3);
      const visibleProjects = projects.slice(0, 3);
      const visibleMedia = media.slice(0, 3);
      const schoolDetails = [
        { icon: MapPin, label: "Location", value: actualLocation },
        { icon: School, label: "School type", value: schoolType },
        { icon: CalendarDays, label: "Established", value: establishedYear },
        { icon: BookOpen, label: "Academic year", value: academicYear },
      ].filter((item) => item.value);

      pageContent = (
        <>
          <section
            className="public-home-hero relative isolate overflow-hidden rounded-[1.25rem] border border-white/15 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-950/5 sm:rounded-[1.75rem] lg:rounded-[2rem]"
            style={{ backgroundImage: `linear-gradient(135deg, ${websiteTheme.secondary} 0%, ${websiteTheme.primary} 100%)` }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                backgroundImage: `radial-gradient(circle at 12% 18%, ${rgbaFromHex(websiteTheme.accent, 0.32)} 0, transparent 31%), radial-gradient(circle at 82% 0%, ${rgbaFromHex("#ffffff", 0.12)} 0, transparent 32%)`,
              }}
            />
            <div className="relative grid min-h-0 lg:min-h-[36rem] lg:grid-cols-[1.08fr_.92fr]">
              <div className="relative z-10 flex min-w-0 flex-col items-start justify-center px-5 py-9 text-white sm:px-9 sm:py-14 lg:px-12 lg:py-16 xl:px-14">
                <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white/95 backdrop-blur">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: websiteTheme.accent }} />
                  School information & updates
                  {schoolType && <><span className="opacity-60">/</span><span className="normal-case tracking-normal">{schoolType}</span></>}
                </div>
                <h1 className="mt-6 max-w-[13ch] break-words text-[2.1rem] font-black leading-[1.04] tracking-[-0.045em] text-white [text-wrap:balance] sm:text-5xl lg:text-[3.35rem] xl:text-[3.8rem]">
                  {text(school, ["homepage_title"], schoolName)}
                </h1>
                <p className="mt-5 max-w-2xl whitespace-pre-line text-[15px] leading-7 text-white/85 sm:text-base sm:leading-8">
                  {text(school, ["public_description", "description", "about", "about_school"], "Explore official school information, learning programmes and published updates from our school community.")}
                </p>
                {motto && (
                  <p className="mt-4 max-w-xl border-l-2 pl-4 text-sm font-semibold italic leading-6 text-white/90" style={{ borderColor: websiteTheme.accent }}>
                    “{motto}”
                  </p>
                )}
                <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <Link to={pageUrl("contact")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold shadow-lg shadow-black/10 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent" style={{ backgroundColor: websiteTheme.surface, color: websiteTheme.primary }}>
                    Admissions & enquiries <ArrowRight size={16} />
                  </Link>
                  <Link to={pageUrl("about")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent">
                    Discover our school
                  </Link>
                </div>
                {actualLocation && (
                  <div className="mt-7 flex max-w-full items-start gap-2.5 text-sm leading-6 text-white/80">
                    <MapPin size={17} className="mt-1 shrink-0" /><span className="break-words">{actualLocation}</span>
                  </div>
                )}
              </div>

              <div className="relative min-h-[280px] px-4 pb-4 sm:min-h-[340px] sm:px-6 sm:pb-6 lg:min-h-full lg:px-5 lg:py-5 lg:pl-0">
                <div className="public-hero-visual relative h-full min-h-[260px] min-w-0 overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-xl shadow-slate-950/20 sm:min-h-[340px] sm:rounded-[1.6rem] lg:min-h-[31rem]" style={{ backgroundColor: rgbaFromHex(websiteTheme.surface, 0.08) }}>
                  {heroImageUrl ? (
                    <>
                      <img src={heroImageUrl} alt={heroImageAlt} fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                        <div className="mb-3 h-1 w-12 rounded-full" style={{ backgroundColor: websiteTheme.accent }} />
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/75">School profile</p>
                        <p className="mt-1 break-words text-xl font-extrabold leading-tight text-white sm:text-2xl">{schoolName}</p>
                        {(actualLocation || schoolType) && <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">{actualLocation && <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{actualLocation}</span>}{schoolType && <span>{schoolType}</span>}</p>}
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-6 sm:p-9" style={{ backgroundImage: `linear-gradient(145deg, ${websiteTheme.primary} 0%, ${websiteTheme.secondary} 100%)` }}>
                      <div aria-hidden="true" className="absolute -right-20 -top-16 h-64 w-64 rounded-full border border-white/15 shadow-[0_0_0_24px_rgba(255,255,255,0.025),0_0_0_52px_rgba(255,255,255,0.02)]" />
                      <div aria-hidden="true" className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full border border-white/15" />
                      <div className="relative w-full max-w-xs text-center">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.8rem] border border-white/25 bg-white/10 p-3 shadow-2xl shadow-black/10 backdrop-blur">
                          {logo ? <img src={logo} alt={`${schoolName} logo`} loading="lazy" className="h-full w-full object-contain" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} /> : <School size={48} strokeWidth={1.2} className="text-white" />}
                        </div>
                        <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/65">A school community</p>
                        <h2 className="mt-2 break-words text-2xl font-black leading-tight text-white sm:text-3xl">{schoolName}</h2>
                        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-white/75">Explore the school, its published learning information and school activities.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {schoolDetails.length > 0 && (
            <section aria-label="School information" className="public-school-facts mt-5 grid gap-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm sm:grid-cols-2 lg:grid-cols-4">
              {schoolDetails.map(({ icon: Icon, label, value }, index) => (
                <div key={label} className={`flex min-w-0 items-start gap-3 px-5 py-4 sm:px-6 ${index ? "border-t border-slate-100 sm:border-t-0 sm:border-l" : ""} ${index === 2 ? "lg:border-l" : ""}`}>
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Icon size={17} /></span>
                  <span className="min-w-0"><span className="block text-[10px] font-extrabold uppercase tracking-[0.13em] text-slate-500">{label}</span><span className="mt-1 block break-words text-sm font-bold leading-5 text-slate-900">{value}</span></span>
                </div>
              ))}
            </section>
          )}

          <section className="public-home-intro mt-12 scroll-mt-28 grid gap-7 sm:mt-16 lg:mt-20 lg:grid-cols-[.9fr_1.1fr] lg:items-start lg:gap-14">
            <div className="min-w-0">
              <p className="public-section-kicker inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.17em] text-emerald-700"><span className="h-px w-7" style={{ backgroundColor: websiteTheme.accent }} /> Get to know us</p>
              <h2 className="mt-4 max-w-xl break-words text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">About {schoolName}</h2>
              <p className="mt-5 whitespace-pre-line text-[15px] leading-7 text-slate-600 sm:text-base sm:leading-8">{about}</p>
              <Link to={pageUrl("about")} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold text-white transition hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--school-primary)] focus-visible:ring-offset-2" style={{ backgroundColor: websiteTheme.primary }}>
                Read about the school <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {mission && <article className="group/story relative overflow-hidden rounded-3xl border border-slate-200/80 bg-[linear-gradient(135deg,var(--school-surface),var(--school-surface-tint))] p-5 shadow-sm ring-1 ring-slate-950/[0.025] transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><BookOpen size={20} /></span><h3 className="mt-4 text-lg font-extrabold text-slate-950">Our mission</h3><p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{mission}</p></article>}
              {vision && <article className="group/story relative overflow-hidden rounded-3xl border border-slate-200/80 bg-[linear-gradient(135deg,var(--school-surface),var(--school-surface-tint))] p-5 shadow-sm ring-1 ring-slate-950/[0.025] transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><GraduationCap size={20} /></span><h3 className="mt-4 text-lg font-extrabold text-slate-950">Our vision</h3><p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{vision}</p></article>}
              {!mission && !vision && <aside className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:col-span-2 sm:p-7"><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-700">Explore further</p><h3 className="mt-3 text-xl font-extrabold text-slate-950">Find the information you need</h3><p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">Browse published academic information, school activities, announcements and official resources.</p><div className="mt-5 flex flex-wrap gap-2"><Link to={pageUrl("academics")} className="rounded-full border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-emerald-300">Academics</Link><Link to={pageUrl("activities")} className="rounded-full border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-emerald-300">School life</Link><Link to={pageUrl("contact")} className="rounded-full border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-emerald-300">Contact</Link></div></aside>}
            </div>
          </section>

          <section className="mt-16 border-t border-slate-200/80 pt-12 sm:mt-20 sm:pt-16">
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="public-section-kicker text-xs font-extrabold uppercase tracking-[0.17em] text-emerald-700">Explore the school</p><h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Information for families and visitors</h2></div><p className="max-w-xl text-sm leading-7 text-slate-600">Explore the school's published information, events and public resources.</p></div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <FeatureLink href={pageUrl("academics")} icon={BookOpen} title="Academics" description="Learning pathways, departments and published academic projects." />
              <FeatureLink href={pageUrl("activities")} icon={CalendarDays} title="School life" description="Clubs, activities and opportunities published by the school." />
              <FeatureLink href={pageUrl("events")} icon={CalendarDays} title="News and events" description="Announcements and public events from the school community." />
              <FeatureLink href={pageUrl("media")} icon={ImageIcon} title="Photos and videos" description="View photographs and videos approved for public viewing." />
              <FeatureLink href={pageUrl("documents")} icon={FileText} title="Public documents" description="Access school forms, notices and resources released for families." />
              <FeatureLink href={pageUrl("contact")} icon={Mail} title="Contact the school" description="Find the published contact details and send an inquiry." />
            </div>
          </section>

          {visibleEvents.length > 0 && (
            <section className="mt-16 sm:mt-20">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="public-section-kicker text-xs font-extrabold uppercase tracking-[0.17em] text-emerald-700">From the school calendar</p><h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Latest news and events</h2></div><Link to={pageUrl("events")} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-extrabold text-emerald-700 hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--school-primary)]">View all events <ArrowRight size={15} /></Link></div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleEvents.map((item, index) => <ResourceCard key={recordId(item) || `home-event-${index}`} item={item} kind="event" />)}</div>
            </section>
          )}

          {visibleProjects.length > 0 && (
            <section className="mt-16 sm:mt-20">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="public-section-kicker text-xs font-extrabold uppercase tracking-[0.17em] text-emerald-700">Learning and achievement</p><h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Academic highlights</h2></div><Link to={pageUrl("academics")} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-extrabold text-emerald-700 hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--school-primary)]">Explore academics <ArrowRight size={15} /></Link></div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleProjects.map((item, index) => <ResourceCard key={recordId(item) || `home-project-${index}`} item={item} kind="project" />)}</div>
            </section>
          )}

          {visibleMedia.length > 0 && (
            <section className="mt-16 sm:mt-20">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="public-section-kicker text-xs font-extrabold uppercase tracking-[0.17em] text-emerald-700">School gallery</p><h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">A glimpse of school life</h2></div><Link to={pageUrl("media")} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-extrabold text-emerald-700 hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--school-primary)]">Open gallery <ArrowRight size={15} /></Link></div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visibleMedia.map((item, index) => <MediaCard key={recordId(item) || `home-media-${index}`} item={item} onOpen={setSelectedMedia} />)}</div>
            </section>
          )}

          <section className="public-contact-cta relative mt-14 overflow-hidden rounded-2xl p-5 shadow-2xl shadow-slate-950/10 sm:mt-20 sm:rounded-[1.6rem] sm:p-9 lg:p-10" style={{ backgroundImage: `linear-gradient(125deg, ${websiteTheme.secondary} 0%, ${websiteTheme.primary} 100%)` }}>
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full border border-white/15 shadow-[0_0_0_32px_rgba(255,255,255,0.025),0_0_0_64px_rgba(255,255,255,0.02)]" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[0.17em] text-white/70">Connect with us</p><h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">Questions about {schoolName}?</h2><p className="mt-3 text-sm leading-7 text-white/80">Use the school's published contact details or send an inquiry to the administration.</p>
                {(phone || email) && <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-white">{phone && <a className="inline-flex items-center gap-2 hover:underline" href={`tel:${phone}`}><Phone size={15} />{phone}</a>}{email && <a className="inline-flex items-center gap-2 break-all hover:underline" href={`mailto:${email}`}><Mail size={15} />{email}</a>}</div>}
              </div>
              <Link to={pageUrl("contact")} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold shadow-lg shadow-black/10 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" style={{ backgroundColor: websiteTheme.surface, color: websiteTheme.primary }}>Contact the school <ArrowRight size={16} /></Link>
            </div>
          </section>
        </>
      );
    }
  }

  return (
    <div data-school-website="true" className={"public-school-site min-h-screen text-slate-900 school-buttons-" + websiteTheme.button_style} style={websiteThemeStyle}>
      <style>{'[data-school-website=true] .text-emerald-700, [data-school-website=true] .text-emerald-800, [data-school-website=true] .text-emerald-900, [data-school-website=true] .text-emerald-950 { color:var(--school-primary)!important; } [data-school-website=true] .bg-emerald-700, [data-school-website=true] .bg-emerald-800 { background-color:var(--school-primary)!important; } [data-school-website=true] .bg-emerald-900, [data-school-website=true] .bg-emerald-950, [data-school-website=true] .bg-slate-950 { background-color:var(--school-secondary)!important; } [data-school-website=true] .bg-emerald-50, [data-school-website=true] .bg-emerald-100 { background-color:color-mix(in srgb,var(--school-primary) 8%,white)!important; } [data-school-website=true] .border-emerald-100, [data-school-website=true] .border-emerald-200 { border-color:color-mix(in srgb,var(--school-primary) 18%,white)!important; } [data-school-website=true] .text-slate-950, [data-school-website=true] .text-slate-900 { color:var(--school-heading)!important; } [data-school-website=true] .text-slate-700, [data-school-website=true] .text-slate-600 { color:var(--school-body)!important; } [data-school-website=true] .bg-white { background-color:var(--school-surface)!important; } [data-school-website=true] [data-school-header=v2] { background-color:var(--school-header)!important; } [data-school-website=true] footer { background-color:var(--school-footer)!important; } [data-school-website=true].school-buttons-outline a.bg-emerald-700:not([aria-current=page]),[data-school-website=true].school-buttons-outline button.bg-emerald-700 { background:transparent!important;color:var(--school-primary)!important;border:1px solid var(--school-primary)!important; } [data-school-website=true].school-buttons-soft a.bg-emerald-700:not([aria-current=page]),[data-school-website=true].school-buttons-soft button.bg-emerald-700 { background-color:color-mix(in srgb,var(--school-primary) 12%,white)!important;color:var(--school-primary)!important; } [data-school-website=true] .public-home-hero { isolation:isolate; } [data-school-website=true] .public-hero-visual { min-width:0; } [data-school-website=true] .public-school-facts > div { min-width:0; } [data-school-website=true] .public-school-facts > div:first-child { border-left:0; } [data-school-website=true] .public-feature-link { min-height:150px; } [data-school-website=true] .public-media-card img { will-change:transform; } [data-school-website=true] a, [data-school-website=true] button { -webkit-tap-highlight-color:transparent; } [data-school-website=true] :is(a,button,input,select,textarea):focus-visible { outline-color:var(--school-primary); } @media (max-width: 639px) { [data-school-website=true] .public-home-hero { border-radius:1.25rem; } [data-school-website=true] .public-feature-link { min-height:0; } [data-school-website=true] .public-school-facts > div { border-left:0; } } @media (min-width: 640px) { [data-school-website=true] .public-home-intro { scroll-margin-top:7rem; } } @media (prefers-reduced-motion:reduce) { [data-school-website=true] *, [data-school-website=true] *::before, [data-school-website=true] *::after { scroll-behavior:auto!important; animation-duration:0.01ms!important; animation-iteration-count:1!important; transition-duration:0.01ms!important; } }'}</style>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3">Skip to content</a>
      <header data-school-header="v2" style={{ backgroundColor: websiteTheme.header }} className="sticky top-0 z-30 border-b border-slate-200/80 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl supports-[backdrop-filter]:bg-white/90">
        <div className="mx-auto flex max-w-[88rem] items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
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
              to={`/jumuiya/elimu/parent?school=${encodeURIComponent(publicSchoolSlug || schoolSlug)}`}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <Users size={16} /> Parent portal
            </Link>
            <Link
              to={`/jumuiya/elimu/student?school=${encodeURIComponent(publicSchoolSlug || schoolSlug)}`}
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
                  to={`/jumuiya/elimu/parent?school=${encodeURIComponent(publicSchoolSlug || schoolSlug)}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  <Users size={17} /> Parent portal <ArrowRight size={14} />
                </Link>
                <Link
                  to={`/jumuiya/elimu/student?school=${encodeURIComponent(publicSchoolSlug || schoolSlug)}`}
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

      <main id="main-content" className="mx-auto w-full max-w-[88rem] px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-14 2xl:px-10">
        {resourceWarning && <div role="status" className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><XCircle size={18} className="mt-0.5 shrink-0"/><p>{resourceWarning}</p><button type="button" className="ml-auto shrink-0 font-bold underline" disabled={refreshing} onClick={() => void loadPage({ silent: true })}>Retry</button></div>}
        {pageContent}
      </main>

      <footer style={{ backgroundColor: websiteTheme.footer }} className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[88rem] flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div><p className="text-sm font-extrabold text-slate-900">{schoolName}</p><p className="mt-1 text-xs text-slate-500">Official public school website</p></div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-4 gap-y-2">{NAV_ITEMS.map((item) => <Link key={item.path || "home"} to={pageUrl(item.path)} className="text-xs font-semibold text-slate-600 hover:text-emerald-700">{item.label}</Link>)}</nav>
          <p className="text-xs text-slate-500">Powered by <a href="/" className="font-bold text-emerald-700 hover:underline">RevelaCode · Jumuiya Elimu</a></p>
        </div>
      </footer>

      {selectedMedia && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="school-media-dialog-title"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/90 p-3 backdrop-blur-sm sm:p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedMedia(null);
          }}
        >
          <div className="relative flex max-h-full w-full max-w-6xl flex-col items-center">
            <div className="mb-3 flex w-full items-center justify-between gap-4 px-1 text-white">
              <p id="school-media-dialog-title" className="min-w-0 break-words text-sm font-bold sm:text-base">
                {text(selectedMedia, ["title", "caption", "alt_text", "name"], "School photo")}
              </p>
              <button type="button" autoFocus onClick={() => setSelectedMedia(null)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Close photo viewer">
                <X size={21} />
              </button>
            </div>
            <img
              src={text(selectedMedia, ["url", "secure_url", "media_url", "file_url"])}
              alt={text(selectedMedia, ["alt_text", "caption", "title", "name"], "School photo")}
              className="max-h-[78vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
            {text(selectedMedia, ["caption", "description"]) && (
              <p className="mt-3 max-w-3xl text-center text-sm leading-6 text-white/80">{text(selectedMedia, ["caption", "description"])}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
