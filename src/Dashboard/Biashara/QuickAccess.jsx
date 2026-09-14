import React from "react";
import {
  Package,
  ShoppingCart,
  Users,
  Banknote,
  Boxes,
  Receipt,
  BarChart3,
  Megaphone,
} from "lucide-react";

const ACTIONS = [
  {
    key: "products",
    label: "Products",
    description: "Manage products",
    icon: Package,
  },
  {
    key: "orders",
    label: "Orders",
    description: "View orders",
    icon: ShoppingCart,
  },
  {
    key: "customers",
    label: "Customers",
    description: "Manage customers",
    icon: Users,
  },
  {
    key: "sales",
    label: "Sales",
    description: "Track sales",
    icon: Banknote,
  },
  {
    key: "stock",
    label: "Stock",
    description: "Check inventory",
    icon: Boxes,
  },
  {
    key: "expenses",
    label: "Expenses",
    description: "Track expenses",
    icon: Receipt,
  },
  {
    key: "reports",
    label: "Reports",
    description: "Business reports",
    icon: BarChart3,
  },
  {
    key: "marketing",
    label: "Marketing",
    description: "Promote business",
    icon: Megaphone,
  },
];

export default function QuickAccess({
  onNavigate,
  actions = ACTIONS,
}) {
  const handleNavigate = (key) => {
    if (!key) return;

    if (typeof onNavigate === "function") {
      onNavigate(key);
      return;
    }

    window.dispatchEvent(
      new CustomEvent("revelacode:navigate", {
        detail: key,
      })
    );
  };

  return (
    <section>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Quick Access
        </p>

        <h2 className="mt-1 text-lg font-bold text-slate-900">
          Manage your business
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.key}
              type="button"
              onClick={() => handleNavigate(action.key)}
              className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                <Icon size={19} />
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-900">
                {action.label}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {action.description}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
