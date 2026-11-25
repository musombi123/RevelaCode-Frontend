import React, { useCallback, useEffect, useState } from "react";
import { Cable, RefreshCw, Smartphone, Download, Play, FileText, Wifi, ShieldCheck, AlertTriangle, Cpu, HardDrive, Monitor, CheckCircle2, XCircle, Server } from "lucide-react";

const API = "http://127.0.0.1:8765";
const CLOUD_API = String(import.meta.env.VITE_NEXORA_API_URL || "https://nexora-foundry-api.onrender.com").replace(/\/$/, "");
const field = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
const button = "inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200";
const primary = "inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50";

export default function NexoraDeviceBridge({ packageId = "com.nexora.game", accountAccessToken = "", expectedAccountUserId = "", onConnectionChange = () => {} }) {
  const [token, setToken] = useState("");
  const [agentReachable, setAgentReachable] = useState(false);
  const [agentChecking, setAgentChecking] = useState(true);
  const [status, setStatus] = useState("Checking whether the Local Agent is running on this computer…");
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
  const [managedCapabilities, setManagedCapabilities] = useState(null);
  const [managedPlan, setManagedPlan] = useState(null);
  const [managedBusy, setManagedBusy] = useState(false);
  const [shareHardwareMetrics, setShareHardwareMetrics] = useState(false);
  const [managedError, setManagedError] = useState("");

  const request = useCallback(async (path, options = {}, auth = true, explicitToken = null) => {
    const headers = new Headers(options.headers || {});
    const activeToken = explicitToken || token;
    if (auth && activeToken) headers.set("Authorization", `Bearer ${activeToken}`);
    const response = await fetch(`${API}${path}`, { ...options, headers, mode: "cors", credentials: "omit", cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = payload?.detail;
      const error = new Error(typeof detail === "string" ? detail : detail?.message || `NEXORA Local Agent request failed (HTTP ${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return payload;
  }, [token]);

  const cloudRequest = useCallback(async (path, options = {}) => {
    if (!accountAccessToken) throw new Error("Sign in to your NEXORA account to access managed compute.");
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", "Bearer " + accountAccessToken);
    if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const response = await fetch(CLOUD_API + path, { ...options, headers, credentials: "omit", cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = payload?.detail;
      throw new Error(typeof detail === "string" ? detail : detail?.message || "Managed compute request failed (HTTP " + response.status + ").");
    }
    return payload;
  }, [accountAccessToken]);

  const refreshManagedCapabilities = useCallback(async () => {
    if (!accountAccessToken) {
      setManagedCapabilities(null);
      return null;
    }
    setManagedBusy(true);
    setManagedError("");
    try {
      const result = await cloudRequest("/api/compute/capabilities");
      setManagedCapabilities(result);
      if (result.available === false) setManagedError(result.message || "Managed compute is not provisioned.");
      return result;
    } catch (error) {
      setManagedCapabilities(null);
      setManagedError(error.message || "Could not check the managed server toolchain.");
      return null;
    } finally {
      setManagedBusy(false);
    }
  }, [accountAccessToken, cloudRequest]);

  const requestManagedPlan = useCallback(async (systemProfile, selectedWorkload = workloadProfile, consent = false) => {
    if (!accountAccessToken) return null;
    const metricsShared = consent === true && Boolean(systemProfile);
    setManagedBusy(true);
    setManagedError("");
    try {
      const result = await cloudRequest("/api/compute/plan", {
        method: "POST",
        body: JSON.stringify({
          workload: selectedWorkload === "editor_2d" ? "workspace_editing" : selectedWorkload,
          local_profile: metricsShared ? systemProfile : {},
          consent_to_share_hardware_metrics: metricsShared,
        }),
      });
      setManagedPlan(result);
      return result;
    } catch (error) {
      setManagedPlan(null);
      setManagedError(error.message || "Could not calculate a safe workload placement.");
      return null;
    } finally {
      setManagedBusy(false);
    }
  }, [accountAccessToken, cloudRequest, workloadProfile]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await refreshManagedCapabilities();
      if (!cancelled && result?.available) {
        // The default placement check sends no local device data. The managed
        // server is selected only when its own toolchain and capacity pass.
        await requestManagedPlan(null, workloadProfile, false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshManagedCapabilities, requestManagedPlan, workloadProfile]);

  const setHardwareMetricsConsent = async (enabled) => {
    setShareHardwareMetrics(enabled);
    if (!enabled) {
      setManagedError("Local CPU/RAM/tool measurements stay on this computer. No personal-device metrics were sent.");
      await requestManagedPlan(null, workloadProfile, false);
      return;
    }
    if (capabilities) {
      await requestManagedPlan(capabilities, workloadProfile, true);
    } else {
      setManagedError("Connect the optional device bridge and refresh hardware to compare local capacity. No local metrics have been sent.");
      await requestManagedPlan(null, workloadProfile, false);
    }
  };

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
      if (shareHardwareMetrics) await requestManagedPlan(system, workloadProfile, true);
      onConnectionChange(true, system);
    } finally {
      setHardwareBusy(false);
    }
  }, [request, token, workloadProfile, onConnectionChange, shareHardwareMetrics, requestManagedPlan]);

  const refreshDevices = useCallback(async () => {
    if (!token) return;
    const result = await request("/devices");
    setDevices(result.devices || []);
    setSerial((current) => (result.devices || []).some((device) => device.serial === current && device.state === "device")
      ? current : (result.devices || []).find((device) => device.state === "device")?.serial || "");
    await loadHardware(token);
    setStatus("Local compute agent connected");
  }, [request, token, loadHardware]);


  const checkAgent = useCallback(async () => {
    setAgentChecking(true);
    try {
      const response = await fetch(`${API}/health`, {
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Local Agent health check failed (HTTP ${response.status}).`);
      }
      const result = await response.json();
      if (result.status !== "ready") {
        throw new Error("The NEXORA Local Agent is running but is not ready yet.");
      }
      setAgentReachable(true);
      const storedToken = sessionStorage.getItem("nexora.local-agent.token");
      if (storedToken) {
        setToken(storedToken);
        setStatus("Local Agent detected. Verifying the saved browser pairing…");
      } else {
        setStatus("Local Agent detected. Approve this computer to connect.");
      }
      return true;
    } catch {
      setAgentReachable(false);
      setStatus("Cannot reach 127.0.0.1:8765. The NEXORA Local Agent is not running on this computer.");
      onConnectionChange(false);
      return false;
    } finally {
      setAgentChecking(false);
    }
  }, [onConnectionChange]);

  useEffect(() => {
    // Probe immediately, then use a bounded low-frequency discovery window.
    // This lets the browser detect the agent as soon as the installer starts it,
    // without repeatedly calling /pair or retrying failed production requests.
    void checkAgent();
  }, [checkAgent]);

  useEffect(() => {
    if (agentReachable) return undefined;
    let attempts = 0;
    let timer = null;
    let cancelled = false;

    const retryHealthCheck = () => {
      timer = window.setTimeout(async () => {
        if (cancelled || document.visibilityState === "hidden") {
          if (!cancelled && attempts < 18) retryHealthCheck();
          return;
        }
        attempts += 1;
        const reachable = await checkAgent();
        if (!cancelled && !reachable && attempts < 18) retryHealthCheck();
      }, 5000);
    };

    retryHealthCheck();
    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [agentReachable, checkAgent]);

  const pair = async () => {
    if (!agentReachable) {
      setStatus("Start the NEXORA Local Agent on this computer, then choose Check connection.");
      return;
    }
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
      setStatus(error.message || "The Local Agent pairing request failed.");
      onConnectionChange(false);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!token || !agentReachable) return;
    let cancelled = false;
    refreshDevices().catch((error) => {
      if (cancelled) return;
      // A missing ADB installation or a temporary device-service failure does
      // not invalidate the account pairing. Only clear a rejected/expired token.
      if (error.status === 401 || /paired to a different NEXORA account/i.test(error.message || "")) {
        sessionStorage.removeItem("nexora.local-agent.token");
        setToken("");
      }
      setCapabilities(null);
      setPreflight(null);
      onConnectionChange(false);
      setStatus(error.message || "The Local Agent is reachable, but hardware discovery failed.");
    });
    return () => { cancelled = true; };
  }, [token, agentReachable, refreshDevices, onConnectionChange]);

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
      if (shareHardwareMetrics) await requestManagedPlan(system, workloadProfile, true);
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
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"><Cable size={18}/></span><div><h3 className="font-black">Desktop Device Bridge</h3><p className="text-xs text-slate-500">Optional local acceleration and physical Android-device testing. NEXORA's production toolchain is provisioned on the managed server.</p></div></div><span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">Optional device bridge</span></div>
    <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300"><ShieldCheck size={15} className="mt-0.5 shrink-0"/>The managed server supplies Blender, Godot 4, FFmpeg/FFprobe, Java and Android build tools. This optional bridge lets NEXORA measure local CPU/RAM headroom for informed placement and connect a physical Android phone over USB or Wi-Fi. Server toolchain checks do not require local pairing.</div>
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <div className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="text-[10px] font-black tracking-wide text-slate-700 dark:text-slate-200">OPTIONAL · CONNECT THIS COMPUTER</div>
        <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">Connect this PC only when you want to use its local CPU/RAM for eligible work or test a build on a physical Android phone. The managed server toolchain is separate.</p>
      </div>
      <button type="button" className={primary} disabled={busy || !agentReachable || Boolean(token) || !accountAccessToken} onClick={pair}><ShieldCheck size={14}/>{busy ? "Connecting…" : "Allow & connect this computer"}</button>
      <button type="button" className={button} disabled={agentChecking} onClick={checkAgent}><RefreshCw size={13}/>{agentChecking ? "Checking…" : "Check connection"}</button>
      <button type="button" className={button} disabled={busy || !token} onClick={refreshDevices}><RefreshCw size={13}/> Refresh hardware & devices</button>
      <button type="button" className={button} disabled={!token} onClick={async()=>{try{await request("/disconnect",{method:"POST"});}catch{}sessionStorage.removeItem("nexora.local-agent.token");setToken("");setDevices([]);setSerial("");setCapabilities(null);setPreflight(null);onConnectionChange(false);setStatus("Local agent disconnected");}}>Disconnect</button>
    </div>
    <p className={"mt-2 text-[11px] " + (agentReachable ? "text-emerald-500" : "text-amber-500")} role="status">{status}</p>
    {!agentReachable && <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-slate-300">
      <div className="flex items-start gap-2">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-cyan-300"/>
        <div className="min-w-0">
          <h4 className="text-xs font-black">LOCAL DEVICE BRIDGE NOT CONNECTED · OPTIONAL</h4>
          <p className="mt-1 text-[11px] leading-5">The managed server toolchain is independent of this PC. Without the optional bridge, NEXORA cannot use this computer as a local execution node or install builds directly to a physical Android phone. You can still check the server toolchain above.</p>
          <button type="button" className={button + " mt-3"} disabled={agentChecking} onClick={checkAgent}><RefreshCw size={13}/>{agentChecking ? "Checking…" : "Check local bridge"}</button>
        </div>
      </div>
    </div>}
    {accountAccessToken && !token && <section className="mt-4 rounded-xl border border-cyan-900/60 bg-[#081820] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h4 className="flex items-center gap-2 text-xs font-black text-cyan-200"><Server size={14}/> SERVER-MANAGED PRODUCTION TOOLCHAIN</h4><p className="mt-1 text-[10px] text-slate-400">The production tools are installed on NEXORA's private worker. No local tool installation or device pairing is required to check server readiness.</p></div>
        <button type="button" className={button} disabled={managedBusy} onClick={refreshManagedCapabilities}><RefreshCw size={12}/>{managedBusy ? "Checking…" : "Recheck server"}</button>
      </div>
      {managedCapabilities && <div className="mt-3 flex flex-wrap gap-2">
        {[[ "blender","Blender" ],[ "godot","Godot 4" ],[ "ffmpeg","FFmpeg" ],[ "ffprobe","FFprobe" ],[ "java","Java 17" ],[ "adb","ADB" ],[ "android_sdk","Android SDK" ],[ "android_apk_inspector","APK Inspector" ]].map(([key,label])=><span key={key} className={"inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold "+(managedCapabilities.toolchain?.[key]?"bg-emerald-950/40 text-emerald-200":"bg-slate-900 text-slate-500")}>{managedCapabilities.toolchain?.[key]?<CheckCircle2 size={11}/>:<XCircle size={11}/>} {label}</span>)}
      </div>}
      {managedCapabilities && <p className={"mt-2 text-[10px] "+(managedCapabilities.toolchain_ready?"text-emerald-300":"text-amber-300")}>{managedCapabilities.toolchain_ready ? "Server toolchain ready." : "The worker is reachable but the complete toolchain is not ready."}</p>}
      {managedCapabilities && <p className={"mt-1 text-[10px] "+(managedCapabilities.workspace_storage?.ready?"text-emerald-300":"text-amber-300")}>{managedCapabilities.workspace_storage?.ready ? "Persistent server workspace volume verified." : managedCapabilities.workspace_storage?.note || "Persistent workspace storage is not verified."}</p>}
      {!managedCapabilities && <p className="mt-2 text-[10px] text-amber-300">{managedError || "Sign in to check the managed server toolchain."}</p>}
      {managedPlan && <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-[10px] leading-5">
        <strong className="text-cyan-200">PLACEMENT RECOMMENDATION · {String(managedPlan.execution_location || "unknown").replaceAll("_"," ").toUpperCase()}</strong>
        <p className="mt-1 text-slate-300">{managedPlan.reason}</p>
        <p className="mt-1 text-slate-400">Local device metrics: not shared. Local capacity is treated as unknown.</p>
        {managedPlan.execution_location==="managed_server" && <p className="mt-1 text-amber-300">Server preflight passed. Secure project transfer and remote job execution are not enabled yet, so this recommendation has not uploaded or started any project work.</p>}
        {managedPlan.execution_location==="unavailable" && <p className="mt-1 text-amber-300">The standard server worker is not large enough for this workload. Choose a lighter profile or wait for higher-capacity compute.</p>}
      </div>}
    </section>}
    {agentReachable && !token && <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-[11px] text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200">Local Agent is running on this PC. Select <b>Allow & connect this computer</b> to authorize this NEXORA account.</div>}
    {token && <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h4 className="flex items-center gap-2 text-xs font-black"><Monitor size={15}/> OPTIONAL LOCAL HARDWARE CHECK</h4><p className="mt-1 text-[10px] text-slate-500">Local CPU/RAM/tool measurements stay on this PC unless you explicitly allow an anonymous resource summary for placement. Missing PC tools do not block the server toolchain.</p></div>
        <button type="button" className={button} disabled={hardwareBusy} onClick={refreshHardware}><RefreshCw size={13}/> Recheck</button>
      </div>
      {capabilities && <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900"><div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><Cpu size={13}/> CPU</div><div className="mt-2 text-lg font-black">{machine.logical_cpu_count || "—"} cores</div><p className="mt-1 truncate text-[10px] text-slate-500">{machine.cpu_model || machine.architecture || "Processor details unavailable"}</p></div>
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900"><div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><HardDrive size={13}/> SYSTEM MEMORY</div><div className="mt-2 text-lg font-black">{machine.ram_total_gib ? `${machine.ram_total_gib} GiB` : "—"}</div><p className="mt-1 text-[10px] text-slate-500">{machine.ram_available_gib != null ? `${machine.ram_available_gib} GiB currently available` : "Installed physical RAM"}</p></div>
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900"><div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><HardDrive size={13}/> FREE STORAGE</div><div className="mt-2 text-lg font-black">{machine.disk_free_gib ? `${machine.disk_free_gib} GiB` : "—"}</div><p className="mt-1 text-[10px] text-slate-500">Available for projects and outputs</p></div>
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900"><div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><Monitor size={13}/> GPU</div><div className="mt-2 truncate text-sm font-black">{gpu?.name || "No supported CUDA GPU detected"}</div><p className="mt-1 text-[10px] text-slate-500">{gpu ? `${formatBytes(gpu.memory_total_bytes)} total · ${formatBytes(gpu.memory_free_bytes)} free` : "2D and CPU-based workflows may still run"}</p></div>
      </div>}
      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(220px,.65fr)_minmax(0,1.35fr)]">
        <div><label className="block text-[10px] font-bold text-slate-500">WORKLOAD TO CHECK<select className={field} value={workloadProfile} onChange={async(e)=>{const next=e.target.value;setWorkloadProfile(next);setHardwareBusy(true);try{if(token){const result=await request("/requirements/check",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({profile:next})});setPreflight(result);}await requestManagedPlan(capabilities,next,shareHardwareMetrics&&Boolean(capabilities));}catch(error){setStatus(error.message);}finally{setHardwareBusy(false);}}}>
          <option value="editor_2d">2D / lightweight games</option><option value="procedural_3d">Procedural 3D production</option><option value="movie_processing">Movie processing</option><option value="image_to_3d">AI image-to-3D (CUDA)</option><option value="android_export">Android build & device testing</option>
        </select></label>
          {preflight && <div className={`mt-3 rounded-lg p-3 text-[11px] ${preflight.ready?"bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200":"bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}><strong>{preflight.ready?"This PC passes its optional local preflight":"This PC is not eligible for this workload locally"}</strong><p className="mt-1 leading-5">{preflight.ready?"NEXORA can use this PC when you choose local placement.":"Local requirements are advisory only. NEXORA checks the managed server separately and can recommend it when the server toolchain and capacity pass."}</p></div>}
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500">OPTIONAL LOCAL DEVICE TOOLS · NOT REQUIRED ON THE SERVER</div>
          <div className="mt-2 flex flex-wrap gap-2">{toolLabels.map(([key,label])=><span key={key} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${tools[key]?.available?"bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200":"bg-slate-100 text-slate-500 dark:bg-slate-900"}`}>{tools[key]?.available?<CheckCircle2 size={11}/>:<XCircle size={11}/>} {label}</span>)}</div>
          {preflight && <div className="mt-3 space-y-1.5">{preflight.checks.map((item)=><div key={item.name} className="flex items-start gap-2 text-[10px]"><span className={item.status==="pass"?"text-emerald-600":item.status==="fail"?"text-rose-500":"text-amber-500"}>{item.status==="pass"?<CheckCircle2 size={12}/>:<AlertTriangle size={12}/>}</span><span className="text-slate-500"><strong className="text-slate-700 dark:text-slate-300">{item.name}:</strong> {item.detail}</span></div>)}</div>}
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-cyan-900/60 bg-[#081820] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h4 className="flex items-center gap-2 text-xs font-black text-cyan-200"><Server size={14}/> MANAGED SERVER TOOLCHAIN</h4><p className="mt-1 text-[10px] text-slate-400">Blender, Godot 4, FFmpeg/FFprobe, Java and Android SDK/ADB are preinstalled on NEXORA's private worker. Your PC does not need those tools for a managed-server workload.</p></div>
          <button type="button" className={button} disabled={managedBusy || !accountAccessToken} onClick={refreshManagedCapabilities}><RefreshCw size={12}/>{managedBusy ? "Checking…" : "Recheck server"}</button>
        </div>
        {managedCapabilities && <div className="mt-3 flex flex-wrap gap-2">
          {[[ "blender","Blender" ],[ "godot","Godot 4" ],[ "ffmpeg","FFmpeg" ],[ "ffprobe","FFprobe" ],[ "java","Java" ],[ "adb","ADB" ],[ "android_sdk","Android SDK" ],[ "android_apk_inspector","APK Inspector" ]].map(([key,label])=><span key={key} className={"inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold "+(managedCapabilities.toolchain?.[key]?"bg-emerald-950/40 text-emerald-200":"bg-slate-900 text-slate-500")}>{managedCapabilities.toolchain?.[key]?<CheckCircle2 size={11}/>:<XCircle size={11}/>} {label}</span>)}
        </div>}
        {!managedCapabilities && <p className="mt-2 text-[10px] text-amber-300">{managedError || "Sign in to check whether the managed worker has been provisioned."}</p>}
        {managedCapabilities && <p className={"mt-2 text-[10px] "+(managedCapabilities.toolchain_ready?"text-emerald-300":"text-amber-300")}>{managedCapabilities.toolchain_ready?"Managed server toolchain is installed and responding.":"Managed worker is reachable, but one or more tools are not ready."}</p>}
        {managedCapabilities && <p className={"mt-1 text-[10px] "+(managedCapabilities.workspace_storage?.ready?"text-emerald-300":"text-amber-300")}>{managedCapabilities.workspace_storage?.ready?"Persistent server workspace volume is mounted and writable.":managedCapabilities.workspace_storage?.note || "Persistent server workspace storage has not been verified."}</p>}
        <label className="mt-3 flex items-start gap-2 text-[10px] leading-5 text-slate-300">
          <input type="checkbox" className="mt-1" checked={shareHardwareMetrics} onChange={(event)=>void setHardwareMetricsConsent(event.target.checked)} disabled={!accountAccessToken}/>
          <span>Allow NEXORA to share an anonymous resource summary (CPU load/headroom, RAM available, free disk, tool availability and GPU memory) with the signed-in control plane to recommend local or managed-server placement. No file paths, device IDs, project files or source media are included.</span>
        </label>
        {managedError && <p className="mt-2 text-[10px] text-amber-300">{managedError}</p>}
        {managedPlan && <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-[10px] leading-5">
          <strong className="text-cyan-200">PLACEMENT RECOMMENDATION: {String(managedPlan.execution_location || "unknown").replaceAll("_"," ").toUpperCase()}</strong>
          <p className="mt-1 text-slate-300">{managedPlan.reason}</p>
          <p className="mt-1 text-slate-400">Local metrics: {managedPlan.local_metrics_shared ? "shared with consent" : "not shared; local capacity treated as unknown"}.</p>
          {managedPlan.execution_location==="managed_server" && <p className="mt-1 text-amber-300">The server passes this workload's toolchain/capacity preflight. Remote project transfer and job execution are not enabled yet, so no project files have been uploaded and no remote job has started.</p>}
          {managedPlan.execution_location==="creator_device" && <p className="mt-1 text-emerald-300">This PC has enough measured headroom and the required local tools. Eligible work can stay local.</p>}
          {managedPlan.execution_location==="unavailable" && <p className="mt-1 text-amber-300">Neither environment has a verified safe profile. Choose a lighter workload or provision more capacity.</p>}
        </div>}
        <p className="mt-2 text-[9px] text-slate-500">The server provides Android SDK build tools. Physical phone install/logcat still requires the optional paired bridge. Placement is a preflight recommendation until secure remote project transfer and queue execution are enabled.</p>
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
