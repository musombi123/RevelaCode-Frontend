// src/Dashboard/ElimuDashboardWorkspace.jsx

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Loader2,
  RefreshCw,
  School,
  WalletCards,
} from "lucide-react";

import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import { ElimuAccountPlanBanner } from "@/Dashboard/ElimuSchoolAccess.jsx";

// =========================================================
// HELPERS
// =========================================================

function asList(value, key) {
  if (Array.isArray(value)) {
    return value;
  }

  if (key && Array.isArray(value?.[key])) {
    return value[key];
  }

  for (const property of [
    "items",
    "results",
    "records",
    "data",
  ]) {
    if (Array.isArray(value?.[property])) {
      return value[property];
    }
  }

  return [];
}

function errorMessage(error) {
  return (
    error?.message ||
    error?.error?.message ||
    "An unexpected request error occurred."
  );
}

function formatCount(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? new Intl.NumberFormat("en-KE", {
        maximumFractionDigits: 0,
      }).format(number)
    : "0";
}

function getClassName(item) {
  return (
    item?.name ||
    item?.class_name ||
    item?.title ||
    item?.grade ||
    "Class"
  );
}

function getItemId(item) {
  return item?.id || item?._id || item?.school_id || "";
}

// =========================================================
// METRIC CARD
// =========================================================

function MetricCard({ icon: Icon, label, value, helper }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
          <Icon size={20} />
        </div>

        <ArrowUpRight
          size={17}
          aria-hidden="true"
          className="text-slate-300 dark:text-slate-600"
        />
      </div>

      <div className="mt-5">
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {formatCount(value)}
        </div>

        <div className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </div>

        <div className="mt-1 text-xs text-slate-400">
          {helper}
        </div>
      </div>
    </div>
  );
}

// =========================================================
// QUICK ACTION
// =========================================================

function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-slate-900 dark:hover:border-emerald-700"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:group-hover:bg-emerald-950/60">
          <Icon size={18} />
        </div>

        <div className="min-w-0">
          <div className="truncate font-semibold text-slate-900 dark:text-white">
            {title}
          </div>

          <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </div>
        </div>
      </div>

      <ChevronRight
        size={17}
        aria-hidden="true"
        className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-600"
      />
    </button>
  );
}

// =========================================================
// SECTION HEADER
// =========================================================

function SectionHeading({
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>

        {description ? (
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>

      {actionLabel && typeof onAction === "function" ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-emerald-700 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-emerald-400"
        >
          {actionLabel}
          <ChevronRight size={15} />
        </button>
      ) : null}
    </div>
  );
}

// =========================================================
// EMPTY STATE
// =========================================================

function EmptyState({
  icon: Icon = School,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center dark:border-white/10">
      <Icon
        size={28}
        aria-hidden="true"
        className="mx-auto text-emerald-500"
      />

      <h4 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
        {title}
      </h4>

      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400">
        {description}
      </p>

      {actionLabel && typeof onAction === "function" ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
        >
          {actionLabel}
          <ChevronRight size={14} />
        </button>
      ) : null}
    </div>
  );
}

// =========================================================
// LOADING SKELETON
// =========================================================

function DashboardSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Loading dashboard metrics"
      aria-busy="true"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-36 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
        />
      ))}
    </div>
  );
}

// =========================================================
// ELIMU DASHBOARD WORKSPACE
//
// This component intentionally does not wrap itself in
// JumuiyaDashboardShell.
// =========================================================

