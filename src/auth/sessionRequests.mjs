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
