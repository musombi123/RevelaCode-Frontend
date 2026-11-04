import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MailPlus, RefreshCw, School, ShieldCheck, AlertCircle, CheckCircle2, Users } from "lucide-react";
import { useAdminApi } from "@/services/adminApi.jsx";

const STAFF_ROLES = [
  { value: "teacher", label: "Teacher" },
  { value: "bursar", label: "Bursar" },
  { value: "registrar", label: "Registrar" },
  { value: "storekeeper", label: "Storekeeper" },
  { value: "librarian", label: "Librarian" },
];
const fieldClass = "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";

function unwrap(value) {
  let current = value;
  for (let i = 0; i < 6; i += 1) {
    if (Array.isArray(current) || !current || typeof current !== "object") return current;
    if (Object.prototype.hasOwnProperty.call(current, "data")) current = current.data;
    else if (Object.prototype.hasOwnProperty.call(current, "result")) current = current.result;
    else return current;
  }
  return current;
}

function schoolRows(response) {
  const payload = unwrap(response);
  if (Array.isArray(payload)) return payload;
  const candidates = [payload?.schools, payload?.items, payload?.records, payload?.results, payload?.data?.items, payload?.data?.schools];
  return candidates.find(Array.isArray) || [];
}

function schoolIdOf(school) {
  return String(school?.id || school?._id || school?.school_id || "").trim();
}

function schoolNameOf(school) {
  return String(school?.name || school?.school_name || school?.institution_name || "Unnamed school").trim();
}

function schoolStatusOf(school) {
  return String(school?.verification_status || school?.status || "unknown").replace(/_/g, " ").trim();
}

function Notice({ type = "error", children }) {
  const success = type === "success";
  return (
    <div role={success ? "status" : "alert"} className={success
      ? "flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-200"
      : "flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/25 dark:text-red-200"}>
      {success ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export default function AdminSchoolStaffInvitations() {
  const api = useAdminApi();
  const [schools, setSchools] = useState([]);
  const [schoolId, setSchoolId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState(null);
  const [form, setForm] = useState({ display_name: "", email: "", role: "teacher", expires_in_days: "7" });

  const loadSchools = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setLoadError("");
    try {
      const rows = [];
      // The admin endpoint is paginated (maximum 100 per request). Fetch every
      // page so the selector covers the complete school directory, not just page one.
      for (let page = 1; page <= 100; page += 1) {
        const response = await api.get("/api/jumuiya/admin/schools", { page, limit: 100 });
        const pageRows = schoolRows(response).filter((school) => schoolIdOf(school));
        rows.push(...pageRows);
        if (pageRows.length < 100) break;
      }
      setSchools(rows);
      setSchoolId((current) => rows.some((school) => schoolIdOf(school) === current) ? current : schoolIdOf(rows[0]));
    } catch (error) {
      setLoadError(error?.message || "Unable to load schools. Refresh and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => { loadSchools(); }, [loadSchools]);

  const selectedSchool = useMemo(() => schools.find((school) => schoolIdOf(school) === schoolId) || null, [schools, schoolId]);

  const submit = async (event) => {
    event.preventDefault();
    if (!schoolId) {
      setNotice({ type: "error", message: "Select a school before creating an invitation." });
      return;
    }
    setSubmitting(true);
    setNotice(null);
    try {
      const response = await api.post(
        "/api/jumuiya/admin/schools/" + encodeURIComponent(schoolId) + "/staff-invitations",
        {
          display_name: form.display_name.trim(),
          email: form.email.trim().toLowerCase(),
          role: form.role,
          expires_in_days: Number(form.expires_in_days),
        },
      );
      const result = unwrap(response) || {};
      const emailSent = result.email_sent === true;
      const invite = result.invitation || {};
      setNotice({
        type: emailSent ? "success" : "error",
        message: result.delivery_message || (emailSent ? "Invitation email sent." : "Invitation was recorded, but email delivery did not complete."),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        school: schoolNameOf(selectedSchool),
        emailStatus: invite.email_status || (emailSent ? "sent" : "failed"),
        emailError: invite.email_error || "",
      });
      if (emailSent) setForm((old) => ({ ...old, display_name: "", email: "" }));
    } catch (error) {
      setNotice({ type: "error", message: error?.message || "The staff invitation could not be created." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"><School size={21} /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Platform administration · Elimu</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950 dark:text-white">Invite staff to a school</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">Select the school first, then send an invitation to a teacher or operational staff member. The invitation is stored against that school and the recipient must accept it using their own RevelaCode account.</p>
            </div>
          </div>
          <button type="button" onClick={() => loadSchools(true)} disabled={loading || refreshing} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh schools
          </button>
        </div>
      </section>

      {loadError ? <Notice>{loadError}</Notice> : null}
      {notice ? <Notice type={notice.type}>
        <p className="font-semibold">{notice.message}</p>
        {notice.email ? <p className="mt-1">Recipient: <strong>{notice.email}</strong> · Role: <strong>{notice.role}</strong> · School: <strong>{notice.school}</strong></p> : null}
        {notice.emailStatus ? <p className="mt-1 text-xs">Email status: {notice.emailStatus}</p> : null}
        {notice.emailError ? <p className="mt-1 text-xs">{notice.emailError}</p> : null}
      </Notice> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"><Users size={17} /> School and staff details</div>
          <div>
            <label htmlFor="admin-school-staff-school" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Target school</label>
            <select id="admin-school-staff-school" className={fieldClass} value={schoolId} onChange={(event) => setSchoolId(event.target.value)} disabled={loading || schools.length === 0} required>
              {loading ? <option value="">Loading schools…</option> : schools.length === 0 ? <option value="">No schools found</option> : schools.map((school) => <option key={schoolIdOf(school)} value={schoolIdOf(school)}>{schoolNameOf(school)} · {schoolStatusOf(school)}</option>)}
            </select>
            {selectedSchool ? <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Selected school ID: {schoolIdOf(selectedSchool)}</p> : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="admin-school-staff-name" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Staff name (optional)</label>
              <input id="admin-school-staff-name" className={fieldClass} value={form.display_name} onChange={(event) => setForm((old) => ({ ...old, display_name: event.target.value }))} placeholder="e.g. Jane Wanjiku" autoComplete="name" />
            </div>
            <div>
              <label htmlFor="admin-school-staff-email" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Staff email</label>
              <input id="admin-school-staff-email" className={fieldClass} type="email" required value={form.email} onChange={(event) => setForm((old) => ({ ...old, email: event.target.value }))} placeholder="staff@example.com" autoComplete="email" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="admin-school-staff-role" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">School role</label>
              <select id="admin-school-staff-role" className={fieldClass} value={form.role} onChange={(event) => setForm((old) => ({ ...old, role: event.target.value }))}>{STAFF_ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">School Owner and Principal are intentionally excluded from this platform-admin invitation form.</p>
            </div>
            <div>
              <label htmlFor="admin-school-staff-expiry" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Invitation validity</label>
              <select id="admin-school-staff-expiry" className={fieldClass} value={form.expires_in_days} onChange={(event) => setForm((old) => ({ ...old, expires_in_days: event.target.value }))}><option value="1">1 day</option><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400"><ShieldCheck size={15} className="mt-0.5 shrink-0" />The platform-admin action is audited. It adds only a pending invitation; it does not create a staff account or grant access until the recipient accepts.</p>
            <button type="submit" className={buttonClass} disabled={submitting || loading || !schoolId}><MailPlus size={16} />{submitting ? "Sending invitation…" : "Send staff invitation"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
