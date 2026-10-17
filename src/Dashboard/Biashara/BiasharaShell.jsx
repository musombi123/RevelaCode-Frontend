import React, { useState } from "react";
import {
  DollarSign, Bell, Briefcase, ChevronDown, ClipboardList, Globe,
  LayoutDashboard, Lightbulb, Lock, Menu, MoreHorizontal, Package,
  RefreshCw, Settings, Sparkles, Store, Users, Zap, X,
} from "lucide-react";

const PRIMARY_NAV = [
  { key: "overview", label: "Overview", route: "overview", icon: LayoutDashboard, available: true },
  { key: "website", label: "Website", route: "website", icon: Globe, available: true },
  { key: "orders", label: "Orders", route: "orders", icon: ClipboardList, available: true },
  { key: "products", label: "Products and stock", route: "products", icon: Package, available: true },
  { key: "customers", label: "Customers", route: "customers", icon: Users, available: true },
  { key: "finance", label: "Finance", icon: DollarSign, available: false, reason: "A verified finance contract for invoicing, payment allocation and reconciliation is not available yet." },
  { key: "automations", label: "Automations", icon: Zap, available: false, reason: "A verified Biashara automation contract is not available yet." },
  { key: "sync", label: "Sync Centre", icon: RefreshCw, available: false, reason: "A verified Biashara synchronization contract is not available yet." },
  { key: "insights", label: "Insights", route: "biashara-analytics", icon: Lightbulb, available: true },
  { key: "team", label: "Team", icon: Users, available: false, reason: "Business memberships, invitations and permission roles are not exposed by the audited API." },
  { key: "settings", label: "Settings", route: "business-profile", icon: Settings, available: true },
];

const MORE_TOOLS = [
  { key: "sales", label: "Sales entry", route: "sales", icon: DollarSign },
  { key: "biashara-intelligence", label: "Operational signals", route: "biashara-intelligence", icon: Sparkles },
  { key: "notifications", label: "Alerts", route: "notifications", icon: Bell },
];

const MOBILE_NAV_KEYS = ["overview", "orders", "products", "website"];

function isActive(item, activeSection) {
  if (item.route === activeSection) return true;
  return item.key === "insights" && activeSection === "biashara-intelligence";
}

function NavigationItem({ item, activeSection, onNavigate, compact = false }) {
  const Icon = item.icon;
  const active = isActive(item, activeSection);
  const buttonClass = "group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 " +
    (active
      ? "bg-emerald-400/10 text-emerald-200 ring-1 ring-inset ring-emerald-300/20"
      : item.available
        ? "text-slate-300 hover:bg-white/5 hover:text-white"
        : "cursor-not-allowed text-slate-500");

  return (
    <div className="min-w-0">
      <button
        type="button"
        disabled={!item.available}
        onClick={() => item.available && item.route ? onNavigate(item.route) : undefined}
        aria-current={active ? "page" : undefined}
        aria-label={item.available ? item.label : item.label + ". Unavailable: " + item.reason}
        title={item.available ? item.label : item.reason}
        className={buttonClass}
      >
        <Icon aria-hidden="true" size={18} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {!item.available ? <Lock aria-hidden="true" size={15} className="shrink-0" /> : null}
      </button>
      {!item.available ? (
        <p className={"px-3 pb-2 pt-1 text-[11px] leading-4 text-slate-500 " + (compact ? "pl-10" : "")}>{item.reason}</p>
      ) : null}
    </div>
  );
}

