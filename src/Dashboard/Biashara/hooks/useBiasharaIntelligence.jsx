import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useBiasharaIntelligenceApi } from "../services/biasharaIntelligenceApi.jsx";

function extractResult(result) {
  if (!result) return null;

  if (result.data !== undefined) {
    return result.data;
  }

  return result;
}

export default function useBiasharaIntelligence({
  enabled = false,
  autoLoad = true,
} = {}) {
  const {
    getBiasharaIntelligence,
    getMarketPrediction,
    getDemandForecast,
    getPriceIntelligence,
    getMarketTrends,
    getProductOpportunities,
    getIntelligenceAlerts,
    refreshIntelligence,
  } = useBiasharaIntelligenceApi();

  const [intelligence, setIntelligence] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState(null);

  /**
   * -------------------------------------------------------
   * LOAD COMPLETE INTELLIGENCE
   * -------------------------------------------------------
   */
  const loadIntelligence = useCallback(
    async (params = {}) => {
      if (!enabled) return null;

      setLoading(true);
      setError(null);

      try {
        const result =
          await getBiasharaIntelligence(params);

        const data = extractResult(result);

        setIntelligence(data || null);

        return data || null;
      } catch (err) {
        setError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [
      enabled,
      getBiasharaIntelligence,
    ]
  );

  /**
   * -------------------------------------------------------
   * LOAD INDIVIDUAL INTELLIGENCE MODULES
   * -------------------------------------------------------
   */
  const loadMarketPrediction =
    useCallback(
      async (params = {}) => {
        const result =
          await getMarketPrediction(params);

        return extractResult(result);
      },
      [getMarketPrediction]
    );

  const loadDemandForecast =
    useCallback(
      async (params = {}) => {
        const result =
          await getDemandForecast(params);

        return extractResult(result);
      },
      [getDemandForecast]
    );

  const loadPriceIntelligence =
    useCallback(
      async (params = {}) => {
        const result =
          await getPriceIntelligence(params);

        return extractResult(result);
      },
      [getPriceIntelligence]
    );

  const loadMarketTrends =
    useCallback(
      async (params = {}) => {
        const result =
          await getMarketTrends(params);

        return extractResult(result);
      },
      [getMarketTrends]
    );

  const loadProductOpportunities =
    useCallback(
      async (params = {}) => {
        const result =
          await getProductOpportunities(params);

        return extractResult(result);
      },
      [getProductOpportunities]
    );

  const loadIntelligenceAlerts =
    useCallback(
      async (params = {}) => {
        const result =
          await getIntelligenceAlerts(params);

        return extractResult(result);
      },
      [getIntelligenceAlerts]
    );

  /**
   * -------------------------------------------------------
   * REFRESH INTELLIGENCE
   * -------------------------------------------------------
   */
  const refresh = useCallback(
    async (payload = {}, params = {}) => {
      if (!enabled) return null;

      setRefreshing(true);
      setError(null);

      try {
        await refreshIntelligence(payload);

        return await loadIntelligence(params);
      } catch (err) {
        setError(err);
        return null;
      } finally {
        setRefreshing(false);
      }
    },
    [
      enabled,
      refreshIntelligence,
      loadIntelligence,
    ]
  );

  /**
   * -------------------------------------------------------
   * AUTO LOAD
   * -------------------------------------------------------
   */
  useEffect(() => {
    if (!enabled || !autoLoad) return;

    loadIntelligence();
  }, [
    enabled,
    autoLoad,
    loadIntelligence,
  ]);

  return {
    intelligence,

    loading,
    refreshing,
    error,

    hasIntelligence:
      Boolean(intelligence),

    loadIntelligence,

    loadMarketPrediction,
    loadDemandForecast,
    loadPriceIntelligence,
    loadMarketTrends,
    loadProductOpportunities,
    loadIntelligenceAlerts,

    refresh,

    setIntelligence,
  };
}
