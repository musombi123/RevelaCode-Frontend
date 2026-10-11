import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Edit3,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAdminApi } from "@/services/adminApi.jsx";

const STREAMS = [
  ["smart_ai", "Smart AI"],
  ["shamba", "Shamba"],
  ["biashara", "Biashara"],
  ["elimu", "Elimu"],
  ["community", "Community"],
  ["marketplace", "Marketplace"],
  ["advertising", "Advertising"],
  ["transaction_fees", "Transaction fees"],
];

const INITIAL_CREATE = {
  code: "",
  name: "",
  hub: "biashara",
  amount: "0.00",
  interval: "month",
  status: "proposed",
  featuresText: "",
};

function formatCount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat().format(number) : "—";
}

function formatMoney(amount, currency = "KES") {
  const number = Number(amount);
  if (!Number.isFinite(number)) return `${currency} —`;
  return `${currency} ${new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number)}`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function label(value) {
  return String(value || "unknown")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getError(error) {
  if (error?.status === 401) return "Your session is not authenticated. Sign in again.";
  if (error?.status === 403) return "Access denied. This page requires a platform-admin role assigned by the backend.";
  if (error?.status === 404) return "Revenue admin endpoints are not available on this backend deployment. Deploy the backend admin routes first.";
  return error?.message || "The request failed. Please retry.";
}

function StatusPill({ value }) {
  const status = String(value || "unknown").toLowerCase();
  const style = status === "available" || status === "succeeded"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
    : status === "pending" || status === "proposed" || status === "processing"
      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
      : status === "retired" || status === "failed" || status === "cancelled"
        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${style}`}>{label(value)}</span>;
}

function MetricCard({ title, value, description, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">{formatCount(value)}</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-400">{description}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function EditPlanForm({ plan, saving, onCancel, onSave }) {
  const [form, setForm] = useState(() => ({
    name: plan.name || "",
    amount: String(plan.amount ?? "0.00"),
    interval: plan.interval || "month",
    status: plan.status || "proposed",
    featuresText: (plan.features || []).join("\n"),
  }));

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          name: form.name.trim(),
          amount: form.amount,
          interval: form.interval,
          status: form.status,
          features: form.featuresText.split("\n").map((item) => item.trim()).filter(Boolean),
        });
      }}
      className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800"
    >
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
        Plan name
        <input required maxLength={100} value={form.name} onChange={(event) => update("name", event.target.value)} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          Amount (KES)
          <input required type="number" min="0" max="999999999.99" step="0.01" value={form.amount} onChange={(event) => update("amount", event.target.value)} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        </label>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          Billing interval
          <select value={form.interval} onChange={(event) => update("interval", event.target.value)} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
            <option value="one_time">One time</option>
          </select>
        </label>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          Catalogue status
          <select value={form.status} onChange={(event) => update("status", event.target.value)} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            <option value="proposed">Proposed</option>
            <option value="available">Available in catalogue</option>
            <option value="retired">Retired</option>
          </select>
        </label>
      </div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
        Plan features (one per line)
        <textarea rows={4} value={form.featuresText} onChange={(event) => update("featuresText", event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
      </label>
      <p className="text-[11px] leading-5 text-amber-700 dark:text-amber-300">Saving changes the draft catalogue only. Checkout, paid entitlements, wallet credits, and billing remain disabled.</p>
      <div className="flex flex-wrap gap-2">
        <button disabled={saving} type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save plan"}</button>
        <button type="button" onClick={onCancel} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"><X className="h-4 w-4" />Cancel</button>
      </div>
    </form>
  );
}

export default function AdminRevenueManagement() {
  const adminApi = useAdminApi();
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState("");
  const [plans, setPlans] = useState([]);
  const [plansError, setPlansError] = useState("");
  const [plansLoading, setPlansLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, per_page: 25, total: 0, pages: 0 });
  const [stream, setStream] = useState("all");
  const [status, setStatus] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState("");
  const [editingCode, setEditingCode] = useState("");
  const [savingCode, setSavingCode] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(INITIAL_CREATE);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadOverview = useCallback(async (signal) => {
    setOverviewError("");
    try {
      const response = await adminApi.request("/api/revenue/admin/overview", { signal });
      setOverview(response);
    } catch (error) {
      if (error?.name !== "AbortError") setOverviewError(getError(error));
    }
  }, [adminApi]);

  const loadPlans = useCallback(async (signal) => {
    setPlansLoading(true);
    setPlansError("");
    try {
      const response = await adminApi.request("/api/revenue/admin/plans", { signal });
      setPlans(Array.isArray(response?.plans) ? response.plans : []);
    } catch (error) {
      if (error?.name !== "AbortError") {
        setPlans([]);
        setPlansError(getError(error));
      }
    } finally {
      if (!signal?.aborted) setPlansLoading(false);
    }
  }, [adminApi]);

  const loadTransactions = useCallback(async (signal) => {
    setTransactionsLoading(true);
    setTransactionsError("");
    try {
      const response = await adminApi.request("/api/revenue/admin/transactions", {
        params: {
          page,
          per_page: 25,
          stream: stream === "all" ? undefined : stream,
          status: status === "all" ? undefined : status,
          search: search || undefined,
        },
        signal,
      });
      setTransactions(Array.isArray(response?.items) ? response.items : []);
      setPagination(response?.pagination || { page, per_page: 25, total: 0, pages: 0 });
    } catch (error) {
      if (error?.name !== "AbortError") {
        setTransactions([]);
        setTransactionsError(getError(error));
      }
    } finally {
      if (!signal?.aborted) setTransactionsLoading(false);
    }
  }, [adminApi, page, search, status, stream]);

  useEffect(() => {
    const controller = new AbortController();
    loadOverview(controller.signal);
    loadPlans(controller.signal);
    return () => controller.abort();
  }, [loadOverview, loadPlans, reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    loadTransactions(controller.signal);
    return () => controller.abort();
  }, [loadTransactions, reloadKey]);

  const refresh = () => {
    setNotice("");
    setActionError("");
    setReloadKey((value) => value + 1);
  };

  const savePlan = async (code, values) => {
    setSavingCode(code);
    setNotice("");
    setActionError("");
    try {
      await adminApi.request(`/api/revenue/admin/plans/${encodeURIComponent(code)}`, {
        method: "PUT",
        body: values,
      });
      setEditingCode("");
      setNotice(`Plan "${code}" saved to the draft catalogue.`);
      setReloadKey((value) => value + 1);
    } catch (error) {
      setActionError(getError(error));
    } finally {
      setSavingCode("");
    }
  };

  const createPlan = async (event) => {
    event.preventDefault();
    setCreating(true);
    setNotice("");
    setActionError("");
    try {
      const response = await adminApi.request("/api/revenue/admin/plans", {
        method: "POST",
        body: {
          code: createForm.code.trim().toLowerCase(),
          name: createForm.name.trim(),
          hub: createForm.hub,
          amount: createForm.amount,
          interval: createForm.interval,
          status: createForm.status,
          features: createForm.featuresText.split("\n").map((item) => item.trim()).filter(Boolean),
        },
      });
      setShowCreate(false);
      setCreateForm(INITIAL_CREATE);
      setNotice(response?.message || "Draft plan created.");
      setReloadKey((value) => value + 1);
    } catch (error) {
      setActionError(getError(error));
    } finally {
      setCreating(false);
    }
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const metrics = overview?.metrics || {};
  const breakdown = Array.isArray(overview?.stream_breakdown) ? overview.stream_breakdown : [];
  const totalRows = Number(pagination.total || 0);
  const totalPages = Math.max(1, Number(pagination.pages || 1));

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="bg-slate-950 px-5 py-6 text-white sm:px-7 sm:py-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-emerald-300"><CircleDollarSign className="h-5 w-5" /></div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">Platform controls</p>
                <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Revenue Management</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Manage the shared pricing catalogue and monitor transaction intents across all Jumuiya hubs.</p>
              </div>
            </div>
            <button type="button" onClick={refresh} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 text-xs font-semibold text-white hover:bg-white/10"><RefreshCw className="h-3.5 w-3.5" />Refresh</button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <StatusPill value="platform admin only" />
            <StatusPill value={`pricing ${overview?.pricing_status || "draft"}`} />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-200"><ShieldCheck className="h-3 w-3" />Billing disabled</span>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4 sm:p-6">
          <MetricCard title="Transaction intents" value={metrics.total_intents} description="All recorded purchase requests" icon={ClipboardList} />
          <MetricCard title="Pending intents" value={metrics.pending_intents} description="Awaiting any future payment flow" icon={Clock3} />
          <MetricCard title="Catalogue plans" value={metrics.plan_count} description="Default and admin-created plans" icon={CircleDollarSign} />
          <MetricCard title="Retired plans" value={metrics.retired_plan_count} description="Hidden from the public catalogue" icon={ShieldCheck} />
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div><p className="font-bold">Intents are not revenue</p><p className="mt-1">These totals describe requested purchases only. The current engine does not charge customers, verify provider payments, activate subscriptions, or settle seller balances. Changing a plan edits the catalogue only.</p></div>
      </div>

      {overviewError ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">Overview: {overviewError}</div> : null}
      {notice ? <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{notice}</div> : null}
      {actionError ? <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{actionError}</div> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="text-base font-bold text-slate-900 dark:text-white">Pricing catalogue</h3><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Create or edit plan proposals for any supported hub. Retire plans instead of deleting their history.</p></div>
          <button type="button" onClick={() => setShowCreate((value) => !value)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"><Plus className="h-4 w-4" />{showCreate ? "Close form" : "Create plan"}</button>
        </div>

        {showCreate ? (
          <form onSubmit={createPlan} className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/10 sm:p-5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">New draft plan</h4>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Plan code<input required pattern="[a-z0-9]+(_[a-z0-9]+)*" maxLength={60} value={createForm.code} onChange={(event) => setCreateForm((form) => ({ ...form, code: event.target.value }))} placeholder="community_plus" className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Plan name<input required maxLength={100} value={createForm.name} onChange={(event) => setCreateForm((form) => ({ ...form, name: event.target.value }))} placeholder="Community Plus" className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Hub<select value={createForm.hub} onChange={(event) => setCreateForm((form) => ({ ...form, hub: event.target.value }))} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="all">All hubs</option>{STREAMS.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Amount (KES)<input required type="number" min="0" max="999999999.99" step="0.01" value={createForm.amount} onChange={(event) => setCreateForm((form) => ({ ...form, amount: event.target.value }))} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Interval<select value={createForm.interval} onChange={(event) => setCreateForm((form) => ({ ...form, interval: event.target.value }))} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="month">Monthly</option><option value="year">Yearly</option><option value="one_time">One time</option></select></label>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Catalogue status<select value={createForm.status} onChange={(event) => setCreateForm((form) => ({ ...form, status: event.target.value }))} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="proposed">Proposed</option><option value="available">Available in catalogue</option><option value="retired">Retired</option></select></label>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 sm:col-span-2 xl:col-span-3">Features (one per line)<textarea rows={3} value={createForm.featuresText} onChange={(event) => setCreateForm((form) => ({ ...form, featuresText: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2"><button disabled={creating} type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{creating ? "Creating..." : "Save draft plan"}</button><button type="button" onClick={() => setShowCreate(false)} className="min-h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button></div>
          </form>
        ) : null}

        {plansError ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">{plansError}</p> : null}
        {plansLoading ? <div className="mt-5 h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" /> : plans.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400 dark:border-slate-800">No pricing plans returned by the API.</p> : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {plans.map((plan) => (
              <article key={plan.code} className="min-w-0 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label(plan.hub)} / {plan.code}</p><h4 className="mt-1 font-bold text-slate-900 dark:text-white">{plan.name}</h4><p className="mt-2 text-xl font-black text-slate-900 dark:text-white">{formatMoney(plan.amount, plan.currency)} <span className="text-xs font-medium text-slate-400">/ {plan.interval || "not set"}</span></p></div>
                  <StatusPill value={plan.status} />
                </div>
                <ul className="mt-3 space-y-1.5">{(plan.features || []).slice(0, 5).map((feature) => <li key={feature} className="text-xs leading-5 text-slate-500 dark:text-slate-400">- {feature}</li>)}</ul>
                {editingCode === plan.code ? <EditPlanForm plan={plan} saving={savingCode === plan.code} onCancel={() => setEditingCode("")} onSave={(values) => savePlan(plan.code, values)} /> : <button type="button" onClick={() => { setEditingCode(plan.code); setNotice(""); setActionError(""); }} className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><Edit3 className="h-3.5 w-3.5" />Edit plan</button>}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div><h3 className="text-base font-bold text-slate-900 dark:text-white">Transaction-intent ledger</h3><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">All hubs, all users. This is a request ledger, not a bank or settlement statement.</p></div>
            <div className="flex flex-wrap gap-2">
              <select aria-label="Filter by hub" value={stream} onChange={(event) => { setStream(event.target.value); setPage(1); }} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="all">All hubs</option>{STREAMS.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select>
              <select aria-label="Filter by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="all">All statuses</option>{["pending", "processing", "succeeded", "failed", "cancelled", "refunded", "partially_refunded"].map((value) => <option key={value} value={value}>{label(value)}</option>)}</select>
            </div>
          </div>
          <form onSubmit={submitSearch} className="mt-4 flex flex-col gap-2 sm:flex-row"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search user ID, stream, or description" className="min-h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></div><button type="submit" className="min-h-10 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">Search ledger</button></form>
        </div>

        {transactionsError ? <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">{transactionsError}</div> : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead><tr className="border-b border-slate-200 dark:border-slate-800">{["Intent / user", "Hub", "Requested amount", "Status", "Created", "Description"].map((item) => <th key={item} className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:px-5">{item}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactionsLoading ? <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400"><RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading intent records...</td></tr> : transactions.length === 0 ? <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">No transaction intents match these filters.</td></tr> : transactions.map((item) => <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"><td className="px-4 py-4 sm:px-5"><p className="font-semibold text-slate-800 dark:text-slate-100">{String(item.id || "").slice(-10) || "—"}</p><p className="mt-1 text-[10px] text-slate-400">User {item.user_id || "—"}</p></td><td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-300">{label(item.stream)}</td><td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">{formatMoney(item.amount, item.currency)}</td><td className="px-4 py-4"><StatusPill value={item.status} /></td><td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">{formatDate(item.created_at)}</td><td className="max-w-[240px] px-4 py-4 text-xs text-slate-500 dark:text-slate-400">{item.description || "—"}</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="text-xs text-slate-500 dark:text-slate-400">{totalRows ? `Showing ${((page - 1) * 25) + 1}-${Math.min(page * 25, totalRows)} of ${formatCount(totalRows)} intents` : "No intents"}</p><div className="flex items-center gap-3"><span className="text-xs text-slate-500">Page {page} of {totalPages}</span><button type="button" disabled={page <= 1 || transactionsLoading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold disabled:opacity-40 dark:border-slate-700">Previous</button><button type="button" disabled={page >= totalPages || transactionsLoading} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold disabled:opacity-40 dark:border-slate-700">Next</button></div></div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Intent volume by stream</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Counts are requested purchases recorded by the engine, not successful sales.</p>
        {breakdown.length === 0 ? <p className="mt-4 text-sm text-slate-400">No stream activity recorded yet.</p> : <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{breakdown.map((item) => <div key={item.stream} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3.5 py-3 dark:border-slate-800"><span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label(item.stream)}</span><span className="text-sm font-black text-slate-900 dark:text-white">{formatCount(item.count)}</span></div>)}</div>}
      </section>
    </div>
  );
}
