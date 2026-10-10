// src/services/jumuiyaApi.jsx

import { useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext.jsx";

// =========================================================
// BACKEND CONFIGURATION
// =========================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_REVELACODE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "";

function normalizeBackendBase(value) {
  let base = String(value || "").trim();

  if (!base) {
    return "";
  }

  base = base.replace(/\/+$/, "");
  base = base.replace(/\/api\/jumuiya$/i, "");
  base = base.replace(/\/api$/i, "");

  return base.replace(/\/+$/, "");
}

export const BASE_URL = normalizeBackendBase(API_URL);
export const API_ROOT = `${BASE_URL}/api/jumuiya`;

// =========================================================
// CUSTOM API ERROR
// =========================================================

export class JumuiyaAPIError extends Error {
  constructor(
    message,
    status = 0,
    code = "request_failed",
    details = null,
  ) {
    super(message);

    this.name = "JumuiyaAPIError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// =========================================================
// PATH AND QUERY HELPERS
// =========================================================

function normalizeApiPath(path) {
  const rawPath = String(path || "").trim();

  if (!rawPath) {
    return "";
  }

  if (/^https?:\/\//i.test(rawPath)) {
    throw new JumuiyaAPIError(
      "Pass an API path, not a complete external URL.",
      0,
      "invalid_api_path",
    );
  }

  if (/^\/api\/jumuiya(?:\/|$)/i.test(rawPath)) {
    return rawPath.replace(/^\/api\/jumuiya/i, "");
  }

  return rawPath.startsWith("/")
    ? rawPath
    : `/${rawPath}`;
}

function withQuery(path, values = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (
          item !== undefined &&
          item !== null &&
          item !== ""
        ) {
          params.append(key, String(item));
        }
      });

      continue;
    }

    params.set(key, String(value));
  }

  const query = params.toString();

  return query ? `${path}?${query}` : path;
}

function encodeId(value, name = "ID") {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    throw new JumuiyaAPIError(
      `${name} is required for this request.`,
      0,
      "missing_resource_id",
    );
  }

  return encodeURIComponent(String(value));
}

function isFormData(value) {
  return (
    typeof FormData !== "undefined" &&
    value instanceof FormData
  );
}

// =========================================================
// RESPONSE PARSER
// =========================================================

async function parseResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  let payload = null;

  if (response.status !== 204) {
    if (contentType.toLowerCase().includes("json")) {
      payload = await response.json().catch(() => null);
    } else {
      const responseText = await response
        .text()
        .catch(() => "");

      if (responseText) {
        payload = {
          message: responseText.slice(0, 2000),
        };

        // Support JSON responses from servers with a missing
        // or incorrect content-type header.
        try {
          payload = JSON.parse(responseText);
        } catch {
          // Keep the response text as a message.
        }
      }
    }
  }

  if (!response.ok) {
    const errorData = payload?.error;

    const message =
      errorData?.message ||
      payload?.message ||
      payload?.detail ||
      `Request failed with HTTP ${response.status}.`;

    throw new JumuiyaAPIError(
      message,
      response.status,
      errorData?.code ||
        payload?.code ||
        `http_${response.status}`,
      errorData?.details ||
        payload?.details ||
        null,
    );
  }

  if (payload?.success === false) {
    throw new JumuiyaAPIError(
      payload?.error?.message ||
        payload?.message ||
        "The Jumuiya API rejected the request.",
      response.status,
      payload?.error?.code || "request_failed",
      payload?.error?.details || null,
    );
  }

  return payload;
}

// =========================================================
// RESPONSE DATA NORMALIZATION
// =========================================================

export function extractData(payload) {
  if (
    payload &&
    typeof payload === "object" &&
    Object.prototype.hasOwnProperty.call(payload, "data")
  ) {
    return payload.data;
  }

  return payload;
}

// =========================================================
// CENTRAL REQUEST ENGINE
// =========================================================

