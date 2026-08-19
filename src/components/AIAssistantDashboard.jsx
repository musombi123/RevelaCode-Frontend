// @ai/AIAssistantDashboard.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Menu,
  Sparkles,
  ShieldCheck,
  MessageSquarePlus,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import InputBar from "@/components/InputBar";
import WelcomeScreen from "@/components/WelcomeScreen";
import RevelaAIVoiceChat from "@/ai/RevelaAIVoiceChat";

/* =========================================================
   CONSTANTS
========================================================= */

const STORAGE_KEY = "revela_chats";

const REVELAAI_URL =
  import.meta.env.VITE_REVELAAI_URL;

/* =========================================================
   MESSAGE FACTORY
========================================================= */

const createMessage = (
  role,
  text,
  status = "done"
) => ({
  id:
    typeof crypto !== "undefined" &&
    crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
  role,
  text,
  status,
});

/* =========================================================
   CONTEXT BUILDER
========================================================= */

const buildContext = (messages) => {
  return messages
    .slice(-12)
    .map((message) => {
      const role =
        message.role === "user"
          ? "User"
          : "Assistant";

      return `${role}: ${message.text}`;
    })
    .join("\n");
};

/* =========================================================
   PROMPT INTELLIGENCE
========================================================= */

const enrichPrompt = (text) => {
  const lower = String(text || "")
    .toLowerCase();

  if (
    lower.includes("bible") ||
    lower.includes("verse") ||
    lower.includes("scripture")
  ) {
    return `[BIBLE MODE] ${text}`;
  }

  if (
    lower.includes("prophecy") ||
    lower.includes("beast") ||
    lower.includes("666") ||
    lower.includes("revelation")
  ) {
    return `[PROPHECY MODE] ${text}`;
  }

  if (
    lower.includes("code") ||
    lower.includes("programming") ||
    lower.includes("error") ||
    lower.includes("react") ||
    lower.includes("python")
  ) {
    return `[DEVELOPER MODE] ${text}`;
  }

  if (
    lower.includes("farm") ||
    lower.includes("agriculture") ||
    lower.includes("crop") ||
    lower.includes("shamba")
  ) {
    return `[AGRICULTURE MODE] ${text}`;
  }

  if (
    lower.includes("business") ||
    lower.includes("businesses") ||
    lower.includes("sales") ||
    lower.includes("marketing") ||
    lower.includes("biashara")
  ) {
    return `[BUSINESS MODE] ${text}`;
  }

  if (
    lower.includes("school") ||
    lower.includes("education") ||
    lower.includes("student") ||
    lower.includes("learning")
  ) {
    return `[EDUCATION MODE] ${text}`;
  }

  return text;
};

/* =========================================================
   SAFE LOCAL STORAGE
========================================================= */

const loadSavedChats = () => {
  if (
    typeof window === "undefined"
  ) {
    return [];
  }

  try {
    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (chat) =>
        chat &&
        typeof chat === "object" &&
        chat.id
    );
  } catch (error) {
    console.error(
      "❌ Failed to restore RevelaAI chats:",
      error
    );

    try {
      localStorage.removeItem(
        STORAGE_KEY
      );
    } catch {
      // Ignore cleanup failure.
    }

    return [];
  }
};

/* =========================================================
   CHAT NORMALIZATION
========================================================= */

const normalizeChat = (
  chat
) => {
  if (!chat) {
    return null;
  }

  const messages = Array.isArray(
    chat.messages
  )
    ? chat.messages
    : [];

  return {
    id: chat.id,
    title:
      String(
        chat.title ||
          "New Conversation"
      ).trim() ||
      "New Conversation",
    messages,
    createdAt:
      chat.createdAt ||
      Date.now(),
    updatedAt:
      chat.updatedAt ||
      Date.now(),
  };
};

