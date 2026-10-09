
import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  LoaderCircle,
  RefreshCw,
  School,
  ShieldCheck,
} from "lucide-react";

import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white";

const labelClass =
  "block text-sm font-medium text-slate-700 dark:text-slate-200";

function initialForm(school) {
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

function getAccountPlan(access, school) {
  const sources = [
    access?.subscription,
    access?.billing,
    access?.pricing,
    school?.subscription,
    school?.billing,
    school?.pricing,
    school,
  ].filter(Boolean);

  let rawFee;
  let currency = "KES";

  for (const source of sources) {
    rawFee ??=
      source.monthly_fee_kes ??
      source.monthly_fee ??
      source.subscription_fee_kes;

    currency =
      source.currency ||
      currency;
  }

  if (
    rawFee === undefined ||
    rawFee === null ||
    rawFee === ""
  ) {
    rawFee = import.meta.env.VITE_ELIMU_MONTHLY_FEE_KES;
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
    school?.trial_started_at ||
    null;

  const trialEnd =
    subscription.trial_ends_at ||
    school?.trial_ends_at ||
    null;

  let remainingDays =
    subscription.trial_days_remaining ??
    school?.trial_days_remaining;

  if (
    remainingDays === undefined &&
    trialEnd
  ) {
    const remainingMs =
      new Date(trialEnd).getTime() - Date.now();

    if (Number.isFinite(remainingMs)) {
      remainingDays = Math.max(
        0,
        Math.ceil(remainingMs / 86400000),
      );
    }
  }

  return {
    monthlyFee,
    currency,
    trialStart,
    trialEnd,
    remainingDays:
      Number.isFinite(Number(remainingDays))
        ? Number(remainingDays)
        : null,
  };
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

export function ElimuAccountPlanBanner({ access, school }) {

  if (
    school?.is_demo === true ||
    school?.verification_status === "demo" ||
    access?.demo_mode === true
  ) {
    return (
      <section className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-100">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold">
              DEMO SCHOOL — NOT VERIFIED
            </h3>
            <p className="mt-1 text-sm leading-6">
              This is a testing workspace. Do not use it as proof of
              school registration or for genuine school records.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const plan = getAccountPlan(access, school);
  const trialEnd = formatDate(plan.trialEnd);
  const trialStart = formatDate(plan.trialStart);

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm dark:border-emerald-900/50 dark:bg-slate-900">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CalendarClock size={21} />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">
              30-day school testing period
            </p>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Every approved school account is intended to receive one
              month of testing before its paid subscription begins.
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
            Monthly account fee after trial
          </div>
          <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {plan.monthlyFee !== null
              ? formatMoney(plan.monthlyFee, plan.currency)
              : "Not configured"}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {plan.monthlyFee !== null
              ? "Per school account / month"
              : "Awaiting the approved subscription price"}
          </p>
        </div>
      </div>

      {plan.monthlyFee === null && (
        <div className="border-t border-slate-100 px-4 py-3 text-xs leading-5 text-slate-500 dark:border-white/10 dark:text-slate-400 sm:px-5">
          The current API does not provide a subscription amount.
          No amount is invented or charged by this display.
        </div>
      )}

      {!trialStart && !trialEnd && (
        <div className="border-t border-slate-100 px-4 py-3 text-xs leading-5 text-slate-500 dark:border-white/10 dark:text-slate-400 sm:px-5">
          The 30-day benefit is displayed here. The server must provide
          the actual trial start and expiry dates for the countdown to
          be authoritative.
        </div>
      )}
    </section>
  );
}

export default function ElimuSchoolAccess({
  user,
  access,
  school,
  loading,
  error,
  actionError,
  successMessage,
  saving,
  onRetry,
  onSubmitApplication,
  onCreateDemo,
  allowDemo = false,
  onNavigate,
}) {
  const [form, setForm] = useState(() => initialForm(school));
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (school?.id || school?._id) {
      setForm(initialForm(school));
    }
  }, [school?.id, school?._id]);

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const verificationStatus =
    school?.verification_status ||
    (school?.status === "pending_verification"
      ? "pending"
      : school?.status || "");

  const isPending =
    access?.reason === "school_verification_pending" ||
    verificationStatus === "pending" ||
    verificationStatus === "pending_verification" ||
    verificationStatus === "under_review";

  const needsInformation =
    verificationStatus === "needs_information";

  const isRejected =
    verificationStatus === "rejected" ||
    school?.status === "rejected";

  const showApplicationForm =
    !school ||
    isRejected ||
    needsInformation;

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Enter the school's official name.");
      return;
    }

    if (!form.registration_number.trim()) {
      setFormError("Enter the school's registration number.");
      return;
    }

    if (!form.registration_evidence_url.trim()) {
      setFormError("Add a secure link to the registration evidence.");
      return;
    }

    if (
      !form.registration_evidence_url
        .trim()
        .toLowerCase()
        .startsWith("https://")
    ) {
      setFormError("The registration evidence URL must use HTTPS.");
      return;
    }

    if (!form.owner_declaration) {
      setFormError(
        "Confirm that you are authorised to register this school.",
      );
      return;
    }

    await onSubmitApplication?.({
      ...form,
      name: form.name.trim(),
      registration_number: form.registration_number.trim(),
      principal_name: form.principal_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      county: form.county.trim(),
      town: form.town.trim(),
      location: form.location.trim(),
      registration_evidence_url:
        form.registration_evidence_url.trim(),
    });
  };

  const submitDemo = async () => {
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Enter a name for the demo school.");
      return;
    }

    await onCreateDemo?.({
      name: form.name.trim(),
      school_type: form.school_type,
      county: form.county.trim(),
      town: form.town.trim(),
      location: form.location.trim(),
    });
  };

  return (
    <JumuiyaDashboardShell
      title="Elimu"
      subtitle="School registration and verification"
      activeHub="elimu"
      user={user}
      onNavigate={onNavigate}
    >
      {loading ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
          <LoaderCircle size={28} className="animate-spin text-emerald-600" />
          <p className="text-sm">Checking your school account…</p>
        </div>
      ) : error && !access ? (
        <section className="mx-auto mt-8 max-w-xl rounded-3xl border border-red-200 bg-white p-6 dark:border-red-900/50 dark:bg-slate-900">
          <AlertCircle className="text-red-600" size={28} />
          <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
            Unable to check Elimu access
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {error}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </section>
      ) : (
        <div className="mx-auto max-w-5xl space-y-5">
          <section className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                <School size={25} />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
                  <ShieldCheck size={14} />
                  Verified-school access
                </div>
                <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                  {isPending
                    ? "Your school is awaiting verification"
                    : isRejected
                      ? "Review the application and try again"
                      : needsInformation
                        ? "More information is required"
                        : "Register your school to open Elimu"}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Elimu is school-first. A real school account must submit
                  its official details and pass an independent review before
                  school-management features are unlocked.
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
                  <AlertCircle size={21} className="mt-0.5 shrink-0 text-red-600" />
                ) : isPending ? (
                  <Clock3 size={21} className="mt-0.5 shrink-0 text-sky-700 dark:text-sky-300" />
                ) : (
                  <FileCheck2 size={21} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" />
                )}
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {isPending
                      ? "Verification in progress"
                      : isRejected
                        ? "Application not approved"
                        : "Update required"}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {school?.review_notes ||
                      (isPending
                        ? "Your submitted details are waiting for an authorised reviewer. School features remain locked until approval."
                        : isRejected
                          ? "Check the review notes below, correct the information, and submit the application again."
                          : "Please correct the application details and resubmit them for review.")}
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

          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
              {successMessage}
            </div>
          )}

          {actionError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              {actionError}
            </div>
          )}

          {formError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              {formError}
            </div>
          )}

          {showApplicationForm ? (
            <form
              onSubmit={submit}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Official school application
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Provide the school's official registration and contact details.
                  </p>
                </div>
                <BadgeCheck size={23} className="shrink-0 text-emerald-600" />
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>
                  Official school name *
                  <input
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    required
                    maxLength={200}
                    autoComplete="organization"
                    placeholder="Name as shown on official records"
                  />
                </label>

                <label className={labelClass}>
                  School registration number *
                  <input
                    className={inputClass}
                    value={form.registration_number}
                    onChange={(e) => updateField("registration_number", e.target.value)}
                    required
                    maxLength={100}
                    placeholder="Official registration identifier"
                  />
                </label>

                <label className={labelClass}>
                  School type *
                  <select
                    className={inputClass}
                    value={form.school_type}
                    onChange={(e) => updateField("school_type", e.target.value)}
                  >
                    <option value="primary">Primary school</option>
                    <option value="junior_secondary">Junior secondary</option>
                    <option value="secondary">Secondary school</option>
                    <option value="mixed">Mixed levels</option>
                    <option value="early_childhood">Early childhood education</option>
                    <option value="tvET">Technical / vocational</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <label className={labelClass}>
                  Principal / headteacher *
                  <input
                    className={inputClass}
                    value={form.principal_name}
                    onChange={(e) => updateField("principal_name", e.target.value)}
                    required
                    maxLength={160}
                    autoComplete="name"
                    placeholder="Full name"
                  />
                </label>

                <label className={labelClass}>
                  Official contact phone *
                  <input
                    className={inputClass}
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    required
                    maxLength={40}
                    autoComplete="tel"
                    placeholder="+254…"
                  />
                </label>

                <label className={labelClass}>
                  Official contact email *
                  <input
                    className={inputClass}
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    required
                    maxLength={160}
                    autoComplete="email"
                    placeholder="school@example.org"
                  />
                </label>

                <label className={labelClass}>
                  County *
                  <input
                    className={inputClass}
                    value={form.county}
                    onChange={(e) => updateField("county", e.target.value)}
                    required
                    maxLength={100}
                    placeholder="County"
                  />
                </label>

                <label className={labelClass}>
                  Town / nearest town *
                  <input
                    className={inputClass}
                    value={form.town}
                    onChange={(e) => updateField("town", e.target.value)}
                    required
                    maxLength={100}
                    placeholder="Town"
                  />
                </label>

                <label className={`${labelClass} sm:col-span-2`}>
                  Physical school location / address *
                  <input
                    className={inputClass}
                    value={form.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    required
                    maxLength={200}
                    placeholder="Estate, road, village, landmark, or physical address"
                  />
                </label>

                <label className={`${labelClass} sm:col-span-2`}>
                  Registration evidence URL *
                  <input
                    className={inputClass}
                    type="url"
                    value={form.registration_evidence_url}
                    onChange={(e) => updateField("registration_evidence_url", e.target.value)}
                    required
                    maxLength={1000}
                    placeholder="https://…"
                  />
                  <span className="mt-1.5 block text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">
                    Supply an HTTPS link to registration evidence accessible
                    to the authorised reviewer. A submitted link is not
                    automatic proof of authenticity.
                  </span>
                </label>
              </div>

              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700 dark:border-white/10 dark:text-slate-300">
                <input
                  className="mt-1 h-4 w-4 shrink-0 accent-emerald-600"
                  type="checkbox"
                  checked={form.owner_declaration}
                  onChange={(e) => updateField("owner_declaration", e.target.checked)}
                  required
                />
                <span>
                  I am authorised to submit this application for the school.
                  The information and evidence provided are accurate to the
                  best of my knowledge, and I understand that access remains
                  locked until independent verification is completed.
                </span>
              </label>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Submission does not create a verified school. Do not add
                  genuine student or financial records until access is approved.
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <FileCheck2 size={17} />
                  )}
                  {saving ? "Submitting…" : "Submit for verification"}
                </button>
              </div>

              {allowDemo && (
                <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700/40 dark:bg-amber-950/20">
                  <div className="flex items-start gap-2 text-amber-900 dark:text-amber-100">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <div className="text-sm leading-5">
                      <p className="font-semibold">Development testing only</p>
                      <p className="mt-1">
                        A demo is not a real verified school. The backend must
                        independently allow demo mode.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={submitDemo}
                    className="mt-3 rounded-lg border border-amber-700/30 px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100 disabled:opacity-60 dark:text-amber-100 dark:hover:bg-amber-900/30"
                  >
                    Create development demo
                  </button>
                </div>
              )}
            </form>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-600" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    No additional submission needed
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Your application is in the review process. Elimu's
                    management features will appear after the backend
                    confirms access is allowed.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
              >
                <RefreshCw size={15} />
                Refresh application status
              </button>
            </section>
          )}

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
              <ShieldCheck className="text-emerald-600" size={21} />
              <h3 className="mt-3 text-sm font-semibold">Independent review</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Registration evidence and contact details need a genuine review.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
              <CalendarClock className="text-emerald-600" size={21} />
              <h3 className="mt-3 text-sm font-semibold">One month to test</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                The intended trial is 30 days per approved school account.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
              <CreditCard className="text-emerald-600" size={21} />
              <h3 className="mt-3 text-sm font-semibold">Transparent pricing</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                The actual subscription amount must come from approved pricing
                configuration, not a client-entered value.
              </p>
            </div>
          </section>
        </div>
      )}
    </JumuiyaDashboardShell>
  );
}