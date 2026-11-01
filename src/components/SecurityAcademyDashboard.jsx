import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Code2,
  ExternalLink,
  FileCheck2,
  FlaskConical,
  Globe2,
  GraduationCap,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  TerminalSquare,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import {
  completeSecurityLesson,
  getSecurityCourse,
  listSecurityCourses,
  submitSecurityQuiz,
} from "@/ai/securityAcademyApi.js";

const COURSE_ICONS = {
  "Reverse Engineering": BookOpen,
  "Binary Analysis": TerminalSquare,
  "Mobile Security": Smartphone,
  "Application Security": Globe2,
  "Embedded Security": Code2,
  "Security Engineering": ShieldCheck,
};

function ProgressBar({ value = 0, compact = false }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div
      className={`h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 ${compact ? "w-24" : "w-full"}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

function LoadingState({ label = "Loading Security Academy…" }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400" role="status">
      <Loader2 size={18} className="animate-spin text-cyan-500" />
      {label}
    </div>
  );
}

function ErrorNotice({ message, onRetry }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <span>{message}</span>
      </div>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-rose-300 px-3 py-2 font-semibold hover:bg-rose-100 dark:border-rose-800 dark:hover:bg-rose-900/40">
          <RefreshCw size={14} /> Retry
        </button>
      ) : null}
    </div>
  );
}

function AcademyHero({ completedCourses, averageProgress, onReload, loading }) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-[#07182b] px-5 py-6 text-white shadow-xl shadow-slate-950/10 sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-130px] right-1/3 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
            <ShieldCheck size={14} /> RevelaAI · Guardian Learning
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Security Academy</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Understand how software fails, inspect the evidence, and engineer the fix.
            Learn reverse engineering through structured lessons and isolated, authorized labs.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Static-first analysis</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Local training labs</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Fixes + regression tests</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:min-w-[270px]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="text-2xl font-black tabular-nums">{completedCourses}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tracks completed</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="text-2xl font-black tabular-nums">{averageProgress}%</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Average progress</div>
          </div>
          <button type="button" onClick={onReload} disabled={loading} className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-200/25 bg-cyan-200/10 px-3 py-2.5 text-xs font-bold text-cyan-100 transition hover:bg-cyan-200/20 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh learning progress
          </button>
        </div>
      </div>
    </section>
  );
}

function CourseCard({ course, onOpen }) {
  const Icon = COURSE_ICONS[course.category] || ShieldCheck;
  const completed = course.status === "completed";
  return (
    <button
      type="button"
      onClick={() => onOpen(course.id)}
      className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-950/5 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-800"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-cyan-300 dark:bg-cyan-950/60">
          <Icon size={22} />
        </div>
        {completed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 size={12} /> Completed
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {course.level}
          </span>
        )}
      </div>
      <div className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">
        {course.category}
      </div>
      <h3 className="mt-2 text-lg font-extrabold leading-snug text-slate-950 dark:text-white">{course.title}</h3>
      <p className="mt-2 min-h-[62px] text-xs leading-5 text-slate-500 dark:text-slate-400">{course.subtitle}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1"><Clock3 size={13} /> {course.duration_minutes} min</span>
        <span className="inline-flex items-center gap-1"><BookOpen size={13} /> {course.lesson_count} lessons</span>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span>{course.completed_lessons}/{course.lesson_count} lessons</span>
            <span>{course.progress_percent}%</span>
          </div>
          <ProgressBar value={course.progress_percent} />
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-cyan-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-200">
          <ArrowRight size={16} />
        </span>
      </div>
    </button>
  );
}

function CourseWorkspace({ detail, authFetch, onBack, onRefresh }) {
  const course = detail?.course;
  const progress = detail?.progress || {};
  const lessons = course?.lessons || [];
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showLab, setShowLab] = useState(false);
  const completed = new Set(detail?.completed_lessons || []);
  const activeLesson = lessons[activeLessonIndex];
  const quiz = course?.quiz || [];
  const allLessonsComplete = lessons.length > 0 && lessons.every((lesson) => completed.has(lesson.id));

  useEffect(() => {
    setActiveLessonIndex(0);
    setAnswers({});
    setQuizResult(null);
    setError("");
    setShowLab(false);
  }, [course?.id]);

  const markComplete = async () => {
    if (!activeLesson || completed.has(activeLesson.id)) return;
    setSaving(true);
    setError("");
    try {
      await completeSecurityLesson(authFetch, course.id, activeLesson.id);
      await onRefresh(course.id);
    } catch (err) {
      setError(err?.message || "The lesson completion could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const chooseAnswer = (questionId, optionId) => {
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
    setQuizResult(null);
  };

  const submit = async () => {
    if (quiz.length === 0 || quiz.some((question) => !answers[question.id])) {
      setError("Answer every question before submitting the assessment.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await submitSecurityQuiz(authFetch, course.id, answers);
      setQuizResult(result);
      await onRefresh(course.id);
    } catch (err) {
      setError(err?.message || "The quiz submission could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  if (!course) return null;

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
        <ArrowLeft size={15} /> All courses
      </button>

      <section className="overflow-hidden rounded-[28px] border border-slate-800 bg-[#07182b] text-white">
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
            <span>{course.category}</span><span className="text-slate-600">/</span><span>{course.level}</span>
          </div>
          <h1 className="mt-3 max-w-3xl text-2xl font-black tracking-tight sm:text-3xl">{course.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{course.description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> {course.duration_minutes} min</span>
            <span className="inline-flex items-center gap-1.5"><BookOpen size={14} /> {lessons.length} lessons</span>
            <span className="inline-flex items-center gap-1.5"><Award size={14} /> Pass mark {detail.guardrails ? "75%" : "75%"}</span>
          </div>
          <div className="mt-6 max-w-xl">
            <div className="mb-2 flex justify-between text-[11px] font-bold text-slate-300">
              <span>Track progress</span><span>{progress.progress_percent || 0}%</span>
            </div>
            <ProgressBar value={progress.progress_percent} />
          </div>
        </div>
      </section>

      {error ? <ErrorNotice message={error} /> : null}

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Course outline</h2>
            <span className="text-[10px] font-bold text-slate-400">{completed.size}/{lessons.length}</span>
          </div>
          <div className="space-y-2">
            {lessons.map((lesson, index) => {
              const isDone = completed.has(lesson.id);
              const active = index === activeLessonIndex;
              return (
                <button key={lesson.id} type="button" onClick={() => { setActiveLessonIndex(index); setShowLab(false); setError(""); }} className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${active ? "border-cyan-300 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-950/30" : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/70"}`}>
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${isDone ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`}>
                    {isDone ? <Check size={14} /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-extrabold leading-5 text-slate-900 dark:text-white">{lesson.title}</span>
                    <span className="mt-1 block text-[10px] text-slate-500 dark:text-slate-400">{lesson.duration_minutes} min</span>
                  </span>
                  <ChevronRight size={15} className="mt-1 shrink-0 text-slate-400" />
                </button>
              );
            })}
            <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
              <button type="button" onClick={() => { setActiveLessonIndex(-1); setQuizResult(null); setError(""); }} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${activeLessonIndex === -1 ? "border-cyan-300 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-950/30" : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/70"}`}>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><FileCheck2 size={14} /></span>
                <span className="flex-1 text-xs font-extrabold text-slate-900 dark:text-white">Knowledge check</span>
                <ChevronRight size={15} className="text-slate-400" />
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          {activeLessonIndex >= 0 && activeLesson ? (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Lesson {activeLessonIndex + 1}</div>
                  <h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">{activeLesson.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{activeLesson.summary}</p>
                </div>
                {completed.has(activeLesson.id) ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><CheckCircle2 size={13} /> Completed</span>
                ) : null}
              </div>

              <div className="mt-6 space-y-5">
                {(activeLesson.sections || []).map((section, index) => (
                  <section key={section.heading} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{section.heading}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{section.body}</p>
                    {section.key_points?.length ? (
                      <ul className="mt-3 space-y-2">
                        {section.key_points.map((point) => <li key={point} className="flex gap-2 text-xs leading-5 text-slate-600 dark:text-slate-300"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-400" />{point}</li>)}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>

              {activeLesson.lab ? (
                <section className="mt-6 overflow-hidden rounded-2xl border border-cyan-200 bg-cyan-50/70 dark:border-cyan-900/70 dark:bg-cyan-950/20">
                  <button type="button" onClick={() => setShowLab((value) => !value)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-200"><FlaskConical size={19} /></span>
                      <span><span className="block text-xs font-black uppercase tracking-wider text-cyan-900 dark:text-cyan-200">Controlled lab</span><span className="mt-1 block text-sm font-extrabold text-slate-900 dark:text-white">{activeLesson.lab.title}</span></span>
                    </span>
                    <ChevronDown size={18} className={`shrink-0 text-cyan-800 transition ${showLab ? "rotate-180" : ""}`} />
                  </button>
                  {showLab ? (
                    <div className="border-t border-cyan-200/80 px-4 pb-4 pt-3 dark:border-cyan-900/70">
                      <div className="rounded-xl bg-white/70 p-3 text-xs leading-5 text-slate-600 dark:bg-slate-900/70 dark:text-slate-300"><strong className="text-slate-900 dark:text-white">Environment: </strong>{activeLesson.lab.environment}</div>
                      <ol className="mt-4 space-y-3">
                        {activeLesson.lab.steps.map((step, index) => <li key={step} className="flex gap-3 text-xs leading-5 text-slate-700 dark:text-slate-300"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-[10px] font-black text-cyan-900 dark:bg-cyan-900/70 dark:text-cyan-100">{index + 1}</span><span>{step}</span></li>)}
                      </ol>
                      {activeLesson.lab.evidence?.length ? <div className="mt-4"><div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Evidence to produce</div><ul className="mt-2 space-y-1.5">{activeLesson.lab.evidence.map((item) => <li key={item} className="text-xs leading-5 text-slate-600 dark:text-slate-300">• {item}</li>)}</ul></div> : null}
                      <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"><LockKeyhole size={14} className="mt-0.5 shrink-0" />{activeLesson.lab.safety}</div>
                    </div>
                  ) : null}
                </section>
              ) : null}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => setActiveLessonIndex((index) => Math.max(0, index - 1))} disabled={activeLessonIndex === 0} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">Previous lesson</button>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={markComplete} disabled={saving || completed.has(activeLesson.id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {completed.has(activeLesson.id) ? "Lesson saved" : "Mark lesson complete"}
                  </button>
                  <button type="button" onClick={() => setActiveLessonIndex((index) => Math.min(lessons.length - 1, index + 1))} disabled={activeLessonIndex >= lessons.length - 1} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-cyan-700 dark:hover:bg-cyan-600">
                    Next lesson <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Course assessment</div>
              <h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">Knowledge check</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Answer every question. Your result and explanations are saved to your authenticated learning record. Pass mark: 75%.</p>
              {!allLessonsComplete ? (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  Complete all lessons to finish this track. You can still review the assessment questions.
                </div>
              ) : null}
              <div className="mt-6 space-y-5">
                {quiz.map((question, index) => {
                  const feedback = quizResult?.feedback?.find((item) => item.question_id === question.id);
                  return (
                    <section key={question.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 sm:p-5">
                      <div className="text-[10px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-300">Question {index + 1} of {quiz.length}</div>
                      <h3 className="mt-2 text-sm font-extrabold leading-6 text-slate-900 dark:text-white">{question.question}</h3>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {question.options.map((option) => {
                          const checked = answers[question.id] === option.id;
                          return (
                            <button key={option.id} type="button" onClick={() => chooseAnswer(question.id, option.id)} className={`rounded-xl border p-3 text-left text-xs leading-5 transition ${checked ? "border-cyan-400 bg-cyan-50 text-cyan-950 dark:border-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-100" : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
                              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[10px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">{option.id.toUpperCase()}</span>{option.text}
                            </button>
                          );
                        })}
                      </div>
                      {feedback ? (
                        <div className={`mt-3 rounded-xl p-3 text-xs leading-5 ${feedback.correct ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200" : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"}`}>
                          <strong>{feedback.correct ? "Correct." : "Not quite."}</strong> {feedback.explanation}
                          {!feedback.correct ? <div className="mt-1 font-semibold">Correct answer: {feedback.correct_text}</div> : null}
                        </div>
                      ) : null}
                    </section>
                  );
                })}
              </div>
              <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                {quizResult ? (
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Latest score: <span className={quizResult.passed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>{quizResult.score_percent}% · {quizResult.passed ? "Passed" : "Try again"}</span>
                  </div>
                ) : <span className="text-xs text-slate-500 dark:text-slate-400">{Object.keys(answers).length}/{quiz.length} answered</span>}
                <button type="button" onClick={submit} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 text-xs font-black text-white transition hover:bg-cyan-600 disabled:opacity-50">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <FileCheck2 size={14} />}
                  Submit assessment
                </button>
              </div>
              {quizResult?.passed && allLessonsComplete ? (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                  <Award size={22} className="shrink-0" />
                  <div><div className="text-sm font-black">Track completed</div><div className="mt-1 text-xs">Your lessons and passing assessment are recorded.</div></div>
                </div>
              ) : null}
            </div>
          )}
        </main>
      </div>

      {course.resources?.length ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Official learning resources</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {course.resources.map((resource) => (
              <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-200 dark:hover:text-cyan-300">
                {resource.title} <ExternalLink size={12} />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[11px] leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
        <LockKeyhole size={15} className="mt-0.5 shrink-0" />
        Learning scope: assess software you own or have written authorization to test. Lab instructions are educational only; this dashboard does not execute binaries, scan remote targets, modify devices, or deploy fixes.
      </div>
    </div>
  );
}

export default function SecurityAcademyDashboard() {
  const { authFetch, isAuthenticated, isGuest } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const authenticated = Boolean(isAuthenticated && !isGuest);

  const loadCourses = useCallback(async () => {
    if (!authenticated) {
      setCourses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await listSecurityCourses(authFetch);
      setCourses(Array.isArray(result?.courses) ? result.courses : []);
    } catch (err) {
      setError(err?.message || "Security Academy could not load.");
    } finally {
      setLoading(false);
    }
  }, [authFetch, authenticated]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const openCourse = async (courseId) => {
    setSelectedCourseId(courseId);
    setDetail(null);
    setDetailLoading(true);
    setError("");
    try {
      const result = await getSecurityCourse(authFetch, courseId);
      setDetail(result);
    } catch (err) {
      setError(err?.message || "This course could not be opened.");
      setSelectedCourseId("");
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshCourse = async (courseId) => {
    const [courseResult, progressResult] = await Promise.all([
      getSecurityCourse(authFetch, courseId),
      listSecurityCourses(authFetch),
    ]);
    setDetail(courseResult);
    setCourses(Array.isArray(progressResult?.courses) ? progressResult.courses : []);
  };

  const completedCourses = useMemo(
    () => courses.filter((course) => course.status === "completed").length,
    [courses]
  );
  const averageProgress = useMemo(
    () => courses.length ? Math.round(courses.reduce((sum, course) => sum + (Number(course.progress_percent) || 0), 0) / courses.length) : 0,
    [courses]
  );

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-4xl p-4 sm:p-8">
        <section className="rounded-[28px] border border-slate-800 bg-[#07182b] p-7 text-white sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200"><ShieldCheck size={28} /></div>
          <h1 className="mt-5 text-2xl font-black">Security Academy</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Sign in with your RevelaCode account to access the reverse-engineering courses and save lesson and assessment progress to your private learning record.</p>
        </section>
      </div>
    );
  }

  if (selectedCourseId && detailLoading) {
    return <div className="p-4 sm:p-7"><LoadingState label="Opening course…" /></div>;
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-3 pb-10 sm:p-6 lg:p-8">
      {selectedCourseId && detail ? (
        <CourseWorkspace
          detail={detail}
          authFetch={authFetch}
          onBack={() => { setSelectedCourseId(""); setDetail(null); setError(""); }}
          onRefresh={refreshCourse}
        />
      ) : (
        <>
          <AcademyHero
            completedCourses={completedCourses}
            averageProgress={averageProgress}
            onReload={loadCourses}
            loading={loading}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Learning paths</div>
              <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Build your security engineering skillset</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Progress is private to your signed-in account.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              {courses.length} guided tracks
            </div>
          </div>

          {error ? <ErrorNotice message={error} onRetry={loadCourses} /> : null}
          {loading ? <LoadingState /> : courses.length ? (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {courses.map((course) => <CourseCard key={course.id} course={course} onOpen={openCourse} />)}
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              <GraduationCap size={30} className="mx-auto text-cyan-600" />
              <h3 className="mt-3 font-black text-slate-900 dark:text-white">No learning paths are available</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Refresh the academy or check the backend deployment.</p>
            </div>
          )}

          <section className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-3">
            <div className="flex gap-3">
              <ShieldCheck size={19} className="mt-0.5 shrink-0 text-emerald-600" />
              <div><h3 className="text-xs font-extrabold text-slate-900 dark:text-white">Guardian-first boundaries</h3><p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">Training is scoped to your own assets or explicitly authorized environments.</p></div>
            </div>
            <div className="flex gap-3">
              <FlaskConical size={19} className="mt-0.5 shrink-0 text-cyan-600" />
              <div><h3 className="text-xs font-extrabold text-slate-900 dark:text-white">Practical but contained</h3><p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">Use local training applications, synthetic records, and disposable lab environments.</p></div>
            </div>
            <div className="flex gap-3">
              <Award size={19} className="mt-0.5 shrink-0 text-amber-600" />
              <div><h3 className="text-xs font-extrabold text-slate-900 dark:text-white">Evidence to remediation</h3><p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">Learn to document root causes, patch them, and prove the fix with regression tests.</p></div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
