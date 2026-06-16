// components/ThinkingStages.jsx

import { useEffect, useState } from "react";

const stages = [
  "Analyzing input context...",
  "Scanning scripture references...",
  "Interpreting symbolic meaning...",
  "Cross-checking patterns...",
  "Generating response...",
];

export default function ThinkingStages({ onDone }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < stages.length - 1) {
      const t = setTimeout(() => {
        setIndex(index + 1);
      }, 700);

      return () => clearTimeout(t);
    } else {
      setTimeout(() => {
        onDone?.();
      }, 300);
    }
  }, [index]);

  return (
    <div className="text-sm text-gray-300 space-y-1 animate-fade-in">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span>{stages[index]}</span>
      </div>
    </div>
  );
}