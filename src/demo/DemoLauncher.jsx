import React from "react";
import { PlayCircle, RotateCcw, Sparkles } from "lucide-react";
import { useDemo } from "./DemoProvider.jsx";

export default function DemoLauncher({ startAt = "welcome", onStart, className = "", compact = false }) {
  const { active, chapterId, stepIndex, completed, lang, start } = useDemo();
  const hasProgress = chapterId !== "welcome" || stepIndex > 0 || completed.length > 0;

  const launch = (resume) => {
    if (typeof onStart === "function") {
      onStart({ resume, start });
      return;
    }
    start(resume ? { resume: true } : { chapterId: startAt });
  };

  if (active) {
    return (
      <span className={"inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200 " + className} role="status">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        {lang === "sw" ? "Hali ya onyesho — hakuna kinachohifadhiwa" : "Demo mode — nothing is saved"}
      </span>
    );
  }

  return (
    <div className={"flex flex-wrap items-center gap-2 " + className}>
      <button
        type="button"
        data-demo-launcher="true"
        onClick={() => launch(false)}
        className={"inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 motion-reduce:transition-none " + (compact ? "w-full" : "")}
      >
        <PlayCircle size={18} aria-hidden="true" /> {lang === "sw" ? "Jaribu onyesho" : "Try the Demo"}
      </button>
      {hasProgress ? (
        <button
          type="button"
          data-demo-resume="true"
          onClick={() => launch(true)}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200 dark:hover:bg-emerald-950/30 motion-reduce:transition-none"
        >
          <RotateCcw size={16} aria-hidden="true" /> {lang === "sw" ? "Endelea na onyesho" : "Resume demo"}
        </button>
      ) : null}
    </div>
  );
}
