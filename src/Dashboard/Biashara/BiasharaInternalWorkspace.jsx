import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileCheck2,
  Globe,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Trash2,
  Wrench,
  Save,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import BiasharaWebsiteBuilder from "@/Dashboard/Biashara/BiasharaWebsiteBuilder.jsx";
import BiasharaContractsWorkspace from "@/Dashboard/Biashara/BiasharaContractsWorkspace.jsx";

const ROUTES = [
  { key: "products", label: "Products", icon: Package },
  { key: "services", label: "Services", icon: Wrench },
  { key: "orders", label: "Orders", icon: ClipboardList },
  { key: "customers", label: "Customers", icon: Users },
  { key: "sales", label: "Sales", icon: CircleDollarSign },
  { key: "biashara-analytics", label: "Analytics", icon: BarChart3 },
  { key: "biashara-intelligence", label: "Intelligence", icon: Sparkles },
  { key: "business-profile", label: "Business profile", icon: FileCheck2 },
  { key: "website", label: "Website", icon: Globe },
  { key: "notifications", label: "Alerts", icon: Bell },
];

const TITLES = {
  products: ["Products and inventory", "Add, archive and review stock for products sold by your business."],
  services: ["Manage services", "Create and maintain the services this business offers, with business-specific pricing and availability."],
  orders: ["Order management", "Review customer orders and update order status."],
  customers: ["Customer records", "Keep customer contact details in one place."],
  sales: ["Record a sale", "Submit a sale to the Biashara backend and review recent sales."],
  "business-profile": ["Business profile", "Update the business identity used across your Biashara workspace."],
  website: ["Website and storefront", "Build, publish and manage your public Biashara website."],
  "biashara-analytics": ["Business analytics", "Review metrics returned by your business dashboard API."],
  "biashara-intelligence": ["Business intelligence", "Use your available business data to identify operational priorities."],
  notifications: ["Business alerts", "Actionable alerts derived from your currently loaded business data."],
  finance: ["Finance", "Invoices and payment allocation records."],
  automations: ["Automations", "Configure operational rules and review execution readiness."],
  sync: ["Sync Centre", "Track synchronization requests and processing status."],
  team: ["Team management", "Manage business membership and invitation records."],
  "business-switch": ["Business switching", "Choose an accessible business workspace."],
};

