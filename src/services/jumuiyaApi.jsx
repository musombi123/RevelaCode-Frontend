// src/services/jumuiyaApi.jsx

import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext.jsx";

// =========================================================
// BACKEND CONFIGURATION
// =========================================================

// Environment variables should contain the backend origin,
// not the frontend URL and not a complete API endpoint.
const DEFAULT_BACKEND_URL =
  "https://revelacode-backend.onrender.com";

function normalizeBackendBase(value) {
  let base = String(value || "").trim();

  if (!base) {
    return "";
  }

  // Accept an origin, /api, or /api/jumuiya as the
  // configured URL without accidentally duplicating paths.
  base = base.replace(/\/+$/, "");
  base = base.replace(/\/api\/jumuiya$/i, "");
  base = base.replace(/\/api$/i, "");
  base = base.replace(/\/+$/, "");

  return base;
}

const configuredBackendUrl = [
  import.meta.env.VITE_REVELACODE_URL,
  import.meta.env.VITE_BACKEND_URL,
  import.meta.env.VITE_API_URL,
].find(
  (value) =>
    typeof value === "string" && value.trim().length > 0,
);

export const BASE_URL = normalizeBackendBase(
  configuredBackendUrl || DEFAULT_BACKEND_URL,
);

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

  // Avoid duplicating the API prefix when a caller already
  // passes /api/jumuiya/...
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

      payload = responseText
        ? { message: responseText.slice(0, 2000) }
        : null;
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
      "The Jumuiya backend URL is not configured.",
      0,
      "backend_url_missing",
    );
  }

  let parsedBase;

  try {
    parsedBase = new URL(BASE_URL);
  } catch {
    throw new JumuiyaAPIError(
      "The configured backend URL is invalid. Set VITE_REVELACODE_URL, VITE_BACKEND_URL, or VITE_API_URL to a valid backend origin.",
      0,
      "backend_url_invalid",
      { configuredBase: BASE_URL },
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

  const isFormData =
    typeof FormData !== "undefined" &&
    body instanceof FormData;

  if (
    body !== undefined &&
    body !== null &&
    !isFormData &&
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
        "Check the backend URL, server availability, browser CORS errors, TLS/network connectivity, and the backend logs.",
    });

    throw new JumuiyaAPIError(
      `Unable to reach the Jumuiya backend at ${url}. The browser received no HTTP response. Check backend availability, the configured URL, and backend CORS settings.`,
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
// MAIN HOOK
// =========================================================

export function useJumuiyaApi() {
  const {
    authFetch,
    getAccessToken,
    isAuthenticated,
    isGuest,
  } = useAuth();

  const request = useCallback(
    async (path, options = {}) =>
      performRequest(authFetch, path, options),
    [authFetch],
  );

  // =======================================================
  // GENERIC HTTP HELPERS
  // =======================================================

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

  // Data helpers centralize response unwrapping.
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
    async (path) =>
      extractData(await del(path)),
    [del],
  );

  // =======================================================
  // IDENTITY
  // =======================================================

  const getIdentity = useCallback(
    () => getData("/identity/me"),
    [getData],
  );

  const updateIdentityProfile = useCallback(
    (data) => putData("/identity/profile", data),
    [putData],
  );

  // =======================================================
  // WALLET
  // =======================================================

  const getWalletLedger = useCallback(
    () => getData("/wallet/ledger"),
    [getData],
  );

  const recordWalletTransaction = useCallback(
    (data) => postData("/wallet/transactions", data),
    [postData],
  );

  // =======================================================
  // MARKETPLACE
  // =======================================================

  const getMarketplaceListings = useCallback(
    ({ hub = "", category = "" } = {}) =>
      getData(
        withQuery("/marketplace/listings", {
          hub,
          category,
        }),
      ),
    [getData],
  );

  const createMarketplaceListing = useCallback(
    (data) => postData("/marketplace/listings", data),
    [postData],
  );

  const deleteMarketplaceListing = useCallback(
    (listingId) =>
      deleteData(
        `/marketplace/listings/${encodeId(listingId, "Listing ID")}`,
      ),
    [deleteData],
  );

  // =======================================================
  // BIASHARA — BUSINESS
  // =======================================================

  const getBiasharaHealth = useCallback(
    () => getData("/biashara/health"),
    [getData],
  );

  const getBusiness = useCallback(
    () => getData("/biashara/business"),
    [getData],
  );

  const getBiasharaBusiness = getBusiness;

  const saveBusiness = useCallback(
    (data) => postData("/biashara/business", data),
    [postData],
  );

  const createBiasharaBusiness = saveBusiness;

  // =======================================================
  // BIASHARA — PRODUCTS
  // =======================================================

  const getProducts = useCallback(
    ({
      status = "",
      category = "",
      search = "",
      limit = 50,
    } = {}) =>
      getData(
        withQuery("/biashara/products", {
          status,
          category,
          search,
          limit,
        }),
      ),
    [getData],
  );

  const getBiasharaProducts = getProducts;

  const createProduct = useCallback(
    (data) => postData("/biashara/products", data),
    [postData],
  );

  const createBiasharaProduct = createProduct;

  const updateProduct = useCallback(
    (productId, data) =>
      putData(
        `/biashara/products/${encodeId(productId, "Product ID")}`,
        data,
      ),
    [putData],
  );

  const updateBiasharaProduct = updateProduct;

  const deleteProduct = useCallback(
    (productId) =>
      deleteData(
        `/biashara/products/${encodeId(productId, "Product ID")}`,
      ),
    [deleteData],
  );

  const deleteBiasharaProduct = deleteProduct;

  // =======================================================
  // BIASHARA — INVENTORY
  // =======================================================

  const getLowStockProducts = useCallback(
    (threshold) =>
      getData(
        withQuery("/biashara/inventory/low-stock", {
          threshold,
        }),
      ),
    [getData],
  );

  const getBiasharaLowStock = getLowStockProducts;

  const adjustInventory = useCallback(
    (productId, data) =>
      postData(
        `/biashara/inventory/${encodeId(productId, "Product ID")}/adjust`,
        data,
      ),
    [postData],
  );

  const adjustBiasharaInventory = adjustInventory;

  const getInventoryHistory = useCallback(
    ({ productId = "", limit = 50 } = {}) =>
      getData(
        withQuery("/biashara/inventory/history", {
          product_id: productId,
          limit,
        }),
      ),
    [getData],
  );

  const getBiasharaInventoryHistory = getInventoryHistory;

  // =======================================================
  // BIASHARA — CUSTOMERS
  // =======================================================

  const getCustomers = useCallback(
    ({ search = "", limit = 50 } = {}) =>
      getData(
        withQuery("/biashara/customers", {
          search,
          limit,
        }),
      ),
    [getData],
  );

  const getBiasharaCustomers = getCustomers;

  const createCustomer = useCallback(
    (data) => postData("/biashara/customers", data),
    [postData],
  );

  const createBiasharaCustomer = createCustomer;

  // =======================================================
  // BIASHARA — ORDERS
  // =======================================================

  const getOrders = useCallback(
    ({ status = "", limit = 50 } = {}) =>
      getData(
        withQuery("/biashara/orders", {
          status,
          limit,
        }),
      ),
    [getData],
  );

  const getBiasharaOrders = getOrders;

  const createOrder = useCallback(
    (data) => postData("/biashara/orders", data),
    [postData],
  );

  const createBiasharaOrder = createOrder;

  const getOrder = useCallback(
    (orderId) =>
      getData(
        `/biashara/orders/${encodeId(orderId, "Order ID")}`,
      ),
    [getData],
  );

  const getBiasharaOrder = getOrder;

  const updateOrderStatus = useCallback(
    (orderId, status) =>
      patchData(
        `/biashara/orders/${encodeId(orderId, "Order ID")}/status`,
        { status },
      ),
    [patchData],
  );

  const updateBiasharaOrderStatus = updateOrderStatus;

  // =======================================================
  // BIASHARA — SALES
  // =======================================================

  const recordSale = useCallback(
    (data) => postData("/biashara/sales", data),
    [postData],
  );

  const recordBiasharaSale = recordSale;

  // =======================================================
  // BIASHARA — EXPENSES
  // =======================================================

  const getExpenses = useCallback(
    ({ limit = 50 } = {}) =>
      getData(
        withQuery("/biashara/expenses", { limit }),
      ),
    [getData],
  );

  const getBiasharaExpenses = getExpenses;

  const createExpense = useCallback(
    (data) => postData("/biashara/expenses", data),
    [postData],
  );

  const createBiasharaExpense = createExpense;

  // =======================================================
  // BIASHARA — DASHBOARD
  // =======================================================

  const getBiasharaDashboard = useCallback(
    () => getData("/biashara/dashboard"),
    [getData],
  );

  // =======================================================
  // SHAMBA — HEALTH AND FARMER
  // =======================================================

  const getShambaHealth = useCallback(
    () => getData("/shamba/health"),
    [getData],
  );

  const getFarmer = useCallback(
    () => getData("/shamba/farmer"),
    [getData],
  );

  const saveFarmer = useCallback(
    (data) => postData("/shamba/farmer", data),
    [postData],
  );

  // =======================================================
  // SHAMBA — FARMS
  // =======================================================

  const getFarms = useCallback(
    () => getData("/shamba/farms"),
    [getData],
  );

  const createFarm = useCallback(
    (data) => postData("/shamba/farms", data),
    [postData],
  );

  const getFarm = useCallback(
    (farmId) =>
      getData(`/shamba/farms/${encodeId(farmId, "Farm ID")}`),
    [getData],
  );

  const updateFarm = useCallback(
    (farmId, data) =>
      putData(
        `/shamba/farms/${encodeId(farmId, "Farm ID")}`,
        data,
      ),
    [putData],
  );

  const deleteFarm = useCallback(
    (farmId) =>
      deleteData(`/shamba/farms/${encodeId(farmId, "Farm ID")}`),
    [deleteData],
  );

  // =======================================================
  // SHAMBA — FARM LOCATION
  // =======================================================

  const updateFarmLocation = useCallback(
    (
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
    [putData],
  );

  // =======================================================
  // SHAMBA — CROPS
  // =======================================================

  const getCrops = useCallback(
    (farmId) =>
      getData(
        `/shamba/farms/${encodeId(farmId, "Farm ID")}/crops`,
      ),
    [getData],
  );

  const createCrop = useCallback(
    (farmId, data) =>
      postData(
        `/shamba/farms/${encodeId(farmId, "Farm ID")}/crops`,
        data,
      ),
    [postData],
  );

  const getCropAnalysis = useCallback(
    (farmId, cropId) =>
      getData(
        `/shamba/farms/${encodeId(farmId, "Farm ID")}/crops/${encodeId(cropId, "Crop ID")}/analysis`,
      ),
    [getData],
  );

  // =======================================================
  // SHAMBA — FARM ACTIVITIES
  // =======================================================

  const getFarmActivities = useCallback(
    (farmId) =>
      getData(
        `/shamba/farms/${encodeId(farmId, "Farm ID")}/activities`,
      ),
    [getData],
  );

  const createFarmActivity = useCallback(
    (farmId, data) =>
      postData(
        `/shamba/farms/${encodeId(farmId, "Farm ID")}/activities`,
        data,
      ),
    [postData],
  );

  // =======================================================
  // SHAMBA — HARVESTS
  // =======================================================

  const getHarvests = useCallback(
    (farmId) =>
      getData(
        `/shamba/farms/${encodeId(farmId, "Farm ID")}/harvests`,
      ),
    [getData],
  );

  const createHarvest = useCallback(
    (farmId, data) =>
      postData(
        `/shamba/farms/${encodeId(farmId, "Farm ID")}/harvests`,
        data,
      ),
    [postData],
  );

  // =======================================================
  // SHAMBA — FARM COMMAND CENTER
  // =======================================================

  const getFarmCommandCenter = useCallback(
    (farmId) =>
      getData(
        `/shamba/farms/${encodeId(farmId, "Farm ID")}/command-center`,
      ),
    [getData],
  );

  // =======================================================
  // SHAMBA — INSIGHTS
  // =======================================================

  const getFarmInsights = useCallback(
    (farmId) =>
      getData(
        `/shamba/farms/${encodeId(farmId, "Farm ID")}/insights`,
      ),
    [getData],
  );

  const refreshFarmIntelligence = useCallback(
    (farmId) =>
      postData(
        `/shamba/farms/${encodeId(farmId, "Farm ID")}/insights/refresh`,
      ),
    [postData],
  );

  // =======================================================
  // SHAMBA — RECOMMENDATIONS
  // =======================================================

  const getFarmRecommendations = useCallback(
    (
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
    [getData],
  );

  const createFarmRecommendation = useCallback(
    (farmId, data) =>
      postData(
        `/shamba/farms/${encodeId(farmId, "Farm ID")}/recommendations`,
        data,
      ),
    [postData],
  );

  // =======================================================
  // SHAMBA — ALERTS
  // =======================================================

  const getFarmAlerts = useCallback(
    (
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
    [getData],
  );

  const getFarmAlertSummary = useCallback(
    (farmId) =>
      getData(
        `/shamba/farms/${encodeId(farmId, "Farm ID")}/alerts/summary`,
      ),
    [getData],
  );

  const markFarmAlertRead = useCallback(
    (farmId, alertId) =>
      putData(
        `/shamba/farms/${encodeId(farmId, "Farm ID")}/alerts/${encodeId(alertId, "Alert ID")}/read`,
      ),
    [putData],
  );

  // =======================================================
  // SHAMBA — WEATHER AND MARKET
  // =======================================================

  const getFarmWeather = useCallback(
    (farmId) =>
      getData(
        `/shamba/farms/${encodeId(farmId, "Farm ID")}/weather`,
      ),
    [getData],
  );

  const getFarmMarket = useCallback(
    (farmId) =>
      getData(
        `/shamba/farms/${encodeId(farmId, "Farm ID")}/market`,
      ),
    [getData],
  );

  // =======================================================
  // SHAMBA — REVELAAI CONTEXT
  // =======================================================

  const getFarmAIContext = useCallback(
    (farmId) =>
      getData(
        `/shamba/farms/${encodeId(farmId, "Farm ID")}/ai-context`,
      ),
    [getData],
  );

  // =======================================================
  // SHAMBA — DASHBOARD
  // =======================================================

  const getShambaDashboard = useCallback(
    () => getData("/shamba/dashboard"),
    [getData],
  );

  // =======================================================
  // ELIMU — HEALTH AND ACCESS
  // =======================================================

  const getElimuHealth = useCallback(
    () => getData("/elimu/health"),
    [getData],
  );

  const getElimuAccess = useCallback(
    () => getData("/elimu/access"),
    [getData],
  );

  const getElimuBootstrap = useCallback(
    () => getData("/elimu/bootstrap"),
    [getData],
  );

  // =======================================================
  // ELIMU — PROFILES AND SCHOOLS
  // =======================================================

  const getEducationProfile = useCallback(
    () => getData("/elimu/profile"),
    [getData],
  );

  const saveEducationProfile = useCallback(
    (data) => postData("/elimu/profile", data),
    [postData],
  );

  const getSchool = useCallback(
    () => getData("/elimu/school"),
    [getData],
  );

  const saveSchool = useCallback(
    (data) => postData("/elimu/school", data),
    [postData],
  );

  const createElimuDemoSchool = useCallback(
    (data) => postData("/elimu/school/demo", data),
    [postData],
  );

  // =======================================================
  // ELIMU — CLASSES
  // =======================================================

  const getClasses = useCallback(
    () => getData("/elimu/classes"),
    [getData],
  );

  const createClass = useCallback(
    (data) => postData("/elimu/classes", data),
    [postData],
  );

  // =======================================================
  // ELIMU — LESSONS
  // =======================================================

  const getLessons = useCallback(
    () => getData("/elimu/lessons"),
    [getData],
  );

  const createLesson = useCallback(
    (data) => postData("/elimu/lessons", data),
    [postData],
  );

  // =======================================================
  // ELIMU — ASSIGNMENTS
  // =======================================================

  const getAssignments = useCallback(
    () => getData("/elimu/assignments"),
    [getData],
  );

  const createAssignment = useCallback(
    (data) => postData("/elimu/assignments", data),
    [postData],
  );

  // =======================================================
  // ELIMU — FEES
  // =======================================================

  const getFees = useCallback(
    () => getData("/elimu/fees"),
    [getData],
  );

  const createFee = useCallback(
    (data) => postData("/elimu/fees", data),
    [postData],
  );

  // =======================================================
  // ELIMU — CBC
  // =======================================================

  const getCBCProjects = useCallback(
    () => getData("/elimu/cbc/projects"),
    [getData],
  );

  const createCBCProject = useCallback(
    (data) => postData("/elimu/cbc/projects", data),
    [postData],
  );

  // =======================================================
  // ELIMU — DASHBOARD
  // =======================================================

  const getElimuDashboard = useCallback(
    () => getData("/elimu/dashboard"),
    [getData],
  );

  // =======================================================
  // COMMUNITY — HEALTH AND FEED
  // =======================================================

  const getCommunityHealth = useCallback(
    () => getData("/community/health"),
    [getData],
  );

  const getCommunityFeed = useCallback(
    ({
      category = "",
      hub = "",
      limit = 30,
    } = {}) =>
      getData(
        withQuery("/community/feed", {
          category,
          hub,
          limit,
        }),
      ),
    [getData],
  );

  // =======================================================
  // COMMUNITY — POSTS
  // =======================================================

  const createCommunityPost = useCallback(
    (data) => postData("/community/posts", data),
    [postData],
  );

  const updateCommunityPost = useCallback(
    (postId, data) =>
      putData(
        `/community/posts/${encodeId(postId, "Post ID")}`,
        data,
      ),
    [putData],
  );

  const deleteCommunityPost = useCallback(
    (postId) =>
      deleteData(
        `/community/posts/${encodeId(postId, "Post ID")}`,
      ),
    [deleteData],
  );

  // =======================================================
  // COMMUNITY — COMMENTS AND REACTIONS
  // =======================================================

  const getCommunityComments = useCallback(
    (postId, limit = 100) =>
      getData(
        withQuery(
          `/community/posts/${encodeId(postId, "Post ID")}/comments`,
          { limit },
        ),
      ),
    [getData],
  );

  const addCommunityComment = useCallback(
    (postId, body) =>
      postData(
        `/community/posts/${encodeId(postId, "Post ID")}/comments`,
        { body },
      ),
    [postData],
  );

  const reactToCommunityPost = useCallback(
    (postId) =>
      postData(
        `/community/posts/${encodeId(postId, "Post ID")}/react`,
      ),
    [postData],
  );

  // =======================================================
  // COMMUNITY — WHATSAPP PREFERENCES
  // =======================================================

  const getCommunityContactPreferences = useCallback(
    () => getData("/community/contact-preferences"),
    [getData],
  );

  const saveCommunityContactPreferences = useCallback(
    (data = {}) =>
      putData("/community/contact-preferences", {
        enabled: Boolean(data.enabled),
        phone_number: String(data.phone_number || "").trim(),
      }),
    [putData],
  );

  const getCommunityWhatsAppContact = useCallback(
    (memberId, postId = null) => {
      const path = withQuery(
        `/community/members/${encodeId(memberId, "Member ID")}/whatsapp-contact`,
        { post_id: postId },
      );

      return getData(path);
    },
    [getData],
  );

  // =======================================================
  // PUBLIC API
  // =======================================================

  return {
    // Generic HTTP
    request,
    get,
    post,
    put,
    patch,
    del,

    isAuthenticated,
    isGuest,
    getAccessToken,

    // Identity
    getIdentity,
    updateIdentityProfile,

    // Wallet
    getWalletLedger,
    recordWalletTransaction,

    // Marketplace
    getMarketplaceListings,
    createMarketplaceListing,
    deleteMarketplaceListing,

    // Biashara — business
    getBiasharaHealth,
    getBusiness,
    getBiasharaBusiness,
    saveBusiness,
    createBiasharaBusiness,

    // Biashara — products
    getProducts,
    getBiasharaProducts,
    createProduct,
    createBiasharaProduct,
    updateProduct,
    updateBiasharaProduct,
    deleteProduct,
    deleteBiasharaProduct,

    // Biashara — inventory
    getLowStockProducts,
    getBiasharaLowStock,
    adjustInventory,
    adjustBiasharaInventory,
    getInventoryHistory,
    getBiasharaInventoryHistory,

    // Biashara — customers
    getCustomers,
    getBiasharaCustomers,
    createCustomer,
    createBiasharaCustomer,

    // Biashara — orders
    getOrders,
    getBiasharaOrders,
    createOrder,
    createBiasharaOrder,
    getOrder,
    getBiasharaOrder,
    updateOrderStatus,
    updateBiasharaOrderStatus,

    // Biashara — sales
    recordSale,
    recordBiasharaSale,

    // Biashara — expenses
    getExpenses,
    getBiasharaExpenses,
    createExpense,
    createBiasharaExpense,

    // Biashara — dashboard
    getBiasharaDashboard,

    // Shamba
    getShambaHealth,
    getFarmer,
    saveFarmer,
    getFarms,
    createFarm,
    getFarm,
    updateFarm,
    deleteFarm,
    updateFarmLocation,
    getCrops,
    createCrop,
    getCropAnalysis,
    getFarmActivities,
    createFarmActivity,
    getHarvests,
    createHarvest,
    getFarmCommandCenter,
    getFarmInsights,
    refreshFarmIntelligence,
    getFarmRecommendations,
    createFarmRecommendation,
    getFarmAlerts,
    getFarmAlertSummary,
    markFarmAlertRead,
    getFarmWeather,
    getFarmMarket,
    getFarmAIContext,
    getShambaDashboard,

    // Elimu — access and health
    getElimuHealth,
    getElimuAccess,
    getElimuBootstrap,
    createElimuDemoSchool,

    // Elimu — profile and school
    getEducationProfile,
    saveEducationProfile,
    getSchool,
    saveSchool,

    // Elimu — modules
    getClasses,
    createClass,
    getLessons,
    createLesson,
    getAssignments,
    createAssignment,
    getFees,
    createFee,
    getCBCProjects,
    createCBCProject,
    getElimuDashboard,

    // Community
    getCommunityHealth,
    getCommunityFeed,
    createCommunityPost,
    updateCommunityPost,
    deleteCommunityPost,
    getCommunityComments,
    addCommunityComment,
    reactToCommunityPost,
    getCommunityContactPreferences,
    saveCommunityContactPreferences,
    getCommunityWhatsAppContact,
  };
}

// =========================================================
// OPTIONAL STATIC API CLIENT
// =========================================================

// Use only outside React components. This function reads
// the JWT from localStorage and sends it explicitly.

export async function jumuiyaRequest(path, options = {}) {
  let token = "";
  let tokenType = "Bearer";

  try {
    token = localStorage.getItem("revelacode_access_token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      "";

    tokenType =
      localStorage.getItem("revelacode_token_type") ||
      "Bearer";
  } catch {
    // Continue unauthenticated. The backend will decide access.
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

  if (token && !requestHeaders.has("Authorization")) {
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