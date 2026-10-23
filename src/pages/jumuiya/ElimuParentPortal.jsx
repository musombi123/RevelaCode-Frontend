
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  LockKeyhole,
  LogIn,
  Plus,
  RefreshCw,
  School,
  ShieldCheck,
  User,
  Users,
  Wallet,
  AlertCircle,
  X,
} from "lucide-react";

const DEFAULT_BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://revelacode-backend.onrender.com";

const API_BASE = `${DEFAULT_BACKEND_URL.replace(/\/+$/, "")}/api/jumuiya/elimu/parent`;

const INITIAL_LINK_FORM = {
  school_slug: "",
  student_identifier: "",
  guardian_phone: "",
  guardian_email: "",
  relationship: "parent",
  notes: "",
};

function unwrapResponse(payload) {
  if (!payload || typeof payload !== "object") return payload;
  return payload.data && typeof payload.data === "object"
    ? payload.data
    : payload;
}

function getArray(payload, keys = []) {
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  return Array.isArray(payload) ? payload : [];
}

function getErrorMessage(payload, fallback) {
  const candidates = [
    payload?.message,
    payload?.error?.message,
    payload?.error,
    payload?.detail,
  ];
  const message = candidates.find(
    (value) => typeof value === "string" && value.trim(),
  );
  return message || fallback;
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatKES(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "Not available";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getStudentId(student) {
  return String(student?.id || student?._id || student?.student_id || "");
}

function getStudentName(student) {
  return (
    student?.display_name ||
    student?.full_name ||
    student?.name ||
    "Linked student"
  );
}

function getLinkStatus(student) {
  return String(
    student?.link_status ||
      student?.verification_status ||
      student?.status ||
      "pending"
  ).toLowerCase();
}

function isVerified(student) {
  return ["verified", "approved", "active"].includes(
    getLinkStatus(student)
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "pending").toLowerCase();

  const config = {
    verified: {
      label: "Verified",
      className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
      icon: CheckCircle2,
    },
    approved: {
      label: "Verified",
      className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
      icon: CheckCircle2,
    },
    active: {
      label: "Verified",
      className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
      icon: CheckCircle2,
    },
    pending: {
      label: "Pending review",
      className: "bg-amber-50 text-amber-800 ring-amber-200",
      icon: Clock,
    },
    rejected: {
      label: "Not verified",
      className: "bg-rose-50 text-rose-800 ring-rose-200",
      icon: AlertCircle,
    },
    denied: {
      label: "Not verified",
      className: "bg-rose-50 text-rose-800 ring-rose-200",
      icon: AlertCircle,
    },
  };

  const item = config[normalized] || config.pending;
  const Icon = item.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${item.className}`}
    >
      <Icon size={13} />
      {item.label}
    </span>
  );
}

function SectionTitle({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-3 border-l-2 border-emerald-600 pl-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-emerald-700">
            {eyebrow}
          </p>
        )}

        <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
          {title}
        </h2>

        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

function EmptyPanel({ icon: Icon = Users, title, description, action }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300/90 bg-gradient-to-br from-white to-emerald-50/40 px-6 py-10 text-center shadow-sm ring-1 ring-slate-950/[0.025]">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-md ring-1 ring-emerald-700/10">
        <Icon size={22} />
      </div>

      <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function StudentCard({ student, selected, onSelect }) {
  const verified = isVerified(student);

  return (
    <button
      type="button"
      onClick={() => onSelect(student)}
      className={`group w-full rounded-3xl border p-4 text-left shadow-sm transition duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:p-5 ${
        selected
          ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-white shadow-lg shadow-emerald-900/10 ring-2 ring-emerald-100"
          : "border-slate-200/90 bg-white hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-slate-900/[0.07]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-800 ring-1 ring-emerald-800/10 transition duration-300 group-hover:scale-105">
          <GraduationCap size={23} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-slate-950">
            {getStudentName(student)}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            {student?.class_name ||
              student?.class ||
              student?.grade ||
              "Class not provided"}
          </p>

          <div className="mt-3">
            <StatusBadge status={getLinkStatus(student)} />
          </div>
        </div>

        <ChevronRight
          size={19}
          className={selected ? "text-emerald-700" : "text-slate-400"}
        />
      </div>

      {!verified && (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
          Private records remain locked until the school verifies this link.
        </p>
      )}
    </button>
  );
}

function DetailCard({ icon: Icon, title, description, onClick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group flex w-full items-start gap-4 rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white to-emerald-50/30 p-4 text-left shadow-sm ring-1 ring-slate-950/[0.025] transition duration-300 ease-out hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-slate-900/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:p-5"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
        <Icon size={21} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <ChevronRight
        size={18}
        className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700"
      />
    </button>
  );
}

export default function ElimuParentPortal({
  schoolSlug = "",
  getAuthHeaders,
  onBack,
  onLoginRequired,
}) {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [selectedSection, setSelectedSection] = useState("overview");

  const [form, setForm] = useState({
    ...INITIAL_LINK_FORM,
    school_slug: schoolSlug,
  });

  const [showLinkForm, setShowLinkForm] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [submittingLink, setSubmittingLink] = useState(false);
  const [loadingSection, setLoadingSection] = useState(false);

  const [sectionData, setSectionData] = useState(null);
  const [pageError, setPageError] = useState("");
  const [sectionError, setSectionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [authRequired, setAuthRequired] = useState(false);

  const selectedChild = useMemo(
    () =>
      children.find(
        (child) => getStudentId(child) === selectedChildId
      ) || null,
    [children, selectedChildId]
  );

  const verifiedChildren = useMemo(
    () => children.filter(isVerified),
    [children]
  );

  const pendingChildren = useMemo(
    () => children.filter((child) => !isVerified(child)),
    [children]
  );

  const request = useCallback(
    async (path, options = {}) => {
      const extraHeaders = getAuthHeaders
        ? await getAuthHeaders()
        : {};

      const response = await fetch(`${API_BASE}${path}`, {
        method: options.method || "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...(extraHeaders || {}),
          ...(options.headers || {}),
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
      });

      let payload = {};

      try {
        payload = unwrapResponse(await response.json());
      } catch {
        payload = {};
      }

      if (response.status === 401) {
        setAuthRequired(true);
        throw new Error(
          "Please sign in to access your parent portal."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "Your account does not have permission to access this resource."
        );
      }

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            `The request failed with status ${response.status}.`
          )
        );
      }

      return payload;
    },
    [getAuthHeaders]
  );

  const downloadCompletionCertificate = useCallback(async () => {
    const studentId = getStudentId(selectedChild);
    if (!studentId) return;
    setSectionError("");
    try {
      const extraHeaders = getAuthHeaders ? await getAuthHeaders() : {};
      const response = await fetch(`${API_BASE}/children/${encodeURIComponent(studentId)}/completion-certificate`, {
        method: "GET",
        credentials: "include",
        headers: { ...(extraHeaders || {}), Accept: "application/pdf" },
      });
      if (!response.ok) {
        let message = "The completion certificate could not be downloaded.";
        try { const payload = await response.json(); message = getErrorMessage(unwrapResponse(payload), message); } catch { /* PDF error bodies may not be JSON. */ }
        throw new Error(message);
      }
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${String(selectedChild?.admission_number || studentId).replace(/[^A-Za-z0-9_-]/g, "-")}-completion-certificate.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);
      setSuccessMessage("Completion certificate downloaded.");
    } catch (error) {
      setSectionError(error?.message || "The completion certificate could not be downloaded.");
    }
  }, [getAuthHeaders, selectedChild]);

  const loadChildren = useCallback(async () => {
    setLoadingChildren(true);
    setPageError("");
    setSuccessMessage("");

    try {
      const payload = await request("/children");
      const records = getArray(payload, ["children", "items", "results"]);

      setChildren(records);

      setSelectedChildId((current) => {
        if (
          current &&
          records.some((child) => getStudentId(child) === current)
        ) {
          return current;
        }

        const firstVerified = records.find(isVerified);
        return firstVerified ? getStudentId(firstVerified) : "";
      });
    } catch (error) {
      setChildren([]);
      setSelectedChildId("");
      setPageError(error.message || "Unable to load linked children.");
    } finally {
      setLoadingChildren(false);
    }
  }, [request]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  const submitChildLink = async (event) => {
    event.preventDefault();
    setPageError("");
    setSuccessMessage("");

    const school = form.school_slug.trim();
    const identifier = form.student_identifier.trim();
    const guardianPhone = form.guardian_phone.trim();
    const guardianEmail = form.guardian_email.trim();

    if (!school || !identifier) {
      setPageError(
        "Enter the school's identifier and the student's admission or school-issued identifier."
      );
      return;
    }
    if (!guardianPhone && !guardianEmail) {
      setPageError("Enter the guardian phone or email already registered with the school.");
      return;
    }

    setSubmittingLink(true);

    try {
      const payload = await request("/children/link", {
        method: "POST",
        body: {
          school_slug: school,
          student_identifier: identifier,
          guardian_phone: guardianPhone,
          guardian_email: guardianEmail,
          relationship: form.relationship,
          notes: form.notes.trim(),
        },
      });

      setSuccessMessage(
        payload?.message ||
          "If the details match the school's student and registered guardian-contact records, the request can proceed to school review. Private records remain locked until the school approves the link."
      );

      setForm({
        ...INITIAL_LINK_FORM,
        school_slug: schoolSlug || school,
      });

      setShowLinkForm(false);
      await loadChildren();
    } catch (error) {
      setPageError(
        error.message || "Unable to submit the child-link request."
      );
    } finally {
      setSubmittingLink(false);
    }
  };

  const openChildSection = async (section) => {
    if (!selectedChild) return;

    if (!isVerified(selectedChild)) {
      setSectionError(
        "This child's link has not been verified. Private records are locked until verification is complete."
      );
      return;
    }

    const childId = getStudentId(selectedChild);

    if (!childId) {
      setSectionError(
        "The backend did not return a valid linked-student identifier."
      );
      return;
    }

    setSelectedSection(section);
    setSectionData(null);
    setSectionError("");
    setLoadingSection(true);

    try {
      const encodedId = encodeURIComponent(childId);

      let path;

      if (section === "profile") {
        path = `/children/${encodedId}`;
      } else if (section === "documents") {
        path = `/children/${encodedId}/documents`;
      } else if (section === "finance") {
        path = `/children/${encodedId}/finance`;
      } else {
        path = `/children/${encodedId}`;
      }

      const payload = await request(path);
      setSectionData(payload);
    } catch (error) {
      setSectionError(
        error.message ||
          "Unable to load this student's information."
      );
    } finally {
      setLoadingSection(false);
    }
  };

  const submitInactivityResponse = useCallback(async (responseKind, notes) => {
    const studentId = getStudentId(selectedChild);
    if (!studentId) throw new Error("Select the student record first.");
    await request(`/children/${encodeURIComponent(studentId)}/inactivity-response`, {
      method: "POST",
      body: { response: responseKind, notes: String(notes || "").trim() },
    });
    setSuccessMessage("Your response has been sent to the school registrar for review.");
    await openChildSection("profile");
    await loadChildren();
  }, [request, selectedChild, openChildSection, loadChildren]);

  const returnToOverview = () => {
    setSelectedSection("overview");
    setSectionData(null);
    setSectionError("");
  };

  const handleLogin = () => {
    if (onLoginRequired) {
      onLoginRequired();
      return;
    }

    window.location.assign("/login");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-[#0A74DA]/5 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 shadow-sm shadow-slate-900/[0.04] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0A74DA] to-[#2E8B57] text-white shadow-md shadow-slate-900/10 ring-1 ring-white/20">
              <School size={23} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
                Jumuiya Elimu
              </p>
              <h1 className="truncate text-lg font-bold text-slate-950 sm:text-xl">
                Parent portal
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadChildren}
              disabled={loadingChildren}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#0A74DA]/35 hover:text-[#075EB0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A74DA] focus-visible:ring-offset-2 disabled:opacity-50 sm:px-4"
            >
              <RefreshCw
                size={16}
                className={loadingChildren ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A74DA] focus-visible:ring-offset-2"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Intro */}
        <section className="relative isolate overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-[#10304B] via-[#0A74DA] to-[#2E8B57] p-6 text-white shadow-2xl shadow-slate-950/15 ring-1 ring-white/10 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                <ShieldCheck size={14} />
                Secure family access
              </div>

              <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Your children's school life, in one place.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-emerald-50/85 sm:text-base">
                Link your children to your account, track verification, and
                access available school records securely once each relationship
                has been verified.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:min-w-[300px]">
              <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-4 shadow-lg shadow-slate-950/10 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/[0.12]">
                <Users size={20} className="text-emerald-200" />
                <p className="mt-4 text-2xl font-extrabold">
                  {loadingChildren ? "â€”" : children.length}
                </p>
                <p className="mt-1 text-xs text-emerald-100/80">
                  Linked children
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-4 shadow-lg shadow-slate-950/10 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/[0.12]">
                <CheckCircle2 size={20} className="text-emerald-200" />
                <p className="mt-4 text-2xl font-extrabold">
                  {loadingChildren ? "â€”" : verifiedChildren.length}
                </p>
                <p className="mt-1 text-xs text-emerald-100/80">
                  Verified links
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feedback */}
        {authRequired && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <LogIn size={20} className="mt-0.5 shrink-0 text-blue-700" />
              <div>
                <h2 className="font-semibold text-blue-950">
                  Sign in required
                </h2>
                <p className="mt-1 text-sm leading-6 text-blue-900">
                  Your account must be authenticated before you can manage
                  linked children or view private school records.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800"
            >
              Sign in
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {pageError && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4"
          >
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-700" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-rose-950">
                We couldn't complete that request
              </p>
              <p className="mt-1 break-words text-sm leading-6 text-rose-900">
                {pageError}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPageError("")}
              aria-label="Dismiss error"
              className="rounded-lg p-1 text-rose-700 hover:bg-rose-100"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
          >
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-700" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-950">
                Request submitted
              </p>
              <p className="mt-1 text-sm leading-6 text-emerald-900">
                {successMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              aria-label="Dismiss success message"
              className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Main content */}
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <section>
            <SectionTitle
              eyebrow="Family management"
              title="Your linked children"
              description="Each child has a separate verification status. Only verified links can open private records."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkForm((open) => !open);
                    setPageError("");
                    setSuccessMessage("");
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-extrabold text-white shadow-md shadow-emerald-950/10 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  {showLinkForm ? <X size={16} /> : <Plus size={16} />}
                  {showLinkForm ? "Close form" : "Link a child"}
                </button>
              }
            />

            {showLinkForm && (
              <form
                onSubmit={submitChildLink}
                className="mt-6 rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/30 p-5 shadow-lg shadow-emerald-950/[0.04] ring-1 ring-emerald-950/[0.025] sm:p-6"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                    <User size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-950">
                      Request child verification
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Enter the school identifier and the student's official
                      admission or school-issued identifier.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label
                      htmlFor="school-slug"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      School identifier
                    </label>

                    <input
                      id="school-slug"
                      name="school_slug"
                      autoComplete="off"
                      required
                      maxLength={120}
                      value={form.school_slug}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          school_slug: event.target.value,
                        }))
                      }
                      placeholder="Enter the school's public identifier"
                      className="w-full rounded-xl border border-slate-300/90 bg-white/90 px-3.5 py-3.5 text-sm shadow-sm outline-none transition duration-200 placeholder:text-slate-400 hover:border-emerald-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    />

                    <p className="mt-1.5 text-xs leading-5 text-slate-500">
                      Use the identifier supplied by the school. A public
                      profile slug is acceptable only if the backend supports
                      it for child-link requests.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="student-identifier"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Admission / student identifier
                    </label>

                    <input
                      id="student-identifier"
                      name="student_identifier"
                      autoComplete="off"
                      required
                      maxLength={120}
                      value={form.student_identifier}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          student_identifier: event.target.value,
                        }))
                      }
                      placeholder="Enter the official student identifier"
                      className="w-full rounded-xl border border-slate-300/90 bg-white/90 px-3.5 py-3.5 text-sm shadow-sm outline-none transition duration-200 placeholder:text-slate-400 hover:border-emerald-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="guardian-phone" className="mb-1.5 block text-sm font-semibold text-slate-700">Registered guardian phone</label>
                    <input id="guardian-phone" name="guardian_phone" type="tel" autoComplete="tel" maxLength={40} value={form.guardian_phone} onChange={(event) => setForm((current) => ({ ...current, guardian_phone: event.target.value }))} placeholder="Phone number registered with the school" className="w-full rounded-xl border border-slate-300/90 bg-white/90 px-3.5 py-3.5 text-sm shadow-sm outline-none transition duration-200 placeholder:text-slate-400 hover:border-emerald-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">Enter the contact already recorded on the student's school file. You can use phone, email, or both.</p>
                  </div>
                  <div>
                    <label htmlFor="guardian-email" className="mb-1.5 block text-sm font-semibold text-slate-700">Registered guardian email</label>
                    <input id="guardian-email" name="guardian_email" type="email" autoComplete="email" maxLength={254} value={form.guardian_email} onChange={(event) => setForm((current) => ({ ...current, guardian_email: event.target.value }))} placeholder="Email address registered with the school" className="w-full rounded-xl border border-slate-300/90 bg-white/90 px-3.5 py-3.5 text-sm shadow-sm outline-none transition duration-200 placeholder:text-slate-400 hover:border-emerald-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
                  </div>
                  <div>
                    <label
                      htmlFor="relationship"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Relationship to student
                    </label>

                    <select
                      id="relationship"
                      name="relationship"
                      value={form.relationship}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          relationship: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300/90 bg-white/90 px-3.5 py-3.5 text-sm shadow-sm outline-none transition duration-200 hover:border-emerald-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="parent">Parent</option>
                      <option value="guardian">Legal guardian</option>
                      <option value="caregiver">Authorized caregiver</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="link-notes"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Additional information (optional)
                    </label>

                    <textarea
                      id="link-notes"
                      name="notes"
                      rows={3}
                      maxLength={500}
                      value={form.notes}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      placeholder="Add a short note for the school verification team."
                      className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                  <p className="flex items-start gap-2 text-xs leading-5 text-amber-950">
                    <LockKeyhole size={15} className="mt-0.5 shrink-0" />
                    Submitting this form requests verification; it does not
                    grant access immediately. Do not enter passwords, PINs, or
                    unrelated sensitive information.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submittingLink || authRequired}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingLink ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Submitting requestâ€¦
                    </>
                  ) : (
                    <>
                      Submit verification request
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-5 space-y-3">
              {loadingChildren ? (
                [1, 2].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="h-4 w-36 rounded bg-slate-200" />
                    <div className="mt-4 h-3 w-24 rounded bg-slate-100" />
                    <div className="mt-4 h-6 w-28 rounded-full bg-slate-100" />
                  </div>
                ))
              ) : children.length ? (
                children.map((child) => (
                  <StudentCard
                    key={getStudentId(child)}
                    student={child}
                    selected={getStudentId(child) === selectedChildId}
                    onSelect={(student) => {
                      setSelectedChildId(getStudentId(student));
                      setSelectedSection("overview");
                      setSectionData(null);
                      setSectionError("");
                    }}
                  />
                ))
              ) : (
                <EmptyPanel
                  icon={Users}
                  title="No children linked yet"
                  description="Submit a request for each child. The school must verify each relationship before any private student information is shown."
                  action={
                    <button
                      type="button"
                      onClick={() => setShowLinkForm(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
                    >
                      <Plus size={16} />
                      Link your first child
                    </button>
                  }
                />
              )}
            </div>

            {!loadingChildren && pendingChildren.length > 0 && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-semibold text-amber-950">
                  Verification in progress
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-900">
                  {pendingChildren.length} link
                  {pendingChildren.length === 1 ? " is" : "s are"} awaiting
                  verification. Private student records remain unavailable
                  until the relevant school approves the relationship.
                </p>
              </div>
            )}
          </section>

          {/* Selected child area */}
          <section className="min-w-0">
            <SectionTitle
              eyebrow="Student workspace"
              title={
                selectedChild
                  ? getStudentName(selectedChild)
                  : "Student records"
              }
              description={
                selectedChild
                  ? "Choose a section to view the information your verified access permits."
                  : "Select a verified child to access their private school information."
              }
              action={
                selectedSection !== "overview" ? (
                  <button
                    type="button"
                    onClick={returnToOverview}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <ArrowLeft size={15} />
                    Overview
                  </button>
                ) : null
              }
            />

            {!selectedChild ? (
              <div className="mt-6">
                <EmptyPanel
                  icon={LockKeyhole}
                  title="Student records are locked"
                  description="Select a verified child from the list. If no child has been verified, submit a linking request and wait for the school's decision."
                />
              </div>
            ) : !isVerified(selectedChild) ? (
              <div className="mt-6 rounded-3xl border border-amber-200/80 bg-gradient-to-br from-white to-amber-50/50 p-6 shadow-lg shadow-amber-950/[0.04] sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                  <Clock size={24} />
                </div>

                <h3 className="mt-4 text-xl font-bold text-slate-950">
                  Waiting for school verification
                </h3>

                <p className="mt-2 text-sm leading-7 text-slate-600">
                  The request to link {getStudentName(selectedChild)} has not
                  been verified. Student profile, documents, and financial
                  information will remain locked until the backend confirms
                  the relationship.
                </p>

                <div className="mt-5">
                  <StatusBadge status={getLinkStatus(selectedChild)} />
                </div>

                <button
                  type="button"
                  onClick={loadChildren}
                  disabled={loadingChildren}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw size={16} />
                  Check verification status
                </button>
              </div>
            ) : selectedSection === "overview" ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-5 shadow-sm ring-1 ring-emerald-950/[0.025] sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                      <ShieldCheck size={22} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-emerald-950">
                          Verified child relationship
                        </h3>
                        <StatusBadge status="verified" />
                      </div>

                      <p className="mt-2 text-sm leading-6 text-emerald-900">
                        The backend reports this child as verified. You can
                        request the student information your account is
                        authorized to access.
                      </p>
                    </div>
                  </div>
                </div>

                <DetailCard
                  icon={GraduationCap}
                  title="Student profile"
                  description="View the student information permitted for your verified account."
                  onClick={() => openChildSection("profile")}
                />

                <DetailCard
                  icon={FileText}
                  title="Documents and reports"
                  description="Access documents and reports the school has made available to this parent."
                  onClick={() => openChildSection("documents")}
                />

                <DetailCard
                  icon={Wallet}
                  title="Fees and finance"
                  description="View authorized fee statements, balances, and payment records."
                  onClick={() => openChildSection("finance")}
                />

                <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm ring-1 ring-slate-950/[0.02]">
                  <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                    <LockKeyhole size={15} className="mt-0.5 shrink-0 text-emerald-700" />
                    Every private-data request must be authorized by the
                    backend. A verified link alone does not bypass other
                    account permissions.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-lg shadow-slate-900/[0.04] ring-1 ring-slate-950/[0.025] backdrop-blur-sm sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">
                      {selectedSection === "profile"
                        ? "Student information"
                        : selectedSection === "documents"
                        ? "Documents and reports"
                        : "Fees and finance"}
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-slate-950">
                      {selectedChild
                        ? getStudentName(selectedChild)
                        : "Student details"}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => openChildSection(selectedSection)}
                    disabled={loadingSection}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw
                      size={15}
                      className={loadingSection ? "animate-spin" : ""}
                    />
                    Refresh
                  </button>
                </div>

                {sectionError && (
                  <div
                    role="alert"
                    className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900"
                  >
                    {sectionError}
                  </div>
                )}

                {loadingSection ? (
                  <div className="flex items-center gap-3 py-12 text-sm text-slate-500">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
                    Loading authorized informationâ€¦
                  </div>
                ) : sectionData ? (
                  <PrivateSection
                    section={selectedSection}
                    data={sectionData}
                    request={request}
                    onReceiptSubmitted={() => openChildSection("finance")}
                    onDownloadCertificate={downloadCompletionCertificate}
                    onInactivityResponse={submitInactivityResponse}
                  />
                ) : !sectionError ? (
                  <EmptyPanel
                    icon={FileText}
                    title="No information loaded"
                    description="Select refresh to request the latest information from the school."
                  />
                ) : null}
              </div>
            )}
          </section>
        </div>

        <footer className="mt-12 border-t border-slate-200/80 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">
              Jumuiya Elimu Â· Family and school access
            </p>

            <p className="flex items-center gap-2 text-xs leading-5 text-slate-500">
              <ShieldCheck size={15} className="shrink-0 text-emerald-700" />
              Private records require authenticated, authorized access.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}

