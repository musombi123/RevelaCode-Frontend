import React from "react";
import {
  Tags,
  TrendingUp,
  TrendingDown,
  Minus,
  Coins,
} from "lucide-react";

function formatMoney(value, currency = "KES") {
  if (value === undefined || value === null) return "—";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function PriceIntelligence({
  pricing = {},
  currency = "KES",
}) {
  const currentPrice =
    pricing?.current_price ??
    pricing?.price ??
    null;

  const recommendedPrice =
    pricing?.recommended_price ??
    pricing?.suggested_price ??
    null;

  const marketPrice =
    pricing?.market_price ??
    pricing?.average_market_price ??
    null;

  const change =
    pricing?.change_percentage ??
    pricing?.price_change ??
    null;

  const direction = Number(change || 0);

  const DirectionIcon =
    direction > 0
      ? TrendingUp
      : direction < 0
        ? TrendingDown
        : Minus;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
          <Tags size={20} />
        </div>

        <div>
          <h2 className="font-bold text-slate-900">
            Price Intelligence
          </h2>

          <p className="text-xs text-slate-500">
            Make better pricing decisions
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[11px] text-slate-500">
            Current
          </p>

          <p className="mt-1 text-sm font-bold text-slate-900">
            {formatMoney(currentPrice, currency)}
          </p>
        </div>

        <div className="rounded-2xl bg-purple-50 p-3">
          <p className="text-[11px] text-purple-600">
            Suggested
          </p>

          <p className="mt-1 text-sm font-bold text-purple-900">
            {formatMoney(
              recommendedPrice,
              currency
            )}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[11px] text-slate-500">
            Market
          </p>

          <p className="mt-1 text-sm font-bold text-slate-900">
            {formatMoney(marketPrice, currency)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Coins size={18} />
        </div>

        <div className="flex-1">
          <p className="text-xs text-slate-500">
            Market price movement
          </p>

          <div className="mt-1 flex items-center gap-2">
            <DirectionIcon
              size={16}
              className={
                direction > 0
                  ? "text-emerald-600"
                  : direction < 0
                    ? "text-red-600"
                    : "text-slate-500"
              }
            />

            <p className="text-sm font-bold text-slate-900">
              {change !== null
                ? `${direction > 0 ? "+" : ""}${change}%`
                : "No movement data"}
            </p>
          </div>
        </div>
      </div>

      {pricing?.recommendation && (
        <p className="mt-4 text-sm leading-6 text-slate-600">
          {pricing.recommendation}
        </p>
      )}
    </section>
  );
}
