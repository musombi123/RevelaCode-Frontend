import React, { useCallback, useEffect, useState } from "react";
import { ExternalLink, Eye, Globe, Loader2, Save, ShieldCheck } from "lucide-react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

const DEFAULT_SETTINGS = {
  headline: "",
  tagline: "",
  about: "",
  hero_image_url: "",
  primary_color: "#1d4ed8",
  accent_color: "#0f766e",
  seo_title: "",
  seo_description: "",
  whatsapp_number: "",
  show_products: true,
  contact_enabled: true,
  published: false,
};

function safePreviewImage(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function TextField({ label, value, onChange, type = "text", maxLength, placeholder }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        maxLength={maxLength}
        placeholder={placeholder || ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
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
      setForm(settings);
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

  useEffect(() => {
    load();
  }, [load]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await api.saveBiasharaWebsiteSettings(form);
      const settings = { ...DEFAULT_SETTINGS, ...(result?.settings || form) };
      setSite(result || site);
      setForm(settings);
      setNotice(settings.published ? "Website saved and published." : "Website settings saved. The website remains private until published.");
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
  const previewImage = safePreviewImage(form.hero_image_url);
  return (
    <div className="space-y-6">
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      {notice ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div> : null}

      <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-100">
        <div className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-blue-200"><Globe size={22} /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">Biashara Website Studio</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Your storefront, designed around your business</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Shape a polished public storefront with your own message, colours and imagery. Your published catalogue and customer contact options stay connected to Biashara records.</p>
              </div>
            </div>
            {form.published && publicPath ? (
              <a href={publicPath} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 hover:bg-blue-50"><ExternalLink size={16} />Open public website</a>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-slate-300"><ShieldCheck size={15} />Not published</span>
            )}
          </div>
          {slug ? <p className="relative z-10 mt-5 inline-flex max-w-full items-center gap-2 break-all rounded-xl bg-white/10 px-3 py-2 text-xs text-slate-300 ring-1 ring-white/10"><Globe size={14} className="shrink-0 text-sky-300" />{publicPath || ("/b/" + slug)}</p> : null}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" />Loading website settings…</div>
        ) : (
          <form onSubmit={save} className="grid min-w-0 gap-6 p-5 sm:p-7 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
              <h3 className="text-sm font-bold text-slate-900">Brand and content</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">These are plain-text fields. Use clear copy that tells a customer what you sell and how to reach you.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TextField label="Homepage headline" value={form.headline} maxLength={120} placeholder={business?.name || "Your business promise"} onChange={(v) => setField("headline", v)} />
                <TextField label="Short tagline" value={form.tagline} maxLength={240} placeholder="What makes your business useful?" onChange={(v) => setField("tagline", v)} />
                <TextField label="Hero image HTTPS URL (optional)" value={form.hero_image_url} maxLength={500} placeholder="https://…" onChange={(v) => setField("hero_image_url", v)} />
                <TextField label="WhatsApp number (optional)" value={form.whatsapp_number} maxLength={32} placeholder="+254 7XX XXX XXX" onChange={(v) => setField("whatsapp_number", v)} />
              </div>
              <label className="mt-4 block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">About the business</span>
                <textarea rows={4} maxLength={1600} value={form.about} onChange={(event) => setField("about", event.target.value)} placeholder={business?.description || "Describe what your business does, who it serves and what customers can expect."} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
              <h3 className="text-sm font-bold text-slate-900">Visual identity</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                  <input type="color" value={form.primary_color} onChange={(event) => setField("primary_color", event.target.value)} className="h-10 w-12 cursor-pointer rounded border-0 bg-transparent" />
                  <span><span className="block text-sm font-semibold text-slate-800">Primary colour</span><span className="block text-xs text-slate-500">{form.primary_color}</span></span>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                  <input type="color" value={form.accent_color} onChange={(event) => setField("accent_color", event.target.value)} className="h-10 w-12 cursor-pointer rounded border-0 bg-transparent" />
                  <span><span className="block text-sm font-semibold text-slate-800">Accent colour</span><span className="block text-xs text-slate-500">{form.accent_color}</span></span>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
              <h3 className="text-sm font-bold text-slate-900">Search and sharing</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TextField label="SEO title" value={form.seo_title} maxLength={70} placeholder={business?.name || "Business name"} onChange={(v) => setField("seo_title", v)} />
                <TextField label="SEO description" value={form.seo_description} maxLength={180} placeholder="A clear summary for search and link previews" onChange={(v) => setField("seo_description", v)} />
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
              <h3 className="text-sm font-bold text-slate-900">Storefront controls</h3>
              {[
                ["show_products", "Show products", "Publish active products from your Biashara catalogue."],
                ["contact_enabled", "Accept customer inquiries", "Add a contact form to the public website."],
                ["published", "Publish website", "Make the storefront visible to anyone with the public link."],
              ].map(([key, label, description]) => (
                <label key={key} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4">
                  <input type="checkbox" checked={Boolean(form[key])} onChange={(event) => setField(key, event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span><span className="block text-sm font-semibold text-slate-800">{label}</span><span className="mt-0.5 block text-xs leading-5 text-slate-500">{description}</span></span>
                </label>
              ))}
            </section>

            </div>

            <aside aria-label="Live storefront preview" className="self-start rounded-[1.5rem] border border-slate-200 bg-[#f8fafc] p-4 xl:sticky xl:top-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">Live preview</p>
                  <h3 className="mt-1 text-base font-bold text-slate-950">Your storefront</h3>
                  <p className="mt-1 text-xs text-slate-500">Updates as you edit</p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm ring-1 ring-slate-200"><Eye size={17} /></span>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5">
                <div className="flex items-center gap-1.5 border-b border-slate-100 px-3 py-2.5">
                  <span className="h-2 w-2 rounded-full bg-red-300" />
                  <span className="h-2 w-2 rounded-full bg-amber-300" />
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  <span className="ml-auto rounded-md bg-slate-100 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Store preview</span>
                </div>
                <div className="p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-xs font-extrabold text-slate-900">{business?.name || business?.business_name || "Your business"}</p>
                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-slate-400">Official store</span>
                  </div>

                  <div className="relative mt-3 min-h-[174px] overflow-hidden rounded-xl p-4" style={{ backgroundColor: form.primary_color || "#1d4ed8" }}>
                    {previewImage ? <img src={previewImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/10 to-slate-950/45" />
                    <div className="relative z-10">
                      <span className="inline-flex rounded-full bg-white/15 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white ring-1 ring-white/20">Welcome</span>
                      <h4 className="mt-3 break-words text-xl font-extrabold leading-tight tracking-tight text-white">{form.headline || business?.name || business?.business_name || "Your business headline"}</h4>
                      <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/90">{form.tagline || "A clear promise helps customers understand why your business is right for them."}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">About</p>
                  <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600">{form.about || business?.description || "Share a short introduction to what you offer and who you serve."}</p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                      <span className="block text-[10px] font-bold text-slate-700">Products</span>
                      <span className="mt-1 block text-[9px] text-slate-500">{form.show_products ? "Catalogue enabled" : "Hidden from website"}</span>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                      <span className="block text-[10px] font-bold text-slate-700">Contact</span>
                      <span className="mt-1 block text-[9px] text-slate-500">{form.contact_enabled ? "Inquiries enabled" : "Contact form hidden"}</span>
                    </div>
                  </div>

                  <button type="button" className="mt-3 w-full rounded-xl px-3 py-2.5 text-xs font-bold text-white" style={{ backgroundColor: form.accent_color || form.primary_color }}>Explore the store</button>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-blue-700" />
                <p className="text-[11px] leading-5 text-blue-900">Preview only. Public product listings and contact options follow your saved settings and live business records.</p>
              </div>
            </aside>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between xl:col-span-2">
              <p className="text-xs leading-5 text-slate-500">Publishing is separate from domain verification. Custom domains, checkout and external-channel synchronization are not included in this first slice.</p>
              <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"><Save size={16} />{saving ? "Saving…" : (form.published ? "Save and publish" : "Save website")}</button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-white bg-white p-5 shadow-sm ring-1 ring-slate-100/80 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-lg font-bold text-slate-900">Website inquiries</h2><p className="mt-1 text-sm text-slate-500">Messages submitted through your published storefront.</p></div>
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
