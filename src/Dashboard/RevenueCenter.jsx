import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Clock3,
  Info,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useRevenueApi } from "@/services/revenueApi.jsx";

const HUB_OPTIONS = [
  { value: "all", label: "All revenue streams" },
  { value: "smart_ai", label: "Smart AI" },
  { value: "shamba", label: "Shamba" },
  { value: "biashara", label: "Biashara" },
  { value: "elimu", label: "Elimu" },
  { value: "community", label: "Community" },
  { value: "marketplace", label: "Marketplace" },
  { value: "advertising", label: "Advertising" },
  { value: "transaction_fees", label: "Transaction fees" },
];

function formatMoney(amount, currency = "KES") {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "Price not configured";
  return `${currency} ${new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function displayDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function getErrorMessage(error) {
  if (error?.status === 401) {
    return "Sign in to view your Revenue Engine request history or submit a request.";
  }
  if (error?.status === 403) {
    return "Your account is not allowed to perform this operation.";
  }
  return error?.message || "The Revenue Engine request failed. Please try again.";
}

function StatusTag({ children, tone = "neutral" }) {
  const tones = {
    neutral: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    proposed: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${tones[tone] || tones.neutral}`}>
      {children}
    </span>
  );
}

export default function RevenueCenter() {
  const revenueApi = useRevenueApi();
  const [hub, setHub] = useState("all");
  const [plans, setPlans] = useState([]);
  const [pricingStatus, setPricingStatus] = useState("draft");
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState("");

  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const [submittingPlan, setSubmittingPlan] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  const [feeAmount, setFeeAmount] = useState("1000");
  const [feePercentage, setFeePercentage] = useState("1.5");
  const [feePreview, setFeePreview] = useState(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState("");

  const loadPlans = useCallback(async (signal) => {
    setPlansLoading(true);
    setPlansError("");
    try {
      const response = await revenueApi.listPlans(
        hub === "all" ? undefined : hub,
        { signal },
      );
      setPlans(Array.isArray(response?.plans) ? response.plans : []);
      setPricingStatus(response?.pricing_status || "draft");
    } catch (error) {
      if (error?.name !== "AbortError") setPlansError(getErrorMessage(error));
    } finally {
      if (!signal?.aborted) setPlansLoading(false);
    }
  }, [hub, revenueApi]);

  const loadHistory = useCallback(async (signal) => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const response = await revenueApi.listTransactions(
        { page: 1, perPage: 10 },
        { signal },
      );
      setTransactions(Array.isArray(response?.items) ? response.items : []);
    } catch (error) {
      if (error?.name !== "AbortError") {
        setTransactions([]);
        setHistoryError(getErrorMessage(error));
      }
    } finally {
      if (!signal?.aborted) setHistoryLoading(false);
    }
  }, [revenueApi]);

  const loadHealth = useCallback(async (signal) => {
    setHealthError("");
    try {
      setHealth(await revenueApi.health({ signal }));
    } catch (error) {
      if (error?.name !== "AbortError") setHealthError(getErrorMessage(error));
    }
  }, [revenueApi]);

  useEffect(() => {
    const controller = new AbortController();
    loadPlans(controller.signal);
    return () => controller.abort();
  }, [loadPlans]);

  useEffect(() => {
    const controller = new AbortController();
    loadHistory(controller.signal);
    loadHealth(controller.signal);
    return () => controller.abort();
  }, [loadHistory, loadHealth]);

  const refreshAll = useCallback(() => {
    const controller = new AbortController();
    loadPlans(controller.signal);
    loadHistory(controller.signal);
    loadHealth(controller.signal);
    // Requests are aborted automatically when the component unmounts or stream changes.
  }, [loadPlans, loadHistory, loadHealth]);

  const canSubmitIntents = health?.success === true && health?.billing_enabled === false;
  const visiblePlans = useMemo(() => plans, [plans]);

  const registerInterest = async (plan) => {
    if (!plan || !plan.amount || Number(plan.amount) <= 0 || plan.hub === "all") return;

    setSubmittingPlan(plan.code);
    setActionError("");
    setNotice("");
    try {
      const result = await revenueApi.createIntent({
        stream: plan.hub,
        amount: String(plan.amount),
        currency: plan.currency || "KES",
        description: `Plan interest: ${plan.code} — ${plan.name}. Pricing is ${pricingStatus}; no payment is initiated.`,
      });
      setNotice(
        result?.message ||
          "Your plan request was recorded. No payment was initiated and no subscription was activated.",
      );
      await loadHistory();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setSubmittingPlan("");
    }
  };

  const submitFeePreview = async (event) => {
    event.preventDefault();
    setFeeLoading(true);
    setFeeError("");
    setFeePreview(null);
    try {
      const result = await revenueApi.previewFee({
        amount: feeAmount,
        percentage: feePercentage,
      });
      setFeePreview(result?.fee || null);
    } catch (error) {
      setFeeError(getErrorMessage(error));
    } finally {
      setFeeLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="bg-slate-950 px-5 py-6 text-white sm:px-7 sm:py-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 text-emerald-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                  Shared revenue service
                </p>
                <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
                  Jumuiya Revenue Center
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  One shared catalogue and request ledger for Smart AI, Shamba, Biashara, Elimu, Community, and Marketplace.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={refreshAll}
              disabled={plansLoading || historyLoading}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${plansLoading || historyLoading ? "animate-spin" : ""}`} />
              Refresh data
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <StatusTag tone={health?.success ? "success" : "neutral"}>
              {health?.success ? "API responding" : healthError ? "API unavailable" : "Checking API"}
            </StatusTag>
            <StatusTag tone="proposed">Pricing: {pricingStatus}</StatusTag>
            <StatusTag>{health?.billing_enabled ? "Billing enabled" : "Billing disabled"}</StatusTag>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
            <div className="text-xs leading-5 text-amber-900 dark:text-amber-200">
              <p className="font-bold">Requests are not payments</p>
              <p className="mt-1">
                Plan prices are proposals. Registering interest creates a pending intent only; it does not charge a customer, activate a subscription, credit a wallet, or confirm platform revenue.
              </p>
            </div>
          </div>

          {healthError ? <p className="mt-3 text-xs text-red-600 dark:text-red-300">Health check: {healthError}</p> : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Pricing catalogue</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Choose a stream to inspect its current published or proposed plans.</p>
            </div>
            <div className="w-full sm:w-64">
              <label htmlFor="revenue-hub" className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Revenue stream</label>
              <select
                id="revenue-hub"
                value={hub}
                onChange={(event) => setHub(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              >
                {HUB_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>

          {plansError ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{plansError}
            </div>
          ) : null}

          {plansLoading ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" />)}
            </div>
          ) : visiblePlans.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center dark:border-white/10">
              <ShieldCheck className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-700" />
              <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">No plans configured for this stream</p>
              <p className="mt-1 text-xs text-slate-400">The stream can record intents, but the pricing catalogue needs an approved plan before it can be offered.</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visiblePlans.map((plan) => {
                const paidProposal = Number(plan.amount) > 0 && plan.hub !== "all";
                return (
                  <article key={plan.code} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{plan.hub === "all" ? "All hubs" : String(plan.hub || "general").replace(/_/g, " ")}</p>
                        <h4 className="mt-1 text-base font-bold text-slate-900 dark:text-white">{plan.name}</h4>
                      </div>
                      <StatusTag tone={plan.status === "available" ? "success" : "proposed"}>{plan.status || "draft"}</StatusTag>
                    </div>
                    <p className="mt-4 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{formatMoney(plan.amount, plan.currency)}</p>
                    <p className="mt-1 text-xs text-slate-400">{plan.interval ? `per ${plan.interval}` : "No billing interval configured"}</p>
                    <ul className="mt-4 flex-1 space-y-2">
                      {(Array.isArray(plan.features) ? plan.features : []).map((feature) => (
                        <li key={feature} className="flex gap-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {paidProposal ? (
                      <button
                        type="button"
                        disabled={Boolean(submittingPlan) || !canSubmitIntents}
                        onClick={() => registerInterest(plan)}
                        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                      >
                        {submittingPlan === plan.code ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                        {submittingPlan === plan.code ? "Recording request…" : "Register interest · no charge"}
                      </button>
                    ) : (
                      <div className="mt-5 rounded-xl bg-slate-50 px-3 py-2.5 text-center text-xs font-semibold text-slate-500 dark:bg-white/5 dark:text-slate-400">
                        {Number(plan.amount) === 0 ? "Free plan · no purchase needed" : "Request not available for this catalogue item"}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {notice ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{notice}
            </div>
          ) : null}
          {actionError ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{actionError}
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        {/* Fee preview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"><Calculator className="h-5 w-5" /></div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Fee preview calculator</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">An illustrative calculation only. It does not set a live marketplace fee.</p>
            </div>
          </div>
          <form onSubmit={submitFeePreview} className="mt-5 space-y-3">
            <div>
              <label htmlFor="revenue-fee-amount" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Example transaction amount (KES)</label>
              <input id="revenue-fee-amount" type="number" min="0" max="999999999.99" step="0.01" required value={feeAmount} onChange={(event) => setFeeAmount(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label htmlFor="revenue-fee-rate" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Example fee rate (%)</label>
              <input id="revenue-fee-rate" type="number" min="0" max="100" step="0.01" required value={feePercentage} onChange={(event) => setFeePercentage(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" />
            </div>
            <button type="submit" disabled={feeLoading} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5">
              {feeLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              Preview fee
            </button>
          </form>
          {feeError ? <p className="mt-3 text-xs text-red-600 dark:text-red-300">{feeError}</p> : null}
          {feePreview ? (
            <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-xs dark:bg-white/5">
              <div className="flex justify-between gap-3"><span className="text-slate-500">Gross amount</span><strong>{formatMoney(feePreview.gross_amount, feePreview.currency)}</strong></div>
              <div className="flex justify-between gap-3"><span className="text-slate-500">Illustrative platform fee</span><strong>{formatMoney(feePreview.platform_fee, feePreview.currency)}</strong></div>
              <div className="flex justify-between gap-3 border-t border-slate-200 pt-2 dark:border-white/10"><span className="text-slate-500">Seller amount before other charges</span><strong>{formatMoney(feePreview.seller_amount_before_other_charges, feePreview.currency)}</strong></div>
              <p className="pt-1 text-[10px] leading-4 text-slate-400">This preview is not a charge, invoice, or settlement calculation.</p>
            </div>
          ) : null}
        </div>

        {/* User request history */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"><Clock3 className="h-5 w-5" /></div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Your revenue requests</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Recent intents tied to your signed-in account.</p>
              </div>
            </div>
            <button type="button" onClick={() => loadHistory()} disabled={historyLoading} aria-label="Refresh revenue request history" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"><RefreshCw className={`h-4 w-4 ${historyLoading ? "animate-spin" : ""}`} /></button>
          </div>
          {historyError ? <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{historyError}</div> : null}
          {historyLoading ? (
            <div className="mt-4 space-y-3">{[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" />)}</div>
          ) : transactions.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-white/10">
              <Clock3 className="mx-auto h-6 w-6 text-slate-300 dark:text-slate-700" />
              <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">No revenue requests yet</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Any submitted request will appear here. No payment will be taken by this engine.</p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-white/10">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-slate-800 dark:text-slate-100">{transaction.description || `${transaction.stream || "Revenue"} request`}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{String(transaction.stream || "general").replace(/_/g, " ")} · {displayDate(transaction.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{formatMoney(transaction.amount, transaction.currency)}</span>
                    <StatusTag>{transaction.status || "pending"}</StatusTag>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
