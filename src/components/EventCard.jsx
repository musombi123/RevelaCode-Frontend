import React from "react";

export default function EventCard({ title, date, tags, description }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-4 mb-4 transition hover:shadow-lg">
      <h3 className="text-xl font-semibold mb-1">{title}</h3>
      <p className="text-xs text-gray-500 mb-2">{date}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full"
          >
            #{tag}
          </span>
        ))}
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300">{description}</p>
    </div>
  );
}
