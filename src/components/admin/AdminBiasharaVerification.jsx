import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  UserRound,
  XCircle,
} from "lucide-react";

import { useAdminApi } from "@/services/adminApi.jsx";

const REQUIRED_CHECKS = [
  {
    key: "business_details_checked",
    label: "Business details reviewed",
    description: "The business name, category, type and location have been reviewed.",
  },
  {
    key: "owner_contact_checked",
    label: "Owner contact checked",
    description: "The supplied phone number or email has been checked.",
  },
];

const EMPTY_CHECKS = {
  business_details_checked: false,
  owner_contact_checked: false,
};

function applicationId(item) {
  const id = item?.id ?? item?._id ?? item?.business_id;
  return id === undefined || id === null ? "" : String(id);
}

function statusOf(item) {
  return String(item?.verification_status || item?.status || "pending")
    .trim()
    .toLowerCase();
}

function statusLabel(item) {
  const value = statusOf(item);
  const labels = {
    pending: "Pending review",
    pending_verification: "Pending review",
    needs_information: "More information needed",
    verified: "Verified",
    active: "Active",
    rejected: "Rejected",
    suspended: "Suspended",
  };
  return labels[value] || value.replace(/[_-]+/g, " ");
}

function statusClass(item) {
  const value = statusOf(item);
  if (["verified", "active"].includes(value)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300";
  }
  if (["rejected", "suspended"].includes(value)) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300";
  }
  if (value === "needs_information") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300";
  }
  return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300";
}

