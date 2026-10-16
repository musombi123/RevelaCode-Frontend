import React, { useEffect, useState } from "react";
import { Brain, Camera, FileText, Film, Mic, ShieldCheck, Sparkles } from "lucide-react";
import FreeVisionMath from "../FreeVisionMath";
import VideoAnalyzerFree from "../v2-free/VideoAnalyzerFree";
import VoiceOrbFree from "../v2-free/VoiceOrbFree";
import { assessEmotion, localMode, readLocalDocument, saveMemory, searchMemory } from "../v2-free/localIntelligence";

const modes = ["Negotiator", "Faith & debate", "Prophecy research", "Business strategist", "Teacher", "Creator"];

export default function MultimodalStudio({ onClose }) {
  const [panel, setPanel] = useState("vision");
  const [mode, setMode] = useState("Teacher");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [file, setFile] = useState(null);
  const [notice, setNotice] = useState("");
  const [memoryQuery, setMemoryQuery] = useState("");
  const [memoryResults, setMemoryResults] = useState([]);
  const [visionAnswer, setVisionAnswer] = useState("");

  useEffect(() => {
    const handleVisionQuestion = (event) => {
      const answer = String(event?.detail?.description || "");
      if (answer) setVisionAnswer(answer);
    };
    window.addEventListener("revelaai:ask-local-vision", handleVisionQuestion);
    return () => window.removeEventListener("revelaai:ask-local-vision", handleVisionQuestion);
  }, []);

  const run = () => setOutput(localMode(mode, input));
  const readDoc = async () => {
    try {
      const result = file ? await readLocalDocument(file) : { summary: "Pasted text is ready for local analysis.", excerpt: input };
      setOutput(JSON.stringify(result, null, 2));
      setNotice("Processed locally. No file was uploaded.");
    } catch (e) {
      setNotice(e.message);
    }
  };

  return <section className="mx-auto w-full max-w-4xl space-y-3 rounded-2xl border border-emerald-400/20 bg-slate-950 p-3 text-white sm:p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2"><ShieldCheck className="text-emerald-300" size={19}/><div><h3 className="text-sm font-bold">RevelaAI v2.0 FREE</h3><p className="mt-1 text-[10px] text-slate-400">Local tools · no paid API · media stays on device</p></div></div>
      {onClose && <button onClick={onClose} className="text-xs text-slate-400">Close</button>}
    </div>
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {[{id:"vision",label:"Vision",icon:Camera},{id:"video",label:"Video",icon:Film},{id:"voice",label:"Voice",icon:Mic},{id:"skills",label:"Skills",icon:Brain},{id:"docs",label:"Documents",icon:FileText},{id:"memory",label:"Memory",icon:ShieldCheck}].map(x => { const Icon=x.icon; return <button key={x.id} onClick={()=>setPanel(x.id)} className={"flex flex-col items-center gap-1 rounded-xl border p-2 text-[11px] font-semibold "+(panel===x.id?"border-emerald-300/50 bg-emerald-400/10":"border-white/10 bg-white/[.03]")}><Icon size={17}/>{x.label}</button>; })}
    </div>
    {panel === "vision" && <div className="space-y-3">
      <FreeVisionMath onClose={() => setPanel("")}/>
      {visionAnswer && <div role="status" className="rounded-xl border border-emerald-300/20 bg-emerald-400/[.06] p-3"><p className="text-xs font-bold text-emerald-200">RevelaAI · Answer from the latest camera scan</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-200">{visionAnswer}</p></div>}
    </div>}
    {panel === "video" && <VideoAnalyzerFree onClose={() => setPanel("")}/>}
    {panel === "voice" && <VoiceOrbFree onTranscript={(text, emotion) => { setInput(text); setOutput(emotion.opening + "\n\nText sentiment estimate: " + emotion.emotion + ". Heuristic only, not a diagnosis."); }} onClose={() => setPanel("")}/>}
    {panel === "skills" && <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">{modes.map(m => <button key={m} onClick={() => setMode(m)} className={"shrink-0 rounded-full border px-3 py-2 text-xs "+(mode===m?"border-emerald-300/50 bg-emerald-400/10":"border-white/10")}>{m}</button>)}</div>
      <textarea value={input} onChange={e=>setInput(e.target.value)} rows={3} placeholder="Question, contract terms, Bible topic, sales CSV rows or creator brief…" className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm"/>
      <button onClick={run} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 p-3 text-sm font-bold text-slate-950"><Brain size={16}/> Run local {mode}</button>
      {output && <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-white/[.03] p-3 text-xs leading-5">{output}</pre>}
      <p className="text-[10px] text-slate-500">Rule-based templates and arithmetic, not an LLM. Check factual and scriptural claims against primary sources.</p>
    </div>}
    {panel === "docs" && <div className="space-y-3">
      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/20 p-3 text-xs"><FileText size={16}/>{file?.name || "Choose TXT, MD, CSV, JSON, HTML, XML or LOG"}<input hidden type="file" accept=".txt,.md,.csv,.json,.html,.xml,.log" onChange={e=>{setFile(e.target.files?.[0]||null);setNotice("");}}/></label>
      <textarea value={input} onChange={e=>setInput(e.target.value)} rows={3} placeholder="Or paste text…" className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm"/>
      <button onClick={readDoc} className="w-full rounded-xl bg-emerald-400 p-3 text-sm font-bold text-slate-950">Analyze locally</button>
      {notice && <p role="status" className="text-xs text-amber-200">{notice}</p>}
      {output && <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-white/5 p-3 text-xs">{output}</pre>}
    </div>}
    {panel === "memory" && <div className="space-y-3">
      <p className="text-xs text-slate-400">Memory is stored in this browser's localStorage. Avoid passwords, secrets and sensitive personal data.</p>
      <textarea value={input} onChange={e=>setInput(e.target.value)} rows={2} placeholder="Preference or project detail to remember…" className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm"/>
      <button onClick={()=>{if(input.trim()){saveMemory(input);setNotice("Saved on this device.");setInput("");}}} className="w-full rounded-xl bg-emerald-400 p-3 text-sm font-bold text-slate-950">Save memory locally</button>
      <div className="flex gap-2"><input value={memoryQuery} onChange={e=>setMemoryQuery(e.target.value)} placeholder="Search memory" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 p-2 text-sm"/><button onClick={()=>setMemoryResults(searchMemory(memoryQuery))} className="rounded-xl border border-white/10 px-3 text-xs">Search</button></div>
      {memoryResults.map((m,i)=><p key={i} className="rounded-lg bg-white/5 p-2 text-xs">{m.text}</p>)}
      {notice && <p role="status" className="text-xs text-emerald-200">{notice}</p>}
    </div>}
    <p className="flex items-center gap-1 text-[10px] text-slate-500"><Sparkles size={12}/>{assessEmotion(input).opening}<span className="ml-auto">ZERO COST</span></p>
  </section>;
}
