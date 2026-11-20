import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  AlertCircle, CheckCircle2, CirclePlay, Download, FileCode2, Loader2,
  Save, ShieldCheck, Square, WandSparkles, X,
} from "lucide-react";
import { downloadRemoteArtifact } from "@/components/utils/saveGeneratedFile";
import {
  cancelRevelaAIArtifactEdit,
  confirmRevelaAIArtifactEdit,
  proposeRevelaAIArtifactEdit,
  saveRevelaAIArtifactSource,
  setRevelaAIArtifactEditorState,
} from "@/ai/revelaAIClient.js";
import { getLocalWorkspaceAgentConfig, validateLocalWorkspaceSource } from "@/ai/localWorkspaceAgent";
import { runCode, stopCode } from "@/ide/runners";

function fileExtension(filename = "") {
  const match = String(filename).toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || "txt";
}

function languageForFile(filename = "", hint = "") {
  const extension = fileExtension(filename);
  const normalized = String(hint || "").toLowerCase();
  if (["js", "mjs", "cjs"].includes(extension) || ["javascript", "js"].includes(normalized)) return "javascript";
  if (extension === "py" || ["python", "py"].includes(normalized)) return "python";
  if (["html", "htm"].includes(extension) || normalized === "html") return "html";
  if (extension === "css" || normalized === "css") return "css";
  if (["ts", "tsx"].includes(extension) || ["typescript", "tsx"].includes(normalized)) return "typescript";
  if (extension === "jsx" || normalized === "jsx") return "jsx";
  if (extension === "json" || normalized === "json") return "json";
  return normalized || extension || "text";
}

function editorExtensions(language) {
  if (language === "javascript") return [javascript()];
  if (language === "typescript") return [javascript({ typescript: true })];
  if (language === "jsx") return [javascript({ jsx: true })];
  if (language === "html") return [html()];
  if (language === "css") return [css()];
  if (language === "python") return [python()];
  if (language === "json") return [javascript()];
  return [];
}

function getEditableArtifact(artifact) {
  const manifest = artifact?.artifact && typeof artifact.artifact === "object"
    ? artifact.artifact
    : artifact;
  const editable = manifest?.preview?.editable_source
    || artifact?.preview?.editable_source
    || null;
  const payload = editable?.payload && typeof editable.payload === "object" ? editable.payload : {};
  const filename = String(manifest?.filename || artifact?.filename || "revelaai-source.txt");
  const source = payload.source ?? manifest?.preview?.source_preview ?? artifact?.code ?? "";
  return {
    manifest,
    filename,
    source: String(source || ""),
    extension: String(payload.extension || fileExtension(filename)).replace(/^\./, "").toLowerCase(),
    language: languageForFile(filename, payload.language || editable?.language),
  };
}

function addPreviewPolicy(source) {
  const policy = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data: blob:; style-src \'unsafe-inline\' data: blob:; script-src \'unsafe-inline\'; connect-src \'none\'; frame-src \'none\'; object-src \'none\'; base-uri \'none\'; form-action \'none\'">';
  if (/<head\b[^>]*>/i.test(source)) {
    return source.replace(/<head\b[^>]*>/i, (head) => head + policy);
  }
  if (/<html\\b[^>]*>/i.test(source)) return source.replace(/<html\\b[^>]*>/i, (htmlTag) => htmlTag + "<head>" + policy + "</head>");\n  return "<!doctype html><html><head>" + policy + "</head><body>" + source + "</body></html>";
}

function asConsoleText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

