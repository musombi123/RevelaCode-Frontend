import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, GraduationCap, Loader, RefreshCw } from "lucide-react";
import { useElimuApi } from "@/services/elimuApi.jsx";
import ElimuDashboardWorkspace from "@/Dashboard/ElimuDashboardWorkspace.jsx";
import ElimuAccessDenied from "@/Dashboard/elimu/components/ElimuAccessDenied.jsx";

export default function ElimuDashboard({ onNavigate, currentPath = "elimu" }) {
  const {
    getElimuAccess,
    getElimuDashboard,
  } = useJumuiyaApi();

  const [access, setAccess] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(
    async ({ refresh = false } = {}) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        if (typeof getElimuAccess !== "function") {
          throw new Error(
            "The Elimu access service is not available. Check src/services/jumuiyaApi.jsx."
          );
        }

        const accessResponse = await getElimuAccess();
        const accessData =
          accessResponse?.data ??
          accessResponse?.access ??
          accessResponse;

        setAccess(accessData);

        if (!accessData?.allowed) {
          setDashboard(null);
          return;
        }

        const dashboardResponse =
          typeof getElimuDashboard === "function"
            ? await getElimuDashboard()
            : null;

        const dashboardData =
          dashboardResponse?.data ??
          dashboardResponse?.dashboard ??
          dashboardResponse;

        setDashboard(dashboardData);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load the Elimu workspace. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getElimuAccess, getElimuDashboard]
  );

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        if (typeof getElimuAccess !== "function") {
          throw new Error(
            "The Elimu access service is not available. Check src/services/jumuiyaApi.jsx."
          );
        }

        const accessResponse = await getElimuAccess();
        if (!active) return;

        const accessData =
          accessResponse?.data ??
          accessResponse?.access ??
          accessResponse;

        setAccess(accessData);

        if (!accessData?.allowed) {
          setDashboard(null);
          return;
        }

        const dashboardResponse =
          typeof getElimuDashboard === "function"
            ? await getElimuDashboard()
            : null;

        if (!active) return;

        setDashboard(
          dashboardResponse?.data ??
            dashboardResponse?.dashboard ??
            dashboardResponse
        );
      } catch (err) {
        if (!active) return;

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load the Elimu workspace. Please try again."
        );
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [getElimuAccess, getElimuDashboard]);

  const handleRefresh = useCallback(() => {
    return loadDashboard({ refresh: true });
  }, [loadDashboard]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <GraduationCap size={28} />
          </span>
          <Loader
            size={24}
            className="mt-6 animate-spin text-blue-600"
          />
          <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Preparing your school workspace
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Checking school access and loading your dashboard.
          </p>
        </div>
      </main>
    );
  }

  if (error && !access) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
        <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle size={24} />
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
            Unable to open Elimu
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {error}
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Try again
          </button>
        </section>
      </main>
    );
  }

  if (!access?.allowed) {
    return (
      <ElimuAccessDenied
        access={access}
        reason={access?.reason}
        message={access?.message}
        refreshing={refreshing}
        onRetry={handleRefresh}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="min-h-full">
      {error && (
        <div
          role="alert"
          className="mx-4 mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 sm:mx-6"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">{error}</div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="shrink-0 font-semibold underline underline-offset-2 disabled:opacity-60"
          >
            Retry
          </button>
        </div>
      )}

      <ElimuDashboardWorkspace
        access={access}
        dashboard={dashboard}
        onNavigate={onNavigate}
        currentPath={currentPath}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
    </div>
  );
}
