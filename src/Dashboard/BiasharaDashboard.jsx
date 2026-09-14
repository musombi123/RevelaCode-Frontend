import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowDownRight,
  BarChart3,
  Bell,
  Box,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DollarSign,
  FileCheck2,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

import BiasharaBusinessOnboarding from "@/Dashboard/Biashara/BiasharaBusinessOnboarding.jsx";

/* =========================================================
   HELPERS
========================================================= */

function numberValue(value, fallback = 0) {
  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 0,
  }).format(numberValue(value));
}

function formatMoney(value, currency = "KES") {
  const safeCurrency = currency || "KES";

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 0,
    }).format(numberValue(value));
  } catch {
    return `${safeCurrency} ${formatNumber(value)}`;
  }
}

function formatCompactMoney(value, currency = "KES") {
  const numeric = numberValue(value);
  const safeCurrency = currency || "KES";
  const absolute = Math.abs(numeric);

  if (absolute >= 1000000000) {
    return `${safeCurrency} ${(numeric / 1000000000).toFixed(1)}B`;
  }

  if (absolute >= 1000000) {
    return `${safeCurrency} ${(numeric / 1000000).toFixed(1)}M`;
  }

  if (absolute >= 1000) {
    return `${safeCurrency} ${(numeric / 1000).toFixed(1)}K`;
  }

  return formatMoney(numeric, safeCurrency);
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusLabel(status) {
  return String(status || "unknown")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getOrderAmount(order) {
  return numberValue(
    order?.total ??
      order?.amount ??
      order?.grand_total ??
      order?.total_amount ??
      0,
  );
}

function getOrderCustomer(order) {
  return (
    order?.customer_name ||
    order?.customer?.name ||
    (typeof order?.customer === "string"
      ? order.customer
      : null) ||
    "Customer"
  );
}

function getOrderReference(order) {
  return (
    order?.order_number ||
    order?.reference ||
    order?.number ||
    order?.id ||
    order?._id ||
    "Order"
  );
}

function isBusinessNotFoundError(error) {
  const message = String(
    error?.message ||
      error?.error ||
      error?.detail ||
      "",
  ).toLowerCase();

  const status =
    error?.status ??
    error?.statusCode ??
    error?.response?.status ??
    error?.response?.statusCode ??
    null;

  if (status === 404 || status === 204) {
    return true;
  }

  return (
    message.includes("business profile not found") ||
    message.includes("business not found") ||
    message.includes("no business") ||
    message.includes("business does not exist") ||
    message.includes("create your business profile") ||
    message.includes("profile not found")
  );
}

function extractBusiness(payload) {
  if (!payload) {
    return null;
  }

  if (
    payload.business &&
    typeof payload.business === "object" &&
    !Array.isArray(payload.business)
  ) {
    return payload.business;
  }

  if (
    payload.data?.business &&
    typeof payload.data.business === "object" &&
    !Array.isArray(payload.data.business)
  ) {
    return payload.data.business;
  }

  if (
    typeof payload === "object" &&
    !Array.isArray(payload)
  ) {
    return payload;
  }

  return null;
}

/* =========================================================
   BUSINESS PROFILE COMPLETENESS
========================================================= */

function getProfileCompleteness(business) {
  if (!business) {
    return {
      percentage: 0,
      completed: 0,
      total: 8,
      missing: [],
    };
  }

  const fields = [
    ["Business name", business.name],
    ["Business category", business.category],
    ["Business type", business.business_type],
    ["Phone number", business.phone],
    ["Email", business.email],
    ["County", business.county],
    ["Location", business.location],
    ["Description", business.description],
  ];

  const completed = fields.filter(
    ([, value]) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== "",
  );

  return {
    percentage: Math.round(
      (completed.length / fields.length) * 100,
    ),
    completed: completed.length,
    total: fields.length,
    missing: fields
      .filter(
        ([, value]) =>
          value === undefined ||
          value === null ||
          String(value).trim() === "",
      )
      .map(([label]) => label),
  };
}

/* =========================================================
   SMALL UI COMPONENTS
========================================================= */

function MetricCard({
  icon: Icon,
  label,
  value,
  supporting,
  iconClassName = "bg-slate-100 text-slate-700",
}) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>

          {supporting ? (
            <p className="mt-1 text-xs text-slate-500">
              {supporting}
            </p>
          ) : null}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  actionLabel,
  onAction,
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
            {eyebrow}
          </p>
        ) : null}

        <h2 className="mt-1 text-lg font-bold text-slate-900">
          {title}
        </h2>
      </div>

      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          {actionLabel}
          <ChevronRight size={16} />
        </button>
      ) : null}
    </div>
  );
}

