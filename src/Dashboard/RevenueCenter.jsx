import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  { value: "faith", label: "Faith & Scripture" },
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
  const [checkoutEnabled, setCheckoutEnabled] = useState(false);
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [activeCheckout, setActiveCheckout] = useState(null);
  const [checkoutRefreshing, setCheckoutRefreshing] = useState(false);
  const checkoutKeys = useRef({});

  const [adminOps, setAdminOps] = useState({
    authorized: false,
    loading: true,
    error: "",
    billing: null,
    subscriptions: [],
    trials: [],
    payments: [],
    paymentTotals: [],
    checkouts: [],
    plans: [],
  });
  const [updatingPlanCode, setUpdatingPlanCode] = useState("");
  const [reconcilingCheckoutId, setReconcilingCheckoutId] = useState("");

  const [submittingPlan, setSubmittingPlan] = useState("");
  const [newPlanDraft, setNewPlanDraft] = useState({
    code: "",
    name: "",
    hub: "smart_ai",
    amount: "",
    interval: "month",
    features: "",
  });
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

  const loadAdminOps = useCallback(async (signal) => {
    try {
      const billing = await revenueApi.adminBillingStatus({ signal });
      if (signal?.aborted) return;
      const [subscriptionResult, trialResult, paymentResult, checkoutResult, planResult] = await Promise.allSettled([
        revenueApi.adminSubscriptions({ page: 1, perPage: 25 }, { signal }),
        revenueApi.adminTrials({ page: 1, perPage: 25 }, { signal }),
        revenueApi.adminPayments({ page: 1, perPage: 25 }, { signal }),
        revenueApi.adminCheckouts({ page: 1, perPage: 25 }, { signal }),
        revenueApi.adminPlans({ signal }),
      ]);
      if (signal?.aborted) return;
      const failed = [subscriptionResult, trialResult, paymentResult, checkoutResult, planResult]
        .filter((result) => result.status === "rejected")
        .map((result) => getErrorMessage(result.reason));
      setAdminOps({
        authorized: true,
        loading: false,
        error: failed.join(" "),
        billing,
        subscriptions: subscriptionResult.status === "fulfilled" && Array.isArray(subscriptionResult.value?.items)
          ? subscriptionResult.value.items : [],
        trials: trialResult.status === "fulfilled" && Array.isArray(trialResult.value?.items)
          ? trialResult.value.items : [],
        payments: paymentResult.status === "fulfilled" && Array.isArray(paymentResult.value?.items)
          ? paymentResult.value.items : [],
        paymentTotals: paymentResult.status === "fulfilled" && Array.isArray(paymentResult.value?.totals)
          ? paymentResult.value.totals : [],
        checkouts: checkoutResult.status === "fulfilled" && Array.isArray(checkoutResult.value?.items)
          ? checkoutResult.value.items : [],
        plans: planResult.status === "fulfilled" && Array.isArray(planResult.value?.plans)
          ? planResult.value.plans : [],
      });
    } catch (error) {
      if (signal?.aborted) return;
      if ([401, 403].includes(error?.status)) {
        setAdminOps({ authorized: false, loading: false, error: "", billing: null, subscriptions: [], trials: [], payments: [], paymentTotals: [], checkouts: [], plans: [] });
      } else {
        setAdminOps({ authorized: true, loading: false, error: getErrorMessage(error), billing: null, subscriptions: [], trials: [], payments: [], paymentTotals: [], checkouts: [], plans: [] });
      }
    }
  }, [revenueApi]);

  const updatePlanStatus = async (plan, status) => {
    if (!plan?.code || !["available", "proposed"].includes(status)) return;
    if (status === "available") {
      if (!adminOps.billing?.mpesa_checkout_enabled) {
        setActionError("Configure M-Pesa checkout before publishing a plan for customer payments.");
        return;
      }
      if (!(Number(plan.amount) > 0) || !["month", "year"].includes(String(plan.interval || "").toLowerCase())) {
        setActionError("Only positive monthly or yearly hub subscription plans can be published for M-Pesa checkout.");
        return;
      }
      if (!["shamba", "biashara", "elimu", "community", "smart_ai", "marketplace", "faith"].includes(plan.hub)) {
        setActionError("This checkout integration currently publishes individual hub subscriptions only.");
        return;
      }
    }
    setUpdatingPlanCode(plan.code);
    setActionError("");
    setNotice("");
    try {
      const result = await revenueApi.updateAdminPlan(plan.code, {
        name: plan.name,
        amount: String(plan.amount),
        interval: plan.interval,
        status,
        features: Array.isArray(plan.features) ? plan.features : [],
      });
      setNotice(result?.message || (plan.name + " updated."));
      await Promise.all([loadPlans(), loadAdminOps()]);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setUpdatingPlanCode("");
    }
  };

  const createAdminPlan = async (event) => {
    event.preventDefault();
    if (!adminOps.authorized || submittingPlan) return;

    const code = String(newPlanDraft.code || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const features = String(newPlanDraft.features || "")
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!code || !newPlanDraft.name.trim() || newPlanDraft.amount === "") {
      setActionError("Enter a plan code, a name, and a proposed price before creating the plan.");
      return;
    }

    setSubmittingPlan("__create_plan__");
    setActionError("");
    setNotice("");
    try {
      const result = await revenueApi.createAdminPlan({
        code,
        name: newPlanDraft.name.trim(),
        hub: newPlanDraft.hub,
        amount: String(newPlanDraft.amount),
        interval: newPlanDraft.interval,
        status: "proposed",
        features,
      });
      setNotice(result?.message || "Plan saved to the proposed catalogue. It is not purchasable yet.");
      setNewPlanDraft({
        code: "",
        name: "",
        hub: "smart_ai",
        amount: "",
        interval: "month",
        features: "",
      });
      await Promise.all([loadPlans(), loadAdminOps()]);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setSubmittingPlan("");
    }
  };

  const reconcileCheckout = async (checkout) => {
    const checkoutId = checkout?.checkout_request_id;
    if (!checkoutId || reconcilingCheckoutId) return;
    setReconcilingCheckoutId(checkoutId);
    setActionError("");
    setNotice("");
    try {
      const response = await revenueApi.adminRefreshCheckout(checkoutId);
      const updated = response?.checkout;
      if (updated) {
        setAdminOps((previous) => ({
          ...previous,
          checkouts: previous.checkouts.map((item) =>
            item.checkout_request_id === checkoutId ? updated : item
          ),
        }));
      }
      if (updated?.status === "succeeded") {
        setNotice("Daraja verified the payment and the subscription is active." + (updated.receipt ? " Receipt: " + updated.receipt : " The payment is confirmed; the receipt may still arrive in a callback."));
      } else if (updated?.status === "sandbox_verified") {
        setNotice("The provider response was from sandbox. No real subscription or revenue was recorded.");
      } else if (updated?.status === "verified_activation_failed") {
        setActionError("Daraja confirmed payment, but subscription activation needs support reconciliation. Do not ask the customer to pay again.");
      } else if (updated?.status === "failed") {
        setNotice("Daraja reports that this payment was not completed.");
      } else {
        setNotice("Checkout remains " + String(updated?.status || "unverified").replace(/_/g, " ") + ". Keep it in the reconciliation queue and do not assume payment.");
      }
      await Promise.all([loadAdminOps(), loadHistory()]);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setReconcilingCheckoutId("");
    }
  };

  const loadHealth = useCallback(async (signal) => {
    setHealthError("");
    try {
      const response = await revenueApi.health({ signal });
      setHealth(response);
      setCheckoutEnabled(response?.checkout_enabled === true);
    } catch (error) {
      if (error?.name !== "AbortError") {
        setHealthError(getErrorMessage(error));
        setCheckoutEnabled(false);
      }
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
    loadAdminOps(controller.signal);
    return () => controller.abort();
  }, [loadHistory, loadHealth, loadAdminOps]);

  const refreshAll = useCallback(() => {
    const controller = new AbortController();
    loadPlans(controller.signal);
    loadHistory(controller.signal);
    loadHealth(controller.signal);
    loadAdminOps(controller.signal);
    // Requests are aborted automatically when the component unmounts or stream changes.
  }, [loadPlans, loadHistory, loadHealth, loadAdminOps]);

  const canSubmitIntents = health?.success === true;
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

  const startCheckout = async (plan) => {
    if (!plan?.code || !checkoutEnabled) return;
    if (!checkoutPhone.trim()) {
      setActionError("Enter the Kenyan M-Pesa phone number that should receive the payment prompt.");
      return;
    }
    const phoneKey = checkoutPhone.trim().replace(/[\\s()+-]/g, "");
    const keyScope = plan.code + ":" + phoneKey;
    const idempotencyKey = checkoutKeys.current[keyScope] || (
      globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : "mpesa-" + Date.now() + "-" + Math.random().toString(36).slice(2, 14)
    );
    checkoutKeys.current[keyScope] = idempotencyKey;
    setSubmittingPlan(plan.code);
    setActionError("");
    setNotice("");
    try {
      const result = await revenueApi.startCheckout(
        { plan_code: plan.code, phone: checkoutPhone.trim() },
        { idempotencyKey },
      );
      setActiveCheckout(result?.checkout || null);
      delete checkoutKeys.current[keyScope];
      setNotice(result?.message || "M-Pesa prompt sent. Confirm payment on your phone.");
    } catch (error) {
      // Keep the same idempotency key for safe retries after ambiguous network or
      // initiation failures; the backend will replay or recover the same checkout.
      setActionError(getErrorMessage(error));
    } finally {
      setSubmittingPlan("");
    }
  };

  const refreshCheckoutStatus = async () => {
    const checkoutId = activeCheckout?.checkout_request_id;
    if (!checkoutId) return;
    setCheckoutRefreshing(true);
    setActionError("");
    try {
      const result = await revenueApi.refreshCheckout(checkoutId);
      const updated = result?.checkout || null;
      setActiveCheckout(updated);
      if (updated?.status === "succeeded") {
        setNotice("Payment verified and your subscription is active.");
        await loadHistory();
        await loadHealth();
        await loadAdminOps();
      } else if (updated?.status === "failed") {
        setActionError(updated?.result_description || "M-Pesa reports that the payment was not completed.");
      } else if (updated?.status === "verified_activation_failed") {
        setActionError("Payment was verified but subscription reconciliation needs support. Do not pay again.");
      } else if (updated?.status === "sandbox_verified") {
        setNotice("This was a sandbox result only. It created no live subscription or revenue.");
      } else {
        setNotice("Payment is still being verified. Refresh shortly; do not submit another payment.");
      }
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setCheckoutRefreshing(false);
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
            <StatusTag tone={checkoutEnabled || health?.billing_enabled ? "success" : "proposed"}>{checkoutEnabled ? "M-Pesa checkout enabled" : health?.billing_enabled ? "Billing enabled" : "Billing disabled"}</StatusTag>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
            <div className="text-xs leading-5 text-amber-900 dark:text-amber-200">
              <p className="font-bold">{checkoutEnabled ? "Verified M-Pesa checkout" : "Requests are not payments"}</p>
              <p className="mt-1">
                {checkoutEnabled
                  ? "Only plans published by a platform administrator can be purchased. A subscription activates after the backend verifies the final Daraja result; an STK prompt or browser return is not proof of payment."
                  : "Plan prices are proposals. Registering interest creates a pending intent only; it does not charge a customer, activate a subscription, credit a wallet, or confirm platform revenue."}
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

          {checkoutEnabled && visiblePlans.some((plan) => plan?.status === "available" && Number(plan.amount) > 0 && ["month", "year"].includes(String(plan.interval || "").toLowerCase()) && plan.hub !== "all") ? (
            <div className="mt-4 rounded-xl border border-emerald-200 p-4 dark:border-emerald-900/50">
              <label htmlFor="revenue-center-mpesa-phone" className="block text-xs font-bold text-slate-800 dark:text-slate-100">M-Pesa phone number</label>
              <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">Use the Kenyan mobile number that should receive the STK Push payment prompt.</p>
              <input id="revenue-center-mpesa-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" value={checkoutPhone} onChange={(event) => setCheckoutPhone(event.target.value)} className="mt-2 min-h-11 w-full max-w-md rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
          ) : null}

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
                      checkoutEnabled && plan.status === "available" && ["month", "year"].includes(String(plan.interval || "").toLowerCase()) && plan.hub !== "all" ? (
                        <button
                          type="button"
                          disabled={Boolean(submittingPlan) || !checkoutPhone.trim() || Boolean(activeCheckout && ["pending", "initiating", "callback_received", "awaiting_verification", "verified_activation_failed"].includes(activeCheckout.status))}
                          onClick={() => startCheckout(plan)}
                          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {submittingPlan === plan.code ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                          {submittingPlan === plan.code ? "Starting M-Pesa…" : "Pay " + formatMoney(plan.amount, plan.currency) + " with M-Pesa"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={Boolean(submittingPlan) || !canSubmitIntents}
                          onClick={() => registerInterest(plan)}
                          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                        >
                          {submittingPlan === plan.code ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                          {submittingPlan === plan.code ? "Recording request…" : "Register interest · no charge"}
                        </button>
                      )
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

          {activeCheckout ? (
            <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">M-Pesa checkout · {String(activeCheckout.status || "pending").replace(/_/g, " ")}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{activeCheckout.message || activeCheckout.result_description || "Waiting for the provider's final confirmation."}</p>
                  {activeCheckout.checkout_request_id ? <p className="mt-2 break-all font-mono text-[10px] text-slate-500">Reference: {activeCheckout.checkout_request_id}</p> : null}
                  {activeCheckout.receipt ? <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Receipt: {activeCheckout.receipt}</p> : null}
                </div>
                {activeCheckout.status === "succeeded" ? (
                  <StatusTag tone="success">Subscription active</StatusTag>
                ) : (
                  <button type="button" onClick={refreshCheckoutStatus} disabled={checkoutRefreshing || !activeCheckout.checkout_request_id} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">
                    <RefreshCw className={"h-3.5 w-3.5 " + (checkoutRefreshing ? "animate-spin" : "")} />
                    {checkoutRefreshing ? "Checking…" : "Refresh payment status"}
                  </button>
                )}
              </div>
            </div>
          ) : null}

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

      {adminOps.authorized ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">Restricted administration</p>
              <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">Billing operations</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Payment readiness, recent subscriptions and per-hub trial records.</p>
            </div>
            <button type="button" onClick={() => loadAdminOps()} disabled={adminOps.loading} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300">
              <RefreshCw className={`h-3.5 w-3.5 ${adminOps.loading ? "animate-spin" : ""}`} />
              Refresh billing data
            </button>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">M-Pesa checkout</p>
              <div className="mt-2"><StatusTag tone={adminOps.billing?.mpesa_checkout_enabled ? "success" : "proposed"}>{adminOps.billing?.mpesa_checkout_enabled ? "Live checkout configured" : adminOps.billing?.mpesa_sandbox_configured ? "Sandbox only" : "Not configured"}</StatusTag></div>
              <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{adminOps.billing?.mpesa_checkout_enabled ? "Production Daraja credentials and the registered HTTPS callback are present." : adminOps.billing?.mpesa_sandbox_configured ? "Sandbox is for provider testing only. It cannot activate live subscriptions or be published for customer checkout." : "Set production Daraja credentials and the registered public HTTPS callback before publishing paid plans."}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Verified activation</p>
              <div className="mt-2"><StatusTag tone={adminOps.billing?.provider_callback_enabled ? "success" : "proposed"}>{adminOps.billing?.provider_callback_enabled ? "Adapter available" : "Not configured"}</StatusTag></div>
              <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">Subscriptions activate only after verified provider status, not a browser return.</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Allowed providers</p>
              <p className="mt-2 break-words text-sm font-bold text-slate-800 dark:text-slate-100">{(adminOps.billing?.providers_allowed || []).join(", ") || "None configured"}</p>
              <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">Secrets are never returned to this page.</p>
            </div>
          </div>
          {adminOps.error ? <p className="mx-5 mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">{adminOps.error}</p> : null}
          <div className="grid gap-5 px-5 pb-5 xl:grid-cols-2">
            <div className="min-w-0 rounded-xl border border-slate-200 p-4 dark:border-white/10">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Create a plan</h4>
                <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">New prices are saved as proposals. They cannot charge anyone until a platform admin reviews and publishes them with production M-Pesa configured.</p>
              </div>
              <form onSubmit={createAdminPlan} className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="new-revenue-plan-code" className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Plan code</label>
                  <input id="new-revenue-plan-code" value={newPlanDraft.code} onChange={(event) => setNewPlanDraft((previous) => ({ ...previous, code: event.target.value }))} placeholder="faith_plus" maxLength={60} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" required />
                </div>
                <div>
                  <label htmlFor="new-revenue-plan-name" className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Display name</label>
                  <input id="new-revenue-plan-name" value={newPlanDraft.name} onChange={(event) => setNewPlanDraft((previous) => ({ ...previous, name: event.target.value }))} placeholder="Faith & Scripture Plus" maxLength={100} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" required />
                </div>
                <div>
                  <label htmlFor="new-revenue-plan-hub" className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Hub / stream</label>
                  <select id="new-revenue-plan-hub" value={newPlanDraft.hub} onChange={(event) => setNewPlanDraft((previous) => ({ ...previous, hub: event.target.value }))} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                    {HUB_OPTIONS.filter((option) => option.value !== "all").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="new-revenue-plan-amount" className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Proposed amount (KES)</label>
                  <input id="new-revenue-plan-amount" type="number" min="0" step="0.01" value={newPlanDraft.amount} onChange={(event) => setNewPlanDraft((previous) => ({ ...previous, amount: event.target.value }))} placeholder="Enter price" className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" required />
                </div>
                <div>
                  <label htmlFor="new-revenue-plan-interval" className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Billing interval</label>
                  <select id="new-revenue-plan-interval" value={newPlanDraft.interval} onChange={(event) => setNewPlanDraft((previous) => ({ ...previous, interval: event.target.value }))} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                    <option value="one_time">One-time campaign / item</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="new-revenue-plan-features" className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Included features (one per line)</label>
                  <textarea id="new-revenue-plan-features" rows={3} value={newPlanDraft.features} onChange={(event) => setNewPlanDraft((previous) => ({ ...previous, features: event.target.value }))} placeholder="Advanced reports\nExpanded tools" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                </div>
                <div className="flex items-end">
                  <button type="submit" disabled={!adminOps.authorized || Boolean(submittingPlan)} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900">
                    {submittingPlan === "__create_plan__" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {submittingPlan === "__create_plan__" ? "Saving proposal…" : "Create proposed plan"}
                  </button>
                </div>
              </form>
            </div>

            <div className="min-w-0 rounded-xl border border-slate-200 p-4 dark:border-white/10">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Plan publishing</h4>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">Publishing makes an approved subscription purchasable. Proposed prices are not charged.</p>
                </div>
                <StatusTag tone={adminOps.billing?.mpesa_checkout_enabled ? "success" : "proposed"}>{adminOps.billing?.mpesa_checkout_enabled ? "Checkout configured" : "Checkout off"}</StatusTag>
              </div>
              <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                {adminOps.plans.filter((plan) => Number(plan?.amount) > 0 && plan?.hub !== "all" && plan?.status !== "retired").map((plan) => {
                  const eligible = ["month", "year"].includes(String(plan.interval || "").toLowerCase()) && ["shamba", "biashara", "elimu", "community", "smart_ai", "marketplace", "faith"].includes(plan.hub);
                  return (
                    <div key={plan.code} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{plan.name}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">{plan.hub} · {formatMoney(plan.amount, plan.currency)} / {plan.interval}</p>
                        <p className="mt-1"><StatusTag tone={plan.status === "available" ? "success" : "proposed"}>{plan.status}</StatusTag></p>
                      </div>
                      {eligible ? (
                        <button
                          type="button"
                          onClick={() => updatePlanStatus(plan, plan.status === "available" ? "proposed" : "available")}
                          disabled={!adminOps.billing?.mpesa_checkout_enabled || Boolean(updatingPlanCode)}
                          className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
                          title={!adminOps.billing?.mpesa_checkout_enabled ? "Configure M-Pesa first" : undefined}
                        >
                          {updatingPlanCode === plan.code ? "Saving…" : plan.status === "available" ? "Pause plan" : "Publish plan"}
                        </button>
                      ) : (
                        <span className="max-w-32 text-right text-[10px] leading-4 text-slate-400">This plan type is not covered by the current subscription checkout.</span>
                      )}
                    </div>
                  );
                })}
                {!adminOps.plans.some((plan) => Number(plan?.amount) > 0 && plan?.hub !== "all" && plan?.status !== "retired") ? (
                  <p className="rounded-lg border border-dashed border-slate-200 p-3 text-xs text-slate-500 dark:border-white/10">No paid hub plans in the catalogue.</p>
                ) : null}
              </div>
            </div>
            <div className="min-w-0 rounded-xl border border-slate-200 p-4 dark:border-white/10">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Verified payment totals</h4>
                <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">Only successful payments reconciled against Daraja appear here.</p>
              </div>
              {adminOps.paymentTotals.length ? (
                <div className="mt-3 space-y-2">
                  {adminOps.paymentTotals.map((item) => (
                    <div key={item.currency + ":" + item.stream} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 dark:bg-white/5">
                      <div className="min-w-0"><p className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.stream}</p><p className="text-[10px] text-slate-500">{item.count} confirmed payment(s)</p></div>
                      <p className="whitespace-nowrap text-sm font-black text-emerald-700 dark:text-emerald-300">{formatMoney(item.amount, item.currency)}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-3 rounded-lg border border-dashed border-slate-200 p-4 text-xs text-slate-500 dark:border-white/10">No verified payments recorded yet.</p>}
              {adminOps.payments.length ? (
                <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                  {adminOps.payments.slice(0, 10).map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{item.plan_code || item.description || "Subscription payment"}</p><p className="mt-0.5 text-[10px] text-slate-500">{item.stream} · {item.payment_provider || "provider"} · {displayDate(item.paid_at)}</p></div>
                        <p className="whitespace-nowrap text-xs font-black text-slate-900 dark:text-white">{formatMoney(item.amount, item.currency)}</p>
                      </div>
                      {item.receipt ? <p className="mt-1 break-all font-mono text-[10px] text-slate-500">Receipt: {item.receipt}</p> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="px-5 pb-5">
            <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">M-Pesa checkout queue</h4>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">Use this queue to identify pending, failed, sandbox-only and reconciliation-required checkouts. Customer phone numbers are not displayed.</p>
                </div>
                <StatusTag tone={adminOps.checkouts.some((item) => ["verified_activation_failed", "awaiting_verification"].includes(item.status)) ? "proposed" : "neutral"}>
                  {adminOps.checkouts.filter((item) => ["verified_activation_failed", "awaiting_verification", "pending", "callback_received"].includes(item.status)).length} requiring review
                </StatusTag>
              </div>
              {adminOps.checkouts.length ? (
                <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                  <table className="w-full min-w-[920px] text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 dark:bg-white/5">
                      <tr><th className="px-3 py-2.5">Account</th><th className="px-3 py-2.5">Plan / hub</th><th className="px-3 py-2.5">Amount</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Provider reference</th><th className="px-3 py-2.5">Created</th><th className="px-3 py-2.5">Action</th></tr>
                    </thead>
                    <tbody>
                      {adminOps.checkouts.map((item) => (
                        <tr key={item.id} className="border-t border-slate-100 dark:border-white/10">
                          <td className="max-w-28 truncate px-3 py-2.5 font-mono text-[10px] text-slate-500">{item.user_id || "—"}</td>
                          <td className="px-3 py-2.5"><p className="font-semibold text-slate-800 dark:text-slate-100">{item.plan_code || "—"}</p><p className="text-[10px] text-slate-400">{item.hub || "—"}</p></td>
                          <td className="whitespace-nowrap px-3 py-2.5 font-semibold">{formatMoney(item.amount, item.currency)}</td>
                          <td className="px-3 py-2.5"><StatusTag tone={["succeeded"].includes(item.status) ? "success" : ["failed", "initiation_failed"].includes(item.status) ? "proposed" : "neutral"}>{String(item.status || "unknown").replace(/_/g, " ")}</StatusTag></td>
                          <td className="max-w-48 break-all px-3 py-2.5 font-mono text-[10px] text-slate-500">{item.checkout_request_id || item.merchant_request_id || "Not submitted"}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">{displayDate(item.created_at)}</td>
                          <td className="px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => reconcileCheckout(item)}
                              disabled={!item.checkout_request_id || Boolean(reconcilingCheckoutId) || item.status === "succeeded" || item.status === "sandbox_verified"}
                              className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
                            >
                              <RefreshCw className={"h-3 w-3 " + (reconcilingCheckoutId === item.checkout_request_id ? "animate-spin" : "")} />
                              {reconcilingCheckoutId === item.checkout_request_id ? "Checking…" : "Reconcile"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="mt-3 rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500 dark:border-white/10">{adminOps.loading ? "Loading checkouts…" : "No M-Pesa checkouts recorded yet."}</p>}
            </div>
          </div>

          <div className="grid gap-5 p-5 pt-0 xl:grid-cols-2">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Recent subscriptions</h4>
              {adminOps.subscriptions.length ? (
                <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                  <table className="w-full min-w-[520px] text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 dark:bg-white/5"><tr><th className="px-3 py-2.5">Account</th><th className="px-3 py-2.5">Plan / hub</th><th className="px-3 py-2.5">Amount</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Ends</th></tr></thead>
                    <tbody>{adminOps.subscriptions.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100 dark:border-white/10">
                        <td className="max-w-28 truncate px-3 py-2.5 font-mono text-[10px] text-slate-500">{item.user_id || "—"}</td>
                        <td className="px-3 py-2.5"><p className="font-semibold text-slate-800 dark:text-slate-100">{item.plan_code || "—"}</p><p className="text-[10px] text-slate-400">{item.hub || "—"}</p></td>
                        <td className="whitespace-nowrap px-3 py-2.5 font-semibold">{formatMoney(item.amount, item.currency)}</td>
                        <td className="px-3 py-2.5"><StatusTag tone={item.status === "active" ? "success" : "neutral"}>{item.status}</StatusTag></td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">{displayDate(item.ends_at)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : <p className="mt-3 rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500 dark:border-white/10">{adminOps.loading ? "Loading subscriptions…" : "No paid subscriptions recorded."}</p>}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Recent hub trials</h4>
              {adminOps.trials.length ? (
                <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                  <table className="w-full min-w-[440px] text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 dark:bg-white/5"><tr><th className="px-3 py-2.5">Account</th><th className="px-3 py-2.5">Hub</th><th className="px-3 py-2.5">Started</th><th className="px-3 py-2.5">Ends</th></tr></thead>
                    <tbody>{adminOps.trials.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100 dark:border-white/10">
                        <td className="max-w-28 truncate px-3 py-2.5 font-mono text-[10px] text-slate-500">{item.user_id || "—"}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100">{item.hub || "—"}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">{displayDate(item.started_at)}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">{displayDate(item.ends_at)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : <p className="mt-3 rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500 dark:border-white/10">{adminOps.loading ? "Loading trial records…" : "No hub trials recorded."}</p>}
            </div>
          </div>
        </section>
      ) : null}

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
