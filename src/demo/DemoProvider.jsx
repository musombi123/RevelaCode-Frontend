import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";
import { setDemoApiActive, trackDemo } from "./demoApi.js";

const STORAGE_KEY = "revelacode_demo_progress_v1";
const DemoContext = createContext(null);

function readProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      active: value.active === true,
      chapterId: typeof value.chapterId === "string" ? value.chapterId : "welcome",
      stepIndex: Number.isInteger(value.stepIndex) && value.stepIndex >= 0 ? value.stepIndex : 0,
      lang: value.lang === "sw" ? "sw" : "en",
      voiceOn: value.voiceOn === true,
      completed: Array.isArray(value.completed) ? value.completed.filter((id) => typeof id === "string") : [],
    };
  } catch {
    return { active: false, chapterId: "welcome", stepIndex: 0, lang: "en", voiceOn: false, completed: [] };
  }
}

function persistProgress(value) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch { /* progress remains in memory */ }
}

export function DemoProvider({ children, chapters = [] }) {
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
    if (!state.active) return undefined;
    const release = setDemoApiActive(true);
    return release;
  }, [state.active]);

  const chapterAt = useCallback((id) => chaptersRef.current.findIndex((chapter) => chapter.id === id), []);

  const start = useCallback((options = {}) => {
    const current = stateRef.current;
    const resume = options.resume === true;
    const chapterId = options.chapterId || (resume ? current.chapterId : "welcome");
    const stepIndex = resume ? current.stepIndex : 0;
    commit({ ...current, active: true, chapterId, stepIndex });
    trackDemo("demo_started", { chapter_id: chapterId, resumed: resume });
    trackDemo("step_viewed", { chapter_id: chapterId, step_index: stepIndex });
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
      if (nextChapter.id === "finish") trackDemo("demo_finished", { completed_chapters: completed.length });
      else trackDemo("step_viewed", { chapter_id: nextChapter.id, step_index: 0 });
    } else {
      commit({ ...current, active: false, completed });
      trackDemo("demo_finished", { completed_chapters: completed.length });
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
      commit({ ...current, active: false });
      return;
    }
    commit({ ...current, chapterId: nextChapter.id, stepIndex: 0 });
    if (nextChapter.id === "finish") trackDemo("demo_finished", { skipped_to_finish: true });
    else trackDemo("step_viewed", { chapter_id: nextChapter.id, step_index: 0 });
  }, [chapterAt, commit]);

  const jumpToChapter = useCallback((chapterId) => {
    const chapter = chaptersRef.current.find((item) => item.id === chapterId);
    if (!chapter) return;
    commit({ ...stateRef.current, active: true, chapterId, stepIndex: 0 });
    trackDemo("step_viewed", { chapter_id: chapterId, step_index: 0, source: "chapter_menu" });
  }, [commit]);

  const exit = useCallback(() => {
    const current = stateRef.current;
    commit({ ...current, active: false });
  }, [commit]);

  const restart = useCallback(() => {
    commit({ ...stateRef.current, active: true, chapterId: "welcome", stepIndex: 0, completed: [] });
    trackDemo("demo_started", { restarted: true });
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
    ...state, chapters, start, next, back, skip, jumpToChapter, exit, restart, setLang, setVoiceOn,
    updateLanguage: setLang,
  }), [state, chapters, start, next, back, skip, jumpToChapter, exit, restart, setLang, setVoiceOn]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo must be used inside DemoProvider.");
  return value;
}

export default DemoProvider;
