/**
 * RevelaAI v2 multimodal transport.
 * Credentials remain in the authenticated session; provider keys never reach the browser.
 * Uses the existing RevelaAI /ai gateway to preserve the current deployment architecture.
 */
const baseUrl = () => String(import.meta.env.VITE_REVELAAI_URL || "").trim().replace(/\/+$/, "");

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export async function analyzeMedia({ authFetch, file, message, context = "", sessionId = "" }) {
  if (typeof authFetch !== "function") throw new Error("Secure authentication transport is unavailable.");
  if (!baseUrl()) throw new Error("VITE_REVELAAI_URL is not configured.");
  if (file && file.size > MAX_UPLOAD_BYTES) throw new Error("Choose a file smaller than 20 MB.");
  if (file && !/^(image|video|audio)\//i.test(file.type) && !/\.(pdf|docx?|xlsx?|csv|txt|md)$/i.test(file.name)) {
    throw new Error("This file type is not supported for analysis.");
  }

  const headers = { "X-Session-ID": String(sessionId || "") };
  let body;
  if (file) {
    body = new FormData();
    body.append("file", file, file.name);
    body.append("message", String(message || "Analyze this attachment carefully."));
    body.append("context", String(context || ""));
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({ message: String(message || ""), context: String(context || "") });
  }

  const response = await authFetch(`${baseUrl()}/ai`, { method: "POST", headers, body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.message || `Analysis failed (HTTP ${response.status}).`);
  }
  return data;
}

export function fileToPreviewUrl(file) {
  return file ? URL.createObjectURL(file) : "";
}
