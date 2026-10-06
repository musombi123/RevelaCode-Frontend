import React, { useCallback, useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import { Play, Square, X, Loader2 } from "lucide-react";

import { runCode, stopCode } from "./runners";

const EXTENSIONS = {
  javascript: [javascript()],
  python: [python()],
  html: [html()],
};

const LABELS = { javascript: "JavaScript", python: "Python", html: "HTML" };

export default function CodeRunner({ initialCode, language, onClose }) {
  const [code, setCode] = useState(initialCode);
  const [lines, setLines] = useState([]);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);

  // Stop any running code when the panel closes
  useEffect(() => () => stopCode(language), [language]);

  const run = useCallback(async () => {
    setLines([]);

    if (language === "html") {
      setPreviewDoc(code);
      return;
    }

    setRunning(true);

    const result = await runCode(language, code, {
      onLine: (type, text) => setLines((current) => [...current, { type, text }]),
      onStatus: setStatus,
    });

    if (!result.ok) {
      setLines((current) => [...current, { type: "err", text: result.error }]);
    } else {
      setLines((current) => (current.length ? current : [{ type: "dim", text: "(finished with no output)" }]));
    }

    setStatus("");
    setRunning(false);
  }, [code, language]);

  const stop = useCallback(() => {
    stopCode(language);
    setRunning(false);
    setStatus("");
    setLines((current) => [...current, { type: "err", text: "Stopped." }]);
  }, [language]);

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-white/10 bg-[#0d1117]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-xs font-semibold text-gray-300">
          {LABELS[language]} · editable
        </span>

        <div className="flex items-center gap-1.5">
          {running ? (
            <button
              type="button"
              onClick={stop}
              className="flex items-center gap-1.5 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/25"
            >
              <Square size={12} /> Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={run}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25"
            >
              <Play size={12} /> Run
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close editor"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Editor */}
      <CodeMirror
        value={code}
        onChange={setCode}
        extensions={EXTENSIONS[language]}
        theme={oneDark}
        minHeight="120px"
        maxHeight="320px"
        basicSetup={{ lineNumbers: true, foldGutter: false }}
      />

      {/* Output */}
      <div className="border-t border-white/10">
        {language === "html" ? (
          previewDoc !== null && (
            <iframe
              title="Preview"
              srcDoc={previewDoc}
              sandbox="allow-scripts"
              className="h-72 w-full bg-white"
            />
          )
        ) : (
          <div className="max-h-56 overflow-y-auto px-3 py-2 font-mono text-xs leading-5">
            {status && (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 size={12} className="animate-spin" /> {status}
              </div>
            )}

            {!status && !lines.length && !running && (
              <span className="text-gray-600">Output appears here.</span>
            )}

            {lines.map((line, index) => (
              <pre
                key={index}
                className={`whitespace-pre-wrap break-words ${
                  line.type === "err"
                    ? "text-red-400"
                    : line.type === "dim"
                    ? "text-gray-500"
                    : "text-gray-200"
                }`}
              >
                {line.text}
              </pre>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}