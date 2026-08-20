"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BookOpen,
  GraduationCap,
  Heart,
  Activity,
  RefreshCw,
  ShieldCheck,
  Server,
  AlertCircle,
  CheckCircle2,
  BarChart3,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

export default function AdminOverview() {
  const [dashboard, setDashboard] = useState({
    message: "",
  });

  const [stats, setStats] = useState({
    total_materials: 0,
    faith_materials: 0,
    education_materials: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  const loadDashboard = useCallback(
    async ({ silent = false } = {}) => {
      if (!API) {
        setError(
          "API URL is not configured. Check VITE_API_URL."
        );
        setLoading(false);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        /*
         * IMPORTANT:
         * Do NOT send a hardcoded admin API key from the browser.
         *
         * Replace this with your authenticated admin mechanism,
         * for example:
         *
         * Authorization: `Bearer ${adminToken}`
         *
         * where adminToken comes from your AuthContext/session.
         */

        const headers = {
          Accept: "application/json",
        };

        const [dashboardRes, statsRes] =
          await Promise.all([
            fetch(`${API}/api/admin/dashboard`, {
              headers,
              credentials: "include",
            }),

            fetch(`${API}/api/admin/study/stats`, {
              headers,
              credentials: "include",
            }),
          ]);

        const dashboardData =
          await dashboardRes
            .json()
            .catch(() => ({}));

        const statsData =
          await statsRes
            .json()
            .catch(() => ({}));

        if (!dashboardRes.ok) {
          throw new Error(
            dashboardData?.message ||
              "Unable to load admin dashboard."
          );
        }

        if (!statsRes.ok) {
          throw new Error(
            statsData?.message ||
              "Unable to load study statistics."
          );
        }

        setDashboard(
          dashboardData || {
            message: "",
          }
        );

        setStats({
          total_materials:
            Number(statsData?.total_materials) || 0,

          faith_materials:
            Number(statsData?.faith_materials) || 0,

          education_materials:
            Number(
              statsData?.education_materials
            ) || 0,
        });
      } catch (err) {
        console.error(
          "Admin dashboard error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* =========================================================
     DERIVED STATS
  ========================================================= */

  const distribution = useMemo(() => {
    const total =
      Number(stats.total_materials) || 0;

    const faith =
      Number(stats.faith_materials) || 0;

    const education =
      Number(stats.education_materials) || 0;

    return {
      faithPercent:
        total > 0
          ? Math.round((faith / total) * 100)
          : 0,

      educationPercent:
        total > 0
          ? Math.round(
              (education / total) * 100
            )
          : 0,
    };
  }, [stats]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>

        <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              System Online
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Dashboard Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor platform content, study resources, and
            system health.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadDashboard({
              silent: true,
            })
          }
          disabled={refreshing}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing
                ? "animate-spin"
                : ""
            }`}
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/20">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />

          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              Dashboard error
            </p>

            <p className="mt-1 text-xs leading-5 text-red-600/80 dark:text-red-400/80">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Total Materials"
          value={stats.total_materials}
          description="All study materials"
          iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
        />

        <StatCard
          icon={Heart}
          label="Faith Materials"
          value={stats.faith_materials}
          description={`${distribution.faithPercent}% of total`}
          iconClass="bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
        />

        <StatCard
          icon={GraduationCap}
          label="Education Materials"
          value={stats.education_materials}
          description={`${distribution.educationPercent}% of total`}
          iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400"
        />

        <StatCard
          icon={Activity}
          label="System Status"
          value="Online"
          description="Core services responding"
          iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
          valueClass="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* =====================================================
          CONTENT ANALYTICS
      ===================================================== */}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Distribution */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <BarChart3 className="h-5 w-5 text-slate-500 dark:text-slate-300" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Content Distribution
                </h3>

                <p className="mt-0.5 text-xs text-slate-400">
                  Current study material breakdown.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            <DistributionRow
              label="Faith"
              value={stats.faith_materials}
              percentage={
                distribution.faithPercent
              }
              className="bg-rose-500"
            />

            <DistributionRow
              label="Education"
              value={stats.education_materials}
              percentage={
                distribution.educationPercent
              }
              className="bg-violet-500"
            />

            <DistributionRow
              label="Other"
              value={Math.max(
                0,
                stats.total_materials -
                  stats.faith_materials -
                  stats.education_materials
              )}
              percentage={Math.max(
                0,
                100 -
                  distribution.faithPercent -
                  distribution.educationPercent
              )}
              className="bg-slate-400"
            />
          </div>
        </section>

        {/* System Health */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                <Server className="h-5 w-5 text-emerald-500" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  System Health
                </h3>

                <p className="mt-0.5 text-xs text-slate-400">
                  Current service availability.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-5">
            <HealthRow
              label="Admin API"
              status="Operational"
            />

            <HealthRow
              label="Study API"
              status="Operational"
            />

            <HealthRow
              label="Database"
              status="Operational"
            />
          </div>
        </section>
      </div>

      {/* =====================================================
          ADMIN MESSAGE
      ===================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Admin Message
              </h3>

              <p className="mt-0.5 text-xs text-slate-400">
                System-wide administrative information.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />

              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                {dashboard.message ||
                  "Welcome to the RevelaCode Admin Console."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
  valueClass = "",
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p
          className={`mt-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white ${valueClass}`}
        >
          {value}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   DISTRIBUTION ROW
========================================================= */

function DistributionRow({
  label,
  value,
  percentage,
  className,
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {label}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {value}
          </p>

          <p className="text-[10px] text-slate-400">
            {percentage}%
          </p>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${className}`}
          style={{
            width: `${Math.min(
              100,
              Math.max(0, percentage)
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   HEALTH ROW
========================================================= */

function HealthRow({
  label,
  status,
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex items-center gap-2.5">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />

        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </span>
      </div>

      <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-500">
        {status}
      </span>
    </div>
  );
}
