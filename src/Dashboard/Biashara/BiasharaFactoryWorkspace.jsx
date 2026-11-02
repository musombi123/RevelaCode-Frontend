import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, CheckCircle2, ClipboardCheck, Cog, Factory,
  Gauge, Package, Plus, RefreshCw, ShieldCheck, Wrench,
} from "lucide-react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

const TABS = [
  { id: "overview", label: "Factory overview", icon: Gauge },
  { id: "production", label: "Production", icon: Factory },
  { id: "quality", label: "Quality", icon: ClipboardCheck },
  { id: "machines", label: "Machines", icon: Cog },
];

function unwrap(value) {
  return value?.data?.data ?? value?.data ?? value?.result ?? value;
}

function rowsOf(value) {
  const result = unwrap(value);
  if (Array.isArray(result)) return result;
  for (const key of ["items", "results", "rows", "batches", "machines", "checks", "alerts", "products"]) {
    if (Array.isArray(result?.[key])) return result[key];
  }
  return [];
}

function idOf(row) {
  return String(row?.id || row?._id || "");
}

function quantity(value) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue)
    ? new Intl.NumberFormat("en-KE", { maximumFractionDigits: 3 }).format(numberValue)
    : "0";
}

function statusText(value) {
  return String(value || "unknown").replace(/[_-]+/g, " ");
}

function Field({ label, value, onChange, type = "text", required = false, step }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        required={required}
        step={step}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
      />
    </label>
  );
}

