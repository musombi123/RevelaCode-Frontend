import React, { useCallback, useEffect, useState } from "react";
import { Link2, RefreshCw, Unplug } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { resolveAdminBackendUrl } from "@/services/adminApi.jsx";

export default function GoogleAccountConnections() {
  const { authFetch } = useAuth();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch(`${resolveAdminBackendUrl()}/api/oauth/account`, { headers: { Accept: "application/json" } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.message || "Could not load connected sign-in methods.");
      setAccount(payload);
    } catch (err) {
      setError(err.message || "Could not load connected sign-in methods.");
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  const googleConnected = Boolean(account?.providers?.some(item => item.id === "google" && item.connected));

  async function disconnect() {
    if (!window.confirm("Disconnect Google sign-in? Make sure another login method is available.")) return;
    setBusy(true);
    setError("");
    try {
      const response = await authFetch(`${resolveAdminBackendUrl()}/api/oauth/google/disconnect`, { method: "DELETE", headers: { Accept: "application/json" } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.message || "Google could not be disconnected.");
      await load();
    } catch (err) {
      setError(err.message || "Google could not be disconnected.");
    } finally {
      setBusy(false);
    }
  }

  function connect() {
    if (window.Capacitor?.isNativePlatform?.()) {
      setError("The Android APK needs the Capacitor Browser system-browser integration before Google linking can be opened safely.");
      return;
    }
    window.location.assign(`${resolveAdminBackendUrl()}/api/oauth/google/start?mode=link&client=web`);
  }

  return (
    <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="font-semibold text-slate-900 dark:text-white">Connected sign-in providers</h3><p className="mt-1 text-xs text-slate-500">Connect a verified Google identity to this existing RevelaCode account.</p></div>
        <button type="button" onClick={load} disabled={loading} className="inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold dark:border-slate-700"><RefreshCw size={14} /> Refresh</button>
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">{error}</p>}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full border font-black text-blue-600">G</span><div><p className="text-sm font-semibold">Google</p><p className="text-xs text-slate-500">{loading ? "Checking…" : googleConnected ? "Connected" : "Not connected"}</p></div></div>
        {googleConnected ? <button type="button" disabled={busy} onClick={disconnect} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 disabled:opacity-50"><Unplug size={14} /> Disconnect</button> : <button type="button" onClick={connect} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white"><Link2 size={14} /> Connect Google</button>}
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">Google can only be connected when its verified email matches the email on this account. Staff roles are never granted by Google sign-in.</p>
    </section>
  );
}
