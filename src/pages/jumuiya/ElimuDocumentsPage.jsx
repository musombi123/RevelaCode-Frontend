
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Download,
  File,
  FileArchive,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://revelacode-backend.onrender.com"
).replace(/\/+$/, "");

/*
 * PROPOSED BACKEND CONTRACT
 *
 * GET  /api/jumuiya/elimu/public/documents
 * GET  /api/jumuiya/elimu/public/documents/<document_id>/download
 *
 * These two document endpoints do not appear in the supplied route list.
 * Add them in the backend using these exact paths.
 *
 * This page lists and downloads PUBLIC documents only.
 * Private fee statements and report cards must use separate authenticated
 * endpoints that verify the parent-child relationship on the server.
 */

const DOCUMENTS_ENDPOINT =
  `${API_BASE_URL}/api/jumuiya/elimu/public/documents`;

const DOWNLOAD_ENDPOINT = (documentId) =>
  `${DOCUMENTS_ENDPOINT}/${encodeURIComponent(documentId)}/download`;

const CATEGORIES = [
  { id: "all", label: "All documents" },
  { id: "fees", label: "Fee structures" },
  { id: "forms", label: "School forms" },
  { id: "calendar", label: "Calendars & notices" },
  { id: "handbook", label: "Handbooks" },
  { id: "admissions", label: "Admissions" },
];

