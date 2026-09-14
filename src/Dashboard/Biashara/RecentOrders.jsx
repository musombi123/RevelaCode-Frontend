import React from "react";
import {
  ShoppingCart,
  ArrowRight,
  User,
} from "lucide-react";

function formatMoney(value, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getAmount(order) {
  return (
    order?.total ??
    order?.amount ??
    order?.total_amount ??
    order?.grand_total ??
    0
  );
}

function getCustomer(order) {
  return (
    order?.customer_name ||
    order?.customer?.name ||
    order?.customer ||
    "Customer"
  );
}

function getReference(order) {
  return (
    order?.reference ||
    order?.order_number ||
    order?.order_ref ||
    order?.number ||
    order?.id ||
    "Order"
  );
}

function getStatus(order) {
  return (
    order?.status ||
    order?.order_status ||
    "pending"
  );
}

function statusClasses(status) {
  const normalized = String(status).toLowerCase();

  if (
    ["completed", "complete", "paid", "delivered"].includes(
      normalized
    )
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    ["cancelled", "canceled", "failed"].includes(
      normalized
    )
  ) {
    return "bg-red-50 text-red-700";
  }

  if (
    ["processing", "confirmed", "shipped"].includes(
      normalized
    )
  ) {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-amber-50 text-amber-700";
}

export default function RecentOrders({
  orders = [],
  currency = "KES",
  onNavigate,
  limit = 5,
}) {
  const handleViewOrders = () => {
    if (typeof onNavigate === "function") {
      onNavigate("orders");
      return;
    }

    window.dispatchEvent(
      new CustomEvent("revelacode:navigate", {
        detail: "orders",
      })
    );
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ShoppingCart size={20} />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              Recent Orders
            </h2>

            <p className="text-xs text-slate-500">
              Latest customer orders
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleViewOrders}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          View all
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-6 text-center">
          <ShoppingCart
            size={24}
            className="mx-auto text-slate-400"
          />

          <p className="mt-2 text-sm font-semibold text-slate-700">
            No orders yet
          </p>

          <p className="mt-1 text-xs text-slate-500">
            New customer orders will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.slice(0, limit).map((order, index) => {
            const status = getStatus(order);

            return (
              <div
                key={order?.id || order?._id || index}
                className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <User size={17} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {getReference(order)}
                    </p>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusClasses(
                        status
                      )}`}
                    >
                      {String(status).replace(/_/g, " ")}
                    </span>
                  </div>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {getCustomer(order)} •{" "}
                    {formatDate(
                      order?.created_at ||
                        order?.createdAt ||
                        order?.date
                    )}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-bold text-slate-900">
                  {formatMoney(getAmount(order), currency)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {orders.length > 0 && (
        <button
          type="button"
          onClick={handleViewOrders}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Manage orders
          <ArrowRight size={16} />
        </button>
      )}
    </section>
  );
}
