
import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext.jsx";

// =========================================================
// REVELACODE ADMIN API
// =========================================================
//
// Backend configuration must contain the backend ORIGIN,
// for example: https://revelacode-backend.onrender.com
//
// School verification uses the existing Jumuiya JWT auth bridge.
//
// IMPORTANT:
// Legacy /api/admin endpoints currently use API-key-based
// authorization on the backend. Do not expose ADMIN_API_KEY
// in frontend code or VITE environment variables.
// Those endpoints need a secure server-side authentication
// migration before they can be used by browser-based admin pages.
// =========================================================

const DEFAULT_BACKEND_URL =
  "https://revelacode-backend.onrender.com";

const ENV = import.meta.env || {};

export const ADMIN_ROUTES = Object.freeze({
  dashboard: "/api/admin/dashboard",
  users: "/api/admin/list-users",
  manageUsers: "/api/admin/manage-users",
  studyMaterials: "/api/admin/study/materials",
  studyStats: "/api/admin/study/stats",
  studyUpload: "/api/admin/study/upload",
  updatePolicy: "/api/admin/update-policy",
  updateScripture: "/api/admin/update-scripture",
  legalDocument: (docType) =>
    `/api/admin/legal/${encodeURIComponent(docType)}`,

  schoolApplications:
    "/api/jumuiya/elimu/verification/applications",

  reviewSchoolApplication: (applicationId) =>
    `/api/jumuiya/elimu/verification/applications/${encodeURIComponent(
      String(applicationId),
    )}/review`,

  businessApplications: "/api/jumuiya/admin/businesses",
  reviewBusinessApplication: (businessId) =>
    `/api/jumuiya/admin/businesses/${encodeURIComponent(
      String(businessId),
    )}/verification`,
});

// =========================================================
// BACKEND URL
// =========================================================

export function resolveAdminBackendUrl() {
  const value =
    ENV.VITE_API_BASE_URL ||
    ENV.VITE_BACKEND_URL ||
    ENV.VITE_API_URL ||
    DEFAULT_BACKEND_URL;

  return String(value)
    .trim()
    .replace(/\/+$/, "");
}

// =========================================================
// HELPERS
// =========================================================

function buildQuery(params = {}) {
  if (params instanceof URLSearchParams) {
    const query = params.toString();
    return query ? `?${query}` : "";
  }

  const search = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (
          item !== undefined &&
          item !== null &&
          item !== ""
        ) {
          search.append(key, String(item));
        }
      });

      return;
    }

    search.set(key, String(value));
  });

  const query = search.toString();

  return query ? `?${query}` : "";
}

function isFormData(body) {
  return (
    typeof FormData !== "undefined" &&
    body instanceof FormData
  );
}

function isNativeBody(body) {
  return (
    typeof body === "string" ||
    isFormData(body) ||
    (typeof Blob !== "undefined" && body instanceof Blob) ||
    (typeof URLSearchParams !== "undefined" &&
      body instanceof URLSearchParams) ||
    (typeof ArrayBuffer !== "undefined" &&
      (body instanceof ArrayBuffer || ArrayBuffer.isView(body)))
  );
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.toLowerCase().includes("json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function getReadableErrorMessage(payload, status) {
  const candidates = [
    payload?.error?.message,
    payload?.detail?.message,
    payload?.message?.message,
    payload?.message,
    typeof payload?.error === "string" ? payload.error : null,
    typeof payload?.detail === "string" ? payload.detail : null,
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === "string" &&
      candidate.trim()
    ) {
      return candidate.trim();
    }
  }

  if (payload && typeof payload === "object") {
    const nested = payload.error ?? payload.detail;

    if (nested && typeof nested === "object") {
      try {
        const serialized = JSON.stringify(nested);

        if (serialized && serialized !== "{}") {
          return `Request failed: ${serialized}`;
        }
      } catch {
        // Use the HTTP status fallback below.
      }
    }
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }

  return `Admin API request failed with HTTP ${status}.`;
}

function makeApiError(response, payload, url, method) {
  const error = new Error(
    getReadableErrorMessage(payload, response.status),
  );

  error.name = "AdminApiError";
  error.status = response.status;
  error.payload = payload;
  error.url = url;
  error.method = method;

  return error;
}
function validateId(value, label) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    throw new Error(`${label} is required.`);
  }

  return encodeURIComponent(String(value).trim());
}

// =========================================================
// API CLIENT FACTORY
// =========================================================

