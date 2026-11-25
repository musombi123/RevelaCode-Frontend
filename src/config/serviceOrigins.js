const ENV = import.meta.env || {};
const IS_RPSVI_STAGING = ENV.MODE === "rpsvi-staging";

const PRODUCTION_BACKEND_ORIGIN = "https://revelacode-backend.onrender.com";
const PRODUCTION_REVELAAI_ORIGIN = "https://revelaai.onrender.com";

function normalizeOrigin(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

/**
 * Public browser-facing service origins.
 *
 * RPSVI staging intentionally has no production fallback. If a staging Vite
 * environment file is missing, the origin remains empty instead of sending
 * tester traffic or credentials to the production services.
 */
export const BACKEND_ORIGIN = normalizeOrigin(
  ENV.VITE_REVELACODE_API_URL ||
    ENV.VITE_API_BASE_URL ||
    ENV.VITE_BACKEND_URL ||
    ENV.VITE_API_URL ||
    ENV.VITE_REVELACODE_URL ||
    (IS_RPSVI_STAGING ? "" : PRODUCTION_BACKEND_ORIGIN),
);

export const REVELAAI_ORIGIN = normalizeOrigin(
  ENV.VITE_REVELAAI_API_URL ||
    (IS_RPSVI_STAGING ? "" : PRODUCTION_REVELAAI_ORIGIN),
);

export function requireBackendOrigin() {
  if (!BACKEND_ORIGIN) {
    throw new Error("Backend service origin is not configured for this build environment.");
  }
  return BACKEND_ORIGIN;
}

export function requireRevelaAIOrigin() {
  if (!REVELAAI_ORIGIN) {
    throw new Error("RevelaAI service origin is not configured for this build environment.");
  }
  return REVELAAI_ORIGIN;
}
