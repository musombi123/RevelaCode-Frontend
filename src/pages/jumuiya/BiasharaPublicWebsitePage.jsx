import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowUpRight, Globe, Loader2, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { API_ROOT, BASE_URL } from "@/services/jumuiyaApi.jsx";

function safeHttpsImage(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" ? url.href : "";
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

export default function BiasharaPublicWebsitePage() {
  const { businessSlug } = useParams();
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", website: "" });

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
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
        if (!response.ok) {
          throw new Error(payload?.error?.message || payload?.message || "This business website is unavailable.");
        }
        return payload?.data !== undefined ? payload.data : payload;
      })
      .then((payload) => {
        setSite(payload);
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
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><section className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><Globe className="mx-auto text-slate-400" size={30} /><h1 className="mt-4 text-xl font-bold text-slate-900">Website unavailable</h1><p className="mt-2 text-sm leading-6 text-slate-600">{error}</p><a href="/" className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Go to RevelaCode</a></section></main>;
  }

  const business = site?.business || {};
  const website = site?.website || {};
  const products = Array.isArray(site?.products) ? site.products : [];
  const primary = website.primary_color || "#1d4ed8";
  const accent = website.accent_color || "#0f766e";
  const heroImage = safeHttpsImage(website.hero_image_url);
  const whatsappDigits = String(website.whatsapp_number || "").replace(/\D/g, "");
  const canContact = website.contact_enabled !== false;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href={"/b/" + (business.slug || "")} className="flex min-w-0 items-center gap-3">
            {safeHttpsImage(business.logo_url) ? <img src={safeHttpsImage(business.logo_url)} alt="" className="h-10 w-10 rounded-xl object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: primary }}><Globe size={19} /></span>}
            <span className="truncate text-base font-black tracking-tight">{business.name || "Local business"}</span>
          </a>
          <a href="#products" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Products</a>
        </div>
      </header>

      <section className="relative isolate overflow-hidden" style={{ backgroundColor: primary }}>
        {heroImage ? <img src={heroImage} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-20" /> : null}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/50 to-transparent" />
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 text-white sm:px-8 sm:py-24 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">{business.category || "Independent business"}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">{website.headline || business.name || "Welcome"}</h1>
            {website.tagline ? <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">{website.tagline}</p> : null}
            {business.location || business.county ? <p className="mt-6 inline-flex items-center gap-2 text-sm text-white/80"><MapPin size={16} />{[business.location, business.county].filter(Boolean).join(", ")}</p> : null}
            <div className="mt-8 flex flex-wrap gap-3">
              {products.length ? <a href="#products" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 hover:bg-slate-100">Explore products<ArrowUpRight size={16} /></a> : null}
              {canContact ? <a href="#contact" className="rounded-xl border border-white/40 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Contact us</a> : null}
              {whatsappDigits ? <a href={"https://wa.me/" + whatsappDigits} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white" style={{ backgroundColor: accent }}><MessageCircle size={16} />WhatsApp</a> : null}
            </div>
          </div>
          <aside className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-sm sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">Welcome</p>
            <p className="mt-3 text-lg font-bold leading-7">{business.name || "Our business"} is ready to help.</p>
            <p className="mt-3 text-sm leading-6 text-white/80">{website.about || business.description || "Explore our products and contact us for more information."}</p>
            {business.phone ? <p className="mt-5 flex items-center gap-2 text-sm text-white/85"><Phone size={15} />{business.phone}</p> : null}
            {business.email ? <p className="mt-2 flex items-center gap-2 break-all text-sm text-white/85"><Mail size={15} />{business.email}</p> : null}
          </aside>
        </div>
      </section>

      {website.show_products !== false ? (
        <section id="products" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: primary }}>Our catalogue</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Products for everyday needs</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Current catalogue items are sourced directly from the business's Biashara records.</p></div>
            <span className="text-sm text-slate-500">{products.length} product(s)</span>
          </div>
          {products.length ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const image = safeHttpsImage(product.image_url);
                return <article key={product.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                  {image ? <img src={image} alt="" loading="lazy" className="h-52 w-full bg-slate-100 object-cover" /> : <div className="flex h-52 items-center justify-center bg-slate-50 text-3xl font-black" style={{ color: primary }}>{String(product.name || "P").slice(0, 1).toUpperCase()}</div>}
                  <div className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="text-base font-bold text-slate-900">{product.name}</h3><span className="shrink-0 text-sm font-black" style={{ color: primary }}>{formatPrice(product.price, product.currency || business.currency)}</span></div>
                    {product.category ? <p className="mt-1 text-xs font-semibold text-slate-500">{product.category}</p> : null}
                    {product.description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{product.description}</p> : null}
                    <p className="mt-4 text-xs font-semibold" style={{ color: product.available ? accent : "#64748b" }}>{product.available ? "Available" : "Currently out of stock"}</p>
                    {canContact ? <a href="#contact" className="mt-4 inline-flex text-sm font-bold" style={{ color: primary }}>Ask about this product <ArrowUpRight className="ml-1" size={15} /></a> : null}
                  </div>
                </article>;
              })}
            </div>
          ) : <div className="mt-8 rounded-3xl border border-dashed border-slate-300 p-10 text-center"><h3 className="font-bold text-slate-800">Catalogue coming soon</h3><p className="mt-2 text-sm text-slate-500">The business has not published active products yet.</p></div>}
        </section>
      ) : null}

      {canContact ? (
        <section id="contact" className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.8fr_1.2fr]">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: primary }}>Get in touch</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">How can we help?</h2><p className="mt-4 text-sm leading-6 text-slate-600">Send a message directly to the business. Please do not include passwords, payment card details or other sensitive information.</p>
              <div className="mt-6 space-y-3 text-sm text-slate-700">{business.phone ? <p className="flex items-center gap-2"><Phone size={16} />{business.phone}</p> : null}{business.email ? <p className="flex items-center gap-2"><Mail size={16} />{business.email}</p> : null}{business.location || business.county ? <p className="flex items-center gap-2"><MapPin size={16} />{[business.location, business.county].filter(Boolean).join(", ")}</p> : null}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              {notice ? <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p> : null}
              {error ? <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
              <form onSubmit={submitInquiry} className="space-y-4">
                <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"><label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => setField("website", event.target.value)} /></label></div>
                <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Your name *</span><input required maxLength={80} value={form.name} onChange={(event) => setField("name", event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></label>
                  <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Email</span><input type="email" maxLength={254} value={form.email} onChange={(event) => setField("email", event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></label>
                </div>
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Phone (optional)</span><input type="tel" maxLength={32} value={form.phone} onChange={(event) => setField("phone", event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></label>
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Message *</span><textarea required rows={4} maxLength={2000} value={form.message} onChange={(event) => setField("message", event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></label>
                <button type="submit" disabled={sending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60" style={{ backgroundColor: primary }}>{sending ? "Sending…" : "Send inquiry"}{sending ? <Loader2 className="animate-spin" size={16} /> : <ArrowUpRight size={16} />}</button>
                <p className="text-xs leading-5 text-slate-500">Messages are stored for the business owner in Biashara. Sending a message does not initiate a payment or order.</p>
              </form>
            </div>
          </div>
        </section>
      ) : null}

      <footer className="border-t border-slate-200 bg-white px-5 py-6 text-center text-xs text-slate-500">Powered by Biashara · RevelaCode Jumuiya</footer>
    </main>
  );
}
