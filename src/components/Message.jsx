// src/components/Message.jsx

import { memo, useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertTriangle,
  Check,
  Copy,
  Edit2,
  ExternalLink,
  FileText,
  Mic,
  Volume2,
  X,
} from "lucide-react";

import ThinkingStages from "./ThinkingStages.jsx";
import CodeBlock from "@/ide/CodeBlock";
import { getMessageEmotion } from "./utils/messageEmotion.js";

/* =========================================================
   CONSTANTS
========================================================= */

const FRESH_MS = 4000; // answers newer than this animate in
const LONG_USER_TEXT = 600; // user messages longer than this collapse
const COLLAPSED_CHARS = 420;

/* =========================================================
   HELPERS
========================================================= */

const isSafeHttpUrl = (value) =>
  /^https?:\/\//i.test(String(value || "").trim());

const hostnameOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

const normalizeSources = (sources) => {
  const seen = new Set();

  return (Array.isArray(sources) ? sources : [])
    .map((source) => {
      const url =
        typeof source === "string" ? source : source?.url || source?.link || "";
      const title =
        typeof source === "string" ? source : source?.title || source?.name || url;
      return { url, title, host: hostnameOf(url) };
    })
    .filter(({ url }) => isSafeHttpUrl(url) && !seen.has(url) && seen.add(url))
    .slice(0, 8);
};

const EMOTION_STYLES = {
  spiritual: "bg-gradient-to-r from-green-900/40 to-emerald-800/30 border-green-500/30",
  prophetic: "bg-gradient-to-r from-purple-900/40 to-indigo-800/30 border-purple-500/30",
  technical: "bg-gradient-to-r from-blue-900/40 to-slate-800/30 border-blue-500/30",
  user: "bg-revela-secondary text-white border-white/10",
  neutral: "bg-revela-card text-white border-white/10",
};

const ERROR_STYLE = "bg-red-950/30 border-red-500/30 text-white";

