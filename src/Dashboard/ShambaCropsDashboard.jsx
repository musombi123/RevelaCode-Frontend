// src/Dashboard/ShambaCropsDashboard.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Leaf,
  MapPin,
  Plus,
  Sprout,
  Tractor,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";


// =========================================================
// EMPTY FORM
// =========================================================

const EMPTY_FORM = {
  name: "",
  variety: "",
  season: "",
  planting_date: "",
  expected_harvest_date: "",
  area: "",
  area_unit: "acres",
  quantity: "",
  quantity_unit: "kg",
  notes: "",
};


// =========================================================
// HELPERS
// =========================================================

function getFarmId(farm) {
  return farm?.id || farm?._id || "";
}

function getCropId(crop) {
  return crop?.id || crop?._id || null;
}

function getFarmLocation(farm) {
  return (
    farm?.location ||
    [farm?.town, farm?.county]
      .filter(Boolean)
      .join(", ") ||
    farm?.county ||
    "Location not set"
  );
}

function getCropName(crop) {
  return (
    crop?.name ||
    crop?.crop_name ||
    crop?.crop ||
    "Unnamed Crop"
  );
}

function getCropStatus(crop) {
  if (crop?.status) {
    return String(crop.status);
  }

  return "active";
}

function formatDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}


// =========================================================
// FIELD
// =========================================================

function Field({
  label,
  children,
  required = false,
}) {
  return (
    <div>
      <label
        className="
          text-[10px]
          font-black
          uppercase
          tracking-wide
          text-slate-600
        "
      >
        {label}

        {required && (
          <span className="ml-1 text-emerald-600">
            *
          </span>
        )}
      </label>

      <div className="mt-1.5">
        {children}
      </div>
    </div>
  );
}


// =========================================================
// INPUT
// =========================================================

const inputClass = `
  w-full
  rounded-xl
  border
  border-slate-200
  bg-white
  px-3
  py-2.5
  text-sm
  text-slate-900
  outline-none
  transition
  placeholder:text-slate-300
  focus:border-emerald-500
  focus:ring-2
  focus:ring-emerald-100
`;


// =========================================================
// CROP CARD
// =========================================================

function CropCard({
  crop,
}) {
  const status = getCropStatus(crop);

  const normalizedStatus =
    String(status).toLowerCase();

  const statusLabel =
    normalizedStatus === "harvested"
      ? "Harvested"
      : normalizedStatus === "deleted"
        ? "Deleted"
        : "Active";

  const statusClass =
    normalizedStatus === "harvested"
      ? "bg-amber-50 text-amber-700"
      : normalizedStatus === "deleted"
        ? "bg-red-50 text-red-700"
        : "bg-emerald-50 text-emerald-700";

  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-100
        bg-white
        p-4
        shadow-[0_4px_18px_rgba(15,23,42,0.04)]
      "
    >
      <div className="flex items-start gap-3">

        <div
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-emerald-50
            text-emerald-600
          "
        >
          <Sprout size={20} />
        </div>

        <div className="min-w-0 flex-1">

          <div className="flex items-start justify-between gap-2">

            <div className="min-w-0">
              <h3
                className="
                  truncate
                  text-sm
                  font-black
                  text-slate-900
                "
              >
                {getCropName(crop)}
              </h3>

              {crop?.variety && (
                <p
                  className="
                    mt-0.5
                    truncate
                    text-[9px]
                    text-slate-400
                  "
                >
                  {crop.variety}
                </p>
              )}
            </div>

            <span
              className={`
                shrink-0
                rounded-full
                px-2
                py-1
                text-[8px]
                font-black
                ${statusClass}
              `}
            >
              {statusLabel}
            </span>

          </div>


          <div
            className="
              mt-3
              grid
              grid-cols-2
              gap-2
            "
          >

            {(crop?.area !== undefined &&
              crop?.area !== null &&
              crop?.area !== "") && (
              <div
                className="
                  rounded-xl
                  bg-slate-50
                  px-2.5
                  py-2
                "
              >
                <div className="text-[8px] font-bold uppercase tracking-wide text-slate-400">
                  Area
                </div>

                <div className="mt-0.5 text-[10px] font-black text-slate-700">
                  {crop.area}{" "}
                  {crop?.area_unit || "acres"}
                </div>
              </div>
            )}

            {(crop?.quantity !== undefined &&
              crop?.quantity !== null &&
              crop?.quantity !== "") && (
              <div
                className="
                  rounded-xl
                  bg-slate-50
                  px-2.5
                  py-2
                "
              >
                <div className="text-[8px] font-bold uppercase tracking-wide text-slate-400">
                  Quantity
                </div>

                <div className="mt-0.5 text-[10px] font-black text-slate-700">
                  {crop.quantity}{" "}
                  {crop?.quantity_unit || "kg"}
                </div>
              </div>
            )}

          </div>


          {(crop?.planting_date ||
            crop?.expected_harvest_date) && (
            <div
              className="
                mt-3
                flex
                flex-wrap
                gap-2
              "
            >

              {crop?.planting_date && (
                <span
                  className="
                    inline-flex
                    items-center
                    gap-1
                    rounded-lg
                    bg-emerald-50
                    px-2
                    py-1.5
                    text-[8px]
                    font-bold
                    text-emerald-700
                  "
                >
                  <CalendarDays size={10} />
                  Planted{" "}
                  {formatDate(
                    crop.planting_date,
                  ) || crop.planting_date}
                </span>
              )}

              {crop?.expected_harvest_date && (
                <span
                  className="
                    inline-flex
                    items-center
                    gap-1
                    rounded-lg
                    bg-amber-50
                    px-2
                    py-1.5
                    text-[8px]
                    font-bold
                    text-amber-700
                  "
                >
                  <CalendarDays size={10} />
                  Harvest{" "}
                  {formatDate(
                    crop.expected_harvest_date,
                  ) ||
                    crop.expected_harvest_date}
                </span>
              )}

            </div>
          )}

          {crop?.notes && (
            <p
              className="
                mt-3
                border-t
                border-slate-50
                pt-3
                text-[9px]
                leading-5
                text-slate-400
              "
            >
              {crop.notes}
            </p>
          )}

        </div>
      </div>
    </div>
  );
}


