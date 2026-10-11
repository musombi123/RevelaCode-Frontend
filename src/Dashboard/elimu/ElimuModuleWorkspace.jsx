import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileBarChart2,
  GraduationCap,
  Loader,
  Plus,
  RefreshCw,
  School,
  Search,
  Settings2,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useElimuApi } from "@/services/elimuApi.jsx";

const MODULES = {
  "elimu/school": {
    key: "school",
    title: "School profile",
    description: "Review the school identity and public-facing information used across Elimu.",
    endpoint: "School data supplied by the authenticated Elimu access/dashboard response",
    icon: School,
    readOnly: true,
  },
  "elimu/staff": {
    key: "staff",
    title: "Staff & access",
    description: "Review school staff and invite authorized members into the workspace.",
    endpoint: "GET /api/jumuiya/elimu/staff Â· POST /api/jumuiya/elimu/staff/invite",
    icon: Users,
  },
  "elimu/students": {
    key: "students",
    title: "Student records",
    description: "Create and review school-scoped learner records.",
    endpoint: "GET/POST /api/jumuiya/elimu/students",
    icon: GraduationCap,
  },
  "elimu/classes": {
    key: "classes",
    title: "Classes",
    description: "Maintain class groups, streams, academic year and capacity.",
    endpoint: "GET/POST /api/jumuiya/elimu/classes",
    icon: School,
  },
  "elimu/lessons": {
    key: "lessons",
    title: "Lessons",
    description: "Create lesson records and review teaching resources.",
    endpoint: "GET/POST /api/jumuiya/elimu/lessons",
    icon: BookOpen,
  },
  "elimu/assignments": {
    key: "assignments",
    title: "Assignments",
    description: "Prepare class assignments and track their status and due dates.",
    endpoint: "GET/POST /api/jumuiya/elimu/assignments",
    icon: ClipboardCheck,
  },
  "elimu/assessments": {
    key: "assessments",
    title: "Assessments",
    description: "Record learner assessment results and competency evidence.",
    endpoint: "GET/POST /api/jumuiya/elimu/assessments",
    icon: CheckCircle2,
  },
  "elimu/attendance": {
    key: "attendance",
    title: "Attendance",
    description: "Record and review learner attendance by date and status.",
    endpoint: "GET/POST /api/jumuiya/elimu/attendance",
    icon: CalendarDays,
  },
  "elimu/timetable": {
    key: "timetable",
    title: "Timetable",
    description: "Open timetables available to this school account and review generated schedules.",
    endpoint: "GET/POST /api/jumuiya/elimu/timetable",
    icon: CalendarDays,
    readOnly: true,
  },
  "elimu/cbc": {
    key: "cbc",
    title: "CBC projects",
    description: "Organize competency-based projects, skills and learning evidence.",
    endpoint: "GET/POST /api/jumuiya/elimu/cbc/projects",
    icon: BookOpen,
  },
  "elimu/fees": {
    key: "fees",
    title: "School fees",
    description: "Create school fee records and review their payment status.",
    endpoint: "GET/POST /api/jumuiya/elimu/fees",
    icon: Wallet,
  },
  "elimu/reports": {
    key: "reports",
    title: "Reports & analytics",
    description: "View reporting summaries returned for the authenticated school account.",
    endpoint: "GET /api/jumuiya/elimu/reports/dashboard",
    icon: FileBarChart2,
    readOnly: true,
  },
  "elimu/automation": {
    key: "automation",
    title: "Automation",
    description: "Review the automation status, rules and recent jobs configured for Elimu.",
    endpoint: "GET /api/jumuiya/elimu/automation/status Â· jobs Â· rules",
    icon: Activity,
    readOnly: true,
  },
  "elimu/sync": {
    key: "sync",
    title: "Synchronization",
    description: "Review desktop-sync connections, devices, jobs and conflicts.",
    endpoint: "GET /api/jumuiya/elimu/sync/status Â· connections Â· devices Â· jobs Â· conflicts",
    icon: RefreshCw,
    readOnly: true,
  },
  "elimu/settings": {
    key: "settings",
    title: "School settings",
    description: "Review the configuration currently available for this school workspace.",
    endpoint: "School configuration supplied by the authenticated Elimu access/dashboard response",
    icon: Settings2,
    readOnly: true,
  },
};

