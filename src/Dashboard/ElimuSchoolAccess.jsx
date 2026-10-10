import React from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const PLAN_FEATURES = [
  "School administration workspace",
  "Academic records and class management",
  "Role-based staff access",
  "Timetable and attendance management",
  "School reports and operational insights",
];

function getSchoolName(school) {
  return (
    school?.name ||
    school?.school_name ||
    school?.institution_name ||
    "Your school"
  );
}

function getVerificationStatus(access) {
  return String(
    access?.verification_status ||
      access?.school?.verification_status ||
      access?.school?.status ||
      access?.status ||
      ""
  ).toLowerCase();
}

function getVerificationPresentation(status) {
  if (status === "verified" || status === "approved") {
    return {
      label: "Verified school",
      description: "Your school verification is complete.",
      icon: BadgeCheck,
      classes:
        "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
    };
  }

  if (status.includes("pending") || status.includes("review")) {
    return {
      label: "Verification pending",
      description: "Your school is awaiting verification.",
      icon: Clock3,
      classes:
        "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
    };
  }

  if (status.includes("reject")) {
    return {
      label: "Verification rejected",
      description: "Review your school verification requirements.",
      icon: ShieldCheck,
      classes:
        "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
    };
  }

  if (status.includes("suspend")) {
    return {
      label: "Access suspended",
      description: "Contact support for assistance with school access.",
      icon: ShieldCheck,
      classes:
        "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
    };
  }

  return {
    label: "School access",
    description: "Your school access status is available below.",
    icon: ShieldCheck,
    classes:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
  };
}

export function ElimuAccountPlanBanner({
  access,
  school,
  dashboard,
  onNavigate,
  onRefresh,
  refreshing = false,
  compact = false,
  className = "",
}) {
  const currentSchool = school || access?.school || dashboard?.school;
  const schoolName = getSchoolName(currentSchool);
  const status = getVerificationStatus(access);
  const verification = getVerificationPresentation(status);
  const VerificationIcon = verification.icon;

  const allowed = Boolean(access?.allowed);
  const hasSchool = Boolean(access?.has_school || currentSchool);
  const role =
    access?.role_label ||
    access?.role ||
    access?.membership?.role_label ||
    access?.membership?.role ||
    "School member";

  const handleAction = () => {
    if (typeof onNavigate === "function") {
      onNavigate(
        hasSchool && allowed ? "elimu/school" : "elimu-school-setup"
      );
      return;
    }

    if (typeof onRefresh === "function") {
      onRefresh();
    }
  };

  if (compact) {
    return (
      <section
        className={[
          "flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4",
          "dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            <Building2 size={20} />
          </span>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {schoolName}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {role}
            </p>
          </div>
        </div>

        <span
          className={[
            "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
            verification.classes,
          ].join(" ")}
        >
          <VerificationIcon size={14} />
          {verification.label}
        </span>
      </section>
    );
  }

  return (
    <section
      className={[
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        "dark:border-slate-800 dark:bg-slate-950",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            <GraduationCap size={25} />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-950 dark:text-white">
                Elimu school workspace
              </h2>

              <span
                className={[
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  verification.classes,
                ].join(" ")}
              >
                <VerificationIcon size={13} />
                {verification.label}
              </span>
            </div>

            <p className="mt-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
              {schoolName}
            </p>

            <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
              {allowed
                ? "Manage your school's academic and administrative operations from one workspace."
                : hasSchool
                  ? verification.description
                  : "Set up your school workspace to begin managing school operations."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAction}
          disabled={refreshing}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-900 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
        >
          {allowed ? "School profile" : "View school access"}
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}

export function ElimuSchoolAccessCard({
  access,
  onNavigate,
  onRefresh,
  refreshing = false,
  className = "",
}) {
  const status = getVerificationStatus(access);
  const verification = getVerificationPresentation(status);
  const VerificationIcon = verification.icon;
  const hasSchool = Boolean(access?.has_school || access?.school);
  const allowed = Boolean(access?.allowed);

  const title = !hasSchool
    ? "Create your school workspace"
    : allowed
      ? "Your school workspace is ready"
      : verification.label;

  const description = !hasSchool
    ? "Set up your school's profile before adding staff, classes, students, and academic records."
    : allowed
      ? "Your school workspace is available. Continue to manage school operations."
      : verification.description;

  const handlePrimaryAction = () => {
    if (!allowed && hasSchool && typeof onRefresh === "function") {
      onRefresh();
      return;
    }

    if (typeof onNavigate === "function") {
      onNavigate(
        allowed
          ? "elimu"
          : access?.redirect?.screen || "elimu-school-setup"
      );
    }
  };

  return (
    <section
      className={[
        "relative isolate overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm",
        "dark:border-slate-800 dark:bg-slate-950",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-br from-blue-50 via-indigo-50/60 to-transparent dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-transparent" />

      <div className="p-6 sm:p-9">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
          {allowed ? (
            <BadgeCheck size={27} />
          ) : (
            <Building2 size={27} />
          )}
        </div>

        <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
          {title}
        </h2>

        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {description}
        </p>

        {hasSchool && (
          <div className="mt-5">
            <span
              className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
                verification.classes,
              ].join(" ")}
            >
              <VerificationIcon size={15} />
              {verification.label}
            </span>
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={refreshing}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-950"
          >
            {refreshing
              ? "Checking access…"
              : allowed
                ? "Open workspace"
                : hasSchool
                  ? "Refresh access status"
                  : "Set up school"}
            <ArrowRight size={16} />
          </button>

          {!allowed && typeof onRefresh === "function" && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Clock3 size={16} />
              Check status
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default function ElimuSchoolAccess({
  access,
  school,
  dashboard,
  onNavigate,
  onRefresh,
  refreshing = false,
  className = "",
}) {
  const allowed = Boolean(access?.allowed);

  return (
    <div
      className={[
        "space-y-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ElimuAccountPlanBanner
        access={access}
        school={school}
        dashboard={dashboard}
        onNavigate={onNavigate}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />

      {!allowed && (
        <ElimuSchoolAccessCard
          access={access}
          onNavigate={onNavigate}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}

      {allowed && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <div className="flex items-start gap-3">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300"
            />
            <div>
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                School access is active
              </p>
              <p className="mt-1 text-sm leading-5 text-emerald-800 dark:text-emerald-300">
                Your school workspace is ready for authorized school
                operations.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            <Sparkles size={19} />
          </span>

          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              One workspace for school operations
            </h3>

            <ul className="mt-3 space-y-2">
              {PLAN_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                >
                  <CheckCircle2
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}