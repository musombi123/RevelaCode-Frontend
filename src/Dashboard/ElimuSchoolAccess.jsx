
 // src/Dashboard/ElimuSchoolAccess.jsx

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  Loader2,
  RefreshCw,
  School,
  ShieldCheck,
} from "lucide-react";

// =========================================================
// SHARED STYLES
// =========================================================

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-white";

const labelClass =
  "block text-sm font-medium text-slate-700 dark:text-slate-200";

const panelClass =
  "rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900";

const SCHOOL_TYPES = [
  { value: "primary", label: "Primary school" },
  { value: "junior_secondary", label: "Junior secondary" },
  { value: "secondary", label: "Secondary school" },
  { value: "mixed", label: "Mixed levels" },
  { value: "early_childhood", label: "Early childhood education" },
  { value: "tvet", label: "Technical / vocational" },
  { value: "other", label: "Other" },
];

// =========================================================
// FORM AND STATUS HELPERS
// =========================================================

function initialForm(school = null) {
  return {
    name: school?.name || "",
    registration_number: school?.registration_number || "",
    school_type: school?.school_type || "primary",
    principal_name: school?.principal_name || "",
    phone: school?.phone || "",
    email: school?.email || "",
    county: school?.county || "",
    town: school?.town || "",
    location: school?.location || "",
    registration_evidence_url:
      school?.registration_evidence_url || "",
    owner_declaration: false,
  };
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getErrorMessage(error, fallback) {
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.error?.message ||
    error?.message ||
    fallback
  );
}

function isNetworkFailure(message) {
  return /failed to fetch|networkerror|network request failed|load failed|fetch failed|unable to reach/i.test(
    String(message || ""),
  );
}

