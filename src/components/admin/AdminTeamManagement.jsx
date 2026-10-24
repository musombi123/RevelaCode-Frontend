"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

import { useAdminApi } from "@/services/adminApi.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

const EMPTY_FORM = { full_name: "", contact: "", role: "support" };

function isDeleted(user) {
  return String(user?.status || "").toLowerCase() === "deleted";
}

function isBanned(user) {
  if (isDeleted(user)) return false;
  const status = String(user?.status || "").toLowerCase();
  return ["banned", "suspended", "blocked", "disabled", "inactive"].includes(status) || user?.is_active === false;
}

function dateLabel(value) {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? String(value)
    : parsed.toLocaleString([], { year: "numeric", month: "short", day: "numeric" });
}

function StatusPill({ value }) {
  const status = String(value || "active").toLowerCase();
  const tone = ["active", "verified", "accepted"].includes(status)
    ? "bg-emerald-50 text-emerald-700"
    : ["banned", "deleted", "revoked", "delivery_failed", "expired"].includes(status)
      ? "bg-rose-50 text-rose-700"
      : "bg-amber-50 text-amber-800";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${tone}`}>{status.replaceAll("_", " ")}</span>;
}

export default function AdminTeamManagement() {
  const adminApi = useAdminApi();
  const { user: currentUser } = useAuth();
  const currentUserId = String(currentUser?.id || currentUser?._id || currentUser?.user_id || "");
  const isTopLevelAdmin = ["revelacode_admin", "super_admin"].includes(String(currentUser?.role || "").toLowerCase());
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [form, setForm] = useState(EMPTY_FORM);

  const loadAll = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [userResponse, inviteResponse] = await Promise.all([
        adminApi.platform.listUsers({ page, limit: 50, ...(activeSearch ? { search: activeSearch } : {}) }),
        adminApi.platform.listInvitations({ limit: 100 }),
      ]);
      setUsers(Array.isArray(userResponse?.users) ? userResponse.users : []);
      setPagination(userResponse?.pagination || { page, limit: 50, total: 0, pages: 1 });
      setInvitations(Array.isArray(inviteResponse?.invitations) ? inviteResponse.invitations : []);
    } catch (error) {
      setMessageType("error");
      setMessage(error?.message || "Could not load users and invitations.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [adminApi, page, activeSearch]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const filteredUsers = useMemo(() => users, [users]);

  async function sendInvitation(event) {
    event.preventDefault();
    if (submitting) return;
    const fullName = form.full_name.trim();
    const contact = form.contact.trim().toLowerCase();
    if (!fullName || !contact) {
      setMessageType("error");
      setMessage("Enter the invitee’s full name and email address.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      const response = await adminApi.platform.createInvitation({
        full_name: fullName,
        contact,
        role: form.role,
      });
      setMessageType("success");
      setMessage(response?.message || `Invitation sent to ${contact}.`);
      setForm(EMPTY_FORM);
      await loadAll({ refresh: true });
    } catch (error) {
      setMessageType("error");
      setMessage(error?.message || "Invitation could not be sent.");
    } finally {
      setSubmitting(false);
    }
  }

  async function changeAccountStatus(user) {
    const id = String(user?.id || "");
    if (!id) {
      setMessageType("error");
      setMessage("This user record does not contain a usable account ID.");
      return;
    }
    const action = isBanned(user) ? "unban" : "ban";
    const label = user.full_name || user.contact || id;
    const detail = action === "ban"
      ? `Ban ${label}? Their sign-in will be blocked until an administrator reactivates the account.`
      : `Reactivate ${label} and allow them to sign in again?`;
    if (!window.confirm(detail)) return;

    setBusyAction(`status:${id}`);
    setMessage("");
    try {
      const response = await adminApi.platform.updateUserStatus(id, action);
      setMessageType("success");
      setMessage(response?.message || `Account ${action === "ban" ? "banned" : "reactivated"}.`);
      await loadAll({ refresh: true });
    } catch (error) {
      setMessageType("error");
      setMessage(error?.message || "Account status could not be changed.");
    } finally {
      setBusyAction("");
    }
  }

  async function deleteAccount(user) {
    const id = String(user?.id || "");
    if (!id) {
      setMessageType("error");
      setMessage("This user record does not contain a usable account ID.");
      return;
    }
    const label = user.full_name || user.contact || id;
    const confirmed = window.confirm(
      `Delete access for ${label}? This is a soft delete: sign-in is disabled, while audit, financial and ecosystem references are retained for traceability. This cannot be undone from this screen.`
    );
    if (!confirmed) return;

    setBusyAction(`delete:${id}`);
    setMessage("");
    try {
      const response = await adminApi.platform.deleteUser(id);
      setMessageType("success");
      setMessage(response?.message || "Account access removed.");
      await loadAll({ refresh: true });
    } catch (error) {
      setMessageType("error");
      setMessage(error?.message || "Account could not be deleted.");
    } finally {
      setBusyAction("");
    }
  }

  async function revokeInvitation(invitation) {
    if (!invitation?.id || invitation.status !== "pending") return;
    const label = invitation.contact || invitation.id;
    if (!window.confirm(`Revoke the pending invitation for ${label}?`)) return;
    setBusyAction(`invite:${invitation.id}`);
    setMessage("");
    try {
      const response = await adminApi.platform.revokeInvitation(invitation.id);
      setMessageType("success");
      setMessage(response?.message || "Invitation revoked.");
      await loadAll({ refresh: true });
    } catch (error) {
      setMessageType("error");
      setMessage(error?.message || "Invitation could not be revoked.");
    } finally {
      setBusyAction("");
    }
  }

  const activeUsers = users.filter((user) => !["banned", "deleted", "disabled", "suspended"].includes(String(user.status || "").toLowerCase())).length;
  const pendingInvitations = invitations.filter((item) => item.status === "pending").length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">RevelaCode control plane</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">User management</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">Manage account access, issue single-use team invitations, and review current account status. Privileged actions are authorized and audited by the backend.</p>
          </div>
          <button type="button" onClick={() => loadAll({ refresh: true })} disabled={loading || refreshing} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-900">
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="text-xs text-slate-500">Accounts in current list</p><p className="mt-1 text-2xl font-black">{users.length}</p></div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="text-xs text-slate-500">Active on this page</p><p className="mt-1 text-2xl font-black">{activeUsers}</p></div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="text-xs text-slate-500">Pending invitations</p><p className="mt-1 text-2xl font-black">{pendingInvitations}</p></div>
        </div>
      </section>

      {message ? (
        <div role={messageType === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${messageType === "error" ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200" : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"}`}>
          {messageType === "error" ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}{message}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><UserPlus size={21} /></div>
          <div><h3 className="font-black text-slate-950 dark:text-white">Invite support team members</h3><p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">Send a single-use invitation to the registered email. The invitee chooses their own password. The link expires after seven days and is invalidated after acceptance or revocation.</p></div>
        </div>
        <form onSubmit={sendInvitation} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Full name</span><input required maxLength={120} autoComplete="name" value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} placeholder="Support team member" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Email address</span><input required type="email" maxLength={254} autoComplete="email" value={form.contact} onChange={(event) => setForm((current) => ({ ...current, contact: event.target.value }))} placeholder="name@example.com" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Invitation role</span><select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="support">Support Agent — tickets only</option><option value="support_admin">Support Administrator — team oversight, study and policy</option></select></label>
          <div className="flex items-end"><button type="submit" disabled={submitting} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50 sm:w-auto"><UserPlus size={16} />{submitting ? "Sending invitation…" : "Send invitation"}</button></div>
        </form>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200"><ShieldAlert size={16} className="mt-0.5 shrink-0" /><p><strong>Privilege boundary:</strong> Support Administrators can supervise ticket operations and manage approved study/policy content. They do not receive RevelaCode owner permissions for user bans/deletion, platform administration or financial management.</p></div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5"><div className="flex items-center gap-3"><Users size={20} className="text-slate-600 dark:text-slate-300" /><div><h3 className="font-black text-slate-950 dark:text-white">Registered accounts</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ban blocks sign-in. Delete is a soft-delete that retains audit and ecosystem references.</p></div></div><form onSubmit={(event) => { event.preventDefault(); setPage(1); setActiveSearch(search.trim()); }} className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, role, status or ID…" className="min-h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" /><button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white dark:bg-white dark:text-slate-950">Search accounts</button><button type="button" onClick={() => { setSearch(""); setActiveSearch(""); setPage(1); }} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">Clear</button></form><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Showing {users.length} account(s) on page {pagination.page || page} of {Math.max(1, pagination.pages || 1)} · {pagination.total ?? users.length} matched overall.</p></div>
        {loading ? <div className="p-6 text-sm text-slate-500">Loading registered accounts…</div> : filteredUsers.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No accounts matched this search.</div> : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredUsers.map((item) => {
              const id = String(item.id || "");
              const privileged = ["admin", "platform_admin", "super_admin", "revelacode_admin"].includes(String(item.role || "").toLowerCase());
              const cannotOperate = privileged && (!isTopLevelAdmin || id === currentUserId);
              const deleted = isDeleted(item);
              const banned = isBanned(item);
              const deleting = busyAction === `delete:${id}`;
              const statusBusy = busyAction === `status:${id}`;
              return (
                <article key={id || item.contact} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="min-w-0"><p className="break-words font-bold text-slate-950 dark:text-white">{item.full_name || "Unnamed user"}</p><p className="mt-1 break-all text-sm text-slate-600 dark:text-slate-300">{item.contact || item.email || "Contact not provided"}</p><p className="mt-1 break-all text-[10px] text-slate-400">ID: {id || "Unavailable"}{item.created_at ? ` · Created ${dateLabel(item.created_at)}` : ""}</p></div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">{item.role || "unknown"}</span>
                    <StatusPill value={item.status || (item.verified ? "verified" : "unverified")} />
                    {privileged && cannotOperate ? <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"><ShieldAlert size={12} />Protected platform role</span> : deleted ? <span className="text-xs font-bold text-rose-700 dark:text-rose-300">Deleted access</span> : (
                      <>
                        <button type="button" onClick={() => changeAccountStatus(item)} disabled={Boolean(busyAction)} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50 ${banned ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-300" : "border-amber-200 text-amber-800 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-300"}`}>{statusBusy ? <RefreshCw size={13} className="animate-spin" /> : banned ? <UserCheck size={13} /> : <ShieldAlert size={13} />}{banned ? "Unban / reactivate" : "Ban user"}</button>
                        <button type="button" onClick={() => deleteAccount(item)} disabled={Boolean(busyAction) || deleting} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/50 dark:text-rose-300"><XCircle size={13} />{deleting ? "Deleting…" : "Delete"}</button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {!loading && (pagination.pages || 1) > 1 ? <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-4 dark:border-slate-800"><button type="button" disabled={page <= 1 || refreshing} onClick={() => setPage((value) => Math.max(1, value - 1))} className="min-h-9 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-40 dark:border-slate-700">Previous</button><span className="text-xs text-slate-500">Page {page} of {pagination.pages}</span><button type="button" disabled={page >= pagination.pages || refreshing} onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))} className="min-h-9 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-40 dark:border-slate-700">Next</button></div> : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5"><Clock3 size={20} className="text-slate-600 dark:text-slate-300" /><div><h3 className="font-black text-slate-950 dark:text-white">Team invitations</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Invitation statuses are read from the backend; the raw invite token is never listed here.</p></div></div>
        {invitations.length === 0 ? <div className="p-6 text-sm text-slate-500">No invitations have been issued yet.</div> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{invitations.map((invite) => <div key={invite.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-semibold text-slate-900 dark:text-white">{invite.full_name || invite.contact}</p><p className="break-all text-sm text-slate-500 dark:text-slate-400">{invite.contact}</p><p className="mt-1 text-[11px] text-slate-400">Role: {invite.role} · Expires: {dateLabel(invite.expires_at)}</p></div><div className="flex items-center gap-2"><StatusPill value={invite.status} />{invite.status === "pending" && <button type="button" disabled={Boolean(busyAction)} onClick={() => revokeInvitation(invite)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50 dark:border-rose-900/50 dark:text-rose-300"><XCircle size={13} />Revoke</button>}</div></div>)}</div>}
      </section>
    </div>
  );
}
