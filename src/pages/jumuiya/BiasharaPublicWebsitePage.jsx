import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ArrowUpRight, ChevronLeft, ChevronRight, Globe, Loader2, Mail,
  MapPin, MessageCircle, Phone, Play, Sparkles,
} from "lucide-react";
import { API_ROOT, BASE_URL } from "@/services/jumuiyaApi.jsx";

const ROTATE_MS = 30000;

function safeHttpsMedia(value) {
  const raw = String(value || "");
  if (/^data:image\/(?:png|jpeg|webp);base64,/i.test(raw)) return raw;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
  } catch {
    return "";
  }
}

function isDirectVideo(value) {
  try {
    return /\.(?:mp4|webm|ogg)$/i.test(new URL(String(value || "")).pathname);
  } catch {
    return false;
  }
}

function videoEmbedUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:") return "";
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] || "";
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      id = url.searchParams.get("v") || url.pathname.match(/\/(?:embed|shorts)\/([^/]+)/)?.[1] || "";
    }
    if (id && /^[A-Za-z0-9_-]{6,20}$/.test(id)) {
      return "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?rel=0";
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const match = url.pathname.match(/\/(?:video\/)?(\d{5,})/);
      if (match) return "https://player.vimeo.com/video/" + match[1];
    }
    return "";
  } catch {
    return "";
  }
}

function formatPrice(value, currency) {
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: String(currency || "KES").toUpperCase(),
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  } catch {
    return String(currency || "KES") + " " + Number(value || 0).toLocaleString("en-KE");
  }
}

function VideoFrame({ url, title }) {
  const safeUrl = safeHttpsMedia(url);
  if (!safeUrl) return null;
  const embed = videoEmbedUrl(safeUrl);
  if (embed) {
    return (
      <iframe
        src={embed}
        title={title || "Business video"}
        loading="lazy"
        allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="h-full min-h-[220px] w-full rounded-2xl border-0 bg-slate-950 sm:min-h-[300px]"
      />
    );
  }
  if (isDirectVideo(safeUrl)) {
    return <video src={safeUrl} controls playsInline preload="metadata" className="h-full max-h-[440px] min-h-[220px] w-full rounded-2xl bg-slate-950 object-contain sm:min-h-[300px]" />;
  }
  return (
    <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl bg-slate-950 p-6 text-center text-white sm:min-h-[300px]">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15"><Play size={24} fill="currentColor" /></span>
      <span className="text-sm font-bold">Watch video</span>
      <span className="break-all text-xs text-white/70">Opens the business video in a new tab</span>
    </a>
  );
}

const SOCIAL_LABELS = {
  facebook: "Facebook",
  instagram: "Instagram",
  messenger: "Messenger",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X",
  linkedin: "LinkedIn",
  telegram: "Telegram",
  pinterest: "Pinterest",
  snapchat: "Snapchat",
  threads: "Threads",
  whatsapp_channel: "WhatsApp channel",
  reddit: "Reddit",
  discord: "Discord",
  twitch: "Twitch",
  bluesky: "Bluesky",
  mastodon: "Mastodon",
  github: "GitHub",
  medium: "Medium",
  wechat: "WeChat",
  vk: "VK",
  rumble: "Rumble",
  line: "LINE",
  signal: "Signal",
  website: "Website",
  other: "More links",
};