const CREATE_ACTIONS = {
  staff: "inviteStaff",
  students: "createStudent",
  classes: "createClass",
  lessons: "createLesson",
  assignments: "createAssignment",
  assessments: "createAssessment",
  attendance: "recordAttendance",
  cbc: "createCBCProject",
  fees: "createFeeRecord",
};

const FORM_FIELDS = {
  staff: [
    { name: "email", label: "Staff email", type: "email", required: true },
    {
      name: "role",
      label: "Role",
      type: "select",
      required: true,
      options: [
        { value: "teacher", label: "Teacher" },
        { value: "registrar", label: "Registrar" },
        { value: "bursar", label: "Bursar" },
      ],
    },
    { name: "expires_in_days", label: "Invitation expiry (days)", type: "number", defaultValue: 7 },
  ],
  students: [
    { name: "admission_number", label: "Admission number", required: true },
    { name: "full_name", label: "Learner full name", required: true },
    { name: "gender", label: "Gender" },
    { name: "class_name", label: "Class / stream" },
    { name: "guardian_name", label: "Guardian name" },
    { name: "guardian_phone", label: "Guardian phone", type: "tel" },
  ],
  classes: [
    { name: "name", label: "Class name", required: true },
    { name: "code", label: "Class code" },
    { name: "level", label: "Grade / level" },
    { name: "stream", label: "Stream" },
    { name: "academic_year", label: "Academic year" },
    { name: "capacity", label: "Capacity", type: "number" },
  ],
  lessons: [
    { name: "subject", label: "Subject / learning area", required: true },
    { name: "title", label: "Lesson title", required: true },
    { name: "class_name", label: "Class" },
    { name: "academic_year", label: "Academic year" },
    { name: "term", label: "Term" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
        { value: "archived", label: "Archived" },
      ],
    },
    { name: "description", label: "Description", type: "textarea" },
  ],
  assignments: [
    { name: "class_name", label: "Class", required: true },
    { name: "subject", label: "Subject", required: true },
    { name: "title", label: "Assignment title", required: true },
    { name: "due_date", label: "Due date", type: "date" },
    { name: "max_score", label: "Maximum score", type: "number" },
    { name: "description", label: "Instructions", type: "textarea" },
  ],
  assessments: [
    { name: "student_id", label: "Student record ID", required: true },
    { name: "subject", label: "Subject", required: true },
    { name: "assessment_name", label: "Assessment name", required: true },
    { name: "assessment_date", label: "Assessment date", type: "date" },
    { name: "score", label: "Score", type: "number" },
    { name: "max_score", label: "Maximum score", type: "number", defaultValue: 100 },
    { name: "grade", label: "Grade" },
  ],
  attendance: [
    { name: "student_id", label: "Student record ID", required: true },
    { name: "date", label: "Attendance date", type: "date", required: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      defaultValue: "present",
      options: [
        { value: "present", label: "Present" },
        { value: "absent", label: "Absent" },
        { value: "late", label: "Late" },
        { value: "excused", label: "Excused" },
      ],
    },
    { name: "reason", label: "Reason / notes", type: "textarea" },
  ],
  cbc: [
    { name: "title", label: "Project title", required: true },
    { name: "category", label: "Learning area / category" },
    { name: "student_id", label: "Student record ID" },
    {
      name: "status",
      label: "Status",
      type: "select",
      defaultValue: "active",
      options: [
        { value: "active", label: "Active" },
        { value: "completed", label: "Completed" },
        { value: "archived", label: "Archived" },
      ],
    },
    { name: "description", label: "Project description", type: "textarea" },
  ],
  fees: [
    { name: "student_id", label: "Student record ID" },
    { name: "amount", label: "Amount (KES)", type: "number", required: true },
    { name: "amount_paid", label: "Amount paid (KES)", type: "number", defaultValue: 0 },
    { name: "fee_type", label: "Fee type" },
    { name: "term", label: "Term" },
    { name: "academic_year", label: "Academic year" },
    { name: "due_date", label: "Due date", type: "date" },
  ],
};

