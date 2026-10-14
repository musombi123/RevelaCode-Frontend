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
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import BiasharaWebsiteBuilder from "@/Dashboard/Biashara/BiasharaWebsiteBuilder.jsx";

const ROUTES = [
  { key: "products", label: "Products", icon: Package },
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
  products: ["Products and inventory", "Create products and review stock recorded for your business."],
  orders: ["Order management", "Review customer orders and update order status."],
  customers: ["Customer records", "Keep customer contact details in one place."],
  sales: ["Record a sale", "Submit a sale to the Biashara backend and review recent sales."],
  "business-profile": ["Business profile", "Update the business identity used across your Biashara workspace."],
  website: ["Website and storefront", "Build, publish and manage your public Biashara website."],
  "biashara-analytics": ["Business analytics", "Review metrics returned by your business dashboard API."],
  "biashara-intelligence": ["Business intelligence", "Use your available business data to identify operational priorities."],
  notifications: ["Business alerts", "Actionable alerts derived from your currently loaded business data."],
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
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
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
  }));
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

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Icon size={23} /></div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">Biashara Hub</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{config[0]}</h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{config[1]}</p>
                <p className="mt-2 truncate text-xs text-slate-400">{business?.name || business?.business_name || "Your business"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft size={16} /> Overview</button>
              <button type="button" onClick={reload} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button>
            </div>
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {ROUTES.map((item) => {
              const TabIcon = item.icon;
              return <button key={item.key} type="button" onClick={() => onNavigate?.(item.key)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${route === item.key ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}><TabIcon size={15} />{item.label}</button>;
            })}
          </div>
        </section>

        {notice ? <Notice tone="green">{notice}</Notice> : null}
        {error ? <Notice tone="red">{error}</Notice> : null}

        {route === "website" ? (
          <BiasharaWebsiteBuilder business={business} />
        ) : null}

        {route === "business-profile" ? (
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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
            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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
              {(product) => <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{product.name || product.product_name || "Unnamed product"}</p><p className="mt-1 text-xs text-slate-500">{product.sku || "No SKU"}{product.category ? ` · ${product.category}` : ""}</p></div><div className="flex shrink-0 items-center gap-4 text-sm"><span className="font-bold text-slate-900">{money(product.price, product.currency || currency)}</span><span className="text-slate-500">Stock: {number(product.stock_quantity ?? product.quantity ?? product.stock)}</span></div></div>}
            </ListPanel>
          </>
        ) : null}

        {route === "customers" ? (
          <>
            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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
              return <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{reference}</p><p className="mt-1 truncate text-xs text-slate-500">{customer} · {money(order.total_amount ?? order.total ?? order.amount ?? order.grand_total, order.currency || currency)}</p><p className="mt-1 text-xs text-slate-500">Status: <span className="font-semibold capitalize">{status.replace(/[_-]+/g, " ")}</span></p></div><button type="button" disabled={saving || completed || !idOf(order)} onClick={() => updateOrder(order, "completed")} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><CheckCircle2 size={15} />{completed ? "Completed" : "Mark complete"}</button></div>;
            }}
          </ListPanel>
        ) : null}

        {route === "sales" ? (
          <>
            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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
            <section className="rounded-3xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-slate-900">Data quality note</h2><p className="mt-2 text-sm leading-6 text-slate-500">These figures use the values currently returned by the Biashara dashboard endpoint. Missing backend metrics are displayed as zero; verify the API response before using these figures for financial reporting.</p></section>
          </>
        ) : null}

        {route === "biashara-intelligence" ? (
          <>
            <section className="rounded-3xl bg-slate-900 p-5 text-white sm:p-6"><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-300"><Sparkles size={22} /></div><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-300">RevelaAI · Biashara</p><h2 className="mt-1 text-xl font-bold">Operational signals from your business data</h2><p className="mt-2 text-sm leading-6 text-slate-300">This panel reports only signals that can be derived from the currently loaded business profile and dashboard response.</p></div></div></section>
            <div className="grid gap-3 sm:grid-cols-2"><Metric label="Sales returned by API" value={money(totalSales, currency)} /><Metric label="Orders requiring review" value={number(pendingOrders)} /><Metric label="Low-stock product records" value={number(lowStock.length)} /><Metric label="Business profile completeness" value={`${completeness.percentage}%`} /></div>
            <section className="rounded-3xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-slate-900">Recommended next steps</h2><div className="mt-3 space-y-3">{lowStock.length ? <Notice tone="amber">Review {lowStock.length} low-stock product record(s) and replenish stock where appropriate.</Notice> : <Notice tone="green">No low-stock product records were returned in the current dashboard response.</Notice>}{pendingOrders ? <Notice tone="blue">Review {number(pendingOrders)} pending or active order(s).</Notice> : null}{completeness.percentage < 100 ? <Notice tone="amber">Complete the business profile to improve identity consistency.</Notice> : null}</div><button type="button" onClick={() => onNavigate?.("ai")} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"><Sparkles size={16} />Open RevelaAI assistant<ChevronRight size={16} /></button></section>
          </>
        ) : null}

        {route === "notifications" ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-slate-900">Current business alerts</h2><p className="mt-1 text-sm text-slate-500">This list is generated from current profile and dashboard fields; it is not a historical notification feed.</p><div className="mt-4 space-y-3">{alertItems.length ? alertItems.map((item, index) => <Notice key={`${item.title}-${index}`} tone={item.tone}><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs leading-5">{item.text}</p></Notice>) : <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center"><CheckCircle2 className="mx-auto text-emerald-600" size={25} /><p className="mt-2 text-sm font-semibold text-slate-800">No active alerts detected</p><p className="mt-1 text-xs text-slate-500">No alerts were found in the profile and dashboard data currently available.</p></div>}</div></section>
        ) : null}
      </div>
    </div>
  );
}

function ListPanel({ title, rows, loading, empty, children, onSearch, query }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold text-slate-900">{title}</h2><p className="mt-1 text-xs text-slate-500">{rows.length} record(s)</p></div><label className="relative block w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={query} onChange={(event) => onSearch(event.target.value)} placeholder="Search records…" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></label></div>
      {loading ? <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" />Loading records…</div> : rows.length ? <div className="mt-4 divide-y divide-slate-100">{rows.map((row, index) => <div key={idOf(row) || row.reference || row.name || `${title}-${index}`} className="py-4">{children(row)}</div>)}</div> : <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center"><p className="text-sm font-semibold text-slate-800">Nothing to show yet</p><p className="mt-1 text-xs text-slate-500">{empty}</p></div>}
    </section>
  );
}
