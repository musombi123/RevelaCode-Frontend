import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  Globe,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";

import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

import BiasharaBusinessOnboarding from "@/Dashboard/Biashara/BiasharaBusinessOnboarding.jsx";
import BiasharaInternalWorkspace from "@/Dashboard/Biashara/BiasharaInternalWorkspace.jsx";
import BiasharaShell from "@/Dashboard/Biashara/BiasharaShell.jsx";
import HubRevenueOffers from "@/Dashboard/HubRevenueOffers.jsx";

/* =========================================================
   HELPERS
========================================================= */

function numberValue(value, fallback = 0) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 0,
  }).format(numberValue(value));
}

function formatMoney(value, currency = "KES") {
  const safeCurrency = String(currency || "KES")
    .trim()
    .toUpperCase();

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

  const safeCurrency = String(currency || "KES")
    .trim()
    .toUpperCase();

  const absolute = Math.abs(numeric);

  if (absolute >= 1_000_000_000) {
    return `${safeCurrency} ${(numeric / 1_000_000_000).toFixed(1)}B`;
  }

  if (absolute >= 1_000_000) {
    return `${safeCurrency} ${(numeric / 1_000_000).toFixed(1)}M`;
  }

  if (absolute >= 1_000) {
    return `${safeCurrency} ${(numeric / 1_000).toFixed(1)}K`;
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
      order?.order_total ??
      0,
  );
}

function getOrderCustomer(order) {
  return (
    order?.customer_name ||
    order?.customer?.name ||
    order?.customer?.full_name ||
    order?.buyer_name ||
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
    order?.order_id ||
    order?.id ||
    order?._id ||
    "Order"
  );
}

function getSaleAmount(sale) {
  return numberValue(
    sale?.amount ??
      sale?.total ??
      sale?.total_amount ??
      sale?.sale_amount ??
      sale?.grand_total ??
      0,
  );
}

function getProductStock(product) {
  return numberValue(
    product?.stock_quantity ??
      product?.quantity ??
      product?.stock ??
      product?.available_stock ??
      product?.current_stock ??
      0,
  );
}

function isBusinessNotFoundError(error) {
  const message = String(
    error?.message ||
      error?.error ||
      error?.detail ||
      error?.response?.data?.message ||
      error?.response?.data?.error ||
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
    payload.result?.business &&
    typeof payload.result.business === "object" &&
    !Array.isArray(payload.result.business)
  ) {
    return payload.result.business;
  }

  if (
    typeof payload === "object" &&
    !Array.isArray(payload)
  ) {
    const looksLikeBusiness =
      payload.name ||
      payload.business_name ||
      payload.business_type ||
      payload.category ||
      payload.phone ||
      payload.email ||
      payload.county ||
      payload.location;

    if (looksLikeBusiness) {
      return payload;
    }
  }

  return null;
}

function isVerifiedBusiness(business) {
  return (
    String(business?.verification_status || "").trim().toLowerCase() === "verified" &&
    String(business?.status || "").trim().toLowerCase() === "active"
  );
}

