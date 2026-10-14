import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Users,
} from "lucide-react";

const DAYS = [
  ["monday", "Monday"], ["tuesday", "Tuesday"], ["wednesday", "Wednesday"],
  ["thursday", "Thursday"], ["friday", "Friday"], ["saturday", "Saturday"], ["sunday", "Sunday"],
];
const INPUT = "mt-1.5 min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

function unwrap(value) {
  let current = value;
  for (let i = 0; i < 7; i += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return current;
    if (current.success === false || current.ok === false) throw new Error(current.message || current.error?.message || current.error || "The request failed.");
    if (Object.prototype.hasOwnProperty.call(current, "data")) { current = current.data; continue; }
    if (Object.prototype.hasOwnProperty.call(current, "result")) { current = current.result; continue; }
    return current;
  }
  return current;
}
function rowsFrom(value, keys) {
  const data = unwrap(value);
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  for (const key of keys) if (Array.isArray(data[key])) return data[key];
  return [];
}
function idOf(record) {
  return String(record?.id ?? record?._id ?? record?.class_id ?? "").trim();
}
function className(record) {
  return String(record?.name || record?.class_name || [record?.level, record?.stream].filter(Boolean).join(" ") || record?.code || "Unnamed class").trim();
}
function teacherId(record) {
  return String(record?.teacher_user_id ?? record?.user_id ?? record?.member_user_id ?? record?.id ?? record?._id ?? "").trim();
}
function teacherName(record) {
  return String(record?.full_name || record?.name || record?.display_name || record?.email || "Teacher").trim();
}
function subjectName(record) {
  return String(record?.subject || record?.subject_name || record?.learning_area || "").trim();
}
function subjectsForClass(lessons, classes, targetClassId) {
  if (!targetClassId) return [];
  const target = classes.find((item) => idOf(item) === targetClassId);
  const targetName = className(target || {}).toLowerCase();
  const names = new Map();
  lessons.forEach((lesson) => {
    const subject = subjectName(lesson);
    if (!subject) return;
    const assignedId = String(lesson?.class_id ?? lesson?.classId ?? "").trim();
    const assignedName = String(lesson?.class_name ?? lesson?.class ?? lesson?.class_label ?? "").trim().toLowerCase();
    // Lessons with no class metadata are school-wide lesson records. Explicitly
    // class-bound lessons are only offered to that class.
    if (assignedId && assignedId !== targetClassId) return;
    if (!assignedId && assignedName && assignedName !== targetName) return;
    if (!names.has(subject.toLowerCase())) names.set(subject.toLowerCase(), subject);
  });
  return [...names.values()].sort((a, b) => a.localeCompare(b));
}
function assignmentTeacherId(item) { return String(item?.teacher_user_id ?? item?.user_id ?? "").trim(); }
function assignmentClassId(item) { return String(item?.class_id ?? "").trim(); }
function assignmentIsActive(item) { return !["inactive", "disabled", "removed", "revoked", "suspended"].includes(String(item?.status || "active").toLowerCase()); }
function assignedTeacherFor(assignment, subject) {
  const subjects = Array.isArray(assignment?.subjects) ? assignment.subjects.map((value) => String(value?.name ?? value?.subject ?? value).toLowerCase()) : [];
  return !subjects.length || subjects.includes(String(subject || "").toLowerCase());
}
function errorMessage(error) {
  return error?.payload?.message || error?.payload?.error?.message || error?.payload?.error || error?.message || "The timetable request could not be completed.";
}
function timetableId(item) {
  return String(item?.id || item?._id || item?.timetable_id || "").trim();
}
function minutesAt(time) {
  const [hour, minute] = String(time || "08:00").split(":").map(Number);
  return (Number.isFinite(hour) ? hour : 8) * 60 + (Number.isFinite(minute) ? minute : 0);
}
function timeText(minutes) {
  const value = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}
