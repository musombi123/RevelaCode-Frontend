"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";

import { useAdminApi } from "@/services/adminApi.jsx";

// =========================================================
// SCHOOL VERIFICATION
// Uses the existing JWT-protected Jumuiya endpoints.
// =========================================================

const REQUIRED_CHECKS = [
  {
    key: "registry_record_checked",
    label: "Registration record independently checked",
    description:
      "Confirm the school's registration details against the relevant registry.",
  },
  {
    key: "evidence_checked",
    label: "Registration evidence reviewed",
    description:
      "Confirm that the submitted evidence is present and supports the application.",
  },
  {
    key: "contact_independently_verified",
    label: "School contact independently verified",
    description:
      "Confirm the school's contact details through an independent channel.",
  },
];

const EMPTY_CHECKS = {
  registry_record_checked: false,
  evidence_checked: false,
  contact_independently_verified: false,
};

// =========================================================
// HELPERS
// =========================================================

function getApplicationId(application) {
  const value =
    application?.id ??
    application?._id ??
    application?.application_id;

  return value === undefined || value === null
    ? ""
    : String(value);
}

function firstValue(...values) {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim()
    ) {
      return String(value).trim();
    }
  }

  return "";
}

function getSchoolName(application) {
  return (
    firstValue(
      application?.school_name,
      application?.name,
      application?.institution_name,
      application?.school?.name,
      application?.profile?.school_name,
    ) || "Unnamed school"
  );
}

function getRegistrationNumber(application) {
  return firstValue(
    application?.registration_number,
    application?.school_registration_number,
  );
}

function getOwnerName(application) {
  return (
    firstValue(
      application?.owner_name,
      application?.applicant_name,
      application?.contact_person,
      application?.full_name,
      application?.owner?.full_name,
      application?.owner?.name,
    ) || "Applicant details unavailable"
  );
}

function getOwnerContact(application) {
  return firstValue(
    application?.owner_email,
    application?.email,
    application?.contact_email,
    application?.owner?.email,
    application?.owner_contact,
    application?.contact,
    application?.phone,
    application?.owner?.phone,
  );
}

function getLocation(application) {
  return firstValue(
    application?.address,
    [
      application?.town,
      application?.county,
      application?.country,
    ]
      .filter(Boolean)
      .join(", "),
    application?.location,
    application?.physical_address,
  );
}

function getEvidenceUrl(application) {
  return firstValue(
    application?.registration_evidence_url,
    application?.evidence_url,
    application?.supporting_document_url,
  );
}

function getStatus(application) {
  return firstValue(
    application?.verification_status,
    application?.status,
    "pending",
  ).toLowerCase();
}

function getStatusLabel(application) {
  const status = getStatus(application);

  const labels = {
    pending: "Pending review",
    pending_verification: "Pending review",
    needs_information: "More information needed",
    rejected: "Rejected",
    verified: "Verified",
    active: "Active",
    suspended: "Suspended",
    demo: "Demo",
  };

  return labels[status] || status.replaceAll("_", " ");
}

function getStatusClass(application) {
  const status = getStatus(application);

  if (status === "verified" || status === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (
    status === "rejected" ||
    status === "suspended"
  ) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300";
  }

  if (status === "needs_information") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300";
  }

  return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300";
}

function formatDate(value) {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getSubmittedDate(application) {
  return (
    application?.submitted_at ||
    application?.created_at ||
    application?.updated_at
  );
}

function getResponseData(response) {
  return response?.data ?? response;
}

function getSafeEvidenceUrl(value) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);

    if (
      url.protocol === "https:" ||
      url.protocol === "http:"
    ) {
      return url.href;
    }
  } catch {
    return "";
  }

  return "";
}

// =========================================================
// SMALL COMPONENTS
// =========================================================

