import React from "react";
import { Sparkles } from "lucide-react";

/**
 * Calm, template-free empty state.
 * Entry points for voice, vision and specialist tools live in the sidebar and
 * composer so the welcome surface stays focused on the conversation.
 */
export default function WelcomeScreen() {
  return (
    <section
      data-demo="welcome-hero"
      aria-labelledby="revelaai-welcome-title"
      className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-10 text-center sm:py-16"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-surface shadow-sm">
        <img
          src="/android-chrome-512x512.png"
          alt=""
          aria-hidden="true"
          className="h-8 w-8 rounded-lg object-contain"
        />
      </div>

      <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-accent">
        <Sparkles size={12} />
        RevelaAI · Adaptive intelligence
      </p>

      <h1
        id="revelaai-welcome-title"
        className="mt-5 max-w-2xl text-3xl font-black leading-tight tracking-[-.04em] text-fg sm:text-4xl"
      >
        What would you like to work on?
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-fg-secondary sm:text-base">
        Ask a question, describe a problem, or attach something to explore.
        Your conversation starts in the message box below.
      </p>
    </section>
  );
}
