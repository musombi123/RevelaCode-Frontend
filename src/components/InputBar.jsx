// components/InputBar.jsx

import { Send, Mic } from "lucide-react";
import { useState } from "react";

export default function InputBar({
  onSend,
  onMic,
  centered = false,
}) {
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;

    onSend(text);
    setText("");
  };

  return (
    <div
      className={
        centered
          ? "w-full"
          : "p-4 border-t border-white/10 bg-revela-dark"
      }
    >
      <div className="max-w-3xl mx-auto">
        <div
          className="
            flex
            items-center
            gap-2
            bg-revela-card
            rounded-2xl
            px-3
            py-2
            border
            border-white/10
            shadow-lg
          "
        >
          <input
            className="
              bg-transparent
              text-white
              placeholder-gray-400
              min-h-[44px]
              max-h-[200px]
              w-full
              resize-none
              overflow-hidden
            "
            placeholder="Ask RevelaAI anything..."
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);

              e.target.style.height = "auto";
              e.target.style.height =
              `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) =>
              e.key === "Enter" && submit()
            }
          />

          <button
            onClick={onMic}
            className="
              text-gray-400
              hover:text-white
              transition-colors
            "
          >
            <Mic size={18} />
          </button>

          <button
            onClick={submit}
            className="
              bg-revela-secondary
              hover:opacity-90
              px-3
              py-2
              rounded-xl
              transition-all
            "
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}