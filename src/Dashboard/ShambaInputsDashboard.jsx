// src/Dashboard/ShambaInputsDashboard.jsx

import React, {
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Droplets,
  Filter,
  FlaskConical,
  Leaf,
  ShoppingBasket,
  Package,
  Plus,
  Search,
  Sprout,
  Tractor,
  Wrench,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";


// =========================================================
// INPUT CATALOG
// =========================================================
//
// This is intentionally a frontend catalog for now.
// No fake backend persistence is performed.
//

const INPUT_CATALOG = [
  {
    id: "seed-maize",
    name: "Maize Seed",
    category: "Seeds",
    icon: Sprout,
    unit: "kg",
    description:
      "Certified maize seed for planting.",
  },
  {
    id: "seed-vegetable",
    name: "Vegetable Seed",
    category: "Seeds",
    icon: Leaf,
    unit: "packet",
    description:
      "Vegetable seed packs for farm production.",
  },
  {
    id: "fertilizer",
    name: "Fertilizer",
    category: "Fertilizer",
    icon: FlaskConical,
    unit: "bag",
    description:
      "Crop nutrition and soil fertility products.",
  },
  {
    id: "pesticide",
    name: "Crop Protection",
    category: "Crop Protection",
    icon: FlaskConical,
    unit: "litre",
    description:
      "Crop protection products for pest and disease management.",
  },
  {
    id: "irrigation",
    name: "Irrigation Supplies",
    category: "Irrigation",
    icon: Droplets,
    unit: "unit",
    description:
      "Watering and irrigation equipment.",
  },
  {
    id: "tools",
    name: "Farm Tools",
    category: "Tools",
    icon: Wrench,
    unit: "unit",
    description:
      "Essential tools for day-to-day farm work.",
  },
  {
    id: "packaging",
    name: "Packaging Materials",
    category: "Packaging",
    icon: Package,
    unit: "unit",
    description:
      "Packaging materials for harvested produce.",
  },
  {
    id: "equipment",
    name: "Farm Equipment",
    category: "Equipment",
    icon: Tractor,
    unit: "unit",
    description:
      "Equipment used for larger farm operations.",
  },
];


// =========================================================
// CATEGORY CARD
// =========================================================

function CategoryCard({
  category,
  active,
  count,
  onClick,
}) {
  const categoryIcons = {
    Seeds: Sprout,
    Fertilizer: FlaskConical,
    "Crop Protection": FlaskConical,
    Irrigation: Droplets,
    Tools: Wrench,
    Packaging: Package,
    Equipment: Tractor,
  };

  const Icon =
    categoryIcons[category] ||
    Package;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex
        shrink-0
        items-center
        gap-2
        rounded-xl
        border
        px-3
        py-2.5
        text-left
        transition
        ${
          active
            ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
            : "border-slate-100 bg-white text-slate-600 hover:border-emerald-100 hover:bg-emerald-50"
        }
      `}
    >
      <Icon size={14} />

      <div className="min-w-0">
        <div className="text-[9px] font-black">
          {category}
        </div>

        <div
          className={`
            mt-0.5
            text-[8px]
            ${
              active
                ? "text-white/70"
                : "text-slate-400"
            }
          `}
        >
          {count} item{count === 1 ? "" : "s"}
        </div>
      </div>
    </button>
  );
}


// =========================================================
// INPUT CARD
// =========================================================

function InputCard({
  item,
  onOpen,
}) {
  const Icon = item.icon;

  return (
    <article
      className="
        overflow-hidden
        rounded-2xl
        border
        border-slate-100
        bg-white
        shadow-[0_4px_18px_rgba(15,23,42,0.04)]
        transition
        hover:-translate-y-0.5
        hover:shadow-md
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
                  {item.name}
                </h3>

                <span
                  className="
                    mt-1
                    inline-flex
                    rounded-lg
                    bg-emerald-50
                    px-2
                    py-1
                    text-[8px]
                    font-black
                    text-emerald-700
                  "
                >
                  {item.category}
                </span>

              </div>

              <span
                className="
                  shrink-0
                  rounded-lg
                  bg-slate-50
                  px-2
                  py-1.5
                  text-[8px]
                  font-bold
                  text-slate-500
                "
              >
                / {item.unit}
              </span>
            </div>

          </div>
        </div>

        <p
          className="
            mt-3
            text-[9px]
            leading-5
            text-slate-400
          "
        >
          {item.description}
        </p>

      </div>

      <div
        className="
          flex
          items-center
          justify-end
          border-t
          border-slate-50
          px-4
          py-3
        "
      >
        <button
          type="button"
          onClick={() =>
            onOpen?.(item)
          }
          className="
            inline-flex
            items-center
            gap-1.5
            rounded-xl
            bg-emerald-50
            px-3
            py-2
            text-[9px]
            font-black
            text-emerald-700
            transition
            hover:bg-emerald-100
          "
        >
          View Details
        </button>
      </div>
    </article>
  );
}


// =========================================================
// DETAIL MODAL
// =========================================================

function InputDetailModal({
  item,
  onClose,
}) {
  if (!item) {
    return null;
  }

  const Icon = item.icon;

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
      "
    >
      <div
        className="
          w-full
          max-w-md
          overflow-hidden
          rounded-3xl
          bg-white
          shadow-2xl
        "
      >

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-slate-100
            px-4
            py-4
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
              <Icon size={18} />
            </div>

            <div>
              <h2 className="text-sm font-black text-slate-900">
                {item.name}
              </h2>

              <p className="mt-0.5 text-[9px] text-slate-400">
                {item.category}
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
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
            "
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">

          <div
            className="
              rounded-2xl
              border
              border-emerald-100
              bg-emerald-50/50
              p-4
            "
          >
            <div className="text-[8px] font-black uppercase tracking-[0.16em] text-emerald-600">
              Farm Input
            </div>

            <p className="mt-2 text-sm font-bold text-slate-800">
              {item.description}
            </p>

            <div className="mt-4 flex items-center gap-2">

              <span
                className="
                  rounded-xl
                  bg-white
                  px-3
                  py-2
                  text-[9px]
                  font-bold
                  text-slate-500
                "
              >
                Category: {item.category}
              </span>

              <span
                className="
                  rounded-xl
                  bg-white
                  px-3
                  py-2
                  text-[9px]
                  font-bold
                  text-slate-500
                "
              >
                Unit: {item.unit}
              </span>

            </div>
          </div>

          <div
            className="
              mt-4
              rounded-2xl
              border
              border-slate-100
              bg-slate-50
              p-4
            "
          >
            <div className="text-[9px] font-black text-slate-700">
              Marketplace integration
            </div>

            <p className="mt-1 text-[9px] leading-5 text-slate-400">
              Supplier listings and purchase actions
              will appear here when the Shamba input
              marketplace is connected.
            </p>
          </div>

        </div>

        <div
          className="
            flex
            justify-end
            border-t
            border-slate-100
            px-4
            py-3
          "
        >
          <button
            type="button"
            onClick={onClose}
            className="
              rounded-xl
              bg-emerald-600
              px-4
              py-2.5
              text-[10px]
              font-black
              text-white
              hover:bg-emerald-700
            "
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}


// =========================================================
// MAIN
// =========================================================

export default function ShambaInputsDashboard({
  onNavigate,
}) {
  const { user } = useAuth();

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState("all");

  const [
    selectedInput,
    setSelectedInput,
  ] = useState(null);


  // =======================================================
  // CATEGORIES
  // =======================================================

  const categories = useMemo(() => {
    return [
      "all",
      ...Array.from(
        new Set(
          INPUT_CATALOG.map(
            (item) =>
              item.category,
          ),
        ),
      ),
    ];
  }, []);


  // =======================================================
  // FILTER
  // =======================================================

  const filteredInputs =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return INPUT_CATALOG.filter(
        (item) => {
          const matchesCategory =
            category === "all" ||
            item.category ===
              category;

          if (!matchesCategory) {
            return false;
          }

          if (!query) {
            return true;
          }

          const searchable = [
            item.name,
            item.category,
            item.description,
            item.unit,
          ]
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            query,
          );
        },
      );
    }, [
      search,
      category,
    ]);


  // =======================================================
  // CATEGORY COUNT
  // =======================================================

  function categoryCount(
    value,
  ) {
    if (value === "all") {
      return INPUT_CATALOG.length;
    }

    return INPUT_CATALOG.filter(
      (item) =>
        item.category ===
        value,
    ).length;
  }


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <JumuiyaDashboardShell
      title="Inputs"
      subtitle="Find the supplies your farm needs."
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
            onClick={() =>
              onNavigate?.(
                "shamba/market",
              )
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
            "
          >
            <ShoppingBasketIcon />
            Find Suppliers
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
            p-5
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
                bg-emerald-600
                text-white
                shadow-lg
              "
            >
              <Package size={20} />
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
                Farm Inputs
              </h1>

              <p
                className="
                  mt-1
                  max-w-xl
                  text-[10px]
                  leading-5
                  text-slate-500
                "
              >
                Explore seeds, fertilizer,
                crop protection, irrigation,
                tools and other farm supplies.
              </p>

            </div>

          </div>

        </section>


        {/* ==================================================
            SEARCH
        ================================================== */}

        <section
          className="
            mb-4
            rounded-2xl
            border
            border-slate-100
            bg-white
            p-3
            shadow-[0_4px_18px_rgba(15,23,42,0.035)]
          "
        >

          <div
            className="
              flex
              items-center
              gap-2
              rounded-xl
              bg-slate-50
              px-3
            "
          >

            <Search
              size={16}
              className="shrink-0 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search seeds, fertilizer, tools..."
              className="
                min-w-0
                flex-1
                bg-transparent
                py-3
                text-sm
                text-slate-800
                outline-none
                placeholder:text-slate-400
              "
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                className="
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-white
                  text-slate-400
                  shadow-sm
                "
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}

          </div>

        </section>


        {/* ==================================================
            CATEGORIES
        ================================================== */}

        <section className="mb-5">

          <div className="mb-2 flex items-center gap-2">

            <Filter
              size={13}
              className="text-slate-400"
            />

            <span
              className="
                text-[9px]
                font-black
                uppercase
                tracking-wide
                text-slate-500
              "
            >
              Categories
            </span>

          </div>


          <div
            className="
              flex
              gap-1.5
              overflow-x-auto
              pb-1
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >

            {categories.map(
              (item) => (
                <CategoryCard
                  key={item}
                  category={
                    item === "all"
                      ? "All Inputs"
                      : item
                  }
                  active={
                    (item === "all"
                      ? category === "all"
                      : category === item)
                  }
                  count={
                    categoryCount(
                      item,
                    )
                  }
                  onClick={() =>
                    setCategory(
                      item,
                    )
                  }
                />
              ),
            )}

          </div>

        </section>


        {/* ==================================================
            RESULT HEADER
        ================================================== */}

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
              Available Inputs
            </h2>

            <p
              className="
                mt-0.5
                text-[9px]
                text-slate-400
              "
            >
              {filteredInputs.length} item
              {filteredInputs.length === 1
                ? ""
                : "s"}
              found
            </p>

          </div>


          {(search ||
            category !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("all");
              }}
              className="
                text-[9px]
                font-black
                text-emerald-600
              "
            >
              Clear filters
            </button>
          )}

        </div>


        {/* ==================================================
            INPUT GRID
        ================================================== */}

        {filteredInputs.length > 0 ? (
          <div
            className="
              grid
              grid-cols-1
              gap-3
              md:grid-cols-2
            "
          >

            {filteredInputs.map(
              (item) => (
                <InputCard
                  key={item.id}
                  item={item}
                  onOpen={
                    setSelectedInput
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
              py-14
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
              <Search size={24} />
            </div>

            <h2
              className="
                mt-4
                text-sm
                font-black
                text-slate-800
              "
            >
              No inputs found
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
              Try another search term or
              choose a different category.
            </p>

          </div>
        )}


        {/* ==================================================
            INFO
        ================================================== */}

        <div
          className="
            mt-5
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-amber-100
            bg-amber-50/70
            px-4
            py-3
          "
        >

          <div
            className="
              mt-0.5
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-amber-100
              text-amber-700
            "
          >
            <Package size={14} />
          </div>

          <div>

            <div
              className="
                text-[9px]
                font-black
                text-amber-800
              "
            >
              Input marketplace is next
            </div>

            <p
              className="
                mt-1
                text-[9px]
                leading-5
                text-amber-700/80
              "
            >
              The current screen provides the
              Shamba input catalog. Supplier
              listings and purchasing will be
              connected when the backend input
              marketplace is added.
            </p>

          </div>

        </div>

      </div>


      {/* ====================================================
          DETAILS
      ==================================================== */}

      {selectedInput && (
        <InputDetailModal
          item={selectedInput}
          onClose={() =>
            setSelectedInput(null)
          }
        />
      )}
    </JumuiyaDashboardShell>
  );
}


// =========================================================
// SMALL ICON HELPER
// =========================================================

function ShoppingBasketIcon() {
  return (
    <ShoppingBasket size={15} />
  );
}
