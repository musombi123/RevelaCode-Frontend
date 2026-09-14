import { useCallback, useEffect, useState } from "react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

export default function useBiasharaBusiness({
  enabled = true,
} = {}) {
  const {
    getBiasharaBusiness,
    createBiasharaBusiness,
    updateBiasharaBusiness,
  } = useJumuiyaApi();

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  /**
   * -------------------------------------------------------
   * LOAD BUSINESS
   * -------------------------------------------------------
   */
  const loadBusiness = useCallback(async () => {
    if (!enabled) return null;

    setLoading(true);
    setError(null);

    try {
      const result = await getBiasharaBusiness();

      setBusiness(result || null);

      return result || null;
    } catch (err) {
      setBusiness(null);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [
    enabled,
    getBiasharaBusiness,
  ]);

  /**
   * -------------------------------------------------------
   * CREATE BUSINESS
   * -------------------------------------------------------
   */
  const createBusiness = useCallback(
    async (payload) => {
      setCreating(true);
      setError(null);

      try {
        const result =
          await createBiasharaBusiness(payload);

        setBusiness(result || null);

        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setCreating(false);
      }
    },
    [createBiasharaBusiness]
  );

  /**
   * -------------------------------------------------------
   * UPDATE BUSINESS
   * -------------------------------------------------------
   */
  const updateBusiness = useCallback(
    async (payload) => {
      setUpdating(true);
      setError(null);

      try {
        const result =
          await updateBiasharaBusiness(payload);

        setBusiness(result || null);

        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setUpdating(false);
      }
    },
    [updateBiasharaBusiness]
  );

  /**
   * -------------------------------------------------------
   * INITIAL LOAD
   * -------------------------------------------------------
   */
  useEffect(() => {
    if (!enabled) return;

    loadBusiness();
  }, [
    enabled,
    loadBusiness,
  ]);

  return {
    business,

    loading,
    creating,
    updating,

    error,

    hasBusiness: Boolean(business),

    loadBusiness,
    createBusiness,
    updateBusiness,

    setBusiness,
  };
}
