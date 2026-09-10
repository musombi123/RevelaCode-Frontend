// frontend/services/jumuiyaApi.jsx

import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext.jsx";


// =========================================================
// API BASE URL
// =========================================================

const BASE_URL = (
  import.meta.env.VITE_REVELACODE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  ""
).replace(/\/+$/, "");

const API_ROOT = `${BASE_URL}/api/jumuiya`;


// =========================================================
// CUSTOM ERROR
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
// RESPONSE PARSER
// =========================================================

async function parseResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  let payload = null;

  if (
    contentType.includes(
      "application/json",
    )
  ) {
    payload =
      await response
        .json()
        .catch(() => null);
  } else {
    const text =
      await response
        .text()
        .catch(() => "");

    payload = text
      ? { message: text }
      : null;
  }

  if (!response.ok) {
    const errorData =
      payload?.error;

    throw new JumuiyaAPIError(
      errorData?.message ||
        payload?.message ||
        `Request failed with status ${response.status}.`,
      response.status,
      errorData?.code ||
        `http_${response.status}`,
      errorData?.details || null,
    );
  }

  if (
    payload?.success === false
  ) {
    throw new JumuiyaAPIError(
      payload?.error?.message ||
        payload?.message ||
        "Jumuiya request failed.",
      response.status,
      payload?.error?.code ||
        "request_failed",
      payload?.error?.details ||
        null,
    );
  }

  return payload;
}


// =========================================================
// NORMALIZE DATA RESPONSE
// =========================================================

function extractData(payload) {
  if (
    payload &&
    Object.prototype.hasOwnProperty.call(
      payload,
      "data",
    )
  ) {
    return payload.data;
  }

  return payload;
}


// =========================================================
// FETCH FACTORY
// =========================================================

