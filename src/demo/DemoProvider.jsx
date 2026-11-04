import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";
import { setDemoApiActive, trackDemo } from "./demoApi.js";
import { isDemoEnabled } from "./demoPlatform.js";

const STORAGE_KEY = "revelacode_demo_progress_v1";
const DemoContext = createContext(null);

function readProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      active: value.active === true,
      presentationOnly: value.presentationOnly === true,
      chapterId: typeof value.chapterId === "string" ? value.chapterId : "welcome",
      stepIndex: Number.isInteger(value.stepIndex) && value.stepIndex >= 0 ? value.stepIndex : 0,
      lang: value.lang === "sw" ? "sw" : "en",
      voiceOn: value.voiceOn === true,
      completed: Array.isArray(value.completed) ? value.completed.filter((id) => typeof id === "string") : [],
    };
  } catch {
    return { active: false, presentationOnly: false, chapterId: "welcome", stepIndex: 0, lang: "en", voiceOn: false, completed: [] };
  }
}

function persistProgress(value) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch { /* progress remains in memory */ }
}

export function DemoProvider({ children, chapters = [] }) {
  const enabled = isDemoEnabled();
  const [state, setState] = useState(readProgress);
  const stateRef = useRef(state);
  const chaptersRef = useRef(chapters);
  chaptersRef.current = chapters;

  const commit = useCallback((nextValue) => {
    const next = typeof nextValue === "function" ? nextValue(stateRef.current) : nextValue;
    stateRef.current = next;
    persistProgress(next);
    setState(next);
    return next;
  }, []);

  useLayoutEffect(() => {
    if (!enabled) {
      // Clear stale demo state from an earlier web session on Android and
      // ensure no mocked API/network guards can remain active in the APK.
      setDemoApiActive(false);
      if (stateRef.current.active || stateRef.current.presentationOnly) {
        commit({ ...stateRef.current, active: false, presentationOnly: false });
      }
      return undefined;
    }
    if (!state.active) return undefined;
    const release = setDemoApiActive(true);
    return release;
  }, [enabled, state.active, commit]);

  useLayoutEffect(() => {
    if (!chapters.length) return;
    const validIds = new Set(chapters.map((chapter) => chapter.id));
    const currentChapter = chapters.find((chapter) => chapter.id === state.chapterId);
    const safeChapterId = currentChapter ? state.chapterId : "welcome";
    const safeStepIndex = currentChapter
      ? Math.min(state.stepIndex, Math.max(0, (currentChapter.steps || []).length - 1))
      : 0;
    const safeCompleted = state.completed.filter((id) => validIds.has(id) && id !== "finish");
    if (
      safeChapterId !== state.chapterId ||
      safeStepIndex !== state.stepIndex ||
      safeCompleted.length !== state.completed.length
    ) {
      commit({
        ...stateRef.current,
        chapterId: safeChapterId,
        stepIndex: safeStepIndex,
        completed: safeCompleted,
      });
    }
  }, [chapters, state.chapterId, state.stepIndex, state.completed, commit]);

  const chapterAt = useCallback((id) => chaptersRef.current.findIndex((chapter) => chapter.id === id), []);

  const start = useCallback((options = {}) => {
    if (!enabled) return;
    const current = stateRef.current;
    const resume = options.resume === true;
    const chapterId = options.chapterId || (resume ? current.chapterId : "welcome");
    const stepIndex = resume ? current.stepIndex : 0;
    const completed = resume ? current.completed : [];
    commit({ ...current, active: true, presentationOnly: false, chapterId, stepIndex, completed });
    trackDemo("demo_started", { chapter_id: chapterId, resumed: resume });
    trackDemo("step_viewed", { chapter_id: chapterId, step_index: stepIndex });
  }, [commit, enabled]);

  const startPresentation = useCallback(() => {
    if (!enabled) return;
    const current = stateRef.current;
    commit({ ...current, active: true, presentationOnly: true });
    trackDemo("presentation_mode_started", { source: "admin_console" });
  }, [commit, enabled]);

  const exitPresentation = useCallback(() => {
    const current = stateRef.current;
    commit({ ...current, active: false, presentationOnly: false });
    trackDemo("presentation_mode_ended", { source: "admin_console" });
  }, [commit]);

  const next = useCallback(() => {
    const current = stateRef.current;
    const chaptersNow = chaptersRef.current;
    const index = chapterAt(current.chapterId);
    const chapter = chaptersNow[index];
    if (!chapter) return;
    const steps = Array.isArray(chapter.steps) ? chapter.steps : [];
    const lastStep = Math.max(0, steps.length - 1);

    if (steps.length > 0 && current.stepIndex < lastStep) {
      const nextStep = current.stepIndex + 1;
      commit({ ...current, stepIndex: nextStep });
      trackDemo("step_viewed", { chapter_id: chapter.id, step_index: nextStep });
      return;
    }

    const completed = current.completed.includes(chapter.id) ? current.completed : [...current.completed, chapter.id];
    trackDemo("chapter_completed", { chapter_id: chapter.id });
    const nextChapter = chaptersNow[index + 1];
    if (nextChapter) {
      commit({ ...current, chapterId: nextChapter.id, stepIndex: 0, completed });
      trackDemo("step_viewed", { chapter_id: nextChapter.id, step_index: 0 });
    } else {
      commit({ ...current, active: false, presentationOnly: false, completed });
      trackDemo("demo_finished", { completed_chapters: completed.filter((id) => id !== "finish").length });
    }
  }, [chapterAt, commit]);

  const back = useCallback(() => {
    const current = stateRef.current;
    const index = chapterAt(current.chapterId);
    if (current.stepIndex > 0) {
      const previous = current.stepIndex - 1;
      commit({ ...current, stepIndex: previous });
      trackDemo("step_viewed", { chapter_id: current.chapterId, step_index: previous });
      return;
    }
    const previousChapter = chaptersRef.current[index - 1];
    if (!previousChapter) return;
    const previousStep = Math.max(0, (previousChapter.steps || []).length - 1);
    commit({ ...current, chapterId: previousChapter.id, stepIndex: previousStep });
    trackDemo("step_viewed", { chapter_id: previousChapter.id, step_index: previousStep });
  }, [chapterAt, commit]);

  const skip = useCallback(() => {
    const current = stateRef.current;
    const index = chapterAt(current.chapterId);
    const nextChapter = chaptersRef.current[index + 1];
    trackDemo("demo_skipped", { chapter_id: current.chapterId, step_index: current.stepIndex });
    if (!nextChapter) {
      commit({ ...current, active: false, presentationOnly: false });
      return;
    }
    commit({ ...current, chapterId: nextChapter.id, stepIndex: 0 });
    trackDemo("step_viewed", { chapter_id: nextChapter.id, step_index: 0, skipped_from: current.chapterId });
  }, [chapterAt, commit]);

  const jumpToChapter = useCallback((chapterId) => {
    const chapter = chaptersRef.current.find((item) => item.id === chapterId);
    if (!chapter) return;
    commit({ ...stateRef.current, active: true, presentationOnly: false, chapterId, stepIndex: 0 });
    trackDemo("step_viewed", { chapter_id: chapterId, step_index: 0, source: "chapter_menu" });
  }, [commit]);

  const exit = useCallback(() => {
    const current = stateRef.current;
    if (current.chapterId === "finish") {
      trackDemo("demo_finished", {
        completed_chapters: current.completed.filter((id) => id !== "finish").length,
        exit_action: "leave_finish",
      });
    }
    commit({ ...current, active: false, presentationOnly: false });
  }, [commit]);

  const restart = useCallback(() => {
    commit({ ...stateRef.current, active: true, presentationOnly: false, chapterId: "welcome", stepIndex: 0, completed: [] });
    trackDemo("demo_started", { restarted: true, chapter_id: "welcome" });
    trackDemo("step_viewed", { chapter_id: "welcome", step_index: 0 });
  }, [commit]);

  const setLang = useCallback((lang) => {
    const nextLang = lang === "sw" ? "sw" : "en";
    commit({ ...stateRef.current, lang: nextLang });
    trackDemo("language_changed", { language: nextLang });
  }, [commit]);

  const setVoiceOn = useCallback((voiceOn) => {
    commit({ ...stateRef.current, voiceOn: Boolean(voiceOn) });
  }, [commit]);

  const value = useMemo(() => ({
    ...state, enabled, chapters, start, startPresentation, exitPresentation, next, back, skip, jumpToChapter, exit, restart, setLang, setVoiceOn,
    updateLanguage: setLang,
  }), [state, enabled, chapters, start, startPresentation, exitPresentation, next, back, skip, jumpToChapter, exit, restart, setLang, setVoiceOn]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo must be used inside DemoProvider.");
  return value;
}

export default DemoProvider;
