import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  FileUp,
  FolderOpen,
  LockKeyhole,
  Menu,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

import ElimuDashboardHeader from "@/Dashboard/elimu/components/ElimuDashboardHeader.jsx";
import ElimuDashboardSidebar from "@/Dashboard/elimu/components/ElimuDashboardSidebar.jsx";

import ElimuOwnerDashboard from "@/Dashboard/elimu/ElimuOwnerDashboard.jsx";
import ElimuPrincipalDashboard from "@/Dashboard/elimu/ElimuPrincipalDashboard.jsx";
import ElimuBursarDashboard from "@/Dashboard/elimu/ElimuBursarDashboard.jsx";
import ElimuRegistrarDashboard from "@/Dashboard/elimu/ElimuRegistrarDashboard.jsx";
import ElimuTeacherDashboard from "@/Dashboard/elimu/ElimuTeacherDashboard.jsx";

import { useElimuApi } from "@/services/elimuApi.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

const ROLE_LABELS = {
  owner: "Owner / School Director",
  principal: "Principal",
  bursar: "Bursar",
  registrar: "Registrar",
  teacher: "Teacher",
};

const ROLE_DESCRIPTIONS = {
  owner: "Oversee school operations, staff, academic performance and finances.",
  principal:
    "Coordinate school operations, academic delivery and staff performance.",
  bursar: "Manage school fees, financial records and financial reporting.",
  registrar: "Manage admissions, enrolment, school forms and official records.",
  teacher:
    "Manage assigned classes, lessons, attendance and learner assessments.",
};

const DEFAULT_BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  "https://revelacode-backend.onrender.com";

const BACKEND_URL = DEFAULT_BACKEND_URL.replace(/\/+$/, "");
const ELIMU_API_PREFIX = "/api/jumuiya/elimu";

const DOCUMENT_CATEGORIES = [
  { value: "forms", label: "School forms" },
  { value: "notices", label: "Notices and announcements" },
  { value: "calendar", label: "Calendar and school dates" },
  { value: "handbook", label: "Handbook and policies" },
  { value: "fees", label: "Fee structures" },
  { value: "other", label: "Other school documents" },
];

function unwrapResponse(response) {
  if (!response || typeof response !== "object") return response;

  if (response.data && typeof response.data === "object") {
    return response.data;
  }

  return response;
}

function getArray(response, keys = []) {
  const data = unwrapResponse(response);

  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  if (data?.data && typeof data.data === "object") {
    for (const key of keys) {
      if (Array.isArray(data.data[key])) return data.data[key];
    }
  }

  return [];
}

function normalizeRole(access) {
  const candidates = [
    access?.role,
    access?.membership?.role,
    access?.access?.role,
    access?.role_label,
    access?.membership?.role_label,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "")
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ");

    if (!value) continue;

    if (value === "owner" || value.includes("school owner")) return "owner";
    if (value.includes("director")) return "owner";
    if (value.includes("principal")) return "principal";
    if (value.includes("bursar") || value.includes("finance")) return "bursar";
    if (value.includes("registrar") || value.includes("admission")) {
      return "registrar";
    }
    if (value.includes("teacher") || value.includes("educator")) {
      return "teacher";
    }
  }

  return "";
}

function getSchool(access, dashboard) {
  return (
    access?.school ||
    access?.membership?.school ||
    dashboard?.school ||
    dashboard?.hub?.school ||
    null
  );
}

function getSchoolId(school) {
  return (
    school?.school_id ||
    school?.id ||
    school?._id ||
    school?.schoolId ||
    ""
  );
}

function getSchoolCode(school) {
  return school?.school_code || school?.code || school?.schoolCode || "";
}

function getSchoolName(school) {
  return (
    school?.name ||
    school?.school_name ||
    school?.institution_name ||
    "School workspace"
  );
}

function getCurrentUserName(access, dashboard) {
  const user =
    access?.user ||
    access?.membership?.user ||
    dashboard?.user ||
    dashboard?.profile ||
    {};

  return (
    user?.full_name ||
    user?.name ||
    user?.display_name ||
    user?.username ||
    ""
  );
}

function getRoleDashboard(role) {
  switch (role) {
    case "owner":
      return ElimuOwnerDashboard;
    case "principal":
      return ElimuPrincipalDashboard;
    case "bursar":
      return ElimuBursarDashboard;
    case "registrar":
      return ElimuRegistrarDashboard;
    case "teacher":
      return ElimuTeacherDashboard;
    default:
      return null;
  }
}

function getDocumentId(document) {
  return (
    document?.id ||
    document?._id ||
    document?.document_id ||
    document?.documentId ||
    ""
  );
}