function createClient(authFetch) {
  const request = async (
    path,
    options = {},
  ) => {
    if (!BASE_URL) {
      throw new JumuiyaAPIError(
        "Jumuiya backend URL is not configured.",
        0,
        "backend_url_missing",
      );
    }

    const {
      body,
      headers = {},
      ...rest
    } = options;

    const requestHeaders = {
      Accept: "application/json",
      ...headers,
    };

    let requestBody = body;

    if (
      body !== undefined &&
      body !== null &&
      !(body instanceof FormData) &&
      typeof body !== "string"
    ) {
      requestHeaders[
        "Content-Type"
      ] = "application/json";

      requestBody =
        JSON.stringify(body);
    }

    const response =
      await authFetch(
        `${API_ROOT}${path}`,
        {
          ...rest,
          headers:
            requestHeaders,
          body: requestBody,
        },
      );

    return parseResponse(
      response,
    );
  };

  return {
    request,
  };
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

  const client =
    createClient(
      authFetch,
    );

  const request =
    useCallback(
      async (
        path,
        options = {},
      ) => {
        return client.request(
          path,
          options,
        );
      },
      [authFetch],
    );


  // =======================================================
  // GENERIC HELPERS
  // =======================================================

  const get = useCallback(
    (
      path,
      options = {},
    ) =>
      request(
        path,
        {
          ...options,
          method: "GET",
        },
      ),
    [request],
  );

  const post = useCallback(
    (
      path,
      body = {},
      options = {},
    ) =>
      request(
        path,
        {
          ...options,
          method: "POST",
          body,
        },
      ),
    [request],
  );

  const put = useCallback(
    (
      path,
      body = {},
      options = {},
    ) =>
      request(
        path,
        {
          ...options,
          method: "PUT",
          body,
        },
      ),
    [request],
  );

  const patch = useCallback(
    (
      path,
      body = {},
      options = {},
    ) =>
      request(
        path,
        {
          ...options,
          method: "PATCH",
          body,
        },
      ),
    [request],
  );

  const del = useCallback(
    (
      path,
      options = {},
    ) =>
      request(
        path,
        {
          ...options,
          method: "DELETE",
        },
      ),
    [request],
  );


  // =======================================================
  // IDENTITY
  // =======================================================

  const getIdentity =
    useCallback(
      async () =>
        extractData(
          await get(
            "/identity/me",
          ),
        ),
      [get],
    );

  const updateIdentityProfile =
    useCallback(
      async (data) =>
        extractData(
          await put(
            "/identity/profile",
            data,
          ),
        ),
      [put],
    );


  // =======================================================
  // WALLET
  // =======================================================

  const getWalletLedger =
    useCallback(
      async () =>
        extractData(
          await get(
            "/wallet/ledger",
          ),
        ),
      [get],
    );

  const recordWalletTransaction =
    useCallback(
      async (data) =>
        extractData(
          await post(
            "/wallet/transactions",
            data,
          ),
        ),
      [post],
    );


  // =======================================================
  // MARKETPLACE
  // =======================================================

  const getMarketplaceListings =
    useCallback(
      async ({
        hub = "",
        category = "",
      } = {}) => {
        const params =
          new URLSearchParams();

        if (hub) {
          params.set(
            "hub",
            hub,
          );
        }

        if (category) {
          params.set(
            "category",
            category,
          );
        }

        const query =
          params.toString();

        return extractData(
          await get(
            `/marketplace/listings${
              query
                ? `?${query}`
                : ""
            }`,
          ),
        );
      },
      [get],
    );

  const createMarketplaceListing =
    useCallback(
      async (data) =>
        extractData(
          await post(
            "/marketplace/listings",
            data,
          ),
        ),
      [post],
    );

  const deleteMarketplaceListing =
    useCallback(
      async (listingId) =>
        extractData(
          await del(
            `/marketplace/listings/${listingId}`,
          ),
        ),
      [del],
    );


  // =======================================================
  // BIASHARA
  // =======================================================

  /*
   * Business account
   */

  const getBiasharaHealth =
    useCallback(
      async () =>
        extractData(
          await get(
            "/biashara/health",
          ),
        ),
      [get],
    );

  const getBusiness =
    useCallback(
      async () =>
        extractData(
          await get(
            "/biashara/business",
          ),
        ),
      [get],
    );

  const getBiasharaBusiness =
    getBusiness;

  const saveBusiness =
    useCallback(
      async (data) =>
        extractData(
          await post(
            "/biashara/business",
            data,
          ),
        ),
      [post],
    );

  const createBiasharaBusiness =
    saveBusiness;


  /*
   * Products
   */

  const getProducts =
    useCallback(
      async ({
        status = "",
        category = "",
        search = "",
        limit = 50,
      } = {}) => {
        const params =
          new URLSearchParams();

        if (status) {
          params.set(
            "status",
            status,
          );
        }

        if (category) {
          params.set(
            "category",
            category,
          );
        }

        if (search) {
          params.set(
            "search",
            search,
          );
        }

        if (limit) {
          params.set(
            "limit",
            String(limit),
          );
        }

        const query =
          params.toString();

        return extractData(
          await get(
            `/biashara/products${
              query
                ? `?${query}`
                : ""
            }`,
          ),
        );
      },
      [get],
    );

  const getBiasharaProducts =
    getProducts;

  const createProduct =
    useCallback(
      async (data) =>
        extractData(
          await post(
            "/biashara/products",
            data,
          ),
        ),
      [post],
    );

  const createBiasharaProduct =
    createProduct;

  const updateProduct =
    useCallback(
      async (
        productId,
        data,
      ) =>
        extractData(
          await put(
            `/biashara/products/${productId}`,
            data,
          ),
        ),
      [put],
    );

  const updateBiasharaProduct =
    updateProduct;

  const deleteProduct =
    useCallback(
      async (productId) =>
        extractData(
          await del(
            `/biashara/products/${productId}`,
          ),
        ),
      [del],
    );

  const deleteBiasharaProduct =
    deleteProduct;


  /*
   * Inventory
   */

  const getLowStockProducts =
    useCallback(
      async (
        threshold,
      ) => {
        const params =
          new URLSearchParams();

        if (
          threshold !== undefined &&
          threshold !== null
        ) {
          params.set(
            "threshold",
            String(
              threshold,
            ),
          );
        }

        const query =
          params.toString();

        return extractData(
          await get(
            `/biashara/inventory/low-stock${
              query
                ? `?${query}`
                : ""
            }`,
          ),
        );
      },
      [get],
    );

  const getBiasharaLowStock =
    getLowStockProducts;

  const adjustInventory =
    useCallback(
      async (
        productId,
        data,
      ) =>
        extractData(
          await post(
            `/biashara/inventory/${productId}/adjust`,
            data,
          ),
        ),
      [post],
    );

  const adjustBiasharaInventory =
    adjustInventory;

  const getInventoryHistory =
    useCallback(
      async ({
        productId = "",
        limit = 50,
      } = {}) => {
        const params =
          new URLSearchParams();

        if (productId) {
          params.set(
            "product_id",
            productId,
          );
        }

        if (limit) {
          params.set(
            "limit",
            String(limit),
          );
        }

        return extractData(
          await get(
            `/biashara/inventory/history?${params.toString()}`,
          ),
        );
      },
      [get],
    );

  const getBiasharaInventoryHistory =
    getInventoryHistory;


  /*
   * Customers
   */

  const getCustomers =
    useCallback(
      async ({
        search = "",
        limit = 50,
      } = {}) => {
        const params =
          new URLSearchParams();

        if (search) {
          params.set(
            "search",
            search,
          );
        }

        if (limit) {
          params.set(
            "limit",
            String(limit),
          );
        }

        const query =
          params.toString();

        return extractData(
          await get(
            `/biashara/customers${
              query
                ? `?${query}`
                : ""
            }`,
          ),
        );
      },
      [get],
    );

  const getBiasharaCustomers =
    getCustomers;

  const createCustomer =
    useCallback(
      async (data) =>
        extractData(
          await post(
            "/biashara/customers",
            data,
          ),
        ),
      [post],
    );

  const createBiasharaCustomer =
    createCustomer;


  /*
   * Orders
   */

  const getOrders =
    useCallback(
      async ({
        status = "",
        limit = 50,
      } = {}) => {
        const params =
          new URLSearchParams();

        if (status) {
          params.set(
            "status",
            status,
          );
        }

        if (limit) {
          params.set(
            "limit",
            String(limit),
          );
        }

        const query =
          params.toString();

        return extractData(
          await get(
            `/biashara/orders${
              query
                ? `?${query}`
                : ""
            }`,
          ),
        );
      },
      [get],
    );

  const getBiasharaOrders =
    getOrders;

  const createOrder =
    useCallback(
      async (data) =>
        extractData(
          await post(
            "/biashara/orders",
            data,
          ),
        ),
      [post],
    );

  const createBiasharaOrder =
    createOrder;

  const getOrder =
    useCallback(
      async (orderId) =>
        extractData(
          await get(
            `/biashara/orders/${orderId}`,
          ),
        ),
      [get],
    );

  const getBiasharaOrder =
    getOrder;

  const updateOrderStatus =
    useCallback(
      async (
        orderId,
        status,
      ) =>
        extractData(
          await patch(
            `/biashara/orders/${orderId}/status`,
            {
              status,
            },
          ),
        ),
      [patch],
    );

  const updateBiasharaOrderStatus =
    updateOrderStatus;


  /*
   * Sales
   */

  const recordSale =
    useCallback(
      async (data) =>
        extractData(
          await post(
            "/biashara/sales",
            data,
          ),
        ),
      [post],
    );

  const recordBiasharaSale =
    recordSale;


  /*
   * Expenses
   */

  const getExpenses =
    useCallback(
      async ({
        limit = 50,
      } = {}) => {
        const params =
          new URLSearchParams();

        if (limit) {
          params.set(
            "limit",
            String(limit),
          );
        }

        return extractData(
          await get(
            `/biashara/expenses?${params.toString()}`,
          ),
        );
      },
      [get],
    );

  const getBiasharaExpenses =
    getExpenses;

  const createExpense =
    useCallback(
      async (data) =>
        extractData(
          await post(
            "/biashara/expenses",
            data,
          ),
        ),
      [post],
    );

  const createBiasharaExpense =
    createExpense;


  /*
   * Dashboard
   */

  const getBiasharaDashboard =
    useCallback(
      async () =>
        extractData(
          await get(
            "/biashara/dashboard",
          ),
        ),
      [get],
    );


  // =======================================================
  // SHAMBA
  // =======================================================

  const getShambaHealth =
    useCallback(
      async () =>
        extractData(
          await get(
            "/shamba/health",
          ),
        ),
      [get],
    );

  const getFarmer =
    useCallback(
      async () =>
        extractData(
          await get(
            "/shamba/farmer",
          ),
        ),
      [get],
    );

  const saveFarmer =
    useCallback(
      async (data) =>
        extractData(
          await post(
            "/shamba/farmer",
            data,
          ),
        ),
      [post],
    );

  const getFarms =
    useCallback(
      async () =>
        extractData(
          await get(
            "/shamba/farms",
          ),
        ),
      [get],
    );

  const createFarm =
    useCallback(
      async (data) =>
        extractData(
          await post(
            "/shamba/farms",
            data,
          ),
        ),
      [post],
    );

  const getFarm =
    useCallback(
      async (farmId) =>
        extractData(
          await get(
            `/shamba/farms/${farmId}`,
          ),
        ),
      [get],
    );

  const updateFarm =
    useCallback(
      async (
        farmId,
        data,
      ) =>
        extractData(
          await put(
            `/shamba/farms/${farmId}`,
            data,
          ),
        ),
      [put],
    );

  const deleteFarm =
    useCallback(
      async (farmId) =>
        extractData(
          await del(
            `/shamba/farms/${farmId}`,
          ),
        ),
      [del],
    );

  const getCrops =
    useCallback(
      async (farmId) =>
        extractData(
          await get(
            `/shamba/farms/${farmId}/crops`,
          ),
        ),
      [get],
    );

  const createCrop =
    useCallback(
      async (
        farmId,
        data,
      ) =>
        extractData(
          await post(
            `/shamba/farms/${farmId}/crops`,
            data,
          ),
        ),
      [post],
    );

  const getFarmActivities =
    useCallback(
      async (farmId) =>
        extractData(
          await get(
            `/shamba/farms/${farmId}/activities`,
          ),
        ),
      [get],
    );

  const createFarmActivity =
    useCallback(
      async (
        farmId,
        data,
      ) =>
        extractData(
          await post(
            `/shamba/farms/${farmId}/activities`,
            data,
          ),
        ),
      [post],
    );

  const getHarvests =
    useCallback(
      async (farmId) =>
        extractData(
          await get(
            `/shamba/farms/${farmId}/harvests`,
          ),
        ),
      [get],
    );

  const createHarvest =
    useCallback(
      async (
        farmId,
        data,
      ) =>
        extractData(
          await post(
            `/shamba/farms/${farmId}/harvests`,
            data,
          ),
        ),
      [post],
    );

  const getShambaDashboard =
    useCallback(
      async () =>
        extractData(
          await get(
            "/shamba/dashboard",
          ),
        ),
      [get],
    );


  // =======================================================
  // ELIMU
  // =======================================================

  const getElimuHealth =
    useCallback(
      async () =>
        extractData(
          await get(
            "/elimu/health",
          ),
        ),
      [get],
    );

  const getEducationProfile =
    useCallback(
      async () =>
        extractData(
          await get(
            "/elimu/profile",
          ),
        ),
      [get],
    );

  const saveEducationProfile =
    useCallback(
      async (data) =>
        extractData(
          await post(
            "/elimu/profile",
            data,
          ),
        ),
      [post],
    );

  const getSchool =
    useCallback(
      async () =>
        extractData(
          await get(
            "/elimu/school",
          ),
        ),
      [get],
    );

  const saveSchool =
    useCallback(
      async (data) =>
        extractData(
          await post(
            "/elimu/school",
            data,
          ),
        ),
      [post],
    );

  const getClasses =
    useCallback(
      async () =>
        extractData(
          await get(
            "/elimu/classes",
          ),
        ),
      [get],
    );

  const createClass =
    useCallback(
      async (data) =>
        extractData(
          await post(
            "/elimu/classes",
            data,
          ),
        ),
      [post],
    );

  const getLessons =
    useCallback(
      async () =>
        extractData(
          await get(
            "/elimu/lessons",
          ),
        ),
      [get],
    );

  const createLesson =
    useCallback(
      async (data) =>
        extractData(
          await post(
            "/elimu/lessons",
            data,
          ),
        ),
      [post],
    );

  const getAssignments =
    useCallback(
      async () =>
        extractData(
          await get(
            "/elimu/assignments",
          ),
        ),
      [get],
    );

  const createAssignment =
    useCallback(
      async (data) =>
        extractData(
          await post(
            "/elimu/assignments",
            data,
          ),
        ),
      [post],
    );

  const getFees =
    useCallback(
      async () =>
        extractData(
          await get(
            "/elimu/fees",
          ),
        ),
      [get],
    );

  const createFee =
    useCallback(
      async (data) =>
        extractData(
          await post(
            "/elimu/fees",
            data,
          ),
        ),
      [post],
    );

  const getCBCProjects =
    useCallback(
      async () =>
        extractData(
          await get(
            "/elimu/cbc/projects",
          ),
        ),
      [get],
    );

  const createCBCProject =
    useCallback(
      async (data) =>
        extractData(
          await post(
            "/elimu/cbc/projects",
            data,
          ),
        ),
      [post],
    );

  const getElimuDashboard =
    useCallback(
      async () =>
        extractData(
          await get(
            "/elimu/dashboard",
          ),
        ),
      [get],
    );


  // =======================================================
  // COMMUNITY
  // =======================================================

  const getCommunityHealth =
    useCallback(
      async () =>
        extractData(
          await get(
            "/community/health",
          ),
        ),
      [get],
    );

  const getCommunityFeed =
    useCallback(
      async ({
        category = "",
        hub = "",
        limit = 30,
      } = {}) => {
        const params =
          new URLSearchParams();

        if (category) {
          params.set(
            "category",
            category,
          );
        }

        if (hub) {
          params.set(
            "hub",
            hub,
          );
        }

        params.set(
          "limit",
          String(limit),
        );

        return extractData(
          await get(
            `/community/feed?${params.toString()}`,
          ),
        );
      },
      [get],
    );

  const createCommunityPost =
    useCallback(
      async (data) =>
        extractData(
          await post(
            "/community/posts",
            data,
          ),
        ),
      [post],
    );

  const updateCommunityPost =
    useCallback(
      async (
        postId,
        data,
      ) =>
        extractData(
          await put(
            `/community/posts/${postId}`,
            data,
          ),
        ),
      [put],
    );

  const deleteCommunityPost =
    useCallback(
      async (postId) =>
        extractData(
          await del(
            `/community/posts/${postId}`,
          ),
        ),
      [del],
    );

  const getCommunityComments =
    useCallback(
      async (
        postId,
        limit = 100,
      ) =>
        extractData(
          await get(
            `/community/posts/${postId}/comments?limit=${encodeURIComponent(
              limit,
            )}`,
          ),
        ),
      [get],
    );

  const addCommunityComment =
    useCallback(
      async (
        postId,
        body,
      ) =>
        extractData(
          await post(
            `/community/posts/${postId}/comments`,
            { body },
          ),
        ),
      [post],
    );

  const reactToCommunityPost =
    useCallback(
      async (postId) =>
        extractData(
          await post(
            `/community/posts/${postId}/react`,
          ),
        ),
      [post],
    );


  // =======================================================
  // RETURN
  // =======================================================

  return {
    request,

    get,
    post,
    put,
    patch,
    del,

    isAuthenticated,
    isGuest,
    getAccessToken,

    // -----------------------------------------------------
    // Identity
    // -----------------------------------------------------

    getIdentity,
    updateIdentityProfile,

    // -----------------------------------------------------
    // Wallet
    // -----------------------------------------------------

    getWalletLedger,
    recordWalletTransaction,

    // -----------------------------------------------------
    // Marketplace
    // -----------------------------------------------------

    getMarketplaceListings,
    createMarketplaceListing,
    deleteMarketplaceListing,

    // -----------------------------------------------------
    // Biashara
    // -----------------------------------------------------

    getBiasharaHealth,

    getBusiness,
    getBiasharaBusiness,

    saveBusiness,
    createBiasharaBusiness,

    getProducts,
    getBiasharaProducts,

    createProduct,
    createBiasharaProduct,

    updateProduct,
    updateBiasharaProduct,

    deleteProduct,
    deleteBiasharaProduct,

    getLowStockProducts,
    getBiasharaLowStock,

    adjustInventory,
    adjustBiasharaInventory,

    getInventoryHistory,
    getBiasharaInventoryHistory,

    getCustomers,
    getBiasharaCustomers,

    createCustomer,
    createBiasharaCustomer,

    getOrders,
    getBiasharaOrders,

    createOrder,
    createBiasharaOrder,

    getOrder,
    getBiasharaOrder,

    updateOrderStatus,
    updateBiasharaOrderStatus,

    recordSale,
    recordBiasharaSale,

    getExpenses,
    getBiasharaExpenses,

    createExpense,
    createBiasharaExpense,

    getBiasharaDashboard,

    // -----------------------------------------------------
    // Shamba
    // -----------------------------------------------------

    getShambaHealth,
    getFarmer,
    saveFarmer,
    getFarms,
    createFarm,
    getFarm,
    updateFarm,
    deleteFarm,
    getCrops,
    createCrop,
    getFarmActivities,
    createFarmActivity,
    getHarvests,
    createHarvest,
    getShambaDashboard,

    // -----------------------------------------------------
    // Elimu
    // -----------------------------------------------------

    getElimuHealth,
    getEducationProfile,
    saveEducationProfile,
    getSchool,
    saveSchool,
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

    // -----------------------------------------------------
    // Community
    // -----------------------------------------------------

    getCommunityHealth,
    getCommunityFeed,
    createCommunityPost,
    updateCommunityPost,
    deleteCommunityPost,
    getCommunityComments,
    addCommunityComment,
    reactToCommunityPost,
  };
}


