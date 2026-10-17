
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Sprout,
  Users,
} from "lucide-react";

import { useAdminApi } from "@/services/adminApi.jsx";

const PAGE_SIZE = 25;

const RESOURCES = {
  shamba: {
    label: "Shamba Farmers",
    description: "Farmer profiles and farm ownership records.",
    endpoint: "/api/jumuiya/admin/shamba-profiles",
    icon: Sprout,
  },
  businesses: {
    label: "Biashara Businesses",
    description: "Registered business profiles across Jumuiya.",
    endpoint: "/api/jumuiya/admin/businesses",
    icon: Building2,
  },
  schools: {
    label: "Elimu Schools",
    description: "School profiles, registration details, and verification status.",
    endpoint: "/api/jumuiya/admin/schools",
    icon: GraduationCap,
  },
};

const FILTER_OPTIONS = {
  shamba: [
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
    { value: "suspended", label: "Suspended" },
    { value: "inactive", label: "Inactive" },
  ],
  businesses: [
    { value: "pending", label: "Pending verification" },
    { value: "verified", label: "Verified" },
    { value: "needs_information", label: "Needs information" },
    { value: "rejected", label: "Rejected" },
    { value: "suspended", label: "Suspended" },
    { value: "all", label: "All statuses" },
  ],
  schools: [
    { value: "pending", label: "Pending verification" },
    { value: "verified", label: "Verified" },
    { value: "needs_information", label: "Needs information" },
    { value: "rejected", label: "Rejected" },
    { value: "active", label: "Active" },
    { value: "suspended", label: "Suspended" },
    { value: "demo", label: "Demo records" },
  ],
};

const OVERVIEW_CARDS = [
  {
    key: "shamba_profiles",
    label: "Shamba farmer profiles",
    icon: Sprout,
  },
  {
    key: "biashara_profiles",
    label: "Biashara businesses",
    icon: Building2,
  },
  {
    key: "real_schools",
    label: "Real school profiles",
    icon: GraduationCap,
  },
  {
    key: "pending_schools",
    label: "Schools awaiting review",
    icon: Clock3,
  },
];

function displayValue(value, fallback = "—") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (Array.isArray(value)) {
    return value.length ? value.map(String).join(", ") : fallback;
  }

  if (typeof value === "object") {
    return fallback;
  }

  return String(value);
}

function formatCount(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? new Intl.NumberFormat().format(number)
    : "—";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return displayValue(value);
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function readStatus(item, resource) {
  if (resource === "schools" || resource === "businesses") {
    return item?.verification_status || item?.status || "pending";
  }

  return item?.status || "unknown";
}

function humanizeStatus(value) {
  return displayValue(value, "Unknown")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function statusClass(value) {
  const status = String(value || "").toLowerCase();

  if (["verified", "active", "approved", "complete", "completed"].includes(status)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300";
  }

  if (["pending", "pending_verification", "needs_information", "needs_info"].includes(status)) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300";
  }

  if (["rejected", "suspended", "inactive", "failed"].includes(status)) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300";
  }

  return "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function recordId(item, index) {
  return String(
    item?._id ||
      item?.id ||
      item?.application_id ||
      item?.user_id ||
      item?.owner_user_id ||
      `${item?.name || item?.farmer_name || "record"}-${index}`,
  );
}

function locationOf(item) {
  const parts = [
    item?.town,
    item?.county,
    item?.location,
  ].filter(Boolean);

  return parts.length ? [...new Set(parts)].join(", ") : "—";
}

function contactOf(item) {
  return item?.phone || item?.email || item?.contact_phone || item?.contact_email || "—";
}

function getIdentity(item, resource) {
  if (resource === "shamba") {
    return {
      name: item?.farmer_name || item?.name || item?.full_name || "Unnamed farmer",
      detail: item?.farm_name || item?.email || item?.phone || "Farmer profile",
    };
  }

  if (resource === "businesses") {
    return {
      name: item?.name || item?.business_name || "Unnamed business",
      detail: item?.business_type || item?.category || item?.slug || "Business profile",
    };
  }

  return {
    name: item?.name || item?.school_name || "Unnamed school",
    detail: item?.school_type || item?.code || "School profile",
  };
}

