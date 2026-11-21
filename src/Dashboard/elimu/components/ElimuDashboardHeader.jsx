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
    <header
      data-demo="elimu-overview"
      className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
            <GraduationCap size={14} aria-hidden="true" />
            Elimu workspace
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {roleLabel}
          </span>
        </div>

        <h1 className="mt-3 break-words text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
          {title || "School management"}
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          {description ||
            "Manage your school's information, academic operations and role-specific responsibilities from one workspace."}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <Building2 size={13} aria-hidden="true" />
            <span className="truncate">{schoolName}</span>
          </span>
          {verificationStatus ? <StatusBadge status={verificationStatus} /> : null}
          {location ? (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <MapPin size={13} aria-hidden="true" />
              <span className="truncate">{location}</span>
            </span>
          ) : null}
        </div>

        {formattedLastUpdated ? (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <ArrowUpRight size={13} aria-hidden="true" />
            Updated at {formattedLastUpdated}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {showSchoolProfileAction ? (
          <button
            type="button"
            onClick={handleProfile}
            data-demo="elimu-school-pages"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Building2 size={15} aria-hidden="true" />
            School profile
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        ) : null}
        {typeof onRefresh === "function" ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh school dashboard"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              aria-hidden="true"
              className={refreshing ? "animate-spin" : ""}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}
