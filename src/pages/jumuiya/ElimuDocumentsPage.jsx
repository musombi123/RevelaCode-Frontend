import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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

import { useElimuApi } from "@/services/elimuApi.jsx";

// ============================================================
// ELIMU PUBLIC DOCUMENTS LIBRARY
// Confirmed backend endpoints:
// GET  /api/jumuiya/elimu/public/documents
// GET  /api/jumuiya/elimu/public/documents/<document_id>/download
//
// Public visibility and download authorization must be enforced
// by the backend. This frontend does not bypass those controls.
// ============================================================

const CATEGORIES = [
  { id: "all", label: "All documents" },
  { id: "fees", label: "Fee structures" },
  { id: "forms", label: "School forms" },
  { id: "calendar", label: "Calendars & notices" },
  { id: "handbook", label: "Handbooks" },
  { id: "admissions", label: "Admissions" },
];

const STYLES = `
  .edp {
    --edp-ink: #172b4d;
    --edp-muted: #64748b;
    --edp-border: #e3eaf3;
    --edp-primary: #155eef;
    --edp-primary-dark: #1048c7;
    --edp-bg: #f6f8fc;
    --edp-green: #13865c;

    min-height: 100vh;
    background: var(--edp-bg);
    color: var(--edp-ink);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system,
      BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .edp *,
  .edp *::before,
  .edp *::after {
    box-sizing: border-box;
  }

  .edp button,
  .edp input {
    font: inherit;
  }

  .edp-container {
    width: min(1180px, calc(100% - 40px));
    margin: 0 auto;
  }

  .edp-topbar {
    background: #fff;
    border-bottom: 1px solid var(--edp-border);
  }

  .edp-topbar-inner {
    min-height: 68px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .edp-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .edp-brand-icon {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    flex-shrink: 0;
    border-radius: 13px;
    color: #fff;
    background: linear-gradient(145deg, #155eef, #428cff);
    box-shadow: 0 5px 14px rgba(21, 94, 239, .17);
  }

  .edp-brand-name {
    font-size: 15px;
    font-weight: 850;
    letter-spacing: -.35px;
  }

  .edp-brand-sub {
    margin-top: 3px;
    color: var(--edp-muted);
    font-size: 11px;
  }

  .edp-security {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 11px;
    border: 1px solid #d5e7dd;
    border-radius: 999px;
    background: #f1faf5;
    color: #18714e;
    font-size: 11px;
    font-weight: 800;
    white-space: nowrap;
  }

  .edp-hero {
    position: relative;
    overflow: hidden;
    padding: 42px 0 37px;
    color: #fff;
    background: linear-gradient(
      120deg,
      #10234d 0%,
      #143f86 59%,
      #1768d2 100%
    );
  }

  .edp-hero::after {
    content: "";
    position: absolute;
    top: -190px;
    right: -100px;
    width: 400px;
    height: 400px;
    border: 1px solid rgba(255, 255, 255, .12);
    border-radius: 50%;
    box-shadow:
      0 0 0 36px rgba(255, 255, 255, .03),
      0 0 0 78px rgba(255, 255, 255, .025);
    pointer-events: none;
  }

  .edp-hero-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(230px, .65fr);
    align-items: center;
    gap: 32px;
  }

  .edp-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
    color: #c8ddff;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-size: 10px;
    font-weight: 850;
  }

  .edp-hero h1 {
    max-width: 690px;
    margin: 0;
    font-size: clamp(30px, 4vw, 47px);
    line-height: 1.12;
    letter-spacing: -1.6px;
    font-weight: 850;
  }

  .edp-hero p {
    max-width: 650px;
    margin: 16px 0 0;
    color: #d7e5ff;
    font-size: 14px;
    line-height: 1.8;
  }

  .edp-hero-note {
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, .18);
    border-radius: 18px;
    background: rgba(255, 255, 255, .08);
  }

  .edp-hero-note-icon {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    margin-bottom: 15px;
    border-radius: 13px;
    color: #fff;
    background: rgba(255, 255, 255, .14);
  }

  .edp-hero-note strong {
    display: block;
    font-size: 14px;
  }

  .edp-hero-note span {
    display: block;
    margin-top: 8px;
    color: #d6e4ff;
    font-size: 11px;
    line-height: 1.75;
  }

  .edp-main {
    padding: 30px 0 50px;
  }

  .edp-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 19px;
  }

  .edp-heading h2 {
    margin: 0;
    font-size: 22px;
    letter-spacing: -.55px;
    font-weight: 850;
  }

  .edp-heading p {
    margin: 7px 0 0;
    color: var(--edp-muted);
    font-size: 12px;
    line-height: 1.7;
  }

  .edp-count {
    color: var(--edp-muted);
    font-size: 11px;
    white-space: nowrap;
  }

  .edp-tools {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 20px;
  }

  .edp-search {
    display: flex;
    align-items: center;
    gap: 9px;
    min-height: 43px;
    width: min(400px, 100%);
    padding: 0 12px;
    border: 1px solid var(--edp-border);
    border-radius: 11px;
    background: #fff;
    color: #7d8ba2;
  }

  .edp-search input {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--edp-ink);
    font-size: 12px;
  }

  .edp-search input::placeholder {
    color: #96a2b4;
  }

  .edp-categories {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 22px;
  }

  .edp-category {
    padding: 9px 12px;
    border: 1px solid var(--edp-border);
    border-radius: 999px;
    background: #fff;
    color: #596c86;
    font-size: 11px;
    font-weight: 750;
    cursor: pointer;
    transition: border-color .18s ease, background .18s ease;
  }

  .edp-category.active {
    border-color: #c9dcff;
    background: #eaf2ff;
    color: #1555c2;
  }

  .edp-banner {
    display: flex;
    align-items: flex-start;
    gap: 11px;
    padding: 13px 15px;
    margin-bottom: 18px;
    border-radius: 12px;
    font-size: 11px;
    line-height: 1.7;
  }

  .edp-banner.info {
    border: 1px solid #d8e7ff;
    background: #eef5ff;
    color: #315a93;
  }

  .edp-banner.error {
    border: 1px solid #ffd9d6;
    background: #fff2f1;
    color: #9d2929;
  }

  .edp-banner svg {
    flex-shrink: 0;
    margin-top: 1px;
  }

  .edp-banner strong {
    display: block;
    margin-bottom: 2px;
  }

  .edp-banner code {
    overflow-wrap: anywhere;
  }

  .edp-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .edp-card {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 18px;
    border: 1px solid var(--edp-border);
    border-radius: 16px;
    background: #fff;
    transition: transform .18s ease, box-shadow .18s ease;
  }

  .edp-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(27, 51, 89, .06);
  }

  .edp-card-top {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .edp-file-icon {
    display: grid;
    place-items: center;
    width: 45px;
    height: 49px;
    flex-shrink: 0;
    border-radius: 12px;
    background: #edf3ff;
    color: #155eef;
  }

  .edp-file-icon.pdf {
    background: #fff0ee;
    color: #c24132;
  }

  .edp-file-icon.sheet {
    background: #e9f8ee;
    color: #16834f;
  }

  .edp-file-icon.archive {
    background: #fff5e8;
    color: #a15b10;
  }

  .edp-file-heading {
    flex: 1;
    min-width: 0;
  }

  .edp-file-heading h3 {
    margin: 1px 0 7px;
    font-size: 14px;
    line-height: 1.45;
    font-weight: 820;
    letter-spacing: -.2px;
    overflow-wrap: anywhere;
  }

  .edp-type {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 6px;
    border-radius: 5px;
    background: #f4f6fa;
    color: #667993;
    font-size: 9px;
    font-weight: 850;
    text-transform: uppercase;
    letter-spacing: .45px;
  }

  .edp-description {
    margin: 14px 0 16px;
    color: var(--edp-muted);
    font-size: 11px;
    line-height: 1.8;
    overflow-wrap: anywhere;
    white-space: pre-line;
  }

  .edp-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: auto;
    color: #7b8ba2;
    font-size: 10px;
  }

  .edp-meta span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .edp-card-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding-top: 14px;
    margin-top: 16px;
    border-top: 1px solid #edf0f5;
  }

  .edp-download {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 9px 12px;
    border: 0;
    border-radius: 9px;
    background: var(--edp-primary);
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .edp-download:hover {
    background: var(--edp-primary-dark);
  }

  .edp-download:disabled {
    opacity: .65;
    cursor: wait;
  }

  .edp-status {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #18805b;
    font-size: 10px;
    font-weight: 750;
  }

  .edp-empty {
    padding: 44px 20px;
    border: 1px dashed #d3ddeb;
    border-radius: 16px;
    background: #fff;
    text-align: center;
  }

  .edp-empty-icon {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    margin: 0 auto 14px;
    border-radius: 15px;
    background: #edf3ff;
    color: #4676c8;
  }

  .edp-empty h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 800;
  }

  .edp-empty p {
    max-width: 430px;
    margin: 8px auto 0;
    color: var(--edp-muted);
    font-size: 11px;
    line-height: 1.8;
  }

  .edp-retry {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 10px 12px;
    margin-top: 14px;
    border: 1px solid #cddcf3;
    border-radius: 9px;
    background: #fff;
    color: #2457a6;
    font-size: 11px;
    font-weight: 750;
    cursor: pointer;
  }

  .edp-retry:disabled {
    opacity: .65;
    cursor: wait;
  }

  .edp-admissions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 20px;
    margin-top: 25px;
    border: 1px solid #dce8fb;
    border-radius: 15px;
    background: linear-gradient(110deg, #eef5ff, #f8fbff);
  }

  .edp-admissions-copy {
    display: flex;
    align-items: flex-start;
    gap: 13px;
  }

  .edp-admissions-icon {
    display: grid;
    place-items: center;
    width: 43px;
    height: 43px;
    flex-shrink: 0;
    border-radius: 12px;
    background: #fff;
    color: #155eef;
  }

  .edp-admissions h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 850;
  }

  .edp-admissions p {
    max-width: 610px;
    margin: 6px 0 0;
    color: #647895;
    font-size: 11px;
    line-height: 1.75;
  }

  .edp-coming {
    flex-shrink: 0;
    padding: 7px 10px;
    border: 1px solid #d8e2f1;
    border-radius: 999px;
    background: #fff;
    color: #5e7190;
    font-size: 10px;
    font-weight: 800;
  }

  .edp-footer {
    padding: 20px 0;
    border-top: 1px solid var(--edp-border);
    background: #fff;
    color: #75849a;
    font-size: 10px;
  }

  .edp-footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .edp-footer strong {
    color: var(--edp-ink);
  }

  .edp button:focus-visible,
  .edp input:focus-visible {
    outline: 2px solid #77a6ff;
    outline-offset: 3px;
  }

  @media (max-width: 900px) {
    .edp-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .edp-hero-grid {
      grid-template-columns: minmax(0, 1fr) 220px;
      gap: 20px;
    }
  }

  @media (max-width: 640px) {
    .edp-container {
      width: calc(100% - 28px);
    }

    .edp-topbar-inner {
      min-height: 60px;
    }

    .edp-brand-icon {
      width: 38px;
      height: 38px;
    }

    .edp-brand-name {
      font-size: 14px;
    }

    .edp-security {
      padding: 7px 8px;
      font-size: 9px;
    }

    .edp-hero {
      padding: 31px 0 29px;
    }

    .edp-hero-grid {
      grid-template-columns: 1fr;
    }

    .edp-hero h1 {
      font-size: 34px;
      letter-spacing: -1.1px;
    }

    .edp-hero p {
      font-size: 12px;
    }

    .edp-hero-note {
      display: none;
    }

    .edp-main {
      padding: 23px 0 35px;
    }

    .edp-heading {
      align-items: flex-start;
    }

    .edp-heading h2 {
      font-size: 20px;
    }

    .edp-count {
      padding-top: 5px;
    }

    .edp-search {
      width: 100%;
    }

    .edp-categories {
      flex-wrap: nowrap;
      overflow-x: auto;
      padding-bottom: 7px;
    }

    .edp-category {
      flex-shrink: 0;
    }

    .edp-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .edp-admissions {
      align-items: flex-start;
      padding: 15px;
    }

    .edp-admissions-copy {
      gap: 10px;
    }

    .edp-coming {
      font-size: 9px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .edp *,
    .edp *::before,
    .edp *::after {
      transition: none !important;
    }
  }
`;

