import React from "react";
import EventCard from "./EventCard";

export default function EventList({ events }) {
  return (
    <div className="grid gap-4">
      {events.map((event, idx) => (
        <EventCard
          key={idx}
          title={event.title}
          date={event.date}
          tags={event.tags}
          description={event.description}
        />
      ))}
    </div>
  );
}