export function createAdminApiClient({
  baseUrl = resolveAdminBackendUrl(),
  authFetch = null,
  fetchImpl = globalThis.fetch,
} = {}) {
  const origin = String(baseUrl)
    .trim()
    .replace(/\/+$/, "");

  const transport =
    typeof authFetch === "function"
      ? authFetch
      : fetchImpl;

  if (typeof transport !== "function") {
    throw new Error("Fetch is unavailable in this environment.");
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

    const url =
      `${origin}${path}` +
      buildQuery(params);

    const headers = new Headers(customHeaders);

    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    const requestOptions = {
      method: verb,
      headers,
      credentials,
      signal,
    };

    if (body !== undefined) {
      if (isNativeBody(body)) {
        requestOptions.body = body;

        // Let the browser set the multipart boundary.
        if (isFormData(body)) {
          headers.delete("Content-Type");
        } else if (
          typeof URLSearchParams !== "undefined" &&
          body instanceof URLSearchParams &&
          !headers.has("Content-Type")
        ) {
          headers.set(
            "Content-Type",
            "application/x-www-form-urlencoded;charset=UTF-8",
          );
        }
      } else {
        if (!headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }

        requestOptions.body = JSON.stringify(body);
      }
    }

    let response;

    try {
      response = await transport(url, requestOptions);
    } catch (error) {
      if (error?.name === "AbortError") {
        throw error;
      }

      const networkError = new Error(
        "Unable to connect to the RevelaCode backend. Check your connection and try again.",
      );

      networkError.name = "AdminApiNetworkError";
      networkError.cause = error;
      networkError.url = url;
      networkError.method = verb;

      throw networkError;
    }

    const payload = await parseResponse(response);

    if (!response.ok) {
      throw makeApiError(response, payload, url, verb);
    }

    return payload;
  }

  const get = (path, params, options = {}) =>
    request(path, {
      ...options,
      method: "GET",
      params,
    });

  const post = (path, body, options = {}) =>
    request(path, {
      ...options,
      method: "POST",
      body,
    });

  const put = (path, body, options = {}) =>
    request(path, {
      ...options,
      method: "PUT",
      body,
    });

  const patch = (path, body, options = {}) =>
    request(path, {
      ...options,
      method: "PATCH",
      body,
    });

  // =======================================================
  // SCHOOL VERIFICATION â€” JWT AUTHENTICATED
  // =======================================================

  const verification = {
    /**
     * Load school verification applications.
     *
     * Optional query:
     * { limit: 50 }
     *
     * The backend accepts limit values from 1 to 100.
     */
    getApplications: (params = {}, options = {}) =>
      get(
        ADMIN_ROUTES.schoolApplications,
        {
          limit: 50,
          ...params,
        },
        options,
      ),

    /**
     * Review a school verification application.
     *
     * Expected body:
     * {
     *   decision: "verified" | "rejected" | "needs_info",
     *   notes: "Review notes",
     *   checks: {}
     * }
     *
     * The backend's verification service validates the
     * decision and any required verification checks.
     */
    reviewApplication: (
      applicationId,
      data,
      options = {},
    ) => {
      const id = validateId(
        applicationId,
        "Application ID",
      );

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Review data must be an object.");
      }

      if (
        typeof data.decision !== "string" ||
        !data.decision.trim()
      ) {
        throw new Error("A review decision is required.");
      }

      return post(
        ADMIN_ROUTES.reviewSchoolApplication(id),
        {
          decision: data.decision.trim(),
          notes: data.notes ?? "",
          checks: data.checks ?? {},
        },
        options,
      );
    },
    },

    /**
     * Load Biashara business applications from the platform-admin directory.
     * Defaults to pending applications while preserving page/limit filters.
     */
    getBusinessApplications: (params = {}, options = {}) =>
      get(
        ADMIN_ROUTES.businessApplications,
        {
          page: 1,
          limit: 100,
          status: "pending",
          ...params,
        },
        options,
      ),

    /**
     * Apply a platform-admin decision to a business application.
     */
    reviewBusinessApplication: (businessId, data, options = {}) => {
      const id = validateId(businessId, "Business ID");

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Review data must be an object.");
      }

      if (typeof data.decision !== "string" || !data.decision.trim()) {
        throw new Error("A review decision is required.");
      }

      return patch(
        ADMIN_ROUTES.reviewBusinessApplication(id),
        {
          decision: data.decision.trim(),
          notes: data.notes ?? "",
          checks: data.checks ?? {},
        },
        options,
      );
    },
  };

  // =======================================================
  // EXISTING PLATFORM ADMIN ROUTES
  // =======================================================
  //
  // These URLs match your route inventory.
  // The legacy /api/admin backend functions currently use
  // X-API-KEY authorization, unlike school verification.
  // Do not add a privileged key to this frontend client.
  // Migrate those backend routes to authenticated JWT roles
  // before relying on them in browser admin pages.
  // =======================================================

  const platform = {
    getDashboard: (options = {}) =>
      get(ADMIN_ROUTES.dashboard, undefined, options),

    listUsers: (params = {}, options = {}) =>
      get(ADMIN_ROUTES.users, params, options),

    manageUsers: (data, options = {}) =>
      post(ADMIN_ROUTES.manageUsers, data, options),

    updatePolicy: (data, options = {}) =>
      post(ADMIN_ROUTES.updatePolicy, data, options),

    updateScripture: (data, options = {}) =>
      post(ADMIN_ROUTES.updateScripture, data, options),

    listStudyMaterials: (params = {}, options = {}) =>
      get(ADMIN_ROUTES.studyMaterials, params, options),

    getStudyStats: (options = {}) =>
      get(ADMIN_ROUTES.studyStats, undefined, options),

    /**
     * Accepts either:
     * - FormData for a file upload.
     * - A JSON-compatible object for text material.
     */
    uploadStudyMaterial: (data, options = {}) =>
      post(ADMIN_ROUTES.studyUpload, data, options),

    updateLegalDocument: (docType, data, options = {}) =>
      put(
        ADMIN_ROUTES.legalDocument(
          validateId(docType, "Document type"),
        ),
        data,
        options,
      ),
  };

  return {
    request,
    get,
    post,
    put,
    patch,
    verification,
    platform,
    routes: ADMIN_ROUTES,
  };
}

// =========================================================
// REACT HOOK
// =========================================================

export function useAdminApi() {
  const auth = useAuth();

  const authFetch = auth?.authFetch;

  return useMemo(
    () =>
      createAdminApiClient({
        baseUrl: resolveAdminBackendUrl(),
        authFetch,
      }),
    [authFetch],
  );
}

export default useAdminApi;
