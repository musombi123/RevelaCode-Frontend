import React from "react";
import {
  Brain,
  Sparkles,
  TrendingUp,
  BarChart3,
  Lightbulb,
  BellRing,
} from "lucide-react";

import MarketPrediction from "./MarketPrediction.jsx";
import DemandForecast from "./DemandForecast.jsx";
import PriceIntelligence from "./PriceIntelligence.jsx";
import MarketTrends from "./MarketTrends.jsx";
import ProductOpportunity from "./ProductOpportunity.jsx";
import IntelligenceAlerts from "./IntelligenceAlerts.jsx";

export default function BiasharaIntelligence({
  intelligence = {},
  currency = "KES",
  onNavigate,
}) {
  const predictions =
    intelligence?.predictions ||
    intelligence?.market_predictions ||
    {};

  const demand =
    intelligence?.demand ||
    intelligence?.demand_forecast ||
    {};

  const pricing =
    intelligence?.pricing ||
    intelligence?.price_intelligence ||
    {};

  const trends =
    intelligence?.trends ||
    intelligence?.market_trends ||
    [];

  const opportunities =
    intelligence?.opportunities ||
    intelligence?.product_opportunities ||
    [];

  const alerts =
    intelligence?.alerts ||
    intelligence?.intelligence_alerts ||
    [];

  return (
    <div className="space-y-6">
      {/* Intelligence Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-700 to-purple-800 p-6 text-white shadow-lg">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <Brain size={25} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                    Biashara Intelligence
                  </p>

                  <Sparkles
                    size={14}
                    className="text-yellow-300"
                  />
                </div>

                <h1 className="mt-1 text-2xl font-bold">
                  Make smarter business decisions
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                  Market signals, demand forecasts, pricing insights and
                  product opportunities designed to help your business grow.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white/10 p-4">
              <TrendingUp size={18} />
              <p className="mt-3 text-xs text-blue-100">
                Market Signals
              </p>
              <p className="mt-1 text-lg font-bold">
                {trends.length}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <BarChart3 size={18} />
              <p className="mt-3 text-xs text-blue-100">
                Forecasts
              </p>
              <p className="mt-1 text-lg font-bold">
                {demand?.confidence
                  ? `${Math.round(
                      Number(demand.confidence) * 100
                    )}%`
                  : "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <Lightbulb size={18} />
              <p className="mt-3 text-xs text-blue-100">
                Opportunities
              </p>
              <p className="mt-1 text-lg font-bold">
                {opportunities.length}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <BellRing size={18} />
              <p className="mt-3 text-xs text-blue-100">
                Alerts
              </p>
              <p className="mt-1 text-lg font-bold">
                {alerts.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Market Prediction */}
      <MarketPrediction
        prediction={predictions}
        currency={currency}
      />

      {/* Demand + Price */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DemandForecast
          forecast={demand}
          currency={currency}
        />

        <PriceIntelligence
          pricing={pricing}
          currency={currency}
        />
      </div>

      {/* Trends */}
      <MarketTrends trends={trends} />

      {/* Opportunities */}
      <ProductOpportunity
        opportunities={opportunities}
        currency={currency}
        onNavigate={onNavigate}
      />

      {/* Alerts */}
      <IntelligenceAlerts
        alerts={alerts}
      />
    </div>
  );
}
