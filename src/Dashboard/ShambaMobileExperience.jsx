import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3,
  Bell, CheckCircle2, ChevronRight, Clock, Cloud, CloudRain, CloudSun,
  Crown, Droplets, Filter, FlaskConical, Home, Leaf, MapPin, MessageCircle,
  MoreHorizontal, Package, Plus, RefreshCw, Search, Settings, ShieldCheck,
  ShoppingCart, Sprout, Sun, Tractor, User, Users, Wheat, Wind, X,
} from "lucide-react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import HubRevenueOffers from "@/Dashboard/HubRevenueOffers.jsx";

const FARM_PHOTO = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85";
const PANEL = "rounded-2xl border border-[#17384F] bg-[#0A2237]";
const MUTED = "text-[#8BA6B8]";
const ACTION = "bg-[#20C987] text-[#05251E]";

function getId(item) { return item?.id || item?._id || null; }
function unwrap(value, key) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.[key])) return value[key];
  if (Array.isArray(value?.data?.[key])) return value.data[key];
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data?.items)) return value.data.items;
  return [];
}
function unwrapFarmer(value) {
  return value?.farmer || value?.profile || value?.data?.farmer || value?.data?.profile || value?.data || value || null;
}
function first(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}
function num(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function numberText(value, suffix = "") {
  const parsed = num(value);
  return parsed === null ? "—" : new Intl.NumberFormat("en-KE", { maximumFractionDigits: 1 }).format(parsed) + suffix;
}
function kes(value) {
  const parsed = num(value);
  return parsed === null ? "—" : new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(parsed);
}
function dateLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short" }).format(date);
}
function timeAgo(value) {
  if (!value) return "Time unavailable";
  const ms = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(ms) || ms < 0) return dateLabel(value) || "Time unavailable";
  const hours = Math.floor(ms / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return hours + "h ago";
  const days = Math.floor(hours / 24);
  return days + (days === 1 ? " day ago" : " days ago");
}
function farmerStatus(profile) {
  const raw = String(profile?.verification_status_display || profile?.verification_status || "not_submitted").toLowerCase().replace(/[\s-]+/g, "_");
  return raw === "approved" || raw === "verified" ? "verified" : raw;
}
function rightsVerified(farm) {
  return String(farm?.legal_verification_status || "").toLowerCase() === "verified";
}
function farmLocation(farm) {
  return farm?.location || [farm?.town, farm?.county].filter(Boolean).join(", ") || "Location not recorded";
}
function weatherPayload(value) {
  return value?.weather || value?.data?.weather || value?.data || value || null;
}
function forecastItems(value) {
  const candidates = [value?.forecast, value?.daily, value?.forecast_days, value?.data?.forecast, value?.data?.daily];
  return candidates.find(Array.isArray) || [];
}
function marketItems(value) {
  return unwrap(value, "market").length ? unwrap(value, "market") :
    unwrap(value, "prices").length ? unwrap(value, "prices") :
    unwrap(value, "signals").length ? unwrap(value, "signals") :
    Array.isArray(value?.data) ? value.data : [];
}
function recordDate(item) {
  return first(item?.activity_date, item?.harvest_date, item?.date, item?.created_at, item?.updated_at);
}
function displayUserName(user, farmer) {
  const name = first(farmer?.farmer_name, farmer?.full_name, farmer?.name, user?.full_name, user?.fullName, user?.display_name, user?.name, "Farmer");
  return String(name).trim().split(/\s+/)[0] || "Farmer";
}
function statusLabel(status) {
  const labels = {
    verified: "Verified",
    pending: "Pending",
    more_info: "More info",
    rejected: "Not approved",
    not_submitted: "Not submitted",
    draft: "Draft",
  };
  return labels[status] || String(status || "Unverified").replace(/_/g, " ");
}

function MobileHeader({ title, subtitle, onBack, onAlerts, right }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#14344A] bg-[#041726]/95 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[560px] items-center gap-3">
        {onBack ? (
          <button type="button" onClick={onBack} aria-label="Go back" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#1D4057] bg-[#0A2237] text-white">
            <ArrowLeft size={18} />
          </button>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#1E5B4B] bg-[#0B3B34] text-[#50E09F]">
            <Leaf size={23} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-extrabold text-white">{title}</div>
          {subtitle && <div className={"truncate text-[11px] " + MUTED}>{subtitle}</div>}
        </div>
        {right || (onAlerts && (
          <button type="button" onClick={onAlerts} aria-label="Open alerts" className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#B9D0DC]">
            <Bell size={19} />
          </button>
        ))}
      </div>
    </header>
  );
}

function SectionHeading({ title, action, onAction }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[14px] font-extrabold text-white">{title}</h2>
      {action && <button type="button" onClick={onAction} className="shrink-0 text-[12px] font-bold text-[#39D99A]">{action}</button>}
    </div>
  );
}

function StatTile({ icon: Icon, label, value, detail }) {
  return (
    <div className={PANEL + " min-w-0 p-3"}>
      <div className="flex items-center gap-2 text-[#45D79A]"><Icon size={16}/><span className={"truncate text-[11px] " + MUTED}>{label}</span></div>
      <div className="mt-2 text-[20px] font-black leading-none text-white">{value}</div>
      {detail && <div className={"mt-1 text-[10px] " + MUTED}>{detail}</div>}
    </div>
  );
}

function WeatherGlyph({ condition, size = 24 }) {
  const text = String(condition || "").toLowerCase();
  const Icon = text.includes("rain") || text.includes("storm") ? CloudRain : text.includes("cloud") ? Cloud : Sun;
  return <Icon size={size} className={text.includes("rain") ? "text-sky-300" : "text-amber-300"} />;
}

