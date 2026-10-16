import React, { useState } from "react";
import { Camera, FileText, Film, Mic, Sparkles, X } from "lucide-react";
import VisionAnalyzer from "./VisionAnalyzer";
import VideoAnalyzer from "./VideoAnalyzer";
import VoiceOrb from "./VoiceOrb";

const tools = [
  { id: "vision", label: "Image & camera", icon: Camera, hint: "Read images and charts" },
  { id: "video", label: "Video", icon: Film, hint: "Summaries and scene analysis" },
  { id: "voice", label: "Voice", icon: Mic, hint: "Speak or dictate" },
];

const skillModes = [
  { label: "Negotiator", prompt: "Act as my deal negotiator. Help me prepare a fair, evidence-based negotiation strategy, likely objections, trade-offs, and a practical opening offer." },
  { label: "Faith & debate", prompt: "Use apologetics mode: build a respectful, logically rigorous argument grounded in relevant biblical passages and their context. Include counterarguments and avoid taking verses out of context." },
  { label: "Prophecy research", prompt: "Use prophecy research mode. Compare the question with biblical passages and historical context, distinguish established facts from interpretation, and do not present current events as certain prophetic fulfillment." },
  { label: "Business strategist", prompt: "Act as a practical business strategist. Identify the key decision, assumptions, risks, measurable options, and the highest-value next action. Do not invent access to my business records." },
  { label: "Teacher", prompt: "Teach me this topic like an excellent professor: start with the core idea, build step by step, give a real-world example, then test my understanding." },
  { label: "Creator", prompt: "Act as a creative partner. Help me develop a strong original deliverable, clarify the audience and objective, and produce a polished first version." },
];

export default function MultimodalStudio({ onAnalyze, onVoiceTranscript, onOpenFullVoice, busy = false }) {
  const [active, setActive] = useState("");
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-2 flex items-center gap-2 px-1"><Sparkles size={14} className="text-emerald-400"/><span className="text-[11px] font-semibold text-slate-400">REVELAAI V2 · MULTIMODAL STUDIO</span></div>
      <div className="grid grid-cols-3 gap-2">
        {tools.map(({ id, label, icon: Icon, hint }) => <button key={id} type="button" onClick={() => setActive(current => current === id ? "" : id)} aria-expanded={active === id} className={`flex min-w-0 flex-col items-start gap-2 rounded-xl border p-3 text-left transition sm:flex-row sm:items-center ${active === id ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"}`}><Icon size={18} className="shrink-0 text-emerald-300"/><span className="min-w-0"><span className="block truncate text-xs font-bold text-white">{label}</span><span className="mt-0.5 hidden text-[10px] text-slate-500 sm:block">{hint}</span></span></button>)}
      </div>
      <div className="mt-3">
        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Choose an intelligence mode</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {skillModes.map(mode => <button key={mode.label} type="button" onClick={() => onVoiceTranscript?.(mode.prompt)} className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-slate-300 hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-white">{mode.label}</button>)}
        </div>
      </div>
      {active && <div className="mt-3">
        {active === "vision" && <VisionAnalyzer onAnalyze={onAnalyze} onClose={() => setActive("")} busy={busy}/>}
        {active === "video" && <VideoAnalyzer onAnalyze={onAnalyze} onClose={() => setActive("")} busy={busy}/>}
        {active === "voice" && <div className="space-y-2"><VoiceOrb onTranscript={text => { onVoiceTranscript?.(text); setActive(""); }}/><button type="button" onClick={onOpenFullVoice} className="w-full rounded-xl border border-emerald-400/20 px-3 py-2.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/10">Open full duplex voice conversation</button></div>}
      </div>}
    </div>
  );
}