async function performRequest(
  fetcher,
  path,
  options = {},
) {
  if (!BASE_URL) {
    throw new JumuiyaAPIError(
      "The Jumuiya backend URL is not configured. Set VITE_API_URL, VITE_REVELACODE_URL, or VITE_BACKEND_URL.",
      0,
      "backend_url_missing",
    );
  }

  let parsedBase;

  try {
    parsedBase = new URL(BASE_URL);
  } catch {
    throw new JumuiyaAPIError(
      "The configured backend URL is invalid. Set an environment variable to a valid backend origin.",
      0,
      "backend_url_invalid",
      {
        configuredBase: BASE_URL,
      },
    );
  }

  if (!["https:", "http:"].includes(parsedBase.protocol)) {
    throw new JumuiyaAPIError(
      "The backend URL must use HTTP or HTTPS.",
      0,
      "backend_protocol_invalid",
    );
  }

  const normalizedPath = normalizeApiPath(path);
  const url = `${API_ROOT}${normalizedPath}`;

  const {
    body,
    headers = {},
    ...rest
  } = options;

  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  let requestBody = body;

  if (
    body !== undefined &&
    body !== null &&
    !isFormData(body) &&
    typeof body !== "string" &&
    !(body instanceof URLSearchParams)
  ) {
    requestBody = JSON.stringify(body);

    if (!requestHeaders.has("Content-Type")) {
      requestHeaders.set(
        "Content-Type",
        "application/json",
      );
    }
  }

  if (typeof fetcher !== "function") {
    throw new JumuiyaAPIError(
      "Authentication request support is unavailable. Check AuthContext.jsx.",
      0,
      "fetcher_unavailable",
    );
  }

  let response;

  try {
    response = await fetcher(url, {
      ...rest,
      headers: requestHeaders,
      body: requestBody,
    });
  } catch (cause) {
    const originalMessage =
      cause?.message || "Unknown browser network error";

    console.error("[Jumuiya API] Network request failed.", {
      method: rest.method || "GET",
      url,
      message: originalMessage,
      hint:
        "Check the configured backend URL, server availability, CORS, TLS, network connectivity, and backend logs.",
    });

    throw new JumuiyaAPIError(
      `Unable to reach the Jumuiya backend at ${url}. The browser received no HTTP response. Check the backend URL, availability, and CORS configuration.`,
      0,
      "network_error",
      {
        url,
        method: rest.method || "GET",
        cause: originalMessage,
      },
    );
  }

  return parseResponse(response);
}

// =========================================================
// MAIN JUMUIYA API HOOK
//
// Responsibilities:
//   Identity
//   Wallet
//   Marketplace
//   Biashara
//   Shamba
//   Community
//
// Elimu has its own service in:
//   src/services/elimuApi.jsx
// =========================================================