/* =========================================================
   SPECIAL OUTPUT DETECTION
   ---------------------------------------------------------
   Treat clearly structured deliverables as copy-ready cards.
   The content remains Markdown so links, tables and code render
   normally; the card only adds a labelled copy surface.
========================================================= */
function detectSpecialOutput(text) {
  const value = String(text || "").trim();
  if (!value) return null;

  if (/^\s*```/m.test(value) || /\n```/.test(value)) {
    const match = value.match(/^```\s*([\w+#.-]*)/);
    const language = match?.[1]?.toLowerCase();
    const label = language
      ? ({ js: "Code", jsx: "Code", ts: "Code", tsx: "Code", py: "Code", python: "Code", html: "Code", css: "Code", json: "Code", bash: "Code", sh: "Code", sql: "Code" }[language] || "Code")
      : "Code";
    return { label, content: value };
  }

  if (/^\s*\|.+\|\s*$/m.test(value) || /\n\s*\|?\s*:?-{3,}/.test(value)) {
    return { label: "Table", content: value };
  }

  const headings = [
    [/\b(sermon|homily|preaching outline|sermon outline)\b/i, "Sermon"],
    [/\b(prayer|closing prayer|opening prayer)\b/i, "Prayer"],
    [/\b(scripture list|bible verses|key verses|scripture references|bible study)\b/i, "Scripture"],
    [/\b(business plan|business strategy|marketing plan|market strategy)\b/i, "Business Plan"],
    [/\b(prophecy explanation|prophetic meaning|prophecy analysis)\b/i, "Prophecy"],
    [/\b(step-by-step plan|implementation plan|project plan|action plan)\b/i, "Plan"],
  ];
  for (const [pattern, label] of headings) {
    if (pattern.test(value)) return { label, content: value };
  }

  const lines = value.split("\n").filter((line) => line.trim());
  const listLines = lines.filter((line) => /^\s*(?:[-*•]|\d+[.)])\s+/.test(line));
  if (listLines.length >= 3 && listLines.length / Math.max(lines.length, 1) >= 0.45) {
    return { label: "List", content: value };
  }

  return null;
}

async function copyTextToClipboard(value) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the compatibility path.
  }

  try {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    return copied;
  } catch {
    return false;
  }
}

/* =========================================================
   ANSWER REVEAL
   -------------------------------------------------------
   Reveals a fresh answer progressively. Old messages and
   reduced-motion users get the full text immediately.
========================================================= */

function useReveal(text, fresh) {
  const [skipped, setSkipped] = useState(false);
  const [count, setCount] = useState(fresh ? 0 : text.length);
  const active = fresh && !skipped;

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (!active || reduceMotion) {
      setCount(text.length);
      return undefined;
    }

    let frame;
    const start = performance.now();
    const duration = Math.min(2600, Math.max(600, text.length * 5));

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setCount(Math.round(text.length * (1 - (1 - t) ** 2)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, text]);

  const revealing = active && count < text.length;

  return {
    visible: revealing ? text.slice(0, count) : text,
    revealing,
    skip: () => setSkipped(true),
  };
}

/* =========================================================
   MARKDOWN
========================================================= */

const mdComponents = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,

  h1: ({ children }) => <h1 className="mb-2 mt-4 text-lg font-bold first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-4 text-base font-bold first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-3 text-sm font-bold first:mt-0">{children}</h3>,

  ul: ({ children, className }) => (
    <ul
      className={`mb-3 space-y-1 last:mb-0 ${
        /contains-task-list/.test(className || "") ? "list-none pl-1" : "list-disc pl-5"
      }`}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  // Task lists: - [x] done
  input: ({ type, checked }) =>
    type === "checkbox" ? (
      <input
        type="checkbox"
        checked={Boolean(checked)}
        readOnly
        disabled
        className="mr-2 align-middle accent-emerald-500"
      />
    ) : null,

  a: ({ href, children }) =>
    isSafeHttpUrl(href) ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-emerald-400 underline decoration-emerald-400/30 underline-offset-2 hover:text-emerald-300"
      >
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),

  // Only load images over http(s), and don't leak the page URL
  img: ({ src, alt }) =>
    isSafeHttpUrl(src) ? (
      <img
        src={src}
        alt={alt || ""}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="my-2 h-auto max-w-full rounded-xl border border-white/10"
      />
    ) : null,

  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-emerald-500/50 pl-3 italic text-gray-300">
      {children}
    </blockquote>
  ),

  hr: () => <hr className="my-4 border-white/10" />,

  /*
   * react-markdown v9 no longer passes `inline`.
   * A block is a fenced code with a language, or any code
   * that spans multiple lines.
   */
  code: ({ className, children }) => {
    const text = String(children ?? "");
    const isBlock = /language-/.test(className || "") || text.includes("\n");

    if (!isBlock) {
      return (
        <code className="rounded bg-black/40 px-1.5 py-0.5 text-[0.85em] text-emerald-300">
          {children}
        </code>
      );
    }

    return <CodeBlock className={className}>{children}</CodeBlock>;
  },

  // CodeBlock draws its own container
  pre: ({ children }) => <>{children}</>,

  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto rounded-xl border border-white/10 last:mb-0">
      <table className="w-full border-collapse text-left text-xs sm:text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-white/10">{children}</thead>,
  th: ({ children }) => <th className="border-b border-white/10 px-3 py-2 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-white/5 px-3 py-2 align-top">{children}</td>,
};

// Memoized so copy/edit state changes don't re-parse the markdown
const MarkdownBody = memo(function MarkdownBody({ text }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
      {text}
    </ReactMarkdown>
  );
});

/* =========================================================
   IMAGE VIEWER
========================================================= */

function ImageViewer({ url, onClose }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={onClose}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <X size={20} />
      </button>

      <img
        src={url}
        alt="Generated"
        referrerPolicy="no-referrer"
        onClick={(event) => event.stopPropagation()}
        className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
      />

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => event.stopPropagation()}
        className="absolute bottom-5 flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20"
      >
        <ExternalLink size={13} /> Open original
      </a>
    </div>
  );
}

/* =========================================================
   INLINE EDITOR (user messages)
========================================================= */

function EditBox({ initial, onSave, onCancel }) {
  const [value, setValue] = useState(initial);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [value]);

  const submit = () => {
    const next = value.trim();
    if (next && next !== initial.trim()) onSave(next);
    else onCancel();
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="w-full min-w-[min(80vw,22rem)]">
      <textarea
        ref={ref}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={onKeyDown}
        rows={2}
        aria-label="Edit your message"
        className="w-full resize-none rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/60"
      />

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="hidden text-[10px] text-gray-400 sm:block">
          Ctrl + Enter to send · Esc to cancel
        </span>

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-emerald-400"
          >
            Save &amp; send
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MESSAGE
========================================================= */

function Message({ message, onEdit, onReveal }) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);

  const emotion = getMessageEmotion(message);
  const isUser = message.role === "user";
  const isError = message.status === "error";
  const isThinking = emotion === "thinking" || message.status === "loading";
  const isVoice = message.inputType === "voice";

  const fullText = message.text || "";

  // Decided once, when the message first appears
  const [fresh] = useState(
    () =>
      !isUser &&
      !isError &&
      !isThinking &&
      Date.now() - Number(message.createdAt || 0) < FRESH_MS
  );

  const { visible, revealing, skip } = useReveal(fullText, fresh);

  // Keep the chat scrolled while the answer grows
  const bucket = Math.floor(visible.length / 60);
  useEffect(() => {
    if (revealing) onReveal?.();
  }, [revealing, bucket, onReveal]);

  const canEdit =
    isUser && typeof onEdit === "function" && !message.attachmentName && !isVoice;

  const imageUrls = Array.isArray(message.imageUrls)
    ? message.imageUrls.filter(isSafeHttpUrl)
    : [];

  const audioUrl = isSafeHttpUrl(message.audioUrl) ? message.audioUrl : null;
  const sources = normalizeSources(message.sources);
  const documentMeta = message.metadata?.multimodal || null;

  const isLongUser = isUser && fullText.length > LONG_USER_TEXT;
  const userText =
    isLongUser && !expanded ? `${fullText.slice(0, COLLAPSED_CHARS).trimEnd()}…` : fullText;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* Ignore clipboard failure. */
    }
  }, [fullText]);

  const handleSaveEdit = useCallback(
    (nextText) => {
      setEditing(false);
      onEdit?.(message.id, nextText);
    },
    [onEdit, message.id]
  );

  const bubbleStyle = isError
    ? ERROR_STYLE
    : EMOTION_STYLES[emotion] || EMOTION_STYLES.neutral;

  const widthClass = isUser
    ? (editing ? "w-full max-w-[95%] sm:max-w-[80%]" : "max-w-[85%] sm:max-w-[75%]")
    : "w-full max-w-full";

  const specialOutput = !isUser && !isError && !isThinking
    ? detectSpecialOutput(fullText)
    : null;

  const handleSpecialCopy = useCallback(async () => {
    const success = await copyTextToClipboard(fullText);
    if (!success) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [fullText]);

  return (
    <div
      className={`flex w-full min-w-0 animate-fade-in ${
        isUser ? "justify-end pb-7 pt-3" : "justify-start px-3 pt-3 sm:px-4"
      }`}
    >
      <div
        className={`group relative min-w-0 text-base leading-[1.7] transition-all duration-300 ${widthClass} ${
          isUser
            ? `rounded-2xl border px-4 py-3 ${bubbleStyle}`
            : isError
              ? "rounded-xl border px-3 py-3 " + ERROR_STYLE
              : "border-0 bg-transparent px-0 py-2 text-gray-200 shadow-none"
        }`}
      >
        {/* ---------------- THINKING (fallback) ---------------- */}
        {isThinking && <ThinkingStages />}

        {/* ---------------- USER ---------------- */}
        {!isThinking && isUser && (
          <div>
            {isVoice && (
              <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300/80">
                <Mic size={11} /> Voice
              </div>
            )}

            {editing ? (
              <EditBox
                initial={fullText}
                onSave={handleSaveEdit}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <>
                <p className="whitespace-pre-wrap break-words">{userText}</p>

                {isLongUser && (
                  <button
                    type="button"
                    onClick={() => setExpanded((open) => !open)}
                    className="mt-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
                  >
                    {expanded ? "Show less" : "Show more"}
                  </button>
                )}
              </>
            )}

            {message.attachmentName && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-xs">
                <FileText size={14} className="shrink-0 text-emerald-300" />
                <span className="min-w-0 truncate text-gray-300">
                  {message.attachmentName}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ---------------- ASSISTANT: ERROR ---------------- */}
        {!isThinking && !isUser && isError && (
          <div role="alert" className="flex items-start gap-2 text-red-100">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
            <p className="break-words">{fullText}</p>
          </div>
        )}

        {/* ---------------- ASSISTANT: ANSWER ---------------- */}
        {!isThinking && !isUser && !isError && (
          <div className="w-full min-w-0 break-words text-[16px] leading-[1.7] text-gray-200">
            {visible && specialOutput && !revealing ? (
              <section className="my-3 w-full min-w-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-900/90">
                <header className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-700 bg-slate-800/90 px-3 py-2 sm:px-4">
                  <span className="min-w-0 truncate text-xs font-semibold tracking-wide text-slate-300">
                    {specialOutput.label}
                  </span>
                  <button
                    type="button"
                    onClick={handleSpecialCopy}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-600 bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                    aria-label={copied ? "Copied special output" : `Copy ${specialOutput.label}`}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </header>
                <div className="w-full min-w-0 overflow-x-auto px-3 py-4 text-sm leading-relaxed text-slate-100 sm:px-4">
                  <MarkdownBody text={visible} />
                </div>
              </section>
            ) : visible ? (
              <MarkdownBody text={visible} />
            ) : null}

            {revealing && (
              <button
                type="button"
                onClick={skip}
                className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-300"
              >
                Skip
              </button>
            )}

            {!revealing && imageUrls.length > 0 && (
              <div className="mt-4 grid gap-3">
                {imageUrls.map((url, index) => (
                  <button
                    key={`${url}-${index}`}
                    type="button"
                    onClick={() => setViewerUrl(url)}
                    aria-label={`View generated image ${index + 1}`}
                    className="block cursor-zoom-in overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                  >
                    <img
                      src={url}
                      alt={`Generated image ${index + 1}`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="block h-auto w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {!revealing && audioUrl && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <Volume2 size={14} />
                  RevelaAI voice response
                </div>
                <audio controls preload="metadata" src={audioUrl} className="w-full" />
              </div>
            )}

            {!revealing && documentMeta?.type === "pdf" && (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] text-gray-400">
                <FileText size={13} className="text-emerald-400" />
                <span>{documentMeta.filename || "PDF document"}</span>

                {documentMeta.pages != null && (
                  <span>
                    • {documentMeta.pages} page{documentMeta.pages === 1 ? "" : "s"}
                  </span>
                )}

                {documentMeta.chunks != null && (
                  <span>
                    • {documentMeta.chunks} chunk{documentMeta.chunks === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            )}

            {!revealing && sources.length > 0 && (
              <div className="mt-4 border-t border-white/10 pt-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Sources
                </p>

                <div className="space-y-2">
                  {sources.map(({ url, title, host }, index) => (
                    <a
                      key={`${url}-${index}`}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-gray-400 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
                    >
                      <ExternalLink size={12} className="shrink-0 text-emerald-400" />

                      <span className="min-w-0 flex-1 truncate">{title}</span>

                      {host && host !== title && (
                        <span className="hidden shrink-0 text-[10px] text-gray-600 sm:block">
                          {host}
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- USER ACTIONS ----------------
            Assistant actions live in MessageActions.
            Always visible on touch screens, hover on desktop. */}
        {isUser && !isThinking && !editing && (
          <div className="absolute -bottom-6 right-2 flex gap-2 opacity-100 transition sm:opacity-0 sm:focus-within:opacity-100 sm:group-hover:opacity-100">
            <button
              type="button"
              onClick={handleCopy}
              className="text-gray-400 hover:text-white"
              aria-label={copied ? "Copied" : "Copy message"}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-gray-400 hover:text-white"
                aria-label="Edit message"
              >
                <Edit2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {viewerUrl && <ImageViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />}
    </div>
  );
}

export default memo(Message);