// src/Dashboard/ShambaActivitiesDashboard.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Droplets,
  FlaskConical,
  Leaf,
  MapPin,
  Plus,
  Sprout,
  Tractor,
  User,
  Wheat,
  Wrench,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";


// =========================================================
// EMPTY FORM
// =========================================================

const EMPTY_FORM = {
  activity_type: "",
  activity_date: "",
  description: "",
  cost: "",
  labor_count: "",
  notes: "",
};


// =========================================================
// ACTIVITY TYPES
// =========================================================

const ACTIVITY_TYPES = [
  {
    value: "planting",
    label: "Planting",
    icon: Sprout,
  },
  {
    value: "irrigation",
    label: "Irrigation",
    icon: Droplets,
  },
  {
    value: "fertilizing",
    label: "Fertilizing",
    icon: FlaskConical,
  },
  {
    value: "spraying",
    label: "Spraying",
    icon: FlaskConical,
  },
  {
    value: "weeding",
    label: "Weeding",
    icon: Leaf,
  },
  {
    value: "land_preparation",
    label: "Land Preparation",
    icon: Tractor,
  },
  {
    value: "harvesting",
    label: "Harvesting",
    icon: Wheat,
  },
  {
    value: "maintenance",
    label: "Maintenance",
    icon: Wrench,
  },
  {
    value: "labor",
    label: "Labor",
    icon: User,
  },
  {
    value: "other",
    label: "Other",
    icon: Activity,
  },
];


// =========================================================
// HELPERS
// =========================================================

function getId(item) {
  return item?.id || item?._id || "";
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

function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "KSh —";
  }

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getActivityType(activity) {
  return (
    activity?.activity_type ||
    activity?.type ||
    "other"
  );
}

function getActivityLabel(activity) {
  const type = String(
    getActivityType(activity),
  ).toLowerCase();

  const match =
    ACTIVITY_TYPES.find(
      (item) =>
        item.value === type,
    );

  return (
    match?.label ||
    activity?.name ||
    activity?.activity_type ||
    "Farm Activity"
  );
}

function getActivityIcon(activity) {
  const type = String(
    getActivityType(activity),
  ).toLowerCase();

  const match =
    ACTIVITY_TYPES.find(
      (item) =>
        item.value === type,
    );

  return (
    match?.icon ||
    Activity
  );
}


// =========================================================
// ACTIVITY CARD
// =========================================================

function ActivityCard({
  activity,
}) {
  const Icon =
    getActivityIcon(activity);

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
            <Icon size={20} />
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
                  {getActivityLabel(
                    activity,
                  )}
                </h3>

                {activity?.description && (
                  <p
                    className="
                      mt-1
                      line-clamp-2
                      text-[9px]
                      leading-5
                      text-slate-400
                    "
                  >
                    {activity.description}
                  </p>
                )}

              </div>


              <span
                className="
                  inline-flex
                  shrink-0
                  items-center
                  gap-1
                  rounded-full
                  bg-emerald-50
                  px-2
                  py-1.5
                  text-[8px]
                  font-black
                  text-emerald-700
                "
              >
                <CheckCircle2 size={9} />
                Recorded
              </span>

            </div>


            <div
              className="
                mt-4
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
                    activity?.activity_date ||
                      activity?.date ||
                      activity?.created_at,
                  ) || "—"}
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
                  Cost
                </div>

                <div
                  className="
                    mt-1
                    text-[10px]
                    font-black
                    text-slate-800
                  "
                >
                  {activity?.cost !==
                  undefined &&
                  activity?.cost !== null &&
                  activity?.cost !== ""
                    ? formatMoney(
                        activity.cost,
                      )
                    : "—"}
                </div>
              </div>

            </div>


            {activity?.labor_count !==
              undefined &&
              activity?.labor_count !== null &&
              activity?.labor_count !== "" && (
                <div
                  className="
                    mt-3
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-xl
                    bg-blue-50
                    px-2.5
                    py-2
                    text-[8px]
                    font-bold
                    text-blue-700
                  "
                >
                  <UserRound size={10} />
                  {activity.labor_count} worker
                  {Number(
                    activity.labor_count,
                  ) === 1
                    ? ""
                    : "s"}
                </div>
              )}


            {activity?.notes && (
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
                {activity.notes}
              </p>
            )}

          </div>
        </div>

      </div>
    </article>
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
// ADD ACTIVITY MODAL
// =========================================================

