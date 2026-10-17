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
import { useAuth } from "@/context/AuthContext";
import RevelaAIVoiceChat from "@/ai/RevelaAIVoiceChat";
import { readLocalDocument } from "@/ai/v2-free/localIntelligence";
import LivingHubSelector from "@/ai/v2-free/LivingHubSelector";
import { composeLivingResponse, analyzeLocalImageForChat, analyzeLocalVideoForChat, getLocalBrainMemory, recordConversationTurn, recordLocalDiagnostic } from "@/ai/v2-free/livingBrain";

/* =========================================================
   CONSTANTS
========================================================= */

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
  activeHub = "home",
  compactMode = false,
}) {
  const {
    user,
    isGuest,
    isReady,
  } = useAuth();

  /*
   * Prefer the authoritative Mongo/RevelaCode user ID.
   * Contact is only a browser-storage fallback for older
   * login payloads that did not yet expose an ID.
   */
  const hubLabels = {
    home: "the RevelaCode home workspace",
    faith: "Faith & Scripture",
    bible: "Bible study",
    study: "study and learning",
    prophecy: "prophecy exploration",
    events: "faith events",
    referential: "reference resources",
    education: "Elimu education and school management",
    shamba: "Shamba farming and agriculture",
    biashara: "Biashara business operations",
    community: "Community, groups and opportunities",
    payments: "payments and wallet services",
    profile: "your account profile",
    settings: "preferences and settings",
  };
  const activeHubLabel =
    hubLabels[activeHub] || "the " + String(activeHub) + " workspace";
  const hubContext = [
    "ACTIVE REVELACODE WORKSPACE: " + activeHubLabel + ".",
    "PERSONALIZATION RULE: Tailor answers, examples, recommendations, and next steps to this workspace when relevant. If the user asks an unrelated question, answer it normally. Do not claim access to private workspace records unless those records are actually included in the request context.",
  ].join(" ");

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
    useState(!compactMode);

  const [chats, setChats] =
    useState([]);

  const [activeChatId, setActiveChatId] =
    useState(null);

  const [voiceActive, setVoiceActive] =
    useState(false);

  // Auto-routing is the default; users can pin a specialist hub per conversation.
  const [activeBrainHub, setActiveBrainHub] = useState("auto");

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
     LOCAL FREE RESPONSE ENGINE
  ======================================================= */

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

        const context = [
          hubContext,
          buildContext(currentMessages),
        ].filter(Boolean).join("\n\n");

        const requestMessage =
          attachedFile
            ? cleaned
            : enrichPrompt(
                cleaned
              );

        try {
          /*
           * Local-first global brain: specialist routing, memory and visual math
           * stay on-device. Model / asset failures degrade to pixel math or text.
           */
          let localText = "";
          let localType = "text";
          let brainMetadata = {};
          const fallbackPrompt = cleaned || (attachedFile ? "Analyze " + attachedFile.name : "");
          const localMemory = await getLocalBrainMemory(userScope);
          const routed = composeLivingResponse(fallbackPrompt, activeBrainHub, activeHub, localMemory);
          brainMetadata = {
            hub: routed.hub,
            hubLabel: routed.hubLabel,
            routeReason: routed.routeReason,
            emotionEstimate: routed.emotionEstimate,
            intent: routed.intent,
            engine: routed.engine,
            network: false,
            networkUsed: false,
          };

          if (attachedFile) {
            if (attachedFile.type?.startsWith("image/")) {
              const result = await analyzeLocalImageForChat(attachedFile, cleaned || "Describe this image");
              const objectLine = result.objects?.length
                ? "Local object labels: " + result.objects.map((item) => item.class + (item.score ? " (" + Math.round(item.score * 100) + "%)" : "")).join(", ")
                : "";
              const textLine = result.text ? "Text read on device: " + result.text : "";
              localText = [
                cleaned ? "Your question: " + cleaned : "Image analysis (on-device)",
                result.summary || result.description || "Basic pixel analysis completed.",
                objectLine,
                textLine,
                result.fallback ? "Fallback used: advanced local vision assets were unavailable; basic image math still ran." : "",
                "Note: brightness and edge measurements alone cannot prove object identity or scene meaning."
              ].filter(Boolean).join("\n\n");
              localType = "local-vision";
              brainMetadata = { ...brainMetadata, engine: result.engine || "pixel-math-fallback", visionFallback: Boolean(result.fallback) };
            } else if (attachedFile.type?.startsWith("video/")) {
              const result = await analyzeLocalVideoForChat(attachedFile);
              localText = [
                cleaned ? "Your question: " + cleaned : "Video frame analysis (on-device)",
                result.summary,
                result.frames?.length ? "Sampled frame timeline:\n" + result.frames.map((frame) =>
                  frame.time + "s — brightness " + frame.brightness +
                  ", edge activity " + frame.edgeActivity +
                  ", pixel change " + (frame.motionDifference ?? "n/a")
                ).join("\n") : "",
                "Note: this free fallback measures sampled frame changes; it does not claim semantic scene understanding or speech transcription."
              ].filter(Boolean).join("\n\n");
              localType = "local-video";
              brainMetadata = { ...brainMetadata, engine: result.engine || "local-video-frame-math", visionFallback: Boolean(result.fallback) };
            } else {
              try {
                const result = await readLocalDocument(attachedFile);
                localText = result.summary + "\n\nFrequent terms: " +
                  (result.keyTerms || []).map((item) => item[0] + " (" + item[1] + ")").join(", ") +
                  "\n\nExcerpt:\n" + (result.excerpt || "");
                localType = "local-document";
              } catch (fileError) {
                localText = "I couldn't parse this file format fully offline (" + attachedFile.name + "). Chat is still working. Paste the relevant text or export it as TXT, MD, CSV or JSON for local analysis.\n\nFile detail: " + String(fileError?.message || "Unsupported local parser");
                localType = "local-document-fallback";
                await recordLocalDiagnostic("document-analysis", fileError);
              }
            }
          } else {
            // Normal text chat must use the server-side generative model.
            // Never substitute the local rule engine when the service is unavailable.
            const apiBase = (import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com").replace(/\\/$/, "");
            let response;
            try {
              response = await fetch(`${apiBase}/ai`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                  message: requestMessage || cleaned,
                  user_id: String(userScope || ""),
                  context: currentMessages.slice(-12).map((item) => ({
                    role: item.role === "assistant" ? "assistant" : "user",
                    content: item.text || "",
                  })),
                }),
              });
            } catch (networkError) {
              if (networkError?.name === "AbortError") throw networkError;
              throw new Error("RevelaAI is waking up, please wait 20 seconds...");
            }

            let payload;
            try {
              payload = await response.json();
            } catch {
              payload = null;
            }

            if (!response.ok) {
              throw new Error(
                response.status === 502 || response.status === 503 || response.status === 504
                  ? "RevelaAI is waking up, please wait 20 seconds..."
                  : (payload?.message || payload?.error?.message || "RevelaAI could not complete the request. Please try again.")
              );
            }

            const remoteText =
              payload?.data?.response ||
              payload?.data?.content ||
              payload?.data?.answer ||
              payload?.data?.text ||
              payload?.response ||
              payload?.answer ||
              payload?.content ||
              payload?.message;

            if (typeof remoteText !== "string" || !remoteText.trim()) {
              throw new Error("RevelaAI is waking up, please wait 20 seconds...");
            }

            localText = remoteText.trim();
            localType = "text";
            brainMetadata = {
              ...brainMetadata,
              engine: payload?.meta?.model || payload?.meta?.provider || "revelaai-server",
              network: true,
              networkUsed: true,
              memory: "server",
            };
          }

          const normalized = {
            text: localText || "I couldn't complete that local analysis, but the chat is still available. Try again or provide the key details as text.",
            imageUrls: [],
            sources: [],
            metadata: {
              ...brainMetadata,
              network: false,
              networkUsed: false,
              memory: "local-only",
              version: "2.0",
            },
            type: localType,
          };

          // Lightweight typewriter streaming keeps rendering incremental on low-end phones.
          const streamText = normalized.text || "RevelaAI returned an empty response.";
          await new Promise((resolve) => {
            let cursor = 0;
            const tick = () => {
              cursor = Math.min(streamText.length, cursor + 6);
              setMessages((previous) => previous.map((message) =>
                message.id === loadingId
                  ? { ...message, text: streamText.slice(0, cursor), status: cursor >= streamText.length ? "done" : "loading" }
                  : message
              ));
              if (cursor < streamText.length) window.setTimeout(tick, 10);
              else resolve();
            };
            tick();
          });

          void recordConversationTurn({
            scope: userScope,
            userText: userDisplayText,
            assistantText: normalized.text,
            hub: normalized.metadata?.hub || activeBrainHub || "general",
            emotion: normalized.metadata?.emotionEstimate || "neutral",
          }).catch((memoryError) => recordLocalDiagnostic("conversation-memory", memoryError));

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
        hubContext,
        activeBrainHub,
        activeHub,
        userScope,
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
    void recordConversationTurn({
      scope: userScope,
      userText: heard || "Voice message",
      assistantText: response,
      hub: result.meta?.hub || activeBrainHub || "general",
      emotion: result.meta?.emotionEstimate || "neutral",
    }).catch((memoryError) => recordLocalDiagnostic("voice-memory", memoryError));
    // The voice session stays open for the next turn.
  },
  [activeChatId, messages, ensureActiveChat, updateChat, userScope, activeBrainHub]
);
    /* =======================================================
     REGENERABLE ANSWER
     Only the latest typed answer can be refreshed. Files and
     voice are excluded because they can't be resent.
  ======================================================= */

  const regenerableId = useMemo(() => {
    const last = messages[messages.length - 1];
    const prev = messages[messages.length - 2];

    if (!last || last.role !== "assistant" || last.status === "loading") return null;
    if (!prev || prev.role !== "user") return null;
    if (prev.attachmentName || prev.inputType === "voice") return null;

    return last.id;
  }, [messages]);

  /* =======================================================
     LIKE / DISLIKE
  ======================================================= */

  const handleFeedback = useCallback(
    (messageId, value) => {
      if (!activeChatId) return;

      const updated = messages.map((message) =>
        message.id === messageId
          ? { ...message, feedback: message.feedback === value ? null : value }
          : message
      );

      setMessages(updated);
      updateChat(activeChatId, updated);
    },
    [activeChatId, messages, updateChat]
  );

  /* =======================================================
     REFRESH ANSWER
  ======================================================= */

  const regenerateResponse = useCallback(
    async (assistantId) => {
      if (!activeChatId || assistantId !== regenerableId) return;

      const chatId = activeChatId;
      const index = messages.length - 1;
      const userMessage = messages[index - 1];
      const history = messages.slice(0, index - 1);

      const loadingMessages = messages.map((message) =>
        message.id === assistantId
          ? {
              ...message,
              text: "Thinking…",
              status: "loading",
              imageUrls: [],
              sources: [],
              feedback: null,
            }
          : message
      );

      setMessages(loadingMessages);
      updateChat(chatId, loadingMessages);

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const localText = answerLocally(
          enrichPrompt(userMessage.text),
          [hubContext, buildContext(history)].filter(Boolean).join("\n\n")
        );
        const normalized = {
          text: localText,
          imageUrls: [],
          sources: [],
          metadata: { engine: "local-free-rules", network: false },
          type: "text",
        };

        const updated = loadingMessages.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                text: normalized.text || "RevelaAI returned an empty response.",
                status: "done",
                imageUrls: normalized.imageUrls,
                sources: normalized.sources,
                metadata: normalized.metadata,
                contentType: normalized.type,
                createdAt: Date.now(),
              }
            : message
        );

        setMessages(updated);
        updateChat(chatId, updated);
      } catch (error) {
        if (error?.name === "AbortError") return;

        const updated = loadingMessages.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                text: error?.message || "Request failed. Please try again.",
                status: "error",
              }
            : message
        );

        setMessages(updated);
        updateChat(chatId, updated);
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null;
      }
    },
    [activeChatId, regenerableId, messages, updateChat, hubContext]
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
        bg-white
        text-gray-900
        dark:bg-revela-dark
        dark:text-white
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
        activeBrainHub={activeBrainHub}
        onBrainHubChange={setActiveBrainHub}
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
            border-gray-200
            bg-white/95
            px-3
            backdrop-blur-lg
            dark:border-white/10
            dark:bg-revela-dark/95
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
                  dark:text-gray-500
                  sm:block
                "
              >
                {compactMode
                  ? "Personalized for " + activeHubLabel
                  : "RevelaCode intelligent assistant"}
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
              LOCAL BRAIN READY
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
                  onSuggestion={sendTextMessage}
                  activeBrainHub={activeBrainHub}
                  onHubChange={setActiveBrainHub}
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
                messages={messages}
                regenerableId={regenerableId}
                onRegenerate={regenerateResponse}
                onFeedback={handleFeedback}
              />
            </div>

            <div
              className="
                shrink-0
                border-t
                border-gray-200
                bg-white/95
                px-3
                pb-3
                pt-3
                backdrop-blur-lg
                dark:border-white/10
                dark:bg-revela-dark/95
                sm:px-4
                sm:pb-4
              "
            >
              <div className="mx-auto w-full max-w-4xl">
                <LivingHubSelector value={activeBrainHub} onChange={setActiveBrainHub} compact />
                <div className="mt-3">
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
          hub={activeBrainHub}
          memoryScope={userScope}
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
