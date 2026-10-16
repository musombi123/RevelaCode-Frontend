import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Eye, Flashlight, ScanEye, ShieldCheck, Square, X, Zap } from "lucide-react";
import { answerWhatDoISee, loadLocalVisionAssets, scanCanvas } from "./freeVisionEngine";

export function useFreeVision() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const canvasRef = useRef(null);
  const assetsRef = useRef({ detector: null, cv: null, ocrAvailable: false });
  const busyRef = useRef(false);
  const lastOcrRef = useRef(0);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [torch, setTorch] = useState(false);
  const [assetsReady, setAssetsReady] = useState({ detector: false, cv: false, ocr: false });

  const scan = useCallback(async (crop = null) => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || busyRef.current) return;
    busyRef.current = true;
    try {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvasRef.current = canvas;
      const vw = video.videoWidth, vh = video.videoHeight;
      const sx = crop ? Math.max(0, Math.min(vw - 1, crop.x * vw)) : 0;
      const sy = crop ? Math.max(0, Math.min(vh - 1, crop.y * vh)) : 0;
      const sw = crop ? Math.max(1, Math.min(vw - sx, crop.width * vw)) : vw;
      const sh = crop ? Math.max(1, Math.min(vh - sy, crop.height * vh)) : vh;
      const scale = Math.min(1, 640 / Math.max(sw, sh));
      canvas.width = Math.max(1, Math.round(sw * scale));
      canvas.height = Math.max(1, Math.round(sh * scale));
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.filter = "none";
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      const readText = Boolean(assetsRef.current.ocrAvailable && (crop || Date.now() - lastOcrRef.current > 6000));
      const next = await scanCanvas(canvas, assetsRef.current, { readText });
      if (readText) lastOcrRef.current = Date.now();
      setResult(next);
      setError("");
      return next;
    } catch (e) {
      setError(e?.message || "Camera scan failed.");
    } finally {
      busyRef.current = false;
    }
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
    setTorch(false);
  }, []);

  const start = useCallback(async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access requires HTTPS or localhost and a supported browser.");
      return;
    }
    try {
      setStatus("loading");
      const assetsPromise = loadLocalVisionAssets().catch(() => ({ detector: null, cv: null, ocrAvailable: false }));
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" }, width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      assetsRef.current = await assetsPromise;
      setAssetsReady({
        detector: Boolean(assetsRef.current.detector),
        cv: Boolean(assetsRef.current.cv),
        ocr: Boolean(assetsRef.current.ocrAvailable),
      });
      setStatus("scanning");
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await scan();
      timerRef.current = window.setInterval(() => { void scan(); }, 1500);
    } catch (e) {
      setStatus("idle");
      setError(e?.name === "NotAllowedError" ? "Camera permission was denied. Allow camera access in browser settings." : e?.message || "Could not start the camera.");
      stop();
    }
  }, [scan, stop]);

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  return { videoRef, status, result, error, setError, assetsReady, start, stop, scan, torch, toggleTorch: async () => {
    try {
      const track = streamRef.current?.getVideoTracks?.()[0];
      if (!track) throw new Error("Camera track unavailable.");
      await track.applyConstraints({ advanced: [{ torch: !torch }] });
      setTorch((value) => !value);
      setError("");
    } catch {
      setError("Torch is not supported by this camera/browser.");
    }
  }};
}

