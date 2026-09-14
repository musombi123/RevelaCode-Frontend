import React from "react";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  BriefcaseBusiness,
} from "lucide-react";

function InfoItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-semibold text-slate-800">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

export default function BusinessProfileSnapshot({
  business = {},
  onNavigate,
}) {
  const location = [
    business?.location,
    business?.county,
  ]
    .filter(Boolean)
    .join(", ");

  const handleProfile = () => {
    if (typeof onNavigate === "function") {
      onNavigate("profile");
      return;
    }

    window.dispatchEvent(
      new CustomEvent("revelacode:navigate", {
        detail: "profile",
      })
    );
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Store size={20} />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              Business Profile
            </h2>

            <p className="text-xs text-slate-500">
              Your business information
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleProfile}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          Edit
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <InfoItem
          icon={Store}
          label="Business name"
          value={business?.name}
        />

        <InfoItem
          icon={BriefcaseBusiness}
          label="Business type"
          value={
            business?.business_type ||
            business?.type
          }
        />

        <InfoItem
          icon={MapPin}
          label="Location"
          value={location}
        />

        <InfoItem
          icon={Phone}
          label="Phone"
          value={business?.phone}
        />

        <InfoItem
          icon={Mail}
          label="Email"
          value={business?.email}
        />

        <InfoItem
          icon={CreditCard}
          label="Currency"
          value={business?.currency || "KES"}
        />
      </div>
    </section>
  );
}
