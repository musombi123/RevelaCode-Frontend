import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileBarChart,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import { useElimuApi } from "@/services/elimuApi.jsx";

function unwrap(value) {
  let current = value;
  for (let depth = 0; depth < 6; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return current;
    if (current.success === false || current.ok === false) {
      throw new Error(current.message || current.error || "The finance service returned an error.");
    }
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

function getRows(value, keys) {
  const data = unwrap(value);
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (data?.data) return getRows(data.data, keys);
  return [];
}

function errorText(error) {
  return error?.payload?.message || error?.payload?.error?.message || error?.message
    || "The finance request could not be completed.";
}

function kes(value) {
  return "KES " + new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function statusPresentation(status) {
  const normalized = String(status || "not_assessed").trim().toLowerCase();
  if (normalized === "paid") return { label: "Paid", className: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" };
  if (normalized === "partial") return { label: "Part-paid", className: "bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300" };
  if (normalized === "overdue") return { label: "Overdue", className: "bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300" };
  if (normalized === "pending") return { label: "Unpaid", className: "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300" };
  return { label: "No fee assigned", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" };
}

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400"><Icon size={16} />{label}</div>
      <p className="mt-2 break-words text-xl font-extrabold text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </article>
  );
}

export default function ElimuBursarDashboard({ school, onRefresh, refreshing = false }) {
  const api = useElimuApi();
  const [students, setStudents] = useState([]);
  const [feeSummary, setFeeSummary] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [working, setWorking] = useState("");
  const [studentIdentifier, setStudentIdentifier] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [findingStudent, setFindingStudent] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const results = await Promise.allSettled([
      typeof api.getFinanceFeeStatus === "function"
        ? api.getFinanceFeeStatus()
        : Promise.reject(new Error("Finance fee-status endpoint is not available in this frontend build.")),
      api.getFeesReport(),
      api.getSchoolFeeReceipts({ status: "pending" }),
      api.getSchoolPaymentAccounts(),
    ]);
    const failures = [];

    if (results[0].status === "fulfilled") {
      const payload = unwrap(results[0].value) || {};
      setStudents(getRows(payload, ["students", "items", "records"]));
      setFeeSummary(payload.summary || null);
    } else {
      failures.push("Student fee status: " + errorText(results[0].reason));
    }
    if (results[1].status === "fulfilled") {
      setReportSummary(unwrap(results[1].value) || null);
    } else {
      failures.push("Fee totals: " + errorText(results[1].reason));
    }
    if (results[2].status === "fulfilled") {
      setReceipts(getRows(results[2].value, ["receipts", "items", "records"]));
    } else {
      failures.push("Receipt queue: " + errorText(results[2].reason));
    }
    if (results[3].status === "fulfilled") {
      setAccounts(getRows(results[3].value, ["payment_accounts", "accounts", "items"]));
    } else {
      failures.push("Payment instructions: " + errorText(results[3].reason));
    }

    setError(failures.join(" "));
    setLoading(false);
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    await load();
    if (typeof onRefresh === "function") await onRefresh();
  };

  const visibleStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) => {
      const values = [
        student.student_name,
        student.student_id_label,
        student.student_id,
        student.admission_number,
        student.class_name,
        student.program_name,
      ];
      const matchesQuery = !query || values.some((value) => String(value || "").toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || String(student.fee_status || "not_assessed") === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [students, search, statusFilter]);

  const summary = reportSummary || {};
  const totalRequired = summary.amount ?? feeSummary?.amount_required ?? students.reduce((total, student) => total + Number(student.amount_required || 0), 0);
  const totalPaid = summary.paid ?? feeSummary?.amount_paid ?? students.reduce((total, student) => total + Number(student.amount_paid || 0), 0);
  const totalBalance = summary.outstanding ?? feeSummary?.balance ?? students.reduce((total, student) => total + Number(student.balance || 0), 0);
  const assessedCount = feeSummary?.assessed ?? students.filter((student) => Number(student.fee_records || 0) > 0).length;
  const schoolName = school?.name || school?.school_name || "School";

  const findStudent = async (event) => {
    event?.preventDefault?.();
    const identifier = studentIdentifier.trim();
    if (!identifier) {
      setError("Enter a Student ID or admission number before looking up a fee statement.");
      setSelectedStudent(null);
      return;
    }
    setFindingStudent(true);
    setError("");
    setNotice("");
    setSelectedStudent(null);
    try {
      if (typeof api.getFinanceFeeStatus !== "function") throw new Error("The finance fee-status endpoint is not available. Update the frontend deployment.");
      const payload = unwrap(await api.getFinanceFeeStatus({ student_id: identifier })) || {};
      const student = payload.student || null;
      if (!student?.student_id) throw new Error("No fee statement was returned for that Student ID.");
      setSelectedStudent(student);
    } catch (lookupError) {
      setError(errorText(lookupError));
    } finally {
      setFindingStudent(false);
    }
  };

  const chooseStudent = (student) => {
    const identifier = student.student_id_label || student.admission_number || student.student_id || "";
    setStudentIdentifier(String(identifier));
    setSelectedStudent(student);
    setError("");
    setNotice("");
  };

  const sendReminder = async () => {
    const identifier = studentIdentifier.trim();
    if (!identifier) {
      setError("Student ID is required. No reminder was sent.");
      return;
    }
    if (!selectedStudent?.student_id) {
      setError("Find the Student ID and confirm the fee statement before sending a reminder.");
      return;
    }
    const knownIdentifiers = [selectedStudent.student_id, selectedStudent.student_id_label, selectedStudent.admission_number]
      .filter(Boolean).map((value) => String(value).trim());
    if (!knownIdentifiers.includes(identifier)) {
      setError("The Student ID changed after lookup. Find the student again before sending.");
      setSelectedStudent(null);
      return;
    }
    if (Number(selectedStudent.fee_records || 0) <= 0 || Number(selectedStudent.balance || 0) <= 0) {
      setError("A reminder can only be sent for a student with a recorded fee schedule and an outstanding balance.");
      return;
    }
    if (selectedStudent.parent_contact_available === false) {
      setError("No parent/guardian contact is on file. Ask the Registrar to update the contact; Bursar access cannot edit student records.");
      return;
    }

    setSendingReminder(true);
    setError("");
    setNotice("");
    try {
      if (typeof api.sendSchoolFeeReminder !== "function") throw new Error("The parent-reminder endpoint is not available. Update the frontend deployment.");
      const payload = unwrap(await api.sendSchoolFeeReminder({ student_id: selectedStudent.student_id })) || {};
      const channels = Array.isArray(payload.channels_sent) ? payload.channels_sent : [];
      const warnings = Array.isArray(payload.warnings) ? payload.warnings : [];
      await load();
      setNotice(
        "Fee reminder sent to the recorded parent/guardian contact by "
        + (channels.length ? channels.map((channel) => channel.toUpperCase()).join(" and ") : "the configured channel")
        + ". " + warnings.join(" ")
      );
    } catch (sendError) {
      setError(errorText(sendError));
    } finally {
      setSendingReminder(false);
    }
  };

  const reviewReceipt = async (receipt, decision) => {
    const id = receipt?.id || receipt?._id || receipt?.receipt_id;
    if (!id) {
      setError("The receipt has no valid identifier.");
      return;
    }
    if (decision === "reject" && typeof window !== "undefined" && !window.confirm("Reject this receipt claim? The parent will need to contact the school for clarification.")) return;
    setWorking(String(id));
    setError("");
    setNotice("");
    try {
      await api.reviewSchoolFeeReceipt(id, { decision });
      await load();
      setNotice(decision === "approve"
        ? "Receipt approved and the payment was applied to the linked fee balance."
        : "Receipt rejected. The parent will need to contact the school Bursar for clarification.");
    } catch (reviewError) {
      setError(errorText(reviewError));
    } finally {
      setWorking("");
    }
  };

  return (
    <div className="space-y-5">
      <header className="rounded-2xl bg-slate-950 p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Finance-only workspace</p>
            <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Bursar finance desk</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Student fee statements, required programme fees, payments received, outstanding balances, parent reminders and receipt reconciliation. Academic records and student administration are not available in this role.</p>
            <p className="mt-2 text-xs text-slate-400">{schoolName}</p>
          </div>
          <button type="button" onClick={() => void refresh()} disabled={loading || refreshing} className="inline-flex min-h-10 items-center gap-2 self-start rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-60 sm:self-auto">
            <RefreshCw size={15} className={loading || refreshing ? "animate-spin" : ""} />
            Refresh finance
          </button>
        </div>
      </header>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"><AlertCircle size={17} className="mt-0.5 shrink-0" /><p>{error}</p></div>}
      {notice && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"><CheckCircle2 size={17} className="mt-0.5 shrink-0" /><p>{notice}</p></div>}

      <section aria-label="School fee totals" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Wallet} label="Total required" value={kes(totalRequired)} detail="Sum of school fee records assigned to students" />
        <StatCard icon={CheckCircle2} label="Total paid" value={kes(totalPaid)} detail="Payments recorded in the fee ledger" />
        <StatCard icon={Clock3} label="Outstanding" value={kes(totalBalance)} detail="Unpaid and partially paid balances" />
        <StatCard icon={FileBarChart} label="Students assessed" value={String(assessedCount)} detail={"Of " + (feeSummary?.students ?? students.length) + " student records"} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-950 dark:text-white">Student fee status</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">Amount required, payments recorded and current balance for each student. The required amount is calculated from the fee items assigned to that student.</p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{visibleStudents.length} of {students.length} students</span>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Search student or programme</span>
            <div className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 dark:border-slate-700">
              <Search size={16} className="shrink-0 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Student name, ID, class..." className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-0" />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Fee status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
              <option value="all">All fee statuses</option>
              <option value="paid">Paid</option>
              <option value="partial">Part-paid</option>
              <option value="pending">Unpaid</option>
              <option value="overdue">Overdue</option>
              <option value="not_assessed">No fee assigned</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"><Loader2 size={17} className="animate-spin" />Loading finance records…</div>
        ) : visibleStudents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-7 text-center text-sm text-slate-500 dark:border-slate-800">{students.length ? "No student fee statements match this search." : "No student fee status is available yet. Add fee records through the school's existing fee workflow."}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-3 font-bold">Student ID</th>
                  <th className="px-3 py-3 font-bold">Student / programme</th>
                  <th className="px-3 py-3 text-right font-bold">Required</th>
                  <th className="px-3 py-3 text-right font-bold">Paid</th>
                  <th className="px-3 py-3 text-right font-bold">Balance</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-3 py-3 text-right font-bold">Reminder</th>
                </tr>
              </thead>
              <tbody>
                {visibleStudents.map((student) => {
                  const identity = student.student_id_label || student.admission_number || student.student_id;
                  const presentation = statusPresentation(student.fee_status);
                  const canRemind = Number(student.fee_records || 0) > 0 && Number(student.balance || 0) > 0 && student.parent_contact_available !== false;
                  const programLine = [student.program_name, student.class_name && student.program_name !== student.class_name ? student.class_name : ""].filter(Boolean).join(" · ");
                  return (
                    <tr key={student.student_id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-3 align-top">
                        <span className="font-bold text-slate-900 dark:text-white">{identity || "ID missing"}</span>
                        {student.admission_number && student.student_id_label !== student.student_id && <span className="mt-1 block max-w-[140px] truncate text-[11px] text-slate-500" title={student.student_id}>Record ID: {student.student_id}</span>}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className="font-semibold text-slate-900 dark:text-white">{student.student_name || "Student name not recorded"}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{programLine || "Programme not assigned"}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{student.fee_records || 0} fee item{Number(student.fee_records || 0) === 1 ? "" : "s"}</p>
                      </td>
                      <td className="px-3 py-3 text-right align-top font-semibold tabular-nums">{kes(student.amount_required)}</td>
                      <td className="px-3 py-3 text-right align-top tabular-nums text-emerald-700 dark:text-emerald-300">{kes(student.amount_paid)}</td>
                      <td className={"px-3 py-3 text-right align-top font-extrabold tabular-nums " + (Number(student.balance || 0) > 0 ? "text-rose-700 dark:text-rose-300" : "text-slate-700 dark:text-slate-300")}>{kes(student.balance)}</td>
                      <td className="px-3 py-3 align-top"><span className={"inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold " + presentation.className}>{presentation.label}</span></td>
                      <td className="px-3 py-3 text-right align-top">
                        <button type="button" onClick={() => chooseStudent(student)} disabled={!canRemind} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 px-2.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/30"><Send size={13} />Use ID</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-white p-4 dark:border-emerald-900/70 dark:bg-slate-950 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><MessageSquare size={19} /></span>
          <div>
            <h2 className="font-extrabold text-slate-950 dark:text-white">Send fee reminder to parent/guardian</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">A Student ID or admission number is mandatory. The server verifies it against this school, calculates the outstanding balance, and sends only to the parent contact saved on that student record.</p>
          </div>
        </div>

        <form onSubmit={(event) => void findStudent(event)} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Student ID / admission number <span className="text-rose-600">*</span></span>
            <input required value={studentIdentifier} onChange={(event) => { setStudentIdentifier(event.target.value); setSelectedStudent(null); setNotice(""); }} placeholder="Enter the exact school Student ID" autoComplete="off" className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <button type="submit" disabled={findingStudent || !studentIdentifier.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
            {findingStudent ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}Find fee statement
          </button>
        </form>

        {selectedStudent && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Confirmed student</p>
                <h3 className="mt-1 break-words text-base font-extrabold text-slate-950 dark:text-white">{selectedStudent.student_name || "Student"}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Student ID: {selectedStudent.student_id_label || selectedStudent.admission_number || selectedStudent.student_id}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{[selectedStudent.program_name, selectedStudent.class_name && selectedStudent.program_name !== selectedStudent.class_name ? selectedStudent.class_name : ""].filter(Boolean).join(" · ") || "Programme not assigned"}</p>
              </div>
              <span className={"w-fit rounded-full px-2.5 py-1 text-xs font-bold " + statusPresentation(selectedStudent.fee_status).className}>{statusPresentation(selectedStudent.fee_status).label}</span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"><p className="text-xs text-slate-500">Total required</p><p className="mt-1 font-extrabold">{kes(selectedStudent.amount_required)}</p></div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"><p className="text-xs text-slate-500">Paid</p><p className="mt-1 font-extrabold text-emerald-700 dark:text-emerald-300">{kes(selectedStudent.amount_paid)}</p></div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"><p className="text-xs text-slate-500">Balance due</p><p className="mt-1 font-extrabold text-rose-700 dark:text-rose-300">{kes(selectedStudent.balance)}</p></div>
            </div>

            <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {selectedStudent.parent_contact_available === false ? <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-600" /> : <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" />}
              <p>{selectedStudent.parent_contact_available === false ? "No parent/guardian phone or email is recorded. Ask the Registrar to update the student record before sending." : "Parent/guardian contact is available on the school record. Contact details are not exposed in this finance screen."}</p>
            </div>

            {Array.isArray(selectedStudent.fee_items) && selectedStudent.fee_items.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Fee items in this statement</p>
                <div className="space-y-2">
                  {selectedStudent.fee_items.map((item, index) => (
                    <div key={item.id || String(item.fee_type || item.description || "fee") + "-" + index} className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{item.description || item.fee_type || "School fees"}</p>
                        <p className="text-slate-500">{[item.term, item.academic_year, item.due_date ? "Due " + item.due_date : ""].filter(Boolean).join(" · ")}</p>
                      </div>
                      <div className="flex flex-wrap gap-x-3 text-slate-600 dark:text-slate-300"><span>Required {kes(item.amount_required)}</span><span>Paid {kes(item.amount_paid)}</span><span className="font-bold">Balance {kes(item.balance)}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">The reminder includes required fees, amounts paid, the outstanding balance and the school's configured payment instructions. No reminder is sent for a paid balance or an unassessed student.</p>
              <button type="button" onClick={() => void sendReminder()} disabled={sendingReminder || findingStudent || Number(selectedStudent.balance || 0) <= 0 || Number(selectedStudent.fee_records || 0) <= 0 || selectedStudent.parent_contact_available === false} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
                {sendingReminder ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}{sendingReminder ? "Sending reminder…" : "Send reminder to parent"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-950 dark:text-white">School payment instructions</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Existing school payment accounts. These are instructions only; a transfer is not marked paid until it is recorded or reconciled.</p>
          </div>
          <ShieldCheck size={20} className="text-blue-700 dark:text-blue-300" />
        </div>
        {accounts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-slate-800">No school payment accounts have been configured yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {accounts.map((account, index) => (
              <article key={account.id || index} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-white">{account.label || account.type || "Payment account"}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {account.type === "mpesa" ? "M-Pesa" : "Bank"}
                  {account.paybill ? " · Paybill " + account.paybill : ""}
                  {account.till ? " · Till " + account.till : ""}
                  {account.bank_name ? " · " + account.bank_name : ""}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{account.account_number || account.account_name || account.account_reference || "Payment details not set"}</p>
                {account.instructions && <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{account.instructions}</p>}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-950 dark:text-white">Fee receipt reconciliation</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Approve a parent-submitted receipt only when it matches the outstanding fee. Approval updates the linked student fee record.</p>
          </div>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">{receipts.length} pending</span>
        </div>
        {loading ? (
          <p className="py-7 text-center text-sm text-slate-500">Loading pending receipt claims…</p>
        ) : receipts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-7 text-center text-sm text-slate-500 dark:border-slate-800">No pending receipt claims.</p>
        ) : (
          <div className="space-y-3">
            {receipts.map((receipt, index) => {
              const id = receipt.id || receipt._id || receipt.receipt_id || index;
              return (
                <article key={id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white">{receipt.student_name || receipt.learner_name || receipt.admission_number || receipt.student_id || "Student fee receipt"}</p>
                    <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">{kes(receipt.amount)}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{receipt.payment_reference || receipt.transaction_code || receipt.receipt_number || "Reference not provided"} · {receipt.submitted_at || receipt.created_at || "Date not recorded"}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" disabled={Boolean(working)} onClick={() => void reviewReceipt(receipt, "approve")} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
                      {working === String(id) ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}Approve
                    </button>
                    <button type="button" disabled={Boolean(working)} onClick={() => void reviewReceipt(receipt, "reject")} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:text-rose-300"><XCircle size={14} />Reject</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Bursar access is limited to finance: fee status, payment instructions, parent fee reminders, receipts and reconciliation. Student records, academic results, staff, inventory and website settings remain outside this workspace.</p>
    </div>
  );
}