function formatDate(value) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getResponseData(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function getBusinessOwnerId(item) {
  return String(item?.owner_user_id || item?.user_id || "Owner ID not provided");
}

function Notice({ type = "error", children }) {
  const success = type === "success";
  return (
    <div
      role={success ? "status" : "alert"}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"
          : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
      }`}
    >
      {success ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function FieldSummary({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-slate-800 dark:text-slate-200">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

export default function AdminBiasharaVerification() {
  const adminApi = useAdminApi();
  const [applications, setApplications] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [notice, setNotice] = useState(null);
  const [notes, setNotes] = useState("");
  const [checks, setChecks] = useState({ ...EMPTY_CHECKS });
  const [submittingDecision, setSubmittingDecision] = useState("");

  const loadApplications = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setLoadError("");
    try {
      const response = await adminApi.verification.getBusinessApplications({
        page: 1,
        limit: 100,
        status: statusFilter,
      });
      const payload = getResponseData(response);
      const rows = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data?.items)
          ? payload.data.items
          : Array.isArray(payload)
            ? payload
            : [];
      const valid = rows.filter((row) => Boolean(applicationId(row)));
      setApplications(valid);
      setSelectedId((current) => (
        valid.some((item) => applicationId(item) === current)
          ? current
          : applicationId(valid[0]) || ""
      ));
    } catch (error) {
      if (!silent) setApplications([]);
      setLoadError(error?.message || "Business applications could not be loaded. Retry the request.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [adminApi, statusFilter]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    setNotes("");
    setChecks({ ...EMPTY_CHECKS });
    setReviewError("");
    setNotice(null);
  }, [selectedId]);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return applications;
    return applications.filter((item) => [
      item?.name,
      item?.business_type,
      item?.category,
      item?.phone,
      item?.email,
      item?.county,
      item?.location,
      item?.owner_user_id,
      item?.id,
      item?.slug,
    ].filter(Boolean).join(" ").toLowerCase().includes(query));
  }, [applications, search]);

  const selected = useMemo(
    () => applications.find((item) => applicationId(item) === selectedId) || null,
    [applications, selectedId],
  );

  const allChecksComplete = REQUIRED_CHECKS.every(({ key }) => checks[key] === true);
  const pendingCount = applications.filter((item) => (
    ["pending", "pending_verification"].includes(statusOf(item))
  )).length;
  const needsInformationCount = applications.filter((item) => statusOf(item) === "needs_information").length;

  const submitReview = async (decision) => {
    if (!selected) {
      setReviewError("Select a business application first.");
      return;
    }
    if (!["approve", "reject", "needs_information"].includes(decision)) {
      setReviewError("Select a valid review decision.");
      return;
    }
    if (decision === "approve" && !allChecksComplete) {
      setReviewError("Complete both verification checks before approving this business.");
      return;
    }
    if (decision !== "approve" && !notes.trim()) {
      setReviewError("Add review notes explaining why this application needs information or is being rejected.");
      return;
    }

    setSubmittingDecision(decision);
    setReviewError("");
    setNotice(null);
    try {
      const response = await adminApi.verification.reviewBusinessApplication(
        applicationId(selected),
        {
          decision,
          notes: notes.trim(),
          checks: { ...checks },
        },
      );
      const payload = getResponseData(response);
      const messages = {
        approve: "Business verified. The owner can now access the Biashara workspace.",
        reject: "Business application rejected.",
        needs_information: "The application was returned for more information.",
      };
      setNotice({
        type: "success",
        message: response?.message || payload?.message || messages[decision],
      });
      await loadApplications({ silent: true });
    } catch (error) {
      setReviewError(error?.message || "The review could not be saved. Retry the action.");
    } finally {
      setSubmittingDecision("");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Business verification queue</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Review submitted business details. A business workspace and public storefront stay unavailable until an authorized platform administrator approves the application.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => loadApplications()}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            Refresh queue
          </button>
        </div>
      </section>

      {notice ? <Notice type={notice.type}>{notice.message}</Notice> : null}
      {loadError ? (
        <Notice>
          <p>{loadError}</p>
          <button type="button" onClick={() => loadApplications()} className="mt-2 min-h-11 rounded-lg border border-current/20 px-3 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
            Try again
          </button>
        </Notice>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Applications in view <Building2 className="h-4 w-4" aria-hidden="true" />
          </div>
          <p className="mt-3 text-3xl font-black tabular-nums text-slate-900 dark:text-white">{loading ? "—" : applications.length}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Loaded from the platform API</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Pending review <Clock3 className="h-4 w-4" aria-hidden="true" />
          </div>
          <p className="mt-3 text-3xl font-black tabular-nums text-slate-900 dark:text-white">{loading ? "—" : pendingCount}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Waiting for a decision</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Needs information <AlertCircle className="h-4 w-4" aria-hidden="true" />
          </div>
          <p className="mt-3 text-3xl font-black tabular-nums text-slate-900 dark:text-white">{loading ? "—" : needsInformationCount}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Awaiting applicant corrections</p>
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.35fr)]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">Applications</h3>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="sr-only">Filter application status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="pending">Pending review</option>
                  <option value="needs_information">Needs information</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All businesses</option>
                </select>
              </label>
            </div>
            <label className="relative mt-4 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search business, contact or owner..."
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
          </div>
          <div className="max-h-[720px] space-y-2 overflow-y-auto p-3">
            {loading && applications.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center">
                <RefreshCw className="h-7 w-7 animate-spin text-emerald-600" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Loading applications</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Store className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No matching businesses</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Try another status or search phrase.</p>
              </div>
            ) : filteredApplications.map((item) => {
              const id = applicationId(item);
              const isSelected = id === selectedId;
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => setSelectedId(id)}
                  aria-pressed={isSelected}
                  className={`block min-h-11 w-full rounded-xl border p-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isSelected
                      ? "border-emerald-300 bg-emerald-50/70 dark:border-emerald-700 dark:bg-emerald-950/30"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{item?.name || "Unnamed business"}</p>
                      <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{item?.category || item?.business_type || "Business details not provided"}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${statusClass(item)}`}>{statusLabel(item)}</span>
                  </div>
                  <p className="mt-2 truncate text-xs text-slate-500 dark:text-slate-400">{item?.email || item?.phone || getBusinessOwnerId(item)}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Submitted {formatDate(item?.submitted_at || item?.created_at)}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {!selected ? (
            <div className="px-5 py-16 text-center">
              <Building2 className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">Select an application</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Business details will appear here for review.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Store className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-black text-slate-900 dark:text-white">{selected.name || "Unnamed business"}</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Submitted {formatDate(selected.submitted_at || selected.created_at)}</p>
                    <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(selected)}`}>{statusLabel(selected)}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2">
                <FieldSummary icon={Building2} label="Business category" value={selected.category} />
                <FieldSummary icon={Store} label="Business type" value={selected.business_type} />
                <FieldSummary icon={Phone} label="Phone" value={selected.phone} />
                <FieldSummary icon={Mail} label="Email" value={selected.email} />
                <FieldSummary icon={MapPin} label="County and location" value={[selected.location, selected.county].filter(Boolean).join(", ")} />
                <FieldSummary icon={UserRound} label="Owner account ID" value={getBusinessOwnerId(selected)} />
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-300">{selected.description || "No description supplied."}</p>
                </div>
                {selected.review_notes ? (
                  <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                    <p className="font-bold">Previous review notes</p>
                    <p className="mt-1 whitespace-pre-wrap">{selected.review_notes}</p>
                  </div>
                ) : null}
              </div>

              {statusOf(selected) !== "verified" && statusOf(selected) !== "active" && statusOf(selected) !== "rejected" ? (
                <div className="border-t border-slate-200 p-5 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Verification checks</h4>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Confirm the two checks below before granting access. Approval activates the owner’s workspace.</p>
                  <div className="mt-4 space-y-3">
                    {REQUIRED_CHECKS.map(({ key, label, description }) => (
                      <label key={key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
                        <input
                          type="checkbox"
                          checked={checks[key]}
                          onChange={(event) => setChecks((current) => ({ ...current, [key]: event.target.checked }))}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</span>
                          <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</span>
                        </span>
                      </label>
                    ))}
                  </div>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">Review notes <span className="font-normal text-slate-500">(required for reject or request information)</span></span>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      maxLength={3000}
                      rows={4}
                      placeholder="Explain any missing or inconsistent business details..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                    <span className="mt-1 block text-right text-xs text-slate-400">{notes.length}/3000</span>
                  </label>

                  {reviewError ? <div className="mt-4"><Notice>{reviewError}</Notice></div> : null}

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() => submitReview("approve")}
                      disabled={Boolean(submittingDecision) || !allChecksComplete}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      {submittingDecision === "approve" ? "Approving…" : "Approve and verify"}
                    </button>
                    <button
                      type="button"
                      onClick={() => submitReview("needs_information")}
                      disabled={Boolean(submittingDecision) || !notes.trim()}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/50"
                    >
                      {submittingDecision === "needs_information" ? "Saving…" : "Request information"}
                    </button>
                    <button
                      type="button"
                      onClick={() => submitReview("reject")}
                      disabled={Boolean(submittingDecision) || !notes.trim()}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
                    >
                      <XCircle className="h-4 w-4" aria-hidden="true" />
                      {submittingDecision === "reject" ? "Rejecting…" : "Reject application"}
                    </button>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Each decision is checked by the backend. Only platform-admin accounts can record a decision.
                  </p>
                </div>
              ) : (
                <div className="border-t border-slate-200 p-5 dark:border-slate-800">
                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {statusOf(selected) === "verified" || statusOf(selected) === "active" ? "This business is verified" : "This application is rejected"}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {selected.verified_at ? `Verified ${formatDate(selected.verified_at)}.` : selected.review_notes || "Review history is recorded by the backend."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
