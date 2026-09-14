import { useCallback } from "react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

/**
 * =========================================================
 * BIASHARA ANALYTICS API
 * =========================================================
 *
 * Responsible for historical/business performance data:
 *
 * - Sales analytics
 * - Revenue
 * - Orders
 * - Customers
 * - Products
 * - Expenses
 * - Profit
 * - Performance trends
 */

export function useBiasharaAnalyticsApi() {
  const {
    get,
  } = useJumuiyaApi();

  /**
   * -------------------------------------------------------
   * SALES ANALYTICS
   * -------------------------------------------------------
   */
  const getSalesAnalytics = useCallback(
    async (params = {}) => {
      return get("/biashara/analytics/sales", {
        params,
      });
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
      return get("/biashara/analytics/revenue", {
        params,
      });
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
      return get("/biashara/analytics/orders", {
        params,
      });
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
      return get("/biashara/analytics/customers", {
        params,
      });
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
      return get("/biashara/analytics/products", {
        params,
      });
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
      return get("/biashara/analytics/expenses", {
        params,
      });
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
      return get("/biashara/analytics/profit", {
        params,
      });
    },
    [get]
  );

  /**
   * -------------------------------------------------------
   * COMPLETE ANALYTICS
   * -------------------------------------------------------
   */
  const getBiasharaAnalytics = useCallback(
    async (params = {}) => {
      return get("/biashara/analytics", {
        params,
      });
    },
    [get]
  );

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
