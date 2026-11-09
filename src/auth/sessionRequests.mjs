/**
 * Decide whether a 401 is authoritative evidence that the user's primary
 * RevelaCode session is no longer valid.
 *
 * Connected services (RevelaAI, Core Mesh, academy APIs, etc.) may reject a
 * token because their own verifier/configuration is unavailable or mismatched.
 * Their responses must not clear the primary RevelaCode login.
 */
export function isAuthoritativeSessionCheck(
  requestUrl,
  authApiBaseUrl,
  method = "GET",
) {
  const base = String(authApiBaseUrl || "").trim();
  if (!base || String(method || "GET").toUpperCase() !== "GET") return false;

  try {
    const authBase = new URL(base);
    const request = new URL(String(requestUrl || ""), authBase);

    if (
      !["http:", "https:"].includes(authBase.protocol) ||
      request.origin !== authBase.origin
    ) {
      return false;
    }

    const pathname = request.pathname.replace(/\/+$/, "") || "/";
    return pathname === "/api/auth/me";
  } catch {
    return false;
  }
}


/**
 * Recognize only an explicit platform-session revocation returned by a
 * connected service that delegates identity validation to RevelaCode.
 * A generic 401 from an external service is not sufficient to log out.
 */
export function isExplicitRevokedSessionResponse(status, payload) {
  if (Number(status) !== 401 || !payload || typeof payload !== "object") {
    return false;
  }

  const nestedError = payload.error && typeof payload.error === "object"
    ? payload.error
    : {};
  const detail = payload.detail && typeof payload.detail === "object"
    ? payload.detail
    : {};
  const code = String(
    payload.code ||
    payload.error_code ||
    nestedError.code ||
    detail.code ||
    "",
  ).trim().toLowerCase();

  if (code === "session_revoked") return true;

  const message = [
    payload.message,
    typeof payload.error === "string" ? payload.error : "",
    nestedError.message,
    typeof payload.detail === "string" ? payload.detail : "",
    detail.message,
  ].filter(Boolean).join(" ").toLowerCase();

  return /this session has been revoked/.test(message);
}


/**
 * Prevent an in-flight request made with an older JWT from clearing a newer
 * authenticated session after the user signs in or refreshes in another task.
 */
export function isSameSessionCredential(currentToken, authorizationHeader) {
  const current = String(currentToken || "").trim().replace(/^Bearer\\s+/i, "");
  const attempted = String(authorizationHeader || "").trim().replace(/^\\S+\\s+/, "");
  return Boolean(current && attempted && current === attempted);
}
