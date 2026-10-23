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

function themeLuminance(hex) {
  const safe = /^#[0-9a-f]{6}$/i.test(String(hex || "")) ? String(hex) : "#ffffff";
  const channels = [1, 3, 5].map((offset) => parseInt(safe.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function themeContrastRatio(background, foreground) {
  const a = themeLuminance(background);
  const b = themeLuminance(foreground);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function themeForeground(background, preferred = DEFAULT_PUBLIC_THEME.heading) {
  const safePreferred = /^#[0-9a-f]{6}$/i.test(String(preferred || "")) ? preferred : DEFAULT_PUBLIC_THEME.heading;
  return themeContrastRatio(background, "#ffffff") >= themeContrastRatio(background, safePreferred)
    ? "#ffffff"
    : safePreferred;
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
    <header className="school-page-heading relative mb-8 overflow-hidden rounded-3xl border bg-[linear-gradient(135deg,var(--school-surface),var(--school-surface-tint))] p-5 sm:mb-10 sm:p-8">
      <div aria-hidden="true" className="school-heading-orb pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full border" />
      <div className="relative flex min-w-0 items-start gap-4">
        <span className="school-section-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm sm:h-12 sm:w-12"><Icon size={21} strokeWidth={1.8} /></span>
        <div className="min-w-0 flex-1">
          <div className="school-page-kicker flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.17em] sm:text-xs"><span className="school-kicker-line h-px w-5" />{eyebrow}</div>
          <h1 className="mt-2 break-words text-2xl font-black tracking-tight text-slate-950 [text-wrap:balance] sm:text-4xl lg:text-[2.65rem]">{title}</h1>
          {description && <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">{description}</p>}
        </div>
      </div>
    </header>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="school-empty-state relative overflow-hidden rounded-3xl border border-dashed bg-[linear-gradient(135deg,var(--school-surface),var(--school-surface-tint))] p-8 text-center sm:p-12">
      <div aria-hidden="true" className="school-empty-line pointer-events-none absolute inset-x-10 top-0 h-px" />
      <div className="school-section-icon mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm"><Icon size={25} strokeWidth={1.7} /></div>
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
    <article className={"school-resource-card school-surface-card group/resource relative flex min-w-0 flex-col overflow-hidden rounded-3xl border bg-[linear-gradient(135deg,var(--school-surface),var(--school-surface-tint))] p-5 transition duration-300 ease-out motion-safe:hover:-translate-y-1 hover:border-[var(--school-primary)] focus-within:ring-2 focus-within:ring-[var(--school-primary)] sm:p-6 " + (kind === "document" ? "school-document-row" : "")}>
      <div className="flex items-start gap-3">
        <div className="school-section-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition duration-300 group-hover/resource:scale-105 group-hover/resource:shadow-md"><Icon size={21} strokeWidth={1.8} /></div>
        <h2 className="min-w-0 break-words pt-1 text-sm font-extrabold leading-6 tracking-tight text-slate-900 sm:text-base">{title}</h2>
      </div>
      <p className="mt-4 flex-1 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{description}</p>
      {(date || category) && (
        <div className="school-resource-meta mt-4 flex flex-wrap gap-2 border-t pt-4 text-xs text-slate-500">
          {date && <span className="school-date-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"><CalendarDays size={13} />{formatDate(date) || date}</span>}
          {category && <span className="school-category-chip rounded-full px-2.5 py-1 capitalize">{category.replace(/[_-]+/g, " ")}</span>}
        </div>
      )}
      {kind === "document" && (
        <button
          type="button"
          disabled={!id || Boolean(downloadingId)}
          onClick={() => onDownload(item)}
          className="school-download-button mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-extrabold transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--school-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
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
    <article className="public-media-card school-surface-card group min-w-0 overflow-hidden rounded-3xl border bg-[var(--school-surface)] transition duration-300 ease-out motion-safe:hover:-translate-y-1.5 hover:border-[var(--school-primary)]">
      <div className="school-media-image-bg relative aspect-[4/3] overflow-hidden">
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
            <span className="school-media-overlay pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold opacity-0 backdrop-blur transition group-hover/photo:opacity-100 group-focus-visible/photo:opacity-100">
              <span>View photo</span><ImageIcon size={15} />
            </span>
          </button>
        )}
      </div>
      <div className="school-media-caption border-t p-4 sm:p-5">
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
      className="public-feature-link school-surface-card group relative flex h-full min-w-0 items-start gap-4 overflow-hidden rounded-3xl border bg-[linear-gradient(135deg,var(--school-surface),var(--school-surface-tint))] p-5 transition duration-300 ease-out motion-safe:hover:-translate-y-1.5 hover:border-[var(--school-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--school-primary)] focus-visible:ring-offset-2 sm:p-6"
    >
      <span className="school-section-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition duration-300 group-hover:scale-105 group-hover:shadow-md">
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
    <article className="school-surface-card group/offering relative flex min-w-0 flex-col overflow-hidden rounded-3xl border bg-[linear-gradient(135deg,var(--school-surface),var(--school-surface-tint))] p-5 transition duration-300 ease-out motion-safe:hover:-translate-y-1 hover:border-[var(--school-primary)] sm:p-6">
      {eyebrow && <p className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-emerald-700 sm:text-xs"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{eyebrow}</p>}
      <h3 className="mt-3 break-words text-lg font-extrabold tracking-tight text-slate-950 sm:text-xl">{title}</h3>
      {description && <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{description}</p>}
      {cleanTags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{cleanTags.map((tag, index) => <span key={`${tag}-${index}`} className="school-tag rounded-full px-2.5 py-1 text-xs font-semibold">{tag}</span>)}</div>}
      {cleanDetails.length > 0 && <dl className="mt-5 space-y-2.5 border-t border-slate-100/90 pt-4">{cleanDetails.map((detail, index) => <div key={`${detail}-${index}`} className="flex items-start gap-2 text-xs leading-6 text-slate-500"><span className="school-detail-dot mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />{detail}</div>)}</dl>}
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
    "--school-primary-text": themeForeground(websiteTheme.primary, websiteTheme.heading),
    "--school-secondary": websiteTheme.secondary,
    "--school-secondary-text": themeForeground(websiteTheme.secondary, websiteTheme.heading),
    "--school-accent": websiteTheme.accent,
    "--school-background": websiteTheme.background,
    "--school-surface": websiteTheme.surface,
    "--school-heading": websiteTheme.heading,
    "--school-body": websiteTheme.body,
    "--school-header": websiteTheme.header,
    "--school-header-text": themeForeground(websiteTheme.header, websiteTheme.heading),
    "--school-footer": websiteTheme.footer,
    "--school-footer-text": themeForeground(websiteTheme.footer, websiteTheme.heading),
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
      <main data-school-website="true" className="school-loading-screen min-h-screen p-4 sm:p-8" style={{ "--school-background": DEFAULT_PUBLIC_THEME.background, "--school-surface": DEFAULT_PUBLIC_THEME.surface, "--school-surface-tint": DEFAULT_PUBLIC_THEME.background, "--school-primary": DEFAULT_PUBLIC_THEME.primary, "--school-secondary": DEFAULT_PUBLIC_THEME.secondary, "--school-heading": DEFAULT_PUBLIC_THEME.heading, "--school-body": DEFAULT_PUBLIC_THEME.body }}>
        <div className="mx-auto max-w-7xl" role="status" aria-busy="true">
          <span className="sr-only">Loading school website and published resources.</span>
          <div className="school-skeleton-bar mb-7 flex items-center gap-4 rounded-2xl border p-4 sm:p-5"><div className="school-skeleton-block h-12 w-12 shrink-0 rounded-xl" /><div className="min-w-0 flex-1"><div className="school-skeleton-block h-4 w-48 max-w-full rounded-md" /><div className="school-skeleton-block mt-3 h-3 w-32 max-w-full rounded-md" /></div><div className="hidden gap-2 lg:flex"><div className="school-skeleton-block h-9 w-20 rounded-lg" /><div className="school-skeleton-block h-9 w-24 rounded-lg" /><div className="school-skeleton-block h-9 w-20 rounded-lg" /></div></div>
          <div className="school-skeleton-block h-64 rounded-3xl sm:h-80 lg:h-[28rem]" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="school-skeleton-card rounded-2xl border p-5"><div className="school-skeleton-block h-10 w-10 rounded-xl" /><div className="school-skeleton-block mt-5 h-4 w-3/4 rounded-md" /><div className="school-skeleton-block mt-3 h-3 w-full rounded-md" /><div className="school-skeleton-block mt-2 h-3 w-2/3 rounded-md" /></div>)}</div>
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
          <section className="school-academic-band mb-10 space-y-4">
            <div><h2 className="text-xl font-extrabold text-slate-950">Courses and programs</h2><p className="mt-1 text-sm leading-6 text-slate-500">School-published courses, programs, duration and entry information.</p></div>
            <PublicOfferingGrid items={courses} icon={BookOpen} emptyTitle="Courses will be listed here" emptyDescription="The school has not published course or program details yet." renderItem={(item, index) => <OfferingCard key={recordId(item) || `course-${index}`} title={text(item, ["name", "title"], "Course / program")} eyebrow={text(item, ["level"], "Course / program")} description={text(item, ["description"])} details={[item.duration ? `Duration: ${item.duration}` : "", item.requirements ? `Entry requirements: ${item.requirements}` : ""]} />} />
          </section>
          <section className="school-academic-band mb-10 space-y-4">
            <div><h2 className="text-xl font-extrabold text-slate-950">Academic departments</h2><p className="mt-1 text-sm leading-6 text-slate-500">Departments and the subjects or learning areas they support.</p></div>
            <PublicOfferingGrid items={departments} icon={School} emptyTitle="Departments will be listed here" emptyDescription="The school has not published department details yet." renderItem={(item, index) => <OfferingCard key={recordId(item) || `department-${index}`} title={text(item, ["name", "title"], "Department")} eyebrow="Academic department" description={text(item, ["description"])} tags={item.subjects || []} />} />
          </section>
          <section className="school-academic-band space-y-4">
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
      pageContent = <><PageHeading icon={ImageIcon} eyebrow="Our school in pictures" title="Photos and videos" description="View school facilities, activities, events and other media released for public viewing." />{media.length ? <div className="school-media-bento grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{media.map((item, index) => <MediaCard key={recordId(item) || `media-${index}`} item={item} onOpen={setSelectedMedia} />)}</div> : <EmptyState icon={ImageIcon} title="Gallery coming soon" description="The school has not published photos or videos yet. Approved media will appear here." />}</>;
      break;
    case "documents":
      pageContent = <><PageHeading icon={FileText} eyebrow="School resources" title="Public documents" description="Download school forms, notices, calendars, handbooks and other documents that have been approved for public release." />{downloadError && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">{downloadError}</div>}{documents.length ? <div className="school-documents-list grid gap-3">{documents.map((item, index) => <ResourceCard key={recordId(item) || `document-${index}`} item={item} kind="document" onDownload={handleDownload} downloadingId={downloadingId} />)}</div> : <EmptyState icon={FileText} title="No public documents available" description="School-approved public documents will appear here after they are published." />}<div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><ShieldCheck size={19} className="mt-0.5 shrink-0" /><p>This library is for public documents only. Private student records, report cards and individual fee statements require authenticated, authorized access.</p></div></>;
      break;
    case "contact":
      pageContent = (
        <>
          <PageHeading icon={Mail} eyebrow="Get in touch" title="Contact the school" description="Use the official contact details or send an inquiry to the school administration." />
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <section className="school-contact-panel relative overflow-hidden rounded-3xl border bg-[linear-gradient(135deg,var(--school-surface),var(--school-surface-tint))] p-6 transition duration-300 sm:p-8">
              <h2 className="text-lg font-extrabold text-slate-950">Official contact details</h2>
              <div className="mt-6 space-y-5">
                <div className="school-contact-detail flex items-start gap-3"><MapPin size={20} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</p><p className="mt-1 text-sm font-semibold text-slate-900">{locationText}</p><a className="mt-2 inline-flex text-xs font-bold text-emerald-700 hover:underline" href={"https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(locationText)} target="_blank" rel="noreferrer">Open map <ArrowRight size={13} className="ml-1" /></a></div></div>
                {phone && <div className="school-contact-detail flex items-start gap-3"><Phone size={20} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Telephone</p><a className="mt-1 block text-sm font-semibold text-slate-900 hover:text-emerald-700" href={"tel:" + phone}>{phone}</a></div></div>}
                {email && <div className="school-contact-detail flex items-start gap-3"><Mail size={20} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p><a className="mt-1 block break-all text-sm font-semibold text-slate-900 hover:text-emerald-700" href={"mailto:" + email}>{email}</a></div></div>}
                {website && <div className="school-contact-detail flex items-start gap-3"><ArrowRight size={20} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Website</p><a className="mt-1 block break-all text-sm font-semibold text-slate-900 hover:text-emerald-700" href={website.startsWith("http://") || website.startsWith("https://") ? website : "https://" + website} target="_blank" rel="noreferrer">{website}</a></div></div>}
              </div>
            </section>
            <section className="school-contact-panel relative overflow-hidden rounded-3xl border bg-[linear-gradient(135deg,var(--school-surface),var(--school-surface-tint))] p-6 transition duration-300 sm:p-8">
              <h2 className="text-xl font-extrabold text-slate-950">Send a school inquiry</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">For admissions, fees, or general questions, send a message for the school administration to review.</p>
              {inquiryFeedback && <div role={inquiryFeedback.type === "error" ? "alert" : "status"} className={"mt-4 rounded-xl border p-3 text-sm leading-6 " + (inquiryFeedback.type === "error" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900")}>{inquiryFeedback.message}</div>}
              <form className="school-inquiry-form mt-5 space-y-5" onSubmit={submitInquiry}>
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
                <button type="submit" disabled={inquirySubmitting} className="school-form-submit inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--school-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto">
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
      const visibleMedia = media.filter((item) => text(item, ["url", "secure_url", "media_url", "file_url"])).slice(0, 4);
      const hasAcademicContent = courses.length > 0 || departments.length > 0;
      const hasActivities = coCurricularActivities.length > 0;
      pageContent = (
        <div className="school-home-page">
          <section className={"school-home-hero relative isolate overflow-hidden " + (!coverUrl ? "school-hero-no-cover" : "")} style={{ backgroundColor: websiteTheme.secondary }}>
            {coverUrl && <img src={coverUrl} alt={text(school, ["school_name", "name", "display_name"], "School campus")} fetchPriority="high" className="school-hero-cover absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
            <div className="school-hero-scrim absolute inset-0" aria-hidden="true" />
            <div className="school-hero-pattern absolute inset-0" aria-hidden="true" />
            <div className="school-home-hero-glow" aria-hidden="true" />
            <div className="school-hero-watermark pointer-events-none absolute right-[3%] top-1/2 hidden -translate-y-1/2 opacity-20 lg:block" aria-hidden="true">
              <School size={248} strokeWidth={0.65} className="school-hero-watermark-icon" />
              {logo && <img src={logo} alt="" className="school-hero-watermark-logo relative z-10 h-64 w-64 object-contain xl:h-80 xl:w-80" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
            </div>
            <div className="relative z-10 mx-auto grid min-h-[500px] max-w-[88rem] grid-cols-1 items-center gap-8 px-5 py-14 sm:px-8 sm:py-18 lg:min-h-[560px] lg:grid-cols-[minmax(0,1fr)_minmax(13rem,.5fr)] lg:px-12 xl:px-16">
              <div className="school-hero-content relative z-10 flex max-w-4xl flex-col justify-center">
                <div className="school-hero-badge mb-6 inline-flex w-fit items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold tracking-wide"><ShieldCheck size={15} /> Official school website</div>
                <p className="school-hero-kicker mb-3 text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: websiteTheme.heading }}>Welcome to</p>
                <h1 className="school-hero-heading max-w-3xl break-words text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">{text(school, ["homepage_title"], schoolName)}</h1>
                <p className="school-hero-lead mt-6 max-w-2xl whitespace-pre-line text-base leading-7 sm:text-lg sm:leading-8">{about}</p>
                {motto && <p className="school-hero-motto mt-5 max-w-2xl border-l-2 pl-4 text-base font-semibold italic leading-7 sm:text-lg" style={{ borderColor: websiteTheme.accent, color: websiteTheme.heading }}>“{motto}”</p>}
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to={pageUrl("contact")} className="school-cta-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--school-primary)] focus-visible:ring-offset-2">Admissions & enquiries <ArrowRight size={17} /></Link>
                  <Link to={pageUrl("about")} className="school-cta-secondary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--school-primary)]">Discover our school</Link>
                </div>
              </div>
              <div className="school-hero-aside relative z-10 hidden h-full items-end justify-end pb-3 lg:flex">
                <div className="school-hero-community max-w-sm rounded-2xl border p-5 backdrop-blur-xl">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em]">School community</p>
                  <p className="mt-2 break-words text-lg font-extrabold">{schoolName}</p>
                  {text(school, ["academic_year"]) && <p className="mt-4 inline-flex min-h-9 items-center rounded-lg px-3 py-2 text-sm font-extrabold" style={{ backgroundColor: websiteTheme.surface, color: websiteTheme.heading, border: "1px solid " + websiteTheme.accent }}>{text(school, ["academic_year"])}</p>}
                </div>
              </div>
            </div>
          </section>
          <section className="school-facts-strip relative z-20 mx-auto -mt-8 mb-7 max-w-[78rem]" aria-label="School information and quick links">
            <div className="school-facts-panel grid gap-0 rounded-2xl border shadow-xl sm:grid-cols-2 lg:grid-cols-4">
              {text(school, ["curriculum"]) && <div className="school-fact-item flex items-start gap-3 p-4 sm:p-5"><span className="school-fact-icon"><BookOpen size={18} /></span><div className="min-w-0"><p className="school-fact-label">Curriculum</p><p className="mt-1 break-words text-sm font-bold">{text(school, ["curriculum"])}</p></div></div>}
              {text(school, ["academic_year"]) && <div className="school-fact-item flex items-start gap-3 p-4 sm:p-5"><span className="school-fact-icon"><CalendarDays size={18} /></span><div className="min-w-0"><p className="school-fact-label">Academic year</p><p className="mt-1 break-words text-sm font-bold">{text(school, ["academic_year"])}</p></div></div>}
              {locationText && locationText !== "Contact the school for location details." && <div className="school-fact-item flex items-start gap-3 p-4 sm:p-5"><span className="school-fact-icon"><MapPin size={18} /></span><div className="min-w-0"><p className="school-fact-label">Location</p><p className="mt-1 break-words text-sm font-bold">{locationText}</p></div></div>}
              {(phone || email) && <div className="school-fact-item flex items-start gap-3 p-4 sm:p-5"><span className="school-fact-icon"><Phone size={18} /></span><div className="min-w-0"><p className="school-fact-label">Get in touch</p>{phone && <a href={"tel:" + phone} className="mt-1 block break-words text-sm font-bold hover:underline">{phone}</a>}{email && <a href={"mailto:" + email} className="mt-1 block break-all text-xs font-semibold hover:underline">{email}</a>}</div></div>}
              <div className="school-fact-item school-fact-actions flex flex-wrap items-center gap-2 p-4 sm:col-span-2 sm:px-5 lg:col-span-4">
                <Link to={pageUrl("contact")} className="school-fact-action inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold"><Mail size={15} /> Contact</Link>
                <Link to={"/jumuiya/elimu/parent?school=" + encodeURIComponent(publicSchoolSlug || schoolSlug)} className="school-fact-action inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-extrabold"><Users size={15} /> Parent portal</Link>
                <Link to={"/jumuiya/elimu/student?school=" + encodeURIComponent(publicSchoolSlug || schoolSlug)} className="school-fact-action inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-extrabold"><GraduationCap size={15} /> Student portal</Link>
              </div>
            </div>
          </section>

          <section className="school-home-intro grid gap-8 py-14 sm:py-16 lg:grid-cols-[.78fr_1.22fr] lg:items-start lg:gap-14 lg:py-20">
            <div><p className="school-section-kicker">A community built around learning</p><h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl" style={{ color: websiteTheme.heading }}>Education with purpose. A future with possibility.</h2><p className="mt-5 text-base leading-8" style={{ color: websiteTheme.body }}>{about}</p><Link to={pageUrl("about")} className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold transition hover:gap-3" style={{ color: websiteTheme.primary }}>More about our school <ArrowRight size={17} /></Link></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {mission && <article className="school-statement-panel"><span className="school-statement-icon"><ShieldCheck size={21} /></span><h3>Our mission</h3><p>{mission}</p></article>}
              {vision && <article className="school-statement-panel"><span className="school-statement-icon"><ArrowRight size={21} /></span><h3>Our vision</h3><p>{vision}</p></article>}
              {motto && <article className="school-statement-panel school-motto-quote sm:col-span-2"><span className="school-statement-icon"><GraduationCap size={21} /></span><h3>Our motto</h3><p>{motto}</p></article>}
              {!mission && !vision && !motto && <article className="school-profile-panel sm:col-span-2"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: rgbaFromHex(websiteTheme.primary, 0.1), color: websiteTheme.primary }}><School size={24} /></div><div><h3 className="text-lg font-extrabold" style={{ color: websiteTheme.heading }}>Get to know {schoolName}</h3><p className="mt-2 text-sm leading-7" style={{ color: websiteTheme.body }}>Explore the school's published information, learning programmes, events and ways to connect with the school community.</p></div></div></article>}
            </div>
          </section>

          {(hasAcademicContent || hasActivities) && <section className="school-home-section py-12 sm:py-14">
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="school-section-kicker">Learning and opportunity</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl" style={{ color: websiteTheme.heading }}>Explore learning at {schoolName}</h2><p className="mt-3 max-w-2xl text-base leading-7" style={{ color: websiteTheme.body }}>Discover the academic pathways and activities the school has published for learners and families.</p></div><Link to={pageUrl("academics")} className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-extrabold" style={{ color: websiteTheme.primary }}>Academic information <ArrowRight size={16} /></Link></div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {courses.slice(0, 3).map((item, index) => <OfferingCard key={recordId(item) || "home-course-" + index} title={text(item, ["name", "title"], "Course or programme")} eyebrow={text(item, ["level"], "Academic programme")} description={text(item, ["description"])} details={[item.duration ? "Duration: " + item.duration : "", item.requirements ? "Entry information: " + item.requirements : ""]} />)}
              {departments.slice(0, Math.max(0, 3 - Math.min(courses.length, 3))).map((item, index) => <OfferingCard key={recordId(item) || "home-department-" + index} title={text(item, ["name", "title"], "Academic department")} eyebrow="Academic department" description={text(item, ["description"])} tags={item.subjects || []} />)}
              {coCurricularActivities.slice(0, Math.max(0, 3 - Math.min(courses.length + departments.length, 3))).map((item, index) => <OfferingCard key={recordId(item) || "home-activity-" + index} title={text(item, ["name", "title"], "School activity")} eyebrow={text(item, ["category"], "Co-curricular activity")} description={text(item, ["description"])} details={[item.schedule ? "Schedule: " + item.schedule : ""]} />)}
            </div>
          </section>}

          {visibleEvents.length > 0 && <section className="school-home-section py-12 sm:py-14">
            <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="school-section-kicker">From our school community</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl" style={{ color: websiteTheme.heading }}>News and events</h2><p className="mt-3 text-base leading-7" style={{ color: websiteTheme.body }}>The latest updates published by the school.</p></div><Link to={pageUrl("events")} className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-extrabold" style={{ color: websiteTheme.primary }}>All news and events <ArrowRight size={16} /></Link></div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visibleEvents.map((item, index) => <ResourceCard key={recordId(item) || "home-event-" + index} item={item} kind="event" />)}</div>
          </section>}

          {visibleProjects.length > 0 && <section className="school-home-section py-12 sm:py-14">
            <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="school-section-kicker">Learning in action</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl" style={{ color: websiteTheme.heading }}>Academic highlights</h2><p className="mt-3 text-base leading-7" style={{ color: websiteTheme.body }}>Projects and learning activities released for public viewing.</p></div><Link to={pageUrl("academics")} className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-extrabold" style={{ color: websiteTheme.primary }}>Explore academics <ArrowRight size={16} /></Link></div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visibleProjects.map((item, index) => <ResourceCard key={recordId(item) || "home-project-" + index} item={item} kind="project" />)}</div>
          </section>}

          {visibleMedia.length > 0 && <section className="school-home-section py-12 sm:py-14">
            <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="school-section-kicker">A glimpse of school life</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl" style={{ color: websiteTheme.heading }}>Around our school</h2><p className="mt-3 text-base leading-7" style={{ color: websiteTheme.body }}>Photos and media approved for public viewing.</p></div><Link to={pageUrl("media")} className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-extrabold" style={{ color: websiteTheme.primary }}>View gallery <ArrowRight size={16} /></Link></div>
            <div className="school-media-bento grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{visibleMedia.map((item, index) => <MediaCard key={recordId(item) || "home-media-" + index} item={item} />)}</div>
          </section>}

          <section className="school-home-contact my-10 sm:my-14"><div className="grid gap-6 px-6 py-8 sm:px-9 sm:py-10 lg:grid-cols-[1fr_auto] lg:items-center lg:px-12"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: websiteTheme.accent }}>Start a conversation</p><h2 className="mt-3 text-2xl font-black leading-tight text-white sm:text-3xl">Thinking about joining our school community?</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">Contact the school for current admissions guidance, requirements and important dates.</p></div><Link to={pageUrl("contact")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold transition hover:-translate-y-0.5 hover:bg-slate-100" style={{ color: websiteTheme.heading }}>Contact the school <ArrowRight size={17} /></Link></div></section>
        </div>
      );

    }
  }

  return (
    <div data-school-website="true" className={"min-h-screen pb-32 text-slate-900 school-buttons-" + websiteTheme.button_style} style={websiteThemeStyle}>
      <style>{`
        [data-school-website="true"] .text-emerald-700,
        [data-school-website="true"] .text-emerald-800,
        [data-school-website="true"] .text-emerald-900,
        [data-school-website="true"] .text-emerald-950,
        [data-school-website="true"] .text-blue-700,
        [data-school-website="true"] .text-blue-800 { color:var(--school-primary)!important; }

        [data-school-website="true"] .bg-emerald-700,
        [data-school-website="true"] .bg-emerald-800,
        [data-school-website="true"] .bg-blue-700,
        [data-school-website="true"] .bg-blue-800 { background-color:var(--school-primary)!important; color:var(--school-primary-text)!important; }

        [data-school-website="true"] .bg-emerald-900,
        [data-school-website="true"] .bg-emerald-950,
        [data-school-website="true"] .bg-slate-950 { background-color:var(--school-secondary)!important; color:var(--school-secondary-text)!important; }

        [data-school-website="true"] .bg-emerald-50,
        [data-school-website="true"] .bg-emerald-100,
        [data-school-website="true"] .bg-blue-50,
        [data-school-website="true"] .bg-blue-100 { background-color:color-mix(in srgb,var(--school-primary) 8%,var(--school-surface))!important; }

        [data-school-website="true"] .bg-slate-50 { background-color:var(--school-background)!important; }
        [data-school-website="true"] .bg-slate-100 { background-color:color-mix(in srgb,var(--school-primary) 4%,var(--school-surface))!important; }

        [data-school-website="true"] .border-emerald-100,
        [data-school-website="true"] .border-emerald-200,
        [data-school-website="true"] .border-blue-100,
        [data-school-website="true"] .border-blue-200 { border-color:color-mix(in srgb,var(--school-primary) 22%,var(--school-surface))!important; }

        [data-school-website="true"] .border-slate-100,
        [data-school-website="true"] .border-slate-200 { border-color:color-mix(in srgb,var(--school-heading) 12%,var(--school-surface))!important; }

        [data-school-website="true"] .text-slate-950,
        [data-school-website="true"] .text-slate-900 { color:var(--school-heading)!important; }
        [data-school-website="true"] .text-slate-700,
        [data-school-website="true"] .text-slate-600 { color:var(--school-body)!important; }

        [data-school-website="true"] .bg-white { background-color:var(--school-surface)!important; }
        [data-school-website="true"] [data-school-header="v2"] { background-color:var(--school-header)!important; color:var(--school-header-text)!important; }
        [data-school-website="true"] footer { background-color:var(--school-footer)!important; color:var(--school-footer-text)!important; }
        [data-school-website="true"] footer .text-white,
        [data-school-website="true"] footer a { color:var(--school-footer-text)!important; }

        [data-school-website="true"] .school-home-hero { color:var(--school-secondary-text); }
        [data-school-website="true"] .school-hero-heading,
        [data-school-website="true"] .school-hero-kicker,
        [data-school-website="true"] .school-hero-lead,
        [data-school-website="true"] .school-hero-motto,
        [data-school-website="true"] .school-hero-community,
        [data-school-website="true"] .school-hero-badge { color:var(--school-secondary-text)!important; }

        [data-school-website="true"] .school-cta-primary,
        [data-school-website="true"] .school-portal-primary,
        [data-school-website="true"] .school-footer-portal-primary,
        [data-school-website="true"] .school-fact-actions > .school-fact-action:first-child { background-color:var(--school-primary)!important; color:var(--school-primary-text)!important; border-color:var(--school-primary)!important; }
        [data-school-website="true"] .school-cta-secondary { background-color:var(--school-surface)!important; color:var(--school-primary)!important; border-color:color-mix(in srgb,var(--school-primary) 45%,var(--school-surface))!important; }
        [data-school-website="true"] .school-section-icon { background-color:color-mix(in srgb,var(--school-primary) 10%,var(--school-surface))!important; color:var(--school-primary)!important; border-color:color-mix(in srgb,var(--school-primary) 24%,var(--school-surface))!important; }
        [data-school-website="true"] .school-tag { background-color:color-mix(in srgb,var(--school-primary) 9%,var(--school-surface))!important; color:var(--school-primary)!important; border-color:color-mix(in srgb,var(--school-primary) 18%,var(--school-surface))!important; }
        [data-school-website="true"] .school-nav-link[aria-current="page"] { color:var(--school-primary)!important; }
        [data-school-website="true"] .school-fact-actions { background-color:color-mix(in srgb,var(--school-primary) 6%,var(--school-surface))!important; }
        [data-school-website="true"] .school-home-contact { background:linear-gradient(115deg,var(--school-secondary),var(--school-primary))!important; }
        [data-school-website="true"].school-buttons-outline .school-cta-primary { background:transparent!important; color:var(--school-primary)!important; border:1px solid var(--school-primary)!important; }
        [data-school-website="true"].school-buttons-soft .school-cta-primary { background-color:color-mix(in srgb,var(--school-primary) 12%,var(--school-surface))!important; color:var(--school-primary)!important; border-color:transparent!important; }

        @media (prefers-reduced-motion:reduce) {
          [data-school-website="true"] *,
          [data-school-website="true"] *::before,
          [data-school-website="true"] *::after {
            scroll-behavior:auto!important;
            animation-duration:0.01ms!important;
            animation-iteration-count:1!important;
            transition-duration:0.01ms!important;
          }
        }
      `}</style>
      <style>{`
        [data-school-website="true"] .school-home-page { color:var(--school-body); }
        [data-school-website="true"] .school-home-hero { border-radius:0; overflow:hidden; box-shadow:0 28px 70px color-mix(in srgb,var(--school-heading) 16%,transparent); }
        [data-school-website="true"] .school-home-hero-glow { position:absolute; z-index:0; inset:0; pointer-events:none; background:radial-gradient(circle at 12% 15%, color-mix(in srgb,var(--school-primary) 70%,transparent),transparent 48%); opacity:.65; }
        [data-school-website="true"] .school-home-visual img { transition:transform .8s cubic-bezier(.2,.7,.2,1); }
        [data-school-website="true"] .school-home-visual:hover img { transform:scale(1.025); }
        [data-school-website="true"] .school-section-kicker { color:var(--school-primary); font-size:.72rem; font-weight:800; letter-spacing:.16em; line-height:1.4; text-transform:uppercase; }
        [data-school-website="true"] .school-statement-panel { border-top:3px solid var(--school-primary); border-radius:1rem; padding:1.35rem; background:var(--school-surface); box-shadow:0 12px 32px color-mix(in srgb,var(--school-heading) 7%,transparent); }
        [data-school-website="true"] .school-statement-icon { display:flex; width:2.8rem; height:2.8rem; align-items:center; justify-content:center; border-radius:.85rem; background:color-mix(in srgb,var(--school-primary) 10%,var(--school-surface)); color:var(--school-primary); }
        [data-school-website="true"] .school-statement-panel h3 { margin-top:1rem; color:var(--school-heading); font-size:1.05rem; font-weight:800; }
        [data-school-website="true"] .school-statement-panel p { margin-top:.55rem; color:var(--school-body); font-size:.92rem; line-height:1.8; white-space:pre-line; }
        [data-school-website="true"] .school-profile-panel { border:1px solid color-mix(in srgb,var(--school-primary) 15%,var(--school-surface)); border-radius:1rem; background:var(--school-surface); padding:1.5rem; }
        [data-school-website="true"] .school-home-section { border-top:1px solid color-mix(in srgb,var(--school-primary) 12%,var(--school-surface)); }
        [data-school-website="true"] .school-home-contact { overflow:hidden; border-radius:1.5rem; background:linear-gradient(115deg,var(--school-secondary),var(--school-primary)); box-shadow:0 20px 50px color-mix(in srgb,var(--school-heading) 12%,transparent); }
        [data-school-website="true"] .school-home-page article { min-width:0; }
        [data-school-website="true"] .school-home-page > .school-home-section { margin-top:.5rem; padding:clamp(1.25rem,3vw,2.25rem); border:1px solid color-mix(in srgb,var(--school-heading) 8%,var(--school-surface)); border-radius:1.4rem; background:var(--school-surface); }
        [data-school-website="true"] .school-home-page > .school-home-section:nth-of-type(odd) { background:var(--school-surface-tint); }
        [data-school-website="true"] .school-documents-list { grid-template-columns:minmax(0,1fr); }
        [data-school-website="true"] .school-document-row { width:100%; }
        [data-school-website="true"] .school-hero-kicker { color:var(--school-heading)!important; }
        [data-school-website="true"] .school-hero-motto { color:var(--school-heading)!important; }
        [data-school-website="true"] .school-home-contact { color:var(--school-surface); }
        [data-school-website="true"] .school-fact-icon { border-color:color-mix(in srgb,var(--school-primary) 18%,var(--school-surface)); }
        [data-school-website="true"] .school-hero-community { backdrop-filter:blur(18px); }
        [data-school-website="true"] #school-mobile-navigation a[aria-current="page"] { color:var(--school-surface)!important; background:color-mix(in srgb,var(--school-primary) 40%,var(--school-heading) 60%)!important; border-color:var(--school-primary)!important; }
        [data-school-website="true"] .shadow-sm,[data-school-website="true"] .shadow,[data-school-website="true"] .shadow-md,[data-school-website="true"] .shadow-lg,[data-school-website="true"] .shadow-xl,[data-school-website="true"] .shadow-2xl { --tw-shadow-color:color-mix(in srgb,var(--school-heading) 10%,transparent)!important; }
        [data-school-website="true"] [class*="ring-offset-"] { --tw-ring-offset-color:var(--school-surface)!important; }
        [data-school-website="true"] [class*="focus-visible:ring-emerald-"]:focus-visible { --tw-ring-color:color-mix(in srgb,var(--school-primary) 50%,transparent)!important; }
        [data-school-website="true"] [class*="hover:bg-emerald-"]:hover { background-color:color-mix(in srgb,var(--school-primary) 8%,var(--school-surface))!important; }
        [data-school-website="true"] [class*="hover:text-emerald-"]:hover { color:var(--school-primary)!important; }
        [data-school-website="true"] [class*="hover:border-emerald-"]:hover { border-color:color-mix(in srgb,var(--school-primary) 28%,var(--school-surface))!important; }
        [data-school-website="true"] [class*="hover:bg-slate-50"]:hover,[data-school-website="true"] [class*="hover:bg-slate-100"]:hover { background-color:var(--school-surface-tint)!important; }
        [data-school-website="true"] [class*="hover:text-slate-950"]:hover,[data-school-website="true"] [class*="hover:text-slate-900"]:hover { color:var(--school-heading)!important; }
        [data-school-website="true"] [class*="hover:border-slate-"]:hover { border-color:color-mix(in srgb,var(--school-heading) 22%,var(--school-surface))!important; }
        [data-school-website="true"] .text-slate-300,[data-school-website="true"] .text-slate-400,[data-school-website="true"] .text-slate-500 { color:var(--school-body)!important; opacity:.84; }
        @media(max-width:640px) { [data-school-website="true"] .school-home-hero { border-radius:1.1rem; } [data-school-website="true"] .school-home-contact { border-radius:1.1rem; } }

        /* Premium public-school website system: colours are derived from the selected school palette. */
        [data-school-website="true"] .school-home-hero { width:100vw; max-width:none; margin-left:calc(50% - 50vw); min-height:31rem; border-radius:0; box-shadow:0 28px 70px color-mix(in srgb,var(--school-heading) 16%,transparent); }
        [data-school-website="true"] .school-hero-cover { object-position:center 45%; }
        [data-school-website="true"] .school-hero-scrim { z-index:1; background:linear-gradient(90deg,color-mix(in srgb,var(--school-surface) 94%,var(--school-secondary) 6%) 0%,color-mix(in srgb,var(--school-secondary) 68%,transparent) 100%); }
        [data-school-website="true"] .school-hero-pattern { z-index:2; opacity:.13; background:radial-gradient(circle at 78% 22%,color-mix(in srgb,var(--school-accent) 34%,transparent) 0 1px,transparent 2px),linear-gradient(135deg,color-mix(in srgb,var(--school-primary) 48%,var(--school-secondary)),var(--school-secondary)); background-size:18px 18px,cover; }
        [data-school-website="true"] .school-hero-no-cover .school-hero-pattern { opacity:1; }
        [data-school-website="true"] .school-hero-no-cover .school-hero-scrim { background:linear-gradient(105deg,color-mix(in srgb,var(--school-surface) 92%,var(--school-secondary) 8%),color-mix(in srgb,var(--school-surface) 78%,var(--school-primary) 22%)); }
        [data-school-website="true"] .school-home-hero-glow { background:radial-gradient(circle at 14% 15%,color-mix(in srgb,var(--school-accent) 26%,transparent),transparent 48%); opacity:.85; }
        [data-school-website="true"] .school-hero-content { color:var(--school-surface); }
        [data-school-website="true"] .school-hero-heading { color:var(--school-heading); text-wrap:balance; }
        [data-school-website="true"] .school-hero-lead { color:var(--school-body); opacity:1; }
        [data-school-website="true"] .school-hero-badge { color:var(--school-heading); background:color-mix(in srgb,var(--school-surface) 88%,transparent); border-color:color-mix(in srgb,var(--school-primary) 24%,var(--school-surface)); }
        [data-school-website="true"] .school-hero-watermark { color:var(--school-accent); }
        [data-school-website="true"] .school-hero-watermark-icon { position:absolute; width:15rem; height:15rem; opacity:.4; }
        [data-school-website="true"] .school-hero-watermark-logo { opacity:.84; }
        @supports selector(:has(*)) { [data-school-website="true"] .school-home-hero:has(.school-hero-cover[style*="display: none"]) .school-hero-pattern { opacity:.55; } }
        [data-school-website="true"] .school-hero-community { color:var(--school-heading); background:color-mix(in srgb,var(--school-surface) 88%,transparent); border-color:color-mix(in srgb,var(--school-primary) 22%,var(--school-surface)); box-shadow:0 22px 48px color-mix(in srgb,var(--school-heading) 20%,transparent); }
        [data-school-website="true"] .school-hero-community p:first-child { color:var(--school-body); opacity:1; }
        [data-school-website="true"] .school-cta-primary { border:1px solid var(--school-primary); color:var(--school-surface); background:color-mix(in srgb,var(--school-primary) 40%,var(--school-heading) 60%); box-shadow:0 12px 26px color-mix(in srgb,var(--school-heading) 18%,transparent); }
        [data-school-website="true"] .school-cta-secondary { color:var(--school-surface); border-color:color-mix(in srgb,var(--school-surface) 48%,transparent); background:color-mix(in srgb,var(--school-surface) 8%,transparent); }
        [data-school-website="true"].school-buttons-outline .school-cta-primary,[data-school-website="true"].school-buttons-outline .school-portal-primary,[data-school-website="true"].school-buttons-outline .school-footer-portal-primary { color:var(--school-primary); background:transparent; border:1px solid var(--school-primary); box-shadow:none; }
        [data-school-website="true"].school-buttons-soft .school-cta-primary,[data-school-website="true"].school-buttons-soft .school-portal-primary,[data-school-website="true"].school-buttons-soft .school-footer-portal-primary { color:var(--school-primary); background:color-mix(in srgb,var(--school-primary) 12%,var(--school-surface)); border:1px solid color-mix(in srgb,var(--school-primary) 24%,var(--school-surface)); box-shadow:none; }
        [data-school-website="true"].school-buttons-outline .school-cta-secondary { background:transparent; border-color:var(--school-primary); color:color-mix(in srgb,var(--school-primary) 35%,var(--school-heading)); }
        [data-school-website="true"].school-buttons-soft .school-cta-secondary { background:color-mix(in srgb,var(--school-primary) 8%,var(--school-surface)); border-color:color-mix(in srgb,var(--school-primary) 20%,var(--school-surface)); color:color-mix(in srgb,var(--school-primary) 35%,var(--school-heading)); }
        [data-school-website="true"] .school-facts-panel { overflow:hidden; border-color:color-mix(in srgb,var(--school-primary) 18%,var(--school-surface)); background:var(--school-surface); box-shadow:0 22px 54px color-mix(in srgb,var(--school-heading) 12%,transparent); }
        [data-school-website="true"] .school-fact-item { min-width:0; color:var(--school-body); border-color:color-mix(in srgb,var(--school-heading) 10%,var(--school-surface)); }
        [data-school-website="true"] .school-fact-item:not(.school-fact-actions) { border-bottom:1px solid color-mix(in srgb,var(--school-heading) 10%,var(--school-surface)); }
        [data-school-website="true"] .school-fact-icon { display:flex; width:2.5rem; height:2.5rem; flex:0 0 auto; align-items:center; justify-content:center; border-radius:.8rem; color:color-mix(in srgb,var(--school-primary) 35%,var(--school-heading)); background:color-mix(in srgb,var(--school-primary) 10%,var(--school-surface)); }
        [data-school-website="true"] .school-fact-label { color:var(--school-body); font-size:.65rem; font-weight:800; letter-spacing:.12em; text-transform:uppercase; opacity:.82; }
        [data-school-website="true"] .school-fact-actions { border-top:1px solid color-mix(in srgb,var(--school-heading) 10%,var(--school-surface)); background:var(--school-surface-tint); }
        [data-school-website="true"] .school-fact-action { color:color-mix(in srgb,var(--school-primary) 35%,var(--school-heading)); border-color:color-mix(in srgb,var(--school-primary) 24%,var(--school-surface)); background:var(--school-surface); }
        [data-school-website="true"] .school-fact-actions > .school-fact-action:first-child { color:var(--school-surface); background:color-mix(in srgb,var(--school-primary) 40%,var(--school-heading) 60%); border:1px solid var(--school-primary); }
        [data-school-website="true"].school-buttons-outline .school-fact-actions > .school-fact-action:first-child { color:color-mix(in srgb,var(--school-primary) 35%,var(--school-heading)); background:transparent; border-color:var(--school-primary); }
        [data-school-website="true"].school-buttons-soft .school-fact-actions > .school-fact-action:first-child { color:color-mix(in srgb,var(--school-primary) 35%,var(--school-heading)); background:color-mix(in srgb,var(--school-primary) 12%,var(--school-surface)); border-color:color-mix(in srgb,var(--school-primary) 24%,var(--school-surface)); }
        [data-school-website="true"] .text-emerald-100,[data-school-website="true"] .text-emerald-200,[data-school-website="true"] .text-emerald-300 { color:var(--school-heading)!important; }
        [data-school-website="true"] .text-emerald-500 { color:var(--school-primary)!important; }
        [data-school-website="true"] .school-statement-panel { border:0; border-top:3px solid var(--school-primary); border-radius:1rem; padding:1.5rem; background:var(--school-surface); box-shadow:0 14px 34px color-mix(in srgb,var(--school-heading) 7%,transparent); }
        [data-school-website="true"] .school-statement-icon { background:color-mix(in srgb,var(--school-primary) 11%,var(--school-surface)); color:var(--school-primary); }
        [data-school-website="true"] .school-motto-quote { border-top:0; border-left:3px solid var(--school-accent); background:var(--school-surface-tint); }
        [data-school-website="true"] .school-motto-quote p { color:var(--school-heading); font-size:clamp(1.1rem,2vw,1.45rem); font-weight:700; line-height:1.65; }
        [data-school-website="true"] .school-logo-mark { background:var(--school-surface); color:color-mix(in srgb,var(--school-primary) 35%,var(--school-heading)); border:1px solid color-mix(in srgb,var(--school-primary) 22%,var(--school-surface)); }
        [data-school-website="true"] [data-school-header="v2"] { background-color:color-mix(in srgb,var(--school-header) 88%,transparent)!important; backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); border-color:color-mix(in srgb,var(--school-heading) 12%,transparent); }
        [data-school-website="true"] .school-nav-link { position:relative; color:var(--school-body); }
        [data-school-website="true"] .school-nav-link:hover { color:color-mix(in srgb,var(--school-primary) 35%,var(--school-heading)); background:color-mix(in srgb,var(--school-primary) 7%,transparent); }
        [data-school-website="true"] .school-nav-link[aria-current="page"] { color:color-mix(in srgb,var(--school-primary) 35%,var(--school-heading)); }
        [data-school-website="true"] .school-nav-link[aria-current="page"]::after { position:absolute; right:.55rem; bottom:.1rem; left:.55rem; height:2px; border-radius:999px; background:var(--school-primary); content:""; animation:school-nav-underline .24s ease-out both; }
        [data-school-website="true"] .school-portal-link,[data-school-website="true"] .school-menu-trigger { color:color-mix(in srgb,var(--school-primary) 35%,var(--school-heading)); border-color:color-mix(in srgb,var(--school-primary) 28%,var(--school-surface)); background:var(--school-surface); }
        [data-school-website="true"] .school-portal-primary { color:var(--school-surface); background:color-mix(in srgb,var(--school-primary) 40%,var(--school-heading) 60%); border:1px solid var(--school-primary); }
        [data-school-website="true"] .school-mobile-sheet { max-height:min(78vh,42rem); overflow-y:auto; background:var(--school-surface); border-color:color-mix(in srgb,var(--school-heading) 12%,var(--school-surface)); box-shadow:0 28px 48px color-mix(in srgb,var(--school-heading) 14%,transparent); }
        [data-school-website="true"] .school-public-footer { color:var(--school-body); border-color:color-mix(in srgb,var(--school-heading) 12%,transparent); }
        [data-school-website="true"] .school-public-footer .border-b { border-color:color-mix(in srgb,var(--school-heading) 12%,transparent); }
        [data-school-website="true"] .school-footer-portal { color:color-mix(in srgb,var(--school-primary) 35%,var(--school-heading)); background:var(--school-surface); border-color:color-mix(in srgb,var(--school-primary) 25%,var(--school-surface)); }
        [data-school-website="true"] .school-footer-portal-primary { color:var(--school-surface); background:color-mix(in srgb,var(--school-primary) 40%,var(--school-heading) 60%); border-color:var(--school-primary); }
        [data-school-website="true"] .school-loading-screen { background:var(--school-background); color:var(--school-body); }
        [data-school-website="true"] .school-skeleton-bar,[data-school-website="true"] .school-skeleton-card { border-color:color-mix(in srgb,var(--school-heading) 12%,var(--school-surface)); background:var(--school-surface); }
        [data-school-website="true"] .school-skeleton-block { background:color-mix(in srgb,var(--school-primary) 12%,var(--school-surface)); animation:school-skeleton-pulse 1.6s ease-in-out infinite; }
        /* Keep the existing remap intact while translating remaining fixed Tailwind tones. */
        [data-school-website="true"] .text-slate-500,[data-school-website="true"] .text-slate-400 { color:var(--school-body)!important; opacity:.82; }
        [data-school-website="true"] .border-slate-100,[data-school-website="true"] .border-slate-200,[data-school-website="true"] .border-slate-300 { border-color:color-mix(in srgb,var(--school-heading) 12%,var(--school-surface))!important; }
        [data-school-website="true"] .ring-slate-950 { --tw-ring-color:color-mix(in srgb,var(--school-heading) 8%,transparent)!important; }
        [data-school-website="true"] .ring-emerald-700,[data-school-website="true"] .ring-emerald-600,[data-school-website="true"] .ring-emerald-500 { --tw-ring-color:color-mix(in srgb,var(--school-primary) 35%,transparent)!important; }
        [data-school-website="true"] .bg-slate-50 { background-color:var(--school-background)!important; }
        [data-school-website="true"] .bg-slate-100 { background-color:var(--school-surface-tint)!important; }
        [data-school-website="true"] .bg-emerald-50,[data-school-website="true"] .bg-emerald-100 { background-color:color-mix(in srgb,var(--school-primary) 8%,var(--school-surface))!important; }
        [data-school-website="true"] .border-emerald-100,[data-school-website="true"] .border-emerald-200 { border-color:color-mix(in srgb,var(--school-primary) 18%,var(--school-surface))!important; }
        [data-school-website="true"] .from-emerald-700 { --tw-gradient-from:var(--school-primary) var(--tw-gradient-from-position)!important; --tw-gradient-to:color-mix(in srgb,var(--school-primary) 0%,transparent) var(--tw-gradient-to-position)!important; }
        [data-school-website="true"] .to-emerald-950 { --tw-gradient-to:var(--school-secondary) var(--tw-gradient-to-position)!important; }
        [data-school-website="true"] .via-emerald-400 { --tw-gradient-via:color-mix(in srgb,var(--school-accent) 45%,var(--school-primary)) var(--tw-gradient-via-position)!important; }
        [data-school-website="true"] [class*="shadow-slate-"] { --tw-shadow-color:color-mix(in srgb,var(--school-heading) 10%,transparent)!important; }
        [data-school-website="true"] [class*="shadow-emerald-"] { --tw-shadow-color:color-mix(in srgb,var(--school-primary) 15%,transparent)!important; }
        [data-school-website="true"] [class*="text-white/"] { color:var(--school-surface)!important; opacity:.84; }
        [data-school-website="true"] [class*="border-white/"] { border-color:color-mix(in srgb,var(--school-surface) 24%,transparent)!important; }
        [data-school-website="true"] [class*="bg-white/"] { background-color:color-mix(in srgb,var(--school-surface) 10%,transparent)!important; }
        [data-school-website="true"] .school-home-contact { background:linear-gradient(115deg,color-mix(in srgb,var(--school-secondary) 20%,var(--school-heading) 80%),color-mix(in srgb,var(--school-primary) 20%,var(--school-heading) 80%)); box-shadow:0 20px 50px color-mix(in srgb,var(--school-heading) 12%,transparent); }
        [data-school-website="true"] .public-media-card img { transition:transform .55s cubic-bezier(.2,.7,.2,1); aspect-ratio:4/3; object-fit:cover; }
        [data-school-website="true"] .public-media-card:hover img { transform:scale(1.035); }
        [data-school-website="true"] .school-home-page article,[data-school-website="true"] .public-feature-link { border-color:color-mix(in srgb,var(--school-heading) 12%,var(--school-surface)); box-shadow:0 12px 28px color-mix(in srgb,var(--school-heading) 5%,transparent); }
        [data-school-website="true"] .school-home-page article:hover,[data-school-website="true"] .public-feature-link:hover { box-shadow:0 22px 38px color-mix(in srgb,var(--school-heading) 10%,transparent); }
        [data-school-website="true"] .school-public-footer .text-slate-500 { color:var(--school-body)!important; }
        [data-school-website="true"] .school-public-footer p,[data-school-website="true"] .school-public-footer a { overflow-wrap:anywhere; }
        @keyframes school-nav-underline { from { transform:scaleX(.45); opacity:.35; } to { transform:scaleX(1); opacity:1; } }
        @keyframes school-skeleton-pulse { 0%,100% { opacity:.62; } 50% { opacity:1; } }
        @media(min-width:640px) { [data-school-website="true"] .school-fact-item:not(:nth-child(2n)) { border-right:1px solid color-mix(in srgb,var(--school-heading) 10%,var(--school-surface)); } }
        @media(min-width:1024px) { [data-school-website="true"] .school-fact-item { border-bottom:0!important; } [data-school-website="true"] .school-fact-item:not(.school-fact-actions) { border-right:1px solid color-mix(in srgb,var(--school-heading) 10%,var(--school-surface)); } }
        @media(max-width:639px) { [data-school-website="true"] .school-home-hero { min-height:0; } [data-school-website="true"] .school-facts-strip { width:calc(100% - 1rem); } }
        @media(prefers-reduced-motion:reduce) { [data-school-website="true"] .school-nav-link[aria-current="page"]::after,[data-school-website="true"] .school-skeleton-block,[data-school-website="true"] .public-media-card img { animation:none; transition:none; } }
        [data-school-website="true"] .school-page-heading { border:0; border-bottom:1px solid color-mix(in srgb,var(--school-heading) 14%,var(--school-surface)); border-radius:.75rem 0 0 0; background:linear-gradient(110deg,var(--school-surface),var(--school-surface-tint)); box-shadow:none; }
        [data-school-website="true"] .school-heading-orb { border-color:color-mix(in srgb,var(--school-primary) 16%,var(--school-surface)); box-shadow:0 0 0 18px color-mix(in srgb,var(--school-primary) 3%,transparent),0 0 0 38px color-mix(in srgb,var(--school-primary) 2%,transparent); }
        [data-school-website="true"] .school-section-icon { color:color-mix(in srgb,var(--school-primary) 35%,var(--school-heading)); background:color-mix(in srgb,var(--school-primary) 9%,var(--school-surface)); border:1px solid color-mix(in srgb,var(--school-primary) 18%,var(--school-surface)); }
        [data-school-website="true"] .school-page-kicker { color:color-mix(in srgb,var(--school-primary) 35%,var(--school-heading)); }
        [data-school-website="true"] .school-kicker-line { background:var(--school-accent); }
        [data-school-website="true"] .school-empty-state { border-color:color-mix(in srgb,var(--school-primary) 28%,var(--school-surface)); background:linear-gradient(130deg,var(--school-surface),var(--school-surface-tint)); box-shadow:0 18px 42px color-mix(in srgb,var(--school-heading) 6%,transparent); }
        [data-school-website="true"] .school-empty-line { background:linear-gradient(90deg,transparent,var(--school-accent),transparent); opacity:.8; }
        [data-school-website="true"] .school-surface-card { border-color:color-mix(in srgb,var(--school-heading) 12%,var(--school-surface)); background:linear-gradient(135deg,var(--school-surface),var(--school-surface-tint)); box-shadow:0 12px 28px color-mix(in srgb,var(--school-heading) 6%,transparent); }
        [data-school-website="true"] .school-surface-card:hover { box-shadow:0 22px 42px color-mix(in srgb,var(--school-heading) 12%,transparent); }
        [data-school-website="true"] .school-resource-meta { border-color:color-mix(in srgb,var(--school-heading) 12%,var(--school-surface)); }
        [data-school-website="true"] .school-date-badge { color:var(--school-heading); background:color-mix(in srgb,var(--school-accent) 24%,var(--school-surface)); border:1px solid color-mix(in srgb,var(--school-accent) 38%,var(--school-surface)); font-weight:800; }
        [data-school-website="true"] .school-category-chip,[data-school-website="true"] .school-tag { color:color-mix(in srgb,var(--school-primary) 35%,var(--school-heading)); background:color-mix(in srgb,var(--school-primary) 9%,var(--school-surface)); border:1px solid color-mix(in srgb,var(--school-primary) 17%,var(--school-surface)); }
        [data-school-website="true"] .school-detail-dot { background:var(--school-accent); }
        [data-school-website="true"] .school-download-button,[data-school-website="true"] .school-form-submit { color:var(--school-surface); background:color-mix(in srgb,var(--school-primary) 40%,var(--school-heading) 60%); border:1px solid var(--school-primary); box-shadow:0 10px 22px color-mix(in srgb,var(--school-heading) 10%,transparent); }
        [data-school-website="true"].school-buttons-outline .school-download-button,[data-school-website="true"].school-buttons-outline .school-form-submit { color:color-mix(in srgb,var(--school-primary) 35%,var(--school-heading)); background:transparent; border:1px solid var(--school-primary); box-shadow:none; }
        [data-school-website="true"].school-buttons-soft .school-download-button,[data-school-website="true"].school-buttons-soft .school-form-submit { color:color-mix(in srgb,var(--school-primary) 35%,var(--school-heading)); background:color-mix(in srgb,var(--school-primary) 12%,var(--school-surface)); border:1px solid color-mix(in srgb,var(--school-primary) 24%,var(--school-surface)); box-shadow:none; }
        [data-school-website="true"] .school-media-image-bg { background:color-mix(in srgb,var(--school-primary) 8%,var(--school-surface-tint)); }
        [data-school-website="true"] .school-media-overlay { color:var(--school-surface); background:color-mix(in srgb,var(--school-secondary) 88%,transparent); }
        [data-school-website="true"] .school-media-caption { background:linear-gradient(135deg,var(--school-surface),var(--school-surface-tint)); border-color:color-mix(in srgb,var(--school-heading) 12%,var(--school-surface)); }
        [data-school-website="true"] .school-contact-panel { border-color:color-mix(in srgb,var(--school-heading) 12%,var(--school-surface)); box-shadow:0 15px 34px color-mix(in srgb,var(--school-heading) 7%,transparent); }
        [data-school-website="true"] .school-contact-detail { padding:.8rem 0; border-bottom:1px solid color-mix(in srgb,var(--school-heading) 9%,var(--school-surface)); }
        [data-school-website="true"] .school-contact-detail:last-child { border-bottom:0; }
        [data-school-website="true"] .school-inquiry-form input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]),[data-school-website="true"] .school-inquiry-form select,[data-school-website="true"] .school-inquiry-form textarea { width:100%; min-height:2.9rem; border-color:color-mix(in srgb,var(--school-heading) 18%,var(--school-surface)); background:var(--school-surface); color:var(--school-body); border-radius:.85rem; padding:.85rem 1rem; }
        [data-school-website="true"] .school-inquiry-form textarea { min-height:9rem; }
        [data-school-website="true"] .school-inquiry-form input::placeholder,[data-school-website="true"] .school-inquiry-form textarea::placeholder { color:var(--school-body); opacity:.68; }
        [data-school-website="true"] .school-inquiry-form input:focus-visible,[data-school-website="true"] .school-inquiry-form select:focus-visible,[data-school-website="true"] .school-inquiry-form textarea:focus-visible { outline:2px solid var(--school-primary); outline-offset:2px; border-color:var(--school-primary); box-shadow:0 0 0 4px color-mix(in srgb,var(--school-primary) 17%,transparent); }
        [data-school-website="true"] .school-media-bento > .public-media-card { min-width:0; }
        @media(min-width:1280px) { [data-school-website="true"] .school-media-bento > .public-media-card:first-child { grid-column:span 2; grid-row:span 2; } [data-school-website="true"] .school-media-bento > .public-media-card:first-child > div:first-child { height:100%; min-height:22rem; aspect-ratio:auto; } }
        @media(max-width:767px) { [data-school-website="true"] .school-contact-panel { padding:1.15rem; } }
        [data-school-website="true"] .school-academic-band { padding:1rem 0 2.25rem; border-bottom:1px solid color-mix(in srgb,var(--school-heading) 12%,var(--school-surface)); }
        [data-school-website="true"] .school-academic-band:last-child { border-bottom:0; }
        [data-school-website="true"] .school-academic-band > div:first-child h2 { color:var(--school-heading); letter-spacing:-.025em; }
        [data-school-website="true"] .school-academic-band > div:first-child p { color:var(--school-body); }
        [data-school-website="true"] .school-document-row { display:grid; grid-template-columns:minmax(0,1.1fr) minmax(0,1.3fr) auto auto; align-items:center; gap:1rem; padding:1rem 1.2rem; }
        [data-school-website="true"] .school-document-row > :first-child { align-items:center; }
        [data-school-website="true"] .school-document-row > p { margin:0; }
        [data-school-website="true"] .school-document-row .school-resource-meta { margin:0; padding:0; border:0; }
        [data-school-website="true"] .school-document-row .school-download-button { margin:0; white-space:nowrap; }
        [data-school-website="true"] .school-document-row .school-date-badge { white-space:nowrap; }
        @media(max-width:1023px) { [data-school-website="true"] .school-document-row { grid-template-columns:minmax(0,1fr) auto; gap:.65rem 1rem; } [data-school-website="true"] .school-document-row > :first-child,[data-school-website="true"] .school-document-row > p { grid-column:1 / -1; } [data-school-website="true"] .school-document-row .school-resource-meta { grid-column:1; } [data-school-website="true"] .school-document-row .school-download-button { grid-column:2; grid-row:auto; } }
        @media(max-width:520px) { [data-school-website="true"] .school-document-row { padding:1rem; } [data-school-website="true"] .school-document-row > :first-child { align-items:flex-start; } [data-school-website="true"] .school-document-row .school-resource-meta { flex-wrap:wrap; } [data-school-website="true"] .school-document-row .school-download-button { min-height:44px; padding:.65rem .8rem; } }
        [data-school-website="true"] .bg-emerald-500 { background-color:var(--school-primary)!important; }
        [data-school-website="true"] .border-emerald-700 { border-color:var(--school-primary)!important; }
        [data-school-website="true"] .from-slate-100 { --tw-gradient-from:var(--school-surface-tint) var(--tw-gradient-from-position)!important; --tw-gradient-to:color-mix(in srgb,var(--school-surface-tint) 0%,transparent) var(--tw-gradient-to-position)!important; }
        [data-school-website="true"] .to-slate-200 { --tw-gradient-to:var(--school-background) var(--tw-gradient-to-position)!important; }
        [data-school-website="true"] [class~="bg-slate-950/75"] { background-color:color-mix(in srgb,var(--school-heading) 85%,transparent)!important; }
        [data-school-website="true"] [class~="bg-slate-950/90"] { background-color:color-mix(in srgb,var(--school-heading) 92%,transparent)!important; }
        [data-school-website="true"] .text-white { color:var(--school-surface)!important; }
        [data-school-website="true"] [class*="bg-amber-"] { background-color:color-mix(in srgb,var(--school-accent) 12%,var(--school-surface))!important; }
        [data-school-website="true"] [class*="border-amber-"] { border-color:color-mix(in srgb,var(--school-accent) 32%,var(--school-surface))!important; }
        [data-school-website="true"] [class*="text-amber-"] { color:var(--school-heading)!important; }
        [data-school-website="true"] [class*="bg-red-"],[data-school-website="true"] [class*="bg-rose-"] { background-color:color-mix(in srgb,var(--school-primary) 8%,var(--school-surface))!important; }
        [data-school-website="true"] [class*="border-red-"],[data-school-website="true"] [class*="border-rose-"] { border-color:color-mix(in srgb,var(--school-primary) 24%,var(--school-surface))!important; }
        [data-school-website="true"] [class*="text-red-"],[data-school-website="true"] [class*="text-rose-"] { color:var(--school-heading)!important; }
      `}</style>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3">Skip to content</a>
      <header data-school-header="v2" style={{ backgroundColor: websiteTheme.header }} className="sticky top-0 z-30 border-b border-slate-200/80 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl supports-[backdrop-filter]:bg-white/90">
        <div className="mx-auto flex max-w-[88rem] items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
          <Link to={homeUrl} className="group flex min-w-0 items-center gap-3" aria-label={`${schoolName} home`}>
            <span className="school-logo-mark relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-md sm:h-12 sm:w-12">
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

          <nav aria-label="School website navigation" className="school-desktop-nav hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto px-2 xl:flex">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = canonicalPage === item.path;
              return (
                <Link
                  key={item.path || "home"}
                  to={pageUrl(item.path)}
                  aria-current={active ? "page" : undefined}
                  title={item.label}
                  className={`school-nav-link group relative inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--school-primary)] focus-visible:ring-offset-2 2xl:gap-2 2xl:px-2.5 2xl:text-sm ${active ? "text-emerald-700" : "text-slate-600 hover:text-emerald-800"}`}
                  aria-label={item.label}
                >
                  <Icon size={16} strokeWidth={active ? 2.3 : 1.9} />
                  <span className="hidden 2xl:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 xl:flex">
            <Link
              to={`/jumuiya/elimu/parent?school=${encodeURIComponent(publicSchoolSlug || schoolSlug)}`}
              className="school-portal-link inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--school-primary)] focus-visible:ring-offset-2 2xl:px-3.5 2xl:text-sm"
            >
              <Users size={16} /> Parent portal
            </Link>
            <Link
              to={`/jumuiya/elimu/student?school=${encodeURIComponent(publicSchoolSlug || schoolSlug)}`}
              className="school-portal-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--school-primary)] focus-visible:ring-offset-2 2xl:px-3.5 2xl:text-sm"
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
            className="school-menu-trigger inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-bold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--school-primary)] focus-visible:ring-offset-2 xl:hidden"
          >
            {mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
            <span>{mobileMenuOpen ? "Close" : "Menu"}</span>
          </button>
        </div>

        {mobileMenuOpen && (
          <div id="school-mobile-navigation" className="school-mobile-sheet border-t px-4 py-4 shadow-lg xl:hidden sm:px-6">
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

      <main id="main-content" className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        {resourceWarning && <div role="status" className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><XCircle size={18} className="mt-0.5 shrink-0"/><p>{resourceWarning}</p><button type="button" className="ml-auto shrink-0 font-bold underline" disabled={refreshing} onClick={() => void loadPage({ silent: true })}>Retry</button></div>}
        {pageContent}
      </main>

      <footer style={{ backgroundColor: websiteTheme.footer }} className="school-public-footer mt-8 border-t">
        <div className="mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 border-b py-9 sm:py-11 md:grid-cols-[1.15fr_.9fr_1fr] md:gap-10">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                {logo && <img src={logo} alt={schoolName ? schoolName + " logo" : "School logo"} loading="lazy" className="h-12 w-12 shrink-0 rounded-xl object-contain" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
                <div className="min-w-0"><p className="break-words text-base font-extrabold tracking-tight text-slate-900">{schoolName}</p><p className="mt-1 text-xs font-semibold">Official public school website</p></div>
              </div>
              {motto && <p className="mt-4 max-w-sm border-l-2 pl-4 text-sm italic leading-7" style={{ borderColor: websiteTheme.accent, color: websiteTheme.body }}>“{motto}”</p>}
            </div>
            <div>
              <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.16em]">Explore</p>
              <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-4 gap-y-3">{NAV_ITEMS.map((item) => <Link key={item.path || "home"} to={pageUrl(item.path)} className="w-fit text-sm font-semibold text-slate-600 transition hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--school-primary)]">{item.label}</Link>)}</nav>
            </div>
            <div>
              <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.16em]">Contact & portals</p>
              <div className="space-y-3 text-sm">
                {phone && <a href={"tel:" + phone} className="block break-words font-semibold text-slate-600 hover:text-emerald-700">{phone}</a>}
                {email && <a href={"mailto:" + email} className="block break-all font-semibold text-slate-600 hover:text-emerald-700">{email}</a>}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link to={"/jumuiya/elimu/parent?school=" + encodeURIComponent(publicSchoolSlug || schoolSlug)} className="school-footer-portal inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold"><Users size={15} /> Parent portal</Link>
                  <Link to={"/jumuiya/elimu/student?school=" + encodeURIComponent(publicSchoolSlug || schoolSlug)} className="school-footer-portal school-footer-portal-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold"><GraduationCap size={15} /> Student portal</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 py-4 text-xs sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {schoolName}. All rights reserved.</p>
            <p>Powered by <a href="/" className="font-bold text-emerald-700 hover:underline">RevelaCode · Jumuiya Elimu</a></p>
          </div>
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