function EmptyState({
  icon: Icon = Box,
  title,
  text,
  actionLabel,
  onAction,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
        <Icon size={20} />
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-800">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {text}
      </p>

      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
        >
          {actionLabel}
          <ChevronRight size={14} />
        </button>
      ) : null}
    </div>
  );
}

function OrderStatusPill({ status }) {
  const normalized = String(status || "").toLowerCase();

  let className = "bg-slate-100 text-slate-600";

  if (normalized === "completed") {
    className = "bg-emerald-50 text-emerald-700";
  } else if (
    normalized === "pending" ||
    normalized === "confirmed" ||
    normalized === "processing"
  ) {
    className = "bg-amber-50 text-amber-700";
  } else if (
    normalized === "cancelled" ||
    normalized === "canceled"
  ) {
    className = "bg-red-50 text-red-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${className}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function QuickAction({
  icon: Icon,
  label,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-blue-100 group-hover:text-blue-600">
        <Icon size={18} />
      </div>

      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-800">
          {label}
        </span>

        <span className="mt-0.5 block truncate text-[11px] text-slate-400">
          {description || "Open"}
        </span>
      </span>

      <ChevronRight
        size={16}
        className="ml-auto shrink-0 text-slate-300 transition group-hover:text-blue-500"
      />
    </button>
  );
}

function DarkStat({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-3.5">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function ProfileStat({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-[420px] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <RefreshCw
            size={22}
            className="animate-spin"
          />
        </div>

        <h2 className="mt-4 text-base font-semibold text-slate-900">
          Loading your business workspace
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Preparing your latest business data...
        </p>
      </div>
    </div>
  );
}

