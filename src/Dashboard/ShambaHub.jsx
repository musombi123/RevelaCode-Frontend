// src/Dashboard/ShambaHub.jsx

"use client";

import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  CloudSun,
  Leaf,
  LocateFixed,
  MapPin,
  MoreHorizontal,
  Navigation,
  Package,
  RefreshCw,
  ShoppingCart,
  Sprout,
  Tractor,
  TrendingUp,
  Users,
  Wheat,
  X,
} from "lucide-react";

import Loading from "@/components/common/Loading.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

// ============================================================
// CONFIGURATION
// ============================================================

const LOCATION_STORAGE_KEY = "revelacode_shamba_location";

const LOCATION_CACHE_DURATION = 30 * 60 * 1000;

const MOBILE_PRIMARY_KEYS = [
  "home",
  "farms",
  "crops",
  "market",
];

// ============================================================
// SAFE LAZY LOADER
// ============================================================

function safeLazy(importFn, name) {
  return lazy(() =>
    importFn().catch((error) => {
      console.error(`SHAMBA LAZY LOAD FAILED → ${name}`, error);

      return {
        default: function ShambaLoadError() {
          return (
            <div className="flex min-h-[260px] items-center justify-center p-6">
              <div className="w-full max-w-md rounded-3xl border border-red-100 bg-red-50 p-6 text-center">
                <div className="text-sm font-black text-red-700">
                  {name} could not be loaded
                </div>

                <p className="mt-2 text-xs leading-5 text-red-600">
                  Something went wrong while opening this section. Please try
                  again.
                </p>
              </div>
            </div>
          );
        },
      };
    }),
  );
}

// ============================================================
// SHAMBA SCREENS
// ============================================================

const ShambaDashboard = safeLazy(
  () => import("@/Dashboard/ShambaDashboard.jsx"),
  "Shamba Dashboard",
);

const ShambaFarmsDashboard = safeLazy(
  () => import("@/Dashboard/ShambaFarmsDashboard.jsx"),
  "My Farms",
);

const ShambaCropsDashboard = safeLazy(
  () => import("@/Dashboard/ShambaCropsDashboard.jsx"),
  "Crops",
);

const ShambaMarketDashboard = safeLazy(
  () => import("@/Dashboard/ShambaMarketDashboard.jsx"),
  "Market",
);

const ShambaInputsDashboard = safeLazy(
  () => import("@/Dashboard/ShambaInputsDashboard.jsx"),
  "Farm Inputs",
);

const ShambaBuyersDashboard = safeLazy(
  () => import("@/Dashboard/ShambaBuyersDashboard.jsx"),
  "Buyers",
);

const ShambaOrdersDashboard = safeLazy(
  () => import("@/Dashboard/ShambaOrdersDashboard.jsx"),
  "Orders",
);

const ShambaWeatherDashboard = safeLazy(
  () => import("@/Dashboard/ShambaWeatherDashboard.jsx"),
  "Weather",
);

const ShambaHarvestsDashboard = safeLazy(
  () => import("@/Dashboard/ShambaHarvestsDashboard.jsx"),
  "Harvests",
);

const ShambaActivitiesDashboard = safeLazy(
  () => import("@/Dashboard/ShambaActivitiesDashboard.jsx"),
  "Activities",
);

// ============================================================
// NAVIGATION MODEL
// ============================================================

