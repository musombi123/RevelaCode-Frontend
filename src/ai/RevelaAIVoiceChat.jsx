import React, { useEffect, useState } from "react";
import { PhoneOff, Sparkles, Volume2 } from "lucide-react";
import VoiceOrbFree from "@/ai/v2-free/VoiceOrbFree";
import LivingHubSelector from "@/ai/v2-free/LivingHubSelector";
import { composeLivingResponse } from "@/ai/v2-free/livingBrain";

/**
 * Device voice chat. Speech recognition and speech synthesis are browser
 * capabilities; availability and offline behaviour vary by device/browser.
 * No audio is uploaded and no paid/model API is called by this component.
 */
export default function RevelaAIVoiceChat({ sessionId, hub = "auto", onVoiceResult, onClose }) {
  const [reply, setReply] = useState("");
  const [activeHub, setActiveHub] = useState(hub || "auto");
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setActiveHub(hub || "auto");
  }, [hub]);

  useEffect(() => {
    const handleEnd = () => setSpeaking(false);
    window.speechSynthesis?.addEventListener?.("voiceschanged", handleEnd);
    return () => {
      window.speechSynthesis?.cancel?.();
      window.speechSynthesis?.removeEventListener?.("voiceschanged", handleEnd);
    };
  }, []);

  const handleTranscript = (heard) => {
    const question = String(heard || "").trim();
    if (!question) return;

    const result = composeLivingResponse(question, activeHub);
    const response = result.reply;
    setReply(response);

    onVoiceResult?.({
      heard: question,
      response,
      meta: {
        engine: result.engine,
        network: false,
        hub: result.hub,
        hubLabel: result.hubLabel,
        routeReason: result.routeReason,
        emotionEstimate: result.emotionEstimate,
        intent: result.intent,
        sessionId: String(sessionId || ""),
      },
      streamed: false,
    });

    if ("speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function") {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(response);
        utterance.lang = /\b(habari|asante|tafadhali|karibu|pole|ndiyo|kwaheri)\b/i.test(response)
          ? "sw-KE"
          : "en-KE";
        utterance.rate = 0.94;
        utterance.pitch = 1.02;
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } catch {
        setSpeaking(false);
      }
    }
  };

  const close = () => {
    window.speechSynthesis?.cancel?.();
    setSpeaking(false);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <section className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-emerald-400/20 bg-slate-950 p-3 text-white shadow-2xl sm:p-5">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-200">
              <Sparkles size={18} />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold">RevelaAI Voice</h2>
              <p className="mt-0.5 text-[10px] text-slate-400">On-device conversation · local-first</p>
            </div>
          </div>
          <button type="button" onClick={close} className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5" aria-label="End voice chat">
            <PhoneOff size={14} /> End
          </button>
        </header>

        <div className="mb-3 rounded-2xl border border-white/10 bg-white/[.025] p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">Choose a specialist</p>
          <LivingHubSelector value={activeHub} onChange={setActiveHub} compact />
        </div>

        <VoiceOrbFree onTranscript={handleTranscript} />

        {reply && (
          <div className="mt-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/[.04] p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-emerald-100">RevelaAI's reply</p>
              <button type="button" onClick={() => {
                if (!("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance !== "function") return;
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(reply);
                utterance.lang = activeHub === "mahubiri" ? "en-KE" : "en-KE";
                utterance.rate = 0.94;
                window.speechSynthesis.speak(utterance);
              }} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-[10px] text-slate-300">
                <Volume2 size={13} /> Replay
              </button>
            </div>
            <p className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-slate-200">{reply}</p>
            {speaking && <p className="mt-2 text-[10px] text-emerald-200">Speaking through the device speaker…</p>}
          </div>
        )}

        <p className="mt-3 text-[10px] leading-4 text-slate-500">
          Microphone and speech are browser/device features. Speech recognition may depend on the browser and network even though RevelaAI's response logic stays local. If voice permissions fail, use text or attach a file in the chat.
        </p>
      </section>
    </div>
  );
}
