import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ClipboardCheck, Loader2, Package, Plus, RefreshCw, Send, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import { useElimuApi } from "@/services/elimuApi.jsx";

function unwrap(value) {
  let current = value;
  for (let i = 0; i < 6; i += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return current;
    if (Object.prototype.hasOwnProperty.call(current, "data")) { current = current.data; continue; }
    if (Object.prototype.hasOwnProperty.call(current, "result")) { current = current.result; continue; }
    return current;
  }
  return current;
}
function getRows(value, key) {
  const data = unwrap(value);
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data[key])) return data[key];
  if (data.data && Array.isArray(data.data[key])) return data.data[key];
  return [];
}
function getError(error) {
  return error?.payload?.message || error?.payload?.error?.message || error?.response?.data?.message || error?.message || "The request could not be completed.";
}
function getNeedId(need) { return need?.id || need?._id || need?.need_id || ""; }
function getItemId(item) { return item?.id || item?._id || item?.item_id || ""; }
function Field({ label, name, value, onChange, type = "text", required = false, placeholder = "" }) {
  return <label className="block min-w-0 text-xs font-semibold text-slate-600 dark:text-slate-300">{label}
    <input name={name} type={type} min={type === "number" ? 0 : undefined} step={type === "number" ? "any" : undefined} required={required} value={value ?? ""} onChange={onChange} placeholder={placeholder} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
  </label>;
}
function Panel({ title, description, children, action }) {
  return <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:p-5">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-slate-950 dark:text-white">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p></div>{action}</div>{children}
  </section>;
}

