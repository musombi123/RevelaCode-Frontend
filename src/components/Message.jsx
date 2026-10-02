import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Copy,
  Check,
  Edit2,
  FileText,
  Volume2,
  ExternalLink,
} from "lucide-react";

import ThinkingStages from "./ThinkingStages.jsx";
import { getMessageEmotion } from "./utils/messageEmotion.js";

/* =========================================================
   SAFE URL
========================================================= */

const isSafeHttpUrl = (
  value
) =>
  /^https?:\/\//i.test(
    String(value || "").trim()
  );

/* =========================================================
   MARKDOWN
========================================================= */

const mdComponents = {
  p: ({
    children,
  }) => (
    <p className="mb-3 last:mb-0">
      {children}
    </p>
  ),

  strong: ({
    children,
  }) => (
    <strong className="font-semibold text-white">
      {children}
    </strong>
  ),

  em: ({
    children,
  }) => (
    <em className="italic">
      {children}
    </em>
  ),

  h1: ({
    children,
  }) => (
    <h1 className="mb-2 mt-4 text-lg font-bold first:mt-0">
      {children}
    </h1>
  ),

  h2: ({
    children,
  }) => (
    <h2 className="mb-2 mt-4 text-base font-bold first:mt-0">
      {children}
    </h2>
  ),

  h3: ({
    children,
  }) => (
    <h3 className="mb-2 mt-3 text-sm font-bold first:mt-0">
      {children}
    </h3>
  ),

  ul: ({
    children,
  }) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">
      {children}
    </ul>
  ),

  ol: ({
    children,
  }) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">
      {children}
    </ol>
  ),

  li: ({
    children,
  }) => (
    <li className="leading-relaxed">
      {children}
    </li>
  ),

  a: ({
    href,
    children,
  }) =>
    isSafeHttpUrl(
      href
    ) ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="
          text-emerald-400
          underline
          decoration-emerald-400/30
          underline-offset-2
          hover:text-emerald-300
        "
      >
        {children}
      </a>
    ) : (
      <span>
        {children}
      </span>
    ),

  blockquote: ({
    children,
  }) => (
    <blockquote className="mb-3 border-l-2 border-emerald-500/50 pl-3 italic text-gray-300">
      {children}
    </blockquote>
  ),

  hr: () => (
    <hr className="my-4 border-white/10" />
  ),

  code: ({
    inline,
    className,
    children,
  }) =>
    inline ? (
      <code className="rounded bg-black/40 px-1.5 py-0.5 text-[0.85em] text-emerald-300">
        {children}
      </code>
    ) : (
      <code
        className={`${className || ""} text-xs`}
      >
        {children}
      </code>
    ),

  pre: ({
    children,
  }) => (
    <pre className="mb-3 overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-3 last:mb-0">
      {children}
    </pre>
  ),

  table: ({
    children,
  }) => (
    <div className="mb-3 overflow-x-auto rounded-xl border border-white/10 last:mb-0">
      <table className="w-full border-collapse text-left text-xs sm:text-sm">
        {children}
      </table>
    </div>
  ),

  thead: ({
    children,
  }) => (
    <thead className="bg-white/10">
      {children}
    </thead>
  ),

  th: ({
    children,
  }) => (
    <th className="border-b border-white/10 px-3 py-2 font-semibold">
      {children}
    </th>
  ),

  td: ({
    children,
  }) => (
    <td className="border-b border-white/5 px-3 py-2 align-top">
      {children}
    </td>
  ),
};

/* =========================================================
   COMPONENT
========================================================= */

