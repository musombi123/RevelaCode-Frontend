// src/components/ChatWindow.jsx

import React, { useEffect, useMemo, useRef } from "react";

import Message from "./Message";
import ThinkingStages from "./ThinkingStages";
import MessageActions from "./MessageActions";

export default function ChatWindow({
  messages = [],
  regenerableId = null,
  onRegenerate,
  onFeedback,
  onDeleteMessage,
}) {
  const endRef = useRef(null);

  const loadingMessage = messages.findLast
    ? messages.findLast((message) => message?.status === "loading")
    : [...messages].reverse().find((message) => message?.status === "loading");
  const isTyping = Boolean(loadingMessage);

  /* =======================================================
     LAST USER PROMPT
     -------------------------------------------------------
     Used to pick the right thinking steps (Scripture, code,
     farming, business, etc.).
  ======================================================= */

  const lastUserText = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === "user") {
        return messages[i].text || "";
      }
    }
    return "";
  }, [messages]);

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

  useEffect(() => {
    const scrollToLatest = () => {
      window.requestAnimationFrame(() => {
        endRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
      });
    };
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", scrollToLatest);
    viewport?.addEventListener("scroll", scrollToLatest);
    window.addEventListener("resize", scrollToLatest, { passive: true });
    return () => {
      viewport?.removeEventListener("resize", scrollToLatest);
      viewport?.removeEventListener("scroll", scrollToLatest);
      window.removeEventListener("resize", scrollToLatest);
    };
  }, []);

  return (
    <div
      className="
        w-full
        min-w-0
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

        {messages.map((message) => {
          const isLoading = message.status === "loading";

          // The loading placeholder is replaced by the
          // thinking steps below, so it is not drawn here.
          if (isLoading) {
            return null;
          }

          const showActions = message.role === "assistant";

          return (
            <div key={message.id}>
              <Message message={message} />

              {showActions && (
                <div className="px-1">
                  <MessageActions
                    message={message}
                    regenerableId={regenerableId}
                    onRegenerate={onRegenerate}
                    onFeedback={onFeedback}
                    onDelete={onDeleteMessage}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* =================================================
            THINKING STEPS
        ================================================= */}

        {isTyping && (
          <div className="flex justify-start">
            <div
              className="
                rounded-2xl
                border
                border-line
                bg-surface
                px-4
                py-3
                shadow-sm
              "
            >
              <ThinkingStages prompt={lastUserText} stage={loadingMessage?.stage || "preparing"} />
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