function FatalError({
  message,
  onRetry,
}) {
  return (
    <div className="flex min-h-[420px] items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl bg-white p-7 text-center shadow-sm ring-1 ring-slate-200">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertCircle size={22} />
        </div>

        <h2 className="mt-4 text-lg font-bold text-slate-900">
          Unable to load Biashara
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {message}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   BUSINESS PROFILE NOTICE
========================================================= */

function BusinessProfileNotice({
  business,
  completeness,
  onCompleteProfile,
}) {
  const verificationStatus =
    String(
      business?.verification_status ||
        business?.verification?.status ||
        "not_submitted",
    ).toLowerCase();

  const isVerified =
    verificationStatus === "verified";

  const isPending =
    verificationStatus === "pending" ||
    verificationStatus === "under_review";

  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-5 text-white sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <FileCheck2 size={23} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
                  Business profile
                </span>

                {isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-100">
                    <ShieldCheck size={12} />
                    Verified
                  </span>
                ) : isPending ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-1 text-[11px] font-semibold text-amber-100">
                    <Clock3 size={12} />
                    Verification pending
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-blue-50">
                    <Briefcase size={12} />
                    Profile active
                  </span>
                )}
              </div>

              <h2 className="mt-2 text-xl font-bold">
                Keep your business identity complete
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-blue-100">
                Your Biashara workspace is connected to your
                business profile. Complete the legal business
                information so your identity, records and future
                verification process remain consistent.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCompleteProfile}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
          >
            <FileCheck2 size={17} />
            Complete profile
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-slate-800">
                Profile completeness
              </p>

              <span className="text-sm font-bold text-blue-600">
                {completeness.percentage}%
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{
                  width: `${completeness.percentage}%`,
                }}
              />
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {completeness.completed} of{" "}
              {completeness.total} core profile fields
              completed.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
            <ShieldCheck
              size={17}
              className={
                isVerified
                  ? "text-emerald-600"
                  : "text-slate-400"
              }
            />

            <div>
              <p className="text-[11px] font-medium text-slate-500">
                Verification
              </p>

              <p className="text-sm font-semibold text-slate-800">
                {isVerified
                  ? "Verified business"
                  : isPending
                    ? "Under review"
                    : "Coming soon"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   NO BUSINESS STATE
========================================================= */

function CreateBusinessState({
  onCreated,
}) {
  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 rounded-3xl bg-gradient-to-br from-blue-700 via-blue-700 to-indigo-800 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Store size={27} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
                Biashara Hub
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Create your legal business profile
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                Before you can manage products, sales, orders
                and business analytics, create your business
                profile. This becomes the official business
                identity used throughout your Jumuiya workspace.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4">
              <Briefcase size={18} />
              <p className="mt-3 text-sm font-semibold">
                Business identity
              </p>
              <p className="mt-1 text-xs leading-5 text-blue-100">
                Name, type, category and location.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <FileCheck2 size={18} />
              <p className="mt-3 text-sm font-semibold">
                Business records
              </p>
              <p className="mt-1 text-xs leading-5 text-blue-100">
                Keep your business information consistent.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <ShieldCheck size={18} />
              <p className="mt-3 text-sm font-semibold">
                Verification ready
              </p>
              <p className="mt-1 text-xs leading-5 text-blue-100">
                Verification will be introduced soon.
              </p>
            </div>
          </div>
        </div>

        <BiasharaBusinessOnboarding
          onCreated={onCreated}
        />
      </div>
    </div>
  );
}

