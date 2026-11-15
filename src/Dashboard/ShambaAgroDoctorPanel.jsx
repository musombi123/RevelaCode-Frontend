import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Calculator, Droplets, FlaskConical, Leaf, Loader2, Sprout, Wallet, Wheat } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";

const AGRODOCTOR_URL = String(import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com").replace(/\/+$/, "");
const TOOLS = [
  {
    name: "fertilizer_plan",
    title: "Fertilizer requirement",
    description: "Convert a supplied nutrient target and guaranteed fertilizer analysis into the product mass required for your measured field.",
    icon: FlaskConical,
    fields: [
      ["area_value", "Farm area", "number", "0.5"],
      ["target_nutrient_kg_per_ha", "Target nutrient (kg/ha)", "number", "60"],
      ["nutrient_percent", "Nutrient in product (%)", "number", "46"],
      ["nutrient", "Nutrient label", "text", "N"],
      ["bag_size_kg", "Bag size (kg)", "number", "50"],
    ],
  },
  {
    name: "irrigation_plan",
    title: "Irrigation water budget",
    description: "Estimate crop evapotranspiration, net and gross irrigation depth, and daily water volume from supplied field and weather inputs.",
    icon: Droplets,
    fields: [
      ["area_value", "Farm area (hectares)", "number", "1"],
      ["reference_et_mm_day", "Reference ET₀ (mm/day)", "number", "5"],
      ["crop_coefficient", "Crop coefficient (Kc)", "number", "1"],
      ["effective_rainfall_mm_day", "Effective rainfall (mm/day)", "number", "0"],
      ["application_efficiency_percent", "Application efficiency (%)", "number", "80"],
    ],
  },
  {
    name: "farm_budget",
    title: "Farm profitability",
    description: "Estimate production, gross revenue, net profit or loss, margin and break-even selling price using your own estimates.",
    icon: Wallet,
    fields: [
      ["area_value", "Farm area (hectares)", "number", "1"],
      ["expected_yield_kg_per_hectare", "Expected yield (kg/ha)", "number", "2000"],
      ["sale_price_per_kg", "Sale price per kg (KES)", "number", "50"],
      ["seed_cost", "Seed costs (KES)", "number", "5000"],
      ["fertilizer_cost", "Fertilizer costs (KES)", "number", "12000"],
      ["labour_cost", "Labour costs (KES)", "number", "15000"],
      ["other_cost", "Other costs (KES)", "number", "0"],
    ],
  },
  {
    name: "plant_population",
    title: "Plant population",
    description: "Estimate theoretical planting positions from measured field area and row and in-row spacing.",
    icon: Sprout,
    fields: [
      ["area_value", "Farm area (hectares)", "number", "1"],
      ["row_spacing_metres", "Row spacing (metres)", "number", "0.75"],
      ["plant_spacing_metres", "Plant spacing (metres)", "number", "0.25"],
    ],
  },
  {
    name: "seed_rate",
    title: "Seed-rate calculator",
    description: "Estimate seed quantity using a target established stand and the actual seed-lot germination, purity and thousand-seed weight.",
    icon: Wheat,
    fields: [
      ["area_value", "Farm area (hectares)", "number", "1"],
      ["target_plants_per_hectare", "Target established plants per hectare", "number", "53000"],
      ["thousand_seed_weight_grams", "Thousand-seed weight (g)", "number", "300"],
      ["germination_percent", "Germination test (%)", "number", "90"],
      ["physical_purity_percent", "Physical purity (%)", "number", "98"],
      ["sowing_buffer_percent", "Additional sowing buffer (%)", "number", "0"],
    ],
  },
];

function initialValues(tool) {
  return Object.fromEntries(tool.fields.map(([key, , , value]) => [key, value]));
}
function pretty(value) {
  return new Intl.NumberFormat("en-KE", { maximumFractionDigits: 3 }).format(Number(value));
}
function errorMessage(payload, fallback) {
  return payload?.message || payload?.error?.message || payload?.detail || fallback;
}

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
    if (typeof authFetch !== "function") {
      setAccess("signed_out");
      return;
    }
    try {
      const response = await authFetch(AGRODOCTOR_URL + "/api/agrodoctor/tools", {
        headers: { Accept: "application/json" },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw Object.assign(new Error(errorMessage(payload, "AgroDoctor access could not be verified.")), { status: response.status });
      }
      setAccess("ready");
      setError("");
    } catch (err) {
      setAccess(err.status === 401 ? "signed_out" : err.status === 402 || err.status === 403 ? "upgrade" : "unavailable");
      setError(err.message || "AgroDoctor is temporarily unavailable.");
    }
  }, [authFetch]);

  useEffect(() => { checkAccess(); }, [checkAccess]);

  const chooseTool = (name) => {
    const next = TOOLS.find(item => item.name === name) || TOOLS[0];
    setSelected(next.name);
    setValues(initialValues(next));
    setResult(null);
    setError("");
  };

  const buildArguments = () => {
    const number = key => Number(values[key]);
    const commonArea = { area_value: number("area_value"), area_unit: "hectare" };
    if (tool.name === "fertilizer_plan") {
      return {
        ...commonArea,
        target_nutrient_kg_per_ha: number("target_nutrient_kg_per_ha"),
        nutrient_percent: number("nutrient_percent"),
        nutrient: values.nutrient,
        ...(values.bag_size_kg ? { bag_size_kg: number("bag_size_kg") } : {}),
      };
    }
    if (tool.name === "irrigation_plan") {
      return {
        ...commonArea,
        reference_et_mm_day: number("reference_et_mm_day"),
        crop_coefficient: number("crop_coefficient"),
        effective_rainfall_mm_day: number("effective_rainfall_mm_day"),
        application_efficiency_percent: number("application_efficiency_percent"),
      };
    }
    if (tool.name === "farm_budget") {
      return {
        ...commonArea,
        expected_yield_kg_per_hectare: number("expected_yield_kg_per_hectare"),
        sale_price_per_kg: number("sale_price_per_kg"),
        total_production_cost: ["seed_cost", "fertilizer_cost", "labour_cost", "other_cost"]
          .reduce((total, key) => total + number(key), 0),
        currency: "KES",
      };
    }
    if (tool.name === "plant_population") {
      return {
        ...commonArea,
        row_spacing_metres: number("row_spacing_metres"),
        plant_spacing_metres: number("plant_spacing_metres"),
      };
    }
    return {
      ...commonArea,
      target_plants_per_hectare: number("target_plants_per_hectare"),
      thousand_seed_weight_grams: number("thousand_seed_weight_grams"),
      germination_percent: number("germination_percent"),
      physical_purity_percent: number("physical_purity_percent"),
      sowing_buffer_percent: number("sowing_buffer_percent"),
    };
  };

  const execute = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      if (typeof authFetch !== "function") {
        throw new Error("Your authenticated session is not ready. Sign in again.");
      }
      const response = await authFetch(AGRODOCTOR_URL + "/api/agrodoctor/tools/" + tool.name, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ arguments: buildArguments() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw Object.assign(new Error(errorMessage(payload, "The calculation could not be completed.")), { status: response.status });
      }
      setResult(payload?.data?.result || null);
      if (!payload?.data?.result) setError("The service returned no calculation result.");
    } catch (err) {
      setError(err.message || "The tool could not complete this calculation.");
      if (err.status === 401) setAccess("signed_out");
      if (err.status === 402 || err.status === 403) setAccess("upgrade");
    } finally {
      setBusy(false);
    }
  };

  const inputClass = "mt-1 w-full rounded-xl border border-[#244A5E] bg-[#061A29] px-3 py-2.5 text-[12px] text-white outline-none focus:border-[#38D99A]";
  const metricEntries = Object.entries(result?.result || {});
  return (
    <section className="space-y-3 pt-3">
      <div className="rounded-2xl border border-[#1B594B] bg-gradient-to-br from-[#073D37] to-[#092A36] p-4">
        <div className="flex items-center gap-2 text-[#68E5AC]"><Leaf size={18}/><span className="text-[10px] font-black uppercase tracking-[.16em]">RevelaAI · Agricultural tools</span></div>
        <h1 className="mt-2 text-[21px] font-black text-white">AgroDoctor</h1>
        <p className="mt-1 text-[11px] leading-5 text-[#B8D0D9]">Farm calculations executed by deterministic Python tools. No AI model is called to perform the calculations.</p>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-[#A8C7BD]"><Activity size={13}/> Five deterministic calculators</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {TOOLS.map(item => {
          const Icon = item.icon;
          const active = item.name === selected;
          return (
            <button key={item.name} type="button" onClick={() => chooseTool(item.name)} className={"flex min-h-[72px] items-center gap-2 rounded-xl border p-3 text-left " + (active ? "border-[#36D99A] bg-[#103E37]" : "border-[#1A3D53] bg-[#0A2237]")}>
              <Icon size={17} className={active ? "text-[#55E2A4]" : "text-[#8BA6B8]"}/>
              <span className="text-[11px] font-bold text-white">{item.title}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[#17384F] bg-[#0A2237] p-4">
        <div className="mb-3"><h2 className="text-[14px] font-extrabold text-white">{tool.title}</h2><p className="mt-1 text-[11px] leading-5 text-[#8BA6B8]">{tool.description}</p></div>
        {access === "checking" ? (
          <div className="flex items-center gap-2 py-5 text-[12px] text-[#9CB4C2]"><Loader2 size={16} className="animate-spin"/>Checking Shamba access…</div>
        ) : access === "signed_out" ? (
          <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-3 text-[12px] text-amber-200">Sign in to use AgroDoctor with your RevelaCode account.</div>
        ) : access === "upgrade" ? (
          <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-3 text-[12px] text-amber-200">AgroDoctor requires the Shamba advanced-analytics entitlement. Check your Shamba plan.</div>
        ) : access === "unavailable" ? (
          <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-3 text-[12px] text-amber-200">{error || "The RevelaAI service is not reachable yet."}<button type="button" onClick={checkAccess} className="ml-2 underline">Retry</button></div>
        ) : (
          <form onSubmit={execute} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {tool.fields.map(([key, label, type]) => (
                <label key={key} className="block text-[11px] font-semibold text-[#C8D9E1]">
                  {label}
                  <input required type={type} min={type === "number" ? "0" : undefined} step={type === "number" ? "any" : undefined} value={values[key] ?? ""} onChange={event => setValues(prev => ({ ...prev, [key]: event.target.value }))} className={inputClass}/>
                </label>
              ))}
            </div>
            <button disabled={busy} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#20C987] px-4 py-3 text-[12px] font-black text-[#05251E] disabled:opacity-60">{busy ? <Loader2 size={15} className="animate-spin"/> : <Calculator size={15}/>} {busy ? "Calculating…" : "Run calculation"}</button>
          </form>
        )}
        {error && access === "ready" && <p role="alert" className="mt-3 rounded-lg bg-rose-950/40 p-2 text-[11px] text-rose-200">{error}</p>}
        {result && (
          <div className="mt-4 rounded-xl border border-[#27634F] bg-[#062B29] p-3">
            <div className="flex items-center justify-between"><h3 className="text-[12px] font-black text-[#6BE5AD]">Calculation result</h3><button type="button" onClick={() => setResult(null)} className="text-[10px] text-[#9CB4C2]">Clear</button></div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {metricEntries.map(([key, value]) => (
                <div key={key} className="rounded-lg border border-white/5 bg-white/[0.03] p-2">
                  <div className="text-[9px] font-semibold uppercase tracking-wide text-[#9CB4C2]">{key.replace(/_/g, " ")}</div>
                  <div className="mt-1 break-words text-[13px] font-black text-white">{typeof value === "number" ? pretty(value) : String(value ?? "—")}</div>
                </div>
              ))}
            </div>
            {Array.isArray(result.assumptions) && <div className="mt-3 border-t border-white/10 pt-2"><div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-amber-200">Assumptions & limitations</div><ul className="list-disc space-y-1 pl-4 text-[10px] leading-5 text-[#C4D5D9]">{result.assumptions.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
          </div>
        )}
      </div>
      <p className="px-1 text-[10px] leading-5 text-[#7894A5]">Results are calculations from inputs you provide, not laboratory measurements, crop prescriptions or guaranteed forecasts. Confirm agronomic inputs with seed labels, soil tests and local extension guidance.</p>
    </section>
  );
}
