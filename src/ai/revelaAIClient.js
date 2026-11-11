/**
 * Secure client for the existing RevelaAI production API.
 *
 * The frontend owns presentation and device-side fallbacks. Text, uploaded
 * documents/images and authenticated voice transcripts use the existing
 * backend /ai pipeline, which coordinates configured providers.
 */
const API_BASE = String(
  import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com"
).trim().replace(/\/+$/, "");

const isMongoUserId = (value) => /^[a-f\d]{24}$/i.test(String(value || "").trim());

async function readJsonResponse(response) {
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    // Non-JSON upstream errors are converted into a stable message below.
  }
  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      payload?.error ||
      `RevelaAI request failed (HTTP ${response.status}).`;
    throw new Error(String(message));
  }
  return payload;
}

function normalizeAIResponse(payload) {
  const data = payload?.data && typeof payload.data === "object" ? payload.data : {};
  const meta = payload?.meta && typeof payload.meta === "object"
    ? payload.meta
    : (data?.meta && typeof data.meta === "object" ? data.meta : {});
  const imageCandidates = [
    data.imageUrl,
    data.image_url,
    data.url,
    ...(Array.isArray(data.urls) ? data.urls : []),
    ...(Array.isArray(data.images) ? data.images.map((item) =>
      typeof item === "string" ? item : item?.url || item?.image_url
    ) : []),
  ].filter((item) => typeof item === "string" && (item.startsWith("https://") || item.startsWith("http://")));

  const text = String(
    data.content ??
    data.reply ??
    data.response ??
    data.text ??
    payload?.message ??
    (imageCandidates.length ? "Your generated image is ready." : "")
  ).trim();

  if (!text && !imageCandidates.length) {
    throw new Error("RevelaAI returned no readable answer.");
  }

  return {
    text,
    imageUrls: [...new Set(imageCandidates)],
    sources: Array.isArray(meta?.online?.sources) ? meta.online.sources : [],
    metadata: {
      ...meta,
      downloads: meta.downloads && typeof meta.downloads === "object" ? meta.downloads : (data.downloads && typeof data.downloads === "object" ? data.downloads : {}),
      designBrief: meta.design_brief || meta.designBrief || null,
      provider: data.provider || meta.provider || meta.ai_model || null,
      model: data.model || meta.ai_model || null,
      engine: data.engine || meta.ai_model || meta.provider || "revelaai-coordinated-ai",
      network: true,
      networkUsed: true,
      fallback: false,
      memory: meta.memory || "server-session-and-smart-memory",
    },
    type: imageCandidates.length ? "image" : (meta?.multimodal?.type || "text"),
  };
}

export async function sendRevelaAIMessage({
  authFetch,
  message,
  context = "",
  file = null,
  sessionId = "",
  hub = "auto",
  userId = "",
  signal,
}) {
  if (typeof authFetch !== "function") {
    throw new Error("Authenticated request support is unavailable.");
  }

  let body;
  if (file) {
    body = new FormData();
    body.append("file", file, file.name || "attachment");
    body.append("message", String(message || ""));
    body.append("context", String(context || ""));
    body.append("sessionId", String(sessionId || ""));
    body.append("hub", String(hub || "auto"));
    if (isMongoUserId(userId)) body.append("userId", String(userId));
  } else {
    body = JSON.stringify({
      message: String(message || ""),
      context: String(context || ""),
      sessionId: String(sessionId || ""),
      hub: String(hub || "auto"),
      ...(isMongoUserId(userId) ? { userId: String(userId), user_id: String(userId) } : {}),
    });
  }

  const identityHeader = isMongoUserId(userId) ? { userId: String(userId) } : {};
  const response = await authFetch(`${API_BASE}/ai`, {
    method: "POST",
    headers: file
      ? { ...identityHeader, "X-Session-ID": String(sessionId || "") }
      : { "Content-Type": "application/json", ...identityHeader, "X-Session-ID": String(sessionId || "") },
    body,
    signal,
  });

  return normalizeAIResponse(await readJsonResponse(response));
}

