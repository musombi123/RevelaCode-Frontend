// src/components/InputBar.jsx

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Send,
  Mic,
  Paperclip,
  X,
} from "lucide-react";

/* =========================================================
   INPUT BAR
   ---------------------------------------------------------
   IMPORTANT:
   This component owns ONLY the composer.

   It does NOT:
   - position itself fixed to the viewport
   - manage the chat layout
   - move itself above the keyboard with bottom offsets

   The parent dashboard controls its placement.
========================================================= */

export default function InputBar({
  onSend,
  onMic,
  disabled = false,
  placeholder = "Ask RevelaAI anything...",
}) {
  const [text, setText] =
    useState("");

  const [attachedFile, setAttachedFile] =
    useState(null);

  const textareaRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  /* =======================================================
     AUTO-GROW TEXTAREA
  ======================================================= */

  useEffect(() => {
    const element =
      textareaRef.current;

    if (!element) {
      return;
    }

    element.style.height = "0px";

    const nextHeight = Math.min(
      Math.max(
        element.scrollHeight,
        44
      ),
      180
    );

    element.style.height =
      `${nextHeight}px`;
  }, [text]);

  /* =======================================================
     SUBMIT
  ======================================================= */

  const submit = () => {
    const value =
      text.trim();

    if (!value || disabled) {
      return;
    }

    onSend?.(value);

    setText("");
    setAttachedFile(null);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  /* =======================================================
     KEYBOARD
  ======================================================= */

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      submit();
    }
  };

  /* =======================================================
     FILE
  ======================================================= */

  const handleFileChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setAttachedFile(file);

    /*
     * Reset the input so selecting
     * the same file again still fires
     * onChange.
     */
    event.target.value = "";
  };

  const removeAttachment = () => {
    setAttachedFile(null);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="w-full">
      {/* Hidden file input */}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={
          handleFileChange
        }
        accept="
          .txt,
          .pdf,
          .doc,
          .docx,
          .jpg,
          .jpeg,
          .png,
          .webp
        "
      />

      {/* Attachment preview */}

      {attachedFile && (
        <div
          className="
            mb-2
            flex
            items-center
            gap-2
            rounded-xl
            border
            border-white/10
            bg-white/5
            px-3
            py-2
            text-xs
            text-gray-300
          "
        >
          <span className="min-w-0 flex-1 truncate">
            {attachedFile.name}
          </span>

          <button
            type="button"
            onClick={
              removeAttachment
            }
            className="
              flex
              h-6
              w-6
              shrink-0
              items-center
              justify-center
              rounded-lg
              text-gray-400
              transition
              hover:bg-white/10
              hover:text-white
            "
            aria-label="Remove attachment"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Composer */}

      <div
        className="
          rounded-2xl
          border
          border-white/10
          bg-revela-card
          p-2
          shadow-xl
          transition-all
          focus-within:border-white/20
          focus-within:ring-1
          focus-within:ring-white/10
        "
      >
        <div className="flex items-end gap-2">

          {/* Attach */}

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={disabled}
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              text-gray-400
              transition
              hover:bg-white/10
              hover:text-white
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
            aria-label="Attach file"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>

          {/* Textarea */}

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            disabled={disabled}
            placeholder={
              placeholder
            }
            onChange={(event) =>
              setText(
                event.target.value
              )
            }
            onKeyDown={
              handleKeyDown
            }
            className="
              min-h-[44px]
              max-h-[180px]
              min-w-0
              flex-1
              resize-none
              overflow-y-auto
              bg-transparent
              px-2
              py-2.5
              text-sm
              leading-6
              text-white
              outline-none
              placeholder:text-gray-500
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            aria-label={
              placeholder
            }
          />

          {/* Voice */}

          <button
            type="button"
            onClick={onMic}
            disabled={disabled}
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              text-gray-400
              transition
              hover:bg-white/10
              hover:text-white
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
            aria-label="Use voice input"
            title="Voice input"
          >
            <Mic size={18} />
          </button>

          {/* Send */}

          <button
            type="button"
            onClick={submit}
            disabled={
              disabled ||
              !text.trim()
            }
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-revela-secondary
              text-white
              shadow-sm
              transition
              hover:opacity-90
              active:scale-95
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
            aria-label="Send message"
            title="Send message"
          >
            <Send size={18} />
          </button>
        </div>

        {/* Footer hint */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            px-2
            pb-1
            pt-1
          "
        >
          <p
            className="
              truncate
              text-[10px]
              text-gray-500
            "
          >
            Enter to send • Shift + Enter
            for a new line
          </p>

          <span
            className="
              hidden
              shrink-0
              text-[10px]
              text-gray-600
              sm:block
            "
          >
            MVI Engine
          </span>
        </div>
      </div>
    </div>
  );
}