const DEMO_SEEDS = {
  staff: [
    { id: "demo-staff-1", full_name: "Demo Principal", name: "Demo Principal", role: "principal", status: "active" },
    { id: "demo-staff-2", full_name: "Sample Teacher", name: "Sample Teacher", role: "teacher", status: "active" },
  ],
  students: [
    { id: "demo-student-1", admission_number: "DEMO-001", full_name: "Amani Wanjiku", class_name: "Grade 6" },
    { id: "demo-student-2", admission_number: "DEMO-002", full_name: "Baraka Otieno", class_name: "Grade 6" },
  ],
  classes: [
    { id: "demo-class-1", name: "Grade 6", code: "G6", level: "Grade 6", stream: "East", status: "active" },
    { id: "demo-class-2", name: "Grade 7", code: "G7", level: "Grade 7", stream: "West", status: "active" },
  ],
  lessons: [
    { id: "demo-lesson-1", title: "Fractions and ratios", subject: "Mathematics", class_name: "Grade 6", status: "draft" },
  ],
  assignments: [
    { id: "demo-assignment-1", title: "Fractions practice", subject: "Mathematics", class_name: "Grade 6", status: "active", due_date: "2026-10-16" },
  ],
  assessments: [
    { id: "demo-assessment-1", assessment_name: "Term practice", subject: "Mathematics", student_id: "demo-student-1", score: 78, max_score: 100 },
  ],
  attendance: [
    { id: "demo-attendance-1", student_id: "demo-student-1", date: "2026-10-11", status: "present" },
    { id: "demo-attendance-2", student_id: "demo-student-2", date: "2026-10-11", status: "late" },
  ],
  timetable: [
    { id: "demo-timetable-1", name: "Term 3 Demo Timetable", academic_year: "2026", term: "Term 3", status: "draft" },
  ],
  cbc: [
    { id: "demo-project-1", title: "School kitchen garden", category: "Environmental activities", status: "active" },
  ],
  fees: [
    { id: "demo-fee-1", student_id: "demo-student-1", amount: 12000, amount_paid: 8000, status: "partial", fee_type: "Term fees" },
  ],
  reports: [
    { id: "demo-report-1", title: "Demo school summary", period: "Term 3 2026", total_students: 2, attendance_rate: "92%", status: "sample" },
  ],
};

const DEMO_COMPOSITE_SEEDS = {
  automation: {
    status: { status: "demo_preview", enabled_rules: 2, queued_jobs: 1 },
    actions: [{ id: "demo-action-1", name: "Refresh school summary", trigger: "manual", status: "sample" }],
    jobs: [{ id: "demo-automation-job-1", name: "Daily summary", status: "queued", created_at: "2026-10-11" }],
    rules: [{ id: "demo-rule-1", name: "Attendance summary reminder", trigger: "scheduled", action: "create_summary", status: "sample" }],
    logs: [{ id: "demo-log-1", message: "Sample automation log", level: "info", created_at: "2026-10-11" }],
  },
  sync: {
    status: { status: "demo_preview", queued_jobs: 1, active_devices: 1, conflicts: 0 },
    connections: [{ id: "demo-connection-1", name: "School desktop", platform: "windows", status: "sample" }],
    devices: [{ id: "demo-device-1", name: "Demo desktop", platform: "windows", status: "sample" }],
    jobs: [{ id: "demo-sync-job-1", entity_type: "students", status: "completed", records_processed: 2 }],
    conflicts: [],
  },
};

