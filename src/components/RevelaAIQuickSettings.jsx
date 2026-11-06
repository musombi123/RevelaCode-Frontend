import React from "react";
import { Moon, Sun, Monitor, SlidersHorizontal, Settings2 } from "lucide-react";
import { useTheme } from "@/components/hooks/useTheme.jsx";

export default function RevelaAIQuickSettings({ settings = {}, updateSection, onOpenFull, onSearchModeChange }) {
  const { theme, setTheme } = useTheme();
  const appearance = settings.appearance || {};
  const mode = settings.search_research?.default_mode || "deep";

  const chooseTheme = (value) => {
    if (["light", "dark", "system"].includes(value)) setTheme(value);
    updateSection?.("appearance", { theme: value });
  };

  const themes = [
    ["light", Sun, "Light"],
    ["dark", Moon, "Dark"],
    ["system", Monitor, "System"],
  ];

  return (
    <section className="w-[min(19rem,calc(100vw-1.5rem))] rounded-2xl border border-line bg-popover p-3 text-fg shadow-2xl"
      data-demo="revelaai-quick-settings" aria-label="Quick settings">
      <div className="mb-3 flex items-center justify-between gap-3">
        <b className="text-sm">Quick settings</b>
        <button type="button" onClick={onOpenFull} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-accent hover:bg-accent/10">
          All settings
        </button>
      </div>

      <p className="mb-2 text-[11px] font-semibold text-fg-secondary">Appearance</p>
      <div className="grid grid-cols-3 gap-2" data-demo="theme-switch">
        {themes.map(([id, Icon, label]) => (
          <button key={id} type="button" onClick={() => chooseTheme(id)} aria-pressed={(appearance.theme || theme) === id}
            className={"flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl border text-xs font-semibold " +
              ((appearance.theme || theme) === id ? "border-accent/45 bg-accent/10 text-accent" : "border-line bg-surface text-fg-secondary hover:bg-surface-2")}>
            <Icon size={16}/>{label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[11px] font-semibold text-fg-secondary">Search mode</p>
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-surface-2 p-1">
          {["quick", "deep", "extreme"].map((value) => (
            <button key={value} type="button" onClick={() => {
              updateSection?.("search_research", { default_mode: value });
              onSearchModeChange?.(value);
            }} aria-pressed={mode === value}
              className={"min-h-10 rounded-lg px-2 text-[10px] font-bold capitalize " +
                (mode === value ? "bg-accent/15 text-accent" : "text-muted hover:bg-surface hover:text-fg")}>
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 flex items-center gap-2 text-xs text-fg-secondary">
          <SlidersHorizontal size={14}/> Message density
        </label>
        <select value={appearance.density || "comfortable"}
          onChange={(event) => updateSection?.("appearance", { density: event.target.value })}
          className="min-h-11 w-full rounded-xl border border-line bg-input px-3 text-sm text-fg outline-none focus:border-accent">
          <option value="compact">Compact</option>
          <option value="comfortable">Comfortable</option>
          <option value="spacious">Spacious</option>
        </select>
      </div>
      <div className="mt-3 border-t border-line pt-2 text-[10px] text-muted">
        <Settings2 size={12} className="mr-1 inline-block"/> Theme preference saves to your account when settings sync is available.
      </div>
    </section>
  );
}
