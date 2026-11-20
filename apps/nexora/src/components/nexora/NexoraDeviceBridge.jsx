import React, { useCallback, useEffect, useState } from "react";
import { Cable, RefreshCw, Smartphone, Download, Play, FileText, Wifi, ShieldCheck, AlertTriangle } from "lucide-react";

const API = "http://127.0.0.1:8765";
const field = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
const button = "inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200";
const primary = "inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50";

export default function NexoraDeviceBridge({ packageId = "com.nexora.game" }) {
  const [pairCode, setPairCode] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("Checking local desktop bridge…");
  const [devices, setDevices] = useState([]);
  const [serial, setSerial] = useState("");
  const [apk, setApk] = useState(null);
  const [installResult, setInstallResult] = useState(null);
  const [logs, setLogs] = useState("");
  const [busy, setBusy] = useState(false);
  const [wireless, setWireless] = useState({ host: "", pairing_port: "37123", connect_port: "5555", pairing_code: "" });

  const request = useCallback(async (path, options = {}, auth = true) => {
    const headers = new Headers(options.headers || {});
    if (auth && token) headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(`${API}${path}`, { ...options, headers, mode: "cors", credentials: "omit", cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.detail || `Desktop bridge request failed (HTTP ${response.status}).`);
    return payload;
  }, [token]);

  const refreshDevices = useCallback(async () => {
    if (!token) return;
    const result = await request("/devices");
    setDevices(result.devices || []);
    setSerial((current) => (result.devices || []).some((device) => device.serial === current && device.state === "device")
      ? current : (result.devices || []).find((device) => device.state === "device")?.serial || "");
    setStatus("Desktop bridge connected");
  }, [request, token]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/health`, { mode: "cors", credentials: "omit", cache: "no-store" })
      .then((response) => response.json())
      .then((result) => { if (!cancelled) setStatus(result.status === "ready" ? "Desktop bridge is running · pair to continue" : "Desktop bridge is unavailable"); })
      .catch(() => { if (!cancelled) setStatus("Desktop bridge not detected. Start NEXORA-Device-Bridge on your desktop."); });
    return () => { cancelled = true; };
  }, []);

  const pair = async () => {
    setBusy(true);
    try {
      const result = await request("/pair", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: pairCode }) }, false);
      setToken(result.access_token);
      setPairCode("");
      setStatus("Paired with this desktop");
    } catch (error) { setStatus(error.message); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    if (!token) return;
    refreshDevices().catch((error) => setStatus(error.message));
  }, [token, refreshDevices]);

  const install = async () => {
    if (!apk || !serial) return;
    if (!window.confirm(`Install ${apk.name} on device ${serial}? This may replace the installed app with the same package ID.`)) return;
    setBusy(true);
    setInstallResult(null);
    try {
      const form = new FormData();
      form.append("file", apk);
      form.append("serial", serial);
      form.append("package_id", packageId);
      form.append("confirm_install", "true");
      const result = await request("/install", { method: "POST", body: form });
      setInstallResult(result);
      setStatus("APK installed successfully");
    } catch (error) { setStatus(error.message); }
    finally { setBusy(false); }
  };

  const launch = async () => {
    setBusy(true);
    try {
      await request("/launch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serial, package_id: packageId }) });
      setStatus("Game launch command completed");
    } catch (error) { setStatus(error.message); }
    finally { setBusy(false); }
  };

  const collectLogs = async () => {
    setBusy(true);
    try {
      const result = await request(`/logcat?serial=${encodeURIComponent(serial)}&package_id=${encodeURIComponent(packageId)}&lines=300`);
      setLogs(result.logcat || "No app-process logs returned.");
    } catch (error) { setLogs(error.message); }
    finally { setBusy(false); }
  };

  const pairWireless = async () => {
    setBusy(true);
    try {
      await request("/wireless/pair", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ host: wireless.host, pairing_port: Number(wireless.pairing_port), connect_port: Number(wireless.connect_port), pairing_code: wireless.pairing_code }) });
      setWireless((current) => ({ ...current, pairing_code: "" }));
      await refreshDevices();
      setStatus("Wireless device paired and connected");
    } catch (error) { setStatus(error.message); }
    finally { setBusy(false); }
  };

  return <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"><Cable size={18}/></span><div><h3 className="font-black">Desktop Device Bridge</h3><p className="text-xs text-slate-500">Install, launch and inspect your game on a real Android device.</p></div></div><span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">Local computer only</span></div>
    <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300"><ShieldCheck size={15} className="mt-0.5 shrink-0"/>The bridge runs on your desktop and only listens on loopback. Its pairing token stays in this page's memory and is not saved to RevelaCode or Neon. Every installation requires your confirmation.</div>
    <div className="mt-4 flex flex-wrap items-end gap-2"><label className="min-w-[190px] flex-1 text-xs font-bold text-slate-600 dark:text-slate-300">One-time desktop pairing code<input className={field} inputMode="numeric" maxLength={8} value={pairCode} onChange={(e)=>setPairCode(e.target.value.replace(/\\D/g,""))} placeholder="8-digit code from desktop terminal"/></label><button type="button" className={primary} disabled={busy || pairCode.length !== 8 || Boolean(token)} onClick={pair}>Pair desktop</button><button type="button" className={button} disabled={busy || !token} onClick={refreshDevices}><RefreshCw size={13}/> Refresh devices</button><button type="button" className={button} disabled={!token} onClick={()=>{setToken("");setDevices([]);setSerial("");setStatus("Desktop bridge disconnected");}}>Disconnect</button></div>
    <p className="mt-2 text-[11px] text-slate-500">{status}</p>
    {token && <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><div className="flex items-center justify-between gap-2"><h4 className="text-xs font-black">Connected Android devices</h4><Smartphone size={15} className="text-slate-400"/></div><label className="mt-3 block text-xs font-bold text-slate-600 dark:text-slate-300">Target device<select className={field} value={serial} onChange={(e)=>setSerial(e.target.value)}><option value="">Select an authorized device</option>{devices.map((device)=><option key={device.serial} value={device.serial} disabled={device.state !== "device"}>{device.model || device.serial} · {device.state}</option>)}</select></label>{devices.length === 0 && <p className="mt-2 text-[11px] text-slate-500">No device found. Enable USB debugging, connect your phone and accept its RSA authorization prompt.</p>}
        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800"><h5 className="flex items-center gap-2 text-xs font-black"><Wifi size={13}/> Wireless Debugging</h5><div className="mt-2 grid grid-cols-2 gap-2"><label className="col-span-2 text-[10px] font-semibold text-slate-500">Phone IP address<input className={field} value={wireless.host} onChange={(e)=>setWireless({...wireless,host:e.target.value})} placeholder="192.168.1.20"/></label><label className="text-[10px] font-semibold text-slate-500">Pairing port<input className={field} value={wireless.pairing_port} onChange={(e)=>setWireless({...wireless,pairing_port:e.target.value})}/></label><label className="text-[10px] font-semibold text-slate-500">Connect port<input className={field} value={wireless.connect_port} onChange={(e)=>setWireless({...wireless,connect_port:e.target.value})}/></label><label className="col-span-2 text-[10px] font-semibold text-slate-500">Six-digit pairing code<input className={field} inputMode="numeric" maxLength={6} value={wireless.pairing_code} onChange={(e)=>setWireless({...wireless,pairing_code:e.target.value.replace(/\\D/g,"")})}/></label></div><button type="button" className={button+" mt-2 w-full"} disabled={busy || wireless.pairing_code.length !== 6 || !wireless.host} onClick={pairWireless}>Pair wireless phone</button></div>
      </div>
      <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><h4 className="text-xs font-black">Install this build</h4><p className="mt-1 text-[11px] text-slate-500">Download the APK from the completed production job, then select it here. The bridge checks the APK package ID before installation.</p><label className="mt-3 block text-xs font-bold text-slate-600 dark:text-slate-300">APK file<input className={field} type="file" accept=".apk,application/vnd.android.package-archive" onChange={(e)=>setApk(e.target.files?.[0] || null)}/></label><p className="mt-2 break-all text-[10px] text-slate-500">Expected package: {packageId}</p><button type="button" className={primary+" mt-3 w-full"} disabled={busy || !serial || !apk || !apk.name.toLowerCase().endsWith(".apk")} onClick={install}><Download size={14}/> Confirm and install APK</button>{installResult && <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-[10px] leading-5 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"><strong>Installed · SHA-256</strong><p className="break-all">{installResult.sha256}</p></div>}<div className="mt-3 grid grid-cols-2 gap-2"><button type="button" className={button} disabled={busy || !serial} onClick={launch}><Play size={13}/> Launch game</button><button type="button" className={button} disabled={busy || !serial} onClick={collectLogs}><FileText size={13}/> Get logcat</button></div></div>
    </div>}
    {logs && <div className="mt-4"><div className="flex items-center gap-2 text-xs font-black"><FileText size={14}/> App process logcat</div><pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-slate-950 p-3 text-[10px] leading-4 text-emerald-300">{logs}</pre></div>}
    <p className="mt-3 flex items-start gap-2 text-[10px] leading-5 text-slate-500"><AlertTriangle size={13} className="mt-0.5 shrink-0"/>AAB files cannot be installed directly. Export an APK for device testing. Physical testing is not a substitute for separate gameplay, performance and compatibility QA.</p>
  </section>;
}
