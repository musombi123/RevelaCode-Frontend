import { Copy, Edit2 } from "lucide-react";
import ThinkingStages from "./ThinkingStages.jsx";
import { getMessageEmotion } from "./utils/messageEmotion.js";

export default function Message({ message }) {
  const emotion = getMessageEmotion(message);
  const isUser = message.role === "user";
  const isThinking = emotion === "thinking";

  const emotionStyles = {
    spiritual:
      "bg-gradient-to-r from-green-900/40 to-emerald-800/30 border-green-500/30",
    prophetic:
      "bg-gradient-to-r from-purple-900/40 to-indigo-800/30 border-purple-500/30",
    technical:
      "bg-gradient-to-r from-blue-900/40 to-slate-800/30 border-blue-500/30",
    user:
      "bg-revela-secondary text-white border-white/10",
    neutral:
      "bg-revela-card text-white border-white/10",
  };

  return (
    <div
      className={`
        w-full
        py-5
        flex
        ${isUser ? "justify-end" : "justify-start"}
        animate-fade-in
      `}
    >
      <div
        className={`
          max-w-[75%]
          px-4
          py-3
          rounded-2xl
          relative
          border
          text-sm
          leading-relaxed
          transition-all
          duration-300
          group
          ${emotionStyles[emotion]}
        `}
      >

        {/* THINKING MODE */}
        {isThinking && <ThinkingStages />}

        {/* MESSAGE CONTENT */}
        {!isThinking && (
          <p className="whitespace-pre-wrap">
            {message.text}
          </p>
        )}

        {/* ACTIONS */}
        {!isThinking && (
          <div className="
            absolute
            -bottom-6
            right-2
            flex
            gap-2
            opacity-0
            group-hover:opacity-100
          ">
            <button className="text-gray-300 hover:text-white">
              <Copy size={14} />
            </button>

            {isUser && (
              <button className="text-gray-300 hover:text-white">
                <Edit2 size={14} />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}