function PrivateSection({ section, data, request, onReceiptSubmitted, onDownloadCertificate, onInactivityResponse }) {
  const [receiptForm, setReceiptForm] = useState({ fee_id: "", amount: "", payment_method: "mpesa", payment_reference: "", receipt_url: "", notes: "" });
  const [receiptSubmitting, setReceiptSubmitting] = useState(false);
  const [receiptFeedback, setReceiptFeedback] = useState("");
  const [receiptError, setReceiptError] = useState("");
  const [lifecycleNotes, setLifecycleNotes] = useState("");
  const [lifecycleSubmitting, setLifecycleSubmitting] = useState(false);
  const [lifecycleError, setLifecycleError] = useState("");
  const record =
    data?.student ||
    data?.profile ||
    data?.finance ||
    data?.statement ||
    data;

  if (section === "documents") {
    const documents = getArray(data, ["documents", "items", "results"]);

    if (!documents.length) {
      return (
        <div className="mt-6">
          <EmptyPanel
            icon={FileText}
            title="No documents available"
            description="The school has not made any documents available in this section, or the response contains no documents."
          />
        </div>
      );
    }

    return (
      <div className="mt-6 space-y-3">
        {documents.map((document, index) => {
          const title =
            document.title ||
            document.name ||
            document.filename ||
            `Document ${index + 1}`;

          const url = document.download_url || document.url;

          return (
            <div
              key={document.id || document._id || index}
              className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:border-emerald-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <FileText size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold text-slate-900">
                  {title}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {document.document_type ||
                    document.category ||
                    "School document"}
                  {document.created_at
                    ? ` Â· ${formatDate(document.created_at)}`
                    : ""}
                </p>
              </div>

              {document.document_type === "completion_certificate" ? (
                <button type="button" onClick={() => onDownloadCertificate?.()} className="shrink-0 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800">Download PDF</button>
              ) : url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Open</a>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  if (section === "finance") {
    const fees = getArray(data, ["fees", "transactions", "items"]);
    const accounts = getArray(data, ["payment_accounts", "accounts"]).filter((account) => account?.active !== false);
    const totalDue = data?.total_due ?? data?.balance_due ?? data?.outstanding_balance;
    const totalPaid = data?.total_paid ?? data?.paid_amount;
    const payableFees = fees.filter((fee) => Number(fee?.balance ?? (Number(fee?.amount || 0) - Number(fee?.paid_amount || 0))) > 0);
    const selectedFee = payableFees.find((fee) => String(fee.id || fee._id) === receiptForm.fee_id);

    const submitReceipt = async (event) => {
      event.preventDefault();
      setReceiptError("");
      setReceiptFeedback("");
      if (!receiptForm.fee_id) {
        setReceiptError("Choose the fee line this receipt pays.");
        return;
      }
      if (!Number.isFinite(Number(receiptForm.amount)) || Number(receiptForm.amount) <= 0) {
        setReceiptError("Enter a valid amount paid.");
        return;
      }
      if (!receiptForm.payment_reference.trim() && !receiptForm.receipt_url.trim()) {
        setReceiptError("Enter the M-Pesa/bank reference or a secure receipt URL.");
        return;
      }
      setReceiptSubmitting(true);
      try {
        const studentId = String(data?.student?.id || data?.student?.student_id || "");
        await request(`/children/${encodeURIComponent(studentId)}/finance/receipts`, {
          method: "POST",
          body: {
            ...receiptForm,
            amount: Number(receiptForm.amount),
            payment_reference: receiptForm.payment_reference.trim(),
            receipt_url: receiptForm.receipt_url.trim(),
            notes: receiptForm.notes.trim(),
          },
        });
        setReceiptFeedback("Receipt submitted. It will appear in your student's statement after the school reviews it.");
        setReceiptForm({ fee_id: "", amount: "", payment_method: "mpesa", payment_reference: "", receipt_url: "", notes: "" });
        if (typeof onReceiptSubmitted === "function") await onReceiptSubmitted();
      } catch (error) {
        setReceiptError(error?.message || "The receipt could not be submitted. Please retry.");
      } finally {
        setReceiptSubmitting(false);
      }
    };

    return (
      <div className="mt-6 space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Outstanding balance</p>
            <p className="mt-2 text-xl font-bold text-slate-950">{totalDue !== undefined ? formatKES(totalDue) : "Not provided"}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-800">Total paid</p>
            <p className="mt-2 text-xl font-bold text-emerald-950">{totalPaid !== undefined ? formatKES(totalPaid) : "Not provided"}</p>
          </div>
        </div>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div><h3 className="text-base font-bold text-slate-950">Fee statement</h3><p className="mt-1 text-xs text-slate-500">Balances and due dates are supplied by the school.</p></div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{fees.length} fee line{fees.length === 1 ? "" : "s"}</span>
          </div>
          {fees.length ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr>
                  <th className="px-4 py-3 font-semibold">Fee type / description</th>
                  <th className="px-4 py-3 font-semibold">Term</th>
                  <th className="px-4 py-3 font-semibold">Due date</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 text-right font-semibold">Paid</th>
                  <th className="px-4 py-3 text-right font-semibold">Balance</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {fees.map((fee, index) => {
                    const balance = Number(fee.balance ?? (Number(fee.amount || 0) - Number(fee.paid_amount || 0)));
                    const status = String(fee.status || (balance <= 0 ? "paid" : "due")).toLowerCase().replace(/[_-]+/g, " ");
                    return <tr key={fee.id || fee._id || index}>
                      <td className="px-4 py-3"><p className="font-semibold text-slate-900">{fee.fee_type || fee.title || fee.type || "School fee"}</p><p className="mt-1 text-xs text-slate-500">{fee.description || fee.academic_year || ""}</p></td>
                      <td className="px-4 py-3 text-slate-600">{fee.term || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(fee.due_date)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-800">{formatKES(fee.amount)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-emerald-800">{formatKES(fee.paid_amount || 0)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-slate-900">{formatKES(Math.max(balance, 0))}</td>
                      <td className="px-4 py-3"><span className={balance <= 0 ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800" : "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800"}>{status}</span></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          ) : <EmptyPanel icon={Wallet} title="No fee entries available" description="The school has not issued fee records for this student yet. Contact the school if you expected a fee statement." />}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><Wallet size={19}/></div><div><h3 className="text-base font-bold text-slate-950">Pay the school / submit receipt</h3><p className="mt-1 text-sm leading-6 text-slate-600">Use the payment instructions configured by the school. Submit the transaction reference or receipt for the Bursar to reconcile.</p></div></div>

          {accounts.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">
            {accounts.map((account, index) => <article key={account.id || index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2"><h4 className="font-bold text-slate-900">{account.label || (account.type === "bank" ? "Bank account" : "M-Pesa")}</h4><span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{account.type}</span></div>
              {account.account_name && <p className="mt-2 text-sm text-slate-700">Account name: <strong>{account.account_name}</strong></p>}
              {account.paybill && <p className="mt-1 text-sm text-slate-700">Paybill: <strong>{account.paybill}</strong></p>}
              {account.till && <p className="mt-1 text-sm text-slate-700">Till number: <strong>{account.till}</strong></p>}
              {account.bank_name && <p className="mt-1 text-sm text-slate-700">Bank: <strong>{account.bank_name}</strong></p>}
              {account.branch && <p className="mt-1 text-sm text-slate-700">Branch: <strong>{account.branch}</strong></p>}
              {account.account_number && <p className="mt-1 break-all text-sm text-slate-700">Account number: <strong>{account.account_number}</strong></p>}
              {account.account_reference && <p className="mt-1 text-sm text-slate-700">Account/reference: <strong>{account.account_reference}</strong></p>}
              {account.instructions && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-500">{account.instructions}</p>}
            </article>)}
          </div> : <div className="mt-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">The school has not configured payment instructions yet. Contact the Bursar before paying.</div>}

          {data?.payment_notice && <p className="mt-3 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-900">{data.payment_notice}</p>}
          {receiptFeedback && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{receiptFeedback}</p>}
          {receiptError && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{receiptError}</p>}

          {payableFees.length > 0 && <form onSubmit={submitReceipt} className="mt-5 grid gap-4 border-t border-slate-200 pt-5 md:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">Fee line
              <select required value={receiptForm.fee_id} onChange={(event) => { const fee = payableFees.find((item) => String(item.id || item._id) === event.target.value); setReceiptForm((current) => ({ ...current, fee_id: event.target.value, amount: fee ? String(fee.balance ?? Math.max(Number(fee.amount || 0) - Number(fee.paid_amount || 0), 0)) : "" })); }} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900">
                <option value="">Select a fee</option>{payableFees.map((fee) => <option key={fee.id || fee._id} value={fee.id || fee._id}>{fee.fee_type || fee.title || fee.type || "Fee"} · balance {formatKES(fee.balance ?? Math.max(Number(fee.amount || 0) - Number(fee.paid_amount || 0), 0))}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">Amount paid (KES)
              <input required type="number" min="0.01" max={selectedFee ? Number(selectedFee.balance ?? Math.max(Number(selectedFee.amount || 0) - Number(selectedFee.paid_amount || 0), 0)) : undefined} step="0.01" value={receiptForm.amount} onChange={(event) => setReceiptForm((current) => ({ ...current, amount: event.target.value }))} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" placeholder="Amount paid" />
            </label>
            <label className="text-xs font-semibold text-slate-600">Payment method
              <select value={receiptForm.payment_method} onChange={(event) => setReceiptForm((current) => ({ ...current, payment_method: event.target.value }))} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900"><option value="mpesa">M-Pesa</option><option value="bank">Bank transfer</option></select>
            </label>
            <label className="text-xs font-semibold text-slate-600">Transaction / bank reference
              <input value={receiptForm.payment_reference} onChange={(event) => setReceiptForm((current) => ({ ...current, payment_reference: event.target.value }))} maxLength={120} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" placeholder="e.g. M-Pesa transaction code" />
            </label>
            <label className="text-xs font-semibold text-slate-600 md:col-span-2">Secure receipt URL (optional if reference is provided)
              <input type="url" value={receiptForm.receipt_url} onChange={(event) => setReceiptForm((current) => ({ ...current, receipt_url: event.target.value }))} maxLength={500} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900" placeholder="https://…" />
            </label>
            <label className="text-xs font-semibold text-slate-600 md:col-span-2">Note to the Bursar (optional)
              <textarea rows={2} value={receiptForm.notes} onChange={(event) => setReceiptForm((current) => ({ ...current, notes: event.target.value }))} maxLength={800} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-900" placeholder="Any clarification about this payment" />
            </label>
            <div className="md:col-span-2"><button type="submit" disabled={receiptSubmitting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">{receiptSubmitting ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}{receiptSubmitting ? "Submitting receipt…" : "Submit receipt for review"}</button><p className="mt-2 text-xs leading-5 text-slate-500">Your receipt is pending until the school reviews it. A receipt submission alone does not confirm payment settlement.</p></div>
          </form>}
        </section>
      </div>
    );
  }

  const fields = [
    ["Admission number", record?.admission_number || record?.student_number],
    ["Class", record?.class_name || record?.class || record?.grade],
    ["School", record?.school_name],
    ["Status", record?.status],
    ["Portal duration", record?.portal_duration || record?.student_duration],
    ["Portal expiry / course end", record?.portal_expires_at || record?.leaving_date],
    ["Course", record?.course_name],
    ["Completion status", record?.completion_status],
  ].filter(([, value]) => value !== undefined && value !== null && value !== "");

  if (!fields.length) {
    return (
      <div className="mt-6">
        <EmptyPanel
          icon={BookOpen}
          title="No profile details returned"
          description="The endpoint responded, but it did not provide recognized profile fields. We should align the display with the backend response schema."
        />
      </div>
    );
  }

  const lifecycle = record?.lifecycle_notice || {};
  const canRespondToInactivity = Boolean(lifecycle.parent_reminder_sent_at && !lifecycle.parent_response_at && record?.status === "inactive");
  const lifecycleStatus = lifecycle.registrar_review_requested_at ? "Registrar review has been requested." : lifecycle.parent_response_at ? "Your response has been recorded." : "Waiting for parent/guardian response.";
  return (
    <div className="mt-6 space-y-3">
      {canRespondToInactivity && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 shadow-sm">
          <div className="flex items-start gap-3"><AlertCircle size={20} className="mt-0.5 shrink-0"/><div><h3 className="font-bold">School status confirmation requested</h3><p className="mt-1 text-sm leading-6">The school has recorded this learner as inactive for more than one term. Confirm whether the student is still enrolled or has withdrawn. The registrar will review your response.</p><p className="mt-2 text-xs">Response due: {formatDate(lifecycle.parent_response_deadline)}</p></div></div>
          {lifecycleError && <p role="alert" className="mt-3 text-sm font-semibold text-rose-800">{lifecycleError}</p>}
          <label className="mt-4 block text-xs font-semibold">Notes to the school (optional)<textarea rows={2} value={lifecycleNotes} onChange={(event) => setLifecycleNotes(event.target.value)} maxLength={800} className="mt-1.5 w-full rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900" placeholder="Share context or ask the school to contact you"/></label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={lifecycleSubmitting} onClick={async () => { setLifecycleSubmitting(true); setLifecycleError(""); try { await onInactivityResponse?.("still_enrolled", lifecycleNotes); } catch (error) { setLifecycleError(error?.message || "Unable to send your response."); } finally { setLifecycleSubmitting(false); } }} className="min-h-10 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Still enrolled</button>
            <button type="button" disabled={lifecycleSubmitting} onClick={async () => { setLifecycleSubmitting(true); setLifecycleError(""); try { await onInactivityResponse?.("withdrawn", lifecycleNotes); } catch (error) { setLifecycleError(error?.message || "Unable to send your response."); } finally { setLifecycleSubmitting(false); } }} className="min-h-10 rounded-lg border border-amber-400 bg-white px-3 py-2 text-xs font-bold text-amber-950 disabled:opacity-50">Student has withdrawn</button>
            <button type="button" disabled={lifecycleSubmitting} onClick={async () => { setLifecycleSubmitting(true); setLifecycleError(""); try { await onInactivityResponse?.("please_contact_me", lifecycleNotes); } catch (error) { setLifecycleError(error?.message || "Unable to send your response."); } finally { setLifecycleSubmitting(false); } }} className="min-h-10 rounded-lg border border-amber-400 bg-white px-3 py-2 text-xs font-bold text-amber-950 disabled:opacity-50">Please contact me</button>
          </div>
          <p className="mt-3 text-xs">{lifecycleStatus}</p>
        </section>
      )}
      {fields.map(([label, value]) => (
        <div
          key={label}
          className="flex flex-col gap-1 rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm transition hover:border-emerald-200 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <span className="text-sm text-slate-500">{label}</span>
          <span className="break-words text-sm font-semibold text-slate-900">
            {String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}