import { useState } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Popover() {
  const [open, setOpen] = useState(false);

  const notifications = [
    { id: 1, title: "System update complete", time: "2m ago" },
    { id: 2, title: "New prophecy insight ready", time: "1h ago" },
    { id: 3, title: "Security scan passed", time: "Today" },
  ];

  return (
    <div className="relative">

      {/* ICON BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-gray-200/60 dark:hover:bg-gray-800/60 transition"
      >
        <Bell size={20} />

        {/* BADGE COUNTER */}
        <span className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center bg-red-500 text-white rounded-full shadow">
          {notifications.length}
        </span>
      </button>

      {/* DROPDOWN */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl z-50"
          >

            <div className="p-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Notifications
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Live system updates
              </p>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition border-b border-gray-100 dark:border-gray-800"
                >
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500">{n.time}</p>
                </div>
              ))}
            </div>

            <div className="p-2 text-center">
              <button className="text-xs text-indigo-600 hover:underline">
                Mark all as read
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}