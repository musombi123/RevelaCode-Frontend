// src/components/WelcomeScreen.jsx
import React from "react";
import {
  ArrowUpRight,
  AudioLines,
  BookOpen,
  Code2,
  Eye,
  FlaskConical,
  Lightbulb,
  Mic,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const EXPLORERS = [
  {
    eyebrow: "THINK DEEPER",
    label: "Compare two Scripture passages",
    detail: "Trace context, cross-references and different interpretations.",
    prompt: "Compare Romans 8:28 with Genesis 50:20. Explain the context, useful cross-references, and where the passages differ.",
    icon: BookOpen,
    color: "amber",
  },
  {
    eyebrow: "BUILD SOMETHING",
    label: "Find the hidden bug",
    detail: "Share code, logs or a screenshot and work toward a verified fix.",
    prompt: "Help me debug a real software issue. Ask for the minimum missing context, inspect the evidence I provide, and give me a testable fix rather than guessing.",
    icon: Code2,
    color: "sky",
  },
  {
    eyebrow: "UNDERSTAND THE WORLD",
    label: "Turn evidence into insight",
    detail: "Compare claims, sources, assumptions and what is still unknown.",
    prompt: "Teach me a useful concept through a real-world case study. Separate verified facts, assumptions, uncertainty and practical next steps.",
    icon: FlaskConical,
    color: "violet",
  },
  {
    eyebrow: "MAKE A BETTER MOVE",
    label: "Explore a business opportunity",
    detail: "Surface risks, constraints and a practical first experiment.",
    prompt: "Help me evaluate a small business opportunity in Kenya. Ask for my budget and location if needed, identify risks, and design a low-cost experiment with measurable results.",
    icon: Lightbulb,
    color: "emerald",
  },
];

const COLOR_CLASSES = {
  amber: "bg-amber-300/10 text-amber-200 ring-amber-300/15 group-hover:bg-amber-300/15",
  sky: "bg-sky-300/10 text-sky-200 ring-sky-300/15 group-hover:bg-sky-300/15",
  violet: "bg-violet-300/10 text-violet-200 ring-violet-300/15 group-hover:bg-violet-300/15",
  emerald: "bg-emerald-300/10 text-emerald-200 ring-emerald-300/15 group-hover:bg-emerald-300/15",
};

export default function WelcomeScreen({
  onSuggestion,
  onVoice,
  onVision,
  visionAvailable = true,
}) {
  return (
    <div className="w-full animate-fade-in text-center">
      <div className="mx-auto flex max-w-3xl flex-col items-center">
        <div className="relative flex h-[68px] w-[68px] items-center justify-center rounded-[22px] border border-emerald-300/25 bg-gradient-to-br from-emerald-300/20 via-slate-900 to-sky-400/10 shadow-lg shadow-emerald-950/30 sm:h-[76px] sm:w-[76px]">
          <img
            src="/android-chrome-512x512.png"
            alt="RevelaCode"
            className="h-10 w-10 rounded-xl object-contain sm:h-12 sm:w-12"
          />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-slate-950 bg-emerald-300 text-slate-950">
            <Sparkles size={11} />
          </span>
        </div>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-100/80 sm:text-[10px]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
          RevelaCode Intelligence · Adaptive routing
        </div>

        <h1 className="mt-4 max-w-2xl text-3xl font-black leading-[1.06] tracking-tight text-white sm:text-5xl">
          Think beyond
          <span className="block bg-gradient-to-r from-emerald-200 via-teal-100 to-sky-200 bg-clip-text pb-1 text-transparent">
            the prompt.
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[13px] leading-6 text-slate-400 sm:text-[15px] sm:leading-7">
          One intelligence layer for learning, building, discovery and protecting your RevelaCode workspace. Ask a question, share what you see, or put a real tool to work.
        </p>

        <div className="mt-5 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onVoice?.()}
            className="group flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-xs font-bold text-emerald-100 transition hover:border-emerald-200/35 hover:bg-emerald-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
          >
            <Mic size={15} />
            Talk to RevelaAI
            <AudioLines size={14} className="ml-1 opacity-70" />
          </button>
          <button
            type="button"
            onClick={() => onVision?.()}
            disabled={!visionAvailable}
            className="group flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-xs font-bold text-slate-200 transition hover:border-sky-200/25 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/50 disabled:cursor-wait disabled:opacity-50"
          >
            <Eye size={15} className="text-sky-200" />
            Explore with vision
            <ArrowUpRight size={13} className="ml-1 opacity-60" />
          </button>
        </div>
      </div>

      <div className="mx-auto mt-7 w-full max-w-3xl text-left sm:mt-8">
        <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-emerald-200/65">Choose a direction</p>
            <h2 className="mt-1 text-sm font-bold text-slate-100 sm:text-base">Start with a question worth exploring</h2>
          </div>
          <span className="hidden items-center gap-1 text-[10px] text-slate-500 sm:inline-flex">
            <ShieldCheck size={12} />
            Grounded when evidence is available
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {EXPLORERS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onSuggestion?.(item.prompt)}
                className="group flex min-h-[94px] items-start gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.025] p-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50 sm:min-h-[102px] sm:p-4"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors ${COLOR_CLASSES[item.color]}`}>
                  <Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[8px] font-extrabold tracking-[0.16em] text-slate-500">{item.eyebrow}</span>
                  <span className="mt-1 block text-xs font-bold leading-5 text-slate-100 sm:text-[13px]">{item.label}</span>
                  <span className="mt-1 block text-[10px] leading-4 text-slate-400">{item.detail}</span>
                </span>
                <ArrowUpRight size={13} className="mt-1 shrink-0 text-slate-600 transition group-hover:text-slate-300" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[9px] text-slate-500 sm:text-[10px]">
        <span>Text + documents</span><span aria-hidden="true">·</span>
        <span>Voice + live vision</span><span aria-hidden="true">·</span>
        <span>Review-gated engineering</span>
      </div>
    </div>
  );
}