export default function RevelaAICodeIDE({
  artifact,
  authFetch,
  onArtifactUpdated,
  onAskAI,
}) {
  const initial = useMemo(() => getEditableArtifact(artifact), [artifact]);
  const [manifest, setManifest] = useState(initial.manifest);
  const [filename] = useState(initial.filename);
  const [language] = useState(initial.language);
  const [source, setSource] = useState(initial.source);
  const [savedSource, setSavedSource] = useState(initial.source);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [applyingRepair, setApplyingRepair] = useState(false);
  const [editSessionReady, setEditSessionReady] = useState(false);
  const [editSessionError, setEditSessionError] = useState("");
  const [consoleLines, setConsoleLines] = useState([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [previewDocument, setPreviewDocument] = useState("");
  const [repairProposal, setRepairProposal] = useState(null);
  const [lastFailure, setLastFailure] = useState("");
  const [localConfig] = useState(() => getLocalWorkspaceAgentConfig());
  const sessionRef = useRef({ artifactId: "", opened: false });
  const repairProposalRef = useRef(null);
  const artifactId = String(manifest?.id || manifest?.artifact_id || initial.manifest?.id || "");
  const activeArtifactIdRef = useRef(artifactId);
  activeArtifactIdRef.current = artifactId;
  const dirty = source !== savedSource;
  const runtimeLanguage = language === "javascript" || language === "python";
  const canValidateLocally = Boolean(localConfig.token);

  useEffect(() => {
    setManifest(initial.manifest);
    setSource(initial.source);
    setSavedSource(initial.source);
    setConsoleLines([]);
    setPreviewDocument("");
    setRepairProposal(null);
    setLastFailure("");
    setNotice("");
    setError("");
  }, [initial.manifest?.id, initial.manifest?.version, initial.source]);

  useEffect(() => {
    let cancelled = false;
    const currentId = artifactId;
    if (!currentId || typeof authFetch !== "function") {
      setEditSessionReady(false);
      setEditSessionError("Sign in to save changes to this generated source file.");
      return undefined;
    }
    setEditSessionReady(false);
    setEditSessionError("");
    setRevelaAIArtifactEditorState({ authFetch, artifactId: currentId, action: "user_opened" })
      .then((opened) => {
        if (cancelled) {
          void setRevelaAIArtifactEditorState({ authFetch, artifactId: currentId, action: "returned" }).catch(() => {});
          return;
        }
        sessionRef.current = { artifactId: currentId, opened: true };
        if (opened?.id) setManifest(opened);
        setEditSessionReady(true);
      })
      .catch((cause) => {
        if (!cancelled) setEditSessionError(cause?.message || "The source editor session could not be opened.");
      });
    return () => {
      cancelled = true;
      const session = sessionRef.current;
      if (session.opened && session.artifactId === currentId) {
        sessionRef.current = { artifactId: "", opened: false };
        void setRevelaAIArtifactEditorState({ authFetch, artifactId: currentId, action: "returned" }).catch(() => {});
      }
    };
  }, [authFetch, artifactId]);

  useEffect(() => {
    repairProposalRef.current = repairProposal;
  }, [repairProposal]);

  useEffect(() => () => {
    stopCode("javascript");
    stopCode("python");
    const session = sessionRef.current;
    if (session.opened && session.artifactId) {
      void setRevelaAIArtifactEditorState({ authFetch, artifactId: session.artifactId, action: "returned" }).catch(() => {});
    }
    const proposal = repairProposalRef.current;
    if (proposal?.proposal_id && activeArtifactIdRef.current) {
      void cancelRevelaAIArtifactEdit({ authFetch, artifactId: activeArtifactIdRef.current }).catch(() => {});
    }
  }, [authFetch]);

  const closeEditorSession = async () => {
    const session = sessionRef.current;
    if (!session.opened || !session.artifactId) {
      setEditSessionReady(false);
      return;
    }
    sessionRef.current = { artifactId: "", opened: false };
    setEditSessionReady(false);
    await setRevelaAIArtifactEditorState({ authFetch, artifactId: session.artifactId, action: "returned" });
  };

  const openEditorSession = async () => {
    if (!artifactId) throw new Error("The saved source artifact is unavailable.");
    const opened = await setRevelaAIArtifactEditorState({ authFetch, artifactId, action: "user_opened" });
    sessionRef.current = { artifactId, opened: true };
    if (opened?.id) setManifest(opened);
    setEditSessionReady(true);
    setEditSessionError("");
    return opened;
  };

  const validate = useCallback(async () => {
    setValidating(true);
    setError("");
    setNotice("");
    try {
      if (localConfig.token && ["javascript", "python", "json", "html"].includes(language)) {
        const result = await validateLocalWorkspaceSource(language, source, localConfig);
        if (result.status === "invalid") {
          const message = String(result.output || result.message || "Static validation failed.");
          setConsoleLines([{ type: "err", text: message }]);
          setLastFailure(message);
          return false;
        }
        if (result.status === "valid") {
          setConsoleLines([{ type: "dim", text: "Local static validation passed (" + (result.check || language) + ")." }]);
          setNotice("Static validation passed. No source was executed by the local validator.");
          setLastFailure("");
          return true;
        }
      }
      if (language === "json") {
        JSON.parse(source);
        setConsoleLines([{ type: "dim", text: "JSON syntax validation passed." }]);
        setNotice("JSON is valid.");
        setLastFailure("");
        return true;
      }
      if (language === "css" && typeof CSSStyleSheet !== "undefined") {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(source);
        setConsoleLines([{ type: "dim", text: "CSS parser accepted the stylesheet." }]);
        setNotice("CSS syntax check passed.");
        setLastFailure("");
        return true;
      }
      if (language === "html") {
        new DOMParser().parseFromString(source, "text/html");
        setPreviewDocument(source);
        setConsoleLines([{ type: "dim", text: "HTML parsed in the browser. Preview scripts run in a sandboxed frame with network access disabled by policy." }]);
        setNotice("HTML validation and preview are ready.");
        setLastFailure("");
        return true;
      }
      if (canValidateLocally) {
        const result = await validateLocalWorkspaceSource(language, source, localConfig);
        if (result.status === "invalid") {
          const message = String(result.output || result.message || "Static validation failed.");
          setConsoleLines([{ type: "err", text: message }]);
          setLastFailure(message);
          return false;
        }
        if (result.status === "valid") {
          setConsoleLines([{ type: "dim", text: "Local static validation passed (" + (result.check || language) + ")." }]);
          setNotice("Static validation passed. No runtime compiler is configured for " + language + ".");
          setLastFailure("");
          return true;
        }
      }
      const message = "No static validator or runtime runner is configured for " + language + ". Connect the local workspace agent to run an available syntax check.";
      setConsoleLines([{ type: "dim", text: message }]);
      setNotice(message);
      setLastFailure("");
      return false;
    } catch (cause) {
      const message = cause?.message || "Static validation failed.";
      setConsoleLines([{ type: "err", text: message }]);
      setLastFailure(message);
      return false;
    } finally {
      setValidating(false);
    }
  }, [canValidateLocally, language, localConfig, source]);

  const run = useCallback(async () => {
    setError("");
    setNotice("");
    setConsoleLines([]);
    setPreviewDocument("");
    setLastFailure("");
    setRepairProposal(null);

    if (language === "html") {
      setPreviewDocument(source);
      setNotice("HTML is displayed in a sandboxed preview. Browser permissions, project files and network access are not exposed.");
      return;
    }
    if (language === "json" || language === "css" || (!runtimeLanguage && canValidateLocally)) {
      await validate();
      return;
    }
    if (!runtimeLanguage) {
      const message = "RevelaAI does not have an in-browser runtime for " + language + ". Use static validation through the connected local agent, or ask AI to review the source.";
      setNotice(message);
      setConsoleLines([{ type: "dim", text: message }]);
      return;
    }

    setRunning(true);
    let captured = [];
    try {
      if (canValidateLocally) {
        const validation = await validateLocalWorkspaceSource(language, source, localConfig);
        if (validation.status === "invalid") {
          const message = String(validation.output || validation.message || "Static syntax validation failed.");
          setConsoleLines([{ type: "err", text: message }]);
          setLastFailure(message);
          return;
        }
        if (validation.status === "valid") {
          setConsoleLines([{ type: "dim", text: "Static validation passed. Starting isolated " + language + " worker…" }]);
        }
      }
      const result = await runCode(language, source, {
        onLine: (type, line) => {
          captured.push({ type, text: asConsoleText(line) });
          setConsoleLines((items) => [...items, { type, text: asConsoleText(line) }]);
        },
        onStatus: (status) => {
          if (status) setNotice(status);
        },
      });
      if (!result.ok) {
        const message = String(result.error || "Execution failed.");
        captured.push({ type: "err", text: message });
        setConsoleLines((items) => [...items, { type: "err", text: message }]);
        setLastFailure(captured.map((line) => line.text).filter(Boolean).join("\n"));
      } else {
        const consoleErrors = captured.filter((line) => line.type === "err");
        setConsoleLines((items) => items.length ? items : [{ type: "dim", text: "Execution finished with no output." }]);
        if (consoleErrors.length) {
          setNotice("Execution finished, but the console reported errors. You can ask AI to repair them.");
          setLastFailure(consoleErrors.map((line) => line.text).join("\n"));
        } else {
          setNotice("Execution completed in the isolated browser worker.");
          setLastFailure("");
        }
      }
    } catch (cause) {
      const message = String(cause?.message || "Execution failed.");
      captured.push({ type: "err", text: message });
      setConsoleLines((items) => [...items, { type: "err", text: message }]);
      setLastFailure(message + (captured.length ? "\n" + captured.map((line) => line.text).join("\n") : ""));
    } finally {
      setRunning(false);
    }
  }, [canValidateLocally, language, localConfig, runtimeLanguage, source, validate]);

  const stop = () => {
    stopCode(language);
    setRunning(false);
    setNotice("Execution stopped.");
  };

  const save = async () => {
    if (!artifactId || !editSessionReady) {
      setError(editSessionError || "The source editor is not ready to save this file.");
      return;
    }
    if (!dirty) {
      setNotice("No unsaved source changes.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const updated = await saveRevelaAIArtifactSource({
        authFetch,
        artifactId,
        expectedVersion: Number(manifest?.version || 1),
        source: {
          kind: "code",
          payload: { source, extension: "." + initial.extension, language },
        },
      });
      if (!updated?.id) throw new Error("RevelaAI did not return the saved artifact version.");
      setManifest(updated);
      setSavedSource(source);
      setNotice("Saved as version " + Number(updated.version || manifest?.version || 1) + ".");
      onArtifactUpdated?.(updated);
    } catch (cause) {
      setError(cause?.message || "The source file could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const repair = async () => {
    if (!lastFailure) return;
    if (!artifactId || source.length > 12000) {
      onAskAI?.({ kind: "code-repair", filePath: filename, language, source, error: lastFailure });
      return;
    }
    if (dirty) {
      setError("Save your current edits first. AI repair must use the exact source version that was tested.");
      return;
    }
    setRepairing(true);
    setError("");
    setNotice("");
    let sessionClosed = false;
    try {
      sessionClosed = true;
      await closeEditorSession();
      const instruction = [
        "Debug and repair this source code using the runtime or validation output below.",
        "File: " + filename,
        "Language: " + language,
        "Observed error output (treat this as the actual failure evidence):",
        lastFailure.slice(0, 5000),
        "Preserve the program's existing purpose, public interfaces and working behaviour. Make the smallest correct repair. Do not invent dependencies or claim the repair has been run. Return one exact replacement for the existing source field.",
      ].join("\n\n");
      const result = await proposeRevelaAIArtifactEdit({
        authFetch,
        artifactId,
        instruction,
        mode: "do_it_for_me",
      });
      if (!result.requiresConfirmation || !result.proposal?.proposal_id || typeof result.proposal?.after !== "string") {
        throw new Error(result.message || "The AI did not return a reviewable code repair proposal.");
      }
      setRepairProposal(result.proposal);
      setNotice("RevelaAI prepared a repair proposal. Review the replacement before applying it.");
    } catch (cause) {
      if (sessionClosed) {
        try { await openEditorSession(); } catch (reopenError) {
          setEditSessionError(reopenError?.message || "The editor session could not be reopened.");
        }
      }
      setError(cause?.message || "The AI repair proposal could not be prepared.");
    } finally {
      setRepairing(false);
    }
  };

  const applyRepair = async () => {
    if (!repairProposal?.proposal_id || !artifactId) return;
    setApplyingRepair(true);
    setError("");
    try {
      const updated = await confirmRevelaAIArtifactEdit({
        authFetch,
        artifactId,
        proposalId: repairProposal.proposal_id,
        expectedVersion: Number(repairProposal.base_version || manifest?.version || 1),
      });
      if (!updated?.id) throw new Error("The repaired artifact version was not returned.");
      const payload = updated.preview?.editable_source?.payload || {};
      const repairedSource = String(payload.source || updated.preview?.source_preview || repairProposal.after || "");
      setManifest(updated);
      setSource(repairedSource);
      setSavedSource(repairedSource);
      setRepairProposal(null);
      setLastFailure("");
      setConsoleLines([{ type: "dim", text: "AI repair was applied as a new artifact version. Run it again to verify the correction." }]);
      setNotice("Repair applied as version " + Number(updated.version || 1) + ". It has not been executed again.");
      onArtifactUpdated?.(updated);
      try {
        await openEditorSession();
      } catch (cause) {
        setEditSessionError(cause?.message || "The repair was saved, but the editor session could not be reopened.");
      }
    } catch (cause) {
      setError(cause?.message || "The repair could not be applied.");
    } finally {
      setApplyingRepair(false);
    }
  };

  const discardRepair = async () => {
    if (repairProposal?.proposal_id && artifactId) {
      try {
        await cancelRevelaAIArtifactEdit({ authFetch, artifactId });
      } catch (cause) {
        setError(cause?.message || "The AI repair proposal could not be discarded.");
        return;
      }
    }
    setRepairProposal(null);
    try {
      await openEditorSession();
    } catch (cause) {
      setEditSessionError(cause?.message || "The editor session could not be reopened.");
    }
  };

  const download = async () => {
    const url = manifest?.download_url || artifact?.download_url;
    if (!url) return;
    try {
      await downloadRemoteArtifact(url, { fileName: filename, mimeType: manifest?.mime_type || "text/plain" });
    } catch (cause) {
      setError(cause?.message || "The source file could not be downloaded.");
    }
  };

  const readOnlyExtensions = useMemo(() => editorExtensions(language), [language]);
  const previewDoc = previewDocument ? addPreviewPolicy(previewDocument) : "";

  return (
    <section className="space-y-3" aria-label="RevelaAI Code IDE">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface-2 p-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileCode2 size={15} className="text-accent"/>
            <p className="truncate text-xs font-bold text-fg">{filename}</p>
          </div>
          <p className="mt-1 text-[10px] text-muted">Version {manifest?.version || 1} · {language} · source stored in your private Files Library</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={download} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-xs font-semibold text-fg-secondary">
            <Download size={13}/> Download
          </button>
          <button type="button" onClick={save} disabled={!dirty || saving || !editSessionReady}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-3 text-xs font-semibold text-white disabled:opacity-40">
            {saving ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>} Save version
          </button>
        </div>
      </div>

      {editSessionError && <p role="alert" className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">{editSessionError}</p>}

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1117]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
          <span className="truncate text-xs font-semibold text-gray-300">{filename} · {language}{dirty ? " · Unsaved changes" : ""}</span>
          <div className="flex gap-1.5">
            {running
              ? <button type="button" onClick={stop} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-red-500/15 px-3 text-xs font-bold text-red-300"><Square size={12}/> Stop</button>
              : <button type="button" onClick={run} disabled={!source.trim() || validating} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 text-xs font-bold text-emerald-300 disabled:opacity-40"><CirclePlay size={13}/> Run / Test</button>}
            <button type="button" onClick={() => void validate()} disabled={validating || running} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-semibold text-gray-200 disabled:opacity-40">
              {validating ? <Loader2 size={12} className="animate-spin"/> : <ShieldCheck size={12}/>} Validate
            </button>
          </div>
        </div>
        <div className="min-h-[300px]">
          <CodeMirror
            value={source}
            onChange={(value) => { setSource(value); setRepairProposal(null); }}
            extensions={readOnlyExtensions}
            theme={oneDark}
            minHeight="300px"
            maxHeight="560px"
            basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true, bracketMatching: true, autocompletion: true }}
          />
        </div>
        <div className="border-t border-white/10 px-3 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <AlertCircle size={12}/> Run & validation output
            </div>
            {lastFailure && <button type="button" onClick={() => void repair()} disabled={repairing || dirty || (Boolean(artifactId) && !editSessionReady)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-violet-500/15 px-3 text-[11px] font-bold text-violet-300 disabled:opacity-40">
              {repairing ? <Loader2 size={12} className="animate-spin"/> : <WandSparkles size={12}/>} Fix with AI
            </button>}
          </div>
          {notice && <p role="status" className="mb-2 text-xs text-emerald-300">{notice}</p>}
          {error && <p role="alert" className="mb-2 text-xs text-red-400">{error}</p>}
          <div className="max-h-48 space-y-1 overflow-auto font-mono text-[11px] leading-5" aria-live="polite">
            {consoleLines.length
              ? consoleLines.map((line, index) => <pre key={index} className={"whitespace-pre-wrap break-words " + (line.type === "err" ? "text-red-400" : line.type === "dim" ? "text-gray-500" : "text-gray-200")}>{line.text}</pre>)
              : <p className="text-gray-600">Run or validate this source. JavaScript and Python execute in isolated browser workers; other languages use static checks only when a local agent supports them.</p>}
          </div>
        </div>
      </div>

      {repairProposal && (
        <section className="space-y-3 rounded-xl border border-violet-500/25 bg-violet-500/5 p-3" aria-label="AI repair proposal">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-fg"><WandSparkles size={15} className="text-violet-500"/> Proposed code repair</div>
            <span className="text-[10px] text-muted">Not yet applied</span>
          </div>
          {repairProposal.rationale && <p className="text-xs leading-5 text-fg-secondary">{repairProposal.rationale}</p>}
          {repairProposal.guide && <p className="text-xs leading-5 text-fg-secondary">{repairProposal.guide}</p>}
          <details className="rounded-lg border border-line bg-surface-2 p-2">
            <summary className="cursor-pointer text-xs font-semibold">Review complete replacement source</summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] leading-5 text-fg-secondary">{repairProposal.after}</pre>
          </details>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={applyRepair} disabled={applyingRepair} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white disabled:opacity-40">
              {applyingRepair ? <Loader2 size={13} className="animate-spin"/> : <CheckCircle2 size={13}/>} Apply as new version
            </button>
            <button type="button" onClick={() => void discardRepair()} disabled={applyingRepair} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-xs font-semibold text-fg-secondary disabled:opacity-40"><X size={13}/> Discard proposal</button>
          </div>
        </section>
      )}

      {previewDoc && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted"><ShieldCheck size={13}/> Sandboxed HTML preview</div>
          <iframe title="Generated HTML source preview" srcDoc={previewDoc} sandbox="allow-scripts" referrerPolicy="no-referrer" className="h-[440px] w-full rounded-xl border border-line bg-white"/>
        </div>
      )}

      <p className="text-[10px] leading-5 text-muted">
        RevelaAI executes JavaScript and Python in isolated browser workers with a time limit. HTML is previewed in a sandbox. Static validation does not prove that a program works in production. AI repairs are shown as proposals and require your confirmation before a new version is saved.
      </p>
    </section>
  );
}
