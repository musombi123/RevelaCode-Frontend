import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, CreditCard, Plus, RefreshCw, Save, Trash2, Wallet, XCircle } from "lucide-react";

function unwrap(value) {
  let current = value;
  for (let index = 0; index < 5; index += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return current;
    if (Object.prototype.hasOwnProperty.call(current, "data")) { current = current.data; continue; }
    if (Object.prototype.hasOwnProperty.call(current, "result")) { current = current.result; continue; }
    return current;
  }
  return current;
}

function rowsFrom(value, key) {
  const data = unwrap(value);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.records)) return data.records;
  return [];
}

function money(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 2 }).format(Number.isFinite(number) ? number : 0);
}

function dateTime(value) {
  if (!value) return "Date not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("en-KE");
}

function Field({ label, value, onChange, placeholder = "", maxLength = 160, type = "text" }) {
  return <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}
    <input type={type} maxLength={maxLength} value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
  </label>;
}

export default function ElimuFinanceControls({ api, role, onNotice, onError }) {
  const [accounts, setAccounts] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [notes, setNotes] = useState({});
  const [localError, setLocalError] = useState("");
  const isFinanceManager = ["owner", "bursar"].includes(String(role || "").toLowerCase());

  const load = useCallback(async () => {
    setLoading(true);
    setLocalError("");
    try {
      const [accountsResult, receiptsResult] = await Promise.allSettled([
        api.getSchoolPaymentAccounts(),
        isFinanceManager ? api.getSchoolFeeReceipts({ status: "pending" }) : Promise.resolve({ receipts: [] }),
      ]);
      if (accountsResult.status === "fulfilled") setAccounts(rowsFrom(accountsResult.value, "payment_accounts"));
      else throw accountsResult.reason;
      if (receiptsResult.status === "fulfilled") setReceipts(rowsFrom(receiptsResult.value, "receipts"));
      else setReceipts([]);
    } catch (error) {
      setLocalError(error?.message || "Unable to load the school's finance settings.");
    } finally {
      setLoading(false);
    }
  }, [api, isFinanceManager]);

  useEffect(() => { void load(); }, [load]);

  const addAccount = (type) => {
    const suffix = Date.now().toString(36);
    setAccounts((current) => [...current, {
      id: `school-payment-${type}-${suffix}`,
      type,
      label: type === "mpesa" ? "School M-Pesa" : "School bank account",
      account_name: "",
      account_number: "",
      paybill: "",
      till: "",
      bank_name: "",
      branch: "",
      account_reference: "",
      instructions: "",
      currency: "KES",
      active: true,
    }]);
  };

  const updateAccount = (index, key, value) => {
    setAccounts((current) => current.map((account, i) => i === index ? { ...account, [key]: value } : account));
  };

  const saveAccounts = async () => {
    setSaving(true);
    setLocalError("");
    onError?.("");
    onNotice?.("");
    try {
      const result = await api.updateSchoolPaymentAccounts({ payment_accounts: accounts });
      setAccounts(rowsFrom(result, "payment_accounts"));
      onNotice?.("School payment instructions saved. These instructions support receipts; they do not yet initiate or verify online payments.");
    } catch (error) {
      setLocalError(error?.message || "Unable to save payment accounts.");
      onError?.(error?.message || "Unable to save payment accounts.");
    } finally {
      setSaving(false);
    }
  };

  const reviewReceipt = async (receipt, decision) => {
    const id = String(receipt?.id || receipt?._id || receipt?.receipt_id || "");
    if (!id || workingId) return;
    setWorkingId(id);
    setLocalError("");
    onError?.("");
    onNotice?.("");
    try {
      await api.reviewSchoolFeeReceipt(id, { decision, notes: String(notes[id] || "").trim() });
      onNotice?.(decision === "approve" ? "Receipt approved and applied to the fee balance." : "Receipt rejected. The parent will be notified.");
      await load();
    } catch (error) {
      setLocalError(error?.message || "Receipt review failed.");
      onError?.(error?.message || "Receipt review failed.");
    } finally {
      setWorkingId("");
    }
  };

  return <div className="space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><CreditCard size={20}/></span><div><h2 className="text-base font-bold text-slate-950 dark:text-white">School payment instructions</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Add the bank and M-Pesa details parents should use. The same instructions appear on each linked student's parent finance statement.</p></div></div>
        {isFinanceManager && <div className="flex flex-wrap gap-2"><button type="button" onClick={() => addAccount("mpesa")} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"><Plus size={14}/>Add M-Pesa</button><button type="button" onClick={() => addAccount("bank")} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"><Plus size={14}/>Add bank</button></div>}
      </div>

      {loading ? <div className="py-8 text-center text-sm text-slate-500"><RefreshCw size={17} className="mx-auto mb-2 animate-spin"/>Loading finance settings…</div> : accounts.length ? <div className="mt-5 space-y-4">
        {accounts.map((account, index) => <article key={account.id || index} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="mb-4 flex items-start justify-between gap-3"><div className="flex items-start gap-2"><span className="mt-0.5 text-emerald-700 dark:text-emerald-300"><Wallet size={18}/></span><div><h3 className="text-sm font-bold text-slate-900 dark:text-white">{account.label || (account.type === "bank" ? "Bank account" : "M-Pesa account")}</h3><p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{account.type === "bank" ? "Bank transfer" : "M-Pesa"}</p></div></div>{isFinanceManager && <button type="button" aria-label="Remove payment account" onClick={() => setAccounts((current) => current.filter((_, i) => i !== index))} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><Trash2 size={16}/></button>}</div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="Display label" value={account.label} onChange={(value) => updateAccount(index, "label", value)} placeholder="e.g. Main school account"/>
            <Field label="Account name" value={account.account_name} onChange={(value) => updateAccount(index, "account_name", value)} placeholder="School / account holder"/>
            {account.type === "mpesa" ? <>
              <Field label="Paybill number" value={account.paybill} onChange={(value) => updateAccount(index, "paybill", value)} placeholder="Paybill number" maxLength={40}/>
              <Field label="Till number" value={account.till} onChange={(value) => updateAccount(index, "till", value)} placeholder="Till number" maxLength={40}/>
              <Field label="Account / phone number" value={account.account_number} onChange={(value) => updateAccount(index, "account_number", value)} placeholder="Account or phone number" maxLength={100}/>
            </> : <>
              <Field label="Bank name" value={account.bank_name} onChange={(value) => updateAccount(index, "bank_name", value)} placeholder="Bank name"/>
              <Field label="Account number" value={account.account_number} onChange={(value) => updateAccount(index, "account_number", value)} placeholder="Bank account number" maxLength={100}/>
              <Field label="Branch" value={account.branch} onChange={(value) => updateAccount(index, "branch", value)} placeholder="Branch"/>
            </>}
            <Field label="Payment reference / account reference" value={account.account_reference} onChange={(value) => updateAccount(index, "account_reference", value)} placeholder="e.g. student admission number"/>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 sm:col-span-2">Instructions for parents<textarea rows={2} maxLength={500} value={account.instructions || ""} onChange={(event) => updateAccount(index, "instructions", event.target.value)} placeholder="Explain the reference to enter and the receipt to retain." className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"/></label>
            {isFinanceManager && <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"><input type="checkbox" checked={account.active !== false} onChange={(event) => updateAccount(index, "active", event.target.checked)} className="h-4 w-4 rounded border-slate-300"/>Show to parents</label>}
          </div>
          {!isFinanceManager && <p className="mt-2 text-xs text-slate-500">Only the School Owner or Bursar can change payment instructions.</p>}
        </article>)}
        {isFinanceManager && <button type="button" onClick={() => void saveAccounts()} disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">{saving ? <RefreshCw size={15} className="animate-spin"/> : <Save size={15}/>}Save payment instructions</button>}
      </div> : <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-7 text-center dark:border-slate-700"><Wallet size={22} className="mx-auto text-slate-400"/><p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">No payment instructions configured</p><p className="mt-1 text-xs text-slate-500">Add the school's official bank or M-Pesa details to make them visible in the parent portal.</p>{isFinanceManager && <div className="mt-4 flex justify-center gap-2"><button type="button" onClick={() => addAccount("mpesa")} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Add M-Pesa</button><button type="button" onClick={() => addAccount("bank")} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">Add bank</button></div>}</div>}
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"><strong>Payment integration status:</strong> this screen stores payment instructions and supports manual receipt reconciliation. Live online collection, M-Pesa STK push and automated settlement verification are not enabled until a payment provider and verified callback/webhook are configured.</div>
    </section>

    {isFinanceManager && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
      <div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-bold text-slate-950 dark:text-white">Receipt review queue</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Only approve after checking the reference/receipt with the actual bank or M-Pesa record. Approval updates the student's fee balance.</p></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900">{receipts.length} pending</span></div>
      {localError && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"><AlertCircle size={15} className="mr-1 inline"/>{localError}</p>}
      {receipts.length ? <div className="mt-4 space-y-3">{receipts.map((receipt, index) => { const id = String(receipt.id || receipt._id || receipt.receipt_id || index); return <article key={id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-sm font-bold text-slate-900 dark:text-white">{receipt.student_name || "Student"} · {receipt.admission_number || "No admission number"}</p><p className="mt-1 text-xs text-slate-500">{receipt.fee_type || "Fee"} · {String(receipt.payment_method || "").toUpperCase()} · {dateTime(receipt.submitted_at)}</p><p className="mt-2 break-all text-sm font-semibold text-slate-800 dark:text-slate-200">{money(receipt.amount)} {receipt.currency || "KES"}</p><p className="mt-1 break-all text-xs text-slate-600 dark:text-slate-300">Reference: {receipt.payment_reference || "Not provided"}</p>{receipt.receipt_url && <a href={receipt.receipt_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-bold text-blue-700 underline dark:text-blue-300">Open receipt evidence</a>}{receipt.notes && <p className="mt-2 text-xs text-slate-500">{receipt.notes}</p>}</div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900">Pending review</span></div><label className="mt-3 block text-xs font-semibold text-slate-600 dark:text-slate-300">Decision note<input value={notes[id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [id]: event.target.value }))} maxLength={1000} className="mt-1.5 min-h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" placeholder="Optional feedback to parent"/></label><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={Boolean(workingId)} onClick={() => void reviewReceipt(receipt, "approve")} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{workingId === id ? <RefreshCw size={14} className="animate-spin"/> : <CheckCircle2 size={14}/>}Approve & reconcile</button><button type="button" disabled={Boolean(workingId)} onClick={() => void reviewReceipt(receipt, "reject")} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300"><XCircle size={14}/>Reject</button></div></article>; })}</div> : <p className="mt-5 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800">No receipts are waiting for review.</p>}
      <button type="button" onClick={() => void load()} disabled={loading} className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/>Refresh queue</button>
    </section>}
  </div>;
}
