import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Megaphone,
  Package,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

/* =========================================================
   QUICK ACCESS
========================================================= */

const QUICK_ACCESS = [
  {
    key: "products",
    label: "Products",
    icon: Package,
  },
  {
    key: "sales",
    label: "Sales",
    icon: Receipt,
  },
  {
    key: "orders",
    label: "Orders",
    icon: ClipboardList,
  },
  {
    key: "customers",
    label: "Customers",
    icon: Users,
  },
  {
    key: "stock",
    label: "Stock",
    icon: Boxes,
  },
  {
    key: "expenses",
    label: "Expenses",
    icon: WalletCards,
  },
  {
    key: "marketing",
    label: "Marketing",
    icon: Megaphone,
  },
  {
    key: "reports",
    label: "Reports",
    icon: BarChart3,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function firstDefined(...values) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== "",
  );
}

function formatMoney(value) {
  const number = Number(value || 0);

  return `KSh ${number.toLocaleString("en-KE", {
    maximumFractionDigits: 0,
  })}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-KE");
}

function getArray(data, ...keys) {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
}

/* =========================================================
   DASHBOARD
========================================================= */

export default function BiasharaDashboard({
  onNavigate,
}) {
  const {
    getBiasharaDashboard,
  } = useJumuiyaApi();

  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [assistantOpen, setAssistantOpen] =
    useState(false);

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getBiasharaDashboard();

        if (mounted) {
          setDashboard(data);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err?.message ||
              "Failed to load business dashboard.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [getBiasharaDashboard]);

  /* =======================================================
     NORMALIZE API DATA
     
     This allows the UI to work even if your backend
     uses slightly different property names.
  ======================================================= */

  const stats = useMemo(() => {
    const source =
      dashboard?.overview ||
      dashboard?.summary ||
      dashboard?.business ||
      dashboard ||
      {};

    return {
      sales: firstDefined(
        source.total_sales,
        source.totalSales,
        source.sales,
        dashboard?.total_sales,
        dashboard?.totalSales,
        0,
      ),

      orders: firstDefined(
        source.orders,
        source.total_orders,
        source.totalOrders,
        dashboard?.orders,
        dashboard?.total_orders,
        dashboard?.totalOrders,
        0,
      ),

      customers: firstDefined(
        source.customers,
        source.total_customers,
        source.totalCustomers,
        dashboard?.customers,
        dashboard?.total_customers,
        dashboard?.totalCustomers,
        0,
      ),

      profit: firstDefined(
        source.profit,
        source.total_profit,
        source.totalProfit,
        dashboard?.profit,
        dashboard?.total_profit,
        dashboard?.totalProfit,
        0,
      ),
    };
  }, [dashboard]);

  const products = useMemo(
    () =>
      getArray(
        dashboard,
        "top_products",
        "topProducts",
        "products",
      ),
    [dashboard],
  );

  const orders = useMemo(
    () =>
      getArray(
        dashboard,
        "recent_orders",
        "recentOrders",
        "orders",
      ),
    [dashboard],
  );

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const navigate = (key) => {
    if (typeof onNavigate === "function") {
      onNavigate(key);
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 rounded-xl bg-slate-200 dark:bg-white/10" />

        <div className="h-64 rounded-3xl bg-slate-200 dark:bg-white/10" />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-28 rounded-2xl bg-slate-200 dark:bg-white/10"
              />
            ),
          )}
        </div>

        <div className="h-72 rounded-3xl bg-slate-200 dark:bg-white/10" />
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div
        className="
          rounded-3xl
          border
          border-red-200
          bg-red-50
          p-6
          dark:border-red-900/40
          dark:bg-red-950/20
        "
      >
        <div className="flex items-start gap-4">
          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-2xl
              bg-red-100
              text-red-600
              dark:bg-red-900/30
              dark:text-red-300
            "
          >
            !
          </div>

          <div>
            <h3 className="font-bold text-red-900 dark:text-red-200">
              Unable to load Biashara dashboard
            </h3>

            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="
                mt-4
                rounded-xl
                bg-red-600
                px-4
                py-2
                text-sm
                font-bold
                text-white
                transition
                hover:bg-red-700
              "
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="space-y-6">
      {/* ===================================================
          HUB HEADER
      =================================================== */}

      <section>
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-2xl
              bg-blue-50
              text-blue-600
              dark:bg-blue-500/10
              dark:text-blue-400
            "
          >
            <ShoppingCart size={22} />
          </div>

          <div>
            <h2
              className="
                text-xl
                font-black
                tracking-tight
                text-slate-950
                dark:text-white
              "
            >
              Biashara Hub
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage, sell, and grow your business.
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================
          BUSINESS OVERVIEW
      =================================================== */}

      <section
        className="
          relative
          overflow-hidden
          rounded-[28px]
          bg-gradient-to-br
          from-blue-700
          via-blue-600
          to-blue-500
          p-5
          text-white
          shadow-lg
          shadow-blue-500/10
          sm:p-7
        "
      >
        {/* Decorative circles */}

        <div
          className="
            pointer-events-none
            absolute
            -right-16
            -top-20
            h-56
            w-56
            rounded-full
            bg-white/10
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-24
            right-20
            h-48
            w-48
            rounded-full
            bg-white/5
          "
        />

        <div className="relative">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-100">
                Business Overview
              </p>

              <p className="mt-0.5 text-xs text-blue-200">
                Today
              </p>
            </div>

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-2xl
                bg-white/10
              "
            >
              <TrendingUp size={20} />
            </div>
          </div>

          {/* Stats */}

          <div
            className="
              mt-7
              grid
              grid-cols-2
              gap-x-8
              gap-y-6
              sm:grid-cols-4
            "
          >
            <div>
              <p className="text-xs text-blue-200">
                Total Sales
              </p>

              <p className="mt-1 text-xl font-black sm:text-2xl">
                {formatMoney(stats.sales)}
              </p>
            </div>

            <div>
              <p className="text-xs text-blue-200">
                Orders
              </p>

              <p className="mt-1 text-xl font-black sm:text-2xl">
                {formatNumber(stats.orders)}
              </p>
            </div>

            <div>
              <p className="text-xs text-blue-200">
                Customers
              </p>

              <p className="mt-1 text-xl font-black sm:text-2xl">
                {formatNumber(stats.customers)}
              </p>
            </div>

            <div>
              <p className="text-xs text-blue-200">
                Profit
              </p>

              <p className="mt-1 text-xl font-black sm:text-2xl">
                {formatMoney(stats.profit)}
              </p>
            </div>
          </div>

          {/* Report button */}

          <button
            type="button"
            onClick={() =>
              navigate("reports")
            }
            className="
              mt-7
              inline-flex
              items-center
              gap-2
              rounded-2xl
              bg-white/15
              px-4
              py-2.5
              text-sm
              font-bold
              backdrop-blur-sm
              transition
              hover:bg-white/25
            "
          >
            View Reports

            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ===================================================
          QUICK ACCESS
      =================================================== */}

      <section
        className="
          rounded-[28px]
          border
          border-slate-200
          bg-white
          p-5
          shadow-sm
          dark:border-white/10
          dark:bg-slate-900
          sm:p-6
        "
      >
        <div className="mb-5">
          <h3 className="text-base font-black">
            Quick Access
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            Get to your most important business tools.
          </p>
        </div>

        <div
          className="
            grid
            grid-cols-4
            gap-3
            sm:grid-cols-4
            lg:grid-cols-8
          "
        >
          {QUICK_ACCESS.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  navigate(item.key)
                }
                className="
                  group
                  flex
                  min-w-0
                  flex-col
                  items-center
                  gap-2
                  rounded-2xl
                  p-2
                  transition
                  hover:bg-slate-50
                  dark:hover:bg-white/5
                "
              >
                <span
                  className="
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    bg-slate-50
                    text-blue-600
                    transition
                    group-hover:bg-blue-50
                    group-hover:text-blue-700
                    dark:bg-white/5
                    dark:text-blue-400
                    dark:group-hover:bg-blue-500/10
                  "
                >
                  <Icon size={22} />
                </span>

                <span
                  className="
                    text-center
                    text-[11px]
                    font-semibold
                    text-slate-600
                    dark:text-slate-300
                  "
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ===================================================
          TOP PRODUCTS
      =================================================== */}

      <section
        className="
          overflow-hidden
          rounded-[28px]
          border
          border-slate-200
          bg-white
          shadow-sm
          dark:border-white/10
          dark:bg-slate-900
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-slate-100
            px-5
            py-5
            dark:border-white/10
            sm:px-6
          "
        >
          <div>
            <h3 className="text-base font-black">
              Top Products
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Your best performing products.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("products")
            }
            className="
              flex
              items-center
              gap-1
              text-xs
              font-bold
              text-blue-600
              hover:text-blue-700
              dark:text-blue-400
            "
          >
            View all

            <ChevronRight size={15} />
          </button>
        </div>

        {products.length > 0 ? (
          <div>
            {products
              .slice(0, 5)
              .map((product, index) => {
                const name =
                  firstDefined(
                    product.name,
                    product.title,
                    product.product_name,
                    "Product",
                  );

                const price =
                  firstDefined(
                    product.price,
                    product.selling_price,
                    product.amount,
                    0,
                  );

                const sold =
                  firstDefined(
                    product.sold,
                    product.quantity_sold,
                    product.units_sold,
                    product.sales_count,
                    0,
                  );

                return (
                  <div
                    key={
                      product.id ||
                      product._id ||
                      index
                    }
                    className="
                      grid
                      grid-cols-[1fr_auto_auto]
                      items-center
                      gap-4
                      border-b
                      border-slate-100
                      px-5
                      py-4
                      last:border-b-0
                      dark:border-white/10
                      sm:px-6
                    "
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-blue-50
                          text-blue-600
                          dark:bg-blue-500/10
                          dark:text-blue-400
                        "
                      >
                        <ShoppingBag size={17} />
                      </div>

                      <span className="truncate text-sm font-semibold">
                        {name}
                      </span>
                    </div>

                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {formatMoney(price)}
                    </span>

                    <span className="text-xs font-semibold text-slate-400">
                      {formatNumber(sold)} sold
                    </span>
                  </div>
                );
              })}
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title="No products yet"
            description="Add your first products to start tracking performance."
            action="Add Product"
            onClick={() =>
              navigate("products")
            }
          />
        )}
      </section>

      {/* ===================================================
          RECENT ORDERS
      =================================================== */}

      <section
        className="
          overflow-hidden
          rounded-[28px]
          border
          border-slate-200
          bg-white
          shadow-sm
          dark:border-white/10
          dark:bg-slate-900
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-slate-100
            px-5
            py-5
            dark:border-white/10
            sm:px-6
          "
        >
          <div>
            <h3 className="text-base font-black">
              Recent Orders
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Latest customer activity.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("orders")
            }
            className="
              flex
              items-center
              gap-1
              text-xs
              font-bold
              text-blue-600
              hover:text-blue-700
              dark:text-blue-400
            "
          >
            View all

            <ChevronRight size={15} />
          </button>
        </div>

        {orders.length > 0 ? (
          <div>
            {orders
              .slice(0, 5)
              .map((order, index) => {
                const customer =
                  firstDefined(
                    order.customer_name,
                    order.customerName,
                    order.customer,
                    order.name,
                    "Customer",
                  );

                const amount =
                  firstDefined(
                    order.total,
                    order.amount,
                    order.total_amount,
                    order.price,
                    0,
                  );

                const status =
                  firstDefined(
                    order.status,
                    "Pending",
                  );

                const normalizedStatus =
                  String(status).toLowerCase();

                const completed =
                  normalizedStatus ===
                    "completed" ||
                  normalizedStatus ===
                    "complete" ||
                  normalizedStatus ===
                    "paid";

                return (
                  <div
                    key={
                      order.id ||
                      order._id ||
                      index
                    }
                    className="
                      flex
                      items-center
                      gap-4
                      border-b
                      border-slate-100
                      px-5
                      py-4
                      last:border-b-0
                      dark:border-white/10
                      sm:px-6
                    "
                  >
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-slate-50
                        text-slate-500
                        dark:bg-white/5
                        dark:text-slate-300
                      "
                    >
                      <UserRound size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {customer}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Order #{index + 1}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {formatMoney(amount)}
                      </p>

                      <span
                        className={`
                          mt-1
                          inline-flex
                          rounded-full
                          px-2
                          py-1
                          text-[10px]
                          font-bold
                          ${
                            completed
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                          }
                        `}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="No recent orders"
            description="Orders from your customers will appear here."
            action="View Orders"
            onClick={() =>
              navigate("orders")
            }
          />
        )}
      </section>

      {/* ===================================================
          AI ASSISTANT
      =================================================== */}

      {assistantOpen && (
        <div
          className="
            fixed
            bottom-24
            right-4
            z-40
            w-[calc(100vw-2rem)]
            max-w-sm
            overflow-hidden
            rounded-3xl
            border
            border-slate-200
            bg-white
            shadow-2xl
            dark:border-white/10
            dark:bg-slate-900
            sm:right-6
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-slate-100
              px-5
              py-4
              dark:border-white/10
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-2xl
                  bg-emerald-600
                  text-white
                "
              >
                <Bot size={20} />
              </div>

              <div>
                <p className="text-sm font-black">
                  RevelaAI
                </p>

                <p className="text-xs text-slate-400">
                  Business assistant
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setAssistantOpen(false)
              }
              className="
                rounded-xl
                p-2
                text-slate-400
                hover:bg-slate-100
                dark:hover:bg-white/5
              "
            >
              <X size={17} />
            </button>
          </div>

          <div className="p-5">
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              Hi! I can help you understand your
              sales, products, orders, stock, and
              business performance.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("assistant")
              }
              className="
                mt-4
                flex
                w-full
                items-center
                justify-between
                rounded-2xl
                bg-slate-50
                px-4
                py-3
                text-sm
                font-bold
                transition
                hover:bg-slate-100
                dark:bg-white/5
                dark:hover:bg-white/10
              "
            >
              Open RevelaAI

              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Floating assistant */}

      <button
        type="button"
        aria-label="Open RevelaAI"
        onClick={() =>
          setAssistantOpen(
            (current) => !current,
          )
        }
        className="
          fixed
          bottom-5
          right-5
          z-40
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-emerald-600
          text-white
          shadow-xl
          shadow-emerald-600/25
          transition
          hover:scale-105
          hover:bg-emerald-700
          active:scale-95
          sm:bottom-6
          sm:right-6
        "
      >
        {assistantOpen ? (
          <X size={23} />
        ) : (
          <Bot size={23} />
        )}
      </button>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  onClick,
}) {
  return (
    <div className="px-5 py-10 text-center sm:px-6">
      <div
        className="
          mx-auto
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-2xl
          bg-slate-50
          text-slate-400
          dark:bg-white/5
        "
      >
        <Icon size={21} />
      </div>

      <h4 className="mt-3 text-sm font-bold">
        {title}
      </h4>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
        {description}
      </p>

      {action && (
        <button
          type="button"
          onClick={onClick}
          className="
            mt-4
            rounded-xl
            bg-blue-600
            px-4
            py-2
            text-xs
            font-bold
            text-white
            transition
            hover:bg-blue-700
          "
        >
          {action}
        </button>
      )}
    </div>
  );
}
