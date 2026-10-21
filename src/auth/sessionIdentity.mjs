/**
 * Strip credential-like values from cached account identity.
 *
 * Auth tokens belong in tokenStorage, not in the user object kept in React
 * state or serialized under the cached profile key. The backend remains the
 * authority for authorization; this function is data minimization, not auth.
 */
const SENSITIVE_SESSION_KEYS = new Set([
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
  "token",
  "jwt",
  "authorization",
  "password",
  "password_hash",
  "apikey",
  "api_key",
  "secret",
  "privatekey",
  "private_key",
]);

export function sanitizeSessionIdentity(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeSessionIdentity);
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  const safe = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    const normalizedKey = key.replace(/[-\s]/g, "").toLowerCase();
    if (SENSITIVE_SESSION_KEYS.has(normalizedKey)) continue;
    safe[key] = sanitizeSessionIdentity(nestedValue);
  }
  return safe;
}
