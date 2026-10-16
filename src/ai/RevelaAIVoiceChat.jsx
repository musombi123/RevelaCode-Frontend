import React,{useState} from "react";
import {PhoneOff,Sparkles} from "lucide-react";
import VoiceOrbFree from "@/ai/v2-free/VoiceOrbFree";
import {answerLocally} from "@/ai/v2-free/localIntelligence";

/**
 * Compatibility wrapper preserving the dashboard's existing voice-modal contract.
 * It deliberately does not send audio or transcripts to a backend.
 */
export default function RevelaAIVoiceChat({sessionId,onVoiceResult,onClose}){
 const [reply,setReply]=useState("");
 const handleTranscript=(heard)=>{
  const response=answerLocally(heard,"Local voice conversation. Session: "+String(sessionId||""));
  setReply(response);
  onVoiceResult?.({heard,response,meta:{engine:"local-free-rules",network:false},streamed:false});
  if("speechSynthesis" in window){window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(response);utterance.lang=/\b(habari|asante|tafadhali|karibu|pole|ndiyo)\b/i.test(response)?"sw-KE":"en-KE";utterance.rate=.94;window.speechSynthesis.speak(utterance);}
 };
 return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-2 backdrop-blur-sm sm:items-center sm:p-4"><div className="w-full max-w-lg rounded-3xl border border-emerald-400/20 bg-slate-950 p-3 shadow-2xl sm:p-5"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Sparkles size={17} className="text-emerald-300"/><span className="text-sm font-bold text-white">RevelaAI Voice · Free offline mode</span></div><button onClick={()=>{window.speechSynthesis?.cancel();onClose?.();}} className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-xs text-slate-300"><PhoneOff size={14}/> End</button></div><VoiceOrbFree onTranscript={handleTranscript}/>{reply&&<div className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-white/[.03] p-3 text-xs leading-5 text-slate-200">{reply}</div>}</div></div>;
}