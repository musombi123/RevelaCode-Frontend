import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext.jsx";

const DEFAULT_BACKEND_URL = "https://revelacode-backend.onrender.com";
const ENV = import.meta.env || {};

export function resolveRevenueBackendUrl() {
  return String(
    ENV.VITE_API_BASE_URL ||
      ENV.VITE_BACKEND_URL ||
      ENV.VITE_API_URL ||
      ENV.VITE_REVELACODE_URL ||
      DEFAULT_BACKEND_URL,
  )
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/jumuiya$/i, "")
    .replace(/\/api$/i, "");
}

function queryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

function newIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `rev-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

async function readPayload(response) {
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.toLowerCase().includes("json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  const text = await response.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function apiError(response, payload, url, method) {
  const rawError = payload?.error;
  const error = new Error(
    (typeof rawError === "string" ? rawError : rawError?.message) ||
      payload?.message ||
      payload?.detail ||
      `Revenue request failed with HTTP ${response.status}.`,
  );
  error.name = "RevenueApiError";
  error.status = response.status;
  error.code = payload?.code || rawError?.code || `http_${response.status}`;
  error.payload = payload;
  error.url = url;
  error.method = method;
  return error;
}

export function createRevenueApiClient({
  baseUrl = resolveRevenueBackendUrl(),
  authFetch = null,
  fetchImpl = globalThis.fetch,
} = {}) {
  const origin = String(baseUrl || DEFAULT_BACKEND_URL).trim().replace(/\/+$/, "");
  const transport = typeof authFetch === "function" ? authFetch : fetchImpl;

  if (typeof transport !== "function") {
    throw new Error("Fetch is unavailable; the Revenue API cannot make requests.");
  }

  async function request(path, options = {}) {
    const {
      method = "GET",
      params,
      body,
      headers: customHeaders = {},
      signal,
      credentials = "include",
    } = options;
    const verb = String(method).toUpperCase();
    const url = `${origin}/api/revenue${path}${queryString(params)}`;
    const headers = new Headers(customHeaders);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");

    const init = { method: verb, headers, credentials, signal };
    if (body !== undefined) {
      headers.set("Content-Type", "application/json");
      init.body = JSON.stringify(body);
    }

    let response;
    try {
      response = await transport(url, init);
    } catch (cause) {
      if (cause?.name === "AbortError") throw cause;
      const error = new Error(
        "Cannot reach the Revenue Engine. Check the backend URL, CORS, and network connection.",
      );
      error.name = "RevenueApiNetworkError";
      error.cause = cause;
      error.url = url;
      error.method = verb;
      throw error;
    }

    const payload = await readPayload(response);
    if (!response.ok) throw apiError(response, payload, url, verb);
    if (payload?.success === false) throw apiError(response, payload, url, verb);
    return payload;
  }

  return {
    request,
    health: (options = {}) => request("/health", options),
    listTrials: (options = {}) => request("/trials", options),
    startTrial: (hub, options = {}) => request("/trials/start", { ...options, method: "POST", body: { hub } }),
    getEntitlement: (hub, options = {}) => request("/entitlements", { ...options, params: { ...(options.params || {}), hub } }),
    listPlans: (hub, options = {}) =>
      request("/plans", {
        ...options,
        params: { ...(options.params || {}), hub: hub || undefined },
      }),
    previewFee: (payload, options = {}) =>
      request("/fees/preview", { ...options, method: "POST", body: payload }),
    createIntent: (payload, options = {}) => {
      const { idempotencyKey = newIdempotencyKey(), ...requestOptions } = options;
      return request("/transactions/intents", {
        ...requestOptions,
        method: "POST",
        headers: {
          ...(requestOptions.headers || {}),
          "Idempotency-Key": idempotencyKey,
        },
        body: payload,
      });
    },
    startCheckout: (payload, options = {}) => {
      const { idempotencyKey = newIdempotencyKey(), ...requestOptions } = options;
      return request("/checkout", {
        ...requestOptions,
        method: "POST",
        headers: {
          ...(requestOptions.headers || {}),
          "Idempotency-Key": idempotencyKey,
        },
        body: payload,
      });
    },
    getCheckout: (checkoutId, options = {}) =>
      request(`/checkout/${encodeURIComponent(checkoutId)}`, options),
    refreshCheckout: (checkoutId, options = {}) =>
      request(`/checkout/${encodeURIComponent(checkoutId)}/refresh`, {
        ...options,
        method: "POST",
        body: {},
      }),
    listSubscriptions: (options = {}) => request("/subscriptions", options),
    adminBillingStatus: (options = {}) => request("/admin/billing/status", options),
    adminSubscriptions: ({ page = 1, perPage = 25, hub, status } = {}, options = {}) =>
      request("/admin/subscriptions", {
        ...options,
        params: { page, per_page: perPage, hub, status, ...(options.params || {}) },
      }),
    adminTrials: ({ page = 1, perPage = 25 } = {}, options = {}) =>
      request("/admin/trials", {
        ...options,
        params: { page, per_page: perPage, ...(options.params || {}) },
      }),
    adminPayments: ({ page = 1, perPage = 25, stream, provider } = {}, options = {}) =>
      request("/admin/payments", {
        ...options,
        params: { page, per_page: perPage, stream, provider, ...(options.params || {}) },
      }),
    adminPlans: (options = {}) => request("/admin/plans", options),
    updateAdminPlan: (planCode, payload, options = {}) =>
      request(`/admin/plans/${encodeURIComponent(planCode)}`, {
        ...options,
        method: "PUT",
        body: payload,
      }),
    listTransactions: ({ page = 1, perPage = 10 } = {}, options = {}) =>
      request("/transactions", {
        ...options,
        params: { page, per_page: perPage, ...(options.params || {}) },
      }),
  };
}

export function useRevenueApi() {
  const auth = useAuth();
  const authFetch = auth?.authFetch;

  return useMemo(
    () => createRevenueApiClient({ authFetch }),
    [authFetch],
  );
}

export default useRevenueApi;
