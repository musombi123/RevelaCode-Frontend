import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Plus,
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
// FARM CARD
// =========================================================

function FarmCard({ farm }) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-100
        bg-white
        p-4
        shadow-[0_4px_20px_rgba(15,23,42,0.04)]
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
          <Tractor size={21} />
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className="
              truncate
              text-sm
              font-extrabold
              text-slate-900
            "
          >
            {farm?.name || "Unnamed Farm"}
          </h3>

          {(farm?.location ||
            farm?.town ||
            farm?.county) && (
            <div
              className="
                mt-1
                flex
                items-center
                gap-1
                text-[10px]
                text-slate-400
              "
            >
              <MapPin size={11} />

              {farm?.location ||
                farm?.town ||
                farm?.county}
            </div>
          )}

          {farm?.size !== undefined &&
            farm?.size !== null &&
            farm?.size !== "" && (
              <div
                className="
                  mt-2
                  text-[10px]
                  font-semibold
                  text-slate-500
                "
              >
                {farm.size}{" "}
                {farm?.size_unit || "acres"}
              </div>
            )}
        </div>
      </div>

      {farm?.description && (
        <p
          className="
            mt-3
            text-[10px]
            leading-5
            text-slate-400
          "
        >
          {farm.description}
        </p>
      )}
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
  function update(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-slate-950/40
        p-4
        backdrop-blur-sm
      "
    >
      <div
        className="
          max-h-[90vh]
          w-full
          max-w-lg
          overflow-y-auto
          rounded-3xl
          bg-white
          p-5
          shadow-2xl
          sm:p-6
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
          "
        >
          <div>
            <h2
              className="
                text-lg
                font-extrabold
                text-slate-900
              "
            >
              Add Farm
            </h2>

            <p
              className="
                mt-1
                text-[11px]
                text-slate-400
              "
            >
              Add your farm details to Shamba.
            </p>
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
            "
          >
            <X size={17} />
          </button>
        </div>

        {error && (
          <div
            className="
              mt-4
              rounded-xl
              border
              border-red-100
              bg-red-50
              px-3
              py-2.5
              text-[11px]
              text-red-700
            "
          >
            {error}
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="mt-5 space-y-4"
        >
          <div>
            <label className="text-[10px] font-bold text-slate-600">
              Farm name *
            </label>

            <input
              value={form.name}
              onChange={(event) =>
                update(
                  "name",
                  event.target.value,
                )
              }
              required
              className="
                mt-1.5
                w-full
                rounded-xl
                border
                border-slate-200
                px-3
                py-2.5
                text-sm
                outline-none
                focus:border-emerald-500
                focus:ring-2
                focus:ring-emerald-100
              "
              placeholder="e.g. Kongowea Farm"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-bold text-slate-600">
                County
              </label>

              <input
                value={form.county}
                onChange={(event) =>
                  update(
                    "county",
                    event.target.value,
                  )
                }
                className="
                  mt-1.5
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-3
                  py-2.5
                  text-sm
                  outline-none
                  focus:border-emerald-500
                  focus:ring-2
                  focus:ring-emerald-100
                "
                placeholder="Mombasa"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600">
                Town
              </label>

              <input
                value={form.town}
                onChange={(event) =>
                  update(
                    "town",
                    event.target.value,
                  )
                }
                className="
                  mt-1.5
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-3
                  py-2.5
                  text-sm
                  outline-none
                  focus:border-emerald-500
                  focus:ring-2
                  focus:ring-emerald-100
                "
                placeholder="Mombasa"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600">
              Location
            </label>

            <input
              value={form.location}
              onChange={(event) =>
                update(
                  "location",
                  event.target.value,
                )
              }
              className="
                mt-1.5
                w-full
                rounded-xl
                border
                border-slate-200
                px-3
                py-2.5
                text-sm
                outline-none
                focus:border-emerald-500
                focus:ring-2
                focus:ring-emerald-100
              "
              placeholder="Village / area"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-600">
                Farm size
              </label>

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
                className="
                  mt-1.5
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-3
                  py-2.5
                  text-sm
                  outline-none
                  focus:border-emerald-500
                  focus:ring-2
                  focus:ring-emerald-100
                "
                placeholder="12"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600">
                Unit
              </label>

              <select
                value={form.size_unit}
                onChange={(event) =>
                  update(
                    "size_unit",
                    event.target.value,
                  )
                }
                className="
                  mt-1.5
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-3
                  py-2.5
                  text-sm
                  outline-none
                  focus:border-emerald-500
                  focus:ring-2
                  focus:ring-emerald-100
                "
              >
                <option value="acres">
                  Acres
                </option>
                <option value="hectares">
                  Hectares
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-bold text-slate-600">
                Soil type
              </label>

              <input
                value={form.soil_type}
                onChange={(event) =>
                  update(
                    "soil_type",
                    event.target.value,
                  )
                }
                className="
                  mt-1.5
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-3
                  py-2.5
                  text-sm
                  outline-none
                  focus:border-emerald-500
                  focus:ring-2
                  focus:ring-emerald-100
                "
                placeholder="Loamy"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600">
                Irrigation
              </label>

              <input
                value={form.irrigation}
                onChange={(event) =>
                  update(
                    "irrigation",
                    event.target.value,
                  )
                }
                className="
                  mt-1.5
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-3
                  py-2.5
                  text-sm
                  outline-none
                  focus:border-emerald-500
                  focus:ring-2
                  focus:ring-emerald-100
                "
                placeholder="Rain-fed / Drip"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600">
              Description
            </label>

            <textarea
              value={form.description}
              onChange={(event) =>
                update(
                  "description",
                  event.target.value,
                )
              }
              rows={3}
              className="
                mt-1.5
                w-full
                resize-none
                rounded-xl
                border
                border-slate-200
                px-3
                py-2.5
                text-sm
                outline-none
                focus:border-emerald-500
                focus:ring-2
                focus:ring-emerald-100
              "
              placeholder="Optional farm details"
            />
          </div>

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
              font-bold
              text-white
              transition
              hover:bg-emerald-700
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

  async function loadFarms() {
    try {
      setLoading(true);
      setError("");

      const result =
        await getFarms();

      setFarms(
        Array.isArray(result)
          ? result
          : result?.farms || [],
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load farms.",
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadFarms();
  }, [getFarms]);


  // =======================================================
  // CREATE FARM
  // =======================================================

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...form,

        size:
          form.size === ""
            ? ""
            : Number(form.size),
      };

      await createFarm(payload);

      setForm(
        EMPTY_FORM,
      );

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
  }


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
          max-w-6xl
          px-1
          pb-20
        "
      >
        {/* HEADER */}

        <div
          className="
            mb-5
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
              gap-2
              text-xs
              font-bold
              text-slate-500
              hover:text-emerald-600
            "
          >
            <ArrowLeft size={15} />
            Back to Shamba
          </button>

          <button
            type="button"
            onClick={() =>
              setModalOpen(true)
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-emerald-600
              px-4
              py-2.5
              text-xs
              font-bold
              text-white
              shadow-sm
              transition
              hover:bg-emerald-700
              active:scale-[0.98]
            "
          >
            <Plus size={16} />
            Add Farm
          </button>
        </div>


        {/* ERROR */}

        {error && (
          <div
            className="
              mb-5
              rounded-2xl
              border
              border-red-100
              bg-red-50
              px-4
              py-3
              text-xs
              text-red-700
            "
          >
            {error}
          </div>
        )}


        {/* SUMMARY */}

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
              shadow-[0_4px_20px_rgba(15,23,42,0.04)]
            "
          >
            <div className="text-[10px] font-medium text-slate-400">
              Total Farms
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
              shadow-[0_4px_20px_rgba(15,23,42,0.04)]
            "
          >
            <div className="text-[10px] font-medium text-slate-400">
              Active Farms
            </div>

            <div className="mt-1 text-xl font-black text-emerald-700">
              {farms.filter(
                (farm) =>
                  farm?.status !==
                  "deleted",
              ).length}
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
              shadow-[0_4px_20px_rgba(15,23,42,0.04)]
              sm:col-span-1
            "
          >
            <div className="text-[10px] font-medium text-slate-400">
              Farmer
            </div>

            <div className="mt-1 truncate text-sm font-black text-slate-800">
              {user?.full_name ||
                user?.fullName ||
                user?.name ||
                "Farmer"}
            </div>
          </div>
        </section>


        {/* FARMS */}

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
                    farm?.id ||
                    farm?._id ||
                    index
                  }
                  farm={farm}
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

            <h2
              className="
                mt-4
                text-sm
                font-extrabold
                text-slate-800
              "
            >
              No farms yet
            </h2>

            <p
              className="
                mx-auto
                mt-1
                max-w-sm
                text-[11px]
                leading-5
                text-slate-400
              "
            >
              Add your first farm to start tracking
              crops, activities and harvests.
            </p>

            <button
              type="button"
              onClick={() =>
                setModalOpen(true)
              }
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-emerald-600
                px-4
                py-2.5
                text-xs
                font-bold
                text-white
                hover:bg-emerald-700
              "
            >
              <Plus size={16} />
              Add Farm
            </button>
          </div>
        )}
      </div>

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
