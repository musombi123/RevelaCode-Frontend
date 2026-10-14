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
  Eye,
  Palette,
  RotateCcw,
} from "lucide-react";
import { useElimuApi } from "@/services/elimuApi.jsx";

const DEFAULT_WEBSITE_THEME = {
  primary: "#047857",
  secondary: "#064e3b",
  accent: "#d4af37",
  background: "#f8fafc",
  surface: "#ffffff",
  heading: "#0f172a",
  body: "#475569",
  header: "#ffffff",
  footer: "#ffffff",
  font_style: "modern",
  button_style: "solid",
};

const WEBSITE_THEME_PRESETS = [
  { name: "Navy Blue & Gold", theme: { ...DEFAULT_WEBSITE_THEME, primary: "#1d4ed8", secondary: "#172554", accent: "#d4af37", header: "#ffffff", footer: "#172554" } },
  { name: "Forest Green", theme: { ...DEFAULT_WEBSITE_THEME, primary: "#166534", secondary: "#14532d", accent: "#d4af37", footer: "#14532d" } },
  { name: "Royal Blue", theme: { ...DEFAULT_WEBSITE_THEME, primary: "#1d4ed8", secondary: "#1e3a8a", accent: "#60a5fa", footer: "#1e3a8a" } },
  { name: "Maroon & Cream", theme: { ...DEFAULT_WEBSITE_THEME, primary: "#9f1239", secondary: "#4c0519", accent: "#f5e6c8", background: "#fffaf0", footer: "#4c0519" } },
  { name: "Burgundy & Gold", theme: { ...DEFAULT_WEBSITE_THEME, primary: "#881337", secondary: "#500724", accent: "#d4af37", footer: "#500724" } },
  { name: "Teal & White", theme: { ...DEFAULT_WEBSITE_THEME, primary: "#0f766e", secondary: "#134e4a", accent: "#f59e0b", footer: "#134e4a" } },
  { name: "Purple & Silver", theme: { ...DEFAULT_WEBSITE_THEME, primary: "#6d28d9", secondary: "#3b0764", accent: "#cbd5e1", footer: "#3b0764" } },
];

const WEBSITE_THEME_COLORS = [
  ["primary", "Primary colour"],
  ["secondary", "Secondary colour"],
  ["accent", "Accent colour"],
  ["background", "Page background"],
  ["surface", "Cards and surfaces"],
  ["heading", "Heading text"],
  ["body", "Body text"],
  ["header", "Header background"],
  ["footer", "Footer background"],
];

function normalizeWebsiteTheme(value = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const result = { ...DEFAULT_WEBSITE_THEME };
  for (const [key, fallback] of Object.entries(DEFAULT_WEBSITE_THEME)) {
    const candidate = source[key];
    if (key === "font_style") {
      if (["modern", "classic", "humanist"].includes(candidate)) result[key] = candidate;
    } else if (key === "button_style") {
      if (["solid", "outline", "soft"].includes(candidate)) result[key] = candidate;
    } else if (typeof candidate === "string" && /^#[0-9a-f]{6}$/i.test(candidate.trim())) {
      result[key] = candidate.trim().toLowerCase();
    }
  }
  return result;
}

function relativeLuminance(hex) {
  const channels = hex.replace("#", "").match(/.{2}/g)?.map((pair) => parseInt(pair, 16) / 255) || [0, 0, 0];
  const linear = channels.map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground, background) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function websiteThemeWarnings(theme) {
  const warnings = [];
  const colourFields = WEBSITE_THEME_COLORS.map(([field]) => field);
  for (const field of colourFields) {
    if (typeof theme[field] !== "string" || !/^#[0-9a-f]{6}$/i.test(theme[field])) {
      warnings.push(field + " must be a six-digit hexadecimal colour.");
    }
  }
  const safe = normalizeWebsiteTheme(theme);
  if (contrastRatio(safe.heading, safe.background) < 4.5) warnings.push("Heading text may be difficult to read against the page background.");
  if (contrastRatio(safe.body, safe.background) < 4.5) warnings.push("Body text may be difficult to read against the page background.");
  if (contrastRatio("#ffffff", safe.primary) < 4.5) warnings.push("White text on the primary button colour may not meet the recommended contrast ratio.");
  return [...new Set(warnings)];
}

