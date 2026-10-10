import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  FileUp,
  GraduationCap,
  RefreshCw,
  Search,
  Users,
  UserPlus,
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

  if (data?.data && typeof data.data === "object") {
    for (const key of keys) {
      if (Array.isArray(data.data[key])) return data.data[key];
    }
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
  if (!value) return "Date not recorded";

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
  description,
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

          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
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

function StudentRow({ student }) {
  const fullName =
    student.full_name ||
    student.name ||
    [student.first_name, student.middle_name, student.last_name]
      .filter(Boolean)
      .join(" ") ||
    "Student record";

  const admission =
    student.admission_number ||
    student.admission_no ||
    student.student_number ||
    "No admission number";

  const className =
    student.class_name ||
    student.class?.name ||
    student.classroom ||
    student.grade ||
    "Class not assigned";

  const status =
    student.status || student.enrollment_status || "Recorded";

  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "ST";

  return (
    <div className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
        {initials}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
          {fullName}
        </p>

        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
          {admission} · {className}
        </p>
      </div>

      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {String(status).replace(/_/g, " ")}
      </span>
    </div>
  );
}

function ActivityRow({ item, type }) {
  const title =
    item.title ||
    item.name ||
    item.subject ||
    item.class_name ||
    (type === "assignment" ? "Assignment" : "School event");

  const date =
    item.due_date ||
    item.event_date ||
    item.date ||
    item.start_date ||
    item.created_at;

  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        {type === "assignment" ? (
          <BookOpen size={17} />
        ) : (
          <CalendarDays size={17} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {formatDate(date)}
        </p>
      </div>
    </div>
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

export default function ElimuRegistrarDashboard({
  access,
  dashboard: initialDashboard,
  school,
  onNavigate,
  onRefresh,
  refreshing = false,
}) {
  // Use the dedicated Elimu API service for Elimu records.
  const api = useElimuApi();

  const [dashboard, setDashboard] = useState(initialDashboard || null);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const mountedRef = useRef(false);
  const requestVersionRef = useRef(0);

  /*
   * Support the method names exposed by the dedicated Elimu service.
   * Prefer the Elimu service names, with older aliases as fallbacks.
   */
  const getStudentsRequest = api.getStudents || api.getElimuStudents;
  const getClassesRequest = api.getClasses || api.getElimuClasses;
  const getAssignmentsRequest = api.getAssignments || api.getElimuAssignments;
  const getLessonsRequest = api.getLessons || api.getElimuLessons;
  const getEventsRequest = api.getEvents || api.getElimuEvents;
  const getDashboardRequest = api.getDashboard || api.getElimuDashboard;

  useEffect(() => {
    setDashboard(initialDashboard || null);
  }, [initialDashboard]);

  const loadData = useCallback(async () => {
    const requestVersion = ++requestVersionRef.current;

    setLoading(true);
    setError("");

    const requests = [
      {
        name: "students",
        request: getStudentsRequest,
        setter: setStudents,
        keys: ["students", "items", "records"],
      },
      {
        name: "classes",
        request: getClassesRequest,
        setter: setClasses,
        keys: ["classes", "items", "records"],
      },
      {
        name: "assignments",
        request: getAssignmentsRequest,
        setter: setAssignments,
        keys: ["assignments", "items", "records"],
      },
      {
        name: "lessons",
        request: getLessonsRequest,
        setter: setLessons,
        keys: ["lessons", "items", "records"],
      },
      {
        name: "events",
        request: getEventsRequest,
        setter: setEvents,
        keys: ["events", "items", "records"],
      },
      {
        name: "dashboard",
        request: getDashboardRequest,
        setter: setDashboard,
        keys: [],
      },
    ];

    const results = await Promise.allSettled(
      requests.map(async ({ name, request, setter, keys }) => {
        if (typeof request !== "function") {
          throw new Error(`Elimu API method is unavailable: ${name}`);
        }

        const response = await request();

        if (
          !mountedRef.current ||
          requestVersion !== requestVersionRef.current
        ) {
          return;
        }

        const data = unwrap(response);

        if (name === "dashboard") {
          setter(data || null);
        } else {
          setter(getCollection(data, keys));
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
        `Some school records could not be loaded: ${failures.join(
          ", "
        )}. Available records remain visible.`
      );
    }

    setLoading(false);
  }, [
    getStudentsRequest,
    getClassesRequest,
    getAssignmentsRequest,
    getLessonsRequest,
    getEventsRequest,
    getDashboardRequest,
  ]);

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
      if (typeof onNavigate === "function") {
        onNavigate(path);
      }
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

  const totalStudents =
    getNumber(metrics, ["students", "total_students"]) ?? students.length;

  const totalClasses =
    getNumber(metrics, ["classes", "total_classes"]) ?? classes.length;

  const totalLessons =
    getNumber(metrics, ["lessons", "total_lessons"]) ?? lessons.length;

  const totalAssignments =
    getNumber(metrics, ["assignments", "total_assignments"]) ??
    assignments.length;

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return students;

    return students.filter((student) => {
      const fullName =
        student.full_name ||
        student.name ||
        [
          student.first_name,
          student.middle_name,
          student.last_name,
        ]
          .filter(Boolean)
          .join(" ");

      const searchable = [
        fullName,
        student.admission_number,
        student.admission_no,
        student.student_number,
        student.class_name,
        student.class?.name,
        student.grade,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [students, search]);

  const recentStudents = filteredStudents.slice(0, 6);
  const recentAssignments = assignments.slice(0, 4);
  const recentEvents = events.slice(0, 4);

  const schoolName =
    schoolData.name ||
    schoolData.school_name ||
    schoolData.institution_name ||
    "Your school";

  return (
    <div className="space-y-8">
      {/* Registrar dashboard header */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-blue-200">
              <ClipboardList size={14} />
              Student records and administration
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
              Registrar&apos;s dashboard
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Keep student records, school forms, official notices and
              academic administration organized in one workspace.
            </p>

            <p className="mt-4 text-sm font-semibold text-white">
              {schoolName}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading || refreshing}
            className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading || refreshing ? "animate-spin" : ""}
            />
            Refresh records
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
            onClick={() => void refresh()}
            className="shrink-0 font-semibold underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Overview metrics */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Users}
            label="Student records"
            value={numberFormat.format(totalStudents)}
            description="Student records available to your account"
            tone="blue"
          />

          <MetricCard
            icon={GraduationCap}
            label="Classes"
            value={numberFormat.format(totalClasses)}
            description="Classes in the school workspace"
            tone="green"
          />

          <MetricCard
            icon={BookOpen}
            label="Lessons"
            value={numberFormat.format(totalLessons)}
            description="Academic lesson records available"
            tone="violet"
          />

          <MetricCard
            icon={ClipboardList}
            label="Assignments"
            value={numberFormat.format(totalAssignments)}
            description="Assignment records returned by the API"
            tone="amber"
          />
        </div>
      </section>

      {/* Registrar document submission */}
      <section className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 dark:border-blue-900/60 dark:from-blue-950/30 dark:to-slate-950 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300">
              <FileUp size={23} />
            </span>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-950 dark:text-white">
                  Document submission centre
                </h2>

                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-800 dark:bg-blue-500/10 dark:text-blue-300">
                  Registrar
                </span>
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Submit school forms, notices, calendars, handbooks and other
                official school documents. Use this dedicated workspace
                instead of having to ask the Owner to submit documents for
                you. Publication must still follow the school&apos;s approval
                rules.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {["School forms", "Notices", "Calendar", "Handbooks"].map(
                  (label) => (
                    <span
                      key={label}
                      className="rounded-lg border border-blue-100 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                    >
                      {label}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("elimu/documents")}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
          >
            <FileText size={17} />
            Open document centre
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Registrar quick actions */}
      <section>
        <SectionHeading
          title="Registrar operations"
          description="Navigate directly to the relevant school administration workspace."
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <QuickAction
            icon={UserPlus}
            title="Student registration"
            description="Open the student register and manage student records."
            onClick={() => navigate("elimu/students")}
          />

          <QuickAction
            icon={GraduationCap}
            title="Class register"
            description="Review available classes and class assignments."
            onClick={() => navigate("elimu/classes")}
          />

          <QuickAction
            icon={FileText}
            title="School reports"
            description="Access available school reporting tools."
            onClick={() => navigate("elimu/reports")}
          />

          <QuickAction
            icon={CalendarDays}
            title="School calendar"
            description="Review school events and important dates."
            onClick={() => navigate("elimu/calendar")}
          />

          <QuickAction
            icon={BookOpen}
            title="Lessons and curriculum"
            description="Review lessons and curriculum activities."
            onClick={() => navigate("elimu/lessons")}
          />

          <QuickAction
            icon={CheckCircle2}
            title="Assignments"
            description="Review academic assignment records."
            onClick={() => navigate("elimu/assignments")}
          />
        </div>
      </section>

      {/* Student register */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950 dark:text-white">
              Student register
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Search student records currently available to your account.
            </p>
          </div>

          <label className="relative block w-full sm:max-w-xs">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search students..."
              aria-label="Search student records"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>
        </div>

        <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
          {recentStudents.length ? (
            recentStudents.map((student, index) => (
              <StudentRow
                key={
                  student.id ||
                  student._id ||
                  student.student_id ||
                  student.admission_number ||
                  index
                }
                student={student}
              />
            ))
          ) : (
            <div className="py-10 text-center">
              <Users
                size={28}
                className="mx-auto text-slate-300 dark:text-slate-600"
              />

              <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {search
                  ? "No matching students"
                  : "No student records available"}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                {search
                  ? "Try another name, admission number or class."
                  : "Student records will appear here when the API returns data."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={() => navigate("elimu/students")}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300"
                >
                  Open student register
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {filteredStudents.length > recentStudents.length && (
          <button
            type="button"
            onClick={() => navigate("elimu/students")}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300"
          >
            View all {numberFormat.format(filteredStudents.length)} matching
            records
            <ArrowRight size={16} />
          </button>
        )}
      </section>

      {/* Recent academic records */}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <SectionHeading
            title="Recent assignments"
            description="Latest available academic records."
            action="View all"
            onAction={() => navigate("elimu/assignments")}
          />

          <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
            {recentAssignments.length ? (
              recentAssignments.map((item, index) => (
                <ActivityRow
                  key={item.id || item._id || item.assignment_id || index}
                  item={item}
                  type="assignment"
                />
              ))
            ) : (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No assignment records available.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <SectionHeading
            title="School events"
            description="Events returned by the Elimu API."
            action="View calendar"
            onAction={() => navigate("elimu/calendar")}
          />

          <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
            {recentEvents.length ? (
              recentEvents.map((item, index) => (
                <ActivityRow
                  key={item.id || item._id || item.event_id || index}
                  item={item}
                  type="event"
                />
              ))
            ) : (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No school event records available.
              </p>
            )}
          </div>
        </section>
      </div>

      {loading && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Updating registrar records…
        </p>
      )}
    </div>
  );
}