// components/ThinkingStages.jsx

import { useEffect, useState } from "react";

const DEFAULT_STAGES = [
  "Analyzing input context...",
  "Scanning scripture references...",
  "Interpreting symbolic meaning...",
  "Cross-checking patterns...",
  "Generating response...",
];

export default function ThinkingStages({
  stages = DEFAULT_STAGES,
  interval = 700,
  onDone,
}) {
  const [index, setIndex] = useState(0);
  const isLast = index >= stages.length - 1;

  useEffect(() => {
    // Advance one stage at a time; the last stage stays until unmounted.
    if (isLast) {
      if (!onDone) return;
      const t = setTimeout(onDone, 300);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => setIndex((i) => i + 1), interval);
    return () => clearTimeout(t);
  }, [isLast, index, interval, onDone]);

  return (
    <div
      className="text-sm text-gray-300 animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 shrink-0 bg-green-500 rounded-full animate-pulse" />
        <span>{stages[index]}</span>
      </div>
    </div>
  );
}
