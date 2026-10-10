import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

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

function getMetric(metrics, keys, fallback = null) {
  for (const key of keys) {
    const value = metrics?.[key];

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

function MetricCard({ icon: Icon, label, value, detail, tone = "blue" }) {
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
          {detail && (
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {detail}
            </p>
          )}
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

function SectionHeading({ title, description, action, onAction }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-base font-bold text-slate-950 dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>

      {action && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300"
        >
          {action}
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}

function ActivityRow({ icon: Icon, title, subtitle, trailing }) {
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
        <Icon size={18} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </p>
        {subtitle && (
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      {trailing && (
        <span className="shrink-0 text-right text-xs text-slate-500 dark:text-slate-400">
          {trailing}
        </span>
      )}
    </div>
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

export default function ElimuPrincipalDashboard({
  access,
  dashboard: initialDashboard,
  school,
  onNavigate,
  onRefresh,
  refreshing = false,
}) {
  const api = useJumuiyaApi();

  const [dashboard, setDashboard] = useState(initialDashboard || null);
  const [classes, setClasses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [fees, setFees] = useState([]);
  const [cbcProjects, setCbcProjects] = useState([]);
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setDashboard(initialDashboard || null);
  }, [initialDashboard]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const requests = [
      {
        name: "dashboard",
        request: api.getElimuDashboard,
        setter: setDashboard,
        keys: ["dashboard", "hub"],
      },
      {
        name: "classes",
        request: api.getClasses,
        setter: setClasses,
        keys: ["classes", "items"],
      },
      {
        name: "lessons",
        request: api.getLessons,
        setter: setLessons,
        keys: ["lessons", "items"],
      },
      {
        name: "assignments",
        request: api.getAssignments,
        setter: setAssignments,
        keys: ["assignments", "items"],
      },
      {
        name: "fees",
        request: api.getFees,
        setter: setFees,
        keys: ["fees", "records", "items"],
      },
      {
        name: "CBC projects",
        request: api.getCBCProjects,
        setter: setCbcProjects,
        keys: ["projects", "cbc_projects", "items"],
      },
      {
        name: "profile",
        request: api.getEducationProfile,
        setter: setProfile,
        keys: ["profile", "education_profile"],
      },
      {
        name: "calendar",
        request: api.getElimuEvents,
        setter: setEvents,
        keys: ["events", "items"],
      },
    ];

    const failures = [];

    await Promise.all(
      requests.map(async ({ name, request, setter, keys }) => {
        if (typeof request !== "function") return;

        try {
          const response = await request();
          const data = unwrap(response);

          if (name === "dashboard") {
            setter(data);
          } else {
            setter(getCollection(data, keys));
          }
        } catch {
          failures.push(name);
        }
      })
    );

    if (failures.length) {
      setError(
        `Some information could not be loaded: ${failures.join(", ")}. Other available records remain visible.`
      );
    }

    setLoading(false);
  }, [
    api.getElimuDashboard,
    api.getClasses,
    api.getLessons,
    api.getAssignments,
    api.getFees,
    api.getCBCProjects,
    api.getEducationProfile,
    api.getElimuEvents,
  ]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      await loadData();
    };

    run();

    return () => {
      active = false;
    };
  }, [loadData]);

  const schoolData = school || dashboard?.school || {};
  const metrics = dashboard?.metrics || dashboard?.hub?.metrics || {};

  const totalClasses = getMetric(metrics, ["classes", "total_classes"], classes.length);
  const totalStudents = getMetric(metrics, ["students", "total_students"]);
  const totalLessons = getMetric(metrics, ["lessons", "total_lessons"], lessons.length);
  const totalAssignments = getMetric(
    metrics,
    ["assignments", "total_assignments"],
    assignments.length
  );

  const outstandingFees = getMetric(metrics, [
    "pending_fees",
    "outstanding_fees",
    "fees_outstanding",
  ]);

  const upcomingEvents = Array.isArray(dashboard?.upcoming_events)
    ? dashboard.upcoming_events
    : events;

  const recentAssignments = Array.isArray(dashboard?.recent_assignments)
    ? dashboard.recent_assignments
    : assignments;

  const navigate = (path) => {
    if (typeof onNavigate === "function") onNavigate(path);
  };

  const refresh = async () => {
    await loadData();

    if (typeof onRefresh === "function") {
      await onRefresh();
    }
  };

  const schoolName =
    schoolData.name ||
    schoolData.school_name ||
    schoolData.institution_name ||
    "Your school";

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-1/3 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-indigo-200">
              <ShieldCheck size={14} />
              School leadership
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
              Principal's dashboard
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Coordinate academic delivery, monitor school activity, review
              student records and keep teaching operations on track.
            </p>

            <p className="mt-4 text-sm font-semibold text-white">
              {schoolName}
            </p>

            {(schoolData.county || schoolData.town || schoolData.location) && (
              <p className="mt-1 text-xs text-slate-400">
                {[schoolData.town, schoolData.county, schoolData.location]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={loading || refreshing}
            className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading || refreshing ? "animate-spin" : ""}
            />
            Refresh overview
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
        <SectionHeading
          title="Academic overview"
          description="Current totals from the records available to your account."
          action="Refresh data"
          onAction={refresh}
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={GraduationCap}
            label="Students"
            value={
              totalStudents === null
                ? "—"
                : numberFormat.format(totalStudents)
            }
            detail="Reported student enrolment"
            tone="blue"
          />

          <MetricCard
            icon={BookOpen}
            label="Classes"
            value={numberFormat.format(totalClasses)}
            detail="Registered classes"
            tone="violet"
          />

          <MetricCard
            icon={ClipboardCheck}
            label="Assignments"
            value={numberFormat.format(totalAssignments)}
            detail="Available assignment records"
            tone="green"
          />

          <MetricCard
            icon={Wallet}
            label="Outstanding fees"
            value={
              outstandingFees === null
                ? "—"
                : `KES ${numberFormat.format(outstandingFees)}`
            }
            detail={
              outstandingFees === null
                ? "Review the finance report for current balances"
                : "Reported outstanding balance"
            }
            tone="amber"
          />
        </div>
      </section>

      <section>
        <SectionHeading
          title="School operations"
          description="Go directly to the areas that need your attention."
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <QuickAction
            icon={Users}
            title="Staff and teaching assignments"
            description="Review staff information and teaching allocations where permitted."
            onClick={() => navigate("elimu/staff")}
          />

          <QuickAction
            icon={GraduationCap}
            title="Student records"
            description="Review enrolment, student details and class placement."
            onClick={() => navigate("elimu/students")}
          />

          <QuickAction
            icon={CalendarDays}
            title="Timetable"
            description="Review schedules and teaching arrangements."
            onClick={() => navigate("elimu/timetable")}
          />

          <QuickAction
            icon={BookOpen}
            title="Lessons and assignments"
            description="Monitor lesson preparation and assignment activity."
            onClick={() => navigate("elimu/lessons")}
          />

          <QuickAction
            icon={ClipboardCheck}
            title="Assessments and attendance"
            description="Review assessment delivery and learner participation."
            onClick={() => navigate("elimu/assessments")}
          />

          <QuickAction
            icon={Wallet}
            title="Finance reports"
            description="Review school fee reporting according to your permissions."
            onClick={() => navigate("elimu/reports")}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <SectionHeading
            title="Recent assignments"
            description={`${numberFormat.format(totalAssignments)} assignment records reported`}
            action="View assignments"
            onAction={() => navigate("elimu/assignments")}
          />

          <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
            {recentAssignments.length ? (
              recentAssignments.slice(0, 5).map((assignment, index) => (
                <ActivityRow
                  key={
                    assignment.id ||
                    assignment._id ||
                    assignment.assignment_id ||
                    index
                  }
                  icon={ClipboardCheck}
                  title={
                    assignment.title ||
                    assignment.name ||
                    "Untitled assignment"
                  }
                  subtitle={
                    assignment.class_name ||
                    assignment.className ||
                    assignment.subject ||
                    "School assignment"
                  }
                  trailing={
                    assignment.due_date || assignment.dueDate
                      ? formatDate(assignment.due_date || assignment.dueDate)
                      : assignment.status || ""
                  }
                />
              ))
            ) : (
              <div className="py-8 text-center">
                <CheckCircle2
                  size={25}
                  className="mx-auto text-slate-300 dark:text-slate-600"
                />
                <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  No recent assignments available
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Assignment activity will appear here when records are available.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <SectionHeading
            title="Upcoming school events"
            description="Keep track of important school activities."
            action="Open calendar"
            onAction={() => navigate("elimu/calendar")}
          />

          <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
            {upcomingEvents.length ? (
              upcomingEvents.slice(0, 5).map((event, index) => (
                <ActivityRow
                  key={event.id || event._id || event.event_id || index}
                  icon={CalendarDays}
                  title={event.title || event.name || "School event"}
                  subtitle={
                    event.description ||
                    event.location ||
                    event.event_type ||
                    "Scheduled school activity"
                  }
                  trailing={formatDate(
                    event.start_date || event.date || event.start
                  )}
                />
              ))
            ) : (
              <div className="py-8 text-center">
                <CalendarDays
                  size={25}
                  className="mx-auto text-slate-300 dark:text-slate-600"
                />
                <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  No upcoming events available
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  School activities will appear here when calendar records exist.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("elimu/calendar")}
                  className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300"
                >
                  Open calendar
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <SectionHeading
          title="Academic delivery"
          description="A quick summary of teaching and competency-based learning activity."
          action="View CBC projects"
          onAction={() => navigate("elimu/cbc")}
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Lessons
            </p>
            <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
              {numberFormat.format(totalLessons)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              CBC projects
            </p>
            <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
              {numberFormat.format(cbcProjects.length)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Workspace status
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <CheckCircle2 size={17} className="text-emerald-600" />
              {loading ? "Refreshing records" : "Dashboard loaded"}
            </p>
          </div>
        </div>
      </section>

      {profile && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <SectionHeading
            title="Education profile"
            description="Profile information available to the current account."
            action="Open profile"
            onAction={() => navigate("elimu/profile")}
          />

          <div className="mt-4 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              <GraduationCap size={19} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {profile.name ||
                  profile.full_name ||
                  profile.display_name ||
                  "Education profile"}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                {profile.email || profile.description || "Profile information loaded."}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}