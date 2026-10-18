import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, CheckCircle2, Clock3, Cpu, KeyRound,
  RefreshCw, ShieldCheck, Wifi, XCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";

const API_BASE = String(import.meta.env.VITE_REVELAAI_API_URL || import.meta.env.VITE_REVELAAI_API_BASE || "https://revelaai.onrender.com").replace(/\/+$/, "");

const cn = (...parts) => parts.filter(Boolean).join(" ");
const first = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");
const statusText = (value) => String(value || "unknown").replace(/[_-]/g, " ");
const formatTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

function statusTone(value) {
  const status = String(value || "").toLowerCase();
  if (["success", "healthy", "ready", "approved", "active", "completed"].some((x) => status.includes(x))) {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }
  if (["blocked", "unavailable", "disabled", "failed", "error", "rejected"].some((x) => status.includes(x))) {
    return "border-rose-400/20 bg-rose-400/10 text-rose-300";
  }
  if (["pending", "await", "unknown", "not configured"].some((x) => status.includes(x))) {
    return "border-amber-400/20 bg-amber-400/10 text-amber-200";
  }
  return "border-slate-700 bg-slate-800 text-slate-300";
}

function rowsFrom(data, keys) {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data?.[key])) return data.data[key];
  }
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

function requestId(row) {
  return first(row?.request_id, row?.requestId, row?.id, row?._id, row?.request?.id, row?.request?._id);
}

function Panel({ title, subtitle, icon: Icon, action, children }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1220]">
      <div className="flex flex-col gap-3 border-b border-slate-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-cyan-300">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function Metric({ label, value, detail, icon: Icon, tone = "cyan" }) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-400/5 text-cyan-200",
    green: "border-emerald-400/20 bg-emerald-400/5 text-emerald-200",
    amber: "border-amber-400/20 bg-amber-400/5 text-amber-200",
    violet: "border-violet-400/20 bg-violet-400/5 text-violet-200",
  };
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black capitalize tracking-tight text-white">{value ?? "—"}</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">{detail}</p>
        </div>
        <span className={cn("rounded-xl border p-2.5", tones[tone] || tones.cyan)}><Icon className="h-5 w-5" /></span>
      </div>
    </div>
  );
}

