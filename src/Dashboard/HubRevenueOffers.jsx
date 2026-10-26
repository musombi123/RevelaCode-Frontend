import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useRevenueApi } from "@/services/revenueApi.jsx";

const HUB_MAP = {
  biashara: "biashara",
  shamba: "shamba",
  education: "elimu",
  elimu: "elimu",
  community: "community",
  smart_ai: "smart_ai",
  smartai: "smart_ai",
  marketplace: "marketplace",
  faith: "faith",
  theology: "faith",
  mahubiri: "faith",
};

// Cross-sell only related ecosystem streams within the active workspace.
// Admins still control which plans exist for each stream.
const RELATED_STREAMS = {
  biashara: ["biashara", "transaction_fees"],
  shamba: ["shamba"],
  elimu: ["elimu", "transaction_fees"],
  // Marketplace and advertising offers are intentionally Community-only.
  community: ["community", "marketplace", "advertising"],
  smart_ai: ["smart_ai"],
};

const HUB_LABELS = {
  biashara: "Biashara",
  shamba: "Shamba",
  elimu: "Elimu",
  community: "Community",
  smart_ai: "Smart AI",
  faith: "Faith & Scripture",
  marketplace: "Marketplace",
  transaction_fees: "Transaction fees",
  advertising: "Advertising",
  all: "Jumuiya",
};

const CHECKOUT_AUTO_WAIT_MS = 15 * 60 * 1000;
const CHECKOUT_POLL_START_MS = 10 * 1000;
const CHECKOUT_POLL_MAX_MS = 30 * 1000;
const TERMINAL_CHECKOUT_STATUSES = new Set([
  "succeeded",
  "failed",
  "initiation_failed",
  "sandbox_verified",
  "verified_activation_failed",
]);

function formatWaitTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function money(amount, currency = "KES") {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${currency} —`;
  return `${currency} ${new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function messageForError(error) {
  if (error?.status === 401) return "Your session has expired or is not authenticated. Sign in again before starting checkout.";
  if (error?.status === 403) return "Your account is not permitted to perform this checkout.";
  if (error?.status === 404) return "The Revenue Engine checkout endpoint is not available on the deployed backend yet.";
  if (error?.code === "mpesa_live_checkout_not_configured") return "Live M-PESA checkout is disabled by the backend's production-readiness checks. No payment prompt was sent.";
  if (error?.code === "mpesa_auth_unavailable") return "Daraja authentication failed before the STK request was submitted. Check the backend's live Daraja credentials.";
  if (error?.code === "mpesa_request_rejected") return "Daraja rejected the STK request. No phone prompt was accepted; review the checkout status and backend configuration.";
  if (error?.code === "mpesa_submission_unknown") return "Daraja's response could not be confirmed. Do not retry or pay again until finance reconciles this checkout.";
  return error?.message || "Unable to complete the request. Please review the checkout status before retrying.";
}

export default function HubRevenueOffers({ hub, compact = false }) {
  const revenueApi = useRevenueApi();
  const apiHub = HUB_MAP[String(hub || "").toLowerCase()] || "";
  const label = HUB_LABELS[apiHub] || "Jumuiya";

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [catalogCached, setCatalogCached] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [submittingCode, setSubmittingCode] = useState("");
  const [trial, setTrial] = useState(null);
  const trialDays = Number(trial?.trial_days) > 0 ? Number(trial.trial_days) : 30;
  const [trialLoading, setTrialLoading] = useState(true);
  const [trialStarting, setTrialStarting] = useState(false);
  const [trialError, setTrialError] = useState("");
  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionLoadError, setSubscriptionLoadError] = useState("");
  const [checkoutEnabled, setCheckoutEnabled] = useState(false);
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkout, setCheckout] = useState(null);
  const [checkoutRefreshing, setCheckoutRefreshing] = useState(false);
  const [checkoutAutoWaitLeftMs, setCheckoutAutoWaitLeftMs] = useState(0);
  const [checkoutAutoWindowFinished, setCheckoutAutoWindowFinished] = useState(false);
  const checkoutKeys = useRef({});
  const checkoutStateRef = useRef(null);
  const refreshCheckoutRef = useRef(null);
  const checkoutRefreshInFlightRef = useRef(false);

  const loadPlans = useCallback(async (signal) => {
    if (!apiHub) {
      setPlans([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");
    try {
      const streams = RELATED_STREAMS[apiHub] || [apiHub];
      const responses = await Promise.all(
        streams.map((stream) => revenueApi.listPlans(stream, { signal })),
      );
      // Cached prices may be displayed offline, but they are never sufficient
      // authority to enable a paid checkout. A fresh backend response is required.
      const cachedCatalogue = responses.some(
        (response) => response?.__revenue_offline_cache === true,
      );
      setCatalogCached(cachedCatalogue);
      setCheckoutEnabled(
        !cachedCatalogue && responses.some((response) => response?.checkout_enabled === true),
      );
      const uniquePlans = new Map();
      responses.forEach((response) => {
        (Array.isArray(response?.plans) ? response.plans : []).forEach((plan) => {
          if (!plan?.code || uniquePlans.has(plan.code)) return;
          // Normalize API values at the boundary so catalogue casing or
          // whitespace cannot silently turn a published plan into an
          // interest-only button with no phone field.
          uniquePlans.set(plan.code, {
            ...plan,
            code: String(plan.code).trim(),
            hub: String(plan.hub || "").trim().toLowerCase(),
            status: String(plan.status || "proposed").trim().toLowerCase(),
            interval: String(plan.interval || "month").trim().toLowerCase(),
          });
        });
      });
      setPlans([...uniquePlans.values()].filter((plan) => {
        const amount = Number(plan?.amount);
        return plan?.status !== "retired" && Number.isFinite(amount) && amount > 0;
      }));
    } catch (error) {
      if (error?.name !== "AbortError") setLoadError(messageForError(error));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [apiHub, revenueApi]);

  const loadTrial = useCallback(async (signal) => {
    if (!apiHub) { setTrialLoading(false); return; }
    setTrialLoading(true);
    setTrialError("");
    try {
      const response = await revenueApi.listTrials({ signal });
      const found = (Array.isArray(response?.trials) ? response.trials : []).find((item) => item?.hub === apiHub);
      setTrial(found || { hub: apiHub, status: "not_started", access: "start_trial" });
    } catch (error) {
      if (error?.name !== "AbortError") setTrialError(messageForError(error));
    } finally {
      if (!signal?.aborted) setTrialLoading(false);
    }
  }, [apiHub, revenueApi]);

  const loadSubscription = useCallback(async (signal) => {
    if (!apiHub) {
      setSubscription(null);
      setSubscriptionLoading(false);
      return;
    }
    setSubscriptionLoading(true);
    setSubscriptionLoadError("");
    try {
      const [response, checkoutResponse] = await Promise.all([
        revenueApi.listSubscriptions({ signal }),
        revenueApi.getCurrentCheckout(apiHub, { signal }),
      ]);
      if (
        response?.__revenue_offline_cache === true ||
        checkoutResponse?.__revenue_offline_cache === true
      ) {
        setSubscription(null);
        setSubscriptionLoadError(
          "Subscription and checkout status are available only from an offline cache. Reconnect and reload before starting a payment.",
        );
        return;
      }
      const active = (Array.isArray(response?.items) ? response.items : [])
        .filter((item) => item?.hub === apiHub && item?.status === "active")
        .sort((a, b) => new Date(b.ends_at || 0).getTime() - new Date(a.ends_at || 0).getTime())[0] || null;
      setSubscription(active);
      const nextCheckout = checkoutResponse?.checkout || (
        checkoutStateRef.current?.hub === apiHub && checkoutStateRef.current?.status === "succeeded"
          ? checkoutStateRef.current
          : null
      );
      checkoutStateRef.current = nextCheckout;
      setCheckout(nextCheckout);
    } catch (error) {
      if (error?.name !== "AbortError") {
        setSubscription(null);
        setSubscriptionLoadError("Could not verify this hub's existing subscription. Reload before making another payment.");
      }
    } finally {
      if (!signal?.aborted) setSubscriptionLoading(false);
    }
  }, [apiHub, revenueApi]);

  useEffect(() => {
    if (!apiHub || apiHub === "community") return undefined;
    const controller = new AbortController();
    loadPlans(controller.signal);
    loadTrial(controller.signal);
    loadSubscription(controller.signal);
    return () => controller.abort();
  }, [apiHub, loadPlans, loadTrial, loadSubscription]);

  useEffect(() => {
    checkoutStateRef.current = checkout;
  }, [checkout]);

  const startCheckout = async (plan) => {
    if (catalogCached || !checkoutEnabled) {
      setActionError(
        "Current plan pricing and live checkout readiness must be verified online. Reconnect and refresh plans before paying.",
      );
      return;
    }
    if (
      plan?.status !== "available" ||
      !["month", "year"].includes(String(plan?.interval || "").toLowerCase()) ||
      !(Number(plan?.amount) > 0)
    ) {
      setActionError("This plan is not currently approved for paid checkout.");
      return;
    }
    if (subscriptionLoading || subscriptionLoadError) {
      setActionError("The current subscription status could not be verified. Reload this hub before making a payment.");
      return;
    }
    if (subscription?.status === "active") {
      setActionError("This hub already has an active paid subscription. No second payment was started.");
      return;
    }
    if (checkout && [
      "initiating",
      "pending",
      "callback_received",
      "awaiting_verification",
      "verified_activation_failed",
      "submission_unknown",
    ].includes(checkout.status)) {
      setActionError("A payment for this hub is still unresolved. Refresh its status before making another payment.");
      return;
    }
    const phone = checkoutPhone.trim();
    if (!phone) {
      setActionError("Enter the Kenyan M-Pesa phone number that should receive the payment prompt.");
      return;
    }
    const keyScope = `${plan.code}:${phone.replace(/[\s()+-]/g, "")}`;
    const idempotencyKey = checkoutKeys.current[keyScope] || (
      globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `mpesa-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`
    );
    checkoutKeys.current[keyScope] = idempotencyKey;
    setSubmittingCode(plan.code);
    setActionError("");
    setNotice("");
    try {
      const response = await revenueApi.startCheckout(
        { plan_code: plan.code, phone },
        { idempotencyKey },
      );
      const started = response?.checkout || null;
      checkoutStateRef.current = started;
      setCheckout(started);
      setCheckoutAutoWindowFinished(false);
      setCheckoutAutoWaitLeftMs(
        started?.checkout_request_id ? CHECKOUT_AUTO_WAIT_MS : 0,
      );
      if (started?.status === "submission_unknown" || started?.status === "initiating" && !started?.checkout_request_id) {
        setActionError("The backend could not confirm whether Daraja accepted this request. No retry was sent. Do not pay again until finance reconciles the checkout.");
      } else if (started?.status === "initiation_failed" || started?.status === "failed") {
        setActionError(started?.message || started?.result_description || "Daraja rejected this checkout. No payment prompt was accepted.");
        delete checkoutKeys.current[keyScope];
      } else if (response?.replayed) {
        setNotice("An existing checkout was returned; no second STK prompt was sent. Check the status below.");
      } else if (started?.checkout_request_id) {
        setNotice("Daraja accepted the STK request. Check the selected phone for the M-PESA PIN prompt; this page will not display the PIN screen.");
      } else {
        setNotice(response?.message || "Checkout response received. Review the status below before taking any further action.");
      }
      if (started?.status !== "submission_unknown" && started?.status !== "initiating") {
        delete checkoutKeys.current[keyScope];
      }
    } catch (error) {
      if (error?.payload?.checkout) {
        checkoutStateRef.current = error.payload.checkout;
        setCheckout(error.payload.checkout);
      }
      setActionError(messageForError(error));
    } finally {
      setSubmittingCode("");
    }
  };

  const refreshCheckout = useCallback(async ({ automatic = false } = {}) => {
    const currentCheckout = checkoutStateRef.current;
    const checkoutId = currentCheckout?.checkout_request_id;
    if (!checkoutId || checkoutRefreshInFlightRef.current) return null;

    checkoutRefreshInFlightRef.current = true;
    if (!automatic) {
      setCheckoutRefreshing(true);
      setActionError("");
    }
    try {
      const response = await revenueApi.refreshCheckout(checkoutId);
      const updated = response?.checkout || null;
      if (updated) {
        checkoutStateRef.current = updated;
        setCheckout(updated);
      }
      if (updated?.status === "succeeded") {
        setNotice("Payment verified. Your subscription is active.");
        setSubscription(updated?.subscription || null);
        try {
          const entitlement = await revenueApi.getEntitlement(apiHub, { params: { feature: "premium" } });
          if (entitlement?.subscription) setSubscription(entitlement.subscription);
          if (entitlement?.premium_access) setNotice("Payment verified. Your " + label + " premium access is active.");
        } catch {
          // Checkout success is already confirmed by the backend; entitlement refresh is supplementary.
        }
        await loadSubscription();
      } else if (updated?.status === "failed") {
        setActionError(updated?.result_description || "M-Pesa reports that this payment was not completed. You can start a new checkout.");
      } else if (updated?.status === "verified_activation_failed") {
        setActionError("The payment was verified but access needs administrator reconciliation. Do not pay again; contact support.");
      } else if (updated?.status === "sandbox_verified") {
        setNotice("Daraja sandbox test succeeded. No live subscription or revenue was created; switch to production Daraja to enable paid checkout.");
      } else if (!automatic) {
        setNotice("M-Pesa status is still being verified. Automatic checks will continue for up to 15 minutes; do not submit another payment.");
      }
      return updated;
    } catch (error) {
      if (!automatic) setActionError(messageForError(error));
      return null;
    } finally {
      checkoutRefreshInFlightRef.current = false;
      if (!automatic) setCheckoutRefreshing(false);
    }
  }, [apiHub, label, loadSubscription, revenueApi]);

  useEffect(() => {
    refreshCheckoutRef.current = refreshCheckout;
  }, [refreshCheckout]);

  // Daraja may take several minutes to return a final result. Query on a paced
  // schedule for at most 15 minutes from checkout creation. The backend remains
  // authoritative; unknown/pending states never activate a subscription.
  useEffect(() => {
    const checkoutId = checkout?.checkout_request_id;
    const initialCheckout = checkoutStateRef.current;
    if (
      !checkoutId ||
      initialCheckout?.checkout_request_id !== checkoutId ||
      (initialCheckout?.hub && initialCheckout.hub !== apiHub) ||
      TERMINAL_CHECKOUT_STATUSES.has(initialCheckout?.status)
    ) {
      setCheckoutAutoWaitLeftMs(0);
      setCheckoutAutoWindowFinished(false);
      return undefined;
    }

    const createdAt = Date.parse(initialCheckout?.created_at || "");
    const startedAt = Number.isFinite(createdAt) ? createdAt : Date.now();
    let cancelled = false;
    let timer = null;
    let attempts = 0;

    const poll = async () => {
      const latest = checkoutStateRef.current;
      if (cancelled || latest?.checkout_request_id !== checkoutId) return;

      const remainingBefore = Math.max(0, CHECKOUT_AUTO_WAIT_MS - (Date.now() - startedAt));
      setCheckoutAutoWaitLeftMs(remainingBefore);
      if (remainingBefore <= 0) {
        setCheckoutAutoWindowFinished(true);
        setCheckoutAutoWaitLeftMs(0);
        return;
      }
      if (TERMINAL_CHECKOUT_STATUSES.has(latest?.status)) {
        setCheckoutAutoWindowFinished(false);
        setCheckoutAutoWaitLeftMs(0);
        return;
      }

      await refreshCheckoutRef.current?.({ automatic: true });
      if (cancelled) return;

      const after = checkoutStateRef.current;
      if (after?.checkout_request_id !== checkoutId) return;
      const remainingAfter = Math.max(0, CHECKOUT_AUTO_WAIT_MS - (Date.now() - startedAt));
      setCheckoutAutoWaitLeftMs(remainingAfter);
      if (TERMINAL_CHECKOUT_STATUSES.has(after?.status)) {
        setCheckoutAutoWindowFinished(false);
        setCheckoutAutoWaitLeftMs(0);
        return;
      }
      if (remainingAfter <= 0) {
        setCheckoutAutoWindowFinished(true);
        setCheckoutAutoWaitLeftMs(0);
        return;
      }

      attempts += 1;
      const nextDelay = Math.min(
        CHECKOUT_POLL_MAX_MS,
        CHECKOUT_POLL_START_MS + Math.min(attempts - 1, 4) * 5 * 1000,
        remainingAfter,
      );
      timer = setTimeout(poll, Math.max(1000, nextDelay));
    };

    const initialRemaining = Math.max(0, CHECKOUT_AUTO_WAIT_MS - (Date.now() - startedAt));
    setCheckoutAutoWaitLeftMs(initialRemaining);
    setCheckoutAutoWindowFinished(initialRemaining <= 0);
    if (initialRemaining > 0) timer = setTimeout(poll, Math.min(8 * 1000, initialRemaining));

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [apiHub, checkout?.checkout_request_id]);

  const startTrial = async () => {
    if (subscriptionLoading || subscriptionLoadError) {
      setTrialError("The current subscription status could not be verified. Reload this hub before starting a trial.");
      return;
    }
    if (checkout && ["initiating", "pending", "callback_received", "awaiting_verification", "verified_activation_failed", "submission_unknown"].includes(checkout.status)) {
      setTrialError("A payment for this hub is unresolved. Refresh its status before starting a trial.");
      return;
    }
    if (subscription?.status === "active") {
      setNotice("This hub already has an active paid subscription.");
      return;
    }
    setTrialStarting(true);
    setTrialError("");
    setActionError("");
    setNotice("");
    try {
      const response = await revenueApi.startTrial(apiHub);
      setTrial(response?.trial || null);
      setNotice(response?.message || `Your ${trialDays}-day ${label} trial is active.`);
    } catch (error) {
      setTrialError(messageForError(error));
    } finally {
      setTrialStarting(false);
    }
  };

  const requestPlan = async (plan) => {
    setSubmittingCode(plan.code);
    setActionError("");
    setNotice("");
    try {
      const response = await revenueApi.createIntent({
        plan_code: plan.code,
        stream: plan?.hub && plan.hub !== "all" ? plan.hub : apiHub,
        description: `Plan interest submitted from the ${label} hub.`,
      });
      setNotice(response?.message || "Your plan-interest request was recorded. No payment was initiated.");
    } catch (error) {
      if (error?.payload?.checkout) {
        checkoutStateRef.current = error.payload.checkout;
        setCheckout(error.payload.checkout);
      }
      setActionError(messageForError(error));
    } finally {
      setSubmittingCode("");
    }
  };

  if (!apiHub) return null;

  if (apiHub === "community") {
    return (
      <section className={`w-full rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-sm dark:border-emerald-900/60 dark:bg-slate-900 ${compact ? "sm:p-5" : "sm:p-6"}`}>
        <p className="text-sm font-black text-slate-900 dark:text-white">Community is permanently free</p>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Sponsored advertisements support this open hub. Community membership, posts, discovery and participation never require a paid subscription.</p>
      </section>
    );
  }

  return (
    <section className={`w-full rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900 ${compact ? "p-4 sm:p-5" : "p-5 sm:p-6"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-emerald-300 dark:bg-white/10">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">Platform-admin managed</p>
            <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">{label} plans</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Compare this hub’s plans. Published paid plans can start M-Pesa checkout when live billing is enabled; proposed plans only record interest. Paid access activates only after provider-confirmed payment.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            void Promise.all([loadPlans(), loadSubscription()]);
          }}
          disabled={loading || subscriptionLoading}
          className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh plans
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/25">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white">{trialDays}-day free {label} trial</p>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
              Each hub has its own one-time trial. The displayed duration comes from the Revenue Engine, and premium access is checked by the backend. Paid checkout appears only after production Daraja credentials and the registered HTTPS callback are configured.
            </p>
            {!subscriptionLoading && subscription?.status === "active" ? (
              <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Paid subscription active · {subscription.plan_code || "premium"} · access through {subscription.ends_at ? new Date(subscription.ends_at).toLocaleDateString() : "renewal date unavailable"}</p>
            ) : !trialLoading && trial?.status === "active" ? (
              <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Trial active · {trial.days_remaining ?? "—"} days remaining · ends {trial.ends_at ? new Date(trial.ends_at).toLocaleDateString() : "soon"}</p>
            ) : null}
            {!subscriptionLoading && subscriptionLoadError ? (
              <p role="alert" className="mt-2 text-xs leading-5 text-amber-700 dark:text-amber-300">{subscriptionLoadError}</p>
            ) : null}
            {!trialLoading && trial?.status === "expired" && subscription?.status !== "active" ? (
              <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">This hub’s free trial has ended. Select a plan when checkout becomes available.</p>
            ) : null}
          </div>
          {subscriptionLoading ? (
            <span className="text-xs text-slate-500">Checking subscription…</span>
          ) : subscription?.status === "active" ? (
            <span className="inline-flex min-h-10 items-center rounded-xl bg-emerald-100 px-4 text-xs font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">Paid access active</span>
          ) : trialLoading ? (
            <span className="text-xs text-slate-500">Checking trial…</span>
          ) : trial?.status === "active" ? (
            <span className="inline-flex min-h-10 items-center rounded-xl bg-emerald-100 px-4 text-xs font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">Trial active</span>
          ) : trial?.status === "expired" ? (
            <button type="button" disabled className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-200 px-4 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">Trial used</button>
          ) : (
            <button type="button" onClick={startTrial} disabled={trialStarting || Boolean(checkout && ["initiating", "pending", "callback_received", "awaiting_verification", "verified_activation_failed", "submission_unknown"].includes(checkout.status))} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
              {trialStarting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {trialStarting ? "Starting trial…" : `Start ${trialDays}-day free trial`}
            </button>
          )}
        </div>
        {trialError ? <p role="alert" className="mt-3 text-xs leading-5 text-red-700 dark:text-red-300">{trialError}</p> : null}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Plan prices are managed centrally. Production M-Pesa checkout is available only for administrator-published plans; access activates only after verified provider confirmation.</span>
      </div>

      {checkoutEnabled && !subscriptionLoading && !subscriptionLoadError && subscription?.status !== "active" && plans.some((plan) => plan.status === "available" && ["month", "year"].includes(plan.interval) && Number(plan.amount) > 0) ? (
        <div className="mt-4 rounded-xl border border-emerald-200 p-4 dark:border-emerald-900/50">
          <label htmlFor="revenue-mpesa-phone" className="block text-xs font-bold text-slate-800 dark:text-slate-100">M-Pesa phone number</label>
          <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">Use a Kenyan Safaricom mobile number. The payment prompt will be sent to this phone.</p>
          <input
            id="revenue-mpesa-phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="0712 345 678"
            value={checkoutPhone}
            onChange={(event) => setCheckoutPhone(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
      ) : null}

      {checkout ? (
        <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white">M-Pesa checkout · {checkout.status?.replaceAll("_", " ")}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{checkout.message || checkout.result_description || "Waiting for the provider's final confirmation."}</p>
              {checkout.checkout_request_id ? <p className="mt-2 break-all font-mono text-[10px] text-slate-500">Reference: {checkout.checkout_request_id}</p> : null}
              {checkout.receipt ? <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Receipt: {checkout.receipt}</p> : null}
              {checkout.checkout_request_id && !TERMINAL_CHECKOUT_STATUSES.has(checkout.status) && checkoutAutoWaitLeftMs > 0 ? (
                <p className="mt-2 text-[11px] font-semibold leading-5 text-emerald-700 dark:text-emerald-300">
                  Automatically checking payment status · {formatWaitTime(checkoutAutoWaitLeftMs)} remaining. Do not submit another payment.
                </p>
              ) : null}
              {checkout.checkout_request_id && !TERMINAL_CHECKOUT_STATUSES.has(checkout.status) && checkoutAutoWindowFinished ? (
                <p className="mt-2 text-[11px] font-semibold leading-5 text-amber-700 dark:text-amber-300">
                  The 15-minute automatic-check window has ended, but this transaction is still unresolved. The checkout is retained; do not pay again. Use manual refresh or contact support for reconciliation.
                </p>
              ) : null}
            </div>
            {checkout.status === "succeeded" ? (
              <span className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">Subscription active</span>
            ) : checkout.status === "failed" ? (
              <span className="rounded-lg bg-rose-100 px-3 py-2 text-xs font-bold text-rose-800 dark:bg-rose-900/30 dark:text-rose-200">Payment not completed</span>
            ) : ["submission_unknown", "initiating"].includes(checkout.status) && !checkout.checkout_request_id ? (
              <span className="max-w-64 rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold leading-5 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">Do not pay again. Finance must reconcile the provider record before this checkout can be released.</span>
            ) : (
              <button type="button" onClick={refreshCheckout} disabled={checkoutRefreshing || !checkout.checkout_request_id} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">
                <RefreshCw className={`h-3.5 w-3.5 ${checkoutRefreshing ? "animate-spin" : ""}`} />
                {checkoutRefreshing ? "Checking..." : "Refresh payment status"}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {catalogCached ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>These prices are cached for offline viewing only. Paid checkout is disabled until the backend confirms current plans and payment readiness online.</span>
        </div>
      ) : null}

      {loadError ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      ) : null}

      {actionError ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      ) : null}

      {notice ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 flex items-center gap-2 py-5 text-xs text-slate-500 dark:text-slate-400">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading centrally managed plans...
        </div>
      ) : !loadError && plans.length === 0 ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-5 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>No paid plans have been published for {label} yet. The platform administrator manages this catalogue.</span>
        </div>
      ) : (
        <div className={`mt-4 grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
          {plans.map((plan) => (
            <article key={plan.code} className="flex min-w-0 flex-col rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="break-words text-sm font-bold text-slate-900 dark:text-white">{plan.name}</h4>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{plan.interval === "one_time" ? "One-time" : `Per ${plan.interval || "month"}`}</p>
                </div>
                <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                  {HUB_LABELS[plan.hub] || label} · {plan.status === "available" ? "Published" : "Proposed"}
                </span>
              </div>
              <p className="mt-3 text-xl font-black tracking-tight text-slate-950 dark:text-white">{money(plan.amount, plan.currency || "KES")}</p>
              {Array.isArray(plan.features) && plan.features.length > 0 ? (
                <ul className="mt-3 flex-1 space-y-1.5">
                  {plan.features.slice(0, 4).map((feature, index) => (
                    <li key={`${plan.code}-${index}`} className="flex items-start gap-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {catalogCached ? (
                <button
                  type="button"
                  onClick={() => {
                    void Promise.all([loadPlans(), loadSubscription()]);
                  }}
                  disabled={loading || subscriptionLoading}
                  className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-amber-300 px-4 py-2.5 text-xs font-bold text-amber-800 disabled:opacity-50 dark:border-amber-800 dark:text-amber-200"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "Verifying catalogue…" : "Reconnect to verify plan"}
                </button>
              ) : subscriptionLoading || subscriptionLoadError ? (
                <div className="mt-4 rounded-xl border border-amber-200 px-3 py-2.5 text-xs leading-5 text-amber-800 dark:border-amber-900/50 dark:text-amber-200">
                  Verify existing subscription status before starting another payment.
                </div>
              ) : subscription?.status === "active" ? (
                <div className="mt-4 rounded-xl border border-emerald-200 px-3 py-2.5 text-xs leading-5 text-emerald-800 dark:border-emerald-900/50 dark:text-emerald-200">
                  Subscription active through {subscription.ends_at ? new Date(subscription.ends_at).toLocaleDateString() : "the current period"}.
                </div>
              ) : checkoutEnabled && plan.status === "available" && ["month", "year"].includes(plan.interval) && Number(plan.amount) > 0 ? (
                <button
                  type="button"
                  onClick={() => startCheckout(plan)}
                  disabled={Boolean(submittingCode) || !checkoutPhone.trim() || Boolean(checkout && ["pending", "initiating", "callback_received", "awaiting_verification", "verified_activation_failed", "submission_unknown"].includes(checkout.status))}
                  className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingCode === plan.code ? "Starting M-Pesa..." : `Pay ${money(plan.amount, plan.currency || "KES")} with M-Pesa`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => requestPlan(plan)}
                  disabled={Boolean(submittingCode)}
                  className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {submittingCode === plan.code ? "Submitting request..." : "Request plan details"}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
