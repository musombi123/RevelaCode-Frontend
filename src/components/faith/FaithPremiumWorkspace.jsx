import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Bookmark, CheckCircle2, ChevronRight,
  Clock3, ExternalLink, GraduationCap, Loader2, Lock,
  MessageCircle, FileText, Plus, RefreshCw, Send, ShieldCheck, Users,
  Check, AlertCircle, Globe2, Trash2, Trophy, HelpCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { readAccessToken, readTokenType } from "@/auth/tokenStorage.mjs";

const PRIORITY_FAITH_COURSES = Object.freeze([
  "three-angels-messages",
  "sda-28-fundamental-beliefs",
  "great-controversy-theme",
  "catholic-muslim-comparative-dialogue",
]);

const API = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_REVELACODE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://revelacode-backend.onrender.com"
).replace(/\/+$/, "");

async function faithApi(path, options = {}) {
  const token = readAccessToken();
  const headers = { Accept: "application/json", ...(options.headers || {}) };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = (readTokenType() || "Bearer") + " " + token;
  const response = await fetch(API + path, {
    method: options.method || "GET",
    headers,
    credentials: "include",
    cache: "no-store",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data?.message ||
      data?.error?.message ||
      (typeof data?.error === "string" ? data.error : "") ||
      "Request failed (" + response.status + ").";
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

function niceDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function shortText(value, max = 220) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max - 1).trim() + "…" : text;
}

function Markdown({ children }) {
  return (
    <div className="faith-markdown max-w-none text-sm leading-7 text-slate-700 dark:text-slate-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mb-3 mt-6 text-xl font-black text-slate-950 dark:text-white">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 mt-5 text-lg font-extrabold text-slate-950 dark:text-white">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-4 text-base font-bold text-slate-950 dark:text-white">{children}</h3>,
          p: ({ children }) => <p className="my-3">{children}</p>,
          ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-6">{children}</ol>,
          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-700 underline underline-offset-2 dark:text-indigo-300">{children}</a>,
          blockquote: ({ children }) => <blockquote className="my-4 border-l-4 border-indigo-300 pl-4 text-slate-600 dark:text-slate-300">{children}</blockquote>,
          table: ({ children }) => <div className="my-4 overflow-x-auto"><table className="min-w-full border-collapse text-left text-xs">{children}</table></div>,
          th: ({ children }) => <th className="border border-slate-200 bg-slate-50 px-3 py-2 font-bold dark:border-slate-700 dark:bg-slate-800">{children}</th>,
          td: ({ children }) => <td className="border border-slate-200 px-3 py-2 dark:border-slate-700">{children}</td>,
        }}
      >
        {String(children || "")}
      </ReactMarkdown>
    </div>
  );
}

function Pill({ children, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300",
    amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200",
    purple: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/20 dark:text-violet-300",
  };
  return <span className={"inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold " + (tones[tone] || tones.slate)}>{children}</span>;
}

