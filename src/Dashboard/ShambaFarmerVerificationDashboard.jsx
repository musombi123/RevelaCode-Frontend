import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, RefreshCw, ShieldCheck, UserRound, XCircle } from "lucide-react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function FarmerReviewCard({ item, busy, note, onNoteChange, onReview }) {
  const id = item.id || item._id;
  const crops = Array.isArray(item.primary_crops) ? item.primary_crops : [];
  const livestock = Array.isArray(item.livestock) ? item.livestock : [];

  return (
    <article className="rounded-2xl border border-[#DCE5E1] bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#087F5B] dark:bg-emerald-950/40 dark:text-emerald-300">
            <UserRound size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="break-words text-base font-black text-slate-900 dark:text-white">{item.farmer_name || "Unnamed farmer"}</h2>
            <p className="mt-1 break-words text-[13px] text-slate-500 dark:text-slate-400">{item.phone || "No phone supplied"} · {[item.town, item.county].filter(Boolean).join(", ") || "Location not supplied"}</p>
            <p className="mt-1 text-[12px] text-slate-400">Submitted {formatDate(item.verification_submitted_at || item.created_at)}</p>
          </div>
        </div>
        <span className="w-fit shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          {item.verification_status || "pending"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3 text-[13px] dark:bg-slate-900 sm:grid-cols-2">
        <div><p className="font-bold text-slate-500">Farming type</p><p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{item.farming_type || "Not supplied"}</p></div>
        <div><p className="font-bold text-slate-500">Experience</p><p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{Number(item.experience_years || 0)} years</p></div>
        <div><p className="font-bold text-slate-500">Main crops</p><p className="mt-1 text-slate-700 dark:text-slate-300">{crops.length ? crops.join(", ") : "Not supplied"}</p></div>
        <div><p className="font-bold text-slate-500">Livestock</p><p className="mt-1 text-slate-700 dark:text-slate-300">{livestock.length ? livestock.join(", ") : "Not supplied"}</p></div>
      </div>

      {item.description && <p className="mt-3 whitespace-pre-wrap text-[13px] leading-5 text-slate-600 dark:text-slate-300">{item.description}</p>}

      <div className="mt-4">
        <label htmlFor={`review-note-${id}`} className="text-[12px] font-black uppercase tracking-wide text-slate-500">Review note (required for rejection or more information)</label>
        <textarea id={`review-note-${id}`} value={note} onChange={(event) => onNoteChange(id, event.target.value)} rows={2} maxLength={800} placeholder="Explain the decision and what needs to change…" className="mt-1.5 w-full resize-y rounded-xl border border-[#DCE5E1] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
        <button type="button" disabled={busy} onClick={() => onReview(item, "more_info")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-amber-200 px-3 py-2 text-[13px] font-black text-amber-800 transition hover:bg-amber-50 disabled:opacity-50 dark:border-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-950/30">Request more information</button>
        <button type="button" disabled={busy} onClick={() => onReview(item, "rejected")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-[13px] font-black text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30"><XCircle size={15} /> Reject</button>
        <button type="button" disabled={busy} onClick={() => onReview(item, "approved")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#087F5B] px-4 py-2 text-[13px] font-black text-white transition hover:bg-[#075E46] disabled:cursor-not-allowed disabled:opacity-50"><CheckCircle2 size={15} /> Approve profile</button>
      </div>
    </article>
  );
}

export default function ShambaFarmerVerificationDashboard() {
  const { getFarmerVerificationQueue, reviewFarmerProfile } = useJumuiyaApi();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [notes, setNotes] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadQueue = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError("");
      const result = await getFarmerVerificationQueue();
      const queue = Array.isArray(result) ? result : result?.items || [];
      setItems(queue);
    } catch (err) {
      setError(err?.message || "Unable to load the farmer verification queue.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getFarmerVerificationQueue]);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const updateNote = useCallback((id, value) => {
    setNotes((current) => ({ ...current, [id]: value }));
  }, []);

  const handleReview = useCallback(async (item, decision) => {
    const id = item.id || item._id;
    const reviewNote = String(notes[id] || "").trim();
    if (["rejected", "more_info"].includes(decision) && !reviewNote) {
      setError("Add a clear review note before rejecting a profile or requesting more information.");
      return;
    }

    try {
      setBusyId(String(id));
      setError("");
      setMessage("");
      await reviewFarmerProfile(id, { decision, review_notes: reviewNote });
      setMessage(`${item.farmer_name || "Farmer"}: profile marked ${decision.replace("_", " ")}.`);
      await loadQueue({ silent: true });
    } catch (err) {
      setError(err?.message || "Unable to save the review decision.");
    } finally {
      setBusyId("");
    }
  }, [loadQueue, notes, reviewFarmerProfile]);

  return (
    <div className="mx-auto w-full max-w-6xl px-3 pb-24 sm:px-5 lg:px-7">
      <section className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-[#063D2E] via-[#087F5B] to-[#0D9469] p-5 text-white shadow-lg sm:p-7">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15"><ShieldCheck size={21} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100">Admin workspace</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Farmer verification</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-5 text-emerald-50">Review Shamba farmer profiles before allowing farm registration. Profile approval is separate from farm-rights verification and is not a land-title certification.</p>
          </div>
          <button type="button" aria-label="Refresh queue" title="Refresh queue" onClick={() => loadQueue({ silent: true })} disabled={loading || refreshing} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 disabled:opacity-50"><RefreshCw size={17} className={refreshing ? "animate-spin" : ""} /></button>
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/15 bg-black/10 px-4 py-3">
          <Clock3 size={18} className="shrink-0 text-emerald-100" />
          <div><p className="text-xl font-black tabular-nums">{items.length}</p><p className="text-[12px] text-emerald-100">Profiles awaiting a decision or additional details</p></div>
        </div>
      </section>

      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">{error}</div>}
      {message && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] leading-5 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">{message}</div>}

      {loading ? (
        <div className="grid gap-3 lg:grid-cols-2">{[1, 2].map((key) => <div key={key} className="h-72 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />)}</div>
      ) : items.length ? (
        <div className="grid gap-3 lg:grid-cols-2">{items.map((item) => {
          const id = item.id || item._id;
          return <FarmerReviewCard key={id} item={item} busy={busyId === String(id)} note={notes[id] || ""} onNoteChange={updateNote} onReview={handleReview} />;
        })}</div>
      ) : (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-white px-5 py-14 text-center dark:border-emerald-900/50 dark:bg-slate-950">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#087F5B] dark:bg-emerald-950/40 dark:text-emerald-300"><CheckCircle2 size={25} /></div>
          <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">Queue is clear</h2>
          <p className="mx-auto mt-1 max-w-md text-[13px] leading-5 text-slate-500 dark:text-slate-400">There are no farmer profiles awaiting review right now. New profile submissions will appear here.</p>
        </div>
      )}
    </div>
  );
}