function extractDashboard(payload) {
  if (!payload) {
    return null;
  }

  if (
    payload.dashboard &&
    typeof payload.dashboard === "object" &&
    !Array.isArray(payload.dashboard)
  ) {
    return payload.dashboard;
  }

  if (
    payload.data?.dashboard &&
    typeof payload.data.dashboard === "object" &&
    !Array.isArray(payload.data.dashboard)
  ) {
    return payload.data.dashboard;
  }

  if (
    payload.result?.dashboard &&
    typeof payload.result.dashboard === "object" &&
    !Array.isArray(payload.result.dashboard)
  ) {
    return payload.result.dashboard;
  }

  if (
    typeof payload === "object" &&
    !Array.isArray(payload)
  ) {
    return payload;
  }

  return null;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getDashboardMetrics(dashboard) {
  return (
    dashboard?.metrics ||
    dashboard?.overview ||
    dashboard?.summary ||
    dashboard?.data?.metrics ||
    dashboard?.business_metrics ||
    {}
  );
}

function getDashboardToday(dashboard) {
  return (
    dashboard?.today ||
    dashboard?.today_metrics ||
    dashboard?.daily ||
    dashboard?.data?.today ||
    {}
  );
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
    ["Business name", business.name || business.business_name],
    ["Business category", business.category],
    ["Business type", business.business_type],
    ["Phone number", business.phone || business.phone_number],
    ["Email", business.email || business.email_address],
    ["County", business.county],
    ["Location", business.location || business.address],
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
    <div className="group rounded-2xl border border-white bg-white p-3.5 shadow-sm ring-1 ring-slate-100 transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/70 sm:rounded-[1.5rem] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
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
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-black/5 ${iconClassName}`}
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
  const normalized = String(status || "")
    .trim()
    .toLowerCase();

  let className = "bg-slate-100 text-slate-600";

  if (
    normalized === "completed" ||
    normalized === "complete" ||
    normalized === "delivered"
  ) {
    className = "bg-emerald-50 text-emerald-700";
  } else if (
    normalized === "pending" ||
    normalized === "confirmed" ||
    normalized === "processing" ||
    normalized === "paid"
  ) {
    className = "bg-amber-50 text-amber-700";
  } else if (
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "failed" ||
    normalized === "rejected"
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
      className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md hover:shadow-blue-950/5"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-slate-200/70 transition group-hover:bg-blue-600 group-hover:text-white group-hover:ring-blue-600">
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
  const verificationStatus = String(
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
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-4 text-white sm:p-5">
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
                    Profile status unavailable
                  </span>
                )}
              </div>

              <h2 className="mt-2 text-xl font-bold">
                Keep your business identity complete
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-blue-100">
                Your Biashara workspace is connected to your
                business profile. Complete the core business
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

      <div className="p-4 sm:p-5">
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
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
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
   BUSINESS VERIFICATION STATE
========================================================= */

function BusinessVerificationState({
  business,
  onRefresh,
  onResubmit,
}) {
  const verificationStatus = String(
    business?.verification_status ||
      (business?.status === "active" ? "pending" : business?.status) ||
      "pending",
  ).trim().toLowerCase();

  const rejected = verificationStatus === "rejected" || business?.status === "rejected";
  const needsInformation = verificationStatus === "needs_information";
  const suspended = business?.status === "suspended";
  const isPending = !rejected && !needsInformation && !suspended;

  const title = suspended
    ? "Business access is suspended"
    : rejected
      ? "Business application not approved"
      : needsInformation
        ? "More information is required"
        : "Your business is awaiting verification";

  const description = suspended
    ? "This business workspace is currently suspended. Contact platform support for next steps."
    : rejected
      ? "The platform administrator did not approve this application. Review the notes below and update the application before resubmitting."
      : needsInformation
        ? "A platform administrator needs additional information before making a decision. Review the request and update your application."
        : "Your details have been submitted. A platform administrator must review and verify the application before your business profile and workspace become available.";

  return (
    <div className="min-h-[70vh] bg-revela-dark px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-revela-card shadow-2xl shadow-black/20">
          <div className="border-b border-white/10 bg-gradient-to-br from-emerald-500/10 via-revela-card to-revela-dark px-5 py-7 sm:px-8 sm:py-9">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300">
              {suspended ? <AlertCircle size={26} /> : rejected ? <AlertCircle size={26} /> : needsInformation ? <FileCheck2 size={26} /> : <Clock3 size={26} />}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Biashara verification</p>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                rejected || suspended
                  ? "border-red-300/20 bg-red-400/10 text-red-200"
                  : needsInformation
                    ? "border-amber-300/20 bg-amber-400/10 text-amber-200"
                    : "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
              }`}>
                {suspended ? "Suspended" : rejected ? "Rejected" : needsInformation ? "Needs information" : "Pending review"}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                <RefreshCw size={16} />
                Refresh application status
              </button>
              {(rejected || needsInformation) ? (
                <button
                  type="button"
                  onClick={onResubmit}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                >
                  Update and resubmit
                  <ChevronRight size={16} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-8">
            <div className="rounded-2xl border border-white/10 bg-revela-dark/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Submitted business</p>
              <p className="mt-2 break-words text-lg font-bold text-white">{business?.name || business?.business_name || "Business application"}</p>
              <p className="mt-1 text-sm text-slate-400">{[business?.category, business?.business_type].filter(Boolean).join(" · ") || "Business details submitted"}</p>
              <p className="mt-3 text-xs text-slate-500">Submitted {formatDateTime(business?.submitted_at || business?.created_at)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-revela-dark/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">What happens next?</p>
              <ol className="mt-3 space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-300" />
                  <span className="text-slate-200">Your business details are saved for review.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  {rejected ? <XCircle size={17} className="mt-0.5 shrink-0 text-red-300" /> : needsInformation ? <AlertCircle size={17} className="mt-0.5 shrink-0 text-amber-300" /> : <Clock3 size={17} className="mt-0.5 shrink-0 text-slate-400" />}
                  <span className="text-slate-200">{rejected ? "Update the required information and resubmit." : needsInformation ? "Provide the requested corrections and resubmit." : suspended ? "Contact platform support for assistance." : "A platform administrator checks the application."}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck size={17} className={`mt-0.5 shrink-0 ${isPending ? "text-slate-500" : "text-emerald-300"}`} />
                  <span className="text-slate-200">After approval, your business profile and workspace unlock.</span>
                </li>
              </ol>
            </div>
            {business?.review_notes ? (
              <div className="sm:col-span-2 rounded-2xl border border-amber-300/20 bg-amber-400/5 p-4">
                <p className="text-sm font-bold text-amber-200">Platform administrator notes</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{business.review_notes}</p>
              </div>
            ) : null}
          </div>
        </section>
        <p role="status" aria-live="polite" className="mt-4 text-center text-xs leading-5 text-slate-500">
          The application status is returned by the backend. This page does not grant or simulate approval.
        </p>
      </div>
    </div>
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
        <div className="mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-700 to-indigo-800 p-4 text-white shadow-sm sm:mb-6 sm:rounded-3xl sm:p-7">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Store size={27} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
                Biashara Hub
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Submit your business for verification
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                Start by submitting your business details. This creates a verification application, not an active business profile. The full Biashara workspace unlocks after a platform administrator approves it.
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
                Your application will be reviewed by a platform administrator. The workspace unlocks after approval.
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

  const [activeSection, setActiveSection] = useState("overview");
  const [editingApplication, setEditingApplication] = useState(false);

  const businessRequestRef = useRef(0);
  const dashboardRequestRef = useRef(0);

  /* =======================================================
     NAVIGATION
     All Biashara actions flow through the parent router.
  ======================================================= */

  const navigate = useCallback(
    (route) => {
      if (!route) return;

      const internalRoutes = new Set([
        "overview",
        "products",
        "orders",
        "customers",
        "sales",
        "business-profile",
        "website",
        "biashara-analytics",
        "biashara-intelligence",
        "notifications",
        // These are internal Biashara workspace routes, not global dashboard routes.
        "finance",
        "automations",
        "sync",
        "team",
        "business-switch",
      ]);

      if (internalRoutes.has(route)) {
        setActiveSection(route);
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }

      // Top-level destinations, such as RevelaAI, belong to the parent router.
      if (typeof onNavigate === "function") {
        onNavigate(route);
        return;
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("revelacode:navigate", {
            detail: { route },
          }),
        );
      }
    },
    [onNavigate],
  );

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard = useCallback(async () => {
    const requestId =
      dashboardRequestRef.current + 1;

    dashboardRequestRef.current = requestId;

    setLoadingDashboard(true);
    setError("");

    try {
      const response =
        await getBiasharaDashboard();

      if (
        dashboardRequestRef.current !==
        requestId
      ) {
        return;
      }

      const normalizedDashboard =
        extractDashboard(response);

      setDashboard(
        normalizedDashboard || null,
      );

      setLastUpdated(new Date());
    } catch (err) {
      if (
        dashboardRequestRef.current !==
        requestId
      ) {
        return;
      }

      setError(
        err?.message ||
          err?.error ||
          "Failed to load Biashara dashboard.",
      );
    } finally {
      if (
        dashboardRequestRef.current ===
        requestId
      ) {
        setLoadingDashboard(false);
      }
    }
  }, [getBiasharaDashboard]);

  /* =======================================================
     INITIAL BUSINESS CHECK
  ======================================================= */

  const checkBusiness = useCallback(
    async () => {
      const requestId =
        businessRequestRef.current + 1;

      businessRequestRef.current =
        requestId;

      setCheckingBusiness(true);
      setError("");
      setHasCheckedBusiness(false);

      try {
        const response =
          await getBiasharaBusiness();

        if (
          businessRequestRef.current !==
          requestId
        ) {
          return;
        }

        const currentBusiness =
          extractBusiness(response);

        setBusiness(
          currentBusiness || null,
        );
      } catch (err) {
        if (
          businessRequestRef.current !==
          requestId
        ) {
          return;
        }

        if (
          isBusinessNotFoundError(err)
        ) {
          setBusiness(null);
          setError("");
        } else {
          setBusiness(null);

          setError(
            err?.message ||
              err?.error ||
              "Unable to check your business account.",
          );
        }
      } finally {
        if (
          businessRequestRef.current ===
          requestId
        ) {
          setCheckingBusiness(false);
          setHasCheckedBusiness(true);
        }
      }
    },
    [getBiasharaBusiness],
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    checkBusiness();
  }, [checkBusiness]);

  /* =======================================================
     LOAD DASHBOARD AFTER BUSINESS EXISTS
  ======================================================= */

  useEffect(() => {
    if (
      !hasCheckedBusiness ||
      !isVerifiedBusiness(business)
    ) {
      return;
    }

    loadDashboard();
  }, [
    hasCheckedBusiness,
    business,
    loadDashboard,
  ]);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const metrics =
    getDashboardMetrics(dashboard);

  const today =
    getDashboardToday(dashboard);

  const currency =
    dashboard?.currency ||
    metrics?.currency ||
    business?.currency ||
    "KES";

  const topProducts = normalizeArray(
    dashboard?.top_products ??
      dashboard?.topProducts ??
      dashboard?.products_top ??
      dashboard?.data?.top_products,
  );

  const recentOrders = normalizeArray(
    dashboard?.recent_orders ??
      dashboard?.recentOrders ??
      dashboard?.orders_recent ??
      dashboard?.data?.recent_orders,
  );

  const recentSales = normalizeArray(
    dashboard?.recent_sales ??
      dashboard?.recentSales ??
      dashboard?.sales_recent ??
      dashboard?.data?.recent_sales,
  );

  const lowStockProducts =
    normalizeArray(
      dashboard?.low_stock_products ??
        dashboard?.lowStockProducts ??
        dashboard?.low_stock_items ??
        dashboard?.data?.low_stock_products,
    );

  const totalRevenue = numberValue(
    metrics?.sales_total ??
      metrics?.total_sales ??
      metrics?.revenue ??
      metrics?.total_revenue,
  );

  const totalExpenses = numberValue(
    metrics?.expenses_total ??
      metrics?.total_expenses ??
      metrics?.expenses,
  );

  const netEstimate = numberValue(
    metrics?.net_estimate ??
      metrics?.net ??
      metrics?.estimated_profit ??
      metrics?.profit_estimate ??
      totalRevenue - totalExpenses,
  );

  const todaySales = numberValue(
    today?.sales ??
      today?.sales_total ??
      today?.revenue ??
      today?.total_sales,
  );

  const todayOrders = numberValue(
    today?.orders ??
      today?.orders_count ??
      today?.total_orders,
  );

  const pendingOrders = numberValue(
    metrics?.pending_orders ??
      metrics?.pending ??
      metrics?.active_orders,
  );

  const completedOrders = numberValue(
    metrics?.completed_orders ??
      metrics?.completed ??
      metrics?.fulfilled_orders,
  );

  const totalOrders = numberValue(
    metrics?.orders ??
      metrics?.total_orders ??
      metrics?.order_count,
  );

  const customers = numberValue(
    metrics?.customers ??
      metrics?.total_customers ??
      metrics?.customer_count,
  );

  const productsTracked = numberValue(
    metrics?.products ??
      metrics?.total_products ??
      metrics?.product_count,
  );

  const activeProducts = numberValue(
    metrics?.active_products ??
      metrics?.active_product_count ??
      metrics?.products_active ??
      productsTracked,
  );

  const lowStockCount = numberValue(
    metrics?.low_stock ??
      metrics?.low_stock_count ??
      lowStockProducts.length,
  );

  const averageOrderValue =
    numberValue(
      metrics?.average_order_value ??
        metrics?.average_order ??
        metrics?.avg_order_value,
    );

  const completeness = useMemo(
    () => getProfileCompleteness(business),
    [business],
  );

  const revenueRatio = useMemo(() => {
    if (
      totalRevenue <= 0 ||
      !Number.isFinite(totalRevenue)
    ) {
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

  const openBusinessProfile =
    useCallback(() => {
      navigate("business-profile");
    }, [navigate]);

  /* =======================================================
     BUSINESS CREATED
  ======================================================= */

  const handleBusinessCreated =
    useCallback(
      (createdBusiness) => {
        const normalizedBusiness =
          extractBusiness(
            createdBusiness,
          ) ||
          createdBusiness ||
          null;

        setBusiness(
          normalizedBusiness,
        );

        setDashboard(null);
        setError("");
        setLastUpdated(null);
        setEditingApplication(false);
        setActiveSection("overview");

        setHasCheckedBusiness(true);
      },
      [],
    );

  /* =======================================================
     RETRY BUSINESS CHECK
  ======================================================= */

  const handleRetryBusiness =
    useCallback(() => {
      setDashboard(null);
      setLastUpdated(null);
      checkBusiness();
    }, [checkBusiness]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (checkingBusiness) {
    return <LoadingScreen />;
  }

  /* =======================================================
     REAL INITIAL ERROR
  ======================================================= */

  if (
    hasCheckedBusiness &&
    error &&
    !business
  ) {
    return (
      <FatalError
        message={error}
        onRetry={handleRetryBusiness}
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
      <>
        <CreateBusinessState onCreated={handleBusinessCreated} />
        <div className="mx-auto w-full max-w-4xl px-3 pb-8 sm:px-6">
          <HubRevenueOffers hub="biashara" compact />
        </div>
      </>
    );
  }

  if (business && !isVerifiedBusiness(business)) {
    const status = String(
      business?.verification_status ||
        (business?.status === "active" ? "pending" : business?.status) ||
        "pending",
    ).trim().toLowerCase();
    const canResubmit = status === "rejected" || status === "needs_information";

    if (editingApplication && canResubmit) {
      return (
        <>
          <BiasharaBusinessOnboarding
            initialBusiness={business}
            resubmitting
            onCreated={handleBusinessCreated}
          />
          <div className="mx-auto w-full max-w-4xl px-3 pb-8 sm:px-6">
            <HubRevenueOffers hub="biashara" compact />
          </div>
        </>
      );
    }

    return (
      <div className="min-h-screen space-y-4 bg-[#f4f7fb] p-3 sm:p-6">
        <BusinessVerificationState
          business={business}
          onRefresh={handleRetryBusiness}
          onResubmit={() => setEditingApplication(true)}
        />
        <div className="mx-auto w-full max-w-4xl">
          <HubRevenueOffers hub="biashara" compact />
        </div>
      </div>
    );
  }

  /* =======================================================
     DASHBOARD INITIAL LOADING
  ======================================================= */

  /* =======================================================
     INTERNAL BIASHARA WORKSPACES
     Internal pages remain inside Biashara instead of being
     incorrectly sent to the global dashboard registry.
  ======================================================= */

  if (business && activeSection !== "overview") {
    return (
      <BiasharaShell
        business={business}
        activeSection={activeSection}
        onNavigate={navigate}
        onRefresh={loadDashboard}
      >
        <BiasharaInternalWorkspace
          route={activeSection}
          business={business}
          dashboard={dashboard}
          onBack={() => setActiveSection("overview")}
          onNavigate={navigate}
          onBusinessUpdated={handleBusinessCreated}
          onRefresh={loadDashboard}
        />
      </BiasharaShell>
    );
  }

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
    <BiasharaShell business={business} activeSection={activeSection} onNavigate={navigate} onRefresh={loadDashboard}>
    <div className="min-h-full bg-[#f4f7fb]">
      <div className="mx-auto w-full max-w-screen-2xl space-y-4 p-3 sm:space-y-6 sm:p-6 lg:p-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white shadow-lg shadow-slate-900/10 sm:rounded-[2rem] sm:shadow-xl">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-4 p-4 sm:gap-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10 text-blue-100 ring-1 ring-white/15 backdrop-blur-sm">
                {business?.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt={
                      business?.name ||
                      business?.business_name ||
                      "Business logo"
                    }
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />
                ) : (
                  <Briefcase size={24} />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
                    Biashara Hub
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-200 ring-1 ring-white/10">
                    <Store size={12} />
                    Business workspace
                  </span>
                </div>

                <h1 className="mt-2 truncate text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                  {business?.name ||
                    business?.business_name ||
                    "Your Business"}
                </h1>

                <p className="mt-2 truncate text-sm text-slate-300">
                  {business?.category ||
                    "Business workspace"}

                  {business?.location ||
                  business?.address
                    ? ` · ${
                        business?.location ||
                        business?.address
                      }`
                    : ""}

                  {business?.county
                    ? `, ${business.county}`
                    : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-auto flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2.5 text-xs text-slate-300 ring-1 ring-white/10 lg:mr-0">
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
                onClick={
                  openBusinessProfile
                }
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Briefcase size={16} />
                Profile
              </button>

              <button
                type="button"
                onClick={loadDashboard}
                disabled={loadingDashboard}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
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
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 p-2.5 text-white transition hover:bg-white/10"
                aria-label="Notifications"
              >
                <Bell size={18} />
              </button>
            </div>
          </div>
        </section>

        <HubRevenueOffers hub="biashara" compact />

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

        <section className="rounded-2xl border border-white bg-white p-3.5 shadow-sm ring-1 ring-slate-100/80 sm:rounded-[1.5rem] sm:p-5">
          <SectionHeader
            eyebrow="Quick access"
            title="Run your business"
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
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
              icon={Globe}
              label="Website Studio"
              description="Publish storefront"
              onClick={() => navigate("website")}
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
                navigate(
                  "biashara-analytics",
                )
              }
            />

            <QuickAction
              icon={Sparkles}
              label="Intelligence"
              description="Business insights"
              onClick={() =>
                navigate(
                  "biashara-intelligence",
                )
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
              {String(currency).toUpperCase()}
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
                productsTracked,
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

        <section className="grid gap-3 sm:gap-5 lg:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 text-white shadow-md shadow-slate-900/10 sm:rounded-[1.75rem] sm:p-6 lg:col-span-2">
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

          <div className="rounded-2xl border border-white bg-white p-3.5 shadow-sm ring-1 ring-slate-100/80 sm:rounded-[1.5rem] sm:p-5">
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
                          product.product_id ||
                          product.id ||
                          product._id ||
                          product.name ||
                          index
                        }
                        className="flex items-center justify-between gap-3 rounded-2xl bg-red-50 px-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {product.name ||
                              product.product_name ||
                              "Product"}
                          </p>

                          <p className="mt-0.5 text-xs text-red-600">
                            {formatNumber(
                              getProductStock(
                                product,
                              ),
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
                    activeProducts,
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            INTELLIGENCE CTA
        ================================================= */}

        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-4 text-white shadow-sm sm:rounded-3xl sm:p-5">
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

        <section className="rounded-2xl border border-white bg-white p-3.5 shadow-sm ring-1 ring-slate-100/80 sm:rounded-[1.5rem] sm:p-5">
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
                          product.product_name ||
                          "Product"}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>
                          {formatNumber(
                            product.units ??
                              product.quantity_sold ??
                              product.units_sold ??
                              0,
                          )}{" "}
                          units
                        </span>

                        <span>
                          {formatMoney(
                            product.revenue ??
                              product.sales_total ??
                              product.total_revenue ??
                              0,
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

        <section className="grid gap-3 sm:gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white bg-white p-3.5 shadow-sm ring-1 ring-slate-100/80 sm:rounded-[1.5rem] sm:p-5">
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
                        order.reference ||
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
                            order.status ||
                            order.order_status
                          }
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-400">
                          {formatDate(
                            order.created_at ||
                              order.createdAt ||
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

          <div className="rounded-2xl border border-white bg-white p-3.5 shadow-sm ring-1 ring-slate-100/80 sm:rounded-[1.5rem] sm:p-5">
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
                        sale.sale_id ||
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
                              sale.sale_id ||
                              "Sale"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatDateTime(
                              sale.created_at ||
                                sale.createdAt ||
                                sale.sold_at ||
                                sale.sale_date,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-slate-900">
                          {formatMoney(
                            getSaleAmount(
                              sale,
                            ),
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

        <section className="rounded-2xl border border-white bg-white p-3.5 shadow-sm ring-1 ring-slate-100/80 sm:rounded-[1.5rem] sm:p-5">
          <SectionHeader
            eyebrow="Business identity"
            title="Workspace snapshot"
            actionLabel="Manage profile"
            onAction={
              openBusinessProfile
            }
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
                business?.address ||
                "Not specified"
              }
            />

            <ProfileStat
              label="Currency"
              value={String(
                currency || "KES",
              ).toUpperCase()}
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
                  Your profile is ready for the
                  future business verification
                  process.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
    </BiasharaShell>
  );
}

