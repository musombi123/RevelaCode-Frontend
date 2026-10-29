import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Download,
  FileDown,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useElimuApi } from "@/services/elimuApi.jsx";

function unwrap(value) {
  let current = value;
  for (let index = 0; index < 6; index += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return current;
    if (Object.prototype.hasOwnProperty.call(current, "data")) {
      current = current.data;
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(current, "result")) {
      current = current.result;
      continue;
    }
    return current;
  }
  return current;
}

function money(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function csvCell(value) {
  let text = value === undefined || value === null ? "" : String(value);
  // Prevent values from being interpreted as spreadsheet formulas when opened in Excel.
  if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

function riskPresentation(row) {
  const band = String(row?.risk_band || "insufficient_data").toLowerCase();
  if (band === "high") return { label: "High signal", className: "bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300" };
  if (band === "moderate") return { label: "Needs follow-up", className: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300" };
  if (band === "low") return { label: "Low signal", className: "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300" };
  return { label: "Not enough data", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" };
}

function Metric({ label, value, detail, icon: Icon }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 break-words text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">{value}</p>
          {detail && <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
          <Icon size={19} />
        </span>
      </div>
    </article>
  );
}

export default function ElimuIntelligenceWorkspace({ role = "owner", school }) {
  const api = useElimuApi();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const normalizedRole = String(role || "").trim().toLowerCase();
  const canSeeRisk = ["owner", "principal", "bursar"].includes(normalizedRole);
  const canExportRegister = ["owner", "principal", "registrar"].includes(normalizedRole);

  const load = useCallback(async (isRefresh = false) => {
    if (!canSeeRisk) {
      setPayload(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    if (isRefresh) setRefreshing(true);
    setError("");
    setNotice("");
    try {
      if (typeof api.getFeeRiskSignals !== "function") {
        throw new Error("Elimu Intelligence API is not available in this frontend build.");
      }
      const result = await api.getFeeRiskSignals();
      const normalized = unwrap(result);
      if (!normalized || typeof normalized !== "object") {
        throw new Error("The server returned an invalid intelligence response.");
      }
      setPayload(normalized);
    } catch (loadError) {
      setError(loadError?.message || "Unable to load Elimu intelligence data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, canSeeRisk]);

  useEffect(() => {
    void load(false);
  }, [load]);

  const rows = useMemo(
    () => (Array.isArray(payload?.students) ? payload.students : []),
    [payload],
  );
  const voteheads = useMemo(
    () => (Array.isArray(payload?.voteheads) ? payload.voteheads : []),
    [payload],
  );
  const summary = payload?.summary || {};

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => [
      row.student_name,
      row.admission_number,
      row.class_name,
      row.risk_band,
    ].some((value) => String(value || "").toLowerCase().includes(term)));
  }, [rows, search]);

  const downloadRegister = useCallback(async () => {
    if (!canExportRegister || exporting) return;
    setExporting(true);
    setError("");
    setNotice("");
    try {
      if (typeof api.getStudentRegisterExport !== "function") {
        throw new Error("The student register export API is not available in this frontend build.");
      }
      const result = unwrap(await api.getStudentRegisterExport());
      const columns = Array.isArray(result?.columns) ? result.columns : [];
      const exportRows = Array.isArray(result?.rows) ? result.rows : [];
      if (!columns.length) throw new Error("The export returned no column definitions.");
      const lines = [
        columns.map(csvCell).join(","),
        ...exportRows.map((row) => columns.map((column) => csvCell(row?.[column])).join(",")),
      ];
      const blob = new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      anchor.href = url;
      anchor.download = `elimu-student-register-${date}.csv`;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setNotice(`CSV generated for ${Number(result.row_count ?? exportRows.length)} active student record(s). Check the current official KEMIS/NEMIS import format before uploading.`);
    } catch (exportError) {
      setError(exportError?.message || "Unable to generate the student register CSV.");
    } finally {
      setExporting(false);
    }
  }, [api, canExportRegister, exporting]);

  const schoolName = payload?.school?.name || school?.name || school?.school_name || "Your school";
  const methodology = payload?.methodology?.description
    || "Signals are calculated from recorded fee balances, payments and due dates.";

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/70 p-5 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-blue-950/30 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm"><Activity size={23} /></span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">Core-Zero · School operations intelligence</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-2xl">{schoolName}</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">Turn the school records you already maintain into explainable finance follow-up signals and portable student registers—without creating a second database.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canExportRegister && (
              <button type="button" onClick={() => void downloadRegister()} disabled={exporting} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
                {exporting ? <RefreshCw size={16} className="animate-spin" /> : <FileDown size={16} />}
                {exporting ? "Preparing CSV…" : "Export student register"}
              </button>
            )}
            {canSeeRisk && (
              <button type="button" onClick={() => void load(true)} disabled={loading} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            )}
          </div>
        </div>

        {error && <div role="alert" className="mx-5 mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200 sm:mx-6"><AlertCircle size={17} className="mt-0.5 shrink-0" /><span>{error}</span></div>}
        {notice && <div role="status" className="mx-5 mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200 sm:mx-6"><CheckCircle2 size={17} className="mt-0.5 shrink-0" /><span>{notice}</span></div>}

        <div className="p-5 sm:p-6">
          {canExportRegister && (
            <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
              <div className="flex items-start gap-3">
                <Download size={19} className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">KEMIS / NEMIS-ready register template</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Export active learners with UPI and NEMIS identifiers when present. This creates a CSV review file only; it does not log into, upload to, or certify compatibility with a government portal. Confirm the official field specification before submission.</p>
                </div>
              </div>
            </div>
          )}

          {canSeeRisk ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Students assessed" value={loading ? "—" : Number(summary.assessed || 0).toLocaleString("en-KE")} detail={`${Number(summary.insufficient_data || 0)} without enough fee history`} icon={TrendingUp} />
                <Metric label="High-risk signals" value={loading ? "—" : Number(summary.high_risk || 0).toLocaleString("en-KE")} detail="Prioritise a human review" icon={ShieldAlert} />
                <Metric label="Recorded fee balance" value={loading ? "—" : money(summary.balance)} detail="Outstanding across the recorded voteheads" icon={Wallet} />
                <Metric label="Voteheads detected" value={loading ? "—" : voteheads.length.toLocaleString("en-KE")} detail="Based on existing fee type / votehead fields" icon={Activity} />
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
                <section className="min-w-0 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-bold text-slate-950 dark:text-white">Fee follow-up signals</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Sorted by signal severity; open a conversation before drawing conclusions.</p>
                    </div>
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student, admission or class…" aria-label="Search fee signals" className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:max-w-xs" />
                  </div>
                  {loading ? (
                    <div className="flex min-h-44 items-center justify-center gap-2 text-sm text-slate-500"><RefreshCw size={16} className="animate-spin" />Calculating signals from school records…</div>
                  ) : filteredRows.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">
                          <tr><th className="px-4 py-3 font-bold">Student</th><th className="px-4 py-3 font-bold">Class</th><th className="px-4 py-3 font-bold">Balance</th><th className="px-4 py-3 font-bold">Overdue</th><th className="px-4 py-3 font-bold">Signal</th><th className="px-4 py-3 font-bold">Confidence</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filteredRows.map((row) => {
                            const badge = riskPresentation(row);
                            return (
                              <tr key={row.student_id || row.admission_number || row.student_name} className="align-top hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                                <td className="px-4 py-3"><p className="font-semibold text-slate-900 dark:text-white">{row.student_name || "Unnamed student"}</p><p className="mt-1 text-xs text-slate-500">{row.admission_number || "No admission number"}</p><p className="mt-1 text-xs text-slate-500">{Number(row.fee_records || 0)} fee record(s)</p></td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.class_name || "Not assigned"}</td>
                                <td className="px-4 py-3 font-semibold tabular-nums text-slate-900 dark:text-white">{money(row.balance)}</td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{Number(row.overdue_records || 0)}</td>
                                <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${badge.className}`}>{badge.label}{row.risk_score !== null && row.risk_score !== undefined ? ` · ${row.risk_score}/100` : ""}</span><p className="mt-2 max-w-sm whitespace-normal text-xs leading-5 text-slate-500 dark:text-slate-400">{Array.isArray(row.reasons) ? row.reasons.slice(0, 2).join(" ") : ""}</p></td>
                                <td className="px-4 py-3 text-xs capitalize text-slate-500 dark:text-slate-400">{String(row.confidence || "—").replace(/_/g, " ")}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">{rows.length ? "No students match this search." : "No active student fee records are available yet. Record fee assignments and payment history to enable meaningful signals."}</div>
                  )}
                </section>

                <section className="min-w-0 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                    <h3 className="font-bold text-slate-950 dark:text-white">Votehead overview</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Tuition, activity, lunch, transport and any custom fee types already stored.</p>
                  </div>
                  {voteheads.length ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {voteheads.map((item) => {
                        const required = Number(item.required || 0);
                        const balance = Number(item.balance || 0);
                        const percent = required > 0 ? Math.max(0, Math.min(100, ((required - balance) / required) * 100)) : 0;
                        return (
                          <div key={item.votehead} className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0"><p className="break-words text-sm font-semibold text-slate-900 dark:text-white">{item.votehead}</p><p className="mt-1 text-xs text-slate-500">{Number(item.records || 0)} record(s)</p></div>
                              <p className="shrink-0 text-sm font-bold tabular-nums text-slate-900 dark:text-white">{money(balance)}</p>
                            </div>
                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} /></div>
                            <div className="mt-2 flex justify-between gap-3 text-[11px] text-slate-500"><span>Paid {money(item.paid)}</span><span>Required {money(required)}</span></div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-sm text-slate-500 dark:text-slate-400">No votehead summary is available yet.</div>
                  )}
                </section>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/25">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" />
                <div><p className="text-sm font-bold text-amber-950 dark:text-amber-200">Human review is required</p><p className="mt-1 text-sm leading-6 text-amber-900 dark:text-amber-300">{methodology} Use these signals to prioritise supportive communication. They must not automatically block classes, terminate enrolment, or label a family as unwilling to pay.</p></div>
              </div>
            </>
          ) : (
            <section className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
              <h3 className="font-bold text-slate-950 dark:text-white">Finance intelligence is role-restricted</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Your current role can export the student register, but only the School Owner, Principal and Bursar can view finance-risk signals and votehead totals.</p>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}
