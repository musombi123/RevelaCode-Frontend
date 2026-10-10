import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
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

function collection(response, keys = []) {
  const data = unwrap(response);

  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function metricValue(data, keys) {
  for (const key of keys) {
    const value = data?.[key];
    if (value !== undefined && value !== null && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }

  return null;
}

function money(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "—";
  }

  return `KES ${numberFormat.format(Number(value))}`;
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
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
        >
          {action}
          <ArrowRight size={16} />
        </button>
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
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-blue-100 group-hover:text-blue-700 dark:bg-slate-900 dark:text-slate-300 dark:group-hover:bg-blue-500/10 dark:group-hover:text-blue-300">
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

export default function ElimuOwnerDashboard({
  access,
  dashboard: initialDashboard,
  school,
  onNavigate,
  onRefresh,
  refreshing = false,
}) {
  const api = useJumuiyaApi();

  const [dashboard, setDashboard] = useState(initialDashboard || null);
  const [staff, setStaff] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [lessons, setLessons] = useState([]);
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
      ["dashboard", api.getElimuDashboard, setDashboard],
      ["staff", api.getElimuStaff, setStaff],
      ["classes", api.getClasses, setClasses],
      ["students", api.getElimuStudents, setStudents],
      ["fees", api.getFees, setFees],
      ["assignments", api.getAssignments, setAssignments],
      ["lessons", api.getLessons, setLessons],
      ["events", api.getElimuEvents, setEvents],
    ];

    const failures = [];

    await Promise.all(
      requests.map(async ([name, request, setter]) => {
        if (typeof request !== "function") return;

        try {
          const response = await request();
          const data = unwrap(response);

          if (name === "dashboard") {
            setter(data);
          } else if (name === "staff") {
            setter(collection(data, ["staff", "members", "items"]));
          } else if (name === "classes") {
            setter(collection(data, ["classes", "items"]));
          } else if (name === "students") {
            setter(collection(data, ["students", "items"]));
          } else if (name === "fees") {
            setter(collection(data, ["fees", "records", "items"]));
          } else if (name === "assignments") {
            setter(collection(data, ["assignments", "items"]));
          } else if (name === "lessons") {
            setter(collection(data, ["lessons", "items"]));
          } else if (name === "events") {
            setter(collection(data, ["events", "items"]));
          }
        } catch {
          failures.push(name);
        }
      })
    );

    if (failures.length) {
      setError(
        `Some school information could not be loaded (${failures.join(", ")}). Available data is still displayed.`
      );
    }

    setLoading(false);
  }, [
    api.getElimuDashboard,
    api.getElimuStaff,
    api.getClasses,
    api.getElimuStudents,
    api.getFees,
    api.getAssignments,
    api.getLessons,
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

  const totalClasses =
    metricValue(metrics, ["classes", "total_classes"]) ?? classes.length;
  const totalStudents =
    metricValue(metrics, ["students", "total_students"]) ?? students.length;
  const totalStaff =
    metricValue(metrics, ["staff", "total_staff", "teachers"]) ?? staff.length;
  const totalLessons =
    metricValue(metrics, ["lessons", "total_lessons"]) ?? lessons.length;
  const totalAssignments =
    metricValue(metrics, ["assignments", "total_assignments"]) ??
    assignments.length;

  const pendingFees = metricValue(metrics, [
    "pending_fees",
    "outstanding_fees",
    "fees_outstanding",
  ]);

  const quickActions = [
    {
      icon: Users,
      title: "Manage staff",
      description: "Review school members, invitations and access.",
      path: "elimu/staff",
    },
    {
      icon: GraduationCap,
      title: "Student records",
      description: "Review enrolment and student information.",
      path: "elimu/students",
    },
    {
      icon: CalendarDays,
      title: "Timetable",
      description: "Review class schedules and teaching allocations.",
      path: "elimu/timetable",
    },
    {
      icon: Wallet,
      title: "School finances",
      description: "Review fees and financial reporting.",
      path: "elimu/fees",
    },
    {
      icon: BookOpen,
      title: "Academic activities",
      description: "Review lessons and assignments.",
      path: "elimu/lessons",
    },
    {
      icon: ClipboardList,
      title: "School reports",
      description: "Open available operational reports.",
      path: "elimu/reports",
    },
  ];

  const recentAssignments = assignments.slice(0, 4);
  const upcomingEvents = (dashboard?.upcoming_events || events).slice(0, 4);

  const navigate = (path) => {
    if (typeof onNavigate === "function") onNavigate(path);
  };

  const refresh = async () => {
    await loadData();
    if (typeof onRefresh === "function") {
      await onRefresh();
    }
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-1/3 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-blue-200">
              <ShieldCheck size={14} />
              School leadership
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
              School overview
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Monitor academic activity, school resources and daily operations
              from one central workspace.
            </p>

            <p className="mt-4 text-sm font-semibold text-white">
              {schoolData.name ||
                schoolData.school_name ||
                schoolData.institution_name ||
                "Your school"}
            </p>

            {(schoolData.county || schoolData.location || schoolData.town) && (
              <p className="mt-1 text-xs text-slate-400">
                {[schoolData.town, schoolData.county, schoolData.location]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate("elimu/school")}
            className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50"
          >
            School profile
            <ArrowRight size={16} />
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
          title="School at a glance"
          description="A snapshot of the records currently available to your account."
          action={loading ? undefined : "Refresh data"}
          onAction={refresh}
        />

        {loading && !dashboard && classes.length === 0 && students.length === 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={GraduationCap}
              label="Students"
              value={numberFormat.format(totalStudents)}
              detail="Student records available"
              tone="blue"
            />
            <MetricCard
              icon={Users}
              label="Staff members"
              value={numberFormat.format(totalStaff)}
              detail="School staff records available"
              tone="green"
            />
            <MetricCard
              icon={BookOpen}
              label="Classes"
              value={numberFormat.format(totalClasses)}
              detail="Registered school classes"
              tone="violet"
            />
            <MetricCard
              icon={Wallet}
              label="Outstanding fees"
              value={pendingFees === null ? "—" : money(pendingFees)}
              detail={
                pendingFees === null
                  ? "Open the finance report for current balances"
                  : "Reported outstanding balance"
              }
              tone="amber"
            />
          </div>
        )}
      </section>

      <section>
        <SectionHeading
          title="Leadership actions"
          description="Open the school management area you need."
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => (
            <QuickAction
              key={action.path}
              icon={action.icon}
              title={action.title}
              description={action.description}
              onClick={() => navigate(action.path)}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <SectionHeading
            title="Recent assignments"
            description={`${numberFormat.format(totalAssignments)} assignments reported`}
            action="View assignments"
            onAction={() => navigate("elimu/assignments")}
          />

          <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
            {recentAssignments.length ? (
              recentAssignments.map((assignment, index) => (
                <div
                  key={assignment.id || assignment._id || assignment.assignment_id || index}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    <ClipboardList size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {assignment.title ||
                        assignment.name ||
                        "Untitled assignment"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {assignment.class_name ||
                        assignment.className ||
                        assignment.subject ||
                        "School assignment"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    {assignment.due_date ||
                      assignment.dueDate ||
                      assignment.status ||
                      ""}
                  </span>
                </div>
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
            title="School calendar"
            description="Upcoming school activities and events."
            action="Open calendar"
            onAction={() => navigate("elimu/calendar")}
          />

          <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
            {upcomingEvents.length ? (
              upcomingEvents.map((event, index) => (
                <div
                  key={event.id || event._id || event.event_id || index}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <CalendarDays size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {event.title || event.name || "School event"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {event.description ||
                        event.location ||
                        event.event_type ||
                        "Scheduled school activity"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    {event.start_date ||
                      event.date ||
                      event.start ||
                      ""}
                  </span>
                </div>
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
                  Add school activities to keep the calendar up to date.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("elimu/calendar")}
                  className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300"
                >
                  Manage calendar
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <SectionHeading
          title="Academic activity"
          description="Summary of lessons and teaching materials."
          action="View lessons"
          onAction={() => navigate("elimu/lessons")}
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
              Assignments
            </p>
            <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
              {numberFormat.format(totalAssignments)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Dashboard status
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <Activity size={17} className="text-emerald-600" />
              {loading ? "Refreshing records" : "Loaded"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}