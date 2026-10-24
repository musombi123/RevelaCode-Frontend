import React, { cloneElement, isValidElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertCircle, ArrowLeft, ArrowUp, BookOpen, Check, ChevronDown, ChevronLeft,
  ChevronRight, Clock3, Copy, ExternalLink, FileText, Loader2, ListTree, Moon,
  Printer, RefreshCw, Search, ShieldCheck, Sun, X,
} from "lucide-react";

const DEFAULT_BACKEND_URL = "https://revelacode-backend.onrender.com";
const ENV = import.meta.env || {};
function getBackendBaseUrl() {
  return String(ENV.VITE_API_BASE_URL || ENV.VITE_BACKEND_URL || ENV.VITE_API_URL || DEFAULT_BACKEND_URL).trim().replace(/\/+$/, "");
}

const DOCUMENTS = [
  { type: "privacy", title: "Privacy Policy", description: "How RevelaCode and Jumuiya handle personal information." },
  { type: "terms", title: "Terms of Service", description: "Terms that apply when using RevelaCode and Jumuiya services." },
];
const TAB_OPTIONS = [{ type: "all", title: "All documents" }, ...DOCUMENTS.map((doc) => ({ type: doc.type, title: doc.title }))];

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long", day: "numeric" }).format(date);
}

function stripMarkdown(value) {
  return String(value || "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_~]/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return stripMarkdown(value).toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function createHeadingList(type, content) {
  const headings = [];
  const used = new Map();
  let insideFence = false;
  String(content || "").split(/\r?\n/).forEach((line) => {
    if (/^\s{0,3}(\x60{3,}|~{3,})/.test(line)) { insideFence = !insideFence; return; }
    if (insideFence) return;
    const match = line.match(/^\s{0,3}(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (!match) return;
    const level = match[1].length;
    const title = stripMarkdown(match[2]);
    if (!title) return;
    const base = slugify(title);
    const occurrence = used.get(base) || 0;
    used.set(base, occurrence + 1);
    headings.push({ level, title, slug: occurrence ? base + "-" + (occurrence + 1) : base, id: type + "-" + (occurrence ? base + "-" + (occurrence + 1) : base) });
  });
  return headings;
}

function getTextFromReact(node) {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getTextFromReact).join("");
  if (isValidElement(node)) return getTextFromReact(node.props.children);
  return "";
}

function getWordCount(content) {
  const text = String(content || "").replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, " $1 ").replace(/\[([^\]]+)\]\([^)]*\)/g, " $1 ")
    .replace(/<[^>]*>/g, " ").replace(/[*_~>|]/g, " ")
    .replace(new RegExp(String.fromCharCode(96), "g"), " ").trim();
  return text ? text.split(/\s+/).length : 0;
}
function getReadingMinutes(content) { return Math.max(1, Math.ceil(getWordCount(content) / 220)); }
function escapeRegExp(value) {
  return String(value).split("").map((character) => "\\^$.*+?()[]{}|".includes(character) ? "\\" + character : character).join("");
}
function countMatches(content, query) {
  const term = String(query || "").trim();
  if (term.length < 2) return 0;
  const matches = String(content || "").match(new RegExp(escapeRegExp(term), "gi"));
  return matches ? matches.length : 0;
}
function highlightNodes(children, query) {
  const term = String(query || "").trim();
  if (term.length < 2) return children;
  const pattern = new RegExp(escapeRegExp(term), "gi");
  return React.Children.map(children, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      const text = String(child);
      const parts = [];
      let lastIndex = 0;
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
        parts.push(<mark className="legal-match" data-legal-match="true" key={"match-" + match.index}>{match[0]}</mark>);
        lastIndex = match.index + match[0].length;
        if (!match[0].length) pattern.lastIndex += 1;
      }
      if (!parts.length) return child;
      if (lastIndex < text.length) parts.push(text.slice(lastIndex));
      return parts;
    }
    if (isValidElement(child) && child.props && child.props.children !== undefined) {
      return cloneElement(child, { ...child.props, children: highlightNodes(child.props.children, term) });
    }
    return child;
  });
}

