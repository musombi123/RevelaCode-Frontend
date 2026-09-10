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
} from "lucide-react";

import ReactMarkdown from "react-markdown";

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
     MARKDOWN RENDERER
  ========================================================= */

  const renderDocumentContent = () => {
    if (!content) return null;

    return (
      <article
        className="
          max-w-none
          text-sm
          leading-7
          text-slate-600
          dark:text-slate-300

          [&>h1]:mb-5
          [&>h1]:mt-0
          [&>h1]:text-2xl
          [&>h1]:font-black
          [&>h1]:tracking-tight
          [&>h1]:text-slate-900
          dark:[&>h1]:text-white

          [&>h2]:mb-4
          [&>h2]:mt-10
          [&>h2]:text-xl
          [&>h2]:font-black
          [&>h2]:tracking-tight
          [&>h2]:text-slate-900
          dark:[&>h2]:text-white

          [&>h3]:mb-3
          [&>h3]:mt-8
          [&>h3]:text-base
          [&>h3]:font-bold
          [&>h3]:text-slate-900
          dark:[&>h3]:text-white

          [&>h4]:mb-2
          [&>h4]:mt-6
          [&>h4]:text-sm
          [&>h4]:font-bold
          [&>h4]:text-slate-900
          dark:[&>h4]:text-white

          [&>p]:mb-5
          [&>p]:leading-7

          [&>ul]:mb-5
          [&>ul]:ml-5
          [&>ul]:list-disc
          [&>ul]:space-y-2

          [&>ol]:mb-5
          [&>ol]:ml-5
          [&>ol]:list-decimal
          [&>ol]:space-y-2

          [&_li]:pl-1

          [&>hr]:my-8
          [&>hr]:border-slate-200
          dark:[&>hr]:border-slate-800

          [&>blockquote]:my-5
          [&>blockquote]:border-l-4
          [&>blockquote]:border-slate-300
          [&>blockquote]:pl-4
          [&>blockquote]:italic
          dark:[&>blockquote]:border-slate-700

          [&_a]:font-semibold
          [&_a]:text-blue-600
          [&_a]:underline
          [&_a]:underline-offset-2
          hover:[&_a]:text-blue-700
          dark:[&_a]:text-blue-400
          dark:hover:[&_a]:text-blue-300

          [&_strong]:font-bold
          [&_strong]:text-slate-900
          dark:[&_strong]:text-white

          [&_code]:rounded-md
          [&_code]:bg-slate-100
          [&_code]:px-1.5
          [&_code]:py-0.5
          [&_code]:text-[0.85em]
          dark:[&_code]:bg-slate-800
        "
      >
        <ReactMarkdown
          components={{
            a: ({ node, ...props }) => (
              <a
                {...props}
                target="_blank"
                rel="noopener noreferrer"
              />
            ),

            p: ({ node, children, ...props }) => (
              <p {...props}>{children}</p>
            ),

            h1: ({ node, children, ...props }) => (
              <h1 {...props}>{children}</h1>
            ),

            h2: ({ node, children, ...props }) => (
              <h2 {...props}>{children}</h2>
            ),

            h3: ({ node, children, ...props }) => (
              <h3 {...props}>{children}</h3>
            ),

            h4: ({ node, children, ...props }) => (
              <h4 {...props}>{children}</h4>
            ),

            ul: ({ node, children, ...props }) => (
              <ul {...props}>{children}</ul>
            ),

            ol: ({ node, children, ...props }) => (
              <ol {...props}>{children}</ol>
            ),

            li: ({ node, children, ...props }) => (
              <li {...props}>{children}</li>
            ),

            hr: ({ node, ...props }) => (
              <hr {...props} />
            ),

            blockquote: ({ node, children, ...props }) => (
              <blockquote {...props}>
                {children}
              </blockquote>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
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
                className="
                  mt-1 flex h-9 w-9 flex-shrink-0
                  items-center justify-center
                  rounded-xl border
                  border-slate-200 bg-white
                  text-slate-500
                  transition
                  hover:bg-slate-50
                  hover:text-slate-900
                  dark:border-slate-700
                  dark:bg-slate-900
                  dark:text-slate-400
                  dark:hover:bg-slate-800
                  dark:hover:text-white
                "
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
              className="
                flex h-9 w-9 flex-shrink-0
                items-center justify-center
                rounded-xl border
                border-slate-200 bg-white
                text-slate-400
                transition
                hover:border-red-200
                hover:bg-red-50
                hover:text-red-500
                dark:border-slate-700
                dark:bg-slate-900
                dark:hover:border-red-900/50
                dark:hover:bg-red-950/20
              "
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
                rounded-xl px-4 py-3 text-sm
                font-semibold transition
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
                rounded-xl px-4 py-3 text-sm
                font-semibold transition
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
            onClick={() => loadDocFromBackend(activeTab)}
            disabled={loading}
            className="h-11 rounded-xl"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />

            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* =====================================================
          DOCUMENT CARD
      ===================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Card header */}
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

        {/* Document body */}
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
                onClick={() => loadDocFromBackend(activeTab)}
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
