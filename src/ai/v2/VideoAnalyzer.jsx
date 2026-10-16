import React, { useEffect, useState } from "react";
import { Film, Link2, Loader2, Upload, X } from "lucide-react";

export default function VideoAnalyzer({ onAnalyze, onClose, busy = false }) {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [prompt, setPrompt] = useState("Summarize the key scenes and spoken content. Distinguish what is visible from any interpretation.");
  const [error, setError] = useState("");
  useEffect(() => () => { if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl); }, [file]);
  const submit = () => {
    setError("");
    if (file) return onAnalyze?.(file, prompt);
    const trimmed = url.trim();
    if (!/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(trimmed)) {
      setError("Enter a valid HTTPS YouTube link or upload a video file.");
      return;
    }
    onAnalyze?.(null, `${prompt}\nAnalyze this YouTube video URL: ${trimmed}. If the service cannot access its media, explain the limitation rather than inventing a transcript.`);
  };
  return (
    <section className="rounded-2xl border border-cyan-400/20 bg-slate-950 p-4 text-white sm:p-5">
      <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><Film size={20} className="text-cyan-300"/><div><h3 className="text-sm font-bold">Video intelligence</h3><p className="mt-1 text-xs text-slate-400">Video uploads or a YouTube link</p></div></div><button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10" aria-label="Close video analyzer"><X size={16}/></button></div>
      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-3 py-4 text-sm hover:bg-white/[0.07]"><Upload size={17}/>{file ? file.name : "Choose video (up to 20 MB)"}
        <input hidden type="file" accept="video/*" onChange={e => { const next = e.target.files?.[0]; if (next && next.size > 20 * 1024 * 1024) { setError("Video must be 20 MB or smaller."); return; } setFile(next || null); setError(""); e.target.value = ""; }}/>
      </label>
      <div className="my-3 flex items-center gap-3 text-[10px] uppercase tracking-wider text-slate-500"><span className="h-px flex-1 bg-white/10"/>or link<span className="h-px flex-1 bg-white/10"/></div>
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3"><Link2 size={16} className="shrink-0 text-slate-400"/><input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://youtu.be/…" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"/></div>
      <label className="mt-3 block text-xs font-medium text-slate-300">Analysis instructions</label><textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={2} className="mt-1 w-full resize-y rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none focus:border-cyan-300/50"/>
      {error && <p role="status" className="mt-2 text-xs text-amber-300">{error}</p>}
      <button type="button" disabled={busy || (!file && !url.trim())} onClick={submit} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{busy ? <Loader2 size={17} className="animate-spin"/> : <Film size={17}/>} {busy ? "Analyzing video…" : "Analyze video"}</button>
      <p className="mt-2 text-[10px] leading-4 text-slate-500">Video understanding depends on the configured backend's media support. This panel does not claim live-feed or emotion-detection support unless the service actually provides it.</p>
    </section>
  );
}
