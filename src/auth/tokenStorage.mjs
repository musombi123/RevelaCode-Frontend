/**
 * Browser JWT persistence for RevelaCode.
 *
 * Access tokens use "revela_jwt" as the canonical key. The older keys remain
 * mirrored for compatibility with existing frontend modules. Closing a modal
 * must never clear these values; call clearStoredTokens only from logout.
 */

export const ACCESS_TOKEN_KEY = "revela_jwt";
export const REFRESH_TOKEN_KEY = "revela_refresh_token";
export const TOKEN_TYPE_KEY = "revelacode_token_type";

const ACCESS_TOKEN_ALIASES = [
  "revelacode_access_token",
  "access_token",
  "token",
];

function browserStorage(name) {
  try {
    return typeof globalThis !== "undefined" ? globalThis[name] || null : null;
  } catch {
    return null;
  }
}

function safeGet(storage, key) {
  try {
    return storage?.getItem(key) || "";
  } catch {
    return "";
  }
}

function safeSet(storage, key, value) {
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(storage, key) {
  try {
    storage?.removeItem(key);
  } catch {
    // Storage can be disabled by browser privacy settings.
  }
}

export function readAccessToken(
  localStorageRef = browserStorage("localStorage"),
  sessionStorageRef = browserStorage("sessionStorage"),
) {
  for (const storage of [localStorageRef, sessionStorageRef]) {
    for (const key of [ACCESS_TOKEN_KEY, ...ACCESS_TOKEN_ALIASES]) {
      const value = safeGet(storage, key).trim();
      if (value) return value.replace(/^Bearer\s+/i, "");
    }
  }
  return "";
}

export function readRefreshToken(
  localStorageRef = browserStorage("localStorage"),
  sessionStorageRef = browserStorage("sessionStorage"),
) {
  return (
    safeGet(localStorageRef, REFRESH_TOKEN_KEY).trim() ||
    safeGet(sessionStorageRef, REFRESH_TOKEN_KEY).trim()
  );
}

export function readTokenType(
  localStorageRef = browserStorage("localStorage"),
  sessionStorageRef = browserStorage("sessionStorage"),
) {
  return (
    safeGet(localStorageRef, TOKEN_TYPE_KEY).trim() ||
    safeGet(sessionStorageRef, TOKEN_TYPE_KEY).trim() ||
    "Bearer"
  );
}

export function persistTokens(
  { accessToken, tokenType = "Bearer", refreshToken = "" } = {},
  localStorageRef = browserStorage("localStorage"),
  sessionStorageRef = browserStorage("sessionStorage"),
) {
  const token = String(accessToken || "").trim().replace(/^Bearer\s+/i, "");
  if (!token) return false;

  const normalizedType = String(tokenType || "Bearer").trim() || "Bearer";
  const localSaved = safeSet(localStorageRef, ACCESS_TOKEN_KEY, token);

  for (const key of ACCESS_TOKEN_ALIASES) {
    safeSet(localStorageRef, key, token);
  }
  safeSet(localStorageRef, TOKEN_TYPE_KEY, normalizedType);
  if (refreshToken) {
    safeSet(localStorageRef, REFRESH_TOKEN_KEY, String(refreshToken).trim());
  }

  // Fall back to session storage when localStorage is blocked.
  if (!localSaved) {
    safeSet(sessionStorageRef, ACCESS_TOKEN_KEY, token);
    safeSet(sessionStorageRef, TOKEN_TYPE_KEY, normalizedType);
    if (refreshToken) safeSet(sessionStorageRef, REFRESH_TOKEN_KEY, String(refreshToken).trim());
  }

  return localSaved || Boolean(safeGet(sessionStorageRef, ACCESS_TOKEN_KEY));
}

export function clearStoredTokens(
  localStorageRef = browserStorage("localStorage"),
  sessionStorageRef = browserStorage("sessionStorage"),
) {
  const keys = [ACCESS_TOKEN_KEY, ...ACCESS_TOKEN_ALIASES, TOKEN_TYPE_KEY, REFRESH_TOKEN_KEY];
  for (const storage of [localStorageRef, sessionStorageRef]) {
    for (const key of keys) safeRemove(storage, key);
  }
}
