// frontend/components/AccountDashboard.jsx
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mail, Facebook, Instagram, MessageCircle, Bot, Twitter, Linkedin, ShieldCheck, KeyRound, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx"; // <--- get logged-in user

const baseUrl = import.meta.env.VITE_REVELACODE_URL 
                || import.meta.env.VITE_BACKEND_URL 
                || import.meta.env.VITE_API_URL;

const initialIntegrations = [
  { name: "Google", icon: Mail, oauth: true },
  { name: "Facebook", icon: Facebook, oauth: true },
  { name: "Instagram", icon: Instagram, oauth: true },
  { name: "TikTok", icon: MessageCircle, oauth: true },
  { name: "LinkedIn", icon: Linkedin, oauth: true },
  { name: "Twitter", icon: Twitter, oauth: true },
  { name: "WhatsApp", icon: MessageCircle, oauth: true },
  { name: "ChatGPT", icon: Bot, oauth: false },
];

export default function AccountDashboard() {
  const { user, authFetch, login } = useAuth(); // use the existing central RevelaCode session
  const [integrations, setIntegrations] = useState(
    initialIntegrations.map((i) => ({ ...i, connected: false }))
  );
  const [loading, setLoading] = useState(false);
  const [mfaStatus, setMfaStatus] = useState({ enabled: false, recovery_codes_remaining: 0 });
  const [mfaSetup, setMfaSetup] = useState(null);
  const [mfaPassword, setMfaPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);
  const [mfaMessage, setMfaMessage] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [mfaRecoveryCodes, setMfaRecoveryCodes] = useState([]);

  // --- Fetch connected accounts from backend ---
  useEffect(() => {
    const fetchConnections = async () => {
      if (!user?.contact) return;
      try {
        const res = await fetch(`${baseUrl}/api/user/connections?contact=${user.contact}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setIntegrations((prev) =>
            prev.map((i) => ({
              ...i,
              connected: data.connectedAccounts?.includes(i.name) || i.name === "ChatGPT",
            }))
          );
        }
      } catch (err) {
        console.warn("Failed to fetch connected accounts:", err);
      }
    };
    fetchConnections();
  }, [user]);

  const mfaRequest = async (path, payload = null) => {
    const apiBase = String(baseUrl || "").trim().replace(/\/+$/, "");
    if (!apiBase) throw new Error("Backend URL is not configured.");
    const options = {
      method: payload ? "POST" : "GET",
      headers: payload ? { "Content-Type": "application/json" } : {},
    };
    if (payload) options.body = JSON.stringify(payload);
    const url = apiBase + path;
    const response = typeof authFetch === "function"
      ? await authFetch(url, options)
      : await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      throw new Error(data.message || data.error?.message || "Security request failed (" + response.status + ").");
    }
    return data;
  };

  useEffect(() => {
    let cancelled = false;
    const loadMfaStatus = async () => {
      if (!user || !authFetch) return;
      try {
        const status = await mfaRequest("/api/auth/mfa/status");
        if (!cancelled) setMfaStatus({
          enabled: Boolean(status.enabled),
          recovery_codes_remaining: Number(status.recovery_codes_remaining || 0),
        });
      } catch (error) {
        if (!cancelled) setMfaError(error.message || "Could not load authenticator status.");
      }
    };
    loadMfaStatus();
    return () => { cancelled = true; };
  }, [user?.id, authFetch]);

  const startMfaSetup = async () => {
    setMfaError("");
    setMfaMessage("");
    setMfaRecoveryCodes([]);
    if (!mfaPassword) {
      setMfaError("Enter your current password to begin setup.");
      return;
    }
    try {
      setMfaBusy(true);
      const setup = await mfaRequest("/api/auth/mfa/setup", { password: mfaPassword });
      setMfaSetup(setup);
      setMfaCode("");
      setMfaMessage("Scan the QR code with your authenticator app, or enter the manual setup key.");
    } catch (error) {
      setMfaError(error.message || "Could not start authenticator setup.");
    } finally {
      setMfaBusy(false);
    }
  };

  const enableMfa = async () => {
    setMfaError("");
    setMfaMessage("");
    if (!mfaSetup || !/^\d{6}$/.test(mfaCode.trim())) {
      setMfaError("Enter the current 6-digit authenticator code.");
      return;
    }
    try {
      setMfaBusy(true);
      const result = await mfaRequest("/api/auth/mfa/enable", { code: mfaCode.trim() });
      setMfaStatus({ enabled: true, recovery_codes_remaining: result.recovery_codes_remaining || result.recovery_codes?.length || 0 });
      setMfaRecoveryCodes(Array.isArray(result.recovery_codes) ? result.recovery_codes : []);
      // Replace the existing session with the backend-issued JWT that records
      // this newly verified second factor.
      if (result.access_token && typeof login === "function") {
        login({
          user,
          access_token: result.access_token,
          token_type: result.token_type || "Bearer",
        });
      }
      setMfaSetup(null);
      setMfaCode("");
      setMfaPassword("");
      setMfaMessage(result.message || "Authenticator verification is enabled. Save your recovery codes now.");
    } catch (error) {
      setMfaError(error.message || "Could not enable authenticator verification.");
    } finally {
      setMfaBusy(false);
    }
  };

  const disableMfa = async () => {
    setMfaError("");
    setMfaMessage("");
    if (!mfaPassword || !mfaCode.trim()) {
      setMfaError("Enter your current password and a valid authenticator or recovery code.");
      return;
    }
    try {
      setMfaBusy(true);
      const result = await mfaRequest("/api/auth/mfa/disable", { password: mfaPassword, code: mfaCode.trim() });
      setMfaStatus({ enabled: false, recovery_codes_remaining: 0 });
      setMfaRecoveryCodes([]);
      setMfaSetup(null);
      setMfaCode("");
      setMfaPassword("");
      setMfaMessage(result.message || "Authenticator verification has been disabled.");
    } catch (error) {
      setMfaError(error.message || "Could not disable authenticator verification.");
    } finally {
      setMfaBusy(false);
    }
  };

  const regenerateRecoveryCodes = async () => {
    setMfaError("");
    setMfaMessage("");
    if (!mfaPassword || !mfaCode.trim()) {
      setMfaError("Enter your current password and a valid authenticator or recovery code.");
      return;
    }
    try {
      setMfaBusy(true);
      const result = await mfaRequest("/api/auth/mfa/recovery-codes", { password: mfaPassword, code: mfaCode.trim() });
      setMfaRecoveryCodes(Array.isArray(result.recovery_codes) ? result.recovery_codes : []);
      setMfaStatus((current) => ({ ...current, recovery_codes_remaining: result.recovery_codes_remaining || result.recovery_codes?.length || 0 }));
      setMfaCode("");
      setMfaPassword("");
      setMfaMessage(result.message || "New recovery codes generated. Previous codes have been revoked.");
    } catch (error) {
      setMfaError(error.message || "Could not generate new recovery codes.");
    } finally {
      setMfaBusy(false);
    }
  };

  const handleConnect = async (platform) => {
    try {
      if (platform.connected) {
        alert(`✅ Already connected to ${platform.name}`);
        return;
      }

      if (platform.oauth) {
        // Redirect user to OAuth route
        window.location.href = `${baseUrl}/api/oauth/${platform.name.toLowerCase()}`;
        return;
      }

      // For non-OAuth (like ChatGPT), simple connect API call
      const res = await fetch(`${baseUrl}/api/connect/${platform.name.toLowerCase()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: user.contact }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert(`✅ Connected to ${platform.name}`);
        setIntegrations((prev) =>
          prev.map((i) =>
            i.name === platform.name ? { ...i, connected: true } : i
          )
        );
      } else {
        alert(`❌ Could not connect to ${platform.name}: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert(`❌ Error connecting to ${platform.name}: ${err.message}`);
    }
  };

  return (
    <Card className="shadow-md rounded-2xl overflow-hidden">
      <CardContent className="p-6 space-y-6">
        {/* --- Two-factor authentication --- */}
        <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-gray-900 dark:to-teal-950/20 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Two-factor authentication</h3>
                <span className={mfaStatus.enabled ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"}>
                  {mfaStatus.enabled ? "Enabled" : "Not enabled"}
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                Protect sign-in with a free authenticator app. No phone number, SMS, or subscription is required.
              </p>
            </div>
          </div>

          {(mfaError || mfaMessage) && (
            <div className={mfaError ? "mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200" : "mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"} role="status">
              {mfaError || mfaMessage}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-200 dark:bg-black/20 dark:ring-white/10">Authenticator app</span>
            <span className="rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-200 dark:bg-black/20 dark:ring-white/10">30-second codes</span>
            <span className="rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-200 dark:bg-black/20 dark:ring-white/10">Single-use recovery codes</span>
          </div>

          {!mfaStatus.enabled && !mfaSetup && (
            <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Current password</span>
                <input
                  type="password"
                  value={mfaPassword}
                  onChange={(event) => setMfaPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Confirm your password"
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-black/20 dark:text-white"
                />
              </label>
              <button type="button" onClick={startMfaSetup} disabled={mfaBusy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                <ShieldCheck className="h-4 w-4" /> {mfaBusy ? "Preparing..." : "Set up authenticator"}
              </button>
            </div>
          )}

          {mfaSetup && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-black/20">
              <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                {mfaSetup.qr_code_data_url && (
                  <div className="flex justify-center rounded-xl bg-white p-2">
                    <img src={mfaSetup.qr_code_data_url} alt="Authenticator QR code" className="h-40 w-40 object-contain" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Scan with your authenticator app</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">Or add the account manually using this secret. Keep it private.</p>
                  <code className="mt-2 block break-all rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm font-bold tracking-wider text-gray-900 dark:bg-white/10 dark:text-white">{mfaSetup.secret}</code>
                </div>
              </div>
              <label className="mt-4 block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Confirm with current 6-digit code</span>
                <input value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-center font-mono text-xl tracking-[0.35em] text-gray-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-gray-900 dark:text-white" />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={enableMfa} disabled={mfaBusy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                  <ShieldCheck className="h-4 w-4" /> {mfaBusy ? "Confirming..." : "Confirm and enable"}
                </button>
                <button type="button" onClick={() => { setMfaSetup(null); setMfaCode(""); setMfaPassword(""); }} disabled={mfaBusy} className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">Cancel setup</button>
              </div>
            </div>
          )}

          {mfaStatus.enabled && (
            <>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                {mfaStatus.recovery_codes_remaining} recovery codes remain. Keep unused codes somewhere separate from your device.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Current password</span>
                  <input type="password" value={mfaPassword} onChange={(event) => setMfaPassword(event.target.value)} autoComplete="current-password" placeholder="Confirm your password" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-black/20 dark:text-white" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Authenticator or recovery code</span>
                  <input value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} autoComplete="one-time-code" maxLength={32} placeholder="Current code" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-black/20 dark:text-white" />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={regenerateRecoveryCodes} disabled={mfaBusy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  <RefreshCw className="h-4 w-4" /> {mfaBusy ? "Working..." : "Regenerate recovery codes"}
                </button>
                <button type="button" onClick={disableMfa} disabled={mfaBusy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-200">
                  <KeyRound className="h-4 w-4" /> {mfaBusy ? "Working..." : "Disable 2FA"}
                </button>
              </div>
            </>
          )}

          {mfaRecoveryCodes.length > 0 && (
            <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
              <h4 className="font-semibold text-amber-950 dark:text-amber-100">Save these recovery codes now</h4>
              <p className="mt-1 text-xs leading-5 text-amber-900/80 dark:text-amber-200/80">Each one works once. RevelaCode stores only protected hashes, so these codes cannot be shown again after leaving this screen.</p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {mfaRecoveryCodes.map((code) => <code key={code} className="rounded-lg border border-amber-200 bg-white px-2 py-2 text-center font-mono text-xs font-bold tracking-wider text-slate-900 dark:border-amber-900/60 dark:bg-black/20 dark:text-amber-100">{code}</code>)}
              </div>
              <button type="button" onClick={() => setMfaRecoveryCodes([])} className="mt-3 min-h-10 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700">I have saved my recovery codes</button>
            </div>
          )}
        </section>

        {/* --- User Info --- */}
        {user && (
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-semibold text-indigo-600 dark:text-indigo-300">
              👤 Welcome, {user.fullName || "User"}!
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Contact: {user.contact} | Role: {user.role}
            </p>
          </div>
        )}

        {/* --- Connected Accounts Header --- */}
        <div className="text-center space-y-1">
          <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-300">
            🔗 Connected Accounts
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your linked platforms for a personalized experience.
          </p>
        </div>

        {/* --- Integrations Grid --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {integrations.map((platform) => {
            const Icon = platform.icon;
            return (
              <div
                key={platform.name}
                className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 transition-all"
              >
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100 font-medium">
                  <Icon className="w-5 h-5" />
                  {platform.name}
                </div>
                <Button
                  size="sm"
                  variant={platform.connected ? "secondary" : "default"}
                  disabled={platform.connected || loading}
                  onClick={() => handleConnect(platform)}
                >
                  {platform.connected ? "✓ Connected" : "Connect"}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-muted-foreground">
            Linking your accounts helps sync activity, share prophecy insights, and unlock assistant features.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
