// src/components/ChatWindow.jsx

import React, {
  useEffect,
  useRef,
} from "react";

import Message from "./Message";
import TypingIndicator from "./TypingIndicator";

export default function ChatWindow({
  messages = [],
}) {
  const endRef = useRef(null);

  const isTyping =
    messages.length > 0 &&
    messages[messages.length - 1]?.status ===
      "loading";

  /* =======================================================
     AUTO SCROLL
     -------------------------------------------------------
     ChatWindow owns message positioning, but the parent
     owns the actual scroll container.
  ======================================================= */

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages.length]);

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-4xl
        px-3
        py-5
        sm:px-5
        sm:py-6
      "
    >
      <div className="space-y-4">
        {/* =================================================
            MESSAGES
        ================================================= */}

        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
          />
        ))}

        {/* =================================================
            TYPING INDICATOR
        ================================================= */}

        {isTyping && (
          <div className="flex justify-start">
            <div
              className="
                rounded-2xl
                border
                border-white/10
                bg-revela-card
                px-4
                py-3
                shadow-sm
              "
            >
              <TypingIndicator />
            </div>
          </div>
        )}

        {/* =================================================
            SCROLL ANCHOR
        ================================================= */}

        <div
          ref={endRef}
          className="h-px w-full"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
