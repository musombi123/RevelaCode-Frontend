import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { AdMob, AdmobConsentStatus } from "@capacitor-community/admob";
import { BookOpen, Film, Gamepad2, Layers3, LockKeyhole, CheckCircle2, CreditCard, Plus, Trash2, RefreshCw, Play, UploadCloud, Gift } from "lucide-react";

const makeEpisode = (number) => ({
  id: `episode-${number}`,
  title: `Episode ${number}`,
  synopsis: "",
  location: "",
  player_goal: "",
  events: [],
  enemy_count: 2,
  vehicle_count: 0,
  estimated_minutes: 10,
});

const API_BASE = String(import.meta.env.VITE_NEXORA_API_URL || "https://nexora-foundry-api.onrender.com").replace(/\/$/, "");
const REWARDED_AD_UNIT_ID = String(import.meta.env.VITE_ADMOB_NEXORA_REWARDED_AD_UNIT_ID || "").trim();
const REWARDED_TOOL_IDS = ["environment", "actors_props"];

const DEFAULT_WORKFLOW = {
  schema_version: "1.0", mode: "story", plan: "basic",
  target_class: "mobile", platform: "android", title: "Untitled Game",
  genre: "science-fiction", world_pack: "sci_fi_survival",
  world_scale: "small", visual_style: "cinematic stylized realism",
  player_source: "default", enemies: 2, vehicles: 0,
  environment_variants: 1, episodes: [makeEpisode(1)], synopsis: "",
  copyright_declaration: "original", has_adaptation_rights: false,
  has_music_rights: false, has_performer_consents: false, avoids_performer_likeness: false,
};
const PLATFORMS = {
  basic: ["android", "web"], standard: ["android", "web"],
  pro: ["windows", "linux", "web"], studio: ["windows", "linux", "web"],
};
const money = (value) => Number.isFinite(Number(value)) ? `KES ${Number(value).toLocaleString("en-KE")}` : "Price not configured";

