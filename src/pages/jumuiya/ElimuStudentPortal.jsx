
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  LogIn,
  RefreshCw,
  School,
  ShieldCheck,
  ClipboardList,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";

const DEFAULT_BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://revelacode-backend.onrender.com";

const API_BASE = `${DEFAULT_BACKEND_URL.replace(/\/+$/, "")}/api/jumuiya/elimu/student`;

const EMPTY_DASHBOARD = {
  student: null,
  school: null,
  class_info: null,
  summary: {},
  recent_assignments: [],
  upcoming_events: [],
  recent_assessments: [],
};

function unwrapResponse(payload) {
  if (!payload || typeof payload !== "object") return payload;
  return payload.data && typeof payload.data === "object"
    ? payload.data
    : payload;
}

function arrayFrom(payload, keys = []) {
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  return Array.isArray(payload) ? payload : [];
}

function readableError(payload, fallback) {
  return (
    payload?.message ||
    payload?.error ||
    payload?.detail ||
    fallback
  );
}

function formatDate(value) {
  if (!value) return "Not scheduled";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "Not scheduled";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getInitials(value = "") {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function MetricCard({ icon: Icon, label, value, description }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
          <Icon size={22} />
        </div>
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">
        {value ?? "—"}
      </p>

      {description && (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {description}
        </p>
      )}
    </article>
  );
}

function EmptyState({ icon: Icon = BookOpen, title, description }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-9 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
        <Icon size={23} />
      </div>

      <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function SectionHeading({ title, description, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
          {title}
        </h2>

        {description && (
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

function AssignmentCard({ assignment, onOpen }) {
  const dueDate =
    assignment.due_at ||
    assignment.due_date ||
    assignment.deadline;

  const status = String(assignment.status || "assigned").toLowerCase();

  const statusStyles = {
    submitted: "bg-emerald-50 text-emerald-800",
    graded: "bg-blue-50 text-blue-800",
    overdue: "bg-rose-50 text-rose-800",
    assigned: "bg-amber-50 text-amber-800",
    pending: "bg-amber-50 text-amber-800",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-200 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
          <ClipboardList size={21} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-900">
            {assignment.title || assignment.name || "Assignment"}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {assignment.subject ||
              assignment.learning_area ||
              "Learning activity"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            statusStyles[status] || "bg-slate-100 text-slate-700"
          }`}
        >
          {status.replace(/_/g, " ")}
        </span>
      </div>

      {assignment.description && (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
          {assignment.description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <Clock size={14} />
          Due {formatDate(dueDate)}
        </span>

        {onOpen && (
          <button
            type="button"
            onClick={() => onOpen(assignment)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950"
          >
            View details
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </article>
  );
}

function EventCard({ event }) {
  const eventDate =
    event.start_at || event.date || event.event_date;

  return (
    <article className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
        <CalendarDays size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-slate-900">
          {event.title || event.name || "School event"}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          {event.description ||
            event.summary ||
            "School activity"}
        </p>

        <p className="mt-3 text-xs text-slate-500">
          {formatDateTime(eventDate)}
          {(event.location || event.venue) &&
            ` · ${event.location || event.venue}`}
        </p>
      </div>
    </article>
  );
}

function AssessmentCard({ assessment }) {
  const score =
    assessment.score ??
    assessment.marks_obtained ??
    assessment.mark;

  const total =
    assessment.total_marks ??
    assessment.maximum_score ??
    assessment.out_of;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">
            {assessment.title ||
              assessment.name ||
              "Assessment"}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {assessment.subject ||
              assessment.learning_area ||
              "Subject not specified"}
          </p>
        </div>

        <div className="shrink-0 text-right">
          {score !== undefined && score !== null ? (
            <>
              <p className="text-lg font-bold text-slate-950">
                {score}
                {total !== undefined && total !== null
                  ? ` / ${total}`
                  : ""}
              </p>
              <p className="text-xs text-slate-500">Recorded result</p>
            </>
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              No score published
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {formatDate(
          assessment.assessed_at ||
            assessment.date ||
            assessment.created_at
        )}
      </p>
    </article>
  );
}

export default function ElimuStudentPortal({
  getAuthHeaders,
  onBack,
  onLoginRequired,
  onOpenAssignment,
}) {
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [assignments, setAssignments] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [activeSection, setActiveSection] = useState("overview");
  const [sectionData, setSectionData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingSection, setLoadingSection] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState("");
  const [sectionError, setSectionError] = useState("");

  const request = useCallback(
    async (path, options = {}) => {
      const extraHeaders = getAuthHeaders
        ? await getAuthHeaders()
        : {};

      const response = await fetch(`${API_BASE}${path}`, {
        method: options.method || "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          ...(options.body
            ? { "Content-Type": "application/json" }
            : {}),
          ...(extraHeaders || {}),
        },
        ...(options.body
          ? { body: JSON.stringify(options.body) }
          : {}),
      });

      let payload = {};

      try {
        payload = unwrapResponse(await response.json());
      } catch {
        payload = {};
      }

      if (response.status === 401) {
        setAuthRequired(true);
        throw new Error("Please sign in to access your student portal.");
      }

      if (response.status === 403) {
        throw new Error(
          "Your account is not authorized to access this student information."
        );
      }

      if (!response.ok) {
        throw new Error(
          readableError(
            payload,
            `The request failed with status ${response.status}.`
          )
        );
      }

      return payload;
    },
    [getAuthHeaders]
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const payload = await request("/dashboard");

      const studentDashboard = {
        ...EMPTY_DASHBOARD,
        ...payload,
        student:
          payload?.student ||
          payload?.profile ||
          payload?.student_profile ||
          null,
        school: payload?.school || null,
        class_info:
          payload?.class_info ||
          payload?.class_details ||
          null,
        summary: payload?.summary || payload?.stats || {},
      };

      setDashboard(studentDashboard);

      setAssignments(
        arrayFrom(payload, [
          "assignments",
          "recent_assignments",
        ])
      );

      setAssessments(
        arrayFrom(payload, [
          "assessments",
          "recent_assessments",
        ])
      );

      setTimetable(
        arrayFrom(payload, ["timetable", "today_timetable"])
      );

      setAttendance(payload?.attendance || null);

      setDocuments(
        arrayFrom(payload, ["documents", "recent_documents"])
      );
    } catch (loadError) {
      setDashboard(EMPTY_DASHBOARD);
      setAssignments([]);
      setAssessments([]);
      setTimetable([]);
      setAttendance(null);
      setDocuments([]);
      setError(
        loadError.message ||
          "Unable to load the student dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const student = dashboard.student || {};
  const school = dashboard.school || {};
  const classInfo = dashboard.class_info || {};
  const summary = dashboard.summary || {};

  const studentName =
    student.display_name ||
    student.full_name ||
    student.name ||
    "Student";

  const className =
    classInfo.name ||
    classInfo.class_name ||
    student.class_name ||
    student.grade ||
    "Class not provided";

  const pendingAssignments = useMemo(
    () =>
      assignments.filter((item) => {
        const status = String(item.status || "pending").toLowerCase();

        return !["submitted", "graded", "completed"].includes(status);
      }),
    [assignments]
  );

  const loadSection = async (section) => {
    setActiveSection(section);
    setSectionData(null);
    setSectionError("");
    setLoadingSection(true);

    const routes = {
      lessons: "/lessons",
      assignments: "/assignments",
      assessments: "/assessments",
      timetable: "/timetable",
      attendance: "/attendance",
      documents: "/documents",
    };

    try {
      const payload = await request(routes[section]);
      setSectionData(payload);
    } catch (loadError) {
      setSectionError(
        loadError.message ||
          "Unable to load this section."
      );
    } finally {
      setLoadingSection(false);
    }
  };

  const returnToOverview = () => {
    setActiveSection("overview");
    setSectionData(null);
    setSectionError("");
  };

  const handleLogin = () => {
    if (onLoginRequired) {
      onLoginRequired();
      return;
    }

    window.location.assign("/login");
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: School },
    { id: "lessons", label: "Lessons", icon: BookOpen },
    { id: "assignments", label: "Assignments", icon: ClipboardList },
    { id: "assessments", label: "Assessments", icon: TrendingUp },
    { id: "timetable", label: "Timetable", icon: CalendarDays },
    { id: "attendance", label: "Attendance", icon: CheckCircle2 },
    { id: "documents", label: "Documents", icon: FileText },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <GraduationCap size={24} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">
                Jumuiya Elimu
              </p>
              <h1 className="truncate text-lg font-bold text-slate-950 sm:text-xl">
                Student portal
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:px-4"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                <ArrowRight size={16} className="rotate-180" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        {authRequired && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <LogIn size={20} className="mt-0.5 shrink-0 text-blue-700" />
              <div>
                <h2 className="font-semibold text-blue-950">
                  Sign in to continue
                </h2>
                <p className="mt-1 text-sm leading-6 text-blue-900">
                  Your account must be authenticated before you can access
                  lessons, assignments, attendance, or school records.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800"
            >
              Sign in
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4"
          >
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-700" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-rose-950">
                Student dashboard unavailable
              </p>
              <p className="mt-1 break-words text-sm leading-6 text-rose-900">
                {error}
              </p>
              <p className="mt-2 text-xs leading-5 text-rose-800">
                Confirm that the student-specific backend route exists and
                that the signed-in user has the required student permissions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="rounded-lg p-1 text-rose-700 hover:bg-rose-100"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Student welcome banner */}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-950 p-6 text-white sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                <BookOpen size={14} />
                Your learning workspace
              </div>

              <h2 className="mt-5 break-words text-3xl font-extrabold tracking-tight sm:text-4xl">
                Welcome, {studentName}
              </h2>

              <p className="mt-3 text-sm leading-7 text-emerald-50/85 sm:text-base">
                Keep track of your learning, stay on top of assignments, and
                see the school activities available to your account.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {school.name && (
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
                    {school.name}
                  </span>
                )}

                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
                  {className}
                </span>
              </div>
            </div>

            <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/15 bg-white/10 text-3xl font-extrabold text-white shadow-lg sm:h-28 sm:w-28">
              {getInitials(studentName) || <UserRound size={36} />}
            </div>
          </div>
        </section>

        {/* Navigation */}
        <nav
          aria-label="Student dashboard sections"
          className="mt-6 flex gap-2 overflow-x-auto pb-2"
        >
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() =>
                id === "overview" ? returnToOverview() : loadSection(id)
              }
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activeSection === id
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-800"
              }`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        {activeSection === "overview" ? (
          <>
            {/* Summary cards */}
            <section className="mt-8">
              <SectionHeading
                title="Your learning at a glance"
                description="A summary of the student information returned by your school."
              />

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  icon={ClipboardList}
                  label="Assignments"
                  value={
                    loading
                      ? "—"
                      : summary.pending_assignments ??
                        pendingAssignments.length
                  }
                  description="Tasks awaiting completion"
                />

                <MetricCard
                  icon={BookOpen}
                  label="Lessons"
                  value={
                    loading
                      ? "—"
                      : summary.lessons_available ?? "—"
                  }
                  description="Lessons available to your account"
                />

                <MetricCard
                  icon={CheckCircle2}
                  label="Attendance"
                  value={
                    loading
                      ? "—"
                      : summary.attendance_rate != null
                      ? `${summary.attendance_rate}%`
                      : attendance?.attendance_rate != null
                      ? `${attendance.attendance_rate}%`
                      : "—"
                  }
                  description="Only shown when reported by the school"
                />

                <MetricCard
                  icon={TrendingUp}
                  label="Assessments"
                  value={
                    loading
                      ? "—"
                      : summary.assessments_count ??
                        assessments.length
                  }
                  description="Assessment records available"
                />
              </div>
            </section>

            {/* Assignments */}
            <section className="mt-10">
              <SectionHeading
                title="Assignments to focus on"
                description="Review the tasks available to your student account."
                action={
                  <button
                    type="button"
                    onClick={() => loadSection("assignments")}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950"
                  >
                    All assignments
                    <ChevronRight size={17} />
                  </button>
                }
              />

              <div className="mt-5">
                {loading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2].map((item) => (
                      <div
                        key={item}
                        className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
                      >
                        <div className="h-4 w-40 rounded bg-slate-200" />
                        <div className="mt-4 h-3 w-24 rounded bg-slate-100" />
                        <div className="mt-5 h-3 w-full rounded bg-slate-100" />
                      </div>
                    ))}
                  </div>
                ) : pendingAssignments.length ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {pendingAssignments.slice(0, 4).map((assignment, index) => (
                      <AssignmentCard
                        key={assignment.id || assignment._id || index}
                        assignment={assignment}
                        onOpen={onOpenAssignment}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={ClipboardList}
                    title="No pending assignments"
                    description="There are no pending assignments in the information currently available to your account."
                  />
                )}
              </div>
            </section>

            {/* Timetable and attendance */}
            <section className="mt-10 grid gap-6 lg:grid-cols-2">
              <div>
                <SectionHeading
                  title="Timetable"
                  description="Your scheduled learning sessions."
                  action={
                    <button
                      type="button"
                      onClick={() => loadSection("timetable")}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800"
                    >
                      View timetable
                      <ChevronRight size={17} />
                    </button>
                  }
                />

                <div className="mt-5">
                  {loading ? (
                    <div className="h-36 animate-pulse rounded-2xl bg-slate-200" />
                  ) : timetable.length ? (
                    <div className="space-y-3">
                      {timetable.slice(0, 4).map((entry, index) => (
                        <div
                          key={entry.id || entry._id || index}
                          className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                            <Clock size={19} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900">
                              {entry.subject ||
                                entry.lesson ||
                                entry.title ||
                                "Class session"}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {[entry.teacher_name, entry.room]
                                .filter(Boolean)
                                .join(" · ") || "Session details not provided"}
                            </p>

                            <p className="mt-2 text-xs font-medium text-emerald-800">
                              {entry.start_time || entry.start_at || ""}
                              {entry.end_time ? ` – ${entry.end_time}` : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={CalendarDays}
                      title="Timetable not available"
                      description="Your school has not returned timetable entries for this dashboard yet."
                    />
                  )}
                </div>
              </div>

              <div>
                <SectionHeading
                  title="Attendance"
                  description="Your recorded attendance information."
                  action={
                    <button
                      type="button"
                      onClick={() => loadSection("attendance")}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800"
                    >
                      View attendance
                      <ChevronRight size={17} />
                    </button>
                  }
                />

                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  {loading ? (
                    <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
                  ) : attendance ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                          <CheckCircle2 size={22} />
                        </div>

                        <div>
                          <p className="font-bold text-slate-950">
                            Attendance summary
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Based on records supplied by the school
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        {[
                          ["Present", attendance.present],
                          ["Absent", attendance.absent],
                          ["Late", attendance.late],
                          ["Sessions", attendance.total_sessions],
                        ]
                          .filter(([, value]) => value != null)
                          .map(([label, value]) => (
                            <div
                              key={label}
                              className="rounded-xl bg-slate-50 p-3"
                            >
                              <p className="text-xs text-slate-500">
                                {label}
                              </p>
                              <p className="mt-1 text-xl font-bold text-slate-950">
                                {value}
                              </p>
                            </div>
                          ))}
                      </div>
                    </>
                  ) : (
                    <EmptyState
                      icon={CheckCircle2}
                      title="No attendance summary"
                      description="Attendance will appear here when the school provides an authorized summary."
                    />
                  )}
                </div>
              </div>
            </section>

            {/* Assessments */}
            <section className="mt-10">
              <SectionHeading
                title="Recent assessments"
                description="Results and assessment records released to your account."
                action={
                  <button
                    type="button"
                    onClick={() => loadSection("assessments")}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950"
                  >
                    All assessments
                    <ChevronRight size={17} />
                  </button>
                }
              />

              <div className="mt-5">
                {loading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2].map((item) => (
                      <div
                        key={item}
                        className="h-28 animate-pulse rounded-2xl bg-slate-200"
                      />
                    ))}
                  </div>
                ) : assessments.length ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {assessments.slice(0, 4).map((assessment, index) => (
                      <AssessmentCard
                        key={assessment.id || assessment._id || index}
                        assessment={assessment}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={TrendingUp}
                    title="No assessment results published"
                    description="When assessment information is made available to your account, it will appear here."
                  />
                )}
              </div>
            </section>

            {/* Documents */}
            <section className="mt-10">
              <SectionHeading
                title="Learning documents"
                description="Documents and learning materials available to your account."
                action={
                  <button
                    type="button"
                    onClick={() => loadSection("documents")}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950"
                  >
                    View documents
                    <ChevronRight size={17} />
                  </button>
                }
              />

              <div className="mt-5">
                {loading ? (
                  <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
                ) : documents.length ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {documents.slice(0, 4).map((document, index) => (
                      <div
                        key={document.id || document._id || index}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <FileText size={19} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900">
                            {document.title ||
                              document.name ||
                              "Learning document"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {document.category ||
                              document.document_type ||
                              "Resource"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="No documents available"
                    description="Documents approved for your account will appear in this section."
                  />
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                  Student workspace
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  {navItems.find((item) => item.id === activeSection)?.label}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Information returned by your student-specific backend endpoint.
                </p>
              </div>

              <button
                type="button"
                onClick={returnToOverview}
                className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ArrowRight size={16} className="rotate-180" />
                Overview
              </button>
            </div>

            {sectionError && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900"
              >
                {sectionError}
              </div>
            )}

            {loadingSection ? (
              <div className="flex items-center gap-3 py-14 text-sm text-slate-500">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
                Loading {activeSection}…
              </div>
            ) : sectionData ? (
              <StudentSection
                section={activeSection}
                data={sectionData}
                onOpenAssignment={onOpenAssignment}
              />
            ) : !sectionError ? (
              <div className="mt-6">
                <EmptyState
                  icon={BookOpen}
                  title="No section data loaded"
                  description="Try refreshing this section. If it continues to fail, check that the corresponding student-specific backend endpoint exists."
                />
              </div>
            ) : null}
          </section>
        )}

        <footer className="mt-12 border-t border-slate-200 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">
              Jumuiya Elimu · Student learning workspace
            </p>

            <p className="flex items-center gap-2 text-xs leading-5 text-slate-500">
              <ShieldCheck size={15} className="shrink-0 text-emerald-700" />
              Access is subject to school permissions and account security.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}

function StudentSection({ section, data, onOpenAssignment }) {
  const assignments = arrayFrom(data, ["assignments", "items", "results"]);
  const lessons = arrayFrom(data, ["lessons", "items", "results"]);
  const assessments = arrayFrom(data, ["assessments", "items", "results"]);
  const entries = arrayFrom(data, [
    "entries",
    "timetable",
    "sessions",
    "records",
    "documents",
    "attendance",
    "items",
    "results",
  ]);

  if (section === "assignments") {
    if (!assignments.length) {
      return (
        <div className="mt-6">
          <EmptyState
            icon={ClipboardList}
            title="No assignments returned"
            description="There are no assignment records in the response."
          />
        </div>
      );
    }

    return (
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {assignments.map((assignment, index) => (
          <AssignmentCard
            key={assignment.id || assignment._id || index}
            assignment={assignment}
            onOpen={onOpenAssignment}
          />
        ))}
      </div>
    );
  }

  if (section === "assessments") {
    if (!assessments.length) {
      return (
        <div className="mt-6">
          <EmptyState
            icon={TrendingUp}
            title="No assessments returned"
            description="No assessment records are currently available."
          />
        </div>
      );
    }

    return (
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {assessments.map((assessment, index) => (
          <AssessmentCard
            key={assessment.id || assessment._id || index}
            assessment={assessment}
          />
        ))}
      </div>
    );
  }

  const list = section === "lessons" ? lessons : entries;

  if (!list.length) {
    return (
      <div className="mt-6">
        <EmptyState
          icon={
            section === "timetable"
              ? CalendarDays
              : section === "attendance"
              ? CheckCircle2
              : section === "documents"
              ? FileText
              : BookOpen
          }
          title="No records available"
          description="The endpoint returned no records for this section."
        />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {list.map((item, index) => {
        const title =
          item.title ||
          item.name ||
          item.subject ||
          item.lesson ||
          item.filename ||
          `${section.slice(0, 1).toUpperCase()}${section.slice(1)} record`;

        const description =
          item.description ||
          item.summary ||
          item.learning_area ||
          item.topic ||
          "";

        return (
          <article
            key={item.id || item._id || index}
            className="rounded-2xl border border-slate-200 p-4 sm:p-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                {section === "timetable" ? (
                  <CalendarDays size={19} />
                ) : section === "attendance" ? (
                  <CheckCircle2 size={19} />
                ) : section === "documents" ? (
                  <FileText size={19} />
                ) : (
                  <BookOpen size={19} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-900">{title}</h3>

                {description && (
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {description}
                  </p>
                )}

                <p className="mt-2 text-xs text-slate-500">
                  {formatDate(
                    item.date ||
                      item.start_at ||
                      item.created_at ||
                      item.updated_at
                  )}
                  {item.status ? ` · ${item.status}` : ""}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}