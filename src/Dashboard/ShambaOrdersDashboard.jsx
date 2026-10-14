// src/Dashboard/ShambaOrdersDashboard.jsx

import React, {
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Package,
  ShoppingCart,
  Truck,
  User,
  WalletCards,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import ShambaDashboardFrame from "@/Dashboard/ShambaDashboardFrame.jsx";


// =========================================================
// ORDER STATUS
// =========================================================

const ORDER_STATUS = [
  {
    key: "all",
    label: "All",
  },
  {
    key: "pending",
    label: "Pending",
  },
  {
    key: "confirmed",
    label: "Confirmed",
  },
  {
    key: "completed",
    label: "Completed",
  },
  {
    key: "cancelled",
    label: "Cancelled",
  },
];


// =========================================================
// STATUS CONFIG
// =========================================================

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    className:
      "bg-amber-50 text-amber-700",
    icon: Clock3,
  },

  confirmed: {
    label: "Confirmed",
    className:
      "bg-blue-50 text-blue-700",
    icon: CheckCircle2,
  },

  completed: {
    label: "Completed",
    className:
      "bg-emerald-50 text-[#075E46]",
    icon: CheckCircle2,
  },

  cancelled: {
    label: "Cancelled",
    className:
      "bg-red-50 text-red-700",
    icon: Clock3,
  },
};


// =========================================================
// HELPERS
// =========================================================

function formatMoney(
  value,
  currency = "KES",
) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "KSh —";
  }

  try {
    return new Intl.NumberFormat(
      "en-KE",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      },
    ).format(amount);
  } catch {
    return `KSh ${amount.toLocaleString()}`;
  }
}

function formatDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date.toLocaleDateString(
    "en-KE",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}


// =========================================================
// ORDER CARD
// =========================================================

