import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, RefreshCw, Users } from "lucide-react";

function unwrap(value) {
  let current = value;
  for (let index = 0; index < 5; index += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return current;
    if (Object.prototype.hasOwnProperty.call(current, "data")) { current = current.data; continue; }
    if (Object.prototype.hasOwnProperty.call(current, "result")) { current = current.result; continue; }
    return current;
  }
  return current;
}

function parentsFrom(value) {
  const data = unwrap(value);
  if (Array.isArray(data)) return data;
  for (const key of ["parents", "items", "records", "results"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

export default function ElimuParentDirectory({ api }) {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (typeof api?.getElimuParentDirectory !== "function") {
      setParents([]);
      setError("The parent directory API method is not configured.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.getElimuParentDirectory();
      setParents(parentsFrom(response));
    } catch (requestError) {
      setParents([]);
      setError(requestError?.message || "Parent directory could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  return <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><Users size={19}/></span><div><h2 className="text-base font-bold text-slate-950 dark:text-white">Parent directory</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Verified parent-portal links only. Student and portal duration details follow each linked learner's enrolment duration; parents without a verified link are not exposed here.</p></div></div>
      <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/>Refresh</button>
    </div>

    {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"><AlertCircle size={15} className="mr-1 inline"/>{error}</p>}

    {loading && !parents.length ? <div className="py-8 text-center text-sm text-slate-500"><RefreshCw size={16} className="mx-auto mb-2 animate-spin"/>Loading verified parent links…</div> : parents.length ? (
      <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-full divide-y divide-slate-200 text-left dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-900"><tr>{["ID", "Contact", "Students", "Portal duration"].map((label) => <th key={label} className="whitespace-nowrap px-3 py-3 text-[10px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-950">
            {parents.map((parent, index) => {
              const id = String(parent.id || parent.parent_id || parent.user_id || "");
              const students = Array.isArray(parent.students) ? parent.students : [];
              const studentLabel = parent.students_label || students.map((student) => [student.name || student.admission_number, student.class_name, student.stream].filter(Boolean).join(" · ")).join(", ");
              return <tr key={id || index} className="align-top hover:bg-slate-50/70 dark:hover:bg-slate-900/60">
                <td className="max-w-[200px] px-3 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200"><span className="block break-all">{id || "—"}</span><span className="mt-1 block text-slate-500">{parent.relationships || ""}</span></td>
                <td className="max-w-[260px] px-3 py-3 text-xs text-slate-700 dark:text-slate-300"><span className="block break-words">{parent.contact || parent.email || parent.phone || "Contact not provided"}</span></td>
                <td className="max-w-[360px] px-3 py-3 text-xs text-slate-700 dark:text-slate-300"><span className="block whitespace-normal">{studentLabel || "No linked students"}</span><span className="mt-1 block text-slate-500">{parent.student_count ?? students.length} linked student{Number(parent.student_count ?? students.length) === 1 ? "" : "s"}</span></td>
                <td className="min-w-[220px] max-w-[360px] px-3 py-3 text-xs leading-5 text-slate-600 dark:text-slate-300"><span className="block whitespace-pre-wrap">{parent.portal_duration || "Follows each student's enrolment duration"}</span>{parent.portal_expires_at && <span className="mt-1 block text-slate-500">Earliest end date: {String(parent.portal_expires_at).slice(0, 10)}</span>}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    ) : !error ? <div className="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400"><Users size={20} className="mx-auto mb-2 text-slate-300"/>No verified parent-portal links for this school yet.</div> : null}
  </section>;
}
