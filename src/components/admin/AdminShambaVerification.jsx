import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Leaf, MapPin, Phone, RefreshCw, Search, ShieldCheck, Sprout, User, XCircle } from "lucide-react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

function idOf(item) {
  const id = item && (item.id || item._id || item.farmer_id);
  return id === undefined || id === null ? "" : String(id);
}

function valueOf(item, key) {
  const value = item?.[key];
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return value === undefined || value === null || String(value).trim() === "" ? "Not supplied" : String(value);
}

function statusOf(item) {
  return String(item?.verification_status || item?.status || "pending").toLowerCase();
}

function formatDate(value) {
  if (!value) return "Date not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function statusClass(status) {
  if (["approved", "verified"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200";
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200";
  if (status === "more_info") return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200";
  return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200";
}

const REQUIRED_FIELDS = ["farmer_name", "phone", "county", "town", "farming_type"];

export default function AdminShambaVerification() {
  const { getFarmerVerificationQueue, reviewFarmerProfile } = useJumuiyaApi();
  const [profiles, setProfiles] = useState([]);
  const [expandedId, setExpandedId] = useState("");
  const [notes, setNotes] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadQueue = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setLoadError("");
    try {
      const result = await getFarmerVerificationQueue();
      const rows = Array.isArray(result?.items)
        ? result.items
        : Array.isArray(result?.data?.items)
          ? result.data.items
          : Array.isArray(result) ? result : [];
      const valid = rows.filter((item) => idOf(item));
      setProfiles(valid);
      setExpandedId((current) => valid.some((item) => idOf(item) === current) ? current : idOf(valid[0]));
    } catch (error) {
      if (!silent) setProfiles([]);
      setLoadError(error?.message || "Could not load Shamba verification requests. Check administrator access and retry.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [getFarmerVerificationQueue]);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return profiles;
    return profiles.filter((item) => [
      item.farmer_name, item.phone, item.county, item.town, item.farm_name,
      item.farming_type, ...(Array.isArray(item.primary_crops) ? item.primary_crops : []),
    ].filter(Boolean).join(" ").toLowerCase().includes(needle));
  }, [profiles, search]);

  const pendingCount = profiles.filter((item) => ["pending", "submitted"].includes(statusOf(item))).length;
  const moreInfoCount = profiles.filter((item) => statusOf(item) === "more_info").length;

  const decide = async (profile, decision) => {
    const id = idOf(profile);
    const reviewNotes = String(notes[id] || "").trim();
    const complete = REQUIRED_FIELDS.every((key) => String(profile?.[key] ?? "").trim());

    setReviewError("");
    setNotice("");

    if (decision === "approved" && !complete) {
      setExpandedId(id);
      setReviewError("This profile is missing required details. Ask the farmer to complete the name, phone, county, town and farming type before approval.");
      return;
    }
    if (decision !== "approved" && !reviewNotes) {
      setExpandedId(id);
      setReviewError("Add a short review note before requesting information or rejecting this profile.");
      return;
    }

    setBusyId(id);
    try {
      const result = await reviewFarmerProfile(id, {
        decision,
        review_notes: reviewNotes,
      });
      const messages = {
        approved: "Farmer profile verified. Farm registration is now unlocked for the owner.",
        more_info: "The profile has been returned to the farmer for corrections.",
        rejected: "The farmer profile has been rejected.",
      };
      setNotice(result?.message || messages[decision]);
      setNotes((current) => ({ ...current, [id]: "" }));
      await loadQueue({ silent: true });
    } catch (error) {
      setReviewError(error?.message || "The verification decision could not be saved. Please retry.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"><Sprout size={22} /></span>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Shamba profile verification</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Check a farmer's details and approve the profile to unlock farm registration.</p>
          </div>
        </div>
        <button type="button" onClick={() => loadQueue()} disabled={loading} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Awaiting review</p><p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{loading ? "—" : profiles.length}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Pending</p><p className="mt-1 text-2xl font-black text-blue-700 dark:text-blue-300">{loading ? "—" : pendingCount}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Returned for details</p><p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">{loading ? "—" : moreInfoCount}</p></div>
      </section>

      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">{notice}</div>}
      {reviewError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100">{reviewError}</div>}
      {loadError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100">{loadError}<button type="button" onClick={() => loadQueue()} className="ml-3 font-bold underline">Retry</button></div>}

      <label className="relative block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find farmer by name, phone, county or crop" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
      </label>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div>
      ) : filtered.length ? (
        <div className="space-y-3">
          {filtered.map((profile) => {
            const id = idOf(profile);
            const status = statusOf(profile);
            const expanded = expandedId === id;
            const complete = REQUIRED_FIELDS.every((key) => String(profile?.[key] ?? "").trim());
            return (
              <article key={id} className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <button type="button" onClick={() => setExpandedId(expanded ? "" : id)} aria-expanded={expanded} className="flex min-h-16 w-full items-center justify-between gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold text-slate-900 dark:text-white">{valueOf(profile, "farmer_name")}</span>
                    <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">{[profile.town, profile.county].filter(Boolean).join(", ") || "Location not supplied"} · {formatDate(profile.verification_submitted_at || profile.created_at)}</span>
                  </span>
                  <span className={"shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-extrabold " + statusClass(status)}>{status.replace(/[_-]+/g, " ")}</span>
                </button>

                {expanded && (
                  <div className="space-y-4 border-t border-slate-200 p-4 dark:border-slate-800">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <p className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"><User size={15} className="text-slate-400" /> {valueOf(profile, "farmer_name")}</p>
                      <p className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"><Phone size={15} className="text-slate-400" /> {valueOf(profile, "phone")}</p>
                      <p className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"><MapPin size={15} className="text-slate-400" /> {[profile.town, profile.county, profile.village].filter(Boolean).join(", ") || valueOf(profile, "location")}</p>
                      <p className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"><Sprout size={15} className="text-slate-400" /> {valueOf(profile, "farming_type")}</p>
                      <p className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"><Leaf size={15} className="text-slate-400" /> Farm: {valueOf(profile, "farm_name")}</p>
                      <p className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"><Leaf size={15} className="text-slate-400" /> Crops: {valueOf(profile, "primary_crops")}</p>
                    </div>

                    <div className={complete ? "rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100" : "rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"}>
                      {complete ? "Required profile details are present. Confirm the submitted information before approval." : "Missing required details: farmer name, phone, county, town or farming type. Approval is blocked until the farmer updates the profile."}
                    </div>

                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                      Review note <span className="font-normal text-slate-500">(required only for request information or reject)</span>
                      <textarea value={notes[id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [id]: event.target.value }))} maxLength={800} rows={2} placeholder="Tell the farmer what needs correction..." className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                    </label>

                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => decide(profile, "approved")} disabled={Boolean(busyId) || !complete} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
                        <CheckCircle2 size={15} /> {busyId === id ? "Saving…" : "Verify profile"}
                      </button>
                      <button type="button" onClick={() => decide(profile, "more_info")} disabled={Boolean(busyId) || !String(notes[id] || "").trim()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-300 px-3.5 py-2 text-xs font-extrabold text-amber-800 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-900/60 dark:text-amber-200 dark:hover:bg-amber-950/30">Request information</button>
                      <button type="button" onClick={() => decide(profile, "rejected")} disabled={Boolean(busyId) || !String(notes[id] || "").trim()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-300 px-3.5 py-2 text-xs font-extrabold text-rose-800 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/60 dark:text-rose-200 dark:hover:bg-rose-950/30"><XCircle size={15} /> Reject</button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <ShieldCheck size={28} className="mx-auto text-emerald-600 dark:text-emerald-300" />
          <h3 className="mt-3 text-sm font-extrabold text-slate-900 dark:text-white">{search ? "No matching farmers" : "No profiles awaiting review"}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{search ? "Try a different search." : "New farmer submissions will appear here automatically after refresh."}</p>
        </div>
      )}
    </div>
  );
}
