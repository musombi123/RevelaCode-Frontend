// src/ai/AIAssistantDashboard.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { App as CapacitorApp } from "@capacitor/app";
import { useLocation } from "react-router-dom";

import {
  Menu,
  Sparkles,
  ShieldCheck,
  MessageSquarePlus,
  Info,
  X,
  Mic,
  Camera,
  WifiOff,
  Pencil,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import InputBar from "@/components/InputBar";
import RevelaAIWorkspacePanel from "@/components/RevelaAIWorkspacePanel.jsx";
import { executeRevelaAIWorkspace } from "@/ai/revelaAIClient.js";
import WelcomeScreen from "@/components/WelcomeScreen";
import HumanizerWorkspace from "@/pages/HumanizerWorkspace";
import { useAuth } from "@/context/AuthContext";
import RevelaAIVoiceChat from "@/ai/RevelaAIVoiceChat";
import { answerLocally, readLocalDocument } from "@/ai/v2-free/localIntelligence";
import { analyzeLocalImageForChat, analyzeLocalVideoForChat, recordConversationTurn, recordLocalDiagnostic } from "@/ai/v2-free/livingBrain";

/* =========================================================
   CONSTANTS
========================================================= */

const LEGACY_STORAGE_KEY = "revela_chats";

/* =========================================================
   MESSAGE FACTORY
========================================================= */

// Remove internal routing traces if a provider accidentally includes them in prose.
const cleanAssistantAnswer = (value) =>
  String(value || "")
    // Strip internal router prefixes, including "Auto → General] ...", without
    // accidentally deleting ordinary prose that begins with "General".
    .replace(/^\s*(?:\[\s*)?auto\s*(?:→|->|›)\s*(?:general|faith|scripture|study|prophecy|elimu|education|shamba|mkulima|biashara|business|community|coding|code)\s*\]?\s*(?:[:—–-]\s*)?/i, "")
    .replace(/^\s*RevelaAI\s*[•|:]\s*(?:Auto\s*(?:→|->|›)\s*)?(?:General|Faith|Scripture|Study|Prophecy|Elimu|Education|Shamba|Mkulima|Biashara|Business|Community|Coding|Code)\s*\]?\s*/i, "")
    .replace(/^\s*\[\s*(?:General|Faith|Scripture|Study|Prophecy|Elimu|Education|Shamba|Mkulima|Biashara|Business|Community|Coding|Code)\s*\]\s*/i, "")
    .trim();

function readBrowserFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("The selected image could not be read."));
    reader.onerror = () => reject(new Error("The selected image could not be read."));
    reader.readAsDataURL(file);
  });
}

function inferWorkspaceCommand(prompt, attachedFile) {
  const text = String(prompt || "").toLowerCase();
  const imageAttached = Boolean(attachedFile?.type?.startsWith("image/"));
  if (/\b(official|formal|business|institutional)\b.{0,45}\b(letter|memo|proposal|submission|report|notice)\b|\b(create|draft|write|prepare|generate)\b.{0,50}\b(official letter|formal letter|memorandum|business letter|institutional proposal|word document|pdf report)\b/.test(text)) return "/doc";
  if (/\b(create|make|prepare|generate|build)\b.{0,45}\b(powerpoint|presentation|slide deck|slides)\b|\b(presentation|powerpoint|slide deck)\b/.test(text)) return "/deck";
  if (/\b(create|make|prepare|generate|build)\b.{0,45}\b(excel|spreadsheet|workbook|financial model|ledger template)\b/.test(text)) return "/sheet";
  if (/\b(analy[sz]e|profile|audit|summari[sz]e)\b.{0,55}\b(dataset|csv|spreadsheet data|table data|records)\b/.test(text) && attachedFile) return "/data";
  if (/\b(generate|write|create|build)\b.{0,45}\b(source code|python script|javascript|typescript|sql query|program|function|class)\b/.test(text)) return "/code";
  if (/\b(create|design|build|prototype|generate)\b.{0,45}\b(responsive (web|admin|dashboard|mobile)|website prototype|web app interface|ui prototype|dashboard interface|html interface)\b/.test(text)) return "/ui";
  if (/\b(create|generate|design|prepare)\b.{0,50}\b(marketing campaign|campaign kit|promotional poster|advertising flyer|brand promotion|social media campaign)\b/.test(text)) return "/promo";
  if (/\b(generate|create|draw|design)\b.{0,40}\b(image|illustration|logo|graphic)\b/.test(text) && !imageAttached) return "/image";
  return null;
}

function workspaceDownloadUrl(value) {
  if (typeof value === "string") return value;
  return value?.download_url || value?.url || null;
}

function buildWorkspaceArtifact(result, title, prompt) {
  const primary = workspaceDownloadUrl(result?.artifact || result?.document || result?.workbook);
  const imageUrl = result?.image?.url || result?.poster?.image?.url || null;
  const chartUrl = workspaceDownloadUrl(result?.chart);
  const previewUrl = workspaceDownloadUrl(result?.preview_file || result?.document_preview);
  const downloads = {};
  if (result?.image?.downloads && typeof result.image.downloads === "object") Object.assign(downloads, result.image.downloads);
  if (result?.poster?.downloads && typeof result.poster.downloads === "object") Object.assign(downloads, result.poster.downloads);
  (Array.isArray(result?.additional_files) ? result.additional_files : []).forEach((item, index) => {
    const url = workspaceDownloadUrl(item);
    if (url) downloads[String(item?.filename || "additional-file-" + (index + 1)).replace(/[^a-zA-Z0-9._-]/g, "-")] = url;
  });
  const campaign = result?.campaign;
  const summary = result?.analysis?.completeness_pct != null
    ? "Dataset analyzed: " + result.analysis.row_count + " rows, " + result.analysis.column_count + " columns, " + result.analysis.completeness_pct + "% completeness."
    : campaign?.headline || result?.design_brief?.headline || "";
  return {
    title: title || result?.title || "RevelaAI workspace output",
    description: result?.verification?.file_created ? "The backend created and verified the requested artifact." : "Generated by the unified RevelaAI workspace.",
    summary,
    download_url: primary || (imageUrl ? downloads.png || downloads.jpg || imageUrl : null),
    preview: result?.preview || null,
    preview_url: previewUrl,
    preview_text: result?.content || "",
    image_url: imageUrl,
    image_caption: campaign?.supporting_message || prompt || "Generated image",
    chart_url: chartUrl,
    downloads,
    analysis: result?.analysis || null,
    data: result?.analysis?.preview_rows || (Array.isArray(result?.analysis?.columns) ? result.analysis.columns.map((item) => ({
      column: item.column, type: item.type, non_empty: item.non_empty,
      missing: item.missing, missing_pct: item.missing_pct, unique: item.unique,
    })) : result?.data || []),
    code: result?.source_preview || result?.code || "",
    campaign: campaign || null,
    verification: result?.verification || null,
    source_prompt: prompt,
  };
}

async function datasetFromWorkspaceAttachment(file) {
  if (!file) return null;
  const name = String(file.name || "").toLowerCase();
  const text = await file.text();
  if (name.endsWith(".json") || file.type === "application/json") {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) || (parsed && typeof parsed === "object")) return parsed;
    throw new Error("The JSON dataset must contain row objects or a headers/rows table.");
  }
  if (name.endsWith(".csv") || file.type === "text/csv" || name.endsWith(".txt")) return text;
  throw new Error("The workspace data processor currently accepts CSV or JSON datasets. Export this file as CSV or JSON and upload it again.");
}

