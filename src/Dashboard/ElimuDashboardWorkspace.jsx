import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  School,
  WalletCards,
} from "lucide-react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import { ElimuAccountPlanBanner } from "@/Dashboard/ElimuSchoolAccess.jsx";

const asList = (value, key) => {
  if (Array.isArray(value)) return value;
  if (key && Array.isArray(value?.[key])) return value[key];
  return [];
};

// =========================================================
// METRIC CARD
// =========================================================

function MetricCard({ icon: Icon, label, value, helper }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
          <Icon size={20} />
        </div>

        <ArrowUpRight size={17} className="text-slate-300" />
      </div>

      <div className="mt-5">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="mt-1 text-sm font-medium">{label}</div>
        <div className="mt-1 text-xs text-slate-400">{helper}</div>
      </div>
    </div>
  );
}

// =========================================================
// QUICK ACTION
// =========================================================

function QuickAction({ icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-slate-900"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
          <Icon size={18} />
        </div>

        <div className="min-w-0">
          <div className="font-semibold">{title}</div>
          <div className="mt-1 truncate text-xs text-slate-400">
            {description}
          </div>
        </div>
      </div>

      <ChevronRight size={17} className="shrink-0 text-slate-400" />
    </button>
  );
}

// =========================================================
// ELIMU DASHBOARD WORKSPACE
// No JumuiyaDashboardShell wrapper
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

  // =======================================================
  // LOAD EDUCATION DATA
  // =======================================================

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const results = await Promise.all([
          getElimuDashboard().catch(() => null),
          getEducationProfile().catch(() => null),
          getSchool().catch(() => null),
          getClasses().catch(() => []),
          getLessons().catch(() => []),
          getAssignments().catch(() => []),
          getFees().catch(() => []),
          getCBCProjects().catch(() => []),
        ]);

        if (!active) return;

        const [
          dashboardResult,
          profileResult,
          schoolResult,
          classesResult,
          lessonsResult,
          assignmentsResult,
          feesResult,
          projectsResult,
        ] = results;

        setDashboard(dashboardResult || null);
        setProfile(profileResult || null);

        setSchool(
          schoolResult ||
            dashboardResult?.school ||
            accountSchool ||
            null,
        );

        setClasses(asList(classesResult, "classes"));
        setLessons(asList(lessonsResult, "lessons"));
        setAssignments(asList(assignmentsResult, "assignments"));
        setFees(asList(feesResult, "fees"));
        setProjects(asList(projectsResult, "projects"));

        const hasDashboardResponse =
          dashboardResult !== null ||
          profileResult !== null ||
          schoolResult !== null;

        if (!hasDashboardResponse) {
          setError(
            "Elimu data is currently unavailable. Please retry in a moment.",
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err?.message ||
              "Unable to load the Elimu dashboard.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
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

  // =======================================================
  // DASHBOARD DATA AND METRICS
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
      ["pending", "unpaid"].includes(
        String(fee?.status || "").toLowerCase(),
      ),
    ).length;

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="space-y-6">
      {/* SCHOOL ACCOUNT / TESTING PLAN BANNER */}

      <ElimuAccountPlanBanner
        access={accountAccess}
        school={accountSchool || schoolData}
      />

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="overflow-hidden rounded-3xl bg-slate-950 px-5 py-7 text-white shadow-xl sm:px-7 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
              <GraduationCap size={14} />
              Education workspace
            </div>

            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {schoolData?.name ||
                profileData?.full_name ||
                profileData?.fullName ||
                "Your education hub"}
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Manage learning activities, classes, assignments,
              school information, fees and CBC projects from one
              workspace.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              {profileData?.profile_type && (
                <span className="rounded-full bg-white/10 px-3 py-1.5">
                  {profileData.profile_type}
                </span>
              )}

              {schoolData?.county && (
                <span className="rounded-full bg-white/10 px-3 py-1.5">
                  {schoolData.county}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate?.("elimu/classes")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Open learning
            <ChevronRight size={17} />
          </button>
        </div>
      </section>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
      )}

      {/* =====================================================
          ERROR
      ===================================================== */}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          <div className="font-semibold">
            Elimu could not be loaded completely
          </div>

          <div className="mt-1">{error}</div>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/30"
          >
            Retry
          </button>
        </div>
      )}

      {/* =====================================================
          MAIN DASHBOARD
      ===================================================== */}

      {!loading && (
        <>
          {/* METRICS */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={School}
              label="Classes"
              value={classCount}
              helper="Tracked classes"
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
              helper="Student projects"
            />
          </section>

          {/* =================================================
              LEARNING ACTIVITY + FEES
          ================================================= */}

          <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
            {/* LEARNING ACTIVITY */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    Learning activity
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Your current education workspace.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate?.("elimu/lessons")}
                  className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  View lessons
                </button>
              </div>

              {/* CLASSES */}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {dashboardClasses.slice(0, 4).map((item, index) => {
                  const itemId = item.id || item._id || "";

                  return (
                    <button
                      type="button"
                      key={itemId || index}
                      onClick={() =>
                        onNavigate?.(
                          itemId
                            ? `elimu/classes/${itemId}`
                            : "elimu/classes",
                        )
                      }
                      className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                          <School size={17} />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {item.name ||
                              item.class_name ||
                              item.title ||
                              "Class"}
                          </div>

                          <div className="mt-0.5 text-xs text-slate-400">
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

                {dashboardClasses.length === 0 && (
                  <div className="col-span-full rounded-xl border border-dashed border-slate-200 p-6 text-center dark:border-white/10">
                    <School
                      size={28}
                      className="mx-auto text-emerald-500"
                    />

                    <div className="mt-3 font-semibold">
                      No classes yet
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      Create or connect a class to begin managing
                      learning.
                    </p>

                    <button
                      type="button"
                      onClick={() => onNavigate?.("elimu/classes")}
                      className="mt-3 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                    >
                      Open classes
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* FEES */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="flex items-center gap-2 font-semibold">
                <WalletCards
                  size={19}
                  className="text-emerald-600"
                />
                Fees
              </div>

              <div className="mt-5 text-3xl font-bold">
                {feeCount}
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Fee records
              </p>

              <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                <div className="flex items-center justify-between text-sm">
                  <span>Pending</span>
                  <span className="font-semibold text-orange-600">
                    {pendingFees}
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{
                      width:
                        feeCount > 0
                          ? `${Math.min(
                              100,
                              (pendingFees / feeCount) * 100,
                            )}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate?.("elimu/fees")}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium dark:border-white/10"
              >
                Manage fees
                <ChevronRight size={16} />
              </button>
            </div>
          </section>

          {/* =================================================
              EDUCATION ACTIONS
          ================================================= */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <QuickAction
              icon={School}
              title="School"
              description="Manage school information"
              onClick={() => onNavigate?.("elimu/school")}
            />

            <QuickAction
              icon={BookOpen}
              title="Lessons"
              description="Create and manage lessons"
              onClick={() => onNavigate?.("elimu/lessons")}
            />

            <QuickAction
              icon={ClipboardList}
              title="Assignments"
              description="Track learning tasks"
              onClick={() => onNavigate?.("elimu/assignments")}
            />

            <QuickAction
              icon={GraduationCap}
              title="CBC Projects"
              description="Manage student projects"
              onClick={() => onNavigate?.("elimu/cbc")}
            />
          </section>

          {/* =================================================
              RECENT ASSIGNMENTS
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">
                  Recent assignments
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Keep upcoming learning work visible.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate?.("elimu/assignments")}
                className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
              >
                View all
              </button>
            </div>

            {dashboardAssignments.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-6 text-center dark:border-white/10">
                <ClipboardList
                  size={28}
                  className="mx-auto text-slate-400"
                />

                <div className="mt-3 text-sm font-semibold">
                  No assignments yet
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Assignments will appear here as your education
                  workspace grows.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {dashboardAssignments.slice(0, 6).map((assignment, index) => (
                  <div
                    key={assignment.id || assignment._id || index}
                    className="rounded-xl border border-slate-100 p-4 dark:border-white/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {assignment.title || "Assignment"}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {assignment.subject ||
                            assignment.class_name ||
                            "Learning task"}
                        </div>
                      </div>

                      <CalendarDays
                        size={16}
                        className="shrink-0 text-slate-400"
                      />
                    </div>

                    {assignment.due_date && (
                      <div className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        Due {String(assignment.due_date).slice(0, 10)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}