function sanitizeMarkdownHref(href) {
  if (typeof href !== "string") return null;
  const value = href.trim();
  if (!value || value.startsWith("//")) return null;
  if (value.startsWith("#")) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (/^mailto:[^\s]+$/i.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch { return null; }
}
function isSafeImageSource(src) {
  if (typeof src !== "string") return false;
  try { return new URL(src, window.location.origin).protocol === "https:" && /^https:\/\//i.test(src); }
  catch { return false; }
}
function pageUrl(location, hash) {
  if (typeof window === "undefined") return "";
  return window.location.origin + location.pathname + location.search + (hash || "");
}

function MarkdownDocument({ type, content, headings, query, onCopyLink }) {
  const cursor = { index: 0 };
  const makeHeading = (level) => ({ children }) => {
    const title = getTextFromReact(children).trim();
    let heading = null;
    if (level === 2 || level === 3) {
      while (cursor.index < headings.length) {
        const candidate = headings[cursor.index++];
        if (candidate.level === level && candidate.title === stripMarkdown(title)) { heading = candidate; break; }
      }
    }
    const id = heading ? heading.id : type + "-" + slugify(title || "introduction");
    const Tag = "h" + level;
    return (
      <Tag className={"legal-md-h" + level} id={id}>
        <span>{highlightNodes(children, query)}</span>
        {level === 2 && <button type="button" className="legal-heading-copy" onClick={() => onCopyLink(id)} aria-label={"Copy link to " + title} title="Copy section link"><Copy size={14} aria-hidden="true" /></button>}
      </Tag>
    );
  };
  const components = {
    h1: makeHeading(1), h2: makeHeading(2), h3: makeHeading(3), h4: makeHeading(4), h5: makeHeading(5), h6: makeHeading(6),
    p: ({ children }) => <p>{highlightNodes(children, query)}</p>,
    ul: ({ children }) => <ul>{children}</ul>,
    ol: ({ children, start }) => <ol start={start}>{children}</ol>,
    li: ({ children }) => <li>{highlightNodes(children, query)}</li>,
    strong: ({ children }) => <strong>{highlightNodes(children, query)}</strong>,
    em: ({ children }) => <em>{highlightNodes(children, query)}</em>,
    del: ({ children }) => <del>{highlightNodes(children, query)}</del>,
    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
    hr: () => <hr />,
    code: ({ children, className }) => <code className={className}>{highlightNodes(children, query)}</code>,
    pre: ({ children }) => <pre>{children}</pre>,
    table: ({ children }) => <div className="legal-table-wrap" role="region" aria-label="Scrollable table" tabIndex={0}><table>{children}</table></div>,
    thead: ({ children }) => <thead>{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr>{children}</tr>,
    th: ({ children, style, align }) => <th style={style} data-align={align || undefined}>{highlightNodes(children, query)}</th>,
    td: ({ children, style, align }) => <td style={style} data-align={align || undefined}>{highlightNodes(children, query)}</td>,
    a: ({ href, children, title }) => {
      const safeHref = sanitizeMarkdownHref(href);
      if (!safeHref) return <span className="legal-link-unavailable" title="This link was omitted because its destination is not secure.">{highlightNodes(children, query)}</span>;
      const external = /^https:\/\//i.test(safeHref);
      return <a href={safeHref} title={title} className="legal-md-link" target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{highlightNodes(children, query)}{external && <ExternalLink size={13} aria-label="Opens in a new tab" />}</a>;
    },
    img: ({ src, alt, title }) => {
      if (!isSafeImageSource(src)) return <span className="legal-image-unavailable">Image omitted: only secure HTTPS images can be displayed.</span>;
      return <figure className="legal-image-figure"><img src={src} alt={alt || ""} title={title} loading="lazy" referrerPolicy="no-referrer" />{alt && <figcaption>{alt}</figcaption>}</figure>;
    },
    input: ({ checked, type: inputType }) => <input className="legal-task-checkbox" type={inputType || "checkbox"} checked={Boolean(checked)} readOnly disabled />,
  };
  return <div className="legal-prose"><ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{content}</ReactMarkdown></div>;
}

function DocumentSkeleton() {
  return <article className="legal-document legal-skeleton" aria-label="Loading published document">
    <div className="legal-skeleton-meta"><span /><span /></div><div className="legal-skeleton-line legal-skeleton-title" />
    <div className="legal-skeleton-line" /><div className="legal-skeleton-line short" /><div className="legal-skeleton-heading" />
    <div className="legal-skeleton-line" /><div className="legal-skeleton-line" /><div className="legal-skeleton-line medium" />
    <div className="legal-skeleton-heading" /><div className="legal-skeleton-line" /><div className="legal-skeleton-line short" />
  </article>;
}

function ErrorDocument({ definition, message, onRetry }) {
  return <section className="legal-error-card" role="alert">
    <span className="legal-error-icon"><AlertCircle size={20} /></span>
    <div className="legal-error-copy"><h2>{definition.title} could not be loaded</h2><p>{message || "The published document could not be retrieved right now."}</p><p className="legal-muted">The page is available, but its published legal record needs attention.</p></div>
    <button type="button" className="legal-button legal-retry" onClick={onRetry}><RefreshCw size={15} /> Try again</button>
  </section>;
}

export default function LegalDocumentsPage() {
  const location = useLocation();
  const pageRef = useRef(null);
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMatch, setActiveMatch] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [theme, setTheme] = useState("light");
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [toast, setToast] = useState("");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  const requestedDocument = useMemo(() => {
    const value = new URLSearchParams(location.search).get("document");
    return value && value.trim() ? value.trim().toLowerCase() : "all";
  }, [location.search]);
  const isKnownDocument = DOCUMENTS.some((doc) => doc.type === requestedDocument);
  const isAll = requestedDocument === "all" || !isKnownDocument;
  const activeTab = isAll ? "all" : requestedDocument;
  const visibleTypes = useMemo(() => isAll ? DOCUMENTS.map((doc) => doc.type) : [requestedDocument], [isAll, requestedDocument]);
  const pageTitle = isAll ? "Legal information" : DOCUMENTS.find((doc) => doc.type === requestedDocument)?.title || "Legal information";

  const headingLists = useMemo(() => {
    const next = {};
    visibleTypes.forEach((type) => { if (documents[type] && typeof documents[type].content === "string") next[type] = createHeadingList(type, documents[type].content); });
    return next;
  }, [documents, visibleTypes]);

  const totalWords = useMemo(() => visibleTypes.reduce((sum, type) => sum + getWordCount(documents[type]?.content || ""), 0), [documents, visibleTypes]);
  const readingMinutes = useMemo(() => visibleTypes.reduce((sum, type) => sum + (documents[type] ? getReadingMinutes(documents[type].content) : 0), 0), [documents, visibleTypes]);
  const allHeadings = useMemo(() => visibleTypes.flatMap((type) => {
    const definition = DOCUMENTS.find((doc) => doc.type === type);
    return (headingLists[type] || []).map((heading) => ({ ...heading, type, documentTitle: definition?.title || type }));
  }), [headingLists, visibleTypes]);

  const loadDocuments = useCallback(async (signal) => {
    setLoading(true);
    setErrors({});
    const base = getBackendBaseUrl();
    const results = await Promise.all(DOCUMENTS.map(async (doc) => {
      try {
        const response = await fetch(base + "/api/legal/" + doc.type, { method: "GET", headers: { Accept: "application/json" }, signal });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.message || "Could not load " + doc.title.toLowerCase() + " (HTTP " + response.status + ").");
        }
        const payload = await response.json();
        if (typeof payload?.content !== "string" || !payload.content.trim()) throw new Error(doc.title + " is currently empty.");
        return { type: doc.type, payload, error: "" };
      } catch (error) {
        if (error?.name === "AbortError") throw error;
        return { type: doc.type, payload: null, error: error?.message || "Could not load " + doc.title.toLowerCase() + "." };
      }
    }));
    const nextDocuments = {};
    const nextErrors = {};
    results.forEach((result) => {
      if (result.payload) nextDocuments[result.type] = result.payload;
      if (result.error) nextErrors[result.type] = result.error;
    });
    setDocuments(nextDocuments);
    setErrors(nextErrors);
    setLoading(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDocuments(controller.signal).catch((error) => {
      if (error?.name !== "AbortError") { setErrors({ general: error?.message || "Unable to load legal documents." }); setLoading(false); }
    });
    return () => controller.abort();
  }, [loadDocuments, refreshKey]);

  useEffect(() => {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(document.documentElement.classList.contains("dark") || prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    let meta = document.querySelector('meta[name="description"]');
    const createdMeta = !meta;
    if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
    const previousDescription = meta.content;
    document.title = pageTitle + " | RevelaCode";
    meta.content = "Read the current published " + (isAll ? "Privacy Policy and Terms of Service" : pageTitle) + " for RevelaCode and Jumuiya.";
    return () => { document.title = previousTitle; if (createdMeta) meta.remove(); else meta.content = previousDescription; };
  }, [isAll, pageTitle]);

  useEffect(() => {
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0);
      setShowTop(window.scrollY > 480);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return undefined;
    const marks = Array.from(root.querySelectorAll("mark[data-legal-match='true']"));
    setMatchCount(marks.length);
    setActiveMatch(0);
    marks.forEach((mark, index) => mark.classList.toggle("is-current", index === 0));
    return undefined;
  }, [searchQuery, documents, visibleTypes]);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return undefined;
    const marks = Array.from(root.querySelectorAll("mark[data-legal-match='true']"));
    marks.forEach((mark, index) => mark.classList.toggle("is-current", index === activeMatch));
    return undefined;
  }, [activeMatch, searchQuery, documents, visibleTypes]);

  useEffect(() => {
    const root = pageRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return undefined;
    const targets = root.querySelectorAll(".legal-prose h2[id], .legal-prose h3[id]");
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        root.querySelectorAll(".legal-toc-link.is-active").forEach((item) => item.classList.remove("is-active"));
        root.querySelectorAll('.legal-toc-link[href="#' + entry.target.id + '"]').forEach((item) => item.classList.add("is-active"));
      }
    }), { rootMargin: "-100px 0px -72% 0px", threshold: 0 });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [documents, visibleTypes]);

  useEffect(() => {
    if (!location.hash || loading) return undefined;
    const frame = window.requestAnimationFrame(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, loading, documents]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = useCallback((message) => setToast(message), []);
  const copyText = useCallback(async (value, successMessage) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      notify(successMessage || "Copied to clipboard");
    } catch { notify("Clipboard access is not available in this browser"); }
  }, [notify]);
  const copyPageLink = useCallback(() => copyText(pageUrl(location), "Page link copied"), [copyText, location]);
  const copyHeadingLink = useCallback((id) => copyText(pageUrl(location, "#" + id), "Section link copied"), [copyText, location]);

  const moveSearchMatch = useCallback((direction) => {
    const marks = Array.from(pageRef.current?.querySelectorAll("mark[data-legal-match='true']") || []);
    if (!marks.length) return;
    const nextIndex = (activeMatch + direction + marks.length) % marks.length;
    setActiveMatch(nextIndex);
    marks[nextIndex]?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  }, [activeMatch]);

  const resetSearch = useCallback(() => { setSearchQuery(""); setActiveMatch(0); }, []);
  const makeTabLocation = (type) => ({ pathname: location.pathname, search: type === "all" ? "" : "?document=" + type });
  const themeToggle = () => setTheme((value) => value === "dark" ? "light" : "dark");

  return (
    <main className="legal-page" data-theme={theme} ref={pageRef} id="legal-top">
      <div className="legal-reading-progress" style={{ width: progress + "%" }} aria-hidden="true" />
      <div className="legal-shell">
        <Link to="/" className="legal-back-link"><ArrowLeft size={17} aria-hidden="true" /><span>Return to RevelaCode</span></Link>

        <header className="legal-hero">
          <div className="legal-hero-glow" aria-hidden="true" />
          <div className="legal-hero-topline"><span className="legal-brand-mark"><ShieldCheck size={23} aria-hidden="true" /></span><span className="legal-eyebrow">RevelaCode <span aria-hidden="true">·</span> Jumuiya</span></div>
          <p className="legal-overline">Official platform policies</p>
          <h1>{pageTitle}</h1>
          <p className="legal-hero-description">Official platform policies and service terms. Choose a document below to review its current published version.</p>
          <div className="legal-hero-facts" aria-label="Reading overview">
            <span><FileText size={14} aria-hidden="true" /> {visibleTypes.length} {visibleTypes.length === 1 ? "document" : "documents"}</span>
            <span><BookOpen size={14} aria-hidden="true" /> {totalWords.toLocaleString()} words</span>
            <span><Clock3 size={14} aria-hidden="true" /> {readingMinutes || 1} min read</span>
          </div>
        </header>

        <nav className="legal-tabs" aria-label="Choose legal document" role="tablist">
          <span className="legal-tab-indicator" aria-hidden="true" />
          {TAB_OPTIONS.map((tab) => <Link key={tab.type} to={makeTabLocation(tab.type)} role="tab" aria-selected={activeTab === tab.type} aria-current={activeTab === tab.type ? "page" : undefined} className={"legal-tab" + (activeTab === tab.type ? " is-active" : "")}>
            {tab.type === "all" && <ListTree size={15} aria-hidden="true" />}{tab.type === "privacy" && <ShieldCheck size={15} aria-hidden="true" />}{tab.type === "terms" && <FileText size={15} aria-hidden="true" />}<span>{tab.title}</span>
          </Link>)}
        </nav>

        <div className="legal-tools" aria-label="Document tools">
          <label className="legal-search"><Search size={17} aria-hidden="true" /><span className="legal-visually-hidden">Search published documents</span>
            <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") moveSearchMatch(event.shiftKey ? -1 : 1); if (event.key === "Escape") resetSearch(); }} placeholder="Search this page…" aria-label="Search this page" />
            {searchQuery && <button type="button" className="legal-search-clear" onClick={resetSearch} aria-label="Clear search"><X size={14} /></button>}
            <span className="legal-search-count" aria-live="polite">{searchQuery.trim().length < 2 ? "Type 2+ chars" : matchCount > 0 ? (activeMatch + 1) + " of " + matchCount : "No matches"}</span>
          </label>
          <div className="legal-tool-actions">
            <button type="button" className="legal-icon-button" onClick={() => moveSearchMatch(-1)} disabled={!matchCount} aria-label="Previous search match" title="Previous match"><ChevronLeft size={17} /></button>
            <button type="button" className="legal-icon-button" onClick={() => moveSearchMatch(1)} disabled={!matchCount} aria-label="Next search match" title="Next match"><ChevronRight size={17} /></button>
            <button type="button" className="legal-button" onClick={copyPageLink}><Copy size={15} aria-hidden="true" /><span>Copy link</span></button>
            <button type="button" className="legal-button" onClick={() => window.print()}><Printer size={15} aria-hidden="true" /><span>Print</span></button>
            <button type="button" className="legal-theme-button" onClick={themeToggle} aria-label={theme === "dark" ? "Switch legal page to light mode" : "Switch legal page to dark mode"} title={theme === "dark" ? "Use light mode" : "Use dark mode"}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}<span>{theme === "dark" ? "Light mode" : "Dark mode"}</span></button>
          </div>
        </div>

        {errors.general && !loading && <div className="legal-global-error" role="alert"><AlertCircle size={19} /><div><strong>Legal documents could not be loaded.</strong><p>{errors.general}</p></div><button type="button" className="legal-button" onClick={() => setRefreshKey((value) => value + 1)}><RefreshCw size={15} /> Try again</button></div>}

        <div className="legal-layout">
          <aside className="legal-desktop-toc" aria-label="On this page"><div className="legal-toc-sticky">
            <div className="legal-toc-heading">ON THIS PAGE</div>
            {allHeadings.length ? <nav className="legal-toc-list">{visibleTypes.map((type) => {
              const definition = DOCUMENTS.find((doc) => doc.type === type);
              const sections = headingLists[type] || [];
              if (!sections.length) return null;
              return <div className="legal-toc-group" key={type}>{isAll && <div className="legal-toc-document">{definition?.title}</div>}
                {sections.map((heading) => <a key={heading.id} href={"#" + heading.id} className={"legal-toc-link" + (heading.level === 3 ? " is-sub" : "")}>{heading.title}</a>)}
              </div>;
            })}</nav> : <p className="legal-toc-empty">{loading ? "Preparing section links…" : "Headings will appear here when available."}</p>}
          </div></aside>

          <section className="legal-main-column" aria-label="Published legal documents">
            <details className="legal-mobile-toc" open={mobileTocOpen} onToggle={(event) => setMobileTocOpen(event.currentTarget.open)}>
              <summary><ListTree size={16} aria-hidden="true" /> On this page <ChevronDown size={16} aria-hidden="true" /></summary>
              <div className="legal-mobile-toc-content">{allHeadings.length ? allHeadings.map((heading) => <a key={heading.id} href={"#" + heading.id} className={"legal-toc-link" + (heading.level === 3 ? " is-sub" : "")} onClick={() => setMobileTocOpen(false)}>{isAll && <span className="legal-mobile-toc-label">{heading.documentTitle} · </span>}{heading.title}</a>) : <p className="legal-muted">{loading ? "Preparing section links…" : "No section headings are available."}</p>}</div>
            </details>

            {loading ? <div className="legal-document-stack" role="status" aria-label="Loading legal documents">{visibleTypes.map((type) => <DocumentSkeleton key={type} />)}<span className="legal-loading-label"><Loader2 size={15} /> Loading published legal documents…</span></div> : <div className="legal-document-stack">
              {visibleTypes.map((type) => {
                const definition = DOCUMENTS.find((doc) => doc.type === type);
                const publishedDocument = documents[type];
                const errorMessage = errors[type];
                if (!definition) return null;
                if (!publishedDocument && errorMessage) return <ErrorDocument key={type} definition={definition} message={errorMessage} onRetry={() => setRefreshKey((value) => value + 1)} />;
                if (!publishedDocument) return null;
                const headings = headingLists[type] || [];
                const words = getWordCount(publishedDocument.content);
                const minutes = getReadingMinutes(publishedDocument.content);
                return <article className="legal-document" key={type} id={"document-" + type}>
                  <div className="legal-document-meta">
                    <div className="legal-published-label"><BookOpen size={15} aria-hidden="true" /><span>Published document</span></div>
                    <div className="legal-document-meta-right">{publishedDocument.version && <span className="legal-version">Version {publishedDocument.version}</span>}{publishedDocument.lastUpdated && <span>Updated {formatDate(publishedDocument.lastUpdated)}</span>}</div>
                  </div>
                  <header className="legal-document-heading"><div><h2>{definition.title}</h2><p>{definition.description}</p></div>
                    <div className="legal-document-stats" aria-label="Document reading information"><span><BookOpen size={14} /> {words.toLocaleString()} words</span><span><Clock3 size={14} /> {minutes} min read</span></div>
                  </header>
                  <MarkdownDocument type={type} content={publishedDocument.content} headings={headings} query={searchQuery} onCopyLink={copyHeadingLink} />
                </article>;
              })}
              {!visibleTypes.some((type) => documents[type] || errors[type]) && !errors.general && <div className="legal-empty-state"><span><FileText size={22} /></span><h2>No published legal documents available</h2><p>The legal service did not return a published document. Please try again later.</p><button type="button" className="legal-button" onClick={() => setRefreshKey((value) => value + 1)}><RefreshCw size={15} /> Refresh documents</button></div>}
            </div>}
          </section>
        </div>

        <footer className="legal-footer"><div className="legal-footer-brand"><ShieldCheck size={17} aria-hidden="true" /> RevelaCode <span aria-hidden="true">·</span> Jumuiya</div><p>RevelaCode Software Studio · Legal documents for RevelaCode and Jumuiya services.</p><Link to="/" className="legal-footer-link">Return to platform <ArrowLeft size={14} aria-hidden="true" /></Link></footer>
      </div>

      {showTop && <button type="button" className="legal-back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })} aria-label="Back to top" title="Back to top"><ArrowUp size={18} /></button>}
      <div className={"legal-toast" + (toast ? " is-visible" : "")} role="status" aria-live="polite">{toast && <><Check size={15} aria-hidden="true" /> {toast}</>}</div>
    </main>
  );
}
