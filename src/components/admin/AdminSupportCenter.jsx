import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertCircle, CheckCircle2, Clock3, Inbox, Mail, RefreshCw, Search, ShieldCheck, Ticket, Users, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { resolveAdminBackendUrl } from "@/services/adminApi.jsx";

const TABS = [
  ["inbox", "Support Inbox", Inbox],
  ["tickets", "Tickets", Ticket],
  ["plans", "Pending Plans", Wallet],
  ["verification", "Verification", Mail],
  ["invites", "Invitations", Users],
  ["health", "System Health", Activity],
  ["team", "Support Team", ShieldCheck],
  ["payments", "Payments", Wallet],
  ["audit", "Audit Log", Clock3],
  ["approvals", "Approvals", CheckCircle2],
];

const CANNED = {
  en: "Hello, thank you for contacting RevelaCode Support. We have reviewed your request and will update you shortly.",
  sw: "Habari, asante kwa kuwasiliana na Usaidizi wa RevelaCode. Tumepokea ombi lako na tutakujulisha baada ya kulikagua.",
};

function when(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}
function statusTone(value) {
  const status = String(value || "").toLowerCase();
  if (["active", "succeeded", "paid", "approved", "up", "accepted_by_provider"].includes(status)) return "bg-emerald-50 text-emerald-700";
  if (["pending", "reserved", "awaiting_verification", "pending_support_admin_approval", "not_configured", "not_ready"].includes(status)) return "bg-amber-50 text-amber-800";
  if (["banned", "suspended", "deleted", "failed", "down", "rejected", "delivery_failed"].includes(status)) return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-700";
}
function Status({ value }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(value)}`}>{String(value || "unknown").replaceAll("_", " ")}</span>;
}

export default function AdminSupportCenter({ initialView = "inbox" }) {
  const auth = useAuth();
  const { user, authFetch, getAccessToken, getTokenType } = auth;
  const role = String(user?.role || "").toLowerCase();
  const isAdmin = ["super_admin", "support_admin"].includes(role);
  const [view, setView] = useState(initialView);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [data, setData] = useState({});
  const [lookup, setLookup] = useState("");
  const [invite, setInvite] = useState({ full_name: "", email: "", role: "support_agent" });
  const [payroll, setPayroll] = useState({ member_id: "", rate: "", period_start: "", period_end: "", bonus: "0", bonus_reason: "", deduction: "0", deduction_reason: "", payment_method: "manual" });
  const [verificationAccount, setVerificationAccount] = useState(null);
  const [accessibilityTicketId, setAccessibilityTicketId] = useState("");
  const [accessibilityDetails, setAccessibilityDetails] = useState("");

  const visibleTabs = useMemo(() => TABS.filter(([key]) => isAdmin || ["inbox", "tickets", "plans", "verification", "health"].includes(key)), [isAdmin]);

  const api = useCallback(async (path, method = "GET", body) => {
    const base = resolveAdminBackendUrl();
    const token = typeof getAccessToken === "function" ? await getAccessToken() : "";
    const tokenType = typeof getTokenType === "function" ? await getTokenType() : "Bearer";
    const headers = { Accept: "application/json" };
    if (token) headers.Authorization = `${tokenType || "Bearer"} ${String(token).replace(/^Bearer\s+/i, "")}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const transport = typeof authFetch === "function" ? authFetch : fetch;
    const response = await transport(`${base}/api/support-center${path}`, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      const err = new Error(payload.message || payload.error?.message || `Request failed (${response.status}).`);
      err.status = response.status;
      throw err;
    }
    return payload;
  }, [authFetch, getAccessToken, getTokenType]);

  const load = useCallback(async (target = view) => {
    setLoading(true);
    setError("");
    try {
      const routes = {
        inbox: "/mailbox",
        tickets: "/tickets",
        plans: "/plans/pending",
        invites: "/invitations",
        team: "/overview",
        health: "/health",
        payments: "/payroll",
        audit: "/audit",
        approvals: "/approvals",
      };
      if (target === "verification") {
        setData((old) => ({ ...old, verification: old.verification || null }));
      } else if (target === "invites") {
        const [inviteResult, overviewResult] = await Promise.all([api("/invitations"), api("/overview")]);
        setData((old) => ({ ...old, invites: inviteResult, team: overviewResult }));
      } else if (target === "health") {
        const [healthResult, issueResult] = await Promise.all([api("/health"), api("/accessibility/issues")]);
        setData((old) => ({ ...old, health: healthResult, accessibility: issueResult }));
      } else {
        const result = await api(routes[target] || "/overview");
        setData((old) => ({ ...old, [target]: result }));
      }
    } catch (err) {
      setError(err.message || "Unable to load Support Center data.");
    } finally {
      setLoading(false);
    }
  }, [api, view]);

  useEffect(() => { load(view); }, [view, load]);

  async function run(key, fn, success) {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await fn();
      setNotice(success || "Saved.");
      await load(view);
    } catch (err) {
      setError(err.message || "The action failed.");
    } finally {
      setBusy("");
    }
  }

  async function searchVerification() {
    setBusy("verification-search");
    setError("");
    setVerificationAccount(null);
    try {
      const result = await api(`/verification/search?lookup=${encodeURIComponent(lookup)}`);
      setVerificationAccount(result.account);
    } catch (err) {
      setError(err.message || "Account lookup failed.");
    } finally {
      setBusy("");
    }
  }

  async function resendVerification(event) {
    event.preventDefault();
    await run("verification", async () => {
      const result = await api("/verification/resend", "POST", { lookup });
      setNotice(result.message || "Verification email sent.");
    }, "Verification request completed.");
  }

  async function createInvite(event) {
    event.preventDefault();
    await run("invite", async () => {
      await api("/invitations", "POST", invite);
      setInvite({ full_name: "", email: "", role: "support_agent" });
    }, "Invitation created. The recipient receives a single-use link valid for 48 hours.");
  }

  async function memberAction(member, action) {
    const reason = window.prompt(`Reason for ${action} of ${member.full_name || "this member"} (required):`);
    if (!reason || reason.trim().length < 8) return;
    if (!window.confirm(`Confirm immediate ${action} for this support member?`)) return;
    await run(`member-${member.id}`, () => api(`/members/${encodeURIComponent(member.id)}/status`, "PATCH", { action, reason: reason.trim() }), `Member ${action} completed.`);
  }

  async function changeRole(member) {
    const roleChoice = window.prompt("Enter support_agent or support_admin:", member.role);
    if (!["support_agent", "support_admin"].includes(String(roleChoice || "").trim())) return;
    const reason = window.prompt("Reason for this role change (at least 8 characters):");
    if (!reason || reason.trim().length < 8) return;
    await run(`role-${member.id}`, () => api(`/members/${encodeURIComponent(member.id)}/role`, "PATCH", { role: roleChoice, reason }), "Support role updated.");
  }

  async function linkAccessibilityIssue(issue_type) {
    if (!accessibilityTicketId.trim()) {
      setError("Enter the ticket ID before linking an accessibility issue.");
      return;
    }
    await run(`accessibility-${issue_type}`, () => api("/accessibility/issues", "POST", { issue_type, ticket_id: accessibilityTicketId.trim(), details: accessibilityDetails }), "Accessibility issue linked to the ticket.");
    setAccessibilityDetails("");
  }

  async function planQuery(checkout) {
    await run(`query-${checkout.id}`, () => api(`/plans/${encodeURIComponent(checkout.checkout_request_id || checkout.id)}/query`, "POST", {}), "Safaricom status query completed.");
  }

  async function sendRetryLink(checkout) {
    const ticket_id = window.prompt("Enter the ticket ID containing the customer's retry request:");
    if (!ticket_id) return;
    const reason = window.prompt("Record why the customer requested a fresh STK push:");
    if (!reason || reason.trim().length < 8) return;
    if (!window.confirm("Confirm the customer explicitly requested a fresh STK push. They will receive a link and must sign in and confirm before Safaricom is contacted.")) return;
    await run(`retry-${checkout.id}`, () => api(`/plans/${encodeURIComponent(checkout.checkout_request_id || checkout.id)}/retry-link`, "POST", { ticket_id, reason, user_requested: true }), "Secure retry confirmation link sent to the customer.");
  }

  async function requestActivation(checkout) {
    const receipt = window.prompt("Enter the M-Pesa receipt number supplied by the user:");
    if (!receipt) return;
    const reason = window.prompt("Explain why manual review is required (at least 10 characters):");
    if (!reason || reason.trim().length < 10) return;
    await run(`activate-${checkout.id}`, () => api(`/plans/${encodeURIComponent(checkout.checkout_request_id || checkout.id)}/manual-activation-request`, "POST", { receipt, reason }), "Request sent to the Support Admin approval queue. No plan was activated.");
  }

  async function ticketReply(ticket, language = "en") {
    const message = window.prompt("Reply to the user:", CANNED[language] || CANNED.en);
    if (!message || !message.trim()) return;
    await run(`reply-${ticket.id}`, () => api(`/tickets/${encodeURIComponent(ticket.id)}/reply`, "POST", { message }), "Reply accepted by the email provider.");
  }

  async function updateTicketStatus(ticket, status) {
    await run(`ticket-status-${ticket.id}`, () => api(`/tickets/${encodeURIComponent(ticket.id)}/status`, "PATCH", { status }), `Ticket marked ${status}.`);
  }

  async function addNote(ticket) {
    const note = window.prompt("Internal note (not sent to the user):");
    if (!note || !note.trim()) return;
    await run(`note-${ticket.id}`, () => api(`/tickets/${encodeURIComponent(ticket.id)}/notes`, "POST", { note }), "Internal note saved.");
  }

  async function invitationAction(invitation, action) {
    await run(`invite-${invitation.id}`, () => action === "revoke"
      ? api(`/invitations/${encodeURIComponent(invitation.id)}`, "DELETE")
      : api(`/invitations/${encodeURIComponent(invitation.id)}/resend`, "POST", {}), `Invitation ${action} completed.`);
  }

  async function approvalDecision(item, decision) {
    const reason = window.prompt(`Reason for ${decision}:`);
    if (!reason || reason.trim().length < 8) return;
    await run(`approval-${item.id}`, () => api(`/approvals/${encodeURIComponent(item.id)}/decision`, "POST", { decision, reason }), "Approval decision recorded.");
  }

  async function createPayroll(event) {
    event.preventDefault();
    await run("payroll", () => api("/payroll", "POST", payroll), "Payroll record created as pending.");
    setPayroll({ member_id: "", rate: "", period_start: "", period_end: "", bonus: "0", bonus_reason: "", deduction: "0", deduction_reason: "", payment_method: "manual" });
  }

  async function updatePayrollRecord(record, status) {
    const payment_reference = status === "paid" ? window.prompt("Enter the manual payout reference:") : undefined;
    if (status === "paid" && !payment_reference?.trim()) return;
    await run(`payroll-${record.id}`, () => api(`/payroll/${encodeURIComponent(record.id)}`, "PATCH", { status, ...(payment_reference ? { payment_reference } : {}) }), `Payroll marked ${status}.`);
  }

  async function downloadPayroll(format) {
    setBusy("payroll-export");
    setError("");
    try {
      const month = window.prompt("Statement month (YYYY-MM):", new Date().toISOString().slice(0, 7));
      if (!month || !/^\d{4}-\d{2}$/.test(month)) return;
      const token = typeof getAccessToken === "function" ? await getAccessToken() : "";
      const tokenType = typeof getTokenType === "function" ? await getTokenType() : "Bearer";
      const response = await authFetch(`${resolveAdminBackendUrl()}/api/support-center/payroll/export.${format}?month=${encodeURIComponent(month)}`, {
        headers: token ? { Authorization: (tokenType || "Bearer") + " " + String(token).replace(/^Bearer\s+/i, "") } : {},
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Statement export failed.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `revelacode-support-payroll-${month}.${format}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Statement export failed.");
    } finally {
      setBusy("");
    }
  }

  const seats = data.team?.seats || {};
  const members = data.team?.members || [];
  const invitations = data.invites?.invitations || [];
  const checkouts = data.plans?.checkouts || [];
  const tickets = data.tickets?.tickets || [];
  const inbox = data.inbox?.tickets || [];
  const payrollRows = data.payments?.records || [];
  const auditRows = data.audit?.events || [];
  const approvals = data.approvals?.approvals || [];
  const health = data.health?.checks || {};

  return (
    <section className="space-y-5 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">RevelaCode · Support Operations</p>
          <h2 className="mt-1 text-xl font-black sm:text-2xl">Support Team Control Center</h2>
          <p className="mt-1 text-sm text-slate-500">Least-privilege tools for customer support, account access and team operations.</p>
        </div>
        <button type="button" onClick={() => load()} disabled={loading} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-900"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button>
      </div>

      <nav aria-label="Support Center sections" className="flex gap-2 overflow-x-auto pb-1">
        {visibleTabs.map(([key, label, Icon]) => (
          <button key={key} type="button" onClick={() => setView(key)} aria-current={view === key ? "page" : undefined} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 ${view === key ? "bg-emerald-700 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"}`}><Icon size={16} />{label}</button>
        ))}
      </nav>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
      {loading && <div role="status" className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950">Loading {view}…</div>}

      {view === "inbox" && <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"><header className="border-b border-slate-100 p-4 dark:border-slate-800"><h3 className="font-bold">Support Inbox</h3><p className="text-sm text-slate-500">Messages received at the configured support address.</p></header>{inbox.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{inbox.map(x => <article key={x.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div><strong className="text-sm">{x.ticket_number} · {x.subject}</strong><p className="text-xs text-slate-500">{x.email} · {when(x.updated_at)}</p></div><Status value={x.status} /></article>)}</div> : <p className="p-5 text-sm text-slate-500">No inbound support emails yet.</p>}</section>}

      {view === "tickets" && <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"><header className="border-b border-slate-100 p-4 dark:border-slate-800"><h3 className="font-bold">Ticket queue</h3><p className="text-sm text-slate-500">Agents see assigned and unassigned work. Support Admins supervise the queue.</p></header>{tickets.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{tickets.map(x => <article key={x.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><strong className="break-words text-sm">{x.ticket_number} · {x.subject}</strong><p className="text-xs text-slate-500">{x.priority} priority · {when(x.updated_at)}</p></div><div className="flex flex-wrap items-center gap-2"><Status value={x.status} /><button type="button" onClick={() => ticketReply(x, "en")} className="min-h-9 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white">Reply · EN</button><button type="button" onClick={() => ticketReply(x, "sw")} className="min-h-9 rounded-lg border border-emerald-200 px-3 text-xs font-semibold text-emerald-700">Jibu · SW</button><button type="button" onClick={() => addNote(x)} className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold dark:border-slate-700">Internal note</button>{x.status !== "solved" && <button type="button" onClick={() => updateTicketStatus(x, "solved")} className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs dark:border-slate-700">Mark solved</button>}</div></article>)}</div> : <p className="p-5 text-sm text-slate-500">No tickets in this queue.</p>}</section>}

      {view === "plans" && <section className="space-y-3">{checkouts.length ? checkouts.map(x => <article key={x.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><strong>{x.hub} · {x.plan_code}</strong><p className="text-sm text-slate-500">{x.currency} {x.amount} · {x.phone} · {when(x.created_at)}</p></div><Status value={x.status} /></div><p className="mt-2 text-xs text-slate-500">Checkout reference: {x.checkout_request_id || "Not issued by Safaricom"}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={!!busy} onClick={() => planQuery(x)} className="min-h-9 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white disabled:opacity-50">Run STK Query</button><button type="button" disabled={!!busy} onClick={() => sendRetryLink(x)} className="min-h-9 rounded-lg border border-emerald-200 px-3 text-xs font-semibold text-emerald-700 disabled:opacity-50">Send retry confirmation</button><button type="button" disabled={!!busy} onClick={() => requestActivation(x)} className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold dark:border-slate-700 disabled:opacity-50">Request manual review</button></div></article>) : <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950">No pending or failed plan checkouts.</p>}</section>}

      {view === "verification" && <form onSubmit={resendVerification} className="max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><h3 className="font-bold">Resend account verification</h3><p className="text-sm text-slate-500">Search by email or phone. Contact details are masked in responses. Maximum three email resends per account per hour. The verification code is never shown to staff.</p><label className="block text-sm font-medium">User email or phone<input value={lookup} onChange={e => setLookup(e.target.value)} required className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900" placeholder="Email address or phone number" /></label><div className="flex flex-wrap gap-2"><button type="button" onClick={searchVerification} disabled={busy === "verification-search" || !lookup.trim()} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold dark:border-slate-700 disabled:opacity-50">Search account status</button><button disabled={busy === "verification" || !lookup.trim() || verificationAccount?.verified === true || verificationAccount?.email_available === false} className="min-h-11 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50">Resend verification</button></div>{verificationAccount && <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900"><p>Verification: <strong>{verificationAccount.verified ? "Verified" : "Not verified"}</strong> · Account: {verificationAccount.status}</p><p className="mt-1 text-xs text-slate-500">Email {verificationAccount.email || "unavailable"} · Phone {verificationAccount.phone || "unavailable"}</p></div>}</form>}

      {view === "invites" && isAdmin && <div className="space-y-4"><form onSubmit={createInvite} className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:grid-cols-4"><label className="text-sm">Full name<input required value={invite.full_name} onChange={e => setInvite(x => ({...x, full_name:e.target.value}))} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-transparent px-2" /></label><label className="text-sm">Email<input required type="email" value={invite.email} onChange={e => setInvite(x => ({...x, email:e.target.value}))} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-transparent px-2" /></label><label className="text-sm">Role<select value={invite.role} onChange={e => setInvite(x => ({...x, role:e.target.value}))} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-transparent px-2"><option value="support_agent">Support Agent</option>{role === "super_admin" && <option value="support_admin">Support Admin</option>}</select></label><button className="mt-5 min-h-10 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white">Send invitation</button></form><section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"><header className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800"><div><h3 className="font-bold">Support invitations</h3><p className="text-xs text-slate-500">Single-use links expire after 48 hours.</p></div><span className="text-sm font-semibold">{seats.used || 0} of 3 Support Admin seats used</span></header>{(data.invites?.invitations || data.team?.invitations || invitations).map(x => <article key={x.id} className="flex flex-col gap-2 border-b border-slate-100 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"><div><strong className="text-sm">{x.name || "Invitation"} · {x.role}</strong><p className="text-xs text-slate-500">{x.email} · expires {when(x.expires_at)}</p></div><div className="flex items-center gap-2"><Status value={x.status} /><button type="button" onClick={() => invitationAction(x, "resend")} className="min-h-8 rounded-lg border px-2 text-xs">Resend</button><button type="button" onClick={() => invitationAction(x, "revoke")} className="min-h-8 rounded-lg border px-2 text-xs">Revoke</button></div></article>)}</section></div>}

      {view === "health" && <div className="space-y-5">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{Object.entries(health).map(([key, item]) => <article key={key} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center justify-between"><h3 className="font-bold capitalize">{key.replaceAll("_", " ")}</h3><Status value={item?.status} /></div><p className="mt-2 text-xs text-slate-500">{item?.provider || item?.web || item?.android || (item?.status === "not_configured" ? "Provider not configured" : "")}</p></article>)}{!Object.keys(health).length && <p className="rounded-xl border p-5 text-sm text-slate-500">No health checks returned.</p>}</section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><h3 className="font-bold">Accessibility issue checklist</h3><p className="mt-1 text-sm text-slate-500">Link each reported problem to its support ticket so it can be tracked and resolved.</p><div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3"><label className="text-xs sm:col-span-1">Ticket ID<input value={accessibilityTicketId} onChange={e => setAccessibilityTicketId(e.target.value)} className="mt-1 min-h-10 w-full rounded-lg border bg-transparent px-2" placeholder="Mongo ticket ID" /></label><label className="text-xs sm:col-span-2">Details<input value={accessibilityDetails} onChange={e => setAccessibilityDetails(e.target.value)} className="mt-1 min-h-10 w-full rounded-lg border bg-transparent px-2" placeholder="Optional diagnostic notes" /></label></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => linkAccessibilityIssue("cannot_login")} className="min-h-9 rounded-lg border px-3 text-xs">Cannot log in</button><button type="button" onClick={() => linkAccessibilityIssue("cannot_pay")} className="min-h-9 rounded-lg border px-3 text-xs">Cannot pay</button><button type="button" onClick={() => linkAccessibilityIssue("cannot_open_hub")} className="min-h-9 rounded-lg border px-3 text-xs">Cannot open a hub</button></div><div className="mt-4 space-y-2">{(data.accessibility?.issues || []).map(issue => <div key={issue.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-900"><span>{issue.issue_type.replaceAll("_", " ")} · {issue.ticket_number || issue.ticket_id}</span><span className="text-slate-500">{when(issue.created_at)}</span></div>)}</div></section>
      </div>}

      {view === "team" && isAdmin && <div className="space-y-4"><div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><article className="rounded-xl border bg-white p-4 dark:bg-slate-950 dark:border-slate-800"><p className="text-xs text-slate-500">Support Admin seats</p><strong className="text-2xl">{seats.used || 0} / 3</strong></article><article className="rounded-xl border bg-white p-4 dark:bg-slate-950 dark:border-slate-800"><p className="text-xs text-slate-500">Active Support Admins</p><strong className="text-2xl">{seats.active || 0}</strong></article><article className="rounded-xl border bg-white p-4 dark:bg-slate-950 dark:border-slate-800"><p className="text-xs text-slate-500">Pending invitations</p><strong className="text-2xl">{seats.pending || 0}</strong></article></div><section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">{members.map(m => <article key={m.id} className="flex flex-col gap-3 border-b border-slate-100 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"><div><strong>{m.full_name}</strong><p className="text-xs text-slate-500">{m.email} · {m.phone}</p><p className="mt-1 text-xs"><Status value={m.status} /> <span className="ml-2">{m.role}</span></p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => changeRole(m)} className="min-h-9 rounded-lg border px-3 text-xs">Change role</button>{["ban","suspend","remove"].map(action => <button key={action} type="button" onClick={() => memberAction(m, action)} className="min-h-9 rounded-lg border border-rose-200 px-3 text-xs text-rose-700">{action}</button>)}{["banned","suspended"].includes(m.status) && <button type="button" onClick={() => memberAction(m, "restore")} className="min-h-9 rounded-lg border border-emerald-200 px-3 text-xs text-emerald-700">Restore</button>}</div></article>)}</section></div>}

      {view === "payments" && isAdmin && <div className="space-y-4">
        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => downloadPayroll("csv")} disabled={busy === "payroll-export"} className="min-h-9 rounded-lg border px-3 text-xs font-semibold dark:border-slate-700">Export monthly CSV</button><button type="button" onClick={() => downloadPayroll("pdf")} disabled={busy === "payroll-export"} className="min-h-9 rounded-lg border px-3 text-xs font-semibold dark:border-slate-700">Export monthly PDF</button></div>
        {role === "support_admin" && <form onSubmit={createPayroll} className="grid grid-cols-1 gap-3 rounded-2xl border bg-white p-4 dark:bg-slate-950 dark:border-slate-800 sm:grid-cols-4">
          <label className="text-xs">Member ID<input required value={payroll.member_id} onChange={e => setPayroll(x => ({...x,member_id:e.target.value}))} className="mt-1 min-h-10 w-full rounded-lg border bg-transparent px-2" /></label>
          <label className="text-xs">Rate (KES)<input required type="number" min="0" step="0.01" value={payroll.rate} onChange={e => setPayroll(x => ({...x,rate:e.target.value}))} className="mt-1 min-h-10 w-full rounded-lg border bg-transparent px-2" /></label>
          <label className="text-xs">Period start<input required type="date" value={payroll.period_start} onChange={e => setPayroll(x => ({...x,period_start:e.target.value}))} className="mt-1 min-h-10 w-full rounded-lg border bg-transparent px-2" /></label>
          <label className="text-xs">Period end<input required type="date" value={payroll.period_end} onChange={e => setPayroll(x => ({...x,period_end:e.target.value}))} className="mt-1 min-h-10 w-full rounded-lg border bg-transparent px-2" /></label>
          <label className="text-xs">Bonus (KES)<input type="number" min="0" step="0.01" value={payroll.bonus} onChange={e => setPayroll(x => ({...x,bonus:e.target.value}))} className="mt-1 min-h-10 w-full rounded-lg border bg-transparent px-2" /></label>
          <label className="text-xs">Bonus reason<input value={payroll.bonus_reason} onChange={e => setPayroll(x => ({...x,bonus_reason:e.target.value}))} className="mt-1 min-h-10 w-full rounded-lg border bg-transparent px-2" /></label>
          <label className="text-xs">Deduction (KES)<input type="number" min="0" step="0.01" value={payroll.deduction} onChange={e => setPayroll(x => ({...x,deduction:e.target.value}))} className="mt-1 min-h-10 w-full rounded-lg border bg-transparent px-2" /></label>
          <label className="text-xs">Deduction reason<input value={payroll.deduction_reason} onChange={e => setPayroll(x => ({...x,deduction_reason:e.target.value}))} className="mt-1 min-h-10 w-full rounded-lg border bg-transparent px-2" /></label>
          <button className="min-h-10 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white sm:col-span-4">Create payroll record</button>
        </form>}
        {role === "super_admin" && <p className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950">Super Admin view is read-only. Support Admins create, approve and record payouts.</p>}
        <section className="rounded-2xl border bg-white dark:bg-slate-950 dark:border-slate-800">{payrollRows.map(x => <article key={x.id} className="flex flex-col gap-2 border-b p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"><div><strong>{x.member_name}</strong><p className="text-xs text-slate-500">{when(x.period_start)} – {when(x.period_end)} · {x.tasks_count} resolved tickets · KES {x.rate} · Bonus {x.bonus || 0} · Deduction {x.deduction || 0}</p><p className="text-xs text-slate-500">Method: {x.payment_method || "manual"} · Reference: {x.payment_reference || "—"}</p></div><div className="flex items-center gap-2"><Status value={x.status} />{role === "support_admin" && x.status === "pending" && <button type="button" onClick={() => updatePayrollRecord(x, "approved")} className="min-h-8 rounded-lg border px-2 text-xs">Approve</button>}{role === "support_admin" && x.status === "approved" && <button type="button" onClick={() => updatePayrollRecord(x, "paid")} className="min-h-8 rounded-lg border px-2 text-xs">Mark paid</button>}</div></article>)}</section>
      </div>}

      {view === "audit" && isAdmin && <section className="space-y-2">{auditRows.map(x => <article key={x.sequence} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">#{x.sequence} · {x.action}</strong><span className="text-xs text-slate-500">{when(x.created_at)}</span></div><p className="mt-1 text-xs text-slate-500">Actor {x.actor_id} · {x.actor_role} · {x.target_type} {x.target_id} · IP {x.ip || "—"}</p><p className="mt-1 break-all text-[10px] text-slate-400">Hash: {x.event_hash}</p></article>)}</section>}

      {view === "approvals" && isAdmin && <section className="space-y-3">{approvals.map(x => <article key={x.id} className="rounded-xl border bg-white p-4 dark:bg-slate-950 dark:border-slate-800"><strong>Checkout {x.checkout_id}</strong><p className="mt-1 text-sm text-slate-500">Receipt {x.receipt} · Requested by {x.requested_by}</p><p className="mt-1 text-sm">{x.reason}</p>{role === "support_admin" ? <div className="mt-3 flex gap-2"><button type="button" onClick={() => approvalDecision(x, "approve")} className="min-h-9 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white">Approve after Daraja check</button><button type="button" onClick={() => approvalDecision(x, "reject")} className="min-h-9 rounded-lg border border-rose-200 px-3 text-xs text-rose-700">Reject</button></div> : <p className="mt-3 text-xs text-slate-500">Super Admin view only. A Support Admin must make the decision.</p>}</article>)}{!approvals.length && <p className="rounded-xl border p-5 text-sm text-slate-500">No pending approval requests.</p>}</section>}
    </section>
  );
}
