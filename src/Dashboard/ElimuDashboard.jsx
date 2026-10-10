
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  GraduationCap,
  Loader,
  RefreshCw,
} from "lucide-react";

import { useElimuApi } from "@/services/elimuApi.jsx";
import ElimuDashboardWorkspace from "@/Dashboard/ElimuDashboardWorkspace.jsx";
import ElimuAccessDenied from "@/Dashboard/elimu/components/ElimuAccessDenied.jsx";

function getApiPayload(response, preferredKey) {
  let current = response;

  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return current;
    }

    if (current.success === false || current.ok === false) {
      throw new Error(
        current.message ||
          current.error ||
          "The Elimu service returned an unsuccessful response."
      );
    }

    if (
      preferredKey &&
      Object.prototype.hasOwnProperty.call(current, preferredKey)
    ) {
      current = current[preferredKey];
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(current, "data")) {
      current = current.data;
      continue;
    }

    return current;
  }

  return current;
}

function getErrorMessage(error, fallback) {
  return (
    error?.payload?.message ||
    error?.payload?.error ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function LoadingScreen() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
          <GraduationCap size={28} />
        </span>

        <Loader
          size={24}
          className="mt-6 animate-spin text-blue-600"
          aria-label="Loading"
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

function LoadErrorScreen({ error, refreshing, onRetry }) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <section
        role="alert"
        className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle size={24} />
        </span>

        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
          Unable to open Elimu
        </h1>

        <p className="mt-2 break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
          {error}
        </p>

        <button
          type="button"
          onClick={onRetry}
          disabled={refreshing}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          {refreshing ? "Retrying…" : "Try again"}
        </button>
      </section>
    </main>
  );
}

export default function ElimuDashboard({
  onNavigate,
  currentPath = "elimu",
}) {
  const api = useElimuApi();

  // These method names match src/services/elimuApi.jsx.
  // GET /api/jumuiya/elimu/access
  // GET /api/jumuiya/elimu/dashboard
  const { getAccess, getDashboard } = api;

  const [access, setAccess] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const controllerRef = useRef(null);

  const loadDashboard = useCallback(
    async ({ refresh = false } = {}) => {
      // Cancel any older load or refresh before starting another request.
      controllerRef.current?.abort();

      const controller = new AbortController();
      controllerRef.current = controller;

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      let accessResolved = null;

      try {
        if (typeof getAccess !== "function") {
          throw new Error(
            "getAccess() is missing from src/services/elimuApi.jsx."
          );
        }

        if (typeof getDashboard !== "function") {
          throw new Error(
            "getDashboard() is missing from src/services/elimuApi.jsx."
          );
        }

        // Step 1: check school access before requesting the dashboard.
        const accessResponse = await getAccess({
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        accessResolved = getApiPayload(accessResponse, "access");

        if (
          !accessResolved ||
          typeof accessResolved !== "object" ||
          Array.isArray(accessResolved)
        ) {
          throw new Error(
            "The access endpoint returned an invalid response. Expected an access object."
          );
        }

        setAccess(accessResolved);

        // Access is denied unless the server explicitly allows it.
        if (accessResolved.allowed !== true) {
          setDashboard(null);
          return;
        }

        // Step 2: only request the dashboard after access is allowed.
        const dashboardResponse = await getDashboard({
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const dashboardData = getApiPayload(
          dashboardResponse,
          "dashboard"
        );

        if (
          dashboardData === null ||
          dashboardData === undefined ||
          typeof dashboardData !== "object" ||
          Array.isArray(dashboardData)
        ) {
          throw new Error(
            "The dashboard endpoint returned an invalid response."
          );
        }

        setDashboard(dashboardData);
      } catch (requestError) {
        if (
          controller.signal.aborted ||
          requestError?.name === "AbortError"
        ) {
          return;
        }

        const status = requestError?.status;

        // An access failure should not accidentally leave an old dashboard
        // visible to an account that is no longer authorized.
        if (
          !accessResolved &&
          (status === 401 || status === 403)
        ) {
          setAccess({
            allowed: false,
            reason:
              status === 401
                ? "authentication_required"
                : "forbidden",
            message:
              getErrorMessage(
                requestError,
                "Your account does not currently have access to this school workspace."
              ),
          });
          setDashboard(null);
          setError("");
        } else {
          setError(
            getErrorMessage(
              requestError,
              "Unable to load the Elimu workspace. Please try again."
            )
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [getAccess, getDashboard]
  );

  useEffect(() => {
    loadDashboard();

    return () => {
      controllerRef.current?.abort();
    };
  }, [loadDashboard]);

  const handleRefresh = useCallback(() => {
    return loadDashboard({ refresh: true });
  }, [loadDashboard]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error && !access) {
    return (
      <LoadErrorScreen
        error={error}
        refreshing={refreshing}
        onRetry={handleRefresh}
      />
    );
  }

  if (!access || access.allowed !== true) {
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

          <div className="min-w-0 flex-1 break-words">
            <p className="font-semibold">
              Your school access is available, but the dashboard could not
              refresh.
            </p>
            <p className="mt-1">{error}</p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="shrink-0 font-semibold underline underline-offset-2 disabled:opacity-60"
          >
            {refreshing ? "Retrying…" : "Retry"}
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