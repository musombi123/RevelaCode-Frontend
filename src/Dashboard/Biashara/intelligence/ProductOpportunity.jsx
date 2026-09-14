import React from "react";
import {
  Lightbulb,
  PackagePlus,
  ArrowRight,
  Sparkles,
} from "lucide-react";

function formatMoney(value, currency = "KES") {
  if (value === undefined || value === null) return "—";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function ProductOpportunity({
  opportunities = [],
  currency = "KES",
  onNavigate,
}) {
  const handleProducts = () => {
    if (typeof onNavigate === "function") {
      onNavigate("products");
      return;
    }

    window.dispatchEvent(
      new CustomEvent("revelacode:navigate", {
        detail: "products",
      })
    );
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Lightbulb size={20} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900">
                Product Opportunities
              </h2>

              <Sparkles
                size={14}
                className="text-amber-500"
              />
            </div>

            <p className="text-xs text-slate-500">
              Products worth considering
            </p>
          </div>
        </div>

        {opportunities.length > 0 && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            {opportunities.length} opportunities
          </span>
        )}
      </div>

      {opportunities.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-6 text-center">
          <PackagePlus
            size={25}
            className="mx-auto text-slate-400"
          />

          <p className="mt-2 text-sm font-semibold text-slate-700">
            No product opportunities yet
          </p>

          <p className="mt-1 text-xs text-slate-500">
            AI will highlight promising products when enough market data
            is available.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {opportunities.map((item, index) => (
            <div
              key={
                item?.id ||
                item?._id ||
                index
              }
              className="rounded-2xl border border-slate-200 p-4 transition hover:border-amber-200 hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <PackagePlus size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    {item?.product_name ||
                      item?.name ||
                      item?.title ||
                      "Product opportunity"}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {item?.reason ||
                      item?.description ||
                      item?.summary ||
                      "Potential demand detected in the market."}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {item?.demand !== undefined && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                        Demand: {item.demand}
                      </span>
                    )}

                    {item?.estimated_margin !== undefined && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        Margin:{" "}
                        {formatMoney(
                          item.estimated_margin,
                          currency
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleProducts}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Explore products
        <ArrowRight size={16} />
      </button>
    </section>
  );
}
