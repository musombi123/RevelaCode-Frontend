const configuredBase =
  import.meta.env.VITE_REVELAAI_HUB_API_URL ||
  import.meta.env.VITE_REVELAAI_API_URL ||
  "";

const API_BASE = String(configuredBase).replace(/\/+$/, "");

/**
 * Calls RevelaAI's deterministic, no-model five-hub endpoint.
 * A missing base URL is an intentional offline mode; callers may
 * then use the browser-side rule engine without making a request.
 */
export async function requestHubReply({
  message,
  hub = "general",
  userId = "guest",
  sessionId = "",
  vision = null,
  visionDescription = "",
  signal,
}) {
  if (!API_BASE) return null;

  const response = await fetch(`${API_BASE}/api/revelaai/hubs/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      message: String(message || "").slice(0, 8000),
      hub,
      userId: String(userId || "guest").slice(0, 256),
      sessionId: String(sessionId || "").slice(0, 256),
      vision,
      visionDescription: String(visionDescription || "").slice(0, 8000),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok || !data?.reply) {
    throw new Error(data?.error || `RevelaAI hub request failed (${response.status}).`);
  }

  return {
    text: data.reply,
    metadata: {
      engine: data.engine || "regex-cache-local-json",
      paidModel: false,
      hub: data.hub || hub,
      cached: Boolean(data.cached),
      network: true,
    },
  };
}

export function isHubApiConfigured() {
  return Boolean(API_BASE);
}
