// src/components/study/StudyReader.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Download,
  RefreshCw,
  Clock3,
  Hash,
  Sparkles,
  BookOpenText,
  CheckCircle2,
  Quote,
  FileText,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/Card";

import AIStudyPanel from "./AIStudyPanel";

/* =========================================================
   API
========================================================= */

const API = (
  import.meta.env.VITE_REVELACODE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  "https://revelacode-backend.onrender.com"
).replace(/\/+$/, "");

/* =========================================================
   MATERIAL ID
========================================================= */

const resolveMaterialId = (material) => {
  const id =
    material?.id ??
    material?._id ??
    material?.material_id ??
    material?.materialId ??
    null;

  return id == null ? null : String(id);
};

/* =========================================================
   CONTENT HELPERS
========================================================= */

/**
 * Converts arbitrary content into a clean string.
 */
const normalizeContent = (content) => {
  if (content == null) {
    return "";
  }

  if (typeof content === "string") {
    return content
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .trim();
  }

  try {
    return String(content).trim();
  } catch {
    return "";
  }
};

/**
 * Approximate reading time.
 */
const getReadingTime = (content) => {
  const words = normalizeContent(content)
    .split(/\s+/)
    .filter(Boolean).length;

  if (!words) {
    return 0;
  }

  return Math.max(
    1,
    Math.ceil(words / 200)
  );
};

/**
 * Word count.
 */
const getWordCount = (content) => {
  return normalizeContent(content)
    .split(/\s+/)
    .filter(Boolean)
    .length;
};

/* =========================================================
   INLINE MARKUP RENDERER
========================================================= */

/**
 * Renders lightweight Markdown-style inline formatting
 * without injecting arbitrary HTML into the page.
 *
 * Supported:
 *   **bold**
 *   __bold__
 *   *italic*
 *   _italic_
 *   ==highlight==
 *   [[highlight]]
 *   ~~strike~~
 *   `code`
 */
function renderInlineText(text, keyPrefix = "inline") {
  if (!text) {
    return null;
  }

  const source = String(text);

  const pattern =
    /(\[\[(.+?)\]\])|(==(.+?)==)|(\*\*(.+?)\*\*)|(__(.+?)__)|(~~(.+?)~~)|(`(.+?)`)|(\*([^*]+?)\*)|(_([^_]+?)_)/g;

  const output = [];

  let lastIndex = 0;
  let match;
  let index = 0;

  while (
    (match = pattern.exec(source)) !== null
  ) {
    if (match.index > lastIndex) {
      output.push(
        <React.Fragment
          key={`${keyPrefix}-text-${index}`}
        >
          {source.slice(
            lastIndex,
            match.index
          )}
        </React.Fragment>
      );

      index += 1;
    }

    /*
     * [[highlight]]
     */
    if (match[2]) {
      output.push(
        <mark
          key={`${keyPrefix}-highlight-${index}`}
          className="
            rounded-md
            bg-amber-100
            px-1.5
            py-0.5
            font-semibold
            text-amber-950
            decoration-amber-400
            shadow-[inset_0_-1px_0_rgba(180,83,9,0.18)]
            dark:bg-amber-300/20
            dark:text-amber-100
          "
        >
          {renderInlineText(
            match[2],
            `${keyPrefix}-h-${index}`
          )}
        </mark>
      );
    }

    /*
     * ==highlight==
     */
    else if (match[4]) {
      output.push(
        <mark
          key={`${keyPrefix}-highlight2-${index}`}
          className="
            rounded-md
            bg-amber-100
            px-1.5
            py-0.5
            font-semibold
            text-amber-950
            shadow-[inset_0_-1px_0_rgba(180,83,9,0.18)]
            dark:bg-amber-300/20
            dark:text-amber-100
          "
        >
          {renderInlineText(
            match[4],
            `${keyPrefix}-h2-${index}`
          )}
        </mark>
      );
    }

    /*
     * **bold**
     */
    else if (match[6]) {
      output.push(
        <strong
          key={`${keyPrefix}-bold-${index}`}
          className="font-bold text-slate-950 dark:text-white"
        >
          {renderInlineText(
            match[6],
            `${keyPrefix}-b-${index}`
          )}
        </strong>
      );
    }

    /*
     * __bold__
     */
    else if (match[8]) {
      output.push(
        <strong
          key={`${keyPrefix}-bold2-${index}`}
          className="font-bold text-slate-950 dark:text-white"
        >
          {renderInlineText(
            match[8],
            `${keyPrefix}-b2-${index}`
          )}
        </strong>
      );
    }

    /*
     * ~~strike~~
     */
    else if (match[10]) {
      output.push(
        <del
          key={`${keyPrefix}-strike-${index}`}
          className="text-slate-400 line-through dark:text-slate-500"
        >
          {renderInlineText(
            match[10],
            `${keyPrefix}-s-${index}`
          )}
        </del>
      );
    }

    /*
     * `code`
     */
    else if (match[12]) {
      output.push(
        <code
          key={`${keyPrefix}-code-${index}`}
          className="
            rounded-md
            border
            border-slate-200
            bg-slate-100
            px-1.5
            py-0.5
            font-mono
            text-[0.9em]
            text-indigo-700
            dark:border-slate-700
            dark:bg-slate-800
            dark:text-indigo-300
          "
        >
          {match[12]}
        </code>
      );
    }

    /*
     * *italic*
     */
    else if (match[14]) {
      output.push(
        <em
          key={`${keyPrefix}-italic-${index}`}
          className="font-medium italic text-slate-800 dark:text-slate-200"
        >
          {renderInlineText(
            match[14],
            `${keyPrefix}-i-${index}`
          )}
        </em>
      );
    }

    /*
     * _italic_
     */
    else if (match[16]) {
      output.push(
        <em
          key={`${keyPrefix}-italic2-${index}`}
          className="font-medium italic text-slate-800 dark:text-slate-200"
        >
          {renderInlineText(
            match[16],
            `${keyPrefix}-i2-${index}`
          )}
        </em>
      );
    }

    lastIndex = pattern.lastIndex;
    index += 1;
  }

  if (lastIndex < source.length) {
    output.push(
      <React.Fragment
        key={`${keyPrefix}-tail`}
      >
        {source.slice(lastIndex)}
      </React.Fragment>
    );
  }

  return output;
}