export default function CreatorFlowPanel({ activeProject, apiRequest, cloudProjectActive, setNotice, nexoraAuthFetch }) {
  const [workflow, setWorkflow] = useState(DEFAULT_WORKFLOW);
  const [plans, setPlans] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [packs, setPacks] = useState([]);
  const [entitlement, setEntitlement] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [payment, setPayment] = useState(null);
  const [payerPhone, setPayerPhone] = useState("");
  const [receipt, setReceipt] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [busy, setBusy] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [error, setError] = useState("");
  const [rewardState, setRewardState] = useState({ enabled:false, platform:"android", balances:{environment:0,actors_props:0}, tools:[] });
  const [rewardNotice, setRewardNotice] = useState("");
  const [rewardBusy, setRewardBusy] = useState("");

  const projectId = activeProject?.id;
  const planRank = { basic: 0, standard: 1, pro: 2, studio: 3 };
  const entitlementCurrent = entitlement?.status === "active" && (!entitlement.expires_at || new Date(entitlement.expires_at).getTime() > Date.now());
  const selectedPlanCovered = Boolean(entitlementCurrent && planRank[entitlement?.plan] >= planRank[workflow.plan]);
  const canGenerate = cloudProjectActive && selectedPlanCovered;
  const needsCheckout = !selectedPlanCovered;
  const workflowPlan = plans.find((item) => item.id === workflow.plan);
  const workload = useMemo(() => {
    const episodeUnits = workflow.episodes.length * 2;
    const size = { small: 2, medium: 5, large: 10 }[workflow.world_scale] || 2;
    const events = workflow.episodes.reduce((sum, episode) => sum + Math.max(1, episode.events?.length || 0), 0);
    const units = episodeUnits + size * workflow.environment_variants + workflow.enemies + workflow.vehicles * 2 + events;
    return { units, events };
  }, [workflow]);

  const refreshRewards = useCallback(async () => {
    try {
      const result = await apiRequest("/api/v1/creator-flow/rewards");
      setRewardState(result || { enabled:false, balances:{environment:0,actors_props:0} });
      return result;
    } catch {
      setRewardState({ enabled:false, balances:{environment:0,actors_props:0} });
      return null;
    }
  }, [apiRequest]);

  const refreshPipeline = useCallback(async () => {
    if (!projectId || !cloudProjectActive) return;
    try {
      const [result, workflowResult] = await Promise.all([
        apiRequest(`/api/v1/workspace/projects/${projectId}/movie-pipeline`).catch(() => null),
        apiRequest(`/api/v1/workspace/projects/${projectId}/creator-workflow`).catch(() => null),
      ]);
      if (result?.pipeline) setPipeline(result.pipeline);
      if (result?.stages) setPipeline(result);
      if (workflowResult?.workflow) setWorkflow(workflowResult.workflow);
      if (workflowResult?.entitlement) setEntitlement(workflowResult.entitlement);
      try { const report = await apiRequest(`/api/v1/workspace/projects/${projectId}/video-analysis`); setAnalysis(report); } catch { setAnalysis(null); }
      await refreshRewards();
    } catch (e) { setError(e.message); }
  }, [projectId, cloudProjectActive, apiRequest, refreshRewards]);

  useEffect(() => {
    setWorkflow(DEFAULT_WORKFLOW);
    setPipeline(null);
    setPayment(null);
    setPaymentStatus("");
    setReceipt("");
    setAnalysis(null);
    setError("");
  }, [projectId]);

  useEffect(() => {
    let live = true;
    setCatalogLoading(true);
    apiRequest("/api/v1/creator-flow/plans")
      .then((planData) => {
        if (!live) return;
        setPlans(Array.isArray(planData.plans) ? planData.plans : []);
        setPaymentConfig(planData.payment || null);
        setEntitlement(planData.active_entitlement || null);
      })
      .catch((e) => { if (live) setError(e.message || "Could not load NEXORA plans."); })
      .finally(() => { if (live) setCatalogLoading(false); });
    apiRequest("/api/v1/creator-flow/packs")
      .then((packData) => { if (live) setPacks(packData.packs || []); })
      .catch((e) => { if (live) setError(e.message || "Could not load NEXORA template packs."); });
    apiRequest("/api/v1/workspace/assets/conversion-capabilities")
      .then((conversionData) => { if (live) setCapabilities(conversionData); })
      .catch(() => { if (live) setCapabilities(null); });
    return () => { live = false; };
  }, [apiRequest]);

  useEffect(() => {
    if (cloudProjectActive) refreshPipeline();
  }, [cloudProjectActive, projectId, refreshPipeline]);

  useEffect(() => {
    refreshRewards();
  }, [refreshRewards, entitlement?.plan, entitlement?.status]);


  useEffect(() => {
    if (!cloudProjectActive || !pipeline?.stages?.length) return undefined;
    const timer = window.setInterval(refreshPipeline, 5000);
    return () => window.clearInterval(timer);
  }, [cloudProjectActive, pipeline?.stages?.length, refreshPipeline]);

  const run = async (key, fn, success, options = {}) => {
    if (options.requiresProject !== false && (!cloudProjectActive || !activeProject)) {
      setError("Save or open a NEXORA cloud project before running this operation.");
      return;
    }
    setBusy(key); setError("");
    try { const result = await fn(); if (success) success(result); setNotice?.(result?.message || `${key} completed.`); return result; }
    catch (e) { setError(e.message || "Creator Flow operation failed."); setNotice?.(e.message || "Creator Flow operation failed."); }
    finally { setBusy(""); }
  };

  const update = (patch) => setWorkflow((old) => ({ ...old, ...patch }));
  const setPlan = (plan) => {
    const targetClass = ["basic", "standard"].includes(plan) ? "mobile" : "pc";
    const platform = PLATFORMS[plan]?.includes(workflow.platform) ? workflow.platform : (targetClass === "mobile" ? "android" : "windows");
    update({ plan, target_class: targetClass, platform,
      world_scale: plan === "basic" ? "small" : plan === "standard" ? "medium" : "large" });
  };
  const saveDocument = () => run("save-flow", () => apiRequest(`/api/v1/workspace/projects/${projectId}/creator-workflow`, {
    method: "PUT", body: JSON.stringify(workflow),
  }), (data) => { if (data.entitlement) setEntitlement(data.entitlement); setWorkflow(data.workflow); });
  const createPipeline = () => run("create-pipeline", () => apiRequest(`/api/v1/workspace/projects/${projectId}/creator-workflow/pipeline`, { method: "POST", body: "{}" }), (data) => { setPipeline(data.pipeline); });
  const buildStage = (stage, path) => run(stage, async () => {
    const result = await apiRequest(`/api/v1/workspace/projects/${projectId}/creator-workflow/${path}`, { method: "POST", body: "{}" });
    await refreshRewards();
    return result;
  }, refreshPipeline);
  const approveStage = (stage) => run(`approve-${stage}`, () => apiRequest(`/api/v1/workspace/projects/${projectId}/movie-pipeline/stages/${stage}/approve`, {
    method: "POST", body: JSON.stringify({ note: "Creator reviewed the generated output in NEXORA Creator Flow." }),
  }), refreshPipeline);

  const watchRewardedToolAd = async (toolId) => {
    const toolName = toolId === "environment" ? "Blender environment generation" : "enemies and vehicles generation";
    if (Capacitor.getPlatform() !== "android") {
      setRewardNotice("Rewarded tool ads are available in the RevelaCode Android app, not a desktop browser.");
      return;
    }
    if (!REWARDED_AD_UNIT_ID) {
      setRewardNotice("The NEXORA rewarded AdMob unit ID has not been configured in the Android build yet.");
      return;
    }
    if (rewardBusy) return;
    setRewardBusy(toolId);
    setRewardNotice("");
    try {
      const intent = await apiRequest("/api/v1/creator-flow/rewards/intents", {
        method:"POST",
        body:JSON.stringify({tool_id:toolId}),
      });
      let consent = await AdMob.requestConsentInfo();
      if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) {
        consent = await AdMob.showConsentForm();
      }
      if (!consent.canRequestAds) throw new Error("Ad consent is not ready. Review the consent choices before requesting a rewarded video.");
      await AdMob.initialize();
      await AdMob.prepareRewardVideoAd({
        adId: REWARDED_AD_UNIT_ID,
        ssv: { userId: String(intent.user_id), customData: String(intent.custom_data) },
      });
      const earned = await AdMob.showRewardVideoAd();
      if (Number(earned?.amount || 0) < 1 || earned?.type !== intent.reward_item) throw new Error("The ad provider did not report the configured reward. No tool credit was granted.");
      let latest = null;
      for (let attempt=0; attempt<30; attempt+=1) {
        latest = await apiRequest(`/api/v1/creator-flow/rewards/intents/${encodeURIComponent(intent.intent_id)}`);
        if (latest.status === "credited") break;
        if (latest.status === "expired" || latest.status === "rejected") break;
        await new Promise((resolve)=>window.setTimeout(resolve,1500));
      }
      await refreshRewards();
      if (latest?.status === "credited") {
        setRewardNotice(`Verified. One use of ${toolName} is now available.`);
      } else {
        setRewardNotice("The video reward was reported by the app, but Google's signed verification has not arrived yet. Refresh credits in a moment; production remains locked until verification completes.");
      }
    } catch (e) {
      setRewardNotice(e.message || "Rewarded ad could not be completed.");
    } finally {
      setRewardBusy("");
    }
  };

  const createCheckout = () => run("checkout", async () => {
    const result = await apiRequest("/api/v1/creator-flow/checkout", {
      method: "POST", body: JSON.stringify({ plan: workflow.plan, project_id: projectId, payer_phone: payerPhone }),
    });
    setPayment(result); setReceipt(""); setPaymentStatus("pending"); return result;
  }, null, { requiresProject: false });

  const submitReceipt = () => run("claim-payment", async () => {
    const result = await apiRequest(`/api/v1/creator-flow/payments/${payment.payment_id}/claim`, {
      method: "POST", body: JSON.stringify({ mpesa_receipt: receipt.trim(), paid_amount_kes: payment.amount_kes, payer_phone: payerPhone }),
    });
    setPaymentStatus(result.status); return result;
  }, null, { requiresProject: false });

  const checkPayment = () => run("check-payment", async () => {
    const result = await apiRequest(`/api/v1/creator-flow/payments/${payment.payment_id}`);
    setPaymentStatus(result.status);
    if (result.status === "verified") await refreshPipeline();
    return { message: result.status === "verified" ? "Payment verified. Your Creator Flow plan is active." : "Receipt is still awaiting merchant reconciliation." };
  }, null, { requiresProject: false });

  const uploadMovie = (file) => run("video-intake", async () => {
    if (!workflow.has_adaptation_rights && workflow.copyright_declaration !== "public_domain") throw new Error("Declare adaptation permission or confirm the source is genuinely public domain before uploading a film.");
    if (!workflow.has_performer_consents && !workflow.avoids_performer_likeness) throw new Error("Confirm performer/likeness permissions, or choose not to reproduce identifiable performers.");
    const form = new FormData();
    form.append("file", file);
    form.append("has_video_rights", "true");
    form.append("accepts_original_assets_only", "true");
    const result = await apiRequest(`/api/v1/workspace/projects/${projectId}/video-intake`, { method: "POST", body: form });
    setPipeline(result.pipeline);
    return { message: `Movie accepted for analysis. Job ${result.id || result.job_id} is running; inspect the result before approval.` };
  }, refreshPipeline);

  const addEpisode = () => update({ episodes: [...workflow.episodes, { ...makeEpisode(workflow.episodes.length + 1), id: "episode-" + Date.now() }] });
  const removeEpisode = (id) => update({ episodes: workflow.episodes.length > 1 ? workflow.episodes.filter((item) => item.id !== id) : workflow.episodes });

  const stageRows = [
    ["analysis", "Movie scene analysis", null],
    ["player", "Default / player avatar", "player/build"],
    ["environment", "3D environments & navigation", "environment/build"],
    ["actors_props", "Enemies, vehicles & props", "actors-props/build"],
    ["audio", "Original sound effects & music", "audio/build"],
    ["gameplay", "Episode missions & game logic", "gameplay/compile"],
    ["assembly", "Godot playable project", "assembly/build"],
  ];
  const stages = pipeline?.stages || [];
  const stageRecord = (id) => stages.find((item) => item.stage === id);
  const downloadAssembledGame = () => run("download-game", async () => {
    const fetcher = typeof nexoraAuthFetch === "function" ? nexoraAuthFetch : fetch;
    const response = await fetcher(`${API_BASE}/api/projects/${projectId}/movie-pipeline/assembly/download`, {
      headers: { Accept: "application/zip" }, cache: "no-store",
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.detail || `Game package download failed (HTTP ${response.status}).`);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nexora-game.zip";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    return { message: "Playable Godot project package downloaded." };
  });

  const stageAction = (id, path) => {
    const record = stageRecord(id);
    if (!record) return null;
    if (record.state === "REVIEW") return <button type="button" disabled={Boolean(busy)} onClick={() => approveStage(id)} className="border border-emerald-700 px-2 py-1 text-[9px] font-bold text-emerald-200">APPROVE REVIEW</button>;
    const needsAdCredit = entitlement?.plan === "basic" && entitlementCurrent && REWARDED_TOOL_IDS.includes(id);
    const hasAdCredit = Number(rewardState?.balances?.[id] || 0) > 0;
    if (record.state === "READY" && path) return <button type="button" disabled={Boolean(busy) || !canGenerate || (needsAdCredit && !hasAdCredit)} onClick={() => buildStage(id, path)} className="border border-cyan-800 px-2 py-1 text-[9px] font-bold text-cyan-100 disabled:opacity-40">{needsAdCredit ? (hasAdCredit ? "BUILD · 1 AD CREDIT" : "NEED AD CREDIT") : "BUILD"}</button>;
    return null;
  };

  return (
    <section className="border border-violet-800/60 bg-[#0b1118] text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-900/50 bg-[#0e1420] px-3 py-3">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center border border-violet-500/60 bg-violet-950/40 text-violet-200"><BookOpen size={22}/></div><div><h2 className="text-sm font-black tracking-[.16em] text-violet-200">NEXORA CREATOR FLOW</h2><p className="text-[9px] text-slate-400">DOCUMENT-DRIVEN GAME PRODUCTION · EPISODE BY EPISODE</p></div></div>
        <div className="flex items-center gap-2"><span className={"border px-2 py-1 text-[9px] font-bold "+(canGenerate?"border-emerald-700 text-emerald-200":"border-amber-700 text-amber-200")}>{canGenerate?`${entitlement.plan.toUpperCase()} ACTIVE`:"PLAN LOCKED"}</span><button type="button" onClick={() => setExpanded((value) => !value)} className="border border-slate-700 px-3 py-1.5 text-[10px]">{expanded?"COLLAPSE":"OPEN CREATOR FLOW"}</button></div>
      </header>
      {expanded && <div className="space-y-3 p-3">
        <section className="border border-violet-800/60 bg-[#0d1420] p-3">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-black tracking-wider text-violet-200">NEXORA CREATOR PLANS</h3>
              <p className="mt-1 text-[10px] text-slate-400">Choose a production tier. Limits are enforced by the NEXORA API when you save and generate.</p>
            </div>
            <span className="border border-slate-700 px-2 py-1 text-[9px] text-slate-400">{entitlementCurrent ? `${entitlement.plan.toUpperCase()} ACTIVE` : "NO ACTIVE PLAN"}</span>
          </div>
          {catalogLoading && <p className="py-4 text-center text-xs text-slate-400">Loading available plans…</p>}
          {!catalogLoading && plans.length === 0 && <div className="border border-amber-800/50 bg-amber-950/15 p-3 text-xs text-amber-100">NEXORA could not retrieve the plan catalogue. {error || "Check the NEXORA service connection and retry."}</div>}
          {!catalogLoading && plans.length > 0 && <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => {
              const selected = workflow.plan === plan.id;
              const active = entitlementCurrent && entitlement?.plan === plan.id;
              return <article key={plan.id} className={"flex min-w-0 flex-col border p-3 transition " + (selected ? "border-violet-400 bg-violet-950/25" : "border-slate-700 bg-[#080d12]")}>
                <div className="flex items-start justify-between gap-2">
                  <div><h4 className="text-sm font-black text-white">{plan.name}</h4><p className="mt-0.5 text-[9px] uppercase tracking-wider text-cyan-200">{plan.target_class === "mobile" ? "Mobile production" : "PC production"}</p></div>
                  {active && <span className="border border-emerald-700 px-1.5 py-0.5 text-[8px] font-bold text-emerald-200">ACTIVE</span>}
                </div>
                <div className="mt-3 text-xl font-black text-amber-200">{plan.price_configured ? money(plan.price_kes) : "Price pending"}</div>
                <div className="mt-1 text-[10px] text-slate-300">{(Number(plan.video_limit_seconds) || 0) >= 60 ? `${Number(plan.video_limit_seconds) / 60} min` : `${Number(plan.video_limit_seconds) || 0} sec`} maximum movie clip</div>
                <div className="my-3 h-px bg-slate-800"/>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
                  <div><dt className="text-slate-500">Episodes</dt><dd className="font-bold text-slate-200">Up to {plan.max_episodes}</dd></div>
                  <div><dt className="text-slate-500">Enemies</dt><dd className="font-bold text-slate-200">Up to {plan.max_enemies}</dd></div>
                  <div><dt className="text-slate-500">Vehicles</dt><dd className="font-bold text-slate-200">Up to {plan.max_vehicles}</dd></div>
                  <div><dt className="text-slate-500">Workload</dt><dd className="font-bold text-slate-200">{plan.max_workload_units} units</dd></div>
                </dl>
                <p className="mt-3 min-h-8 text-[9px] text-slate-500">Exports: {(plan.allowed_platforms || []).map((item) => item.toUpperCase()).join(" · ") || "Not specified"}</p>
                <button type="button" aria-pressed={selected} onClick={() => setPlan(plan.id)} className={"mt-auto w-full border px-3 py-2 text-[10px] font-black " + (selected ? "border-violet-400 bg-violet-900/40 text-violet-100" : "border-cyan-800 text-cyan-100 hover:bg-cyan-950/40")}>{selected ? "SELECTED PLAN" : "SELECT PLAN"}</button>
              </article>;
            })}
          </div>}
          {!catalogLoading && plans.length > 0 && plans.some((plan) => !plan.price_configured) && <p className="mt-3 text-[9px] text-amber-200">Some plan prices have not been configured yet. Selection is available, but checkout stays locked until the approved KES prices are set on the NEXORA API.</p>}
        </section>
        <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          {!cloudProjectActive && <div className="border border-amber-700/60 bg-amber-950/20 p-3 text-xs text-amber-100">Save or open your NEXORA cloud project before using paid Creator Flow tools.</div>}
          {error && <div role="alert" className="border border-rose-800/60 bg-rose-950/20 p-2 text-xs text-rose-200">{error}</div>}
          <div className="grid gap-2 md:grid-cols-2">
            <label className="text-[10px] text-slate-400">PROJECT MODE<select value={workflow.mode} onChange={(e)=>update({mode:e.target.value})} className="mt-1 w-full border border-slate-700 bg-[#080d12] p-2 text-xs text-white"><option value="story">Original story / document</option><option value="movie">Movie-to-game adaptation</option></select></label>
            <label className="text-[10px] text-slate-400">GAME TITLE<input value={workflow.title} onChange={(e)=>update({title:e.target.value})} className="mt-1 w-full border border-slate-700 bg-[#080d12] p-2 text-xs text-white"/></label>
            <label className="text-[10px] text-slate-400">GENRE<select value={workflow.genre} onChange={(e)=>update({genre:e.target.value})} className="mt-1 w-full border border-slate-700 bg-[#080d12] p-2 text-xs text-white">{["science-fiction","fantasy","modern","survival","adventure"].map((x)=><option key={x}>{x}</option>)}</select></label>
            <label className="text-[10px] text-slate-400">DEFAULT WORLD PACK<select value={workflow.world_pack} onChange={(e)=>update({world_pack:e.target.value})} className="mt-1 w-full border border-slate-700 bg-[#080d12] p-2 text-xs text-white">{packs.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          </div>
          <label className="block text-[10px] text-slate-400">GAME WORLD / STORY PREMISE<textarea value={workflow.synopsis} onChange={(e)=>update({synopsis:e.target.value})} rows={3} placeholder="Describe the world, atmosphere, conflict, locations and how the player should experience it…" className="mt-1 w-full border border-slate-700 bg-[#080d12] p-2 text-xs text-white"/></label>
          <div className="border border-slate-800 bg-[#0d141c] p-3">
            <div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-xs font-black text-violet-200">EPISODE FLOW / GAME DESIGN DOCUMENT</h3><button type="button" onClick={addEpisode} disabled={workflow.episodes.length>=12} className="border border-violet-700 px-2 py-1 text-[9px] text-violet-200 disabled:opacity-40"><Plus size={12} className="mr-1 inline"/> ADD EPISODE</button></div>
            {workflow.episodes.map((episode,index)=><div key={episode.id} className="mb-2 border border-slate-800 bg-[#080d12] p-2">
              <div className="flex items-center justify-between gap-2"><b className="text-[10px] text-cyan-200">EPISODE {index+1}</b><button type="button" onClick={()=>removeEpisode(episode.id)} disabled={workflow.episodes.length===1} aria-label="Remove episode" className="text-rose-300 disabled:opacity-30"><Trash2 size={14}/></button></div>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <input value={episode.title} onChange={e=>update({episodes:workflow.episodes.map((x)=>x.id===episode.id?{...x,title:e.target.value}:x)})} placeholder="Episode title" className="border border-slate-700 bg-[#101820] p-2 text-xs text-white"/>
                <input value={episode.location} onChange={e=>update({episodes:workflow.episodes.map((x)=>x.id===episode.id?{...x,location:e.target.value}:x)})} placeholder="Environment / location" className="border border-slate-700 bg-[#101820] p-2 text-xs text-white"/>
                <input value={episode.player_goal} onChange={e=>update({episodes:workflow.episodes.map((x)=>x.id===episode.id?{...x,player_goal:e.target.value}:x)})} placeholder="Player goal / objective" className="border border-slate-700 bg-[#101820] p-2 text-xs text-white"/>
                <input value={episode.synopsis} onChange={e=>update({episodes:workflow.episodes.map((x)=>x.id===episode.id?{...x,synopsis:e.target.value}:x)})} placeholder="What happens in this episode?" className="border border-slate-700 bg-[#101820] p-2 text-xs text-white"/>
                <input value={(episode.events||[]).join(", ")} onChange={e=>update({episodes:workflow.episodes.map((x)=>x.id===episode.id?{...x,events:e.target.value.split(",").map(y=>y.trim()).filter(Boolean).slice(0,12)}:x)})} placeholder="Gameplay beats, comma separated" className="border border-slate-700 bg-[#101820] p-2 text-xs text-white md:col-span-2"/>
              </div>
            </div>)}
          </div>
          <div className="border border-slate-800 p-3">
            <h3 className="mb-2 text-xs font-black text-cyan-200">DEFAULT ASSET LOADOUT</h3>
            <div className="grid gap-2 md:grid-cols-3">
              <label className="text-[10px] text-slate-400">WORLD SCALE<select value={workflow.world_scale} onChange={e=>update({world_scale:e.target.value})} className="mt-1 w-full border border-slate-700 bg-[#080d12] p-2 text-xs text-white">{["small","medium","large"].map(x=><option key={x}>{x}</option>)}</select></label>
              <label className="text-[10px] text-slate-400">ENEMIES<input type="number" min="0" max="24" value={workflow.enemies} onChange={e=>update({enemies:Number(e.target.value)})} className="mt-1 w-full border border-slate-700 bg-[#080d12] p-2 text-xs text-white"/></label>
              <label className="text-[10px] text-slate-400">VEHICLES<input type="number" min="0" max="8" value={workflow.vehicles} onChange={e=>update({vehicles:Number(e.target.value)})} className="mt-1 w-full border border-slate-700 bg-[#080d12] p-2 text-xs text-white"/></label>
              <label className="text-[10px] text-slate-400">ENVIRONMENT VARIANTS<input type="number" min="1" max="8" value={workflow.environment_variants} onChange={e=>update({environment_variants:Number(e.target.value)})} className="mt-1 w-full border border-slate-700 bg-[#080d12] p-2 text-xs text-white"/></label>
              <label className="text-[10px] text-slate-400">VISUAL STYLE<input value={workflow.visual_style} onChange={e=>update({visual_style:e.target.value})} className="mt-1 w-full border border-slate-700 bg-[#080d12] p-2 text-xs text-white"/></label>
              <div className="flex items-end text-[10px] text-slate-400">Estimated workload <b className="ml-2 text-cyan-200">{workload.units} units</b></div>
            </div>
          </div>
          {workflow.mode==="movie" && <div className="border border-amber-800/60 bg-amber-950/15 p-3">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-black text-amber-200"><Film size={15}/> ADAPTATION RIGHTS CHECK</h3>
            <p className="mb-2 text-[10px] leading-5 text-slate-300">NEXORA cannot determine copyright ownership by analysing a video. Only upload a movie you own, have licensed, or have permission to adapt. Protected dialogue, music, character designs and frames are not copied into the game; the assets created are original.</p>
            {[
              ["has_adaptation_rights","I own or have a valid licence / permission to adapt this movie."],
              ["has_performer_consents","Required performer / likeness consents are in place for any approved likeness use."],
              ["has_music_rights","I understand original game music and effects are generated; the movie soundtrack is not reused."],
            ].map(([key,label]) => <label key={key} className="mt-2 flex items-start gap-2 text-[10px] text-slate-200"><input type="checkbox" checked={Boolean(workflow[key])} onChange={e=>update({[key]:e.target.checked})} className="mt-0.5"/><span>{label}</span></label>)}
            <label className="mt-2 flex items-start gap-2 text-[10px] text-slate-200"><input type="checkbox" checked={Boolean(workflow.avoids_performer_likeness)} onChange={e=>update({avoids_performer_likeness:e.target.checked,has_performer_consents:e.target.checked?false:workflow.has_performer_consents})} className="mt-0.5"/><span>Do not reproduce identifiable real performers or their likenesses; use original generic player and NPC designs.</span></label>
            <label className="mt-3 block text-[10px] text-slate-400">COPYRIGHT STATUS<select value={workflow.copyright_declaration} onChange={e=>update({copyright_declaration:e.target.value})} className="mt-1 w-full border border-slate-700 bg-[#080d12] p-2 text-xs text-white"><option value="original">Original / owned</option><option value="licensed">Licensed adaptation</option><option value="public_domain">Public domain</option></select></label>
            <p className="mt-2 text-[10px] text-amber-100">Movie upload is enabled only after the rights declaration, a paid plan and a supported clip duration have been checked.</p>
          </div>}
          <div className="flex flex-wrap gap-2"><button type="button" onClick={saveDocument} disabled={Boolean(busy)||!cloudProjectActive} className="border border-cyan-700 bg-cyan-950/40 px-3 py-2 text-[10px] font-black text-cyan-100 disabled:opacity-40">SAVE GAME DESIGN DOCUMENT</button><button type="button" onClick={createPipeline} disabled={Boolean(busy)||!cloudProjectActive||!canGenerate} className="border border-violet-600 bg-violet-950/40 px-3 py-2 text-[10px] font-black text-violet-100 disabled:opacity-40">CREATE PRODUCTION PIPELINE</button><button type="button" onClick={refreshPipeline} disabled={Boolean(busy)} className="border border-slate-700 px-3 py-2 text-[10px]"><RefreshCw size={12} className="mr-1 inline"/> REFRESH STAGES</button></div>
          {workflow.mode==="movie" && pipeline?.stages?.length > 0 && <div className="border border-slate-800 p-3"><div className="mb-2 text-xs font-black text-amber-200">MOVIE SOURCE INTAKE</div><label className="flex cursor-pointer items-center gap-2 border border-dashed border-amber-800 p-3 text-xs text-amber-100"><UploadCloud size={18}/> SELECT CLIP · PLAN DURATION IS ENFORCED<input type="file" accept=".mp4,.mov,.mkv,.webm,.avi,video/*" className="hidden" onChange={e=>{const file=e.target.files?.[0];e.target.value="";if(file)uploadMovie(file);}}/></label>{analysis&&<div className="mt-2 text-[10px] text-slate-300">Analysis: {analysis.scene_detection?.scenes?.length||0} scenes · {analysis.keyframes?.length||0} keyframes · review before approving</div>}</div>}
          {pipeline && <div className="border border-slate-800 p-3"><div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-black text-cyan-200">PRODUCTION STAGES</h3><span className="text-[9px] text-slate-500">{stages.filter((x)=>x.state==="APPROVED").length}/{stages.length} approved</span></div><div className="space-y-1">{stageRows.map(([id,label,path])=>{const rec=stageRecord(id);if(!rec)return null;return <div key={id} className="flex flex-wrap items-center justify-between gap-2 border border-slate-800 bg-[#080d12] p-2"><div className="min-w-0 flex-1"><div className="text-[10px] font-bold text-white">{label}</div><div className="text-[9px] text-slate-500">{rec.summary}</div>{rec.error&&<div className="text-[9px] text-rose-300">{rec.error}</div>}</div><span className={"text-[9px] font-bold "+(rec.state==="APPROVED"?"text-emerald-300":rec.state==="FAILED"?"text-rose-300":rec.state==="REVIEW"?"text-amber-200":"text-slate-400")}>{rec.state}</span>{id==="analysis"&&rec.state==="REVIEW"&&<button type="button" disabled={Boolean(busy)} onClick={()=>approveStage("analysis")} className="border border-emerald-700 px-2 py-1 text-[9px] text-emerald-200">APPROVE SCENE ANALYSIS</button>}{stageAction(id,path)}</div>})}</div>{stageRecord("assembly")?.state==="APPROVED"||stageRecord("assembly")?.state==="REVIEW"?<button type="button" onClick={downloadAssembledGame} disabled={Boolean(busy)} className="mt-3 inline-block border border-emerald-700 px-3 py-2 text-[10px] font-bold text-emerald-200 disabled:opacity-40">DOWNLOAD ASSEMBLED GODOT GAME</button>:null}</div>}
        </div>
        <aside className="space-y-3">
          <div className="border border-slate-800 bg-[#0d141c] p-3"><h3 className="mb-2 text-xs font-black text-cyan-200">WORKLOAD / CAPACITY</h3><div className="text-2xl font-black text-cyan-100">{workload.units} <span className="text-[10px] text-slate-400">/ {workflowPlan?.max_workload_units||"—"} units</span></div><div className="mt-2 h-2 overflow-hidden bg-slate-800"><div className="h-full bg-cyan-500" style={{width:`${Math.min(100,workload.units/Math.max(1,workflowPlan?.max_workload_units||1)*100)}%`}}/></div><div className="mt-2 text-[9px] text-slate-400">Episode count, world size, environment variants, enemies, vehicles and gameplay beats determine the workload tier.</div></div>
          {needsCheckout && <div className="border border-amber-800/60 bg-amber-950/15 p-3"><h3 className="mb-2 text-xs font-black text-amber-200"><CreditCard size={14} className="mr-1 inline"/> PAY DIRECTLY TO POCHI</h3><p className="mb-2 text-[10px] leading-5 text-slate-300">Creator Flow plans are paid. Payment goes directly to the personal Pochi la Biashara merchant account configured for NEXORA. NEXORA does not unlock access from a self-declared receipt.</p><input type="tel" inputMode="tel" autoComplete="tel" value={payerPhone} onChange={e=>setPayerPhone(e.target.value)} placeholder="M-PESA phone number" className="mb-2 w-full border border-slate-700 bg-[#080d12] p-2 text-xs text-white"/><button type="button" onClick={createCheckout} disabled={Boolean(busy)||!payerPhone.trim()||!workflowPlan?.price_configured||!paymentConfig?.merchant_number_configured||!plans.length} className="w-full border border-amber-700 px-3 py-2 text-[10px] font-black text-amber-100 disabled:opacity-40">CREATE POCHI PAYMENT REFERENCE</button>{payment&&<div className="mt-2 border border-slate-700 bg-[#080d12] p-2 text-[10px]"><b className="text-white">{money(payment.amount_kes)}</b><div className="mt-1">Pay to Pochi number: <b>{payment.merchant_number}</b></div><div>Reference: <b className="select-all text-cyan-200">{payment.reference}</b></div><ol className="mt-2 list-decimal pl-4 text-slate-400">{(payment.instructions||[]).map(item=><li key={item} className="mt-1">{item}</li>)}</ol><input value={receipt} onChange={e=>setReceipt(e.target.value.toUpperCase())} placeholder="M-PESA receipt code" className="mt-2 w-full border border-slate-700 bg-[#101820] p-2 text-xs text-white"/><button type="button" onClick={submitReceipt} disabled={Boolean(busy)||!receipt.trim()} className="mt-2 w-full border border-amber-700 p-2 text-[10px] text-amber-100">SUBMIT RECEIPT FOR VERIFICATION</button><button type="button" onClick={checkPayment} disabled={Boolean(busy)} className="mt-2 w-full border border-slate-700 p-2 text-[10px] text-cyan-100">CHECK PAYMENT STATUS · {paymentStatus.toUpperCase()}</button></div>}{!workflowPlan?.price_configured&&<p className="mt-2 text-[9px] text-rose-200">{!paymentConfig?.merchant_number_configured ? "Checkout is locked until the NEXORA Pochi la Biashara destination is configured on the NEXORA API." : "Checkout is disabled until NEXORA_PLAN_PRICES_KES contains the approved price for this plan."}</p>}</div>}
          {canGenerate&&<div className="border border-emerald-800/60 bg-emerald-950/10 p-3"><h3 className="text-xs font-black text-emerald-200"><CheckCircle2 size={14} className="mr-1 inline"/> PLAN ACTIVE</h3><p className="mt-1 text-[10px] text-slate-300">{entitlement.plan.toUpperCase()} entitlement is verified for this NEXORA account.</p><p className="mt-1 text-[9px] text-slate-500">Valid until: {entitlement.expires_at?new Date(entitlement.expires_at).toLocaleDateString():"Not provided"}</p></div>}
          {entitlementCurrent && entitlement?.plan === "basic" && workflow.plan === "basic" && <div className="border border-amber-800/60 bg-amber-950/15 p-3">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-black text-amber-200"><Gift size={14}/> BASIC REWARDED TOOLS</h3>
            <p className="mb-3 text-[10px] leading-5 text-slate-300">Watch a rewarded video to unlock one use of a selected production tool. Credits are account-bound, non-transferable and have no cash value. One credit is consumed when a job is accepted into the queue; failed attempts are not automatically refunded. Only Google's verified callback can grant credits.</p>
            {!rewardState.enabled && <p className="mb-2 text-[10px] text-amber-100">Rewarded access is not configured yet. The NEXORA API needs Neon storage and the approved AdMob rewarded unit with server-side verification enabled.</p>}
            {[
              ["environment","Blender environment generation"],
              ["actors_props","Enemies and vehicles generation"],
            ].map(([toolId,label])=><div key={toolId} className="mb-2 flex flex-wrap items-center justify-between gap-2 border border-slate-800 bg-[#080d12] p-2">
              <div><div className="text-[10px] font-bold text-slate-100">{label}</div><div className="text-[9px] text-slate-400">{Number(rewardState?.balances?.[toolId]||0)} verified use credits available</div></div>
              <button type="button" disabled={!rewardState.enabled || !rewardState.basic_subscriber || !REWARDED_AD_UNIT_ID || Boolean(rewardBusy)} onClick={()=>watchRewardedToolAd(toolId)} className="border border-amber-700 px-3 py-2 text-[9px] font-black text-amber-100 disabled:opacity-40">{rewardBusy===toolId?"WAITING FOR AD…":"WATCH AD · +1 USE"}</button>
            </div>)}
            {rewardNotice && <p role="status" className="mt-2 text-[10px] text-amber-100">{rewardNotice}</p>}
            <button type="button" onClick={refreshRewards} disabled={Boolean(rewardBusy)} className="mt-1 text-[9px] text-cyan-200 underline">REFRESH REWARDED CREDITS</button>
            {Capacitor.getPlatform()!=="android" && <p className="mt-2 text-[9px] text-slate-500">Ad viewing is enabled in the RevelaCode Android app only.</p>}
          </div>}
          <div className="border border-slate-800 p-3"><h3 className="mb-2 text-xs font-black text-cyan-200">TOOLS / WORKERS</h3><div className="space-y-2 text-[10px]"><div className="flex justify-between"><span>Blender model conversion</span><b className={capabilities?.model_conversion?.available?"text-emerald-300":"text-amber-200"}>{capabilities?.model_conversion?.available?"READY":"NOT INSTALLED"}</b></div><div className="flex justify-between"><span>Image → 3D GPU worker</span><b className={capabilities?.image_to_3d?.available?"text-emerald-300":"text-amber-200"}>{capabilities?.image_to_3d?.available?"READY":"NOT INSTALLED"}</b></div><div className="flex justify-between"><span>Blender environment packs</span><b className="text-emerald-300">AVAILABLE ON WORKER</b></div><div className="flex justify-between"><span>Godot assembly</span><b className="text-slate-300">CHECKS AT BUILD</b></div></div><p className="mt-2 text-[9px] text-slate-500">Image reconstruction requires a dedicated CUDA worker. Uploaded 3D meshes can be converted with Blender; static meshes need rigging before character animation.</p></div>
        </aside>
        </div>
      </div>}
    </section>
  );
}
