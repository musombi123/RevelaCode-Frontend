import React, { useEffect, useState } from "react";
import { Check, RotateCcw, Save, Settings2 } from "lucide-react";
import { useTheme } from "@/components/hooks/useTheme.jsx";

const SECTIONS = [
  ["appearance", "Appearance", "Theme, accent, typography and chat density"],
  ["language_region", "Language and region", "Interface language, AI language and regional formats"],
  ["ai_behavior", "AI behaviour", "Response style, tone, role and custom instructions"],
  ["search_research", "Search and research", "Regions, source preferences, citations and freshness"],
  ["images", "Images", "Aspect ratio, visual style and export defaults"],
  ["office_accounting", "Office and accounting", "Document templates, invoice identity and currency"],
  ["voice", "Voice", "Voice, language, speed and playback"],
  ["memory", "Memory and personalisation", "Memory controls and saved personalisation"],
  ["notifications", "Notifications", "Job updates, product news and quiet hours"],
  ["privacy", "Privacy and data", "History retention, exports and shared-link access"],
  ["accessibility", "Accessibility", "Screen readers, touch targets, captions and charts"],
  ["plan_usage", "Plan and usage", "Plan details, quotas and billing history"],
  ["models_mode", "Models and mode", "Quality preference and backup model policy"],
];

const defaults = {
  appearance: { theme: "system", accent: "emerald", font: "system", font_size: 16, density: "comfortable", message_width: "wide", style: "flat", code_theme: "dark", reduce_motion: false, high_contrast: false },
  language_region: { interface_language: "en", ai_reply_language: "auto", country: "KE", timezone: "Africa/Nairobi", date_format: "DD/MM/YYYY", number_format: "1,234.56", currency: "KES", units: "metric", week_start: "monday" },
  ai_behavior: { response_style: "balanced", tone: "friendly", reading_level: "general", role_preset: "developer", show_step_by_step: true, always_show_sources: true, ask_deep_search: true, about_me: "", custom_instructions: "" },
  search_research: { default_mode: "deep", preferred_regions: ["global", "africa"], preferred_languages: ["en"], trusted_sources: "", blocked_domains: "", citation_style: "APA", freshness: "any" },
  images: { aspect_ratio: "1:1", style: "natural", auto_enhance: true, save_format: "PNG", watermark: false },
  office_accounting: { document_language: "en", template: "professional", page_size: "A4", default_font: "Aptos", company_name: "", company_address: "", vat_region: "KE", vat_rate: 16, financial_year_start: "01-01", currency: "KES", export_format: "DOCX" },
  voice: { voice: "default", speed: 1, language: "en-KE", auto_read: false, mode: "push_to_talk" },
  memory: { enabled: true, paused: false },
  notifications: { email_jobs: true, in_app_jobs: true, daily_limits: true, plan_expiry: true, support_replies: true, product_news: false, quiet_start: "22:00", quiet_end: "07:00" },
  privacy: { history_enabled: true, auto_delete_days: 0, shared_links: "anyone_with_link" },
  accessibility: { screen_reader: false, large_targets: true, voice_captions: true, colour_blind_charts: true, keyboard_shortcuts: true },
  plan_usage: {},
  models_mode: { quality: "best", allow_backup: true },
};

function Field({ label, children, hint }) {
  return <label className="grid gap-1.5 text-sm"><span className="font-medium text-fg-secondary">{label}</span>{children}{hint && <span className="text-xs text-muted">{hint}</span>}</label>;
}
function Input({ value, onChange, ...props }) {
  return <input value={value ?? ""} onChange={(event) => onChange(event.target.value)} {...props} className="w-full rounded-xl border border-line bg-input px-3 py-2.5 text-sm text-fg outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20" />;
}
function Select({ value, onChange, options }) {
  return <select value={value ?? options[0][0]} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-line bg-input px-3 py-2.5 text-sm text-fg outline-none focus:border-accent/60">{options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select>;
}
function Toggle({ label, checked, onChange }) {
  return <label className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm"><span>{label}</span><input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-accent" /></label>;
}

