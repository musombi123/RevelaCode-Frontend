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
import ElimuFinanceControls from "./ElimuFinanceControls";
import ElimuParentDirectory from "./ElimuParentDirectory";
import ElimuLegacyImport from "./ElimuLegacyImport.jsx";
import ElimuTimetableWorkspace from "./ElimuTimetableWorkspace.jsx";


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
  if (typeof value === "object") return Object.entries(value).map(([key, item]) => `${humanize(key)}: ${valueText(item)}`).join(" · ");
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
  const candidates = [
    error?.payload?.message,
    error?.payload?.error?.message,
    error?.payload?.error,
    error?.response?.data?.message,
    error?.response?.data?.error?.message,
    error?.response?.data?.error,
    error?.message,
  ];
  const message = candidates.find(
    (value) => typeof value === "string" && value.trim(),
  );
  return message || "The request could not be completed.";
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

function RecordTable({ rows, query, moduleKey }) {
  const [classFilter, setClassFilter] = useState("");
  const [streamFilter, setStreamFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");

  const displayText = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (Array.isArray(value)) return value.map((item) => typeof item === "object" ? (item?.name || item?.title || item?.label || "") : String(item)).filter(Boolean).join(", ") || "—";
    if (typeof value === "object") return value.name || value.display_name || value.title || value.label || "—";
    return String(value);
  };
  const classOf = (row) => row?.class_name || row?.class?.name || row?.class?.class_name || row?.grade || row?.level || "";
  const streamOf = (row) => row?.stream_name || row?.stream || row?.class_stream || row?.class?.stream || "";
  const coursesOf = (row) => row?.courses || row?.subjects || row?.course_names || row?.course_name || row?.programme_name || row?.learning_areas || row?.teaching?.subjects || [];
  const unique = (values) => [...new Set(values.map((value) => displayText(value)).filter((value) => value && value !== "—"))].sort((a, b) => a.localeCompare(b));
  const classOptions = unique(rows.map(classOf));
  const streamOptions = unique(rows.map(streamOf));
  const courseOptions = unique(rows.flatMap((row) => {
    const values = coursesOf(row);
    return Array.isArray(values) ? values.map((item) => typeof item === "object" ? (item.name || item.title || item.label) : item) : String(values || "").split(",");
  }));

  const filteredRows = rows.filter((row) => {
    const matchesQuery = JSON.stringify(row).toLowerCase().includes(String(query || "").toLowerCase());
    if (!matchesQuery) return false;
    if (moduleKey !== "students") return true;
    if (classFilter && String(classOf(row)) !== classFilter) return false;
    if (streamFilter && String(streamOf(row)) !== streamFilter) return false;
    if (courseFilter) {
      const courses = coursesOf(row);
      const courseText = (Array.isArray(courses) ? courses : [courses]).map((item) => typeof item === "object" ? (item.name || item.title || item.label || "") : String(item || "")).join(", ").toLowerCase();
      if (!courseText.includes(courseFilter.toLowerCase())) return false;
    }
    return true;
  });

  const classColumns = [
    { key: "class_id", label: "Class ID", value: (row) => row?.class_id || row?.id || row?._id || row?.code },
    { key: "class_name", label: "Class name", value: (row) => row?.class_name || row?.name || row?.title },
    { key: "class_teacher", label: "Class teacher", value: (row) => row?.class_teacher_name || row?.teacher_name || row?.class_teacher?.display_name || row?.class_teacher?.name || row?.teacher?.display_name || row?.teacher?.name || row?.class_teacher || row?.teacher },
    { key: "total_students", label: "Total student", value: (row) => row?.total_students ?? row?.student_count ?? row?.students_count ?? (Array.isArray(row?.students) ? row.students.length : undefined) },
  ];
  const studentColumns = [
    { key: "admission_number", label: "Admission no. by school", value: (row) => row?.admission_number || row?.school_admission_number || row?.admission_no || row?.student_number },
    { key: "student_name", label: "Name", value: (row) => row?.full_name || row?.display_name || row?.name || [row?.first_name, row?.last_name].filter(Boolean).join(" ") },
    { key: "class_name", label: "Class", value: classOf },
    { key: "stream", label: "Stream", value: streamOf },
    { key: "duration", label: "Duration period", value: (row) => row?.duration_period || row?.enrollment_duration || row?.student_duration || row?.duration || row?.term_enrolled || row?.academic_period },
  ];
  const preferred = ["admission_number", "school_admission_number", "admission_no", "full_name", "display_name", "name", "title", "subject", "class_name", "stream", "role", "status", "date", "due_date", "amount", "amount_paid", "score", "max_score"];
  const genericKeys = [...new Set(filteredRows.flatMap((row) => Object.keys(row || {})))].filter((key) => !["_id", "metadata", "raw"].includes(key)).sort((a, b) => {
    const ai = preferred.indexOf(a); const bi = preferred.indexOf(b);
    return (ai < 0 ? 100 : ai) - (bi < 0 ? 100 : bi);
  }).slice(0, 7);
  const columns = moduleKey === "classes" ? classColumns : moduleKey === "students" ? studentColumns : genericKeys.map((key) => ({ key, label: humanize(key), value: (row) => row?.[key] }));

  const filters = moduleKey === "students" ? (
    <div className="mb-4 grid gap-2 sm:grid-cols-3">
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Class
        <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="">All classes</option>{classOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
      </label>
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Stream
        <select value={streamFilter} onChange={(event) => setStreamFilter(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="">All streams</option>{streamOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
      </label>
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Course
        <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="">All courses</option>{courseOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
      </label>
    </div>
  ) : null;

  if (!filteredRows.length) {
    return <>{filters}<div className="rounded-2xl border border-dashed border-slate-200 px-5 py-12 text-center dark:border-slate-800"><Search size={23} className="mx-auto text-slate-300 dark:text-slate-600" /><p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">No matching records</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Change the search or filters, refresh the backend records, or add a new record where available.</p></div></>;
  }

  return (
    <>
      {filters}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-full divide-y divide-slate-200 text-left dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-900"><tr>{columns.map((column) => <th key={column.key} className="whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{column.label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-950">
            {filteredRows.map((row, index) => <tr key={row?.id || row?._id || row?.class_id || row?.student_id || `${rowTitle(row, index)}-${index}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/60">
              {columns.map((column) => {
                const value = column.value(row);
                return <td key={column.key} className="max-w-[280px] px-4 py-3 text-sm text-slate-700 dark:text-slate-300"><span className="block truncate" title={displayText(value)}>{displayText(value)}</span></td>;
              })}
            </tr>)}
          </tbody>
        </table>
      </div>
    </>
  );
}

function getSectionData(sections, name) {
  const entry = sections?.[name];
  if (!entry?.ok) return null;
  return unwrap(entry.data);
}

function getSectionRows(sections, name, keys = []) {
  const data = getSectionData(sections, name);
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key];
  }
  if (data.data && typeof data.data === "object") {
    for (const key of keys) {
      if (Array.isArray(data.data[key])) return data.data[key];
    }
  }
  return [];
}

function DashboardMetric({ label, value, detail, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    red: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  };
  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 break-words text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">{value ?? 0}</p>
      {detail && <p className={`mt-3 inline-flex max-w-full rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone] || tones.blue}`}>{detail}</p>}
    </article>
  );
}

function DashboardSection({ title, description, action, children }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-950 dark:text-white">{title}</h2>
          {description && <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatusLabel({ value }) {
  const status = String(value || "unknown").toLowerCase().replace(/[_-]+/g, " ");
  const color = ["active", "enabled", "completed", "succeeded", "published", "healthy"].includes(status)
    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
    : ["failed", "error", "revoked", "blocked"].includes(status)
      ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
      : ["open", "pending", "queued", "retrying", "paused", "running", "draft", "disabled"].includes(status)
        ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${color}`}>{status}</span>;
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.map((item) => typeof item === "object" ? rowTitle(item, 0) : String(item)).join(", ") : "None";
  if (typeof value === "object") return Object.entries(value).map(([key, item]) => `${humanize(key)}: ${displayValue(item)}`).join(" · ");
  return String(value);
}

function EmptyPanel({ title, description }) {
  return <div className="rounded-xl border border-dashed border-slate-200 px-5 py-8 text-center dark:border-slate-800"><p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p><p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p></div>;
}

function ReportsDashboard({ payload, sections, api, onRefresh, onNotice, onError, loading }) {
  const [reportMode, setReportMode] = useState("student");
  const [form, setForm] = useState({ student_id: "", class_name: "", academic_year: "", term: "", assessment_name: "", assessment_type: "exam" });
  const [saving, setSaving] = useState(false);
  const [publishingId, setPublishingId] = useState("");
  const reportSummary = payload || getSectionData(sections, "summary") || {};
  const overview = reportSummary.overview || reportSummary.summary || {};
  const timetable = reportSummary.timetable || {};
  const curriculaSummary = reportSummary.curricula || {};
  const programmesSummary = reportSummary.programmes || {};
  const reports = getSectionRows(sections, "examReports", ["reports", "exam_reports", "items", "records", "results"]);
  const programmes = getSectionRows(sections, "programmes", ["programmes", "items", "records", "results"]);
  const curricula = getSectionRows(sections, "curricula", ["curricula", "items", "records", "results"]);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const generate = async (event) => {
    event.preventDefault();
    onError(""); onNotice("");
    if (reportMode === "student" && !form.student_id.trim()) { onError("Enter the learner's student record ID to generate an individual report."); return; }
    if (reportMode === "class" && !form.class_name.trim()) { onError("Enter a class name to generate class reports."); return; }
    setSaving(true);
    try {
      const common = {
        academic_year: form.academic_year.trim(),
        term: form.term.trim(),
        assessment_name: form.assessment_name.trim(),
        assessment_type: form.assessment_type,
        include_attendance: true,
      };
      if (reportMode === "student") await api.createStudentExamReport({ ...common, student_id: form.student_id.trim() });
      else await api.createClassExamReport({ ...common, class_name: form.class_name.trim() });
      onNotice(reportMode === "student" ? "Individual learner report generation was requested." : "Class report generation was requested.");
      await onRefresh();
    } catch (err) {
      onError(responseMessage(err));
    } finally { setSaving(false); }
  };

  const publish = async (report) => {
    const id = report?.id || report?._id || report?.report_id;
    if (!id) { onError("This report record has no ID that can be published."); return; }
    setPublishingId(String(id)); onError(""); onNotice("");
    try {
      await api.publishExamReport(id);
      onNotice("Report published successfully.");
      await onRefresh();
    } catch (err) { onError(responseMessage(err)); }
    finally { setPublishingId(""); }
  };

  const metrics = [
    ["Students", overview.students ?? 0, "Learner records", "blue"],
    ["Classes", overview.classes ?? 0, "Registered classes", "slate"],
    ["Attendance records", overview.attendance ?? 0, "Attendance activity", "green"],
    ["Assessments", overview.assessments ?? 0, "Assessment records", "blue"],
    ["Fee records", overview.fees ?? 0, "Finance activity", "amber"],
    ["Staff", overview.staff ?? 0, "School team", "slate"],
    ["Exam reports", overview.exam_reports ?? reports.length, "Generated reports", "green"],
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, detail, tone]) => <DashboardMetric key={label} label={label} value={value} detail={detail} tone={tone} />)}</div>
      <div className="grid gap-5 xl:grid-cols-3">
        <DashboardSection title="Curriculum configuration" description="Learning framework currently connected to school reports.">
          <div className="flex items-end justify-between gap-4"><div><p className="text-3xl font-extrabold text-slate-950 dark:text-white">{curriculaSummary.count ?? curricula.length}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Curriculum records</p></div><BookOpen className="text-blue-700 dark:text-blue-300" size={27} /></div>
          {curricula.length > 0 && <div className="mt-4 space-y-2">{curricula.slice(0, 4).map((item, index) => <div key={item.id || item._id || index} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="text-sm font-semibold text-slate-900 dark:text-white">{rowTitle(item, index)}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{[item.education_level, item.grade, item.academic_year, item.status].filter(Boolean).join(" · ") || "Configured curriculum"}</p></div>)}</div>}
          {curricula.length === 0 && <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Curriculum entries will appear here when configured for this school.</p>}
        </DashboardSection>
        <DashboardSection title="School programmes" description="Post-exam plans and academic follow-up programmes.">
          <div className="flex items-end justify-between gap-4"><div><p className="text-3xl font-extrabold text-slate-950 dark:text-white">{programmesSummary.count ?? programmes.length}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Programme records</p></div><CalendarDays className="text-emerald-700 dark:text-emerald-300" size={27} /></div>
          {programmes.length > 0 && <div className="mt-4 space-y-2">{programmes.slice(0, 4).map((item, index) => <div key={item.id || item._id || index} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="text-sm font-semibold text-slate-900 dark:text-white">{rowTitle(item, index)}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{[item.academic_year, item.term, item.status].filter(Boolean).join(" · ") || "School programme"}</p></div>)}</div>}
          {programmes.length === 0 && <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Programmes appear here after the school creates them.</p>}
        </DashboardSection>
        <DashboardSection title="Timetable coverage" description="Counts reported by the timetable service.">
          <div className="grid grid-cols-2 gap-3">{[["Teachers", timetable.teachers], ["Subjects", timetable.subjects], ["Classes", timetable.classes], ["Entries", timetable.entries], ["Rooms", timetable.rooms]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="text-xs text-slate-500 dark:text-slate-400">{label}</p><p className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{value ?? 0}</p></div>)}</div>
        </DashboardSection>
      </div>
      <DashboardSection title="Generate report cards" description="Create a learner report or request reports for an entire class. The backend validates school access and the supplied identifiers.">
        <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900"><button type="button" onClick={() => setReportMode("student")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${reportMode === "student" ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>Individual learner</button><button type="button" onClick={() => setReportMode("class")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${reportMode === "class" ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>Whole class</button></div>
        <form onSubmit={generate} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {reportMode === "student" ? <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Student record ID<input name="student_id" value={form.student_id} onChange={update} required placeholder="Paste student record ID" className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label> : <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Class name<input name="class_name" value={form.class_name} onChange={update} required placeholder="e.g. Grade 8 East" className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>}
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Academic year<input name="academic_year" value={form.academic_year} onChange={update} placeholder="e.g. 2026" className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Term<input name="term" value={form.term} onChange={update} placeholder="e.g. Term 3" className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Assessment name<input name="assessment_name" value={form.assessment_name} onChange={update} placeholder="e.g. End term assessment" className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Assessment type<select name="assessment_type" value={form.assessment_type} onChange={update} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="exam">Exam</option><option value="continuous_assessment">Continuous assessment</option><option value="project">Project</option><option value="other">Other</option></select></label>
          <div className="flex items-end"><button type="submit" disabled={saving} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60">{saving ? <Loader size={16} className="animate-spin" /> : <FileBarChart2 size={16} />}{saving ? "Requesting report…" : "Generate report"}</button></div>
        </form>
      </DashboardSection>
      <DashboardSection title="Report-card register" description={`${reports.length} report record${reports.length === 1 ? "" : "s"} returned by the reporting service.`}>
        {reports.length ? <div className="grid gap-3 xl:grid-cols-2">{reports.map((report, index) => { const id = report.id || report._id || report.report_id; const status = report.status || (report.is_published ? "published" : "draft"); return <article key={id || index} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words text-sm font-bold text-slate-900 dark:text-white">{rowTitle(report, index)}</p><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{[report.class_name, report.academic_year, report.term, report.assessment_name].filter(Boolean).join(" · ") || "Report card"}</p></div><StatusLabel value={status} /></div><div className="mt-4 flex flex-wrap items-center justify-between gap-2">{report.student_name && <span className="text-xs text-slate-500 dark:text-slate-400">{report.student_name}</span>}{!["published", "complete", "completed"].includes(String(status).toLowerCase()) && <button type="button" disabled={publishingId === String(id) || !id} onClick={() => void publish(report)} className="min-h-9 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-900 dark:text-emerald-300">{publishingId === String(id) ? "Publishing…" : "Publish report"}</button>}</div></article>; })}</div> : <EmptyPanel title={loading ? "Loading report cards…" : "No report cards yet"} description="Generate an individual or class report above. Saved report cards will appear here with their publication status." />}
      </DashboardSection>
    </div>
  );
}

function AutomationDashboard({ sections, api, onRefresh, onNotice, onError }) {
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [form, setForm] = useState({ name: "", description: "", trigger: "manual", action: "notify", enabled: true });
  const status = getSectionData(sections, "status") || {};
  const ruleStats = status.rules || {};
  const jobStats = status.jobs || {};
  const actions = getSectionRows(sections, "actions", ["actions", "items", "results"]);
  const rules = getSectionRows(sections, "rules", ["rules", "items", "results"]);
  const jobs = getSectionRows(sections, "jobs", ["jobs", "items", "results"]);
  const logs = getSectionRows(sections, "logs", ["logs", "items", "results"]);
  const triggers = ["manual", "startup", "scheduled", "reconnect", "import", "repair", "api"];
  const invoke = async (key, id, operation, successMessage) => {
    if (!id) { onError("This item does not have a usable ID."); return; }
    setWorkingId(`${key}:${id}`); onError(""); onNotice("");
    try { await operation(id); onNotice(successMessage); await onRefresh(); }
    catch (err) { onError(responseMessage(err)); }
    finally { setWorkingId(""); }
  };
  const createRule = async (event) => {
    event.preventDefault(); onError(""); onNotice(""); setSaving(true);
    try {
      await api.createAutomationRule({ ...form, name: form.name.trim(), description: form.description.trim(), max_attempts: 3, conditions: {}, configuration: {} });
      setForm({ name: "", description: "", trigger: "manual", action: actions[0]?.name || "notify", enabled: true });
      setFormOpen(false); onNotice("Automation rule saved."); await onRefresh();
    } catch (err) { onError(responseMessage(err)); }
    finally { setSaving(false); }
  };
  const jobId = (item) => item?.id || item?._id || item?.job_id;
  const ruleId = (item) => item?.id || item?._id || item?.rule_id;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><DashboardMetric label="Rules" value={ruleStats.total ?? rules.length} detail={`${ruleStats.enabled ?? rules.filter((r) => r.enabled).length} enabled`} tone="blue"/><DashboardMetric label="Queued jobs" value={jobStats.pending ?? jobStats.queued ?? jobs.filter((j) => ["pending", "queued"].includes(j.status)).length} detail="Waiting to run" tone="amber"/><DashboardMetric label="Running jobs" value={jobStats.running ?? jobs.filter((j) => j.status === "running").length} detail="In progress" tone="green"/><DashboardMetric label="Failed jobs" value={jobStats.failed ?? jobs.filter((j) => j.status === "failed").length} detail={status.healthy === false ? "Needs attention" : "Automation health"} tone={status.healthy === false ? "red" : "slate"}/></div>
      <DashboardSection title="Automation rules" description="Enable, disable, run, or remove rules for this school." action={<button type="button" onClick={() => setFormOpen((v) => !v)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"><Plus size={15}/>{formOpen ? "Close form" : "New rule"}</button>}>
        {formOpen && <form onSubmit={createRule} className="mb-5 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20"><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Rule name<input required maxLength={160} value={form.name} onChange={(e) => setForm((v) => ({...v, name:e.target.value}))} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" placeholder="e.g. Attendance review reminder"/></label><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Trigger<select value={form.trigger} onChange={(e) => setForm((v) => ({...v, trigger:e.target.value}))} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white">{triggers.map((trigger) => <option key={trigger} value={trigger}>{humanize(trigger)}</option>)}</select></label><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Action<select value={form.action} onChange={(e) => setForm((v) => ({...v, action:e.target.value}))} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white">{actions.map((action) => <option key={action.name} value={action.name}>{humanize(action.name)}</option>)}</select></label><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Description<input maxLength={500} value={form.description} onChange={(e) => setForm((v) => ({...v, description:e.target.value}))} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" placeholder="What should this rule do?"/></label></div><label className="mt-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm((v) => ({...v, enabled:e.target.checked}))}/>Enable rule immediately</label><div className="mt-4 flex flex-wrap gap-2"><button type="submit" disabled={saving || !actions.length} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? <Loader size={15} className="animate-spin"/> : <CheckCircle2 size={15}/>}Save rule</button><button type="button" onClick={() => setFormOpen(false)} className="min-h-10 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Cancel</button></div></form>}
        {rules.length ? <div className="grid gap-3 xl:grid-cols-2">{rules.map((rule, index) => { const id = ruleId(rule); return <article key={id || index} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words text-sm font-bold text-slate-900 dark:text-white">{rule.name || `Automation rule ${index + 1}`}</h3><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{rule.description || "No description provided."}</p></div><StatusLabel value={rule.enabled ? "enabled" : "disabled"}/></div><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700 dark:bg-slate-900 dark:text-slate-300">Trigger: {humanize(rule.trigger || "manual")}</span><span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700 dark:bg-slate-900 dark:text-slate-300">Action: {humanize(rule.action || "notify")}</span></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={!id || Boolean(workingId)} onClick={() => void invoke("rule-toggle", id, (value) => rule.enabled ? api.disableAutomationRule(value) : api.enableAutomationRule(value), rule.enabled ? "Automation rule disabled." : "Automation rule enabled.")} className="min-h-9 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">{rule.enabled ? "Disable" : "Enable"}</button><button type="button" disabled={!id || Boolean(workingId)} onClick={() => void invoke("rule-run", id, (value) => api.runAutomationRule(value, {}), "Automation job queued.")} className="min-h-9 rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Run now</button><button type="button" disabled={!id || Boolean(workingId)} onClick={() => { if (window.confirm(`Delete automation rule “${rule.name || "this rule"}”? Existing logs will be retained.`)) void invoke("rule-delete", id, (value) => api.deleteAutomationRule(value), "Automation rule deleted."); }} className="min-h-9 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50 dark:border-red-900 dark:text-red-300">Delete</button></div></article>; })}</div> : <EmptyPanel title="No automation rules configured" description="Create a rule to define its trigger, the action to run, and whether it starts enabled."/>}
      </DashboardSection>
      <DashboardSection title="Job queue" description="Track execution outcomes and retry or cancel jobs where allowed.">
        {jobs.length ? <div className="space-y-3">{jobs.map((job, index) => { const id = jobId(job); const state = String(job.status || "unknown").toLowerCase(); const canRetry = ["failed", "cancelled"].includes(state); const canCancel = ["pending", "queued", "running", "retrying"].includes(state); return <article key={id || index} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="break-words text-sm font-bold text-slate-900 dark:text-white">{job.action ? humanize(job.action) : job.name || `Automation job ${index + 1}`}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{[job.trigger, job.created_at, job.attempts != null ? `Attempts: ${job.attempts}` : ""].filter(Boolean).join(" · ")}</p>{job.error && <p className="mt-2 break-words text-xs text-red-700 dark:text-red-300">{job.error}</p>}</div><div className="flex flex-wrap items-center gap-2"><StatusLabel value={state}/>{canRetry && <button type="button" disabled={Boolean(workingId)} onClick={() => void invoke("job-retry", id, (value) => api.retryAutomationJob(value, {}), "Job queued for retry.")} className="min-h-9 rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Retry</button>}{canCancel && <button type="button" disabled={Boolean(workingId)} onClick={() => void invoke("job-cancel", id, (value) => api.cancelAutomationJob(value, { reason: "Cancelled from Elimu dashboard" }), "Job cancellation requested.")} className="min-h-9 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">Cancel</button>}</div></article>; })}</div> : <EmptyPanel title="No automation jobs" description="Queued and completed runs will appear here when rules are executed."/>}
      </DashboardSection>
      <DashboardSection title="Activity log" description="Recent automation events from the audit log.">
        {logs.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{logs.slice(0, 10).map((log, index) => <div key={log.id || log._id || index} className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-slate-900 dark:text-white">{humanize(log.event || log.action || "Automation event")}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{[log.created_at, log.rule_id ? `Rule ${log.rule_id}` : "", log.job_id ? `Job ${log.job_id}` : ""].filter(Boolean).join(" · ")}</p></div><StatusLabel value={log.status || "recorded"}/></div>)}</div> : <EmptyPanel title="No activity recorded" description="Automation actions are logged here when rules, jobs, or controls are used."/>}
      </DashboardSection>
    </div>
  );
}

function SyncDashboard({ sections, api, onRefresh, onNotice, onError }) {
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [form, setForm] = useState({ name: "School Desktop", platform: "windows" });
  const [provisioned, setProvisioned] = useState(null);
  const [conflictNote, setConflictNote] = useState("Reviewed by school administrator");
  const status = getSectionData(sections, "status") || {};
  const summary = status.summary || {};
  const connections = getSectionRows(sections, "connections", ["connections", "items", "records", "results"]).length ? getSectionRows(sections, "connections", ["connections", "items", "records", "results"]) : (Array.isArray(status.connections) ? status.connections : []);
  const devices = getSectionRows(sections, "devices", ["devices", "items", "records", "results"]);
  const jobs = getSectionRows(sections, "jobs", ["jobs", "items", "records", "results"]);
  const conflicts = getSectionRows(sections, "conflicts", ["conflicts", "items", "records", "results"]);
  const openConflicts = conflicts.filter((item) => String(item.status || "open").toLowerCase() === "open");
  const itemId = (item, fallbackKey) => item?.id || item?._id || item?.[fallbackKey];
  const invoke = async (key, id, operation, successMessage) => {
    if (!id) { onError("This sync item does not have a usable ID."); return; }
    setWorkingId(`${key}:${id}`); onError(""); onNotice("");
    try { await operation(id); onNotice(successMessage); await onRefresh(); }
    catch (err) { onError(responseMessage(err)); }
    finally { setWorkingId(""); }
  };
  const createConnection = async (event) => {
    event.preventDefault(); onError(""); onNotice(""); setSaving(true); setProvisioned(null);
    try {
      const response = unwrap(await api.createSyncConnection({ name: form.name.trim() || "School Desktop", platform: form.platform }));
      const connection = response?.connection || response;
      const token = connection?.token || connection?.connection_token || connection?.access_token || "";
      setProvisioned({ name: connection?.name || form.name, token, warning: connection?.warning || "Store this credential securely. It may not be shown again." });
      setFormOpen(false); onNotice("Synchronization connection created."); await onRefresh();
    } catch (err) { onError(responseMessage(err)); }
    finally { setSaving(false); }
  };
  const resolveConflict = async (conflict, decision) => {
    const id = itemId(conflict, "conflict_id");
    await invoke("conflict", id, (value) => api.resolveSyncConflict(value, { decision, note: conflictNote }), `Conflict ${decision.replace("_", " ")} choice submitted.`);
  };
  const statusOf = (item) => String(item?.status || item?.state || "unknown").toLowerCase();

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><DashboardMetric label="Connections" value={summary.connections ?? connections.length} detail={`${summary.active_connections ?? connections.filter((c) => statusOf(c) === "active").length} active`} tone="blue"/><DashboardMetric label="Devices" value={devices.length} detail="Registered clients" tone="slate"/><DashboardMetric label="Sync jobs in queue" value={(summary.queued_jobs ?? 0) + (summary.running_jobs ?? 0)} detail={`${summary.queued_jobs ?? 0} queued · ${summary.running_jobs ?? 0} running`} tone="amber"/><DashboardMetric label="Open conflicts" value={summary.open_conflicts ?? openConflicts.length} detail={`${summary.failed_jobs ?? 0} failed jobs`} tone={(summary.open_conflicts || openConflicts.length || summary.failed_jobs) ? "red" : "green"}/></div>
      <DashboardSection title="Desktop and device connections" description="Provision and manage authenticated clients for the school sync service." action={<button type="button" onClick={() => setFormOpen((v) => !v)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"><Plus size={15}/>{formOpen ? "Close form" : "Add connection"}</button>}>
        {provisioned?.token && <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"><p className="text-sm font-bold text-amber-950 dark:text-amber-100">New connection credential — copy it now</p><p className="mt-1 text-xs leading-5 text-amber-900 dark:text-amber-200">This token is held only in this screen's memory and is not saved to browser storage. Store it securely in the matching desktop client.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><code className="min-w-0 flex-1 break-all rounded-lg border border-amber-200 bg-white p-3 text-xs text-slate-900 dark:border-amber-900 dark:bg-slate-950 dark:text-white">{provisioned.token}</code><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(provisioned.token); onNotice("Connection token copied to clipboard."); } catch { onError("Clipboard access was blocked. Select and copy the token manually."); } }} className="min-h-10 rounded-lg bg-amber-700 px-3 py-2 text-xs font-bold text-white">Copy token</button></div><p className="mt-2 text-xs text-amber-900 dark:text-amber-200">{provisioned.warning}</p><button type="button" onClick={() => setProvisioned(null)} className="mt-3 text-xs font-bold text-amber-900 underline dark:text-amber-100">Hide credential</button></div>}
        {formOpen && <form onSubmit={createConnection} className="mb-5 grid gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20 sm:grid-cols-3"><label className="text-xs font-semibold text-slate-600 dark:text-slate-300 sm:col-span-2">Connection name<input required maxLength={160} value={form.name} onChange={(e) => setForm((v) => ({...v, name:e.target.value}))} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" placeholder="e.g. Makuselwa office desktop"/></label><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Platform<select value={form.platform} onChange={(e) => setForm((v) => ({...v, platform:e.target.value}))} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white">{["windows", "desktop", "macos", "linux", "android", "web", "api", "other"].map((p) => <option key={p} value={p}>{humanize(p)}</option>)}</select></label><div className="flex flex-wrap gap-2 sm:col-span-3"><button type="submit" disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? <Loader size={15} className="animate-spin"/> : <CheckCircle2 size={15}/>}Create connection</button><button type="button" onClick={() => setFormOpen(false)} className="min-h-10 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Cancel</button></div></form>}
        {connections.length ? <div className="grid gap-3 xl:grid-cols-2">{connections.map((connection, index) => { const id = itemId(connection, "connection_id"); const state = statusOf(connection); return <article key={id || index} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words text-sm font-bold text-slate-900 dark:text-white">{connection.name || connection.connection_name || `Connection ${index + 1}`}</p><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{[connection.platform, connection.device_id, connection.last_seen_at || connection.last_heartbeat_at].filter(Boolean).join(" · ") || "Desktop sync connection"}</p></div><StatusLabel value={state}/></div><div className="mt-4 flex flex-wrap gap-2">{state === "active" ? <button type="button" disabled={Boolean(workingId)} onClick={() => void invoke("connection-pause", id, (value) => api.pauseSyncConnection(value, {}), "Connection paused.")} className="min-h-9 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">Pause</button> : ["pending", "paused", "error"].includes(state) ? <button type="button" disabled={Boolean(workingId)} onClick={() => void invoke("connection-activate", id, (value) => api.activateSyncConnection(value, {}), "Connection activated.")} className="min-h-9 rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Activate</button> : null}{!["revoked", "expired"].includes(state) && <button type="button" disabled={Boolean(workingId)} onClick={() => { if (window.confirm(`Revoke connection “${connection.name || "this connection"}”?`)) void invoke("connection-revoke", id, (value) => api.revokeSyncConnection(value, {}), "Connection revoked."); }} className="min-h-9 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50 dark:border-red-900 dark:text-red-300">Revoke</button>}</div></article>; })}</div> : <EmptyPanel title="No desktop connections" description="Create a named connection for a school desktop or device. The sync service will issue its credential and enforce permissions."/>}
      </DashboardSection>
      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardSection title="Registered devices" description={`${devices.length} device record${devices.length === 1 ? "" : "s"} returned by the sync service.`}>
          {devices.length ? <div className="space-y-2">{devices.map((device, index) => <article key={itemId(device, "device_id") || index} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><div className="min-w-0"><p className="break-words text-sm font-semibold text-slate-900 dark:text-white">{device.name || device.device_id || `Device ${index + 1}`}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{[device.platform, device.client_version].filter(Boolean).join(" · ")}</p></div><StatusLabel value={statusOf(device)}/></article>)}</div> : <EmptyPanel title="No devices registered" description="Devices will be listed after they register with a provisioned sync connection."/>}
        </DashboardSection>
        <DashboardSection title="Conflict review" description="Choose which version to keep. The backend validates and records every resolution.">
          {openConflicts.length ? <div className="space-y-3">{openConflicts.map((conflict, index) => { const id = itemId(conflict, "conflict_id"); return <article key={id || index} className="rounded-xl border border-amber-200 p-4 dark:border-amber-900/60"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-900 dark:text-white">{humanize(conflict.entity_type || conflict.entity || "Record conflict")}</p><p className="mt-1 break-words text-xs leading-5 text-slate-500 dark:text-slate-400">{[conflict.record_id, conflict.field, conflict.created_at].filter(Boolean).join(" · ") || "Two versions of a record need review."}</p></div><StatusLabel value={conflict.status || "open"}/></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={Boolean(workingId) || !id} onClick={() => void resolveConflict(conflict, "keep_cloud")} className="min-h-9 rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Keep cloud version</button><button type="button" disabled={Boolean(workingId) || !id} onClick={() => void resolveConflict(conflict, "keep_local")} className="min-h-9 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">Keep desktop version</button></div></article>; })}<label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Resolution note<input value={conflictNote} onChange={(e) => setConflictNote(e.target.value)} maxLength={2000} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"/></label></div> : <EmptyPanel title="No open conflicts" description="Conflict records requiring a decision will appear here."/>}
        </DashboardSection>
      </div>
      <DashboardSection title="Synchronization jobs" description="Monitor queued, running, failed, and completed sync jobs.">
        {jobs.length ? <div className="space-y-3">{jobs.map((job, index) => { const id = itemId(job, "job_id"); const state = statusOf(job); return <article key={id || index} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="break-words text-sm font-bold text-slate-900 dark:text-white">{humanize(job.kind || job.job_type || job.operation || "Synchronization job")}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{[job.created_at, job.updated_at, job.progress != null ? `Progress ${job.progress}%` : ""].filter(Boolean).join(" · ")}</p>{job.error && <p className="mt-2 break-words text-xs text-red-700 dark:text-red-300">{job.error}</p>}</div><div className="flex flex-wrap items-center gap-2"><StatusLabel value={state}/>{state === "paused" && <button type="button" disabled={Boolean(workingId)} onClick={() => void invoke("job-resume", id, (value) => api.resumeSyncJob(value, {}), "Sync job resumed.")} className="min-h-9 rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Resume</button>}{["queued", "running", "failed", "cancelled"].includes(state) && <button type="button" disabled={Boolean(workingId)} onClick={() => void invoke("job-retry", id, (value) => api.retrySyncJob(value, {}), "Sync job retry requested.")} className="min-h-9 rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 disabled:opacity-50 dark:border-blue-900 dark:text-blue-300">Retry</button>}{["queued", "running"].includes(state) && <button type="button" disabled={Boolean(workingId)} onClick={() => void invoke("job-cancel", id, (value) => api.cancelSyncJob(value, {}), "Sync job cancellation requested.")} className="min-h-9 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">Cancel</button>}</div></article>; })}</div> : <EmptyPanel title="No sync jobs" description="Job history will populate after clients request synchronization or the backend queues a sync operation."/>}
        <div className="mt-4"><button type="button" onClick={() => void invoke("recovery", "queue", () => api.recoverSyncJobs({}), "Stale sync jobs recovery requested.")} disabled={Boolean(workingId)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"><RefreshCw size={15}/>Recover stale jobs</button></div>
      </DashboardSection>
    </div>
  );
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

      if (moduleKey === "reports") {
        const calls = {
          summary: () => api.getReportsDashboard(),
          examReports: () => api.getExamReports({}),
          programmes: () => api.getProgrammes({}),
          curricula: () => api.getCurriculaReports({}),
        };
        const results = await Promise.all(Object.entries(calls).map(async ([name, call]) => {
          try { return [name, { ok: true, data: await call() }]; }
          catch (err) { return [name, { ok: false, error: responseMessage(err) }]; }
        }));
        const nextSections = Object.fromEntries(results);
        if (!Object.values(nextSections).some((section) => section.ok)) {
          throw new Error("Reporting endpoints are not available for this school session.");
        }
        setSections(nextSections);
        const summaryEntry = nextSections.summary;
        setPayload(summaryEntry?.ok ? unwrap(summaryEntry.data) : null);
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
      let nextRows = extractRows(data);
      if (moduleKey === "classes") {
        const [studentsResult, staffResult] = await Promise.allSettled([
          api.getStudents(),
          api.getStaff(),
        ]);
        const studentsData = studentsResult.status === "fulfilled" ? unwrap(studentsResult.value) : null;
        const staffData = staffResult.status === "fulfilled" ? unwrap(staffResult.value) : null;
        const students = Array.isArray(studentsData) ? studentsData : (studentsData?.students || studentsData?.items || studentsData?.records || []);
        const staff = Array.isArray(staffData) ? staffData : (staffData?.staff || staffData?.members || staffData?.items || []);
        nextRows = nextRows.map((classRecord) => {
          const id = String(classRecord?.class_id || classRecord?.id || classRecord?._id || "");
          const name = String(classRecord?.class_name || classRecord?.name || classRecord?.title || "");
          const teacherId = String(classRecord?.class_teacher_user_id || classRecord?.teacher_user_id || classRecord?.teacher_id || classRecord?.class_teacher?.user_id || classRecord?.teacher?.user_id || "");
          const assignedStudents = students.filter((student) => {
            const studentClassId = String(student?.class_id || student?.classId || student?.class?.id || "");
            const studentClassName = String(student?.class_name || student?.class?.name || student?.grade || "");
            return (id && studentClassId && id === studentClassId) || (!studentClassId && name && studentClassName.toLowerCase() === name.toLowerCase());
          });
          const teacher = staff.find((member) => String(member?.user_id || member?.userId || member?.revelacode_user_id || "") === teacherId);
          const teacherName = classRecord?.class_teacher_name || classRecord?.teacher_name || classRecord?.class_teacher?.display_name || classRecord?.class_teacher?.name || classRecord?.teacher?.display_name || classRecord?.teacher?.name || teacher?.identity?.display_name || teacher?.display_name || teacher?.full_name;
          return {
            ...classRecord,
            total_students: classRecord?.total_students ?? classRecord?.student_count ?? classRecord?.students_count ?? (studentsResult.status === "fulfilled" ? assignedStudents.length : undefined),
            class_teacher_name: teacherName || "",
          };
        });
      }
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
    if (moduleKey !== "timetable") void load();
  }, [load, moduleKey]);

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

  if (moduleKey === "timetable") {
    return (
      <ElimuTimetableWorkspace
        api={api}
        school={school}
        role={role}
        onBack={() => onNavigate?.("elimu")}
      />
    );
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

      {moduleKey === "sync" && <ElimuLegacyImport api={api} school={school} />}
      {moduleKey === "fees" && <ElimuFinanceControls api={api} role={role} onNotice={setNotice} onError={setError} />}

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

      {moduleKey === "reports" && <ReportsDashboard payload={payload} sections={sections} api={api} onRefresh={load} onNotice={setNotice} onError={setError} loading={loading} />}
      {moduleKey === "automation" && sections && <AutomationDashboard sections={sections} api={api} onRefresh={load} onNotice={setNotice} onError={setError} />}
      {moduleKey === "sync" && sections && <SyncDashboard sections={sections} api={api} onRefresh={load} onNotice={setNotice} onError={setError} />}

      {!(moduleKey === "school" || moduleKey === "settings" || moduleKey === "reports" || moduleKey === "automation" || moduleKey === "sync") && (
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

          {loading ? <div className="mt-5 flex items-center justify-center gap-3 rounded-2xl bg-slate-50 p-12 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400"><Loader size={19} className="animate-spin" /> Loading {meta.title.toLowerCase()}â€¦</div> : rows.length ? <div className="mt-5"><RecordTable rows={rows} query={query} moduleKey={moduleKey} /></div> : !sections && <div className="mt-5 rounded-2xl border border-dashed border-slate-200 px-5 py-12 text-center dark:border-slate-800"><ModuleIcon size={25} className="mx-auto text-slate-300 dark:text-slate-600" /><p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">No records to display yet</p><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400">This screen is connected to its Elimu read endpoint. Add a record where supported, or refresh after records have been created for this school.</p></div>}
          {moduleKey === "students" && <ElimuParentDirectory api={api} />}
        </section>
      )}

      <section className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" /><p className="text-xs leading-5 text-slate-600 dark:text-slate-300">These modules use the shared Elimu API client. The browser does not choose or override school ownership. Backend permissions remain authoritative for all saved records.</p></section>
    </div>
  );
}

