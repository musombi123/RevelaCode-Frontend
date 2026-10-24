import React from "react";
import { Clock3, Mail, MapPin, Phone, ArrowUpRight } from "lucide-react";
import {
  formatBusinessLocation,
  normalizeOpeningHours,
  safeEmailHref,
  safeTelephoneHref,
  Reveal,
  SectionEyebrow,
} from "./utils.jsx";

export default function About({
  business = {},
  website = {},
  openingStatus,
  canContact = true,
  primary = "#1d4ed8",
  accent = "#0f766e",
}) {
  const hours = normalizeOpeningHours(business.opening_hours);
  const location = formatBusinessLocation(business);
  const phoneHref = safeTelephoneHref(business.phone);
  const emailHref = safeEmailHref(business.email);
  const aboutText = String(website.about || business.description || "").trim();
  const todayKey = openingStatus?.todayKey || "";
  const hasContactDetails = Boolean(canContact && (phoneHref || emailHref || location));

  return (
    <section id="about" className="scroll-mt-24 relative overflow-hidden bg-white py-16 sm:py-20 lg:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: accent + "0A" }} />
      <div className="mx-auto grid w-full max-w-[1240px] gap-12 px-4 sm:px-6 md:grid-cols-[minmax(0,1.1fr)_minmax(300px,.9fr)] md:items-start lg:gap-20 lg:px-8">
        <Reveal className="relative min-w-0">
          <SectionEyebrow primary={primary}>Our story</SectionEyebrow>
          <h2 className="mt-4 max-w-3xl break-words text-[2.2rem] font-semibold leading-[1.06] tracking-[-.05em] text-slate-950 sm:text-5xl lg:text-[3.65rem]">
            {website.about_heading || "A closer look at the business."}
          </h2>
          <div className="mt-7 flex items-start gap-4">
            <span className="mt-1 hidden h-20 w-1 shrink-0 rounded-full sm:block" style={{ background: "linear-gradient(180deg, " + primary + ", " + accent + ")" }} />
            <p className="whitespace-pre-line break-words text-base leading-8 text-slate-600 sm:text-lg sm:leading-9">
              {aboutText || "More details about this business have not been added yet. Explore the sections on this page or get in touch to ask about current offerings."}
            </p>
          </div>
          {business.category || business.business_type ? (
            <div className="mt-8 flex flex-wrap gap-2">
              {[business.category, business.business_type].filter((value, index, list) => value && list.indexOf(value) === index).map((value) => (
                <span key={value} className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600">{value}</span>
              ))}
            </div>
          ) : null}
          <div className="mt-10 h-px w-full bg-gradient-to-r from-slate-200 via-slate-100 to-transparent" />
          <p className="mt-4 text-xs leading-5 text-slate-400">Business information is provided by the business owner.</p>
        </Reveal>

        <Reveal className="relative min-w-0 md:pt-8" delay={110}>
          <div className="rounded-[1.75rem] border border-slate-200/90 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,.07)] sm:rounded-[2rem] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SectionEyebrow primary={primary}>Here to help</SectionEyebrow>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-.04em] text-slate-950 sm:text-3xl">Questions start here.</h3>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ color: primary, backgroundColor: primary + "10" }}>
                <ArrowUpRight size={20} />
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">Ask about current products, services, availability or the best way to work with this business.</p>

            {hasContactDetails ? (
              <div className="mt-6 flex flex-col gap-2.5">
                {phoneHref ? (
                  <a href={phoneHref} className="group flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2" style={{ "--tw-ring-color": primary }}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ color: primary, backgroundColor: primary + "10" }}><Phone size={16} /></span>
                    <span className="min-w-0 flex-1"><span className="block text-[10px] font-semibold uppercase tracking-[.13em] text-slate-400">Call the business</span><span className="mt-0.5 block break-all text-sm font-semibold text-slate-800">{business.phone}</span></span>
                    <ArrowUpRight size={15} className="shrink-0 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </a>
                ) : null}
                {emailHref ? (
                  <a href={emailHref} className="group flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2" style={{ "--tw-ring-color": primary }}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ color: primary, backgroundColor: primary + "10" }}><Mail size={16} /></span>
                    <span className="min-w-0 flex-1"><span className="block text-[10px] font-semibold uppercase tracking-[.13em] text-slate-400">Send an email</span><span className="mt-0.5 block break-all text-sm font-semibold text-slate-800">{business.email}</span></span>
                    <ArrowUpRight size={15} className="shrink-0 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </a>
                ) : null}
                {location ? (
                  <div className="flex min-w-0 items-start gap-3 rounded-xl bg-slate-50 px-3.5 py-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200"><MapPin size={16} /></span>
                    <span className="min-w-0"><span className="block text-[10px] font-semibold uppercase tracking-[.13em] text-slate-400">Location</span><span className="mt-0.5 block break-words text-sm font-semibold text-slate-700">{location}</span></span>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                Direct contact details have not been published for this business yet.
              </div>
            )}

            {hours.length ? (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800"><Clock3 size={16} style={{ color: primary }} /> Opening hours</h4>
                  <span className={"rounded-full px-2.5 py-1.5 text-[10px] font-bold " + (openingStatus?.isOpen === true ? "bg-emerald-50 text-emerald-700" : openingStatus?.isOpen === false ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600")}>
                    {openingStatus?.label || "Hours listed"}
                  </span>
                </div>
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-100">
                  {hours.map((entry) => {
                    const today = entry.key === todayKey;
                    return (
                      <div key={entry.key} className={"flex items-start justify-between gap-4 px-3.5 py-3 text-xs " + (today ? "font-semibold" : "font-medium") + (today ? " bg-slate-50" : " bg-white")} style={today ? { boxShadow: "inset 3px 0 0 " + primary } : undefined}>
                        <span className={"shrink-0 " + (today ? "text-slate-950" : "text-slate-500")}>{entry.day}{today ? <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide" style={{ color: primary }}>Today</span> : null}</span>
                        <span className={"text-right " + (entry.closed ? "text-slate-400" : "text-slate-700")}>{entry.hours}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="mt-6 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-400">Opening hours have not been published.</p>
            )}
            {canContact ? (
              <a href="#contact" className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transform-none" style={{ backgroundColor: primary }}>
                Send an inquiry <ArrowUpRight size={16} />
              </a>
            ) : null}
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-4 -right-4 -z-10 h-28 w-28 rounded-full blur-2xl" style={{ backgroundColor: accent + "18" }} />
        </Reveal>
      </div>
    </section>
  );
}
