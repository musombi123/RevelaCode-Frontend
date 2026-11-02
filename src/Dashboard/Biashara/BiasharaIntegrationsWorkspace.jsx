import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle, CheckCircle2, Clock3, ExternalLink, MessageCircle,
  RefreshCw, ShieldCheck, Smartphone, FileCheck2,
} from "lucide-react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

function unwrap(value) {
  return value?.data?.data ?? value?.data ?? value?.result ?? value;
}

function StatusCard({ title, subtitle, icon: Icon, state, ready, checks, blockers, note }) {
  const passed = Object.values(checks || {}).filter(Boolean).length;
  const total = Object.keys(checks || {}).length;
  const tone = ready
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-amber-200 bg-amber-50 text-amber-900";
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Icon size={20}/></span>
          <div className="min-w-0"><h2 className="font-bold text-slate-950">{title}</h2><p className="mt-0.5 text-xs text-slate-500">{subtitle}</p></div>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${tone}`}>{ready ? "Ready" : "Setup pending"}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{String(state || "not_configured").replace(/_/g, " ")}</span>
        {total ? <span className="text-slate-500">{passed}/{total} configuration checks passed</span> : null}
      </div>
      {total ? <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {Object.entries(checks).map(([key, value]) => <div key={key} className="flex items-center gap-2 text-xs">
          {value ? <CheckCircle2 size={14} className="shrink-0 text-emerald-600"/> : <AlertCircle size={14} className="shrink-0 text-amber-600"/>}
          <span className={value ? "text-slate-700" : "text-slate-500"}>{key.replace(/_/g, " ")}</span>
        </div>)}
      </div> : null}
      {blockers?.length ? <div className="mt-3 rounded-xl bg-amber-50 p-3">
        <p className="text-xs font-bold text-amber-900">Still required</p>
        <ul className="mt-1 space-y-1">{blockers.map((item) => <li key={item} className="text-xs text-amber-800">{String(item).replace(/_/g, " ")}</li>)}</ul>
      </div> : null}
      {note ? <p className="mt-3 text-xs leading-5 text-slate-500">{note}</p> : null}
    </section>
  );
}

export default function BiasharaIntegrationsWorkspace({ business, onRefresh }) {
  const { getBiasharaIntegrationsStatus } = useJumuiyaApi();
  const businessId = String(business?.id || business?._id || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getBiasharaIntegrationsStatus(businessId);
      setData(unwrap(result) || {});
    } catch (err) {
      setError(err?.message || "Integration readiness could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [businessId, getBiasharaIntegrationsStatus]);

  useEffect(() => { load(); }, [load]);

  const mpesa = data?.mpesa || {};
  const etims = data?.etims || {};
  const whatsapp = data?.whatsapp || {};

  return (
    <div className="min-h-full bg-slate-50 px-3 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-screen-2xl space-y-4">
        <header className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 text-white shadow-lg sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-300/10 px-3 py-1 text-xs font-semibold text-indigo-200"><ShieldCheck size={14}/> Provider readiness</div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Integrations & Compliance</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Configuration status for {business?.name || "this company"}. Secrets stay in the backend environment; this screen only reports readiness checks.</p>
            </div>
            <button type="button" onClick={load} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""}/> Refresh status</button>
          </div>
        </header>

        {error ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div> : null}
        {loading && !data ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Checking backend configuration…</div> : null}

        {data ? <div className="grid gap-4 xl:grid-cols-2">
          <StatusCard
            title="M-Pesa Daraja"
            subtitle="Invoice STK Push and provider reconciliation"
            icon={Smartphone}
            state={mpesa.environment}
            ready={Boolean(mpesa.ready)}
            checks={mpesa.checks}
            blockers={mpesa.blockers}
            note={mpesa.note}
          />
          <StatusCard
            title="KRA eTIMS"
            subtitle="OSCU / VSCU system-to-system tax invoicing"
            icon={FileCheck2}
            state={etims.state}
            ready={Boolean(etims.submission_enabled)}
            checks={etims.checks}
            blockers={etims.blockers}
            note={etims.note}
          />
          <StatusCard
            title="WhatsApp Cloud API"
            subtitle="Business notifications and employee-authorized queries"
            icon={MessageCircle}
            state={whatsapp.state}
            ready={Boolean(whatsapp.business_commands_enabled)}
            checks={whatsapp.checks}
            blockers={whatsapp.blockers}
            note={whatsapp.note}
          />
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Clock3 size={20}/></span><div><h2 className="font-bold text-slate-950">Production activation gates</h2><p className="mt-0.5 text-xs text-slate-500">Do not switch a provider to live based on configuration alone.</p></div></div>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-xs leading-5 text-slate-600">
              <li>Store provider credentials only in the RevelaCode Backend environment.</li>
              <li>Complete sandbox and low-value end-to-end tests with the exact company and invoice flow.</li>
              <li>For eTIMS, complete KRA's required system-to-system testing, vetting and certification before treating a submission as a valid tax invoice.</li>
              <li>Verify callbacks, reconciliation, duplicate protection and audit records before enabling production operations.</li>
            </ol>
            <p className="mt-4 text-xs text-slate-500">A successful M-Pesa payment and a KRA-accepted tax invoice are separate events.</p>
            <a href="https://www.kra.go.ke/business/etims-electronic-tax-invoice-management-system/learn-about-etims/etims-system-to-system-integration" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline">KRA system-to-system guidance <ExternalLink size={13}/></a>
          </section>
        </div> : null}

        <footer className="rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-500">
          Readiness checks do not prove provider credentials are valid, a callback endpoint is reachable, or a tax invoice has been accepted. All final payment and tax statuses must come from verified provider responses.
        </footer>
      </div>
    </div>
  );
}
