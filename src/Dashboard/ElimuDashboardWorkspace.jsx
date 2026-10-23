import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  FileUp,
  FolderOpen,
  Globe,
  LockKeyhole,
  LayoutDashboard,
  Menu,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  Wallet,
  Image as ImageIcon,
} from "lucide-react";

import ElimuDashboardHeader from "@/Dashboard/elimu/components/ElimuDashboardHeader.jsx";
import ElimuDashboardSidebar from "@/Dashboard/elimu/components/ElimuDashboardSidebar.jsx";

import ElimuOwnerDashboard from "@/Dashboard/elimu/ElimuOwnerDashboard.jsx";
import ElimuPrincipalDashboard from "@/Dashboard/elimu/ElimuPrincipalDashboard.jsx";
import ElimuBursarDashboard from "@/Dashboard/elimu/ElimuBursarDashboard.jsx";
import ElimuRegistrarDashboard from "@/Dashboard/elimu/ElimuRegistrarDashboard.jsx";
import ElimuTeacherDashboard from "@/Dashboard/elimu/ElimuTeacherDashboard.jsx";
import ElimuMediaManager from "@/Dashboard/elimu/ElimuMediaManager.jsx";
import ElimuWebsiteSettings from "@/Dashboard/elimu/ElimuWebsiteSettings.jsx";
import ElimuPortalRequests from "@/Dashboard/elimu/ElimuPortalRequests.jsx";
import ElimuModuleWorkspace, { getElimuModuleMeta } from "@/Dashboard/elimu/ElimuModuleWorkspace.jsx";
import ElimuStaffManagement from "@/Dashboard/elimu/ElimuStaffManagement.jsx";
import ElimuInventoryWorkspace from "@/Dashboard/elimu/ElimuInventoryWorkspace.jsx";
import ElimuLibraryWorkspace from "@/Dashboard/elimu/ElimuLibraryWorkspace.jsx";
import ElimuExamCentre from "@/Dashboard/elimu/ElimuExamCentre.jsx";
import ElimuFinanceReportsWorkspace from "@/Dashboard/elimu/ElimuFinanceReportsWorkspace.jsx";
import { ElimuLibrarianDashboard, ElimuStorekeeperDashboard } from "@/Dashboard/elimu/ElimuResourceRoleDashboards.jsx";

import { useElimuApi } from "@/services/elimuApi.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

const ROLE_LABELS = {
  owner: "Owner / School Director",
  principal: "Principal",
  bursar: "Bursar",
  registrar: "Registrar",
  teacher: "Teacher",
  storekeeper: "Storekeeper",
  librarian: "School Librarian",
};

const ROLE_DESCRIPTIONS = {
  owner:
    "Oversee school operations, staff, academic performance and finances.",
  principal:
    "Coordinate school operations, academic delivery and staff performance.",
  bursar:
    "Manage fee records, payment claims, reconciliation and financial reports only.",
  registrar:
    "Manage admissions, enrolment, school forms and official records.",
  teacher:
    "Manage assigned classes, lessons, attendance and learner assessments.",
  storekeeper:
    "Maintain stock quantities and submit school supply needs for Principal approval.",
  librarian:
    "Maintain the school library catalogue and book issue/return register.",
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
  if (!response || typeof response !== "object") {
    return response;
  }

  return response.data && typeof response.data === "object"
    ? response.data
    : response;
}