/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function BiasharaDashboard({
  onNavigate,
}) {
  const {
    getBiasharaBusiness,
    getBiasharaDashboard,
  } = useJumuiyaApi();

  const [business, setBusiness] = useState(null);
  const [dashboard, setDashboard] = useState(null);

  const [checkingBusiness, setCheckingBusiness] =
    useState(true);

  const [loadingDashboard, setLoadingDashboard] =
    useState(false);

  const [hasCheckedBusiness, setHasCheckedBusiness] =
    useState(false);

  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] =
    useState(null);

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const navigate = useCallback(
    (route) => {
      if (typeof onNavigate === "function") {
        onNavigate(route);
        return;
      }

      window.dispatchEvent(
        new CustomEvent("revelacode:navigate", {
          detail: { route },
        }),
      );
    },
    [onNavigate],
  );

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    setError("");

    try {
      const data = await getBiasharaDashboard();

      setDashboard(data || null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err?.message ||
          "Failed to load Biashara dashboard.",
      );
    } finally {
      setLoadingDashboard(false);
    }
  }, [getBiasharaDashboard]);

  /* =======================================================
     INITIAL BUSINESS CHECK
  ======================================================= */

  const checkBusiness = useCallback(
    async () => {
      setCheckingBusiness(true);
      setError("");
      setHasCheckedBusiness(false);

      try {
        const response =
          await getBiasharaBusiness();

        const currentBusiness =
          extractBusiness(response);

        setBusiness(currentBusiness);
      } catch (err) {
        if (isBusinessNotFoundError(err)) {
          setBusiness(null);
          setError("");
        } else {
          setBusiness(null);

          setError(
            err?.message ||
              "Unable to check your business account.",
          );
        }
      } finally {
        setCheckingBusiness(false);
        setHasCheckedBusiness(true);
      }
    },
    [getBiasharaBusiness],
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const initialise = async () => {
      if (!mounted) {
        return;
      }

      await checkBusiness();
    };

    initialise();

    return () => {
      mounted = false;
    };
  }, [checkBusiness]);

  /* =======================================================
     LOAD DASHBOARD AFTER BUSINESS EXISTS
  ======================================================= */

  useEffect(() => {
    if (!hasCheckedBusiness || !business) {
      return;
    }

    let mounted = true;

    const load = async () => {
      if (!mounted) {
        return;
      }

      await loadDashboard();
    };

    load();

    return () => {
      mounted = false;
    };
  }, [
    hasCheckedBusiness,
    business,
    loadDashboard,
  ]);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const metrics = dashboard?.metrics || {};
  const today = dashboard?.today || {};

  const currency =
    dashboard?.currency ||
    business?.currency ||
    "KES";

  const topProducts = Array.isArray(
    dashboard?.top_products,
  )
    ? dashboard.top_products
    : [];

  const recentOrders = Array.isArray(
    dashboard?.recent_orders,
  )
    ? dashboard.recent_orders
    : [];

  const recentSales = Array.isArray(
    dashboard?.recent_sales,
  )
    ? dashboard.recent_sales
    : [];

  const lowStockProducts = Array.isArray(
    dashboard?.low_stock_products,
  )
    ? dashboard.low_stock_products
    : [];

  const totalRevenue = numberValue(
    metrics.sales_total,
  );

  const totalExpenses = numberValue(
    metrics.expenses_total,
  );

  const netEstimate = numberValue(
    metrics.net_estimate,
  );

  const todaySales = numberValue(
    today.sales,
  );

  const todayOrders = numberValue(
    today.orders,
  );

  const pendingOrders = numberValue(
    metrics.pending_orders,
  );

  const completedOrders = numberValue(
    metrics.completed_orders,
  );

  const totalOrders = numberValue(
    metrics.orders,
  );

  const customers = numberValue(
    metrics.customers,
  );

  const lowStockCount = numberValue(
    metrics.low_stock,
  );

  const averageOrderValue = numberValue(
    metrics.average_order_value,
  );

  const completeness = useMemo(
    () => getProfileCompleteness(business),
    [business],
  );

  const revenueRatio = useMemo(() => {
    if (totalRevenue <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(
        0,
        (netEstimate / totalRevenue) * 100,
      ),
    );
  }, [
    totalRevenue,
    netEstimate,
  ]);

  /* =======================================================
     PROFILE ACTION
  ======================================================= */

  const openBusinessProfile = useCallback(() => {
    /*
     * Keep this route flexible.
     *
     * If a dedicated business profile page is introduced,
     * route it here without changing the dashboard.
     */
    navigate("business-profile");
  }, [navigate]);

  /* =======================================================
     BUSINESS CREATED
  ======================================================= */

  const handleBusinessCreated = useCallback(
    async (createdBusiness) => {
      const normalizedBusiness =
        extractBusiness(
          createdBusiness,
        ) || createdBusiness;

      setBusiness(
        normalizedBusiness,
      );

      setDashboard(null);
      setError("");
      setLastUpdated(null);

      setLoadingDashboard(true);

      try {
        const dashboardData =
          await getBiasharaDashboard();

        setDashboard(
          dashboardData || null,
        );

        setLastUpdated(
          new Date(),
        );
      } catch (err) {
        setError(
          err?.message ||
            "Your business was created, but the dashboard could not be loaded.",
        );
      } finally {
        setLoadingDashboard(false);
      }
    },
    [getBiasharaDashboard],
  );

  /* =======================================================
     LOADING
  ======================================================= */

  if (checkingBusiness) {
    return <LoadingScreen />;
  }

  /* =======================================================
     REAL ERROR
  ======================================================= */

  if (
    hasCheckedBusiness &&
    error &&
    !business
  ) {
    return (
      <FatalError
        message={error}
        onRetry={checkBusiness}
      />
    );
  }

  /* =======================================================
     NO BUSINESS
  ======================================================= */

  if (
    hasCheckedBusiness &&
    !business
  ) {
    return (
      <CreateBusinessState
        onCreated={handleBusinessCreated}
      />
    );
  }

  /* =======================================================
     DASHBOARD LOADING
  ======================================================= */

  if (
    business &&
    loadingDashboard &&
    !dashboard
  ) {
    return <LoadingScreen />;
  }

  /* =======================================================
     DASHBOARD
  ======================================================= */

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-5 lg:p-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-50 text-blue-600">
                {business?.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt={
                      business?.name ||
                      "Business logo"
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Briefcase size={24} />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                    Biashara Hub
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 size={12} />
                    Active
                  </span>
                </div>

                <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {business?.name ||
                    "Your Business"}
                </h1>

                <p className="mt-1 truncate text-sm text-slate-500">
                  {business?.category ||
                    "Business workspace"}

                  {business?.location
                    ? ` · ${business.location}`
                    : ""}

                  {business?.county
                    ? `, ${business.county}`
                    : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-auto flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500 lg:mr-0">
                <Clock3 size={14} />

                <span>
                  Updated{" "}
                  {lastUpdated
                    ? formatDateTime(
                        lastUpdated,
                      )
                    : "just now"}
                </span>
              </div>

              <button
                type="button"
                onClick={openBusinessProfile}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Briefcase size={16} />
                Profile
              </button>

              <button
                type="button"
                onClick={loadDashboard}
                disabled={loadingDashboard}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={
                    loadingDashboard
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("notifications")
                }
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50"
                aria-label="Notifications"
              >
                <Bell size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* =================================================
            BUSINESS PROFILE / LEGAL IDENTITY
        ================================================= */}

        <BusinessProfileNotice
          business={business}
          completeness={completeness}
          onCompleteProfile={
            openBusinessProfile
          }
        />

        {/* =================================================
            ERROR BANNER
        ================================================= */}

        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-amber-600"
            />

            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                Dashboard update issue
              </p>

              <p className="mt-0.5 text-xs leading-5 text-amber-700">
                {error}
              </p>
            </div>
          </div>
        ) : null}

        {/* =================================================
            QUICK ACCESS
        ================================================= */}

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <SectionHeader
            eyebrow="Quick access"
            title="Run your business"
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <QuickAction
              icon={Package}
              label="Products"
              description="Manage stock"
              onClick={() =>
                navigate("products")
              }
            />

            <QuickAction
              icon={ShoppingCart}
              label="Orders"
              description="Manage orders"
              onClick={() =>
                navigate("orders")
              }
            />

            <QuickAction
              icon={Users}
              label="Customers"
              description="Customer records"
              onClick={() =>
                navigate("customers")
              }
            />

            <QuickAction
              icon={WalletCards}
              label="Record sale"
              description="Capture a sale"
              onClick={() =>
                navigate("sales")
              }
            />

            <QuickAction
              icon={BarChart3}
              label="Analytics"
              description="Business performance"
              onClick={() =>
                navigate("biashara-analytics")
              }
            />

            <QuickAction
              icon={Sparkles}
              label="Intelligence"
              description="Business insights"
              onClick={() =>
                navigate("biashara-intelligence")
              }
            />
          </div>
        </section>

        {/* =================================================
            PRIMARY METRICS
        ================================================= */}

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                Business overview
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Your numbers
              </h2>
            </div>

            <span className="text-xs font-medium text-slate-400">
              {currency}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              icon={DollarSign}
              label="Total sales"
              value={formatCompactMoney(
                totalRevenue,
                currency,
              )}
              supporting={`${formatNumber(
                metrics.products,
              )} products tracked`}
              iconClassName="bg-blue-50 text-blue-600"
            />

            <MetricCard
              icon={ShoppingCart}
              label="Orders"
              value={formatNumber(
                totalOrders,
              )}
              supporting={`${formatNumber(
                pendingOrders,
              )} currently active`}
              iconClassName="bg-violet-50 text-violet-600"
            />

            <MetricCard
              icon={Users}
              label="Customers"
              value={formatNumber(
                customers,
              )}
              supporting={`${formatNumber(
                completedOrders,
              )} completed orders`}
              iconClassName="bg-emerald-50 text-emerald-600"
            />

            <MetricCard
              icon={TrendingUp}
              label="Net estimate"
              value={formatCompactMoney(
                netEstimate,
                currency,
              )}
              supporting={`${Math.round(
                revenueRatio,
              )}% of total sales`}
              iconClassName="bg-amber-50 text-amber-600"
            />
          </div>
        </section>

        {/* =================================================
            TODAY + STOCK
        ================================================= */}

        <section className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-3xl bg-slate-900 p-5 text-white shadow-sm sm:p-6 lg:col-span-2">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">
                  Today
                </p>

                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  {formatMoney(
                    todaySales,
                    currency,
                  )}
                </h2>

                <p className="mt-1 text-sm text-slate-300">
                  Sales recorded today
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3">
                <ShoppingCart
                  size={17}
                  className="text-blue-300"
                />

                <div>
                  <p className="text-xs text-slate-400">
                    Orders today
                  </p>

                  <p className="text-lg font-bold">
                    {formatNumber(
                      todayOrders,
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <DarkStat
                label="Average order"
                value={formatMoney(
                  averageOrderValue,
                  currency,
                )}
              />

              <DarkStat
                label="Completed orders"
                value={formatNumber(
                  completedOrders,
                )}
              />

              <DarkStat
                label="Expenses"
                value={formatCompactMoney(
                  totalExpenses,
                  currency,
                )}
              />

              <DarkStat
                label="Low stock"
                value={formatNumber(
                  lowStockCount,
                )}
              />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <SectionHeader
              eyebrow="Operations"
              title="Stock health"
              actionLabel={
                lowStockProducts.length
                  ? "Manage"
                  : undefined
              }
              onAction={() =>
                navigate("products")
              }
            />

            {lowStockProducts.length ? (
              <div className="space-y-3">
                {lowStockProducts
                  .slice(0, 5)
                  .map(
                    (
                      product,
                      index,
                    ) => (
                      <div
                        key={
                          product.id ||
                          product._id ||
                          product.product_id ||
                          product.name ||
                          index
                        }
                        className="flex items-center justify-between gap-3 rounded-2xl bg-red-50 px-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {product.name ||
                              "Product"}
                          </p>

                          <p className="mt-0.5 text-xs text-red-600">
                            {formatNumber(
                              product.stock_quantity ??
                                product.quantity ??
                                product.stock ??
                                0,
                            )}{" "}
                            left
                          </p>
                        </div>

                        <ArrowDownRight
                          size={18}
                          className="shrink-0 text-red-500"
                        />
                      </div>
                    ),
                  )}
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="Stock looks healthy"
                text="No products are currently below their low-stock threshold."
              />
            )}

            <div className="mt-4 rounded-2xl bg-slate-50 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Active products
                </span>

                <span className="text-sm font-bold text-slate-900">
                  {formatNumber(
                    metrics.active_products,
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            INTELLIGENCE CTA
        ================================================= */}

        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-5 text-white shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-300">
                <Sparkles size={22} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">
                  RevelaAI Business Intelligence
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Understand what your business should do next.
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
                  Explore market conditions, demand signals,
                  product opportunities, pricing insights and
                  business alerts from your Biashara intelligence
                  system.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "biashara-intelligence",
                )
              }
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-blue-50"
            >
              Open intelligence
              <ChevronRight size={16} />
            </button>
          </div>
        </section>

        {/* =================================================
            TOP PRODUCTS
        ================================================= */}

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <SectionHeader
            eyebrow="Performance"
            title="Top products"
            actionLabel={
              topProducts.length
                ? "View all"
                : undefined
            }
            onAction={() =>
              navigate("products")
            }
          />

          {topProducts.length ? (
            <div className="space-y-3">
              {topProducts.map(
                (product, index) => (
                  <div
                    key={
                      product.product_id ||
                      product.id ||
                      product._id ||
                      product.name ||
                      index
                    }
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 px-3 py-3.5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-600">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {product.name ||
                          "Product"}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>
                          {formatNumber(
                            product.units,
                          )}{" "}
                          units
                        </span>

                        <span>
                          {formatMoney(
                            product.revenue,
                            currency,
                          )}
                        </span>
                      </div>
                    </div>

                    <TrendingUp
                      size={18}
                      className="shrink-0 text-emerald-500"
                    />
                  </div>
                ),
              )}
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No product sales yet"
              text="Once you record sales, your best-performing products will appear here."
              actionLabel="Record first sale"
              onAction={() =>
                navigate("sales")
              }
            />
          )}
        </section>

        {/* =================================================
            RECENT ORDERS + SALES
        ================================================= */}

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <SectionHeader
              eyebrow="Orders"
              title="Recent orders"
              actionLabel={
                recentOrders.length
                  ? "View all"
                  : undefined
              }
              onAction={() =>
                navigate("orders")
              }
            />

            {recentOrders.length ? (
              <div className="space-y-3">
                {recentOrders.map(
                  (order, index) => (
                    <div
                      key={
                        order.id ||
                        order._id ||
                        order.order_number ||
                        index
                      }
                      className="rounded-2xl border border-slate-100 p-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {getOrderReference(
                              order,
                            )}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {getOrderCustomer(
                              order,
                            )}
                          </p>
                        </div>

                        <OrderStatusPill
                          status={
                            order.status
                          }
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-400">
                          {formatDate(
                            order.created_at ||
                              order.updated_at ||
                              order.ordered_at,
                          )}
                        </span>

                        <span className="text-sm font-bold text-slate-900">
                          {formatMoney(
                            getOrderAmount(
                              order,
                            ),
                            currency,
                          )}
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <EmptyState
                icon={ShoppingCart}
                title="No orders yet"
                text="New customer orders will appear here."
                actionLabel="Manage orders"
                onAction={() =>
                  navigate("orders")
                }
              />
            )}
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <SectionHeader
              eyebrow="Sales"
              title="Recent sales"
              actionLabel={
                recentSales.length
                  ? "View all"
                  : undefined
              }
              onAction={() =>
                navigate("sales")
              }
            />

            {recentSales.length ? (
              <div className="space-y-3">
                {recentSales.map(
                  (sale, index) => (
                    <div
                      key={
                        sale.id ||
                        sale._id ||
                        sale.reference ||
                        sale.sale_number ||
                        index
                      }
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 p-3.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                          <DollarSign size={18} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {sale.reference ||
                              sale.sale_number ||
                              "Sale"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatDateTime(
                              sale.created_at ||
                                sale.sold_at,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-slate-900">
                          {formatMoney(
                            sale.amount ??
                              sale.total ??
                              sale.total_amount ??
                              0,
                            currency,
                          )}
                        </p>

                        <p className="mt-0.5 text-[11px] font-medium text-emerald-600">
                          Recorded
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <EmptyState
                icon={DollarSign}
                title="No sales yet"
                text="Completed sales will appear here as you record them."
                actionLabel="Record sale"
                onAction={() =>
                  navigate("sales")
                }
              />
            )}
          </div>
        </section>

        {/* =================================================
            PROFILE SNAPSHOT
        ================================================= */}

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <SectionHeader
            eyebrow="Business identity"
            title="Workspace snapshot"
            actionLabel="Manage profile"
            onAction={openBusinessProfile}
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ProfileStat
              label="Business type"
              value={
                business?.business_type ||
                "Not specified"
              }
            />

            <ProfileStat
              label="Category"
              value={
                business?.category ||
                "Not specified"
              }
            />

            <ProfileStat
              label="Location"
              value={
                business?.location ||
                "Not specified"
              }
            />

            <ProfileStat
              label="Currency"
              value={currency}
            />
          </div>

          {completeness.missing.length ? (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Complete your business profile
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    Missing:{" "}
                    {completeness.missing.join(
                      ", ",
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  openBusinessProfile
                }
                className="inline-flex shrink-0 items-center justify-center gap-1 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-amber-700"
              >
                Complete profile
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Core business profile complete
                </p>

                <p className="mt-0.5 text-xs text-emerald-700">
                  Your profile is ready for the future
                  business verification process.
                </p>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