const SHAMBA_SECTIONS = {
  home: {
    label: "Overview",
    shortLabel: "Home",
    icon: Leaf,
    component: ShambaDashboard,
    primary: true,
  },

  farms: {
    label: "My Farms",
    shortLabel: "Farms",
    icon: Tractor,
    component: ShambaFarmsDashboard,
    primary: true,
  },

  crops: {
    label: "Crops",
    shortLabel: "Crops",
    icon: Sprout,
    component: ShambaCropsDashboard,
    primary: true,
  },

  market: {
    label: "Market",
    shortLabel: "Market",
    icon: TrendingUp,
    component: ShambaMarketDashboard,
    primary: true,
  },

  weather: {
    label: "Weather",
    shortLabel: "Weather",
    icon: CloudSun,
    component: ShambaWeatherDashboard,
    primary: true,
  },

  harvests: {
    label: "Harvests",
    shortLabel: "Harvests",
    icon: Wheat,
    component: ShambaHarvestsDashboard,
    primary: true,
  },

  inputs: {
    label: "Farm Inputs",
    shortLabel: "Inputs",
    icon: Package,
    component: ShambaInputsDashboard,
    primary: false,
  },

  buyers: {
    label: "Buyers",
    shortLabel: "Buyers",
    icon: Users,
    component: ShambaBuyersDashboard,
    primary: false,
  },

  orders: {
    label: "Orders",
    shortLabel: "Orders",
    icon: ShoppingCart,
    component: ShambaOrdersDashboard,
    primary: false,
  },

  activities: {
    label: "Activities",
    shortLabel: "Activities",
    icon: Activity,
    component: ShambaActivitiesDashboard,
    primary: false,
  },
};

// ============================================================
// NAVIGATION ALIASES
// ============================================================

function normalizeSection(target) {
  if (!target) {
    return "home";
  }

  const value = String(target)
    .trim()
    .toLowerCase()
    .split("#")[0]
    .split("?")[0]
    .replace(/^\/+|\/+$/g, "");

  const aliases = {
    "": "home",

    shamba: "home",
    "shamba/home": "home",

    farm: "farms",
    farms: "farms",
    "shamba/farms": "farms",

    crop: "crops",
    crops: "crops",
    "shamba/crops": "crops",

    market: "market",
    "shamba/market": "market",

    weather: "weather",
    "shamba/weather": "weather",

    harvest: "harvests",
    harvests: "harvests",
    "shamba/harvests": "harvests",

    input: "inputs",
    inputs: "inputs",
    "shamba/inputs": "inputs",

    buyer: "buyers",
    buyers: "buyers",
    "shamba/buyers": "buyers",

    order: "orders",
    orders: "orders",
    "shamba/orders": "orders",

    activity: "activities",
    activities: "activities",
    "shamba/activities": "activities",
  };

  return aliases[value] || "home";
}

// ============================================================
// LOCATION UTILITIES
// ============================================================

function formatCoordinates(latitude, longitude) {
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return "—";
  }

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function readCachedLocation() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LOCATION_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (
      !parsed?.timestamp ||
      Date.now() - Number(parsed.timestamp) > LOCATION_CACHE_DURATION
    ) {
      return null;
    }

    if (
      typeof parsed.latitude !== "number" ||
      typeof parsed.longitude !== "number"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function saveCachedLocation(location) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      LOCATION_STORAGE_KEY,
      JSON.stringify({
        ...location,
        timestamp: Date.now(),
      }),
    );
  } catch {
    // Storage failure should never break Shamba.
  }
}

// ============================================================
// LOCATION HOOK
// ============================================================

function useFarmLocation() {
  const cachedLocation = useMemo(() => readCachedLocation(), []);

  const [location, setLocation] = useState(cachedLocation);
  const [status, setStatus] = useState(cachedLocation ? "success" : "idle");
  const [error, setError] = useState("");

  const detectLocation = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!window.navigator.geolocation) {
      setStatus("error");
      setError("Location services are not supported on this device.");
      return;
    }

    setStatus("detecting");
    setError("");

    window.navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        const baseLocation = {
          latitude,
          longitude,
          accuracy,
        };

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
              latitude,
            )}&lon=${encodeURIComponent(
              longitude,
            )}&zoom=18&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "en",
              },
            },
          );

          if (!response.ok) {
            throw new Error("Reverse geocoding failed.");
          }

          const data = await response.json();
          const address = data?.address || {};

          const locationData = {
            ...baseLocation,
            displayName: data?.display_name || "Current location",

            village:
              address.village ||
              address.suburb ||
              address.neighbourhood ||
              "",

            town:
              address.town ||
              address.city ||
              address.municipality ||
              "",

            county: address.county || "",
            state: address.state || "",
            country: address.country || "",
            countryCode: address.country_code || "",
            detectedAt: new Date().toISOString(),
          };

          setLocation(locationData);
          saveCachedLocation(locationData);
          setStatus("success");
        } catch (reverseError) {
          console.warn(
            "Shamba reverse geocoding failed:",
            reverseError,
          );

          const locationData = {
            ...baseLocation,
            displayName: "GPS location detected",
            village: "",
            town: "",
            county: "",
            state: "",
            country: "",
            countryCode: "",
            detectedAt: new Date().toISOString(),
          };

          setLocation(locationData);
          saveCachedLocation(locationData);
          setStatus("success");
        }
      },
      (geoError) => {
        let message = "Unable to detect your location.";

        if (geoError.code === geoError.PERMISSION_DENIED) {
          message =
            "Location permission was denied. Enable location access and try again.";
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          message =
            "Your device could not determine its current location.";
        } else if (geoError.code === geoError.TIMEOUT) {
          message =
            "Location detection timed out. Please try again.";
        }

        setStatus("error");
        setError(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }, []);

  return {
    location,
    status,
    error,
    detectLocation,
  };
}

