import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  School,
} from "lucide-react";

const REASON_CONTENT = {
  school_required: {
    title: "Set up your school workspace",
    description:
      "Create your school profile to begin setting up your Elimu workspace and managing school operations.",
    icon: School,
    action: "Set up school",
  },
  verification_pending: {
    title: "School verification in progress",
    description:
      "Your school registration is awaiting verification. School management features will become available when access is approved.",
    icon: Clock3,
    action: "Refresh access status",
  },
  pending: {
    title: "School verification in progress",
    description:
      "Your school registration is awaiting verification. Refresh your access status to check for updates.",
    icon: Clock3,
    action: "Refresh access status",
  },
  rejected: {
    title: "School verification was not approved",
    description:
      "Your school access request was not approved. Review the verification information and contact support for guidance.",
    icon: ShieldAlert,
    action: "Refresh access status",
  },
  suspended: {
    title: "School access is suspended",
    description:
      "Access to this school workspace is currently suspended. Contact the school administrator or support team for assistance.",
    icon: LockKeyhole,
    action: "Refresh access status",
  },
  membership_required: {
    title: "School membership required",
    description:
      "You need an active membership at this school to access its private records and management tools.",
    icon: ShieldAlert,
    action: "Refresh access status",
  },
  forbidden: {
    title: "Access restricted",
    description:
      "Your current account does not have permission to open this area of the school workspace.",
    icon: LockKeyhole,
    action: "Return to dashboard",
  },
  default: {
    title: "Elimu workspace unavailable",
    description:
      "Your account cannot access this workspace right now. Refresh your access status or contact the school administrator for assistance.",
    icon: ShieldAlert,
    action: "Refresh access status",
  },
};

function normalizeReason(access, reason) {
  const candidates = [
    reason,
    access?.reason,
    access?.verification_status,
    access?.status,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

    if (!value) continue;

    if (
      [
        "school_required",
        "verification_pending",
        "pending",
        "rejected",
        "suspended",
        "membership_required",
        "forbidden",
      ].includes(value)
    ) {
      return value;
    }

    if (value.includes("suspend")) return "suspended";
    if (value.includes("reject")) return "rejected";
    if (value.includes("pending")) return "pending";
    if (value.includes("membership")) return "membership_required";
    if (value.includes("school_required") || value.includes("no_school")) {
      return "school_required";
    }
  }

  return "default";
}

export default function ElimuAccessDenied({
  access,
  reason,
  message,
  onRetry,
  onNavigate,
  onBack,
  refreshing = false,
  showBackButton = true,
  className = "",
}) {
  const normalizedReason = normalizeReason(access, reason);
  const content = REASON_CONTENT[normalizedReason] || REASON_CONTENT.default;
  const Icon = content.icon;

  const redirect = access?.redirect;
  const redirectScreen =
    typeof redirect === "string" ? redirect : redirect?.screen;

  const canSetUpSchool =
    normalizedReason === "school_required" ||
    redirectScreen === "elimu-school-setup";

  const actionLabel = canSetUpSchool
    ? "Set up school"
    : normalizedReason === "forbidden"
      ? "Return to dashboard"
      : content.action;

  const handlePrimaryAction = () => {
    if (canSetUpSchool && typeof onNavigate === "function") {
      onNavigate("elimu-school-setup");
      return;
    }

    if (
      normalizedReason === "forbidden" &&
      typeof onNavigate === "function"
    ) {
      onNavigate("elimu");
      return;
    }

    if (typeof onRetry === "function") {
      onRetry();
    }
  };

  return (
    <main
      className={[
        "flex min-h-[60vh] w-full items-center justify-center px-4 py-10 sm:px-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <section className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500" />

        <div className="px-6 py-9 text-center sm:px-10 sm:py-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <Icon size={29} strokeWidth={1.8} />
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
            <ShieldCheck size={14} />
            School access status
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            {content.title}
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            {message || content.description}
          </p>

          {access?.school?.name && (
            <div className="mx-auto mt-6 flex max-w-sm items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-slate-800 dark:bg-slate-900">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-blue-300 dark:ring-slate-700">
                <School size={20} />
              </span>

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  School
                </p>
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {access.school.name}
                </p>
              </div>
            </div>
          )}

          {access?.verification_status && (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Verification status:{" "}
              <span className="font-semibold capitalize">
                {String(access.verification_status).replace(/_/g, " ")}
              </span>
            </p>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={refreshing}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-950"
            >
              {refreshing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Checking access…
                </>
              ) : (
                <>
                  {actionLabel}
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {showBackButton && typeof onBack === "function" && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <ArrowLeft size={16} />
                Go back
              </button>
            )}
          </div>

          <p className="mt-7 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Private school records remain protected until your account has the
            required access.
          </p>
        </div>
      </section>
    </main>
  );
}