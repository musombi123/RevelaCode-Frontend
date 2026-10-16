import React from "react";
import { BookOpen, BriefcaseBusiness, GraduationCap, Sprout, Sparkles } from "lucide-react";
import { LIVING_HUBS } from "./livingBrain";

const ICONS = { Sprout, BriefcaseBusiness, GraduationCap, BookOpen, Sparkles };

export default function LivingHubSelector({ value = "auto", onChange, compact = false, className = "" }) {
  const options = [{ id: "auto", label: "Auto", subtitle: "Global brain", icon: "Sparkles" }, ...LIVING_HUBS];
  return (
    <div className={"flex w-full flex-wrap items-center justify-center gap-2 " + className} role="group" aria-label="RevelaAI specialist hub">
      {options.map((hub) => {
        const Icon = ICONS[hub.icon] || Sparkles;
        const selected = value === hub.id;
        return (
          <button key={hub.id} type="button" onClick={() => onChange?.(hub.id)} aria-pressed={selected}
            className={"inline-flex min-h-9 items-center gap-2 rounded-full border px-3 " + (compact ? "py-1.5 text-[11px]" : "py-2 text-xs") + " font-semibold transition active:scale-[.98] " +
              (selected ? "border-emerald-300/50 bg-emerald-400/10 text-emerald-100 shadow-sm" : "border-white/10 bg-white/[.035] text-slate-400 hover:border-white/20 hover:text-white")}>
            <Icon size={14} aria-hidden="true" />
            <span>{hub.label}</span>
          </button>
        );
      })}
    </div>
  );
}
