// src/Dashboard/ShambaFarmsDashboard.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Plus,
  RefreshCw,
  Ruler,
  Sprout,
  Tractor,
  ShieldCheck,
  Clock,
  User,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

// =========================================================
// CONSTANTS
// =========================================================

const EMPTY_FORM = {
  name: "",
  county: "",
  town: "",
  location: "",
  size: "",
  size_unit: "acres",
  soil_type: "",
  irrigation: "",
  description: "",
};

const EMPTY_PROFILE_FORM = {
  farmer_name: "",
  phone: "",
  county: "",
  town: "",
  location: "",
  farming_type: "mixed",
  experience_years: "0",
  primary_crops: "",
  livestock: "",
  soil_type: "",
  water_source: "",
  irrigation_available: false,
  preferred_contact_method: "phone",
  sub_county: "",
  village: "",
  primary_goal: "food_and_income",
  target_market: "",
  farm_size: "",
  farm_size_unit: "acres",
  declaration: false,
  privacy_consent: false,
  gps_consent: false,
  latitude: null,
  longitude: null,
  location_accuracy: null,
  location_source: "manual",
  location_precision: "unspecified",
  description: "",
};

const INPUT_CLASS = `
  w-full rounded-xl border border-[#DCE5E1] bg-white px-3 py-2.5
  text-sm text-slate-900 outline-none transition
  placeholder:text-slate-300
  focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100
  dark:border-slate-700 dark:bg-slate-900 dark:text-white
  dark:placeholder:text-slate-500 dark:focus:border-emerald-500
  dark:focus:ring-emerald-950/40
`;

// =========================================================
// HELPERS
// =========================================================

function getFarmId(farm) {
  return farm?.id || farm?._id || null;
}

function getFarmerName(user) {
  return (
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    user?.display_name ||
    "Farmer"
  );
}

function formatSize(farm) {
  const value = farm?.size;

  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numericSize = Number(value);
  const unit = farm?.size_unit || "acres";

  if (!Number.isFinite(numericSize)) {
    return `${value} ${unit}`;
  }

  const displaySize = Number.isInteger(numericSize)
    ? numericSize
    : numericSize.toFixed(2);

  return `${displaySize} ${unit}`;
}

function getFarmLocation(farm) {
  return (
    farm?.location ||
    [farm?.town, farm?.county].filter(Boolean).join(", ") ||
    farm?.county ||
    "Location not set"
  );
}

function getActiveFarmCount(farms) {
  return farms.filter((farm) => farm?.status !== "deleted").length;
}

function getTotalArea(farms) {
  return farms.reduce((total, farm) => {
    const size = Number(farm?.size);

    if (!Number.isFinite(size)) {
      return total;
    }

    if (!farm?.size_unit || farm.size_unit === "acres") {
      return total + size;
    }

    return total;
  }, 0);
}

function displayArea(value) {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? value : value.toFixed(2);
}

// =========================================================
// FIELD
// =========================================================

