// src/Dashboard/ShambaHarvestsDashboard.jsx

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
  Scale,
  Tractor,
  Wheat,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";


// =========================================================
// EMPTY FORM
// =========================================================

const EMPTY_FORM = {
  crop_id: "",
  quantity: "",
  quantity_unit: "kg",
  harvest_date: "",
  quality: "",
  notes: "",
};


// =========================================================
// HELPERS
// =========================================================

function getId(item) {
  return item?.id || item?._id || "";
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
    "Crop"
  );
}

function getHarvestQuantity(harvest) {
  const value =
    harvest?.quantity ??
    harvest?.amount ??
    "";

  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return `${value}${
    harvest?.quantity_unit
      ? ` ${harvest.quantity_unit}`
      : harvest?.unit
        ? ` ${harvest.unit}`
        : " kg"
  }`;
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
// HARVEST CARD
// =========================================================

function HarvestCard({
  harvest,
}) {
  const quantity =
    getHarvestQuantity(harvest);

  return (
    <article
      className="
        overflow-hidden
        rounded-2xl
        border
        border-slate-100
        bg-white
        shadow-[0_4px_18px_rgba(15,23,42,0.04)]
      "
    >
      <div className="p-4">

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
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-2xl
              bg-amber-50
              text-amber-600
            "
          >
            <Wheat size={20} />
          </div>

          <div className="min-w-0 flex-1">

            <div
              className="
                flex
                items-start
                justify-between
                gap-2
              "
            >

              <div className="min-w-0">

                <h3
                  className="
                    truncate
                    text-sm
                    font-black
                    text-slate-900
                  "
                >
                  {harvest?.crop_name ||
                    harvest?.crop ||
                    "Harvest"}
                </h3>

                {harvest?.quality && (
                  <div
                    className="
                      mt-1
                      text-[9px]
                      text-slate-400
                    "
                  >
                    Quality:{" "}
                    {harvest.quality}
                  </div>
                )}

              </div>

              <span
                className="
                  shrink-0
                  rounded-full
                  bg-emerald-50
                  px-2
                  py-1
                  text-[8px]
                  font-black
                  text-emerald-700
                "
              >
                Recorded
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

              <div
                className="
                  rounded-xl
                  bg-slate-50
                  px-3
                  py-2.5
                "
              >
                <div
                  className="
                    text-[8px]
                    font-black
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  Quantity
                </div>

                <div
                  className="
                    mt-1
                    text-[10px]
                    font-black
                    text-slate-800
                  "
                >
                  {quantity || "—"}
                </div>
              </div>

              <div
                className="
                  rounded-xl
                  bg-slate-50
                  px-3
                  py-2.5
                "
              >
                <div
                  className="
                    text-[8px]
                    font-black
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  Date
                </div>

                <div
                  className="
                    mt-1
                    text-[10px]
                    font-black
                    text-slate-800
                  "
                >
                  {formatDate(
                    harvest?.harvest_date ||
                      harvest?.date ||
                      harvest?.created_at,
                  ) || "—"}
                </div>
              </div>

            </div>


            {harvest?.notes && (
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
                {harvest.notes}
              </p>
            )}

          </div>
        </div>

      </div>
    </article>
  );
}


// =========================================================
// ADD HARVEST MODAL
// =========================================================

function AddHarvestModal({
  farm,
  crops,
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
                bg-amber-50
                text-amber-600
              "
            >
              <Wheat size={18} />
            </div>

            <div>
              <h2
                className="
                  text-sm
                  font-black
                  text-slate-900
                "
              >
                Record Harvest
              </h2>

              <p
                className="
                  mt-0.5
                  max-w-[240px]
                  truncate
                  text-[9px]
                  text-slate-400
                "
              >
                {farm?.name ||
                  "Selected farm"}
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
              hover:bg-slate-200
              disabled:opacity-50
            "
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>


        {/* FORM */}

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
          "
        >
          <form
            onSubmit={onSubmit}
            className="space-y-4 p-4 sm:p-5"
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


            {/* CROP */}

            <Field
              label="Crop"
              required
            >
              <select
                value={form.crop_id}
                onChange={(event) =>
                  update(
                    "crop_id",
                    event.target.value,
                  )
                }
                className={inputClass}
                required
              >
                <option value="">
                  Select crop
                </option>

                {crops.map(
                  (crop) => (
                    <option
                      key={
                        getId(
                          crop,
                        )
                      }
                      value={
                        getId(
                          crop,
                        )
                      }
                    >
                      {getCropName(
                        crop,
                      )}
                    </option>
                  ),
                )}
              </select>
            </Field>


            {/* QUANTITY */}

            <div
              className="
                grid
                grid-cols-2
                gap-4
              "
            >

              <Field
                label="Quantity"
                required
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.quantity
                  }
                  onChange={(
                    event,
                  ) =>
                    update(
                      "quantity",
                      event.target.value,
                    )
                  }
                  className={
                    inputClass
                  }
                  placeholder="250"
                  required
                />
              </Field>

              <Field label="Unit">
                <select
                  value={
                    form.quantity_unit
                  }
                  onChange={(
                    event,
                  ) =>
                    update(
                      "quantity_unit",
                      event.target.value,
                    )
                  }
                  className={
                    inputClass
                  }
                >
                  <option value="kg">
                    Kg
                  </option>

                  <option value="bags">
                    Bags
                  </option>

                  <option value="tonnes">
                    Tonnes
                  </option>

                  <option value="units">
                    Units
                  </option>
                </select>
              </Field>

            </div>


            {/* DATE */}

            <Field
              label="Harvest date"
              required
            >
              <input
                type="date"
                value={
                  form.harvest_date
                }
                onChange={(
                  event,
                ) =>
                  update(
                    "harvest_date",
                    event.target.value,
                  )
                }
                className={
                  inputClass
                }
                required
              />
            </Field>


            {/* QUALITY */}

            <Field label="Quality">
              <select
                value={
                  form.quality
                }
                onChange={(event) =>
                  update(
                    "quality",
                    event.target.value,
                  )
                }
                className={inputClass}
              >
                <option value="">
                  Select quality
                </option>

                <option value="Premium">
                  Premium
                </option>

                <option value="Good">
                  Good
                </option>

                <option value="Standard">
                  Standard
                </option>

                <option value="Low">
                  Low
                </option>
              </select>
            </Field>


            {/* NOTES */}

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
                placeholder="Optional harvest notes"
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
                transition
                hover:bg-emerald-700
                active:scale-[0.99]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <Plus size={17} />

              {saving
                ? "Saving Harvest..."
                : "Record Harvest"}
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

export default function ShambaHarvestsDashboard({
  onNavigate,
}) {
  const { user } = useAuth();

  const {
    getFarms,
    getCrops,
    getHarvests,
    createHarvest,
  } = useJumuiyaApi();

  const [farms, setFarms] =
    useState([]);

  const [selectedFarmId, setSelectedFarmId] =
    useState("");

  const [selectedFarm, setSelectedFarm] =
    useState(null);

  const [crops, setCrops] =
    useState([]);

  const [harvests, setHarvests] =
    useState([]);

  const [loadingFarms, setLoadingFarms] =
    useState(true);

  const [loadingCrops, setLoadingCrops] =
    useState(false);

  const [loadingHarvests, setLoadingHarvests] =
    useState(false);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState({
      ...EMPTY_FORM,
    });


  // =======================================================
  // LOAD FARMS
  // =======================================================

  const loadFarms =
    useCallback(
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
                farm?.status !==
                "deleted",
            );

          setFarms(active);

          if (
            !selectedFarmId &&
            active.length
          ) {
            const first =
              active[0];

            setSelectedFarmId(
              getId(first),
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
    const farm =
      farms.find(
        (item) =>
          String(
            getId(item),
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
  // LOAD CROPS
  // =======================================================

  const loadCrops =
    useCallback(
      async (farmId) => {
        if (!farmId) {
          setCrops([]);
          return;
        }

        try {
          setLoadingCrops(true);

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
    loadCrops(
      selectedFarmId,
    );
  }, [
    selectedFarmId,
    loadCrops,
  ]);


  // =======================================================
  // LOAD HARVESTS
  // =======================================================

  const loadHarvests =
    useCallback(
      async (farmId) => {
        if (!farmId) {
          setHarvests([]);
          return;
        }

        try {
          setLoadingHarvests(
            true,
          );

          const result =
            await getHarvests(
              farmId,
            );

          const list =
            Array.isArray(result)
              ? result
              : result?.harvests || [];

          setHarvests(
            list.filter(
              (harvest) =>
                harvest?.status !==
                "deleted",
            ),
          );
        } catch (err) {
          setHarvests([]);

          setError(
            err?.message ||
              "Unable to load harvests.",
          );
        } finally {
          setLoadingHarvests(
            false,
          );
        }
      },
      [getHarvests],
    );


  useEffect(() => {
    loadHarvests(
      selectedFarmId,
    );
  }, [
    selectedFarmId,
    loadHarvests,
  ]);


  // =======================================================
  // SUMMARY
  // =======================================================

  const totalQuantity =
    useMemo(() => {
      return harvests.reduce(
        (total, harvest) => {
          const quantity =
            Number(
              harvest?.quantity ??
                harvest?.amount,
            );

          if (
            Number.isFinite(
              quantity,
            )
          ) {
            return (
              total + quantity
            );
          }

          return total;
        },
        0,
      );
    }, [harvests]);


  // =======================================================
  // ADD HARVEST
  // =======================================================

  function openAddHarvest() {
    if (!selectedFarmId) {
      setError(
        "Select a farm first.",
      );
      return;
    }

    if (!crops.length) {
      setError(
        "Add a crop to this farm before recording a harvest.",
      );
      return;
    }

    setError("");

    setForm({
      ...EMPTY_FORM,
      crop_id:
        getId(crops[0]),
    });

    setModalOpen(true);
  }


  // =======================================================
  // CREATE HARVEST
  // =======================================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (!selectedFarmId) {
        setError(
          "Please select a farm first.",
        );
        return;
      }

      if (!form.crop_id) {
        setError(
          "Please select a crop.",
        );
        return;
      }

      if (
        form.quantity === "" ||
        Number(form.quantity) < 0
      ) {
        setError(
          "Enter a valid harvest quantity.",
        );
        return;
      }

      if (!form.harvest_date) {
        setError(
          "Harvest date is required.",
        );
        return;
      }

      try {
        setSaving(true);
        setError("");

        const payload = {
          crop_id:
            form.crop_id,

          quantity:
            Number(
              form.quantity,
            ),

          quantity_unit:
            form.quantity_unit ||
            "kg",

          harvest_date:
            form.harvest_date,

          quality:
            String(
              form.quality || "",
            ).trim(),

          notes:
            String(
              form.notes || "",
            ).trim(),
        };

        await createHarvest(
          selectedFarmId,
          payload,
        );

        setForm({
          ...EMPTY_FORM,
        });

        setModalOpen(false);

        await loadHarvests(
          selectedFarmId,
        );
      } catch (err) {
        setError(
          err?.message ||
            "Unable to record harvest.",
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
      title="Harvests"
      subtitle="Record and track what your farms produce."
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
              onNavigate?.(
                "shamba",
              )
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
            onClick={openAddHarvest}
            disabled={
              loadingFarms ||
              loadingCrops ||
              !selectedFarmId ||
              !crops.length
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
            Record Harvest
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
            bg-gradient-to-br
            from-amber-400
            via-orange-400
            to-yellow-500
            p-5
            text-white
            shadow-lg
          "
        >

          <div
            className="
              flex
              items-start
              justify-between
              gap-4
            "
          >

            <div className="min-w-0">

              <div
                className="
                  text-[8px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-white/70
                "
              >
                Shamba Harvests
              </div>

              <h1
                className="
                  mt-1
                  text-xl
                  font-black
                  tracking-tight
                "
              >
                Know what your farm produces.
              </h1>

              <p
                className="
                  mt-1
                  max-w-xl
                  text-[10px]
                  leading-5
                  text-white/80
                "
              >
                Record harvest quantities and
                keep a history of your farm output.
              </p>

            </div>


            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-white/15
                backdrop-blur
              "
            >
              <Wheat size={21} />
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

          <div className="flex items-start gap-3">

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
                    h-10
                    w-full
                    animate-pulse
                    rounded-xl
                    bg-slate-100
                  "
                />
              ) : farms.length > 0 ? (
                <>

                  <select
                    value={
                      selectedFarmId
                    }
                    onChange={(event) =>
                      setSelectedFarmId(
                        event.target.value,
                      )
                    }
                    className="
                      mt-1
                      w-full
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
                      (farm) => (
                        <option
                          key={getId(
                            farm,
                          )}
                          value={getId(
                            farm,
                          )}
                        >
                          {farm?.name ||
                            "Unnamed Farm"}
                        </option>
                      ),
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
                      text-[9px]
                      font-black
                      text-emerald-600
                    "
                  >
                    Add a farm first →
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
            <div
              className="
                text-[8px]
                font-black
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Harvest records
            </div>

            <div
              className="
                mt-1
                text-xl
                font-black
                text-emerald-700
              "
            >
              {loadingHarvests
                ? "—"
                : harvests.length}
            </div>
          </div>


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
            <div
              className="
                text-[8px]
                font-black
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Crops
            </div>

            <div
              className="
                mt-1
                text-xl
                font-black
                text-emerald-700
              "
            >
              {loadingCrops
                ? "—"
                : crops.length}
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
            <div
              className="
                text-[8px]
                font-black
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Total quantity
            </div>

            <div
              className="
                mt-1
                text-xl
                font-black
                text-amber-600
              "
            >
              {loadingHarvests
                ? "—"
                : totalQuantity}
            </div>

            <div className="mt-0.5 text-[8px] text-slate-400">
              Recorded units
            </div>
          </div>

        </section>


        {/* ==================================================
            HARVEST LIST
        ================================================== */}

        <section>

          <div
            className="
              mb-3
              flex
              items-end
              justify-between
              gap-3
            "
          >

            <div>

              <h2
                className="
                  text-sm
                  font-black
                  text-slate-900
                "
              >
                Harvest History
              </h2>

              <p
                className="
                  mt-0.5
                  text-[9px]
                  text-slate-400
                "
              >
                Your recorded harvests for this farm.
              </p>

            </div>

            {harvests.length > 0 && (
              <span
                className="
                  inline-flex
                  items-center
                  gap-1
                  rounded-full
                  bg-amber-50
                  px-2
                  py-1.5
                  text-[8px]
                  font-black
                  text-amber-700
                "
              >
                <Scale size={10} />
                {harvests.length}
              </span>
            )}

          </div>


          {loadingHarvests ? (
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
          ) : harvests.length > 0 ? (
            <div
              className="
                grid
                grid-cols-1
                gap-3
                md:grid-cols-2
              "
            >
              {harvests.map(
                (harvest, index) => (
                  <HarvestCard
                    key={
                      getId(
                        harvest,
                      ) ||
                      index
                    }
                    harvest={
                      harvest
                    }
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
                border-amber-200
                bg-amber-50/40
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
                  bg-amber-50
                  text-amber-600
                "
              >
                <Wheat size={25} />
              </div>

              <h2
                className="
                  mt-4
                  text-sm
                  font-black
                  text-slate-800
                "
              >
                No harvests recorded
              </h2>

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
                Record your first harvest to
                start building your farm output
                history.
              </p>

              <button
                type="button"
                onClick={openAddHarvest}
                disabled={
                  !selectedFarmId ||
                  !crops.length
                }
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
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <Plus size={15} />
                Record First Harvest
              </button>

            </div>
          )}

        </section>


        {/* ==================================================
            STATUS
        ================================================== */}

        {harvests.length > 0 &&
          !loadingHarvests && (
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

              Harvest records are ready for
              production and sales tracking.
            </div>
          )}

      </div>


      {/* ====================================================
          ADD HARVEST MODAL
      ==================================================== */}

      {modalOpen && (
        <AddHarvestModal
          farm={selectedFarm}
          crops={crops}
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
