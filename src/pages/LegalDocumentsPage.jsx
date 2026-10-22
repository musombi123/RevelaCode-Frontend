import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, BookOpen, FileText, Loader2, RefreshCw, ShieldCheck } from "lucide-react";

const DEFAULT_BACKEND_URL = "https://revelacode-backend.onrender.com";
const ENV = import.meta.env || {};

function getBackendBaseUrl() {
  return String(
    ENV.VITE_API_BASE_URL || ENV.VITE_BACKEND_URL || ENV.VITE_API_URL || DEFAULT_BACKEND_URL
  ).trim().replace(/\/+$/, "");
}

const DOCUMENTS = [
  { type: "privacy", title: "Privacy Policy", description: "How RevelaCode and Jumuiya handle personal information." },
  { type: "terms", title: "Terms of Service", description: "Terms that apply when using RevelaCode and Jumuiya services." },
];

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long", day: "numeric" }).format(date);
}

export default function LegalDocumentsPage() {
  const location = useLocation();
  const requestedDocument = useMemo(() => {
    const value = new URLSearchParams(location.search).get("document");
    return value && value.trim() ? value.trim().toLowerCase() : "all";
  }, [location.search]);

  const visibleTypes = requestedDocument === "all"
    ? DOCUMENTS.map((doc) => doc.type)
    : DOCUMENTS.some((doc) => doc.type === requestedDocument)
      ? [requestedDocument]
      : DOCUMENTS.map((doc) => doc.type);

  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDocuments = useCallback(async (signal) => {
    setLoading(true);
    setErrors({});
    const base = getBackendBaseUrl();
    const results = await Promise.all(DOCUMENTS.map(async (doc) => {
      try {
        const response = await fetch(`${base}/api/legal/${doc.type}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal,
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.message || `Could not load ${doc.title.toLowerCase()} (HTTP ${response.status}).`);
        }
        const payload = await response.json();
        if (typeof payload?.content !== "string" || !payload.content.trim()) {
          throw new Error(`${doc.title} is currently empty.`);
        }
        return { type: doc.type, payload, error: "" };
      } catch (error) {
        if (error?.name === "AbortError") throw error;
        return { type: doc.type, payload: null, error: error?.message || `Could not load ${doc.title.toLowerCase()}.` };
      }
    }));

    const nextDocuments = {};
    const nextErrors = {};
    for (const result of results) {
      if (result.payload) nextDocuments[result.type] = result.payload;
      if (result.error) nextErrors[result.type] = result.error;
    }
    setDocuments(nextDocuments);
    setErrors(nextErrors);
    setLoading(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDocuments(controller.signal).catch((error) => {
      if (error?.name !== "AbortError") {
        setErrors({ general: error?.message || "Unable to load legal documents." });
        setLoading(false);
      }
    });
    return () => controller.abort();
  }, [loadDocuments, refreshKey]);

  const isAll = requestedDocument === "all";
  const pageTitle = isAll
    ? "Legal information"
    : DOCUMENTS.find((doc) => doc.type === requestedDocument)?.title || "Legal information";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-600 hover:bg-white hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-blue-300">
          <ArrowLeft size={17} /> Return to RevelaCode
        </Link>

        <header className="overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-sm sm:px-9 sm:py-10">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-blue-200">
              <ShieldCheck size={25} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">RevelaCode · Jumuiya</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{pageTitle}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Official platform policies and service terms. Choose a document below to review its current published version.
              </p>
            </div>
          </div>
        </header>

        <nav aria-label="Legal documents" className="mt-5 grid gap-3 sm:grid-cols-2">
          {DOCUMENTS.map((doc) => {
            const active = visibleTypes.includes(doc.type);
            return (
              <a
                key={doc.type}
                href={doc.type === "privacy" ? "/legal?document=privacy" : "/legal?document=terms"}
                aria-current={requestedDocument === doc.type ? "page" : undefined}
                className={`flex min-h-20 items-start gap-3 rounded-2xl border p-4 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${active ? "border-blue-300 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40" : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"}`}
              >
                <FileText size={20} className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300" />
                <span>
                  <span className="block text-sm font-bold">{doc.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300">{doc.description}</span>
                </span>
              </a>
            );
          })}
        </nav>

        {loading && (
          <div role="status" className="mt-6 flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <Loader2 size={19} className="animate-spin" /> Loading legal documents…
          </div>
        )}

        {!loading && Object.keys(errors).length > 0 && (
          <section role="alert" className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-amber-950 dark:text-amber-200">Some documents could not be loaded</h2>
                <p className="mt-1 text-sm leading-6 text-amber-900 dark:text-amber-100">
                  {Object.entries(errors).map(([type, message]) => `${type === "general" ? "Legal service" : DOCUMENTS.find((doc) => doc.type === type)?.title || type}: ${message}`).join(" ")}
                </p>
                <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-200">The page route is working, but the legal API or its published records may need attention.</p>
              </div>
              <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-400 px-4 py-2 text-sm font-bold text-amber-950 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-amber-700 dark:text-amber-100 dark:hover:bg-amber-900/50">
                <RefreshCw size={15} /> Try again
              </button>
            </div>
          </section>
        )}

        {!loading && visibleTypes.map((type) => {
          const definition = DOCUMENTS.find((doc) => doc.type === type);
          const document = documents[type];
          if (!definition || !document) return null;
          return (
            <article key={type} className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
              <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300"><BookOpen size={15} /> Published document</div>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">{definition.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{definition.description}</p>
                </div>
                <div className="text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-right">
                  {document.version && <p>Version {document.version}</p>}
                  {document.lastUpdated && <p>Updated {formatDate(document.lastUpdated)}</p>}
                </div>
              </div>
              <div className="prose prose-slate mt-6 max-w-none break-words dark:prose-invert prose-headings:scroll-mt-24 prose-a:text-blue-700 dark:prose-a:text-blue-300 prose-li:my-1 prose-table:block prose-table:overflow-x-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{document.content}</ReactMarkdown>
              </div>
            </article>
          );
        })}

        {!loading && !Object.keys(documents).length && !Object.keys(errors).length && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            No legal documents are available yet.
          </div>
        )}

        <footer className="mt-8 border-t border-slate-200 py-5 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">
          RevelaCode Software Studio · Legal documents for RevelaCode and Jumuiya services.
        </footer>
      </div>
    </main>
  );
}
