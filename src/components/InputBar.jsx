// src/components/InputBar.jsx

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Send,
  Mic,
  Paperclip,
  X,
  FileText,
  Camera,
  Flashlight,
  Loader2,
} from "lucide-react";
import { analyzeImageFile } from "@/ai/v2-free/localIntelligence";

/* =========================================================
   INPUT BAR

   Emits:
       onSend(text, file)

   The parent decides how the message/file is transported.
========================================================= */

export default function InputBar({
  onSend,
  onMic,
  disabled = false,
  placeholder = "Ask RevelaAI anything...",
}) {
  const [text, setText] =
    useState("");

  const [attachedFile, setAttachedFile] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const recognitionRef = useRef(null);

  const textareaRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  useEffect(() => () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    recognitionRef.current?.stop?.();
  }, []);

  const stopCamera = () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    setCameraOpen(false);
    setTorchOn(false);
  };

  const openCamera = async () => {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is unavailable. Open RevelaCode over HTTPS and allow camera permission.");
      setCameraOpen(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      cameraStreamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          cameraVideoRef.current.play?.().catch(() => {});
        }
      });
    } catch (error) {
      setCameraError(error?.name === "NotAllowedError" ? "Camera permission was denied. Allow camera access in browser settings." : "Could not open the camera. Check permissions and try again.");
      setCameraOpen(true);
    }
  };

  const toggleTorch = async () => {
    try {
      const track = cameraStreamRef.current?.getVideoTracks?.()[0];
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
    if (!video?.videoWidth) { setCameraError("Camera is still starting. Try again in a moment."); return; }
    setCameraBusy(true);
    try {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1024 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const math = await analyzeImageFile(await new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(new File([blob], "camera-frame.jpg", { type: "image/jpeg" })) : reject(new Error("Could not capture the frame.")), "image/jpeg", 0.88)));
      const prompt = `[User shared a camera frame: ${math.summary}] Please help me understand what is visible in this image.`;
      const frame = await new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(new File([blob], "camera-frame.jpg", { type: "image/jpeg" })) : reject(new Error("Could not capture the frame.")), "image/jpeg", 0.88));
      stopCamera();
      onSend?.(prompt, frame);
    } catch (error) {
      setCameraError(error?.message || "Could not analyze this camera frame.");
    } finally { setCameraBusy(false); }
  };

  const startSpeechRecognition = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setVoiceSupported(false); return; }
    if (listening) { recognitionRef.current?.stop?.(); setListening(false); return; }
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = navigator.language || "en-KE";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0]?.transcript || "").join("");
      setText(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    try { recognition.start(); } catch { setListening(false); }
  };

  /* =======================================================
     AUTO-GROW
  ======================================================= */

  useEffect(() => {
    const element =
      textareaRef.current;

    if (!element) {
      return;
    }

    element.style.height =
      "0px";

    const nextHeight =
      Math.min(
        Math.max(
          element.scrollHeight,
          44
        ),
        180
      );

    element.style.height =
      `${nextHeight}px`;
  }, [text]);

  /* =======================================================
     SUBMIT
  ======================================================= */

  const submit = () => {
    const value =
      text.trim();

    if (
      disabled ||
      (!value &&
        !attachedFile)
    ) {
      return;
    }

    onSend?.(
      value,
      attachedFile
    );

    setText("");
    setAttachedFile(null);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  /* =======================================================
     KEYBOARD
  ======================================================= */

  const handleKeyDown = (
    event
  ) => {
    if (
      event.key ===
        "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      submit();
    }
  };

  /* =======================================================
     FILE
  ======================================================= */

  const handleFileChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    /*
     * The backend currently processes:
     * PDF, DOCX and text/source documents.
     */
    const maxSize =
      20 * 1024 * 1024;

    if (
      file.size >
      maxSize
    ) {
      window.alert(
        "This file is too large. Maximum size is 20 MB."
      );

      event.target.value =
        "";

      return;
    }

    setAttachedFile(
      file
    );

    event.target.value =
      "";
  };

  const removeAttachment =
    () => {
      setAttachedFile(
        null
      );
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="w-full">
      {/* Hidden file input */}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={
          handleFileChange
        }
        accept="
          image/*,
          .pdf,
          .docx,
          .txt,
          .md,
          .csv,
          .json,
          .py,
          .js,
          .jsx,
          .ts,
          .tsx,
          .html,
          .css
        "
      />

      {cameraOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Camera vision"><section className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/15 bg-slate-950 text-white shadow-2xl"><header className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div><h2 className="text-sm font-bold">RevelaAI Camera</h2><p className="mt-1 text-[11px] text-slate-400">Capture a frame to analyze it in this chat</p></div><button type="button" onClick={stopCamera} className="rounded-lg p-2 text-slate-300 hover:bg-white/10" aria-label="Close camera"><X size={18}/></button></header>{cameraStreamRef.current && <video ref={cameraVideoRef} autoPlay muted playsInline className="max-h-[60vh] w-full bg-black object-contain" />}{cameraError && <p role="status" className="px-4 pt-3 text-xs text-amber-300">{cameraError}</p>}<div className="flex gap-2 p-3"><button type="button" onClick={captureFrame} disabled={cameraBusy || !cameraStreamRef.current} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-3 text-sm font-bold text-slate-950 disabled:opacity-40">{cameraBusy ? <Loader2 size={16} className="animate-spin"/> : <Camera size={16}/>} {cameraBusy ? "Analyzing…" : "Capture and send to chat"}</button><button type="button" onClick={toggleTorch} disabled={!cameraStreamRef.current} className="rounded-xl border border-white/15 px-3 text-xs disabled:opacity-40"><Flashlight size={16} className="mx-auto mb-1"/>{torchOn ? "Torch on" : "Torch"}</button><button type="button" onClick={stopCamera} className="rounded-xl border border-white/15 px-3 text-xs">Cancel</button></div><p className="px-4 pb-3 text-[10px] leading-4 text-slate-500">Pixel brightness and image statistics run locally. Object labels require a locally bundled detection model.</p></section></div>}

      {/* Attachment preview */}

      {attachedFile && (
        <div
          className="
            mb-2
            flex
            items-center
            gap-3
            rounded-xl
            border
            border-emerald-500/20
            bg-emerald-500/5
            px-3
            py-2
            text-xs
            text-gray-300
          "
        >
          <div
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-emerald-500/10
              text-emerald-400
            "
          >
            <FileText
              size={15}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="
                truncate
                font-semibold
                text-gray-200
              "
            >
              {attachedFile.name}
            </p>

            <p
              className="
                mt-0.5
                text-[10px]
                text-gray-500
              "
            >
              {(
                attachedFile.size /
                1024
              ).toFixed(1)} KB
            </p>
          </div>

          <button
            type="button"
            onClick={
              removeAttachment
            }
            className="
              flex
              h-7
              w-7
              shrink-0
              items-center
              justify-center
              rounded-lg
              text-gray-400
              transition
              hover:bg-white/10
              hover:text-white
            "
            aria-label="Remove attachment"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Composer */}

      <div
        className="
          rounded-2xl
          border
          border-white/10
          bg-revela-card
          p-2
          shadow-xl
          transition-all
          focus-within:border-white/20
          focus-within:ring-1
          focus-within:ring-white/10
        "
      >
        <div className="flex items-end gap-2">
          {/* Attach */}

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={disabled}
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              text-gray-400
              transition
              hover:bg-white/10
              hover:text-white
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
            aria-label="Attach document"
            title="Attach document"
          >
            <Paperclip size={18} />
          </button>

          {/* Textarea */}

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            disabled={disabled}
            placeholder={
              placeholder
            }
            onChange={(
              event
            ) =>
              setText(
                event.target.value
              )
            }
            onKeyDown={
              handleKeyDown
            }
            className="
              min-h-[44px]
              max-h-[180px]
              min-w-0
              flex-1
              resize-none
              overflow-y-auto
              bg-transparent
              px-2
              py-2.5
              text-sm
              leading-6
              text-white
              outline-none
              placeholder:text-gray-500
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            aria-label={
              placeholder
            }
          />

          {/* Voice */}

          <button
            type="button"
            onClick={
              onMic
            }
            disabled={disabled}
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              text-gray-400
              transition
              hover:bg-white/10
              hover:text-white
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
            aria-label="Use voice input"
            title={listening ? "Stop listening" : "Speak to type"}
          >
            <Mic size={18} className={listening ? "animate-pulse text-emerald-400" : ""} />
          </button>

          {/* Send */}

          <button
            type="button"
            onClick={
              submit
            }
            disabled={
              disabled ||
              (
                !text.trim() &&
                !attachedFile
              )
            }
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-revela-secondary
              text-white
              shadow-sm
              transition
              hover:opacity-90
              active:scale-95
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
            aria-label="Send message"
            title="Send message"
          >
            <Send size={18} />
          </button>
        </div>

        {listening && <div className="flex items-center gap-1 px-3 pt-2 text-xs text-emerald-300" role="status"><span className="inline-flex h-4 items-center gap-0.5">{[3,6,10,5,8,4,9].map((height, i) => <span key={i} className="w-1 animate-pulse rounded-full bg-emerald-400" style={{ height: `${height}px`, animationDelay: `${i * 70}ms` }} />)}</span> Listening… speak naturally</div>}\n        {!voiceSupported && <p className="px-3 pt-2 text-[11px] text-amber-300" role="status">Speech recognition is not supported in this browser. Try Chrome on Android.</p>}\n\n        {/* Footer */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            px-2
            pb-1
            pt-1
          "
        >
          <p
            className="
              truncate
              text-[10px]
              text-gray-500
            "
          >
            Enter to send • Shift + Enter
            for a new line
          </p>

          <span
            className="
              hidden
              shrink-0
              text-[10px]
              text-gray-600
              sm:block
            "
          >
            RevelaAI
          </span>
        </div>
      </div>
    </div>
  );
}