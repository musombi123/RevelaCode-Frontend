import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  BriefcaseBusiness,
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  useJumuiyaApi,
} from "@/services/jumuiyaApi.jsx";

import BiasharaBusinessOnboarding
  from "./BiasharaBusinessOnboarding.jsx";


export default function BiasharaDashboard() {
  const {
    getBiasharaBusiness,
    getBiasharaDashboard,
  } = useJumuiyaApi();

  const [
    business,
    setBusiness,
  ] = useState(null);

  const [
    dashboard,
    setDashboard,
  ] = useState(null);

  const [
    checkingBusiness,
    setCheckingBusiness,
  ] = useState(true);

  const [
    loadingDashboard,
    setLoadingDashboard,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  const loadDashboard =
    useCallback(
      async () => {
        setLoadingDashboard(
          true,
        );

        setError("");

        try {
          const data =
            await getBiasharaDashboard();

          setDashboard(
            data,
          );
        } catch (err) {
          setError(
            err?.message ||
              "Failed to load Biashara dashboard.",
          );
        } finally {
          setLoadingDashboard(
            false,
          );
        }
      },
      [
        getBiasharaDashboard,
      ],
    );


  useEffect(() => {
    let mounted = true;


    const checkBusiness =
      async () => {
        setCheckingBusiness(
          true,
        );

        setError("");

        try {
          const data =
            await getBiasharaBusiness();

          if (!mounted) {
            return;
          }

          setBusiness(
            data || null,
          );

          if (data) {
            setLoadingDashboard(
              true,
            );

            try {
              const dashboardData =
                await getBiasharaDashboard();

              if (mounted) {
                setDashboard(
                  dashboardData,
                );
              }
            } catch (err) {
              if (mounted) {
                setError(
                  err?.message ||
                    "Failed to load Biashara dashboard.",
                );
              }
            } finally {
              if (mounted) {
                setLoadingDashboard(
                  false,
                );
              }
            }
          }
        } catch (err) {
          if (mounted) {
            setError(
              err?.message ||
                "Unable to check your business account.",
            );
          }
        } finally {
          if (mounted) {
            setCheckingBusiness(
              false,
            );
          }
        }
      };


    checkBusiness();


    return () => {
      mounted = false;
    };
  }, [
    getBiasharaBusiness,
    getBiasharaDashboard,
  ]);


  // =======================================================
  // CHECKING BUSINESS
  // =======================================================

  if (checkingBusiness) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">

        <div className="text-center">

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Loader2
              size={25}
              className="animate-spin"
            />
          </div>

          <h2 className="text-base font-semibold text-slate-900">
            Checking your Biashara account
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Preparing your business workspace...
          </p>

        </div>

      </div>
    );
  }


  // =======================================================
  // ERROR
  // =======================================================

  if (error && !business) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">

        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">

          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle
              size={22}
            />
          </div>

          <h2 className="text-lg font-bold text-slate-900">
            Unable to open Biashara
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            <RefreshCw
              size={16}
            />
            Try again
          </button>

        </div>

      </div>
    );
  }


  // =======================================================
  // NO BUSINESS → ONBOARDING
  // =======================================================

  if (!business) {
    return (
      <BiasharaBusinessOnboarding
        onCreated={(createdBusiness) => {
          setBusiness(
            createdBusiness,
          );

          setDashboard(
            null,
          );
        }}
      />
    );
  }


  // =======================================================
  // DASHBOARD LOADING
  // =======================================================

  if (
    loadingDashboard ||
    !dashboard
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">

        <div className="text-center">

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <BriefcaseBusiness
              size={25}
            />
          </div>

          <h2 className="text-base font-semibold text-slate-900">
            Loading your business workspace
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Preparing your latest business data...
          </p>

        </div>

      </div>
    );
  }


  // =======================================================
  // TEMPORARY DASHBOARD DATA VIEW
  // =======================================================
  //
  // We will replace this with the premium dashboard
  // based on your reference design in the next component.
  //

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6">

      <div className="mx-auto max-w-7xl">

        <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">

          <p className="text-sm font-medium text-blue-600">
            Biashara Hub
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {business.name}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Your business workspace is ready.
          </p>

        </div>


        <div className="rounded-3xl bg-white p-6 shadow-sm">

          <h2 className="mb-4 text-lg font-bold text-slate-900">
            Dashboard API
          </h2>

          <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
            {JSON.stringify(
              dashboard,
              null,
              2,
            )}
          </pre>

        </div>

      </div>

    </div>
  );
}
