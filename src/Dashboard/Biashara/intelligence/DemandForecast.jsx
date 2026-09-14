import React from "react";
import {
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  CalendarDays,
} from "lucide-react";

function getDirection(value) {
  const normalized = String(value || "stable").toLowerCase();

  if (
    ["up", "rising", "increase", "high", "positive"].includes(
      normalized
    )
  ) {
    return "up";
  }

  if (
    ["down", "falling", "decrease", "low", "negative"].includes(
      normalized
    )
  ) {
    return "down";
  }

  return "stable";
}

export default function DemandForecast({
  forecast = {},
}) {
  const direction = getDirection(
    forecast?.direction ||
      forecast?.trend
  );

  const demand =
    forecast?.predicted_demand ??
    forecast?.demand ??
    forecast?.forecast ??
    null;

  const period =
    forecast?.period ||
    forecast?.horizon ||
    "Next period";

  const recommendation =
    forecast?.recommendation ||
    forecast?.advice ||
    "Continue monitoring demand before adjusting inventory.";

  const DirectionIcon =
    direction === "up"
      ? ArrowUp
      : direction === "down"
        ? ArrowDown
        : Minus;

  const directionClass =
    direction === "up"
      ? "text-emerald-600 bg-emerald-50"
      : direction === "down"
        ? "text-red-600 bg-red-50"
        : "text-slate-600 bg-slate-100";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <BarChart3 size={20} />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              Demand Forecast
            </h2>

            <p className="text-xs text-slate-500">
              Expected customer demand
            </p>
          </div>
        </div>

        <div
          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${directionClass}`}
        >
          <DirectionIcon size={14} />
          {direction}
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <CalendarDays size={14} />
          {period}
        </div>

        <p className="mt-3 text-3xl font-bold text-slate-900">
          {demand !== null ? demand : "—"}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Predicted demand
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          Recommendation
        </p>

        <p className="mt-2 text-sm leading-6 text-blue-900">
          {recommendation}
        </p>
      </div>
    </section>
  );
}