export default function RevelaAISettingsPage({ settings = {}, updateSection, resetSection, saving, error }) {
  const [active, setActive] = useState("appearance");
  const { setTheme } = useTheme();
  const current = (section) => ({ ...defaults[section], ...(settings[section] || {}) });
  const set = (section, key, value) => updateSection?.(section, { [key]: value });
  useEffect(() => {
    const appearance = current("appearance");
    const theme = appearance.theme;
    if (["light", "dark", "system"].includes(theme)) {
      setTheme(theme);
    } else if (theme === "scheduled") {
      const applyScheduledTheme = () => {
        const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Nairobi", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
        const currentMinutes = Number(parts.find(part => part.type === "hour")?.value || 0) * 60 + Number(parts.find(part => part.type === "minute")?.value || 0);
        const [startHour,startMinute] = String(appearance.scheduled_start || "19:00").split(":").map(Number);
        const [endHour,endMinute] = String(appearance.scheduled_end || "07:00").split(":").map(Number);
        const start = startHour * 60 + startMinute, end = endHour * 60 + endMinute;
        const dark = start > end ? currentMinutes >= start || currentMinutes < end : currentMinutes >= start && currentMinutes < end;
        setTheme(dark ? "dark" : "light");
      };
      applyScheduledTheme();
      const timer = window.setInterval(applyScheduledTheme, 60000);
      return () => window.clearInterval(timer);
    }
  }, [settings.appearance, setTheme]);

  useEffect(() => {
    const appearance = current("appearance");
    const root = document.documentElement;
    const accents = { emerald:"#047857", blue:"#2563EB", violet:"#7C3AED", amber:"#B45309", rose:"#E11D48", cyan:"#0891B2" };
    const accent = appearance.accent === "custom" ? (appearance.custom_accent || accents.emerald) : (accents[appearance.accent] || accents.emerald);
    const match = String(accent).match(/^#([0-9a-f]{6})$/i);
    const rgb = match ? [parseInt(match[1].slice(0,2),16), parseInt(match[1].slice(2,4),16), parseInt(match[1].slice(4,6),16)].join(" ") : "5 150 105";
    root.style.setProperty("--accent-rgb", rgb);
    root.style.setProperty("--accent-hover-rgb", rgb);
    root.style.setProperty("--accent-soft-rgb", rgb);
    root.style.setProperty("--revelaai-accent", accent);
    root.style.fontSize = `${Math.max(13, Math.min(22, Number(appearance.font_size) || 16))}px`;
    root.style.setProperty("--revelaai-accent", appearance.accent === "custom" ? (appearance.custom_accent || "#10b981") : (accents[appearance.accent] || accents.emerald));
    root.style.setProperty("--revelaai-motion-duration", appearance.reduce_motion ? "0ms" : "180ms");
    root.dataset.revelaDensity = appearance.density || "comfortable";
    root.dataset.revelaChatStyle = appearance.style || "flat";
    root.dataset.revelaHighContrast = appearance.high_contrast ? "true" : "false";
    const fonts = { system:"system-ui, sans-serif", inter:"Inter, system-ui, sans-serif", serif:"Georgia, serif", dyslexia:"OpenDyslexic, Arial, sans-serif" };
    root.style.fontFamily = fonts[appearance.font] || fonts.system;
  }, [settings.appearance]);

  const section = current(active);
  const textArea = (key, label, example) => <Field label={label} hint={example}><textarea value={section[key] || ""} maxLength={1500} onChange={(event) => set(active, key, event.target.value)} rows={4} className="w-full resize-y rounded-xl border border-line bg-input px-3 py-2.5 text-sm text-fg outline-none placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/15" /><span className="text-right text-[11px] text-muted">{(section[key] || "").length}/1500</span></Field>;
  const textInput = (key, label) => <Field label={label}><Input value={section[key]} onChange={(value) => set(active, key, value)} /></Field>;
  const select = (key, label, options) => <Field label={label}><Select value={section[key]} options={options} onChange={(value) => set(active, key, value)} /></Field>;
  const toggle = (key, label) => <Toggle label={label} checked={section[key]} onChange={(value) => set(active, key, value)} />;

  return <div className="grid min-h-[28rem] gap-4 lg:grid-cols-[220px_minmax(0,1fr)]" data-demo="revelaai-settings-page">
    <aside className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible" aria-label="Settings sections">
      {SECTIONS.map(([id, title, desc]) => <button key={id} type="button" onClick={() => setActive(id)} aria-current={active === id ? "page" : undefined} className={`min-w-max rounded-xl px-3 py-2.5 text-left text-sm transition ${active === id ? "bg-accent/12 text-accent ring-1 ring-accent/25" : "text-muted hover:bg-surface-2 hover:text-fg"}`}><span className="block font-semibold">{title}</span><span className="hidden text-[10px] text-muted lg:block">{desc}</span></button>)}
    </aside>
    <section className="min-w-0 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="mb-5 flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-accent"><Settings2 size={17}/><span className="text-xs font-bold uppercase tracking-wider">Personal settings</span></div><h2 className="mt-1 text-xl font-bold text-fg">{SECTIONS.find(([id]) => id === active)?.[1]}</h2><p className="mt-1 text-xs text-muted">{SECTIONS.find(([id]) => id === active)?.[2]}</p></div><button type="button" onClick={() => resetSection?.(active)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-xs text-fg-secondary hover:bg-surface-2"><RotateCcw size={14}/> Reset</button></div>
      {active === "appearance" && <div className="grid gap-3 sm:grid-cols-2">
        <div data-demo="theme-switch">{select("theme","Theme",[["light","Light"],["dark","Dark"],["system","System"],["scheduled","Scheduled"]])}</div>
        {section.theme==="scheduled"&&<><Field label="Dark mode starts"><Input value={section.scheduled_start||"19:00"} onChange={value=>set(active,"scheduled_start",value)} type="time"/></Field><Field label="Light mode starts"><Input value={section.scheduled_end||"07:00"} onChange={value=>set(active,"scheduled_end",value)} type="time"/></Field></>}
        {select("accent","Accent colour",[["emerald","Emerald"],["blue","Blue"],["violet","Violet"],["amber","Amber"],["rose","Rose"],["cyan","Cyan"],["custom","Custom"]])}
        {section.accent==="custom"&&<Field label="Custom accent"><Input type="color" value={section.custom_accent||"#10b981"} onChange={value=>set(active,"custom_accent",value)}/></Field>}
        {select("font","Font",[["system","System"],["inter","Inter"],["serif","Serif"],["dyslexia","Dyslexia-friendly"]])}
        <Field label={`Font size · ${section.font_size}px`}><input type="range" min="13" max="22" value={section.font_size} onChange={(event) => set(active,"font_size",Number(event.target.value))} className="w-full accent-accent"/></Field>
        {select("density","Message density",[["compact","Compact"],["comfortable","Comfortable"],["spacious","Spacious"]])}
        {select("message_width","Message width",[["narrow","Narrow"],["wide","Wide"],["full","Full"]])}
        {select("style","Chat style",[["bubble","Bubbles"],["flat","Flat"]])}
        {select("code_theme","Code theme",[["dark","Dark"],["light","Light"],["system","System"]])}
        {toggle("reduce_motion","Reduce motion")}{toggle("high_contrast","High contrast")}
      </div>}
      {active === "language_region" && <div className="grid gap-3 sm:grid-cols-2">{select("interface_language","Interface language",[["en","English"],["sw","Kiswahili"],["fr","Français"]])}{select("ai_reply_language","AI reply language",[["auto","Auto"],["en","English"],["sw","Kiswahili"],["fr","French"]])}{textInput("country","Country code")}{textInput("timezone","Time zone")}{select("date_format","Date format",[["DD/MM/YYYY","DD/MM/YYYY"],["MM/DD/YYYY","MM/DD/YYYY"],["YYYY-MM-DD","YYYY-MM-DD"]])}{select("number_format","Number format",[["1,234.56","1,234.56"],["1 234,56","1 234,56"],["1.234,56","1.234,56"]])}{textInput("currency","Currency code")}{select("units","Measurement units",[["metric","Metric"],["imperial","Imperial"]])}{select("week_start","Week starts",[["monday","Monday"],["sunday","Sunday"]])}</div>}
      {active === "ai_behavior" && <div className="grid gap-3 sm:grid-cols-2">{select("response_style","Response style",[["concise","Concise"],["balanced","Balanced"],["detailed","Detailed"]])}{select("tone","Tone",[["friendly","Friendly"],["professional","Professional"],["teacher","Teacher"],["casual","Casual"]])}{select("reading_level","Reading level",[["simple","Simple"],["general","General"],["advanced","Advanced"]])}{select("role_preset","Role preset",[["student","Student"],["teacher","Teacher"],["business_owner","Business owner"],["farmer","Farmer"],["developer","Developer"],["researcher","Researcher"],["accountant","Accountant"]])}<div className="sm:col-span-2">{textArea("about_me","About me","Share only details you want RevelaAI to use when relevant.")}</div><div className="sm:col-span-2">{textArea("custom_instructions","How should RevelaAI respond?","Style and tone only. Safety, tools, permissions and plan limits cannot be overridden.")}</div>{toggle("show_step_by_step","Show step-by-step explanations")}{toggle("always_show_sources","Always show sources")}{toggle("ask_deep_search","Ask before Deep or Extreme search")}</div>}
      {active === "search_research" && <div className="grid gap-3 sm:grid-cols-2">{select("default_mode","Default search mode",[["quick","Quick"],["deep","Deep"],["extreme","Extreme"]])}{select("citation_style","Citation style",[["APA","APA"],["MLA","MLA"],["Chicago","Chicago"],["IEEE","IEEE"],["Harvard","Harvard"]])}{select("freshness","Freshness preference",[["any","Any time"],["year","Past year"],["month","Past month"],["week","Past week"]])}{textInput("trusted_sources","Preferred trusted sources (comma separated)")}{textInput("blocked_domains","Blocked domains (comma separated)")}</div>}
      {active === "images" && <div className="grid gap-3 sm:grid-cols-2">{select("aspect_ratio","Default aspect ratio",[["1:1","Square"],["16:9","Landscape"],["9:16","Portrait"],["4:3","4:3"],["3:2","3:2"]])}{select("style","Style preset",[["natural","Natural"],["photorealistic","Photorealistic"],["illustration","Illustration"],["cinematic","Cinematic"],["minimal","Minimal"]])}{select("save_format","Save format",[["PNG","PNG"],["JPEG","JPEG"],["WEBP","WEBP"]])}{toggle("auto_enhance","Auto-enhance prompts")}{toggle("watermark","Watermark (Plus)")}</div>}
      {active === "office_accounting" && <div className="grid gap-3 sm:grid-cols-2">{select("document_language","Document language",[["en","English"],["sw","Kiswahili"],["fr","French"]])}{select("template","Document template",[["professional","Professional"],["academic","Academic"],["business","Business"],["minimal","Minimal"]])}{select("page_size","Page size",[["A4","A4"],["Letter","Letter"]])}{textInput("default_font","Default font")}{textInput("company_name","Company name")}{textInput("company_address","Company address")}{textInput("vat_region","VAT region")}<Field label="VAT rate (%)"><Input type="number" value={section.vat_rate} onChange={(value) => set(active,"vat_rate",Number(value))}/></Field>{textInput("financial_year_start","Financial year start")}{textInput("currency","Default currency")}{select("export_format","Default export format",[["DOCX","DOCX"],["PDF","PDF"],["XLSX","XLSX"]])}</div>}
      {active === "voice" && <div className="grid gap-3 sm:grid-cols-2">{select("voice","Voice",[["default","Default"],["female","Female"],["male","Male"]])}{select("language","Voice language",[["en-KE","English (Kenya)"],["sw-KE","Kiswahili"]])}<Field label={`Voice speed · ${section.speed}x`}><input type="range" min="0.7" max="1.5" step="0.1" value={section.speed} onChange={(event) => set(active,"speed",Number(event.target.value))} className="w-full accent-accent"/></Field>{toggle("auto_read","Read replies automatically")}{select("mode","Voice mode",[["push_to_talk","Push-to-talk"],["hands_free","Hands-free"]])}<button type="button" onClick={() => window.dispatchEvent(new CustomEvent("revelaai:voice-test"))} className="min-h-12 rounded-xl border border-emerald-400/30 text-sm text-accent">Test voice</button></div>}
      {active === "memory" && <div className="grid gap-3">{toggle("enabled","Remember things about me")}{toggle("paused","Pause memory")}<p className="text-xs leading-5 text-muted">Memory controls here govern RevelaAI's preference feature. Sensitive information should not be stored unless you explicitly add it. Review and deletion of individual saved facts requires the connected memory-management API.</p></div>}
      {active === "notifications" && <div className="grid gap-2 sm:grid-cols-2">{toggle("email_jobs","Email when a job finishes")}{toggle("in_app_jobs","In-app job updates")}{toggle("daily_limits","Daily limit alerts")}{toggle("plan_expiry","Plan expiry alerts")}{toggle("support_replies","Support replies")}{toggle("product_news","Product news")}{textInput("quiet_start","Quiet hours start")}{textInput("quiet_end","Quiet hours end")}</div>}
      {active === "privacy" && <div className="grid gap-3 sm:grid-cols-2">{toggle("history_enabled","Save chat history")}{select("auto_delete_days","Auto-delete history",[["0","Never"],["30","30 days"],["90","90 days"],["365","365 days"]])}{select("shared_links","Who can see shared links",[["anyone_with_link","Anyone with the link"],["signed_in","Signed-in users only"],["private","Only me"]])}<p className="text-xs text-muted sm:col-span-2">Data export, account deletion and OAuth connection controls must use the account-security endpoints; this panel does not simulate those operations.</p></div>}
      {active === "accessibility" && <div className="grid gap-2">{toggle("screen_reader","Screen-reader friendly mode")}{toggle("large_targets","Large touch targets")}{toggle("voice_captions","Voice captions")}{toggle("colour_blind_charts","Colour-blind safe charts")}{toggle("keyboard_shortcuts","Enable keyboard shortcuts")}</div>}
      {active === "plan_usage" && <div className="rounded-xl border border-line p-4 text-sm text-fg-secondary"><p>Plan and quota values are read from RevelaCode entitlements and the productivity catalogue, not edited here.</p><button type="button" onClick={() => window.dispatchEvent(new CustomEvent("revelacode:premium-open",{detail:{planCode:""}}))} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-400 px-4 font-bold text-slate-950"><Save size={15}/> View plans</button></div>}
      {active === "models_mode" && <div className="grid gap-3 sm:grid-cols-2">{select("quality","Model preference",[["fast","Fast"],["best","Best quality"]])}{toggle("allow_backup","Allow backup model when the primary is unavailable")}</div>}
      <div className="mt-6 flex min-h-8 items-center justify-between border-t border-line pt-3 text-xs"><span className={error ? "text-amber-300" : "text-muted"} role="status">{error || (saving ? "Syncing settings…" : "Changes save automatically.")}</span><span className="inline-flex items-center gap-1 text-accent"><Check size={13}/> Applied immediately</span></div>
    </section>
  </div>;
}
