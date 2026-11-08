import React, { useEffect, useMemo, useState } from "react";
import { Cookie, ShieldCheck, Settings2, X } from "lucide-react";

const API_BASE_VALUE = String(
  import.meta.env.VITE_REVELACODE_API_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://revelacode-backend.onrender.com"
).trim();
const API_BASE = API_BASE_VALUE.endsWith("/") ? API_BASE_VALUE.slice(0, -1) : API_BASE_VALUE;

const DEFAULT_PREFERENCES = {
  essential: true,
  analytics: false,
  advertising: false,
  personalization: false,
};

function consentStorageKey(type, id) {
  return `revela_cookie_consent:${type}:${id}`;
}

function readConsentId(type, id) {
  const key = `revela_cookie_consent_id:${type}:${id}`;
  try {
    let value = localStorage.getItem(key);
    if (!value) {
      value = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, "")
        : `rc${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(key, value);
    }
    return value;
  } catch {
    return `rc${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  }
}

export default function WebsiteCompliance({ tenantType, tenantId, primary = "#047857" }) {
  const [policies, setPolicies] = useState(null);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [policyView, setPolicyView] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const storageKey = useMemo(
    () => consentStorageKey(tenantType, tenantId),
    [tenantType, tenantId]
  );

  useEffect(() => {
    if (!tenantType || !tenantId) return undefined;
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/compliance/websites/${encodeURIComponent(tenantType)}/${encodeURIComponent(tenantId)}/policies`,
          { headers: { Accept: "application/json" } }
        );
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.success === false) {
          throw new Error(payload.message || "Website privacy information is temporarily unavailable.");
        }
        if (!active) return;
        const currentPolicies = payload.policies || null;
        setPolicies(currentPolicies);
        try {
          const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
          if (saved?.preferences && saved?.policy_version === currentPolicies?.version) {
            setPreferences({ ...DEFAULT_PREFERENCES, ...saved.preferences, essential: true });
            setBannerOpen(false);
          } else {
            setBannerOpen(true);
          }
        } catch {
          setBannerOpen(true);
        }
      } catch (err) {
        if (!active) return;
        setError(err.message || "Could not load website privacy information.");
        setBannerOpen(true);
      }
    };
    load();
    return () => { active = false; };
  }, [tenantType, tenantId, storageKey]);

  const savePreferences = async (nextPreferences) => {
    if (!tenantType || !tenantId || !policies?.version) {
      setError("Cookie preferences cannot be saved until the current policy is available.");
      return;
    }
    setBusy(true);
    setError("");
    const normalized = {
      essential: true,
      analytics: nextPreferences.analytics === true,
      advertising: nextPreferences.advertising === true,
      personalization: nextPreferences.personalization === true,
    };
    try {
      const response = await fetch(
        `${API_BASE}/api/compliance/websites/${encodeURIComponent(tenantType)}/${encodeURIComponent(tenantId)}/cookie-consent`,
        {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            consent_id: readConsentId(tenantType, tenantId),
            policy_version: policies.version,
            preferences: normalized,
          }),
        }
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || "Your cookie preferences could not be saved.");
      }
      setPreferences(normalized);
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          preferences: normalized,
          policy_version: policies.version,
          saved_at: new Date().toISOString(),
        }));
      } catch {
        // The backend consent record remains authoritative if browser storage is blocked.
      }
      window.dispatchEvent(new CustomEvent("revelacode:cookie-consent-changed", {
        detail: { tenantType, tenantId, preferences: normalized },
      }));
      setBannerOpen(false);
      setCustomizing(false);
    } catch (err) {
      setError(err.message || "Your cookie preferences could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  if (!tenantType || !tenantId) return null;

  return (
    <>
      <div className="fixed bottom-3 right-3 z-[90]">
        <button
          type="button"
          onClick={() => { setBannerOpen(true); setCustomizing(true); }}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-300 bg-white/95 px-3.5 py-2 text-xs font-bold text-slate-800 shadow-lg backdrop-blur hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          <Settings2 size={14}/> Privacy & cookie settings
        </button>
      </div>

      {bannerOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-2 backdrop-blur-[2px] sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="website-cookie-title">
          <section className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100"><Cookie size={19}/></span>
                <div>
                  <h2 id="website-cookie-title" className="text-base font-black">Privacy & cookies</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Choose how this website may use optional cookies.</p>
                </div>
              </div>
              <button type="button" onClick={() => setBannerOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close cookie settings"><X size={17}/></button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Essential storage is used for core website operation and security. Optional analytics, advertising and personalization remain off unless you choose to allow them. You can change your choice later using Privacy & cookie settings.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <button type="button" onClick={() => setPolicyView("privacy")} className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">Privacy policy</button>
              <button type="button" onClick={() => setPolicyView("cookies")} className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">Cookie policy</button>
            </div>

            {policyView && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold">{policyView === "privacy" ? "Privacy policy" : "Cookie policy"}</h3>
                  <button type="button" onClick={() => setPolicyView("")} className="text-xs font-semibold text-slate-500 underline">Close</button>
                </div>
                <pre className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap break-words font-sans text-xs leading-5 text-slate-600">{policyView === "privacy" ? policies?.privacy_policy : policies?.cookie_policy}</pre>
              </div>
            )}

            {customizing && (
              <div className="mt-4 space-y-3 rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-sm font-bold">Essential</p><p className="text-xs text-slate-500">Required for core functions and security.</p></div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">Always on</span>
                </div>
                {[
                  ["analytics", "Analytics", "Helps the website owner understand site usage."],
                  ["advertising", "Advertising", "Allows advertising-related storage or measurement."],
                  ["personalization", "Personalization", "Remembers optional preferences and tailored settings."],
                ].map(([key, label, description]) => (
                  <label key={key} className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <span><span className="block text-sm font-semibold">{label}</span><span className="mt-0.5 block text-xs text-slate-500">{description}</span></span>
                    <input type="checkbox" checked={preferences[key] === true} onChange={(event) => setPreferences((current) => ({ ...current, [key]: event.target.checked }))} className="h-4 w-4 accent-emerald-700"/>
                  </label>
                ))}
              </div>
            )}

            {error && <p role="alert" className="mt-3 text-xs text-rose-700">{error}</p>}
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <button type="button" onClick={() => savePreferences({ ...DEFAULT_PREFERENCES, analytics: true, advertising: true, personalization: true })} disabled={busy} className="min-h-11 rounded-xl px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50" style={{ backgroundColor: primary }}>Accept all</button>
              <button type="button" onClick={() => savePreferences(DEFAULT_PREFERENCES)} disabled={busy} className="min-h-11 rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-bold text-slate-700 disabled:opacity-50">Reject optional</button>
              <button type="button" onClick={() => customizing ? savePreferences(preferences) : setCustomizing(true)} disabled={busy} className="min-h-11 rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-bold text-slate-700 disabled:opacity-50">{busy ? "Saving…" : customizing ? "Save choices" : "Customize"}</button>
            </div>
            <p className="mt-3 flex items-start gap-2 text-[10px] leading-4 text-slate-400"><ShieldCheck size={13} className="mt-0.5 shrink-0"/>Your choice is recorded for this website and policy version. This control does not authorize unrelated processing of personal information.</p>
          </section>
        </div>
      )}
    </>
  );
}
