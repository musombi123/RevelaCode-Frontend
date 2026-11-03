import { getDemoPayload } from "./mockData.js";

let guardUsers = 0;
let originalFetch = null;
let originalSendBeacon = null;
let originalXhrOpen = null;
let originalXhrSend = null;
let patchedXhrPrototype = null;

function isWriteMethod(method) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(String(method || "GET").toUpperCase());
}

function isApiUrl(value) {
  try {
    const parsed = new URL(String(value), window.location.href);
    return /\/api(?:\/|$)/i.test(parsed.pathname) ||
      /\/(?:payments?|wallet|checkout|mpesa|daraja|transactions?)(?:\/|$)/i.test(parsed.pathname) ||
      /revelacode-backend|revelaai\.onrender\.com|stripe|mpesa|paystack|flutterwave|pesapal|intasend/i.test(parsed.hostname);
  } catch {
    return /\/api(?:\/|$)|\/(?:payments?|wallet|checkout|mpesa|daraja|transactions?)(?:\/|$)/i.test(String(value));
  }
}

function isAnalyticsUrl(value) {
  try {
    const parsed = new URL(String(value), window.location.href);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    const knownAnalyticsHost =
      /google-analytics|googletagmanager|posthog|segment|mixpanel|amplitude|plausible|matomo|rudderstack|datadog|newrelic|sentry|heap/i.test(host);
    const explicitAnalyticsPath =
      /^\/(?:api\/)?(?:analytics|telemetry|demo-analytics|demo-events)(?:\/|$)/i.test(path);
    return knownAnalyticsHost || explicitAnalyticsPath;
  } catch {
    return /^\/(?:api\/)?(?:analytics|telemetry|demo-analytics|demo-events)(?:\/|$)/i.test(String(value));
  }
}

function shouldMockRequest(method, url) {
  if (isAnalyticsUrl(url)) return false;
  const verb = String(method || "GET").toUpperCase();
  return isWriteMethod(verb) || (["GET", "HEAD"].includes(verb) && isApiUrl(url));
}

function makeFetchResponse(payload) {
  const body = JSON.stringify(payload);
  if (typeof Response === "function") {
    return new Response(body, {
      status: 200,
      statusText: "OK",
      headers: { "Content-Type": "application/json", "X-RevelaCode-Demo": "true" },
    });
  }
  return {
    ok: true, status: 200, statusText: "OK",
    headers: { get: (name) => String(name).toLowerCase() === "content-type" ? "application/json" : null },
    json: async () => payload,
    text: async () => body,
    clone() { return this; },
  };
}

function installFetchGuard() {
  if (typeof window === "undefined" || typeof window.fetch !== "function" || originalFetch) return;
  originalFetch = window.fetch;
  window.fetch = async function demoSafeFetch(input, init = {}) {
    const url = typeof input === "string" || input instanceof URL ? String(input) : input?.url || "";
    const method = String(init?.method || input?.method || "GET").toUpperCase();
    if (guardUsers > 0 && shouldMockRequest(method, url)) {
      const body = init?.body ?? null;
      return makeFetchResponse(getDemoPayload(url, method, body));
    }
    return originalFetch.call(window, input, init);
  };
}

function installXhrGuard() {
  if (typeof window === "undefined" || typeof XMLHttpRequest === "undefined" || patchedXhrPrototype) return;
  const prototype = XMLHttpRequest.prototype;
  originalXhrOpen = prototype.open;
  originalXhrSend = prototype.send;
  patchedXhrPrototype = prototype;

  prototype.open = function demoSafeOpen(method, url, ...rest) {
    this.__revelaDemoMethod = String(method || "GET").toUpperCase();
    this.__revelaDemoUrl = String(url || "");
    return originalXhrOpen.call(this, method, url, ...rest);
  };

  prototype.send = function demoSafeSend(body) {
    const method = this.__revelaDemoMethod || "GET";
    const url = this.__revelaDemoUrl || "";
    if (!(guardUsers > 0 && shouldMockRequest(method, url))) {
      return originalXhrSend.call(this, body);
    }

    const payload = getDemoPayload(url, method, body);
    const serialized = JSON.stringify(payload);
    let readyState = 1;
    let responseType = "";
    try { responseType = this.responseType || ""; } catch { responseType = ""; }

    try {
      Object.defineProperties(this, {
        readyState: { configurable: true, get: () => readyState },
        status: { configurable: true, get: () => readyState === 4 ? 200 : 0 },
        statusText: { configurable: true, get: () => readyState === 4 ? "OK" : "" },
        responseURL: { configurable: true, get: () => url },
        responseText: { configurable: true, get: () => responseType === "json" ? "" : serialized },
        response: { configurable: true, get: () => responseType === "json" ? payload : serialized },
      });
    } catch {
      // If a WebView does not permit instance accessors, event handlers still
      // receive a successful demo response through the fallback below.
    }

    this.getAllResponseHeaders = () => "content-type: application/json\r\nx-revelacode-demo: true\r\n";
    this.getResponseHeader = (name) => String(name).toLowerCase() === "content-type" ? "application/json" : null;
    window.setTimeout(() => {
      if (guardUsers < 1) return;
      readyState = 2;
      this.dispatchEvent(new Event("readystatechange"));
      readyState = 3;
      this.dispatchEvent(new Event("readystatechange"));
      readyState = 4;
      this.dispatchEvent(new Event("readystatechange"));
      this.dispatchEvent(new Event("load"));
      this.dispatchEvent(new Event("loadend"));
    }, 0);
    return undefined;
  };
}

function installBeaconGuard() {
  if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function" || originalSendBeacon) return;
  originalSendBeacon = navigator.sendBeacon;
  navigator.sendBeacon = function demoSafeBeacon() {
    // sendBeacon is POST-only; while the tour is active, acknowledge but never send it.
    if (guardUsers > 0 && !isAnalyticsUrl(arguments[0])) return true;
    return originalSendBeacon.apply(this, arguments);
  };
}

function restoreNetworkGuard() {
  if (originalFetch && typeof window !== "undefined") {
    window.fetch = originalFetch;
  }
  originalFetch = null;

  if (originalSendBeacon && typeof navigator !== "undefined") {
    navigator.sendBeacon = originalSendBeacon;
  }
  originalSendBeacon = null;

  if (patchedXhrPrototype) {
    patchedXhrPrototype.open = originalXhrOpen;
    patchedXhrPrototype.send = originalXhrSend;
  }
  originalXhrOpen = null;
  originalXhrSend = null;
  patchedXhrPrototype = null;
}

export function setDemoApiActive(active) {
  if (typeof window === "undefined") return () => {};
  if (active) {
    guardUsers += 1;
    installFetchGuard();
    installXhrGuard();
    installBeaconGuard();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      guardUsers = Math.max(0, guardUsers - 1);
      if (guardUsers === 0) restoreNetworkGuard();
    };
  }
  guardUsers = 0;
  restoreNetworkGuard();
  return () => {};
}

export function isDemoApiActive() {
  return guardUsers > 0;
}

export function trackDemo(eventName, detail = {}) {
  if (typeof window === "undefined") return;
  const analytics = window.revelacodeAnalytics || window.revelaAnalytics;
  if (analytics && typeof analytics.trackDemo === "function") {
    try { analytics.trackDemo(eventName, detail); } catch { /* analytics must never block a demo */ }
  }
}
