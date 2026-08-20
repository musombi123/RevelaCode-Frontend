import React from "react";
import {
  CalendarDays,
  ArrowUpRight,
  Tag,
} from "lucide-react";

export default function EventCard({
  title,
  date,
  tags = [],
  description,
  onClick,
}) {
  const safeTags = Array.isArray(tags)
    ? tags
    : [];

  return (
    <article
      className="
        group
        relative
        flex
        h-full
        flex-col
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-slate-300
        hover:shadow-lg
        dark:border-slate-800
        dark:bg-slate-900
        dark:hover:border-slate-700
      "
    >
      {/* Accent line */}
      <div
        className="
          h-1
          w-full
          bg-emerald-500
          opacity-80
        "
      />

      <div className="flex flex-1 flex-col p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3
              className="
                line-clamp-2
                text-base
                font-bold
                leading-6
                text-slate-900
                dark:text-white
              "
            >
              {title || "Untitled event"}
            </h3>

            {date && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{date}</span>
              </div>
            )}
          </div>

          {onClick && (
            <button
              type="button"
              onClick={onClick}
              className="
                flex
                h-8
                w-8
                flex-shrink-0
                items-center
                justify-center
                rounded-lg
                text-slate-300
                transition
                hover:bg-slate-100
                hover:text-slate-700
                dark:text-slate-600
                dark:hover:bg-slate-800
                dark:hover:text-slate-200
              "
              aria-label={`Open ${title || "event"}`}
            >
              <ArrowUpRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tags */}
        {safeTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {safeTags.map((tag, idx) => (
              <span
                key={`${tag}-${idx}`}
                className="
                  inline-flex
                  items-center
                  rounded-full
                  border
                  border-slate-200
                  bg-slate-50
                  px-2.5
                  py-1
                  text-[10px]
                  font-semibold
                  text-slate-500
                  dark:border-slate-700
                  dark:bg-slate-800
                  dark:text-slate-300
                "
              >
                <Tag className="mr-1 h-3 w-3" />
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <div className="mt-4 flex-1">
          <p
            className="
              line-clamp-4
              text-sm
              leading-6
              text-slate-600
              dark:text-slate-300
            "
          >
            {description ||
              "No description is available for this event."}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Event
            </span>

            {onClick && (
              <button
                type="button"
                onClick={onClick}
                className="
                  inline-flex
                  items-center
                  gap-1
                  text-xs
                  font-semibold
                  text-emerald-600
                  transition
                  hover:text-emerald-700
                  dark:text-emerald-400
                  dark:hover:text-emerald-300
                "
              >
                View details
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