const styles = `
  .edp {
    --edp-ink: #172b4d;
    --edp-muted: #64748b;
    --edp-border: #e3eaf3;
    --edp-primary: #155eef;
    --edp-primary-dark: #1048c7;
    --edp-bg: #f6f8fc;
    --edp-green: #13865c;
    color: var(--edp-ink);
    background: var(--edp-bg);
    min-height: 100vh;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .edp * { box-sizing: border-box; }
  .edp-container { width: min(1180px, calc(100% - 40px)); margin: 0 auto; }

  .edp-topbar {
    background: #fff;
    border-bottom: 1px solid var(--edp-border);
  }
  .edp-topbar-inner {
    min-height: 68px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }
  .edp-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .edp-brand-icon {
    display: grid; place-items: center; flex-shrink: 0;
    width: 42px; height: 42px; border-radius: 13px;
    color: #fff; background: linear-gradient(145deg, #155eef, #428cff);
    box-shadow: 0 5px 14px rgba(21,94,239,.17);
  }
  .edp-brand-name { font-size: 15px; font-weight: 850; letter-spacing: -.35px; }
  .edp-brand-sub { color: var(--edp-muted); font-size: 11px; margin-top: 3px; }
  .edp-security {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 11px; border: 1px solid #d5e7dd; border-radius: 999px;
    background: #f1faf5; color: #18714e; font-size: 11px;
    font-weight: 800; white-space: nowrap;
  }

  .edp-hero {
    position: relative; overflow: hidden; color: white;
    padding: 42px 0 37px;
    background: linear-gradient(120deg, #10234d 0%, #143f86 59%, #1768d2 100%);
  }
  .edp-hero:after {
    content: ""; position: absolute; right: -100px; top: -190px;
    width: 400px; height: 400px; border: 1px solid rgba(255,255,255,.12);
    border-radius: 50%; box-shadow: 0 0 0 36px rgba(255,255,255,.03),
      0 0 0 78px rgba(255,255,255,.025);
  }
  .edp-hero-grid {
    display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(230px, .65fr);
    align-items: center; gap: 32px; position: relative; z-index: 1;
  }
  .edp-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    margin-bottom: 14px; color: #c8ddff;
    text-transform: uppercase; letter-spacing: 1.5px;
    font-size: 10px; font-weight: 850;
  }
  .edp-hero h1 {
    margin: 0; max-width: 690px; font-size: clamp(30px, 4vw, 47px);
    line-height: 1.12; letter-spacing: -1.6px; font-weight: 850;
  }
  .edp-hero p {
    max-width: 650px; margin: 16px 0 0; color: #d7e5ff;
    font-size: 14px; line-height: 1.8;
  }
  .edp-hero-note {
    padding: 20px; border: 1px solid rgba(255,255,255,.18);
    border-radius: 18px; background: rgba(255,255,255,.08);
  }
  .edp-hero-note-icon {
    display: grid; place-items: center; width: 42px; height: 42px;
    margin-bottom: 15px; border-radius: 13px;
    color: white; background: rgba(255,255,255,.14);
  }
  .edp-hero-note strong { display: block; font-size: 14px; }
  .edp-hero-note span {
    display: block; margin-top: 8px; color: #d6e4ff;
    font-size: 11px; line-height: 1.75;
  }

  .edp-main { padding: 30px 0 50px; }
  .edp-heading {
    display: flex; justify-content: space-between; align-items: flex-end;
    gap: 16px; margin-bottom: 19px;
  }
  .edp-heading h2 {
    margin: 0; font-size: 22px; letter-spacing: -.55px; font-weight: 850;
  }
  .edp-heading p {
    margin: 7px 0 0; color: var(--edp-muted); font-size: 12px; line-height: 1.7;
  }
  .edp-count { color: var(--edp-muted); font-size: 11px; white-space: nowrap; }

  .edp-tools {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px; margin-bottom: 20px;
  }
  .edp-search {
    display: flex; align-items: center; gap: 9px;
    min-height: 43px; width: min(330px, 100%); padding: 0 12px;
    border: 1px solid var(--edp-border); border-radius: 11px;
    background: white; color: #7d8ba2;
  }
  .edp-search input {
    min-width: 0; width: 100%; border: 0; outline: none;
    background: transparent; color: var(--edp-ink); font: inherit; font-size: 12px;
  }
  .edp-search input::placeholder { color: #96a2b4; }

  .edp-categories {
    display: flex; flex-wrap: wrap; align-items: center; gap: 7px;
    margin-bottom: 22px;
  }
  .edp-category {
    border: 1px solid var(--edp-border); background: #fff;
    color: #596c86; border-radius: 999px; padding: 9px 12px;
    font-size: 11px; font-weight: 750; cursor: pointer;
    transition: border-color .18s ease, background .18s ease;
  }
  .edp-category.active {
    background: #eaf2ff; border-color: #c9dcff; color: #1555c2;
  }

  .edp-banner {
    display: flex; align-items: flex-start; gap: 11px;
    padding: 13px 15px; border-radius: 12px; margin-bottom: 18px;
    font-size: 11px; line-height: 1.7;
  }
  .edp-banner.info { background: #eef5ff; color: #315a93; border: 1px solid #d8e7ff; }
  .edp-banner.error { background: #fff2f1; color: #9d2929; border: 1px solid #ffd9d6; }
  .edp-banner svg { flex-shrink: 0; margin-top: 1px; }
  .edp-banner strong { display: block; margin-bottom: 2px; }

  .edp-grid {
    display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px;
  }
  .edp-card {
    min-width: 0; display: flex; flex-direction: column;
    padding: 18px; background: white; border: 1px solid var(--edp-border);
    border-radius: 16px; transition: transform .18s ease, box-shadow .18s ease;
  }
  .edp-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(27,51,89,.06); }
  .edp-card-top { display: flex; align-items: flex-start; gap: 12px; }
  .edp-file-icon {
    display: grid; place-items: center; flex-shrink: 0;
    width: 45px; height: 49px; border-radius: 12px;
    background: #edf3ff; color: #155eef;
  }
  .edp-file-icon.pdf { background: #fff0ee; color: #c24132; }
  .edp-file-icon.sheet { background: #e9f8ee; color: #16834f; }
  .edp-file-icon.archive { background: #fff5e8; color: #a15b10; }
  .edp-file-heading { min-width: 0; flex: 1; }
  .edp-file-heading h3 {
    margin: 1px 0 7px; font-size: 14px; line-height: 1.45;
    font-weight: 820; letter-spacing: -.2px; overflow-wrap: anywhere;
  }
  .edp-type {
    display: inline-flex; align-items: center; gap: 5px;
    color: #667993; background: #f4f6fa; border-radius: 5px;
    padding: 4px 6px; font-size: 9px; font-weight: 850;
    text-transform: uppercase; letter-spacing: .45px;
  }
  .edp-description {
    margin: 14px 0 16px; color: var(--edp-muted);
    font-size: 11px; line-height: 1.8; overflow-wrap: anywhere;
    white-space: pre-line;
  }
  .edp-meta {
    display: flex; align-items: center; justify-content: space-between;
    gap: 10px; flex-wrap: wrap; margin-top: auto;
    color: #7b8ba2; font-size: 10px;
  }
  .edp-meta span { display: inline-flex; align-items: center; gap: 5px; }
  .edp-card-bottom {
    display: flex; align-items: center; justify-content: space-between;
    gap: 10px; border-top: 1px solid #edf0f5; padding-top: 14px; margin-top: 16px;
  }
  .edp-download {
    display: inline-flex; justify-content: center; align-items: center; gap: 7px;
    padding: 9px 12px; border: 0; border-radius: 9px;
    color: white; background: var(--edp-primary); text-decoration: none;
    font-size: 11px; font-weight: 800; cursor: pointer;
  }
  .edp-download:hover { background: var(--edp-primary-dark); }
  .edp-download:focus-visible, .edp-category:focus-visible, .edp-search input:focus-visible {
    outline: 2px solid #77a6ff; outline-offset: 3px;
  }
  .edp-status { color: #18805b; font-size: 10px; font-weight: 750; }
  .edp-empty {
    text-align: center; padding: 44px 20px; background: white;
    border: 1px dashed #d3ddeb; border-radius: 16px;
  }
  .edp-empty-icon {
    display: grid; place-items: center; width: 52px; height: 52px;
    margin: 0 auto 14px; border-radius: 15px; background: #edf3ff; color: #4676c8;
  }
  .edp-empty h3 { margin: 0; font-size: 15px; font-weight: 800; }
  .edp-empty p {
    max-width: 430px; margin: 8px auto 0; color: var(--edp-muted);
    font-size: 11px; line-height: 1.8;
  }
  .edp-retry {
    display: inline-flex; align-items: center; gap: 7px;
    margin-top: 14px; padding: 10px 12px; border-radius: 9px;
    border: 1px solid #cddcf3; color: #2457a6; background: white;
    font-size: 11px; font-weight: 750; cursor: pointer;
  }
  .edp-admissions {
    display: flex; align-items: center; justify-content: space-between;
    gap: 18px; margin-top: 25px; padding: 20px;
    border: 1px solid #dce8fb; border-radius: 15px;
    background: linear-gradient(110deg, #eef5ff, #f8fbff);
  }
  .edp-admissions-copy { display: flex; align-items: flex-start; gap: 13px; }
  .edp-admissions-icon {
    display: grid; place-items: center; flex-shrink: 0;
    width: 43px; height: 43px; border-radius: 12px;
    background: white; color: #155eef;
  }
  .edp-admissions h3 { margin: 0; font-size: 13px; font-weight: 850; }
  .edp-admissions p {
    margin: 6px 0 0; max-width: 610px; color: #647895;
    font-size: 11px; line-height: 1.75;
  }
  .edp-coming {
    flex-shrink: 0; border: 1px solid #d8e2f1; border-radius: 999px;
    background: white; color: #5e7190; padding: 7px 10px;
    font-size: 10px; font-weight: 800;
  }
  .edp-footer {
    padding: 20px 0; background: white; border-top: 1px solid var(--edp-border);
    color: #75849a; font-size: 10px;
  }
  .edp-footer-inner {
    display: flex; justify-content: space-between; align-items: center;
    gap: 12px; flex-wrap: wrap;
  }
  .edp-footer strong { color: var(--edp-ink); }

  @media (max-width: 900px) {
    .edp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .edp-hero-grid { grid-template-columns: minmax(0, 1fr) 220px; gap: 20px; }
  }
  @media (max-width: 640px) {
    .edp-container { width: calc(100% - 28px); }
    .edp-topbar-inner { min-height: 60px; }
    .edp-brand-icon { width: 38px; height: 38px; }
    .edp-brand-name { font-size: 14px; }
    .edp-security { font-size: 9px; padding: 7px 8px; }
    .edp-hero { padding: 31px 0 29px; }
    .edp-hero-grid { grid-template-columns: 1fr; }
    .edp-hero h1 { font-size: 34px; letter-spacing: -1.1px; }
    .edp-hero p { font-size: 12px; }
    .edp-hero-note { display: none; }
    .edp-main { padding: 23px 0 35px; }
    .edp-heading { align-items: flex-start; }
    .edp-heading h2 { font-size: 20px; }
    .edp-count { padding-top: 5px; }
    .edp-tools { align-items: stretch; }
    .edp-search { width: 100%; }
    .edp-categories { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 7px; }
    .edp-category { flex-shrink: 0; }
    .edp-grid { grid-template-columns: 1fr; gap: 12px; }
    .edp-admissions { align-items: flex-start; padding: 15px; }
    .edp-admissions-copy { gap: 10px; }
    .edp-coming { font-size: 9px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .edp *, .edp *:before, .edp *:after { transition: none !important; }
  }
`;

