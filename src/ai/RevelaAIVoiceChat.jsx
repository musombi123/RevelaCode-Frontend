// src/ai/RevelaAIVoiceChat.jsx

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Mic,
  Square,
  X,
  Loader2,
  Volume2,
  AlertCircle,
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

const MAX_RECORDING_SECONDS = 60;


/* =========================================================
   WAV ENCODER
========================================================= */

/**
 * Convert Float32 PCM samples to a valid
 * mono, 16-bit PCM WAV file.
 *
 * WAV structure:
 *
 * RIFF
 * WAVE
 * fmt
 * data
 */
const encodeWav = (
  samples,
  sampleRate
) => {
  if (
    !samples ||
    !samples.length
  ) {
    throw new Error(
      "No PCM samples were captured."
    );
  }

  const bytesPerSample = 2;
  const channels = 1;

  const dataSize =
    samples.length *
    bytesPerSample;

  const buffer = new ArrayBuffer(
    44 + dataSize
  );

  const view =
    new DataView(buffer);

  /* -------------------------------------------------------
     RIFF HEADER
  ------------------------------------------------------- */

  writeAscii(
    view,
    0,
    "RIFF"
  );

  view.setUint32(
    4,
    36 + dataSize,
    true
  );

  writeAscii(
    view,
    8,
    "WAVE"
  );

  /* -------------------------------------------------------
     FORMAT CHUNK
  ------------------------------------------------------- */

  writeAscii(
    view,
    12,
    "fmt "
  );

  view.setUint32(
    16,
    16,
    true
  );

  // PCM format
  view.setUint16(
    20,
    1,
    true
  );

  // Mono
  view.setUint16(
    22,
    channels,
    true
  );

  view.setUint32(
    24,
    sampleRate,
    true
  );

  const byteRate =
    sampleRate *
    channels *
    bytesPerSample;

  view.setUint32(
    28,
    byteRate,
    true
  );

  const blockAlign =
    channels *
    bytesPerSample;

  view.setUint16(
    32,
    blockAlign,
    true
  );

  // 16-bit
  view.setUint16(
    34,
    16,
    true
  );

  /* -------------------------------------------------------
     DATA CHUNK
  ------------------------------------------------------- */

  writeAscii(
    view,
    36,
    "data"
  );

  view.setUint32(
    40,
    dataSize,
    true
  );

  /* -------------------------------------------------------
     PCM SAMPLE DATA
  ------------------------------------------------------- */

  let offset = 44;

  for (
    let i = 0;
    i < samples.length;
    i += 1
  ) {
    let sample =
      Number(
        samples[i]
      ) || 0;

    sample = Math.max(
      -1,
      Math.min(
        1,
        sample
      )
    );

    const int16 =
      sample < 0
        ? sample * 0x8000
        : sample * 0x7fff;

    view.setInt16(
      offset,
      int16,
      true
    );

    offset += 2;
  }

  return new Blob(
    [buffer],
    {
      type: "audio/wav",
    }
  );
};


/* =========================================================
   ASCII HELPER
========================================================= */

const writeAscii = (
  view,
  offset,
  value
) => {
  for (
    let i = 0;
    i < value.length;
    i += 1
  ) {
    view.setUint8(
      offset + i,
      value.charCodeAt(i)
    );
  }
};


/* =========================================================
   STREAMING AUDIO PLAYBACK (additive)
========================================================= */

const streamViaMediaSource = async (response, mime, playerRef) => {
  const mediaSource = new MediaSource();
  const audio = new Audio();
  const url = URL.createObjectURL(mediaSource);
  audio.src = url;

  playerRef.current = {
    stop: () => {
      try { audio.pause(); } catch { /* ignore */ }
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
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
    if (sourceBuffer.updating) return;
    if (queue.length) {
      sourceBuffer.appendBuffer(queue.shift());
    } else if (finished && mediaSource.readyState === "open") {
      mediaSource.endOfStream();
    }
  };

  sourceBuffer.addEventListener("updateend", pump);

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    queue.push(value);
    pump();
    if (!started) {
      started = true;
      audio.play().catch(() => { /* autoplay restrictions are non-fatal */ });
    }
  }

  finished = true;
  pump();
};

