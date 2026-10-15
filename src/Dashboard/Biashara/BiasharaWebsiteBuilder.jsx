import React, { useCallback, useEffect, useState } from "react";
import { ExternalLink, Globe, Loader2, Save, ShieldCheck } from "lucide-react";
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
  return (
    <div className="space-y-5">
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      {notice ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div> : null}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 p-5 text-white sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-blue-200"><Globe size={22} /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">Biashara Website Studio</p>
                <h2 className="mt-1 text-xl font-bold sm:text-2xl">Your business, open to the world</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Create a branded storefront from your existing business profile and product catalogue. Publishing makes the site public; product prices and availability come from Biashara records.</p>
              </div>
            </div>
            {form.published && publicPath ? (
              <a href={publicPath} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 hover:bg-blue-50"><ExternalLink size={16} />Open public website</a>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-slate-300"><ShieldCheck size={15} />Not published</span>
            )}
          </div>
          {slug ? <p className="mt-4 break-all text-xs text-slate-400">Public path: {publicPath || ("/b/" + slug)}</p> : null}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" />Loading website settings…</div>
        ) : (
          <form onSubmit={save} className="space-y-6 p-5 sm:p-7">
            <section>
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

            <section>
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

            <section>
              <h3 className="text-sm font-bold text-slate-900">Search and sharing</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TextField label="SEO title" value={form.seo_title} maxLength={70} placeholder={business?.name || "Business name"} onChange={(v) => setField("seo_title", v)} />
                <TextField label="SEO description" value={form.seo_description} maxLength={180} placeholder="A clear summary for search and link previews" onChange={(v) => setField("seo_description", v)} />
              </div>
            </section>

            <section className="space-y-3">
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

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500">Publishing is separate from domain verification. Custom domains, checkout and external-channel synchronization are not included in this first slice.</p>
              <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"><Save size={16} />{saving ? "Saving…" : (form.published ? "Save and publish" : "Save website")}</button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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
