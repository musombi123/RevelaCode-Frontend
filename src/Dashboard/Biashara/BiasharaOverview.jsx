import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowRight, ArrowUpRight, Bell, BookOpen, Box, Building2,
  CalendarDays, CheckCircle2, ChevronRight, Clock3, Globe, Headphones,
  Package, RefreshCw, Search, Settings, ShieldCheck, ShoppingCart,
  Sparkles, Users, WalletCards, Zap,
} from "lucide-react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import { getBiasharaTemplate } from "./businessTemplateRegistry.js";
import { useTheme } from "@/components/hooks/useTheme.jsx";
import "./biashara-overview.css";

const ROUTE_META = {
  sales: { label: "Sales & Orders", detail: "Record and review sales", icon: ShoppingCart, tone: "blue" },
  orders: { label: "Orders", detail: "Manage order fulfilment", icon: ClipboardListIcon, tone: "blue" },
  products: { label: "Stock & Inventory", detail: "Products and stock levels", icon: Box, tone: "green" },
  finance: { label: "Finance", detail: "Invoices and allocations", icon: WalletCards, tone: "gold" },
  team: { label: "Team & HR", detail: "People and access", icon: Users, tone: "purple" },
  hr: { label: "Team & HR", detail: "Staff and attendance", icon: Users, tone: "purple" },
  website: { label: "Website", detail: "Manage your storefront", icon: Globe, tone: "blue" },
  automations: { label: "Automations", detail: "Workflow rule setup", icon: Zap, tone: "gold" },
  sync: { label: "Sync Centre", detail: "Review sync requests", icon: RefreshCw, tone: "green" },
  "biashara-analytics": { label: "Insights", detail: "Business performance", icon: Activity, tone: "purple" },
  "biashara-intelligence": { label: "Intelligence", detail: "Forecasts from recorded data", icon: Sparkles, tone: "purple" },
  factory: { label: "Production & Factory", detail: "Production and quality", icon: Package, tone: "green" },
  services: { label: "Services", detail: "Services and pricing", icon: Building2, tone: "gold" },
  customers: { label: "Customers", detail: "Customer records", icon: Users, tone: "blue" },
};

function unwrapRows(response, key) {
  if (Array.isArray(response)) return response;
  const value = response?.data?.data ?? response?.data ?? response?.result ?? response;
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.[key])) return value[key];
  if (Array.isArray(value?.items)) return value.items;
  return [];
}

function metricValue(source, keys) {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}

function money(value, currency) {
  if (value === null || value === undefined) return "—";
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: String(currency || "KES").toUpperCase(),
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return String(currency || "KES").toUpperCase() + " " + Number(value).toLocaleString("en-KE");
  }
}

function number(value) {
  return value === null || value === undefined ? "—" : new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(Number(value));
}

function relativeTime(value) {
  if (!value) return "Time unavailable";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Time unavailable";
  const delta = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return minutes + " min ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + " hr ago";
  const days = Math.floor(hours / 24);
  return days + " day" + (days === 1 ? "" : "s") + " ago";
}

function dateTime(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

function idOf(item) {
  return String(item?.id || item?._id || item?.order_id || item?.sale_id || item?.reference || "");
}

function activityRows(sales, orders) {
  const fromSales = sales.map((item, index) => ({
    id: "sale:" + (idOf(item) || index),
    title: "Sale recorded",
    detail: item.reference || item.sale_number || item.sale_id || "Recorded sale",
    value: item.amount ?? item.total ?? item.total_amount ?? null,
    time: item.created_at || item.createdAt || item.sold_at || item.sale_date,
    type: "sale",
  }));
  const fromOrders = orders.map((item, index) => ({
    id: "order:" + (idOf(item) || index),
    title: "Order " + String(item.status || "updated").replace(/_/g, " "),
    detail: item.order_number || item.reference || item.id || "Customer order",
    value: item.total_amount ?? item.total ?? null,
    time: item.created_at || item.createdAt || item.updated_at,
    type: "order",
  }));
  return [...fromSales, ...fromOrders]
    .filter((item) => item.time)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5);
}

// Avoid inventing a menu component for the route registry's order shortcut.
function ClipboardListIcon(props) {
  return <ShoppingCart {...props} />;
}

