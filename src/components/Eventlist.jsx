import React from "react";
import EventCard from "./EventCard";

export default function EventList({
  events = [],
}) {
  if (!Array.isArray(events) || events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <span className="text-lg">📅</span>
        </div>

        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          No events available
        </h3>

        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
          There are currently no events to display. New events
          will appear here when they become available.
        </p>
      </div>
    );
  }

  return (
    <div
      className="
        grid grid-cols-1 gap-4
        sm:gap-5
        lg:grid-cols-2
        xl:grid-cols-3
      "
    >
      {events.map((event, idx) => (
        <EventCard
          key={
            event.id ||
            event._id ||
            `${event.title || "event"}-${event.date || idx}`
          }
          title={event.title}
          date={event.date}
          tags={Array.isArray(event.tags) ? event.tags : []}
          description={event.description}
        />
      ))}
    </div>
  );
}
