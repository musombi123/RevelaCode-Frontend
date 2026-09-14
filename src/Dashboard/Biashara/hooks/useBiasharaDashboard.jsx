import { useCallback, useEffect, useState } from "react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

export default function useBiasharaDashboard({
  enabled = true,
} = {}) {
  const {
    getBiasharaDashboard,
  } = useJumuiyaApi();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  /**
   * -------------------------------------------------------
   * LOAD DASHBOARD
   * -------------------------------------------------------
   */
  const loadDashboard = useCallback(async () => {
    if (!enabled) return null;

    setLoading(true);
    setError(null);

    try {
      const result =
        await getBiasharaDashboard();

      setDashboard(result || null);

      return result || null;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [
    enabled,
    getBiasharaDashboard,
  ]);

  /**
   * -------------------------------------------------------
   * INITIAL LOAD
   * -------------------------------------------------------
   */
  useEffect(() => {
    if (!enabled) return;

    loadDashboard();
  }, [
    enabled,
    loadDashboard,
  ]);

  return {
    dashboard,

    loading,
    error,

    loadDashboard,
    refreshDashboard: loadDashboard,

    setDashboard,
  };
}
