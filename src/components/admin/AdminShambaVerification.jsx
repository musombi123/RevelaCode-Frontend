import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Leaf,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Sprout,
  User,
  XCircle,
} from "lucide-react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

function idOf(item) {
  const id = item && (item.id || item._id || item.farmer_id);
  return id === undefined || id === null ? "" : String(id);
}

function textOf(item, ...keys) {
  for (const key of keys) {
    const value = item && item[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return "";
}

function labelStatus(item) {
  const status = textOf(item, "verification_status", "status").toLowerCase() || "pending";
  const labels = {
    pending: "Pending review",
    more_info: "More information needed",
    approved: "Approved",
    verified: "Verified",
    rejected: "Rejected",
  };
  return labels[status] || status.replace(/[_-]+/g, " ");
}

function statusTone(item) {
  const status = textOf(item, "verification_status", "status").toLowerCase();
  if (["approved", "verified"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200";
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200";
  if (status === "more_info") return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200";
  return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200";
}

function dateText(value) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function Notice({ type = "error", children }) {
  const success = type === "success";
  return (
    <div role={success ? "status" : "alert"} className={"flex min-w-0 items-start gap-3 rounded-xl border px-4 py-3 text-sm " + (success
      ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"
      : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100")}>
      {success ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-200">{value || "Not supplied"}</p>
      </div>
    </div>
  );
}

export default function AdminShambaVerification() {
  const api = useJumuiyaApi();
  const [applications, setApplications] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [notice, setNotice] = useState(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState("");

  const loadQueue = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setLoadError("");
    try {
      const result = await api.getFarmerVerificationQueue();
      const rows = Array.isArray(result?.items)
        ? result.items
        : Array.isArray(result?.data?.items)
          ? result.data.items
          : Array.isArray(result)
            ? result
            : [];
      const valid = rows.filter((item) => idOf(item));
      setApplications(valid);
      setSelectedId((current) => valid.some((item) => idOf(item) === current) ? current : idOf(valid[0]));
    } catch (error) {
      if (!silent) setApplications([]);
      setLoadError(error?.message || "Shamba farmer profiles could not be loaded. Check administrator access and retry.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [api]);

  useEffect(() => { loadQueue(); }, [loadQueue]);
  useEffect(() => {
    setNotes("");
    setReviewError("");
  }, [selectedId]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return applications.filter((item) => {
      const status = textOf(item, "verification_status", "status").toLowerCase() || "pending";
      if (statusFilter !== "all" && statusFilter !== status) return false;
      if (!needle) return true;
      return [
        item.farmer_name, item.phone, item.county, item.town, item.location,
        item.farm_name, item.farming_type, item.owner_user_id, item.user_id, item.id,
        ...(Array.isArray(item.primary_crops) ? item.primary_crops : []),
      ].filter(Boolean).join(" ").toLowerCase().includes(needle);
    });
  }, [applications, search, statusFilter]);

  const selected = useMemo(() => applications.find((item) => idOf(item) === selectedId) || null, [applications, selectedId]);
  const pendingCount = applications.filter((item) => ["pending", "submitted"].includes(textOf(item, "verification_status").toLowerCase())).length;
  const moreInfoCount = applications.filter((item) => textOf(item, "verification_status").toLowerCase() === "more_info").length;
  const completeForApproval = Boolean(selected && ["farmer_name", "phone", "county", "town", "farming_type"].every((key) => textOf(selected, key)));

  const submitDecision = async (decision) => {
    if (!selected) {
      setReviewError("Select a farmer profile to review.");
      return;
    }
    if (!["approved", "rejected", "more_info"].includes(decision)) {
      setReviewError("Select a valid verification decision.");
      return;
    }
    if (decision === "approved" && !completeForApproval) {
      setReviewError("This profile is incomplete. A farmer name, phone, county, town and farming type are required before approval.");
      return;
    }
    if (decision !== "approved" && !notes.trim()) {
      setReviewError("Add review notes to explain why the profile is rejected or requires more information.");
      return;
    }

    setSubmitting(decision);
    setReviewError("");
    setNotice(null);
    try {
      const result = await api.reviewFarmerProfile(idOf(selected), {
        decision,
        review_notes: notes.trim(),
      });
      const messages = {
        approved: "Farmer profile verified. The owner can now proceed to farm registration.",
        rejected: "Farmer profile rejected.",
        more_info: "The profile was returned for more information.",
      };
      setNotice({ type: "success", message: result?.message || messages[decision] });
      await loadQueue({ silent: true });
    } catch (error) {
      setReviewError(error?.message || "The verification decision could not be saved. Retry when the connection is available.");
    } finally {
      setSubmitting("");
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"><Sprout size={24} /></span>
            <div className="min-w-0">
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Shamba farmer verification</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Review submitted farmer profiles before farm registration is unlocked. Approval is a platform review, not government proof of land ownership.
              </p>
            </div>
          </div>
          <button type="button" onClick={() => loadQueue()} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh queue
          </button>
        </div>
      </section>

      {notice ? <Notice type={notice.type}>{notice.message}</Notice> : null}
      {loadError ? <Notice><p>{loadError}</p><button type="button" onClick={() => loadQueue()} className="mt-2 min-h-10 rounded-lg border border-current/30 px-3 font-bold">Retry</button></Notice> : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">Profiles in queue</p><p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{loading ? "—" : applications.length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">Waiting for review</p><p className="mt-2 text-3xl font-black text-blue-700 dark:text-blue-300">{loading ? "—" : pendingCount}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">Need more information</p><p className="mt-2 text-3xl font-black text-amber-700 dark:text-amber-300">{loading ? "—" : moreInfoCount}</p></div>
      </section>

      {reviewError ? <Notice><p>{reviewError}</p></Notice> : null}

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(280px,0.88fr)_minmax(0,1.4fr)]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-3 border-b border-slate-200 p-4 dark:border-slate-800">
            <label className="relative block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search farmer, county, crop..." className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </label>
            <div className="flex flex-wrap gap-2">
              {[["all","All queued"],["pending","Pending"],["more_info","More information"]].map(([value,label]) => <button key={value} type="button" onClick={() => setStatusFilter(value)} className={"min-h-9 rounded-lg border px-3 text-xs font-bold " + (statusFilter === value ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800")}>{label}</button>)}
            </div>
          </div>
          {loading ? <div className="space-y-3 p-4">{[1,2,3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div>
            : filtered.length ? <div className="max-h-[720px] space-y-2 overflow-y-auto p-3">{filtered.map((item) => {
              const id = idOf(item);
              const name = textOf(item, "farmer_name") || "Farmer name not supplied";
              return <button key={id} type="button" onClick={() => setSelectedId(id)} aria-pressed={selectedId === id} className={"w-full min-w-0 rounded-xl border p-3 text-left transition " + (selectedId === id ? "border-emerald-400 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30" : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70")}>
                <div className="flex min-w-0 items-start justify-between gap-2"><span className="min-w-0 break-words text-sm font-extrabold text-slate-900 dark:text-white">{name}</span><span className={"shrink-0 rounded-full border px-2 py-1 text-[10px] font-extrabold " + statusTone(item)}>{labelStatus(item)}</span></div>
                <p className="mt-1 break-words text-xs text-slate-600 dark:text-slate-300">{[item.county, item.town].filter(Boolean).join(", ") || "Location not supplied"}</p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{textOf(item, "farming_type") || "Farming type not specified"} · {dateText(item.verification_submitted_at || item.created_at)}</p>
              </button>;
            })}</div>
            : <div className="p-8 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><Leaf size={20} /></span><h3 className="mt-3 text-sm font-extrabold text-slate-900 dark:text-white">No profiles in this view</h3><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Try another status filter or refresh the queue.</p></div>}
        </div>

        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          {!selected ? <div className="grid min-h-72 place-items-center text-center"><div><ShieldCheck size={28} className="mx-auto text-slate-400" /><p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">Select a farmer profile to review</p></div></div> : (
            <div className="space-y-5">
              <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Farmer application</p>
                  <h3 className="mt-1 break-words text-xl font-black text-slate-900 dark:text-white">{textOf(selected, "farmer_name") || "Unnamed farmer"}</h3>
                  <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">Profile ID: {idOf(selected)}</p>
                </div>
                <span className={"inline-flex max-w-full items-center gap-1.5 self-start rounded-full border px-3 py-1.5 text-xs font-extrabold " + statusTone(selected)}><Clock3 size={13} /> {labelStatus(selected)}</span>
              </header>

              <div className="grid gap-4 sm:grid-cols-2">
                <Detail icon={User} label="Farmer name" value={selected.farmer_name} />
                <Detail icon={Phone} label="Phone" value={selected.phone} />
                <Detail icon={MapPin} label="Location" value={[selected.town, selected.county, selected.village].filter(Boolean).join(", ") || selected.location} />
                <Detail icon={Sprout} label="Farming type" value={selected.farming_type} />
                <Detail icon={Leaf} label="Farm name" value={selected.farm_name} />
                <Detail icon={Leaf} label="Experience" value={selected.experience_years === undefined ? "" : String(selected.experience_years) + " years"} />
                <Detail icon={Sprout} label="Primary crops" value={Array.isArray(selected.primary_crops) ? selected.primary_crops.join(", ") : selected.primary_crops} />
                <Detail icon={Sprout} label="Livestock" value={Array.isArray(selected.livestock) ? selected.livestock.join(", ") : selected.livestock} />
                <Detail icon={MapPin} label="Farm size" value={selected.farm_size === undefined || selected.farm_size === null ? "" : String(selected.farm_size) + " " + (selected.farm_size_unit || "acres")} />
                <Detail icon={MapPin} label="Water source" value={selected.water_source} />
              </div>

              {selected.description ? <div className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:bg-slate-950 dark:text-slate-200"><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">Description</p><p className="mt-1 break-words">{selected.description}</p></div> : null}

              <div className={"rounded-xl border p-3 text-sm " + (completeForApproval ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100" : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100")}>
                <p className="font-extrabold">{completeForApproval ? "Required fields present" : "Incomplete profile"}</p>
                <p className="mt-1 text-xs leading-5">{completeForApproval ? "Required identity and location fields are present. Confirm submitted details before approving." : "Approval is blocked until farmer name, phone, county, town and farming type are present."}</p>
              </div>

              <div>
                <label htmlFor="shamba-review-notes" className="mb-1.5 block text-xs font-extrabold text-slate-800 dark:text-slate-200">Review notes</label>
                <textarea id="shamba-review-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={800} rows={3} placeholder="Explain what was checked or what needs to be corrected..." className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                <p className="mt-1 text-right text-[10px] text-slate-500 dark:text-slate-400">{notes.length}/800 characters</p>
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:flex-wrap">
                <button type="button" onClick={() => submitDecision("approved")} disabled={Boolean(submitting) || !completeForApproval} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"><CheckCircle2 size={16} /> {submitting === "approved" ? "Approving..." : "Approve profile"}</button>
                <button type="button" onClick={() => submitDecision("more_info")} disabled={Boolean(submitting) || !notes.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-extrabold text-amber-800 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-900/60 dark:text-amber-200 dark:hover:bg-amber-950/30">{submitting === "more_info" ? "Saving..." : "Request information"}</button>
                <button type="button" onClick={() => submitDecision("rejected")} disabled={Boolean(submitting) || !notes.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-300 px-4 py-2.5 text-sm font-extrabold text-rose-800 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/60 dark:text-rose-200 dark:hover:bg-rose-950/30"><XCircle size={16} /> {submitting === "rejected" ? "Rejecting..." : "Reject profile"}</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
