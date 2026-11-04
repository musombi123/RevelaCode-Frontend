"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Database, RefreshCw, Sparkles } from "lucide-react";
import { useAdminApi } from "@/services/adminApi.jsx";

const HUBS = [
  { key: "all", label: "All areas" },
  { key: "community", label: "Community Center" },
  { key: "shamba", label: "Shamba" },
  { key: "biashara", label: "Biashara" },
  { key: "elimu", label: "Elimu" },
  { key: "marketplace", label: "Marketplace" },
  { key: "faith", label: "Faith & MissionPulse" },
  { key: "shared", label: "Shared services" },
];

function unwrap(response) {
  const payload = response?.data ?? response;
  return payload?.data ?? payload ?? {};
}
function formatValue(value) {
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return "—";
  return String(value);
}
function titleCase(value) {
  return String(value || "").replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function statusTone(status) {
  const value = String(status || "").toLowerCase();
  if (["active", "published", "completed", "paid", "verified"].includes(value)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300";
  }
  if (["pending", "pending_verification", "reviewing", "scheduled", "processing", "open", "partially_paid"].includes(value)) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300";
  }
  return "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

export default function AdminJumuiyaSamples() {
  const adminApi = useAdminApi();
  const [hub, setHub] = useState("all");
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  const loadSamples = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      let response = await adminApi.request("/api/jumuiya/admin/sample-records", {
        params: { hub },
        signal,
      });
      let data = unwrap(response);

      // A fresh database or a service that missed its startup seed can still
      // recover when an administrator opens the sample centre. This writes
      // only to the dedicated admin sample collection, never tenant data.
      if (hub === "all" && Number(data.total) === 0 && !signal?.aborted) {
        setSeeding(true);
        const seedResponse = await adminApi.request(
          "/api/jumuiya/admin/sample-records/seed",
          { method: "POST" },
        );
        const seedResult = unwrap(seedResponse);
        response = await adminApi.request("/api/jumuiya/admin/sample-records", {
          params: { hub },
          signal,
        });
        data = unwrap(response);
        if (!signal?.aborted) {
          setNotice(
            String(Number(seedResult.total) || Number(data.total) || 0) +
            " isolated sample records are ready. No live customer records were changed.",
          );
        }
      }

      if (signal?.aborted) return;
      setItems(Array.isArray(data.items) ? data.items : []);
      setCounts(data.counts_by_hub || {});
      setTotal(Number(data.total) || 0);
      setUpdatedAt(new Date());
    } catch (loadError) {
      if (loadError?.name !== "AbortError") {
        setItems([]);
        setError(loadError?.message || "Jumuiya sample records could not be loaded.");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [adminApi, hub]);

  useEffect(() => {
    const controller = new AbortController();
    loadSamples(controller.signal);
    return () => controller.abort();
  }, [loadSamples]);

  const seedSamples = async () => {
    setSeeding(true);
    setError("");
    setNotice("");
    try {
      const response = await adminApi.request("/api/jumuiya/admin/sample-records/seed", { method: "POST" });
      const result = unwrap(response);
      setNotice(String(Number(result.total) || 0) + " isolated sample records are ready. No live customer records were changed.");
      await loadSamples();
    } catch (seedError) {
      setError(seedError?.message || "Sample data could not be initialized.");
    } finally {
      setSeeding(false);
    }
  };

  const hubCards = useMemo(() => HUBS.filter((item) => item.key !== "all"), []);
  const activeHubLabel = HUBS.find((item) => item.key === hub)?.label || "All areas";

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"><Database className="h-5 w-5" /></div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Jumuiya Sample Data Centre</h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"><Sparkles className="h-3 w-3" /> Sample only</span>
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Preview representative records across Jumuiya, including Community Center, without creating fake customer accounts or changing live hub data.</p>
            </div>
          </div>
          <button type="button" onClick={seedSamples} disabled={seeding} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
            <RefreshCw className={"h-4 w-4 " + (seeding ? "animate-spin" : "")} />
            {seeding ? "Restoring samples…" : "Restore sample records"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 lg:grid-cols-7">
          {hubCards.map((item) => (
            <button key={item.key} type="button" onClick={() => setHub(item.key)} className={"min-h-[84px] rounded-xl border p-3 text-left transition " + (hub === item.key ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/30" : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700")}>
              <span className="block text-[11px] font-semibold leading-4 text-slate-500 dark:text-slate-400">{item.label}</span>
              <span className="mt-2 block text-2xl font-black tabular-nums text-slate-900 dark:text-white">{Number(counts[item.key]) || 0}</span>
            </button>
          ))}
        </div>
      </section>

      {error ? <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-semibold">Sample data could not be loaded</p><p className="mt-1 text-xs leading-5">{error}</p></div></div> : null}
      {notice ? <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><p>{notice}</p></div> : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">{activeHubLabel}</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{loading ? "Loading sample records…" : items.length + " records displayed · " + total + " records across all Jumuiya areas"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {HUBS.map((item) => <button key={item.key} type="button" onClick={() => setHub(item.key)} className={"rounded-lg px-3 py-2 text-xs font-semibold transition " + (hub === item.key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700")}>{item.label}</button>)}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((key) => <div key={key} className="h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div>
        ) : items.length ? (
          <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article key={item.sample_id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-950/30">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-blue-700 dark:text-blue-300">{item.module}</span>
                  <span className={"rounded-full border px-2 py-1 text-[10px] font-semibold " + statusTone(item.status)}>{titleCase(item.status)}</span>
                </div>
                <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.summary}</p>
                {item.location ? <p className="mt-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">{item.location}</p> : null}
                {item.details && Object.keys(item.details).length ? <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  {Object.entries(item.details).slice(0, 4).map(([key, value]) => <div key={key} className="min-w-0"><dt className="truncate text-[9px] font-semibold uppercase tracking-wide text-slate-400">{titleCase(key)}</dt><dd className="mt-0.5 break-words text-[11px] font-semibold text-slate-700 dark:text-slate-200">{formatValue(value)}</dd></div>)}
                </dl> : null}
                <div className="mt-4 border-t border-dashed border-slate-200 pt-3 dark:border-slate-800">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">{item.sample_label || "SAMPLE DATA"}</span>
                  <p className="mt-1 break-all font-mono text-[9px] text-slate-400">{item.sample_id}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center"><Database className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" /><p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">No sample records are available for this area.</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use Restore sample records to safely create the isolated training dataset.</p></div>
        )}
      </section>

      <p className="text-[11px] leading-5 text-slate-400">{updatedAt ? "Last refreshed " + updatedAt.toLocaleString() + ". " : ""}These records are stored only in the Jumuiya admin sample collection. They do not create login accounts, payments, public posts, real orders, or school/farm/business tenant data.</p>
    </div>
  );
}
