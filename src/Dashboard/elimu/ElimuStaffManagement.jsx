import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Mail,
  RefreshCw,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useElimuApi } from "@/services/elimuApi.jsx";

const ROLE_OPTIONS = [
  { value: "principal", label: "Principal / Headteacher" },
  { value: "teacher", label: "Teacher" },
  { value: "bursar", label: "Bursar" },
  { value: "registrar", label: "Registrar" },
];

const ROLE_LABELS = {
  owner: "School Owner",
  principal: "Principal / Headteacher",
  teacher: "Teacher",
  bursar: "Bursar",
  registrar: "Registrar",
};

function unwrap(value) {
  let current = value;
  for (let i = 0; i < 6; i += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return current;
    if (Object.prototype.hasOwnProperty.call(current, "data")) {
      current = current.data;
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(current, "result")) {
      current = current.result;
      continue;
    }
    return current;
  }
  return current;
}

function rowsFrom(value, key) {
  const data = unwrap(value);
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data[key])) return data[key];
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.records)) return data.records;
  return [];
}

function text(value, fallback = "—") {
  if (value === null || value === undefined || String(value).trim() === "") return fallback;
  return String(value);
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function staffName(staff) {
  return (
    staff?.identity?.display_name ||
    staff?.display_name ||
    staff?.full_name ||
    staff?.identity?.preferred_name ||
    staff?.identity?.email ||
    staff?.email ||
    `Staff member ${staff?.user_id || ""}`.trim()
  );
}

function staffEmail(staff) {
  return staff?.identity?.email || staff?.email || "";
}

function invitationName(invitation) {
  return invitation?.display_name || invitation?.identity?.display_name || invitation?.email || "Invited staff member";
}

function invitationStatusLabel(invitation) {
  const status = String(invitation?.status || "invited").toLowerCase();
  if (status === "accepted") return "Accepted";
  if (status === "cancelled" || status === "revoked") return "Revoked";
  if (invitation?.email_status === "failed") return "Email failed";
  if (invitation?.email_status === "sent") return "Invitation sent";
  if (invitation?.email_status === "pending") return "Sending email";
  return "Pending";
}

function StatusPill({ children, tone = "slate" }) {
  const classes = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    red: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
    blue: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
    slate: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${classes[tone] || classes.slate}`}>{children}</span>;
}

function Button({ children, className = "", variant = "secondary", ...props }) {
  const variants = {
    primary: "border-transparent bg-blue-700 text-white hover:bg-blue-800 disabled:bg-blue-400",
    secondary: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900",
    danger: "border-red-200 bg-white text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-slate-950 dark:text-red-300 dark:hover:bg-red-950/30",
    quiet: "border-transparent bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900",
  };
  return <button {...props} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant] || variants.secondary} ${className}`}>{children}</button>;
}

