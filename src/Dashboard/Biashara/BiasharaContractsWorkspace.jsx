import React, { useCallback, useEffect, useState } from "react";
import { Activity, ArrowLeftRight, CheckCircle2, CircleDollarSign, Loader2, Plus, RefreshCw, ShieldCheck, Users, Zap } from "lucide-react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

const panel = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const field = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";
const button = "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50";
const titles = {
  finance: ["Finance", "Invoice records and owner-entered payment allocations. Allocations are unverified until reconciled against a trusted payment source."],
  automations: ["Automations", "Configure supported rules. Rules are stored as configuration; a worker must be installed before actions execute."],
  sync: ["Sync Centre", "Track sync requests. Requests remain queued until a compatible worker processes them."],
  team: ["Team management", "Manage pending invitations and existing memberships for your verified business."],
  "business-switch": ["Business switching", "Select from businesses owned by your signed-in account."],
};

function rowsOf(result, key) {
  if (Array.isArray(result)) return result;
  return result?.[key] || result?.data?.[key] || result?.data || result?.items || [];
}
function errorText(error) {
  return error?.message || error?.error || "Request failed. Please retry.";
}
function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "biashara-" + Date.now() + "-" + Math.random().toString(36).slice(2);
}
function unwrap(value) {
  return value?.data?.data ?? value?.data ?? value?.result ?? value;
}

