import React, { useCallback, useEffect, useMemo, useState } from "react";
import { readAccessToken, readTokenType } from "@/auth/tokenStorage.mjs";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  GitBranch,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
  XCircle,
} from "lucide-react";

const API_BASE = String(
  import.meta.env.VITE_REVELAAI_API_URL ||
  import.meta.env.VITE_REVELAAI_API_BASE ||
  "https://revelaai.onrender.com"
).replace(/\/+$/, "");

function authHeaders() {
  if (typeof window === "undefined") return { Accept: "application/json" };
  const token = readAccessToken();
  const type = readTokenType();
  return {
    Accept: "application/json",
    ...(token ? { Authorization: type + " " + token } : {}),
  };
}

async function readEndpoint(path, signal) {
  try {
    const response = await fetch(API_BASE + path, {
      method: "GET",
      headers: authHeaders(),
      credentials: "omit",
      cache: "no-store",
      signal,
    });
    const payload = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, payload };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      payload: null,
      error: error?.name === "AbortError" ? "timeout" : "network",
    };
  }
}

function coreEntry(cores, name) {
  if (!cores || typeof cores !== "object") return null;
  const aliases = {
    zero: ["zero", "core_zero", "core-zero", "ZERO"],
    one: ["one", "genesis", "core_one", "core-one", "ONE"],
    two: ["two", "mind", "infinite_mind", "core_two", "core-two", "TWO"],
  };
  for (const key of aliases[name] || [name]) {
    if (cores[key] && typeof cores[key] === "object") return cores[key];
  }
  return null;
}

function normalizeState(record, response, restricted = false) {
  if (!response) return { label: "Not checked", tone: "muted" };
  if (restricted && (response.status === 401 || response.status === 403)) {
    return { label: "Admin only", tone: "restricted" };
  }
  if (response.status === 401) return { label: "Sign-in needed", tone: "restricted" };
  if (response.status === 403) return { label: "Access restricted", tone: "restricted" };
  if (!response.ok) {
    return { label: response.status === 0 ? "Unreachable" : "Unavailable", tone: "down" };
  }

  const value = record && typeof record === "object" ? record : {};
  if (value.reachable === true || value.online === true) return { label: "Online", tone: "good" };
  if (value.reachable === false || value.online === false) return { label: "Offline", tone: "down" };

  const status = String(value.status || value.state || value.health || "").toLowerCase();
  if (["ok", "success", "healthy", "online", "ready", "shield_active", "active"].includes(status)) {
    return { label: "Online", tone: "good" };
  }
  if (["degraded", "partial", "warning"].includes(status)) return { label: "Degraded", tone: "warn" };
  if (["error", "failed", "offline", "unavailable", "disabled"].includes(status)) {
    return { label: status === "disabled" ? "Disabled" : "Unavailable", tone: "down" };
  }
  // A real dashboard response with returned counters proves the dashboard
  // operation completed; a generic 2xx without evidence only proves reachability.
  if (value.counts || ["threats_last_24h", "shields_active", "module_count"].some((key) => value[key] !== undefined)) {
    return { label: "Online", tone: "good" };
  }
  return { label: "Reachable", tone: "neutral" };
}

const TOOLS = [
  {
    key: "guardian",
    name: "Ecosystem Guardian",
    role: "Coordinated checks across the live core mesh and defensive tools",
    icon: ShieldCheck,
    action: "Run a full Guardian check across the RevelaCode ecosystem. Probe Core Zero, Genesis (Core One) and Infinite Mind (Core Two), run the Sci Defend defensive shield scan, and run Meta Engineer's read-only architecture scan. Report real results and blockers; do not repair, activate, execute candidate code, deploy, or merge anything.",
  },
  {
    key: "zero",
    name: "USECT-ZERO",
    role: "Diagnostics & guarded recovery",
    icon: Terminal,
    action: "Run USECT-ZERO diagnostics for the RevelaCode ecosystem. Report the real tool result and any blocker; do not apply repairs automatically.",
  },
  {
    key: "one",
    name: "Genesis · Core One",
    role: "Signed tools & invention proposals",
    icon: GitBranch,
    action: "Create a safe, reviewable tool through Genesis (Core One) that improves RevelaCode ecosystem monitoring. Return the proposal status only; do not activate or merge it.",
  },
  {
    key: "two",
    name: "Infinite Mind · Core Two",
    role: "Evidence-gated improvement",
    icon: Sparkles,
    action: "Propose one evidence-gated improvement through Infinite Mind (Core Two) for RevelaCode ecosystem orchestration. Return its actual proposal status; do not activate or merge anything.",
  },
  {
    key: "sci",
    name: "Sci Defend",
    role: "Defensive shield & threat review",
    icon: ShieldCheck,
    action: "Run the Sci Defend defensive shield scan now. Summarize the actual scan result and blockers. Keep the operation defensive and civilian only.",
  },
  {
    key: "meta",
    name: "Meta Engineer",
    role: "Read-only architecture intelligence",
    icon: Wrench,
    action: "Meta Engineer: scan architecture",
  },
];

