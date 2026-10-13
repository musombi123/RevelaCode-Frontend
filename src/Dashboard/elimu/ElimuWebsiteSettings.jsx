import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Loader,
  Save,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { useElimuApi } from "@/services/elimuApi.jsx";

const EMPTY_FORM = {
  name: "",
  public_slug: "",
  homepage_title: "",
  description: "",
  public_description: "",
  about: "",
  motto: "",
  mission: "",
  vision: "",
  principal_name: "",
  school_type: "",
  curriculum: "",
  established_year: "",
  logo_url: "",
  cover_image_url: "",
  phone: "",
  email: "",
  website: "",
  postal_address: "",
  address: "",
  location: "",
  county: "",
  town: "",
  country: "Kenya",
  academic_year: "",
  current_term: "",
  calendar_year: "",
  public_profile_enabled: false,
};

const FIELD_GROUPS = [
  {
    title: "Website identity",
    description: "Set the public page title and its short, shareable address.",
    fields: [
      ["homepage_title", "Homepage title", "e.g. Makuselwa School â€” Learning for life"],
      ["public_slug", "Public URL slug", "makuselwa"],
    ],
  },
  {
    title: "Branding",
    description: "Paste HTTPS URLs for your school's logo and cover image. Images uploaded in Elimu Media can be used here.",
    fields: [
      ["logo_url", "Logo image URL", "https://..."],
      ["cover_image_url", "Cover / hero image URL", "https://..."],
    ],
  },
  {
    title: "School introduction",
    description: "These descriptions appear on the public school's home and About pages.",
    fields: [
      ["motto", "School motto", "Your school motto"],
      ["description", "Short description", "A concise introduction to the school", "textarea"],
      ["public_description", "Public homepage description", "What visitors should know first", "textarea"],
      ["about", "About the school", "History, approach and school community", "textarea"],
      ["mission", "Mission statement", "Our mission is...", "textarea"],
      ["vision", "Vision statement", "Our vision is...", "textarea"],
    ],
  },
  {
    title: "School information",
    description: "Official contact and learning details shown to parents and visitors.",
    fields: [
      ["principal_name", "Principal / head teacher", "Full name"],
      ["curriculum", "Curriculum", "CBC, 8-4-4, international..."],
      ["established_year", "Year established", "e.g. 1998"],
      ["phone", "Public phone number", "+254..."],
      ["email", "Public email address", "office@school.ac.ke"],
      ["website", "Other school website", "https://..."],
      ["postal_address", "Postal address", "P.O. Box..."],
      ["address", "Physical address", "School location / directions"],
      ["location", "Location", "Village, ward or area"],
      ["county", "County", "County"],
      ["town", "Town", "Town"],
      ["country", "Country", "Kenya"],
    ],
  },
  {
    title: "Academic calendar",
    description: "Optional current academic details for your public page.",
    fields: [
      ["academic_year", "Academic year", "e.g. 2026"],
      ["current_term", "Current term", "e.g. Term 3"],
      ["calendar_year", "Calendar year", "e.g. 2026"],
    ],
  },
];

