import React from "react";
import {
  MapPin,
  RefreshCw,
  Bell,
  Store,
  CheckCircle2,
} from "lucide-react";

export default function BiasharaHeader({
  business,
  loading = false,
  onRefresh,
  onNotifications,
}) {
  const name = business?.name || "My Business";
  const category = business?.category || "Business";
  const location =
    [business?.location, business?.county].filter(Boolean).join(", ") ||
    "Kenya";

  const logo =
    business?.logo_url ||
    business?.logo ||
    "";

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-5 text-white shadow-lg">
      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10" />
      <div className="absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-white/5" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15 ring-1 ring-white/20">
            {logo ? (
              <img
                src={logo}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Store size={26} />
            )}
          </div>

          <div className="min-w-0">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-blue-100">
              Biashara Hub
            </p>

            <h1 className="truncate text-xl font-bold sm:text-2xl">
              {name}
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-blue-100">
              <span>{category}</span>

              <span className="hidden sm:inline">•</span>

              <span className="flex items-center gap-1">
                <MapPin size={13} />
                {location}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onNotifications && (
            <button
              type="button"
              onClick={onNotifications}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
              aria-label="Notifications"
            >
              <Bell size={19} />
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Refresh dashboard"
            >
              <RefreshCw
                size={18}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10 mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 text-xs text-blue-100">
          <CheckCircle2 size={15} />
          <span>
            {business?.status
              ? String(business.status).replace(/_/g, " ")
              : "Business active"}
          </span>
        </div>

        {business?.updated_at && (
          <span className="text-xs text-blue-100">
            Updated recently
          </span>
        )}
      </div>
    </section>
  );
}
