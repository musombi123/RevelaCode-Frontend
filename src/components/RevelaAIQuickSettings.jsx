import React from "react";
import { Moon, Sun, Monitor, SlidersHorizontal } from "lucide-react";
import { useTheme } from "@/components/hooks/useTheme.jsx";

export default function RevelaAIQuickSettings({ settings = {}, updateSection, onOpenFull }) {
  const { theme, setTheme } = useTheme();
  const appearance = settings.appearance || {};
  const chooseTheme = (value) => {
    if (["light","dark","system"].includes(value)) setTheme(value);
    updateSection?.("appearance", { theme: value });
  };
  return <div className="w-72 rounded-2xl border border-slate-700 bg-slate-950 p-3 text-white shadow-2xl" data-demo="revelaai-quick-settings">
    <div className="mb-3 flex items-center justify-between"><b className="text-sm">Quick settings</b><button onClick={onOpenFull} className="text-xs text-emerald-300">All settings</button></div>
    <p className="mb-2 text-[11px] text-slate-400">Appearance</p>
    <div className="grid grid-cols-3 gap-2">{[["light",Sun,"Light"],["dark",Moon,"Dark"],["system",Monitor,"System"]].map(([id,Icon,label])=><button key={id} type="button" onClick={()=>chooseTheme(id)} aria-pressed={(appearance.theme||theme)===id} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl border text-xs ${(appearance.theme||theme)===id?"border-emerald-400/50 bg-emerald-400/10 text-emerald-200":"border-white/10 text-slate-300"}`}><Icon size={16}/>{label}</button>)}</div>
    <div className="mt-3"><label className="mb-1 flex items-center gap-2 text-xs text-slate-300"><SlidersHorizontal size={14}/> Message density</label><select value={appearance.density||"comfortable"} onChange={e=>updateSection?.("appearance",{density:e.target.value})} className="min-h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-sm"><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="spacious">Spacious</option></select></div>
  </div>;
}