export default function BiasharaShell({ business, activeSection = "overview", onNavigate, onRefresh, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const businessName = business?.name || business?.business_name || "Current business";
  const activeLabel = PRIMARY_NAV.find((item) => isActive(item, activeSection))?.label ||
    MORE_TOOLS.find((item) => item.route === activeSection)?.label || "Biashara";

  const navigateTo = (route) => {
    setMobileMenuOpen(false);
    if (route && typeof onNavigate === "function") onNavigate(route);
  };

  const visibleMobileItems = PRIMARY_NAV.filter((item) => MOBILE_NAV_KEYS.includes(item.key));
  const moreItems = PRIMARY_NAV.filter((item) => !MOBILE_NAV_KEYS.includes(item.key));

  return (
    <div className="min-h-screen bg-revela-dark text-slate-100 lg:flex">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-white/10 bg-revela-card lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-300/15">
              <Store aria-hidden="true" size={21} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight text-white">Biashara OS</p>
              <p className="mt-0.5 text-xs text-slate-400">Business workspace</p>
            </div>
          </div>
        </div>

        <div className="border-b border-white/10 px-4 py-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-slate-400">Current business</span>
            <span className="relative block">
              <Briefcase aria-hidden="true" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300" />
              <select
                aria-label="Current business"
                value="current"
                disabled
                className="min-h-11 w-full appearance-none rounded-xl border border-white/10 bg-revela-dark py-2.5 pl-9 pr-9 text-sm text-white opacity-100 disabled:cursor-not-allowed"
              >
                <option value="current">{businessName}</option>
              </select>
              <ChevronDown aria-hidden="true" size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </span>
          </label>
          <p className="mt-2 text-[11px] leading-4 text-slate-500">Business switching needs the membership API.</p>
        </div>

        <nav aria-label="Biashara primary navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-semibold text-slate-500">Workspace</p>
          {PRIMARY_NAV.map((item) => <NavigationItem key={item.key} item={item} activeSection={activeSection} onNavigate={navigateTo} />)}
          <div className="my-4 border-t border-white/10" />
          <p className="px-3 pb-2 text-[11px] font-semibold text-slate-500">More tools</p>
          {MORE_TOOLS.map((item) => <NavigationItem key={item.key} item={item} activeSection={activeSection} onNavigate={navigateTo} />)}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl border border-white/10 bg-revela-dark/70 p-3">
            <p className="text-xs font-semibold text-slate-200">Access and plans</p>
            <p className="mt-1 text-[11px] leading-4 text-slate-500">Role and plan access will appear when the backend returns verified membership and entitlement data.</p>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-white/10 bg-revela-dark/95 px-4 backdrop-blur lg:hidden">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
              <Store aria-hidden="true" size={19} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{activeLabel}</p>
              <p className="max-w-[58vw] truncate text-xs text-slate-400">{businessName}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={() => onRefresh?.()} aria-label="Refresh business data" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-300 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
              <RefreshCw aria-hidden="true" size={17} />
            </button>
            <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-expanded={mobileMenuOpen} aria-controls="biashara-mobile-more" aria-label={mobileMenuOpen ? "Close more navigation" : "Open more navigation"} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-300 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
              {mobileMenuOpen ? <X aria-hidden="true" size={18} /> : <Menu aria-hidden="true" size={18} />}
            </button>
          </div>
        </header>

        <main className="min-w-0 pb-24 lg:pb-0">
          {children}
        </main>
      </div>

      <nav aria-label="Biashara mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/10 bg-revela-card/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur lg:hidden">
        {visibleMobileItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item, activeSection);
          return (
            <button key={item.key} type="button" onClick={() => navigateTo(item.route)} aria-current={active ? "page" : undefined} className={"flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-300 " + (active ? "text-emerald-300" : "text-slate-400 hover:bg-white/5 hover:text-white")}>
              <Icon aria-hidden="true" size={19} />
              <span className="max-w-full truncate">{item.label === "Products and stock" ? "Products" : item.label}</span>
            </button>
          );
        })}
        <button type="button" onClick={() => { setMobileMenuOpen((open) => !open); }} aria-expanded={mobileMenuOpen} aria-label="More Biashara sections" className={"flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-300 " + (mobileMenuOpen ? "text-emerald-300" : "text-slate-400 hover:bg-white/5 hover:text-white")}>
          <MoreHorizontal aria-hidden="true" size={19} />
          <span>More</span>
        </button>
      </nav>

      {mobileMenuOpen ? (
        <div id="biashara-mobile-more" role="region" aria-label="More Biashara sections" className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 max-h-[72vh] overflow-y-auto rounded-2xl border border-white/10 bg-revela-card p-3 shadow-2xl lg:hidden">
          <div className="mb-2 flex items-center justify-between px-2">
            <h2 className="text-sm font-semibold text-white">More sections</h2>
            <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close more sections" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"><X aria-hidden="true" size={17} /></button>
          </div>
          <div className="space-y-1">
            {moreItems.map((item) => <NavigationItem key={item.key} item={item} activeSection={activeSection} onNavigate={navigateTo} compact />)}
          </div>
          <div className="my-3 border-t border-white/10" />
          <p className="px-3 pb-2 text-[11px] font-semibold text-slate-500">More tools</p>
          <div className="space-y-1">
            {MORE_TOOLS.map((item) => <NavigationItem key={item.key} item={item} activeSection={activeSection} onNavigate={navigateTo} compact />)}
          </div>
          <p className="px-3 pt-3 text-[11px] leading-4 text-slate-500">Unavailable sections are marked with a lock until their backend API is ready. No plan or role restriction is inferred here.</p>
        </div>
      ) : null}
    </div>
  );
}
