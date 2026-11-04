import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, LockKeyhole, RefreshCw, ShieldCheck, Smartphone, Star, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { useRevenueApi } from "@/services/revenueApi.jsx";

const COPY = {
  en: {
    title: "Choose your Premium plan",
    subtitle: "Secure M-Pesa checkout. Your plan activates only after payment is verified.",
    freeAccessTitle: "Free access is included",
    freeAccessText: "Every account keeps essential platform access. Community and Faith remain free and are not sold as paid hub subscriptions.",
    communityFree: "Community access is permanently free and supported by sponsored advertising. Advertising placements are separate from subscriptions and are reviewed.",
    faithFree: "Faith Hub access is free. No Faith subscription checkout is offered.",
    trialTitle: "Free hub trials",
    trialText: "Eligible signed-in accounts can start one trial per hub. Trial length and eligibility are confirmed by the Revenue Engine.",
    trialStart: "Start free trial",
    trialStarting: "Starting trial…",
    trialActive: "Trial active",
    trialUsed: "Trial already used",
    trialNotStarted: "Trial available",
    trialDays: "Trial length",
    daysRemaining: "days remaining",
    trialLogin: "Sign in to check and start your trial",
    trialUnavailable: "Trial eligibility is temporarily unavailable. You can still view published plans.",
    freeIncluded: "Included at no charge",
    billingTerms: "M-Pesa charges are made once for the selected period. Automatic recurring renewals are not enabled. Access is activated only after the Backend verifies payment.",
    paidPlansTitle: "Paid hub plans",
    paidPlansText: "Plan pricing, periods, publication status and included features come from the live Backend catalogue.",
    daysUnit: "days",
    paidPlansTitle: "Paid hub plans",
    paidPlansText: "Plan pricing, periods, publication status and included features come from the live Backend catalogue.",
    daysUnit: "days",
    loading: "Loading current plans…",
    empty: "No paid plans are currently published.",
    offline: "No internet connection. Reconnect to load current prices and pay securely.",
    unavailable: "M-Pesa checkout is temporarily unavailable. Please contact support.",
    loginTitle: "Sign in to continue",
    loginText: "Log in or create your RevelaCode account first. Your selected plan will be kept.",
    login: "Log in / Register",
    choose: "Choose plan",
    proposed: "Not yet available",
    phoneTitle: "M-Pesa payment",
    phoneHelp: "Enter the Kenyan mobile number that should receive the STK prompt.",
    phone: "M-Pesa phone number",
    phoneError: "Enter a valid Kenyan number: 07xx, 01xx, 2547xx, 2541xx or +254…",
    amount: "Amount to pay",
    duration: "Duration",
    pay: "Pay",
    withMpesa: "with M-Pesa",
    sending: "Sending STK request…",
    pendingTitle: "Check your phone",
    pendingText: "Check your phone and enter your M-Pesa PIN to approve this payment.",
    pendingSub: "Keep this screen open. RevelaCode is checking the payment status.",
    remaining: "Time remaining",
    stop: "Cancel waiting",
    stopNote: "This stops status checking only. It cannot cancel an STK prompt already accepted by Safaricom.",
    successTitle: "Premium activated",
    successText: "Your payment is verified and your subscription is active.",
    receipt: "M-Pesa receipt",
    receiptPending: "Receipt is still syncing. Your verified subscription is active.",
    expires: "Access expires",
    start: "Start using Premium",
    failedTitle: "Payment not completed",
    tryAgain: "Try again",
    timeoutTitle: "Still waiting for confirmation",
    timeoutText: "If money was deducted, it will be activated automatically. Contact support with the M-Pesa receipt.",
    close: "Close",
    refresh: "Refresh plans",
    monthly: "30 days",
    yearly: "365 days",
    oneTime: "One-time",
    best: "Best value",
    published: "Available",
    pendingTag: "Awaiting admin approval",
    network: "No internet connection. Check your connection and try again.",
    unknown: "The payment request could not be confirmed. Do not pay again until its status is reconciled.",
  },
  sw: {
    title: "Chagua mpango wako wa Premium",
    subtitle: "Malipo salama ya M-Pesa. Mpango utaanza baada ya malipo kuthibitishwa.",
    freeAccessTitle: "Huduma za bure zimejumuishwa",
    freeAccessText: "Kila akaunti hupata huduma muhimu za jukwaa. Community na Faith hubaki bure na haziuzwi kama usajili wa hub.",
    communityFree: "Community ni bure daima na inawezeshwa na matangazo yanayodhaminiwa. Nafasi za matangazo hushughulikiwa tofauti na usajili na hukaguliwa.",
    faithFree: "Huduma za Faith Hub ni bure. Hakuna malipo ya usajili wa Faith.",
    trialTitle: "Majaribio ya bure ya hub",
    trialText: "Akaunti zilizoingia na zinazostahili zinaweza kuanza jaribio moja kwa kila hub. Muda na kustahili huthibitishwa na Revenue Engine.",
    trialStart: "Anza jaribio la bure",
    trialStarting: "Inaanzisha jaribio…",
    trialActive: "Jaribio linaendelea",
    trialUsed: "Jaribio tayari lilitumika",
    trialNotStarted: "Jaribio linapatikana",
    trialDays: "Muda wa jaribio",
    daysRemaining: "siku zimebaki",
    trialLogin: "Ingia ili kuona na kuanza jaribio lako",
    trialUnavailable: "Hali ya kustahili jaribio haipatikani kwa sasa. Bado unaweza kuona mipango iliyochapishwa.",
    freeIncluded: "Imejumuishwa bila malipo",
    billingTerms: "Malipo ya M-Pesa hutozwa mara moja kwa kipindi kilichochaguliwa. Malipo ya kujirudia kiotomatiki hayajawashwa. Huduma huanza tu baada ya Backend kuthibitisha malipo.",
    paidPlansTitle: "Mipango ya kulipia ya hub",
    paidPlansText: "Bei, vipindi, hali ya uchapishaji na vipengele vinatoka kwenye orodha ya sasa ya Backend.",
    daysUnit: "siku",
    paidPlansTitle: "Mipango ya kulipia ya hub",
    paidPlansText: "Bei, vipindi, hali ya uchapishaji na vipengele vinatoka kwenye orodha ya sasa ya Backend.",
    daysUnit: "siku",
    loading: "Inapakia mipango ya sasa…",
    empty: "Hakuna mipango ya kulipia iliyochapishwa kwa sasa.",
    offline: "Hakuna intaneti. Unganisha tena ili kupata bei za sasa na kulipa kwa usalama.",
    unavailable: "Malipo ya M-Pesa hayapatikani kwa sasa. Tafadhali wasiliana na usaidizi.",
    loginTitle: "Ingia ili kuendelea",
    loginText: "Ingia au fungua akaunti ya RevelaCode kwanza. Mpango uliochagua utahifadhiwa.",
    login: "Ingia / Jisajili",
    choose: "Chagua mpango",
    proposed: "Bado haupatikani",
    phoneTitle: "Malipo ya M-Pesa",
    phoneHelp: "Weka nambari ya simu ya Kenya itakayopokea ombi la STK.",
    phone: "Nambari ya simu ya M-Pesa",
    phoneError: "Weka nambari halali ya Kenya: 07xx, 01xx, 2547xx, 2541xx au +254…",
    amount: "Kiasi cha kulipa",
    duration: "Muda",
    pay: "Lipa",
    withMpesa: "kwa M-Pesa",
    sending: "Inatuma ombi la STK…",
    pendingTitle: "Angalia simu yako",
    pendingText: "Angalia simu yako na uweke PIN ya M-Pesa ili kuthibitisha malipo.",
    pendingSub: "Acha ukurasa huu wazi. RevelaCode inakagua hali ya malipo.",
    remaining: "Muda uliobaki",
    stop: "Sitisha kusubiri",
    stopNote: "Hii inasitisha ukaguzi pekee. Haiwezi kufuta ombi la STK ambalo Safaricom tayari imekubali.",
    successTitle: "Premium imewashwa",
    successText: "Malipo yamethibitishwa na usajili wako umeanza.",
    receipt: "Risiti ya M-Pesa",
    receiptPending: "Risiti bado inasawazishwa. Usajili wako uliothibitishwa umeanza.",
    expires: "Huduma inaisha",
    start: "Anza kutumia Premium",
    failedTitle: "Malipo hayajakamilika",
    tryAgain: "Jaribu tena",
    timeoutTitle: "Bado tunasubiri uthibitisho",
    timeoutText: "Kama pesa zimekatwa, huduma itawashwa kiotomatiki. Wasiliana na usaidizi ukiwa na risiti ya M-Pesa.",
    close: "Funga",
    refresh: "Onyesha upya mipango",
    monthly: "Siku 30",
    yearly: "Siku 365",
    oneTime: "Mara moja",
    best: "Thamani bora",
    published: "Inapatikana",
    pendingTag: "Inasubiri idhini ya msimamizi",
    network: "Hakuna intaneti. Kagua muunganisho wako kisha ujaribu tena.",
    unknown: "Hali ya ombi la malipo haijathibitishwa. Usilipe tena hadi malipo hayo yakaguliwe.",
  },
};

