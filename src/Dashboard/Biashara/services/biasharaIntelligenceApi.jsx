import { useCallback } from "react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

/**
 * =========================================================
 * BIASHARA INTELLIGENCE API
 * =========================================================
 *
 * Responsible for:
 * - Market predictions
 * - Demand forecasting
 * - Price intelligence
 * - Market trends
 * - Product opportunities
 * - Intelligence alerts
 *
 * This layer does NOT manage React state.
 * It delegates authenticated requests to jumuiyaApi.jsx.
 */

export function useBiasharaIntelligenceApi() {
  const {
    get,
    post,
  } = useJumuiyaApi();

  /**
   * -------------------------------------------------------
   * MARKET PREDICTION
   * -------------------------------------------------------
   */
  const getMarketPrediction = useCallback(
    async (params = {}) => {
      return get("/biashara/intelligence/market-prediction", {
        params,
      });
    },
    [get]
  );

  /**
   * -------------------------------------------------------
   * DEMAND FORECAST
   * -------------------------------------------------------
   */
  const getDemandForecast = useCallback(
    async (params = {}) => {
      return get("/biashara/intelligence/demand-forecast", {
        params,
      });
    },
    [get]
  );

  /**
   * -------------------------------------------------------
   * PRICE INTELLIGENCE
   * -------------------------------------------------------
   */
  const getPriceIntelligence = useCallback(
    async (params = {}) => {
      return get("/biashara/intelligence/price-intelligence", {
        params,
      });
    },
    [get]
  );

  /**
   * -------------------------------------------------------
   * MARKET TRENDS
   * -------------------------------------------------------
   */
  const getMarketTrends = useCallback(
    async (params = {}) => {
      return get("/biashara/intelligence/market-trends", {
        params,
      });
    },
    [get]
  );

  /**
   * -------------------------------------------------------
   * PRODUCT OPPORTUNITIES
   * -------------------------------------------------------
   */
  const getProductOpportunities = useCallback(
    async (params = {}) => {
      return get("/biashara/intelligence/product-opportunities", {
        params,
      });
    },
    [get]
  );

  /**
   * -------------------------------------------------------
   * INTELLIGENCE ALERTS
   * -------------------------------------------------------
   */
  const getIntelligenceAlerts = useCallback(
    async (params = {}) => {
      return get("/biashara/intelligence/alerts", {
        params,
      });
    },
    [get]
  );

  /**
   * -------------------------------------------------------
   * COMPLETE INTELLIGENCE
   * -------------------------------------------------------
   *
   * Preferred endpoint once backend supports it.
   *
   * This allows the dashboard to load the complete
   * intelligence package with one request.
   */
  const getBiasharaIntelligence = useCallback(
    async (params = {}) => {
      return get("/biashara/intelligence", {
        params,
      });
    },
    [get]
  );

  /**
   * -------------------------------------------------------
   * REFRESH / GENERATE INTELLIGENCE
   * -------------------------------------------------------
   *
   * Optional endpoint for triggering a fresh analysis.
   */
  const refreshIntelligence = useCallback(
    async (payload = {}) => {
      return post(
        "/biashara/intelligence/refresh",
        payload
      );
    },
    [post]
  );

  return {
    getMarketPrediction,
    getDemandForecast,
    getPriceIntelligence,
    getMarketTrends,
    getProductOpportunities,
    getIntelligenceAlerts,
    getBiasharaIntelligence,
    refreshIntelligence,
  };
}

export default useBiasharaIntelligenceApi;
