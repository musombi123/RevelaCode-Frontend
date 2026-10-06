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

const INPUT_CLASS = `
  w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5
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
      <label className="text-[10px] font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">
        {label}
        {required && <span className="ml-1 text-emerald-600">*</span>}
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

  return (
    <article
      className="
        rounded-2xl border border-slate-100 bg-white p-4
        shadow-[0_4px_18px_rgba(15,23,42,0.035)] transition-all duration-200
        hover:-translate-y-0.5 hover:border-emerald-100 hover:shadow-md
        dark:border-slate-800 dark:bg-slate-900 dark:shadow-none
        dark:hover:border-emerald-900/60
      "
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
          <Tractor size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black text-slate-900 dark:text-white">
                {farm?.name || "Unnamed Farm"}
              </h3>

              <div className="mt-1 flex min-w-0 items-center gap-1 text-[9px] font-medium text-slate-400">
                <MapPin size={10} className="shrink-0" />
                <span className="truncate">{getFarmLocation(farm)}</span>
              </div>
            </div>

            <span
              className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-black ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {isActive ? "Active" : "Deleted"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {farmSize && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Ruler size={10} />
                {farmSize}
              </span>
            )}

            {farm?.soil_type && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Sprout size={10} />
                {farm.soil_type}
              </span>
            )}

            {farm?.irrigation && (
              <span className="rounded-lg bg-slate-50 px-2 py-1.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                {farm.irrigation}
              </span>
            )}
          </div>
        </div>
      </div>

      {farm?.description && (
        <p className="mt-3 border-t border-slate-50 pt-3 text-[9px] leading-5 text-slate-400 dark:border-slate-800">
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
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.035)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[8px] font-black uppercase tracking-wide text-slate-400">
            {label}
          </div>
          <div
            className={`mt-1 truncate text-xl font-black ${
              accent
                ? "text-emerald-700 dark:text-emerald-400"
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
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Tractor size={18} />
            </div>

            <div className="min-w-0">
              <h2
                id="add-farm-title"
                className="truncate text-sm font-black text-slate-900 dark:text-white"
              >
                Add Farm
              </h2>
              <p className="mt-0.5 text-[9px] text-slate-400">
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
              <div className="rounded-2xl border border-red-100 bg-red-50 px-3 py-3 text-[10px] font-medium leading-5 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
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

              <Field label="Irrigation">
                <input
                  type="text"
                  value={form.irrigation}
                  onChange={(event) => update("irrigation", event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Rain-fed / Drip"
                />
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
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
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
  const { getFarms, createFarm } = useJumuiyaApi();

  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ ...EMPTY_FORM });

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
          irrigation: String(form.irrigation || "").trim(),
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
    setError("");
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  }, []);

  const closeAddFarm = useCallback(() => {
    if (saving) return;
    setModalOpen(false);
  }, [saving]);

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="mx-auto w-full max-w-[1180px] pb-24">
      {/* ==================================================
          PAGE TOOLBAR
      ================================================== */}

      <section className="mb-5 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-[9px] font-bold text-slate-400">
              <button
                type="button"
                onClick={() => onNavigate?.("shamba")}
                className="inline-flex items-center gap-1 transition hover:text-emerald-600"
              >
                <ArrowLeft size={12} />
                Shamba
              </button>
              <span>/</span>
              <span className="text-slate-500 dark:text-slate-300">My Farms</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <Tractor size={19} />
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl">
                  My Farms
                </h1>
                <p className="mt-0.5 truncate text-[10px] text-slate-400">
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
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Refresh farms"
              title="Refresh farms"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>

            <button
              type="button"
              onClick={openAddFarm}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-[10px] font-black text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              <Plus size={15} />
              Add Farm
            </button>
          </div>
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
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[10px] leading-5 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
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
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              Your Farms
            </h2>
            <p className="mt-0.5 text-[9px] text-slate-400">
              Keep your farm records organized and ready for Shamba intelligence.
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[8px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
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
          <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/50 px-5 py-12 text-center dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm dark:bg-slate-900 dark:text-emerald-400">
              <Tractor size={25} />
            </div>

            <div className="mt-4 text-sm font-black text-slate-800 dark:text-white">
              No farms yet
            </div>

            <p className="mx-auto mt-1 max-w-sm text-[10px] leading-5 text-slate-400">
              Add your first farm to begin tracking crops, activities, harvests,
              weather and farm intelligence.
            </p>

            <button
              type="button"
              onClick={openAddFarm}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-[10px] font-black text-white transition hover:bg-emerald-700 active:scale-[0.98]"
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
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-[9px] font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
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