function workspaceImageOperations(mode, prompt) {
  const text = String(prompt || "").toLowerCase();
  if (/\b(remove|erase|replace|reconstruct|inpaint|change the background|background removal|object removal)\b/.test(text)) {
    throw new Error("That request needs semantic image editing (object removal or background reconstruction), which is not enabled in the configured editing pipeline. Basic enhancement and pixel operations are available.");
  }
  const operations = [];
  if (/\b(grayscale|greyscale|black and white|monochrome)\b/.test(text)) operations.push({ type: "grayscale" });
  if (/\b(brighten|make it lighter|increase brightness)\b/.test(text)) operations.push({ type: "brightness", factor: 1.12 });
  if (/\b(darken|make it darker|decrease brightness)\b/.test(text)) operations.push({ type: "brightness", factor: 0.88 });
  if (/\b(contrast)\b/.test(text)) operations.push({ type: "contrast", factor: 1.15 });
  if (/\b(sharpen|sharper)\b/.test(text)) operations.push({ type: "sharpness", factor: 1.2 });
  if (/\b(saturate|vibrant|vivid)\b/.test(text)) operations.push({ type: "saturation", factor: 1.15 });
  if (/\b(blur|soften)\b/.test(text)) operations.push({ type: "blur", radius: 1.5 });
  if (/\b(invert|negative)\b/.test(text)) operations.push({ type: "invert" });
  const rotate = text.match(/\brotate\s+(90|180|270|-90)\b/);
  if (rotate) operations.push({ type: "rotate", degrees: Number(rotate[1]) });
  if (/\bflip(?:\s+vertical)?\b/.test(text)) operations.push({ type: "flip", direction: /\bvertical\b/.test(text) ? "vertical" : "horizontal" });
  if (/\bcrop\b/.test(text)) operations.push({ type: "crop", left: 0.05, top: 0.05, right: 0.95, bottom: 0.95 });
  if (!operations.length && mode === "enhance") operations.push({ type: "contrast", factor: 1.1 }, { type: "sharpness", factor: 1.15 });
  if (!operations.length) throw new Error("Describe a supported edit such as brighten, contrast, sharpen, grayscale, rotate, flip, crop or blur. Semantic object removal needs a separate image-to-image provider.");
  return operations;
}

const ANSWER_STYLE_INSTRUCTION = [
  "Respond directly to the user's request in natural, helpful language.",
  "Do not prefix answers with routing labels such as 'Auto → General', hub names, or internal status tags.",
  "Do not use a generic greeting unless the user greeted you or the conversation calls for one.",
  "Use clear structure when useful; avoid filler and answer the actual question first.",
].join(" ");

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

const sanitizeAIResponseMetadata = (value) => {
  const responseMeta = value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
  delete responseMeta.core_mesh;
  delete responseMeta.coreMesh;
  delete responseMeta.usect_zero_tool;
  delete responseMeta.usectZeroTool;
  return responseMeta;
};

