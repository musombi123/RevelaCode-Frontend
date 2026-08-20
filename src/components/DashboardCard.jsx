import React from "react";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

export default function DashboardCard({
  title,
  description,
  Icon,
  color,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full min-h-[150px] flex-col justify-between",
        "rounded-2xl border border-slate-200 bg-white p-5 text-left",
        "shadow-sm transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg",
        "active:translate-y-0",
        "focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
        "dark:border-slate-800 dark:bg-slate-900",
        "dark:hover:border-slate-700 dark:hover:bg-slate-900/95",
        "dark:focus:ring-slate-600 dark:focus:ring-offset-slate-950"
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        {/* Icon */}
        <div
          className={cn(
            "flex h-11 w-11 flex-shrink-0 items-center justify-center",
            "rounded-xl text-white shadow-sm",
            "transition-transform duration-200",
            "group-hover:scale-105",
            color || "bg-slate-900 dark:bg-white dark:text-slate-900"
          )}
        >
          {Icon ? (
            <Icon
              className="h-5 w-5"
              strokeWidth={1.8}
            />
          ) : null}
        </div>

        {/* Arrow */}
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            "text-slate-300 transition-all duration-200",
            "group-hover:bg-slate-100 group-hover:text-slate-600",
            "dark:text-slate-600 dark:group-hover:bg-slate-800 dark:group-hover:text-slate-300"
          )}
        >
          <ArrowUpRight
            className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            strokeWidth={1.8}
          />
        </div>
      </div>

      {/* Text */}
      <div className="mt-6 min-w-0">
        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
          {title}
        </p>

        {description ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : (
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Open section
          </p>
        )}
      </div>
    </button>
  );
}