const streamWav = async (response, playerRef) => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContextClass();
  if (ctx.state === "suspended") await ctx.resume().catch(() => {});

  playerRef.current = {
    stop: () => {
      try { ctx.close(); } catch { /* ignore */ }
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
    if (!usable) return;

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
    node.connect(ctx.destination);
    nextTime = Math.max(nextTime, ctx.currentTime + 0.05);
    node.start(nextTime);
    nextTime += buffer.duration;
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    let chunk = value;

    if (!headerParsed) {
      header = concat(header, chunk);
      if (header.length < 44) continue;

      const hv = new DataView(header.buffer, header.byteOffset, header.length);
      channels = hv.getUint16(22, true) || 1;
      sampleRate = hv.getUint32(24, true) || 24000;
      headerParsed = true;
      chunk = header.slice(44);
      header = new Uint8Array(0);
    }

    schedule(concat(leftover, chunk));
  }
};

const streamAudioFromResponse = async (response, playerRef) => {
  if (!response.body) {
    throw new Error("Streaming is not supported by this browser.");
  }

  const type = (response.headers.get("content-type") || "").toLowerCase();

  if (
    type.includes("audio/mpeg") &&
    typeof window.MediaSource !== "undefined" &&
    window.MediaSource.isTypeSupported("audio/mpeg")
  ) {
    return streamViaMediaSource(response, "audio/mpeg", playerRef);
  }

  if (type.includes("wav")) {
    return streamWav(response, playerRef);
  }

  // Fallback: buffer the whole stream, then play.
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  playerRef.current = {
    stop: () => {
      try { audio.pause(); } catch { /* ignore */ }
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
    },
  };

  await audio.play().catch(() => {});
};


/* =========================================================
   COMPONENT
========================================================= */

