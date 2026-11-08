import React, { useEffect, useState } from "react";
import { FileText, Loader2, Save, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";

const API_BASE_VALUE = String(import.meta.env.VITE_REVELACODE_API_URL || import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "https://revelacode-backend.onrender.com").trim();
const API_BASE = API_BASE_VALUE.endsWith("/") ? API_BASE_VALUE.slice(0, -1) : API_BASE_VALUE;

export default function WebsitePolicyManager({ tenantType, tenantId }) {
  const { authFetch } = useAuth();
  const [policies, setPolicies] = useState({ privacy_policy: "", cookie_policy: "", version: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!tenantType || !tenantId || typeof authFetch !== "function") {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await authFetch(`${API_BASE}/api/compliance/websites/${encodeURIComponent(tenantType)}/${encodeURIComponent(tenantId)}/policies`, { method: "GET" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.success === false) throw new Error(payload.message || "Could not load website policies.");
        if (active) setPolicies(payload.policies || { privacy_policy: "", cookie_policy: "", version: "1.0" });
      } catch (err) {
        if (active) setError(err.message || "Could not load website policies.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [tenantType, tenantId, authFetch]);

  const save = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const nextVersion = `${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36)}`;
      const response = await authFetch(`${API_BASE}/api/compliance/websites/${encodeURIComponent(tenantType)}/${encodeURIComponent(tenantId)}/policies`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privacy_policy: policies.privacy_policy,
          cookie_policy: policies.cookie_policy,
          version: nextVersion,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success === false) throw new Error(payload.message || "Could not save website policies.");
      setPolicies((current) => ({ ...current, version: payload.policies?.version || nextVersion, is_template: false }));
      setMessage("Website policies saved. Visitors will be asked to review the updated cookie policy version.");
    } catch (err) {
      setError(err.message || "Could not save website policies.");
    } finally {
      setSaving(false);
    }
  };

  if (!tenantId) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><FileText size={18}/></span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Privacy & cookie policies</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Review and complete the website policies before publishing. The starter text must be adjusted to match the real information you collect, your providers, purposes, retention periods and contact channels.</p>
        </div>
      </div>

      {loading ? <div className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Loader2 size={15} className="animate-spin"/> Loading policy documents…</div> : (
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">Privacy policy</span>
            <textarea rows={12} maxLength={30000} value={policies.privacy_policy || ""} onChange={(event) => setPolicies((current) => ({ ...current, privacy_policy: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs leading-5 text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"/>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">Cookie policy</span>
            <textarea rows={9} maxLength={20000} value={policies.cookie_policy || ""} onChange={(event) => setPolicies((current) => ({ ...current, cookie_policy: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs leading-5 text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"/>
          </label>
          {policies.is_template && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">These are starter templates, not a completed compliance review. List the actual cookies and embedded services used by your live website before publishing.</p>}
          {error && <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">{error}</p>}
          {message && <p role="status" className="text-xs text-emerald-700 dark:text-emerald-300">{message}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <p className="flex items-center gap-1.5 text-[11px] text-slate-500"><ShieldCheck size={13}/> Policy version: {policies.version || "1.0"}</p>
            <button type="button" onClick={save} disabled={saving || loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"><Save size={14}/>{saving ? "Saving…" : "Save policies"}</button>
          </div>
        </div>
      )}
    </section>
  );
}
