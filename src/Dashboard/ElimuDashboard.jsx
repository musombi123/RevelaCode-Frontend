// src/Dashboard/ElimuDashboard.jsx

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  GraduationCap,
  Loader,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useElimuApi } from "@/services/elimuApi.jsx";

import ElimuDashboardWorkspace from "@/Dashboard/ElimuDashboardWorkspace.jsx";
import ElimuAccessDenied from "@/Dashboard/elimu/components/ElimuAccessDenied.jsx";
import ElimuSchoolAccess from "@/Dashboard/ElimuSchoolAccess.jsx";

// ============================================================
// RESPONSE HELPERS
// ============================================================

function getApiPayload(response, preferredKey) {
  let current = response;

  for (let depth = 0; depth < 6; depth += 1) {
    if (
      !current ||
      typeof current !== "object" ||
      Array.isArray(current)
    ) {
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

function hasSchoolRecord(access) {
  return Boolean(
    access?.has_school === true ||
      access?.school ||
      access?.school_id ||
      access?.schoolId ||
      access?.membership?.school_id ||
      access?.membership?.school
  );
}

// ============================================================
// LOADING / ERROR SCREENS
// ============================================================

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

// ============================================================
// SCHOOL REGISTRATION FORM
// Existing route: POST /api/jumuiya/elimu/school
// ============================================================

const INPUT_CLASS =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

const LABEL_CLASS =
  "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200";

function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  maxLength = 200,
  placeholder = "",
  className = "",
}) {
  return (
    <div className={className}>
      <label htmlFor={`elimu-${name}`} className={LABEL_CLASS}>
        {label}
      </label>

      <input
        id={`elimu-${name}`}
        name={name}
        type={type}
        required={required}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
    </div>
  );
}

function SchoolRegistrationForm({
  api,
  onBack,
  onSubmitted,
  refreshing,
}) {
  const [form, setForm] = useState({
    name: "",
    school_type: "primary",
    registration_number: "",
    principal_name: "",
    phone: "",
    email: "",
    county: "",
    town: "",
    location: "",
    registration_evidence_url: "",
    owner_declaration: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (typeof api.saveSchool !== "function") {
      setError(
        "saveSchool() is missing from src/services/elimuApi.jsx."
      );
      return;
    }

    let evidenceUrl;

    try {
      evidenceUrl = new URL(
        form.registration_evidence_url.trim()
      );
    } catch {
      setError("Enter a valid HTTPS registration-evidence URL.");
      return;
    }

    if (evidenceUrl.protocol !== "https:") {
      setError("Registration evidence must use HTTPS.");
      return;
    }

    if (!form.owner_declaration) {
      setError(
        "Confirm that you are authorised to submit this school's application."
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        school_type: form.school_type,
        registration_number: form.registration_number.trim(),
        principal_name: form.principal_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        county: form.county.trim(),
        town: form.town.trim(),
        location: form.location.trim(),
        registration_evidence_url: evidenceUrl.href,
        owner_declaration: true,
      };

      const response = await api.saveSchool(payload);
      const data = getApiPayload(response);

      setSuccess(
        data?.message ||
          response?.message ||
          "Your school application has been submitted for verification."
      );

      if (typeof onSubmitted === "function") {
        await onSubmitted();
      }
    } catch (submitError) {
      setError(
        getErrorMessage(
          submitError,
          "The school application could not be submitted."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-[60vh] bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6">
        <section className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-900/60 dark:bg-slate-900 sm:p-9">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 size={28} />
          </span>

          <h1 className="mt-5 text-2xl font-bold text-slate-950 dark:text-white">
            Application submitted
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {success}
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            The school must complete verification before protected
            school-management access becomes available.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
            >
              <ArrowLeft size={16} />
              Back to school access
            </button>

            <button
              type="button"
              onClick={onSubmitted}
              disabled={refreshing}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Check access status
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 dark:bg-slate-950 sm:px-6 sm:py-8">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="bg-slate-950 p-6 text-white sm:p-8">
          <button
            type="button"
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Elimu access
          </button>

          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
              <Building2 size={24} />
            </span>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                School registration
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Set up your school
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            Submit your school's details for verification. This
            registration process does not automatically activate a real
            school account.
          </p>
        </div>

        <form
          onSubmit={submitApplication}
          className="space-y-7 p-5 sm:p-8"
        >
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <section>
            <h2 className="text-base font-bold text-slate-950 dark:text-white">
              School information
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <FormField
                className="sm:col-span-2"
                label="Official school name"
                name="name"
                value={form.name}
                onChange={updateField}
                required
                placeholder="e.g. Namarambi School"
              />

              <div>
                <label
                  htmlFor="elimu-school-type"
                  className={LABEL_CLASS}
                >
                  School type
                </label>

                <select
                  id="elimu-school-type"
                  name="school_type"
                  value={form.school_type}
                  onChange={updateField}
                  className={INPUT_CLASS}
                >
                  <option value="primary">Primary school</option>
                  <option value="secondary">Secondary school</option>
                  <option value="mixed">Mixed school</option>
                  <option value="college">College</option>
                  <option value="university">University</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <FormField
                label="Registration number"
                name="registration_number"
                value={form.registration_number}
                onChange={updateField}
                required
                maxLength={100}
              />

              <FormField
                label="Principal / headteacher"
                name="principal_name"
                value={form.principal_name}
                onChange={updateField}
                required
                maxLength={160}
              />

              <FormField
                label="School phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={updateField}
                required
                maxLength={40}
                placeholder="+254..."
              />

              <FormField
                className="sm:col-span-2"
                label="Official school email"
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                required
                maxLength={160}
              />
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-950 dark:text-white">
              School location
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <FormField
                label="County"
                name="county"
                value={form.county}
                onChange={updateField}
                required
                maxLength={100}
              />

              <FormField
                label="Town"
                name="town"
                value={form.town}
                onChange={updateField}
                required
                maxLength={100}
              />

              <FormField
                className="sm:col-span-2"
                label="Physical address / location"
                name="location"
                value={form.location}
                onChange={updateField}
                required
                maxLength={200}
                placeholder="Estate, road, landmark or area"
              />
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-950 dark:text-white">
              Registration evidence
            </h2>

            <div className="mt-5">
              <FormField
                label="HTTPS evidence URL"
                name="registration_evidence_url"
                type="url"
                value={form.registration_evidence_url}
                onChange={updateField}
                required
                placeholder="https://..."
              />

              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Provide a secure link to the registration evidence. The
                existing endpoint accepts a URL, not a direct file upload.
              </p>
            </div>
          </section>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <input
              type="checkbox"
              name="owner_declaration"
              checked={form.owner_declaration}
              onChange={updateField}
              required
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />

            <span className="text-sm leading-6 text-slate-700 dark:text-slate-200">
              <span className="font-semibold">
                Authorisation declaration
              </span>

              <span className="mt-1 block text-slate-600 dark:text-slate-400">
                I confirm that I am authorised to submit this school's
                registration application and that the information provided
                is accurate.
              </span>
            </span>
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Submitting application…
                </>
              ) : (
                <>
                  Submit for verification
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

// ============================================================
// ELIMU DASHBOARD
// ============================================================

export default function ElimuDashboard({
  onNavigate,
  currentPath = "elimu",
}) {
  const api = useElimuApi();

  const { getAccess, getDashboard } = api;

  const [access, setAccess] = useState(null);
  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingDemo, setCreatingDemo] = useState(false);

  const [error, setError] = useState("");
  const [demoError, setDemoError] = useState("");

  const [internalPath, setInternalPath] = useState(
    currentPath || "elimu"
  );

  const controllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);

  // ----------------------------------------------------------
  // Load authoritative access status and authorized dashboard
  // ----------------------------------------------------------

  const loadDashboard = useCallback(
    async ({ refresh = false } = {}) => {
      controllerRef.current?.abort();

      const controller = new AbortController();
      controllerRef.current = controller;

      const requestId = ++requestIdRef.current;

      const isCurrentRequest = () =>
        mountedRef.current &&
        !controller.signal.aborted &&
        requestId === requestIdRef.current;

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

        // GET /api/jumuiya/elimu/access
        const accessResponse = await getAccess({
          signal: controller.signal,
        });

        if (!isCurrentRequest()) return;

        accessResolved = getApiPayload(accessResponse, "access");

        if (
          !accessResolved ||
          typeof accessResolved !== "object" ||
          Array.isArray(accessResolved)
        ) {
          throw new Error(
            "The access endpoint returned an invalid response."
          );
        }

        setAccess(accessResolved);

        // Never request private dashboard data unless the backend
        // has explicitly granted access.
        if (accessResolved.allowed !== true) {
          setDashboard(null);
          return;
        }

        // GET /api/jumuiya/elimu/dashboard
        const dashboardResponse = await getDashboard({
          signal: controller.signal,
        });

        if (!isCurrentRequest()) return;

        const dashboardData = getApiPayload(
          dashboardResponse,
          "dashboard"
        );

        if (
          !dashboardData ||
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
          !isCurrentRequest() ||
          requestError?.name === "AbortError"
        ) {
          return;
        }

        const status =
          requestError?.status ||
          requestError?.response?.status;

        if (!accessResolved && (status === 401 || status === 403)) {
          setAccess({
            allowed: false,
            has_school: false,
            reason:
              status === 401
                ? "authentication_required"
                : "forbidden",
            message: getErrorMessage(
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
        if (isCurrentRequest()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [getAccess, getDashboard]
  );

  useEffect(() => {
    mountedRef.current = true;

    void loadDashboard();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      controllerRef.current?.abort();
    };
  }, [loadDashboard]);

  const handleRefresh = useCallback(() => {
    return loadDashboard({ refresh: true });
  }, [loadDashboard]);

  // ----------------------------------------------------------
  // Create demo school
  //
  // Uses the registered POST /school/demo route.
  // The backend determines whether demo mode is permitted.
  // ----------------------------------------------------------

  const handleCreateDemo = useCallback(async () => {
    setDemoError("");
    setError("");

    setCreatingDemo(true);

    try {
      const demoPayload = {
        name: "RevelaCode Elimu Demo School",
        code: "REVELACODE-DEMO",
        description:
          "A demonstration school for exploring Jumuiya Elimu's school administration features.",
        school_type: "secondary",
        motto: "Learning for the future",
        principal_name: "Demo Principal",
        location: "Demonstration environment",
        website: "https://revelacode.com",
      };

      let response;

      if (typeof api.createDemoSchool === "function") {
        response = await api.createDemoSchool(demoPayload);
      } else if (typeof api.request === "function") {
        // Compatibility fallback for API clients that expose request()
        // but don't have the createDemoSchool convenience method yet.
        response = await api.request("school/demo", {
          method: "POST",
          body: demoPayload,
        });
      } else {
        throw new Error(
          "The Elimu API client is missing createDemoSchool() and request()."
        );
      }

      getApiPayload(response);

      // Return to the Elimu entry and re-check backend access.
      setInternalPath("elimu");

      await loadDashboard({ refresh: true });
    } catch (demoCreationError) {
      setDemoError(
        getErrorMessage(
          demoCreationError,
          "The demo school could not be created. Check whether demo mode is enabled on the backend."
        )
      );
    } finally {
      setCreatingDemo(false);
    }
  }, [api, loadDashboard]);

  // ----------------------------------------------------------
  // Internal Elimu navigation
  // ----------------------------------------------------------

  const handleElimuNavigate = useCallback(
    (destination) => {
      if (!destination) return;

      const path = String(destination)
        .trim()
        .replace(/^\/+|\/+$/g, "");

      if (
        path === "elimu-school-setup" ||
        path === "elimu/school-setup" ||
        path === "elimu/setup"
      ) {
        setInternalPath("elimu-school-setup");
        return;
      }

      if (
        path === "elimu" ||
        path === "elimu/overview" ||
        path === "elimu/dashboard" ||
        path === "education"
      ) {
        setInternalPath("elimu");
        return;
      }

      if (path.startsWith("elimu/")) {
        setInternalPath(path);
        return;
      }

      if (typeof onNavigate === "function") {
        onNavigate(path);
      }
    },
    [onNavigate]
  );

  // ----------------------------------------------------------
  // Render states
  // ----------------------------------------------------------

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

  if (internalPath === "elimu-school-setup") {
    return (
      <SchoolRegistrationForm
        api={api}
        onBack={() => setInternalPath("elimu")}
        onSubmitted={handleRefresh}
        refreshing={refreshing}
      />
    );
  }

  // ----------------------------------------------------------
  // Accounts without a school see registration AND demo options
  // ----------------------------------------------------------

  if (access && !hasSchoolRecord(access)) {
    return (
      <div className="min-h-full bg-slate-50 px-4 py-6 dark:bg-slate-950 sm:px-6">
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
          >
            {error}
          </div>
        )}

        <div className="mx-auto max-w-5xl space-y-6">
          <ElimuSchoolAccess
            access={access}
            school={null}
            dashboard={null}
            onNavigate={handleElimuNavigate}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />

          {/* Demo action lives here so it appears even if
              ElimuSchoolAccess.jsx has not been modified. */}
          <section className="overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-sm dark:border-violet-900/50 dark:bg-slate-950">
            <div className="grid gap-0 md:grid-cols-[1fr_auto]">
              <div className="p-6 sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300">
                  <Sparkles size={25} />
                </div>

                <p className="mt-5 text-xs font-bold uppercase tracking-[0.17em] text-violet-700 dark:text-violet-300">
                  Explore Elimu
                </p>

                <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                  Try a demo school workspace
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Explore the Elimu school administration workspace using
                  a clearly labelled demonstration school, without
                  submitting a real school's registration application.
                </p>

                <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  <ShieldCheck
                    size={16}
                    className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-300"
                  />

                  <span>
                    Demo creation is controlled by the backend. A demo
                    account does not represent a verified real school.
                  </span>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3 border-t border-violet-100 bg-violet-50/60 p-6 dark:border-violet-900/40 dark:bg-violet-950/20 md:w-64 md:border-l md:border-t-0">
                <button
                  type="button"
                  onClick={handleCreateDemo}
                  disabled={creatingDemo || refreshing}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingDemo ? (
                    <RefreshCw size={17} className="animate-spin" />
                  ) : (
                    <Sparkles size={17} />
                  )}

                  {creatingDemo
                    ? "Creating demo…"
                    : "Create demo school"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleElimuNavigate("elimu-school-setup")
                  }
                  disabled={creatingDemo}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Register a real school
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>

            {demoError && (
              <div
                role="alert"
                className="border-t border-red-200 bg-red-50 px-6 py-4 dark:border-red-900/50 dark:bg-red-950/30 sm:px-8"
              >
                <div className="flex items-start gap-3 text-sm text-red-800 dark:text-red-200">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />

                  <div>
                    <p className="font-bold">
                      Demo school could not be created
                    </p>

                    <p className="mt-1 leading-6">{demoError}</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300"
              />

              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Your Elimu workspace stays within Jumuiya
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Registration, demo creation, and dashboard access are
                  handled through the Elimu backend. This screen does
                  not grant access by itself.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Access is not allowed; preserve the existing denial screen.
  if (!access || access.allowed !== true) {
    return (
      <ElimuAccessDenied
        access={access}
        reason={access?.reason}
        message={access?.message}
        refreshing={refreshing}
        onRetry={handleRefresh}
        onNavigate={handleElimuNavigate}
      />
    );
  }

  // ----------------------------------------------------------
  // Authorized school workspace
  // ----------------------------------------------------------

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
              Your school access is available, but the dashboard could
              not refresh.
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
        onNavigate={handleElimuNavigate}
        currentPath={internalPath}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
    </div>
  );
}