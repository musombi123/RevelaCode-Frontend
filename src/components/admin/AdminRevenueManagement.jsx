import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Edit3,
  Plus,
  RefreshCw,
  Save,
  Search,
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

const CHECKOUT_HUBS = new Set([
  "shamba",
  "biashara",
  "elimu",
  "smart_ai",
  "marketplace",
  "faith",
]);

const MPESA_READINESS_CHECKS = [
  ["production_environment", "MPESA_ENV is production"],
  ["mpesa_provider_enabled", "REVENUE_PAYMENT_PROVIDERS includes mpesa"],
  ["consumer_key_present", "Daraja consumer key is present"],
  ["consumer_secret_present", "Daraja consumer secret is present"],
  ["shortcode_numeric", "Live shortcode is numeric"],
  ["passkey_present", "Daraja STK passkey is present"],
  ["callback_https", "Callback uses HTTPS"],
  ["callback_host_present", "Callback has a hostname"],
  ["callback_path_matches", "Callback path matches the backend route"],
  ["callback_has_no_credentials", "Callback URL has no embedded credentials"],
  ["callback_has_no_query_or_fragment", "Callback URL has no query string or fragment"],
];

function getPlanActivation(plan, billingEnabled, billingKnown) {
  const status = String(plan?.status || "proposed").toLowerCase();
  const hub = String(plan?.hub || "").toLowerCase();
  const interval = String(plan?.interval || "").toLowerCase();
  const amount = Number(plan?.amount);

  if (status === "retired") {
    return { kind: "retired", label: "Retired", detail: "Retired plans are not offered for checkout." };
  }
  if (hub === "community") {
    return {
      kind: "free",
      label: "Permanent free hub",
      detail: "Community membership cannot be sold. The open hub is supported by sponsored advertisements and separate advertising campaigns.",
    };
  }
  if (status !== "available") {
    return { kind: "proposed", label: "Proposed · not effective", detail: "Set the catalogue status to Available before this plan can be offered." };
  }
  if (hub === "all" && amount === 0) {
    return { kind: "free", label: "Available free plan", detail: "This plan is available without a payment; it is not an M-PESA checkout plan." };
  }
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    return { kind: "invalid", label: "Not checkout-ready", detail: "M-PESA subscription checkout requires a positive whole-KES amount." };
  }
  if (!["month", "year"].includes(interval)) {
    return { kind: "invalid", label: "Not checkout-ready", detail: "Only monthly or yearly hub subscriptions are supported by this checkout." };
  }
  if (!CHECKOUT_HUBS.has(hub)) {
    return { kind: "invalid", label: "Not checkout-ready", detail: "This plan's stream is not supported by the current subscription checkout." };
  }
  if (!billingKnown) {
    return { kind: "unknown", label: "Checkout status unknown", detail: "The admin API has not confirmed production M-PESA readiness." };
  }
  if (!billingEnabled) {
    return { kind: "catalogue_only", label: "Catalogue only", detail: "The plan is marked Available, but production M-PESA checkout is disabled." };
  }
  return { kind: "effective", label: "Effective for checkout", detail: "Published plan, valid subscription price, supported hub, and production M-PESA checkout enabled." };
}

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

