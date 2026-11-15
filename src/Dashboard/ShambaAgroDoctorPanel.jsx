import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Calculator, CalendarDays, Droplets, FlaskConical, Leaf, Loader2, RefreshCw, Sprout, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";

const AGRODOCTOR_URL = String(import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com").replace(/\/+$/, "");
const TOOLS = [
  { name: "fertilizer_plan", title: "Fertilizer plan", description: "Calculate product quantity from a soil-test-informed nutrient target and fertilizer grade.", icon: FlaskConical, fields: [
    ["area_ha","Farm area (hectares)","number","0.5"],["target_nutrient_kg_ha","Target nutrient (kg/ha)","number","60"],["nutrient_grade_percent","Fertilizer nutrient grade (%)","number","46"],["nutrient","Nutrient name","text","Nitrogen"]
  ]},
  { name: "irrigation_plan", title: "Irrigation planner", description: "Estimate crop water use, net irrigation and gross daily water volume.", icon: Droplets, fields: [
    ["reference_et_mm_day","Reference evapotranspiration (mm/day)","number","5"],["crop_coefficient","Crop coefficient (Kc)","number","1.0"],["effective_rain_mm_day","Effective rainfall (mm/day)","number","0"],["system_efficiency_percent","Irrigation system efficiency (%)","number","80"],["area_ha","Farm area (hectares)","number","1"]
  ]},
  { name: "farm_budget", title: "Farm profitability", description: "Estimate production, revenue, costs, profit and break-even price.", icon: Wallet, fields: [
    ["area_ha","Farm area (hectares)","number","1"],["expected_yield_kg_ha","Expected yield (kg/ha)","number","2000"],["selling_price_per_kg","Selling price per kg (KES)","number","50"],["seed","Seed cost (KES)","number","5000"],["fertilizer","Fertilizer cost (KES)","number","12000"],["labour","Labour cost (KES)","number","15000"],["other","Other costs (KES)","number","0"]
  ]},
  { name: "plant_population", title: "Plant population", description: "Estimate planting positions using area, row spacing, plant spacing and establishment rate.", icon: Sprout, fields: [
    ["area_ha","Farm area (hectares)","number","1"],["row_spacing_cm","Row spacing (cm)","number","75"],["plant_spacing_cm","Plant spacing (cm)","number","25"],["expected_establishment_percent","Expected establishment (%)","number","90"]
  ]},
  { name: "crop_calendar", title: "Crop activity calendar", description: "Create dated activities from your own crop-stage schedule.", icon: CalendarDays, fields: [
    ["crop","Crop name","text","Maize"],["planting_date","Planting date","date",new Date().toISOString().slice(0,10)],["scouting_day","First scouting (days after planting)","number","14"],["weeding_day","Weeding (days after planting)","number","21"],["topdressing_day","Top-dressing (days after planting)","number","35"],["harvest_day","Expected harvest (days after planting)","number","120"]
  ]}
];

function initialValues(tool) { return Object.fromEntries(tool.fields.map(([key,,type,value]) => [key, value])); }
function pretty(value) { return new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 }).format(Number(value)); }

