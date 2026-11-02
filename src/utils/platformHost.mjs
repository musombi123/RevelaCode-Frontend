const BUILT_IN_PLATFORM_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "tauri.localhost",
  "revelacode.co.ke",
  "www.revelacode.co.ke",
]);

/**
 * Recognise first-party web and desktop hosts before custom-domain school routing.
 * Tauri 2 on Windows serves the production WebView from tauri.localhost.
 */
export function isRevelaCodePlatformHostname(
  hostname,
  configuredHostnames = [],
  isKnownHubHost = false
) {
  const normalizedHostname = String(hostname || "")
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");

  if (!normalizedHostname) return false;
  if (BUILT_IN_PLATFORM_HOSTS.has(normalizedHostname)) return true;
  if (isKnownHubHost) return true;
  if (normalizedHostname.endsWith(".onrender.com")) return true;

  const configured = new Set(
    (Array.isArray(configuredHostnames) ? configuredHostnames : [])
      .map((value) => String(value || "").trim().toLowerCase().replace(/\.$/, ""))
      .filter(Boolean)
  );

  return configured.has(normalizedHostname);
}
