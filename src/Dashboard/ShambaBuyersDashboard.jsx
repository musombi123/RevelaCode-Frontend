// src/Dashboard/ShambaBuyersDashboard.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  Filter,
  Leaf,
  MapPin,
  MessageCircle,
  Search,
  ShoppingBasket,
  UserRound,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";


// =========================================================
// HELPERS
// =========================================================

function getListingId(listing) {
  return (
    listing?.id ||
    listing?._id ||
    null
  );
}

function getBuyerName(listing) {
  return (
    listing?.buyer_name ||
    listing?.buyer ||
    listing?.customer_name ||
    listing?.seller_name ||
    "Shamba participant"
  );
}

function getLocation(listing) {
  if (
    typeof listing?.location ===
    "string"
  ) {
    return listing.location;
  }

  return (
    listing?.location?.name ||
    listing?.location?.town ||
    listing?.location?.county ||
    "Location not specified"
  );
}

function getCategory(listing) {
  return (
    listing?.category ||
    "Produce"
  );
}


// =========================================================
// BUYER CARD
// =========================================================

function BuyerCard({
  listing,
  onContact,
}) {
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
              bg-emerald-50
              text-emerald-600
            "
          >
            <UserRound size={20} />
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
                  {getBuyerName(
                    listing,
                  )}
                </h3>

                <div
                  className="
                    mt-1
                    flex
                    items-center
                    gap-1
                    text-[9px]
                    text-slate-400
                  "
                >
                  <MapPin size={10} />

                  <span className="truncate">
                    {getLocation(
                      listing,
                    )}
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
                Active
              </span>

            </div>

          </div>
        </div>


        {/* REQUEST */}

        <div
          className="
            mt-4
            rounded-2xl
            border
            border-slate-100
            bg-slate-50
            p-3
          "
        >

          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <Leaf
              size={13}
              className="text-emerald-600"
            />

            <span
              className="
                text-[8px]
                font-black
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Looking for
            </span>
          </div>

          <div
            className="
              mt-1
              text-sm
              font-black
              text-slate-800
            "
          >
            {listing?.title ||
              "Produce requirement"}
          </div>

          <div
            className="
              mt-1
              text-[9px]
              text-slate-400
            "
          >
            {getCategory(listing)}
          </div>

        </div>


        {/* QUANTITY */}

        {listing?.quantity_available !==
          undefined && (
          <div
            className="
              mt-3
              flex
              items-center
              justify-between
              rounded-xl
              bg-amber-50
              px-3
              py-2.5
            "
          >
            <span
              className="
                text-[8px]
                font-black
                uppercase
                tracking-wide
                text-amber-700
              "
            >
              Quantity
            </span>

            <span
              className="
                text-[10px]
                font-black
                text-amber-800
              "
            >
              {listing.quantity_available}
              {listing?.unit
                ? ` ${listing.unit}`
                : ""}
            </span>
          </div>
        )}

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

        <div className="text-[8px] text-slate-400">
          Connect with this market participant.
        </div>

        <button
          type="button"
          onClick={() =>
            onContact?.(listing)
          }
          className="
            inline-flex
            items-center
            gap-1.5
            rounded-xl
            bg-emerald-600
            px-3
            py-2
            text-[9px]
            font-black
            text-white
            transition
            hover:bg-emerald-700
          "
        >
          <MessageCircle size={13} />
          Contact
        </button>

      </div>
    </article>
  );
}


// =========================================================
// CONTACT MODAL
// =========================================================