/* =========================================================
   CONTENT BLOCK PARSER
========================================================= */

/**
 * Turns plain/Markdown-style text into a structured
 * reading layout.
 */
function renderStudyContent(content) {
  const normalized =
    normalizeContent(content);

  if (!normalized) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
        <FileText className="mx-auto h-8 w-8 text-slate-400" />

        <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
          No content available
        </p>
      </div>
    );
  }

  const lines =
    normalized.split("\n");

  const blocks = [];

  let paragraphLines = [];
  let listItems = [];
  let orderedItems = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) {
      return;
    }

    blocks.push({
      type: "paragraph",
      lines: [...paragraphLines],
    });

    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length) {
      blocks.push({
        type: "unordered-list",
        items: [...listItems],
      });

      listItems = [];
    }

    if (orderedItems.length) {
      blocks.push({
        type: "ordered-list",
        items: [...orderedItems],
      });

      orderedItems = [];
    }
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    /*
     * Blank line.
     */
    if (!line) {
      flushParagraph();
      flushList();
      return;
    }

    /*
     * Horizontal rule.
     */
    if (
      /^(-{3,}|\*{3,}|_{3,})$/.test(
        line
      )
    ) {
      flushParagraph();
      flushList();

      blocks.push({
        type: "divider",
        key: index,
      });

      return;
    }

    /*
     * Markdown headings.
     */
    const headingMatch =
      line.match(
        /^(#{1,6})\s+(.+)$/
      );

    if (headingMatch) {
      flushParagraph();
      flushList();

      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2],
        key: index,
      });

      return;
    }

    /*
     * Blockquote.
     */
    if (line.startsWith(">")) {
      flushParagraph();
      flushList();

      blocks.push({
        type: "quote",
        text: line
          .replace(/^>\s?/, "")
          .trim(),
        key: index,
      });

      return;
    }

    /*
     * Unordered list.
     */
    const unorderedMatch =
      line.match(
        /^[-*•]\s+(.+)$/
      );

    if (unorderedMatch) {
      flushParagraph();
      orderedItems = [];

      listItems.push(
        unorderedMatch[1]
      );

      return;
    }

    /*
     * Ordered list.
     */
    const orderedMatch =
      line.match(
        /^\d+[.)]\s+(.+)$/
      );

    if (orderedMatch) {
      flushParagraph();
      listItems = [];

      orderedItems.push(
        orderedMatch[1]
      );

      return;
    }

    /*
     * Normal paragraph line.
     */
    flushList();

    paragraphLines.push(line);
  });

  flushParagraph();
  flushList();

  return (
    <div className="study-content space-y-7">
      {blocks.map(
        (block, index) => {
          switch (block.type) {
            case "heading": {
              const level =
                block.level;

              if (level === 1) {
                return (
                  <div
                    key={`heading-${index}`}
                    className="pt-2"
                  >
                    <h2
                      className="
                        text-2xl
                        font-black
                        tracking-tight
                        text-slate-950
                        dark:text-white
                        sm:text-3xl
                      "
                    >
                      {renderInlineText(
                        block.text,
                        `heading-${index}`
                      )}
                    </h2>

                    <div className="mt-3 h-1 w-14 rounded-full bg-indigo-500" />
                  </div>
                );
              }

              if (level === 2) {
                return (
                  <div
                    key={`heading-${index}`}
                    className="pt-3"
                  >
                    <h3
                      className="
                        text-xl
                        font-extrabold
                        tracking-tight
                        text-slate-900
                        dark:text-white
                        sm:text-2xl
                      "
                    >
                      {renderInlineText(
                        block.text,
                        `heading-${index}`
                      )}
                    </h3>

                    <div className="mt-3 h-px w-full bg-gradient-to-r from-indigo-200 via-slate-200 to-transparent dark:from-indigo-900/70 dark:via-slate-800 dark:to-transparent" />
                  </div>
                );
              }

              if (level === 3) {
                return (
                  <h4
                    key={`heading-${index}`}
                    className="
                      pt-2
                      text-lg
                      font-bold
                      text-indigo-700
                      dark:text-indigo-300
                      sm:text-xl
                    "
                  >
                    {renderInlineText(
                      block.text,
                      `heading-${index}`
                    )}
                  </h4>
                );
              }

              return (
                <h5
                  key={`heading-${index}`}
                  className="
                    pt-1
                    text-base
                    font-bold
                    text-slate-800
                    dark:text-slate-200
                  "
                >
                  {renderInlineText(
                    block.text,
                    `heading-${index}`
                  )}
                </h5>
              );
            }

            case "paragraph":
              return (
                <p
                  key={`paragraph-${index}`}
                  className="
                    whitespace-pre-line
                    text-[15px]
                    leading-8
                    text-slate-700
                    dark:text-slate-300
                    sm:text-[16px]
                    sm:leading-9
                  "
                >
                  {block.lines.map(
                    (
                      paragraphLine,
                      lineIndex
                    ) => (
                      <React.Fragment
                        key={`${index}-${lineIndex}`}
                      >
                        {renderInlineText(
                          paragraphLine,
                          `paragraph-${index}-${lineIndex}`
                        )}

                        {lineIndex <
                          block.lines
                            .length -
                            1 && (
                          <br />
                        )}
                      </React.Fragment>
                    )
                  )}
                </p>
              );

            case "quote":
              return (
                <blockquote
                  key={`quote-${index}`}
                  className="
                    relative
                    overflow-hidden
                    rounded-2xl
                    border
                    border-indigo-100
                    bg-indigo-50/70
                    px-5
                    py-5
                    dark:border-indigo-900/50
                    dark:bg-indigo-950/20
                    sm:px-6
                  "
                >
                  <div className="absolute left-0 top-0 h-full w-1 bg-indigo-500" />

                  <div className="flex gap-4">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300">
                      <Quote
                        className="h-4 w-4"
                        strokeWidth={2}
                      />
                    </div>

                    <p className="text-[15px] font-medium leading-8 text-indigo-950 dark:text-indigo-100">
                      {renderInlineText(
                        block.text,
                        `quote-${index}`
                      )}
                    </p>
                  </div>
                </blockquote>
              );

            case "unordered-list":
              return (
                <ul
                  key={`ul-${index}`}
                  className="
                    space-y-3
                    pl-1
                    text-[15px]
                    leading-8
                    text-slate-700
                    dark:text-slate-300
                    sm:text-[16px]
                  "
                >
                  {block.items.map(
                    (
                      item,
                      itemIndex
                    ) => (
                      <li
                        key={`${index}-${itemIndex}`}
                        className="flex items-start gap-3"
                      >
                        <span className="mt-[0.8rem] h-2 w-2 shrink-0 rounded-full bg-indigo-500" />

                        <span className="min-w-0 flex-1">
                          {renderInlineText(
                            item,
                            `ul-${index}-${itemIndex}`
                          )}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              );

            case "ordered-list":
              return (
                <ol
                  key={`ol-${index}`}
                  className="
                    space-y-3
                    pl-1
                    text-[15px]
                    leading-8
                    text-slate-700
                    dark:text-slate-300
                    sm:text-[16px]
                  "
                >
                  {block.items.map(
                    (
                      item,
                      itemIndex
                    ) => (
                      <li
                        key={`${index}-${itemIndex}`}
                        className="flex items-start gap-3"
                      >
                        <span
                          className="
                            flex
                            h-7
                            w-7
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            bg-indigo-50
                            text-xs
                            font-black
                            text-indigo-700
                            dark:bg-indigo-950/50
                            dark:text-indigo-300
                          "
                        >
                          {itemIndex + 1}
                        </span>

                        <span className="min-w-0 flex-1">
                          {renderInlineText(
                            item,
                            `ol-${index}-${itemIndex}`
                          )}
                        </span>
                      </li>
                    )
                  )}
                </ol>
              );

            case "divider":
              return (
                <div
                  key={`divider-${index}`}
                  className="py-1"
                >
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" />
                </div>
              );

            default:
              return null;
          }
        }
      )}
    </div>
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function StudyReader({
  materialId,
  userId = "guest",
  initialMaterial = null,
  onBack,
}) {
  const [
    material,
    setMaterial,
  ] = useState(
    initialMaterial || null
  );

  const [loading, setLoading] =
    useState(!initialMaterial);

  const [error, setError] =
    useState("");

  const [bookmarked, setBookmarked] =
    useState(false);

  const [
    bookmarking,
    setBookmarking,
  ] = useState(false);

  /* =======================================================
     DERIVED READING INFORMATION
  ======================================================= */

  const readingStats = useMemo(() => {
    const content =
      material?.content || "";

    return {
      words:
        getWordCount(content),
      minutes:
        getReadingTime(content),
    };
  }, [material?.content]);

  const materialIdString =
    resolveMaterialId(material);

  /* =======================================================
     LOAD MATERIAL
  ======================================================= */

  const loadMaterial =
    useCallback(async () => {
      if (!materialId) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API}/study/material/${encodeURIComponent(
              materialId
            )}`
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              `Failed to load material (${response.status})`
          );
        }

        if (!data?.material) {
          throw new Error(
            "Material was not returned by the server."
          );
        }

        setMaterial(
          data.material
        );
      } catch (err) {
        console.error(
          "Study Reader Error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load this study material."
        );
      } finally {
        setLoading(false);
      }
    }, [materialId]);

  /* =======================================================
     INITIAL MATERIAL / LOAD
  ======================================================= */

  useEffect(() => {
    if (
      initialMaterial &&
      resolveMaterialId(
        initialMaterial
      ) === String(materialId)
    ) {
      setMaterial(
        initialMaterial
      );

      setLoading(false);

      return;
    }

    loadMaterial();
  }, [
    initialMaterial,
    materialId,
    loadMaterial,
  ]);

  /* =======================================================
     CHECK BOOKMARK
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadBookmarkState =
      async () => {
        if (
          !userId ||
          !materialId
        ) {
          return;
        }

        try {
          const response =
            await fetch(
              `${API}/study/bookmarks/${encodeURIComponent(
                userId
              )}`
            );

          if (!response.ok) {
            return;
          }

          const data =
            await response.json();

          const materials =
            Array.isArray(
              data?.bookmarks
            )
              ? data.bookmarks
              : [];

          const exists =
            materials.some(
              (item) =>
                resolveMaterialId(
                  item
                ) ===
                String(materialId)
            );

          if (!cancelled) {
            setBookmarked(
              exists
            );
          }
        } catch (err) {
          console.error(
            "Bookmark state error:",
            err
          );
        }
      };

    loadBookmarkState();

    return () => {
      cancelled = true;
    };
  }, [
    userId,
    materialId,
  ]);

  /* =======================================================
     BOOKMARK
  ======================================================= */

  const handleBookmark =
    useCallback(async () => {
      if (
        bookmarking ||
        bookmarked ||
        !materialId ||
        !userId ||
        userId === "guest"
      ) {
        return;
      }

      try {
        setBookmarking(true);

        const response =
          await fetch(
            `${API}/study/bookmark`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                user_id:
                  userId,
                material_id:
                  String(
                    materialId
                  ),
              }),
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              "Bookmark request failed."
          );
        }

        setBookmarked(true);
      } catch (err) {
        console.error(
          "Bookmark Error:",
          err
        );
      } finally {
        setBookmarking(false);
      }
    }, [
      bookmarking,
      bookmarked,
      materialId,
      userId,
    ]);

  /* =======================================================
     DOWNLOAD
  ======================================================= */

  const handleDownload = () => {
    if (!material) {
      return;
    }

    const content = [
      material.title,
      material.category
        ? `Category: ${material.category}`
        : "",
      material.subcategory
        ? `Subcategory: ${material.subcategory}`
        : "",
      material.year
        ? `Year: ${material.year}`
        : "",
      "",
      normalizeContent(
        material.content
      ),
    ]
      .filter(Boolean)
      .join("\n");

    const blob =
      new Blob(
        [content],
        {
          type:
            "text/plain;charset=utf-8",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href = url;

    anchor.download =
      `${(
        material.title ||
        "study-material"
      )
        .replace(
          /[<>:"/\\|?*\x00-\x1F]/g,
          "-"
        )
        .trim()}.txt`;

    document.body.appendChild(
      anchor
    );

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(url);
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 dark:border-indigo-900/40 dark:bg-indigo-950/30">
            <RefreshCw
              className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-300"
            />
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Opening study material...
          </p>

          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Preparing your reading experience
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !material) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            px-3
            py-2
            text-sm
            font-semibold
            text-slate-600
            transition
            hover:bg-slate-100
            dark:text-slate-300
            dark:hover:bg-slate-800
          "
        >
          <ArrowLeft size={17} />
          Back to Library
        </button>

        <div className="mt-6 overflow-hidden rounded-3xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
          <div className="border-b border-red-200 px-6 py-5 dark:border-red-900/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/40">
                <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>

              <div>
                <h2 className="font-bold text-red-800 dark:text-red-300">
                  Unable to open material
                </h2>

                <p className="text-xs text-red-500/80 dark:text-red-400/70">
                  The study material could not be loaded.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <p className="text-sm leading-6 text-red-700 dark:text-red-300">
              {error ||
                "Material not found."}
            </p>

            <button
              type="button"
              onClick={
                loadMaterial
              }
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-indigo-600
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-indigo-700
                active:scale-[0.98]
              "
            >
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     READER
  ======================================================= */

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">

        {/* =================================================
            TOP NAVIGATION
        ================================================= */}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              px-3
              py-2
              text-sm
              font-semibold
              text-slate-600
              transition
              hover:bg-white
              hover:text-slate-950
              dark:text-slate-300
              dark:hover:bg-slate-900
              dark:hover:text-white
            "
          >
            <ArrowLeft size={17} />
            Back to Library
          </button>

          <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
            <BookOpenText className="h-4 w-4" />
            Study Reader
          </div>
        </div>

        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">

          {/* =================================================
              READER CARD
          ================================================= */}

          <Card
            className="
              overflow-hidden
              border-slate-200
              bg-white
              shadow-sm
              dark:border-slate-800
              dark:bg-slate-900
            "
          >
            <CardContent className="p-0">

              {/* =================================================
                  DOCUMENT HEADER
              ================================================= */}

              <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-slate-50 to-indigo-50/60 px-5 py-6 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 sm:px-8 sm:py-8 lg:px-10">

                <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-indigo-200/20 blur-3xl dark:bg-indigo-500/10" />

                <div className="relative">

                  {/* Material identity */}

                  <div className="flex items-start justify-between gap-5">
                    <div className="min-w-0 flex-1">

                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300">
                          <BookOpenText className="h-3.5 w-3.5" />
                          Study Material
                        </span>

                        {material.category && (
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {material.category}
                          </span>
                        )}
                      </div>

                      <h1 className="
                        max-w-4xl
                        text-3xl
                        font-black
                        leading-tight
                        tracking-tight
                        text-slate-950
                        dark:text-white
                        sm:text-4xl
                        lg:text-[2.7rem]
                      ">
                        {material.title ||
                          "Study Material"}
                      </h1>

                      {(material.subcategory ||
                        material.year) && (
                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                          {material.subcategory && (
                            <span>
                              {material.subcategory}
                            </span>
                          )}

                          {material.year && (
                            <>
                              {material.subcategory && (
                                <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                              )}

                              <span>
                                {material.year}
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Metadata */}

                      <div className="mt-6 flex flex-wrap gap-2">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                          <Clock3 className="h-3.5 w-3.5 text-indigo-500" />
                          {readingStats.minutes} min read
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                          <Hash className="h-3.5 w-3.5 text-indigo-500" />
                          {readingStats.words.toLocaleString()} words
                        </div>
                      </div>
                    </div>

                    {/* Actions */}

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={
                          handleBookmark
                        }
                        disabled={
                          bookmarking ||
                          bookmarked ||
                          userId ===
                            "guest"
                        }
                        className={`
                          inline-flex
                          h-10
                          items-center
                          gap-2
                          rounded-xl
                          border
                          px-3
                          text-sm
                          font-semibold
                          transition
                          ${
                            bookmarked
                              ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                          }
                          disabled:cursor-not-allowed
                          disabled:opacity-60
                        `}
                        title={
                          userId ===
                          "guest"
                            ? "Sign in to bookmark"
                            : bookmarked
                            ? "Bookmarked"
                            : "Bookmark"
                        }
                      >
                        {bookmarked ? (
                          <BookmarkCheck
                            size={17}
                          />
                        ) : (
                          <Bookmark
                            size={17}
                          />
                        )}

                        <span className="hidden sm:inline">
                          {bookmarked
                            ? "Bookmarked"
                            : bookmarking
                            ? "Saving..."
                            : "Bookmark"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={
                          handleDownload
                        }
                        className="
                          flex
                          h-10
                          w-10
                          items-center
                          justify-center
                          rounded-xl
                          border
                          border-slate-200
                          bg-white
                          text-slate-600
                          transition
                          hover:bg-slate-50
                          hover:text-slate-950
                          dark:border-slate-700
                          dark:bg-slate-900
                          dark:text-slate-300
                          dark:hover:bg-slate-800
                          dark:hover:text-white
                        "
                        title="Download study material"
                      >
                        <Download size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* =================================================
                  DOCUMENT BODY
              ================================================= */}

              <div className="px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10">

                {/* Reading surface */}

                <div className="
                  mx-auto
                  w-full
                  max-w-4xl
                ">
                  <div className="mb-8 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-900">
                      <Sparkles className="h-4 w-4 text-indigo-500" />
                    </div>

                    <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                      Use the highlighted passages,
                      headings, and quotations to
                      scan the material quickly,
                      then dive deeper into the
                      full reading.
                    </p>
                  </div>

                  {renderStudyContent(
                    material.content
                  )}

                  {/* End marker */}

                  <div className="mt-12 border-t border-slate-200 pt-8 dark:border-slate-800">
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          End of material
                        </p>

                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                          You have reached the end of
                          this study.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* =================================================
              AI PANEL
          ================================================= */}

          <div className="lg:sticky lg:top-6 lg:self-start">
            <AIStudyPanel
              material={{
                ...material,
                id:
                  materialIdString,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}