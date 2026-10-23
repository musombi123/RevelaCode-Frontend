import React, { useCallback, useEffect, useState } from "react";
import {
  ExternalLink, Eye, Globe, Image as ImageIcon, Loader2, Plus, Save,
  ShieldCheck, Trash2, Upload, Video,
} from "lucide-react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

const DEFAULT_SETTINGS = {
  headline: "",
  tagline: "",
  about: "",
  logo_url: "",
  cover_image_url: "",
  hero_image_url: "",
  hero_video_url: "",
  hero_slides: [],
  service_items: [],
  gallery_items: [],
  social_links: {},
  custom_domain: "",
  domain_status: "not_configured",
  announcement: "",
  footer_message: "",
  primary_color: "#1d4ed8",
  accent_color: "#0f766e",
  seo_title: "",
  seo_description: "",
  whatsapp_number: "",
  show_products: true,
  show_services: true,
  show_gallery: true,
  show_social_links: true,
  contact_enabled: true,
  published: false,
};

const SOCIAL_FIELDS = [
  ["facebook", "Facebook profile"],
  ["instagram", "Instagram profile"],
  ["messenger", "Facebook Messenger link"],
  ["tiktok", "TikTok profile"],
  ["youtube", "YouTube channel"],
  ["x", "X profile"],
  ["linkedin", "LinkedIn page"],
  ["telegram", "Telegram"],
  ["pinterest", "Pinterest"],
  ["snapchat", "Snapchat"],
  ["threads", "Threads"],
  ["whatsapp_channel", "WhatsApp channel"],
  ["reddit", "Reddit profile/community"],
  ["discord", "Discord invite/server"],
  ["twitch", "Twitch channel"],
  ["bluesky", "Bluesky profile"],
  ["mastodon", "Mastodon profile"],
  ["github", "GitHub profile"],
  ["medium", "Medium publication/profile"],
  ["wechat", "WeChat profile/page"],
  ["vk", "VK profile/community"],
  ["rumble", "Rumble channel"],
  ["line", "LINE account"],
  ["signal", "Signal contact/link"],
  ["website", "Other website"],
  ["other", "Other social profile"],
];

function safePreviewImage(value) {
  if (String(value || "").startsWith("data:image/")) return value;
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

async function compressImageFile(file, maxSide = 1600) {
  if (!file || !String(file.type || "").startsWith("image/")) {
    throw new Error("Choose an image file such as PNG, JPEG or WebP.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("Choose an image smaller than 12 MB. It will be compressed before saving.");
  }
  if (typeof createImageBitmap !== "function") {
    throw new Error("This browser cannot safely optimise image uploads. Use an HTTPS image URL instead.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    let scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    let dataUrl = "";
    for (let attempt = 0; attempt < 7; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("The browser could not prepare this image.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      dataUrl = canvas.toDataURL("image/webp", Math.max(0.48, 0.82 - attempt * 0.06));
      if (/^data:image\/(?:webp|jpeg|png);base64,/.test(dataUrl) && dataUrl.length <= 420000) return dataUrl;
      scale *= 0.78;
    }
    throw new Error("This image is still too large after compression. Try a smaller image.");
  } finally {
    bitmap.close?.();
  }
}

function TextField({ label, value, onChange, type = "text", maxLength, placeholder, help }) {
  const displayValue = String(value || "").startsWith("data:image/") ? "" : (value ?? "");
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={displayValue}
        maxLength={maxLength}
        placeholder={placeholder || (String(value || "").startsWith("data:image/") ? "Uploaded image saved — paste HTTPS URL to replace" : "")}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />
      {help ? <span className="mt-1.5 block text-[11px] leading-5 text-slate-500">{help}</span> : null}
    </label>
  );
}

function ImageField({ label, value, onChange, onError, maxSide = 1600, help }) {
  const [uploading, setUploading] = useState(false);
  const preview = safePreviewImage(value);
  const isDataImage = String(value || "").startsWith("data:image/");
  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      onChange(await compressImageFile(file, maxSide));
    } catch (err) {
      onError(err?.message || "Unable to prepare this image.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</label>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
        <div className="min-w-0 flex-1">
          <input
            type="url"
            value={isDataImage ? "" : (value || "")}
            onChange={(event) => onChange(event.target.value)}
            placeholder={isDataImage ? "Optimised image uploaded" : "https://…"}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
        <label className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50">
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? "Optimising…" : "Upload"}
          <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} disabled={uploading} />
        </label>
      </div>
      {preview ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
          <img src={preview} alt="" className="h-16 w-20 rounded-lg bg-white object-contain ring-1 ring-slate-200" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800">{isDataImage ? "Uploaded and optimised" : "Image preview"}</p>
            <p className="mt-1 text-[11px] leading-4 text-slate-500">{help || "Use images you own or are licensed to publish."}</p>
          </div>
          <button type="button" onClick={() => onChange("")} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"><Trash2 size={14} />Remove</button>
        </div>
      ) : <p className="mt-1.5 text-[11px] leading-5 text-slate-500">{help || "Upload an image or paste a public HTTPS image URL."}</p>}
    </div>
  );
}