const TONE_CLASSES = {
  good: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  down: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  warn: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  restricted: "border-slate-400/20 bg-slate-400/10 text-slate-300",
  neutral: "border-sky-400/20 bg-sky-400/10 text-sky-200",
  muted: "border-white/10 bg-white/5 text-slate-400",
};

function StatusGlyph({ tone }) {
  if (tone === "good") return <CheckCircle2 size={12} />;
  if (tone === "down") return <XCircle size={12} />;
  if (tone === "warn" || tone === "restricted") return <AlertTriangle size={12} />;
  return <Activity size={12} />;
}

export default function RevelaAIGuardianDock({ onAction }) {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkedAt, setCheckedAt] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [refreshError, setRefreshError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setRefreshError("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      const paths = [
        "/api/core-mesh/dashboard?refresh=1",
        "/api/usect-zero/health",
        "/api/meta-engineer/health",
        "/api/sci/shield/dashboard",
      ];
      const [mesh, zero, meta, sci] = await Promise.all(
        paths.map((path) => readEndpoint(path, controller.signal))
      );
      const meshData = mesh?.payload?.data || mesh?.payload || {};
      const cores = meshData?.cores || {};
      const zeroCore = coreEntry(cores, "zero");
      const oneCore = coreEntry(cores, "one");
      const twoCore = coreEntry(cores, "two");
      const meshUnavailable = !mesh?.ok;
      const meshBlockedState = mesh?.status === 401
        ? { label: "Mesh sign-in needed", tone: "restricted" }
        : mesh?.status === 403
          ? { label: "Mesh access restricted", tone: "restricted" }
          : { label: "Mesh unavailable", tone: "down" };
      const meshError = meshUnavailable
        ? (mesh?.status === 0
          ? (mesh?.error === "timeout" ? "Core Mesh request timed out." : "Core Mesh request could not reach the gateway; check CORS/network access.")
          : `Core Mesh returned HTTP ${mesh.status}: ${mesh?.payload?.error?.message || mesh?.payload?.message || mesh?.payload?.error?.code || "status details unavailable"}`)
        : ((!oneCore || !twoCore) ? "Core Mesh responded without all expected core records." : null);
      const zeroError = !zero?.ok
        ? (zero?.payload?.error?.message || zero?.payload?.message || (zero?.status === 0 ? "Health request could not reach the gateway." : `Health endpoint returned HTTP ${zero?.status}.`))
        : null;
      const sciError = (sci?.status === 401 || sci?.status === 403)
        ? "This endpoint requires a verified platform-admin session; restricted status does not prove the service is offline."
        : (!sci?.ok ? (sci?.payload?.error?.message || sci?.payload?.message || `Health endpoint returned HTTP ${sci?.status || "unknown"}.`) : null);
      const next = {
        mesh: normalizeState(meshData, mesh),
        guardian: { label: "On demand", tone: "neutral" },
        zero: normalizeState(zeroCore || zero?.payload?.data || zero?.payload, zero),
        one: oneCore ? normalizeState(oneCore, mesh) : meshUnavailable ? meshBlockedState : { label: "Unreported", tone: "muted" },
        two: twoCore ? normalizeState(twoCore, mesh) : meshUnavailable ? meshBlockedState : { label: "Unreported", tone: "muted" },
        meta: normalizeState(meta?.payload?.data || meta?.payload, meta),
        sci: normalizeState(sci?.payload?.data || sci?.payload, sci, true),
        details: {
          signedTools: oneCore?.active_signed_tools_count ?? meshData?.active_signed_tools_count,
          meshStatus: meshData?.mesh_status || meshData?.status || null,
          meshReason: meshError,
          zeroReason: zeroCore?.failure_reason || zero?.payload?.error?.message || zero?.payload?.message || zeroError,
          oneReason: oneCore?.failure_reason || (meshUnavailable ? meshError : (!oneCore ? "Core One status record is missing." : null)),
          twoReason: twoCore?.failure_reason || (meshUnavailable ? meshError : (!twoCore ? "Core Two status record is missing." : null)),
          sciReason: sciError,
          metaReason: !meta?.ok ? (meta?.payload?.error?.message || meta?.payload?.message || `Health endpoint returned HTTP ${meta?.status || "unknown"}.`) : null,
        },
      };
      // A reachable mesh endpoint does not mean a core is healthy. Respect each
      // core's own reachability boolean when it exists.
      if (oneCore?.reachable === true) next.one = { label: "Online", tone: "good" };
      else if (oneCore?.reachable === false) next.one = { label: "Offline", tone: "down" };
      if (twoCore?.reachable === true) next.two = { label: "Online", tone: "good" };
      else if (twoCore?.reachable === false) next.two = { label: "Offline", tone: "down" };
      if (zeroCore?.reachable === true) next.zero = { label: "Online", tone: "good" };
      else if (zeroCore?.reachable === false) next.zero = { label: "Offline", tone: "down" };
      setSnapshot(next);
      setCheckedAt(new Date());
      if (mesh?.status === 0 && zero?.status === 0 && meta?.status === 0) {
        setRefreshError("RevelaAI status endpoints could not be reached. Actions remain available and report their own blockers.");
      }
    } catch {
      setRefreshError("The live capability snapshot could not be refreshed.");
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return undefined;
  }, [refresh]);

  const onlineCount = useMemo(
    () => [snapshot?.zero, snapshot?.one, snapshot?.two, snapshot?.sci, snapshot?.meta]
      .filter((item) => item?.tone === "good").length,
    [snapshot]
  );

  return (
    <section className="mt-5 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 text-slate-100 shadow-xl shadow-black/10">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-300">
            <ShieldCheck size={18} />
          </div>
          <div className="min-w-0 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xs font-extrabold tracking-wide sm:text-sm">Guardian tool dock</h2>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                Live checks
              </span>
            </div>
            <p className="mt-0.5 text-[10px] leading-4 text-slate-400 sm:text-xs">
              {snapshot ? `${onlineCount}/5 operational endpoints confirmed` : "Checking the real service endpoints"}
              {checkedAt ? ` · checked ${checkedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-[10px] font-bold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
            aria-label="Refresh live AI tool status"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{loading ? "Checking" : "Refresh"}</span>
          </button>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse guardian tool dock" : "Expand guardian tool dock"}
          >
            <ChevronRight size={15} className={expanded ? "rotate-90" : ""} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-3 sm:p-4">
          {refreshError && (
            <p role="status" className="mb-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] px-3 py-2 text-[10px] leading-4 text-amber-100/80">
              {refreshError}
            </p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              const state = snapshot?.[tool.key] || { label: loading ? "Checking" : "Not checked", tone: "muted" };
              return (
                <article key={tool.key} className="min-w-0 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-left transition hover:border-white/15">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-emerald-200">
                        <Icon size={15} />
                      </span>
                      <h3 className="truncate text-[11px] font-bold sm:text-xs">{tool.name}</h3>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-1 text-[9px] font-bold ${TONE_CLASSES[state.tone] || TONE_CLASSES.muted}`}>
                      <StatusGlyph tone={state.tone} />
                      {state.label}
                    </span>
                  </div>
                  <p className="mt-2 min-h-8 text-[10px] leading-4 text-slate-400">{tool.role}</p>
                  <button
                    type="button"
                    onClick={() => onAction?.(tool.action)}
                    disabled={!onAction}
                    className="mt-2 inline-flex w-full items-center justify-between gap-2 rounded-lg border border-emerald-300/15 bg-emerald-300/[0.06] px-2.5 py-2 text-left text-[10px] font-bold text-emerald-100 transition hover:border-emerald-300/30 hover:bg-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span>{tool.key === "guardian" ? "Run ecosystem sweep" : tool.key === "meta" ? "Run read-only scan" : tool.key === "one" || tool.key === "two" ? "Request proposal" : tool.key === "sci" ? "Run defensive scan" : "Run diagnostics"}</span>
                    <ChevronRight size={12} />
                  </button>
                </article>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <div className="mt-0.5 text-sky-200"><Eye size={13} /></div>
            <p className="flex-1 text-[10px] leading-4 text-slate-400">
              Camera vision and voice chat are available from the composer. Status is endpoint evidence—not a guarantee that every tool operation will succeed. Tool actions report the real outcome in chat; proposals stay approval-gated.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
