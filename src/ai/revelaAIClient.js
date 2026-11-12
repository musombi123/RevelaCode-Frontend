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

async function detectWorkspaceRasterMime(file) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isPng = bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  if (isPng) return { mime: "image/png", extension: "png" };

  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (isJpeg) return { mime: "image/jpeg", extension: "jpg" };

  const isWebp = bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (isWebp) return { mime: "image/webp", extension: "webp" };

  return null;
}

function makeWorkspaceImageFile(file, blob, mime, extension) {
  const baseName = String(file.name || "revelacode-logo")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-") || "revelacode-logo";
  return new File([blob], baseName + "." + extension, {
    type: mime,
    lastModified: file.lastModified || Date.now(),
  });
}

async function normalizeWorkspaceImageAttachment(file) {
  if (!file) return file;

  if (file.size > 4 * 1024 * 1024) {
    throw new Error("Logo and image attachments must be no larger than 4 MB.");
  }

  // Trust the actual file signature over the browser-supplied MIME and name.
  // This prevents a real PNG/JPEG/WEBP from being misread as an SVG just
  // because its file input metadata says image/svg+xml.
  const raster = await detectWorkspaceRasterMime(file);
  if (raster) {
    const declaredMime = String(file.type || "").toLowerCase();
    const expectedName = String(file.name || "").toLowerCase().endsWith("." + raster.extension);
    if (declaredMime === raster.mime && expectedName) return file;
    return makeWorkspaceImageFile(file, file, raster.mime, raster.extension);
  }

  // Do not trust the extension or browser MIME alone: exported logos are
  // sometimes SVG XML renamed to .png (and therefore reported as image/png).
  const declaredSvg = String(file.type || "").toLowerCase() === "image/svg+xml" ||
    /\.svg$/i.test(file.name || "");
  const header = await file.slice(0, Math.min(file.size, 8192)).text();
  const contentLooksSvg = /<svg(?:\s|>)/i.test(header);
  const isSvg = declaredSvg || contentLooksSvg;
  if (!isSvg) return file;

  if (typeof DOMParser === "undefined" || typeof Image === "undefined" || typeof document === "undefined") {
    throw new Error("This browser cannot safely convert the supplied SVG logo. Export it as PNG and attach it again.");
  }

  let source = (await file.text()).replace(/^\uFEFF/, "").trim();
  if (!source || source.length > 4 * 1024 * 1024) {
    throw new Error("The supplied SVG logo is empty or exceeds the 4 MB limit.");
  }

  // SVG downloads often include an XML declaration, DTD, comments or trailing
  // exporter metadata. Keep the actual SVG root and its children; the DTD is
  // not needed for browser rendering and may reference external entities.
  const svgStart = source.search(/<svg(?:\s|>)/i);
  const svgEnd = source.toLowerCase().lastIndexOf("</svg>");
  if (svgStart < 0 || svgEnd < svgStart) {
    throw new Error("The file is marked as SVG but contains no complete <svg> element. Re-export the logo as SVG or PNG.");
  }
  source = source.slice(svgStart, svgEnd + "</svg>".length)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

  // Repair the common Illustrator/Inkscape export defect where a text node or
  // attribute contains a bare ampersand (for example, "Research & Innovation").
  // Existing XML entities and numeric character references remain unchanged.
  let parsed = new DOMParser().parseFromString(source, "image/svg+xml");
  if (parsed.querySelector("parsererror")) {
    const repaired = source.replace(
      /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);)/gi,
      "&amp;"
    );
    if (repaired !== source) {
      source = repaired;
      parsed = new DOMParser().parseFromString(source, "image/svg+xml");
    }
  }

  const root = parsed.documentElement;
  if (!root || root.localName?.toLowerCase() !== "svg" || parsed.querySelector("parsererror")) {
    throw new Error("The SVG logo contains malformed XML that could not be safely repaired. Export it again as SVG 1.1 or PNG.");
  }

  if (parsed.querySelector("script,foreignObject,iframe,object,embed,audio,video")) {
    throw new Error("The SVG logo contains active or embedded content and cannot be used in an official document.");
  }
  for (const element of [root, ...Array.from(root.querySelectorAll("*"))]) {
    for (const attribute of Array.from(element.attributes || [])) {
      const name = String(attribute.name || "").toLowerCase();
      const value = String(attribute.value || "").trim();
      if (name.startsWith("on")) {
        throw new Error("The SVG logo contains an event handler and cannot be embedded.");
      }
      if ((name === "href" || name.endsWith(":href") || name === "src") &&
          value && !value.startsWith("#") &&
          !/^data:image\/(?:png|jpeg|webp);base64,/i.test(value)) {
        throw new Error("The SVG logo references an external resource. Use a self-contained logo file.");
      }
    }
  }
  if (/@import\b/i.test(source) || /url\(\s*(['"]?)(?:https?:|\/\/|file:|javascript:)/i.test(source)) {
    throw new Error("The SVG logo contains an external resource reference. Use a self-contained logo file.");
  }

  const serialized = new XMLSerializer().serializeToString(root);
  const svgUrl = URL.createObjectURL(new Blob([serialized], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("The SVG logo could not be rasterized by this browser. Export it as PNG and attach it again."));
      image.src = svgUrl;
    });
    const sourceWidth = Math.max(1, image.naturalWidth || 1024);
    const sourceHeight = Math.max(1, image.naturalHeight || 1024);
    const scale = Math.min(1, 2048 / Math.max(sourceWidth, sourceHeight),
      Math.sqrt(20000000 / (sourceWidth * sourceHeight)));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("The browser could not prepare the SVG logo for embedding.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const png = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!png || !png.size) throw new Error("The SVG logo could not be converted to PNG.");
    if (png.size > 4 * 1024 * 1024) throw new Error("The converted PNG logo exceeds the 4 MB upload limit.");
    return makeWorkspaceImageFile(file, png, "image/png", "png");
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
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
    const preparedAttachments = await Promise.all(
      attachments.slice(0, 8).map(async (item) => ({
        ...item,
        file: await normalizeWorkspaceImageAttachment(item.file),
      }))
    );
    preparedAttachments.forEach(({ file, fieldName = "logo" }) => {
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