function getDocumentTitle(document) {
  return document?.title || document?.name || document?.filename || "Untitled document";
}

function formatDocumentDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function describeDocumentStatus(document) {
  const status = String(document?.status || "published")
    .replace(/[_-]+/g, " ")
    .toLowerCase();

  if (document?.is_public === true && status === "published") {
    return {
      label: "Published",
      className:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    };
  }

  if (status.includes("review") || status.includes("pending")) {
    return {
      label: "Awaiting review",
      className:
        "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
    };
  }

  return {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };
}

async function responseMessage(response) {
  let data = null;

  try {
    data = await response.json();
  } catch {
    // The backend may return an empty or non-JSON response.
  }

  const normalized = unwrapResponse(data);

  if (!response.ok) {
    const error = new Error(
      normalized?.message ||
        normalized?.error?.message ||
        normalized?.error ||
        `Request failed with HTTP ${response.status}.`
    );

    error.status = response.status;
    error.payload = normalized;
    throw error;
  }

  if (normalized?.success === false || normalized?.ok === false) {
    const error = new Error(
      normalized?.message ||
        normalized?.error?.message ||
        "The server rejected the request."
    );

    error.status = response.status;
    error.payload = normalized;
    throw error;
  }

  return normalized;
}

function getCategoryOptions(role) {
  if (role === "bursar") {
    return DOCUMENT_CATEGORIES.filter((item) => item.value === "fees");
  }

  if (role === "teacher") {
    return DOCUMENT_CATEGORIES.filter((item) =>
      ["other", "calendar"].includes(item.value)
    );
  }

  if (role === "registrar") {
    return DOCUMENT_CATEGORIES.filter((item) =>
      ["forms", "notices", "calendar", "handbook", "other"].includes(
        item.value
      )
    );
  }

  return DOCUMENT_CATEGORIES;
}

/**
 * This centre submits document metadata and an HTTPS URL for a file hosted
 * on approved storage. It does not upload local file bytes.
 *
 * The backend must authorize each role independently and keep submissions
 * private until an authorized reviewer publishes them.
 */
