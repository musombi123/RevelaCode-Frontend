const DEFAULT_BACKEND_URL = "https://revelacode-backend.onrender.com";

/**
 * Resolve the one authoritative RevelaCode API origin used by browser
 * sessions, independent of whether a deployment names it BACKEND_URL,
 * REVELACODE_URL, API_BASE_URL, or API_URL.
 */
export function resolveBackendBaseUrl(env = {}) {
  const candidates = [
    env.VITE_REVELACODE_API_URL,
    env.VITE_API_BASE_URL,
    env.VITE_BACKEND_URL,
    env.VITE_REVELACODE_URL,
    env.VITE_API_URL,
  ];

  const configured = candidates.find(
    (value) => typeof value === "string" && value.trim(),
  );

  return String(configured || DEFAULT_BACKEND_URL).trim().replace(/\/+$/, "");
}
