// src/components/InputBar.jsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Mic,
  Paperclip,
  X,
  FileText,
  Camera,
  Flashlight,
  Loader2,
} from "lucide-react";
import { analyzeCanvas, loadLocalVisionAssets } from "@/ai/freeVisionEngine";

/* =========================================================
   INPUT BAR

   Emits:
       onSend(text, file, extra?)

   The parent decides how the message/file is transported.
   Public API is unchanged: onSend, onMic, disabled, placeholder.
========================================================= */

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_TEXTAREA_HEIGHT = 200;

const ACCEPTED_TYPES = [
  "image/*",
  ".pdf",
  ".docx",
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".py",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".html",
  ".css",
].join(",");

const VOICE_LANGUAGES = [
  { code: "en-KE", label: "EN", name: "English" },
  { code: "sw-KE", label: "SW", name: "Kiswahili" },
];

const formatSize = (bytes) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/* ---------------------------------------------------------
   Small shared button for the tool row
--------------------------------------------------------- */
function ToolButton({ label, onClick, disabled, active, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={[
        "group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50",
        "disabled:cursor-not-allowed disabled:opacity-35",
        active
          ? "bg-emerald-500/15 text-emerald-300"
          : "text-slate-400 hover:bg-white/[0.07] hover:text-slate-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function InputBar({
  onSend,
  onMic,
  disabled = false,
  placeholder = "Ask RevelaAI anything...",
}) {
  const [text, setText] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [dragging, setDragging] = useState(false);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [torchOn, setTorchOn] = useState(false);

  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceLanguage, setVoiceLanguage] = useState("en-KE");

  const cameraVideoRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragDepth = useRef(0);

  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(
    () => () => {
      recognitionRef.current?.stop?.();
    },
    []
  );

  useEffect(
    () => () => {
      cameraStream?.getTracks().forEach((track) => track.stop());
    },
    [cameraStream]
  );

  /* =======================================================
     IMAGE PREVIEW (object URL, revoked on change)
  ======================================================= */

  const previewUrl = useMemo(
    () =>
      attachedFile && attachedFile.type?.startsWith("image/")
        ? URL.createObjectURL(attachedFile)
        : null,
    [attachedFile]
  );

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  /* =======================================================
     CAMERA
  ======================================================= */

  const stopCamera = useCallback(() => {
    setCameraStream((stream) => {
      stream?.getTracks().forEach((track) => track.stop());
      return null;
    });
    setCameraOpen(false);
    setTorchOn(false);
    setCameraError("");
  }, []);

  // Attach the stream to the <video> as soon as both exist.
  useEffect(() => {
    const video = cameraVideoRef.current;
    if (!cameraOpen || !video || !cameraStream) return;
    video.srcObject = cameraStream;
    video.play?.().catch(() => {});
  }, [cameraOpen, cameraStream]);

  // Escape closes the camera.
  useEffect(() => {
    if (!cameraOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") stopCamera();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cameraOpen, stopCamera]);

  const openCamera = async () => {
    setCameraError("");
    // Warm local model assets while the live preview opens; no model API is called.
    void loadLocalVisionAssets().catch(() => {});

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera access is unavailable. Open RevelaCode over HTTPS and allow camera permission."
      );
      setCameraOpen(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setCameraStream(stream);
      setCameraOpen(true);
    } catch (error) {
      setCameraError(
        error?.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access in browser settings."
          : "Could not open the camera. Check permissions and try again."
      );
      setCameraOpen(true);
    }
  };

  const toggleTorch = async () => {
    try {
      const track = cameraStream?.getVideoTracks?.()[0];
      if (!track) throw new Error("Camera unavailable");
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn((value) => !value);
      setCameraError("");
    } catch {
      setCameraError("Torch is not supported by this camera or browser.");
    }
  };

  const captureFrame = async () => {
    const video = cameraVideoRef.current;
    if (!video?.videoWidth) {
      setCameraError("Camera is still starting. Try again in a moment.");
      return;
    }
    setCameraBusy(true);
    setCameraError("");
    try {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1024 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const vision = await analyzeCanvas(canvas);
      const frame = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) =>
            blob
              ? resolve(new File([blob], "revela-camera-frame.jpg", { type: "image/jpeg" }))
              : reject(new Error("Could not capture the camera frame.")),
          "image/jpeg",
          0.88
        );
      });

      stopCamera();
      onSend?.(
        "What do you see? Please describe only what the local camera scan can support.",
        frame,
        { vision, visionDescription: vision.visionDescription }
      );
    } catch (error) {
      setCameraError(error?.message || "Could not analyze this camera frame.");
    } finally {
      setCameraBusy(false);
    }
  };

  /* =======================================================
     VOICE
  ======================================================= */

  const startSpeechRecognition = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceSupported(false);
      return;
    }
    if (listening) {
      recognitionRef.current?.stop?.();
      setListening(false);
      return;
    }

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = voiceLanguage;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join("");
      setText(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => {
      setListening(false);
      textareaRef.current?.focus();
    };
    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  };

  /* =======================================================
     AUTO-GROW
  ======================================================= */

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "0px";
    element.style.height = `${Math.min(Math.max(element.scrollHeight, 28), MAX_TEXTAREA_HEIGHT)}px`;
  }, [text]);

  /* =======================================================
     FILES (picker, drag & drop, paste)
  ======================================================= */

  const acceptFile = useCallback((file) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      window.alert("This file is too large. Maximum size is 20 MB.");
      return;
    }
    setAttachedFile(file);
    textareaRef.current?.focus();
  }, []);

  const handleFileChange = (event) => {
    acceptFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handlePaste = (event) => {
    const file = Array.from(event.clipboardData?.files || [])[0];
    if (file) {
      event.preventDefault();
      acceptFile(file);
    }
  };

  const hasFiles = (event) => Array.from(event.dataTransfer?.types || []).includes("Files");

  const handleDragEnter = (event) => {
    if (disabled || !hasFiles(event)) return;
    event.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  };

  const handleDragOver = (event) => {
    if (disabled || !hasFiles(event)) return;
    event.preventDefault();
  };

  const handleDragLeave = (event) => {
    if (!hasFiles(event)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };

  const handleDrop = (event) => {
    if (disabled || !hasFiles(event)) return;
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const canSend = !disabled && (text.trim().length > 0 || Boolean(attachedFile));

  const submit = () => {
    const value = text.trim();
    if (!canSend) return;

    recognitionRef.current?.stop?.();
    onSend?.(value, attachedFile);

    setText("");
    setAttachedFile(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent?.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept={ACCEPTED_TYPES}
      />

      {/* ---------------- Camera dialog ---------------- */}
      {cameraOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="RevelaAI camera"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) stopCamera();
          }}
        >
          <section className="w-full max-w-xl overflow-hidden rounded-t-3xl border border-white/10 bg-slate-950 text-white shadow-[0_24px_80px_-12px_rgba(0,0,0,0.8)] sm:rounded-3xl">
            <header className="flex items-center justify-between px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">RevelaAI Camera</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Scans on your device. No paid vision API.
                </p>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
                aria-label="Close camera"
              >
                <X size={18} />
              </button>
            </header>

            <div className="relative mx-3 overflow-hidden rounded-2xl bg-black">
              {cameraStream ? (
                <>
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="max-h-[56vh] w-full object-contain"
                  />
                  {/* Viewfinder corners */}
                  <span className="pointer-events-none absolute left-4 top-4 h-6 w-6 rounded-tl-lg border-l-2 border-t-2 border-emerald-400/80" />
                  <span className="pointer-events-none absolute right-4 top-4 h-6 w-6 rounded-tr-lg border-r-2 border-t-2 border-emerald-400/80" />
                  <span className="pointer-events-none absolute bottom-4 left-4 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-emerald-400/80" />
                  <span className="pointer-events-none absolute bottom-4 right-4 h-6 w-6 rounded-br-lg border-b-2 border-r-2 border-emerald-400/80" />
                </>
              ) : (
                <div className="flex h-56 items-center justify-center">
                  <Camera size={28} className="text-slate-600" />
                </div>
              )}
            </div>

            {cameraError && (
              <p role="status" className="px-5 pt-3 text-xs leading-5 text-amber-300">
                {cameraError}
              </p>
            )}

            <div className="flex items-stretch gap-2 p-3">
              <button
                type="button"
                onClick={captureFrame}
                disabled={cameraBusy || !cameraStream}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {cameraBusy ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                {cameraBusy ? "Analyzing..." : "Capture and send"}
              </button>
              <button
                type="button"
                onClick={toggleTorch}
                disabled={!cameraStream}
                aria-pressed={torchOn}
                className={[
                  "flex w-16 flex-col items-center justify-center gap-1 rounded-2xl border text-[11px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-40",
                  torchOn
                    ? "border-amber-300/40 bg-amber-300/10 text-amber-200"
                    : "border-white/10 text-slate-300 hover:bg-white/5",
                ].join(" ")}
              >
                <Flashlight size={16} />
                {torchOn ? "On" : "Torch"}
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="rounded-2xl border border-white/10 px-4 text-sm text-slate-300 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
              >
                Cancel
              </button>
            </div>

            <p className="px-5 pb-4 text-[11px] leading-4 text-slate-500">
              Pixel analysis runs on-device. Object labels and text recognition need the bundled
              local assets.
            </p>
          </section>
        </div>
      )}

      {/* ---------------- Composer ---------------- */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          "relative rounded-3xl border bg-revela-card",
          "shadow-[0_8px_32px_-8px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.04)]",
          "transition-[border-color,box-shadow] duration-200",
          dragging
            ? "border-emerald-400/60 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
            : "border-white/10 focus-within:border-emerald-400/30 focus-within:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.55),0_0_0_4px_rgba(16,185,129,0.07)]",
        ].join(" ")}
      >
        {/* Drop overlay */}
        {dragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-slate-950/80 backdrop-blur-sm">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
              <Paperclip size={16} />
              Drop to attach
            </p>
          </div>
        )}

        {/* Attachment chip */}
        {attachedFile && (
          <div className="px-3 pt-3">
            <div className="flex max-w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2 pr-3 sm:max-w-sm">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20">
                  <FileText size={18} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-100">{attachedFile.name}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{formatSize(attachedFile.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
                aria-label="Remove attachment"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Text entry: always on its own row so it is never squeezed on mobile */}
        <div className="px-4 pb-1 pt-3.5">
          {listening && (
            <div
              className="mb-2 flex items-center gap-2.5 text-xs font-medium text-emerald-300"
              role="status"
            >
              <span className="flex h-4 items-center gap-[3px]" aria-hidden="true">
                {[6, 12, 8, 14, 7, 11, 5].map((height, i) => (
                  <span
                    key={i}
                    className="w-[3px] animate-pulse rounded-full bg-emerald-400"
                    style={{ height: `${height}px`, animationDelay: `${i * 90}ms` }}
                  />
                ))}
              </span>
              Listening in {VOICE_LANGUAGES.find((l) => l.code === voiceLanguage)?.name}
            </div>
          )}

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            aria-label={placeholder}
            className="block max-h-[200px] min-h-[28px] w-full min-w-0 resize-none overflow-y-auto bg-transparent text-[15px] leading-7 text-slate-100 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5 pt-1">
          <div className="flex min-w-0 items-center gap-0.5">
            <ToolButton
              label="Attach a file"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              <Paperclip size={18} />
            </ToolButton>
            <ToolButton label="Scan with camera" onClick={openCamera} disabled={disabled}>
              <Camera size={18} />
            </ToolButton>

            <span className="mx-1.5 h-5 w-px bg-white/10" aria-hidden="true" />

            {/* Voice language: segmented control */}
            <div
              role="radiogroup"
              aria-label="Voice recognition language"
              className="flex items-center rounded-lg bg-white/[0.05] p-0.5"
            >
              {VOICE_LANGUAGES.map((language) => {
                const selected = voiceLanguage === language.code;
                return (
                  <button
                    key={language.code}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={language.name}
                    title={language.name}
                    onClick={() => setVoiceLanguage(language.code)}
                    className={[
                      "rounded-md px-2 py-1 text-[11px] font-semibold leading-none transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50",
                      selected
                        ? "bg-white/10 text-slate-100"
                        : "text-slate-500 hover:text-slate-300",
                    ].join(" ")}
                  >
                    {language.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <ToolButton
              label={listening ? "Stop listening" : "Dictate with your voice"}
              onClick={startSpeechRecognition}
              disabled={disabled}
              active={listening}
            >
              <Mic size={18} className={listening ? "animate-pulse" : ""} />
            </ToolButton>

            <button
              type="button"
              onClick={submit}
              disabled={!canSend}
              aria-label="Send message"
              title="Send message (Enter)"
              className={[
                "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70",
                canSend
                  ? "bg-gradient-to-b from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95"
                  : "cursor-not-allowed bg-white/[0.06] text-slate-600",
              ].join(" ")}
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 px-3 pt-2">
        <p className="truncate text-[11px] text-slate-500">
          <kbd className="font-sans font-medium text-slate-400">Enter</kbd> to send,{" "}
          <kbd className="font-sans font-medium text-slate-400">Shift + Enter</kbd> for a new line
        </p>
        <span className="hidden shrink-0 text-[11px] font-medium text-slate-600 sm:block">
          RevelaAI
        </span>
      </div>

      {!voiceSupported && (
        <p className="px-3 pt-2 text-[11px] text-amber-300" role="status">
          Speech recognition isn't supported in this browser. Try Chrome on Android.
        </p>
      )}
    </div>
  );
}
