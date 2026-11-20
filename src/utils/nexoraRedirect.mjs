const DEFAULT_NEXORA_FRONTEND_ORIGIN = "https://nexora.revelacode.co.ke";

/**
 * Redirect only the legacy NEXORA entry path to its separately hosted app.
 * All other RevelaCode routes remain untouched.
 */
export function createNexoraRedirectTarget(locationLike, origin = DEFAULT_NEXORA_FRONTEND_ORIGIN) {
  const pathname = String(locationLike?.pathname || "");
  if (pathname !== "/dev_nexora" && !pathname.startsWith("/dev_nexora/")) return null;
  const target = new URL("/", origin);
  target.search = String(locationLike?.search || "");
  target.hash = String(locationLike?.hash || "");
  return target.toString();
}
