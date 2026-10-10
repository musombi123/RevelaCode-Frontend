
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  FolderOpen,
  GraduationCap,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";

import { useElimuApi } from "@/services/elimuApi.jsx";

const PAGE_SIZE = 6;
const REQUEST_LIMIT = 100;

const ROUTES = {
  events: "/api/jumuiya/elimu/public/events",
  projects: "/api/jumuiya/elimu/public/cbc/projects",
};

const styles = `
.elimu-activities {
  --ea-primary: #155eef;
  --ea-primary-dark: #1048c7;
  --ea-ink: #172b4d;
  --ea-muted: #64748b;
  --ea-border: #e5eaf2;
  --ea-surface: #ffffff;
  --ea-page: #f6f8fc;
  color: var(--ea-ink);
  background: var(--ea-page);
  min-height: 100vh;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.elimu-activities * { box-sizing: border-box; }
.elimu-activities button, .elimu-activities input { font: inherit; }
.ea-container { width: min(1180px, calc(100% - 40px)); margin: 0 auto; }

.ea-topbar { background: #fff; border-bottom: 1px solid var(--ea-border); }
.ea-topbar-inner {
  min-height: 68px; display: flex; align-items: center;
  justify-content: space-between; gap: 16px;
}
.ea-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
.ea-brand-icon {
  width: 42px; height: 42px; flex-shrink: 0; border-radius: 13px;
  display: grid; place-items: center; color: #fff;
  background: linear-gradient(145deg, #155eef, #3988ff);
  box-shadow: 0 5px 14px rgba(21,94,239,.18);
}
.ea-brand-name { font-size: 16px; font-weight: 850; letter-spacing: -.4px; }
.ea-brand-sub { color: var(--ea-muted); font-size: 11px; margin-top: 2px; }
.ea-public-pill {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 11px; border: 1px solid #d8e7ff;
  background: #f1f6ff; border-radius: 999px;
  color: #2456a6; font-size: 12px; font-weight: 750; white-space: nowrap;
}

.ea-hero {
  position: relative; overflow: hidden; padding: 42px 0 38px;
  background: linear-gradient(125deg, #0c2452 0%, #123f88 57%, #1765ce 100%);
  color: white;
}
.ea-hero::before {
  content: ""; position: absolute; width: 380px; height: 380px;
  right: -90px; top: -205px; border-radius: 50%;
  border: 1px solid rgba(255,255,255,.14);
  box-shadow: 0 0 0 35px rgba(255,255,255,.035),
    0 0 0 75px rgba(255,255,255,.025);
}
.ea-hero-grid {
  display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(230px, .7fr);
  gap: 32px; align-items: center; position: relative; z-index: 1;
}
.ea-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 1.6px; color: #c8ddff; margin-bottom: 15px;
}
.ea-hero h1 {
  margin: 0; max-width: 700px;
  font-size: clamp(30px, 4.3vw, 49px);
  line-height: 1.1; letter-spacing: -1.7px; font-weight: 850;
}
.ea-hero p {
  max-width: 650px; margin: 17px 0 0; line-height: 1.75;
  color: #d8e6ff; font-size: 15px;
}
.ea-hero-card {
  border: 1px solid rgba(255,255,255,.18);
  background: rgba(255,255,255,.09); border-radius: 20px;
  padding: 22px; backdrop-filter: blur(8px);
}
.ea-hero-card-icon {
  width: 45px; height: 45px; display: grid; place-items: center;
  border-radius: 14px; background: rgba(255,255,255,.14); margin-bottom: 18px;
}
.ea-hero-card strong { display: block; font-size: 16px; }
.ea-hero-card span {
  display: block; margin-top: 8px; font-size: 12px;
  color: #d6e4ff; line-height: 1.7;
}

.ea-main { padding: 28px 0 52px; }
.ea-section-heading {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 18px; margin-bottom: 20px;
}
.ea-section-heading h2 {
  font-size: 22px; letter-spacing: -.6px; margin: 0; font-weight: 850;
}
.ea-section-heading p {
  color: var(--ea-muted); margin: 7px 0 0; font-size: 13px; line-height: 1.6;
}
.ea-count { font-size: 12px; color: var(--ea-muted); white-space: nowrap; }

.ea-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 12px; margin-bottom: 22px;
}
.ea-tabs {
  display: flex; align-items: center; gap: 5px; padding: 5px;
  border-radius: 13px; background: #eaf0f8; max-width: 100%;
}
.ea-tab {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border: 0; border-radius: 9px; padding: 10px 14px; min-height: 39px;
  background: transparent; color: #53657f; font-size: 12px;
  font-weight: 750; cursor: pointer; transition: .18s ease;
}
.ea-tab.active {
  background: white; color: var(--ea-primary);
  box-shadow: 0 2px 7px rgba(28,48,80,.08);
}
.ea-tab:focus-visible, .ea-retry:focus-visible, .ea-page-btn:focus-visible {
  outline: 2px solid #77a6ff; outline-offset: 3px;
}
.ea-search {
  display: flex; align-items: center; gap: 9px;
  width: min(290px, 100%); border: 1px solid var(--ea-border);
  background: white; border-radius: 11px; padding: 0 12px;
  min-height: 42px; color: #7b8aa2;
}
.ea-search input {
  width: 100%; min-width: 0; outline: none; border: 0;
  background: transparent; color: var(--ea-ink); font-size: 12px;
}
.ea-search input::placeholder { color: #95a1b4; }

.ea-alert {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 13px 15px; border-radius: 12px;
  margin: 0 0 18px; font-size: 12px; line-height: 1.65;
  overflow-wrap: anywhere;
}
.ea-alert.error { color: #9d2929; background: #fff2f1; border: 1px solid #ffd9d6; }
.ea-alert.info { color: #315a93; background: #eef5ff; border: 1px solid #d7e7ff; }
.ea-alert > svg { flex-shrink: 0; margin-top: 2px; }

.ea-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 17px; }
.ea-card {
  min-width: 0; display: flex; flex-direction: column;
  background: var(--ea-surface); border: 1px solid var(--ea-border);
  border-radius: 17px; overflow: hidden;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.ea-card:hover {
  transform: translateY(-3px); border-color: #c9d9f2;
  box-shadow: 0 12px 30px rgba(29,55,94,.07);
}
.ea-card-banner {
  min-height: 112px; padding: 17px; display: flex; align-items: flex-start;
  justify-content: space-between; gap: 10px;
  background: linear-gradient(135deg, #eaf2ff, #f3f7ff);
  border-bottom: 1px solid #e5edf9;
}
.ea-card-banner.project {
  background: linear-gradient(135deg, #e5f7ee, #f3fbf6);
  border-color: #e0f1e7;
}
.ea-card-symbol {
  display: grid; place-items: center; width: 42px; height: 42px;
  border-radius: 13px; color: #155eef; background: white;
  box-shadow: 0 3px 10px rgba(21,94,239,.08);
}
.ea-card-banner.project .ea-card-symbol { color: #16845b; }
.ea-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 8px; border-radius: 999px; background: white;
  color: #516783; border: 1px solid #e3eaf4;
  font-size: 10px; font-weight: 800; text-transform: uppercase;
  letter-spacing: .35px;
}
.ea-card-body { display: flex; flex-direction: column; flex: 1; padding: 18px; }
.ea-card-title {
  margin: 0; font-size: 16px; line-height: 1.4; font-weight: 820;
  letter-spacing: -.3px; overflow-wrap: anywhere;
}
.ea-card-description {
  color: var(--ea-muted); font-size: 12px; line-height: 1.8;
  margin: 10px 0 17px; overflow-wrap: anywhere; white-space: pre-line;
}
.ea-meta-list { display: grid; gap: 9px; margin-top: auto; }
.ea-meta {
  display: flex; align-items: flex-start; gap: 8px; font-size: 11px;
  line-height: 1.55; color: #5d6f89; overflow-wrap: anywhere;
}
.ea-meta svg { flex-shrink: 0; margin-top: 1px; color: #8194b1; }
.ea-card-footer {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding-top: 15px; margin-top: 16px;
  border-top: 1px solid #edf0f5; color: #8492a7; font-size: 10px;
}
.ea-text-link {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 800; color: var(--ea-primary);
  text-decoration: none;
}
.ea-text-link:hover { color: var(--ea-primary-dark); }

.ea-empty {
  border: 1px dashed #d3ddeb; border-radius: 17px;
  background: rgba(255,255,255,.8); padding: 45px 20px; text-align: center;
}
.ea-empty-icon {
  width: 53px; height: 53px; border-radius: 16px;
  margin: 0 auto 15px; display: grid; place-items: center;
  background: #edf3ff; color: #4676c8;
}
.ea-empty h3 { margin: 0; font-size: 15px; font-weight: 800; }
.ea-empty p {
  color: var(--ea-muted); font-size: 12px; line-height: 1.7;
  max-width: 420px; margin: 8px auto 0;
}
.ea-retry {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 8px; padding: 10px 13px; border: 1px solid #cddcf3;
  background: white; color: #2457a6; border-radius: 10px;
  font-size: 12px; font-weight: 750; cursor: pointer; margin-top: 15px;
}
.ea-retry:disabled { opacity: .6; cursor: not-allowed; }
.ea-pagination {
  display: flex; align-items: center; justify-content: center;
  gap: 14px; margin-top: 26px; color: var(--ea-muted); font-size: 12px;
}
.ea-page-btn {
  border: 1px solid var(--ea-border); border-radius: 9px;
  background: white; color: var(--ea-ink); padding: 8px 12px;
  cursor: pointer; font-size: 12px; font-weight: 700;
}
.ea-page-btn:disabled { opacity: .4; cursor: not-allowed; }
.ea-footer {
  padding: 20px 0; border-top: 1px solid var(--ea-border);
  background: white; color: #75849a; font-size: 11px;
}
.ea-footer-inner {
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px; flex-wrap: wrap;
}
.ea-footer-brand { color: var(--ea-ink); font-weight: 800; }

@media (max-width: 900px) {
  .ea-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ea-hero-grid { grid-template-columns: minmax(0, 1fr) 230px; gap: 20px; }
  .ea-hero { padding: 34px 0; }
}
@media (max-width: 640px) {
  .ea-container { width: calc(100% - 28px); }
  .ea-topbar-inner { min-height: 60px; }
  .ea-brand-icon { width: 38px; height: 38px; }
  .ea-brand-name { font-size: 14px; }
  .ea-public-pill { padding: 7px 9px; font-size: 10px; }
  .ea-hero { padding: 32px 0 28px; }
  .ea-hero-grid { grid-template-columns: 1fr; }
  .ea-hero h1 { font-size: 34px; letter-spacing: -1.1px; }
  .ea-hero p { font-size: 13px; margin-top: 13px; }
  .ea-hero-card { display: none; }
  .ea-main { padding: 23px 0 36px; }
  .ea-section-heading { align-items: flex-start; }
  .ea-section-heading h2 { font-size: 20px; }
  .ea-toolbar { align-items: stretch; }
  .ea-tabs { width: 100%; }
  .ea-tab { flex: 1; padding: 9px 7px; font-size: 11px; }
  .ea-search { width: 100%; }
  .ea-grid { grid-template-columns: 1fr; gap: 13px; }
  .ea-card-banner { min-height: 92px; }
  .ea-card-body { padding: 16px; }
}
@media (prefers-reduced-motion: reduce) {
  .elimu-activities *, .elimu-activities *::before, .elimu-activities *::after {
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
`;