function Panel({ title, description, action, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-950">{title}</h2>
          {description ? <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value, helper, tone = "default" }) {
  const toneClass = tone === "warning"
    ? "border-amber-200 bg-amber-50"
    : tone === "success"
      ? "border-emerald-200 bg-emerald-50"
      : "border-slate-200 bg-white";
  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function Empty({ children }) {
  return <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">{children}</div>;
}

export default function BiasharaFactoryWorkspace({ business, onRefresh }) {
  const {
    businessId,
    getBiasharaFactoryOverview,
    getBiasharaProductionBatches,
    createBiasharaProductionBatch,
    completeBiasharaProductionBatch,
    getBiasharaMachines,
    createBiasharaMachine,
    recordBiasharaMachineReading,
    getBiasharaQualityChecks,
    inspectBiasharaQuality,
    getBiasharaFactoryAlerts,
    getBiasharaProducts,
  } = useJumuiyaApi();

  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState({});
  const [batches, setBatches] = useState([]);
  const [machines, setMachines] = useState([]);
  const [qualityChecks, setQualityChecks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [batchForm, setBatchForm] = useState({
    batch_number: "",
    raw_material_product_id: "",
    output_product_id: "",
    input_quantity: "",
    expected_output_quantity: "",
  });
  const [completionForms, setCompletionForms] = useState({});
  const [qualityForms, setQualityForms] = useState({});
  const [machineForm, setMachineForm] = useState({
    name: "",
    machine_code: "",
    line: "",
    location: "",
    minimum_output_per_hour: "0",
  });
  const [readingForms, setReadingForms] = useState({});

  const currency = String(business?.currency || "KES").toUpperCase();
  const businessId = String(business?.id || business?._id || "");
  const materialProducts = useMemo(() => {
    const classified = products.filter((item) =>
      ["raw_material", "raw material", "raw"].includes(String(item?.production_type || item?.inventory_type || "").toLowerCase()) ||
      item?.is_raw_material === true
    );
    return classified.length ? classified : products;
  }, [products]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const tasks = await Promise.allSettled([
      getBiasharaFactoryOverview(businessId),
      getBiasharaProductionBatches(businessId),
      getBiasharaMachines(businessId),
      getBiasharaQualityChecks(businessId),
      getBiasharaFactoryAlerts(businessId),
      getBiasharaProducts({ limit: 100 }, { businessId }),
    ]);
    const [overviewResult, batchesResult, machinesResult, checksResult, alertsResult, productsResult] = tasks;
    const failures = tasks.filter((task) => task.status === "rejected");
    if (overviewResult.status === "fulfilled") setOverview(unwrap(overviewResult.value) || {});
    if (batchesResult.status === "fulfilled") setBatches(rowsOf(batchesResult.value));
    if (machinesResult.status === "fulfilled") setMachines(rowsOf(machinesResult.value));
    if (checksResult.status === "fulfilled") setQualityChecks(rowsOf(checksResult.value));
    if (alertsResult.status === "fulfilled") setAlerts(rowsOf(alertsResult.value));
    if (productsResult.status === "fulfilled") setProducts(rowsOf(productsResult.value));
    if (failures.length) {
      setError(failures.map((failure) => failure.reason?.message || "A factory service could not be loaded.").join(" "));
    }
    setLoading(false);
  }, [
    getBiasharaFactoryOverview,
    getBiasharaProductionBatches,
    getBiasharaMachines,
    getBiasharaQualityChecks,
    getBiasharaFactoryAlerts,
    getBiasharaProducts,
  ]);

  useEffect(() => { load(); }, [load]);

  const notifySuccess = (message) => {
    setNotice(message);
    setError("");
  };

  const runAction = async (action, successMessage) => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await action();
      notifySuccess(successMessage);
      await load();
      if (typeof onRefresh === "function") await onRefresh();
    } catch (err) {
      setError(err?.message || err?.error || "The factory operation failed.");
    } finally {
      setSaving(false);
    }
  };

  const startBatch = (event) => {
    event.preventDefault();
    runAction(async () => {
      await createBiasharaProductionBatch(businessId, {
        ...batchForm,
        batch_number: batchForm.batch_number.trim() || `BATCH-${Date.now()}`,
        input_quantity: Number(batchForm.input_quantity),
        expected_output_quantity: Number(batchForm.expected_output_quantity),
      });
      setBatchForm({
        batch_number: "",
        raw_material_product_id: "",
        output_product_id: "",
        input_quantity: "",
        expected_output_quantity: "",
      });
    }, "Production batch started. Raw-material stock has been issued to the batch.");
  };

  const completeBatch = (event, batch) => {
    event.preventDefault();
    const form = completionForms[idOf(batch)] || {};
    runAction(() => completeBiasharaProductionBatch(businessId, idOf(batch), {
      actual_output_quantity: Number(form.actual_output_quantity),
      wastage_quantity: Number(form.wastage_quantity || 0),
      recoverable_byproducts_quantity: Number(form.recoverable_byproducts_quantity || 0),
      notes: form.notes || "",
    }), "Batch completed and moved to the quality hold queue.");
  };

  const inspectBatch = (event, batch) => {
    event.preventDefault();
    const form = qualityForms[idOf(batch)] || { grade: "A", inspection_notes: "" };
    runAction(() => inspectBiasharaQuality(businessId, {
      batch_id: idOf(batch),
      grade: form.grade,
      inspection_notes: form.inspection_notes || "",
    }), form.grade === "REJECTED"
      ? "Batch rejected. Finished goods were not released to inventory."
      : `Quality grade ${form.grade} accepted. Finished goods were released to inventory.`);
  };

  const registerMachine = (event) => {
    event.preventDefault();
    runAction(async () => {
      await createBiasharaMachine(businessId, {
        ...machineForm,
        name: machineForm.name.trim(),
        machine_code: machineForm.machine_code.trim().toUpperCase(),
        minimum_output_per_hour: Number(machineForm.minimum_output_per_hour || 0),
      });
      setMachineForm({ name: "", machine_code: "", line: "", location: "", minimum_output_per_hour: "0" });
    }, "Machine registered.");
  };

  const submitReading = (event, machine) => {
    event.preventDefault();
    const form = readingForms[idOf(machine)] || {};
    runAction(() => recordBiasharaMachineReading(businessId, idOf(machine), {
      operating_hours: Number(form.operating_hours),
      output_quantity: Number(form.output_quantity || 0),
      notes: form.notes || "",
    }), "Machine reading saved.");
  };

  const inProgress = batches.filter((batch) => batch.status === "in_progress");
  const qualityQueue = batches.filter((batch) => batch.status === "quality_hold");
  const released = batches.filter((batch) => batch.status === "released");
  const batchCounts = overview?.batch_counts || {};

  return (
    <div className="min-h-full bg-slate-50 px-3 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto w-full max-w-screen-2xl space-y-4">
        <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 text-white shadow-lg sm:rounded-3xl sm:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                <Factory size={14} /> Manufacturing workspace
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Production & Factory Centre</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Track material input, finished output, wastage, quality release and machine performance for {business?.name || "this company"}.
              </p>
            </div>
            <button type="button" onClick={load} disabled={loading || saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh factory data
            </button>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2">
          {TABS.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${tab === item.id ? "bg-emerald-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                <Icon size={16} /> {item.label}
              </button>
            );
          })}
        </nav>

        {error ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div> : null}
        {notice ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div> : null}

        {tab === "overview" ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Batches in progress" value={batchCounts.in_progress ?? inProgress.length} helper="Material already issued" />
              <Metric label="Quality hold" value={batchCounts.quality_hold ?? qualityQueue.length} helper="Awaiting inspection" tone="warning" />
              <Metric label="Released batches" value={batchCounts.released ?? released.length} helper="Passed quality" tone="success" />
              <Metric label="Active machines" value={overview?.machines_active ?? machines.length} helper="Registered and active" />
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <Panel title="Production pipeline" description="Every batch must pass completion and quality inspection before finished goods enter saleable stock.">
                {loading ? <p className="text-sm text-slate-500">Loading production data…</p> : batches.length ? (
                  <div className="space-y-3">
                    {batches.slice(0, 8).map((batch) => (
                      <div key={idOf(batch)} className="flex flex-col gap-2 rounded-xl border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{batch.batch_number}</p>
                          <p className="mt-1 text-xs text-slate-500">{quantity(batch.input_quantity)} input · {batch.actual_output_quantity == null ? "Output pending" : `${quantity(batch.actual_output_quantity)} output`}</p>
                        </div>
                        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">{statusText(batch.status)}</span>
                      </div>
                    ))}
                  </div>
                ) : <Empty>No production batches have been created.</Empty>}
              </Panel>
              <Panel title="Factory alerts" description="Machine performance alerts raised from recorded output readings.">
                {alerts.length ? alerts.slice(0, 8).map((alert) => (
                  <div key={idOf(alert)} className="flex gap-3 border-b border-slate-100 py-3 last:border-0">
                    <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-600" />
                    <div><p className="text-sm font-semibold text-slate-900">{alert.message || statusText(alert.type)}</p><p className="mt-1 text-xs text-slate-500">{alert.created_at ? new Date(alert.created_at).toLocaleString("en-KE") : "Time unavailable"}</p></div>
                  </div>
                )) : <Empty>No active machine alerts.</Empty>}
              </Panel>
            </div>
          </div>
        ) : null}

        {tab === "production" ? (
          <div className="space-y-4">
            <Panel title="Start a production batch" description="Raw material is deducted from stock when the batch is started. Both products must exist in this business inventory.">
              <form onSubmit={startBatch} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Field label="Batch reference (optional)" value={batchForm.batch_number} onChange={(value) => setBatchForm((current) => ({ ...current, batch_number: value }))} />
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Raw-material product</span><select required value={batchForm.raw_material_product_id} onChange={(event) => setBatchForm((current) => ({ ...current, raw_material_product_id: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"><option value="">Select raw material</option>{materialProducts.map((product) => <option key={idOf(product)} value={idOf(product)}>{product.name} · {quantity(product.stock_quantity)} {product.unit || "units"}</option>)}</select></label>
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Finished-goods product</span><select required value={batchForm.output_product_id} onChange={(event) => setBatchForm((current) => ({ ...current, output_product_id: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"><option value="">Select finished product</option>{products.map((product) => <option key={idOf(product)} value={idOf(product)}>{product.name} · {product.unit || "units"}</option>)}</select></label>
                <Field label="Raw material input quantity" type="number" step="0.001" required value={batchForm.input_quantity} onChange={(value) => setBatchForm((current) => ({ ...current, input_quantity: value }))} />
                <Field label="Expected finished output quantity" type="number" step="0.001" required value={batchForm.expected_output_quantity} onChange={(value) => setBatchForm((current) => ({ ...current, expected_output_quantity: value }))} />
                <div className="flex items-end"><button disabled={saving} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"><Plus size={16} /> {saving ? "Starting…" : "Start batch"}</button></div>
              </form>
              <p className="mt-3 text-xs leading-5 text-slate-500">Product categories are not used as an authorization shortcut. Choose the correct raw-material and finished-goods SKUs. Stock deduction and the batch event are committed together through a MongoDB transaction.</p>
            </Panel>

            <Panel title="Active production batches" description="Complete output accounting for each batch. All material input must be assigned to finished output, wastage or recoverable by-products.">
              {inProgress.length ? <div className="space-y-3">{inProgress.map((batch) => {
                const form = completionForms[idOf(batch)] || {};
                return <form key={idOf(batch)} onSubmit={(event) => completeBatch(event, batch)} className="rounded-xl border border-slate-200 p-3">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold text-slate-900">{batch.batch_number}</p><p className="text-xs text-slate-500">Input: {quantity(batch.input_quantity)} · Expected: {quantity(batch.expected_output_quantity)}</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">In progress</span></div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Actual finished output" type="number" step="0.001" required value={form.actual_output_quantity || ""} onChange={(value) => setCompletionForms((current) => ({ ...current, [idOf(batch)]: { ...current[idOf(batch)], actual_output_quantity: value } }))} />
                    <Field label="Wastage" type="number" step="0.001" value={form.wastage_quantity ?? "0"} onChange={(value) => setCompletionForms((current) => ({ ...current, [idOf(batch)]: { ...current[idOf(batch)], wastage_quantity: value } }))} />
                    <Field label="Recoverable by-products" type="number" step="0.001" value={form.recoverable_byproducts_quantity ?? "0"} onChange={(value) => setCompletionForms((current) => ({ ...current, [idOf(batch)]: { ...current[idOf(batch)], recoverable_byproducts_quantity: value } }))} />
                  </div>
                  <div className="mt-3 flex justify-end"><button disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 size={15} /> Complete and send to quality</button></div>
                </form>;
              })}</div> : <Empty>No batches are currently in progress.</Empty>}
            </Panel>
          </div>
        ) : null}

        {tab === "quality" ? (
          <Panel title="Quality inspection queue" description="Only a passing inspection releases finished goods into available inventory. Rejected batches remain blocked.">
            {qualityQueue.length ? <div className="space-y-3">{qualityQueue.map((batch) => {
              const form = qualityForms[idOf(batch)] || { grade: "A", inspection_notes: "" };
              return <form key={idOf(batch)} onSubmit={(event) => inspectBatch(event, batch)} className="rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold text-slate-900">{batch.batch_number}</p><p className="mt-1 text-xs text-slate-500">Input {quantity(batch.input_quantity)} · Output {quantity(batch.actual_output_quantity)} · Wastage {quantity(batch.wastage_quantity)} · Yield {quantity(batch.yield_percent)}%</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">Quality hold</span></div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Inspection grade</span><select value={form.grade} onChange={(event) => setQualityForms((current) => ({ ...current, [idOf(batch)]: { ...current[idOf(batch)], grade: event.target.value } }))} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="A">Grade A</option><option value="B">Grade B</option><option value="C">Grade C</option><option value="REJECTED">Reject batch</option></select></label><Field label="Inspection notes" value={form.inspection_notes || ""} onChange={(value) => setQualityForms((current) => ({ ...current, [idOf(batch)]: { ...current[idOf(batch)], inspection_notes: value } }))} /></div>
                <div className="mt-3 flex justify-end"><button disabled={saving} className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-white disabled:opacity-50 ${form.grade === "REJECTED" ? "bg-rose-700" : "bg-emerald-700"}`}><ShieldCheck size={15} /> {form.grade === "REJECTED" ? "Reject batch" : "Approve and release stock"}</button></div>
              </form>;
            })}</div> : <Empty>The quality queue is clear. Completed production batches appear here.</Empty>}
          </Panel>
        ) : null}

        {tab === "machines" ? (
          <div className="space-y-4">
            <Panel title="Register a machine" description="Create a machine record and set the minimum output-per-hour threshold used for operational alerts.">
              <form onSubmit={registerMachine} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Field label="Machine name" required value={machineForm.name} onChange={(value) => setMachineForm((current) => ({ ...current, name: value }))} />
                <Field label="Machine ID / code" required value={machineForm.machine_code} onChange={(value) => setMachineForm((current) => ({ ...current, machine_code: value }))} />
                <Field label="Production line" value={machineForm.line} onChange={(value) => setMachineForm((current) => ({ ...current, line: value }))} />
                <Field label="Location" value={machineForm.location} onChange={(value) => setMachineForm((current) => ({ ...current, location: value }))} />
                <Field label="Minimum output per hour" type="number" step="0.001" value={machineForm.minimum_output_per_hour} onChange={(value) => setMachineForm((current) => ({ ...current, minimum_output_per_hour: value }))} />
                <div className="flex items-end"><button disabled={saving} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-50"><Plus size={16} /> Register machine</button></div>
              </form>
            </Panel>
            <Panel title="Machine register and hourly readings" description="Workers record operating hours and output. Readings below a configured threshold create an open alert for management.">
              {machines.length ? <div className="space-y-3">{machines.map((machine) => {
                const form = readingForms[idOf(machine)] || {};
                return <div key={idOf(machine)} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold text-slate-900">{machine.name} · {machine.machine_code}</p><p className="mt-1 text-xs text-slate-500">{machine.line || "No production line"} · {machine.location || "Location not set"}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold capitalize text-emerald-800">{machine.status || "active"}</span></div>
                  <p className="mt-2 text-xs text-slate-500">Last output: {machine.last_output_per_hour == null ? "No reading" : `${quantity(machine.last_output_per_hour)} per hour`} · Minimum: {quantity(machine.minimum_output_per_hour)} per hour</p>
                  <form onSubmit={(event) => submitReading(event, machine)} className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Field label="Operating hours" type="number" step="0.01" required value={form.operating_hours || ""} onChange={(value) => setReadingForms((current) => ({ ...current, [idOf(machine)]: { ...current[idOf(machine)], operating_hours: value } }))} />
                    <Field label="Output quantity" type="number" step="0.001" required value={form.output_quantity || ""} onChange={(value) => setReadingForms((current) => ({ ...current, [idOf(machine)]: { ...current[idOf(machine)], output_quantity: value } }))} />
                    <div className="flex items-end"><button disabled={saving} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 disabled:opacity-50"><Activity size={15} /> Save hourly reading</button></div>
                  </form>
                </div>;
              })}</div> : <Empty>No machines are registered yet.</Empty>}
            </Panel>
          </div>
        ) : null}

        <footer className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Core-Zero factory records are company-scoped. A quality pass is required before finished stock is sellable.</span>
          <span className="inline-flex items-center gap-1.5"><Package size={14} /> Currency: {currency}</span>
        </footer>
      </div>
    </div>
  );
}