/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function AIAssistantDashboard({
  onOpenAI,
}) {
  const [messages, setMessages] =
    useState([]);

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [chats, setChats] =
    useState(() =>
      loadSavedChats()
        .map(normalizeChat)
        .filter(Boolean)
    );

  const [activeChatId, setActiveChatId] =
    useState(null);

  const [voiceActive, setVoiceActive] =
    useState(false);

  const controllerRef =
    useRef(null);

  /* =======================================================
     PERSIST CHATS
  ======================================================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(chats)
      );
    } catch (error) {
      console.error(
        "❌ Failed to save RevelaAI chats:",
        error
      );
    }
  }, [chats]);

  /* =======================================================
     CLEANUP AI REQUEST ON UNMOUNT
  ======================================================= */

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  /* =======================================================
     ACTIVE CHAT
  ======================================================= */

  const activeChat = useMemo(() => {
    if (!activeChatId) {
      return null;
    }

    return (
      chats.find(
        (chat) =>
          chat.id === activeChatId
      ) || null
    );
  }, [activeChatId, chats]);

  /* =======================================================
     START NEW CHAT
  ======================================================= */

  const startNewChat = useCallback(() => {
    const newChat = normalizeChat({
      id:
        typeof crypto !== "undefined" &&
        crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,

      title: "New Conversation",

      messages: [],

      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    setChats((previous) => [
      newChat,
      ...previous,
    ]);

    setActiveChatId(newChat.id);
    setMessages([]);

    /* On mobile the new chat should open
       the content immediately. */
    setSidebarOpen(false);
  }, []);

  /* =======================================================
     SELECT CHAT
  ======================================================= */

  const selectChat = useCallback(
    (chat) => {
      if (!chat) {
        return;
      }

      const normalized =
        normalizeChat(chat);

      if (!normalized) {
        return;
      }

      setActiveChatId(
        normalized.id
      );

      setMessages([
        ...normalized.messages,
      ]);

      setSidebarOpen(false);
    },
    []
  );

  /* =======================================================
     UPDATE CHAT
  ======================================================= */

  const updateChat = useCallback(
    (
      chatId,
      nextMessages,
      nextTitle = null
    ) => {
      setChats((previous) =>
        previous.map((chat) => {
          if (
            chat.id !== chatId
          ) {
            return chat;
          }

          const firstUserMessage =
            nextMessages.find(
              (message) =>
                message.role === "user"
            );

          const derivedTitle =
            nextTitle ||
            (
              chat.title ===
                "New Conversation" &&
              firstUserMessage?.text
                ? firstUserMessage.text
                    .trim()
                    .slice(0, 45)
                : chat.title
            );

          return {
            ...chat,
            title:
              derivedTitle ||
              "New Conversation",
            messages:
              nextMessages,
            updatedAt: Date.now(),
          };
        })
      );
    },
    []
  );

  /* =======================================================
     ENSURE CHAT
  ======================================================= */

  const ensureActiveChat = useCallback(
    (initialTitle = "New Conversation") => {
      if (activeChatId) {
        return activeChatId;
      }

      const newChat = normalizeChat({
        id:
          typeof crypto !== "undefined" &&
          crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,

        title:
          initialTitle
            .trim()
            .slice(0, 45) ||
          "New Conversation",

        messages: [],

        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      setChats((previous) => [
        newChat,
        ...previous,
      ]);

      setActiveChatId(
        newChat.id
      );

      return newChat.id;
    },
    [activeChatId]
  );

  /* =======================================================
     AI REQUEST
  ======================================================= */

  const callRevelaAI = useCallback(
    async (
      message,
      context,
      signal
    ) => {
      if (!REVELAAI_URL) {
        throw new Error(
          "VITE_REVELAAI_URL is not configured."
        );
      }

      const response =
        await fetch(
          `${REVELAAI_URL}/ai`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              message,
              context,
            }),
            signal,
          }
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `AI request failed (HTTP ${response.status}).`
        );
      }

      return data;
    },
    []
  );

  /* =======================================================
     SEND MESSAGE
  ======================================================= */

  const sendTextMessage = useCallback(
    async (text) => {
      const cleaned =
        String(text || "").trim();

      if (!cleaned) {
        return;
      }

      const currentMessages =
        messages;

      const chatId =
        activeChatId ||
        ensureActiveChat(cleaned);

      const userMessage =
        createMessage(
          "user",
          cleaned
        );

      const loadingId =
        typeof crypto !== "undefined" &&
        crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      const loadingMessage = {
        id: loadingId,
        role: "assistant",
        text: "Thinking…",
        status: "loading",
      };

      const nextMessages = [
        ...currentMessages,
        userMessage,
        loadingMessage,
      ];

      setMessages(nextMessages);

      updateChat(
        chatId,
        nextMessages,
        cleaned.slice(0, 45)
      );

      /* Stop any older request. */
      controllerRef.current?.abort();

      const controller =
        new AbortController();

      controllerRef.current =
        controller;

      const context =
        buildContext(
          currentMessages
        );

      try {
        const data =
          await callRevelaAI(
            enrichPrompt(
              cleaned
            ),
            context,
            controller.signal
          );

        const assistantText =
          data?.data?.content ||
          data?.content ||
          data?.response ||
          "No response from RevelaAI.";

        setMessages(
          (previous) => {
            const updated =
              previous.map(
                (message) =>
                  message.id ===
                  loadingId
                    ? {
                        ...message,
                        text: assistantText,
                        status: "done",
                      }
                    : message
              );

            updateChat(
              chatId,
              updated
            );

            return updated;
          }
        );
      } catch (error) {
        if (
          error?.name ===
          "AbortError"
        ) {
          return;
        }

        console.error(
          "❌ RevelaAI request failed:",
          error
        );

        setMessages(
          (previous) => {
            const updated =
              previous.map(
                (message) =>
                  message.id ===
                  loadingId
                    ? {
                        ...message,
                        text:
                          error?.message ||
                          "Request failed. Please try again.",
                        status: "error",
                      }
                    : message
              );

            updateChat(
              chatId,
              updated
            );

            return updated;
          }
        );
      } finally {
        if (
          controllerRef.current ===
          controller
        ) {
          controllerRef.current =
            null;
        }
      }
    },
    [
      messages,
      activeChatId,
      ensureActiveChat,
      updateChat,
      callRevelaAI,
    ]
  );

  /* =======================================================
     VOICE
  ======================================================= */

  const openVoice = useCallback(() => {
    setVoiceActive(true);
  }, []);

  const closeVoice = useCallback(() => {
    setVoiceActive(false);
  }, []);

  const handleVoiceResult =
    useCallback(
      (text) => {
        if (text) {
          sendTextMessage(text);
        }

        setVoiceActive(false);
      },
      [sendTextMessage]
    );

  /* =======================================================
     CONVERSATION STATE
  ======================================================= */

  const hasConversation =
    messages.some(
      (message) =>
        message.role === "user"
    );

  /* =======================================================
     CHAT HEADER
  ======================================================= */

  const chatTitle =
    activeChat?.title ||
    "RevelaAI";

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="
        flex
        h-full
        min-h-0
        min-w-0
        overflow-hidden
        bg-revela-dark
        text-white
      "
    >
      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        chats={chats}
        activeChatId={
          activeChatId
        }
        onNewChat={
          startNewChat
        }
        onSelectChat={
          selectChat
        }
      />

      {/* ===================================================
          MAIN AI WORKSPACE
      =================================================== */}

      <main
        className="
          flex
          min-h-0
          min-w-0
          flex-1
          flex-col
          overflow-hidden
        "
      >
        {/* =================================================
            TOP BAR
        ================================================= */}

        <header
          className="
            flex
            h-14
            shrink-0
            items-center
            justify-between
            gap-3
            border-b
            border-white/10
            bg-revela-dark/95
            px-3
            backdrop-blur-lg
            sm:px-4
          "
        >
          <div className="flex min-w-0 items-center gap-2">
            {/* Mobile sidebar button */}

            <button
              type="button"
              onClick={() =>
                setSidebarOpen(
                  (open) => !open
                )
              }
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-white/10
                bg-white/5
                text-gray-300
                transition
                hover:bg-white/10
                hover:text-white
                md:hidden
              "
              aria-label="Toggle AI sidebar"
            >
              <Menu size={18} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles
                  size={16}
                  className="shrink-0 text-emerald-400"
                />

                <h1
                  className="
                    truncate
                    text-sm
                    font-bold
                    text-white
                  "
                >
                  {hasConversation
                    ? chatTitle
                    : "RevelaAI"}
                </h1>
              </div>

              <p
                className="
                  hidden
                  truncate
                  text-[10px]
                  text-gray-500
                  sm:block
                "
              >
                Intelligent assistant
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div
              className="
                hidden
                items-center
                gap-1.5
                rounded-full
                border
                border-emerald-500/20
                bg-emerald-500/10
                px-2.5
                py-1.5
                text-[10px]
                font-bold
                text-emerald-300
                sm:flex
              "
            >
              <ShieldCheck size={12} />
              AI READY
            </div>

            <button
              type="button"
              onClick={
                startNewChat
              }
              className="
                hidden
                items-center
                gap-2
                rounded-xl
                border
                border-white/10
                bg-white/5
                px-3
                py-2
                text-xs
                font-bold
                text-gray-300
                transition
                hover:bg-white/10
                hover:text-white
                sm:inline-flex
              "
            >
              <MessageSquarePlus
                size={14}
              />
              New Chat
            </button>
          </div>
        </header>

        {/* =================================================
            WORKSPACE BODY
        ================================================= */}

        {!hasConversation ? (
          /* =================================================
             WELCOME MODE
          ================================================= */

          <section
            className="
              relative
              min-h-0
              flex-1
              overflow-y-auto
              overscroll-contain
            "
          >
            <div
              className="
                flex
                min-h-full
                w-full
                items-center
                justify-center
                px-4
                py-8
                sm:px-6
                sm:py-10
              "
            >
              <div
                className="
                  flex
                  w-full
                  max-w-3xl
                  flex-col
                  items-center
                  justify-center
                "
              >
                {/* Welcome */}

                <WelcomeScreen
                  onSuggestion={sendTextMessage}
                />

                {/* Welcome composer */}

                <div
                  className="
                    mt-8
                    w-full
                    max-w-3xl
                  "
                >
                  <InputBar
                    centered
                    onSend={
                      sendTextMessage
                    }
                    onMic={
                      openVoice
                    }
                  />
                </div>

                {/* Small capability note */}

                <p
                  className="
                    mt-4
                    text-center
                    text-[10px]
                    leading-5
                    text-gray-500
                    sm:text-xs
                  "
                >
                  Ask about Scripture,
                  prophecy, coding,
                  education, business,
                  agriculture, or general
                  knowledge.
                </p>
              </div>
            </div>
          </section>
        ) : (
          /* =================================================
             CONVERSATION MODE
          ================================================= */

          <section
            className="
              flex
              min-h-0
              flex-1
              flex-col
              overflow-hidden
            "
          >
            {/* Messages */}

            <div
              className="
                min-h-0
                flex-1
                overflow-y-auto
                overscroll-contain
              "
            >
              <ChatWindow
                messages={
                  messages
                }
              />
            </div>

            {/* Conversation composer */}

            <div
              className="
                shrink-0
                border-t
                border-white/10
                bg-revela-dark/95
                px-3
                pb-3
                pt-3
                backdrop-blur-lg
                sm:px-4
                sm:pb-4
              "
            >
              <div className="mx-auto w-full max-w-4xl">
                <InputBar
                  onSend={
                    sendTextMessage
                  }
                  onMic={
                    openVoice
                  }
                />
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ===================================================
          VOICE CHAT
      =================================================== */}

      {voiceActive && (
        <RevelaAIVoiceChat
          onVoiceResult={
            handleVoiceResult
          }
          onClose={
            closeVoice
          }
        />
      )}

      {/* ===================================================
          OPTIONAL GLOBAL AI OPEN HANDLER
      =================================================== */}

      {onOpenAI && (
        <span className="sr-only">
          RevelaAI workspace active
        </span>
      )}
    </div>
  );
}