const ENDPOINT_METHODS = {
  staff: "getStaff",
  students: "getStudents",
  classes: "getClasses",
  lessons: "getLessons",
  assignments: "getAssignments",
  assessments: "getAssessments",
  attendance: "getAttendance",
  timetable: "getTimetable",
  cbc: "getCBCProjects",
  fees: "getFees",
};

function normalizePath(path) {
  const normalized = String(path || "").split("?")[0].replace(/^\/+|\/+$/g, "").toLowerCase();
  return normalized === "school" ? "elimu/school" : normalized;
}

export function getElimuModuleMeta(path) {
  return MODULES[normalizePath(path)] || null;
}

function unwrap(value) {
  let current = value;
  for (let index = 0; index < 5; index += 1) {
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

function extractRows(value) {
  const data = unwrap(value);
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  const keys = ["items", "records", "results", "students", "classes", "staff", "lessons", "assignments", "assessments", "attendance", "timetables", "projects", "fees", "rows"];
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key];
  }
  if (data.data && typeof data.data === "object") return extractRows(data.data);
  return [];
}

function humanize(value) {
  return String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function valueText(value) {
  if (value === null || value === undefined || value === "") return "â€”";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(valueText).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function rowTitle(row, index) {
  return row?.full_name || row?.name || row?.title || row?.assessment_name || row?.admission_number || row?.subject || row?.code || `Record ${index + 1}`;
}

function rowSubtitle(row) {
  return [
    row?.admission_number,
    row?.class_name || row?.class,
    row?.subject,
    row?.email,
    row?.role,
    row?.due_date,
    row?.date,
  ].filter(Boolean).slice(0, 3).join(" Â· ");
}

function responseMessage(error) {
  return error?.payload?.message || error?.payload?.error || error?.message || "The request could not be completed.";
}

function getSchoolIdentity(school) {
  return String(school?.school_id || school?.id || school?._id || school?.school_code || school?.code || "default");
}

function isDemoSession(access, school) {
  const code = String(school?.school_code || school?.code || access?.school_code || "").toUpperCase();
  return Boolean(
    access?.is_demo === true ||
    access?.demo_mode === true ||
    access?.school?.is_demo === true ||
    school?.is_demo === true ||
    code.includes("DEMO")
  );
}

function readDemoRecords(moduleKey, school) {
  const storageKey = `revelacode:elimu-demo:${getSchoolIdentity(school)}:${moduleKey}`;
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return { rows: parsed, storageKey };
    }
    const seed = DEMO_SEEDS[moduleKey] || [];
    window.localStorage.setItem(storageKey, JSON.stringify(seed));
    return { rows: seed, storageKey };
  } catch {
    return { rows: DEMO_SEEDS[moduleKey] || [], storageKey: null };
  }
}

function saveDemoRecords(storageKey, rows) {
  if (!storageKey) return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(rows));
  } catch {
    // Private browsing/storage restrictions should not break the module UI.
  }
}

function formatDateToday() {
  return new Date().toISOString().slice(0, 10);
}

