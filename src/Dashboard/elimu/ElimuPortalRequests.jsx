import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, RefreshCw, ShieldCheck, UserCheck, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";

const API_BASE = `${(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "https://revelacode-backend.onrender.com").replace(/\/+$/, "")}/api/jumuiya/elimu/portal/requests`;

function unwrap(payload) { return payload?.data && typeof payload.data === "object" ? payload.data : payload; }

export default function ElimuPortalRequests() {
  const auth = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const request = useCallback(async (path = "", options = {}) => {
    const token = typeof auth?.getAccessToken === "function" ? await auth.getAccessToken() : "";
    const tokenType = typeof auth?.getTokenType === "function" ? await auth.getTokenType() : "Bearer";
    const response = await fetch(`${API_BASE}${path}`, {
      method: options.method || "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `${tokenType || "Bearer"} ${String(token).replace(/^Bearer\s+/i, "")}` } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
    let raw = {};
    try { raw = await response.json(); } catch { /* non-JSON error */ }
    const payload = unwrap(raw);
    if (!response.ok || payload?.success === false || payload?.ok === false) {
      throw new Error(payload?.message || payload?.error?.message || payload?.error || `Request failed (${response.status}).`);
    }
    return payload;
  }, [auth]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const payload = await request();
      setRequests(Array.isArray(payload?.requests) ? payload.requests : []);
    } catch (err) {
      setRequests([]);
      setError(err?.message || "Could not load portal verification requests.");
    } finally { setLoading(false); }
  }, [request]);

  useEffect(() => { void load(); }, [load]);

  const decide = async (item, decision) => {
    setBusyId(item.id); setError(""); setNotice("");
    try {
      const payload = await request(`/${encodeURIComponent(item.id)}/review`, { method: "POST", body: { decision } });
      setNotice(payload?.message || (decision === "approve" ? "Portal request approved." : "Portal request rejected."));
      await load();
    } catch (err) {
      setError(err?.message || "Could not update this request.");
    } finally { setBusyId(""); }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200"><ShieldCheck size={24} /></div>
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Parent & student access</p><h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Portal verification requests</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Review each request against your official school records. Approving a student request links that signed-in account to the student record; approving a guardian request authorizes that guardian to view the approved child information.</p></div>
        </div>
      </section>
      {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"><AlertCircle size={18} className="mt-0.5 shrink-0"/><span>{error}</span></div>}
      {notice && <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 size={18} className="mt-0.5 shrink-0"/><span>{notice}</span></div>}
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-950 dark:text-white">Pending requests</h2><p className="mt-1 text-sm text-slate-500">{requests.length} request{requests.length === 1 ? "" : "s"} awaiting a decision.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/>Refresh</button></div>
      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading verification requests…</div> : requests.length ? <div className="space-y-3">{requests.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold capitalize text-blue-800">{item.requester_type === "student" ? "Student account" : "Parent / guardian"}</span><span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800"><Clock size={12}/>Pending review</span></div><h3 className="mt-3 text-base font-bold text-slate-950 dark:text-white">{item.student?.full_name || "Student record not available"}</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{[item.student?.admission_number ? `Admission: ${item.student.admission_number}` : "", item.student?.class_name ? `Class: ${item.student.class_name}` : "", item.relationship ? `Relationship: ${item.relationship}` : ""].filter(Boolean).join(" · ") || "Match the requester against the student register before deciding."}</p><p className="mt-2 break-all text-xs text-slate-500">Requester account ID: {item.requester_user_id || "Not provided"}</p>{item.requester_type === "parent" && <p className="mt-3 text-xs font-semibold text-emerald-800">Registered guardian contact match: {item.contact_match || "Not confirmed"}</p>}{item.notes && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{item.notes}</p>}</div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => void decide(item, "approve")} disabled={Boolean(busyId)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">{busyId === item.id ? <RefreshCw size={15} className="animate-spin"/> : <UserCheck size={15}/>}Approve</button><button type="button" onClick={() => void decide(item, "reject")} disabled={Boolean(busyId)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><XCircle size={15}/>Reject</button></div></div></article>)}</div> : <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><CheckCircle2 size={26} className="text-emerald-700"/><h3 className="mt-3 font-bold text-slate-900">No pending portal requests</h3><p className="mt-1 max-w-md text-sm leading-6 text-slate-500">New student and guardian account-link requests will appear here after they are submitted from the public portals.</p></div>}
      <p className="text-xs leading-5 text-slate-500">Only the verified school owner can review requests in this first release. Always confirm the person’s relationship or student identity using your official records before approving.</p>
    </div>
  );
}
