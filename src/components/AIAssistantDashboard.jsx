// src/ai/AIAssistantDashboard.jsx

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
import { useAuth } from "@/context/AuthContext";

/* =========================================================
   CONSTANTS
========================================================= */

const REVELAAI_URL = (
  import.meta.env.VITE_REVELAAI_URL || ""
)
  .trim()
  .replace(/\/+$/, "");

const LEGACY_STORAGE_KEY = "revela_chats";

/* =========================================================
   MESSAGE FACTORY
========================================================= */

const createMessage = (
  role,
  text,
  status = "done",
  extra = {}
) => ({
  id:
    typeof crypto !== "undefined" &&
    crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,

  role,
  text: String(text || ""),

  status,

  createdAt: Date.now(),

  ...extra,
});

/* =========================================================
   STORAGE
========================================================= */

const getScopedStorageKey = (
  userScope
) => {
  const normalized =
    String(userScope || "guest").trim() ||
    "guest";

  return `revela_chats:${encodeURIComponent(
    normalized
  )}`;
};

const loadSavedChats = (
  storageKey
) => {
  if (
    typeof window === "undefined"
  ) {
    return [];
  }

  try {
    const saved =
      localStorage.getItem(
        storageKey
      );

    if (!saved) {
      return [];
    }

    const parsed =
      JSON.parse(saved);

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
        storageKey
      );
    } catch {
      // Ignore local cleanup failure.
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
  if (!chat || !chat.id) {
    return null;
  }

  const messages =
    Array.isArray(
      chat.messages
    )
      ? chat.messages
      : [];

  return {
    id: String(chat.id),

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
   CONTEXT BUILDER
========================================================= */

const buildContext = (
  messages
) => {
  return messages
    .slice(-12)
    .map((message) => {
      const role =
        message.role === "user"
          ? "User"
          : "Assistant";

      let content =
        message.text || "";

      if (
        message.attachmentName
      ) {
        content =
          `[Attachment: ${message.attachmentName}] ` +
          content;
      }

      return `${role}: ${content}`;
    })
    .join("\n");
};

/* =========================================================
   OPTIONAL PROMPT ENRICHMENT
   ---------------------------------------------------------
   Keep this light. The backend owns canonical intent
   detection. We only preserve lightweight context markers
   for compatibility with the current ecosystem.
========================================================= */

const enrichPrompt = (
  text
) => {
  const lower =
    String(text || "")
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
    lower.includes("666")
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
   SAFE URL
========================================================= */

const isSafeHttpUrl = (
  value
) => {
  return /^https?:\/\//i.test(
    String(value || "").trim()
  );
};

/* =========================================================
   AI RESPONSE NORMALIZATION
========================================================= */

const normalizeAIResponse = (
  data
) => {
  const payload =
    data?.data || {};

  const isImage =
    payload?.type === "image";

  const imageUrls =
    isImage &&
    Array.isArray(
      payload?.urls
    )
      ? payload.urls.filter(
          isSafeHttpUrl
        )
      : [];

  const assistantText =
    payload?.content ||
    data?.content ||
    data?.response ||
    (isImage
      ? "Image generated successfully."
      : "No response from RevelaAI.");

  const sources = Array.isArray(
    data?.sources
  )
    ? data.sources
    : Array.isArray(
        data?.meta?.sources
      )
      ? data.meta.sources
      : [];

  return {
    text: String(
      assistantText || ""
    ).trim(),

    imageUrls,

    sources,

    metadata:
      data?.meta || {},

    type:
      payload?.type ||
      "text",
  };
};

/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function AIAssistantDashboard({
  onOpenAI,
}) {
  const {
    user,
    isGuest,
    isReady,
    authFetch,
  } = useAuth();

  /*
   * Prefer the authoritative Mongo/RevelaCode user ID.
   * Contact is only a browser-storage fallback for older
   * login payloads that did not yet expose an ID.
   */
  const userScope =
    user?.id ||
    user?.user_id ||
    user?.contact ||
    (isGuest
      ? "guest"
      : "anonymous");

  const storageKey = useMemo(
    () =>
      getScopedStorageKey(
        userScope
      ),
    [userScope]
  );

  const [messages, setMessages] =
    useState([]);

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [chats, setChats] =
    useState([]);

  const [activeChatId, setActiveChatId] =
    useState(null);

  const [voiceActive, setVoiceActive] =
    useState(false);

  const [
    storageReady,
    setStorageReady,
  ] = useState(false);

  const controllerRef =
    useRef(null);

  /* =======================================================
     LOAD USER-SCOPED CHATS
  ======================================================= */

  useEffect(() => {
    if (!isReady) {
      return;
    }

    setStorageReady(false);

    const restored =
      loadSavedChats(
        storageKey
      )
        .map(normalizeChat)
        .filter(Boolean);

    setChats(restored);

    /*
     * Switching accounts must never carry the previous
     * account's active chat in React state.
     */
    setActiveChatId(null);
    setMessages([]);

    setStorageReady(true);
  }, [
    isReady,
    storageKey,
  ]);

  /* =======================================================
     PERSIST USER-SCOPED CHATS
  ======================================================= */

  useEffect(() => {
    if (
      !storageReady ||
      typeof window === "undefined"
    ) {
      return;
    }

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(chats)
      );
    } catch (error) {
      console.error(
        "❌ Failed to save RevelaAI chats:",
        error
      );
    }
  }, [
    chats,
    storageKey,
    storageReady,
  ]);

  /* =======================================================
     REMOVE OLD GLOBAL CHAT STORAGE
     -------------------------------------------------------
     We deliberately do NOT migrate the old global key.
     Migrating it automatically could expose Account A's
     previous browser chats to Account B on the same device.
  ======================================================= */

  useEffect(() => {
    if (
      !isReady ||
      typeof window === "undefined"
    ) {
      return;
    }

    /*
     * Leave the legacy key untouched for one release so
     * users can still recover it manually if needed.
     *
     * The active application no longer reads from it.
     */
    void LEGACY_STORAGE_KEY;
  }, [isReady]);

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
          chat.id ===
          activeChatId
      ) || null
    );
  }, [
    activeChatId,
    chats,
  ]);

  /* =======================================================
     START NEW CHAT
  ======================================================= */

  const startNewChat =
    useCallback(() => {
      const newId =
        typeof crypto !== "undefined" &&
        crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      const newChat =
        normalizeChat({
          id: newId,

          title:
            "New Conversation",

          messages: [],

          createdAt:
            Date.now(),

          updatedAt:
            Date.now(),
        });

      setChats(
        (previous) => [
          newChat,
          ...previous,
        ]
      );

      setActiveChatId(
        newId
      );

      setMessages([]);

      setSidebarOpen(false);
    }, []);

  /* =======================================================
     SELECT CHAT
  ======================================================= */

  const selectChat =
    useCallback(
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

  const updateChat =
    useCallback(
      (
        chatId,
        nextMessages,
        nextTitle = null
      ) => {
        if (!chatId) {
          return;
        }

        setChats(
          (previous) =>
            previous.map(
              (chat) => {
                if (
                  chat.id !==
                  chatId
                ) {
                  return chat;
                }

                const firstUserMessage =
                  nextMessages.find(
                    (
                      message
                    ) =>
                      message.role ===
                      "user"
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

                  updatedAt:
                    Date.now(),
                };
              }
            )
        );
      },
      []
    );

  /* =======================================================
     ENSURE CHAT
  ======================================================= */

  const ensureActiveChat =
    useCallback(
      (
        initialTitle =
          "New Conversation"
      ) => {
        if (activeChatId) {
          return activeChatId;
        }

        const newId =
          typeof crypto !== "undefined" &&
          crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`;

        const newChat =
          normalizeChat({
            id: newId,

            title:
              String(
                initialTitle || ""
              )
                .trim()
                .slice(
                  0,
                  45
                ) ||
              "New Conversation",

            messages: [],

            createdAt:
              Date.now(),

            updatedAt:
              Date.now(),
          });

        setChats(
          (previous) => [
            newChat,
            ...previous,
          ]
        );

        setActiveChatId(
          newId
        );

        return newId;
      },
      [activeChatId]
    );

  /* =======================================================
     AI REQUEST
  ======================================================= */

  const callRevelaAI =
    useCallback(
      async ({
        message,
        context,
        file = null,
        sessionId,
        signal,
      }) => {
        if (!REVELAAI_URL) {
          throw new Error(
            "VITE_REVELAAI_URL is not configured."
          );
        }

        const headers = {
          "X-Session-ID":
            sessionId || "",
        };

        let body;

        /*
         * FILE UPLOAD
         *
         * Do NOT set Content-Type manually.
         * Browser must generate the multipart boundary.
         */
        if (file) {
          const formData =
            new FormData();

          formData.append(
            "file",
            file,
            file.name
          );

          if (message) {
            formData.append(
              "message",
              message
            );
          }

          if (context) {
            formData.append(
              "context",
              context
            );
          }

          body =
            formData;
        } else {
          headers[
            "Content-Type"
          ] =
            "application/json";

          body =
            JSON.stringify({
              message,
              context,
            });
        }

        const response =
          await authFetch(
            `${REVELAAI_URL}/ai`,
            {
              method: "POST",
              headers,
              body,
              signal,
            }
          );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.error?.message ||
              data?.message ||
              `AI request failed (HTTP ${response.status}).`
          );
        }

        return data;
      },
      [authFetch]
    );

  /* =======================================================
     SEND TEXT / FILE
  ======================================================= */

  const sendMessage =
    useCallback(
      async (
        text,
        attachedFile = null
      ) => {
        const cleaned =
          String(text || "")
            .trim();

        /*
         * A file can be sent without a typed prompt.
         */
        if (
          !cleaned &&
          !attachedFile
        ) {
          return;
        }

        const currentMessages =
          messages;

        const fallbackTitle =
          attachedFile?.name ||
          cleaned ||
          "New Conversation";

        const chatId =
          activeChatId ||
          ensureActiveChat(
            fallbackTitle
          );

        const userDisplayText =
          cleaned ||
          `Analyze ${attachedFile?.name || "this file"}`;

        const userMessage =
          createMessage(
            "user",
            userDisplayText,
            "done",
            {
              attachmentName:
                attachedFile?.name ||
                null,

              attachmentType:
                attachedFile?.type ||
                null,

              attachmentSize:
                attachedFile?.size ||
                null,
            }
          );

        const loadingId =
          typeof crypto !== "undefined" &&
          crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`;

        const loadingMessage =
          createMessage(
            "assistant",
            "Thinking…",
            "loading"
          );

        /*
         * Keep deterministic loading ID.
         */
        loadingMessage.id =
          loadingId;

        const nextMessages = [
          ...currentMessages,
          userMessage,
          loadingMessage,
        ];

        setMessages(
          nextMessages
        );

        updateChat(
          chatId,
          nextMessages,
          (
            cleaned ||
            attachedFile?.name ||
            ""
          )
            .trim()
            .slice(0, 45)
        );

        /*
         * Stop any older request.
         */
        controllerRef.current?.abort();

        const controller =
          new AbortController();

        controllerRef.current =
          controller;

        const context =
          buildContext(
            currentMessages
          );

        const requestMessage =
          attachedFile
            ? cleaned
            : enrichPrompt(
                cleaned
              );

        try {
          const data =
            await callRevelaAI({
              message:
                requestMessage,
              context,
              file:
                attachedFile,
              sessionId:
                chatId,
              signal:
                controller.signal,
            });

          const normalized =
            normalizeAIResponse(
              data
            );

          const assistantMessage =
            {
              id: loadingId,

              role: "assistant",

              text:
                normalized.text ||
                "RevelaAI returned an empty response.",

              status:
                "done",

              imageUrls:
                normalized.imageUrls,

              sources:
                normalized.sources,

              metadata:
                normalized.metadata,

              contentType:
                normalized.type,

              createdAt:
                Date.now(),
            };

          setMessages(
            (previous) => {
              const updated =
                previous.map(
                  (
                    message
                  ) =>
                    message.id ===
                    loadingId
                      ? assistantMessage
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
                  (
                    message
                  ) =>
                    message.id ===
                    loadingId
                      ? {
                          ...message,

                          text:
                            error?.message ||
                            "Request failed. Please try again.",

                          status:
                            "error",
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
     TEXT COMPATIBILITY HANDLER
  ======================================================= */

  const sendTextMessage =
    useCallback(
      (text) =>
        sendMessage(
          text,
          null
        ),
      [sendMessage]
    );

  /* =======================================================
     VOICE
  ======================================================= */

  const openVoice =
    useCallback(() => {
      const chatId =
        ensureActiveChat(
          "Voice Conversation"
        );

      /*
       * ensureActiveChat updates state immediately enough
       * for the next render where the modal receives the
       * correct session ID.
       */
      if (chatId) {
        setSidebarOpen(false);
        setVoiceActive(true);
      }
    }, [
      ensureActiveChat,
    ]);

  const closeVoice =
    useCallback(() => {
      setVoiceActive(false);
    }, []);

  const handleVoiceResult = useCallback(
  (result) => {
    if (!result) return;

    const heard = String(result.heard || "").trim();
    const response = String(result.response || "").trim();

    if (!heard && !response && !result.streamed) return;

    const chatId =
      activeChatId || ensureActiveChat(heard || "Voice Conversation");

    const userMessage = createMessage(
      "user",
      heard || "Voice message",
      "done",
      { inputType: "voice" }
    );

    const assistantMessage = createMessage(
      "assistant",
      response ||
        (result.streamed
          ? "🔊 Voice reply played."
          : "RevelaAI returned an empty voice response."),
      "done",
      {
        inputType: "voice",
        audioUrl: isSafeHttpUrl(result.audio_url) ? result.audio_url : null,
        voice: result.voice || null,
        metadata: result.meta || {},
        contentType: "voice",
      }
    );

    const updated = [...messages, userMessage, assistantMessage];

    setMessages(updated);

    updateChat(chatId, updated, (heard || "Voice Conversation").slice(0, 45));
    // The voice session stays open for the next turn.
  },
  [activeChatId, messages, ensureActiveChat, updateChat]
);

  /* =======================================================
     CONVERSATION STATE
  ======================================================= */

  const hasConversation =
    messages.some(
      (message) =>
        message.role ===
        "user"
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
            <button
              type="button"
              onClick={() =>
                setSidebarOpen(
                  (open) =>
                    !open
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
                RevelaCode intelligent assistant
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
                <WelcomeScreen
                  onSuggestion={
                    sendTextMessage
                  }
                />

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
                      sendMessage
                    }
                    onMic={
                      openVoice
                    }
                  />
                </div>

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
                  agriculture, documents,
                  images, or general knowledge.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section
            className="
              flex
              min-h-0
              flex-1
              flex-col
              overflow-hidden
            "
          >
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
                    sendMessage
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
          sessionId={
            activeChatId
          }
          onVoiceResult={
            handleVoiceResult
          }
          onClose={
            closeVoice
          }
        />
      )}

      {onOpenAI && (
        <span className="sr-only">
          RevelaAI workspace active
        </span>
      )}
    </div>
  );
}
