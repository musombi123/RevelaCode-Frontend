import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
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

export default function MarketPrediction({
  prediction = {},
  currency = "KES",
}) {
  const direction =
    prediction?.direction ||
    prediction?.trend ||
    "stable";

  const score =
    prediction?.confidence ??
    prediction?.confidence_score ??
    prediction?.score;

  const expectedChange =
    prediction?.expected_change ??
    prediction?.change_percentage ??
    prediction?.growth;

  const forecast =
    prediction?.forecast ||
    prediction?.summary ||
    prediction?.prediction ||
    "Market conditions are being analyzed.";

  const normalizedDirection = String(
    direction
  ).toLowerCase();

  const isUp = ["up", "rising", "increase", "positive"].includes(
    normalizedDirection
  );

  const isDown = ["down", "falling", "decrease", "negative"].includes(
    normalizedDirection
  );

  const DirectionIcon = isUp
    ? TrendingUp
    : isDown
      ? TrendingDown
      : Minus;

  const directionClass = isUp
    ? "text-emerald-600 bg-emerald-50"
    : isDown
      ? "text-red-600 bg-red-50"
      : "text-slate-600 bg-slate-100";

  const confidence =
    score !== undefined
      ? Number(score) <= 1
        ? Math.round(Number(score) * 100)
        : Math.round(Number(score))
      : null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Target size={21} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900">
                Market Prediction
              </h2>

              <Sparkles
                size={14}
                className="text-indigo-500"
              />
            </div>

            <p className="text-xs text-slate-500">
              AI-powered market outlook
            </p>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${directionClass}`}
        >
          <DirectionIcon size={14} />
          {String(direction).replace(/_/g, " ")}
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-5">
        <p className="text-sm leading-6 text-slate-700">
          {forecast}
        </p>

        {expectedChange !== undefined && (
          <div className="mt-4">
            <p className="text-xs text-slate-500">
              Expected change
            </p>

            <p
              className={`mt-1 text-2xl font-bold ${
                isDown
                  ? "text-red-600"
                  : isUp
                    ? "text-emerald-600"
                    : "text-slate-700"
              }`}
            >
              {Number(expectedChange) > 0 ? "+" : ""}
              {expectedChange}%
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">
            Confidence
          </p>

          <p className="mt-1 text-lg font-bold text-slate-900">
            {confidence !== null
              ? `${confidence}%`
              : "Awaiting data"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">
            Forecast value
          </p>

          <p className="mt-1 text-lg font-bold text-slate-900">
            {prediction?.forecast_value !== undefined
              ? formatMoney(
                  prediction.forecast_value,
                  currency
                )
              : "—"}
          </p>
        </div>
      </div>
    </section>
  );
}