export default function FreeVisionMath({ onClose, onVisionResult }) {
  const vision = useFreeVision();
  const [tapResult, setTapResult] = useState("");
  useEffect(() => {
    if (vision.result) onVisionResult?.(vision.result);
  }, [vision.result, onVisionResult]);

  const tapToScan = async (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const crop = { x: Math.max(0, x - 0.2), y: Math.max(0, y - 0.2), width: 0.4, height: 0.4 };
    const result = await vision.scan(crop);
    if (result) setTapResult(result.objects?.length ? result.objects.map((o) => o.class).join(", ") : "Crop measured; object model not available.");
  };

  const data = vision.result;
  return (
    <section className="rounded-2xl border border-emerald-400/25 bg-slate-950 p-3 text-white sm:p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={"rounded-xl p-2 " + (vision.status === "scanning" ? "bg-emerald-400/15 text-emerald-300" : "bg-white/5 text-slate-400")}><Eye size={20} /></span>
          <div><h3 className="text-sm font-bold">RevelaAI · Free Vision Math</h3><p className="mt-1 text-[11px] text-slate-400">Live camera · 1.5-second local scan cycle</p></div>
        </div>
        {onClose && <button onClick={onClose} aria-label="Close vision" className="rounded-lg p-2 text-slate-400 hover:bg-white/10"><X size={16}/></button>}
      </header>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[.06] p-2.5">
        <ShieldCheck size={16} className="shrink-0 text-emerald-300"/>
        <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-emerald-200">Offline Vision · No Internet Needed</p><p className="mt-0.5 text-[10px] leading-4 text-slate-400">Camera pixels are processed on this device. ML/OCR features require their local assets.</p></div>
        <span className={"h-2 w-2 rounded-full " + (vision.status === "scanning" ? "bg-emerald-400 animate-pulse" : "bg-slate-600")}/>
      </div>
      {vision.status !== "idle" && <div className="relative mt-3 overflow-hidden rounded-xl border border-white/10 bg-black">
        <video ref={vision.videoRef} autoPlay muted playsInline onClick={tapToScan} className="max-h-[55vh] min-h-48 w-full cursor-crosshair object-contain"/>
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-black/65 px-2 py-1 text-[10px] text-emerald-200">LIVE SCAN · tap a region</div>
        {data && <div className="pointer-events-none absolute bottom-3 left-3 max-w-[85%] rounded-lg bg-black/75 px-2 py-1.5 text-[10px] text-white">Bright: {data.brightness} · Contours: {data.contourCount} · {data.focus}</div>}
      </div>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {vision.status === "idle" ? <button onClick={vision.start} className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-400 p-3 text-sm font-bold text-slate-950"><Camera size={17}/> Start live camera scan</button> : <>
          <button onClick={() => void vision.scan()} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 p-3 text-sm"><ScanEye size={16}/> Scan now</button>
          <button onClick={vision.stop} className="flex items-center justify-center gap-2 rounded-xl bg-rose-500/15 p-3 text-sm text-rose-200"><Square size={15}/> Stop camera</button>
          <button onClick={vision.toggleTorch} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 p-2.5 text-xs"><Flashlight size={15}/>{vision.torch ? "Torch on" : "Turn on light"}</button>
          <button onClick={() => { if (data) navigator.clipboard?.writeText(data.description).catch(() => {}); }} disabled={!data} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 p-2.5 text-xs disabled:opacity-40"><Zap size={15}/> Copy scan description</button>
        </>}
      </div>
      {vision.status === "loading" && <p className="mt-2 text-xs text-slate-400">Starting camera and checking bundled local assets…</p>}
      {vision.error && <p role="status" className="mt-3 rounded-lg bg-amber-400/10 p-2 text-xs text-amber-200">{vision.error}</p>}
      {tapResult && <p className="mt-2 text-xs text-emerald-200">Tap scan: {tapResult}</p>}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[["Objects", vision.assetsReady.detector ? "COCO-SSD ready" : "math fallback"],["OpenCV", vision.assetsReady.cv ? "ready" : "not installed"],["OCR", vision.assetsReady.ocr ? "ready" : "not installed"]].map(([label, value]) => <div key={label} className="rounded-lg border border-white/10 p-2"><p className="text-[10px] text-slate-500">{label}</p><p className="mt-1 text-[10px] font-semibold">{value}</p></div>)}
      </div>
      {data && <div className="mt-3 space-y-3 rounded-xl border border-white/10 bg-white/[.03] p-3">
        <div className="flex items-center justify-between"><h4 className="text-xs font-bold">Live scan measurements</h4><span className="text-[10px] text-slate-500">{new Date(data.scannedAt).toLocaleTimeString()}</span></div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[["Brightness", `${data.brightness}/255 · ${data.light}`],["Contrast", data.contrast],["Edge activity", data.edgeActivity],["Blur score", data.blurScore]].map(([k,v]) => <div key={k} className="rounded-lg bg-black/20 p-2"><p className="text-[10px] text-slate-500">{k}</p><p className="mt-1 text-xs font-semibold">{v}</p></div>)}
        </div>
        <p className="text-xs leading-5 text-slate-300">{data.description}</p>
        {data.objects?.length > 0 && <div className="flex flex-wrap gap-1.5">{data.objects.map((o,i)=><span key={i} className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-200">{o.class} · {Math.round(o.score*100)}%</span>)}</div>}
        {data.text && <p className="rounded-lg bg-white/5 p-2 text-xs">OCR: “{data.text}”</p>}
        <button onClick={() => window.dispatchEvent(new CustomEvent("revelaai:ask-local-vision", { detail: { prompt: "What do you see?", description: answerWhatDoISee(data), visionData: data } }))} className="w-full rounded-xl border border-emerald-400/30 p-3 text-xs font-semibold text-emerald-200">Ask RevelaAI: “What do you see?”</button>
      </div>}
      <p className="mt-3 text-[10px] leading-4 text-slate-500">No remote endpoints are called. The local model, OpenCV, and OCR are optional until their files are placed under <code>/vision-assets/</code>. Pixel statistics alone cannot identify objects or read text.</p>
    </section>
  );
}