export default function BiasharaContractsWorkspace({ route, business, onRefresh }) {
  const api = useJumuiyaApi();
  const businessId = String(business?.id || business?._id || "");
  const [rows, setRows] = useState([]);
  const [paymentPhones, setPaymentPhones] = useState({});
  const [paymentKeys, setPaymentKeys] = useState({});
  const [paymentStates, setPaymentStates] = useState({});
  const [paymentLoading, setPaymentLoading] = useState({});
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ customer_name: "", due_date: "", description: "", quantity: "1", unit_price: "", currency: "KES", email: "", role: "sales", name: "", trigger: "low_stock", action: "create_alert", source: "csv_import", direction: "pull" });
  const title = titles[route] || titles.finance;
  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));

  const load = useCallback(async () => {
    setLoading(true); setError(""); setNotice("");
    try {
      let response;
      if (route === "finance") { response = await api.getBiasharaInvoices(businessId); setRows(rowsOf(response, "invoices")); }
      else if (route === "automations") { response = await api.getBiasharaAutomationRules(businessId); setRows(rowsOf(response, "rules")); }
      else if (route === "sync") { response = await api.getBiasharaSyncJobs(businessId); }
      else if (route === "team") { response = await api.getBiasharaTeam(businessId); const members = rowsOf(response, "members").map((row) => ({ ...row, record_type: "member" })); const invitations = rowsOf(response, "invitations").map((row) => ({ ...row, record_type: "invitation" })); setRows([...members, ...invitations]); }
      else if (route === "business-switch") { response = await api.getBiasharaBusinesses(); setBusinesses(rowsOf(response, "businesses")); setRows(rowsOf(response, "businesses")); }
    } catch (e) { setRows([]); setError(errorText(e)); }
    finally { setLoading(false); }
  }, [api, businessId, route]);

  useEffect(() => { setForm({ customer_name: "", due_date: "", description: "", quantity: "1", unit_price: "", currency: "KES", email: "", role: "sales_agent", name: "", trigger: "low_stock", action: "create_alert", source: "csv_import", direction: "pull" }); load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      if (route === "finance") {
        await api.createBiasharaInvoice(businessId, { customer_name: form.customer_name, currency: form.currency, due_date: form.due_date, items: [{ description: form.description, quantity: Number(form.quantity), unit_price: Number(form.unit_price) }] });
        setNotice("Invoice recorded. This did not process a payment.");
      } else if (route === "automations") {
        await api.createBiasharaAutomationRule(businessId, { name: form.name, trigger: form.trigger, action: form.action, enabled: false });
        setNotice("Rule saved as configuration. Execution is not active without a configured worker.");
      } else if (route === "sync") {
        await api.createBiasharaSyncJob(businessId, { source: form.source, direction: form.direction });
        setNotice("Sync request queued. No external synchronization has run yet.");
      } else if (route === "team") {
        await api.inviteBiasharaTeamMember(businessId, { email: form.email, role: form.role });
        setNotice("Invitation record created. Email delivery is not configured, so no email was sent.");
      }
      await load();
    } catch (e) { setError(errorText(e)); }
    finally { setSaving(false); }
  };

  const checkInvoicePayment = async (invoice) => {
    const id = String(invoice.id || invoice._id || "");
    if (!id) return;
    setPaymentLoading((old) => ({ ...old, [id]: true }));
    setError("");
    try {
      const response = await api.getBiasharaInvoiceMpesaStatus(businessId, id);
      const payload = unwrap(response) || {};
      const latest = Array.isArray(payload.checkouts) ? payload.checkouts[0] : null;
      setPaymentStates((old) => ({ ...old, [id]: latest || { status: "not_started", message: "No M-Pesa checkout exists for this invoice." } }));
      if (latest?.status === "failed" || latest?.status === "initiation_failed") {
        setPaymentKeys((old) => ({ ...old, [id]: "" }));
      }
    } catch (e) {
      setError(errorText(e));
    } finally {
      setPaymentLoading((old) => ({ ...old, [id]: false }));
    }
  };

  const startInvoicePayment = async (invoice) => {
    const id = String(invoice.id || invoice._id || "");
    if (!id) return;
    const phone = String(paymentPhones[id] || "").trim();
    if (!phone) {
      setError("Enter the Kenyan M-Pesa phone number for this invoice.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    setPaymentLoading((old) => ({ ...old, [id]: true }));
    try {
      const previous = paymentStates[id]?.status;
      const reusable = !["failed", "initiation_failed"].includes(previous);
      const key = reusable && paymentKeys[id] ? paymentKeys[id] : newIdempotencyKey();
      setPaymentKeys((old) => ({ ...old, [id]: key }));
      const response = await api.startBiasharaInvoiceMpesa(businessId, id, phone, key);
      const checkout = unwrap(response) || {};
      setPaymentStates((old) => ({ ...old, [id]: checkout }));
      setNotice(response?.message || checkout?.message || "M-Pesa checkout submitted. The invoice remains unpaid until Daraja reconciliation succeeds.");
    } catch (e) {
      setError(errorText(e));
      if (e?.code === "mpesa_submission_unknown") {
        setPaymentStates((old) => ({ ...old, [id]: { ...(old[id] || {}), status: "submission_unknown", message: errorText(e) } }));
      }
    } finally {
      setSaving(false);
      setPaymentLoading((old) => ({ ...old, [id]: false }));
    }
  };

  const refreshInvoicePayment = async (invoice) => {
    const id = String(invoice.id || invoice._id || "");
    if (!id) return;
    setSaving(true);
    setPaymentLoading((old) => ({ ...old, [id]: true }));
    setError("");
    try {
      const response = await api.refreshBiasharaInvoiceMpesa(businessId, id);
      const checkout = unwrap(response) || {};
      setPaymentStates((old) => ({ ...old, [id]: checkout }));
      setNotice(response?.message || checkout?.message || "Daraja reconciliation status refreshed.");
      await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
      setPaymentLoading((old) => ({ ...old, [id]: false }));
    }
  };

  const switchBusiness = async (id) => {
    setSaving(true); setError(""); setNotice("");
    try {
      const result = await api.setActiveBiasharaBusiness(id);
      setNotice(result?.message || "Active business preference saved. Refresh the workspace to reload business data.");
      await onRefresh?.();
      await load();
    } catch (e) { setError(errorText(e)); }
    finally { setSaving(false); }
  };

  const inviteRoles = ["director", "operations_manager", "hr_manager", "accountant", "store_keeper", "factory_floor_lead", "sales_agent", "employee", "manager", "sales", "inventory", "viewer"];
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white sm:p-8">
        <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10"><ShieldCheck size={22} /></span><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Biashara OS · Workspace contracts</p><h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title[0]}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{title[1]}</p><p className="mt-3 text-xs text-slate-400">Business: {business?.name || business?.business_name || "Current business"}</p></div></div>
      </header>
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}
      {notice ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</div> : null}

      {route === "finance" ? <form onSubmit={submit} className={panel}>
        <h2 className="flex items-center gap-2 font-bold text-slate-900"><CircleDollarSign size={18} /> Create invoice</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input className={field} required placeholder="Customer name" value={form.customer_name} onChange={e => update("customer_name", e.target.value)} />
          <input className={field} required placeholder="Item description" value={form.description} onChange={e => update("description", e.target.value)} />
          <input className={field} required type="number" min="0.01" step="0.01" placeholder="Unit price" value={form.unit_price} onChange={e => update("unit_price", e.target.value)} />
          <input className={field} required type="number" min="0.01" step="any" placeholder="Quantity" value={form.quantity} onChange={e => update("quantity", e.target.value)} />
          <select className={field} value={form.currency} onChange={e => update("currency", e.target.value)}><option>KES</option><option>USD</option><option>EUR</option><option>GBP</option><option>TZS</option><option>UGX</option></select>
          <input className={field} type="date" value={form.due_date} onChange={e => update("due_date", e.target.value)} />
        </div>
        <button className={button} disabled={saving} type="submit"><Plus size={16} />{saving ? "Saving…" : "Create invoice"}</button>
      </form> : null}

      {route === "automations" ? <form onSubmit={submit} className={panel}>
        <h2 className="flex items-center gap-2 font-bold text-slate-900"><Zap size={18} /> Create automation rule</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input className={field} required maxLength={120} placeholder="Rule name" value={form.name} onChange={e => update("name", e.target.value)} />
          <select className={field} value={form.trigger} onChange={e => update("trigger", e.target.value)}><option value="low_stock">Low stock</option><option value="order_created">Order created</option><option value="invoice_overdue">Invoice overdue</option><option value="daily_summary">Daily summary</option></select>
          <select className={field} value={form.action} onChange={e => update("action", e.target.value)}><option value="create_alert">Create alert</option><option value="create_task">Create task</option><option value="daily_summary">Daily summary</option></select>
          <button className={button} disabled={saving} type="submit"><Plus size={16} />Save rule</button>
        </div>
      </form> : null}

      {route === "sync" ? <form onSubmit={submit} className={panel}>
        <h2 className="flex items-center gap-2 font-bold text-slate-900"><RefreshCw size={18} /> Queue a sync request</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <select className={field} value={form.source} onChange={e => update("source", e.target.value)}><option value="csv_import">CSV import</option><option value="website">Website</option><option value="inventory">Inventory</option><option value="orders">Orders</option></select>
          <select className={field} value={form.direction} onChange={e => update("direction", e.target.value)}><option value="pull">Pull</option><option value="push">Push</option><option value="bidirectional">Bidirectional</option></select>
          <button className={button} disabled={saving} type="submit"><Plus size={16} />Queue sync</button>
        </div>
      </form> : null}

      {route === "team" ? <form onSubmit={submit} className={panel}>
        <h2 className="flex items-center gap-2 font-bold text-slate-900"><Users size={18} /> Invite team member</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input className={field} required type="email" placeholder="Member email" value={form.email} onChange={e => update("email", e.target.value)} />
          <select className={field} value={form.role} onChange={e => update("role", e.target.value)}>{inviteRoles.map(role => <option key={role} value={role}>{role[0].toUpperCase() + role.slice(1)}</option>)}</select>
          <button className={button} disabled={saving} type="submit"><Plus size={16} />Create invitation</button>
        </div>
      </form> : null}

      {route === "business-switch" ? <section className={panel}><h2 className="flex items-center gap-2 font-bold text-slate-900"><ArrowLeftRight size={18} /> Businesses you own</h2><p className="mt-1 text-xs text-slate-500">Selection is saved as a preference. The existing legacy APIs still resolve the primary owner business.</p>{businesses.map((item) => <div key={item.id || item._id} className="mt-3 flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">{item.name || item.business_name || "Business"}</p><p className="mt-1 text-xs text-slate-500">{item.verification_status || "status unavailable"} · {item.status || "status unavailable"}</p></div><button className={button} type="button" disabled={saving || String(item.id || item._id) === String(business?.id || business?._id)} onClick={() => switchBusiness(item.id || item._id)}>{String(item.id || item._id) === String(business?.id || business?._id) ? "Current business" : "Set active"}</button></div>)}</section> : null}

      <section className={panel}>
        <div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900">{route === "finance" ? "Invoices" : route === "automations" ? "Saved rules" : route === "sync" ? "Sync job history" : route === "team" ? "Current memberships" : "Business list"}</h2><p className="mt-1 text-xs text-slate-500">{rows.length} record(s) · scoped to the authenticated business owner</p></div><button type="button" onClick={load} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700"><RefreshCw size={15} />Refresh</button></div>
        {loading ? <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" />Loading records…</div> : rows.length ? <div className="mt-3 divide-y divide-slate-100">{rows.map((row, i) => {
          const rowId = String(row.id || row._id || "");
          const paid = Number(row.allocated_amount || 0);
          const total = Number(row.total || 0);
          const outstanding = Math.max(0, total - paid);
          const mpesa = paymentStates[rowId];
          const canStk = route === "finance" && String(row.currency || "KES").toUpperCase() === "KES" && outstanding > 0;
          return <article key={rowId || i} className="flex flex-col gap-3 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold text-slate-900">{row.invoice_number || row.name || row.email || row.source || row.business_name || row.id || "Record"}</p>
                <p className="mt-1 break-words text-xs text-slate-500">{row.customer_name || row.trigger || row.direction || row.role || row.status || row.message || (row.record_type === "invitation" ? "Invitation pending" : "")}</p>
                {route === "finance" ? <p className="mt-1 text-xs text-slate-500">Outstanding: <strong className="text-slate-800">{row.currency || "KES"} {outstanding.toFixed(2)}</strong> · Allocated: {row.allocated_amount || "0.00"}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                {row.total ? <span className="font-bold">{row.currency || "KES"} {row.total}</span> : null}
                {row.status ? <span className="rounded-full bg-slate-100 px-2.5 py-1">{row.status}</span> : null}
                {route === "automations" ? <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-semibold text-amber-800">Worker unavailable</span> : null}
                {row.delivery_status ? <span>{row.delivery_status}</span> : null}
                {row.record_type === "invitation" ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">Pending invitation</span> : null}
              </div>
            </div>
            {canStk ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">M-Pesa STK Push</p>
                  <p className="text-xs text-slate-500">The invoice is not marked paid until the Daraja callback is queried and its receipt is validated.</p>
                </div>
                {mpesa?.status ? <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-slate-700">{String(mpesa.status).replace(/_/g, " ")}</span> : null}
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input className={field} type="tel" inputMode="tel" placeholder="M-Pesa number e.g. 0712345678" value={paymentPhones[rowId] || ""} onChange={e => setPaymentPhones(old => ({ ...old, [rowId]: e.target.value }))} aria-label={"M-Pesa phone for " + row.invoice_number} />
                <button type="button" className={button} disabled={saving || paymentLoading[rowId] || (mpesa && !["failed", "initiation_failed"].includes(mpesa.status))} onClick={() => startInvoicePayment(row)}>
                  {paymentLoading[rowId] ? <Loader2 size={15} className="animate-spin" /> : <CircleDollarSign size={15} />}
                  {mpesa && !["failed", "initiation_failed"].includes(mpesa.status) ? "Checkout started" : "Send STK"}
                </button>
                <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50" disabled={saving || paymentLoading[rowId]} onClick={() => checkInvoicePayment(row)}>
                  <RefreshCw size={15} /> Check status
                </button>
                {mpesa?.checkout_request_id ? <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50" disabled={saving || paymentLoading[rowId]} onClick={() => refreshInvoicePayment(row)}>
                  <RefreshCw size={15} /> Reconcile
                </button> : null}
              </div>
              {mpesa?.status_message || mpesa?.message ? <p className="mt-2 text-xs leading-5 text-slate-600">{mpesa.status_message || mpesa.message}</p> : null}
              {mpesa?.provider_receipt ? <p className="mt-1 font-mono text-xs text-emerald-700">Receipt: {mpesa.provider_receipt}</p> : null}
            </div> : route === "finance" ? <p className="text-xs text-slate-500">M-Pesa STK Push is available for outstanding KES invoices only.</p> : null}
          </article>;
        })}</div> : <div className="py-10 text-center text-sm text-slate-500">No records returned yet.</div>}
      </section>
      <p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><Activity size={15} className="mt-0.5 shrink-0" />M-Pesa checkout is initiated through the shared Daraja adapter. Invoice settlement remains pending until the provider result, checkout identifiers, amount, phone and receipt have been validated. eTIMS is a separate integration and is not represented as accepted by an M-Pesa payment.</p>
    </div>
  );
}
