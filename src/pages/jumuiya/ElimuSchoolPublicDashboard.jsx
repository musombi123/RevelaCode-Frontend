
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  GraduationCap,
  Heart,
  MapPin,
  Menu,
  Phone,
  School,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";

const DEFAULT_BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://revelacode-backend.onrender.com";

const PUBLIC_API = `${DEFAULT_BACKEND_URL.replace(/\/+$/, "")}/api/jumuiya/elimu/public`;

const EMPTY_SCHOOL = {
  name: "",
  motto: "",
  description: "",
  logo_url: "",
  cover_image_url: "",
  school_type: "",
  curriculum: "",
  address: "",
  county: "",
  town: "",
  phone: "",
  email: "",
  website: "",
  established_year: null,
  status: "",
};

function unwrapResponse(payload) {
  if (!payload || typeof payload !== "object") return payload;

  if (payload.data && typeof payload.data === "object") {
    return payload.data;
  }

  return payload;
}

function formatDate(value) {
  if (!value) return "Date to be announced";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-KE", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getErrorMessage(error) {
  if (error?.name === "AbortError") return "";

  return (
    error?.message ||
    "Public school information is temporarily unavailable."
  );
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  onAction,
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            {eyebrow}
          </p>
        )}

        <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h2>

        {description && (
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            {description}
          </p>
        )}
      </div>

      {action && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800 sm:self-auto"
        >
          {action}
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon = FileText, title, description }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
        <Icon size={22} />
      </div>

      <h3 className="font-semibold text-slate-900">{title}</h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
      <div className="h-4 w-28 rounded bg-slate-200" />
      <div className="mt-4 h-6 w-3/4 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-full rounded bg-slate-100" />
      <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
    </div>
  );
}