function SectionHeading({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">{eyebrow}</p>}
        <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h2>
        {description && <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

function Button({ children, onClick, disabled = false, variant = "primary", type = "button", className = "" }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ";
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    subtle: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
    ghost: "text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/30",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300",
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={base + (styles[variant] || styles.primary) + " " + className}>{children}</button>;
}

export default function FaithPremiumWorkspace({ isGuest = false, onLogin, onNavigate }) {
  const [tab, setTab] = useState("courses");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLessonSlug, setSelectedLessonSlug] = useState("");
  const [answerSelections, setAnswerSelections] = useState({});
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [question, setQuestion] = useState("");
  const [companionMode, setCompanionMode] = useState("interpret");
  const [companionAnswer, setCompanionAnswer] = useState("");
  const [workspace, setWorkspace] = useState({ notes: [], progress: [], assessments: [], summary: {} });
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteMessage, setNoteMessage] = useState("");
  const [events, setEvents] = useState([]);
  const [eventError, setEventError] = useState("");
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [inviteCode, setInviteCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [organization, setOrganization] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentCourse, setAssignmentCourse] = useState("scripture-study-method");
  const [assignmentLesson, setAssignmentLesson] = useState("observe-before-interpreting");
  const [assignmentDue, setAssignmentDue] = useState("");

  const signedIn = !isGuest && Boolean(readAccessToken());
  // Faith Academy is open to all authenticated Faith Hub members. Access is
  // account-scoped for saved records, not sold through subscriptions or trials.
  const hasPremium = true;
  const hasGroupTools = true;
  const courseUnlocked = () => true;
  const selectedLesson = selectedCourse?.lessons?.find((lesson) => lesson.slug === selectedLessonSlug) || null;

  const refreshAccount = useCallback(async () => {
    if (!signedIn) {
      setCourses([]);
      return;
    }
    try {
      const data = await faithApi("/api/study/faith/courses");
      setCourses((data.courses || []).map((course) => ({ ...course, locked: false })));
    } catch (e) {
      setCourses([]);
      throw e;
    }
  }, [signedIn]);

  const loadEvents = useCallback(async () => {
    setEventError("");
    try {
      const data = await faithApi("/api/events");
      setEvents(Array.isArray(data.events) ? data.events.slice(0, 12) : []);
    } catch (e) {
      setEventError(e.message || "World events are currently unavailable.");
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    await Promise.allSettled([loadEvents(), refreshAccount()]);
    setLoading(false);
  }, [refreshAccount, loadEvents]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function refreshWorkspace() {
    try {
      const data = await faithApi("/api/study/faith/workspace");
      setWorkspace(data);
    } catch (e) {
      setError(e.message);
    }
  }

  async function refreshGroups() {
    try {
      const data = await faithApi("/api/study/faith/groups");
      setGroups(data.groups || []);
    } catch (e) {
      setGroups([]);
      setError(e.message);
    }
  }

  useEffect(() => {
    if (tab === "workspace" && signedIn && hasPremium) refreshWorkspace();
    if (tab === "groups" && signedIn && hasGroupTools) refreshGroups();
    if (tab === "briefing" && events.length === 0) loadEvents();
  }, [tab, signedIn, hasPremium, hasGroupTools, events.length, loadEvents]);

  async function openCourse(slug) {
    if (!signedIn) {
      setError("Sign in to open the structured course preview and save your learning progress.");
      if (onLogin) onLogin();
      return;
    }
    setError("");
    setNotice("");
    setWorking("course");
    try {
      const data = await faithApi("/api/study/faith/courses/" + encodeURIComponent(slug));
      const course = data.course || null;
      const openCourseData = course ? {
        ...course,
        locked: false,
        lessons: (course.lessons || []).map((lesson) => ({ ...lesson, locked: false })),
      } : null;
      setSelectedCourse(openCourseData);
      const firstOpen = (openCourseData?.lessons || []).find((lesson) => !lesson.locked);
      setSelectedLessonSlug(firstOpen?.slug || "");
      setAnswerSelections({});
      setAssessmentResult(null);
      setCompanionAnswer("");
      setQuestion("");
      setCompanionMode("interpret");
      setTab("courses");
    } catch (e) {
      setError(e.message);
    } finally {
      setWorking("");
    }
  }

  function backToCourses() {
    setSelectedCourse(null);
    setSelectedLessonSlug("");
    setAnswerSelections({});
    setAssessmentResult(null);
    setCompanionAnswer("");
  }

  async function saveProgress(completed = true) {
    if (!selectedCourse || !selectedLesson) return;
    setWorking("progress");
    setError("");
    try {
      const data = await faithApi("/api/study/faith/progress", {
        method: "POST",
        body: { course_slug: selectedCourse.slug, lesson_slug: selectedLesson.slug, completed },
      });
      setNotice(completed ? "Lesson marked complete. Your progress is saved to your account." : "Progress saved.");
      setSelectedCourse((course) => course ? {
        ...course,
        lessons: course.lessons.map((lesson) => lesson.slug === selectedLesson.slug ? { ...lesson, completed: completed } : lesson),
      } : course);
      await refreshAccount();
    } catch (e) {
      setError(e.message);
    } finally {
      setWorking("");
    }
  }

  async function submitAssessment() {
    if (!selectedCourse || !selectedLesson) return;
    setWorking("assessment");
    setError("");
    try {
      const result = await faithApi("/api/study/faith/assessments/submit", {
        method: "POST",
        body: {
          course_slug: selectedCourse.slug,
          lesson_slug: selectedLesson.slug,
          answers: answerSelections,
        },
      });
      setAssessmentResult(result);
      setNotice(result.message || "Assessment submitted.");
      await refreshWorkspaceIfAllowed();
    } catch (e) {
      setError(e.message);
    } finally {
      setWorking("");
    }
  }

  async function refreshWorkspaceIfAllowed() {
    try { setWorkspace(await faithApi("/api/study/faith/workspace")); } catch {}
  }

  async function askCompanion() {
    if (!selectedCourse || !selectedLesson || !question.trim()) return;
    setWorking("companion");
    setError("");
    setCompanionAnswer("");
    try {
      const data = await faithApi("/api/study/faith/companion", {
        method: "POST",
        body: { course_slug: selectedCourse.slug, lesson_slug: selectedLesson.slug, question: question.trim(), discussion_mode: companionMode },
      });
      setCompanionAnswer(data.answer || "");
    } catch (e) {
      setError(e.message);
    } finally {
      setWorking("");
    }
  }

  async function saveNote(event) {
    if (event) event.preventDefault();
    setWorking("note");
    setNoteMessage("");
    setError("");
    try {
      const data = await faithApi("/api/study/faith/notes", {
        method: "POST",
        body: {
          title: noteTitle.trim() || (selectedLesson?.title || "Study note"),
          content: noteContent.trim(),
          course_slug: selectedCourse?.slug || "",
          lesson_slug: selectedLesson?.slug || "",
        },
      });
      setNoteMessage("Note saved to your private study workspace.");
      setNoteTitle("");
      setNoteContent("");
      await refreshWorkspace();
      setTab("workspace");
    } catch (e) {
      setError(e.message);
    } finally {
      setWorking("");
    }
  }

  async function deleteNote(noteId) {
    setWorking("delete-note");
    try {
      await faithApi("/api/study/faith/notes/" + encodeURIComponent(noteId), { method: "DELETE" });
      await refreshWorkspace();
    } catch (e) {
      setError(e.message);
    } finally {
      setWorking("");
    }
  }

  async function createGroup(event) {
    if (event) event.preventDefault();
    setWorking("group-create");
    setError("");
    try {
      const data = await faithApi("/api/study/faith/groups", {
        method: "POST",
        body: { name: groupName, organization, description: groupDescription },
      });
      setGroupName("");
      setOrganization("");
      setGroupDescription("");
      await refreshGroups();
      if (data.group) await openGroup(data.group.id);
      setNotice("Study group created. Share its invite code with members.");
    } catch (e) {
      setError(e.message);
    } finally {
      setWorking("");
    }
  }

  async function joinGroup(event) {
    if (event) event.preventDefault();
    setWorking("group-join");
    setError("");
    try {
      const data = await faithApi("/api/study/faith/groups/join", {
        method: "POST",
        body: { invite_code: inviteCode },
      });
      setInviteCode("");
      await refreshGroups();
      if (data.group) await openGroup(data.group.id);
      setNotice("You joined the study group.");
    } catch (e) {
      setError(e.message);
    } finally {
      setWorking("");
    }
  }

  async function openGroup(groupId) {
    setWorking("group-detail");
    setError("");
    try {
      const data = await faithApi("/api/study/faith/groups/" + encodeURIComponent(groupId));
      setSelectedGroup(data.group || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setWorking("");
    }
  }

  async function createAssignment(event) {
    if (event) event.preventDefault();
    if (!selectedGroup) return;
    setWorking("assignment-create");
    setError("");
    try {
      const data = await faithApi("/api/study/faith/groups/" + encodeURIComponent(selectedGroup.id) + "/assignments", {
        method: "POST",
        body: {
          title: assignmentTitle.trim() || "Group study assignment",
          course_slug: assignmentCourse,
          lesson_slug: assignmentLesson,
          due_date: assignmentDue,
        },
      });
      setAssignmentTitle("");
      const refreshed = await faithApi("/api/study/faith/groups/" + encodeURIComponent(selectedGroup.id));
      setSelectedGroup(refreshed.group || null);
      setNotice("Assignment created for the group.");
    } catch (e) {
      setError(e.message);
    } finally {
      setWorking("");
    }
  }

  async function completeAssignment(assignmentId) {
    if (!selectedGroup) return;
    setWorking("assignment-complete");
    try {
      await faithApi("/api/study/faith/groups/" + encodeURIComponent(selectedGroup.id) + "/assignments/" + encodeURIComponent(assignmentId) + "/complete", { method: "POST", body: {} });
      const refreshed = await faithApi("/api/study/faith/groups/" + encodeURIComponent(selectedGroup.id));
      setSelectedGroup(refreshed.group || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setWorking("");
    }
  }

  const tabItems = [
    { id: "courses", label: "Courses", icon: GraduationCap },
    { id: "workspace", label: "My workspace", icon: FileText },
    { id: "groups", label: "Church groups", icon: Users },
    { id: "briefing", label: "Daily briefing", icon: Globe2 },
  ];

  const completedCount = useMemo(
    () => courses.reduce((sum, course) => sum + Number(course.completed_lessons || 0), 0),
    [courses]
  );

  function renderLockedCard(title, description) {
    return (
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
        <h3 className="font-black text-slate-950 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Faith Hub study tools are free. Sign in to save your activity to your account.</p>
        <Button className="mt-3" onClick={() => onLogin && onLogin()}>Sign in / register <ArrowRight size={14} /></Button>
      </div>
    );
  }

  if (loading) {
    return <div className="flex min-h-[260px] items-center justify-center gap-3 text-sm text-slate-500"><Loader2 className="animate-spin" size={20} /> Loading Faith Academy…</div>;
  }

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-800 via-violet-800 to-purple-900 p-4 text-white shadow-md sm:p-6">
        <div className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em]"><ShieldCheck size={13} /> Faith Academy</div>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Study deeper. Learn with evidence. Grow together.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">Structured courses, real assessments, saved progress and notes, a lesson-grounded AI companion, and church study groups—available as part of Faith Hub.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill tone="green">Free Faith Hub access</Pill>
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            { label: "Curated courses", value: String(courses.length || 3) },
            { label: "Lessons completed", value: String(completedCount) },
            { label: "Saved notes", value: String(workspace.summary?.notes_count || 0) },
            { label: "Access", value: "Free" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/15 bg-white/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">{stat.label}</p>
              <p className="mt-1 text-lg font-black">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {!signedIn && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="font-bold text-amber-950 dark:text-amber-100">Sign in to save your learning</h3><p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-200">The catalogue and daily briefing are available here. A signed-in account is needed to save progress, private notes, and group activity.</p></div>
          <Button onClick={() => onLogin && onLogin()}>Sign in / register <ArrowRight size={14} /></Button>
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
          <AlertCircle className="mt-0.5 shrink-0" size={16} /><p className="flex-1 leading-6">{error}</p><button type="button" onClick={() => setError("")} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}
      {notice && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200"><CheckCircle2 className="mt-0.5 shrink-0" size={16} /><p className="flex-1 leading-6">{notice}</p><button type="button" onClick={() => setNotice("")} className="text-xs font-bold underline">Dismiss</button></div>}

      <nav className="flex gap-1.5 overflow-x-auto pb-1 sm:gap-2" aria-label="Faith Academy sections">
        {tabItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} type="button" onClick={() => { setTab(item.id); setError(""); setNotice(""); }} className={"inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] font-bold transition sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-xs " + (tab === item.id ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300")}>
              <Icon size={15} />{item.label}
            </button>
          );
        })}
      </nav>

      {tab === "courses" && !selectedCourse && (
        <div className="space-y-4">
          <SectionHeading eyebrow="Structured learning" title="Courses built for serious study" description="Every course includes objectives, source-linked lessons, assessment questions graded by the backend, and resumable progress. Faith Hub courses are available without a paid plan." />
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[...(courses.length ? courses : [
              { slug: "three-angels-messages", title: "The Three Angels’ Messages — Text, Tradition & Debate", summary: "Read Revelation 14 in context and compare Adventist and alternative Christian interpretations.", level: "Priority · Prophecy", duration_minutes: 75, lesson_count: 3, completed_lessons: 0, locked: !hasPremium },
              { slug: "sda-28-fundamental-beliefs", title: "The 28 Fundamental Beliefs — A Complete Adventist Study", summary: "Study all 28 official beliefs with sources, questions, and fair comparison.", level: "Priority · Foundations", duration_minutes: 110, lesson_count: 6, completed_lessons: 0, locked: !hasPremium },
              { slug: "great-controversy-theme", title: "The Great Controversy — Good, Evil, Freedom & Hope", summary: "Explore the Adventist framework and debate evil, freedom, justice, and hope.", level: "Priority · Theology", duration_minutes: 70, lesson_count: 3, completed_lessons: 0, locked: !hasPremium },
              { slug: "catholic-muslim-comparative-dialogue", title: "Catholic & Muslim Perspectives — A Shared Study and Debate", summary: "Compare Catholic and Muslim primary sources on God, Jesus, Mary, revelation, worship, and ethics without ranking either tradition.", level: "Priority · Interfaith", duration_minutes: 85, lesson_count: 4, completed_lessons: 0, locked: !hasPremium },
              { slug: "scripture-study-method", title: "Study Scripture with Context", summary: "Observe, interpret, and apply Scripture responsibly.", level: "Foundations", duration_minutes: 50, lesson_count: 3, completed_lessons: 0, preview_available: true, locked: !hasPremium },
              { slug: "daniel-revelation-research-lab", title: "Daniel & Revelation Research Lab", summary: "Study apocalyptic texts and compare prophetic frameworks.", level: "Intermediate", duration_minutes: 65, lesson_count: 3, completed_lessons: 0, locked: !hasPremium },
              { slug: "comparative-christian-traditions", title: "Comparative Theology: Scripture, Worship & Tradition", summary: "Compare traditions using primary texts and source-based reasoning.", level: "Intermediate", duration_minutes: 60, lesson_count: 3, completed_lessons: 0, locked: !hasPremium },
            ])].sort((a, b) => {
              const aIndex = PRIORITY_FAITH_COURSES.indexOf(a.slug);
              const bIndex = PRIORITY_FAITH_COURSES.indexOf(b.slug);
              return (aIndex < 0 ? 100 : aIndex) - (bIndex < 0 ? 100 : bIndex);
            }).map((course) => (
              <button key={course.slug} type="button" onClick={() => openCourse(course.slug)} disabled={working === "course"} className="group flex min-h-[150px] flex-col rounded-xl border border-slate-200 bg-white p-2.5 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800 sm:min-h-[190px] sm:rounded-2xl sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 sm:h-10 sm:w-10 sm:rounded-xl"><BookOpen size={16} /></span>
                  {course.locked ? <Pill tone="amber"><Lock size={10} className="mr-1" /> Premium</Pill> : course.preview_available ? <Pill tone="green">Preview open</Pill> : <Pill tone="green">Unlocked</Pill>}
                </div>
                <p className="mt-2 text-[8px] font-black uppercase tracking-wide text-indigo-600 dark:text-indigo-400 sm:mt-3 sm:text-[10px]">{course.level || "Guided course"} · {course.duration_minutes || 0} min</p>
                <h3 className="mt-1 line-clamp-3 text-xs font-black leading-4 text-slate-950 dark:text-white sm:text-base sm:leading-5">{course.title}</h3>
                <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400 sm:mt-2 sm:text-xs sm:leading-5">{course.summary}</p>
                <div className="mt-auto flex items-center justify-between gap-1 pt-3 text-[9px] font-bold leading-3 text-indigo-700 dark:text-indigo-300 sm:pt-4 sm:text-xs sm:leading-normal">
                  <span className="line-clamp-2">{course.completed_lessons || 0}/{course.lesson_count || 0} lessons complete</span><ChevronRight size={14} className="shrink-0 transition group-hover:translate-x-1 sm:size-4" />
                </div>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-start gap-2 sm:gap-3"><Trophy size={16} className="mt-0.5 shrink-0 text-amber-500 sm:size-5" /><div><h3 className="font-bold text-slate-900 dark:text-white">Progress that means something</h3><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Assessment answers are graded server-side; 70% is the passing mark. Results and completed lessons are attached to the signed-in account, not simply marked complete in the browser.</p></div></div>
          </div>
        </div>
      )}

      {tab === "courses" && selectedCourse && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2"><Button variant="subtle" onClick={backToCourses}><ArrowLeft size={14} /> All courses</Button><Pill tone={courseUnlocked(selectedCourse) ? "green" : "amber"}>{courseUnlocked(selectedCourse) ? "Course unlocked" : "Preview / locked lessons"}</Pill></div>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">{selectedCourse.level} · {selectedCourse.duration_minutes} min</p>
                <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{selectedCourse.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{selectedCourse.summary}</p>
                {Array.isArray(selectedCourse.outcomes) && <div className="mt-4"><p className="text-xs font-black text-slate-800 dark:text-slate-200">Learning outcomes</p><ul className="mt-2 space-y-1.5">{selectedCourse.outcomes.map((outcome) => <li key={outcome} className="flex items-start gap-2 text-xs leading-5 text-slate-600 dark:text-slate-300"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />{outcome}</li>)}</ul></div>}
              </div>
              
            </div>
          </section>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
              <h3 className="font-black text-slate-950 dark:text-white">Course lessons</h3>
              <div className="mt-3 space-y-2">
                {(selectedCourse.lessons || []).map((lesson, index) => (
                  <button key={lesson.slug} type="button" onClick={() => { setSelectedLessonSlug(lesson.slug); setAnswerSelections({}); setAssessmentResult(null); setCompanionAnswer(""); }} className={"flex w-full items-start gap-3 rounded-xl border p-3 text-left transition " + (selectedLessonSlug === lesson.slug ? "border-indigo-300 bg-indigo-50/60 dark:border-indigo-900/50 dark:bg-indigo-950/20" : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60")}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">{lesson.completed ? <Check size={15} className="text-emerald-600" /> : lesson.locked ? <Lock size={14} /> : index + 1}</span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-900 dark:text-white">{lesson.title}</span><span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">{lesson.minutes || 10} min · {lesson.reference || "Guided reading"}</span>{lesson.summary && <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{lesson.summary}</span>}</span>
                    {lesson.preview && <Pill tone="green">Free preview</Pill>}
                    
                  </button>
                ))}
              </div>
            </section>
            <aside className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-black text-slate-900 dark:text-white">Source discipline</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">These courses separate the passage itself, historical context, interpretive tradition, and application. A tradition-specific position is labelled instead of presented as a universal Christian view.</p>
                <div className="mt-3 space-y-2">{(selectedCourse.sources || []).map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-xs font-semibold leading-5 text-indigo-700 underline underline-offset-2 dark:text-indigo-300"><ExternalLink size={13} className="mt-0.5 shrink-0" />{source.label}</a>)}</div>
              </div>
              {<div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20"><h3 className="font-black text-slate-900 dark:text-white">Your study records</h3><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Use your private workspace for notes, progress, and assessment history.</p><Button className="mt-3" onClick={() => setTab("workspace")}><FileText size={14} /> Open workspace</Button></div>}
            </aside>
          </div>

          {selectedLesson && !selectedLesson.locked && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
              <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800"><div><p className="text-[10px] font-black uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Lesson {selectedLesson.minutes || 10} min</p><h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">{selectedLesson.title}</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{selectedLesson.reference}</p></div>{selectedLesson.preview && <Pill tone="green">Free preview</Pill>}</div>
                <div className="py-3"><Markdown>{selectedLesson.content}</Markdown></div>
                <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50"><h4 className="text-xs font-black text-slate-900 dark:text-white">Sources for this lesson</h4><div className="mt-2 space-y-2">{(selectedLesson.sources || []).map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-xs font-semibold leading-5 text-indigo-700 underline underline-offset-2 dark:text-indigo-300"><ExternalLink size={13} className="mt-0.5 shrink-0" />{source.label}</a>)}</div></section>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button onClick={() => saveProgress(true)} disabled={working === "progress"}>{working === "progress" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Mark complete</Button>
                  {<Button variant="subtle" onClick={() => { setTab("workspace"); setNoteTitle(selectedLesson.title); setNoteContent(""); }}><FileText size={14} /> Add a private note</Button>}
                </div>
                {selectedLesson.quiz?.length > 0 && (
                  <section className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
                    <div className="flex items-center gap-2"><HelpCircle size={17} className="text-indigo-600" /><h4 className="font-black text-slate-900 dark:text-white">Knowledge check</h4></div>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Answers are graded on the server. You need 70% to pass; explanations are shown after submission.</p>
                    <div className="mt-4 space-y-5">
                      {selectedLesson.quiz.map((item, index) => (
                        <div key={index} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{index + 1}. {item.question}</p>
                          <div className="mt-2 space-y-2">{item.options.map((option, optionIndex) => <label key={optionIndex} className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-xs leading-5 text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"><input type="radio" name={"faith-quiz-" + index} checked={Number(answerSelections[String(index)]) === optionIndex} onChange={() => setAnswerSelections((previous) => ({ ...previous, [String(index)]: optionIndex }))} className="mt-0.5" />{option}</label>)}</div>
                        </div>
                      ))}
                    </div>
                    <Button className="mt-4" onClick={submitAssessment} disabled={working === "assessment" || Object.keys(answerSelections).length !== selectedLesson.quiz.length}>{working === "assessment" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Submit answers</Button>
                    {assessmentResult && <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50"><div className="flex flex-wrap items-center gap-2"><Pill tone={assessmentResult.passed ? "green" : "amber"}>{assessmentResult.passed ? "Passed" : "Review and retry"}</Pill><strong className="text-lg font-black text-slate-900 dark:text-white">{assessmentResult.score_percent}%</strong><span className="text-xs text-slate-500 dark:text-slate-400">{assessmentResult.correct_count}/{assessmentResult.question_count} correct</span></div><div className="mt-3 space-y-3">{(assessmentResult.feedback || []).map((feedback, index) => <div key={index} className="text-xs leading-5"><p className={"font-bold " + (feedback.correct ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")}>{index + 1}. {feedback.correct ? "Correct" : "Not quite"} — {feedback.question}</p><p className="mt-1 text-slate-600 dark:text-slate-300">{feedback.explanation}</p></div>)}</div></div>}
                  </section>
                )}
              </article>

              <aside className="space-y-4">
                <section className="rounded-2xl border border-violet-200 bg-white p-4 dark:border-violet-900/40 dark:bg-slate-900">
                  <div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white"><MessageCircle size={17} /></div><div><h3 className="font-black text-slate-900 dark:text-white">RevelaAI Study Companion</h3><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Answers use this lesson and its source list as context. It distinguishes textual claims from interpretation and states uncertainty where needed.</p></div></div>
                  {signedIn ? <>
                    <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={3} placeholder="Ask about the reasoning, context, or alternative interpretations…" className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950" />
                    <div className="mt-3 rounded-xl border border-slate-200 p-2 dark:border-slate-700">
                      <p className="px-1 text-[10px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">AI discussion mode</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => { setCompanionMode("interpret"); setCompanionAnswer(""); }} aria-pressed={companionMode === "interpret"} className={"rounded-lg px-3 py-2 text-xs font-bold transition " + (companionMode === "interpret" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300")}>
                          Interpret
                        </button>
                        <button type="button" onClick={() => { setCompanionMode("debate"); setCompanionAnswer(""); }} aria-pressed={companionMode === "debate"} className={"rounded-lg px-3 py-2 text-xs font-bold transition " + (companionMode === "debate" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300")}>
                          Balanced debate
                        </button>
                      </div>
                      <p className="mt-2 px-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                        {companionMode === "debate" ? "AI presents the strongest sourced views, objections from both sides, common ground, and unresolved differences without declaring a religion superior." : "AI explains the passage in context and separates source text, official teaching, interpretation, and uncertainty."}
                      </p>
                    </div>
                    <Button className="mt-2 w-full" onClick={askCompanion} disabled={working === "companion" || !question.trim()}>{working === "companion" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} {companionMode === "debate" ? "Start balanced debate" : "Interpret with AI"}</Button>
                    {companionAnswer && <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800"><Markdown>{companionAnswer}</Markdown></div>}
                  </> : <><p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Sign in to use the lesson-grounded Study Companion and save its response to your account.</p><Button className="mt-3 w-full" onClick={() => onLogin && onLogin()}>Sign in to continue</Button></>}
                </section>
              </aside>
            </div>
          )}
        </div>
      )}

      {tab === "workspace" && (
        !signedIn ? renderLockedCard("Your private study workspace", "Sign in to attach notes, results, and course progress to your own account.")
          : <div className="space-y-4">
              <SectionHeading eyebrow="Private to your account" title="My study workspace" description="Your notes, completed lessons, and assessment results live in the existing RevelaCode database under your account." actions={<Button variant="subtle" onClick={refreshWorkspace}><RefreshCw size={14} /> Refresh</Button>} />
              <div className="grid grid-cols-3 gap-2">{[
                { label: "Completed", value: workspace.summary?.completed_lessons || 0 },
                { label: "Notes", value: workspace.summary?.notes_count || 0 },
                { label: "Quiz attempts", value: workspace.summary?.assessment_attempts || 0 },
              ].map((stat) => <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><p className="text-[10px] font-bold uppercase text-slate-500">{stat.label}</p><p className="mt-1 text-xl font-black text-slate-900 dark:text-white">{stat.value}</p></div>)}</div>
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <form onSubmit={saveNote} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2"><FileText size={17} className="text-indigo-600" /><h3 className="font-black text-slate-900 dark:text-white">Write a study note</h3></div>
                  <input value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} maxLength={160} placeholder="Note title" className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950" />
                  <textarea required value={noteContent} onChange={(event) => setNoteContent(event.target.value)} maxLength={8000} rows={5} placeholder="Record your observations, source links, questions, and conclusions…" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 dark:border-slate-700 dark:bg-slate-950" />
                  <Button type="submit" disabled={working === "note" || !noteContent.trim()} className="mt-3">{working === "note" ? <Loader2 size={14} className="animate-spin" /> : <Bookmark size={14} />} Save note</Button>
                  {noteMessage && <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">{noteMessage}</p>}
                </form>
                <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="font-black text-slate-900 dark:text-white">Saved notes</h3>
                  <div className="mt-3 space-y-2">{(workspace.notes || []).length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500 dark:bg-slate-950/50">No notes saved yet. Write your first note here or open this area from a lesson.</p> : (workspace.notes || []).map((note) => <article key={note.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><div className="flex items-start justify-between gap-2"><h4 className="text-sm font-bold text-slate-900 dark:text-white">{note.title}</h4><button type="button" onClick={() => deleteNote(note.id)} title="Delete note" className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button></div><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-600 dark:text-slate-300">{shortText(note.content, 500)}</p><p className="mt-2 text-[10px] text-slate-400">Updated {niceDate(note.updated_at)}</p></article>)}</div>
                </section>
              </div>
              <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><h3 className="font-black text-slate-900 dark:text-white">Learning history</h3><div className="mt-3 space-y-2">{(workspace.progress || []).length === 0 ? <p className="text-xs text-slate-500">Complete a structured course lesson to begin your history.</p> : (workspace.progress || []).map((row) => <div key={row.course_slug + row.lesson_slug} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 p-3 dark:border-slate-800"><div><p className="text-xs font-bold text-slate-800 dark:text-slate-200">{row.course_slug.replaceAll("-", " ")} · {row.lesson_slug.replaceAll("-", " ")}</p><p className="mt-1 text-[10px] text-slate-400">{niceDate(row.updated_at)}</p></div><Pill tone={row.completed ? "green" : "slate"}>{row.completed ? "Completed" : "In progress"}</Pill></div>)}</div></section>
            </div>
      )}

      {tab === "groups" && (
        !signedIn ? renderLockedCard("Church and study-group tools", "Sign in to start a group workspace or join a group by invite code.")
          : <div className="space-y-4">
              <SectionHeading eyebrow="Church and study groups" title="Study together" description="Group creation and joining persist to the backend. Leaders share an invite code; members join with it, and assignments track each member's completion." actions={<Button variant="subtle" onClick={refreshGroups}><RefreshCw size={14} /> Refresh groups</Button>} />
              <div className="grid gap-4 lg:grid-cols-2">
                <form onSubmit={createGroup} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="font-black text-slate-900 dark:text-white">Create a church / study group</h3>
                  <input required minLength={3} value={groupName} onChange={(event) => setGroupName(event.target.value)} maxLength={120} placeholder="Group name" className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950" />
                  <input value={organization} onChange={(event) => setOrganization(event.target.value)} maxLength={120} placeholder="Church / ministry / organisation (optional)" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950" />
                  <textarea value={groupDescription} onChange={(event) => setGroupDescription(event.target.value)} maxLength={500} rows={2} placeholder="What will this group study?" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950" />
                  <Button className="mt-3" type="submit" disabled={working === "group-create" || groupName.trim().length < 3}>{working === "group-create" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create group</Button>
                </form>
                <form onSubmit={joinGroup} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="font-black text-slate-900 dark:text-white">Join an existing group</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Ask the group leader for their invite code. Joining by code creates a real group membership attached to your account.</p>
                  <input required value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} maxLength={32} placeholder="Group invite code" className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm uppercase tracking-wider dark:border-slate-700 dark:bg-slate-950" />
                  <Button type="submit" className="mt-3" disabled={working === "group-join" || !inviteCode.trim()}>{working === "group-join" ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />} Join group</Button>
                </form>
              </div>
              <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-black text-slate-900 dark:text-white">Your groups</h3>
                {(groups || []).length === 0 ? <p className="mt-2 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500 dark:bg-slate-950/50">No group memberships yet. Create a group or join with an invite code.</p> : <div className="mt-3 grid gap-2 md:grid-cols-2">{groups.map((group) => <button key={group.id} type="button" onClick={() => openGroup(group.id)} className={"rounded-xl border p-3 text-left transition hover:border-indigo-300 " + (selectedGroup?.id === group.id ? "border-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/20" : "border-slate-200 dark:border-slate-800")}><div className="flex items-start justify-between gap-2"><span className="font-bold text-slate-900 dark:text-white">{group.name}</span><ChevronRight size={15} /></div><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{group.organization || "Independent study group"} · {group.member_count} member(s)</p>{group.can_manage && <p className="mt-2 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">Invite code: {group.invite_code}</p>}</button>)}</div>}
              </section>
              {selectedGroup && <section className="rounded-2xl border border-indigo-200 bg-white p-4 dark:border-indigo-900/40 dark:bg-slate-900">
                <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Group workspace</p><h3 className="mt-1 text-lg font-black text-slate-900 dark:text-white">{selectedGroup.name}</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{selectedGroup.member_count} members · {selectedGroup.my_role || "member"}</p></div><Button variant="subtle" onClick={() => openGroup(selectedGroup.id)}><RefreshCw size={13} /> Refresh</Button></div>
                {selectedGroup.can_manage && <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-indigo-50 p-3 dark:bg-indigo-950/30"><span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Share invite code</span><code className="rounded bg-white px-2 py-1 text-xs font-black tracking-wider text-indigo-800 dark:bg-slate-950 dark:text-indigo-200">{selectedGroup.invite_code}</code><Button variant="subtle" onClick={() => { navigator.clipboard?.writeText(String(selectedGroup.invite_code || "")); setNotice("Invite code copied when clipboard permission is available."); }}><Bookmark size={13} /> Copy code</Button></div>}
                {selectedGroup.can_manage && <form onSubmit={createAssignment} className="mt-4 rounded-xl border border-slate-200 p-3 dark:border-slate-800"><h4 className="text-sm font-black text-slate-900 dark:text-white">Assign a lesson to the group</h4><input value={assignmentTitle} onChange={(event) => setAssignmentTitle(event.target.value)} maxLength={140} placeholder="Assignment title (optional)" className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950" /><div className="mt-2 grid gap-2 sm:grid-cols-2"><select value={assignmentCourse} onChange={(event) => { setAssignmentCourse(event.target.value); const selected = courses.find((course) => course.slug === event.target.value); const first = selected?.slug === "scripture-study-method" ? "observe-before-interpreting" : selected?.slug === "daniel-revelation-research-lab" ? "apocalyptic-literature" : "scripture-and-authority"; setAssignmentLesson(first); }} className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-950">{courses.map((course) => <option key={course.slug} value={course.slug}>{course.title}</option>)}</select><select value={assignmentLesson} onChange={(event) => setAssignmentLesson(event.target.value)} className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-950">{(assignmentCourse === "scripture-study-method" ? [{slug:"observe-before-interpreting",title:"Observe Before Interpreting"},{slug:"genre-and-context",title:"Genre, Audience, and Context"},{slug:"cross-references-and-evidence",title:"Cross-References and Responsible Conclusions"}] : assignmentCourse === "daniel-revelation-research-lab" ? [{slug:"apocalyptic-literature",title:"How Apocalyptic Literature Communicates"},{slug:"compare-prophecy-frameworks",title:"Compare Interpretive Frameworks"},{slug:"events-and-prophecy",title:"Current Events Without Date-Setting"}] : [{slug:"scripture-and-authority",title:"Scripture, Tradition, and Authority"},{slug:"sabbath-and-worship",title:"The Sabbath Across Traditions"},{slug:"interfaith-dialogue",title:"Interfaith Dialogue"}]).map((lesson) => <option key={lesson.slug} value={lesson.slug}>{lesson.title}</option>)}</select></div><div className="mt-2 flex flex-wrap items-center gap-2"><label className="text-xs text-slate-500">Due date <input type="date" value={assignmentDue} onChange={(event) => setAssignmentDue(event.target.value)} className="ml-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950" /></label><Button type="submit" disabled={working === "assignment-create"}><Plus size={13} /> Assign lesson</Button></div></form>}
                <div className="mt-4"><h4 className="text-sm font-black text-slate-900 dark:text-white">Assignments</h4>{(selectedGroup.assignments || []).length === 0 ? <p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-950/50">No group assignments yet.</p> : <div className="mt-2 space-y-2">{selectedGroup.assignments.map((assignment) => <div key={assignment.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"><div><p className="text-sm font-bold text-slate-900 dark:text-white">{assignment.title}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{assignment.course_slug.replaceAll("-", " ")} · {assignment.lesson_slug.replaceAll("-", " ")}{assignment.due_date ? " · Due " + assignment.due_date : ""}</p><p className="mt-1 text-[10px] text-slate-400">{assignment.completed_count || 0} member(s) completed</p></div><Button variant={assignment.my_completed ? "subtle" : "primary"} disabled={assignment.my_completed || working === "assignment-complete"} onClick={() => completeAssignment(assignment.id)}>{assignment.my_completed ? <Check size={13} /> : <CheckCircle2 size={13} />}{assignment.my_completed ? "Completed" : "Mark complete"}</Button></div>)}</div>}</div>
              </section>}
            </div>
      )}

      {tab === "briefing" && (
        <div className="space-y-4">
          <SectionHeading eyebrow="Existing Events service" title="Daily world briefing" description="Uses RevelaCode’s current events feed. The article is a reported event; any prophetic connection remains a separate interpretation. Always open the publisher to verify the full report." actions={<><Button variant="subtle" onClick={loadEvents}><RefreshCw size={14} /> Refresh</Button>{onNavigate && <Button variant="subtle" onClick={() => onNavigate("events")}>Open Events workspace <ArrowRight size={14} /></Button>}</>} />
          {eventError && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">{eventError}</div>}
          {events.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800"><Globe2 className="mx-auto text-slate-400" size={26} /><h3 className="mt-3 font-bold text-slate-900 dark:text-white">No current event items returned</h3><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">The briefing uses the existing backend event ingestion pipeline. A blank response is not replaced with invented headlines.</p></div> : <div className="grid gap-3 md:grid-cols-2">{events.map((event, index) => <article key={event.id || event.url || event.headline || index} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap items-center gap-2"><Pill tone="indigo">{event.source || "Publisher not provided"}</Pill>{event.publishedAt && <span className="inline-flex items-center gap-1 text-[10px] text-slate-400"><Clock3 size={12} />{niceDate(event.publishedAt)}</span>}{event.region && <Pill>{String(event.region).replaceAll("_", " ")}</Pill>}</div><h3 className="mt-3 text-sm font-black leading-6 text-slate-950 dark:text-white">{event.headline || event.title || "Untitled report"}</h3><p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{shortText(event.description || event.content, 420) || "No description was provided by the event feed."}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] text-slate-400">Report ≠ confirmed prophetic fulfilment</span>{event.url && <a href={event.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 underline dark:text-indigo-300">Open original <ExternalLink size={12} /></a>}</div></article>)}</div>}
        </div>
      )}

      <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
        <p className="text-[10px] leading-5 text-slate-400">Editorial note: courses are structured study aids with source links; they are not official rulings. AI answers can make mistakes. Check cited passages and authoritative documents, and treat disputed interpretations as disputed.</p>
      </div>
    </div>
  );
}