function unwrapPayload(payload) {
  let current = payload;

  for (let index = 0; index < 5; index += 1) {
    if (
      !current ||
      typeof current !== "object" ||
      Array.isArray(current)
    ) {
      break;
    }

    if (current.success === false || current.ok === false) {
      throw new Error(
        current.message ||
          current.error ||
          "The Elimu service returned an unsuccessful response."
      );
    }

    if (
      current.data &&
      typeof current.data === "object"
    ) {
      current = current.data;
      continue;
    }

    break;
  }

  return current;
}

function extractItems(payload, keys) {
  const result = unwrapPayload(payload);

  if (Array.isArray(result)) {
    return result;
  }

  if (result && typeof result === "object") {
    for (const key of keys) {
      if (Array.isArray(result[key])) {
        return result[key];
      }
    }

    if (Array.isArray(result.items)) {
      return result.items;
    }
  }

  return [];
}

function firstValue(record, keys, fallback = "") {
  for (const key of keys) {
    const value = record?.[key];

    if (
      typeof value === "string" ||
      typeof value === "number"
    ) {
      const text = String(value).trim();

      if (text) {
        return text;
      }
    }
  }

  return fallback;
}

function safeExternalUrl(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return "";
    }

    return url.href;
  } catch {
    return "";
  }
}