function PublicBadge({ children, tone = "neutral" }) {
  const styles = {
    neutral: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-800",
    blue: "bg-blue-50 text-blue-800",
    amber: "bg-amber-50 text-amber-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[tone] || styles.neutral
      }`}
    >
      {children}
    </span>
  );
}

function AnnouncementCard({ item }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <PublicBadge tone="blue">
          <Bell size={12} />
          Announcement
        </PublicBadge>

        <span className="text-xs text-slate-500">
          {formatDate(item.published_at || item.created_at)}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-bold text-slate-900">
        {item.title || "School announcement"}
      </h3>

      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
        {item.summary || item.description || item.content || "No additional details have been published."}
      </p>
    </article>
  );
}

function EventCard({ event }) {
  const eventDate = event.start_at || event.date || event.event_date;

  return (
    <article className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-200 hover:shadow-sm sm:p-5">
      <div className="flex h-[68px] w-[68px] shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
        <CalendarDays size={19} />
        <span className="mt-1 text-[10px] font-bold uppercase tracking-wide">
          {eventDate
            ? new Date(eventDate).toLocaleString("en-KE", {
                month: "short",
                timeZone: "Africa/Nairobi",
              })
            : "Event"}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-slate-900">
            {event.title || event.name || "School activity"}
          </h3>

          {event.status === "published" && (
            <PublicBadge tone="green">Published</PublicBadge>
          )}
        </div>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          {event.description || event.summary || "More information will be provided by the school."}
        </p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} />
            {formatDate(eventDate)}
            {event.start_at && formatTime(event.start_at)}
          </span>

          {(event.location || event.venue) && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} />
              {event.location || event.venue}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function ProjectCard({ project }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50">
        {project.image_url || project.cover_image_url ? (
          <img
            src={project.image_url || project.cover_image_url}
            alt={project.title || "CBC project"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
            <BookOpen size={30} />
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          <PublicBadge tone="green">CBC project</PublicBadge>

          {project.category && (
            <PublicBadge>{project.category}</PublicBadge>
          )}
        </div>

        <h3 className="mt-3 text-lg font-bold text-slate-900">
          {project.title || project.name || "Student learning project"}
        </h3>

        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
          {project.summary || project.description || "A learning project published by the school."}
        </p>

        {(project.grade || project.class_name || project.learning_area) && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
            {project.grade && <span>Grade {project.grade}</span>}
            {project.class_name && <span>{project.class_name}</span>}
            {project.learning_area && <span>{project.learning_area}</span>}
          </div>
        )}
      </div>
    </article>
  );
}

export default function ElimuSchoolPublicDashboard({
  schoolSlug = "",
  onParentPortal,
  onStudentPortal,
  onBackToSchools,
}) {
  const [school, setSchool] = useState(EMPTY_SCHOOL);
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [schoolStatus, setSchoolStatus] = useState(null);
  const [loading, setLoading] = useState(Boolean(schoolSlug));
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  const normalizedSlug = useMemo(
    () => String(schoolSlug || "").trim(),
    [schoolSlug]
  );

  const loadPublicSchool = useCallback(
    async (signal) => {
      if (!normalizedSlug) {
        setLoading(false);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      const query = `?slug=${encodeURIComponent(normalizedSlug)}`;

      async function getPublicResource(path) {
        const response = await fetch(`${PUBLIC_API}${path}${query}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "omit",
          signal,
        });

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "This school profile could not be found."
              : `Public school information request failed (${response.status}).`
          );
        }

        return unwrapResponse(await response.json());
      }

      try {
        // These are dedicated public read-only endpoints.
        // Do not replace them with protected staff/admin endpoints.
        const schoolData = await getPublicResource("/school");

        const schoolRecord =
          schoolData?.school ||
          schoolData?.profile ||
          schoolData;

        setSchool({
          ...EMPTY_SCHOOL,
          ...(schoolRecord || {}),
        });

        const results = await Promise.allSettled([
          getPublicResource("/events"),
          getPublicResource("/cbc/projects"),
          getPublicResource("/announcements"),
          getPublicResource("/status"),
        ]);

        if (signal?.aborted) return;

        const [eventResult, projectResult, announcementResult, statusResult] =
          results;

        if (eventResult.status === "fulfilled") {
          const data = eventResult.value;
          setEvents(
            safeArray(data?.events || data?.items || data)
          );
        } else {
          setEvents([]);
        }

        if (projectResult.status === "fulfilled") {
          const data = projectResult.value;
          setProjects(
            safeArray(data?.projects || data?.items || data)
          );
        } else {
          setProjects([]);
        }

        if (announcementResult.status === "fulfilled") {
          const data = announcementResult.value;
          setAnnouncements(
            safeArray(data?.announcements || data?.items || data)
          );
        } else {
          setAnnouncements([]);
        }

        if (statusResult.status === "fulfilled") {
          const data = statusResult.value;
          setSchoolStatus(data?.status || data || null);
        } else {
          setSchoolStatus(null);
        }
      } catch (loadError) {
        if (signal?.aborted) return;

        setError(getErrorMessage(loadError));
        setSchool(EMPTY_SCHOOL);
        setEvents([]);
        setProjects([]);
        setAnnouncements([]);
        setSchoolStatus(null);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [normalizedSlug]
  );

  useEffect(() => {
    const controller = new AbortController();

    loadPublicSchool(controller.signal);

    return () => controller.abort();
  }, [loadPublicSchool]);

  const scrollTo = useCallback((sectionId) => {
    setMobileMenuOpen(false);
    setActiveSection(sectionId);

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const parentPortal = useCallback(() => {
    if (onParentPortal) {
      onParentPortal(school);
      return;
    }

    window.location.assign("/jumuiya/elimu/parent");
  }, [onParentPortal, school]);

  const studentPortal = useCallback(() => {
    if (onStudentPortal) {
      onStudentPortal(school);
      return;
    }

    window.location.assign("/jumuiya/elimu/student");
  }, [onStudentPortal, school]);

  const schoolName = school.name || "School public profile";
  const address = [school.town, school.county]
    .filter(Boolean)
    .join(", ");

  const publicStatusLabel =
    schoolStatus?.label ||
    schoolStatus?.school_status ||
    schoolStatus?.status ||
    school.status ||
    "";

  const publishedEvents = useMemo(
    () =>
      [...events]
        .filter(
          (event) =>
            event &&
            event.is_public !== false &&
            event.visibility !== "private"
        )
        .sort((a, b) => {
          const first = new Date(
            a.start_at || a.date || a.event_date || 0
          ).getTime();

          const second = new Date(
            b.start_at || b.date || b.event_date || 0
          ).getTime();

          return first - second;
        })
        .slice(0, 4),
    [events]
  );

  const publishedProjects = useMemo(
    () =>
      projects
        .filter(
          (project) =>
            project &&
            project.is_public !== false &&
            project.visibility !== "private"
        )
        .slice(0, 3),
    [projects]
  );

  const publicAnnouncements = useMemo(
    () =>
      announcements
        .filter(
          (item) =>
            item &&
            item.is_public !== false &&
            item.visibility !== "private"
        )
        .slice(0, 3),
    [announcements]
  );

  if (!normalizedSlug) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <School size={32} />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            Jumuiya Elimu
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Open a school's public profile
          </h1>

          <p className="mx-auto mt-3 max-w-lg leading-7 text-slate-600">
            Each school has its own public profile for school information,
            published announcements, events, and CBC projects. Open the
            profile using that school's public slug.
          </p>

          {onBackToSchools && (
            <button
              type="button"
              onClick={onBackToSchools}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800"
            >
              Browse schools
              <ArrowRight size={17} />
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-white p-3 text-emerald-800 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>

      {/* Public website header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => scrollTo("overview")}
            className="flex min-w-0 items-center gap-3 text-left"
            aria-label="Go to school overview"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 text-emerald-800">
              {school.logo_url ? (
                <img
                  src={school.logo_url}
                  alt={`${schoolName} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-extrabold">
                  {getInitials(schoolName) || <School size={22} />}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <p className="max-w-[210px] truncate text-sm font-bold text-slate-950 sm:max-w-xs sm:text-base">
                {schoolName}
              </p>
              <p className="text-xs text-slate-500">
                Powered by Jumuiya Elimu
              </p>
            </div>
          </button>

          <nav className="hidden items-center gap-1 lg:flex">
            {[
              ["overview", "Overview"],
              ["announcements", "News"],
              ["activities", "Activities"],
              ["projects", "CBC Projects"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  activeSection === id
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={parentPortal}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800"
            >
              Parent portal
            </button>

            <button
              type="button"
              onClick={studentPortal}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Student portal
              <ArrowUpRight size={15} />
            </button>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 sm:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 sm:hidden">
            <div className="flex flex-col gap-1">
              {[
                ["overview", "School overview"],
                ["announcements", "Announcements"],
                ["activities", "Activities and events"],
                ["projects", "CBC projects"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollTo(id)}
                  className="rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {label}
                </button>
              ))}

              <button
                type="button"
                onClick={parentPortal}
                className="mt-2 rounded-xl border border-slate-200 px-3 py-3 text-left text-sm font-semibold"
              >
                Parent portal
              </button>

              <button
                type="button"
                onClick={studentPortal}
                className="rounded-xl bg-emerald-700 px-3 py-3 text-left text-sm font-semibold text-white"
              >
                Student portal
              </button>
            </div>
          </div>
        )}
      </header>

      <div id="main-content">
        {/* School hero */}
        <section id="overview" className="scroll-mt-24">
          <div className="relative isolate overflow-hidden bg-slate-950">
            {school.cover_image_url && (
              <img
                src={school.cover_image_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-30"
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-emerald-950/70" />

            <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-center lg:px-8 lg:py-24">
              <div>
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <PublicBadge tone="green">
                    <GraduationCap size={13} />
                    School public profile
                  </PublicBadge>

                  {school.curriculum && (
                    <PublicBadge tone="blue">
                      {school.curriculum}
                    </PublicBadge>
                  )}

                  {school.school_type && (
                    <PublicBadge>{school.school_type}</PublicBadge>
                  )}
                </div>

                <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {school.name || "Discover our school"}
                </h1>

                {school.motto && (
                  <p className="mt-4 text-lg font-medium text-emerald-200">
                    “{school.motto}”
                  </p>
                )}

                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  {school.description ||
                    "Learn about our school, discover published activities, explore learning projects, and stay informed through our official school updates."}
                </p>

                {address && (
                  <p className="mt-5 flex items-center gap-2 text-sm text-slate-300">
                    <MapPin size={17} className="shrink-0 text-emerald-300" />
                    {school.address ? `${school.address}, ` : ""}
                    {address}
                  </p>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={parentPortal}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-400"
                  >
                    Parent access
                    <ArrowRight size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollTo("activities")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
                  >
                    Explore school life
                    <ChevronRight size={18} />
                  </button>
                </div>

                <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-slate-400">
                  <ShieldCheck size={15} className="shrink-0 text-emerald-300" />
                  Student records and financial information require verified
                  portal access.
                </p>
              </div>

              <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-sm sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-300">
                      School information
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-white">
                      At a glance
                    </h2>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                    <School size={23} />
                  </div>
                </div>

                <div className="mt-6 divide-y divide-white/10">
                  <div className="flex items-start gap-3 py-4">
                    <MapPin size={18} className="mt-0.5 shrink-0 text-emerald-300" />
                    <div>
                      <p className="text-xs text-slate-400">Location</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {address || school.address || "Not published"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-4">
                    <BookOpen size={18} className="mt-0.5 shrink-0 text-emerald-300" />
                    <div>
                      <p className="text-xs text-slate-400">Curriculum</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {school.curriculum || "Not published"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-4">
                    <CalendarDays size={18} className="mt-0.5 shrink-0 text-emerald-300" />
                    <div>
                      <p className="text-xs text-slate-400">Established</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {school.established_year || "Not published"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-4">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-300" />
                    <div>
                      <p className="text-xs text-slate-400">Public status</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {publicStatusLabel || "Status not published"}
                      </p>
                    </div>
                  </div>
                </div>

                {school.phone && (
                  <a
                    href={`tel:${school.phone}`}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-emerald-50"
                  >
                    <Phone size={16} />
                    Contact school
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Loading and error feedback */}
        <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          {loading && (
            <div
              className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800"
              role="status"
            >
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-800" />
              Loading the latest public school information…
            </div>
          )}

          {!loading && error && (
            <div
              className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
              role="alert"
            >
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-amber-700" size={20} />
                <div>
                  <h2 className="font-semibold text-amber-950">
                    Some school information could not be loaded
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-amber-900">
                    {error} The public read-only API endpoints must be available
                    before this page can display live school data.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const controller = new AbortController();
                      loadPublicSchool(controller.signal);
                    }}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-amber-950 underline underline-offset-4"
                  >
                    Try again
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Public announcements */}
        <section
          id="announcements"
          className="scroll-mt-24 mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8"
        >
          <SectionHeading
            eyebrow="Stay informed"
            title="School announcements"
            description="Official updates and information the school has chosen to publish for its community."
          />

          <div className="mt-7">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-3">
                <LoadingCard />
                <LoadingCard />
                <LoadingCard />
              </div>
            ) : publicAnnouncements.length ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {publicAnnouncements.map((item, index) => (
                  <AnnouncementCard
                    key={item.id || item._id || item.slug || index}
                    item={item}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Bell}
                title="No public announcements yet"
                description="When the school publishes an announcement, it will appear here."
              />
            )}
          </div>
        </section>

        {/* School activities */}
        <section
          id="activities"
          className="scroll-mt-24 border-y border-slate-100 bg-slate-50/80"
        >
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
            <SectionHeading
              eyebrow="Life at school"
              title="Activities and events"
              description="Explore school activities, academic events, and community gatherings that have been published for public viewing."
            />

            <div className="mt-7">
              {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <LoadingCard />
                  <LoadingCard />
                </div>
              ) : publishedEvents.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {publishedEvents.map((event, index) => (
                    <EventCard
                      key={event.id || event._id || index}
                      event={event}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CalendarDays}
                  title="No upcoming activities published"
                  description="The school's public calendar will show activities here once they are published."
                />
              )}
            </div>
          </div>
        </section>

        {/* CBC projects */}
        <section
          id="projects"
          className="scroll-mt-24 mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8"
        >
          <SectionHeading
            eyebrow="Learning in action"
            title="CBC projects"
            description="Discover selected learning projects and practical work shared by the school. Only projects approved for public viewing should appear here."
          />

          <div className="mt-7">
            {loading ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <LoadingCard />
                <LoadingCard />
                <LoadingCard />
              </div>
            ) : publishedProjects.length ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {publishedProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id || project._id || index}
                    project={project}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="CBC projects coming soon"
                description="Publicly approved projects will be featured here to showcase creativity, practical learning, and student innovation."
              />
            )}
          </div>
        </section>

        {/* Parent and student access */}
        <section className="bg-slate-950">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-2 lg:px-8">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 sm:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                <Users size={25} />
              </div>

              <h2 className="mt-5 text-2xl font-bold text-white">
                Parent portal
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Access linked children's school information, documents, and
                fee statements after signing in and completing the required
                child-verification process.
              </p>

              <button
                type="button"
                onClick={parentPortal}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-bold text-white transition hover:bg-emerald-400"
              >
                Continue as parent
                <ArrowRight size={17} />
              </button>

              <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-400">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-300" />
                A parent must verify and link each child before viewing that
                child's private records.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 sm:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-400/15 text-blue-300">
                <GraduationCap size={26} />
              </div>

              <h2 className="mt-5 text-2xl font-bold text-white">
                Student portal
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                A dedicated area for students to access the learning resources
                and school information made available to their authenticated
                account.
              </p>

              <button
                type="button"
                onClick={studentPortal}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-bold text-white transition hover:bg-white/10"
              >
                Continue as student
                <ArrowRight size={17} />
              </button>

              <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-400">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-blue-300" />
                Private student information must be protected by authentication
                and server-side permissions.
              </p>
            </div>
          </div>
        </section>

        {/* School contact */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 lg:grid-cols-[1fr_0.7fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                Connect with the school
              </p>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Need more information?
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                Use the school's published contact information for enquiries
                about school activities, programmes, and general information.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {school.phone && (
                <a
                  href={`tel:${school.phone}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300"
                >
                  <Phone size={19} className="shrink-0 text-emerald-700" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-slate-500">Telephone</span>
                    <span className="break-words text-sm font-semibold text-slate-900">
                      {school.phone}
                    </span>
                  </span>
                  <ExternalLink size={15} className="text-slate-400" />
                </a>
              )}

              {school.email && (
                <a
                  href={`mailto:${school.email}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300"
                >
                  <FileText size={19} className="shrink-0 text-emerald-700" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-slate-500">Email</span>
                    <span className="break-words text-sm font-semibold text-slate-900">
                      {school.email}
                    </span>
                  </span>
                  <ExternalLink size={15} className="text-slate-400" />
                </a>
              )}

              {school.website && (
                <a
                  href={school.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300"
                >
                  <GlobeIcon />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-slate-500">Website</span>
                    <span className="break-words text-sm font-semibold text-slate-900">
                      {school.website}
                    </span>
                  </span>
                  <ExternalLink size={15} className="text-slate-400" />
                </a>
              )}

              {!school.phone && !school.email && !school.website && (
                <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                  The school has not published contact details yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="font-bold text-slate-900">{schoolName}</p>
            <p className="mt-1 text-xs text-slate-500">
              Public school information through Jumuiya Elimu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-600">
            <button
              type="button"
              onClick={parentPortal}
              className="transition hover:text-emerald-800"
            >
              Parent portal
            </button>

            <button
              type="button"
              onClick={studentPortal}
              className="transition hover:text-emerald-800"
            >
              Student portal
            </button>

            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck size={14} />
              Privacy-first access
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Powered by{" "}
            <span className="font-semibold text-slate-700">
              RevelaCode · Jumuiya OS
            </span>
          </p>
        </div>
      </footer>
    </main>
  );
}

function GlobeIcon() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-200 text-emerald-700">
      <Sparkles size={12} />
    </span>
  );
}