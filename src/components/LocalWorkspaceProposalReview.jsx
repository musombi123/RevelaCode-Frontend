import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileCode2, Loader2, ShieldCheck, X } from "lucide-react";
import { getLocalWorkspaceAgentConfig, testLocalWorkspaceAgent, writeLocalWorkspaceFile } from "@/ai/localWorkspaceAgent";

export default function LocalWorkspaceProposalReview({ proposal, onClose, onApplied }) {
  const files = Array.isArray(proposal?.files) ? proposal.files : [];
  const config = useMemo(() => getLocalWorkspaceAgentConfig(), []);
  const [approved, setApproved] = useState(false);
  const [applying, setApplying] = useState(false);
  const [appliedFiles, setAppliedFiles] = useState([]);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  const applyChanges = async () => {
    if (!approved || applying || !files.length) return;
    setApplying(true);
    setError("");
    setAppliedFiles([]);
    try {
      if (!config.enabled || !config.token || !config.path) {
        throw new Error("Reconnect the local agent and select the destination folder in Files & Local Workspace.");
      }
      await testLocalWorkspaceAgent(config);
      const completed = [];
      for (const file of files) {
        await writeLocalWorkspaceFile(file.path, file.content, {
          approved: true,
          config,
        });
        completed.push(file.path);
        setAppliedFiles([...completed]);
      }
      setComplete(true);
      onApplied?.(completed);
    } catch (cause) {
      const partial = appliedFiles.length;
      setError(
        (cause?.message || "The local file changes could not be applied.") +
        (partial ? " " + partial + " file(s) were already written before the failure; review the list before retrying." : "")
      );
    } finally {
      setApplying(false);
    }
  };

  return (
    <section className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="local-change-proposal-title">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 dark:border-white/10">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300"><FileCode2 size={19}/></div>
            <div className="min-w-0">
              <h2 id="local-change-proposal-title" className="text-sm font-black text-slate-950 dark:text-white">Review local project changes</h2>
              <p className="mt-1 text-xs text-slate-500">{proposal?.title || "Proposed source changes"} · {files.length} file(s) · not applied yet</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close review" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><X size={18}/></button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">{proposal?.summary || "RevelaAI prepared source changes for your selected local project."}</p>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Destination folder</p>
            <p className="mt-1 break-all font-mono text-xs text-slate-800 dark:text-slate-200">{config.path || "No local project folder selected"}</p>
          </div>

          <div className="space-y-3">
            {files.map((file) => (
              <details key={file.path} className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 bg-slate-50 px-3 py-3 dark:bg-white/[0.03]">
                  <span className="min-w-0 break-all font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{file.path}</span>
                  <span className="text-[10px] text-slate-500">{Number(file.bytes || new TextEncoder().encode(file.content || "").length).toLocaleString()} bytes</span>
                </summary>
                {file.reason && <p className="px-3 pt-3 text-xs text-slate-600 dark:text-slate-400">{file.reason}</p>}
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words bg-slate-950 p-3 text-[11px] leading-5 text-slate-100">{file.content}</pre>
              </details>
            ))}
          </div>

          {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
          {complete && <p role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><CheckCircle2 size={15}/> All proposed files have been written to your local project folder.</p>}
          {appliedFiles.length > 0 && !complete && <p className="text-xs text-amber-700 dark:text-amber-300">Applied so far: {appliedFiles.join(", ")}</p>}

          {!complete && (
            <label className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
              <input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} disabled={applying} className="mt-0.5"/>
              <span><b>I reviewed these changes and approve writing them to my selected local folder.</b><br/>Existing files with the same relative paths will be replaced. RevelaAI will not execute the files or run project scripts.</span>
            </label>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 p-4 dark:border-white/10">
          <p className="flex items-center gap-1.5 text-[10px] text-slate-500"><ShieldCheck size={13}/> Local write only · user approval required</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} disabled={applying} className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-700 dark:border-white/15 dark:text-slate-200">{complete ? "Close" : "Cancel"}</button>
            {!complete && <button type="button" onClick={applyChanges} disabled={!approved || applying || !files.length}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white disabled:opacity-40">
              {applying ? <><Loader2 size={13} className="animate-spin"/> Applying…</> : "Apply approved changes"}
            </button>}
          </div>
        </footer>
      </div>
    </section>
  );
}