export default function BiasharaPublicWebsitePage() {
  const { businessSlug } = useParams();
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [productIndex, setProductIndex] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", website: "" });

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setSite(null);
    if (!BASE_URL) {
      setError("This website is not connected to the Biashara API yet.");
      setLoading(false);
      return () => controller.abort();
    }

    fetch(API_ROOT + "/biashara/public/" + encodeURIComponent(businessSlug || ""), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error?.message || payload?.message || "This business website is unavailable.");
        return payload?.data !== undefined ? payload.data : payload;
      })
      .then((payload) => {
        setSite(payload);
        setHeroIndex(0);
        setGalleryIndex(0);
        setProductIndex(0);
        const description = payload?.website?.seo_description || payload?.business?.description || "";
        document.title = payload?.website?.seo_title || payload?.business?.name || "Biashara business website";
        let meta = document.querySelector('meta[name="description"]');
        if (!meta) {
          meta = document.createElement("meta");
          meta.name = "description";
          document.head.appendChild(meta);
        }
        meta.content = description;
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setError(err?.message || "Unable to load this business website.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [businessSlug]);

  const business = site?.business || {};
  const website = site?.website || {};
  const products = Array.isArray(site?.products) ? site.products : [];
  const serviceItems = website.show_services === false || !Array.isArray(website.service_items)
    ? []
    : website.service_items.filter((item) => item && String(item.title || "").trim());
  const openingHoursEntries = Object.entries(business.opening_hours && typeof business.opening_hours === "object" ? business.opening_hours : {})
    .map(([day, value]) => ({
      day: day.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      hours: typeof value === "string" ? value.trim() : value && typeof value === "object"
        ? (value.closed === true ? "Closed" : [value.open, value.close].filter(Boolean).join(" – "))
        : String(value || ""),
    }))
    .filter((item) => item.hours);
  const primary = website.primary_color || "#1d4ed8";
  const accent = website.accent_color || "#0f766e";
  const logo = safeHttpsMedia(website.logo_url || business.logo_url);
  const currentHeroSlides = Array.isArray(website.hero_slides) && website.hero_slides.length
    ? website.hero_slides.filter((item) => item && (item.image_url || item.video_url))
    : ((website.cover_image_url || website.hero_image_url || website.hero_video_url)
      ? [{ image_url: website.cover_image_url || website.hero_image_url || "", video_url: website.hero_video_url || "", title: "", subtitle: "", alt: "" }]
      : []);
  const heroSlides = currentHeroSlides.length ? currentHeroSlides : [{ image_url: "", video_url: "", title: "", subtitle: "", alt: "" }];
  const heroSlide = heroSlides[((heroIndex % heroSlides.length) + heroSlides.length) % heroSlides.length] || heroSlides[0];
  const heroImage = safeHttpsMedia(heroSlide?.image_url || (heroIndex === 0 ? website.cover_image_url || website.hero_image_url : ""));
  const heroVideo = heroSlide?.video_url || (heroIndex === 0 ? website.hero_video_url : "");
  const whatsappDigits = String(website.whatsapp_number || "").replace(/\D/g, "");
  const canContact = website.contact_enabled !== false;
  const socialLinks = website.show_social_links === false ? [] : Object.entries(website.social_links || {})
    .filter(([key, value]) => SOCIAL_LABELS[key] && safeHttpsMedia(value))
    .map(([key, value]) => ({ key, label: SOCIAL_LABELS[key], url: safeHttpsMedia(value) }));
  const galleryItems = website.show_gallery === false || !Array.isArray(website.gallery_items)
    ? []
    : website.gallery_items.filter((item) => item && item.url && (item.type === "image" || item.type === "video"));
  const productCardsVisible = Math.min(3, products.length);
  const canRotateHero = heroSlides.length > 1;
  const canRotateGallery = galleryItems.length > 1;
  const canRotateProducts = products.length > 3;

  useEffect(() => {
    if (!canRotateHero) return undefined;
    const timer = window.setInterval(() => setHeroIndex((index) => (index + 1) % heroSlides.length), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [canRotateHero, heroSlides.length, businessSlug]);

  useEffect(() => {
    if (!canRotateGallery) return undefined;
    const timer = window.setInterval(() => setGalleryIndex((index) => (index + 1) % galleryItems.length), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [canRotateGallery, galleryItems.length, businessSlug]);

  useEffect(() => {
    if (!canRotateProducts) return undefined;
    const timer = window.setInterval(() => setProductIndex((index) => (index + 1) % products.length), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [canRotateProducts, products.length, businessSlug]);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submitInquiry = async (event) => {
    event.preventDefault();
    setSending(true);
    setNotice("");
    setError("");
    try {
      const response = await fetch(API_ROOT + "/biashara/public/" + encodeURIComponent(businessSlug || "") + "/inquiries", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message || payload?.message || "Unable to send your inquiry.");
      setNotice("Thank you. Your message has been sent to the business.");
      setForm({ name: "", email: "", phone: "", message: "", website: "" });
    } catch (err) {
      setError(err?.message || "Unable to send your inquiry.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-sm text-slate-500"><Loader2 className="mr-2 animate-spin" size={18} />Loading business website…</main>;
  }

  if (error && !site) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><Globe className="mx-auto text-slate-400" size={30} /><h1 className="mt-4 text-xl font-bold text-slate-900">Website unavailable</h1><p className="mt-2 text-sm leading-6 text-slate-600">{error}</p><a href="/" className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Go to RevelaCode</a></section></main>;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900" style={{ scrollBehavior: "smooth" }}>
      {website.announcement ? <div className="px-4 py-2.5 text-center text-xs font-bold tracking-wide text-white sm:text-sm" style={{ backgroundColor: accent }}>{website.announcement}</div> : null}

      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <a href={"/b/" + (business.slug || "")} className="flex min-w-0 max-w-full items-center justify-center gap-3 sm:justify-start">
            {logo
              ? <img src={logo} alt={(business.name || "Business") + " logo"} className="h-11 w-11 shrink-0 rounded-xl bg-white object-contain ring-1 ring-slate-200 sm:h-12 sm:w-12" />
              : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm sm:h-12 sm:w-12" style={{ backgroundColor: primary }}><Globe size={20} /></span>}
            <span className="min-w-0 text-center sm:text-left">
              <span className="block break-words text-base font-black tracking-tight text-slate-950 sm:text-lg">{business.name || "Local business"}</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500 sm:text-xs">{business.category || business.business_type || "Official business website"}</span>
            </span>
          </a>
          <nav aria-label="Website navigation" className="flex max-w-full flex-wrap items-center justify-center gap-1.5 sm:justify-end">
            {serviceItems.length ? <a href="#services" className="rounded-xl px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 sm:text-sm">Services</a> : null}
            {website.show_products !== false && products.length ? <a href="#products" className="rounded-xl px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 sm:text-sm">Products</a> : null}
            {galleryItems.length ? <a href="#gallery" className="rounded-xl px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 sm:text-sm">Gallery</a> : null}
            {socialLinks.length ? <a href="#socials" className="rounded-xl px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 sm:text-sm">Socials</a> : null}
            {canContact ? <a href="#contact" className="rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90 sm:text-sm" style={{ backgroundColor: primary }}>Contact us</a> : null}
          </nav>
        </div>
      </header>

      <section className="relative isolate overflow-hidden text-white" style={{ backgroundColor: primary }}>
        {heroImage ? <img key={heroImage} src={heroImage} alt={heroSlide?.alt || ""} className="absolute inset-0 -z-20 h-full w-full object-cover opacity-20 transition-opacity duration-700 motion-reduce:transition-none" /> : null}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950/65 via-slate-950/35 to-black/30" />
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-12 text-center sm:px-6 sm:py-16 md:py-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] lg:gap-12 lg:px-8 lg:text-left">
          <div className="mx-auto w-full max-w-3xl lg:mx-0">
            <p className="inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur sm:text-xs"><Sparkles size={14} />{business.category || "Welcome to our business"}</p>
            <h1 className="mt-5 break-words text-3xl font-black leading-[1.06] tracking-tight sm:text-5xl md:text-6xl lg:text-6xl">{heroSlide?.title || website.headline || business.name || "Welcome"}</h1>
            {(heroSlide?.subtitle || website.tagline) ? <p className="mx-auto mt-5 max-w-2xl break-words text-base leading-7 text-white/85 sm:text-lg sm:leading-8 lg:mx-0">{heroSlide?.subtitle || website.tagline}</p> : null}
            {business.location || business.county ? <p className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-white/80 sm:text-sm lg:justify-start"><MapPin size={15} />{[business.location, business.county].filter(Boolean).join(", ")}</p> : null}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:mt-8 lg:justify-start">
              {products.length && website.show_products !== false ? <a href="#products" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-slate-100 motion-reduce:transform-none">Explore products <ArrowUpRight size={16} /></a> : null}
              {canContact ? <a href="#contact" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/35 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">Talk to us</a> : null}
              {whatsappDigits ? <a href={"https://wa.me/" + whatsappDigits} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 motion-reduce:transform-none" style={{ backgroundColor: accent }}><MessageCircle size={17} />WhatsApp us</a> : null}
            </div>
            {canRotateHero ? (
              <div className="mt-8 flex items-center justify-center gap-3 lg:justify-start">
                <button type="button" aria-label="Previous hero slide" onClick={() => setHeroIndex((index) => (index - 1 + heroSlides.length) % heroSlides.length)} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 transition hover:bg-white/20"><ChevronLeft size={18} /></button>
                <div className="flex items-center gap-2" aria-label={"Slide " + (heroIndex + 1) + " of " + heroSlides.length}>
                  {heroSlides.map((_, index) => <button key={index} type="button" onClick={() => setHeroIndex(index)} aria-label={"Go to slide " + (index + 1)} aria-current={index === heroIndex ? "true" : undefined} className={"h-2.5 rounded-full transition-all " + (index === heroIndex ? "w-7 bg-white" : "w-2.5 bg-white/45 hover:bg-white/75")} />)}
                </div>
                <button type="button" aria-label="Next hero slide" onClick={() => setHeroIndex((index) => (index + 1) % heroSlides.length)} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 transition hover:bg-white/20"><ChevronRight size={18} /></button>
                <span className="ml-1 text-[10px] font-semibold text-white/65 sm:text-xs">Auto changes every 30 seconds</span>
              </div>
            ) : null}
          </div>
          <div className="mx-auto w-full max-w-xl lg:max-w-none">
            <div className="relative rounded-[1.8rem] border border-white/20 bg-white/10 p-2.5 shadow-2xl shadow-black/20 backdrop-blur-sm transition duration-500 hover:-translate-y-1 motion-reduce:transform-none">
              <div className="relative min-h-[230px] overflow-hidden rounded-[1.3rem] bg-slate-950 sm:min-h-[330px]">
                {heroVideo ? <VideoFrame url={heroVideo} title={(business.name || "Business") + " hero video"} /> : heroImage ? <img src={heroImage} alt={heroSlide?.alt || (business.name || "Business") + " featured image"} className="absolute inset-0 h-full w-full object-cover transition duration-700 motion-reduce:transition-none" /> : (
                  <div className="flex min-h-[230px] flex-col items-center justify-center p-8 text-center sm:min-h-[330px]">
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white"><Globe size={30} /></span>
                    <p className="mt-4 text-xl font-black">{business.name || "Your business"}</p>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-white/65">{website.tagline || "Quality, service and care for every customer."}</p>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 text-left">
                  <span className="truncate rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">{business.name || "Business showcase"}</span>
                  {canRotateHero ? <span className="shrink-0 rounded-full bg-white/90 px-2.5 py-1.5 text-[10px] font-bold text-slate-900">{heroIndex + 1}/{heroSlides.length}</span> : null}
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:gap-3">
              {[
                [products.length + "", "Products listed"],
                [galleryItems.length + "", "Media showcases"],
                [socialLinks.length + "", "Social links"],
              ].map(([value, label]) => <div key={label} className="rounded-2xl border border-white/10 bg-black/10 px-2 py-3 backdrop-blur-sm"><p className="text-lg font-black sm:text-xl">{value}</p><p className="mt-1 text-[9px] font-semibold text-white/65 sm:text-[10px]">{label}</p></div>)}
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="absolute -bottom-24 left-[-4rem] -z-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-10 text-center sm:px-6 sm:py-14 md:grid-cols-2 md:text-left lg:px-8">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg motion-reduce:transform-none sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: primary }}>Our story</p>
          <h2 className="mt-2 break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">A business built around you</h2>
          <p className="mt-4 whitespace-pre-line break-words text-sm leading-7 text-slate-600">{website.about || business.description || "We are glad you are here. Explore our catalogue and contact us for details about our products and services."}</p>
        </div>
        <div className="rounded-[1.75rem] border border-slate-200 p-5 shadow-sm sm:p-7" style={{ backgroundColor: primary + "0A" }}>
          <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: primary }}>Here to help</p>
          <h2 className="mt-2 break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Real people. Clear answers.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">Need a recommendation, availability or more information? Reach out directly using the contact option that suits you.</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            {business.phone && canContact ? <span className="inline-flex max-w-full items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"><Phone size={14} />{business.phone}</span> : null}
            {business.email && canContact ? <span className="inline-flex max-w-full items-center gap-2 break-all rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"><Mail size={14} />{business.email}</span> : null}
          </div>
          {openingHoursEntries.length ? <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-left"><h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-700">Opening hours</h3><div className="mt-3 space-y-2">{openingHoursEntries.map((item) => <div key={item.day} className="flex items-start justify-between gap-3 text-xs"><span className="font-semibold text-slate-600">{item.day}</span><span className="text-right text-slate-800">{item.hours}</span></div>)}</div></div> : null}
        </div>
      </section>

      {serviceItems.length ? (
        <section id="services" className="scroll-mt-28 border-y border-slate-100 bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: primary }}>What we do</p>
            <h2 className="mt-2 break-words text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Services made for your needs</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">Explore the services this business offers. Contact the team for availability, a tailored quote or booking details.</p>
            <div className="mt-8 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
              {serviceItems.map((service, index) => {
                const image = safeHttpsMedia(service.image_url);
                return (
                  <article key={(service.title || "service") + ":" + index} className="group flex min-w-0 flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-xl motion-reduce:transform-none">
                    {image ? <div className="h-44 overflow-hidden bg-slate-100"><img src={image} alt={service.title || "Service"} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none" /></div> : <div className="flex h-32 items-center justify-center" style={{ background: "linear-gradient(135deg, " + primary + "15, " + accent + "25)" }}><Sparkles size={28} style={{ color: primary }} /></div>}
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <h3 className="break-words text-lg font-extrabold leading-6 text-slate-950">{service.title}</h3>
                      {service.price_label ? <p className="mt-3 inline-flex w-fit max-w-full rounded-xl px-3 py-2 text-sm font-black" style={{ color: primary, backgroundColor: primary + "0A" }}>{service.price_label}</p> : null}
                      {service.description ? <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{service.description}</p> : <p className="mt-3 text-sm leading-6 text-slate-500">Contact us to discuss this service and your requirements.</p>}
                      <div className="mt-auto pt-5">{canContact ? <a href="#contact" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition hover:opacity-90" style={{ backgroundColor: primary }}>Ask about service <ArrowUpRight size={15} /></a> : <span className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-500">Contact options unavailable</span>}</div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {website.show_products !== false ? (
        <section id="products" className="scroll-mt-28 border-y border-slate-100 bg-slate-50/80">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: primary }}>The catalogue</p>
            <h2 className="mt-2 break-words text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Made for your everyday</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">See product details, current prices and availability from the business catalogue.</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-500"><span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">{products.length} listed product(s)</span>{canRotateProducts ? <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Cards slide every 30 seconds</span> : null}</div>
            {products.length ? (
              <>
                <div className="mt-8 grid gap-4 text-center sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
                  {Array.from({ length: productCardsVisible }, (_, offset) => {
                    const index = (productIndex + offset) % products.length;
                    const product = products[index];
                    const image = safeHttpsMedia(product.image_url);
                    return (
                      <article key={product.id} className="group flex min-w-0 flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white text-center shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-xl motion-reduce:transform-none">
                        <div className="relative flex h-56 items-center justify-center overflow-hidden bg-slate-100 sm:h-64">
                          {image ? <img src={image} alt={product.name || "Product"} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none" /> : <div className="flex h-full w-full items-center justify-center text-4xl font-black" style={{ color: primary }}>{String(product.name || "P").slice(0, 1).toUpperCase()}</div>}
                          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm">{product.available ? "Available" : "Out of stock"}</span>
                        </div>
                        <div className="flex flex-1 flex-col items-center p-5 sm:p-6">
                          {product.category ? <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{product.category}</p> : null}
                          <h3 className="mt-2 break-words text-lg font-extrabold leading-6 text-slate-950">{product.name || "Product"}</h3>
                          <p className="mt-3 w-full rounded-xl px-3 py-2.5 text-lg font-black" style={{ color: primary, backgroundColor: primary + "0A" }}>{formatPrice(product.price, product.currency || business.currency)}</p>
                          {product.description ? <p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-slate-600">{product.description}</p> : <p className="mt-3 text-sm leading-6 text-slate-500">Contact us for more details about this item.</p>}
                          <div className="mt-auto w-full pt-5">
                            {canContact ? <a href="#contact" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition hover:opacity-90" style={{ backgroundColor: primary }}>Ask about product <ArrowUpRight size={15} /></a> : <span className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-500">Contact options unavailable</span>}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
                {canRotateProducts ? (
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <button type="button" onClick={() => setProductIndex((index) => (index - 1 + products.length) % products.length)} aria-label="Previous products" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"><ChevronLeft size={17} /></button>
                    {products.map((product, index) => <button key={product.id} type="button" onClick={() => setProductIndex(index)} aria-label={"Show product set starting at " + product.name} aria-current={index === productIndex ? "true" : undefined} className={"h-2.5 rounded-full transition-all " + (index === productIndex ? "w-7" : "w-2.5")} style={{ backgroundColor: index === productIndex ? primary : "#cbd5e1" }} />)}
                    <button type="button" onClick={() => setProductIndex((index) => (index + 1) % products.length)} aria-label="Next products" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"><ChevronRight size={17} /></button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="mx-auto mt-8 max-w-xl rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><h3 className="font-bold text-slate-800">Catalogue coming soon</h3><p className="mt-2 text-sm leading-6 text-slate-500">The business has not published active products yet. Check back soon or use the contact option above.</p></div>
            )}
          </div>
        </section>
      ) : null}

      {galleryItems.length ? (
        <section id="gallery" className="scroll-mt-28 mx-auto w-full max-w-7xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: primary }}>Inside the business</p>
          <h2 className="mt-2 break-words text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">A closer look</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">Photos and videos from the team, products, services or the work behind the scenes.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: Math.min(3, galleryItems.length) }, (_, offset) => {
              const index = (galleryIndex + offset) % galleryItems.length;
              const item = galleryItems[index];
              const image = item.type === "image" ? safeHttpsMedia(item.url) : "";
              return (
                <article key={index + ":" + item.url} className="group min-w-0 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white text-center shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-xl motion-reduce:transform-none">
                  <div className="flex min-h-[230px] items-center justify-center overflow-hidden bg-slate-950 sm:min-h-[280px]">
                    {item.type === "video" ? <VideoFrame url={item.url} title={item.caption || (business.name || "Business") + " gallery video"} /> : image ? <img src={image} alt={item.alt || item.caption || "Business gallery"} loading="lazy" className="h-60 w-full object-cover transition duration-700 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none sm:h-72" /> : null}
                  </div>
                  {item.caption ? <div className="p-4"><p className="break-words text-sm font-bold text-slate-800">{item.caption}</p></div> : null}
                </article>
              );
            })}
          </div>
          {canRotateGallery ? <div className="mt-6 flex items-center justify-center gap-2"><button type="button" aria-label="Previous gallery items" onClick={() => setGalleryIndex((index) => (index - 1 + galleryItems.length) % galleryItems.length)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"><ChevronLeft size={17} /></button><span className="text-xs font-semibold text-slate-500">{galleryIndex + 1} / {galleryItems.length} · Auto changes every 30 seconds</span><button type="button" aria-label="Next gallery items" onClick={() => setGalleryIndex((index) => (index + 1) % galleryItems.length)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"><ChevronRight size={17} /></button></div> : null}
        </section>
      ) : null}

      {socialLinks.length ? (
        <section id="socials" className="scroll-mt-28 border-y border-slate-100 bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-10 text-center sm:px-6 sm:py-12 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: primary }}>Stay connected</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Find us around the web</h2>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              {socialLinks.map((item) => <a key={item.key} href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md motion-reduce:transform-none"><Globe size={14} style={{ color: primary }} />{item.label}<ArrowUpRight size={13} /></a>)}
            </div>
          </div>
        </section>
      ) : null}

      {canContact ? (
        <section id="contact" className="scroll-mt-28 border-t border-slate-200 bg-slate-50">
          <div className="mx-auto grid w-full max-w-7xl items-start gap-8 px-4 py-12 text-center sm:px-6 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:text-left">
            <div className="mx-auto w-full max-w-xl lg:mx-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: primary }}>Get in touch</p>
              <h2 className="mt-2 break-words text-3xl font-black tracking-tight sm:text-4xl">How can we help?</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">Send a message directly to the business. Please do not include passwords, payment card details or other sensitive information.</p>
              <div className="mt-6 flex flex-col items-center gap-3 text-sm text-slate-700 lg:items-start">
                {business.phone ? <p className="flex max-w-full items-center justify-center gap-2 break-all lg:justify-start"><Phone size={16} style={{ color: primary }} />{business.phone}</p> : null}
                {business.email ? <p className="flex max-w-full items-center justify-center gap-2 break-all lg:justify-start"><Mail size={16} style={{ color: primary }} />{business.email}</p> : null}
                {business.location || business.county ? <p className="flex max-w-full items-center justify-center gap-2 lg:justify-start"><MapPin size={16} style={{ color: primary }} />{[business.location, business.county].filter(Boolean).join(", ")}</p> : null}
              </div>
              {whatsappDigits ? <a href={"https://wa.me/" + whatsappDigits} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition hover:opacity-90" style={{ backgroundColor: accent }}><MessageCircle size={16} />Continue on WhatsApp</a> : null}
            </div>
            <div className="mx-auto w-full max-w-2xl rounded-[1.75rem] border border-slate-200 bg-white p-4 text-left shadow-sm sm:p-7">
              {notice ? <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p> : null}
              {error ? <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
              <form onSubmit={submitInquiry} className="space-y-4">
                <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"><label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => setField("website", event.target.value)} /></label></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Your name *</span><input required maxLength={80} value={form.name} onChange={(event) => setField("name", event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" /></label>
                  <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Email</span><input type="email" maxLength={254} value={form.email} onChange={(event) => setField("email", event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" /></label>
                </div>
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Phone (optional)</span><input type="tel" maxLength={32} value={form.phone} onChange={(event) => setField("phone", event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" /></label>
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Message *</span><textarea required rows={4} maxLength={2000} value={form.message} onChange={(event) => setField("message", event.target.value)} className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" /></label>
                <button type="submit" disabled={sending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60" style={{ backgroundColor: primary }}>{sending ? "Sending…" : "Send inquiry"}{sending ? <Loader2 className="animate-spin" size={16} /> : <ArrowUpRight size={16} />}</button>
                <p className="text-xs leading-5 text-slate-500">Messages are stored for the business owner in Biashara. Sending a message does not initiate a payment or order.</p>
              </form>
            </div>
          </div>
        </section>
      ) : null}

      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-8 text-center text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          {website.footer_message ? <p className="mb-3 break-words text-sm font-medium text-white/80">{website.footer_message}</p> : null}
          <p className="break-words text-xs leading-6 text-white/75">© {new Date().getFullYear()} {business.name || "Business"}. All rights reserved.</p>
          <p className="mt-1 text-[11px] leading-5 text-white/50">Built with RevelaCode Jumuiya · Business website and storefront</p>
        </div>
      </footer>
    </main>
  );
}