// =========================================================
// OPTIONAL STATIC API CLIENT
// =========================================================
//
// Useful outside React components.
// It reads the persisted JWT directly.
// =========================================================

export async function jumuiyaRequest(
  path,
  options = {},
) {
  if (!BASE_URL) {
    throw new JumuiyaAPIError(
      "Jumuiya backend URL is not configured.",
      0,
      "backend_url_missing",
    );
  }

  const token =
    localStorage.getItem(
      "revelacode_access_token",
    );

  const tokenType =
    localStorage.getItem(
      "revelacode_token_type",
    ) || "Bearer";

  const {
    body,
    headers = {},
    ...rest
  } = options;

  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  let requestBody = body;

  if (
    body !== undefined &&
    body !== null &&
    !(body instanceof FormData) &&
    typeof body !== "string"
  ) {
    requestHeaders[
      "Content-Type"
    ] = "application/json";

    requestBody =
      JSON.stringify(body);
  }

  if (token) {
    requestHeaders.Authorization =
      `${tokenType} ${token}`;
  }

  const response =
    await fetch(
      `${API_ROOT}${path}`,
      {
        ...rest,
        headers:
          requestHeaders,
        body: requestBody,
      },
    );

  return parseResponse(
    response,
  );
}


export { API_ROOT };
