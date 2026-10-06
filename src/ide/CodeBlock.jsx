import React, { useState } from "react";
import { Play, Copy, Check } from "lucide-react";

import CodeRunner from "./CodeRunner";
import { normalizeLanguage } from "./runners";

export default function CodeBlock({ className, children, ...props }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const code = String(children ?? "").replace(/\n$/, "");
  const match = /language-([\w+-]+)/.exec(className || "");
  const isBlock = Boolean(match) || code.includes("\n");

  // Inline `code` stays as it is
  if (!isBlock) {
    return <code className={className} {...props}>{children}</code>;
  }

  const rawLanguage = match?.[1] || "text";
  const runnable = normalizeLanguage(rawLanguage);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="my-3">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1117]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {rawLanguage}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={copy}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 hover:bg-white/10 hover:text-white"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>

            {runnable && !open && (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex items-center gap-1 rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25"
              >
                <Play size={12} /> Run
              </button>
            )}
          </div>
        </div>

        <pre className="overflow-x-auto p-3 text-xs leading-5 text-gray-200">
          <code>{code}</code>
        </pre>
      </div>

      {open && runnable && (
        <CodeRunner
          initialCode={code}
          language={runnable}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}