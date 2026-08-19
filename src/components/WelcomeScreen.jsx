// src/components/WelcomeScreen.jsx

import React from "react";
import {
  BookOpen,
  Code2,
  Lightbulb,
  Sparkles,
  Wand2,
} from "lucide-react";

export default function WelcomeScreen({
  onSuggestion,
}) {
  const suggestions = [
    {
      label: "Explain a Bible verse",
      prompt:
        "Explain John 3:16 in a clear and practical way.",
      icon: BookOpen,
    },
    {
      label: "Explore prophecy",
      prompt:
        "Explain the meaning of the symbol 666 from Scripture.",
      icon: Sparkles,
    },
    {
      label: "Help me code",
      prompt:
        "Help me debug a React component.",
      icon: Code2,
    },
    {
      label: "Teach me something",
      prompt:
        "Teach me an interesting concept step by step.",
      icon: Lightbulb,
    },
  ];

  const handleSuggestion = (prompt) => {
    onSuggestion?.(prompt);
  };

  return (
    <div
      className="
        w-full
        text-center
        animate-fade-in
      "
    >
      {/* =================================================
          BRAND
      ================================================= */}

      <div
        className="
          mx-auto
          flex
          h-20
          w-20
          items-center
          justify-center
          rounded-3xl
          bg-gradient-to-br
          from-green-500
          to-emerald-700
          shadow-xl
          shadow-emerald-950/20
        "
      >
        <img
          src="/android-chrome-512x512.png"
          alt="RevelaCode"
          className="
            h-12
            w-12
            rounded-2xl
            object-contain
          "
        />
      </div>

      {/* =================================================
          TITLE
      ================================================= */}

      <h1
        className="
          mt-7
          text-3xl
          font-black
          tracking-tight
          text-white
          sm:text-4xl
        "
      >
        How can I help today?
      </h1>

      <p
        className="
          mx-auto
          mt-3
          max-w-xl
          text-sm
          leading-7
          text-gray-400
          sm:text-base
        "
      >
        Ask RevelaAI about Scripture, prophecy,
        programming, education, agriculture,
        business, or anything you want to explore.
      </p>

      {/* =================================================
          CAPABILITY BADGES
      ================================================= */}

      <div
        className="
          mt-5
          flex
          flex-wrap
          justify-center
          gap-2
        "
      >
        {[
          "Scripture",
          "Prophecy",
          "Programming",
          "Education",
          "Business",
          "Agriculture",
        ].map((item) => (
          <span
            key={item}
            className="
              rounded-full
              border
              border-white/10
              bg-white/5
              px-3
              py-1.5
              text-[10px]
              font-bold
              text-gray-400
              sm:text-xs
            "
          >
            {item}
          </span>
        ))}
      </div>

      {/* =================================================
          STARTER PROMPTS
      ================================================= */}

      <div
        className="
          mx-auto
          mt-8
          grid
          w-full
          max-w-3xl
          grid-cols-1
          gap-3
          sm:grid-cols-2
        "
      >
        {suggestions.map(
          (suggestion) => {
            const Icon =
              suggestion.icon;

            return (
              <button
                key={suggestion.label}
                type="button"
                onClick={() =>
                  handleSuggestion(
                    suggestion.prompt
                  )
                }
                className="
                  group
                  flex
                  min-h-[92px]
                  items-start
                  gap-3
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/[0.03]
                  p-4
                  text-left
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:border-white/20
                  hover:bg-white/[0.06]
                  hover:shadow-lg
                  active:scale-[0.99]
                "
              >
                <div
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-white/5
                    text-emerald-400
                    transition
                    group-hover:bg-emerald-500/10
                  "
                >
                  <Icon size={18} />
                </div>

                <div className="min-w-0">
                  <p
                    className="
                      text-sm
                      font-bold
                      text-gray-200
                    "
                  >
                    {suggestion.label}
                  </p>

                  <p
                    className="
                      mt-1
                      line-clamp-2
                      text-xs
                      leading-5
                      text-gray-500
                    "
                  >
                    {suggestion.prompt}
                  </p>
                </div>
              </button>
            );
          }
        )}
      </div>

      {/* =================================================
          FOOTER NOTE
      ================================================= */}

      <div
        className="
          mt-7
          flex
          items-center
          justify-center
          gap-2
          text-[10px]
          text-gray-600
          sm:text-xs
        "
      >
        <Wand2 size={12} />

        <span>
          Powered by RevelaAI • MVI Engine
        </span>
      </div>
    </div>
  );
}
