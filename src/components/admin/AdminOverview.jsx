"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertCircle,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Leaf,
  RefreshCw,
  Server,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";

import { useAdminApi } from "@/services/adminApi.jsx";

// =========================================================
// CONFIGURATION
// =========================================================

const OVERVIEW_ENDPOINT = "/api/jumuiya/admin/overview";

const INITIAL_STATS = {
  shamba_profiles: 0,
  biashara_profiles: 0,
  schools: 0,
  real_schools: 0,
  verified_schools: 0,
  pending_schools: 0,
  schools_needing_information: 0,
  rejected_schools: 0,
};

// =========================================================
// HELPERS
// =========================================================

function safeCount(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return Math.floor(number);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-KE").format(
    safeCount(value),
  );
}

function unwrapResponse(response) {
  return response?.data ?? response;
}

function normalizeOverview(payload) {
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw new Error(
      "The platform overview endpoint returned an invalid response.",
    );
  }

  const requiredFields = [
    "shamba_profiles",
    "biashara_profiles",
    "schools",
    "verified_schools",
    "pending_schools",
  ];

  const missingFields = requiredFields.filter(
    (field) =>
      !Object.prototype.hasOwnProperty.call(
        payload,
        field,
      ),
  );

  if (missingFields.length > 0) {
    throw new Error(
      `The platform overview response is missing: ${missingFields.join(", ")}. Check the deployed backend version.`,
    );
  }

  return {
    shamba_profiles: safeCount(payload.shamba_profiles),
    biashara_profiles: safeCount(payload.biashara_profiles),
    schools: safeCount(payload.schools),
    real_schools: safeCount(
      payload.real_schools ?? payload.schools,
    ),
    verified_schools: safeCount(
      payload.verified_schools,
    ),
    pending_schools: safeCount(
      payload.pending_schools,
    ),
    schools_needing_information: safeCount(
      payload.schools_needing_information,
    ),
    rejected_schools: safeCount(
      payload.rejected_schools,
    ),
  };
}

// =========================================================
// MAIN DASHBOARD
// =========================================================

