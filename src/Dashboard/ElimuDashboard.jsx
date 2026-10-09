// src/Dashboard/ElimuDashboard.jsx

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import ElimuSchoolAccess from "@/Dashboard/ElimuSchoolAccess.jsx";
import ElimuDashboardWorkspace from "@/Dashboard/ElimuDashboardWorkspace.jsx";

// =========================================================
// ERROR HELPERS
// =========================================================

function getErrorMessage(error, fallback) {
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return (
    error?.message ||
    error?.error?.message ||
    fallback
  );
}

function isNetworkError(error) {
  return /failed to fetch|networkerror|network request failed|load failed|fetch failed/i.test(
    String(error?.message || error || ""),
  );
}

// =========================================================
// ELIMU ACCESS CONTROLLER
// =========================================================

export default function ElimuDashboard({ onNavigate }) {
  const {
    getElimuAccess,
    getSchool,
    saveSchool,
    createElimuDemoSchool,
  } = useJumuiyaApi();

  // -------------------------------------------------------
  // STATE
  // -------------------------------------------------------

  const [access, setAccess] = useState(null);
  const [school, setSchool] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Ignore outdated requests and prevent state updates after unmount.
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  // =======================================================
  // LOAD ACCESS AND SCHOOL STATUS
  // =======================================================

  const loadAccess = useCallback(
    async ({ keepFeedback = false } = {}) => {
      const requestId = ++requestIdRef.current;

      setLoading(true);
      setError("");

      if (!keepFeedback) {
        setActionError("");
        setSuccessMessage("");
      }

      try {
        if (typeof getElimuAccess !== "function") {
          throw new Error(
            "getElimuAccess is missing from useJumuiyaApi(). Check the Elimu API methods returned by src/services/jumuiyaApi.jsx.",
          );
        }

        const accessResult = await getElimuAccess();

        if (
          !accessResult ||
          typeof accessResult.allowed !== "boolean"
        ) {
          throw new Error(
            "The Elimu access endpoint returned an invalid response. Expected a boolean 'allowed' field.",
          );
        }

        // Access is authoritative. A secondary school lookup may fail
        // for a new account, so it must not invalidate valid access data.
        let schoolResult = null;

        if (typeof getSchool === "function") {
          try {
            schoolResult = await getSchool();
          } catch {
            schoolResult = null;
          }
        }

        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        setAccess(accessResult);

        setSchool(
          schoolResult ||
            accessResult.school ||
            null,
        );
      } catch (requestError) {
        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        setAccess(null);
        setSchool(null);

        setError(
          getErrorMessage(
            requestError,
            "Unable to check your Elimu school account.",
          ),
        );
      } finally {
        if (
          mountedRef.current &&
          requestId === requestIdRef.current
        ) {
          setLoading(false);
        }
      }
    },
    [getElimuAccess, getSchool],
  );

  // =======================================================
  // INITIAL ACCESS CHECK
  // =======================================================

  useEffect(() => {
    mountedRef.current = true;

    void loadAccess();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [loadAccess]);

  // =======================================================
  // SUBMIT REAL SCHOOL APPLICATION
  // =======================================================

  const submitApplication = useCallback(
    async (payload) => {
      setSaving(true);
      setActionError("");
      setSuccessMessage("");

      try {
        if (typeof saveSchool !== "function") {
          throw new Error(
            "School registration is not connected. saveSchool is missing from useJumuiyaApi().",
          );
        }

        await saveSchool(payload);

        if (!mountedRef.current) {
          return;
        }

        setSuccessMessage(
          "Your school application was submitted. Access remains restricted until the backend confirms verification.",
        );

        // Preserve the successful submission message while refreshing
        // the status from the authoritative access endpoint.
        await loadAccess({ keepFeedback: true });
      } catch (requestError) {
        if (mountedRef.current) {
          setActionError(
            getErrorMessage(
              requestError,
              "The school application could not be submitted.",
            ),
          );
        }
      } finally {
        if (mountedRef.current) {
          setSaving(false);
        }
      }
    },
    [saveSchool, loadAccess],
  );

  // =======================================================
  // CREATE DEVELOPMENT DEMO
  // =======================================================

  const createDemo = useCallback(
    async (payload) => {
      setSaving(true);
      setActionError("");
      setSuccessMessage("");

      try {
        if (typeof createElimuDemoSchool !== "function") {
          throw new Error(
            "Demo creation is not connected. createElimuDemoSchool is missing from useJumuiyaApi().",
          );
        }

        await createElimuDemoSchool(payload);

        if (!mountedRef.current) {
          return;
        }

        setSuccessMessage(
          "Development demo created. This workspace is not a verified school.",
        );

        await loadAccess({ keepFeedback: true });
      } catch (requestError) {
        if (mountedRef.current) {
          setActionError(
            getErrorMessage(
              requestError,
              "The development demo could not be created.",
            ),
          );
        }
      } finally {
        if (mountedRef.current) {
          setSaving(false);
        }
      }
    },
    [createElimuDemoSchool, loadAccess],
  );

  // =======================================================
  // LOADING STATE
  // =======================================================

  if (loading && !access) {
    return (
      <div className="min-h-72 px-4 py-8 sm:px-6 lg:px-8">
        <div
          className="mx-auto flex min-h-64 max-w-xl flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center dark:border-white/10 dark:bg-slate-900"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Loader2 size={27} className="animate-spin" />
          </div>

          <h2 className="mt-4 font-semibold text-slate-900 dark:text-white">
            Checking your Elimu account
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            Verifying your account access and retrieving your school status.
          </p>
        </div>
      </div>
    );
  }

  // =======================================================
  // NETWORK OR ACCESS ERROR
  // =======================================================

  if (error && !access) {
    const networkFailure = isNetworkError(error);

    return (
      <div className="min-h-72 px-4 py-8 sm:px-6 lg:px-8">
        <section
          role="alert"
          className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-white p-5 shadow-sm dark:border-red-900/40 dark:bg-slate-900 sm:p-7"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle size={25} />
          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
            Unable to check Elimu access
          </h2>

          <p className="mt-2 break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
            {error}
          </p>

          {networkFailure ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
              <h3 className="font-semibold text-amber-950 dark:text-amber-100">
                Backend connection required
              </h3>

              <p className="mt-2 text-sm leading-6 text-amber-900 dark:text-amber-100">
                The browser could not complete the access request. Check
                the configured backend URL, backend availability, and
                whether the backend CORS configuration allows this
                frontend origin.
              </p>

              <p className="mt-2 text-xs leading-5 text-amber-900/80 dark:text-amber-100/80">
                Expected access endpoint:
              </p>

              <code className="mt-1 block break-all rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-800 dark:bg-black/20 dark:text-slate-200">
                /api/jumuiya/elimu/access
              </code>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void loadAccess()}
            disabled={loading}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}

            {loading ? "Checking..." : "Retry access check"}
          </button>
        </section>
      </div>
    );
  }

  // =======================================================
  // AUTHORITATIVE ACCESS GATE
  // =======================================================

  if (access?.allowed === true) {
    return (
      <ElimuDashboardWorkspace
        onNavigate={onNavigate}
        accountAccess={access}
        accountSchool={school || access.school || null}
      />
    );
  }

  // =======================================================
  // SCHOOL REGISTRATION AND VERIFICATION
  // =======================================================

  return (
    <ElimuSchoolAccess
      access={access}
      school={school || access?.school || null}
      loading={loading}
      error={error}
      actionError={actionError}
      successMessage={successMessage}
      saving={saving}
      onRetry={loadAccess}
      onSubmitApplication={submitApplication}
      onCreateDemo={createDemo}
      allowDemo={
        import.meta.env.DEV ||
        import.meta.env.VITE_ELIMU_ENABLE_DEMO === "true"
      }
    />
  );
}