export default function RevelaAIVoiceChat({
  sessionId,
  onVoiceResult,
  onClose,
}) {
  const {
    authFetch,
  } = useAuth();

  /* -------------------------------------------------------
     AUDIO REFERENCES
  ------------------------------------------------------- */

  const streamRef =
    useRef(null);

  const audioContextRef =
    useRef(null);

  const sourceRef =
    useRef(null);

  const processorRef =
    useRef(null);

  const silentGainRef =
    useRef(null);

  const analyserRef =
    useRef(null);

  const animationIdRef =
    useRef(null);

  const dataArrayRef =
    useRef(null);

  const canvasRef =
    useRef(null);

  /* -------------------------------------------------------
     PCM BUFFER
  ------------------------------------------------------- */

  const pcmChunksRef =
    useRef([]);

  const recordingActiveRef =
    useRef(false);

  /* -------------------------------------------------------
     CONTROL REFERENCES
  ------------------------------------------------------- */

  const controllerRef =
    useRef(null);

  const voicePlayerRef =
    useRef(null);

  const timerRef =
    useRef(null);

  const mountedRef =
    useRef(true);

  const shouldSubmitRef =
    useRef(true);

  const startedRef =
    useRef(false);

  /* -------------------------------------------------------
     STATE
  ------------------------------------------------------- */

  const [
    status,
    setStatus,
  ] = useState("starting");

  const [
    error,
    setError,
  ] = useState("");

  const [
    elapsed,
    setElapsed,
  ] = useState(0);


  /* =======================================================
     CLEAN AUDIO
  ======================================================= */

  const cleanupAudio =
    useCallback(() => {
      recordingActiveRef.current =
        false;

      if (
        animationIdRef.current
      ) {
        cancelAnimationFrame(
          animationIdRef.current
        );

        animationIdRef.current =
          null;
      }

      if (
        timerRef.current
      ) {
        window.clearInterval(
          timerRef.current
        );

        window.clearTimeout(
          timerRef.current
        );

        timerRef.current =
          null;
      }

      try {
        if (
          processorRef.current
        ) {
          processorRef.current.onaudioprocess =
            null;

          processorRef.current.disconnect();
        }
      } catch {
        // Ignore cleanup failure.
      }

      try {
        processorRef.current = null;
      } catch {
        // Ignore.
      }

      try {
        silentGainRef.current?.disconnect();
      } catch {
        // Ignore.
      }

      silentGainRef.current =
        null;

      try {
        sourceRef.current?.disconnect();
      } catch {
        // Ignore.
      }

      sourceRef.current =
        null;

      streamRef.current
        ?.getTracks()
        .forEach(
          (track) =>
            track.stop()
        );

      streamRef.current =
        null;

      try {
        audioContextRef.current?.close();
      } catch {
        // Ignore.
      }

      audioContextRef.current =
        null;

      analyserRef.current =
        null;

      dataArrayRef.current =
        null;
    }, []);


  /* =======================================================
     CLOSE
  ======================================================= */

  const handleClose =
    useCallback(() => {
      shouldSubmitRef.current =
        false;

      controllerRef.current?.abort();

      voicePlayerRef.current?.stop?.();

      cleanupAudio();

      onClose?.();
    }, [
      cleanupAudio,
      onClose,
    ]);


  /* =======================================================
     SEND WAV
  ======================================================= */

  const sendAudio =
    useCallback(
      async (
        wavBlob
      ) => {
        if (
          !wavBlob ||
          wavBlob.size < 44
        ) {
          setError(
            "No valid WAV audio was captured."
          );

          setStatus(
            "error"
          );

          return;
        }

        setStatus(
          "processing"
        );

        setError("");

        if (!REVELAAI_URL) {
          setError(
            "VITE_REVELAAI_URL is not configured."
          );

          setStatus(
            "error"
          );

          return;
        }

        /*
         * Confirm we are actually sending WAV.
         */
        console.info(
          "🎙️ RevelaAI WAV upload:",
          {
            size: wavBlob.size,
            type: wavBlob.type,
          }
        );

        const formData =
          new FormData();

        formData.append(
          "audio",
          wavBlob,
          "voice.wav"
        );

        const controller =
          new AbortController();

        controllerRef.current =
          controller;

        try {
          const response =
            await authFetch(
              `${REVELAAI_URL}/voice`,
              {
                method: "POST",

                headers: {
                  "X-Session-ID":
                    sessionId || "",
                },

                body:
                  formData,

                signal:
                  controller.signal,
              }
            );

          const contentType =
            response.headers.get("content-type") || "";

          if (
            response.ok &&
            /^audio\//i.test(contentType)
          ) {
            await streamAudioFromResponse(
              response,
              voicePlayerRef
            );

            let heard = "";
            let reply = "";

            try {
              heard = decodeURIComponent(
                response.headers.get("X-Heard") || ""
              );
              reply = decodeURIComponent(
                response.headers.get("X-Response") || ""
              );
            } catch {
              // Ignore malformed headers.
            }

            if (mountedRef.current) {
              setStatus("complete");

              onVoiceResult?.({
                heard,
                response: reply,
                streamed: true,
              });
            }

            return;
          }

          const data =
            await response
              .json()
              .catch(
                () => ({})
              );

          if (!response.ok) {
            throw new Error(
              data?.error
                ?.message ||
                data?.message ||
                `Voice request failed (HTTP ${response.status}).`
            );
          }

          if (
            !data?.heard &&
            !data?.response
          ) {
            throw new Error(
              "RevelaAI returned no voice result."
            );
          }

          /*
           * TTS may be disabled while HF credits
           * are exhausted. That is not a voice-AI
           * failure because transcription + AI can
           * still succeed.
           */
          if (
            data?.audio_url &&
            /^https?:\/\//i.test(
              data.audio_url
            )
          ) {
            try {
              const audio =
                new Audio(
                  data.audio_url
                );

              audio.volume = 1;

              await audio.play();
            } catch {
              /*
               * Browser autoplay restrictions
               * are non-fatal.
               */
            }
          }

          if (
            mountedRef.current
          ) {
            setStatus(
              "complete"
            );

            onVoiceResult?.(
              data
            );
          }
        } catch (err) {
          if (
            err?.name ===
            "AbortError"
          ) {
            return;
          }

          console.error(
            "❌ RevelaAI voice request failed:",
            err
          );

          if (
            mountedRef.current
          ) {
            setError(
              err?.message ||
                "Voice processing failed."
            );

            setStatus(
              "error"
            );
          }
        } finally {
          if (
            controllerRef.current ===
            controller
          ) {
            controllerRef.current =
              null;
          }
        }
      },
      [
        authFetch,
        onVoiceResult,
        sessionId,
      ]
    );


  /* =======================================================
     STOP RECORDING
  ======================================================= */

  const stopRecording =
    useCallback(
      async (
        submit = true
      ) => {
        shouldSubmitRef.current =
          submit;

        if (
          !recordingActiveRef.current
        ) {
          return;
        }

        recordingActiveRef.current =
          false;

        if (
          timerRef.current
        ) {
          window.clearInterval(
            timerRef.current
          );

          window.clearTimeout(
            timerRef.current
          );

          timerRef.current =
            null;
        }

        const audioContext =
          audioContextRef.current;

        const processor =
          processorRef.current;

        /*
         * Stop collecting new PCM data.
         */
        if (processor) {
          processor.onaudioprocess =
            null;
        }

        /*
         * Copy the collected PCM.
         */
        const chunks =
          pcmChunksRef.current;

        pcmChunksRef.current =
          [];

        /*
         * Determine the sample rate used
         * by the AudioContext.
         */
        const sampleRate =
          audioContext?.sampleRate ||
          44100;

        cleanupAudio();

        if (
          !submit
        ) {
          return;
        }

        if (
          !chunks.length
        ) {
          setError(
            "No speech was captured."
          );

          setStatus(
            "error"
          );

          return;
        }

        const totalSamples =
          chunks.reduce(
            (
              total,
              chunk
            ) =>
              total +
              chunk.length,
            0
          );

        if (
          totalSamples < 1
        ) {
          setError(
            "No speech samples were captured."
          );

          setStatus(
            "error"
          );

          return;
        }

        const samples =
          new Float32Array(
            totalSamples
          );

        let offset = 0;

        for (
          const chunk of chunks
        ) {
          samples.set(
            chunk,
            offset
          );

          offset +=
            chunk.length;
        }

        const wavBlob =
          encodeWav(
            samples,
            sampleRate
          );

        /*
         * Browser-side validation.
         */
        console.info(
          "✅ WAV created:",
          {
            size:
              wavBlob.size,
            type:
              wavBlob.type,
            sampleRate,
            channels: 1,
            bitsPerSample: 16,
          }
        );

        await sendAudio(
          wavBlob
        );
      },
      [
        cleanupAudio,
        sendAudio,
      ]
    );


  /* =======================================================
     WAVEFORM
  ======================================================= */

  const startWaveform =
    useCallback(() => {
      const canvas =
        canvasRef.current;

      const analyser =
        analyserRef.current;

      if (
        !canvas ||
        !analyser
      ) {
        return;
      }

      const context =
        canvas.getContext(
          "2d"
        );

      if (!context) {
        return;
      }

      analyser.fftSize =
        256;

      const bufferLength =
        analyser.frequencyBinCount;

      const dataArray =
        new Uint8Array(
          bufferLength
        );

      dataArrayRef.current =
        dataArray;

      const draw =
        () => {
          if (
            !analyserRef.current
          ) {
            return;
          }

          animationIdRef.current =
            requestAnimationFrame(
              draw
            );

          analyserRef.current.getByteTimeDomainData(
            dataArray
          );

          context.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
          );

          context.fillStyle =
            "rgba(255,255,255,0.03)";

          context.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
          );

          context.lineWidth =
            2;

          context.strokeStyle =
            "#10b981";

          context.beginPath();

          const sliceWidth =
            canvas.width /
            dataArray.length;

          let x = 0;

          for (
            let i = 0;
            i <
            dataArray.length;
            i += 1
          ) {
            const v =
              dataArray[i] /
              128.0;

            const y =
              (
                v *
                canvas.height
              ) /
              2;

            if (
              i === 0
            ) {
              context.moveTo(
                x,
                y
              );
            } else {
              context.lineTo(
                x,
                y
              );
            }

            x +=
              sliceWidth;
          }

          context.lineTo(
            canvas.width,
            canvas.height /
              2
          );

          context.stroke();
        };

      draw();
    }, []);


  /* =======================================================
     START RECORDING
  ======================================================= */

  const startRecording =
    useCallback(
      async () => {
        if (
          startedRef.current
        ) {
          return;
        }

        startedRef.current =
          true;

        try {
          setStatus(
            "requesting"
          );

          setError("");

          if (
            typeof navigator ===
              "undefined" ||
            !navigator.mediaDevices
              ?.getUserMedia
          ) {
            throw new Error(
              "Microphone access is not supported by this browser."
            );
          }

          const stream =
            await navigator.mediaDevices.getUserMedia(
              {
                audio: {
                  channelCount: 1,
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                },
              }
            );

          if (
            !mountedRef.current
          ) {
            stream
              .getTracks()
              .forEach(
                (track) =>
                  track.stop()
              );

            return;
          }

          streamRef.current =
            stream;

          /*
           * AudioContext captures the raw PCM
           * audio stream. No MediaRecorder,
           * WebM, Opus, MP4 or OGG.
           */
          const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

          if (
            !AudioContextClass
          ) {
            throw new Error(
              "Web Audio API is not supported by this browser."
            );
          }

          const audioContext =
            new AudioContextClass();

          audioContextRef.current =
            audioContext;

          if (
            audioContext.state ===
            "suspended"
          ) {
            await audioContext.resume();
          }

          const source =
            audioContext.createMediaStreamSource(
              stream
            );

          sourceRef.current =
            source;

          /*
           * ScriptProcessor is used here because it
           * provides broad browser compatibility for
           * PCM capture without requiring a separate
           * AudioWorklet module file.
           */
          const processor =
            audioContext.createScriptProcessor(
              4096,
              1,
              1
            );

          processorRef.current =
            processor;

          /*
           * Zero-gain output prevents microphone
           * feedback while keeping the processor
           * active.
           */
          const silentGain =
            audioContext.createGain();

          silentGain.gain.value =
            0;

          silentGainRef.current =
            silentGain;

          /*
           * Waveform analyser.
           */
          const analyser =
            audioContext.createAnalyser();

          analyserRef.current =
            analyser;

          source.connect(
            analyser
          );

          source.connect(
            processor
          );

          processor.connect(
            silentGain
          );

          silentGain.connect(
            audioContext.destination
          );

          /*
           * PCM capture.
           */
          pcmChunksRef.current =
            [];

          processor.onaudioprocess =
            (event) => {
              if (
                !recordingActiveRef.current
              ) {
                return;
              }

              const input =
                event.inputBuffer;

              const channels =
                input.numberOfChannels;

              const frameCount =
                input.length;

              const mono =
                new Float32Array(
                  frameCount
                );

              if (
                channels <= 1
              ) {
                mono.set(
                  input.getChannelData(
                    0
                  )
                );
              } else {
                /*
                 * Average channels into mono.
                 */
                for (
                  let i = 0;
                  i <
                  frameCount;
                  i += 1
                ) {
                  let sum = 0;

                  for (
                    let channel = 0;
                    channel <
                    channels;
                    channel += 1
                  ) {
                    sum +=
                      input.getChannelData(
                        channel
                      )[i];
                  }

                  mono[i] =
                    sum /
                    channels;
                }
              }

              pcmChunksRef.current.push(
                mono
              );
            };

          startWaveform();

          setElapsed(0);

          recordingActiveRef.current =
            true;

          timerRef.current =
            window.setInterval(
              () => {
                setElapsed(
                  (previous) =>
                    previous + 1
                );
              },
              1000
            );

          setStatus(
            "recording"
          );

          /*
           * Automatic safety stop after
           * MAX_RECORDING_SECONDS.
           */
          window.setTimeout(
            () => {
              if (
                recordingActiveRef.current
              ) {
                stopRecording(
                  true
                );
              }
            },
            MAX_RECORDING_SECONDS *
              1000
          );
        } catch (err) {
          startedRef.current =
            false;

          console.error(
            "❌ Microphone error:",
            err
          );

          cleanupAudio();

          setError(
            err?.message ||
              "Could not access the microphone."
          );

          setStatus(
            "error"
          );
        }
      },
      [
        cleanupAudio,
        startWaveform,
        stopRecording,
      ]
    );


  /* =======================================================
     LIFECYCLE
  ======================================================= */

  useEffect(() => {
    mountedRef.current =
      true;

    shouldSubmitRef.current =
      true;

    startRecording();

    return () => {
      mountedRef.current =
        false;

      shouldSubmitRef.current =
        false;

      controllerRef.current?.abort();

      voicePlayerRef.current?.stop?.();

      cleanupAudio();
    };
  }, [
    cleanupAudio,
    startRecording,
  ]);


  /* =======================================================
     FORMAT TIME
  ======================================================= */

  const formattedTime =
    `${String(
      Math.floor(
        elapsed / 60
      )
    ).padStart(
      2,
      "0"
    )}:${String(
      elapsed % 60
    ).padStart(
      2,
      "0"
    )}`;


  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/70
        p-4
        backdrop-blur-md
      "
    >
      <div
        className="
          w-full
          max-w-md
          overflow-hidden
          rounded-3xl
          border
          border-white/10
          bg-revela-card
          shadow-2xl
        "
      >
        {/* Header */}

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-white/10
            px-5
            py-4
          "
        >
          <div>
            <p
              className="
                text-sm
                font-bold
                text-white
              "
            >
              RevelaAI Voice
            </p>

            <p
              className="
                mt-1
                text-[11px]
                text-gray-500
              "
            >
              Speak naturally to RevelaAI
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleClose
            }
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              text-gray-400
              transition
              hover:bg-white/10
              hover:text-white
            "
            aria-label="Close voice input"
          >
            <X size={18} />
          </button>
        </div>


        {/* Body */}

        <div
          className="
            flex
            flex-col
            items-center
            px-5
            py-7
          "
        >
          {/* Microphone */}

          <div
            className={`
              flex
              h-20
              w-20
              items-center
              justify-center
              rounded-full
              border
              ${
                status ===
                "recording"
                  ? "border-emerald-400/40 bg-emerald-500/10"
                  : "border-white/10 bg-white/5"
              }
              transition
            `}
          >
            {status ===
            "processing" ? (
              <Loader2
                size={30}
                className="
                  animate-spin
                  text-emerald-400
                "
              />
            ) : (
              <Mic
                size={30}
                className={
                  status ===
                  "recording"
                    ? "text-emerald-400"
                    : "text-gray-400"
                }
              />
            )}
          </div>


          {/* Status */}

          <p
            className="
              mt-5
              text-lg
              font-bold
              text-white
            "
          >
            {status ===
            "recording"
              ? "Listening..."
              : status ===
                  "processing"
                ? "RevelaAI is processing..."
                : status ===
                    "complete"
                  ? "Complete"
                  : status ===
                      "error"
                    ? "Voice error"
                    : "Starting microphone..."}
          </p>

          <p
            className="
              mt-1
              text-xs
              text-gray-500
            "
          >
            {formattedTime}
          </p>


          {/* Waveform */}

          <canvas
            ref={
              canvasRef
            }
            width={520}
            height={120}
            className="
              mt-6
              h-28
              w-full
              rounded-2xl
              border
              border-white/10
              bg-black/20
            "
          />


          {/* Error */}

          {error && (
            <div
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
                text-red-300
              "
            >
              <AlertCircle
                size={15}
                className="mt-0.5 shrink-0"
              />

              <span>
                {error}
              </span>
            </div>
          )}


          {/* Completed audio indicator */}

          {status ===
            "complete" && (
            <div
              className="
                mt-4
                flex
                items-center
                gap-2
                text-xs
                text-emerald-300
              "
            >
              <Volume2
                size={15}
              />

              <span>
                Voice response received.
              </span>
            </div>
          )}


          {/* Controls */}

          <div
            className="
              mt-6
              flex
              w-full
              gap-3
            "
          >
            {status ===
            "recording" ? (
              <button
                type="button"
                onClick={() =>
                  stopRecording(
                    true
                  )
                }
                className="
                  flex
                  flex-1
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  bg-red-600
                  px-4
                  py-3
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:bg-red-500
                  active:scale-[0.99]
                "
              >
                <Square
                  size={15}
                  fill="currentColor"
                />

                Stop & Send
              </button>
            ) : (
              <button
                type="button"
                onClick={
                  handleClose
                }
                className="
                  flex
                  flex-1
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/5
                  px-4
                  py-3
                  text-sm
                  font-bold
                  text-gray-200
                  transition
                  hover:bg-white/10
                "
              >
                Close
              </button>
            )}
          </div>


          <p
            className="
              mt-4
              text-center
              text-[10px]
              leading-5
              text-gray-600
            "
          >
            Audio is captured as PCM WAV and sent
            securely to RevelaAI for transcription.
          </p>
        </div>
      </div>
    </div>
  );
}