function normalizePlanFeatures(value) {
  if (Array.isArray(value)) {
    return value
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function normalizePlans(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((plan) => plan && typeof plan === "object" && !Array.isArray(plan))
    .map((plan) => ({
      ...plan,
      code: String(plan.code ?? "").trim(),
      name: String(plan.name ?? plan.code ?? "Unnamed plan"),
      hub: String(plan.hub ?? "unknown").trim().toLowerCase(),
      amount: plan.amount ?? "0.00",
      currency: String(plan.currency ?? "KES"),
      interval: String(plan.interval ?? "month").trim().toLowerCase(),
      status: String(plan.status ?? "proposed").trim().toLowerCase(),
      features: normalizePlanFeatures(plan.features),
    }))
    .filter((plan) => plan.code);
}

function normalizeTransactions(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .map((item) => ({
      ...item,
      id: String(item.id ?? ""),
      stream: String(item.stream ?? "unknown"),
      user_id: String(item.user_id ?? ""),
      amount: item.amount ?? "0.00",
      currency: String(item.currency ?? "KES"),
      status: String(item.status ?? "pending"),
      description: String(item.description ?? ""),
      created_at: item.created_at ?? null,
    }));
}

function normalizeCheckouts(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .map((item) => ({
      ...item,
      id: String(item.id ?? ""),
      user_id: String(item.user_id ?? ""),
      hub: String(item.hub ?? "unknown"),
      plan_code: String(item.plan_code ?? ""),
      amount: item.amount ?? "0.00",
      currency: String(item.currency ?? "KES"),
      status: String(item.status ?? "unknown").toLowerCase(),
      checkout_request_id: String(item.checkout_request_id ?? ""),
      merchant_request_id: String(item.merchant_request_id ?? ""),
      receipt: String(item.receipt ?? ""),
      message: String(item.message ?? ""),
      created_at: item.created_at ?? null,
      updated_at: item.updated_at ?? null,
    }));
}

function normalizePagination(value, fallbackPage = 1) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { page: fallbackPage, per_page: 25, total: 0, pages: 0 };
  }

  const wholeNumber = (input, fallback, minimum = 0) => {
    const parsed = Number(input);
    return Number.isFinite(parsed) && Number.isInteger(parsed) && parsed >= minimum
      ? parsed
      : fallback;
  };

  return {
    page: wholeNumber(value.page, fallbackPage, 1),
    per_page: wholeNumber(value.per_page, 25, 1),
    total: wholeNumber(value.total, 0),
    pages: wholeNumber(value.pages, 0),
  };
}