export default function ElimuDashboardWorkspace({
  onNavigate,
  accountAccess,
  accountSchool,
}) {
  const {
    getEducationProfile,
    getSchool,
    getClasses,
    getLessons,
    getAssignments,
    getFees,
    getCBCProjects,
    getElimuDashboard,
  } = useJumuiyaApi();

  const [dashboard, setDashboard] = useState(null);
  const [profile, setProfile] = useState(null);
  const [school, setSchool] = useState(accountSchool || null);

  const [classes, setClasses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [fees, setFees] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // =======================================================
  // NAVIGATION
  // =======================================================

  const navigate = useCallback(
    (destination) => {
      if (typeof onNavigate === "function") {
        onNavigate(destination);
      }
    },
    [onNavigate],
  );

  // =======================================================
  // LOAD DASHBOARD DATA
  // =======================================================

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const requests = [
      ["dashboard", getElimuDashboard],
      ["profile", getEducationProfile],
      ["school", getSchool],
      ["classes", getClasses],
      ["lessons", getLessons],
      ["assignments", getAssignments],
      ["fees", getFees],
      ["projects", getCBCProjects],
    ];

    const results = await Promise.all(
      requests.map(async ([key, request]) => {
        try {
          return {
            key,
            data: await request(),
            error: null,
          };
        } catch (requestError) {
          return {
            key,
            data: null,
            error: errorMessage(requestError),
          };
        }
      }),
    );

    const data = {};
    const failures = [];

    for (const result of results) {
      data[result.key] = result.data;

      if (result.error) {
        failures.push({
          module: result.key,
          message: result.error,
        });
      }
    }

    setDashboard(data.dashboard || null);
    setProfile(data.profile || null);

    const schoolResult =
      data.school ||
      data.dashboard?.school ||
      accountSchool ||
      null;

    setSchool(schoolResult);

    setClasses(asList(data.classes, "classes"));
    setLessons(asList(data.lessons, "lessons"));
    setAssignments(asList(data.assignments, "assignments"));
    setFees(asList(data.fees, "fees"));
    setProjects(asList(data.projects, "projects"));

    if (failures.length === requests.length) {
      setError(
        "Every Elimu dashboard request failed. Check the backend connection, authentication, CORS configuration, and registered Elimu routes.",
      );
    } else if (failures.length > 0) {
      const descriptions = failures.map(
        (failure) =>
          `${failure.module}: ${failure.message}`,
      );

      setError(
        `Some Elimu modules could not load (${descriptions.join(
          "; ",
        )}). Available modules are still displayed. Retry after checking the affected endpoints.`,
      );
    }

    setLastUpdated(new Date());
    setLoading(false);
  }, [
    getElimuDashboard,
    getEducationProfile,
    getSchool,
    getClasses,
    getLessons,
    getAssignments,
    getFees,
    getCBCProjects,
    accountSchool,
  ]);

  useEffect(() => {
    let active = true;

    async function run() {
      await loadDashboard();

      // The request handler checks no component state after unmount.
      // This guard is retained for future asynchronous extensions.
      if (!active) return;
    }

    run();

    return () => {
      active = false;
    };
  }, [loadDashboard]);

  // =======================================================
  // NORMALIZED DASHBOARD DATA
  // =======================================================

  const metrics =
    dashboard?.metrics ||
    dashboard?.summary ||
    {};

  const profileData =
    dashboard?.profile ||
    profile ||
    null;

  const schoolData =
    dashboard?.school ||
    school ||
    accountSchool ||
    null;

  const dashboardClasses = asList(
    dashboard?.classes ?? classes,
    "classes",
  );

  const dashboardLessons = asList(
    dashboard?.lessons ?? lessons,
    "lessons",
  );

  const dashboardAssignments = asList(
    dashboard?.assignments ?? assignments,
    "assignments",
  );

  const dashboardFees = asList(
    dashboard?.fees ?? fees,
    "fees",
  );

  const dashboardProjects = asList(
    dashboard?.cbc_projects ??
      dashboard?.projects ??
      projects,
    "projects",
  );

  const classCount =
    metrics.classes ??
    dashboardClasses.length;

  const lessonCount =
    metrics.lessons ??
    dashboardLessons.length;

  const assignmentCount =
    metrics.assignments ??
    dashboardAssignments.length;

  const projectCount =
    metrics.cbc_projects ??
    dashboardProjects.length;

  const feeCount =
    metrics.fees ??
    dashboardFees.length;

  const pendingFees =
    metrics.pending_fees ??
    dashboardFees.filter((fee) =>
      ["pending", "unpaid", "overdue"].includes(
        String(fee?.status || "").toLowerCase(),
      ),
    ).length;

  const pendingFeeNumber = Math.max(
    0,
    Number(pendingFees) || 0,
  );

  const feeTotal = Math.max(
    0,
    Number(feeCount) || 0,
  );

  const pendingFeePercentage =
    feeTotal > 0
      ? Math.min(100, (pendingFeeNumber / feeTotal) * 100)
      : 0;

  const schoolName =
    schoolData?.name ||
    profileData?.school_name ||
    profileData?.full_name ||
    profileData?.fullName ||
    "Your education hub";

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="space-y-6">
      {/* SCHOOL ACCOUNT AND TRIAL INFORMATION */}

      <ElimuAccountPlanBanner
        access={accountAccess}
        school={schoolData}
      />

      {/* HERO */}

      <section className="overflow-hidden rounded-3xl bg-slate-950 px-5 py-7 text-white shadow-xl sm:px-7 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
              <GraduationCap size={14} />
              Elimu education workspace
            </div>

            <h2 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
              {schoolName}
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Manage classes, lessons, assignments, school information,
              fees, and CBC projects from your education workspace.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              {profileData?.profile_type ? (
                <span className="rounded-full bg-white/10 px-3 py-1.5">
                  {profileData.profile_type}
                </span>
              ) : null}

              {schoolData?.county ? (
                <span className="rounded-full bg-white/10 px-3 py-1.5">
                  {schoolData.county}
                </span>
              ) : null}

              {schoolData?.verification_status ? (
                <span className="rounded-full bg-white/10 px-3 py-1.5">
                  Verification: {schoolData.verification_status}
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("elimu/classes")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
          >
            Open learning
            <ChevronRight size={17} />
          </button>
        </div>
      </section>

      {/* DASHBOARD CONTROLS */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">
            School overview
          </h3>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Live data returned by your Elimu API.
            {lastUpdated
              ? ` Last checked at ${lastUpdated.toLocaleTimeString("en-KE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}.`
              : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/5"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          {loading ? "Refreshing..." : "Refresh dashboard"}
        </button>
      </div>

      {/* LOADING */}

      {loading ? (
        <DashboardSkeleton />
      ) : null}

      {/* API ERRORS */}

      {!loading && error ? (
        <section
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={21}
              className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300"
            />

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-amber-950 dark:text-amber-100">
                Elimu data could not load completely
              </h3>

              <p className="mt-1 break-words text-sm leading-6 text-amber-900 dark:text-amber-100">
                {error}
              </p>

              <button
                type="button"
                onClick={loadDashboard}
                disabled={loading}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-950 transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-800 dark:text-amber-100 dark:hover:bg-amber-900/30"
              >
                <RefreshCw size={14} />
                Retry failed requests
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {/* METRICS */}

      {!loading ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={School}
            label="Classes"
            value={classCount}
            helper="Classes returned by the API"
          />

          <MetricCard
            icon={BookOpen}
            label="Lessons"
            value={lessonCount}
            helper="Learning resources"
          />

          <MetricCard
            icon={ClipboardList}
            label="Assignments"
            value={assignmentCount}
            helper="Learning tasks"
          />

          <MetricCard
            icon={CheckCircle2}
            label="CBC projects"
            value={projectCount}
            helper="Curriculum projects"
          />
        </section>
      ) : null}

      {/* MAIN DASHBOARD */}

      {!loading ? (
        <>
          {/* CLASSES AND FEES */}

          <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <SectionHeading
                title="Classes"
                description="Classes available to your education workspace."
                actionLabel="View classes"
                onAction={() => navigate("elimu/classes")}
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {dashboardClasses.slice(0, 4).map((item, index) => {
                  const itemId = getItemId(item);

                  return (
                    <button
                      type="button"
                      key={itemId || index}
                      onClick={() =>
                        navigate(
                          itemId
                            ? `elimu/classes/${itemId}`
                            : "elimu/classes",
                        )
                      }
                      className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3 text-left transition hover:border-emerald-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/5 dark:hover:bg-white/5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                          <School size={17} />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-slate-900 dark:text-white">
                            {getClassName(item)}
                          </div>

                          <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                            {item.level ||
                              item.stream ||
                              item.academic_year ||
                              "Education class"}
                          </div>
                        </div>
                      </div>

                      <ChevronRight
                        size={16}
                        className="shrink-0 text-slate-400"
                      />
                    </button>
                  );
                })}

                {dashboardClasses.length === 0 ? (
                  <div className="col-span-full">
                    <EmptyState
                      icon={School}
                      title="No classes yet"
                      description="Create or connect a class to begin managing learning."
                      actionLabel="Open classes"
                      onAction={() => navigate("elimu/classes")}
                    />
                  </div>
                ) : null}
              </div>

              {dashboardClasses.length > 4 ? (
                <button
                  type="button"
                  onClick={() => navigate("elimu/classes")}
                  className="mt-4 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  View all {dashboardClasses.length} classes
                </button>
              ) : null}
            </div>

            {/* FEES */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <WalletCards
                  size={19}
                  className="text-emerald-600"
                />
                School fees
              </div>

              <div className="mt-5 text-3xl font-bold text-slate-900 dark:text-white">
                {formatCount(feeCount)}
              </div>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Fee records returned by the API
              </p>

              <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-600 dark:text-slate-300">
                    Pending or unpaid
                  </span>

                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {formatCount(pendingFeeNumber)}
                  </span>
                </div>

                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"
                  role="progressbar"
                  aria-label="Proportion of pending school fee records"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(pendingFeePercentage)}
                >
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all"
                    style={{
                      width: `${pendingFeePercentage}%`,
                    }}
                  />
                </div>

                {feeTotal === 0 ? (
                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    No fee records are available to calculate a pending rate.
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => navigate("elimu/fees")}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                Manage fees
                <ChevronRight size={16} />
              </button>
            </div>
          </section>

          {/* QUICK ACTIONS */}

          <section>
            <SectionHeading
              title="Education administration"
              description="Open the existing Elimu modules connected to this workspace."
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <QuickAction
                icon={School}
                title="School profile"
                description="View school information"
                onClick={() => navigate("elimu/school")}
              />

              <QuickAction
                icon={BookOpen}
                title="Lessons"
                description="Manage learning resources"
                onClick={() => navigate("elimu/lessons")}
              />

              <QuickAction
                icon={ClipboardList}
                title="Assignments"
                description="Manage learning tasks"
                onClick={() => navigate("elimu/assignments")}
              />

              <QuickAction
                icon={GraduationCap}
                title="CBC projects"
                description="Manage curriculum projects"
                onClick={() => navigate("elimu/cbc")}
              />
            </div>
          </section>

          {/* RECENT ASSIGNMENTS */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <SectionHeading
              title="Recent assignments"
              description="A quick overview of current learning tasks."
              actionLabel="View all assignments"
              onAction={() => navigate("elimu/assignments")}
            />

            {dashboardAssignments.length === 0 ? (
              <div className="mt-5">
                <EmptyState
                  icon={ClipboardList}
                  title="No assignments available"
                  description="Assignments will appear here after they have been created and returned by the Elimu API."
                  actionLabel="Open assignments"
                  onAction={() => navigate("elimu/assignments")}
                />
              </div>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {dashboardAssignments.slice(0, 6).map(
                  (assignment, index) => (
                    <div
                      key={
                        assignment.id ||
                        assignment._id ||
                        index
                      }
                      className="rounded-xl border border-slate-100 p-4 dark:border-white/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="break-words text-sm font-semibold text-slate-900 dark:text-white">
                            {assignment.title || "Assignment"}
                          </h4>

                          <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">
                            {assignment.subject ||
                              assignment.class_name ||
                              assignment.class_id ||
                              "Learning task"}
                          </p>
                        </div>

                        <CalendarDays
                          size={16}
                          aria-hidden="true"
                          className="shrink-0 text-slate-400"
                        />
                      </div>

                      {assignment.due_date ? (
                        <p className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          Due{" "}
                          {String(assignment.due_date).slice(0, 10)}
                        </p>
                      ) : null}

                      {assignment.status ? (
                        <span className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                          {String(assignment.status).replace(
                            /_/g,
                            " ",
                          )}
                        </span>
                      ) : null}
                    </div>
                  ),
                )}
              </div>
            )}
          </section>

          {/* LESSONS SUMMARY */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <SectionHeading
              title="Learning resources"
              description="Lesson activity reported by the Elimu service."
              actionLabel="Open lessons"
              onAction={() => navigate("elimu/lessons")}
            />

            <div className="mt-4 flex flex-col gap-4 rounded-xl bg-slate-50 p-4 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                  <BookOpen size={21} />
                </div>

                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatCount(lessonCount)} lesson record(s)
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Total currently available in this workspace
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("elimu/lessons")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                Manage lessons
                <ChevronRight size={16} />
              </button>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}