const EMPTY_FORM = {
  website_theme_draft: { ...DEFAULT_WEBSITE_THEME },
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
  courses_text: "",
  departments_text: "",
  activities_text: "",
  teacher_services_text: "",
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
    description: "Upload the logo and cover image from your device, or use an existing HTTPS image URL.",
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
  {
    title: "Courses and departments",
    description: "Add the courses/programs and academic departments visitors should see. Put one entry on each line and separate fields with a vertical bar (|). Leave optional fields empty if they do not apply.",
    fields: [
      ["courses_text", "Courses / programs", "Course name | Description | Duration | Requirements\nEarly Years | Foundation learning | 2 years | Age requirements", "textarea"],
      ["departments_text", "Departments", "Department name | Description | Subjects\nSciences | Practical science learning | Biology, Chemistry, Physics", "textarea"],
    ],
  },
  {
    title: "Co-curricular activities",
    description: "List clubs, sports, arts, music, debates, STEM activities and other opportunities offered by the school.",
    fields: [
      ["activities_text", "Activities", "Activity name | Category | Description | Schedule\nFootball | Sports | School football team | Mon and Wed after class", "textarea"],
    ],
  },
  {
    title: "Teacher services",
    description: "Publish school-approved services each teacher offers, such as tutoring, music coaching, mentorship or sports coaching. Do not enter private personal details. One service per line.",
    fields: [
      ["teacher_services_text", "Teacher service directory", "Teacher name | Subject/department | Service offered | Description | Availability\nJane M. | Mathematics | Remedial tutoring | Small-group mathematics support | By appointment", "textarea"],
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

function formatStructuredLines(entries, keys) {
  if (!Array.isArray(entries)) return "";
  return entries
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => keys.map((key) => String(entry[key] ?? "").replace(/[\r\n|]/g, " ").trim()).join(" | "))
    .filter((line) => line.replace(/[|\s]/g, ""))
    .join("\n");
}

function parseStructuredLines(value, keys, requiredKeys) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim());
      return Object.fromEntries(keys.map((key, index) => [key, parts[index] || ""]));
    })
    .filter((entry) => requiredKeys.every((key) => entry[key]));
}

