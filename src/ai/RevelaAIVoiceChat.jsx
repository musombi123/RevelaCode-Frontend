// src/ai/RevelaAIVoiceChat.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

/* =========================================================
   CONSTANTS
========================================================= */

const REVELAAI_URL = (
  import.meta.env.VITE_REVELAAI_URL || ""
)
  .trim()
  .replace(/\/+$/, "");

/* Hard cap for one spoken turn. */
const MAX_RECORDING_SECONDS = 60;

/* How long the user must stay quiet before we send. */
const SILENCE_END_MS = 1300;

/* Ignore clicks, coughs and bumps shorter than this. */
const MIN_SPEECH_MS = 350;

/* Pause the conversation if nobody speaks for this long. */
const NO_SPEECH_TIMEOUT_MS = 20000;

/* Lowest volume that can count as speech (RMS, 0..1). */
const MIN_THRESHOLD = 0.018;

/* Chunks kept before speech starts so first syllables survive. */
const PRE_ROLL_CHUNKS = 3;

/* Typewriter pace for captions while the AI is speaking. */
const WORD_REVEAL_MS = 320;

/* Orb canvas size in CSS pixels. */
const ORB_SIZE = 288;

const ORB_COLORS = {
  idle: [16, 185, 129],
  listening: [16, 185, 129],
  thinking: [139, 92, 246],
  speaking: [34, 211, 238],
  error: [239, 68, 68],
};

const GLOW_CLASS = {
  idle: "bg-emerald-500/10",
  listening: "bg-emerald-500/25",
  thinking: "bg-violet-500/25",
  speaking: "bg-cyan-400/25",
  error: "bg-red-500/20",
};

const toneFor = (status) =>
  status === "listening" ||
  status === "thinking" ||
  status === "speaking" ||
  status === "error"
    ? status
    : "idle";

/* =========================================================
   WAV ENCODER
========================================================= */

/**
 * Convert Float32 PCM samples to a valid
 * mono, 16-bit PCM WAV file.
 */
const encodeWav = (samples, sampleRate) => {
  if (!samples || !samples.length) {
    throw new Error("No PCM samples were captured.");
  }

  const bytesPerSample = 2;
  const channels = 1;
  const dataSize = samples.length * bytesPerSample;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");

  // Format chunk
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, 16, true); // 16-bit

  // Data chunk
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;

  for (let i = 0; i < samples.length; i += 1) {
    let sample = Number(samples[i]) || 0;

    sample = Math.max(-1, Math.min(1, sample));

    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;

    view.setInt16(offset, int16, true);

    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
};

const writeAscii = (view, offset, value) => {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
};

/* =========================================================
   SMALL HELPERS
========================================================= */

const createDeferred = () => {
  let resolve;

  const promise = new Promise((r) => {
    resolve = r;
  });

  return { promise, resolve };
};

const decodeHeader = (response, name) => {
  const raw = response.headers.get(name) || "";

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

/*
 * Routes a same-origin audio element through the shared
 * analyser so the orb can react to the AI's real voice.
 * Never used for remote audio_url playback because a
 * cross-origin element without CORS would be muted.
 */
const connectElementToOutput = (audio, env) => {
  try {
    if (env?.ctx && env?.outputNode) {
      const node = env.ctx.createMediaElementSource(audio);

      node.connect(env.outputNode);

      return node;
    }
  } catch {
    // The element still plays normally without the analyser.
  }

  return null;
};

/* A stand-in "player" used while a text-only reply is read. */
const createTimedPlayer = (ms) => {
  const done = createDeferred();

  const timer = window.setTimeout(done.resolve, ms);

  return {
    simulated: true,
    ended: done.promise,
    stop: () => {
      window.clearTimeout(timer);
      done.resolve();
    },
  };
};

const waitForPlayback = async (playerRef) => {
  const player = playerRef.current;

  if (!player?.ended) {
    return;
  }

  let timer;

  const cap = new Promise((resolve) => {
    timer = window.setTimeout(resolve, 180000);
  });

  await Promise.race([player.ended, cap]);

  window.clearTimeout(timer);
};

/* =========================================================
   AUDIO PLAYBACK
========================================================= */

/* Plays a finished audio_url. Resolves true once playback starts. */
const playRemoteAudio = (url, playerRef) => {
  const audio = new Audio(url);

  audio.volume = 1;

  const done = createDeferred();

  audio.addEventListener("ended", done.resolve, { once: true });
  audio.addEventListener("error", done.resolve, { once: true });

  playerRef.current = {
    simulated: true,
    ended: done.promise,
    stop: () => {
      try {
        audio.pause();
      } catch {
        // Ignore.
      }

      done.resolve();
    },
  };

  return audio
    .play()
    .then(() => true)
    .catch(() => {
      /*
       * Browser autoplay restrictions are non-fatal.
       */
      done.resolve();

      return false;
    });
};

const streamViaMediaSource = async (response, mime, playerRef, env) => {
  const mediaSource = new MediaSource();
  const audio = new Audio();
  const url = URL.createObjectURL(mediaSource);
  const done = createDeferred();

  audio.src = url;

  connectElementToOutput(audio, env);

  audio.addEventListener("ended", done.resolve, { once: true });
  audio.addEventListener("error", done.resolve, { once: true });

  done.promise.then(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore.
    }
  });

  playerRef.current = {
    ended: done.promise,
    stop: () => {
      try {
        audio.pause();
      } catch {
        // Ignore.
      }

      done.resolve();
    },
  };

  await new Promise((resolve) =>
    mediaSource.addEventListener("sourceopen", resolve, { once: true })
  );

  const sourceBuffer = mediaSource.addSourceBuffer(mime);
  const reader = response.body.getReader();
  const queue = [];

  let finished = false;
  let started = false;

  const pump = () => {
    if (sourceBuffer.updating) {
      return;
    }

    if (queue.length) {
      try {
        sourceBuffer.appendBuffer(queue.shift());
      } catch {
        // Drop a chunk the buffer refuses rather than failing the reply.
      }

      return;
    }

    if (finished && mediaSource.readyState === "open") {
      try {
        mediaSource.endOfStream();
      } catch {
        // Ignore.
      }
    }
  };

  sourceBuffer.addEventListener("updateend", pump);

  while (true) {
    const { value, done: streamDone } = await reader.read();

    if (streamDone) {
      break;
    }

    queue.push(value);

    pump();

    if (!started) {
      started = true;

      audio.play().catch(() => {
        // Autoplay restrictions are non-fatal.
        done.resolve();
      });
    }
  }

  finished = true;

  pump();
};