function makeColumns(resource) {
  if (resource === "shamba") {
    return [
      {
        key: "identity",
        label: "Farmer",
        render: (item) => {
          const identity = getIdentity(item, resource);

          return (
            <div className="min-w-[180px]">
              <p className="font-semibold text-slate-900 dark:text-white">
                {identity.name}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {identity.detail}
              </p>
            </div>
          );
        },
      },
      {
        key: "farm",
        label: "Farm",
        render: (item) => (
          <div>
            <p className="font-medium text-slate-700 dark:text-slate-200">
              {displayValue(item?.farm_name || item?.name)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Size: {displayValue(item?.farm_size)}
            </p>
          </div>
        ),
      },
      {
        key: "crops",
        label: "Primary crops",
        render: (item) => (
          <span className="text-slate-600 dark:text-slate-300">
            {displayValue(item?.primary_crops || item?.crops)}
          </span>
        ),
      },
      {
        key: "location",
        label: "Location",
        render: (item) => <LocationCell item={item} />,
      },
      {
        key: "status",
        label: "Status",
        render: (item) => <StatusPill value={readStatus(item, resource)} />,
      },
      {
        key: "created",
        label: "Created",
        render: (item) => (
          <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
            {formatDate(item?.created_at)}
          </span>
        ),
      },
    ];
  }

  if (resource === "businesses") {
    return [
      {
        key: "identity",
        label: "Business",
        render: (item) => {
          const identity = getIdentity(item, resource);

          return (
            <div className="min-w-[180px]">
              <p className="font-semibold text-slate-900 dark:text-white">
                {identity.name}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {identity.detail}
              </p>
            </div>
          );
        },
      },
      {
        key: "contact",
        label: "Contact",
        render: (item) => <ContactCell item={item} />,
      },
      {
        key: "location",
        label: "Location",
        render: (item) => <LocationCell item={item} />,
      },
      {
        key: "profile",
        label: "Profile",
        render: (item) => (
          <span className="text-xs text-slate-600 dark:text-slate-300">
            {item?.profile_complete === true
              ? "Complete"
              : item?.profile_complete === false
                ? "Incomplete"
                : "Not specified"}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (item) => <StatusPill value={readStatus(item, resource)} />,
      },
      {
        key: "created",
        label: "Created",
        render: (item) => (
          <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
            {formatDate(item?.created_at)}
          </span>
        ),
      },
    ];
  }

  return [
    {
      key: "identity",
      label: "School",
      render: (item) => {
        const identity = getIdentity(item, resource);

        return (
          <div className="min-w-[180px]">
            <p className="font-semibold text-slate-900 dark:text-white">
              {identity.name}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {identity.detail}
            </p>
            {item?.is_demo === true && (
              <span className="mt-1 inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800">
                Demo record
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "registration",
      label: "Registration",
      render: (item) => (
        <span className="text-slate-600 dark:text-slate-300">
          {displayValue(item?.registration_number)}
        </span>
      ),
    },
    {
      key: "contact",
      label: "Contact",
      render: (item) => <ContactCell item={item} />,
    },
    {
      key: "location",
      label: "Location",
      render: (item) => <LocationCell item={item} />,
    },
    {
      key: "status",
      label: "Verification",
      render: (item) => <StatusPill value={readStatus(item, resource)} />,
    },
    {
      key: "created",
      label: "Submitted",
      render: (item) => (
        <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
          {formatDate(item?.submitted_at || item?.created_at)}
        </span>
      ),
    },
  ];
}

function StatusPill({ value }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass(value)}`}
    >
      {humanizeStatus(value)}
    </span>
  );
}

function LocationCell({ item }) {
  return (
    <div className="flex min-w-[140px] items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
      <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
      <span>{locationOf(item)}</span>
    </div>
  );
}

function ContactCell({ item }) {
  const phone = item?.phone || item?.contact_phone;
  const email = item?.email || item?.contact_email;

  return (
    <div className="min-w-[150px] space-y-1.5">
      {phone ? (
        <a
          href={`tel:${String(phone).replace(/\s+/g, "")}`}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
        >
          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{phone}</span>
        </a>
      ) : null}
      {email ? (
        <a
          href={`mailto:${email}`}
          className="flex items-center gap-1.5 break-all text-xs text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
        >
          <Mail className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{email}</span>
        </a>
      ) : null}
      {!phone && !email ? (
        <span className="text-xs text-slate-400">No contact supplied</span>
      ) : null}
    </div>
  );
}

function explainError(error) {
  if (error?.status === 401) {
    return "Your admin session is not authenticated. Sign in again and retry.";
  }

  if (error?.status === 403) {
    return "Your account is signed in, but the backend has not authorized it as a platform administrator.";
  }

  if (error?.status === 404) {
    return "This endpoint was not found on the deployed backend. Confirm the admin routes were registered and deployed.";
  }

  return error?.message || "The records could not be loaded. Please retry.";
}

export default function AdminJumuiyaDirectory() {
  const adminApi = useAdminApi();

  const [resource, setResource] = useState("shamba");
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState("");
  const [refreshingOverview, setRefreshingOverview] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const activeResource = RESOURCES[resource];
  const ActiveIcon = activeResource.icon;
  const columns = useMemo(() => makeColumns(resource), [resource]);
  const statusOptions = FILTER_OPTIONS[resource] || [];

  const loadOverview = useCallback(async (signal) => {
    setRefreshingOverview(true);
    setOverviewError("");

    try {
      const response = await adminApi.request(
        "/api/jumuiya/admin/overview",
        { signal },
      );

      const payload = response?.data ?? response;

      setOverview(payload?.data ?? payload);
    } catch (loadError) {
      if (loadError?.name !== "AbortError") {
        setOverviewError(explainError(loadError));
      }
    } finally {
      if (!signal?.aborted) {
        setRefreshingOverview(false);
      }
    }
  }, [adminApi]);

  useEffect(() => {
    const controller = new AbortController();

    loadOverview(controller.signal);

    return () => controller.abort();
  }, [loadOverview]);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    async function loadRecords() {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: status === "all" ? undefined : status,
      };

      try {
        const response = await adminApi.request(
          activeResource.endpoint,
          {
            params,
            signal: controller.signal,
          },
        );

        const payload = response?.data ?? response;
        const data = Array.isArray(payload?.items)
          ? payload
          : Array.isArray(payload?.data?.items)
            ? payload.data
            : payload;

        const nextItems = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(payload)
            ? payload
            : [];

        const meta = response?.meta || payload?.meta || data?.meta || {};
        const nextTotal = Number(
          meta.total ?? data?.count ?? payload?.count ?? nextItems.length,
        );
        const validTotal = Number.isFinite(nextTotal)
          ? Math.max(0, nextTotal)
          : nextItems.length;
        const calculatedPages = Math.max(
          1,
          Math.ceil(validTotal / PAGE_SIZE),
        );
        const pageCount = Number(meta.total_pages) > 0
          ? Number(meta.total_pages)
          : calculatedPages;

        if (mounted) {
          setItems(nextItems);
          setTotal(validTotal);
          setTotalPages(pageCount);
          setLastUpdated(new Date());
        }
      } catch (loadError) {
        if (mounted && loadError?.name !== "AbortError") {
          setItems([]);
          setTotal(0);
          setTotalPages(1);
          setError(explainError(loadError));
        }
      } finally {
        if (mounted && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadRecords();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [adminApi, activeResource.endpoint, page, search, status, reloadKey]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleResourceChange = (nextResource) => {
    setResource(nextResource);
    setStatus("all");
    setPage(1);
    setSearchInput("");
    setSearch("");
  };

  const handleRefresh = () => {
    setError("");
    setOverviewError("");
    setLastUpdated(null);
    setReloadKey((current) => current + 1);
  };

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      {/* OVERVIEW COUNTS */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {OVERVIEW_CARDS.map((card) => {
          const Icon = card.icon;
          const value = overview?.[card.key];

          return (
            <div
              key={card.key}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    {formatCount(value)}
                  </p>
                </div>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {overviewError ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-semibold">Overview totals are unavailable</p>
            <p className="mt-1 text-xs leading-5">{overviewError}</p>
          </div>
        </div>
      ) : null}

      {/* DIRECTORY WORKSPACE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-4 py-5 dark:border-slate-800 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                <Database className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Jumuiya Directory
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Browse platform profiles using authenticated admin endpoints.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || refreshingOverview}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`h-4 w-4 ${loading || refreshingOverview ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* RESOURCE TABS */}
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {Object.entries(RESOURCES).map(([key, config]) => {
              const Icon = config.icon;
              const active = resource === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleResourceChange(key)}
                  aria-pressed={active}
                  className={`flex min-w-0 items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{config.label}</span>
                    <span className={`mt-0.5 block text-[11px] ${active ? "text-slate-300 dark:text-slate-500" : "text-slate-400"}`}>
                      {key === "shamba"
                        ? formatCount(overview?.shamba_profiles)
                        : key === "businesses"
                          ? formatCount(overview?.biashara_profiles)
                          : formatCount(overview?.real_schools)}{" "}
                      records
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end">
            <form
              onSubmit={handleSearchSubmit}
              className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row"
            >
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={
                    resource === "shamba"
                      ? "Search farmer, farm, phone, or location..."
                      : resource === "businesses"
                        ? "Search business, category, phone, or location..."
                        : "Search school, registration, contact, or location..."
                  }
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </form>

            <div className="flex min-w-0 items-center gap-2 lg:w-64">
              <label htmlFor="jumuiya-status-filter" className="flex-shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Status
              </label>
              <select
                id="jumuiya-status-filter"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="all">All statuses</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* TABLE HEADER */}
        <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <ActiveIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {activeResource.label}
            </p>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {formatCount(total)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            {lastUpdated ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </>
            ) : (
              "Waiting for live data"
            )}
          </div>
        </div>

        {/* ERROR STATE */}
        {error ? (
          <div className="m-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300 sm:m-6">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Could not load {activeResource.label.toLowerCase()}</p>
              <p className="mt-1 text-xs leading-5">{error}</p>
              <button
                type="button"
                onClick={() => setReloadKey((current) => current + 1)}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-300"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          </div>
        ) : null}

        {/* RECORD TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:px-5"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-16 text-center">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                    <p className="mt-3 text-sm font-medium text-slate-500">
                      Loading records from the backend…
                    </p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-slate-400">
                    Records could not be displayed until the request succeeds.
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-16 text-center">
                    <Users className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-700" />
                    <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      No records found
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
                      There are no records matching this search and status filter.
                      Try clearing the search or choosing another status.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr
                    key={recordId(item, index)}
                    className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-4 align-middle text-sm sm:px-5">
                        {column.render(item)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <CalendarDays className="h-4 w-4" />
            {total === 0
              ? "No records to display"
              : `Showing ${rangeStart}–${rangeEnd} of ${formatCount(total)} records`}
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Previous page"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next page"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}