const PAID_SUBSCRIPTION_HUBS = new Set(["smart_ai", "shamba", "biashara", "elimu", "marketplace"]);
const TRIAL_HUBS = [
  { hub: "smart_ai", name: "RevelaAI" },
  { hub: "shamba", name: "Shamba" },
  { hub: "biashara", name: "Biashara" },
  { hub: "elimu", name: "Elimu" },
  { hub: "marketplace", name: "Marketplace" },
];

function normalisePhone(value) {
  const raw = String(value || "").trim().replace(/[\s()-]/g, "");
  let digits = raw.startsWith("+") ? raw.slice(1) : raw;
  if (/^0[17]\d{8}$/.test(digits)) digits = "254" + digits.slice(1);
  if (/^[17]\d{8}$/.test(digits)) digits = "254" + digits;
  return /^254[17]\d{8}$/.test(digits) ? digits : "";
}

function maskPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return /^254[17]\d{8}$/.test(digits) ? `${digits.slice(0, 4)}****${digits.slice(-4)}` : "invalid";
}

function formatMoney(amount, currency = "KES") {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${currency} —`;
  return `${currency} ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value)}`;
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function durationText(plan, t) {
  const interval = String(plan?.interval || "month").toLowerCase();
  return interval === "year" ? t.yearly : interval === "one_time" ? t.oneTime : t.monthly;
}

function paymentFailure(checkout, t, language) {
  const code = String(checkout?.result_code ?? checkout?.callback_result_code ?? "");
  const messages = {
    "1032": "You cancelled the M-Pesa request.",
    "1": "Insufficient M-Pesa balance. Top up and try again.",
    "2001": "The M-Pesa PIN was not accepted. Check your PIN and try again.",
    "1037": "The phone did not respond before the STK request expired. Request another prompt.",
  };
  if (language === "sw") {
    const swahili = {
      "1032": "Umeghairi ombi la M-Pesa.",
      "1": "Salio la M-Pesa halitoshi. Ongeza salio kisha ujaribu tena.",
      "2001": "PIN ya M-Pesa haikukubaliwa. Hakikisha PIN yako kisha ujaribu tena.",
      "1037": "Simu haikujibu kabla ombi la STK kuisha. Omba ujumbe mwingine.",
    };
    if (swahili[code]) return swahili[code];
  }
  return messages[code] || checkout?.result_description || checkout?.message || t.failedTitle;
}

function paymentLog(stage, details = {}) {
  console.info("[premium-payment]", { stage, ...details });
}

function paymentLogError(stage, error) {
  console.error("[premium-payment]", {
    stage,
    status: error?.status || null,
    code: error?.code || error?.name || "payment_error",
  });
}

export default function PlansModal({
  open,
  onClose,
  onRequireLogin,
  initialPlanCode = "",
  onPlanActivated,
}) {
  const { user } = useAuth();
  const revenueApi = useRevenueApi();
  const [language, setLanguage] = useState("en");
  const t = COPY[language];
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState("");
  const [checkoutEnabled, setCheckoutEnabled] = useState(false);
  const [catalogOffline, setCatalogOffline] = useState(false);
  const [trials, setTrials] = useState([]);
  const [trialCatalogueAvailable, setTrialCatalogueAvailable] = useState(false);
  const [trialError, setTrialError] = useState("");
  const [trialStartingHub, setTrialStartingHub] = useState("");
  const [step, setStep] = useState("catalog");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkout, setCheckout] = useState(null);
  const [failureText, setFailureText] = useState("");
  const [polling, setPolling] = useState(false);
  const [pollingPaused, setPollingPaused] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(90);
  const pollInFlight = useRef(false);
  const pollDeadline = useRef(0);
  const idempotencyKey = useRef("");
  const checkoutRef = useRef(null);

  const authenticated = Boolean(user?.id || user?.user_id || user?._id) &&
    String(user?.role || "").toLowerCase() !== "guest";

  const resetForPlan = useCallback((plan) => {
    setSelectedPlan(plan || null);
    setPhoneError("");
    setFailureText("");
    setCheckout(null);
    checkoutRef.current = null;
    idempotencyKey.current = "";
    setPolling(false);
    setPollingPaused(false);
    setRemainingSeconds(90);
    setStep(plan ? "phone" : "catalog");
    if (plan) {
      const profilePhone = user?.phone || user?.phone_number || user?.mobile || user?.contact_phone || user?.contact || "";
      setPhone(/^[+\d][+\d\s()-]{7,18}$/.test(String(profilePhone)) ? String(profilePhone) : "");
    }
  }, [user]);

  const loadPlans = useCallback(async (signal) => {
    setPlansLoading(true);
    setPlansError("");
    setCatalogOffline(false);
    setTrials([]);
    setTrialCatalogueAvailable(false);
    setTrialError("");
    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        throw Object.assign(new Error(t.network), { name: "RevenueApiNetworkError" });
      }
      const [catalogue, current, trialResult] = await Promise.all([
        revenueApi.listPlans(undefined, { signal, requestScope: "" }),
        authenticated ? revenueApi.getCurrentCheckout("", { signal, requestScope: "" }) : Promise.resolve(null),
        authenticated
          ? revenueApi.listTrials({ signal, requestScope: "" })
              .then((value) => ({ value }))
              .catch((error) => {
                paymentLogError("trial_catalogue_load_failed", error);
                return { error };
              })
          : Promise.resolve({ value: null }),
      ]);
      const cached = catalogue?.__revenue_offline_cache === true;
      setCatalogOffline(cached);
      setCheckoutEnabled(!cached && catalogue?.checkout_enabled === true);
      const rows = Array.isArray(catalogue?.plans) ? catalogue.plans : [];
      // Keep zero-cost and paid plans in the same server-backed catalogue.
      // The UI separates them so free access is never sent to M-Pesa checkout.
      setPlans(rows.filter((item) => item && item.status !== "retired"));
      const trialRows = trialResult?.value?.trials;
      setTrials(Array.isArray(trialRows) ? trialRows : []);
      setTrialCatalogueAvailable(Array.isArray(trialRows));
      setTrialError(trialResult?.error ? t.trialUnavailable : "");
      if (current?.checkout) {
        const saved = current.checkout;
        const matching = rows.find((item) => item.code === saved.plan_code);
        if (matching && ["initiating", "pending", "callback_received", "awaiting_verification", "submission_unknown"].includes(saved.status)) {
          setSelectedPlan(matching);
          setCheckout(saved);
          checkoutRef.current = saved;
          setStep(saved.checkout_request_id ? "waiting" : "unknown");
          setPolling(Boolean(saved.checkout_request_id));
          setPollingPaused(false);
          pollDeadline.current = Date.now() + 90000;
          setRemainingSeconds(90);
          paymentLog("pending_checkout_restored", { planCode: saved.plan_code, checkoutReferencePresent: Boolean(saved.checkout_request_id) });
        }
      }
      paymentLog("plans_loaded", { count: rows.length, checkoutEnabled: catalogue?.checkout_enabled === true, cached });
    } catch (error) {
      paymentLogError("plans_load_failed", error);
      setPlansError(typeof navigator !== "undefined" && navigator.onLine === false ? t.network : error?.message || t.unavailable);
      setCheckoutEnabled(false);
    } finally {
      setPlansLoading(false);
    }
  }, [authenticated, revenueApi, t.network, t.unavailable, t.trialUnavailable]);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    loadPlans(controller.signal).catch((error) => paymentLogError("plans_load_unhandled", error));
    return () => controller.abort();
  }, [open, loadPlans]);

  useEffect(() => {
    if (!open || !initialPlanCode || !plans.length) return;
    const plan = plans.find((item) => item.code === initialPlanCode);
    if (!plan) return;
    if (!authenticated) {
      setSelectedPlan(plan);
      setStep("login");
    } else if (step === "catalog" || step === "login") {
      resetForPlan(plan);
    }
  }, [open, initialPlanCode, plans, authenticated, step, resetForPlan]);

  const pollStatus = useCallback(async () => {
    const current = checkoutRef.current;
    const checkoutId = current?.checkout_request_id;
    if (!checkoutId || pollInFlight.current) return;
    if (Date.now() >= pollDeadline.current) {
      setPolling(false);
      setPollingPaused(false);
      setStep("timeout");
      paymentLog("poll_timeout", { checkoutReferencePresent: true });
      return;
    }

    pollInFlight.current = true;
    try {
      const response = await revenueApi.getCheckout(checkoutId, { requestScope: "" });
      const updated = response?.checkout || current;
      checkoutRef.current = updated;
      setCheckout(updated);
      const status = String(updated?.status || "pending").toLowerCase();
      setFailureText("");
      paymentLog("status_received", { status, checkoutReferencePresent: true });
      if (status === "succeeded") {
        setPolling(false);
        setPollingPaused(false);
        setStep("success");
        setFailureText("");
        try {
          await revenueApi.getMySubscription({ requestScope: "" });
          window.dispatchEvent(new Event("revelacode:subscription-updated"));
        } catch (error) {
          paymentLogError("subscription_refresh_failed", error);
        }
        return;
      }
      if (status === "failed" || status === "initiation_failed") {
        setPolling(false);
        setPollingPaused(false);
        setFailureText(paymentFailure(updated, t, language));
        setStep("failed");
        return;
      }
      if (status === "verified_activation_failed") {
        setPolling(false);
        setPollingPaused(false);
        setFailureText("Payment was verified, but subscription activation needs support reconciliation. Do not pay again.");
        setStep("failed");
      }
    } catch (error) {
      paymentLogError("status_poll_failed", error);
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setFailureText(t.network);
      }
    } finally {
      pollInFlight.current = false;
    }
  }, [revenueApi, t, language]);

  useEffect(() => {
    if (!open || !polling || !checkout?.checkout_request_id) return undefined;
    const tick = () => {
      const left = Math.max(0, Math.ceil((pollDeadline.current - Date.now()) / 1000));
      setRemainingSeconds(left);
      if (left <= 0) {
        setPolling(false);
        setStep("timeout");
        return;
      }
      pollStatus().catch((error) => paymentLogError("status_poll_unhandled", error));
    };
    tick();
    const interval = window.setInterval(tick, 3000);
    return () => window.clearInterval(interval);
  }, [open, polling, checkout?.checkout_request_id, pollStatus]);

  const bestValueCodes = useMemo(() => {
    const yearly = plans.filter((item) => String(item.interval).toLowerCase() === "year");
    const grouped = new Map();
    yearly.forEach((item) => {
      const key = String(item.hub || "");
      const rate = Number(item.amount) / 365;
      const prior = grouped.get(key);
      if (!prior || rate < prior.rate) grouped.set(key, { code: item.code, rate });
    });
    const annualBest = yearly
      .filter((item) => grouped.get(String(item.hub || ""))?.code === item.code)
      .map((item) => item.code);
    const explicitlyMarked = plans.filter((item) => item.best_value === true).map((item) => item.code);
    return new Set([...annualBest, ...explicitlyMarked]);
  }, [plans]);

  const freePlan = useMemo(
    () => plans.find((item) => String(item.hub || "").toLowerCase() === "all" && Number(item.amount) <= 0) || null,
    [plans],
  );

  const paidPlans = useMemo(
    () => plans.filter((item) =>
      Number(item.amount) > 0 &&
      PAID_SUBSCRIPTION_HUBS.has(String(item.hub || "").toLowerCase()) &&
      ["month", "year"].includes(String(item.interval || "").toLowerCase())
    ),
    [plans],
  );

  const trialCards = useMemo(
    () => TRIAL_HUBS.map((item) => ({
      ...item,
      ...(trials.find((trial) => String(trial.hub || "").toLowerCase() === item.hub) || {
        status: trialCatalogueAvailable ? "not_started" : "unavailable",
        trial_days: null,
        days_remaining: 0,
      }),
    })),
    [trials, trialCatalogueAvailable],
  );

  const startHubTrial = async (hub) => {
    if (!authenticated) {
      onRequireLogin?.("");
      return;
    }
    if (trialStartingHub) return;
    setTrialError("");
    setTrialStartingHub(hub);
    try {
      const response = await revenueApi.startTrial(hub, { requestScope: "" });
      const activatedTrial = response?.trial;
      if (!activatedTrial) throw new Error(t.trialUnavailable);
      setTrials((current) => [
        ...current.filter((item) => item.hub !== hub),
        activatedTrial,
      ]);
      setTrialCatalogueAvailable(true);
      window.dispatchEvent(new Event("revelacode:entitlements-updated"));
      onPlanActivated?.(hub);
    } catch (error) {
      paymentLogError("trial_start_failed", error);
      setTrialError(error?.message || t.trialUnavailable);
    } finally {
      setTrialStartingHub("");
    }
  };

  const startPayment = async () => {
    if (!selectedPlan || submitting) return;
    if (!authenticated) {
      setStep("login");
      return;
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setFailureText(t.network);
      setStep("failed");
      return;
    }
    const normalized = normalisePhone(phone);
    if (!normalized) {
      setPhoneError(t.phoneError);
      return;
    }
    if (selectedPlan.status !== "available" || !checkoutEnabled || catalogOffline) {
      setFailureText(catalogOffline ? t.offline : t.unavailable);
      setStep("failed");
      return;
    }

    const key = globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `rc-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    idempotencyKey.current = key;
    setSubmitting(true);
    setFailureText("");
    paymentLog("plan_button_clicked", { planCode: selectedPlan.code, phone: maskPhone(normalized) });
    paymentLog("initiate_request_sent", { method: "POST", path: "/api/revenue/checkout", planCode: selectedPlan.code, phone: maskPhone(normalized) });
    try {
      const response = await revenueApi.startCheckout(
        { plan_code: selectedPlan.code, phone: normalized },
        { idempotencyKey: key, requestScope: "" },
      );
      const started = response?.checkout || null;
      checkoutRef.current = started;
      setCheckout(started);
      paymentLog("initiate_response_received", {
        accepted: response?.success === true,
        status: started?.status || "unknown",
        checkoutReferencePresent: Boolean(started?.checkout_request_id),
      });
      if (started?.status === "submission_unknown" || started?.status === "initiating" && !started?.checkout_request_id) {
        setFailureText(t.unknown);
        setStep("failed");
        return;
      }
      if (started?.status === "initiation_failed" || started?.status === "failed") {
        setFailureText(paymentFailure(started, t, language));
        setStep("failed");
        return;
      }
      if (!started?.checkout_request_id) {
        setFailureText(t.unknown);
        setStep("failed");
        return;
      }
      pollDeadline.current = Date.now() + 90000;
      setRemainingSeconds(90);
      setPollingPaused(false);
      setPolling(true);
      setStep("waiting");
      paymentLog("stk_accepted", { planCode: selectedPlan.code, checkoutReferencePresent: true });
    } catch (error) {
      paymentLogError("initiate_failed", error);
      if (error?.payload?.checkout) {
        checkoutRef.current = error.payload.checkout;
        setCheckout(error.payload.checkout);
      }
      setFailureText(
        typeof navigator !== "undefined" && navigator.onLine === false
          ? t.network
          : error?.message || t.unavailable
      );
      setStep("failed");
    } finally {
      setSubmitting(false);
    }
  };

  const choosePlan = (plan) => {
    setFailureText("");
    if (!authenticated) {
      setSelectedPlan(plan);
      setStep("login");
      return;
    }
    resetForPlan(plan);
    paymentLog("plan_selected", { planCode: plan.code });
  };

  const returnToCatalog = () => {
    setPolling(false);
    setStep("catalog");
    setSelectedPlan(null);
    setCheckout(null);
    checkoutRef.current = null;
    setFailureText("");
  };

  if (!open) return null;

  const selectedDuration = selectedPlan ? durationText(selectedPlan, t) : "";
  const modal = (
    <div className="fixed inset-0 z-[12000] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && step !== "waiting") onClose?.();
    }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-plans-title"
        className="relative flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950 sm:max-h-[90dvh] sm:rounded-[28px]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-7">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-amber-600 dark:text-amber-300">
              <Star className="h-4 w-4" fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em]">RevelaCode Pro</span>
            </div>
            <h2 id="premium-plans-title" className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{t.title}</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">{t.subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex rounded-xl border border-slate-200 p-1 text-[11px] font-bold dark:border-slate-700">
              <button type="button" onClick={() => setLanguage("en")} aria-pressed={language === "en"} className={`min-h-9 rounded-lg px-2.5 ${language === "en" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950" : "text-slate-500"}`}>EN</button>
              <button type="button" onClick={() => setLanguage("sw")} aria-pressed={language === "sw"} className={`min-h-9 rounded-lg px-2.5 ${language === "sw" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950" : "text-slate-500"}`}>SW</button>
            </div>
            <button type="button" onClick={onClose} aria-label={t.close} className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
          {step === "catalog" ? (
            <>
              {plansLoading ? <div className="flex items-center gap-2 py-10 text-sm text-slate-500"><RefreshCw className="h-5 w-5 animate-spin" />{t.loading}</div> : null}
              {!plansLoading && plansError ? <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{plansError}</div> : null}
              {catalogOffline ? <div role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">{t.offline}</div> : null}

              <section className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{t.freeAccessTitle}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{t.freeAccessText}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {freePlan ? (
                    <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">{freePlan.name}</h4>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Core ecosystem access</p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black uppercase text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">{t.freeIncluded}</span>
                      </div>
                      <p className="mt-3 text-xl font-black text-slate-950 dark:text-white">FREE</p>
                      {Array.isArray(freePlan.features) && freePlan.features.length ? (
                        <ul className="mt-3 space-y-1.5">
                          {freePlan.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />{feature}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  ) : null}
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">Community</h4>
                      <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{t.communityFree}</p>
                    </div>
                    <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">Faith Hub</h4>
                      <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{t.faithFree}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-6">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-950 dark:text-white">{t.trialTitle}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{t.trialText}</p>
                  </div>
                </div>
                {!authenticated ? (
                  <div className="mt-3 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">{t.trialLogin}</p>
                    <button type="button" onClick={() => onRequireLogin?.("")} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white dark:bg-white dark:text-slate-950">{t.login}</button>
                  </div>
                ) : (
                  <>
                    {trialError ? <p role="alert" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">{trialError}</p> : null}
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {trialCards.map((trial) => {
                        const active = trial.status === "active";
                        const used = trial.status === "expired";
                        const available = trial.status === "not_started";
                        const unavailable = trial.status === "unavailable";
                        return (
                          <article key={trial.hub} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-black text-slate-900 dark:text-white">{trial.name}</h4>
                              <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${active ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200" : used || unavailable ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" : "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200"}`}>
                                {active ? t.trialActive : used ? t.trialUsed : unavailable ? t.trialUnavailable : t.trialNotStarted}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t.trialDays}: <strong className="text-slate-800 dark:text-slate-200">{Number.isFinite(Number(trial.trial_days)) && trial.trial_days !== null ? `${trial.trial_days} ${t.daysUnit}` : "—"}</strong></p>
                            {active ? <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{trial.days_remaining} {t.daysRemaining}</p> : null}
                            {unavailable ? <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{t.trialUnavailable}</p> : null}
                            {available ? (
                              <button type="button" onClick={() => startHubTrial(trial.hub)} disabled={Boolean(trialStartingHub)} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50">
                                {trialStartingHub === trial.hub ? t.trialStarting : t.trialStart}
                              </button>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>
                  </>
                )}
              </section>

              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-950 dark:text-white">{t.paidPlansTitle}</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.paidPlansText}</p>
                </div>
              </div>
              {!plansLoading && !plansError && paidPlans.length === 0 ? <p className="rounded-xl border border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">{t.empty}</p> : null}
              <div className="grid gap-3 sm:grid-cols-2">
                {paidPlans.map((plan) => {
                  const available = plan.status === "available" && checkoutEnabled && !catalogOffline;
                  return (
                    <article key={plan.code} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="break-words text-sm font-black text-slate-900 dark:text-white">{plan.name}</h4>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{plan.hub === "smart_ai" ? "RevelaAI" : String(plan.hub || "").replace(/_/g, " ").replace(/^./, (s) => s.toUpperCase())}</p>
                        </div>
                        {bestValueCodes.has(plan.code) ? <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black uppercase text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">{t.best}</span> : null}
                      </div>
                      <p className="mt-4 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{formatMoney(plan.amount, plan.currency || "KES")}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{t.duration}: {durationText(plan, t)}</p>
                      {Array.isArray(plan.features) && plan.features.length ? (
                        <ul className="mt-3 flex-1 space-y-1.5">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />{feature}
                            </li>
                          ))}
                        </ul>
                      ) : <div className="flex-1" />}
                      <button type="button" onClick={() => choosePlan(plan)} disabled={!available} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:disabled:bg-slate-800 dark:disabled:text-slate-500">
                        {available ? t.choose : plan.status !== "available" ? t.pendingTag : t.unavailable}
                      </button>
                    </article>
                  );
                })}
              </div>
              {!checkoutEnabled && !catalogOffline ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">{t.unavailable}</p> : null}
              <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{t.billingTerms}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400"><ShieldCheck className="h-4 w-4" /> Secure, verified M-Pesa checkout</span>
                <button type="button" onClick={() => loadPlans().catch((error) => paymentLogError("manual_refresh_failed", error))} disabled={plansLoading} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"><RefreshCw className={`h-3.5 w-3.5 ${plansLoading ? "animate-spin" : ""}`} />{t.refresh}</button>
              </div>
            </>
          ) : null}

          {step === "login" ? (
            <div className="mx-auto max-w-md py-8 text-center">
              <LockKeyhole className="mx-auto h-10 w-10 text-amber-500" />
              <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">{t.loginTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{t.loginText}</p>
              <button type="button" onClick={() => onRequireLogin?.(selectedPlan?.code || initialPlanCode)} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950">{t.login}</button>
            </div>
          ) : null}

          {step === "phone" ? (
            <div className="mx-auto max-w-md">
              <button type="button" onClick={returnToCatalog} className="mb-5 inline-flex min-h-10 items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"><ArrowLeft className="h-4 w-4" />{t.title}</button>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedPlan?.name} · {t.phoneTitle}</h3>
              <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{t.phoneHelp}</p>
              <label htmlFor="premium-mpesa-phone" className="mt-6 block text-xs font-bold text-slate-700 dark:text-slate-300">{t.phone}</label>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900"><Smartphone className="h-5 w-5 shrink-0 text-slate-400" /><input id="premium-mpesa-phone" value={phone} onChange={(event) => { setPhone(event.target.value); setPhoneError(""); }} inputMode="tel" autoComplete="tel" placeholder="0712 345 678" className="min-h-12 min-w-0 flex-1 bg-transparent text-sm outline-none" aria-invalid={Boolean(phoneError)} /></div>
              {phoneError ? <p role="alert" className="mt-2 text-xs text-rose-600 dark:text-rose-300">{phoneError}</p> : null}
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-500 dark:text-slate-400">{t.amount}</span><strong className="text-lg font-black text-slate-950 dark:text-white">{formatMoney(selectedPlan?.amount, selectedPlan?.currency || "KES")}</strong></div><div className="mt-2 flex items-center justify-between gap-3 text-xs"><span className="text-slate-500 dark:text-slate-400">{t.duration}</span><strong className="text-slate-800 dark:text-slate-200">{selectedDuration}</strong></div><p className="mt-3 border-t border-slate-200 pt-3 text-[11px] leading-5 text-slate-500 dark:border-slate-700 dark:text-slate-400">The server calculates the final amount from the published plan catalogue. No card details or M-Pesa PIN are collected by RevelaCode.</p></div>
              <button type="button" onClick={() => startPayment().catch((error) => paymentLogError("start_payment_unhandled", error))} disabled={submitting} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">{submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}{submitting ? t.sending : `${t.pay} ${formatMoney(selectedPlan?.amount, selectedPlan?.currency || "KES")} ${t.withMpesa}`}</button>
            </div>
          ) : null}

          {step === "waiting" ? (
            <div className="mx-auto max-w-md py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><Smartphone className="h-8 w-8" /></div>
              <h3 className="mt-5 text-xl font-black text-slate-950 dark:text-white">{t.pendingTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{t.pendingText}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{t.pendingSub}</p>
              {failureText ? <p role="status" className="mx-auto mt-3 max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">{failureText}</p> : null}
              <div className="mx-auto mt-6 flex max-w-xs items-center justify-center gap-2 rounded-xl bg-slate-100 p-3 text-sm font-bold text-slate-800 dark:bg-slate-900 dark:text-slate-100"><Clock3 className="h-4 w-4" />{t.remaining}: {formatTime(remainingSeconds)}</div>
              <div className="mx-auto mt-4 h-1.5 max-w-xs overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${Math.max(0, (remainingSeconds / 90) * 100)}%` }} /></div>
              <button type="button" onClick={() => { setPolling(false); setPollingPaused(true); }} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">{t.stop}</button>
              {pollingPaused ? <p className="mt-3 text-xs leading-5 text-amber-700 dark:text-amber-300">{t.stopNote}</p> : null}
            </div>
          ) : null}

          {step === "success" ? (
            <div className="mx-auto max-w-md py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><CheckCircle2 className="h-9 w-9" /></div>
              <h3 className="mt-5 text-xl font-black text-slate-950 dark:text-white">{t.successTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{t.successText}</p>
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-slate-800 dark:bg-slate-900"><div className="flex justify-between gap-3 text-xs"><span className="text-slate-500">{t.receipt}</span><strong className="break-all text-slate-900 dark:text-white">{checkout?.receipt || "—"}</strong></div>{!checkout?.receipt ? <p className="mt-2 text-xs leading-5 text-slate-500">{t.receiptPending}</p> : null}<div className="mt-3 flex justify-between gap-3 border-t border-slate-200 pt-3 text-xs dark:border-slate-700"><span className="text-slate-500">{t.expires}</span><strong className="text-slate-900 dark:text-white">{checkout?.subscription?.ends_at ? new Date(checkout.subscription.ends_at).toLocaleDateString(language === "sw" ? "sw-KE" : "en-KE", { dateStyle: "long" }) : "—"}</strong></div></div>
              <button type="button" onClick={() => onPlanActivated?.(selectedPlan?.hub)} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800">{t.start}</button>
            </div>
          ) : null}

          {step === "failed" ? (
            <div className="mx-auto max-w-md py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"><AlertCircle className="h-9 w-9" /></div>
              <h3 className="mt-5 text-xl font-black text-slate-950 dark:text-white">{t.failedTitle}</h3>
              <p role="alert" className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{failureText}</p>
              <button type="button" onClick={() => { setFailureText(""); setStep("phone"); setCheckout(null); checkoutRef.current = null; idempotencyKey.current = ""; }} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950">{t.tryAgain}</button>
            </div>
          ) : null}

          {step === "timeout" ? (
            <div className="mx-auto max-w-md py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><Clock3 className="h-9 w-9" /></div>
              <h3 className="mt-5 text-xl font-black text-slate-950 dark:text-white">{t.timeoutTitle}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{t.timeoutText}</p>
              {checkout?.receipt ? <p className="mt-3 text-xs font-bold text-slate-700 dark:text-slate-200">{t.receipt}: {checkout.receipt}</p> : null}
              <button type="button" onClick={() => { setPollingPaused(true); onClose?.(); }} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">{t.close}</button>
            </div>
          ) : null}

          {step === "unknown" ? (
            <div className="mx-auto max-w-md py-8 text-center"><AlertCircle className="mx-auto h-10 w-10 text-amber-500" /><h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">{t.timeoutTitle}</h3><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{t.unknown}</p></div>
          ) : null}
        </div>
      </section>
    </div>
  );

  return createPortal(modal, document.body);
}