const streamWav = async (response, playerRef, env) => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  const ownsContext = !env?.ctx;

  if (ownsContext && !AudioContextClass) {
    throw new Error("Web Audio API is not supported by this browser.");
  }

  const ctx = env?.ctx || new AudioContextClass();
  const output = env?.outputNode || ctx.destination;

  if (ctx.state === "suspended") {
    await ctx.resume().catch(() => {});
  }

  const done = createDeferred();
  const sources = [];

  let endTimer = null;

  playerRef.current = {
    ended: done.promise,
    stop: () => {
      if (endTimer) {
        window.clearTimeout(endTimer);
      }

      sources.forEach((node) => {
        try {
          node.stop();
        } catch {
          // Ignore.
        }
      });

      if (ownsContext) {
        try {
          ctx.close();
        } catch {
          // Ignore.
        }
      }

      done.resolve();
    },
  };

  const reader = response.body.getReader();

  let header = new Uint8Array(0);
  let headerParsed = false;
  let sampleRate = 24000;
  let channels = 1;
  let leftover = new Uint8Array(0);
  let nextTime = 0;

  const concat = (a, b) => {
    const out = new Uint8Array(a.length + b.length);

    out.set(a, 0);
    out.set(b, a.length);

    return out;
  };

  const schedule = (bytes) => {
    const frameSize = channels * 2;
    const usable = bytes.length - (bytes.length % frameSize);

    leftover = bytes.slice(usable);

    if (!usable) {
      return;
    }

    const view = new DataView(bytes.buffer, bytes.byteOffset, usable);
    const frames = usable / frameSize;
    const buffer = ctx.createBuffer(channels, frames, sampleRate);

    for (let c = 0; c < channels; c += 1) {
      const channelData = buffer.getChannelData(c);

      for (let i = 0; i < frames; i += 1) {
        channelData[i] = view.getInt16((i * channels + c) * 2, true) / 0x8000;
      }
    }

    const node = ctx.createBufferSource();

    node.buffer = buffer;
    node.connect(output);

    nextTime = Math.max(nextTime, ctx.currentTime + 0.05);

    node.start(nextTime);

    sources.push(node);

    nextTime += buffer.duration;
  };

  while (true) {
    const { value, done: streamDone } = await reader.read();

    if (streamDone) {
      break;
    }

    let chunk = value;

    if (!headerParsed) {
      header = concat(header, chunk);

      if (header.length < 44) {
        continue;
      }

      const headerView = new DataView(
        header.buffer,
        header.byteOffset,
        header.length
      );

      channels = headerView.getUint16(22, true) || 1;
      sampleRate = headerView.getUint32(24, true) || 24000;

      headerParsed = true;

      chunk = header.slice(44);
      header = new Uint8Array(0);
    }

    schedule(concat(leftover, chunk));
  }

  const remainingMs = Math.max(0, (nextTime - ctx.currentTime) * 1000) + 120;

  endTimer = window.setTimeout(() => {
    if (ownsContext) {
      try {
        ctx.close();
      } catch {
        // Ignore.
      }
    }

    done.resolve();
  }, remainingMs);
};

const streamAudioFromResponse = async (response, playerRef, env) => {
  if (!response.body) {
    throw new Error("Streaming is not supported by this browser.");
  }

  const type = (response.headers.get("content-type") || "").toLowerCase();

  if (
    type.includes("audio/mpeg") &&
    typeof window.MediaSource !== "undefined" &&
    window.MediaSource.isTypeSupported("audio/mpeg")
  ) {
    return streamViaMediaSource(response, "audio/mpeg", playerRef, env);
  }

  if (type.includes("wav")) {
    return streamWav(response, playerRef, env);
  }

  // Fallback: buffer the whole stream, then play.
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  const done = createDeferred();

  connectElementToOutput(audio, env);

  audio.addEventListener("ended", done.resolve, { once: true });
  audio.addEventListener("error", done.resolve, { once: true });

  done.promise.then(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore.
    }
  });

  playerRef.current = {
    ended: done.promise,
    stop: () => {
      try {
        audio.pause();
      } catch {
        // Ignore.
      }

      done.resolve();
    },
  };

  await audio.play().catch(() => {
    done.resolve();
  });
};

/* =========================================================
   SMALL UI PIECES
========================================================= */

