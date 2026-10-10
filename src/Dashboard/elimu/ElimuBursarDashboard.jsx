
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileBarChart,
  FileText,
  FolderOpen,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import { useElimuApi } from "@/services/elimuApi.jsx";

const numberFormat = new Intl.NumberFormat("en-KE");

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  "https://revelacode-backend.onrender.com"
).replace(/\/+$/, "");

function unwrap(response) {
  let current = response;

  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return current;
    }

    if (current.success === false || current.ok === false) {
      throw new Error(
        current.message ||
          current.error ||
          "The Elimu service returned an unsuccessful response."
      );
    }

    if (current.data && typeof current.data === "object") {
      current = current.data;
      continue;
    }

    return current;
  }

  return current;
}

function getCollection(response, keys) {
  const data = unwrap(response);

  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function getNumber(object, keys, fallback = null) {
  for (const key of keys) {
    const value = object?.[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }

  return fallback;
}

function formatKES(value) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "—";
  }

  return `KES ${numberFormat.format(Number(value))}`;
}

function formatDate(value) {
  if (!value) return "Date not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatBytes(value) {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes < 0) return "";

  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  tone = "blue",
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    green:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    violet:
      "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <p className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            tones[tone] || tones.blue
          }`}
        >
          <Icon size={21} />
        </span>
      </div>
    </article>
  );
}

function SectionHeading({
  title,
  description,
  action,
  onAction,
  actionDisabled = false,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-base font-bold text-slate-950 dark:text-white">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>

      {action && (
        <button
          type="button"
          onClick={onAction}
          disabled={actionDisabled}
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-300"
        >
          {action}
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}

function QuickAction({ icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-900 dark:hover:bg-blue-950/20"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700 dark:bg-slate-900 dark:text-slate-300 dark:group-hover:bg-blue-500/10 dark:group-hover:text-blue-300">
        <Icon size={19} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </span>
        <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </span>
      </span>

      <ArrowRight
        size={16}
        className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
      />
    </button>
  );
}

function RecordRow({ title, subtitle, amount, date, status }) {
  const normalizedStatus = String(status || "").toLowerCase();

  const statusClasses =
    normalizedStatus.includes("paid") ||
    normalizedStatus.includes("complete") ||
    normalizedStatus.includes("received")
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
      : normalizedStatus.includes("pending") ||
          normalizedStatus.includes("partial") ||
          normalizedStatus.includes("outstanding") ||
          normalizedStatus.includes("overdue")
        ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <Banknote size={18} />
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {title}
          </p>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {subtitle || "School finance record"}
          </p>

          {date && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formatDate(date)}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="text-sm font-bold text-slate-900 dark:text-white">
          {formatKES(amount)}
        </span>

        {status && (
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${statusClasses}`}
          >
            {String(status).replaceAll("_", " ")}
          </span>
        )}
      </div>
    </div>
  );
}

function getDocumentDownloadUrl(document, schoolSelector) {
  if (!document?.id) return "";

  const url = new URL(
    `${API_BASE_URL}/api/jumuiya/elimu/public/documents/${encodeURIComponent(
      document.id
    )}/download`
  );

  if (schoolSelector.school_id) {
    url.searchParams.set("school_id", schoolSelector.school_id);
  } else if (schoolSelector.school_code) {
    url.searchParams.set("school_code", schoolSelector.school_code);
  }

  return url.toString();
}

function FeeDocumentRow({ document, schoolSelector }) {
  const extension = String(
    document.file_type || "FILE"
  ).toUpperCase();

  const fileSize = formatBytes(document.file_size);
  const downloadUrl = getDocumentDownloadUrl(
    document,
    schoolSelector
  );

  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
          <FileText size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-semibold text-slate-900 dark:text-white">
            {document.title || "Fee structure"}
          </p>

          <p className="mt-1 break-words text-xs leading-5 text-slate-500 dark:text-slate-400">
            {document.description || "Published school fee document."}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{extension}</span>
            {fileSize && <span>{fileSize}</span>}
            <span>Updated {formatDate(document.updated_at || document.published_at)}</span>
          </div>
        </div>
      </div>

      {downloadUrl ? (
        <a
          href={downloadUrl}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-900 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
          rel="nofollow"
        >
          <Download size={15} />
          Download
        </a>
      ) : (
        <span className="text-xs text-slate-500">Download unavailable</span>
      )}
    </div>
  );
}