function fromRecord(record = {}) {
  const next = { ...EMPTY_FORM };
  for (const key of Object.keys(EMPTY_FORM)) {
    if (["courses_text", "departments_text", "activities_text", "teacher_services_text"].includes(key)) continue;
    if (key === "website_theme_draft") {
      next[key] = normalizeWebsiteTheme(record.website_theme_draft || record.website_theme || DEFAULT_WEBSITE_THEME);
    } else if (key === "public_profile_enabled") {
      next[key] = record[key] === true;
    } else {
      const value = record[key];
      next[key] = value == null ? "" : String(value);
    }
  }
  next.courses_text = formatStructuredLines(record.courses, ["name", "description", "duration", "requirements"]);
  next.departments_text = formatStructuredLines(record.departments, ["name", "description", "subjects"]);
  next.activities_text = formatStructuredLines(record.co_curricular_activities, ["name", "category", "description", "schedule"]);
  next.teacher_services_text = formatStructuredLines(record.teacher_services, ["teacher_name", "subject", "service", "description", "availability"]);
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
  const [uploadingField, setUploadingField] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [themeSaving, setThemeSaving] = useState(false);
  const [themePreviewExpanded, setThemePreviewExpanded] = useState(false);
  const [domains, setDomains] = useState([]);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [domainBusy, setDomainBusy] = useState("");
  const [domainError, setDomainError] = useState("");
  const [domainNotice, setDomainNotice] = useState("");
  const [newDomainHostname, setNewDomainHostname] = useState("");
  const [renderTarget, setRenderTarget] = useState("");

  const publicUrl = useMemo(
    () => (form.public_slug ? `/${encodeURIComponent(form.public_slug)}` : ""),
    [form.public_slug],
  );
  const draftTheme = normalizeWebsiteTheme(form.website_theme_draft);
  const themeWarnings = websiteThemeWarnings(form.website_theme_draft);

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

  const loadDomains = useCallback(async () => {
    setDomainsLoading(true);
    try {
      const response = await api.getSchoolDomains();
      const data = unwrap(response);
      setDomains(Array.isArray(data?.domains) ? data.domains : []);
      setRenderTarget(typeof data?.render_target === "string" ? data.render_target : "");
      setDomainError("");
      return data;
    } catch (err) {
      setDomainError(err?.message || "Custom domains could not be loaded.");
      throw err;
    } finally {
      setDomainsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await api.getSchoolDomains();
        const data = unwrap(response);
        if (!active) return;
        setDomains(Array.isArray(data?.domains) ? data.domains : []);
        setRenderTarget(typeof data?.render_target === "string" ? data.render_target : "");
        setDomainError("");
      } catch (err) {
        if (active) setDomainError(err?.message || "Custom-domain infrastructure is not configured yet.");
      } finally {
        if (active) setDomainsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [api, school]);

  const addDomain = async (event) => {
    event.preventDefault();
    if (!newDomainHostname.trim()) {
      setDomainError("Enter the hostname you registered, such as www.yourschool.ac.ke.");
      return;
    }
    setDomainBusy("add");
    setDomainError("");
    setDomainNotice("");
    try {
      const response = await api.addSchoolDomain({ hostname: newDomainHostname.trim() });
      const data = unwrap(response);
      const record = data?.domain || data;
      if (!record?.id || !record?.hostname) throw new Error("The hosting service did not return a saved domain record.");
      setDomains((current) => [record, ...current.filter((item) => item.id !== record.id && item.hostname !== record.hostname)]);
      setRenderTarget(record?.dns?.value || renderTarget);
      setNewDomainHostname("");
      setDomainNotice("Hostname added to the hosting service. Configure the displayed DNS record, then verify it.");
      try { await loadDomains(); } catch (_) { /* Keep the saved result visible if refresh is temporarily unavailable. */ }
    } catch (err) {
      setDomainError(err?.message || "Could not add the custom hostname.");
    } finally {
      setDomainBusy("");
    }
  };

  const verifyDomain = async (domain) => {
    setDomainBusy("verify:" + domain.id);
    setDomainError("");
    setDomainNotice("");
    try {
      const response = await api.verifySchoolDomain(domain.id);
      const data = unwrap(response);
      const record = data?.domain || data;
      if (!record?.id) throw new Error("The server did not return the updated domain status.");
      setDomains((current) => current.map((item) => item.id === record.id ? record : item));
      setDomainNotice(record.status === "active"
        ? domain.hostname + " is verified and serving over HTTPS."
        : "Verification was requested. Current status: " + (record.status || "pending") + ". The domain will not be marked active until the server confirms DNS routing and HTTPS.");
      try { await loadDomains(); } catch (_) { /* The verification result remains visible. */ }
    } catch (err) {
      setDomainError(err?.message || "Could not verify the custom hostname.");
    } finally {
      setDomainBusy("");
    }
  };

  const makePrimaryDomain = async (domain) => {
    setDomainBusy("primary:" + domain.id);
    setDomainError("");
    setDomainNotice("");
    try {
      const response = await api.setPrimarySchoolDomain(domain.id);
      const data = unwrap(response);
      if (data?.school?.primary_domain !== domain.hostname) throw new Error("The backend did not confirm the primary-domain change.");
      setDomains((current) => current.map((item) => ({ ...item, is_primary: item.id === domain.id })));
      setDomainNotice(domain.hostname + " is now the primary domain. The platform URL remains available.");
    } catch (err) {
      setDomainError(err?.message || "Could not set the primary domain.");
    } finally {
      setDomainBusy("");
    }
  };

  const removeDomain = async (domain) => {
    if (!window.confirm("Remove " + domain.hostname + " from this school website? The hostname will stop resolving through this platform.")) return;
    setDomainBusy("remove:" + domain.id);
    setDomainError("");
    setDomainNotice("");
    try {
      const response = await api.deleteSchoolDomain(domain.id);
      const data = unwrap(response);
      if (data?.removed !== true) throw new Error("The server did not confirm domain removal.");
      setDomains((current) => current.filter((item) => item.id !== domain.id));
      setDomainNotice(domain.hostname + " was removed.");
    } catch (err) {
      setDomainError(err?.message || "Could not remove the custom hostname.");
    } finally {
      setDomainBusy("");
    }
  };

  const change = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setNotice("");
  };

  const changeTheme = (field, value) => {
    setForm((current) => ({
      ...current,
      website_theme_draft: {
        ...normalizeWebsiteTheme(current.website_theme_draft),
        [field]: value,
      },
    }));
    setNotice("");
  };

  const saveTheme = async (publishTheme = false) => {
    setThemeSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await api.saveWebsiteSettings({
        website_theme_draft: normalizeWebsiteTheme(form.website_theme_draft),
        publish_website_theme: publishTheme,
      });
      const data = unwrap(response);
      const record = data?.school || data;
      const savedDraft = normalizeWebsiteTheme(record?.website_theme_draft || record?.website_theme || form.website_theme_draft);
      setForm((current) => ({ ...current, website_theme_draft: savedDraft }));
      setNotice(publishTheme
        ? "Website theme published. The public website now uses these colours and design settings."
        : "Website theme draft saved. Public visitors will continue to see the last published theme.");
    } catch (err) {
      setError(err?.message || "Could not save the website theme.");
    } finally {
      setThemeSaving(false);
    }
  };

  const resetThemeDraft = () => {
    setForm((current) => ({ ...current, website_theme_draft: { ...DEFAULT_WEBSITE_THEME } }));
    setNotice("Default theme restored in the preview. Save the draft or publish it to persist this choice.");
    setError("");
  };

  const uploadBrandImage = async (field, file) => {
    if (!file) return;
    if (field !== "logo_url" && field !== "cover_image_url") return;

    if (file.type && !file.type.startsWith("image/")) {
      setError("Choose an image file for the logo or cover.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError("Website images must be 12 MB or smaller.");
      return;
    }

    const isCover = field === "cover_image_url";
    const label = isCover ? "Cover image" : "School logo";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", `${form.name || school?.name || "School"} ${isCover ? "cover image" : "logo"}`);
    formData.append("caption", "School website branding");
    formData.append("alt_text", `${form.name || school?.name || "School"} ${isCover ? "cover image" : "logo"}`);
    formData.append("category", isCover ? "hero" : "gallery");
    formData.append("is_published", "false");

    setUploadingField(field);
    setError("");
    setNotice("");
    try {
      const response = await api.uploadSchoolMedia(formData);
      const result = unwrap(response);
      const asset = result?.media || result?.item || result;
      const url = asset?.url || asset?.secure_url || asset?.data?.url || "";
      if (!url || typeof url !== "string") {
        throw new Error("The image upload finished without returning a usable URL.");
      }
      setForm((current) => ({ ...current, [field]: url }));
      setNotice(`${label} uploaded. Save the website settings to keep this image on the public page.`);
    } catch (uploadError) {
      setError(uploadError?.message || `Could not upload the ${label.toLowerCase()}.`);
    } finally {
      setUploadingField("");
    }
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
      courses: parseStructuredLines(form.courses_text, ["name", "description", "duration", "requirements"], ["name"]),
      departments: parseStructuredLines(form.departments_text, ["name", "description", "subjects"], ["name"]),
      co_curricular_activities: parseStructuredLines(form.activities_text, ["name", "category", "description", "schedule"], ["name"]),
      teacher_services: parseStructuredLines(form.teacher_services_text, ["teacher_name", "subject", "service", "description", "availability"], ["teacher_name", "service"]),
      public_slug: slugify(form.public_slug || form.name),
      publish,
    };
    delete payload.courses_text;
    delete payload.departments_text;
    delete payload.activities_text;
    delete payload.teacher_services_text;
    delete payload.website_theme_draft;
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
                  {(field === "logo_url" || field === "cover_image_url") && (
                    <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-3 dark:border-slate-700">
                      <label htmlFor={`${field}-upload`} className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Upload image from this device
                      </label>
                      <input
                        id={`${field}-upload`}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                        disabled={Boolean(uploadingField)}
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null;
                          event.currentTarget.value = "";
                          if (file) void uploadBrandImage(field, file);
                        }}
                        className="mt-2 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-100 dark:text-slate-300 dark:file:bg-blue-950/50 dark:file:text-blue-300"
                      />
                      {uploadingField === field && (
                        <p className="mt-2 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                          <Loader size={14} className="animate-spin" /> Uploading image...
                        </p>
                      )}
                      <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        JPG, PNG, WEBP or GIF; up to 12 MB. The image URL will be filled in automatically.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-700"><Palette size={18} /><p className="text-xs font-extrabold uppercase tracking-[0.15em]">Website appearance</p></div>
            <h3 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">Make the website reflect your school</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">Choose an editable colour palette and review a live preview. Theme drafts are stored privately until you publish them.</p>
          </div>
          <button type="button" onClick={() => setThemePreviewExpanded((current) => !current)} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
            <Eye size={16} /> {themePreviewExpanded ? "Hide preview" : "Preview changes"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WEBSITE_THEME_PRESETS.map((preset) => {
            const selected = WEBSITE_THEME_COLORS.every(([field]) => draftTheme[field].toLowerCase() === preset.theme[field].toLowerCase());
            return (
              <button key={preset.name} type="button" onClick={() => setForm((current) => ({ ...current, website_theme_draft: { ...preset.theme, font_style: draftTheme.font_style, button_style: draftTheme.button_style } }))} className={"flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 " + (selected ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30" : "border-slate-200 hover:border-slate-300 dark:border-slate-700")}>
                <span className="flex shrink-0 overflow-hidden rounded-lg border border-black/10">
                  <span className="h-9 w-3" style={{ backgroundColor: preset.theme.primary }} />
                  <span className="h-9 w-3" style={{ backgroundColor: preset.theme.secondary }} />
                  <span className="h-9 w-3" style={{ backgroundColor: preset.theme.accent }} />
                </span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-900 dark:text-white">{preset.name}</span><span className="block text-xs text-slate-500 dark:text-slate-400">Editable preset</span></span>
                {selected && <CheckCircle2 size={16} className="shrink-0 text-emerald-700" />}
              </button>
            );
          })}
          <button type="button" onClick={() => setForm((current) => ({ ...current, website_theme_draft: normalizeWebsiteTheme(current.website_theme_draft) }))} className="flex min-h-16 items-center gap-3 rounded-xl border border-dashed border-slate-300 p-3 text-left transition hover:border-blue-400 dark:border-slate-700">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><Palette size={18} /></span>
            <span><span className="block text-sm font-bold text-slate-900 dark:text-white">Custom school colours</span><span className="block text-xs text-slate-500 dark:text-slate-400">Keep current selections</span></span>
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WEBSITE_THEME_COLORS.map(([field, label]) => (
            <div key={field} className="min-w-0 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <label htmlFor={"theme-" + field} className="block text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</label>
              <div className="mt-2 flex items-center gap-2">
                <input id={"theme-" + field} aria-label={label + " colour picker"} type="color" value={/^#[0-9a-f]{6}$/i.test(String(form.website_theme_draft?.[field] || "")) ? form.website_theme_draft[field] : DEFAULT_WEBSITE_THEME[field]} onChange={(event) => changeTheme(field, event.target.value)} className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700" />
                <input aria-label={label + " hexadecimal value"} value={form.website_theme_draft?.[field] ?? ""} onChange={(event) => changeTheme(field, event.target.value)} spellCheck={false} maxLength={7} className="min-w-0 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm uppercase text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Typography style
            <select value={draftTheme.font_style} onChange={(event) => changeTheme("font_style", event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
              <option value="modern">Modern sans-serif</option><option value="classic">Classic serif headings</option><option value="humanist">Humanist sans-serif</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Button style
            <select value={draftTheme.button_style} onChange={(event) => changeTheme("button_style", event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
              <option value="solid">Solid</option><option value="outline">Outline</option><option value="soft">Soft background</option>
            </select>
          </label>
        </div>

        {themeWarnings.length > 0 && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><p className="font-bold">Review colour contrast before publishing</p><ul className="mt-1 list-disc pl-5">{themeWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}

        {themePreviewExpanded && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3" style={{ backgroundColor: draftTheme.header, color: draftTheme.heading, borderColor: draftTheme.primary + "33", fontFamily: draftTheme.font_style === "classic" ? "Georgia, serif" : draftTheme.font_style === "humanist" ? "Trebuchet MS, sans-serif" : "Inter, ui-sans-serif, system-ui" }}>
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black text-white" style={{ backgroundColor: draftTheme.primary }}>S</span><div><p className="font-extrabold">{form.name || school?.name || "Your school"}</p><p className="text-xs opacity-70">Official school website</p></div></div>
              <span className="text-xs font-semibold">Home · About · Academics · Contact</span>
            </div>
            <div className="grid gap-5 p-5 sm:grid-cols-[1.25fr_.75fr] sm:p-7" style={{ backgroundColor: draftTheme.background, color: draftTheme.body, fontFamily: draftTheme.font_style === "classic" ? "Georgia, serif" : draftTheme.font_style === "humanist" ? "Trebuchet MS, sans-serif" : "Inter, ui-sans-serif, system-ui" }}>
              <div><span className="inline-flex rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: draftTheme.primary + "18", color: draftTheme.primary }}>WELCOME</span><h4 className="mt-4 text-2xl font-black" style={{ color: draftTheme.heading }}>{form.homepage_title || form.name || school?.name || "Your school"}</h4><p className="mt-3 max-w-lg text-sm leading-6">{form.public_description || form.about || form.description || "Your approved school introduction will appear here."}</p><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-lg px-4 py-2 text-sm font-bold" style={{ backgroundColor: draftTheme.button_style === "soft" ? draftTheme.primary + "18" : draftTheme.button_style === "outline" ? "transparent" : draftTheme.primary, color: draftTheme.button_style === "soft" ? draftTheme.primary : "#ffffff", border: draftTheme.button_style === "outline" ? "1px solid " + draftTheme.primary : "1px solid transparent" }}>Explore the school</span><span className="rounded-lg border px-4 py-2 text-sm font-bold" style={{ borderColor: draftTheme.accent, color: draftTheme.secondary }}>Contact us</span></div></div>
              <div className="rounded-xl border p-4" style={{ borderColor: draftTheme.primary + "33", backgroundColor: draftTheme.surface }}><div className="h-2 w-16 rounded-full" style={{ backgroundColor: draftTheme.accent }} /><h5 className="mt-4 font-bold" style={{ color: draftTheme.heading }}>School information</h5><p className="mt-2 text-sm leading-6">Preview the palette against the school's actual content before publication.</p><div className="mt-4 rounded-lg p-3 text-xs font-semibold text-white" style={{ backgroundColor: draftTheme.footer }}>Footer and navigation colour</div></div>
            </div>
          </div>
        )}

        <div className="flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center">
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Changes are school-specific. Saving a draft does not change the public website. Publishing requires a successful server response.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={resetThemeDraft} disabled={themeSaving} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"><RotateCcw size={15} />Reset to default</button>
            <button type="button" onClick={() => void saveTheme(false)} disabled={themeSaving || Boolean(uploadingField)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200">{themeSaving ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}Save draft</button>
            <button type="button" onClick={() => void saveTheme(true)} disabled={themeSaving || Boolean(uploadingField) || themeWarnings.some((warning) => warning.includes("six-digit"))} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3.5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"><Globe size={15} />Publish theme</button>
          </div>
        </div>
      </section>

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300"><Globe size={18} /><p className="text-xs font-extrabold uppercase tracking-[0.15em]">Domains and URLs</p></div>
            <h3 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">Connect your school's own domain</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">Keep your RevelaCode address and optionally connect a domain registered with any registrar. A hostname is not active until the hosting provider confirms DNS and HTTPS.</p>
          </div>
          <button type="button" onClick={() => { setDomainNotice(""); void loadDomains().catch(() => {}); }} disabled={domainsLoading || Boolean(domainBusy)} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"><Globe size={15} />Refresh status</button>
        </div>

        {domainError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">{domainError}</div>}
        {domainNotice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">{domainNotice}</div>}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Platform website</p>
          <a href={publicUrl ? window.location.origin + publicUrl : window.location.origin} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm font-bold text-blue-700 underline decoration-blue-200 underline-offset-4 dark:text-blue-300">{publicUrl ? window.location.origin + publicUrl : "Save the public website slug to create the platform URL"}</a>
          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">This address remains available when a custom domain is connected.</p>
        </div>

        <form onSubmit={addDomain} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label htmlFor="elimu-custom-domain" className="block min-w-0 text-sm font-semibold text-slate-700 dark:text-slate-200">Custom hostname
            <input id="elimu-custom-domain" type="text" autoComplete="url" spellCheck={false} value={newDomainHostname} onChange={(event) => setNewDomainHostname(event.target.value)} placeholder="www.yourschool.ac.ke" maxLength={253} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
          </label>
          <div className="flex items-end"><button type="submit" disabled={Boolean(domainBusy) || domainsLoading || !newDomainHostname.trim()} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">{domainBusy === "add" ? <Loader size={16} className="animate-spin" /> : <Globe size={16} />} Add hostname</button></div>
        </form>

        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/25 dark:text-blue-100">
          <p className="font-bold">DNS setup</p>
          <p className="mt-1">After adding a hostname, copy the exact record type, host and target shown in its details into your registrar's DNS panel. DNS is managed at your registrar; RevelaCode does not buy or transfer your domain.</p>
          <p className="mt-1 text-xs">The hosting integration target {renderTarget ? <code className="break-all">{renderTarget}</code> : "will be shown once the backend's Render integration is configured"} comes from the deployment configuration, not an invented address.</p>
        </div>

        <div className="space-y-3">
          {domainsLoading && <p className="flex items-center gap-2 text-sm text-slate-500"><Loader size={16} className="animate-spin" />Loading domain statuses...</p>}
          {!domainsLoading && domains.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm leading-6 text-slate-500 dark:border-slate-700 dark:text-slate-400">No custom domains have been saved for this school yet. If domain management reports that the hosting integration is not configured, an administrator must add the backend Render API key and static-site service ID before this feature can operate.</div>}
          {domains.map((domain) => {
            const statusLabels = { pending_dns: "DNS verification pending", https_pending: "Waiting for HTTPS", routing_pending: "Waiting for routing", active: "Active · HTTPS confirmed", failed: "Needs attention" };
            const busy = domainBusy.endsWith(domain.id);
            return (
              <article key={domain.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><h4 className="break-all text-sm font-bold text-slate-950 dark:text-white">{domain.hostname}</h4>{domain.is_primary && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-200">Primary</span>}</div>
                    <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{statusLabels[domain.status] || domain.status || "Status unavailable"}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">DNS: {domain.verification_status || "unknown"} · HTTPS: {domain.https_status || "unknown"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void verifyDomain(domain)} disabled={Boolean(domainBusy) || domainsLoading} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200">{domainBusy === "verify:" + domain.id ? <Loader size={14} className="animate-spin" /> : <ShieldCheck size={14} />}Verify</button>
                    {!domain.is_primary && <button type="button" onClick={() => void makePrimaryDomain(domain)} disabled={Boolean(domainBusy) || domain.status !== "active" || domain.https_status !== "active"} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">Set primary</button>}
                    <button type="button" onClick={() => void removeDomain(domain)} disabled={Boolean(domainBusy)} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900/60 dark:text-rose-300"><RotateCcw size={14} />Remove</button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[["DNS record type", domain.dns?.record_type], ["DNS host/name", domain.dns?.host], ["DNS target/value", domain.dns?.value]].map(([label, value]) => <div key={label} className="min-w-0 rounded-lg bg-slate-50 p-3 dark:bg-slate-900"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p><p className="mt-1 break-all text-sm font-semibold text-slate-800 dark:text-slate-200">{value || "Not provided"}</p></div>)}
                </div>
                {domain.dns?.note && <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{domain.dns.note}</p>}
              </article>
            );
          })}
        </div>
      </section>

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
            <button type="button" disabled={saving || Boolean(uploadingField)} onClick={() => save()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
              {saving ? <Loader className="animate-spin" size={16} /> : <Save size={16} />} Save changes
            </button>
            <button type="button" disabled={saving || Boolean(uploadingField)} onClick={() => save(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? <Loader className="animate-spin" size={16} /> : <Globe size={16} />} Save & publish
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}