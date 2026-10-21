import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Send,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

const RIGHTS_BASES = [
  ["registered_owner", "Registered owner"],
  ["leaseholder", "Leaseholder"],
  ["authorized_manager", "Authorized farm manager"],
  ["community_land_user", "Community land user"],
  ["other_lawful_interest", "Other lawful interest"],
];

const EVIDENCE_TYPES = [
  ["land_register_reference", "Land register reference"],
  ["lease_reference", "Lease reference"],
  ["authority_letter_reference", "Authority letter reference"],
  ["community_land_resolution_reference", "Community land resolution reference"],
  ["other_reference", "Other lawful reference"],
];

const REPORT_CATEGORIES = [
  ["suspected_scam", "Suspected scam"],
  ["fake_or_misrepresented_product", "Fake or misrepresented product"],
  ["off_platform_payment_pressure", "Pressure to pay off-platform"],
  ["land_or_farm_misrepresentation", "Farm or land misrepresentation"],
  ["duplicate_or_stolen_media", "Duplicate or stolen images"],
  ["unsafe_agricultural_claim", "Unsafe agricultural claim"],
  ["other", "Other safety concern"],
];

const INPUT = "w-full rounded-xl border border-[#DCE5E1] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
const EMPTY_RIGHTS_FORM = {
  rights_basis: "registered_owner",
  evidence_type: "land_register_reference",
  evidence_reference: "",
  declaration: false,
  privacy_consent: false,
};

function isAdmin(user) {
  const values = [
    user?.role,
    user?.user_role,
    ...(Array.isArray(user?.roles) ? user.roles : []),
    ...(Array.isArray(user?.permissions) ? user.permissions : []),
  ].map((entry) =>
    String(typeof entry === "object" ? entry?.name || entry?.role || "" : entry)
      .trim()
      .toLowerCase()
      .replace(/[ -]+/g, "_"),
  );

  return Boolean(
    user?.is_admin ||
    user?.is_super_admin ||
    values.some((value) => ["admin", "super_admin", "superadmin"].includes(value)),
  );
}

function getId(item) {
  return item?.id || item?._id || "";
}

function prettyStatus(value) {
  return String(value || "not_submitted").replace(/_/g, " ");
}