export function useJumuiyaApi() {
  const {
    authFetch,
    getAccessToken,
    isAuthenticated,
    isGuest,
  } = useAuth();

  // -------------------------------------------------------
  // REQUEST
  // -------------------------------------------------------

  const request = useCallback(
    (path, options = {}) =>
      performRequest(authFetch, path, options),
    [authFetch],
  );

  // -------------------------------------------------------
  // HTTP METHODS
  // -------------------------------------------------------

  const get = useCallback(
    (path, options = {}) =>
      request(path, {
        ...options,
        method: "GET",
      }),
    [request],
  );

  const post = useCallback(
    (path, body = {}, options = {}) =>
      request(path, {
        ...options,
        method: "POST",
        body,
      }),
    [request],
  );

  const put = useCallback(
    (path, body = {}, options = {}) =>
      request(path, {
        ...options,
        method: "PUT",
        body,
      }),
    [request],
  );

  const patch = useCallback(
    (path, body = {}, options = {}) =>
      request(path, {
        ...options,
        method: "PATCH",
        body,
      }),
    [request],
  );

  const del = useCallback(
    (path, options = {}) =>
      request(path, {
        ...options,
        method: "DELETE",
      }),
    [request],
  );

  // -------------------------------------------------------
  // DATA HELPERS
  // -------------------------------------------------------

  const getData = useCallback(
    async (path, options) =>
      extractData(await get(path, options)),
    [get],
  );

  const postData = useCallback(
    async (path, data = {}) =>
      extractData(await post(path, data)),
    [post],
  );

  const putData = useCallback(
    async (path, data = {}) =>
      extractData(await put(path, data)),
    [put],
  );

  const patchData = useCallback(
    async (path, data = {}) =>
      extractData(await patch(path, data)),
    [patch],
  );

  const deleteData = useCallback(
    async (path, options = {}) =>
      extractData(await del(path, options)),
    [del],
  );

  // -------------------------------------------------------
  // STABLE PUBLIC API
  // -------------------------------------------------------

  return useMemo(
    () => ({
      // ===================================================
      // GENERIC HTTP
      // ===================================================

      request,
      get,
      post,
      put,
      patch,
      del,

      isAuthenticated,
      isGuest,
      getAccessToken,

      // ===================================================
      // IDENTITY
      // ===================================================

      getIdentity: () =>
        getData("/identity/me"),

      updateIdentityProfile: (data) =>
        putData("/identity/profile", data),

      // ===================================================
      // WALLET
      // ===================================================

      getWalletLedger: () =>
        getData("/wallet/ledger"),

      recordWalletTransaction: (data) =>
        postData("/wallet/transactions", data),

      // ===================================================
      // MARKETPLACE
      // ===================================================

      getMarketplaceListings: (
        { hub = "", category = "" } = {},
      ) =>
        getData(
          withQuery("/marketplace/listings", {
            hub,
            category,
          }),
        ),

      createMarketplaceListing: (data) =>
        postData("/marketplace/listings", data),

      deleteMarketplaceListing: (listingId) =>
        deleteData(
          `/marketplace/listings/${encodeId(listingId, "Listing ID")}`,
        ),

      // ===================================================
      // BIASHARA — BUSINESS
      // ===================================================

      getBiasharaHealth: () =>
        getData("/biashara/health"),

      getBusiness: () =>
        getData("/biashara/business"),

      getBiasharaBusiness: () =>
        getData("/biashara/business"),

      saveBusiness: (data) =>
        postData("/biashara/business", data),

      createBiasharaBusiness: (data) =>
        postData("/biashara/business", data),

      // ===================================================
      // BIASHARA — PRODUCTS
      // ===================================================

      getProducts: (
        {
          status = "",
          category = "",
          search = "",
          limit = 50,
        } = {},
      ) =>
        getData(
          withQuery("/biashara/products", {
            status,
            category,
            search,
            limit,
          }),
        ),

      getBiasharaProducts: (
        {
          status = "",
          category = "",
          search = "",
          limit = 50,
        } = {},
      ) =>
        getData(
          withQuery("/biashara/products", {
            status,
            category,
            search,
            limit,
          }),
        ),

      createProduct: (data) =>
        postData("/biashara/products", data),

      createBiasharaProduct: (data) =>
        postData("/biashara/products", data),

      updateProduct: (productId, data) =>
        putData(
          `/biashara/products/${encodeId(productId, "Product ID")}`,
          data,
        ),

      updateBiasharaProduct: (productId, data) =>
        putData(
          `/biashara/products/${encodeId(productId, "Product ID")}`,
          data,
        ),

      deleteProduct: (productId) =>
        deleteData(
          `/biashara/products/${encodeId(productId, "Product ID")}`,
        ),

      deleteBiasharaProduct: (productId) =>
        deleteData(
          `/biashara/products/${encodeId(productId, "Product ID")}`,
        ),

      // ===================================================
      // BIASHARA — INVENTORY
      // ===================================================

      getLowStockProducts: (threshold) =>
        getData(
          withQuery("/biashara/inventory/low-stock", {
            threshold,
          }),
        ),

      getBiasharaLowStock: (threshold) =>
        getData(
          withQuery("/biashara/inventory/low-stock", {
            threshold,
          }),
        ),

      adjustInventory: (productId, data) =>
        postData(
          `/biashara/inventory/${encodeId(productId, "Product ID")}/adjust`,
          data,
        ),

      adjustBiasharaInventory: (productId, data) =>
        postData(
          `/biashara/inventory/${encodeId(productId, "Product ID")}/adjust`,
          data,
        ),

      getInventoryHistory: (
        { productId = "", limit = 50 } = {},
      ) =>
        getData(
          withQuery("/biashara/inventory/history", {
            product_id: productId,
            limit,
          }),
        ),

      getBiasharaInventoryHistory: (
        { productId = "", limit = 50 } = {},
      ) =>
        getData(
          withQuery("/biashara/inventory/history", {
            product_id: productId,
            limit,
          }),
        ),

      // ===================================================
      // BIASHARA — CUSTOMERS
      // ===================================================

      getCustomers: (
        { search = "", limit = 50 } = {},
      ) =>
        getData(
          withQuery("/biashara/customers", {
            search,
            limit,
          }),
        ),

      getBiasharaCustomers: (
        { search = "", limit = 50 } = {},
      ) =>
        getData(
          withQuery("/biashara/customers", {
            search,
            limit,
          }),
        ),

      createCustomer: (data) =>
        postData("/biashara/customers", data),

      createBiasharaCustomer: (data) =>
        postData("/biashara/customers", data),

      // ===================================================
      // BIASHARA — ORDERS
      // ===================================================

      getOrders: (
        { status = "", limit = 50 } = {},
      ) =>
        getData(
          withQuery("/biashara/orders", {
            status,
            limit,
          }),
        ),

      getBiasharaOrders: (
        { status = "", limit = 50 } = {},
      ) =>
        getData(
          withQuery("/biashara/orders", {
            status,
            limit,
          }),
        ),

      createOrder: (data) =>
        postData("/biashara/orders", data),

      createBiasharaOrder: (data) =>
        postData("/biashara/orders", data),

      getOrder: (orderId) =>
        getData(
          `/biashara/orders/${encodeId(orderId, "Order ID")}`,
        ),

      getBiasharaOrder: (orderId) =>
        getData(
          `/biashara/orders/${encodeId(orderId, "Order ID")}`,
        ),

      updateOrderStatus: (orderId, status) =>
        patchData(
          `/biashara/orders/${encodeId(orderId, "Order ID")}/status`,
          { status },
        ),

      updateBiasharaOrderStatus: (orderId, status) =>
        patchData(
          `/biashara/orders/${encodeId(orderId, "Order ID")}/status`,
          { status },
        ),

      // ===================================================
      // BIASHARA — SALES
      // ===================================================

      recordSale: (data) =>
        postData("/biashara/sales", data),

      recordBiasharaSale: (data) =>
        postData("/biashara/sales", data),

      // ===================================================
      // BIASHARA — EXPENSES
      // ===================================================

      getExpenses: ({ limit = 50 } = {}) =>
        getData(
          withQuery("/biashara/expenses", { limit }),
        ),

      getBiasharaExpenses: ({ limit = 50 } = {}) =>
        getData(
          withQuery("/biashara/expenses", { limit }),
        ),

      createExpense: (data) =>
        postData("/biashara/expenses", data),

      createBiasharaExpense: (data) =>
        postData("/biashara/expenses", data),

      // ===================================================
      // BIASHARA — DASHBOARD
      // ===================================================

      getBiasharaDashboard: () =>
        getData("/biashara/dashboard"),

      // ===================================================
      // SHAMBA — HEALTH AND FARMER
      // ===================================================

      getShambaHealth: () =>
        getData("/shamba/health"),

      getFarmer: () =>
        getData("/shamba/farmer"),

      saveFarmer: (data) =>
        postData("/shamba/farmer", data),

      // ===================================================
      // SHAMBA — FARMS
      // ===================================================

      getFarms: () =>
        getData("/shamba/farms"),

      createFarm: (data) =>
        postData("/shamba/farms", data),

      getFarm: (farmId) =>
        getData(
          `/shamba/farms/${encodeId(farmId, "Farm ID")}`,
        ),

      updateFarm: (farmId, data) =>
        putData(
          `/shamba/farms/${encodeId(farmId, "Farm ID")}`,
          data,
        ),

      deleteFarm: (farmId) =>
        deleteData(
          `/shamba/farms/${encodeId(farmId, "Farm ID")}`,
        ),

      // ===================================================
      // SHAMBA — LOCATION
      // ===================================================

      updateFarmLocation: (
        farmId,
        {
          latitude,
          longitude,
          accuracy = null,
          source = "browser_gps",
          county = "",
          town = "",
          location = "",
        } = {},
      ) =>
        putData(
          `/shamba/farms/${encodeId(farmId, "Farm ID")}/location`,
          {
            latitude,
            longitude,
            accuracy,
            source,
            county,
            town,
            location,
          },
        ),

      // ===================================================
      // SHAMBA — CROPS
      // ===================================================

      getCrops: (farmId) =>
        getData(
          `/shamba/farms/${encodeId(farmId, "Farm ID")}/crops`,
        ),

      createCrop: (farmId, data) =>
        postData(
          `/shamba/farms/${encodeId(farmId, "Farm ID")}/crops`,
          data,
        ),

      getCropAnalysis: (farmId, cropId) =>
        getData(
          `/shamba/farms/${encodeId(farmId, "Farm ID")}/crops/${encodeId(cropId, "Crop ID")}/analysis`,
        ),

      // ===================================================
      // SHAMBA — FARM ACTIVITIES
      // ===================================================

      getFarmActivities: (farmId) =>
        getData(
          `/shamba/farms/${encodeId(farmId, "Farm ID")}/activities`,
        ),

      createFarmActivity: (farmId, data) =>
        postData(
          `/shamba/farms/${encodeId(farmId, "Farm ID")}/activities`,
          data,
        ),

      // ===================================================
      // SHAMBA — HARVESTS
      // ===================================================

      getHarvests: (farmId) =>
        getData(
          `/shamba/farms/${encodeId(farmId, "Farm ID")}/harvests`,
        ),

      createHarvest: (farmId, data) =>
        postData(
          `/shamba/farms/${encodeId(farmId, "Farm ID")}/harvests`,
          data,
        ),

      // ===================================================
      // SHAMBA — COMMAND CENTER
      // ===================================================

      getFarmCommandCenter: (farmId) =>
        getData(
          `/shamba/farms/${encodeId(farmId, "Farm ID")}/command-center`,
        ),

      // ===================================================
      // SHAMBA — INSIGHTS
      // ===================================================

      getFarmInsights: (farmId) =>
        getData(
          `/shamba/farms/${encodeId(farmId, "Farm ID")}/insights`,
        ),

      refreshFarmIntelligence: (farmId) =>
        postData(
          `/shamba/farms/${encodeId(farmId, "Farm ID")}/insights/refresh`,
        ),

      // ===================================================
      // SHAMBA — RECOMMENDATIONS
      // ===================================================

      getFarmRecommendations: (
        farmId,
        {
          category = "",
          priority = "",
          cropId = "",
        } = {},
      ) =>
        getData(
          withQuery(
            `/shamba/farms/${encodeId(farmId, "Farm ID")}/recommendations`,
            {
              category,
              priority,
              crop_id: cropId,
            },
          ),
        ),

      createFarmRecommendation: (farmId, data) =>
        postData(
          `/shamba/farms/${encodeId(farmId, "Farm ID")}/recommendations`,
          data,
        ),

      // ===================================================
      // SHAMBA — ALERTS
      // ===================================================

      getFarmAlerts: (
        farmId,
        {
          unreadOnly = false,
          severity = "",
        } = {},
      ) =>
        getData(
          withQuery(
            `/shamba/farms/${encodeId(farmId, "Farm ID")}/alerts`,
            {
              unread: unreadOnly ? "true" : "",
              severity,
            },
          ),
        ),

      getFarmAlertSummary: (farmId) =>
        getData(
          `/shamba/farms/${encodeId(farmId, "Farm ID")}/alerts/summary`,
        ),

      markFarmAlertRead: (farmId, alertId) =>
        putData(
          `/shamba/farms/${encodeId(farmId, "Farm ID")}/alerts/${encodeId(alertId, "Alert ID")}/read`,
        ),

      // ===================================================
      // SHAMBA — WEATHER AND MARKET
      // ===================================================

      getFarmWeather: (farmId) =>
        getData(
          `/shamba/farms/${encodeId(farmId, "Farm ID")}/weather`,
        ),

      getFarmMarket: (farmId) =>
        getData(
          `/shamba/farms/${encodeId(farmId, "Farm ID")}/market`,
        ),

      // ===================================================
      // SHAMBA — REVELAAI CONTEXT
      // ===================================================

      getFarmAIContext: (farmId) =>
        getData(
          `/shamba/farms/${encodeId(farmId, "Farm ID")}/ai-context`,
        ),

      // ===================================================
      // SHAMBA — DASHBOARD
      // ===================================================

      getShambaDashboard: () =>
        getData("/shamba/dashboard"),

      // ===================================================
      // COMMUNITY — HEALTH AND FEED
      // ===================================================

      getCommunityHealth: () =>
        getData("/community/health"),

      getCommunityFeed: (
        {
          category = "",
          hub = "",
          limit = 30,
        } = {},
      ) =>
        getData(
          withQuery("/community/feed", {
            category,
            hub,
            limit,
          }),
        ),

      // ===================================================
      // COMMUNITY — POSTS
      // ===================================================

      createCommunityPost: (data) =>
        postData("/community/posts", data),

      updateCommunityPost: (postId, data) =>
        putData(
          `/community/posts/${encodeId(postId, "Post ID")}`,
          data,
        ),

      deleteCommunityPost: (postId) =>
        deleteData(
          `/community/posts/${encodeId(postId, "Post ID")}`,
        ),

      // ===================================================
      // COMMUNITY — COMMENTS AND REACTIONS
      // ===================================================

      getCommunityComments: (postId, limit = 100) =>
        getData(
          withQuery(
            `/community/posts/${encodeId(postId, "Post ID")}/comments`,
            { limit },
          ),
        ),

      addCommunityComment: (postId, body) =>
        postData(
          `/community/posts/${encodeId(postId, "Post ID")}/comments`,
          { body },
        ),

      reactToCommunityPost: (postId) =>
        postData(
          `/community/posts/${encodeId(postId, "Post ID")}/react`,
        ),

      // ===================================================
      // COMMUNITY — WHATSAPP PREFERENCES
      // ===================================================

      getCommunityContactPreferences: () =>
        getData("/community/contact-preferences"),

      saveCommunityContactPreferences: (data = {}) =>
        putData("/community/contact-preferences", {
          enabled: Boolean(data.enabled),
          phone_number: String(data.phone_number || "").trim(),
        }),

      getCommunityWhatsAppContact: (
        memberId,
        postId = null,
      ) =>
        getData(
          withQuery(
            `/community/members/${encodeId(memberId, "Member ID")}/whatsapp-contact`,
            {
              post_id: postId,
            },
          ),
        ),
    }),
    [
      request,
      get,
      post,
      put,
      patch,
      del,
      getData,
      postData,
      putData,
      patchData,
      deleteData,
      isAuthenticated,
      isGuest,
      getAccessToken,
    ],
  );
}

// =========================================================
// OPTIONAL STATIC API CLIENT
// =========================================================

// Use this only outside React components.
// Authentication uses the JWT stored by AuthContext.

export async function jumuiyaRequest(path, options = {}) {
  let token = "";
  let tokenType = "Bearer";

  try {
    token =
      localStorage.getItem("revelacode_access_token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      "";

    tokenType =
      localStorage.getItem("revelacode_token_type") ||
      "Bearer";
  } catch {
    // Continue without a token; the backend controls access.
  }

  const {
    body,
    headers = {},
    ...rest
  } = options;

  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  if (
    token &&
    !requestHeaders.has("Authorization")
  ) {
    requestHeaders.set(
      "Authorization",
      `${tokenType} ${token}`,
    );
  }

  return performRequest(
    fetch,
    path,
    {
      ...rest,
      headers: requestHeaders,
      body,
    },
  );
}

export default useJumuiyaApi;