function VideoField({ label, value, onChange, help }) {
  return (
    <div className="min-w-0">
      <TextField label={label} value={value} type="url" maxLength={1200} placeholder="https://youtu.be/… or https://…/video.mp4" onChange={onChange} help={help || "Paste a public HTTPS YouTube/Vimeo link or a direct MP4/WebM URL. Do not paste embed code."} />
      {value ? <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-800"><Video size={14} />Video URL added</div> : null}
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {description ? <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function BiasharaWebsiteBuilder({ business }) {
  const api = useJumuiyaApi();
  const [site, setSite] = useState({ slug: business?.slug || "", url_path: "", settings: DEFAULT_SETTINGS });
  const [form, setForm] = useState({ ...DEFAULT_SETTINGS });
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.getBiasharaWebsiteSettings();
      const settings = { ...DEFAULT_SETTINGS, ...(result?.settings || {}) };
      setSite(result || { slug: business?.slug || "", url_path: "", settings });
      setForm({
        ...settings,
        hero_slides: Array.isArray(settings.hero_slides) ? settings.hero_slides : [],
        service_items: Array.isArray(settings.service_items) ? settings.service_items : [],
        gallery_items: Array.isArray(settings.gallery_items) ? settings.gallery_items : [],
        social_links: settings.social_links && typeof settings.social_links === "object" ? settings.social_links : {},
      });
      try {
        const inbox = await api.getBiasharaWebsiteInquiries({ limit: 30 });
        setInquiries(Array.isArray(inbox) ? inbox : []);
      } catch {
        setInquiries([]);
      }
    } catch (err) {
      setError(err?.message || "Unable to load website settings.");
    } finally {
      setLoading(false);
    }
  }, [api, business?.slug]);

  useEffect(() => { load(); }, [load]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const setSocial = (field, value) => setForm((current) => ({
    ...current,
    social_links: { ...(current.social_links || {}), [field]: value },
  }));

  const updateSlide = (index, field, value) => setForm((current) => ({
    ...current,
    hero_slides: current.hero_slides.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
  }));
  const removeSlide = (index) => setForm((current) => ({
    ...current,
    hero_slides: current.hero_slides.filter((_, itemIndex) => itemIndex !== index),
  }));
  const addSlide = () => setForm((current) => ({
    ...current,
    hero_slides: [...current.hero_slides, { image_url: "", video_url: "", title: "", subtitle: "", alt: "" }].slice(0, 8),
  }));

  const updateGalleryItem = (index, field, value) => setForm((current) => ({
    ...current,
    gallery_items: current.gallery_items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
  }));
  const removeGalleryItem = (index) => setForm((current) => ({
    ...current,
    gallery_items: current.gallery_items.filter((_, itemIndex) => itemIndex !== index),
  }));
  const addGalleryItem = (type = "image") => setForm((current) => ({
    ...current,
    gallery_items: [...current.gallery_items, { type, url: "", caption: "", alt: "" }].slice(0, 12),
  }));

  const updateServiceItem = (index, field, value) => setForm((current) => ({
    ...current,
    service_items: (current.service_items || []).map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
  }));
  const removeServiceItem = (index) => setForm((current) => ({
    ...current,
    service_items: (current.service_items || []).filter((_, itemIndex) => itemIndex !== index),
  }));
  const addServiceItem = () => setForm((current) => ({
    ...current,
    service_items: [...(current.service_items || []), { title: "", description: "", price_label: "", image_url: "" }].slice(0, 12),
  }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const payload = {
      ...form,
      hero_slides: (form.hero_slides || []).filter((item) => item.image_url || item.video_url),
      service_items: (form.service_items || []).filter((item) => String(item.title || "").trim()),
      gallery_items: (form.gallery_items || []).filter((item) => item.url),
      social_links: Object.fromEntries(SOCIAL_FIELDS.map(([key]) => [key, String(form.social_links?.[key] || "").trim()])),
    };
    try {
      const result = await api.saveBiasharaWebsiteSettings(payload);
      const settings = { ...DEFAULT_SETTINGS, ...(result?.settings || payload) };
      setSite(result || site);
      setForm({
        ...settings,
        hero_slides: Array.isArray(settings.hero_slides) ? settings.hero_slides : [],
        service_items: Array.isArray(settings.service_items) ? settings.service_items : [],
        gallery_items: Array.isArray(settings.gallery_items) ? settings.gallery_items : [],
        social_links: settings.social_links && typeof settings.social_links === "object" ? settings.social_links : {},
      });
      setNotice(settings.published ? "Website settings saved. Your published storefront is updated." : "Website settings saved. The storefront remains private until publishing is enabled.");
      try {
        const inbox = await api.getBiasharaWebsiteInquiries({ limit: 30 });
        setInquiries(Array.isArray(inbox) ? inbox : []);
      } catch {
        // Keep the last successfully loaded inbox visible.
      }
    } catch (err) {
      setError(err?.message || "Unable to save website settings.");
    } finally {
      setSaving(false);
    }
  };

  const slug = site?.slug || business?.slug || "";
  const publicPath = site?.url_path || (slug ? "/b/" + slug : "");
  const previewImage = safePreviewImage(form.cover_image_url) || safePreviewImage(form.hero_image_url) || safePreviewImage(form.hero_slides?.[0]?.image_url);
  const previewLogo = safePreviewImage(form.logo_url) || safePreviewImage(business?.logo_url);
  const slidesCount = (form.hero_slides || []).filter((item) => item.image_url || item.video_url).length;
  const galleryCount = (form.gallery_items || []).filter((item) => item.url).length;

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6">
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      {notice ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div> : null}

      <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-100">
        <div className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 text-white sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-emerald-200"><Globe size={22} /></div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Biashara Website Studio</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Build a living storefront</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Customise your brand, rotating hero media, product cards, video gallery and social profiles. Your published catalogue remains connected to current Biashara product records.</p>
              </div>
            </div>
            {form.published && publicPath
              ? <a href={publicPath} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-emerald-50"><ExternalLink size={16} />Open public website</a>
              : <span className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-slate-300"><ShieldCheck size={15} />Not published</span>}
          </div>
          {slug ? <p className="relative z-10 mt-5 inline-flex max-w-full items-center gap-2 break-all rounded-xl bg-white/10 px-3 py-2 text-xs text-slate-300 ring-1 ring-white/10"><Globe size={14} className="shrink-0 text-emerald-300" />{publicPath}</p> : null}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" />Loading website settings…</div>
        ) : (
          <form onSubmit={save} className="grid min-w-0 gap-6 p-4 sm:p-7 xl:grid-cols-[minmax(0,1fr)_350px]">
            <div className="min-w-0 space-y-5">
              <Section title="Brand and content" description="Fill these details to make the homepage feel like your own business, not a generic template.">
                <ImageField label="Business logo" value={form.logo_url} onChange={(v) => setField("logo_url", v)} onError={setError} maxSide={640} help="A transparent PNG or WebP logo works well. Uploaded images are compressed before being saved." />
                <div className="grid min-w-0 gap-4 md:grid-cols-2">
                  <TextField label="Homepage headline" value={form.headline} maxLength={120} placeholder={business?.name || "Your business promise"} onChange={(v) => setField("headline", v)} />
                  <TextField label="Short tagline" value={form.tagline} maxLength={240} placeholder="What makes your business useful?" onChange={(v) => setField("tagline", v)} />
                  <TextField label="Announcement / promotion bar" value={form.announcement} maxLength={180} placeholder="New arrivals · Ask us about today's offers" onChange={(v) => setField("announcement", v)} />
                  <TextField label="WhatsApp number" value={form.whatsapp_number} maxLength={32} placeholder="+254 7XX XXX XXX" onChange={(v) => setField("whatsapp_number", v)} help="Use country code for the click-to-chat button." />
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">About the business</span>
                  <textarea rows={5} maxLength={1600} value={form.about} onChange={(event) => setField("about", event.target.value)} placeholder={business?.description || "Tell customers what you offer, who you serve, and why they should choose you."} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                </label>
              </Section>

              <Section title="Hero images and videos" description="Set a strong cover photo, then add optional rotating hero slides and videos.">
                <ImageField label="Website cover photo" value={form.cover_image_url} onChange={(v) => setField("cover_image_url", v)} onError={setError} maxSide={1800} help="This is the main cover image shown behind your homepage hero. Use a wide, high-quality image." />
                <ImageField label="Fallback hero image" value={form.hero_image_url} onChange={(v) => setField("hero_image_url", v)} onError={setError} maxSide={1600} />
                <VideoField label="Fallback hero video (optional)" value={form.hero_video_url} onChange={(v) => setField("hero_video_url", v)} />
                {(form.hero_slides || []).map((slide, index) => (
                  <div key={index} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Hero slide {index + 1}</p>
                      <button type="button" onClick={() => removeSlide(index)} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"><Trash2 size={14} />Remove</button>
                    </div>
                    <ImageField label="Slide image (optional if video provided)" value={slide.image_url} onChange={(v) => updateSlide(index, "image_url", v)} onError={setError} maxSide={1600} />
                    <VideoField label="Slide video (optional if image provided)" value={slide.video_url} onChange={(v) => updateSlide(index, "video_url", v)} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <TextField label="Slide heading" value={slide.title} maxLength={120} onChange={(v) => updateSlide(index, "title", v)} placeholder="A short message" />
                      <TextField label="Slide supporting text" value={slide.subtitle} maxLength={240} onChange={(v) => updateSlide(index, "subtitle", v)} placeholder="A little more detail" />
                    </div>
                    <TextField label="Image alternative text" value={slide.alt} maxLength={140} onChange={(v) => updateSlide(index, "alt", v)} placeholder="Describe the image for accessibility" />
                  </div>
                ))}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">{slidesCount} configured slide(s) · Rotates every 30 seconds</p>
                  <button type="button" onClick={addSlide} disabled={(form.hero_slides || []).length >= 8} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Plus size={15} />Add hero slide</button>
                </div>
              </Section>

              <Section title="Services and offerings" description="Show the work you do, service descriptions, optional pricing and supporting images. Add up to twelve services.">
                {(form.service_items || []).map((item, index) => (
                  <div key={index} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Service {index + 1}</p>
                      <button type="button" onClick={() => removeServiceItem(index)} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"><Trash2 size={14} />Remove</button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <TextField label="Service title" value={item.title} maxLength={100} placeholder="e.g. Installation and setup" onChange={(v) => updateServiceItem(index, "title", v)} />
                      <TextField label="Price label (optional)" value={item.price_label} maxLength={80} placeholder="e.g. From KES 2,000" onChange={(v) => updateServiceItem(index, "price_label", v)} />
                    </div>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-slate-700">Service description</span>
                      <textarea rows={3} maxLength={600} value={item.description || ""} onChange={(event) => updateServiceItem(index, "description", event.target.value)} placeholder="Explain what is included, who it helps and how customers can book." className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                    </label>
                    <ImageField label="Service image (optional)" value={item.image_url || ""} onChange={(v) => updateServiceItem(index, "image_url", v)} onError={setError} maxSide={1200} help="Choose a real photo of the service, team or completed work." />
                  </div>
                ))}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">{(form.service_items || []).length}/12 service(s)</p>
                  <button type="button" onClick={addServiceItem} disabled={(form.service_items || []).length >= 12} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Plus size={15} />Add service</button>
                </div>
              </Section>

              <Section title="Image and video gallery" description="Show more of the shop, work, team, services or products. Gallery cards cycle on the public website.">
                {(form.gallery_items || []).map((item, index) => (
                  <div key={index} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Gallery item {index + 1}</p>
                      <button type="button" onClick={() => removeGalleryItem(index)} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"><Trash2 size={14} />Remove</button>
                    </div>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-slate-700">Media type</span>
                      <select value={item.type || "image"} onChange={(event) => updateGalleryItem(index, "type", event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"><option value="image">Image</option><option value="video">Video</option></select>
                    </label>
                    {item.type === "video" ? (
                      <VideoField label="Video URL" value={item.url} onChange={(v) => updateGalleryItem(index, "url", v)} />
                    ) : (
                      <ImageField label="Gallery image" value={item.url} onChange={(v) => updateGalleryItem(index, "url", v)} onError={setError} maxSide={1400} />
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <TextField label="Caption" value={item.caption} maxLength={180} onChange={(v) => updateGalleryItem(index, "caption", v)} placeholder="What customers are seeing" />
                      <TextField label="Alternative text" value={item.alt} maxLength={140} onChange={(v) => updateGalleryItem(index, "alt", v)} placeholder="Describe this media" />
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => addGalleryItem("image")} disabled={(form.gallery_items || []).length >= 12} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><ImageIcon size={15} />Add image</button>
                  <button type="button" onClick={() => addGalleryItem("video")} disabled={(form.gallery_items || []).length >= 12} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Video size={15} />Add video</button>
                  <span className="self-center text-xs text-slate-500">{galleryCount}/12 ready</span>
                </div>
              </Section>

              <Section title="Social media and links" description="Add the public profile or channel URL for each platform you use. These are links on your website, not Meta login or publishing integrations.">
                <div className="grid gap-4 md:grid-cols-2">
                  {SOCIAL_FIELDS.map(([key, label]) => (
                    <TextField key={key} label={label} type="url" value={form.social_links?.[key] || ""} maxLength={1200} placeholder="https://…" onChange={(v) => setSocial(key, v)} />
                  ))}
                </div>
              </Section>

              <Section title="Custom domain" description="Bring a domain you own. Saving a domain creates a setup request; it does not make DNS, hosting or HTTPS work automatically.">
                <TextField label="Your domain name" value={form.custom_domain} maxLength={253} placeholder="shop.yourbusiness.co.ke" onChange={(v) => setField("custom_domain", v)} help="Enter the bare domain only — no https:// and no path." />
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-5 text-amber-900">
                  <p className="font-bold">Domain setup status: {String(site?.settings?.domain_status || form.domain_status || "not_configured").replaceAll("_", " ")}</p>
                  <p className="mt-1">RevelaCode platform DNS, domain ownership checks, routing and SSL configuration must be completed before visitors can use a custom domain. Until then, your regular /b/{slug || "business-slug"} address remains the public link.</p>
                </div>
              </Section>

              <Section title="Visual identity and footer" description="Choose the colours customers see across buttons, headings and accents.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 p-3">
                    <input type="color" value={form.primary_color} onChange={(event) => setField("primary_color", event.target.value)} className="h-10 w-12 cursor-pointer rounded border-0 bg-transparent" />
                    <span><span className="block text-sm font-semibold text-slate-800">Primary colour</span><span className="block text-xs text-slate-500">{form.primary_color}</span></span>
                  </label>
                  <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 p-3">
                    <input type="color" value={form.accent_color} onChange={(event) => setField("accent_color", event.target.value)} className="h-10 w-12 cursor-pointer rounded border-0 bg-transparent" />
                    <span><span className="block text-sm font-semibold text-slate-800">Accent colour</span><span className="block text-xs text-slate-500">{form.accent_color}</span></span>
                  </label>
                </div>
                <TextField label="Optional footer message" value={form.footer_message} maxLength={240} placeholder="Thank you for shopping with us." onChange={(v) => setField("footer_message", v)} />
              </Section>

              <Section title="Search and sharing" description="Help search engines and social link previews describe your business clearly.">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="SEO title" value={form.seo_title} maxLength={70} placeholder={business?.name || "Business name"} onChange={(v) => setField("seo_title", v)} />
                  <TextField label="SEO description" value={form.seo_description} maxLength={180} placeholder="A clear summary for search and link previews" onChange={(v) => setField("seo_description", v)} />
                </div>
              </Section>

              <Section title="Storefront controls">
                {[
                  ["show_products", "Show products", "Publish active products, images, prices and availability from your catalogue."],
                  ["show_services", "Show services", "Display your service offerings, descriptions, images and pricing labels."],
                  ["show_gallery", "Show media gallery", "Show gallery images and embedded videos."],
                  ["show_social_links", "Show social links", "Show links to the social profiles you have provided."],
                  ["contact_enabled", "Accept customer inquiries", "Add a contact form and business contact options to the public website."],
                  ["published", "Enable public website", "Turn off public visibility without deleting your business, products or saved website design. Only verified, active businesses can publish."],
                ].map(([key, label, description]) => (
                  <label key={key} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4">
                    <input type="checkbox" checked={Boolean(form[key])} onChange={(event) => setField(key, event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    <span><span className="block text-sm font-semibold text-slate-800">{label}</span><span className="mt-0.5 block text-xs leading-5 text-slate-500">{description}</span></span>
                  </label>
                ))}
              </Section>
            </div>

            <aside aria-label="Live storefront preview" className="min-w-0 self-start rounded-[1.5rem] border border-slate-200 bg-[#f8fafc] p-3.5 sm:p-4 xl:sticky xl:top-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">Live preview</p>
                  <h3 className="mt-1 text-base font-bold text-slate-950">Your storefront</h3>
                  <p className="mt-1 text-xs text-slate-500">Updates while you edit</p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200"><Eye size={17} /></span>
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5">
                <div className="flex items-center gap-1.5 border-b border-slate-100 px-3 py-2.5">
                  <span className="h-2 w-2 rounded-full bg-red-300" /><span className="h-2 w-2 rounded-full bg-amber-300" /><span className="h-2 w-2 rounded-full bg-emerald-300" />
                  <span className="ml-auto rounded-md bg-slate-100 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Store preview</span>
                </div>
                <div className="p-3.5 text-center sm:text-left">
                  <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:justify-start">
                    {previewLogo ? <img src={previewLogo} alt="" className="h-10 w-10 rounded-xl object-contain ring-1 ring-slate-100" /> : null}
                    <p className="min-w-0 break-words text-xs font-extrabold text-slate-900">{business?.name || business?.business_name || "Your business"}</p>
                  </div>
                  <div className="relative mt-3 min-h-[185px] overflow-hidden rounded-xl p-4 text-center" style={{ backgroundColor: form.primary_color || "#1d4ed8" }}>
                    {previewImage ? <img src={previewImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/10 to-slate-950/55" />
                    <div className="relative z-10">
                      <span className="inline-flex rounded-full bg-white/15 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white ring-1 ring-white/20">Welcome</span>
                      <h4 className="mt-3 break-words text-xl font-extrabold leading-tight tracking-tight text-white">{form.hero_slides?.[0]?.title || form.headline || business?.name || "Your headline"}</h4>
                      <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/90">{form.hero_slides?.[0]?.subtitle || form.tagline || "A clear promise helps customers understand what you offer."}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">About</p>
                  <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600">{form.about || business?.description || "Share a short introduction to what you offer."}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-left">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5"><span className="block text-[10px] font-bold text-slate-700">Products</span><span className="mt-1 block text-[9px] text-slate-500">{form.show_products ? "Catalogue and prices" : "Hidden"}</span></div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5"><span className="block text-[10px] font-bold text-slate-700">Media</span><span className="mt-1 block text-[9px] text-slate-500">{slidesCount} slides · {galleryCount} items</span></div>
                  </div>
                  {form.social_links && Object.values(form.social_links).some(Boolean) ? <p className="mt-3 text-[10px] font-semibold text-emerald-700">{Object.values(form.social_links).filter(Boolean).length} social link(s) ready</p> : null}
                  <div className="mt-3 rounded-xl px-3 py-2.5 text-xs font-bold text-white" style={{ backgroundColor: form.accent_color || form.primary_color }}>Explore the store</div>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-700" />
                <p className="text-[11px] leading-5 text-emerald-950">Preview only. Publishing and public visibility are enforced by the backend's verified-business and saved-website rules.</p>
              </div>
            </aside>

            <div className="flex min-w-0 flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between xl:col-span-2">
              <p className="text-xs leading-5 text-slate-500">Copyright footer is generated from your business name and current year. Custom domains require separate platform DNS and SSL setup.</p>
              <button type="submit" disabled={saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"><Save size={16} />{saving ? "Saving…" : (form.published ? "Save and publish" : "Save website")}</button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-white bg-white p-5 shadow-sm ring-1 ring-slate-100/80 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-lg font-bold text-slate-900">Website inquiries</h2><p className="mt-1 text-sm text-slate-500">Messages submitted through the published storefront.</p></div>
          <span className="text-xs font-semibold text-slate-500">{inquiries.length} recent record(s)</span>
        </div>
        {inquiries.length ? (
          <div className="mt-4 divide-y divide-slate-100">
            {inquiries.map((item) => (
              <article key={item.id} className="py-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div><h3 className="text-sm font-semibold text-slate-900">{item.name}</h3><p className="mt-1 text-xs text-slate-500">{[item.email, item.phone].filter(Boolean).join(" · ")}</p></div>
                  <span className="text-xs text-slate-400">{item.created_at ? new Date(item.created_at).toLocaleString() : "Date unavailable"}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.message}</p>
              </article>
            ))}
          </div>
        ) : <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-8 text-center"><p className="text-sm font-semibold text-slate-800">No website inquiries yet</p><p className="mt-1 text-xs text-slate-500">Once a visitor submits the public contact form, the message will appear here.</p></div>}
      </section>
    </div>
  );
}
