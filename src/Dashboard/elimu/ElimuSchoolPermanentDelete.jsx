import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { useElimuApi } from "@/services/elimuApi.jsx";

function unwrap(value) {
  let current = value;
  for (let i = 0; i < 6; i += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return current;
    if (current.success === false || current.ok === false) {
      throw new Error(current.message || current.error?.message || current.error || "The deletion request failed.");
    }
    if (Object.prototype.hasOwnProperty.call(current, "data")) { current = current.data; continue; }
    if (Object.prototype.hasOwnProperty.call(current, "result")) { current = current.result; continue; }
    return current;
  }
  return current;
}

function errorMessage(error) {
  return error?.payload?.message || error?.payload?.error?.message || error?.message || "The school could not be deleted.";
}

export default function ElimuSchoolPermanentDelete({ school, onDeleted }) {
  const api = useElimuApi();
  const schoolName = String(school?.name || school?.school_name || school?.institution_name || "").trim();
  const [typedName, setTypedName] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const nameMatches = useMemo(
    () => Boolean(schoolName && typedName.trim() === schoolName),
    [schoolName, typedName],
  );

  const permanentlyDelete = async (event) => {
    event.preventDefault();
    setError("");
    if (!nameMatches || !acknowledged) {
      setError("Type the exact school name and confirm the permanent-deletion warning.");
      return;
    }
    const confirmed = typeof window !== "undefined" && window.confirm(
      "FINAL CONFIRMATION\n\nPermanently delete \"" + schoolName + "\" and the school-scoped data stored in the Elimu/Jumuiya database?\n\nThis action cannot be undone. School staff will lose access."
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      if (typeof api.deleteSchoolPermanently !== "function") {
        throw new Error("The permanent school deletion endpoint is not configured in the Elimu API client.");
      }
      const response = await api.deleteSchoolPermanently({
        school_name_confirmation: typedName.trim(),
        confirm_permanent_deletion: true,
      });
      setResult(unwrap(response) || {});
      setTypedName("");
      setAcknowledged(false);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setDeleting(false);
    }
  };

  if (result) {
    const data = result?.data || result;
    const count = Number(data.deleted_documents || 0);
    const collections = data.deleted_collections && typeof data.deleted_collections === "object"
      ? Object.entries(data.deleted_collections).filter(([, value]) => Number(value) > 0)
      : [];
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/70 dark:bg-emerald-950/30 sm:p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300" />
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-emerald-950 dark:text-emerald-100">School permanently deleted</h2>
            <p className="mt-1 text-sm leading-6 text-emerald-900 dark:text-emerald-200">
              {data.school_name || schoolName} has been deleted from the school database, including {count.toLocaleString()} school-scoped records across {collections.length.toLocaleString()} collections.
            </p>
            {collections.length > 0 && <details className="mt-3"><summary className="cursor-pointer text-xs font-bold text-emerald-900 dark:text-emerald-100">View deletion counts by collection</summary><ul className="mt-2 grid gap-1 text-xs text-emerald-900 dark:text-emerald-200 sm:grid-cols-2">{collections.map(([name, total]) => <li key={name} className="break-all">{name}: {Number(total).toLocaleString()}</li>)}</ul></details>}
            {Array.isArray(data.external_domain_cleanup_warnings) && data.external_domain_cleanup_warnings.length > 0 && (
              <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                Some external hosting-domain associations could not be removed automatically: {data.external_domain_cleanup_warnings.join(", ")}. Check the hosting provider separately.
              </p>
            )}
            <p className="mt-3 text-xs leading-5 text-emerald-900/90 dark:text-emerald-200/90">Files stored outside the database (for example on Cloudinary) and DNS records at the domain registrar are not database records and may require separate cleanup.</p>
            <button type="button" onClick={() => { if (typeof onDeleted === "function") onDeleted(); else if (typeof window !== "undefined") window.location.reload(); }} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-900">
              Return to Elimu access
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-rose-300 bg-white shadow-sm dark:border-rose-900/70 dark:bg-slate-950">
      <div className="flex items-start gap-3 border-b border-rose-200 bg-rose-50 p-5 dark:border-rose-900/60 dark:bg-rose-950/30 sm:p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200"><ShieldAlert size={22}/></span>
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-rose-950 dark:text-rose-100">Danger zone: permanently delete school</h2>
          <p className="mt-1 text-sm leading-6 text-rose-900 dark:text-rose-200">This removes the school profile and all school-scoped database records—including staff memberships, student and academic records, finance records, website settings, domain registry entries, inquiries, documents, media metadata, inventory, library records and school-linked Community requests. It cannot be undone.</p>
        </div>
      </div>
      <form onSubmit={permanentlyDelete} className="space-y-4 p-5 sm:p-6">
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0"/>
          <p>Only the verified School Owner can perform this action. User accounts that may be used for other RevelaCode/Jumuiya hubs will not be deleted. External file storage and DNS at third-party providers are separate from the database.</p>
        </div>
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
          Type the exact school name to unlock deletion
          <span className="mt-1 block break-words rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300">{schoolName || "No school name returned"}</span>
          <input value={typedName} onChange={(event) => setTypedName(event.target.value)} autoComplete="off" spellCheck={false} required disabled={!schoolName || deleting} className="mt-2 min-h-11 w-full rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 disabled:opacity-60 dark:border-rose-900 dark:bg-slate-900 dark:text-white" placeholder="Enter school name exactly as shown"/>
        </label>
        <label className="flex items-start gap-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
          <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} disabled={deleting} className="mt-1 h-4 w-4 shrink-0 rounded border-rose-300 text-rose-700 focus:ring-rose-500"/>
          <span>I understand that deletion is permanent, all school members lose access, and the school’s database records cannot be recovered from this application.</span>
        </label>
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{error}</p>}
        <button type="submit" disabled={deleting || !nameMatches || !acknowledged || !schoolName} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50">
          {deleting ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}
          {deleting ? "Deleting school records…" : "Permanently delete this school"}
        </button>
      </form>
    </section>
  );
}