function Field({ field, value, onChange }) {
  const common = {
    id: `elimu-module-${field.name}`,
    name: field.name,
    value: value ?? "",
    onChange: (event) => onChange(field.name, event.target.value),
    required: Boolean(field.required),
    className: "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white",
  };
  return (
    <div className={field.type === "textarea" ? "sm:col-span-2" : ""}>
      <label htmlFor={common.id} className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">{field.label}</label>
      {field.type === "textarea" ? (
        <textarea {...common} rows={3} />
      ) : field.type === "select" ? (
        <select {...common}>
          {(field.options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <input {...common} type={field.type || "text"} min={field.type === "number" ? 0 : undefined} step={field.type === "number" ? "any" : undefined} />
      )}
    </div>
  );
}

function RecordTable({ rows, query }) {
  const filteredRows = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
  if (!filteredRows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-12 text-center dark:border-slate-800">
        <Search size={23} className="mx-auto text-slate-300 dark:text-slate-600" />
        <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">No matching records</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use refresh to reload the backend records or add a new record where available.</p>
      </div>
    );
  }
  const preferred = ["admission_number", "full_name", "name", "title", "subject", "class_name", "role", "status", "date", "due_date", "amount", "amount_paid", "score", "max_score"];
  const keys = [...new Set(filteredRows.flatMap((row) => Object.keys(row || {})))].filter((key) => !["_id", "metadata", "raw"].includes(key)).sort((a, b) => {
    const ai = preferred.indexOf(a); const bi = preferred.indexOf(b);
    return (ai < 0 ? 100 : ai) - (bi < 0 ? 100 : bi);
  }).slice(0, 7);
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full divide-y divide-slate-200 text-left dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-900">
          <tr>{keys.map((key) => <th key={key} className="whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{humanize(key)}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-950">
          {filteredRows.map((row, index) => <tr key={row?.id || row?._id || `${rowTitle(row, index)}-${index}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/60">
            {keys.map((key) => <td key={key} className="max-w-[280px] px-4 py-3 text-sm text-slate-700 dark:text-slate-300"><span className="block truncate" title={valueText(row?.[key])}>{valueText(row?.[key])}</span></td>)}
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}

function DataSections({ sections }) {
  const entries = Object.entries(sections || {}).filter(([, value]) => value && value.ok && value.data !== undefined);
  if (!entries.length) return <p className="text-sm text-slate-500 dark:text-slate-400">No section data is currently available.</p>;
  return <div className="grid gap-5 xl:grid-cols-2">
    {entries.map(([name, entry]) => {
      const data = unwrap(entry.data);
      const rows = extractRows(data);
      const metrics = data && typeof data === "object" && !Array.isArray(data) ? Object.entries(data).filter(([, value]) => typeof value === "number" || typeof value === "boolean" || (typeof value === "string" && value.length < 80 && !value.trim().startsWith("http"))).slice(0, 8) : [];
      return <section key={name} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{humanize(name)}</h3>
        {rows.length ? <div className="mt-4"><RecordTable rows={rows} query="" /></div> : metrics.length ? <dl className="mt-4 grid gap-3 sm:grid-cols-2">{metrics.map(([key, value]) => <div key={key} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><dt className="text-xs text-slate-500 dark:text-slate-400">{humanize(key)}</dt><dd className="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-white">{valueText(value)}</dd></div>)}</dl> : <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">{JSON.stringify(data, null, 2)}</pre>}
        {!entry.ok && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{entry.error || "This endpoint is not available in this session."}</p>}
      </section>;
    })}
  </div>;
}

export default function ElimuModuleWorkspace({ path, role, school, access, onNavigate }) {
  const api = useElimuApi();
  const modulePath = normalizePath(path);
  const meta = getElimuModuleMeta(modulePath);
  const ModuleIcon = meta?.icon || School;
  const demo = isDemoSession(access, school);
  const moduleKey = meta?.key || "unknown";
  const fields = FORM_FIELDS[moduleKey] || [];

  const [rows, setRows] = useState([]);
  const [payload, setPayload] = useState(null);
  const [sections, setSections] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [localDemo, setLocalDemo] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    const defaults = {};
    fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        defaults[field.name] = field.defaultValue;
      } else if (field.type === "select" && field.options?.length) {
        defaults[field.name] = field.options[0].value;
      }
    });
    if (fields.some((field) => field.name === "date")) defaults.date = formatDateToday();
    if (fields.some((field) => field.name === "assessment_date")) defaults.assessment_date = formatDateToday();
    if (fields.some((field) => field.name === "due_date")) defaults.due_date = "";
    setForm(defaults);
    setFormOpen(false);
    setQuery("");
    setNotice("");
    setError("");
  }, [modulePath]); // route changes reset the module form without resetting hook order

  const load = useCallback(async () => {
    if (!meta) return;
    setLoading(true);
    setError("");
    setSections(null);
    try {
      if (moduleKey === "school" || moduleKey === "settings") {
        setPayload(school || access?.school || access?.membership?.school || null);
        setRows([]);
        setLocalDemo(false);
        return;
      }

      if (moduleKey === "automation") {
        const calls = {
          status: () => api.getAutomationStatus(),
          actions: () => api.getAutomationActions(),
          jobs: () => api.getAutomationJobs(),
          rules: () => api.getAutomationRules(),
          logs: () => api.getAutomationLogs(),
        };
        const results = await Promise.all(Object.entries(calls).map(async ([name, call]) => {
          try { return [name, { ok: true, data: await call() }]; }
          catch (err) { return [name, { ok: false, error: responseMessage(err) }]; }
        }));
        const nextSections = Object.fromEntries(results);
        if (!Object.values(nextSections).some((section) => section.ok)) throw new Error("Automation endpoints are not available for this school session.");
        setSections(nextSections);
        setPayload(null);
        setRows([]);
        setLocalDemo(false);
        return;
      }

      if (moduleKey === "sync") {
        const calls = {
          status: () => api.getSyncStatus(),
          connections: () => api.getSyncConnections(),
          devices: () => api.getSyncDevices(),
          jobs: () => api.getSyncJobs(),
          conflicts: () => api.getSyncConflicts(),
        };
        const results = await Promise.all(Object.entries(calls).map(async ([name, call]) => {
          try { return [name, { ok: true, data: await call() }]; }
          catch (err) { return [name, { ok: false, error: responseMessage(err) }]; }
        }));
        const nextSections = Object.fromEntries(results);
        if (!Object.values(nextSections).some((section) => section.ok)) throw new Error("Synchronization endpoints are not available for this school session.");
        setSections(nextSections);
        setPayload(null);
        setRows([]);
        setLocalDemo(false);
        return;
      }

      const methodName = ENDPOINT_METHODS[moduleKey];
      const method = methodName ? api[methodName] : api.getReportsDashboard;
      if (typeof method !== "function") throw new Error(`The API method for ${meta.title} is not present in src/services/elimuApi.jsx.`);
      const response = await method.call(api, moduleKey === "reports" ? {} : {});
      const data = unwrap(response);
      const nextRows = extractRows(data);
      setPayload(data);
      const hasObjectPayload = Boolean(
        data && typeof data === "object" && !Array.isArray(data) && Object.keys(data).length
      );
      if (
        demo &&
        nextRows.length === 0 &&
        !(moduleKey === "reports" && hasObjectPayload) &&
        (DEMO_SEEDS[moduleKey] || []).length
      ) {
        const demoData = readDemoRecords(moduleKey, school);
        setRows(demoData.rows);
        setLocalDemo(true);
      } else {
        setRows(nextRows);
        setLocalDemo(false);
      }
    } catch (loadError) {
      if (demo && DEMO_COMPOSITE_SEEDS[moduleKey]) {
        const seedSections = DEMO_COMPOSITE_SEEDS[moduleKey];
        setSections(Object.fromEntries(Object.entries(seedSections).map(([name, data]) => [name, { ok: true, data }])));
        setRows([]);
        setPayload(null);
        setLocalDemo(true);
        setNotice("Demo preview mode: these sample summaries are generated in this browser and are not saved to the school backend.");
      } else if (demo && (DEMO_SEEDS[moduleKey] || []).length) {
        const demoData = readDemoRecords(moduleKey, school);
        setRows(demoData.rows);
        setPayload(null);
        setSections(null);
        setLocalDemo(true);
        setNotice("Demo preview mode: these sample records are stored only in this browser and are not saved to the school backend.");
      } else {
        setRows([]);
        setPayload(null);
        setSections(null);
        setError(responseMessage(loadError));
      }
    } finally {
      setLoading(false);
    }
  }, [api, access, demo, meta, moduleKey, school]);

  useEffect(() => {
    void load();
  }, [load]);

  const createRecord = useCallback(async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const actionName = CREATE_ACTIONS[moduleKey];
    const action = actionName ? api[actionName] : null;
    if (!action && !demo) {
      setError(`The create action for ${meta?.title || "this module"} is not configured.`);
      return;
    }

    const body = {};
    fields.forEach((field) => {
      const raw = form[field.name];
      if (raw === undefined || raw === null || String(raw).trim() === "") return;
      body[field.name] = field.type === "number" ? Number(raw) : raw;
    });

    setSaving(true);
    try {
      if (typeof action === "function") {
        await action.call(api, body);
        setNotice(`${meta.title} record saved to the school backend.`);
        setFormOpen(false);
        await load();
      } else if (demo) {
        throw new Error("The create endpoint is not available in this demo session.");
      }
    } catch (saveError) {
      if (demo && (saveError?.status === 404 || saveError?.status === 405 || saveError?.status === 501 || !saveError?.status || saveError?.status >= 500)) {
        const demoData = readDemoRecords(moduleKey, school);
        const item = {
          id: `demo-${moduleKey}-${Date.now()}`,
          ...body,
          created_at: new Date().toISOString(),
        };
        const updated = [item, ...demoData.rows];
        saveDemoRecords(demoData.storageKey, updated);
        setRows(updated);
        setLocalDemo(true);
        setPayload(null);
        setFormOpen(false);
        setNotice("Demo record added in this browser only. It has not been sent to or saved by the school backend.");
      } else {
        setError(responseMessage(saveError));
      }
    } finally {
      setSaving(false);
    }
  }, [api, demo, fields, form, load, meta, moduleKey, school]);

  const updateField = useCallback((name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  }, []);

  if (!meta) {
    return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">This Elimu module has no screen registered yet.</section>;
  }

  const count = rows.length;
  const numericMetrics = payload && typeof payload === "object" && !Array.isArray(payload)
    ? Object.entries(payload).filter(([, value]) => typeof value === "number" && Number.isFinite(value)).slice(0, 4)
    : [];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="relative overflow-hidden bg-slate-950 px-6 py-7 text-white sm:px-8">
          <div className="pointer-events-none absolute -right-12 -top-20 h-60 w-60 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-blue-200"><ModuleIcon size={14} /> Elimu module</div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{meta.title}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">{meta.description}</p>
              <p className="mt-3 text-xs leading-5 text-slate-400">School: {school?.name || school?.school_name || "Active Elimu school"} Â· Role: {role || "School member"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => onNavigate?.("elimu")} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"><ArrowLeft size={15} /> Dashboard</button>
              <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-blue-50 disabled:opacity-60"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button>
            </div>
          </div>
          <p className="relative mt-5 border-t border-white/10 pt-3 text-[11px] leading-5 text-slate-400">Service contract: {meta.endpoint}</p>
        </div>
      </section>

      {demo && <div className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-100"><ShieldCheck size={18} className="mt-0.5 shrink-0" /><div><p className="font-semibold">Demo school session</p><p className="mt-1 leading-5">The screen still calls the Elimu API. If a demo endpoint is unavailable, sample entries may be shown in browser-only preview mode and clearly labelled as local demo data.</p></div></div>}

      {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"><AlertCircle size={18} className="mt-0.5 shrink-0" /><p>{error}</p></div>}
      {notice && <div role="status" className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200"><CheckCircle2 size={18} className="mt-0.5 shrink-0" /><p>{notice}</p></div>}

      {(moduleKey === "school" || moduleKey === "settings") && (
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">School identity</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Current school details provided to the authenticated workspace.</p>
            {payload && Object.keys(payload).length ? <dl className="mt-5 grid gap-3 sm:grid-cols-2">{Object.entries(payload).filter(([key, value]) => !["_id", "metadata", "members", "permissions"].includes(key) && value !== null && value !== "" && typeof value !== "object").slice(0, 24).map(([key, value]) => <div key={key} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{humanize(key)}</dt><dd className="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-white">{valueText(value)}</dd></div>)}</dl> : <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">No school profile payload was included in the access/dashboard response. Refresh the Elimu workspace to retrieve it.</p>}
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Configuration guidance</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">This module now opens independently. Profile editing and school-wide setting mutations should be connected only to their dedicated authenticated backend endpoints; the current API client does not expose an update-school-settings action here.</p>
            {moduleKey === "school" && <button type="button" onClick={() => onNavigate?.("elimu/media")} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800">Manage school photos and videos <ArrowUpRight size={15} /></button>}
            {moduleKey === "settings" && <button type="button" onClick={() => onNavigate?.("elimu/documents")} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800">Open document centre <ArrowUpRight size={15} /></button>}
          </section>
        </div>
      )}

      {moduleKey === "reports" && payload && numericMetrics.length > 0 && <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{numericMetrics.map(([key, value]) => <article key={key} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{humanize(key)}</p><p className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">{value.toLocaleString("en-KE")}</p></article>)}</section>}

      {moduleKey === "automation" && sections && <DataSections sections={sections} />}
      {moduleKey === "sync" && sections && <DataSections sections={sections} />}

      {!(moduleKey === "school" || moduleKey === "settings") && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950 dark:text-white">{meta.title} register</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{loading ? "Loading records from the Elimu serviceâ€¦" : `${count} ${count === 1 ? "record" : "records"}${localDemo ? " Â· browser demo data" : ""}`}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records" className="min-h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-52 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
              {fields.length > 0 && <button type="button" onClick={() => setFormOpen((open) => !open)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"><Plus size={16} /> {formOpen ? "Close form" : moduleKey === "staff" ? "Invite staff" : "Add record"}</button>}
            </div>
          </div>

          {formOpen && fields.length > 0 && <form onSubmit={createRecord} className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20 sm:p-5">
            <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-900 dark:text-white">{moduleKey === "staff" ? "Invite a school staff member" : `Create ${meta.title.toLowerCase()} record`}</h3><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">The authenticated backend applies school scope and role permissions.</p></div><button type="button" onClick={() => setFormOpen(false)} aria-label="Close form" className="rounded-lg p-1.5 text-slate-500 hover:bg-white dark:hover:bg-slate-900"><X size={17} /></button></div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">{fields.map((field) => <Field key={field.name} field={field} value={form[field.name] ?? field.defaultValue ?? (field.type === "select" ? field.options?.[0]?.value : "")} onChange={updateField} />)}</div>
            <div className="mt-4 flex flex-wrap gap-2"><button type="submit" disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{saving ? <Loader size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}{saving ? "Savingâ€¦" : moduleKey === "staff" ? "Send invitation" : "Save record"}</button><button type="button" onClick={() => setFormOpen(false)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Cancel</button></div>
          </form>}

          {loading ? <div className="mt-5 flex items-center justify-center gap-3 rounded-2xl bg-slate-50 p-12 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400"><Loader size={19} className="animate-spin" /> Loading {meta.title.toLowerCase()}â€¦</div> : rows.length ? <div className="mt-5"><RecordTable rows={rows} query={query} /></div> : moduleKey === "reports" && payload && typeof payload === "object" ? <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900"><h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Returned report summary</h3><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-600 dark:text-slate-300">{JSON.stringify(payload, null, 2)}</pre></div> : !sections && <div className="mt-5 rounded-2xl border border-dashed border-slate-200 px-5 py-12 text-center dark:border-slate-800"><ModuleIcon size={25} className="mx-auto text-slate-300 dark:text-slate-600" /><p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">No records to display yet</p><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400">This screen is connected to its Elimu read endpoint. Add a record where supported, or refresh after records have been created for this school.</p></div>}
        </section>
      )}

      <section className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" /><p className="text-xs leading-5 text-slate-600 dark:text-slate-300">These modules use the shared Elimu API client. The browser does not choose or override school ownership. Backend permissions remain authoritative for all saved records.</p></section>
    </div>
  );
}

