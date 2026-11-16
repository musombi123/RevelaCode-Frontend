import React, { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capgo/capacitor-speech-recognition";
import { Mic, MicOff, Loader2, Radio } from "lucide-react";
import { assessEmotion } from "./localIntelligence";

const LANGUAGES = [
  { code: "en-KE", label: "English (Kenya)" },
  { code: "sw-KE", label: "Kiswahili (Kenya)" },
  { code: "en-US", label: "English (US)" },
];

const isAndroidNative = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

export default function VoiceOrbFree({ onTranscript, speaking = false }) {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("en-KE");
  const [audioLevel, setAudioLevel] = useState(0);

  const activeRef = useRef(false);
  const processingRef = useRef(false);
  const speakingRef = useRef(Boolean(speaking));
  const previousSpeakingRef = useRef(Boolean(speaking));
  speakingRef.current = Boolean(speaking);
  const recognitionRef = useRef(null);
  const listenersRef = useRef([]);
  const listenersReadyRef = useRef(false);
  const restartTimerRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);
  const startListeningRef = useRef(null);
  const finishTurnRef = useRef(null);

  onTranscriptRef.current = onTranscript;

  const clearTimers = () => {
    if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
    if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
    restartTimerRef.current = null;
    silenceTimerRef.current = null;
  };

  const scheduleRestart = () => {
    if (!activeRef.current || processingRef.current || speakingRef.current) return;
    if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
    restartTimerRef.current = window.setTimeout(() => {
      restartTimerRef.current = null;
      void startListeningRef.current?.();
    }, 500);
  };

  finishTurnRef.current = async (rawText) => {
    const heard = String(rawText || "").trim();
    if (!heard || !activeRef.current || processingRef.current) return;

    processingRef.current = true;
    setProcessing(true);
    setListening(false);
    setTranscript(heard);
    setError("");
    clearTimers();

    try {
      if (Capacitor.isNativePlatform()) {
        await SpeechRecognition.stop().catch(() => {});
      } else {
        try {
          recognitionRef.current?.stop?.();
        } catch {
          // The browser may already have ended this recognition session.
        }
      }

      await onTranscriptRef.current?.(heard, assessEmotion(heard), language);
    } catch (turnError) {
      setError(turnError?.message || "RevelaAI could not complete this voice turn. Try again.");
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }

    // Do not listen while the assistant is speaking. The callback resolves only
    // after its spoken response completes, then this starts the next user turn.
    if (activeRef.current) scheduleRestart();
  };

  const attachNativeListeners = async () => {
    if (listenersReadyRef.current) return;

    const handles = [];
    if (isAndroidNative()) {
      handles.push(await SpeechRecognition.addListener("segmentResults", (event) => {
        const text = Array.isArray(event?.matches)
          ? event.matches.find((item) => String(item || "").trim())
          : "";
        if (text) void finishTurnRef.current?.(text);
      }));
    }

    handles.push(await SpeechRecognition.addListener("partialResults", (event) => {
      const partial = String(
        event?.accumulatedText ||
        event?.matches?.[0] ||
        event?.accumulated ||
        ""
      ).trim();

      if (!partial || processingRef.current || !activeRef.current) return;
      setTranscript(partial);

      // Android normally emits a final segment after the configured silence
      // window. This debounce is a cross-platform fallback for recognizers
      // that only emit partial results.
      if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = window.setTimeout(async () => {
        silenceTimerRef.current = null;
        if (!activeRef.current || processingRef.current) return;

        let finalText = partial;
        try {
          const latest = await SpeechRecognition.getLastPartialResult();
          finalText = String(latest?.text || latest?.matches?.[0] || partial).trim();
        } catch {
          // Use the latest partial transcript when the platform has no cache.
        }
        if (finalText) void finishTurnRef.current?.(finalText);
      }, isAndroidNative() ? 2400 : 1700);
    }));

    handles.push(await SpeechRecognition.addListener("audioLevel", (event) => {
      setAudioLevel(Math.max(0, Math.min(1, Number(event?.level) || 0)));
    }));

    handles.push(await SpeechRecognition.addListener("error", (event) => {
      const code = String(event?.code || "").toLowerCase();
      const message = String(event?.message || "");
      if (/no.?speech|no.?match|timeout|client.?busy/.test(code)) {
        setListening(false);
        scheduleRestart();
        return;
      }
      if (/aborted|cancelled|user.?stop/.test(code)) return;
      setError(message || "The device speech recognizer stopped unexpectedly.");
      setListening(false);
    }));

    listenersRef.current = handles;
    listenersReadyRef.current = true;
  };

  const startNativeListening = async () => {
    if (!activeRef.current || processingRef.current) return;
    setError("");

    const { available } = await SpeechRecognition.available();
    if (!available) {
      throw new Error("This device has no compatible speech recognition service installed. Enable a speech recognition provider in Android settings.");
    }

    const permission = await SpeechRecognition.requestPermissions();
    if (permission?.speechRecognition !== "granted") {
      throw new Error("Microphone permission was not granted. Allow microphone access for RevelaCode, then tap Resume.");
    }

    await attachNativeListeners();
    if (!activeRef.current || processingRef.current || speakingRef.current) return;

    let useOnDeviceRecognition = false;
    try {
      const onDevice = await SpeechRecognition.isOnDeviceRecognitionAvailable({ language });
      useOnDeviceRecognition = Boolean(onDevice?.available);
    } catch {
      // Older system recognizers continue through their standard provider.
    }

    if (!activeRef.current || processingRef.current || speakingRef.current) return;

    setTranscript("");
    const recognitionOptions = {
      language,
      maxResults: 1,
      partialResults: true,
      popup: false,
      useOnDeviceRecognition,
      ...(isAndroidNative()
        ? { allowForSilence: 1500, muteRecognizerBeep: true }
        : {}),
    };
    if (!activeRef.current || processingRef.current || speakingRef.current) return;

    try {
      await SpeechRecognition.start(recognitionOptions);
    } catch (recognitionError) {
      // Some Android speech services report on-device support before the
      // language model has been downloaded. Retry with the default provider.
      if (!useOnDeviceRecognition) throw recognitionError;
      await SpeechRecognition.start({
        ...recognitionOptions,
        useOnDeviceRecognition: false,
      });
    }

    if (activeRef.current && !processingRef.current && !speakingRef.current) {
      setListening(true);
    } else {
      await SpeechRecognition.stop().catch(() => {});
    }
  };

  const startBrowserListening = () => {
    if (!activeRef.current || processingRef.current) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      throw new Error("Speech recognition is not available in this browser. Use the RevelaCode Android app or open this page in a supported browser.");
    }

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (activeRef.current && !processingRef.current && !speakingRef.current) {
        setListening(true);
      } else {
        try { recognition.stop(); } catch { /* Ignore an already-ended recognizer. */ }
      }
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let liveText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const value = String(result?.[0]?.transcript || "").trim();
        if (!value) continue;
        liveText += (liveText ? " " : "") + value;
        if (result.isFinal) finalText += (finalText ? " " : "") + value;
      }

      if (liveText) setTranscript(liveText);
      if (finalText) void finishTurnRef.current?.(finalText);
    };

    recognition.onerror = (event) => {
      const code = String(event?.error || "");
      if (code === "no-speech" || code === "aborted") {
        setListening(false);
        return;
      }
      const permissionDenied = code === "not-allowed" || code === "service-not-allowed";
      setError(
        permissionDenied
          ? "Microphone permission was denied. Allow microphone access for RevelaCode and retry."
          : "Browser speech recognition failed (" + code + "). Tap Resume to try again."
      );
      if (permissionDenied) activeRef.current = false;
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      if (activeRef.current && !processingRef.current) scheduleRestart();
    };

    recognition.start();
  };

  startListeningRef.current = async () => {
    if (!activeRef.current || processingRef.current || speakingRef.current) return;
    try {
      if (Capacitor.isNativePlatform()) {
        await startNativeListening();
      } else {
        startBrowserListening();
      }
    } catch (startError) {
      setListening(false);
      setError(startError?.message || "Could not start voice recognition.");
    }
  };

  const startConversation = () => {
    if (processingRef.current) return;
    activeRef.current = true;
    clearTimers();
    void startListeningRef.current?.();
  };

  const pauseConversation = () => {
    activeRef.current = false;
    clearTimers();
    setListening(false);
    if (Capacitor.isNativePlatform()) {
      void SpeechRecognition.stop().catch(() => {});
    } else {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // Ignore an already-ended browser recognizer.
      }
    }
  };

  useEffect(() => {
    const wasSpeaking = previousSpeakingRef.current;
    previousSpeakingRef.current = Boolean(speaking);

    if (speaking) {
      clearTimers();
      setListening(false);
      if (Capacitor.isNativePlatform()) {
        void SpeechRecognition.stop().catch(() => {});
      } else {
        try {
          recognitionRef.current?.stop?.();
        } catch {
          // Ignore an already-ended browser recognition session.
        }
      }
      return;
    }

    // Replay can begin while an idle voice session is listening. Resume only
    // after the assistant has fully finished speaking, never from onend.
    if (wasSpeaking && activeRef.current && !processingRef.current) {
      scheduleRestart();
    }
  }, [speaking]);

  useEffect(() => {
    activeRef.current = true;
    void startListeningRef.current?.();

    return () => {
      activeRef.current = false;
      clearTimers();
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // Ignore cleanup races.
      }
      if (Capacitor.isNativePlatform()) {
        void SpeechRecognition.stop().catch(() => {});
        listenersRef.current.forEach((handle) => {
          try { void handle.remove(); } catch { /* Ignore listener cleanup races. */ }
        });
        listenersRef.current = [];
        listenersReadyRef.current = false;
      }
    };
    // Start once when the voice conversation opens. Language changes apply
    // to the next recognition cycle without remounting the voice session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const platformLabel = Capacitor.isNativePlatform() ? "Native device voice" : "Browser voice";
  const statusLabel = speaking
    ? "RevelaAI is speaking"
    : processing
      ? "RevelaAI is thinking"
      : listening
        ? "Listening — speak normally"
        : error
          ? "Voice paused"
          : activeRef.current
            ? "Preparing microphone"
            : "Microphone paused";

  return (
    <section className="rounded-2xl border border-accent/20 bg-surface-2 p-4 text-fg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold">Voice-to-voice conversation</h3>
          <p className="mt-1 text-[11px] text-muted">{platformLabel} · the keyboard is not used</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Radio size={18} />
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="text-[11px] font-medium text-muted" htmlFor="revela-voice-language">
          Conversation language
        </label>
        <select
          id="revela-voice-language"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          disabled={listening || processing}
          className="max-w-[65%] rounded-lg border border-line bg-surface px-2.5 py-2 text-xs text-fg"
        >
          {LANGUAGES.map((item) => (
            <option key={item.code} value={item.code}>{item.label}</option>
          ))}
        </select>
      </div>

      <div className="my-5 flex flex-col items-center justify-center">
        <div className={"flex h-24 w-24 items-center justify-center rounded-full border transition-all " +
          (listening
            ? "border-accent/50 bg-accent/15 shadow-[0_0_0_10px_rgba(16,185,129,0.06)]"
            : speaking
              ? "border-sky-400/50 bg-sky-400/10"
              : "border-line bg-surface")}
        >
          {processing || speaking
            ? <Loader2 size={34} className="animate-spin text-accent" />
            : listening
              ? <Mic size={34} className="text-accent" />
              : <MicOff size={34} className="text-muted" />}
        </div>
        <p className="mt-3 text-xs font-semibold text-fg" role="status" aria-live="polite">
          {statusLabel}
        </p>
        {listening && (
          <div className="mt-3 flex h-7 items-center gap-1" aria-label="Microphone input level">
            {Array.from({ length: 18 }, (_, index) => (
              <span
                key={index}
                className="w-1 rounded-full bg-accent transition-[height] duration-100"
                style={{ height: (4 + audioLevel * (5 + ((index * 7) % 15))) + "px" }}
              />
            ))}
          </div>
        )}
      </div>

      {transcript && (
        <p className="rounded-xl border border-line bg-surface p-3 text-xs leading-5 text-muted">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted">Latest voice input</span>
          {transcript}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-warning/20 bg-warning/5 p-3 text-[11px] leading-5 text-warning">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        {listening ? (
          <button
            type="button"
            onClick={pauseConversation}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line px-3 text-xs font-bold text-fg-secondary hover:bg-surface"
          >
            <MicOff size={16} /> Pause listening
          </button>
        ) : (
          <button
            type="button"
            onClick={startConversation}
            disabled={processing}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-3 text-xs font-bold text-inverse hover:bg-accent-hover disabled:opacity-50"
          >
            <Mic size={16} /> Resume listening
          </button>
        )}
      </div>

      <p className="mt-3 text-[10px] leading-4 text-muted">
        RevelaAI listens to one turn, processes it, speaks its answer, then listens again. Recognition may use an available on-device language model or the device speech provider.
      </p>
    </section>
  );
}