export default function ShambaAgroDoctorPanel() {
  const { authFetch } = useAuth();
  const [selected, setSelected] = useState(TOOLS[0].name);
  const [values, setValues] = useState(() => initialValues(TOOLS[0]));
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [access, setAccess] = useState("checking");
  const tool = useMemo(() => TOOLS.find(item => item.name === selected) || TOOLS[0], [selected]);

  const checkAccess = useCallback(async () => {
    if (typeof authFetch !== "function") { setAccess("signed_out"); return; }
    try {
      const response = await authFetch(AGRODOCTOR_URL + "/api/agrodoctor/tools", { headers: { Accept: "application/json" } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw Object.assign(new Error(payload?.message || payload?.detail || "AgroDoctor access could not be verified."), { status: response.status });
      setAccess("ready");
      setError("");
    } catch (err) {
      setAccess(err.status === 401 ? "signed_out" : err.status === 403 ? "upgrade" : "unavailable");
      setError(err.message || "AgroDoctor is temporarily unavailable.");
    }
  }, [authFetch]);

  useEffect(() => { checkAccess(); }, [checkAccess]);

  const chooseTool = (name) => {
    const next = TOOLS.find(item => item.name === name) || TOOLS[0];
    setSelected(next.name); setValues(initialValues(next)); setResult(null); setError("");
  };

  const execute = async (event) => {
    event.preventDefault(); setBusy(true); setError(""); setResult(null);
    try {
      if (typeof authFetch !== "function") throw new Error("Your authenticated session is not ready. Sign in again.");
      let argumentsPayload;
      if (tool.name === "farm_budget") {
        argumentsPayload = {
          area_ha: Number(values.area_ha), expected_yield_kg_ha: Number(values.expected_yield_kg_ha),
          selling_price_per_kg: Number(values.selling_price_per_kg), currency: "KES",
          costs: { seed: Number(values.seed), fertilizer: Number(values.fertilizer), labour: Number(values.labour), other: Number(values.other) }
        };
      } else if (tool.name === "crop_calendar") {
        argumentsPayload = {
          crop: values.crop, planting_date: values.planting_date,
          stages: [
            { activity: "First crop scouting", days_after_planting: Number(values.scouting_day) },
            { activity: "Weeding", days_after_planting: Number(values.weeding_day) },
            { activity: "Top-dressing", days_after_planting: Number(values.topdressing_day) },
            { activity: "Expected harvest", days_after_planting: Number(values.harvest_day) }
          ]
        };
      } else {
        argumentsPayload = Object.fromEntries(Object.entries(values).map(([key,value]) => [key, ["nutrient"].includes(key) ? value : Number(value)]));
      }
      const response = await authFetch(AGRODOCTOR_URL + "/api/agrodoctor/tools/" + tool.name, {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ arguments: argumentsPayload })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw Object.assign(new Error(payload?.message || payload?.detail || "The calculation could not be completed."), { status: response.status });
      setResult(payload?.data?.result || payload?.result || payload?.data || payload);
    } catch (err) {
      setError(err.message || "The tool could not complete this calculation.");
      if (err.status === 401) setAccess("signed_out");
      if (err.status === 403) setAccess("upgrade");
    } finally { setBusy(false); }
  };

  const inputClass = "mt-1 w-full rounded-xl border border-[#244A5E] bg-[#061A29] px-3 py-2.5 text-[12px] text-white outline-none focus:border-[#38D99A]";
  return (
    <section className="space-y-3 pt-3">
      <div className="rounded-2xl border border-[#1B594B] bg-gradient-to-br from-[#073D37] to-[#092A36] p-4">
        <div className="flex items-center gap-2 text-[#68E5AC]"><Leaf size={18}/><span className="text-[10px] font-black uppercase tracking-[.16em]">RevelaAI · Agricultural tools</span></div>
        <h1 className="mt-2 text-[21px] font-black text-white">AgroDoctor</h1>
        <p className="mt-1 text-[11px] leading-5 text-[#B8D0D9]">Practical farm calculations powered by deterministic tools. No separate AI model is used for these calculations.</p>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-[#A8C7BD]"><Activity size={13}/> Five tools available in this release</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {TOOLS.map(item => { const Icon = item.icon; const active = item.name === selected; return (
          <button key={item.name} type="button" onClick={() => chooseTool(item.name)} className={"flex min-h-[72px] items-center gap-2 rounded-xl border p-3 text-left " + (active ? "border-[#36D99A] bg-[#103E37]" : "border-[#1A3D53] bg-[#0A2237]")}>
            <Icon size={17} className={active ? "text-[#55E2A4]" : "text-[#8BA6B8]"}/>
            <span className="text-[11px] font-bold text-white">{item.title}</span>
          </button>
        ); })}
      </div>

      <div className="rounded-2xl border border-[#17384F] bg-[#0A2237] p-4">
        <div className="mb-3"><h2 className="text-[14px] font-extrabold text-white">{tool.title}</h2><p className="mt-1 text-[11px] leading-5 text-[#8BA6B8]">{tool.description}</p></div>
        {access === "checking" ? <div className="flex items-center gap-2 py-5 text-[12px] text-[#9CB4C2]"><Loader2 size={16} className="animate-spin"/>Checking Shamba access…</div> :
         access === "signed_out" ? <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-3 text-[12px] text-amber-200">Sign in to use AgroDoctor with your RevelaCode account.</div> :
         access === "upgrade" ? <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-3 text-[12px] text-amber-200">AgroDoctor advanced tools require the Shamba advanced-analytics entitlement. Check your Shamba plan.</div> :
         access === "unavailable" ? <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-3 text-[12px] text-amber-200">{error || "The RevelaAI service is not reachable yet."}<button type="button" onClick={checkAccess} className="ml-2 underline">Retry</button></div> :
         <form onSubmit={execute} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {tool.fields.map(([key,label,type]) => <label key={key} className="block text-[11px] font-semibold text-[#C8D9E1]">{label}<input required type={type} min={type === "number" ? "0" : undefined} step={type === "number" ? "any" : undefined} value={values[key] ?? ""} onChange={event => setValues(prev => ({...prev,[key]:event.target.value}))} className={inputClass}/></label>)}
          </div>
          <button disabled={busy} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#20C987] px-4 py-3 text-[12px] font-black text-[#05251E] disabled:opacity-60">{busy ? <Loader2 size={15} className="animate-spin"/> : <Calculator size={15}/>} {busy ? "Calculating…" : "Run calculation"}</button>
        </form>}
        {error && access === "ready" && <p role="alert" className="mt-3 rounded-lg bg-rose-950/40 p-2 text-[11px] text-rose-200">{error}</p>}
        {result && <div className="mt-4 rounded-xl border border-[#27634F] bg-[#062B29] p-3">
          <div className="flex items-center justify-between"><h3 className="text-[12px] font-black text-[#6BE5AD]">Calculation result</h3><button type="button" onClick={() => setResult(null)} className="text-[10px] text-[#9CB4C2]">Clear</button></div>
          <div className="mt-2 space-y-2">
            {Object.entries(result).filter(([key]) => !["tool","caveat","cost_breakdown","events"].includes(key)).map(([key,value]) => <div key={key} className="flex items-start justify-between gap-3 border-b border-white/5 pb-1.5 text-[11px]"><span className="capitalize text-[#9CB4C2]">{key.replace(/_/g," ")}</span><strong className="max-w-[58%] break-words text-right text-white">{typeof value === "number" ? pretty(value) : String(value ?? "—")}</strong></div>)}
            {Array.isArray(result.events) && result.events.map((event,index) => <div key={index} className="rounded-lg bg-[#0A3A35] p-2 text-[11px]"><strong className="text-white">{event.activity}</strong><div className="text-[#A9C9C0]">{event.planned_date} · Day {event.days_after_planting}</div></div>)}
            {result.cost_breakdown && <div className="pt-1 text-[10px] text-[#A9C9C0]">Cost breakdown: {Object.entries(result.cost_breakdown).map(([key,value]) => key + ": KES " + pretty(value)).join(" · ")}</div>}
          </div>
          {result.caveat && <p className="mt-3 border-t border-white/10 pt-2 text-[10px] leading-5 text-amber-200">{result.caveat}</p>}
        </div>}
      </div>
      <p className="px-1 text-[10px] leading-5 text-[#7894A5]">Results are planning estimates, not laboratory measurements or crop prescriptions. Confirm inputs, product labels and local agronomist guidance before applying treatments or inputs.</p>
    </section>
  );
}