function OrderCard({
  order,
}) {
  const status =
    String(
      order?.status ||
        "pending",
    ).toLowerCase();

  const config =
    STATUS_CONFIG[status] ||
    STATUS_CONFIG.pending;

  const StatusIcon =
    config.icon;

  return (
    <article
      className="
        overflow-hidden
        rounded-2xl
        border
        border-[#DCE5E1]
        bg-white
        shadow-[0_4px_18px_rgba(15,23,42,0.04)]
      "
    >

      {/* ==================================================
          MAIN
      ================================================== */}

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
              text-[#087F5B]
            "
          >
            <Package size={19} />
          </div>


          <div
            className="
              min-w-0
              flex-1
            "
          >

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
                  className="truncate font-black text-slate-900 text-base leading-snug text-[#172B25]"
                >
                  {order?.title ||
                    order?.product ||
                    "Produce Order"}
                </h3>

                <div
                  className="
                    mt-1
                    text-[13px]
                    text-slate-400
                  "
                >
                  Order #
                  {order?.order_number ||
                    order?.id ||
                    "Pending"}
                </div>

              </div>


              <span
                className={`
                  inline-flex
                  shrink-0
                  items-center
                  gap-1
                  rounded-full
                  px-2
                  py-1.5
                  text-[13px]
                  font-black
                  ${config.className}
                `}
              >
                <StatusIcon size={10} />
                {config.label}
              </span>

            </div>


            {/* ORDER DETAILS */}

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
                    text-[13px]
                    font-black
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  Amount
                </div>

                <div
                  className="
                    mt-1
                    text-[13px]
                    font-black
                    text-slate-800
                  "
                >
                  {formatMoney(
                    order?.total ??
                      order?.amount,
                    order?.currency ||
                      "KES",
                  )}
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
                    text-[13px]
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
                    text-[13px]
                    font-black
                    text-slate-800
                  "
                >
                  {order?.quantity ||
                    "—"}{" "}
                  {order?.unit || ""}
                </div>
              </div>

            </div>

          </div>
        </div>


        {/* CUSTOMER / SELLER */}

        <div
          className="
            mt-3
            flex
            items-center
            gap-2
            rounded-xl
            border
            border-[#DCE5E1]
            bg-slate-50
            px-3
            py-2.5
          "
        >

          <User
            size={13}
            className="
              shrink-0
              text-slate-400
            "
          />

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <div
              className="
                text-[13px]
                font-black
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Other party
            </div>

            <div
              className="
                mt-0.5
                truncate
                text-[13px]
                font-bold
                text-slate-600
              "
            >
              {order?.buyer_name ||
                order?.seller_name ||
                "Participant"}
            </div>
          </div>

        </div>


        {/* DATE */}

        {order?.created_at && (
          <div
            className="
              mt-3
              text-[13px]
              text-slate-400
            "
          >
            Created{" "}
            {formatDate(
              order.created_at,
            ) || ""}
          </div>
        )}

      </div>


      {/* ==================================================
          FOOTER
      ================================================== */}

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

        <div
          className="
            flex
            items-center
            gap-1.5
            text-[13px]
            font-semibold
            text-slate-400
          "
        >
          <Truck size={11} />
          Delivery & payment tracking
        </div>


        <span
          className="
            text-[13px]
            font-black
            text-slate-500
          "
        >
          Shamba
        </span>

      </div>

    </article>
  );
}


// =========================================================
// EMPTY STATE
// =========================================================

function OrdersEmptyState({
  mode,
  onNavigate,
}) {
  const selling =
    mode === "selling";

  return (
    <div
      className="
        rounded-2xl
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
          text-[#087F5B]
        "
      >
        {selling ? (
          <ShoppingCart size={24} />
        ) : (
          <Package size={24} />
        )}
      </div>


      <h2
        className="mt-4 font-black text-slate-800 text-xl leading-snug tracking-tight text-[#172B25]"
      >
        No {selling ? "sales" : "purchases"} yet
      </h2>


      <p
        className="
          mx-auto
          mt-1
          max-w-sm
          text-[13px]
          leading-5
          text-slate-400
        "
      >
        {selling
          ? "Orders from customers will appear here once the Shamba order system is connected."
          : "Orders you place for farm produce or supplies will appear here once ordering is connected."}
      </p>


      <button
        type="button"
        onClick={() =>
          onNavigate?.(
            selling
              ? "shamba/market"
              : "shamba/market",
          )
        }
        className="
          mt-5
          inline-flex
          items-center
          gap-1.5
          rounded-xl
          bg-[#087F5B]
          px-4
          py-2.5
          text-[13px]
          font-black
          text-white
          transition
          hover:bg-[#075E46]
          active:scale-[0.98]
        "
      >
        <ShoppingCart size={14} />
        Browse Market
      </button>

    </div>
  );
}


// =========================================================
// MAIN
// =========================================================

export default function ShambaOrdersDashboard({
  onNavigate,
  embedded = false,
}) {
  const { user } = useAuth();

  const [
    mode,
    setMode,
  ] = useState("buying");

  const [
    status,
    setStatus,
  ] = useState("all");


  /*
   * Placeholder data structure only.
   *
   * We intentionally keep this empty because the
   * current backend contract does not yet expose
   * Shamba orders.
   */
  const orders = [];


  const filteredOrders =
    useMemo(() => {
      return orders.filter(
        (order) => {
          const matchesStatus =
            status === "all" ||
            String(
              order?.status ||
                "pending",
            ).toLowerCase() ===
              status;

          return matchesStatus;
        },
      );
    }, [
      orders,
      status,
    ]);


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <ShambaDashboardFrame
      embedded={embedded}
      title="Orders"
      subtitle="Track your Shamba purchases and sales."
      activeHub="shamba"
      user={user}
      onNavigate={onNavigate}
    >
      <div
        className="
          mx-auto
          w-full
          max-w-none
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
              text-[13px]
              font-black
              text-slate-500
              transition
              hover:text-[#087F5B]
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
              bg-[#087F5B]
              px-4
              py-2.5
              text-[13px]
              font-black
              text-white
              shadow-sm
              transition
              hover:bg-[#075E46]
            "
          >
            <ShoppingCart size={14} />
            Browse Market
          </button>

        </div>


        {/* ==================================================
            INTRO
        ================================================== */}

        <section
          className="
            mb-5
            overflow-hidden
            rounded-2xl
            bg-gradient-to-br
            from-emerald-600
            via-emerald-500
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
                  text-[13px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-white/70
                "
              >
                Shamba Orders
              </div>

              <h1
                className="mt-1 font-black tracking-tight text-[clamp(26px,2.3vw,30px)] leading-tight tracking-tight text-[#172B25]"
              >
                Keep every farm transaction
                organized.
              </h1>

              <p
                className="
                  mt-1
                  max-w-xl
                  text-[13px]
                  leading-5
                  text-white/80
                "
              >
                Follow purchases, customer orders,
                delivery and payment status from
                one place.
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
              <WalletCards size={21} />
            </div>

          </div>

        </section>


        {/* ==================================================
            BUY / SELL TOGGLE
        ================================================== */}

        <section
          className="
            mb-4
            rounded-2xl
            border
            border-[#DCE5E1]
            bg-white
            p-1.5
            shadow-[0_4px_18px_rgba(15,23,42,0.035)]
          "
        >

          <div
            className="
              grid
              grid-cols-2
              gap-1.5
            "
          >

            <button
              type="button"
              onClick={() =>
                setMode("buying")
              }
              className={`
                rounded-xl
                px-4
                py-3
                text-[13px]
                font-black
                transition
                ${
                  mode === "buying"
                    ? "bg-[#087F5B] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50"
                }
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <ShoppingCart size={14} />
                My Purchases
              </div>
            </button>


            <button
              type="button"
              onClick={() =>
                setMode("selling")
              }
              className={`
                rounded-xl
                px-4
                py-3
                text-[13px]
                font-black
                transition
                ${
                  mode === "selling"
                    ? "bg-[#087F5B] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50"
                }
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <Package size={14} />
                My Sales
              </div>
            </button>

          </div>

        </section>


        {/* ==================================================
            STATUS FILTERS
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

            <CheckCircle2
              size={13}
              className="text-slate-400"
            />

            <span
              className="
                text-[13px]
                font-black
                uppercase
                tracking-wide
                text-slate-500
              "
            >
              Order Status
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

            {ORDER_STATUS.map(
              (item) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() =>
                    setStatus(
                      item.key,
                    )
                  }
                  className={`
                    shrink-0
                    rounded-xl
                    px-3
                    py-2
                    text-[13px]
                    font-black
                    transition
                    ${
                      status ===
                      item.key
                        ? "bg-[#087F5B] text-white"
                        : "border border-[#DCE5E1] bg-white text-slate-500 hover:bg-emerald-50 hover:text-[#075E46]"
                    }
                  `}
                >
                  {item.label}
                </button>
              ),
            )}

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
              border-[#DCE5E1]
              bg-white
              p-4
              shadow-[0_4px_18px_rgba(15,23,42,0.035)]
            "
          >
            <div
              className="
                text-[13px]
                font-black
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Total
            </div>

            <div
              className="
                mt-1
                text-xl
                font-black
                text-[#075E46]
              "
            >
              0
            </div>
          </div>


          <div
            className="
              rounded-2xl
              border
              border-[#DCE5E1]
              bg-white
              p-4
              shadow-[0_4px_18px_rgba(15,23,42,0.035)]
            "
          >
            <div
              className="
                text-[13px]
                font-black
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Pending
            </div>

            <div
              className="
                mt-1
                text-xl
                font-black
                text-amber-600
              "
            >
              0
            </div>
          </div>


          <div
            className="
              rounded-2xl
              border
              border-[#DCE5E1]
              bg-white
              p-4
              shadow-[0_4px_18px_rgba(15,23,42,0.035)]
            "
          >
            <div
              className="
                text-[13px]
                font-black
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Completed
            </div>

            <div
              className="
                mt-1
                text-xl
                font-black
                text-blue-600
              "
            >
              0
            </div>
          </div>


          <div
            className="
              rounded-2xl
              border
              border-[#DCE5E1]
              bg-white
              p-4
              shadow-[0_4px_18px_rgba(15,23,42,0.035)]
            "
          >
            <div
              className="
                text-[13px]
                font-black
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Value
            </div>

            <div
              className="
                mt-1
                text-xl
                font-black
                text-slate-700
              "
            >
              KSh 0
            </div>
          </div>

        </section>


        {/* ==================================================
            RESULTS
        ================================================== */}

        <section>

          <div className="mb-3">

            <h2
              className="font-black text-slate-900 text-xl leading-snug tracking-tight text-[#172B25]"
            >
              {mode === "buying"
                ? "My Purchases"
                : "My Sales"}
            </h2>

            <p
              className="
                mt-0.5
                text-[13px]
                text-slate-400
              "
            >
              {status === "all"
                ? "All order activity"
                : `${status} orders`}
            </p>

          </div>


          {filteredOrders.length >
          0 ? (
            <div
              className="
                grid
                grid-cols-1
                gap-3
                md:grid-cols-2
              "
            >
              {filteredOrders.map(
                (order, index) => (
                  <OrderCard
                    key={
                      order?.id ||
                      order?._id ||
                      index
                    }
                    order={order}
                  />
                ),
              )}
            </div>
          ) : (
            <OrdersEmptyState
              mode={mode}
              onNavigate={
                onNavigate
              }
            />
          )}

        </section>


        {/* ==================================================
            BACKEND STATUS
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
            <WalletCards size={14} />
          </div>

          <div>

            <div
              className="
                text-[13px]
                font-black
                text-amber-800
              "
            >
              Order engine pending
            </div>

            <p
              className="
                mt-1
                text-[13px]
                leading-5
                text-amber-700/80
              "
            >
              This screen is ready for real order
              records. The current Shamba backend
              does not yet expose order creation,
              retrieval, payment, or delivery
              endpoints.
            </p>

          </div>

        </div>

      </div>
    </ShambaDashboardFrame>
  );
}