// =========================================================
// ADD CROP MODAL
// =========================================================

function AddCropModal({
  farm,
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
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-slate-950/45
        p-3
        backdrop-blur-sm
        sm:p-4
      "
    >
      <div
        className="
          flex
          max-h-[92vh]
          w-full
          max-w-xl
          flex-col
          overflow-hidden
          rounded-3xl
          bg-white
          shadow-2xl
        "
      >

        {/* HEADER */}

        <div
          className="
            flex
            shrink-0
            items-center
            justify-between
            border-b
            border-slate-100
            px-4
            py-4
            sm:px-5
          "
        >
          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-emerald-50
                text-emerald-600
              "
            >
              <Sprout size={18} />
            </div>

            <div>
              <h2
                className="
                  text-sm
                  font-black
                  text-slate-900
                "
              >
                Add Crop
              </h2>

              <p
                className="
                  mt-0.5
                  max-w-[230px]
                  truncate
                  text-[9px]
                  text-slate-400
                "
              >
                {farm?.name || "Selected farm"}
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-slate-100
              text-slate-500
              transition
              hover:bg-slate-200
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>


        {/* FORM */}

        <div className="min-h-0 flex-1 overflow-y-auto">

          <form
            onSubmit={onSubmit}
            className="
              space-y-4
              p-4
              sm:p-5
            "
          >

            {error && (
              <div
                className="
                  rounded-2xl
                  border
                  border-red-100
                  bg-red-50
                  px-3
                  py-3
                  text-[10px]
                  leading-5
                  text-red-700
                "
              >
                {error}
              </div>
            )}


            <Field
              label="Crop name"
              required
            >
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  update(
                    "name",
                    event.target.value,
                  )
                }
                className={inputClass}
                placeholder="e.g. Maize"
                required
              />
            </Field>


            <Field label="Variety">
              <input
                type="text"
                value={form.variety}
                onChange={(event) =>
                  update(
                    "variety",
                    event.target.value,
                  )
                }
                className={inputClass}
                placeholder="e.g. H614"
              />
            </Field>


            <Field label="Season">
              <input
                type="text"
                value={form.season}
                onChange={(event) =>
                  update(
                    "season",
                    event.target.value,
                  )
                }
                className={inputClass}
                placeholder="e.g. Long rains"
              />
            </Field>


            {/* DATES */}

            <div
              className="
                grid
                grid-cols-1
                gap-4
                sm:grid-cols-2
              "
            >
              <Field label="Planting date">
                <input
                  type="date"
                  value={
                    form.planting_date
                  }
                  onChange={(event) =>
                    update(
                      "planting_date",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Expected harvest">
                <input
                  type="date"
                  value={
                    form.expected_harvest_date
                  }
                  onChange={(event) =>
                    update(
                      "expected_harvest_date",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                />
              </Field>
            </div>


            {/* AREA */}

            <div
              className="
                grid
                grid-cols-2
                gap-4
              "
            >
              <Field label="Area">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.area}
                  onChange={(event) =>
                    update(
                      "area",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                  placeholder="2"
                />
              </Field>

              <Field label="Area unit">
                <select
                  value={
                    form.area_unit
                  }
                  onChange={(event) =>
                    update(
                      "area_unit",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                >
                  <option value="acres">
                    Acres
                  </option>

                  <option value="hectares">
                    Hectares
                  </option>
                </select>
              </Field>
            </div>


            {/* QUANTITY */}

            <div
              className="
                grid
                grid-cols-2
                gap-4
              "
            >
              <Field label="Quantity">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.quantity}
                  onChange={(event) =>
                    update(
                      "quantity",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                  placeholder="100"
                />
              </Field>

              <Field label="Quantity unit">
                <select
                  value={
                    form.quantity_unit
                  }
                  onChange={(event) =>
                    update(
                      "quantity_unit",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                >
                  <option value="kg">
                    Kg
                  </option>

                  <option value="bags">
                    Bags
                  </option>

                  <option value="units">
                    Units
                  </option>

                  <option value="tonnes">
                    Tonnes
                  </option>
                </select>
              </Field>
            </div>


            <Field label="Notes">
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) =>
                  update(
                    "notes",
                    event.target.value,
                  )
                }
                className={`${inputClass} resize-none`}
                placeholder="Optional crop details"
              />
            </Field>


            <button
              type="submit"
              disabled={saving}
              className="
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-emerald-600
                px-4
                py-3
                text-sm
                font-black
                text-white
                shadow-sm
                transition
                hover:bg-emerald-700
                active:scale-[0.99]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <Plus size={17} />

              {saving
                ? "Saving Crop..."
                : "Add Crop"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}


// =========================================================
// MAIN
// =========================================================

export default function ShambaCropsDashboard({
  onNavigate,
}) {
  const { user } = useAuth();

  const {
    getFarms,
    getCrops,
    createCrop,
  } = useJumuiyaApi();

  const [farms, setFarms] =
    useState([]);

  const [selectedFarmId, setSelectedFarmId] =
    useState("");

  const [selectedFarm, setSelectedFarm] =
    useState(null);

  const [crops, setCrops] =
    useState([]);

  const [loadingFarms, setLoadingFarms] =
    useState(true);

  const [loadingCrops, setLoadingCrops] =
    useState(false);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState(EMPTY_FORM);


  // =======================================================
  // LOAD FARMS
  // =======================================================

  const loadFarms = useCallback(
    async () => {
      try {
        setLoadingFarms(true);
        setError("");

        const result =
          await getFarms();

        const list =
          Array.isArray(result)
            ? result
            : result?.farms || [];

        const active =
          list.filter(
            (farm) =>
              farm?.status !== "deleted",
          );

        setFarms(active);

        if (
          !selectedFarmId &&
          active.length > 0
        ) {
          const first =
            active[0];

          const firstId =
            getFarmId(first);

          setSelectedFarmId(
            firstId,
          );

          setSelectedFarm(
            first,
          );
        }
      } catch (err) {
        setError(
          err?.message ||
            "Unable to load your farms.",
        );
      } finally {
        setLoadingFarms(false);
      }
    },
    [
      getFarms,
      selectedFarmId,
    ],
  );


  useEffect(() => {
    loadFarms();
  }, [loadFarms]);


  // =======================================================
  // SELECT FARM
  // =======================================================

  useEffect(() => {
    if (!selectedFarmId) {
      setSelectedFarm(null);
      setCrops([]);
      return;
    }

    const farm =
      farms.find(
        (item) =>
          String(
            getFarmId(item),
          ) ===
          String(
            selectedFarmId,
          ),
      ) || null;

    setSelectedFarm(farm);
  }, [
    farms,
    selectedFarmId,
  ]);


  // =======================================================
  // LOAD CROPS FOR FARM
  // =======================================================

  const loadCrops = useCallback(
    async (farmId) => {
      if (!farmId) {
        setCrops([]);
        return;
      }

      try {
        setLoadingCrops(true);
        setError("");

        const result =
          await getCrops(
            farmId,
          );

        const list =
          Array.isArray(result)
            ? result
            : result?.crops || [];

        setCrops(
          list.filter(
            (crop) =>
              crop?.status !==
              "deleted",
          ),
        );
      } catch (err) {
        setCrops([]);

        setError(
          err?.message ||
            "Unable to load crops.",
        );
      } finally {
        setLoadingCrops(false);
      }
    },
    [getCrops],
  );


  useEffect(() => {
    if (!selectedFarmId) {
      return;
    }

    loadCrops(
      selectedFarmId,
    );
  }, [
    selectedFarmId,
    loadCrops,
  ]);


  // =======================================================
  // FARM SUMMARY
  // =======================================================

  const activeCropCount =
    useMemo(
      () =>
        crops.filter(
          (crop) =>
            String(
              crop?.status ||
                "active",
            ).toLowerCase() !==
            "harvested",
        ).length,
      [crops],
    );


  const harvestedCropCount =
    useMemo(
      () =>
        crops.filter(
          (crop) =>
            String(
              crop?.status || "",
            ).toLowerCase() ===
            "harvested",
        ).length,
      [crops],
    );


  // =======================================================
  // FORM
  // =======================================================

  function openAddCrop() {
    if (!selectedFarmId) {
      setError(
        "Select a farm before adding a crop.",
      );
      return;
    }

    setError("");

    setForm({
      ...EMPTY_FORM,
    });

    setModalOpen(true);
  }


  // =======================================================
  // CREATE CROP
  // =======================================================

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (!selectedFarmId) {
      setError(
        "Please select a farm first.",
      );
      return;
    }

    if (
      !String(form.name || "").trim()
    ) {
      setError(
        "Crop name is required.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name:
          String(form.name).trim(),

        variety:
          String(
            form.variety || "",
          ).trim(),

        season:
          String(
            form.season || "",
          ).trim(),

        planting_date:
          form.planting_date || "",

        expected_harvest_date:
          form.expected_harvest_date ||
          "",

        area:
          form.area === ""
            ? ""
            : Number(form.area),

        area_unit:
          form.area_unit ||
          "acres",

        quantity:
          form.quantity === ""
            ? ""
            : Number(form.quantity),

        quantity_unit:
          form.quantity_unit ||
          "kg",

        notes:
          String(
            form.notes || "",
          ).trim(),
      };

      await createCrop(
        selectedFarmId,
        payload,
      );

      setForm({
        ...EMPTY_FORM,
      });

      setModalOpen(false);

      await loadCrops(
        selectedFarmId,
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to create crop.",
      );
    } finally {
      setSaving(false);
    }
  };


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <JumuiyaDashboardShell
      title="Crops"
      subtitle="Track what you grow across your farms."
      activeHub="shamba"
      user={user}
      onNavigate={onNavigate}
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1100px]
          pb-24
        "
      >

        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          className="
            mb-4
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >

          <button
            type="button"
            onClick={() =>
              onNavigate?.("shamba")
            }
            className="
              inline-flex
              w-fit
              items-center
              gap-1.5
              text-[10px]
              font-black
              text-slate-500
              transition
              hover:text-emerald-600
            "
          >
            <ArrowLeft size={14} />
            Back to Shamba
          </button>


          <button
            type="button"
            onClick={openAddCrop}
            disabled={
              loadingFarms ||
              !selectedFarmId
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-1.5
              rounded-xl
              bg-emerald-600
              px-4
              py-2.5
              text-[10px]
              font-black
              text-white
              shadow-sm
              transition
              hover:bg-emerald-700
              active:scale-[0.98]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <Plus size={15} />
            Add Crop
          </button>

        </div>


        {/* ==================================================
            INTRO
        ================================================== */}

        <section
          className="
            mb-5
            overflow-hidden
            rounded-3xl
            border
            border-emerald-100
            bg-gradient-to-br
            from-emerald-50
            via-white
            to-lime-50
            p-4
            sm:p-5
          "
        >
          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-emerald-600
                text-white
                shadow-lg
              "
            >
              <Sprout size={20} />
            </div>

            <div className="min-w-0">

              <h1
                className="
                  text-lg
                  font-black
                  tracking-tight
                  text-slate-900
                "
              >
                Crop Management
              </h1>

              <p
                className="
                  mt-0.5
                  text-[10px]
                  leading-5
                  text-slate-500
                "
              >
                Track crops, planting dates and
                expected harvests.
              </p>

            </div>

          </div>
        </section>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && !modalOpen && (
          <div
            className="
              mb-4
              rounded-2xl
              border
              border-red-100
              bg-red-50
              px-4
              py-3
              text-[10px]
              leading-5
              text-red-700
            "
          >
            {error}
          </div>
        )}


        {/* ==================================================
            FARM SELECTOR
        ================================================== */}

        <section
          className="
            mb-5
            rounded-2xl
            border
            border-slate-100
            bg-white
            p-4
            shadow-[0_4px_18px_rgba(15,23,42,0.035)]
          "
        >

          <div
            className="
              flex
              items-start
              gap-3
            "
          >

            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-emerald-50
                text-emerald-600
              "
            >
              <Tractor size={17} />
            </div>

            <div className="min-w-0 flex-1">

              <div
                className="
                  text-[8px]
                  font-black
                  uppercase
                  tracking-[0.16em]
                  text-slate-400
                "
              >
                Selected Farm
              </div>

              {loadingFarms ? (
                <div
                  className="
                    mt-2
                    h-4
                    w-40
                    animate-pulse
                    rounded
                    bg-slate-100
                  "
                />
              ) : farms.length > 0 ? (
                <>

                  <select
                    value={selectedFarmId}
                    onChange={(event) =>
                      setSelectedFarmId(
                        event.target.value,
                      )
                    }
                    className="
                      mt-1
                      w-full
                      max-w-md
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-3
                      py-2.5
                      text-sm
                      font-bold
                      text-slate-800
                      outline-none
                      focus:border-emerald-500
                      focus:ring-2
                      focus:ring-emerald-100
                    "
                  >
                    {farms.map(
                      (farm) => {
                        const id =
                          getFarmId(farm);

                        return (
                          <option
                            key={id}
                            value={id}
                          >
                            {farm?.name ||
                              "Unnamed Farm"}
                          </option>
                        );
                      },
                    )}
                  </select>

                  {selectedFarm && (
                    <div
                      className="
                        mt-2
                        flex
                        items-center
                        gap-1
                        text-[9px]
                        text-slate-400
                      "
                    >
                      <MapPin size={10} />

                      <span className="truncate">
                        {getFarmLocation(
                          selectedFarm,
                        )}
                      </span>
                    </div>
                  )}

                </>
              ) : (
                <div className="mt-1">
                  <div className="text-xs font-bold text-slate-700">
                    No farm available
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onNavigate?.(
                        "shamba/farms",
                      )
                    }
                    className="
                      mt-2
                      inline-flex
                      items-center
                      gap-1
                      text-[9px]
                      font-black
                      text-emerald-600
                    "
                  >
                    <Plus size={11} />
                    Add a farm first
                  </button>
                </div>
              )}

            </div>
          </div>

        </section>


        {/* ==================================================
            SUMMARY
        ================================================== */}

        <section
          className="
            mb-5
            grid
            grid-cols-2
            gap-2
            sm:grid-cols-3
          "
        >

          <div
            className="
              rounded-2xl
              border
              border-slate-100
              bg-white
              p-4
              shadow-[0_4px_18px_rgba(15,23,42,0.035)]
            "
          >
            <div className="text-[8px] font-black uppercase tracking-wide text-slate-400">
              Total crops
            </div>

            <div className="mt-1 text-xl font-black text-emerald-700">
              {crops.length}
            </div>
          </div>


          <div
            className="
              rounded-2xl
              border
              border-slate-100
              bg-white
              p-4
              shadow-[0_4px_18px_rgba(15,23-42,0.035)]
            "
          >
            <div className="text-[8px] font-black uppercase tracking-wide text-slate-400">
              Active
            </div>

            <div className="mt-1 text-xl font-black text-emerald-700">
              {activeCropCount}
            </div>
          </div>


          <div
            className="
              col-span-2
              rounded-2xl
              border
              border-slate-100
              bg-white
              p-4
              shadow-[0_4px_18px_rgba(15,23,42,0.035)]
              sm:col-span-1
            "
          >
            <div className="text-[8px] font-black uppercase tracking-wide text-slate-400">
              Harvested
            </div>

            <div className="mt-1 text-xl font-black text-amber-600">
              {harvestedCropCount}
            </div>
          </div>

        </section>


        {/* ==================================================
            CROPS
        ================================================== */}

        <section>

          <div className="mb-3 flex items-end justify-between">

            <div>
              <h2
                className="
                  text-sm
                  font-black
                  text-slate-900
                "
              >
                Crops on this farm
              </h2>

              <p
                className="
                  mt-0.5
                  text-[9px]
                  text-slate-400
                "
              >
                Keep track of what is growing.
              </p>
            </div>

            {!loadingFarms &&
              selectedFarmId && (
                <button
                  type="button"
                  onClick={openAddCrop}
                  className="
                    inline-flex
                    items-center
                    gap-1
                    text-[9px]
                    font-black
                    text-emerald-600
                  "
                >
                  <Plus size={11} />
                  Add
                </button>
              )}

          </div>


          {loadingCrops ? (
            <div
              className="
                grid
                grid-cols-1
                gap-3
                md:grid-cols-2
              "
            >
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="
                      h-36
                      animate-pulse
                      rounded-2xl
                      bg-slate-100
                    "
                  />
                ),
              )}
            </div>
          ) : crops.length > 0 ? (
            <div
              className="
                grid
                grid-cols-1
                gap-3
                md:grid-cols-2
              "
            >
              {crops.map(
                (crop, index) => (
                  <CropCard
                    key={
                      getCropId(
                        crop,
                      ) ||
                      index
                    }
                    crop={crop}
                  />
                ),
              )}
            </div>
          ) : (
            <div
              className="
                rounded-3xl
                border
                border-dashed
                border-emerald-200
                bg-emerald-50/40
                px-5
                py-12
                text-center
              "
            >

              <div
                className="
                  mx-auto
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-emerald-50
                  text-emerald-600
                "
              >
                <Leaf size={25} />
              </div>

              <div
                className="
                  mt-4
                  text-sm
                  font-black
                  text-slate-800
                "
              >
                No crops yet
              </div>

              <p
                className="
                  mx-auto
                  mt-1
                  max-w-sm
                  text-[10px]
                  leading-5
                  text-slate-400
                "
              >
                Add your first crop to start
                tracking its growth and harvest.
              </p>

              <button
                type="button"
                onClick={openAddCrop}
                disabled={!selectedFarmId}
                className="
                  mt-5
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-xl
                  bg-emerald-600
                  px-4
                  py-2.5
                  text-[10px]
                  font-black
                  text-white
                  transition
                  hover:bg-emerald-700
                  active:scale-[0.98]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <Plus size={15} />
                Add First Crop
              </button>

            </div>
          )}

        </section>


        {/* ==================================================
            STATUS
        ================================================== */}

        {crops.length > 0 &&
          !loadingCrops && (
            <div
              className="
                mt-5
                flex
                items-center
                gap-2
                rounded-2xl
                border
                border-emerald-100
                bg-emerald-50/60
                px-4
                py-3
                text-[9px]
                font-semibold
                text-emerald-700
              "
            >
              <CheckCircle2 size={14} />

              Your crop records are ready for
              activity and harvest tracking.
            </div>
          )}

      </div>


      {/* ====================================================
          ADD CROP MODAL
      ==================================================== */}

      {modalOpen && (
        <AddCropModal
          farm={selectedFarm}
          form={form}
          setForm={setForm}
          saving={saving}
          error={error}
          onClose={() => {
            if (!saving) {
              setModalOpen(false);
              setError("");
            }
          }}
          onSubmit={handleSubmit}
        />
      )}
    </JumuiyaDashboardShell>
  );
}
