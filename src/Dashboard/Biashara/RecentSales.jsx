import React from "react";
import {
  Banknote,
  ArrowUpRight,
  Clock,
} from "lucide-react";

function formatMoney(value, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-KE", {
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(date);
}

function getAmount(sale) {
  return (
    sale?.amount ??
    sale?.total ??
    sale?.total_amount ??
    sale?.sales_total ??
    0
  );
}

function getReference(sale) {
  return (
    sale?.reference ||
    sale?.receipt_number ||
    sale?.sale_number ||
    sale?.id ||
    "Sale"
  );
}

export default function RecentSales({
  sales = [],
  currency = "KES",
  limit = 5,
  onNavigate,
}) {
  const handleViewSales = () => {
    if (typeof onNavigate === "function") {
      onNavigate("sales");
      return;
    }

    window.dispatchEvent(
      new CustomEvent("revelacode:navigate", {
        detail: "sales",
      })
    );
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Banknote size={20} />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              Recent Sales
            </h2>

            <p className="text-xs text-slate-500">
              Latest recorded sales
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleViewSales}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          View all
        </button>
      </div>

      {sales.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-6 text-center">
          <Banknote
            size={24}
            className="mx-auto text-slate-400"
          />

          <p className="mt-2 text-sm font-semibold text-slate-700">
            No sales yet
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Your recent sales activity will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sales.slice(0, limit).map((sale, index) => (
            <div
              key={sale?.id || sale?._id || index}
              className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                <ArrowUpRight size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {getReference(sale)}
                </p>

                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <Clock size={12} />
                  {formatTime(
                    sale?.created_at ||
                      sale?.createdAt ||
                      sale?.date ||
                      sale?.timestamp
                  )}
                </p>
              </div>

              <p className="shrink-0 text-sm font-bold text-emerald-600">
                +{formatMoney(getAmount(sale), currency)}
              </p>
            </div>
          ))}
        </div>
      )}

      {sales.length > 0 && (
        <button
          type="button"
          onClick={handleViewSales}
          className="mt-4 flex w-full items-center justify-center rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          View sales
        </button>
      )}
    </section>
  );
}