function unwrapPayload(payload) {
  let current = payload;

  for (let i = 0; i < 3; i += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) break;

    if (current.success === false || current.ok === false) {
      throw new Error(
        current.message || current.error || "The server could not load documents."
      );
    }

    if (current.data && typeof current.data === "object") {
      current = current.data;
      continue;
    }

    break;
  }

  return current;
}

function extractDocuments(payload) {
  const result = unwrapPayload(payload);

  if (Array.isArray(result)) return result;

  if (result && typeof result === "object") {
    for (const key of ["documents", "items", "results", "files"]) {
      if (Array.isArray(result[key])) return result[key];
    }
  }

  return [];
}

function firstText(record, keys, fallback = "") {
  for (const key of keys) {
    const value = record?.[key];

    if (typeof value === "string" || typeof value === "number") {
      const text = String(value).trim();
      if (text) return text;
    }
  }

  return fallback;
}

function normaliseCategory(value) {
  const category = String(value || "").trim().toLowerCase();

  if (/fee|finance|tuition/.test(category)) return "fees";
  if (/admission|joining|enrolment|enrollment/.test(category)) return "admissions";
  if (/calendar|notice|circular|event/.test(category)) return "calendar";
  if (/handbook|policy|rules|guide/.test(category)) return "handbook";
  if (/form|template|application/.test(category)) return "forms";

  return "other";
}

