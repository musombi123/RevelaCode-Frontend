// src/components/ThinkingStages.jsx

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";

/* =========================================================
   STAGE SETS (match the modes used in enrichPrompt)
========================================================= */

const STAGE_SETS = {
  bible: [
    "Reading your question...",
    "Locating scripture references...",
    "Cross-checking related passages...",
    "Interpreting context and meaning...",
    "Writing the response...",
  ],
  prophecy: [
    "Reading your question...",
    "Scanning prophetic passages...",
    "Interpreting symbolic meaning...",
    "Cross-checking patterns...",
    "Writing the response...",
  ],
  developer: [
    "Reading your question...",
    "Analyzing the code context...",
    "Identifying the likely cause...",
    "Preparing a fix...",
    "Writing the response...",
  ],
  agriculture: [
    "Reading your question...",
    "Reviewing farming knowledge...",
    "Weighing practical options...",
    "Preparing recommendations...",
    "Writing the response...",
  ],
  business: [
    "Reading your question...",
    "Analyzing the business context...",
    "Comparing approaches...",
    "Preparing recommendations...",
    "Writing the response...",
  ],
  education: [
    "Reading your question...",
    "Identifying the key concepts...",
    "Structuring the explanation...",
    "Preparing examples...",
    "Writing the response...",
  ],
  general: [
    "Reading your question...",
    "Gathering relevant knowledge...",
    "Reasoning through the answer...",
    "Checking for accuracy...",
    "Writing the response...",
  ],
};

export function getStagesForPrompt(text = "") {
  const t = String(text).toLowerCase();
  const has = (...words) => words.some((w) => t.includes(w));

  if (has("bible", "verse", "scripture")) return STAGE_SETS.bible;
  if (has("prophecy", "beast", "666")) return STAGE_SETS.prophecy;
  if (has("code", "programming", "error", "react", "python"))
    return STAGE_SETS.developer;
  if (has("farm", "agriculture", "crop", "shamba"))
    return STAGE_SETS.agriculture;
  if (has("business", "sales", "marketing", "biashara"))
    return STAGE_SETS.business;
  if (has("school", "education", "student", "learning"))
    return STAGE_SETS.education;

  return STAGE_SETS.general;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ThinkingStages({
  stages,
  prompt = "",
  interval = 900,
  showPending = true,
  onDone,
}) {
  const list = useMemo(
    () => (stages?.length ? stages : getStagesForPrompt(prompt)),
    [stages, prompt]
  );

  const [index, setIndex] = useState(0);
  const isLast = index >= list.length - 1;

  // Restart if the stage list changes (new question)
  const listKey = list.join("|");
  useEffect(() => {
    setIndex(0);
  }, [listKey]);

  useEffect(() => {
    // The last stage stays active until this component unmounts
    if (isLast) {
      if (!onDone) return;
      const t = setTimeout(onDone, 300);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => setIndex((i) => i + 1), interval);
    return () => clearTimeout(t);
  }, [isLast, index, interval, onDone]);

  const visible = showPending ? list : list.slice(0, index + 1);

  return (
    <div className="min-w-[14rem] max-w-sm">
      {/* Screen readers announce only the current step */}
      <span className="sr-only" role="status" aria-live="polite">
        {list[index]}
      </span>

      <ol aria-hidden="true">
        {visible.map((label, i) => {
          const done = i < index;
          const active = i === index;

          return (
            <li
              key={`${i}-${label}`}
              className="relative flex gap-3 pb-2.5 last:pb-0"
            >
              {/* Connector line to the next step */}
              {i < visible.length - 1 && (
                <span
                  className={`absolute left-[9px] top-5 bottom-0 w-px transition-colors duration-500 ${
                    done ? "bg-emerald-500/50" : "bg-white/10"
                  }`}
                />
              )}

              {/* Step icon */}
              <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                {done && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}

                {active && (
                  <Loader2
                    size={16}
                    className="animate-spin text-emerald-400 motion-reduce:animate-none"
                  />
                )}

                {!done && !active && (
                  <span className="h-2 w-2 rounded-full border border-white/20" />
                )}
              </span>

              {/* Step label */}
              <span
                className={`pt-px text-sm transition-colors duration-300 ${
                  active
                    ? "font-medium text-white"
                    : done
                    ? "text-gray-400"
                    : "text-gray-600"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}