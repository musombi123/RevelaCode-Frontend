import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

import {
  ArrowLeft,
  RefreshCw,
  Shield,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/Button";

export default function LegalDocs({
  activeTab: activeTabProp = "privacy",
  onBack,
  onClose,
}) {
  const baseUrl =
    import.meta.env.VITE_REVELACODE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_URL;

  const [activeTab, setActiveTab] = useState(activeTabProp);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================================================
     DOCUMENT META
  ========================================================= */

  const documentMeta = useMemo(() => {
    if (activeTab === "terms") {
      return {
        title: "Terms of Service",
        description:
          "The rules and conditions governing your use of RevelaCode.",
        icon: FileText,
        accent: "text-blue-600 dark:text-blue-400",
        iconBg: "bg-blue-50 dark:bg-blue-950/30",
      };
    }

    return {
      title: "Privacy Policy",
      description:
        "How RevelaCode collects, uses, protects, and manages your information.",
      icon: Shield,
      accent: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
    };
  }, [activeTab]);

  /* =========================================================
     LOAD DOCUMENT
  ========================================================= */

  const loadDocFromBackend = useCallback(
    async (type) => {
      if (!baseUrl) {
        setError(
          "Missing API base URL. Check your environment variables."
        );
        setContent("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const res = await fetch(
          `${baseUrl}/api/legal/${encodeURIComponent(type)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        if (!res.ok) {
          const text = await res.text();

          throw new Error(
            text || "Failed to load legal document."
          );
        }

        const data = await res.json();

        const documentContent =
          typeof data?.content === "string"
            ? data.content.trim()
            : "";

        setContent(
          documentContent ||
            `No ${
              type === "privacy"
                ? "privacy policy"
                : "terms of service"
            } document is currently available.`
        );
      } catch (err) {
        console.error("Legal document error:", err);

        setError(
          err?.message ||
            "Could not load the legal document."
        );

        setContent("");
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  /* =========================================================
     SYNC ACTIVE TAB
  ========================================================= */

  useEffect(() => {
    setActiveTab(activeTabProp);
  }, [activeTabProp]);

  /* =========================================================
     LOAD ACTIVE DOCUMENT
  ========================================================= */

  useEffect(() => {
    loadDocFromBackend(activeTab);
  }, [activeTab, loadDocFromBackend]);

  /* =========================================================
     SAFE INLINE MARKDOWN
  ========================================================= */

  const renderInlineMarkdown = (text, keyPrefix = "") => {
    if (!text) return null;

    const tokens = [];
    let remaining = String(text);
    let index = 0;

    const pushText = (value) => {
      if (value) {
        tokens.push(
          <React.Fragment key={`${keyPrefix}-text-${index++}`}>
            {value}
          </React.Fragment>
        );
      }
    };

    while (remaining.length > 0) {
      /* -----------------------------------------------------
         BOLD
      ----------------------------------------------------- */

      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);

      /* -----------------------------------------------------
         LINK
      ----------------------------------------------------- */

      const linkMatch = remaining.match(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/
      );

      /* -----------------------------------------------------
         AUTO URL
      ----------------------------------------------------- */

      const urlMatch = remaining.match(
        /https?:\/\/[^\s<]+/
      );

      const matches = [
        boldMatch
          ? {
              type: "bold",
              index: boldMatch.index,
              length: boldMatch[0].length,
              value: boldMatch[1],
            }
          : null,

        linkMatch
          ? {
              type: "link",
              index: linkMatch.index,
              length: linkMatch[0].length,
              label: linkMatch[1],
              url: linkMatch[2],
            }
          : null,

        urlMatch
          ? {
              type: "url",
              index: urlMatch.index,
              length: urlMatch[0].length,
              url: urlMatch[0],
            }
          : null,
      ]
        .filter(Boolean)
        .sort((a, b) => a.index - b.index);

      const next = matches[0];

      if (!next) {
        pushText(remaining);
        break;
      }

      if (next.index > 0) {
        pushText(
          remaining.slice(0, next.index)
        );
      }

      if (next.type === "bold") {
        tokens.push(
          <strong
            key={`${keyPrefix}-bold-${index++}`}
            className="font-bold text-slate-900 dark:text-white"
          >
            {renderInlineMarkdown(
              next.value,
              `${keyPrefix}-bold`
            )}
          </strong>
        );
      }

      if (next.type === "link") {
        tokens.push(
          <a
            key={`${keyPrefix}-link-${index++}`}
            href={next.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {next.label}
            <ExternalLink className="ml-1 inline h-3 w-3" />
          </a>
        );
      }

      if (next.type === "url") {
        tokens.push(
          <a
            key={`${keyPrefix}-url-${index++}`}
            href={next.url}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {next.url}
          </a>
        );
      }

      remaining = remaining.slice(
        next.index + next.length
      );
    }

    return tokens;
  };

  /* =========================================================
     MARKDOWN DOCUMENT RENDERER
  ========================================================= */

  const renderDocumentContent = () => {
    if (!content) return null;

    const lines = content.replace(/\r\n/g, "\n").split("\n");

    const elements = [];
    let paragraphBuffer = [];
    let listBuffer = null;

    const flushParagraph = () => {
      if (!paragraphBuffer.length) return;

      const text = paragraphBuffer.join(" ").trim();

      if (text) {
        elements.push(
          <p
            key={`paragraph-${elements.length}`}
            className="mb-5 text-sm leading-7 text-slate-600 dark:text-slate-300"
          >
            {renderInlineMarkdown(
              text,
              `paragraph-${elements.length}`
            )}
          </p>
        );
      }

      paragraphBuffer = [];
    };

    const flushList = () => {
      if (!listBuffer || !listBuffer.items.length) {
        listBuffer = null;
        return;
      }

      const isOrdered =
        listBuffer.type === "ordered";

      const ListTag = isOrdered ? "ol" : "ul";

      elements.push(
        <ListTag
          key={`list-${elements.length}`}
          className={
            isOrdered
              ? "mb-5 ml-5 list-decimal space-y-2 text-sm leading-7 text-slate-600 dark:text-slate-300"
              : "mb-5 ml-5 list-disc space-y-2 text-sm leading-7 text-slate-600 dark:text-slate-300"
          }
        >
          {listBuffer.items.map((item, itemIndex) => (
            <li key={`list-item-${itemIndex}`}>
              {renderInlineMarkdown(
                item,
                `list-${elements.length}-${itemIndex}`
              )}
            </li>
          ))}
        </ListTag>
      );

      listBuffer = null;
    };

    const startList = (type) => {
      flushParagraph();

      if (!listBuffer || listBuffer.type !== type) {
        flushList();

        listBuffer = {
          type,
          items: [],
        };
      }
    };

    lines.forEach((rawLine, lineIndex) => {
      const line = rawLine.trim();

      /* -----------------------------------------------------
         EMPTY LINE
      ----------------------------------------------------- */

      if (!line) {
        flushParagraph();
        flushList();
        return;
      }

      /* -----------------------------------------------------
         HORIZONTAL RULE
      ----------------------------------------------------- */

      if (/^(\*\s*){3,}$/.test(line) || /^(-\s*){3,}$/.test(line)) {
        flushParagraph();
        flushList();

        elements.push(
          <hr
            key={`hr-${lineIndex}`}
            className="my-8 border-slate-200 dark:border-slate-800"
          />
        );

        return;
      }

      /* -----------------------------------------------------
         HEADINGS
         Handles both:
         ## Heading
         ### Heading
         ### ## Heading
      ----------------------------------------------------- */

      const headingMatch = line.match(
        /^(#{1,6})\s*(.+)$/
      );

      if (headingMatch) {
        flushParagraph();
        flushList();

        const rawHeading = headingMatch[2]
          .replace(/^#{1,6}\s*/, "")
          .trim();

        const level = Math.min(
          headingMatch[1].length,
          4
        );

        const HeadingTag =
          level === 1
            ? "h1"
            : level === 2
            ? "h2"
            : level === 3
            ? "h3"
            : "h4";

        const className =
          level === 1
            ? "mb-5 mt-0 text-2xl font-black tracking-tight text-slate-900 dark:text-white"
            : level === 2
            ? "mb-4 mt-10 text-xl font-black tracking-tight text-slate-900 dark:text-white"
            : level === 3
            ? "mb-3 mt-8 text-base font-bold text-slate-900 dark:text-white"
            : "mb-2 mt-6 text-sm font-bold text-slate-900 dark:text-white";

        elements.push(
          <HeadingTag
            key={`heading-${lineIndex}`}
            className={className}
          >
            {renderInlineMarkdown(
              rawHeading,
              `heading-${lineIndex}`
            )}
          </HeadingTag>
        );

        return;
      }

      /* -----------------------------------------------------
         BULLET LIST
      ----------------------------------------------------- */

      const bulletMatch = line.match(
        /^[-*+]\s+(.+)$/
      );

      if (bulletMatch) {
        startList("unordered");
        listBuffer.items.push(
          bulletMatch[1]
        );
        return;
      }

      /* -----------------------------------------------------
         NUMBERED LIST
      ----------------------------------------------------- */

      const orderedMatch = line.match(
        /^\d+\.\s+(.+)$/
      );

      if (orderedMatch) {
        startList("ordered");
        listBuffer.items.push(
          orderedMatch[1]
        );
        return;
      }

      /* -----------------------------------------------------
         BLOCKQUOTE
      ----------------------------------------------------- */

      if (line.startsWith(">")) {
        flushParagraph();
        flushList();

        elements.push(
          <blockquote
            key={`quote-${lineIndex}`}
            className="my-5 border-l-4 border-slate-300 pl-4 text-sm italic leading-7 text-slate-500 dark:border-slate-700 dark:text-slate-400"
          >
            {renderInlineMarkdown(
              line.replace(/^>\s*/, ""),
              `quote-${lineIndex}`
            )}
          </blockquote>
        );

        return;
      }

      /* -----------------------------------------------------
         NORMAL TEXT
      ----------------------------------------------------- */

      paragraphBuffer.push(line);
    });

    flushParagraph();
    flushList();

    return (
      <article className="max-w-none">
        {elements}
      </article>
    );
  };

  const Icon = documentMeta.icon;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="w-full">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}

            <div className="flex items-start gap-3">
              <div
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${documentMeta.iconBg}`}
              >
                <Icon
                  className={`h-5 w-5 ${documentMeta.accent}`}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Legal
                  </span>

                  <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />

                  <span className="text-[10px] font-medium text-slate-400">
                    RevelaCode
                  </span>
                </div>

                <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                  {documentMeta.title}
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {documentMeta.description}
                </p>
              </div>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-red-900/50 dark:hover:bg-red-950/20"
              aria-label="Close Legal Documents"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          DOCUMENT SWITCHER
      ===================================================== */}

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="grid flex-1 grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("privacy")}
              className={`
                flex items-center justify-center gap-2
                rounded-xl px-4 py-3 text-sm font-semibold transition
                ${
                  activeTab === "privacy"
                    ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                }
              `}
            >
              <Shield className="h-4 w-4" />
              Privacy Policy
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("terms")}
              className={`
                flex items-center justify-center gap-2
                rounded-xl px-4 py-3 text-sm font-semibold transition
                ${
                  activeTab === "terms"
                    ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                }
              `}
            >
              <FileText className="h-4 w-4" />
              Terms of Service
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              loadDocFromBackend(activeTab)
            }
            disabled={loading}
            className="h-11 rounded-xl"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />

            {loading
              ? "Refreshing..."
              : "Refresh"}
          </Button>
        </div>
      </div>

      {/* =====================================================
          DOCUMENT CARD
      ===================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/30 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {documentMeta.title}
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                Official RevelaCode document
              </p>
            </div>

            {!loading && !error && content && (
              <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400 sm:flex">
                <CheckCircle2 className="h-3 w-3" />
                Loaded
              </div>
            )}
          </div>
        </div>

        {/* ===================================================
            DOCUMENT BODY
        =================================================== */}

        <div className="max-h-[65vh] overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          {loading ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
              </div>

              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Loading document
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Retrieving the latest version from RevelaCode.
              </p>
            </div>
          ) : error ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Unable to load document
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  loadDocFromBackend(activeTab)
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            </div>
          ) : !content ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <FileText className="mb-4 h-8 w-8 text-slate-300 dark:text-slate-700" />

              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                No document available
              </p>
            </div>
          ) : (
            renderDocumentContent()
          )}
        </div>
      </section>

      {/* =====================================================
          FOOTER NOTE
      ===================================================== */}

      <div className="mt-4 flex items-start gap-2 px-1">
        <Shield className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />

        <p className="text-[11px] leading-5 text-slate-400">
          These documents are provided as part of the
          RevelaCode platform. Always refer to the latest
          version published by RevelaCode.
        </p>
      </div>
    </div>
  );
}
