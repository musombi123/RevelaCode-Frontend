import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle2,
  Fingerprint,
  Github,
  KeyRound,
  Loader2,
  Mail,
  Smartphone,
  Trash2,
  Unlink,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { resolveBackendBaseUrl } from "@/auth/backendUrl.mjs";
import MfaSettings from "./accounts/MfaSettings.jsx";

const baseUrl = resolveBackendBaseUrl(import.meta.env || {});

function decodeBase64Url(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = window.atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function encodeBase64Url(buffer) {
  if (!buffer) return null;
  const bytes = buffer instanceof ArrayBuffer
    ? new Uint8Array(buffer)
    : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function browserPublicKey(source = {}) {
  const options = { ...source, challenge: decodeBase64Url(source.challenge) };
  if (source.user?.id) options.user = { ...source.user, id: decodeBase64Url(source.user.id) };
  for (const key of ["allowCredentials", "excludeCredentials"]) {
    if (Array.isArray(source[key])) {
      options[key] = source[key].map((entry) => ({ ...entry, id: decodeBase64Url(entry.id) }));
    }
  }
  return options;
}

function publicKeyCredentialPayload(credential) {
  const response = credential.response || {};
  return {
    id: credential.id,
    rawId: encodeBase64Url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment || null,
    clientExtensionResults: credential.getClientExtensionResults?.() || {},
    response: {
      clientDataJSON: encodeBase64Url(response.clientDataJSON),
      attestationObject: encodeBase64Url(response.attestationObject),
      transports: response.getTransports?.() || [],
    },
  };
}

export default function AccountDashboard() {
  const { user, authFetch } = useAuth();
  const [account, setAccount] = useState(null);
  const [providerStatus, setProviderStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");
  const [phoneChallengeId, setPhoneChallengeId] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [passkeyName, setPasskeyName] = useState("This device");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const apiRequest = async (path, options = {}) => {
    if (!baseUrl) throw new Error("The RevelaCode backend URL is not configured.");
    if (typeof authFetch !== "function") throw new Error("Your RevelaCode session is not ready. Sign in again.");
    const response = await authFetch(String(baseUrl).replace(/\/+$/, "") + path, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || payload.error?.message || "The account security request failed.");
    }
    return payload;
  };

  const refreshAccount = async () => {
    setLoading(true);
    try {
      const [accountPayload, statusResponse] = await Promise.all([
        apiRequest("/api/identity/account", { method: "GET" }),
        fetch(String(baseUrl).replace(/\/+$/, "") + "/api/identity/providers", {
          headers: { Accept: "application/json" },
        }),
      ]);
      setAccount(accountPayload);
      setPhoneDraft(accountPayload.phone?.number || "");
      const statusPayload = await statusResponse.json().catch(() => ({}));
      setProviderStatus(statusPayload.providers || {});
    } catch (requestError) {
      setError(requestError?.message || "Could not load Account & Security.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAccount();
    // Refresh only when the authenticated account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const connectProvider = async (provider) => {
    setError("");
    setNotice("");
    if (!providerStatus[provider]?.enabled) {
      setError(provider + " sign-in has not been configured on the RevelaCode backend yet.");
      return;
    }
    setBusy("provider-" + provider);
    try {
      const client = window.Capacitor?.isNativePlatform?.() ? "android" : "web";
      const result = await apiRequest("/api/oauth/" + provider + "/link/start", {
        method: "POST",
        body: JSON.stringify({ client }),
      });
      const authorizationUrl = new URL(String(result.authorization_url || ""));
      const allowedHosts = {
        google: "accounts.google.com",
        microsoft: "login.microsoftonline.com",
        github: "github.com",
      };
      if (
        authorizationUrl.protocol !== "https:" ||
        authorizationUrl.hostname !== allowedHosts[provider]
      ) {
        throw new Error("The identity provider returned an unexpected authorization URL.");
      }
      window.location.assign(authorizationUrl.toString());
    } catch (requestError) {
      setError(requestError?.message || "Could not start provider linking.");
      setBusy("");
    }
  };

  const disconnectProvider = async (provider) => {
    if (!window.confirm("Disconnect " + provider + " sign-in from this RevelaCode account?")) return;
    setBusy("provider-" + provider);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest("/api/identity/providers/" + provider, { method: "DELETE" });
      setNotice(result.message || provider + " sign-in disconnected.");
      await refreshAccount();
    } catch (requestError) {
      setError(requestError?.message || "Could not disconnect this provider.");
    } finally {
      setBusy("");
    }
  };

  const requestPhoneCode = async () => {
    setBusy("phone");
    setError("");
    setNotice("");
    try {
      const result = await apiRequest("/api/identity/phone/link/request", {
        method: "POST",
        body: JSON.stringify({ phone: phoneDraft.trim() }),
      });
      setPhoneChallengeId(result.challenge_id || "");
      setPhoneCode("");
      setNotice(result.message || "A verification code was sent to your phone.");
    } catch (requestError) {
      setError(requestError?.message || "Could not send the phone verification code.");
    } finally {
      setBusy("");
    }
  };

  const verifyPhoneCode = async (event) => {
    event.preventDefault();
    if (!phoneChallengeId || !/^\d{6}$/.test(phoneCode)) {
      setError("Enter the six-digit SMS verification code.");
      return;
    }
    setBusy("phone-verify");
    setError("");
    setNotice("");
    try {
      const result = await apiRequest("/api/identity/phone/link/verify", {
        method: "POST",
        body: JSON.stringify({
          phone: phoneDraft.trim(),
          challenge_id: phoneChallengeId,
          code: phoneCode,
        }),
      });
      setPhoneChallengeId("");
      setPhoneCode("");
      setNotice(result.message || "Phone number verified.");
      await refreshAccount();
    } catch (requestError) {
      setError(requestError?.message || "Phone verification failed.");
    } finally {
      setBusy("");
    }
  };

  const addPasskey = async () => {
    if (!window.PublicKeyCredential || !navigator.credentials?.create) {
      setError("This browser does not support passkeys. Use an up-to-date browser on HTTPS.");
      return;
    }
    setBusy("passkey-add");
    setError("");
    setNotice("");
    try {
      const options = await apiRequest("/api/identity/passkeys/registration/options", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const credential = await navigator.credentials.create({
        publicKey: browserPublicKey(options.publicKey || {}),
      });
      if (!credential) throw new Error("Passkey registration was cancelled.");
      const payload = publicKeyCredentialPayload(credential);
      payload.response.transports = credential.response.getTransports?.() || [];
      const result = await apiRequest("/api/identity/passkeys/registration/verify", {
        method: "POST",
        body: JSON.stringify({
          challenge_id: options.challenge_id,
          name: passkeyName.trim() || "Passkey",
          credential: payload,
        }),
      });
      setNotice(result.message || "Passkey added.");
      await refreshAccount();
    } catch (requestError) {
      setError(requestError?.message || "Could not add a passkey.");
    } finally {
      setBusy("");
    }
  };

  const removePasskey = async (credentialId) => {
    if (!window.confirm("Remove this passkey from your RevelaCode account?")) return;
    setBusy("passkey-" + credentialId);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest("/api/identity/passkeys/" + encodeURIComponent(credentialId), {
        method: "DELETE",
      });
      setNotice(result.message || "Passkey removed.");
      await refreshAccount();
    } catch (requestError) {
      setError(requestError?.message || "Could not remove this passkey.");
    } finally {
      setBusy("");
    }
  };

  const linkedProviders = [
    { id: "google", label: "Google", detail: "Use your Google identity to sign in.", icon: Mail },
    { id: "microsoft", label: "Microsoft", detail: "Use a personal, work or school Microsoft account.", icon: Building2 },
    { id: "github", label: "GitHub", detail: "Use your GitHub account to sign in.", icon: Github },
  ];

  return (
    <Card className="overflow-hidden rounded-2xl shadow-md">
      <CardContent className="space-y-6 p-5 sm:p-6">
        <MfaSettings />

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Account & Security
          </div>
          <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
            Manage trusted sign-in methods for your one RevelaCode account.
          </p>
          {user && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user.fullName || user.full_name || "Account"} · {user.contact || user.email || ""}
            </p>
          )}
        </div>

        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200">{error}</div>}
        {notice && <div role="status" aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200">{notice}</div>}

        <section className="space-y-3">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Connected sign-in providers</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Link an identity after signing in to your existing RevelaCode account. Matching email addresses are never merged automatically.</p>
          </div>
          {loading && !account ? (
            <div className="flex items-center gap-2 py-5 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading connected accounts…</div>
          ) : (
            <div className="grid gap-3">
              {linkedProviders.map((provider) => {
                const Icon = provider.icon;
                const connected = account?.providers?.[provider.id] === true;
                const enabled = providerStatus[provider.id]?.enabled === true;
                const providerBusy = busy === "provider-" + provider.id;
                return (
                  <div key={provider.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><Icon className="h-5 w-5" /></span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                          {provider.label}
                          {connected && <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> Connected</span>}
                        </div>
                        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{provider.detail}</p>
                      </div>
                    </div>
                    {connected ? (
                      <Button disabled={Boolean(busy)} onClick={() => disconnectProvider(provider.id)}>
                        {providerBusy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Unlink className="mr-1 h-4 w-4" />}
                        Disconnect
                      </Button>
                    ) : (
                      <Button size="sm" disabled={!enabled || Boolean(busy)} onClick={() => connectProvider(provider.id)}>
                        {enabled ? "Connect" : "Not configured"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><Smartphone className="h-5 w-5" /></span>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Phone sign-in</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Verify a mobile number once, then use a one-time SMS code to sign in without a password.
              </p>
              {account?.phone?.verified && <p className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">Verified: {account.phone.number}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={phoneDraft}
              onChange={(event) => setPhoneDraft(event.target.value)}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+2547XXXXXXXX"
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <Button onClick={requestPhoneCode} disabled={!providerStatus.phone?.enabled || !phoneDraft.trim() || Boolean(busy)}>
              {busy === "phone" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Smartphone className="mr-2 h-4 w-4" />}
              {account?.phone?.verified ? "Change number" : "Verify phone"}
            </Button>
          </div>
          {!providerStatus.phone?.enabled && <p className="text-xs text-amber-700 dark:text-amber-300">SMS delivery is not configured on the backend yet. Phone sign-in remains unavailable until the SMS provider is configured.</p>}
          {phoneChallengeId && (
            <form onSubmit={verifyPhoneCode} className="flex flex-col gap-2 sm:flex-row">
              <input
                value={phoneCode}
                onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6-digit SMS code"
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm tracking-widest outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <Button type="submit" disabled={phoneCode.length !== 6 || Boolean(busy)}>
                {busy === "phone-verify" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Verify code
              </Button>
            </form>
          )}
        </section>

        <section className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"><Fingerprint className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">Passkeys</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Sign in using the screen lock, fingerprint, face recognition or a security key supported by your device. Your private key stays with your authenticator.
              </p>
            </div>
          </div>
          {window.PublicKeyCredential ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={passkeyName}
                onChange={(event) => setPasskeyName(event.target.value.slice(0, 80))}
                maxLength={80}
                placeholder="Passkey name"
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <Button onClick={addPasskey} disabled={Boolean(busy)}>
                {busy === "passkey-add" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Fingerprint className="mr-2 h-4 w-4" />}
                Add passkey
              </Button>
            </div>
          ) : (
            <p className="text-xs text-amber-700 dark:text-amber-300">Passkeys are not available in this browser or embedded WebView. Open RevelaCode in a supported HTTPS browser to add one.</p>
          )}
          <div className="space-y-2">
            {(account?.passkeys || []).length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">No passkeys are registered on this account.</p>
            ) : account.passkeys.map((passkey) => (
              <div key={passkey.credential_id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{passkey.name || "Passkey"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{passkey.device_type || "Authenticator"} · Added {passkey.created_at ? new Date(passkey.created_at).toLocaleDateString() : "recently"}</p>
                </div>
                <Button size="sm" variant="outline" disabled={Boolean(busy)} onClick={() => removePasskey(passkey.credential_id)}>
                  {busy === "passkey-" + passkey.credential_id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-start gap-2 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Keep at least one sign-in method on your account. RevelaCode blocks removal of your final login method. Existing authenticator-based MFA remains active across all sign-in methods.</p>
        </div>
      </CardContent>
    </Card>
  );
}
