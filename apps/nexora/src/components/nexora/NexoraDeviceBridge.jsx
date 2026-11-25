import React, { useCallback, useEffect, useState } from "react";
import { Cable, RefreshCw, Smartphone, Download, Play, FileText, Wifi, ShieldCheck, AlertTriangle, Cpu, HardDrive, Monitor, CheckCircle2, XCircle } from "lucide-react";

const API = "http://127.0.0.1:8765";
const field = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
const button = "inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200";
const primary = "inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50";

export default function NexoraDeviceBridge({ packageId = "com.nexora.game", accountAccessToken = "", expectedAccountUserId = "", onConnectionChange = () => {} }) {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("Checking local desktop bridge…");
  const [devices, setDevices] = useState([]);
  const [serial, setSerial] = useState("");
  const [apk, setApk] = useState(null);
  const [installResult, setInstallResult] = useState(null);
  const [logs, setLogs] = useState("");
  const [busy, setBusy] = useState(false);
  const [wireless, setWireless] = useState({ host: "", pairing_port: "37123", connect_port: "5555", pairing_code: "" });
  const [capabilities, setCapabilities] = useState(null);
  const [workloadProfile, setWorkloadProfile] = useState("procedural_3d");
  const [preflight, setPreflight] = useState(null);
  const [hardwareBusy, setHardwareBusy] = useState(false);

  const request = useCallback(async (path, options = {}, auth = true, explicitToken = null) => {
    const headers = new Headers(options.headers || {});
    const activeToken = explicitToken || token;
    if (auth && activeToken) headers.set("Authorization", `Bearer ${activeToken}`);
    const response = await fetch(`${API}${path}`, { ...options, headers, mode: "cors", credentials: "omit", cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = payload?.detail;
      throw new Error(typeof detail === "string" ? detail : detail?.message || `NEXORA Local Agent request failed (HTTP ${response.status}).`);
    }
    return payload;
  }, [token]);



  const loadHardware = useCallback(async (authToken = token) => {
    if (!authToken) return;
    setHardwareBusy(true);
    try {
      const system = await request("/system/capabilities", {}, true, authToken);
      const pairedUserId = String(system?.agent?.paired_user || "");
      if (expectedAccountUserId && pairedUserId !== String(expectedAccountUserId)) {
        throw new Error("This computer is paired to a different NEXORA account. Disconnect it and pair again with the current account.");
      }
      const check = await request("/requirements/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: workloadProfile }),
      }, true, authToken);
      setCapabilities(system);
      setPreflight(check);
      onConnectionChange(true, system);
    } finally {
      setHardwareBusy(false);
    }
  }, [request, token, workloadProfile, onConnectionChange]);

  const refreshDevices = useCallback(async () => {
    if (!token) return;
    const result = await request("/devices");
    setDevices(result.devices || []);
    setSerial((current) => (result.devices || []).some((device) => device.serial === current && device.state === "device")
      ? current : (result.devices || []).find((device) => device.state === "device")?.serial || "");
    await loadHardware(token);
    setStatus("Local compute agent connected");
  }, [request, token, loadHardware]);


  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/health`, { mode: "cors", credentials: "omit", cache: "no-store" })
      .then((response) => response.json())
      .then(async (result) => {
        if (cancelled) return;
        if (result.status !== "ready") {
          setStatus("NEXORA Local Compute Agent is unavailable.");
          return;
        }
        const storedToken = sessionStorage.getItem("nexora.local-agent.token");
        if (!storedToken) {
          setStatus("Local agent detected · pair this browser to continue.");
          return;
        }
        try {
          await loadHardware(storedToken);
          if (cancelled) return;
          setToken(storedToken);
          onConnectionChange(true);
          setStatus("Local compute agent reconnected for this browser session.");
        } catch {
          sessionStorage.removeItem("nexora.local-agent.token");
          onConnectionChange(false);
          if (!cancelled) setStatus("The saved local pairing is expired or belongs to another NEXORA account. Pair this computer again.");
        }
      })
      .catch(() => { if (!cancelled) setStatus("Local agent not detected. Install and start the NEXORA Local Compute Agent on your desktop."); });
    return () => { cancelled = true; };
  }, [loadHardware, onConnectionChange]);

  const pair = async () => {
    if (!accountAccessToken) {
      setStatus("Sign in to your NEXORA account before pairing this computer.");
      return;
    }
    setBusy(true);
    try {
      const result = await request("/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent: true,
          account_access_token: accountAccessToken,
        }),
      }, false);
      sessionStorage.setItem("nexora.local-agent.token", result.access_token);
      setToken(result.access_token);
      await loadHardware(result.access_token);
      onConnectionChange(true);
      setStatus("This computer is connected to NEXORA · local hardware preflight is ready");
    } catch (error) {
      setStatus(error.message);
      onConnectionChange(false);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    refreshDevices().catch((error) => setStatus(error.message));
  }, [token, refreshDevices]);

  const refreshHardware = async () => {
    setHardwareBusy(true);
    try {
      const system = await request("/system/capabilities");
      const check = await request("/requirements/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: workloadProfile }),
      });
      setCapabilities(system);
      setPreflight(check);
      onConnectionChange(true, system);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setHardwareBusy(false);
    }
  };

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

  const machine = capabilities?.machine || {};
  const gpu = capabilities?.gpu?.primary || null;
  const tools = capabilities?.tools || {};
  const toolLabels = [["blender","Blender"],["godot","Godot 4"],["ffmpeg","FFmpeg"],["ffprobe","FFprobe"],["java","Java"],["adb","ADB"]];
  const formatBytes = (value) => value ? `${(Number(value) / (1024 ** 3)).toFixed(1)} GiB` : "Not detected";

  return <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"><Cable size={18}/></span><div><h3 className="font-black">Desktop Device Bridge</h3><p className="text-xs text-slate-500">Install, launch and inspect your game on a real Android device.</p></div></div><span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">Local computer only</span></div>
    <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300"><ShieldCheck size={15} className="mt-0.5 shrink-0"/>Generation, video processing, Blender, GPU inference and Godot exports run on this computer. The local agent binds to 127.0.0.1 only. Hardware details remain local; only the final game build is intended for cloud publishing. Device installation always requires your confirmation.</div>
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <div className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="text-[10px] font-black tracking-wide text-slate-700 dark:text-slate-200">CONNECT THIS COMPUTER</div>
        <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">Choose Allow & connect to authorize this signed-in NEXORA account to run jobs you start on this PC. No pairing code or terminal entry is required.</p>
      </div>
      <button type="button" className={primary} disabled={busy || Boolean(token) || !accountAccessToken} onClick={pair}><ShieldCheck size={14}/>{busy ? "Connecting…" : "Allow & connect this computer"}</button>
      <button type="button" className={button} disabled={busy || !token} onClick={refreshDevices}><RefreshCw size={13}/> Refresh hardware & devices</button>
      <button type="button" className={button} disabled={!token} onClick={async()=>{try{await request("/disconnect",{method:"POST"});}catch{}sessionStorage.removeItem("nexora.local-agent.token");setToken("");setDevices([]);setSerial("");setCapabilities(null);setPreflight(null);onConnectionChange(false);setStatus("Local agent disconnected");}}>Disconnect</button>
    </div>
    <p className="mt-2 text-[11px] text-slate-500">{status}</p>
    {token && <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h4 className="flex items-center gap-2 text-xs font-black"><Monitor size={15}/> LOCAL HARDWARE & ENVIRONMENT CHECK</h4><p className="mt-1 text-[10px] text-slate-500">NEXORA reads your computer's resources locally; this information is not uploaded.</p></div>
        <button type="button" className={button} disabled={hardwareBusy} onClick={refreshHardware}><RefreshCw size={13}/> Recheck</button>
      </div>
      {capabilities && <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900"><div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><Cpu size={13}/> CPU</div><div className="mt-2 text-lg font-black">{machine.logical_cpu_count || "—"} cores</div><p className="mt-1 truncate text-[10px] text-slate-500">{machine.cpu_model || machine.architecture || "Processor details unavailable"}</p></div>
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900"><div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><HardDrive size={13}/> SYSTEM MEMORY</div><div className="mt-2 text-lg font-black">{machine.ram_total_gib ? `${machine.ram_total_gib} GiB` : "—"}</div><p className="mt-1 text-[10px] text-slate-500">{machine.ram_available_gib != null ? `${machine.ram_available_gib} GiB currently available` : "Installed physical RAM"}</p></div>
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900"><div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><HardDrive size={13}/> FREE STORAGE</div><div className="mt-2 text-lg font-black">{machine.disk_free_gib ? `${machine.disk_free_gib} GiB` : "—"}</div><p className="mt-1 text-[10px] text-slate-500">Available for projects and outputs</p></div>
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900"><div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><Monitor size={13}/> GPU</div><div className="mt-2 truncate text-sm font-black">{gpu?.name || "No supported CUDA GPU detected"}</div><p className="mt-1 text-[10px] text-slate-500">{gpu ? `${formatBytes(gpu.memory_total_bytes)} total · ${formatBytes(gpu.memory_free_bytes)} free` : "2D and CPU-based workflows may still run"}</p></div>
      </div>}
      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(220px,.65fr)_minmax(0,1.35fr)]">
        <div><label className="block text-[10px] font-bold text-slate-500">WORKLOAD TO CHECK<select className={field} value={workloadProfile} onChange={async(e)=>{setWorkloadProfile(e.target.value);setHardwareBusy(true);try{const result=await request("/requirements/check",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({profile:e.target.value})});setPreflight(result);}catch(error){setStatus(error.message);}finally{setHardwareBusy(false);}}}>
          <option value="editor_2d">2D / lightweight games</option><option value="procedural_3d">Procedural 3D production</option><option value="movie_processing">Movie processing</option><option value="image_to_3d">AI image-to-3D (CUDA)</option><option value="android_export">Android build & device testing</option>
        </select></label>
          {preflight && <div className={`mt-3 rounded-lg p-3 text-[11px] ${preflight.ready?"bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200":"bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"}`}><strong>{preflight.ready?"Requirements satisfied":"Requirements not yet satisfied"}</strong><p className="mt-1 leading-5">{preflight.summary}</p></div>}
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500">INSTALLED TOOLCHAIN</div>
          <div className="mt-2 flex flex-wrap gap-2">{toolLabels.map(([key,label])=><span key={key} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${tools[key]?.available?"bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200":"bg-slate-100 text-slate-500 dark:bg-slate-900"}`}>{tools[key]?.available?<CheckCircle2 size={11}/>:<XCircle size={11}/>} {label}</span>)}</div>
          {preflight && <div className="mt-3 space-y-1.5">{preflight.checks.map((item)=><div key={item.name} className="flex items-start gap-2 text-[10px]"><span className={item.status==="pass"?"text-emerald-600":item.status==="fail"?"text-rose-500":"text-amber-500"}>{item.status==="pass"?<CheckCircle2 size={12}/>:<AlertTriangle size={12}/>}</span><span className="text-slate-500"><strong className="text-slate-700 dark:text-slate-300">{item.name}:</strong> {item.detail}</span></div>)}</div>}
        </div>
      </div>
    </div>}
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