function getArray(response, keys = []) {
  const data = unwrapResponse(response);

  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  for (const key of keys) {
    if (Array.isArray(data?.data?.[key])) {
      return data.data[key];
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

    if (
      value === "owner" ||
      value.includes("school owner") ||
      value.includes("director")
    ) {
      return "owner";
    }

    if (value.includes("principal")) {
      return "principal";
    }

    if (value.includes("bursar") || value.includes("finance")) {
      return "bursar";
    }

    if (
      value.includes("registrar") ||
      value.includes("admission")
    ) {
      return "registrar";
    }

    if (value.includes("storekeeper") || value.includes("store keeper")) {
      return "storekeeper";
    }

    if (value.includes("librarian") || value.includes("school library")) {
      return "librarian";
    }

    if (
      value.includes("teacher") ||
      value.includes("educator")
    ) {
      return "teacher";
    }
  }

  return "";
}

function normalizePath(path) {
  return String(path || "")
    .split("?")[0]
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();
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
  return (
    school?.school_code ||
    school?.code ||
    school?.schoolCode ||
    ""
  );
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
    case "storekeeper":
      return ElimuStorekeeperDashboard;
    case "librarian":
      return ElimuLibrarianDashboard;
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

function canAccessRoleRoute(role, path) {
  let normalized = normalizePath(path);
  const marker = normalized.lastIndexOf("elimu");
  if (marker > 0) normalized = normalized.slice(marker);
  if (!normalized || normalized === "dashboard") normalized = "elimu";
  if (!normalized.startsWith("elimu/") && normalized !== "elimu") {
    normalized = "elimu/" + normalized.replace(/^\/+/, "");
  }

  if (!role || role === "owner" || role === "principal") return true;
  if (normalized === "elimu") return true;

  const allowed = {
    bursar: ["elimu/fees", "elimu/reports/fees"],
    storekeeper: ["elimu/inventory"],
    librarian: ["elimu/library"],
    registrar: [
      "elimu/students", "elimu/classes", "elimu/lessons",
      "elimu/assignments", "elimu/assessments", "elimu/exams",
      "elimu/attendance", "elimu/timetable", "elimu/cbc",
      "elimu/reports", "elimu/documents", "elimu/calendar",
    ],
    teacher: [
      "elimu/students", "elimu/classes", "elimu/lessons",
      "elimu/assignments", "elimu/assessments", "elimu/attendance",
      "elimu/timetable", "elimu/cbc", "elimu/reports", "elimu/documents",
      "elimu/calendar",
    ],
  };

  const denied = {
    registrar: ["elimu/fees", "elimu/reports/fees", "elimu/inventory", "elimu/library", "elimu/staff", "elimu/settings", "elimu/sync", "elimu/automation", "elimu/website", "elimu/media", "elimu/portal-requests"],
    teacher: ["elimu/fees", "elimu/reports/fees", "elimu/inventory", "elimu/library", "elimu/staff", "elimu/settings", "elimu/sync", "elimu/automation", "elimu/website", "elimu/media", "elimu/portal-requests"],
    bursar: ["elimu/staff", "elimu/students", "elimu/classes", "elimu/lessons", "elimu/assignments", "elimu/assessments", "elimu/exams", "elimu/attendance", "elimu/timetable", "elimu/cbc", "elimu/calendar", "elimu/documents", "elimu/inventory", "elimu/library", "elimu/sync", "elimu/automation", "elimu/settings", "elimu/website", "elimu/media", "elimu/portal-requests"],
    storekeeper: ["elimu/staff", "elimu/students", "elimu/classes", "elimu/lessons", "elimu/assignments", "elimu/assessments", "elimu/exams", "elimu/attendance", "elimu/timetable", "elimu/cbc", "elimu/fees", "elimu/reports", "elimu/calendar", "elimu/documents", "elimu/library", "elimu/sync", "elimu/automation", "elimu/settings", "elimu/website", "elimu/media", "elimu/portal-requests"],
    librarian: ["elimu/staff", "elimu/students", "elimu/classes", "elimu/lessons", "elimu/assignments", "elimu/assessments", "elimu/exams", "elimu/attendance", "elimu/timetable", "elimu/cbc", "elimu/fees", "elimu/reports", "elimu/calendar", "elimu/documents", "elimu/inventory", "elimu/sync", "elimu/automation", "elimu/settings", "elimu/website", "elimu/media", "elimu/portal-requests"],
  };

  if ((denied[role] || []).some((root) => normalized === root || normalized.startsWith(root + "/"))) return false;
  return (allowed[role] || []).some((root) => normalized === root || normalized.startsWith(root + "/"));
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
  return (
    document?.title ||
    document?.name ||
    document?.filename ||
    "Untitled document"
  );
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

  if (
    normalized?.success === false ||
    normalized?.ok === false
  ) {
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
    return DOCUMENT_CATEGORIES.filter(
      (item) => item.value === "fees"
    );
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

function ElimuDocumentCenter({
  access,
  school,
  role,
  onNavigate,
}) {
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
  const [selectedFile, setSelectedFile] = useState(null);

  const schoolId = getSchoolId(school);
  const schoolCode = getSchoolCode(school);

  const canSubmit = [
    "owner",
    "principal",
    "registrar",
    "teacher",
    "bursar",
  ].includes(role);

  const categoryOptions = useMemo(
    () => getCategoryOptions(role),
    [role]
  );

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
      // Try the available authentication state and token cache.
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

      if (json) {
        headers["Content-Type"] = "application/json";
      }

      const token = await getToken();

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      return headers;
    },
    [getToken]
  );

  const schoolQuery = useMemo(() => {
    const params = new URLSearchParams();

    if (schoolId) {
      params.set("school_id", String(schoolId));
    } else if (schoolCode) {
      params.set("school_code", String(schoolCode));
    }

    return params.toString();
  }, [schoolId, schoolCode]);

  const manageUrl = useMemo(() => {
    const base = `${BACKEND_URL}${ELIMU_API_PREFIX}/documents/manage`;

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
        getArray(data, [
          "documents",
          "items",
          "results",
          "records",
        ])
      );
    } catch (manageError) {
      if (
        manageError?.status === 401 ||
        manageError?.status === 403
      ) {
        setManagementBlocked(true);
      }

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
          getArray(publicResponse, [
            "documents",
            "items",
            "results",
          ])
        );

        if (manageError?.status === 403) {
          setNotice(
            "Your current role cannot access the private document-management endpoint. Showing publicly approved documents only."
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

    if (name === "downloadUrl" && value.trim()) {
      setSelectedFile(null);
    }

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

    if (!selectedFile && !downloadUrlValue) {
      setError("Choose a document file to upload or enter an HTTPS document URL.");
      return;
    }

    if (!selectedFile) {
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
    }

    if (!schoolId && !schoolCode) {
      setError(
        "The active school could not be identified. Refresh the workspace or verify the school membership."
      );
      return;
    }

    setSubmitting(true);

    try {
      if (selectedFile) {
        const upload = new FormData();
        upload.append("file", selectedFile);
        upload.append("title", title);
        upload.append("description", description);
        upload.append("category", form.category);
        await elimuApi.uploadSchoolDocument(upload);
      } else {
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
            filename: "",
            file_type: "",
            school_id: schoolId || undefined,
            school_code: schoolCode || undefined,
            status: "draft",
            is_public: false,
          }),
        });
        await responseMessage(response);
      }

      setForm((current) => ({
        ...current,
        title: "",
        description: "",
        downloadUrl: "",
      }));
      setSelectedFile(null);
      setNotice(
        selectedFile
          ? "File uploaded successfully and submitted as a private draft for owner review."
          : "Document link submitted successfully as a draft for owner review."
      );
      await loadDocuments();
    } catch (submitError) {
      if (submitError?.status === 401 || submitError?.status === 403) {
        setManagementBlocked(true);
        setError(
          "The backend denied this document submission. Verify that your active school membership is valid."
        );
      } else if (submitError?.status === 404 || submitError?.status === 405) {
        setError(
          "The document upload or submission endpoint is unavailable on this backend deployment. Confirm that the latest Elimu backend is deployed."
        );
      } else {
        setError(
          submitError?.message ||
            "The document could not be submitted. Verify the file or URL and try again."
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
              Prepare school forms, notices, calendars, fee structures
              and supporting resources. Every submission must follow
              the school&apos;s review and publication permissions.
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
                The screen does not bypass school access controls.
                The backend must authorize submissions according to
                each user&apos;s active school membership. Publication
                must remain under the control of the owner or another
                authorized reviewer.
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
                  <option
                    key={category.value}
                    value={category.value}
                  >
                    {category.label}
                  </option>
                ))}
              </select>

              {role === "registrar" && (
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Use this area for official forms, notices, school
                  calendars and other registrar-managed records.
                </p>
              )}

              {role === "bursar" && (
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  This role is restricted in the interface to fee
                  documents. Confidential fee statements must not be
                  published here.
                </p>
              )}

              {role === "teacher" && (
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Teacher-submitted resources should remain private
                  until the school completes its review.
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

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="elimu-document-file"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Upload a file from this device
                </label>
                <input
                  id="elimu-document-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt"
                  disabled={submitting}
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    event.currentTarget.value = "";
                    if (file) {
                      setSelectedFile(file);
                      setForm((current) => ({ ...current, downloadUrl: "" }));
                    }
                  }}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:file:bg-blue-950/50 dark:file:text-blue-300"
                />
                {selectedFile && (
                  <div className="mt-2 flex items-start justify-between gap-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
                    <span className="min-w-0 break-words">Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    <button type="button" onClick={() => setSelectedFile(null)} className="shrink-0 font-semibold underline">Remove</button>
                  </div>
                )}
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  PDF, Word, Excel, PowerPoint, CSV or TXT. Maximum size: 25 MB. Files are stored securely and submitted as private drafts for review.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                Or use an existing link
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>

              <div>
                <label
                  htmlFor="elimu-document-url"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  HTTPS document URL {!selectedFile ? "(choose a file above or enter a URL)" : "(not needed when uploading a file)"}
                </label>
                <input
                  id="elimu-document-url"
                  name="downloadUrl"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  required={!selectedFile}
                  value={form.downloadUrl}
                  onChange={updateField}
                  placeholder="https://approved-storage.example/document.pdf"
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  External links must use HTTPS and a storage host approved by the backend. Choose either a file or a link.
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-2">
                <ShieldCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                />

                <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                  Submissions are requested as drafts. The backend
                  remains responsible for enforcing document status
                  and publication permissions.
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
                  Submitting documentâ€¦
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
              {documents.length}{" "}
              {documents.length === 1 ? "record" : "records"}
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

                const documentDate =
                  document.published_at ||
                  document.updated_at ||
                  document.created_at;

                return (
                  <article
                    key={
                      id ||
                      `${document.title || "document"}-${index}`
                    }
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
                          {String(
                            document.category || "document"
                          ).replace(/[_-]+/g, " ")}
                        </span>

                        <span
                          className={`rounded-md px-2 py-1 text-[11px] font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>

                        {formatDocumentDate(documentDate) && (
                          <span className="text-[11px] text-slate-400">
                            {formatDocumentDate(documentDate)}
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
                Existing documents will appear here when the backend
                returns them for your account.
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
              Public school forms and official notices may be published
              after approval. Student report cards, individual fee
              statements, personal records and other confidential
              documents must use authenticated, school-scoped endpoints.
              They must never be exposed through the public document
              library.
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
  const [routeAccessError, setRouteAccessError] = useState("");

  const role = useMemo(
    () => normalizeRole(access),
    [access]
  );

  const unwrappedDashboard = unwrapResponse(dashboard);

  const school = useMemo(
    () => getSchool(access, unwrappedDashboard),
    [access, unwrappedDashboard]
  );

  const schoolName = getSchoolName(school);

  const userName = getCurrentUserName(
    access,
    unwrappedDashboard
  );

  const RoleDashboard = getRoleDashboard(role);

  const normalizedPath = normalizePath(currentPath);
  const canAccessCurrentPath = canAccessRoleRoute(role, normalizedPath);
  const isRoleAccessDenied = Boolean(role && !canAccessCurrentPath);

  const isDocumentCenter =
    normalizedPath === "elimu/documents" ||
    normalizedPath === "documents" ||
    normalizedPath.endsWith("/elimu/documents");

  const isMediaCenter =
    normalizedPath === "elimu/media" ||
    normalizedPath === "media" ||
    normalizedPath.endsWith("/elimu/media");

  const isWebsiteCenter =
    normalizedPath === "elimu/website" ||
    normalizedPath === "website" ||
    normalizedPath.endsWith("/elimu/website");

  const isPortalRequestsCenter =
    normalizedPath === "elimu/portal-requests" ||
    normalizedPath === "portal-requests" ||
    normalizedPath.endsWith("/elimu/portal-requests");
  const isExamCenter = normalizedPath === "elimu/exams" || normalizedPath === "exams" || normalizedPath.endsWith("/elimu/exams");
  const isInventoryCenter = normalizedPath === "elimu/inventory" || normalizedPath === "inventory" || normalizedPath.endsWith("/elimu/inventory");
  const isLibraryCenter = normalizedPath === "elimu/library" || normalizedPath === "library" || normalizedPath.endsWith("/elimu/library");
  const isFinanceReportsCenter = normalizedPath === "elimu/reports/fees" || normalizedPath === "reports/fees" || normalizedPath.endsWith("/elimu/reports/fees");

  const moduleMeta = getElimuModuleMeta(normalizedPath);
  const isModuleCenter = !isWebsiteCenter && Boolean(moduleMeta);

  const canManageMedia =
    role === "owner" || role === "principal";

  const handleNavigate = useCallback(
    (path) => {
      if (!canAccessRoleRoute(role, path)) {
        setRouteAccessError("Your Elimu role cannot open that workspace. The active school role only exposes its assigned modules.");
        setMobileSidebarOpen(false);
        return;
      }
      setRouteAccessError("");
      if (typeof onNavigate === "function") {
        onNavigate(path);
      }
      setMobileSidebarOpen(false);
    },
    [onNavigate, role]
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

  // The workspace supports dedicated pages as well as role dashboards.
  // Never fall through to the same dashboard when a module path is active.
  const isSpecialCenter =
    isRoleAccessDenied || isDocumentCenter || isMediaCenter || isWebsiteCenter || isPortalRequestsCenter || isExamCenter || isInventoryCenter || isLibraryCenter || isFinanceReportsCenter || isModuleCenter;

  const centerTitle = isRoleAccessDenied
    ? "Workspace access restricted"
    : isFinanceReportsCenter
      ? "Financial reports"
      : isExamCenter
        ? "Exam Centre"
        : isInventoryCenter
          ? "Inventory & stores"
          : isLibraryCenter
            ? "School library"
            : isPortalRequestsCenter
              ? "Portal verification requests"
              : isWebsiteCenter
                ? "Public school website"
                : isMediaCenter
                  ? "School photos and videos"
                  : isDocumentCenter
                    ? "School document centre"
                    : moduleMeta?.title || "School workspace";

  const centerDescription = isRoleAccessDenied
    ? "This page is outside the permissions assigned to your active school role."
    : isFinanceReportsCenter
      ? "View school fee totals, recorded payments and outstanding balances only."
      : isExamCenter
        ? "Access assessment records, report-card generation and publication controls."
        : isInventoryCenter
          ? "Track school stock, record receipts and issues, and manage Principal-approved supply needs."
          : isLibraryCenter
            ? "Manage the school book catalogue, check-outs and returns."
            : isPortalRequestsCenter
              ? "Verify student and guardian links before private school records become available."
              : isWebsiteCenter
                ? "Edit the public school page and publish verified school information."
                : isMediaCenter
                  ? "Upload, organize and manage approved media for the school's public page."
                  : isDocumentCenter
                    ? "Prepare, submit and review school document records."
                    : moduleMeta?.description || "Manage school operations from your Elimu workspace.";

  const headerActionPath = isSpecialCenter
    ? "elimu"
    : role === "bursar"
      ? "elimu/reports/fees"
      : "elimu/documents";

  const headerActionLabel = isSpecialCenter
    ? "Dashboard"
    : role === "bursar"
      ? "Financial reports"
      : "Documents";

  const HeaderActionIcon = isWebsiteCenter
    ? Globe
    : isMediaCenter
      ? ImageIcon
      : isSpecialCenter
        ? LayoutDashboard
        : role === "bursar"
          ? Wallet
          : FileText;

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
                  onClick={() =>
                    setSidebarCollapsed((value) => !value)
                  }
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
                      ? `${userName} Â· ${
                          ROLE_LABELS[role] || "School member"
                        }`
                      : ROLE_LABELS[role] || "School workspace"}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleNavigate(headerActionPath)}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-900 dark:hover:bg-blue-950/30 dark:hover:text-blue-300 sm:px-4"
                >
                  <HeaderActionIcon size={16} />
                  <span className="hidden sm:inline">
                    {headerActionLabel}
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
                    {refreshing ? "Refreshingâ€¦" : "Refresh"}
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
                title={isSpecialCenter ? centerTitle : headerTitle}
                description={isSpecialCenter ? centerDescription : headerDescription}
                onNavigate={handleNavigate}
                onRefresh={handleRefresh}
                refreshing={refreshing}
              />

              {routeAccessError && !isRoleAccessDenied && (
                <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{routeAccessError}</div>
              )}

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
                      Elimu could not identify your role from the access
                      response. Refresh the workspace or verify the
                      active school membership. A role-specific
                      dashboard cannot be selected safely until the
                      role is known.
                    </p>
                  </div>
                </section>
              )}

              {isRoleAccessDenied && role && (
                <section role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/30">
                  <div className="flex items-start gap-3">
                    <LockKeyhole size={22} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" />
                    <div>
                      <h2 className="font-bold text-amber-950 dark:text-amber-200">This workspace is not assigned to your role</h2>
                      <p className="mt-2 text-sm leading-6 text-amber-900 dark:text-amber-300">Your active Elimu role is <strong>{ROLE_LABELS[role] || role}</strong>. This page has not been opened. Return to your dashboard to continue with your assigned tasks.</p>
                      <button type="button" onClick={() => handleNavigate("elimu")} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-amber-800 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-900">Return to dashboard <ArrowRight size={15} /></button>
                    </div>
                  </div>
                </section>
              )}

              {isDocumentCenter && role && canAccessCurrentPath && (
                <ElimuDocumentCenter
                  access={access}
                  school={school}
                  role={role}
                  onNavigate={handleNavigate}
                />
              )}

              {isPortalRequestsCenter && role === "owner" && canAccessCurrentPath && (
                <ElimuPortalRequests />
              )}

              {isPortalRequestsCenter && role && canAccessCurrentPath && role !== "owner" && (
                <section role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">Only the verified school owner can review portal verification requests.</section>
              )}

              {isWebsiteCenter && role === "owner" && canAccessCurrentPath && (
                <ElimuWebsiteSettings
                  access={access}
                  school={school}
                  onNavigate={handleNavigate}
                />
              )}

              {isWebsiteCenter && role && canAccessCurrentPath && role !== "owner" && (
                <section
                  role="alert"
                  className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
                >
                  Only the verified school owner can configure and publish the public website.
                </section>
              )}

              {isMediaCenter && role && canAccessCurrentPath && (
                canManageMedia ? (
                  <ElimuMediaManager
                    access={access}
                    school={school}
                    role={role}
                    onNavigate={handleNavigate}
                  />
                ) : (
                  <section
                    role="alert"
                    className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/60 dark:bg-amber-950/30"
                  >
                    <div className="flex items-start gap-3">
                      <LockKeyhole
                        size={22}
                        className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300"
                      />

                      <div>
                        <h2 className="text-base font-bold text-amber-950 dark:text-amber-200">
                          Media management restricted
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-amber-900 dark:text-amber-300">
                          Only the school owner and authorized principal
                          can access this media-management screen.
                        </p>

                        <button
                          type="button"
                          onClick={() => handleNavigate("elimu")}
                          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-800 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-900"
                        >
                          Return to dashboard
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  </section>
                )
              )}

              {isFinanceReportsCenter && role && canAccessCurrentPath && (
                <ElimuFinanceReportsWorkspace school={school} onNavigate={handleNavigate} />
              )}

              {isExamCenter && role && canAccessCurrentPath && (
                <ElimuExamCentre role={role} school={school} onNavigate={handleNavigate} />
              )}

              {isInventoryCenter && role && canAccessCurrentPath && (
                <ElimuInventoryWorkspace role={role} access={access} school={school} onNavigate={handleNavigate} />
              )}

              {isLibraryCenter && role && canAccessCurrentPath && (
                <ElimuLibraryWorkspace role={role} access={access} school={school} />
              )}

              {isModuleCenter && role && canAccessCurrentPath && !isExamCenter && !isInventoryCenter && !isLibraryCenter && (
                (normalizedPath === "elimu/staff" || normalizedPath === "staff") ? (
                  <ElimuStaffManagement
                    access={access}
                    school={school}
                    role={role}
                    onNavigate={handleNavigate}
                  />
                ) : (
                  <ElimuModuleWorkspace
                    path={normalizedPath}
                    role={role}
                    access={access}
                    school={school}
                    onNavigate={handleNavigate}
                  />
                )
              )}

              {!isSpecialCenter && RoleDashboard && (
                <RoleDashboard
                  access={access}
                  dashboard={unwrappedDashboard}
                  school={school}
                  onNavigate={handleNavigate}
                  currentPath={currentPath}
                  onRefresh={handleRefresh}
                  refreshing={refreshing}
                />
              )}

              {!isSpecialCenter && !RoleDashboard && role && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950 sm:p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    <AlertCircle size={24} />
                  </div>

                  <h2 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">
                    No dashboard is configured for this role
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                    The active school membership returned a role that
                    does not have a dedicated Elimu dashboard. Ask the
                    school administrator to verify your membership and
                    permissions.
                  </p>
                </section>
              )}
            </div>
          </main>

          <footer className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>Elimu Â· School management workspace</span>

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
