import React from "react";
import {
  ArrowUpRight, Activity, BookOpen, Code2, Eye, FlaskConical, Lightbulb,
  Mic, ShieldCheck, Sparkles, Search, Image as ImageIcon, BarChart3,
  Calculator, Microscope, Bot, FileText, Presentation, FileSpreadsheet
} from "lucide-react";

const EXPLORERS = [
  {
    group: "LEARN",
    label: "Compare Scripture passages",
    detail: "Trace context, cross-references and different interpretations.",
    prompt: "Compare Romans 8:28 with Genesis 50:20. Explain the context, useful cross-references, and where the passages differ.",
    icon: BookOpen,
    tone: "text-chart-4 bg-chart-4/10 ring-chart-4/15",
  },
  {
    group: "BUILD",
    label: "Find the hidden bug",
    detail: "Share code, logs or a screenshot and work toward a verified fix.",
    prompt: "Help me debug a real software issue. Ask for the minimum missing context, inspect the evidence I provide, and give me a testable fix rather than guessing.",
    icon: Code2,
    tone: "text-chart-2 bg-chart-2/10 ring-chart-2/15",
  },
  {
    group: "DISCOVER",
    label: "Turn evidence into insight",
    detail: "Compare claims, sources, assumptions and what is still unknown.",
    prompt: "Teach me a useful concept through a real-world case study. Separate verified facts, assumptions, uncertainty and practical next steps.",
    icon: FlaskConical,
    tone: "text-chart-3 bg-chart-3/10 ring-chart-3/15",
  },
  {
    group: "PROTECT",
    label: "Explore a security weakness",
    detail: "Understand threats, assess exposure and plan safer systems.",
    prompt: "Help me assess a software security weakness defensively. Explain the risk, safe validation steps, mitigations and how to verify the fix.",
    icon: ShieldCheck,
    tone: "text-success bg-success/10 ring-success/15",
  },
];

const TOOLS = [
  ["Search", "/search", Search],
  ["Image", "/image", ImageIcon],
  ["Data", "/data", BarChart3],
  ["Accounting", "/ledger", Calculator],
  ["Science", "/quantum", Microscope],
  ["Robotics", "/robot", Bot],
  ["Publications", "/paper", BookOpen],
  ["Word", "/doc", FileText],
  ["PowerPoint", "/deck", Presentation],
  ["Spreadsheet", "/sheet", FileSpreadsheet],
];

function fillComposer(command) {
  window.dispatchEvent(new CustomEvent("revelaai:fill-composer", {
    detail: { text: command + " " },
  }));
}

export default function WelcomeScreen({ onSuggestion, onVoice, onVision, visionAvailable = true }) {
  return (
    <div className="hero-glow w-full rounded-[28px] px-1 pb-2 pt-5 text-center sm:px-3 sm:pt-7" data-demo="welcome-hero">
      <div className="mx-auto flex max-w-3xl flex-col items-center">
        <div className="relative flex h-[58px] w-[58px] items-center justify-center rounded-[20px] border border-accent/25 bg-surface shadow-lg shadow-accent/5 sm:h-[66px] sm:w-[66px]">
          <img src="/android-chrome-512x512.png" alt="RevelaCode" className="h-9 w-9 rounded-xl object-contain sm:h-11 sm:w-11"/>
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-surface bg-accent text-white">
            <Sparkles size={11}/>
          </span>
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.16em] text-accent sm:text-[10px]">
          <span className="h-1.5 w-1.5 rounded-full bg-accent"/>
          RevelaCode Intelligence · Adaptive routing
        </div>

        <h1 className="mt-4 max-w-2xl text-[2.15rem] font-black leading-[1.02] tracking-[-.055em] text-fg sm:text-5xl">
          Think beyond
          <span className="hero-title-gradient block pb-1">the prompt.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[13px] leading-6 text-fg-secondary sm:text-[15px] sm:leading-7">
          One intelligence layer for learning, building, discovery and protecting your RevelaCode workspace. Ask a question, share what you see, or put a real tool to work.
        </p>

        <div className="mt-5 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
          <button type="button" data-demo="ai-voice-button" onClick={() => onVoice?.()}
            className="group flex min-h-12 items-center justify-center gap-2 rounded-xl border border-accent/25 bg-accent/10 px-4 py-3 text-xs font-bold text-accent hover:border-accent/45 hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/60">
            <Mic size={15}/> Talk to RevelaAI <Activity size={14} className="ml-1 opacity-70"/>
          </button>
          <button type="button" data-demo="ai-vision-button" onClick={() => onVision?.()} disabled={!visionAvailable}
            className="group flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-xs font-bold text-fg-secondary hover:border-chart-2/40 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/50 disabled:cursor-wait disabled:opacity-50">
            <Eye size={15} className="text-chart-2"/> Explore with vision <ArrowUpRight size={13} className="ml-1 opacity-60"/>
          </button>
        </div>
      </div>

      <section className="mx-auto mt-7 w-full max-w-4xl text-left sm:mt-8" aria-labelledby="revelaai-suggestions-heading">
        <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-accent">Choose a direction</p>
            <h2 id="revelaai-suggestions-heading" className="mt-1 text-sm font-bold text-fg sm:text-base">Start with a question worth exploring</h2>
          </div>
          <span className="hidden items-center gap-1 text-[10px] text-muted sm:inline-flex">
            <ShieldCheck size={12}/> Grounded when evidence is available
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {EXPLORERS.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.group} type="button" onClick={() => onSuggestion?.(item.prompt)}
                className="group flex min-h-[82px] items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left hover:-translate-y-0.5 hover:border-accent/35 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/55 sm:min-h-[92px] sm:p-4">
                <span className={"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 " + item.tone}>
                  <Icon size={17}/>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[8px] font-extrabold tracking-[.16em] text-muted">{item.group}</span>
                  <span className="mt-1 block text-xs font-bold leading-5 text-fg sm:text-[13px]">{item.label}</span>
                  <span className="mt-1 block text-[10px] leading-4 text-fg-secondary">{item.detail}</span>
                </span>
                <ArrowUpRight size={13} className="mt-1 shrink-0 text-muted transition group-hover:text-accent"/>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-5 w-full max-w-4xl" aria-label="Quick tools">
        <div className="mb-2 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-[.16em] text-muted">
          <Sparkles size={12}/> Start with a tool
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {TOOLS.map(([label, command, Icon]) => (
            <button key={command} type="button" onClick={() => fillComposer(command)}
              className="inline-flex min-h-12 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[10px] font-semibold text-fg-secondary hover:border-accent/40 hover:bg-accent/8 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/50"
              aria-label={"Use " + label + " tool"} data-demo={"tool-chip-" + command.slice(1)}>
              <Icon size={13}/>{label}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pb-2 text-[9px] text-muted sm:text-[10px]">
        <span>Text + documents</span><span aria-hidden="true">·</span>
        <span>Voice + live vision</span><span aria-hidden="true">·</span>
        <span>Review-gated engineering</span>
      </div>
    </div>
  );
}
