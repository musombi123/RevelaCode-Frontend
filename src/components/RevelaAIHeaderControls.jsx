import React, { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import PremiumPlansStar from "@/premium/PremiumPlansStar.jsx";
import { useRevelaAISettings } from "@/ai/revelaAISettingsStore";
import RevelaAIQuickSettings from "@/components/RevelaAIQuickSettings";

const API=(import.meta.env.VITE_REVELAAI_API_URL||"https://revelaai.onrender.com").replace(/\/$/,"");
function authHeaders(){try{const token=localStorage.getItem("revelacode_access_token")||localStorage.getItem("access_token")||localStorage.getItem("token");return token?{Authorization:`${localStorage.getItem("revelacode_token_type")||"Bearer"} ${token}`}:{}}catch{return{}}}
export default function RevelaAIHeaderControls({modelTier="Checking",onSearchModeChange}){
 const [catalog,setCatalog]=useState(null),[quickOpen,setQuickOpen]=useState(false);
 const {settings,updateSection}=useRevelaAISettings();
 useEffect(()=>{let active=true;fetch(API+"/api/productivity/catalog",{headers:authHeaders()}).then(r=>r.ok?r.json():null).then(data=>active&&setCatalog(data)).catch(()=>{});return()=>{active=false}},[]);
 const search=catalog?.tools?.find(item=>item.id==="research_global");
 const remaining=Number(search?.remaining??0),limit=Number(search?.daily_limit??0);
 const mode=settings.search_research?.default_mode||"deep";
 const changeMode=value=>{updateSection("search_research",{default_mode:value});onSearchModeChange?.(value)};
 return <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
   <span className={`hidden rounded-full border px-2 py-1 text-[10px] font-bold sm:inline-flex ${modelTier==="Reduced mode"?"border-amber-400/30 bg-amber-400/10 text-amber-200":modelTier==="Backup"?"border-orange-400/30 bg-orange-400/10 text-orange-200":"border-emerald-400/20 bg-emerald-400/10 text-emerald-200"}`} data-demo="ai-model-tier">{modelTier}</span>
   <div className="hidden items-center gap-1 rounded-full border border-white/10 p-1 lg:flex" aria-label="Deep search mode">{["quick","deep","extreme"].map(value=><button key={value} type="button" onClick={()=>changeMode(value)} aria-pressed={mode===value} className={`rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${mode===value?"bg-emerald-500/20 text-emerald-200":"text-slate-500 hover:text-white"}`}>{value}</button>)}</div>
   <div className="hidden items-center gap-2 rounded-xl border border-white/10 px-2 py-1.5 sm:flex" data-demo="ai-quota-ring" title={`Deep Search: ${remaining} of ${limit} remaining today`}>
     <span className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-emerald-400/30 text-[9px] font-bold text-emerald-200"><span>{remaining}</span></span>
     <span className="text-left"><b className="block text-[10px] text-slate-200">Searches</b><span className="block text-[9px] text-slate-500">{catalog?(`${remaining}/${limit} left`):"Quota loading"}</span></span>
   </div>
   <div className="relative"><button type="button" onClick={()=>setQuickOpen(v=>!v)} aria-label="Quick settings" title="Quick settings" className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-slate-300 hover:bg-white/5" data-demo="ai-quick-settings"><SlidersHorizontal size={17}/></button>{quickOpen&&<div className="absolute right-0 top-12 z-[120]"><RevelaAIQuickSettings settings={settings} updateSection={updateSection} onOpenFull={()=>{setQuickOpen(false);window.dispatchEvent(new CustomEvent("revelaai:tools-open"))}}/></div>}</div>
   <PremiumPlansStar className="!h-11 !min-w-11 !px-2" />
 </div>;
}
