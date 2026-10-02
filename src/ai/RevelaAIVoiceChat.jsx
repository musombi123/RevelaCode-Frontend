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

const getRecorderMimeType =
  () => {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];

    return (
      candidates.find(
        (type) =>
          typeof MediaRecorder !==
            "undefined" &&
          MediaRecorder.isTypeSupported?.(
            type
          )
      ) ||
      ""
    );
  };

const getExtensionForMime =
  (mimeType) => {
    const mime =
      String(
        mimeType || ""
      ).toLowerCase();

    if (
      mime.includes(
        "audio/mp4"
      )
    ) {
      return "m4a";
    }

    if (
      mime.includes(
        "audio/ogg"
      )
    ) {
      return "ogg";
    }

    return "webm";
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

  const mediaRecorderRef =
    useRef(null);

  const chunksRef =
    useRef([]);

  const streamRef =
    useRef(null);

  const analyserRef =
    useRef(null);

  const audioContextRef =
    useRef(null);

  const dataArrayRef =
    useRef(null);

  const animationIdRef =
    useRef(null);

  const timerRef =
    useRef(null);

  const canvasRef =
    useRef(null);

  const shouldSubmitRef =
    useRef(true);

  const mountedRef =
    useRef(true);

  const controllerRef =
    useRef(null);

  const [status, setStatus] =
    useState("starting");

  const [error, setError] =
    useState("");

  const [elapsed, setElapsed] =
    useState(0);

  /* =======================================================
     CLEAN AUDIO
  ======================================================= */

  const cleanupAudio =
    useCallback(() => {
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

        timerRef.current =
          null;
      }

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
        // Ignore close failure.
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

      const recorder =
        mediaRecorderRef.current;

      if (
        recorder &&
        recorder.state ===
          "recording"
      ) {
        try {
          recorder.stop();
        } catch {
          // Ignore stop race.
        }
      }

      cleanupAudio();

      onClose?.();
    }, [
      cleanupAudio,
      onClose,
    ]);

  /* =======================================================
     SEND AUDIO
  ======================================================= */

  const sendAudio =
    useCallback(
      async (
        audioBlob,
        mimeType
      ) => {
        if (!audioBlob?.size) {
          setError(
            "No audio was captured."
          );
          setStatus("error");
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
          setStatus("error");
          return;
        }

        const formData =
          new FormData();

        const extension =
          getExtensionForMime(
            mimeType
          );

        formData.append(
          "audio",
          audioBlob,
          `voice.${extension}`
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
           * Try immediate browser playback.
           * The voice result is also rendered as an <audio>
           * element in the chat, so blocked autoplay is not
           * fatal.
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
               * Browser autoplay policy may block this.
               * Chat will still contain an audio player.
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
      (
        submit = true
      ) => {
        shouldSubmitRef.current =
          submit;

        const recorder =
          mediaRecorderRef.current;

        if (
          !recorder ||
          recorder.state !==
            "recording"
        ) {
          return;
        }

        try {
          recorder.stop();
        } catch (err) {
          console.error(
            "Failed to stop recorder:",
            err
          );

          cleanupAudio();
        }
      },
      [cleanupAudio]
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
              (v *
                canvas.height) /
              2;

            if (i === 0) {
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
                audio: true,
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

          const mimeType =
            getRecorderMimeType();

          const recorder =
            mimeType
              ? new MediaRecorder(
                  stream,
                  {
                    mimeType,
                  }
                )
              : new MediaRecorder(
                  stream
                );

          mediaRecorderRef.current =
            recorder;

          chunksRef.current =
            [];

          recorder.ondataavailable =
            (event) => {
              if (
                event.data
                  ?.size > 0
              ) {
                chunksRef.current.push(
                  event.data
                );
              }
            };

          recorder.onerror =
            (event) => {
              console.error(
                "MediaRecorder error:",
                event
              );

              setError(
                "Microphone recording failed."
              );

              setStatus(
                "error"
              );
            };

          recorder.onstop =
            async () => {
              const recordedMime =
                recorder.mimeType ||
                mimeType ||
                "audio/webm";

              const audioBlob =
                new Blob(
                  chunksRef.current,
                  {
                    type:
                      recordedMime,
                  }
                );

              cleanupAudio();

              const submit =
                shouldSubmitRef.current;

              if (
                submit &&
                audioBlob.size >
                  0
              ) {
                await sendAudio(
                  audioBlob,
                  recordedMime
                );
              }
            };

          recorder.start(
            250
          );

          /*
           * Waveform context.
           */
          const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

          if (
            AudioContextClass
          ) {
            const audioContext =
              new AudioContextClass();

            audioContextRef.current =
              audioContext;

            const source =
              audioContext.createMediaStreamSource(
                stream
              );

            const analyser =
              audioContext.createAnalyser();

            analyserRef.current =
              analyser;

            source.connect(
              analyser
            );

            startWaveform();
          }

          setElapsed(0);

          timerRef.current =
            window.setInterval(
              () => {
                setElapsed(
                  (
                    previous
                  ) =>
                    previous + 1
                );
              },
              1000
            );

          setStatus(
            "recording"
          );

          /*
           * Automatic safety stop after 60 seconds.
           */
          timerRef.current =
            window.setTimeout(
              () =>
                stopRecording(
                  true
                ),
              60_000
            );
        } catch (err) {
          console.error(
            "❌ Microphone error:",
            err
          );

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
        sendAudio,
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

      const recorder =
        mediaRecorderRef.current;

      if (
        recorder &&
        recorder.state ===
          "recording"
      ) {
        try {
          recorder.stop();
        } catch {
          // Ignore cleanup race.
        }
      }

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
            <p className="text-sm font-bold text-white">
              RevelaAI Voice
            </p>

            <p className="mt-1 text-[11px] text-gray-500">
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
            Audio is sent securely to RevelaAI for
            transcription and response generation.
          </p>
        </div>
      </div>
    </div>
  );
}