import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Globe,
  Menu,
  MessageCircle,
  X,
} from "lucide-react";
import { contrastColor, formatBusinessLocation, readableBrandText } from "./utils.jsx";

export function AnnouncementBar({ announcement, primary, accent }) {
  const [dismissed, setDismissed] = useState(false);
  const text = String(announcement || "").trim();
  if (!text || dismissed) return null;

  const isLong = text.length > 100;
  return (
    <div
      role="region"
      aria-label="Business announcement"
      className="relative isolate overflow-hidden px-12 py-2.5 text-center text-xs font-semibold text-white sm:px-14 sm:text-sm"
      style={{ background: "linear-gradient(105deg, " + primary + ", " + accent + ")" }}
    >
      {isLong ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-40"
          style={{ background: "linear-gradient(110deg, transparent 25%, rgba(255,255,255,.3) 48%, transparent 70%)", animation: "biashara-announcement-shimmer 7s ease-in-out infinite" }}
        />
      ) : null}
      <p className="mx-auto max-w-5xl break-words leading-5">{text}</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-white/85 transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-4"
      >
        <X size={16} />
      </button>
      <style>{'@keyframes biashara-announcement-shimmer { 0%, 100% { transform: translateX(-55%); } 50% { transform: translateX(55%); } } @media (prefers-reduced-motion: reduce) { [style*="biashara-announcement-shimmer"] { animation: none !important; } }'}</style>
    </div>
  );
}

function StatusPill({ openingStatus }) {
  const label = openingStatus?.label || "Hours not listed";
  const isOpen = openingStatus?.isOpen;
  const classes = isOpen === true
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : isOpen === false
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : "border-slate-200 bg-slate-50 text-slate-600";
  return (
    <span className={"inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold sm:text-[11px] " + classes}>
      <span className={"h-1.5 w-1.5 rounded-full " + (isOpen === true ? "bg-emerald-500" : isOpen === false ? "bg-rose-500" : "bg-slate-400")} />
      {label}
    </span>
  );
}

export default function Header({
  business = {},
  website = {},
  logo = "",
  primary = "#1d4ed8",
  accent = "#0f766e",
  navItems = [],
  canContact = true,
  whatsappDigits = "",
  openingStatus,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const safeWhatsApp = /^\d{7,15}$/.test(whatsappDigits) ? "https://wa.me/" + whatsappDigits : "";
  const location = formatBusinessLocation(business);
  const businessPath = "/b/" + encodeURIComponent(String(business.slug || ""));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = navItems.map((item) => item.id).filter(Boolean);
    if (!ids.length || !("IntersectionObserver" in window)) return undefined;
    const nodes = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!nodes.length) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) setActiveSection(visible.target.id);
    }, { rootMargin: "-22% 0px -64% 0px", threshold: [0.05, 0.25, 0.5, 0.75] });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [navItems]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const closeMenu = () => setMobileOpen(false);
  const contactLink = canContact ? (
    <a
      href="#contact"
      onClick={closeMenu}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transform-none sm:text-sm"
      style={{ backgroundColor: primary, color: contrastColor(primary), boxShadow: "0 8px 24px " + primary + "28" }}
    >
      Contact us <ArrowUpRight size={15} />
    </a>
  ) : null;

  return (
    <header
      className={"sticky top-0 z-40 border-b transition duration-300 " + (scrolled
        ? "border-slate-200/80 bg-white/95 shadow-[0_10px_35px_rgba(15,23,42,.08)] backdrop-blur-xl"
        : "border-white/60 bg-white/85 backdrop-blur-lg")}
    >
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <a
          href={businessPath}
          className="group flex min-w-0 max-w-[72%] items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:max-w-[42%]"
          aria-label={(business.name || "Business") + " home"}
        >
          {logo ? (
            <img src={logo} alt="" loading="eager" decoding="async" className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain ring-1 ring-slate-200 sm:h-11 sm:w-11" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm sm:h-11 sm:w-11" style={{ backgroundColor: primary, color: contrastColor(primary) }}>
              <Globe size={19} />
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold tracking-tight text-slate-950 sm:text-base">{business.name || "Local business"}</span>
            <span className="mt-0.5 block truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-[10px]">
              {business.category || business.business_type || "Official website"}
            </span>
          </span>
        </a>

        <nav aria-label="Website navigation" className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={"#" + item.id}
              aria-current={activeSection === item.id ? "location" : undefined}
              className={"rounded-full px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " + (activeSection === item.id ? "text-slate-950" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}
              style={activeSection === item.id ? { backgroundColor: primary + "12", color: readableBrandText(primary) } : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <StatusPill openingStatus={openingStatus} />
          {safeWhatsApp ? (
            <a
              href={safeWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Message this business on WhatsApp"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transform-none"
              style={{ color: readableBrandText(accent) }}
            >
              <MessageCircle size={18} />
            </a>
          ) : null}
          {contactLink}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="biashara-mobile-navigation"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 lg:hidden"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div
        id="biashara-mobile-navigation"
        className={"overflow-hidden border-t border-slate-200/80 bg-white/98 transition-[max-height,opacity] duration-300 lg:hidden " + (mobileOpen ? "max-h-[80vh] opacity-100" : "max-h-0 border-t-transparent opacity-0")}
        aria-hidden={!mobileOpen}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <StatusPill openingStatus={openingStatus} />
            {location ? <span className="inline-flex min-w-0 items-center rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-medium text-slate-500">{location}</span> : null}
          </div>
          {navItems.map((item) => (
            <a
              key={item.id}
              href={"#" + item.id}
              tabIndex={mobileOpen ? 0 : -1}
              aria-current={activeSection === item.id ? "location" : undefined}
              onClick={closeMenu}
              className={"flex min-h-11 items-center justify-between rounded-xl px-3.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 " + (activeSection === item.id ? "bg-slate-50" : "text-slate-700 hover:bg-slate-50")}
              style={activeSection === item.id ? { color: readableBrandText(primary) } : undefined}
            >
              {item.label}
              <ArrowUpRight size={15} className="text-slate-400" />
            </a>
          ))}
          <div className="flex flex-wrap gap-2 pt-2">
            {canContact ? (
              <a href="#contact" tabIndex={mobileOpen ? 0 : -1} onClick={closeMenu} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ backgroundColor: primary, color: contrastColor(primary) }}>
                Contact us <ArrowUpRight size={16} />
              </a>
            ) : null}
            {safeWhatsApp ? (
              <a href={safeWhatsApp} target="_blank" rel="noopener noreferrer" tabIndex={mobileOpen ? 0 : -1} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2" style={{ color: readableBrandText(accent), borderColor: accent + "44", backgroundColor: accent + "0A" }}>
                <MessageCircle size={16} /> WhatsApp
              </a>
            ) : null}
          </div>
          {website.tagline ? <p className="mt-1 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">{website.tagline}</p> : null}
        </div>
      </div>
      <div className="sr-only" aria-live="polite">{activeSection ? "Viewing " + (navItems.find((item) => item.id === activeSection)?.label || activeSection) : ""}</div>
    </header>
  );
}