function ElimuDocumentCenter({ access, school, role, onNavigate }) {
  const elimuApi = useElimuApi();
  const auth = useAuth();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [managementBlocked, setManagementBlocked] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: role === "bursar" ? "fees" : "forms",
    downloadUrl: "",
  });

  const schoolId = getSchoolId(school);
  const schoolCode = getSchoolCode(school);
  const canSubmit = ["owner", "principal", "registrar", "teacher", "bursar"].includes(
    role
  );

  const categoryOptions = useMemo(() => getCategoryOptions(role), [role]);

  useEffect(() => {
    setForm((current) => {
      const categories = getCategoryOptions(role);
      const stillAllowed = categories.some(
        (item) => item.value === current.category
      );

      return {
        ...current,
        category: stillAllowed
          ? current.category
          : categories[0]?.value || "other",
      };
    });
  }, [role]);

  const getToken = useCallback(async () => {
    let token = "";

    try {
      if (typeof auth?.getAccessToken === "function") {
        token = await auth.getAccessToken();
      }
    } catch {
      // Try the available authentication state and browser token cache.
    }

    token =
      token ||
      auth?.accessToken ||
      auth?.user?.accessToken ||
      auth?.user?.access_token ||
      "";

    if (!token && typeof window !== "undefined") {
      token =
        window.localStorage.getItem("revelacode_access_token") ||
        window.localStorage.getItem("access_token") ||
        window.localStorage.getItem("token") ||
        "";
    }

    return String(token || "").replace(/^Bearer\s+/i, "");
  }, [auth]);

  const buildHeaders = useCallback(
    async (json = false) => {
      const headers = {};

      if (json) headers["Content-Type"] = "application/json";

      const token = await getToken();
      if (token) headers.Authorization = `Bearer ${token}`;

      return headers;
    },
    [getToken]
  );

  const schoolQuery = useMemo(() => {
    const params = new URLSearchParams();

    if (schoolId) params.set("school_id", String(schoolId));
    else if (schoolCode) params.set("school_code", String(schoolCode));

    return params.toString();
  }, [schoolId, schoolCode]);

  const manageUrl = useMemo(() => {
    const base = `${BACKEND_URL}${ELIMU_API_PREFIX}/public/documents/manage`;

    return schoolQuery ? `${base}?${schoolQuery}` : base;
  }, [schoolQuery]);

  const downloadUrl = useCallback(
    (documentId) => {
      const base = `${BACKEND_URL}${ELIMU_API_PREFIX}/public/documents/${encodeURIComponent(
        documentId
      )}/download`;

      return schoolQuery ? `${base}?${schoolQuery}` : base;
    },
    [schoolQuery]
  );

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");
    setManagementBlocked(false);

    try {
      const headers = await buildHeaders();

      const response = await fetch(manageUrl, {
        method: "GET",
        headers,
        credentials: "include",
      });

      const data = await responseMessage(response);

      setDocuments(
        getArray(data, ["documents", "items", "results", "records"])
      );
    } catch (manageError) {
      if (manageError?.status === 401 || manageError?.status === 403) {
        setManagementBlocked(true);
      }

      // Staff who cannot open the private management list may still view
      // documents already approved for public access.
      try {
        if (typeof elimuApi.getPublicDocuments !== "function") {
          throw manageError;
        }

        const publicResponse = await elimuApi.getPublicDocuments({
          ...(schoolId ? { school_id: schoolId } : {}),
          ...(schoolCode ? { school_code: schoolCode } : {}),
          limit: 50,
        });

        setDocuments(
          getArray(publicResponse, ["documents", "items", "results"])
        );

        if (manageError?.status === 403) {
          setNotice(
            "The backend has not granted your current role access to the document management endpoint. Showing publicly approved documents only."
          );
        } else if (manageError?.status === 401) {
          setNotice(
            "Your session could not access document management. Showing publicly approved documents only."
          );
        } else {
          setNotice(
            "The private management list could not be loaded. Showing publicly approved documents only."
          );
        }
      } catch (publicError) {
        setDocuments([]);

        setError(
          manageError?.message ||
            publicError?.message ||
            "Documents could not be loaded. Check your connection and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [
    buildHeaders,
    manageUrl,
    elimuApi.getPublicDocuments,
    schoolId,
    schoolCode,
  ]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submitDocument = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const title = form.title.trim();
    const description = form.description.trim();
    const downloadUrlValue = form.downloadUrl.trim();

    if (!title) {
      setError("Enter a document title.");
      return;
    }

    if (!downloadUrlValue) {
      setError("Enter the HTTPS URL of the file on approved document storage.");
      return;
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(downloadUrlValue);
    } catch {
      setError("Enter a valid HTTPS document URL.");
      return;
    }

    if (parsedUrl.protocol !== "https:") {
      setError("Only HTTPS document URLs can be submitted.");
      return;
    }

    if (
      schoolId &&
      !schoolCode &&
      !getSchoolId(school)
    ) {
      setError("The selected school could not be identified.");
      return;
    }

    setSubmitting(true);

    try {
      const headers = await buildHeaders(true);

      const response = await fetch(manageUrl, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          category: form.category,
          download_url: downloadUrlValue,
          school_id: schoolId || undefined,
          school_code: schoolCode || undefined,

          // Staff submissions must not become public automatically.
          status: "draft",
          is_public: false,
        }),
      });

      await responseMessage(response);

      setForm((current) => ({
        ...current,
        title: "",
        description: "",
        downloadUrl: "",
      }));

      setNotice(
        "The server accepted the document submission. Check the document status below before assuming that it has been published."
      );

      await loadDocuments();
    } catch (submitError) {
      if (submitError?.status === 401 || submitError?.status === 403) {
        setManagementBlocked(true);
        setError(
          "The backend denied this document submission. The current document-management route is owner-restricted or your membership lacks the required permission. The server must authorize registrar and staff submissions before this feature can work for those roles."
        );
      } else if (submitError?.status === 404 || submitError?.status === 405) {
        setError(
          "The document submission endpoint is not available at this backend route yet. Register and implement the document-management endpoint before retrying."
        );
      } else {
        setError(
          submitError?.message ||
            "The document could not be submitted. Verify the document URL and try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-blue-200">
              <ShieldCheck size={14} />
              School document centre
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
              Documents and submissions
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Prepare school forms, notices, calendars, fee structures and
              supporting resources. Every submission must follow the school's
              review and publication permissions.
            </p>

            <p className="mt-3 text-sm font-semibold text-white">
              {getSchoolName(school)}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Signed in as {ROLE_LABELS[role] || "School member"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadDocuments()}
            disabled={loading}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh documents
          </button>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <p>{notice}</p>
        </div>
      )}

      {managementBlocked && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <LockKeyhole
              size={20}
              className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300"
            />

            <div>
              <h2 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                Document permissions need backend configuration
              </h2>

              <p className="mt-1 text-sm leading-6 text-amber-900 dark:text-amber-300">
                This screen does not bypass school access controls. The
                backend must permit the Registrar to submit official
                documents, the Bursar to submit fee documents, and Teachers to
                submit learning resources. The Owner or another authorized
                reviewer must control publication.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              <UploadCloud size={21} />
            </span>

            <div>
              <h2 className="text-base font-bold text-slate-950 dark:text-white">
                Submit a school document
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                Add the document details and its HTTPS link.
              </p>
            </div>
          </div>

          <form onSubmit={submitDocument} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="elimu-document-title"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Document title
              </label>

              <input
                id="elimu-document-title"
                name="title"
                type="text"
                autoComplete="off"
                maxLength={160}
                required
                value={form.title}
                onChange={updateField}
                placeholder="e.g. Term 1 school calendar"
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="elimu-document-category"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Document category
              </label>

              <select
                id="elimu-document-category"
                name="category"
                required
                value={form.category}
                onChange={updateField}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {categoryOptions.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              {role === "registrar" && (
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Use this area for official forms, notices, school calendars
                  and other registrar-managed records. Admissions workflows
                  can be connected separately.
                </p>
              )}

              {role === "bursar" && (
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  This role is restricted in the interface to fee documents.
                  Private fee statements must not be published here.
                </p>
              )}

              {role === "teacher" && (
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Teacher-submitted resources should remain private until the
                  school completes its review.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="elimu-document-description"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Description
                <span className="ml-1 font-normal text-slate-400">
                  (optional)
                </span>
              </label>

              <textarea
                id="elimu-document-description"
                name="description"
                rows={3}
                maxLength={2000}
                value={form.description}
                onChange={updateField}
                placeholder="Explain what this document contains and who should use it."
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="elimu-document-url"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                HTTPS document URL
              </label>

              <input
                id="elimu-document-url"
                name="downloadUrl"
                type="url"
                inputMode="url"
                autoComplete="url"
                required
                value={form.downloadUrl}
                onChange={updateField}
                placeholder="https://approved-storage.example/document.pdf"
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />

              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                This backend route currently registers a URL for a file
                hosted elsewhere. It does not transfer a file from your
                computer. The server must validate the storage host before
                allowing downloads.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-2">
                <ShieldCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                />

                <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                  Submissions are requested as drafts and are not intended to
                  become public automatically. The backend remains responsible
                  for enforcing the final status and publication permissions.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-950"
            >
              {submitting ? (
                <>
                  <RefreshCw size={17} className="animate-spin" />
                  Submitting document…
                </>
              ) : (
                <>
                  <FileUp size={17} />
                  Submit for review
                </>
              )}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950 dark:text-white">
                Document register
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Documents returned by the backend for this workspace.
              </p>
            </div>

            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {documents.length} {documents.length === 1 ? "record" : "records"}
            </span>
          </div>

          {loading ? (
            <div className="mt-5 space-y-3" aria-label="Loading documents">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900"
                />
              ))}
            </div>
          ) : documents.length ? (
            <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
              {documents.map((document, index) => {
                const id = getDocumentId(document);
                const status = describeDocumentStatus(document);

                return (
                  <article
                    key={id || `${document.title || "document"}-${index}`}
                    className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      <FileText size={19} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold text-slate-900 dark:text-white">
                        {getDocumentTitle(document)}
                      </p>

                      {document.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {document.description}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium capitalize text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                          {String(document.category || "document").replace(
                            /[_-]+/g,
                            " "
                          )}
                        </span>

                        <span
                          className={`rounded-md px-2 py-1 text-[11px] font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>

                        {formatDocumentDate(
                          document.published_at ||
                            document.updated_at ||
                            document.created_at
                        ) && (
                          <span className="text-[11px] text-slate-400">
                            {formatDocumentDate(
                              document.published_at ||
                                document.updated_at ||
                                document.created_at
                            )}
                          </span>
                        )}
                      </div>

                      {document.is_public === true &&
                        document.status === "published" &&
                        id && (
                          <a
                            href={downloadUrl(id)}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300"
                          >
                            Open published document
                            <ArrowRight size={13} />
                          </a>
                        )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <FolderOpen
                size={28}
                className="mx-auto text-slate-300 dark:text-slate-600"
              />

              <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                No documents are available
              </p>

              <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">
                Existing documents will appear here when the backend returns
                them for your account.
              </p>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <CheckCircle2
            size={19}
            className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
          />

          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Access and privacy
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Public school forms and official notices may be published after
              approval. Student report cards, individual fee statements,
              personal records and other confidential documents must use
              authenticated, school-scoped endpoints and must never be exposed
              through the public document library.
            </p>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => onNavigate?.("elimu")}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
      >
        Return to dashboard
      </button>
    </div>
  );
}

export default function ElimuDashboardWorkspace({
  access,
  dashboard,
  onNavigate,
  currentPath = "elimu",
  onRefresh,
  refreshing = false,
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const role = useMemo(() => normalizeRole(access), [access]);

  const school = useMemo(
    () => getSchool(access, unwrapResponse(dashboard)),
    [access, dashboard]
  );

  const schoolName = getSchoolName(school);
  const userName = getCurrentUserName(access, unwrapResponse(dashboard));
  const RoleDashboard = getRoleDashboard(role);

  const normalizedPath = String(currentPath || "")
    .replace(/\/+$/, "")
    .toLowerCase();

  const isDocumentCenter =
    normalizedPath === "elimu/documents" ||
    normalizedPath === "/elimu/documents" ||
    normalizedPath === "documents" ||
    normalizedPath.endsWith("/elimu/documents");

  const handleNavigate = useCallback(
    (path) => {
      if (typeof onNavigate === "function") {
        onNavigate(path);
      }

      setMobileSidebarOpen(false);
    },
    [onNavigate]
  );

  const handleRefresh = useCallback(() => {
    if (typeof onRefresh === "function") {
      return onRefresh();
    }

    return undefined;
  }, [onRefresh]);

  const headerTitle = ROLE_LABELS[role] || "School workspace";

  const headerDescription =
    ROLE_DESCRIPTIONS[role] ||
    "Manage school operations from your Elimu workspace.";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <ElimuDashboardSidebar
          access={access}
          school={school}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
            <div className="flex min-h-[72px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  aria-label="Open navigation menu"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 lg:hidden"
                >
                  <Menu size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((value) => !value)}
                  aria-label={
                    sidebarCollapsed
                      ? "Expand navigation sidebar"
                      : "Collapse navigation sidebar"
                  }
                  className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 lg:inline-flex"
                >
                  <Menu size={19} />
                </button>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
                    {schoolName}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    {userName
                      ? `${userName} · ${ROLE_LABELS[role] || "School member"}`
                      : ROLE_LABELS[role] || "School workspace"}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleNavigate(
                      isDocumentCenter ? "elimu" : "elimu/documents"
                    )
                  }
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-900 dark:hover:bg-blue-950/30 dark:hover:text-blue-300 sm:px-4"
                >
                  <FileText size={16} />
                  <span className="hidden sm:inline">
                    {isDocumentCenter ? "Dashboard" : "Documents"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-900 dark:hover:bg-blue-950/30 dark:hover:text-blue-300 sm:px-4"
                >
                  <RefreshCw
                    size={16}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  <span className="hidden sm:inline">
                    {refreshing ? "Refreshing…" : "Refresh"}
                  </span>
                </button>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="mx-auto w-full max-w-[1600px] space-y-6">
              <ElimuDashboardHeader
                access={access}
                school={school}
                title={isDocumentCenter ? "School document centre" : headerTitle}
                description={
                  isDocumentCenter
                    ? "Prepare, submit and review school document records."
                    : headerDescription
                }
                onNavigate={handleNavigate}
                onRefresh={handleRefresh}
                refreshing={refreshing}
              />

              {!role && (
                <section
                  role="alert"
                  className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30"
                >
                  <AlertCircle
                    size={20}
                    className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300"
                  />

                  <div>
                    <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      School role unavailable
                    </h2>

                    <p className="mt-1 text-sm leading-5 text-amber-800 dark:text-amber-300">
                      Elimu could not identify your school role from the access
                      response. Refresh the workspace or verify the active
                      school membership. A role-specific dashboard cannot be
                      selected safely until the role is known.
                    </p>
                  </div>
                </section>
              )}

              {isDocumentCenter && role && (
                <ElimuDocumentCenter
                  access={access}
                  school={school}
                  role={role}
                  onNavigate={handleNavigate}
                />
              )}

              {!isDocumentCenter && RoleDashboard && (
                <RoleDashboard
                  access={access}
                  dashboard={unwrapResponse(dashboard)}
                  school={school}
                  onNavigate={handleNavigate}
                  currentPath={currentPath}
                  onRefresh={handleRefresh}
                  refreshing={refreshing}
                />
              )}

              {!RoleDashboard && role && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950 sm:p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    <AlertCircle size={24} />
                  </div>

                  <h2 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">
                    No dashboard is configured for this role
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                    The active school membership returned a role that does not
                    have a dedicated Elimu dashboard. Ask the school
                    administrator to verify your membership and permissions.
                  </p>
                </section>
              )}
            </div>
          </main>

          <footer className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>Elimu · School management workspace</span>
              <span>
                School records are governed by your account permissions.
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
