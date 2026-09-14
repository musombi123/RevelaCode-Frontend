import React from "react";
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

function getProductName(product) {
  return (
    product?.name ||
    product?.product_name ||
    product?.title ||
    "Unnamed product"
  );
}

function getStock(product) {
  return Number(
    product?.stock ??
      product?.quantity ??
      product?.stock_quantity ??
      0
  );
}

function getThreshold(product) {
  return Number(
    product?.low_stock_threshold ??
      product?.reorder_level ??
      product?.minimum_stock ??
      5
  );
}

export default function StockHealth({
  products = [],
  onNavigate,
}) {
  const lowStock = products.filter(
    (product) => getStock(product) <= getThreshold(product)
  );

  const handleViewStock = () => {
    if (typeof onNavigate === "function") {
      onNavigate("stock");
      return;
    }

    window.dispatchEvent(
      new CustomEvent("revelacode:navigate", {
        detail: "stock",
      })
    );
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Boxes size={20} />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              Stock Health
            </h2>

            <p className="text-xs text-slate-500">
              Inventory that needs attention
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            lowStock.length
              ? "bg-amber-50 text-amber-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {lowStock.length
            ? `${lowStock.length} low`
            : "Healthy"}
        </span>
      </div>

      {lowStock.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4">
          <CheckCircle2
            size={20}
            className="shrink-0 text-emerald-600"
          />

          <div>
            <p className="text-sm font-semibold text-emerald-900">
              Stock looks healthy
            </p>

            <p className="text-xs text-emerald-700">
              No products are currently below their stock threshold.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {lowStock.slice(0, 5).map((product, index) => {
            const stock = getStock(product);
            const threshold = getThreshold(product);

            return (
              <div
                key={product?.id || product?._id || index}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <AlertTriangle size={17} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {getProductName(product)}
                    </p>

                    <p className="text-xs text-slate-500">
                      Reorder level: {threshold}
                    </p>
                  </div>
                </div>

                <span className="ml-3 shrink-0 text-sm font-bold text-amber-700">
                  {stock} left
                </span>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={handleViewStock}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        View inventory
        <ArrowRight size={16} />
      </button>
    </section>
  );
}