function dateLabel(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function StatusPill({ value }) {
  const status = String(value || "not_submitted").toLowerCase();
  const style = status === "verified" || status === "actioned"
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
    : status === "pending" || status === "more_info" || status === "needs_more_info" || status === "open"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
      : status === "rejected" || status === "dismissed"
        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

  return <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${style}`}>{prettyStatus(status)}</span>;
}

function Field({ label, children, hint }) {
  return (
    <div className="min-w-0">
      <label className="text-[12px] font-black uppercase tracking-wide text-slate-500">{label}</label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-[11px] leading-4 text-slate-500">{hint}</p>}
    </div>
  );
}

function Notice({ type = "info", children }) {
  const styles = type === "error"
    ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300"
    : type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300"
      : "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200";
  return <div className={`rounded-xl border px-3 py-2.5 text-[13px] leading-5 ${styles}`}>{children}</div>;
}

function FarmRightsAdminCard({ item, busy, note, onNote, onReview }) {
  const farmId = String(item.farm_id || item.farmId || "");
  const farmerName = item.owner_name || item.farmer_name || item.owner_user_id || "Farmer account";
  return (
    <article className="rounded-xl border border-[#DCE5E1] bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words font-black text-slate-900 dark:text-white">{item.farm_name_snapshot || item.name || "Unnamed farm"}</h3>
          <p className="mt-1 break-words text-[12px] text-slate-500">{farmerName} · {[item.town_snapshot, item.county_snapshot].filter(Boolean).join(", ")}</p>
          <p className="mt-1 text-[11px] text-slate-400">Submitted {dateLabel(item.created_at)}</p>
        </div>
        <StatusPill value={item.status} />
      </div>
      <div className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3 text-[12px] dark:bg-slate-900 sm:grid-cols-2">
        <div><p className="font-bold text-slate-500">Rights basis</p><p className="mt-1 text-slate-800 dark:text-slate-200">{prettyStatus(item.rights_basis)}</p></div>
        <div><p className="font-bold text-slate-500">Evidence reference type</p><p className="mt-1 text-slate-800 dark:text-slate-200">{prettyStatus(item.evidence_type)}</p></div>
        <div className="sm:col-span-2"><p className="font-bold text-slate-500">Reference</p><p className="mt-1 break-all text-slate-800 dark:text-slate-200">{item.evidence_reference || "Not supplied"}</p></div>
      </div>
      <Field label="Decision note (required)">
        <textarea value={note} onChange={(event) => onNote(farmId, event.target.value)} maxLength={800} rows={2} className={INPUT} placeholder="Record what was checked and why this decision was made." />
      </Field>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
        <button type="button" disabled={busy} onClick={() => onReview(item, "more_info")} className="min-h-10 rounded-xl border border-amber-200 px-3 py-2 text-[12px] font-black text-amber-800 disabled:opacity-50 dark:border-amber-900/50 dark:text-amber-300">Request more information</button>
        <button type="button" disabled={busy} onClick={() => onReview(item, "rejected")} className="min-h-10 rounded-xl border border-red-200 px-3 py-2 text-[12px] font-black text-red-700 disabled:opacity-50 dark:border-red-900/50 dark:text-red-300">Reject</button>
        <button type="button" disabled={busy} onClick={() => onReview(item, "verified")} className="min-h-10 rounded-xl bg-[#087F5B] px-4 py-2 text-[12px] font-black text-white disabled:opacity-50">Mark rights reviewed</button>
      </div>
    </article>
  );
}

function SafetyReportAdminCard({ item, busy, note, onNote, onReview }) {
  const reportId = String(item.id || item._id || "");
  return (
    <article className="rounded-xl border border-[#DCE5E1] bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h3 className="break-words font-black text-slate-900 dark:text-white">Listing reference: {item.listing_id || "Not supplied"}</h3><p className="mt-1 text-[11px] text-slate-400">Reported {dateLabel(item.created_at)}</p></div>
        <StatusPill value={item.status} />
      </div>
      <p className="mt-3 text-[12px] font-black uppercase tracking-wide text-slate-500">{prettyStatus(item.category)}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-5 text-slate-700 dark:text-slate-300">{item.description}</p>
      <Field label="Moderator note (required)">
        <textarea value={note} onChange={(event) => onNote(reportId, event.target.value)} rows={2} maxLength={800} className={`${INPUT} mt-1`} placeholder="Document the moderation action." />
      </Field>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button type="button" disabled={busy} onClick={() => onReview(item, "needs_more_info")} className="min-h-10 rounded-xl border border-amber-200 px-3 py-2 text-[12px] font-black text-amber-800 disabled:opacity-50 dark:border-amber-900/50 dark:text-amber-300">Need more info</button>
        <button type="button" disabled={busy} onClick={() => onReview(item, "dismissed")} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-[12px] font-black text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300">Dismiss report</button>
        <button type="button" disabled={busy} onClick={() => onReview(item, "actioned")} className="min-h-10 rounded-xl bg-red-700 px-4 py-2 text-[12px] font-black text-white disabled:opacity-50">Action & suspend listing</button>
      </div>
    </article>
  );
}

export default function ShambaTrustDashboard() {
  const { user } = useAuth();
  const admin = isAdmin(user);
  const {
    getShambaTrustOverview,
    submitFarmRightsVerification,
    getFarmRightsVerificationQueue,
    reviewFarmRightsVerification,
    createShambaSafetyReport,
    getShambaSafetyReports,
    reviewShambaSafetyReport,
  } = useJumuiyaApi();

  const [overview, setOverview] = useState({ farms: [], farm_count: 0, verified_farm_count: 0, pending_farm_count: 0 });
  const [rightsQueue, setRightsQueue] = useState([]);
  const [safetyQueue, setSafetyQueue] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [rightsForm, setRightsForm] = useState({ ...EMPTY_RIGHTS_FORM });
  const [reportForm, setReportForm] = useState({ listing_id: "", category: "suspected_scam", description: "" });
  const [rightsNotes, setRightsNotes] = useState({});
  const [safetyNotes, setSafetyNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [submittingRights, setSubmittingRights] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");

    const overviewTask = getShambaTrustOverview();
    const rightsTask = admin ? getFarmRightsVerificationQueue() : Promise.resolve({ items: [] });
    const safetyTask = admin ? getShambaSafetyReports() : Promise.resolve({ items: [] });
    const [overviewResult, rightsResult, safetyResult] = await Promise.allSettled([overviewTask, rightsTask, safetyTask]);

    if (overviewResult.status === "fulfilled") {
      const next = overviewResult.value?.overview || overviewResult.value || {};
      const farms = Array.isArray(next.farms) ? next.farms : [];
      setOverview({ ...next, farms });
      setSelectedFarmId((current) => {
        if (farms.some((farm) => String(farm.id || farm._id) === current)) return current;
        const eligible = farms.find((farm) => !["pending", "verified"].includes(String(farm.legal_verification_status || "").toLowerCase()));
        return String(eligible?.id || eligible?._id || farms[0]?.id || farms[0]?._id || "");
      });
    } else {
      setError(overviewResult.reason?.message || "Unable to load farm-rights status.");
    }

    if (admin && rightsResult.status === "fulfilled") {
      const result = rightsResult.value;
      setRightsQueue(Array.isArray(result) ? result : result?.items || []);
    } else if (admin && rightsResult.status === "rejected") {
      setError((current) => current || rightsResult.reason?.message || "Unable to load farm-rights review queue.");
    }

    if (admin && safetyResult.status === "fulfilled") {
      const result = safetyResult.value;
      setSafetyQueue(Array.isArray(result) ? result : result?.items || []);
    } else if (admin && safetyResult.status === "rejected") {
      setError((current) => current || safetyResult.reason?.message || "Unable to load safety-report queue.");
    }

    setLoading(false);
    setRefreshing(false);
  }, [admin, getFarmRightsVerificationQueue, getShambaSafetyReports, getShambaTrustOverview]);

  useEffect(() => { loadData(); }, [loadData]);

  const farms = useMemo(() => overview.farms || [], [overview.farms]);
  const selectedFarm = farms.find((farm) => String(farm.id || farm._id) === selectedFarmId);
  const selectedRightsStatus = String(selectedFarm?.legal_verification_status || "not_submitted").toLowerCase();
  const canSubmitRights = Boolean(selectedFarm) && !["pending", "verified"].includes(selectedRightsStatus);

  const updateRights = (field, value) => {
    setRightsForm((current) => ({ ...current, [field]: value }));
    setError("");
    setMessage("");
  };

  const handleSubmitRights = useCallback(async (event) => {
    event.preventDefault();
    if (!selectedFarmId) {
      setError("Add a farm after your farmer profile is approved before submitting farm-rights references.");
      return;
    }
    if (!rightsForm.evidence_reference.trim()) {
      setError("Enter a land, lease or authorization reference; do not enter national ID or passport numbers.");
      return;
    }
    if (!rightsForm.declaration || !rightsForm.privacy_consent) {
      setError("Confirm your authority to manage the farm and consent to processing the verification reference.");
      return;
    }
    try {
      setSubmittingRights(true);
      setError("");
      setMessage("");
      await submitFarmRightsVerification(selectedFarmId, rightsForm);
      setMessage("Farm-rights reference submitted for manual review. This is not government title certification.");
      setRightsForm({ ...EMPTY_RIGHTS_FORM });
      await loadData({ silent: true });
    } catch (err) {
      setError(err?.message || "Unable to submit the farm-rights reference.");
    } finally {
      setSubmittingRights(false);
    }
  }, [loadData, rightsForm, selectedFarmId, submitFarmRightsVerification]);

  const handleSafetyReport = useCallback(async (event) => {
    event.preventDefault();
    if (!reportForm.listing_id.trim() || !reportForm.description.trim()) {
      setError("Enter the listing reference and describe the safety concern.");
      return;
    }
    try {
      setSubmittingReport(true);
      setError("");
      setMessage("");
      const result = await createShambaSafetyReport({
        listing_id: reportForm.listing_id.trim(),
        category: reportForm.category,
        description: reportForm.description.trim(),
      });
      setMessage(result?.message || "Safety report submitted for human review.");
      setReportForm({ listing_id: "", category: "suspected_scam", description: "" });
      await loadData({ silent: true });
    } catch (err) {
      setError(err?.message || "Unable to submit the safety report.");
    } finally {
      setSubmittingReport(false);
    }
  }, [createShambaSafetyReport, loadData, reportForm]);

  const handleRightsReview = useCallback(async (item, decision) => {
    const farmId = String(item.farm_id || item.farmId || "");
    const note = String(rightsNotes[farmId] || "").trim();
    if (!note) {
      setError("Add a review note before saving the farm-rights decision.");
      return;
    }
    try {
      setBusyKey(`farm:${farmId}`);
      setError("");
      setMessage("");
      await reviewFarmRightsVerification(farmId, { decision, review_notes: note });
      setMessage(`Farm rights marked ${prettyStatus(decision)}.`);
      await loadData({ silent: true });
    } catch (err) {
      setError(err?.message || "Unable to save the farm-rights decision.");
    } finally {
      setBusyKey("");
    }
  }, [loadData, reviewFarmRightsVerification, rightsNotes]);

  const handleSafetyReview = useCallback(async (item, decision) => {
    const reportId = String(item.id || item._id || "");
    const note = String(safetyNotes[reportId] || "").trim();
    if (!note) {
      setError("Add a moderator note before saving the safety-report decision.");
      return;
    }
    try {
      setBusyKey(`report:${reportId}`);
      setError("");
      setMessage("");
      await reviewShambaSafetyReport(reportId, { decision, review_notes: note });
      setMessage(decision === "actioned" ? "Report actioned. The related active listing was suspended by the backend." : `Safety report marked ${prettyStatus(decision)}.`);
      await loadData({ silent: true });
    } catch (err) {
      setError(err?.message || "Unable to save the safety-report decision.");
    } finally {
      setBusyKey("");
    }
  }, [loadData, reviewShambaSafetyReport, safetyNotes]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-3 pb-24 sm:px-5 lg:px-7">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#063D2E] via-[#087F5B] to-[#0D9469] p-5 text-white shadow-lg sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15"><ShieldCheck size={21} /></div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100">Trust, land rights & safety</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Shamba Trust Centre</h1>
              <p className="mt-2 max-w-2xl text-[13px] leading-5 text-emerald-50">Submit farm-rights references, track reviews and report suspicious listings. Every decision is handled by a human reviewer; platform review is not government title certification.</p>
            </div>
          </div>
          <button type="button" onClick={() => loadData({ silent: true })} disabled={loading || refreshing} aria-label="Refresh trust status" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[12px] font-black transition hover:bg-white/20 disabled:opacity-50"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</button>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { label: "Registered farms", value: overview.farm_count ?? farms.length, icon: FileText },
            { label: "Rights reviewed", value: overview.verified_farm_count ?? 0, icon: CheckCircle2 },
            { label: "Awaiting review", value: overview.pending_farm_count ?? 0, icon: Clock },
          ].map((metric) => {
            const Icon = metric.icon;
            return <div key={metric.label} className="rounded-xl border border-white/15 bg-black/10 px-3 py-3"><div className="flex items-center justify-between gap-2"><p className="text-[12px] text-emerald-100">{metric.label}</p><Icon size={16} /></div><p className="mt-1 text-2xl font-black tabular-nums">{metric.value}</p></div>;
          })}
        </div>
      </section>

      {error && <Notice type="error">{error}</Notice>}
      {message && <Notice type="success">{message}</Notice>}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#DCE5E1] bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#087F5B] dark:bg-emerald-950/40 dark:text-emerald-300"><FileText size={19} /></div>
            <div><h2 className="font-black text-slate-900 dark:text-white">Farm-rights review</h2><p className="mt-1 text-[12px] leading-5 text-slate-500">Choose a registered farm, provide a lawful reference, and submit it for admin review. Do not submit national ID or passport numbers.</p></div>
          </div>

          {loading ? <div className="mt-4 h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" /> : !farms.length ? (
            <div className="mt-4 space-y-3"><Notice>No farm is registered yet. A farmer profile must first be approved in My Farms before you can create a farm and submit its rights reference.</Notice></div>
          ) : (
            <form className="mt-4 space-y-3" onSubmit={handleSubmitRights}>
              <Field label="Farm">
                <select className={INPUT} value={selectedFarmId} onChange={(event) => setSelectedFarmId(event.target.value)} required>
                  {farms.map((farm) => {
                    const id = String(farm.id || farm._id);
                    const status = String(farm.legal_verification_status || "not_submitted").toLowerCase();
                    return <option key={id} value={id}>{farm.name || "Unnamed farm"} — {prettyStatus(status)}</option>;
                  })}
                </select>
              </Field>

              {selectedFarm && (
                <div className="rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900">
                  <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold text-slate-800 dark:text-slate-200">{selectedFarm.name}</p><StatusPill value={selectedRightsStatus} /></div>
                  <p className="mt-1 flex items-start gap-1.5 text-[12px] text-slate-500"><MapPin size={13} className="mt-0.5 shrink-0" />{[selectedFarm.town, selectedFarm.county].filter(Boolean).join(", ") || selectedFarm.location || "Location not supplied"}</p>
                  {selectedFarm.review_notes && <p className="mt-2 text-[12px] leading-5 text-slate-600 dark:text-slate-300">Reviewer note: {selectedFarm.review_notes}</p>}
                </div>
              )}

              {!canSubmitRights && selectedFarm && <Notice type="info">{selectedRightsStatus === "pending" ? "This farm is already in the review queue. Wait for the reviewer or respond if more information is requested." : "Farm rights for this record have already been reviewed."}</Notice>}

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Your lawful basis">
                  <select value={rightsForm.rights_basis} onChange={(event) => updateRights("rights_basis", event.target.value)} className={INPUT} disabled={!canSubmitRights}>
                    {RIGHTS_BASES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </Field>
                <Field label="Reference type">
                  <select value={rightsForm.evidence_type} onChange={(event) => updateRights("evidence_type", event.target.value)} className={INPUT} disabled={!canSubmitRights}>
                    {EVIDENCE_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Reference only" hint="Enter a land register, lease, authority letter or community resolution reference. Never enter national ID or passport numbers.">
                <input className={INPUT} value={rightsForm.evidence_reference} onChange={(event) => updateRights("evidence_reference", event.target.value)} maxLength={120} placeholder="e.g. lease reference or authorization code" disabled={!canSubmitRights} required />
              </Field>

              <label className="flex items-start gap-2.5 text-[12px] leading-5 text-slate-600 dark:text-slate-300">
                <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-emerald-700" checked={rightsForm.declaration} onChange={(event) => updateRights("declaration", event.target.checked)} disabled={!canSubmitRights} />
                <span>I am authorized to manage this farm and the information provided is accurate.</span>
              </label>
              <label className="flex items-start gap-2.5 text-[12px] leading-5 text-slate-600 dark:text-slate-300">
                <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-emerald-700" checked={rightsForm.privacy_consent} onChange={(event) => updateRights("privacy_consent", event.target.checked)} disabled={!canSubmitRights} />
                <span>I consent to Shamba processing this reference for manual farm-rights review.</span>
              </label>

              <button type="submit" disabled={submittingRights || !canSubmitRights} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#087F5B] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#075E46] disabled:cursor-not-allowed disabled:opacity-50"><Send size={15} />{submittingRights ? "Submitting…" : "Submit farm-rights review"}</button>
            </form>
          )}
        </div>

        <div className="rounded-2xl border border-[#DCE5E1] bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"><AlertTriangle size={19} /></div>
            <div><h2 className="font-black text-slate-900 dark:text-white">Report a suspicious listing</h2><p className="mt-1 text-[12px] leading-5 text-slate-500">Report scams, misleading products, farm misrepresentation or pressure to pay outside protected, documented channels.</p></div>
          </div>

          <form className="mt-4 space-y-3" onSubmit={handleSafetyReport}>
            <Field label="Marketplace listing reference" hint="Copy the listing ID/reference shown on the item.">
              <input className={INPUT} value={reportForm.listing_id} onChange={(event) => setReportForm((current) => ({ ...current, listing_id: event.target.value }))} maxLength={120} placeholder="Listing ID" required />
            </Field>
            <Field label="Report category">
              <select className={INPUT} value={reportForm.category} onChange={(event) => setReportForm((current) => ({ ...current, category: event.target.value }))}>
                {REPORT_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="What happened?" hint="Include observable details, dates or messages. Do not post passwords, payment PINs or national ID numbers.">
              <textarea className={INPUT} value={reportForm.description} onChange={(event) => setReportForm((current) => ({ ...current, description: event.target.value }))} rows={4} maxLength={1200} placeholder="Describe the concern and why it may be unsafe…" required />
            </Field>
            <button type="submit" disabled={submittingReport} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-black text-amber-900 transition hover:bg-amber-100 disabled:opacity-50 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200"><AlertTriangle size={15} />{submittingReport ? "Submitting report…" : "Submit safety report"}</button>
            <p className="text-[11px] leading-4 text-slate-500">A report is reviewed by a human. It does not automatically prove wrongdoing; do not send money to strangers or share payment PINs.</p>
          </form>
        </div>
      </section>

      {admin && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#DCE5E1] pb-3 dark:border-slate-800"><ShieldCheck size={18} className="text-[#087F5B]" /><h2 className="text-lg font-black text-slate-900 dark:text-white">Administrator review queues</h2></div>
          <div>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h3 className="font-black text-slate-900 dark:text-white">Farm-rights cases</h3><p className="text-[12px] text-slate-500">These decisions are separate from farmer-profile approval.</p></div><StatusPill value={rightsQueue.length ? "pending" : "verified"} /></div>
            {rightsQueue.length ? <div className="grid gap-3 lg:grid-cols-2">{rightsQueue.map((item) => {
              const farmId = String(item.farm_id || item.farmId || "");
              return <FarmRightsAdminCard key={farmId} item={item} busy={busyKey === `farm:${farmId}`} note={rightsNotes[farmId] || ""} onNote={(id, value) => setRightsNotes((current) => ({ ...current, [id]: value }))} onReview={handleRightsReview} />;
            })}</div> : <div className="rounded-xl border border-dashed border-emerald-200 bg-white p-4 text-[13px] text-slate-500 dark:border-emerald-900/50 dark:bg-slate-950">No farm-rights cases are awaiting review.</div>}
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h3 className="font-black text-slate-900 dark:text-white">Safety reports</h3><p className="text-[12px] text-slate-500">Actioning a report requests the backend to suspend its active marketplace listing.</p></div><StatusPill value={safetyQueue.length ? "open" : "verified"} /></div>
            {safetyQueue.length ? <div className="grid gap-3 lg:grid-cols-2">{safetyQueue.map((item) => {
              const id = String(item.id || item._id || "");
              return <SafetyReportAdminCard key={id} item={item} busy={busyKey === `report:${id}`} note={safetyNotes[id] || ""} onNote={(key, value) => setSafetyNotes((current) => ({ ...current, [key]: value }))} onReview={handleSafetyReview} />;
            })}</div> : <div className="rounded-xl border border-dashed border-emerald-200 bg-white p-4 text-[13px] text-slate-500 dark:border-emerald-900/50 dark:bg-slate-950">No safety reports are awaiting moderation.</div>}
          </div>
        </section>
      )}

      <section className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <XCircle size={16} className="mt-0.5 shrink-0 text-slate-500" />
        <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">Trust Centre checks are platform reviews based on submitted information. They are not a substitute for official land registry searches, qualified legal advice, laboratory testing or government certification.</p>
      </section>
    </div>
  );
}