function Field({ label, children, required = false }) {
  return (
    <div>
      <label className="text-[13px] font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">
        {label}
        {required && <span className="ml-1 text-[#087F5B]">*</span>}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

// =========================================================
// FARM CARD
// =========================================================

function FarmCard({ farm }) {
  const farmSize = formatSize(farm);
  const isActive = farm?.status !== "deleted";
  const rightsStatus = String(farm?.legal_verification_status || "not_submitted").toLowerCase();
  const rightsLabel = rightsStatus === "verified"
    ? "Farm rights reviewed"
    : rightsStatus === "pending"
      ? "Rights review pending"
      : rightsStatus === "more_info"
        ? "More details requested"
        : rightsStatus === "rejected"
          ? "Rights review rejected"
          : "Rights review not submitted";

  return (
    <article
      className="
        rounded-2xl border border-[#DCE5E1] bg-white p-4
        shadow-[0_4px_18px_rgba(15,23,42,0.035)] transition-all duration-200
        hover:-translate-y-0.5 hover:border-emerald-100 hover:shadow-md
        dark:border-slate-800 dark:bg-slate-900 dark:shadow-none
        dark:hover:border-emerald-900/60
      "
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#087F5B] dark:bg-emerald-950/40 dark:text-emerald-400">
          <Tractor size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-black text-slate-900 dark:text-white text-base leading-snug text-[#172B25]">
                {farm?.name || "Unnamed Farm"}
              </h3>

              <div className="mt-1 flex min-w-0 items-center gap-1 text-[13px] font-medium text-slate-400">
                <MapPin size={10} className="shrink-0" />
                <span className="truncate">{getFarmLocation(farm)}</span>
              </div>
            </div>

            <span
              className={`shrink-0 rounded-full px-2 py-1 text-[13px] font-black ${
                isActive
                  ? "bg-emerald-50 text-[#075E46] dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {isActive ? "Active" : "Deleted"}
            </span>
          </div>

          <div className="mt-2">
            <span className={`inline-flex rounded-lg px-2 py-1 text-[11px] font-black ${
              rightsStatus === "verified"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                : rightsStatus === "rejected"
                  ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                  : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
            }`}>
              {rightsLabel}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {farmSize && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1.5 text-[13px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Ruler size={10} />
                {farmSize}
              </span>
            )}

            {farm?.soil_type && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1.5 text-[13px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Sprout size={10} />
                {farm.soil_type}
              </span>
            )}

            {farm?.irrigation && (
              <span className="rounded-lg bg-slate-50 px-2 py-1.5 text-[13px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                Irrigation available
              </span>
            )}
          </div>
        </div>
      </div>

      {farm?.description && (
        <p className="mt-3 border-t border-slate-50 pt-3 text-[13px] leading-5 text-slate-400 dark:border-slate-800">
          {farm.description}
        </p>
      )}
    </article>
  );
}

// =========================================================
// SUMMARY CARD
// =========================================================

function SummaryCard({ label, value, icon: Icon, accent = false }) {
  return (
    <div className="rounded-2xl border border-[#DCE5E1] bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.035)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-black uppercase tracking-wide text-slate-400">
            {label}
          </div>
          <div
            className={`mt-1 truncate text-xl font-black ${
              accent
                ? "text-[#075E46] dark:text-emerald-400"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {value}
          </div>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
}

// =========================================================
// ADD FARM MODAL
// =========================================================

function AddFarmModal({
  form,
  setForm,
  saving,
  error,
  onClose,
  onSubmit,
}) {
  const update = useCallback(
    (field, value) => {
      setForm((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [setForm],
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-farm-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#DCE5E1] bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex shrink-0 items-center justify-between border-b border-[#DCE5E1] px-4 py-4 dark:border-slate-800 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#087F5B] dark:bg-emerald-950/50 dark:text-emerald-400">
              <Tractor size={18} />
            </div>

            <div className="min-w-0">
              <h2
                id="add-farm-title"
                className="truncate font-black text-slate-900 dark:text-white text-xl leading-snug tracking-tight text-[#172B25]"
              >
                Add Farm
              </h2>
              <p className="mt-0.5 text-[13px] text-slate-400">
                Add a farm to your Shamba workspace.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
            aria-label="Close add farm dialog"
          >
            <X size={17} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <form onSubmit={onSubmit} className="space-y-4 p-4 sm:p-5">
            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-3 py-3 text-[13px] font-medium leading-5 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            <Field label="Farm name" required>
              <input
                type="text"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                className={INPUT_CLASS}
                placeholder="e.g. Kongowea Farm"
                autoFocus
                required
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="County">
                <input
                  type="text"
                  value={form.county}
                  onChange={(event) => update("county", event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Mombasa"
                />
              </Field>

              <Field label="Town">
                <input
                  type="text"
                  value={form.town}
                  onChange={(event) => update("town", event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Mombasa"
                />
              </Field>
            </div>

            <Field label="Location / Area">
              <input
                type="text"
                value={form.location}
                onChange={(event) => update("location", event.target.value)}
                className={INPUT_CLASS}
                placeholder="Village, area or estate"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Farm size">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.size}
                  onChange={(event) => update("size", event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="5"
                />
              </Field>

              <Field label="Unit">
                <select
                  value={form.size_unit}
                  onChange={(event) => update("size_unit", event.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="acres">Acres</option>
                  <option value="hectares">Hectares</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Soil type">
                <input
                  type="text"
                  value={form.soil_type}
                  onChange={(event) => update("soil_type", event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Loamy"
                />
              </Field>

              <Field label="Irrigation availability">
                <select
                  value={form.irrigation}
                  onChange={(event) => update("irrigation", event.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">Not specified</option>
                  <option value="true">Irrigation available</option>
                  <option value="false">No irrigation available</option>
                </select>
              </Field>
            </div>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                rows={3}
                className={`${INPUT_CLASS} resize-none`}
                placeholder="Optional details about your farm"
              />
            </Field>

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-[#DCE5E1] bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#087F5B] px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#075E46] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={16} />
                {saving ? "Saving Farm..." : "Add Farm"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// MAIN DASHBOARD
// =========================================================

export default function ShambaFarmsDashboard({ onNavigate }) {
  const { user } = useAuth();
  const { getFarmer, saveFarmer, getFarms, createFarm } = useJumuiyaApi();

  const [farms, setFarms] = useState([]);
  const [farmerProfile, setFarmerProfile] = useState(null);
  const [farmerLoading, setFarmerLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ ...EMPTY_PROFILE_FORM });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileStep, setProfileStep] = useState(0);
  const [profileFieldErrors, setProfileFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // =======================================================
  // LOAD FARMER PROFILE
  // =======================================================

  const loadFarmer = useCallback(async () => {
    try {
      setFarmerLoading(true);
      setProfileError("");
      const result = await getFarmer();
      const profile = result?.farmer || result?.profile || result || null;
      setFarmerProfile(profile && typeof profile === "object" ? profile : null);

      if (profile && typeof profile === "object") {
        setProfileForm({
          ...EMPTY_PROFILE_FORM,
          farmer_name: profile.farmer_name || "",
          phone: profile.phone || "",
          preferred_contact_method: profile.preferred_contact_method || "phone",
          county: profile.county || "",
          sub_county: profile.sub_county || "",
          town: profile.town || "",
          village: profile.village || "",
          location: profile.location || "",
          farming_type: profile.farming_type || "mixed",
          experience_years: String(profile.experience_years ?? 0),
          primary_crops: Array.isArray(profile.primary_crops) ? profile.primary_crops.join(", ") : "",
          livestock: Array.isArray(profile.livestock) ? profile.livestock.join(", ") : "",
          soil_type: profile.soil_type || "",
          water_source: profile.water_source || "",
          irrigation_available: Boolean(profile.irrigation_available),
          primary_goal: profile.primary_goal || "food_and_income",
          target_market: profile.target_market || "",
          farm_size: profile.farm_size === null || profile.farm_size === undefined ? "" : String(profile.farm_size),
          farm_size_unit: profile.farm_size_unit || "acres",
          declaration: Boolean(profile.declaration),
          privacy_consent: Boolean(profile.privacy_consent),
          gps_consent: Boolean(profile.gps_consent),
          latitude: profile.latitude ?? null,
          longitude: profile.longitude ?? null,
          location_accuracy: profile.location_accuracy ?? null,
          location_source: profile.location_source || "manual",
          location_precision: profile.location_precision || "unspecified",
          description: profile.description || "",
        });
      } else {
        const accountName = getFarmerName(user);
        setProfileForm({
          ...EMPTY_PROFILE_FORM,
          farmer_name: accountName === "Farmer" ? "" : accountName,
          phone: user?.phone || user?.phone_number || "",
          county: user?.county || "",
          town: user?.town || "",
        });
      }
    } catch (err) {
      setProfileError(err?.message || "Unable to load your farmer profile.");
    } finally {
      setFarmerLoading(false);
    }
  }, [getFarmer, user]);

  // =======================================================
  // LOAD FARMS
  // =======================================================

  const loadFarms = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const result = await getFarms();
        const farmList = Array.isArray(result)
          ? result
          : result?.farms || [];

        setFarms(
          Array.isArray(farmList)
            ? farmList.filter((farm) => farm?.status !== "deleted")
            : [],
        );
      } catch (err) {
        setError(err?.message || "Unable to load your farms.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getFarms],
  );

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  useEffect(() => {
    loadFarmer();
  }, [loadFarmer]);

  const verificationStatus = farmerProfile?.verification_status_display || farmerProfile?.verification_status || "not_submitted";
  const profileApproved = ["approved", "verified"].includes(String(verificationStatus).toLowerCase());
  const profileCanEdit = !farmerProfile ||
    ["not_submitted", "draft", "rejected", "more_info"].includes(String(verificationStatus).toLowerCase());

  const updateProfileField = useCallback((field, value) => {
    setProfileForm((current) => ({ ...current, [field]: value }));
    setProfileFieldErrors((current) => ({ ...current, [field]: "" }));
    setProfileError("");
    setProfileMessage("");
  }, []);

  const handleProfileSubmit = useCallback(async (event, intent = "submit") => {
    event?.preventDefault?.();
    const errors = {};
    if (intent === "submit") {
      if (!profileForm.farmer_name.trim()) errors.farmer_name = "Enter your display name.";
      if (!profileForm.phone.trim()) errors.phone = "Enter a contact phone.";
      if (!profileForm.county.trim()) errors.county = "Choose or enter your county.";
      if (!profileForm.town.trim()) errors.town = "Enter your town or nearest centre.";
      if (!profileForm.farming_type.trim()) errors.farming_type = "Choose your farming type.";
      if (!profileForm.declaration) errors.declaration = "Confirm the details are accurate and you are authorised to submit them.";
      if (!profileForm.privacy_consent) errors.privacy_consent = "Consent is required to submit this profile to Shamba.";
    }
    const years = Number(profileForm.experience_years || 0);
    if (!Number.isInteger(years) || years < 0 || years > 80) errors.experience_years = "Enter a whole number from 0 to 80.";
    setProfileFieldErrors(errors);
    if (Object.keys(errors).length) {
      setProfileError("Complete the required fields shown below before continuing.");
      const key = Object.keys(errors)[0];
      if (["farmer_name", "phone"].includes(key)) setProfileStep(0);
      else if (["county", "town"].includes(key)) setProfileStep(1);
      else if (["farming_type", "experience_years"].includes(key)) setProfileStep(2);
      else setProfileStep(4);
      return;
    }
    try {
      setProfileSaving(true);
      setProfileError("");
      setProfileMessage("");
      const result = await saveFarmer({
        intent,
        farmer_name: profileForm.farmer_name.trim(),
        phone: profileForm.phone.trim(),
        preferred_contact_method: profileForm.preferred_contact_method,
        county: profileForm.county.trim(),
        sub_county: profileForm.sub_county.trim(),
        town: profileForm.town.trim(),
        village: profileForm.village.trim(),
        location: profileForm.location.trim(),
        farming_type: profileForm.farming_type,
        experience_years: years,
        primary_crops: profileForm.primary_crops.split(",").map((item) => item.trim()).filter(Boolean),
        livestock: profileForm.livestock.split(",").map((item) => item.trim()).filter(Boolean),
        soil_type: profileForm.soil_type.trim(),
        water_source: profileForm.water_source.trim(),
        irrigation_available: Boolean(profileForm.irrigation_available),
        primary_goal: profileForm.primary_goal,
        target_market: profileForm.target_market.trim(),
        farm_size: profileForm.farm_size === "" ? null : Number(profileForm.farm_size),
        farm_size_unit: profileForm.farm_size_unit,
        gps_consent: Boolean(profileForm.gps_consent),
        latitude: profileForm.gps_consent ? profileForm.latitude : null,
        longitude: profileForm.gps_consent ? profileForm.longitude : null,
        location_accuracy: profileForm.gps_consent ? profileForm.location_accuracy : null,
        location_source: profileForm.location_source,
        location_precision: profileForm.location_precision,
        declaration: intent === "submit" ? Boolean(profileForm.declaration) : false,
        privacy_consent: intent === "submit" ? Boolean(profileForm.privacy_consent) : false,
        description: profileForm.description.trim(),
      });
      const saved = result?.farmer || result?.profile || result;
      if (saved && typeof saved === "object" && saved.verification_status) setFarmerProfile(saved);
      else await loadFarmer();
      setProfileMessage(intent === "draft"
        ? "Draft saved privately. Resume the profile and submit it when you are ready."
        : "Your farmer profile was submitted for administrator review. Farm registration unlocks after approval.");
    } catch (err) {
      setProfileError(err?.message || "Unable to save your farmer profile.");
    } finally {
      setProfileSaving(false);
    }
  }, [loadFarmer, profileForm, saveFarmer]);

  // =======================================================
  // CREATE FARM
  // =======================================================

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      const farmName = String(form.name || "").trim();

      if (!farmName) {
        setError("Farm name is required.");
        return;
      }

      if (form.size !== "" && Number(form.size) < 0) {
        setError("Farm size cannot be negative.");
        return;
      }

      try {
        setSaving(true);
        setError("");

        const payload = {
          name: farmName,
          county: String(form.county || "").trim(),
          town: String(form.town || "").trim(),
          location: String(form.location || "").trim(),
          size:
            form.size === "" || form.size === null
              ? ""
              : Number(form.size),
          size_unit: form.size_unit || "acres",
          soil_type: String(form.soil_type || "").trim(),
          irrigation: form.irrigation === "true",
          description: String(form.description || "").trim(),
        };

        await createFarm(payload);

        setForm({ ...EMPTY_FORM });
        setModalOpen(false);
        await loadFarms();
      } catch (err) {
        setError(err?.message || "Unable to create farm.");
      } finally {
        setSaving(false);
      }
    },
    [createFarm, form, loadFarms],
  );

  // =======================================================
  // SUMMARY
  // =======================================================

  const totalFarms = useMemo(() => getActiveFarmCount(farms), [farms]);
  const totalArea = useMemo(() => getTotalArea(farms), [farms]);

  const farmerName = useMemo(() => getFarmerName(user), [user]);

  // =======================================================
  // MODAL ACTIONS
  // =======================================================

  const openAddFarm = useCallback(() => {
    if (!profileApproved) {
      setError("Submit your Shamba farmer profile and wait for administrator approval before adding a farm.");
      return;
    }
    setError("");
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  }, [profileApproved]);

  const closeAddFarm = useCallback(() => {
    if (saving) return;
    setModalOpen(false);
  }, [saving]);

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="mx-auto w-full max-w-none pb-24">
      {/* ==================================================
          PAGE TOOLBAR
      ================================================== */}

      <section className="mb-5 border-b border-[#DCE5E1] pb-4 dark:border-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-[13px] font-bold text-slate-400">
              <button
                type="button"
                onClick={() => onNavigate?.("shamba")}
                className="inline-flex items-center gap-1 transition hover:text-[#087F5B]"
              >
                <ArrowLeft size={12} />
                Shamba
              </button>
              <span>/</span>
              <span className="text-slate-500 dark:text-slate-300">My Farms</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#087F5B] dark:bg-emerald-950/40 dark:text-emerald-400">
                <Tractor size={19} />
              </div>

              <div className="min-w-0">
                <h1 className="truncate font-black tracking-tight text-slate-900 dark:text-white text-[clamp(26px,2.3vw,30px)] leading-tight tracking-tight text-[#172B25]">
                  My Farms
                </h1>
                <p className="mt-0.5 truncate text-[13px] text-slate-400">
                  Manage your farms and growing spaces.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadFarms({ silent: true })}
              disabled={loading || refreshing}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#DCE5E1] bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Refresh farms"
              title="Refresh farms"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>

            <button
              type="button"
              onClick={openAddFarm}
              disabled={!profileApproved || farmerLoading}
              title={!profileApproved ? "Farmer profile approval is required" : "Add a farm"}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#087F5B] px-4 py-2.5 text-[13px] font-black text-white shadow-sm transition hover:bg-[#075E46] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={15} />
              Add Farm
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================
          FARMER PROFILE VERIFICATION
      ================================================== */}

      <section className="mb-5 overflow-hidden rounded-2xl border border-[#DCE5E1] bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start gap-3 border-b border-[#DCE5E1] bg-gradient-to-r from-emerald-50 to-white px-4 py-4 dark:border-slate-800 dark:from-emerald-950/30 dark:to-slate-950 sm:px-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#087F5B] text-white">
            {profileApproved ? <ShieldCheck size={19} /> : verificationStatus === "pending" ? <Clock size={19} /> : <User size={19} />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-black text-slate-900 dark:text-white">Farmer identity & verification</h2>
            <p className="mt-0.5 text-[13px] leading-5 text-slate-500 dark:text-slate-400">
              Shamba farm registration unlocks only after an administrator approves your farmer profile.
            </p>
          </div>
          {!farmerLoading && (
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${
              profileApproved ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" :
              verificationStatus === "pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" :
              "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}>
              {profileApproved ? "Verified farmer" : String(verificationStatus).toLowerCase() === "pending" ? "Under review" : String(verificationStatus).toLowerCase() === "draft" ? "Draft saved" : String(verificationStatus).toLowerCase() === "rejected" ? "Not approved" : String(verificationStatus).toLowerCase() === "more_info" ? "More info needed" : "Not submitted"}
            </span>
          )}
        </div>

        <div className="p-4 sm:p-5">
          {farmerLoading ? (
            <div className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          ) : profileApproved ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{farmerProfile?.farmer_name}</p>
                <p className="mt-1 text-[13px] text-slate-500">{farmerProfile?.town}, {farmerProfile?.county} · {farmerProfile?.farming_type}</p>
                <p className="mt-2 text-[13px] leading-5 text-emerald-800 dark:text-emerald-300">
                  Your farmer profile is approved. Each farm still needs its own farm-rights review for protected operations.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 text-[13px] font-black text-emerald-700 dark:text-emerald-300">
                <ShieldCheck size={16} /> Verified profile
              </span>
            </div>
          ) : verificationStatus === "pending" ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
              <p className="font-black text-amber-900 dark:text-amber-200">Your profile is in the review queue</p>
              <p className="mt-1 text-[13px] leading-5 text-amber-800 dark:text-amber-300">
                You can continue viewing Shamba, but adding a farm is locked until an administrator makes a decision.
              </p>
              {farmerProfile?.verification_review_notes && (
                <p className="mt-2 text-[13px] leading-5 text-slate-700 dark:text-slate-300">Admin note: {farmerProfile.verification_review_notes}</p>
              )}
              {profileMessage && (
                <p role="status" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] leading-5 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">{profileMessage}</p>
              )}
            </div>
          ) : (
            <form onSubmit={(event) => profileStep < 4 ? event.preventDefault() : handleProfileSubmit(event, "submit")} className="space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-3 text-[13px] leading-5 text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-200">
                {verificationStatus === "rejected"
                  ? "Your previous submission was not approved. Read the review note, correct the details and resubmit."
                  : verificationStatus === "more_info"
                    ? "The administrator needs additional information. Update relevant fields and resubmit."
                    : verificationStatus === "draft"
                      ? "Your saved draft is private and does not grant farm or seller permissions."
                      : "Complete the short steps below. You do not need to provide a national ID or passport number."}
                {(farmerProfile?.review_notes || farmerProfile?.verification_review_notes) && <p className="mt-2 font-semibold">Reviewer note: {farmerProfile.review_notes || farmerProfile.verification_review_notes}</p>}
              </div>
              {profileError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] leading-5 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">{profileError}</p>}
              {profileMessage && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[13px] leading-5 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">{profileMessage}</p>}
              <div className="grid grid-cols-5 gap-1.5" aria-label="Farmer profile setup steps">
                {["About you", "Location", "Farming", "Goals", "Review"].map((label, index) => <button key={label} type="button" onClick={() => { if (index <= profileStep) setProfileStep(index); }} aria-current={profileStep === index ? "step" : undefined} className={"min-w-0 rounded-xl px-1.5 py-2 text-center text-[10px] font-black sm:px-2 sm:text-xs " + (profileStep === index ? "bg-[#123D2F] text-white" : index < profileStep ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200" : "bg-slate-100 text-slate-400 dark:bg-slate-800")}><span className="block">{index + 1}</span><span className="mt-0.5 block truncate">{label}</span></button>)}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-label="Profile completion" aria-valuemin={0} aria-valuemax={5} aria-valuenow={profileStep + 1}><div className="h-full rounded-full bg-[#72A966] transition-all" style={{ width: (((profileStep + 1) / 5) * 100) + "%" }} /></div>

              {profileStep === 0 && <section className="space-y-4" aria-labelledby="profile-step-about">
                <div><h3 id="profile-step-about" className="text-base font-black text-slate-900 dark:text-white">About you</h3><p className="mt-1 text-xs leading-5 text-slate-500">Use a display name and contact method. Shamba will not ask for identity-document numbers here.</p></div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Farmer / display name" required><input value={profileForm.farmer_name} onChange={(e) => updateProfileField("farmer_name", e.target.value)} className={INPUT_CLASS} autoComplete="name" required aria-invalid={Boolean(profileFieldErrors.farmer_name)} />{profileFieldErrors.farmer_name && <span className="mt-1 block text-xs text-red-600" role="alert">{profileFieldErrors.farmer_name}</span>}</Field>
                  <Field label="Contact phone" required><input value={profileForm.phone} onChange={(e) => updateProfileField("phone", e.target.value)} className={INPUT_CLASS} type="tel" autoComplete="tel" placeholder="+254…" required aria-invalid={Boolean(profileFieldErrors.phone)} />{profileFieldErrors.phone && <span className="mt-1 block text-xs text-red-600" role="alert">{profileFieldErrors.phone}</span>}</Field>
                  <Field label="Preferred contact method"><select value={profileForm.preferred_contact_method} onChange={(e) => updateProfileField("preferred_contact_method", e.target.value)} className={INPUT_CLASS}><option value="phone">Phone call</option><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option></select></Field>
                </div>
              </section>}

              {profileStep === 1 && <section className="space-y-4" aria-labelledby="profile-step-location">
                <div><h3 id="profile-step-location" className="text-base font-black text-slate-900 dark:text-white">Where you farm</h3><p className="mt-1 text-xs leading-5 text-slate-500">County and nearby town are required. More precise location and GPS are optional.</p></div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="County" required><input value={profileForm.county} onChange={(e) => updateProfileField("county", e.target.value)} className={INPUT_CLASS} autoComplete="address-level1" required aria-invalid={Boolean(profileFieldErrors.county)} />{profileFieldErrors.county && <span role="alert" className="mt-1 block text-xs text-red-600">{profileFieldErrors.county}</span>}</Field>
                  <Field label="Sub-county (optional)"><input value={profileForm.sub_county} onChange={(e) => updateProfileField("sub_county", e.target.value)} className={INPUT_CLASS} /></Field>
                  <Field label="Town / nearest centre" required><input value={profileForm.town} onChange={(e) => updateProfileField("town", e.target.value)} className={INPUT_CLASS} required aria-invalid={Boolean(profileFieldErrors.town)} />{profileFieldErrors.town && <span role="alert" className="mt-1 block text-xs text-red-600">{profileFieldErrors.town}</span>}</Field>
                  <Field label="Village / area (optional)"><input value={profileForm.village} onChange={(e) => updateProfileField("village", e.target.value)} className={INPUT_CLASS} /></Field>
                  <Field label="Additional location description (optional)"><input value={profileForm.location} onChange={(e) => updateProfileField("location", e.target.value)} className={INPUT_CLASS} placeholder="e.g. near the cooperative" /></Field>
                </div>
                <div className="rounded-xl border border-[#DCE7DE] p-3 dark:border-slate-700"><p className="text-xs font-black text-slate-800 dark:text-white">Optional GPS sharing</p><p className="mt-1 text-xs leading-5 text-slate-500">This version does not request device coordinates automatically. Manual location is sufficient to submit a profile.</p></div>
              </section>}

              {profileStep === 2 && <section className="space-y-4" aria-labelledby="profile-step-farming">
                <div><h3 id="profile-step-farming" className="text-base font-black text-slate-900 dark:text-white">What you grow</h3><p className="mt-1 text-xs leading-5 text-slate-500">Crop, soil and water details improve guidance but do not exclude smallholder farmers when unknown.</p></div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Farming type" required><select value={profileForm.farming_type} onChange={(e) => updateProfileField("farming_type", e.target.value)} className={INPUT_CLASS} required><option value="mixed">Mixed farming</option><option value="crop">Crop farming</option><option value="livestock">Livestock</option><option value="horticulture">Horticulture</option><option value="aquaculture">Aquaculture</option><option value="agribusiness">Agribusiness</option><option value="other">Other</option></select>{profileFieldErrors.farming_type && <span role="alert" className="mt-1 block text-xs text-red-600">{profileFieldErrors.farming_type}</span>}</Field>
                  <Field label="Years of experience"><input type="number" min="0" max="80" step="1" value={profileForm.experience_years} onChange={(e) => updateProfileField("experience_years", e.target.value)} className={INPUT_CLASS} aria-invalid={Boolean(profileFieldErrors.experience_years)} />{profileFieldErrors.experience_years && <span role="alert" className="mt-1 block text-xs text-red-600">{profileFieldErrors.experience_years}</span>}</Field>
                  <Field label="Main crops (optional)"><input value={profileForm.primary_crops} onChange={(e) => updateProfileField("primary_crops", e.target.value)} className={INPUT_CLASS} placeholder="Maize, beans, tomatoes" /></Field>
                  <Field label="Livestock (optional)"><input value={profileForm.livestock} onChange={(e) => updateProfileField("livestock", e.target.value)} className={INPUT_CLASS} placeholder="Dairy cattle, poultry" /></Field>
                  <Field label="Soil type (optional)"><input value={profileForm.soil_type} onChange={(e) => updateProfileField("soil_type", e.target.value)} className={INPUT_CLASS} /></Field>
                  <Field label="Main water source (optional)"><select value={profileForm.water_source} onChange={(e) => updateProfileField("water_source", e.target.value)} className={INPUT_CLASS}><option value="">Not sure / not recorded</option><option value="rainfall">Rainfall</option><option value="borehole">Borehole</option><option value="river">River</option><option value="dam">Dam / reservoir</option><option value="piped">Piped water</option><option value="other">Other</option></select></Field>
                  <label className="flex min-h-11 items-center rounded-xl border border-[#DCE7DE] px-3 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"><input type="checkbox" checked={profileForm.irrigation_available} onChange={(e) => updateProfileField("irrigation_available", e.target.checked)} className="h-4 w-4 accent-emerald-700" /><span className="ml-2">I have irrigation access</span></label>
                </div>
              </section>}

              {profileStep === 3 && <section className="space-y-4" aria-labelledby="profile-step-goals">
                <div><h3 id="profile-step-goals" className="text-base font-black text-slate-900 dark:text-white">Your goals</h3><p className="mt-1 text-xs leading-5 text-slate-500">Optional planning details help tailor market and production guidance.</p></div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Primary goal"><select value={profileForm.primary_goal} onChange={(e) => updateProfileField("primary_goal", e.target.value)} className={INPUT_CLASS}><option value="food_and_income">Food and income</option><option value="commercial">Commercial production</option><option value="subsistence">Household food</option><option value="livestock">Livestock production</option><option value="export">Export market</option><option value="agribusiness">Agribusiness</option><option value="market_access">Market access</option></select></Field>
                  <Field label="Target buyers / market (optional)"><input value={profileForm.target_market} onChange={(e) => updateProfileField("target_market", e.target.value)} className={INPUT_CLASS} placeholder="Local market, cooperative…" /></Field>
                  <Field label="Farm-size summary (optional)"><input type="number" min="0" step="0.01" value={profileForm.farm_size} onChange={(e) => updateProfileField("farm_size", e.target.value)} className={INPUT_CLASS} placeholder="Leave blank if unknown" /></Field>
                  <Field label="Farm-size unit"><select value={profileForm.farm_size_unit} onChange={(e) => updateProfileField("farm_size_unit", e.target.value)} className={INPUT_CLASS}><option value="acres">Acres</option><option value="hectares">Hectares</option><option value="square_metres">Square metres</option></select></Field>
                </div>
                <Field label="About your farming operation (optional)"><textarea value={profileForm.description} onChange={(e) => updateProfileField("description", e.target.value)} rows={3} maxLength={1000} className={INPUT_CLASS + " resize-y"} placeholder="Briefly describe your farming operation and goals." /></Field>
              </section>}

              {profileStep === 4 && <section className="space-y-4" aria-labelledby="profile-step-review">
                <div><h3 id="profile-step-review" className="text-base font-black text-slate-900 dark:text-white">Review and submit</h3><p className="mt-1 text-xs leading-5 text-slate-500">Check the details below before sending them to Shamba’s authorized reviewers.</p></div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{[["Farmer",profileForm.farmer_name],["Contact",profileForm.phone],["Preferred contact",profileForm.preferred_contact_method],["County",profileForm.county],["Sub-county",profileForm.sub_county],["Town",profileForm.town],["Village / area",profileForm.village || profileForm.location],["Farming type",profileForm.farming_type],["Experience",(profileForm.experience_years || 0) + " years"],["Crops",profileForm.primary_crops],["Livestock",profileForm.livestock],["Goal",profileForm.primary_goal],["Target market",profileForm.target_market],["Farm size",profileForm.farm_size ? profileForm.farm_size + " " + profileForm.farm_size_unit : "Not supplied"]].map(([label, value]) => <div key={label} className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-xs font-semibold text-slate-800 dark:text-slate-200">{value || "Not supplied"}</p></div>)}</div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">Shamba uses these details to provide agricultural features and review your farmer profile. This platform review is not a title search or government certificate. Do not include national ID or passport numbers.</div>
                <label className="flex items-start gap-3 rounded-xl border border-[#DCE7DE] p-3 text-xs leading-5 text-slate-700 dark:border-slate-700 dark:text-slate-200"><input type="checkbox" checked={profileForm.declaration} onChange={(e) => updateProfileField("declaration", e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-emerald-700" /><span>I confirm this information is accurate to the best of my knowledge and I am authorized to provide it for this profile.<span className="text-red-600"> *</span>{profileFieldErrors.declaration && <span className="mt-1 block text-red-600">{profileFieldErrors.declaration}</span>}</span></label>
                <label className="flex items-start gap-3 rounded-xl border border-[#DCE7DE] p-3 text-xs leading-5 text-slate-700 dark:border-slate-700 dark:text-slate-200"><input type="checkbox" checked={profileForm.privacy_consent} onChange={(e) => updateProfileField("privacy_consent", e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-emerald-700" /><span>I consent to Shamba using these details to operate the hub and allow authorized reviewers to assess this submission.<span className="text-red-600"> *</span>{profileFieldErrors.privacy_consent && <span className="mt-1 block text-red-600">{profileFieldErrors.privacy_consent}</span>}</span></label>
              </section>}

              <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t border-[#DCE7DE] bg-white/95 p-3 backdrop-blur sm:-mx-5 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-slate-800 dark:bg-slate-950/95">
                <div className="flex flex-wrap items-center gap-2"><button type="button" disabled={profileStep === 0 || profileSaving} onClick={() => setProfileStep((step) => Math.max(0, step - 1))} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#DCE7DE] px-3 py-2 text-xs font-black text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">Back</button>
                  {profileStep < 4 && <button type="button" disabled={profileSaving} onClick={() => { const errors = {}; if (profileStep === 0) { if (!profileForm.farmer_name.trim()) errors.farmer_name = "Enter your display name."; if (!profileForm.phone.trim()) errors.phone = "Enter a contact phone."; } if (profileStep === 1) { if (!profileForm.county.trim()) errors.county = "Enter a county."; if (!profileForm.town.trim()) errors.town = "Enter a town or nearby centre."; } if (profileStep === 2 && !profileForm.farming_type.trim()) errors.farming_type = "Choose your farming type."; setProfileFieldErrors((current) => ({ ...current, ...errors })); if (Object.keys(errors).length) { setProfileError("Complete the required fields shown before continuing."); return; } setProfileError(""); setProfileStep((step) => Math.min(4, step + 1)); }} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#123D2F] px-4 py-2 text-xs font-black text-white hover:bg-[#205A43]">Continue<ArrowRight size={14}/></button>}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end"><button type="button" disabled={profileSaving} onClick={() => handleProfileSubmit(null, "draft")} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#DCE7DE] bg-white px-3 py-2 text-xs font-black text-[#286947] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-emerald-300">{profileSaving ? "Saving…" : "Save draft"}</button>{profileStep === 4 && <button type="submit" disabled={profileSaving} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#123D2F] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#205A43] disabled:opacity-50 sm:flex-none"><ShieldCheck size={15}/>{profileSaving ? "Submitting…" : "Submit for verification"}</button>}</div>
              </div>
            </form>
          )}
          {!profileCanEdit && verificationStatus !== "pending" && !profileApproved && !profileError && (
            <p className="mt-2 text-xs text-slate-500">Refresh this page if the review status has recently changed.</p>
          )}
        </div>
      </section>

      {/* ==================================================
          SUMMARY
      ================================================== */}

      <section className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <SummaryCard
          label="Total farms"
          value={totalFarms}
          icon={Tractor}
          accent
        />

        <SummaryCard
          label="Total acres"
          value={displayArea(totalArea)}
          icon={Ruler}
          accent
        />

        <SummaryCard
          label="Farmer"
          value={farmerName}
          icon={Sprout}
        />
      </section>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && !modalOpen && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] leading-5 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          <span className="min-w-0 flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0 rounded-lg p-1 text-red-500 transition hover:bg-red-100 dark:hover:bg-red-900/40"
            aria-label="Dismiss error"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ==================================================
          FARM LIST
      ================================================== */}

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-black text-slate-900 dark:text-white text-xl leading-snug tracking-tight text-[#172B25]">
              Your Farms
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-400">
              Keep your farm records organized and ready for Shamba intelligence.
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[13px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            {totalFarms} {totalFarms === 1 ? "farm" : "farms"}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : farms.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {farms.map((farm, index) => (
              <FarmCard
                key={getFarmId(farm) || `farm-${index}`}
                farm={farm}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 px-5 py-12 text-center dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#087F5B] shadow-sm dark:bg-slate-900 dark:text-emerald-400">
              <Tractor size={25} />
            </div>

            <div className="mt-4 text-sm font-black text-slate-800 dark:text-white">
              No farms yet
            </div>

            <p className="mx-auto mt-1 max-w-sm text-[13px] leading-5 text-slate-400">
              Add your first farm to begin tracking crops, activities, harvests,
              weather and farm intelligence.
            </p>

            <button
              type="button"
              onClick={openAddFarm}
              disabled={!profileApproved || farmerLoading}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#087F5B] px-4 py-2.5 text-[13px] font-black text-white transition hover:bg-[#075E46] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={15} />
              Add Your First Farm
            </button>
          </div>
        )}
      </section>

      {/* ==================================================
          READY STATE
      ================================================== */}

      {farms.length > 0 && !loading && (
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-[13px] font-semibold text-[#075E46] dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>
            Your farm records are ready for crop, activity, weather and harvest
            tracking.
          </span>
        </div>
      )}

      {/* ==================================================
          ADD FARM MODAL
      ================================================== */}

      {modalOpen && (
        <AddFarmModal
          form={form}
          setForm={setForm}
          saving={saving}
          error={error}
          onClose={closeAddFarm}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
