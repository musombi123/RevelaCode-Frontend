import React, { useCallback, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  FileText,
  Loader,
  RefreshCw,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";

const ENTITY_OPTIONS = [
  ["students", "Students / learners"],
  ["classes", "Classes / streams"],
  ["attendance", "Attendance"],
  ["assessments", "Exams / assessments / marks"],
  ["fees", "Fees / payments"],
  ["assignments", "Assignments"],
  ["lessons", "Lessons"],
  ["timetables", "Timetables"],
  ["timetable_entries", "Timetable entries"],
  ["cbc_projects", "CBC projects"],
  ["events", "School events"],
];

function unwrap(value) {
  let current = value;
  for (let i = 0; i < 7; i += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return current;
    if (current.success === false || current.ok === false) {
      throw new Error(current.message || current.error?.message || current.error || "The request was unsuccessful.");
    }
    if (current.data && typeof current.data === "object") { current = current.data; continue; }
    if (current.result && typeof current.result === "object") { current = current.result; continue; }
    return current;
  }
  return current;
}

function displayTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
}

function humanize(value) {
  return String(value || "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().replace(/^./, (c) => c.toUpperCase());
}

function summaryFrom(value) {
  const data = unwrap(value) || {};
  return data.import && typeof data.import === "object" ? { ...data.import, ...data } : data;
}

export default function ElimuLegacyImport({ api, school }) {
  const [file, setFile] = useState(null);
  const [entityType, setEntityType] = useState("students");
  const [mappingText, setMappingText] = useState("");
  const [preview, setPreview] = useState(null);
  const [job, setJob] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const updateJob = useCallback((response) => {
    const data = summaryFrom(response);
    setJob((previous) => ({ ...(previous || {}), ...data }));
    return data;
  }, []);

  const handlePreview = async (event) => {
    event.preventDefault();
    if (!file || loadingPreview || running) return;
    setLoadingPreview(true);
    setError("");
    setNotice("");
    setPreview(null);
    setJob(null);
    try {
      let fieldMappings;
      if (mappingText.trim()) {
        try { fieldMappings = JSON.parse(mappingText); }
        catch { throw new Error("Field mapping must be valid JSON, for example {\"AdmissionNo\":\"admission_number\"}."); }
        if (!fieldMappings || typeof fieldMappings !== "object" || Array.isArray(fieldMappings)) throw new Error("Field mapping must be a JSON object.");
      }
      const isBundle = /\.zip$/i.test(file.name);
      const response = await api.previewElimuLegacyImport(file, {
        entity_type: isBundle ? undefined : entityType,
        field_mappings: fieldMappings,
      });
      const data = summaryFrom(response);
      if (!data.import_id) throw new Error("The server did not return an import preview ID.");
      setPreview(data);
      setNotice("Preview created. The source file is staged temporarily; no school records have been changed yet.");
    } catch (requestError) {
      setError(requestError?.message || "The file could not be previewed.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const processBatches = async (importId, retryFailed = false) => {
    let shouldRetry = retryFailed;
    // One short request per bounded batch. A single button starts the complete staged migration.
    for (let index = 0; index < 2000; index += 1) {
      const response = await api.processElimuLegacyImportBatch({ import_id: importId, retry_failed: shouldRetry });
      shouldRetry = false;
      const next = updateJob(response);
      if (next.complete || next.status === "completed") {
        setNotice("Migration completed. Review the created/updated counts and any manual conflicts below.");
        return;
      }
      if (next.needs_retry || next.status === "paused") {
        setNotice("The migration is paused at a failed batch. Review the error, then use Retry / continue. Successfully processed batches remain recorded.");
        return;
      }
      if (next.status !== "running") {
        setNotice("Import status refreshed. Use Continue migration to resume processing.");
        return;
      }
    }
    throw new Error("The migration reached the client safety limit. Use Continue migration to resume from the stored batch checkpoint.");
  };

  const handleStart = async () => {
    const importId = preview?.import_id || job?.import_id;
    if (!importId || running) return;
    setRunning(true);
    setError("");
    setNotice("");
    try {
      const response = await api.startElimuLegacyImport({ import_id: importId });
      const started = updateJob(response);
      if (started.status === "completed") {
        setNotice("This migration has already completed.");
        return;
      }
      await processBatches(importId, false);
    } catch (requestError) {
      setError(requestError?.message || "The migration could not be started.");
    } finally {
      setRunning(false);
    }
  };

  const handleRetry = async () => {
    const importId = preview?.import_id || job?.import_id;
    if (!importId || running) return;
    setRunning(true);
    setError("");
    setNotice("");
    try {
      await api.startElimuLegacyImport({ import_id: importId });
      await processBatches(importId, true);
    } catch (requestError) {
      setError(requestError?.message || "The migration could not be resumed.");
    } finally {
      setRunning(false);
    }
  };

  const handleRefreshStatus = async () => {
    const importId = preview?.import_id || job?.import_id;
    if (!importId || running) return;
    setError("");
    try {
      const response = await api.getElimuLegacyImportStatus(importId);
      updateJob(response);
      setNotice("Import status refreshed from the server.");
    } catch (requestError) {
      setError(requestError?.message || "Could not refresh import status.");
    }
  };

  const active = job || preview;
  const totalBatches = Number(active?.total_batches || 0);
  const completedBatches = Number(active?.completed_batches || 0);
  const percent = Math.min(100, Math.max(0, Number(active?.progress_percent ?? (totalBatches ? Math.round(completedBatches * 100 / totalBatches) : 0))));
  const isComplete = active?.status === "completed" || active?.complete === true;
  const needsRetry = active?.status === "paused" || active?.needs_retry === true;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 px-5 py-6 text-white sm:px-7">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-emerald-200"><Database size={24} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Legacy data migration</p>
            <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">Bring your existing school data into Elimu</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Upload one ZIP package containing the school's CSV, JSON or XLSX exports—or upload a single export. Elimu previews the records first, then moves them through the existing Sync engine in checkpointed batches.</p>
            <p className="mt-2 text-xs text-slate-400">Destination school: {school?.name || school?.school_name || "your authenticated Elimu school"}</p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-7">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100">
          <ShieldCheck size={19} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">First, appoint the school Principal</p>
            <p className="mt-1 leading-6">The School Owner must invite one Principal in Manage Staff before the migration can start. Staff accounts, school ownership and teacher assignments are not imported from a file; invite or link staff through Elimu so account access stays secure.</p>
          </div>
        </div>

        <form onSubmit={handlePreview} className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">School export package</span>
              <span className="flex min-h-14 items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                {file?.name?.toLowerCase().endsWith(".zip") ? <FileText size={21} className="shrink-0 text-emerald-700" /> : <FileText size={21} className="shrink-0 text-emerald-700" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{file?.name || "Choose ZIP, JSON, CSV or XLSX"}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">Maximum 25 MB. ZIP packages may contain up to 100 data files.</span>
                </span>
                <Upload size={18} className="shrink-0 text-slate-400" />
                <input className="sr-only" type="file" disabled={running || loadingPreview} accept=".zip,.json,.csv,.xlsx,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip" onChange={(event) => { setFile(event.target.files?.[0] || null); setPreview(null); setJob(null); setError(""); setNotice(""); }} />
              </span>
            </label>
            {file && <p className="text-xs text-slate-500">Selected file: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>}
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200" htmlFor="elimu-legacy-mappings">Optional source-field mapping</label>
              <textarea id="elimu-legacy-mappings" rows={3} value={mappingText} onChange={(event) => setMappingText(event.target.value)} placeholder={'{"AdmissionNo":"admission_number","Student Name":"full_name"}'} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
              <p className="mt-1.5 text-xs leading-5 text-slate-500">Use a JSON object to map old column names to Elimu field names. For a ZIP, use canonical entity names in the filenames, such as students.csv and classes.xlsx; the package's entity names override this selector.</p>
            </div>
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">Data type for a single file</span>
              <select value={entityType} onChange={(event) => setEntityType(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                {ENTITY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <button type="submit" disabled={!file || loadingPreview || running} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
              {loadingPreview ? <Loader size={17} className="animate-spin" /> : <Upload size={17} />}{loadingPreview ? "Preparing preview…" : "Upload and preview"}
            </button>
            <p className="text-xs leading-5 text-slate-500">Previewing only stages the normalized export temporarily. It does not write students, fees, attendance or other school records yet.</p>
          </div>
        </form>

        {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"><XCircle size={17} className="mt-0.5 shrink-0" /><p>{error}</p></div>}
        {notice && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-100"><CheckCircle2 size={17} className="mt-0.5 shrink-0" /><p>{notice}</p></div>}

        {preview && <div className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h3 className="text-base font-extrabold text-slate-950 dark:text-white">Import preview</h3><p className="mt-1 text-xs text-slate-500">{preview.filename} · expires {displayTime(preview.expires_at)}</p></div>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">{humanize(preview.status || "previewed")}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[{label:"Records to import",value:Number(preview.total_records || 0).toLocaleString("en-KE")},{label:"Batches",value:Number(preview.total_batches || 0).toLocaleString("en-KE")},{label:"Package fingerprint",value:String(preview.digest || "").slice(0,12) || "—"}].map((item) => <div key={item.label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="text-xs text-slate-500">{item.label}</p><p className="mt-1 break-words text-lg font-extrabold text-slate-950 dark:text-white">{item.value}</p></div>)}
          </div>
          <div className="space-y-2">
            {(preview.entities || []).map((entity) => <div key={entity.entity_type} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-bold text-slate-900 dark:text-white">{humanize(entity.entity_type)}</p><p className="mt-1 break-words text-xs leading-5 text-slate-500">Fields detected: {(entity.fields || []).join(", ") || "No field names detected"}</p></div><span className="shrink-0 text-sm font-bold text-emerald-700 dark:text-emerald-300">{Number(entity.count || 0).toLocaleString("en-KE")} rows</span></div>)}
          </div>
          {(preview.warnings || []).length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100"><p className="flex items-center gap-2 font-bold"><AlertCircle size={16} />Some rows/files were skipped or need attention</p><ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5">{preview.warnings.slice(0,12).map((warning,index)=><li key={`${index}-${warning}`}>{warning}</li>)}</ul></div>}
          {preview.entities?.some((entity) => ["assignments", "timetables", "timetable_entries", "lessons"].includes(entity.entity_type)) && <p className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-950 dark:bg-blue-950/30 dark:text-blue-100">Reference check: legacy teacher/user IDs do not automatically become RevelaCode account IDs. Invite staff in Manage Staff and review teacher references before relying on migrated lessons, assignments or timetables.</p>}
          <div className="flex flex-wrap gap-2">
            {!job && <button type="button" onClick={() => void handleStart()} disabled={running || isComplete} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">{running ? <Loader size={17} className="animate-spin" /> : <Database size={17} />} {running ? "Migrating records…" : "Start import into Elimu"}</button>}
            {job && !isComplete && <button type="button" onClick={() => void (needsRetry ? handleRetry() : handleStart())} disabled={running} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">{running ? <Loader size={17} className="animate-spin" /> : needsRetry ? <RefreshCw size={17} /> : <Database size={17} />} {running ? "Migrating records…" : needsRetry ? "Retry failed batch / continue" : "Continue migration"}</button>}
            {job && <button type="button" onClick={() => void handleRefreshStatus()} disabled={running} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"><RefreshCw size={15} /> Refresh status</button>}
          </div>
        </div>}

        {active && (job || isComplete) && <div className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-base font-extrabold text-slate-950 dark:text-white">Migration progress</h3><p className="mt-1 text-xs text-slate-500">{completedBatches.toLocaleString("en-KE")} of {totalBatches.toLocaleString("en-KE")} batches completed</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${isComplete ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : needsRetry ? "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200" : "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200"}`}>{humanize(active.status || "previewed")}</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${percent}%` }} /></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[{label:"Records processed",value:active.processed_records},{label:"Created",value:active.created_records},{label:"Updated / merged",value:active.updated_records},{label:"Conflicts",value:active.conflict_records},{label:"Record errors",value:active.error_records},{label:"Failed batches",value:active.failed_batches},{label:"Successful records",value:active.successful_records},{label:"Status updated",value:displayTime(active.updated_at)}].map((item) => <div key={item.label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="text-xs text-slate-500">{item.label}</p><p className="mt-1 break-words text-base font-extrabold text-slate-950 dark:text-white">{typeof item.value === "number" ? item.value.toLocaleString("en-KE") : (item.value || "—")}</p></div>)}
          </div>
          {active.last_error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">{active.last_error}</p>}
          {isComplete && <p className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300"><CheckCircle2 size={17} />Import batches have completed. Resolve any manual Sync conflicts from the Synchronization workspace.</p>}
          <p className="text-xs leading-5 text-slate-500">The preview expires after four hours. Completed batches are checkpointed; rerunning a failed request uses the same Elimu reconciliation engine. Existing cloud records are not automatically deleted, and conflicting edits remain visible for manual resolution.</p>
        </div>}

        <div className="flex items-start gap-2 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500 dark:border-slate-800"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" /><p>Imports are authorized against the signed-in user's active school. A school_id in the legacy file is never used to choose the destination. Staff permissions and user-account links are not read from imported records.</p></div>
      </div>
    </section>
  );
}
