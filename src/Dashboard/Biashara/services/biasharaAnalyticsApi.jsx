import { useCallback } from "react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

/**
 * =========================================================
 * BIASHARA ANALYTICS API
 * =========================================================
 *
 * Historical/business performance data:
 *
 * - Sales analytics
 * - Revenue
 * - Orders
 * - Customers
 * - Products
 * - Expenses
 * - Profit
 * - Overall analytics
 *
 * NOTE:
 * useJumuiyaApi().get() does not automatically serialize
 * a `params` object into the query string.
 *
 * This service therefore builds the query string explicitly.
 */

/**
 * =========================================================
 * QUERY BUILDER
 * =========================================================
 */

function buildQuery(params = {}) {
  const entries = Object.entries(params).filter(
    ([, value]) =>
      value !== undefined &&
      value !== null &&
      value !== ""
  );

  if (!entries.length) {
    return "";
  }

  const searchParams = new URLSearchParams();

  entries.forEach(([key, value]) => {
    searchParams.set(key, String(value));
  });

  return `?${searchParams.toString()}`;
}

/**
 * =========================================================
 * HOOK
 * =========================================================
 */

export function useBiasharaAnalyticsApi() {
  const { get } = useJumuiyaApi();

  /**
   * -------------------------------------------------------
   * SALES ANALYTICS
   * -------------------------------------------------------
   *
   * GET /biashara/analytics/sales
   *
   * Example:
   * ?days=30
   */
  const getSalesAnalytics = useCallback(
    async (params = {}) => {
      return get(
        `/biashara/analytics/sales${buildQuery(params)}`
      );
    },
    [get]
  );

  /**
   * -------------------------------------------------------
   * REVENUE ANALYTICS
   * -------------------------------------------------------
   */
  const getRevenueAnalytics = useCallback(
    async (params = {}) => {
      return get(
        `/biashara/analytics/revenue${buildQuery(params)}`
      );
    },
    [get]
  );

  /**
   * -------------------------------------------------------
   * ORDER ANALYTICS
   * -------------------------------------------------------
   */
  const getOrderAnalytics = useCallback(
    async (params = {}) => {
      return get(
        `/biashara/analytics/orders${buildQuery(params)}`
      );
    },
    [get]
  );

  /**
   * -------------------------------------------------------
   * CUSTOMER ANALYTICS
   * -------------------------------------------------------
   */
  const getCustomerAnalytics = useCallback(
    async (params = {}) => {
      return get(
        `/biashara/analytics/customers${buildQuery(params)}`
      );
    },
    [get]
  );

  /**
   * -------------------------------------------------------
   * PRODUCT ANALYTICS
   * -------------------------------------------------------
   */
  const getProductAnalytics = useCallback(
    async (params = {}) => {
      return get(
        `/biashara/analytics/products${buildQuery(params)}`
      );
    },
    [get]
  );

  /**
   * -------------------------------------------------------
   * EXPENSE ANALYTICS
   * -------------------------------------------------------
   */
  const getExpenseAnalytics = useCallback(
    async (params = {}) => {
      return get(
        `/biashara/analytics/expenses${buildQuery(params)}`
      );
    },
    [get]
  );

  /**
   * -------------------------------------------------------
   * PROFIT ANALYTICS
   * -------------------------------------------------------
   */
  const getProfitAnalytics = useCallback(
    async (params = {}) => {
      return get(
        `/biashara/analytics/profit${buildQuery(params)}`
      );
    },
    [get]
  );

  /**
   * -------------------------------------------------------
   * COMPLETE ANALYTICS
   * -------------------------------------------------------
   *
   * GET /biashara/analytics
   */
  const getBiasharaAnalytics = useCallback(
    async (params = {}) => {
      return get(
        `/biashara/analytics${buildQuery(params)}`
      );
    },
    [get]
  );

  /**
   * -------------------------------------------------------
   * PUBLIC API
   * -------------------------------------------------------
   */

  return {
    getSalesAnalytics,
    getRevenueAnalytics,
    getOrderAnalytics,
    getCustomerAnalytics,
    getProductAnalytics,
    getExpenseAnalytics,
    getProfitAnalytics,
    getBiasharaAnalytics,
  };
}

export default useBiasharaAnalyticsApi;
