import React, { useEffect, useState } from "react";
import {
  Search, SlidersHorizontal, UserCircle2, Settings2, MoreHorizontal,
  ChevronDown, Activity
} from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import PremiumPlansStar from "@/premium/PremiumPlansStar.jsx";
import { useRevelaAISettings } from "@/ai/revelaAISettingsStore";
import RevelaAIQuickSettings from "@/components/RevelaAIQuickSettings";

const API = String(import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com").replace(/\/+$/, "");

function authHeaders() {
  try {
    const token = localStorage.getItem("revelacode_access_token") || localStorage.getItem("access_token") || localStorage.getItem("token");
    return token ? { Authorization: (localStorage.getItem("revelacode_token_type") || "Bearer") + " " + token } : {};
  } catch {
    return {};
  }
}

export default function RevelaAIHeaderControls({ modelTier = "Checking", onSearchModeChange }) {
  const [catalog, setCatalog] = useState(null);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const { user } = useAuth();
  const { settings, updateSection } = useRevelaAISettings();

  useEffect(() => {
    let active = true;
    fetch(API + "/api/productivity/catalog", { headers: authHeaders() })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (active) setCatalog(data); })
      .catch(() => { if (active) setCatalog(null); })
      .finally(() => { if (active) setCatalogLoaded(true); });
    return () => { active = false; };
  }, []);

  const search = catalog?.tools?.find((item) => item.id === "research_global");
  const remaining = Number(search?.remaining ?? 0);
  const limit = Number(search?.daily_limit ?? 0);
  const mode = settings.search_research?.default_mode || "deep";

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("revelaai:mode-updated", {
      detail: { mode: mode.charAt(0).toUpperCase() + mode.slice(1) },
    }));
  }, [mode]);

  useEffect(() => {
    if (!catalogLoaded) return;
    const item = catalog?.tools?.find((entry) => entry.id === "research_global");
    window.dispatchEvent(new CustomEvent("revelaai:quota-updated", {
      detail: item
        ? { remaining: Number(item.remaining ?? 0), limit: Number(item.daily_limit ?? 0) }
        : null,
    }));
  }, [catalog, catalogLoaded]);

  const changeMode = (value) => {
    updateSection("search_research", { default_mode: value });
    onSearchModeChange?.(value);
    window.dispatchEvent(new CustomEvent("revelaai:mode-updated", {
      detail: { mode: value.charAt(0).toUpperCase() + value.slice(1) },
    }));
  };

  const initials = String(user?.name || user?.full_name || user?.contact || "RC")
    .trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  const modeButtons = (
    <div className="flex items-center gap-1 rounded-xl border border-line bg-surface-2 p-1" aria-label="Search depth" data-demo="mode-switch">
      {["quick", "deep", "extreme"].map((value) => (
        <button key={value} type="button" onClick={() => changeMode(value)}
          aria-pressed={mode === value}
          className={"min-h-9 rounded-lg px-2.5 text-[10px] font-bold capitalize " + (mode === value ? "bg-accent/15 text-accent shadow-sm" : "text-muted hover:bg-surface hover:text-fg")}>
          {value}
        </button>
      ))}
    </div>
  );

  const quota = (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-2 py-1.5" data-demo="quota-ring"
      title={catalogLoaded && search ? ("Deep Search: " + remaining + " of " + limit + " remaining today") : "Search quota"}>
      {catalogLoaded && search ? (
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-accent/35 text-[10px] font-black text-accent">
          {remaining}
        </span>
      ) : (
        <span aria-hidden="true" className="h-8 w-8 animate-pulse rounded-full border-2 border-line bg-surface-2"/>
      )}
      <span className="text-left">
        <b className="block text-[10px] font-bold text-fg">Deep Search</b>
        {catalogLoaded ? (
          <span className="block text-[10px] text-muted">{search ? (remaining + " searches left") : "Quota unavailable"}</span>
        ) : (
          <span aria-label="Loading search quota" className="mt-1 block h-2 w-20 animate-pulse rounded-full bg-surface-3"/>
        )}
      </span>
    </div>
  );

  return (
    <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2" data-demo="ai-header-controls">
      <span className="hidden max-w-[150px] items-center gap-1.5 truncate rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1.5 text-[10px] font-bold text-accent sm:inline-flex"
        title={"Adaptive routing · model health: " + modelTier} data-demo="ai-model-tier">
        <Activity size={12}/><span className="truncate">Adaptive · {modelTier}</span>
      </span>

      <div className="hidden lg:block">{modeButtons}</div>

      <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("revelaai:research-open"))}
        aria-label="Open search" title="Search" className="hidden h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-fg-secondary hover:bg-surface-2 hover:text-fg md:flex">
        <Search size={17}/>
      </button>

      <div className="relative">
        <button type="button" onClick={() => { setQuickOpen((value) => !value); setAvatarOpen(false); }}
          aria-label="Quick settings and theme" title="Quick settings" aria-expanded={quickOpen}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-fg-secondary hover:bg-surface-2 hover:text-fg"
          data-demo="theme-switch">
          <SlidersHorizontal size={17}/>
        </button>
        {quickOpen && <div className="absolute right-0 top-12 z-[120]">
          <RevelaAIQuickSettings settings={settings} updateSection={updateSection} onSearchModeChange={changeMode}
            onOpenFull={() => { setQuickOpen(false); window.dispatchEvent(new CustomEvent("revelaai:settings-open")); }}/>
        </div>}
      </div>

      <div className="relative hidden sm:block">
        <button type="button" onClick={() => { setAvatarOpen((value) => !value); setQuickOpen(false); }}
          aria-label="Open account menu" aria-expanded={avatarOpen}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface-2 text-xs font-bold text-fg">
          {initials}
        </button>
        {avatarOpen && <div className="absolute right-0 top-12 z-[120] w-60 rounded-2xl border border-line bg-popover p-2 text-fg shadow-2xl">
          <div className="border-b border-line px-3 py-2">
            <b className="block truncate text-sm">{user?.name || user?.full_name || "RevelaCode account"}</b>
            <span className="block truncate text-[11px] text-muted">{user?.contact || user?.email || "Signed-in session"}</span>
          </div>
          <button type="button" onClick={() => { setAvatarOpen(false); window.dispatchEvent(new CustomEvent("revelaai:settings-open")); }}
            className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-xs text-fg-secondary hover:bg-surface-2 hover:text-fg">
            <Settings2 size={15}/> Personal settings
          </button>
          <button type="button" onClick={() => { setAvatarOpen(false); window.dispatchEvent(new CustomEvent("revelacode:premium-open", { detail: { planCode: "" } })); }}
            className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-xs text-fg-secondary hover:bg-surface-2 hover:text-fg">
            <UserCircle2 size={15}/> Plan and account
          </button>
        </div>}
      </div>

      <div className="sm:hidden relative">
        <button type="button" onClick={() => setOverflowOpen((value) => !value)} aria-label="More workspace controls"
          aria-expanded={overflowOpen} className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-fg-secondary">
          <MoreHorizontal size={18}/>
        </button>
        {overflowOpen && <div className="absolute right-3 top-14 z-[120] w-[min(300px,calc(100vw-1.5rem))] rounded-2xl border border-line bg-popover p-3 text-fg shadow-2xl">
          <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-fg">Search mode</span><ChevronDown size={14} className="text-muted"/></div>
          {modeButtons}
          <div className="mt-3">{quota}</div>
          <button type="button" onClick={() => { setOverflowOpen(false); window.dispatchEvent(new CustomEvent("revelaai:research-open")); }}
            className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-xs text-fg-secondary hover:bg-surface-2"><Search size={15}/> Open search</button>
        </div>}
      </div>

      <div className="hidden sm:block">{quota}</div>
      <PremiumPlansStar className="!h-10 !min-w-10 !px-2" />
    </div>
  );
}
