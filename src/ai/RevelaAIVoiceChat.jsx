import React, { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { SpeechSynthesis } from "@capgo/capacitor-speech-synthesis";
import { useAuth } from "@/context/AuthContext";
import { sendRevelaAIMessage, loadSmartMemory, formatSmartMemoryContext } from "@/ai/revelaAIClient";
import { PhoneOff, Sparkles, Volume2 } from "lucide-react";
import VoiceOrbFree from "@/ai/v2-free/VoiceOrbFree";
import LivingHubSelector from "@/ai/v2-free/LivingHubSelector";
import { composeLivingResponse, getLocalBrainMemory } from "@/ai/v2-free/livingBrain";

const splitForSpeech = (value, maximum = 900) => {
  const remaining = String(value || "").replace(/\s+/g, " ").trim();
  if (!remaining) return [];
  const chunks = [];
  let text = remaining;

  while (text.length > maximum) {
    let boundary = text.lastIndexOf(" ", maximum);
    if (boundary < Math.floor(maximum * 0.55)) {
      boundary = text.indexOf(" ", maximum);
    }
    if (boundary < 1) boundary = maximum;
    chunks.push(text.slice(0, boundary).trim());
    text = text.slice(boundary).trim();
  }
  if (text) chunks.push(text);
  return chunks;
};

const getSpeechLanguage = (text, selectedLanguage) => {
  if (/\b(habari|asante|tafadhali|karibu|pole|ndiyo|hapana|kwaheri|ninaweza|unaweza|kwa nini|maana yake)\b/i.test(text)) {
    return "sw-KE";
  }
  return selectedLanguage || "en-KE";
};

export default function RevelaAIVoiceChat({
  sessionId,
  hub = "auto",
  memoryScope = "guest",
  freeMode = false,
  onVoiceResult,
  onClose,
}) {
  const { user, isGuest, isAuthenticated, authFetch } = useAuth();
  const [reply, setReply] = useState("");
  const [activeHub, setActiveHub] = useState(hub || "auto");
  const [speaking, setSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const mountedRef = useRef(true);
  const speechRunRef = useRef(0);

  useEffect(() => {
    setActiveHub(hub || "auto");
  }, [hub]);

  const speakNativeChunk = useCallback(async (chunk, language) => {
    let utteranceId = null;
    let resolveFinished;
    let rejectFinished;

    const finished = new Promise((resolve, reject) => {
      resolveFinished = resolve;
      rejectFinished = reject;
    });

    const endListener = await SpeechSynthesis.addListener("end", (event) => {
      if (utteranceId && event?.utteranceId === utteranceId) resolveFinished();
    });
    const errorListener = await SpeechSynthesis.addListener("error", (event) => {
      if (utteranceId && event?.utteranceId === utteranceId) {
        rejectFinished(new Error(event?.error || "The device could not speak this response."));
      }
    });

    let fallbackTimer = null;
    try {
      const result = await SpeechSynthesis.speak({
        text: chunk,
        language,
        rate: 0.96,
        pitch: 1.02,
        volume: 1,
        queueStrategy: "Flush",
      });
      utteranceId = result?.utteranceId;
      const estimatedWords = chunk.split(/\s+/).filter(Boolean).length;
      fallbackTimer = window.setTimeout(
        resolveFinished,
        Math.max(10000, Math.min(150000, estimatedWords * 430))
      );
      await finished;
    } finally {
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      await endListener.remove().catch(() => {});
      await errorListener.remove().catch(() => {});
    }
  }, []);

  const speakBrowserChunk = useCallback((chunk, language) => new Promise((resolve, reject) => {
    if (!("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance !== "function") {
      reject(new Error("Speech output is unavailable in this browser."));
      return;
    }

    const utterance = new window.SpeechSynthesisUtterance(chunk);
    utterance.lang = language;
    utterance.rate = 0.96;
    utterance.pitch = 1.02;
    utterance.volume = 1;
    utterance.onend = resolve;
    utterance.onerror = () => reject(new Error("The browser could not speak the assistant response."));
    window.speechSynthesis.speak(utterance);
  }), []);

  const speakResponse = useCallback(async (text, selectedLanguage = "en-KE") => {
    const chunks = splitForSpeech(text);
    if (!chunks.length) return;

    const runId = speechRunRef.current + 1;
    speechRunRef.current = runId;
    setSpeechError("");
    setSpeaking(true);

    try {
      if (Capacitor.isNativePlatform()) {
        const availability = await SpeechSynthesis.isAvailable();
        if (!availability?.isAvailable) {
          throw new Error("Android Text-to-Speech is unavailable. Enable or install a speech engine in device settings.");
        }
        await SpeechSynthesis.cancel().catch(() => {});
        await SpeechSynthesis.initialize().catch(() => {});
        const language = getSpeechLanguage(text, selectedLanguage);
        for (const chunk of chunks) {
          if (speechRunRef.current !== runId) return;
          await speakNativeChunk(chunk, language);
        }
      } else {
        if (!("speechSynthesis" in window)) {
          throw new Error("Speech output is unavailable in this browser.");
        }
        window.speechSynthesis.cancel();
        const language = getSpeechLanguage(text, selectedLanguage);
        for (const chunk of chunks) {
          if (speechRunRef.current !== runId) return;
          await speakBrowserChunk(chunk, language);
        }
      }
    } catch (error) {
      if (mountedRef.current) setSpeechError(error?.message || "The response could not be played aloud.");
    } finally {
      if (mountedRef.current && speechRunRef.current === runId) setSpeaking(false);
    }
  }, [speakNativeChunk, speakBrowserChunk]);

  useEffect(() => {
    mountedRef.current = true;
    if (Capacitor.isNativePlatform()) {
      void SpeechSynthesis.initialize().catch(() => {});
    }
    return () => {
      mountedRef.current = false;
      speechRunRef.current += 1;
      if (Capacitor.isNativePlatform()) {
        void SpeechSynthesis.cancel().catch(() => {});
      } else {
        window.speechSynthesis?.cancel?.();
      }
    };
  }, []);

  const handleTranscript = async (heard, emotionEstimate, recognizedLanguage) => {
    const question = String(heard || "").trim();
    if (!question) return;

    const memory = await getLocalBrainMemory(memoryScope);
    const localResult = composeLivingResponse(question, activeHub, "", memory);
    let response = localResult.reply;
    let metadata = {
      engine: localResult.engine,
      network: false,
      networkUsed: false,
      hub: localResult.hub,
      hubLabel: localResult.hubLabel,
      routeReason: localResult.routeReason,
      emotionEstimate: emotionEstimate || localResult.emotionEstimate,
      intent: localResult.intent,
      sessionId: String(sessionId || ""),
      fallback: true,
    };

    // Speech recognition is handled by the device or browser. Only the
    // resulting text is sent through the same authenticated AI gateway as chat.
    if (!freeMode && isAuthenticated && !isGuest && typeof authFetch === "function") {
      try {
        let memoryContext = "";
        try {
          const savedMemory = await loadSmartMemory({
            authFetch,
            userId: user?.id || user?.user_id || user?.userId,
          });
          memoryContext = formatSmartMemoryContext(savedMemory);
        } catch (memoryError) {
          console.warn("Smart memory is unavailable; continuing voice chat without saved context:", memoryError);
        }

        const remote = await sendRevelaAIMessage({
          authFetch,
          message: question,
          context: memoryContext,
          sessionId: String(sessionId || "voice"),
          hub: activeHub,
          userId: user?.id || user?.user_id || user?.userId || user?._id || "",
        });
        response = remote.text || response;
        metadata = {
          ...(remote.metadata || {}),
          engine: remote.metadata?.engine || "revelaai-coordinated-ai",
          network: true,
          networkUsed: true,
          hub: remote.metadata?.domain || remote.metadata?.hub || (activeHub !== "auto" ? activeHub : "general"),
          emotionEstimate: emotionEstimate || localResult.emotionEstimate,
          sessionId: String(sessionId || ""),
          fallback: false,
        };
      } catch (error) {
        console.warn("RevelaAI voice provider unavailable; using device fallback:", error);
      }
    }

    if (mountedRef.current) setReply(response);
    onVoiceResult?.({
      heard: question,
      response,
      meta: metadata,
      streamed: false,
    });

    // Await the complete spoken response. VoiceOrbFree starts its next
    // recognition turn only after this promise resolves, preventing feedback.
    await speakResponse(response, recognizedLanguage || "en-KE");
  };

  const close = () => {
    speechRunRef.current += 1;
    if (Capacitor.isNativePlatform()) {
      void SpeechSynthesis.cancel().catch(() => {});
    } else {
      window.speechSynthesis?.cancel?.();
    }
    setSpeaking(false);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-overlay/70 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <section className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-accent/25 bg-popover p-3 text-fg shadow-2xl sm:p-5">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Sparkles size={18} />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold">RevelaAI Voice</h2>
              <p className="mt-0.5 text-[10px] text-muted">
                {freeMode ? "Free mode · local intelligence" : "Adaptive voice · authenticated AI gateway"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs text-fg-secondary hover:bg-surface-2"
            aria-label="End voice chat"
          >
            <PhoneOff size={14} /> End
          </button>
        </header>

        <div className="mb-3 rounded-2xl border border-line bg-surface-2 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[.12em] text-muted">Choose a specialist</p>
          <LivingHubSelector value={activeHub} onChange={setActiveHub} compact />
        </div>

        <VoiceOrbFree onTranscript={handleTranscript} speaking={speaking} />

        {reply && (
          <div className="mt-3 rounded-2xl border border-accent/20 bg-accent/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-fg">RevelaAI's reply</p>
              <button
                type="button"
                onClick={() => void speakResponse(reply)}
                className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1.5 text-[10px] text-fg-secondary"
              >
                <Volume2 size={13} /> Replay
              </button>
            </div>
            <p className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-fg-secondary">{reply}</p>
            {speaking && <p className="mt-2 text-[10px] text-accent">Speaking through the device's native audio output…</p>}
            {speechError && <p role="status" className="mt-2 text-[10px] leading-4 text-warning">{speechError}</p>}
          </div>
        )}

        <p className="mt-3 text-[10px] leading-4 text-muted">
          Voice turns are processed as text by the existing RevelaAI gateway. The device handles microphone recognition and reads the answer aloud; recognition pauses while RevelaAI speaks.
        </p>
      </section>
    </div>
  );
}
