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
  Home,
  LocateFixed,
  MapPin,
  MoreHorizontal,
  Navigation,
  Package,
  RefreshCw,
  ShoppingCart,
  Sprout,
  Tractor,
  ShieldCheck,
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
              <div className="w-full max-w-md rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
                <div className="text-sm font-black text-red-700">
                  {name} could not be loaded
                </div>

                <p className="mt-2 text-[13px] leading-5 text-red-600">
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

const ShambaFarmerVerificationDashboard = safeLazy(
  () => import("@/Dashboard/ShambaFarmerVerificationDashboard.jsx"),
  "Farmer verification",
);

const ShambaTrustDashboard = safeLazy(
  () => import("@/Dashboard/ShambaTrustDashboard.jsx"),
  "Trust & Safety",
);

function hasFarmerReviewAccess(user) {
  const rawRoles = [
    user?.role,
    user?.user_role,
    ...(Array.isArray(user?.roles) ? user.roles : []),
    ...(Array.isArray(user?.permissions) ? user.permissions : []),
  ];
  const roles = rawRoles.map((entry) =>
    String(typeof entry === "object" ? entry?.name || entry?.role || "" : entry)
      .trim()
      .toLowerCase()
      .replace(/[ -]+/g, "_"),
  );
  return Boolean(
    user?.is_admin ||
    user?.is_super_admin ||
    roles.some((role) => ["admin", "super_admin", "superadmin"].includes(role)),
  );
}

// ============================================================
// NAVIGATION MODEL
// ============================================================