function formatDate(value) {
  if (!value) return "Date unavailable";

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
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(document) {
  const explicit = firstText(document, ["file_type", "extension", "mime_type"]);
  const filename = firstText(document, ["filename", "file_name", "name"]);

  const candidate = explicit || filename;
  const extension = candidate.includes("/")
    ? candidate.split("/").pop()
    : candidate.split(".").pop();

  return extension ? extension.toUpperCase().replace(/[^A-Z0-9]/g, "") : "FILE";
}

function getFileIcon(extension) {
  if (["PDF"].includes(extension)) return FileText;
  if (["XLS", "XLSX", "CSV", "ODS"].includes(extension)) return FileSpreadsheet;
  if (["ZIP", "RAR", "7Z"].includes(extension)) return FileArchive;

  return File;
}

function getIconClass(extension) {
  if (extension === "PDF") return "pdf";
  if (["XLS", "XLSX", "CSV", "ODS"].includes(extension)) return "sheet";
  if (["ZIP", "RAR", "7Z"].includes(extension)) return "archive";

  return "";
}

function normaliseDocument(document, index) {
  const id = firstText(document, ["id", "_id", "document_id", "uuid"]);

  return {
    id,
    key: id || `document-${index}`,
    title: firstText(document, ["title", "name", "document_name"], "School document"),
    description: firstText(
      document,
      ["description", "summary"],
      "Download the document for further information."
    ),
    category: normaliseCategory(
      firstText(document, ["category", "document_type", "type"])
    ),
    categoryLabel: firstText(
      document,
      ["category_label", "category", "document_type"],
      "School document"
    ),
    extension: getFileExtension(document),
    size: document.file_size ?? document.size_bytes ?? document.size ?? null,
    updatedAt: firstText(
      document,
      ["updated_at", "published_at", "created_at", "date"],
      ""
    ),
    status: firstText(document, ["status", "publication_status"], "Published"),
    public: document.is_public !== false && document.visibility !== "private",
  };
}

function DocumentCard({ document }) {
  const Icon = getFileIcon(document.extension);
  const iconClass = getIconClass(document.extension);
  const size = formatBytes(document.size);

  return (
    <article className="edp-card">
      <div className="edp-card-top">
        <div className={`edp-file-icon ${iconClass}`}>
          <Icon size={22} />
        </div>

        <div className="edp-file-heading">
          <h3>{document.title}</h3>
          <span className="edp-type">{document.extension}</span>
        </div>
      </div>

      <p className="edp-description">{document.description}</p>

      <div className="edp-meta">
        <span>
          <CalendarDays size={13} />
          {formatDate(document.updatedAt)}
        </span>
        {size && <span>{size}</span>}
      </div>

      <div className="edp-card-bottom">
        <span className="edp-status">
          <CheckCircle2 size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
          {document.status}
        </span>

        {document.id ? (
          <a
            className="edp-download"
            href={DOWNLOAD_ENDPOINT(document.id)}
            aria-label={`Download ${document.title}`}
            rel="nofollow"
          >
            <Download size={14} />
            Download
          </a>
        ) : (
          <span style={{ color: "#9a5a12", fontSize: 10 }}>Download unavailable</span>
        )}
      </div>
    </article>
  );
}

export default function ElimuDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDocuments = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await fetch(DOCUMENTS_ENDPOINT, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "omit",
      });

      if (!response.ok) {
        let message = `Request failed with HTTP ${response.status}.`;

        try {
          const body = await response.json();
          message = body.message || body.error || message;
        } catch {
          // The server may return a non-JSON error.
        }

        throw new Error(message);
      }

      const payload = await response.json();
      const records = extractDocuments(payload);

      setDocuments(
        records
          .map(normaliseDocument)
          .filter((document) => document.public)
      );
    } catch (loadError) {
      setDocuments([]);
      setError(
        loadError?.message ||
          "Could not load school documents. Check your connection and try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const categoryCounts = useMemo(() => {
    const counts = { all: documents.length };

    for (const document of documents) {
      counts[document.category] = (counts[document.category] || 0) + 1;
    }

    return counts;
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesCategory =
        category === "all" || document.category === category;

      const searchableText = [
        document.title,
        document.description,
        document.categoryLabel,
        document.extension,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCategory && (!query || searchableText.includes(query));
    });
  }, [documents, category, search]);

  return (
    <div className="edp">
      <style>{styles}</style>

      <header className="edp-topbar">
        <div className="edp-container edp-topbar-inner">
          <div className="edp-brand">
            <div className="edp-brand-icon">
              <GraduationCap size={23} />
            </div>
            <div>
              <div className="edp-brand-name">Jumuiya Elimu</div>
              <div className="edp-brand-sub">School documents centre</div>
            </div>
          </div>

          <div className="edp-security">
            <ShieldCheck size={14} />
            Public documents
          </div>
        </div>
      </header>

      <section className="edp-hero">
        <div className="edp-container edp-hero-grid">
          <div>
            <div className="edp-eyebrow">
              <ArrowDownToLine size={14} />
              Official school resources
            </div>
            <h1>School documents, ready when you need them.</h1>
            <p>
              Find published fee structures, school forms, calendars,
              handbooks and other official resources in one place.
              Downloadable admission resources can be added when the school
              is ready to publish them.
            </p>
          </div>

          <div className="edp-hero-note">
            <div className="edp-hero-note-icon">
              <LockKeyhole size={22} />
            </div>
            <strong>Your information matters</strong>
            <span>
              This page is for public documents. Personal fee statements,
              report cards and student records must be accessed through
              an authorized account.
            </span>
          </div>
        </div>
      </section>

      <main className="edp-main">
        <div className="edp-container">
          <div className="edp-heading">
            <div>
              <h2>Documents library</h2>
              <p>Search, filter and download school-approved resources.</p>
            </div>
            <span className="edp-count">
              {loading ? "Loading…" : `${filteredDocuments.length} documents`}
            </span>
          </div>

          <div className="edp-tools">
            <label className="edp-search">
              <Search size={16} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title or description…"
                aria-label="Search school documents"
              />
            </label>
          </div>

          <nav className="edp-categories" aria-label="Document categories">
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`edp-category ${category === item.id ? "active" : ""}`}
                aria-pressed={category === item.id}
                onClick={() => setCategory(item.id)}
              >
                {item.label}
                {typeof categoryCounts[item.id] === "number" &&
                  ` (${categoryCounts[item.id]})`}
              </button>
            ))}
          </nav>

          {error && (
            <div className="edp-banner error" role="alert">
              <XCircle size={17} />
              <div>
                <strong>Unable to load the documents library.</strong>
                <div>{error}</div>
                <div style={{ marginTop: 5 }}>
                  Expected endpoint: <code>{DOCUMENTS_ENDPOINT}</code>
                </div>
                <button
                  type="button"
                  className="edp-retry"
                  onClick={() => loadDocuments({ silent: true })}
                  disabled={refreshing}
                >
                  <RefreshCw size={13} />
                  {refreshing ? "Refreshing…" : "Try again"}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="edp-empty" aria-live="polite">
              <div className="edp-empty-icon">
                <RefreshCw size={22} />
              </div>
              <h3>Loading the documents library</h3>
              <p>Fetching published documents from the Elimu backend.</p>
            </div>
          ) : !error && filteredDocuments.length > 0 ? (
            <div className="edp-grid">
              {filteredDocuments.map((document) => (
                <DocumentCard key={document.key} document={document} />
              ))}
            </div>
          ) : !error ? (
            <div className="edp-empty">
              <div className="edp-empty-icon">
                {category === "admissions" ? (
                  <GraduationCap size={23} />
                ) : (
                  <FileText size={23} />
                )}
              </div>
              <h3>
                {category === "admissions"
                  ? "Admission downloads are not available yet"
                  : search
                    ? "No matching documents"
                    : "No documents published in this category"}
              </h3>
              <p>
                {category === "admissions"
                  ? "The school can publish admission forms and joining instructions here when the admissions process is introduced."
                  : search
                    ? "Try a different search term or select another category."
                    : "When the school publishes approved documents, they will appear here."}
              </p>
              {(search || category !== "all") && (
                <button
                  type="button"
                  className="edp-retry"
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                  }}
                >
                  View all documents <ArrowRight size={13} />
                </button>
              )}
              {error === "" && !documents.length && (
                <button
                  type="button"
                  className="edp-retry"
                  onClick={() => loadDocuments({ silent: true })}
                  disabled={refreshing}
                >
                  <RefreshCw size={13} />
                  {refreshing ? "Refreshing…" : "Refresh library"}
                </button>
              )}
            </div>
          ) : null}

          <section className="edp-admissions">
            <div className="edp-admissions-copy">
              <div className="edp-admissions-icon">
                <BookOpen size={21} />
              </div>
              <div>
                <h3>Admissions resources</h3>
                <p>
                  This section is prepared for future admission forms,
                  joining instructions, required-document checklists and
                  school entry requirements. It does not submit applications
                  or claim that admissions are open.
                </p>
              </div>
            </div>
            <span className="edp-coming">Coming later</span>
          </section>
        </div>
      </main>

      <footer className="edp-footer">
        <div className="edp-container edp-footer-inner">
          <div>
            <strong>Jumuiya Elimu</strong>
            <span> · School documents centre</span>
          </div>
          <div>Private student records are not published in this library.</div>
        </div>
      </footer>
    </div>
  );
}