export default function ElimuStaffManagement({ access, school, role, onNavigate }) {
  const api = useElimuApi();
  const auth = useAuth();
  const currentUserId = String(auth?.user?.id || auth?.user?._id || auth?.user?.user_id || "");
  const canManage = role === "owner" || role === "principal";

  const [staff, setStaff] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyInvitationId, setBusyInvitationId] = useState("");
  const [busyStaffId, setBusyStaffId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [form, setForm] = useState({
    display_name: "",
    email: "",
    role: "teacher",
    expires_in_days: "7",
  });

  const schoolName = school?.name || school?.school_name || school?.institution_name || "your school";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [staffResult, invitationResult] = await Promise.allSettled([
      api.getStaff(),
      api.getStaffInvitations(),
    ]);

    if (staffResult.status === "fulfilled") {
      setStaff(rowsFrom(staffResult.value, "staff"));
    } else {
      setStaff([]);
      setError(staffResult.reason?.message || "School staff could not be loaded.");
    }

    if (invitationResult.status === "fulfilled") {
      setInvitations(rowsFrom(invitationResult.value, "invitations"));
    } else {
      setInvitations([]);
      setError((current) => current
        ? `${current} Pending invitations could not be loaded; ensure the backend invitation-management routes are deployed.`
        : (invitationResult.reason?.message || "Pending invitations could not be loaded; ensure the backend invitation-management routes are deployed."));
    }

    setLoading(false);
  }, [api.getStaff, api.getStaffInvitations]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const active = staff.filter((member) => String(member?.status || "").toLowerCase() === "active").length;
    const pending = invitations.filter((invitation) => String(invitation?.status || "invited").toLowerCase() === "invited").length;
    const failures = invitations.filter((invitation) => invitation?.email_status === "failed" && String(invitation?.status || "invited").toLowerCase() === "invited").length;
    return { active, pending, failures };
  }, [staff, invitations]);

  const changeForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleInvite = async (event) => {
    event.preventDefault();
    if (!canManage || submitting) return;
    setSubmitting(true);
    setError("");
    setNotice("");
    const email = form.email.trim().toLowerCase();
    const displayName = form.display_name.trim();
    try {
      const response = await api.inviteStaff({
        email,
        role: form.role,
        expires_in_days: Number(form.expires_in_days || 7),
        identity: { email, display_name: displayName || undefined },
      });
      const result = unwrap(response) || {};
      if (result.email_sent === false) {
        setNotice(`The invitation record was created for ${email}, but the email could not be delivered. Check the backend email settings, then use Resend invitation below.`);
      } else {
        setNotice(`Invitation sent directly to ${email} as ${ROLE_LABELS[form.role] || form.role}.`);
      }
      setForm({ display_name: "", email: "", role: "teacher", expires_in_days: "7" });
      await load();
    } catch (requestError) {
      setError(requestError?.message || "The invitation could not be created.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (invitation) => {
    const invitationId = String(invitation?._id || invitation?.id || invitation?.invitation_id || "");
    if (!invitationId || busyInvitationId) return;
    setBusyInvitationId(invitationId);
    setError("");
    setNotice("");
    try {
      const response = unwrap(await api.resendStaffInvitation(invitationId)) || {};
      setNotice(response.email_sent === false
        ? `Email delivery failed again for ${invitation?.email || "this invitation"}. Check RESEND_API_KEY and EMAIL_FROM in the backend environment.`
        : `A fresh invitation email has been sent to ${invitation?.email || "the invitee"}. The previous link has been replaced.`);
      await load();
    } catch (requestError) {
      setError(requestError?.message || "The invitation email could not be resent.");
    } finally {
      setBusyInvitationId("");
    }
  };

  const handleRevokeInvitation = async (invitation) => {
    const invitationId = String(invitation?._id || invitation?.id || invitation?.invitation_id || "");
    if (!invitationId || busyInvitationId) return;
    if (!window.confirm(`Revoke the pending invitation for ${invitation?.email || "this person"}? Its link will stop working.`)) return;
    setBusyInvitationId(invitationId);
    setError("");
    setNotice("");
    try {
      await api.revokeStaffInvitation(invitationId);
      setNotice(`The pending invitation for ${invitation?.email || "this person"} has been revoked.`);
      await load();
    } catch (requestError) {
      setError(requestError?.message || "The invitation could not be revoked.");
    } finally {
      setBusyInvitationId("");
    }
  };

  const confirmRemoveStaff = async () => {
    const member = pendingRemoval;
    const userId = String(member?.user_id || member?.userId || member?.revelacode_user_id || "");
    if (!member || !userId || busyStaffId) return;
    setBusyStaffId(userId);
    setError("");
    setNotice("");
    try {
      await api.deleteStaffMember(userId);
      setNotice(`${staffName(member)} was removed from ${schoolName}. Their RevelaCode account and historical school records remain intact.`);
      setPendingRemoval(null);
      await load();
    } catch (requestError) {
      setError(requestError?.message || "The staff membership could not be removed.");
    } finally {
      setBusyStaffId("");
    }
  };

  if (!canManage) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
        <div className="flex items-start gap-3"><ShieldCheck size={20} /><div><p className="font-semibold">Staff management is restricted</p><p className="mt-1">Only the school owner or a principal with the required backend permissions can manage staff and invitations.</p></div></div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-blue-200"><ShieldCheck size={14} /> Owner-controlled access</div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Staff & access</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Invite school leaders and staff by email, track onboarding, resend or revoke pending invitations, and remove school access without deleting a RevelaCode account.</p>
            <p className="mt-3 text-sm font-semibold text-white">{schoolName}</p>
          </div>
          <Button variant="secondary" onClick={() => void load()} disabled={loading} className="shrink-0"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh records</Button>
        </div>
      </section>

      {(error || notice) && (
        <div role={error ? "alert" : "status"} className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${error ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200" : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"}`}>
          {error ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
          <p className="flex-1">{error || notice}</p>
          <button type="button" aria-label="Dismiss message" onClick={() => { setError(""); setNotice(""); }} className="rounded-md p-1 opacity-70 hover:opacity-100"><X size={16} /></button>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Users size={17} /> Active staff</div><p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{stats.active}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Mail size={17} /> Pending invitations</div><p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{stats.pending}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><AlertCircle size={17} /> Email failures</div><p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{stats.failures}</p></div>
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"><Mail size={20} /></span><div><h3 className="text-base font-bold text-slate-950 dark:text-white">Invite staff member</h3><p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">The invitee receives an email directly and accepts using their own verified RevelaCode account.</p></div></div>
          <form onSubmit={handleInvite} className="mt-5 space-y-4">
            <div><label htmlFor="elimu-staff-name" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Invitee name (optional)</label><input id="elimu-staff-name" name="display_name" autoComplete="name" value={form.display_name} onChange={(event) => changeForm("display_name", event.target.value)} placeholder="e.g. Jane Wanjiku" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></div>
            <div><label htmlFor="elimu-staff-email" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Invitee email address</label><input id="elimu-staff-email" name="email" type="email" autoComplete="email" required value={form.email} onChange={(event) => changeForm("email", event.target.value)} placeholder="person@example.com" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /><p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">They must register or sign in with this exact email address.</p></div>
            <div><label htmlFor="elimu-staff-role" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">School role</label><select id="elimu-staff-role" name="role" required value={form.role} onChange={(event) => changeForm("role", event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white">{ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Owner permissions cannot be granted from staff management.</p></div>
            <div><label htmlFor="elimu-staff-expiry" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Invitation validity</label><select id="elimu-staff-expiry" name="expires_in_days" value={form.expires_in_days} onChange={(event) => changeForm("expires_in_days", event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="1">1 day</option><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></div>
            <Button type="submit" variant="primary" disabled={submitting} className="w-full">{submitting ? <><RefreshCw size={16} className="animate-spin" /> Sending invitation…</> : <><Mail size={16} /> Send invitation email</>}</Button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><h3 className="text-base font-bold text-slate-950 dark:text-white">School staff</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Active and suspended membership records for this school.</p></div><StatusPill tone="blue">{staff.length} records</StatusPill></div>
          <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
            {loading && !staff.length ? <div className="py-8 text-center text-sm text-slate-500"><RefreshCw size={18} className="mx-auto mb-2 animate-spin" />Loading school staff…</div> : staff.length ? staff.map((member, index) => {
              const userId = String(member?.user_id || member?.userId || member?.revelacode_user_id || "");
              const memberRole = String(member?.role || "").toLowerCase();
              const status = String(member?.status || "unknown").toLowerCase();
              const isOwner = memberRole === "owner";
              const isSelf = Boolean(currentUserId && userId && userId === currentUserId);
              const canRemove = !isOwner && !isSelf && Boolean(userId) && status !== "removed";
              return <article key={member?._id || userId || index} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300"><Users size={18} /></span><div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold text-slate-900 dark:text-white">{staffName(member)}</p><p className="mt-0.5 break-all text-xs text-slate-500 dark:text-slate-400">{text(staffEmail(member), "Email not on profile")}</p><div className="mt-2 flex flex-wrap gap-2"><StatusPill tone={memberRole === "owner" ? "amber" : memberRole === "principal" ? "blue" : "slate"}>{ROLE_LABELS[memberRole] || text(member?.role, "Staff")}</StatusPill><StatusPill tone={status === "active" ? "green" : status === "suspended" ? "amber" : "slate"}>{status.replace(/[_-]+/g, " ")}</StatusPill>{isSelf && <StatusPill>Current account</StatusPill>}</div></div></div>{canRemove && <Button type="button" variant="danger" className="shrink-0 self-start sm:self-center" disabled={Boolean(busyStaffId)} onClick={() => setPendingRemoval(member)}><Users size={15} /> Remove from school</Button>}</article>;
            }) : <div className="py-8 text-center"><Users size={24} className="mx-auto text-slate-300 dark:text-slate-600" /><p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">No staff records yet</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Send your first invitation using the form.</p></div>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h3 className="text-base font-bold text-slate-950 dark:text-white">Invitations</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Resend expired or failed emails, or revoke invitations that should no longer be accepted.</p></div><span className="text-xs text-slate-500 dark:text-slate-400">Most recent invitations first</span></div>
        <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
          {loading && !invitations.length ? <div className="py-8 text-center text-sm text-slate-500">Loading invitations…</div> : invitations.length ? invitations.map((invitation, index) => {
            const invitationId = String(invitation?._id || invitation?.id || invitation?.invitation_id || "");
            const status = String(invitation?.status || "invited").toLowerCase();
            const isPending = status === "invited";
            const mailFailed = invitation?.email_status === "failed";
            const busy = Boolean(invitationId && busyInvitationId === invitationId);
            const tone = status === "accepted" ? "green" : (mailFailed ? "red" : status === "invited" ? (invitation?.email_status === "sent" ? "blue" : "amber") : "slate");
            return <article key={invitationId || index} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 lg:flex-row lg:items-center"><div className="flex min-w-0 flex-1 items-start gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${mailFailed ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300" : "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300"}`}>{mailFailed ? <AlertCircle size={18} /> : status === "accepted" ? <CheckCircle2 size={18} /> : <Mail size={18} />}</span><div className="min-w-0 flex-1"><p className="break-all text-sm font-semibold text-slate-900 dark:text-white">{text(invitation?.email, "Unknown recipient")}</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{invitationName(invitation)} · {ROLE_LABELS[String(invitation?.role || "").toLowerCase()] || text(invitation?.role, "Staff role")}</p><div className="mt-2 flex flex-wrap items-center gap-2"><StatusPill tone={tone}>{invitationStatusLabel(invitation)}</StatusPill><span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400"><Clock size={12} />Expires {formatDate(invitation?.expires_at)}</span></div>{mailFailed && <p className="mt-2 text-xs leading-5 text-red-700 dark:text-red-300">Email delivery failed. Check the backend email-provider configuration and resend.</p>}</div></div><div className="flex flex-wrap gap-2 lg:justify-end">{isPending && <><Button type="button" disabled={busy || Boolean(busyInvitationId)} onClick={() => void handleResend(invitation)}>{busy ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}Resend email</Button><Button type="button" variant="danger" disabled={busy || Boolean(busyInvitationId)} onClick={() => void handleRevokeInvitation(invitation)}><X size={14} /> Revoke</Button></>}</div></article>;
          }) : <div className="py-8 text-center"><Mail size={24} className="mx-auto text-slate-300 dark:text-slate-600" /><p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">No invitations yet</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Invitations you send will appear here with their delivery and acceptance status.</p></div>}
        </div>
      </section>

      <section className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-100"><ShieldCheck size={18} className="mt-0.5 shrink-0" /><p className="leading-6">Removing a staff member revokes access to this school only. The person's RevelaCode account and historical school records are retained. Ownership is protected by the backend.</p></section>

      {pendingRemoval && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busyStaffId) setPendingRemoval(null); }}><section role="dialog" aria-modal="true" aria-labelledby="elimu-remove-staff-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950"><div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"><Users size={20} /></span><div className="min-w-0 flex-1"><h3 id="elimu-remove-staff-title" className="text-base font-bold text-slate-950 dark:text-white">Remove staff from school?</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">This will revoke <strong>{staffName(pendingRemoval)}</strong>'s access to <strong>{schoolName}</strong> and deactivate teaching assignments. It will not delete their RevelaCode account or historical records.</p></div></div><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" onClick={() => setPendingRemoval(null)} disabled={Boolean(busyStaffId)}>Cancel</Button><Button type="button" variant="danger" onClick={() => void confirmRemoveStaff()} disabled={Boolean(busyStaffId)}>{busyStaffId ? <><RefreshCw size={15} className="animate-spin" /> Removing…</> : <><Users size={15} /> Remove from this school</>}</Button></div></section></div>}
    </div>
  );
}