export default function ElimuInventoryWorkspace({ role = "", school, access, onNavigate }) {
  const api = useElimuApi();
  const [items, setItems] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [itemForm, setItemForm] = useState({ name: "", category: "Food & grains", unit: "kg", opening_quantity: "0", minimum_quantity: "0", storage_location: "", expiry_date: "", notes: "" });
  const [movementForm, setMovementForm] = useState({ item_id: "", movement_type: "receive", quantity: "", notes: "" });
  const [needForm, setNeedForm] = useState({ item_name: "Maize", quantity: "", unit: "kg", needed_by: "", purpose: "", notes: "" });

  const canManage = ["owner", "principal", "storekeeper"].includes(role);
  const isStorekeeper = role === "storekeeper";
  const canApprove = role === "principal";
  const schoolName = school?.name || school?.school_name || access?.school?.name || "Your school";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const results = await Promise.allSettled([api.getInventoryItems(), api.getInventoryNeeds()]);
    if (results[0].status === "fulfilled") setItems(getRows(results[0].value, "items"));
    else setError(getError(results[0].reason));
    if (results[1].status === "fulfilled") setNeeds(getRows(results[1].value, "needs"));
    else if (results[0].status === "fulfilled") setError(getError(results[1].reason));
    setLoading(false);
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const onChange = (setter) => (event) => setter((old) => ({ ...old, [event.target.name]: event.target.value }));

  const createItem = async (event) => {
    event.preventDefault();
    setSaving("item"); setError(""); setNotice("");
    try {
      const payload = { ...itemForm, opening_quantity: Number(itemForm.opening_quantity || 0), minimum_quantity: Number(itemForm.minimum_quantity || 0) };
      await api.createInventoryItem(payload);
      setItemForm({ name: "", category: "Food & grains", unit: "kg", opening_quantity: "0", minimum_quantity: "0", storage_location: "", expiry_date: "", notes: "" });
      setNotice("Inventory item saved. Its opening balance is included in the stock ledger.");
      await load();
    } catch (e) { setError(getError(e)); }
    finally { setSaving(""); }
  };

  const createMovement = async (event) => {
    event.preventDefault();
    setSaving("movement"); setError(""); setNotice("");
    try {
      await api.recordInventoryMovement({ ...movementForm, quantity: Number(movementForm.quantity) });
      setMovementForm((old) => ({ ...old, quantity: "", notes: "" }));
      setNotice(movementForm.movement_type === "receive" ? "Received stock recorded." : "Stock issue recorded.");
      await load();
    } catch (e) { setError(getError(e)); }
    finally { setSaving(""); }
  };

  const createNeed = async (event) => {
    event.preventDefault();
    setSaving("need"); setError(""); setNotice("");
    try {
      const response = await api.createInventoryNeed({ ...needForm, quantity: Number(needForm.quantity) });
      const data = unwrap(response);
      const need = data?.need || data?.data?.need;
      setNeedForm({ item_name: "Maize", quantity: "", unit: "kg", needed_by: "", purpose: "", notes: "" });
      setNotice("Supply need sent to the Principal. It will not appear in Community until approved.");
      await load();
      if (need && typeof onNavigate === "function") { /* Keep the Storekeeper in the stock workspace. */ }
    } catch (e) { setError(getError(e)); }
    finally { setSaving(""); }
  };

  const decideNeed = async (need, decision) => {
    const id = getNeedId(need);
    if (!id) { setError("The supply request has no valid identifier."); return; }
    setSaving(id); setError(""); setNotice("");
    try {
      const response = await api.decideInventoryNeed(id, { decision });
      const data = unwrap(response);
      if (data?.warning) setNotice(data.warning);
      else setNotice(decision === "approve" ? "Approved supply request published to the Community feed." : "Supply request rejected.");
      await load();
    } catch (e) { setError(getError(e)); }
    finally { setSaving(""); }
  };

  const lowStock = items.filter((item) => Number(item?.quantity || 0) <= Number(item?.minimum_quantity || 0));
  const pending = needs.filter((need) => String(need?.status || "").toLowerCase() === "pending");
  const retryable = needs.filter((need) => String(need?.status || "").toLowerCase() === "approved" && !need?.community_post_id);

  return <div className="space-y-5">
    <header className="rounded-2xl bg-slate-950 p-5 text-white sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Elimu · School operations</p><h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Inventory & stores</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Track food stores, grains, stationery, cleaning supplies, receipts and issues. Low-stock quantities are calculated from the recorded balances.</p><p className="mt-2 text-xs text-slate-400">{schoolName}</p></div>
        <button type="button" onClick={load} disabled={loading} className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60 sm:self-auto"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/> Refresh</button>
      </div>
    </header>

    {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"><AlertCircle size={17} className="mt-0.5 shrink-0"/><p>{error}</p></div>}
    {notice && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"><CheckCircle2 size={17} className="mt-0.5 shrink-0"/><p>{notice}</p></div>}

    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><p className="text-xs font-semibold text-slate-500">Stock line items</p><p className="mt-1 text-2xl font-extrabold text-slate-950 dark:text-white">{items.length}</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><p className="text-xs font-semibold text-slate-500">At / below minimum</p><p className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-amber-700 dark:text-amber-300"><TrendingDown size={20}/>{lowStock.length}</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><p className="text-xs font-semibold text-slate-500">{canApprove ? "Needs awaiting your review" : "Supply requests pending"}</p><p className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-slate-950 dark:text-white"><ClipboardCheck size={20}/>{pending.length}</p></div>
    </div>

    {canManage && <Panel title="Add a store item" description="Capture a real stock item such as maize, beans, cooking oil, textbooks, chalk or cleaning supplies. Every starting quantity is recorded as an opening ledger entry.">
      <form onSubmit={createItem} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="Item name" name="name" value={itemForm.name} onChange={onChange(setItemForm)} required placeholder="e.g. Dry maize"/>
        <Field label="Category" name="category" value={itemForm.category} onChange={onChange(setItemForm)} placeholder="Food & grains"/>
        <Field label="Unit" name="unit" value={itemForm.unit} onChange={onChange(setItemForm)} required placeholder="kg, bags, pieces"/>
        <Field label="Opening quantity" name="opening_quantity" type="number" value={itemForm.opening_quantity} onChange={onChange(setItemForm)} required/>
        <Field label="Low-stock threshold" name="minimum_quantity" type="number" value={itemForm.minimum_quantity} onChange={onChange(setItemForm)} required/>
        <Field label="Storage location" name="storage_location" value={itemForm.storage_location} onChange={onChange(setItemForm)} placeholder="Main store / kitchen"/>
        <Field label="Expiry date (if applicable)" name="expiry_date" value={itemForm.expiry_date} onChange={onChange(setItemForm)} placeholder="YYYY-MM-DD"/>
        <Field label="Notes" name="notes" value={itemForm.notes} onChange={onChange(setItemForm)} placeholder="Supplier, condition, batch…"/>
        <div className="sm:col-span-2 xl:col-span-4"><button disabled={saving === "item"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60">{saving === "item" ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>} Save store item</button></div>
      </form>
    </Panel>}

    <Panel title="Stock ledger" description="Quantities change only through received or issued movements, so the current balance reflects the recorded stock activity." action={<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Package size={13}/>{items.length} items</span>}>
      {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading school inventory…</p> : items.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800">No inventory items have been recorded for this school yet.</div> : <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"><table className="min-w-full divide-y divide-slate-200 text-left dark:divide-slate-800"><thead className="bg-slate-50 dark:bg-slate-900"><tr>{["Item","Store / category","Balance","Minimum","Status"].map((label) => <th key={label} className="whitespace-nowrap px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{items.map((item,index) => { const quantity=Number(item.quantity||0); const minimum=Number(item.minimum_quantity||0); const low=quantity<=minimum; return <tr key={getItemId(item)||index}><td className="px-3 py-3"><p className="font-semibold text-slate-900 dark:text-white">{item.name||"Unnamed item"}</p><p className="mt-0.5 text-xs text-slate-500">{item.unit||"units"}{item.expiry_date ? " · Expiry "+item.expiry_date : ""}</p></td><td className="px-3 py-3 text-sm text-slate-700 dark:text-slate-300">{item.storage_location||"—"}<p className="mt-0.5 text-xs text-slate-500">{item.category||"General"}</p></td><td className="px-3 py-3 text-sm font-bold tabular-nums text-slate-900 dark:text-white">{quantity.toLocaleString()} {item.unit||"units"}</td><td className="px-3 py-3 text-sm tabular-nums text-slate-600 dark:text-slate-300">{minimum.toLocaleString()} {item.unit||"units"}</td><td className="px-3 py-3"><span className={low ? "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" : "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"}>{low ? "Restock needed" : "In stock"}</span></td></tr>})}</tbody></table></div>}
    </Panel>

    {canManage && items.length > 0 && <Panel title="Receive or issue stock" description="Record deliveries into the store or supplies taken out for kitchen, classroom or school operations. Issuing more than the recorded balance is blocked.">
      <form onSubmit={createMovement} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Inventory item<select name="item_id" value={movementForm.item_id} required onChange={onChange(setMovementForm)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="">Choose item</option>{items.map((item,index)=><option key={getItemId(item)||index} value={getItemId(item)}>{item.name} ({item.quantity} {item.unit})</option>)}</select></label>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Movement<select name="movement_type" value={movementForm.movement_type} onChange={onChange(setMovementForm)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="receive">Receive stock</option><option value="issue">Issue stock</option></select></label>
        <Field label="Quantity" name="quantity" type="number" value={movementForm.quantity} onChange={onChange(setMovementForm)} required/>
        <Field label="Reason / reference" name="notes" value={movementForm.notes} onChange={onChange(setMovementForm)} placeholder="Delivery note, kitchen issue…"/>
        <div className="sm:col-span-2 xl:col-span-4"><button disabled={saving === "movement"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900">{movementForm.movement_type === "receive" ? <TrendingUp size={16}/> : <TrendingDown size={16}/>} {saving === "movement" ? "Recording…" : "Record movement"}</button></div>
      </form>
    </Panel>}

    {isStorekeeper && <Panel title="Request school supplies" description="Raise a need for maize, beans or other supplies. The request is private to your school until the Principal approves it; approval triggers a public Community feed post.">
      <form onSubmit={createNeed} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Item needed<select name="item_name" value={needForm.item_name} onChange={onChange(setNeedForm)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option>Maize</option><option>Beans</option><option>Cooking oil</option><option>Rice</option><option>Flour</option><option>Stationery</option><option>Cleaning supplies</option><option>Other</option></select></label>
        <Field label="Quantity" name="quantity" type="number" value={needForm.quantity} onChange={onChange(setNeedForm)} required/>
        <Field label="Unit" name="unit" value={needForm.unit} onChange={onChange(setNeedForm)} required placeholder="kg, bags, cartons"/>
        <Field label="Needed by" name="needed_by" type="date" value={needForm.needed_by} onChange={onChange(setNeedForm)}/>
        <Field label="Purpose" name="purpose" value={needForm.purpose} onChange={onChange(setNeedForm)} placeholder="e.g. Term meal programme"/>
        <Field label="Notes" name="notes" value={needForm.notes} onChange={onChange(setNeedForm)} placeholder="Current stock / context"/>
        <div className="sm:col-span-2 xl:col-span-3"><button disabled={saving === "need"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60">{saving === "need" ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>} Submit to Principal</button></div>
      </form>
    </Panel>}

    <Panel title={canApprove ? "Principal approval queue" : "School supply requests"} description={canApprove ? "Approve a request to publish it to the Community feed, or reject it with the appropriate decision." : "Requests and their approval/publication states are stored by the backend for this school."}>
      {needs.length === 0 ? <p className="py-7 text-center text-sm text-slate-500">No supply requests yet.</p> : <div className="space-y-3">{needs.map((need,index)=> { const status=String(need.status||"pending").toLowerCase(); const id=getNeedId(need); const retry=status==="approved" && !need.community_post_id; return <article key={id||index} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900 dark:text-white">{need.item_name||"School supply"} · {Number(need.quantity||0).toLocaleString()} {need.unit||""}</h3><span className={status==="approved" ? "rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : status==="rejected" ? "rounded-full bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" : "rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"}>{status}</span></div><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{need.purpose||need.notes||"No additional details."}</p><p className="mt-1 text-xs text-slate-500">{need.needed_by ? "Needed by "+need.needed_by+" · " : ""}Community: {need.community_post_id ? "published" : status==="approved" ? (need.publication_status||"retry required") : "not published"}</p>{need.publication_error && <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">{need.publication_error}</p>}</div>{canApprove && (status==="pending" || retry) && <div className="flex shrink-0 flex-wrap gap-2"><button type="button" disabled={Boolean(saving)} onClick={()=>decideNeed(need,"approve")} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60">{saving===id ? <Loader2 size={13} className="animate-spin"/> : <ShieldCheck size={14}/>} {retry ? "Retry publish" : "Approve & publish"}</button>{status==="pending" && <button type="button" disabled={Boolean(saving)} onClick={()=>decideNeed(need,"reject")} className="min-h-9 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:text-rose-300">Reject</button>}</div>}</div></article>})}</div>}
    </Panel>
    {!canApprove && !isStorekeeper && <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950/30 dark:text-blue-200"><ShieldCheck size={18} className="mt-0.5 shrink-0"/><p>The Principal reviews supply requests before anything is posted publicly. Inventory permissions are enforced by the Elimu backend.</p></div>}
  </div>;
}