const SHAMBA_SECTIONS = {
  home: {
    label: "Overview",
    shortLabel: "Overview",
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
    label: "Manage Buyers",
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

  trust: {
    label: "Trust & Safety",
    shortLabel: "Trust",
    icon: ShieldCheck,
    component: ShambaTrustDashboard,
    primary: false,
  },

  "farmer-review": {
    label: "Farmer verification",
    shortLabel: "Review",
    icon: ShieldCheck,
    component: ShambaFarmerVerificationDashboard,
    primary: false,
    adminOnly: true,
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
    .replace(/^\/+|\/+$/g, "")
    .replace(/[\s_]+/g, "-");

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
    "manage-buyer": "buyers",
    "manage-buyers": "buyers",
    "buyer-management": "buyers",
    "buyer-management-dashboard": "buyers",
    "buyers-dashboard": "buyers",
    "buyer-dashboard": "buyers",
    "shamba/buyer": "buyers",
    "shamba/buyers": "buyers",
    "shamba/manage-buyer": "buyers",
    "shamba/manage-buyers": "buyers",
    "shamba/buyer-management": "buyers",
    "shamba/buyer-management-dashboard": "buyers",
    "shamba/buyers-dashboard": "buyers",
    "shamba/buyer-dashboard": "buyers",
    "shamba-manage-buyers": "buyers",

    order: "orders",
    orders: "orders",
    "shamba/orders": "orders",

    activity: "activities",
    activities: "activities",
    "shamba/activities": "activities",

    trust: "trust",
    "trust-safety": "trust",
    "shamba/trust": "trust",
    "shamba/trust-safety": "trust",

    "farmer-review": "farmer-review",
    "shamba/farmer-review": "farmer-review",
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
      <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] font-bold text-[#075E46] dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
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
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] font-bold text-gray-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#075E46] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-emerald-800/60 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
        aria-label="Detect device location"
      >
        <MapPin size={14} />

        <span className="hidden sm:inline">Set device location</span>
        <span className="sm:hidden">Set location</span>
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
        className="inline-flex max-w-[230px] items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-[13px] font-bold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
      >
        <CheckCircle2 size={14} className="shrink-0" />

        <span className="min-w-0 truncate">{primaryLocation}</span>

        <ChevronDown size={13} className="shrink-0" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Device location details"
          className="absolute right-0 top-full z-50 mt-2 w-[300px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-800 dark:bg-gray-950"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-black uppercase tracking-wider text-[#087F5B]">
                Device location
              </p>

              <h4 className="mt-1 truncate text-sm font-black text-gray-900 dark:text-white">
                {primaryLocation}
              </h4>
            </div>

            <Navigation size={18} className="shrink-0 text-[#087F5B]" />
          </div>

          <div className="mt-4 space-y-2 text-[13px] text-gray-500 dark:text-gray-400">
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
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-3 py-2.5 text-[13px] font-black text-white transition hover:bg-gray-900 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100"
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
      className={"group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition " + (active ? "bg-[#E6F4E9] text-[#123D2F] shadow-sm" : "text-[#D3E5D9] hover:bg-white/10 hover:text-white")}

    >
      <Icon
        size={17}
        className={
          active
            ? "text-[#123D2F]"
            : "text-[#A9C8B5] group-hover:text-white"
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
        active ? "text-[#087F5B]" : "text-slate-400"
      }`}
    >
      <Icon size={17} />

      <span className="max-w-full truncate text-[13px] font-black">
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
  canReviewFarmers = false,
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

  const entries = Object.entries(SHAMBA_SECTIONS).filter(
    ([, item]) => !item.adminOnly || canReviewFarmers,
  );

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

      <aside className="absolute bottom-0 right-0 top-0 w-[min(380px,88vw)] overflow-y-auto border-l border-[#DCE5E1] bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-[#DCE5E1] bg-white px-5 py-5">
          <div>
            <p className="text-[13px] font-black uppercase tracking-[0.16em] text-[#087F5B]">
              Shamba
            </p>

            <h3 className="mt-1 font-black text-slate-900 text-base leading-snug text-[#172B25]">
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
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition sm:gap-4 sm:rounded-2xl sm:p-4 ${
                    active
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-[#DCE5E1] hover:border-emerald-100 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      active
                        ? "bg-emerald-100 text-[#075E46]"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-black text-white">
                      {item.label}
                    </div>

                    <div className="mt-0.5 text-[13px] text-slate-500">
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

        <p className="text-[13px] leading-5 text-amber-800">{message}</p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 rounded-lg bg-white px-3 py-2 text-[13px] font-black text-amber-700 shadow-sm transition hover:bg-amber-100"
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
  const canReviewFarmers = hasFarmerReviewAccess(user);

  const [activeSection, setActiveSection] = useState("home");
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreMode, setMoreMode] = useState("desktop");

  const {
    location,
    status: locationStatus,
    error: locationError,
    detectLocation,
  } = useFarmLocation();

  // Device location is optional and is requested through an explicit user action.
  // This avoids surprise permission prompts when opening the Shamba workspace.

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
        .replace(/^\/+|\/+$/g, "")
        .replace(/[\s_]+/g, "-");

      const buyerSectionAliases = new Set([
        "buyer",
        "buyers",
        "manage-buyer",
        "manage-buyers",
        "buyer-management",
        "buyer-management-dashboard",
        "buyers-dashboard",
        "buyer-dashboard",
        "shamba-manage-buyers",
      ]);

      const isShambaTarget =
        normalized === "shamba" ||
        normalized.startsWith("shamba/") ||
        buyerSectionAliases.has(normalized) ||
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
    <div className="shamba-workspace isolate min-h-[calc(100vh-120px)] min-w-0 w-full bg-[#F3F6F5] text-[#172B25] font-sans text-sm leading-6">
      <div className="mx-auto flex w-full min-w-0 max-w-none">
        {/* ==================================================
            DESKTOP SIDEBAR
        ================================================== */}

        <aside className="sticky top-0 hidden h-[calc(100vh-80px)] w-[244px] shrink-0 border-r border-[#244638] bg-[#123D2F] text-white min-[1200px]:block">
          <div className="flex h-full flex-col p-4">
            {/* Brand */}
            <div className="mb-4 rounded-2xl border border-white/15 bg-white/[0.06] p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C8EF79] text-[#123D2F] shadow-sm">
                  <Leaf size={19} />
                </div>

                <div>
                  <div className="text-sm font-black text-slate-900">
                    Shamba
                  </div>

                  <div className="text-[13px] font-bold text-[#B5D2C0]">
                    Farm intelligence
                  </div>
                </div>
              </div>
            </div>

            {/* Main navigation */}
            <div className="space-y-1">
              <div className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#91B7A2]">
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
            <div className="mt-6 border-t border-white/15 pt-5">
              <div className="mb-2 px-3 text-[13px] font-black uppercase tracking-[0.16em] text-slate-400">
                Operations
              </div>

              <button
                type="button"
                onClick={() => openMore("desktop")}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[#D3E5D9] transition hover:bg-white/10 hover:text-white"
              >
                <MoreHorizontal
                  size={18}
                  className="text-[#A9C8B5]"
                />

                More tools
              </button>
            </div>

            {/* AI */}
            <div className="mt-auto pt-5">
              <button
                type="button"
                onClick={() => onOpenAI?.()}
                className="w-full rounded-2xl border border-white/15 bg-white/[0.07] p-4 text-left text-white shadow-lg transition hover:bg-white/[0.12]"
              >
                <div className="text-[10px] font-black uppercase tracking-wider text-[#C8EF79]">
                  RevelaAI
                </div>

                <div className="mt-1 text-sm font-black">
                  Ask about your farm
                </div>

                <div className="mt-1 text-[13px] leading-5 text-[#C2DACF]">
                  Crops, weather, markets and farm decisions.
                </div>
              </button>
            </div>
          </div>
        </aside>

        {/* ==================================================
            MAIN CONTENT
        ================================================== */}

        <main className="min-w-0 flex-1 bg-[#F5F8F4] pb-[calc(5.5rem+env(safe-area-inset-bottom))] min-[1200px]:pb-8">
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
              border-[#DCE5E1]
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
                min-[1200px]:px-8
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
                    bg-[#087F5B]
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
                    <div
                      className="
                        truncate
                        text-sm
                        font-bold
                        text-gray-900
                        dark:text-white
                        sm:text-base
                      "
                    >
                      Your farm command centre
                    </div>
                  </div>

                  <p className="mt-0.5 hidden truncate text-[13px] text-gray-500 dark:text-gray-400 sm:block">
                    Your agricultural operations in one place
                  </p>
                </div>
              </div>

              {/* CONTEXT ACTIONS */}
              <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
                {location && (
                  <LocationBadge
                    location={location}
                    status={locationStatus}
                    onDetect={detectLocation}
                  />
                )}

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
                      className="relative h-4 w-4 text-[#087F5B] dark:text-emerald-400"
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

          <div className="px-4 pt-4 sm:px-6 min-[1200px]:px-8">
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
                className="flex w-full items-center gap-3 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-3.5 text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md disabled:cursor-wait disabled:opacity-80 sm:gap-4 sm:rounded-2xl sm:p-4"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#087F5B] text-white">
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
                  <h3 className="font-black text-slate-900 text-base leading-snug text-[#172B25]">
                    {locationStatus === "detecting"
                      ? "Detecting device location"
                      : "Set your device location"}
                  </h3>

                  <p className="mt-1 text-[13px] leading-5 text-slate-500">
                    Optional: share your device location to improve regional weather,
                    recommendations and local market information. Manual county
                    and town details remain sufficient for a farmer profile.
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* ==================================================
              ACTIVE DASHBOARD
          ================================================== */}

          <div className="px-4 pt-5 sm:px-6 min-[1200px]:px-8 min-[1200px]:pt-6">
            <Suspense
              fallback={
                <div className="rounded-2xl border border-[#DCE5E1] bg-white p-8 shadow-sm">
                  <Loading />
                </div>
              }
            >
              <ActiveComponent
                user={user}
                location={location}
                embedded
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

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#DCE5E1] bg-white/95 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-lg min-[1200px]:hidden dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-[600px] items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setMoreOpen(false);
              onNavigate?.("home");
            }}
            aria-label="Return to main home dashboard"
            title="Return to main home dashboard"
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#087F5B] active:scale-95 dark:text-slate-400 dark:hover:bg-slate-900"
          >
            <Home size={18} />
            <span className="max-w-full truncate text-[12px] font-black">Home</span>
          </button>
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
              moreOpen ? "text-[#087F5B]" : "text-slate-400"
            }`}
          >
            <MoreHorizontal size={17} />

            <span className="text-[13px] font-black">More</span>
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
        canReviewFarmers={canReviewFarmers}
      />
    </div>
  );
}
