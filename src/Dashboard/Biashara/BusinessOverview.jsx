import React from "react";
import {
  Banknote,
  ShoppingCart,
  Users,
  TrendingUp,
  Receipt,
} from "lucide-react";

function formatMoney(value, currency = "KES") {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-KE").format(
    Number(value || 0)
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
          <Icon size={18} />
        </div>

        <TrendingUp size={15} className="text-blue-100" />
      </div>

      <p className="text-xs text-blue-100">{label}</p>

      <p className="mt-1 text-xl font-bold">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-[11px] text-blue-100">
          {description}
        </p>
      )}
    </div>
  );
}

export default function BusinessOverview({
  dashboard = {},
  business = {},
}) {
  const metrics = dashboard?.metrics || dashboard?.summary || {};

  const sales =
    metrics.sales_total ??
    metrics.total_sales ??
    dashboard?.today?.sales ??
    0;

  const orders =
    metrics.orders ??
    metrics.total_orders ??
    dashboard?.today?.orders ??
    0;

  const customers =
    metrics.customers ??
    metrics.total_customers ??
    0;

  const profit =
    metrics.net_estimate ??
    metrics.profit ??
    0;

  const expenses =
    metrics.expenses_total ??
    metrics.expenses ??
    0;

  const currency = business?.currency || "KES";

  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-5 text-white shadow-lg">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-blue-100">
            Business Overview
          </p>

          <h2 className="mt-1 text-xl font-bold">
            Your business at a glance
          </h2>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
          <Banknote size={20} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          icon={Banknote}
          label="Total Sales"
          value={formatMoney(sales, currency)}
          description="Recorded sales"
        />

        <Metric
          icon={ShoppingCart}
          label="Orders"
          value={formatNumber(orders)}
          description="Orders recorded"
        />

        <Metric
          icon={Users}
          label="Customers"
          value={formatNumber(customers)}
          description="Known customers"
        />

        <Metric
          icon={TrendingUp}
          label="Net Estimate"
          value={formatMoney(profit, currency)}
          description={
            expenses
              ? `${formatMoney(expenses, currency)} expenses`
              : "After expenses"
          }
        />
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-xs text-blue-100">
        <Receipt size={15} />
        <span>
          Keep your sales and expenses updated for better business insights.
        </span>
      </div>
    </section>
  );
}