function AddActivityModal({
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
              <Activity size={18} />
            </div>

            <div>

              <h2
                className="
                  text-sm
                  font-black
                  text-slate-900
                "
              >
                Record Activity
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


            {/* TYPE */}

            <Field
              label="Activity type"
              required
            >
              <select
                value={
                  form.activity_type
                }
                onChange={(event) =>
                  update(
                    "activity_type",
                    event.target.value,
                  )
                }
                className={
                  inputClass
                }
                required
              >
                <option value="">
                  Select activity
                </option>

                {ACTIVITY_TYPES.map(
                  (item) => (
                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {item.label}
                    </option>
                  ),
                )}
              </select>
            </Field>


            {/* DATE */}

            <Field
              label="Activity date"
              required
            >
              <input
                type="date"
                value={
                  form.activity_date
                }
                onChange={(event) =>
                  update(
                    "activity_date",
                    event.target.value,
                  )
                }
                className={
                  inputClass
                }
                required
              />
            </Field>


            {/* DESCRIPTION */}

            <Field label="Description">
              <textarea
                rows={3}
                value={
                  form.description
                }
                onChange={(event) =>
                  update(
                    "description",
                    event.target.value,
                  )
                }
                className={`${inputClass} resize-none`}
                placeholder="What happened on the farm?"
              />
            </Field>


            {/* COST / LABOR */}

            <div
              className="
                grid
                grid-cols-2
                gap-4
              "
            >

              <Field label="Cost (KES)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.cost
                  }
                  onChange={(event) =>
                    update(
                      "cost",
                      event.target.value,
                    )
                  }
                  className={
                    inputClass
                  }
                  placeholder="1500"
                />
              </Field>


              <Field label="Workers">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    form.labor_count
                  }
                  onChange={(event) =>
                    update(
                      "labor_count",
                      event.target.value,
                    )
                  }
                  className={
                    inputClass
                  }
                  placeholder="3"
                />
              </Field>

            </div>


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
                placeholder="Optional notes"
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
                transition
                hover:bg-emerald-700
                active:scale-[0.99]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <Plus size={17} />

              {saving
                ? "Saving Activity..."
                : "Record Activity"}
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

