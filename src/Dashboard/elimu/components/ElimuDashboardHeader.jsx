import React from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  ChevronRight,
  GraduationCap,
  MapPin,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

const ROLE_LABELS = {
  owner: "Owner / School Director",
  principal: "Principal",
  bursar: "Bursar",
  registrar: "Registrar",
  teacher: "Teacher",
  exam_council: "Exam Council",
};

function formatLabel(value) {
  if (!value) return "";

  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getRole(access) {
  const role = String(
    access?.role ??
      access?.membership?.role ??
      access?.access?.role ??
      "",
  )
    .trim()
    .toLowerCase();

  if (role) return role;

  return access?.is_school_owner === true ? "owner" : "";
}

function getVerificationStatus(access, school) {
  return (
    school?.verification_status ??
    access?.verification_status ??
    access?.school?.verification_status ??
    ""
  );
}

function StatusBadge({ status }) {
  if (!status) return null;

  const normalized = String(status).toLowerCase();

  const verified = ["verified", "approved"].includes(normalized);
  const warning = [
    "pending",
    "pending_verification",
    "needs_information",
  ].includes(normalized);
  const rejected = ["rejected", "suspended"].includes(normalized);

  const styles = verified
    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300"
    : warning
      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300"
      : rejected
        ? "border-red-200 bg-red-50 text-red-800 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300"
        : "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300";

  const Icon = verified ? BadgeCheck : rejected ? ShieldAlert : Building2;

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      <Icon size={13} aria-hidden="true" />
      <span className="truncate">{formatLabel(status)}</span>
    </span>
  );
}

export default function ElimuDashboardHeader({
  access,
  school,
  title,
  description,
  onNavigate,
  onRefresh,
  refreshing = false,
  lastUpdated,
  showSchoolProfileAction = true,
}) {
  const role = getRole(access);
  const roleLabel =
    access?.role_label ||
    ROLE_LABELS[role] ||
    (role ? formatLabel(role) : "School workspace");

  const schoolName =
    school?.name ||
    school?.school_name ||
    access?.school?.name ||
    "Your school";

  const location = [
    school?.town || school?.location,
    school?.county,
  ]
    .filter(Boolean)
    .join(", ");

  const verificationStatus = getVerificationStatus(access, school);

  const handleProfile = () => {
    if (typeof onNavigate === "function") {
      onNavigate("elimu/school");
    }
  };

  const formattedLastUpdated =
    lastUpdated instanceof Date &&
    !Number.isNaN(lastUpdated.getTime())
      ? lastUpdated.toLocaleTimeString("en-KE", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  return (
    <header className="space-y-4">
      <section className="relative isolate overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/3 -z-10 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl"
        />

        <div className="relative p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                  <GraduationCap size={15} aria-hidden="true" />
                  Elimu Private Workspace
                </span>

                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
                  {roleLabel}
                </span>
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {title || "School management"}
              </p>

              <h1 className="mt-2 break-words text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                {schoolName}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                {description ||
                  "Manage your school's information, academic operations and role-specific responsibilities from one workspace."}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {verificationStatus ? (
                  <StatusBadge status={verificationStatus} />
                ) : null}

                {location ? (
                  <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                    <MapPin size={13} aria-hidden="true" />
                    <span className="truncate">{location}</span>
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {showSchoolProfileAction ? (
                <button
                  type="button"
                  onClick={handleProfile}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/10"
                >
                  <Building2 size={16} aria-hidden="true" />
                  School profile
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              ) : null}

              {typeof onRefresh === "function" ? (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={refreshing}
                  aria-label="Refresh school dashboard"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={16}
                    aria-hidden="true"
                    className={refreshing ? "animate-spin" : ""}
                  />
                  <span>
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {formattedLastUpdated ? (
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Workspace data
          </p>

          <p className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <ArrowUpRight size={13} aria-hidden="true" />
            Updated at {formattedLastUpdated}
          </p>
        </div>
      ) : null}
    </header>
  );
}