export default function UsectZeroConsole() {
  const auth = useAuth();
  const user = auth?.user;
  const [health, setHealth] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [issuedKeys, setIssuedKeys] = useState([]);
  const [issuedKeySecret, setIssuedKeySecret] = useState("");
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const getToken = useCallback(async () => {
    if (typeof auth?.getAccessToken === "function") return await auth.getAccessToken();
    return user?.accessToken || user?.access_token || "";
  }, [auth, user]);

  const request = useCallback(async (path, options = {}) => {
    const accessToken = await getToken();
    const response = await fetch(API_BASE + path, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: "Bearer " + String(accessToken).replace(/^Bearer\s+/i, "") } : {}),
        ...(options.headers || {}),
      },
    });
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { message: raw }; }
    if (!response.ok) {
      const error = new Error(data?.message || data?.error || data?.detail || data?.code || ("Request failed (" + response.status + ")"));
      error.status = response.status;
      error.payload = data;
      throw error;
    }
    return data;
  }, [getToken]);

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    setErrors({});
    const results = await Promise.allSettled([
      request("/api/usect-zero/health"),
      request("/api/usect-zero/keys/requests?status=pending_approval"),
      request("/api/usect-zero/keys/issued?status=active"),
      request("/api/usect-zero/activity"),
    ]);

    const nextErrors = {};
    if (results[0].status === "fulfilled") setHealth(results[0].value);
    else { setHealth(results[0].reason?.payload || null); nextErrors.health = results[0].reason?.message || "Health endpoint unavailable"; }

    if (results[1].status === "fulfilled") {
      setPendingRequests(rowsFrom(results[1].value, ["requests", "items", "key_requests", "keyRequests"]));
    } else {
      setPendingRequests([]);
      nextErrors.keys = results[1].reason?.message || "Key request endpoint unavailable";
    }

    if (results[2].status === "fulfilled") {
      setIssuedKeys(rowsFrom(results[2].value, ["keys", "items", "issued_keys", "issuedKeys"]));
    } else {
      setIssuedKeys([]);
      nextErrors.issued = results[2].reason?.message || "Issued-key endpoint unavailable";
    }

    if (results[3].status === "fulfilled") {
      setActivity(rowsFrom(results[3].value, ["items", "activity", "events"]));
    } else {
      setActivity([]);
      nextErrors.activity = results[3].reason?.message || "Activity endpoint unavailable";
    }

    setErrors(nextErrors);
    setLastUpdated(new Date());
    setLoading(false);
    setRefreshing(false);
  }, [request]);

  useEffect(() => { refresh(); }, [refresh]);

  const healthStatus = first(health?.status, health?.enabled === false ? "disabled" : "unknown");
  const pendingCount = pendingRequests.length;
  const issuedKeyCount = issuedKeys.length;
  const activityCount = activity.length;
  const recentActivity = useMemo(() => activity.slice(0, 25), [activity]);

  const approveRequest = async (row) => {
    const id = requestId(row);
    if (!id) {
      setErrors((old) => ({ ...old, keys: "This request has no readable request ID, so it cannot be approved from this screen." }));
      return;
    }
    if (!window.confirm("Approve this scoped developer-key request in USECT-ZERO? Review the requested scopes before continuing.")) return;
    setBusyId(String(id));
    setErrors((old) => ({ ...old, keys: "" }));
    setNotice("");
    try {
      const result = await request("/api/usect-zero/keys/requests/" + encodeURIComponent(String(id)) + "/approve", {
        method: "POST",
        body: JSON.stringify({ confirmation: "ISSUE_KEY", ttl_days: 90 }),
      });
      if (typeof result?.api_key === "string" && result.api_key.trim()) {
        // The issued credential is kept only in component memory and is never persisted.
        setIssuedKeySecret(result.api_key);
        setNotice("A developer key was issued once. Copy and store it securely; it cannot be retrieved later.");
      } else {
        setNotice("The server processed the approval. Refresh the pending queue and inspect the returned status.");
      }
      await refresh(true);
    } catch (error) {
      setErrors((old) => ({ ...old, keys: error?.message || "Approval failed." }));
    } finally {
      setBusyId("");
    }
  };

  const revokeIssuedKey = async (row) => {
    const id = first(row?.id, row?.key_id, row?.keyId);
    if (!id) {
      setErrors((old) => ({ ...old, issued: "This key has no readable identifier, so it cannot be revoked here." }));
      return;
    }
    if (!window.confirm("Revoke this active USECT-ZERO key? Applications using it will lose access immediately.")) return;

    const busyKey = "revoke:" + String(id);
    setBusyId(busyKey);
    setErrors((old) => ({ ...old, issued: "" }));
    setNotice("");
    try {
      await request("/api/usect-zero/keys/issued/" + encodeURIComponent(String(id)) + "/revoke", {
        method: "POST",
        body: JSON.stringify({ confirmation: "REVOKE_KEY" }),
      });
      setNotice("The key was revoked by the core. Refreshing the active-key list.");
      await refresh(true);
    } catch (error) {
      setErrors((old) => ({ ...old, issued: error?.message || "Key revocation failed." }));
    } finally {
      setBusyId("");
    }
  };

  const copyIssuedKey = async () => {
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        throw new Error("Clipboard is unavailable");
      }
      await navigator.clipboard.writeText(issuedKeySecret);
      setNotice("Key copied. Store it in a secret manager; it will not be shown again after you hide this panel.");
    } catch {
      setNotice("Automatic copying is unavailable. Select and copy the key manually before hiding this panel.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.08] via-slate-950 to-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><Cpu className="h-5 w-5" /></span>
          <div>
            <h2 className="text-base font-black text-white">USECT-ZERO control surface</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">Observe the server-side engineering tool bridge, inspect bounded tool receipts, and review pending scoped-key requests. Operations remain subject to core policy and required human approval.</p>
            <p className="mt-2 text-[10px] text-slate-500">{lastUpdated ? "Last refreshed " + lastUpdated.toLocaleTimeString() : "Connecting to the configured API…"}</p>
          </div>
        </div>
        <button type="button" onClick={() => refresh()} disabled={refreshing} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:border-cyan-400/30 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          {refreshing ? "Refreshing…" : "Refresh status"}
        </button>
      </div>

      {notice && <div role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-xs text-emerald-200">{notice}</div>}

      {(errors.health || errors.keys || errors.issued || errors.activity) && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs leading-5 text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <div className="min-w-0 space-y-1">
            <p className="font-bold">Some live admin data is unavailable.</p>
            {errors.health && <p>Core health: {errors.health}</p>}
            {errors.keys && <p>Key requests: {errors.keys}</p>}
            {errors.issued && <p>Issued keys: {errors.issued}</p>}
            {errors.activity && <p>Tool activity: {errors.activity}</p>}
          </div>
        </div>
      )}

      {issuedKeySecret && (
        <section role="alert" className="rounded-2xl border border-amber-300/30 bg-amber-300/[0.07] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black text-amber-100">Developer key — shown once</h3>
              <p className="mt-1 text-xs leading-5 text-amber-100/70">This secret is held only in this page's current memory. Copy it to your trusted secret manager now. USECT-ZERO stores only a hash and cannot return this value later.</p>
              <code className="mt-3 block select-all break-all rounded-xl border border-amber-200/15 bg-slate-950 p-3 font-mono text-xs text-slate-100">{issuedKeySecret}</code>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={copyIssuedKey} className="rounded-lg bg-amber-200 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-amber-100">Copy key</button>
                <button type="button" onClick={() => setIssuedKeySecret("")} className="rounded-lg border border-amber-200/20 px-3 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-200/10">Hide secret</button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Core status" value={statusText(healthStatus)} detail={health?.enabled ? "Configured through the server gateway" : "Check server-side feature flag and service URL"} icon={Wifi} tone={health?.enabled ? "green" : "amber"} />
        <Metric label="Execution policy" value={statusText(health?.execution_policy || "unknown")} detail="Reported by the USECT-ZERO core" icon={ShieldCheck} tone="cyan" />
        <Metric label="Pending key requests" value={pendingCount} detail="Requests awaiting administrator review" icon={KeyRound} tone={pendingCount ? "amber" : "green"} />
        <Metric label="Active developer keys" value={issuedKeyCount} detail="Scoped keys currently listed as active" icon={KeyRound} tone={issuedKeyCount ? "green" : "cyan"} />
        <Metric label="Recent tool outcomes" value={activityCount} detail="In-process history returned by this backend instance" icon={Activity} tone="violet" />
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <Panel title="Core health & safety posture" subtitle="Status supplied by the configured USECT-ZERO service." icon={ShieldCheck}>
          {loading && !health ? <p className="text-xs text-slate-500">Loading live core health…</p> : health ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase", statusTone(health.status))}>{statusText(health.status)}</span>
                <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase", health.offline_mode ? statusTone("active") : statusTone("online"))}>{health.offline_mode ? "Offline mode" : "Network mode"}</span>
                <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase", health.hardware_actuation ? statusTone("blocked") : statusTone("safe"))}>{health.hardware_actuation ? "Hardware actuation enabled" : "No hardware actuation"}</span>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><dt className="text-[10px] uppercase tracking-wide text-slate-500">Model-free core</dt><dd className="mt-1 text-sm font-semibold text-white">{health.model_free === false ? "No" : "Yes"}</dd></div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><dt className="text-[10px] uppercase tracking-wide text-slate-500">Feature enabled</dt><dd className="mt-1 text-sm font-semibold text-white">{health.enabled ? "Yes" : "No"}</dd></div>
              </dl>
              <p className="text-[11px] leading-5 text-slate-500">No secrets, absolute repository paths, or client-supplied administrator credentials are shown here.</p>
            </div>
          ) : <p className="text-xs leading-5 text-slate-500">No live health payload is available. The panel does not assume the core is healthy when the request fails.</p>}
        </Panel>

        <Panel title="Pending developer-key requests" subtitle="Review requested identity and scopes before approval. This screen never displays or creates a key secret." icon={KeyRound}>
          {loading && pendingRequests.length === 0 ? <p className="text-xs text-slate-500">Loading pending requests…</p> : pendingRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 px-4 py-8 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-300" />
              <p className="mt-2 text-sm font-semibold text-white">No pending requests returned</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">If requests should be present, check admin access and the core key-request service.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((row, index) => {
                const id = requestId(row);
                const nested = row?.request && typeof row.request === "object" ? row.request : row;
                const scopes = first(nested?.scopes, nested?.requested_scopes, nested?.requestedScopes, nested?.scope);
                const scopeList = Array.isArray(scopes) ? scopes : scopes ? [scopes] : [];
                const who = first(nested?.requester, nested?.requested_by, nested?.requestedBy, nested?.name, nested?.email, nested?.owner, "Unknown requester");
                return (
                  <article key={String(id || index)} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-bold text-white">{String(who)}</p>
                        <p className="mt-1 break-words text-[10px] text-slate-500">Request ID: {String(id || "not supplied")} · {formatTime(first(nested?.created_at, nested?.createdAt, nested?.requested_at))}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {scopeList.length ? scopeList.map((scope, scopeIndex) => <span key={String(scope) + scopeIndex} className="rounded-md border border-cyan-400/15 bg-cyan-400/5 px-2 py-1 font-mono text-[10px] text-cyan-200">{String(scope)}</span>) : <span className="text-[10px] text-amber-200">No scopes returned — review before approving</span>}
                        </div>
                        {nested?.reason && <p className="mt-2 break-words text-xs leading-5 text-slate-400">{String(nested.reason).slice(0, 300)}</p>}
                      </div>
                      <button type="button" disabled={!id || busyId === String(id)} onClick={() => approveRequest(row)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-200 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50">
                        {busyId === String(id) ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Approve request
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Active developer keys" subtitle="Revoke access using the key identifier. The console never displays raw keys or stored hashes." icon={KeyRound}>
        {issuedKeys.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 px-4 py-7 text-center">
            <KeyRound className="mx-auto h-6 w-6 text-slate-500" />
            <p className="mt-2 text-sm font-semibold text-white">No active keys returned</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">This can mean there are no active keys, or that the administrator-only key endpoint is unavailable.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {issuedKeys.map((row, index) => {
              const id = first(row?.id, row?.key_id, row?.keyId);
              const scopes = Array.isArray(row?.scopes) ? row.scopes : [];
              const busyKey = "revoke:" + String(id || "");
              return (
                <article key={String(id || index)} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-all font-mono text-xs font-bold text-slate-200">{String(id || "unknown key")}</p>
                        <span className={cn("rounded-full border px-2 py-1 text-[10px] font-bold uppercase", statusTone(row?.status || "active"))}>{statusText(row?.status || "active")}</span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500">Issued {formatTime(first(row?.created_at, row?.createdAt))} · Expires {formatTime(first(row?.expires_at, row?.expiresAt))}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {scopes.length ? scopes.map((scope, scopeIndex) => <span key={String(scope) + scopeIndex} className="rounded-md border border-cyan-400/15 bg-cyan-400/5 px-2 py-1 font-mono text-[10px] text-cyan-200">{String(scope)}</span>) : <span className="text-[10px] text-amber-200">No scope metadata returned</span>}
                      </div>
                    </div>
                    <button type="button" disabled={!id || (row?.status && row.status !== "active") || busyId === busyKey} onClick={() => revokeIssuedKey(row)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-rose-400/20 bg-rose-400/5 px-3 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-400/10 disabled:cursor-not-allowed disabled:opacity-50">
                      {busyId === busyKey ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                      {busyId === busyKey ? "Revoking…" : "Revoke key"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Recent tool activity" subtitle="A compact server-side execution receipt stream; it is deliberately bounded and excludes prompts and raw file inventories." icon={Activity}>
        {recentActivity.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 px-4 py-8 text-center">
            <Clock3 className="mx-auto h-6 w-6 text-slate-500" />
            <p className="mt-2 text-sm font-semibold text-white">No tool outcomes in this process yet</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">After the brain dispatches a supported USECT-ZERO tool, its actual outcome appears here. The history resets when this backend process restarts.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wide text-slate-500"><th className="px-2 py-3 font-semibold">Time</th><th className="px-2 py-3 font-semibold">Tool / operation</th><th className="px-2 py-3 font-semibold">Status</th><th className="px-2 py-3 font-semibold">HTTP</th><th className="px-2 py-3 font-semibold">Evidence summary</th></tr></thead>
              <tbody>
                {recentActivity.map((row, index) => (
                  <tr key={String(first(row.timestamp, row.operation) || index) + index} className="border-b border-slate-800/70 align-top last:border-0">
                    <td className="whitespace-nowrap px-2 py-3 text-[10px] text-slate-500">{formatTime(row.timestamp)}</td>
                    <td className="px-2 py-3"><p className="font-semibold text-slate-200">{String(row.name || "usect_zero").replace(/^usect_zero_/, "").replace(/[_-]/g, " ")}</p><p className="mt-1 text-[10px] text-slate-500">{statusText(row.operation)}</p>{row.error_code && <p className="mt-1 text-[10px] text-rose-300">{String(row.error_code)}</p>}</td>
                    <td className="px-2 py-3"><span className={cn("rounded-full border px-2 py-1 text-[10px] font-bold uppercase", statusTone(row.status))}>{statusText(row.status)}</span></td>
                    <td className="px-2 py-3 font-mono text-slate-400">{row.http_status ?? "—"}</td>
                    <td className="max-w-xs px-2 py-3 text-[10px] leading-5 text-slate-400"><pre className="max-w-xs whitespace-pre-wrap break-words">{JSON.stringify(row.result_summary || {}, null, 2)}</pre></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3 text-[10px] text-slate-500">
          <Clock3 className="h-3.5 w-3.5" />
          <span>History is in memory (maximum 50 records), is scoped to this application process, and is not durable audit storage.</span>
        </div>
      </Panel>
    </div>
  );
}