// ============================================================
// LOCATION BADGE
// ============================================================

function LocationBadge({ location, status, onDetect }) {
  const [open, setOpen] = useState(false);

  if (status === "detecting") {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
        <LocateFixed size={14} className="animate-pulse" />
        <span>Detecting location...</span>
      </div>
    );
  }

  if (!location) {
    return (
      <button
        type="button"
        onClick={onDetect}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-emerald-800/60 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
        aria-label="Detect farm location"
      >
        <MapPin size={14} />

        <span className="hidden sm:inline">Detect farm location</span>
        <span className="sm:hidden">Locate me</span>
      </button>
    );
  }

  const primaryLocation =
    location.town ||
    location.village ||
    location.county ||
    "Current location";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex max-w-[230px] items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
      >
        <CheckCircle2 size={14} className="shrink-0" />

        <span className="min-w-0 truncate">{primaryLocation}</span>

        <ChevronDown size={13} className="shrink-0" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Farm location details"
          className="absolute right-0 top-full z-50 mt-2 w-[300px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-800 dark:bg-gray-950"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                Farm location
              </p>

              <h4 className="mt-1 truncate text-sm font-black text-gray-900 dark:text-white">
                {primaryLocation}
              </h4>
            </div>

            <Navigation size={18} className="shrink-0 text-emerald-600" />
          </div>

          <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
            {location.county && (
              <div className="flex justify-between gap-3">
                <span>County</span>
                <strong className="text-right text-gray-700 dark:text-gray-200">
                  {location.county}
                </strong>
              </div>
            )}

            {location.town && (
              <div className="flex justify-between gap-3">
                <span>Town</span>
                <strong className="text-right text-gray-700 dark:text-gray-200">
                  {location.town}
                </strong>
              </div>
            )}

            <div className="flex justify-between gap-3">
              <span>Coordinates</span>
              <strong className="text-right text-gray-700 dark:text-gray-200">
                {formatCoordinates(
                  location.latitude,
                  location.longitude,
                )}
              </strong>
            </div>

            <div className="flex justify-between gap-3">
              <span>GPS accuracy</span>
              <strong className="text-right text-gray-700 dark:text-gray-200">
                {Number.isFinite(location.accuracy)
                  ? `±${Math.round(location.accuracy)} m`
                  : "—"}
              </strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onDetect();
              setOpen(false);
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-3 py-2.5 text-xs font-black text-white transition hover:bg-gray-900 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100"
          >
            <RefreshCw size={13} />
            Update location
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// DESKTOP NAV ITEM
// ============================================================

