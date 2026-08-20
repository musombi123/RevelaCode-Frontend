import React, { useEffect, useState } from "react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

export default function BiasharaDashboard() {
  const {
    getBiasharaDashboard,
  } = useJumuiyaApi();

  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data =
          await getBiasharaDashboard();

        if (mounted) {
          setDashboard(data);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err.message ||
              "Failed to load dashboard.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [
    getBiasharaDashboard,
  ]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <pre>
      {JSON.stringify(
        dashboard,
        null,
        2,
      )}
    </pre>
  );
}