export default function ElimuBursarDashboard({
  access,
  dashboard: initialDashboard,
  school,
  onNavigate,
  onRefresh,
  refreshing = false,
}) {
  const api = useJumuiyaApi();
  const elimuApi = useElimuApi();

  const [dashboard, setDashboard] = useState(initialDashboard || null);
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [reportData, setReportData] = useState(null);

  const [publicFeeDocuments, setPublicFeeDocuments] = useState([]);
  const [documentsError, setDocumentsError] = useState("");
  const [documentsLoading, setDocumentsLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setDashboard(initialDashboard || null);
  }, [initialDashboard]);

  const schoolData = school || dashboard?.school || access?.school || {};

  const schoolId = String(
    schoolData.id || schoolData._id || schoolData.school_id || ""
  ).trim();

  const schoolCode = String(
    schoolData.public_slug || schoolData.code || ""
  ).trim();

  const schoolSelector = useMemo(
    () => ({
      school_id: schoolId || undefined,
      school_code: schoolCode || undefined,
    }),
    [schoolId, schoolCode]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    setDocumentsLoading(true);
    setDocumentsError("");

    const failures = [];

    const requests = [
      {
        name: "fees",
        request: api.getFees,
        setter: setFees,
        keys: ["fees", "records", "items"],
      },
      {
        name: "students",
        request: api.getElimuStudents,
        setter: setStudents,
        keys: ["students", "items"],
      },
      {
        name: "dashboard",
        request: api.getElimuDashboard,
        setter: setDashboard,
        keys: [],
      },
      {
        name: "finance report",
        request: api.getElimuFeesReport,
        setter: setReportData,
        keys: ["report", "metrics", "summary"],
      },
    ];

    const settled = await Promise.all(
      requests.map(async ({ name, request, setter, keys }) => {
        if (typeof request !== "function") {
          failures.push(`${name} API method unavailable`);
          return;
        }

        try {
          const response = await request();
          const data = unwrap(response);

          setter(
            keys.length
              ? getCollection(data, keys)
              : data?.dashboard || data
          );
        } catch (requestError) {
          failures.push(
            `${name}: ${
              requestError?.message || "request failed"
            }`
          );
        }
      })
    );

    // Public document requests have their own error state. A public profile
    // that has not been enabled must not block the private finance dashboard.
    try {
      if (typeof elimuApi.getPublicDocuments !== "function") {
        throw new Error(
          "getPublicDocuments() is missing from src/services/elimuApi.jsx."
        );
      }

      const response = await elimuApi.getPublicDocuments({
        ...schoolSelector,
        category: "fees",
        limit: 12,
      });

      setPublicFeeDocuments(
        getCollection(response, ["documents", "items", "results"])
      );
    } catch (requestError) {
      setPublicFeeDocuments([]);
      setDocumentsError(
        requestError?.message ||
          "Published fee documents could not be loaded."
      );
    } finally {
      setDocumentsLoading(false);
    }

    if (failures.length) {
      setError(
        `Some financial information could not be loaded: ${failures.join(
          "; "
        )}. Available data remains visible.`
      );
    }

    setLoading(false);

    return settled;
  }, [
    api.getFees,
    api.getElimuStudents,
    api.getElimuDashboard,
    api.getElimuFeesReport,
    elimuApi.getPublicDocuments,
    schoolSelector,
  ]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      await loadData();

      if (!active) return;
    };

    run();

    return () => {
      active = false;
    };
  }, [loadData]);

  const navigate = useCallback(
    (path) => {
      if (typeof onNavigate === "function") {
        onNavigate(path);
      }
    },
    [onNavigate]
  );

  const refresh = useCallback(async () => {
    await loadData();

    if (typeof onRefresh === "function") {
      await onRefresh();
    }
  }, [loadData, onRefresh]);

  const metrics = dashboard?.metrics || dashboard?.hub?.metrics || {};
  const reportMetrics =
    reportData?.metrics ||
    reportData?.summary ||
    reportData?.report?.summary ||
    reportData ||
    {};

  const totalStudents =
    getNumber(metrics, ["students", "total_students"]) ?? students.length;

  const totalCollected = getNumber(reportMetrics, [
    "total_collected",
    "collected",
    "fees_collected",
    "total_paid",
  ]);

  const outstanding = getNumber(reportMetrics, [
    "outstanding",
    "pending_fees",
    "outstanding_fees",
    "total_outstanding",
    "balance_due",
  ]);

  const expectedRevenue = getNumber(reportMetrics, [
    "expected",
    "expected_revenue",
    "total_expected",
    "fees_expected",
  ]);

  const collectionRate =
    getNumber(reportMetrics, [
      "collection_rate",
      "collection_percentage",
    ]) ??
    (expectedRevenue > 0 && totalCollected !== null
      ? Math.min(100, (totalCollected / expectedRevenue) * 100)
      : null);

  const recentFees = fees.slice(0, 6);

  const schoolName =
    schoolData.name ||
    schoolData.school_name ||
    schoolData.institution_name ||
    "Your school";

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-1/3 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-emerald-200">
              <Wallet size={14} />
              Finance management
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
              Bursar's dashboard
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Monitor fee collections, outstanding balances, financial reports
              and published fee documents while keeping financial records
              organized.
            </p>

            <p className="mt-4 text-sm font-semibold text-white">
              {schoolName}
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={loading || refreshing}
            className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading || refreshing ? "animate-spin" : ""}
            />
            Refresh finances
          </button>
        </div>
      </section>

      {error && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="flex-1">{error}</p>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="shrink-0 font-semibold underline underline-offset-2 disabled:opacity-60"
          >
            Retry
          </button>
        </div>
      )}

      <section>
        <SectionHeading
          title="Financial overview"
          description="Figures are displayed only when returned by the school finance API."
          action="Refresh data"
          onAction={refresh}
          actionDisabled={loading || refreshing}
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={ArrowUpRight}
            label="Total collected"
            value={formatKES(totalCollected)}
            description="Recorded payments received"
            tone="green"
          />

          <MetricCard
            icon={ArrowDownRight}
            label="Outstanding balance"
            value={formatKES(outstanding)}
            description="Reported unpaid balances"
            tone="amber"
          />

          <MetricCard
            icon={Banknote}
            label="Expected revenue"
            value={formatKES(expectedRevenue)}
            description="Expected fees, if reported"
            tone="blue"
          />

          <MetricCard
            icon={ClipboardList}
            label="Student records"
            value={numberFormat.format(totalStudents)}
            description="Records available to this account"
            tone="violet"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <SectionHeading
          title="Collection performance"
          description="Based on the finance report returned by the backend."
          action="Open fee report"
          onAction={() => navigate("elimu/reports/fees")}
        />

        {collectionRate === null ? (
          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            Collection performance will appear when the finance report provides
            collected and expected totals, or a collection percentage.
          </div>
        ) : (
          <div className="mt-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                  {collectionRate.toFixed(1)}%
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Reported fee collection rate
                </p>
              </div>

              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                0–100%
              </span>
            </div>

            <div
              className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
              role="progressbar"
              aria-label="Fee collection rate"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.max(0, Math.min(100, collectionRate))}
            >
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${Math.max(0, Math.min(100, collectionRate))}%`,
                }}
              />
            </div>
          </div>
        )}
      </section>

      <section>
        <SectionHeading
          title="Finance actions"
          description="Access financial records and reports available in Elimu."
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <QuickAction
            icon={Wallet}
            title="Fee records"
            description="Review available fee records and payment statuses."
            onClick={() => navigate("elimu/fees")}
          />

          <QuickAction
            icon={FileBarChart}
            title="Financial reports"
            description="Review fee reporting and available summaries."
            onClick={() => navigate("elimu/reports/fees")}
          />

          <QuickAction
            icon={ClipboardList}
            title="Student fee accounts"
            description="Review fee-related student information where permitted."
            onClick={() => navigate("elimu/students")}
          />

          <QuickAction
            icon={CalendarDays}
            title="School calendar"
            description="Review term dates and financial administration deadlines."
            onClick={() => navigate("elimu/calendar")}
          />

          <QuickAction
            icon={FolderOpen}
            title="Public document library"
            description="View published fee structures and official school documents."
            onClick={() => navigate("elimu/documents")}
          />

          <QuickAction
            icon={CheckCircle2}
            title="Fee reconciliation"
            description="Review existing records before reconciling payments."
            onClick={() => navigate("elimu/fees")}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <SectionHeading
          title="Published fee documents"
          description="Public fee structures and financial notices approved for public access."
          action="Open document library"
          onAction={() => navigate("elimu/documents")}
        />

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300"
          />

          <p className="text-xs leading-5 text-blue-900 dark:text-blue-200">
            Only published, public fee documents are shown here. Individual
            fee statements, payment histories and student balances must never
            be published in the public document library.
          </p>
        </div>

        {documentsLoading ? (
          <div className="flex items-center gap-3 py-8 text-sm text-slate-500 dark:text-slate-400">
            <RefreshCw size={18} className="animate-spin" />
            Loading published fee documents…
          </div>
        ) : documentsError ? (
          <div
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200"
            role="status"
          >
            <p className="font-semibold">
              Public fee documents are unavailable right now.
            </p>
            <p className="mt-1">{documentsError}</p>
            <p className="mt-2">
              Confirm that the school has enabled its public profile and that
              the public document endpoints are registered in Flask.
            </p>
          </div>
        ) : publicFeeDocuments.length > 0 ? (
          <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
            {publicFeeDocuments.map((document, index) => (
              <FeeDocumentRow
                key={document.id || document._id || index}
                document={document}
                schoolSelector={schoolSelector}
              />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <FileText
              size={27}
              className="mx-auto text-slate-300 dark:text-slate-600"
            />

            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              No public fee documents published
            </p>

            <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-slate-500 dark:text-slate-400">
              When the school publishes its fee structure or approved finance
              notice, it will appear here for visitors to download.
            </p>

            <button
              type="button"
              onClick={() => navigate("elimu/documents")}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300"
            >
              Open document library
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        <div className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Fee-document uploading and publishing permissions are controlled by
          the backend. This dashboard currently lists public documents; it
          does not grant permission to publish documents.
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <SectionHeading
          title="Recent fee records"
          description="The latest records returned by the school fees endpoint."
          action="View all fees"
          onAction={() => navigate("elimu/fees")}
        />

        <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
          {recentFees.length ? (
            recentFees.map((fee, index) => (
              <RecordRow
                key={
                  fee.id ||
                  fee._id ||
                  fee.fee_id ||
                  fee.receipt_number ||
                  index
                }
                title={
                  fee.student_name ||
                  fee.student?.name ||
                  fee.receipt_number ||
                  fee.reference ||
                  fee.title ||
                  "Fee record"
                }
                subtitle={
                  fee.student_admission_number ||
                  fee.admission_number ||
                  fee.description ||
                  fee.fee_type ||
                  "School fee record"
                }
                amount={getNumber(fee, [
                  "amount_paid",
                  "amount",
                  "paid_amount",
                  "total",
                ])}
                date={
                  fee.payment_date ||
                  fee.created_at ||
                  fee.date ||
                  fee.updated_at
                }
                status={fee.status || fee.payment_status}
              />
            ))
          ) : (
            <div className="py-10 text-center">
              <Banknote
                size={27}
                className="mx-auto text-slate-300 dark:text-slate-600"
              />

              <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                No fee records available
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Records will appear here when the fees endpoint returns data.
              </p>

              <button
                type="button"
                onClick={() => navigate("elimu/fees")}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300"
              >
                Open fee management
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}