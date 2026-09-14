import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Globe2,
} from "lucide-react";

function getTrendDirection(trend) {
  const value = String(
    trend?.direction ||
      trend?.trend ||
      "stable"
  ).toLowerCase();

  if (
    ["up", "rising", "increase", "positive", "bullish"].includes(
      value
    )
  ) {
    return "up";
  }

  if (
    ["down", "falling", "decrease", "negative", "bearish"].includes(
      value
    )
  ) {
    return "down";
  }

  return "stable";
}

export default function MarketTrends({
  trends = [],
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
          <Globe2 size={20} />
        </div>

        <div>
          <h2 className="font-bold text-slate-900">
            Market Trends
          </h2>

          <p className="text-xs text-slate-500">
            Signals that may affect your business
          </p>
        </div>
      </div>

      {trends.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-6 text-center">
          <Globe2
            size={24}
            className="mx-auto text-slate-400"
          />

          <p className="mt-2 text-sm font-semibold text-slate-700">
            No market trends available
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Market signals will appear as intelligence data becomes
            available.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {trends.map((trend, index) => {
            const direction = getTrendDirection(trend);

            const Icon =
              direction === "up"
                ? TrendingUp
                : direction === "down"
                  ? TrendingDown
                  : Minus;

            const iconClass =
              direction === "up"
                ? "bg-emerald-50 text-emerald-600"
                : direction === "down"
                  ? "bg-red-50 text-red-600"
                  : "bg-slate-100 text-slate-600";

            return (
              <div
                key={
                  trend?.id ||
                  trend?._id ||
                  index
                }
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      {trend?.title ||
                        trend?.name ||
                        "Market signal"}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {trend?.description ||
                        trend?.summary ||
                        "Market activity is being monitored."}
                    </p>

                    {trend?.value !== undefined && (
                      <p className="mt-3 text-sm font-bold text-slate-800">
                        {trend.value}
                        {trend?.unit || ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
