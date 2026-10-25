import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Globe,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import { API_ROOT, BASE_URL } from "@/services/jumuiyaApi.jsx";
import About from "./BiasharaSite/About.jsx";
import Header, { AnnouncementBar } from "./BiasharaSite/Header.jsx";
import Hero from "./BiasharaSite/Hero.jsx";
import TrustStrip from "./BiasharaSite/TrustStrip.jsx";
import {
  createBrandTheme,
  formatPrice,
  getOpeningStatus,
  HERO_ROTATE_MS,
  safeEmailHref,
  safeHttpsMedia,
  safeTelephoneHref,
  videoEmbedUrl,
  isDirectVideo,
  contrastColor,
  readableBrandText,
} from "./BiasharaSite/utils.jsx";

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

function PublicMedia({ item, businessName }) {
  const safeUrl = safeHttpsMedia(item?.url || item?.image_url || item?.video_url);
  if (!safeUrl) {
    return <div className="flex min-h-48 items-center justify-center bg-slate-100 text-slate-300"><Globe size={32} /></div>;
  }
  if (item?.type === "video" || item?.video_url) {
    const embed = videoEmbedUrl(safeUrl);
    if (embed) {
      return <iframe src={embed} title={item?.caption || (businessName || "Business") + " video"} loading="lazy" sandbox="allow-scripts allow-same-origin allow-presentation" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="no-referrer" className="h-full min-h-48 w-full border-0 bg-slate-950" />;
    }
    if (isDirectVideo(safeUrl)) {
      return <video src={safeUrl} title={item?.caption || (businessName || "Business") + " video"} controls playsInline preload="metadata" className="h-full min-h-48 w-full bg-slate-950 object-contain" />;
    }
    return <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-48 flex-col items-center justify-center gap-3 bg-slate-950 p-5 text-white"><Play size={24} /><span className="text-sm font-bold">Open video</span><span className="text-xs text-white/60">Opens in a new tab</span></a>;
  }
  return <img src={safeUrl} alt={item?.alt || item?.caption || businessName || "Business media"} loading="lazy" decoding="async" className="h-full min-h-48 w-full object-cover transition duration-700 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none" />;
}

