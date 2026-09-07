//src/Dashboard/ShambaMarketDashboard.jsx
// src/Dashboard/ShambaMarketDashboard.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Filter,
  Leaf,
  MapPin,
  Package,
  Plus,
  Search,
  ShoppingBasket,
  Tag,
  TrendingUp,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";


// =========================================================
// HELPERS
// =========================================================

function getListingId(listing) {
  return listing?.id || listing?._id || null;
}

function formatPrice(value, currency = "KES") {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Price on request";
  }

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function getListingLocation(listing) {
  if (typeof listing?.location === "string") {
    return listing.location;
  }

  if (listing?.location?.name) {
    return listing.location.name;
  }

  if (listing?.location?.town) {
    return listing.location.town;
  }

  if (listing?.location?.county) {
    return listing.location.county;
  }

  return "Location not specified";
}

function getCategoryLabel(listing) {
  return (
    listing?.category ||
    "Produce"
  );
}

function getQuantityLabel(listing) {
  if (
    listing?.quantity_available === undefined ||
    listing?.quantity_available === null ||
    listing?.quantity_available === ""
  ) {
    return null;
  }

  return `${listing.quantity_available}${
    listing?.unit
      ? ` ${listing.unit}`
      : ""
  }`;
}


// =========================================================
// CATEGORY BUTTON
// =========================================================

