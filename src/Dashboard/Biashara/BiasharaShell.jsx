import React, { useState } from "react";
import "./biashara-overview.css";
import {
  ArrowLeftRight, BarChart3, Bell, Building2, ChevronDown, ClipboardList,
  Globe, Home, LayoutDashboard, Menu, MoreHorizontal, Package,
  RefreshCw, Settings, ShieldCheck, ShoppingCart, Store, Users, WalletCards,
  X, Zap,
} from "lucide-react";

import { getBiasharaTemplate } from "./businessTemplateRegistry.js";

const PRIMARY_NAV = [
  { key: "overview", label: "Overview", route: "overview", icon: LayoutDashboard },
  { key: "sales", label: "Sales & Orders", route: "sales", icon: ShoppingCart },
  { key: "products", label: "Stock & Inventory", route: "products", icon: Package },
  { key: "finance", label: "Finance", route: "finance", icon: WalletCards },
  { key: "team", label: "Team & HR", route: "team", icon: Users },
  { key: "website", label: "Website", route: "website", icon: Globe },
  { key: "automations", label: "Automations", route: "automations", icon: Zap },
  { key: "sync", label: "Sync Centre", route: "sync", icon: RefreshCw },
  { key: "insights", label: "Insights", route: "biashara-analytics", icon: BarChart3 },
  { key: "settings", label: "Settings", route: "business-profile", icon: Settings },
  { key: "alerts", label: "Alerts", route: "notifications", icon: Bell },
];

const SECONDARY_NAV = [
  { key: "orders", label: "Order management", route: "orders", icon: ClipboardList },
  { key: "customers", label: "Customers", route: "customers", icon: Users },
  { key: "services", label: "Services & quotations", route: "services", icon: Building2 },
  { key: "factory", label: "Production & Factory", route: "factory", icon: Package },
  { key: "hr", label: "Attendance & HR", route: "hr", icon: Users },
  { key: "integrations", label: "Integrations", route: "integrations", icon: Zap },
  { key: "intelligence", label: "Operational signals", route: "biashara-intelligence", icon: BarChart3 },
  { key: "business-switch", label: "Switch business", route: "business-switch", icon: ArrowLeftRight },
];

const MOBILE_NAV = [
  { key: "overview", label: "Home", route: "overview", icon: Home },
  { key: "sync", label: "Sync", route: "sync", icon: RefreshCw },
  { key: "insights", label: "Insights", route: "biashara-analytics", icon: BarChart3 },
  { key: "more", label: "More", route: null, icon: MoreHorizontal },
  { key: "settings", label: "Me", route: "business-profile", icon: Users },
];

function isActive(item, activeSection) {
  return item.route === activeSection ||
    (item.key === "insights" && activeSection === "biashara-intelligence");
}

function NavigationItem({ item, activeSection, onNavigate, compact = false }) {
  const Icon = item.icon;
  const active = isActive(item, activeSection);
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.route)}
      data-demo={"biashara-nav-" + item.key}
      aria-current={active ? "page" : undefined}
      title={item.label}
      className={"biashara-sidebar-link" + (active ? " is-active" : "") + (compact ? " is-compact" : "")}
    >
      <Icon size={18} aria-hidden="true" />
      <span>{item.label}</span>
    </button>
  );
}

