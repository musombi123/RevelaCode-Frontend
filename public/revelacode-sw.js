const CACHE_NAME = "revelacode-app-shell-v4";
const ROOT_URL = "/";

self.addEventListener("install", (event) => {
  // Never make installation wait for Cache Storage or a network request.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  // Take control immediately. Old shell-cache cleanup is best-effort and must
  // never prevent the new worker from activating.
  event.waitUntil(Promise.all([
    self.clients.claim().catch(() => {}),
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("revelacode-app-shell-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .catch(() => {}),
  ]));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // NEXORA is served by an independent origin behind the /dev_nexora path proxy.
  // Do not intercept its navigation or assets with RevelaCode's shell cache.
  if (url.pathname === "/dev_nexora" || url.pathname.startsWith("/dev_nexora/")) return;
  if (/^\/(api|auth|admin|socket\.io)(\/|$)/i.test(url.pathname)) return;

  const isNavigation = request.mode === "navigate";
  const isStaticAsset = /^\/(assets|fonts|icons|images)\//i.test(url.pathname);
  if (!isNavigation && !isStaticAsset) return;

  const cacheKey = isNavigation ? ROOT_URL : request;
  event.respondWith((async () => {
    // Network-first: Cache Storage must never delay a healthy network response.
    try {
      const response = await fetch(request);
      const contentType = (response.headers.get("content-type") || "").toLowerCase();
      const isHtmlFallback = isStaticAsset && (
        contentType.includes("text/html") || contentType.includes("application/xhtml+xml")
      );
      const assetPath = url.pathname.toLowerCase();
      const isScriptAsset = assetPath.endsWith(".js") || assetPath.endsWith(".mjs");
      const isCssAsset = assetPath.endsWith(".css");
      const validScriptResponse = !isScriptAsset || (
        contentType.includes("javascript") || contentType.includes("ecmascript")
      );
      const validCssResponse = !isCssAsset || contentType.includes("text/css");

      // Some SPA hosts rewrite a missing /assets/*.js request to index.html
      // with HTTP 200. That is not a JavaScript module. Convert that specific
      // fallback into a real failure so safeLazy can fetch a fresh app shell.
      if (isHtmlFallback || !validScriptResponse || !validCssResponse) {
        return new Response("This asset is not present in the current RevelaCode release. Reload the application.", {
          status: 404,
          statusText: "Not Found",
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          },
        });
      }

      if (response && response.ok && (!isStaticAsset || response.type === "basic")) {
        // Opportunistic cache write only. Do not extend the fetch event or
        // make the returned response depend on Cache Storage succeeding.
        void caches.open(CACHE_NAME)
          .then((cache) => cache.put(cacheKey, response.clone()))
          .catch(() => {});
      }
      return response;
    } catch {
      // Offline fallback is also best-effort. A cache error must not crash the app.
      try {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(request)) ||
          (await cache.match(cacheKey)) ||
          Response.error();
      } catch {
        return Response.error();
      }
    }
  })());
});