function CategoryButton({
  label,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        shrink-0
        rounded-xl
        px-3
        py-2
        text-[9px]
        font-black
        transition
        ${
          active
            ? "bg-emerald-600 text-white shadow-sm"
            : "border border-slate-100 bg-white text-slate-500 hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-700"
        }
      `}
    >
      {label}
    </button>
  );
}


// =========================================================
// MARKET CARD
// =========================================================

function MarketCard({
  listing,
}) {
  const quantity =
    getQuantityLabel(listing);

  const location =
    getListingLocation(listing);

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
      {/* TOP */}

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
            <Leaf size={20} />
          </div>

          <div className="min-w-0 flex-1">

            <div className="flex items-start justify-between gap-2">

              <div className="min-w-0">

                <h3
                  className="
                    line-clamp-2
                    text-sm
                    font-black
                    leading-5
                    text-slate-900
                  "
                >
                  {listing?.title ||
                    "Produce listing"}
                </h3>

                <div className="mt-1 flex items-center gap-1">
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1
                      rounded-lg
                      bg-emerald-50
                      px-2
                      py-1
                      text-[8px]
                      font-black
                      text-emerald-700
                    "
                  >
                    <Tag size={9} />
                    {getCategoryLabel(
                      listing,
                    )}
                  </span>
                </div>

              </div>

              <div className="shrink-0 text-right">
                <div className="text-sm font-black text-orange-600">
                  {formatPrice(
                    listing?.price,
                    listing?.currency ||
                      "KES",
                  )}
                </div>

                {listing?.unit && (
                  <div className="mt-0.5 text-[8px] text-slate-400">
                    / {listing.unit}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>


        {/* DESCRIPTION */}

        {listing?.description && (
          <p
            className="
              mt-3
              line-clamp-3
              text-[10px]
              leading-5
              text-slate-500
            "
          >
            {listing.description}
          </p>
        )}


        {/* META */}

        <div
          className="
            mt-4
            grid
            grid-cols-1
            gap-2
            sm:grid-cols-2
          "
        >

          <div
            className="
              flex
              min-w-0
              items-center
              gap-2
              rounded-xl
              bg-slate-50
              px-2.5
              py-2
            "
          >
            <MapPin
              size={12}
              className="shrink-0 text-slate-400"
            />

            <span
              className="
                truncate
                text-[9px]
                font-semibold
                text-slate-500
              "
            >
              {location}
            </span>
          </div>


          {quantity ? (
            <div
              className="
                flex
                min-w-0
                items-center
                gap-2
                rounded-xl
                bg-slate-50
                px-2.5
                py-2
              "
            >
              <Package
                size={12}
                className="shrink-0 text-slate-400"
              />

              <span
                className="
                  truncate
                  text-[9px]
                  font-semibold
                  text-slate-500
                "
              >
                {quantity} available
              </span>
            </div>
          ) : (
            <div
              className="
                flex
                min-w-0
                items-center
                gap-2
                rounded-xl
                bg-slate-50
                px-2.5
                py-2
              "
            >
              <ShoppingBasket
                size={12}
                className="shrink-0 text-slate-400"
              />

              <span
                className="
                  truncate
                  text-[9px]
                  font-semibold
                  text-slate-500
                "
              >
                Availability varies
              </span>
            </div>
          )}

        </div>

      </div>


      {/* FOOTER */}

      <div
        className="
          flex
          items-center
          justify-between
          gap-3
          border-t
          border-slate-50
          px-4
          py-3
        "
      >

        <div className="min-w-0">

          <div className="text-[8px] font-black uppercase tracking-wide text-slate-400">
            Seller
          </div>

          <div className="mt-0.5 truncate text-[10px] font-bold text-slate-700">
            {listing?.seller_name ||
              listing?.seller ||
              "Shamba seller"}
          </div>

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
          <TrendingUp size={9} />
          Active
        </span>

      </div>
    </article>
  );
}


// =========================================================
// EMPTY STATE
// =========================================================

function EmptyMarket({
  onSell,
  filtered,
}) {
  return (
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
        {filtered ? (
          <Search size={24} />
        ) : (
          <ShoppingBasket size={24} />
        )}
      </div>

      <h2
        className="
          mt-4
          text-sm
          font-black
          text-slate-800
        "
      >
        {filtered
          ? "No matching listings"
          : "The market is quiet"}
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
        {filtered
          ? "Try another search term or category."
          : "There are no active Shamba marketplace listings yet."}
      </p>

      {!filtered && (
        <button
          type="button"
          onClick={onSell}
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
          List Produce
        </button>
      )}

    </div>
  );
}


// =========================================================
// MAIN
// =========================================================

export default function ShambaMarketDashboard({
  onNavigate,
}) {
  const { user } = useAuth();

  const {
    getMarketplaceListings,
  } = useJumuiyaApi();

  const [listings, setListings] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("all");


  // =======================================================
  // LOAD LISTINGS
  // =======================================================

  const loadListings = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await getMarketplaceListings({
            hub: "shamba",
          });

        const data =
          Array.isArray(result)
            ? result
            : result?.listings || [];

        setListings(
          data.filter(
            (listing) =>
              listing?.status !==
              "deleted",
          ),
        );
      } catch (err) {
        setError(
          err?.message ||
            "Unable to load the Shamba market.",
        );

        setListings([]);
      } finally {
        setLoading(false);
      }
    },
    [getMarketplaceListings],
  );


  useEffect(() => {
    loadListings();
  }, [loadListings]);


  // =======================================================
  // CATEGORIES
  // =======================================================

  const categories = useMemo(() => {
    const values = listings
      .map(
        (listing) =>
          listing?.category,
      )
      .filter(Boolean)
      .map((value) =>
        String(value).trim(),
      );

    return [
      "all",
      ...Array.from(
        new Set(values),
      ),
    ];
  }, [listings]);


  // =======================================================
  // FILTER
  // =======================================================

  const filteredListings =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return listings.filter(
        (listing) => {
          const matchesCategory =
            category === "all" ||
            String(
              listing?.category ||
                "",
            ).toLowerCase() ===
              category.toLowerCase();

          if (!matchesCategory) {
            return false;
          }

          if (!query) {
            return true;
          }

          const searchable =
            [
              listing?.title,
              listing?.description,
              listing?.category,
              listing?.unit,
              getListingLocation(
                listing,
              ),
              listing?.seller_name,
              listing?.seller,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return searchable.includes(
            query,
          );
        },
      );
    }, [
      listings,
      search,
      category,
    ]);


  // =======================================================
  // COUNTS
  // =======================================================

  const categoryCount =
    categories.length > 1
      ? categories.length - 1
      : 0;


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <JumuiyaDashboardShell
      title="Market"
      subtitle="Discover produce, prices and opportunities."
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
              onNavigate?.("shamba/sell")
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
            <Plus size={15} />
            Sell Produce
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
            from-orange-400
            via-orange-500
            to-amber-500
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
                Shamba Market
              </div>

              <h1
                className="
                  mt-1
                  text-xl
                  font-black
                  tracking-tight
                "
              >
                Find the right market
                for your produce.
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
                Explore active listings from
                farmers and other Shamba
                participants.
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
              <TrendingUp size={21} />
            </div>

          </div>


          {/* MARKET STATS */}

          <div
            className="
              mt-4
              grid
              grid-cols-2
              gap-2
              sm:grid-cols-3
            "
          >

            <div
              className="
                rounded-2xl
                bg-white/10
                p-3
                backdrop-blur-sm
              "
            >
              <div className="text-[8px] font-bold uppercase tracking-wide text-white/60">
                Listings
              </div>

              <div className="mt-1 text-lg font-black">
                {loading
                  ? "—"
                  : listings.length}
              </div>
            </div>


            <div
              className="
                rounded-2xl
                bg-white/10
                p-3
                backdrop-blur-sm
              "
            >
              <div className="text-[8px] font-bold uppercase tracking-wide text-white/60">
                Categories
              </div>

              <div className="mt-1 text-lg font-black">
                {loading
                  ? "—"
                  : categoryCount}
              </div>
            </div>


            <div
              className="
                col-span-2
                rounded-2xl
                bg-white/10
                p-3
                backdrop-blur-sm
                sm:col-span-1
              "
            >
              <div className="text-[8px] font-bold uppercase tracking-wide text-white/60">
                Status
              </div>

              <div className="mt-1 text-sm font-black">
                Active market
              </div>
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
              placeholder="Search maize, tomatoes, vegetables..."
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
                  hover:text-slate-700
                "
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}

          </div>

        </section>


        {/* ==================================================
            FILTERS
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
                <CategoryButton
                  key={item}
                  label={
                    item === "all"
                      ? "All"
                      : item
                  }
                  active={
                    category ===
                    item
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
            ERROR
        ================================================== */}

        {error && (
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
            RESULTS HEADER
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
              Market Listings
            </h2>

            <p
              className="
                mt-0.5
                text-[9px]
                text-slate-400
              "
            >
              {loading
                ? "Loading listings..."
                : `${filteredListings.length} listing${
                    filteredListings.length === 1
                      ? ""
                      : "s"
                  } found`}
            </p>

          </div>

          {(search ||
            category !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory(
                  "all",
                );
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
            RESULTS
        ================================================== */}

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
                    h-52
                    animate-pulse
                    rounded-2xl
                    bg-slate-100
                  "
                />
              ),
            )}
          </div>
        ) : filteredListings.length > 0 ? (
          <div
            className="
              grid
              grid-cols-1
              gap-3
              md:grid-cols-2
            "
          >
            {filteredListings.map(
              (listing, index) => (
                <MarketCard
                  key={
                    getListingId(
                      listing,
                    ) || index
                  }
                  listing={listing}
                />
              ),
            )}
          </div>
        ) : (
          <EmptyMarket
            filtered={
              Boolean(search) ||
              category !== "all"
            }
            onSell={() =>
              onNavigate?.(
                "shamba/sell",
              )
            }
          />
        )}

      </div>
    </JumuiyaDashboardShell>
  );
}