function formatMoney(amount, currency = "KES") {
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toLocaleString("en-KE")}`;
  }
}

function formatDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getAccountPlan(access, school) {
  const sources = [
    access?.subscription,
    access?.billing,
    access?.pricing,
    school?.subscription,
    school?.billing,
    school?.pricing,
    access,
    school,
  ].filter(Boolean);

  let rawFee;
  let currency = "KES";

  for (const source of sources) {
    if (rawFee === undefined || rawFee === null || rawFee === "") {
      rawFee =
        source.monthly_fee_kes ??
        source.monthly_fee ??
        source.subscription_fee_kes;
    }

    if (
      typeof source.currency === "string" &&
      source.currency.trim()
    ) {
      currency = source.currency.trim().toUpperCase();
    }
  }

  const parsedFee =
    rawFee === undefined || rawFee === null || rawFee === ""
      ? null
      : Number(rawFee);

  const monthlyFee =
    parsedFee !== null &&
    Number.isFinite(parsedFee) &&
    parsedFee >= 0
      ? parsedFee
      : null;

  const subscription =
    access?.subscription ||
    access?.billing ||
    school?.subscription ||
    school?.billing ||
    {};

  const trialStart =
    subscription.trial_started_at ||
    access?.trial_started_at ||
    school?.trial_started_at ||
    null;

  const trialEnd =
    subscription.trial_ends_at ||
    access?.trial_ends_at ||
    school?.trial_ends_at ||
    null;

  let remainingDays =
    subscription.trial_days_remaining ??
    access?.trial_days_remaining ??
    school?.trial_days_remaining;

  if (
    (remainingDays === undefined || remainingDays === null) &&
    trialEnd
  ) {
    const endTimestamp = new Date(trialEnd).getTime();

    if (Number.isFinite(endTimestamp)) {
      remainingDays = Math.max(
        0,
        Math.ceil((endTimestamp - Date.now()) / 86400000),
      );
    }
  }

  const parsedRemainingDays =
    remainingDays === undefined ||
    remainingDays === null ||
    remainingDays === ""
      ? null
      : Number(remainingDays);

  return {
    monthlyFee,
    currency,
    trialStart,
    trialEnd,
    remainingDays:
      parsedRemainingDays !== null &&
      Number.isFinite(parsedRemainingDays)
        ? Math.max(0, parsedRemainingDays)
        : null,
  };
}

// =========================================================
// REUSABLE UI COMPONENTS
// =========================================================

function FormField({ label, hint, className = "", children }) {
  return (
    <label className={`${labelClass} ${className}`}>
      {label}
      {children}

      {hint ? (
        <span className="mt-1.5 block text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function StatusCard({ icon: Icon, title, children }) {
  return (
    <div className={`${panelClass} p-4`}>
      <Icon
        size={21}
        className="text-emerald-600 dark:text-emerald-400"
      />

      <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {children}
      </p>
    </div>
  );
}

function FeedbackMessage({ type = "error", children }) {
  const styles =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200"
      : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300";

  return (
    <div
      role={type === "success" ? "status" : "alert"}
      className={`break-words rounded-xl border px-4 py-3 text-sm leading-6 ${styles}`}
    >
      {children}
    </div>
  );
}

// =========================================================
// ACCOUNT PLAN
// =========================================================

export function ElimuAccountPlanBanner({ access, school }) {
  const isDemo =
    school?.is_demo === true ||
    normalizeStatus(school?.verification_status) === "demo" ||
    access?.demo_mode === true;

  if (isDemo) {
    return (
      <section className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-100">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />

          <div>
            <h3 className="font-semibold">
              Development demo — not verified
            </h3>

            <p className="mt-1 text-sm leading-6">
              This workspace is for development testing. It is not proof
              of school registration and must not be used for genuine
              student, admission, or financial records.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const plan = getAccountPlan(access, school);
  const trialStart = formatDate(plan.trialStart);
  const trialEnd = formatDate(plan.trialEnd);

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm dark:border-emerald-900/50 dark:bg-slate-900">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CalendarClock size={21} />
          </div>

          <div>
            <p className="font-semibold text-slate-900 dark:text-white">
              School account trial
            </p>

            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Approved school accounts may receive a 30-day trial.
              The backend determines eligibility and the actual trial dates.
            </p>

            {(trialStart || trialEnd) && (
              <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {trialStart ? `Started ${trialStart}` : ""}
                {trialStart && trialEnd ? " · " : ""}
                {trialEnd ? `Ends ${trialEnd}` : ""}
                {plan.remainingDays !== null
                  ? ` · ${plan.remainingDays} day(s) remaining`
                  : ""}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5 sm:min-w-48">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <CreditCard size={15} />
            Monthly school account fee
          </div>

          <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {plan.monthlyFee !== null
              ? formatMoney(plan.monthlyFee, plan.currency)
              : "Awaiting approved pricing"}
          </p>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {plan.monthlyFee !== null
              ? "Per school account / month"
              : "Displayed when approved pricing is returned by the API"}
          </p>
        </div>
      </div>

      {plan.monthlyFee === null && (
        <div className="border-t border-slate-100 px-4 py-3 text-xs leading-5 text-slate-500 dark:border-white/10 dark:text-slate-400 sm:px-5">
          No monthly price has been published by the API. This display
          does not set prices, create subscriptions, or charge users.
        </div>
      )}

      {!trialStart && !trialEnd && (
        <div className="border-t border-slate-100 px-4 py-3 text-xs leading-5 text-slate-500 dark:border-white/10 dark:text-slate-400 sm:px-5">
          Trial dates have not been supplied by the backend. The frontend
          does not start or extend a trial itself.
        </div>
      )}
    </section>
  );
}

// =========================================================
// SCHOOL ACCESS AND APPLICATION
// =========================================================

export default function ElimuSchoolAccess({
  access,
  school,
  loading = false,
  error = "",
  actionError = "",
  successMessage = "",
  saving = false,
  onRetry,
  onSubmitApplication,
  onCreateDemo,
  allowDemo = false,
}) {
  const [form, setForm] = useState(() => initialForm(school));
  const [formError, setFormError] = useState("");

  const schoolId =
    school?.id || school?._id || school?.school_id || "";

  useEffect(() => {
    if (schoolId) {
      setForm(initialForm(school));
      setFormError("");
    }
    // Reset only when a different school record is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const verificationStatus = normalizeStatus(
    school?.verification_status || school?.status || "",
  );

  const accessReason = normalizeStatus(access?.reason);

  const isPending =
    accessReason === "school_verification_pending" ||
    [
      "pending",
      "pending_verification",
      "under_review",
      "submitted",
    ].includes(verificationStatus);

  const needsInformation =
    verificationStatus === "needs_information" ||
    verificationStatus === "information_required";

  const isRejected = verificationStatus === "rejected";

  // Do not accidentally show a new application form when the access
  // endpoint says an application is pending but the secondary school
  // lookup has not returned a school record.
  const showApplicationForm =
    isRejected ||
    needsInformation ||
    (!school && !isPending);

  const networkFailure = isNetworkFailure(error);

  const handleRetry = () => {
    setFormError("");

    if (typeof onRetry === "function") {
      void onRetry();
    } else {
      setFormError(
        "The access refresh action is not connected. Check ElimuDashboard.jsx.",
      );
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (saving) return;

    if (typeof onSubmitApplication !== "function") {
      setFormError(
        "School registration is not connected to the API yet. Check the Elimu API integration.",
      );
      return;
    }

    const requiredFields = [
      ["name", "Enter the school's official name."],
      [
        "registration_number",
        "Enter the school's registration number.",
      ],
      [
        "principal_name",
        "Enter the principal's, headteacher's, or school head's name.",
      ],
      ["phone", "Enter the official school contact phone number."],
      ["email", "Enter the official school contact email."],
      ["county", "Enter the county where the school is located."],
      ["town", "Enter the town or nearest town."],
      ["location", "Enter the school's physical location."],
      [
        "registration_evidence_url",
        "Add a link to the school's registration evidence.",
      ],
    ];

    for (const [field, message] of requiredFields) {
      if (!String(form[field] || "").trim()) {
        setFormError(message);
        return;
      }
    }

    const email = form.email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Enter a valid school contact email address.");
      return;
    }

    try {
      const evidenceUrl = new URL(
        form.registration_evidence_url.trim(),
      );

      if (evidenceUrl.protocol !== "https:") {
        setFormError(
          "The registration evidence link must use HTTPS.",
        );
        return;
      }
    } catch {
      setFormError(
        "Enter a valid HTTPS URL for the registration evidence.",
      );
      return;
    }

    if (!form.owner_declaration) {
      setFormError(
        "Confirm that you are authorised to register this school.",
      );
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      registration_number: form.registration_number.trim(),
      principal_name: form.principal_name.trim(),
      phone: form.phone.trim(),
      email,
      county: form.county.trim(),
      town: form.town.trim(),
      location: form.location.trim(),
      registration_evidence_url:
        form.registration_evidence_url.trim(),
      school_type: form.school_type,
      owner_declaration: true,
    };

    try {
      await onSubmitApplication(payload);
    } catch (submitError) {
      setFormError(
        getErrorMessage(
          submitError,
          "The application could not be submitted. Please try again.",
        ),
      );
    }
  };

  const submitDemo = async () => {
    setFormError("");

    if (saving) return;

    if (!allowDemo) {
      setFormError(
        "Development demo creation is disabled in this environment.",
      );
      return;
    }

    if (typeof onCreateDemo !== "function") {
      setFormError(
        "Demo creation is not connected to the API.",
      );
      return;
    }

    if (!form.name.trim()) {
      setFormError("Enter a name for the demo school.");
      return;
    }

    try {
      await onCreateDemo({
        name: form.name.trim(),
        school_type: form.school_type,
        county: form.county.trim(),
        town: form.town.trim(),
        location: form.location.trim(),
      });
    } catch (demoError) {
      setFormError(
        getErrorMessage(
          demoError,
          "The development demo could not be created.",
        ),
      );
    }
  };

  // =======================================================
  // LOADING STATE
  // =======================================================

  if (loading && !access && !error) {
    return (
      <div className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <section
          className={`${panelClass} mx-auto flex min-h-72 max-w-2xl flex-col items-center justify-center gap-3 px-6 py-10 text-center`}
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Loader2 size={27} className="animate-spin" />
          </div>

          <h2 className="font-semibold text-slate-900 dark:text-white">
            Checking your school account
          </h2>

          <p className="max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            Elimu is checking your account access and school verification
            status.
          </p>
        </section>
      </div>
    );
  }

  // =======================================================
  // ACCESS CHECK ERROR
  // =======================================================

  if (error && !access) {
    return (
      <div className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <section
          role="alert"
          className="mx-auto mt-6 max-w-2xl rounded-3xl border border-red-200 bg-white p-5 shadow-sm dark:border-red-900/50 dark:bg-slate-900 sm:mt-10 sm:p-7"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle size={25} />
          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
            Unable to check Elimu access
          </h2>

          <p className="mt-2 break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
            {getErrorMessage(error, "An unexpected access error occurred.")}
          </p>

          {networkFailure && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
              <h3 className="text-sm font-semibold text-amber-950 dark:text-amber-100">
                Check the backend connection
              </h3>

              <p className="mt-1 text-sm leading-6 text-amber-900 dark:text-amber-100">
                The browser could not complete the request. Check the
                backend URL, backend availability, authentication, and
                whether the backend CORS policy allows this frontend.
              </p>

              <p className="mt-3 text-xs leading-5 text-amber-900/80 dark:text-amber-100/80">
                Expected access endpoint:
              </p>

              <code className="mt-1 block break-all rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-800 dark:bg-black/20 dark:text-slate-200">
                /api/jumuiya/elimu/access
              </code>
            </div>
          )}

          <button
            type="button"
            onClick={handleRetry}
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

          <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Retrying checks your account again. It does not approve a
            school, change verification status, or create a subscription.
          </p>
        </section>
      </div>
    );
  }

  // =======================================================
  // REGISTRATION AND VERIFICATION WORKSPACE
  // =======================================================

  return (
    <div className="min-h-full space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
              <School size={25} />
            </div>

            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
                <ShieldCheck size={14} />
                School registration and verification
              </div>

              <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                {isPending
                  ? "Your school is awaiting verification"
                  : isRejected
                    ? "Review your school application"
                    : needsInformation
                      ? "Additional information is required"
                      : "Register your school to open Elimu"}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Register using accurate school details. Depending on the
                school's governance structure, the application may be
                submitted by an owner, director, principal, headteacher,
                or another authorised representative.
              </p>

              <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">
                School-management access remains restricted until the
                backend confirms that the account is authorised.
              </p>
            </div>
          </div>
        </section>

        <ElimuAccountPlanBanner access={access} school={school} />

        {(isPending || needsInformation || isRejected) && (
          <section
            className={`rounded-2xl border p-5 ${
              isRejected
                ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20"
                : needsInformation
                  ? "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20"
                  : "border-sky-200 bg-sky-50 dark:border-sky-900/40 dark:bg-sky-950/20"
            }`}
          >
            <div className="flex items-start gap-3">
              {isRejected ? (
                <AlertCircle
                  size={21}
                  className="mt-0.5 shrink-0 text-red-600"
                />
              ) : isPending ? (
                <Clock3
                  size={21}
                  className="mt-0.5 shrink-0 text-sky-700 dark:text-sky-300"
                />
              ) : (
                <FileCheck2
                  size={21}
                  className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300"
                />
              )}

              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {isPending
                    ? "Verification in progress"
                    : isRejected
                      ? "Application not approved"
                      : "Update required"}
                </h3>

                <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {school?.review_notes ||
                    (isPending
                      ? "Your submitted details are awaiting review by an authorised reviewer. School-management features remain locked until approval."
                      : isRejected
                        ? "Review the feedback, correct the information, and resubmit the application."
                        : "Update the requested application details and resubmit them for review.")}
                </p>

                {school?.registration_number && (
                  <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Registration number: {school.registration_number}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {successMessage ? (
          <FeedbackMessage type="success">
            {successMessage}
          </FeedbackMessage>
        ) : null}

        {actionError ? (
          <FeedbackMessage>
            {actionError}
          </FeedbackMessage>
        ) : null}

        {formError ? (
          <FeedbackMessage>
            {formError}
          </FeedbackMessage>
        ) : null}

        {/* -------------------------------------------------
            OFFICIAL SCHOOL APPLICATION
        -------------------------------------------------- */}

        {showApplicationForm ? (
          <form
            onSubmit={submit}
            noValidate
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Official school application
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Enter the school's official details. Only an authorised
                  representative should submit this application.
                </p>
              </div>

              <BadgeCheck
                size={23}
                className="shrink-0 text-emerald-600"
              />
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <FormField label="Official school name *">
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                  required
                  maxLength={200}
                  autoComplete="organization"
                  placeholder="Name on official records"
                  disabled={saving}
                />
              </FormField>

              <FormField label="School registration number *">
                <input
                  className={inputClass}
                  value={form.registration_number}
                  onChange={(event) =>
                    updateField(
                      "registration_number",
                      event.target.value,
                    )
                  }
                  required
                  maxLength={100}
                  placeholder="Official registration identifier"
                  disabled={saving}
                />
              </FormField>

              <FormField label="School type *">
                <select
                  className={inputClass}
                  value={form.school_type}
                  onChange={(event) =>
                    updateField("school_type", event.target.value)
                  }
                  required
                  disabled={saving}
                >
                  {SCHOOL_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Principal / headteacher / school head *"
                hint="Enter the name of the person officially responsible for leading the school."
              >
                <input
                  className={inputClass}
                  value={form.principal_name}
                  onChange={(event) =>
                    updateField("principal_name", event.target.value)
                  }
                  required
                  maxLength={160}
                  autoComplete="name"
                  placeholder="Full name of the school head"
                  disabled={saving}
                />
              </FormField>

              <FormField label="Official contact phone *">
                <input
                  className={inputClass}
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    updateField("phone", event.target.value)
                  }
                  required
                  maxLength={40}
                  autoComplete="tel"
                  placeholder="+254..."
                  disabled={saving}
                />
              </FormField>

              <FormField label="Official contact email *">
                <input
                  className={inputClass}
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField("email", event.target.value)
                  }
                  required
                  maxLength={160}
                  autoComplete="email"
                  placeholder="school@example.org"
                  disabled={saving}
                />
              </FormField>

              <FormField label="County *">
                <input
                  className={inputClass}
                  value={form.county}
                  onChange={(event) =>
                    updateField("county", event.target.value)
                  }
                  required
                  maxLength={100}
                  placeholder="County"
                  disabled={saving}
                />
              </FormField>

              <FormField label="Town / nearest town *">
                <input
                  className={inputClass}
                  value={form.town}
                  onChange={(event) =>
                    updateField("town", event.target.value)
                  }
                  required
                  maxLength={100}
                  placeholder="Town"
                  disabled={saving}
                />
              </FormField>

              <FormField
                label="Physical school location / address *"
                className="sm:col-span-2"
                hint="Include the estate, road, village, landmark, or physical address."
              >
                <input
                  className={inputClass}
                  value={form.location}
                  onChange={(event) =>
                    updateField("location", event.target.value)
                  }
                  required
                  maxLength={200}
                  placeholder="School's physical address"
                  disabled={saving}
                />
              </FormField>

              <FormField
                label="Registration evidence URL *"
                className="sm:col-span-2"
                hint="Provide an HTTPS link that an authorised reviewer can access. A link alone does not prove that the document is authentic."
              >
                <input
                  className={inputClass}
                  type="url"
                  value={form.registration_evidence_url}
                  onChange={(event) =>
                    updateField(
                      "registration_evidence_url",
                      event.target.value,
                    )
                  }
                  required
                  maxLength={1000}
                  placeholder="https://..."
                  autoComplete="url"
                  disabled={saving}
                />
              </FormField>
            </div>

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700 dark:border-white/10 dark:text-slate-300">
              <input
                className="mt-1 h-4 w-4 shrink-0 accent-emerald-600"
                type="checkbox"
                checked={form.owner_declaration}
                onChange={(event) =>
                  updateField(
                    "owner_declaration",
                    event.target.checked,
                  )
                }
                required
                disabled={saving}
              />

              <span>
                I am the school owner, director, principal, headteacher,
                or another person authorised to submit this application
                on behalf of the school. The information provided is
                accurate to the best of my knowledge. I understand that
                Elimu access remains restricted until independent
                verification has been completed.
              </span>
            </label>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-xs leading-5 text-slate-500 dark:text-slate-400">
                Submitting an application does not verify a school.
                Do not enter genuine student or financial records until
                access has been approved.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <FileCheck2 size={17} />
                )}

                {saving ? "Submitting..." : "Submit for verification"}
              </button>
            </div>

            {allowDemo ? (
              <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700/40 dark:bg-amber-950/20">
                <div className="flex items-start gap-2 text-amber-900 dark:text-amber-100">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <div className="text-sm leading-5">
                    <p className="font-semibold">
                      Development testing only
                    </p>

                    <p className="mt-1">
                      A demo is not a real verified school. The backend
                      must independently authorise demo creation.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void submitDemo()}
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-amber-700/30 px-3 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-amber-100 dark:hover:bg-amber-900/30"
                >
                  {saving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <School size={15} />
                  )}

                  Create development demo
                </button>
              </div>
            ) : null}
          </form>
        ) : (
          /* -------------------------------------------------
             APPLICATION STATUS
          -------------------------------------------------- */
          <section className={`${panelClass} p-5`}>
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={22}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {isPending
                    ? "Application received"
                    : "Application status"}
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {isPending
                    ? "Your application is awaiting review. Refresh the status to check for updates. Elimu management features remain restricted until the backend confirms approval."
                    : "Your school application is on record. Refresh its status to check whether further information or action is required."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRetry}
              disabled={loading}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <RefreshCw size={15} />
              )}

              {loading ? "Refreshing..." : "Refresh application status"}
            </button>
          </section>
        )}

        {/* -------------------------------------------------
            TRUST AND ACCOUNT INFORMATION
        -------------------------------------------------- */}

        <section className="grid gap-4 sm:grid-cols-3">
          <StatusCard icon={ShieldCheck} title="Independent review">
            School registration details and evidence require review by
            an authorised reviewer. Frontend form submission alone
            cannot approve an account.
          </StatusCard>

          <StatusCard icon={CalendarClock} title="Trial policy">
            The intended trial is 30 days for an approved school account.
            Actual eligibility and dates are determined by the backend.
          </StatusCard>

          <StatusCard icon={CreditCard} title="Transparent pricing">
            The monthly fee is displayed only when supplied by the API.
            This screen does not charge fees or activate subscriptions.
          </StatusCard>
        </section>
      </div>
    </div>
  );
}