function SectionHeading({ eyebrow, title, description, primary, centered = false }) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="text-[11px] font-bold uppercase tracking-[.2em]" style={{ color: readableBrandText(primary) }}>{eyebrow}</p>
      <h2 className="mt-3 break-words text-3xl font-semibold leading-[1.08] tracking-[-.045em] text-slate-950 sm:text-4xl lg:text-5xl">{title}</h2>
      {description ? <p className="mt-4 break-words text-sm leading-7 text-slate-600 sm:text-base">{description}</p> : null}
    </div>
  );
}

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
  const [minutePulse, setMinutePulse] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [cart, setCart] = useState([]);
  const [checkoutForm, setCheckoutForm] = useState({ name: "", email: "", phone: "", notes: "", website: "" });
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError("");
    setNotice("");
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
        if (!active) return;
        if (!payload || typeof payload !== "object") throw new Error("This business website did not return usable content.");
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
        meta.content = String(description || "").slice(0, 320);
      })
      .catch((err) => {
        if (active && err?.name !== "AbortError") setError(err?.message || "Unable to load this business website.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [businessSlug]);

  useEffect(() => {
    const timer = window.setInterval(() => setMinutePulse((current) => current + 1), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const business = site?.business || {};
  const website = site?.website || {};
  const products = useMemo(() => Array.isArray(site?.products) ? site.products : [], [site?.products]);
  const cartLines = useMemo(() => cart.map((entry) => {
    const product = products.find((item) => String(item.id || item._id || "") === String(entry.product_id));
    return product ? { ...product, quantity: entry.quantity } : null;
  }).filter(Boolean), [cart, products]);
  const cartTotal = useMemo(() => cartLines.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0), [cartLines]);
  const catalogueServices = useMemo(() => (
    website.show_services === false || !Array.isArray(site?.services)
      ? []
      : site.services.filter((item) => item && String(item.name || "").trim()).map((item) => ({
          ...item,
          title: item.name,
          price_label: Number.isFinite(Number(item.price))
            ? formatPrice(item.price, item.currency || business.currency) + (item.unit ? " / " + item.unit : "")
            : "",
          is_catalogue_service: true,
        }))
  ), [website.show_services, site?.services, business.currency]);
  const configuredServiceItems = useMemo(() => (
    website.show_services === false || !Array.isArray(website.service_items)
      ? []
      : website.service_items.filter((item) => item && String(item.title || "").trim())
  ), [website.show_services, website.service_items]);
  const serviceItems = useMemo(() => [...configuredServiceItems, ...catalogueServices], [configuredServiceItems, catalogueServices]);
  const galleryItems = useMemo(() => (
    website.show_gallery === false || !Array.isArray(website.gallery_items)
      ? []
      : website.gallery_items.filter((item) => item && item.url && (item.type === "image" || item.type === "video"))
  ), [website.show_gallery, website.gallery_items]);
  const socialLinks = useMemo(() => (
    website.show_social_links === false
      ? []
      : Object.entries(website.social_links && typeof website.social_links === "object" ? website.social_links : {})
        .filter(([key, value]) => SOCIAL_LABELS[key] && safeHttpsMedia(value))
        .map(([key, value]) => ({ key, label: SOCIAL_LABELS[key], url: safeHttpsMedia(value) }))
  ), [website.show_social_links, website.social_links]);

  const requestedPrimary = website.primary_color || "#1d4ed8";
  const requestedAccent = website.accent_color || "#0f766e";
  const theme = useMemo(() => createBrandTheme(requestedPrimary, requestedAccent), [requestedPrimary, requestedAccent]);
  const primary = theme.primary;
  const accent = theme.accent;
  const logo = safeHttpsMedia(website.logo_url || business.logo_url);
  const currentHeroSlides = useMemo(() => {
    const configured = Array.isArray(website.hero_slides) ? website.hero_slides : [];
    const valid = configured.filter((item) => item && (safeHttpsMedia(item.image_url) || safeHttpsMedia(item.video_url)));
    if (valid.length) return valid;
    if (website.cover_image_url || website.hero_image_url || website.hero_video_url) {
      return [{
        image_url: website.cover_image_url || website.hero_image_url || "",
        video_url: website.hero_video_url || "",
        title: "",
        subtitle: "",
        alt: "",
      }];
    }
    return [{ image_url: "", video_url: "", title: "", subtitle: "", alt: "" }];
  }, [website.hero_slides, website.cover_image_url, website.hero_image_url, website.hero_video_url]);
  const heroSlides = currentHeroSlides.length ? currentHeroSlides : [{ image_url: "", video_url: "", title: "", subtitle: "", alt: "" }];
  const heroSlide = heroSlides[((heroIndex % heroSlides.length) + heroSlides.length) % heroSlides.length] || heroSlides[0];
  const heroImage = safeHttpsMedia(heroSlide?.image_url || (heroIndex === 0 ? website.cover_image_url || website.hero_image_url : ""));
  const heroVideo = safeHttpsMedia(heroSlide?.video_url || (heroIndex === 0 ? website.hero_video_url : ""));
  const whatsappDigits = String(website.whatsapp_number || "").replace(/\D/g, "");
  const canContact = website.contact_enabled !== false;
  const productCount = website.show_products === false ? 0 : products.length;
  const serviceCount = website.show_services === false ? 0 : serviceItems.length;
  const mediaCount = website.show_gallery === false ? 0 : galleryItems.length;
  const socialCount = website.show_social_links === false ? 0 : socialLinks.length;
  const openingStatus = useMemo(() => getOpeningStatus(business.opening_hours, new Date()), [business.opening_hours, minutePulse]);
  const navItems = useMemo(() => {
    const items = [{ id: "about", label: "Our story" }];
    if (serviceCount) items.push({ id: "services", label: "Services" });
    if (website.show_products !== false) items.push({ id: "products", label: "Products" });
    if (mediaCount) items.push({ id: "gallery", label: "Gallery" });
    if (socialCount) items.push({ id: "socials", label: "Socials" });
    if (canContact) items.push({ id: "contact", label: "Contact" });
    return items;
  }, [serviceCount, website.show_products, mediaCount, socialCount, canContact]);

  useEffect(() => {
    if (heroSlides.length < 2) return undefined;
    setHeroIndex((current) => current % heroSlides.length);
    return undefined;
  }, [heroSlides.length]);

  useEffect(() => {
    if (galleryItems.length < 2) return undefined;
    const timer = window.setInterval(() => setGalleryIndex((index) => (index + 1) % galleryItems.length), HERO_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [galleryItems.length, businessSlug]);

  useEffect(() => {
    if (products.length < 4) return undefined;
    const timer = window.setInterval(() => setProductIndex((index) => (index + 1) % products.length), HERO_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [products.length, businessSlug]);

  const setField = useCallback((key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

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

  const updateCheckoutField = (key, value) => {
    setCheckoutForm((current) => ({ ...current, [key]: value }));
  };

  const addToCart = (product) => {
    const productId = String(product?.id || product?._id || "").trim();
    if (!productId) {
      setError("This product cannot be ordered because its catalogue ID is missing.");
      return;
    }
    const remaining = Number(product?.stock_quantity ?? (product?.available === false ? 0 : Number.POSITIVE_INFINITY));
    if (!Number.isFinite(remaining) || remaining <= 0) {
      setError("This product is currently out of stock.");
      return;
    }
    setError("");
    setNotice("");
    setCart((current) => {
      const existing = current.find((item) => String(item.product_id) === productId);
      if (existing) {
        return current.map((item) => String(item.product_id) === productId
          ? { ...item, quantity: Math.min(remaining, item.quantity + 1) }
          : item);
      }
      return [...current, { product_id: productId, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId, value) => {
    const product = products.find((item) => String(item.id || item._id || "") === String(productId));
    const remaining = Number(product?.stock_quantity ?? Number.POSITIVE_INFINITY);
    const requested = Math.floor(Number(value));
    if (!Number.isFinite(requested) || requested < 1) {
      setCart((current) => current.filter((item) => String(item.product_id) !== String(productId)));
      return;
    }
    const quantity = Number.isFinite(remaining) ? Math.min(requested, remaining) : requested;
    setCart((current) => current.map((item) => String(item.product_id) === String(productId)
      ? { ...item, quantity: Math.max(1, quantity) }
      : item));
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    if (!cartLines.length) {
      setError("Add at least one available product before placing your order.");
      return;
    }
    setPlacingOrder(true);
    setNotice("");
    setError("");
    try {
      const response = await fetch(API_ROOT + "/biashara/public/" + encodeURIComponent(businessSlug || "") + "/orders", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          ...checkoutForm,
          items: cartLines.map((item) => ({
            product_id: String(item.id || item._id),
            quantity: item.quantity,
          })),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.message || payload?.error || "Unable to place this order.");
      }
      const result = payload?.data?.order || payload?.order || payload?.data || payload;
      const reference = result?.order_number || result?.id || "received";
      const quantities = new Map(cartLines.map((item) => [String(item.id || item._id), item.quantity]));
      setSite((current) => current ? {
        ...current,
        products: (current.products || []).map((item) => {
          const key = String(item.id || item._id || "");
          if (!quantities.has(key)) return item;
          const remaining = Math.max(0, Number(item.stock_quantity || 0) - quantities.get(key));
          return { ...item, stock_quantity: remaining, available: remaining > 0 };
        }),
      } : current);
      setCart([]);
      setCheckoutForm({ name: "", email: "", phone: "", notes: "", website: "" });
      setNotice("Order received successfully. Reference: " + reference + ". The business has been notified and stock has been reserved.");
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setError(err?.message || "Unable to place this order. Please check stock and try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const askAbout = (name, kind) => {
    setField("message", "Hello, I would like to know more about " + kind + ": " + name + ".");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6" aria-label="Loading business website">
        <div className="mx-auto max-w-7xl animate-pulse motion-reduce:animate-none">
          <div className="h-16 rounded-2xl bg-white shadow-sm" />
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="min-h-[360px] rounded-[2rem] bg-slate-200" />
            <div className="min-h-[360px] rounded-[2rem] bg-slate-200" />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="h-28 rounded-2xl bg-white" /><div className="h-28 rounded-2xl bg-white" /><div className="h-28 rounded-2xl bg-white" />
          </div>
          <p className="mt-5 text-center text-xs font-medium text-slate-500"><Loader2 className="mr-2 inline animate-spin motion-reduce:animate-none" size={15} />Loading business website…</p>
        </div>
      </main>
    );
  }

  if (error && !site) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 sm:px-6">
        <div aria-hidden="true" className="absolute inset-0 opacity-80" style={{ background: "radial-gradient(circle at 15% 15%, #1d4ed855 0, transparent 35%), radial-gradient(circle at 85% 80%, #0f766e44 0, transparent 35%)" }} />
        <section className="relative w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[.06] p-7 text-center text-white shadow-2xl backdrop-blur-xl sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/80"><Globe size={26} /></span>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[.2em] text-white/50">Biashara public website</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">This page is unavailable.</h1>
          <p className="mt-4 break-words text-sm leading-7 text-white/65">{error}</p>
          <a href="/" className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            Return to RevelaCode <ArrowUpRight size={16} />
          </a>
        </section>
      </main>
    );
  }

  return (
    <main id="main-content" tabIndex={-1} className="biashara-public-site min-h-screen overflow-x-clip bg-white text-slate-900" style={{ scrollBehavior: "smooth" }}>
      <style>{'@media (prefers-reduced-motion: reduce) { .biashara-public-site, .biashara-public-site *, .biashara-public-site *::before, .biashara-public-site *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; } }'}</style>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-slate-950 focus:shadow-xl">Skip to content</a>
      <AnnouncementBar announcement={website.announcement} primary={primary} accent={accent} />
      <Header
        business={business}
        website={website}
        logo={logo}
        primary={primary}
        accent={accent}
        navItems={navItems}
        canContact={canContact}
        whatsappDigits={whatsappDigits}
        openingStatus={openingStatus}
      />

      <Hero
        business={business}
        website={website}
        slides={heroSlides}
        index={heroIndex}
        setIndex={setHeroIndex}
        heroImage={heroImage}
        heroVideo={heroVideo}
        productCount={productCount}
        serviceCount={serviceCount}
        mediaCount={mediaCount}
        socialCount={socialCount}
        canContact={canContact}
        whatsappDigits={whatsappDigits}
        primary={theme.primary}
        accent={theme.accent}
        theme={theme}
      />

      <TrustStrip
        business={business}
        openingStatus={openingStatus}
        whatsappEnabled={/^\d{7,15}$/.test(whatsappDigits)}
        productCount={products.length}
        showProducts={website.show_products !== false}
        primary={theme.primary}
      />

      <About
        business={business}
        website={website}
        openingStatus={openingStatus}
        canContact={canContact}
        primary={theme.primary}
        accent={theme.accent}
      />

      {serviceCount > 0 ? (
        <section id="services" className="scroll-mt-24 border-y border-slate-100 bg-slate-50/70 py-16 sm:py-20">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Services" title="What this business offers" description="Explore the services published by the business and contact the team for current details." primary={primary} />
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {serviceItems.map((service, index) => {
                const image = safeHttpsMedia(service.image_url);
                return (
                  <article key={(service.title || "service") + ":" + index} className="group flex min-w-0 flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl motion-reduce:transform-none">
                    <div className="relative flex h-40 items-center justify-center overflow-hidden bg-slate-100">
                      {image ? <img src={image} alt={service.title || "Service"} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none" /> : <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ color: readableBrandText(primary), background: "linear-gradient(140deg, " + primary + "12, " + accent + "24)" }}><Sparkles size={26} /></span>}
                    </div>
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <h3 className="break-words text-lg font-semibold tracking-tight text-slate-950">{service.title}</h3>
                      {service.price_label ? <p className="mt-3 w-fit max-w-full rounded-xl px-3 py-2 text-sm font-bold" style={{ color: readableBrandText(primary), backgroundColor: primary + "0A" }}>{service.price_label}</p> : null}
                      {service.description ? <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{service.description}</p> : <p className="mt-3 text-sm leading-6 text-slate-500">Contact the business to discuss this service.</p>}
                      <a href="#contact" onClick={() => askAbout(service.title, "the service")} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ backgroundColor: primary, color: contrastColor(primary) }}>Ask about service <ArrowUpRight size={15} /></a>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {website.show_products !== false ? (
        <section id="products" className="scroll-mt-24 border-b border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <SectionHeading eyebrow="The catalogue" title="Products, at a glance" description="Published catalogue details are shown as provided by the business." primary={primary} />
              {products.length ? <span className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600">{products.length} listed {products.length === 1 ? "product" : "products"}</span> : null}
            </div>
            {products.length ? (
              <>
                <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: Math.min(3, products.length) }, (_, offset) => {
                    const product = products[(productIndex + offset) % products.length];
                    const image = safeHttpsMedia(product.image_url);
                    return (
                      <article key={product.id || productIndex + ":" + offset} className="group flex min-w-0 flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl motion-reduce:transform-none">
                        <div className="relative flex h-56 items-center justify-center overflow-hidden bg-slate-100 sm:h-64">
                          {image ? <img src={image} alt={product.name || "Product"} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none" /> : <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400"><Package size={24} /></span>}
                          <span className="absolute left-3 top-3 rounded-full border border-white/80 bg-white/95 px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm">{product.available === true ? "Available" : product.available === false ? "Out of stock" : "Ask for availability"}</span>
                        </div>
                        <div className="flex flex-1 flex-col p-5 sm:p-6">
                          {product.category ? <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">{product.category}</p> : null}
                          <h3 className="mt-2 break-words text-lg font-semibold tracking-tight text-slate-950">{product.name || "Product"}</h3>
                          <p className="mt-3 text-xl font-bold tracking-tight" style={{ color: readableBrandText(primary) }}>{formatPrice(product.price, product.currency || business.currency)}</p>
                          {product.description ? <p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-slate-600">{product.description}</p> : <p className="mt-3 text-sm leading-6 text-slate-500">Contact the business for more details about this item.</p>}
                          <div className="mt-5 grid gap-2 sm:grid-cols-2">
                            <button type="button" disabled={product.available === false || Number(product.stock_quantity ?? 0) <= 0} onClick={() => addToCart(product)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ backgroundColor: primary, color: contrastColor(primary) }}><Package size={15} /> Add to order</button>
                            <a href="#contact" onClick={() => askAbout(product.name || "this product", "the product")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2">Ask a question <ArrowUpRight size={15} /></a>
                          </div>
                          {Number.isFinite(Number(product.stock_quantity)) ? <p className="mt-2 text-xs font-semibold text-slate-500">{Number(product.stock_quantity)} remaining</p> : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
                {cartLines.length ? (
                  <section aria-label="Customer checkout" className="mt-8 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-sm">
                    <div className="grid gap-0 lg:grid-cols-[.85fr_1.15fr]">
                      <div className="bg-slate-950 p-5 text-white sm:p-7">
                        <p className="text-[11px] font-bold uppercase tracking-[.18em] text-cyan-300">Your order</p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-tight">Review before you place it.</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-300">Your order is sent to this business. Inventory is reserved only after the system accepts your order.</p>
                        <div className="mt-5 space-y-3">
                          {cartLines.map((item) => (
                            <div key={item.id || item._id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                              <div className="min-w-0 flex-1">
                                <p className="break-words text-sm font-semibold">{item.name}</p>
                                <p className="mt-1 text-xs text-slate-300">{formatPrice(item.price, item.currency || business.currency)} each</p>
                              </div>
                              <label className="block w-20 shrink-0">
                                <span className="sr-only">Quantity for {item.name}</span>
                                <input aria-label={"Quantity for " + item.name} type="number" min="1" max={Number.isFinite(Number(item.stock_quantity)) ? item.stock_quantity : undefined} value={item.quantity} onChange={(event) => updateCartQuantity(item.id || item._id, event.target.value)} className="min-h-10 w-full rounded-lg border border-white/20 bg-slate-900 px-2 text-center text-sm font-bold text-white outline-none focus:border-cyan-300" />
                              </label>
                              <button type="button" onClick={() => setCart((current) => current.filter((line) => String(line.product_id) !== String(item.id || item._id)))} aria-label={"Remove " + item.name + " from order"} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><X size={16} /></button>
                            </div>
                          ))}
                        </div>
                        <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-4">
                          <span className="text-sm font-semibold text-slate-300">Estimated total</span>
                          <strong className="text-xl font-bold">{formatPrice(cartTotal, business.currency || "KES")}</strong>
                        </div>
                      </div>
                      <form onSubmit={submitOrder} className="space-y-4 p-5 sm:p-7">
                        <h4 className="text-lg font-semibold text-slate-900">Customer details</h4>
                        <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
                          <label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" value={checkoutForm.website} onChange={(event) => updateCheckoutField("website", event.target.value)} /></label>
                        </div>
                        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Full name *</span><input required maxLength={160} autoComplete="name" value={checkoutForm.name} onChange={(event) => updateCheckoutField("name", event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10" /></label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Email</span><input type="email" maxLength={254} autoComplete="email" value={checkoutForm.email} onChange={(event) => updateCheckoutField("email", event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10" /></label>
                          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Phone</span><input type="tel" maxLength={40} autoComplete="tel" value={checkoutForm.phone} onChange={(event) => updateCheckoutField("phone", event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10" /></label>
                        </div>
                        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Order notes (optional)</span><textarea rows={3} maxLength={1000} value={checkoutForm.notes} onChange={(event) => updateCheckoutField("notes", event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10" /></label>
                        <p className="text-xs leading-5 text-slate-500">No payment is taken here. The business will receive your order and contact details.</p>
                        <button type="submit" disabled={placingOrder || !cartLines.length} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ backgroundColor: primary, color: contrastColor(primary) }}>{placingOrder ? "Placing order…" : "Place order"}{placingOrder ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpRight size={16} />}</button>
                      </form>
                    </div>
                  </section>
                ) : null}
                {products.length > 3 ? (
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button type="button" aria-label="Previous products" onClick={() => setProductIndex((index) => (index - 1 + products.length) % products.length)} className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2" style={{ "--tw-ring-color": primary }}><ChevronLeft size={18} /></button>
                    <span className="text-xs font-semibold text-slate-500">{productIndex + 1} / {products.length}</span>
                    <button type="button" aria-label="Next products" onClick={() => setProductIndex((index) => (index + 1) % products.length)} className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2" style={{ "--tw-ring-color": primary }}><ChevronRight size={18} /></button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="mt-8 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center sm:px-8">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200"><Package size={22} /></span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">The catalogue is not published yet.</h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Check back later, or contact the business for details about its current offering.</p>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {mediaCount > 0 ? (
        <section id="gallery" className="scroll-mt-24 bg-slate-50/70 py-16 sm:py-20">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Inside the business" title="A closer look" description="Explore the images and videos published by the business." primary={primary} />
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: Math.min(3, galleryItems.length) }, (_, offset) => {
                const index = (galleryIndex + offset) % galleryItems.length;
                const item = galleryItems[index];
                return (
                  <article key={index + ":" + item.url} className="group min-w-0 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
                    <div className="flex min-h-48 items-center justify-center overflow-hidden bg-slate-100">
                      <PublicMedia item={item} businessName={business.name} />
                    </div>
                    {item.caption ? <p className="break-words p-4 text-sm font-semibold text-slate-700">{item.caption}</p> : null}
                  </article>
                );
              })}
            </div>
            {galleryItems.length > 3 ? (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button type="button" aria-label="Previous gallery items" onClick={() => setGalleryIndex((index) => (index - 1 + galleryItems.length) % galleryItems.length)} className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:bg-slate-50"><ChevronLeft size={18} /></button>
                <span className="text-xs font-semibold text-slate-500">{galleryIndex + 1} / {galleryItems.length} · Auto-advance</span>
                <button type="button" aria-label="Next gallery items" onClick={() => setGalleryIndex((index) => (index + 1) % galleryItems.length)} className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:bg-slate-50"><ChevronRight size={18} /></button>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {socialCount > 0 ? (
        <section id="socials" className="scroll-mt-24 border-y border-slate-200 bg-white py-12 sm:py-14">
          <div className="mx-auto max-w-[1240px] px-4 text-center sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Stay connected" title="Find the business online" description="These links are provided by the business." primary={primary} centered />
            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
              {socialLinks.map((item) => <a key={item.key} href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transform-none" style={{ "--tw-ring-color": primary }}><Globe size={15} style={{ color: readableBrandText(primary) }} />{item.label}<ArrowUpRight size={14} /></a>)}
            </div>
          </div>
        </section>
      ) : null}

      {canContact ? (
        <section id="contact" className="scroll-mt-24 border-t border-slate-200 bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto grid w-full max-w-[1240px] items-start gap-8 px-4 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:gap-14 lg:px-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.2em]" style={{ color: readableBrandText(primary) }}>Get in touch</p>
              <h2 className="mt-3 break-words text-3xl font-semibold leading-tight tracking-[-.045em] text-slate-950 sm:text-4xl">Let's start a conversation.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">Send a message to the business. Please do not include passwords, payment card details or other sensitive information.</p>
              <div className="mt-6 flex flex-col gap-3 text-sm text-slate-700">
                {business.phone && safeTelephoneHref(business.phone) ? <a href={safeTelephoneHref(business.phone)} className="flex min-w-0 items-center gap-3 break-words hover:underline"><Phone size={16} style={{ color: readableBrandText(primary) }} />{business.phone}</a> : null}
                {business.email && safeEmailHref(business.email) ? <a href={safeEmailHref(business.email)} className="flex min-w-0 items-center gap-3 break-all hover:underline"><Mail size={16} style={{ color: readableBrandText(primary) }} />{business.email}</a> : null}
                {business.location || business.county ? <p className="flex min-w-0 items-start gap-3 break-words"><MapPin size={16} className="mt-0.5 shrink-0" style={{ color: readableBrandText(primary) }} />{[business.location, business.county].filter(Boolean).join(", ")}</p> : null}
                {openingStatus?.todayHours ? <p className="flex min-w-0 items-start gap-3"><Clock3 size={16} className="mt-0.5 shrink-0" style={{ color: readableBrandText(primary) }} /><span>Today's hours: {openingStatus.todayHours}</span></p> : null}
              </div>
              {/^\d{7,15}$/.test(whatsappDigits) ? <a href={"https://wa.me/" + whatsappDigits} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ backgroundColor: accent, color: contrastColor(accent) }}><MessageCircle size={16} /> Continue on WhatsApp</a> : null}
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,.06)] sm:p-7">
              {notice ? <p role="status" aria-live="polite" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800">{notice}</p> : null}
              {error ? <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800">{error}</p> : null}
              <form onSubmit={submitInquiry} className="space-y-4">
                <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
                  <label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => setField("website", event.target.value)} /></label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Your name *</span><input name="name" required maxLength={80} value={form.name} onChange={(event) => setField("name", event.target.value)} autoComplete="name" className="min-h-12 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10" /></label>
                  <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Email</span><input name="email" type="email" maxLength={254} value={form.email} onChange={(event) => setField("email", event.target.value)} autoComplete="email" className="min-h-12 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10" /></label>
                </div>
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Phone (optional)</span><input name="phone" type="tel" maxLength={32} value={form.phone} onChange={(event) => setField("phone", event.target.value)} autoComplete="tel" className="min-h-12 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10" /></label>
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Message *</span><textarea name="message" required rows={4} maxLength={2000} value={form.message} onChange={(event) => setField("message", event.target.value)} className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10" /></label>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <p className="max-w-xs text-[11px] leading-5 text-slate-400">A message is an inquiry only. It does not initiate an order or payment.</p>
                  <button type="submit" disabled={sending} className="inline-flex min-h-12 min-w-44 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transform-none" style={{ backgroundColor: primary, color: contrastColor(primary) }}>
                    {sending ? "Sending…" : "Send inquiry"}{sending ? <Loader2 className="animate-spin motion-reduce:animate-none" size={16} /> : <ArrowUpRight size={16} />}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      ) : null}

      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-8 text-white sm:px-6 sm:py-10">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="break-words text-lg font-semibold tracking-tight">{business.name || "Business"}</p>
            {website.footer_message ? <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-white/65">{website.footer_message}</p> : null}
            <p className="mt-3 text-xs leading-5 text-white/45">© {new Date().getFullYear()} {business.name || "Business"}. All rights reserved.</p>
            <p className="mt-1 text-[11px] leading-5 text-white/35">Built with RevelaCode Jumuiya</p>
          </div>
          <a href="#main-content" className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full border border-white/15 px-4 py-2.5 text-xs font-semibold text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:self-auto">Back to top <ArrowUpRight size={14} /></a>
        </div>
      </footer>
    </main>
  );
}
