import React, { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, LoaderCircle, ScanEye, X } from "lucide-react";

export default function VisionAnalyzer({ onAnalyze, onClose, busy = false }) {
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState("Describe what you see, read any visible text, and separate observations from assumptions.");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => () => stopCamera(), []);
  const stopCamera = () => {
    streamRef.current?.getTracks?.().forEach(track => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };
  const startCamera = async () => {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access requires HTTPS and a supported browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => { if (videoRef.current) videoRef.current.srcObject = stream; });
    } catch {
      setCameraError("Camera permission was denied or no camera is available.");
    }
  };
  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) { setCameraError("Camera is still starting. Try again in a moment."); return; }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (blob) setFile(new File([blob], `revela-camera-${Date.now()}.jpg`, { type: "image/jpeg" }));
      stopCamera();
    }, "image/jpeg", 0.88);
  };

  return (
    <section className="rounded-2xl border border-violet-400/20 bg-slate-950 p-4 text-white sm:p-5">
      <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><ScanEye className="text-violet-300" size={20}/><div><h3 className="text-sm font-bold">Vision engine</h3><p className="mt-1 text-xs text-slate-400">Images, screenshots, charts and visible text</p></div></div><button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10" aria-label="Close vision analyzer"><X size={16}/></button></div>
      {cameraOpen ? <div className="mt-4 overflow-hidden rounded-xl bg-black"><video ref={videoRef} autoPlay muted playsInline className="max-h-64 w-full object-contain"/><div className="flex gap-2 p-2"><button type="button" onClick={capture} className="flex-1 rounded-lg bg-violet-500 px-3 py-2 text-sm font-semibold">Capture photo</button><button type="button" onClick={stopCamera} className="rounded-lg border border-white/15 px-3 py-2 text-sm">Cancel</button></div></div> : <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => inputRef.current?.click()} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm hover:bg-white/10"><ImagePlus size={17}/> Upload image</button><button type="button" onClick={startCamera} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm hover:bg-white/10"><Camera size={17}/> Use camera</button></div>}
      <input ref={inputRef} hidden type="file" accept="image/*" capture="environment" onChange={e => { setFile(e.target.files?.[0] || null); e.target.value = ""; }}/>
      {file && <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 p-2"><img src={URL.createObjectURL(file)} alt="Selected image preview" className="h-14 w-14 rounded-lg object-cover"/><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{file.name}</p><p className="text-[11px] text-slate-400">{(file.size / 1024).toFixed(0)} KB</p></div><button type="button" onClick={() => setFile(null)} aria-label="Remove image" className="p-1 text-slate-400"><X size={15}/></button></div>}
      <label className="mt-3 block text-xs font-medium text-slate-300">What should RevelaAI focus on?</label><textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={2} className="mt-1 w-full resize-y rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none focus:border-violet-300/50" placeholder="Read this chart, extract text, explain this Bible scene…"/>
      {cameraError && <p role="status" className="mt-2 text-xs text-amber-300">{cameraError}</p>}
      <button type="button" disabled={!file || busy} onClick={() => onAnalyze?.(file, prompt)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50">{busy ? <LoaderCircle className="animate-spin" size={17}/> : <ScanEye size={17}/>} {busy ? "Analyzing image…" : "Analyze image"}</button>
      <p className="mt-2 text-[10px] leading-4 text-slate-500">Image processing is sent to your configured RevelaAI service. Avoid uploading sensitive images without permission.</p>
    </section>
  );
}