export default function BiasharaShell({
  business,
  businesses = [],
  switchingBusiness = false,
  onSwitchBusiness,
  activeSection = "overview",
  onNavigate,
  onRefresh,
  children,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAndroidApp = import.meta.env.VITE_ANDROID_APP === "true";
  const businessId = String(business?.id || business?._id || "");
  const businessName = business?.name || business?.business_name || "Current business";
  const template = getBiasharaTemplate(business?.industry_template);
  const templateRoutes = new Set(template.routes);
  const isFactory = template.key === "factory";
  const isSchool = template.key === "school";
  const role = String(business?.access_role || business?.role || (business?.is_owner ? "owner" : "viewer")).toLowerCase().replace(/-/g, "_").replace(/ /g, "_");
  const adminRoles = ["owner", "ceo", "director", "admin", "operations_manager", "manager"];
  const canSeePeopleAdmin = adminRoles.includes(role) || role === "hr_manager";
  const mainNav = PRIMARY_NAV.filter((item) =>
    ["overview", "settings", "alerts"].includes(item.key) ||
    (templateRoutes.has(item.route) && (item.key !== "team" || canSeePeopleAdmin))
  );
  const secondaryNav = SECONDARY_NAV.filter((item) => {
    if (item.key === "business-switch") return businesses.length > 1;
    if (item.key === "factory") return isFactory && templateRoutes.has(item.route);
    if (item.key === "hr") return (isSchool || canSeePeopleAdmin) && templateRoutes.has(item.route);
    if (item.key === "integrations") return (adminRoles.includes(role) || role === "accountant") && templateRoutes.has(item.route);
    return templateRoutes.has(item.route);
  });
  const activeLabel = [...mainNav, ...secondaryNav].find((item) => isActive(item, activeSection))?.label || "Biashara";

  const navigateTo = (route) => {
    setMobileMenuOpen(false);
    if (route && typeof onNavigate === "function") onNavigate(route);
  };

  return (
    <div className="biashara-shell">
      <aside className="biashara-sidebar" aria-label="Biashara navigation">
        <div className="biashara-sidebar-brand">
          <img src="/Logo.png" alt="RevelaCode" />
          <div><strong>RevelaCode</strong><small>Code. Innovate. Transform.</small></div>
        </div>

        <div className="biashara-sidebar-hub">
          <Store size={22} />
          <span>Biashara Hub</span>
        </div>

        <div className="biashara-sidebar-business">
          <label htmlFor="biashara-business-select">CURRENT BUSINESS</label>
          <div className="biashara-business-select-wrap">
            <Building2 size={16} />
            <select
              id="biashara-business-select"
              value={businessId}
              disabled={switchingBusiness || businesses.length <= 1}
              onChange={(event) => onSwitchBusiness?.(event.target.value)}
              aria-label="Switch active business"
            >
              {(businesses.length ? businesses : [business]).filter(Boolean).map((item) => {
                const id = String(item.id || item._id || "");
                return <option key={id} value={id}>{item.name || item.business_name || "Business"}</option>;
              })}
            </select>
            {switchingBusiness ? <RefreshCw className="biashara-switch-spinner" size={15} /> : <ChevronDown size={15} />}
          </div>
          <small>{businesses.length > 1 ? "Switching reloads this business workspace." : "Your current business workspace."}</small>
        </div>

        <nav className="biashara-sidebar-nav" aria-label="Primary workspace">
          {mainNav.map((item) => <NavigationItem key={item.key} item={item} activeSection={activeSection} onNavigate={navigateTo} />)}
          <div className="biashara-sidebar-divider" />
          {secondaryNav.map((item) => <NavigationItem key={item.key} item={item} activeSection={activeSection} onNavigate={navigateTo} />)}
        </nav>
        <div className="biashara-sidebar-user">
          <span className="biashara-user-avatar">{String(businessName).slice(0, 1).toUpperCase()}</span>
          <div><strong>{businessName}</strong><small>{business?.access_role || (business?.is_owner ? "Owner" : "Business member")}</small></div>
          <ShieldCheck size={15} />
        </div>
      </aside>

      <div className="biashara-shell-main">
        <header className="biashara-mobile-header">
          <button type="button" className="biashara-mobile-menu-button" aria-label="Open navigation" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(true)}><Menu size={22} /></button>
          <div className="biashara-mobile-brand"><img src="/Logo.png" alt="" /><span><strong>RevelaCode</strong><small>{businessName}</small></span></div>
          <button type="button" className="biashara-mobile-action" onClick={() => navigateTo("notifications")} aria-label="Business alerts"><Bell size={20} /></button>
          <button type="button" className="biashara-mobile-action" onClick={() => onRefresh?.()} aria-label="Refresh business data"><RefreshCw size={18} /></button>
        </header>

        <div className="biashara-shell-workspace">
          {children}
        </div>

        <nav className="biashara-mobile-bottom-nav" aria-label="Business mobile navigation">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            const active = item.route ? isActive(item, activeSection) : mobileMenuOpen;
            return <button type="button" key={item.key} className={active ? "is-active" : ""} onClick={() => item.route ? navigateTo(item.route) : setMobileMenuOpen((value) => !value)} aria-current={active && item.route ? "page" : undefined}><Icon size={21} /><span>{item.label}</span></button>;
          })}
        </nav>
      </div>

      {mobileMenuOpen ? (
        <div className="biashara-mobile-drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMobileMenuOpen(false); }}>
          <section className="biashara-mobile-drawer" role="dialog" aria-modal="true" aria-label="More business tools">
            <div className="biashara-mobile-drawer-title"><div><strong>Business tools</strong><small>{businessName}</small></div><button type="button" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)}><X size={19} /></button></div>
            {[...mainNav, ...secondaryNav].filter((item) => !MOBILE_NAV.some((mobile) => mobile.route && mobile.route === item.route)).map((item) => <NavigationItem key={item.key} item={item} activeSection={activeSection} onNavigate={navigateTo} compact />)}
            <div className="biashara-drawer-business-switch">
              <label htmlFor="biashara-mobile-business-select">Current business</label>
              <select id="biashara-mobile-business-select" value={businessId} disabled={switchingBusiness || businesses.length <= 1} onChange={(event) => { setMobileMenuOpen(false); onSwitchBusiness?.(event.target.value); }}>
                {(businesses.length ? businesses : [business]).filter(Boolean).map((item) => <option key={String(item.id || item._id)} value={String(item.id || item._id)}>{item.name || item.business_name || "Business"}</option>)}
              </select>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