function StatusBadge({ application }) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
        application,
      )}`}
    >
      {getStatusLabel(application)}
    </span>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-slate-800 dark:text-slate-200">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

function Notice({
  type = "error",
  children,
}) {
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

// =========================================================
// MAIN PAGE
// =========================================================

export default function AdminSchoolVerification() {
  const adminApi = useAdminApi();

  const [applications, setApplications] = useState([]);
  const [selectedId, setSelectedId] = useState("");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [notice, setNotice] = useState(null);
  const [reviewError, setReviewError] = useState("");

  const [notes, setNotes] = useState("");
  const [checks, setChecks] = useState({
    ...EMPTY_CHECKS,
  });

  const [submittingDecision, setSubmittingDecision] =
    useState("");

  // -------------------------------------------------------
  // LOAD APPLICATION QUEUE
  // -------------------------------------------------------

  const loadApplications = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }

      setLoadError("");

      try {
        const response =
          await adminApi.verification.getApplications({
            limit: 100,
          });

        const payload = getResponseData(response);

        const rows = Array.isArray(payload?.applications)
          ? payload.applications
          : Array.isArray(payload)
            ? payload
            : [];

        // Ignore records without usable IDs. Reviewing one
        // requires an ID that the backend can validate.
        const validRows = rows.filter((application) =>
          Boolean(getApplicationId(application)),
        );

        setApplications(validRows);

        setSelectedId((currentId) => {
          const stillExists = validRows.some(
            (application) =>
              getApplicationId(application) === currentId,
          );

          if (stillExists) {
            return currentId;
          }

          return getApplicationId(validRows[0]) || "";
        });
      } catch (error) {
        console.error(
          "Failed to load school verification applications:",
          error,
        );

        setLoadError(
          error?.message ||
            "Unable to load school applications. Please try again.",
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [adminApi],
  );

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Reset the review form when switching applications.
  useEffect(() => {
    setNotes("");
    setChecks({ ...EMPTY_CHECKS });
    setReviewError("");
  }, [selectedId]);

  // -------------------------------------------------------
  // FILTER AND SELECT
  // -------------------------------------------------------

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return applications;
    }

    return applications.filter((application) => {
      const searchable = [
        getSchoolName(application),
        getRegistrationNumber(application),
        getOwnerName(application),
        getOwnerContact(application),
        getLocation(application),
        getApplicationId(application),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [applications, search]);

  const selectedApplication = useMemo(
    () =>
      applications.find(
        (application) =>
          getApplicationId(application) === selectedId,
      ) || null,
    [applications, selectedId],
  );

  const pendingCount = applications.filter((application) => {
    const status = getStatus(application);

    return (
      status === "pending" ||
      status === "pending_verification" ||
      status === "active" ||
      !application?.verification_status
    );
  }).length;

  const needsInformationCount = applications.filter(
    (application) =>
      getStatus(application) === "needs_information",
  ).length;

  const allChecksComplete = REQUIRED_CHECKS.every(
    ({ key }) => checks[key] === true,
  );

  // -------------------------------------------------------
  // REVIEW APPLICATION
  // -------------------------------------------------------

  const submitReview = async (decision) => {
    if (!selectedApplication) {
      setReviewError("Select a school application first.");
      return;
    }

    const applicationId =
      getApplicationId(selectedApplication);

    if (!applicationId) {
      setReviewError(
        "This application does not have a valid identifier.",
      );
      return;
    }

    if (
      !["approve", "reject", "needs_information"].includes(
        decision,
      )
    ) {
      setReviewError("Select a valid review decision.");
      return;
    }

    if (
      decision === "approve" &&
      !allChecksComplete
    ) {
      setReviewError(
        "Complete all three verification checks before approving this school.",
      );
      return;
    }

    if (
      decision !== "approve" &&
      !notes.trim()
    ) {
      setReviewError(
        "Add review notes explaining why this application is being rejected or needs more information.",
      );
      return;
    }

    setSubmittingDecision(decision);
    setReviewError("");
    setNotice(null);

    try {
      const response =
        await adminApi.verification.reviewApplication(
          applicationId,
          {
            decision,
            notes: notes.trim(),
            checks: {
              ...checks,
            },
          },
        );

      const payload = getResponseData(response);

      const messages = {
        approve: "School verification approved successfully.",
        reject: "School application rejected.",
        needs_information:
          "The application was returned for more information.",
      };

      setNotice({
        type: "success",
        message:
          response?.message ||
          payload?.message ||
          messages[decision],
      });

      // Refresh the queue. Reviewed applications that are no
      // longer pending will disappear from the backend list.
      await loadApplications({ silent: true });
    } catch (error) {
      console.error(
        "School verification review failed:",
        error,
      );

      setReviewError(
        error?.message ||
          "The review could not be submitted. Please try again.",
      );
    } finally {
      setSubmittingDecision("");
    }
  };

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* INTRODUCTION */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <ClipboardCheck className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                School verification queue
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Review school registration details and
                supporting evidence before granting a school
                verified access to Elimu.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadApplications()}
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />

            Refresh queue
          </button>
        </div>
      </div>

      {/* MESSAGES */}

      {notice && (
        <Notice type={notice.type}>
          {notice.message}
        </Notice>
      )}

      {loadError && (
        <Notice>
          {loadError}
        </Notice>
      )}

      {/* SUMMARY */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Applications loaded
            </p>

            <Building2 className="h-5 w-5 text-slate-400" />
          </div>

          <p className="mt-3 text-3xl font-black tabular-nums text-slate-900 dark:text-white">
            {loading ? "—" : applications.length}
          </p>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Current review queue, up to 100 records
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Awaiting review
            </p>

            <Clock3 className="h-5 w-5 text-blue-500" />
          </div>

          <p className="mt-3 text-3xl font-black tabular-nums text-slate-900 dark:text-white">
            {loading ? "—" : pendingCount}
          </p>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Pending or not yet classified
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Needs information
            </p>

            <AlertCircle className="h-5 w-5 text-amber-500" />
          </div>

          <p className="mt-3 text-3xl font-black tabular-nums text-slate-900 dark:text-white">
            {loading ? "—" : needsInformationCount}
          </p>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Applications awaiting applicant action
          </p>
        </div>
      </div>

      {/* MAIN WORKSPACE */}

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.35fr)]">
        {/* APPLICATION QUEUE */}

        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Applications
                </h3>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Select an application to inspect it.
                </p>
              </div>

              <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {filteredApplications.length}
              </span>
            </div>

            <label className="relative mt-4 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search school, registration, owner..."
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
          </div>

          <div className="max-h-[720px] space-y-2 overflow-y-auto p-3">
            {loading && applications.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />

                <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Loading applications
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Connecting to school verification...
                </p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Building2 className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />

                <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                  No applications found
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Try another search or refresh the queue.
                </p>
              </div>
            ) : (
              filteredApplications.map((application) => {
                const id = getApplicationId(application);
                const isSelected = id === selectedId;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedId(id)}
                    aria-pressed={isSelected}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-50/70 ring-1 ring-emerald-400/30 dark:border-emerald-800 dark:bg-emerald-950/20"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        <Building2 className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="min-w-0 break-words text-sm font-bold text-slate-900 dark:text-white">
                            {getSchoolName(application)}
                          </p>

                          <StatusBadge application={application} />
                        </div>

                        <p className="mt-2 break-all text-xs text-slate-500 dark:text-slate-400">
                          Reg. no:{" "}
                          {getRegistrationNumber(application) ||
                            "Not provided"}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="truncate text-[11px] text-slate-400">
                            {formatDate(
                              getSubmittedDate(application),
                            )}
                          </span>

                          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                            {isSelected ? "Selected" : "Review"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* APPLICATION DETAILS */}

        <section className="min-w-0 space-y-5">
          {!selectedApplication ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
              <ClipboardCheck className="mx-auto h-9 w-9 text-slate-300 dark:text-slate-700" />

              <h3 className="mt-4 text-base font-bold text-slate-800 dark:text-slate-100">
                Select an application
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                Choose a school from the queue to inspect the
                submitted details and begin a review.
              </p>
            </div>
          ) : (
            <>
              {/* SCHOOL DETAILS */}

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 p-5 dark:border-slate-800 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                        <Building2 className="h-6 w-6" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          Verification application
                        </p>

                        <h3 className="mt-1 break-words text-xl font-black tracking-tight text-slate-900 dark:text-white">
                          {getSchoolName(selectedApplication)}
                        </h3>

                        <p className="mt-1 break-all text-xs text-slate-400">
                          Application ID:{" "}
                          {getApplicationId(selectedApplication)}
                        </p>
                      </div>
                    </div>

                    <StatusBadge
                      application={selectedApplication}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
                  <DetailRow
                    icon={ClipboardCheck}
                    label="Registration number"
                    value={getRegistrationNumber(
                      selectedApplication,
                    )}
                  />

                  <DetailRow
                    icon={User}
                    label="Applicant / owner"
                    value={getOwnerName(selectedApplication)}
                  />

                  <DetailRow
                    icon={FileText}
                    label="Applicant contact"
                    value={getOwnerContact(selectedApplication)}
                  />

                  <DetailRow
                    icon={MapPin}
                    label="School location"
                    value={getLocation(selectedApplication)}
                  />

                  <DetailRow
                    icon={Clock3}
                    label="Submitted"
                    value={formatDate(
                      getSubmittedDate(selectedApplication),
                    )}
                  />

                  <DetailRow
                    icon={ShieldCheck}
                    label="Current verification state"
                    value={getStatusLabel(
                      selectedApplication,
                    )}
                  />
                </div>

                <div className="border-t border-slate-200 p-5 dark:border-slate-800 sm:p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Registration evidence
                  </p>

                  {getSafeEvidenceUrl(
                    getEvidenceUrl(selectedApplication),
                  ) ? (
                    <a
                      href={getSafeEvidenceUrl(
                        getEvidenceUrl(selectedApplication),
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:text-emerald-300"
                    >
                      <FileText className="h-4 w-4" />
                      Open registration evidence
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                      No valid HTTP or HTTPS registration evidence
                      URL is available on this record. Do not
                      approve until the evidence has been supplied
                      and checked.
                    </div>
                  )}
                </div>

                {selectedApplication?.review_notes && (
                  <div className="border-t border-slate-200 p-5 dark:border-slate-800 sm:p-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Previous review notes
                    </p>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-300">
                      {selectedApplication.review_notes}
                    </p>
                  </div>
                )}
              </div>

              {/* REVIEW FORM */}

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 p-5 dark:border-slate-800 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <ShieldCheck className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        Record verification decision
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Confirm the checks below before approving
                        a school's access to Elimu.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-5 sm:p-6">
                  {/* REQUIRED CHECKS */}

                  <div className="space-y-3">
                    {REQUIRED_CHECKS.map((check) => (
                      <label
                        key={check.key}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 dark:border-slate-800 dark:hover:border-emerald-900"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(checks[check.key])}
                          disabled={Boolean(
                            submittingDecision,
                          )}
                          onChange={(event) =>
                            setChecks((current) => ({
                              ...current,
                              [check.key]:
                                event.target.checked,
                            }))
                          }
                          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />

                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">
                            {check.label}
                          </span>

                          <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                            {check.description}
                          </span>
                        </span>

                        {checks[check.key] && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        )}
                      </label>
                    ))}
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500 dark:bg-slate-950/70 dark:text-slate-400">
                    {allChecksComplete ? (
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        All required checks are confirmed. Approval
                        may now be submitted, subject to backend
                        validation.
                      </span>
                    ) : (
                      <>
                        {REQUIRED_CHECKS.filter(
                          ({ key }) => !checks[key],
                        ).length}{" "}
                        verification check(s) still require
                        confirmation before approval.
                      </>
                    )}
                  </div>

                  {/* NOTES */}

                  <div>
                    <label
                      htmlFor="school-review-notes"
                      className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-100"
                    >
                      Review notes
                    </label>

                    <textarea
                      id="school-review-notes"
                      value={notes}
                      onChange={(event) =>
                        setNotes(
                          event.target.value.slice(0, 3000),
                        )
                      }
                      rows={4}
                      maxLength={3000}
                      disabled={Boolean(submittingDecision)}
                      placeholder="Record findings, missing information, or the reason for your decision..."
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />

                    <p className="mt-1 text-right text-[10px] text-slate-400">
                      {notes.length}/3000 characters
                    </p>
                  </div>

                  {reviewError && (
                    <Notice>{reviewError}</Notice>
                  )}

                  {/* DECISION ACTIONS */}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => submitReview("approve")}
                      disabled={
                        Boolean(submittingDecision) ||
                        !allChecksComplete
                      }
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {submittingDecision === "approve" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}

                      Approve school
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        submitReview("needs_information")
                      }
                      disabled={Boolean(submittingDecision)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/50"
                    >
                      {submittingDecision ===
                      "needs_information" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}

                      Request information
                    </button>

                    <button
                      type="button"
                      onClick={() => submitReview("reject")}
                      disabled={Boolean(submittingDecision)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/30"
                    >
                      {submittingDecision === "reject" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}

                      Reject application
                    </button>
                  </div>

                  <p className="text-[11px] leading-5 text-slate-400">
                    Rejection and requests for more information
                    require review notes. The backend independently
                    validates permissions, application status,
                    registration evidence, and approval checks.
                  </p>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}