function valueOf(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function money(value, currency = "KES") {
  const amount = valueOf(value);
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: String(currency || "KES").toUpperCase(),
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || "KES"} ${amount.toLocaleString("en-KE")}`;
  }
}

function number(value) {
  return new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(valueOf(value));
}

function asArray(payload, keys = []) {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
    if (Array.isArray(payload?.result?.[key])) return payload.result[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function idOf(row) {
  return row?.id || row?._id || row?.product_id || row?.customer_id || row?.order_id || row?.sale_id || "";
}

function profileFields(business = {}) {
  return {
    name: business.name || business.business_name || "",
    business_type: business.business_type || "",
    category: business.category || "",
    industry_template: business.industry_template || "general",
    business_scale: business.business_scale || "small",
    workspace_mode: business.workspace_mode || "advanced",
    phone: business.phone || business.phone_number || "",
    email: business.email || business.email_address || "",
    county: business.county || "",
    location: business.location || business.address || "",
    description: business.description || "",
  };
}

function metricSet(dashboard) {
  return dashboard?.metrics || dashboard?.overview || dashboard?.summary || dashboard?.data?.metrics || dashboard?.business_metrics || {};
}

function Metric({ label, value, helper }) {
  return (
    <div className="rounded-[1.25rem] border border-white bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm ring-1 ring-slate-100">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false, placeholder = "" }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}{required ? " *" : ""}</span>
      <input
        type={type}
        value={value ?? ""}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />
    </label>
  );
}

function Notice({ tone = "blue", children }) {
  const styles = {
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-red-200 bg-red-50 text-red-800",
  };
  return <div className={`rounded-xl border px-3 py-2.5 text-sm ${styles[tone] || styles.blue}`}>{children}</div>;
}


function BiasharaForecastPanel({ business, currency = "KES" }) {
  const api = useJumuiyaApi();
  const [horizon, setHorizon] = useState(7);
  const [targetMargin, setTargetMargin] = useState(25);
  const [report, setReport] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(true);
  const [forecastError, setForecastError] = useState("");

  const loadForecast = useCallback(async () => {
    setLoadingForecast(true);
    setForecastError("");
    try {
      if (typeof api.getBiasharaBusinessForecast !== "function") {
        throw new Error("The business forecast API helper is missing. Update the RevelaCode frontend API client.");
      }
      const result = await api.getBiasharaBusinessForecast({
        forecastDays: horizon,
        targetMarginPercent: targetMargin,
      });
      setReport(result?.report || result?.data || result);
    } catch (error) {
      setForecastError(error?.message || "Business forecast could not be loaded.");
      setReport(null);
    } finally {
      setLoadingForecast(false);
    }
  }, [api, horizon, targetMargin]);

  useEffect(() => {
    loadForecast();
  }, [loadForecast]);

  const revenue = report?.revenue || {};
  const dailyForecast = Array.isArray(revenue.daily_forecast) ? revenue.daily_forecast : [];
  const productRows = Array.isArray(report?.products) ? report.products : [];
  const maximumRevenue = Math.max(1, ...dailyForecast.map((item) => Number(item?.value || 0)));
  const daysWithSales = Number(report?.sales_days_with_revenue || 0);
  const projectedRevenue = revenue.available ? money(revenue.projected_total, report?.currency || currency) : "Insufficient history";
  const confidenceLabel = revenue.available ? Math.round(Number(revenue.confidence || 0) * 100) + "%" : "—";

  return (
    <div className="space-y-5">
      <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 text-white shadow-lg sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-400/15 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-sky-300">Biashara Intelligence · Live business records</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Forecast sales. Review pricing. Plan stock.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Projections use sales already recorded for this business. Pricing guidance compares current selling prices with recorded costs and your selected gross-margin target.</p>
          </div>
          <div className="grid w-full grid-cols-2 gap-3 lg:w-auto lg:min-w-[330px]">
            <label className="block min-w-0">
              <span className="mb-1.5 block text-[11px] font-semibold text-slate-300">Forecast horizon</span>
              <select value={horizon} onChange={(event) => setHorizon(Number(event.target.value))} className="min-h-11 w-full rounded-xl border border-white/15 bg-slate-900/80 px-3 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-sky-400">
                <option value={7}>Next 7 days</option>
                <option value={14}>Next 14 days</option>
                <option value={30}>Next 30 days</option>
                <option value={60}>Next 60 days</option>
                <option value={90}>Next 90 days</option>
              </select>
            </label>
            <label className="block min-w-0">
              <span className="mb-1.5 block text-[11px] font-semibold text-slate-300">Target gross margin</span>
              <select value={targetMargin} onChange={(event) => setTargetMargin(Number(event.target.value))} className="min-h-11 w-full rounded-xl border border-white/15 bg-slate-900/80 px-3 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-sky-400">
                {[15, 20, 25, 30, 35, 40, 50].map((value) => <option key={value} value={value}>{value}% margin</option>)}
              </select>
            </label>
          </div>
        </div>
        <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Server-derived forecasts</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{business?.name || report?.business_name || "Current business"}</span>
          <button type="button" onClick={loadForecast} disabled={loadingForecast} className="ml-auto inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10 disabled:opacity-60"><RefreshCw size={14} className={loadingForecast ? "animate-spin" : ""} />Refresh forecast</button>
        </div>
      </section>

      {forecastError ? <Notice tone="red">{forecastError}</Notice> : null}
      {loadingForecast && !report ? (
        <div className="flex min-h-36 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500"><Loader2 size={18} className="animate-spin" />Calculating forecasts from your recorded business data…</div>
      ) : null}

      {report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Recorded sales · last 7 days" value={money(report.actual_last_7_days, report.currency || currency)} helper={Number(report.sales_record_count || 0) + " recorded sale entries in the 90-day window"} />
            <Metric label={"Projected sales · next " + horizon + " days"} value={projectedRevenue} helper={revenue.available ? "Model output, not guaranteed revenue" : (revenue.reason || "More recorded sales required")} />
            <Metric label="Forecast confidence" value={confidenceLabel} helper={revenue.available ? "Indicative model confidence based on history and variation" : "Shown only when enough sales history exists"} />
            <Metric label="Active products reviewed" value={number(productRows.length)} helper={productRows.filter((item) => item.low_stock).length + " at or below their stock threshold"} />
          </div>

          {revenue.available ? (
            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">Projected daily sales</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Forecast from {report.history_start} to {report.history_end}, using recorded sales across {report.history_days} calendar days.</p>
                </div>
                <span className="inline-flex w-fit rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold capitalize text-indigo-700">{String(revenue.direction || "stable").replaceAll("_", " ")}</span>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-7">
                {dailyForecast.map((point, index) => (
                  <div key={(point.date || "forecast") + ":" + index} className="flex min-w-0 flex-col items-center gap-2">
                    <div className="flex h-36 w-full items-end justify-center rounded-xl bg-slate-50 p-2">
                      <div className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-blue-700 to-sky-400 transition-all duration-500" style={{ height: Math.max(4, Number(point.value || 0) / maximumRevenue * 112) + "px" }} title={money(point.value, report.currency || currency)} />
                    </div>
                    <span className="text-center text-[10px] font-semibold text-slate-500">{point.date ? new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(point.date + "T00:00:00Z")) : "Day " + (index + 1)}</span>
                    <span className="max-w-full truncate text-center text-[10px] font-bold text-slate-800">{money(point.value, report.currency || currency)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">Historical days with recorded revenue: {daysWithSales}. Missing dates in the recorded timeline are treated as zero recorded sales; sales that were never entered into Biashara cannot be included.</p>
            </section>
          ) : (
            <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
              <h3 className="font-bold text-amber-950">A reliable revenue forecast is not ready yet</h3>
              <p className="mt-2 text-sm leading-6 text-amber-900">{revenue.reason || "Record sales on at least three different dates to generate the first projection."}</p>
              <p className="mt-2 text-xs leading-5 text-amber-800">No forecast number is invented when the recorded business history is too limited.</p>
            </section>
          )}

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">Price and stock intelligence</p>
                <h3 className="mt-1 text-xl font-black text-slate-950">Review current product pricing</h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Suggested prices are calculated from your current cost and a {targetMargin}% gross-margin target—not from a fictional future price trend.</p>
              </div>
              <span className="inline-flex w-fit rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">{productRows.length} active products</span>
            </div>

            {productRows.length ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {productRows.map((product) => (
                  <article key={product.id} className="min-w-0 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="break-words font-bold text-slate-950">{product.name || "Product"}</h4>
                        <p className="mt-1 truncate text-xs text-slate-500">{product.category || "Uncategorised"}</p>
                      </div>
                      {product.low_stock ? <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700">Low stock</span> : <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Stock OK</span>}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Current price</p><p className="mt-1 break-words text-sm font-black text-slate-950">{money(product.current_price, product.currency || currency)}</p></div>
                      <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Recorded cost</p><p className="mt-1 break-words text-sm font-black text-slate-950">{product.cost_price == null ? "Add cost data" : money(product.cost_price, product.currency || currency)}</p></div>
                      <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Gross margin</p><p className="mt-1 break-words text-sm font-black text-slate-950">{product.gross_margin_percent == null ? "—" : Number(product.gross_margin_percent).toFixed(1) + "%"}</p></div>
                      <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Target price</p><p className="mt-1 break-words text-sm font-black text-slate-950">{product.recommended_price == null ? "Need cost data" : money(product.recommended_price, product.currency || currency)}</p></div>
                    </div>
                    <div className="mt-3">
                      {product.pricing_status === "below_target_margin" ? <Notice tone="amber">Current price is below the selected {targetMargin}% gross-margin target, based on recorded cost.</Notice> : product.pricing_status === "target_met" ? <Notice tone="green">Current price meets the selected gross-margin target before other costs.</Notice> : <Notice tone="blue">{product.pricing_status === "cost_required" ? "Add a recorded cost price to review profitability." : "Add a valid selling price to review profitability."}</Notice>}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-3 text-xs">
                      <span className="text-slate-500">Stock on hand</span><strong className="text-slate-900">{number(product.stock_quantity)}</strong>
                    </div>
                    <div className="mt-3 rounded-xl bg-white p-3 ring-1 ring-slate-100">
                      <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-slate-800">Demand forecast</span><span className="text-[10px] font-semibold text-slate-500">{product.demand?.available ? Math.round(Number(product.demand.confidence || 0) * 100) + "% confidence" : "Needs history"}</span></div>
                      {product.demand?.available ? <p className="mt-1 text-xs leading-5 text-slate-600">Projected units over {horizon} days: <strong className="text-slate-900">{number(product.demand.projected_units)}</strong>. Trend: <strong className="capitalize text-slate-900">{String(product.demand.direction || "stable").replaceAll("_", " ")}</strong>.</p> : <p className="mt-1 text-xs leading-5 text-slate-500">{product.demand?.reason || "Record sales for this product on more than one day to generate a demand projection."}</p>}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center"><h4 className="font-bold text-slate-800">No active products to review</h4><p className="mt-1 text-sm text-slate-500">Add products to the Biashara catalogue to analyse pricing, margins and stock.</p></div>
            )}
          </section>
          <p className="text-[11px] leading-5 text-slate-500">{report.method_note}</p>
        </>
      ) : null}
    </div>
  );
}

export default function BiasharaInternalWorkspace({
  route,
  business,
  dashboard,
  onBack,
  onNavigate,
  onBusinessUpdated,
  onRefresh,
}) {
  const api = useJumuiyaApi();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(() => ({
    name: "",
    sku: "",
    category: "",
    price: "",
    stock_quantity: "0",
    phone: "",
    email: "",
    amount: "",
    payment_method: "cash",
    reference: "",
    description: "",
    service_type: "general",
    unit: "service",
    duration_minutes: "0",
  }));
  const [editingServiceId, setEditingServiceId] = useState("");
  const [profileForm, setProfileForm] = useState(() => profileFields(business));

  const currency = String(dashboard?.currency || metricSet(dashboard)?.currency || business?.currency || "KES").toUpperCase();
  const config = TITLES[route] || ["Biashara workspace", "Manage your business records."];
  const activeRoute = ROUTES.find((item) => item.key === route);
  const Icon = activeRoute?.icon || ClipboardList;

  useEffect(() => {
    setProfileForm(profileFields(business));
  }, [business]);

  useEffect(() => {
    setQuery("");
    setError("");
    setNotice("");
    setForm({
      name: "", sku: "", category: "", price: "", stock_quantity: "0",
      phone: "", email: "", amount: "", payment_method: "cash", reference: "",
      description: "", service_type: "general", unit: "service", duration_minutes: "0",
    });
  }, [route]);

  const reload = useCallback(async () => {
    setError("");

    if (route === "business-profile" || route === "website" || route === "biashara-analytics" || route === "biashara-intelligence" || route === "notifications") {
      setRows([]);
      setLoading(false);
      return;
    }

    if (route === "sales") {
      const recent = dashboard?.recent_sales ?? dashboard?.recentSales ?? dashboard?.sales_recent ?? dashboard?.data?.recent_sales;
      setRows(asArray(recent));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let response;
      if (route === "products") {
        if (typeof api.getBiasharaProducts !== "function") throw new Error("The products API helper is missing from useJumuiyaApi.");
        response = await api.getBiasharaProducts({ limit: 100, search: query });
        setRows(asArray(response, ["products", "items", "results"]));
      } else if (route === "services") {
        if (typeof api.getBiasharaServices !== "function") throw new Error("The services API helper is missing.");
        response = await api.getBiasharaServices({ limit: 100, search: query });
        setRows(asArray(response, ["services", "items", "results"]));
      } else if (route === "orders") {
        if (typeof api.getBiasharaOrders !== "function") throw new Error("The orders API helper is missing from useJumuiyaApi.");
        response = await api.getBiasharaOrders({ limit: 100 });
        setRows(asArray(response, ["orders", "items", "results"]));
      } else if (route === "customers") {
        if (typeof api.getBiasharaCustomers !== "function") throw new Error("The customers API helper is missing from useJumuiyaApi.");
        response = await api.getBiasharaCustomers({ limit: 100, search: query });
        setRows(asArray(response, ["customers", "items", "results"]));
      } else {
        setRows([]);
      }
    } catch (err) {
      setRows([]);
      setError(err?.message || err?.error || "Unable to load this business section.");
    } finally {
      setLoading(false);
    }
  }, [route, dashboard, api, query]);

  useEffect(() => {
    reload();
  }, [reload]);

  const updateField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const updateProfileField = (name, value) => setProfileForm((current) => ({ ...current, [name]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      let response;
      if (route === "products") {
        if (typeof api.createBiasharaProduct !== "function") throw new Error("The product creation API helper is missing.");
        response = await api.createBiasharaProduct({
          name: form.name.trim(),
          sku: form.sku.trim(),
          category: form.category.trim(),
          price: Number(form.price),
          stock_quantity: Number(form.stock_quantity || 0),
          currency,
          status: "active",
        });
        setForm((current) => ({ ...current, name: "", sku: "", category: "", price: "", stock_quantity: "0" }));
        setNotice("Product created successfully.");
      } else if (route === "services") {
        const servicePayload = {
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category.trim(),
          service_type: form.service_type,
          price: Number(form.price),
          currency,
          unit: form.unit.trim() || "service",
          duration_minutes: Number(form.duration_minutes || 0),
          status: "active",
        };
        if (editingServiceId) {
          if (typeof api.updateBiasharaService !== "function") throw new Error("The business service update API helper is missing.");
          response = await api.updateBiasharaService(editingServiceId, servicePayload);
        } else {
          if (typeof api.createBiasharaService !== "function") throw new Error("The business services API helper is missing.");
          response = await api.createBiasharaService(servicePayload);
        }
        setForm((current) => ({
          ...current,
          name: "",
          description: "",
          category: "",
          price: "",
          duration_minutes: "0",
          service_type: "general",
          unit: "service",
        }));
        setNotice(editingServiceId ? "Service updated successfully." : "Service created successfully.");
        setEditingServiceId("");
      } else if (route === "customers") {
        if (typeof api.createBiasharaCustomer !== "function") throw new Error("The customer creation API helper is missing.");
        response = await api.createBiasharaCustomer({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
        });
        setForm((current) => ({ ...current, name: "", phone: "", email: "" }));
        setNotice("Customer saved successfully.");
      } else if (route === "sales") {
        if (typeof api.recordBiasharaSale !== "function") throw new Error("The sales API helper is missing.");
        response = await api.recordBiasharaSale({
          amount: Number(form.amount),
          currency,
          payment_method: form.payment_method,
          reference: form.reference.trim(),
        });
        setForm((current) => ({ ...current, amount: "", reference: "" }));
        setNotice("Sale recorded successfully.");
      } else if (route === "business-profile") {
        if (typeof api.saveBusiness !== "function") throw new Error("The business profile save API helper is missing.");
        response = await api.saveBusiness({
          ...profileForm,
          name: profileForm.name.trim(),
          business_type: profileForm.business_type.trim(),
          category: profileForm.category.trim(),
          phone: profileForm.phone.trim(),
          email: profileForm.email.trim(),
          county: profileForm.county.trim(),
          location: profileForm.location.trim(),
          description: profileForm.description.trim(),
          currency,
        });
        const updated = response?.business || response?.data?.business || response?.result?.business || response?.data || response;
        if (updated && typeof updated === "object" && !Array.isArray(updated)) onBusinessUpdated?.(updated);
        setNotice("Business profile saved successfully.");
      } else {
        return;
      }

      if (route !== "business-profile") await reload();
      await onRefresh?.();
    } catch (err) {
      setError(err?.message || err?.error || "The operation failed. Please check the form and try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateOrder = async (order, status) => {
    const id = idOf(order);
    if (!id) {
      setError("This order has no ID, so its status cannot be updated.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (typeof api.updateBiasharaOrderStatus !== "function") throw new Error("The order status API helper is missing.");
      await api.updateBiasharaOrderStatus(id, status);
      setNotice(`Order status updated to ${status}.`);
      await reload();
      await onRefresh?.();
    } catch (err) {
      setError(err?.message || err?.error || "Unable to update order status.");
    } finally {
      setSaving(false);
    }
  };

  const addProductStock = async (product) => {
    const id = idOf(product);
    if (!id) { setError("This product has no valid ID."); return; }
    const raw = typeof window !== "undefined" ? window.prompt("How many units should be added to stock?", "1") : null;
    if (raw === null) return;
    const quantity = Number(raw);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Enter a stock quantity greater than zero.");
      return;
    }
    setSaving(true); setError(""); setNotice("");
    try {
      if (typeof api.adjustBiasharaInventory !== "function") throw new Error("The inventory adjustment API helper is unavailable.");
      await api.adjustBiasharaInventory(id, {
        movement_type: "add",
        quantity,
        reason: "Restock recorded from Biashara product catalogue",
      });
      setNotice("Stock updated. Remaining stock was recalculated.");
      await reload();
      await onRefresh?.();
    } catch (err) {
      setError(err?.message || "Unable to add stock to this product.");
    } finally { setSaving(false); }
  };

  const deleteProduct = async (product) => {
    const id = idOf(product);
    if (!id) { setError("This product has no valid ID."); return; }
    if (typeof window !== "undefined" && !window.confirm("Archive this product? Historical sales and orders will remain intact.")) return;
    setSaving(true); setError(""); setNotice("");
    try {
      if (typeof api.deleteBiasharaProduct !== "function") throw new Error("The product delete API helper is unavailable.");
      await api.deleteBiasharaProduct(id);
      setNotice("Product archived. Existing orders and sales are preserved.");
      await reload();
      await onRefresh?.();
    } catch (err) {
      setError(err?.message || "Unable to archive this product.");
    } finally { setSaving(false); }
  };

  const editService = (service) => {
    const id = idOf(service);
    if (!id) { setError("This service has no valid ID."); return; }
    setEditingServiceId(id);
    setForm((current) => ({
      ...current,
      name: String(service.name || ""),
      description: String(service.description || ""),
      category: String(service.category || ""),
      price: String(service.price ?? ""),
      service_type: String(service.service_type || "general"),
      unit: String(service.unit || "service"),
      duration_minutes: String(service.duration_minutes ?? "0"),
    }));
    setError("");
    setNotice("Editing " + (service.name || "service") + ". Save or cancel your changes above.");
  };

  const cancelServiceEdit = () => {
    setEditingServiceId("");
    setForm((current) => ({
      ...current,
      name: "",
      description: "",
      category: "",
      price: "",
      service_type: "general",
      unit: "service",
      duration_minutes: "0",
    }));
  };

  const deleteService = async (service) => {
    const id = idOf(service);
    if (!id) { setError("This service has no valid ID."); return; }
    if (typeof window !== "undefined" && !window.confirm("Archive this service from your business catalogue?")) return;
    setSaving(true); setError(""); setNotice("");
    try {
      if (typeof api.deleteBiasharaService !== "function") throw new Error("The services delete API helper is unavailable.");
      await api.deleteBiasharaService(id);
      setNotice("Service archived successfully.");
      await reload();
      await onRefresh?.();
    } catch (err) {
      setError(err?.message || "Unable to archive this service.");
    } finally { setSaving(false); }
  };

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || route === "products" || route === "customers") return rows;
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [rows, query, route]);

  const metrics = metricSet(dashboard);
  const totalSales = valueOf(metrics?.sales_total ?? metrics?.total_sales ?? metrics?.revenue ?? metrics?.total_revenue);
  const totalExpenses = valueOf(metrics?.expenses_total ?? metrics?.total_expenses ?? metrics?.expenses);
  const net = valueOf(metrics?.net_estimate ?? metrics?.net ?? metrics?.estimated_profit ?? totalSales - totalExpenses);
  const totalOrders = valueOf(metrics?.orders ?? metrics?.total_orders ?? metrics?.order_count);
  const pendingOrders = valueOf(metrics?.pending_orders ?? metrics?.pending ?? metrics?.active_orders);
  const customersCount = valueOf(metrics?.customers ?? metrics?.total_customers ?? metrics?.customer_count);
  const productsCount = valueOf(metrics?.products ?? metrics?.total_products ?? metrics?.product_count);
  const lowStock = asArray(dashboard?.low_stock_products ?? dashboard?.lowStockProducts ?? dashboard?.low_stock_items ?? dashboard?.data?.low_stock_products);
  const completeness = useMemo(() => {
    const fields = [
      business?.name || business?.business_name,
      business?.category,
      business?.business_type,
      business?.phone || business?.phone_number,
      business?.email || business?.email_address,
      business?.county,
      business?.location || business?.address,
      business?.description,
    ];
    const completed = fields.filter((item) => item !== undefined && item !== null && String(item).trim() !== "").length;
    return { completed, total: fields.length, percentage: Math.round((completed / fields.length) * 100) };
  }, [business]);

  const alertItems = useMemo(() => {
    const alerts = [];
    if (completeness.percentage < 100) alerts.push({ title: "Business profile incomplete", text: `${completeness.completed} of ${completeness.total} core fields are complete.`, tone: "amber" });
    if (pendingOrders > 0) alerts.push({ title: "Orders need attention", text: `${number(pendingOrders)} orders are currently pending or active.`, tone: "blue" });
    lowStock.forEach((product) => alerts.push({ title: `Low stock: ${product.name || product.product_name || "Product"}`, text: `${number(product.stock_quantity ?? product.quantity ?? product.stock ?? 0)} units remaining.`, tone: "red" }));
    const verification = String(business?.verification_status || business?.verification?.status || "").toLowerCase();
    if (verification === "pending" || verification === "under_review") alerts.push({ title: "Business verification pending", text: "Your business verification is still under review.", tone: "amber" });
    return alerts;
  }, [completeness, pendingOrders, lowStock, business]);

  if (["finance", "automations", "sync", "team", "business-switch"].includes(route)) {
    return <BiasharaContractsWorkspace route={route} business={business} onRefresh={onRefresh} />;
  }

  return (
    <div className="min-h-full bg-[#f4f7fb] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <section className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-5 text-white shadow-xl shadow-slate-900/10 sm:p-7">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-blue-100 ring-1 ring-white/15"><Icon size={23} /></div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">Biashara OS <span className="mx-1 text-slate-500">/</span> Management workspace</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">{config[0]}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{config[1]}</p>
                <p className="mt-3 inline-flex max-w-full items-center gap-2 truncate rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 ring-1 ring-white/10"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />{business?.name || business?.business_name || "Your business"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"><ArrowLeft size={16} /> Overview</button>
              <button type="button" onClick={reload} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button>
            </div>
          </div>

        </section>

        {notice ? <Notice tone="green">{notice}</Notice> : null}
        {error ? <Notice tone="red">{error}</Notice> : null}

        {route === "website" ? (
          <BiasharaWebsiteBuilder business={business} />
        ) : null}

        {route === "business-profile" ? (
          <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-white bg-white p-5 shadow-sm ring-1 ring-slate-100/80 sm:p-6">
            <div className="mb-5"><h2 className="text-lg font-bold text-slate-900">Business identity details</h2><p className="mt-1 text-sm text-slate-500">Fields marked with an asterisk are required by this form.</p></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Business name" required value={profileForm.name} onChange={(v) => updateProfileField("name", v)} />
              <Field label="Business type" value={profileForm.business_type} onChange={(v) => updateProfileField("business_type", v)} placeholder="Retail, service, manufacturing…" />
              <Field label="Category" value={profileForm.category} onChange={(v) => updateProfileField("category", v)} />
              <Field label="Phone" value={profileForm.phone} onChange={(v) => updateProfileField("phone", v)} />
              <Field label="Email" type="email" value={profileForm.email} onChange={(v) => updateProfileField("email", v)} />
              <Field label="County" value={profileForm.county} onChange={(v) => updateProfileField("county", v)} />
              <Field label="Town / location" value={profileForm.location} onChange={(v) => updateProfileField("location", v)} />
              <Field label="Description" value={profileForm.description} onChange={(v) => updateProfileField("description", v)} />
            </div>
            <button type="submit" disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"><Save size={16} />{saving ? "Saving…" : "Save business profile"}</button>
          </form>
        ) : null}

        {route === "products" ? (
          <>
            <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-white bg-white p-5 shadow-sm ring-1 ring-slate-100/80 sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">Add a product</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Field label="Product name" required value={form.name} onChange={(v) => updateField("name", v)} />
                <Field label="SKU" value={form.sku} onChange={(v) => updateField("sku", v)} />
                <Field label="Category" value={form.category} onChange={(v) => updateField("category", v)} />
                <Field label="Unit price" type="number" required value={form.price} onChange={(v) => updateField("price", v)} />
                <Field label="Opening stock" type="number" value={form.stock_quantity} onChange={(v) => updateField("stock_quantity", v)} />
              </div>
              <button type="submit" disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"><Package size={16} />{saving ? "Saving…" : "Create product"}</button>
            </form>
            <ListPanel title="Product catalogue" loading={loading} rows={filteredRows} empty="No products were returned for this business yet." onSearch={setQuery} query={query}>
              {(product) => <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{product.name || product.product_name || "Unnamed product"}</p><p className="mt-1 text-xs text-slate-500">{product.sku || "No SKU"}{product.category ? ` · ${product.category}` : ""}</p></div><div className="flex flex-wrap items-center gap-3 text-sm"><span className="font-bold text-slate-900">{money(product.price, product.currency || currency)}</span><span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (number(product.stock_quantity ?? product.quantity ?? product.stock) <= number(product.low_stock_threshold ?? 5) ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800")}>Remaining: {number(product.stock_quantity ?? product.quantity ?? product.stock)}</span><button type="button" disabled={saving} onClick={() => addProductStock(product)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50 active:scale-95 disabled:opacity-50"><Plus size={14} /> Add stock</button><button type="button" disabled={saving} onClick={() => deleteProduct(product)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50 active:scale-95 disabled:opacity-50"><Trash2 size={14} /> Delete</button></div></div>}
            </ListPanel>
          </>
        ) : null}

        {route === "services" ? (
          <>
            <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-white bg-white p-5 shadow-sm ring-1 ring-slate-100/80 sm:p-6">
              <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Wrench size={19} /></span><div><h2 className="text-lg font-bold text-slate-900">{editingServiceId ? "Edit business service" : "Add a business service"}</h2><p className="mt-1 text-sm text-slate-500">Services are stored against this business account and do not affect product stock.</p></div></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Service name" required value={form.name} onChange={(v) => updateField("name", v)} />
                <Field label="Category" value={form.category} onChange={(v) => updateField("category", v)} placeholder="Consulting, repair…" />
                <Field label="Price" type="number" required value={form.price} onChange={(v) => updateField("price", v)} />
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Service type</span><select value={form.service_type} onChange={(e) => updateField("service_type", e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"><option value="general">General</option><option value="appointment">Appointment</option><option value="delivery">Delivery</option><option value="repair">Repair</option><option value="consulting">Consulting</option><option value="subscription">Subscription</option></select></label>
                <Field label="Duration (minutes)" type="number" value={form.duration_minutes} onChange={(v) => updateField("duration_minutes", v)} />
                <Field label="Pricing unit" value={form.unit} onChange={(v) => updateField("unit", v)} placeholder="per visit, hour…" />
                <div className="sm:col-span-2"><Field label="Description" value={form.description} onChange={(v) => updateField("description", v)} placeholder="Describe the service and what is included" /></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2"><button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 active:scale-95 disabled:opacity-60"><Plus size={16} />{saving ? "Saving…" : editingServiceId ? "Save service" : "Add service"}</button>{editingServiceId ? <button type="button" disabled={saving} onClick={cancelServiceEdit} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:opacity-60">Cancel edit</button> : null}</div>
            </form>
            <ListPanel title="Services offered by this business" loading={loading} rows={filteredRows} empty="Add a service above to build this business's service catalogue." onSearch={setQuery} query={query}>
              {(service) => <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{service.name || "Unnamed service"}</p><p className="mt-1 text-xs text-slate-500">{service.category || service.service_type || "General service"}{service.duration_minutes ? " · " + number(service.duration_minutes) + " min" : ""}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{service.description || "No description supplied."}</p></div><div className="flex shrink-0 items-center gap-3"><span className="font-bold text-slate-900">{money(service.price, service.currency || currency)} <span className="text-xs font-normal text-slate-500">/ {service.unit || "service"}</span></span><button type="button" disabled={saving} onClick={() => editService(service)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"><Save size={14} /> Edit</button><button type="button" disabled={saving} onClick={() => deleteService(service)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50 active:scale-95 disabled:opacity-50"><Trash2 size={14} /> Delete</button></div></div>}
            </ListPanel>
          </>
        ) : null}

        {route === "customers" ? (
          <>
            <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-white bg-white p-5 shadow-sm ring-1 ring-slate-100/80 sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">Add a customer</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3"><Field label="Full name" required value={form.name} onChange={(v) => updateField("name", v)} /><Field label="Phone" value={form.phone} onChange={(v) => updateField("phone", v)} /><Field label="Email" type="email" value={form.email} onChange={(v) => updateField("email", v)} /></div>
              <button type="submit" disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"><Users size={16} />{saving ? "Saving…" : "Save customer"}</button>
            </form>
            <ListPanel title="Customer records" loading={loading} rows={filteredRows} empty="No customers were returned for this business yet." onSearch={setQuery} query={query}>
              {(customer) => <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{customer.name || customer.full_name || "Unnamed customer"}</p><p className="mt-1 text-xs text-slate-500">{customer.phone || "No phone"}</p></div><p className="truncate text-xs text-slate-500">{customer.email || "No email"}</p></div>}
            </ListPanel>
          </>
        ) : null}

        {route === "orders" ? (
          <ListPanel title="Customer orders" loading={loading} rows={filteredRows} empty="No orders have been returned by the backend yet." onSearch={setQuery} query={query}>
            {(order) => {
              const status = String(order.status || order.order_status || "pending").toLowerCase();
              const completed = ["completed", "complete", "delivered"].includes(status);
              const reference = order.order_number || order.reference || order.number || idOf(order) || "Order";
              const customer = order.customer_name || order.customer?.name || order.buyer_name || (typeof order.customer === "string" ? order.customer : "Customer");
              const nextStatus = status === "pending" ? "confirmed" : status === "confirmed" ? "processing" : status === "processing" ? "completed" : "";
              const nextLabel = status === "pending" ? "Confirm order" : status === "confirmed" ? "Start processing" : status === "processing" ? "Mark complete" : completed ? "Completed" : status === "cancelled" ? "Cancelled" : "Update unavailable";
              const canCancel = ["pending", "confirmed", "processing"].includes(status);
              const inventoryStatus = String(order.inventory_status || (order.source_channel ? "reserved" : "not_reserved")).replace(/[_-]+/g, " ");
              const lineItems = Array.isArray(order.items) ? order.items : [];
              return <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{reference}</p><p className="mt-1 truncate text-xs text-slate-500">{customer} · {money(order.total_amount ?? order.total ?? order.amount ?? order.grand_total, order.currency || currency)}</p><p className="mt-1 text-xs text-slate-500">Status: <span className="font-semibold capitalize">{status.replace(/[_-]+/g, " ")}</span> · Stock: <span className="font-semibold capitalize">{inventoryStatus}</span></p>{lineItems.length ? <div className="mt-2 flex flex-wrap gap-1.5">{lineItems.map((item, itemIndex) => <span key={item.product_id || itemIndex} className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] text-slate-600">{item.name || "Item"} × {number(item.quantity)}</span>)}</div> : null}</div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" disabled={saving || !nextStatus || !idOf(order)} onClick={() => updateOrder(order, nextStatus)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">{completed ? <CheckCircle2 size={15} /> : <ChevronRight size={15} />}{nextLabel}</button>{canCancel ? <button type="button" disabled={saving || !idOf(order)} onClick={() => updateOrder(order, "cancelled")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 active:scale-95 disabled:opacity-50"><Trash2 size={14} />Cancel & restock</button> : null}</div></div>;
            }}
          </ListPanel>
        ) : null}

        {route === "sales" ? (
          <>
            <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-white bg-white p-5 shadow-sm ring-1 ring-slate-100/80 sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">Sale details</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3"><Field label={`Amount (${currency})`} type="number" required value={form.amount} onChange={(v) => updateField("amount", v)} /><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Payment method</span><select value={form.payment_method} onChange={(e) => updateField("payment_method", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"><option value="cash">Cash</option><option value="mpesa">M-Pesa</option><option value="mobile_money">Mobile money</option><option value="bank">Bank</option><option value="card">Card</option><option value="other">Other</option></select></label><Field label="Reference (optional)" value={form.reference} onChange={(v) => updateField("reference", v)} /></div>
              <button type="submit" disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"><CircleDollarSign size={16} />{saving ? "Recording…" : "Record sale"}</button>
            </form>
            <ListPanel title="Recent sales" loading={loading} rows={filteredRows} empty="No recent sales are available in the loaded dashboard data." onSearch={setQuery} query={query}>
              {(sale) => <div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{sale.reference || sale.sale_number || sale.sale_id || "Sale"}</p><p className="mt-1 text-xs text-slate-500">{sale.created_at || sale.sold_at || sale.sale_date || "Date unavailable"}</p></div><p className="shrink-0 text-sm font-bold text-slate-900">{money(sale.amount ?? sale.total ?? sale.total_amount, sale.currency || currency)}</p></div>}
            </ListPanel>
          </>
        ) : null}

        {route === "biashara-analytics" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Total sales" value={money(totalSales, currency)} /><Metric label="Expenses" value={money(totalExpenses, currency)} /><Metric label="Net estimate" value={money(net, currency)} helper="Calculated from available sales and expense totals" /><Metric label="Orders" value={number(totalOrders)} helper={`${number(pendingOrders)} pending or active`} /><Metric label="Customers" value={number(customersCount)} /><Metric label="Products" value={number(productsCount)} /><Metric label="Low-stock items" value={number(lowStock.length)} /><Metric label="Profile completion" value={`${completeness.percentage}%`} helper={`${completeness.completed}/${completeness.total} profile fields`} /></div>
            <section className="rounded-[1.5rem] border border-white bg-white p-5 shadow-sm ring-1 ring-slate-100/80"><h2 className="font-bold text-slate-900">Data quality note</h2><p className="mt-2 text-sm leading-6 text-slate-500">These figures use the values currently returned by the Biashara dashboard endpoint. Missing backend metrics are displayed as zero; verify the API response before using these figures for financial reporting.</p></section>
          </>
        ) : null}

        {route === "biashara-intelligence" ? (
          <BiasharaForecastPanel business={business} currency={currency} />
        ) : null}

        {route === "notifications" ? (
          <section className="rounded-[1.5rem] border border-white bg-white p-5 shadow-sm ring-1 ring-slate-100/80 sm:p-6"><h2 className="text-lg font-bold text-slate-900">Current business alerts</h2><p className="mt-1 text-sm text-slate-500">This list is generated from current profile and dashboard fields; it is not a historical notification feed.</p><div className="mt-4 space-y-3">{alertItems.length ? alertItems.map((item, index) => <Notice key={`${item.title}-${index}`} tone={item.tone}><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs leading-5">{item.text}</p></Notice>) : <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center"><CheckCircle2 className="mx-auto text-emerald-600" size={25} /><p className="mt-2 text-sm font-semibold text-slate-800">No active alerts detected</p><p className="mt-1 text-xs text-slate-500">No alerts were found in the profile and dashboard data currently available.</p></div>}</div></section>
        ) : null}
      </div>
    </div>
  );
}

function ListPanel({ title, rows, loading, empty, children, onSearch, query }) {
  return (
    <section className="rounded-[1.5rem] border border-white bg-white p-5 shadow-sm ring-1 ring-slate-100/80 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold text-slate-900">{title}</h2><p className="mt-1 text-xs text-slate-500">{rows.length} record(s)</p></div><label className="relative block w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={query} onChange={(event) => onSearch(event.target.value)} placeholder="Search records…" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></label></div>
      {loading ? <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" />Loading records…</div> : rows.length ? <div className="mt-4 divide-y divide-slate-100">{rows.map((row, index) => <div key={idOf(row) || row.reference || row.name || `${title}-${index}`} className="py-4">{children(row)}</div>)}</div> : <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center"><p className="text-sm font-semibold text-slate-800">Nothing to show yet</p><p className="mt-1 text-xs text-slate-500">{empty}</p></div>}
    </section>
  );
}
