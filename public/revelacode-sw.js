const CACHE_NAME = "revelacode-app-shell-v3";
const ROOT_URL = "/";

self.addEventListener("install", (event) => {
  // Never make installation wait for Cache Storage or a network request.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  // Take control immediately. Old shell-cache cleanup is best-effort and must
  // never prevent the new worker from activating.
  event.waitUntil(self.clients.claim().catch(() => {}));
  Promise.resolve()
    .then(() => caches.keys())
    .then((keys) => Promise.all(keys
      .filter((key) => key.startsWith("revelacode-app-shell-") && key !== CACHE_NAME)
      .map((key) => caches.delete(key))))
    .catch(() => {});
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (/^\/(api|auth|admin|socket\.io)(\/|$)/i.test(url.pathname)) return;

  const isNavigation = request.mode === "navigate";
  const isStaticAsset = /^\/(assets|fonts|icons|images)\//i.test(url.pathname);
  if (!isNavigation && !isStaticAsset) return;

  const cacheKey = isNavigation ? ROOT_URL : request;
  event.respondWith((async () => {
    // Network-first: Cache Storage must never delay a healthy network response.
    try {
      const response = await fetch(request);
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
