import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertCircle, ArrowRight, BadgeCheck, CheckCircle2, CloudRain,
  CloudSun, Compass, Droplets, Info, MapPin, RefreshCw, ShieldAlert,
  ShieldCheck, ShoppingCart, Sprout, Tractor, TrendingUp, Users, Wheat, Wind,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

function finiteNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function firstPresent() {
  for (const value of arguments) if (value !== undefined && value !== null && value !== "") return value;
  return null;
}
function amountText(value, suffix) {
  const number = finiteNumber(value);
  return number === null ? "—" : new Intl.NumberFormat("en-KE", { maximumFractionDigits: 1 }).format(number) + (suffix || "");
}
function money(value) {
  const number = finiteNumber(value);
  return number === null ? "Not enough data yet" : new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(number);
}
function dateText(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}
function resourceId(item) {
  return item && (item.id || item._id) || null;
}
function unwrapProfile(value) {
  return value && (value.farmer || value.profile || value.data?.farmer || value.data?.profile) || value || null;
}
function unwrapList(value, key) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value && value[key])) return value[key];
  if (Array.isArray(value && value.items)) return value.items;
  return [];
}
function displayName(user, farmer) {
  return farmer?.farmer_name || farmer?.full_name || farmer?.name ||
    user?.full_name || user?.fullName || user?.display_name || user?.name || "there";
}
function statusOf(profile) {
  const raw = String(profile?.verification_status_display || profile?.verification_status || "not_submitted").toLowerCase().replace(/[\s-]+/g, "_");
  return raw === "approved" || raw === "verified" ? "verified" : raw;
}
function statusCopy(status, profile) {
  const note = profile?.review_notes || profile?.verification_review_notes || "";
  const submitted = profile?.submitted_at || profile?.verification_submitted_at;
  const reviewed = profile?.reviewed_at || profile?.verification_reviewed_at;
  const states = {
    not_submitted: { pill: "NOT SUBMITTED", title: "Start with your farmer profile", desc: "Add your farming details and submit them for administrator review. Farmer verification and each farm’s rights review are separate steps.", action: "Create farmer profile", tone: "neutral" },
    draft: { pill: "DRAFT SAVED", title: "Your farmer profile is saved as a draft", desc: "Continue where you left off, review your details and explicitly submit when ready. A draft does not unlock farm registration or selling.", action: "Resume profile", tone: "neutral" },
    pending: { pill: "PENDING REVIEW", title: "Your farmer profile is in the review queue", desc: "Farm registration and seller privileges stay locked until an administrator reviews your submission.", action: "View submission", tone: "pending" },
    more_info: { pill: "MORE INFORMATION REQUESTED", title: "A reviewer needs a little more information", desc: note || "Open your profile, review the request and update the relevant fields before resubmitting.", action: "Update and resubmit", tone: "warning" },
    rejected: { pill: "NOT APPROVED", title: "Your farmer profile was not approved", desc: note || "Review the decision, correct inaccurate or missing details, and resubmit or request a human follow-up.", action: "Review decision", tone: "danger" },
    verified: { pill: "VERIFIED FARMER", title: "Verified farmer profile", desc: "Your profile has passed RevelaCode’s platform review. This is not government certification, and each farm requires its own rights review.", action: "Manage my farms", tone: "verified" },
  };
  const result = states[status] || states.not_submitted;
  result.actionHint = status === "pending" && submitted ? "Submitted " + dateText(submitted) : (reviewed ? "Reviewed " + dateText(reviewed) : "");
  return result;
}
function SectionTitle({ title, eyebrow, description, action, onAction }) {
  return <div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div className="min-w-0">{eyebrow && <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#2B8058]">{eyebrow}</p>}<h2 className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl">{title}</h2>{description && <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>}</div>{action && <button type="button" onClick={onAction} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-black text-[#2B8058] hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 dark:text-emerald-300 dark:hover:bg-emerald-950/40">{action}<ArrowRight size={14}/></button>}</div>;
}
function MetricCard({ icon: Icon, label, value, tag, help }) {
  return <article className="min-w-0 rounded-[18px] border border-[#DCE7DE] bg-white p-3.5 shadow-[0_4px_18px_rgba(15,45,30,.035)] dark:border-slate-800 dark:bg-slate-950 sm:p-4"><div className="flex items-start justify-between gap-2"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E6F3E7] text-[#1D6545] dark:bg-emerald-950/50 dark:text-emerald-300"><Icon size={17}/></span>{tag && <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">{tag}</span>}</div><p className="mt-3 break-words text-[23px] font-black leading-tight tracking-tight text-slate-900 dark:text-white sm:text-[27px]">{value}</p><p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">{label}</p><p className="mt-1 text-[11px] leading-4 text-slate-400 dark:text-slate-500">{help}</p></article>;
}
function FarmCard({ farm, farmerVerified, onClick }) {
  const rights = String(farm?.legal_verification_status || "not_submitted").toLowerCase();
  const label = rights === "verified" ? "Farm rights reviewed" : rights === "pending" ? "Rights review pending" : rights === "more_info" ? "More details requested" : rights === "rejected" ? "Rights review not approved" : "Rights review not submitted";
  const location = [farm?.town, farm?.county].filter(Boolean).join(", ") || farm?.location || "Location not recorded";
  return <button type="button" onClick={onClick} className="flex w-full min-w-0 items-center gap-3 rounded-2xl border border-[#E4ECE5] bg-white p-3.5 text-left transition hover:border-emerald-200 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-900 sm:p-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F2E5] text-[#286947] dark:bg-emerald-950/50 dark:text-emerald-300"><Tractor size={21}/></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-slate-900 dark:text-white">{farm?.name || "Unnamed farm"}</span><span className="mt-1 flex items-center gap-1 truncate text-[11px] text-slate-500 dark:text-slate-400"><MapPin size={12} className="shrink-0"/>{location}</span><span className="mt-2 flex flex-wrap gap-1.5">{farmerVerified && <span className="inline-flex items-center gap-1 rounded-full bg-[#E4F3E8] px-2 py-1 text-[9px] font-black text-[#286947]"><CheckCircle2 size={11}/>Verified farmer</span>}<span className={"inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-black " + (rights === "verified" ? "bg-[#E4F3E8] text-[#286947]" : rights === "rejected" || rights === "more_info" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300")}><ShieldCheck size={10}/>{label}</span></span></span>{farm?.size !== undefined && farm?.size !== null && farm?.size !== "" && <span className="shrink-0 text-right"><span className="block text-sm font-black text-slate-800 dark:text-white">{amountText(farm.size)}</span><span className="text-[10px] text-slate-400">{farm?.size_unit || "acres"}</span></span>}<ArrowRight size={15} className="shrink-0 text-slate-300"/></button>;
}
function PredictionCard({ item }) {
  const title = item?.title || item?.name || item?.target || "Farm recommendation";
  const body = item?.recommendation || item?.message || item?.summary || item?.description || "";
  const source = item?.source_label || item?.source || item?.data_source || item?.model_name || "";
  const updated = item?.updated_at || item?.last_updated || item?.generated_at;
  const window = item?.forecast_window || item?.forecast_period || item?.window || item?.horizon;
  const conf = item?.confidence_label || item?.quality_label || (finiteNumber(item?.confidence) !== null ? amountText(Number(item.confidence) <= 1 ? Number(item.confidence) * 100 : item.confidence, "% confidence") : "");
  const assumptions = item?.assumptions || item?.limitations;
  const action = item?.next_action || item?.action || item?.recommended_action;
  const value = firstPresent(item?.estimated_range, item?.range, item?.predicted_value, item?.estimate, item?.risk_category);
  const knownTarget = firstPresent(item?.target, item?.crop_name, item?.farm_name, item?.farm_id, item?.location);
  const groundedValue = knownTarget && source && updated && window && conf && assumptions && action ? value : undefined;
  return <article className="rounded-2xl border border-[#E3EBE4] bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F2E5] text-[#286947] dark:bg-emerald-950/50 dark:text-emerald-300"><Sprout size={18}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>{groundedValue !== undefined && <span className="rounded-full bg-[#EDF6E7] px-2 py-1 text-[10px] font-black text-[#286947] dark:bg-emerald-950/50 dark:text-emerald-300">{String(groundedValue)}</span>}</div>{body && <p className="mt-1.5 text-xs leading-5 text-slate-600 dark:text-slate-300">{body}</p>}<div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400">{window && <span>{String(window)}</span>}{source && <span>Source: {String(source)}</span>}{updated && <span>Updated: {dateText(updated)}</span>}{conf && <span>{String(conf)}</span>}</div>{assumptions && <p className="mt-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">Assumptions / limitations: {String(assumptions)}</p>}{value !== undefined && groundedValue === undefined && <p className="mt-2 text-[11px] leading-4 text-amber-700 dark:text-amber-300">Numeric estimate withheld until its target, source, forecast window, update time, confidence/quality, assumptions and next action are available.</p>}{action && <p className="mt-2 text-[11px] font-bold text-[#2B8058] dark:text-emerald-300">Next step: {String(action)}</p>}</div></div></article>;
}
function EmptyState({ icon: Icon, title, description, button, onClick }) {
  return <div className="rounded-2xl border border-dashed border-[#D6E5D6] bg-[#F8FBF7] p-5 dark:border-slate-800 dark:bg-slate-900/60"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F2E4] text-[#2B8058] dark:bg-emerald-950/50 dark:text-emerald-300"><Icon size={19}/></span><h3 className="mt-3 text-sm font-black text-slate-900 dark:text-white">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>{button && <button type="button" onClick={onClick} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#123D2F] px-3 py-2 text-xs font-black text-white">{button}<ArrowRight size={13}/></button>}</div>;
}
export default function ShambaDashboard({ onNavigate, onOpenAI, location: deviceLocation }) {
  const { user } = useAuth();
  const { getShambaDashboard, getFarmer, getFarms, getFarmActivities, getFarmCommandCenter, getFarmInsights, getFarmAlerts, getFarmRecommendations, getFarmWeather, getFarmMarket, getMarketplaceListings } = useJumuiyaApi();
  const [dashboard, setDashboard] = useState(null);
  const [farmerProfile, setFarmerProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [farms, setFarms] = useState([]);
  const [farmsLoaded, setFarmsLoaded] = useState(false);
  const [marketListingsLoaded, setMarketListingsLoaded] = useState(false);
  const [activities, setActivities] = useState([]);
  const [commandCenter, setCommandCenter] = useState(null);
  const [insights, setInsights] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [weather, setWeather] = useState(null);
  const [marketSignals, setMarketSignals] = useState([]);
  const [marketListings, setMarketListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(true);
  const [alertsLoaded, setAlertsLoaded] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadCoreData = useCallback(async () => {
    setLoading(true);
    setError("");
    const results = await Promise.allSettled([
      getShambaDashboard(), getFarms(), getFarmer(), getMarketplaceListings({ hub: "shamba" }),
    ]);
    const getValue = (index) => results[index].status === "fulfilled" ? results[index].value : null;
    if (results[0].status === "fulfilled") setDashboard(getValue(0) || null);
    if (results[1].status === "fulfilled") { setFarms(unwrapList(getValue(1), "farms").filter((farm) => farm?.status !== "deleted")); setFarmsLoaded(true); }
    if (results[2].status === "fulfilled") { setFarmerProfile(unwrapProfile(getValue(2)) || null); setProfileLoaded(true); }
    if (results[3].status === "fulfilled") { setMarketListings(unwrapList(getValue(3), "listings").filter((item) => item?.status !== "deleted")); setMarketListingsLoaded(true); }
    if (results.every((result) => result.status === "rejected")) setError("Shamba could not load your data. Check your connection and refresh.");
    setLoading(false);
  }, [getShambaDashboard, getFarms, getFarmer, getMarketplaceListings]);
  useEffect(() => { loadCoreData().catch(() => setLoading(false)); }, [loadCoreData]);

  const activeFarms = useMemo(() => farms.filter((farm) => farm?.status !== "deleted"), [farms]);
  const farmId = resourceId(activeFarms[0]);
  const loadIntelligence = useCallback(async () => {
    if (!farmId) {
      setCommandCenter(null); setInsights(null); setAlerts([]); setRecommendations([]); setWeather(null); setMarketSignals([]); setAlertsLoaded(true); setIntelligenceLoading(false);
      return;
    }
    setIntelligenceLoading(true);
    const calls = [
      () => getFarmCommandCenter(farmId), () => getFarmInsights(farmId), () => getFarmAlerts(farmId),
      () => getFarmRecommendations(farmId), () => getFarmWeather(farmId), () => getFarmMarket(farmId),
    ];
    const results = await Promise.allSettled(calls.map((call) => typeof call === "function" ? call() : Promise.resolve(null)));
    const value = (index) => results[index].status === "fulfilled" ? results[index].value : null;
    setCommandCenter(value(0) || null); setInsights(value(1) || null);
    setAlerts(unwrapList(value(2), "alerts")); setAlertsLoaded(results[2].status === "fulfilled");
    setRecommendations(unwrapList(value(3), "recommendations")); setWeather(value(4) || null);
    setMarketSignals(unwrapList(value(5), "market")); setIntelligenceLoading(false);
  }, [farmId, getFarmCommandCenter, getFarmInsights, getFarmAlerts, getFarmRecommendations, getFarmWeather, getFarmMarket]);
  useEffect(() => { loadIntelligence().catch(() => setIntelligenceLoading(false)); }, [loadIntelligence]);

  useEffect(() => {
    let mounted = true;
    async function loadActivities() {
      setActivityLoading(true);
      if (!activeFarms.length) { if (mounted) { setActivities([]); setActivityLoading(false); } return; }
      const results = await Promise.allSettled(activeFarms.slice(0, 5).map((farm) => getFarmActivities(resourceId(farm))));
      if (!mounted) return;
      const merged = results.flatMap((result) => result.status === "fulfilled" ? unwrapList(result.value, "activities") : []);
      merged.sort((a, b) => new Date(firstPresent(b?.activity_date, b?.created_at, b?.updated_at, b?.date) || 0).getTime() - new Date(firstPresent(a?.activity_date, a?.created_at, a?.updated_at, a?.date) || 0).getTime());
      setActivities(merged.slice(0, 5)); setActivityLoading(false);
    }
    if (!loading) loadActivities().catch(() => { if (mounted) setActivityLoading(false); });
    return () => { mounted = false; };
  }, [activeFarms, loading, getFarmActivities]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await loadCoreData(); await loadIntelligence(); }
    finally { setRefreshing(false); }
  }, [loadCoreData, loadIntelligence]);
  const go = useCallback((section) => onNavigate?.(section), [onNavigate]);

  const profileStatus = statusOf(farmerProfile);
  const farmerVerified = profileStatus === "verified";
  const status = statusCopy(farmerProfile ? profileStatus : "not_submitted", farmerProfile);
  const StatusIcon = profileStatus === "verified" ? BadgeCheck : profileStatus === "pending" ? CloudSun : profileStatus === "rejected" || profileStatus === "more_info" ? AlertCircle : Users;
  const firstFarm = activeFarms[0] || null;
  const commandFarm = commandCenter?.farm || firstFarm;
  const insight = commandCenter?.insight || insights?.insight || insights || null;
  const summary = commandCenter?.summary || dashboard?.summary || {};
  const cropRecordSource = firstPresent(commandCenter?.crops, summary?.crops, dashboard?.crops);
  const crops = Array.isArray(cropRecordSource) ? cropRecordSource : [];
  const activeCrops = crops.filter((crop) => !["deleted", "harvested"].includes(String(crop?.status || "").toLowerCase()));
  const latestMarketSignals = marketSignals.length ? marketSignals : unwrapList(commandCenter?.market, "market");
  const recommendationItems = recommendations.length ? recommendations : unwrapList(insight?.recommendations, "recommendations");
  const unreadAlerts = alerts.filter((alert) => !alert?.read && !alert?.is_read);
  const weatherData = weather?.weather || weather?.snapshot || weather || commandCenter?.weather || null;
  const locationLabel = [commandFarm?.town, commandFarm?.county].filter(Boolean).join(", ") || farmerProfile?.town || farmerProfile?.county || (deviceLocation && typeof deviceLocation === "object" ? deviceLocation.label || deviceLocation.display_name || deviceLocation.town || deviceLocation.county : "") || commandFarm?.location || farmerProfile?.location || "";
  const rawPotentialValue = finiteNumber(firstPresent(insight?.potential_harvest_value, insight?.estimated_harvest_value, insight?.financials?.potential_harvest_value, insight?.financials?.estimated_harvest_value, commandCenter?.potential_harvest_value, summary?.potential_harvest_value, dashboard?.metrics?.potential_harvest_value));
  const cropCount = Array.isArray(cropRecordSource) ? activeCrops.length : finiteNumber(dashboard?.metrics?.active_crops);
  const estimateSource = firstPresent(insight?.source_label, insight?.source, insight?.data_source, insight?.model_name);
  const estimateUpdated = firstPresent(insight?.updated_at, insight?.last_updated, insight?.generated_at);
  const estimateWindow = firstPresent(insight?.forecast_window, insight?.forecast_period, insight?.window, insight?.horizon);
  const estimateConfidence = firstPresent(insight?.confidence_label, insight?.quality_label, insight?.confidence);
  const estimateAssumptions = firstPresent(insight?.assumptions, insight?.limitations);
  const estimateAction = firstPresent(insight?.next_action, insight?.action, insight?.recommended_action);
  const estimateTarget = firstPresent(insight?.target, insight?.crop_name, insight?.farm_name, insight?.location, commandFarm?.name, commandFarm?.id);
  const potentialValue = estimateSource && estimateUpdated && estimateWindow && estimateConfidence !== null && estimateConfidence !== undefined && estimateAssumptions && estimateAction && estimateTarget ? rawPotentialValue : null;
  const alertCount = farmId && alertsLoaded ? unreadAlerts.length : null;
  const temperature = finiteNumber(firstPresent(weatherData?.temperature, weatherData?.temperature_c, weatherData?.temp_c));
  const condition = firstPresent(weatherData?.condition, weatherData?.description, weatherData?.summary);
  const rain = finiteNumber(firstPresent(weatherData?.rainfall_probability, weatherData?.precipitation_probability, weatherData?.rain_chance));
  const humidity = finiteNumber(weatherData?.humidity);
  const wind = finiteNumber(firstPresent(weatherData?.wind_speed, weatherData?.wind_speed_kmh));
  const weatherUpdated = firstPresent(weatherData?.last_updated, weatherData?.updated_at, weatherData?.observed_at, weatherData?.fetched_at, weather?.updated_at);
  const weatherSource = firstPresent(weatherData?.source_label, weatherData?.source, weatherData?.provider, weather?.source);
  const weatherIsGrounded = Boolean(weatherSource && weatherUpdated);
  const market = latestMarketSignals[0] || null;
  const marketIsGrounded = Boolean(market && (market.source || market.source_label) && market.updated_at);

  return <div className="mx-auto w-full max-w-[1500px] min-w-0 pb-5 text-[#20372A] dark:text-slate-100">
    <section className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0"><p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-[#2B8058] dark:text-emerald-300"><span className="h-2 w-2 rounded-full bg-[#79B867]"/>Your farm, better informed</p><h1 className="mt-2 text-[clamp(27px,3vw,38px)] font-black leading-[1.08] tracking-[-.055em] text-[#163B2D] dark:text-white">{farmerVerified ? "Welcome back, " + displayName(user, farmerProfile).split(" ")[0] + "." : profileStatus === "pending" ? "Your review is in progress." : profileStatus === "draft" ? "Let’s finish your Shamba setup." : "Let’s set up your Shamba profile."}</h1><p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-600 dark:text-slate-300">{farmerVerified ? "Your farms, crop operations, weather and market decisions—together in one clear workspace." : profileStatus === "pending" ? "Explore general guidance while an administrator reviews your farmer details." : "Start with a guided farmer profile. Farm registration and seller privileges unlock only after approval."}</p><div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{locationLabel && <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DAE7DC] bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950"><MapPin size={12} className="text-[#2B8058]"/>{locationLabel}</span>}{farmerVerified && <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F4E7] px-3 py-1.5 text-[#225B3D] dark:bg-emerald-950/50 dark:text-emerald-300"><BadgeCheck size={12}/>Verified farmer</span>}</div></div>
      <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto"><button type="button" onClick={() => go("shamba/farms")} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#123D2F] px-4 py-3 text-xs font-black text-white shadow-sm transition hover:bg-[#205A43] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:flex-none">{farmerVerified ? <Tractor size={15}/> : <Users size={15}/>} {farmerVerified ? "My farms" : status.action}<ArrowRight size={14}/></button><button type="button" onClick={handleRefresh} disabled={refreshing || loading} aria-label="Refresh Shamba data" title="Refresh Shamba data" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#DCE7DE] bg-white text-slate-600 transition hover:bg-emerald-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-emerald-950/40"><RefreshCw size={16} className={refreshing ? "motion-safe:animate-spin" : ""}/></button></div>
    </section>

    {!loading && profileLoaded && <section aria-labelledby="shamba-profile-status" className={"mb-5 flex flex-col gap-3 rounded-[19px] border p-4 shadow-[0_4px_13px_rgba(36,75,48,.05)] sm:flex-row sm:items-start sm:p-5 " + (status.tone === "pending" ? "border-amber-200 bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-950" : status.tone === "danger" || status.tone === "warning" ? "border-rose-200 bg-gradient-to-r from-rose-50 to-white dark:from-rose-950/20 dark:to-slate-950" : "border-[#D8E9DA] bg-gradient-to-r from-[#EDF8EF] to-white dark:from-emerald-950/30 dark:to-slate-950")}><span className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " + (status.tone === "pending" ? "bg-amber-100 text-amber-800" : status.tone === "danger" || status.tone === "warning" ? "bg-rose-100 text-rose-700" : "bg-[#D6EDDB] text-[#123D2F]")}><StatusIcon size={19}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 id="shamba-profile-status" className="text-sm font-black tracking-tight text-slate-900 dark:text-white">{status.title}</h2><span className={"rounded-full px-2 py-1 text-[9px] font-black tracking-wide " + (status.tone === "pending" ? "bg-amber-100 text-amber-800" : status.tone === "danger" || status.tone === "warning" ? "bg-rose-100 text-rose-700" : "bg-[#E2F2E5] text-[#235B3D]")}>{status.pill}</span></div><p className="mt-1.5 max-w-3xl text-xs leading-5 text-slate-600 dark:text-slate-300">{status.desc}</p>{profileStatus === "pending" && <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold text-amber-900 dark:text-amber-200"><span className="inline-flex items-center gap-1"><CheckCircle2 size={13}/>Submitted</span><span aria-hidden="true">→</span><span className="rounded-full bg-amber-100 px-2.5 py-1">In review</span><span aria-hidden="true">→</span><span>Decision</span></div>}{status.actionHint && <p className="mt-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">{status.actionHint}</p>}</div><button type="button" onClick={() => go("shamba/farms")} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#D2E2D3] bg-white px-3 py-2 text-xs font-black text-[#1E5B3C] hover:bg-[#EAF5E9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-emerald-300">{status.action}<ArrowRight size={14}/></button></section>}
    {error && <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200"><AlertCircle size={15} className="mt-0.5 shrink-0"/>{error}</div>}

    <section className="mb-4 grid min-w-0 grid-cols-1 gap-4 min-[900px]:grid-cols-[minmax(0,1.5fr)_minmax(270px,.9fr)]">
      <article className="relative isolate min-h-[250px] overflow-hidden rounded-[25px] bg-gradient-to-br from-[#123D2F] via-[#1B5A3E] to-[#2D6D48] p-5 text-white shadow-[0_15px_38px_rgba(23,62,45,.12)] sm:p-7"><div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-24 -z-10 h-[320px] w-[320px] rounded-full border border-white/10 bg-[radial-gradient(circle_at_38%_46%,rgba(188,232,124,.3),transparent_60%)] shadow-[0_0_0_32px_rgba(255,255,255,.025),0_0_0_68px_rgba(255,255,255,.02)]"/><div aria-hidden="true" className="pointer-events-none absolute -bottom-14 right-0 -z-10 h-40 w-64 rounded-[50%_50%_0_0] bg-[#8BC774] [transform:rotate(-12deg)] sm:right-4"/><div aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-20 -z-10 h-40 w-52 rounded-[50%_50%_0_0] bg-[#4E9A62] [transform:rotate(10deg)]"/><div aria-hidden="true" className="pointer-events-none absolute -bottom-20 right-0 -z-10 h-40 w-52 rounded-[50%_50%_0_0] bg-[#2A754D]"/><div aria-hidden="true" className="pointer-events-none absolute right-9 top-7 -z-10 h-12 w-12 rounded-full bg-[#C8EF79] shadow-[0_0_0_13px_rgba(200,239,121,.1)] sm:right-16"/><div className="relative max-w-[530px]"><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.11em] text-[#D9EFCF]"><Sprout size={13}/>A farm operating system</span><h2 className="mt-4 max-w-[400px] text-[clamp(23px,2.6vw,33px)] font-black leading-[1.1] tracking-[-.055em]">{farmerVerified ? "Make your next farm decision with confidence." : "Build a clear picture of your farm."}</h2><p className="mt-2 max-w-[390px] text-xs leading-6 text-[#C6DDCD]">{farmerVerified ? "Bring your crop records, harvest plans, weather signals and market options into one practical workspace." : "Your profile is the starting point. Shamba keeps setup, verification and farm operations connected in one place."}</p><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => go("shamba/farms")} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#C8EF79] px-4 py-2.5 text-xs font-black text-[#193C2B] hover:bg-[#D7F59C]">{farmerVerified ? "Open farm portfolio" : "Set up farmer profile"}<ArrowRight size={14}/></button><button type="button" onClick={() => go("shamba/market")} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-black text-white hover:bg-white/15">Explore market</button></div></div></article>

      <article className="flex min-h-[250px] min-w-0 flex-col justify-between rounded-[25px] border border-[#DCE7DE] bg-white p-5 shadow-[0_5px_20px_rgba(15,45,30,.04)] dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.13em] text-slate-500 dark:text-slate-400">Local weather</p><h2 className="mt-1 text-base font-black text-slate-900 dark:text-white">Farm conditions</h2></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F3E7] text-[#286947] dark:bg-emerald-950/50 dark:text-emerald-300"><CloudSun size={20}/></span></div>{weatherData && weatherIsGrounded && (condition || temperature !== null || rain !== null || humidity !== null || wind !== null) ? <><div className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">{condition ? String(condition) : "Current observations"}</p><p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">{locationLabel || "Farm location not specified"}</p><p className="mt-1 text-[10px] text-slate-400">{temperature === null ? "Temperature unavailable" : amountText(temperature, "°")}</p></div><CloudSun size={40} strokeWidth={1.3} className="shrink-0 text-[#D2A64C]"/></div><div className="grid grid-cols-3 gap-2 border-t border-[#E7EEE7] pt-3 dark:border-slate-800"><div><CloudRain size={13} className="text-[#2B8058]"/><p className="mt-1 text-sm font-black text-slate-800 dark:text-white">{rain === null ? "—" : amountText(rain, "%")}</p><p className="text-[10px] text-slate-400">Rain chance</p></div><div><Droplets size={13} className="text-[#2B8058]"/><p className="mt-1 text-sm font-black text-slate-800 dark:text-white">{humidity === null ? "—" : amountText(humidity, "%")}</p><p className="text-[10px] text-slate-400">Humidity</p></div><div><Wind size={13} className="text-[#2B8058]"/><p className="mt-1 text-sm font-black text-slate-800 dark:text-white">{wind === null ? "—" : amountText(wind)}</p><p className="text-[10px] text-slate-400">Wind</p></div></div><p className="mt-3 text-[10px] text-slate-400">{weatherSource ? "Source: " + weatherSource : "Source not supplied"}{weatherUpdated ? " · Updated " + dateText(weatherUpdated) : " · Update time unavailable"}</p></> : <div className="flex flex-1 flex-col justify-center py-4"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F5EF] text-[#69816D] dark:bg-slate-900 dark:text-slate-300"><Compass size={24}/></span><p className="mt-3 text-sm font-black text-slate-900 dark:text-white">{loading || intelligenceLoading ? "Checking for current conditions…" : weatherData && !weatherIsGrounded ? "Weather source or update time missing" : "Weather data not available yet"}</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">{weatherData && !weatherIsGrounded ? "Shamba received weather data but cannot establish its source and last-updated time, so numeric conditions are withheld." : "Add a farm location and connect a current weather source to get a local forecast. Shamba will not invent a temperature or rainfall probability."}</p></div>}<button type="button" onClick={() => go("shamba/weather")} className="mt-4 flex min-h-9 items-center justify-between border-t border-[#E7EEE7] pt-3 text-xs font-black text-[#2B8058] dark:border-slate-800 dark:text-emerald-300">Open weather planner<ArrowRight size={14}/></button></article>
    </section>

    <section className="mb-5 grid min-w-0 grid-cols-2 gap-3 sm:gap-4 min-[1200px]:grid-cols-4"><MetricCard icon={Tractor} label="Registered farms" value={!farmsLoaded ? "—" : amountText(activeFarms.length)} tag={farmerVerified ? "FARMER VERIFIED" : "LIMITED"} help={!farmsLoaded ? "Farm records could not be confirmed" : farmerVerified ? "Each farm has its own rights status" : "Available after profile approval"}/><MetricCard icon={Sprout} label="Active crops" value={loading || intelligenceLoading ? "…" : cropCount === null || cropCount === undefined ? "—" : amountText(cropCount)} tag="RECORDED" help={cropCount === null || cropCount === undefined ? "Add crop records to start tracking" : "From current farm records"}/><MetricCard icon={Wheat} label="Potential harvest value" value={potentialValue === null ? "Not enough data yet" : money(potentialValue)} tag={potentialValue === null ? "NO ESTIMATE" : "ESTIMATE"} help={potentialValue === null ? "Harvest quantity, unit price and timing are needed" : "Model estimate, not guaranteed income"}/><MetricCard icon={AlertCircle} label="Farm alerts" value={alertCount === null ? "—" : amountText(alertCount)} tag={alertCount === null ? "UNAVAILABLE" : alertCount ? "ATTENTION" : "CLEAR"} help={alertCount === null ? "Alert status could not be confirmed" : alertCount ? "Review active alerts before acting" : "No unread alerts returned"}/></section>

    <section className="mb-5 grid min-w-0 grid-cols-1 items-start gap-4 min-[1200px]:grid-cols-[minmax(0,1.12fr)_minmax(0,.88fr)]">
      <div className="min-w-0 rounded-[23px] border border-[#DCE7DE] bg-white p-4 shadow-[0_5px_20px_rgba(15,45,30,.035)] dark:border-slate-800 dark:bg-slate-950 sm:p-5"><SectionTitle eyebrow="Data-led guidance" title="Predictive intelligence" description="Signals based on recorded farm data—not promises." action="View insights" onAction={() => go("shamba/crops")}/>{intelligenceLoading && !recommendationItems.length ? <div className="space-y-3 py-2">{[1,2].map((n) => <div key={n} className="h-24 motion-safe:animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900"/>)}</div> : recommendationItems.length ? <div className="space-y-3">{recommendationItems.slice(0,4).map((item,index) => <PredictionCard key={resourceId(item) || ((item?.title || item?.name || "prediction") + index)} item={item}/>)}</div> : <EmptyState icon={Sprout} title="Not enough data yet" description="Add a crop, planting date, recent activity and harvest record. A forecast should identify its source, time window, update time, confidence and assumptions." button="Add crop records" onClick={() => go("shamba/crops")} />}{insight?.summary && <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-5 text-slate-500 dark:bg-slate-900 dark:text-slate-400"><Info size={14} className="mt-0.5 shrink-0"/><span>{String(insight.summary)}{insight?.source ? " Source: " + insight.source + "." : ""}{insight?.updated_at ? " Updated " + dateText(insight.updated_at) + "." : ""}</span></div>}<div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-5 text-slate-500 dark:bg-slate-900 dark:text-slate-400"><Info size={14} className="mt-0.5 shrink-0"/><span>Observed values, estimates, forecasts and recommendations are different. Missing data is kept visibly unavailable, not replaced with invented yield, soil chemistry, revenue or price movements.</span></div></div>

      <div className="min-w-0 rounded-[23px] border border-[#DCE7DE] bg-white p-4 shadow-[0_5px_20px_rgba(15,45,30,.035)] dark:border-slate-800 dark:bg-slate-950 sm:p-5"><SectionTitle eyebrow="Your operations" title="My farm portfolio" description="Farmer verification and farm-rights review are separate." action="All farms" onAction={() => go("shamba/farms")}/>{loading ? <div className="space-y-3">{[1,2].map((n) => <div key={n} className="h-[92px] motion-safe:animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900"/>)}</div> : activeFarms.length ? <div className="space-y-2.5">{activeFarms.slice(0,4).map((farm) => <FarmCard key={resourceId(farm)} farm={farm} farmerVerified={farmerVerified} onClick={() => go("shamba/farms")}/>)}</div> : <EmptyState icon={Tractor} title={farmerVerified ? "Your farm portfolio starts here" : "Create your farmer profile first"} description={farmerVerified ? "Register your first farm. It will start with rights review not submitted, even though your farmer profile is verified." : "Farm registration stays locked until your farmer profile is approved. Public learning and market browsing remain available."} button={farmerVerified ? "Register a farm" : "Open farmer profile"} onClick={() => go("shamba/farms")}/>}<div className="mt-3 rounded-xl border border-[#E0EAE0] bg-[#F8FBF7] px-3.5 py-3 dark:border-slate-800 dark:bg-slate-900/60"><p className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-white"><ShieldCheck size={15} className="text-[#2B8058]"/>Trust status</p><p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{farmerVerified ? "Farmer profile verified. Each farm needs a separate rights review before rights-sensitive operations or listings." : "Profile approval is not proof of land ownership. Do not share private identity documents or pay someone to bypass review."}</p><button type="button" onClick={() => go("shamba/trust")} className="mt-2 inline-flex min-h-8 items-center gap-1 text-[11px] font-black text-[#2B8058] dark:text-emerald-300">Open Trust & Safety<ArrowRight size={12}/></button></div></div>
    </section>

    <section className="mb-5 grid min-w-0 grid-cols-1 gap-4 min-[950px]:grid-cols-2">
      <div className="min-w-0 rounded-[23px] border border-[#DCE7DE] bg-white p-4 shadow-[0_5px_20px_rgba(15,45,30,.035)] dark:border-slate-800 dark:bg-slate-950 sm:p-5"><SectionTitle eyebrow="Daily operations" title="Quick actions" description="Shortcuts into the work you can do next."/><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{[{key:"shamba/farms",title:"Farmer profile & farms",subtitle:farmerVerified ? "Manage farms and reviews" : status.title,icon:Users},{key:"shamba/crops",title:"Crop records",subtitle:"Planting and crop stages",icon:Sprout},{key:"shamba/weather",title:"Weather planner",subtitle:"Current forecast when available",icon:CloudSun},{key:"shamba/harvests",title:"Harvests",subtitle:"Record actual harvests",icon:Wheat},{key:"shamba/inputs",title:"Farm inputs",subtitle:"Manage inputs and costs",icon:ShoppingCart},{key:"__ai__",title:"Ask RevelaAI",subtitle:"Farm-aware guidance when available",icon:TrendingUp}].map((item) => {const Icon=item.icon;return <button key={item.key} type="button" onClick={() => item.key === "__ai__" ? onOpenAI?.() : go(item.key)} className="flex min-h-[70px] min-w-0 items-center gap-3 rounded-2xl border border-[#E5ECE5] bg-white p-3 text-left transition hover:border-emerald-200 hover:bg-[#F9FCF8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F2E4] text-[#286947] dark:bg-emerald-950/50 dark:text-emerald-300"><Icon size={18}/></span><span className="min-w-0"><span className="block text-xs font-black text-slate-900 dark:text-white">{item.title}</span><span className="mt-1 block text-[10px] leading-4 text-slate-500 dark:text-slate-400">{item.subtitle}</span></span><ArrowRight size={13} className="ml-auto shrink-0 text-slate-300"/></button>})}</div></div>

      <div className="min-w-0 rounded-[23px] border border-[#DCE7DE] bg-white p-4 shadow-[0_5px_20px_rgba(15,45,30,.035)] dark:border-slate-800 dark:bg-slate-950 sm:p-5"><SectionTitle eyebrow="Local signals" title="Market & trusted supply" description="Use backend-returned records; confirm details before trading." action="Open market" onAction={() => go("shamba/market")}/>{market ? <div className="rounded-2xl border border-[#E3EBE4] p-4 dark:border-slate-800"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F2E4] text-[#286947] dark:bg-emerald-950/50 dark:text-emerald-300"><TrendingUp size={18}/></span><div className="min-w-0 flex-1"><h3 className="text-sm font-black text-slate-900 dark:text-white">{market?.crop_name || market?.name || market?.commodity || "Market signal"}</h3><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{market?.market || market?.target_market || market?.location || "Confirm market and grade details before selling."}</p></div></div><div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#E7EEE7] pt-3 dark:border-slate-800"><div><p className="text-[10px] text-slate-400">Observed price</p><p className="mt-1 text-sm font-black text-slate-800 dark:text-white">{finiteNumber(market?.price) === null ? "—" : (market?.source || market?.source_label) && market?.updated_at ? money(market.price) : "Source/time unavailable"}{(market?.unit && (market?.source || market?.source_label) && market?.updated_at) ? " / " + market.unit : ""}</p></div><div><p className="text-[10px] text-slate-400">Trend</p><p className="mt-1 text-sm font-black text-slate-800 dark:text-white">{marketIsGrounded ? market?.trend || market?.trend_label || "Trend unavailable" : "Source/time unavailable"}</p></div></div><p className="mt-2 text-[10px] text-slate-400">{market?.source || market?.source_label ? "Source: " + (market.source || market.source_label) : "Source not supplied"}{market?.updated_at ? " · Updated " + dateText(market.updated_at) : ""}</p></div> : <EmptyState icon={TrendingUp} title="No current market signal returned" description="Prices vary by buyer, location, grade and quantity. Missing data is not described as a stable, rising or falling trend." button="Browse market" onClick={() => go("shamba/market")}/>}<div className="mt-3 rounded-2xl bg-[#F5F8F4] p-3.5 dark:bg-slate-900"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#286947] dark:bg-slate-950 dark:text-emerald-300"><ShieldCheck size={17}/></span><div className="min-w-0"><h3 className="text-xs font-black text-slate-900 dark:text-white">Trade with clear checks</h3><p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{!marketListingsLoaded ? "Shamba listing eligibility could not be checked just now. Refresh before relying on an empty result." : marketListings.length ? marketListings.length + " eligible Shamba listing(s) returned by the market service. Confirm seller, quantity, unit price, grade, availability and update time." : "No eligible Shamba listings were returned. A badge alone does not guarantee against fraud."} Avoid advance-payment pressure or requests to move payment off-platform.</p></div></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => go("shamba/market")} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#123D2F] px-3 py-2 text-[11px] font-black text-white"><ShoppingCart size={13}/>Browse supply</button><button type="button" onClick={() => go("shamba/trust")} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#D5E3D6] bg-white px-3 py-2 text-[11px] font-black text-[#286947] dark:border-slate-700 dark:bg-slate-950 dark:text-emerald-300"><ShieldAlert size={13}/>Report a concern</button></div></div></div>
    </section>

    <section className="mb-5 grid min-w-0 grid-cols-1 gap-4 min-[950px]:grid-cols-2">
      <div className="min-w-0 rounded-[23px] border border-[#DCE7DE] bg-white p-4 shadow-[0_5px_20px_rgba(15,45,30,.035)] dark:border-slate-800 dark:bg-slate-950 sm:p-5">
        <SectionTitle eyebrow="Production records" title="Crop overview" description="Recorded crop information, not a guessed health or risk score." action="All crops" onAction={() => go("shamba/crops")} />
        {intelligenceLoading && !Array.isArray(cropRecordSource) ? <div className="space-y-2">{[1,2,3].map((n) => <div key={n} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />)}</div> : !Array.isArray(cropRecordSource) ? <EmptyState icon={Sprout} title="Crop records are not available yet" description="Shamba could not confirm your current crop records. Refresh or open the crop workspace to check the source data." button="Open crops" onClick={() => go("shamba/crops")} /> : activeCrops.length ? <div className="space-y-2">{activeCrops.slice(0,5).map((crop,index) => {
          const cropName = crop?.name || crop?.crop_name || crop?.category || "Crop";
          const date = crop?.planting_date || crop?.planted_at || crop?.created_at;
          const area = firstPresent(crop?.area, crop?.size);
          const unit = crop?.area_unit || crop?.size_unit || "acres";
          return <button key={resourceId(crop) || cropName + index} type="button" onClick={() => go("shamba/crops")} className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-[#E5ECE5] p-3 text-left transition hover:border-emerald-200 hover:bg-[#F9FCF8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-slate-800 dark:hover:bg-slate-900">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E7F2E4] text-[#286947] dark:bg-emerald-950/50 dark:text-emerald-300"><Sprout size={16}/></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-black text-slate-900 dark:text-white">{cropName}</span><span className="mt-1 block truncate text-[10px] text-slate-500 dark:text-slate-400">{crop?.variety || crop?.stage || crop?.category || "Stage not recorded"}{date ? " · Recorded " + dateText(date) : ""}</span></span>
            <span className="shrink-0 text-right"><span className="block text-xs font-black text-slate-800 dark:text-white">{area === null ? "—" : amountText(area)}</span><span className="text-[10px] text-slate-400">{area === null ? "Area unknown" : unit}</span></span>
          </button>;
        })}</div> : <EmptyState icon={Sprout} title="No active crops recorded" description="Add crop type and planting details when you are ready. Shamba will not infer a risk or crop-health score without data." button="Add crop records" onClick={() => go("shamba/crops")} />}
      </div>

      <div className="min-w-0 rounded-[23px] border border-[#DCE7DE] bg-white p-4 shadow-[0_5px_20px_rgba(15,45,30,.035)] dark:border-slate-800 dark:bg-slate-950 sm:p-5">
        <SectionTitle eyebrow="Needs attention" title="Farm alerts" description="Operational notices returned for your first registered farm." action="All alerts" onAction={() => go("shamba/alerts")} />
        {!farmId ? <EmptyState icon={AlertCircle} title="Farm alerts start with a registered farm" description="Once a farmer profile is verified and a farm is registered, Shamba can show farm-specific alerts here." /> : !alertsLoaded ? <div className="space-y-2">{[1,2].map((n) => <div key={n} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />)}</div> : unreadAlerts.length ? <div className="space-y-2">{unreadAlerts.slice(0,4).map((alert,index) => {
          const title = alert?.title || alert?.type || alert?.category || "Farm notice";
          const body = alert?.message || alert?.description || alert?.details || "Open alerts to view more information.";
          const severity = String(alert?.severity || alert?.priority || "notice").toLowerCase();
          const tone = ["critical","high","urgent","danger"].includes(severity) ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200" : ["warning","medium"].includes(severity) ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200" : "border-[#DCE7DE] bg-[#F8FBF7] text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200";
          return <button key={resourceId(alert) || title + index} type="button" onClick={() => go("shamba/alerts")} className={"flex w-full min-w-0 items-start gap-3 rounded-xl border p-3 text-left transition hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 " + tone}><AlertCircle size={16} className="mt-0.5 shrink-0"/><span className="min-w-0 flex-1"><span className="block text-xs font-black">{title}</span><span className="mt-1 block text-[11px] leading-5 opacity-90">{String(body)}</span>{(alert?.updated_at || alert?.created_at) && <span className="mt-1 block text-[10px] opacity-70">Updated {dateText(alert.updated_at || alert.created_at)}</span>}</span><ArrowRight size={13} className="mt-0.5 shrink-0 opacity-60"/></button>;
        })}</div> : <EmptyState icon={CheckCircle2} title="No unread alerts returned" description="This means the current alert source returned no unread items. It is not a forecast that the farm has zero agricultural risk." />}
      </div>
    </section>

    <section className="mb-5 rounded-[23px] border border-[#DCE7DE] bg-white p-4 shadow-[0_5px_20px_rgba(15,45,30,.035)] dark:border-slate-800 dark:bg-slate-950 sm:p-5"><SectionTitle eyebrow="Farm records" title="Recent activity" description="Recent entries returned for your registered farms." action="View activities" onAction={() => go("shamba/activities")}/>{activityLoading ? <div className="space-y-2">{[1,2,3].map((n) => <div key={n} className="h-12 motion-safe:animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900"/>)}</div> : activities.length ? <div className="divide-y divide-[#EBF0EB] dark:divide-slate-800">{activities.map((item,index) => <div key={resourceId(item) || index} className="flex min-w-0 items-center gap-3 py-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E7F2E4] text-[#286947] dark:bg-emerald-950/50 dark:text-emerald-300"><Activity size={16}/></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-black text-slate-800 dark:text-white">{item?.type || item?.activity_type || "Farm activity"}</span><span className="mt-1 block truncate text-[11px] text-slate-500 dark:text-slate-400">{item?.description || item?.notes || dateText(item?.activity_date || item?.created_at) || "Details not supplied"}</span></span>{item?.cost !== undefined && item?.cost !== null && <span className="shrink-0 text-xs font-bold text-slate-600 dark:text-slate-300">{money(item.cost)}</span>}</div>)}</div> : <EmptyState icon={Activity} title="Your activity log is ready for its first entry" description="Log planting, irrigation, input use, a crop observation or an actual harvest to make future guidance more useful." button="Open activity log" onClick={() => go("shamba/activities")}/>}</section>
    <footer className="flex flex-col gap-2 rounded-2xl border border-[#DCE7DE] bg-[#F4F8F2] p-4 text-[11px] leading-5 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:flex-row sm:items-start"><ShieldCheck size={16} className="shrink-0 text-[#2B8058]"/><p><strong className="text-slate-800 dark:text-slate-200">Trust is a process, not a badge alone.</strong> Farmer profile verification and farm-rights review are separate platform checks. They are not government title certification, legal adjudication or a guarantee against fraud. Soil-photo scans cannot directly measure pH or NPK; use a qualified laboratory for soil chemistry.</p></footer>
  </div>;
}
