import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, X } from "lucide-react";

/**
 * Browser-native voice input/output. Speech recognition support varies by browser;
 * the component clearly reports when the browser does not provide it.
 */
export default function VoiceOrb({ onTranscript, onClose, compact = false }) {
  const [listening, setListening] = useState(false);
  const [spoken, setSpoken] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => () => {
    try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  const start = () => {
    setError("");
    const Recognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!Recognition) {
      setError("Speech recognition is not supported in this browser. Try Chrome, or use the full voice conversation.");
      return;
    }
    try {
      const recognition = new Recognition();
      recognition.lang = "en-KE";
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) transcript += event.results[i][0]?.transcript || "";
        setSpoken(transcript);
        if (event.results[event.results.length - 1]?.isFinal && transcript.trim()) {
          onTranscript?.(transcript.trim());
          setListening(false);
        }
      };
      recognition.onerror = (event) => { setError(event.error === "not-allowed" ? "Microphone permission was denied." : "Could not capture speech. Please try again."); setListening(false); };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
    } catch {
      setError("The microphone could not be started. Check browser permissions.");
      setListening(false);
    }
  };

  const stop = () => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setListening(false);
  };

  const speak = () => {
    if (!spoken || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.lang = /\b(habari|asante|tafadhali|karibu)\b/i.test(spoken) ? "sw-KE" : "en-KE";
    utterance.rate = 0.96;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <section className={`rounded-2xl border border-cyan-400/20 bg-slate-950 p-4 text-white ${compact ? "" : "sm:p-5"}`} aria-label="Voice tools">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm font-bold">Voice studio</p><p className="mt-1 text-xs text-slate-400">Speak naturally · English and Swahili where supported</p></div>
        {onClose && <button type="button" onClick={onClose} aria-label="Close voice tools" className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10"><X size={16}/></button>}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={listening ? stop : start} className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border transition ${listening ? "animate-pulse border-cyan-300 bg-cyan-400/20 text-cyan-200" : "border-white/10 bg-white/5 text-white hover:bg-white/10"}`} aria-label={listening ? "Stop listening" : "Start voice input"}>
          {listening ? <MicOff size={22}/> : <Mic size={22}/>}
        </button>
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{listening ? "Listening…" : "Tap the orb to speak"}</p><p className="mt-1 break-words text-xs text-slate-400">{spoken || "Your transcript will appear here."}</p></div>
        {spoken && <button type="button" onClick={speak} className="rounded-xl border border-white/10 p-2 text-cyan-200 hover:bg-white/10" aria-label="Speak transcript aloud"><Volume2 size={18}/></button>}
      </div>
      {error && <p role="status" className="mt-3 text-xs text-amber-300">{error}</p>}
    </section>
  );
}