export default function BiasharaOverview({
  business,
  dashboard,
  currency = "KES",
  loadingDashboard = false,
  dashboardError = "",
  lastUpdated,
  onRefresh,
  onNavigate,
}) {
  const api = useJumuiyaApi();
  const { theme, setTheme } = useTheme();
  const businessId = String(business?.id || business?._id || "");
  const template = getBiasharaTemplate(business?.industry_template);
  const [search, setSearch] = useState("");
  const [automationRules, setAutomationRules] = useState([]);
  const [syncJobs, setSyncJobs] = useState([]);
  const [operationsLoading, setOperationsLoading] = useState(true);
  const [operationsErrors, setOperationsErrors] = useState({ automations: "", sync: "" });

  const loadOperationalStatus = useCallback(async () => {
    if (!businessId) return;
    setOperationsLoading(true);
    setOperationsErrors({ automations: "", sync: "" });
    const [automationResult, syncResult] = await Promise.allSettled([
      api.getBiasharaAutomationRules(businessId),
      api.getBiasharaSyncJobs(businessId),
    ]);
    if (automationResult.status === "fulfilled") {
      setAutomationRules(unwrapRows(automationResult.value, "rules"));
    } else {
      setAutomationRules([]);
      setOperationsErrors((old) => ({ ...old, automations: automationResult.reason?.message || "Automation rules are unavailable." }));
    }
    if (syncResult.status === "fulfilled") {
      setSyncJobs(unwrapRows(syncResult.value, "jobs"));
    } else {
      setSyncJobs([]);
      setOperationsErrors((old) => ({ ...old, sync: syncResult.reason?.message || "Sync history is unavailable." }));
    }
    setOperationsLoading(false);
  }, [api, businessId]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!businessId) return;
      setOperationsLoading(true);
      setOperationsErrors({ automations: "", sync: "" });
      const [automationResult, syncResult] = await Promise.allSettled([
        api.getBiasharaAutomationRules(businessId),
        api.getBiasharaSyncJobs(businessId),
      ]);
      if (!active) return;
      if (automationResult.status === "fulfilled") setAutomationRules(unwrapRows(automationResult.value, "rules"));
      else {
        setAutomationRules([]);
        setOperationsErrors((old) => ({ ...old, automations: automationResult.reason?.message || "Automation rules are unavailable." }));
      }
      if (syncResult.status === "fulfilled") setSyncJobs(unwrapRows(syncResult.value, "jobs"));
      else {
        setSyncJobs([]);
        setOperationsErrors((old) => ({ ...old, sync: syncResult.reason?.message || "Sync history is unavailable." }));
      }
      setOperationsLoading(false);
    };
    load();
    return () => { active = false; };
  }, [api, businessId]);

  const metrics = dashboard?.metrics || dashboard?.overview || dashboard?.summary || dashboard?.data?.metrics || dashboard?.business_metrics || {};
  const totalSales = metricValue(metrics, ["sales_total", "total_sales", "sales", "sales_amount"]);
  const totalRevenue = metricValue(metrics, ["revenue", "total_revenue", "revenue_total"]);
  const stockItems = metricValue(metrics, ["active_products", "active_product_count", "products", "total_products", "product_count"]);
  const teamMembers = metricValue(metrics, ["team_members", "team_member_count", "staff_count", "employees_count"]);
  const totalOrders = metricValue(metrics, ["orders", "total_orders", "order_count"]);
  const customers = metricValue(metrics, ["customers", "total_customers", "customer_count"]);
  const lowStock = metricValue(metrics, ["low_stock", "low_stock_count"]) ??
    (Array.isArray(dashboard?.low_stock_products) ? dashboard.low_stock_products.length : null);
  const recentSales = Array.isArray(dashboard?.recent_sales) ? dashboard.recent_sales :
    Array.isArray(dashboard?.recentSales) ? dashboard.recentSales : [];
  const recentOrders = Array.isArray(dashboard?.recent_orders) ? dashboard.recent_orders :
    Array.isArray(dashboard?.recentOrders) ? dashboard.recentOrders : [];
  const activity = useMemo(() => activityRows(recentSales, recentOrders), [recentSales, recentOrders]);

  const activeSync = syncJobs.find((job) => ["running", "queued"].includes(String(job.status || "").toLowerCase()));
  const latestSync = syncJobs[0] || null;
  const succeededSync = syncJobs.find((job) => String(job.status || "").toLowerCase() === "succeeded");
  const failedSyncCount = syncJobs.filter((job) => String(job.status || "").toLowerCase() === "failed").length;
  const configurationOnlyCount = automationRules.filter((rule) =>
    rule.execution_mode === "configuration_only" || rule.enabled !== true
  ).length;
  const enabledRuleCount = automationRules.filter((rule) => rule.enabled === true && rule.execution_mode !== "configuration_only").length;
  const businessName = business?.name || business?.business_name || "Your business";
  const businessVerified = String(business?.verification_status || "").toLowerCase() === "verified" &&
    String(business?.status || "").toLowerCase() === "active";

  const quickRoutes = template.routes.filter((route) => ROUTE_META[route]);
  const filteredRoutes = quickRoutes.filter((route) => {
    const meta = ROUTE_META[route];
    return (meta.label + " " + meta.detail).toLowerCase().includes(search.trim().toLowerCase());
  });
  const featuredRoutes = filteredRoutes.slice(0, 10);

  return (
    <div className="biashara-overview">
      <div className="biashara-overview-inner">
        <form className="biashara-overview-search" role="search" onSubmit={(event) => { event.preventDefault(); onNavigate?.("products"); }}>
          <Search size={19} aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sales, products, customers..." aria-label="Search business companions" />
          <button type="button" onClick={() => onNavigate?.("notifications")} aria-label="Business alerts"><Bell size={20} /><span className="biashara-alert-dot" /></button>
          <button type="button" className="biashara-theme-display" aria-label={theme === "dark" ? "Switch to light appearance" : "Switch to dark appearance"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}><span>☼</span><span>☀</span></button>
        </form>

        <section className="biashara-overview-hero">
          <div className="biashara-hero-copy">
            <span className="biashara-hero-eyebrow">BIASHARA OPERATING SYSTEM</span>
            <h1>Grow Your Business<br />with <span>RevelaCode</span></h1>
            <p>Sales. Stock. Finance. Sync. Automate.</p>
            <button type="button" onClick={() => onNavigate?.(quickRoutes.includes("sales") ? "sales" : "products")}>Explore Your Tools <ArrowRight size={17} /></button>
          </div>
          <div className="biashara-hero-visual" aria-hidden="true">
            <div className="biashara-hero-visual-glass"><Building2 size={52} /><span>MY BUSINESS</span></div>
            <div className="biashara-hero-visual-storefront"><i /><i /><i /><b /><b /></div>
            <div className="biashara-hero-growth"><ArrowUpRight size={31} /><span>Growth starts with clarity</span></div>
          </div>
        </section>

        {dashboardError ? <div role="alert" className="biashara-overview-error">{dashboardError}</div> : null}

        <section className="biashara-overview-metrics" aria-label="Business metrics">
          <article className="biashara-metric biashara-metric-blue"><ShoppingCart size={31} /><div><span>Total Sales</span><strong>{loadingDashboard ? "…" : money(totalSales, currency)}</strong><small>{totalSales === null ? "No sales metric returned" : "From recorded business data"}</small></div></article>
          <article className="biashara-metric biashara-metric-green"><Box size={31} /><div><span>Stock Items</span><strong>{loadingDashboard ? "…" : number(stockItems)}</strong><small>{stockItems === null ? "No stock metric returned" : "Items in the business catalogue"}</small></div></article>
          <article className="biashara-metric biashara-metric-purple"><WalletCards size={31} /><div><span>Total Revenue</span><strong>{loadingDashboard ? "…" : money(totalRevenue, currency)}</strong><small>{totalRevenue === null ? "No revenue metric returned" : "Revenue reported by the dashboard API"}</small></div></article>
          <article className="biashara-metric biashara-metric-gold"><Users size={31} /><div><span>Team Members</span><strong>{loadingDashboard ? "…" : number(teamMembers)}</strong><small>{teamMembers === null ? "Team count not supplied" : "People in this business"}</small></div></article>
        </section>

        <section className="biashara-overview-primary-grid">
          <article className="biashara-profile-card">
            <div className="biashara-profile-title"><div><span>BUSINESS OVERVIEW</span><h2>{businessName}</h2></div><span className={businessVerified ? "biashara-verified" : "biashara-pending"}>{businessVerified ? "Verified" : "Verification " + (business?.verification_status || "pending")}</span><button type="button" onClick={() => onNavigate?.("business-profile")}>View Details <ArrowRight size={14} /></button></div>
            <div className="biashara-profile-content">
              <div className="biashara-profile-avatar"><Building2 size={41} /></div>
              <div className="biashara-profile-details">
                <strong>{businessName}</strong>
                <span>{business?.category || business?.business_type || "Business profile"}{business?.location || business?.county ? " · " + [business?.location || business?.address, business?.county].filter(Boolean).join(", ") : ""}</span>
                {business?.branch_name ? <small>Branch: {business.branch_name}</small> : null}
                {business?.email || business?.email_address ? <small>Email: {business.email || business.email_address}</small> : null}
                {business?.phone || business?.phone_number ? <small>Phone: {business.phone || business.phone_number}</small> : null}
                <small>Template: {template.label}</small>
              </div>
              <div className="biashara-profile-meta"><span>Currency</span><strong>{String(currency || "KES").toUpperCase()}</strong><span>Last dashboard refresh</span><strong>{lastUpdated ? dateTime(lastUpdated) : "Not refreshed yet"}</strong></div>
            </div>
          </article>

          <article className="biashara-sync-card">
            <div className="biashara-card-title"><div><span>OPERATIONS</span><h2>Sync Centre</h2></div><RefreshCw size={22} /></div>
            {operationsLoading ? <div className="biashara-sync-status"><span className="biashara-sync-indicator pending" />Checking sync history…</div> : operationsErrors.sync ? <div className="biashara-sync-status failed"><span className="biashara-sync-indicator failed" />{operationsErrors.sync}</div> : activeSync ? <><div className="biashara-sync-status"><span className="biashara-sync-indicator pending" />{String(activeSync.status).toUpperCase()}</div><strong>{String(activeSync.source || "Business data").replace(/_/g, " ")} · {number(activeSync.progress || 0)}% reported</strong><small>{activeSync.message || "Request is waiting for the configured synchronization worker."}</small></> : succeededSync ? <><div className="biashara-sync-status success"><span className="biashara-sync-indicator success" />Last successful sync</div><strong>{relativeTime(succeededSync.finished_at || succeededSync.updated_at || succeededSync.created_at)}</strong><small>{failedSyncCount ? number(failedSyncCount) + " failed request(s) need review." : "Latest recorded sync job is complete."}</small></> : <><div className="biashara-sync-status"><span className="biashara-sync-indicator idle" />No completed sync recorded</div><strong>{latestSync ? String(latestSync.status || "queued").toUpperCase() : "Ready for a request"}</strong><small>{latestSync?.message || "Biashara sync requests are tracked, but a processing worker is not currently configured."}</small></>}
            <button type="button" onClick={() => { onNavigate?.("sync"); }} className="biashara-sync-action"><RefreshCw size={16} /> Open Sync Centre</button>
          </article>
        </section>

        <section className="biashara-overview-companions-grid">
          <article className="biashara-companions-card">
            <div className="biashara-card-title"><div><span>WORKSPACE COMPANIONS</span><h2>Your Business Companions</h2><p>Quick access to tools for {template.label.toLowerCase()}.</p></div><button type="button" onClick={() => onNavigate?.("business-profile")}>Configure <ArrowRight size={14} /></button></div>
            <div className="biashara-companion-grid">
              {featuredRoutes.map((route) => {
                const item = ROUTE_META[route];
                const Icon = item.icon;
                return <button type="button" key={route} className={"biashara-companion-item tone-" + item.tone} onClick={() => onNavigate?.(route)}><Icon size={23} /><strong>{item.label}</strong><small>{item.detail}</small></button>;
              })}
            </div>
          </article>

          <article className="biashara-automation-card">
            <div className="biashara-automation-orb"><Zap size={34} /></div>
            <span>BIASHARA AUTOMATIONS</span>
            <h2>Automate &amp; Grow</h2>
            <p>{operationsLoading ? "Checking your saved workflow rules…" : operationsErrors.automations ? operationsErrors.automations : enabledRuleCount ? number(enabledRuleCount) + " enabled rule(s) are recorded." : automationRules.length ? number(configurationOnlyCount) + " saved rule(s) are configuration only; execution is not active." : "Create workflow rules for supported business events. Execution requires a configured worker."}</p>
            <button type="button" onClick={() => onNavigate?.("automations")}>Open Automations <ArrowRight size={16} /></button>
          </article>
        </section>

        <section className="biashara-overview-lower-grid">
          <article className="biashara-activity-card">
            <div className="biashara-card-title"><div><span>BUSINESS ACTIVITY</span><h2>Recent Activity</h2></div><button type="button" onClick={() => onNavigate?.("orders")}>View All <ArrowRight size={14} /></button></div>
            {loadingDashboard ? <div className="biashara-activity-empty">Loading recorded business activity…</div> : activity.length ? <div className="biashara-activity-list">{activity.map((item) => <div className="biashara-activity-row" key={item.id}><span className={"biashara-activity-icon " + item.type}>{item.type === "sale" ? <ShoppingCart size={19} /> : <Box size={19} />}</span><div><strong>{item.title}</strong><small>{item.detail}</small></div><time>{relativeTime(item.time)}</time>{item.value !== null ? <b>{money(item.value, currency)}</b> : null}</div>)}</div> : <div className="biashara-activity-empty"><Activity size={24} /><strong>No recent sales or orders</strong><span>Activity appears here after business transactions are recorded.</span><button type="button" onClick={() => onNavigate?.("sales")}>Record a sale</button></div>}
          </article>
          <article className="biashara-quote-card"><span>“</span><blockquote>Success in business comes from good planning, efficient tools and consistent execution.</blockquote><cite>— RevelaCode</cite><div className="biashara-quote-wave" /></article>
        </section>
        <div className="biashara-overview-footer"><span>{loadingDashboard ? "Refreshing business data…" : lastUpdated ? "Dashboard refreshed " + relativeTime(lastUpdated) : "Business metrics are provided by your live dashboard API."}</span><button type="button" onClick={onRefresh} disabled={loadingDashboard}><RefreshCw size={15} /> Refresh data</button><button type="button" onClick={loadOperationalStatus} disabled={operationsLoading}><Zap size={15} /> Refresh operations</button></div>
      </div>
    </div>
  );
}