function Dots() {
  return (
    <span className="ml-1.5 inline-flex gap-1 align-middle" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1 w-1 animate-bounce rounded-full bg-current"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

const formatClock = (totalSeconds) =>
  `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(
    totalSeconds % 60
  ).padStart(2, "0")}`;

/* =========================================================
   COMPONENT
========================================================= */

export default function RevelaAIVoiceChat({
  open = true,
  sessionId,
  onVoiceResult,
  onClose,
}) {
  const { authFetch } = useAuth();

  /* -------------------------------------------------------
     LATEST-VALUE REFS
     The parent re-creates its callbacks on every render.
     Reading them through refs keeps one voice session
     alive across many conversation turns.
  ------------------------------------------------------- */

  const authFetchRef = useRef(authFetch);
  const sessionIdRef = useRef(sessionId);
  const onVoiceResultRef = useRef(onVoiceResult);
  const onCloseRef = useRef(onClose);

  authFetchRef.current = authFetch;
  sessionIdRef.current = sessionId;
  onVoiceResultRef.current = onVoiceResult;
  onCloseRef.current = onClose;

  /* -------------------------------------------------------
     AUDIO REFERENCES
  ------------------------------------------------------- */

  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const processorRef = useRef(null);
  const silentGainRef = useRef(null);
  const outAnalyserRef = useRef(null);
  const canvasRef = useRef(null);
  const captionsRef = useRef(null);

  /* -------------------------------------------------------
     TURN / SESSION REFERENCES
  ------------------------------------------------------- */

  const pcmChunksRef = useRef([]);
  const recordingActiveRef = useRef(false);
  const controllerRef = useRef(null);
  const voicePlayerRef = useRef(null);
  const autoStopTimerRef = useRef(null);
  const callTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const sessionLiveRef = useRef(false);
  const sessionTokenRef = useRef(0);
  const turnIdRef = useRef(0);
  const levelRef = useRef(0);
  const mutedRef = useRef(false);
  const statusRef = useRef("starting");
  const userSpeakingRef = useRef(false);
  const engineRef = useRef({});

  const vadRef = useRef({
    noise: 0.006,
    samples: 0,
    speechDetected: false,
    speechStart: 0,
    lastVoice: 0,
    turnStart: 0,
    ending: false,
  });

  /* -------------------------------------------------------
     STATE
  ------------------------------------------------------- */

  const [status, setStatus] = useState("starting");
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [callSeconds, setCallSeconds] = useState(0);
  const [heardText, setHeardText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [revealCount, setRevealCount] = useState(0);

  const setStatusBoth = useCallback((next) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const setUserSpeakingBoth = useCallback((next) => {
    if (userSpeakingRef.current === next) {
      return;
    }

    userSpeakingRef.current = next;
    setUserSpeaking(next);
  }, []);

  const live = () => mountedRef.current && sessionLiveRef.current;

  const getAudioEnv = () => ({
    ctx: audioContextRef.current,
    outputNode: outAnalyserRef.current,
  });

  /* =======================================================
     TIMERS
  ======================================================= */

  const clearAutoStop = useCallback(() => {
    if (autoStopTimerRef.current) {
      window.clearTimeout(autoStopTimerRef.current);

      autoStopTimerRef.current = null;
    }
  }, []);

  /* =======================================================
     TEARDOWN
     Releases the microphone, audio graph and timers.
  ======================================================= */

  const teardown = useCallback(() => {
    sessionTokenRef.current += 1;

    recordingActiveRef.current = false;

    clearAutoStop();

    if (callTimerRef.current) {
      window.clearInterval(callTimerRef.current);

      callTimerRef.current = null;
    }

    try {
      if (processorRef.current) {
        processorRef.current.onaudioprocess = null;

        processorRef.current.disconnect();
      }
    } catch {
      // Ignore cleanup failure.
    }

    processorRef.current = null;

    try {
      silentGainRef.current?.disconnect();
    } catch {
      // Ignore.
    }

    silentGainRef.current = null;

    try {
      sourceRef.current?.disconnect();
    } catch {
      // Ignore.
    }

    sourceRef.current = null;

    try {
      outAnalyserRef.current?.disconnect();
    } catch {
      // Ignore.
    }

    outAnalyserRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());

    streamRef.current = null;

    try {
      audioContextRef.current?.close();
    } catch {
      // Ignore.
    }

    audioContextRef.current = null;

    levelRef.current = 0;
  }, [clearAutoStop]);

  /* =======================================================
     FAIL
  ======================================================= */

  const fail = useCallback(
    (message) => {
      recordingActiveRef.current = false;

      clearAutoStop();

      setUserSpeakingBoth(false);

      setError(message);

      setStatusBoth("error");
    },
    [clearAutoStop, setStatusBoth, setUserSpeakingBoth]
  );

  /* =======================================================
     START / PAUSE LISTENING
  ======================================================= */

  const startListening = useCallback(() => {
    if (!sessionLiveRef.current || !audioContextRef.current) {
      return;
    }

    turnIdRef.current += 1;

    pcmChunksRef.current = [];

    const vad = vadRef.current;

    vad.speechDetected = false;
    vad.speechStart = 0;
    vad.lastVoice = 0;
    vad.ending = false;
    vad.turnStart = performance.now();

    setUserSpeakingBoth(false);

    setError("");

    recordingActiveRef.current = true;

    clearAutoStop();

    autoStopTimerRef.current = window.setTimeout(() => {
      if (recordingActiveRef.current) {
        engineRef.current.finishTurn(true);
      }
    }, MAX_RECORDING_SECONDS * 1000);

    setStatusBoth("listening");
  }, [clearAutoStop, setStatusBoth, setUserSpeakingBoth]);

  const pauseListening = useCallback(() => {
    recordingActiveRef.current = false;

    pcmChunksRef.current = [];

    clearAutoStop();

    setUserSpeakingBoth(false);

    setStatusBoth("paused");
  }, [clearAutoStop, setStatusBoth, setUserSpeakingBoth]);

  /* =======================================================
     VOICE ACTIVITY DETECTION
     Runs inside the audio callback so it keeps working
     even when the tab is in the background.
  ======================================================= */

  const handleVad = useCallback(
    (rms) => {
      const vad = vadRef.current;

      if (vad.ending) {
        return;
      }

      const now = performance.now();

      const threshold = Math.max(MIN_THRESHOLD, vad.noise * 3.2);

      if (rms > threshold) {
        vad.lastVoice = now;

        if (!vad.speechDetected) {
          vad.speechDetected = true;
          vad.speechStart = now;

          setUserSpeakingBoth(true);

          setNotice("");
        }
      } else {
        /* Learn the room's background noise level. */
        vad.samples += 1;

        const rate = vad.samples < 12 ? 0.3 : 0.04;

        vad.noise = vad.noise * (1 - rate) + rms * rate;
      }

      if (vad.speechDetected) {
        const quietFor = now - vad.lastVoice;

        if (quietFor > SILENCE_END_MS) {
          if (vad.lastVoice - vad.speechStart > MIN_SPEECH_MS) {
            vad.ending = true;

            engineRef.current.finishTurn(true);
          } else {
            /* Too short to be speech. Treat it as noise. */
            vad.speechDetected = false;

            setUserSpeakingBoth(false);
          }
        }

        return;
      }

      if (now - vad.turnStart > NO_SPEECH_TIMEOUT_MS) {
        vad.ending = true;

        engineRef.current.pauseListening();
      }
    },
    [setUserSpeakingBoth]
  );

  /* =======================================================
     SEND ONE TURN TO REVELAAI
  ======================================================= */

  const sendTurn = useCallback(
    async (wavBlob) => {
      const myTurn = turnIdRef.current;

      if (!wavBlob || wavBlob.size < 44) {
        fail("No valid audio was captured. Tap to try again.");

        return;
      }

      setStatusBoth("thinking");

      setError("");

      setNotice("");

      if (!REVELAAI_URL) {
        fail("VITE_REVELAAI_URL is not configured.");

        return;
      }

      console.info("🎙️ RevelaAI WAV upload:", {
        size: wavBlob.size,
        type: wavBlob.type,
      });

      const formData = new FormData();

      formData.append("audio", wavBlob, "voice.wav");

      const controller = new AbortController();

      controllerRef.current = controller;

      try {
        const response = await authFetchRef.current(`${REVELAAI_URL}/voice`, {
          method: "POST",

          headers: {
            "X-Session-ID": sessionIdRef.current || "",
          },

          body: formData,

          signal: controller.signal,
        });

        if (!live()) {
          return;
        }

        const contentType = response.headers.get("content-type") || "";

        /* ------------------------------------------------
           STREAMED AUDIO REPLY
        ------------------------------------------------ */

        if (response.ok && /^audio\//i.test(contentType)) {
          const heard = decodeHeader(response, "X-Heard");
          const reply = decodeHeader(response, "X-Response");

          setHeardText(heard);
          setReplyText(reply);

          setStatusBoth("speaking");

          await streamAudioFromResponse(
            response,
            voicePlayerRef,
            getAudioEnv()
          );

          if (!live()) {
            return;
          }

          onVoiceResultRef.current?.({
            heard,
            response: reply,
            streamed: true,
          });

          await waitForPlayback(voicePlayerRef);

          if (!live() || turnIdRef.current !== myTurn) {
            return;
          }

          voicePlayerRef.current = null;

          engineRef.current.startListening();

          return;
        }

        /* ------------------------------------------------
           JSON REPLY
        ------------------------------------------------ */

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.error?.message ||
              data?.message ||
              `Voice request failed (HTTP ${response.status}).`
          );
        }

        if (!data?.heard && !data?.response) {
          throw new Error("RevelaAI returned no voice result.");
        }

        if (!live()) {
          return;
        }

        setHeardText(String(data.heard || ""));
        setReplyText(String(data.response || ""));

        /*
         * TTS may be disabled while credits are exhausted.
         * That is not a voice failure: transcription and the
         * AI reply can still succeed.
         */
        const hasAudio =
          data?.audio_url && /^https?:\/\//i.test(data.audio_url);

        let playing = false;

        if (hasAudio) {
          setStatusBoth("speaking");

          playing = await playRemoteAudio(data.audio_url, voicePlayerRef);
        }

        if (!live()) {
          return;
        }

        onVoiceResultRef.current?.(data);

        if (!playing) {
          setStatusBoth("replied");

          const words = String(data.response || "")
            .split(/\s+/)
            .filter(Boolean).length;

          voicePlayerRef.current = createTimedPlayer(
            Math.min(7000, 900 + words * 200)
          );
        }

        await waitForPlayback(voicePlayerRef);

        if (!live() || turnIdRef.current !== myTurn) {
          return;
        }

        voicePlayerRef.current = null;

        engineRef.current.startListening();
      } catch (err) {
        if (err?.name === "AbortError") {
          return;
        }

        console.error("❌ RevelaAI voice request failed:", err);

        if (live()) {
          fail(err?.message || "Voice processing failed. Tap to try again.");
        }
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
      }
    },
    [fail, setStatusBoth]
  );

  /* =======================================================
     FINISH THE USER'S TURN
  ======================================================= */

  const finishTurn = useCallback(
    async (submit = true) => {
      if (!recordingActiveRef.current) {
        return;
      }

      recordingActiveRef.current = false;

      clearAutoStop();

      setUserSpeakingBoth(false);

      const chunks = pcmChunksRef.current;

      pcmChunksRef.current = [];

      const sampleRate = audioContextRef.current?.sampleRate || 44100;

      if (!submit) {
        return;
      }

      const totalSamples = chunks.reduce(
        (total, chunk) => total + chunk.length,
        0
      );

      if (!vadRef.current.speechDetected || totalSamples < sampleRate * 0.3) {
        setNotice("I didn't catch that. Go ahead, I'm listening.");

        engineRef.current.startListening();

        return;
      }

      let wavBlob;

      try {
        const samples = new Float32Array(totalSamples);

        let offset = 0;

        for (const chunk of chunks) {
          samples.set(chunk, offset);

          offset += chunk.length;
        }

        wavBlob = encodeWav(samples, sampleRate);

        console.info("✅ WAV created:", {
          size: wavBlob.size,
          type: wavBlob.type,
          sampleRate,
          channels: 1,
          bitsPerSample: 16,
        });
      } catch (err) {
        fail(err?.message || "Could not prepare your audio. Tap to try again.");

        return;
      }

      await engineRef.current.sendTurn(wavBlob);
    },
    [clearAutoStop, fail, setUserSpeakingBoth]
  );

  /* =======================================================
     START SESSION
     Opens the microphone once and keeps it for the whole
     conversation so turns feel instant.
  ======================================================= */

  const startSession = useCallback(async () => {
    sessionTokenRef.current += 1;

    const token = sessionTokenRef.current;

    const alive = () =>
      sessionLiveRef.current && sessionTokenRef.current === token;

    try {
      setStatusBoth("starting");

      setError("");
      setNotice("");
      setHeardText("");
      setReplyText("");
      setCallSeconds(0);
      setUserSpeakingBoth(false);

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        throw new Error(
          "This browser can't access the microphone. Try Chrome, Edge, Safari or Firefox."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (!alive()) {
        stream.getTracks().forEach((track) => track.stop());

        return;
      }

      streamRef.current = stream;

      stream.getAudioTracks().forEach((track) => {
        track.enabled = !mutedRef.current;
      });

      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error("Web Audio API is not supported by this browser.");
      }

      const audioContext = new AudioContextClass();

      audioContextRef.current = audioContext;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      if (!alive()) {
        return;
      }

      const source = audioContext.createMediaStreamSource(stream);

      sourceRef.current = source;

      /*
       * ScriptProcessor keeps PCM capture simple and
       * broadly compatible without a separate worklet file.
       */
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processorRef.current = processor;

      /* Zero gain prevents feedback while keeping the processor running. */
      const silentGain = audioContext.createGain();

      silentGain.gain.value = 0;

      silentGainRef.current = silentGain;

      /* Everything the AI says passes through here so the orb can react. */
      const outAnalyser = audioContext.createAnalyser();

      outAnalyser.fftSize = 512;
      outAnalyser.smoothingTimeConstant = 0.6;
      outAnalyser.connect(audioContext.destination);

      outAnalyserRef.current = outAnalyser;

      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(audioContext.destination);

      processor.onaudioprocess = (event) => {
        if (!recordingActiveRef.current) {
          levelRef.current = 0;

          return;
        }

        const input = event.inputBuffer;
        const channels = input.numberOfChannels;
        const frameCount = input.length;
        const mono = new Float32Array(frameCount);

        if (channels <= 1) {
          mono.set(input.getChannelData(0));
        } else {
          /* Average channels into mono. */
          for (let i = 0; i < frameCount; i += 1) {
            let sum = 0;

            for (let channel = 0; channel < channels; channel += 1) {
              sum += input.getChannelData(channel)[i];
            }

            mono[i] = sum / channels;
          }
        }

        let energy = 0;

        for (let i = 0; i < frameCount; i += 1) {
          energy += mono[i] * mono[i];
        }

        const rms = Math.sqrt(energy / frameCount);

        levelRef.current = rms;

        handleVad(rms);

        const chunks = pcmChunksRef.current;

        chunks.push(mono);

        /* Before speech starts, keep only a short rolling pre-roll. */
        if (!vadRef.current.speechDetected && chunks.length > PRE_ROLL_CHUNKS) {
          chunks.shift();
        }
      };

      callTimerRef.current = window.setInterval(() => {
        setCallSeconds((previous) => previous + 1);
      }, 1000);

      engineRef.current.startListening();
    } catch (err) {
      console.error("❌ Microphone error:", err);

      teardown();

      if (!mountedRef.current) {
        return;
      }

      let message = err?.message || "Could not access the microphone.";

      if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
        message =
          "Microphone access is blocked. Allow it in your browser's site settings, then tap to try again.";
      } else if (err?.name === "NotFoundError") {
        message =
          "No microphone was found. Connect one, then tap to try again.";
      }

      setError(message);

      setStatusBoth("error");
    }
  }, [handleVad, setStatusBoth, setUserSpeakingBoth, teardown]);

  /* =======================================================
     INTERRUPT
     Stops the AI (or cancels a pending request) and hands
     the floor back to the user.
  ======================================================= */

  const interrupt = useCallback(() => {
    controllerRef.current?.abort();

    voicePlayerRef.current?.stop?.();

    voicePlayerRef.current = null;

    engineRef.current.startListening();
  }, []);

  /* =======================================================
     CLOSE
  ======================================================= */

  const handleClose = useCallback(() => {
    sessionLiveRef.current = false;

    controllerRef.current?.abort();

    voicePlayerRef.current?.stop?.();

    voicePlayerRef.current = null;

    teardown();

    onCloseRef.current?.();
  }, [teardown]);

  /* =======================================================
     ACTIONS
  ======================================================= */

  const handleAction = useCallback(() => {
    const current = statusRef.current;

    if (current === "listening") {
      if (userSpeakingRef.current) {
        engineRef.current.finishTurn(true);
      }

      return;
    }

    if (current === "thinking" || current === "speaking") {
      interrupt();

      return;
    }

    if (current === "replied") {
      interrupt();

      return;
    }

    if (current === "paused" || current === "error") {
      if (audioContextRef.current && streamRef.current) {
        engineRef.current.startListening();

        return;
      }

      /* The microphone session never started. Try again. */
      teardown();

      sessionLiveRef.current = true;

      engineRef.current.startSession();
    }
  }, [interrupt, teardown]);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;

    mutedRef.current = next;

    setMuted(next);

    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
  }, []);

  engineRef.current = {
    startSession,
    teardown,
    startListening,
    pauseListening,
    finishTurn,
    sendTurn,
    interrupt,
  };

  /* =======================================================
     SESSION LIFECYCLE
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    mountedRef.current = true;

    sessionLiveRef.current = true;

    engineRef.current.startSession();

    return () => {
      mountedRef.current = false;

      sessionLiveRef.current = false;

      controllerRef.current?.abort();

      voicePlayerRef.current?.stop?.();

      voicePlayerRef.current = null;

      engineRef.current.teardown();
    };
  }, [open]);

  /* =======================================================
     KEYBOARD
     Escape ends the call. Space acts like the main button.
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        handleClose();

        return;
      }

      const tag = event.target?.tagName;

      if (
        event.code === "Space" &&
        tag !== "BUTTON" &&
        tag !== "INPUT" &&
        tag !== "TEXTAREA"
      ) {
        event.preventDefault();

        handleAction();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose, handleAction]);

  /* =======================================================
     CAPTIONS
     Words appear at speaking pace while the AI talks.
  ======================================================= */

  const replyWords = useMemo(
    () => replyText.split(/\s+/).filter(Boolean),
    [replyText]
  );

  useEffect(() => {
    if (!replyWords.length) {
      setRevealCount(0);

      return undefined;
    }

    if (status !== "speaking") {
      setRevealCount(replyWords.length);

      return undefined;
    }

    setRevealCount(0);

    const timer = window.setInterval(() => {
      setRevealCount((previous) => {
        if (previous >= replyWords.length) {
          window.clearInterval(timer);

          return previous;
        }

        return previous + 1;
      });
    }, WORD_REVEAL_MS);

    return () => window.clearInterval(timer);
  }, [status, replyWords]);

  useEffect(() => {
    const element = captionsRef.current;

    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [revealCount, heardText]);

  /* =======================================================
     THE ORB
     One canvas that breathes when idle, swirls while
     thinking, and moves with the real audio level of the
     person (listening) or the AI (speaking).
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return undefined;
    }

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = ORB_SIZE * dpr;
    canvas.height = ORB_SIZE * dpr;

    const color = [...ORB_COLORS.idle];
    const outBuffer = new Uint8Array(1024);

    let frame = 0;
    let smooth = 0;

    const draw = (t) => {
      frame = requestAnimationFrame(draw);

      const state = statusRef.current;
      const tone = toneFor(state);

      /* ---------------- level ---------------- */

      let target = 0;

      if (state === "listening") {
        target = mutedRef.current ? 0 : Math.min(1, levelRef.current * 9);
      } else if (state === "speaking") {
        const analyser = outAnalyserRef.current;
        const player = voicePlayerRef.current;

        if (analyser && player && !player.simulated) {
          analyser.getByteTimeDomainData(outBuffer);

          const length = Math.min(analyser.fftSize, outBuffer.length);

          let energy = 0;

          for (let i = 0; i < length; i += 1) {
            const value = (outBuffer[i] - 128) / 128;

            energy += value * value;
          }

          target = Math.min(1, Math.sqrt(energy / length) * 5);
        } else {
          target = Math.max(
            0,
            Math.min(1, 0.35 + 0.25 * Math.sin(t / 140) + 0.15 * Math.sin(t / 57))
          );
        }
      }

      smooth += (target - smooth) * (target > smooth ? 0.35 : 0.12);

      /* ---------------- color ---------------- */

      const wanted = ORB_COLORS[tone];

      for (let i = 0; i < 3; i += 1) {
        color[i] += (wanted[i] - color[i]) * 0.06;
      }

      const r = Math.round(color[0]);
      const g = Math.round(color[1]);
      const b = Math.round(color[2]);

      /* ---------------- geometry ---------------- */

      const center = ORB_SIZE / 2;
      const breathe = reduceMotion ? 1 : 1 + 0.035 * Math.sin(t / 1100);
      const pulse = state === "thinking" && !reduceMotion ? 0.05 * Math.sin(t / 260) : 0;
      const base = ORB_SIZE * 0.22 * breathe * (1 + pulse);
      const amplitude = reduceMotion ? 0.03 : 0.05 + smooth * 0.34;
      const idleDim = tone === "idle" ? 0.7 : 1;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, ORB_SIZE, ORB_SIZE);

      /* glow */
      const glowRadius = base * (2.1 + smooth * 0.9);

      const glow = context.createRadialGradient(
        center,
        center,
        base * 0.4,
        center,
        center,
        glowRadius
      );

      glow.addColorStop(0, `rgba(${r},${g},${b},${(0.28 + smooth * 0.25) * idleDim})`);
      glow.addColorStop(1, `rgba(${r},${g},${b},0)`);

      context.fillStyle = glow;
      context.fillRect(0, 0, ORB_SIZE, ORB_SIZE);

      /* voice ring */
      if (smooth > 0.04) {
        context.beginPath();
        context.arc(center, center, base * (1.35 + smooth * 0.5), 0, Math.PI * 2);
        context.strokeStyle = `rgba(${r},${g},${b},${0.12 + smooth * 0.3})`;
        context.lineWidth = 1.5;
        context.stroke();
      }

      /* body layers */
      const points = 72;

      for (let layer = 0; layer < 3; layer += 1) {
        const phase = layer * 1.7;

        context.beginPath();

        for (let i = 0; i <= points; i += 1) {
          const angle = (i / points) * Math.PI * 2;

          const wobble = reduceMotion
            ? 0
            : Math.sin(angle * 3 + t / (520 + layer * 140) + phase) * 0.55 +
              Math.sin(angle * 5 - t / (690 - layer * 90) + phase * 1.3) * 0.3 +
              Math.sin(angle * 2 + t / 900) * 0.15;

          const radius = base * (1 + layer * 0.07) * (1 + amplitude * wobble);

          const x = center + Math.cos(angle) * radius;
          const y = center + Math.sin(angle) * radius;

          if (i === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }

        context.closePath();

        if (layer < 2) {
          context.fillStyle = `rgba(${r},${g},${b},${(layer === 0 ? 0.16 : 0.28) * idleDim})`;
        } else {
          const body = context.createRadialGradient(
            center - base * 0.3,
            center - base * 0.35,
            base * 0.1,
            center,
            center,
            base * 1.4
          );

          body.addColorStop(0, `rgba(${Math.min(255, r + 90)},${Math.min(255, g + 70)},${Math.min(255, b + 70)},${0.95 * idleDim})`);
          body.addColorStop(0.55, `rgba(${r},${g},${b},${0.85 * idleDim})`);
          body.addColorStop(1, `rgba(${Math.round(r * 0.45)},${Math.round(g * 0.45)},${Math.round(b * 0.55)},${0.9 * idleDim})`);

          context.fillStyle = body;
        }

        context.fill();
      }

      /* thinking ring */
      if (state === "thinking") {
        const spin = reduceMotion ? 0 : t / 420;

        context.beginPath();
        context.arc(center, center, base * 1.55, spin, spin + Math.PI * 1.2);
        context.strokeStyle = `rgba(${r},${g},${b},0.75)`;
        context.lineWidth = 3;
        context.lineCap = "round";
        context.stroke();
      }
    };

    frame = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(frame);
  }, [open]);

  /* =======================================================
     CLOSED
  ======================================================= */

  if (!open) {
    return null;
  }

  /* =======================================================
     DERIVED UI
  ======================================================= */

  const tone = toneFor(status);

  let statusLabel = "Connecting";
  let hint = "";
  let showDots = false;

  switch (status) {
    case "listening":
      statusLabel = userSpeaking ? "I'm listening" : "Go ahead, I'm listening";
      hint = userSpeaking
        ? "Pause when you're done and I'll answer."
        : notice || "Just start talking. No buttons needed.";
      break;

    case "thinking":
      statusLabel = "Thinking";
      hint = "Tap the orb to cancel.";
      showDots = true;
      break;

    case "speaking":
      statusLabel = "Speaking";
      hint = "Tap the orb to interrupt me.";
      break;

    case "replied":
      statusLabel = "Reply ready";
      hint = "Voice playback isn't available, so I've written my answer below.";
      break;

    case "paused":
      statusLabel = "Paused";
      hint = "I stopped listening because it's been quiet. Tap the orb to continue.";
      break;

    case "error":
      statusLabel = "Voice chat stopped";
      hint = "Tap the orb to try again.";
      break;

    default:
      statusLabel = "Connecting";
      hint = "Allow microphone access if your browser asks.";
      showDots = true;
  }

  let primary;

  switch (status) {
    case "listening":
      primary = userSpeaking
        ? { label: "Send now", Icon: Send, enabled: true }
        : { label: "Listening", Icon: Mic, enabled: false };
      break;

    case "thinking":
      primary = { label: "Cancel", Icon: X, enabled: true };
      break;

    case "speaking":
    case "replied":
      primary = { label: "Interrupt", Icon: Mic, enabled: true };
      break;

    case "starting":
      primary = { label: "Connecting", Icon: Mic, enabled: false };
      break;

    default:
      primary = { label: "Tap to talk", Icon: Mic, enabled: true };
  }

  const PrimaryIcon = primary.Icon;

  const micReady = Boolean(streamRef.current);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="RevelaAI voice conversation"
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-stretch
        justify-center
        bg-black/80
        backdrop-blur-xl
        sm:items-center
        sm:p-4
      "
    >
      <div
        className="
          relative
          flex
          h-full
          w-full
          max-w-md
          flex-col
          overflow-hidden
          border-white/10
          bg-revela-card
          shadow-2xl
          sm:h-auto
          sm:max-h-[92vh]
          sm:rounded-3xl
          sm:border
        "
      >
        {/* Ambient light behind the orb */}

        <div
          aria-hidden="true"
          className={`
            pointer-events-none
            absolute
            left-1/2
            top-28
            h-72
            w-72
            -translate-x-1/2
            rounded-full
            blur-3xl
            transition-colors
            duration-700
            ${GLOW_CLASS[tone]}
          `}
        />

        {/* Header */}

        <div
          className="
            relative
            flex
            items-center
            justify-between
            px-5
            py-4
          "
        >
          <p className="text-sm font-bold text-white">RevelaAI</p>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span
              aria-hidden="true"
              className={`
                h-2
                w-2
                rounded-full
                ${
                  status === "error"
                    ? "bg-red-500"
                    : status === "starting" || status === "paused"
                      ? "bg-gray-500"
                      : "animate-pulse bg-emerald-400"
                }
              `}
            />

            <span className="tabular-nums">{formatClock(callSeconds)}</span>
          </div>
        </div>

        {/* Body */}

        <div
          className="
            relative
            flex
            min-h-0
            flex-1
            flex-col
            items-center
            overflow-y-auto
            px-5
            pb-5
          "
        >
          {/* Orb */}

          <button
            type="button"
            onClick={handleAction}
            aria-label={
              primary.enabled
                ? `${primary.label}. ${hint}`
                : `${statusLabel}. ${hint}`
            }
            className="
              relative
              mx-auto
              mt-2
              block
              shrink-0
              select-none
              rounded-full
              outline-none
              transition-transform
              duration-200
              focus-visible:ring-2
              focus-visible:ring-emerald-400/60
              active:scale-95
            "
            style={{
              width: ORB_SIZE,
              height: ORB_SIZE,
              maxWidth: "100%",
            }}
          >
            <canvas
              ref={canvasRef}
              className="h-full w-full"
              style={{ width: "100%", height: "100%" }}
            />
          </button>

          {/* Status */}

          <div aria-live="polite" className="mt-2 text-center">
            <p className="text-lg font-bold text-white">
              {statusLabel}

              {showDots && <Dots />}
            </p>

            <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-gray-400">
              {hint}
            </p>
          </div>

          {/* Captions */}

          {(heardText || replyWords.length > 0) && (
            <div
              ref={captionsRef}
              className="
                mt-4
                max-h-44
                w-full
                overflow-y-auto
                rounded-2xl
                border
                border-white/10
                bg-black/20
                px-4
                py-3
                text-left
              "
            >
              {heardText && (
                <p className="text-xs leading-5 text-gray-400">
                  <span className="font-semibold text-gray-300">You said:</span>{" "}
                  {heardText}
                </p>
              )}

              {replyWords.length > 0 && (
                <p className="mt-2 text-sm leading-6 text-gray-100">
                  {replyWords.slice(0, revealCount).join(" ")}
                </p>
              )}
            </div>
          )}

          {/* Error */}

          {error && (
            <div
              role="alert"
              className="
                mt-4
                flex
                w-full
                items-start
                gap-2
                rounded-xl
                border
                border-red-500/20
                bg-red-500/5
                px-3
                py-3
                text-xs
                leading-5
                text-red-300
              "
            >
              <AlertCircle size={15} className="mt-0.5 shrink-0" />

              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Controls */}

        <div
          className="
            relative
            flex
            items-center
            justify-center
            gap-3
            border-t
            border-white/10
            px-5
            py-4
          "
        >
          <button
            type="button"
            onClick={toggleMute}
            disabled={!micReady}
            aria-pressed={muted}
            aria-label={muted ? "Unmute microphone" : "Mute microphone"}
            className={`
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-full
              border
              outline-none
              transition
              focus-visible:ring-2
              focus-visible:ring-emerald-400/60
              disabled:opacity-40
              ${
                muted
                  ? "border-red-500/40 bg-red-500/15 text-red-300"
                  : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
              }
            `}
          >
            {muted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button
            type="button"
            onClick={handleAction}
            disabled={!primary.enabled}
            className="
              flex
              h-12
              flex-1
              items-center
              justify-center
              gap-2
              rounded-full
              bg-emerald-600
              px-5
              text-sm
              font-bold
              text-white
              outline-none
              transition
              hover:bg-emerald-500
              focus-visible:ring-2
              focus-visible:ring-emerald-300/70
              active:scale-[0.99]
              disabled:cursor-default
              disabled:bg-white/5
              disabled:text-gray-500
            "
          >
            <PrimaryIcon size={16} />

            {primary.label}
          </button>

          <button
            type="button"
            onClick={handleClose}
            aria-label="End voice chat"
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-red-600
              text-white
              outline-none
              transition
              hover:bg-red-500
              focus-visible:ring-2
              focus-visible:ring-red-300/70
              active:scale-95
            "
          >
            <PhoneOff size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
