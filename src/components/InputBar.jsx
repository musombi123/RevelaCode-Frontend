import { Send, Mic } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function InputBar({
  onSend,
  onMic,
  centered = false,
}) {
  const [text, setText] = useState("");
  const [bottomOffset, setBottomOffset] = useState(0);

  const textareaRef = useRef(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [text]);

  // Move above mobile keyboard
  useEffect(() => {
    if (!window.visualViewport) return;

    const update = () => {
      const viewport = window.visualViewport;

      const keyboardHeight =
        window.innerHeight -
        viewport.height -
        viewport.offsetTop;

      setBottomOffset(Math.max(0, keyboardHeight));
    };

    update();

    window.visualViewport.addEventListener("resize", update);
    window.visualViewport.addEventListener("scroll", update);

    return () => {
      window.visualViewport.removeEventListener("resize", update);
      window.visualViewport.removeEventListener("scroll", update);
    };
  }, []);

  const submit = () => {
    const value = text.trim();

    if (!value) return;

    onSend(value);
    setText("");
  };

  return (
    <div
      className={`
        ${
          centered
            ? "w-full"
            : "fixed left-0 right-0 z-50 border-t border-white/10 bg-revela-dark/95 backdrop-blur-lg"
        }
      `}
      style={
        centered
          ? {}
          : {
              bottom: `${bottomOffset}px`,
              transition: "bottom .25s ease",
            }
      }
    >
      <div className="max-w-3xl mx-auto p-3">
        <div
          className="
            flex
            items-end
            gap-2
            bg-revela-card
            rounded-2xl
            px-3
            py-2
            border
            border-white/10
            shadow-xl
          "
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            placeholder="Ask RevelaAI anything..."
            className="
              flex-1
              resize-none
              overflow-y-auto
              bg-transparent
              text-white
              placeholder-gray-400
              outline-none
              max-h-44
              min-h-[24px]
            "
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey
              ) {
                e.preventDefault();
                submit();
              }
            }}
          />

          <button
            onClick={onMic}
            className="
              p-2
              rounded-xl
              text-gray-400
              hover:text-white
              hover:bg-white/10
              transition
            "
          >
            <Mic size={18} />
          </button>

          <button
            onClick={submit}
            disabled={!text.trim()}
            className="
              p-2
              rounded-xl
              bg-revela-secondary
              hover:opacity-90
              disabled:opacity-40
              transition
            "
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