function unwrap(payload) {
  let value = payload;
  for (let i = 0; i < 6; i += 1) {
    if (!value || typeof value !== "object" || Array.isArray(value)) break;
    if (value.data && typeof value.data === "object") {
      value = value.data;
      continue;
    }
    break;
  }
  return value;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function fromRecord(record = {}) {
  const next = { ...EMPTY_FORM };
  for (const key of Object.keys(EMPTY_FORM)) {
    if (key === "public_profile_enabled") {
      next[key] = record[key] === true;
    } else {
      const value = record[key];
      next[key] = value == null ? "" : String(value);
    }
  }
  next.name = String(record.name || "");
  next.public_slug = String(record.public_slug || slugify(record.name) || "");
  return next;
}

function Field({ field, label, placeholder, value, onChange, multiline = false }) {
  const common = {
    id: field,
    name: field,
    value: value ?? "",
    onChange: (event) => onChange(field, event.target.value),
    placeholder,
    className:
      "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white",
  };
  return (
    <label htmlFor={field} className="block min-w-0 text-sm font-semibold text-slate-700 dark:text-slate-200">
      {label}
      {multiline ? <textarea {...common} rows={4} /> : <input {...common} />}
    </label>
  );
}

export default function ElimuWebsiteSettings({ school, onNavigate }) {
  const api = useElimuApi();
  const [form, setForm] = useState(() => fromRecord(school || {}));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const publicUrl = useMemo(
    () => (form.public_slug ? `/${encodeURIComponent(form.public_slug)}` : ""),
    [form.public_slug],
  );

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const response = await api.getWebsiteSettings();
        const data = unwrap(response);
        const record = data?.school || data;
        if (!record || typeof record !== "object") {
          throw new Error("The school website settings response was empty.");
        }
        if (active) {
          setForm(fromRecord(record));
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(err?.message || "Could not load website settings. Check that this account owns a verified school.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [api, school]);

  const change = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setNotice("");
  };

  const save = async (publishOverride) => {
    setSaving(true);
    setError("");
    setNotice("");
    const publish = typeof publishOverride === "boolean"
      ? publishOverride
      : form.public_profile_enabled;
    const payload = {
      ...form,
      public_slug: slugify(form.public_slug || form.name),
      publish,
    };
    try {
      const response = await api.saveWebsiteSettings(payload);
      const data = unwrap(response);
      const record = data?.school || data;
      setForm(fromRecord(record && typeof record === "object" ? record : {
        ...payload,
        public_profile_enabled: publish,
      }));
      setNotice(publish
        ? "Website settings saved and the public school page is published."
        : "Website settings saved. The public page remains unpublished.");
    } catch (err) {
      setError(err?.message || "Could not save the public website settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="flex min-h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader className="animate-spin" size={19} /> Loading school website settings...
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-slate-950 text-white">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
              <Globe size={14} /> PUBLIC SCHOOL WEBSITE
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Build your school's public page</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Manage the logo, cover image, descriptions, mission, vision, contact information and school URL in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {publicUrl && (
              <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                Preview page <ExternalLink size={15} />
              </a>
            )}
            <button type="button" onClick={() => onNavigate?.("elimu/media")} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-emerald-50">
              <ImageIcon size={16} /> Manage media
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} /> <span>{error}</span>
        </div>
      )}
      {notice && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 shrink-0" size={18} /> <span>{notice}</span>
        </div>
      )}

      <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/60 dark:bg-blue-950/25">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300" size={20} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900 dark:text-white">Verified school record</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {form.name || school?.name || "Your school"} Â· {form.school_type || school?.school_type || "School"} Â· {school?.verification_status || "Verification is checked by the server"}. Editing these fields does not change registration or verification details.
            </p>
            <p className="mt-2 break-all text-sm font-semibold text-blue-800 dark:text-blue-300">
              {form.public_slug ? `${window.location.origin}/${form.public_slug}` : "A public address will be generated when you save."}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        {FIELD_GROUPS.map((group) => (
          <section key={group.title} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
            <div className="mb-5">
              <h3 className="text-base font-bold text-slate-950 dark:text-white">{group.title}</h3>
              <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{group.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.fields.map(([field, label, placeholder, kind]) => (
                <div key={field} className={kind === "textarea" ? "sm:col-span-2" : ""}>
                  <Field
                    field={field}
                    label={label}
                    placeholder={placeholder}
                    value={form[field]}
                    onChange={change}
                    multiline={kind === "textarea"}
                  />
                  {field === "logo_url" && form.logo_url && (
                    <img src={form.logo_url} alt="School logo preview" className="mt-3 h-16 w-16 rounded-xl border border-slate-200 bg-white object-contain p-1" loading="lazy" />
                  )}
                  {field === "cover_image_url" && form.cover_image_url && (
                    <img src={form.cover_image_url} alt="School cover preview" className="mt-3 h-24 w-full rounded-xl border border-slate-200 object-cover" loading="lazy" />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="sticky bottom-3 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.public_profile_enabled}
              onChange={(event) => change("public_profile_enabled", event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>
              <span className="block font-semibold text-slate-900 dark:text-white">Publish this school website</span>
              <span className="mt-0.5 block text-slate-500 dark:text-slate-400">Only the verified school's public fields are displayed. Private student and staff records are not exposed.</span>
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={saving} onClick={() => save()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
              {saving ? <Loader className="animate-spin" size={16} /> : <Save size={16} />} Save changes
            </button>
            <button type="button" disabled={saving} onClick={() => save(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? <Loader className="animate-spin" size={16} /> : <Globe size={16} />} Save & publish
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}