import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, Edit2 } from "lucide-react";
import ThinkingStages from "./ThinkingStages.jsx";
import { getMessageEmotion } from "./utils/messageEmotion.js";

/* Styling for each Markdown element (no typography plugin needed) */
const mdComponents = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => (
    <h1 className="mb-2 mt-4 text-lg font-bold first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-base font-bold first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-3 text-sm font-bold first:mt-0">{children}</h3>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-emerald-400 underline hover:text-emerald-300"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-emerald-500/50 pl-3 italic text-gray-300">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-white/10" />,
  code: ({ inline, className, children }) =>
    inline ? (
      <code className="rounded bg-black/40 px-1.5 py-0.5 text-[0.85em] text-emerald-300">
        {children}
      </code>
    ) : (
      <code className={`${className || ""} text-xs`}>{children}</code>
    ),
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-3 last:mb-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto rounded-xl border border-white/10 last:mb-0">
      <table className="w-full border-collapse text-left text-xs sm:text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-white/10">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-white/10 px-3 py-2 font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-white/5 px-3 py-2 align-top">{children}</td>
  ),
};

export default function Message({ message }) {
  const [copied, setCopied] = useState(false);

  const emotion = getMessageEmotion(message);
  const isUser = message.role === "user";
  const isThinking = emotion === "thinking";

  const emotionStyles = {
    spiritual:
      "bg-gradient-to-r from-green-900/40 to-emerald-800/30 border-green-500/30",
    prophetic:
      "bg-gradient-to-r from-purple-900/40 to-indigo-800/30 border-purple-500/30",
    technical:
      "bg-gradient-to-r from-blue-900/40 to-slate-800/30 border-blue-500/30",
    user: "bg-revela-secondary text-white border-white/10",
    neutral: "bg-revela-card text-white border-white/10",
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className={`w-full py-5 flex ${
        isUser ? "justify-end" : "justify-start"
      } animate-fade-in`}
    >
      <div
        className={`
          ${isUser ? "max-w-[75%]" : "max-w-[92%] sm:max-w-[85%]"}
          min-w-0 px-4 py-3 rounded-2xl relative border text-sm
          leading-relaxed transition-all duration-300 group
          ${emotionStyles[emotion] || emotionStyles.neutral}
        `}
      >
        {isThinking && <ThinkingStages />}

        {!isThinking &&
          (isUser ? (
            // User text stays plain so what they type is shown exactly
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
          ) : (
            <div className="break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={mdComponents}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          ))}

        {!isThinking && (
          <div className="absolute -bottom-6 right-2 flex gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleCopy}
              className="text-gray-300 hover:text-white"
              aria-label="Copy message"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>

            {isUser && (
              <button
                type="button"
                className="text-gray-300 hover:text-white"
                aria-label="Edit message"
              >
                <Edit2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