export async function saveSmartMemoryTurn({
  authFetch,
  userId,
  userMessage,
  aiResponse,
  hub = "general",
  sessionId = "default",
}) {
  if (typeof authFetch !== "function") return { stored: false, reason: "auth_unavailable" };

  const payload = {
    userMessage: String(userMessage || ""),
    aiResponse: String(aiResponse || ""),
    hub: String(hub || "general"),
    sessionId: String(sessionId || "default"),
  };
  // The backend derives the real identity from the JWT. Include the explicit
  // ID when it is a valid Mongo ObjectId so mismatches are rejected server-side.
  if (isMongoUserId(userId)) payload.userId = String(userId);

  const response = await authFetch(`${API_BASE}/api/memory/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(isMongoUserId(userId) ? { userId: String(userId) } : {}),
    },
    body: JSON.stringify(payload),
  });
  return readJsonResponse(response);
}

export async function loadSmartMemory({ authFetch, userId }) {
  if (typeof authFetch !== "function" || !isMongoUserId(userId)) return null;
  const response = await authFetch(
    `${API_BASE}/api/memory/${encodeURIComponent(String(userId))}`,
    {
      method: "GET",
      headers: { userId: String(userId) },
    }
  );
  const payload = await readJsonResponse(response);
  return payload?.data || null;
}

export async function loadSmartIdeas({ authFetch, userId }) {
  if (typeof authFetch !== "function" || !isMongoUserId(userId)) return [];
  const response = await authFetch(
    `${API_BASE}/api/memory/ideas/${encodeURIComponent(String(userId))}`,
    {
      method: "GET",
      headers: { userId: String(userId) },
    }
  );
  const payload = await readJsonResponse(response);
  return Array.isArray(payload?.data) ? payload.data : [];
}

export function formatSmartMemoryContext(memory) {
  const bestThings = memory?.bestThings;
  if (!bestThings || typeof bestThings !== "object") return "";
  const entries = Object.entries(bestThings)
    .filter(([, value]) => typeof value === "string" && value.trim())
    .map(([key, value]) => `- ${key}: ${value.trim()}`);
  if (!entries.length) return "";
  return "REVELAAI LONG-TERM USER MEMORY (use only when relevant; do not assume facts beyond these saved details):\n" + entries.join("\n");
}

export const REVELAAI_API_BASE = API_BASE;


function workspaceErrorMessage(payload, status) {
  const detail = payload?.detail;
  const message = payload?.error?.message || payload?.message ||
    (typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((item) => item?.msg || item?.message || "Invalid request").join("; ") : "") ||
    `RevelaAI workspace request failed (HTTP ${status}).`;
  return String(message);
}

async function readWorkspaceResponse(response) {
  let payload = {};
  try { payload = await response.json(); } catch { /* Preserve HTTP error context below. */ }
  if (!response.ok || payload?.status === "error" || payload?.success === false) {
    throw new Error(workspaceErrorMessage(payload, response.status));
  }
  return payload?.data && typeof payload.data === "object" && !payload.task
    ? { ...payload, ...payload.data }
    : payload;
}

/**
 * Execute the shared RevelaAI workspace endpoint. Internal processors are
 * selected by the backend; the frontend never configures individual tool URLs.
 */
export async function executeRevelaAIWorkspace({
  authFetch,
  payload = {},
  files = [],
  signal,
}) {
  if (typeof authFetch !== "function") {
    throw new Error("Authenticated RevelaAI requests are unavailable. Sign in again and retry.");
  }
  const attachments = (Array.isArray(files) ? files : [files]).filter((item) => item && item.file);
  const hasAttachments = attachments.length > 0;
  let body;
  const headers = {};
  let endpoint = `${API_BASE}/api/workspace/execute`;

  if (hasAttachments) {
    body = new FormData();
    const complex = new Set(["official_metadata", "image_options", "sections", "slides", "dataset", "operations"]);
    for (const [key, value] of Object.entries(payload || {})) {
      if (value === undefined || value === null) continue;
      body.append(key, complex.has(key) ? JSON.stringify(value) : String(value));
    }
    attachments.slice(0, 8).forEach(({ file, fieldName = "logo" }) => {
      body.append(fieldName, file, file.name || "revelaai-attachment");
    });
    endpoint = `${API_BASE}/api/workspace/execute/multipart`;
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(payload || {});
  }

  const response = await authFetch(endpoint, { method: "POST", headers, body, signal });
  return readWorkspaceResponse(response);
}

/**
 * Send a camera/upload frame to the existing authenticated Live Vision route.
 * This is used for general vision as well as Shamba's structured leaf/soil mode.
 */
export async function analyzeRevelaAIVision({
  authFetch,
  image,
  mimeType = "image/jpeg",
  prompt = "",
  hub = "smart_ai",
  analysisType = null,
  analysisContext = {},
  signal,
}) {
  if (typeof authFetch !== "function") {
    throw new Error("Authenticated RevelaAI requests are unavailable. Sign in again and retry.");
  }
  const response = await authFetch(`${API_BASE}/api/vision/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    signal,
    body: JSON.stringify({
      image,
      mimeType,
      prompt,
      hub,
      ...(analysisType ? { analysisType } : {}),
      ...(analysisContext && typeof analysisContext === "object" ? { analysisContext } : {}),
    }),
  });
  const payload = await readWorkspaceResponse(response);
  const data = payload?.data && typeof payload.data === "object" ? payload.data : payload;
  if (typeof data?.reply !== "string" || !data.reply.trim()) {
    throw new Error("RevelaAI Live Vision returned no usable analysis.");
  }
  return { ...payload, ...data };
}