function ContactModal({
  listing,
  onClose,
}) {
  if (!listing) {
    return null;
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

        {/* HEADER */}

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
              <MessageCircle size={18} />
            </div>

            <div>
              <h2
                className="
                  text-sm
                  font-black
                  text-slate-900
                "
              >
                Contact Buyer
              </h2>

              <p
                className="
                  mt-0.5
                  text-[9px]
                  text-slate-400
                "
              >
                {getBuyerName(
                  listing,
                )}
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


        {/* CONTENT */}

        <div className="p-5">

          <div
            className="
              rounded-2xl
              border
              border-emerald-100
              bg-emerald-50/60
              p-4
            "
          >

            <div
              className="
                flex
                items-center
                gap-2
                text-[8px]
                font-black
                uppercase
                tracking-[0.16em]
                text-emerald-700
              "
            >
              <ShoppingBasket size={11} />
              Buyer Opportunity
            </div>

            <h3
              className="
                mt-2
                text-base
                font-black
                text-slate-900
              "
            >
              {listing?.title ||
                "Produce requirement"}
            </h3>

            <p
              className="
                mt-1
                text-[10px]
                leading-5
                text-slate-500
              "
            >
              {listing?.description ||
                "Buyer details and communication tools will appear here when buyer-contact functionality is connected."}
            </p>

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
              Buyer contact
            </div>

            <p
              className="
                mt-1
                text-[9px]
                leading-5
                text-slate-400
              "
            >
              Direct messaging, contact details,
              and transaction requests will be
              enabled when the buyer communication
              backend is connected.
            </p>

          </div>

        </div>


        {/* FOOTER */}

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

export default function ShambaBuyersDashboard({
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

  const [selectedBuyer, setSelectedBuyer] =
    useState(null);


  // =======================================================
  // LOAD SHAMBA MARKET DATA
  // =======================================================

  const loadBuyers =
    useCallback(
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
              (item) =>
                item?.status !==
                "deleted",
            ),
          );
        } catch (err) {
          setListings([]);

          setError(
            err?.message ||
              "Unable to load buyer opportunities.",
          );
        } finally {
          setLoading(false);
        }
      },
      [
        getMarketplaceListings,
      ],
    );


  useEffect(() => {
    loadBuyers();
  }, [loadBuyers]);


  // =======================================================
  // CATEGORIES
  // =======================================================

  const categories =
    useMemo(() => {
      const values =
        listings
          .map(
            (item) =>
              item?.category,
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
  // FILTERED BUYERS
  // =======================================================

  const filteredBuyers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return listings.filter(
        (listing) => {
          if (
            category !==
              "all" &&
            String(
              listing?.category ||
                "",
            ).toLowerCase() !==
              category.toLowerCase()
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const searchable = [
            getBuyerName(
              listing,
            ),
            listing?.title,
            listing?.description,
            listing?.category,
            getLocation(
              listing,
            ),
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
  // RENDER
  // =======================================================

  return (
    <JumuiyaDashboardShell
      title="Buyers"
      subtitle="Find people and opportunities for your produce."
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
              onNavigate?.("shamba/market")
            }
            className="
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
              shadow-sm
              transition
              hover:bg-emerald-700
            "
          >
            <Leaf size={14} />
            Open Market
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
              <UsersIcon />
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
                Buyers
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
                Discover market opportunities
                for your farm produce and connect
                with potential buyers.
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
              placeholder="Search buyers, produce or location..."
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
            FILTERS
        ================================================== */}

        <section className="mb-5">

          <div
            className="
              mb-2
              flex
              items-center
              gap-2
            "
          >

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
              Produce Categories
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
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setCategory(
                      item,
                    )
                  }
                  className={`
                    shrink-0
                    rounded-xl
                    px-3
                    py-2
                    text-[9px]
                    font-black
                    transition
                    ${
                      category ===
                      item
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-100 bg-white text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                    }
                  `}
                >
                  {item ===
                  "all"
                    ? "All"
                    : item}
                </button>
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
              Opportunities
            </div>

            <div
              className="
                mt-1
                text-xl
                font-black
                text-emerald-700
              "
            >
              {loading
                ? "—"
                : filteredBuyers.length}
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
              Categories
            </div>

            <div
              className="
                mt-1
                text-xl
                font-black
                text-emerald-700
              "
            >
              {loading
                ? "—"
                : Math.max(
                    categories.length -
                      1,
                    0,
                  )}
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
              Farmer
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
              {user?.full_name ||
                user?.fullName ||
                user?.name ||
                "Farmer"}
            </div>
          </div>

        </section>


        {/* ==================================================
            RESULTS
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
              Buyer Opportunities
            </h2>

            <p
              className="
                mt-0.5
                text-[9px]
                text-slate-400
              "
            >
              {loading
                ? "Loading opportunities..."
                : `${filteredBuyers.length} opportunity${
                    filteredBuyers.length ===
                    1
                      ? ""
                      : "ies"
                  }`}
            </p>

          </div>

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
                    h-52
                    animate-pulse
                    rounded-2xl
                    bg-slate-100
                  "
                />
              ),
            )}
          </div>
        ) : filteredBuyers.length >
          0 ? (
          <div
            className="
              grid
              grid-cols-1
              gap-3
              md:grid-cols-2
            "
          >

            {filteredBuyers.map(
              (listing, index) => (
                <BuyerCard
                  key={
                    getListingId(
                      listing,
                    ) ||
                    index
                  }
                  listing={
                    listing
                  }
                  onContact={
                    setSelectedBuyer
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
              <UsersIcon size={24} />
            </div>

            <h2
              className="
                mt-4
                text-sm
                font-black
                text-slate-800
              "
            >
              No buyer opportunities found
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
              Try changing your search or
              category filter.
            </p>

            {(
              search ||
              category !== "all"
            ) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory(
                    "all",
                  );
                }}
                className="
                  mt-5
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
                Clear Filters
              </button>
            )}

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
            border-emerald-100
            bg-emerald-50/60
            px-4
            py-3
          "
        >

          <div
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-emerald-100
              text-emerald-700
            "
          >
            <CheckCircle2 size={14} />
          </div>

          <div>

            <div
              className="
                text-[9px]
                font-black
                text-emerald-800
              "
            >
              Connected to Shamba Market
            </div>

            <p
              className="
                mt-1
                text-[9px]
                leading-5
                text-emerald-700/75
              "
            >
              Buyer opportunities currently use
              active Shamba marketplace records.
              Dedicated buyer profiles and direct
              messaging can be added to the backend
              later.
            </p>

          </div>

        </div>

      </div>


      {/* ====================================================
          CONTACT MODAL
      ==================================================== */}

      {selectedBuyer && (
        <ContactModal
          listing={selectedBuyer}
          onClose={() =>
            setSelectedBuyer(null)
          }
        />
      )}

    </JumuiyaDashboardShell>
  );
}


// =========================================================
// SMALL ICON HELPER
// =========================================================

function UsersIcon({
  size = 20,
}) {
  return (
    <Users
      size={size}
    />
  );
}
