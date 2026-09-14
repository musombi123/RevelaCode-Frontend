import React from "react";
import {
  Trophy,
  Package,
  TrendingUp,
} from "lucide-react";

function formatMoney(value, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getName(product) {
  return (
    product?.name ||
    product?.product_name ||
    product?.title ||
    "Unnamed product"
  );
}

function getUnits(product) {
  return Number(
    product?.units_sold ??
      product?.quantity_sold ??
      product?.quantity ??
      product?.units ??
      0
  );
}

function getRevenue(product) {
  return Number(
    product?.revenue ??
      product?.sales ??
      product?.total_sales ??
      0
  );
}

export default function TopProducts({
  products = [],
  currency = "KES",
  limit = 5,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Trophy size={20} />
        </div>

        <div>
          <h2 className="font-bold text-slate-900">
            Top Products
          </h2>

          <p className="text-xs text-slate-500">
            Your best-performing products
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-6 text-center">
          <Package
            size={24}
            className="mx-auto text-slate-400"
          />

          <p className="mt-2 text-sm font-semibold text-slate-700">
            No product data yet
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Product performance will appear here as sales are recorded.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.slice(0, limit).map((product, index) => {
            const units = getUnits(product);
            const revenue = getRevenue(product);

            return (
              <div
                key={product?.id || product?._id || index}
                className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-blue-600 shadow-sm">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {getName(product)}
                  </p>

                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span>{units} units</span>
                    <span>•</span>
                    <span>{formatMoney(revenue, currency)}</span>
                  </div>
                </div>

                <TrendingUp
                  size={16}
                  className="shrink-0 text-emerald-500"
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