export default function ShambaActivitiesDashboard({
  onNavigate,
}) {
  const { user } = useAuth();

  const {
    getFarms,
    getFarmActivities,
    createFarmActivity,
  } = useJumuiyaApi();

  const [farms, setFarms] =
    useState([]);

  const [selectedFarmId, setSelectedFarmId] =
    useState("");

  const [selectedFarm, setSelectedFarm] =
    useState(null);

  const [activities, setActivities] =
    useState([]);

  const [loadingFarms, setLoadingFarms] =
    useState(true);

  const [loadingActivities, setLoadingActivities] =
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
            active.length > 0
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

    setSelectedFarm(
      farm,
    );
  }, [
    farms,
    selectedFarmId,
  ]);


  // =======================================================
  // LOAD ACTIVITIES
  // =======================================================

  const loadActivities =
    useCallback(
      async (farmId) => {
        if (!farmId) {
          setActivities([]);
          return;
        }

        try {
          setLoadingActivities(
            true,
          );
          setError("");

          const result =
            await getFarmActivities(
              farmId,
            );

          const list =
            Array.isArray(result)
              ? result
              : result?.activities ||
                [];

          const active =
            list.filter(
              (activity) =>
                activity?.status !==
                "deleted",
            );

          active.sort(
            (a, b) => {
              const first =
                new Date(
                  a?.activity_date ||
                    a?.date ||
                    a?.created_at ||
                    0,
                ).getTime();

              const second =
                new Date(
                  b?.activity_date ||
                    b?.date ||
                    b?.created_at ||
                    0,
                ).getTime();

              return second - first;
            },
          );

          setActivities(
            active,
          );
        } catch (err) {
          setActivities([]);

          setError(
            err?.message ||
              "Unable to load farm activities.",
          );
        } finally {
          setLoadingActivities(
            false,
          );
        }
      },
      [
        getFarmActivities,
      ],
    );


  useEffect(() => {
    loadActivities(
      selectedFarmId,
    );
  }, [
    selectedFarmId,
    loadActivities,
  ]);


  // =======================================================
  // SUMMARY
  // =======================================================

  const totalCost =
    useMemo(() => {
      return activities.reduce(
        (total, activity) => {
          const value =
            Number(
              activity?.cost,
            );

          return Number.isFinite(
            value,
          )
            ? total + value
            : total;
        },
        0,
      );
    }, [activities]);


  const totalWorkers =
    useMemo(() => {
      return activities.reduce(
        (total, activity) => {
          const value =
            Number(
              activity?.labor_count,
            );

          return Number.isFinite(
            value,
          )
            ? total + value
            : total;
        },
        0,
      );
    }, [activities]);


  const recentActivity =
    activities[0] ||
    null;


  // =======================================================
  // OPEN MODAL
  // =======================================================

  function openAddActivity() {
    if (!selectedFarmId) {
      setError(
        "Select a farm before recording an activity.",
      );
      return;
    }

    setError("");

    setForm({
      ...EMPTY_FORM,
      activity_date:
        new Date()
          .toISOString()
          .slice(0, 10),
    });

    setModalOpen(
      true,
    );
  }


  // =======================================================
  // CREATE ACTIVITY
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

      if (
        !String(
          form.activity_type ||
            "",
        ).trim()
      ) {
        setError(
          "Activity type is required.",
        );
        return;
      }

      if (!form.activity_date) {
        setError(
          "Activity date is required.",
        );
        return;
      }

      try {
        setSaving(true);
        setError("");

        const payload = {
          activity_type:
            String(
              form.activity_type,
            ).trim(),

          activity_date:
            form.activity_date,

          description:
            String(
              form.description ||
                "",
            ).trim(),

          cost:
            form.cost === ""
              ? 0
              : Number(
                  form.cost,
                ),

          labor_count:
            form.labor_count === ""
              ? 0
              : Number(
                  form.labor_count,
                ),

          notes:
            String(
              form.notes || "",
            ).trim(),
        };

        await createFarmActivity(
          selectedFarmId,
          payload,
        );

        setForm({
          ...EMPTY_FORM,
        });

        setModalOpen(
          false,
        );

        await loadActivities(
          selectedFarmId,
        );
      } catch (err) {
        setError(
          err?.message ||
            "Unable to record farm activity.",
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
      title="Activities"
      subtitle="Track the work happening across your farm."
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
            onClick={
              openAddActivity
            }
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
            Record Activity
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
            from-emerald-600
            via-green-600
            to-lime-500
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
                Shamba Activities
              </div>

              <h1
                className="
                  mt-1
                  text-xl
                  font-black
                  tracking-tight
                "
              >
                Know the work behind your farm.
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
                Record planting, irrigation,
                fertilizing, labor and other
                farm work as it happens.
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
              <Activity size={21} />
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

                  <div
                    className="
                      text-xs
                      font-bold
                      text-slate-700
                    "
                  >
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
            sm:grid-cols-4
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
              Activities
            </div>

            <div
              className="
                mt-1
                text-xl
                font-black
                text-emerald-700
              "
            >
              {loadingActivities
                ? "—"
                : activities.length}
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
              Total cost
            </div>

            <div
              className="
                mt-1
                text-lg
                font-black
                text-emerald-700
              "
            >
              {loadingActivities
                ? "—"
                : formatMoney(
                    totalCost,
                  )}
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
              Workers
            </div>

            <div
              className="
                mt-1
                text-xl
                font-black
                text-blue-600
              "
            >
              {loadingActivities
                ? "—"
                : totalWorkers}
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
              Latest
            </div>

            <div
              className="
                mt-1
                truncate
                text-sm
                font-black
                text-slate-800
              "
            >
              {recentActivity
                ? getActivityLabel(
                    recentActivity,
                  )
                : "None"}
            </div>
          </div>

        </section>


        {/* ==================================================
            ACTIVITY LIST
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
                Activity History
              </h2>

              <p
                className="
                  mt-0.5
                  text-[9px]
                  text-slate-400
                "
              >
                Recent work recorded for this farm.
              </p>

            </div>

            {activities.length >
              0 && (
              <button
                type="button"
                onClick={
                  openAddActivity
                }
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


          {loadingActivities ? (
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
                      h-40
                      animate-pulse
                      rounded-2xl
                      bg-slate-100
                    "
                  />
                ),
              )}
            </div>
          ) : activities.length > 0 ? (
            <div
              className="
                grid
                grid-cols-1
                gap-3
                md:grid-cols-2
              "
            >
              {activities.map(
                (activity, index) => (
                  <ActivityCard
                    key={
                      getId(
                        activity,
                      ) ||
                      index
                    }
                    activity={
                      activity
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
                <Activity size={25} />
              </div>

              <h2
                className="
                  mt-4
                  text-sm
                  font-black
                  text-slate-800
                "
              >
                No activities recorded
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
                Record the work happening on
                your farm to build a useful
                activity history.
              </p>

              <button
                type="button"
                onClick={
                  openAddActivity
                }
                disabled={
                  !selectedFarmId
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
                Record First Activity
              </button>

            </div>
          )}

        </section>


        {/* ==================================================
            STATUS
        ================================================== */}

        {activities.length >
          0 &&
          !loadingActivities && (
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

              Farm activity history is being
              tracked successfully.
            </div>
          )}

      </div>


      {/* ====================================================
          ADD ACTIVITY MODAL
      ==================================================== */}

      {modalOpen && (
        <AddActivityModal
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
          onSubmit={
            handleSubmit
          }
        />
      )}
    </JumuiyaDashboardShell>
  );
}