export default function Message({
  message,
}) {
  const [copied, setCopied] =
    useState(false);

  const emotion =
    getMessageEmotion(
      message
    );

  const isUser =
    message.role ===
    "user";

  const isThinking =
    emotion ===
    "thinking";

  const emotionStyles = {
    spiritual:
      "bg-gradient-to-r from-green-900/40 to-emerald-800/30 border-green-500/30",

    prophetic:
      "bg-gradient-to-r from-purple-900/40 to-indigo-800/30 border-purple-500/30",

    technical:
      "bg-gradient-to-r from-blue-900/40 to-slate-800/30 border-blue-500/30",

    user:
      "bg-revela-secondary text-white border-white/10",

    neutral:
      "bg-revela-card text-white border-white/10",
  };

  const imageUrls =
    Array.isArray(
      message.imageUrls
    )
      ? message.imageUrls.filter(
          isSafeHttpUrl
        )
      : [];

  const audioUrl =
    isSafeHttpUrl(
      message.audioUrl
    )
      ? message.audioUrl
      : null;

  const sources =
    Array.isArray(
      message.sources
    )
      ? message.sources
      : [];

  const documentMeta =
    message.metadata
      ?.multimodal ||
    null;

  const handleCopy =
    async () => {
      try {
        await navigator.clipboard.writeText(
          message.text ||
            ""
        );

        setCopied(
          true
        );

        window.setTimeout(
          () =>
            setCopied(
              false
            ),
          1500
        );
      } catch {
        /* Ignore clipboard failure. */
      }
    };

  return (
    <div
      className={`w-full py-5 flex ${
        isUser
          ? "justify-end"
          : "justify-start"
      } animate-fade-in`}
    >
      <div
        className={`
          ${
            isUser
              ? "max-w-[85%] sm:max-w-[75%]"
              : "max-w-[95%] sm:max-w-[90%]"
          }
          min-w-0
          rounded-2xl
          relative
          border
          px-4
          py-3
          text-sm
          leading-relaxed
          transition-all
          duration-300
          group
          ${
            emotionStyles[
              emotion
            ] ||
            emotionStyles.neutral
          }
        `}
      >
        {isThinking && (
          <ThinkingStages />
        )}

        {!isThinking &&
          isUser && (
            <div>
              <p className="whitespace-pre-wrap break-words">
                {message.text}
              </p>

              {message.attachmentName && (
                <div
                  className="
                    mt-3
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-white/10
                    bg-black/10
                    px-3
                    py-2
                    text-xs
                  "
                >
                  <FileText
                    size={14}
                    className="shrink-0 text-emerald-300"
                  />

                  <span className="min-w-0 truncate text-gray-300">
                    {message.attachmentName}
                  </span>
                </div>
              )}
            </div>
          )}

        {!isThinking &&
          !isUser && (
            <div className="break-words">
              {message.text && (
                <ReactMarkdown
                  remarkPlugins={[
                    remarkGfm,
                  ]}
                  components={
                    mdComponents
                  }
                >
                  {message.text}
                </ReactMarkdown>
              )}

              {/* =================================================
                  GENERATED IMAGE
              ================================================= */}

              {imageUrls.length >
                0 && (
                <div
                  className="
                    mt-4
                    grid
                    gap-3
                  "
                >
                  {imageUrls.map(
                    (
                      url,
                      index
                    ) => (
                      <a
                        key={`${url}-${index}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          block
                          overflow-hidden
                          rounded-2xl
                          border
                          border-white/10
                          bg-black/20
                        "
                      >
                        <img
                          src={url}
                          alt={`Generated image ${
                            index +
                            1
                          }`}
                          loading="lazy"
                          className="
                            block
                            h-auto
                            w-full
                            object-cover
                          "
                        />
                      </a>
                    )
                  )}
                </div>
              )}

              {/* =================================================
                  VOICE AUDIO
              ================================================= */}

              {audioUrl && (
                <div
                  className="
                    mt-4
                    rounded-2xl
                    border
                    border-white/10
                    bg-black/20
                    p-3
                  "
                >
                  <div
                    className="
                      mb-2
                      flex
                      items-center
                      gap-2
                      text-xs
                      font-semibold
                      text-emerald-300
                    "
                  >
                    <Volume2
                      size={14}
                    />

                    RevelaAI voice response
                  </div>

                  <audio
                    controls
                    preload="metadata"
                    src={
                      audioUrl
                    }
                    className="w-full"
                  />
                </div>
              )}

              {/* =================================================
                  DOCUMENT METADATA
              ================================================= */}

              {documentMeta?.type ===
                "pdf" && (
                <div
                  className="
                    mt-4
                    flex
                    flex-wrap
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-white/10
                    bg-white/[0.03]
                    px-3
                    py-2
                    text-[10px]
                    text-gray-400
                  "
                >
                  <FileText
                    size={13}
                    className="text-emerald-400"
                  />

                  <span>
                    {documentMeta.filename ||
                      "PDF document"}
                  </span>

                  {documentMeta.pages !=
                    null && (
                    <span>
                      •{" "}
                      {documentMeta.pages}{" "}
                      page
                      {documentMeta.pages ===
                      1
                        ? ""
                        : "s"}
                    </span>
                  )}

                  {documentMeta.chunks !=
                    null && (
                    <span>
                      •{" "}
                      {documentMeta.chunks}{" "}
                      chunk
                      {documentMeta.chunks ===
                      1
                        ? ""
                        : "s"}
                    </span>
                  )}
                </div>
              )}

              {/* =================================================
                  SOURCES
              ================================================= */}

              {sources.length >
                0 && (
                <div
                  className="
                    mt-4
                    border-t
                    border-white/10
                    pt-3
                  "
                >
                  <p
                    className="
                      mb-2
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-wider
                      text-gray-500
                    "
                  >
                    Sources
                  </p>

                  <div className="space-y-2">
                    {sources
                      .slice(
                        0,
                        8
                      )
                      .map(
                        (
                          source,
                          index
                        ) => {
                          const url =
                            typeof source ===
                            "string"
                              ? source
                              : source?.url ||
                                source?.link ||
                                "";

                          const title =
                            typeof source ===
                            "string"
                              ? source
                              : source?.title ||
                                source?.name ||
                                url;

                          if (
                            !isSafeHttpUrl(
                              url
                            )
                          ) {
                            return null;
                          }

                          return (
                            <a
                              key={`${url}-${index}`}
                              href={
                                url
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="
                                flex
                                items-center
                                gap-2
                                rounded-xl
                                border
                                border-white/10
                                bg-white/[0.02]
                                px-3
                                py-2
                                text-xs
                                text-gray-400
                                transition
                                hover:border-white/20
                                hover:bg-white/[0.05]
                                hover:text-white
                              "
                            >
                              <ExternalLink
                                size={12}
                                className="shrink-0 text-emerald-400"
                              />

                              <span className="min-w-0 flex-1 truncate">
                                {title}
                              </span>
                            </a>
                          );
                        }
                      )}
                  </div>
                </div>
              )}
            </div>
          )}

        {!isThinking && (
          <div
            className="
              absolute
              -bottom-6
              right-2
              flex
              gap-2
              opacity-0
              transition
              group-hover:opacity-100
            "
          >
            <button
              type="button"
              onClick={
                handleCopy
              }
              className="text-gray-300 hover:text-white"
              aria-label="Copy message"
            >
              {copied ? (
                <Check
                  size={14}
                />
              ) : (
                <Copy
                  size={14}
                />
              )}
            </button>

            {isUser && (
              <button
                type="button"
                className="text-gray-300 hover:text-white"
                aria-label="Edit message"
              >
                <Edit2
                  size={14}
                />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}