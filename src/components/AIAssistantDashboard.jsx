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
import { analyzeLocalImageForChat, analyzeLocalVideoForChat, recordConversationTurn, recordLocalDiagnostic } from "@/ai/v2-free/livingBrain";

// Reuse the existing RevelaCode session token for authenticated AI requests.
// No token is ever copied into chat content or logged.
const getRevelaCodeAuthHeaders = () => {
  if (typeof window === "undefined") return {};
  try {
    const token =
      localStorage.getItem("revelacode_access_token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");
    if (!token) return {};
    const tokenType = localStorage.getItem("revelacode_token_type") || "Bearer";
    return { Authorization: `${tokenType} ${token}` };
  } catch {
    return {};
  }
};

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
    .filter((message) => message.role === "user" || message.role === "assistant")
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

  // The backend owns specialist routing. The UI never pins a conversation to one hub.
  const activeBrainHub = "auto";
  const activeBrainHubLabel = "Adaptive intelligence";
  const hubInputPlaceholder = "Ask RevelaAI anything — it will choose the right expertise...";

  const [
    storageReady,
    setStorageReady,
  ] = useState(false);

  const controllerRef =
    useRef(null);

  // Prevent rapid repeated submissions from creating duplicate user/assistant turns.
  const sendLockRef = useRef(false);

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
        .filter(Boolean)
        // Discard the stale synthetic conversation created by the old network-error UI.
        .filter((chat) => !/^failed to fetch$/i.test(String(chat.title || "").trim()));

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
     LOAD DURABLE REVELAAI CONVERSATION HISTORY
     -------------------------------------------------------
     The authoritative conversation store belongs to RevelaAI.
     A history outage must never create a fake conversation or
     replace the locally saved chats with an error row.
  ======================================================= */

  useEffect(() => {
    if (!isReady || isGuest || !userScope || userScope === "anonymous" || typeof window === "undefined") {
      return undefined;
    }

    const token =
      localStorage.getItem("revelacode_access_token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");
    if (!token) return undefined;

    const controller = new AbortController();
    const apiBase = (import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com").replace(/\/$/, "");
    const identity = String(user?.user_id || user?.userId || userScope);

    fetch(`${apiBase}/api/memory/${encodeURIComponent(identity)}/history?hub=${encodeURIComponent(activeBrainHub)}`, {
      method: "GET",
      headers: {
        Authorization: `${localStorage.getItem("revelacode_token_type") || "Bearer"} ${token}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((payload) => {
        const records = Array.isArray(payload?.data) ? payload.data : [];
        if (!records.length) return;

        const remoteChats = records.map((record) => {
          const rawMessages = Array.isArray(record?.messages) ? record.messages : [];
          const normalizedMessages = rawMessages.map((item, index) => ({
            id: String(item?.id || item?._id || `${record?._id || "remote"}-${index}`),
            role: item?.role === "assistant" ? "assistant" : "user",
            text: String(item?.content || item?.text || ""),
            status: "done",
            createdAt: item?.createdAt || item?.created_at || record?.updatedAt || Date.now(),
          })).filter((item) => item.text.trim());

          if (!normalizedMessages.length) return null;
          const firstUser = normalizedMessages.find((item) => item.role === "user");
          const title = String(record?.title || firstUser?.text || "Conversation").trim();
          if (/^failed to fetch$/i.test(title)) return null;
          return normalizeChat({
            id: String(record?.id || record?._id || ""),
            title: title.slice(0, 35),
            messages: normalizedMessages,
            createdAt: record?.createdAt || record?.created_at || Date.now(),
            updatedAt: record?.updatedAt || record?.updated_at || Date.now(),
          });
        }).filter(Boolean);

        if (!remoteChats.length) return;
        setChats((current) => {
          const byId = new Map(current.map((chat) => [chat.id, chat]));
          for (const remoteChat of remoteChats) {
            if (!byId.has(remoteChat.id)) byId.set(remoteChat.id, remoteChat);
          }
          return Array.from(byId.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        });
      })
      .catch((error) => {
        if (error?.name !== "AbortError") {
          // Keep local history visible; never show "Failed to fetch" as a conversation.
          console.warn("RevelaAI conversation history unavailable; using local history.");
        }
      });

    return () => controller.abort();
  }, [isReady, isGuest, userScope, user?.user_id, user?.userId, activeBrainHub]);

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
        attachedFile = null,
        inputMeta = null
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

        if (sendLockRef.current) {
          return;
        }
        sendLockRef.current = true;

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

        const lastAssistantText = [...currentMessages]
          .reverse()
          .find((item) => item.role === "assistant")?.text || "";
        const priorImageRequest = currentMessages
          .slice(-8)
          .some((item) => item.role === "user" &&
            /(?:generate|create|make|draw|show).{0,40}image|image.{0,40}(?:generate|create|draw)|describe.{0,25}image/i.test(item.text || ""));
        const assistantAwaitingImage =
          /what (?:kind|type) of image.*(?:generate|create)|describe.*image.*(?:generate|create)|what would you like.*image/i.test(lastAssistantText);
        const imageDescriptionFollowup =
          !attachedFile && Boolean(cleaned) && assistantAwaitingImage && priorImageRequest;

        const requestMessage =
          attachedFile
            ? cleaned
            : enrichPrompt(
                imageDescriptionFollowup
                  ? `Generate an image of: ${cleaned}`
                  : cleaned
              );

        try {
          /*
           * Local-first global brain: specialist routing, memory and visual math
           * stay on-device. Model / asset failures degrade to pixel math or text.
           */
          let localText = "";
          let localType = "text";
          let localImageUrls = [];
          let localSources = [];
          let brainMetadata = {};
          const routed = { hub: "general", hubLabel: "General" };
          brainMetadata = {
            hub: "general",
            hubLabel: "Adaptive intelligence",
            engine: "awaiting-revelaai-server",
            network: false,
            networkUsed: false,
          };

          if (attachedFile) {
            if (attachedFile.type?.startsWith("image/")) {
              const result = inputMeta?.vision || await analyzeLocalImageForChat(attachedFile, cleaned || "Describe this image");
              const objectLine = result.objects?.length
                ? "Local object labels: " + result.objects.map((item) => item.class + (item.score ? " (" + Math.round(item.score * 100) + "%)" : "")).join(", ")
                : "";
              const textLine = result.text ? "Text read on device: " + result.text : "";
              const visionDescription = String(inputMeta?.visionDescription || result.visionDescription || "").trim();
              localText = [
                cleaned ? "Your question: " + cleaned : "Image analysis (on-device)",
                visionDescription,
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
          }

          // Interpret free on-device perception with the existing text provider.
          // The image itself is not uploaded to a paid vision provider.
          if (attachedFile && localText && !attachedFile.type?.startsWith("video/")) {
            const apiBase = (import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com").replace(/\/$/, "");
            const tokenHeaders = getRevelaCodeAuthHeaders();
            if (Object.keys(tokenHeaders).length) {
              try {
                const perceptionResponse = await fetch(`${apiBase}/ai`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", ...tokenHeaders },
                  signal: controller.signal,
                  body: JSON.stringify({
                    message: cleaned || (attachedFile.type?.startsWith("image/")
                      ? "Interpret the image using only the local perception findings below. State limitations clearly."
                      : "Analyze the document using only the extracted content below."),
                    user_id: String(user?.id || user?.user_id || user?.userId || ""),
                    userId: String(user?.id || user?.user_id || user?.userId || ""),
                    hub: "auto",
                    sessionId: String(chatId || activeChatId || ""),
                    conversationId: String(chatId || activeChatId || ""),
                    visionDescription: attachedFile.type?.startsWith("image/") ? localText : null,
                    context: [
                      { role: "system", content: "These are free on-device perception findings, not direct model vision. Treat them as incomplete. Never claim to have seen details not present in the findings." },
                      { role: "user", content: localText },
                    ],
                  }),
                });
                const perceptionPayload = await perceptionResponse.json().catch(() => null);
                const perceptionData = perceptionPayload?.data || perceptionPayload || {};
                const interpreted = perceptionData.response || perceptionData.content || perceptionData.answer || perceptionData.text || perceptionPayload?.response || perceptionPayload?.answer;
                if (perceptionResponse.ok && typeof interpreted === "string" && interpreted.trim()) {
                  localText = interpreted.trim();
                  localType = "text";
                  localSources = Array.isArray(perceptionPayload?.sources) ? perceptionPayload.sources : [];
                  brainMetadata = {
                    ...brainMetadata,
                    ...(perceptionPayload?.meta || {}),
                    engine: perceptionPayload?.meta?.model || perceptionPayload?.meta?.provider || "revelaai-text-over-local-perception",
                    network: true,
                    networkUsed: true,
                    memory: "server",
                  };
                }
              } catch (perceptionError) {
                if (perceptionError?.name === "AbortError") throw perceptionError;
                await recordLocalDiagnostic("perception-text-interpretation", perceptionError);
              }
            }
          } else if (!attachedFile) {
            // Normal text chat must use the server-side generative model.
            // Never substitute the local rule engine when the service is unavailable.
            const apiBase = (import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com").replace(/\/$/, "");
            let response;
            try {
              response = await fetch(`${apiBase}/ai`, {
                method: "POST",
                headers: {
                "Content-Type": "application/json",
                ...getRevelaCodeAuthHeaders(),
                ...(/^[a-f\d]{24}$/i.test(String(userScope || "")) ? { userId: String(userScope) } : {}),
              },
                signal: controller.signal,
                body: JSON.stringify({
                  message: requestMessage || cleaned,
                  user_id: String(userScope || ""),
                  userId: String(userScope || ""),
                  hub: "auto",
                  sessionId: String(chatId || activeChatId || ""),
                  conversationId: String(chatId || activeChatId || ""),
                  visionDescription: null,
                  context: currentMessages.filter((item) => item.role === "user" || item.role === "assistant").slice(-12).map((item) => ({
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

            const imagePayload = payload?.data || payload || {};
            const remoteImageUrls = Array.isArray(imagePayload?.urls)
              ? imagePayload.urls.filter((url) => /^https?:\/\//i.test(String(url || "")))
              : [];
            const remoteText =
              imagePayload?.response ||
              imagePayload?.content ||
              imagePayload?.answer ||
              imagePayload?.text ||
              payload?.response ||
              payload?.answer ||
              payload?.content ||
              payload?.message;

            if (remoteImageUrls.length) {
              localImageUrls = remoteImageUrls;
              localText = String(remoteText || "Image generated successfully.").trim();
              localType = "image";
              localSources = Array.isArray(payload?.sources) ? payload.sources : [];
            } else {
              if (typeof remoteText !== "string" || !remoteText.trim()) {
                throw new Error("RevelaAI is waking up, please wait 20 seconds...");
              }
              localText = remoteText.trim();
              localType = "text";
              localSources = Array.isArray(payload?.sources) ? payload.sources : [];
            }

            brainMetadata = {
              ...brainMetadata,
              ...(payload?.meta || {}),
              // The /ai endpoint returns hub routing fields inside data, not
              // consistently inside meta. Preserve the server's decision so
              // the response badge reflects the brain that actually answered.
              hub: imagePayload?.hub_used || imagePayload?.hub || imagePayload?.domain || payload?.meta?.hub || brainMetadata.hub,
              hub_used: imagePayload?.hub_used || imagePayload?.hubUsed || payload?.meta?.hub_used,
              hub_requested: imagePayload?.hub_requested || imagePayload?.hubRequested || payload?.meta?.hub_requested,
              hub_detected: imagePayload?.hub_detected || imagePayload?.hubDetected || payload?.meta?.hub_detected,
              hubLabel: imagePayload?.hubLabel || payload?.meta?.hubLabel,
              engine: imagePayload?.model || imagePayload?.provider || payload?.meta?.model || payload?.meta?.provider || "revelaai-server",
              network: true,
              networkUsed: true,
              memory: "server",
            };
          }

          // Let the existing text model reason over on-device image/video observations.
          // Raw camera media stays on-device; only the derived observation text is sent.
          if (
            attachedFile &&
            (attachedFile.type?.startsWith("image/") || attachedFile.type?.startsWith("video/")) &&
            localText
          ) {
            const observations = localText;
            const apiBase = (import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com").replace(/\/$/, "");
            try {
              const visionResponse = await fetch(`${apiBase}/ai`, {
                method: "POST",
                headers: {
                "Content-Type": "application/json",
                ...getRevelaCodeAuthHeaders(),
                ...(/^[a-f\d]{24}$/i.test(String(userScope || "")) ? { userId: String(userScope) } : {}),
              },
                signal: controller.signal,
                body: JSON.stringify({
                  message: cleaned || "Analyze the attached media using the available observations.",
                  user_id: String(userScope || ""),
                  userId: String(userScope || ""),
                  hub: "auto",
                  sessionId: String(chatId || activeChatId || ""),
                  conversationId: String(chatId || activeChatId || ""),
                  visionDescription: observations.slice(0, 7000),
                  context: currentMessages.filter((item) => item.role === "user" || item.role === "assistant").slice(-10).map((item) => ({
                    role: item.role === "assistant" ? "assistant" : "user",
                    content: item.text || "",
                  })),
                }),
              });
              const visionPayload = await visionResponse.json().catch(() => null);
              const visionData = visionPayload?.data || visionPayload || {};
              const visionReply = visionData?.response || visionData?.content || visionData?.answer || visionData?.text || visionPayload?.message;
              if (!visionResponse.ok || typeof visionReply !== "string" || !visionReply.trim()) {
                throw new Error("Vision reasoning service returned no usable answer.");
              }
              localText = visionReply.trim() + "\n\nOn-device observations:\n" + observations;
              localType = "vision-chat";
              brainMetadata = {
                ...brainMetadata,
                ...(visionPayload?.meta || {}),
                hub: visionData?.hub_used || visionData?.hub || visionData?.domain || visionPayload?.meta?.hub || brainMetadata.hub,
                hub_used: visionData?.hub_used || visionData?.hubUsed || visionPayload?.meta?.hub_used,
                hub_requested: visionData?.hub_requested || visionData?.hubRequested || visionPayload?.meta?.hub_requested,
                hub_detected: visionData?.hub_detected || visionData?.hubDetected || visionPayload?.meta?.hub_detected,
                hubLabel: visionData?.hubLabel || visionPayload?.meta?.hubLabel,
                engine: visionData?.model || visionData?.provider || "revelaai-vision-context-adapter",
                network: true,
                networkUsed: true,
                visionUsed: true,
                selfHealed: false,
                memory: "server",
              };
            } catch (visionError) {
              if (visionError?.name === "AbortError") throw visionError;
              // Self-heal: retain the local result instead of failing the whole chat.
              brainMetadata = {
                ...brainMetadata,
                network: false,
                networkUsed: false,
                visionUsed: true,
                selfHealed: true,
                visionFallback: true,
              };
              localText = observations + "\n\nThe text reasoning service was unavailable, so I kept the on-device analysis rather than failing this turn.";
              await recordLocalDiagnostic("vision-text-reasoning", visionError);
            }
          }

          const normalized = {
            text: localText || "I couldn't complete that analysis. Please try again.",
            imageUrls: localImageUrls,
            sources: localSources,
            metadata: {
              ...brainMetadata,
              hub: brainMetadata.hub_used || brainMetadata.hub || routed.hub || activeBrainHub || "general",
              hubRequested: brainMetadata.hub_requested || brainMetadata.hubRequested || "auto",
              hubDetected: brainMetadata.hub_detected || brainMetadata.hubDetected || brainMetadata.hub_used || brainMetadata.hub || routed.hub || "general",
              hubLabel: brainMetadata.hubLabel || "General",
              network: Boolean(brainMetadata.networkUsed),
              networkUsed: Boolean(brainMetadata.networkUsed),
              memory: brainMetadata.memory || "local-only",
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
            hub: normalized.metadata?.hub || "auto",
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

              // Keep the originating request with the answer so export format
              // can be selected from the user's intent instead of guessing from
              // the answer alone.
              sourcePrompt:
                userDisplayText,

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

          const isNetworkFailure =
            error instanceof TypeError ||
            /failed to fetch|networkerror|load failed/i.test(String(error?.message || ""));
          const visibleError = isNetworkFailure
            ? "RevelaAI is waking up, please wait 20 seconds..."
            : (error?.message || "Request failed. Please try again.");

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

                          text: visibleError,

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
          sendLockRef.current = false;
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
        user,
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
        const priorAssistantText = [...history]
          .reverse()
          .find((item) => item.role === "assistant")?.text || "";
        const priorImageRequest = history
          .slice(-8)
          .some((item) => item.role === "user" &&
            /(?:generate|create|make|draw|show).{0,40}image|image.{0,40}(?:generate|create|draw)|describe.{0,25}image/i.test(item.text || ""));
        const isImageFollowup =
          /what (?:kind|type) of image.*(?:generate|create)|describe.*image.*(?:generate|create)|what would you like.*image/i.test(priorAssistantText) &&
          priorImageRequest;
        const regenerateMessage = isImageFollowup
          ? `Generate an image of: ${userMessage.text}`
          : userMessage.text;

        const apiBase = (import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com").replace(/\/$/, "");
        const response = await fetch(`${apiBase}/ai`, {
          method: "POST",
          headers: {
                "Content-Type": "application/json",
                ...getRevelaCodeAuthHeaders(),
                ...(/^[a-f\d]{24}$/i.test(String(userScope || "")) ? { userId: String(userScope) } : {}),
              },
          signal: controller.signal,
          body: JSON.stringify({
            message: regenerateMessage,
            user_id: String(userScope || ""),
            userId: String(userScope || ""),
            hub: "auto",
            sessionId: String(chatId || activeChatId || ""),
            conversationId: String(chatId || activeChatId || ""),
            context: history.filter((item) => item.role === "user" || item.role === "assistant").slice(-12).map((item) => ({
              role: item.role === "assistant" ? "assistant" : "user",
              content: item.text || "",
            })),
          }),
        });

        let payload = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!response.ok) {
          throw new Error(
            response.status === 502 || response.status === 503 || response.status === 504
              ? "RevelaAI is waking up, please wait 20 seconds..."
              : (payload?.message || payload?.error?.message || "RevelaAI could not regenerate the response. Please try again.")
          );
        }

        const resultData = payload?.data || payload || {};
        const imageUrls = Array.isArray(resultData?.urls)
          ? resultData.urls.filter((url) => /^https?:\/\//i.test(String(url || "")))
          : [];
        const responseText =
          resultData?.response || resultData?.content || resultData?.answer ||
          resultData?.text || payload?.response || payload?.answer ||
          payload?.content || payload?.message;

        if (!imageUrls.length && (typeof responseText !== "string" || !responseText.trim())) {
          throw new Error("RevelaAI is waking up, please wait 20 seconds...");
        }

        const normalized = {
          text: String(responseText || (imageUrls.length ? "Image generated successfully." : "")).trim(),
          imageUrls,
          sources: Array.isArray(payload?.sources) ? payload.sources : [],
          metadata: {
            ...(payload?.meta || {}),
            hub: resultData?.hub_used || resultData?.hub || resultData?.domain || payload?.meta?.hub,
            hub_used: resultData?.hub_used || resultData?.hubUsed || payload?.meta?.hub_used,
            hub_requested: resultData?.hub_requested || resultData?.hubRequested || payload?.meta?.hub_requested,
            hub_detected: resultData?.hub_detected || resultData?.hubDetected || payload?.meta?.hub_detected,
            hubLabel: resultData?.hubLabel || payload?.meta?.hubLabel,
            engine: resultData?.model || resultData?.provider || payload?.meta?.model || payload?.meta?.provider || "revelaai-server",
            network: true,
            networkUsed: true,
            memory: "server",
          },
          type: imageUrls.length ? "image" : "text",
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

        const isNetworkFailure =
          error instanceof TypeError ||
          /failed to fetch|networkerror|load failed/i.test(String(error?.message || ""));
        const visibleError = isNetworkFailure
          ? "RevelaAI is waking up, please wait 20 seconds..."
          : (error?.message || "Request failed. Please try again.");

        const updated = loadingMessages.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                text: visibleError,
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
    [activeChatId, regenerableId, messages, updateChat, hubContext, userScope, activeBrainHub]
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
                  truncate
                  text-[10px]
                  text-gray-500
                  dark:text-gray-500
                  sm:block
                "
              >
                {activeBrainHubLabel}
                {compactMode ? " · Personalized for " + activeHubLabel : " · RevelaCode assistant"}
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
              AUTO ROUTING ACTIVE
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
                <WelcomeScreen onSuggestion={sendTextMessage} />

                <div
                  className="
                    mt-8
                    w-full
                    max-w-3xl
                  "
                >
                  <InputBar
                    centered
                    placeholder={hubInputPlaceholder}
                    onSend={sendMessage}
                    onMic={openVoice}
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
                <div className="mt-3">
                <InputBar
                  placeholder={hubInputPlaceholder}
                  onSend={sendMessage}
                  onMic={openVoice}
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
          hub="auto"
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