function unwrapPayload(payload) {
  let current = payload;

  for (let index = 0; index < 4; index += 1) {
    if (
      !current ||
      typeof current !== "object" ||
      Array.isArray(current)
    ) {
      break;
    }

    if (current.success === false || current.ok === false) {
      throw new Error(
        current.message ||
          current.error ||
          "The server could not load documents."
      );
    }

    if (
      current.data &&
      typeof current.data === "object"
    ) {
      current = current.data;
      continue;
    }

    break;
  }

  return current;
}

function extractDocuments(payload) {
  const result = unwrapPayload(payload);

  if (Array.isArray(result)) {
    return result;
  }

  if (result && typeof result === "object") {
    for (const key of [
      "documents",
      "items",
      "results",
      "files",
    ]) {
      if (Array.isArray(result[key])) {
        return result[key];
      }
    }
  }

  return [];
}

function firstText(record, keys, fallback = "") {
  for (const key of keys) {
    const value = record?.[key];

    if (
      typeof value === "string" ||
      typeof value === "number"
    ) {
      const text = String(value).trim();

      if (text) {
        return text;
      }
    }
  }

  return fallback;
}

function normaliseCategory(value) {
  const category = String(value || "").trim().toLowerCase();

  if (/fee|finance|tuition/.test(category)) return "fees";

  if (/admission|joining|enrolment|enrollment/.test(category)) {
    return "admissions";
  }

  if (/calendar|notice|circular|event/.test(category)) {
    return "calendar";
  }

  if (/handbook|policy|rules|guide/.test(category)) {
    return "handbook";
  }

  if (/form|template|application/.test(category)) {
    return "forms";
  }

  return "other";
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatBytes(value) {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes < 0) {
    return "";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(record) {
  const filename = firstText(record, [
    "filename",
    "file_name",
    "original_filename",
    "original_name",
  ]);

  const filenameMatch = filename.match(/\.([a-z0-9]{1,10})$/i);

  if (filenameMatch) {
    return filenameMatch[1].toUpperCase();
  }

  const explicit = firstText(record, [
    "extension",
    "file_type",
    "mime_type",
  ]).toLowerCase();

  if (!explicit) return "FILE";

  const mimeTypes = {
    "application/pdf": "PDF",
    "text/csv": "CSV",
    "application/csv": "CSV",
    "application/zip": "ZIP",
    "application/vnd.ms-excel": "XLS",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      "XLSX",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "DOCX",
    "application/msword": "DOC",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "PPTX",
  };

  if (mimeTypes[explicit]) {
    return mimeTypes[explicit];
  }

  const extension = explicit.includes("/")
    ? explicit.split("/").pop()
    : explicit.replace(/^\./, "");

  const cleaned = extension
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  return cleaned || "FILE";
}

function getFileIcon(extension) {
  if (extension === "PDF") return FileText;

  if (["XLS", "XLSX", "CSV", "ODS"].includes(extension)) {
    return FileSpreadsheet;
  }

  if (["ZIP", "RAR", "7Z"].includes(extension)) {
    return FileArchive;
  }

  return File;
}

function getIconClass(extension) {
  if (extension === "PDF") return "pdf";

  if (["XLS", "XLSX", "CSV", "ODS"].includes(extension)) {
    return "sheet";
  }

  if (["ZIP", "RAR", "7Z"].includes(extension)) {
    return "archive";
  }

  return "";
}

function normaliseDocument(record, index) {
  const id = firstText(record, [
    "id",
    "_id",
    "document_id",
    "uuid",
  ]);

  const status = firstText(
    record,
    ["status", "publication_status"],
    "Published"
  );

  const statusNormalised = status.toLowerCase();

  const blockedStatuses = [
    "draft",
    "private",
    "pending",
    "rejected",
    "archived",
    "unpublished",
  ];

  const visibility = String(
    record?.visibility || ""
  ).toLowerCase();

  const explicitlyPrivate =
    record?.is_public === false ||
    visibility === "private" ||
    blockedStatuses.includes(statusNormalised);

  return {
    id,
    key: id || `document-${index}`,

    title: firstText(
      record,
      ["title", "name", "document_name"],
      "School document"
    ),

    description: firstText(
      record,
      ["description", "summary"],
      "Download this school document for further information."
    ),

    category: normaliseCategory(
      firstText(record, [
        "category",
        "document_type",
        "type",
      ])
    ),

    categoryLabel: firstText(
      record,
      ["category_label", "category", "document_type"],
      "School document"
    ),

    filename: firstText(record, [
      "filename",
      "file_name",
      "original_filename",
      "original_name",
    ]),

    extension: getFileExtension(record),

    size:
      record?.file_size ??
      record?.size_bytes ??
      record?.size ??
      null,

    updatedAt: firstText(
      record,
      ["updated_at", "published_at", "created_at", "date"],
      ""
    ),

    status,
    public: !explicitlyPrivate,
  };
}

function createDownloadFilename(document) {
  const existingName = document.filename?.trim();

  if (existingName) {
    // Prevent a server-provided filename from controlling directories.
    return existingName.split(/[\\/]/).pop();
  }

  const extension =
    document.extension &&
    document.extension !== "FILE"
      ? `.${document.extension.toLowerCase()}`
      : "";

  const safeTitle = document.title
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return `${safeTitle || "school-document"}${extension}`;
}

function DocumentCard({
  document,
  downloading,
  onDownload,
}) {
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
          <span className="edp-type">
            {document.extension}
          </span>
        </div>
      </div>

      <p className="edp-description">
        {document.description}
      </p>

      <div className="edp-meta">
        <span>
          <CalendarDays size={13} />
          {formatDate(document.updatedAt)}
        </span>

        {size && <span>{size}</span>}
      </div>

      <div className="edp-card-bottom">
        <span className="edp-status">
          <CheckCircle2 size={12} />
          {document.status}
        </span>

        {document.id ? (
          <button
            type="button"
            className="edp-download"
            onClick={() => onDownload(document)}
            disabled={downloading}
            aria-label={`Download ${document.title}`}
          >
            {downloading ? (
              <RefreshCw size={14} />
            ) : (
              <Download size={14} />
            )}

            {downloading ? "Downloading…" : "Download"}
          </button>
        ) : (
          <span
            style={{
              color: "#9a5a12",
              fontSize: 10,
            }}
          >
            Download unavailable
          </span>
        )}
      </div>
    </article>
  );
}

export default function ElimuDocumentsPage() {
  const api = useElimuApi();

  const [documents, setDocuments] = useState([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState("");
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");

  const loadDocuments = useCallback(
    async ({ silent = false, signal } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        // Maps to GET /api/jumuiya/elimu/public/documents.
        // The shared client omits credentials for public requests.
        const response = await api.getPublicDocuments(
          undefined,
          { signal }
        );

        const records = extractDocuments(response);

        setDocuments(
          records
            .map((record, index) =>
              normaliseDocument(record, index)
            )
            .filter((document) => document.public)
        );
      } catch (loadError) {
        if (loadError?.name === "AbortError") {
          return;
        }

        setDocuments([]);

        setError(
          loadError?.message ||
            "Could not load school documents. Check your connection and try again."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [api]
  );

  useEffect(() => {
    const controller = new AbortController();

    loadDocuments({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [loadDocuments]);

  const downloadDocument = useCallback(
    async (document) => {
      if (!document?.id) return;

      setDownloadingId(document.id);
      setDownloadError("");

      let objectUrl = "";

      try {
        // Maps to GET
        // /api/jumuiya/elimu/public/documents/<id>/download.
        const blob = await api.downloadPublicDocument(
          document.id
        );

        if (!(blob instanceof Blob)) {
          throw new Error(
            "The server did not return a downloadable file."
          );
        }

        if (blob.size === 0) {
          throw new Error(
            "The downloaded document is empty."
          );
        }

        objectUrl = URL.createObjectURL(blob);

        const link = window.document.createElement("a");
        link.href = objectUrl;
        link.download = createDownloadFilename(document);
        link.style.display = "none";

        window.document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 1500);

        objectUrl = "";
      } catch (downloadFailure) {
        setDownloadError(
          downloadFailure?.message ||
            `Could not download "${document.title}". Please try again.`
        );
      } finally {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }

        setDownloadingId("");
      }
    },
    [api]
  );

  const categoryCounts = useMemo(() => {
    const counts = { all: documents.length };

    for (const document of documents) {
      counts[document.category] =
        (counts[document.category] || 0) + 1;
    }

    return counts;
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesCategory =
        category === "all" ||
        document.category === category;

      const searchableText = [
        document.title,
        document.description,
        document.categoryLabel,
        document.extension,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesCategory &&
        (!query || searchableText.includes(query))
      );
    });
  }, [documents, category, search]);

  const resetFilters = useCallback(() => {
    setSearch("");
    setCategory("all");
  }, []);

  return (
    <div className="edp">
      <style>{STYLES}</style>

      <header className="edp-topbar">
        <div className="edp-container edp-topbar-inner">
          <div className="edp-brand">
            <div className="edp-brand-icon">
              <GraduationCap size={23} />
            </div>

            <div>
              <div className="edp-brand-name">
                Jumuiya Elimu
              </div>

              <div className="edp-brand-sub">
                School documents centre
              </div>
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

            <h1>
              School documents, ready when you need them.
            </h1>

            <p>
              Find published fee structures, school forms,
              calendars, handbooks and other official resources
              in one place.
            </p>
          </div>

          <div className="edp-hero-note">
            <div className="edp-hero-note-icon">
              <LockKeyhole size={22} />
            </div>

            <strong>Your information matters</strong>

            <span>
              This page is for public documents. Personal fee
              statements, report cards and student records must
              be accessed through an authorized account.
            </span>
          </div>
        </div>
      </section>

      <main className="edp-main">
        <div className="edp-container">
          <div className="edp-heading">
            <div>
              <h2>Documents library</h2>

              <p>
                Search, filter and download school-approved
                resources.
              </p>
            </div>

            <span className="edp-count" aria-live="polite">
              {loading
                ? "Loading…"
                : `${filteredDocuments.length} ${
                    filteredDocuments.length === 1
                      ? "document"
                      : "documents"
                  }`}
            </span>
          </div>

          <div className="edp-tools">
            <label className="edp-search">
              <Search size={16} />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by title or description…"
                aria-label="Search school documents"
              />
            </label>
          </div>

          <nav
            className="edp-categories"
            aria-label="Document categories"
          >
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`edp-category ${
                  category === item.id ? "active" : ""
                }`}
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
            <div
              className="edp-banner error"
              role="alert"
            >
              <XCircle size={17} />

              <div>
                <strong>
                  Unable to load the documents library.
                </strong>

                <div>{error}</div>

                <button
                  type="button"
                  className="edp-retry"
                  onClick={() =>
                    loadDocuments({ silent: true })
                  }
                  disabled={refreshing}
                >
                  <RefreshCw size={13} />

                  {refreshing
                    ? "Refreshing…"
                    : "Try again"}
                </button>
              </div>
            </div>
          )}

          {downloadError && (
            <div
              className="edp-banner error"
              role="alert"
            >
              <XCircle size={17} />

              <div>
                <strong>Download failed.</strong>
                <div>{downloadError}</div>
              </div>
            </div>
          )}

          {loading ? (
            <div
              className="edp-empty"
              aria-live="polite"
            >
              <div className="edp-empty-icon">
                <RefreshCw size={22} />
              </div>

              <h3>Loading the documents library</h3>

              <p>
                Fetching published documents from the Elimu
                backend.
              </p>
            </div>
          ) : !error &&
            filteredDocuments.length > 0 ? (
            <div className="edp-grid">
              {filteredDocuments.map((document) => (
                <DocumentCard
                  key={document.key}
                  document={document}
                  downloading={
                    downloadingId === document.id
                  }
                  onDownload={downloadDocument}
                />
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
                  ? "Admission forms and joining instructions can appear here when the school publishes them."
                  : search
                    ? "Try another search term or select a different category."
                    : "When the school publishes approved documents, they will appear here."}
              </p>

              {(search || category !== "all") && (
                <button
                  type="button"
                  className="edp-retry"
                  onClick={resetFilters}
                >
                  View all documents
                  <ArrowRight size={13} />
                </button>
              )}

              {!documents.length && (
                <button
                  type="button"
                  className="edp-retry"
                  onClick={() =>
                    loadDocuments({ silent: true })
                  }
                  disabled={refreshing}
                >
                  <RefreshCw size={13} />

                  {refreshing
                    ? "Refreshing…"
                    : "Refresh library"}
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
                  This section is prepared for future admission
                  forms, joining instructions, required-document
                  checklists and school entry requirements. It
                  does not submit applications or claim that
                  admissions are open.
                </p>
              </div>
            </div>

            <span className="edp-coming">
              Coming later
            </span>
          </section>
        </div>
      </main>

      <footer className="edp-footer">
        <div className="edp-container edp-footer-inner">
          <div>
            <strong>Jumuiya Elimu</strong>
            <span> · School documents centre</span>
          </div>

          <div>
            Private student records are not published in this
            library.
          </div>
        </div>
      </footer>
    </div>
  );
}