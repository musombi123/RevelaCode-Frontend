import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  RefreshCw,
  Users,
  ClipboardList,
} from "lucide-react";
import { useElimuApi } from "@/services/elimuApi.jsx";

const numberFormat = new Intl.NumberFormat("en-KE");

function unwrap(response) {
  if (!response || typeof response !== "object") return response;

  return response.data && typeof response.data === "object"
    ? response.data
    : response;
}

function getCollection(response, keys) {
  const data = unwrap(response);

  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function getNumber(object, keys, fallback = null) {
  for (const key of keys) {
    const value = object?.[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }

  return fallback;
}

function formatDate(value) {
  if (!value) return "Date not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function MetricCard({ icon: Icon, label, value, description, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    green:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    violet:
      "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <p className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone] || tones.blue}`}
        >
          <Icon size={21} />
        </span>
      </div>
    </article>
  );
}

function QuickAction({ icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-900 dark:hover:bg-blue-950/20"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700 dark:bg-slate-900 dark:text-slate-300 dark:group-hover:bg-blue-500/10 dark:group-hover:text-blue-300">
        <Icon size={19} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </span>

        <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </span>
      </span>

      <ArrowRight
        size={16}
        className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
      />
    </button>
  );
}

function AssignmentCard({ assignment }) {
  const title =
    assignment.title ||
    assignment.name ||
    assignment.subject ||
    "Untitled assignment";

  const className =
    assignment.class_name ||
    assignment.class?.name ||
    assignment.classroom ||
    assignment.grade ||
    "Class not specified";

  const dueDate =
    assignment.due_date ||
    assignment.deadline ||
    assignment.submission_deadline;

  const status = assignment.status || assignment.assignment_status || "Assigned";

  const normalizedStatus = String(status).toLowerCase();

  const statusClass =
    normalizedStatus.includes("complete") ||
    normalizedStatus.includes("published") ||
    normalizedStatus.includes("submitted")
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
      : normalizedStatus.includes("overdue") ||
          normalizedStatus.includes("pending")
        ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

  return (
    <article className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
          <ClipboardList size={19} />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="break-words text-sm font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {className}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {dueDate && (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Clock3 size={13} />
                Due {formatDate(dueDate)}
              </span>
            )}

            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${statusClass}`}
            >
              {String(status).replaceAll("_", " ")}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function LessonCard({ lesson }) {
  const title =
    lesson.title ||
    lesson.name ||
    lesson.topic ||
    lesson.subject ||
    "Untitled lesson";

  const subject = lesson.subject || lesson.subject_name || "Subject not specified";

  const className =
    lesson.class_name ||
    lesson.class?.name ||
    lesson.classroom ||
    lesson.grade ||
    "Class not specified";

  const date =
    lesson.lesson_date ||
    lesson.scheduled_date ||
    lesson.date ||
    lesson.created_at;

  return (
    <div className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
        <BookOpen size={18} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {subject} · {className}
        </p>

        {date && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {formatDate(date)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ElimuTeacherDashboard({
  access,
  dashboard: initialDashboard,
  school,
  onNavigate,
  onRefresh,
  refreshing = false,
}) {
  const api = useElimuApi();

  const [dashboard, setDashboard] = useState(initialDashboard || null);
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setDashboard(initialDashboard || null);
  }, [initialDashboard]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const failures = [];

    const requests = [
      {
        name: "lessons",
        request: api.getLessons,
        setter: setLessons,
        keys: ["lessons", "items", "records"],
      },
      {
        name: "assignments",
        request: api.getAssignments,
        setter: setAssignments,
        keys: ["assignments", "items", "records"],
      },
      {
        name: "classes",
        request: api.getClasses,
        setter: setClasses,
        keys: ["classes", "items", "records"],
      },
      {
        name: "dashboard",
        request: api.getElimuDashboard,
        setter: setDashboard,
        keys: [],
      },
      {
        name: "timetable",
        request: api.getElimuTeacherTimetable,
        setter: setTimetable,
        keys: [],
      },
    ];

    await Promise.all(
      requests.map(async ({ name, request, setter, keys }) => {
        if (typeof request !== "function") return;

        try {
          const response = await request();
          const data = unwrap(response);

          setter(keys.length ? getCollection(data, keys) : data);
        } catch {
          failures.push(name);
        }
      })
    );

    if (failures.length) {
      setError(
        `Some teaching information could not be loaded: ${failures.join(", ")}. Available records remain visible.`
      );
    }

    setLoading(false);
  }, [
    api.getLessons,
    api.getAssignments,
    api.getClasses,
    api.getElimuDashboard,
    api.getElimuTeacherTimetable,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const navigate = (path) => {
    if (typeof onNavigate === "function") onNavigate(path);
  };

  const refresh = async () => {
    await loadData();

    if (typeof onRefresh === "function") {
      await onRefresh();
    }
  };

  const schoolData = school || dashboard?.school || {};
  const metrics = dashboard?.metrics || dashboard?.hub?.metrics || {};

  const totalClasses =
    getNumber(metrics, ["classes", "total_classes"]) ?? classes.length;

  const totalLessons =
    getNumber(metrics, ["lessons", "total_lessons"]) ?? lessons.length;

  const totalAssignments =
    getNumber(metrics, ["assignments", "total_assignments"]) ??
    assignments.length;

  const schoolName =
    schoolData.name ||
    schoolData.school_name ||
    schoolData.institution_name ||
    "Your school";

  const timetableEntries = Array.isArray(timetable)
    ? timetable
    : timetable?.entries ||
      timetable?.timetable?.entries ||
      timetable?.timetable ||
      [];

  const visibleTimetable = Array.isArray(timetableEntries)
    ? timetableEntries.slice(0, 5)
    : [];

  const recentAssignments = assignments.slice(0, 4);
  const recentLessons = lessons.slice(0, 5);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-blue-200">
              <GraduationCap size={14} />
              Teaching workspace
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
              Teacher's dashboard
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Organize lesson delivery, manage assignments and keep track of
              your available classes from one workspace.
            </p>

            <p className="mt-4 text-sm font-semibold text-white">
              {schoolName}
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={loading || refreshing}
            className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading || refreshing ? "animate-spin" : ""}
            />
            Refresh workspace
          </button>
        </div>
      </section>

      {error && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="flex-1">{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="shrink-0 font-semibold underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      <section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={GraduationCap}
            label="Assigned classes"
            value={numberFormat.format(totalClasses)}
            description="Class records available to your account"
            tone="blue"
          />

          <MetricCard
            icon={BookOpen}
            label="Lessons"
            value={numberFormat.format(totalLessons)}
            description="Lesson records currently available"
            tone="violet"
          />

          <MetricCard
            icon={ClipboardList}
            label="Assignments"
            value={numberFormat.format(totalAssignments)}
            description="Assignments returned by the API"
            tone="amber"
          />

          <MetricCard
            icon={CheckCircle2}
            label="Timetable entries"
            value={
              timetable
                ? numberFormat.format(visibleTimetable.length)
                : "—"
            }
            description="Entries returned by the teacher timetable endpoint"
            tone="green"
          />
        </div>
      </section>

      <section>
        <div>
          <h2 className="text-base font-bold text-slate-950 dark:text-white">
            Teaching tools
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Access your core academic tasks.
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <QuickAction
            icon={BookOpen}
            title="Lesson planning"
            description="Review and organize lesson records."
            onClick={() => navigate("elimu/lessons")}
          />

          <QuickAction
            icon={ClipboardList}
            title="Assignments"
            description="Open assignment management and review existing work."
            onClick={() => navigate("elimu/assignments")}
          />

          <QuickAction
            icon={GraduationCap}
            title="My classes"
            description="Review available classes and class information."
            onClick={() => navigate("elimu/classes")}
          />

          <QuickAction
            icon={CalendarDays}
            title="Teaching timetable"
            description="Open timetable management and published schedules."
            onClick={() => navigate("elimu/timetable")}
          />

          <QuickAction
            icon={ClipboardCheck}
            title="Attendance"
            description="Open the school's attendance workspace."
            onClick={() => navigate("elimu/attendance")}
          />

          <QuickAction
            icon={Users}
            title="Student records"
            description="Access student records where your permissions allow."
            onClick={() => navigate("elimu/students")}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-950 dark:text-white">
                Recent assignments
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Assignments available in the teaching workspace
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("elimu/assignments")}
              className="text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300"
            >
              View all
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {recentAssignments.length ? (
              recentAssignments.map((assignment, index) => (
                <AssignmentCard
                  key={
                    assignment.id ||
                    assignment._id ||
                    assignment.assignment_id ||
                    index
                  }
                  assignment={assignment}
                />
              ))
            ) : (
              <div className="py-8 text-center">
                <ClipboardList
                  size={27}
                  className="mx-auto text-slate-300 dark:text-slate-600"
                />
                <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  No assignments available
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Assignment records will appear here when returned by the API.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-950 dark:text-white">
                Recent lessons
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Lesson records available to your account
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("elimu/lessons")}
              className="text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300"
            >
              View all
            </button>
          </div>

          <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
            {recentLessons.length ? (
              recentLessons.map((lesson, index) => (
                <LessonCard
                  key={lesson.id || lesson._id || lesson.lesson_id || index}
                  lesson={lesson}
                />
              ))
            ) : (
              <div className="py-8 text-center">
                <BookOpen
                  size={27}
                  className="mx-auto text-slate-300 dark:text-slate-600"
                />
                <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  No lesson records available
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Lesson records will appear here when returned by the API.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-950 dark:text-white">
              Teaching timetable
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your timetable data, when available from the backend.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("elimu/timetable")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300"
          >
            Open timetable
            <ArrowRight size={16} />
          </button>
        </div>

        {visibleTimetable.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleTimetable.map((entry, index) => (
              <article
                key={entry.id || entry._id || entry.entry_id || index}
                className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {entry.subject ||
                    entry.subject_name ||
                    entry.title ||
                    "Scheduled lesson"}
                </p>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {entry.class_name ||
                    entry.class?.name ||
                    entry.classroom ||
                    "Class not specified"}
                </p>

                <p className="mt-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                  {entry.day ||
                    entry.day_of_week ||
                    entry.date ||
                    "Day not specified"}
                  {entry.start_time || entry.time
                    ? ` · ${entry.start_time || entry.time}`
                    : ""}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl bg-slate-50 p-5 text-center dark:bg-slate-900">
            <CalendarDays
              size={26}
              className="mx-auto text-slate-300 dark:text-slate-600"
            />
            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Timetable entries are not available here yet
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Open the timetable workspace to access schedules supported by
              your account.
            </p>
          </div>
        )}
      </section>

      {loading && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Updating teaching records…
        </p>
      )}
    </div>
  );
}