function buildPeriods({ startTime, lessonMinutes, breakMinutes, lessonsPerDay, breakAfter }) {
  const periods = [];
  let cursor = minutesAt(startTime);
  let taught = 0;
  let periodNo = 1;
  while (taught < lessonsPerDay) {
    const start = cursor;
    cursor += lessonMinutes;
    periods.push({ period_id: `p${periodNo}`, label: `Period ${periodNo}`, type: "lesson", start_time: timeText(start), end_time: timeText(cursor) });
    taught += 1;
    periodNo += 1;
    if (breakAfter > 0 && taught < lessonsPerDay && taught % breakAfter === 0) {
      const breakStart = cursor;
      cursor += breakMinutes;
      periods.push({ period_id: `break${periodNo}`, label: "Break", type: "break", start_time: timeText(breakStart), end_time: timeText(cursor) });
    }
  }
  return periods;
}
function Panel({ title, description, action, children }) {
  return <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:p-6"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-base font-extrabold text-slate-950 dark:text-white">{title}</h2>{description && <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>}</div>{action}</div>{children}</section>;
}
function SmallLabel({ children }) { return <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{children}</span>; }

/** Uses only live Elimu data and the existing authenticated timetable endpoints. */
export default function ElimuTimetableWorkspace({ api, school, role, onBack }) {
  const [timetables, setTimetables] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selected, setSelected] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [catalogWarning, setCatalogWarning] = useState("");
  const [name, setName] = useState("Academic Timetable");
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear()));
  const [term, setTerm] = useState("");
  const [days, setDays] = useState(["monday", "tuesday", "wednesday", "thursday", "friday"]);
  const [startTime, setStartTime] = useState("08:00");
  const [lessonMinutes, setLessonMinutes] = useState(40);
  const [breakMinutes, setBreakMinutes] = useState(20);
  const [lessonsPerDay, setLessonsPerDay] = useState(8);
  const [breakAfter, setBreakAfter] = useState(3);
  const [classId, setClassId] = useState("");
  const [subject, setSubject] = useState("");
  const [teacherUserId, setTeacherUserId] = useState("");
  const [weeklyLessons, setWeeklyLessons] = useState(4);
  const [view, setView] = useState("school");
  const [classFilter, setClassFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const selectedIdRef = useRef("");
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  const subjectsForSelectedClass = useMemo(() => subjectsForClass(lessons, classes, classId), [lessons, classes, classId]);
  const teachersForSelection = useMemo(() => {
    if (!classId || !subject) return [];
    const relevant = assignments.filter((item) => assignmentIsActive(item) && assignmentClassId(item) === classId && assignedTeacherFor(item, subject));
    const allowedIds = new Set(relevant.map(assignmentTeacherId).filter(Boolean));
    return teachers.filter((item) => allowedIds.has(teacherId(item)));
  }, [assignments, classId, subject, teachers]);

  const subjects = useMemo(() => {
    const unique = new Map();
    lessons.forEach((record) => { const value = subjectName(record); if (value && !unique.has(value.toLocaleLowerCase())) unique.set(value.toLocaleLowerCase(), value); });
    return [...unique.values()].sort((a, b) => a.localeCompare(b));
  }, [lessons]);

  const load = useCallback(async (preserve = true) => {
    setLoading(true); setError(""); setCatalogWarning("");
    try {
      const response = await api.getTimetable({});
      const list = rowsFrom(response, ["timetables", "items", "records", "results"]);
      setTimetables(list);
      const [classResult, teacherResult, lessonResult, assignmentResult] = await Promise.allSettled([
        api.getClasses({}),
        typeof api.getTeachers === "function" ? api.getTeachers({}) : api.getStaff({ role: "teacher" }),
        api.getLessons({}),
        typeof api.getStaffAssignments === "function" ? api.getStaffAssignments({}) : Promise.reject(new Error("The staff-assignment API is not available in this frontend build.")),
      ]);
      const warnings = [];
      if (classResult.status === "fulfilled") setClasses(rowsFrom(classResult.value, ["classes", "items", "records", "results"]).filter((item) => idOf(item)));
      else { setClasses([]); warnings.push(`Classes could not be loaded: ${errorMessage(classResult.reason)}`); }
      if (teacherResult.status === "fulfilled") setTeachers(rowsFrom(teacherResult.value, ["teachers", "staff", "members", "items", "records", "results"]).filter((item) => teacherId(item)));
      else { setTeachers([]); warnings.push(`Teachers could not be loaded: ${errorMessage(teacherResult.reason)}`); }
      if (lessonResult.status === "fulfilled") setLessons(rowsFrom(lessonResult.value, ["lessons", "items", "records", "results"]));
      else { setLessons([]); warnings.push(`Subject list could not be loaded from saved lessons: ${errorMessage(lessonResult.reason)}`); }
      if (assignmentResult.status === "fulfilled") setAssignments(rowsFrom(assignmentResult.value, ["assignments", "items", "records", "results"]));
      else { setAssignments([]); warnings.push(`Teacher class assignments could not be loaded: ${errorMessage(assignmentResult.reason)}`); }
      setCatalogWarning(warnings.join(" "));
      const currentSelection = selectedIdRef.current;
      const nextId = preserve && currentSelection && list.some((item) => timetableId(item) === currentSelection) ? currentSelection : (list.length ? timetableId(list[0]) : "");
      setSelectedId(nextId);
      if (nextId) {
        const detail = unwrap(await api.getTimetableById(nextId));
        const record = detail?.timetable || detail;
        setSelected(record);
      } else { setSelected(null); }
    } catch (loadError) { setError(errorMessage(loadError)); }
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => { void load(true); }, [load]);

  const chooseTimetable = async (id) => {
    setSelectedId(id); setNotice(""); setError("");
    if (!id) { setSelected(null); return; }
    setLoading(true);
    try {
      const detail = unwrap(await api.getTimetableById(id));
      const record = detail?.timetable || detail;
      setSelected(record);
    } catch (loadError) { setError(errorMessage(loadError)); }
    finally { setLoading(false); }
  };

  const addRequirement = () => {
    setError(""); setNotice("");
    if (!classId || !subject || !teacherUserId) { setError("Choose a saved class, a subject from saved lesson records, and a teacher assigned to that class."); return; }
    const assigned = assignments.some((item) => assignmentIsActive(item) && assignmentClassId(item) === classId && assignmentTeacherId(item) === teacherUserId && assignedTeacherFor(item, subject));
    if (!assigned) { setError("That teacher has no active assignment to the selected class and subject. Configure a teacher/class assignment before adding the requirement."); return; }
    const duplicate = requirements.some((item) => String(item.class_id) === classId && String(item.subject).toLowerCase() === subject.toLowerCase() && String(item.teacher_user_id) === teacherUserId);
    if (duplicate) { setError("That class, subject and teacher combination is already in the requirements."); return; }
    const klass = classes.find((item) => idOf(item) === classId);
    const teacher = teachers.find((item) => teacherId(item) === teacherUserId);
    setRequirements((current) => [...current, { class_id: classId, class_name: className(klass), subject, teacher_user_id: teacherUserId, teacher_name: teacherName(teacher), lessons_per_week: Math.max(1, Math.min(50, Number(weeklyLessons) || 1)), double_lesson: false }]);
  };

  const createDraft = async (event) => {
    event.preventDefault(); setError(""); setNotice("");
    if (!days.length) { setError("Select at least one teaching day."); return; }
    if (!requirements.length) { setError("Add at least one weekly subject requirement from this school's saved classes, subjects and teachers."); return; }
    const classIds = new Set(classes.map(idOf));
    const valid = requirements.filter((item) => classIds.has(String(item.class_id)) && teachers.some((teacher) => teacherId(teacher) === String(item.teacher_user_id)) && subjectsForClass(lessons, classes, String(item.class_id)).some((value) => value.toLowerCase() === String(item.subject || "").toLowerCase()) && assignments.some((assignment) => assignmentIsActive(assignment) && assignmentClassId(assignment) === String(item.class_id) && assignmentTeacherId(assignment) === String(item.teacher_user_id) && assignedTeacherFor(assignment, item.subject)) && Number(item.lessons_per_week) > 0);
    if (!valid.length) { setError("None of the requirements still match saved classes, teachers and lesson subjects. Refresh the catalogues and reselect them."); return; }
    setSaving(true);
    try {
      const payload = {
        name: name.trim() || "Academic Timetable",
        academic_year: academicYear.trim() || undefined,
        term: term.trim() || undefined,
        weekdays: days,
        periods: buildPeriods({ startTime, lessonMinutes: Math.max(20, Math.min(180, Number(lessonMinutes) || 40)), breakMinutes: Math.max(5, Math.min(120, Number(breakMinutes) || 20)), lessonsPerDay: Math.max(1, Math.min(20, Number(lessonsPerDay) || 8)), breakAfter: Math.max(0, Math.min(10, Number(breakAfter) || 0)) }),
        requirements: valid,
      };
      const created = unwrap(await api.createTimetable(payload));
      const record = created?.timetable || created;
      const id = timetableId(record);
      if (!id) throw new Error("The server response did not include a timetable ID. Refresh the timetable list before retrying.");
      setNotice("Timetable draft saved on the Elimu backend. Generate it to create the actual schedule.");
      setRequirements([]);
      setSelectedId(id);
      await load(false);
      await chooseTimetable(id);
    } catch (createError) { setError(errorMessage(createError)); }
    finally { setSaving(false); }
  };

  const perform = async (action) => {
    if (!selectedId) { setError("Select a saved timetable first."); return; }
    setBusy(action); setError(""); setNotice("");
    try {
      let response;
      if (action === "generate") response = await api.generateTimetable(selectedId, {});
      if (action === "publish") response = await api.publishTimetable(selectedId, {});
      const data = unwrap(response);
      if (data?.validation?.valid === false) throw new Error("The backend returned a timetable that failed validation. It is not reported as successful.");
      setNotice(action === "generate" ? "The backend returned a generated timetable and validation result." : "The backend validated and published the timetable.");
      await load(true);
      await chooseTimetable(selectedId);
    } catch (actionError) { setError(errorMessage(actionError)); }
    finally { setBusy(""); }
  };

  const editEntry = async (entry, day, periodId) => {
    const entryId = idOf(entry) || String(entry?.entry_id || "");
    if (!entryId) { setError("This timetable entry has no server-provided ID, so it cannot be safely edited."); return; }
    setBusy(`entry:${entryId}`); setError(""); setNotice("");
    try {
      await api.updateTimetableEntry(entryId, { day, period_id: periodId });
      setNotice("The entry update was saved after backend validation.");
      await chooseTimetable(selectedId);
    } catch (editError) { setError(errorMessage(editError)); }
    finally { setBusy(""); }
  };

  const entries = Array.isArray(selected?.entries) ? selected.entries : [];
  const periods = Array.isArray(selected?.periods) ? selected.periods : [];
  const weekdays = Array.isArray(selected?.weekdays) ? selected.weekdays : [];
  const lessonPeriods = periods.filter((period) => String(period.type || "lesson").toLowerCase() === "lesson");
  const activeDays = weekdays.filter((day) => DAYS.some(([value]) => value === String(day).toLowerCase()));

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"><div className="bg-slate-950 px-5 py-6 text-white sm:px-8 sm:py-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-blue-200"><CalendarDays size={14}/>TIMETABLE STUDIO</span><h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">Timetable generation</h1><p className="mt-2 text-sm leading-6 text-slate-300">Use this school's saved classes, teachers and subject records. Generation, edits and publication run through authenticated Elimu endpoints.</p><p className="mt-3 text-xs text-slate-400">School: {school?.name || school?.school_name || "Active school"} · Role: {role || "School member"}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={onBack} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold hover:bg-white/10"><ArrowLeft size={15}/>Dashboard</button><button type="button" disabled={loading} onClick={() => void load(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-blue-50 disabled:opacity-60"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/>Refresh</button></div></div></div></section>
    {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"><AlertCircle size={18} className="mt-0.5 shrink-0"/><span>{error}</span></div>}
    {notice && <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"><CheckCircle2 size={18} className="mt-0.5 shrink-0"/><span>{notice}</span></div>}
    {catalogWarning && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"><strong>Catalogue warning:</strong> {catalogWarning}</div>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Saved timetables",timetables.length],["Saved classes",classes.length],["Saved lesson subjects",subjects.length],["Active teacher assignments",assignments.filter(assignmentIsActive).length]].map(([label,value])=><article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><SmallLabel>{label}</SmallLabel><p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{value}</p></article>)}</div>
    <Panel title="Create a timetable draft" description="The subject catalogue is built from saved lesson records because the current backend has no separate subject catalogue endpoint."><form onSubmit={createDraft} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><label className="text-xs font-bold text-slate-600 dark:text-slate-300">Timetable name<input required maxLength={200} value={name} onChange={(e)=>setName(e.target.value)} className={INPUT}/></label><label className="text-xs font-bold text-slate-600 dark:text-slate-300">Academic year<input maxLength={30} value={academicYear} onChange={(e)=>setAcademicYear(e.target.value)} className={INPUT}/></label><label className="text-xs font-bold text-slate-600 dark:text-slate-300">Term<input maxLength={50} value={term} onChange={(e)=>setTerm(e.target.value)} placeholder="e.g. Term 1" className={INPUT}/></label></div>
      <div><SmallLabel>Teaching days</SmallLabel><div className="mt-2 flex flex-wrap gap-2">{DAYS.map(([day,label])=>{const on=days.includes(day);return <button key={day} type="button" aria-pressed={on} onClick={()=>setDays((current)=>on?current.filter((value)=>value!==day):[...current,day].sort((a,b)=>DAYS.findIndex(([x])=>x===a)-DAYS.findIndex(([x])=>x===b)))} className={`min-h-10 rounded-xl border px-3 py-2 text-sm font-semibold ${on?"border-blue-700 bg-blue-700 text-white":"border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"}`}>{label}</button>;})}</div></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">School start time<input required type="time" value={startTime} onChange={(e)=>setStartTime(e.target.value)} className={INPUT}/></label><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Lesson minutes<input required type="number" min="20" max="180" value={lessonMinutes} onChange={(e)=>setLessonMinutes(Number(e.target.value))} className={INPUT}/></label><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Lessons / day<input required type="number" min="1" max="20" value={lessonsPerDay} onChange={(e)=>setLessonsPerDay(Number(e.target.value))} className={INPUT}/></label><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Insert break after<input required type="number" min="0" max="10" value={breakAfter} onChange={(e)=>setBreakAfter(Number(e.target.value))} className={INPUT}/><span className="mt-1 block font-normal">0 disables breaks</span></label><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Break minutes<input required type="number" min="5" max="120" value={breakMinutes} onChange={(e)=>setBreakMinutes(Number(e.target.value))} className={INPUT}/></label></div>
      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20"><div className="flex items-center gap-2"><Users size={17} className="text-blue-700 dark:text-blue-300"/><h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Weekly class–subject–teacher requirements</h3></div><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Choose records already saved for this school. The backend remains responsible for validating IDs, weekly counts and conflicts.</p>
        {(!classes.length||!teachers.length||!assignments.length||!subjects.length)?<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">Generation setup requires saved classes, active teacher-to-class assignments, and lesson records with real subject names. This screen does not fabricate missing records or assume every teacher teaches every class.</div>:<><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Class<select value={classId} onChange={(e)=>setClassId(e.target.value)} className={INPUT}><option value="">Choose class</option>{classes.map((item)=><option key={idOf(item)} value={idOf(item)}>{className(item)}</option>)}</select></label><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Subject<select value={subject} onChange={(e)=>setSubject(e.target.value)} className={INPUT}><option value="">Choose subject</option>{subjectsForSelectedClass.map((item)=><option key={item} value={item}>{item}</option>)}</select></label><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Teacher<select value={teacherUserId} onChange={(e)=>setTeacherUserId(e.target.value)} className={INPUT}><option value="">Choose class-assigned teacher</option>{teachersForSelection.map((item)=><option key={teacherId(item)} value={teacherId(item)}>{teacherName(item)}</option>)}</select></label><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Lessons / week<input type="number" min="1" max="50" value={weeklyLessons} onChange={(e)=>setWeeklyLessons(Number(e.target.value))} className={INPUT}/></label></div><button type="button" onClick={addRequirement} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-800 hover:bg-blue-50 dark:border-blue-900 dark:bg-slate-950 dark:text-blue-200"><Plus size={15}/>Add requirement</button></>}
        {requirements.length>0&&<div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"><table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800"><thead className="bg-white dark:bg-slate-950"><tr>{["Class","Subject","Teacher","Lessons/week",""].map((label)=><th key={label} className="whitespace-nowrap px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{requirements.map((item,index)=><tr key={`${item.class_id}:${item.subject}:${item.teacher_user_id}`}><td className="px-3 py-3">{item.class_name||item.class_id}</td><td className="px-3 py-3">{item.subject}</td><td className="px-3 py-3">{item.teacher_name||item.teacher_user_id}</td><td className="px-3 py-3"><input aria-label={`Lessons per week for ${item.subject}`} type="number" min="1" max="50" value={item.lessons_per_week} onChange={(e)=>setRequirements((current)=>current.map((value,i)=>i===index?{...value,lessons_per_week:Number(e.target.value)}:value))} className="min-h-9 w-24 rounded-lg border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"/></td><td className="px-3 py-3"><button type="button" onClick={()=>setRequirements((current)=>current.filter((_,i)=>i!==index))} className="text-xs font-bold text-red-700 hover:underline dark:text-red-300">Remove</button></td></tr>)}</tbody></table></div>}
      </div><div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">Only lesson periods can contain entries. Teacher availability and rooms are enforced only where actual constraints are configured by the backend.</p><button type="submit" disabled={saving||loading||!classes.length||!teachers.length||!subjects.length} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{saving?<Loader size={16} className="animate-spin"/>:<Save size={16}/>}Save timetable draft</button></div>
    </form></Panel>
    <Panel title="Saved timetables" description="Select a timetable stored by the server, then generate, inspect, edit or publish its actual entries."><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="min-w-0 flex-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Timetable<select value={selectedId} onChange={(e)=>void chooseTimetable(e.target.value)} className={INPUT}><option value="">Choose saved timetable</option>{timetables.map((item)=><option key={timetableId(item)} value={timetableId(item)}>{item.name||"Academic timetable"} · {item.academic_year||"Year not set"} · {item.status||"draft"}</option>)}</select></label>{selected&&<div className="flex flex-wrap gap-2"><button type="button" disabled={Boolean(busy)||loading} onClick={()=>void perform("generate")} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><CalendarDays size={14}/>{busy==="generate"?"Generating…":"Generate"}</button><button type="button" disabled={Boolean(busy)||loading||!entries.length||selected.status==="published"} onClick={()=>void perform("publish")} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 size={14}/>{busy==="publish"?"Publishing…":"Publish"}</button></div>}</div>
      {loading?<div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"><Loader size={18} className="animate-spin"/>Loading saved timetables…</div>:selected?<><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Status",selected.status||"unknown"],["Requirements",Array.isArray(selected.requirements)?selected.requirements.length:0],["Entries",entries.length],["Generation version",selected.generation?.version||"—"]].map(([label,value])=><div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><SmallLabel>{label}</SmallLabel><p className="mt-1 break-words text-sm font-bold capitalize text-slate-950 dark:text-white">{value}</p></div>)}</div>{selected.generation_error&&<div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"><strong>Generation error:</strong> {selected.generation_error}</div>}{selected.validation?.valid===false&&<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><strong>Validation failed.</strong><ul className="mt-2 list-disc pl-5">{(selected.validation.errors||[]).slice(0,10).map((item,index)=><li key={index}>{item.type||JSON.stringify(item)}</li>)}</ul></div>}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">View<select value={view} onChange={(e)=>setView(e.target.value)} className={INPUT}><option value="school">Whole school</option><option value="class">Filter by class</option><option value="teacher">Filter by teacher</option></select></label>{view==="class"&&<label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Class<select value={classFilter} onChange={(e)=>setClassFilter(e.target.value)} className={INPUT}><option value="all">All classes</option>{classes.map((item)=><option key={idOf(item)} value={idOf(item)}>{className(item)}</option>)}</select></label>}{view==="teacher"&&<label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Teacher<select value={teacherFilter} onChange={(e)=>setTeacherFilter(e.target.value)} className={INPUT}><option value="all">All teachers</option>{teachers.map((item)=><option key={teacherId(item)} value={teacherId(item)}>{teacherName(item)}</option>)}</select></label>}</div>
        {!entries.length?<div className="mt-4 rounded-xl border border-dashed border-slate-200 p-7 text-center text-sm text-slate-500 dark:border-slate-800">This saved timetable has no entries. Check its saved requirements and then use Generate.</div>:<div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"><table className="min-w-[760px] w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800"><thead className="bg-slate-50 dark:bg-slate-900"><tr>{["Day","Period / time","Class","Subject","Teacher","Edit slot"].map((label)=><th key={label} className="whitespace-nowrap px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{entries.filter((entry)=>view!=="class"||classFilter==="all"||String(entry.class_id)===classFilter).filter((entry)=>view!=="teacher"||teacherFilter==="all"||String(entry.teacher_user_id)===teacherFilter).map((entry,index)=>{const period=periods.find((item)=>String(item.period_id||item.id)===String(entry.period_id));const klass=classes.find((item)=>idOf(item)===String(entry.class_id));const dayLabel=DAYS.find(([day])=>day===String(entry.day).toLowerCase())?.[1]||entry.day;const entryId=idOf(entry)||String(entry.entry_id||"");return <tr key={entryId||`${entry.day}-${entry.period_id}-${index}`} className="align-top hover:bg-slate-50/70 dark:hover:bg-slate-900/60"><td className="whitespace-nowrap px-3 py-3 font-semibold capitalize">{dayLabel}</td><td className="whitespace-nowrap px-3 py-3"><span className="block font-semibold">{period?.label||entry.period_id}</span><span className="text-xs text-slate-500">{[period?.start_time,period?.end_time].filter(Boolean).join("–")}</span></td><td className="px-3 py-3">{entry.class_name||className(klass||{})}</td><td className="px-3 py-3 font-semibold">{entry.subject}</td><td className="px-3 py-3">{entry.teacher_name||teachers.find((item)=>teacherId(item)===String(entry.teacher_user_id))?.full_name||entry.teacher_user_id||"Not assigned"}</td><td className="px-3 py-3"><div className="flex min-w-48 gap-2"><select aria-label="Change day" value={String(entry.day).toLowerCase()} disabled={Boolean(busy)||!entryId} onChange={(e)=>void editEntry(entry,e.target.value,String(entry.period_id))} className="min-h-9 min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900">{activeDays.map((day)=><option key={day} value={day}>{DAYS.find(([value])=>value===day)?.[1]||day}</option>)}</select><select aria-label="Change period" value={String(entry.period_id)} disabled={Boolean(busy)||!entryId} onChange={(e)=>void editEntry(entry,String(entry.day).toLowerCase(),e.target.value)} className="min-h-9 min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900">{lessonPeriods.map((item)=><option key={item.period_id||item.id} value={item.period_id||item.id}>{item.label||item.period_id||item.id}</option>)}</select></div></td></tr>;})}</tbody></table></div>}
        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400"><Clock3 size={14} className="mt-0.5 shrink-0"/>Edits are sent to the existing entry API; backend validation determines whether the requested slot can be saved.</p>
      </>:<div className="mt-4 rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800"><CalendarDays size={24} className="mx-auto text-slate-400"/><p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">No timetable selected</p><p className="mt-1 text-xs leading-5 text-slate-500">Create a draft using the school's live classes, subjects and teachers above.</p></div>}
    </Panel>
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"><ShieldCheck size={15} className="mr-1 inline"/><strong>Scheduling limits:</strong> The backend's validator determines class/teacher/room collisions and weekly lesson counts. This UI does not manufacture missing rooms or teacher availability. Optimization is intentionally omitted because the currently deployed route invokes a service without its required AI callback; that backend integration must be fixed before optimization can be safely enabled.</div>
  </div>;
}
