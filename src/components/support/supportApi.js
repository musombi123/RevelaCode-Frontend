/** Shared support API helpers.
 * Normalizes the frontend's backend URL and uses the signed-in JWT rather
 * than putting the shared support API key in browser requests.
 */
const configuredBase =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_REVELACODE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://revelacode-backend.onrender.com";

export const SUPPORT_API_BASE = String(configuredBase)
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

export function supportApiUrl(path) {
  const normalizedPath = String(path || "").startsWith("/")
    ? String(path)
    : `/${String(path || "")}`;

  return `${SUPPORT_API_BASE}${normalizedPath}`;
}

export async function supportAuthHeaders(getAccessToken, getTokenType, extra = {}) {
  const token = typeof getAccessToken === "function"
    ? await getAccessToken()
    : "";
  const tokenType = typeof getTokenType === "function"
    ? await getTokenType()
    : "Bearer";

  if (!token) {
    throw new Error("Your support session has expired. Please sign in again.");
  }

  return {
    Accept: "application/json",
    ...extra,
    Authorization: `${tokenType || "Bearer"} ${String(token).replace(/^Bearer\s+/i, "")}`,
  };
}

export async function readSupportResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.success === false) {
    throw new Error(
      data?.message || data?.error?.message || fallbackMessage ||
      `Support request failed (HTTP ${response.status}).`,
    );
  }

  return data;
}