export default function ShambaMobileExperience({ user, location, onOpenAI, onNavigate }) {
  const api = useJumuiyaApi();
  const {
    getShambaDashboard, getFarmer, getFarms, getFarm, getFarmWeather,
    getFarmMarket, getFarmActivities, getFarmCommandCenter, getFarmInsights,
    getFarmAlerts, getFarmRecommendations, getMarketplaceListings, getHarvests,
    markFarmAlertRead,
  } = api;

  const [screen, setScreen] = useState("home");
  const [moreOpen, setMoreOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [farmDetail, setFarmDetail] = useState(null);
  const [activities, setActivities] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [weatherResponse, setWeatherResponse] = useState(null);
  const [marketResponse, setMarketResponse] = useState(null);
  const [marketListings, setMarketListings] = useState([]);
  const [commandCenter, setCommandCenter] = useState(null);
  const [insights, setInsights] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [farmSearch, setFarmSearch] = useState("");
  const [farmFilter, setFarmFilter] = useState("All");
  const [detailTab, setDetailTab] = useState("Overview");
  const [recordTab, setRecordTab] = useState("Expenses");
  const [alertFilter, setAlertFilter] = useState("All");
  const [advisorQuestion, setAdvisorQuestion] = useState("");

  const activeFarms = useMemo(() => farms.filter((farm) => farm?.status !== "deleted"), [farms]);
  const selectedFarm = useMemo(() => activeFarms.find((farm) => String(getId(farm)) === String(selectedFarmId)) || activeFarms[0] || null, [activeFarms, selectedFarmId]);
  const farmerVerified = farmerStatus(farmer) === "verified";
  const currentFarmId = getId(selectedFarm);
  const farmVerified = rightsVerified(selectedFarm);
  const profileStatus = farmerStatus(farmer);
  const firstName = displayUserName(user, farmer);
  const weather = weatherPayload(weatherResponse);
  const currentTemperature = first(weather?.temperature, weather?.temperature_c, weather?.temp_c, weather?.current?.temperature, weather?.current?.temperature_2m);
  const currentCondition = first(weather?.condition, weather?.description, weather?.summary, weather?.current?.condition, weather?.current?.weather_description);
  const humidity = first(weather?.humidity, weather?.current?.humidity, weather?.current?.relative_humidity_2m);
  const wind = first(weather?.wind_speed, weather?.wind_speed_kmh, weather?.current?.wind_speed, weather?.current?.wind_speed_10m);
  const rainChance = first(weather?.rainfall_probability, weather?.precipitation_probability, weather?.rain_chance, weather?.current?.precipitation_probability);
  const forecast = forecastItems(weather);
  const currentMarketItems = marketItems(marketResponse);
  const marketRows = currentMarketItems.length ? currentMarketItems : marketListings;
  const alertCount = alerts.filter((item) => !item?.read_at && item?.is_read !== true && item?.read !== true).length;
  const farmerPill = farmerStatus(farmer);
  const farmHealth = first(commandCenter?.farm_health, commandCenter?.health_score, commandCenter?.health?.score, farmDetail?.health_score);
  const expectedYield = first(commandCenter?.expected_yield, commandCenter?.yield_estimate, commandCenter?.insight?.expected_yield, farmDetail?.expected_yield);
  const lastActivity = activities[0] || null;

  const loadCore = useCallback(async () => {
    setLoading(true);
    setError("");
    const results = await Promise.allSettled([
      getShambaDashboard(), getFarmer(), getFarms(), getMarketplaceListings({ hub: "shamba" }),
    ]);
    const value = (index) => results[index].status === "fulfilled" ? results[index].value : null;
    if (results[0].status === "fulfilled") setDashboard(value(0));
    if (results[1].status === "fulfilled") setFarmer(unwrapFarmer(value(1)));
    if (results[2].status === "fulfilled") {
      const items = unwrap(value(2), "farms").filter((farm) => farm?.status !== "deleted");
      setFarms(items);
      setSelectedFarmId((current) => current || String(getId(items[0]) || ""));
    }
    if (results[3].status === "fulfilled") setMarketListings(unwrap(value(3), "listings").filter((item) => item?.status !== "deleted"));
    if (results.every((result) => result.status === "rejected")) setError("Shamba could not reach the data service. Check your connection and refresh.");
    else if (results.some((result) => result.status === "rejected")) setError("Some Shamba data is temporarily unavailable. Sections show only information returned by the server.");
    setLoading(false);
  }, [getShambaDashboard, getFarmer, getFarms, getMarketplaceListings]);

  useEffect(() => {
    let live = true;
    Promise.allSettled([getShambaDashboard(), getFarmer(), getFarms(), getMarketplaceListings({ hub: "shamba" })]).then((results) => {
      if (!live) return;
      const value = (index) => results[index].status === "fulfilled" ? results[index].value : null;
      if (results[0].status === "fulfilled") setDashboard(value(0));
      if (results[1].status === "fulfilled") setFarmer(unwrapFarmer(value(1)));
      if (results[2].status === "fulfilled") {
        const items = unwrap(value(2), "farms").filter((farm) => farm?.status !== "deleted");
        setFarms(items);
        setSelectedFarmId((current) => current || String(getId(items[0]) || ""));
      }
      if (results[3].status === "fulfilled") setMarketListings(unwrap(value(3), "listings").filter((item) => item?.status !== "deleted"));
      if (results.every((result) => result.status === "rejected")) setError("Shamba could not reach the data service. Check your connection and refresh.");
      else if (results.some((result) => result.status === "rejected")) setError("Some Shamba data is temporarily unavailable. Sections show only information returned by the server.");
      setLoading(false);
    }).catch(() => {
      if (live) { setError("Shamba could not load your workspace."); setLoading(false); }
    });
    return () => { live = false; };
  }, [getShambaDashboard, getFarmer, getFarms, getMarketplaceListings]);

  useEffect(() => {
    if (!currentFarmId) {
      setFarmDetail(null); setActivities([]); setHarvests([]); setWeatherResponse(null);
      setMarketResponse(null); setCommandCenter(null); setInsights(null); setRecommendations([]); setAlerts([]);
      return undefined;
    }
    let live = true;
    getFarm(currentFarmId).then((value) => { if (live) setFarmDetail(value?.farm || value?.data?.farm || value?.data || value); }).catch(() => { if (live) setFarmDetail(selectedFarm); });
    if (!farmVerified) {
      setActivities([]); setHarvests([]); setWeatherResponse(null); setMarketResponse(null);
      setCommandCenter(null); setInsights(null); setRecommendations([]); setAlerts([]);
      return () => { live = false; };
    }
    Promise.allSettled([
      getFarmActivities(currentFarmId), getHarvests(currentFarmId), getFarmWeather(currentFarmId),
      getFarmMarket(currentFarmId), getFarmCommandCenter(currentFarmId), getFarmInsights(currentFarmId),
      getFarmRecommendations(currentFarmId), getFarmAlerts(currentFarmId),
    ]).then((results) => {
      if (!live) return;
      const value = (index) => results[index].status === "fulfilled" ? results[index].value : null;
      setActivities(unwrap(value(0), "activities").sort((a, b) => new Date(recordDate(b) || 0).getTime() - new Date(recordDate(a) || 0).getTime()));
      setHarvests(unwrap(value(1), "harvests").sort((a, b) => new Date(recordDate(b) || 0).getTime() - new Date(recordDate(a) || 0).getTime()));
      setWeatherResponse(value(2)); setMarketResponse(value(3)); setCommandCenter(value(4)); setInsights(value(5));
      setRecommendations(unwrap(value(6), "recommendations"));
      setAlerts(unwrap(value(7), "alerts"));
    }).catch(() => {});
    return () => { live = false; };
  }, [currentFarmId, farmVerified, getFarm, getFarmActivities, getHarvests, getFarmWeather, getFarmMarket, getFarmCommandCenter, getFarmInsights, getFarmRecommendations, getFarmAlerts, selectedFarm]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try { await loadCore(); }
    finally { setRefreshing(false); }
  }, [loadCore]);

  const go = useCallback((next, farm) => {
    if (farm) setSelectedFarmId(String(getId(farm) || ""));
    setMoreOpen(false);
    setScreen(next);
    setDetailTab("Overview");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const filteredFarms = useMemo(() => activeFarms.filter((farm) => {
    const searchText = (String(farm?.name || "") + " " + farmLocation(farm)).toLowerCase();
    const status = String(farm?.legal_verification_status || farm?.status || "").toLowerCase();
    const matchesFilter = farmFilter === "All" ||
      (farmFilter === "Active" && farm?.status !== "deleted") ||
      (farmFilter === "Pending" && status.includes("pending")) ||
      (farmFilter === "Not Approved" && (status.includes("rejected") || status.includes("more_info")));
    return matchesFilter && searchText.includes(farmSearch.toLowerCase());
  }), [activeFarms, farmFilter, farmSearch]);

  const openFarmDetails = (farm) => go("detail", farm);
  const openAdvisor = () => {
    setScreen("advisor");
    setMoreOpen(false);
  };

  const markRead = async (alert) => {
    const id = getId(alert);
    if (!currentFarmId || !id || typeof markFarmAlertRead !== "function") return;
    try {
      await markFarmAlertRead(currentFarmId, id);
      setAlerts((items) => items.map((item) => getId(item) === id ? { ...item, is_read: true, read: true } : item));
    } catch (requestError) {
      setError(requestError?.message || "This alert could not be marked as read.");
    }
  };

  const back = () => {
    if (screen === "detail") go("farms");
    else if (screen === "home") onNavigate?.("home");
    else go("home");
  };

  const titleMap = {
    farms: "My Farms", detail: "Farm Details", weather: "Weather & Forecast",
    market: "Market Prices", advisor: "AI Farm Advisor", records: "Farm Records",
    alerts: "Alerts & Notifications", profile: "Profile & Settings", plans: "Shamba Plans & Tools",
    manage: "Farm Management",
  };

  const records = recordTab === "Expenses" ? activities.filter((item) => num(item?.cost) !== null) :
    recordTab === "Sales" ? harvests : activities;
  const expensesTotal = activities.reduce((sum, item) => sum + (num(item?.cost) || 0), 0);
  const salesTotal = harvests.reduce((sum, item) => sum + (num(first(item?.revenue, item?.sale_amount, item?.total_value, item?.amount)) || 0), 0);

  const header = screen === "home" ? (
    <MobileHeader title="RevelaCode" subtitle="Shamba Hub" onAlerts={() => go("alerts")} />
  ) : (
    <MobileHeader title={titleMap[screen] || "Shamba"} subtitle={farmLocation(selectedFarm)} onBack={() => screen === "detail" ? go("farms") : go("home")} onAlerts={() => go("alerts")} />
  );

  return (
    <div className="shamba-mobile min-h-[100svh] bg-[#031321] pb-[calc(74px+env(safe-area-inset-bottom))] font-sans text-white">
      {header}
      <main className="mx-auto w-full max-w-[560px] px-4 pb-5">
        {error && <div className="mt-3 rounded-xl border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-[12px] text-amber-200">{error}</div>}
        {screen === "home" && (
          <>
            <section className="relative mt-3 min-h-[178px] overflow-hidden rounded-[22px] border border-[#28526B] bg-cover bg-center p-4 shadow-xl" style={{ backgroundImage: "linear-gradient(90deg,rgba(2,18,30,.91) 0%,rgba(2,18,30,.55) 55%,rgba(2,18,30,.1) 100%),url(" + FARM_PHOTO + ")" }}>
              <div className="relative z-10 max-w-[75%]">
                <p className="text-[12px] font-medium text-[#D7E7ED]">Good day,</p>
                <h1 className="mt-1 text-[24px] font-black leading-tight">{firstName} <span className="text-[#70DA72]">🌿</span></h1>
                <p className="mt-2 text-[11px] leading-4 text-[#D3E2E8]">Healthy farms. Better tomorrow.</p>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#58D99A]/30 bg-[#0E744F]/90 px-3 py-1.5 text-[11px] font-bold text-white"><CheckCircle2 size={13}/>{farmerVerified ? "Farmer Verified" : statusLabel(profileStatus)}</span>
                <span className="rounded-full border border-white/15 bg-[#062237]/70 px-2.5 py-1 text-[10px] text-[#D3E2E8]">{activeFarms.length} {activeFarms.length === 1 ? "farm" : "farms"}</span>
              </div>
            </section>

            <section className={PANEL + " mt-3 flex items-center gap-3 p-3.5"}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#173E58] text-amber-300"><WeatherGlyph condition={currentCondition} size={29}/></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2"><span className="text-[25px] font-black">{numberText(currentTemperature, "°C")}</span><span className="truncate text-[11px] text-[#B9CBD6]">{currentCondition || (farmVerified ? "Conditions unavailable" : "Farm review pending")}</span></div>
                <p className={"mt-0.5 truncate text-[10px] " + MUTED}>{farmLocation(selectedFarm)}</p>
              </div>
              <div className="grid shrink-0 grid-cols-2 gap-x-3 gap-y-1 text-right text-[10px]">
                <span className={MUTED}>Humidity</span><b>{numberText(humidity, "%")}</b>
                <span className={MUTED}>Rain</span><b>{numberText(rainChance, "%")}</b>
                <span className={MUTED}>Wind</span><b>{numberText(wind, " km/h")}</b>
              </div>
            </section>

            <section className="mt-5">
              <SectionHeading title="Quick Actions" action="See all" onAction={() => setMoreOpen(true)}/>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: "My Farms", icon: Tractor, action: () => go("farms"), tone: "text-[#55D99B] bg-[#104438]" },
                  { label: "Weather", icon: CloudSun, action: () => go("weather"), tone: "text-sky-300 bg-[#123A58]" },
                  { label: "Market Prices", icon: ShoppingCart, action: () => go("market"), tone: "text-[#78D77D] bg-[#143F36]" },
                  { label: "AI Advisor", icon: MessageCircle, action: openAdvisor, tone: "text-sky-300 bg-[#123A58]" },
                  { label: "Create Farm", icon: Sprout, action: () => go("manage"), tone: "text-[#A7DD79] bg-[#24452F]" },
                  { label: "Farm Records", icon: ClipboardListIcon, action: () => go("records"), tone: "text-[#74D99D] bg-[#124237]" },
                ].map((item) => {
                  const Icon = item.icon;
                  return <button key={item.label} type="button" onClick={item.action} className="flex min-h-[82px] flex-col items-center justify-center gap-2 rounded-2xl border border-[#17384F] bg-[#082036] px-1.5 py-3 text-center active:scale-[.98]">
                    <span className={"flex h-10 w-10 items-center justify-center rounded-xl " + item.tone}><Icon size={19}/></span>
                    <span className="text-[10px] font-bold text-[#D9E7ED]">{item.label}</span>
                  </button>;
                })}
              </div>
            </section>

            <section className="mt-4 rounded-2xl border border-[#125A4B] bg-gradient-to-r from-[#063C37] to-[#082B35] p-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1A684C] text-[#A8F0B5]"><Sprout size={22}/></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-extrabold text-white">{activeFarms.length ? "Your farm portfolio" : "Start your farming journey"}</p>
                  <p className="mt-1 text-[10px] leading-4 text-[#B7D9D0]">{activeFarms.length ? (farmVerified ? "Farm data is connected. Review your latest records and recommendations." : "Your farmer profile and each farm have separate verification steps.") : "Create your farmer profile before registering your first farm."}</p>
                </div>
                <button type="button" onClick={() => go("farms")} className="shrink-0 text-[11px] font-bold text-[#55DFA5]">Open <ChevronRight size={13} className="inline"/></button>
              </div>
            </section>
            {lastActivity && <section className="mt-4">
              <SectionHeading title="Recent Activity" action="View all" onAction={() => go("records")}/>
              <div className={PANEL + " flex items-center gap-3 p-3"}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#143F39] text-[#50D99A]"><Activity size={17}/></span>
                <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-bold text-white">{lastActivity?.type || lastActivity?.activity_type || "Farm activity"}</p><p className={"mt-1 truncate text-[10px] " + MUTED}>{lastActivity?.description || dateLabel(recordDate(lastActivity)) || "Recorded activity"}</p></div>
                <span className={"text-[10px] " + MUTED}>{timeAgo(recordDate(lastActivity))}</span>
              </div>
            </section>}
            {loading && <p className={"mt-4 text-center text-[11px] " + MUTED}>Loading your farm data…</p>}
          </>
        )}

        {screen === "farms" && (
          <section className="pt-4">
            <div className="flex items-center justify-between gap-2">
              <div><h1 className="text-[21px] font-black">My Farms</h1><p className={"text-[11px] " + MUTED}>Your registered farm portfolio</p></div>
              <button type="button" onClick={() => go("manage")} className={"inline-flex items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-extrabold " + ACTION}><Plus size={14}/>Add Farm</button>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#1A3B52] bg-[#0A2237] px-3 py-2.5"><Search size={15} className="text-[#7C9FB2]"/><input value={farmSearch} onChange={(event) => setFarmSearch(event.target.value)} placeholder="Search farms…" className="min-w-0 flex-1 bg-transparent text-[12px] text-white outline-none placeholder:text-[#6F8A9C]"/></div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {["All", "Active", "Pending", "Not Approved"].map((label) => <button key={label} type="button" onClick={() => setFarmFilter(label)} className={"shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold " + (farmFilter === label ? ACTION : "border border-[#24465D] bg-[#0B2338] text-[#9FB6C4]")}>{label}</button>)}
            </div>
            <div className="mt-3 space-y-3">
              {filteredFarms.map((farm) => {
                const verified = rightsVerified(farm);
                const state = String(farm?.legal_verification_status || "not_submitted").toLowerCase();
                return <button key={getId(farm)} type="button" onClick={() => openFarmDetails(farm)} className={PANEL + " flex w-full gap-3 p-3 text-left"}>
                  <img src={farm?.cover_image || farm?.image_url || FARM_PHOTO} alt="" className="h-[66px] w-[66px] shrink-0 rounded-xl object-cover"/>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2"><span className="truncate text-[12px] font-extrabold text-white">{farm?.name || "Unnamed Farm"}</span><span className={"shrink-0 rounded-full px-2 py-1 text-[9px] font-bold " + (verified ? "bg-[#0C664C] text-[#B7F7D8]" : state === "pending" ? "bg-[#73551C] text-[#FFE7A7]" : "bg-[#314354] text-[#C4D1DA]")}>{statusLabel(state)}</span></span>
                    <span className={"mt-1 block truncate text-[10px] " + MUTED}>{first(farm?.primary_crop, farm?.crop_name, farm?.crop_type, "Farm")} · {numberText(farm?.size)} {farm?.size_unit || "acres"}</span>
                    <span className="mt-2 flex items-center gap-3 text-[9px] text-[#7897A9]"><span>{farmLocation(farm)}</span><span>Updated {timeAgo(farm?.updated_at || farm?.created_at)}</span></span>
                  </span>
                  <ChevronRight size={16} className="mt-1 shrink-0 text-[#64879C]"/>
                </button>;
              })}
              {!loading && filteredFarms.length === 0 && <div className={PANEL + " p-5 text-center"}><Tractor size={26} className="mx-auto text-[#42CF92]"/><p className="mt-2 text-[13px] font-bold text-white">{activeFarms.length ? "No farms match this filter" : "No farms registered yet"}</p><p className={"mt-1 text-[11px] " + MUTED}>{farmerVerified ? "Register a farm to start tracking your operations." : "Complete farmer verification before registering a farm."}</p></div>}
            </div>
          </section>
        )}

        {screen === "detail" && (
          <section className="pt-3">
            {selectedFarm && <>
              <div className="relative overflow-hidden rounded-[20px] border border-[#1F4D64]">
                <img src={farmDetail?.cover_image || farmDetail?.image_url || selectedFarm?.cover_image || FARM_PHOTO} alt="Farm landscape" className="h-[132px] w-full object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-[#031321] via-[#031321]/10 to-transparent"/>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="min-w-0"><h1 className="truncate text-[20px] font-black">{farmDetail?.name || selectedFarm.name || "Farm Details"}</h1><p className={"mt-1 truncate text-[11px] " + MUTED}>{numberText(farmDetail?.size ?? selectedFarm.size)} {farmDetail?.size_unit || selectedFarm.size_unit || "acres"} · {farmLocation(farmDetail || selectedFarm)}</p></div>
                <span className={"rounded-full px-2.5 py-1 text-[10px] font-bold " + (farmVerified ? "bg-[#0B634B] text-[#B5F2D2]" : "bg-[#59481F] text-[#F7DA92]")}>{farmVerified ? "Verified" : statusLabel(selectedFarm?.legal_verification_status)}</span>
              </div>
              <div className="mt-3 flex gap-2 border-b border-[#17384F] pb-2">
                {["Overview", "Crops", "Soil", "History"].map((tab) => <button key={tab} type="button" onClick={() => setDetailTab(tab)} className={"flex-1 pb-1 text-[11px] font-bold " + (detailTab === tab ? "border-b-2 border-[#2AD38F] text-[#47DBA0]" : "text-[#86A1B2]")}>{tab}</button>)}
              </div>
              {!farmVerified && <div className="mt-3 rounded-xl border border-amber-800/60 bg-amber-950/30 p-3 text-[11px] leading-5 text-amber-200">This farm has not passed its separate rights review. Farm-linked weather, alerts and intelligence remain unavailable until the review is approved. <button type="button" onClick={() => go("trust")} className="font-bold underline">Review status</button></div>}
              {detailTab === "Overview" && <div className="mt-3 grid grid-cols-2 gap-2">
                <StatTile icon={Sprout} label="Farm health" value={farmVerified ? numberText(farmHealth, "%") : "Locked"} detail={farmVerified ? "Latest backend result" : "Rights review required"}/>
                <StatTile icon={Wheat} label="Expected yield" value={farmVerified ? numberText(expectedYield, " tonnes") : "Locked"} detail="Only server-returned estimates"/>
                <div className={PANEL + " col-span-2 p-3"}>
                  <p className="text-[12px] font-extrabold text-white">Farm information</p>
                  <div className="mt-2 space-y-2 text-[11px]">
                    {[
                      ["County / town", farmLocation(farmDetail || selectedFarm)],
                      ["Soil type", first(farmDetail?.soil_type, selectedFarm.soil_type, "Not recorded")],
                      ["Irrigation", first(farmDetail?.irrigation, selectedFarm.irrigation, "Not recorded")],
                      ["Created", dateLabel(farmDetail?.created_at || selectedFarm.created_at) || "Not recorded"],
                    ].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-3 border-b border-[#17384F] pb-2 last:border-0"><span className={MUTED}>{label}</span><span className="text-right font-semibold text-[#DCE8EE]">{value}</span></div>)}
                  </div>
                </div>
                <div className={PANEL + " col-span-2 p-3"}>
                  <p className="text-[12px] font-extrabold text-white">Recent activities</p>
                  {activities.slice(0, 3).map((item, index) => <div key={getId(item) || index} className="flex items-center gap-2 border-b border-[#17384F] py-2 last:border-0"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#123D36] text-[#55D99A]"><Activity size={14}/></span><span className="min-w-0 flex-1 truncate text-[11px] text-[#D7E5EB]">{item?.type || item?.activity_type || "Farm activity"}</span><span className={"text-[9px] " + MUTED}>{timeAgo(recordDate(item))}</span></div>)}
                  {!activities.length && <p className={"mt-2 text-[11px] " + MUTED}>No activity records returned yet.</p>}
                </div>
              </div>}
              {detailTab === "Crops" && <div className={PANEL + " mt-3 p-3"}>
                <p className="text-[12px] font-extrabold text-white">Recorded crops</p>
                {(farmDetail?.crops || farmDetail?.crop_records || selectedFarm?.crops || []).length ? (farmDetail?.crops || farmDetail?.crop_records || selectedFarm?.crops || []).map((crop, index) => <div key={getId(crop) || index} className="flex items-center gap-3 border-b border-[#17384F] py-3 last:border-0"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#143E36] text-[#56D99B]"><Sprout size={17}/></span><span className="min-w-0 flex-1"><span className="block text-[12px] font-bold text-white">{crop?.name || crop?.crop_name || "Crop"}</span><span className={"text-[10px] " + MUTED}>{crop?.stage || crop?.variety || "Stage not recorded"}</span></span><span className="text-[11px] font-bold text-white">{numberText(crop?.area ?? crop?.size)} {crop?.area_unit || crop?.size_unit || "acres"}</span></div>) : <p className={"mt-2 text-[11px] " + MUTED}>No crop records are attached to this farm.</p>}
              </div>}
              {detailTab === "Soil" && <div className={PANEL + " mt-3 space-y-3 p-3"}>
                <p className="text-[12px] font-extrabold text-white">Soil & water profile</p>
                {[
                  ["Soil type", first(farmDetail?.soil_type, selectedFarm.soil_type, "Not recorded")],
                  ["Water source", first(farmDetail?.water_source, selectedFarm.water_source, "Not recorded")],
                  ["Irrigation", first(farmDetail?.irrigation, selectedFarm.irrigation, "Not recorded")],
                  ["pH", first(farmDetail?.soil_ph, farmDetail?.ph, "Not measured")],
                  ["NPK", first(farmDetail?.npk, "Not measured")],
                ].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 border-b border-[#17384F] pb-2 last:border-0"><span className={"text-[11px] " + MUTED}>{label}</span><span className="text-[11px] font-bold text-white">{value}</span></div>)}
                <p className={"text-[10px] leading-4 " + MUTED}>Soil-photo estimates are not laboratory measurements. Use a qualified laboratory for pH and nutrient testing.</p>
              </div>}
              {detailTab === "History" && <div className={PANEL + " mt-3 p-3"}>
                <p className="text-[12px] font-extrabold text-white">Farm history</p>
                {[...activities, ...harvests].sort((a, b) => new Date(recordDate(b) || 0).getTime() - new Date(recordDate(a) || 0).getTime()).slice(0, 12).map((item, index) => <div key={getId(item) || index} className="flex items-center gap-2 border-b border-[#17384F] py-2 last:border-0"><Clock size={14} className="text-[#48D89A]"/><span className="min-w-0 flex-1 truncate text-[11px] text-white">{item?.type || item?.activity_type || item?.name || "Farm record"}</span><span className={"text-[9px] " + MUTED}>{dateLabel(recordDate(item))}</span></div>)}
                {!activities.length && !harvests.length && <p className={"mt-2 text-[11px] " + MUTED}>No farm history records returned.</p>}
              </div>}
              <button type="button" onClick={() => go("weather")} className={"mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[12px] font-extrabold " + ACTION}><MapPin size={15}/>View Farm Weather</button>
            </>}
            {!selectedFarm && <div className={PANEL + " mt-4 p-5 text-center"}><p className="text-[13px] font-bold">No farm selected</p><button type="button" onClick={() => go("farms")} className="mt-3 text-[12px] font-bold text-[#45D99A]">Open My Farms</button></div>}
          </section>
        )}

        {screen === "weather" && (
          <section className="pt-4">
            <div className="flex items-center gap-2 text-[12px] font-bold text-[#4BDD9D]"><MapPin size={16}/>{farmLocation(selectedFarm)}</div>
            <p className={"mt-1 text-[10px] " + MUTED}>{weather?.updated_at ? "Updated " + dateLabel(weather.updated_at) : "Live farm forecast"}</p>
            {!farmVerified && selectedFarm && <div className="mt-3 rounded-xl border border-amber-800/60 bg-amber-950/30 p-3 text-[11px] leading-5 text-amber-200">Weather for this farm is available after its separate rights review is approved.</div>}
            <div className={PANEL + " mt-3 p-4"}>
              <div className="flex items-center justify-between">
                <div><div className="text-[35px] font-black">{farmVerified ? numberText(currentTemperature, "°C") : "—"}</div><div className="text-[12px] text-[#D8E6EC]">{farmVerified ? currentCondition || "Condition unavailable" : "Farm forecast locked"}</div></div>
                <WeatherGlyph condition={currentCondition} size={48}/>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#17384F] pt-3">
                {[["Humidity", humidity, "%", Droplets], ["Wind", wind, " km/h", Wind], ["Rain chance", rainChance, "%", CloudRain]].map(([label, value, suffix, Icon]) => <div key={label}><Icon size={15} className="text-[#50D69B]"/><p className="mt-1 text-[14px] font-extrabold">{farmVerified ? numberText(value, suffix) : "—"}</p><p className={"text-[9px] " + MUTED}>{label}</p></div>)}
              </div>
            </div>
            <div className="mt-5"><SectionHeading title="7-Day Forecast"/></div>
            <div className={PANEL + " divide-y divide-[#17384F] px-3"}>
              {farmVerified && forecast.length ? forecast.slice(0, 7).map((day, index) => <div key={day?.date || day?.day || index} className="flex items-center gap-3 py-3"><WeatherGlyph condition={day?.condition || day?.description || day?.weather} size={18}/><span className="min-w-0 flex-1 text-[11px] font-semibold text-white">{day?.day || day?.date || dateLabel(day?.time)}</span><span className="text-[11px] text-[#C1D1DA]">{numberText(first(day?.max, day?.temperature_max, day?.temp_max))}° / {numberText(first(day?.min, day?.temperature_min, day?.temp_min))}°</span><span className="text-[10px] text-[#73DDA7]">{numberText(first(day?.precipitation_probability, day?.rain_chance), "%")}</span></div>) : <div className="py-5 text-center"><p className="text-[12px] font-bold text-white">{farmVerified ? "Forecast data not returned" : "No farm forecast available"}</p><p className={"mt-1 text-[10px] " + MUTED}>Shamba displays forecast values only when supplied by the weather service.</p></div>}
            </div>
            <button type="button" onClick={refresh} disabled={refreshing} className={"mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[12px] font-extrabold disabled:opacity-50 " + ACTION}><RefreshCw size={14} className={refreshing ? "animate-spin" : ""}/>Refresh Weather</button>
          </section>
        )}

        {screen === "market" && (
          <section className="pt-4">
            <h1 className="text-[21px] font-black">Market Prices</h1>
            <p className={"mt-1 text-[11px] " + MUTED}>Prices returned by Shamba market services</p>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#1A3B52] bg-[#0A2237] p-2.5"><MapPin size={14} className="text-[#43D79A]"/><span className="flex-1 text-[11px] text-[#D9E7ED]">{farmLocation(selectedFarm)}</span><button type="button" onClick={refresh} aria-label="Refresh market" className="text-[#91ADBC]"><RefreshCw size={15}/></button></div>
            <div className="mt-3 flex rounded-xl border border-[#1A3B52] bg-[#0A2237] p-1">
              <span className="flex-1 rounded-lg bg-[#1BC987] px-3 py-2 text-center text-[11px] font-extrabold text-[#05251E]">Local Market</span>
              <span className="flex-1 px-3 py-2 text-center text-[11px] font-semibold text-[#8BA6B8]">National</span>
            </div>
            <div className={PANEL + " mt-3 overflow-hidden"}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 border-b border-[#17384F] px-3 py-3 text-[10px] font-bold text-[#7898AB]"><span>Crop</span><span>Price (KES)</span><span>Trend</span></div>
              {marketRows.slice(0, 12).map((item, index) => {
                const name = first(item?.crop_name, item?.name, item?.commodity, item?.product_name, "Market listing");
                const price = first(item?.price_range, item?.price, item?.unit_price, item?.display_price);
                const trend = first(item?.trend, item?.trend_label, item?.price_change_label);
                const unit = first(item?.unit, item?.price_unit, item?.quantity_unit);
                return <div key={getId(item) || index} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 border-b border-[#17384F] px-3 py-3 last:border-0"><span className="min-w-0"><span className="block truncate text-[11px] font-bold text-white">{name}</span><span className={"text-[9px] " + MUTED}>{unit || "Price per unit"}</span></span><span className="text-[11px] font-extrabold text-white">{typeof price === "object" ? JSON.stringify(price) : (price === undefined ? "—" : String(price))}</span><span className={"text-[10px] font-bold " + (String(trend || "").includes("-") ? "text-rose-400" : "text-[#49DB99]")}>{trend || "—"}</span></div>;
              })}
              {!marketRows.length && <div className="px-4 py-6 text-center"><ShoppingCart size={24} className="mx-auto text-[#48D79A]"/><p className="mt-2 text-[12px] font-bold text-white">No current price records</p><p className={"mt-1 text-[10px] " + MUTED}>Market prices will appear when the backend returns verified location, grade and unit data.</p></div>}
            </div>
            <div className="mt-3 rounded-xl border border-[#155C4D] bg-[#063C37] p-3.5"><div className="flex items-center gap-2 text-[#5CE1A3]"><Sprout size={17}/><p className="text-[11px] font-extrabold">Market insight</p></div><p className="mt-1 text-[10px] leading-4 text-[#B8D9CF]">{first(marketResponse?.insight, marketResponse?.summary, marketResponse?.data?.insight, "Use prices as a guide, then confirm grade, buyer, quantity and delivery terms before trading.")}</p></div>
          </section>
        )}

        {screen === "advisor" && (
          <section className="pt-4">
            <div className="flex items-center justify-between"><div><h1 className="text-[21px] font-black">AI Farm Advisor</h1><p className={"mt-1 text-[11px] " + MUTED}>Farm-aware guidance from RevelaAI</p></div><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#103E38] text-[#53DCA0]"><Sprout size={20}/></span></div>
            <div className="mt-4 rounded-[20px] border border-[#1C4C5D] bg-gradient-to-br from-[#08273B] to-[#062F32] p-4">
              <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1DBD88] text-[#03251D]"><Sprout size={17}/></span><span className="text-[12px] font-extrabold">RevelaAI · Shamba Advisor</span></div>
              <div className="mt-4 max-w-[88%] rounded-2xl rounded-tl-sm border border-[#24536A] bg-[#0C3048] p-3 text-[11px] leading-5 text-[#D9E8EF]">Ask about crop selection, planting windows, soil records, farm operations or local market information. Farm-specific guidance is limited to data that has been recorded and approved for use.</div>
              <div className="ml-auto mt-3 max-w-[88%] rounded-2xl rounded-tr-sm bg-[#0B7458] p-3 text-[11px] leading-5 text-white">What should I do next on my farm?</div>
              <div className="mt-3 max-w-[88%] rounded-2xl rounded-tl-sm border border-[#24536A] bg-[#0C3048] p-3 text-[11px] leading-5 text-[#D9E8EF]">{recommendations[0]?.recommendation || recommendations[0]?.message || insights?.summary || "Open the live RevelaAI assistant to receive current guidance based on your farm records and the data available to the platform."}</div>
            </div>
            <div className="mt-4"><SectionHeading title="Suggested questions"/></div>
            <div className="space-y-2">
              {["Which crop fits my farm conditions?","When is the best planting window?","How can I improve soil health?","What farm records should I update?"].map((prompt) => <button key={prompt} type="button" onClick={() => { setAdvisorQuestion(prompt); onOpenAI?.(); }} className={PANEL + " flex w-full items-center justify-between gap-3 p-3 text-left text-[11px] font-semibold text-[#D8E7EE]"}><span>{prompt}</span><ArrowUpRight size={15} className="shrink-0 text-[#4DDB9E]"/></button>)}
            </div>
            <form onSubmit={(event) => { event.preventDefault(); if (advisorQuestion.trim()) onOpenAI?.(); }} className="mt-4 flex items-center gap-2 rounded-full border border-[#24516A] bg-[#0A2237] p-2">
              <input value={advisorQuestion} onChange={(event) => setAdvisorQuestion(event.target.value)} placeholder="Ask anything about your farm…" className="min-w-0 flex-1 bg-transparent px-2 text-[11px] text-white outline-none placeholder:text-[#6E8FA2]"/>
              <button type="submit" disabled={!advisorQuestion.trim()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#27CB8E] text-[#06261F] disabled:opacity-50"><ArrowRight size={17}/></button>
            </form>
            <button type="button" onClick={() => onOpenAI?.()} className={"mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[12px] font-extrabold " + ACTION}><MessageCircle size={15}/>Open Live RevelaAI</button>
          </section>
        )}

        {screen === "records" && (
          <section className="pt-4">
            <h1 className="text-[21px] font-black">Farm Records</h1>
            <p className={"mt-1 text-[11px] " + MUTED}>Recorded spending, harvests and activities</p>
            <div className="mt-4 flex gap-1 rounded-xl border border-[#1B3D53] bg-[#0A2237] p-1">
              {["Expenses", "Sales", "Activities"].map((tab) => <button key={tab} type="button" onClick={() => setRecordTab(tab)} className={"flex-1 rounded-lg py-2 text-[10px] font-bold " + (recordTab === tab ? ACTION : "text-[#91AABB]")}>{tab}</button>)}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <StatTile icon={ShoppingCart} label="Total expenses" value={kes(expensesTotal)} detail={activities.length + " recorded activities"}/>
              <StatTile icon={BarChart3} label="Recorded sales" value={kes(salesTotal)} detail={harvests.length + " harvest records"}/>
            </div>
            <div className="mt-4 flex items-center justify-between"><p className="text-[12px] font-extrabold text-white">{recordTab} · {records.length}</p><span className={"text-[10px] " + MUTED}>{selectedFarm?.name || "All farms"}</span></div>
            <div className={PANEL + " mt-2 divide-y divide-[#17384F] px-3"}>
              {records.slice(0, 30).map((item, index) => {
                const label = first(item?.name, item?.type, item?.activity_type, item?.crop_name, recordTab === "Sales" ? "Harvest" : "Farm record");
                const amount = first(item?.cost, item?.revenue, item?.sale_amount, item?.total_value, item?.amount);
                const subtitle = first(item?.description, item?.notes, item?.crop_name, dateLabel(recordDate(item)), "Record details unavailable");
                return <div key={getId(item) || index} className="flex items-center gap-3 py-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#143E37] text-[#50D99C]">{recordTab === "Sales" ? <Wheat size={16}/> : recordTab === "Expenses" ? <Package size={16}/> : <Activity size={16}/>}</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-bold text-white">{label}</span><span className={"mt-0.5 block truncate text-[9px] " + MUTED}>{subtitle}</span></span><span className="text-[11px] font-bold text-white">{amount === undefined ? "—" : kes(amount)}</span></div>;
              })}
              {!records.length && <div className="py-6 text-center"><ClipboardListIcon size={24} className="mx-auto text-[#4BD99B]"/><p className="mt-2 text-[12px] font-bold text-white">No {recordTab.toLowerCase()} returned</p><p className={"mt-1 text-[10px] " + MUTED}>Entries appear here after they are saved to the farm records service.</p></div>}
            </div>
            <button type="button" onClick={() => go("manage")} className={"mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[12px] font-extrabold " + ACTION}><Plus size={15}/>Add Farm Record</button>
          </section>
        )}

        {screen === "alerts" && (
          <section className="pt-4">
            <div className="flex items-center justify-between gap-2"><div><h1 className="text-[21px] font-black">Alerts & Notifications</h1><p className={"mt-1 text-[11px] " + MUTED}>{alertCount} unread notifications</p></div><button type="button" onClick={refresh} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#21445A] bg-[#0A2237] text-[#95B0BF]"><RefreshCw size={15}/></button></div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{["All", "Weather", "Market", "Farm", "System"].map((tab) => <button key={tab} type="button" onClick={() => setAlertFilter(tab)} className={"shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold " + (alertFilter === tab ? ACTION : "border border-[#24465D] bg-[#0B2338] text-[#9FB6C4]")}>{tab}</button>)}</div>
            {!farmVerified && selectedFarm && <div className="mt-3 rounded-xl border border-amber-800/60 bg-amber-950/30 p-3 text-[11px] text-amber-200">Farm-specific alerts are shown after the farm rights review is verified.</div>}
            <div className="mt-3 space-y-2">
              {alerts.filter((item) => alertFilter === "All" || String(item?.category || item?.type || item?.source || "").toLowerCase().includes(alertFilter.toLowerCase())).map((alert, index) => {
                const read = Boolean(alert?.read_at || alert?.is_read || alert?.read);
                const type = String(alert?.category || alert?.type || alert?.source || "Farm").toLowerCase();
                const Icon = type.includes("weather") ? CloudRain : type.includes("market") ? BarChart3 : type.includes("system") ? Bell : AlertTriangle;
                return <div key={getId(alert) || index} className={PANEL + " flex items-start gap-3 p-3"}>
                  <span className={"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " + (read ? "bg-[#18354A] text-[#8CA5B5]" : "bg-[#5A342E] text-[#FF947C]")}><Icon size={17}/></span>
                  <div className="min-w-0 flex-1"><p className="text-[11px] font-extrabold text-white">{alert?.title || alert?.type || "Farm notification"}</p><p className="mt-1 text-[10px] leading-4 text-[#B5C9D3]">{alert?.message || alert?.description || alert?.details || "Open this notification for more information."}</p><p className={"mt-1 text-[9px] " + MUTED}>{timeAgo(alert?.created_at || alert?.updated_at)}</p></div>
                  {!read && <button type="button" onClick={() => markRead(alert)} className="shrink-0 text-[9px] font-bold text-[#53DCA0]">Mark read</button>}
                </div>;
              })}
              {!alerts.length && <div className={PANEL + " p-5 text-center"}><Bell size={24} className="mx-auto text-[#4AD99A]"/><p className="mt-2 text-[12px] font-bold text-white">{farmVerified ? "No notifications returned" : "Notifications unavailable"}</p><p className={"mt-1 text-[10px] " + MUTED}>{farmVerified ? "The alert service returned no notifications for this farm." : "Register and verify your farm to receive farm-specific alerts."}</p></div>}
            </div>
          </section>
        )}

        {screen === "profile" && (
          <section className="pt-4">
            <h1 className="text-[21px] font-black">Profile & Settings</h1>
            <div className={PANEL + " mt-4 flex items-center gap-3 p-4"}>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#2AD08F] bg-[#153D48] text-[17px] font-black text-white">{String(firstName).slice(0, 1).toUpperCase()}</div>
              <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-extrabold text-white">{first(farmer?.farmer_name, farmer?.full_name, user?.full_name, user?.fullName, user?.name, "Shamba Farmer")}</p><p className={"mt-1 truncate text-[10px] " + MUTED}>{farmer?.phone || user?.phone || user?.email || "Contact details not supplied"}</p><span className="mt-2 inline-flex rounded-full bg-[#0D634C] px-2 py-1 text-[9px] font-bold text-[#B9F4D5]">{farmerVerified ? "Verified farmer" : statusLabel(profileStatus)}</span></div>
            </div>
            <div className="mt-3 space-y-2">
              {[
                { title: "My Profile", subtitle: "Update farmer information", icon: User, action: () => go("manage") },
                { title: "Farm Settings", subtitle: "Manage registered farms", icon: Settings, action: () => go("farms") },
                { title: "Notifications", subtitle: "Alerts and preferences", icon: Bell, action: () => go("alerts") },
                { title: "Trust & Verification", subtitle: "Farmer and farm review status", icon: ShieldCheck, action: () => go("trust") },
                { title: "Plans & Tools", subtitle: "Manage Shamba access", icon: Crown, action: () => go("plans") },
              ].map((item) => { const Icon = item.icon; return <button key={item.title} type="button" onClick={item.action} className={PANEL + " flex w-full items-center gap-3 p-3 text-left"}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#133B43] text-[#4ED99B]"><Icon size={17}/></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-bold text-white">{item.title}</span><span className={"text-[9px] " + MUTED}>{item.subtitle}</span></span><ChevronRight size={15} className="text-[#7795A7]"/></button>; })}
            </div>
          </section>
        )}

        {screen === "plans" && (
          <section className="pt-4">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#153F35] text-[#5BE3A2]"><Sprout size={21}/></span><div><h1 className="text-[20px] font-black">Shamba Plans & Tools</h1><p className={"text-[10px] " + MUTED}>Choose a plan to unlock farm tools</p></div><Crown size={19} className="ml-auto text-amber-300"/></div>
            <div className="mt-4 rounded-2xl border border-[#1B594B] bg-gradient-to-br from-[#073D37] to-[#092A36] p-4"><p className="text-[11px] font-extrabold text-[#67E3AA]">YOUR CURRENT FARM ACCESS</p><p className="mt-2 text-[16px] font-black text-white">{dashboard?.subscription?.plan_name || dashboard?.plan_name || "Shamba access"}</p><p className={"mt-1 text-[10px] " + MUTED}>Current subscription details are loaded from your account when provided.</p><button type="button" onClick={refresh} className="mt-3 rounded-lg border border-[#2C795F] px-3 py-2 text-[10px] font-bold text-[#7BE7B1]">Refresh plan status</button></div>
            <div className="mt-4 rounded-2xl border border-[#163D50] bg-[#0A2237] p-3.5"><SectionHeading title="What you get"/>{["AI Farm Advisor", "Weather & Forecast", "Market Prices", "Farm Records", "Farm Alerts"].map((name) => <div key={name} className="flex items-center gap-2 py-1.5 text-[11px] text-[#D1E1E9]"><CheckCircle2 size={14} className="text-[#50D99A]"/>{name}</div>)}</div>
            <div className="mt-4 rounded-2xl border border-[#163D50] bg-[#0A2237] p-3.5"><HubRevenueOffers hub="shamba" compact /></div>
          </section>
        )}

        {screen === "manage" && (
          <section className="pt-4">
            <div className="mb-3 flex items-center justify-between gap-2"><div><h1 className="text-[20px] font-black">Farm Management</h1><p className={"text-[10px] " + MUTED}>Use the existing verified farm workflow</p></div><button type="button" onClick={() => go("farms")} className="text-[11px] font-bold text-[#4BDD9D]">Back to farms</button></div>
            <div className="rounded-2xl border border-[#244A5E] bg-[#0A2237] p-3 text-[11px] leading-5 text-[#C3D6DF]">Farm creation and profile updates use the existing Shamba workflow and backend validation. The form is opened below so your saved data and verification rules remain unchanged.</div>
            <button type="button" onClick={() => onNavigate?.("shamba/farms")} className={"mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[12px] font-extrabold " + ACTION}><Tractor size={15}/>Open farm registration</button>
          </section>
        )}

        {screen === "trust" && (
          <section className="pt-4">
            <div className="rounded-2xl border border-[#244A5E] bg-[#0A2237] p-4"><ShieldCheck size={22} className="text-[#4BDD9D]"/><h1 className="mt-2 text-[17px] font-black">Trust & Verification</h1><p className={"mt-1 text-[11px] leading-5 " + MUTED}>Farmer profile verification and each farm's rights review are separate checks.</p><div className="mt-4 space-y-3 text-[11px]"><div className="flex items-center justify-between gap-2"><span className={MUTED}>Farmer profile</span><b>{statusLabel(profileStatus)}</b></div><div className="flex items-center justify-between gap-2"><span className={MUTED}>Farm rights review</span><b>{statusLabel(selectedFarm?.legal_verification_status)}</b></div></div></div>
            <button type="button" onClick={() => onNavigate?.("shamba/trust")} className={"mt-3 w-full rounded-xl py-3 text-[12px] font-extrabold " + ACTION}>Open full verification workspace</button>
          </section>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#18394F] bg-[#041625]/95 px-2 pt-2 pb-[calc(7px+env(safe-area-inset-bottom))] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[560px] items-center gap-1">
          {[
            { key: "home", label: "Home", icon: Home },
            { key: "farms", label: "Farms", icon: Tractor },
            { key: "market", label: "Market", icon: ShoppingCart },
            { key: "alerts", label: "Alerts", icon: Bell },
          ].map((item) => { const Icon = item.icon; const active = screen === item.key || (item.key === "farms" && screen === "detail"); return <button key={item.key} type="button" onClick={() => go(item.key)} className={"relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 " + (active ? "text-[#42D99A]" : "text-[#6F8D9F]")}><span className="relative"><Icon size={18}/>{item.key === "alerts" && alertCount > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white">{alertCount}</span>}</span><span className="text-[9px] font-bold">{item.label}</span></button>; })}
          <button type="button" onClick={() => setMoreOpen(true)} className={"flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 " + (moreOpen ? "text-[#42D99A]" : "text-[#6F8D9F]")}><MoreHorizontal size={18}/><span className="text-[9px] font-bold">More</span></button>
        </div>
      </nav>

      {moreOpen && <div className="fixed inset-0 z-[80]">
        <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close more menu" className="absolute inset-0 bg-black/65"/>
        <div className="absolute bottom-0 left-0 right-0 max-h-[80svh] overflow-y-auto rounded-t-[24px] border border-[#24495D] bg-[#071C2C] p-4 pb-[calc(22px+env(safe-area-inset-bottom))] shadow-2xl">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#456376]"/>
          <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-[#4DDD9D]">Shamba</p><h2 className="mt-1 text-[17px] font-black">More tools</h2></div><button type="button" onClick={() => setMoreOpen(false)} className="rounded-lg p-2 text-[#9AB2C1]"><X size={19}/></button></div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { title: "Weather & Forecast", icon: CloudSun, key: "weather" },
              { title: "AI Farm Advisor", icon: MessageCircle, key: "advisor" },
              { title: "Farm Records", icon: ClipboardListIcon, key: "records" },
              { title: "Profile & Settings", icon: User, key: "profile" },
              { title: "Plans & Tools", icon: Crown, key: "plans" },
              { title: "Trust & Verification", icon: ShieldCheck, key: "trust" },
            ].map((item) => { const Icon = item.icon; return <button key={item.key} type="button" onClick={() => go(item.key)} className="flex items-center gap-2 rounded-xl border border-[#1A3D53] bg-[#0A2237] p-3 text-left text-[10px] font-bold text-[#D6E4EB]"><Icon size={17} className="shrink-0 text-[#4CDD9C]"/>{item.title}</button>; })}
          </div>
        </div>
      </div>}
    </div>
  );
}

function ClipboardListIcon(props) { return <Activity {...props}/>; }
