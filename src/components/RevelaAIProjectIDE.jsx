import React, { useCallback, useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import { Download, ExternalLink, FileCode2, Play, Save, ShieldCheck, Square, Terminal } from "lucide-react";
import { resolveRevelaAIArtifactUrl } from "@/components/utils/saveGeneratedFile";
import { downloadRemoteArtifact } from "@/components/utils/saveGeneratedFile";
import { getLocalWorkspaceAgentConfig, validateLocalWorkspaceSource, writeLocalWorkspaceFile } from "@/ai/localWorkspaceAgent";
import { runCode, stopCode } from "@/ide/runners";

function languageForPath(path = "") {
  const ext = String(path).split(".").pop().toLowerCase();
  if (["js", "mjs", "cjs"].includes(ext)) return "javascript";
  if (ext === "py") return "python";
  if (["html", "htm"].includes(ext)) return "html";
  if (ext === "css") return "css";
  return "text";
}

function editorExtensions(language) {
  if (language === "javascript") return [javascript()];
  if (language === "python") return [python()];
  if (language === "html") return [html()];
  return [];
}

function getProjectFileUrl(previewUrl, relativePath) {
  const preview = new URL(resolveRevelaAIArtifactUrl(previewUrl), window.location.origin);
  const segments = preview.pathname.split("/");
  const previewIndex = segments.indexOf("preview");
  if (previewIndex < 0 || segments.length <= previewIndex + 2) {
    throw new Error("The signed project preview URL is invalid.");
  }
  const root = segments.slice(0, previewIndex + 3).join("/") + "/";
  const path = String(relativePath || "").split("/").map(encodeURIComponent).join("/");
  const url = new URL(root + path, preview.origin);
  const expires = preview.searchParams.get("expires");
  if (expires) url.searchParams.set("expires", expires);
  return url.toString();
}

export default function RevelaAIProjectIDE({ project, onDownload }) {
  const fileItems = Array.isArray(project?.files) ? project.files : [];
  const [selectedPath, setSelectedPath] = useState(project?.entrypoint || fileItems[0]?.path || "index.html");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [previewDoc, setPreviewDoc] = useState("");
  const [consoleLines, setConsoleLines] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [localConfig, setLocalConfig] = useState(() => getLocalWorkspaceAgentConfig());

  const language = useMemo(() => languageForPath(selectedPath), [selectedPath]);
  const entryPreviewUrl = project?.preview_url
    ? resolveRevelaAIArtifactUrl(project.preview_url)
    : "";

  useEffect(() => {
    setSelectedPath(project?.entrypoint || fileItems[0]?.path || "index.html");
  }, [project?.project_id, project?.entrypoint]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!project?.preview_url || !selectedPath) return;
      setLoading(true);
      setError("");
      setNotice("");
      try {
        const response = await fetch(getProjectFileUrl(project.preview_url, selectedPath), {
          cache: "no-store",
          credentials: "omit",
        });
        if (!response.ok) throw new Error("Could not load " + selectedPath + " (HTTP " + response.status + ").");
        const text = await response.text();
        if (active) {
          setSource(text);
          setPreviewDoc(languageForPath(selectedPath) === "html" ? text : "");
          setConsoleLines([]);
        }
      } catch (cause) {
        if (active) setError(cause?.message || "Could not load the project source.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [project?.preview_url, selectedPath]);

  useEffect(() => () => {
    stopCode("javascript");
    stopCode("python");
  }, []);

  const run = useCallback(async () => {
    setError("");
    setNotice("");
    setConsoleLines([]);
    if (language === "html") {
      setPreviewDoc(source);
      setNotice("HTML preview rendered in an isolated sandboxed frame. No remote scripts or backend connections are permitted by the preview policy.");
      return;
    }
    if (!["javascript", "python"].includes(language)) {
      setNotice("This file is editable. The browser test runner supports JavaScript and Python; no shell command was executed.");
      return;
    }

    setRunning(true);
    try {
      if (localConfig.token) {
        const validation = await validateLocalWorkspaceSource(language, source, localConfig);
        if (validation.status === "invalid") {
          setConsoleLines([{ type: "err", text: validation.output || validation.message || "Syntax validation failed." }]);
          return;
        }
        if (validation.status === "valid") {
          setConsoleLines([{ type: "dim", text: "Static syntax check passed (" + validation.check + "). Starting the isolated browser worker…" }]);
        }
      }
      const result = await runCode(language, source, {
        onLine: (type, text) => setConsoleLines((items) => [...items, { type, text }]),
        onStatus: (text) => setNotice(text),
      });
      if (!result.ok) {
        setConsoleLines((items) => [...items, { type: "err", text: result.error || "Execution failed." }]);
      } else {
        setConsoleLines((items) => items.length ? items : [{ type: "dim", text: "Finished with no output." }]);
      }
    } catch (cause) {
      setConsoleLines((items) => [...items, { type: "err", text: cause?.message || "The pre-execution check failed." }]);
    } finally {
      setRunning(false);
      setNotice("");
    }
  }, [language, source, localConfig]);

  const stop = () => {
    stopCode(language);
    setRunning(false);
    setConsoleLines((items) => [...items, { type: "err", text: "Worker stopped." }]);
  };

  const saveToLocalProject = async () => {
    if (!localConfig.token || !localConfig.path) {
      setError("Connect the local agent and select your destination folder in My Local Workspace first.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await writeLocalWorkspaceFile(selectedPath, source, { approved: true, config: localConfig });
      setNotice("Saved " + result.path + " to your selected local folder. The file was not executed.");
    } catch (cause) {
      setError(cause?.message || "The file could not be saved locally.");
    } finally {
      setSaving(false);
    }
  };

  const downloadProject = async () => {
    if (!project?.zip_download_url) return;
    try {
      await downloadRemoteArtifact(project.zip_download_url, {
        fileName: project.zip_filename || (String(project.title || "revelaai-project") + ".zip"),
        mimeType: "application/zip",
      });
    } catch (cause) {
      setError(cause?.message || "The project ZIP could not be downloaded.");
    }
  };

  return (
    <section className="space-y-3" aria-label="RevelaAI project IDE">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface-2 p-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-fg">{project?.title || "Web project"}</p>
          <p className="mt-1 text-[10px] text-muted">{fileItems.length} files · local filesystem build · expiring private preview</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {entryPreviewUrl && <a href={entryPreviewUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-xs font-semibold text-fg-secondary">
            <ExternalLink size={13}/> Open preview
          </a>}
          <button type="button" onClick={downloadProject} disabled={!project?.zip_download_url}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-3 text-xs font-semibold text-white disabled:opacity-50">
            <Download size={13}/> Download ZIP
          </button>
        </div>
      </div>

      <div className="grid min-h-[420px] grid-cols-1 overflow-hidden rounded-xl border border-line lg:grid-cols-[180px_minmax(0,1fr)]">
        <aside className="border-b border-line bg-surface-2 p-2 lg:border-b-0 lg:border-r" aria-label="Project files">
          <div className="mb-2 flex items-center gap-2 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-muted">
            <FileCode2 size={13}/> Files
          </div>
          <div className="flex max-h-48 gap-1 overflow-auto lg:max-h-[390px] lg:flex-col">
            {fileItems.map((item) => (
              <button key={item.path} type="button" onClick={() => setSelectedPath(item.path)}
                className={"flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-2 text-left text-[11px] " +
                  (selectedPath === item.path ? "bg-accent/15 font-bold text-accent" : "text-fg-secondary hover:bg-surface-3")}>
                <FileCode2 size={12}/><span className="max-w-[145px] truncate">{item.path}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="min-w-0 bg-[#0d1117]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
            <span className="truncate text-xs font-semibold text-gray-300">{selectedPath} · {language}</span>
            <div className="flex gap-1.5">
              {running ? <button type="button" onClick={stop} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-red-500/15 px-3 text-xs font-bold text-red-300"><Square size={12}/> Stop</button>
                : <button type="button" onClick={run} disabled={loading || !source} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 text-xs font-bold text-emerald-300 disabled:opacity-50"><Play size={12}/> Run / Test</button>}
              <button type="button" onClick={saveToLocalProject} disabled={saving || loading || !source}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-bold text-gray-200 disabled:opacity-40">
                <Save size={12}/> {saving ? "Saving…" : "Save locally"}
              </button>
            </div>
          </div>
          <div className="min-h-[250px]">
            {loading ? <p className="p-4 text-xs text-gray-400">Loading project source…</p> : (
              <CodeMirror
                value={source}
                onChange={setSource}
                extensions={editorExtensions(language)}
                theme={oneDark}
                minHeight="250px"
                maxHeight="440px"
                basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }}
              />
            )}
          </div>
          <div className="border-t border-white/10 px-3 py-2">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400"><Terminal size={12}/> Console</div>
            {notice && <p role="status" className="mb-1 text-xs text-emerald-300">{notice}</p>}
            {error && <p role="alert" className="mb-1 text-xs text-red-400">{error}</p>}
            <div className="max-h-36 space-y-1 overflow-auto font-mono text-[11px] leading-5">
              {consoleLines.length ? consoleLines.map((line, index) => (
                <pre key={index} className={"whitespace-pre-wrap break-words " + (line.type === "err" ? "text-red-400" : line.type === "dim" ? "text-gray-500" : "text-gray-200")}>{line.text}</pre>
              )) : <p className="text-gray-600">Validation and run output will appear here. Tests run in a browser worker; shell commands are not enabled.</p>}
            </div>
          </div>
        </div>
      </div>

      {project?.preview_url && <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted"><ShieldCheck size={13}/> Live isolated preview</div>
        <iframe title="Generated web project preview" src={entryPreviewUrl}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          className="h-[420px] w-full rounded-xl border border-line bg-white"
          loading="lazy"/>
      </div>}
      <p className="text-[10px] leading-5 text-muted">
        The editor can test JavaScript/Python in an isolated browser worker, or render HTML in a sandboxed preview. Saving writes only to your explicitly selected local folder. No terminal shell commands are run.
      </p>
    </section>
  );
}