function StatusPill({ value }) {
  const status = String(value || "unknown").toLowerCase();
  const isPositive = [
    "available",
    "succeeded",
    "effective for checkout",
    "available free plan",
    "production checkout enabled",
  ].includes(status);
  const isWarning = [
    "pending",
    "proposed",
    "processing",
    "catalogue only",
    "checkout status unknown",
    "billing disabled",
    "not checkout-ready",
    "proposed · not effective",
  ].includes(status);
  const isNegative = ["retired", "failed", "cancelled"].includes(status);
  const style = isPositive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
    : isWarning
      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
      : isNegative
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

function EditPlanForm({ plan, saving, onCancel, onSave, billingEnabled, billingKnown }) {
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
      <p className="text-[11px] leading-5 text-amber-700 dark:text-amber-300">
        A plan is effective for customer checkout only when it is Available, has a positive whole-KES price, uses a supported hub and monthly/yearly interval, and production M-PESA checkout is enabled.
        {!billingKnown ? " The live checkout status is currently unknown." : billingEnabled ? " Production M-PESA checkout is enabled." : " Production M-PESA checkout is currently disabled."}
      </p>
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
  const [catalogueMeta, setCatalogueMeta] = useState({
    pricing_status: null,
    billing_enabled: null,
    checkout_enabled: null,
    mpesa_readiness: null,
    blocking_reasons: [],
  });
  const [plansError, setPlansError] = useState("");
  const [plansLoading, setPlansLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, per_page: 25, total: 0, pages: 0 });
  const [checkouts, setCheckouts] = useState([]);
  const [checkoutPagination, setCheckoutPagination] = useState({ page: 1, per_page: 25, total: 0, pages: 0 });
  const [checkoutPage, setCheckoutPage] = useState(1);
  const [checkoutStatus, setCheckoutStatus] = useState("all");
  const [checkoutSearch, setCheckoutSearch] = useState("");
  const [checkoutsLoading, setCheckoutsLoading] = useState(true);
  const [checkoutsError, setCheckoutsError] = useState("");
  const [refreshingCheckout, setRefreshingCheckout] = useState("");
  const [stream, setStream] = useState("all");
  const [status, setStatus] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState("");
  const [editingCode, setEditingCode] = useState("");
  const [savingCode, setSavingCode] = useState("");
  const [publishingPlans, setPublishingPlans] = useState(false);
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
      setOverview(response && typeof response === "object" && !Array.isArray(response) ? response : null);
    } catch (error) {
      if (error?.name !== "AbortError") setOverviewError(getError(error));
    }
  }, [adminApi]);

  const loadPlans = useCallback(async (signal) => {
    setPlansLoading(true);
    setPlansError("");
    try {
      const [response, billingStatus] = await Promise.all([
        adminApi.request("/api/revenue/admin/plans", { signal }),
        adminApi.request("/api/revenue/admin/billing/status", { signal }).catch((error) => {
          if (error?.name === "AbortError") throw error;
          return null;
        }),
      ]);
      const checkoutEnabled = typeof billingStatus?.checkout_enabled === "boolean"
        ? billingStatus.checkout_enabled
        : typeof response?.checkout_enabled === "boolean" ? response.checkout_enabled : null;
      setPlans(normalizePlans(response?.plans));
      setCatalogueMeta({
        pricing_status: response?.pricing_status ?? null,
        billing_enabled: typeof billingStatus?.billing_enabled === "boolean"
          ? billingStatus.billing_enabled
          : typeof response?.billing_enabled === "boolean" ? response.billing_enabled : null,
        checkout_enabled: checkoutEnabled,
        mpesa_readiness: billingStatus?.mpesa_readiness ?? null,
        blocking_reasons: Array.isArray(billingStatus?.blocking_reasons)
          ? billingStatus.blocking_reasons
          : [],
      });
    } catch (error) {
      if (error?.name !== "AbortError") {
        setPlans([]);
        setCatalogueMeta({
          pricing_status: null,
          billing_enabled: null,
          checkout_enabled: null,
          mpesa_readiness: null,
          blocking_reasons: [],
        });
        setPlansError(getError(error));
      }
    } finally {
      if (!signal?.aborted) setPlansLoading(false);
    }
  }, [adminApi]);

  const loadCheckouts = useCallback(async (signal) => {
    setCheckoutsLoading(true);
    setCheckoutsError("");
    try {
      const response = await adminApi.request("/api/revenue/admin/checkouts", {
        params: {
          page: checkoutPage,
          per_page: 25,
          status: checkoutStatus === "all" ? undefined : checkoutStatus,
        },
        signal,
      });
      setCheckouts(normalizeCheckouts(response?.items));
      setCheckoutPagination(normalizePagination(response?.pagination, checkoutPage));
    } catch (error) {
      if (error?.name !== "AbortError") {
        setCheckouts([]);
        setCheckoutPagination({ page: checkoutPage, per_page: 25, total: 0, pages: 0 });
        setCheckoutsError(getError(error));
      }
    } finally {
      if (!signal?.aborted) setCheckoutsLoading(false);
    }
  }, [adminApi, checkoutPage, checkoutStatus]);

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
      setTransactions(normalizeTransactions(response?.items));
      setPagination(normalizePagination(response?.pagination, page));
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

  useEffect(() => {
    const controller = new AbortController();
    loadCheckouts(controller.signal);
    return () => controller.abort();
  }, [loadCheckouts, reloadKey]);

  const reconcileCheckout = async (checkout) => {
    if (!checkout?.checkout_request_id || refreshingCheckout) return;
    setRefreshingCheckout(checkout.id || checkout.checkout_request_id);
    setNotice("");
    setActionError("");
    try {
      const response = await adminApi.request(
        "/api/revenue/admin/checkouts/" + encodeURIComponent(checkout.checkout_request_id) + "/refresh",
        { method: "POST", body: {} },
      );
      const updated = normalizeCheckouts(response?.checkout ? [response.checkout] : [])[0];
      if (updated) {
        setCheckouts((current) => current.map((item) =>
          item.id === updated.id || item.checkout_request_id === updated.checkout_request_id
            ? { ...item, ...updated }
            : item
        ));
      }
      setNotice(
        response?.verified
          ? "Daraja verification succeeded. The backend has processed the verified checkout; confirm the subscription and payment records below."
          : "Daraja reconciliation completed, but a final verified payment was not confirmed. The checkout remains unconfirmed until the provider returns a matching final result."
      );
      setReloadKey((value) => value + 1);
    } catch (error) {
      setActionError("Could not reconcile this checkout: " + getError(error));
    } finally {
      setRefreshingCheckout("");
    }
  };

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
      const response = await adminApi.request(`/api/revenue/admin/plans/${encodeURIComponent(code)}`, {
        method: "PUT",
        body: values,
      });
      setEditingCode("");
      const savedStatus = response?.plan?.status || values.status;
      const savedCheckoutEnabled = typeof response?.checkout_enabled === "boolean"
        ? response.checkout_enabled
        : catalogueMeta.checkout_enabled === true;
      setNotice(
        savedStatus === "available" && !savedCheckoutEnabled
          ? `Plan "${code}" is marked Available in the catalogue, but is not effective for checkout while production M-PESA is disabled.`
          : response?.message || `Plan "${code}" saved.`,
      );
      setReloadKey((value) => value + 1);
    } catch (error) {
      setActionError(getError(error));
    } finally {
      setSavingCode("");
    }
  };

  const publishEligiblePlans = async () => {
    setNotice("");
    setActionError("");

    if (!billingKnown) {
      setActionError("The backend has not confirmed production Daraja readiness. Refresh the Revenue Management page and check the billing status.");
      return;
    }
    if (!billingEnabled) {
      setActionError("Paid plans cannot be published for checkout until the backend confirms production Daraja credentials, callback configuration, and M-Pesa provider enablement.");
      return;
    }

    const eligible = plans.filter((plan) => {
      const amount = Number(plan.amount);
      const status = String(plan.status || "proposed").toLowerCase();
      return status !== "available" &&
        status !== "retired" &&
        CHECKOUT_HUBS.has(String(plan.hub || "").toLowerCase()) &&
        Number.isInteger(amount) &&
        amount > 0 &&
        ["month", "year"].includes(String(plan.interval || "").toLowerCase());
    });

    if (!eligible.length) {
      setNotice("No unpublished paid subscription plans meet the current M-Pesa rules. Check the price, hub, interval, and plan status.");
      return;
    }

    const description = eligible.map((plan) => plan.name + " (" + formatMoney(plan.amount, plan.currency || "KES") + "/" + plan.interval + ")").join("\n");
    if (!window.confirm("Publish these " + eligible.length + " paid plans for live M-Pesa checkout? This makes their listed prices purchasable.\n\n" + description)) {
      return;
    }

    setPublishingPlans(true);
    const published = [];
    const failures = [];
    try {
      for (const plan of eligible) {
        try {
          await adminApi.request("/api/revenue/admin/plans/" + encodeURIComponent(plan.code), {
            method: "PUT",
            body: {
              name: plan.name,
              amount: String(plan.amount),
              interval: plan.interval,
              status: "available",
              features: Array.isArray(plan.features) ? plan.features : [],
            },
          });
          published.push(plan.code);
        } catch (error) {
          failures.push(plan.code + ": " + getError(error));
        }
      }

      if (published.length) setReloadKey((value) => value + 1);
      if (failures.length) {
        setActionError(
          (published.length ? "Published " + published.length + " plan(s). " : "") +
          "Could not publish " + failures.length + " plan(s): " + failures.slice(0, 3).join(" · "),
        );
      } else if (published.length) {
        setNotice("Published " + published.length + " eligible paid plan(s). Customer checkout remains protected by Daraja's verified payment result.");
      } else {
        setActionError("No plans were published. Review the backend error and the plan catalogue.");
      }
    } finally {
      setPublishingPlans(false);
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
      const responseCheckoutEnabled = typeof response?.checkout_enabled === "boolean"
        ? response.checkout_enabled
        : catalogueMeta.checkout_enabled === true;
      setNotice(
        response?.plan?.status === "available" && !responseCheckoutEnabled
          ? `Plan "${createForm.code.trim().toLowerCase()}" is marked Available in the catalogue, but is not effective for checkout while production M-PESA is disabled.`
          : response?.message || "Plan saved to the catalogue.",
      );
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
  const reportedCheckoutEnabled =
    typeof catalogueMeta.checkout_enabled === "boolean"
      ? catalogueMeta.checkout_enabled
      : typeof overview?.checkout_enabled === "boolean"
        ? overview.checkout_enabled
        : typeof overview?.billing_enabled === "boolean"
          ? overview.billing_enabled
          : null;
  const billingKnown = typeof reportedCheckoutEnabled === "boolean";
  const billingEnabled = reportedCheckoutEnabled === true;
  const effectivePaidPlans = plans.filter(
    (plan) => getPlanActivation(plan, billingEnabled, billingKnown).kind === "effective",
  );
  const availablePaidPlans = plans.filter(
    (plan) => plan.status === "available" && Number(plan.amount) > 0 &&
      plan.hub !== "all" && plan.hub !== "community",
  );
  const proposedPlansCount = plans.filter((plan) => plan.status === "proposed").length;
  const publishablePlansCount = plans.filter((plan) => {
    const amount = Number(plan.amount);
    const status = String(plan.status || "proposed").toLowerCase();
    return status !== "available" &&
      status !== "retired" &&
      CHECKOUT_HUBS.has(String(plan.hub || "").toLowerCase()) &&
      Number.isInteger(amount) &&
      amount > 0 &&
      ["month", "year"].includes(String(plan.interval || "").toLowerCase());
  }).length;
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
            <StatusPill value={`pricing ${catalogueMeta.pricing_status || overview?.pricing_status || "draft"}`} />
            <StatusPill value={!billingKnown ? "Checkout status unknown" : billingEnabled ? "Production checkout enabled" : "Billing disabled"} />
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4 sm:p-6">
          <MetricCard title="Transaction intents" value={metrics.total_intents} description="All recorded purchase requests" icon={ClipboardList} />
          <MetricCard title="Pending intents" value={metrics.pending_intents} description="Not confirmed revenue" icon={Clock3} />
          <MetricCard title="Effective paid plans" value={effectivePaidPlans.length} description="Can accept live M-PESA checkout now" icon={CheckCircle2} />
          <MetricCard title="Available paid plans" value={availablePaidPlans.length} description="Marked Available in the catalogue" icon={CircleDollarSign} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Effective plans</h3>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">This list is computed from the server's live checkout flag and each plan's status, price, hub, and interval. An Available catalogue status alone does not mean a plan can take payment.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill value={!billingKnown ? "Checkout status unknown" : billingEnabled ? "Production checkout enabled" : "Billing disabled"} />
            <StatusPill value={`${effectivePaidPlans.length} effective paid plans`} />
          </div>
        </div>

        {effectivePaidPlans.length > 0 ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {effectivePaidPlans.map((plan) => (
              <article key={plan.code} className="rounded-xl border border-emerald-200 p-4 dark:border-emerald-900/50">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label(plan.hub)} · {plan.code}</p>
                    <h4 className="mt-1 font-bold text-slate-900 dark:text-white">{plan.name}</h4>
                    <p className="mt-2 text-lg font-black text-slate-900 dark:text-white">{formatMoney(plan.amount, plan.currency)} <span className="text-xs font-medium text-slate-400">/ {plan.interval}</span></p>
                  </div>
                  <StatusPill value="Effective for checkout" />
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{getPlanActivation(plan, billingEnabled, billingKnown).detail}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-5 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">No paid plan is effective for customer checkout right now.</p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {!billingKnown
                ? "The backend's production checkout status could not be confirmed. Refresh after checking the admin API."
                : !billingEnabled
                  ? "The backend reports billing_enabled=false. Paid plans can be reviewed in the catalogue, but none will accept customer payments until production Daraja configuration passes the backend readiness checks."
                  : "Production checkout is configured, but no paid plan is currently Available with a valid whole-KES price, supported hub, and monthly/yearly interval."}
            </p>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span>{formatCount(availablePaidPlans.length)} paid plans marked Available in the catalogue</span>
          <span>{formatCount(proposedPlansCount)} proposed plans</span>
          <span>{formatCount(plans.filter((plan) => plan.status === "retired").length)} retired plans</span>
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-bold">Payment intents are not confirmed revenue</p>
          <p className="mt-1">Confirmed revenue and paid subscriptions must follow the backend's provider verification flow. {billingEnabled ? "Production M-PESA checkout is enabled for eligible published plans." : "Production checkout is currently disabled; no paid plan can accept customer payments until backend readiness checks pass."}</p>
        </div>
      </div>

      {overviewError ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">Overview: {overviewError}</div> : null}
      {notice ? <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{notice}</div> : null}
      {actionError ? <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{actionError}</div> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="text-base font-bold text-slate-900 dark:text-white">Pricing catalogue</h3><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Create or edit plan proposals for any supported hub. Retire plans instead of deleting their history.</p></div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={publishEligiblePlans}
              disabled={plansLoading || publishingPlans || !billingKnown || !billingEnabled || publishablePlansCount === 0}
              title={!billingKnown ? "Live checkout readiness has not been confirmed." : !billingEnabled ? "Production M-Pesa checkout is not enabled by the backend." : "Publish all eligible, unpublished paid subscription plans."}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-extrabold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className={"h-4 w-4 " + (publishingPlans ? "animate-pulse" : "")} />
              {publishingPlans ? "Publishing plans..." : "Publish " + publishablePlansCount + " eligible plans"}
            </button>
            <button type="button" onClick={() => setShowCreate((value) => !value)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"><Plus className="h-4 w-4" />{showCreate ? "Close form" : "Create plan"}</button>
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Bulk publishing is enabled only after the backend confirms live Daraja readiness. It skips free, retired, non-hub, fractional-KES and unsupported-interval plans.
        </p>
        {!billingKnown || !billingEnabled ? (
          <section role="status" className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold">Live M-Pesa checkout readiness</h3>
                <p className="mt-1 leading-6">
                  {!billingKnown
                    ? "The latest backend readiness status could not be confirmed. Refresh this screen before changing plan availability."
                    : "The backend has not enabled production charges yet. A Daraja connection alone is not enough; all production readiness checks must pass before live checkout is published."}
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5">
                  <li><code>MPESA_ENV=production</code></li>
                  <li><code>REVENUE_PAYMENT_PROVIDERS</code> includes <code>mpesa</code></li>
                  <li><code>MPESA_CALLBACK_URL</code> is the exact HTTPS callback URL below, with no query string or fragment.</li>
                  <li>Production Daraja API base URL, consumer key, consumer secret, numeric shortcode, and passkey are set in the backend's environment settings.</li>
                </ul>
                <p className="mt-2 break-all rounded-lg border border-amber-300/70 bg-white/60 px-3 py-2 font-mono text-[11px] dark:border-amber-800/50 dark:bg-black/20">
                  https://revelacode-backend.onrender.com/api/revenue/providers/mpesa/callback
                </p>
                {catalogueMeta.mpesa_readiness?.checks ? (
                  <div className="mt-4 rounded-xl border border-amber-300/70 bg-white/60 p-3 dark:border-amber-800/50 dark:bg-black/20">
                    <h4 className="text-xs font-extrabold">Live configuration checks</h4>
                    <p className="mt-1 text-[11px] leading-5 text-amber-900/80 dark:text-amber-100/80">
                      These checks show which backend settings are present, without exposing any credential values. They do not make a test charge or prove the callback is reachable.
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {MPESA_READINESS_CHECKS.map(([key, text]) => {
                        const passed = catalogueMeta.mpesa_readiness.checks[key] === true;
                        return (
                          <div
                            key={key}
                            className={passed
                              ? "flex min-w-0 items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 py-2 text-[11px] leading-4 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200"
                              : "flex min-w-0 items-start gap-2 rounded-lg border border-rose-200 bg-rose-50/80 px-2.5 py-2 text-[11px] leading-4 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200"}
                          >
                            {passed ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                            <span>{text}</span>
                          </div>
                        );
                      })}
                    </div>
                    {catalogueMeta.blocking_reasons.length > 0 ? (
                      <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200">
                        <p className="font-extrabold">What is blocking checkout?</p>
                        <ul className="mt-1 list-disc space-y-1 pl-4">
                          {catalogueMeta.blocking_reasons.map((reason) => <li key={reason}>{reason}</li>)}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-xs leading-5 text-amber-900/80 dark:text-amber-100/80">
                    Detailed checks are unavailable from this backend version. Confirm the backend deployment includes the latest Revenue Engine diagnostics.
                  </p>
                )}

                <p className="mt-2 text-xs leading-5">
                  Keep credentials in the backend host's private environment settings; never paste secrets into the dashboard or source code.
                </p>
                <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg border border-amber-500/70 px-3 text-xs font-extrabold hover:bg-amber-100 dark:hover:bg-amber-900/40">
                  <RefreshCw className="h-3.5 w-3.5" /> Recheck checkout readiness
                </button>
              </div>
            </div>
          </section>
        ) : null}

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
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusPill value={getPlanActivation(plan, billingEnabled, billingKnown).label} />
                  <span className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">{getPlanActivation(plan, billingEnabled, billingKnown).detail}</span>
                </div>
                {editingCode === plan.code ? <EditPlanForm plan={plan} saving={savingCode === plan.code} billingEnabled={billingEnabled} billingKnown={billingKnown} onCancel={() => setEditingCode("")} onSave={(values) => savePlan(plan.code, values)} /> : <button type="button" onClick={() => { setEditingCode(plan.code); setNotice(""); setActionError(""); }} className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><Edit3 className="h-3.5 w-3.5" />Edit plan</button>}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">M-PESA checkout reconciliation</h3>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">Actual STK Push checkout records from the provider checkout store, separate from purchase intents. Refresh an unresolved checkout to query Daraja; only a matching final provider result can confirm payment.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select aria-label="Filter M-PESA checkouts by status" value={checkoutStatus} onChange={(event) => { setCheckoutStatus(event.target.value); setCheckoutPage(1); }} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                <option value="all">All checkout statuses</option>
                {["initiating", "pending", "callback_received", "awaiting_verification", "submission_unknown", "succeeded", "failed", "initiation_failed", "verified_activation_failed", "sandbox_verified"].map((value) => <option key={value} value={value}>{label(value)}</option>)}
              </select>
              <button type="button" onClick={() => setReloadKey((value) => value + 1)} disabled={checkoutsLoading} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><RefreshCw className={`h-3.5 w-3.5 ${checkoutsLoading ? "animate-spin" : ""}`} />Refresh list</button>
            </div>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); setCheckoutPage(1); }} className="mt-4 flex gap-2">
            <input aria-label="Filter loaded M-PESA checkouts" value={checkoutSearch} onChange={(event) => setCheckoutSearch(event.target.value)} placeholder="Filter this page by user, plan, checkout or receipt" className="min-h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            {checkoutSearch ? <button type="button" onClick={() => setCheckoutSearch("")} className="min-h-10 rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:text-slate-200">Clear</button> : null}
          </form>
        </div>
        {checkoutsError ? <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300"><p className="font-bold">Checkout queue unavailable</p><p className="mt-1">{checkoutsError}</p><p className="mt-1">This queue is separate from transaction intents. Confirm the deployed backend exposes GET /api/revenue/admin/checkouts and that your session has platform-admin permissions.</p></div> : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left">
            <thead><tr className="border-b border-slate-200 dark:border-slate-800">{["Checkout / user", "Hub / plan", "Amount", "Provider status", "Receipt", "Last updated", "Action"].map((item) => <th key={item} className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:px-5">{item}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {checkoutsLoading ? <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400"><RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading M-PESA checkout records...</td></tr> : null}
              {!checkoutsLoading && !checkoutsError && checkouts.filter((item) => !checkoutSearch.trim() || [item.user_id, item.hub, item.plan_code, item.checkout_request_id, item.merchant_request_id, item.receipt].some((value) => String(value || "").toLowerCase().includes(checkoutSearch.trim().toLowerCase()))).length === 0 ? <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">{checkoutPagination.total ? "No checkout records on this page match the search." : "No M-PESA checkout records match this status filter."}</td></tr> : null}
              {!checkoutsLoading && checkouts.filter((item) => !checkoutSearch.trim() || [item.user_id, item.hub, item.plan_code, item.checkout_request_id, item.merchant_request_id, item.receipt].some((value) => String(value || "").toLowerCase().includes(checkoutSearch.trim().toLowerCase()))).map((item) => <tr key={item.id || item.checkout_request_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <td className="px-4 py-4 sm:px-5"><p className="font-semibold text-slate-800 dark:text-slate-100">{item.checkout_request_id ? item.checkout_request_id.slice(-12) : item.id.slice(-12) || "—"}</p><p className="mt-1 text-[10px] text-slate-400">User {item.user_id || "—"}</p><p className="mt-1 text-[10px] text-slate-400">Checkout ref: {item.checkout_request_id || "not assigned"}</p></td>
                <td className="px-4 py-4"><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label(item.hub)}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.plan_code || "—"}</p></td>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-slate-900 dark:text-white">{formatMoney(item.amount, item.currency)}</td>
                <td className="px-4 py-4"><StatusPill value={item.status} />{item.message ? <p className="mt-2 max-w-[260px] whitespace-normal text-[11px] leading-5 text-slate-500 dark:text-slate-400">{item.message}</p> : null}<p className="mt-1 text-[10px] text-slate-400">Merchant ref: {item.merchant_request_id || "—"}</p></td>
                <td className="px-4 py-4 text-xs font-semibold text-slate-700 dark:text-slate-200">{item.receipt || (item.status === "succeeded" ? "Verified, receipt not returned" : "Not confirmed")}</td>
                <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500 dark:text-slate-400">{formatDate(item.updated_at || item.created_at)}</td>
                <td className="px-4 py-4">{item.status === "succeeded" ? <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" />Provider verified</span> : ["pending", "callback_received", "awaiting_verification", "submission_unknown", "verified_activation_failed", "initiating"].includes(item.status) && item.checkout_request_id ? <button type="button" disabled={Boolean(refreshingCheckout)} onClick={() => reconcileCheckout(item)} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${refreshingCheckout === (item.id || item.checkout_request_id) ? "animate-spin" : ""}`} />{refreshingCheckout === (item.id || item.checkout_request_id) ? "Checking..." : "Refresh from Daraja"}</button> : <span className="text-xs text-slate-400">No provider refresh</span>}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-slate-500 dark:text-slate-400">{checkoutPagination.total ? `Showing page ${checkoutPage} of ${Math.max(1, checkoutPagination.pages)} · ${formatCount(checkoutPagination.total)} checkout records` : "No checkout records"}</p>
          <div className="flex items-center gap-3"><button type="button" disabled={checkoutPage <= 1 || checkoutsLoading} onClick={() => setCheckoutPage((value) => Math.max(1, value - 1))} className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold disabled:opacity-40 dark:border-slate-700">Previous</button><button type="button" disabled={checkoutPage >= Math.max(1, checkoutPagination.pages) || checkoutsLoading} onClick={() => setCheckoutPage((value) => Math.min(Math.max(1, checkoutPagination.pages), value + 1))} className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold disabled:opacity-40 dark:border-slate-700">Next</button></div>
        </div>
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
