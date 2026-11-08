// src/components/ThinkingStages.jsx
import React, { useMemo } from "react";
import { Check, LoaderCircle, Sparkles } from "lucide-react";

const ADAPTIVE_STAGES = [
  { id: "preparing", label: "Preparing your request", detail: "Organising prompt and conversation context" },
  { id: "connecting", label: "Connecting to RevelaAI", detail: "Sending the request to the configured AI service" },
  { id: "interpreting", label: "Response received", detail: "Reading the service response and available metadata" },
  { id: "composing", label: "Preparing your answer", detail: "Formatting the result for this conversation" },
  { id: "streaming", label: "Streaming response", detail: "Displaying the answer as it is generated" },
];

const LOCAL_STAGES = [
  { id: "preparing", label: "Preparing your request", detail: "Organising prompt and conversation context" },
  { id: "local-reasoning", label: "Running local reasoning", detail: "Using the on-device fallback engine" },
  { id: "composing", label: "Preparing your answer", detail: "Formatting the local result" },
  { id: "streaming", label: "Streaming response", detail: "Displaying the answer incrementally" },
];

const FILE_STAGES = [
  { id: "preparing", label: "Preparing your request", detail: "Checking the attached file and prompt" },
  { id: "local-analysis", label: "Analyzing attachment", detail: "Extracting document content or measuring media on this device" },
  { id: "connecting", label: "Connecting to RevelaAI", detail: "Sending extracted observations for interpretation" },
  { id: "interpreting", label: "Response received", detail: "Reading the service response" },
  { id: "composing", label: "Preparing your answer", detail: "Combining analysis and relevant context" },
  { id: "streaming", label: "Streaming response", detail: "Displaying the result incrementally" },
];

export default function ThinkingStages({ stage = "preparing", prompt = "" }) {
  const stages = useMemo(() => {
    if (stage === "local-reasoning") return LOCAL_STAGES;
    if (stage === "local-analysis") return FILE_STAGES;
    return ADAPTIVE_STAGES;
  }, [stage]);

  const activeIndex = Math.max(0, stages.findIndex((item) => item.id === stage));
  const active = stages[activeIndex] || stages[0];

  return (
    <section className="w-full min-w-[15rem] max-w-sm" aria-label="RevelaAI live progress">
      <div className="mb-3 flex items-center gap-2">
        <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Sparkles size={14} />
          <span className="absolute inset-0 animate-ping rounded-full border border-accent/30 motion-reduce:animate-none" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-fg">RevelaAI is working</p>
          <p className="text-[11px] text-muted">Live request progress</p>
        </div>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
      </div>

      <ol className="space-y-2.5" aria-label={active.label}>
        {stages.map((item, index) => {
          const done = index < activeIndex;
          const current = index === activeIndex;
          return (
            <li key={item.id} className="relative flex gap-3">
              <span className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center">
                {done ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Check size={12} strokeWidth={3} />
                  </span>
                ) : current ? (
                  <LoaderCircle size={17} className="animate-spin text-accent motion-reduce:animate-none" />
                ) : (
                  <span className="h-2 w-2 rounded-full border border-line-strong bg-surface" />
                )}
              </span>
              <div className={`min-w-0 flex-1 pb-1 transition-opacity duration-300 ${current ? "opacity-100" : done ? "opacity-65" : "opacity-40"}`}>
                <p className={`text-xs leading-5 ${current ? "font-semibold text-fg" : "text-muted"}`}>{item.label}</p>
                {current && <p className="text-[10px] leading-4 text-muted">{item.detail}</p>}
              </div>
              {current && <span className="mt-1 h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-accent" />}
            </li>
          );
        })}
      </ol>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${Math.max(8, ((activeIndex + 1) / stages.length) * 100)}%` }}
        />
      </div>
      <span className="sr-only" role="status" aria-live="polite">{active.label}</span>
    </section>
  );
}
