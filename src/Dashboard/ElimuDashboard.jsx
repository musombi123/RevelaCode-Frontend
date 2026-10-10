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
} from "lucide-react";

import { useElimuApi } from "@/services/elimuApi.jsx";
import ElimuDashboardWorkspace from "@/Dashboard/ElimuDashboardWorkspace.jsx";
import ElimuAccessDenied from "@/Dashboard/elimu/components/ElimuAccessDenied.jsx";
import ElimuSchoolAccess from "@/Dashboard/ElimuSchoolAccess.jsx";

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

const INPUT_CLASS =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

const LABEL_CLASS =
  "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200";

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
        "The school registration method is missing from src/services/elimuApi.jsx."
      );
      return;
    }

    let evidenceUrl;

    try {
      evidenceUrl = new URL(form.registration_evidence_url.trim());
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
        "Confirm that you are authorised to submit this school's registration application."
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

      // POST /api/jumuiya/elimu/school
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
          "The school application could not be submitted. Please review the details and try again."
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
            The school must complete the verification process before the
            protected school-management workspace becomes available.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={16} />
              Back to school access
            </button>

            <button
              type="button"
              onClick={onSubmitted}
              disabled={refreshing}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
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
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Elimu access
          </button>

          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
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
            Submit your school details for verification. This creates a
            registration application; it does not automatically activate a
            real school account.
          </p>
        </div>

        <form onSubmit={submitApplication} className="space-y-7 p-5 sm:p-8">
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

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Enter the school's official details.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="elimu-school-name" className={LABEL_CLASS}>
                  Official school name
                </label>

                <input
                  id="elimu-school-name"
                  name="name"
                  required
                  maxLength={200}
                  value={form.name}
                  onChange={updateField}
                  placeholder="e.g. Mombasa Academy"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="elimu-school-type" className={LABEL_CLASS}>
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

              <div>
                <label
                  htmlFor="elimu-registration-number"
                  className={LABEL_CLASS}
                >
                  Registration number
                </label>

                <input
                  id="elimu-registration-number"
                  name="registration_number"
                  required
                  maxLength={100}
                  value={form.registration_number}
                  onChange={updateField}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label
                  htmlFor="elimu-principal-name"
                  className={LABEL_CLASS}
                >
                  Principal / headteacher
                </label>

                <input
                  id="elimu-principal-name"
                  name="principal_name"
                  required
                  maxLength={160}
                  value={form.principal_name}
                  onChange={updateField}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="elimu-school-phone" className={LABEL_CLASS}>
                  School phone
                </label>

                <input
                  id="elimu-school-phone"
                  name="phone"
                  type="tel"
                  required
                  maxLength={40}
                  value={form.phone}
                  onChange={updateField}
                  placeholder="+254..."
                  className={INPUT_CLASS}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="elimu-school-email" className={LABEL_CLASS}>
                  Official school email
                </label>

                <input
                  id="elimu-school-email"
                  name="email"
                  type="email"
                  required
                  maxLength={160}
                  value={form.email}
                  onChange={updateField}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-950 dark:text-white">
              School location
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="elimu-county" className={LABEL_CLASS}>
                  County
                </label>

                <input
                  id="elimu-county"
                  name="county"
                  required
                  maxLength={100}
                  value={form.county}
                  onChange={updateField}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="elimu-town" className={LABEL_CLASS}>
                  Town
                </label>

                <input
                  id="elimu-town"
                  name="town"
                  required
                  maxLength={100}
                  value={form.town}
                  onChange={updateField}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="elimu-location" className={LABEL_CLASS}>
                  Physical address / location
                </label>

                <input
                  id="elimu-location"
                  name="location"
                  required
                  maxLength={200}
                  value={form.location}
                  onChange={updateField}
                  placeholder="Estate, road, landmark or area"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-950 dark:text-white">
              Registration evidence
            </h2>

            <div className="mt-5">
              <label
                htmlFor="elimu-evidence-url"
                className={LABEL_CLASS}
              >
                HTTPS evidence URL
              </label>

              <input
                id="elimu-evidence-url"
                name="registration_evidence_url"
                type="url"
                inputMode="url"
                required
                value={form.registration_evidence_url}
                onChange={updateField}
                placeholder="https://..."
                className={INPUT_CLASS}
              />

              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Provide a secure link to the required registration evidence.
                The existing endpoint accepts a URL, not a direct file upload.
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
                registration application and that the information provided is
                accurate.
              </span>
            </span>
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
  const [error, setError] = useState("");

  // Elimu sub-navigation stays inside Elimu instead of changing the
  // global MainDashboardV2 active view.
  const [internalPath, setInternalPath] = useState(currentPath || "elimu");

  const controllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);

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

        // Do not request protected dashboard data before access is allowed.
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

  const handleElimuNavigate = useCallback(
    (destination) => {
      if (!destination) return;

      const path = String(destination)
        .trim()
        .replace(/^\/+|\/+$/g, "");

      // School registration is a local Elimu screen.
      if (
        path === "elimu-school-setup" ||
        path === "elimu/school-setup" ||
        path === "elimu/setup"
      ) {
        setInternalPath("elimu-school-setup");
        return;
      }

      // Return to the Elimu entry/dashboard without leaving the hub.
      if (
        path === "elimu" ||
        path === "elimu/overview" ||
        path === "elimu/dashboard" ||
        path === "education"
      ) {
        setInternalPath("elimu");
        return;
      }

      // Keep Elimu routes local. MainDashboardV2 only accepts registered
      // top-level dashboard keys; passing these paths directly would fall
      // back to Home.
      if (path.startsWith("elimu/")) {
        setInternalPath(path);
        return;
      }

      // Only actual top-level destinations are delegated to the app shell.
      if (typeof onNavigate === "function") {
        onNavigate(path);
      }
    },
    [onNavigate]
  );

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

  const isSchoolSetup = internalPath === "elimu-school-setup";

  if (isSchoolSetup) {
    return (
      <SchoolRegistrationForm
        api={api}
        onBack={() => setInternalPath("elimu")}
        onSubmitted={handleRefresh}
        refreshing={refreshing}
      />
    );
  }

  // A school-less account sees the Elimu access/setup screen, not Home.
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

        <ElimuSchoolAccess
          access={access}
          school={null}
          dashboard={null}
          onNavigate={handleElimuNavigate}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />

        <div className="mx-auto mt-6 max-w-5xl rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
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
                Use the school setup button to open registration. It should no
                longer send Elimu internal navigation to the Home dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
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
        onNavigate={handleElimuNavigate}
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
        onNavigate={handleElimuNavigate}
        currentPath={internalPath}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
    </div>
  );
}