export default function AdminOverview() {
  const adminApi = useAdminApi();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // =======================================================
  // LOAD REAL PLATFORM STATISTICS
  // =======================================================

  const loadDashboard = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        // adminApi uses the existing AuthContext authFetch.
        // Do not send or expose a privileged API key.
        const response = await adminApi.request(
          OVERVIEW_ENDPOINT,
          {
            method: "GET",
            credentials: "include",
          },
        );

        const payload = unwrapResponse(response);

        const normalized = normalizeOverview(payload);

        setOverview(normalized);
        setLastUpdated(new Date());
      } catch (err) {
        console.error(
          "Failed to load Jumuiya platform overview:",
          err,
        );

        setError(
          err?.message ||
            "Unable to load current platform statistics.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [adminApi],
  );

  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // =======================================================
  // DERIVED METRICS
  // =======================================================

  const stats = overview || INITIAL_STATS;

  const totalProfiles =
    stats.shamba_profiles +
    stats.biashara_profiles +
    stats.real_schools;

  const schoolDistribution = useMemo(() => {
    const verified = stats.verified_schools;
    const pending = stats.pending_schools;
    const needsInformation =
      stats.schools_needing_information;
    const rejected = stats.rejected_schools;

    const classifiedTotal =
      verified +
      pending +
      needsInformation +
      rejected;

    function percentage(value) {
      return classifiedTotal > 0
        ? Math.round(
            (value / classifiedTotal) * 100,
          )
        : 0;
    }

    return {
      verified,
      pending,
      needsInformation,
      rejected,
      classifiedTotal,
      verifiedPercent: percentage(verified),
      pendingPercent: percentage(pending),
      informationPercent: percentage(
        needsInformation,
      ),
      rejectedPercent: percentage(rejected),
    };
  }, [stats]);

  // =======================================================
  // LOADING
  // =======================================================

  if (loading && !overview) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>

        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />

        <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading live Jumuiya statistics...
        </div>
      </div>
    );
  }

  // =======================================================
  // DASHBOARD
  // =======================================================

  return (
    <div className="space-y-6">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                overview
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  overview
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                }`}
              />

              {overview
                ? "Live Data Loaded"
                : "Data Unavailable"}
            </span>

            <span className="text-[10px] font-medium text-slate-400">
              Jumuiya Platform Overview
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Platform Overview
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Monitor farmer profiles, business registrations,
            school accounts, and the school verification queue.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadDashboard({ silent: true })
          }
          disabled={refreshing}
          className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />

          {refreshing ? "Refreshing..." : "Refresh data"}
        </button>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 dark:border-red-900/50 dark:bg-red-950/20"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-red-800 dark:text-red-300">
              Unable to refresh platform data
            </p>

            <p className="mt-1 break-words text-xs leading-5 text-red-700 dark:text-red-400">
              {error}
            </p>

            <p className="mt-2 text-xs leading-5 text-red-600/80 dark:text-red-400/80">
              The dashboard will not invent replacement
              statistics. Check that the backend has the
              Jumuiya admin overview route registered and
              that your account has a permitted platform-admin
              role.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadDashboard()}
            className="shrink-0 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/40"
          >
            Retry
          </button>
        </div>
      )}

      {/* ===================================================
          KPI CARDS
      =================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Leaf}
          label="Shamba Profiles"
          value={
            overview
              ? formatNumber(stats.shamba_profiles)
              : "—"
          }
          description="Registered farmer profiles"
          iconClass="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
        />

        <StatCard
          icon={Store}
          label="Biashara Businesses"
          value={
            overview
              ? formatNumber(stats.biashara_profiles)
              : "—"
          }
          description="Registered business profiles"
          iconClass="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
        />

        <StatCard
          icon={GraduationCap}
          label="Real Schools"
          value={
            overview
              ? formatNumber(stats.real_schools)
              : "—"
          }
          description={
            overview
              ? `${formatNumber(stats.schools)} total records, including demo schools`
              : "Awaiting data"
          }
          iconClass="bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
        />

        <StatCard
          icon={ClipboardCheck}
          label="Pending Verification"
          value={
            overview
              ? formatNumber(stats.pending_schools)
              : "—"
          }
          description="School applications awaiting review"
          iconClass="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
        />
      </div>

      {/* ===================================================
          HUB DISTRIBUTION
      =================================================== */}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <BarChart3 className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Jumuiya Hub Profiles
                </h3>

                <p className="mt-0.5 text-xs text-slate-400">
                  Distribution of current profile records.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            <DistributionRow
              label="Shamba"
              value={stats.shamba_profiles}
              total={totalProfiles}
              percentage={
                totalProfiles
                  ? (stats.shamba_profiles / totalProfiles) * 100
                  : 0
              }
              className="bg-emerald-500"
            />

            <DistributionRow
              label="Biashara"
              value={stats.biashara_profiles}
              total={totalProfiles}
              percentage={
                totalProfiles
                  ? (stats.biashara_profiles / totalProfiles) * 100
                  : 0
              }
              className="bg-blue-500"
            />

            <DistributionRow
              label="Elimu"
              value={stats.real_schools}
              total={totalProfiles}
              percentage={
                totalProfiles
                  ? (stats.real_schools / totalProfiles) * 100
                  : 0
              }
              className="bg-violet-500"
            />

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total profiles
                </p>

                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                  {overview ? formatNumber(totalProfiles) : "—"}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <Users className="h-5 w-5 text-slate-500 dark:text-slate-300" />
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            SCHOOL VERIFICATION
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  School Verification
                </h3>

                <p className="mt-0.5 text-xs text-slate-400">
                  Current application status counts.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1 p-4">
            <VerificationRow
              label="Verified"
              value={stats.verified_schools}
              icon={CheckCircle2}
              className="text-emerald-600 dark:text-emerald-400"
            />

            <VerificationRow
              label="Pending review"
              value={stats.pending_schools}
              icon={ClipboardCheck}
              className="text-amber-600 dark:text-amber-400"
            />

            <VerificationRow
              label="Needs information"
              value={stats.schools_needing_information}
              icon={AlertCircle}
              className="text-orange-600 dark:text-orange-400"
            />

            <VerificationRow
              label="Rejected"
              value={stats.rejected_schools}
              icon={Activity}
              className="text-red-600 dark:text-red-400"
            />
          </div>

          <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-800">
            <p className="text-[11px] leading-5 text-slate-400">
              Counts are provided by the backend. The
              verification queue may include legacy records
              with no explicit verification status.
            </p>
          </div>
        </section>
      </div>

      {/* ===================================================
          DATA SOURCE / REFRESH STATUS
      =================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                overview
                  ? "bg-emerald-50 dark:bg-emerald-950/30"
                  : "bg-slate-100 dark:bg-slate-800"
              }`}
            >
              <Server
                className={`h-5 w-5 ${
                  overview
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400"
                }`}
              />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Platform data connection
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Source: Jumuiya Platform Admin API
              </p>

              <p className="mt-1 break-all font-mono text-[10px] text-slate-400">
                {OVERVIEW_ENDPOINT}
              </p>
            </div>
          </div>

          <div className="sm:text-right">
            <p
              className={`text-xs font-bold ${
                overview
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {overview
                ? "Statistics loaded successfully"
                : "No verified statistics available"}
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
              {lastUpdated
                ? `Last successful refresh: ${lastUpdated.toLocaleString()}`
                : "Waiting for the first successful response"}
            </p>

            {refreshing && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 sm:justify-end">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Updating data...
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// =========================================================
// STAT CARD
// =========================================================

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
}) {
  return (
    <div className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          {value}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

// =========================================================
// DISTRIBUTION ROW
// =========================================================

function DistributionRow({
  label,
  value,
  percentage,
  className,
}) {
  const boundedPercentage = Math.min(
    100,
    Math.max(0, Number(percentage) || 0),
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {label}
        </p>

        <p className="text-sm font-bold tabular-nums text-slate-800 dark:text-slate-200">
          {formatNumber(value)}
          <span className="ml-2 text-[10px] font-medium text-slate-400">
            {Math.round(boundedPercentage)}%
          </span>
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${className}`}
          style={{
            width: `${boundedPercentage}%`,
          }}
        />
      </div>
    </div>
  );
}

// =========================================================
// VERIFICATION ROW
// =========================================================

function VerificationRow({
  label,
  value,
  icon: Icon,
  className,
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon className={`h-4 w-4 shrink-0 ${className}`} />

        <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </span>
      </div>

      <span className="shrink-0 text-sm font-black tabular-nums text-slate-900 dark:text-white">
        {formatNumber(value)}
      </span>
    </div>
  );
}