import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FileText,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

import { useElimuApi } from "@/services/elimuApi.jsx";

const numberFormat = new Intl.NumberFormat("en-KE");

function unwrap(response) {
  if (!response || typeof response !== "object") return response;

  return response.data && typeof response.data === "object"
    ? response.data
    : response;
}

function getCollection(response, keys = []) {
  const data = unwrap(response);

  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  for (const key of keys) {
    if (Array.isArray(data?.data?.[key])) return data.data[key];
  }

  return [];
}

function getMetric(data, keys, fallback = null) {
  for (const key of keys) {
    const value = data?.[key];

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

function money(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(Number(value))
  ) {
    return "—";
  }

  return `KES ${numberFormat.format(Number(value))}`;
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "blue",
}) {
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
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            tones[tone] || tones.blue
          }`}
        >
          <Icon size={21} />
        </span>
      </div>
    </article>
  );
}

function SectionHeading({
  title,
  description,
  action,
  onAction,
  actionDisabled = false,
}) {
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
          disabled={actionDisabled}
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-300"
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
      className="group flex h-full min-h-28 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-900 dark:hover:bg-blue-950/20"
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

function EmptyState({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="py-8 text-center">
      <Icon
        size={25}
        className="mx-auto text-slate-300 dark:text-slate-600"
      />

      <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {title}
      </p>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
        {description}
      </p>

      {action && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300"
        >
          {action}
          <ArrowRight size={15} />
        </button>
      )}
    </div>
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
  // Elimu-specific API service. No direct Jumuiya API dependency.
  const api = useElimuApi();

  const [dashboard, setDashboard] = useState(initialDashboard || null);
  const [staff, setStaff] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const mountedRef = useRef(false);
  const requestVersionRef = useRef(0);

  /*
   * Prefer the dedicated Elimu API method names.
   * Legacy aliases are kept only where the service exposes them.
   */
  const requestMethods = useMemo(
    () => ({
      dashboard: api.getDashboard || api.getElimuDashboard,
      staff: api.getStaff || api.getElimuStaff,
      classes: api.getClasses || api.getElimuClasses,
      students: api.getStudents || api.getElimuStudents,
      assignments: api.getAssignments || api.getElimuAssignments,
      lessons: api.getLessons || api.getElimuLessons,
      events: api.getEvents || api.getElimuEvents,
    }),
    [
      api.getDashboard,
      api.getElimuDashboard,
      api.getStaff,
      api.getElimuStaff,
      api.getClasses,
      api.getElimuClasses,
      api.getStudents,
      api.getElimuStudents,
      api.getAssignments,
      api.getElimuAssignments,
      api.getLessons,
      api.getElimuLessons,
      api.getEvents,
      api.getElimuEvents,
    ]
  );

  useEffect(() => {
    setDashboard(initialDashboard || null);
  }, [initialDashboard]);

  const loadData = useCallback(async () => {
    const requestVersion = ++requestVersionRef.current;

    setLoading(true);
    setError("");

    const requests = [
      {
        name: "dashboard",
        request: requestMethods.dashboard,
        setter: setDashboard,
        keys: ["dashboard", "hub"],
      },
      {
        name: "staff",
        request: requestMethods.staff,
        setter: setStaff,
        keys: ["staff", "members", "items", "records"],
      },
      {
        name: "classes",
        request: requestMethods.classes,
        setter: setClasses,
        keys: ["classes", "items", "records"],
      },
      {
        name: "students",
        request: requestMethods.students,
        setter: setStudents,
        keys: ["students", "items", "records"],
      },
      {
        name: "assignments",
        request: requestMethods.assignments,
        setter: setAssignments,
        keys: ["assignments", "items", "records"],
      },
      {
        name: "lessons",
        request: requestMethods.lessons,
        setter: setLessons,
        keys: ["lessons", "items", "records"],
      },
      {
        name: "events",
        request: requestMethods.events,
        setter: setEvents,
        keys: ["events", "items", "records"],
      },
    ];

    const results = await Promise.allSettled(
      requests.map(async (item) => {
        if (typeof item.request !== "function") {
          throw new Error(`Elimu API method is unavailable: ${item.name}`);
        }

        const response = await item.request();

        if (
          !mountedRef.current ||
          requestVersion !== requestVersionRef.current
        ) {
          return;
        }

        const data = unwrap(response);

        if (item.name === "dashboard") {
          item.setter(data || null);
        } else {
          item.setter(getCollection(data, item.keys));
        }
      })
    );

    if (
      !mountedRef.current ||
      requestVersion !== requestVersionRef.current
    ) {
      return;
    }

    const failures = results.reduce((failed, result, index) => {
      if (result.status === "rejected") {
        failed.push(requests[index].name);
      }

      return failed;
    }, []);

    if (failures.length) {
      setError(
        `Some school information could not be loaded (${failures.join(
          ", "
        )}). Available data is still displayed.`
      );
    }

    setLoading(false);
  }, [requestMethods]);

  useEffect(() => {
    mountedRef.current = true;
    void loadData();

    return () => {
      mountedRef.current = false;
      requestVersionRef.current += 1;
    };
  }, [loadData]);

  const navigate = useCallback(
    (path) => {
      onNavigate?.(path);
    },
    [onNavigate]
  );

  const refresh = useCallback(async () => {
    await loadData();

    if (typeof onRefresh === "function") {
      await onRefresh();
    }
  }, [loadData, onRefresh]);

  const schoolData = school || dashboard?.school || {};
  const metrics = dashboard?.metrics || dashboard?.hub?.metrics || {};

  const totalClasses =
    getMetric(metrics, ["classes", "total_classes"]) ?? classes.length;

  const totalStudents =
    getMetric(metrics, ["students", "total_students"]) ?? students.length;

  const totalStaff =
    getMetric(metrics, ["staff", "total_staff", "teachers"]) ?? staff.length;

  const totalLessons =
    getMetric(metrics, ["lessons", "total_lessons"]) ?? lessons.length;

  const totalAssignments =
    getMetric(metrics, ["assignments", "total_assignments"]) ??
    assignments.length;

  const outstandingFees = getMetric(metrics, [
    "pending_fees",
    "outstanding_fees",
    "fees_outstanding",
  ]);

  const schoolName =
    schoolData.name ||
    schoolData.school_name ||
    schoolData.institution_name ||
    "Your school";

  const schoolLocation = [
    schoolData.town,
    schoolData.county,
    schoolData.location,
  ]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(", ");

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
      description: "Review lessons, assignments and teaching activity.",
      path: "elimu/lessons",
    },
    {
      icon: ClipboardList,
      title: "School reports",
      description: "Open available operational reports.",
      path: "elimu/reports",
    },
    {
      icon: FileText,
      title: "School documents",
      description: "Review school publications and submitted resources.",
      path: "elimu/documents",
    },
    {
      icon: FileCheck2,
      title: "School profile",
      description: "Manage school information and publication settings.",
      path: "elimu/school",
    },
  ];

  const recentAssignments = assignments.slice(0, 4);

  const upcomingEvents = (
    Array.isArray(dashboard?.upcoming_events)
      ? dashboard.upcoming_events
      : events
  ).slice(0, 4);

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
              Monitor academic activity, school resources, staff, finances
              and school-wide operations from one central workspace.
            </p>

            <p className="mt-4 text-sm font-semibold text-white">
              {schoolName}
            </p>

            {schoolLocation && (
              <p className="mt-1 text-xs text-slate-400">
                {schoolLocation}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("elimu/school")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50"
            >
              School profile
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => navigate("elimu/documents")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <FileText size={17} />
              Document centre
            </button>
          </div>
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
            onClick={() => void refresh()}
            disabled={loading}
            className="shrink-0 font-semibold underline underline-offset-2 disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      )}

      <section>
        <SectionHeading
          title="School at a glance"
          description="A snapshot of records currently available to your account."
          action={loading ? undefined : "Refresh data"}
          onAction={() => void refresh()}
          actionDisabled={refreshing}
        />

        {loading &&
        !dashboard &&
        classes.length === 0 &&
        students.length === 0 ? (
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
              value={
                outstandingFees === null ? "—" : money(outstandingFees)
              }
              detail={
                outstandingFees === null
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

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

      <section className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/60 dark:bg-blue-950/20 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300">
              <FileCheck2 size={23} />
            </span>

            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-950 dark:text-white">
                School documents and publication
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Open the central document centre for official school
                documents, calendars, notices and educational resources.
                Documents must follow the school's review and publication
                permissions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("elimu/documents")}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Open document centre
            <ArrowRight size={16} />
          </button>
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
                  key={
                    assignment.id ||
                    assignment._id ||
                    assignment.assignment_id ||
                    index
                  }
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

                  <span className="shrink-0 text-right text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(
                      assignment.due_date ||
                        assignment.dueDate ||
                        assignment.created_at
                    ) || assignment.status || ""}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="No recent assignments available"
                description="Assignment activity will appear here when records are available."
                action="Open assignments"
                onAction={() => navigate("elimu/assignments")}
              />
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

                    <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                      {event.description ||
                        event.location ||
                        event.event_type ||
                        "Scheduled school activity"}
                    </p>
                  </div>

                  <span className="shrink-0 text-right text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(
                      event.start_date ||
                        event.date ||
                        event.start ||
                        event.created_at
                    )}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming events available"
                description="Add school activities to keep the calendar up to date."
                action="Manage calendar"
                onAction={() => navigate("elimu/calendar")}
              />
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
              {loading ? (
                <>
                  <RefreshCw
                    size={17}
                    className="animate-spin text-blue-600"
                  />
                  Refreshing records
                </>
              ) : (
                <>
                  <Activity size={17} className="text-emerald-600" />
                  Loaded
                </>
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}