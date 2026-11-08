// src/components/InputBar.jsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { analyzePixels } from "@/ai/v2-free/localIntelligence";
import { useAuth } from "@/context/AuthContext.jsx";
import {
  ArrowUp,
  Mic,
  Paperclip,
  X,
  FileText,
  Camera,
  Flashlight,
  Loader2,
  Search,
  Image as ImageIcon,
  BarChart3,
  Calculator,
  Microscope,
  Bot,
  BookOpen,
  Presentation,
  FileSpreadsheet,
  XCircle,
  WandSparkles,
} from "lucide-react";

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
  ".xlsx",
  ".pptx",
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

const TOOL_COMMANDS = [
  ["/search", "Deep Search", Search], ["/image", "Image Studio", ImageIcon],
  ["/data", "Data analysis", BarChart3], ["/sheet", "Spreadsheet", FileSpreadsheet],
  ["/deck", "PowerPoint", Presentation], ["/doc", "Word document", FileText],
  ["/ledger", "Accounting", Calculator], ["/quantum", "Quantum science", Microscope],
  ["/robot", "Robotics", Bot], ["/paper", "Publications", BookOpen],
  ["/humanize", "Humanizer", WandSparkles],
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
        "group relative flex h-10 w-10 min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/60",
        "disabled:cursor-not-allowed disabled:opacity-35",
        active
          ? "bg-accent/15 text-accent"
          : "text-muted hover:bg-surface-3 hover:text-fg",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function InputBar({
  onSend,
  onMic,
  onRegisterVision,
  onStop,
  isGenerating = false,
  freeMode = false,
  disabled = false,
  placeholder = "Ask RevelaAI anything...",
}) {
  const { authFetch } = useAuth();
  const [text, setText] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [selectedToolCommand, setSelectedToolCommand] = useState(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [liveVisionActive, setLiveVisionActive] = useState(false);
  const [liveVisionPrompt, setLiveVisionPrompt] = useState(
    "Describe the visible surroundings, objects, readable text, layout, and notable hazards. State uncertainty."
  );
  const [liveVisionResult, setLiveVisionResult] = useState("");
  const [liveVisionUpdatedAt, setLiveVisionUpdatedAt] = useState("");
  const liveVisionInFlightRef = useRef(false);
  const visionRequestRef = useRef(null);

  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceLanguage, setVoiceLanguage] = useState("en-KE");

  const cameraVideoRef = useRef(null);
  const cameraDialogRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const attachmentMenuRef = useRef(null);
  const dragDepth = useRef(0);

  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {
    const fillComposer = (event) => {
      const value = String(event?.detail?.text || "").slice(0, 8000);
      if (!value) return;
      setText(value);
      requestAnimationFrame(() => textareaRef.current?.focus());
    };
    const focusCommand = () => {
      setText((current) => current || "/");
      requestAnimationFrame(() => {
        const field = textareaRef.current;
        field?.focus();
        if (field) field.setSelectionRange(field.value.length, field.value.length);
      });
    };
    window.addEventListener("revelaai:fill-composer", fillComposer);
    window.addEventListener("revelaai:focus-composer-command", focusCommand);
    return () => {
      window.removeEventListener("revelaai:fill-composer", fillComposer);
      window.removeEventListener("revelaai:focus-composer-command", focusCommand);
    };
  }, []);

  useEffect(() => {
    if (!attachmentMenuOpen) return undefined;
    const closeOnOutside = (event) => {
      if (!attachmentMenuRef.current?.contains(event.target)) setAttachmentMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setAttachmentMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [attachmentMenuOpen]);

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
    setLiveVisionActive(false);
    visionRequestRef.current?.abort?.();
    visionRequestRef.current = null;
    setCameraError("");
  }, []);

  // Attach the stream to the <video> as soon as both exist.
  useEffect(() => {
    const video = cameraVideoRef.current;
    if (!cameraOpen || !video || !cameraStream) return;
    video.srcObject = cameraStream;
    video.play?.().catch(() => {});
  }, [cameraOpen, cameraStream]);

  useEffect(() => {
    if (!cameraOpen) return undefined;
    const dialog = cameraDialogRef.current;
    if (!dialog) return undefined;
    const focusable = () => Array.from(dialog.querySelectorAll("button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex='-1'])"));
    focusable()[0]?.focus();
    const trap = (event) => {
      if (event.key === "Escape") { event.preventDefault(); stopCamera(); return; }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [cameraOpen, stopCamera]);

  // Escape closes the camera.
  useEffect(() => {
    if (!cameraOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") stopCamera();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cameraOpen, stopCamera]);

  const openCamera = useCallback(async () => {
    setCameraError("");
    setLiveVisionResult("");
    setLiveVisionUpdatedAt("");

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
  }, []);

  // Expose the real composer camera action to the dashboard's vision shortcut.
  // No duplicate camera implementation or second permission path is introduced.
  useEffect(() => {
    onRegisterVision?.(openCamera);
    return () => onRegisterVision?.(null);
  }, [onRegisterVision, openCamera]);

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

  const analyzeCurrentFrame = useCallback(async (prompt, signal) => {
    const video = cameraVideoRef.current;
    if (!video?.videoWidth || !video?.videoHeight) {
      throw new Error("Camera is still starting. Try again in a moment.");
    }

    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 768 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("This browser could not prepare the camera frame.");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Free mode keeps camera frames on-device. Pixel measurements are explicitly
    // labelled as measurements, never as object recognition or scene understanding.
    if (freeMode) {
      const result = analyzePixels(context.getImageData(0, 0, canvas.width, canvas.height));
      return [
        "RevelaAI Free — local camera analysis",
        result.summary,
        "This offline mode measures brightness, colour distribution and edge activity only. It does not identify objects, read text, recognize people or infer scene meaning.",
        prompt ? "Your question: " + String(prompt).trim().slice(0, 500) : "",
      ].filter(Boolean).join("\n\n");
    }

    if (typeof authFetch !== "function") {
      throw new Error("RevelaCode's authenticated request service is unavailable. Retry after the session service is ready.");
    }

    const image = canvas.toDataURL("image/jpeg", 0.72);
    const apiBase = (
      import.meta.env.VITE_REVELAAI_API_URL ||
      import.meta.env.VITE_REVELAAI_API_BASE ||
      "https://revelaai.onrender.com"
    ).replace(/\/+$/, "");
    const response = await authFetch(`${apiBase}/api/vision/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        image,
        mimeType: "image/jpeg",
        prompt: String(prompt || "").trim() ||
          "Describe the visible surroundings, objects, readable text, layout, and notable hazards. State uncertainty.",
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(
        payload?.message ||
          (response.status === 401 || response.status === 403
            ? "Your session cannot access Live Vision. Sign in again and retry."
            : "RevelaAI could not analyze this camera frame. Try again.")
      );
      error.status = response.status;
      throw error;
    }

    const reply = payload?.data?.reply || payload?.data?.response || payload?.data?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      throw new Error("RevelaAI returned no usable description for this frame.");
    }
    return reply.trim();
  }, [freeMode]);

  const stopLiveVision = useCallback(() => {
    setLiveVisionActive(false);
    visionRequestRef.current?.abort?.();
    visionRequestRef.current = null;
  }, []);

  const captureFrame = async () => {
    setCameraBusy(true);
    setCameraError("");
    const prompt = liveVisionPrompt.trim() ||
      "Describe the visible surroundings, objects, readable text, layout, and notable hazards.";
    const controller = new AbortController();
    visionRequestRef.current?.abort?.();
    visionRequestRef.current = controller;
    try {
      const reply = await analyzeCurrentFrame(prompt, controller.signal);
      setLiveVisionResult(reply);
      setLiveVisionUpdatedAt(new Date().toLocaleTimeString());
      stopCamera();
      onSend?.(prompt, null, {
        visionResult: reply,
        visionProvider: freeMode ? "local-pixel-math" : "gemini",
        liveVision: false,
      });
    } catch (error) {
      if (error?.name !== "AbortError") {
        setCameraError(error?.message || "Could not analyze this camera frame.");
      }
    } finally {
      if (visionRequestRef.current === controller) visionRequestRef.current = null;
      setCameraBusy(false);
    }
  };

  useEffect(() => {
    if (!cameraOpen || !cameraStream || !liveVisionActive || cameraBusy) return undefined;

    let cancelled = false;
    let timer = null;
    let effectController = null;

    const analyzeNextFrame = async () => {
      if (cancelled) return;
      if (liveVisionInFlightRef.current) {
        timer = window.setTimeout(analyzeNextFrame, 1000);
        return;
      }
      liveVisionInFlightRef.current = true;
      const controller = new AbortController();
      visionRequestRef.current?.abort?.();
      visionRequestRef.current = controller;
      effectController = controller;

      try {
        const prompt = liveVisionPrompt.trim() ||
          "Describe the visible surroundings, objects, readable text, layout, and notable hazards. State uncertainty.";
        const reply = await analyzeCurrentFrame(prompt, controller.signal);
        if (cancelled) return;
        setLiveVisionResult(reply);
        setLiveVisionUpdatedAt(new Date().toLocaleTimeString());
        setCameraError("");
      } catch (error) {
        if (!cancelled && error?.name !== "AbortError") {
          setCameraError(error?.message || "Live Vision could not analyze the latest frame.");
          if (error?.status === 401 || error?.status === 403) setLiveVisionActive(false);
        }
      } finally {
        liveVisionInFlightRef.current = false;
        if (visionRequestRef.current === controller) visionRequestRef.current = null;
        if (effectController === controller) effectController = null;
        if (!cancelled) timer = window.setTimeout(analyzeNextFrame, 5000);
      }
    };

    analyzeNextFrame();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      if (effectController && visionRequestRef.current === effectController) {
        effectController.abort?.();
        visionRequestRef.current = null;
      }
    };
  }, [cameraOpen, cameraStream, liveVisionActive, liveVisionPrompt, cameraBusy, analyzeCurrentFrame, freeMode, authFetch]);

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
    setVoiceError("");
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join("");
      if (transcript.trim()) setVoiceError("");
      setText(transcript);
    };
    recognition.onerror = (event) => {
      setListening(false);
      const code = String(event?.error || "unknown");
      setVoiceError(
        code === "not-allowed" || code === "service-not-allowed"
          ? "Microphone permission was denied. Allow it in browser settings and try again."
          : code === "no-speech"
            ? "No speech was detected. Try speaking a little closer to the microphone."
            : "Voice dictation failed (" + code + "). You can still type or use the Voice action."
      );
    };
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
    const extension = String(file.name || "").split(".").pop().toLowerCase();
    const supported = ["pdf","docx","pptx","xlsx","csv","txt","md","json","py","js","jsx","ts","tsx","html","css"];
    if (!(file.type?.startsWith("image/") || supported.includes(extension))) {
      window.alert("Unsupported file type. Attach an image, PDF, CSV, XLSX, DOCX or PPTX file.");
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
    const typedCommand = value.match(/^\/(search|image|data|sheet|deck|doc|ledger|quantum|robot|paper|humanize)\b/i)?.[1]?.toLowerCase();
    const selectedCommand = selectedToolCommand?.[0]?.replace(/^\//, "");
    const command = selectedCommand || typedCommand || null;
    const toolLabel = selectedToolCommand?.[1] || TOOL_COMMANDS.find(([item]) => item === (typedCommand ? `/${typedCommand}` : ""))?.[1] || null;
    onSend?.(value, attachedFile, { toolCommand: command ? `/${command}` : null, toolLabel });

    setText("");
    setAttachedFile(null);
    setSelectedToolCommand(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const slashMatches = text.startsWith("/")
    ? TOOL_COMMANDS.filter(([command]) => command.startsWith(text.split(/\s/)[0].toLowerCase())).slice(0, 6)
    : [];

  const chooseCommand = (command) => {
    const selected = TOOL_COMMANDS.find(([item]) => item === command);
    if (!selected) return;
    setText((current) => current.replace(/^\/[a-z]+\s*/i, ""));
    setSelectedToolCommand(selected);
    setAttachmentMenuOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent?.isComposing) {
      event.preventDefault();
      if (slashMatches.length) chooseCommand(slashMatches[0][0]);
      else submit();
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="relative w-full" data-demo="composer">
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
          className="fixed inset-0 z-[100] flex items-end justify-center bg-overlay/85 backdrop-blur-md sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="RevelaAI camera"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) stopCamera();
          }}
        >
          <section ref={cameraDialogRef} className="w-full max-w-xl overflow-hidden rounded-t-3xl border border-line bg-popover text-fg shadow-dialog sm:rounded-3xl">
            <header className="flex items-center justify-between px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">RevelaAI Camera</h2>
                <p className="mt-0.5 text-xs text-muted">
                  Live Vision analyzes camera frames with RevelaAI while you enable it.
                </p>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-fg-secondary transition-colors hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/60"
                aria-label="Close camera"
              >
                <X size={18} />
              </button>
            </header>

            <div className="relative mx-3 overflow-hidden rounded-2xl bg-black" aria-label="Camera preview">
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
                  <Camera size={28} className="text-muted" />
                </div>
              )}
            </div>

            {cameraStream && (
              <div className="space-y-3 px-4 pt-3">
                <div className="flex items-center gap-2 text-xs" role="status" aria-live="polite">
                  <span className={liveVisionActive ? "h-2 w-2 rounded-full bg-emerald-400 animate-pulse" : "h-2 w-2 rounded-full bg-muted"} />
                  <span className={liveVisionActive ? "text-accent" : "text-muted"}>
                    {liveVisionActive
                      ? "LIVE VISION ON · checking a frame about every 5 seconds"
                      : "Preview only · AI frame analysis is off"}
                  </span>
                  {liveVisionUpdatedAt && <span className="ml-auto text-muted">Updated {liveVisionUpdatedAt}</span>}
                </div>
                <label htmlFor="revela-live-vision-prompt" className="block text-xs font-medium text-fg-secondary">
                  What should RevelaAI look for?
                </label>
                <textarea
                  id="revela-live-vision-prompt"
                  value={liveVisionPrompt}
                  onChange={(event) => setLiveVisionPrompt(event.target.value)}
                  maxLength={1200}
                  rows={2}
                  className="w-full min-h-12 resize-y rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-fg outline-none placeholder:text-muted focus:border-accent/50"
                  placeholder="Describe the surroundings, read a sign, identify visible objects..."
                />
                {liveVisionResult && (
                  <div className="max-h-36 overflow-y-auto rounded-xl border border-accent/20 bg-emerald-400/[0.06] p-3">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
                      Latest frame understanding
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-5 text-fg">{liveVisionResult}</p>
                  </div>
                )}
                <p className="text-[11px] leading-4 text-muted">
                  While enabled, selected frames are sent to the configured vision model. This app endpoint does not store the camera images. Stop Live Vision to stop further frame requests.
                </p>
                <div className="flex flex-wrap gap-2">
                  {!liveVisionActive ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCameraError("");
                        setLiveVisionResult("");
                        setLiveVisionUpdatedAt("");
                        setLiveVisionActive(true);
                      }}
                      disabled={!cameraStream || cameraBusy}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-inverse hover:bg-accent-hover disabled:opacity-40"
                    >
                      <Camera size={16} />
                      Start Live Vision
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopLiveVision}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm font-semibold text-warning hover:bg-warning/15"
                    >
                      Stop Live Vision
                    </button>
                  )}
                  {liveVisionResult && (
                    <button
                      type="button"
                      onClick={() => {
                        const prompt = liveVisionPrompt.trim() || "Describe my surroundings.";
                        const result = liveVisionResult;
                        stopCamera();
                        onSend?.(prompt, null, { visionResult: result, visionProvider: "gemini", liveVision: true });
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-fg hover:bg-surface-2"
                    >
                      Send analysis to chat
                    </button>
                  )}
                </div>
              </div>
            )}

            {cameraError && (
              <p role="status" className="px-5 pt-3 text-xs leading-5 text-warning">
                {cameraError}
              </p>
            )}

            <div className="flex items-stretch gap-2 p-3">
              <button
                type="button"
                onClick={captureFrame}
                disabled={cameraBusy || !cameraStream}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-inverse shadow-lg shadow-emerald-500/20 transition hover:bg-accent-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
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
                  "flex w-16 flex-col items-center justify-center gap-1 rounded-2xl border text-[11px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 disabled:cursor-not-allowed disabled:opacity-40",
                  torchOn
                    ? "border-amber-300/40 bg-warning/10 text-warning"
                    : "border-line text-fg-secondary hover:bg-surface-2",
                ].join(" ")}
              >
                <Flashlight size={16} />
                {torchOn ? "On" : "Torch"}
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="min-h-12 rounded-2xl border border-line px-4 text-sm text-fg-secondary transition hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/60"
              >
                Cancel
              </button>
            </div>

            <p className="px-5 pb-4 text-[11px] leading-4 text-muted">
              Camera permission is controlled by your browser. Live model analysis starts only after you select Start Live Vision and stops when you stop it or close this dialog.
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
          "relative bg-transparent",
          "transition-colors duration-150",
          dragging ? "rounded-xl bg-accent/5 ring-2 ring-accent/30" : "",
        ].join(" ")}
      >
        {/* Drop overlay */}
        {dragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-popover/95 backdrop-blur-sm">
            <p className="flex items-center gap-2 text-sm font-medium text-accent">
              <Paperclip size={16} />
              Drop to attach
            </p>
          </div>
        )}

        {/* Selected tool chip: selection is local UI state; no request is made until submit. */}
        {selectedToolCommand && (() => {
          const SelectedIcon = selectedToolCommand[2];
          return (
            <div className="px-3 pt-3">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
                <SelectedIcon size={14} aria-hidden="true" />
                <span>{selectedToolCommand[1]}</span>
                <button type="button" onClick={() => setSelectedToolCommand(null)} className="ml-1 rounded-full p-0.5 hover:bg-accent/15" aria-label={`Remove ${selectedToolCommand[1]} tool`}>
                  <X size={13}/>
                </button>
              </div>
            </div>
          );
        })()}

        {/* Attachment chip */}
        {attachedFile && (
          <div className="px-3 pt-3">
            <div className="flex max-w-full items-center gap-3 rounded-2xl border border-line bg-surface-2 p-2 pr-3 sm:max-w-sm">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-emerald-400/20">
                  <FileText size={18} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-fg">{attachedFile.name}</p>
                <p className="mt-0.5 text-[11px] text-muted">{formatSize(attachedFile.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="flex h-12 w-12 min-h-12 min-w-12 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-3 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/60"
                aria-label="Remove attachment"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* One unified composer surface: the textarea stays visually borderless. */}
        <div className="overflow-hidden rounded-2xl border border-line bg-surface/35 transition-colors focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/10">
        {/* Text entry: always on its own row so it is never squeezed on mobile */}
        <div className="px-4 pb-1 pt-3.5">
          {listening && (
            <div
              className="mb-2 flex items-center gap-2.5 text-xs font-medium text-accent"
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

          {slashMatches.length > 0 && (
            <div role="listbox" aria-label="Slash commands" className="mb-2 flex flex-wrap gap-1.5 rounded-xl border border-line bg-popover p-2">
              {slashMatches.map(([command,label,Icon]) => <button key={command} type="button" role="option" aria-selected="false" onClick={() => chooseCommand(command)} className="inline-flex min-h-12 items-center gap-2 rounded-lg px-3 text-xs text-fg-secondary hover:bg-surface-3"><Icon size={14}/><b>{command}</b><span className="text-muted">{label}</span></button>)}
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
            className="!m-0 block max-h-[160px] min-h-[24px] w-full min-w-0 resize-none overflow-y-auto !border-0 !bg-transparent !shadow-none !outline-none !ring-0 text-[14px] leading-6 text-fg placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50 focus:!border-0 focus:!outline-none focus:!ring-0 focus-visible:!outline-none"
          />
        </div>

        {/* Compact toolbar: attachments and tools share one menu. */}
        <div className="flex items-center justify-between gap-2 px-2 pb-2 pt-1">
          <div className="relative flex min-w-0 items-center gap-1" ref={attachmentMenuRef}>
            <span data-demo="tools-button">
              <ToolButton
                label="Attachments and tools"
                onClick={() => setAttachmentMenuOpen((value) => !value)}
                disabled={disabled}
                active={attachmentMenuOpen}
              >
                <Paperclip size={17}/>
              </ToolButton>
            </span>

            {attachmentMenuOpen && (
              <div
                className="absolute bottom-11 left-0 z-[90] max-h-[min(72dvh,620px)] w-[min(360px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-line bg-popover p-2.5 text-fg shadow-2xl"
                role="dialog"
                aria-label="Attachments and tools"
                data-demo="ai-composer-tools"
              >
                <div className="flex items-center justify-between gap-3 px-1 pb-2">
                  <div>
                    <p className="text-xs font-bold text-fg">Add to your message</p>
                    <p className="text-[10px] text-muted">Attach files or choose a tool</p>
                  </div>
                  <button type="button" onClick={() => setAttachmentMenuOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
                    aria-label="Close attachments and tools"><X size={15}/></button>
                </div>

                <button type="button" onClick={() => { setAttachmentMenuOpen(false); fileInputRef.current?.click(); }}
                  disabled={disabled}
                  className="flex min-h-10 w-full items-center gap-2 rounded-xl border border-line bg-surface px-3 text-left text-xs font-semibold text-fg-secondary hover:bg-surface-2 disabled:opacity-40">
                  <Paperclip size={15}/> Upload a file or document
                </button>
                <button type="button" onClick={() => { setAttachmentMenuOpen(false); openCamera(); }}
                  disabled={disabled}
                  className="mt-1.5 flex min-h-10 w-full items-center gap-2 rounded-xl border border-line bg-surface px-3 text-left text-xs font-semibold text-fg-secondary hover:bg-surface-2 disabled:opacity-40">
                  <Camera size={15}/> Capture with camera / Vision
                </button>
                <div className="my-2 border-t border-line"/>
                <p className="px-1 pb-1 text-[10px] font-bold uppercase tracking-[.14em] text-muted">AI tools</p>
                <div className="grid grid-cols-2 gap-1">
                  {TOOL_COMMANDS.map(([command,label,Icon]) => (
                    <button key={command} type="button" onClick={() => chooseCommand(command)} aria-pressed={selectedToolCommand?.[0] === command}
                      className={"flex min-h-9 items-center gap-2 rounded-lg px-2 text-left text-[11px] hover:bg-surface-2 hover:text-fg " + (selectedToolCommand?.[0] === command ? "bg-accent/10 text-accent" : "text-fg-secondary")}>
                      <Icon size={14}/><span>{label}</span>
                    </button>
                  ))}
                </div>

                <div className="my-2 border-t border-line"/>
                <div className="flex items-center justify-between gap-3 px-1">
                  <span className="text-[10px] font-semibold text-muted">Voice language</span>
                  <div role="radiogroup" aria-label="Voice recognition language" className="flex items-center rounded-lg bg-surface-2 p-0.5">
                    {VOICE_LANGUAGES.map((language) => {
                      const selected = voiceLanguage === language.code;
                      return (
                        <button key={language.code} type="button" role="radio" aria-checked={selected}
                          aria-label={language.name} title={language.name}
                          onClick={() => setVoiceLanguage(language.code)}
                          className={"min-h-8 rounded-md px-2.5 text-[10px] font-bold " + (selected ? "bg-surface-3 text-fg" : "text-muted hover:text-fg-secondary")}>
                          {language.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <ToolButton
              label={listening ? "Stop listening" : "Dictate with your voice"}
              onClick={startSpeechRecognition}
              disabled={disabled}
              active={listening}
            >
              <Mic size={17} className={listening ? "animate-pulse" : ""}/>
            </ToolButton>

            <button
              type="button"
              data-demo="ai-send-message"
              onClick={isGenerating ? onStop : submit}
              disabled={isGenerating ? !onStop : !canSend}
              aria-label={isGenerating ? "Stop generating" : "Send message"}
              title={isGenerating ? "Stop generating" : "Send message (Enter)"}
              className={[
                "flex h-10 w-10 min-h-10 min-w-10 items-center justify-center rounded-xl transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/70",
                canSend
                  ? "bg-accent text-inverse shadow-composer hover:bg-accent-hover active:scale-95"
                  : "cursor-not-allowed bg-surface-3 text-muted",
              ].join(" ")}
            >
              {isGenerating ? <XCircle size={17} strokeWidth={2.5}/> : <ArrowUp size={17} strokeWidth={2.5}/>}
            </button>
          </div>
        </div>
        </div>
      </div>

      <div className="px-2 pt-1.5 text-[10px] text-muted">
        <kbd className="font-sans font-medium text-fg-secondary">Enter</kbd> to send
        <span className="px-1.5 text-line-strong">·</span>
        <kbd className="font-sans font-medium text-fg-secondary">Shift + Enter</kbd> for a new line
      </div>

      {voiceError && (
        <p className="px-3 pt-2 text-[11px] text-warning" role="status">
          {voiceError}
        </p>
      )}

      {!voiceSupported && (
        <p className="px-3 pt-2 text-[11px] text-warning" role="status">
          Speech recognition isn't supported in this browser. Try Chrome on Android.
        </p>
      )}
    </div>
  );
}