function formatDate(value) {
  if (!value) {
    return "Date to be announced";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function normaliseEvent(event, index) {
  return {
    id: firstValue(
      event,
      ["id", "_id", "event_id", "slug"],
      `event-${index}`
    ),
    title: firstValue(
      event,
      ["title", "name", "event_name"],
      "School activity"
    ),
    description: firstValue(
      event,
      ["description", "summary", "details", "content"],
      "Further details will be provided by the school."
    ),
    date: firstValue(
      event,
      ["start_date", "event_date", "date", "starts_at", "start"],
      ""
    ),
    endDate: firstValue(
      event,
      ["end_date", "ends_at", "end"],
      ""
    ),
    time: firstValue(
      event,
      ["start_time", "time", "event_time"],
      ""
    ),
    location: firstValue(
      event,
      ["location", "venue", "place"],
      "Venue to be announced"
    ),
    category: firstValue(
      event,
      ["event_type", "category", "type"],
      "School event"
    ),
    status: firstValue(event, ["status", "state"], ""),
    url: safeExternalUrl(
      firstValue(event, ["public_url", "registration_url", "url"], "")
    ),
  };
}

function normaliseProject(project, index) {
  return {
    id: firstValue(
      project,
      ["id", "_id", "project_id", "slug"],
      `project-${index}`
    ),
    title: firstValue(
      project,
      ["title", "name", "project_name"],
      "CBC learning project"
    ),
    description: firstValue(
      project,
      ["description", "summary", "objectives", "details"],
      "Project information will be updated by the school."
    ),
    className: firstValue(
      project,
      ["class_name", "class", "grade", "level"],
      ""
    ),
    subject: firstValue(
      project,
      ["subject", "learning_area"],
      ""
    ),
    category: firstValue(
      project,
      ["category"],
      "CBC project"
    ),
    term: firstValue(project, ["term", "school_term"], ""),
    date: firstValue(
      project,
      ["created_at", "date", "updated_at", "start_date"],
      ""
    ),
    status: firstValue(project, ["status", "state"], ""),
    url: safeExternalUrl(
      firstValue(project, ["public_url", "url"], "")
    ),
  };
}

function isUpcoming(event) {
  if (!event.date) {
    return false;
  }

  const startDate = new Date(event.date);

  if (Number.isNaN(startDate.getTime())) {
    return false;
  }

  const endDate = event.endDate
    ? new Date(event.endDate)
    : startDate;

  const validEndDate = Number.isNaN(endDate.getTime())
    ? startDate
    : endDate;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return validEndDate.getTime() >= today.getTime();
}

function ActivityCard({ event }) {
  const upcoming = isUpcoming(event);

  return (
    <article className="ea-card">
      <div className="ea-card-banner">
        <div className="ea-card-symbol">
          <CalendarDays size={21} />
        </div>

        <span className="ea-chip">
          {upcoming ? (
            <Clock size={12} />
          ) : (
            <CheckCircle2 size={12} />
          )}
          {upcoming ? "Upcoming" : "School activity"}
        </span>
      </div>

      <div className="ea-card-body">
        <h3 className="ea-card-title">{event.title}</h3>
        <p className="ea-card-description">{event.description}</p>

        <div className="ea-meta-list">
          <div className="ea-meta">
            <CalendarDays size={14} />
            <span>
              {formatDate(event.date)}
              {event.endDate && event.endDate !== event.date
                ? ` – ${formatDate(event.endDate)}`
                : ""}
            </span>
          </div>

          {event.time && (
            <div className="ea-meta">
              <Clock size={14} />
              <span>{event.time}</span>
            </div>
          )}

          <div className="ea-meta">
            <MapPin size={14} />
            <span>{event.location}</span>
          </div>

          <div className="ea-meta">
            <Activity size={14} />
            <span>{event.category}</span>
          </div>
        </div>

        <div className="ea-card-footer">
          <span>{event.status || "School community"}</span>

          {event.url ? (
            <a
              className="ea-text-link"
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Details <ArrowRight size={13} />
            </a>
          ) : (
            <span>Public information</span>
          )}
        </div>
      </div>
    </article>
  );
}

function ProjectCard({ project }) {
  const hasAcademicDetails = Boolean(
    project.className || project.subject || project.term
  );

  return (
    <article className="ea-card">
      <div className="ea-card-banner project">
        <div className="ea-card-symbol">
          <BookOpen size={21} />
        </div>

        <span className="ea-chip">
          <GraduationCap size={12} />
          CBC project
        </span>
      </div>

      <div className="ea-card-body">
        <h3 className="ea-card-title">{project.title}</h3>
        <p className="ea-card-description">{project.description}</p>

        <div className="ea-meta-list">
          {project.className && (
            <div className="ea-meta">
              <GraduationCap size={14} />
              <span>{project.className}</span>
            </div>
          )}

          {project.subject && (
            <div className="ea-meta">
              <BookOpen size={14} />
              <span>{project.subject}</span>
            </div>
          )}

          {project.term && (
            <div className="ea-meta">
              <CalendarDays size={14} />
              <span>{project.term}</span>
            </div>
          )}

          {!hasAcademicDetails && (
            <div className="ea-meta">
              <Sparkles size={14} />
              <span>{project.category}</span>
            </div>
          )}
        </div>

        <div className="ea-card-footer">
          <span>{project.status || "Learning and discovery"}</span>

          {project.url ? (
            <a
              className="ea-text-link"
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore <ArrowRight size={13} />
            </a>
          ) : (
            <span>
              {project.date ? formatDate(project.date) : "School project"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function EmptyState({ type, search, onRetry, refreshing }) {
  const title = search
    ? "No matching results"
    : type === "events"
      ? "No public activities available yet"
      : "No public CBC projects available yet";

  const description = search
    ? "Try another search term or clear your search to see all available content."
    : "When the school publishes this information, it will appear here.";

  return (
    <div className="ea-empty">
      <div className="ea-empty-icon">
        {type === "events" ? (
          <CalendarDays size={24} />
        ) : (
          <FolderOpen size={24} />
        )}
      </div>

      <h3>{title}</h3>
      <p>{description}</p>

      <button
        className="ea-retry"
        onClick={onRetry}
        type="button"
        disabled={refreshing}
      >
        <RefreshCw
          size={14}
          className={refreshing ? "animate-spin" : ""}
        />
        {refreshing ? "Refreshing…" : "Refresh content"}
      </button>
    </div>
  );
}

export default function ElimuActivitiesPage({
  schoolId,
  schoolCode,
}) {
  const {
    getPublicEvents,
    getPublicCBCProjects,
  } = useElimuApi();

  const [activeTab, setActiveTab] = useState("events");
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState({
    events: "",
    projects: "",
  });
  const [page, setPage] = useState(1);

  const controllerRef = useRef(null);

  const loadContent = useCallback(
    async ({ silent = false } = {}) => {
      controllerRef.current?.abort();

      const controller = new AbortController();
      controllerRef.current = controller;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrors({
        events: "",
        projects: "",
      });

      const params = {
        school_id: schoolId || undefined,
        school_code: schoolCode || undefined,
        limit: REQUEST_LIMIT,
      };

      const requests = [
        {
          key: "events",
          endpoint: ROUTES.events,
          fetch: () =>
            getPublicEvents(params, {
              signal: controller.signal,
            }),
          keys: ["events", "items", "results", "activities"],
          normalise: normaliseEvent,
        },
        {
          key: "projects",
          endpoint: ROUTES.projects,
          fetch: () =>
            getPublicCBCProjects(params, {
              signal: controller.signal,
            }),
          keys: ["projects", "items", "results", "cbc_projects"],
          normalise: normaliseProject,
        },
      ];

      const results = await Promise.all(
        requests.map(async (item) => {
          try {
            const response = await item.fetch();
            const items = extractItems(response, item.keys);

            return {
              key: item.key,
              items: items.map(item.normalise),
              error: "",
              endpoint: item.endpoint,
            };
          } catch (error) {
            if (
              controller.signal.aborted ||
              error?.name === "AbortError"
            ) {
              return {
                key: item.key,
                aborted: true,
              };
            }

            return {
              key: item.key,
              items: [],
              error:
                error?.message ||
                "Unable to load content. Please try again.",
              endpoint: item.endpoint,
            };
          }
        })
      );

      // A newer request or unmount may have aborted this request.
      if (controller.signal.aborted) {
        return;
      }

      const nextErrors = {
        events: "",
        projects: "",
      };

      for (const result of results) {
        if (result.aborted) {
          continue;
        }

        if (result.key === "events") {
          setEvents(result.items || []);
          nextErrors.events = result.error || "";
        } else {
          setProjects(result.items || []);
          nextErrors.projects = result.error || "";
        }
      }

      setErrors(nextErrors);
      setLoading(false);
      setRefreshing(false);
    },
    [
      getPublicEvents,
      getPublicCBCProjects,
      schoolId,
      schoolCode,
    ]
  );

  useEffect(() => {
    loadContent();

    return () => {
      controllerRef.current?.abort();
    };
  }, [loadContent]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  const activeItems = activeTab === "events" ? events : projects;
  const activeError = errors[activeTab];

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return activeItems;
    }

    return activeItems.filter((item) =>
      [
        item.title,
        item.description,
        item.location,
        item.category,
        item.className,
        item.subject,
        item.term,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [activeItems, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / PAGE_SIZE)
  );

  const visibleItems = filteredItems.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const eventCount = events.length;
  const projectCount = projects.length;
  const upcomingCount = events.filter(isUpcoming).length;

  const retry = useCallback(() => {
    return loadContent({ silent: true });
  }, [loadContent]);

  return (
    <div className="elimu-activities">
      <style>{styles}</style>

      <header className="ea-topbar">
        <div className="ea-container ea-topbar-inner">
          <div className="ea-brand">
            <div className="ea-brand-icon">
              <GraduationCap size={23} />
            </div>

            <div>
              <div className="ea-brand-name">Jumuiya Elimu</div>
              <div className="ea-brand-sub">School community portal</div>
            </div>
          </div>

          <span className="ea-public-pill">
            <ShieldCheck size={14} />
            Public information
          </span>
        </div>
      </header>

      <section className="ea-hero">
        <div className="ea-container ea-hero-grid">
          <div>
            <div className="ea-eyebrow">
              <Sparkles size={14} />
              Learning beyond the classroom
            </div>

            <h1>School life, activities and student creativity.</h1>

            <p>
              Discover school activities, important dates and CBC projects
              shared with the school community. Explore the experiences and
              practical learning that help students grow.
            </p>
          </div>

          <div className="ea-hero-card">
            <div className="ea-hero-card-icon">
              <Users size={23} />
            </div>

            <strong>A connected school community</strong>

            <span>
              Keep up with published activities and discover learning
              projects that put student skills into practice.
            </span>
          </div>
        </div>
      </section>

      <main className="ea-main">
        <div className="ea-container">
          <div className="ea-section-heading">
            <div>
              <h2>Explore school life</h2>
              <p>
                Browse public activities and competency-based learning
                projects.
              </p>
            </div>

            <span className="ea-count">
              {loading
                ? "Loading…"
                : `${eventCount} activities · ${projectCount} projects`}
            </span>
          </div>

          <div className="ea-toolbar">
            <div
              className="ea-tabs"
              role="tablist"
              aria-label="School content"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "events"}
                className={`ea-tab ${activeTab === "events" ? "active" : ""}`}
                onClick={() => setActiveTab("events")}
              >
                <CalendarDays size={15} />
                Activities
                {!loading && <span>({eventCount})</span>}
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "projects"}
                className={`ea-tab ${activeTab === "projects" ? "active" : ""}`}
                onClick={() => setActiveTab("projects")}
              >
                <BookOpen size={15} />
                CBC Projects
                {!loading && <span>({projectCount})</span>}
              </button>
            </div>

            <label className="ea-search">
              <Search size={16} />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  activeTab === "events"
                    ? "Search activities…"
                    : "Search CBC projects…"
                }
                aria-label="Search school content"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  style={{
                    border: 0,
                    background: "transparent",
                    padding: 2,
                    display: "grid",
                    placeItems: "center",
                    color: "#64748b",
                    cursor: "pointer",
                  }}
                >
                  <XCircle size={15} />
                </button>
              )}
            </label>
          </div>

          {activeError && (
            <div className="ea-alert error" role="alert">
              <XCircle size={17} />

              <div>
                <strong>Content could not be loaded.</strong>

                <div>{activeError}</div>

                <div>
                  Check that the corresponding public backend endpoint is
                  registered:
                  <br />
                  <code>{ROUTES[activeTab]}</code>
                </div>

                {(activeError.includes("school_selector_required") ||
                  activeError.toLowerCase().includes("specify school_id")) && (
                  <p>
                    This public page needs the selected school's ID or code.
                    Pass <code>schoolId</code> or <code>schoolCode</code> to
                    the component.
                  </p>
                )}

                <button
                  className="ea-retry"
                  type="button"
                  onClick={retry}
                  disabled={refreshing}
                >
                  <RefreshCw
                    size={14}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  {refreshing ? "Refreshing…" : "Try again"}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="ea-empty" aria-live="polite">
              <div className="ea-empty-icon">
                <RefreshCw size={23} />
              </div>

              <h3>Loading school information</h3>

              <p>
                Fetching published activities and learning projects.
              </p>
            </div>
          ) : !activeError && filteredItems.length === 0 ? (
            <EmptyState
              type={activeTab}
              search={search}
              onRetry={retry}
              refreshing={refreshing}
            />
          ) : !activeError ? (
            <>
              <div className="ea-grid">
                {visibleItems.map((item) =>
                  activeTab === "events" ? (
                    <ActivityCard key={item.id} event={item} />
                  ) : (
                    <ProjectCard key={item.id} project={item} />
                  )
                )}
              </div>

              {totalPages > 1 && (
                <nav
                  className="ea-pagination"
                  aria-label="Content pagination"
                >
                  <button
                    className="ea-page-btn"
                    type="button"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                  >
                    Previous
                  </button>

                  <span>
                    Page {page} of {totalPages}
                  </span>

                  <button
                    className="ea-page-btn"
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((current) =>
                        Math.min(totalPages, current + 1)
                      )
                    }
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          ) : null}

          {!loading &&
            !activeError &&
            activeTab === "events" &&
            upcomingCount > 0 && (
              <div
                className="ea-alert info"
                style={{ marginTop: 24, marginBottom: 0 }}
              >
                <ArrowDownRight size={17} />

                <div>
                  <strong>
                    {upcomingCount} upcoming{" "}
                    {upcomingCount === 1 ? "activity" : "activities"}
                  </strong>

                  <div>
                    Check the activity cards for the published dates and
                    venues.
                  </div>
                </div>
              </div>
            )}
        </div>
      </main>

      <footer className="ea-footer">
        <div className="ea-container ea-footer-inner">
          <div>
            <span className="ea-footer-brand">Jumuiya Elimu</span>
            <span> · School community portal</span>
          </div>

          <div>
            Public information only · Student records remain protected
          </div>
        </div>
      </footer>
    </div>
  );
}