function DesktopNavItem({ item, active, onClick }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
        active
          ? "bg-emerald-600 text-white shadow-sm"
          : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
      }`}
    >
      <Icon
        size={17}
        className={
          active
            ? "text-white"
            : "text-slate-400 group-hover:text-emerald-600"
        }
      />

      <span>{item.label}</span>
    </button>
  );
}

// ============================================================
// MOBILE NAV ITEM
// ============================================================

function MobileNavItem({ item, active, onClick }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition ${
        active ? "text-emerald-600" : "text-slate-400"
      }`}
    >
      <Icon size={17} />

      <span className="max-w-full truncate text-[8px] font-black">
        {item.shortLabel}
      </span>
    </button>
  );
}

// ============================================================
// MORE DRAWER
// ============================================================

function MoreDrawer({
  open,
  onClose,
  activeSection,
  onNavigate,
  mode = "desktop",
}) {
  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const entries = Object.entries(SHAMBA_SECTIONS);

  const visibleKeys =
    mode === "mobile"
      ? entries.filter(([key]) => !MOBILE_PRIMARY_KEYS.includes(key))
      : entries.filter(([, item]) => !item.primary);

  return (
    <div className="fixed inset-0 z-[70]" aria-modal="true" role="dialog">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
      />

      <aside className="absolute bottom-0 right-0 top-0 w-[min(380px,88vw)] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">
              Shamba
            </p>

            <h3 className="mt-1 text-lg font-black text-slate-900">
              More tools
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close more tools"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        <div className="p-4">
          <div className="grid gap-2">
            {visibleKeys.map(([key, item]) => {
              const Icon = item.icon;
              const active = activeSection === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onNavigate(key);
                    onClose();
                  }}
                  className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-100 hover:border-emerald-100 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-900">
                      {item.label}
                    </div>

                    <div className="mt-0.5 text-[10px] text-slate-500">
                      Manage your {item.label.toLowerCase()}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}

// ============================================================
// LOCATION ERROR
// ============================================================

function LocationError({ message, onRetry }) {
  if (!message) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <AlertCircle
          size={17}
          className="mt-0.5 shrink-0 text-amber-600"
        />

        <p className="text-xs leading-5 text-amber-800">{message}</p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 rounded-lg bg-white px-3 py-2 text-[10px] font-black text-amber-700 shadow-sm transition hover:bg-amber-100"
      >
        Retry
      </button>
    </div>
  );
}

// ============================================================
// MAIN SHAMBA HUB
// ============================================================

export default function ShambaHub({ onNavigate, onOpenAI }) {
  const { user } = useAuth();

  const [activeSection, setActiveSection] = useState("home");
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreMode, setMoreMode] = useState("desktop");

  const {
    location,
    status: locationStatus,
    error: locationError,
    detectLocation,
  } = useFarmLocation();

  // ==========================================================
  // INITIAL LOCATION DETECTION
  // ==========================================================

  useEffect(() => {
    /*
     * Automatically request GPS only when there is no valid
     * cached location. The location hook initializes from cache,
     * preventing duplicate permission prompts on first render.
     */
    if (!location && locationStatus === "idle") {
      detectLocation();
    }
  }, [location, locationStatus, detectLocation]);

  // ==========================================================
  // INTERNAL NAVIGATION
  // ==========================================================

  const handleShambaNavigate = useCallback((target) => {
    const next = normalizeSection(target);

    setActiveSection(next);
    setMoreOpen(false);

    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, []);

  // ==========================================================
  // GLOBAL NAVIGATION
  // ==========================================================

  const handleDashboardNavigate = useCallback(
    (target) => {
      if (!target) {
        return;
      }

      const normalized = String(target)
        .trim()
        .toLowerCase()
        .split("#")[0]
        .split("?")[0]
        .replace(/^\/+|\/+$/g, "");

      const isShambaTarget =
        normalized === "shamba" ||
        normalized.startsWith("shamba/") ||
        Object.prototype.hasOwnProperty.call(
          SHAMBA_SECTIONS,
          normalized,
        );

      if (isShambaTarget) {
        handleShambaNavigate(normalized);
        return;
      }

      onNavigate?.(target);
    },
    [handleShambaNavigate, onNavigate],
  );

  // ==========================================================
  // CURRENT SECTION
  // ==========================================================

  const currentSection = useMemo(
    () =>
      SHAMBA_SECTIONS[activeSection] ||
      SHAMBA_SECTIONS.home,
    [activeSection],
  );

  const ActiveComponent = currentSection.component;

  const primarySections = useMemo(
    () =>
      Object.entries(SHAMBA_SECTIONS).filter(
        ([, item]) => item.primary,
      ),
    [],
  );

  const openMore = useCallback((mode) => {
    setMoreMode(mode);
    setMoreOpen(true);
  }, []);

  const closeMore = useCallback(() => {
    setMoreOpen(false);
  }, []);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-[calc(100vh-120px)] bg-slate-50/60">
      <div className="mx-auto flex w-full max-w-[1440px]">
        {/* ==================================================
            DESKTOP SIDEBAR
        ================================================== */}

        <aside className="sticky top-0 hidden h-[calc(100vh-80px)] w-[230px] shrink-0 border-r border-slate-200 bg-white lg:block">
          <div className="flex h-full flex-col p-4">
            {/* Brand */}
            <div className="mb-5 rounded-2xl bg-emerald-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <Leaf size={19} />
                </div>

                <div>
                  <div className="text-sm font-black text-slate-900">
                    Shamba
                  </div>

                  <div className="text-[9px] font-bold text-emerald-700">
                    Farm intelligence
                  </div>
                </div>
              </div>
            </div>

            {/* Main navigation */}
            <div className="space-y-1">
              <div className="mb-2 px-3 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                Workspace
              </div>

              {primarySections.map(([key, item]) => (
                <DesktopNavItem
                  key={key}
                  item={item}
                  active={activeSection === key}
                  onClick={() => handleShambaNavigate(key)}
                />
              ))}
            </div>

            {/* More */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="mb-2 px-3 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                Operations
              </div>

              <button
                type="button"
                onClick={() => openMore("desktop")}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-emerald-700"
              >
                <MoreHorizontal
                  size={18}
                  className="text-slate-400"
                />

                More tools
              </button>
            </div>

            {/* AI */}
            <div className="mt-auto pt-5">
              <button
                type="button"
                onClick={() => onOpenAI?.()}
                className="w-full rounded-2xl bg-slate-900 p-4 text-left text-white shadow-lg transition hover:bg-slate-800"
              >
                <div className="text-[9px] font-black uppercase tracking-wider text-emerald-400">
                  RevelaAI
                </div>

                <div className="mt-1 text-sm font-black">
                  Ask about your farm
                </div>

                <div className="mt-1 text-[10px] leading-4 text-slate-400">
                  Crops, weather, markets and farm decisions.
                </div>
              </button>
            </div>
          </div>
        </aside>

        {/* ==================================================
            MAIN CONTENT
        ================================================== */}

        <main className="min-w-0 flex-1 pb-24 lg:pb-8">
          {/* ==================================================
              COMMAND HEADER
          ================================================== */}

          <header
            className="
              sticky
              top-0
              z-40
              shrink-0
              border-b
              border-gray-200
              bg-white/95
              backdrop-blur-md
              dark:border-gray-800
              dark:bg-gray-950/95
            "
          >
            <div
              className="
                flex
                min-h-16
                items-center
                justify-between
                gap-3
                px-3
                sm:px-4
                lg:px-6
              "
            >
              {/* SHAMBA CONTEXT */}
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-gradient-to-br
                    from-emerald-500
                    to-emerald-700
                    text-white
                    shadow-md
                    shadow-emerald-900/10
                  "
                  aria-hidden="true"
                >
                  <Leaf size={19} />
                </div>

                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <h1
                      className="
                        truncate
                        text-sm
                        font-bold
                        text-gray-900
                        dark:text-white
                        sm:text-base
                      "
                    >
                      {currentSection.label}
                    </h1>

                    <span
                      className="
                        hidden
                        rounded-full
                        border
                        border-emerald-200
                        bg-emerald-50
                        px-2
                        py-1
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.12em]
                        text-emerald-700
                        dark:border-emerald-800/60
                        dark:bg-emerald-950/50
                        dark:text-emerald-300
                        sm:inline-flex
                      "
                    >
                      Shamba
                    </span>
                  </div>

                  <p className="mt-0.5 hidden truncate text-[11px] text-gray-500 dark:text-gray-400 sm:block">
                    Agricultural intelligence workspace
                  </p>
                </div>
              </div>

              {/* CONTEXT ACTIONS */}
              <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
                <LocationBadge
                  location={location}
                  status={locationStatus}
                  onDetect={detectLocation}
                />

                <button
                  type="button"
                  onClick={() => onOpenAI?.()}
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    text-gray-600
                    shadow-sm
                    transition-all
                    duration-200
                    hover:-translate-y-0.5
                    hover:bg-gray-100
                    hover:shadow-md
                    active:scale-95
                    dark:border-gray-800
                    dark:bg-gray-900
                    dark:text-gray-200
                    dark:hover:bg-gray-800
                  "
                  aria-label="Open RevelaAI for Shamba"
                  title="Ask RevelaAI about your farm"
                >
                  <span className="relative flex h-5 w-5 items-center justify-center">
                    <span
                      className="absolute inset-0 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10"
                      aria-hidden="true"
                    />
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="relative h-4 w-4 text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 3L13.7 8.3L19 10L13.7 11.7L12 17L10.3 11.7L5 10L10.3 8.3L12 3Z"
                        fill="currentColor"
                      />
                      <path
                        d="M19 15L19.7 17.3L22 18L19.7 18.7L19 21L18.3 18.7L16 18L18.3 17.3L19 15Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </header>

          {/* ==================================================
              LOCATION ERROR
          ================================================== */}

          <div className="px-4 pt-4 sm:px-6 lg:px-8">
            <LocationError
              message={locationError}
              onRetry={detectLocation}
            />
          </div>

          {/* ==================================================
              LOCATION INTELLIGENCE CARD
          ================================================== */}

          {!location && (
            <div className="px-4 pt-4 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={detectLocation}
                disabled={locationStatus === "detecting"}
                className="flex w-full items-center gap-4 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-5 text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md disabled:cursor-wait disabled:opacity-80"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                  <LocateFixed
                    size={22}
                    className={
                      locationStatus === "detecting"
                        ? "animate-pulse"
                        : undefined
                    }
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-900">
                    {locationStatus === "detecting"
                      ? "Detecting farm location"
                      : "Enable farm location"}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Shamba uses your device location to improve farm weather,
                    regional recommendations, crop intelligence and local
                    market information.
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* ==================================================
              ACTIVE DASHBOARD
          ================================================== */}

          <div className="px-4 pt-5 sm:px-6 lg:px-8 lg:pt-6">
            <Suspense
              fallback={
                <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
                  <Loading />
                </div>
              }
            >
              <ActiveComponent
                user={user}
                location={location}
                onNavigate={handleDashboardNavigate}
                onOpenAI={onOpenAI}
              />
            </Suspense>
          </div>
        </main>
      </div>

      {/* ====================================================
          MOBILE BOTTOM NAVIGATION
      ==================================================== */}

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-lg lg:hidden">
        <div className="mx-auto flex max-w-[600px] items-center gap-1">
          {MOBILE_PRIMARY_KEYS.map((key) => {
            const item = SHAMBA_SECTIONS[key];

            if (!item) {
              return null;
            }

            return (
              <MobileNavItem
                key={key}
                item={item}
                active={activeSection === key}
                onClick={() => handleShambaNavigate(key)}
              />
            );
          })}

          <button
            type="button"
            onClick={() => openMore("mobile")}
            aria-label="Open more Shamba tools"
            className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition ${
              moreOpen ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            <MoreHorizontal size={17} />

            <span className="text-[8px] font-black">More</span>
          </button>
        </div>
      </div>

      {/* ====================================================
          MORE DRAWER
      ==================================================== */}

      <MoreDrawer
        open={moreOpen}
        onClose={closeMore}
        activeSection={activeSection}
        onNavigate={handleShambaNavigate}
        mode={moreMode}
      />
    </div>
  );
}