/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function AIAssistantDashboard({
  onOpenAI,
  activeHub = "home",
  compactMode = false,
  lessonContext = null,
  initialHandoff = null,
}) {
  const {
    user,
    isGuest,
    isReady,
    authFetch,
  } = useAuth();
  const location = useLocation();
  const [faithDraftText, setFaithDraftText] = useState("");
  const appliedFaithHandoffRef = useRef("");

  useEffect(() => {
    let handoff = initialHandoff || location.state?.faithAIHandoff || null;
    if (!handoff) {
      try {
        handoff = JSON.parse(sessionStorage.getItem("revelacode_faith_ai_handoff") || "null");
      } catch {
        handoff = null;
      }
    }
    if (!handoff) {
      try {
        const savedDraft = sessionStorage.getItem("revelacode_faith_ai_draft") || "";
        if (savedDraft) {
          setFaithDraftText(savedDraft);
          return;
        }
      } catch {
        // The active composer can still keep its own in-memory draft.
      }
    }
    const question = String(handoff?.question || "").trim();
    if (!question) return;
    const signature = question + "|" + JSON.stringify(handoff?.contextData || {});
    if (appliedFaithHandoffRef.current === signature) return;
    appliedFaithHandoffRef.current = signature;
    const contextData = handoff?.contextData && typeof handoff.contextData === "object" ? handoff.contextData : {};
    const details = Object.entries(contextData)
      .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
      .map(([key, value]) => key + "=" + (typeof value === "string" ? value : JSON.stringify(value)))
      .join("; ");
    const draft = question + "\n\nFaith context: page=" + String(handoff?.contextType || "faith") + (details ? "; " + details : "");
    setFaithDraftText(draft);
    try {
      sessionStorage.setItem("revelacode_faith_ai_draft", draft);
      sessionStorage.removeItem("revelacode_faith_ai_handoff");
    } catch {
      // The full draft remains in the React composer state.
    }
  }, [initialHandoff, location.key]);

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
    const complianceApiBaseValue = String(
    import.meta.env.VITE_REVELACODE_API_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    "https://revelacode-backend.onrender.com"
  ).trim();
  const complianceApiBase = complianceApiBaseValue.endsWith("/")
    ? complianceApiBaseValue.slice(0, -1)
    : complianceApiBaseValue;
  const hubNoticeFeature = ({
    faith: "faith_content",
    bible: "faith_content",
    prophecy: "faith_content",
    education: "elimu_assistant",
    shamba: "shamba_advisory",
    biashara: "biashara_insights",
  })[activeHub] || "";
  const requiredNoticeFeatures = useMemo(
    () => Array.from(new Set(["ai_chat", hubNoticeFeature].filter(Boolean))),
    [hubNoticeFeature]
  );


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
  const [workspaceArtifact, setWorkspaceArtifact] = useState(null);

  const [sidebarOpen, setSidebarOpen] =
    useState(!compactMode);

  const [chats, setChats] =
    useState([]);

  const [activeChatId, setActiveChatId] =
    useState(null);

  const [voiceActive, setVoiceActive] =
    useState(false);
  const [humanizerOpen, setHumanizerOpen] = useState(false);
  const [humanizerSeedText, setHumanizerSeedText] = useState("");
  const [complianceStatus, setComplianceStatus] = useState("loading");
  const [complianceNotices, setComplianceNotices] = useState([]);
  const [complianceError, setComplianceError] = useState("");

  // The WelcomeScreen launches the very same camera control used by InputBar.
  const [visionReady, setVisionReady] = useState(false);
  const visionLauncherRef = useRef(null);
  const registerVisionLauncher = useCallback((launcher) => {
    visionLauncherRef.current = typeof launcher === "function" ? launcher : null;
    setVisionReady(typeof launcher === "function");
  }, []);
  const openVision = useCallback(() => {
    if (typeof visionLauncherRef.current === "function") {
      visionLauncherRef.current();
    }
  }, []);

  // The same centrally managed trials/prices/checkout UI is reused in RevelaAI.
  const [identityOpen, setIdentityOpen] = useState(false);
  const identityDialogRef = useRef(null);
  useEffect(() => {
    let active = true;
    const loadRequiredNotices = async () => {
      setComplianceStatus("loading");
      setComplianceError("");
      try {
        const noticePayloads = await Promise.all(requiredNoticeFeatures.map(async (feature) => {
          const response = await fetch(`${complianceApiBase}/api/compliance/notices?feature=${encodeURIComponent(feature)}`, {
            method: "GET",
            headers: { Accept: "application/json" },
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok || payload.success === false || !payload.notice?.version) {
            throw new Error(payload.message || `The ${feature} notice is unavailable.`);
          }
          return { feature, ...payload.notice };
        }));
        let acknowledgements = {};
        if (user && !isGuest && typeof authFetch === "function") {
          const response = await authFetch(`${complianceApiBase}/api/compliance/acknowledgements`, {
            method: "GET",
            headers: { Accept: "application/json" },
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok || payload.success === false) {
            throw new Error(payload.message || "Could not verify your saved acknowledgements.");
          }
          acknowledgements = payload.acknowledgements || {};
        } else {
          for (const notice of noticePayloads) {
            try {
              if (localStorage.getItem(`revela_compliance_ack:${notice.feature}:${notice.version}`) === "true") {
                acknowledgements[notice.feature] = { version: notice.version };
              }
            } catch { /* Local acknowledgement is unavailable in private storage mode. */ }
          }
        }
        if (!active) return;
        setComplianceNotices(noticePayloads);
        setComplianceStatus(noticePayloads.every((notice) => acknowledgements[notice.feature]?.version === notice.version) ? "accepted" : "required");
      } catch (error) {
        if (!active) return;
        setComplianceStatus("error");
        setComplianceError(error.message || "Could not load the required use notices.");
      }
    };
    loadRequiredNotices();
    return () => { active = false; };
  }, [requiredNoticeFeatures, complianceApiBase, user?.id, isGuest, authFetch]);

  const acceptRequiredNotices = async () => {
    setComplianceError("");
    try {
      if (user && !isGuest && typeof authFetch === "function") {
        for (const notice of complianceNotices) {
          const response = await authFetch(`${complianceApiBase}/api/compliance/acknowledgements`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ feature: notice.feature, version: notice.version, accepted: true }),
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok || payload.success === false) {
            throw new Error(payload.message || `Could not save the ${notice.feature} acknowledgement.`);
          }
        }
      } else {
        for (const notice of complianceNotices) {
          localStorage.setItem(`revela_compliance_ack:${notice.feature}:${notice.version}`, "true");
        }
      }
      setComplianceStatus("accepted");
    } catch (error) {
      setComplianceError(error.message || "Could not save your acknowledgement.");
    }
  };

  const [freeMode, setFreeMode] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem("revelaai.free_mode.v1") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("revelaai.free_mode.v1", freeMode ? "true" : "false");
    } catch {
      // Privacy mode or a full browser store must not stop the assistant from working.
    }
  }, [freeMode]);

  // The backend owns specialist routing. The UI never pins a conversation to one hub.
  const activeBrainHub = "auto";
  const hubInputPlaceholder = "Message RevelaAI…";

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
    if (!isReady || isGuest || !userScope || userScope === "anonymous" || typeof window === "undefined" || typeof authFetch !== "function") {
      return undefined;
    }

    const controller = new AbortController();
    const apiBase = (import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com").replace(/\/$/, "");
    const identity = String(user?.user_id || user?.userId || userScope);

    authFetch(`${apiBase}/api/memory/${encodeURIComponent(identity)}/history?hub=${encodeURIComponent(activeBrainHub)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
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
  }, [isReady, isGuest, userScope, user?.user_id, user?.userId, activeBrainHub, authFetch]);

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

  const deleteChat = useCallback((chatId) => {
    if (!chatId) return;
    setChats((previous) => previous.filter((chat) => chat.id !== chatId));
    if (activeChatId === chatId) {
      controllerRef.current?.abort?.();
      setActiveChatId(null);
      setMessages([]);
    }
  }, [activeChatId]);

  const renameChat = useCallback((chatId, nextTitle, options = {}) => {
    if (!chatId) return;
    const cleaned = String(nextTitle || "").replace(/\s+/g, " ").trim().slice(0, 60);
    const manual = options?.manual === true;
    setChats((previous) => previous.map((chat) => {
      if (chat.id !== chatId) return chat;
      const firstUserText = chat.messages?.find((message) => message.role === "user")?.text || "";
      return {
        ...chat,
        title: cleaned || String(firstUserText).trim().slice(0, 45) || "New Conversation",
        titleLocked: manual && Boolean(cleaned),
        updatedAt: Date.now(),
      };
    }));
  }, []);

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

        const selectedToolCommand = String(inputMeta?.toolCommand || "").trim().toLowerCase();
        const humanizerIntent = selectedToolCommand === "/humanize" || /\bhumaniz(?:e|ing)\b/i.test(cleaned);
        const directHumanizerText = cleaned.match(/(?:humaniz(?:e|ing)(?:\s+it)?|make\s+it\s+sound\s+natural)\s*[:—-]\s*([\s\S]+)$/i)?.[1]?.trim() || "";

        /*
         * A file can be sent without a typed prompt.
         */
        if (
          !cleaned &&
          !attachedFile
        ) {
          return;
        }

        if (selectedToolCommand !== "/humanize" && complianceStatus !== "accepted") {
          setComplianceError("Read and acknowledge the current RevelaAI use notice before sending a chat message.");
          return;
        }

        // A selected Humanizer tool opens its embedded workspace directly.
        // Tool selection itself is local state; the Humanizer service is called
        // only when the user runs an operation inside that workspace.
        if (selectedToolCommand === "/humanize" && !attachedFile) {
          setHumanizerSeedText(cleaned);
          setHumanizerOpen(true);
          return;
        }

        if (sendLockRef.current) {
          return;
        }
        sendLockRef.current = true;
        window.dispatchEvent(new CustomEvent("revelacode:ai-interaction"));

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
            "loading",
            { stage: "preparing" }
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

        // Intent classification and specialist selection belong to the backend.
        // The frontend only preserves the explicit image-generation follow-up.
        const requestMessage = imageDescriptionFollowup
          ? `Generate an image of: ${cleaned}`
          : selectedToolCommand === "/humanize"
            ? `Humanize the following text while preserving its original meaning, facts, and intent. Return only the improved text unless explanation is requested.\n\n${cleaned}`
            : selectedToolCommand === "/image"
              ? `Image Studio request. Mode: ${inputMeta?.toolMode || "generate"}. Options: ${JSON.stringify(inputMeta?.toolOptions || {})}. Follow these settings exactly where supported. User brief: ${cleaned}`
              : selectedToolCommand === "/search"
                ? `Deep Search request. Depth and source preferences: ${JSON.stringify(inputMeta?.toolOptions || {})}. Research question: ${cleaned}`
                : selectedToolCommand && !cleaned.toLowerCase().startsWith(selectedToolCommand)
                  ? `${selectedToolCommand} ${cleaned}`.trim()
                  : cleaned;

        const updateLoadingStage = (stage) => {
          setMessages((previous) => previous.map((message) =>
            message.id === loadingId ? { ...message, stage } : message
          ));
        };
        let workspaceRequested = false;

        try {
          updateLoadingStage(attachedFile ? (freeMode ? "local-analysis-only" : "local-analysis") : freeMode ? "local-reasoning" : "connecting");

          const workspaceCommands = new Set(["/doc", "/deck", "/sheet", "/data", "/ledger", "/paper", "/code", "/ui", "/promo", "/image"]);
          const workspaceCommand = selectedToolCommand || inferWorkspaceCommand(cleaned, attachedFile);
          const runWorkspace = workspaceCommands.has(workspaceCommand) && !(workspaceCommand === "/image" && inputMeta?.toolMode === "merge");
          if (runWorkspace) {
            workspaceRequested = true;
            if (freeMode) throw new Error("Switch to Adaptive mode to generate hosted documents, workbooks, code files, designs or campaign assets. Free mode remains local-only.");
            updateLoadingStage("workspace-executing");
            const workspacePrompt = String(cleaned || requestMessage || "").replace(/^\/(?:doc|deck|sheet|data|ledger|paper|code|ui|promo|image)\b\s*/i, "").trim();
            if (!workspacePrompt && !attachedFile) throw new Error("Describe the artifact you want RevelaAI to create.");
            const safeTitle = (workspacePrompt || attachedFile?.name || "RevelaAI output").slice(0, 120);
            let workspacePayload = { prompt: workspacePrompt || "Analyze the uploaded file and produce a useful artifact.", title: safeTitle };
            let files = [];

            if (workspaceCommand === "/doc" || workspaceCommand === "/paper") {
              workspacePayload = { ...workspacePayload, task: "document", format: /\bpdf\b/i.test(workspacePrompt) ? "pdf" : "word", document_style: "auto" };
              if (attachedFile?.type?.startsWith("image/")) {
                files = [{ file: attachedFile, fieldName: "logo" }];
                workspacePayload = { ...workspacePayload, image_placement: "header", image_width_inches: 1.2 };
              } else if (attachedFile) {
                throw new Error("To embed a logo or photograph in a document, attach it as an image. Other source-file imports should be sent to the chat analysis workflow.");
              }
              if (workspaceCommand === "/paper") {
                workspacePayload.prompt = "Prepare a complete academic or research publication draft. Include a clear title, abstract, background, methodology, analysis, discussion, conclusion and references only where sources or details are supplied. Do not fabricate citations or research results.\n\n" + workspacePayload.prompt;
              }
            } else if (workspaceCommand === "/deck") {
              workspacePayload = { ...workspacePayload, task: "document", format: "powerpoint" };
              if (attachedFile?.type?.startsWith("image/")) {
                files = [{ file: attachedFile, fieldName: "logo" }];
                workspacePayload = { ...workspacePayload, image_placement: "title_slide", image_width_inches: 1.2 };
              } else if (attachedFile) throw new Error("Attach a PNG, JPEG or WEBP image to place it on the presentation title slide.");
            } else if (workspaceCommand === "/sheet" || workspaceCommand === "/ledger") {
              workspacePayload = { ...workspacePayload, task: "document", format: "spreadsheet" };
              if (attachedFile) workspacePayload.dataset = await datasetFromWorkspaceAttachment(attachedFile);
            } else if (workspaceCommand === "/data") {
              workspacePayload = { ...workspacePayload, task: "analytics" };
              if (attachedFile) workspacePayload.dataset = await datasetFromWorkspaceAttachment(attachedFile);
              else if (workspacePrompt.includes("\n") && workspacePrompt.includes(",")) workspacePayload.dataset = workspacePrompt;
              else throw new Error("Attach a CSV or JSON dataset, or paste CSV rows with a header line, to run deterministic data analysis.");
            } else if (workspaceCommand === "/code") {
              const language = workspacePrompt.match(/\b(python|javascript|typescript|tsx|jsx|html|css|json|sql|bash|go|rust|java|c\+\+|c#|php|ruby|swift|kotlin)\b/i)?.[1] || "";
              workspacePayload = { ...workspacePayload, task: "code", language };
              if (attachedFile) throw new Error("Source-file editing is not yet part of the file-export workspace. Paste the code or use the normal chat attachment analysis first.");
            } else if (workspaceCommand === "/ui") {
              workspacePayload = { ...workspacePayload, task: "ui_design" };
              if (attachedFile) throw new Error("The UI prototype tool currently builds from a written specification. Describe the screen and its interactions in the prompt.");
            } else if (workspaceCommand === "/promo") {
              workspacePayload = { ...workspacePayload, task: "promotion", image_options: { template: "poster", aspect_ratio: "4:5" } };
              if (attachedFile) throw new Error("Campaign generation currently uses the RevelaCode brand pipeline. Add the supplied logo as a document attachment after campaign generation.");
            } else if (workspaceCommand === "/image") {
              const mode = inputMeta?.toolMode || "generate";
              if (mode === "generate") {
                const options = inputMeta?.toolOptions || {};
                const ratio = ({ "1:1": "1:1", "4:5": "4:5", "16:9": "16:9", "9:16": "9:16" })[options.aspectRatio] || "1:1";
                workspacePayload = {
                  ...workspacePayload, task: "image",
                  image_options: { aspect_ratio: ratio, output_format: "png", use_ai_background: true },
                  prompt: workspacePrompt + (options.style ? "\nVisual style: " + options.style : ""),
                };
                if (attachedFile) throw new Error("Image generation does not use source-image attachments. Choose Image Studio → Edit or Enhance to process an uploaded image.");
              } else if (mode === "edit" || mode === "enhance") {
                if (!attachedFile?.type?.startsWith("image/")) throw new Error("Select a photo or graphic before using Image Studio Edit or Enhance.");
                const image = await readBrowserFileAsDataUrl(attachedFile);
                workspacePayload = {
                  ...workspacePayload, task: "image_edit",
                  image_base64: image,
                  mime_type: attachedFile.type || "image/jpeg",
                  operations: workspaceImageOperations(mode, workspacePrompt),
                };
              } else {
                throw new Error("The current image engine supports generation and bounded single-image enhancement/editing. Multi-image composition is not enabled in this workspace yet.");
              }
            }

            const workspaceResult = await executeRevelaAIWorkspace({
              authFetch,
              payload: workspacePayload,
              files,
              signal: controller.signal,
            });
            const artifactView = buildWorkspaceArtifact(workspaceResult, safeTitle, workspacePayload.prompt);
            setWorkspaceArtifact(artifactView);
            updateLoadingStage("workspace-complete");
            const resultText = workspaceResult?.task === "analytics"
              ? "Dataset analysis completed. " + (workspaceResult.analysis?.row_count ?? "The supplied") + " rows processed; the workbook and any generated chart are available in the workspace."
              : workspaceResult?.campaign?.headline
                ? "Campaign created: " + workspaceResult.campaign.headline + ". Open the workspace to review the campaign copy, poster and document."
                : workspaceResult?.image?.url
                  ? "Your image is ready. Open the workspace to preview it and access available formats."
                  : "Your " + (workspaceResult?.format || workspaceResult?.task || "requested") + " artifact is ready. Open the workspace to preview or download it.";
            const assistantMessage = {
              id: loadingId,
              role: "assistant",
              text: resultText,
              status: "done",
              contentType: "workspace-artifact",
              sourcePrompt: userDisplayText,
              createdAt: Date.now(),
              metadata: {
                engine: "revelaai-unified-workspace",
                provider: workspaceResult?.provider?.provider || workspaceResult?.provider || workspaceResult?.engine || "revelaai-workspace",
                model: workspaceResult?.provider?.model || null,
                hub: "workspace",
                hubLabel: "RevelaAI Workspace",
                network: true,
                networkUsed: true,
                workspaceTask: workspaceResult?.task || workspacePayload.task,
                verification: workspaceResult?.verification || null,
              },
            };
            setMessages((previous) => {
              const updated = previous.map((message) => message.id === loadingId ? assistantMessage : message);
              updateChat(chatId, updated);
              return updated;
            });
            void recordConversationTurn({
              scope: userScope,
              userText: userDisplayText,
              assistantText: resultText,
              hub: "workspace",
              emotion: "neutral",
            }).catch((memoryError) => recordLocalDiagnostic("conversation-memory", memoryError));
            return;
          }

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

          if (!attachedFile && inputMeta?.visionResult && String(inputMeta.visionResult).trim()) {
            // Camera analysis may be remote or local pixel math. Keep its real provenance.
            localText = String(inputMeta.visionResult).trim();
            localType = "vision-chat";
            const localVisionOnly = inputMeta.visionProvider === "local-pixel-math";
            brainMetadata = {
              ...brainMetadata,
              engine: localVisionOnly ? "revelaai-free-local-vision" : (inputMeta.visionProvider ? String(inputMeta.visionProvider) + "-vision" : "revelaai-vision"),
              provider: inputMeta.visionProvider || "local-pixel-math",
              network: !localVisionOnly,
              networkUsed: !localVisionOnly,
              visionUsed: true,
              visionFallback: localVisionOnly,
              freeMode: localVisionOnly,
              mediaRetained: false,
              memory: localVisionOnly ? "local-only" : "server",
            };
          } else if (attachedFile) {
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
          if (attachedFile && localText && !attachedFile.type?.startsWith("video/") && !freeMode) {
            const apiBase = (import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com").replace(/\/$/, "");
            
            if (typeof authFetch === "function") {
              try {
                updateLoadingStage("connecting");
                const perceptionResponse = await authFetch(`${apiBase}/ai`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json",  },
                  signal: controller.signal,
                  body: JSON.stringify({
                    message: requestMessage || (attachedFile.type?.startsWith("image/")
                      ? "Interpret the image using only the local perception findings below. State limitations clearly."
                      : "Analyze the document using only the extracted content below."),
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
                updateLoadingStage("interpreting");
                const perceptionData = perceptionPayload?.data || perceptionPayload || {};
                const interpreted = perceptionData.response || perceptionData.content || perceptionData.answer || perceptionData.text || perceptionPayload?.response || perceptionPayload?.answer;
                if (perceptionResponse.ok && typeof interpreted === "string" && interpreted.trim()) {
                  localText = interpreted.trim();
                  localType = "text";
                  localSources = Array.isArray(perceptionPayload?.sources) ? perceptionPayload.sources : [];
                  brainMetadata = {
                    ...brainMetadata,
                    ...sanitizeAIResponseMetadata(perceptionPayload?.meta),
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
          } else if (!attachedFile && !inputMeta?.visionResult) {
            if (freeMode) {
              const recentContext = currentMessages
                .filter((item) => item.role === "user" || item.role === "assistant")
                .slice(-6)
                .map((item) => item.role + ": " + String(item.text || "").slice(0, 300))
                .join("\n");
              localText = answerLocally(cleaned || requestMessage, recentContext);
              localType = "text";
              brainMetadata = {
                ...brainMetadata,
                engine: "revelaai-free-local-rules",
                provider: "on-device",
                network: false,
                networkUsed: false,
                freeMode: true,
                fallback: true,
                memory: "local-only",
                limitation: "Local templates and calculations; not a hosted language model.",
              };
            } else {
            // Adaptive mode uses the hosted model. Network failures are recovered below
            // using the free local engine instead of leaving a dead-end error bubble.
            const apiBase = (import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com").replace(/\/$/, "");
            let response;
            try {
              updateLoadingStage("connecting");
              response = await authFetch(`${apiBase}/ai`, {
                method: "POST",
                headers: {
                "Content-Type": "application/json",
                
                
              },
                signal: controller.signal,
                body: JSON.stringify({
                  message: requestMessage || cleaned,
                  hub: "auto",
                  sessionId: String(chatId || activeChatId || ""),
                  conversationId: String(chatId || activeChatId || ""),
                  visionDescription: null,
                  context: [
                    { role: "system", content: ANSWER_STYLE_INSTRUCTION },
                    ...currentMessages.filter((item) => item.role === "user" || item.role === "assistant").slice(-12).map((item) => ({
                      role: item.role === "assistant" ? "assistant" : "user",
                      content: item.text || "",
                    })),
                  ],
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

            updateLoadingStage("interpreting");
            const responseMeta = sanitizeAIResponseMetadata(payload?.meta);

            if (!response.ok) {
              if (response.status >= 500) {
                window.dispatchEvent(new CustomEvent("revelacode:connection-state", { detail: { state: "poor" } }));
                throw new Error("Poor connection — RevelaAI could not reach its service. Please try again shortly.");
              }
              throw new Error(payload?.message || "RevelaAI could not complete the request. Please try again.");
            }
            window.dispatchEvent(new CustomEvent("revelacode:connection-state", { detail: { state: "online" } }));

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
              localText = cleanAssistantAnswer(remoteText || "Image generated successfully.");
              localType = "image";
              localSources = Array.isArray(payload?.sources) ? payload.sources : [];
            } else {
              if (typeof remoteText !== "string" || !remoteText.trim()) {
                throw new Error("RevelaAI is waking up, please wait 20 seconds...");
              }
              localText = cleanAssistantAnswer(remoteText);
              localType = "text";
              localSources = Array.isArray(payload?.sources) ? payload.sources : [];
            }

            brainMetadata = {
              ...brainMetadata,
              ...responseMeta,
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
          }

          // Let the existing text model reason over on-device image/video observations.
          // Raw camera media stays on-device; only the derived observation text is sent.
          if (
            attachedFile &&
            (attachedFile.type?.startsWith("image/") || attachedFile.type?.startsWith("video/")) &&
            localText &&
            !freeMode
          ) {
            const observations = localText;
            const apiBase = (import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com").replace(/\/$/, "");
            try {
              updateLoadingStage("connecting");
              const visionResponse = await authFetch(`${apiBase}/ai`, {
                method: "POST",
                headers: {
                "Content-Type": "application/json",
                
                
              },
                signal: controller.signal,
                body: JSON.stringify({
                  message: requestMessage || "Analyze the attached media using the available observations.",
                  hub: "auto",
                  sessionId: String(chatId || activeChatId || ""),
                  conversationId: String(chatId || activeChatId || ""),
                  visionDescription: observations.slice(0, 7000),
                  context: [
                    { role: "system", content: ANSWER_STYLE_INSTRUCTION },
                    ...currentMessages.filter((item) => item.role === "user" || item.role === "assistant").slice(-10).map((item) => ({
                      role: item.role === "assistant" ? "assistant" : "user",
                      content: item.text || "",
                    })),
                  ],
                }),
              });
              const visionPayload = await visionResponse.json().catch(() => null);
              updateLoadingStage("interpreting");
              const visionData = visionPayload?.data || visionPayload || {};
              const visionReply = visionData?.response || visionData?.content || visionData?.answer || visionData?.text || visionPayload?.message;
              if (!visionResponse.ok || typeof visionReply !== "string" || !visionReply.trim()) {
                throw new Error("Vision reasoning service returned no usable answer.");
              }
              localText = visionReply.trim() + "\n\nOn-device observations:\n" + observations;
              localType = "vision-chat";
              brainMetadata = {
                ...brainMetadata,
                ...sanitizeAIResponseMetadata(visionPayload?.meta),
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

          // Local/offline turns never access branch-local hosted payload variables.
          updateLoadingStage("composing");
        const normalized = {
            text: cleanAssistantAnswer(localText) || "I couldn't complete that analysis. Please try again.",
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
          updateLoadingStage("streaming");
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
          if (humanizerIntent) {
            setHumanizerSeedText(directHumanizerText || normalized.text);
            setHumanizerOpen(true);
          }
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
            /failed to fetch|networkerror|load failed|revelaai is waking up|temporarily unavailable|service unavailable|timed out|timeout/i.test(String(error?.message || ""));
          if (isNetworkFailure) {
            window.dispatchEvent(new CustomEvent("revelacode:connection-poor"));
          } else {
            window.dispatchEvent(new CustomEvent("revelacode:connection-restored"));
          }
          const recentContext = currentMessages
            .filter((item) => item.role === "user" || item.role === "assistant")
            .slice(-6)
            .map((item) => item.role + ": " + String(item.text || "").slice(0, 300))
            .join("\n");
          const localFallback = !workspaceRequested && (freeMode || isNetworkFailure)
            ? answerLocally(cleaned || userDisplayText, recentContext)
            : "";
          const localFallbackNotice = freeMode
            ? "Free mode is active. This answer was generated locally without a hosted model."
            : "The hosted AI service was unavailable, so this response uses RevelaAI Free on-device rules. You can retry Adaptive mode when connectivity returns.";
          const visibleText = workspaceRequested
            ? "Workspace execution failed: " + String(error?.message || "RevelaAI could not create this artifact.") + " No artifact was created."
            : localFallback
              ? localFallback + "\n\n" + localFallbackNotice
              : (isNetworkFailure ? "Poor connection. Please reconnect and try again." : "RevelaAI is temporarily unavailable. Please try again.");

          if (localFallback) {
            void recordConversationTurn({
              scope: userScope,
              userText: userDisplayText,
              assistantText: visibleText,
              hub: "general",
              emotion: "neutral",
            }).catch((memoryError) => recordLocalDiagnostic("conversation-memory", memoryError));
          }

          setMessages((previous) => {
            const updated = previous.map((message) => {
              if (message.id !== loadingId) return message;
              if (localFallback) {
                return {
                  ...message,
                  text: visibleText,
                  status: "done",
                  contentType: "text",
                  sourcePrompt: userDisplayText,
                  metadata: {
                    engine: "revelaai-free-local-rules",
                    provider: "on-device",
                    hub: "general",
                    hubLabel: "General",
                    network: false,
                    networkUsed: false,
                    freeMode: true,
                    fallback: true,
                    limitation: "Local templates and calculations, not a hosted language model.",
                  },
                };
              }
              return { ...message, text: visibleText, status: "error" };
            });
            updateChat(chatId, updated);
            return updated;
          });
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
        freeMode,
        authFetch,
        complianceStatus,
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
    const response = cleanAssistantAnswer(result.response || "");

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
      hub: result.meta?.hub || "auto",
      emotion: result.meta?.emotionEstimate || "neutral",
    }).catch((memoryError) => recordLocalDiagnostic("voice-memory", memoryError));
    // The voice session stays open for the next turn.
  },
  [activeChatId, messages, ensureActiveChat, updateChat, userScope, activeBrainHub]
);
    const handleDeleteMessage = useCallback(
    (messageId) => {
      if (!messageId || !activeChatId) return;
      const updated = messages.filter((message) => message.id !== messageId);
      setMessages(updated);
      updateChat(activeChatId, updated);
    },
    [activeChatId, messages, updateChat]
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
      if (complianceStatus !== "accepted" || !activeChatId || assistantId !== regenerableId) return;

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
        const response = await authFetch(`${apiBase}/ai`, {
          method: "POST",
          headers: {
                "Content-Type": "application/json",
                
                
              },
          signal: controller.signal,
          body: JSON.stringify({
            message: regenerateMessage,
            hub: "auto",
            sessionId: String(chatId || activeChatId || ""),
            conversationId: String(chatId || activeChatId || ""),
            context: [
              { role: "system", content: ANSWER_STYLE_INSTRUCTION },
              ...history.filter((item) => item.role === "user" || item.role === "assistant").slice(-12).map((item) => ({
                role: item.role === "assistant" ? "assistant" : "user",
                content: item.text || "",
              })),
            ],
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
          text: cleanAssistantAnswer(responseText || (imageUrls.length ? "Image generated successfully." : "")),
          imageUrls,
          sources: Array.isArray(payload?.sources) ? payload.sources : [],
          metadata: {
            ...sanitizeAIResponseMetadata(payload?.meta),
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
    [activeChatId, regenerableId, messages, updateChat, hubContext, userScope, activeBrainHub, authFetch, complianceStatus]
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



  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  useEffect(() => {
    const opened = () => setWorkspaceOpen(true);
    const closed = () => setWorkspaceOpen(false);
    window.addEventListener("revelaai:workspace-opened", opened);
    window.addEventListener("revelaai:workspace-closed", closed);
    return () => {
      window.removeEventListener("revelaai:workspace-opened", opened);
      window.removeEventListener("revelaai:workspace-closed", closed);
    };
  }, []);

  useEffect(() => {
    if (!window.Capacitor?.isNativePlatform?.()) return undefined;
    let listener;
    let active = true;
    CapacitorApp.addListener("backButton", () => {
      if (workspaceOpen) {
        window.dispatchEvent(new CustomEvent("revelaai:workspace-request-close"));
        return;
      }
      if (identityOpen) {
        setIdentityOpen(false);
        return;
      }
      if (sidebarOpen) {
        setSidebarOpen(false);
        return;
      }
      if (window.confirm("Leave RevelaAI? Your saved chats remain available next time.")) {
        window.history.back();
      }
    }).then((handle) => {
      listener = handle;
      if (!active) handle.remove();
    }).catch((error) => console.warn("Android back-button handler unavailable:", error));
    return () => {
      active = false;
      listener?.remove();
    };
  }, [workspaceOpen, identityOpen, sidebarOpen]);

  useEffect(() => {
    if (!identityOpen) return undefined;
    const dialog = identityDialogRef.current;
    if (!dialog) return undefined;
    const focusable = () => Array.from(dialog.querySelectorAll("button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex='-1'])"));
    focusable()[0]?.focus();
    const trap = (event) => {
      if (event.key === "Escape") { event.preventDefault(); setIdentityOpen(false); return; }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [identityOpen]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;
    const updateViewport = () => {
      document.documentElement.style.setProperty("--revelaai-visual-viewport-height", Math.max(0, viewport.height) + "px");
      document.documentElement.style.setProperty("--revelaai-visual-viewport-offset", viewport.offsetTop + "px");
    };
    viewport.addEventListener("resize", updateViewport);
    viewport.addEventListener("scroll", updateViewport);
    updateViewport();
    return () => {
      viewport.removeEventListener("resize", updateViewport);
      viewport.removeEventListener("scroll", updateViewport);
      document.documentElement.style.removeProperty("--revelaai-visual-viewport-height");
      document.documentElement.style.removeProperty("--revelaai-visual-viewport-offset");
    };
  }, []);

  useEffect(() => {
    const handleShortcuts = (event) => {
      const modifier = event.ctrlKey || event.metaKey;
      const key = String(event.key || "").toLowerCase();
      const active = document.activeElement;
      const typing = Boolean(active?.matches?.("input, textarea, select, [contenteditable='true']"));
      if (modifier && key === "k") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("revelaai:focus-chat-search"));
      } else if (modifier && event.shiftKey && key === "o") {
        event.preventDefault();
        startNewChat();
      } else if (modifier && key === "b") {
        event.preventDefault();
        if (window.matchMedia("(min-width: 1024px)").matches) {
          window.dispatchEvent(new CustomEvent("revelaai:toggle-sidebar-collapse"));
        } else {
          setSidebarOpen((value) => !value);
        }
      } else if (event.key === "/" && !modifier && !event.altKey && !event.shiftKey && !typing) {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("revelaai:focus-composer-command"));
      }
    };
    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [startNewChat]);

  // Keep the AI workspace inside Android's visible viewport when the
  // soft keyboard overlays the WebView. The composer remains in normal flex
  // flow, so the conversation shrinks instead of being covered by the keyboard.
  useEffect(() => {
    const workspace = document.querySelector(".revelaai-workspace");
    if (!workspace) return undefined;

    const viewport = window.visualViewport;
    const updateViewport = () => {
      const visibleHeight = viewport?.height || window.innerHeight;
      const keyboardLikelyOpen = window.innerHeight - visibleHeight > 120;
      if (keyboardLikelyOpen) {
        workspace.style.setProperty("--revela-visible-height", `${Math.round(visibleHeight)}px`);
        workspace.classList.add("revelaai-keyboard-open");
      } else {
        workspace.style.removeProperty("--revela-visible-height");
        workspace.classList.remove("revelaai-keyboard-open");
      }
    };

    updateViewport();
    window.addEventListener("resize", updateViewport, { passive: true });
    viewport?.addEventListener("resize", updateViewport);
    viewport?.addEventListener("scroll", updateViewport);
    return () => {
      window.removeEventListener("resize", updateViewport);
      viewport?.removeEventListener("resize", updateViewport);
      viewport?.removeEventListener("scroll", updateViewport);
      workspace.style.removeProperty("--revela-visible-height");
      workspace.classList.remove("revelaai-keyboard-open");
    };
  }, []);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      data-demo="ai-overview"
      className="revelaai-workspace relative flex h-[100dvh] min-h-0 min-w-0 overflow-hidden bg-app text-fg"
      style={{ height: "var(--revelaai-visual-viewport-height, 100dvh)" }}
    >
      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={startNewChat}
        onSelectChat={selectChat}
        onDeleteChat={deleteChat}
        onRenameChat={renameChat}
        onOpenVoice={openVoice}
        onOpenVision={openVision}
        onOpenIdentity={() => setIdentityOpen(true)}
        freeMode={freeMode}
        onToggleFreeMode={() => setFreeMode((current) => !current)}
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
          data-demo="fullscreen-mode-bar"
          data-theme-surface="header"
          className="relative z-30 flex h-11 shrink-0 items-center justify-between gap-2 border-b border-line bg-header px-3 sm:gap-3 sm:px-4"
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
                border-line
                bg-surface
                text-fg-secondary
                transition
                hover:bg-surface-2
                hover:text-fg
                lg:hidden
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

                {hasConversation ? (
                  <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("revelaai:rename-active-chat", { detail: { chatId: activeChatId } }))}
                    title="Edit conversation title" aria-label="Edit conversation title"
                    className="flex min-w-0 items-center gap-1.5 rounded-md text-left text-sm font-bold text-fg hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    data-demo="chat-title">
                    <span className="max-w-[34vw] truncate sm:max-w-[42vw]">{chatTitle}</span>
                    <Pencil size={12} className="shrink-0 text-muted"/>
                  </button>
                ) : (
                  <h1 className="truncate text-sm font-bold text-fg">New chat</h1>
                )}
              </div>


            </div>
          </div>

          <span className="w-1 shrink-0" aria-hidden="true"/>
        </header>

        {!humanizerOpen && complianceStatus !== "accepted" && (
          <section className="shrink-0 border-b border-amber-300/30 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100" aria-live="polite">
            <div className="mx-auto flex w-full max-w-[900px] items-start gap-3">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300"/>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold">Before using RevelaAI</h2>
                {complianceStatus === "loading" && <p className="mt-1 text-xs">Loading current use notices…</p>}
                {complianceNotices.map((notice) => (
                  <div key={notice.feature} className="mt-2">
                    <p className="text-xs font-bold">{notice.title}</p>
                    <p className="mt-1 text-xs leading-5 text-amber-900 dark:text-amber-200">{notice.body}</p>
                  </div>
                ))}
                {complianceError && <p role="alert" className="mt-2 text-xs text-rose-700 dark:text-rose-300">{complianceError}</p>}
                <button type="button" onClick={acceptRequiredNotices} disabled={complianceStatus === "loading" || complianceStatus === "error" || !complianceNotices.length} className="mt-3 min-h-9 rounded-lg bg-amber-900 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-200 dark:text-amber-950">I have read and understand</button>
                <p className="mt-1 text-[10px] text-amber-800 dark:text-amber-300">Acknowledgements are versioned. A material notice update requires a new acknowledgement.</p>
              </div>
            </div>
          </section>
        )}

        {/* =================================================
            WORKSPACE BODY
        ================================================= */}

        {humanizerOpen ? (
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden" aria-label="Humanizer workspace">
            <div className="flex shrink-0 justify-end border-b border-line bg-header px-3 py-1.5 sm:px-4">
              <button type="button" onClick={() => { setHumanizerOpen(false); setHumanizerSeedText(""); }} className="min-h-9 rounded-lg border border-line px-3 text-xs font-semibold text-fg-secondary hover:bg-surface-2 hover:text-fg" aria-label="Return to chat">Back to chat</button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-app">
              <HumanizerWorkspace
                embedded
                initialText={humanizerSeedText}
                onExportToChat={(revisedText) => {
                  const safeText = String(revisedText || "").trim();
                  if (!safeText) return;
                  const resultMessage = createMessage("assistant", safeText, "done", {
                    contentType: "humanizer-result",
                    sourcePrompt: "Humanizer Studio · approved revision",
                  });
                  setMessages((previous) => {
                    const updated = [...previous, resultMessage];
                    if (activeChatId) updateChat(activeChatId, updated);
                    return updated;
                  });
                  setHumanizerOpen(false);
                  setHumanizerSeedText("");
                }}
              />
            </div>
          </section>
        ) : !hasConversation ? (
          <section className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain" aria-label="RevelaAI welcome workspace">
            <div className="mx-auto flex min-h-full w-full max-w-[920px] flex-1 flex-col items-center justify-center gap-2 px-3 py-4 sm:px-5 sm:py-5">
              <div data-demo="ai-welcome-state" className="w-full">
                <WelcomeScreen />
              </div>
              <div data-demo="ai-chat-input" className="w-full max-w-[700px]">
                <InputBar
                  placeholder={hubInputPlaceholder}
                  initialDraft={faithDraftText}
                  onSend={(...args) => { try { sessionStorage.removeItem("revelacode_faith_ai_draft"); } catch { /* The submitted message is now owned by the active chat. */ } sendMessage(...args); }}
                  onMic={openVoice}
                  onRegisterVision={registerVisionLauncher}
                  freeMode={freeMode}
                  isGenerating={messages.some((message) => message.status === "loading")}
                  onStop={() => {
                    controllerRef.current?.abort();
                    controllerRef.current = null;
                    sendLockRef.current = false;
                    setMessages((current) => current.filter((message) => message.status !== "loading"));
                  }}
                />
              </div>
            </div>
          </section>
        ) : (
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden" aria-label="Conversation workspace">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
              <ChatWindow
                messages={messages}
                regenerableId={regenerableId}
                onRegenerate={regenerateResponse}
                onFeedback={handleFeedback}
                onDeleteMessage={handleDeleteMessage}
              />
            </div>
            <div className="composer-safe-bottom z-20 shrink-0 border-t border-line bg-header/95 px-3 pb-2 pt-2 backdrop-blur-sm sm:px-5 sm:pb-2">
              <div data-demo="ai-chat-input" className="mx-auto w-full max-w-[700px]">
                <div data-demo="ai-vision-tools">
                  <InputBar
                    placeholder={hubInputPlaceholder}
                    initialDraft={faithDraftText}
                    onSend={(...args) => { try { sessionStorage.removeItem("revelacode_faith_ai_draft"); } catch { /* The submitted message is now owned by the active chat. */ } sendMessage(...args); }}
                    onMic={openVoice}
                    onRegisterVision={registerVisionLauncher}
                    freeMode={freeMode}
                    isGenerating={messages.some((message) => message.status === "loading")}
                    onStop={() => {
                      controllerRef.current?.abort();
                      controllerRef.current = null;
                      sendLockRef.current = false;
                      setMessages((current) => current.filter((message) => message.status !== "loading"));
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {workspaceArtifact && (
        <RevelaAIWorkspacePanel
          artifact={workspaceArtifact}
          onClose={() => setWorkspaceArtifact(null)}
          onAskAI={() => {
            const revisionPrompt = "Revise the latest generated artifact titled " + JSON.stringify(workspaceArtifact.title) + ". Original brief: " + String(workspaceArtifact.source_prompt || "").slice(0, 1400) + ". Preserve correct facts and only apply these changes: ";
            window.dispatchEvent(new CustomEvent("revelaai:fill-composer", { detail: { text: revisionPrompt } }));
            setWorkspaceArtifact(null);
          }}
        />
      )}

      {identityOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-overlay/70 p-2 backdrop-blur-sm sm:items-center sm:p-4"
          role="presentation"
          onClick={() => setIdentityOpen(false)}
        >
          <section
            ref={identityDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="revelaai-identity-title"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-accent/25 bg-popover p-4 text-fg shadow-2xl sm:p-6"
          >
            <header className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300/20 to-cyan-400/10 text-accent ring-1 ring-emerald-300/20">
                  <Sparkles size={24} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-accent">RevelaCode · Intelligence</p>
                  <h2 id="revelaai-identity-title" className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Meet RevelaAI</h2>
                  <p className="mt-1 text-xs text-muted">One adaptive assistant. A local-first fallback. Your conversation workspace.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIdentityOpen(false)}
                className="rounded-xl border border-line p-2 text-muted transition hover:bg-surface-2 hover:text-fg"
                aria-label="Close RevelaAI Identity"
              >
                <X size={18} />
              </button>
            </header>

            <p className="mt-5 text-sm leading-6 text-fg-secondary">
              RevelaAI routes questions through the configured AI service when Adaptive mode is available. When you choose Free mode—or the service cannot be reached—the dashboard can keep working with on-device rules and local media measurements.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <article className="rounded-2xl border border-line bg-surface p-3">
                <div className="flex items-center gap-2 text-sm font-bold text-fg"><Sparkles size={16} className="text-accent" /> Adaptive intelligence</div>
                <p className="mt-2 text-xs leading-5 text-muted">Uses the configured hosted AI and backend routing when network access and credentials are available.</p>
              </article>
              <article className="rounded-2xl border border-line bg-surface p-3">
                <div className="flex items-center gap-2 text-sm font-bold text-fg"><WifiOff size={16} className="text-accent" /> Free mode</div>
                <p className="mt-2 text-xs leading-5 text-muted">Local text templates, supported document extraction, pixel statistics and sampled video analysis. It is not a full local language model.</p>
              </article>
              <article className="rounded-2xl border border-line bg-surface p-3">
                <div className="flex items-center gap-2 text-sm font-bold text-fg"><Mic size={16} className="text-accent" /> Voice</div>
                <p className="mt-2 text-xs leading-5 text-muted">Browser speech recognition plus spoken replies where the device and browser support them.</p>
              </article>
              <article className="rounded-2xl border border-line bg-surface p-3">
                <div className="flex items-center gap-2 text-sm font-bold text-fg"><Camera size={16} className="text-chart-2" /> Vision</div>
                <p className="mt-2 text-xs leading-5 text-muted">Adaptive mode can request server vision analysis. Free mode keeps camera frames on-device and reports only pixel measurements.</p>
              </article>
            </div>

            <div className="mt-4 rounded-2xl border border-line bg-surface-2 p-3">
              <p className="text-xs font-bold text-fg-secondary">Privacy and capability boundary</p>
              <p className="mt-1 text-xs leading-5 text-muted">Free mode avoids hosted AI requests from typed chat, camera capture and this voice session. Local pixel statistics cannot prove object identity or read scene meaning. The dashboard does not expose internal USECT core controls here.</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button type="button" onClick={() => { setFreeMode(true); setIdentityOpen(false); }} className="min-h-12 rounded-xl bg-accent px-3 py-2.5 text-xs font-extrabold text-inverse transition hover:bg-accent-hover">
                Use Free mode
              </button>
              <button type="button" onClick={() => { setFreeMode(false); setIdentityOpen(false); }} className="min-h-12 rounded-xl border border-line px-3 py-2.5 text-xs font-bold text-fg-secondary transition hover:bg-surface-2">
                Adaptive mode
              </button>
              <button type="button" onClick={() => { setIdentityOpen(false); openVoice(); }} className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2.5 text-xs font-bold text-fg-secondary transition hover:bg-surface-2">
                <Mic size={14} /> Voice
              </button>
              <button type="button" onClick={() => { setIdentityOpen(false); openVision(); }} className="flex items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2.5 text-xs font-bold text-fg-secondary transition hover:bg-surface-2">
                <Camera size={14} /> Vision
              </button>
            </div>

          </section>
        </div>
      )}

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
          freeMode={freeMode}
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
