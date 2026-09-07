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
  Ruler,
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
  county: "",
  town: "",
  location: "",
  size: "",
  size_unit: "acres",
  soil_type: "",
  irrigation: "",
  description: "",
};


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
    "Farmer"
  );
}

function formatSize(farm) {
  if (
    farm?.size === undefined ||
    farm?.size === null ||
    farm?.size === ""
  ) {
    return null;
  }

  const numericSize = Number(farm.size);

  if (!Number.isFinite(numericSize)) {
    return `${farm.size} ${farm?.size_unit || "acres"}`;
  }

  return `${numericSize} ${farm?.size_unit || "acres"}`;
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
// INPUT CLASS
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
// FARM CARD
// =========================================================

function FarmCard({
  farm,
  onSelect,
}) {
  const farmSize = formatSize(farm);

  return (
    <button
      type="button"
      onClick={() =>
        onSelect?.(farm)
      }
      className="
        group
        w-full
        rounded-2xl
        border
        border-slate-100
        bg-white
        p-4
        text-left
        shadow-[0_4px_18px_rgba(15,23,42,0.04)]
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-emerald-100
        hover:shadow-md
        active:scale-[0.99]
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
          <Tractor size={20} />
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
                {farm?.name || "Unnamed Farm"}
              </h3>

              <div
                className="
                  mt-1
                  flex
                  min-w-0
                  items-center
                  gap-1
                  text-[9px]
                  font-medium
                  text-slate-400
                "
              >
                <MapPin size={10} />

                <span className="truncate">
                  {getFarmLocation(farm)}
                </span>
              </div>
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
              {farm?.status === "deleted"
                ? "Deleted"
                : "Active"}
            </span>
          </div>

          <div
            className="
              mt-3
              flex
              flex-wrap
              items-center
              gap-2
            "
          >

            {farmSize && (
              <span
                className="
                  inline-flex
                  items-center
                  gap-1
                  rounded-lg
                  bg-slate-50
                  px-2
                  py-1.5
                  text-[9px]
                  font-bold
                  text-slate-500
                "
              >
                <Ruler size={10} />
                {farmSize}
              </span>
            )}

            {farm?.soil_type && (
              <span
                className="
                  inline-flex
                  items-center
                  gap-1
                  rounded-lg
                  bg-slate-50
                  px-2
                  py-1.5
                  text-[9px]
                  font-bold
                  text-slate-500
                "
              >
                <Sprout size={10} />
                {farm.soil_type}
              </span>
            )}

            {farm?.irrigation && (
              <span
                className="
                  rounded-lg
                  bg-slate-50
                  px-2
                  py-1.5
                  text-[9px]
                  font-bold
                  text-slate-500
                "
              >
                {farm.irrigation}
              </span>
            )}

          </div>
        </div>
      </div>

      {farm?.description && (
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
          {farm.description}
        </p>
      )}
    </button>
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

        {/* ================================================
            MODAL HEADER
        ================================================= */}

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
              <Tractor size={18} />
            </div>

            <div>
              <h2
                className="
                  text-sm
                  font-black
                  text-slate-900
                "
              >
                Add Farm
              </h2>

              <p
                className="
                  mt-0.5
                  text-[9px]
                  text-slate-400
                "
              >
                Add your farm to Shamba.
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


        {/* ================================================
            MODAL CONTENT
        ================================================= */}

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
                  font-medium
                  leading-5
                  text-red-700
                "
              >
                {error}
              </div>
            )}


            {/* FARM NAME */}

            <Field
              label="Farm name"
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
                placeholder="e.g. Kongowea Farm"
                required
              />
            </Field>


            {/* LOCATION */}

            <div
              className="
                grid
                grid-cols-1
                gap-4
                sm:grid-cols-2
              "
            >
              <Field label="County">
                <input
                  type="text"
                  value={form.county}
                  onChange={(event) =>
                    update(
                      "county",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                  placeholder="Mombasa"
                />
              </Field>

              <Field label="Town">
                <input
                  type="text"
                  value={form.town}
                  onChange={(event) =>
                    update(
                      "town",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                  placeholder="Mombasa"
                />
              </Field>
            </div>


            <Field label="Location / Area">
              <input
                type="text"
                value={form.location}
                onChange={(event) =>
                  update(
                    "location",
                    event.target.value,
                  )
                }
                className={inputClass}
                placeholder="Village, area or estate"
              />
            </Field>


            {/* SIZE */}

            <div
              className="
                grid
                grid-cols-2
                gap-4
              "
            >
              <Field label="Farm size">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.size}
                  onChange={(event) =>
                    update(
                      "size",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                  placeholder="5"
                />
              </Field>

              <Field label="Unit">
                <select
                  value={form.size_unit}
                  onChange={(event) =>
                    update(
                      "size_unit",
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


            {/* FARM CONDITIONS */}

            <div
              className="
                grid
                grid-cols-1
                gap-4
                sm:grid-cols-2
              "
            >
              <Field label="Soil type">
                <input
                  type="text"
                  value={form.soil_type}
                  onChange={(event) =>
                    update(
                      "soil_type",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                  placeholder="Loamy"
                />
              </Field>

              <Field label="Irrigation">
                <input
                  type="text"
                  value={form.irrigation}
                  onChange={(event) =>
                    update(
                      "irrigation",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                  placeholder="Rain-fed / Drip"
                />
              </Field>
            </div>


            {/* DESCRIPTION */}

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(event) =>
                  update(
                    "description",
                    event.target.value,
                  )
                }
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Optional details about your farm"
              />
            </Field>


            {/* SUBMIT */}

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
                ? "Saving Farm..."
                : "Add Farm"}
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

export default function ShambaFarmsDashboard({
  onNavigate,
}) {
  const { user } = useAuth();

  const {
    getFarms,
    createFarm,
  } = useJumuiyaApi();

  const [farms, setFarms] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

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
        setLoading(true);
        setError("");

        const result =
          await getFarms();

        const farmList =
          Array.isArray(result)
            ? result
            : result?.farms || [];

        setFarms(
          farmList.filter(
            (farm) =>
              farm?.status !== "deleted",
          ),
        );
      } catch (err) {
        setError(
          err?.message ||
            "Unable to load your farms.",
        );
      } finally {
        setLoading(false);
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

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (
      !String(form.name || "").trim()
    ) {
      setError(
        "Farm name is required.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: String(form.name).trim(),

        county:
          String(
            form.county || "",
          ).trim(),

        town:
          String(
            form.town || "",
          ).trim(),

        location:
          String(
            form.location || "",
          ).trim(),

        size:
          form.size === "" ||
          form.size === null
            ? ""
            : Number(form.size),

        size_unit:
          form.size_unit ||
          "acres",

        soil_type:
          String(
            form.soil_type || "",
          ).trim(),

        irrigation:
          String(
            form.irrigation || "",
          ).trim(),

        description:
          String(
            form.description || "",
          ).trim(),
      };

      await createFarm(payload);

      setForm({
        ...EMPTY_FORM,
      });

      setModalOpen(false);

      await loadFarms();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to create farm.",
      );
    } finally {
      setSaving(false);
    }
  };


  // =======================================================
  // SUMMARY
  // =======================================================

  const totalArea = useMemo(() => {
    return farms.reduce(
      (total, farm) => {
        const size =
          Number(farm?.size);

        if (
          Number.isFinite(size) &&
          (farm?.size_unit === "acres" ||
            !farm?.size_unit)
        ) {
          return total + size;
        }

        return total;
      },
      0,
    );
  }, [farms]);


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <JumuiyaDashboardShell
      title="My Farms"
      subtitle="Manage your farms and growing spaces."
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
            onClick={() => {
              setError("");
              setForm({
                ...EMPTY_FORM,
              });
              setModalOpen(true);
            }}
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
            "
          >
            <Plus size={15} />
            Add Farm
          </button>

        </div>


        {/* ==================================================
            PAGE INTRO
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
              <Tractor size={20} />
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
                My Farms
              </h1>

              <p
                className="
                  mt-0.5
                  text-[10px]
                  leading-5
                  text-slate-500
                "
              >
                Keep your farms organized and ready
                for crop tracking.
              </p>
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
              Total farms
            </div>

            <div className="mt-1 text-xl font-black text-emerald-700">
              {farms.length}
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
            <div className="text-[8px] font-black uppercase tracking-wide text-slate-400">
              Total acres
            </div>

            <div className="mt-1 text-xl font-black text-emerald-700">
              {totalArea % 1 === 0
                ? totalArea
                : totalArea.toFixed(2)}
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
              Farmer
            </div>

            <div className="mt-1 truncate text-sm font-black text-slate-800">
              {getFarmerName(user)}
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
            FARM LIST
        ================================================== */}

        <section>

          <div className="mb-3">
            <h2
              className="
                text-sm
                font-black
                text-slate-900
              "
            >
              Your Farms
            </h2>

            <p
              className="
                mt-0.5
                text-[9px]
                text-slate-400
              "
            >
              Select a farm to continue managing it.
            </p>
          </div>


          {loading ? (
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
                      h-32
                      animate-pulse
                      rounded-2xl
                      bg-slate-100
                    "
                  />
                ),
              )}
            </div>
          ) : farms.length > 0 ? (
            <div
              className="
                grid
                grid-cols-1
                gap-3
                md:grid-cols-2
              "
            >
              {farms.map(
                (farm, index) => (
                  <FarmCard
                    key={
                      getFarmId(farm) ||
                      index
                    }
                    farm={farm}
                    onSelect={() => {
                      /*
                       * Farm detail navigation will be
                       * connected when we create the
                       * individual farm screen.
                       */
                    }}
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
                <Tractor size={25} />
              </div>

              <div
                className="
                  mt-4
                  text-sm
                  font-black
                  text-slate-800
                "
              >
                No farms yet
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
                Add your first farm to begin
                tracking crops, activities and
                harvests.
              </p>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setForm({
                    ...EMPTY_FORM,
                  });
                  setModalOpen(true);
                }}
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
                "
              >
                <Plus size={15} />
                Add Your First Farm
              </button>

            </div>
          )}

        </section>


        {/* ==================================================
            SUCCESS-READY FOOTER
        ================================================== */}

        {farms.length > 0 && !loading && (
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

            Your farms are ready for crop and
            activity tracking.
          </div>
        )}

      </div>


      {/* ====================================================
          ADD FARM MODAL
      ==================================================== */}

      {modalOpen && (
        <AddFarmModal
          form={form}
          setForm={setForm}
          saving={saving}
          error={error}
          onClose={() => {
            if (!saving) {
              setModalOpen(false);
            }
          }}
          onSubmit={handleSubmit}
        />
      )}
    </JumuiyaDashboardShell>
  );
}
